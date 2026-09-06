import { createClient } from "@supabase/supabase-js";

// УВАГА: SUPABASE_SERVICE_ROLE_KEY — це секретний ключ з повними правами.
// Він задається ТІЛЬКИ як змінна середовища на Vercel (без префіксу VITE_,
// щоб Vite ніколи не запакував його у клієнтський бандл) і використовується
// лише тут, на сервері.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Відсутні SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY у змінних середовища сервера"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
