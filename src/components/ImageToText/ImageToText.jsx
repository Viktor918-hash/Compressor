import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import {
  extractOcrData,
  buildOcrOutput,
  getOcrOutputName,
  OCR_OUTPUT_FORMATS,
} from "./imageToText";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const ImageToText = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "imageToText");
  const meta = PAGE_META.imageToText[lang];

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
          "image/jpeg": [],
          "image/png": [],
          "image/webp": [],
          "image/bmp": [],
        }}
        processFile={extractOcrData}
        buildOutput={buildOcrOutput}
        getOutputName={getOcrOutputName}
        formats={OCR_OUTPUT_FORMATS}
        defaultFormatId="txt"
        dropzoneText={t("imageToText.dropzone")}
        // Розпізнавання йде прямо в браузері без сервера — ліміту на день
        // немає, тому maxFiles тут лише практичне обмеження одного разу.
        maxFiles={20}
        maxFileSize={15 * 1024 * 1024}
        showStats={false}
        emptyStateText={t("imageToText.panel.emptyState")}
        addMoreText={t("imageToText.panel.addMore")}
        addMoreAriaLabel={t("imageToText.panel.addMoreAria")}
        selectedLabel={t("imageToText.panel.selected")}
        downloadOneText={t("imageToText.panel.downloadOne")}
        downloadManyText={t("imageToText.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("imageToText.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("imageToText.titlePart2")}
          <span className="title__gradient">
            {" "}
            {t("imageToText.titleGradient")}
          </span>
        </h1>
        <p className="main__text">{t("imageToText.text1")}</p>
        <p className="main__text">{t("imageToText.text2")}</p>
      </Panel>
      <SeoContent pageKey="imageToText" />
    </>
  );
};

export default ImageToText;
