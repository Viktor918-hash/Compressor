import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";
import {
  rotateCW,
  rotateCCW,
  isSwapped,
  outputSize,
  mapPoint,
  initialTransform,
} from "../src/components/RotateImage/rotate.js";

test("rotateCW/rotateCCW: цикл 0→90→180→270→0, взаємно обернені", () => {
  assert.equal(rotateCW(0), 90);
  assert.equal(rotateCW(90), 180);
  assert.equal(rotateCW(180), 270);
  assert.equal(rotateCW(270), 0);
  assert.equal(rotateCCW(0), 270);
  assert.equal(rotateCCW(270), 180);
  assert.equal(rotateCCW(180), 90);
  assert.equal(rotateCCW(90), 0);
  for (const r of [0, 90, 180, 270]) {
    assert.equal(rotateCCW(rotateCW(r)), r, `rotateCCW(rotateCW(${r})) має повернути ${r}`);
  }
});

test("isSwapped/outputSize: 90 і 270 міняють місцями ширину й висоту, 0 і 180 — ні", () => {
  assert.equal(isSwapped(0), false);
  assert.equal(isSwapped(90), true);
  assert.equal(isSwapped(180), false);
  assert.equal(isSwapped(270), true);
  assert.deepEqual(outputSize(1200, 800, 0), { width: 1200, height: 800 });
  assert.deepEqual(outputSize(1200, 800, 90), { width: 800, height: 1200 });
  assert.deepEqual(outputSize(1200, 800, 180), { width: 1200, height: 800 });
  assert.deepEqual(outputSize(1200, 800, 270), { width: 800, height: 1200 });
});

test("initialTransform: 0°, без віддзеркалення", () => {
  assert.deepEqual(initialTransform(), { rotation: 0, flipH: false, flipV: false });
});

const W = 100;
const H = 60;
const TL = [0, 0];
const TR = [W, 0];
const BL = [0, H];
const BR = [W, H];
const noFlip = { flipH: false, flipV: false };

test("mapPoint: rotation=0 без віддзеркалення — точки не змінюються", () => {
  const t = { rotation: 0, ...noFlip };
  assert.deepEqual(mapPoint(...TL, W, H, t), { x: 0, y: 0 });
  assert.deepEqual(mapPoint(...BR, W, H, t), { x: W, y: H });
});

test("mapPoint: rotation=90 (за годинниковою) — TL→TR, TR→BR, BR→BL, BL→TL кути результату", () => {
  const t = { rotation: 90, ...noFlip };
  const out = outputSize(W, H, 90); // {width:H, height:W}
  assert.deepEqual(mapPoint(...TL, W, H, t), { x: out.width, y: 0 }); // top-right
  assert.deepEqual(mapPoint(...TR, W, H, t), { x: out.width, y: out.height }); // bottom-right
  assert.deepEqual(mapPoint(...BR, W, H, t), { x: 0, y: out.height }); // bottom-left
  assert.deepEqual(mapPoint(...BL, W, H, t), { x: 0, y: 0 }); // top-left
});

test("mapPoint: rotation=270 (проти годинникової) — обернений цикл кутів", () => {
  const t = { rotation: 270, ...noFlip };
  const out = outputSize(W, H, 270);
  assert.deepEqual(mapPoint(...TL, W, H, t), { x: 0, y: out.height }); // bottom-left
  assert.deepEqual(mapPoint(...TR, W, H, t), { x: 0, y: 0 }); // top-left
  assert.deepEqual(mapPoint(...BR, W, H, t), { x: out.width, y: 0 }); // top-right
  assert.deepEqual(mapPoint(...BL, W, H, t), { x: out.width, y: out.height }); // bottom-right
});

test("mapPoint: rotation=180 — точка навпроти через центр", () => {
  const t = { rotation: 180, ...noFlip };
  assert.deepEqual(mapPoint(...TL, W, H, t), { x: W, y: H }); // → BR
  assert.deepEqual(mapPoint(...BR, W, H, t), { x: 0, y: 0 }); // → TL
});

test("mapPoint: flipH дзеркалить ліво-право (rotation=0)", () => {
  const t = { rotation: 0, flipH: true, flipV: false };
  assert.deepEqual(mapPoint(...TL, W, H, t), { x: W, y: 0 }); // → TR
  assert.deepEqual(mapPoint(...TR, W, H, t), { x: 0, y: 0 }); // → TL
});

test("mapPoint: flipV дзеркалить верх-низ (rotation=0)", () => {
  const t = { rotation: 0, flipH: false, flipV: true };
  assert.deepEqual(mapPoint(...TL, W, H, t), { x: 0, y: H }); // → BL
  assert.deepEqual(mapPoint(...BL, W, H, t), { x: 0, y: 0 }); // → TL
});

test("mapPoint: flipH+flipV = поворот на 180° по суті (для кутів)", () => {
  const flipped = { rotation: 0, flipH: true, flipV: true };
  const rotated = { rotation: 180, ...noFlip };
  for (const c of [TL, TR, BL, BR]) {
    assert.deepEqual(mapPoint(...c, W, H, flipped), mapPoint(...c, W, H, rotated));
  }
});

test("mapPoint: комбінація rotation=90 + flipH — узгоджена з outputSize (усі точки в межах)", () => {
  const t = { rotation: 90, flipH: true, flipV: false };
  const out = outputSize(W, H, 90);
  for (const c of [TL, TR, BL, BR]) {
    const p = mapPoint(...c, W, H, t);
    assert.ok(p.x >= 0 && p.x <= out.width && p.y >= 0 && p.y <= out.height, JSON.stringify({ c, p, out }));
  }
});

// ---- маршрут/каталог/SEO-метадані (той самий шаблон, що й в crop.test.mjs) ----

test("rotateImage: маршрут у 4 мовах", () => {
  const r = ROUTE_PATHS.find((x) => x.slug === "rotateImage");
  assert.ok(r, "маршрут rotateImage не знайдено");
  assert.deepEqual(Object.keys(r).sort(), ["en", "es", "ru", "slug", "uk"]);
  assert.equal(r.en, "/en" + r.uk);
  assert.equal(r.ru, "/ru" + r.uk);
});

test("rotateImage: SEO title/description задані для 4 мов", () => {
  for (const l of ["uk", "en", "ru", "es"]) {
    const m = PAGE_META.rotateImage[l];
    assert.ok(m, `немає PAGE_META.rotateImage.${l}`);
    assert.ok(m.title.length <= 60, `${l} title ${m.title.length}`);
    assert.ok(m.description.length >= 120 && m.description.length <= 160, `${l} description ${m.description.length}`);
  }
});
