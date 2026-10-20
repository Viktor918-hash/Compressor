// Підсторінки пресетів (round 38): /photo-presets/<тема> у 4 мовах.
// Чисті дані без JSX і без залежностей від Vite: файл імпортують
// routes.config.js (а через нього vite.config.js у Node — для prerender і
// sitemap), seoMeta.js, Header, Presets.jsx і тести.
//
// Три типи сторінок:
//   kind: "category" — усі пресети з category (поле categories у пресеті) +
//                      підфільтри styles (поле styles у пресеті);
//   kind: "task"     — підібрані вручну пресети (picks) під конкретну задачу;
//                      пояснення "чому цей пресет" — у перекладах
//                      presetPages.<slug>.why.<presetId>.
// Тексти сторінок (H1, вступ, SEO-текст, FAQ) — у translation.json
// (presetPages.<slug>.*, seoContent.<slug>.*), title/description — у
// presetPagesMeta.js (потрібні синхронно для <head> і в тестах).

import { PRESET_PAGES_META } from "./presetPagesMeta.js";

// Базова адреса головної сторінки пресетів у кожній мові. Той самий об'єкт
// використовує routes.config.js для маршруту "presets" — одне джерело правди.
export const PRESETS_BASE = {
  uk: "/photo-presets",
  en: "/en/photo-presets",
  ru: "/ru/photo-presets",
  es: "/es/filtros-para-fotos",
};

// Порядок = порядок у меню й у блоці "Добірки пресетів".
// segment — остання частина адреси; es має власні іспанські slug'и
// (як і решта іспанських сторінок сайту), uk/en/ru — однакові.
export const PRESET_PAGES = [
  // ── Сюжети ──
  {
    slug: "presetsPortrait",
    kind: "category",
    group: "subjects",
    icon: "user",
    category: "portrait",
    styles: ["soft", "dramatic", "natural", "studio"],
    segment: { uk: "portrait", es: "retrato" },
  },
  {
    slug: "presetsNature",
    kind: "category",
    group: "subjects",
    icon: "feather",
    category: "nature",
    styles: ["goldenHour", "overcast", "forest", "sea"],
    segment: { uk: "nature", es: "naturaleza" },
  },
  {
    slug: "presetsUrban",
    kind: "category",
    group: "subjects",
    icon: "mapPin",
    category: "urban",
    styles: ["street", "minimal", "tealOrange"],
    segment: { uk: "urban", es: "ciudad" },
  },
  {
    slug: "presetsNight",
    kind: "category",
    group: "subjects",
    icon: "moon",
    category: "night",
    styles: ["neon", "cityLights", "moody"],
    segment: { uk: "night", es: "noche" },
  },
  {
    slug: "presetsSummer",
    kind: "category",
    group: "subjects",
    icon: "sun",
    category: "summer",
    styles: ["beach", "sunny", "travel"],
    segment: { uk: "summer", es: "verano" },
  },
  {
    slug: "presetsAuto",
    kind: "category",
    group: "subjects",
    icon: "truck",
    category: "auto",
    styles: ["clean", "moody", "sunset"],
    segment: { uk: "auto", es: "coches" },
  },
  // ── Сезони та стилі ──
  {
    slug: "presetsAutumn",
    kind: "category",
    group: "styles",
    icon: "wind",
    category: "autumn",
    styles: ["golden", "moody", "cozy"],
    segment: { uk: "autumn", es: "otono" },
  },
  {
    slug: "presetsWinter",
    kind: "category",
    group: "styles",
    icon: "snow",
    category: "winter",
    styles: ["snow", "frosty", "festive", "cozy"],
    segment: { uk: "winter", es: "invierno" },
  },
  {
    slug: "presetsFilm",
    kind: "category",
    group: "styles",
    icon: "film",
    category: "film",
    styles: [
      "analog",
      "film35",
      "vintage",
      "retro70s",
      "retro80s",
      "retro90s",
      "lomo",
      "polaroid",
      "sepia",
      "noir",
    ],
    segment: { uk: "film", es: "pelicula" },
  },
  {
    slug: "presetsCinematic",
    kind: "category",
    group: "styles",
    icon: "video",
    category: "cinematic",
    styles: ["tealOrange", "moody", "warm", "bw"],
    segment: { uk: "cinematic", es: "cine" },
  },
  // ── Під задачу ──
  {
    slug: "presetsBrightenDark",
    kind: "task",
    group: "tasks",
    icon: "sunrise",
    picks: [
      "brighten-shadows",
      "bright-clear",
      "low-light-rescue",
      "overcast-boost",
      "clean-minimal",
    ],
    segment: { uk: "brighten-dark", es: "aclarar-foto-oscura" },
  },
  {
    slug: "presetsProductPhoto",
    kind: "task",
    group: "tasks",
    icon: "bag",
    picks: ["clean-white-product", "bright-clear", "lifestyle-product", "studio-clean"],
    // для справді білого фону — інструмент видалення фону
    tool: "/remove-background",
    segment: { uk: "product-photo", es: "foto-de-producto" },
  },
  {
    slug: "presetsCarSale",
    kind: "task",
    group: "tasks",
    icon: "tag",
    picks: ["bright-automobile", "showroom-gloss", "overcast-boost", "bright-clear"],
    segment: { uk: "car-sale", es: "fotos-coche-venta" },
  },
  {
    slug: "presetsFood",
    kind: "task",
    group: "tasks",
    icon: "coffee",
    picks: ["food-warm-appetizing", "fresh-bright-food", "moody-food", "bright-clear"],
    segment: { uk: "food", es: "comida" },
  },
  {
    slug: "presetsAvatar",
    kind: "task",
    group: "tasks",
    icon: "smile",
    picks: ["natural-skin", "studio-clean", "clean-minimal", "soft-pastel", "timeless-bw"],
    // кругла аватарка — окремий інструмент
    tool: "/circle-crop",
    segment: { uk: "portrait-avatar", es: "foto-de-perfil" },
  },
  {
    slug: "presetsWedding",
    kind: "task",
    group: "tasks",
    icon: "heart",
    picks: [
      "wedding-bright-airy",
      "soft-pastel",
      "analog-warm-400",
      "golden-hour",
      "timeless-bw",
      "blush-moody",
    ],
    segment: { uk: "wedding", es: "boda" },
  },
];

export const PRESET_PAGE_GROUPS = ["subjects", "styles", "tasks"];

const segmentFor = (page, lang) => page.segment[lang] || page.segment.uk;

export const presetPagePath = (page, lang) => `${PRESETS_BASE[lang]}/${segmentFor(page, lang)}`;

export const PRESET_PAGE_ROUTE_PATHS = PRESET_PAGES.map((page) => ({
  slug: page.slug,
  uk: presetPagePath(page, "uk"),
  en: presetPagePath(page, "en"),
  ru: presetPagePath(page, "ru"),
  es: presetPagePath(page, "es"),
}));

export const PRESET_PAGE_META = PRESET_PAGES_META;

export const presetPageBySlug = (slug) => PRESET_PAGES.find((p) => p.slug === slug);

/** Сторінка категорії для фільтра головної сторінки (portrait → presetsPortrait) */
export const presetPageForCategory = (category) =>
  PRESET_PAGES.find((p) => p.kind === "category" && p.category === category);

/** Підфільтри (стилі), доступні в категорії — для другого ряду чипів */
export const CATEGORY_STYLES = Object.fromEntries(
  PRESET_PAGES.filter((p) => p.kind === "category").map((p) => [p.category, p.styles])
);

/** Канонічний (uk) шлях сторінки — для LocalizedLink */
export const presetPageUkPath = (page) => presetPagePath(page, "uk");

/**
 * Пресети сторінки в потрібному порядку.
 * category: усі з цією категорією (порядок як у PRESETS);
 * task: picks у заданому порядку.
 */
export function presetsForPage(page, presets) {
  if (!page) return presets;
  if (page.kind === "task") {
    return page.picks.map((id) => presets.find((p) => p.id === id)).filter(Boolean);
  }
  return presets.filter((p) => p.categories?.includes(page.category));
}

/** Фільтр за стилем (підфільтр); null — без фільтра */
export const filterByStyle = (presets, style) =>
  style ? presets.filter((p) => p.styles?.includes(style)) : presets;
