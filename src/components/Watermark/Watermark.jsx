// Водяний знак на фото: текстовий напис або власне лого, одна з 5
// нерухомих позицій або повторення «плиткою» по всьому кадру. Прев'ю
// перемальовується автоматично при зміні будь-якого параметра (через
// useEffect — на відміну від CropImage/RotateImage, тут не потрібен
// requestAnimationFrame після decode: react батчить setFile/setNatural у
// той самий рендер, у якому монтується <canvas>, тож ефект бачить canvasRef
// вже заповненим одразу після коміту).
// Геометрія (позиції, тайлінг, затискання параметрів) — у ../watermark.js
// (чисто, без DOM); малювання в canvas — тут.
import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
import "../Resize/Resize.css";
import "./Watermark.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiArrowLeft, FiX, FiSettings, FiImage, FiType, FiUploadCloud } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import { decodeImage, codedError } from "../../utils/decodeImage";
import {
  POSITIONS,
  clampOpacity,
  clampFontPercent,
  fontSizePx,
  clampScalePercent,
  logoSizePx,
  singlePosition,
  tilePositions,
} from "./watermark";

const SITE_URL = "https://compressphoto.org";
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const FORMATS = [
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
];

const DEFAULT_TEXT_COLOR = "#ffffff";

/**
 * Малює основне фото на canvas і накладає водяний знак (текст або лого) за
 * заданими параметрами. fillWhite=true — заливка білим перед малюванням
 * фото (для JPG, той самий фікс прозорості, що й в інших інструментах).
 */
function renderWatermarked(canvas, decoded, wm, logoDecoded, fillWhite) {
  const canvasW = decoded.width;
  const canvasH = decoded.height;
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
  ctx.drawImage(decoded.image, 0, 0, canvasW, canvasH);

  const margin = Math.round(Math.min(canvasW, canvasH) * 0.03);

  if (wm.type === "text" && wm.text.trim()) {
    const fpx = fontSizePx(canvasW, canvasH, wm.fontPercent);
    ctx.font = `bold ${fpx}px Arial, Helvetica, sans-serif`;
    ctx.textBaseline = "top";
    const wmW = ctx.measureText(wm.text).width;
    const wmH = fpx * 1.2;
    ctx.globalAlpha = wm.opacity;
    ctx.fillStyle = wm.color;
    if (wm.position === "tile") {
      const gap = wmW * 0.6 + fpx;
      for (const p of tilePositions(canvasW, canvasH, wmW, wmH, gap)) {
        ctx.fillText(wm.text, p.x, p.y);
      }
    } else {
      const p = singlePosition(canvasW, canvasH, wmW, wmH, wm.position, margin);
      ctx.fillText(wm.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  } else if (wm.type === "image" && logoDecoded) {
    const { width: wmW, height: wmH } = logoSizePx(canvasW, logoDecoded.width, logoDecoded.height, wm.scalePercent);
    ctx.globalAlpha = wm.opacity;
    if (wm.position === "tile") {
      const gap = wmW * 0.4;
      for (const p of tilePositions(canvasW, canvasH, wmW, wmH, gap)) {
        ctx.drawImage(logoDecoded.image, p.x, p.y, wmW, wmH);
      }
    } else {
      const p = singlePosition(canvasW, canvasH, wmW, wmH, wm.position, margin);
      ctx.drawImage(logoDecoded.image, p.x, p.y, wmW, wmH);
    }
    ctx.globalAlpha = 1;
  }

  return { width: canvasW, height: canvasH };
}

const Watermark = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "addWatermark");
  const meta = PAGE_META.addWatermark[lang];

  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [wmType, setWmType] = useState("text");
  const [text, setText] = useState("");
  const [fontPercent, setFontPercent] = useState(6);
  const [color, setColor] = useState(DEFAULT_TEXT_COLOR);
  const [textOpacity, setTextOpacity] = useState(0.6);
  const [logoNatural, setLogoNatural] = useState(null);
  const [logoOpacity, setLogoOpacity] = useState(0.6);
  const [logoScalePercent, setLogoScalePercent] = useState(20);
  const [position, setPosition] = useState("bottomRight");
  const [format, setFormat] = useState(FORMATS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const previewRef = useRef(null);
  const canvasRef = useRef(null);
  const decodedRef = useRef(null); // {image,width,height,release} основного фото
  const logoDecodedRef = useRef(null); // те саме для лого
  const logoInputRef = useRef(null);

  const releaseDecoded = useCallback(() => {
    decodedRef.current?.release?.();
    decodedRef.current = null;
  }, []);
  const releaseLogo = useCallback(() => {
    logoDecodedRef.current?.release?.();
    logoDecodedRef.current = null;
  }, []);

  useEffect(() => releaseDecoded, [releaseDecoded]);
  useEffect(() => releaseLogo, [releaseLogo]);

  // Перемальовує прев'ю при будь-якій зміні водяного знака. Ефект (не
  // виклик одразу після setState) навмисно: коли завантажується основне
  // фото, setFile/setNatural відбуваються в тому самому рендері, у якому
  // <canvas> вперше монтується — React комітить DOM і лише ПІСЛЯ цього
  // запускає ефекти, тож canvasRef.current тут завжди вже існує.
  useEffect(() => {
    const decoded = decodedRef.current;
    const canvas = canvasRef.current;
    if (!decoded || !canvas) return;
    const wm = {
      type: wmType,
      text,
      fontPercent,
      color,
      opacity: wmType === "text" ? textOpacity : logoOpacity,
      position,
      scalePercent: logoScalePercent,
    };
    renderWatermarked(canvas, decoded, wm, wmType === "image" ? logoDecodedRef.current : null, false);
  }, [natural, wmType, text, fontPercent, color, textOpacity, position, logoOpacity, logoScalePercent, logoNatural]);

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
        setMobileSettingsOpen(false);
      } catch {
        setError(t("errors.imageDecodeFailed", { name: f.name }));
      }
    },
    [t, releaseDecoded]
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

  const handleLogoChange = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // щоб той самий файл можна було обрати повторно
    if (!f) return;
    try {
      const decoded = await decodeImage(f);
      releaseLogo();
      logoDecodedRef.current = decoded;
      setLogoNatural({ width: decoded.width, height: decoded.height });
      setDownloaded(false);
    } catch {
      setError(t("errors.imageDecodeFailed", { name: f.name }));
    }
  };

  const handleDownload = async () => {
    const decoded = decodedRef.current;
    if (!file || !decoded) return;

    setIsProcessing(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      const ctx0 = canvas.getContext("2d");
      if (!ctx0) throw codedError("ENCODE_FAILED");
      const wm = {
        type: wmType,
        text,
        fontPercent,
        color,
        opacity: wmType === "text" ? textOpacity : logoOpacity,
        position,
        scalePercent: logoScalePercent,
      };
      renderWatermarked(canvas, decoded, wm, wmType === "image" ? logoDecodedRef.current : null, format.value === "image/jpeg");

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format.value, 0.92));
      if (!blob) throw codedError("ENCODE_FAILED");

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const outputName = `${baseName}-watermark.${format.ext}`;
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
      console.error("watermark failed:", e);
      setError(t("addWatermark.errors.watermarkFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    releaseDecoded();
    releaseLogo();
    setFile(null);
    setNatural({ width: 0, height: 0 });
    setWmType("text");
    setText("");
    setFontPercent(6);
    setColor(DEFAULT_TEXT_COLOR);
    setTextOpacity(0.6);
    setLogoNatural(null);
    setLogoOpacity(0.6);
    setLogoScalePercent(20);
    setPosition("bottomRight");
    setError("");
    setDownloaded(false);
    setMobileSettingsOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = file ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [file]);

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
            <p>{t("addWatermark.dropText2")}</p>
          </div>
        )}

        <div className="main__wrapper container">
          <div className="main__content">
            {!file && (
              <>
                <div className="main__txt">
                  <h1 className="main__title">
                    {t("addWatermark.titlePart1")}{" "}
                    <span className="title__gradient">{t("addWatermark.titleGradient")}</span>
                  </h1>
                  <p className="main__text">{t("addWatermark.subtitle")}</p>
                </div>

                <div className="photo__input" id="dropzona">
                  <div className="input__download">
                    <FiDownload size={35} color="var(--color-primary-600)" className="download__icon" />
                  </div>
                  <div className="input__info-text">
                    <button type="button" className="input__text input__text--button" onClick={open}>
                      {t("addWatermark.dropzone")}
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
              <div className="wm-preview-area">
                <div
                  className="wm-preview-wrap"
                  ref={previewRef}
                  style={{
                    aspectRatio: `${natural.width} / ${natural.height}`,
                    "--ar": natural.height ? natural.width / natural.height : 1,
                  }}
                >
                  <canvas ref={canvasRef} className="wm-preview-canvas" />
                </div>
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
              {downloaded ? t("addWatermark.downloadedTitle") : t("addWatermark.settingsTitle")}
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
                <p className="resize-label">{t("addWatermark.type")}</p>
                <div className="resize-format-group">
                  <button
                    className={`resize-format-btn ${wmType === "text" ? "resize-format-btn--active" : ""}`}
                    onClick={() => { setWmType("text"); setDownloaded(false); }}
                  >
                    <FiType size={16} /> {t("addWatermark.typeText")}
                  </button>
                  <button
                    className={`resize-format-btn ${wmType === "image" ? "resize-format-btn--active" : ""}`}
                    onClick={() => { setWmType("image"); setDownloaded(false); }}
                  >
                    <FiImage size={16} /> {t("addWatermark.typeImage")}
                  </button>
                </div>
              </div>

              {wmType === "text" ? (
                <>
                  <div className="resize-block">
                    <p className="resize-label">{t("addWatermark.text")}</p>
                    <input
                      type="text"
                      className="wm-text-input"
                      value={text}
                      placeholder={t("addWatermark.textPlaceholder")}
                      onChange={(e) => { setText(e.target.value); setDownloaded(false); }}
                      maxLength={80}
                    />
                  </div>
                  <div className="resize-block">
                    <p className="resize-label">
                      {t("addWatermark.fontSize")}: {fontPercent}%
                    </p>
                    <input
                      type="range"
                      className="wm-range"
                      min={2}
                      max={15}
                      value={fontPercent}
                      onChange={(e) => { setFontPercent(clampFontPercent(Number(e.target.value))); setDownloaded(false); }}
                    />
                  </div>
                  <div className="resize-block">
                    <p className="resize-label">{t("addWatermark.color")}</p>
                    <input
                      type="color"
                      className="wm-color-input"
                      value={color}
                      onChange={(e) => { setColor(e.target.value); setDownloaded(false); }}
                    />
                  </div>
                  <div className="resize-block">
                    <p className="resize-label">
                      {t("addWatermark.opacity")}: {Math.round(textOpacity * 100)}%
                    </p>
                    <input
                      type="range"
                      className="wm-range"
                      min={5}
                      max={100}
                      value={Math.round(textOpacity * 100)}
                      onChange={(e) => { setTextOpacity(clampOpacity(Number(e.target.value) / 100)); setDownloaded(false); }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="resize-block">
                    <p className="resize-label">{t("addWatermark.logo")}</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="wm-hidden-input"
                      onChange={handleLogoChange}
                    />
                    <button type="button" className="resize-format-btn" onClick={() => logoInputRef.current?.click()}>
                      {logoNatural ? t("addWatermark.logoChange") : t("addWatermark.logoUpload")}
                    </button>
                    {logoNatural && (
                      <p className="wm-logo-dims">
                        {logoNatural.width} × {logoNatural.height}
                      </p>
                    )}
                  </div>
                  <div className="resize-block">
                    <p className="resize-label">
                      {t("addWatermark.scale")}: {logoScalePercent}%
                    </p>
                    <input
                      type="range"
                      className="wm-range"
                      min={5}
                      max={60}
                      value={logoScalePercent}
                      onChange={(e) => { setLogoScalePercent(clampScalePercent(Number(e.target.value))); setDownloaded(false); }}
                    />
                  </div>
                  <div className="resize-block">
                    <p className="resize-label">
                      {t("addWatermark.opacity")}: {Math.round(logoOpacity * 100)}%
                    </p>
                    <input
                      type="range"
                      className="wm-range"
                      min={5}
                      max={100}
                      value={Math.round(logoOpacity * 100)}
                      onChange={(e) => { setLogoOpacity(clampOpacity(Number(e.target.value) / 100)); setDownloaded(false); }}
                    />
                  </div>
                </>
              )}

              <div className="resize-block">
                <p className="resize-label">{t("addWatermark.position")}</p>
                <div className="resize-format-group wm-position-group">
                  {POSITIONS.map((p) => (
                    <button
                      key={p}
                      className={`resize-format-btn ${position === p ? "resize-format-btn--active" : ""}`}
                      onClick={() => { setPosition(p); setDownloaded(false); }}
                    >
                      {t(`addWatermark.positions.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="resize-block">
                <p className="resize-label">{t("addWatermark.format")}</p>
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
            {isProcessing ? t("addWatermark.processing") : t("addWatermark.download")}
          </button>
        </aside>
      </main>
      <SeoContent pageKey="addWatermark" />
    </>
  );
};

export default Watermark;
