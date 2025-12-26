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

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfiles([]);
      } else {
        setProfiles(data ?? []);
      }

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
                        {profile.email || "—"}
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
