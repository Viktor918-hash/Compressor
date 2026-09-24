import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
import "./Resize.css";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiArrowLeft, FiX, FiSettings, FiUploadCloud } from "react-icons/fi";
import { TbArrowsMove } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const PRESETS = [
  { name: "Instagram", width: 1080, height: 1080 },
  { name: "Facebook", width: 1200, height: 630 },
  { name: "YouTube", width: 1280, height: 720 },
  { name: "Twitter", width: 1600, height: 900 },
];

const FORMATS = [
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
];

const RATIO_MATCH_TOLERANCE = 0.01;

// Жорсткі межі canvas у браузерах (Chrome/Firefox: 32767 px по стороні,
// ≈268 Мпікс площа). Понад це toBlob() тихо повертає порожнє зображення.
const MAX_CANVAS_SIDE = 32767;
const MAX_CANVAS_AREA = 268_435_456;

const Resize = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [original, setOriginal] = useState({ width: 0, height: 0 });

  const [newWidth, setNewWidth] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState(FORMATS[0]);

  const [cropMode, setCropMode] = useState("cover");
  const [cropOffset, setCropOffset] = useState(0.5);

  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");

  // Чи відкрита панель налаштувань на мобільному.
  // За замовчуванням false — щоб одразу після завантаження фото було видно,
  // а не одразу закрите панеллю
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const ratioRef = useRef(1);
  const previewRef = useRef(null);
  const draggingRef = useRef(false);
  const imageUrlRef = useRef(null); // поточний Blob-URL, щоб звільняти його

  // Звільняємо Blob-URL при виході зі сторінки
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  const loadFile = useCallback((f) => {
    setError("");
    setDownloaded(false);

    const url = URL.createObjectURL(f);
    const img = new Image();

    img.onload = () => {
      // Попередній Blob-URL більше не потрібен — не тримаємо його в пам'яті
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = url;
      setFile(f);
      setImageUrl(url);
      setOriginal({ width: img.naturalWidth, height: img.naturalHeight });
      setNewWidth(img.naturalWidth);
      setNewHeight(img.naturalHeight);
      setCropOffset(0.5);
      setMobileSettingsOpen(false); // показуємо фото першим
      ratioRef.current = img.naturalWidth / img.naturalHeight;
    };

    img.onerror = () => {
      setError(t("errors.imageDecodeFailed", { name: f.name }));
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [t]);

  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) loadFile(accepted[0]);
    },
    [loadFile]
  );

  // Файл не з accept (напр. .txt/.pdf) — раніше тихо ігнорувався
  const onDropRejected = useCallback(
    (rejections) => {
      const name = rejections?.[0]?.file?.name || "";
      setError(t("errors.fileInvalidType", { name }));
    },
    [t]
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
    onDropRejected,
    noClick: true,
    noKeyboard: true,
    multiple: false,
  });

  const needsCrop = useMemo(() => {
    if (!newWidth || !newHeight) return false;
    const targetRatio = newWidth / newHeight;
    return Math.abs(targetRatio - ratioRef.current) > RATIO_MATCH_TOLERANCE;
  }, [newWidth, newHeight]);

  const cropGeometry = useMemo(() => {
    if (!newWidth || !newHeight) return null;
    const imgRatio = ratioRef.current;
    const targetRatio = newWidth / newHeight;

    if (imgRatio > targetRatio) {
      const widthPercent = (targetRatio / imgRatio) * 100;
      return {
        axis: "x",
        widthPercent,
        heightPercent: 100,
        left: cropOffset * (100 - widthPercent),
        top: 0,
      };
    } else {
      const heightPercent = (imgRatio / targetRatio) * 100;
      return {
        axis: "y",
        widthPercent: 100,
        heightPercent,
        left: 0,
        top: cropOffset * (100 - heightPercent),
      };
    }
  }, [newWidth, newHeight, cropOffset]);

  const updateOffsetFromEvent = useCallback(
    (clientX, clientY) => {
      if (!previewRef.current || !cropGeometry) return;
      const rect = previewRef.current.getBoundingClientRect();

      let value;
      if (cropGeometry.axis === "x") {
        value = (clientX - rect.left) / rect.width;
      } else {
        value = (clientY - rect.top) / rect.height;
      }
      setCropOffset(Math.min(1, Math.max(0, value)));
    },
    [cropGeometry]
  );

  const handlePointerDown = (e) => {
    if (!needsCrop || cropMode !== "cover") return;
    draggingRef.current = true;
    updateOffsetFromEvent(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return;
      updateOffsetFromEvent(e.clientX, e.clientY);
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [updateOffsetFromEvent]);

  useEffect(() => {
    if (file) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [file]);

  const handleWidthChange = (value) => {
    const w = value === "" ? "" : Math.max(1, parseInt(value, 10) || 1);
    setNewWidth(w);
    if (keepRatio && w !== "") {
      setNewHeight(Math.round(w / ratioRef.current));
    }
    setCropOffset(0.5);
    setDownloaded(false);
  };

  const handleHeightChange = (value) => {
    const h = value === "" ? "" : Math.max(1, parseInt(value, 10) || 1);
    setNewHeight(h);
    if (keepRatio && h !== "") {
      setNewWidth(Math.round(h * ratioRef.current));
    }
    setCropOffset(0.5);
    setDownloaded(false);
  };

  const applyPreset = (preset) => {
    setKeepRatio(false);
    setCropMode("cover");
    setNewWidth(preset.width);
    setNewHeight(preset.height);
    setCropOffset(0.5);
    setDownloaded(false);
  };

  const drawImageCover = (ctx, img, targetW, targetH, offset) => {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = targetW / targetH;

    let sx, sy, sWidth, sHeight;

    if (imgRatio > targetRatio) {
      sHeight = img.naturalHeight;
      sWidth = sHeight * targetRatio;
      sx = (img.naturalWidth - sWidth) * offset;
      sy = 0;
    } else {
      sWidth = img.naturalWidth;
      sHeight = sWidth / targetRatio;
      sx = 0;
      sy = (img.naturalHeight - sHeight) * offset;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
  };

  // Головна дія: обробка і одразу завантаження, без проміжного кроку
  const handleResizeAndDownload = async () => {
    if (!file || !newWidth || !newHeight) return;

    if (
      newWidth > MAX_CANVAS_SIDE ||
      newHeight > MAX_CANVAS_SIDE ||
      newWidth * newHeight > MAX_CANVAS_AREA
    ) {
      setError(t("errors.outputTooBig"));
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const img = new Image();
      img.src = imageUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";

      // JPG не підтримує прозорість: без білої підкладки прозорі ділянки
      // PNG/WebP ставали чорними (див. те саме в convertToJpg.jsx)
      if (format.value === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (needsCrop && cropMode === "cover") {
        drawImageCover(ctx, img, newWidth, newHeight, cropOffset);
      } else {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      }

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, format.value, 0.92)
      );
      if (!blob) throw new Error("toBlob failed");

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const outputName = `${baseName}-${newWidth}x${newHeight}.${format.ext}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outputName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // не відкликаємо URL одразу: частина браузерів ще не почала завантаження
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setDownloaded(true);
    } catch (e) {
      console.error("resize failed:", e);
      setError(t("errors.resizeFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setFile(null);
    setImageUrl(null);
    setOriginal({ width: 0, height: 0 });
    setNewWidth("");
    setNewHeight("");
    setError("");
    setDownloaded(false);
    setMobileSettingsOpen(false);
  };
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "resize");
  const meta = PAGE_META.resize[lang];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
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
    <main className="main" {...getRootProps()}>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="page-drag-overlay">
          <p>{t("resize.dropText2")} </p>
        </div>
      )}

      <div className="main__wrapper container">
        <div className="main__content">
          {!file && (
            <>
              <div className="main__txt">
                <h1 className="main__title">
                  {t("resize.title")}{" "}
                  <span className="title__gradient">{t("resize.photo")} </span>
                </h1>
                <p className="main__text">{t("resize.subtitle")}</p>
              </div>

              <div className="photo__input" id="dropzona">
                <div className="input__download">
                  <FiDownload
                    size={35}
                    color="var(--color-primary-600)"
                    className="download__icon"
                  />
                </div>
                <div className="input__info-text">
                  <button
                    type="button"
                    className="input__text input__text--button"
                    onClick={open}
                  >
                    {t("resize.dropzone")}
                  </button>
                </div>
                <p className="photo__input__trust">{t("panel.emptyTrust")}</p>
              </div>

              {/* помилка до завантаження файлу (не той тип / не вдалося відкрити) */}
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
            </>
          )}

          {file && (
            <div className="resize-preview-area">
              <div
                className="resize-preview-wrap"
                ref={previewRef}
                onPointerDown={handlePointerDown}
              >
                <img
                  src={imageUrl}
                  alt={file.name}
                  className="resize-preview"
                />

                {needsCrop && cropMode === "cover" && cropGeometry && (
                  <div
                    className="resize-crop-frame"
                    style={{
                      width: `${cropGeometry.widthPercent}%`,
                      height: `${cropGeometry.heightPercent}%`,
                      left: `${cropGeometry.left}%`,
                      top: `${cropGeometry.top}%`,
                    }}
                  >
                    <TbArrowsMove size={18} className="resize-crop-handle" />
                  </div>
                )}
              </div>

              {needsCrop && cropMode === "cover" && (
                <p className="resize-hint">{t("resize.cropHint")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* кнопка-тогл налаштувань — видима тільки на мобільних (див. Resize.css) */}
      {file && (
        <button
          type="button"
          className="resize-toggle-btn"
          onClick={() => setMobileSettingsOpen((prev) => !prev)}
          aria-label={
            mobileSettingsOpen
              ? t("panel.hideSettings")
              : t("panel.showSettings")
          }
        >
          {mobileSettingsOpen ? <FiX size={22} /> : <FiSettings size={22} />}
        </button>
      )}

      <aside
        className={`side-panel ${file ? "side-panel--open" : ""} ${
          !mobileSettingsOpen ? "side-panel--mobile-collapsed" : ""
        }`}
        inert={!file}
      >
        <div className="side-panel__header">
          {file && (
            <div className="side-panel__back">
              <button
                className="side-panel__back-btn"
                onClick={handleReset}
                aria-label={t("panel.closePanel")}
              >
                <FiArrowLeft size={20} /> {t("panel.closePanel")}
              </button>
            </div>
          )}
          <h2 className="side-panel__title">
            {downloaded
              ? t("resize.downloadedTitle")
              : t("resize.settingsTitle")}
          </h2>
        </div>

        {!file ? (
          <div className="side-panel__empty-state">
            <FiUploadCloud
              size={28}
              className="side-panel__empty-icon"
              aria-hidden="true"
            />
            <p className="side-panel__empty">{t("panel.adFile")} </p>
            <p className="side-panel__empty-trust">
              {t("panel.emptyTrust")}
            </p>
          </div>
        ) : (
          <div className="resize-controls">
            <div className="resize-block">
              <p className="resize-label">{t("resize.original")} </p>
              <p className="resize-value">
                {original.width} × {original.height}
              </p>
            </div>

            <div className="resize-row">
              <div className="resize-block">
                <label className="resize-label" htmlFor="newWidth">
                  {t("resize.newWidth")}
                </label>
                <input
                  id="newWidth"
                  type="number"
                  value={newWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                />
              </div>
              <div className="resize-block">
                <label className="resize-label" htmlFor="newHeight">
                  {t("resize.newHeight")}
                </label>
                <input
                  id="newHeight"
                  type="number"
                  value={newHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </div>
            </div>

            <label className="resize-checkbox">
              <input
                type="checkbox"
                checked={keepRatio}
                onChange={(e) => {
                  setKeepRatio(e.target.checked);
                  if (e.target.checked) {
                    ratioRef.current = original.width / original.height;
                    setNewHeight(Math.round(newWidth / ratioRef.current));
                  }
                  setDownloaded(false);
                }}
              />
              {t("resize.keepAspectRatio")}
            </label>

            {needsCrop && (
              <div className="resize-block">
                <p className="resize-label">{t("resize.cropMethod")} </p>
                <div className="resize-format-group">
                  <button
                    className={`resize-format-btn ${
                      cropMode === "cover" ? "resize-format-btn--active" : ""
                    }`}
                    onClick={() => {
                      setCropMode("cover");
                      setDownloaded(false);
                    }}
                  >
                    {t("resize.cover")}
                  </button>
                  <button
                    className={`resize-format-btn ${
                      cropMode === "stretch" ? "resize-format-btn--active" : ""
                    }`}
                    onClick={() => {
                      setCropMode("stretch");
                      setDownloaded(false);
                    }}
                  >
                    {t("resize.stretch")}
                  </button>
                </div>
              </div>
            )}

            <div className="resize-block">
              <p className="resize-label">{t("resize.format")} </p>
              <div className="resize-format-group">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    className={`resize-format-btn ${
                      format.value === f.value
                        ? "resize-format-btn--active"
                        : ""
                    }`}
                    onClick={() => {
                      setFormat(f);
                      setDownloaded(false);
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="resize-block">
              <p className="resize-label">{t("resize.presets")} </p>
              <div className="resize-presets">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    className="resize-preset-btn"
                    onClick={() => applyPreset(p)}
                  >
                    <span>{p.name}</span>
                    <span className="resize-preset-size">
                      {p.width}×{p.height}
                    </span>
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
          className={`side-panel__download-btn ${
            !file ? "side-panel__download-btn--empty" : ""
          }`}
          onClick={handleResizeAndDownload}
          disabled={!file || isProcessing || !newWidth || !newHeight}
        >
          {isProcessing
            ? t("resize.processing")
            : t("resize.resizeAndDownload")}
        </button>
      </aside>
    </main>
    <SeoContent pageKey="resize" />
    </>
  );
};

export default Resize;
