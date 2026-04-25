import { StrictMode, lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./utils/analytics.js";  // init analytics (side-effect)
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";

// Lazy-loaded routes — split into separate chunks to reduce initial bundle.
// Blog + Privacy are not on critical landing paths; loading them on-demand
// saves ~70KB from the main chunk (3 article bodies + Prose components).
const Jewelry = lazy(() => import("./pages/Jewelry.jsx"));
const Studio = lazy(() => import("./pages/Studio.jsx"));
const BlogIndex = lazy(() => import("./pages/BlogIndex.jsx"));
const BlogPost = lazy(() => import("./pages/BlogPost.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Glossary = lazy(() => import("./pages/Glossary.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Warranty = lazy(() => import("./pages/Warranty.jsx"));
const Returns = lazy(() => import("./pages/Returns.jsx"));
const Shipping = lazy(() => import("./pages/Shipping.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function LazyFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

const app = (
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/jewelry" element={<Jewelry />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/glossary" element={<Glossary />} />
                <Route path="/about" element={<About />} />
                <Route path="/warranty" element={<Warranty />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>
);

const root = document.getElementById("root");
if (root.innerHTML.trim() && root.innerHTML !== "<!--ssr-outlet-->") {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
