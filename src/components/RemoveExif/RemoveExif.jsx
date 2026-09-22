import "../Convertal/Conver.css";
import "./RemoveExif.css";
import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import Panel from "../PanelFile/Panel";
import { getCleanName, metaInfoOf, removeMetadata } from "./removeMetadata";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { userError } from "../../utils/userError";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const RemoveExif = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "removeExif");
  const meta = PAGE_META.removeExif[lang];
  const [reencode, setReencode] = useState(false);

  const processFile = async (file, { signal } = {}) => {
    try {
      return await removeMetadata(file, { signal, reencode });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (error?.code === "DECODE_FAILED") {
        throw userError(t("errors.imageDecodeFailed", { name: file.name }));
      }
      if (error?.code === "ENCODE_FAILED") {
        throw userError(t("removeExif.errors.encodeFailed", { name: file.name }));
      }
      if (error?.code === "FORMAT_UNSUPPORTED") {
        throw userError(t("removeExif.errors.formatUnsupported"));
      }
      if (error?.code === "ANIMATED") {
        throw userError(t("removeExif.errors.animated", { name: file.name }));
      }
      throw error; // решта — загальне повідомлення Panel
    }
  };

  const nf = new Intl.NumberFormat(lang, { minimumFractionDigits: 5, maximumFractionDigits: 5 });

  // Під результатом: що зроблено + що саме було у файлі (камера, дата, GPS, програма…)
  const resultNote = (file, blob) => {
    const info = metaInfoOf(blob);
    if (!info) return null;
    const { found = {} } = info;
    const list = info.kinds.map((k) => t(`removeExif.kind.${k}`)).join(", ");

    let summary;
    if (info.unchanged) summary = t("removeExif.note.none");
    else if (info.method === "reencoded") {
      summary = info.quality
        ? t("removeExif.note.reencoded", { quality: Math.round(info.quality * 100) })
        : t("removeExif.note.reencodedLossless");
    } else summary = t("removeExif.note.removed", { list: list || t("removeExif.kind.other") });

    const fields = [
      ["camera", found.camera],
      ["date", found.date],
      ["software", found.software],
      ["author", found.author],
      ["serial", found.serial],
    ].filter(([, v]) => v);

    return (
      <span className="meta-note">
        <span className="meta-note__line">{summary}</span>
        {info.keptOrientation && (
          <span className="meta-note__line">{t("removeExif.note.orientationKept")}</span>
        )}
        {info.fallback && (
          <span className="meta-note__line">{t("removeExif.note.fallback")}</span>
        )}
        {found.gps && (
          <span className="meta-note__line meta-note__line--warn" role="note">
            <FiAlertTriangle className="meta-note__icon" aria-hidden="true" />
            {t("removeExif.note.gps", {
              lat: nf.format(found.gps.lat),
              lon: nf.format(found.gps.lon),
            })}
          </span>
        )}
        {fields.map(([key, value]) => (
          <span className="meta-note__line" key={key}>
            <span className="meta-note__label">{t(`removeExif.found.${key}`)}: </span>
            {value}
          </span>
        ))}
      </span>
    );
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
        acceptedTypes={{
          "image/jpeg": [],
          "image/png": [],
          "image/webp": [],
        }}
        processFile={processFile}
        getOutputName={(name, _format, blob) => getCleanName(name, blob)}
        resultNote={resultNote}
        options={
          <div className="meta-option">
            <label className="meta-option__label">
              <input
                type="checkbox"
                checked={reencode}
                onChange={(e) => setReencode(e.target.checked)}
              />
              <span>{t("removeExif.option.reencode")}</span>
            </label>
            <p className="meta-option__hint">{t("removeExif.option.hint")}</p>
          </div>
        }
        dropzoneText={t("removeExif.dropzone")}
        maxFiles={20}
        maxFileSize={MAX_FILE_SIZE}
        showStats={false}
        emptyStateText={t("removeExif.panel.emptyState")}
        addMoreText={t("removeExif.panel.addMore")}
        addMoreAriaLabel={t("removeExif.panel.addMoreAria")}
        selectedLabel={t("removeExif.panel.selected")}
        downloadOneText={t("removeExif.panel.downloadOne")}
        downloadManyText={t("removeExif.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("removeExif.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("removeExif.titlePart2")}
          <span className="title__gradient"> {t("removeExif.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("removeExif.text1")}</p>
        <p className="main__text">{t("removeExif.text2")}</p>
      </Panel>
      <SeoContent pageKey="removeExif" />
    </>
  );
};

export default RemoveExif;
