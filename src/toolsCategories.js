// Категорії для сітки інструментів на головній сторінці (розділ 5
// дизайн-документа): 4 групи замість плаского списку 16 інструментів,
// кожна зі своєю кольоровою іконкою (узгоджено з семантичними токенами
// tokens.css, без нових кольорів) і коротким підзаголовком навіщо вона
// існує (додатковий унікальний H2-текст на головній — SEO-бонус).
//
// slug відповідає toolsCatalog.js / routes.config.js.
export const TOOL_CATEGORIES = [
  {
    id: "compress",
    titleKey: "home.categories.compress.title",
    subtitleKey: "home.categories.compress.subtitle",
    colorVar: "primary",
    slugs: ["home", "compressToSize"],
  },
  {
    id: "convert",
    titleKey: "home.categories.convert.title",
    subtitleKey: "home.categories.convert.subtitle",
    colorVar: "success",
    slugs: ["convert", "convertToPng", "webp", "photoToPdf"],
  },
  {
    id: "edit",
    titleKey: "home.categories.edit.title",
    subtitleKey: "home.categories.edit.subtitle",
    colorVar: "accent",
    slugs: [
      "resize",
      "cropImage",
      "rotateImage",
      "removeBg",
      "addWatermark",
      "removeExif",
    ],
  },
  // round 36: відео окремою групою (раніше відеоінструментів на головній
  // у сітці не було — лише в меню й «Схожих»)
  {
    id: "video",
    titleKey: "home.categories.video.title",
    subtitleKey: "home.categories.video.subtitle",
    colorVar: "accent",
    slugs: [
      "compressVideo",
      "trimVideo",
      "videoToMp3",
      "convertMovToMp4",
      "convertMkvToMp4",
      "convertWebmToMp4",
    ],
  },
  {
    id: "docs",
    titleKey: "home.categories.docs.title",
    subtitleKey: "home.categories.docs.subtitle",
    colorVar: "warning",
    slugs: ["wordToPdf", "pdfToWord", "imageToText", "presets"],
  },
];

// Категорія (і, відповідно, колір/іконка) конкретного інструмента за slug —
// використовується там, де показуємо один інструмент поза сіткою категорій
// (наприклад, у блоці "Схожі інструменти"), щоб зберегти те саме кольорове
// кодування, що й на головній.
export function categoryForSlug(slug) {
  return TOOL_CATEGORIES.find((c) => c.slugs.includes(slug));
}
