// "Ваші інструменти" на головній (round 34): нещодавно відкриті інструменти
// й підсумок їхніх збережених налаштувань — лише localStorage, без акаунта.
// Чисті функції (без React/i18next) — тестуються під node --test.
import { parseStored } from "./persist.js";

export const RECENT_KEY = "cp_recent_tools";
export const RECENT_MAX = 6;
const SETTINGS_PREFIX = "cp_settings_";
const OCR_KEY = "cp_ocr_langs";

/** Додає slug на початок списку без дублів, обрізає до max */
export function pushRecent(list, slug, max = RECENT_MAX) {
  const clean = Array.isArray(list) ? list.filter((s) => typeof s === "string" && s !== slug) : [];
  return [slug, ...clean].slice(0, max);
}

/** Що показати на головній: до limit інструментів, крім виключених (напр. "home") */
export function pickRecent(list, { exclude = [], limit = 3, known } = {}) {
  return (Array.isArray(list) ? list : [])
    .filter((s) => !exclude.includes(s) && (!known || known.includes(s)))
    .slice(0, limit);
}

/**
 * Рядок-підсумок збережених налаштувань інструмента або null.
 * get(key) — читання сирого рядка зі сховища; t(key, opts) — переклад.
 */
export function settingsSummary(slug, get, t) {
  const read = (key, fallback, validate) => parseStored(get(SETTINGS_PREFIX + key), fallback, validate);
  switch (slug) {
    case "home": {
      const raw = get(SETTINGS_PREFIX + "compress");
      if (!raw) return null;
      const o = read("compress", { quality: 80, keepSize: true, maxSide: 1920 });
      return [
        t("recentTools.quality", { value: o.quality }),
        o.keepSize ? t("recentTools.originalSize") : t("recentTools.maxSide", { px: o.maxSide }),
      ].join(" · ");
    }
    case "compressToSize": {
      const rawTarget = get(SETTINGS_PREFIX + "compressToSize.target");
      const rawFormat = get(SETTINGS_PREFIX + "compressToSize.format");
      if (!rawTarget && !rawFormat) return null;
      const target = read("compressToSize.target", { value: "200", unit: "KB" });
      const format = read("compressToSize.format", "jpeg");
      const unit = t(target.unit === "MB" ? "compressToSize.units.mb" : "compressToSize.units.kb");
      return [
        t("recentTools.target", { value: target.value, unit }),
        format === "webp" ? "WebP" : "JPEG",
      ].join(" · ");
    }
    case "photoToPdf": {
      const rawPage = get(SETTINGS_PREFIX + "photoToPdf.pageSize");
      const rawMargin = get(SETTINGS_PREFIX + "photoToPdf.margin");
      if (!rawPage && !rawMargin) return null;
      const page = read("photoToPdf.pageSize", "a4");
      const margin = read("photoToPdf.margin", 0);
      return [
        t(page === "photo" ? "recentTools.pagePhoto" : "recentTools.pageA4"),
        margin > 0 ? t("recentTools.margin", { mm: margin }) : t("recentTools.noMargin"),
      ].join(" · ");
    }
    case "removeExif": {
      const raw = get(SETTINGS_PREFIX + "removeExif.reencode");
      if (!raw) return null;
      return read("removeExif.reencode", false) ? t("recentTools.reencode") : t("recentTools.noReencode");
    }
    case "imageToText": {
      const langs = parseStored(get(OCR_KEY), null, (v) => Array.isArray(v) && v.length > 0);
      if (!langs) return null;
      return t("recentTools.ocrLangs", { langs: langs.map((l) => String(l).toUpperCase()).join(", ") });
    }
    default:
      return null;
  }
}

/** Ключі, які чистить кнопка "Очистити" */
export const isOwnStorageKey = (key) =>
  key === RECENT_KEY || key === OCR_KEY || key.startsWith(SETTINGS_PREFIX);

// ── Обгортки над localStorage (усе в try/catch: приватний режим тощо) ──
export function loadRecent() {
  try {
    return parseStored(localStorage.getItem(RECENT_KEY), [], Array.isArray);
  } catch {
    return [];
  }
}

export function recordRecent(slug) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(pushRecent(loadRecent(), slug)));
  } catch {
    // без сховища — просто не запам'ятовуємо
  }
}

export function clearRecentAndSettings() {
  try {
    Object.keys(localStorage)
      .filter(isOwnStorageKey)
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // нічого
  }
}
