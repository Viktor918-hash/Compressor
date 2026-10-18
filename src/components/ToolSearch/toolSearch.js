// Чиста логіка пошуку інструментів у хедері (Ctrl/Cmd+K) — round 33.
// Без React/i18n, щоб тестувати під `node --test` (tests/toolSearch.test.mjs).

/**
 * Додаткові слова для пошуку: формати й синоніми ВСІМА 4 мовами сайту
 * (uk/en/ru/es). Так "heic", "сжать" чи "pdf" знаходять потрібний
 * інструмент незалежно від мови сторінки — назви й описи інструментів
 * ми маємо лише мовою поточної сторінки.
 */
export const TOOL_KEYWORDS = {
  home: "compress reduce shrink optimize jpg jpeg png webp стиснути зменшити оптимізувати сжать уменьшить comprimir reducir optimizar",
  compressToSize: "kb mb kilobytes megabytes size limit 50 100 200 500 1mb кб мб розмір ліміт размер лимит tamaño límite",
  convert: "jpg jpeg heic heif png webp bmp convert конвертувати перетворити конвертировать convertir",
  convertToPng: "png transparent convert прозорий конвертувати прозрачный конвертировать transparente convertir",
  webp: "webp convert конвертувати конвертировать convertir",
  removeExif: "exif metadata gps location privacy метадані геолокація приватність метаданные геолокация metadatos ubicación privacidad",
  photoToPdf: "pdf merge combine images scan об'єднати документ объединить документ unir combinar",
  resize: "resize dimensions pixels px width height scale розмір пікселі ширина висота размер пиксели redimensionar píxeles",
  presets: "filters presets effects instagram фільтри ефекти фильтры эффекты filtros efectos",
  removeBg: "background remove transparent cutout ai фон прозорий вирізати фон прозрачный fondo quitar transparente",
  wordToPdf: "word doc docx pdf документ convert конвертувати конвертировать convertir",
  pdfToWord: "pdf word docx editable документ редагувати редактировать editable",
  imageToText: "ocr text recognize scan extract текст розпізнати сканувати распознать сканировать texto reconocer",
  cropImage: "crop cut trim aspect ratio обрізати кадрувати обрезать recortar",
  rotateImage: "rotate flip mirror turn повернути віддзеркалити повернуть отразить girar voltear",
  addWatermark: "watermark logo copyright stamp водяний знак логотип водяной знак marca de agua logo",
  blackAndWhite: "black white grayscale monochrome bw чорно-біле чорнобіле монохром черно-белое blanco negro",
  circleCrop: "circle round avatar profile picture коло круг аватар фото профілю аватарка circular avatar",
  compressVideo: "video mp4 mov compress reduce size whatsapp telegram email відео стиснути видео сжать comprimir vídeo",
  convertMovToMp4: "mov mp4 iphone quicktime video відео видео convertir vídeo",
  convertMkvToMp4: "mkv mp4 matroska video відео видео convertir vídeo",
  convertWebmToMp4: "webm mp4 video відео видео convertir vídeo",
};

/**
 * Нижній регістр, без діакритики (es: "vídeo" = "video"), ё → е.
 * Кирилиця з діакритикою (й, ї) розкладається однаково і в запиті,
 * і в тексті, тож порівняння лишається коректним.
 */
export function normalizeSearch(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ё/g, "е")
    .replace(/[’`]/g, "'")
    .trim();
}

/**
 * items: [{ slug, name, desc, keywords? }] у порядку каталогу.
 * Кожне слово запиту має знайтися хоча б десь (назва, опис, ключові
 * слова); вище — ті, де слово в назві (особливо на початку слова назви).
 * Порожній запит → усі інструменти в порядку каталогу.
 */
export function rankTools(query, items) {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return items.slice();

  const scored = [];
  items.forEach((item, index) => {
    const name = normalizeSearch(item.name);
    const desc = normalizeSearch(item.desc);
    const keywords = normalizeSearch(item.keywords);
    const nameWords = name.split(/[\s/,()·-]+/);
    let score = 0;
    for (const token of tokens) {
      if (nameWords.some((w) => w.startsWith(token))) score += 4;
      else if (name.includes(token)) score += 3;
      else if (keywords.split(/\s+/).some((w) => w.startsWith(token))) score += 2;
      else if (desc.includes(token) || keywords.includes(token)) score += 1;
      else return; // слово ніде не знайдено — інструмент не підходить
    }
    scored.push({ item, score, index });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((s) => s.item);
}
