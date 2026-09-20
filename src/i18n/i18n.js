import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/**
 * Мова контенту визначається ВИКЛЮЧНО з URL (/, /en/…, /ru/…, /es/…) —
 * так Google бачить на кожній адресі одну мову, а користувач не бачить
 * "мигання" (раніше LanguageDetector спершу брав мову браузера, а <LangSync>
 * через мить міняв її на мову сторінки).
 *
 * Пакети перекладів завантажуються ліниво: на старті — лише мова поточної
 * сторінки (~30–45 КБ), решта підвантажується при першому переході на неї
 * (або коли користувач відкрив перемикач мови).
 */
export const SUPPORTED_LANGS = ["uk", "en", "ru", "es"];

export const langFromPath = (pathname = "/") => {
  if (pathname === "/es" || pathname.startsWith("/es/")) return "es";
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/ru" || pathname.startsWith("/ru/")) return "ru";
  return "uk";
};

const loaders = {
  uk: () => import("./locales/uk/translation.json"),
  en: () => import("./locales/en/translation.json"),
  ru: () => import("./locales/ru/translation.json"),
  es: () => import("./locales/es/translation.json"),
};

async function loadBundle(lng) {
  if (i18n.hasResourceBundle(lng, "translation")) return;
  const mod = await loaders[lng]();
  i18n.addResourceBundle(lng, "translation", mod.default ?? mod, true, true);
}

/** Завантажує пакет мови й перемикає на неї (для переходів між мовами). */
export async function setLanguage(lng) {
  if (!SUPPORTED_LANGS.includes(lng)) return;
  await loadBundle(lng);
  if (i18n.language !== lng) await i18n.changeLanguage(lng);
}

/** Підвантажує решту мов наперед (наприклад, коли відкрито перемикач мови). */
export function preloadLocales() {
  return Promise.all(SUPPORTED_LANGS.map((l) => loadBundle(l).catch(() => {})));
}

/**
 * Ініціалізація: чекаємо лише пакет мови поточного URL. main.jsx рендерить
 * застосунок після цього проміса, тож перший кадр уже з правильною мовою.
 */
export const i18nReady = (async () => {
  const lng = langFromPath(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const mod = await loaders[lng]();
  await i18n.use(initReactI18next).init({
    lng,
    resources: { [lng]: { translation: mod.default ?? mod } },
    partialBundledLanguages: true, // решта мов додається пізніше через addResourceBundle
    fallbackLng: "uk",
    supportedLngs: SUPPORTED_LANGS,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
})();

export default i18n;
