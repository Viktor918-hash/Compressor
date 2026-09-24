import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
import "./RemoveBg.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  FiDownload,
  FiArrowLeft,
  FiX,
  FiSettings,
  FiRotateCcw,
  FiUploadCloud,
} from "react-icons/fi";
import { TbBrush, TbEraser, TbWand } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

// Визначаємо мобільний пристрій один раз при завантаженні модуля.
// На мобільних GPU (WebGPU) часто нестабільний або взагалі не підтримується —
// примусова спроба його ініціалізувати іноді крашить вкладку без JS-помилки
// (і try/catch це не ловить), тому на мобільних одразу форсуємо CPU/WASM.
// На ПК нічого не змінюємо — там GPU працює добре і швидко.
const isMobile =
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Мінімальний розмір моделі (~40MB, квантована) — швидше завантажується
// користувачу при першому запуску, ніж дефолтна ~80MB. Обробка триває
// повністю в браузері, фото нікуди не відправляється.
const BG_REMOVAL_CONFIG = {
  model: "isnet_quint8",
  // На ПК лишаємо GPU (WebGPU), як і було — це найшвидший варіант і там
  // все стабільно працює. На мобільних форсуємо CPU, щоб уникнути
  // нестабільної/непідтримуваної ініціалізації WebGPU, яка може вбити вкладку.
  device: isMobile ? "cpu" : "gpu",
  output: { format: "image/png", quality: 0.9 },
};

// Довша сторона фото перед обробкою — модель однаково працює з
// внутрішнім масштабуванням, тож подавати їй фото 4000px замість 1600px
// лише сповільнює обробку без приросту якості маски.
// На мобільних беремо менше значення — менший вхід для моделі означає
// суттєво менше пам'яті на проміжні тензори, що критично на слабких пристроях.
const MAX_PROCESS_DIMENSION = isMobile ? 1024 : 1600;

const MIN_BRUSH = 8;
const MAX_BRUSH = 120;

// Частка заповнення для .range-input (styles/range.css) — 0–100%.
const rangeProgress = (value, min, max) => `${((value - min) / (max - min)) * 100}%`;

const RemoveBg = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | processing | ready | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [downloaded, setDownloaded] = useState(false);

  const [brushMode, setBrushMode] = useState("restore"); // restore | erase
  const [brushSize, setBrushSize] = useState(36);
  const [cursorPos, setCursorPos] = useState(null);

  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const originalDataRef = useRef(null); // ImageData оригінального фото (для "відновити")
  const isPaintingRef = useRef(false);
  const removeBgFnRef = useRef(null); // лінива підвантажена бібліотека

  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "removeBg");
  const meta = PAGE_META.removeBg[lang];

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

  // Заздалегідь підвантажуємо модель (~40MB), поки юзер ще дивиться на
  // dropzone і вибирає фото — тоді сама обробка після вибору фото
  // почнеться майже миттєво, а не після довгого чекання на модель.
  useEffect(() => {
    // Не тягнемо ~40 МБ наперед на повільному з'єднанні / у режимі економії
    // трафіку — модель завантажиться, коли користувач справді додасть фото.
    const conn = navigator.connection;
    if (
      conn?.saveData ||
      ["slow-2g", "2g", "3g"].includes(conn?.effectiveType)
    ) {
      return undefined;
    }

    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;

    const id = idle(async () => {
      try {
        const mod = await import("@imgly/background-removal");
        removeBgFnRef.current = mod.removeBackground;
        await mod.preload(BG_REMOVAL_CONFIG);
      } catch (e) {
        // Прелоад — це лише оптимізація; якщо не вдалось (немає мережі,
        // старий браузер тощо), просто довантажимо модель пізніше, коли
        // юзер реально завантажить фото.
        console.warn("Не вдалось заздалегідь підвантажити модель:", e);
      }
    });

    return () => cancelIdle(id);
  }, []);

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

  const drawOnCanvas = (canvas, img) => {
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return ctx;
  };

  // Зменшує занадто велике фото перед обробкою — значно пришвидшує
  // сегментацію на важких фото (наприклад, прямо з камери телефону),
  // майже не впливаючи на якість результату.
  //
  // На ПК лишаємо старий підхід через new Image() — там пам'яті достатньо,
  // все стабільно й швидко, зайвий раз не чіпаємо.
  //
  // На мобільних використовуємо createImageBitmap з опціями resize:
  // браузер декодує фото одразу в потрібному зменшеному розмірі, без
  // проміжної алокації повного растру (для фото з камери 12MP+ це різниця
  // між ~1-2MB та ~48MB пам'яті лише на декодування) — саме це і є
  // головною причиною OOM-крашів на мобільних.
  const downscaleIfNeeded = async (originalFile) => {
    if (isMobile) {
      const probe = await createImageBitmap(originalFile);
      const longSide = Math.max(probe.width, probe.height);

      if (longSide <= MAX_PROCESS_DIMENSION) {
        probe.close();
        return originalFile;
      }

      const scale = MAX_PROCESS_DIMENSION / longSide;
      const targetW = Math.round(probe.width * scale);
      const targetH = Math.round(probe.height * scale);
      probe.close();

      const bitmap = await createImageBitmap(originalFile, {
        resizeWidth: targetW,
        resizeHeight: targetH,
        resizeQuality: "medium",
      });

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const blob = await new Promise((res) =>
        canvas.toBlob(res, originalFile.type || "image/jpeg", 0.92)
      );
      return new File([blob], originalFile.name, {
        type: originalFile.type || "image/jpeg",
      });
    }

    // ---- Десктоп: без змін, як і було раніше ----
    const url = URL.createObjectURL(originalFile);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    URL.revokeObjectURL(url);

    const longSide = Math.max(img.naturalWidth, img.naturalHeight);
    if (longSide <= MAX_PROCESS_DIMENSION) {
      return originalFile;
    }

    const scale = MAX_PROCESS_DIMENSION / longSide;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((res) =>
      canvas.toBlob(res, originalFile.type || "image/jpeg", 0.92)
    );
    return new File([blob], originalFile.name, {
      type: originalFile.type || "image/jpeg",
    });
  };

  const processFile = useCallback(
    async (f) => {
      setError("");
      setDownloaded(false);
      setStatus("processing");
      setProgress(0);
      setFile(f);
      setMobileSettingsOpen(false);

      try {
        // Бібліотека важка (модель ~40MB) — вантажимо лише коли реально
        // користуються цим інструментом, а не в загальному бандлі сайту.
        if (!removeBgFnRef.current) {
          const mod = await import("@imgly/background-removal");
          removeBgFnRef.current = mod.removeBackground;
        }
        const removeBackground = removeBgFnRef.current;

        // Зменшуємо занадто велике фото — суттєво пришвидшує обробку.
        const processedFile = await downscaleIfNeeded(f);

        // Зберігаємо оригінал (для "магічної кисті" — відновлення)
        const originalUrl = URL.createObjectURL(processedFile);
        const originalImg = new Image();
        await new Promise((res, rej) => {
          originalImg.onload = res;
          originalImg.onerror = rej;
          originalImg.src = originalUrl;
        });

        const tmpCanvas = document.createElement("canvas");
        const tmpCtx = drawOnCanvas(tmpCanvas, originalImg);
        originalDataRef.current = tmpCtx.getImageData(
          0,
          0,
          tmpCanvas.width,
          tmpCanvas.height
        );
        URL.revokeObjectURL(originalUrl);

        const resultBlob = await removeBackground(processedFile, {
          ...BG_REMOVAL_CONFIG,
          progress: (_key, current, total) => {
            if (total) setProgress(Math.round((current / total) * 100));
          },
        });

        const resultUrl = URL.createObjectURL(resultBlob);
        const resultImg = new Image();
        await new Promise((res, rej) => {
          resultImg.onload = res;
          resultImg.onerror = rej;
          resultImg.src = resultUrl;
        });

        if (canvasRef.current) {
          drawOnCanvas(canvasRef.current, resultImg);
        }
        URL.revokeObjectURL(resultUrl);

        setStatus("ready");
      } catch (e) {
        console.error(e);
        setError(t("removeBg.error"));
        setStatus("error");
      }
    },
    [t]
  );

  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) processFile(accepted[0]);
    },
    [processFile]
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: false,
  });

  // ---- Магічна кисть: малювання по alpha-каналу ----
  const paintAt = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const original = originalDataRef.current;
    if (!canvas || !original) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (clientX - rect.left) * scaleX;
    const cy = (clientY - rect.top) * scaleY;
    const radius = (brushSize / 2) * ((scaleX + scaleY) / 2);

    const ctx = canvas.getContext("2d");
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(canvas.width, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(canvas.height, Math.ceil(cy + radius));
    if (maxX <= minX || maxY <= minY) return;

    const region = ctx.getImageData(minX, minY, maxX - minX, maxY - minY);
    const w = maxX - minX;

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > radius * radius) continue;

        const localIdx = ((y - minY) * w + (x - minX)) * 4;
        const srcIdx = (y * canvas.width + x) * 4;

        if (brushMode === "restore") {
          region.data[localIdx] = original.data[srcIdx];
          region.data[localIdx + 1] = original.data[srcIdx + 1];
          region.data[localIdx + 2] = original.data[srcIdx + 2];
          region.data[localIdx + 3] = original.data[srcIdx + 3];
        } else {
          region.data[localIdx + 3] = 0;
        }
      }
    }

    ctx.putImageData(region, minX, minY);
    setDownloaded(false);
  };

  const getPointFromEvent = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e) => {
    if (status !== "ready") return;
    isPaintingRef.current = true;
    const { x, y } = getPointFromEvent(e);
    paintAt(x, y);
  };

  const handlePointerMove = (e) => {
    if (!wrapRef.current || status !== "ready") return;
    const rect = wrapRef.current.getBoundingClientRect();
    const { x, y } = getPointFromEvent(e);
    setCursorPos({ x: x - rect.left, y: y - rect.top });
    if (isPaintingRef.current) paintAt(x, y);
  };

  const handlePointerUp = () => {
    isPaintingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-no-bg.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    }, "image/png");
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError("");
    setDownloaded(false);
    setMobileSettingsOpen(false);
    originalDataRef.current = null;
  };

  return (
    <>
    <main className="main" {...getRootProps()}>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="page-drag-overlay">
          <p>{t("removeBg.dropText2")}</p>
        </div>
      )}

      <div className="main__wrapper container">
        <div className="main__content">
          {!file && (
            <>
              <div className="main__txt">
                <h1 className="main__title">
                  {t("removeBg.title")}{" "}
                  <span className="title__gradient">
                    {t("removeBg.titleGradient")}
                  </span>
                </h1>
                <p className="main__text">{t("removeBg.subtitle")}</p>
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
                    {t("removeBg.dropzone")}
                  </button>
                </div>
                <p className="photo__input__trust">{t("panel.emptyTrust")}</p>
              </div>
            </>
          )}

          {file && (
            <div className="removebg-preview-area">
              <div
                className="removebg-preview-wrap"
                ref={wrapRef}
                onMouseEnter={() => status === "ready" && setCursorPos(null)}
                onMouseLeave={() => setCursorPos(null)}
              >
                <canvas
                  ref={canvasRef}
                  className="removebg-canvas"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                />

                {status === "ready" && cursorPos && (
                  <div
                    className={`removebg-brush-cursor ${
                      brushMode === "erase"
                        ? "removebg-brush-cursor--erase"
                        : ""
                    }`}
                    style={{
                      left: cursorPos.x,
                      top: cursorPos.y,
                      width: brushSize,
                      height: brushSize,
                    }}
                  />
                )}

                {status === "processing" && (
                  <div className="removebg-processing">
                    <div className="removebg-spinner" />
                    <p className="removebg-processing-text">
                      {t("removeBg.processing")}
                    </p>
                    <div className="removebg-processing-bar">
                      <div
                        className="removebg-processing-bar-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {status === "ready" && (
                <p className="removebg-hint">{t("removeBg.brushHint")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {file && (
        <button
          type="button"
          className="removebg-toggle-btn"
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
              ? t("removeBg.downloadedTitle")
              : t("removeBg.settingsTitle")}
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
          <div className="removebg-controls">
            <div className="removebg-block">
              <p className="removebg-label">{t("removeBg.brushMode")}</p>
              <div className="removebg-mode-group">
                <button
                  type="button"
                  className={`removebg-mode-btn ${
                    brushMode === "restore" ? "removebg-mode-btn--active" : ""
                  }`}
                  onClick={() => setBrushMode("restore")}
                  disabled={status !== "ready"}
                >
                  <TbBrush size={18} />
                  {t("removeBg.restore")}
                </button>
                <button
                  type="button"
                  className={`removebg-mode-btn removebg-mode-btn--erase ${
                    brushMode === "erase" ? "removebg-mode-btn--active" : ""
                  }`}
                  onClick={() => setBrushMode("erase")}
                  disabled={status !== "ready"}
                >
                  <TbEraser size={18} />
                  {t("removeBg.erase")}
                </button>
              </div>
            </div>

            <div className="removebg-block">
              <p className="removebg-label">{t("removeBg.brushSize")}</p>
              <div className="removebg-slider-row">
                <input
                  type="range"
                  className="range-input"
                  min={MIN_BRUSH}
                  max={MAX_BRUSH}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  disabled={status !== "ready"}
                  style={{ "--progress": rangeProgress(brushSize, MIN_BRUSH, MAX_BRUSH) }}
                />
                <span className="removebg-slider-value">{brushSize}px</span>
              </div>
            </div>

            <button
              type="button"
              className="removebg-reset-btn"
              onClick={() => processFile(file)}
              disabled={status === "processing"}
            >
              <FiRotateCcw size={16} />
              {t("removeBg.reprocess")}
            </button>

            {error && <p className="error-text">{error}</p>}
          </div>
        )}

        <button
          className={`side-panel__download-btn ${
            !file ? "side-panel__download-btn--empty" : ""
          }`}
          onClick={handleDownload}
          disabled={!file || status !== "ready"}
        >
          {status === "processing" ? (
            t("removeBg.processing")
          ) : (
            <>
              <TbWand
                size={18}
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              {t("removeBg.download")}
            </>
          )}
        </button>
      </aside>
    </main>
    <SeoContent pageKey="removeBg" />
    </>
  );
};

export default RemoveBg;
