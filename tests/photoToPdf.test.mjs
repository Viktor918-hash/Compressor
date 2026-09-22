import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import jpeg from "jpeg-js";
import {
  computeLayout,
  classifyJpeg,
  mergeImagesToPdf,
  totalBytes,
} from "../src/components/PhotoToPdf/photoToPdf.js";
import { buildOrientationApp1 } from "../src/components/RemoveExif/metaFormats.js";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";

// ───────── синтетичний JPEG (для classifyJpeg) ─────────
const plainJpeg = () => {
  const w = 8,
    h = 6;
  const data = Buffer.alloc(w * h * 4, 0);
  return new Uint8Array(jpeg.encode({ data, width: w, height: h }, 90).data);
};

/** Вставляє готовий маркер APP1 (напр. з buildOrientationApp1) одразу після SOI. */
const withApp1 = (bytes, app1) => {
  const out = new Uint8Array(2 + app1.length + (bytes.length - 2));
  out.set(bytes.subarray(0, 2), 0);
  out.set(app1, 2);
  out.set(bytes.subarray(2), 2 + app1.length);
  return out;
};

test("computeLayout: pageSize photo — сторінка = фото (+поля)", () => {
  const l0 = computeLayout(800, 600, { pageSize: "photo", marginMm: 0 });
  assert.equal(l0.drawW, 800 * 0.75);
  assert.equal(l0.drawH, 600 * 0.75);
  assert.equal(l0.pageW, l0.drawW);
  assert.equal(l0.pageH, l0.drawH);
  assert.equal(l0.x, 0);
  assert.equal(l0.y, 0);

  const marginPt = 10 * (72 / 25.4);
  const l10 = computeLayout(800, 600, { pageSize: "photo", marginMm: 10 });
  assert.ok(Math.abs(l10.pageW - (l0.drawW + marginPt * 2)) < 1e-9);
  assert.ok(Math.abs(l10.x - marginPt) < 1e-9);
  assert.ok(Math.abs(l10.y - marginPt) < 1e-9);
  // саме фото на сторінці лишається того самого розміру, що й без полів
  assert.equal(l10.drawW, l0.drawW);
  assert.equal(l10.drawH, l0.drawH);
});

test("computeLayout: pageSize a4 — орієнтація сторінки й пропорції фото", () => {
  const landscape = computeLayout(1600, 1200, { pageSize: "a4", marginMm: 0 });
  // альбомна A4: ширша за висоту
  assert.ok(landscape.pageW > landscape.pageH);
  assert.ok(Math.abs(landscape.pageW - 841.89) < 1e-6);
  assert.ok(Math.abs(landscape.pageH - 595.28) < 1e-6);

  const portrait = computeLayout(1200, 1600, { pageSize: "a4", marginMm: 0 });
  assert.ok(portrait.pageW < portrait.pageH);
  assert.ok(Math.abs(portrait.pageW - 595.28) < 1e-6);
  assert.ok(Math.abs(portrait.pageH - 841.89) < 1e-6);

  // пропорції фото збережені (без спотворення) і воно центроване
  for (const l of [landscape, portrait]) {
    const drawRatio = l.drawW / l.drawH;
    assert.ok(Math.abs(drawRatio - 1600 / 1200) < 1e-6 || Math.abs(drawRatio - 1200 / 1600) < 1e-6);
    assert.ok(Math.abs(l.x + l.drawW / 2 - l.pageW / 2) < 1e-6, "центровано по X");
    assert.ok(Math.abs(l.y + l.drawH / 2 - l.pageH / 2) < 1e-6, "центровано по Y");
    assert.ok(l.drawW <= l.pageW + 1e-6 && l.drawH <= l.pageH + 1e-6, "фото не виходить за поле друку");
  }
});

test("computeLayout: поля a4 зменшують доступну область друку", () => {
  const noMargin = computeLayout(1200, 1600, { pageSize: "a4", marginMm: 0 });
  const withMargin = computeLayout(1200, 1600, { pageSize: "a4", marginMm: 10 });
  // розмір самої сторінки не залежить від полів (A4 лишається A4)
  assert.equal(noMargin.pageW, withMargin.pageW);
  assert.equal(noMargin.pageH, withMargin.pageH);
  // а фото на сторінці з полями — менше
  assert.ok(withMargin.drawW < noMargin.drawW);
  assert.ok(withMargin.drawH < noMargin.drawH);
});

test("computeLayout: від'ємні поля не ламають геометрію (як 0)", () => {
  const l = computeLayout(800, 600, { pageSize: "photo", marginMm: -5 });
  assert.equal(l.x, 0);
  assert.equal(l.y, 0);
});

test("classifyJpeg: звичайний JPEG без EXIF — можна вбудувати як є", () => {
  const bytes = plainJpeg();
  const c = classifyJpeg(bytes);
  assert.equal(c.rawEmbeddable, true);
  assert.equal(c.orientation, 1);
});

test("classifyJpeg: EXIF-орієнтація ≠ 1 — потрібне перекодування", () => {
  const bytes = withApp1(plainJpeg(), buildOrientationApp1(6));
  const c = classifyJpeg(bytes);
  assert.equal(c.rawEmbeddable, false);
  assert.equal(c.orientation, 6);
});

test("classifyJpeg: не-JPEG байти — безпечно повертає rawEmbeddable=false, а не кидає", () => {
  const c = classifyJpeg(Uint8Array.of(1, 2, 3, 4));
  assert.equal(c.rawEmbeddable, false);
  assert.equal(c.orientation, null);
});

test("mergeImagesToPdf: порожній список файлів — RangeError", async () => {
  await assert.rejects(() => mergeImagesToPdf([]), RangeError);
});

test("mergeImagesToPdf: уже скасований signal — AbortError ще до читання файлів", async () => {
  const ac = new AbortController();
  ac.abort();
  // навмисно без arrayBuffer(): якщо код спробує прочитати файл, тест впаде
  // на іншій помилці, а не AbortError, — переконуємось, що перевірка сигналу йде першою
  const fakeFile = { name: "a.jpg", size: 1 };
  await assert.rejects(
    () => mergeImagesToPdf([fakeFile], { signal: ac.signal }),
    (e) => e.name === "AbortError"
  );
});

test("totalBytes: сума розмірів файлів", () => {
  assert.equal(totalBytes([{ size: 100 }, { size: 250 }, { size: 1 }]), 351);
  assert.equal(totalBytes([]), 0);
});

test("маршрут /photo-to-pdf: 4 мови, підключений до каталогу й «Схожих»", () => {
  const r = ROUTE_PATHS.find((x) => x.slug === "photoToPdf");
  assert.deepEqual(r, {
    slug: "photoToPdf",
    uk: "/photo-to-pdf",
    en: "/en/photo-to-pdf",
    ru: "/ru/photo-to-pdf",
    es: "/es/foto-a-pdf",
  });
  const catalog = readFileSync("src/toolsCatalog.js", "utf8");
  assert.match(catalog, /slug: "photoToPdf"/);
  assert.match(catalog, /photoToPdf: \[[^\]]{6,}\]/, "у RELATED має бути власний список");
  const linkedFrom = [...catalog.matchAll(/^\s{2}(\w+): \[([^\]]*)\],?$/gm)].filter(
    (m) => m[1] !== "photoToPdf" && m[2].includes('"photoToPdf"')
  );
  assert.ok(linkedFrom.length >= 2, "додайте нову сторінку у «Схожі» 2–3 існуючих інструментів");
});

test("SEO-метадані photoToPdf: title ≤ 60, description 120–160, унікальні на сайті", () => {
  const all = Object.values(PAGE_META).flatMap((m) => Object.values(m));
  assert.equal(new Set(all.map((m) => m.title)).size, all.length, "дублікат title");
  assert.equal(new Set(all.map((m) => m.description)).size, all.length, "дублікат description");
  for (const l of ["uk", "en", "ru", "es"]) {
    const m = PAGE_META.photoToPdf[l];
    assert.ok(m.title.length <= 60, `title ${l}: ${m.title.length}`);
    assert.ok(m.description.length >= 120 && m.description.length <= 160, `description ${l}: ${m.description.length}`);
  }
});
