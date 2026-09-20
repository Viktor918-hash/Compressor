import { getAccessToken } from "../lib/supabaseClient";
import i18n from "../i18n/i18n";

/**
 * Створює помилку, текст якої безпечно показувати користувачу
 * (Panel показує message лише для помилок з userFacing: true).
 */
export function userError(message, extra = {}) {
  const error = new Error(message);
  error.userFacing = true;
  Object.assign(error, extra);
  return error;
}

/**
 * Відправляє файл на серверний проксі (/api/word-to-pdf, /api/pdf-to-word)
 * і повертає Blob з результатом.
 *
 * Сервер повертає помилки як JSON { error: "<КОД>" } — тут коди
 * перетворюються на локалізовані повідомлення (errors.server.<КОД>),
 * тож на англійській сторінці користувач не побачить українського тексту.
 *
 * Ліміт для гостей сервер рахує за IP; заголовок X-Anon-Id більше не
 * використовується (клієнт міг підробити його в кожному запиті).
 */
export async function postFileToConvertApi(
  endpoint,
  file,
  defaultContentType,
  { signal } = {}
) {
  const headers = {
    "Content-Type": file.type || defaultContentType,
    "X-Filename": encodeURIComponent(file.name),
  };

  // Якщо користувач залогінений — додаємо його токен, щоб бекенд міг
  // порахувати ліміт "зареєстрований" (більше конвертацій на день), а не
  // "гість". Для гостя supabase-js навіть не завантажується.
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: file,
      signal,
    });
  } catch (err) {
    // Скасування користувачем — не мережева помилка: пробрасуємо як є
    // (Panel відкидає результат скасованого файлу).
    if (err?.name === "AbortError") throw err;
    throw userError(i18n.t("errors.network"), { code: "NETWORK" });
  }

  if (response.ok) return await response.blob();

  let code = "";
  let data = {};
  try {
    data = await response.json();
    code = data?.error || "";
  } catch {
    // тіло не JSON (напр. HTML-сторінка помилки платформи) — визначимо за статусом
  }

  if (response.status === 429 || code === "LIMIT_REACHED") {
    throw userError(
      data.isGuest ? i18n.t("wordToPdf.limit") : i18n.t("wordToPdf.limit2"),
      { code: "LIMIT_REACHED", isGuest: !!data.isGuest }
    );
  }

  // Платформа Vercel відповідає 413 з не-JSON тілом, якщо тіло запиту
  // або відповіді завелике
  if (!code && response.status === 413) code = "FILE_TOO_LARGE";
  if (!code && (response.status === 504 || response.status === 408)) {
    code = "CONVERSION_TIMEOUT";
  }

  const known = [
    "EMPTY_FILE",
    "INVALID_FILE_TYPE",
    "FILE_TOO_LARGE",
    "RESULT_TOO_LARGE",
    "SERVICE_UNAVAILABLE",
    "CONVERSION_TIMEOUT",
    "CONVERSION_FAILED",
  ];
  const key = known.includes(code) ? code : "CONVERSION_FAILED";
  throw userError(i18n.t(`errors.server.${key}`), { code: key });
}
