import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";
import {
  MIN_INTENSITY,
  MAX_INTENSITY,
  DEFAULT_INTENSITY,
  clampIntensity,
  grayscaleValue,
  blendChannel,
  applyGrayscaleToPixels,
} from "../src/components/BlackAndWhite/blackAndWhite.js";

test("clampIntensity: затискає в [0,100] і округлює", () => {
  assert.equal(clampIntensity(-10), MIN_INTENSITY);
  assert.equal(clampIntensity(0), 0);
  assert.equal(clampIntensity(50.4), 50);
  assert.equal(clampIntensity(50.6), 51);
  assert.equal(clampIntensity(100), MAX_INTENSITY);
  assert.equal(clampIntensity(150), MAX_INTENSITY);
});

test("DEFAULT_INTENSITY: 100 (повністю чорно-біле за замовчуванням)", () => {
  assert.equal(DEFAULT_INTENSITY, 100);
});

test("grayscaleValue: ваги BT.601, чорне/біле/сіре без змін", () => {
  assert.equal(grayscaleValue(0, 0, 0), 0);
  assert.equal(grayscaleValue(255, 255, 255), 255);
  assert.equal(grayscaleValue(128, 128, 128), 128);
  // Чисто червоний має менший внесок у яскравість, ніж чисто зелений (BT.601).
  assert.ok(grayscaleValue(255, 0, 0) < grayscaleValue(0, 255, 0));
});

test("blendChannel: 0% — лишає оригінал, 100% — повністю замінює на gray", () => {
  assert.equal(blendChannel(200, 50, 0), 200);
  assert.equal(blendChannel(200, 50, 100), 50);
});

test("blendChannel: проміжне значення — лінійна інтерполяція між original і gray", () => {
  assert.equal(blendChannel(0, 100, 50), 50);
  assert.equal(blendChannel(100, 0, 25), 75);
});

test("blendChannel: результат завжди в межах 0..255", () => {
  for (const i of [0, 10, 50, 90, 100]) {
    assert.ok(blendChannel(0, 255, i) >= 0 && blendChannel(0, 255, i) <= 255);
    assert.ok(blendChannel(255, 0, i) >= 0 && blendChannel(255, 0, i) <= 255);
  }
});

test("applyGrayscaleToPixels: intensity=0 не змінює пікселі (навіть alpha)", () => {
  const data = [255, 0, 0, 128, 0, 255, 0, 64];
  const copy = [...data];
  applyGrayscaleToPixels(data, 0);
  assert.deepEqual(data, copy);
});

test("applyGrayscaleToPixels: intensity=100 робить R=G=B на кожному пікселі, alpha незмінний", () => {
  const data = [255, 0, 0, 128, 10, 20, 30, 64];
  applyGrayscaleToPixels(data, 100);
  assert.equal(data[0], data[1]);
  assert.equal(data[1], data[2]);
  assert.equal(data[3], 128); // alpha першого пікселя
  assert.equal(data[4], data[5]);
  assert.equal(data[5], data[6]);
  assert.equal(data[7], 64); // alpha другого пікселя
});

test("applyGrayscaleToPixels: працює і на звичайному Array, і на Uint8ClampedArray", () => {
  const plain = [10, 200, 30, 255];
  const typed = new Uint8ClampedArray([10, 200, 30, 255]);
  applyGrayscaleToPixels(plain, 100);
  applyGrayscaleToPixels(typed, 100);
  assert.equal(plain[0], typed[0]);
  assert.equal(plain[1], typed[1]);
  assert.equal(plain[2], typed[2]);
  assert.equal(typed[3], 255);
});

// ---- маршрут/каталог/SEO-метадані (той самий шаблон, що й в rotate.test.mjs) ----

test("blackAndWhite: маршрут у 4 мовах", () => {
  const r = ROUTE_PATHS.find((x) => x.slug === "blackAndWhite");
  assert.ok(r, "маршрут blackAndWhite не знайдено");
  assert.deepEqual(Object.keys(r).sort(), ["en", "es", "ru", "slug", "uk"]);
  assert.equal(r.en, "/en" + r.uk);
  assert.equal(r.ru, "/ru" + r.uk);
});

test("blackAndWhite: SEO title/description задані для 4 мов", () => {
  for (const l of ["uk", "en", "ru", "es"]) {
    const m = PAGE_META.blackAndWhite[l];
    assert.ok(m, `немає PAGE_META.blackAndWhite.${l}`);
    assert.ok(m.title.length <= 60, `${l} title ${m.title.length}`);
    assert.ok(m.description.length >= 120 && m.description.length <= 160, `${l} description ${m.description.length}`);
  }
});
