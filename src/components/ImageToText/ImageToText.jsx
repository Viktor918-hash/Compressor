import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import { useEffect, useState } from "react";
import {
  extractOcrData,
  buildOcrOutput,
  getOcrOutputName,
  OCR_OUTPUT_FORMATS,
  defaultOcrLangs,
  normalizeOcrLangs,
  terminateOcrWorker,
} from "./imageToText";
import OcrLanguagePicker from "./OcrLanguagePicker";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";
const LANGS_STORAGE_KEY = "cp_ocr_langs";

// Запам'ятовуємо вибір мов між візитами (лише зручність: без localStorage
// просто діє мова сторінки за замовчуванням).
const loadStoredLangs = () => {
  try {
    const raw = localStorage.getItem(LANGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const ImageToText = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "imageToText");
  const meta = PAGE_META.imageToText[lang];

  // null = "користувач ще не вибирав" → діє мова сторінки + English
  const [chosenLangs, setChosenLangs] = useState(loadStoredLangs);
  const langs = chosenLangs
    ? normalizeOcrLangs(chosenLangs, lang)
    : defaultOcrLangs(lang);

  const handleLangsChange = (next) => {
    setChosenLangs(next);
    try {
      localStorage.setItem(LANGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // без localStorage вибір діє до перезавантаження
    }
  };

  // Вихід зі сторінки: звільняємо воркер (WASM + мовна модель)
  useEffect(() => terminateOcrWorker, []);

  // Прогрес обробника → підпис у рядку файлу ("Розпізнавання 43%")
  const processFile = (file, { signal, onProgress } = {}) =>
    extractOcrData(file, {
      langs,
      signal,
      onProgress: (p) => {
        const pct =
          typeof p.value === "number" ? Math.round(p.value * 100) : null;
        let text;
        if (p.phase === "preparing") text = t("imageToText.status.preparing");
        else if (p.phase === "loading") text = t("imageToText.status.loading");
        else if (p.pass === 2) {
          text = t("imageToText.status.secondPass", { pct: pct ?? 0 });
        } else {
          text = t("imageToText.status.recognizing", { pct: pct ?? 0 });
        }
        onProgress?.({ text, value: p.phase === "recognizing" ? p.value : undefined });
      },
    });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "BusinessApplication",
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
        currentSlug="imageToText"
        sampleUrl="/samples/demo-text.png"
        cameraCapture
        acceptedTypes={{
          "image/jpeg": [],
          "image/png": [],
          "image/webp": [],
          "image/bmp": [],
        }}
        processFile={processFile}
        options={<OcrLanguagePicker value={langs} onChange={handleLangsChange} />}
        buildOutput={buildOcrOutput}
        getOutputName={getOcrOutputName}
        formats={OCR_OUTPUT_FORMATS}
        defaultFormatId="txt"
        dropzoneText={t("imageToText.dropzone")}
        // Розпізнавання йде прямо в браузері без сервера — ліміту на день
        // немає, тому maxFiles тут лише практичне обмеження одного разу.
        maxFiles={20}
        maxFileSize={15 * 1024 * 1024}
        showStats={false}
        emptyStateText={t("imageToText.panel.emptyState")}
        addMoreText={t("imageToText.panel.addMore")}
        addMoreAriaLabel={t("imageToText.panel.addMoreAria")}
        selectedLabel={t("imageToText.panel.selected")}
        downloadOneText={t("imageToText.panel.downloadOne")}
        downloadManyText={t("imageToText.panel.downloadMany")}
        removeAriaLabel={(name) => `${t("imageToText.panel.remove")} ${name}`}
      >
        <h1 className="main__title">
          {t("imageToText.titlePart2")}
          <span className="title__gradient">
            {" "}
            {t("imageToText.titleGradient")}
          </span>
        </h1>
        <p className="main__text">{t("imageToText.text1")}</p>
        <p className="main__text">{t("imageToText.text2")}</p>
      </Panel>
      <SeoContent pageKey="imageToText" />
    </>
  );
};

export default ImageToText;
