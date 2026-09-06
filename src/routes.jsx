import Hero from "./components/Hero/Hero.jsx";
import Convert from "./components/Convertal/Convert.jsx";
import ConvertWebp from "./components/ConvertWebP/Convertwebp.jsx";
import Resize from "./components/Resize/Resize.jsx";
import Presets from "./components/Presets/Presets.jsx";
import WordToPdf from "./components/WordToPdf/WordToPdf.jsx";
import PdfToWord from "./components/PdfToWord/PdfToWord.jsx";
import RemoveBg from "./components/RemoveBg/RemoveBg.jsx";
import ImageToText from "./components/ImageToText/ImageToText.jsx";
import { ROUTE_PATHS } from "./routes.config.js";

// Прив'язка React-компонента до кожного slug'а з routes.config.js.
// Самі URL (uk/en/ru/es) живуть в routes.config.js — єдиному джерелі
// правди, яке також напряму імпортує vite.config.js для генерації
// PRERENDER_ROUTES (див. коментар там).
const SLUG_COMPONENTS = {
  home: Hero,
  convert: Convert,
  resize: Resize,
  webp: ConvertWebp,
  presets: Presets,
  wordToPdf: WordToPdf,
  pdfToWord: PdfToWord,
  removeBg: RemoveBg,
  imageToText: ImageToText,
};

// Форма кожного елемента ROUTES лишається такою ж, як і раніше:
// { slug, uk, en, ru, es, Component } — жодних змін для App.jsx,
// SeoHead, LocalizedLink, LanguageSwitcher та інших споживачів ROUTES.
export const ROUTES = ROUTE_PATHS.map((routePath) => ({
  ...routePath,
  Component: SLUG_COMPONENTS[routePath.slug],
}));
