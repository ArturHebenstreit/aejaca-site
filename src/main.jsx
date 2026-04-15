import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./utils/analytics.js";  // init analytics (side-effect)
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Jewelry from "./pages/Jewelry.jsx";
import Studio from "./pages/Studio.jsx";
import Contact from "./pages/Contact.jsx";
import Privacy from "./pages/Privacy.jsx";

// HelmetProvider enables per-route <head> mutation (title/meta/JSON-LD).
// Required wrapper — without it Helmet silently no-ops in SPAs.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/jewelry" element={<Jewelry />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>
);
