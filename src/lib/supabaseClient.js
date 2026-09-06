import { createClient } from "@supabase/supabase-js";

// Значення беруться з .env (Vite: змінні мають починатись з VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Відсутні VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY у .env файлі"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
