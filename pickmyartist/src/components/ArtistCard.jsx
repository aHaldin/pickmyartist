import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import Pill from "./Pill.jsx";
import { getPublicProfileUrl } from "../lib/storage.js";

export default function ArtistCard({ artist, rating, verified }) {
  const rawBio = artist.bio || "";
  const hasBio = rawBio.trim().length > 0;
  const trimmedBio = rawBio.trim();
  const maxPreview = 130;
  const preview =
    trimmedBio.length > maxPreview
      ? `${trimmedBio
          .slice(0, maxPreview)
          .replace(/\s+\S*$/, "")
          .trim()}…`
      : trimmedBio;
  return (
    <Link
      to={`/artist/${artist.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(138,43,226,0.15)]"
      aria-label={`View ${artist.display_name}`}
    >
      <div className="relative h-44 overflow-hidden">
        {getPublicProfileUrl(artist.banner_path) ? (
          <img
            src={getPublicProfileUrl(artist.banner_path)}
            alt={artist.display_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#8A2BE2]/40 via-white/10 to-[#FF2D95]/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />
        {verified && (
          <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
            Verified
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          {getPublicProfileUrl(artist.avatar_path) ? (
            <img
              src={getPublicProfileUrl(artist.avatar_path)}
              alt={`${artist.display_name} avatar`}
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
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              {artist.city}
              {artist.country ? `, ${artist.country}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {artist.genres?.map((genre) => (
            <Pill key={genre}>{genre}</Pill>
          ))}
        </div>
        <p className="text-sm text-white/70 line-clamp-2">
          {hasBio ? preview : "No bio yet."}
        </p>
        <div className="mt-auto flex items-center justify-between text-sm text-white/70">
          <div className="flex items-center gap-3">
            <span className="text-white">
              {artist.price_from
                ? `From £${artist.price_from.toLocaleString()}`
                : "Pricing on request"}
            </span>
            {rating && (
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                ⭐ {rating}
              </span>
            )}
          </div>
          <span className="opacity-0 transition group-hover:opacity-100">
            <Button variant="secondary" className="px-4 py-2">
              View profile
            </Button>
          </span>
        </div>
      </div>
    </Link>
  );
}
