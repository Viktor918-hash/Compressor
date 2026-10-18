import "../Convertal/Conver.css";
import { usePersistentState } from "../../hooks/usePersistentState";
import Panel from "../PanelFile/Panel";
import TargetSizePicker from "./TargetSizePicker";
import {
  compressImageToTarget,
  fitInfoOf,
  getFitOutputName,
  toBytes,
} from "./compressToSize";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { userError } from "../../utils/userError";

const SITE_URL = "https://compressphoto.org";
// Файли більші за це у canvas стискати важко (пам'ять мобільних браузерів)
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const CompressToSize = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "compressToSize");
  const meta = PAGE_META.compressToSize[lang];

  // round 33: ціль і формат запам'ятовуються між візитами
  const [size, setSize] = usePersistentState(
    "compressToSize.target",
    { value: "200", unit: "KB" },
    (v) => typeof v.value === "string" && (v.unit === "KB" || v.unit === "MB")
  );
  const [format, setFormat] = usePersistentState(
    "compressToSize.format",
    "jpeg",
    (v) => v === "jpeg" || v === "webp"
  );
  const targetBytes = toBytes(size.value, size.unit);
  const targetValid = Number.isFinite(targetBytes) && targetBytes >= 1000;

  // «1 840 КБ» — завжди в КБ, щоб «було → стало» легко порівнювалось
  const nf = new Intl.NumberFormat(lang);
  const fmtKb = (bytes) =>
    `${nf.format(bytes < 10_000 ? Math.round(bytes / 100) / 10 : Math.round(bytes / 1000))} ${t("compressToSize.units.kb")}`;

  const processFile = async (file, { signal, onProgress } = {}) => {
    if (!targetValid) throw userError(t("compressToSize.errors.badTarget"));
    try {
      return await compressImageToTarget(file, {
        targetBytes,
        format,
        signal,
        onProgress: (p) => {
          if (p.phase === "preparing") {
            onProgress?.({ text: t("compressToSize.status.preparing") });
          } else if (p.phase === "encoding") {
            onProgress?.({
              text: t("compressToSize.status.encoding", {
                quality: Math.round(p.quality * 100),
                size: fmtKb(p.size),
                target: fmtKb(p.targetBytes),
              }),
            });
          }
        },
      });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (error?.code === "TARGET_UNREACHABLE") {
        throw userError(
          t("compressToSize.errors.unreachable", {
            target: fmtKb(targetBytes),
            best: fmtKb(error.best.size),
            width: error.best.width,
            height: error.best.height,
          })
        );
      }
      if (error?.code === "FORMAT_UNSUPPORTED") {
        throw userError(t("compressToSize.errors.formatUnsupported"));
      }
      if (error?.code === "DECODE_FAILED") {
        throw userError(t("errors.imageDecodeFailed", { name: file.name }));
      }
      throw error; // решта — загальне повідомлення Panel
    }
  };

  const resultNote = (file, blob) => {
    const info = fitInfoOf(blob);
    if (!info) return null;
    if (info.unchanged) return t("compressToSize.note.unchanged");
    const params = {
      quality: Math.round(info.quality * 100),
      width: info.width,
      height: info.height,
      fromWidth: info.originalWidth,
      fromHeight: info.originalHeight,
    };
    return info.resized
      ? t("compressToSize.note.resized", params)
      : t("compressToSize.note.same", params);
  };

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
        currentSlug="compressToSize"
        acceptedTypes={{
          "image/jpeg": [],
          "image/png": [],
          "image/webp": [],
          "image/bmp": [],
          "image/heic": [],
          "image/heif": [],
          "": [".heic", ".heif"],
        }}
        processFile={processFile}
        getOutputName={(name, _format, blob) => getFitOutputName(name, blob, format)}
        formatSize={fmtKb}
        resultNote={resultNote}
        options={
          <TargetSizePicker
            value={size.value}
            unit={size.unit}
            format={format}
            onSizeChange={setSize}
            onFormatChange={setFormat}
            invalid={!targetValid}
          />
        }
        dropzoneText={t("compressToSize.dropzone")}
        maxFiles={20}
        maxFileSize={MAX_FILE_SIZE}
        showStats={false}
        emptyStateText={t("compressToSize.panel.emptyState")}
        addMoreText={t("compressToSize.panel.addMore")}
        addMoreAriaLabel={t("compressToSize.panel.addMoreAria")}
        selectedLabel={t("compressToSize.panel.selected")}
        downloadOneText={t("compressToSize.panel.downloadOne")}
        downloadManyText={t("compressToSize.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("compressToSize.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("compressToSize.titlePart2")}
          <span className="title__gradient"> {t("compressToSize.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("compressToSize.text1")}</p>
        <p className="main__text">{t("compressToSize.text2")}</p>
      </Panel>
      <SeoContent pageKey="compressToSize" />
    </>
  );
};

export default CompressToSize;
