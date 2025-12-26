import { useEffect, useMemo, useState } from "react";
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
  const [totalUsers, setTotalUsers] = useState(0);
  const [newestUsers, setNewestUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadAdminData = async () => {
      if (!supabase) {
        if (mounted) {
          setError("Supabase is not configured. Add your keys to continue.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      const [countResult, newestResult, usersResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id,email,role,created_at,display_name,slug")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("profiles")
          .select("id,email,role,created_at,display_name,slug")
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (countResult.error) {
        setError(countResult.error.message);
      } else {
        setTotalUsers(countResult.count || 0);
      }

      if (newestResult.error) {
        setError(newestResult.error.message);
        setNewestUsers([]);
      } else {
        setNewestUsers(newestResult.data ?? []);
      }

      if (usersResult.error) {
        setError(usersResult.error.message);
        setUsers([]);
      } else {
        setUsers(usersResult.data ?? []);
      }

      setLoading(false);
    };

    loadAdminData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const email = user.email || "";
      const name = user.display_name || "";
      const slug = user.slug || "";
      return (
        email.toLowerCase().includes(term) ||
        name.toLowerCase().includes(term) ||
        slug.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  return (
    <>
      <SEO
        title="PickMyArtist - Admin"
        description="Admin overview of signups and account data."
        canonical="/admin"
      />
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-white">
            Admin dashboard
          </h1>
          <p className="text-sm text-white/60">
            Monitor signups and manage access across PickMyArtist.
          </p>
        </div>

        {error && (
          <Card className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </Card>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card className="p-5 md:col-span-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Total users
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {loading ? "…" : totalUsers}
            </p>
            <p className="mt-2 text-sm text-white/60">
              Accounts with profiles in Supabase.
            </p>
          </Card>
          <Card className="p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Newest signups
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-white/60">Loading signups...</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {newestUsers.length === 0 && (
                  <li className="text-white/50">No signups yet.</li>
                )}
                {newestUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="text-white">{user.email || "—"}</span>
                    <span className="text-xs uppercase tracking-[0.25em] text-white/40">
                      {formatTimestamp(user.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                User directory
              </p>
              <p className="mt-2 text-sm text-white/60">
                Search by email, name, or slug.
              </p>
            </div>
            <label className="w-full md:max-w-xs">
              <span className="sr-only">Search users</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </label>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/70">
              <thead className="text-xs uppercase tracking-[0.25em] text-white/40">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-white/60"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-white/50"
                    >
                      No users match that search.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-white/5"
                    >
                      <td className="px-3 py-3 text-white">
                        {user.email || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {user.display_name || "—"}
                      </td>
                      <td className="px-3 py-3">{user.slug || "—"}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {formatTimestamp(user.created_at)}
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
