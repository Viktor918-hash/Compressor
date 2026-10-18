import { getAccessToken } from "../lib/supabaseClient";
import i18n from "../i18n/i18n";
import { userError } from "./userError";
import { estimateEtaSec } from "../components/PanelFile/uploadHints";

export { userError };

// P0-6 (раунд 20): прямий upload/download у CloudConvert — три кроки
// замість проксіювання файлу через нашу функцію (postFileToConvertApi у
// convertApi.js, яка лишається для старих /api/word-to-pdf.js /
// /api/pdf-to-word.js як запасний шлях):
//   1. POST /api/convert/init — метадані (JSON, кілобайти) → jobId + presigned upload-форма.
//   2. Клієнт вантажить файл НАПРЯМУ на цю форму (не через нашу функцію).
//   3. Опитування /api/convert/status, потім скачування результату
//      напряму з CloudConvert (знову не через нашу функцію).
// Деталі — claude/compressphoto-cloudconvert-direct-upload-spec.md.

const STATUS_POLL_INTERVAL_MS = 1500;
// 5 хв — той самий ліміт обробки однієї задачі, що й у безкоштовному
// плані CloudConvert; довше чекати немає сенсу навіть на платному плані.
const STATUS_POLL_DEADLINE_MS = 5 * 60 * 1000;

const KNOWN_CODES = [
  "EMPTY_FILE",
  "INVALID_FILE_TYPE",
  "FILE_TOO_LARGE",
  "SERVICE_UNAVAILABLE",
  "CONVERSION_TIMEOUT",
  "CONVERSION_FAILED",
  "UPLOAD_FAILED",
];

function errorFromCode(code) {
  const key = KNOWN_CODES.includes(code) ? code : "CONVERSION_FAILED";
  return userError(i18n.t(`errors.server.${key}`), { code: key });
}

export const emptyFileError = () => errorFromCode("EMPTY_FILE");
export const invalidFileTypeError = () => errorFromCode("INVALID_FILE_TYPE");

function isAbort(err) {
  return err?.name === "AbortError";
}

async function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function initJob(payload, { signal, textKeys } = {}) {
  let response;
  try {
    response = await fetch("/api/convert/init", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw userError(i18n.t("errors.network"), { code: "NETWORK" });
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // тіло не JSON (напр. HTML-сторінка помилки платформи) — визначимо за статусом
  }

  if (response.ok) return data;

  if (response.status === 429 || data.error === "LIMIT_REACHED") {
    throw userError(
      data.isGuest ? i18n.t(textKeys.limit) : i18n.t(textKeys.limit2),
      { code: "LIMIT_REACHED", isGuest: !!data.isGuest }
    );
  }
  throw errorFromCode(data.error);
}

/**
 * Прямий upload файлу на presigned-форму CloudConvert через XHR — fetch()
 * не має нативного прогресу запиту, тож тут саме XHR (для прогресу
 * завантаження, який Panel уже вміє показувати через onProgress).
 */
function uploadWithProgress(uploadUrl, uploadParameters, file, { signal, onProgress, textKeys } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const err = new Error("aborted");
      err.name = "AbortError";
      reject(err);
      return;
    }

    const formData = new FormData();
    // Порядок полів важливий для S3-подібного presigned POST: спершу всі
    // текстові поля форми, файл — останнім.
    Object.entries(uploadParameters || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    // round 33: структурований прогрес етапу "upload" — Panel показує
    // "Вивантаження 43% · 86 з 200 МБ · ще ≈ 1 хв" і крокову смужку
    // Вивантаження → Обробка → Готово. На 200 МБ відео це найдовша фаза,
    // і без відсотка/байтів вона виглядала як "зависло".
    const startedAt = Date.now();
    const total = file.size;
    onProgress?.({
      stage: "upload",
      value: 0,
      loaded: 0,
      total,
      etaSec: null,
      text: i18n.t(textKeys.uploading),
    });

    xhr.upload.onprogress = (e) => {
      const sent = e.loaded;
      const size = e.lengthComputable && e.total ? e.total : total;
      onProgress?.({
        stage: "upload",
        value: size ? Math.min(1, sent / size) : null,
        // e.total включає службові поля multipart-форми (кілька КБ) —
        // для "86 з 200 МБ" показуємо байти відносно розміру самого файлу
        loaded: Math.min(total, Math.round(total * (size ? sent / size : 0))),
        total,
        etaSec: estimateEtaSec(sent, size, (Date.now() - startedAt) / 1000),
        text: i18n.t(textKeys.uploading),
      });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(errorFromCode("UPLOAD_FAILED"));
    };
    xhr.onerror = () => reject(errorFromCode("UPLOAD_FAILED"));
    xhr.onabort = () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      reject(err);
    };

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });
}

async function pollStatus(jobId, { signal, onProgress, textKeys } = {}) {
  const deadline = Date.now() + STATUS_POLL_DEADLINE_MS;

  const checkAbort = () => {
    if (!signal?.aborted) return;
    const err = new Error("aborted");
    err.name = "AbortError";
    throw err;
  };

  // Етап "processing": прогресу від CloudConvert немає, тож замість
  // застиглого тексту показуємо лічильник часу, що тікає щосекунди
  // (окремий таймер — опитування йде раз на 1,5 с і давало б стрибки 0:01 → 0:03).
  const startedAt = Date.now();
  const emitProcessing = () =>
    onProgress?.({
      stage: "processing",
      value: null,
      elapsedSec: Math.floor((Date.now() - startedAt) / 1000),
      text: i18n.t(textKeys.processing),
    });
  emitProcessing();
  const ticker = setInterval(emitProcessing, 1000);
  try {
    return await pollLoop();
  } finally {
    clearInterval(ticker);
  }

  async function pollLoop() {
  while (Date.now() < deadline) {
    checkAbort();
    await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS));
    checkAbort();

    let res;
    try {
      res = await fetch(`/api/convert/status?jobId=${encodeURIComponent(jobId)}`, {
        signal,
      });
    } catch (err) {
      if (isAbort(err)) throw err;
      continue; // тимчасовий мережевий збій під час опитування — пробуємо ще раз
    }
    if (!res.ok) continue;

    const data = await res.json().catch(() => ({}));
    if (data.status === "finished" && data.downloadUrl) return data.downloadUrl;
    if (data.status === "error") throw errorFromCode("CONVERSION_FAILED");
    // "waiting"/"processing" — просто чекаємо наступного опитування
  }

  throw errorFromCode("CONVERSION_TIMEOUT");
  }
}

/**
 * Скачування результату з прогресом етапу "download" (якщо сервер віддав
 * Content-Length і браузер підтримує потокове читання тіла), інакше —
 * звичайний blob() з "невизначеним" прогресом.
 */
async function downloadWithProgress(url, { signal, onProgress } = {}) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw userError(i18n.t("errors.network"), { code: "NETWORK" });
  }
  if (!res.ok) throw errorFromCode("CONVERSION_FAILED");

  const total = Number(res.headers.get("content-length")) || 0;
  const type = res.headers.get("content-type") || "";
  onProgress?.({ stage: "download", value: total ? 0 : null, loaded: 0, total });

  if (!total || !res.body?.getReader) return res.blob();

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress?.({
      stage: "download",
      value: Math.min(1, received / total),
      loaded: received,
      total,
    });
  }
  return new Blob(chunks, type ? { type } : undefined);
}

function cancelJobBestEffort(jobId) {
  if (!jobId) return;
  fetch("/api/convert/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
    keepalive: true,
  }).catch(() => {
    // best-effort: відсутність мережі в момент скасування не критична —
    // job на CloudConvert просто завершиться непотрібним
  });
}

// Ключі i18n за замовчуванням — історично wordToPdf.*, бо саме для нього
// writився цей модуль у P0-6; pdfToWord ділить ці самі рядки (один сенс
// "завантаження"/"конвертація", див. translation.json). Інструменти з
// власним текстом (напр. compressVideo) передають свої ключі через
// textKeys, щоб не писало "Конвертація…" там, де насправді «Стиснення…».
const DEFAULT_TEXT_KEYS = {
  uploading: "wordToPdf.uploading",
  processing: "wordToPdf.processing",
  limit: "wordToPdf.limit",
  limit2: "wordToPdf.limit2",
};

/**
 * Конвертує файл через прямий upload/download у CloudConvert.
 * @param {"word-to-pdf"|"pdf-to-word"|"compress-video"} type
 * @param {File} file
 * @param {"docx"|"doc"|"pdf"|"mp4"|"mov"|"avi"|"webm"|"mkv"} declaredExt - визначено клієнтом (fileSignature.js)
 * @param {{signal?: AbortSignal, onProgress?: (p: {value: number|null, text?: string}) => void,
 *   textKeys?: {uploading, processing, limit, limit2}, extraPayload?: object}} options
 *   extraPayload — додаткові поля в тілі /api/convert/init (напр. { resolution: { width, height } } для відео).
 * @returns {Promise<Blob>}
 */
export async function convertViaDirectUpload(
  type,
  file,
  declaredExt,
  { signal, onProgress, textKeys, extraPayload } = {}
) {
  const keys = { ...DEFAULT_TEXT_KEYS, ...textKeys };
  let jobId = null;
  try {
    const init = await initJob(
      { type, filename: file.name, declaredExt, fileSize: file.size, ...extraPayload },
      { signal, textKeys: keys }
    );
    jobId = init.jobId;

    await uploadWithProgress(init.uploadUrl, init.uploadParameters, file, {
      signal,
      onProgress,
      textKeys: keys,
    });

    const downloadUrl = await pollStatus(jobId, { signal, onProgress, textKeys: keys });

    return await downloadWithProgress(downloadUrl, { signal, onProgress });
  } catch (err) {
    if (isAbort(err)) cancelJobBestEffort(jobId);
    throw err;
  }
}
