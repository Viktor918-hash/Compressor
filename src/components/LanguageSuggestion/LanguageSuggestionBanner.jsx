import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { switchLanguageTarget, langFromPath } from "../../utils/routeLangs";
import "./LanguageSuggestionBanner.css";
import { getConsent, CONSENT_EVENT } from "../../utils/consent";

const STORAGE_KEY = "lang-banner-dismissed";

// Текст банера для кожної мови, яку МОЖЕМО ЗАПРОПОНУВАТИ (тобто всі мови
// сайту, крім тієї, на якій зараз перебуває користувач, підставляється
// динамічно нижче).
const BANNER_TEXT = {
  uk: {
    message: "Схоже, ви користуєтесь українською — перемкнути мову?",
    action: "Так, українською",
  },
  en: {
    message: "It looks like your browser is in English — switch language?",
    action: "Switch to English",
  },
  es: {
    message: "Parece que tu navegador está en español — ¿cambiar el idioma?",
    action: "Cambiar a español",
  },
  ru: {
    message: "Похоже, вы используете русский — переключить язык?",
    action: "Переключить",
  },
};

// Визначає, яку мову сайту запропонувати на основі мови браузера.
// Розширюйте цю мапу, якщо додаєте нові мови сайту.
const detectSuggestedLang = (browserLang) => {
  if (browserLang.startsWith("uk")) return "uk";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("ru")) return "ru";
  // Для будь-якої іншої мови браузера (fr, de, pl, ...) пропонуємо
  // English — вона зрозуміліша міжнародній аудиторії за замовчуванням.
  return "en";
};

const LanguageSuggestionBanner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  const currentLangCode = langFromPath(location.pathname);

  const browserLang =
    typeof navigator !== "undefined" ? navigator.language?.toLowerCase() : "";
  const suggestedLangCode = detectSuggestedLang(browserLang);
  const shouldSuggest = suggestedLangCode !== currentLangCode;

  // Не показуємо разом із банером згоди (обидва fixed унизу): спершу
  // користувач робить вибір щодо cookies, потім бачить пропозицію мови.
  const [consentChosen, setConsentChosen] = useState(false);
  useEffect(() => {
    setConsentChosen(getConsent() !== null);
    const onChange = () => setConsentChosen(true);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    // localStorage може кидати виняток (приватний режим, заблоковані дані)
    let dismissed = null;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ігноруємо — просто покажемо банер
    }
    setVisible(!dismissed && shouldSuggest && consentChosen);
  }, [shouldSuggest, consentChosen]);

  const switchLanguage = () => {
    // відповідник сторінки в запропонованій мові, а якщо його немає — головна
    const targetPath = switchLanguageTarget(ROUTES, location.pathname, suggestedLangCode);
    if (targetPath) navigate(targetPath);
    setVisible(false);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // без localStorage відмова діє лише до перезавантаження
    }
    setVisible(false);
  };

  if (!visible) return null;

  const text = BANNER_TEXT[suggestedLangCode];

  return (
    <div className="lang-banner">
      <span>{text.message}</span>
      <div className="lang-banner__actions">
        <button type="button" onClick={switchLanguage}>
          {text.action}
        </button>
        <button
          type="button"
          className="lang-banner__dismiss"
          onClick={dismiss}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default LanguageSuggestionBanner;
