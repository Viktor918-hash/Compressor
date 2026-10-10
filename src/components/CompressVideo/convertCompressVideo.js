import {
  convertViaDirectUpload,
  emptyFileError,
  invalidFileTypeError,
} from "../../utils/directConvertApi";
import { detectVideoExt } from "../../utils/fileSignature";
import { getVideoMeta, scaleToHeight } from "../../utils/videoMeta";

// Відео йде через CloudConvert так само, як Word/PDF (P0-6: прямий
// upload/download, наша функція не бачить байти файлу) — єдина різниця:
// convert-таск отримує width/height (api/_lib/cloudconvert.js), рахований
// тут, на клієнті, з реальних розмірів відео.
const TEXT_KEYS = {
  uploading: "compressVideo.uploading",
  processing: "compressVideo.processing",
  limit: "compressVideo.limit",
  limit2: "compressVideo.limit2",
};

// "Рекомендовано" — завжди безпечний дефолт: не більше 720p. Для
// більшості відео з телефону (1080p/4K) це дає помітне стиснення; для
// відео, що вже ≤720p, висота не змінюється (стиснення тоді дає лише
// перекодування в x264 з бітрейтом, який CloudConvert підбирає сам).
const RECOMMENDED_MAX_HEIGHT = 720;

// Інформація "було → стало" для resultNote у CompressVideo.jsx. Blob із
// fetch() — звичайний об'єкт, тож можна прив'язати метадані через
// WeakMap без зміни самого Blob (той самий трюк, що й
// CompressToSize/compressToSize.js::fitInfoOf).
const infoByBlob = new WeakMap();
export const videoInfoOf = (blob) => infoByBlob.get(blob);

/**
 * @param {File} file
 * @param {{signal?, onProgress?, mode: "recommended"|"1080"|"720"|"480"|"360"}} opts
 * @returns {Promise<Blob>}
 */
export const compressVideo = async (file, { signal, onProgress, mode = "recommended" } = {}) => {
  if (!file.size) throw emptyFileError();

  const ext = detectVideoExt(file);
  if (!ext) throw invalidFileTypeError();

  onProgress?.({ value: null, text: null });
  const meta = await getVideoMeta(file);

  let resolution;
  let info = null;
  if (meta) {
    const targetHeight = mode === "recommended" ? RECOMMENDED_MAX_HEIGHT : Number(mode);
    const { width, height } = scaleToHeight(meta.width, meta.height, targetHeight);
    // Не шлемо width/height, якщо результат і так рівний оригіналу —
    // нема сенсу просити CloudConvert масштабувати в ту саму роздільність.
    if (width !== meta.width || height !== meta.height) {
      resolution = { width, height };
    }
    info = {
      sourceWidth: meta.width,
      sourceHeight: meta.height,
      width: resolution?.width ?? meta.width,
      height: resolution?.height ?? meta.height,
      duration: meta.duration,
    };
  }

  const blob = await convertViaDirectUpload("compress-video", file, ext, {
    signal,
    onProgress,
    textKeys: TEXT_KEYS,
    extraPayload: resolution ? { resolution } : undefined,
  });

  if (info) infoByBlob.set(blob, info);
  return blob;
};

export const getCompressedVideoName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}-compressed.mp4`;
};
