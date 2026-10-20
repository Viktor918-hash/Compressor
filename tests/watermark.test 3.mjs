import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";
import {
  clampOpacity,
  clampFontPercent,
  fontSizePx,
  clampScalePercent,
  logoSizePx,
  singlePosition,
  tilePositions,
  MIN_OPACITY,
  MAX_OPACITY,
  MIN_FONT_PCT,
  MAX_FONT_PCT,
  MIN_SCALE_PCT,
  MAX_SCALE_PCT,
} from "../src/components/Watermark/watermark.js";

test("clampOpacity: затискає в межі [0.05, 1]", () => {
  assert.equal(clampOpacity(-1), MIN_OPACITY);
  assert.equal(clampOpacity(0), MIN_OPACITY);
  assert.equal(clampOpacity(0.5), 0.5);
  assert.equal(clampOpacity(1), MAX_OPACITY);
  assert.equal(clampOpacity(5), MAX_OPACITY);
});

test("clampFontPercent: затискає в межі [2, 15]", () => {
  assert.equal(clampFontPercent(0), MIN_FONT_PCT);
  assert.equal(clampFontPercent(8), 8);
  assert.equal(clampFontPercent(100), MAX_FONT_PCT);
});

test("fontSizePx: рахує від коротшої сторони фото", () => {
  assert.equal(fontSizePx(1000, 500, 10), 50); // min(1000,500)=500, 10% = 50
  assert.equal(fontSizePx(500, 1000, 10), 50); // портрет: та сама коротша сторона
  assert.equal(fontSizePx(0, 0, 10), 1); // не падає на нульовому зображенні, мінімум 1px
});

test("clampScalePercent: затискає в межі [5, 60]", () => {
  assert.equal(clampScalePercent(0), MIN_SCALE_PCT);
  assert.equal(clampScalePercent(30), 30);
  assert.equal(clampScalePercent(1000), MAX_SCALE_PCT);
});

test("logoSizePx: масштабує лого пропорційно за шириною фото", () => {
  // лого 200×100 (2:1), 20% від ширини фото 1000 → width=200, height=100
  assert.deepEqual(logoSizePx(1000, 200, 100, 20), { width: 200, height: 100 });
  // квадратне лого 300×300, 10% від ширини 500 → width=50, height=50
  assert.deepEqual(logoSizePx(500, 300, 300, 10), { width: 50, height: 50 });
});

test("singlePosition: 5 пресетів дають очікувані координати", () => {
  const canvasW = 1000;
  const canvasH = 500;
  const wmW = 100;
  const wmH = 50;
  const margin = 20;
  assert.deepEqual(singlePosition(canvasW, canvasH, wmW, wmH, "topLeft", margin), { x: 20, y: 20 });
  assert.deepEqual(singlePosition(canvasW, canvasH, wmW, wmH, "topRight", margin), { x: 880, y: 20 });
  assert.deepEqual(singlePosition(canvasW, canvasH, wmW, wmH, "bottomLeft", margin), { x: 20, y: 430 });
  assert.deepEqual(singlePosition(canvasW, canvasH, wmW, wmH, "bottomRight", margin), { x: 880, y: 430 });
  assert.deepEqual(singlePosition(canvasW, canvasH, wmW, wmH, "center", margin), { x: 450, y: 225 });
});

test("singlePosition: невідома позиція (напр. 'tile') падає назад на center", () => {
  assert.deepEqual(singlePosition(1000, 500, 100, 50, "tile", 20), { x: 450, y: 225 });
});

test("tilePositions: сітка покриває полотно з відступом за краї (часткові плитки на межах)", () => {
  const canvasW = 100;
  const canvasH = 100;
  const wmW = 50;
  const wmH = 50;
  const gap = 10;
  const positions = tilePositions(canvasW, canvasH, wmW, wmH, gap);
  assert.ok(positions.length >= 9, `замало плиток: ${positions.length}`);
  const minX = Math.min(...positions.map((p) => p.x));
  const maxRight = Math.max(...positions.map((p) => p.x + wmW));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxBottom = Math.max(...positions.map((p) => p.y + wmH));
  assert.ok(minX < 0, `перша плитка має починатись до 0: ${minX}`);
  assert.ok(maxRight > canvasW, `остання плитка має виходити за canvasW: ${maxRight}`);
  assert.ok(minY < 0, `перший ряд має починатись до 0: ${minY}`);
  assert.ok(maxBottom > canvasH, `останній ряд має виходити за canvasH: ${maxBottom}`);
});

test("tilePositions: нульовий/від'ємний крок не падає, повертає порожній масив", () => {
  assert.deepEqual(tilePositions(100, 100, 0, 0, -5), []);
});

// ---- маршрут/каталог/SEO-метадані (той самий шаблон, що й у crop.test.mjs/rotate.test.mjs) ----

test("addWatermark: маршрут у 4 мовах", () => {
  const r = ROUTE_PATHS.find((x) => x.slug === "addWatermark");
  assert.ok(r, "маршрут addWatermark не знайдено");
  assert.deepEqual(Object.keys(r).sort(), ["en", "es", "ru", "slug", "uk"]);
  assert.equal(r.en, "/en" + r.uk);
  assert.equal(r.ru, "/ru" + r.uk);
});

test("addWatermark: SEO title/description задані для 4 мов", () => {
  for (const l of ["uk", "en", "ru", "es"]) {
    const m = PAGE_META.addWatermark[l];
    assert.ok(m, `немає PAGE_META.addWatermark.${l}`);
    assert.ok(m.title.length <= 60, `${l} title ${m.title.length}`);
    assert.ok(m.description.length >= 120 && m.description.length <= 160, `${l} description ${m.description.length}`);
  }
});
