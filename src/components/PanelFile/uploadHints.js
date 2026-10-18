// Чисті (без React і без i18n) хелпери зони завантаження Panel.jsx —
// round 33. Винесені окремо, щоб їх можна було тестувати під `node --test`
// (tests/uploadHints.test.mjs) без браузера й без Vite.

// MIME-тип → коротка назва формату для рядка-підказки "JPG, PNG, WebP · …"
const MIME_LABELS = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/bmp": "BMP",
  "image/gif": "GIF",
  "image/avif": "AVIF",
  "image/heic": "HEIC",
  "image/heif": "HEIC",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "video/webm": "WebM",
  "video/x-msvideo": "AVI",
  "video/avi": "AVI",
  "video/x-matroska": "MKV",
};

// Розширення → та сама назва (для записів accept на кшталт "": [".heic"])
const EXT_LABELS = {
  ".jpg": "JPG",
  ".jpeg": "JPG",
  ".png": "PNG",
  ".webp": "WebP",
  ".bmp": "BMP",
  ".gif": "GIF",
  ".avif": "AVIF",
  ".heic": "HEIC",
  ".heif": "HEIC",
  ".pdf": "PDF",
  ".doc": "DOC",
  ".docx": "DOCX",
  ".mp4": "MP4",
  ".mov": "MOV",
  ".webm": "WebM",
  ".avi": "AVI",
  ".mkv": "MKV",
};

// Розширення за MIME-типом — для імені файлу, вставленого з буфера
const MIME_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/avif": "avif",
};

const extOf = (name = "") => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

/**
 * Унікальні назви форматів з accept-мапи react-dropzone у порядку появи.
 * { "image/jpeg": [], "": [".heic"] } → ["JPG", "HEIC"]
 */
export function acceptLabels(accepted) {
  const out = [];
  const add = (label) => {
    if (label && !out.includes(label)) out.push(label);
  };
  Object.entries(accepted || {}).forEach(([mime, exts]) => {
    add(MIME_LABELS[mime]);
    (exts || []).forEach((ext) => add(EXT_LABELS[String(ext).toLowerCase()]));
  });
  return out;
}

/**
 * Що приймає сторінка: "image" | "video" | "document" | "mixed".
 * Від цього залежать підпис мобільної кнопки й те, чи показувати
 * підказку про вставку скріншота.
 */
export function acceptKind(accepted) {
  const kinds = new Set(
    Object.keys(accepted || {})
      .filter(Boolean)
      .map((mime) =>
        mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "document"
      )
  );
  return kinds.size === 1 ? [...kinds][0] : "mixed";
}

/**
 * Та сама логіка, що й у react-dropzone accept: файл приймається, якщо
 * збігається MIME-тип АБО розширення з будь-якого запису. Потрібна для
 * файлів, що приходять не через dropzone (вставка з буфера, камера,
 * демо-фото). Без accept-мапи — приймаємо все.
 */
export function fileMatchesAccept(file, accepted) {
  if (!accepted || Object.keys(accepted).length === 0) return true;
  const type = (file?.type || "").toLowerCase();
  const ext = extOf(file?.name);
  return Object.entries(accepted).some(([mime, exts]) => {
    if (mime && type && mime.toLowerCase() === type) return true;
    if (mime.endsWith("/*") && type.startsWith(mime.slice(0, -1))) return true;
    return Boolean(ext) && (exts || []).some((e) => String(e).toLowerCase() === ext);
  });
}

/** Ліміт у цілих МБ для підказки: 30 * 1024 * 1024 → 30 */
export function limitMb(bytes) {
  return Math.round(bytes / 1024 / 1024);
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * Скріншот із буфера обміну в більшості браузерів приходить як
 * "image.png" — кілька вставок поспіль дали б однакові імена. Даємо
 * впізнаване ім'я з часом: "screenshot-2026-10-18-14-05-09.png".
 * Файли зі "справжнім" іменем (скопійовані у Провіднику/Finder) не чіпаємо.
 */
export function pastedFileName(file, now = new Date()) {
  const name = file?.name || "";
  const generic = !name || /^(image|blob)(\.\w+)?$/i.test(name);
  if (!generic) return name;
  const ext = MIME_EXT[(file?.type || "").toLowerCase()] || extOf(name).slice(1) || "png";
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(
    now.getHours()
  )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `screenshot-${stamp}.${ext}`;
}

/** 83 → "1:23" (лічильник часу обробки) */
export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec || 0));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/**
 * Оцінка часу, що лишився, за середньою швидкістю з початку вивантаження.
 * null, поки даних замало (перші 2 с або 0 байт) — інакше перша оцінка
 * стрибала б від "ще 3 год" до "ще 20 с".
 */
export function estimateEtaSec(loaded, total, elapsedSec) {
  if (!(elapsedSec >= 2) || !(loaded > 0) || !(total > loaded)) return null;
  const speed = loaded / elapsedSec;
  return (total - loaded) / speed;
}
