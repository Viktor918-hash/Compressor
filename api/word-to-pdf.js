import { createConvertHandler, detectWordExt } from "./_lib/convertHandler.js";
import { convertDocxToPdf } from "./_lib/cloudconvert.js";

export default createConvertHandler({
  name: "word-to-pdf",
  detectExt: detectWordExt,
  fallbackBase: "document",
  convert: convertDocxToPdf,
  contentType: "application/pdf",
});
