import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Pill from "../components/Pill.jsx";
import { getPublicProfileUrl } from "../lib/storage.js";
import SEO from "../components/SEO.jsx";

const bannerFallbackClass =
  "bg-gradient-to-br from-[#8A2BE2]/35 via-white/10 to-[#FF2D95]/30";

export default function ArtistProfile() {
  const { slug } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState("idle");
  const [enquiryError, setEnquiryError] = useState("");
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    message: "",
    eventDate: "",
    eventLocation: "",
    budget: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadArtist = async () => {
      setLoading(true);
      setError("");

      if (!supabase) {
        if (mounted) {
          setError("Supabase is not configured.");
          setArtist(null);
          setLoading(false);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (mounted) {
        if (fetchError) {
          setError(fetchError.message);
          setArtist(null);
        } else {
          setArtist(data ?? null);
        }
        setLoading(false);
      }
    };

    loadArtist();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const canonicalPath = slug ? `/artist/${slug}` : "/artists";
  const artistName = artist?.display_name?.trim();
  const artistLocation = [artist?.city, artist?.country]
    .filter(Boolean)
    .join(", ");
  const artistGenres = (artist?.genres || []).filter(Boolean).slice(0, 3);
  const artistSummaryParts = [];
  if (artistLocation) artistSummaryParts.push(artistLocation);
  if (artistGenres.length > 0) artistSummaryParts.push(artistGenres.join(", "));

  const seoTitle = artistName ? `PickMyArtist - ${artistName}` : undefined;
  const seoDescription = artist?.bio?.trim()
    ? artist.bio.trim().slice(0, 160)
    : artistName
      ? `${artistName}${
          artistSummaryParts.length > 0
            ? ` - ${artistSummaryParts.join(", ")}`
            : ""
        }. Book directly on PickMyArtist.`
      : undefined;
  const seoImage =
    getPublicProfileUrl(artist?.banner_path) ||
    getPublicProfileUrl(artist?.avatar_path) ||
    undefined;

  if (loading) {
    return (
      <>
        <SEO
          title={seoTitle}
          description={seoDescription}
          canonical={canonicalPath}
          ogImage={seoImage}
        />
        <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 text-white/70">
          Loading profile...
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title={seoTitle}
          description={seoDescription}
          canonical={canonicalPath}
          ogImage={seoImage}
        />
        <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 text-white/70">
          {error}
        </section>
      </>
    );
  }

  if (!artist) {
    return (
      <>
        <SEO canonical={canonicalPath} />
        <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          <h1 className="text-3xl font-semibold text-white">
            Performer not found
          </h1>
          <p className="mt-3 text-white/70">
            We could not find a published profile for that performer.
          </p>
        </section>
      </>
    );
  }

  const handleEnquiryChange = (field) => (event) => {
    setEnquiryStatus("idle");
    setEnquiryError("");
    setEnquiryForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleEnquirySubmit = async (event) => {
    event.preventDefault();
    setEnquiryStatus("sending");
    setEnquiryError("");

    if (!supabase) {
      setEnquiryError("Supabase is not configured.");
      setEnquiryStatus("save_failed");
      return;
    }

    if (!artist?.id) {
      setEnquiryError("Missing artist profile.");
      setEnquiryStatus("save_failed");
      return;
    }

    const name = enquiryForm.name.trim();
    const email = enquiryForm.email.trim();
    const message = enquiryForm.message.trim();
    const eventDate = enquiryForm.eventDate.trim();
    const eventLocation = enquiryForm.eventLocation.trim();
    const budget = enquiryForm.budget.trim();

    if (!name || !email || !message) {
      setEnquiryError("Please complete all required fields.");
      setEnquiryStatus("save_failed");
      return;
    }

    const payload = {
      artist_id: artist.id,
      name,
      email,
      message,
      event_date: eventDate || null,
      event_location: eventLocation || null,
      budget: budget || null,
    };

    console.log("Enquiry insert payload keys", Object.keys(payload));

    if (!artist.email_public) {
      setEnquiryError("This performer is not accepting enquiries yet.");
      setEnquiryStatus("save_failed");
      return;
    }

    const { error: insertError } = await supabase
      .from("enquiries")
      .insert([payload]);

    if (insertError) {
      console.error("Enquiry insert error", {
        message: insertError.message,
        details: insertError.details,
        status: insertError.status,
        hint: insertError.hint,
        code: insertError.code,
      });
      console.log("Enquiry insert payload keys", Object.keys(payload));
      setEnquiryError(insertError.message || "Insert failed.");
      setEnquiryStatus("save_failed");
      return;
    }

    // Email provider integration: notify artist via Resend Edge Function.
    const ENABLE_EMAIL = false;

    // TODO: Enable Resend email notifications via Edge Function.
    // TODO: Move insert + email to an Edge Function to return an enquiry id.
    if (ENABLE_EMAIL) {
      console.warn("Email notifications are disabled in the client.");
    }

    setEnquiryStatus("sent");
    setEnquiryForm({
      name: "",
      email: "",
      message: "",
      eventDate: "",
      eventLocation: "",
      budget: "",
    });
  };

  const bioText = (artist.bio || "Performance details available on request.")
    .trim()
    .slice(0, 800);

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalPath}
        ogImage={seoImage}
      />
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-12">
        <Card className="overflow-hidden">
          <div className="relative h-64 sm:h-80">
            {getPublicProfileUrl(artist.banner_path) ? (
              <img
                src={getPublicProfileUrl(artist.banner_path)}
                alt={artist.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`h-full w-full ${bannerFallbackClass}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                {artist.city}
                {artist.country ? `, ${artist.country}` : ""}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                {artist.display_name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                {artist.genres?.map((genre) => (
                  <Pill key={genre} className="border-white/20 text-white/70">
                    {genre}
                  </Pill>
                ))}
              </div>
              <div className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80">
                {artist.price_from
                  ? `From £${artist.price_from.toLocaleString()}`
                  : "Pricing on request"}
              </div>
              <div className="mt-4">
                <a href="#booking">
                  <Button className="px-5 py-2">Request availability</Button>
                </a>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
                  Direct enquiry · No commission · No middlemen
                </p>
              </div>
            </div>
          </div>
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white">Bio</h2>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                {bioText
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((line, index) => (
                    <p key={line + index} className={index ? "mt-3" : ""}>
                      {line}
                    </p>
                  ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Quick facts</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Events suited for
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Ask about weddings, corporate, and private events.
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Location
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    {[artist.city, artist.country].filter(Boolean).join(", ") ||
                      "Location available on request"}
                  </p>
                </Card>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {artist.languages?.map((language) => (
                  <Pill key={language}>{language}</Pill>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Media</h2>
              <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {getPublicProfileUrl(artist.banner_path) ? (
                  <img
                    src={getPublicProfileUrl(artist.banner_path)}
                    alt={`${artist.display_name} media`}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className={`h-64 w-full ${bannerFallbackClass}`} />
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24" id="booking">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                Starting from
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {artist.price_from
                  ? `£${artist.price_from.toLocaleString()}`
                  : "Pricing on request"}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Request availability
              </p>
              <p className="mt-3 text-sm text-white/70">
                Send a quick enquiry and get a direct response.
              </p>
              <form className="mt-4 flex flex-col gap-3" onSubmit={handleEnquirySubmit}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={enquiryForm.name}
                  onChange={handleEnquiryChange("name")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={enquiryForm.email}
                  onChange={handleEnquiryChange("email")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
                <textarea
                  rows={3}
                  placeholder="Tell us about your event"
                  value={enquiryForm.message}
                  onChange={handleEnquiryChange("message")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <input
                    type="date"
                    value={enquiryForm.eventDate}
                    onChange={handleEnquiryChange("eventDate")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <input
                    type="text"
                    placeholder="Event location"
                    value={enquiryForm.eventLocation}
                    onChange={handleEnquiryChange("eventLocation")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <input
                    type="text"
                    placeholder="Budget (optional)"
                    value={enquiryForm.budget}
                    onChange={handleEnquiryChange("budget")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                {enquiryStatus === "save_failed" && (
                  <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {import.meta.env.DEV && enquiryError
                      ? enquiryError
                      : "Something went wrong. Please try again."}
                  </p>
                )}
                {enquiryStatus === "sent" && (
                  <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    Enquiry sent! The performer will respond directly.
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full px-5 py-3"
                  disabled={enquiryStatus === "sending"}
                >
                  {enquiryStatus === "sending" ? "Sending..." : "Request availability"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </Card>

      </section>
    </>
  );
}
