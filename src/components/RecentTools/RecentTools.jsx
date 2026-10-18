import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMinimize2, FiRepeat, FiEdit3, FiFileText, FiVideo, FiChevronRight, FiClock } from "react-icons/fi";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { TOOLS, toolBySlug } from "../../toolsCatalog";
import { categoryForSlug } from "../../toolsCategories";
import { usePageLang } from "../../hooks/usePageLang";
import { hasLang } from "../../utils/routeLangs";
import { loadRecent, pickRecent, settingsSummary, clearRecentAndSettings } from "../../utils/recentTools";
import "./RecentTools.css";

const CATEGORY_ICONS = {
  compress: FiMinimize2,
  convert: FiRepeat,
  edit: FiEdit3,
  docs: FiFileText,
};
const VIDEO_SLUGS = ["compressVideo", "convertMovToMp4", "convertMkvToMp4", "convertWebmToMp4"];
const KNOWN = TOOLS.map((tool) => tool.slug);

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * "Ваші інструменти" (round 34) — до 3 нещодавно відкритих інструментів
 * на головній з підсумком збережених налаштувань. Лише localStorage,
 * без акаунта; кнопка "Очистити" стирає і список, і налаштування.
 * Новому відвідувачу (порожня історія) блок не показується взагалі.
 */
const RecentTools = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const [recent, setRecent] = useState(() =>
    pickRecent(loadRecent(), { exclude: ["home"], limit: 3, known: KNOWN })
  );

  const items = recent
    .map((slug) => {
      const tool = toolBySlug(slug);
      const route = ROUTES.find((r) => r.slug === slug);
      if (!tool || !route || !hasLang(route, lang)) return null;
      return { slug, tool, route, summary: settingsSummary(slug, readStorage, t) };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  const clear = () => {
    clearRecentAndSettings();
    setRecent([]);
  };

  return (
    <section className="recent-tools container" aria-labelledby="recent-tools-title">
      <div className="recent-tools__head">
        <div>
          <h2 className="recent-tools__title" id="recent-tools-title">
            <FiClock size={20} aria-hidden="true" />
            {t("recentTools.title")}
          </h2>
          <p className="recent-tools__subtitle">{t("recentTools.subtitle")}</p>
        </div>
        <button
          type="button"
          className="recent-tools__clear"
          onClick={clear}
          aria-label={t("recentTools.clearAria")}
        >
          {t("recentTools.clear")}
        </button>
      </div>
      <ul className="recent-tools__list">
        {items.map(({ slug, tool, route, summary }) => {
          const category = categoryForSlug(slug);
          const isVideo = VIDEO_SLUGS.includes(slug);
          const Icon = isVideo ? FiVideo : CATEGORY_ICONS[category?.id] || FiMinimize2;
          const color = isVideo ? "accent" : category?.colorVar || "primary";
          return (
            <li key={slug}>
              <LocalizedLink to={route.uk} className={`recent-tools__item recent-tools__item--${color}`}>
                <span className="recent-tools__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="recent-tools__text">
                  <span className="recent-tools__name">{t(tool.nameKey)}</span>
                  <span className="recent-tools__meta">{summary || t(tool.descKey)}</span>
                </span>
                <FiChevronRight size={18} className="recent-tools__chevron" aria-hidden="true" />
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default RecentTools;
