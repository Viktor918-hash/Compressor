// Якість SEO-текстів (round 39): жодних однакових речень між сторінками й
// надто довгих речень. Захист від повернення шаблонних абзаців, через які
// сайт схожий на масово згенерований контент (Google spam/helpful content).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const LANGS = ["uk", "en", "ru", "es"];
const SKIP = new Set(["faqTitle", "privacy", "terms", "contact", "about", "blog"]);
const read = (l) => JSON.parse(readFileSync(`src/i18n/locales/${l}/translation.json`, "utf8"));
const walk = (x) => (typeof x === "string" ? [x] : Array.isArray(x) ? x.flatMap(walk) : x && typeof x === "object" ? Object.values(x).flatMap(walk) : []);
const sentences = (t) => t.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
const wordsOf = (s) => s.toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) || [];

for (const l of LANGS) {
  const pages = Object.entries(read(l).seoContent).filter(
    ([k, v]) => v && typeof v === "object" && !SKIP.has(k) && !k.startsWith("blog")
  );

  test(`${l}: жодне речення (від 8 слів) не повторюється на різних сторінках`, () => {
    const seen = new Map();
    const dups = [];
    for (const [page, node] of pages) {
      for (const s of walk(node).flatMap(sentences)) {
        const w = wordsOf(s);
        if (w.length < 8) continue;
        const key = w.join(" ");
        const first = seen.get(key);
        if (first && first !== page) dups.push(`${first} ↔ ${page}: ${s}`);
        else seen.set(key, page);
      }
    }
    assert.deepEqual(dups, []);
  });

  test(`${l}: речення не довші за 30 слів`, () => {
    const long = pages.flatMap(([page, node]) =>
      walk(node).flatMap(sentences).filter((s) => wordsOf(s).length > 30).map((s) => `${page}: ${s}`)
    );
    assert.deepEqual(long, []);
  });
}
