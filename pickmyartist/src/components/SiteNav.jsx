import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { supabase, supabaseConfigured } from "../lib/supabaseClient.js";
import Button from "./Button.jsx";

const linkClass = ({ isActive }) =>
  `text-sm uppercase tracking-wide transition-colors ${
    isActive
      ? "text-white underline decoration-white/40 underline-offset-8"
      : "text-white/70 hover:text-white"
  }`;

export default function SiteNav() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileSlug, setProfileSlug] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!supabase || !user?.id) {
      setProfileSlug("");
      return undefined;
    }

    supabase
      .from("profiles")
      .select("slug")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (mounted) {
          setProfileSlug(data?.slug ?? "");
        }
      })
      .catch(() => {
        if (mounted) {
          setProfileSlug("");
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <NavLink to="/" className="text-lg font-semibold tracking-wide text-white">
          PickMy
          <span className="bg-gradient-to-r from-[#8A2BE2] to-[#FF2D95] bg-clip-text text-transparent">
            Artist
          </span>
        </NavLink>
        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {supabaseConfigured && user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/edit" className={linkClass}>
                Edit profile
              </NavLink>
              {profileSlug ? (
                <NavLink to={`/artist/${profileSlug}`} className={linkClass}>
                  View public profile
                </NavLink>
              ) : (
                <span className="text-sm uppercase tracking-wide text-white/40">
                  View public profile
                </span>
              )}
            </>
          ) : (
            <>
              <NavLink to="/artists" className={linkClass}>
                Browse artists
              </NavLink>
              <a href="/#how-it-works" className="text-sm uppercase tracking-wide text-white/70 hover:text-white">
                How it works
              </a>
              <NavLink to="/signup" className={linkClass}>
                Are you an artist?
              </NavLink>
            </>
          )}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          {supabaseConfigured && user ? (
            <>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm uppercase tracking-wide text-white/70 transition-colors hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Sign in
              </NavLink>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-5 bg-white/70" />
              <span className="block h-0.5 w-5 bg-white/70" />
              <span className="block h-0.5 w-5 bg-white/70" />
            </div>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-white/10 bg-neutral-950/90 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {supabaseConfigured && user ? (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/edit" className={linkClass}>
                  Edit profile
                </NavLink>
                {profileSlug ? (
                  <NavLink to={`/artist/${profileSlug}`} className={linkClass}>
                    View public profile
                  </NavLink>
                ) : (
                  <span className="text-sm uppercase tracking-wide text-white/40">
                    View public profile
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-left text-sm uppercase tracking-wide text-white/70 transition-colors hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/artists" className={linkClass}>
                  Browse artists
                </NavLink>
                <a href="/#how-it-works" className="text-sm uppercase tracking-wide text-white/70 hover:text-white">
                  How it works
                </a>
                <NavLink to="/signup" className={linkClass}>
                  Are you an artist?
                </NavLink>
                <NavLink to="/login" className={linkClass}>
                  Sign in
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
