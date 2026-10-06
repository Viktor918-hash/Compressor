import "./LegalPage.css";
import SeoHead from "../Seo/SeoHead";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { LEGAL_CONTENT, LAST_UPDATED } from "./legalContent";

/**
 * Загальний рендерер для довір-сторінок (Privacy/Terms/Contact/About).
 * Контент — у legalContent.js (не через i18n: великі блоки прози, а не
 * UI-рядки, що повторюються). Доступні лише uk+en (routes.config.js).
 */
const LegalPage = ({ slug }) => {
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === slug);
  const content = LEGAL_CONTENT[slug]?.[lang] || LEGAL_CONTENT[slug]?.uk;

  if (!content) return null;

  return (
    <>
      <SeoHead route={route} lang={lang} />
      <main className="legal-page container">
        <article className="legal-page__article">
          <h1 className="legal-page__title">{content.title}</h1>
          {slug !== "contact" && slug !== "about" && (
            <p className="legal-page__updated">{LAST_UPDATED[lang] || LAST_UPDATED.uk}</p>
          )}
          {content.intro && <p className="legal-page__intro">{content.intro}</p>}
          {content.sections.map((section, i) => (
            <section className="legal-page__section" key={i}>
              <h2 className="legal-page__heading">{section.heading}</h2>
              {section.paragraphs?.map((p, j) => (
                <p className="legal-page__paragraph" key={j}>
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="legal-page__list">
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
    </>
  );
};

export default LegalPage;
