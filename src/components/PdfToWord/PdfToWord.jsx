import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import { convertPdfToWord, getDocxOutputName } from "./convertPdfToWord";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const PdfToWord = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "pdfToWord");
  const meta = PAGE_META.pdfToWord[lang];

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
        acceptedTypes={{
          "application/pdf": [".pdf"],
        }}
        processFile={convertPdfToWord}
        getOutputName={getDocxOutputName}
        onLimitReached={handleLimitReached}
        dropzoneText={t("pdfToWord.dropzone")}
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
        emptyStateText={t("pdfToWord.panel.emptyState")}
        addMoreText={t("pdfToWord.panel.addMore")}
        addMoreAriaLabel={t("pdfToWord.panel.addMoreAria")}
        selectedLabel={t("pdfToWord.panel.selected")}
        downloadOneText={t("pdfToWord.panel.downloadOne")}
        downloadManyText={t("pdfToWord.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("pdfToWord.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("pdfToWord.titlePart2")}
          <span className="title__gradient">
            {" "}
            {t("pdfToWord.titleGradient")}
          </span>
        </h1>
        <p className="main__text">{t("pdfToWord.text1")}</p>
        <p className="main__text">{t("pdfToWord.text2")}</p>
      </Panel>
      <SeoContent pageKey="pdfToWord" />
    </>
  );
};

export default PdfToWord;
