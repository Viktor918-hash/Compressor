// Єдине джерело правди для URL усіх мовних версій сторінок сайту.
//
// Навмисно винесено в окремий "чистий" JS-файл без React-компонентів і
// JSX-синтаксису, щоб цей самий файл можна було безпечно імпортувати
// напряму у vite.config.js (Node ESM, виконується ДО того, як Vite може
// транспілювати JSX) для автоматичної генерації PRERENDER_ROUTES —
// і водночас у src/routes.jsx, де до цих даних додаються React-компоненти.
//
// uk — канонічний шлях без префіксу (дефолтна мова аудиторії)
// en — той самий контент з префіксом /en
// ru — той самий контент з префіксом /ru
// es — той самий контент з префіксом /es
// slug — використовується для генерації hreflang/canonical у SeoHead
//
// Додаючи нову сторінку — додайте один запис сюди. routes.jsx і
// PRERENDER_ROUTES (vite.config.js) підхоплять її автоматично.
export const ROUTE_PATHS = [
  { slug: "home", uk: "/", en: "/en", ru: "/ru", es: "/es" },
  {
    slug: "convert",
    uk: "/convert-to-jpg",
    en: "/en/convert-to-jpg",
    ru: "/ru/convert-to-jpg",
    es: "/es/convertir-a-jpg", // TODO: за бажанням замінити на іспаномовний slug (напр. /es/convertir-a-jpg)
  },
  {
    slug: "resize",
    uk: "/resize-image",
    en: "/en/resize-image",
    ru: "/ru/resize-image",
    es: "/es/redimensionar-imagen", // TODO: за бажанням /es/redimensionar-imagen
  },
  {
    slug: "webp",
    uk: "/convert-to-webp",
    en: "/en/convert-to-webp",
    ru: "/ru/convert-to-webp",
    es: "/es/convertir-a-webp", // TODO: за бажанням /es/convertir-a-webp
  },
  {
    slug: "presets",
    uk: "/photo-presets",
    en: "/en/photo-presets",
    ru: "/ru/photo-presets",
    es: "/es/filtros-para-fotos", // TODO: за бажанням /es/filtros-para-fotos
  },
  {
    slug: "wordToPdf",
    uk: "/convert-word-to-pdf",
    en: "/en/convert-word-to-pdf",
    ru: "/ru/convert-word-to-pdf",
    es: "/es/convertir-word-a-pdf", // TODO: за бажанням /es/convertir-word-a-pdf
  },
  {
    slug: "pdfToWord",
    uk: "/convert-pdf-to-word",
    en: "/en/convert-pdf-to-word",
    ru: "/ru/convert-pdf-to-word",
    es: "/es/convertir-pdf-a-word", // TODO: за бажанням перевірити es-slug
  },
  {
    slug: "removeBg",
    uk: "/remove-background",
    en: "/en/remove-background",
    ru: "/ru/remove-background",
    es: "/es/eliminar-fondo", // TODO: за бажанням перевірити es-slug
  },
  {
    slug: "imageToText",
    uk: "/image-to-text",
    en: "/en/image-to-text",
    ru: "/ru/image-to-text",
    es: "/es/imagen-a-texto",
  },
  // Нові інструменти: uk + en + ru + es (ru/es — мої переклади, бажано вичитати носієм)
  {
    slug: "compressToSize",
    uk: "/compress-image-to-size",
    en: "/en/compress-image-to-size",
    ru: "/ru/compress-image-to-size",
    es: "/es/comprimir-imagen-a-kb",
  },
  {
    slug: "convertToPng",
    uk: "/convert-to-png",
    en: "/en/convert-to-png",
    ru: "/ru/convert-to-png",
    es: "/es/convertir-a-png",
  },
  {
    slug: "removeExif",
    uk: "/remove-photo-metadata",
    en: "/en/remove-photo-metadata",
    ru: "/ru/remove-photo-metadata",
    es: "/es/eliminar-metadatos-foto",
  },
  {
    slug: "photoToPdf",
    uk: "/photo-to-pdf",
    en: "/en/photo-to-pdf",
    ru: "/ru/photo-to-pdf",
    es: "/es/foto-a-pdf",
  },
  {
    slug: "cropImage",
    uk: "/crop-image",
    en: "/en/crop-image",
    ru: "/ru/crop-image",
    es: "/es/recortar-imagen",
  },
  {
    slug: "rotateImage",
    uk: "/rotate-image",
    en: "/en/rotate-image",
    ru: "/ru/rotate-image",
    es: "/es/girar-imagen",
  },
  {
    slug: "addWatermark",
    uk: "/add-watermark",
    en: "/en/add-watermark",
    ru: "/ru/add-watermark",
    es: "/es/marca-de-agua",
  },
  {
    slug: "blackAndWhite",
    uk: "/black-and-white",
    en: "/en/black-and-white",
    ru: "/ru/black-and-white",
    es: "/es/foto-en-blanco-y-negro",
  },
  {
    slug: "circleCrop",
    uk: "/circle-crop",
    en: "/en/circle-crop",
    ru: "/ru/circle-crop",
    es: "/es/recorte-circular",
  },
  {
    slug: "compressVideo",
    uk: "/compress-video",
    en: "/en/compress-video",
    ru: "/ru/compress-video",
    es: "/es/comprimir-video",
  },
  // Довір-сторінки (uk+en спершу, як і для інструментів; ru/es — пізніше).
  // Не інструменти: без header.*/TOOLS-запису, посилання лише у футері.
  { slug: "privacy", uk: "/privacy", en: "/en/privacy" },
  { slug: "terms", uk: "/terms", en: "/en/terms" },
  { slug: "contact", uk: "/contact", en: "/en/contact" },
  { slug: "about", uk: "/about", en: "/en/about" },
];
