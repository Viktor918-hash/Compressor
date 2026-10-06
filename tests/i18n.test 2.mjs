// Перевірка перекладів: однакові ключі в усіх мовах і жодного ключа, який
// використовується в коді через t("...") але відсутній у перекладах.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";
import { makeRequiredIn } from "./helpers/requiredLangs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["uk", "en", "ru", "es"];
const load = (l) =>
  JSON.parse(readFileSync(join(root, `src/i18n/locales/${l}/translation.json`), "utf8"));
const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

const locales = Object.fromEntries(LANGS.map((l) => [l, new Set(flatten(load(l)))]));

// Маршрут може існувати не в усіх мовах (наприклад, { slug, uk, en } без ru/es).
// Ключі такого інструмента обов'язкові лише для мов, у яких він є:
//   <slug>.*, seoContent.<slug>.*, header.<slug>, header.<slug>Desc.
// Усе інше перевіряється як раніше — в усіх 4 мовах.
const { ownerOf, requiredIn } = makeRequiredIn(ROUTE_PATHS, LANGS);

test("усі мови мають однаковий набір ключів (крім ключів інструментів, яких у цій мові немає)", () => {
  const all = new Set(LANGS.flatMap((l) => [...locales[l]]));
  const problems = [];
  for (const key of all) {
    const required = requiredIn(key);
    for (const l of LANGS) {
      const has = locales[l].has(key);
      // Ключ, якого не вимагає жодна перевірка, у "зайвих" мовах теж допустимий
      // (напр. частковий переклад, який ще не підключений до маршруту).
      if (required.includes(l) && !has) problems.push(`${l}: немає ${key}`);
      if (!required.includes(l) && has && !ownerOf(key)) problems.push(`${l}: зайвий ${key}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("кожен маршрут має SEO-текст і метадані в кожній мові, де він існує", () => {
  const problems = [];
  for (const r of ROUTE_PATHS) {
    for (const l of LANGS) {
      if (!r[l]) continue;
      if (!locales[l].has(`seoContent.${r.slug}.title`)) problems.push(`${l}: seoContent.${r.slug}`);
      if (!PAGE_META[r.slug]?.[l]?.title) problems.push(`${l}: PAGE_META.${r.slug}`);
    }
  }
  assert.deepEqual(problems, []);
});

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === "locales") return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(name) ? [p] : [];
  });
}

test("ключі з t(\"…\") у коді існують у всіх мовах", () => {
  const used = new Map();
  const re = /\bt\(\s*["']([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)["']/g;
  for (const file of walk(join(root, "src"))) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(re)) used.set(m[1], file.replace(root, ""));
  }
  const problems = [];
  for (const [key, file] of used) {
    for (const l of requiredIn(key)) if (!locales[l].has(key)) problems.push(`${l}: ${key} (${file})`);
  }
  assert.deepEqual(problems, []);
});
