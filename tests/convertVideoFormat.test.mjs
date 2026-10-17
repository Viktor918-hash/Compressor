// Тести чистої логіки трьох конвертерів формату відео (раунд 24:
// MOV/MKV/WEBM → MP4) — matchesExpectedExt (чи відповідає визначене
// розширення сторінці) і getMp4OutputName (зміна розширення вихідного
// файлу). Увесь модуль videoFormatValidation.js без DOM/мережевих
// залежностей — той самий паттерн, що й
// CompressVideo/videoSizeTarget.js (tests/compressVideo.test.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import {
  matchesExpectedExt,
  getMp4OutputName,
} from "../src/components/ConvertVideoFormat/videoFormatValidation.js";

test("matchesExpectedExt: той самий формат → true", () => {
  assert.equal(matchesExpectedExt("mov", "mov"), true);
  assert.equal(matchesExpectedExt("mkv", "mkv"), true);
  assert.equal(matchesExpectedExt("webm", "webm"), true);
});

test("matchesExpectedExt: інший формат → false (сторінка 'mov to mp4' не приймає .mkv)", () => {
  assert.equal(matchesExpectedExt("mkv", "mov"), false);
  assert.equal(matchesExpectedExt("mp4", "webm"), false);
});

test("matchesExpectedExt: detectVideoExt не впізнав файл (null) → false", () => {
  assert.equal(matchesExpectedExt(null, "mov"), false);
});

test("getMp4OutputName: міняє будь-яке розширення на .mp4", () => {
  assert.equal(getMp4OutputName("clip.mov"), "clip.mp4");
  assert.equal(getMp4OutputName("movie.mkv"), "movie.mp4");
  assert.equal(getMp4OutputName("recording.webm"), "recording.mp4");
});

test("getMp4OutputName: ім'я з кількома крапками — відрізає лише останнє розширення", () => {
  assert.equal(getMp4OutputName("my.trip.2024.mov"), "my.trip.2024.mp4");
});

test("getMp4OutputName: ім'я без крапки — просто додає .mp4", () => {
  assert.equal(getMp4OutputName("clip"), "clip.mp4");
});
