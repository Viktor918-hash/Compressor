import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

// Ліміти конвертацій на добу (UTC, скидається опівночі за UTC).
export const GUEST_DAILY_LIMIT = 3;
export const USER_DAILY_LIMIT = 6; // 3 гостьових + 3 додаткові за реєстрацію

/**
 * Розгортає IPv6-адресу до 8 груп (без "::") і повертає перші 4 групи —
 * це /64, найменша мережа, яку зазвичай віддають одному абоненту. Інакше
 * користувач з IPv6 має мільярди «різних» адрес і обходить ліміт.
 */
export function ipv6Prefix64(ip) {
  const zoneless = ip.split("%")[0];
  const [head, tail] = zoneless.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const hasGap = zoneless.includes("::");
  const missing = 8 - headParts.length - tailParts.length;
  const full = hasGap
    ? [...headParts, ...Array(Math.max(missing, 0)).fill("0"), ...tailParts]
    : headParts;
  return full
    .slice(0, 4)
    .map((g) => (g || "0").toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":");
}

/**
 * IP клієнта. На Vercel заголовки x-real-ip / x-forwarded-for виставляє
 * платформа (вона перезаписує значення, надіслані клієнтом), тож їм можна
 * довіряти. Заголовок X-Anon-Id, який клієнт вигадує сам, для ліміту
 * НЕ використовується (його можна міняти в кожному запиті).
 */
export function getClientIp(req) {
  const h = req.headers || {};
  const candidate =
    h["x-real-ip"] ||
    h["x-vercel-forwarded-for"] ||
    (h["x-forwarded-for"] || "").split(",")[0] ||
    req.socket?.remoteAddress ||
    "";
  const ip = String(candidate).trim();
  if (!ip) return "unknown";
  // IPv4-mapped IPv6 (::ffff:1.2.3.4) → звичайний IPv4
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  return ip.includes(":") ? ipv6Prefix64(ip) : ip;
}

/** Ідентифікатор гостя = хеш IP (сирі IP у базі не зберігаємо). */
export function guestIdentifier(req) {
  const ip = getClientIp(req);
  const hash = createHash("sha256")
    .update(`${process.env.LIMIT_HASH_SALT || "cp"}:${ip}`)
    .digest("hex")
    .slice(0, 32);
  return `ip:${hash}`;
}

/**
 * Визначає, хто робить запит:
 *  - якщо в заголовку Authorization є валідний Supabase access token —
 *    зареєстрований користувач, ідентифікатор "user:<id>", ліміт 6/день;
 *  - інакше — гість, ідентифікатор "ip:<хеш IP>", ліміт 3/день.
 */
async function resolveCaller(req, supabaseAdmin, limits = {}) {
  const guestLimit = limits.guestLimit ?? GUEST_DAILY_LIMIT;
  const userLimit = limits.userLimit ?? USER_DAILY_LIMIT;
  const prefix = limits.prefix ?? "";
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user?.id) {
      return {
        identifier: `${prefix}user:${data.user.id}`,
        limit: userLimit,
        isGuest: false,
      };
    }
    // Токен є, але невалідний/протермінований — трактуємо як гостя,
    // а не як помилку 401, щоб конвертер не ламався через сесію, що
    // тихо протухла в браузері.
  }

  return {
    identifier: `${prefix}${guestIdentifier(req)}`,
    limit: guestLimit,
    isGuest: true,
  };
}

/**
 * Перевіряє й атомарно інкрементує лічильник конвертацій за сьогодні.
 * Повертає { allowed, remaining, isGuest, unavailable }.
 *
 * Fail-closed: якщо облік недоступний (Supabase не відповідає, RPC/таблиці
 * немає, не задано змінні) — конвертацію НЕ виконуємо (unavailable: true),
 * бо кожна конвертація коштує грошей у CloudConvert.
 */
export async function checkAndConsumeUsage(req) {
  return checkAndConsumeQuota(req);
}

// Ліміт тимчасових посилань на файл (round 34): окремий від конвертацій
// лічильник у тій самій таблиці conversion_usage (той самий RPC, ідентифікатор
// з префіксом "share:"), тож жодної нової міграції бази не потрібно.
export const SHARE_GUEST_DAILY_LIMIT = 5;
export const SHARE_USER_DAILY_LIMIT = 10;

export function checkAndConsumeShareQuota(req) {
  return checkAndConsumeQuota(req, {
    prefix: "share:",
    guestLimit: SHARE_GUEST_DAILY_LIMIT,
    userLimit: SHARE_USER_DAILY_LIMIT,
  });
}

/**
 * Узагальнена версія: limits = { prefix, guestLimit, userLimit } — для
 * окремих лічильників на різні дії (конвертації, посилання).
 */
export async function checkAndConsumeQuota(req, limits = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { allowed: false, remaining: 0, isGuest: true, unavailable: true };
  }

  let caller;
  try {
    caller = await resolveCaller(req, supabaseAdmin, limits);
  } catch (err) {
    console.error("resolveCaller error:", err?.message);
    return { allowed: false, remaining: 0, isGuest: true, unavailable: true };
  }
  const { identifier, limit, isGuest } = caller;

  let result;
  try {
    result = await supabaseAdmin.rpc("increment_conversion_usage", {
      p_identifier: identifier,
      p_limit: limit,
    });
  } catch (err) {
    console.error("increment_conversion_usage threw:", err?.message);
    return { allowed: false, remaining: 0, isGuest, unavailable: true };
  }

  const { data, error } = result;
  if (error) {
    console.error("increment_conversion_usage RPC error:", error.message);
    return { allowed: false, remaining: 0, isGuest, unavailable: true };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: !!row?.allowed,
    remaining: row?.remaining ?? 0,
    isGuest,
    unavailable: false,
  };
}
