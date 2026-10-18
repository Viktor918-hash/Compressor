import { createHash, createHmac, randomBytes } from "node:crypto";

// Cloudflare R2 через S3-сумісний API (round 34: тимчасові посилання на
// файл). Власний мінімальний SigV4 без @aws-sdk — це ~150 рядків замість
// мегабайтів залежностей у серверній функції. Правильність підпису
// перевірено офіційними прикладами AWS у tests/r2.test.mjs.
//
// Змінні середовища (Vercel → Settings → Environment Variables):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
// Без них API відповідає 503 SHARE_UNAVAILABLE (fail-closed).

export const SHARE_TTL_SEC = 2 * 60 * 60; // посилання діє 2 години
export const SHARE_PREFIX = "shares/";

const SERVICE = "s3";

const sha256Hex = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();

/** RFC 3986-кодування, як вимагає SigV4 (encodeURIComponent лишає !'()*) */
export const uriEncode = (str) =>
  encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** Шлях об'єкта: кожен сегмент кодується, "/" лишається */
export const encodePath = (path) => path.split("/").map(uriEncode).join("/");

/** 2013-05-24T00:00:00Z → { amzDate: "20130524T000000Z", dateStamp: "20130524" } */
export function amzDates(date) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function signingKey(secret, dateStamp, region) {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

const canonicalQuery = (params) =>
  Object.keys(params)
    .sort()
    .map((k) => `${uriEncode(k)}=${uriEncode(String(params[k]))}`)
    .join("&");

/**
 * Presigned URL (підпис у query-рядку) — для браузера: PUT вивантаження
 * і GET скачування без ключів на клієнті.
 * headers — заголовки, які ПІДПИСУЮТЬСЯ (host додається сам). Підписаний
 * Content-Length/Content-Type браузер мусить надіслати точно такими —
 * інакше R2 відхилить запит (так обмежуємо розмір і тип файлу).
 */
export function presignUrl({
  method,
  host,
  path,
  region = "auto",
  accessKeyId,
  secretAccessKey,
  expiresSec,
  query = {},
  headers = {},
  now = new Date(),
}) {
  const { amzDate, dateStamp } = amzDates(now);
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const allHeaders = { host, ...headers };
  const headerNames = Object.keys(allHeaders).map((h) => h.toLowerCase()).sort();
  const lowerHeaders = Object.fromEntries(
    Object.entries(allHeaders).map(([k, v]) => [k.toLowerCase(), String(v).trim()])
  );
  const signedHeaders = headerNames.join(";");
  const params = {
    ...query,
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSec),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalRequest = [
    method,
    encodePath(path),
    canonicalQuery(params),
    headerNames.map((h) => `${h}:${lowerHeaders[h]}\n`).join(""),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(secretAccessKey, dateStamp, region))
    .update(stringToSign)
    .digest("hex");
  return `https://${host}${encodePath(path)}?${canonicalQuery(params)}&X-Amz-Signature=${signature}`;
}

/**
 * Заголовок Authorization для серверного запиту (list/delete).
 * Повертає об'єкт заголовків, які треба надіслати.
 */
export function signHeaders({
  method,
  host,
  path,
  region = "auto",
  accessKeyId,
  secretAccessKey,
  query = {},
  headers = {},
  payload = "",
  now = new Date(),
}) {
  const { amzDate, dateStamp } = amzDates(now);
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const payloadHash = sha256Hex(payload);
  const allHeaders = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...headers,
  };
  const lowerHeaders = Object.fromEntries(
    Object.entries(allHeaders).map(([k, v]) => [k.toLowerCase(), String(v).trim()])
  );
  const headerNames = Object.keys(lowerHeaders).sort();
  const signedHeaders = headerNames.join(";");
  const canonicalRequest = [
    method,
    encodePath(path),
    canonicalQuery(query),
    headerNames.map((h) => `${h}:${lowerHeaders[h]}\n`).join(""),
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(secretAccessKey, dateStamp, region))
    .update(stringToSign)
    .digest("hex");
  const out = { ...allHeaders };
  delete out.host; // fetch виставляє його сам
  out.Authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return out;
}

// ── Ідентифікатор посилання ──────────────────────────────────────────
// id = 6 символів base36 з часом закінчення (секунди Unix) + 12 випадкових
// base64url-символів (72 біти). Час видно в самому id, тож для перевірки
// "чи не прострочено" не потрібна база. Підробити його не вийде: змінений
// id вказує на інший ключ, якого в сховищі немає.
const ID_RE = /^[0-9a-z]{6}[A-Za-z0-9_-]{12}$/;

export function newShareId(expiresAtSec, rand = randomBytes(9)) {
  return expiresAtSec.toString(36).padStart(6, "0") + rand.toString("base64url");
}

export const isValidShareId = (id) => typeof id === "string" && ID_RE.test(id);

export const shareExpiresAt = (id) => parseInt(id.slice(0, 6), 36);

/**
 * Безпечне ім'я файлу для ключа об'єкта: без шляхів і керівних символів,
 * не довше 120 символів; Unicode (кирилиця) дозволено.
 */
export function safeFileName(name) {
  const base = String(name || "file")
    .split(/[\\/]/)
    .pop()
    // eslint-disable-next-line no-control-regex -- навмисно прибираємо керівні символи
    .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "_")
    .trim();
  const cleaned = base || "file";
  if (cleaned.length <= 120) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  const ext = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : "";
  return cleaned.slice(0, 120 - ext.length) + ext;
}

// ── Конфігурація й серверні виклики ──────────────────────────────────
export function getR2Config(env = process.env) {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null;
  return {
    host: `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: R2_BUCKET,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  };
}

const objectPath = (cfg, key) => `/${cfg.bucket}/${key}`;

export function presignPut(cfg, key, { contentType, contentLength, expiresSec = 15 * 60 }) {
  return presignUrl({
    method: "PUT",
    host: cfg.host,
    path: objectPath(cfg, key),
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    expiresSec,
    headers: { "content-type": contentType, "content-length": String(contentLength) },
  });
}

export function presignGet(cfg, key, { expiresSec, downloadName, inline = false }) {
  const disposition = `${inline ? "inline" : "attachment"}; filename*=UTF-8''${uriEncode(downloadName)}`;
  return presignUrl({
    method: "GET",
    host: cfg.host,
    path: objectPath(cfg, key),
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    expiresSec,
    query: { "response-content-disposition": disposition },
  });
}

/** Розбір відповіді ListObjectsV2 (XML) без сторонніх парсерів */
export function parseListXml(xml) {
  const items = [];
  const re = /<Contents>([\s\S]*?)<\/Contents>/g;
  let m;
  while ((m = re.exec(xml))) {
    const key = /<Key>([\s\S]*?)<\/Key>/.exec(m[1])?.[1];
    const size = Number(/<Size>(\d+)<\/Size>/.exec(m[1])?.[1] || 0);
    if (key) items.push({ key: decodeXml(key), size });
  }
  const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
  const token = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1];
  return { items, nextToken: truncated && token ? decodeXml(token) : null };
}

const decodeXml = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

export async function listObjects(cfg, prefix, { fetchImpl = fetch, continuationToken, maxKeys = 1000 } = {}) {
  const query = { "list-type": "2", prefix, "max-keys": String(maxKeys) };
  if (continuationToken) query["continuation-token"] = continuationToken;
  const path = `/${cfg.bucket}`;
  const headers = signHeaders({
    method: "GET",
    host: cfg.host,
    path,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    query,
  });
  const res = await fetchImpl(`https://${cfg.host}${encodePath(path)}?${canonicalQuery(query)}`, { headers });
  if (!res.ok) throw new Error(`R2 list ${res.status}`);
  return parseListXml(await res.text());
}

export async function deleteObject(cfg, key, { fetchImpl = fetch } = {}) {
  const path = objectPath(cfg, key);
  const headers = signHeaders({
    method: "DELETE",
    host: cfg.host,
    path,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
  });
  const res = await fetchImpl(`https://${cfg.host}${encodePath(path)}`, { method: "DELETE", headers });
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete ${res.status}`);
}

/**
 * Видаляє всі прострочені посилання. Час закінчення — у самому id
 * (shares/<id>/<ім'я>), тож досить переліку ключів. maxDelete обмежує
 * роботу одного виклику (щоб не з'їсти таймаут функції).
 */
export async function sweepExpired(cfg, { nowSec = Math.floor(Date.now() / 1000), fetchImpl = fetch, maxDelete = 200 } = {}) {
  let token = null;
  let deleted = 0;
  do {
    const { items, nextToken } = await listObjects(cfg, SHARE_PREFIX, { fetchImpl, continuationToken: token });
    for (const { key } of items) {
      const id = key.slice(SHARE_PREFIX.length).split("/")[0];
      const expired = !isValidShareId(id) || shareExpiresAt(id) <= nowSec;
      if (expired) {
        await deleteObject(cfg, key, { fetchImpl });
        deleted += 1;
        if (deleted >= maxDelete) return deleted;
      }
    }
    token = nextToken;
  } while (token);
  return deleted;
}
