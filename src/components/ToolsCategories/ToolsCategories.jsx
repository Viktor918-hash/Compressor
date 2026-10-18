import { useTranslation } from "react-i18next";
import { FiMinimize2, FiRepeat, FiEdit3, FiFileText, FiVideo } from "react-icons/fi";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { toolBySlug } from "../../toolsCatalog";
import { TOOL_CATEGORIES } from "../../toolsCategories";
import { usePageLang } from "../../hooks/usePageLang";
import { hasLang } from "../../utils/routeLangs";
import "./ToolsCategories.css";

const CATEGORY_ICONS = {
  compress: FiMinimize2,
  convert: FiRepeat,
  edit: FiEdit3,
  docs: FiFileText,
  video: FiVideo,
};

/**
 * Категоризована сітка всіх 16 інструментів на головній (розділ 5
 * дизайн-документа) — замінює плаский список: 4 групи, кожна зі своєю
 * кольоровою іконкою й підзаголовком, замість однакових на вигляд карток
 * без структури. Кольори — семантичні токени tokens.css (жодних нових).
 */
const ToolsCategories = () => {
  const { t } = useTranslation();
  const lang = usePageLang();

  return (
    <section
      className="tools-categories"
      aria-labelledby="tools-categories-title"
    >
      <h2 className="tools-categories__title" id="tools-categories-title">
        {t("home.categories.title")}
      </h2>

      {TOOL_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category.id];
        const slugs = category.slugs.filter((slug) =>
          hasLang(ROUTES.find((r) => r.slug === slug), lang)
        );
        if (slugs.length === 0) return null;

        return (
          <div
            key={category.id}
            className={`tools-category tools-category--${category.colorVar}`}
          >
            <div className="tools-category__header">
              <span className="tools-category__icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <div>
                <h3 className="tools-category__name">
                  {t(category.titleKey)}
                </h3>
                <p className="tools-category__subtitle">
                  {t(category.subtitleKey)}
                </p>
              </div>
            </div>

            <ul className="tools-category__list">
              {slugs.map((slug) => {
                const tool = toolBySlug(slug);
                const route = ROUTES.find((r) => r.slug === slug);
                if (!tool || !route) return null;
                return (
                  <li key={slug}>
                    <LocalizedLink
                      to={route.uk}
                      className="tools-category__item"
                    >
                      <span className="tools-category__item-name">
                        {t(tool.nameKey)}
                      </span>
                      <span className="tools-category__item-desc">
                        {t(tool.descKey)}
                      </span>
                    </LocalizedLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
};

export default ToolsCategories;
