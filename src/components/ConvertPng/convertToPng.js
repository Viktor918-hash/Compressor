import {
  abortError,
  codedError,
  decodeImage,
  isHeic,
} from "../../utils/decodeImage.js";

/**
 * Конвертує растрове зображення (JPG, WebP, BMP, GIF, AVIF, HEIC/HEIF) у PNG.
 *
 * - Прозорість зберігається: фон НЕ підкладаємо (на відміну від конвертації в JPG).
 * - EXIF-орієнтація застосовується (див. decodeImage), тож фото з телефона не
 *   «лягає на бік». Самі метадані (EXIF/GPS) у PNG не переносяться.
 * - GIF/анімований WebP: беремо лише перший кадр.
 * - HEIC/HEIF: heic2any (динамічний імпорт) віддає PNG одразу, без проміжного JPEG.
 *
 * Помилки (за error.code): DECODE_FAILED, ENCODE_FAILED. Скасування — AbortError.
 * Тексти для користувача будує сторінка.
 */
export async function convertToPng(file, { signal } = {}) {
  if (signal?.aborted) throw abortError();

  if (isHeic(file)) {
    let blob;
    try {
      const heic2any = (await import("heic2any")).default;
      const result = await heic2any({ blob: file, toType: "image/png" });
      blob = Array.isArray(result) ? result[0] : result;
    } catch {
      throw codedError("DECODE_FAILED");
    }
    if (signal?.aborted) throw abortError();
    if (!blob || blob.type !== "image/png") throw codedError("ENCODE_FAILED");
    return blob;
  }

  const decoded = await decodeImage(file);
  const canvas = document.createElement("canvas");
  try {
    if (signal?.aborted) throw abortError();
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw codedError("ENCODE_FAILED");
    ctx.drawImage(decoded.image, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (signal?.aborted) throw abortError();
    // null — напр. занадто велике полотно для мобільного браузера
    if (!blob || blob.type !== "image/png") throw codedError("ENCODE_FAILED");
    return blob;
  } finally {
    decoded.release();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** photo.jpg → photo.png (розширення завжди замінюється на .png). */
export const getPngOutputName = (originalName) => {
  const dot = originalName.lastIndexOf(".");
  const base = dot !== -1 ? originalName.slice(0, dot) : originalName;
  return `${base}.png`;
};
