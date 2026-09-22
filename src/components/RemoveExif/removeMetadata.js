import { abortError, codedError, decodeImage } from "../../utils/decodeImage.js";
import {
  MetaFormatError,
  readFoundFields,
  sniffType,
  stripJpeg,
  stripPng,
  stripWebp,
} from "./metaFormats.js";

const MIME = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const EXT = { jpeg: "jpg", png: "png", webp: "webp" };
// якість при вимушеному перекодуванні JPEG/WebP з втратами
const REENCODE_QUALITY = 0.92;
// порядок, у якому види метаданих перелічуються користувачеві
const KIND_ORDER = ["gps", "exif", "thumbnail", "xmp", "iptc", "comment", "text", "time", "other", "trailing"];

// Що зробила обробка (для підпису під результатом). Ключ — вихідний Blob/File.
const infoByBlob = new WeakMap();
export const metaInfoOf = (blob) => infoByBlob.get(blob);

// exifr (lite, MIT) потрібен лише для показу «що знайдено» — вантажимо на цій
// сторінці й лише коли справді додано файл; на очищення він не впливає.
let exifrPromise;
const loadExifr = () => (exifrPromise ||= import("exifr/dist/lite.esm.mjs"));

async function describe(exifTiff) {
  if (!exifTiff) return {};
  try {
    const exifr = await loadExifr();
    return await readFoundFields(exifTiff, exifr.parse);
  } catch {
    return {};
  }
}

// Чи відкривається результат. Спершу дешевий шлях (зменшене декодування),
// потім повний — щоб не хибити на браузерах без resizeWidth.
async function canDecode(blob) {
  try {
    const bmp = await createImageBitmap(blob, { resizeWidth: 32, resizeQuality: "low" });
    bmp.close?.();
    return true;
  } catch {
    // нижче — повне декодування
  }
  try {
    const d = await decodeImage(blob);
    d.release();
    return true;
  } catch {
    return false;
  }
}

async function reencodeViaCanvas(file, type, { lossless, signal }) {
  const decoded = await decodeImage(file); // орієнтацію з Exif застосовано
  const canvas = document.createElement("canvas");
  try {
    if (signal?.aborted) throw abortError();
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw codedError("ENCODE_FAILED");
    ctx.drawImage(decoded.image, 0, 0);
    const quality = type === "png" ? undefined : lossless ? 1 : REENCODE_QUALITY;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, MIME[type], quality));
    if (signal?.aborted) throw abortError();
    if (!blob) throw codedError("ENCODE_FAILED");
    // браузер не вміє кодувати формат і мовчки віддав PNG — це не те, що просили
    if (blob.type !== MIME[type]) throw codedError("FORMAT_UNSUPPORTED");
    return blob;
  } finally {
    decoded.release();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Прибирає метадані з JPEG/PNG/WebP.
 *
 * За замовчуванням — БЕЗ перекодування: з файлу вирізаються службові блоки,
 * стиснуті дані пікселів лишаються тими самими байтами. Якщо в JPEG був тег
 * повороту, лишається лише він (без нього фото «ляже на бік»).
 * reencode: true — повне перекодування через canvas (прибирає й тег повороту
 * та вбудований профіль кольору; JPEG/WebP при цьому втрачають трохи якості).
 *
 * Помилки (error.code): DECODE_FAILED, ENCODE_FAILED, FORMAT_UNSUPPORTED, ANIMATED.
 * Підсумок для показу — у metaInfoOf(результат).
 */
export async function removeMetadata(file, { signal, reencode = false } = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) throw abortError();

  const type = sniffType(bytes);
  if (!type) throw codedError("DECODE_FAILED");

  let res;
  try {
    res = type === "jpeg" ? stripJpeg(bytes, { keepOrientation: true }) : type === "png" ? stripPng(bytes) : stripWebp(bytes);
  } catch (e) {
    if (e instanceof MetaFormatError) throw codedError("DECODE_FAILED");
    throw e;
  }

  const found = await describe(res.exifTiff);
  if (signal?.aborted) throw abortError();

  const kindSet = new Set(res.removed.map((r) => r.kind));
  if (res.info?.hasGpsIfd || found.gps) kindSet.add("gps");
  if (res.info?.hasThumbnail) kindSet.add("thumbnail");
  const kinds = KIND_ORDER.filter((k) => kindSet.has(k));

  const base = {
    type,
    kinds,
    found,
    originalBytes: file.size,
    animated: Boolean(res.animated),
  };

  const finish = (blob, extra) => {
    infoByBlob.set(blob, { ...base, ...extra, resultBytes: blob.size });
    return blob;
  };

  if (!reencode) {
    if (!res.changed) {
      if (!(await canDecode(file))) throw codedError("DECODE_FAILED");
      return finish(file, { unchanged: true, method: "none" });
    }
    const blob = new Blob([res.data], { type: MIME[type] });
    if (await canDecode(blob)) {
      return finish(blob, {
        unchanged: false,
        method: "lossless",
        keptOrientation: type === "jpeg" && res.orientation > 1,
      });
    }
    // Страховка: якщо оригінал відкривається, а очищений — ні, не віддаємо
    // зіпсований файл, а перекодовуємо (і кажемо про це).
    if (!(await canDecode(file))) throw codedError("DECODE_FAILED");
    if (res.animated) throw codedError("ANIMATED");
    const out = await reencodeViaCanvas(file, type, { lossless: res.lossless, signal });
    return finish(out, { unchanged: false, method: "reencoded", fallback: true, quality: type === "png" ? null : REENCODE_QUALITY });
  }

  // Перекодування за вибором користувача
  if (res.animated) throw codedError("ANIMATED");
  if (!(await canDecode(file))) throw codedError("DECODE_FAILED");
  const out = await reencodeViaCanvas(file, type, { lossless: res.lossless, signal });
  return finish(out, {
    unchanged: false,
    method: "reencoded",
    quality: type === "png" || (type === "webp" && res.lossless) ? null : REENCODE_QUALITY,
  });
}

/** photo.JPG → photo-clean.jpg; файл, повернутий без змін, лишає своє ім'я. */
export const getCleanName = (originalName, blob) => {
  const info = blob && metaInfoOf(blob);
  if (info?.unchanged) return originalName;
  const dot = originalName.lastIndexOf(".");
  const base = dot !== -1 ? originalName.slice(0, dot) : originalName;
  return `${base}-clean.${EXT[info?.type] || "jpg"}`;
};
