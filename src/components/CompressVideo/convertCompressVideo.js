import {
  convertViaDirectUpload,
  emptyFileError,
  invalidFileTypeError,
} from "../../utils/directConvertApi";
import { detectVideoExt } from "../../utils/fileSignature";
import { getVideoMeta, scaleToHeight } from "../../utils/videoMeta";
import {
  RECOMMENDED_MAX_HEIGHT,
  estimateHeightForTarget,
  toVideoBytes,
  validateCustomTarget,
} from "./videoSizeTarget";

// Відео йде через CloudConvert так само, як Word/PDF (P0-6: прямий
// upload/download, наша функція не бачить байти файлу) — єдина різниця:
// convert-таск отримує width/height, рахований тут на клієнті (чиста
// математика — у videoSizeTarget.js, легко тестується без DOM).
export { toVideoBytes };

const TEXT_KEYS = {
  uploading: "compressVideo.uploading",
  processing: "compressVideo.processing",
  limit: "compressVideo.limit",
  limit2: "compressVideo.limit2",
};

// Інформація "було → стало" (+ ціль у МБ для режиму "Свій розмір") для
// resultNote у CompressVideo.jsx. Blob із fetch() — звичайний об'єкт,
// тож можна прив'язати метадані через WeakMap без зміни самого Blob
// (той самий трюк, що й CompressToSize/compressToSize.js::fitInfoOf).
const infoByBlob = new WeakMap();
export const videoInfoOf = (blob) => infoByBlob.get(blob);

/**
 * @param {File} file
 * @param {{signal?, onProgress?, mode: "recommended"|"custom", targetBytes?: number}} opts
 *   targetBytes — лише для mode === "custom" (уже переведений у байти
 *   сторінкою: CompressVideo.jsx через toVideoBytes). Якщо
 *   targetBytes >= file.size або не є коректним додатнім числом — кидає
 *   помилку з кодом "TARGET_TOO_LARGE" | "BAD_TARGET"
 *   (videoSizeTarget.js::validateCustomTarget) — сторінка перекладає
 *   її в текст для користувача (той самий паттерн, що й
 *   CompressToSize.jsx::processFile).
 * @returns {Promise<Blob>}
 */
export const compressVideo = async (
  file,
  { signal, onProgress, mode = "recommended", targetBytes } = {}
) => {
  if (!file.size) throw emptyFileError();

  const ext = detectVideoExt(file);
  if (!ext) throw invalidFileTypeError();

  if (mode === "custom") {
    const targetError = validateCustomTarget(targetBytes, file.size);
    if (targetError) throw targetError;
  }

  onProgress?.({ value: null, text: null });
  const meta = await getVideoMeta(file);

  let resolution;
  let info = null;
  if (meta) {
    const targetHeight =
      mode === "custom"
        ? estimateHeightForTarget(meta, file.size, targetBytes)
        : RECOMMENDED_MAX_HEIGHT;
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
      targetBytes: mode === "custom" ? targetBytes : undefined,
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
