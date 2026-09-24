// Повернути / віддзеркалити фото: чиста геометрія повороту й віддзеркалення
// (без DOM/canvas — легко тестується в Node). Малювання в canvas лишається
// у компоненті (той самий підхід, що й у crop.js/CropImage.jsx: geometry
// тут, draw — там).
//
// Стан трансформації — {rotation, flipH, flipV}: rotation ∈ {0,90,180,270}
// (за годинниковою стрілкою), flipH/flipV — незалежні прапорці
// віддзеркалення. Порядок застосування (важливий для mapPoint і для
// canvas-малювання в компоненті): спершу віддзеркалення в координатах
// ОРИГІНАЛЬНОГО зображення, потім поворот.

export const ROTATIONS = [0, 90, 180, 270];

/** Наступний поворот за годинниковою стрілкою на 90°. */
export function rotateCW(rotation) {
  return (rotation + 90) % 360;
}

/** Наступний поворот проти годинникової стрілки на 90° (= +270° за год. стр.). */
export function rotateCCW(rotation) {
  return (rotation + 270) % 360;
}

/** true, якщо при такому повороті ширина/висота міняються місцями. */
export function isSwapped(rotation) {
  return rotation === 90 || rotation === 270;
}

/** Розмір результату (px) для вихідного imgW×imgH при заданому повороті. */
export function outputSize(imgW, imgH, rotation) {
  return isSwapped(rotation) ? { width: imgH, height: imgW } : { width: imgW, height: imgH };
}

/**
 * Координати точки (x,y) з оригінального зображення (0..imgW, 0..imgH) у
 * системі координат результату (0..outW, 0..outH) після віддзеркалення й
 * повороту. Використовується і для чистих юніт-тестів (кутові точки), і як
 * довідкова формула для canvas-трансформацій у компоненті.
 */
export function mapPoint(x, y, imgW, imgH, { rotation, flipH, flipV }) {
  const xf = flipH ? imgW - x : x;
  const yf = flipV ? imgH - y : y;
  switch (rotation) {
    case 90:
      return { x: imgH - yf, y: xf };
    case 180:
      return { x: imgW - xf, y: imgH - yf };
    case 270:
      return { x: yf, y: imgW - xf };
    default:
      return { x: xf, y: yf };
  }
}

/** Початковий стан трансформації. */
export function initialTransform() {
  return { rotation: 0, flipH: false, flipV: false };
}
