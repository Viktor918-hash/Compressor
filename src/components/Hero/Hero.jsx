import Panel from "../PanelFile/Panel";
import imageCompression from "browser-image-compression";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";

const compressImage = (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  return imageCompression(file, options);
};

// JSON-LD structured data (schema.org) — допомагає Google краще розуміти
// тип сайту й іноді додає розширені елементи у видачі (наприклад рейтинг).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CompressPhoto",
  url: "https://compressphoto.org",
  applicationCategory: "PhotoEditingApplication",
  operatingSystem: "Any (Web Browser)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Безкоштовний онлайн-сервіс для стиснення, зміни розміру, конвертації та обробки фото пресетами прямо в браузері.",
};

const Hero = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "home");

  return (
    <>
      <SeoHead route={route} lang={lang} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Panel
        acceptedTypes={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        processFile={compressImage}
        dropzoneText={t("hero.dropzone")}
      >
        <h1 className="main__title">
          {t("hero.titlePart1")}
          <span className="title__gradient"> {t("hero.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("hero.text1")}</p>
        <p className="main__text">{t("hero.text2")}</p>
      </Panel>
      <SeoContent pageKey="home" />
    </>
  );
};

export default Hero;
