// Обрізати фото: один файл за раз, інтерактивна рамка виділення (перетягування
// всієї рамки або одного з 4 кутів) поверх прев'ю, готові пропорції або
// довільна форма. Геометрія рамки — у ../crop.js (чисто, без DOM, тестується
// окремо); малювання в canvas і завантаження файлу — тут, за тим самим
// підходом, що й у Resize.jsx (не через спільний чергово-пакетний Panel:
// обрізання потребує інтерактивного вибору ділянки на ОДНОМУ фото, а не
// однакової дії над чергою файлів).
import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
// Перевикористовуємо стилі бічної панелі/кнопок з Resize.jsx (той самий
// підхід, що й PhotoToPdf.jsx, який імпортує CSS від Convertal) — щоб не
// дублювати .resize-controls/.resize-format-btn/.resize-toggle-btn і т. д.
import "../Resize/Resize.css";
import "./CropImage.css";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiArrowLeft, FiX, FiSettings, FiUploadCloud } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { decodeImage, codedError } from "../../utils/decodeImage";
import { ASPECT_RATIOS, CORNERS, initialRect, moveRect, resizeCorner, rectToPixels } from "./crop";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const FORMATS = [
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
];

// Ті самі жорсткі межі canvas, що й у Resize.jsx (Chrome/Firefox): понад
// це toBlob() тихо повертає порожнє зображення.
const MAX_CANVAS_SIDE = 32767;
const MAX_CANVAS_AREA = 268_435_456;

const CropImage = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "cropImage");
  const meta = PAGE_META.cropImage[lang];

  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [rect, setRect] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [ratioId, setRatioId] = useState("free");
  const [format, setFormat] = useState(FORMATS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const previewRef = useRef(null);
  const canvasRef = useRef(null);
  const decodedRef = useRef(null); // {image,width,height,release} поточного файлу
  const dragRef = useRef(null); // { mode: "move"|"corner", corner? }

  const ratio = useMemo(
    () => ASPECT_RATIOS.find((r) => r.id === ratioId)?.value ?? null,
    [ratioId]
  );

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
        setRatioId("free");
        setRect(initialRect(decoded.width, decoded.height, null));
        setMobileSettingsOpen(false);
        // canvas ще не змонтований у цьому ж рендері — малюємо наступного тіку
        requestAnimationFrame(() => drawPreview(decoded));
      } catch {
        setError(t("errors.imageDecodeFailed", { name: f.name }));
      }
    },
    [t, releaseDecoded, drawPreview]
  );

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

  const handleRatioChange = (id) => {
    setRatioId(id);
    const r = ASPECT_RATIOS.find((x) => x.id === id)?.value ?? null;
    setRect(initialRect(natural.width, natural.height, r));
    setDownloaded(false);
  };

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
          : resizeCorner(prev, drag.corner, dx, dy, ratio, natural.width, natural.height)
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
  }, [clientDeltaToFraction, ratio, natural.width, natural.height]);

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

      // JPG не підтримує прозорість: без білої підкладки прозорі ділянки
      // PNG/WebP/… ставали б чорними (той самий фікс, що й в інших інструментах)
      if (format.value === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sw, sh);
      }

      ctx.drawImage(decoded.image, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format.value, 0.92));
      if (!blob) throw codedError("ENCODE_FAILED");

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const outputName = `${baseName}-crop.${format.ext}`;
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
      console.error("crop failed:", e);
      setError(t("cropImage.errors.cropFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    releaseDecoded();
    setFile(null);
    setNatural({ width: 0, height: 0 });
    setRect({ x: 0, y: 0, w: 1, h: 1 });
    setRatioId("free");
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
            <p>{t("cropImage.dropText2")}</p>
          </div>
        )}

        <div className="main__wrapper container">
          <div className="main__content">
            {!file && (
              <>
                <div className="main__txt">
                  <h1 className="main__title">
                    {t("cropImage.titlePart1")}{" "}
                    <span className="title__gradient">{t("cropImage.titleGradient")}</span>
                  </h1>
                  <p className="main__text">{t("cropImage.subtitle")}</p>
                </div>

                <div className="photo__input" id="dropzona">
                  <div className="input__download">
                    <FiDownload size={35} color="var(--color-primary-600)" className="download__icon" />
                  </div>
                  <div className="input__info-text">
                    <button type="button" className="input__text input__text--button" onClick={open}>
                      {t("cropImage.dropzone")}
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
              <div className="crop-preview-area">
                <div
                  className="crop-preview-wrap"
                  ref={previewRef}
                  style={{
                    aspectRatio: `${natural.width} / ${natural.height}`,
                    // для width:min(...,calc(65vh*var(--ar))) у CropImage.css
                    "--ar": natural.height ? natural.width / natural.height : 1,
                  }}
                >
                  <canvas ref={canvasRef} className="crop-preview-canvas" />

                  <div
                    className="crop-frame"
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
                        className={`crop-handle crop-handle--${c}`}
                        onPointerDown={(e) => startDrag(e, "corner", c)}
                      />
                    ))}
                  </div>
                </div>
                <p className="crop-hint">{t("cropImage.hint")}</p>
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
              {downloaded ? t("cropImage.downloadedTitle") : t("cropImage.settingsTitle")}
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
                <p className="resize-label">{t("cropImage.original")}</p>
                <p className="resize-value">
                  {natural.width} × {natural.height}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("cropImage.selection")}</p>
                <p className="resize-value">
                  {selectionPx.sw} × {selectionPx.sh}
                </p>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("cropImage.aspectRatio")}</p>
                <div className="resize-format-group">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.id}
                      className={`resize-format-btn ${ratioId === r.id ? "resize-format-btn--active" : ""}`}
                      onClick={() => handleRatioChange(r.id)}
                    >
                      {r.id === "free" ? t("cropImage.ratios.free") : r.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("cropImage.format")}</p>
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
            {isProcessing ? t("cropImage.processing") : t("cropImage.crop")}
          </button>
        </aside>
      </main>
      <SeoContent pageKey="cropImage" />
    </>
  );
};

export default CropImage;
