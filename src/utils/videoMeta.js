// Розміри й тривалість відео на клієнті — потрібні, щоб
// convertCompressVideo.js міг порахувати цільову висоту кадру (для
// "Рекомендовано" або оціненої під "Свій розмір" в МБ), завжди не більшу
// за оригінал (не апскейлимо), і ширину під неї зі збереженням пропорцій.
//
// Читається через офскрінний <video> елемент (без додавання в DOM) —
// найпростіший спосіб дістати videoWidth/videoHeight/duration без
// завантаження відео на сервер чи важких бібліотек на клієнті.
const METADATA_TIMEOUT_MS = 15_000;

/**
 * @param {File} file
 * @returns {Promise<{width: number, height: number, duration: number} | null>}
 *   null — якщо браузер не зміг прочитати метадані (пошкоджений файл,
 *   непідтримуваний кодек у <video> тощо); викликач показує UI без
 *   прив'язки до роздільності оригіналу (лише "Рекомендовано" без вибору).
 */
export function getVideoMeta(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load?.();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => finish(null), METADATA_TIMEOUT_MS);

    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight, duration } = video;
      if (!videoWidth || !videoHeight) {
        finish(null);
        return;
      }
      finish({
        width: videoWidth,
        height: videoHeight,
        duration: Number.isFinite(duration) ? duration : null,
      });
    };
    video.onerror = () => finish(null);
  });
}

// H264/x264 вимагає парних width/height — округлюємо до найближчого
// парного (завжди в менший бік, щоб не перевищити запитану висоту).
const toEven = (n) => Math.max(2, Math.floor(n / 2) * 2);

/**
 * Рахує {width, height} під цільову висоту зі збереженням пропорцій
 * оригіналу, обидва парні. targetHeight обрізається до sourceHeight
 * (не апскейлимо).
 */
export function scaleToHeight(sourceWidth, sourceHeight, targetHeight) {
  const height = Math.min(targetHeight, sourceHeight);
  const width = Math.round((sourceWidth * height) / sourceHeight);
  return { width: toEven(width), height: toEven(height) };
}
