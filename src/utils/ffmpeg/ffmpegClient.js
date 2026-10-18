// FFmpeg.wasm у браузері (round 36): «Відео в MP3» і «Обрізати відео».
//
// • Однопотокове ядро @ffmpeg/core — не потребує SharedArrayBuffer, тобто
//   заголовків COOP/COEP, які зламали б Google-вхід і аналітику
//   (див. Roadmap, розділ 4).
// • Ядро (~32 МБ WASM) лежить на нашому ж домені: scripts/copy-ffmpeg-assets.mjs
//   копіює його з node_modules у public/ffmpeg/<версія>/ під час збірки.
//   Шлях версійований, тож кешується назавжди (vercel.json).
// • Вхідний файл НЕ копіюється в пам'ять: монтуємо його через WORKERFS,
//   ffmpeg читає шматками прямо з File. У пам'яті лише результат.
// • Скасування: exec не вміє зупинитись посередині, тому на abort просто
//   завершуємо воркер і наступного разу створюємо новий.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { parseFfmpegTime, parseDuration } from "./ffmpegArgs.js";

export const FFMPEG_CORE_VERSION = "0.12.10";
export const FFMPEG_BASE = `/ffmpeg/${FFMPEG_CORE_VERSION}`;
// Розмір ffmpeg-core.wasm 0.12.10 після розпакування — для відсотка
// завантаження (Vercel віддає файл стисненим, тож Content-Length інший).
const CORE_WASM_BYTES = 32_232_419;
const INPUT_DIR = "/input";

let ffmpeg = null;
let loadPromise = null;
let chain = Promise.resolve(); // задачі виконуються по одній

const abortError = () => new DOMException("Aborted", "AbortError");

export function resetFFmpeg() {
  try {
    ffmpeg?.terminate();
  } catch {
    /* вже завершено */
  }
  ffmpeg = null;
  loadPromise = null;
}

async function fetchWasm(onProgress, signal) {
  const res = await fetch(`${FFMPEG_BASE}/ffmpeg-core.wasm`, { signal });
  if (!res.ok || !res.body) throw new Error(`ffmpeg-core.wasm: HTTP ${res.status}`);
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(Math.min(0.99, loaded / CORE_WASM_BYTES));
  }
  return URL.createObjectURL(new Blob(chunks, { type: "application/wasm" }));
}

/** Завантажує ядро один раз; onProgress(0…1) — для «Завантаження рушія» */
export function loadFFmpeg({ onProgress, signal } = {}) {
  if (ffmpeg?.loaded) return Promise.resolve(ffmpeg);
  if (!loadPromise) {
    loadPromise = (async () => {
      const instance = new FFmpeg();
      const wasmURL = await fetchWasm(onProgress, signal);
      try {
        await instance.load({
          coreURL: `${window.location.origin}${FFMPEG_BASE}/ffmpeg-core.js`,
          wasmURL,
        });
      } finally {
        URL.revokeObjectURL(wasmURL);
      }
      ffmpeg = instance;
      return instance;
    })().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

const safeInputName = (file) => {
  // WORKERFS показує файл під його власним ім'ям; лишаємо лише безпечні
  // символи й розширення, щоб аргументи ffmpeg не плутались
  const ext = (/\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1] || "bin").toLowerCase();
  return `source.${ext}`;
};

/**
 * Виконує одну задачу ffmpeg над файлом.
 * buildArgs(inputPath) → string[] (вихідний файл — outputName у корені FS).
 * duration (с) — для відсотка; без нього відсоток береться з логу.
 * Повертає { data: Uint8Array, logs: string[] }.
 */
export function runFFmpeg(file, { buildArgs, outputName, duration, signal, onLoadProgress, onProgress }) {
  const task = chain.then(async () => {
    if (signal?.aborted) throw abortError();
    const instance = await loadFFmpeg({ onProgress: onLoadProgress, signal });
    if (signal?.aborted) throw abortError();

    const logs = [];
    let total = duration > 0 ? duration : null;
    const onLog = ({ message }) => {
      logs.push(message);
      if (logs.length > 400) logs.shift();
      if (!total) {
        const d = parseDuration(message);
        if (d) total = d;
      }
      const t = parseFfmpegTime(message);
      if (t !== null && total) onProgress?.(Math.max(0, Math.min(1, t / total)));
    };
    const onAbort = () => resetFFmpeg();
    signal?.addEventListener("abort", onAbort, { once: true });
    instance.on("log", onLog);

    // File у WORKERFS доступний лише під власним ім'ям, тож перейменовуємо
    // через новий File (дані не копіюються — це той самий Blob)
    const input = new File([file], safeInputName(file), { type: file.type });
    let mounted = false;
    try {
      await instance.createDir(INPUT_DIR).catch(() => {});
      await instance.mount("WORKERFS", { files: [input] }, INPUT_DIR);
      mounted = true;
      const code = await instance.exec(buildArgs(`${INPUT_DIR}/${input.name}`));
      if (signal?.aborted) throw abortError();
      if (code !== 0) {
        const error = new Error(`ffmpeg exited with ${code}`);
        error.ffmpegLogs = logs.slice();
        throw error;
      }
      const data = await instance.readFile(outputName);
      return { data, logs };
    } catch (error) {
      if (signal?.aborted) throw abortError();
      if (error && !error.ffmpegLogs) error.ffmpegLogs = logs.slice();
      throw error;
    } finally {
      signal?.removeEventListener("abort", onAbort);
      if (ffmpeg === instance) {
        instance.off("log", onLog);
        await instance.deleteFile(outputName).catch(() => {});
        if (mounted) await instance.unmount(INPUT_DIR).catch(() => {});
      }
    }
  });
  // наступна задача чекає на цю, навіть якщо вона впала
  chain = task.catch(() => {});
  return task;
}

/**
 * Тривалість (с) і чи є звук — через запуск ffmpeg без виходу (він пише
 * Duration і потоки в лог і завершується з помилкою — це очікувано).
 * Потрібно, коли браузер не вміє показати прев'ю (MKV, HEVC тощо).
 */
export async function probeMedia(file, { signal, onLoadProgress } = {}) {
  let logs = [];
  try {
    await runFFmpeg(file, {
      buildArgs: (input) => ["-hide_banner", "-i", input],
      outputName: "__probe_none__",
      signal,
      onLoadProgress,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    logs = error?.ffmpegLogs || [];
  }
  const text = logs.join("\n");
  return {
    duration: parseDuration(text),
    hasAudio: /Stream #\d+:\d+.*Audio:/.test(text),
    hasVideo: /Stream #\d+:\d+.*Video:/.test(text),
  };
}
