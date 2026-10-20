import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import "./Presets.css";
import { FiDownload, FiUpload, FiFilter, FiX, FiChevronRight } from "react-icons/fi";
import { PRESETS } from "./presetsData";
import {
  renderPresetToCanvas,
  canvasToBlob,
  scalePreset,
} from "./Presetengine";
import Beforeafterslider from "./Beforeafterslider";
import PresetCollections from "./PresetCollections";
import { getPresetsSessionFile, setPresetsSessionFile } from "./presetsSession";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import TryAlsoInline from "../SeoContent/TryAlsoInline";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";
import {
  CATEGORY_STYLES,
  filterByStyle,
  presetPageBySlug,
  presetsForPage,
} from "../../presets/presetPages";
import { HOME_PATHS } from "../../utils/routeLangs";

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
  { id: "film", label: t("presets.filterFilm", "Плівка й ретро") },
];

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Сторінка пресетів. Без pageSlug — головна /photo-presets (усі пресети,
 * фільтри-категорії). З pageSlug — тематична сторінка з
 * src/presets/presetPages.js: категорія (уже відфільтровані пресети +
 * підфільтри-стилі) або задача (підібрані пресети з поясненням).
 * Логіка обробки (мініатюри, прев'ю, повзунок, експорт) — однакова.
 */
const Presets = ({ pageSlug = null }) => {
  const { t } = useTranslation();
  const page = pageSlug ? presetPageBySlug(pageSlug) : null;
  const pageKey = page ? page.slug : "presets";

  const [originalFile, setOriginalFile] = useState(() => getPresetsSessionFile());
  const [originalUrl, setOriginalUrl] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // "Спробуйте також" (round 37) має з'явитись лише ПІСЛЯ реального
  // завантаження результату — той самий сигнал `downloaded`, що в
  // Resize/CropImage/RotateImage/Watermark/BlackAndWhite/CircleCrop/RemoveBg,
  // скидається щойно користувач обирає інший пресет (новий результат).
  const [downloaded, setDownloaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeStyle, setActiveStyle] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const renderTokenRef = useRef(0);
  const previewTokenRef = useRef(0);

  const debouncedIntensity = useDebouncedValue(intensity, 150);
  const filters = useMemo(() => getFilters(t), [t]);
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === pageKey);
  const presetsRoute = ROUTES.find((r) => r.slug === "presets");
  const meta = PAGE_META[pageKey][lang];

  // Пресети цієї сторінки (на головній — усі)
  const pagePresets = useMemo(() => presetsForPage(page, PRESETS), [page]);

  // Категорія, для якої показуємо підфільтри-стилі: на сторінці категорії —
  // її власна, на головній — обрана в чипах (якщо обрана).
  const styleCategory = page?.kind === "category" ? page.category : activeFilter;
  const styleOptions = (styleCategory && CATEGORY_STYLES[styleCategory]) || [];

  const visiblePresets = useMemo(() => {
    const byCategory =
      !page && activeFilter
        ? pagePresets.filter((p) => p.categories?.includes(activeFilter))
        : pagePresets;
    return filterByStyle(byCategory, styleOptions.length ? activeStyle : null);
  }, [page, pagePresets, activeFilter, activeStyle, styleOptions.length]);

  // Підпис під назвою пресета: на сторінці задачі — "чому саме цей",
  // інакше — стилі пресета, доречні на цій сторінці.
  const presetNote = (preset) => {
    if (page?.kind === "task") {
      return t(`presetPages.${page.slug}.why.${preset.id}`, { defaultValue: "" });
    }
    const relevant = page?.kind === "category" ? page.styles : null;
    return (preset.styles || [])
      .filter((s) => !relevant || relevant.includes(s))
      .map((s) => t(`presets.styles.${s}`))
      .join(" · ");
  };

  const pageUrl = `${SITE_URL}${route[lang]}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: meta.title,
      description: meta.description,
      url: pageUrl,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (Web Browser)",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ];
  if (page) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "CompressPhoto",
          item: `${SITE_URL}${HOME_PATHS[lang] || "/"}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("presets.navTitle"),
          item: `${SITE_URL}${presetsRoute[lang]}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: t(`presetPages.nav.${page.slug}`),
          item: pageUrl,
        },
      ],
    });
  }

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setErrorMessage("");
    setOriginalFile(file);
    setPresetsSessionFile(file);
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

  // Мініатюри для сітки — завжди при intensity = 100%.
  // Фото декодується й зменшується ОДИН раз, далі кожен пресет малюється з
  // цієї копії (раніше — повне декодування оригіналу на кожен пресет, що з
  // 60+ пресетами помітно гальмувало). Спершу — пресети цієї сторінки.
  useEffect(() => {
    if (!originalFile) return;
    const token = ++renderTokenRef.current;
    const queue = page ? pagePresets : PRESETS;

    (async () => {
      let base;
      try {
        base = await renderPresetToCanvas(originalFile, null, { maxSize: THUMB_SIZE });
      } catch (err) {
        console.error("Не вдалося відкрити фото для пресетів", err);
        // Файл зіпсований/не зображення. Раніше сітка вічно показувала
        // "Обробка…" без пояснень.
        if (renderTokenRef.current === token) {
          setErrorMessage(t("errors.imageDecodeFailed", { name: originalFile.name }));
          setOriginalFile(null);
          setPresetsSessionFile(null);
        }
        return;
      }

      for (const preset of queue) {
        if (renderTokenRef.current !== token) return;
        try {
          const canvas = await renderPresetToCanvas(base, preset);
          const url = canvas.toDataURL("image/jpeg", 0.85);
          if (renderTokenRef.current === token) {
            setThumbs((prev) => ({ ...prev, [preset.id]: url }));
          }
        } catch (err) {
          console.error("Не вдалося застосувати пресет", preset.id, err);
        }
        // віддаємо кадр браузеру між пресетами — сторінка лишається чуйною
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    })();
  }, [originalFile, page, pagePresets, t]);

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
    setDownloaded(false);
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
      setDownloaded(true);
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
    setPresetsSessionFile(null);
    setSelectedId(null);
    setPreviewUrl(null);
    setThumbs({});
    setIntensity(DEFAULT_INTENSITY);
    setDownloaded(false);
  };

  const handleFilterSelect = (id) => {
    setActiveFilter((prev) => (prev === id ? null : id));
    setActiveStyle(null);
  };

  const clearFilters = () => {
    setActiveFilter(null);
    setActiveStyle(null);
  };

  // Другий ряд чипів — стилі (soft, dramatic, golden hour…). На тематичних
  // сторінках показується завжди (і до завантаження фото), на головній —
  // коли обрано категорію.
  const styleChips = styleOptions.length > 0 && (
    <div
      className="presets-filters presets-filters--styles"
      role="group"
      aria-label={t("presets.styleFilter")}
    >
      <button
        type="button"
        className={`presets-filters__chip ${
          !activeStyle ? "presets-filters__chip--active" : ""
        }`}
        aria-pressed={!activeStyle}
        onClick={() => setActiveStyle(null)}
      >
        {t("presets.allStyles")}
      </button>
      {styleOptions.map((style) => (
        <button
          type="button"
          key={style}
          className={`presets-filters__chip ${
            activeStyle === style ? "presets-filters__chip--active" : ""
          }`}
          aria-pressed={activeStyle === style}
          onClick={() => setActiveStyle((prev) => (prev === style ? null : style))}
        >
          {t(`presets.styles.${style}`)}
        </button>
      ))}
    </div>
  );

  return (
    <>
    <main className="presets-page">
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <div className="presets-page__wrapper container">
        {page && (
          <nav className="presets-breadcrumbs" aria-label={t("presetPages.ui.breadcrumbs")}>
            <ol>
              <li>
                <LocalizedLink to="/">{t("presetPages.ui.home")}</LocalizedLink>
                <FiChevronRight size={14} aria-hidden="true" />
              </li>
              <li>
                <LocalizedLink to="/photo-presets">{t("presets.navTitle")}</LocalizedLink>
                <FiChevronRight size={14} aria-hidden="true" />
              </li>
              <li aria-current="page">{t(`presetPages.nav.${page.slug}`)}</li>
            </ol>
          </nav>
        )}

        {page ? (
          <>
            <h1 className="main__title">
              {t(`presetPages.${page.slug}.h1`)}
              <span className="title__gradient">
                {" "}
                {t(`presetPages.${page.slug}.h1Accent`)}
              </span>
            </h1>
            <p className="main__text presets-page__intro">
              {t(`presetPages.${page.slug}.intro`)}
            </p>
          </>
        ) : (
          <>
            <h1 className="main__title">
              {t("presets.title")}
              <span className="title__gradient">
                {" "}
                {t("presets.titleGradient", "твоїх фото")}
              </span>
            </h1>
            <p className="main__text">{t("presets.text1")}</p>
          </>
        )}

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
            <p className="presets-dropzone__trust">{t("panel.emptyTrust")}</p>
          </div>
        )}

        {errorMessage && (
          <p className="error-text" role="alert">
            {errorMessage}
          </p>
        )}

        {/* Тематична сторінка до завантаження фото: пресети добірки з
            описом — щоб було видно, що саме тут є (і для пошуковиків) */}
        {page && !originalFile && (
          <section className="presets-collection" aria-labelledby="presets-collection-title">
            <div className="presets-collection__head">
              <h2 className="presets-collection__title" id="presets-collection-title">
                {page.kind === "task"
                  ? t("presetPages.ui.whyTitle")
                  : t("presetPages.ui.inCollection")}
              </h2>
              <span className="presets-collection__count">
                {t("presetPages.ui.count", { count: pagePresets.length })}
              </span>
            </div>
            {styleChips}
            <ul className="presets-collection__list">
              {visiblePresets.map((preset) => {
                const note = presetNote(preset);
                return (
                  <li className="presets-collection__item" key={preset.id}>
                    <span className="presets-collection__name">{preset.name}</span>
                    {note && <span className="presets-collection__note">{note}</span>}
                  </li>
                );
              })}
            </ul>
            <p className="presets-collection__hint">{t("presetPages.ui.uploadHint")}</p>
            {page.tool && (
              <p className="presets-collection__tool">
                {t(`presetPages.${page.slug}.toolNote`)}{" "}
                <LocalizedLink hideIfMissing to={page.tool}>
                  {t(`presetPages.${page.slug}.toolLink`)}
                </LocalizedLink>
              </p>
            )}
          </section>
        )}

        {originalFile && (
          <>
            <div className="presets-toolbar">
              <span className="presets-toolbar__filename">
                {originalFile.name}
              </span>
              <div className="presets-toolbar__actions">
                {!selectedId && !page && (
                  <button
                    type="button"
                    className={`presets-filter-btn ${
                      activeFilter ? "presets-filter-btn--active" : ""
                    }`}
                    aria-expanded={isFilterOpen}
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

            {!selectedId && !page && isFilterOpen && (
              <div className="presets-filters">
                <button
                  type="button"
                  className={`presets-filters__chip ${
                    !activeFilter ? "presets-filters__chip--active" : ""
                  }`}
                  onClick={clearFilters}
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
                    onClick={clearFilters}
                    aria-label={t("presets.clearFilter", "Скинути фільтр")}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            )}

            {!selectedId && (page || isFilterOpen) && styleChips}

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
                      onChange={(e) => {
                        setIntensity(Number(e.target.value));
                        setDownloaded(false);
                      }}
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

                  {downloaded && <TryAlsoInline current="presets" />}
                </div>
              </div>
            ) : (
              <>
                <div className="presets-grid">
                  {visiblePresets.map((preset) => {
                    const note = page ? presetNote(preset) : preset.description;
                    return (
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
                        {note && <span className="presets-grid__desc">{note}</span>}
                      </button>
                    );
                  })}
                  {visiblePresets.length === 0 && (
                    <p className="presets-grid__empty">{t("presets.noMatch")}</p>
                  )}
                </div>
                {page && (
                  <p className="presets-grid__all">
                    <LocalizedLink to="/photo-presets">
                      {t("presetPages.ui.allPresets", { count: PRESETS.length })}
                    </LocalizedLink>
                  </p>
                )}
              </>
            )}
          </>
        )}

        <PresetCollections currentSlug={page?.slug || null} />
      </div>
    </main>
    <SeoContent pageKey={pageKey} relatedKey="presets" />
    </>
  );
};

export default Presets;
