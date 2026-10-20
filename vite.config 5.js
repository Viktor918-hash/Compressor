import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import prerender from "@prerenderer/rollup-plugin";
import chromium from "@sparticuz/chromium";
import { ROUTE_PATHS } from "./src/routes.config.js";
import { SITE_LANGS } from "./src/utils/routeLangs.js";

// Мовні префікси, для яких генеруються prerender-сторінки. Мають
// відповідати мовам, які реально обробляються в SeoHead/hreflang
// (src/components/Seo/SeoHead.jsx) і usePageLang (src/hooks/usePageLang.js).
const LANGS = SITE_LANGS;

// PRERENDER_ROUTES тепер похідний від ROUTE_PATHS (src/routes.config.js) —
// того самого джерела даних, яке src/routes.jsx використовує для ROUTES.
// routes.config.js навмисно не містить JSX/React-компонентів, тому його
// можна безпечно імпортувати прямо тут, у Node, ДО того, як Vite встигає
// транспілювати JSX-компоненти сторінок.
// Додаючи нову сторінку — досить додати один запис у routes.config.js,
// сюди дублювати вручну більше не потрібно.
function buildPrerenderRoutes(routePaths) {
  const seen = new Set();
  const result = [];

  for (const route of routePaths) {
    for (const lang of LANGS) {
      const path = route[lang];
      if (!path) continue; // не всі маршрути обов'язково мають усі мови
      if (seen.has(path)) continue; // напр. uk "/" міг би десь перетнутись
      seen.add(path);
      result.push(path);
    }
  }

  return result;
}

const PRERENDER_ROUTES = buildPrerenderRoutes(ROUTE_PATHS);

// На Vercel (і будь-якому іншому мінімальному Linux CI без apt/root) у системі
// немає бібліотек (libnspr4.so і т.п.), потрібних звичайному Chrome, який
// puppeteer качає під час `npm run build`. Тому там використовуємо
// @sparticuz/chromium — збірку Chromium зі всіма потрібними .so-бібліотеками
// "в комплекті", яка спеціально зроблена для serverless/CI-пісочниць.
// Локально (Mac/Windows/звичайний Linux) лишаємо стандартний Chrome від
// puppeteer, бо @sparticuz/chromium — Linux-only бінарник.
const isCI = !!process.env.VERCEL || !!process.env.CI;

async function getLaunchOptions() {
  if (!isCI) return {};

  chromium.setGraphicsMode = false;

  return {
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: "shell",
  };
}

// https://vite.dev/config/
export default defineConfig(async () => {
  const launchOptions = await getLaunchOptions();

  return {
    // FFmpeg.wasm (round 36): воркер @ffmpeg/ffmpeg — module worker з
    // динамічним import() ядра, тож потрібен ES-формат воркерів; у dev
    // пакет не можна пре-бандлити (зламається new URL("./worker.js")).
    worker: { format: "es" },
    optimizeDeps: { exclude: ["@ffmpeg/ffmpeg"] },
    plugins: [
      react(),
      prerender({
        routes: PRERENDER_ROUTES,
        renderer: "@prerenderer/renderer-puppeteer",
        rendererOptions: {
          // Сторінка сама сигналізує (App.jsx → <PrerenderSignal />) подією
          // "prerender-ready", коли i18n встановив правильну мову і
          // react-helmet-async встиг записати <title>/<meta description> —
          // тільки після цього знімається "фотографія" HTML.
          renderAfterDocumentEvent: "prerender-ready",
          // Обмежуємо паралельність, щоб не з'їсти всю памʼять на CI/Vercel
          // при білді (18 маршрутів — невелика кількість, 2 цілком достатньо).
          maxConcurrentRoutes: 2,
          launchOptions,
        },
      }),
    ],
  };
});
