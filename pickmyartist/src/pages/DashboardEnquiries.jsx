import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import useAuth from "../hooks/useAuth.js";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";

const statusMap = {
  new: "text-white/80 border-white/20",
  replied: "text-emerald-200 border-emerald-500/30",
  archived: "text-white/50 border-white/10",
};

export default function DashboardEnquiries() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadEnquiries = async () => {
      setLoading(true);
      setError("");

      if (!supabase || !user?.id) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("enquiries")
        .select("*")
        .eq("artist_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setEnquiries([]);
      } else {
        setEnquiries(data ?? []);
        setSelected(data?.[0] ?? null);
      }
      setLoading(false);
    };

    loadEnquiries();

    return () => {
      mounted = false;
    };
  }, [user]);

  const updateStatus = async (id, status) => {
    if (!supabase) return;
    const { data, error: updateError } = await supabase
      .from("enquiries")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEnquiries((current) =>
      current.map((item) => (item.id === id ? data : item))
    );
    if (selected?.id === id) {
      setSelected(data);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Enquiries inbox</h1>
        <p className="text-sm text-white/60">
          Manage incoming booking requests in one place.
        </p>
      </div>

      {loading ? (
        <Card className="mt-8 px-6 py-12 text-center text-white/70">
          Loading enquiries...
        </Card>
      ) : error ? (
        <Card className="mt-8 px-6 py-12 text-center text-white/70">
          {error}
        </Card>
      ) : enquiries.length === 0 ? (
        <Card className="mt-8 px-6 py-12 text-center text-white/70">
          Your inbox is quiet for now. Share your public profile to start
          receiving booking requests.
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <Card className="p-4">
            <div className="grid gap-3">
              {enquiries.map((enquiry) => (
                <button
                  key={enquiry.id}
                  type="button"
                  onClick={() => setSelected(enquiry)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selected?.id === enquiry.id
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {enquiry.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {enquiry.event_date || "Date TBD"} •{" "}
                      {enquiry.event_location || "Location TBD"}
                    </p>
                  </div>
                  <Pill className={statusMap[enquiry.status] || statusMap.new}>
                    {enquiry.status || "new"}
                  </Pill>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {selected.name}
                    </h2>
                    <p className="text-sm text-white/60">{selected.email}</p>
                  </div>
                  <Pill className={statusMap[selected.status] || statusMap.new}>
                    {selected.status || "new"}
                  </Pill>
                </div>
                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <p>
                    <span className="text-white/50">Event date:</span>{" "}
                    {selected.event_date || "TBD"}
                  </p>
                  <p>
                    <span className="text-white/50">Location:</span>{" "}
                    {selected.event_location || "TBD"}
                  </p>
                  <p>
                    <span className="text-white/50">Budget:</span>{" "}
                    {selected.budget || "Not shared"}
                  </p>
                  <p>
                    <span className="text-white/50">Received:</span>{" "}
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {selected.message}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    className="px-4 py-2"
                    onClick={() => updateStatus(selected.id, "replied")}
                  >
                    Mark replied
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-4 py-2"
                    onClick={() => updateStatus(selected.id, "archived")}
                  >
                    Archive
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/70">
                Select an enquiry to view details.
              </p>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}
