import { supabaseAdmin } from "./supabaseAdmin.js";

// Ліміти конвертацій на добу (UTC, скидається опівночі за UTC).
export const GUEST_DAILY_LIMIT = 3;
export const USER_DAILY_LIMIT = 6; // 3 гостьових + 3 додаткові за реєстрацію

/**
 * Визначає, хто робить запит:
 *  - якщо в заголовку Authorization є валідний Supabase access token —
 *    зареєстрований користувач, ідентифікатор "user:<id>", ліміт 6/день;
 *  - інакше — гість, ідентифікатор "anon:<anonId>" (з заголовка X-Anon-Id,
 *    або, якщо його чомусь нема, з IP), ліміт 3/день.
 */
async function resolveCaller(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user?.id) {
      return {
        identifier: `user:${data.user.id}`,
        limit: USER_DAILY_LIMIT,
        isGuest: false,
      };
    }
    // Токен є, але невалідний/протермінований — трактуємо як гостя,
    // а не як помилку 401, щоб конвертер не ламався через сесію, що
    // тихо протухла в браузері.
  }

  const anonId =
    req.headers["x-anon-id"] ||
    req.headers["X-Anon-Id"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  return {
    identifier: `anon:${anonId}`,
    limit: GUEST_DAILY_LIMIT,
    isGuest: true,
  };
}

/**
 * Перевіряє й атомарно інкрементує лічильник конвертацій за сьогодні.
 * Повертає { allowed, remaining, isGuest }.
 */
export async function checkAndConsumeUsage(req) {
  const { identifier, limit, isGuest } = await resolveCaller(req);

  const { data, error } = await supabaseAdmin.rpc(
    "increment_conversion_usage",
    { p_identifier: identifier, p_limit: limit }
  );

  if (error) {
    // Якщо облік лімітів раптом недоступний (напр. таблицю ще не
    // створили) — краще пропустити конвертацію, ніж покласти весь
    // сервіс, але залогувати проблему для діагностики.
    console.error("increment_conversion_usage RPC error:", error.message);
    return { allowed: true, remaining: null, isGuest };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: !!row?.allowed,
    remaining: row?.remaining ?? 0,
    isGuest,
  };
}
