// Тести чистої логіки "Свій розмір" для стиснення відео (раунд 22):
// toVideoBytes (парсинг МБ → байти), validateCustomTarget (вимога d —
// червона помилка, коли ціль ≥ розміру файлу) і estimateHeightForTarget
// (оцінка роздільності під цільовий розмір). Увесь модуль
// videoSizeTarget.js без DOM/мережевих залежностей — той самий паттерн,
// що й CompressToSize/fitToTarget.js.
import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateHeightForTarget,
  toVideoBytes,
  validateCustomTarget,
} from "../src/components/CompressVideo/videoSizeTarget.js";

test("toVideoBytes: 1 МБ = 1 000 000 байт", () => {
  assert.equal(toVideoBytes("1"), 1_000_000);
  assert.equal(toVideoBytes("50"), 50_000_000);
  assert.equal(toVideoBytes("12.5"), 12_500_000);
  assert.equal(toVideoBytes("12,5"), 12_500_000); // кома — як десятковий роздільник
});

test("toVideoBytes: некоректні значення → NaN", () => {
  assert.ok(Number.isNaN(toVideoBytes("")));
  assert.ok(Number.isNaN(toVideoBytes("abc")));
  assert.ok(Number.isNaN(toVideoBytes("0")));
  assert.ok(Number.isNaN(toVideoBytes("-5")));
});

test("validateCustomTarget: некоректне число → BAD_TARGET", () => {
  assert.equal(validateCustomTarget(NaN, 10_000_000)?.code, "BAD_TARGET");
  assert.equal(validateCustomTarget(0, 10_000_000)?.code, "BAD_TARGET");
  assert.equal(validateCustomTarget(-5, 10_000_000)?.code, "BAD_TARGET");
});

test("validateCustomTarget: ціль >= розміру файлу → TARGET_TOO_LARGE (вимога d)", () => {
  const err = validateCustomTarget(10_000_000, 10_000_000); // точно рівно
  assert.equal(err?.code, "TARGET_TOO_LARGE");
  assert.equal(err.targetBytes, 10_000_000);
  assert.equal(err.fileSize, 10_000_000);

  const errBigger = validateCustomTarget(50_000_000, 10_000_000); // строго більше
  assert.equal(errBigger?.code, "TARGET_TOO_LARGE");
});

test("validateCustomTarget: коректна ціль, менша за файл → null (без помилки)", () => {
  assert.equal(validateCustomTarget(5_000_000, 10_000_000), null);
});

test("estimateHeightForTarget: ціль вдвічі менша за оригінал → висота зменшується (sqrt-масштаб)", () => {
  const meta = { width: 1920, height: 1080, duration: 60 };
  const fileSize = 60_000_000; // ~8 Мбіт/с за 60с
  const targetBytes = 30_000_000; // хочемо вдвічі менше
  const height = estimateHeightForTarget(meta, fileSize, targetBytes);
  // Масштаб площі ~0.5 → масштаб висоти ~sqrt(0.5) ≈ 0.707 → ~764px,
  // в межах розумного діапазону (не апскейл, помітно менше за оригінал).
  assert.ok(height < meta.height, "має зменшити висоту");
  assert.ok(height > meta.height * 0.5, "не повинно стискати надмірно для вдвічі меншої цілі");
});

test("estimateHeightForTarget: ціль більша за оригінал (за бітрейтом) → не апскейлить", () => {
  const meta = { width: 1920, height: 1080, duration: 60 };
  const fileSize = 10_000_000;
  const targetBytes = 500_000_000; // значно більше за оригінал
  const height = estimateHeightForTarget(meta, fileSize, targetBytes);
  assert.equal(height, meta.height, "масштаб затиснутий на MAX_SCALE=1 — висота оригіналу");
});

test("estimateHeightForTarget: без тривалості (duration=null) → безпечний дефолт 720p", () => {
  const meta = { width: 1920, height: 1080, duration: null };
  const height = estimateHeightForTarget(meta, 50_000_000, 10_000_000);
  assert.equal(height, 720);
});

test("estimateHeightForTarget: дуже мала ціль → масштаб не йде нижче MIN_SCALE (не стискає в кашу)", () => {
  const meta = { width: 1920, height: 1080, duration: 600 }; // 10 хв
  const fileSize = 600_000_000; // великий оригінал
  const targetBytes = 1_000_000; // нереально малий таргет
  const height = estimateHeightForTarget(meta, fileSize, targetBytes);
  // MIN_SCALE = 0.1 → мінімальна висота ≈ 1080*sqrt(0.1) ≈ 342px
  assert.ok(height >= 1080 * Math.sqrt(0.1) - 1);
});

test("estimateHeightForTarget: однакова ціль і джерело (за бітрейтом) → масштаб ~1, висота без змін", () => {
  const meta = { width: 1920, height: 1080, duration: 60 };
  const fileSize = 50_000_000;
  const height = estimateHeightForTarget(meta, fileSize, fileSize - 1); // майже той самий розмір
  assert.equal(height, meta.height);
});
