import { checkAndConsumeUsage } from "./usageLimit.js";
import { ConvertError } from "./cloudconvert.js";

export const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB вхід — узгоджено з лімітом тіла запиту Vercel (4.5MB)
// Vercel обмежує і ТІЛО ВІДПОВІДІ (4.5MB → 413 FUNCTION_PAYLOAD_TOO_LARGE).
// Перевіряємо самі, щоб віддати зрозумілий код замість загальної помилки платформи.
export const MAX_RESPONSE_SIZE = 4.4 * 1024 * 1024;

// ── Сигнатури файлів (перевіряємо ДО списання квоти й до платного CloudConvert)
export const isPdf = (b) => b.subarray(0, 1024).indexOf("%PDF-") !== -1;
const isZip = (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04; // PK..
const isOle2 = (b) =>
  b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0; // старий .doc

/** Повертає "docx" | "doc" | null. Імена файлів у ZIP лежать у відкритому вигляді. */
export function detectWordExt(b) {
  if (isZip(b)) return b.includes("word/") ? "docx" : null;
  if (isOle2(b)) return "doc";
  return null;
}

export function detectPdfExt(b) {
  return isPdf(b) ? "pdf" : null;
}

/** Розкодовує X-Filename без винятків і прибирає небезпечні символи. */
export function safeBaseName(rawHeader, fallback) {
  let name = "";
  if (rawHeader) {
    try {
      name = decodeURIComponent(String(rawHeader));
    } catch {
      name = "";
    }
  }
  name = name
    .replace(/[\\/]/g, "_")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\.[^.]*$/, "") // прибираємо розширення — воно визначається за вмістом
    .trim()
    .slice(0, 100);
  return name || fallback;
}

// Vercel парсить req.body автоматично лише для відомих Content-Type
// (json/urlencoded/text). Для довільних бінарних типів req.body НЕ
// гарантовано заповнюється — тому читаємо потік напряму, зупиняючись,
// щойно перевищено ліміт (не буферизуємо гігабайти).
async function readRawBody(req, maxBytes) {
  const declared = Number(req.headers["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ConvertError("FILE_TOO_LARGE", "content-length too large", 413);
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > maxBytes) {
      throw new ConvertError("FILE_TOO_LARGE", "body too large", 413);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

function sendError(res, status, code, extra = {}) {
  res.status(status).json({ error: code, ...extra });
}

/**
 * Спільний обробник для /api/word-to-pdf та /api/pdf-to-word.
 * Порядок важливий: спочатку безкоштовні перевірки (розмір, порожній файл,
 * тип за сигнатурою), і лише потім списання квоти та платна конвертація.
 *
 * Відповіді помилок — JSON { error: "<КОД>" }; текст для користувача
 * підставляє фронтенд (i18n), внутрішні повідомлення клієнту не віддаються.
 */
export function createConvertHandler({
  name,
  detectExt, // (Buffer) => "docx" | "doc" | "pdf" | null
  fallbackBase,
  convert, // (Buffer, filename) => Promise<Buffer>
  contentType,
}) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendError(res, 405, "METHOD_NOT_ALLOWED");
      return;
    }

    try {
      // 1. Тіло запиту + безкоштовні перевірки
      const fileBuffer = await readRawBody(req, MAX_FILE_SIZE);

      if (!fileBuffer.length) {
        sendError(res, 400, "EMPTY_FILE");
        return;
      }

      const ext = detectExt(fileBuffer);
      if (!ext) {
        sendError(res, 415, "INVALID_FILE_TYPE");
        return;
      }

      const filename = `${safeBaseName(req.headers["x-filename"], fallbackBase)}.${ext}`;

      // 2. Ліміт (fail-closed: якщо облік недоступний — не конвертуємо)
      const usage = await checkAndConsumeUsage(req);
      if (usage.unavailable) {
        sendError(res, 503, "SERVICE_UNAVAILABLE");
        return;
      }
      if (!usage.allowed) {
        sendError(res, 429, "LIMIT_REACHED", {
          isGuest: usage.isGuest,
          remaining: 0,
        });
        return;
      }

      // 3. Конвертація через CloudConvert
      const out = await convert(fileBuffer, filename);

      if (out.length > MAX_RESPONSE_SIZE) {
        sendError(res, 413, "RESULT_TOO_LARGE");
        return;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (usage.remaining !== null && usage.remaining !== undefined) {
        res.setHeader("X-Remaining-Conversions", String(usage.remaining));
      }
      res.status(200).send(out);
    } catch (error) {
      console.error(`${name} error:`, error);
      if (error instanceof ConvertError) {
        sendError(res, error.status, error.code);
        return;
      }
      // Внутрішні повідомлення (error.message) клієнту не віддаємо.
      sendError(res, 500, "CONVERSION_FAILED");
    }
  };
}
