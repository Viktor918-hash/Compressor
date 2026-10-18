// Копіює ядро FFmpeg.wasm (@ffmpeg/core, однопотокове ESM) з node_modules у
// public/ffmpeg/<версія>/ — щоб «Відео в MP3» і «Обрізати відео» працювали
// з ВЛАСНОГО домену, без стороннього CDN (round 36, як і Tesseract для OCR).
// Шлях з версією: файл кешується браузером назавжди (vercel.json), а при
// оновленні пакета зміниться й адреса.
//
// Запускається автоматично перед `npm run dev` і `npm run build`.
// Результат у .gitignore: це артефакт збірки (~32 МБ), а не код.
//
// Ліцензія ядра — GPL-2.0-or-later (містить x264, LAME). Ми поширюємо його
// без змін; поруч кладемо README з ліцензією й посиланням на сирці.
import { cpSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const coreDir = join(root, "node_modules", "@ffmpeg", "core");
const pkgPath = join(coreDir, "package.json");

if (!existsSync(pkgPath)) {
  console.error("copy-ffmpeg-assets: не знайдено @ffmpeg/core (виконайте npm install)");
  process.exit(1);
}

const { version, license } = JSON.parse(readFileSync(pkgPath, "utf8"));
const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];
const outRoot = join(root, "public", "ffmpeg");
const out = join(outRoot, version);

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of files) cpSync(join(coreDir, "dist", "esm", f), join(out, f));

writeFileSync(
  join(out, "README.txt"),
  [
    `FFmpeg.wasm core ${version} (@ffmpeg/core), unmodified.`,
    `License: ${license}. Includes FFmpeg, x264 and LAME.`,
    `Source code: https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v${version}`,
    "Package: https://www.npmjs.com/package/@ffmpeg/core/v/" + version,
    "FFmpeg: https://ffmpeg.org/legal.html",
    "",
  ].join("\n")
);

console.log(`copy-ffmpeg-assets: @ffmpeg/core ${version} → public/ffmpeg/${version}/`);
