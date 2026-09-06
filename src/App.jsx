import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import i18n from "./i18n/i18n";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ROUTES } from "./routes.jsx";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer.jsx";
import LanguageSuggestionBanner from "./components/LanguageSuggestion/LanguageSuggestionBanner";

/**
 * Жорстко задає мову контенту для цього конкретного роута на основі URL
 * (а не браузерного детектора) — так Google завжди бачить консистентний
 * контент на кожній адресі: "/presets" завжди uk, "/en/presets" завжди en.
 */
function LangSync({ lang, children }) {
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
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

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <div className="App">
          <Header />
          <LanguageSuggestionBanner />
          <div className="app-main">
            <Routes>
              {ROUTES.map(({ slug, uk, Component }) => (
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
              {ROUTES.map(({ slug, en, Component }) => (
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
              {ROUTES.map(({ slug, ru, Component }) => (
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
              {ROUTES.map(({ slug, es, Component }) => (
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
            </Routes>
          </div>
          <Footer />
          <PrerenderSignal />
        </div>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
