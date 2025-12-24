import { supabase } from "./supabaseClient.js";

export const BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "profiles";

export const getPublicProfileUrl = (path) => {
  if (!supabase || !path) return "";
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
};

export const uploadProfileAsset = async ({ file, path }) => {
  if (!supabase) {
    return { error: new Error("Supabase not configured") };
  }
  return supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
};

export const formatBucketError = (error) => {
  if (!error?.message) return "";
  if (error.message.toLowerCase().includes("bucket not found")) {
    return `Storage bucket '${BUCKET}' not found. Create it in Supabase → Storage, or set VITE_SUPABASE_STORAGE_BUCKET.`;
  }
  return error.message;
};
