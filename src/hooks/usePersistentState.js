import { useEffect, useState } from "react";
import { parseStored } from "../utils/persist.js";

const PREFIX = "cp_settings_";

/**
 * useState, що пам'ятає значення між візитами (localStorage) — round 33:
 * "повторний візит стає в один клік". Лише зручність: у приватному режимі
 * чи з вимкненим сховищем усе працює як звичайний useState.
 * Сайт монтується через createRoot (без гідрації), тож читати сховище
 * одразу в ініціалізаторі безпечно — розбіжності з пре-рендером немає.
 *
 * @param {string} key — коротке ім'я (зберігається як cp_settings_<key>)
 * @param {*} fallback — значення за замовчуванням
 * @param {(value) => boolean} [validate] — відкидає пошкоджене/застаріле значення
 */
export function usePersistentState(key, fallback, validate) {
  const [value, setValue] = useState(() => {
    try {
      return parseStored(localStorage.getItem(PREFIX + key), fallback, validate);
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // сховище недоступне або переповнене — просто не запам'ятовуємо
    }
  }, [key, value]);

  return [value, setValue];
}
