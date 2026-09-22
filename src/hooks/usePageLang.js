import { useLocation } from "react-router-dom";
import { langFromPath } from "../utils/routeLangs";

/**
 * Повертає "es" на /es/..., "en" на /en/..., "ru" на /ru/... і "uk" на решті
 * шляхів. Використовуйте разом з <SeoHead lang={usePageLang()} .../> на кожній
 * сторінці — тоді title/description автоматично відповідають URL.
 */
export function usePageLang() {
  const location = useLocation();
  return langFromPath(location.pathname);
}
