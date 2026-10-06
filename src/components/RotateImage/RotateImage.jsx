// Повернути / віддзеркалити фото: один файл за раз, миттєвий поворот на
// 90°/180° і віддзеркалення по горизонталі/вертикалі — прев'ю оновлюється
// одразу після кожного натискання, без окремого кроку «застосувати».
// Геометрія (розмір результату, мапінг точок для тестів) — у ../rotate.js
// (чисто, без DOM); малювання в canvas — тут, той самий підхід, що й у
// CropImage.jsx (geometry окремо від draw).
import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
// Перевикористовуємо стилі бічної панелі/кнопок з Resize.jsx (той самий
// підхід, що й у CropImage.jsx) — щоб не дублювати .resize-controls/
// .resize-format-btn/.resize-toggle-btn і т. д.
import "../Resize/Resize.css";
import "./RotateImage.css";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiArrowLeft, FiX, FiSettings, FiRotateCcw, FiRotateCw, FiUploadCloud } from "react-icons/fi";
import { TbFlipHorizontal, TbFlipVertical } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { decodeImage, codedError } from "../../utils/decodeImage";
import { rotateCW, rotateCCW, outputSize, initialTransform } from "./rotate";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const FORMATS = [
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
];

/**
 * Малює decoded-зображення на canvas із заданою трансформацією (поворот +
 * віддзеркалення). fillWhite=true — заливка білим перед малюванням (для
 * JPG, який не підтримує прозорість; той самий фікс, що й в інших
 * інструментах). Повертає розмір результату (для side panel/aspect-ratio).
 */
function renderTransformed(canvas, decoded, transform, fillWhite) {
  const out = outputSize(decoded.width, decoded.height, transform.rotation);
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d");
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.save();
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
  ctx.drawImage(decoded.image, -decoded.width / 2, -decoded.height / 2, decoded.width, decoded.height);
  ctx.restore();
  return out;
}

const RotateImage = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "rotateImage");
  const meta = PAGE_META.rotateImage[lang];

  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState(initialTransform());
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

  const drawPreview = useCallback((decoded, t2) => {
    const canvas = canvasRef.current;
    if (!canvas || !decoded) return;
    renderTransformed(canvas, decoded, t2, false);
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
        setTransform(initialTransform());
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
  // лишається порожнім аж до першого поворот/фліп). useEffect гарантовано
  // виконується вже ПІСЛЯ коміту DOM, тож canvasRef.current точно готовий.
  useEffect(() => {
    if (!file) return;
    const decoded = decodedRef.current;
    if (decoded) drawPreview(decoded, transform);
    // Навмисно без `transform` у залежностях: це лише початкове малювання
    // при завантаженні нового файлу; наступні перемальовування при зміні
    // transform роблять handleRotate*/handleFlip* напряму (applyTransform).
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

  const applyTransform = (updater) => {
    setTransform((prev) => {
      const next = updater(prev);
      const decoded = decodedRef.current;
      if (decoded) drawPreview(decoded, next);
      return next;
    });
    setDownloaded(false);
  };

  const handleRotateLeft = () => applyTransform((prev) => ({ ...prev, rotation: rotateCCW(prev.rotation) }));
  const handleRotateRight = () => applyTransform((prev) => ({ ...prev, rotation: rotateCW(prev.rotation) }));
  const handleFlipH = () => applyTransform((prev) => ({ ...prev, flipH: !prev.flipH }));
  const handleFlipV = () => applyTransform((prev) => ({ ...prev, flipV: !prev.flipV }));

  useEffect(() => {
    document.body.style.overflow = file ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [file]);

  const resultSize = useMemo(
    () => outputSize(natural.width, natural.height, transform.rotation),
    [natural, transform.rotation]
  );

  const handleDownload = async () => {
    const decoded = decodedRef.current;
    if (!file || !decoded) return;

    setIsProcessing(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      const ctx0 = canvas.getContext("2d");
      if (!ctx0) throw codedError("ENCODE_FAILED");
      renderTransformed(canvas, decoded, transform, format.value === "image/jpeg");

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format.value, 0.92));
      if (!blob) throw codedError("ENCODE_FAILED");

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const outputName = `${baseName}-rotated.${format.ext}`;
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
      console.error("rotate failed:", e);
      setError(t("rotateImage.errors.rotateFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    releaseDecoded();
    setFile(null);
    setNatural({ width: 0, height: 0 });
    setTransform(initialTransform());
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
            <p>{t("rotateImage.dropText2")}</p>
          </div>
        )}

        <div className="main__wrapper container">
          <div className="main__content">
            {!file && (
              <>
                <div className="main__txt">
                  <h1 className="main__title">
                    {t("rotateImage.titlePart1")}{" "}
                    <span className="title__gradient">{t("rotateImage.titleGradient")}</span>
                  </h1>
                  <p className="main__text">{t("rotateImage.subtitle")}</p>
                </div>

                <div className="photo__input" id="dropzona">
                  <div className="input__download">
                    <FiDownload size={35} color="var(--color-primary-600)" className="download__icon" />
                  </div>
                  <div className="input__info-text">
                    <button type="button" className="input__text input__text--button" onClick={open}>
                      {t("rotateImage.dropzone")}
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
              <div className="rotate-preview-area">
                <div
                  className="rotate-preview-wrap"
                  ref={previewRef}
                  style={{
                    aspectRatio: `${resultSize.width} / ${resultSize.height}`,
                    "--ar": resultSize.height ? resultSize.width / resultSize.height : 1,
                  }}
                >
                  <canvas ref={canvasRef} className="rotate-preview-canvas" />
                </div>
                <p className="rotate-hint">{t("rotateImage.hint")}</p>
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
              {downloaded ? t("rotateImage.downloadedTitle") : t("rotateImage.settingsTitle")}
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
                <p className="resize-label">{t("rotateImage.original")}</p>
                <p className="resize-value">
                  {natural.width} × {natural.height}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("rotateImage.result")}</p>
                <p className="resize-value">
                  {resultSize.width} × {resultSize.height}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("rotateImage.rotate")}</p>
                <div className="resize-format-group">
                  <button className="resize-format-btn" onClick={handleRotateLeft} aria-label={t("rotateImage.rotateLeft")}>
                    <FiRotateCcw size={18} /> {t("rotateImage.rotateLeft")}
                  </button>
                  <button className="resize-format-btn" onClick={handleRotateRight} aria-label={t("rotateImage.rotateRight")}>
                    <FiRotateCw size={18} /> {t("rotateImage.rotateRight")}
                  </button>
                </div>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("rotateImage.flip")}</p>
                <div className="resize-format-group">
                  <button
                    className={`resize-format-btn ${transform.flipH ? "resize-format-btn--active" : ""}`}
                    onClick={handleFlipH}
                    aria-pressed={transform.flipH}
                  >
                    <TbFlipHorizontal size={18} /> {t("rotateImage.flipHorizontal")}
                  </button>
                  <button
                    className={`resize-format-btn ${transform.flipV ? "resize-format-btn--active" : ""}`}
                    onClick={handleFlipV}
                    aria-pressed={transform.flipV}
                  >
                    <TbFlipVertical size={18} /> {t("rotateImage.flipVertical")}
                  </button>
                </div>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("rotateImage.format")}</p>
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
            {isProcessing ? t("rotateImage.processing") : t("rotateImage.download")}
          </button>
        </aside>
      </main>
      <SeoContent pageKey="rotateImage" />
    </>
  );
};

export default RotateImage;
