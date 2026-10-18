import { useTranslation } from "react-i18next";
import { FiMinimize2, FiRepeat, FiEdit3, FiFileText } from "react-icons/fi";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { RELATED, toolBySlug } from "../../toolsCatalog";
import { categoryForSlug } from "../../toolsCategories";
import { usePageLang } from "../../hooks/usePageLang";
import { availableRelatedSlugs } from "./relatedToolsPicker";
import "./RelatedTools.css";

// Ті самі іконки й кольори категорій, що й на сітці головної сторінки
// (ToolsCategories) — щоб картки "Схожих інструментів" виглядали як
// продовження того самого блоку, а не окремий плоский список.
const CATEGORY_ICONS = {
  compress: FiMinimize2,
  convert: FiRepeat,
  edit: FiEdit3,
  docs: FiFileText,
};

/**
 * Блок "Схожі інструменти" під SEO-текстом: звичайні <a href> з описовим
 * текстом — внутрішня перелінковка для користувача й для пошукових ботів.
 */
const RelatedTools = ({ current }) => {
  const { t } = useTranslation();
  const lang = usePageLang();
  // Радимо лише ті інструменти, які існують у мові цієї сторінки
  // (та сама перевірка, що й у компактному TryAlsoInline — relatedToolsPicker.js)
  const slugs = availableRelatedSlugs(current, lang, RELATED);
  if (slugs.length === 0) return null;

  return (
    <nav className="related-tools" aria-labelledby="related-tools-title">
      <h2 className="related-tools__title" id="related-tools-title">
        {t("related.title")}
      </h2>
      <ul className="related-tools__list">
        {slugs.map((slug) => {
          const tool = toolBySlug(slug);
          const route = ROUTES.find((r) => r.slug === slug);
          if (!tool || !route) return null;
          const category = categoryForSlug(slug);
          const colorVar = category?.colorVar || "primary";
          const Icon = CATEGORY_ICONS[category?.id] || FiMinimize2;
          return (
            <li key={slug}>
              <LocalizedLink
                to={route.uk}
                className={`related-tools__item related-tools__item--${colorVar}`}
              >
                <span className="related-tools__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="related-tools__text">
                  <span className="related-tools__name">
                    {t(tool.nameKey)}
                  </span>
                  <span className="related-tools__desc">
                    {t(tool.descKey)}
                  </span>
                </span>
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default RelatedTools;
