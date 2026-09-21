// Чисті функції постобробки розпізнаного тексту (без залежностей від
// браузера/React — тому їх можна тестувати в Node: tests/ocr.test.mjs).

// Прибирає зайві пробіли й порожні рядки, не ламаючи структуру абзаців.
export const cleanOcrText = (raw) =>
  raw
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Літери, що виглядають ІДЕНТИЧНО в латиниці й кирилиці (класична
// проблема "гомогліфів"). Коли мовна модель Tesseract працює одночасно
// з двома алфавітами (ukr+eng), вона іноді "вибирає" не той алфавіт для
// окремого гліфа — типовий наслідок: український текст на кшталт "т.ін"
// розпізнається як "T.iH" (усі літери латинські, хоча слово українське).
const LOOKALIKE_TO_CYRILLIC = {
  A: "А",
  B: "В",
  E: "Е",
  K: "К",
  M: "М",
  H: "Н",
  O: "О",
  P: "Р",
  C: "С",
  T: "Т",
  X: "Х",
  Y: "У",
  a: "а",
  e: "е",
  o: "о",
  p: "р",
  c: "с",
  x: "х",
  y: "у",
};

// Латинська "I"/"i" схожа лише на українську "І"/"і" (з крапкою) — для
// російської сторінки такої відповідності немає, тому додаємо цю пару
// вибірково, лише коли мова сторінки — українська. tesseractLang тут —
// код мовної моделі Tesseract ("ukr"/"rus"/...), а не код сторінки i18n.
const buildLookalikeMap = (tesseractLang) => {
  if (tesseractLang !== "ukr") return LOOKALIKE_TO_CYRILLIC;
  return { ...LOOKALIKE_TO_CYRILLIC, I: "І", i: "і" };
};

const LETTER_RE = /[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]/;
const isCyrillicChar = (ch) => /[\u0400-\u04FF]/.test(ch);
// Послідовність із 2+ ВЕЛИКИХ латинських літер поспіль — швидше за все
// справжня англійська абревіатура (PDF, USB, URL) чи бренд, а не
// зіпсована кирилиця, тому такі токени свідомо не чіпаємо.
const LOOKS_LIKE_ACRONYM = /^[A-Z]{2,}$/;

// Виправляє гомогліфи в межах рядка: визначає, чи рядок переважно
// кириличний (за співвідношенням кириличних/латинських літер), і якщо
// так — конвертує "підозрілі" латинські літери-двійники на кириличні
// лише в словах змішаного алфавіту (не чіпає суто латинські слова й
// схожі на англійську абревіатуру токени).
// Це не чіпає жодної вже коректно розпізнаної кирилиці й не може
// зіпсувати текст, який справді написаний латиницею (короткі рядки або
// переважно англійські лишаються без змін). tesseractLang — код
// мовної моделі Tesseract ("ukr"/"rus"/"eng"/"spa").
export const fixCyrillicLatinConfusion = (text, tesseractLang) => {
  if (tesseractLang !== "ukr" && tesseractLang !== "rus") return text;
  const map = buildLookalikeMap(tesseractLang);

  return text
    .split("\n")
    .map((line) => {
      const letters = line.match(new RegExp(LETTER_RE, "g")) || [];
      if (letters.length < 4) return line; // замало даних для визначення алфавіту рядка

      const cyrillicRatio =
        letters.filter(isCyrillicChar).length / letters.length;
      if (cyrillicRatio < 0.55) return line; // рядок переважно латиницею — не чіпаємо

      return line.replace(/[A-Za-zА-Яа-яЁёІіЇїЄєҐґ.]+/g, (token) => {
        if (LOOKS_LIKE_ACRONYM.test(token.replace(/\./g, ""))) return token;

        // Міняємо лише токени ЗМІШАНОГО алфавіту (кирилиця + латиниця в
        // одному слові) — це ознака зіпсованого розпізнавання. Суто латинські
        // слова (support@gmail.com, Chrome, Telegram, URL-адреси) залишаємо
        // як є, інакше вони непомітно перетворювались на кирилицю.
        const hasCyrillic = /[\u0400-\u04FF]/.test(token);
        const hasLatin = /[A-Za-z]/.test(token);
        if (!(hasCyrillic && hasLatin)) return token;

        let fixed = "";
        for (const ch of token) fixed += map[ch] || ch;
        return fixed;
      });
    })
    .join("\n");
};

