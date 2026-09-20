import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  getSupabase,
  supabaseConfigured,
  hasStoredSession,
  looksLikeOAuthReturn,
} from "../lib/supabaseClient";

const AuthContext = createContext(null);

// supabase-js не налаштовано (нема VITE_SUPABASE_*): сайт працює як гість,
// а методи авторизації повертають зрозумілу помилку.
const authUnavailable = () => ({
  data: null,
  error: new Error("Auth is not configured"),
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // рядок з таблиці profiles (is_pro, тощо)
  const [loading, setLoading] = useState(supabaseConfigured);
  const initRef = useRef(null); // Promise<client|null> — ініціалізація один раз

  const loadProfile = useCallback(async (supabase, userId) => {
    if (!userId || !supabase) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Не вдалося завантажити профіль:", error.message);
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  /**
   * Завантажує supabase-js (якщо ще ні), читає початкову сесію й підписується
   * на зміни авторизації. Викликається лише коли це справді потрібно (є
   * збережена сесія / повернення з OAuth / користувач хоче увійти).
   */
  const ensureAuth = useCallback(() => {
    if (initRef.current) return initRef.current;
    initRef.current = (async () => {
      const supabase = await getSupabase();
      if (!supabase) {
        setLoading(false);
        return null;
      }
      const {
        data: { session: initial },
      } = await supabase.auth.getSession();
      setSession(initial);
      loadProfile(supabase, initial?.user?.id);
      setLoading(false);

      // Підписка на зміни авторизації (логін, логаут, оновлення токена)
      supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        loadProfile(supabase, next?.user?.id);
      });
      return supabase;
    })().catch((err) => {
      console.error("Не вдалося ініціалізувати авторизацію:", err);
      setLoading(false);
      initRef.current = null;
      return null;
    });
    return initRef.current;
  }, [loadProfile]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    if (hasStoredSession() || looksLikeOAuthReturn()) {
      ensureAuth();
    } else {
      // Гість: бібліотеку не вантажимо, доки користувач не натисне "Увійти"
      setLoading(false);
    }
  }, [ensureAuth]);

  const signUpWithEmail = async (email, password) => {
    const supabase = await ensureAuth();
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signInWithEmail = async (email, password) => {
    const supabase = await ensureAuth();
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const supabase = await ensureAuth();
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  };

  const signInWithApple = async () => {
    const supabase = await ensureAuth();
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  };

  const signOut = async () => {
    const supabase = await ensureAuth();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    const supabase = await ensureAuth();
    return loadProfile(supabase, session?.user?.id);
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isPro: !!profile?.is_pro,
    loading,
    // Дає змогу прогріти supabase-js заздалегідь (наприклад, при відкритті вікна входу)
    prepareAuth: ensureAuth,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth має використовуватись всередині <AuthProvider>");
  return ctx;
}
