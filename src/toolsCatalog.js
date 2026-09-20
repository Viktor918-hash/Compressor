// Каталог інструментів для внутрішньої перелінковки (блок "Схожі
// інструменти", футер) та хлібних крихт (BreadcrumbList у SeoHead).
// slug збігається з routes.config.js / seoMeta.js / pageKey у SeoContent.
// nameKey/descKey — ключі перекладу (translation.json).
export const TOOLS = [
  { slug: "home", nameKey: "header.compress", descKey: "header.compressDesc" },
  { slug: "convert", nameKey: "header.convert", descKey: "header.convertDesc" },
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
];

export const toolBySlug = (slug) => TOOLS.find((t) => t.slug === slug);

// Які інструменти доречно радити на сторінці кожного інструмента
// (за змістом: фото → фото, документи → документи).
export const RELATED = {
  home: ["convert", "webp", "resize", "removeBg"],
  convert: ["webp", "home", "resize", "presets"],
  webp: ["convert", "home", "resize", "presets"],
  resize: ["home", "convert", "webp", "presets"],
  presets: ["resize", "home", "removeBg", "convert"],
  removeBg: ["presets", "resize", "home", "convert"],
  wordToPdf: ["pdfToWord", "imageToText", "home"],
  pdfToWord: ["wordToPdf", "imageToText", "home"],
  imageToText: ["pdfToWord", "wordToPdf", "home", "resize"],
};
