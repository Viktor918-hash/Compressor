// round 33: розбір збережених налаштувань (usePersistentState)
import test from "node:test";
import assert from "node:assert/strict";
import { parseStored } from "../src/utils/persist.js";

test("parseStored: порожнє/битий JSON → fallback", () => {
  assert.equal(parseStored(null, 5), 5);
  assert.equal(parseStored("", 5), 5);
  assert.equal(parseStored("{oops", 5), 5);
});

test("parseStored: примітиви — тип має збігатися з fallback", () => {
  assert.equal(parseStored("true", false), true);
  assert.equal(parseStored('"webp"', "jpeg"), "webp");
  assert.equal(parseStored('"webp"', 0), 0);
});

test("parseStored: об'єкт підмішує нові поля з fallback", () => {
  const fallback = { quality: 80, keepSize: true, maxSide: 1920 };
  assert.deepEqual(parseStored('{"quality":60}', fallback), { quality: 60, keepSize: true, maxSide: 1920 });
});

test("parseStored: validate відкидає значення поза межами UI", () => {
  const ok = (v) => v === "jpeg" || v === "webp";
  assert.equal(parseStored('"avif"', "jpeg", ok), "jpeg");
  assert.equal(parseStored('"webp"', "jpeg", ok), "webp");
  const range = (o) => o.quality >= 40 && o.quality <= 95;
  assert.deepEqual(parseStored('{"quality":5}', { quality: 80 }, range), { quality: 80 });
});

test("parseStored: validate, що кидає виняток, теж → fallback", () => {
  assert.equal(parseStored('"x"', "a", () => { throw new Error("boom"); }), "a");
});
