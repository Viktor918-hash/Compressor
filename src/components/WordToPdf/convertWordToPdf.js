import {
  convertViaDirectUpload,
  emptyFileError,
  invalidFileTypeError,
} from "../../utils/directConvertApi";
import { detectDocumentExt } from "../../utils/fileSignature";

// Word-документи не можна конвертувати в PDF прямо в браузері (немає рушія
// верстки сторінок), тому файл іде через CloudConvert. З P0-6 (раунд 20)
// це прямий upload/download (api/convert/init.js + api/convert/status.js)
// — наша функція більше не бачить байти файлу, тож перевірка типу за
// сигнатурою робиться тут, на клієнті, ДО запиту (а не на сервері, як
// раніше в api/_lib/convertHandler.js).
export const convertWordToPdf = async (file, { signal, onProgress } = {}) => {
  if (!file.size) throw emptyFileError();

  const ext = await detectDocumentExt(file);
  if (ext !== "docx" && ext !== "doc") throw invalidFileTypeError();

  return convertViaDirectUpload("word-to-pdf", file, ext, { signal, onProgress });
};

// Міняє будь-яке розширення (.doc, .docx) на .pdf
export const getPdfOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.pdf`;
};
