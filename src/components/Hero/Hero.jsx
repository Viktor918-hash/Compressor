import { useState } from "react";
import Panel from "../PanelFile/Panel";
import CompressOptions from "./CompressOptions";
import imageCompression from "browser-image-compression";
// Скрипт воркера віддаємо зі свого домену (за замовчуванням бібліотека
// підтягує його з cdn.jsdelivr.net при кожному стисненні: це зайвий запит,
// передача IP стороннім і залежність від CDN).
import compressionWorkerUrl from "browser-image-compression/dist/browser-image-compression.js?url";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import ToolsCategories from "../ToolsCategories/ToolsCategories";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

// Налаштування за замовчуванням: розмір зображення НЕ змінюємо (раніше
// maxWidthOrHeight: 1920 мовчки зменшував фото 4000×3000 до 1824×1368),
// стискається лише якість. Користувач може вимкнути це й обрати макс. сторону.
const DEFAULT_OPTIONS = { quality: 80, keepSize: true, maxSide: 1920 };

const compressImage = async (file, { quality, keepSize, maxSide }, signal) => {
  const options = {
    initialQuality: quality / 100,
    useWebWorker: true,
    libURL: compressionWorkerUrl,
    signal,
  };
  if (keepSize) {
    options.alwaysKeepResolution = true;
  } else {
    options.maxWidthOrHeight = maxSide;
  }
  const result = await imageCompression(file, options);
  // Якщо "стиснений" файл не менший за оригінал (типово для PNG без
  // зміни розміру) — віддаємо оригінал, щоб не збільшувати файл.
  return result.size < file.size ? result : file;
};

// JSON-LD structured data (schema.org) — допомагає Google краще розуміти
// тип сайту. Опис береться з PAGE_META для мови сторінки (раніше був
// жорстко українським на всіх мовах).
const buildJsonLd = (lang, route) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CompressPhoto",
  url: `https://compressphoto.org${route[lang]}`,
  applicationCategory: "PhotoEditingApplication",
  operatingSystem: "Any (Web Browser)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: PAGE_META.home[lang].description,
});

const Hero = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "home");
  const jsonLd = buildJsonLd(lang, route);
  const [opts, setOpts] = useState(DEFAULT_OPTIONS);

  return (
    <>
      <SeoHead route={route} lang={lang} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Panel
        acceptedTypes={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        processFile={(file, { signal } = {}) => compressImage(file, opts, signal)}
        dropzoneText={t("hero.dropzone")}
        options={<CompressOptions value={opts} onChange={setOpts} />}
      >
        <h1 className="main__title">
          {t("hero.titlePart1")}
          <span className="title__gradient"> {t("hero.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("hero.text1")}</p>
        <p className="main__text">{t("hero.text2")}</p>
      </Panel>
      <ToolsCategories />
      <SeoContent pageKey="home" />
    </>
  );
};

export default Hero;
