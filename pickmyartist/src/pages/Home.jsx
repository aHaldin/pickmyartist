import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { supabase, supabaseConfigured } from "../lib/supabaseClient.js";
import { getPublicProfileUrl } from "../lib/storage.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Pill from "../components/Pill.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

const steps = [
  {
    title: "Browse by style and city",
    copy: "Search singers, bands, DJs, and live musicians that fit your event.",
    icon: "🔎",
  },
  {
    title: "Compare in minutes",
    copy: "See pricing, genres, and availability in one clean view.",
    icon: "✨",
  },
  {
    title: "Request availability",
    copy: "Send a direct enquiry with no commission or middlemen.",
    icon: "✉️",
  },
];

function HeroPreviewCard() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-12 rounded-[32px] bg-gradient-to-r from-[#8A2BE2]/20 to-[#FF2D95]/20 blur-3xl" />
      <Card className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
              MR
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Midnight Riviera</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Miami, USA
              </p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            4.9 ★
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Electro", "House", "Pop"].map((genre) => (
            <Pill key={genre}>{genre}</Pill>
          ))}
        </div>
        <p className="mt-4 text-sm text-white/70">
          DJ-live hybrid with neon synths and rooftop-ready energy.
        </p>
        <div className="mt-6 flex items-center justify-between text-sm text-white/70">
          <span>From £1,500</span>
          <Button type="button" className="px-4 py-2">
            Request availability
          </Button>
        </div>
      </Card>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-7xl px-6 py-16">
      <SectionHeader
        eyebrow="How PickMyArtist works"
        title="Book live performers in three simple steps."
        subtitle="Search, shortlist, and contact performers directly."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title} className="p-6 text-left">
            <div className="text-2xl">{step.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-white/70">{step.copy}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FeaturedPerformers() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeGenres, setActiveGenres] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadFeatured = async () => {
      if (!supabase) {
        if (mounted) {
          setArtists([]);
          setLoading(false);
        }
        return;
      }

      const queryFilters = {
        is_published: true,
        order: "is_featured desc, updated_at desc",
        limit: 6,
      };

      const baseQuery = supabase
        .from("profiles")
        .select(
          "id, display_name, slug, city, country, genres, price_from, bio, avatar_path, banner_path, is_featured, created_at, updated_at"
        )
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(6);

      if (import.meta.env.DEV) {
        console.log("Homepage featured query", queryFilters);
      }

      const { data: featured, error } = await baseQuery;

      if (!mounted) return;

      if (error) {
        setArtists([]);
      } else {
        setArtists(featured ?? []);
      }
      if (import.meta.env.DEV) {
        console.log("Homepage featured rows", featured?.length ?? 0);
      }
      setLoading(false);
    };

    loadFeatured();

    return () => {
      mounted = false;
    };
  }, []);

  const genres = useMemo(() => {
    const set = new Set();
    artists.forEach((artist) => {
      (artist.genres || []).forEach((genre) => set.add(genre));
    });
    return Array.from(set).sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return artists.filter((artist) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          artist.display_name,
          artist.city,
          artist.country,
          (artist.genres || []).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesGenres =
        activeGenres.length === 0 ||
        (artist.genres || []).some((genre) => activeGenres.includes(genre));

      return matchesSearch && matchesGenres;
    });
  }, [artists, activeGenres, query]);

  const toggleGenre = (genre) => {
    setActiveGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeader
          eyebrow="Featured performers"
          title="Book live musicians, bands, DJs, and singers."
          subtitle="Trusted profiles ready for weddings, corporate events, and venues."
        />
        <Link to="/artists">
          <Button variant="secondary" className="px-5 py-2">
            View all performers
          </Button>
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-md">
          <label className="text-xs uppercase tracking-[0.25em] text-white/50">
            Search
          </label>
          <input
            type="search"
            placeholder="Search by name, city, or genre"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {genres.map((genre) => {
            const isActive = activeGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`rounded-full border px-4 py-1 text-xs uppercase tracking-widest transition ${
                  isActive
                    ? "border-transparent bg-gradient-to-r from-[#8A2BE2] to-[#FF2D95] text-white shadow-[0_0_18px_rgba(138,43,226,0.4)]"
                    : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
      {loading ? (
        <Card className="mt-8 px-6 py-12 text-center text-white/70">
          Loading performers...
        </Card>
      ) : filteredArtists.length === 0 ? (
        <Card className="mt-8 px-6 py-12 text-center text-white/70">
          We are curating the first wave of performers. Check back soon for
          launch-ready talent.
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist) => {
            const trimmedBio = (artist.bio || "").trim();
            const preview =
              trimmedBio.length > 140
                ? `${trimmedBio
                    .slice(0, 140)
                    .replace(/\\s+\\S*$/, "")
                    .trim()}…`
                : trimmedBio;

            return (
              <Card
                key={artist.slug}
                className="group p-5 transition hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(138,43,226,0.15)]"
              >
                <div className="flex items-center gap-4">
                  {getPublicProfileUrl(artist.avatar_path) ? (
                    <img
                      src={getPublicProfileUrl(artist.avatar_path)}
                      alt={artist.display_name}
                      className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
                      {artist.display_name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0].toUpperCase())
                        .join("")}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-white">
                      {artist.display_name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {[artist.city, artist.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(artist.genres || []).slice(0, 3).map((genre) => (
                    <Pill key={genre}>{genre}</Pill>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/70 line-clamp-2">
                  {preview || "No bio yet."}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm text-white/70">
                  <span>From £{artist.price_from.toLocaleString()}</span>
                  <Link to={`/artist/${artist.slug}`}>
                    <Button variant="secondary" className="px-4 py-2">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20">
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-[#8A2BE2]/20 via-white/5 to-[#FF2D95]/20 p-10 text-center backdrop-blur shadow-[0_0_40px_rgba(138,43,226,0.18)]">
        <h2 className="text-3xl font-semibold text-white">
          Ready to book a performer?
        </h2>
        <p className="mt-4 text-sm text-white/70">
          Browse verified talent and send a direct enquiry in minutes.
        </p>
        <Link to="/artists" className="mt-6 inline-flex">
          <Button className="px-6 py-3">Browse artists</Button>
        </Link>
        <p className="mt-6 text-sm text-white/60">
          Contact us at{" "}
          <a className="text-white underline" href="mailto:hello@pickmy.live">
            hello@pickmy.live
          </a>
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const ctaLink = supabaseConfigured
    ? user
      ? "/edit"
      : "/signup"
    : "/artists";

  return (
    <div className="flex flex-1 flex-col">
      <section className="hero-noise mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Book live performers in the UK
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl sm:leading-tight">
            Book live musicians with speed and confidence.
          </h1>
          <h1 className="mt-2 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-tight">
            <span className="bg-gradient-to-r from-[#8A2BE2] to-[#FF2D95] bg-clip-text text-transparent">
              Hire singers, book bands, or secure a DJ in minutes.
            </span>
          </h1>
          <p className="mt-4 text-base text-white/70">
            PickMyArtist helps planners, venues, and couples book performers for
            weddings, corporate events, and private parties without the
            back-and-forth.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link to="/artists">
              <Button className="px-6 py-3">Browse artists</Button>
            </Link>
            <Link to={ctaLink}>
              <Button variant="secondary" className="px-6 py-3">
                Are you a performer? Create a free profile
              </Button>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-white/50">
            {["Direct enquiries", "No commission", "Verified performers"].map(
              (item) => (
                <Pill key={item} className="text-white/50">
                  {item}
                </Pill>
              )
            )}
          </div>
        </div>
        <div className="flex-1">
          <HeroPreviewCard />
        </div>
      </section>

      <HowItWorks />
      <FinalCTA />
    </div>
  );
}
