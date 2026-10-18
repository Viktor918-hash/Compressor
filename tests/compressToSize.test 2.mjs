// Юніт-тести чистої логіки підбору якості (fitToTarget) з підробленим encode:
// розмір «файлу» моделюється формулою, тож перевіряємо алгоритм, а не браузер.
import test from "node:test";
import assert from "node:assert/strict";
import {
  fitToTarget,
  scaleLevels,
  QUALITY_MAX,
  QUALITY_MIN,
  MAX_ITERATIONS,
} from "../src/components/CompressToSize/fitToTarget.js";

// Правдоподібна модель: розмір росте з якістю (нелінійно) і з площею кадру
const makeEncoder = (baseBytes = 2_000_000, log = []) =>
  async (quality, scale, dims) => {
    log.push({ quality, scale, ...dims });
    const size = Math.round(baseBytes * scale * scale * quality ** 2);
    return { size, data: `q${quality}@${scale}` };
  };

test("scaleLevels: 1, ×0.85, … і рівно 600 px по довшій стороні", () => {
  const levels = scaleLevels(4000, 3000);
  assert.equal(levels[0], 1);
  assert.ok(Math.abs(levels[1] - 0.85) < 1e-9);
  assert.ok(Math.abs(levels.at(-1) * 4000 - 600) < 1e-9, "останній рівень — 600 px");
  for (const s of levels) assert.ok(4000 * s >= 600 - 1e-9);
  assert.deepEqual(scaleLevels(500, 300), [1], "мала картинка не зменшується");
});

test("вкладається з першої спроби: якість 0.95, одне кодування", async () => {
  const log = [];
  const r = await fitToTarget(makeEncoder(400_000, log), 500_000, { width: 2000, height: 1500 });
  assert.equal(r.ok, true);
  assert.equal(r.quality, QUALITY_MAX);
  assert.equal(r.scale, 1);
  assert.equal(log.length, 1);
});

test("бінарний пошук: результат ≤ цілі, якість найбільша з перевірених, ≤ 8 кодувань", async () => {
  const log = [];
  const target = 400_000; // base 2 МБ → потрібна якість ≈ sqrt(0.2) ≈ 0.447
  const r = await fitToTarget(makeEncoder(2_000_000, log), target, { width: 2000, height: 1500 });
  assert.equal(r.ok, true);
  assert.ok(r.size <= target, `size ${r.size} > ${target}`);
  assert.equal(r.scale, 1, "роздільність не чіпаємо, якщо вистачає якості");
  assert.ok(log.length <= MAX_ITERATIONS, `кодувань: ${log.length}`);
  const ideal = Math.sqrt(target / 2_000_000);
  assert.ok(ideal - r.quality < 0.03 && r.quality <= ideal + 1e-9, `q=${r.quality}, ideal=${ideal}`);
  // жодна перевірена якість, що влізла, не більша за обрану
  const fitting = log.filter((l) => 2_000_000 * l.quality ** 2 <= target).map((l) => l.quality);
  assert.equal(Math.max(...fitting), r.quality);
});

test("при мінімальній якості не влізло → зменшує роздільність ×0.85 і знову шукає якість", async () => {
  const log = [];
  // при q=0.3 і scale=1: 2 000 000*0.09 = 180 000 > 100 000 → потрібне зменшення
  const target = 100_000;
  const r = await fitToTarget(makeEncoder(2_000_000, log), target, { width: 4000, height: 3000 });
  assert.equal(r.ok, true);
  assert.ok(r.size <= target);
  assert.ok(r.scale < 1, "роздільність зменшено");
  assert.ok(r.width < 4000 && r.height < 3000);
  // перше зменшення — рівно ×0.85, і воно є в журналі
  assert.ok(log.some((l) => Math.abs(l.scale - 0.85) < 1e-9));
  // на кожному рівні ≤ 8 кодувань
  const perLevel = new Map();
  for (const l of log) perLevel.set(l.scale, (perLevel.get(l.scale) || 0) + 1);
  for (const n of perLevel.values()) assert.ok(n <= MAX_ITERATIONS);
});

test("ніколи не опускається нижче 600 px по довшій стороні", async () => {
  const log = [];
  const r = await fitToTarget(makeEncoder(50_000_000, log), 1, { width: 5000, height: 4000 });
  assert.equal(r.ok, false);
  for (const l of log) assert.ok(Math.max(l.width, l.height) >= 600, `${l.width}x${l.height}`);
  assert.equal(Math.max(...log.map((l) => Math.max(l.width, l.height))) <= 5000, true);
  assert.ok(log.some((l) => Math.max(l.width, l.height) === 600), "дійшли до 600 px");
});

test("недосяжна ціль: ok=false, найменший досягнутий розмір, без «мовчазної» відповіді", async () => {
  const log = [];
  const r = await fitToTarget(makeEncoder(3_000_000, log), 1_000, { width: 3000, height: 2000 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unreachable");
  assert.equal(r.data, undefined, "файл більший за ціль не повертається");
  const smallest = Math.min(...log.map((l) => Math.round(3_000_000 * l.scale ** 2 * l.quality ** 2)));
  assert.equal(r.best.size, smallest);
  assert.equal(r.best.quality, QUALITY_MIN);
  assert.equal(Math.max(r.best.width, r.best.height), 600);
});

test("мала картинка (≤ 600 px) не зменшується: недосяжно після ≤ 2 кодувань", async () => {
  const log = [];
  const r = await fitToTarget(makeEncoder(900_000, log), 1_000, { width: 500, height: 400 });
  assert.equal(r.ok, false);
  assert.ok(log.length <= 2);
  assert.ok(log.every((l) => l.scale === 1));
});

test("результат ніколи не більший за ціль, навіть якщо розмір немонотонний (шум кодувальника)", async () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const noisy = async (quality, scale) => ({
    size: Math.round(1_500_000 * scale * scale * quality ** 2 * (0.9 + rand() * 0.2)),
    data: "x",
  });
  for (const target of [80_000, 250_000, 700_000, 1_200_000]) {
    const r = await fitToTarget(noisy, target, { width: 3000, height: 2000 });
    if (r.ok) assert.ok(r.size <= target);
  }
});

test("скасування між ітераціями: AbortError і подальші кодування не виконуються", async () => {
  const controller = new AbortController();
  let calls = 0;
  const encode = async () => {
    calls += 1;
    if (calls === 2) controller.abort(); // скасували посеред пошуку
    return { size: 10_000_000, data: "x" };
  };
  await assert.rejects(
    fitToTarget(encode, 1000, { width: 4000, height: 3000, signal: controller.signal }),
    (error) => error.name === "AbortError"
  );
  assert.equal(calls, 2);
});

test("вже скасований сигнал: жодного кодування", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(
    fitToTarget(async () => { calls += 1; return { size: 1, data: "x" }; }, 1000, {
      width: 100, height: 100, signal: controller.signal,
    }),
    { name: "AbortError" }
  );
  assert.equal(calls, 0);
});

test("некоректні вхідні дані", async () => {
  const encode = makeEncoder();
  await assert.rejects(fitToTarget(encode, 0, { width: 10, height: 10 }), RangeError);
  await assert.rejects(fitToTarget(encode, 1000, { width: 0, height: 10 }), RangeError);
});

test("onProgress: викликається на кожне кодування з поточними якістю/розмірами", async () => {
  const seen = [];
  await fitToTarget(makeEncoder(2_000_000), 400_000, {
    width: 2000,
    height: 1500,
    onProgress: (p) => seen.push(p),
  });
  assert.ok(seen.length >= 3);
  assert.deepEqual(seen.map((p) => p.iteration), seen.map((_, i) => i + 1));
  assert.ok(seen.every((p) => p.targetBytes === 400_000 && p.width === 2000));
});
