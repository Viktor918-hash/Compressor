import { Helmet } from "react-helmet-async";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";

// Fallback, якщо для route.slug немає запису в PAGE_META
// (наприклад, нова сторінка, для якої ще не написали унікальний текст)
const DEFAULT_DESCRIPTIONS = {
  uk: "Безкоштовний онлайн-сервіс для обробки зображень у браузері: стиснення, зміна розміру, конвертація у JPG і WebP та фото-пресети. Швидко, якісно та без відправки файлів на сервер.",
  en: "Free online image tool: compress photos, resize images, convert to JPG and WebP, and apply photo presets directly in your browser. Fast, private, and secure.",
  ru: "Бесплатный онлайн-сервис для обработки изображений в браузере: сжатие, изменение размера, конвертация в JPG и WebP и фото-прессеты. Быстро, качественно и без отправки файлов на сервер.",
  // TODO: перевірити/відредагувати іспанський переклад
  es: "Herramienta gratuita en línea para editar imágenes en tu navegador: comprime, redimensiona, convierte a JPG y WebP, y aplica preajustes de fotos. Rápido, privado y seguro.",
};

const DEFAULT_TITLES = {
  uk: "CompressPhoto — Онлайн стиснення та обробка фото",
  en: "CompressPhoto — Online Image Compressor & Converter",
  ru: "CompressPhoto - Онлайн сжатие та обработка фото",
  // TODO: перевірити/відредагувати іспанський переклад
  es: "CompressPhoto — Compresor y Convertidor de Imágenes Online",
};

// Шлях до зображення для прев'ю в соцмережах (розмір ~1200x630px)
const DEFAULT_OG_IMAGE = `${SITE_URL}/logoImg/compressphoto_header_logo_2.png`;

/**
 * <SeoHead route={route} lang="uk" />
 * title/description можна не передавати — підтягнуться автоматично з
 * PAGE_META (src/seoMeta.js) по route.slug. Явно передані title/description
 * як пропси мають вищий пріоритет за PAGE_META.
 * robots — за замовчуванням "index, follow"; передайте "noindex, nofollow"
 * для приватних сторінок (напр. /account).
 * jsonLd — об'єкт або масив об'єктів schema.org (JSON-LD) для rich snippets.
 * Якщо передати масив — кожен елемент рендериться у власному <script> тегу.
 */
const SeoHead = ({
  route,
  lang = "uk",
  title,
  description,
  ogImage,
  robots = "index, follow",
  jsonLd,
}) => {
  const canonicalPath =
    lang === "es"
      ? route.es
      : lang === "en"
      ? route.en
      : lang === "ru"
      ? route.ru
      : route.uk;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const pageMeta = PAGE_META[route?.slug]?.[lang];

  const pageTitle =
    title || pageMeta?.title || DEFAULT_TITLES[lang] || DEFAULT_TITLES.uk;
  const pageDescription =
    description ||
    pageMeta?.description ||
    DEFAULT_DESCRIPTIONS[lang] ||
    DEFAULT_DESCRIPTIONS.uk;
  const metaOgImage = ogImage || DEFAULT_OG_IMAGE;

  // Дозволяємо передавати як один об'єкт, так і масив схем
  // (наприклад, SoftwareApplication + FAQPage одночасно)
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Мова документа */}
      <html lang={lang} />

      {/* Базові теги */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang для локалізації */}
      <link rel="alternate" hrefLang="uk" href={`${SITE_URL}${route.uk}`} />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${route.en}`} />
      <link rel="alternate" hrefLang="ru" href={`${SITE_URL}${route.ru}`} />
      <link rel="alternate" hrefLang="es" href={`${SITE_URL}${route.es}`} />
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_URL}${route.en}`}
      />

      {/* Open Graph (Facebook, Telegram, Viber, LinkedIn) */}
      <meta property="og:site_name" content="CompressPhoto" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={metaOgImage} />
      <meta
        property="og:locale"
        content={
          lang === "es"
            ? "es_ES"
            : lang === "en"
            ? "en_US"
            : lang === "ru"
            ? "ru_RU"
            : "uk_UA"
        }
      />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={metaOgImage} />

      {/* Structured data (schema.org) для rich snippets */}
      {jsonLdList.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SeoHead;
