import "../Convertal/Conver.css";
import "./VideoTools.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Panel from "../PanelFile/Panel";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import TrimControls from "./TrimControls";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { usePersistentState } from "../../hooks/usePersistentState";
import { PAGE_META } from "../../seoMeta";
import { userError } from "../../utils/userError";
import {
  buildTrimArgs,
  fileExt,
  formatClock,
  mimeForExt,
  trimOutputExt,
  trimOutputFile,
  trimOutputName,
} from "../../utils/ffmpeg/ffmpegArgs";
import { runFFmpeg } from "../../utils/ffmpeg/ffmpegClient";
import { VIDEO_ACCEPT, VIDEO_MAX_FILE_SIZE, toUserError } from "./videoToolShared";

const SITE_URL = "https://compressphoto.org";
const resultInfo = new WeakMap(); // Blob → { start, end, precise }

/**
 * /trim-video (round 36): вирізати фрагмент відео прямо в браузері.
 * Швидкий режим — без перекодування (секунди навіть для великих файлів),
 * точний — перекодування в H.264 MP4 (повільніше, різ точно по кадру).
 * Як і в «Стиснути відео», файл спершу чекає (requireConfirm), поки
 * людина обере фрагмент саме для нього.
 */
const TrimVideo = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "trimVideo");
  const meta = PAGE_META.trimVideo[lang];
  const [ranges, setRanges] = useState({}); // { [itemId]: { duration, start, end } }
  const [precise, setPrecise] = usePersistentState("trimVideo.precise", false, (v) => typeof v === "boolean");

  const updateRange = (id, patch) =>
    setRanges((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const processFile = async (file, { signal, onProgress, id } = {}) => {
    const range = ranges[id];
    if (!range?.duration || !(range.end > range.start)) {
      throw userError(t("trimVideo.errors.noRange"));
    }
    const exact = precise;
    try {
      const { data } = await runFFmpeg(file, {
        buildArgs: (input) => buildTrimArgs(input, { ...range, precise: exact, name: file.name }),
        outputName: trimOutputFile(file.name, exact),
        duration: range.end - range.start,
        signal,
        onLoadProgress: (v) =>
          onProgress?.({ text: t("videoTools.loadingEngine", { percent: Math.round(v * 100) }), value: v }),
        onProgress: (v) =>
          onProgress?.({ text: t("trimVideo.trimming", { percent: Math.round(v * 100) }), value: v }),
      });
      if (!data?.length) throw userError(t("videoTools.errors.generic"));
      const blob = new Blob([data], { type: mimeForExt(trimOutputExt(file.name, exact)) });
      resultInfo.set(blob, { start: range.start, end: range.end, precise: exact, ext: fileExt(file.name) });
      return blob;
    } catch (error) {
      throw toUserError(error, t);
    }
  };

  const resultNote = (_file, blob) => {
    const info = resultInfo.get(blob);
    if (!info) return null;
    const fragment = t("trimVideo.note", {
      from: formatClock(info.start),
      to: formatClock(info.end),
    });
    return `${fragment} ${info.precise ? t("trimVideo.notePrecise") : t("trimVideo.noteFast")}`;
  };

  const renderItemOptions = (item, confirm) => (
    <TrimControls
      file={item.file}
      value={ranges[item.id]}
      onChange={(patch) => updateRange(item.id, patch)}
      onConfirm={confirm}
      precise={precise}
      onPreciseChange={setPrecise}
    />
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web Browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <Panel
        currentSlug="trimVideo"
        acceptedTypes={VIDEO_ACCEPT}
        processFile={processFile}
        getOutputName={(name, _format, blob) =>
          trimOutputName(name, resultInfo.get(blob)?.precise ?? precise)
        }
        resultNote={resultNote}
        requireConfirm
        renderItemOptions={renderItemOptions}
        dropzoneText={t("trimVideo.dropzone")}
        maxFiles={3}
        maxFileSize={VIDEO_MAX_FILE_SIZE}
        showStats={false}
        emptyStateText={t("trimVideo.panel.emptyState")}
        addMoreText={t("trimVideo.panel.addMore")}
        addMoreAriaLabel={t("trimVideo.panel.addMoreAria")}
        selectedLabel={t("trimVideo.panel.selected")}
        downloadOneText={t("trimVideo.panel.downloadOne")}
        downloadManyText={t("trimVideo.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("trimVideo.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("trimVideo.titlePart2")}
          <span className="title__gradient"> {t("trimVideo.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("trimVideo.text1")}</p>
        <p className="main__text">{t("trimVideo.text2")}</p>
      </Panel>
      <SeoContent pageKey="trimVideo" />
    </>
  );
};

export default TrimVideo;
