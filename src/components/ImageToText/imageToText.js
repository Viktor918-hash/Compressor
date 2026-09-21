import { createWorker } from "tesseract.js";
import i18n from "../../i18n/i18n";
import { userError } from "../../utils/userError";
import { cleanOcrText, fixCyrillicLatinConfusion } from "./ocrText";

// Мови розпізнавання, які пропонує інтерфейс. Порядок важливий: у рядку
// "ukr+eng" перша мова — основна, тому англійська (запасна для брендів,
// посилань і елементів інтерфейсу на скріншотах) стоїть останньою.
// Файли моделей лежать у public/tesseract/lang (див. scripts/copy-ocr-assets.mjs).
export const OCR_LANGS = [
  { code: "ukr", label: "Українська" },
  { code: "rus", label: "Русский" },
  { code: "spa", label: "Español" },
  { code: "eng", label: "English" },
];
export const OCR_MAX_LANGS = 3;

// Мова сторінки (uk/en/ru/es) → код мовної моделі Tesseract.
const LANG_MAP = {
  uk: "ukr",
  en: "eng",
  ru: "rus",
  es: "spa",
};

/** Мови за замовчуванням: мова сторінки + English (крім самої English). */
export const defaultOcrLangs = (pageLang) => {
  const primary = LANG_MAP[pageLang] || "eng";
  return primary === "eng" ? ["eng"] : [primary, "eng"];
};

/** Нормалізує вибір: лише відомі коди, у канонічному порядку, 1…OCR_MAX_LANGS. */
export const normalizeOcrLangs = (codes, pageLang) => {
  const chosen = OCR_LANGS.map((l) => l.code).filter((c) =>
    (codes || []).includes(c)
  );
  if (chosen.length === 0) return defaultOcrLangs(pageLang);
  return chosen.slice(0, OCR_MAX_LANGS);
};

// Шляхи до власних копій воркера/ядра/моделей (без CDN).
const TESSERACT_PATHS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/core",
  langPath: "/tesseract/lang",
};

// Скільки воркер живе без діла після останнього розпізнавання. WASM-ядро
// й мовна модель займають сотні МБ пам'яті — не тримаємо їх даремно.
const IDLE_TERMINATE_MS = 60_000;

// Найбільша довга сторона зображення для OCR: понад це — зменшуємо (інакше
// canvas у сотні мегапікселів вбиває вкладку на телефоні).
const OCR_MAX_LONG_SIDE = 4500;

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
// createImageBitmap є не в усіх старих Safari — запасний шлях через <img>.
const decodeImage = async (file) => {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight, source: img, close() {} };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const preprocessForOcr = async (file, { binarize = true } = {}) => {
  const bitmap = await decodeImage(file);
  const longSide = Math.max(bitmap.width, bitmap.height);
  const scale =
    longSide < OCR_TARGET_LONG_SIDE
      ? OCR_TARGET_LONG_SIDE / longSide
      : longSide > OCR_MAX_LONG_SIDE
      ? OCR_MAX_LONG_SIDE / longSide
      : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  // Якісне згладжування при апскейлі — без цього збільшене зображення
  // виглядає "зубчастим", що тільки шкодить розпізнаванню дрібних гліфів.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap.source || bitmap, 0, 0, canvas.width, canvas.height);
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

// ── Воркер Tesseract ─────────────────────────────────────────────────────
// Один воркер на сеанс (а не на кожне фото): ініціалізація й завантаження
// мовної моделі — найдовша частина, тож для мультиаплоаду перевикористовуємо.
// Воркер:
//  • перестворюється, якщо змінився набір мов;
//  • ЗНИЩУЄТЬСЯ при "Скасувати", при виході зі сторінки і після 60 с простою
//    (terminateOcrWorker / IDLE_TERMINATE_MS) — WASM і модель звільняють пам'ять;
//  • не залишається "зламаним" назавжди, якщо завантаження моделі не вдалось
//    (наприклад, обрив мережі) — наступна спроба створить його заново.
let workerPromise = null;
let workerKey = null;
let idleTimer = null;
let currentProgress = null; // колбек прогресу поточного завдання (логгер воркера один)

// Завдання виконуються по одному: скасоване завдання не має "перетинатись"
// із наступним, а зміна мов не повинна знищити воркер посеред розпізнавання.
let queue = Promise.resolve();
const runExclusive = (fn) => {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
};

const abortError = () => new DOMException("Aborted", "AbortError");

// Перериває очікування promise, коли спрацьовує signal (сам promise
// продовжує жити у фоні, але результат нікого не цікавить).
const raceAbort = (promise, signal) => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      }
    );
  });
};

/** Знищує воркер (якщо є). Безпечно викликати будь-коли. */
export const terminateOcrWorker = () => {
  clearTimeout(idleTimer);
  idleTimer = null;
  const p = workerPromise;
  workerPromise = null;
  workerKey = null;
  if (p) p.then((w) => w.terminate()).catch(() => {});
};

const scheduleIdleTerminate = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(terminateOcrWorker, IDLE_TERMINATE_MS);
};

// Повідомлення логгера Tesseract → { phase, value }
const mapLoggerMessage = (m) => {
  if (m.status === "recognizing text") {
    return { phase: "recognizing", value: m.progress };
  }
  if (m.status === "loading language traineddata") {
    return { phase: "loading", value: m.progress };
  }
  return { phase: "loading" };
};

// Мовні моделі, які вже успішно завантажувались у цьому сеансі
const loadedLangs = new Set();

// Попереднє завантаження мовних моделей з основного потоку. Навіщо:
//  • tesseract.js при помилці мережі під час завантаження моделі НЕ відхиляє
//    проміс createWorker (він висить вічно) — а тут помилка видна одразу,
//    без створеного й "загубленого" воркера;
//  • можна показати реальний відсоток завантаження;
//  • воркер потім бере файл із HTTP-кешу браузера (Cache-Control у vercel.json).
const preloadLangModels = async (codes, signal, onProgress) => {
  const missing = codes.filter((c) => !loadedLangs.has(c));
  let done = 0;
  for (const code of missing) {
    const resp = await fetch(`${TESSERACT_PATHS.langPath}/${code}.traineddata.gz`, { signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${code}`);
    const total = Number(resp.headers.get("content-length")) || 0;
    if (resp.body && total) {
      const reader = resp.body.getReader();
      let got = 0;
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        got += value.length;
        onProgress?.({ phase: "loading", value: (done + got / total) / missing.length });
      }
    } else {
      await resp.arrayBuffer();
    }
    done += 1;
    onProgress?.({ phase: "loading", value: done / missing.length });
  }
};

const getWorker = (langKey) => {
  if (workerPromise && workerKey === langKey) return workerPromise;

  // Набір мов змінився — закриваємо старий воркер, щоб не тримати в
  // пам'яті одразу дві мовні моделі.
  terminateOcrWorker();

  workerKey = langKey;
  const creating = (async () => {
    // Помилки воркера (напр. збій завантаження моделі) tesseract.js віддає
    // лише в errorHandler, а сам createWorker у цьому разі не завершується —
    // тому перегоняємо його з власним "провалом".
    let fail;
    const failed = new Promise((_, reject) => {
      fail = reject;
    });
    const worker = await Promise.race([
      createWorker(langKey, 1, {
        ...TESSERACT_PATHS,
        logger: (m) => currentProgress?.(mapLoggerMessage(m)),
        errorHandler: (e) => fail(new Error(String(e))),
      }),
      failed,
    ]);
    // Після старту помилки окремих завдань обробляє recognize() (reject)
    langKey.split("+").forEach((c) => loadedLangs.add(c));
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
  workerPromise = creating;
  // Якщо створення не вдалось — не тримаємо "зламаний" проміс
  creating.catch(() => {
    if (workerPromise === creating) {
      workerPromise = null;
      workerKey = null;
    }
  });
  return creating;
};

// Мова для виправлення "гомогліфів": українська має власну літеру "і".
const homoglyphLang = (codes) =>
  codes.includes("ukr") ? "ukr" : codes.includes("rus") ? "rus" : "eng";

// Основне розпізнавання: бінаризований прохід і, за потреби, запасний
// прохід без бінаризації, якщо впевненість першого проходу занизька.
const recognizeText = async (file, { langs, signal, onProgress }) => {
  const codes = normalizeOcrLangs(langs, i18n.language);
  const langKey = codes.join("+");
  const guard = (p) => raceAbort(p, signal);
  const report = (payload) => {
    if (!signal?.aborted) onProgress?.(payload);
  };
  // Дає браузеру домалювати статус перед важкою синхронною підготовкою зображення
  const yieldToUi = () => new Promise((r) => setTimeout(r, 0));

  clearTimeout(idleTimer);
  try {
    report({ phase: "preparing" });
    await guard(yieldToUi());

    let binarized;
    try {
      binarized = await guard(preprocessForOcr(file, { binarize: true }));
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw userError(i18n.t("errors.imageDecodeFailed", { name: file.name }));
    }

    report({ phase: "loading" });
    currentProgress = report;
    let worker;
    try {
      if (!workerPromise || workerKey !== langKey) {
        await guard(preloadLangModels(codes, signal, report));
      }
      worker = await guard(getWorker(langKey));
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      console.error("OCR: не вдалося створити воркер:", err);
      throw userError(i18n.t("imageToText.errors.modelLoad"));
    }

    report({ phase: "recognizing", value: 0, pass: 1 });
    currentProgress = (m) => report({ ...m, pass: 1 });
    let result = await guard(worker.recognize(binarized));

    if (result.data.confidence < LOW_CONFIDENCE_RETRY_THRESHOLD) {
      report({ phase: "recognizing", value: 0, pass: 2 });
      currentProgress = (m) => report({ ...m, pass: 2 });
      const grayscale = await guard(preprocessForOcr(file, { binarize: false }));
      const fallback = await guard(worker.recognize(grayscale));
      if (fallback.data.confidence > result.data.confidence) {
        result = fallback;
      }
    }

    const cleaned = cleanOcrText(result.data.text);
    return fixCyrillicLatinConfusion(cleaned, homoglyphLang(codes));
  } catch (err) {
    // Скасування: воркер може бути посеред розпізнавання — єдиний надійний
    // спосіб його зупинити — знищити (наступне розпізнавання створить новий).
    if (err?.name === "AbortError") terminateOcrWorker();
    throw err;
  } finally {
    currentProgress = null;
    if (workerPromise) scheduleIdleTerminate();
  }
};

// processFile для <Panel />. Повертає не готовий Blob, а "сирі" дані —
// розпізнаний текст. Це дозволяє Panel перегенеровувати вихідний файл
// під обраний користувачем формат (txt/doc) БЕЗ повторного OCR, коли
// людина перемикає формат перемикачем біля кнопки завантаження.
//
// options: { langs: string[] (коди Tesseract), signal, onProgress({phase,value,pass}) }
export const extractOcrData = (file, options = {}) => {
  if (options.signal?.aborted) return Promise.reject(abortError());
  return runExclusive(async () => {
    if (options.signal?.aborted) throw abortError();
    const text = await recognizeText(file, options);
    return { text };
  });
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
