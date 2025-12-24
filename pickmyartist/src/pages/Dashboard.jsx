import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";
import { supabase } from "../lib/supabaseClient.js";
import useAuth from "../hooks/useAuth.js";
import { getPublicProfileUrl } from "../lib/storage.js";

const statusMap = {
  new: "text-white/80 border-white/20",
  viewed: "text-white/60 border-white/10",
  replied: "text-emerald-200 border-emerald-500/30",
};

const statusLabel = (value) => {
  if (value === "replied") return "REPLIED";
  if (value === "viewed") return "VIEWED";
  return "NEW";
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      if (!supabase || !user?.id) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      const [{ data: profileData, error: profileError }, enquiriesResult] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("enquiries")
            .select("*")
            .eq("artist_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (!mounted) return;

      if (profileError) {
        setError(profileError.message);
      } else {
        setProfile(profileData);
      }

      if (enquiriesResult.error) {
        setError(enquiriesResult.error.message);
        setEnquiries([]);
      } else {
        setEnquiries(enquiriesResult.data ?? []);
      }
      setLoading(false);
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user]);

  const newEnquiries = useMemo(
    () => enquiries.filter((item) => item.status === "new").length,
    [enquiries]
  );

  const completion = useMemo(() => {
    if (!profile) {
      return {
        count: 0,
        percent: 0,
        status: "Incomplete",
        helper: "Complete your basics to start appearing in searches.",
      };
    }

    const checks = [
      Boolean(profile.display_name),
      Boolean(profile.slug),
      Boolean(profile.city || profile.country),
      Array.isArray(profile.genres) && profile.genres.length > 0,
      Boolean(profile.price_from),
      (profile.bio || "").length >= 120,
    ];
    const count = checks.filter(Boolean).length;
    const percent = Math.round((count / 6) * 100);
    let status = "Incomplete";
    let helper = "Complete your basics to start appearing in searches.";

    if (count >= 4 && count <= 5) {
      status = "Almost ready";
      helper = "Add a few final details to look premium.";
    }

    if (count === 6) {
      status = "Complete";
      helper = "Your profile is ready to be shared.";
    }

    return { count, percent, status, helper };
  }, [profile]);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <Card className="px-6 py-12 text-center text-white/70">
          Loading dashboard...
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Artist dashboard</h1>
        <p className="text-sm text-white/60">
          Monitor enquiries and keep your profile launch-ready.
        </p>
      </div>

      {error && (
        <Card className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </Card>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            New enquiries
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {newEnquiries}
          </p>
          <p className="mt-2 text-sm text-white/60">Unread requests</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Profile status
          </p>
          <p className="mt-3 text-xl font-semibold text-white">
            {completion.status}
          </p>
          <p className="mt-2 text-sm text-white/60">{completion.helper}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/40">
            {completion.count}/6 complete • {completion.percent}%
          </p>
          <Link to="/edit" className="mt-4 inline-flex">
            <Button variant="secondary" className="px-4 py-2">
              Edit profile
            </Button>
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Public profile
          </p>
          <p className="mt-3 text-sm text-white/70">
            https://pickmyartist.com/a/{profile?.slug || ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              className="px-4 py-2"
              onClick={() =>
                navigator.clipboard.writeText(
                  `https://pickmyartist.com/a/${profile?.slug || ""}`
                )
              }
              disabled={!profile?.slug}
            >
              Copy link
            </Button>
            <a
              href={`/a/${profile?.slug || ""}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="secondary"
                className="px-4 py-2"
                disabled={!profile?.slug}
              >
                Open
              </Button>
            </a>
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Latest enquiries</h2>
          <Link to="/inbox">
            <Button className="px-5 py-2">Open inbox</Button>
          </Link>
        </div>
        <Card className="mt-4 p-4">
          {enquiries.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center text-sm text-white/70">
              <p>
                You are early in PickMyArtist. Share your public profile to
                start receiving requests.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  className="px-4 py-2"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `https://pickmyartist.com/a/${profile?.slug || ""}`
                    )
                  }
                  disabled={!profile?.slug}
                >
                  Copy link
                </Button>
                <a
                  href={`/a/${profile?.slug || ""}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="secondary"
                    className="px-4 py-2"
                    disabled={!profile?.slug}
                  >
                    Open profile
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {enquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {enquiry.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {enquiry.event_date || "Date TBD"} •{" "}
                      {enquiry.event_location || "Location TBD"} •{" "}
                      {enquiry.budget || "Budget TBD"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill className={statusMap[enquiry.status] || statusMap.new}>
                      {statusLabel(enquiry.status)}
                    </Pill>
                    <Link to="/inbox">
                      <Button variant="secondary" className="px-3 py-2">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Media
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {profile?.avatar_path && (
                <img
                  src={getPublicProfileUrl(profile.avatar_path)}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="h-16 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {profile?.banner_path ? (
                <img
                  src={getPublicProfileUrl(profile.banner_path)}
                  alt="Banner preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#8A2BE2]/35 via-white/10 to-[#FF2D95]/30" />
              )}
            </div>
          </div>
          <Link to="/edit" className="mt-5 inline-flex">
            <Button variant="secondary" className="px-5 py-2">
              Update media
            </Button>
          </Link>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Quick edits
          </p>
          <p className="mt-3 text-sm text-white/70">
            Update key details without leaving the editor.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/edit#pricing">
              <Button variant="secondary" className="px-4 py-2">
                Price
              </Button>
            </Link>
            <Link to="/edit#tags">
              <Button variant="secondary" className="px-4 py-2">
                Genres & Languages
              </Button>
            </Link>
            <Link to="/edit#basics">
              <Button variant="secondary" className="px-4 py-2">
                Location
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
