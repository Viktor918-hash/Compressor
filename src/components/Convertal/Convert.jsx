import "./Conver.css";
import Panel from "../PanelFile/Panel";
import { convertToJpg, getJpgOutputName } from "./convertToJpg";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const Convertal = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "convert");
  const meta = PAGE_META.convert[lang];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "PhotoEditingApplication",
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
        currentSlug="convert"
        acceptedTypes={{
          "image/png": [],
          "image/webp": [],
          "image/bmp": [],
          "image/heic": [],
          "image/heif": [],
          "": [".heic", ".heif"], // деякі браузери не дають MIME-тип HEIC — приймаємо і за розширенням
        }}
        processFile={convertToJpg}
        getOutputName={getJpgOutputName}
        dropzoneText={t("convert.dropzone")}
        showStats={false}
      >
        <h1 className="main__title">
          {t("convert.titlePart2")}
          <span className="title__gradient"> {t("convert.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("convert.text1")}</p>
        <p className="main__text">{t("convert.text2")}</p>
      </Panel>
      <SeoContent pageKey="convert" />
    </>
  );
};

export default Convertal;
