import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import "./LanguageSwitcher.css";
import { useTranslation } from "react-i18next";
import { preloadLocales } from "../../i18n/i18n";
import { switchLanguageTarget, langFromPath } from "../../utils/routeLangs";

// Відредагуйте список під ваші мови (код має збігатися з тим, що в i18n.resources)
const LANGUAGES = [
  { code: "uk", label: "Українська", short: "UK" },
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "es", label: "Español", short: "ES" },
];

export default function LanguageSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const { t } = useTranslation();

  // Мова визначається з URL, а не з i18n.language напряму — так кнопка
  // завжди показує мову ЦІЄЇ конкретної сторінки, без затримки/розсинхрону.
  const currentLangCode = langFromPath(location.pathname);

  const currentLang =
    LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  // Коли відкрито перемикач — підвантажуємо решту мов, щоб перехід був миттєвим
  useEffect(() => {
    if (isOpen) preloadLocales();
  }, [isOpen]);

  // Слідкуємо за шириною екрана, щоб перемикати dropdown <-> bottom sheet
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Закриття по кліку поза меню та по Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Блокуємо скрол фону, коли на мобільному відкритий bottom sheet
  useEffect(() => {
    if (isOpen && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, isMobile]);

  const handleSelect = (code) => {
    if (code !== currentLang.code) {
      // Знаходимо відповідник поточної сторінки для обраної мови і
      // навігуємо туди — мова контенту зміниться сама через <LangSync>
      // в App.jsx, коли зміниться URL. НЕ викликаємо i18n.changeLanguage()
      // напряму, бо це підмінить мову на поточному URL без зміни адреси
      // (саме та проблема, через яку Google бачив лише одну версію сайту).
      // Якщо сторінки в обраній мові немає (інструмент лише в частині мов) —
      // ведемо на головну цієї мови.
      const targetPath = switchLanguageTarget(ROUTES, location.pathname, code);
      navigate(targetPath);
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="ls-wrapper" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="ls-trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("header.language")}
      >
        <GlobeIcon />
        <span className="ls-trigger-label">{currentLang.short}</span>
      </button>

      {isOpen && isMobile && (
        <div
          className="ls-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <ul role="listbox" className={isMobile ? "ls-sheet" : "ls-dropdown"}>
          {isMobile && <li className="ls-sheet-handle" aria-hidden="true" />}
          {isMobile && (
            <li className="ls-sheet-title">
              {" "}
              {t("header.language")} / Language
            </li>
          )}

          {LANGUAGES.map((lang) => {
            const active = lang.code === currentLang.code;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`ls-option${active ? " ls-option-active" : ""}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  <span className="ls-option-code">{lang.short}</span>
                  <span className="ls-option-label">{lang.label}</span>
                  {active && <CheckIcon />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
