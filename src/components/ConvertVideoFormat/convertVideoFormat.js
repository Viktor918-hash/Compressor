import {
  convertViaDirectUpload,
  emptyFileError,
  invalidFileTypeError,
} from "../../utils/directConvertApi";
import { detectVideoExt } from "../../utils/fileSignature";
import { matchesExpectedExt, getMp4OutputName } from "./videoFormatValidation";

export { getMp4OutputName };

// Прості конвертери формату відео (раунд 24: MOV/MKV/WEBM → MP4) — на
// відміну від CompressVideo (зміна роздільності під цільовий розмір
// файлу), тут немає жодної клієнтської математики щодо width/height:
// лише один convert-таск CloudConvert з тим самим підтвердженим
// video_codec: "x264" (api/_lib/cloudconvert.js::buildVideoConvertOptions(),
// викликається без аргументів — без width/height), а ціль —
// перекодувати контейнер/кодек у максимально сумісний MP4, а не
// зменшити розмір. Той самий P0-6 прямий upload/download, що й в усіх
// інших інструментів цієї групи.
//
// toolType — ключ у api/convert/init.js::TOOLS ("convert-mov-to-mp4" і
// т.д.); i18nKey — простір імен перекладів цієї сторінки
// (translation.json), окремий від toolType, бо toolType — kebab-case
// (ідентифікатор API), а ключі i18n — camelCase (convertMovToMp4.*).
export const createVideoFormatConverter = (toolType, expectedExt, i18nKey) => {
  const textKeys = {
    uploading: `${i18nKey}.uploading`,
    processing: `${i18nKey}.processing`,
    limit: `${i18nKey}.limit`,
    limit2: `${i18nKey}.limit2`,
  };

  return async (file, { signal, onProgress } = {}) => {
    if (!file.size) throw emptyFileError();

    const ext = detectVideoExt(file);
    // Fail fast на клієнті (без жодного запиту на сервер), якщо файл
    // явно не того формату, під який заточена ця сторінка — сервер усе
    // одно перевірить ще раз (api/convert/init.js::TOOLS[...].acceptedExt,
    // 415), але немає сенсу витрачати мережевий запит, коли це видно
    // одразу. dropzone-level accept (ConvertVideoFormat.jsx) уже
    // відфільтровує більшість випадків у UI — це другий, незалежний
    // запобіжник.
    if (!matchesExpectedExt(ext, expectedExt)) throw invalidFileTypeError();

    return convertViaDirectUpload(toolType, file, ext, {
      signal,
      onProgress,
      textKeys,
    });
  };
};
