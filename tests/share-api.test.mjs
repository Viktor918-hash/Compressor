// round 34: api/share/create.js, info.js, cleanup.js — Supabase і R2
// ніколи не викликаються насправді (fetch підмінено, як у convert-direct.test.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

process.env.SUPABASE_URL = "http://fake.supabase.local";
process.env.SUPABASE_SERVICE_ROLE_KEY = "x";
const R2_ENV = {
  R2_ACCOUNT_ID: "acc123",
  R2_ACCESS_KEY_ID: "AKID",
  R2_SECRET_ACCESS_KEY: "SECRET",
  R2_BUCKET: "cp-shares",
};
Object.assign(process.env, R2_ENV);
process.env.CRON_SECRET = "cron-secret";

const R2_HOST = "acc123.r2.cloudflarestorage.com";
let rpcCalls = [];
let usageLeft = 5;
let r2Objects = []; // ключі, які "лежать" у фейковому R2
let r2Deletes = [];

globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith("http://fake.supabase.local/rest/v1/rpc/increment_conversion_usage")) {
    rpcCalls.push(JSON.parse(opts.body));
    const allowed = usageLeft > 0;
    if (allowed) usageLeft--;
    return new Response(JSON.stringify([{ allowed, remaining: usageLeft }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.startsWith("http://fake.supabase.local/auth/v1/user")) {
    const auth = opts.headers?.Authorization || opts.headers?.authorization || opts.headers?.get?.("Authorization");
    if (String(auth).includes("good-token")) {
      return new Response(JSON.stringify({ id: "u-1", aud: "authenticated", email: "a@b.c" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "bad jwt" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  if (url.startsWith(`https://${R2_HOST}/cp-shares?`)) {
    assert.match(opts.headers.Authorization, /^AWS4-HMAC-SHA256 Credential=AKID\//);
    const prefix = new URL(url).searchParams.get("prefix");
    const body = r2Objects
      .filter((k) => k.startsWith(prefix))
      .map((k) => `<Contents><Key>${k.replace(/&/g, "&amp;")}</Key><Size>1234</Size></Contents>`)
      .join("");
    return new Response(`<ListBucketResult><IsTruncated>false</IsTruncated>${body}</ListBucketResult>`);
  }
  if (url.startsWith(`https://${R2_HOST}/cp-shares/`) && opts.method === "DELETE") {
    const key = decodeURIComponent(new URL(url).pathname.replace("/cp-shares/", ""));
    r2Deletes.push(key);
    r2Objects = r2Objects.filter((k) => k !== key);
    return new Response(null, { status: 204 });
  }
  throw new Error(`unexpected fetch ${url}`);
};

const createH = (await import("../api/share/create.js")).default;
const infoH = (await import("../api/share/info.js")).default;
const cleanupH = (await import("../api/share/cleanup.js")).default;
const { newShareId } = await import("../api/_lib/r2.js");

function mkReq(body, headers = {}, method = "POST", query = {}) {
  const r = Readable.from([]);
  r.method = method;
  r.headers = { ...headers };
  r.socket = { remoteAddress: "9.9.9.9" };
  r.body = body;
  r.query = query;
  return r;
}
function mkRes() {
  return {
    headers: {},
    code: 200,
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.code = c;
      return this;
    },
    json(o) {
      this.body = o;
      return this;
    },
  };
}
async function run(h, body, headers, method, query) {
  const res = mkRes();
  await h(mkReq(body, headers, method, query), res);
  return res;
}
const reset = () => {
  rpcCalls = [];
  usageLeft = 5;
  r2Objects = [];
  r2Deletes = [];
};
const origError = console.error;
console.error = () => {};
process.on("exit", () => {
  console.error = origError;
});

const nowSec = () => Math.floor(Date.now() / 1000);
const PHOTO = { filename: "відпустка.jpg", contentType: "image/jpeg", fileSize: 500000 };

test("create: лише POST", async () => {
  reset();
  const res = await run(createH, {}, {}, "GET");
  assert.equal(res.code, 405);
});

test("create: чужий тип / порожній / завеликий — до списання ліміту", async () => {
  reset();
  assert.equal((await run(createH, { ...PHOTO, contentType: "application/x-msdownload" })).code, 415);
  assert.equal((await run(createH, { ...PHOTO, fileSize: 0 })).code, 400);
  assert.equal((await run(createH, { ...PHOTO, fileSize: 201 * 1024 * 1024 })).code, 413);
  assert.equal(rpcCalls.length, 0);
});

test("create: сховище не налаштоване → 503, ліміт не списано", async () => {
  reset();
  delete process.env.R2_BUCKET;
  const res = await run(createH, PHOTO);
  process.env.R2_BUCKET = R2_ENV.R2_BUCKET;
  assert.equal(res.code, 503);
  assert.equal(res.body.error, "SHARE_UNAVAILABLE");
  assert.equal(rpcCalls.length, 0);
});

test("create: гість → окремий лічильник share:ip:…, ліміт 5, підписаний PUT", async () => {
  reset();
  const res = await run(createH, { ...PHOTO, contentType: "IMAGE/JPEG; charset=x" });
  assert.equal(res.code, 200);
  assert.equal(rpcCalls.length, 1);
  assert.match(rpcCalls[0].p_identifier, /^share:ip:[0-9a-f]{32}$/);
  assert.equal(rpcCalls[0].p_limit, 5);
  assert.equal(res.body.contentType, "image/jpeg");
  assert.match(res.body.id, /^[0-9a-z]{6}[A-Za-z0-9_-]{12}$/);
  const exp = res.body.expiresAt - nowSec();
  assert.ok(exp > 7190 && exp <= 7200, String(exp));
  const u = new URL(res.body.uploadUrl);
  assert.equal(u.host, R2_HOST);
  assert.equal(decodeURIComponent(u.pathname), `/cp-shares/shares/${res.body.id}/відпустка.jpg`);
  assert.equal(u.searchParams.get("X-Amz-SignedHeaders"), "content-length;content-type;host");
  assert.ok(u.searchParams.get("X-Amz-Signature"));
  assert.equal(res.body.remaining, 4);
});

test("create: зареєстрований → share:user:…, ліміт 10", async () => {
  reset();
  const res = await run(createH, PHOTO, { authorization: "Bearer good-token" });
  assert.equal(res.code, 200);
  assert.equal(rpcCalls[0].p_identifier, "share:user:u-1");
  assert.equal(rpcCalls[0].p_limit, 10);
});

test("create: ліміт вичерпано → 429 з isGuest", async () => {
  reset();
  usageLeft = 0;
  const res = await run(createH, PHOTO);
  assert.equal(res.code, 429);
  assert.deepEqual(res.body, { error: "LIMIT_REACHED", isGuest: true, remaining: 0 });
});

test("create: принагідно видаляє прострочені файли інших посилань", async () => {
  reset();
  const dead = newShareId(nowSec() - 10, Buffer.from("deaddeadd"));
  const live = newShareId(nowSec() + 999, Buffer.from("livelivel"));
  r2Objects = [`shares/${dead}/a.jpg`, `shares/${live}/b.jpg`];
  const res = await run(createH, PHOTO);
  assert.equal(res.code, 200);
  assert.deepEqual(r2Deletes, [`shares/${dead}/a.jpg`]);
});

test("info: невалідний id → 404 без звернення до сховища", async () => {
  reset();
  const res = await run(infoH, null, {}, "GET", { id: "../../x" });
  assert.equal(res.code, 404);
});

test("info: дійсне посилання → ім'я, розмір, тип, підписані download і preview", async () => {
  reset();
  const id = newShareId(nowSec() + 3600, Buffer.from("abcdefghi"));
  r2Objects = [`shares/${id}/відпустка.jpg`];
  const res = await run(infoH, null, {}, "GET", { id });
  assert.equal(res.code, 200);
  assert.equal(res.body.filename, "відпустка.jpg");
  assert.equal(res.body.size, 1234);
  assert.equal(res.body.contentType, "image/jpeg");
  const d = new URL(res.body.downloadUrl);
  assert.match(d.searchParams.get("response-content-disposition"), /^attachment; filename\*=UTF-8''%D0%B2/);
  const exp = Number(d.searchParams.get("X-Amz-Expires"));
  assert.ok(exp > 3590 && exp <= 3600, String(exp));
  assert.match(new URL(res.body.previewUrl).searchParams.get("response-content-disposition"), /^inline;/);
});

test("info: документ — без preview", async () => {
  reset();
  const id = newShareId(nowSec() + 3600, Buffer.from("docdocdoc"));
  r2Objects = [`shares/${id}/report.pdf`];
  const res = await run(infoH, null, {}, "GET", { id });
  assert.equal(res.body.contentType, "application/pdf");
  assert.equal(res.body.previewUrl, null);
});

test("info: MP3 і WebM — з прев'ю, MOV — без (round 36)", async () => {
  let n = 0;
  for (const [name, type, preview] of [
    ["пісня.mp3", "audio/mpeg", true],
    ["clip-trimmed.webm", "video/webm", true],
    ["clip-trimmed.mov", "video/quicktime", false],
  ]) {
    reset();
    const id = newShareId(nowSec() + 3600, Buffer.alloc(9, ++n));
    r2Objects = [`shares/${id}/${name}`];
    const res = await run(infoH, null, {}, "GET", { id });
    assert.equal(res.code, 200, name);
    assert.equal(res.body.contentType, type, name);
    assert.equal(Boolean(res.body.previewUrl), preview, name);
  }
});

test("info: прострочене → 410 і файл одразу видаляється", async () => {
  reset();
  const id = newShareId(nowSec() - 1, Buffer.from("oldoldold"));
  r2Objects = [`shares/${id}/x.png`];
  const res = await run(infoH, null, {}, "GET", { id });
  assert.equal(res.code, 410);
  assert.deepEqual(r2Deletes, [`shares/${id}/x.png`]);
});

test("info: файлу немає (вивантаження не завершилось) → 404", async () => {
  reset();
  const id = newShareId(nowSec() + 3600, Buffer.from("nonenonen"));
  const res = await run(infoH, null, {}, "GET", { id });
  assert.equal(res.code, 404);
});

test("cleanup: без правильного CRON_SECRET → 401; з ним — видаляє прострочені", async () => {
  reset();
  assert.equal((await run(cleanupH, null, {}, "GET")).code, 401);
  assert.equal((await run(cleanupH, null, { authorization: "Bearer wrong" }, "GET")).code, 401);
  const dead = newShareId(nowSec() - 10, Buffer.from("deaddeadd"));
  r2Objects = [`shares/${dead}/a.jpg`];
  const res = await run(cleanupH, null, { authorization: "Bearer cron-secret" }, "GET");
  assert.equal(res.code, 200);
  assert.equal(res.body.deleted, 1);
});
