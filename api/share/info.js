import {
  getR2Config,
  isValidShareId,
  shareExpiresAt,
  listObjects,
  deleteObject,
  presignGet,
  SHARE_PREFIX,
} from "../_lib/r2.js";

const EXT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  avif: "image/avif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  "3gp": "video/3gpp",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  zip: "application/zip",
};

export const typeFromName = (name) =>
  EXT_TYPES[String(name).split(".").pop().toLowerCase()] || "application/octet-stream";

function sendError(res, status, code) {
  res.status(status).json({ error: code });
}

/**
 * GET /api/share/info?id=… → { filename, size, contentType, expiresAt,
 *   downloadUrl, previewUrl? } | 410 EXPIRED | 404 NOT_FOUND
 * Підписані посилання на сам файл діють рівно до кінця 2 годин — після
 * цього файл недоступний, навіть якщо фізично ще не видалений.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendError(res, 405, "METHOD_NOT_ALLOWED");
    return;
  }
  try {
    const id = String(req.query?.id || "");
    if (!isValidShareId(id)) {
      sendError(res, 404, "NOT_FOUND");
      return;
    }
    const cfg = getR2Config();
    if (!cfg) {
      sendError(res, 503, "SHARE_UNAVAILABLE");
      return;
    }

    const prefix = `${SHARE_PREFIX}${id}/`;
    const expiresAt = shareExpiresAt(id);
    const remainingSec = expiresAt - Math.floor(Date.now() / 1000);

    const { items } = await listObjects(cfg, prefix, { maxKeys: 5 });
    if (remainingSec <= 0) {
      // прострочено — прибираємо одразу, не чекаючи cron
      await Promise.all(items.map(({ key }) => deleteObject(cfg, key).catch(() => {})));
      sendError(res, 410, "EXPIRED");
      return;
    }
    const item = items[0];
    if (!item) {
      sendError(res, 404, "NOT_FOUND");
      return;
    }

    const filename = item.key.slice(prefix.length);
    const contentType = typeFromName(filename);
    const downloadUrl = presignGet(cfg, item.key, { expiresSec: remainingSec, downloadName: filename });
    // прев'ю лише для того, що браузери відтворюють самі
    const previewable =
      contentType.startsWith("image/") ||
      contentType === "video/mp4" ||
      contentType === "video/webm" ||
      contentType === "audio/mpeg";
    const previewUrl = previewable
      ? presignGet(cfg, item.key, { expiresSec: remainingSec, downloadName: filename, inline: true })
      : null;

    res.status(200).json({
      filename,
      size: item.size,
      contentType,
      expiresAt,
      downloadUrl,
      previewUrl,
    });
  } catch (error) {
    console.error("share/info error:", error);
    sendError(res, 500, "SHARE_FAILED");
  }
}
