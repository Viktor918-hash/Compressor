import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { convertToPng, getPngOutputName } from "../src/components/ConvertPng/convertToPng.js";
import { isHeic } from "../src/utils/decodeImage.js";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";

const read = (l) => JSON.parse(readFileSync(`src/i18n/locales/${l}/translation.json`, "utf8"));
const words = (s) => (String(s).match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const walk = (x) => (typeof x === "string" ? [x] : Array.isArray(x) ? x.flatMap(walk) : x && typeof x === "object" ? Object.values(x).flatMap(walk) : []);

test("getPngOutputName: розширення завжди .png", () => {
  assert.equal(getPngOutputName("photo.jpg"), "photo.png");
  assert.equal(getPngOutputName("my.holiday.photo.HEIC"), "my.holiday.photo.png");
  assert.equal(getPngOutputName("noext"), "noext.png");
  assert.equal(getPngOutputName("a.png"), "a.png");
});

test("isHeic: за MIME та за розширенням (браузер часто не віддає MIME для HEIC)", () => {
  assert.equal(isHeic({ name: "a.jpg", type: "image/jpeg" }), false);
  assert.equal(isHeic({ name: "IMG_1.HEIC", type: "" }), true);
  assert.equal(isHeic({ name: "x.heif", type: "" }), true);
  assert.equal(isHeic({ name: "x", type: "image/heic" }), true);
});

test("convertToPng: уже скасований signal → AbortError ще до будь-якої роботи", async () => {
  const ac = new AbortController();
  ac.abort();
  await assert.rejects(
    () => convertToPng({ name: "a.jpg", type: "image/jpeg", size: 1 }, { signal: ac.signal }),
    (e) => e.name === "AbortError"
  );
});

test("маршрут /convert-to-png: 4 мови, підключений до каталогу й «Схожих»", () => {
  const r = ROUTE_PATHS.find((x) => x.slug === "convertToPng");
  assert.deepEqual(r, { slug: "convertToPng", uk: "/convert-to-png", en: "/en/convert-to-png", ru: "/ru/convert-to-png", es: "/es/convertir-a-png" });
  // toolsCatalog.js використовує import.meta.env (Vite) — у Node читаємо як текст
  const catalog = readFileSync("src/toolsCatalog.js", "utf8");
  assert.match(catalog, /slug: "convertToPng"/);
  assert.match(catalog, /convertToPng: \[[^\]]{6,}\]/, "у RELATED має бути власний список");
  const linkedFrom = [...catalog.matchAll(/^\s{2}(\w+): \[([^\]]*)\],?$/gm)].filter(
    (m) => m[1] !== "convertToPng" && m[2].includes('"convertToPng"')
  );
  assert.ok(linkedFrom.length >= 2, "додайте нову сторінку у «Схожі» 2–3 існуючих інструментів");
});

test("SEO-метадані: title ≤ 60, description 120–160, унікальні на сайті", () => {
  const all = Object.values(PAGE_META).flatMap((m) => Object.values(m));
  const titles = all.map((m) => m.title);
  const descs = all.map((m) => m.description);
  assert.equal(new Set(titles).size, titles.length, "дублікат title");
  assert.equal(new Set(descs).size, descs.length, "дублікат description");
  for (const l of ["uk", "en", "ru", "es"]) {
    const m = PAGE_META.convertToPng[l];
    assert.ok(m.title.length <= 60, `title ${l}: ${m.title.length}`);
    assert.ok(m.description.length >= 120 && m.description.length <= 160, `description ${l}: ${m.description.length}`);
  }
});

test("SEO-текст: 250–500 слів, 4 переваги, 4–6 питань у FAQ, без відсутніх ключів", () => {
  for (const l of ["uk", "en", "ru", "es"]) {
    const tr = read(l);
    const seo = tr.seoContent.convertToPng;
    const total = walk(seo).reduce((n, s) => n + words(s), 0);
    assert.ok(total >= 250 && total <= 500, `${l}: ${total} слів`);
    assert.equal(seo.benefits.length, 4);
    assert.ok(seo.faq.length >= 4 && seo.faq.length <= 6);
    for (const k of ["titlePart2", "titleGradient", "text1", "text2", "dropzone"]) assert.ok(tr.convertToPng[k], `${l}.convertToPng.${k}`);
    assert.ok(tr.convertToPng.note.larger && tr.convertToPng.errors.encodeFailed);
    assert.ok(tr.header.convertToPng && tr.header.convertToPngDesc);
  }
});
