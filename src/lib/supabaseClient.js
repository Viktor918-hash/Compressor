// Значення беруться з .env (Vite: змінні мають починатись з VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true, якщо задано VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY */
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn(
    "Supabase вимкнено: не задано VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Авторизація недоступна."
  );
}

/**
 * Клієнт Supabase створюється ЛІНИВО (динамічний import): бібліотека
 * supabase-js — сотні КБ, а більшість відвідувачів не логіняться. Тому вона
 * не входить у головний бандл і завантажується лише коли справді потрібна:
 *  - у користувача вже є збережена сесія (див. hasStoredSession);
 *  - користувач повернувся з OAuth (Google/Apple) — у URL є code/access_token;
 *  - користувач відкрив вікно входу / натиснув "Увійти".
 *
 * Повертає Promise<client | null> (null — якщо змінні середовища не задано,
 * тоді сайт працює лише як гість).
 */
let clientPromise = null;
export function getSupabase() {
  if (!supabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey)
    );
  }
  return clientPromise;
}

/**
 * Чи є в браузері збережена сесія Supabase. supabase-js зберігає її в
 * localStorage під ключем "sb-<project-ref>-auth-token".
 */
export function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        return true;
      }
    }
  } catch {
    // localStorage недоступний (приватний режим тощо) — вважаємо, що сесії немає
  }
  return false;
}

/** Чи схоже, що користувач щойно повернувся з OAuth-провайдера */
export function looksLikeOAuthReturn() {
  if (typeof window === "undefined") return false;
  return /[?&#](code|access_token)=/.test(
    window.location.search + window.location.hash
  );
}

/**
 * access_token поточної сесії або null (гість). Не завантажує supabase-js,
 * якщо збереженої сесії немає — гостьові конвертації йдуть без нього.
 */
export async function getAccessToken() {
  if (!supabaseConfigured || !hasStoredSession()) return null;
  try {
    const supabase = await getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null; // сесію не вдалося отримати — працюємо як гість
  }
}
