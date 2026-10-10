// Визначення типу документа за магічними байтами файлу (не за
// розширенням) — та ж логіка, що в api/_lib/convertHandler.js
// (isPdf/isZip/isOle2), але на клієнті.
//
// Потрібно це з P0-6 (раунд 20): з прямим upload у CloudConvert наша
// серверна функція більше не бачить байти файлу (вони йдуть напряму з
// браузера в CloudConvert), тож це єдина перевірка типу, яку можна
// зробити ДО списання денної квоти конвертацій. Фінальний запобіжник —
// сам CloudConvert, який відмовиться конвертувати файл у невірному
// форматі (це видно в статусі job-а як "error").
const bytesToLatin1 = (bytes) => new TextDecoder("latin1").decode(bytes);

/**
 * @param {File} file
 * @returns {Promise<"pdf"|"docx"|"doc"|null>}
 */
export async function detectDocumentExt(file) {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  if (bytesToLatin1(head).includes("%PDF-")) return "pdf";

  const isZip =
    head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04; // PK..
  if (isZip) {
    // .docx — це zip, що містить папку "word/"; ім'я файлу в zip лежить
    // у відкритому вигляді в перших кілобайтах центрального каталогу.
    const more = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    return bytesToLatin1(more).includes("word/") ? "docx" : null;
  }

  const isOle2 =
    head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // старий .doc
  if (isOle2) return "doc";

  return null;
}

// Відео: на відміну від Word/PDF, браузери зазвичай ВІРНО повідомляють
// MIME-тип відеофайлу через File.type (на відміну від .docx/.doc, де
// MIME часто "application/octet-stream") — тож тут немає сенсу парсити
// магічні байти контейнера (mp4/mov — обидва "ftyp"-бокс ISO BMFF, mkv/webm
// — обидва EBML, розрізнити формат усередині й так не дає однозначної
// переваги перед тим, що вже каже сам браузер). detectVideoExt визначає
// розширення з File.type, а якщо тип порожній/нетиповий (буває на деяких
// мобільних браузерах для .mov) — відкочується на розширення імені файлу.
// Остаточний запобіжник у будь-якому разі — сам CloudConvert (status: "error"
// на файл, який не є відео).
const VIDEO_MIME_EXT = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
  "video/avi": "avi",
  "video/x-matroska": "mkv",
};

const VIDEO_NAME_EXT = ["mp4", "mov", "avi", "webm", "mkv"];

/**
 * @param {File} file
 * @returns {"mp4"|"mov"|"avi"|"webm"|"mkv"|null}
 */
export function detectVideoExt(file) {
  const byMime = VIDEO_MIME_EXT[(file.type || "").toLowerCase()];
  if (byMime) return byMime;

  const dot = file.name.lastIndexOf(".");
  const ext = dot !== -1 ? file.name.slice(dot + 1).toLowerCase() : "";
  return VIDEO_NAME_EXT.includes(ext) ? ext : null;
}
