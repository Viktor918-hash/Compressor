import "../Convertal/Conver.css";
import "./VideoTools.css";
import { useTranslation } from "react-i18next";
import Panel from "../PanelFile/Panel";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { usePersistentState } from "../../hooks/usePersistentState";
import { PAGE_META } from "../../seoMeta";
import {
  DEFAULT_MP3_BITRATE,
  MP3_BITRATES,
  buildMp3Args,
  formatClock,
  mp3OutputName,
  parseDuration,
} from "../../utils/ffmpeg/ffmpegArgs";
import { runFFmpeg } from "../../utils/ffmpeg/ffmpegClient";
import { VIDEO_ACCEPT, VIDEO_MAX_FILE_SIZE, toUserError } from "./videoToolShared";

const SITE_URL = "https://compressphoto.org";
const resultInfo = new WeakMap(); // Blob → { bitrate, duration }

/**
 * /video-to-mp3 (round 36): звук із відео в MP3 прямо в браузері
 * (FFmpeg.wasm + libmp3lame). Файл нікуди не вивантажується.
 */
const VideoToMp3 = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "videoToMp3");
  const meta = PAGE_META.videoToMp3[lang];
  const [bitrate, setBitrate] = usePersistentState(
    "videoToMp3.bitrate",
    DEFAULT_MP3_BITRATE,
    (v) => MP3_BITRATES.includes(v)
  );

  const processFile = async (file, { signal, onProgress } = {}) => {
    const kbps = bitrate;
    try {
      const { data, logs } = await runFFmpeg(file, {
        buildArgs: (input) => buildMp3Args(input, kbps),
        outputName: "output.mp3",
        signal,
        onLoadProgress: (v) =>
          onProgress?.({ text: t("videoTools.loadingEngine", { percent: Math.round(v * 100) }), value: v }),
        onProgress: (v) =>
          onProgress?.({ text: t("videoToMp3.converting", { percent: Math.round(v * 100) }), value: v }),
      });
      const blob = new Blob([data], { type: "audio/mpeg" });
      resultInfo.set(blob, { bitrate: kbps, duration: parseDuration(logs.join("\n")) });
      return blob;
    } catch (error) {
      throw toUserError(error, t, { noAudio: "videoToMp3.errors.noAudio" });
    }
  };

  const resultNote = (_file, blob) => {
    const info = resultInfo.get(blob);
    if (!info) return null;
    return info.duration
      ? t("videoToMp3.note", { bitrate: info.bitrate, duration: formatClock(info.duration) })
      : t("videoToMp3.noteNoDuration", { bitrate: info.bitrate });
  };

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
        currentSlug="videoToMp3"
        acceptedTypes={VIDEO_ACCEPT}
        processFile={processFile}
        getOutputName={(name) => mp3OutputName(name)}
        resultNote={resultNote}
        options={
          <div className="video-tool-option" role="group" aria-labelledby="mp3-bitrate-label">
            <span className="video-tool-option__label" id="mp3-bitrate-label">
              {t("videoToMp3.bitrateLabel")}
            </span>
            <div className="video-tool-option__chips">
              {MP3_BITRATES.map((kbps) => (
                <button
                  key={kbps}
                  type="button"
                  className={`video-tool-chip${bitrate === kbps ? " video-tool-chip--active" : ""}`}
                  aria-pressed={bitrate === kbps}
                  onClick={() => setBitrate(kbps)}
                >
                  {t("videoToMp3.kbps", { value: kbps })}
                </button>
              ))}
            </div>
            <p className="video-tool-option__hint">{t(`videoToMp3.bitrateHint.${bitrate}`)}</p>
          </div>
        }
        dropzoneText={t("videoToMp3.dropzone")}
        maxFiles={10}
        maxFileSize={VIDEO_MAX_FILE_SIZE}
        showStats={false}
        emptyStateText={t("videoToMp3.panel.emptyState")}
        addMoreText={t("videoToMp3.panel.addMore")}
        addMoreAriaLabel={t("videoToMp3.panel.addMoreAria")}
        selectedLabel={t("videoToMp3.panel.selected")}
        downloadOneText={t("videoToMp3.panel.downloadOne")}
        downloadManyText={t("videoToMp3.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("videoToMp3.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("videoToMp3.titlePart2")}
          <span className="title__gradient"> {t("videoToMp3.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("videoToMp3.text1")}</p>
        <p className="main__text">{t("videoToMp3.text2")}</p>
      </Panel>
      <SeoContent pageKey="videoToMp3" />
    </>
  );
};

export default VideoToMp3;
