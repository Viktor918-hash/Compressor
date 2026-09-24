// Водяний знак на фото: чиста геометрія розміщення (позиція/тайлінг) і
// затискання параметрів — без DOM/canvas, легко тестується в Node.
// Малювання в canvas лишається у компоненті (той самий підхід, що й у
// crop.js/rotate.js: geometry тут, draw — там).

export const POSITIONS = ["topLeft", "topRight", "center", "bottomLeft", "bottomRight", "tile"];

export const MIN_OPACITY = 0.05;
export const MAX_OPACITY = 1;

/** Затискає прозорість у межі [0.05, 1] (5–100%, той самий діапазон, що в конкурентів). */
export function clampOpacity(v) {
  return Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, v));
}

export const MIN_FONT_PCT = 2;
export const MAX_FONT_PCT = 15;

/** Затискає розмір шрифту у відсотках від коротшої сторони фото. */
export function clampFontPercent(v) {
  return Math.min(MAX_FONT_PCT, Math.max(MIN_FONT_PCT, v));
}

/**
 * Розмір шрифту в px для фото imgW×imgH при заданому відсотку. Відсоток від
 * коротшої сторони — щоб напис лишався розумного розміру і для панорам, і
 * для портретних кадрів.
 */
export function fontSizePx(imgW, imgH, percent) {
  return Math.max(1, Math.round(Math.min(imgW, imgH) * (percent / 100)));
}

export const MIN_SCALE_PCT = 5;
export const MAX_SCALE_PCT = 60;

/** Затискає масштаб лого-водяного знака (% від ширини фото). */
export function clampScalePercent(v) {
  return Math.min(MAX_SCALE_PCT, Math.max(MIN_SCALE_PCT, v));
}

/** Розмір лого (px) для фото canvasW при заданому відсотку й натуральних пропорціях лого. */
export function logoSizePx(canvasW, logoW, logoH, percent) {
  const w = Math.max(1, Math.round(canvasW * (percent / 100)));
  const h = Math.max(1, Math.round((w * logoH) / logoW));
  return { width: w, height: h };
}

/**
 * Позиція (x,y — верхній лівий кут водяного знака) для одного з 5
 * непов­торюваних пресетів. margin — px відступу від краю. Для "tile"
 * використовуйте tilePositions() замість цієї функції.
 */
export function singlePosition(canvasW, canvasH, wmW, wmH, position, margin) {
  switch (position) {
    case "topLeft":
      return { x: margin, y: margin };
    case "topRight":
      return { x: canvasW - wmW - margin, y: margin };
    case "bottomLeft":
      return { x: margin, y: canvasH - wmH - margin };
    case "bottomRight":
      return { x: canvasW - wmW - margin, y: canvasH - wmH - margin };
    case "center":
    default:
      return { x: (canvasW - wmW) / 2, y: (canvasH - wmH) / 2 };
  }
}

/**
 * Сітка позицій для режиму "tile" (повторення водяного знака по всьому
 * фото) — з від'ємним і надлишковим відступом, щоб плитки покривали й краї
 * зображення (canvas сам відсікає зайве за межами полотна). gap — px
 * проміжку між сусідніми плитками.
 */
export function tilePositions(canvasW, canvasH, wmW, wmH, gap) {
  const stepX = wmW + gap;
  const stepY = wmH + gap;
  if (stepX <= 0 || stepY <= 0) return [];
  const cols = Math.ceil(canvasW / stepX) + 2;
  const rows = Math.ceil(canvasH / stepY) + 2;
  const positions = [];
  for (let r = -1; r < rows - 1; r++) {
    for (let c = -1; c < cols - 1; c++) {
      positions.push({ x: c * stepX, y: r * stepY });
    }
  }
  return positions;
}
