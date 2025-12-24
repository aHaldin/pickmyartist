import { Route, Routes } from "react-router-dom";
import SiteNav from "./components/SiteNav.jsx";
import GradientBG from "./components/GradientBG.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { supabaseConfigured } from "./lib/supabaseClient.js";
import Home from "./pages/Home.jsx";
import Artists from "./pages/Artists.jsx";
import ArtistProfile from "./pages/ArtistProfile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DashboardEnquiries from "./pages/DashboardEnquiries.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <GradientBG />
      <SiteNav />
      {import.meta.env.DEV && !supabaseConfigured && (
        <div className="mx-auto w-full max-w-6xl px-6 pt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            Connect Supabase to enable performer accounts. Add your keys to
            <span className="text-white"> .env.local</span> to unlock signup,
            login, and profile editing.
          </div>
        </div>
      )}
      <main className="flex min-h-[calc(100vh-4rem)] flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artist/:slug" element={<ArtistProfile />} />
          <Route path="/a/:slug" element={<PublicProfile />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/enquiries"
            element={
              <ProtectedRoute>
                <DashboardEnquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <DashboardEnquiries />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
