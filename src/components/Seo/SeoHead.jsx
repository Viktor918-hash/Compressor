import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { PAGE_META } from "../../seoMeta";
import { toolBySlug } from "../../toolsCatalog";
import { HOME_PATHS, hreflangEntries, langUrl } from "../../utils/routeLangs";

const SITE_URL = "https://compressphoto.org";

// Fallback, якщо для route.slug немає запису в PAGE_META
// (наприклад, нова сторінка, для якої ще не написали унікальний текст)
const DEFAULT_DESCRIPTIONS = {
  uk: "Безкоштовний онлайн-сервіс для обробки зображень у браузері: стиснення, зміна розміру, конвертація у JPG і WebP та фото-пресети. Швидко та безпечно.",
  en: "Free online image tool: compress photos, resize images, convert to JPG and WebP, and apply photo presets directly in your browser. Fast and secure.",
  ru: "Бесплатный онлайн-сервис для обработки изображений в браузере: сжатие, изменение размера, конвертация в JPG и WebP и фото-прессеты. Быстро и безопасно.",
  // TODO: перевірити/відредагувати іспанський переклад
  es: "Herramienta gratuita en línea para editar imágenes en tu navegador: comprime, redimensiona, convierte a JPG y WebP, y aplica preajustes de fotos. Rápido y seguro.",
};

const DEFAULT_TITLES = {
  uk: "CompressPhoto — Онлайн стиснення та обробка фото",
  en: "CompressPhoto — Online Image Compressor & Converter",
  ru: "CompressPhoto - Онлайн сжатие та обработка фото",
  // TODO: перевірити/відредагувати іспанський переклад
  es: "CompressPhoto — Compresor y Convertidor de Imágenes Online",
};

// Картинки для прев'ю в соцмережах: 1200×630, по одній на мову
// (~60 КБ кожна; джерело — scripts/og/og-card.html, генерація — scripts/og/render.py)
const OG_IMAGE_SIZE = { width: 1200, height: 630 };
const ogImageFor = (lang) => `${SITE_URL}/og/og-${["uk", "en", "ru", "es"].includes(lang) ? lang : "uk"}.png`;
const OG_ALT = {
  uk: "CompressPhoto — стиснення та обробка фото онлайн",
  en: "CompressPhoto — compress and convert photos online",
  ru: "CompressPhoto — сжатие и обработка фото онлайн",
  es: "CompressPhoto — comprime y convierte fotos online",
};

// Організація: логотип 512×512 (квадратний, як вимагає Google для Knowledge Panel/логотипу у видачі)
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const ORGANIZATION = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "CompressPhoto",
  url: `${SITE_URL}/`,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo-512.png`,
    width: 512,
    height: 512,
  },
};

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
  const { t } = useTranslation();
  // Якщо в маршруту немає URL для цієї мови (сторінка існує не в усіх
  // мовах) — запасний en → uk, щоб canonical ніколи не був "undefined"
  const canonicalPath = langUrl(route, lang);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const pageMeta = PAGE_META[route?.slug]?.[lang];

  const pageTitle =
    title || pageMeta?.title || DEFAULT_TITLES[lang] || DEFAULT_TITLES.uk;
  const pageDescription =
    description ||
    pageMeta?.description ||
    DEFAULT_DESCRIPTIONS[lang] ||
    DEFAULT_DESCRIPTIONS.uk;
  const metaOgImage = ogImage || ogImageFor(lang);
  const ogAlt = ogImage ? pageTitle : OG_ALT[lang] || OG_ALT.uk;

  // Дозволяємо передавати як один об'єкт, так і масив схем
  // (наприклад, SoftwareApplication + FAQPage одночасно)
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? [...jsonLd] : [jsonLd]) : [];

  // Розмітка, спільна для всіх сторінок сайту (не потрібно дублювати на
  // кожній сторінці): WebSite — на головній, BreadcrumbList "Головна →
  // Інструмент" — на сторінках інструментів (для показу навігаційного
  // ланцюжка замість сирого URL у видачі Google).
  const tool = toolBySlug(route?.slug);
  if (route?.slug === "home") {
    jsonLdList.push(
      { "@context": "https://schema.org", ...ORGANIZATION },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "CompressPhoto",
        url: canonicalUrl,
        inLanguage: lang,
        publisher: { "@id": ORGANIZATION_ID },
      }
    );
  } else if (tool && robots.startsWith("index")) {
    const homeRoute = HOME_PATHS;
    jsonLdList.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "CompressPhoto",
          item: `${SITE_URL}${homeRoute[lang] || "/"}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t(tool.nameKey),
          item: canonicalUrl,
        },
      ],
    });
  }

  return (
    <Helmet>
      {/* Мова документа */}
      <html lang={lang} />

      {/* Базові теги */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang: лише мови, для яких сторінка існує, + x-default (en → uk) */}
      {hreflangEntries(route).map(({ hrefLang, path }) => (
        <link
          key={hrefLang}
          rel="alternate"
          hrefLang={hrefLang}
          href={`${SITE_URL}${path}`}
        />
      ))}

      {/* Open Graph (Facebook, Telegram, Viber, LinkedIn) */}
      <meta property="og:site_name" content="CompressPhoto" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={metaOgImage} />
      {!ogImage && <meta property="og:image:width" content={String(OG_IMAGE_SIZE.width)} />}
      {!ogImage && <meta property="og:image:height" content={String(OG_IMAGE_SIZE.height)} />}
      <meta property="og:image:alt" content={ogAlt} />
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
      <meta name="twitter:image:alt" content={ogAlt} />

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
