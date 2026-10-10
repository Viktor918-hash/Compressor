import { ConvertError, getDirectUploadStatus } from "../_lib/cloudconvert.js";

// CloudConvert job id — UUID. Перевіряємо формат, бо значення йде прямо в
// URL запиту до CloudConvert (api/_lib/cloudconvert.js) — без цього довільний
// рядок у query можна було б підставити туди ж.
const JOB_ID_RE = /^[0-9a-f-]{10,100}$/i;

function sendError(res, status, code, extra = {}) {
  res.status(status).json({ error: code, ...extra });
}

/**
 * GET /api/convert/status?jobId=... — крок 2/3 прямого upload-у (P0-6).
 * Квота тут НЕ перевіряється й не списується — це вже зроблено в
 * /api/convert/init. Повертає { status: "waiting"|"processing"|"finished"|"error", downloadUrl? }.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendError(res, 405, "METHOD_NOT_ALLOWED");
    return;
  }

  const jobId = typeof req.query?.jobId === "string" ? req.query.jobId : "";
  if (!JOB_ID_RE.test(jobId)) {
    sendError(res, 400, "INVALID_REQUEST");
    return;
  }

  try {
    res.setHeader("Cache-Control", "no-store");
    const result = await getDirectUploadStatus(jobId);
    res.status(200).json(result);
  } catch (error) {
    console.error("convert/status error:", error);
    if (error instanceof ConvertError) {
      sendError(res, error.status, error.code);
      return;
    }
    sendError(res, 500, "CONVERSION_FAILED");
  }
}
