import test from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import jpeg from "jpeg-js";
import * as exifr from "exifr/dist/lite.esm.mjs";
import {
  MetaFormatError,
  sniffType,
  tiffInfo,
  stripJpeg,
  stripPng,
  stripWebp,
  buildOrientationApp1,
  readFoundFields,
} from "../src/components/RemoveExif/metaFormats.js";

// ───────── помічники для синтетичних файлів ─────────
const enc = new TextEncoder();
const cat = (...parts) => {
  const arr = parts.map((p) => (typeof p === "string" ? enc.encode(p) : p instanceof Uint8Array ? p : Uint8Array.from(p)));
  const out = new Uint8Array(arr.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arr) (out.set(a, o), (o += a.length));
  return out;
};
const has = (bytes, str) => Buffer.from(bytes).includes(Buffer.from(str));

// TIFF (big-endian) з IFD0, Exif-IFD, GPS-IFD і (за бажанням) IFD1 з «мініатюрою»
function buildTiff({ orientation = 1, make, model, software, artist, date, serial, gps, thumbnail = false, onlyOrientation = false } = {}) {
  const be16 = (n) => [(n >> 8) & 255, n & 255];
  const be32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  // Кожен IFD: записи { tag, type, count, value(bytes 4) або offsetToData }
  const blobs = []; // додаткові дані після IFD-ів
  let dataBase = 0;
  const ifds = [];
  const ascii = (s) => cat(s, [0]);
  const entry = (tag, type, count, valueOrData) => ({ tag, type, count, valueOrData });
  const rational = (n, d = 1) => [...be32(n), ...be32(d)];

  const ifd0 = [];
  if (orientation !== 1 || onlyOrientation) ifd0.push(entry(0x0112, 3, 1, Uint8Array.from([...be16(orientation), 0, 0])));
  if (make) ifd0.push(entry(0x010f, 2, make.length + 1, ascii(make)));
  if (model) ifd0.push(entry(0x0110, 2, model.length + 1, ascii(model)));
  if (software) ifd0.push(entry(0x0131, 2, software.length + 1, ascii(software)));
  if (artist) ifd0.push(entry(0x013b, 2, artist.length + 1, ascii(artist)));
  const exifEntries = [];
  if (date) exifEntries.push(entry(0x9003, 2, 20, ascii(date)));
  if (serial) exifEntries.push(entry(0xa431, 2, serial.length + 1, ascii(serial)));
  const gpsEntries = [];
  if (gps) {
    gpsEntries.push(entry(0x0001, 2, 2, Uint8Array.from([0x4e, 0, 0, 0])));
    gpsEntries.push(entry(0x0002, 5, 3, cat(rational(gps.lat[0]), rational(gps.lat[1]), rational(gps.lat[2] * 100, 100))));
    gpsEntries.push(entry(0x0003, 2, 2, Uint8Array.from([0x45, 0, 0, 0])));
    gpsEntries.push(entry(0x0004, 5, 3, cat(rational(gps.lon[0]), rational(gps.lon[1]), rational(gps.lon[2] * 100, 100))));
  }
  const EXIF_PTR = 0x8769;
  const GPS_PTR = 0x8825;
  if (exifEntries.length) ifd0.push(entry(EXIF_PTR, 4, 1, "EXIF"));
  if (gpsEntries.length) ifd0.push(entry(GPS_PTR, 4, 1, "GPS"));
  ifd0.sort((a, b) => a.tag - b.tag);

  const groups = [{ name: "IFD0", entries: ifd0 }];
  if (exifEntries.length) groups.push({ name: "EXIF", entries: exifEntries.sort((a, b) => a.tag - b.tag) });
  if (gpsEntries.length) groups.push({ name: "GPS", entries: gpsEntries });
  if (thumbnail) groups.push({ name: "IFD1", entries: [entry(0x0201, 4, 1, Uint8Array.from(be32(0))), entry(0x0202, 4, 1, Uint8Array.from(be32(4)))] });

  // розкладка: заголовок(8) + усі IFD, потім дані
  let off = 8;
  const ifdOffsets = {};
  for (const g of groups) {
    ifdOffsets[g.name] = off;
    off += 2 + g.entries.length * 12 + 4;
  }
  dataBase = off;
  let dataOff = dataBase;
  const out = [];
  out.push(0x4d, 0x4d, 0, 42, ...be32(8));
  for (const g of groups) {
    out.push(...be16(g.entries.length));
    for (const e of g.entries) {
      out.push(...be16(e.tag), ...be16(e.type), ...be32(e.count));
      if (e.valueOrData === "EXIF") out.push(...be32(ifdOffsets.EXIF));
      else if (e.valueOrData === "GPS") out.push(...be32(ifdOffsets.GPS));
      else if (e.valueOrData.length <= 4) out.push(...e.valueOrData, ...new Array(4 - e.valueOrData.length).fill(0));
      else {
        out.push(...be32(dataOff));
        blobs.push(e.valueOrData);
        dataOff += e.valueOrData.length + (e.valueOrData.length & 1);
      }
    }
    // «наступний IFD»: у IFD0 — IFD1, якщо є мініатюра
    out.push(...be32(g.name === "IFD0" && thumbnail ? ifdOffsets.IFD1 : 0));
  }
  for (const b of blobs) out.push(...b, ...(b.length & 1 ? [0] : []));
  return Uint8Array.from(out);
}

const seg = (marker, payload) => {
  const len = payload.length + 2;
  return cat([0xff, marker, len >> 8, len & 255], payload);
};
const app1Exif = (tiff) => seg(0xe1, cat("Exif\0\0", tiff));

/** Валідний JPEG (jpeg-js) → розбираємо на SOI + сегменти для вставок. */
function baseJpeg() {
  const w = 24, h = 16;
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i] = (x * 10) & 255; data[i + 1] = (y * 15) & 255; data[i + 2] = (x * y) & 255; data[i + 3] = 255;
    }
  return new Uint8Array(jpeg.encode({ data, width: w, height: h }, 90).data);
}
/** Вставляє додаткові сегменти одразу після SOI (jpeg-js дає SOI, DQT, …). */
const insertAfterSoi = (jpg, ...segments) => cat(jpg.subarray(0, 2), ...segments, jpg.subarray(2));

const SECRET = "SECRET-CAMERA-9000";
const meta = (over = {}) => buildTiff({
  orientation: 1, make: "Apple", model: SECRET, software: "Adobe Photoshop 25.0", artist: "Ivan Petrenko",
  date: "2024:05:01 12:34:56", serial: "SN-123456", gps: { lat: [50, 27, 0.36], lon: [30, 31, 24.84] }, thumbnail: true, ...over,
});
const ICC = seg(0xe2, cat("ICC_PROFILE\0", [1, 1], "FAKE-ICC-DATA"));
const JFIF = seg(0xe0, cat("JFIF\0", [1, 1, 0, 0, 1, 0, 1, 0, 0]));

function dirtyJpeg(over = {}) {
  const base = baseJpeg();
  return cat(
    insertAfterSoi(
      base,
      JFIF,
      app1Exif(meta(over)),
      seg(0xe1, cat("http://ns.adobe.com/xap/1.0/\0", "<x:xmpmeta>SECRET-XMP-CREATOR</x:xmpmeta>")),
      seg(0xe0, cat("JFXX\0", [0x10], "SECRET-THUMB")),
      ICC,
      seg(0xe2, cat("MPF\0", "SECRET-MPF")),
      seg(0xed, cat("Photoshop 3.0\0", "8BIM", "SECRET-IPTC")),
      seg(0xfe, enc.encode("SECRET-COMMENT")),
      seg(0xec, enc.encode("Ducky SECRET-DUCKY")),
    ),
    enc.encode("SECRET-TRAILING-AFTER-EOI"),
  );
}
const decode = (b) => jpeg.decode(Buffer.from(b), { useTArray: true });

// ───────── JPEG ─────────
test("sniffType: за сигнатурою, а не за розширенням", () => {
  assert.equal(sniffType(baseJpeg()), "jpeg");
  assert.equal(sniffType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
  assert.equal(sniffType(cat("RIFF", [0, 0, 0, 0], "WEBP")), "webp");
  assert.equal(sniffType(enc.encode("hello world, not an image")), null);
  assert.equal(sniffType(new Uint8Array(0)), null);
});

test("JPEG: до очищення exifr бачить камеру, дату, GPS, автора; синтетичний файл справді «брудний»", async () => {
  const dirty = dirtyJpeg();
  assert.ok(has(dirty, "Exif") && has(dirty, "SECRET-XMP-CREATOR") && has(dirty, "SECRET-COMMENT"));
  const r = await exifr.parse(dirty, { gps: true, translateValues: false, reviveValues: false, mergeOutput: true });
  assert.equal(r.Make, "Apple");
  assert.equal(r.Model, SECRET);
  assert.ok(Math.abs(r.latitude - 50.4501) < 1e-3 && Math.abs(r.longitude - 30.5236) < 1e-3, JSON.stringify([r.latitude, r.longitude]));
});

test("JPEG: після очищення немає рядка «Exif», GPS-тегів, XMP, IPTC, коментарів, MPF і хвоста; ICC і JFIF лишились; файл декодується", async () => {
  const dirty = dirtyJpeg();
  const res = stripJpeg(dirty, { keepOrientation: false });
  assert.ok(res.changed);
  const out = res.data;
  for (const s of ["Exif", "SECRET-CAMERA-9000", "Adobe Photoshop", "Ivan Petrenko", "SN-123456", "SECRET-XMP-CREATOR", "http://ns.adobe.com", "SECRET-IPTC", "Photoshop 3.0", "SECRET-COMMENT", "SECRET-MPF", "SECRET-THUMB", "SECRET-DUCKY", "SECRET-TRAILING-AFTER-EOI"])
    assert.ok(!has(out, s), `лишився «${s}»`);
  assert.ok(has(out, "ICC_PROFILE") && has(out, "FAKE-ICC-DATA"), "ICC-профіль має лишитись");
  assert.ok(has(out, "JFIF"), "JFIF має лишитись");
  // GPS: exifr більше нічого не знаходить
  const after = await exifr.parse(out, { gps: true, mergeOutput: true });
  assert.ok(!after || (after.latitude === undefined && after.GPSLatitude === undefined && after.Make === undefined), JSON.stringify(after));
  assert.equal((await exifr.gps(out)) ?? undefined, undefined);
  // декодується, і піксель-в-піксель так само, як оригінал
  const a = decode(dirty), b = decode(out);
  assert.equal(b.width, 24); assert.equal(b.height, 16);
  assert.deepEqual(Buffer.from(b.data), Buffer.from(a.data));
  // видалені види
  const kinds = new Set(res.removed.map((r) => r.kind));
  for (const k of ["exif", "xmp", "iptc", "comment", "other", "trailing"]) assert.ok(kinds.has(k), `немає виду ${k}: ${[...kinds]}`);
});

test("JPEG: стиснуті дані (від SOS до EOI) збігаються байт у байт", () => {
  const base = baseJpeg();
  const dirty = insertAfterSoi(base, app1Exif(meta()), seg(0xfe, enc.encode("x")));
  const out = stripJpeg(dirty, { keepOrientation: false }).data;
  const scanOf = (b) => {
    for (let i = 0; i < b.length - 1; i++) if (b[i] === 0xff && b[i + 1] === 0xda) return b.subarray(i);
    return null;
  };
  assert.deepEqual(scanOf(out), scanOf(base));
  assert.deepEqual(out, base); // без метаданих це рівно вихідний файл
});

test("JPEG: орієнтація ≠ 1 зберігається окремим мінімальним Exif (без GPS і решти), пікселі не перекодовуються", async () => {
  const dirty = dirtyJpeg({ orientation: 6 });
  const res = stripJpeg(dirty); // keepOrientation за замовчуванням
  assert.equal(res.orientation, 6);
  const out = res.data;
  for (const s of ["SECRET-CAMERA-9000", "Ivan Petrenko", "SN-123456", "SECRET-XMP-CREATOR", "SECRET-COMMENT", "SECRET-TRAILING-AFTER-EOI"]) assert.ok(!has(out, s), s);
  const r = await exifr.parse(out, { gps: true, translateValues: false, mergeOutput: true });
  assert.equal(r.Orientation, 6);
  assert.equal(r.latitude, undefined);
  assert.equal(r.Make, undefined);
  // exifr-«translate» + власний розбір
  const app1 = res.data.subarray(res.data.indexOf(0x45), res.data.indexOf(0x45) + 4);
  assert.equal(String.fromCharCode(...app1), "Exif");
  const info = tiffInfo(buildOrientationApp1(6).subarray(10));
  assert.deepEqual([info.orientation, info.ifd0Count, info.hasGpsIfd, info.hasThumbnail, info.onlyOrientation], [6, 1, false, false, true]);
  assert.deepEqual(Buffer.from(decode(out).data), Buffer.from(decode(dirty).data));
  // сегмент JFIF лишається першим після SOI, Exif — за ним
  assert.equal(out[2], 0xff); assert.equal(out[3], 0xe0);
});

test("JPEG: keepOrientation:false повністю прибирає й орієнтацію", async () => {
  const out = stripJpeg(dirtyJpeg({ orientation: 8 }), { keepOrientation: false });
  assert.equal(out.orientation, 8); // для інформації (перекодування на боці викликача)
  const r = await exifr.parse(out.data, { mergeOutput: true });
  assert.ok(!r || r.Orientation === undefined);
  assert.ok(!has(out.data, "Exif"));
});

test("JPEG: «вже чисті» файли не змінюються (ні метаданих, ні лише орієнтація)", () => {
  const base = baseJpeg();
  const a = stripJpeg(base);
  assert.equal(a.changed, false);
  assert.equal(a.data, base);
  const onlyOri = insertAfterSoi(base, app1Exif(buildTiff({ orientation: 6, onlyOrientation: true })));
  const b = stripJpeg(onlyOri);
  assert.equal(b.changed, false);
  assert.equal(b.data, onlyOri);
});

test("JPEG: кілька сканів (прогресивний) — усі скани й маркери між ними збережено", () => {
  const base = baseJpeg();
  const sosAt = (() => { for (let i = 0; i < base.length - 1; i++) if (base[i] === 0xff && base[i + 1] === 0xda) return i; })();
  const scan = base.subarray(sosAt, base.length - 2); // SOS + дані (без EOI)
  const twoScans = cat(base.subarray(0, base.length - 2), seg(0xc4, Uint8Array.from([0x10, ...new Array(16).fill(0), ])), scan, [0xff, 0xd9]);
  const dirty = insertAfterSoi(twoScans, app1Exif(meta()));
  const out = stripJpeg(dirty, { keepOrientation: false });
  assert.deepEqual(out.data, twoScans);
});

test("JPEG: RST-маркери та FF00 усередині даних не ламають розбір; сміття після EOI зрізається", () => {
  const base = baseJpeg();
  const withTrail = cat(base, [0xff, 0xd9, 0x00, 0x11]); // ще один «EOI» і сміття
  const out = stripJpeg(withTrail);
  assert.ok(out.changed);
  assert.deepEqual(out.data, base);
});

test("JPEG: пошкоджений файл → MetaFormatError (MALFORMED), а не тихий успіх", () => {
  assert.throws(() => stripJpeg(enc.encode("not a jpeg at all")), (e) => e instanceof MetaFormatError && e.code === "MALFORMED");
  const bad = cat([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff], "short"); // довжина сегмента виходить за файл
  assert.throws(() => stripJpeg(bad), (e) => e.code === "MALFORMED");
  const garbage = cat([0xff, 0xd8], "garbage");
  assert.throws(() => stripJpeg(garbage), (e) => e.code === "MALFORMED");
});

test("readFoundFields: камера, дата, GPS, програма, автор, серійний номер", async () => {
  const f = await readFoundFields(meta(), exifr.parse);
  assert.equal(f.camera, `Apple ${SECRET}`);
  assert.equal(f.date, "2024-05-01 12:34");
  assert.ok(Math.abs(f.gps.lat - 50.4501) < 1e-3 && Math.abs(f.gps.lon - 30.5236) < 1e-3);
  assert.equal(f.software, "Adobe Photoshop 25.0");
  assert.equal(f.author, "Ivan Petrenko");
  assert.equal(f.serial, "SN-123456");
  assert.deepEqual(await readFoundFields(null, exifr.parse), {});
  assert.deepEqual(await readFoundFields(Uint8Array.from([1, 2, 3]), exifr.parse), {}); // сміття → {}
  assert.deepEqual(await readFoundFields(meta(), async () => { throw new Error("boom"); }), {});
});

test("tiffInfo: орієнтація, GPS, мініатюра", () => {
  const i = tiffInfo(meta({ orientation: 3 }));
  assert.equal(i.orientation, 3);
  assert.equal(i.hasGpsIfd, true);
  assert.equal(i.hasThumbnail, true);
  assert.equal(i.onlyOrientation, false);
  assert.equal(tiffInfo(Uint8Array.from([1, 2, 3])), null);
});

// ───────── PNG ─────────
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const be32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const chunk = (type, data) => { const d = typeof data === "string" ? enc.encode(data) : Uint8Array.from(data); const td = cat(type, d); return cat(be32(d.length), td, be32(crc32(td))); };
function pngWith(...extras) {
  const w = 4, h = 4;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w * 3; x++) raw[y * (w * 3 + 1) + 1 + x] = (x * 17 + y * 31) & 255; }
  return cat([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], chunk("IHDR", cat(be32(w), be32(h), [8, 2, 0, 0, 0])), ...extras, chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", ""));
}
const inflateIdat = (png) => { const parts = []; let p = 8; while (p < png.length) { const n = (png[p] << 24 | png[p + 1] << 16 | png[p + 2] << 8 | png[p + 3]) >>> 0; const t = String.fromCharCode(...png.subarray(p + 4, p + 8)); if (t === "IDAT") parts.push(png.subarray(p + 8, p + 8 + n)); p += 12 + n; } return zlib.inflateSync(Buffer.concat(parts.map((x) => Buffer.from(x)))); };

test("PNG: tEXt/iTXt(XMP)/eXIf/tIME і хвіст видаляються, пікселі та решта чанків — ті самі байти", async () => {
  const tiff = meta();
  const png = cat(pngWith(chunk("sRGB", [0]), chunk("tEXt", "Author\0SECRET-PNG-AUTHOR"), chunk("iTXt", cat("XML:com.adobe.xmp\0", [0, 0, 0, 0], "SECRET-PNG-XMP")), chunk("eXIf", tiff), chunk("tIME", [7, 232, 5, 1, 12, 0, 0]), chunk("zTXt", cat("Comment\0", [0], [120, 156, 3, 0, 0, 0, 0, 1]))), enc.encode("TRAILING-JUNK"));
  const res = stripPng(png);
  assert.ok(res.changed);
  for (const s of ["SECRET-PNG-AUTHOR", "SECRET-PNG-XMP", "tEXt", "eXIf", "tIME", "iTXt", "zTXt", "TRAILING-JUNK", SECRET]) assert.ok(!has(res.data, s), s);
  assert.ok(has(res.data, "sRGB") && has(res.data, "IHDR") && has(res.data, "IEND"));
  assert.deepEqual(new Set(res.removed.map((r) => r.kind)), new Set(["text", "xmp", "exif", "time", "trailing"]));
  assert.deepEqual(inflateIdat(res.data), inflateIdat(png)); // пікселі ті самі
  assert.equal((await readFoundFields(res.exifTiff, exifr.parse)).gps !== undefined, true); // Exif із PNG прочитано для показу
  // без метаданих — файл не змінюється
  const clean = pngWith(chunk("sRGB", [0]));
  const c = stripPng(clean);
  assert.equal(c.changed, false); assert.equal(c.data, clean);
});

test("PNG: APNG розпізнається (анімація не втрачається, бо перекодування немає); обірваний файл → MALFORMED", () => {
  const apng = pngWith(chunk("acTL", cat(be32(1), be32(0))), chunk("tEXt", "a\0b"));
  const r = stripPng(apng);
  assert.equal(r.animated, true);
  assert.ok(has(r.data, "acTL") && !has(r.data, "tEXt"));
  assert.throws(() => stripPng(apng.subarray(0, apng.length - 5)), (e) => e.code === "MALFORMED");
});

// ───────── WebP ─────────
const le32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const rc = (fourcc, payload) => { const p = typeof payload === "string" ? enc.encode(payload) : Uint8Array.from(payload); return cat(fourcc, le32(p.length), p, p.length & 1 ? [0] : []); };
const riff = (...chunks) => { const body = cat("WEBP", ...chunks); return cat("RIFF", le32(body.length), body); };

test("WebP: EXIF і XMP видаляються, VP8X-прапорці та розмір RIFF виправлено, решта чанків без змін", async () => {
  const vp8x = rc("VP8X", [0x20 | 0x10 | 0x08 | 0x04, 0, 0, 0, 3, 0, 0, 3, 0, 0]); // ICC + alpha + EXIF + XMP, 4×4
  const iccp = rc("ICCP", "FAKE-ICC-PROFILE!"); // непарна довжина → байт вирівнювання
  const alph = rc("ALPH", [1, 2, 3, 4]);
  const image = rc("VP8L", [0x2f, 1, 2, 3, 4, 5]);
  const exif = rc("EXIF", cat("Exif\0\0", meta()));
  const xmp = rc("XMP ", "<x:xmpmeta>SECRET-WEBP-XMP</x:xmpmeta>");
  const webp = riff(vp8x, iccp, alph, image, exif, xmp);
  const r = stripWebp(webp);
  assert.ok(r.changed && r.lossless);
  const out = r.data;
  assert.ok(!has(out, "EXIF") && !has(out, "XMP ") && !has(out, "SECRET-WEBP-XMP") && !has(out, SECRET));
  assert.ok(has(out, "FAKE-ICC-PROFILE!") && has(out, "ALPH") && has(out, "VP8L"));
  const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);
  assert.equal(dv.getUint32(4, true) + 8, out.length, "розмір RIFF");
  assert.equal(out.length % 2, 0);
  assert.equal(out[20], 0x20 | 0x10, "прапорці VP8X: ICC і alpha лишились, EXIF/XMP прибрано");
  assert.deepEqual(new Set(r.removed.map((x) => x.kind)), new Set(["exif", "xmp"]));
  assert.equal((await readFoundFields(r.exifTiff, exifr.parse)).camera, `Apple ${SECRET}`);
  // повторне очищення — нічого не змінює
  assert.equal(stripWebp(out).changed, false);
});

test("WebP: простий файл без метаданих — не змінюється; не-WebP і обірваний → MALFORMED", () => {
  const simple = riff(rc("VP8 ", [1, 2, 3, 4, 5, 6, 7, 8]));
  const r = stripWebp(simple);
  assert.equal(r.changed, false); assert.equal(r.data, simple); assert.equal(r.lossless, false);
  assert.throws(() => stripWebp(enc.encode("RIFF....WAVEfmt ")), (e) => e.code === "MALFORMED");
  assert.throws(() => stripWebp(simple.subarray(0, 20)), (e) => e.code === "MALFORMED");
});
