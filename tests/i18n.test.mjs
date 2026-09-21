// Перевірка перекладів: однакові ключі в усіх мовах і жодного ключа, який
// використовується в коді через t("...") але відсутній у перекладах.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["uk", "en", "ru", "es"];
const load = (l) =>
  JSON.parse(readFileSync(join(root, `src/i18n/locales/${l}/translation.json`), "utf8"));
const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

const locales = Object.fromEntries(LANGS.map((l) => [l, new Set(flatten(load(l)))]));

test("усі мови мають однаковий набір ключів", () => {
  const base = locales.uk;
  for (const l of LANGS.slice(1)) {
    const missing = [...base].filter((k) => !locales[l].has(k));
    const extra = [...locales[l]].filter((k) => !base.has(k));
    assert.deepEqual({ lang: l, missing, extra }, { lang: l, missing: [], extra: [] });
  }
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
    for (const l of LANGS) if (!locales[l].has(key)) problems.push(`${l}: ${key} (${file})`);
  }
  assert.deepEqual(problems, []);
});
