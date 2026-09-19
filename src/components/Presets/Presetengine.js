// Наближений "движок" пресетів у стилі Lightroom, що працює повністю в браузері
// через <canvas>. Це НЕ точна копія формул Adobe (вони закриті), а візуальне
// наближення тих самих параметрів: exposure, contrast, shadows/highlights,
// saturation/vibrance, HSL по 8 кольорах, split toning, вінʼєтка.

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ---- RGB <-> HSL (усі канали в діапазоні 0..1, h у градусах 0..360) ----
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l };
}

function hslToRgb(h, s, l) {
  if (s === 0) return { r: l, g: l, b: l };

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  return {
    r: hue2rgb(p, q, hNorm + 1 / 3),
    g: hue2rgb(p, q, hNorm),
    b: hue2rgb(p, q, hNorm - 1 / 3),
  };
}

// Центри 8 кольорових смуг (як в Lightroom HSL-панелі), у градусах
const HSL_BANDS = [
  ["red", 0],
  ["orange", 30],
  ["yellow", 60],
  ["green", 120],
  ["aqua", 180],
  ["blue", 240],
  ["purple", 275],
  ["magenta", 315],
];

const HALF_WIDTH = 40; // ширина впливу кожної смуги, градуси

function bandWeight(hueDeg, center) {
  let d = Math.abs(hueDeg - center);
  d = Math.min(d, 360 - d);
  return Math.max(0, 1 - d / HALF_WIDTH);
}

/**
 * Застосовує пресет до ImageData (мутує data напряму для швидкості).
 * @param {ImageData} imageData
 * @param {object} preset - див. структуру в presets.js
 */
export function applyPresetToImageData(imageData, preset) {
  const { data, width, height } = imageData;
  const p = preset;
  const hsl = p.hsl || {};

  const exposureMul = Math.pow(2, p.exposure || 0);
  const contrastFactor = 1 + (p.contrast || 0) / 100;
  const satMul = 1 + (p.saturation || 0) / 100;
  const vibAmount = (p.vibrance || 0) / 100;
  const tempShift = ((p.temperature || 0) / 100) * 0.08;
  const tintShift = ((p.tint || 0) / 100) * 0.08;

  const split = p.splitToning || {};
  const splitPivot = clamp01(0.5 - ((split.balance || 0) / 100) * 0.3);
  const shadowTint = hslToRgb(split.shadowHue || 0, 1, 0.5);
  const highlightTint = hslToRgb(split.highlightHue || 0, 1, 0.5);
  const shadowSatAmt = (split.shadowSat || 0) / 100;
  const highlightSatAmt = (split.highlightSat || 0) / 100;

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const vignetteAmt = (p.vignette || 0) / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // 1) Expozice
    r *= exposureMul;
    g *= exposureMul;
    b *= exposureMul;

    // 2) Тепло / відтінок
    r += tempShift;
    b -= tempShift;
    g += tintShift;

    // 3) Контраст (навколо середньої точки 0.5)
    r = (r - 0.5) * contrastFactor + 0.5;
    g = (g - 0.5) * contrastFactor + 0.5;
    b = (b - 0.5) * contrastFactor + 0.5;

    r = clamp01(r);
    g = clamp01(g);
    b = clamp01(b);

    // 4) Highlights / Shadows / Whites / Blacks — за яскравістю кожного каналу
    const applyTone = (v) => {
      const wShadow = clamp(1 - v / 0.5, 0, 1);
      const wHighlight = clamp((v - 0.5) / 0.5, 0, 1);
      const wBlack = clamp(1 - v / 0.25, 0, 1);
      const wWhite = clamp((v - 0.75) / 0.25, 0, 1);
      v += ((p.shadows || 0) / 100) * 0.5 * wShadow;
      v += ((p.highlights || 0) / 100) * 0.5 * wHighlight;
      v += ((p.blacks || 0) / 100) * 0.5 * wBlack;
      v += ((p.whites || 0) / 100) * 0.5 * wWhite;
      return clamp01(v);
    };
    r = applyTone(r);
    g = applyTone(g);
    b = applyTone(b);

    // 5) HSL: hue-зсув, saturation, luminance по 8 кольорах + saturation/vibrance
    let { h, s, l } = rgbToHsl(r, g, b);

    let hueShiftSum = 0;
    let satMulSum = 0;
    let lumShiftSum = 0;
    let weightSum = 0;

    for (const [name, center] of HSL_BANDS) {
      const band = hsl[name];
      if (!band) continue;
      const w = bandWeight(h, center);
      if (w <= 0) continue;
      hueShiftSum += w * (band.hue || 0) * 0.3;
      satMulSum += w * (1 + (band.sat || 0) / 100);
      lumShiftSum += w * (band.lum || 0) * 0.003;
      weightSum += w;
    }

    if (weightSum > 0) {
      const norm = Math.min(1, 1 / weightSum);
      h = (h + hueShiftSum * norm + 360) % 360;
      const avgSatMul =
        weightSum >= 1 ? satMulSum / weightSum : satMulSum + (1 - weightSum);
      s = clamp01(s * avgSatMul);
      l = clamp01(l + lumShiftSum * norm);
    }

    // Глобальні saturation + vibrance (vibrance сильніше діє на малонасичені пікселі)
    s = clamp01(s * satMul + (1 - s) * s * vibAmount);

    ({ r, g, b } = hslToRgb(h, s, l));

    // 6) Split toning — тонування тіней і світел окремими кольорами
    const wShadowSplit = clamp(1 - l / splitPivot, 0, 1);
    const wHighlightSplit = clamp((l - splitPivot) / (1 - splitPivot), 0, 1);
    const shadowStrength = wShadowSplit * shadowSatAmt * 0.4;
    const highlightStrength = wHighlightSplit * highlightSatAmt * 0.4;

    r =
      r +
      (shadowTint.r - r) * shadowStrength +
      (highlightTint.r - r) * highlightStrength;
    g =
      g +
      (shadowTint.g - g) * shadowStrength +
      (highlightTint.g - g) * highlightStrength;
    b =
      b +
      (shadowTint.b - b) * shadowStrength +
      (highlightTint.b - b) * highlightStrength;

    // 7) Вінʼєтка
    if (vignetteAmt !== 0) {
      const idx = i / 4;
      const x = idx % width;
      const y = Math.floor(idx / width);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const falloff = clamp01(dist - 0.35) / 0.65;
      const darken = 1 + vignetteAmt * falloff * 0.6;
      r *= darken;
      g *= darken;
      b *= darken;
    }

    data[i] = clamp01(r) * 255;
    data[i + 1] = clamp01(g) * 255;
    data[i + 2] = clamp01(b) * 255;
  }

  return imageData;
}

/**
 * Малює зображення (File/Blob/ImageBitmap/HTMLImageElement) на новому canvas,
 * застосовує пресет і повертає canvas. maxSize обмежує довшу сторону —
 * зручно для швидких прев'ю в сітці.
 */
export async function renderPresetToCanvas(source, preset, { maxSize } = {}) {
  const img = await loadImage(source);

  let { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) {
    w = img.width;
    h = img.height;
  }

  if (maxSize && Math.max(w, h) > maxSize) {
    const scale = maxSize / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  if (preset) {
    const imageData = ctx.getImageData(0, 0, w, h);
    applyPresetToImageData(imageData, preset);
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) {
      resolve(source);
      return;
    }
    const img = new Image();
    // Blob-URL, створений тут, звільняємо одразу після завантаження (раніше
    // він не відкликався ніколи — а на кожен із 26 пресетів створювався новий).
    let objectUrl = null;
    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    };
    img.onload = () => {
      cleanup();
      resolve(img);
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Не вдалося завантажити зображення"));
    };

    if (source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source; // рядок-URL
    }
  });
}

export function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
      type,
      quality
    );
  });
}

/**
 * Створює "масштабовану" версію пресету: усі числові параметри множаться
 * на intensity (0..1.5+). 0 = оригінал (без ефекту), 1 = пресет як є,
 * >1 = підсилений ефект по тих самих осях.
 * Кольори (hue-центри split toning) НЕ масштабуємо, бо це не "сила", а відтінок.
 */
export function scalePreset(preset, intensity) {
  const t = intensity;
  const scaleNum = (v) => (v || 0) * t;

  const scaled = {
    ...preset,
    exposure: scaleNum(preset.exposure),
    contrast: scaleNum(preset.contrast),
    highlights: scaleNum(preset.highlights),
    shadows: scaleNum(preset.shadows),
    whites: scaleNum(preset.whites),
    blacks: scaleNum(preset.blacks),
    saturation: scaleNum(preset.saturation),
    vibrance: scaleNum(preset.vibrance),
    temperature: scaleNum(preset.temperature),
    tint: scaleNum(preset.tint),
    vignette: scaleNum(preset.vignette),
  };

  if (preset.hsl) {
    scaled.hsl = {};
    for (const key of Object.keys(preset.hsl)) {
      const band = preset.hsl[key];
      scaled.hsl[key] = {
        hue: scaleNum(band.hue),
        sat: scaleNum(band.sat),
        lum: scaleNum(band.lum),
      };
    }
  }

  if (preset.splitToning) {
    const st = preset.splitToning;
    scaled.splitToning = {
      shadowHue: st.shadowHue, // відтінок не чіпаємо
      highlightHue: st.highlightHue,
      balance: st.balance,
      shadowSat: scaleNum(st.shadowSat),
      highlightSat: scaleNum(st.highlightSat),
    };
  }

  return scaled;
}
