// Чиста логіка (без DOM/мережевих залежностей) для трьох вузьких
// SEO-сторінок конвертації формату відео (раунд 24: /convert-mov-to-mp4,
// /convert-mkv-to-mp4, /convert-webm-to-mp4) — той самий паттерн, що й
// CompressVideo/videoSizeTarget.js: винесено в окремий файл без жодних
// імпортів, щоб тести могли імпортувати його напряму під plain
// `node --test` (convertVideoFormat.js нижче транзитивно імпортує
// utils/directConvertApi.js → i18n/supabase, що плям-Node не резолвить
// без бандлера — див. claude/compressphoto-fixes-changes-round22.md,
// розділ про Node ESM extensionless-import).

/**
 * Чи відповідає визначене на клієнті розширення (detectVideoExt з
 * fileSignature.js) очікуваному для цієї конкретної сторінки.
 * Кожна з трьох сторінок навмисно приймає лише ОДИН вхідний формат —
 * сторінка "mov to mp4" не повинна мовчки конвертувати .mkv, навіть
 * якщо технічно могла б: назва сторінки й поведінка мають збігатись.
 * @param {string|null} detectedExt
 * @param {string} expectedExt
 * @returns {boolean}
 */
export const matchesExpectedExt = (detectedExt, expectedExt) =>
  detectedExt === expectedExt;

/**
 * Міняє будь-яке розширення імені файлу на .mp4 — усі три конвертери
 * цієї групи завжди повертають MP4 (той самий підхід, що
 * WordToPdf::getPdfOutputName / CompressVideo::getCompressedVideoName).
 * @param {string} originalName
 * @returns {string}
 */
export const getMp4OutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.mp4`;
};
