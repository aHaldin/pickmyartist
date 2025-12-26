import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { ensureProfileForUser } from "../lib/profile.js";

export default function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncProfile = async () => {
      if (!supabase || !session?.user?.id || cancelled) {
        return;
      }

      try {
        await ensureProfileForUser(session.user);
      } catch (error) {
        console.warn("Unable to sync profile row", error);
      }
    };

    syncProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return { session, user: session?.user ?? null, loading };
}
