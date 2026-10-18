import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import { convertWordToPdf, getPdfOutputName } from "./convertWordToPdf";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const WordToPdf = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "wordToPdf");
  const meta = PAGE_META.wordToPdf[lang];

  // Коли гість вичерпав денний ліміт — одразу пропонуємо зареєструватись:
  // відкриваємо AuthModal через кастомну подію, яку слухає Header
  // (без прямого зв'язку між компонентами).
  const handleLimitReached = (error) => {
    if (error.isGuest) {
      window.dispatchEvent(new CustomEvent("open-register-modal"));
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <Panel
        currentSlug="wordToPdf"
        acceptedTypes={{
          "application/msword": [".doc"],
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            [".docx"],
        }}
        processFile={convertWordToPdf}
        getOutputName={getPdfOutputName}
        onLimitReached={handleLimitReached}
        dropzoneText={t("wordToPdf.dropzone")}
        maxFiles={10}
        // P0-6 (раунд 20): файл тепер вантажиться напряму в CloudConvert,
        // не через нашу Vercel-функцію — ліміт 4,5 МБ тіла запиту більше
        // не застосовується. 50 МБ — бізнес-параметр (не технічний), див.
        // claude/compressphoto-cloudconvert-direct-upload-spec.md.
        maxFileSize={50 * 1024 * 1024}
        showStats={false}
        // Файл реально йде на CloudConvert (бекенд) — не показуємо рядок
        // "файли не йдуть на сервер", це було б неправдою.
        showEmptyTrust={false}
        emptyStateText={t("wordToPdf.panel.emptyState")}
        addMoreText={t("wordToPdf.panel.addMore")}
        addMoreAriaLabel={t("wordToPdf.panel.addMoreAria")}
        selectedLabel={t("wordToPdf.panel.selected")}
        downloadOneText={t("wordToPdf.panel.downloadOne")}
        downloadManyText={t("wordToPdf.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("wordToPdf.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("wordToPdf.titlePart2")}
          <span className="title__gradient">
            {" "}
            {t("wordToPdf.titleGradient")}
          </span>
        </h1>
        <p className="main__text">{t("wordToPdf.text1")}</p>
        <p className="main__text">{t("wordToPdf.text2")}</p>
        <p className="main__text">{t("wordToPdf.text3")}</p>
      </Panel>
      <SeoContent pageKey="wordToPdf" />
    </>
  );
};

export default WordToPdf;
