import { checkAndConsumeShareQuota } from "../_lib/usageLimit.js";
import {
  getR2Config,
  newShareId,
  safeFileName,
  presignPut,
  sweepExpired,
  SHARE_TTL_SEC,
  SHARE_PREFIX,
} from "../_lib/r2.js";

// round 34: тимчасове посилання на ОДИН оброблений файл (2 години).
// Файл вантажиться з браузера напряму в Cloudflare R2 (presigned PUT) —
// через нашу функцію йдуть лише кілобайти метаданих, ліміт тіла Vercel
// (4,5 МБ) не заважає.

// Той самий верхній ліміт, що й для відео (найбільший результат на сайті)
export const SHARE_MAX_FILE_SIZE = 200 * 1024 * 1024;

// Лише типи, які реально видає сайт — не "будь-який файл"
export const SHARE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
  "video/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
];

const SWEEP_BUDGET_MS = 1500;

function sendError(res, status, code, extra = {}) {
  res.status(status).json({ error: code, ...extra });
}

/** "text/plain;charset=utf-8" → "text/plain" */
export const normalizeType = (t) => String(t || "").split(";")[0].trim().toLowerCase();

/**
 * POST /api/share/create — { filename, contentType, fileSize }
 * → { id, uploadUrl, contentType, expiresAt, remaining }
 * Порядок: безкоштовні перевірки → чи налаштоване сховище → ліміт
 * (5 на день для гостя за IP, 10 для зареєстрованого) → підпис.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "METHOD_NOT_ALLOWED");
    return;
  }
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const contentType = normalizeType(body.contentType);
    const fileSize = Number(body.fileSize);

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      sendError(res, 400, "EMPTY_FILE");
      return;
    }
    if (fileSize > SHARE_MAX_FILE_SIZE) {
      sendError(res, 413, "FILE_TOO_LARGE");
      return;
    }
    if (!SHARE_TYPES.includes(contentType)) {
      sendError(res, 415, "INVALID_FILE_TYPE");
      return;
    }

    const cfg = getR2Config();
    if (!cfg) {
      sendError(res, 503, "SHARE_UNAVAILABLE");
      return;
    }

    const usage = await checkAndConsumeShareQuota(req);
    if (usage.unavailable) {
      sendError(res, 503, "SERVICE_UNAVAILABLE");
      return;
    }
    if (!usage.allowed) {
      sendError(res, 429, "LIMIT_REACHED", { isGuest: usage.isGuest, remaining: 0 });
      return;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SHARE_TTL_SEC;
    const id = newShareId(expiresAt);
    const key = `${SHARE_PREFIX}${id}/${safeFileName(body.filename)}`;
    const uploadUrl = presignPut(cfg, key, { contentType, contentLength: fileSize });

    // Принагідне прибирання прострочених файлів (окрім щоденного cron):
    // чим активніше користуються посиланнями, тим швидше зникають старі.
    // Обмежено в часі й ніколи не ламає основну відповідь.
    await Promise.race([
      sweepExpired(cfg, { maxDelete: 50 }).catch((err) =>
        console.error("share sweep failed:", err?.message)
      ),
      new Promise((resolve) => setTimeout(resolve, SWEEP_BUDGET_MS)),
    ]);

    res.status(200).json({ id, uploadUrl, contentType, expiresAt, remaining: usage.remaining });
  } catch (error) {
    console.error("share/create error:", error);
    sendError(res, 500, "SHARE_FAILED");
  }
}
