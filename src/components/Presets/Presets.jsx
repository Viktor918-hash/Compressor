import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import "./Presets.css";
import { FiDownload, FiUpload, FiFilter, FiX } from "react-icons/fi";
import { PRESETS } from "./presetsData";
import {
  renderPresetToCanvas,
  canvasToBlob,
  scalePreset,
} from "./Presetengine";
import Beforeafterslider from "./Beforeafterslider";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

const THUMB_SIZE = 480;
const PREVIEW_SIZE = 1400;
const FULL_SIZE = 2000;
const DEFAULT_INTENSITY = 100;

const getFilters = (t) => [
  { id: "portrait", label: t("presets.filterPortrait", "Портрет") },
  { id: "nature", label: t("presets.filterNature", "Природа") },
  { id: "urban", label: t("presets.filterUrban", "Урбан") },
  { id: "night", label: t("presets.filterNight", "Ніч") },
  { id: "summer", label: t("presets.filterSummer", "Літо") },
  { id: "auto", label: t("presets.filterCars", "Авто") },
  { id: "cinematic", label: t("presets.filterCinema", "Кінематографічний") },
  { id: "autumn", label: t("presets.filterAutumn", "Осінь") },
  { id: "winter", label: t("presets.filterWinter", "Зима") },
];

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const Presets = () => {
  const { t } = useTranslation();
  const [originalFile, setOriginalFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const renderTokenRef = useRef(0);
  const previewTokenRef = useRef(0);

  const debouncedIntensity = useDebouncedValue(intensity, 150);
  const filters = useMemo(() => getFilters(t), [t]);
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "presets");
  const meta = PAGE_META.presets[lang];

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

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setErrorMessage("");
    setOriginalFile(file);
    setSelectedId(null);
    setPreviewUrl(null);
    setThumbs({});
    setIntensity(DEFAULT_INTENSITY);
  }, []);

  // Файл не з accept (напр. .txt/.pdf) — раніше тихо ігнорувався
  const onDropRejected = useCallback(
    (rejections) => {
      const name = rejections?.[0]?.file?.name || "";
      setErrorMessage(t("errors.fileInvalidType", { name }));
    },
    [t]
  );

  // noClick/noKeyboard прибрано — тепер уся площа дропзони клікабельна
  // (не тільки кнопка всередині), і доступна з клавіатури (Tab + Enter).
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop,
    onDropRejected,
  });

  useEffect(() => {
    if (!originalFile) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(originalFile);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  // Мініатюри для сітки — завжди при intensity = 100%
  useEffect(() => {
    if (!originalFile) return;
    const token = ++renderTokenRef.current;
    const thumbsCount = {}; // скільки мініатюр уже вдалося створити в цьому проході

    (async () => {
      for (const preset of PRESETS) {
        if (renderTokenRef.current !== token) return;
        try {
          const canvas = await renderPresetToCanvas(originalFile, preset, {
            maxSize: THUMB_SIZE,
          });
          const url = canvas.toDataURL("image/jpeg", 0.85);
          if (renderTokenRef.current === token) {
            setThumbs((prev) => ({ ...prev, [preset.id]: url }));
          }
        } catch (err) {
          console.error("Не вдалося застосувати пресет", preset.id, err);
          // Усі пресети декодують один і той самий файл: якщо перший не
          // вдався — файл зіпсований/не зображення. Раніше сітка вічно
          // показувала "Обробка…" без пояснень.
          if (renderTokenRef.current === token && Object.keys(thumbsCount).length === 0) {
            setErrorMessage(
              t("errors.imageDecodeFailed", { name: originalFile.name })
            );
            setOriginalFile(null);
          }
          return;
        }
        thumbsCount[preset.id] = true;
      }
    })();
  }, [originalFile, t]);

  // Прев'ю в детальному екрані — перераховуємо з дебаунсом при русі повзунка
  useEffect(() => {
    if (!originalFile || !selectedId) {
      setPreviewUrl(null);
      return;
    }
    const preset = PRESETS.find((p) => p.id === selectedId);
    if (!preset) return;

    const token = ++previewTokenRef.current;
    setIsPreviewLoading(true);

    (async () => {
      try {
        const scaled = scalePreset(preset, debouncedIntensity / 100);
        const canvas = await renderPresetToCanvas(originalFile, scaled, {
          maxSize: PREVIEW_SIZE,
        });
        if (previewTokenRef.current !== token) return;
        setPreviewUrl(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        console.error("Не вдалося побудувати прев'ю", err);
        if (previewTokenRef.current === token) {
          setErrorMessage(t("errors.processFailed", { name: originalFile.name }));
        }
      } finally {
        // раніше без try/finally кнопка "Завантажити" лишалась заблокованою
        // назавжди, якщо рендер кидав виняток
        if (previewTokenRef.current === token) setIsPreviewLoading(false);
      }
    })();
  }, [originalFile, selectedId, debouncedIntensity, t]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setIntensity(DEFAULT_INTENSITY);
  };

  const handleDownload = async () => {
    if (!originalFile || !selectedId) return;
    const preset = PRESETS.find((p) => p.id === selectedId);
    if (!preset) return;

    setIsExporting(true);
    try {
      const scaled = scalePreset(preset, intensity / 100);
      const canvas = await renderPresetToCanvas(originalFile, scaled, {
        maxSize: FULL_SIZE,
      });
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = originalFile.name.replace(/\.[^.]+$/, "");
      a.download = `${base}-${selectedId}-${intensity}.jpg`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // не відкликаємо URL одразу: частина браузерів ще не почала завантаження
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("Експорт не вдався", err);
      setErrorMessage(t("errors.processFailed", { name: originalFile.name }));
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setErrorMessage("");
    setOriginalFile(null);
    setSelectedId(null);
    setPreviewUrl(null);
    setThumbs({});
    setIntensity(DEFAULT_INTENSITY);
  };

  const handleFilterSelect = (id) => {
    setActiveFilter((prev) => (prev === id ? null : id));
  };

  const visiblePresets = activeFilter
    ? PRESETS.filter((p) => p.categories?.includes(activeFilter))
    : PRESETS;

  return (
    <>
    <main className="presets-page">
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <div className="presets-page__wrapper container">
        <h1 className="main__title">
          {t("presets.title")}
          <span className="title__gradient">
            {" "}
            {t("presets.titleGradient", "твоїх фото")}
          </span>
        </h1>
        <p className="main__text">{t("presets.text1")}</p>

        {!originalFile && (
          <div
            {...getRootProps()}
            className={`presets-dropzone ${
              isDragActive ? "presets-dropzone--active" : ""
            }`}
          >
            <input {...getInputProps()} />
            <FiUpload size={32} className="presets-dropzone__icon" />
            <div className="input__info-text">
              <span className="presets-dropzone__btn">
                {t("presets.dropzone")}
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="error-text" role="alert">
            {errorMessage}
          </p>
        )}

        {originalFile && (
          <>
            <div className="presets-toolbar">
              <span className="presets-toolbar__filename">
                {originalFile.name}
              </span>
              <div className="presets-toolbar__actions">
                {!selectedId && (
                  <button
                    type="button"
                    className={`presets-filter-btn ${
                      activeFilter ? "presets-filter-btn--active" : ""
                    }`}
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                  >
                    <FiFilter size={16} />
                    {t("presets.filters")}
                    {activeFilter && (
                      <span className="presets-filter-btn__dot" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="presets-toolbar__reset"
                  onClick={handleReset}
                >
                  {t("presets.anotherPhoto")}
                </button>
              </div>
            </div>

            {!selectedId && isFilterOpen && (
              <div className="presets-filters">
                <button
                  type="button"
                  className={`presets-filters__chip ${
                    !activeFilter ? "presets-filters__chip--active" : ""
                  }`}
                  onClick={() => setActiveFilter(null)}
                >
                  {t("presets.all")}
                </button>
                {filters.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`presets-filters__chip ${
                      activeFilter === f.id
                        ? "presets-filters__chip--active"
                        : ""
                    }`}
                    onClick={() => handleFilterSelect(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
                {activeFilter && (
                  <button
                    type="button"
                    className="presets-filters__clear"
                    onClick={() => setActiveFilter(null)}
                    aria-label={t("presets.clearFilter", "Скинути фільтр")}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            )}

            {selectedId ? (
              <div className="presets-detail">
                <div className="presets-detail__media">
                  <Beforeafterslider
                    beforeSrc={originalUrl}
                    afterSrc={previewUrl || thumbs[selectedId] || originalUrl}
                  />
                </div>

                <div className="presets-detail__side">
                  <div className="presets-intensity">
                    <div className="presets-intensity__label">
                      <span>{t("presets.efect")}</span>
                      <span className="presets-intensity__value">
                        {intensity}%
                      </span>
                    </div>
                    <input
                      id="intensity-range"
                      type="range"
                      min={0}
                      max={200}
                      step={1}
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="presets-intensity__input"
                      style={{ "--progress": `${(intensity / 200) * 100}%` }}
                    />
                    <div className="presets-intensity__marks">
                      <span>{t("presets.original")}</span>
                      <span>100%</span>
                      <span>{t("presets.more")}</span>
                    </div>
                  </div>

                  <div className="presets-detail__actions">
                    <button
                      type="button"
                      className="presets-detail__download"
                      onClick={handleDownload}
                      disabled={isExporting || isPreviewLoading}
                    >
                      <FiDownload size={18} />
                      {isExporting
                        ? t("presets.preparingPhoto")
                        : t("presets.download")}
                    </button>
                    <button
                      type="button"
                      className="presets-detail__back"
                      onClick={() => setSelectedId(null)}
                    >
                      {t("presets.return")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="presets-grid">
                {visiblePresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className="presets-grid__item"
                    onClick={() => handleSelect(preset.id)}
                  >
                    <div className="presets-grid__thumb">
                      {thumbs[preset.id] ? (
                        <img src={thumbs[preset.id]} alt={preset.name} />
                      ) : (
                        <div className="presets-grid__thumb-loading">
                          {t("presets.processing")}
                        </div>
                      )}
                    </div>
                    <span className="presets-grid__name">{preset.name}</span>
                    {preset.description && (
                      <span className="presets-grid__desc">
                        {preset.description}
                      </span>
                    )}
                  </button>
                ))}
                {visiblePresets.length === 0 && (
                  <p className="presets-grid__empty">{t("presets.noMatch")}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
    <SeoContent pageKey="presets" />
    </>
  );
};

export default Presets;
