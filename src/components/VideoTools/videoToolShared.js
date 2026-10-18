// Спільне для відеоінструментів у браузері (round 36).
import { userError } from "../../utils/userError";
import { classifyFfmpegError } from "../../utils/ffmpeg/ffmpegArgs";

// Файл не вивантажується й не копіюється в пам'ять (WORKERFS читає його
// шматками), тож ліміт значно більший за серверні 200 МБ. Обмежує
// переважно результат обрізки, який живе в пам'яті вкладки.
export const VIDEO_MAX_FILE_SIZE = 1000 * 1024 * 1024;

export const VIDEO_ACCEPT = {
  "video/mp4": [".mp4", ".m4v"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
  "video/x-matroska": [".mkv"],
  "video/x-msvideo": [".avi"],
  "video/avi": [".avi"],
  "video/3gpp": [".3gp"],
  // деякі браузери (особливо мобільні) не повідомляють MIME для .mov/.mkv
  "": [".mp4", ".m4v", ".mov", ".webm", ".mkv", ".avi", ".3gp"],
};

/**
 * Помилка ffmpeg → повідомлення для користувача (Panel показує лише
 * userFacing-помилки). keys.noAudio — ключ саме цього інструмента.
 */
export function toUserError(error, t, keys = {}) {
  if (error?.name === "AbortError" || error?.userFacing) return error;
  const code = error?.ffmpegLogs ? classifyFfmpegError(error.ffmpegLogs) : "ENGINE";
  if (code === "NO_AUDIO" && keys.noAudio) return userError(t(keys.noAudio));
  if (code === "MEMORY") return userError(t("videoTools.errors.memory"));
  if (code === "INVALID") return userError(t("videoTools.errors.invalid"));
  if (code === "ENGINE") return userError(t("videoTools.errors.engine"));
  return userError(t("videoTools.errors.generic"));
}
