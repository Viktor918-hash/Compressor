import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import i18n, { setLanguage } from "./i18n/i18n";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ROUTES } from "./routes.jsx";
import { routesForLang, findRouteByPath } from "./utils/routeLangs";
import { toolBySlug } from "./toolsCatalog";
import { recordRecent } from "./utils/recentTools";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer.jsx";
import LanguageSuggestionBanner from "./components/LanguageSuggestion/LanguageSuggestionBanner";
import ConsentBanner from "./components/ConsentBanner/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import NotFound from "./components/NotFound/NotFound";
import ShareView from "./components/ShareView/ShareView";

/**
 * Жорстко задає мову контенту для цього конкретного роута на основі URL
 * (а не браузерного детектора) — так Google завжди бачить консистентний
 * контент на кожній адресі: "/presets" завжди uk, "/en/presets" завжди en.
 */
function LangSync({ lang, children }) {
  useEffect(() => {
    if (i18n.language !== lang) {
      // мова першого завантаження вже виставлена з URL (i18n.js); сюди
      // потрапляємо лише при переході між мовами всередині застосунку
      setLanguage(lang);
    }
  }, [lang]);
  return children;
}

/**
 * Сигналізує vite-plugin-prerender (Puppeteer), що сторінку можна знімати:
 * чекаємо два кадри анімації після монтування, щоб гарантовано встигли
 * відпрацювати LangSync (i18n.changeLanguage) і повторний рендер
 * react-helmet-async з правильним <title>/<meta description> для цього
 * конкретного URL. У звичайному браузері (реальний користувач) цей
 * компонент просто нічого не робить — подія нікому не потрібна.
 */
function PrerenderSignal() {
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        document.dispatchEvent(new Event("prerender-ready"));
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);
  return null;
}

/**
 * "Ваші інструменти" (round 34): запам'ятовуємо відкриті сторінки
 * інструментів (лише localStorage цього браузера), щоб показати їх на
 * головній.
 */
function RecentToolsTracker({ pathname }) {
  useEffect(() => {
    const slug = findRouteByPath(ROUTES, pathname)?.slug;
    if (slug && toolBySlug(slug)) recordRecent(slug);
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  return (
    <HelmetProvider>
      <AuthProvider>
        <div className="App">
          <Header />
          <LanguageSuggestionBanner />
          <div className="app-main">
            {/* key: після переходу на іншу сторінку межа помилок скидається */}
            <ErrorBoundary key={location.pathname}>
            <Routes>
              {routesForLang(ROUTES, "uk").map(({ slug, uk, Component }) => (
                <Route
                  key={`uk-${slug}`}
                  path={uk}
                  element={
                    <LangSync lang="uk">
                      <Component />
                    </LangSync>
                  }
                />
              ))}
              {routesForLang(ROUTES, "en").map(({ slug, en, Component }) => (
                <Route
                  key={`en-${slug}`}
                  path={en}
                  element={
                    <LangSync lang="en">
                      <Component />
                    </LangSync>
                  }
                />
              ))}
              {routesForLang(ROUTES, "ru").map(({ slug, ru, Component }) => (
                <Route
                  key={`ru-${slug}`}
                  path={ru}
                  element={
                    <LangSync lang="ru">
                      <Component />
                    </LangSync>
                  }
                />
              ))}
              {routesForLang(ROUTES, "es").map(({ slug, es, Component }) => (
                <Route
                  key={`es-${slug}`}
                  path={es}
                  element={
                    <LangSync lang="es">
                      <Component />
                    </LangSync>
                  }
                />
              ))}
              {/* Тимчасові посилання на файл (round 34) — поза ROUTES:
                  не потрапляють у sitemap/hreflang/меню */}
              {[
                ["uk", "/s/:id"],
                ["en", "/en/s/:id"],
                ["ru", "/ru/s/:id"],
                ["es", "/es/s/:id"],
              ].map(([lang, path]) => (
                <Route
                  key={`share-${lang}`}
                  path={path}
                  element={
                    <LangSync lang={lang}>
                      <ShareView />
                    </LangSync>
                  }
                />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </div>
          <Footer />
          <ConsentBanner />
          <PrerenderSignal />
          <RecentToolsTracker pathname={location.pathname} />
        </div>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
