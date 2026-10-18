import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiSearch,
  FiX,
  FiMinimize2,
  FiRepeat,
  FiEdit3,
  FiFileText,
  FiVideo,
  FiCornerDownLeft,
} from "react-icons/fi";
import { TOOLS } from "../../toolsCatalog";
import { ROUTES } from "../../routes";
import { categoryForSlug } from "../../toolsCategories";
import { usePageLang } from "../../hooks/usePageLang";
import { hasLang, langUrl } from "../../utils/routeLangs";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { trackEvent } from "../analytics";
import { TOOL_KEYWORDS, rankTools } from "./toolSearch";
import "./ToolSearch.css";

const CATEGORY_ICONS = {
  compress: FiMinimize2,
  convert: FiRepeat,
  edit: FiEdit3,
  docs: FiFileText,
};

const VIDEO_SLUGS = ["compressVideo", "convertMovToMp4", "convertMkvToMp4", "convertWebmToMp4"];

/**
 * Пошук інструментів (round 33): Ctrl/Cmd+K або кнопка в хедері.
 * Модальний діалог з полем-комбобоксом і списком результатів
 * (role="listbox"): ↑/↓ — вибір, Enter — перейти, Esc — закрити.
 * Фокус тримається всередині (useFocusTrap) і повертається на кнопку
 * після закриття.
 */
const ToolSearch = ({ isOpen, onClose }) =>
  // Діалог монтується лише відкритим — тож кожне відкриття починається
  // з порожнього поля без скидання стану в ефекті.
  isOpen ? <ToolSearchDialog onClose={onClose} /> : null;

const ToolSearchDialog = ({ onClose }) => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useFocusTrap(dialogRef, true, onClose);

  // Сторінка під діалогом не скролиться
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Лише інструменти, що мають сторінку в мові поточної сторінки
  const items = useMemo(
    () =>
      TOOLS.map((tool) => {
        const route = ROUTES.find((r) => r.slug === tool.slug);
        if (!route || !hasLang(route, lang)) return null;
        return {
          slug: tool.slug,
          name: t(tool.nameKey),
          desc: t(tool.descKey),
          keywords: TOOL_KEYWORDS[tool.slug] || "",
          url: langUrl(route, lang),
        };
      }).filter(Boolean),
    [t, lang]
  );

  const results = useMemo(() => rankTools(query, items), [query, items]);
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  // Активний пункт завжди у видимій частині списку
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, results]);

  const go = (item) => {
    if (!item) return;
    trackEvent("tool_search_select", { tool: item.slug });
    onClose();
    navigate(item.url);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (Math.min(i, results.length - 1) + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        results.length
          ? (Math.min(i, results.length - 1) - 1 + results.length) % results.length
          : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIndex]);
    }
  };

  const optionId = (i) => `${listId}-opt-${i}`;

  return (
    <div className="tool-search" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="tool-search__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t("header.searchAria")}
      >
        <div className="tool-search__field">
          <FiSearch size={20} className="tool-search__field-icon" aria-hidden="true" />
          <input
            data-autofocus
            className="tool-search__input"
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? optionId(activeIndex) : undefined}
            aria-label={t("header.searchAria")}
            placeholder={t("header.searchPlaceholder")}
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="tool-search__close"
            onClick={onClose}
            aria-label={t("header.searchClose")}
          >
            <FiX size={20} />
          </button>
        </div>

        <ul id={listId} ref={listRef} role="listbox" className="tool-search__list">
          {results.map((item, i) => {
            const category = categoryForSlug(item.slug);
            const Icon = VIDEO_SLUGS.includes(item.slug)
              ? FiVideo
              : CATEGORY_ICONS[category?.id] || FiMinimize2;
            const color = VIDEO_SLUGS.includes(item.slug)
              ? "accent"
              : category?.colorVar || "primary";
            return (
              <li
                key={item.slug}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={i === activeIndex}
                className={`tool-search__item tool-search__item--${color}${
                  i === activeIndex ? " tool-search__item--active" : ""
                }`}
                onMouseMove={() => i !== activeIndex && setActive(i)}
                onClick={() => go(item)}
              >
                <span className="tool-search__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="tool-search__text">
                  <span className="tool-search__name">{item.name}</span>
                  <span className="tool-search__desc">{item.desc}</span>
                </span>
                {i === activeIndex && (
                  <FiCornerDownLeft size={16} className="tool-search__enter" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>

        {results.length === 0 && (
          <p className="tool-search__empty" role="status">
            {t("header.searchNoResults")}
          </p>
        )}

        <p className="tool-search__hint">{t("header.searchHint")}</p>
      </div>
    </div>
  );
};

export default ToolSearch;
