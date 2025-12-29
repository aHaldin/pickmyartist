import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArtistCard from "../components/ArtistCard.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Pill from "../components/Pill.jsx";
import { supabase } from "../lib/supabaseClient.js";
import SEO from "../components/SEO.jsx";
import useAuth from "../hooks/useAuth.js";

export default function Artists() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [activeGenres, setActiveGenres] = useState([]);
  const [sortOrder, setSortOrder] = useState("recommended");
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return undefined;
    let mounted = true;

    const loadArtists = async () => {
      setLoading(true);
      setError("");

      if (!supabase) {
        if (mounted) {
          setArtists([]);
          setError("Supabase is not configured.");
          setLoading(false);
        }
        return;
      }

      const baseQuery = supabase
        .from("profiles")
        .select(
          "id, display_name, slug, city, country, genres, price_from, bio, avatar_path, banner_path, is_published"
        )
        .order("created_at", { ascending: false });

      const queryWithScope = user?.id
        ? baseQuery.or(`is_published.eq.true,id.eq.${user.id}`)
        : baseQuery.eq("is_published", true);

      const { data, error: fetchError } = await queryWithScope;

      if (mounted) {
        if (fetchError) {
          setError(fetchError.message);
          setArtists([]);
        } else {
          setArtists(data ?? []);
        }
        setLoading(false);
      }
    };

    loadArtists();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  const genres = useMemo(() => {
    const set = new Set();
    artists.forEach((artist) => {
      artist.genres?.forEach((genre) => set.add(genre));
    });
    return Array.from(set).sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let result = artists.map((artist, index) => ({
      ...artist,
      rating: artist.rating ?? Number((4.8 + (index % 3) * 0.1).toFixed(1)),
    })).filter((artist) => {
      const searchable = [
        artist.display_name,
        artist.city,
        artist.country,
        (artist.genres || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 || searchable.includes(normalizedQuery);

      const matchesGenres =
        activeGenres.length === 0 ||
        artist.genres?.some((genre) => activeGenres.includes(genre));

      return matchesSearch && matchesGenres;
    });

    if (sortOrder === "price") {
      result = result.slice().sort((a, b) => {
        const aPrice = a.price_from ?? Number.MAX_SAFE_INTEGER;
        const bPrice = b.price_from ?? Number.MAX_SAFE_INTEGER;
        return aPrice - bPrice;
      });
    }

    if (sortOrder === "rating") {
      result = result.slice().sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [activeGenres, artists, query, sortOrder]);

  const hasFilters = activeGenres.length > 0 || query.trim().length > 0;

  const toggleGenre = (genre) => {
    setActiveGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  };

  return (
    <>
      <SEO
        title="PickMyArtist - Browse performers"
        description="Browse live musicians, singers, DJs, and bands ready for weddings, events, and venues."
        canonical="/artists"
      />
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-12">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Book live performers
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Find the right talent for your event, fast.
          </h1>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-end">
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
            <div className="w-full lg:max-w-xs">
              <label className="text-xs uppercase tracking-[0.25em] text-white/50">
                Sort
              </label>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="mt-2 w-full rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="recommended">Recommended</option>
                <option value="price">Price low-high</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-white/60">
            {filteredArtists.length} performers
          </div>
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
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              className="px-4 py-1 text-[11px]"
              onClick={() => {
                setQuery("");
                setActiveGenres([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card className="px-6 py-12 text-center text-white/70">
          Loading performers...
        </Card>
      ) : error ? (
        <Card className="px-6 py-12 text-center text-white/70">{error}</Card>
      ) : filteredArtists.length === 0 ? (
        <Card className="px-6 py-12 text-center text-white/70">
          <p className="text-lg text-white">
            We are curating the first wave of performers.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Try clearing filters, or get notified as new profiles go live.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="px-5 py-2"
              onClick={() => {
                setQuery("");
                setActiveGenres([]);
              }}
            >
              Clear filters
            </Button>
            <a href="mailto:hello@pickmyartist.com">
              <Button type="button" className="px-5 py-2">
                Get booking updates
              </Button>
            </a>
            <Link to="/signup">
              <Button type="button" variant="secondary" className="px-5 py-2">
                Are you a performer?
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist, index) => (
            <ArtistCard
              key={artist.slug}
              artist={artist}
              rating={artist.rating.toFixed(1)}
              verified={index % 2 === 0}
            />
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-r from-[#8A2BE2]/15 via-white/5 to-[#FF2D95]/15 px-8 py-10 text-center shadow-[0_0_30px_rgba(138,43,226,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Are you a performer?
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Create a free profile and get booked for better events.
        </h2>
        <Link to="/signup" className="mt-6 inline-flex">
          <Button className="px-6 py-3">Create your free profile</Button>
        </Link>
      </Card>
      </section>
    </>
  );
}
