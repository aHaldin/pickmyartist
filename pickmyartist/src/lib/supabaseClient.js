import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (import.meta.env.DEV) {
  console.info("Supabase env loaded", {
    url: Boolean(supabaseUrl),
    anonKey: supabaseAnonKey ? supabaseAnonKey.length : 0,
  });
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const supabaseConfigured = Boolean(supabase);