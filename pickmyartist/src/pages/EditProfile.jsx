import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import useAuth from "../hooks/useAuth.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Pill from "../components/Pill.jsx";
import {
  BUCKET,
  formatBucketError,
  getPublicProfileUrl,
  uploadProfileAsset,
} from "../lib/storage.js";

const emptyProfile = {
  display_name: "",
  slug: "",
  city: "",
  country: "",
  genres: [],
  price_from: "",
  bio: "",
  languages: [],
  phone: "",
  email_public: "",
  instagram: "",
  website: "",
  youtube: "",
  cover_url: "",
  avatar_url: "",
  avatar_path: "",
  banner_path: "",
  is_published: false,
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");

function PreviewChip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-white/70">
      {children}
    </span>
  );
}

function ProfilePreviewCard({ profile, genresInput, languagesInput }) {
  const hasLocation = profile.city || profile.country;
  const genres = genresInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const languages = languagesInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const hasBio = profile.bio?.trim();
  const bioSnippet = hasBio ? profile.bio.trim().slice(0, 240) : "";

  return (
    <Card className="lg:sticky lg:top-24 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">
        Live preview
      </p>
      {profile.display_name && (
        <h3 className="mt-3 text-xl font-semibold text-white">
          {profile.display_name}
        </h3>
      )}
      {hasLocation && (
        <p className="mt-1 text-sm text-white/60">
          {[profile.city, profile.country].filter(Boolean).join(", ")}
        </p>
      )}
      {genres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <PreviewChip key={genre}>{genre}</PreviewChip>
          ))}
        </div>
      )}
      {languages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {languages.map((language) => (
            <PreviewChip key={language}>{language}</PreviewChip>
          ))}
        </div>
      )}
      {profile.price_from && (
        <div className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
          From £{Number(profile.price_from).toLocaleString()}
        </div>
      )}
      {hasBio && (
        <p className="mt-4 text-sm text-white/70">
          {bioSnippet}
          {profile.bio.trim().length > 240 ? "…" : ""}
        </p>
      )}
      {profile.slug && (
        <Link to={`/a/${profile.slug}`} className="mt-5 inline-flex">
          <Button variant="secondary" className="px-5 py-2">
            View public profile
          </Button>
        </Link>
      )}
    </Card>
  );
}

export default function EditProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [genresInput, setGenresInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState({
    avatar: { uploading: false, error: "" },
    banner: { uploading: false, error: "" },
  });
  const [storageWarning, setStorageWarning] = useState("");
  const [initialSlug, setInitialSlug] = useState("");
  const bioLength = profile.bio?.length ?? 0;
  const bioTooShort = bioLength > 0 && bioLength < 120;
  const bioTooLong = bioLength > 800;
  const [savedIndicator, setSavedIndicator] = useState(false);

  const formattedGenres = useMemo(
    () => profile.genres?.join(", ") ?? "",
    [profile.genres]
  );

  const formattedLanguages = useMemo(
    () => profile.languages?.join(", ") ?? "",
    [profile.languages]
  );

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!supabase) {
        if (mounted) {
          setStatus((current) => ({ ...current, loading: false }));
        }
        return;
      }

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authUser || authError) {
        if (mounted) {
          setStatus((current) => ({
            ...current,
            loading: false,
            error: authError?.message || "You must be logged in to edit.",
          }));
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!mounted) return;

      if (error) {
        setStatus((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
        return;
      }

      if (!data) {
        setProfile({
          ...emptyProfile,
          display_name: authUser.email?.split("@")[0] || "Performer",
          slug: authUser.email?.split("@")[0]?.toLowerCase() || "performer",
        });
        setInitialSlug("");
        setGenresInput("");
        setLanguagesInput("");
      } else {
        setProfile({
          ...emptyProfile,
          ...data,
          display_name: data.display_name ?? "",
          slug: data.slug ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          bio: data.bio ?? "",
          email_public: data.email_public ?? "",
          instagram: data.instagram ?? "",
          website: data.website ?? "",
          youtube: data.youtube ?? "",
          phone: data.phone ?? "",
          cover_url: data.cover_url ?? "",
          avatar_url: data.avatar_url ?? "",
          avatar_path: data.avatar_path ?? "",
          banner_path: data.banner_path ?? "",
          price_from: data.price_from ?? "",
        });
        setInitialSlug(data.slug ?? "");
        setGenresInput(data.genres?.join(", ") ?? "");
        setLanguagesInput(data.languages?.join(", ") ?? "");
      }

      setStatus((current) => ({
        ...current,
        loading: false,
        error: "",
      }));
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (formattedGenres !== genresInput) {
      setGenresInput(formattedGenres);
    }
  }, [formattedGenres]);

  useEffect(() => {
    if (formattedLanguages !== languagesInput) {
      setLanguagesInput(formattedLanguages);
    }
  }, [formattedLanguages]);

  useEffect(() => {
    if (saveStatus === "saved") {
      setSavedIndicator(true);
      const timer = setTimeout(() => {
        setSavedIndicator(false);
        setSaveStatus("");
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveStatus]);

  const updateField = (field) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveStatus("");
    setStatus((current) => ({ ...current, error: "" }));

    if (!supabase) {
      setStatus((current) => ({
        ...current,
        error: "Supabase is not configured.",
      }));
      setIsSaving(false);
      return;
    }

    if ((profile.bio || "").trim().length === 0) {
      setStatus((current) => ({
        ...current,
        error: "Bio is required to save your profile.",
      }));
      setIsSaving(false);
      return;
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authUser || authError) {
      setStatus((current) => ({
        ...current,
        error: authError?.message || "You must be logged in to save.",
      }));
      setIsSaving(false);
      return;
    }

    const basePayload = {
      id: authUser.id,
      display_name:
        profile.display_name?.trim() ||
        authUser.email?.split("@")[0] ||
        "Artist",
      slug: (profile.slug || "").trim(),
      city: (profile.city || "").trim(),
      country: (profile.country || "").trim(),
      email_public: (profile.email_public || "").trim(),
      genres: genresInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      languages: languagesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      price_from: profile.price_from ? Number(profile.price_from) : null,
      bio: profile.bio?.trim().slice(0, 800) || "",
      phone: (profile.phone || "").trim(),
      instagram: (profile.instagram || "").trim(),
      website: (profile.website || "").trim(),
      youtube: (profile.youtube || "").trim(),
      cover_url: (profile.cover_url || "").trim(),
      avatar_url: (profile.avatar_url || "").trim(),
      avatar_path: profile.avatar_path || null,
      banner_path: profile.banner_path || null,
      is_published: Boolean(profile.is_published),
    };

    const payload = Object.fromEntries(
      Object.entries(basePayload).filter(
        ([, value]) => value !== null && value !== undefined
      )
    );

    const { data: existing, error: existsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existsError) {
      setStatus((current) => ({
        ...current,
        error: existsError.message,
      }));
      setIsSaving(false);
      return;
    }

    const generatedSlug =
      slugify(payload.slug || payload.display_name || "") ||
      `artist-${authUser.id.slice(0, 8)}`;

    if (!existing || !payload.slug) {
      payload.slug = generatedSlug;
    }

    if (existing && payload.slug && payload.slug !== initialSlug) {
      const { data: slugMatch } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", payload.slug)
        .neq("id", authUser.id)
        .maybeSingle();

      if (slugMatch) {
        setStatus((current) => ({
          ...current,
          error: "That slug is already taken. Try another.",
        }));
        setIsSaving(false);
        return;
      }
    }

    if (existing && payload.slug === initialSlug) {
      delete payload.slug;
    }

    if (import.meta.env.DEV) {
      console.log("Save payload", payload);
    }

    const query = existing
      ? supabase.from("profiles").update(payload).eq("id", authUser.id)
      : supabase.from("profiles").insert(payload);

    const { data, error } = await query.select().single();

    if (import.meta.env.DEV) {
      console.log("Save result", { data, error });
    }

    if (error) {
      setStatus((current) => ({
        ...current,
        error: error.message,
      }));
      setIsSaving(false);
      return;
    }

    if (data) {
      setProfile({ ...emptyProfile, ...data });
      setGenresInput(data.genres?.join(", ") ?? "");
      setLanguagesInput(data.languages?.join(", ") ?? "");
    }

    setStatus((current) => ({
      ...current,
      error: "",
    }));
    setSaveStatus("saved");
    setIsSaving(false);
  };

  const handleUpload = (type) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!supabase) {
      setStatus((current) => ({
        ...current,
        error: "Supabase is not configured.",
      }));
      return;
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authUser || authError) {
      setStatus((current) => ({
        ...current,
        error: authError?.message || "You must be logged in to upload.",
      }));
      return;
    }

    setUploadStatus((current) => ({
      ...current,
      [type]: { uploading: true, error: "" },
    }));

    const extension = file.name.split(".").pop() || "jpg";
    const path = `${type}s/${authUser.id}-${Date.now()}.${extension}`;

    const { error: uploadError } = await uploadProfileAsset({ file, path });

    if (uploadError) {
      setUploadStatus((current) => ({
        ...current,
        [type]: { uploading: false, error: formatBucketError(uploadError) },
      }));
      if (uploadError.message?.toLowerCase().includes("bucket not found")) {
        setStorageWarning(
          `Storage bucket '${BUCKET}' not found. Create it in Supabase → Storage, or set VITE_SUPABASE_STORAGE_BUCKET.`
        );
      }
      return;
    }

    const updatePayload =
      type === "avatar" ? { avatar_path: path } : { banner_path: path };

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!existing) {
      setUploadStatus((current) => ({
        ...current,
        [type]: {
          uploading: false,
          error: "Save your profile basics before uploading images.",
        },
      }));
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) {
      setUploadStatus((current) => ({
        ...current,
        [type]: { uploading: false, error: error.message },
      }));
      return;
    }

    if (data) {
      setProfile({ ...emptyProfile, ...data });
    }

    setUploadStatus((current) => ({
      ...current,
      [type]: { uploading: false, error: "" },
    }));
  };

  useEffect(() => {
    const checkBucket = async () => {
      if (!supabase) return;
      const { error } = await supabase.storage.from(BUCKET).list("", {
        limit: 1,
      });
      if (error?.message?.toLowerCase().includes("bucket not found")) {
        setStorageWarning(
          `Storage bucket '${BUCKET}' not found. Create it in Supabase → Storage, or set VITE_SUPABASE_STORAGE_BUCKET.`
        );
      }
    };

    checkBucket();
  }, []);

  if (!supabase) {
    return (
      <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <Card className="p-8 text-white/70">
          Supabase is not configured. Connect your project to edit a profile.
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 pb-28">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Edit your profile</h1>
        <p className="text-sm text-white/60">
          Keep your profile current so planners can book you faster.
        </p>
      </div>
      {storageWarning && (
        <Card className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {storageWarning}
        </Card>
      )}

      {status.loading ? (
        <Card className="px-6 py-12 text-center text-white/70">
          Loading profile...
        </Card>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <form
            className="flex flex-col gap-6 lg:col-span-7"
            onSubmit={handleSave}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white">Basics</h2>
              <p className="mt-1 text-sm text-white/60">
                The essentials planners will see first.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="display-name" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Display name
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={profile.display_name ?? ""}
                    onChange={updateField("display_name")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={profile.city ?? ""}
                    onChange={updateField("city")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={profile.country ?? ""}
                    onChange={updateField("country")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email-public" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Public email
                  </label>
                  <input
                    id="email-public"
                    type="email"
                    value={profile.email_public ?? ""}
                    onChange={updateField("email_public")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white">Tags</h2>
              <p className="mt-1 text-sm text-white/60">
                Help planners filter and compare quickly.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="genres" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Genres
                  </label>
                  <input
                    id="genres"
                    type="text"
                    value={genresInput ?? ""}
                    onChange={(event) => setGenresInput(event.target.value)}
                    placeholder="Pop, Soul, Acoustic"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <p className="mt-2 text-xs text-white/40">Comma separated</p>
                </div>
                <div>
                  <label htmlFor="languages" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Languages
                  </label>
                  <input
                    id="languages"
                    type="text"
                    value={languagesInput ?? ""}
                    onChange={(event) => setLanguagesInput(event.target.value)}
                    placeholder="English, Swedish"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <p className="mt-2 text-xs text-white/40">Comma separated</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white">Pricing</h2>
              <p className="mt-1 text-sm text-white/60">
                Share a starting point to qualify enquiries.
              </p>
              <div className="mt-4">
                <label htmlFor="price-from" className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Price from (£)
                </label>
                <input
                  id="price-from"
                  type="number"
                    value={profile.price_from ?? ""}
                  onChange={updateField("price_from")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Bio</h2>
                <span
                  className={`text-xs ${
                    bioTooLong
                      ? "text-red-300"
                      : bioLength >= 700
                        ? "text-amber-300"
                        : "text-white/50"
                  }`}
                >
                  {bioLength} / 800 characters
                </span>
              </div>
              <p className="mt-1 text-sm text-white/60">
                Highlight your signature sound and experience.
              </p>
              <label htmlFor="bio" className="sr-only">
                Bio
              </label>
              <textarea
                id="bio"
                rows={5}
                placeholder="Example: Award-winning vocalist blending soul and pop. Available for luxury weddings and corporate events with full live band or stripped-back set."
                value={profile.bio ?? ""}
                maxLength={800}
                onChange={updateField("bio")}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {bioTooShort && (
                <p className="mt-2 text-xs text-amber-200">
                  Add a bit more detail so planners understand your style and
                  experience.
                </p>
              )}
              {bioTooLong && (
                <p className="mt-2 text-xs text-red-200">
                  Keep your bio under 800 characters for best readability.
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white">Links & Media</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Avatar image
                  </label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {profile.avatar_path ? (
                        <img
                          src={getPublicProfileUrl(profile.avatar_path)}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload("avatar")}
                      className="text-xs text-white/60"
                    />
                  </div>
                  {uploadStatus.avatar.uploading && (
                    <p className="mt-2 text-xs text-white/60">Uploading...</p>
                  )}
                  {uploadStatus.avatar.error && (
                    <p className="mt-2 text-xs text-red-200">
                      {uploadStatus.avatar.error}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Banner image
                  </label>
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {profile.banner_path ? (
                        <img
                          src={getPublicProfileUrl(profile.banner_path)}
                          alt="Banner preview"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload("banner")}
                      className="text-xs text-white/60"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Recommended size: 1600 x 600. We’ll auto-crop to fit.
                  </p>
                  {uploadStatus.banner.uploading && (
                    <p className="mt-2 text-xs text-white/60">Uploading...</p>
                  )}
                  {uploadStatus.banner.error && (
                    <p className="mt-2 text-xs text-red-200">
                      {uploadStatus.banner.error}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={profile.phone ?? ""}
                    onChange={updateField("phone")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="instagram" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Instagram
                  </label>
                  <input
                    id="instagram"
                    type="text"
                    value={profile.instagram ?? ""}
                    onChange={updateField("instagram")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Website
                  </label>
                  <input
                    id="website"
                    type="text"
                    value={profile.website ?? ""}
                    onChange={updateField("website")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="youtube" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    YouTube
                  </label>
                  <input
                    id="youtube"
                    type="text"
                    value={profile.youtube ?? ""}
                    onChange={updateField("youtube")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="cover-url" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Cover image URL
                  </label>
                  <input
                    id="cover-url"
                    type="text"
                    value={profile.cover_url ?? ""}
                    onChange={updateField("cover_url")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="avatar-url" className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Avatar image URL
                  </label>
                  <input
                    id="avatar-url"
                    type="text"
                    value={profile.avatar_url ?? ""}
                    onChange={updateField("avatar_url")}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white">Publishing</h2>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.is_published}
                    onChange={updateField("is_published")}
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                  />
                  Publish my profile
                </label>
              </div>
            </Card>

            {status.error && (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                {status.error}
              </p>
            )}
          </form>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <ProfilePreviewCard
              profile={profile}
              genresInput={genresInput}
              languagesInput={languagesInput}
            />
          </div>
        </div>
      )}

      <div className="sticky bottom-4">
        <Card className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm text-white/60">
            {savedIndicator ? "Saved ✓" : "Changes save to your live profile."}
          </div>
          <div className="flex items-center gap-3">
            {savedIndicator && (
              <span className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Saved ✓
              </span>
            )}
            <Button
              type="submit"
              className="px-6 py-3"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
