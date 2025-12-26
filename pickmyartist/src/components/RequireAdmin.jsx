import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { supabase, supabaseConfigured } from "../lib/supabaseClient.js";

export default function RequireAdmin({ children }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [adminState, setAdminState] = useState({
    loading: true,
    isAdmin: false,
    checked: false,
  });

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      if (!supabase || !user?.id) {
        if (mounted) {
          setAdminState({ loading: false, isAdmin: false, checked: true });
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setAdminState({ loading: false, isAdmin: false, checked: true });
        return;
      }

      setAdminState({
        loading: false,
        isAdmin: data?.role === "admin",
        checked: true,
      });
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (user && adminState.checked && !adminState.isAdmin) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [adminState.checked, adminState.isAdmin, navigate, user]);

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Supabase not configured
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Connect Supabase to unlock admin access.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Add your Supabase URL and anon key to the env file, then reload the
            app to enable the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading || adminState.loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center px-6 py-20 text-white/70">
        Checking access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!adminState.isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-8 text-amber-100">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
            Not authorised
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            This area is restricted to admins.
          </h2>
          <p className="mt-3 text-sm text-amber-100/80">
            Redirecting you back to the homepage.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
