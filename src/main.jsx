import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./components/resetCSS/reset.css";
import App from "./App.jsx";
import { i18nReady } from "./i18n/i18n.js";
import { initAnalyticsFromStoredConsent } from "./utils/consent.js";

/**
 * Сторінки в dist/ — це статичний HTML, "запечений" через Puppeteer-пре-рендер
 * (vite.config.js). У ньому вже є правильні <title>, <meta description>,
 * canonical, og:*, twitter:*, JSON-LD — react-helmet-async їх туди й поклав
 * під час пре-рендерингу.
 *
 * Але на клієнті ми монтуємось через createRoot() (звичайний CSR, не
 * hydrateRoot), тож react-helmet-async стартує "з чистого аркуша" й нічого
 * не знає про ці вже наявні теги — замість того, щоб їх замінити, він просто
 * додає ще один комплект поруч. Тому прибираємо запечені SEO-теги ще ДО
 * монтування React: далі <SeoHead>/<Helmet> одразу вставить свою (єдину)
 * версію без дублів.
 */
function removePrerenderedSeoTags() {
  const selectors = [
    "title",
    'meta[name="description"]',
    'meta[name="robots"]',
    'link[rel="canonical"]',
    'link[rel="alternate"][hreflang]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'script[type="application/ld+json"]',
  ];
  document.head.querySelectorAll(selectors.join(",")).forEach((el) => el.remove());
}
removePrerenderedSeoTags();

// Google Analytics вантажимо лише якщо користувач раніше дав згоду
initAnalyticsFromStoredConsent();

// Рендеримо після завантаження пакета мови поточного URL — перший кадр уже
// з правильною мовою (без мигання). Поки чекаємо, лишається запечений HTML.
i18nReady
  .catch((err) => console.error("i18n init failed:", err))
  .then(() => {
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>
    );
  });
