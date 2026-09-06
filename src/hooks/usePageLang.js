import { useLocation } from "react-router-dom";

/**
 * Повертає "es" на /es/..., "en" на /en/..., і "uk" на решті шляхів.
 * Використовуйте разом з <SeoHead lang={usePageLang()} .../> на кожній
 * сторінці — тоді title/description автоматично відповідають URL.
 */
export function usePageLang() {
  const location = useLocation();
  if (location.pathname.startsWith("/es")) return "es";
  if (location.pathname.startsWith("/en")) return "en";
  if (location.pathname.startsWith("/ru")) return "ru";
  return "uk";
}
