// Підбір якості/роздільності так, щоб файл був НЕ БІЛЬШИЙ за цільовий розмір.
//
// Чиста логіка без DOM: кодування передається ззовні (encode), тому її можна
// перевірити юніт-тестом з підробленим кодувальником (tests/compressToSize.test.mjs).
//
// Алгоритм:
//   1. Рівні роздільності: 1, ×0.85, ×0.85², … аж до 600 px по довшій стороні
//      (останній рівень — рівно 600 px). Якщо картинка й так ≤ 600 px — лише рівень 1.
//   2. На кожному рівні: бінарний пошук якості між QUALITY_MAX (0.95) і
//      QUALITY_MIN (0.30), не більше MAX_ITERATIONS (8) кодувань на рівень.
//      Результат — НАЙБІЛЬША перевірена якість, при якій розмір ≤ цілі.
//   3. Якщо навіть при мінімальній якості файл більший — переходимо на менший рівень.
//   4. Якщо ціль недосяжна навіть на найменшому рівні — { ok: false, best } з
//      найменшим досягнутим розміром. Ніколи не повертаємо файл більший за ціль.

export const QUALITY_MAX = 0.95;
export const QUALITY_MIN = 0.3;
export const MAX_ITERATIONS = 8;
export const RESIZE_STEP = 0.85;
export const MIN_LONG_SIDE = 600;

const abortError = () => {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

/** Множники масштабу (від найбільшого до найменшого), у т. ч. рівно 600 px по довшій стороні. */
export function scaleLevels(
  width,
  height,
  { step = RESIZE_STEP, minLongSide = MIN_LONG_SIDE } = {}
) {
  const longSide = Math.max(width, height);
  const levels = [1];
  if (longSide <= minLongSide) return levels;
  let scale = 1;
  for (;;) {
    scale *= step;
    if (longSide * scale <= minLongSide) {
      levels.push(minLongSide / longSide);
      return levels;
    }
    levels.push(scale);
  }
}

/** Розміри в пікселях для масштабу (не менше 1 px). */
export const dimensionsAt = (width, height, scale) => ({
  width: Math.max(1, Math.round(width * scale)),
  height: Math.max(1, Math.round(height * scale)),
});

/**
 * @param encode  async (quality, scale, { width, height }) => { size, data }
 * @param targetBytes  цільовий розмір у байтах (> 0)
 * @param options  { width, height, signal, onProgress, maxIterations, qualityMax, qualityMin, step, minLongSide }
 * @returns  { ok: true, data, size, quality, scale, width, height, encodes }
 *        або { ok: false, reason: "unreachable", best: { size, quality, scale, width, height }, encodes }
 */
export async function fitToTarget(encode, targetBytes, options = {}) {
  const {
    width,
    height,
    signal,
    onProgress,
    maxIterations = MAX_ITERATIONS,
    qualityMax = QUALITY_MAX,
    qualityMin = QUALITY_MIN,
    step = RESIZE_STEP,
    minLongSide = MIN_LONG_SIDE,
  } = options;

  if (!(targetBytes > 0)) throw new RangeError("targetBytes must be > 0");
  if (!(width > 0 && height > 0)) throw new RangeError("width and height must be > 0");
  if (maxIterations < 3) throw new RangeError("maxIterations must be >= 3");

  let encodes = 0;
  let best = null; // найменший з усіх спроб — для повідомлення "недосяжно"

  // Одна спроба кодування. Скасування перевіряємо ДО і ПІСЛЯ кожного
  // кодування — тобто між ітераціями, без зайвої роботи.
  const attempt = async (quality, scale) => {
    if (signal?.aborted) throw abortError();
    const dims = dimensionsAt(width, height, scale);
    const out = await encode(quality, scale, dims);
    if (signal?.aborted) throw abortError();
    encodes += 1;
    const record = {
      size: out.size,
      data: out.data,
      quality,
      scale,
      width: dims.width,
      height: dims.height,
    };
    if (!best || record.size < best.size) best = record;
    onProgress?.({
      iteration: encodes,
      quality,
      scale,
      width: dims.width,
      height: dims.height,
      size: record.size,
      targetBytes,
    });
    return record;
  };

  const fits = (record) => record.size <= targetBytes;
  const success = (record) => ({ ok: true, ...record, encodes });

  const levels = scaleLevels(width, height, { step, minLongSide });
  for (let level = 0; level < levels.length; level += 1) {
    const scale = levels[level];
    let used = 0;
    let lowRecord;

    if (level === 0) {
      // Найчастіше файл лише трохи більший за ціль — спершу пробуємо максимум
      const highRecord = await attempt(qualityMax, scale);
      used += 1;
      if (fits(highRecord)) return success(highRecord);
      lowRecord = await attempt(qualityMin, scale);
      used += 1;
    } else {
      // На менших рівнях більшість спроб — «не влізло»: економимо кодування
      lowRecord = await attempt(qualityMin, scale);
      used += 1;
      if (fits(lowRecord)) {
        const highRecord = await attempt(qualityMax, scale);
        used += 1;
        if (fits(highRecord)) return success(highRecord);
      }
    }

    if (!fits(lowRecord)) continue; // навіть мінімальна якість не влізла → менша роздільність

    // Бінарний пошук: goodQ влізає, badQ — ні
    let good = lowRecord;
    let goodQ = qualityMin;
    let badQ = qualityMax;
    while (used < maxIterations && badQ - goodQ > 0.01) {
      const quality = (goodQ + badQ) / 2;
      const record = await attempt(quality, scale);
      used += 1;
      if (fits(record)) {
        good = record;
        goodQ = quality;
      } else {
        badQ = quality;
      }
    }
    return success(good);
  }

  return {
    ok: false,
    reason: "unreachable",
    best: best && {
      size: best.size,
      quality: best.quality,
      scale: best.scale,
      width: best.width,
      height: best.height,
    },
    encodes,
  };
}
