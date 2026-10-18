// Чиста логіка relatedToolsPicker.js — спільна для RelatedTools (під SEO-
// текстом) і TryAlsoInline (компактний блок у бічній панелі, round 25/32).
import test from "node:test";
import assert from "node:assert/strict";
import {
  availableRelatedSlugs,
  pickTryAlsoSlugs,
} from "../src/components/SeoContent/relatedToolsPicker.js";

// Мінімальна заглушка relatedMap — не з реального toolsCatalog.js (який
// недоступний поза Vite), але з тими самими slug-ами, що й справжні
// маршрути ROUTE_PATHS, щоб hasLang() всередині давав реальну відповідь.
// "terms" — реальний маршрут лише з uk/en (правові сторінки, routes.config.js),
// зручний готовий приклад "інструмента", якого немає в усіх 4 мовах.
const RELATED = {
  resize: ["home", "convert", "webp", "terms"],
  wordToPdf: [], // порожній список — валідний, але нічого радити
  unknownSlug: undefined,
};

test("availableRelatedSlugs: фільтрує лише за мовою, порядок зберігається", () => {
  const uk = availableRelatedSlugs("resize", "uk", RELATED);
  assert.deepEqual(uk, ["home", "convert", "webp", "terms"]);
});

test("availableRelatedSlugs: прибирає slug, якого немає в мові сторінки", () => {
  const ru = availableRelatedSlugs("resize", "ru", RELATED);
  assert.ok(!ru.includes("terms"), "terms немає в ru — не має лишитись");
  assert.deepEqual(ru, ["home", "convert", "webp"]);
});

test("availableRelatedSlugs: невідомий slug (немає ключа в relatedMap) → []", () => {
  assert.deepEqual(availableRelatedSlugs("noSuchTool", "uk", RELATED), []);
});

test("availableRelatedSlugs: relatedMap[current] === undefined → []", () => {
  assert.deepEqual(availableRelatedSlugs("unknownSlug", "uk", RELATED), []);
});

test("availableRelatedSlugs: відсутня relatedMap (undefined) → []", () => {
  assert.deepEqual(availableRelatedSlugs("resize", "uk", undefined), []);
});

test("availableRelatedSlugs: порожній список кандидатів лишається порожнім", () => {
  assert.deepEqual(availableRelatedSlugs("wordToPdf", "uk", RELATED), []);
});

test("pickTryAlsoSlugs: дефолтний limit=2", () => {
  assert.deepEqual(pickTryAlsoSlugs("resize", "uk", RELATED), ["home", "convert"]);
});

test("pickTryAlsoSlugs: явний limit, у т.ч. limit=1 і limit=0", () => {
  assert.deepEqual(pickTryAlsoSlugs("resize", "uk", RELATED, 3), ["home", "convert", "webp"]);
  assert.deepEqual(pickTryAlsoSlugs("resize", "uk", RELATED, 1), ["home"]);
  assert.deepEqual(pickTryAlsoSlugs("resize", "uk", RELATED, 0), []);
});

test("pickTryAlsoSlugs: список коротший за limit — повертає все, що є", () => {
  assert.deepEqual(pickTryAlsoSlugs("resize", "ru", RELATED, 10), ["home", "convert", "webp"]);
});
