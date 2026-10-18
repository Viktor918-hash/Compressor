// round 36: «Відео в MP3» і «Обрізати відео» — чиста логіка (src/utils/ffmpeg/ffmpegArgs.js)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildMp3Args,
  buildTrimArgs,
  clampRange,
  classifyFfmpegError,
  formatClock,
  mimeForExt,
  mp3OutputName,
  parseClock,
  parseDuration,
  parseFfmpegTime,
  trimOutputName,
} from "../src/utils/ffmpeg/ffmpegArgs.js";

test("розбір логу ffmpeg: Duration і time=", () => {
  assert.equal(parseDuration("  Duration: 00:01:02.50, start: 0.000000, bitrate: 2858 kb/s"), 62.5);
  assert.equal(parseDuration("Duration: N/A, bitrate: N/A"), null);
  assert.equal(parseFfmpegTime("size=  512kB time=00:00:12.34 bitrate= 339.9kbits/s speed=24x"), 12.34);
  assert.equal(parseFfmpegTime("time=-00:00:00.02 bitrate=N/A"), 0);
  assert.equal(parseFfmpegTime("frame=1"), null);
});

test("MP3: перша звукова доріжка, бітрейт лише з дозволених", () => {
  const args = buildMp3Args("/input/source.mp4", 320);
  assert.deepEqual(args.slice(args.indexOf("-map"), args.indexOf("-map") + 2), ["-map", "0:a:0"]);
  assert.ok(args.includes("-vn"));
  assert.equal(args[args.indexOf("-b:a") + 1], "320k");
  assert.equal(args.at(-1), "output.mp3");
  assert.equal(buildMp3Args("x", 999)[buildMp3Args("x", 999).indexOf("-b:a") + 1], "192k");
  assert.equal(mp3OutputName("Відпустка 2026.MOV"), "Відпустка 2026.mp3");
  assert.equal(mp3OutputName("clip"), "clip.mp3");
});

test("обрізка: швидко — копіювання в той самий контейнер; точно — H.264 MP4", () => {
  const fast = buildTrimArgs("/input/source.mov", { start: 12.5, end: 65, name: "a.mov" });
  assert.deepEqual(fast.slice(1, 5), ["-ss", "12.500", "-i", "/input/source.mov"]);
  assert.equal(fast[fast.indexOf("-t") + 1], "52.500");
  assert.deepEqual(fast.slice(fast.indexOf("-c"), fast.indexOf("-c") + 2), ["-c", "copy"]);
  assert.equal(fast.at(-1), "output.mov");
  assert.ok(fast.includes("+faststart"));

  const webm = buildTrimArgs("/input/source.webm", { start: 0, end: 5, name: "a.webm" });
  assert.equal(webm.at(-1), "output.webm");
  assert.ok(!webm.includes("+faststart"));

  const precise = buildTrimArgs("/input/source.webm", { start: 1, end: 3, precise: true, name: "a.webm" });
  assert.equal(precise[precise.indexOf("-c:v") + 1], "libx264");
  assert.equal(precise[precise.indexOf("-c:a") + 1], "aac");
  assert.equal(precise.at(-1), "output.mp4");

  assert.equal(trimOutputName("Зустріч.mkv", false), "Зустріч-trimmed.mkv");
  assert.equal(trimOutputName("Зустріч.mkv", true), "Зустріч-trimmed.mp4");
  assert.equal(trimOutputName("video.xyz", false), "video-trimmed.mp4");
  assert.equal(mimeForExt("mov"), "video/quicktime");
  assert.equal(mimeForExt("mp3"), "audio/mpeg");
});

test("час: формат і розбір, межі фрагмента", () => {
  assert.equal(formatClock(65.25), "1:05.3");
  assert.equal(formatClock(3725), "1:02:05.0");
  assert.equal(formatClock(0), "0:00.0");
  assert.equal(parseClock("1:05.5"), 65.5);
  assert.equal(parseClock("65,5"), 65.5);
  assert.equal(parseClock("1:02:05"), 3725);
  assert.equal(parseClock("1:75"), null);
  assert.equal(parseClock("abc"), null);
  assert.deepEqual(clampRange(-3, 500, 120), { start: 0, end: 120 });
  assert.deepEqual(clampRange(50, 50, 120), { start: 50, end: 50.1 });
  assert.deepEqual(clampRange(120, 120, 120), { start: 119.9, end: 120 });
});

test("помилки ffmpeg → зрозумілі коди", () => {
  assert.equal(classifyFfmpegError(["Stream map '0:a:0' matches no streams."]), "NO_AUDIO");
  assert.equal(classifyFfmpegError(["/input/x.mp4: Invalid data found when processing input"]), "INVALID");
  assert.equal(classifyFfmpegError(["Aborted(Cannot enlarge memory arrays)"]), "MEMORY");
  assert.equal(classifyFfmpegError(["something else"]), "UNKNOWN");
});

test("версія ядра FFmpeg у коді = версія @ffmpeg/core у package.json", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const client = readFileSync("src/utils/ffmpeg/ffmpegClient.js", "utf8");
  const version = /FFMPEG_CORE_VERSION = "([\d.]+)"/.exec(client)[1];
  assert.equal(pkg.dependencies["@ffmpeg/core"].replace(/^[\^~]/, ""), version);
  // однопотокове ядро: жодних COOP/COEP, які зламали б вхід через Google й аналітику
  const vercel = readFileSync("vercel.json", "utf8");
  assert.ok(!/Cross-Origin-Embedder-Policy/.test(vercel));
});
