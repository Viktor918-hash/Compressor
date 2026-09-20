import { postFileToConvertApi } from "../../utils/convertApi";

// Word-документи не можна конвертувати в PDF прямо в браузері (немає рушія
// верстки сторінок), тому файл відправляється на наш серверний проксі
// /api/word-to-pdf, який вже сам звертається до CloudConvert і повертає
// готовий PDF. Ключ CloudConvert живе тільки на сервері.
export const convertWordToPdf = (file, { signal } = {}) =>
  postFileToConvertApi("/api/word-to-pdf", file, "application/octet-stream", {
    signal,
  });

// Міняє будь-яке розширення (.doc, .docx) на .pdf
export const getPdfOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.pdf`;
};
