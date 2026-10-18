import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import { convertToPng, getPngOutputName } from "./convertToPng";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { userError } from "../../utils/userError";

const SITE_URL = "https://compressphoto.org";
// PNG без втрат — файли виходять великими, а canvas на телефонах обмежений
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const ConvertPng = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "convertToPng");
  const meta = PAGE_META.convertToPng[lang];

  const processFile = async (file, { signal } = {}) => {
    try {
      return await convertToPng(file, { signal });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (error?.code === "DECODE_FAILED") {
        throw userError(t("errors.imageDecodeFailed", { name: file.name }));
      }
      if (error?.code === "ENCODE_FAILED") {
        throw userError(t("convertToPng.errors.encodeFailed", { name: file.name }));
      }
      throw error; // решта — загальне повідомлення Panel
    }
  };

  // PNG стискає без втрат, тож із JPG/WebP він майже завжди важчий —
  // пояснюємо це прямо під результатом, щоб це не виглядало як збій.
  const resultNote = (file, blob) =>
    blob && blob.size > file.size ? t("convertToPng.note.larger") : null;

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
        currentSlug="convertToPng"
        sampleUrl="/samples/demo-photo.jpg"
        acceptedTypes={{
          "image/jpeg": [],
          "image/webp": [],
          "image/bmp": [],
          "image/gif": [],
          "image/avif": [],
          "image/heic": [],
          "image/heif": [],
          "": [".heic", ".heif"], // деякі браузери не дають MIME-тип HEIC — приймаємо і за розширенням
        }}
        processFile={processFile}
        getOutputName={getPngOutputName}
        resultNote={resultNote}
        dropzoneText={t("convertToPng.dropzone")}
        maxFiles={20}
        maxFileSize={MAX_FILE_SIZE}
        showStats={false}
        emptyStateText={t("convertToPng.panel.emptyState")}
        addMoreText={t("convertToPng.panel.addMore")}
        addMoreAriaLabel={t("convertToPng.panel.addMoreAria")}
        selectedLabel={t("convertToPng.panel.selected")}
        downloadOneText={t("convertToPng.panel.downloadOne")}
        downloadManyText={t("convertToPng.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("convertToPng.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("convertToPng.titlePart2")}
          <span className="title__gradient"> {t("convertToPng.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("convertToPng.text1")}</p>
        <p className="main__text">{t("convertToPng.text2")}</p>
      </Panel>
      <SeoContent pageKey="convertToPng" />
    </>
  );
};

export default ConvertPng;
