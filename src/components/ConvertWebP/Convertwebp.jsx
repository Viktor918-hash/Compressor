import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import { convertToWebp, getWebpOutputName } from "./convertToWebp";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const ConvertWebp = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "webp");
  const meta = PAGE_META.webp[lang];

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
        acceptedTypes={{
          "image/jpeg": [],
          "image/png": [],
          "image/bmp": [],
          "image/heic": [],
          "image/heif": [],
          "": [".heic", ".heif"], // деякі браузери не дають MIME-тип HEIC — приймаємо і за розширенням
        }}
        processFile={(file) => convertToWebp(file, 0.85)}
        getOutputName={getWebpOutputName}
        dropzoneText={t("hero.dropzone")}
        showStats={false}
      >
        <h1 className="main__title">
          {t("convertWebp.titlePart2")}

          <span className="title__gradient">
            {t("convertWebp.titleGradient")}
          </span>
        </h1>
        <p className="main__text">{t("convertWebp.text1")}</p>
        <p className="main__text">{t("convert.text2")}</p>
      </Panel>
      <SeoContent pageKey="webp" />
    </>
  );
};

export default ConvertWebp;
