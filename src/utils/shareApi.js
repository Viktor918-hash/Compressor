import { getAccessToken } from "../lib/supabaseClient";
import i18n from "../i18n/i18n";
import { userError } from "./userError";

// round 34: тимчасове посилання на оброблений файл (2 години).
// 1. POST /api/share/create — метадані → id + presigned PUT у Cloudflare R2.
// 2. Браузер вантажить файл НАПРЯМУ в R2 (XHR — заради прогресу).
// 3. Посилання /s/<id> (з мовним префіксом поточної сторінки).

const KNOWN = [
  "EMPTY_FILE",
  "FILE_TOO_LARGE",
  "INVALID_FILE_TYPE",
  "SHARE_UNAVAILABLE",
  "SERVICE_UNAVAILABLE",
  "UPLOAD_FAILED",
];

const shareError = (code, extra = {}) =>
  userError(i18n.t(`share.errors.${KNOWN.includes(code) ? code : "SHARE_FAILED"}`), {
    code,
    ...extra,
  });

/** "text/plain;charset=utf-8" → "text/plain" (так само нормалізує сервер) */
export const normalizeType = (t) => String(t || "").split(";")[0].trim().toLowerCase();

/** Мовний префікс посилання — як у сторінки, з якої ним діляться */
export function shareUrl(id, { origin = window.location.origin, pathname = window.location.pathname } = {}) {
  const m = /^\/(en|ru|es)(?:\/|$)/.exec(pathname);
  return `${origin}${m ? `/${m[1]}` : ""}/s/${id}`;
}

function putWithProgress(url, file, contentType, { signal, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // Тип підписаний на сервері — надсилаємо рівно той самий
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(shareError("UPLOAD_FAILED"));
    xhr.onerror = () => reject(shareError("UPLOAD_FAILED"));
    xhr.onabort = () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      reject(err);
    };
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/**
 * @param {Blob} blob — оброблений файл (або ZIP кількох)
 * @param {string} filename
 * @returns {Promise<{ url: string, id: string, expiresAt: number, remaining: number }>}
 */
export async function createShareLink(blob, filename, { signal, onProgress } = {}) {
  const contentType = normalizeType(blob.type) || "application/octet-stream";
  const headers = { "Content-Type": "application/json" };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch("/api/share/create", {
      method: "POST",
      headers,
      body: JSON.stringify({ filename, contentType, fileSize: blob.size }),
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw userError(i18n.t("errors.network"), { code: "NETWORK" });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 429 || data.error === "LIMIT_REACHED") {
      throw userError(
        i18n.t(data.isGuest ? "share.errors.limitGuest" : "share.errors.limitUser"),
        { code: "LIMIT_REACHED", isGuest: !!data.isGuest }
      );
    }
    throw shareError(data.error);
  }

  await putWithProgress(data.uploadUrl, blob, data.contentType, { signal, onProgress });
  return {
    id: data.id,
    url: shareUrl(data.id),
    expiresAt: data.expiresAt,
    remaining: data.remaining,
  };
}

/** GET /api/share/info — для сторінки /s/:id */
export async function fetchShareInfo(id, { signal } = {}) {
  const res = await fetch(`/api/share/info?id=${encodeURIComponent(id)}`, { signal });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { status: "ok", ...data };
  if (res.status === 410) return { status: "expired" };
  if (res.status === 404) return { status: "notFound" };
  return { status: "error" };
}
