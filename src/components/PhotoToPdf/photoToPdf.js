// Фото → PDF: N зображень → один PDF-файл, по сторінці на фото.
// Порядок сторінок = порядок файлів у списку (Panel mode="merge": стрілки
// ↑↓ / перетягування). Малює через pdf-lib, повністю в браузері.
//
// Стратегія кодування (щоб не втрачати якість там, де можна цього уникнути):
//   JPEG, у якого EXIF-орієнтація = 1 (або відсутня) → оригінальні байти
//     вбудовуються як є (pdf-lib embedJpg), без перекодування.
//   PNG (звичайний, без незвичного кодування) → оригінальні байти як є
//     (pdf-lib embedPng), без перекодування.
//   JPEG з поворотом, PNG, який pdf-lib не приймає (рідко — напр. 16-біт),
//   і будь-що інше (WebP, BMP, GIF, AVIF, HEIC/HEIF) → decodeImage (та сама
//   спільна функція, що й в інших інструментах: застосовує EXIF-орієнтацію,
//   розпаковує HEIC) → canvas → JPEG якість 0.92.
import { decodeImage, codedError, abortError } from "../../utils/decodeImage.js";
import { sniffType, stripJpeg } from "../RemoveExif/metaFormats.js";

// pdf-lib (~150 КБ) вантажиться лише коли справді запущено злиття, а не
// разом з рештою сайту — усі сторінки-інструменти зібрані в один спільний
// бандл (SLUG_COMPONENTS у routes.jsx), тож статичний імпорт важкої
// бібліотеки тут заважав би геть усім сторінкам, не лише цій.
const loadPdfLib = () => import("pdf-lib");

const MM_TO_PT = 72 / 25.4;
// 1 CSS-піксель = 1/96 дюйма = 0.75 pt — той самий масштаб, яким браузери
// друкують екранний контент; використовується як «природний» розмір фото.
const PX_TO_PT = 72 / 96;
const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const JPEG_QUALITY = 0.92;

export const PAGE_SIZES = ["a4", "photo"];
export const MARGINS_MM = [0, 10];

/**
 * Чиста геометрія сторінки (без DOM, легко тестується в Node):
 * pxW/pxH — пікселі зображення (уже з урахуванням орієнтації).
 * "photo": сторінка = фото + поля з усіх боків.
 * "a4": книжкова/альбомна A4 (обирається автоматично за співвідношенням
 *   сторін фото), фото вписується в поле друку зі збереженням пропорцій,
 *   по центру.
 */
export function computeLayout(pxW, pxH, { pageSize = "a4", marginMm = 0 } = {}) {
  const marginPt = Math.max(0, marginMm) * MM_TO_PT;
  if (pageSize === "photo") {
    const drawW = pxW * PX_TO_PT;
    const drawH = pxH * PX_TO_PT;
    return {
      pageW: drawW + marginPt * 2,
      pageH: drawH + marginPt * 2,
      drawW,
      drawH,
      x: marginPt,
      y: marginPt,
    };
  }
  const landscape = pxW > pxH;
  const pageW = landscape ? A4_PORTRAIT.height : A4_PORTRAIT.width;
  const pageH = landscape ? A4_PORTRAIT.width : A4_PORTRAIT.height;
  const availW = pageW - marginPt * 2;
  const availH = pageH - marginPt * 2;
  const baseW = pxW * PX_TO_PT;
  const baseH = pxH * PX_TO_PT;
  const scale = Math.min(availW / baseW, availH / baseH);
  const drawW = baseW * scale;
  const drawH = baseH * scale;
  return {
    pageW,
    pageH,
    drawW,
    drawH,
    x: marginPt + (availW - drawW) / 2,
    y: marginPt + (availH - drawH) / 2,
  };
}

/**
 * Чисте рішення (без DOM) — чи можна вбудувати байти JPEG як є:
 * { rawEmbeddable: boolean, orientation }. false — коли є поворот
 * (orientation ≠ 1) або маркери JPEG не розібрались (рідкісний файл,
 * який усе ж може декодуватись у браузері — тоді йде через canvas).
 */
export function classifyJpeg(bytes) {
  try {
    const { orientation } = stripJpeg(bytes, { keepOrientation: true });
    return { rawEmbeddable: (orientation || 1) === 1, orientation: orientation || 1 };
  } catch {
    return { rawEmbeddable: false, orientation: null };
  }
}

const readBytes = async (file) => new Uint8Array(await file.arrayBuffer());

const safeDecode = async (file, signal) => {
  const decoded = await decodeImage(file);
  if (signal?.aborted) {
    decoded.release();
    throw abortError();
  }
  return decoded;
};

/** decodeImage(file) → canvas → JPEG-байти (уже з правильною орієнтацією). */
async function reencodeToJpeg(file, signal) {
  const decoded = await safeDecode(file, signal);
  const { image, width, height } = decoded;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    decoded.release();
    throw codedError("ENCODE_FAILED");
  }
  // JPEG не підтримує прозорість: без білої підкладки браузер компонує
  // прозорі пікселі на чорному тлі (canvas за замовчуванням прозорий) —
  // PNG/WebP/GIF/AVIF з альфа-каналом виходили б із чорним фоном замість
  // білого. Той самий підхід, що й у CompressToSize.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  decoded.release();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob || blob.type !== "image/jpeg") throw codedError("ENCODE_FAILED");
  return { type: "jpeg", bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

/** Готує одне зображення до вбудовування: { type: "jpeg"|"png", bytes, width, height }. */
async function prepareImage(file, signal) {
  const bytes = await readBytes(file);
  if (signal?.aborted) throw abortError();
  let type;
  try {
    type = sniffType(bytes);
  } catch {
    type = null;
  }

  if (type === "jpeg") {
    if (classifyJpeg(bytes).rawEmbeddable) {
      const decoded = await safeDecode(file, signal);
      const { width, height } = decoded;
      decoded.release();
      return { type: "jpeg", bytes, width, height };
    }
    // поворот у EXIF або файл не розібрався — переносимо через canvas
    return reencodeToJpeg(file, signal);
  }

  if (type === "png") {
    try {
      const decoded = await safeDecode(file, signal);
      const { width, height } = decoded;
      decoded.release();
      return { type: "png", bytes, width, height };
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw codedError("DECODE_FAILED");
    }
  }

  // WebP / BMP / GIF / AVIF / HEIC / HEIF / нерозпізнане
  return reencodeToJpeg(file, signal);
}

/** Вбудовує підготовлене зображення; якщо pdf-lib все ж відмовляється
 * (рідкісний PNG) — перекодовує той самий файл через canvas і пробує ще раз. */
async function embedImage(pdfDoc, prepared, file, signal) {
  try {
    return {
      image: prepared.type === "png" ? await pdfDoc.embedPng(prepared.bytes) : await pdfDoc.embedJpg(prepared.bytes),
      dims: prepared,
    };
  } catch {
    const fallback = await reencodeToJpeg(file, signal);
    return { image: await pdfDoc.embedJpg(fallback.bytes), dims: fallback };
  }
}

/**
 * files: File[] (у порядку сторінок) → { blob, name }.
 * options: { pageSize: "a4"|"photo", marginMm: 0|10, signal, onProgress }
 * Помилки одного файлу зупиняють усе злиття (Panel показує їх як
 * merge.error з ім'ям файлу — див. PhotoToPdf/PhotoToPdf.jsx).
 */
export async function mergeImagesToPdf(files, { pageSize = "a4", marginMm = 0, signal, onProgress } = {}) {
  if (!files.length) throw new RangeError("no files");
  const { PDFDocument } = await loadPdfLib();
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) throw abortError();
    onProgress?.({ value: i / files.length, current: i + 1, total: files.length });

    let prepared;
    try {
      prepared = await prepareImage(files[i], signal);
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw Object.assign(err instanceof Error ? err : new Error("DECODE_FAILED"), {
        code: err?.code || "DECODE_FAILED",
        fileName: files[i].name,
      });
    }
    if (signal?.aborted) throw abortError();

    const { image: pdfImage, dims } = await embedImage(pdfDoc, prepared, files[i], signal);
    const { pageW, pageH, drawW, drawH, x, y } = computeLayout(dims.width, dims.height, {
      pageSize,
      marginMm,
    });

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(pdfImage, { x, y, width: drawW, height: drawH });
    onProgress?.({ value: (i + 1) / files.length, current: i + 1, total: files.length });
  }

  if (signal?.aborted) throw abortError();
  const pdfBytes = await pdfDoc.save();
  return { blob: new Blob([pdfBytes], { type: "application/pdf" }), name: "photos.pdf" };
}

/** Сума розмірів файлів у байтах — для попередження про великий альбом. */
export const totalBytes = (files) => files.reduce((sum, f) => sum + f.size, 0);
