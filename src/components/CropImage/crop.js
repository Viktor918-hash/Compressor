// Обрізати фото: чиста геометрія рамки виділення (у частках 0..1 від
// зображення, незалежно від DOM/масштабу превʼю — легко тестується в Node).
// Малювання в canvas лишається у компоненті (той самий підхід, що й у
// Resize.jsx: geometry тут, draw — там).

// value — пропорція ширина/висота у пікселях (null = вільна форма).
export const ASPECT_RATIOS = [
  { id: "free", value: null },
  { id: "1:1", value: 1 },
  { id: "4:3", value: 4 / 3 },
  { id: "3:4", value: 3 / 4 },
  { id: "3:2", value: 3 / 2 },
  { id: "2:3", value: 2 / 3 },
  { id: "16:9", value: 16 / 9 },
  { id: "9:16", value: 9 / 16 },
];

// Мінімальний розмір рамки (частка довшої сторони) — щоб перетягуванням
// маркера не можна було стиснути виділення в точку.
export const MIN_SIZE = 0.05;

/**
 * Найбільший прямокутник заданої пропорції (ratio = ширина/висота в
 * пікселях), вписаний по центру зображення imgW×imgH. ratio=null — усе
 * зображення. Повертає {x,y,w,h} у частках 0..1.
 */
export function initialRect(imgW, imgH, ratio) {
  if (!ratio || !imgW || !imgH) return { x: 0, y: 0, w: 1, h: 1 };
  const imgRatio = imgW / imgH;
  let w, h;
  if (ratio > imgRatio) {
    // рамка відносно ширша за фото — обмежена по ширині
    w = 1;
    h = imgW / ratio / imgH;
  } else {
    h = 1;
    w = (imgH * ratio) / imgW;
  }
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

/** Затискає прямокутник у межі [0,1]×[0,1] по позиції (розмір не міняє). */
export function clampPosition(rect) {
  const w = Math.min(1, rect.w);
  const h = Math.min(1, rect.h);
  const x = Math.min(Math.max(rect.x, 0), Math.max(0, 1 - w));
  const y = Math.min(Math.max(rect.y, 0), Math.max(0, 1 - h));
  return { x, y, w, h };
}

/** Переміщення всієї рамки на (dx,dy) часток, затиснуте в межі зображення. */
export function moveRect(rect, dx, dy) {
  return clampPosition({ ...rect, x: rect.x + dx, y: rect.y + dy });
}

const CORNER_ANCHORS = {
  // ax,ay — нерухомий (протилежний) кут; sx,sy — напрямок від нього до
  // рухомого кута, яким тягнуть.
  nw: (r) => ({ ax: r.x + r.w, ay: r.y + r.h, sx: -1, sy: -1 }),
  ne: (r) => ({ ax: r.x, ay: r.y + r.h, sx: 1, sy: -1 }),
  sw: (r) => ({ ax: r.x + r.w, ay: r.y, sx: -1, sy: 1 }),
  se: (r) => ({ ax: r.x, ay: r.y, sx: 1, sy: 1 }),
};

export const CORNERS = ["nw", "ne", "sw", "se"];

/**
 * Зміна розміру рамки перетягуванням одного з 4 кутових маркерів на
 * (dx,dy) часток. ratio (px-пропорція, null = вільно) утримується з
 * урахуванням того, що частки не квадратні, якщо фото не квадратне —
 * тому потрібні imgW/imgH. Протилежний кут лишається нерухомим.
 */
export function resizeCorner(rect, corner, dx, dy, ratio, imgW, imgH) {
  const anchor = CORNER_ANCHORS[corner]?.(rect);
  if (!anchor) return rect;
  const { ax, ay, sx, sy } = anchor;

  const oldMx = ax + sx * rect.w;
  const oldMy = ay + sy * rect.h;
  let mx = Math.min(1, Math.max(0, oldMx + dx));
  let my = Math.min(1, Math.max(0, oldMy + dy));

  let w = Math.abs(mx - ax);
  let h = Math.abs(my - ay);

  if (ratio && imgW && imgH) {
    // ratio — пропорція в пікселях; переводимо в пропорцію часток:
    // (w*imgW)/(h*imgH) = ratio  =>  w/h = ratio*imgH/imgW
    const fracRatio = (ratio * imgH) / imgW;
    // більший з двох рухів визначає розмір, другий підлаштовується
    if (w / fracRatio >= h) {
      h = w / fracRatio;
    } else {
      w = h * fracRatio;
    }
    // могли вилізти за межі зображення — стискаємо пропорційно, зберігши ratio
    const maxW = sx > 0 ? 1 - ax : ax;
    const maxH = sy > 0 ? 1 - ay : ay;
    const scale = Math.min(1, maxW > 0 ? maxW / w : 1, maxH > 0 ? maxH / h : 1);
    w *= scale;
    h *= scale;
  }

  w = Math.max(MIN_SIZE, Math.min(1, w));
  h = Math.max(MIN_SIZE, Math.min(1, h));

  const newX = sx > 0 ? ax : ax - w;
  const newY = sy > 0 ? ay : ay - h;
  return clampPosition({ x: newX, y: newY, w, h });
}

/** {x,y,w,h} у частках → цілі пікселі відносно натуральних розмірів зображення. */
export function rectToPixels(rect, imgW, imgH) {
  const sx = Math.round(rect.x * imgW);
  const sy = Math.round(rect.y * imgH);
  // ширину/висоту рахуємо з різниці округлених країв, щоб рамка, що впритул
  // до краю зображення, не «вилазила» за нього через накопичення округлення
  const sw = Math.round((rect.x + rect.w) * imgW) - sx;
  const sh = Math.round((rect.y + rect.h) * imgH) - sy;
  return { sx, sy, sw: Math.max(1, sw), sh: Math.max(1, sh) };
}
