import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import SEO from "../components/SEO.jsx";
import { supabase } from "../lib/supabaseClient.js";

const formatTimestamp = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function Admin() {
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({
    total: null,
    recent: null,
    latest: null,
    completed: null,
    incomplete: null,
  });
  const [statsError, setStatsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProfiles = async () => {
      if (!supabase) {
        if (mounted) {
          setError("Supabase is not configured. Add your keys to continue.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");
      setStatsError("");

      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [
        profilesResult,
        totalResult,
        recentResult,
        latestResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", {
          ascending: false,
        }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo),
        supabase
          .from("profiles")
          .select("email,created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      if (profilesResult.error) {
        setError(profilesResult.error.message);
        setProfiles([]);
      } else {
        const data = profilesResult.data ?? [];
        setProfiles(data);

        const completion = data.reduce(
          (acc, profile) => {
            const checks = [
              Boolean(profile.display_name),
              Boolean(profile.slug),
              Boolean(profile.city || profile.country),
              Array.isArray(profile.genres) && profile.genres.length > 0,
              Boolean(profile.price_from),
              (profile.bio || "").length >= 120,
            ];
            const complete = checks.filter(Boolean).length === 6;
            if (complete) {
              acc.completed += 1;
            } else {
              acc.incomplete += 1;
            }
            return acc;
          },
          { completed: 0, incomplete: 0 }
        );

        setStats((prev) => ({
          ...prev,
          completed: completion.completed,
          incomplete: completion.incomplete,
        }));
      }

      if (totalResult.error || recentResult.error || latestResult.error) {
        setStatsError(
          totalResult.error?.message ||
            recentResult.error?.message ||
            latestResult.error?.message ||
            "Unable to load admin stats."
        );
      }

      setStats((prev) => ({
        ...prev,
        total: totalResult.count ?? prev.total,
        recent: recentResult.count ?? prev.recent,
        latest: latestResult.data ?? prev.latest,
      }));

      setLoading(false);
    };

    loadProfiles();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SEO
        title="PickMyArtist - Admin"
        description="Admin overview of signups and account data."
        canonical="/admin"
      />
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-white">Admin Panel</h1>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Total signups
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stats.total ?? "—"}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              New signups (7d)
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stats.recent ?? "—"}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Latest signup
            </p>
            <p className="mt-3 text-sm text-white">
              {stats.latest?.email || "—"}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/40">
              {stats.latest?.created_at
                ? formatTimestamp(stats.latest.created_at)
                : "—"}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Completion
            </p>
            <p className="mt-3 text-sm text-white">
              {stats.completed ?? "—"} complete
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/40">
              {stats.incomplete ?? "—"} incomplete
            </p>
          </Card>
        </div>

        {statsError && (
          <p className="mt-4 text-sm text-red-200">{statsError}</p>
        )}

        {error && (
          <Card className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </Card>
        )}

        <Card className="mt-8 p-6">
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/70">
              <thead className="text-xs uppercase tracking-[0.25em] text-white/40">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-white/60"
                    >
                      Loading profiles...
                    </td>
                  </tr>
                )}
                {!loading && profiles.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-white/50"
                    >
                      No profiles found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  profiles.map((profile) => (
                    <tr key={profile.id} className="border-t border-white/5">
                      <td className="px-3 py-3 text-white">{profile.id}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{profile.email || "—"}</span>
                          {profile.email === "info@pickmy.live" && (
                            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {profile.artist_name ||
                          profile.artistName ||
                          profile.display_name ||
                          "—"}
                      </td>
                      <td className="px-3 py-3">
                        {formatTimestamp(profile.created_at)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}
