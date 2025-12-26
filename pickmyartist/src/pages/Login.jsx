import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import SEO from "../components/SEO.jsx";

const fetchProfileWithRetry = async (userId) => {
  const attemptFetch = () =>
    supabase.from("profiles").select("*").eq("id", userId).single();

  let { data, error } = await attemptFetch();

  if (error?.code === "PGRST116") {
    await new Promise((resolve) => setTimeout(resolve, 300));
    ({ data, error } = await attemptFetch());
  }

  if (error) {
    throw error;
  }

  return data;
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: "" });

    if (!supabase) {
      setStatus({
        loading: false,
        error: "Supabase is not configured. Add your keys to continue.",
      });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }

    try {
      if (data?.user?.id) {
        await fetchProfileWithRetry(data.user.id);
      }
      setStatus({ loading: false, error: "" });
      navigate("/edit");
    } catch (fetchError) {
      setStatus({
        loading: false,
        error: fetchError.message || "Unable to load profile. Please retry.",
      });
    }
  };

  return (
    <>
      <SEO
        title="PickMyArtist - Log in"
        description="Log in to manage your performer profile, availability, and enquiries."
        canonical="/login"
      />
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Performer access
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Log in</h1>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-xs uppercase tracking-[0.25em] text-white/50">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.25em] text-white/50">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </label>
            {status.error && (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                {status.error}
              </p>
            )}
            <button
              type="submit"
              disabled={status.loading}
              className="mt-2 rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.loading ? "Signing in..." : "Log in"}
            </button>
          </form>
          <p className="mt-6 text-sm text-white/60">
            New to PickMyArtist?{" "}
            <Link to="/signup" className="text-white hover:text-white/90">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
