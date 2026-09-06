import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import uk from "./locales/uk/translation.json";
import en from "./locales/en/translation.json";
import ru from "./locales/ru/translation.json";
import es from "./locales/es/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uk: { translation: uk },
      en: { translation: en },
      ru: { translation: ru },
      es: { translation: es },
    },
    fallbackLng: "uk", // uk — основна мова контенту/аудиторії
    supportedLngs: ["uk", "en", "ru", "es"],
    detection: {
      // ВАЖЛИВО: мову контенту тепер визначає URL (/ або /en/...) через
      // <LangSync> в App.jsx, а не цей детектор. localStorage/navigator
      // тут лишились лише для LanguageSuggestionBanner (підказка юзеру
      // "перемкнутись на English?"), а не для автоматичної підміни
      // контенту на одній адресі — це і ламало SEO.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
