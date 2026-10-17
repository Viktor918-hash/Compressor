import "../Convertal/Conver.css";
import Panel from "../PanelFile/Panel";
import { createVideoFormatConverter, getMp4OutputName } from "./convertVideoFormat";
import { useTranslation } from "react-i18next";
import SeoHead from "../Seo/SeoHead";
import SeoContent from "../SeoContent/SeoContent";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import { PAGE_META } from "../../seoMeta";

const SITE_URL = "https://compressphoto.org";
// Той самий бізнес-ліміт, що й /compress-video
// (api/convert/init.js::MAX_VIDEO_FILE_SIZE) — просте перепакування
// формату навантажує CloudConvert не менше за стиснення з ресайзом,
// тож свідомо лишаємо той самий консервативний ліміт, а не щось більше.
const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;

/**
 * Один спільний компонент для трьох вузьких SEO-сторінок конвертації
 * формату відео (раунд 24, claude/compressphoto-growth-prompt.md §3.3-А):
 * /convert-mov-to-mp4, /convert-mkv-to-mp4, /convert-webm-to-mp4. На
 * відміну від CompressVideo — жодного вибору роздільності чи цільового
 * розміру: просто "завантажив → отримав готовий .mp4".
 *
 * @param {{
 *   routeSlug: string,   // збігається з slug у routes.config.js / seoMeta.js / pageKey SeoContent
 *   i18nKey: string,     // простір імен у translation.json (тут завжди == routeSlug)
 *   toolType: string,    // ключ у api/convert/init.js::TOOLS
 *   expectedExt: string, // єдиний вхідний формат цієї сторінки ("mov"|"mkv"|"webm")
 *   acceptedTypes: object, // react-dropzone accept-мапа лише під цей формат
 * }} props
 */
const ConvertVideoFormat = ({
  routeSlug,
  i18nKey,
  toolType,
  expectedExt,
  acceptedTypes,
}) => {
  const { t } = useTranslation();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === routeSlug);
  const meta = PAGE_META[routeSlug][lang];

  const processFile = createVideoFormatConverter(toolType, expectedExt, i18nKey);

  // Той самий паттерн, що й в усіх інших гостьових конвертерів: коли
  // денний ліміт вичерпано — пропонуємо зареєструватись.
  const handleLimitReached = (error) => {
    if (error.isGuest) {
      window.dispatchEvent(new CustomEvent("open-register-modal"));
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${route[lang]}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <SeoHead route={route} lang={lang} jsonLd={jsonLd} />
      <Panel
        acceptedTypes={acceptedTypes}
        processFile={processFile}
        getOutputName={getMp4OutputName}
        onLimitReached={handleLimitReached}
        dropzoneText={t(`${i18nKey}.dropzone`)}
        maxFiles={5}
        // P0-6: файл вантажиться напряму в CloudConvert, не через нашу
        // Vercel-функцію — ліміт тіла запиту 4,5 МБ не застосовується.
        maxFileSize={MAX_VIDEO_FILE_SIZE}
        showStats={false}
        // Файл реально йде на CloudConvert (бекенд) — не показуємо рядок
        // "файли не йдуть на сервер", це було б неправдою.
        showEmptyTrust={false}
        emptyStateText={t(`${i18nKey}.panel.emptyState`)}
        addMoreText={t(`${i18nKey}.panel.addMore`)}
        addMoreAriaLabel={t(`${i18nKey}.panel.addMoreAria`)}
        selectedLabel={t(`${i18nKey}.panel.selected`)}
        downloadOneText={t(`${i18nKey}.panel.downloadOne`)}
        downloadManyText={t(`${i18nKey}.panel.downloadMany`)}
        removeAriaLabel={(name) => `${t(`${i18nKey}.panel.remove`)} ${name}`}
      >
        <h1 className="main__title">
          {t(`${i18nKey}.titlePart2`)}
          <span className="title__gradient"> {t(`${i18nKey}.titleGradient`)}</span>
        </h1>
        <p className="main__text">{t(`${i18nKey}.text1`)}</p>
        <p className="main__text">{t(`${i18nKey}.text2`)}</p>
      </Panel>
      <SeoContent pageKey={routeSlug} />
    </>
  );
};

export default ConvertVideoFormat;
