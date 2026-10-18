// Каталог інструментів для внутрішньої перелінковки (блок "Схожі
// інструменти", футер) та хлібних крихт (BreadcrumbList у SeoHead).
// slug збігається з routes.config.js / seoMeta.js / pageKey у SeoContent.
// nameKey/descKey — ключі перекладу (translation.json).
export const TOOLS = [
  { slug: "home", nameKey: "header.compress", descKey: "header.compressDesc" },
  {
    slug: "compressToSize",
    nameKey: "header.compressToSize",
    descKey: "header.compressToSizeDesc",
  },
  { slug: "convert", nameKey: "header.convert", descKey: "header.convertDesc" },
  {
    slug: "convertToPng",
    nameKey: "header.convertToPng",
    descKey: "header.convertToPngDesc",
  },
  {
    slug: "removeExif",
    nameKey: "header.removeExif",
    descKey: "header.removeExifDesc",
  },
  {
    slug: "photoToPdf",
    nameKey: "header.photoToPdf",
    descKey: "header.photoToPdfDesc",
  },
  { slug: "webp", nameKey: "header.webp", descKey: "header.webpDesc" },
  { slug: "resize", nameKey: "header.resize", descKey: "header.resizeDesc" },
  { slug: "presets", nameKey: "presets.navTitle", descKey: "header.prest" },
  {
    slug: "removeBg",
    nameKey: "header.removeBg",
    descKey: "header.removeBgDesc",
  },
  {
    slug: "wordToPdf",
    nameKey: "header.wordToPdf",
    descKey: "header.wordToPdfDesc",
  },
  {
    slug: "pdfToWord",
    nameKey: "header.pdfToWord",
    descKey: "header.pdfToWordDesc",
  },
  {
    slug: "imageToText",
    nameKey: "header.imageToText",
    descKey: "header.imageToTextDesc",
  },
  {
    slug: "cropImage",
    nameKey: "header.cropImage",
    descKey: "header.cropImageDesc",
  },
  {
    slug: "rotateImage",
    nameKey: "header.rotateImage",
    descKey: "header.rotateImageDesc",
  },
  {
    slug: "addWatermark",
    nameKey: "header.addWatermark",
    descKey: "header.addWatermarkDesc",
  },
  {
    slug: "blackAndWhite",
    nameKey: "header.blackAndWhite",
    descKey: "header.blackAndWhiteDesc",
  },
  {
    slug: "circleCrop",
    nameKey: "header.circleCrop",
    descKey: "header.circleCropDesc",
  },
  {
    slug: "compressVideo",
    nameKey: "header.compressVideo",
    descKey: "header.compressVideoDesc",
  },
  {
    slug: "convertMovToMp4",
    nameKey: "header.convertMovToMp4",
    descKey: "header.convertMovToMp4Desc",
  },
  {
    slug: "convertMkvToMp4",
    nameKey: "header.convertMkvToMp4",
    descKey: "header.convertMkvToMp4Desc",
  },
  {
    slug: "convertWebmToMp4",
    nameKey: "header.convertWebmToMp4",
    descKey: "header.convertWebmToMp4Desc",
  },
  // round 36: відео в браузері (FFmpeg.wasm)
  {
    slug: "trimVideo",
    nameKey: "header.trimVideo",
    descKey: "header.trimVideoDesc",
  },
  {
    slug: "videoToMp3",
    nameKey: "header.videoToMp3",
    descKey: "header.videoToMp3Desc",
  },
];

export const toolBySlug = (slug) => TOOLS.find((t) => t.slug === slug);

// Які інструменти доречно радити на сторінці кожного інструмента
// (за змістом: фото → фото, документи → документи).
export const RELATED = {
  home: ["convert", "webp", "resize", "removeBg", "compressToSize", "removeExif", "photoToPdf", "cropImage", "rotateImage", "addWatermark", "blackAndWhite", "circleCrop", "compressVideo", "convertMovToMp4", "convertMkvToMp4", "convertWebmToMp4", "trimVideo", "videoToMp3"],
  convert: ["webp", "home", "resize", "presets", "convertToPng"],
  webp: ["convert", "home", "resize", "presets", "convertToPng"],
  resize: ["home", "convert", "webp", "presets", "compressToSize", "cropImage", "rotateImage"],
  presets: ["resize", "home", "removeBg", "convert", "compressToSize"],
  removeBg: ["presets", "resize", "home", "convert", "convertToPng"],
  wordToPdf: ["pdfToWord", "imageToText", "home"],
  pdfToWord: ["wordToPdf", "imageToText", "home"],
  imageToText: ["pdfToWord", "wordToPdf", "home", "resize"],
  compressToSize: ["home", "resize", "convert", "webp", "removeExif", "photoToPdf"],
  convertToPng: ["convert", "webp", "removeBg", "home", "removeExif", "photoToPdf"],
  removeExif: ["compressToSize", "resize", "convert", "home"],
  photoToPdf: ["compressToSize", "convertToPng", "removeExif", "wordToPdf", "home"],
  cropImage: ["resize", "rotateImage", "compressToSize", "convertToPng", "removeExif", "home"],
  rotateImage: ["cropImage", "addWatermark", "resize", "compressToSize", "convertToPng", "home"],
  addWatermark: ["rotateImage", "cropImage", "resize", "compressToSize", "home"],
  blackAndWhite: ["rotateImage", "cropImage", "addWatermark", "resize", "compressToSize", "home"],
  circleCrop: ["cropImage", "rotateImage", "addWatermark", "resize", "compressToSize", "home"],
  compressVideo: ["trimVideo", "videoToMp3", "convertMovToMp4", "convertMkvToMp4", "convertWebmToMp4", "home"],
  convertMovToMp4: ["compressVideo", "trimVideo", "convertMkvToMp4", "convertWebmToMp4", "videoToMp3"],
  convertMkvToMp4: ["convertMovToMp4", "compressVideo", "trimVideo", "convertWebmToMp4", "videoToMp3"],
  convertWebmToMp4: ["convertMovToMp4", "compressVideo", "trimVideo", "convertMkvToMp4", "videoToMp3"],
  // round 36: перший пункт — те, що найчастіше роблять далі з результатом
  trimVideo: ["compressVideo", "videoToMp3", "convertMovToMp4", "convertWebmToMp4"],
  videoToMp3: ["trimVideo", "compressVideo", "convertMovToMp4", "convertMkvToMp4"],
};

// Тільки для e2e-збірки (VITE_E2E_STUB=1): заглушка з підмножиною мов, щоб
// перевірити, що Footer / "Схожі інструменти" не показують її там, де її
// немає (ru/es). У звичайній збірці цей блок статично відкидається.
if (import.meta.env.VITE_E2E_STUB === "1") {
  TOOLS.push({
    slug: "e2eMerge",
    nameKey: "e2e.mergeStub",
    descKey: "e2e.mergeStubDesc",
  });
  RELATED.resize = [...RELATED.resize, "e2eMerge"];
}
