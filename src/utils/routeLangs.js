// Чисті хелпери для маршрутів, у яких може не бути всіх 4 мов.
// Запис у routes.config.js може мати лише { slug, uk, en } — тоді сторінки
// для ru/es не існують: для них не створюється маршрут, hreflang, запис у
// sitemap, пункт у меню/футері/«Схожих». Файл без JSX і залежностей, тож його
// можна імпортувати і в компонентах, і у Node-скриптах/тестах.

export const SITE_LANGS = ["uk", "en", "ru", "es"];

export const HOME_PATHS = { uk: "/", en: "/en", ru: "/ru", es: "/es" };

/**
 * Мова за pathname: "/en", "/en/…" → en (аналогічно ru, es), решта → uk.
 * Порівнюємо з межею сегмента, а не просто startsWith("/en"): інакше
 * українська сторінка з адресою на кшталт "/enhance-photo" визначалась би
 * як англійська.
 */
export const langFromPath = (pathname = "/") => {
  const m = /^\/(en|ru|es)(?:\/|$)/.exec(pathname);
  return m ? m[1] : "uk";
};

/** Чи існує сторінка для цієї мови */
export const hasLang = (route, lang) => Boolean(route && route[lang]);

/** Мови, для яких у маршруту є URL (у порядку SITE_LANGS) */
export const routeLangs = (route) => SITE_LANGS.filter((l) => hasLang(route, l));

/** URL для мови із запасним варіантом: обрана мова → en → uk */
export const langUrl = (route, lang) => route?.[lang] || route?.en || route?.uk;

/** Адреса для hreflang="x-default": англійська, а якщо її немає — українська */
export const xDefaultPath = (route) => route.en || route.uk;

/** Маршрути, доступні в цій мові */
export const routesForLang = (routes, lang) => routes.filter((r) => hasLang(r, lang));

const normalize = (p) => (p && p.length > 1 ? p.replace(/\/+$/, "") : p);

/** Знаходить маршрут за поточним pathname (у будь-якій мові; без урахування кінцевого "/") */
export const findRouteByPath = (routes, pathname) => {
  const path = normalize(pathname);
  return routes.find((r) => SITE_LANGS.some((l) => r[l] && normalize(r[l]) === path));
};

/**
 * Куди вести при зміні мови: відповідник сторінки в обраній мові, а якщо
 * такого немає (сторінка існує не в усіх мовах) — головна сторінка цієї мови.
 */
export const switchLanguageTarget = (routes, pathname, code) => {
  const route = findRouteByPath(routes, pathname);
  return (route && route[code]) || HOME_PATHS[code] || "/";
};

/** Записи для <link rel="alternate" hreflang>: лише наявні мови + x-default */
export const hreflangEntries = (route) => [
  ...routeLangs(route).map((l) => ({ hrefLang: l, path: route[l] })),
  { hrefLang: "x-default", path: xDefaultPath(route) },
];
