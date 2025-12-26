import { supabase } from "./supabaseClient.js";

export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const generateUniqueSlug = async (emailAddress) => {
  const base = slugify(emailAddress.split("@")[0] || "performer");
  let slug = base || `performer-${Math.floor(Math.random() * 10000)}`;

  for (let i = 0; i < 5; i += 1) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) {
      break;
    }

    slug = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return slug;
};

export const ensureProfileForUser = async (user) => {
  if (!supabase || !user?.id) {
    return;
  }

  const emailAddress = user.email || "";
  const { data: existing, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  let payload = { id: user.id, email: emailAddress };

  if (!existing) {
    const slug = await generateUniqueSlug(emailAddress);
    const displayName = emailAddress.split("@")[0] || "Performer";
    payload = {
      ...payload,
      display_name: displayName,
      slug,
      is_published: false,
    };
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (upsertError) {
    throw upsertError;
  }
};
