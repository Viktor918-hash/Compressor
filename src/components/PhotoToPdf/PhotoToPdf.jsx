import "../Convertal/Conver.css";
import { usePersistentState } from "../../hooks/usePersistentState";
import Panel from "../PanelFile/Panel";
import PdfOptions from "./PdfOptions";
import { mergeImagesToPdf, totalBytes, PAGE_SIZES, MARGINS_MM } from "./photoToPdf";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { userError } from "../../utils/userError";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;
// Понад це — попередження (не блокуємо): великий альбом довше обробляється
// й дає важкий PDF, але це не помилка.
const WARN_TOTAL_BYTES = 200 * 1024 * 1024;

const PhotoToPdf = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "photoToPdf");
  const meta = PAGE_META.photoToPdf[lang];
  // round 33: формат сторінки й поля запам'ятовуються між візитами
  const [pageSize, setPageSize] = usePersistentState("photoToPdf.pageSize", "a4", (v) =>
    PAGE_SIZES.includes(v)
  );
  const [marginMm, setMarginMm] = usePersistentState("photoToPdf.margin", 0, (v) =>
    MARGINS_MM.includes(v)
  );

  const processAll = async (files, { signal, onProgress } = {}) => {
    try {
      return await mergeImagesToPdf(files, {
        pageSize,
        marginMm,
        signal,
        onProgress: (p) =>
          onProgress?.({
            value: p.value,
            text: t("photoToPdf.status.page", { current: p.current, total: p.total }),
          }),
      });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (error?.code === "DECODE_FAILED") {
        throw userError(t("errors.imageDecodeFailed", { name: error.fileName || "" }));
      }
      if (error?.code === "ENCODE_FAILED") {
        throw userError(t("photoToPdf.errors.encodeFailed", { name: error.fileName || "" }));
      }
      throw error; // решта — загальне panel.errors.mergeFailed
    }
  };

  const mergeWarning = (files) =>
    totalBytes(files) > WARN_TOTAL_BYTES ? t("photoToPdf.warnings.tooHeavy") : null;

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
        currentSlug="photoToPdf"
        mode="merge"
        processAll={processAll}
        mergeMinFiles={1}
        mergeButtonText={t("photoToPdf.panel.create")}
        mergeWarning={mergeWarning}
        acceptedTypes={{
          "image/jpeg": [],
          "image/png": [],
          "image/webp": [],
          "image/bmp": [],
          "image/gif": [],
          "image/avif": [],
          "image/heic": [],
          "image/heif": [],
          "": [".heic", ".heif"],
        }}
        options={
          <PdfOptions
            pageSize={pageSize}
            marginMm={marginMm}
            onPageSizeChange={setPageSize}
            onMarginChange={setMarginMm}
          />
        }
        dropzoneText={t("photoToPdf.dropzone")}
        maxFiles={20}
        maxFileSize={MAX_FILE_SIZE}
        showStats={false}
        emptyStateText={t("photoToPdf.panel.emptyState")}
        addMoreText={t("photoToPdf.panel.addMore")}
        addMoreAriaLabel={t("photoToPdf.panel.addMoreAria")}
        selectedLabel={t("photoToPdf.panel.selected")}
        downloadOneText={t("photoToPdf.panel.download")}
        removeAriaLabel={(name) => `${t("photoToPdf.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("photoToPdf.titlePart2")}
          <span className="title__gradient"> {t("photoToPdf.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("photoToPdf.text1")}</p>
        <p className="main__text">{t("photoToPdf.text2")}</p>
      </Panel>
      <SeoContent pageKey="photoToPdf" />
    </>
  );
};

export default PhotoToPdf;
