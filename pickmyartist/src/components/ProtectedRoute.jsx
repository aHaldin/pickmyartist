import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { supabaseConfigured } from "../lib/supabaseClient.js";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Supabase not configured
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Connect Supabase to unlock profile editing.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Add your Supabase URL and anon key to the env file, then reload the
            app to enable performer accounts.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center px-6 py-20 text-white/70">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
