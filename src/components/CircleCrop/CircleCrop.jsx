// Кругла обрізка фото: той самий підхід, що й CropImage.jsx (рамка
// виділення, що перетягується і змінює розмір за 4 кути), але пропорція
// завжди жорстко 1:1 (ratio=1) і рамка візуально — коло (border-radius:50%
// у CircleCrop.css). Геометрію рамки СВІДОМО не дублюємо — вона вже є і
// повністю протестована в ../CropImage/crop.js (initialRect/moveRect/
// resizeCorner з ratio=1 завжди дають точний піксельний квадрат, незалежно
// від пропорцій оригінального фото — перевірено в tests/crop.test.mjs).
// Унікальна для цього інструмента частина — лише малювання: canvas.clip()
// по колу замість звичайного прямокутного drawImage.
import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
import "../Resize/Resize.css";
import "./CircleCrop.css";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiArrowLeft, FiX, FiSettings, FiUploadCloud } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import TryAlsoInline from "../SeoContent/TryAlsoInline";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { decodeImage, codedError } from "../../utils/decodeImage";
import { CORNERS, initialRect, moveRect, resizeCorner, rectToPixels } from "../CropImage/crop";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const RATIO = 1; // кругла обрізка завжди квадратна в пікселях — коло без овалу

const FORMATS = [
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
];

// Ті самі жорсткі межі canvas, що й у CropImage.jsx/Resize.jsx.
const MAX_CANVAS_SIDE = 32767;
const MAX_CANVAS_AREA = 268_435_456;

const CircleCrop = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "circleCrop");
  const meta = PAGE_META.circleCrop[lang];

  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [rect, setRect] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [format, setFormat] = useState(FORMATS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const previewRef = useRef(null);
  const canvasRef = useRef(null);
  const decodedRef = useRef(null);
  const dragRef = useRef(null);

  const releaseDecoded = useCallback(() => {
    decodedRef.current?.release?.();
    decodedRef.current = null;
  }, []);

  useEffect(() => releaseDecoded, [releaseDecoded]);

  const drawPreview = useCallback((decoded) => {
    const canvas = canvasRef.current;
    if (!canvas || !decoded) return;
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(decoded.image, 0, 0, decoded.width, decoded.height);
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
        setRect(initialRect(decoded.width, decoded.height, RATIO));
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
  // лишається порожнім аж до першої взаємодії з рамкою). useEffect
  // гарантовано виконується вже ПІСЛЯ коміту DOM.
  useEffect(() => {
    if (!file) return;
    const decoded = decodedRef.current;
    if (decoded) drawPreview(decoded);
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

  const clientDeltaToFraction = useCallback((dxPx, dyPx) => {
    const el = previewRef.current;
    if (!el) return { dx: 0, dy: 0 };
    const r = el.getBoundingClientRect();
    return { dx: r.width ? dxPx / r.width : 0, dy: r.height ? dyPx / r.height : 0 };
  }, []);

  const startDrag = (e, mode, corner) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode, corner, lastX: e.clientX, lastY: e.clientY };
  };

  useEffect(() => {
    const handleMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dxPx = e.clientX - drag.lastX;
      const dyPx = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      const { dx, dy } = clientDeltaToFraction(dxPx, dyPx);
      if (dx === 0 && dy === 0) return;
      setRect((prev) =>
        drag.mode === "move"
          ? moveRect(prev, dx, dy)
          : resizeCorner(prev, drag.corner, dx, dy, RATIO, natural.width, natural.height)
      );
      setDownloaded(false);
    };
    const handleUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [clientDeltaToFraction, natural.width, natural.height]);

  useEffect(() => {
    document.body.style.overflow = file ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [file]);

  const selectionPx = useMemo(
    () => rectToPixels(rect, natural.width, natural.height),
    [rect, natural]
  );

  const handleCropAndDownload = async () => {
    const decoded = decodedRef.current;
    if (!file || !decoded) return;

    const { sx, sy, sw, sh } = rectToPixels(rect, decoded.width, decoded.height);
    if (sw > MAX_CANVAS_SIDE || sh > MAX_CANVAS_SIDE || sw * sh > MAX_CANVAS_AREA) {
      setError(t("errors.outputTooBig"));
      return;
    }

    setIsProcessing(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw codedError("ENCODE_FAILED");
      ctx.imageSmoothingQuality = "high";

      // JPG не підтримує прозорість — заливаємо білим ДО clip(), щоб біла
      // підкладка лишилась поза колом (сам clip обмежує лише подальше
      // малювання, а не те, що вже намальовано).
      if (format.value === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sw, sh);
      }

      // sw===sh з точністю до округлення (ratio=1 у resizeCorner/initialRect
      // гарантує піксельний квадрат — див. tests/crop.test.mjs), тому коло
      // завжди вписується точно, без овалу.
      const r = Math.min(sw, sh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw / 2, sh / 2, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(decoded.image, sx, sy, sw, sh, 0, 0, sw, sh);
      ctx.restore();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format.value, 0.92));
      if (!blob) throw codedError("ENCODE_FAILED");

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const outputName = `${baseName}-circle.${format.ext}`;
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
      console.error("circle crop failed:", e);
      setError(t("circleCrop.errors.cropFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    releaseDecoded();
    setFile(null);
    setNatural({ width: 0, height: 0 });
    setRect({ x: 0, y: 0, w: 1, h: 1 });
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
            <p>{t("circleCrop.dropText2")}</p>
          </div>
        )}

        <div className="main__wrapper container">
          <div className="main__content">
            {!file && (
              <>
                <div className="main__txt">
                  <h1 className="main__title">
                    {t("circleCrop.titlePart1")}{" "}
                    <span className="title__gradient">{t("circleCrop.titleGradient")}</span>
                  </h1>
                  <p className="main__text">{t("circleCrop.subtitle")}</p>
                </div>

                <div className="photo__input" id="dropzona">
                  <div className="input__download">
                    <FiDownload size={35} color="var(--color-primary-600)" className="download__icon" />
                  </div>
                  <div className="input__info-text">
                    <button type="button" className="input__text input__text--button" onClick={open}>
                      {t("circleCrop.dropzone")}
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
              <div className="circle-preview-area">
                <div
                  className="circle-preview-wrap"
                  ref={previewRef}
                  style={{
                    aspectRatio: `${natural.width} / ${natural.height}`,
                    "--ar": natural.height ? natural.width / natural.height : 1,
                  }}
                >
                  <canvas ref={canvasRef} className="circle-preview-canvas" />

                  <div
                    className="circle-frame"
                    style={{
                      left: `${rect.x * 100}%`,
                      top: `${rect.y * 100}%`,
                      width: `${rect.w * 100}%`,
                      height: `${rect.h * 100}%`,
                    }}
                    onPointerDown={(e) => startDrag(e, "move")}
                  >
                    {CORNERS.map((c) => (
                      <span
                        key={c}
                        className={`circle-handle circle-handle--${c}`}
                        onPointerDown={(e) => startDrag(e, "corner", c)}
                      />
                    ))}
                  </div>
                </div>
                <p className="circle-hint">{t("circleCrop.hint")}</p>
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
              {downloaded ? t("circleCrop.downloadedTitle") : t("circleCrop.settingsTitle")}
            </h2>
          </div>

          {!file ? (
            <div className="side-panel__empty-state">
              <FiUploadCloud size={28} className="side-panel__empty-icon" aria-hidden="true" />
              <p className="side-panel__empty">{t("panel.adFile")}</p>
              <p className="side-panel__empty-trust">{t("panel.emptyTrust")}</p>
            </div>
          ) : (
            <div className="resize-controls">
              <div className="resize-block">
                <p className="resize-label">{t("circleCrop.original")}</p>
                <p className="resize-value">
                  {natural.width} × {natural.height}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("circleCrop.selection")}</p>
                <p className="resize-value">
                  {selectionPx.sw} × {selectionPx.sh}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("circleCrop.format")}</p>
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
            onClick={handleCropAndDownload}
            disabled={!file || isProcessing}
          >
            {isProcessing ? t("circleCrop.processing") : t("circleCrop.crop")}
          </button>

          {downloaded && <TryAlsoInline current="circleCrop" />}
        </aside>
      </main>
      <SeoContent pageKey="circleCrop" />
    </>
  );
};

export default CircleCrop;
