import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../routes";
import { hasLang, langUrl, langFromPath } from "../../utils/routeLangs";

/**
 * Замінник <Link> — приймає "to" як КАНОНІЧНИЙ (uk) шлях, наприклад
 * to="/resize-image", і сам підставляє правильну адресу для поточної мови
 * сторінки через ROUTES (uk/en/es slug'и можуть відрізнятись — напр.
 * "/es/redimensionar-imagen" — просто приклеїти префікс "/es" тут
 * недостатньо).
 * Використовуйте замість звичайного <Link> всюди, де посилання веде на
 * внутрішню сторінку сайту (Header, Footer, тощо).
 * hideIfMissing — не показувати посилання, якщо сторінки немає в поточній
 * мові (маршрут без ru/es). Без нього — запасний URL: обрана мова → en → uk.
 */
const LocalizedLink = ({ to, children, hideIfMissing = false, ...props }) => {
  const location = useLocation();
  const currentLang = langFromPath(location.pathname);

  const route = ROUTES.find((r) => r.uk === to);
  // Якщо для "to" немає запису в ROUTES (напр. посилання на /account,
  // якого там немає) — лишаємо as-is для uk, і підставляємо звичайний
  // префікс для en/es як розумний fallback.
  // Маршрут може існувати не в усіх мовах: hideIfMissing прибирає посилання
  // (меню, футер), інакше — запасна мова (en → uk), щоб не було битого href.
  if (route && hideIfMissing && !hasLang(route, currentLang)) return null;

  const localizedTo = route
    ? langUrl(route, currentLang)
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
