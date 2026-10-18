import { lazy, Suspense } from "react";
import Hero from "./components/Hero/Hero.jsx";
import Convert from "./components/Convertal/Convert.jsx";
import ConvertWebp from "./components/ConvertWebP/Convertwebp.jsx";
import Resize from "./components/Resize/Resize.jsx";
import Presets from "./components/Presets/Presets.jsx";
import WordToPdf from "./components/WordToPdf/WordToPdf.jsx";
import PdfToWord from "./components/PdfToWord/PdfToWord.jsx";
import RemoveBg from "./components/RemoveBg/RemoveBg.jsx";
import ImageToText from "./components/ImageToText/ImageToText.jsx";
import CompressToSize from "./components/CompressToSize/CompressToSize.jsx";
import ConvertPng from "./components/ConvertPng/ConvertPng.jsx";
import RemoveExif from "./components/RemoveExif/RemoveExif.jsx";
import PhotoToPdf from "./components/PhotoToPdf/PhotoToPdf.jsx";
import CropImage from "./components/CropImage/CropImage.jsx";
import RotateImage from "./components/RotateImage/RotateImage.jsx";
import Watermark from "./components/Watermark/Watermark.jsx";
import BlackAndWhite from "./components/BlackAndWhite/BlackAndWhite.jsx";
import CircleCrop from "./components/CircleCrop/CircleCrop.jsx";
import CompressVideo from "./components/CompressVideo/CompressVideo.jsx";
import ConvertMovToMp4 from "./components/ConvertVideoFormat/ConvertMovToMp4.jsx";
import ConvertMkvToMp4 from "./components/ConvertVideoFormat/ConvertMkvToMp4.jsx";
import ConvertWebmToMp4 from "./components/ConvertVideoFormat/ConvertWebmToMp4.jsx";
import { Privacy, Terms, Contact, About } from "./components/Legal/LegalPages.jsx";
import VideoToMp3 from "./components/VideoTools/VideoToMp3.jsx";
import TrimVideo from "./components/VideoTools/TrimVideo.jsx";
import BlogIndex from "./components/Blog/BlogIndex.jsx";
import BlogPost from "./components/Blog/BlogPost.jsx";
import { BLOG_INDEX_SLUG, BLOG_POSTS } from "./blog/posts.js";
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
  compressToSize: CompressToSize,
  convertToPng: ConvertPng,
  removeExif: RemoveExif,
  photoToPdf: PhotoToPdf,
  cropImage: CropImage,
  rotateImage: RotateImage,
  addWatermark: Watermark,
  blackAndWhite: BlackAndWhite,
  circleCrop: CircleCrop,
  compressVideo: CompressVideo,
  convertMovToMp4: ConvertMovToMp4,
  convertMkvToMp4: ConvertMkvToMp4,
  convertWebmToMp4: ConvertWebmToMp4,
  videoToMp3: VideoToMp3,
  trimVideo: TrimVideo,
  privacy: Privacy,
  terms: Terms,
  contact: Contact,
  about: About,
  [BLOG_INDEX_SLUG]: BlogIndex,
  // кожна стаття — окремий компонент без пропсів (так влаштовано ROUTES)
  ...Object.fromEntries(
    BLOG_POSTS.map((post) => {
      const Post = () => <BlogPost slug={post.slug} />;
      Post.displayName = `BlogPost(${post.slug})`;
      return [post.slug, Post];
    })
  ),
};

// Форма кожного елемента ROUTES лишається такою ж, як і раніше:
// { slug, uk, en, ru, es, Component } — жодних змін для App.jsx,
// SeoHead, LocalizedLink, LanguageSwitcher та інших споживачів ROUTES.
// ── Тільки для e2e-збірки (VITE_E2E_STUB=1) ─────────────────────────────
// Сторінка-заглушка для перевірки Panel mode="merge" і маршруту з
// підмножиною мов (uk + en, без ru/es). У звичайній збірці умова
// статично хибна, тож і заглушка, і її чанк відкидаються при збірці.
// НЕ додавайте її в routes.config.js — там лише реальні сторінки.
const E2E_STUB = import.meta.env.VITE_E2E_STUB === "1";
const LazyMergeStub = E2E_STUB ? lazy(() => import("./e2e/MergeStub.jsx")) : null;
const E2E_ROUTES = E2E_STUB
  ? [
      {
        slug: "e2eMerge",
        uk: "/__e2e-merge",
        en: "/en/__e2e-merge",
        Component: () => (
          <Suspense fallback={null}>
            <LazyMergeStub />
          </Suspense>
        ),
      },
    ]
  : [];

export const ROUTES = [
  ...ROUTE_PATHS.map((routePath) => ({
    ...routePath,
    Component: SLUG_COMPONENTS[routePath.slug],
  })),
  ...E2E_ROUTES,
];
