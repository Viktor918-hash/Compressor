import {
  convertViaDirectUpload,
  emptyFileError,
  invalidFileTypeError,
} from "../../utils/directConvertApi";
import { detectDocumentExt } from "../../utils/fileSignature";

// PDF-документи не можна коректно конвертувати в редаговане Word прямо в
// браузері (немає рушія розпізнавання макету/тексту), тому файл іде через
// CloudConvert. З P0-6 (раунд 20) це прямий upload/download — перевірка
// типу за сигнатурою робиться на клієнті, ДО запиту (сервер більше не
// бачить байти файлу, щоб перевірити самостійно).
export const convertPdfToWord = async (file, { signal, onProgress } = {}) => {
  if (!file.size) throw emptyFileError();

  const ext = await detectDocumentExt(file);
  if (ext !== "pdf") throw invalidFileTypeError();

  return convertViaDirectUpload("pdf-to-word", file, ext, { signal, onProgress });
};

// Міняє будь-яке розширення (.pdf) на .docx
export const getDocxOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.docx`;
};
