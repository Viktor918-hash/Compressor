import { useTranslation } from "react-i18next";
import { FiMinimize2, FiRepeat, FiEdit3, FiFileText, FiChevronRight, FiVideo } from "react-icons/fi";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { RELATED, toolBySlug } from "../../toolsCatalog";
import { categoryForSlug } from "../../toolsCategories";
import { usePageLang } from "../../hooks/usePageLang";
import { pickTryAlsoSlugs } from "./relatedToolsPicker";
import "./TryAlsoInline.css";

// Ті самі іконки категорій, що й RelatedTools/ToolsCategories — немає
// сенсу вигадувати новий набір для того самого набору інструментів.
const CATEGORY_ICONS = {
  compress: FiMinimize2,
  convert: FiRepeat,
  edit: FiEdit3,
  docs: FiFileText,
  video: FiVideo,
};

// До 2 пропозицій: блок живе у вузькій бічній панелі одразу під кнопкою
// завантаження, а не на всю ширину сторінки — компактність навмисна
// (round 25). Перша пропозиція (найдоречніша за toolsCatalog.js::RELATED)
// отримує акцентне оформлення + бейдж "найчастіше" (round 32 — редизайн,
// затверджений ескізом), щоб одразу притягувати погляд саме до неї.
const MAX_SUGGESTIONS = 2;

/**
 * Компактний блок "Спробуйте також" — рендериться в бічній панелі
 * (Panel.jsx) одразу під кнопкою завантаження результату, щойно результат
 * готовий. На відміну від RelatedTools (під SEO-текстом унизу сторінки),
 * цей блок бачить і той користувач, що завантажує файл і одразу закриває
 * вкладку, не долистуючи сторінку.
 *
 * @param {{ current?: string }} props - slug поточного інструмента
 * (toolsCatalog.js). Без current, або коли для нього немає кандидатів у
 * поточній мові — безпечний no-op (null).
 */
const TryAlsoInline = ({ current }) => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const slugs = current ? pickTryAlsoSlugs(current, lang, RELATED, MAX_SUGGESTIONS) : [];
  if (slugs.length === 0) return null;

  return (
    <nav className="try-also" aria-labelledby="try-also-title">
      <div className="try-also__head">
        <span className="try-also__emoji" aria-hidden="true">
          ✨
        </span>
        <span className="try-also__head-text">
          <span className="try-also__title" id="try-also-title">
            {t("related.tryAlsoTitle")}
          </span>
          <span className="try-also__subtitle">{t("related.tryAlsoSubtitle")}</span>
        </span>
      </div>

      <ul className="try-also__list">
        {slugs.map((slug, index) => {
          const tool = toolBySlug(slug);
          const route = ROUTES.find((r) => r.slug === slug);
          if (!tool || !route) return null;
          const category = categoryForSlug(slug);
          const colorVar = index === 0 ? "accent" : category?.colorVar || "primary";
          const Icon = CATEGORY_ICONS[category?.id] || FiMinimize2;
          return (
            <li key={slug} className="try-also__item-wrap">
              <LocalizedLink
                to={route.uk}
                className={`try-also__item try-also__item--${colorVar}`}
                style={{ animationDelay: `${180 + index * 80}ms` }}
              >
                <span className="try-also__icon-wrap" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="try-also__text">
                  <span className="try-also__name-row">
                    <span className="try-also__name">{t(tool.nameKey)}</span>
                    {index === 0 && (
                      <span className="try-also__badge">{t("related.mostPopular")}</span>
                    )}
                  </span>
                  <span className="try-also__desc">{t(tool.descKey)}</span>
                </span>
                <FiChevronRight size={18} className="try-also__chevron" aria-hidden="true" />
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TryAlsoInline;
