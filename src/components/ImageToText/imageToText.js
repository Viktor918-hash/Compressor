import { createWorker } from "tesseract.js";
import i18n from "../../i18n/i18n";

// Мова сторінки (uk/en/ru/es) → код мовної моделі Tesseract.
const LANG_MAP = {
  uk: "ukr",
  en: "eng",
  ru: "rus",
  es: "spa",
};

// Скріншоти й фото документів часто мають замалу для OCR роздільність —
// дрібні гліфи (маркер списку "•", тире "—", цифри виносок у [1]) на
// зменшеному/згладженому (антиаліасинг) шрифті Tesseract легко плутає з
// випадковими символами. Піднімаємо довшу сторону до ~3000px — це
// приблизний аналог "300+ DPI", який Tesseract очікує для стабільного
// розпізнавання дрібного тексту й крихітних надрядкових позначок ([1]).
const OCR_TARGET_LONG_SIDE = 3000;

// Той самий "300 DPI", про який ми говоримо Tesseract явно через параметр
// user_defined_dpi — це підказка, яку рушій використовує у власних
// внутрішніх евристиках сегментації сторінки (без неї Tesseract іноді
// невірно оцінює висоту рядка на апскейленому зображенні).
const OCR_ASSUMED_DPI = "300";

// Якщо середня впевненість розпізнавання нижча за це значення — пробуємо
// повторно на неопорогованому (тільки grayscale) зображенні, бо жорстка
// бінаризація іноді "з'їдає" тонкі/світлі гліфи (наприклад, сірий текст
// підказок або дрібний шрифт на градієнтному фоні).
const LOW_CONFIDENCE_RETRY_THRESHOLD = 70;

// Знаходить оптимальний поріг чорно-білої бінаризації методом Оцу —
// автоматично, з гістограми яскравості самого зображення, а не
// фіксованим числом. Це важливо, бо кольоровий текст посилань (синій,
// червоний) на білому фоні має інший контраст, ніж звичайний чорний
// текст, і єдиний "магічний" поріг підійшов би не для всіх фото.
const computeOtsuThreshold = (histogram, totalPixels) => {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let i = 0; i < 256; i++) {
    weightBackground += histogram[i];
    if (weightBackground === 0) continue;

    const weightForeground = totalPixels - weightBackground;
    if (weightForeground === 0) break;

    sumB += i * histogram[i];
    const meanBackground = sumB / weightBackground;
    const meanForeground = (sum - sumB) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
};

// Прибирає повністю ізольовані чорні пікселі ("сіль-перець" шум), що
// лишаються після жорсткої бінаризації через анти-аліасинг дрібного
// тексту й кольорових посилань. Без цього кроку такі поодинокі крапки
// Tesseract нерідко сприймає за окремі (неіснуючі) символи — саме звідси
// беруться випадкові літери, лапки чи закарлючки в результаті на місці
// маркерів списку "•" й тонких елементів шрифту. Видаляється тільки
// піксель, у якого ЖОДЕН із 8 сусідів не чорний — тобто справжній штрих
// літери (завжди товщий за 1px після апскейлу) це не зачіпає.
const despeckle = (data, width, height) => {
  const isBlack = (x, y) => data[(y * width + x) * 4] < 128;
  const toClear = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!isBlack(x, y)) continue;

      let hasBlackNeighbor = false;
      for (let dy = -1; dy <= 1 && !hasBlackNeighbor; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (isBlack(x + dx, y + dy)) {
            hasBlackNeighbor = true;
            break;
          }
        }
      }

      if (!hasBlackNeighbor) toClear.push((y * width + x) * 4);
    }
  }

  for (const idx of toClear) {
    data[idx] = data[idx + 1] = data[idx + 2] = 255;
  }
};

// Апскейл + (опційно) чорно-біла бінаризація перед розпізнаванням.
// binarize=false лишає зображення у відтінках сірого без жорсткого
// порогування — використовується як запасний прохід, коли бінаризація
// дає низьку впевненість розпізнавання. Оригінальний файл користувача
// при цьому ніколи не змінюється.
const preprocessForOcr = async (file, { binarize = true } = {}) => {
  const bitmap = await createImageBitmap(file);
  const longSide = Math.max(bitmap.width, bitmap.height);
  const scale =
    longSide < OCR_TARGET_LONG_SIDE ? OCR_TARGET_LONG_SIDE / longSide : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  // Якісне згладжування при апскейлі — без цього збільшене зображення
  // виглядає "зубчастим", що тільки шкодить розпізнаванню дрібних гліфів.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const totalPixels = canvas.width * canvas.height;

  const gray = new Uint8ClampedArray(totalPixels);
  const histogram = new Array(256).fill(0);

  for (let p = 0, i = 0; p < data.length; p += 4, i++) {
    const value = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
    gray[i] = value;
    histogram[Math.round(value)]++;
  }

  if (binarize) {
    const threshold = computeOtsuThreshold(histogram, totalPixels);
    for (let p = 0, i = 0; p < data.length; p += 4, i++) {
      const value = gray[i] > threshold ? 255 : 0;
      data[p] = data[p + 1] = data[p + 2] = value;
    }
    despeckle(data, canvas.width, canvas.height);
  } else {
    for (let p = 0, i = 0; p < data.length; p += 4, i++) {
      data[p] = data[p + 1] = data[p + 2] = gray[i];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/png")
  );
};

// Тримаємо один воркер на весь сеанс замість того, щоб створювати новий
// на кожне фото — ініціалізація воркера й завантаження мовної моделі
// займають помітний час, тож перевикористання суттєво пришвидшує
// розпізнавання кількох фото поспіль (саме це і потрібно для мульти-аплоаду
// в <Panel />, який викликає processFile послідовно для кожного файлу).
let workerPromise = null;
let workerLang = null;

const getWorker = async (lang) => {
  if (workerPromise && workerLang === lang) {
    return workerPromise;
  }

  // Мова відрізняється від тієї, з якою воркер уже створений (користувач
  // перемкнув мову сторінки між завантаженнями) — закриваємо старий
  // воркер, щоб не тримати в пам'яті одразу дві мовні моделі.
  if (workerPromise) {
    const oldWorker = await workerPromise;
    await oldWorker.terminate();
  }

  workerLang = lang;
  workerPromise = (async () => {
    const worker = await createWorker(lang);
    await worker.setParameters({
      // Зберігає реальні пробіли/відступи між словами — важливо для
      // скріншотів з колонками, таблицями, меню, де порядок слів по
      // горизонталі несе сенс.
      preserve_interword_spaces: "1",
      // Явно повідомляємо Tesseract очікувану роздільність апскейленого
      // зображення — рушій використовує це значення у власних евристиках
      // сегментації рядків/символів, і без підказки на штучно збільшеному
      // фото іноді невірно оцінює висоту рядка.
      user_defined_dpi: OCR_ASSUMED_DPI,
    });
    return worker;
  })();

  return workerPromise;
};

// Прибирає зайві пробіли й порожні рядки, не ламаючи структуру абзаців.
const cleanOcrText = (raw) =>
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
// в усіх словах рядка, окрім тих, що схожі на англійську абревіатуру.
// Це не чіпає жодної вже коректно розпізнаної кирилиці й не може
// зіпсувати текст, який справді написаний латиницею (короткі рядки або
// переважно англійські лишаються без змін). tesseractLang — код
// мовної моделі Tesseract ("ukr"/"rus"/"eng"/"spa").
const fixCyrillicLatinConfusion = (text, tesseractLang) => {
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

        let fixed = "";
        for (const ch of token) fixed += map[ch] || ch;
        return fixed;
      });
    })
    .join("\n");
};

// Основне розпізнавання: бінаризований прохід і, за потреби, запасний
// прохід без бінаризації, якщо впевненість першого проходу занизька.
const recognizeText = async (file) => {
  const primaryLang = LANG_MAP[i18n.language] || "eng";
  // Додаємо eng до будь-якої мови — скріншоти часто містять англійські
  // слова (елементи інтерфейсу, посилання, бренди), і без цього вони
  // спотворюються мовною моделлю, "заточеною" тільки під кирилицю.
  const lang = primaryLang === "eng" ? "eng" : `${primaryLang}+eng`;
  const worker = await getWorker(lang);

  const binarized = await preprocessForOcr(file, { binarize: true });
  let result = await worker.recognize(binarized);

  if (result.data.confidence < LOW_CONFIDENCE_RETRY_THRESHOLD) {
    const grayscale = await preprocessForOcr(file, { binarize: false });
    const fallback = await worker.recognize(grayscale);
    if (fallback.data.confidence > result.data.confidence) {
      result = fallback;
    }
  }

  const cleaned = cleanOcrText(result.data.text);
  return fixCyrillicLatinConfusion(cleaned, primaryLang);
};

// processFile для <Panel />. Повертає не готовий Blob, а "сирі" дані —
// розпізнаний текст. Це дозволяє Panel перегенеровувати вихідний файл
// під обраний користувачем формат (txt/doc) БЕЗ повторного OCR, коли
// людина перемикає формат перемикачем біля кнопки завантаження.
export const extractOcrData = async (file) => {
  const text = await recognizeText(file);
  return { text };
};

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Пакує розпізнаний текст у Word-сумісний HTML-контейнер. Це класичний
// формат .doc (не OOXML), який Word, LibreOffice та Google Docs
// відкривають як звичайний документ зі збереженими абзацами — без
// додаткових бібліотек і без збірки на сервері.
const buildDocBlob = (text) => {
  const paragraphs = text
    .split("\n")
    .map(
      (line) =>
        `<p style="margin:0 0 8pt 0;">${escapeHtml(line) || "&nbsp;"}</p>`
    )
    .join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Document</title></head>
<body>${paragraphs}</body>
</html>`;

  // BOM (\ufeff) — щоб Word коректно розпізнав UTF-8 і кирилицю.
  return new Blob(["\ufeff", html], { type: "application/msword" });
};

const buildTxtBlob = (text) =>
  new Blob([text], { type: "text/plain;charset=utf-8" });

// Формати виводу для перемикача в <Panel />. id збігається з розширенням
// файлу, тому додавати нові формати можна просто дописавши сюди запис.
export const OCR_OUTPUT_FORMATS = [
  { id: "txt", label: ".txt" },
  { id: "doc", label: ".doc" },
];

// buildOutput для <Panel /> — (rawResult, formatId) => Blob.
export const buildOcrOutput = (raw, formatId) => {
  const text = raw?.text ?? "";
  return formatId === "doc" ? buildDocBlob(text) : buildTxtBlob(text);
};

// getOutputName для <Panel /> — (originalName, formatId) => string.
export const getOcrOutputName = (originalName, formatId) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.${formatId}`;
};
