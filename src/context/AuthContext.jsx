import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

// supabase === null, коли не задано VITE_SUPABASE_* (див. lib/supabaseClient.js):
// сайт працює як гість, а методи авторизації повертають зрозумілу помилку.
const authUnavailable = () => ({
  data: null,
  error: new Error("Auth is not configured"),
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // рядок з таблиці profiles (is_pro, тощо)
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
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

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    // Початкова сесія при завантаженні сторінки
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadProfile(session?.user?.id);
      setLoading(false);
    });

    // Підписка на зміни авторизації (логін, логаут, оновлення токена)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        loadProfile(session?.user?.id);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUpWithEmail = async (email, password) => {
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signInWithEmail = async (email, password) => {
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  };

  const signInWithApple = async () => {
    if (!supabase) return authUnavailable();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const refreshProfile = () => loadProfile(session?.user?.id);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isPro: !!profile?.is_pro,
    loading,
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
