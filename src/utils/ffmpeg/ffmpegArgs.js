// Чиста логіка відеоінструментів (round 36) без залежностей від браузера:
// аргументи ffmpeg, розбір логу, формат часу, назви файлів, коди помилок.
// Покрито tests/videoTools.test.mjs.

export const MP3_BITRATES = [128, 192, 320];
export const DEFAULT_MP3_BITRATE = 192;

/** "time=00:01:02.50" у рядку прогресу ffmpeg → секунди (або null) */
export function parseFfmpegTime(line) {
  const m = /time=\s*(-?)(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(String(line));
  if (!m) return null;
  const sec = Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]);
  return m[1] === "-" ? 0 : sec;
}

/** "Duration: 00:01:02.50, start…" → секунди (або null; "N/A" → null) */
export function parseDuration(text) {
  const m = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(String(text));
  if (!m) return null;
  const sec = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return sec > 0 ? sec : null;
}

const fmtArgTime = (sec) => Math.max(0, sec).toFixed(3);

export const fileExt = (name) => (/\.([a-z0-9]{1,5})$/i.exec(String(name))?.[1] || "").toLowerCase();

const baseName = (name) => {
  const s = String(name);
  const dot = s.lastIndexOf(".");
  return dot > 0 ? s.slice(0, dot) : s;
};

/** Відео → MP3: лише перша звукова доріжка, CBR з обраним бітрейтом */
export function buildMp3Args(input, bitrateKbps = DEFAULT_MP3_BITRATE) {
  const kbps = MP3_BITRATES.includes(Number(bitrateKbps)) ? Number(bitrateKbps) : DEFAULT_MP3_BITRATE;
  return [
    "-hide_banner",
    "-i", input,
    "-map", "0:a:0",
    "-vn",
    "-c:a", "libmp3lame",
    "-b:a", `${kbps}k`,
    "-id3v2_version", "3",
    "output.mp3",
  ];
}

export const mp3OutputName = (name) => `${baseName(name)}.mp3`;

// Швидка обрізка лишає той самий контейнер, що й в оригіналу (кодеки
// копіюються як є, а не кожен контейнер приймає будь-який кодек: напр.
// звук AMR з 3GP не влазить у MP4). Невідоме розширення — MP4.
const COPY_CONTAINERS = ["mp4", "mov", "m4v", "webm", "mkv", "avi", "3gp"];

/** Розширення результату обрізки */
export function trimOutputExt(name, precise) {
  if (precise) return "mp4";
  const ext = fileExt(name);
  return COPY_CONTAINERS.includes(ext) ? ext : "mp4";
}

export const trimOutputName = (name, precise) =>
  `${baseName(name)}-trimmed.${trimOutputExt(name, precise)}`;

/**
 * Обрізка: швидко (без перекодування, різ по найближчому ключовому кадру)
 * або точно (перекодування в H.264/AAC MP4 — повільніше).
 */
export function buildTrimArgs(input, { start, end, precise = false, name = input }) {
  const from = Math.max(0, Number(start) || 0);
  const duration = Math.max(0.1, Number(end) - from);
  const ext = trimOutputExt(name, precise);
  const out = `output.${ext}`;
  const common = [
    "-hide_banner",
    "-ss", fmtArgTime(from),
    "-i", input,
    "-t", fmtArgTime(duration),
    "-map", "0:v:0?",
    "-map", "0:a:0?",
  ];
  const faststart = ext === "mp4" || ext === "mov" || ext === "m4v" ? ["-movflags", "+faststart"] : [];
  if (!precise) {
    return [...common, "-c", "copy", "-avoid_negative_ts", "make_zero", ...faststart, out];
  }
  return [
    ...common,
    // H.264 з yuv420p вимагає парних ширини й висоти
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "160k",
    ...faststart,
    out,
  ];
}

export const trimOutputFile = (name, precise) => `output.${trimOutputExt(name, precise)}`;

/** Тип результату для Blob */
export const mimeForExt = (ext) =>
  ({
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    "3gp": "video/3gpp",
  })[ext] || "application/octet-stream";

/** Код помилки за логом ffmpeg — для зрозумілого повідомлення */
export function classifyFfmpegError(logs = []) {
  const text = logs.join("\n");
  if (/matches no streams|does not contain any stream|Output file .* does not contain any stream/i.test(text)) {
    return "NO_AUDIO";
  }
  if (/Cannot enlarge memory|out of memory|OOM|memory access out of bounds/i.test(text)) return "MEMORY";
  if (/Invalid data found|moov atom not found|could not find codec parameters|EBML header parsing failed/i.test(text)) {
    return "INVALID";
  }
  return "UNKNOWN";
}

/** 65.25 → "1:05.3"; 3725 → "1:02:05.0" */
export function formatClock(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const tenths = Math.round(s * 10);
  const h = Math.floor(tenths / 36000);
  const m = Math.floor((tenths % 36000) / 600);
  const rest = (tenths % 600) / 10;
  const ss = rest.toFixed(1).padStart(4, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1:05.3", "65.3", "1:02:05" → секунди; некоректне → null */
export function parseClock(text) {
  const s = String(text).trim().replace(",", ".");
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(s)) return null;
  const parts = s.split(":").map(Number);
  if (parts.slice(1).some((p) => p >= 60)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** Межі фрагмента: 0 ≤ start < end ≤ duration, мінімум 0,1 с */
export function clampRange(start, end, duration) {
  const d = Math.max(0, Number(duration) || 0);
  let s = Math.min(Math.max(0, Number(start) || 0), d);
  let e = Math.min(Math.max(0, Number(end) || 0), d);
  if (e - s < 0.1) {
    if (s + 0.1 <= d) e = s + 0.1;
    else s = Math.max(0, e - 0.1);
  }
  return { start: Math.round(s * 10) / 10, end: Math.round(e * 10) / 10 };
}
