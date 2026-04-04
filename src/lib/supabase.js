import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSecretKey = (key) => {
  if (!key) {
    return false;
  }

  if (key.startsWith("sb_secret_")) {
    return true;
  }

  const jwtParts = key.split(".");

  if (jwtParts.length !== 3 || typeof window === "undefined") {
    return false;
  }

  try {
    const payload = JSON.parse(window.atob(jwtParts[1]));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
};

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL nao foi definida.");
}

if (!supabaseAnonKey || isSecretKey(supabaseAnonKey)) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY deve usar apenas a chave anon publica do Supabase no frontend."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
