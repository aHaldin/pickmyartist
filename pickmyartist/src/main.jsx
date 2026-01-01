console.log("ENV URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("ENV KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20));

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./popup.css";
import "./popup.js";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
