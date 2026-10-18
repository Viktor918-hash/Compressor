// Чиста dependency-free логіка, спільна для двох блоків внутрішньої
// перелінковки:
//   - RelatedTools.jsx  — "Схожі інструменти" під SEO-текстом (повна версія);
//   - TryAlsoInline.jsx — компактне "Спробуйте також" у бічній панелі,
//     одразу під кнопкою завантаження результату (round 25/32).
// Обидва мають радити інструмент лише тоді, коли для нього існує сторінка
// в поточній мові — ця перевірка винесена сюди один раз, щоб не розійтись.
//
// НАВМИСНО не імпортує RELATED з "../../toolsCatalog.js" напряму:
// toolsCatalog.js читає import.meta.env (Vite-специфічне) і падає під
// простим `node --test`. relatedMap передається аргументом — кожен
// React-компонент (де import.meta.env вже визначено Vite) імпортує
// RELATED сам і передає його сюди. Це тримає цей модуль безпечним під
// `node --test` без обхідних шляхів (на відміну від toolsCatalog.js, який
// через це доводиться читати в тестах як текст — див. tests/crop.test.mjs).
import { ROUTE_PATHS } from "../../routes.config.js";
import { hasLang } from "../../utils/routeLangs.js";

/**
 * slug-и з relatedMap[current], для яких існує сторінка в мові `lang`.
 * Порядок relatedMap[current] (вже впорядкований за доречністю) зберігається.
 *
 * @param {string} current - slug поточного інструмента (toolsCatalog.js)
 * @param {string} lang - "uk" | "en" | "ru" | "es"
 * @param {Record<string, string[]>} relatedMap - RELATED із toolsCatalog.js
 * @returns {string[]}
 */
export const availableRelatedSlugs = (current, lang, relatedMap) => {
  const candidates = relatedMap?.[current];
  if (!Array.isArray(candidates)) return [];
  return candidates.filter((slug) => {
    const route = ROUTE_PATHS.find((r) => r.slug === slug);
    return hasLang(route, lang);
  });
};

/**
 * До `limit` slug-ів для компактного блоку "Спробуйте також".
 *
 * @param {string} current
 * @param {string} lang
 * @param {Record<string, string[]>} relatedMap
 * @param {number} [limit=2]
 * @returns {string[]}
 */
export const pickTryAlsoSlugs = (current, lang, relatedMap, limit = 2) =>
  availableRelatedSlugs(current, lang, relatedMap).slice(0, limit);
