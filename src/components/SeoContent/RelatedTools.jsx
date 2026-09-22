import { useTranslation } from "react-i18next";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { RELATED, toolBySlug } from "../../toolsCatalog";
import { usePageLang } from "../../hooks/usePageLang";
import { hasLang } from "../../utils/routeLangs";
import "./RelatedTools.css";

/**
 * Блок "Схожі інструменти" під SEO-текстом: звичайні <a href> з описовим
 * текстом — внутрішня перелінковка для користувача й для пошукових ботів.
 */
const RelatedTools = ({ current }) => {
  const { t } = useTranslation();
  const lang = usePageLang();
  // Радимо лише ті інструменти, які існують у мові цієї сторінки
  const slugs = (RELATED[current] || []).filter((slug) =>
    hasLang(ROUTES.find((r) => r.slug === slug), lang)
  );
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
          return (
            <li key={slug}>
              <LocalizedLink to={route.uk} className="related-tools__item">
                <span className="related-tools__name">{t(tool.nameKey)}</span>
                <span className="related-tools__desc">{t(tool.descKey)}</span>
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default RelatedTools;
