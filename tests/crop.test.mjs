import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ASPECT_RATIOS,
  MIN_SIZE,
  initialRect,
  clampPosition,
  moveRect,
  resizeCorner,
  rectToPixels,
} from "../src/components/CropImage/crop.js";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";

test("initialRect: вільна форма (ratio=null) — усе зображення", () => {
  const r = initialRect(800, 600, null);
  assert.deepEqual(r, { x: 0, y: 0, w: 1, h: 1 });
});

test("initialRect: ratio == пропорції фото — теж усе зображення", () => {
  const r = initialRect(800, 600, 800 / 600);
  assert.ok(Math.abs(r.w - 1) < 1e-9);
  assert.ok(Math.abs(r.h - 1) < 1e-9);
});

test("initialRect: ratio ширший за фото — обмежено по ширині, по центру вертикально", () => {
  // фото 800×600 (4:3), рамка 16:9 — ширша за фото, тому h < 1
  const r = initialRect(800, 600, 16 / 9);
  assert.equal(r.w, 1);
  assert.ok(r.h < 1);
  assert.ok(Math.abs(r.y - (1 - r.h) / 2) < 1e-9, "центровано по Y");
  assert.equal(r.x, 0);
});

test("initialRect: ratio вужчий за фото (портрет на альбомному фото) — обмежено по висоті, по центру горизонтально", () => {
  const r = initialRect(800, 600, 9 / 16);
  assert.equal(r.h, 1);
  assert.ok(r.w < 1);
  assert.ok(Math.abs(r.x - (1 - r.w) / 2) < 1e-9, "центровано по X");
  assert.equal(r.y, 0);
});

test("initialRect: квадратне фото + ratio 1:1 — теж усе зображення", () => {
  const r = initialRect(500, 500, 1);
  assert.deepEqual(r, { x: 0, y: 0, w: 1, h: 1 });
});

test("clampPosition: не дає рамці вийти за межі [0,1] (позиція, розмір лишається)", () => {
  const r = clampPosition({ x: -0.2, y: 1.5, w: 0.3, h: 0.3 });
  assert.equal(r.x, 0);
  assert.equal(r.y, 0.7);
  assert.equal(r.w, 0.3);
  assert.equal(r.h, 0.3);
});

test("clampPosition: рамка більша за 1 — обрізає розмір до 1, позиція 0", () => {
  const r = clampPosition({ x: 0.5, y: 0.5, w: 1.4, h: 1.4 });
  assert.equal(r.w, 1);
  assert.equal(r.h, 1);
  assert.equal(r.x, 0);
  assert.equal(r.y, 0);
});

test("moveRect: переміщує на (dx,dy), затискає в межах", () => {
  const start = { x: 0.2, y: 0.2, w: 0.3, h: 0.3 };
  const moved = moveRect(start, 0.1, -0.05);
  assert.ok(Math.abs(moved.x - 0.3) < 1e-9);
  assert.ok(Math.abs(moved.y - 0.15) < 1e-9);
  assert.equal(moved.w, 0.3);
  assert.equal(moved.h, 0.3);

  // спроба виїхати за правий/нижній край — затиснуто так, щоб рамка лишалась у межах
  const pastEdge = moveRect(start, 5, 5);
  assert.ok(Math.abs(pastEdge.x - 0.7) < 1e-9); // 1 - w
  assert.ok(Math.abs(pastEdge.y - 0.7) < 1e-9);

  // спроба виїхати за лівий/верхній край
  const beforeEdge = moveRect(start, -5, -5);
  assert.equal(beforeEdge.x, 0);
  assert.equal(beforeEdge.y, 0);
});

test("resizeCorner: вільна форма (se) — протилежний кут (nw) нерухомий", () => {
  const start = { x: 0.2, y: 0.2, w: 0.3, h: 0.3 };
  const resized = resizeCorner(start, "se", 0.1, 0.05, null, 800, 600);
  assert.ok(Math.abs(resized.x - 0.2) < 1e-9, "лівий край не рухається");
  assert.ok(Math.abs(resized.y - 0.2) < 1e-9, "верхній край не рухається");
  assert.ok(Math.abs(resized.w - 0.4) < 1e-9);
  assert.ok(Math.abs(resized.h - 0.35) < 1e-9);
});

test("resizeCorner: вільна форма (nw) — протилежний кут (se) нерухомий", () => {
  const start = { x: 0.2, y: 0.2, w: 0.3, h: 0.3 };
  const resized = resizeCorner(start, "nw", -0.1, -0.05, null, 800, 600);
  const x2 = resized.x + resized.w;
  const y2 = resized.y + resized.h;
  assert.ok(Math.abs(x2 - 0.5) < 1e-9, "правий край не рухається (0.2+0.3)");
  assert.ok(Math.abs(y2 - 0.5) < 1e-9, "нижній край не рухається");
  assert.ok(Math.abs(resized.x - 0.1) < 1e-9);
  assert.ok(Math.abs(resized.y - 0.15) < 1e-9);
});

test("resizeCorner: не дає стиснути менше MIN_SIZE", () => {
  const start = { x: 0.2, y: 0.2, w: 0.3, h: 0.3 };
  const resized = resizeCorner(start, "se", -1, -1, null, 800, 600);
  assert.ok(resized.w >= MIN_SIZE - 1e-9);
  assert.ok(resized.h >= MIN_SIZE - 1e-9);
});

test("resizeCorner: заблокована пропорція утримується на неквадратному фото", () => {
  // фото 1600×900 (16:9), тримаємо ratio 1:1 (px) — у частках це НЕ 1:1,
  // бо частки виміряні відносно різних натуральних розмірів
  const imgW = 1600, imgH = 900;
  const start = initialRect(imgW, imgH, 1); // стартова квадратна рамка по центру
  const resized = resizeCorner(start, "se", 0.15, 0.02, 1, imgW, imgH);
  const pxW = resized.w * imgW;
  const pxH = resized.h * imgH;
  assert.ok(Math.abs(pxW / pxH - 1) < 0.01, `пропорція в пікселях мала лишитись 1:1, отримано ${pxW / pxH}`);
});

test("resizeCorner: заблокована пропорція не вилазить за межі зображення (стискається пропорційно)", () => {
  const imgW = 1600, imgH = 900;
  const start = initialRect(imgW, imgH, 1);
  // тягнемо far за межу — рамка мала б перевищити [0,1], але має стиснутись,
  // зберігши ratio
  const resized = resizeCorner(start, "se", 5, 5, 1, imgW, imgH);
  assert.ok(resized.x + resized.w <= 1 + 1e-9);
  assert.ok(resized.y + resized.h <= 1 + 1e-9);
  const pxW = resized.w * imgW;
  const pxH = resized.h * imgH;
  assert.ok(Math.abs(pxW / pxH - 1) < 0.01);
});

test("rectToPixels: конвертує частки в цілі пікселі без вильоту за межі через округлення", () => {
  const px = rectToPixels({ x: 0, y: 0, w: 1, h: 1 }, 803, 601);
  assert.deepEqual(px, { sx: 0, sy: 0, sw: 803, sh: 601 });

  const px2 = rectToPixels({ x: 0.5, y: 0.25, w: 0.3, h: 0.4 }, 1000, 800);
  assert.equal(px2.sx, 500);
  assert.equal(px2.sy, 200);
  assert.equal(px2.sw, 300);
  assert.equal(px2.sh, 320);
});

test("ASPECT_RATIOS: список без дублікатів id, «free» першим і value=null", () => {
  assert.equal(ASPECT_RATIOS[0].id, "free");
  assert.equal(ASPECT_RATIOS[0].value, null);
  const ids = ASPECT_RATIOS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const r of ASPECT_RATIOS.slice(1)) assert.ok(r.value > 0);
});

test("маршрут /crop-image: 4 мови, підключений до каталогу й «Схожих»", () => {
  const r = ROUTE_PATHS.find((x) => x.slug === "cropImage");
  assert.deepEqual(r, {
    slug: "cropImage",
    uk: "/crop-image",
    en: "/en/crop-image",
    ru: "/ru/crop-image",
    es: "/es/recortar-imagen",
  });
  const catalog = readFileSync("src/toolsCatalog.js", "utf8");
  assert.match(catalog, /slug: "cropImage"/);
  assert.match(catalog, /cropImage: \[[^\]]{6,}\]/, "у RELATED має бути власний список");
  const linkedFrom = [...catalog.matchAll(/^\s{2}(\w+): \[([^\]]*)\],?$/gm)].filter(
    (m) => m[1] !== "cropImage" && m[2].includes('"cropImage"')
  );
  assert.ok(linkedFrom.length >= 2, "додайте нову сторінку у «Схожі» 2–3 існуючих інструментів");
});

test("SEO-метадані cropImage: title ≤ 60, description 120–160, унікальні на сайті", () => {
  const all = Object.values(PAGE_META).flatMap((m) => Object.values(m));
  assert.equal(new Set(all.map((m) => m.title)).size, all.length, "дублікат title");
  assert.equal(new Set(all.map((m) => m.description)).size, all.length, "дублікат description");
  for (const l of ["uk", "en", "ru", "es"]) {
    const m = PAGE_META.cropImage[l];
    assert.ok(m.title.length <= 60, `title ${l}: ${m.title.length}`);
    assert.ok(m.description.length >= 120 && m.description.length <= 160, `description ${l}: ${m.description.length}`);
  }
});
