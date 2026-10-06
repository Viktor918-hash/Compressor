// Чорно-біле фото: чиста логіка розрахунку яскравості й змішування кольору
// з інтенсивністю (без DOM/canvas — легко тестується в Node). Малювання в
// canvas лишається у компоненті (той самий підхід, що й у crop.js/rotate.js:
// geometry/формули тут, draw — там).

/** Межі повзунка інтенсивності ефекту (0 = оригінал, 100 = повністю чорно-біле). */
export const MIN_INTENSITY = 0;
export const MAX_INTENSITY = 100;
export const DEFAULT_INTENSITY = 100;

/** Затискає інтенсивність у межі [0,100] і округлює до цілого. */
export function clampIntensity(value) {
  return Math.min(MAX_INTENSITY, Math.max(MIN_INTENSITY, Math.round(value)));
}

/**
 * Яскравість пікселя за стандартними вагами ITU-R BT.601 (ті самі ваги, що
 * й у більшості простих чорно-білих фільтрів і в декодерах YUV). Округлена
 * до цілого 0..255.
 */
export function grayscaleValue(r, g, b) {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Лінійне змішування оригінального значення каналу з чорно-білим на основі
 * intensity (0..100): 0 — лишає оригінал, 100 — повністю замінює на gray.
 * Округлене й затиснуте в 0..255 (на випадок округлення за межі).
 */
export function blendChannel(original, gray, intensity) {
  const p = clampIntensity(intensity) / 100;
  const value = Math.round(original + (gray - original) * p);
  return Math.min(255, Math.max(0, value));
}

/**
 * Застосовує чорно-білий ефект до плаского RGBA-масиву пікселів (підходить
 * і для Uint8ClampedArray з ImageData, і для звичайного Array — зручно для
 * юніт-тестів без canvas). Канал альфа (кожен 4-й байт) не змінюється.
 * Мутує переданий масив і повертає його ж.
 */
export function applyGrayscaleToPixels(data, intensity) {
  const i = clampIntensity(intensity);
  if (i === MIN_INTENSITY) return data; // 0% — нічого не змінювати
  for (let idx = 0; idx < data.length; idx += 4) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const gray = grayscaleValue(r, g, b);
    data[idx] = blendChannel(r, gray, i);
    data[idx + 1] = blendChannel(g, gray, i);
    data[idx + 2] = blendChannel(b, gray, i);
    // data[idx + 3] (alpha) лишається незмінним
  }
  return data;
}
