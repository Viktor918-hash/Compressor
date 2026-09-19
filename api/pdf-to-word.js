import { createConvertHandler, detectPdfExt } from "./_lib/convertHandler.js";
import { convertPdfToDocx } from "./_lib/cloudconvert.js";

export default createConvertHandler({
  name: "pdf-to-word",
  detectExt: detectPdfExt,
  fallbackBase: "document",
  convert: convertPdfToDocx,
  contentType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
});
