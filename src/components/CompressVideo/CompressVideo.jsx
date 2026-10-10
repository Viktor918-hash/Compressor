import "../Convertal/Conver.css";
import { useState } from "react";
import Panel from "../PanelFile/Panel";
import VideoSizePicker from "./VideoSizePicker";
import {
  compressVideo,
  getCompressedVideoName,
  toVideoBytes,
  videoInfoOf,
} from "./convertCompressVideo";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { userError } from "../../utils/userError";

const SITE_URL = "https://compressphoto.org";
// Бізнес-ліміт (не технічний — CloudConvert-free дозволяє до 1 ГБ), той
// самий, що і в api/convert/init.js::MAX_VIDEO_FILE_SIZE. Два числа
// розведені по файлах навмисно (клієнт/сервер) — спільний імпорт означав
// би імпорт серверного api/-модуля у клієнтський бандл.
const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;

const CompressVideo = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "compressVideo");
  const meta = PAGE_META.compressVideo[lang];

  // "recommended" (безпечний дефолт, до 720p) | "custom" (цільовий
  // розмір файлу в МБ, яка вводить користувач у targetMB). Застосовується
  // до кожного наступного файлу, який стає в черзі —
  // convertCompressVideo.js сам обрізає ціль до реальної роздільності
  // конкретного відео й ніколи не апскейлить.
  const [mode, setMode] = useState("recommended");
  const [targetMB, setTargetMB] = useState("50");

  const targetBytes = toVideoBytes(targetMB);
  const targetValid = Number.isFinite(targetBytes) && targetBytes > 0;

  // «24,3 МБ» — завжди в МБ з одним десятковим знаком (більша одиниця,
  // ніж для фото, бо відео важить у десятки/сотні разів більше).
  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 });
  const fmtMb = (bytes) =>
    `${nf.format(Math.round(bytes / 100_000) / 10)} ${t("compressVideo.size.mb")}`;

  // Той самий паттерн, що й у WordToPdf/PdfToWord: коли гість вичерпав
  // денний ліміт — пропонуємо зареєструватись.
  const handleLimitReached = (error) => {
    if (error.isGuest) {
      window.dispatchEvent(new CustomEvent("open-register-modal"));
    }
  };

  const processFile = async (file, { signal, onProgress } = {}) => {
    if (mode === "custom" && !targetValid) {
      throw userError(t("compressVideo.errors.badTarget"));
    }
    try {
      return await compressVideo(file, {
        signal,
        onProgress,
        mode,
        targetBytes: mode === "custom" ? targetBytes : undefined,
      });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (error?.code === "BAD_TARGET") {
        throw userError(t("compressVideo.errors.badTarget"));
      }
      if (error?.code === "TARGET_TOO_LARGE") {
        // Користувач вказав цільовий розмір, більший (або рівний) за сам
        // файл — стискати "у більший розмір" немає сенсу. Показуємо
        // червоним текстом, яка саме помилка (Panel малює userFacing-
        // помилки для кожного файлу окремо червоним кольором).
        throw userError(
          t("compressVideo.errors.targetTooLarge", {
            target: fmtMb(error.targetBytes),
            fileSize: fmtMb(error.fileSize),
          })
        );
      }
      throw error; // решта — загальне повідомлення Panel
    }
  };

  const resultNote = (file, blob) => {
    const info = videoInfoOf(blob);
    if (!info) return null;

    const resolutionNote =
      info.width === info.sourceWidth && info.height === info.sourceHeight
        ? t("compressVideo.note.sameResolution", {
            width: info.width,
            height: info.height,
          })
        : t("compressVideo.note.resized", {
            fromWidth: info.sourceWidth,
            fromHeight: info.sourceHeight,
            width: info.width,
            height: info.height,
          });

    if (!info.targetBytes) return resolutionNote;

    // Режим "Свій розмір" — підсумок завжди ПРИБЛИЗНИЙ (CloudConvert не
    // приймає прямого параметра бітрейту/якості, лише роздільність, тож
    // точного збігу з цільовим МБ не гарантуємо — чесно про це кажемо).
    return `${t("compressVideo.note.targetApprox", {
      target: fmtMb(info.targetBytes),
      actual: fmtMb(blob.size),
    })} ${resolutionNote}`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "MultimediaApplication",
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
          "video/mp4": [".mp4"],
          "video/quicktime": [".mov"],
          "video/webm": [".webm"],
          "video/x-msvideo": [".avi"],
          "video/avi": [".avi"],
          "video/x-matroska": [".mkv"],
          // Деякі браузери (особливо мобільні, для .mov/.mkv) не
          // повідомляють MIME взагалі — приймаємо й за розширенням.
          "": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
        }}
        processFile={processFile}
        getOutputName={getCompressedVideoName}
        resultNote={resultNote}
        onLimitReached={handleLimitReached}
        options={
          <VideoSizePicker
            mode={mode}
            targetMB={targetMB}
            onModeChange={setMode}
            onTargetChange={setTargetMB}
            invalid={mode === "custom" && !targetValid}
          />
        }
        dropzoneText={t("compressVideo.dropzone")}
        maxFiles={5}
        // P0-6: файл вантажиться напряму в CloudConvert, не через нашу
        // Vercel-функцію — ліміт тіла запиту 4,5 МБ не застосовується.
        // 200 МБ — бізнес-параметр (не технічний), див.
        // claude/compressphoto-video-compressor-spec.md.
        maxFileSize={MAX_VIDEO_FILE_SIZE}
        showStats={false}
        // Файл реально йде на CloudConvert (бекенд) — не показуємо рядок
        // "файли не йдуть на сервер", це було б неправдою.
        showEmptyTrust={false}
        emptyStateText={t("compressVideo.panel.emptyState")}
        addMoreText={t("compressVideo.panel.addMore")}
        addMoreAriaLabel={t("compressVideo.panel.addMoreAria")}
        selectedLabel={t("compressVideo.panel.selected")}
        downloadOneText={t("compressVideo.panel.downloadOne")}
        downloadManyText={t("compressVideo.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("compressVideo.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("compressVideo.titlePart2")}
          <span className="title__gradient"> {t("compressVideo.titleGradient")}</span>
        </h1>
        <p className="main__text">{t("compressVideo.text1")}</p>
        <p className="main__text">{t("compressVideo.text2")}</p>
      </Panel>
      <SeoContent pageKey="compressVideo" />
    </>
  );
};

export default CompressVideo;
