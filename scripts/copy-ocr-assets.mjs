// Копіює файли Tesseract (воркер, ядро WASM, мовні моделі) з node_modules у
// public/tesseract/ — щоб OCR працював зі ВЛАСНОГО домену, а не з
// cdn.jsdelivr.net (без сторонніх запитів, без залежності від CDN, у
// корпоративних мережах і з блокувальниками реклами).
//
// Запускається автоматично перед `npm run dev` і `npm run build`.
// Результат у .gitignore: це артефакт збірки (≈21 МБ), а не код.
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = (...p) => join(root, "node_modules", ...p);
const out = join(root, "public", "tesseract");

// Мови, які пропонує інтерфейс (див. OCR_LANGS у imageToText.js)
const LANGS = ["ukr", "rus", "spa", "eng"];
// Ядро: за замовчуванням tesseract.js працює в режимі LSTM_ONLY і сам
// обирає варіант за можливостями CPU (relaxed-SIMD → SIMD → без SIMD).
const CORES = [
  "tesseract-core-relaxedsimd-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-lstm.wasm.js",
];

const required = [
  nm("tesseract.js", "dist", "worker.min.js"),
  ...CORES.map((f) => nm("tesseract.js-core", f)),
  ...LANGS.map((l) =>
    nm("@tesseract.js-data", l, "4.0.0_best_int", `${l}.traineddata.gz`)
  ),
];
const missing = required.filter((p) => !existsSync(p));
if (missing.length) {
  console.error(
    "copy-ocr-assets: не знайдено файли (виконайте npm install):\n" +
      missing.map((p) => "  " + p).join("\n")
  );
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "core"), { recursive: true });
mkdirSync(join(out, "lang"), { recursive: true });

cpSync(nm("tesseract.js", "dist", "worker.min.js"), join(out, "worker.min.js"));
for (const f of CORES) cpSync(nm("tesseract.js-core", f), join(out, "core", f));
for (const l of LANGS) {
  cpSync(
    nm("@tesseract.js-data", l, "4.0.0_best_int", `${l}.traineddata.gz`),
    join(out, "lang", `${l}.traineddata.gz`)
  );
}
console.log(`copy-ocr-assets: ${required.length} файлів → public/tesseract/`);
