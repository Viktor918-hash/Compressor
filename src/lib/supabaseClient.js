import { createClient } from "@supabase/supabase-js";

// Значення беруться з .env (Vite: змінні мають починатись з VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Клієнт Supabase або null, якщо змінні середовища не задано.
 *
 * Раніше createClient(undefined, undefined) кидав виняток під час імпорту —
 * весь застосунок не монтувався (білий екран у preview-деплої без змінних,
 * а prerender-збірка падала з незрозумілим "prerender-ready timeout").
 * Тепер сайт працює без авторизації, а код, якому потрібен Supabase,
 * перевіряє `if (!supabase)`.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
  console.warn(
    "Supabase вимкнено: не задано VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Авторизація недоступна."
  );
}
