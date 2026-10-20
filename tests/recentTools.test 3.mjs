// round 34: "Ваші інструменти" — чиста логіка
import test from "node:test";
import assert from "node:assert/strict";
import { pushRecent, pickRecent, settingsSummary, isOwnStorageKey } from "../src/utils/recentTools.js";

const t = (key, opts = {}) => `${key}${Object.keys(opts).length ? JSON.stringify(opts) : ""}`;
const store = (obj) => (key) => (key in obj ? obj[key] : null);

test("pushRecent: на початок, без дублів, не більше max", () => {
  assert.deepEqual(pushRecent(["a", "b", "c"], "b"), ["b", "a", "c"]);
  assert.deepEqual(pushRecent(["a", "b", "c"], "d", 3), ["d", "a", "b"]);
  assert.deepEqual(pushRecent("garbage", "x"), ["x"]);
});

test("pickRecent: без home, лише відомі, до 3", () => {
  const list = ["home", "webp", "ghost", "resize", "cropImage", "removeBg"];
  assert.deepEqual(pickRecent(list, { exclude: ["home"], limit: 3, known: ["webp", "resize", "cropImage", "removeBg"] }), ["webp", "resize", "cropImage"]);
  assert.deepEqual(pickRecent(null), []);
});

test("settingsSummary: стиснення — якість і розмір", () => {
  const get = store({ cp_settings_compress: '{"quality":65,"keepSize":false,"maxSide":1280}' });
  assert.equal(settingsSummary("home", get, t), 'recentTools.quality{"value":65} · recentTools.maxSide{"px":1280}');
  assert.equal(settingsSummary("home", store({}), t), null);
});

test("settingsSummary: стиснути до КБ — ціль і формат", () => {
  const get = store({
    "cp_settings_compressToSize.target": '{"value":"500","unit":"KB"}',
    "cp_settings_compressToSize.format": '"webp"',
  });
  assert.equal(settingsSummary("compressToSize", get, t), 'recentTools.target{"value":"500","unit":"compressToSize.units.kb"} · WebP');
});

test("settingsSummary: фото в PDF, EXIF, OCR; інші інструменти — null", () => {
  assert.equal(
    settingsSummary("photoToPdf", store({ "cp_settings_photoToPdf.pageSize": '"photo"', "cp_settings_photoToPdf.margin": "10" }), t),
    'recentTools.pagePhoto · recentTools.margin{"mm":10}'
  );
  assert.equal(settingsSummary("removeExif", store({ "cp_settings_removeExif.reencode": "true" }), t), "recentTools.reencode");
  assert.equal(settingsSummary("imageToText", store({ cp_ocr_langs: '["ukr","eng"]' }), t), 'recentTools.ocrLangs{"langs":"UKR, ENG"}');
  assert.equal(settingsSummary("resize", store({}), t), null);
});

test("isOwnStorageKey: чистимо лише свої ключі", () => {
  assert.ok(isOwnStorageKey("cp_recent_tools"));
  assert.ok(isOwnStorageKey("cp_settings_compress"));
  assert.ok(isOwnStorageKey("cp_ocr_langs"));
  assert.equal(isOwnStorageKey("cp_consent"), false);
  assert.equal(isOwnStorageKey("sb-auth-token"), false);
});
