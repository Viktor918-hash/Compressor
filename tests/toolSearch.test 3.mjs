// round 33: пошук інструментів у хедері (Ctrl/Cmd+K)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TOOL_KEYWORDS, normalizeSearch, rankTools } from "../src/components/ToolSearch/toolSearch.js";

const ITEMS = [
  { slug: "home", name: "Стиснення фото", desc: "Зменшити розмір JPG, PNG, WebP", keywords: TOOL_KEYWORDS.home },
  { slug: "convert", name: "Конвертувати в JPG", desc: "PNG, WebP, HEIC та інші в JPG", keywords: TOOL_KEYWORDS.convert },
  { slug: "compressVideo", name: "Стиснути відео", desc: "Зменшити розмір відео", keywords: TOOL_KEYWORDS.compressVideo },
  { slug: "removeExif", name: "Видалити EXIF", desc: "Прибрати метадані та GPS з фото", keywords: TOOL_KEYWORDS.removeExif },
];

test("normalizeSearch: регістр, діакритика, ё", () => {
  assert.equal(normalizeSearch("  VÍDEO "), "video");
  assert.equal(normalizeSearch("Ёжик"), "ежик");
});

test("rankTools: порожній запит → увесь каталог у вихідному порядку", () => {
  assert.deepEqual(rankTools("", ITEMS).map((i) => i.slug), ["home", "convert", "compressVideo", "removeExif"]);
});

test("rankTools: збіг у назві вище, ніж в описі", () => {
  const r = rankTools("jpg", ITEMS).map((i) => i.slug);
  assert.equal(r[0], "convert");
  assert.ok(r.includes("home"));
});

test("rankTools: пошук іншою мовою через ключові слова (ru/es/en на uk-сторінці)", () => {
  assert.equal(rankTools("сжать видео", ITEMS)[0].slug, "compressVideo");
  assert.equal(rankTools("metadatos", ITEMS)[0].slug, "removeExif");
  assert.equal(rankTools("heic", ITEMS)[0].slug, "convert");
});

test("rankTools: усі слова запиту мають знайтись; інакше — порожньо", () => {
  assert.deepEqual(rankTools("gps відео", ITEMS), []);
  assert.deepEqual(rankTools("zzzz", ITEMS), []);
});

test("TOOL_KEYWORDS покриває кожен інструмент каталогу", () => {
  // toolsCatalog.js читає import.meta.env, тож — як текст (див. tests/crop.test.mjs)
  const src = readFileSync("src/toolsCatalog.js", "utf8");
  const block = src.slice(src.indexOf("export const TOOLS"), src.indexOf("export const toolBySlug"));
  const slugs = [...block.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(slugs.length >= 22);
  const missing = slugs.filter((s) => !TOOL_KEYWORDS[s]);
  assert.deepEqual(missing, []);
});
