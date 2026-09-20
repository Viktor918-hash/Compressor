import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { FiZap, FiShield, FiSmartphone, FiCheckCircle, FiChevronDown } from "react-icons/fi";
import RelatedTools from "./RelatedTools";
import "./SeoContent.css";

// Іконки для 4 карток переваг — однаковий набір на всіх сторінках,
// текст під кожну іконку унікальний для конкретного інструмента
// (див. src/i18n/locales/*/translation.json → seoContent.<pageKey>.benefits).
const BENEFIT_ICONS = [FiZap, FiShield, FiCheckCircle, FiSmartphone];

/**
 * SEO-блок "навіщо це потрібно" + переваги + FAQ, який ставиться між
 * drop zone і футером на кожній інструментальній сторінці:
 *   <Panel>...</Panel>
 *   <SeoContent pageKey="convert" />
 *
 * pageKey відповідає ключу в seoMeta.js / ROUTES (home, convert, resize,
 * webp, presets, wordToPdf, pdfToWord, removeBg, imageToText) і ключу
 * seoContent.<pageKey> у translation.json.
 *
 * Додає розмітку FAQPage (JSON-LD) — Google може показати розширений
 * сніпет із питаннями прямо у видачі пошуку.
 */
const SeoContent = ({ pageKey }) => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);

  const title = t(`seoContent.${pageKey}.title`);
  const text1 = t(`seoContent.${pageKey}.text1`);
  const text2 = t(`seoContent.${pageKey}.text2`);
  const benefits = t(`seoContent.${pageKey}.benefits`, { returnObjects: true });
  const faq = t(`seoContent.${pageKey}.faq`, { returnObjects: true });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: Array.isArray(faq)
      ? faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        }))
      : [],
  };

  return (
    <section className="seo-content">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="seo-content__wrapper">
        <h2 className="seo-content__title">{title}</h2>
        <p className="seo-content__text">{text1}</p>
        <p className="seo-content__text">{text2}</p>

        {Array.isArray(benefits) && benefits.length > 0 && (
          <div className="seo-content__benefits">
            {benefits.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
              return (
                <div className="seo-content__benefit" key={benefit.title}>
                  <div className="seo-content__benefit-icon">
                    <Icon size={22} />
                  </div>
                  <h3 className="seo-content__benefit-title">{benefit.title}</h3>
                  <p className="seo-content__benefit-text">{benefit.text}</p>
                </div>
              );
            })}
          </div>
        )}

        {Array.isArray(faq) && faq.length > 0 && (
          <div className="seo-content__faq">
            <h2 className="seo-content__faq-title">
              {t("seoContent.faqTitle", "Питання та відповіді")}
            </h2>
            <div className="seo-content__faq-list">
              {faq.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    className={`seo-content__faq-item ${
                      isOpen ? "seo-content__faq-item--open" : ""
                    }`}
                    key={item.q}
                  >
                    <button
                      type="button"
                      className="seo-content__faq-question"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <FiChevronDown
                        size={20}
                        className="seo-content__faq-chevron"
                      />
                    </button>
                    {/* Відповідь завжди в DOM (лише прихована): текст, що є в
                        розмітці FAQPage, має бути на сторінці й для ботів */}
                    <p className="seo-content__faq-answer" hidden={!isOpen}>
                      {item.a}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <RelatedTools current={pageKey} />
      </div>
    </section>
  );
};

export default SeoContent;
