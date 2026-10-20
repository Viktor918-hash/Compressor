// Тематичні сторінки пресетів (round 38): маршрути, метадані, тексти в 4
// мовах, наповненість категорій і підфільтрів, нові можливості рушія.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRESET_PAGES,
  PRESETS_BASE,
  CATEGORY_STYLES,
  presetsForPage,
  filterByStyle,
} from "../src/presets/presetPages.js";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";
import { PRESETS } from "../src/components/Presets/presetsData.js";
import {
  applyPresetToImageData,
  scalePreset,
} from "../src/components/Presets/Presetengine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["uk", "en", "ru", "es"];
const tr = Object.fromEntries(
  LANGS.map((l) => [
    l,
    JSON.parse(readFileSync(join(root, `src/i18n/locales/${l}/translation.json`), "utf8")),
  ])
);

test("16 тематичних сторінок, унікальні slug і адреси в 4 мовах під /photo-presets", () => {
  assert.equal(PRESET_PAGES.length, 16);
  assert.equal(new Set(PRESET_PAGES.map((p) => p.slug)).size, PRESET_PAGES.length);
  const paths = [];
  for (const page of PRESET_PAGES) {
    const route = ROUTE_PATHS.find((r) => r.slug === page.slug);
    assert.ok(route, `немає маршруту ${page.slug}`);
    for (const l of LANGS) {
      assert.ok(route[l].startsWith(`${PRESETS_BASE[l]}/`), `${l} ${route[l]}`);
      assert.match(route[l], /^\/[a-z0-9/-]+$/, `${l} ${route[l]}`);
      paths.push(route[l]);
    }
  }
  assert.equal(new Set(paths).size, paths.length, "дублікати адрес");
  // Головна пресетів лишилась на старих адресах
  const presets = ROUTE_PATHS.find((r) => r.slug === "presets");
  assert.equal(presets.uk, "/photo-presets");
  assert.equal(presets.es, "/es/filtros-para-fotos");
  // Адреси з завдання
  const uk = (slug) => ROUTE_PATHS.find((r) => r.slug === slug).uk;
  assert.equal(uk("presetsPortrait"), "/photo-presets/portrait");
  assert.equal(uk("presetsFilm"), "/photo-presets/film");
  assert.equal(uk("presetsBrightenDark"), "/photo-presets/brighten-dark");
  assert.equal(uk("presetsProductPhoto"), "/photo-presets/product-photo");
  assert.equal(uk("presetsCarSale"), "/photo-presets/car-sale");
  assert.equal(uk("presetsAvatar"), "/photo-presets/portrait-avatar");
});

test("title ≤ 60 і description 120–160 у кожній мові", () => {
  for (const page of PRESET_PAGES) {
    for (const l of LANGS) {
      const m = PAGE_META[page.slug]?.[l];
      assert.ok(m, `${l} ${page.slug}: немає метаданих`);
      assert.ok(m.title.length <= 60, `${l} ${page.slug} title ${m.title.length}`);
      assert.ok(
        m.description.length >= 120 && m.description.length <= 160,
        `${l} ${page.slug} description ${m.description.length}`
      );
    }
  }
});

test("H1, вступ, 2 абзаци, FAQ 3–5 і назва в меню — у кожній мові", () => {
  for (const page of PRESET_PAGES) {
    for (const l of LANGS) {
      const p = tr[l].presetPages?.[page.slug];
      const seo = tr[l].seoContent?.[page.slug];
      const where = `${l} ${page.slug}`;
      assert.ok(p?.h1 && p?.h1Accent && p?.intro, `${where}: h1/h1Accent/intro`);
      assert.ok(seo?.title && seo?.text1 && seo?.text2, `${where}: seoContent`);
      assert.ok(seo.faq.length >= 3 && seo.faq.length <= 5, `${where}: faq ${seo.faq.length}`);
      for (const item of seo.faq) assert.ok(item.q && item.a, `${where}: порожнє питання`);
      assert.ok(tr[l].presetPages.nav[page.slug], `${where}: nav`);
      if (page.kind === "task") {
        for (const id of page.picks) {
          assert.ok(p.why?.[id], `${where}: немає пояснення для ${id}`);
        }
      }
      if (page.tool) assert.ok(p.toolNote && p.toolLink, `${where}: toolNote/toolLink`);
    }
  }
});

test("H1 унікальні по всіх тематичних сторінках у кожній мові", () => {
  for (const l of LANGS) {
    const h1s = PRESET_PAGES.map((p) => tr[l].presetPages[p.slug].h1 + tr[l].presetPages[p.slug].h1Accent);
    assert.equal(new Set(h1s).size, h1s.length, l);
  }
});

test("дані пресетів: унікальні id, відомі категорії й стилі з підписами в 4 мовах", () => {
  const ids = PRESETS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(PRESETS.length >= 60, `пресетів ${PRESETS.length}`);
  const knownCategories = new Set([
    ...Object.keys(CATEGORY_STYLES),
    "wedding",
    "food",
    "product",
  ]);
  for (const preset of PRESETS) {
    assert.ok(Array.isArray(preset.categories), preset.id);
    assert.ok(Array.isArray(preset.styles), `${preset.id}: немає styles`);
    for (const c of preset.categories) assert.ok(knownCategories.has(c), `${preset.id}: ${c}`);
    for (const s of preset.styles) {
      for (const l of LANGS) assert.ok(tr[l].presets.styles[s], `${l}: presets.styles.${s}`);
    }
  }
});

test("кожна категорія має ≥ 4 пресети, кожен підфільтр — хоча б один", () => {
  for (const page of PRESET_PAGES.filter((p) => p.kind === "category")) {
    const list = presetsForPage(page, PRESETS);
    assert.ok(list.length >= 4, `${page.slug}: ${list.length}`);
    for (const style of page.styles) {
      assert.ok(filterByStyle(list, style).length >= 1, `${page.slug}: порожній стиль ${style}`);
      for (const l of LANGS) assert.ok(tr[l].presets.styles[style], `${l}: ${style}`);
    }
  }
});

test("сторінки задач: усі підібрані пресети існують, порядок збережено", () => {
  for (const page of PRESET_PAGES.filter((p) => p.kind === "task")) {
    const list = presetsForPage(page, PRESETS);
    assert.deepEqual(
      list.map((p) => p.id),
      page.picks,
      page.slug
    );
    assert.ok(list.length >= 4, page.slug);
  }
});

test("плівкова сторінка містить усі ретро-стилі з завдання", () => {
  const film = PRESET_PAGES.find((p) => p.slug === "presetsFilm");
  for (const s of ["analog", "vintage", "retro70s", "retro80s", "retro90s", "lomo", "polaroid", "sepia", "noir", "film35"]) {
    assert.ok(film.styles.includes(s), s);
  }
});

// ── Рушій ──────────────────────────────────────────────────────────────

const makeImage = () => {
  const width = 16;
  const height = 8;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = (i * 37) % 256;
    data[i * 4 + 1] = (i * 91) % 256;
    data[i * 4 + 2] = (i * 53) % 256;
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
};

test("grain: 0 або відсутній — результат як без зерна; зерно детерміноване", () => {
  const base = { exposure: 0.2, contrast: 10 };
  const a = applyPresetToImageData(makeImage(), base).data;
  const b = applyPresetToImageData(makeImage(), { ...base, grain: 0 }).data;
  assert.deepEqual([...a], [...b]);
  const g1 = applyPresetToImageData(makeImage(), { ...base, grain: 40 }).data;
  const g2 = applyPresetToImageData(makeImage(), { ...base, grain: 40 }).data;
  assert.deepEqual([...g1], [...g2]);
  assert.notDeepEqual([...g1], [...a]);
});

test("scalePreset масштабує зерно разом з іншими параметрами", () => {
  assert.equal(scalePreset({ grain: 20 }, 1.5).grain, 30);
  assert.equal(scalePreset({ grain: 20 }, 0).grain, 0);
});
