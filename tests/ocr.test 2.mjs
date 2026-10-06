// Постобробка OCR: гомогліфи й очищення тексту (src/components/ImageToText/ocrText.js)
import test from "node:test";
import assert from "node:assert/strict";
import { fixCyrillicLatinConfusion, cleanOcrText } from "../src/components/ImageToText/ocrText.js";

test("латинські слова в кириличному рядку не чіпаються (email, бренди, URL)", () => {
  const line = "Напишіть нам на support@gmail.com або в Telegram чи Chrome";
  assert.equal(fixCyrillicLatinConfusion(line, "ukr"), line);
});

test("слово змішаного алфавіту виправляється на кирилицю", () => {
  // "Привiт" де "i" — латинська (гомогліф), решта — кирилиця
  assert.equal(fixCyrillicLatinConfusion("Ми говоримо Привiт світ сьогодні", "ukr"), "Ми говоримо Привіт світ сьогодні");
});

test("англійська й іспанська мови не змінюються", () => {
  const s = "Hello world, this is a test";
  assert.equal(fixCyrillicLatinConfusion(s, "eng"), s);
  assert.equal(fixCyrillicLatinConfusion(s, "spa"), s);
});

test("абревіатури (PDF, USB) не чіпаються", () => {
  const s = "Збережіть файл у форматі PDF або USB накопичувач";
  assert.equal(fixCyrillicLatinConfusion(s, "ukr"), s);
});

test("cleanOcrText: пробіли й порожні рядки", () => {
  assert.equal(cleanOcrText("a   b \n\n\n\nc\t d  \n"), "a b\n\nc d");
});
