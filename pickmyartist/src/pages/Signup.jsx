import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import { slugify } from "../lib/profile.js";
import SEO from "../components/SEO.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });

  const createProfile = async (userId, emailAddress) => {
    const base = slugify(emailAddress.split("@")[0] || "performer");
    let slug = base || `performer-${Math.floor(Math.random() * 10000)}`;

    for (let i = 0; i < 5; i += 1) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) {
        break;
      }

      slug = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const displayName = emailAddress.split("@")[0] || "Performer";

    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email: emailAddress,
      display_name: displayName,
      slug,
      is_published: false,
    });

    if (insertError) {
      throw insertError;
    }
  };

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }

    try {
      if (data?.user?.id) {
        await createProfile(data.user.id, email);
      }
      navigate("/edit");
    } catch (insertError) {
      setStatus({
        loading: false,
        error: insertError.message || "Unable to create profile.",
      });
      return;
    }

    setStatus({ loading: false, error: "" });
  };

  return (
    <>
      <SEO
        title="PickMyArtist - Create an account"
        description="Create a free performer profile on PickMyArtist and start getting booking enquiries."
        canonical="/signup"
      />
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Performer access
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Create your account
          </h1>
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
                minLength={6}
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
              {status.loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" className="text-white hover:text-white/90">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
