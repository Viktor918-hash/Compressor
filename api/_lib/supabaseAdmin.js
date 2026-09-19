import { createClient } from "@supabase/supabase-js";

// УВАГА: SUPABASE_SERVICE_ROLE_KEY — це секретний ключ з повними правами.
// Він задається ТІЛЬКИ як змінна середовища на Vercel (без префіксу VITE_,
// щоб Vite ніколи не запакував його у клієнтський бандл) і використовується
// лише тут, на сервері.

let client = null;

/**
 * Ліниве створення клієнта: раніше createClient() викликався під час імпорту
 * модуля й кидав виняток, якщо змінних середовища немає — функція падала ще
 * до того, як могла повернути зрозумілу відповідь.
 * Повертає null, якщо змінні не налаштовані.
 */
export function getSupabaseAdmin() {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Відсутні SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY у змінних середовища сервера"
    );
    return null;
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
