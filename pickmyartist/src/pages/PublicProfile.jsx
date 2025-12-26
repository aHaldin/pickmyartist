import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";
import { getPublicProfileUrl } from "../lib/storage.js";
import SEO from "../components/SEO.jsx";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export default function PublicProfile() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const canonicalPath = slug ? `/a/${slug}` : "/";
  const profileName = profile?.display_name?.trim();
  const profileLocation = [profile?.city, profile?.country]
    .filter(Boolean)
    .join(", ");
  const profileGenres = (profile?.genres || []).filter(Boolean).slice(0, 3);
  const profileSummaryParts = [];
  if (profileLocation) profileSummaryParts.push(profileLocation);
  if (profileGenres.length > 0) profileSummaryParts.push(profileGenres.join(", "));

  const seoTitle = profileName ? `PickMyArtist - ${profileName}` : undefined;
  const seoDescription = profile?.bio?.trim()
    ? profile.bio.trim().slice(0, 160)
    : profileName
      ? `${profileName}${
          profileSummaryParts.length > 0
            ? ` - ${profileSummaryParts.join(", ")}`
            : ""
        }. Contact directly on PickMyArtist.`
      : undefined;
  const seoImage =
    getPublicProfileUrl(profile?.banner_path) ||
    getPublicProfileUrl(profile?.avatar_path) ||
    undefined;

  const initials = useMemo(() => {
    if (!profile?.display_name) return "";
    return getInitials(profile.display_name);
  }, [profile]);

  if (loading) {
    return (
      <>
        <SEO
          title={seoTitle}
          description={seoDescription}
          canonical={canonicalPath}
          ogImage={seoImage}
        />
        <section className="mx-auto w-full max-w-5xl px-6 py-12">
          <Card className="p-6">
            <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-32 w-full animate-pulse rounded-3xl bg-white/10" />
          </Card>
        </section>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <SEO canonical={canonicalPath} />
        <section className="mx-auto w-full max-w-5xl px-6 py-12">
          <Card className="p-8 text-white/70">
            {error || "Profile not found."}
          </Card>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalPath}
        ogImage={seoImage}
      />
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <Card className="overflow-hidden">
          <div className="relative h-[200px] w-full overflow-hidden rounded-3xl sm:h-[240px] lg:h-[280px]">
            {profile.banner_path ? (
              <img
                src={getPublicProfileUrl(profile.banner_path)}
                alt={profile.display_name}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/45 via-white/5 to-[#FF2D95]/35" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "4px 4px",
              }}
            />
            <div className="absolute bottom-5 left-6 right-6 flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-lg font-semibold text-white shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                {profile.avatar_path ? (
                  <img
                    src={getPublicProfileUrl(profile.avatar_path)}
                    alt={profile.display_name}
                    className="h-full w-full rounded-3xl object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  {profile.display_name}
                </h1>
                {(profile.city || profile.country) && (
                  <p className="text-sm text-white/70">
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 p-6">
            {profile.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.genres.map((genre) => (
                  <Pill key={genre}>{genre}</Pill>
                ))}
              </div>
            )}
            {profile.languages?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((language) => (
                  <Pill key={language}>{language}</Pill>
                ))}
              </div>
            )}
            {profile.price_from && (
              <div className="inline-flex rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                From £{Number(profile.price_from).toLocaleString()}
              </div>
            )}
            {profile.bio && (
              <p className="text-sm text-white/70">{profile.bio}</p>
            )}
            {profile.email_public && (
              <a href={`mailto:${profile.email_public}`}>
                <Button className="px-6 py-3">Contact</Button>
              </a>
            )}
          </div>
        </Card>
      </section>
    </>
  );
}
