import { checkAndConsumeUsage } from "../_lib/usageLimit.js";
import {
  ConvertError,
  createDirectUploadJob,
  buildVideoConvertOptions,
} from "../_lib/cloudconvert.js";

// Тепер, коли сервер не бачить байти файлу (клієнт вантажить напряму в
// CloudConvert), це вже не технічний ліміт Vercel-функції (4,5 МБ), а
// свідомий бізнес-параметр — див. claude/compressphoto-cloudconvert-direct-upload-spec.md.
// 50 МБ — консервативний старт для word/pdf, добре вкладається в ліміти
// CloudConvert free-плану (1 ГБ файл / 5 хв обробки), легко підняти пізніше.
// Лишається експортованим заради сумісності (нічого в коді/тестах це вже
// не імпортує, але це публічне ім'я модуля) — кожен інструмент тепер має
// свій ліміт у TOOLS[].maxFileSize, цей лишився як дефолт для word/pdf.
export const MAX_DIRECT_FILE_SIZE = 50 * 1024 * 1024;

// Відео важить значно більше за документи, але free-план CloudConvert
// обробляє одне завдання щонайбільше 5 хв — довше 200 МБ вже ризикує не
// встигнути (і витратить майже весь денний кредит на один файл), тож
// 200 МБ — свідомий бізнес-ліміт, не технічний (CloudConvert-free сам
// дозволяє до 1 ГБ на файл). Деталі —
// claude/compressphoto-video-compressor-spec.md.
const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;

const TOOLS = {
  "word-to-pdf": {
    acceptedExt: ["docx", "doc"],
    outputFormat: "pdf",
    maxFileSize: MAX_DIRECT_FILE_SIZE,
  },
  "pdf-to-word": {
    acceptedExt: ["pdf"],
    outputFormat: "docx",
    maxFileSize: MAX_DIRECT_FILE_SIZE,
  },
  "compress-video": {
    acceptedExt: ["mp4", "mov", "avi", "webm", "mkv"],
    outputFormat: "mp4",
    maxFileSize: MAX_VIDEO_FILE_SIZE,
    isVideo: true,
  },
};

// Розумні межі на width/height, щоб довільний JSON не пішов прямо в
// CloudConvert-запит (і щоб хтось не попросив, скажімо, 50000×50000).
// 7680×4320 — 8K, із запасом понад будь-яке реальне відео з телефону/камери.
const MAX_DIMENSION = 7680;

function isValidDimension(n) {
  return Number.isInteger(n) && n > 0 && n <= MAX_DIMENSION;
}

function sendError(res, status, code, extra = {}) {
  res.status(status).json({ error: code, ...extra });
}

/**
 * POST /api/convert/init — крок 1 прямого upload-у в CloudConvert
 * (P0-6). Тіло запиту — лише JSON-метадані (кілобайти), не сам файл:
 * { type: "word-to-pdf"|"pdf-to-word"|"compress-video", filename, declaredExt, fileSize,
 *   resolution?: { width, height } } — resolution лише для compress-video,
 *   задає цільову роздільність (порахована на клієнті з реальних розмірів
 *   відео, див. CompressVideo/convertCompressVideo.js); якщо не передано — convert-таск
 *   іде без width/height (CloudConvert перекодує в тій же роздільності).
 *
 * declaredExt визначається на клієнті за магічними байтами файлу
 * (src/utils/fileSignature.js) — сервер більше не бачить вміст файлу, щоб
 * перевірити сигнатуру сам, тож це єдина перевірка типу до списання
 * квоти. Фінальний запобіжник — сам CloudConvert, який відмовить
 * конвертувати файл у невірному форматі (побачимо як status: "error").
 *
 * Порядок перевірок — як і в старому createConvertHandler(): безкоштовні
 * перевірки спершу, і лише потім списання квоти.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "METHOD_NOT_ALLOWED");
    return;
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { type, filename, declaredExt, fileSize, resolution } = body;

    const tool = TOOLS[type];
    if (!tool) {
      sendError(res, 400, "INVALID_REQUEST");
      return;
    }

    if (!fileSize || fileSize <= 0) {
      sendError(res, 400, "EMPTY_FILE");
      return;
    }
    if (fileSize > tool.maxFileSize) {
      sendError(res, 413, "FILE_TOO_LARGE");
      return;
    }

    if (!tool.acceptedExt.includes(declaredExt)) {
      sendError(res, 415, "INVALID_FILE_TYPE");
      return;
    }

    // resolution — лише для compress-video, і лише якщо обидва боки задані
    // валідними цілими числами в розумних межах; інакше ігноруємо (жодної
    // помилки — просто конвертуємо без зміни роздільності).
    let videoWidth, videoHeight;
    if (tool.isVideo && resolution && typeof resolution === "object") {
      const { width, height } = resolution;
      if (isValidDimension(width) && isValidDimension(height)) {
        videoWidth = width;
        videoHeight = height;
      }
    }

    // Ліміт (fail-closed: якщо облік недоступний — не конвертуємо)
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

    const { jobId, uploadUrl, uploadParameters } = await createDirectUploadJob({
      inputFormat: declaredExt,
      outputFormat: tool.outputFormat,
      convertOptions: tool.isVideo
        ? buildVideoConvertOptions({ width: videoWidth, height: videoHeight })
        : undefined,
    });

    res.status(200).json({
      jobId,
      uploadUrl,
      uploadParameters,
      remaining: usage.remaining,
      // uploadParameters може містити оригінальне ім'я поля для файлу
      // лише неявно (S3-подібна presigned-форма завжди приймає файл під
      // полем "file") — передаємо filename лише для діагностики в логах,
      // саме завантаження використовує File напряму.
      filename,
    });
  } catch (error) {
    console.error("convert/init error:", error);
    if (error instanceof ConvertError) {
      sendError(res, error.status, error.code);
      return;
    }
    sendError(res, 500, "CONVERSION_FAILED");
  }
}
