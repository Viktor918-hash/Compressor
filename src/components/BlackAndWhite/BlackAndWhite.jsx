// Чорно-біле фото: один файл за раз, повзунок інтенсивності ефекту (0% —
// оригінал, 100% — повністю чорно-біле; проміжні значення — часткове
// знебарвлення) з прев'ю в реальному часі. Формула яскравості й змішування
// кольору — у ../blackAndWhite.js (чисто, без DOM, тестується окремо);
// малювання в canvas (ImageData) — тут, той самий підхід, що й у
// CropImage.jsx/RotateImage.jsx (geometry/формули окремо від draw).
import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
// Перевикористовуємо стилі бічної панелі/кнопок з Resize.jsx (той самий
// підхід, що й у RotateImage.jsx/CropImage.jsx) — щоб не дублювати
// .resize-controls/.resize-format-btn/.resize-toggle-btn і т. д.
// .range-input (повзунок) — спільний styles/range.css, уже підключений
// глобально в main.jsx.
import "../Resize/Resize.css";
import "./BlackAndWhite.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiArrowLeft, FiX, FiSettings, FiUploadCloud } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { decodeImage, codedError } from "../../utils/decodeImage";
import { DEFAULT_INTENSITY, clampIntensity, applyGrayscaleToPixels } from "./blackAndWhite";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const FORMATS = [
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
];

// Частка заповнення для .range-input (styles/range.css) — 0–100%.
const rangeProgress = (value, min, max) => `${((value - min) / (max - min)) * 100}%`;

/**
 * Малює decoded-зображення на canvas і застосовує чорно-білий ефект із
 * заданою інтенсивністю через ImageData (піксельний доступ). fillWhite —
 * заливка білим перед малюванням (для JPG, той самий фікс, що й в інших
 * інструментах, на випадок прозорого PNG/WebP на вході).
 */
function renderWithEffect(canvas, decoded, intensity, fillWhite) {
  canvas.width = decoded.width;
  canvas.height = decoded.height;
  const ctx = canvas.getContext("2d");
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, decoded.width, decoded.height);
  }
  ctx.drawImage(decoded.image, 0, 0, decoded.width, decoded.height);
  if (intensity > 0) {
    const imageData = ctx.getImageData(0, 0, decoded.width, decoded.height);
    applyGrayscaleToPixels(imageData.data, intensity);
    ctx.putImageData(imageData, 0, 0);
  }
}

const BlackAndWhite = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "blackAndWhite");
  const meta = PAGE_META.blackAndWhite[lang];

  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);
  const [format, setFormat] = useState(FORMATS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const previewRef = useRef(null);
  const canvasRef = useRef(null);
  const decodedRef = useRef(null); // {image,width,height,release} поточного файлу

  const releaseDecoded = useCallback(() => {
    decodedRef.current?.release?.();
    decodedRef.current = null;
  }, []);

  useEffect(() => releaseDecoded, [releaseDecoded]);

  const drawPreview = useCallback((decoded, i) => {
    const canvas = canvasRef.current;
    if (!canvas || !decoded) return;
    renderWithEffect(canvas, decoded, i, false);
  }, []);

  const loadFile = useCallback(
    async (f) => {
      setError("");
      setDownloaded(false);
      try {
        const decoded = await decodeImage(f);
        releaseDecoded();
        decodedRef.current = decoded;
        setFile(f);
        setNatural({ width: decoded.width, height: decoded.height });
        setIntensity(DEFAULT_INTENSITY);
        setMobileSettingsOpen(false);
      } catch {
        setError(t("errors.imageDecodeFailed", { name: f.name }));
      }
    },
    [t, releaseDecoded]
  );

  // canvas монтується лише коли з'являється `file` (умовний рендер нижче) —
  // requestAnimationFrame одразу після setFile у loadFile() ненадійний: між
  // await decodeImage() і setState ми вже поза синхронним React-обробником,
  // і rAF може спрацювати до того, як React встигне закомітити <canvas> у
  // DOM (canvasRef.current ще null — drawPreview тихо виходить, прев'ю
  // лишається порожнім аж до першої зміни повзунка). useEffect гарантовано
  // виконується вже ПІСЛЯ коміту DOM.
  useEffect(() => {
    if (!file) return;
    const decoded = decodedRef.current;
    if (decoded) drawPreview(decoded, intensity);
    // Навмисно без `intensity` у залежностях: це лише початкове малювання
    // при завантаженні нового файлу; зміну повзунка малює
    // handleIntensityChange напряму.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, drawPreview]);

  const onDrop = useCallback((accepted) => { if (accepted[0]) loadFile(accepted[0]); }, [loadFile]);

  const onDropRejected = useCallback(
    (rejections) => {
      const name = rejections?.[0]?.file?.name || "";
      setError(t("errors.fileInvalidType", { name }));
    },
    [t]
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/bmp": [],
      "image/gif": [],
      "image/avif": [],
      "image/heic": [],
      "image/heif": [],
      "": [".heic", ".heif"],
    },
    onDrop,
    onDropRejected,
    noClick: true,
    noKeyboard: true,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  const handleIntensityChange = (value) => {
    const next = clampIntensity(value);
    setIntensity(next);
    setDownloaded(false);
    const decoded = decodedRef.current;
    if (decoded) drawPreview(decoded, next);
  };

  useEffect(() => {
    document.body.style.overflow = file ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [file]);

  const handleDownload = async () => {
    const decoded = decodedRef.current;
    if (!file || !decoded) return;

    setIsProcessing(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      const ctx0 = canvas.getContext("2d");
      if (!ctx0) throw codedError("ENCODE_FAILED");
      renderWithEffect(canvas, decoded, intensity, format.value === "image/jpeg");

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format.value, 0.92));
      if (!blob) throw codedError("ENCODE_FAILED");

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const outputName = `${baseName}-bw.${format.ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outputName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setDownloaded(true);
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error("black and white failed:", e);
      setError(t("blackAndWhite.errors.processFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    releaseDecoded();
    setFile(null);
    setNatural({ width: 0, height: 0 });
    setIntensity(DEFAULT_INTENSITY);
    setError("");
    setDownloaded(false);
    setMobileSettingsOpen(false);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web Browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <main className="main" {...getRootProps()}>
        <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
        <input {...getInputProps()} />

        {isDragActive && (
          <div className="page-drag-overlay">
            <p>{t("blackAndWhite.dropText2")}</p>
          </div>
        )}

        <div className="main__wrapper container">
          <div className="main__content">
            {!file && (
              <>
                <div className="main__txt">
                  <h1 className="main__title">
                    {t("blackAndWhite.titlePart1")}{" "}
                    <span className="title__gradient">{t("blackAndWhite.titleGradient")}</span>
                  </h1>
                  <p className="main__text">{t("blackAndWhite.subtitle")}</p>
                </div>

                <div className="photo__input" id="dropzona">
                  <div className="input__download">
                    <FiDownload size={35} color="var(--color-primary-600)" className="download__icon" />
                  </div>
                  <div className="input__info-text">
                    <button type="button" className="input__text input__text--button" onClick={open}>
                      {t("blackAndWhite.dropzone")}
                    </button>
                  </div>
                  <p className="photo__input__trust">{t("panel.emptyTrust")}</p>
                </div>

                {error && (
                  <p className="error-text" role="alert">
                    {error}
                  </p>
                )}
              </>
            )}

            {file && (
              <div className="bw-preview-area">
                <div
                  className="bw-preview-wrap"
                  ref={previewRef}
                  style={{
                    aspectRatio: `${natural.width} / ${natural.height}`,
                    "--ar": natural.height ? natural.width / natural.height : 1,
                  }}
                >
                  <canvas ref={canvasRef} className="bw-preview-canvas" />
                </div>
                <p className="bw-hint">{t("blackAndWhite.hint")}</p>
              </div>
            )}
          </div>
        </div>

        {file && (
          <button
            type="button"
            className="resize-toggle-btn"
            onClick={() => setMobileSettingsOpen((prev) => !prev)}
            aria-label={mobileSettingsOpen ? t("panel.hideSettings") : t("panel.showSettings")}
          >
            {mobileSettingsOpen ? <FiX size={22} /> : <FiSettings size={22} />}
          </button>
        )}

        <aside
          className={`side-panel ${file ? "side-panel--open" : ""} ${!mobileSettingsOpen ? "side-panel--mobile-collapsed" : ""}`}
          inert={!file}
        >
          <div className="side-panel__header">
            {file && (
              <div className="side-panel__back">
                <button className="side-panel__back-btn" onClick={handleReset} aria-label={t("panel.closePanel")}>
                  <FiArrowLeft size={20} /> {t("panel.closePanel")}
                </button>
              </div>
            )}
            <h2 className="side-panel__title">
              {downloaded ? t("blackAndWhite.downloadedTitle") : t("blackAndWhite.settingsTitle")}
            </h2>
          </div>

          {!file ? (
            <div className="side-panel__empty-state">
              <FiUploadCloud
                size={28}
                className="side-panel__empty-icon"
                aria-hidden="true"
              />
              <p className="side-panel__empty">{t("panel.adFile")}</p>
              <p className="side-panel__empty-trust">
                {t("panel.emptyTrust")}
              </p>
            </div>
          ) : (
            <div className="resize-controls">
              <div className="resize-block">
                <p className="resize-label">{t("blackAndWhite.original")}</p>
                <p className="resize-value">
                  {natural.width} × {natural.height}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">
                  {t("blackAndWhite.intensity")}: {intensity}%
                </p>
                <input
                  type="range"
                  className="bw-range range-input"
                  min={0}
                  max={100}
                  value={intensity}
                  onChange={(e) => handleIntensityChange(Number(e.target.value))}
                  style={{ "--progress": rangeProgress(intensity, 0, 100) }}
                  aria-label={t("blackAndWhite.intensity")}
                />
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("blackAndWhite.format")}</p>
                <div className="resize-format-group">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      className={`resize-format-btn ${format.value === f.value ? "resize-format-btn--active" : ""}`}
                      onClick={() => { setFormat(f); setDownloaded(false); }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}

          <button
            className={`side-panel__download-btn ${!file ? "side-panel__download-btn--empty" : ""}`}
            onClick={handleDownload}
            disabled={!file || isProcessing}
          >
            {isProcessing ? t("blackAndWhite.processing") : t("blackAndWhite.download")}
          </button>
        </aside>
      </main>
      <SeoContent pageKey="blackAndWhite" />
    </>
  );
};

export default BlackAndWhite;
