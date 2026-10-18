// Чиста логіка розбору збережених налаштувань (round 33) — окремо від
// React-хука, щоб покрити тестом під `node --test` (tests/persist.test.mjs).

/**
 * raw — рядок з localStorage (або null). Повертає збережене значення,
 * якщо воно проходить validate, інакше fallback. Для об'єктів підмішує
 * fallback: якщо пізніше в налаштуваннях з'явиться нове поле, старий
 * збережений об'єкт не зламає сторінку — нове поле візьме значення за
 * замовчуванням.
 */
export function parseStored(raw, fallback, validate) {
  if (raw == null || raw === "") return fallback;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const value =
    isPlainObject(fallback) && isPlainObject(parsed) ? { ...fallback, ...parsed } : parsed;
  if (typeof validate === "function") {
    try {
      if (!validate(value)) return fallback;
    } catch {
      return fallback;
    }
  } else if (typeof value !== typeof fallback) {
    return fallback;
  }
  return value;
}
