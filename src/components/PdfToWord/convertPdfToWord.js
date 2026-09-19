import { postFileToConvertApi } from "../../utils/convertApi";

// PDF-документи не можна коректно конвертувати в редаговане Word прямо в
// браузері (немає рушія розпізнавання макету/тексту), тому файл
// відправляється на наш серверний проксі /api/pdf-to-word, який вже сам
// звертається до CloudConvert і повертає готовий DOCX. Ключ CloudConvert
// живе тільки на сервері.
export const convertPdfToWord = (file) =>
  postFileToConvertApi("/api/pdf-to-word", file, "application/pdf");

// Міняє будь-яке розширення (.pdf) на .docx
export const getDocxOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.docx`;
};
