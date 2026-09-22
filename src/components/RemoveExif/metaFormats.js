// Чисті (без DOM) функції для видалення метаданих із JPEG, PNG та WebP
// БЕЗ перекодування пікселів: вирізаються лише службові блоки/чанки, а дані
// зображення копіюються байт у байт. Тестується в Node (tests/removeExif.test.mjs).

export class MetaFormatError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = "MetaFormatError";
    this.code = code; // "MALFORMED" | "UNSUPPORTED"
  }
}

const ascii = (bytes, offset, str) => {
  if (offset < 0 || offset + str.length > bytes.length) return false;
  for (let i = 0; i < str.length; i++) if (bytes[offset + i] !== str.charCodeAt(i)) return false;
  return true;
};

const concat = (chunks) => {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
};

/** Визначає формат за сигнатурою (а не за розширенням/MIME, які можуть брехати). */
export function sniffType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && ascii(bytes, 1, "PNG") && bytes[0] === 0x89) return "png";
  if (bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) return "webp";
  return null;
}

// ───────────────────────── TIFF (Exif) ─────────────────────────

/**
 * Мінімальний розбір TIFF-блоку Exif — лише те, що потрібно для рішень:
 * орієнтація, чи є GPS-блок, мініатюра, скільки тегів у IFD0.
 * (Показ «що знайдено» робить exifr; очищення від нього НЕ залежить.)
 */
export function tiffInfo(t) {
  if (!t || t.length < 8) return null;
  const le = t[0] === 0x49 && t[1] === 0x49;
  const be = t[0] === 0x4d && t[1] === 0x4d;
  if (!le && !be) return null;
  const dv = new DataView(t.buffer, t.byteOffset, t.byteLength);
  const u16 = (o) => dv.getUint16(o, le);
  const u32 = (o) => dv.getUint32(o, le);
  if (u16(2) !== 42) return null;
  const ifd0 = u32(4);
  if (ifd0 < 8 || ifd0 + 2 > t.length) return null;
  const n = u16(ifd0);
  const end = ifd0 + 2 + n * 12;
  if (end + 4 > t.length) return null;
  let orientation = 1;
  let hasGpsIfd = false;
  let hasExifIfd = false;
  for (let i = 0; i < n; i++) {
    const o = ifd0 + 2 + i * 12;
    const tag = u16(o);
    if (tag === 0x0112 && u16(o + 2) === 3 && u32(o + 4) === 1) orientation = u16(o + 8);
    else if (tag === 0x8825) hasGpsIfd = true;
    else if (tag === 0x8769) hasExifIfd = true;
  }
  if (orientation < 1 || orientation > 8) orientation = 1;
  return {
    orientation,
    ifd0Count: n,
    hasGpsIfd,
    hasExifIfd,
    hasThumbnail: u32(end) !== 0,
    // єдиний тег — це орієнтація: приватних даних немає
    onlyOrientation: n === 1 && orientation !== 1 && !hasGpsIfd && !hasExifIfd && u32(end) === 0,
  };
}

/** APP1 «Exif» лише з тегом Orientation — це не приватні дані, а потрібне для правильного показу. */
export function buildOrientationApp1(orientation) {
  const tiff = [
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // «MM», 42, зміщення IFD0
    0x00, 0x01, // 1 запис
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, // Orientation (SHORT)
    0x00, 0x00, 0x00, 0x00, // наступного IFD немає
  ];
  const body = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff]; // "Exif\0\0"
  const len = body.length + 2;
  return Uint8Array.from([0xff, 0xe1, len >> 8, len & 0xff, ...body]);
}

/** Загортає TIFF-блок у мінімальний JPEG — так exifr (lite) читає його з будь-якого контейнера. */
export function wrapTiffAsJpeg(tiff) {
  if (!tiff || tiff.length === 0 || tiff.length + 8 > 0xffff) return null;
  const len = 2 + 6 + tiff.length;
  return concat([
    Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]),
    tiff,
    Uint8Array.from([0xff, 0xd9]),
  ]);
}

// ───────────────────────── JPEG ─────────────────────────

const M_EOI = 0xd9;
const M_SOS = 0xda;

/**
 * Вирізає метадані з JPEG, не чіпаючи стиснуті дані зображення.
 *
 * Лишається лише те, що потрібно для коректного показу: JFIF (APP0), ICC-профіль
 * (APP2 «ICC_PROFILE»), Adobe (APP14, впливає на кольори) і всі службові
 * маркери кодека (DQT/DHT/SOF/SOS тощо). Видаляється: APP1 (Exif із GPS і
 * мініатюрою, XMP), APP13 (Photoshop/IPTC), коментарі, MPF та інші APPn,
 * а також усе, що йде ПІСЛЯ кінця зображення (EOI).
 *
 * keepOrientation: якщо в Exif була орієнтація ≠ 1, лишаємо APP1 лише з нею
 * (без цього фото «ляже на бік»); сама картинка при цьому не перекодовується.
 *
 * Повертає { data, removed:[{kind, bytes}], exifTiff, info, changed }.
 */
export function stripJpeg(bytes, { keepOrientation = true } = {}) {
  if (sniffType(bytes) !== "jpeg") throw new MetaFormatError("MALFORMED", "not a JPEG");
  const len = bytes.length;
  const kept = [bytes.subarray(0, 2)]; // SOI
  const removed = [];
  let exifTiff = null;
  let pos = 2;
  let ended = false;
  let sawEoi = false;

  while (pos < len && !ended) {
    if (bytes[pos] !== 0xff) throw new MetaFormatError("MALFORMED", "marker expected");
    const start = pos;
    while (pos < len && bytes[pos] === 0xff) pos++; // байти-заповнювачі
    if (pos >= len) break; // файл обірвано на заповнювачах — завершуємо без них
    const marker = bytes[pos++];

    if (marker === M_EOI) {
      kept.push(Uint8Array.of(0xff, M_EOI));
      sawEoi = true;
      break;
    }
    // маркери без довжини
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0xd8) {
      kept.push(bytes.subarray(start, pos));
      continue;
    }
    if (pos + 2 > len) throw new MetaFormatError("MALFORMED", "truncated segment");
    const segLen = (bytes[pos] << 8) | bytes[pos + 1];
    if (segLen < 2 || pos + segLen > len) throw new MetaFormatError("MALFORMED", "bad segment length");
    const payload = bytes.subarray(pos + 2, pos + segLen);
    const segEnd = pos + segLen;
    const segment = bytes.subarray(start, segEnd);
    pos = segEnd;

    let keep = true;
    let kind = null;
    if (marker === 0xe0) keep = ascii(payload, 0, "JFIF\0"); // JFXX (мініатюра) — геть
    else if (marker === 0xe1) {
      keep = false;
      if (ascii(payload, 0, "Exif\0\0")) {
        kind = "exif";
        if (!exifTiff) exifTiff = payload.subarray(6);
      } else if (ascii(payload, 0, "http://ns.adobe.com/xap/1.0/\0") || ascii(payload, 0, "http://ns.adobe.com/xmp/extension/\0")) kind = "xmp";
      else kind = "other";
    } else if (marker === 0xe2) keep = ascii(payload, 0, "ICC_PROFILE\0");
    else if (marker === 0xed) {
      keep = false;
      kind = "iptc";
    } else if (marker === 0xee) keep = ascii(payload, 0, "Adobe");
    else if (marker >= 0xe3 && marker <= 0xef) keep = false; // решта APPn
    else if (marker === 0xfe) {
      keep = false;
      kind = "comment";
    }

    if (keep) kept.push(segment);
    else removed.push({ kind: kind || "other", bytes: segment.length });

    if (marker === M_SOS) {
      // стиснуті дані: до наступного «справжнього» маркера
      let i = pos;
      while (i < len) {
        if (bytes[i] === 0xff) {
          const next = bytes[i + 1];
          if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
            i += 2;
            continue;
          }
          if (next === 0xff) {
            i += 1;
            continue;
          }
          break;
        }
        i++;
      }
      kept.push(bytes.subarray(pos, Math.min(i, len)));
      pos = Math.min(i, len);
      if (pos >= len) ended = true; // обрізаний файл без EOI — віддаємо як є
    }
  }

  if (pos > len) throw new MetaFormatError("MALFORMED", "overrun");
  // усе після EOI (MPF-зображення, «хвости» редакторів) — теж геть
  if (sawEoi && len - pos > 0) removed.push({ kind: "trailing", bytes: len - pos });

  const info = exifTiff ? tiffInfo(exifTiff) : null;
  const orientation = info?.orientation ?? 1;

  // лише орієнтація в Exif — приватного там немає, це вже «чистий» файл
  const exifRemoved = removed.filter((r) => r.kind === "exif");
  let restoreOrientation = null;
  if (keepOrientation && orientation > 1) {
    restoreOrientation = buildOrientationApp1(orientation);
    if (info?.onlyOrientation && exifRemoved.length === 1 && removed.every((r) => r.kind === "exif")) {
      // єдиний блок — це і є «тільки орієнтація»: нічого не змінюємо
      return { data: bytes, removed: [], exifTiff, info, orientation, changed: false };
    }
  }
  if (restoreOrientation) {
    // одразу після SOI (та JFIF, якщо він є)
    const at = kept.length > 1 && kept[1][1] === 0xe0 ? 2 : 1;
    kept.splice(at, 0, restoreOrientation);
  }

  const changed = removed.length > 0;
  return { data: changed ? concat(kept) : bytes, removed, exifTiff, info, orientation, changed };
}

// ───────────────────────── PNG ─────────────────────────

const PNG_SIG_LEN = 8;
const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

/** Вирізає текстові чанки, eXIf та tIME з PNG (у т.ч. APNG); пікселі не чіпаються. */
export function stripPng(bytes) {
  if (sniffType(bytes) !== "png") throw new MetaFormatError("MALFORMED", "not a PNG");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept = [bytes.subarray(0, PNG_SIG_LEN)];
  const removed = [];
  let exifTiff = null;
  let animated = false;
  let pos = PNG_SIG_LEN;
  let sawEnd = false;

  while (pos + 12 <= bytes.length) {
    const size = dv.getUint32(pos);
    const total = 12 + size;
    if (pos + total > bytes.length) throw new MetaFormatError("MALFORMED", "truncated chunk");
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const data = bytes.subarray(pos + 8, pos + 8 + size);
    if (type === "acTL") animated = true;
    if (PNG_DROP.has(type)) {
      let kind = "text";
      if (type === "eXIf") {
        kind = "exif";
        exifTiff = ascii(data, 0, "Exif\0\0") ? data.subarray(6) : data;
      } else if (type === "tIME") kind = "time";
      else if (type === "iTXt" && ascii(data, 0, "XML:com.adobe.xmp\0")) kind = "xmp";
      removed.push({ kind, bytes: total });
    } else {
      kept.push(bytes.subarray(pos, pos + total));
    }
    pos += total;
    if (type === "IEND") {
      sawEnd = true;
      break;
    }
  }
  if (!sawEnd) throw new MetaFormatError("MALFORMED", "IEND missing");
  if (pos < bytes.length) removed.push({ kind: "trailing", bytes: bytes.length - pos });
  const changed = removed.length > 0;
  return { data: changed ? concat(kept) : bytes, removed, exifTiff, animated, changed };
}

// ───────────────────────── WebP ─────────────────────────

/** Вирізає чанки EXIF та XMP з WebP, виправляє прапорці VP8X і розмір RIFF. */
export function stripWebp(bytes) {
  if (sniffType(bytes) !== "webp") throw new MetaFormatError("MALFORMED", "not a WebP");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffEnd = Math.min(bytes.length, dv.getUint32(4, true) + 8);
  const chunks = [];
  const removed = [];
  let exifTiff = null;
  let lossless = false;
  let animated = false;
  let pos = 12;
  while (pos + 8 <= riffEnd) {
    const fourcc = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    const size = dv.getUint32(pos + 4, true);
    const total = 8 + size + (size & 1);
    if (pos + 8 + size > riffEnd) throw new MetaFormatError("MALFORMED", "truncated chunk");
    const raw = bytes.subarray(pos, Math.min(pos + total, riffEnd));
    if (fourcc === "VP8L") lossless = true;
    if (fourcc === "ANIM") animated = true;
    if (fourcc === "EXIF") {
      const payload = bytes.subarray(pos + 8, pos + 8 + size);
      exifTiff = ascii(payload, 0, "Exif\0\0") ? payload.subarray(6) : payload;
      removed.push({ kind: "exif", bytes: total });
    } else if (fourcc === "XMP ") removed.push({ kind: "xmp", bytes: total });
    else chunks.push({ fourcc, raw });
    pos += total;
  }
  if (bytes.length > riffEnd) removed.push({ kind: "trailing", bytes: bytes.length - riffEnd });
  const changed = removed.length > 0;
  if (!changed) return { data: bytes, removed, exifTiff, lossless, animated, changed };

  const parts = chunks.map((c) => {
    let raw = c.raw;
    if (raw.length & 1) raw = concat([raw, Uint8Array.of(0)]); // відсутній байт вирівнювання
    if (c.fourcc !== "VP8X") return raw;
    const copy = Uint8Array.from(raw);
    copy[8] &= ~(0x08 | 0x04); // прибрати прапорці EXIF та XMP
    return copy;
  });
  const body = concat(parts);
  const head = new Uint8Array(12);
  head.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  new DataView(head.buffer).setUint32(4, 4 + body.length, true);
  head.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  return { data: concat([head, body]), removed, exifTiff, lossless, animated, changed };
}

// ───────────────────────── «що знайдено» (через exifr) ─────────────────────────

// рядки з файлу: без керуючих символів (NUL тощо) і не довші за max
const clean = (v, max = 80) => {
  if (typeof v !== "string") return "";
  let out = "";
  for (const ch of v) {
    const c = ch.codePointAt(0);
    out += c < 0x20 || c === 0x7f ? " " : ch;
  }
  return out.trim().slice(0, max);
};
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Дістає з Exif те, що варто показати користувачеві. `parse` — це exifr.parse
 * (передається ззовні, щоб бібліотека вантажилась динамічно лише на цій сторінці).
 * Помилка розбору ніколи не заважає очищенню — просто повертається {}.
 */
export async function readFoundFields(tiff, parse) {
  const wrapped = wrapTiffAsJpeg(tiff);
  if (!wrapped) return {};
  let r;
  try {
    r = await parse(wrapped, {
      tiff: true, ifd0: true, exif: true, gps: true,
      xmp: false, icc: false, iptc: false, jfif: false, ihdr: false, interop: false, makerNote: false,
      translateKeys: true, translateValues: false, reviveValues: false, mergeOutput: true,
    });
  } catch {
    return {};
  }
  if (!r || typeof r !== "object") return {};
  const make = clean(r.Make);
  const model = clean(r.Model);
  const camera = model && make && !model.toLowerCase().startsWith(make.toLowerCase()) ? `${make} ${model}` : model || make;
  const rawDate = clean(r.DateTimeOriginal) || clean(r.CreateDate) || clean(r.DateTime);
  // «2024:05:01 12:34:56» → «2024-05-01 12:34» (без часового пояса, лише те, що записано у файлі)
  const dm = rawDate.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/);
  const lat = num(r.latitude);
  const lon = num(r.longitude);
  const out = {};
  if (camera) out.camera = camera;
  if (dm) out.date = `${dm[1]}-${dm[2]}-${dm[3]} ${dm[4]}:${dm[5]}`;
  if (lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) out.gps = { lat, lon };
  if (clean(r.Software)) out.software = clean(r.Software);
  const author = clean(r.Artist) || clean(r.CameraOwnerName);
  if (author) out.author = author;
  const serial = clean(r.BodySerialNumber) || clean(r.SerialNumber);
  if (serial) out.serial = serial;
  return out;
}
