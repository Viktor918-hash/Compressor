import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../routes";

/**
 * Замінник <Link> — приймає "to" як КАНОНІЧНИЙ (uk) шлях, наприклад
 * to="/resize-image", і сам підставляє правильну адресу для поточної мови
 * сторінки через ROUTES (uk/en/es slug'и можуть відрізнятись — напр.
 * "/es/redimensionar-imagen" — просто приклеїти префікс "/es" тут
 * недостатньо).
 * Використовуйте замість звичайного <Link> всюди, де посилання веде на
 * внутрішню сторінку сайту (Header, Footer, тощо).
 */
const LocalizedLink = ({ to, children, ...props }) => {
  const location = useLocation();
  const currentLang = location.pathname.startsWith("/es")
    ? "es"
    : location.pathname.startsWith("/en")
    ? "en"
    : location.pathname.startsWith("/ru")
    ? "ru"
    : "uk";

  const route = ROUTES.find((r) => r.uk === to);
  // Якщо для "to" немає запису в ROUTES (напр. посилання на /account,
  // якого там немає) — лишаємо as-is для uk, і підставляємо звичайний
  // префікс для en/es як розумний fallback.
  const localizedTo = route
    ? route[currentLang]
    : currentLang === "uk"
    ? to
    : `/${currentLang}${to === "/" ? "" : to}`;

  return (
    <Link to={localizedTo} {...props}>
      {children}
    </Link>
  );
};

export default LocalizedLink;
