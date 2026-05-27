import { StrictMode, lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./utils/analytics.js";  // init analytics (side-effect)
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { ThemeProvider } from "./i18n/ThemeContext.jsx";
import { CartProvider } from "./cart/CartContext.jsx";
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
const GlossaryTerm = lazy(() => import("./pages/GlossaryTerm.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Warranty = lazy(() => import("./pages/Warranty.jsx"));
const Returns = lazy(() => import("./pages/Returns.jsx"));
const Shipping = lazy(() => import("./pages/Shipping.jsx"));
const ToolsJewelry = lazy(() => import("./pages/ToolsJewelry.jsx"));
const ToolsStudio = lazy(() => import("./pages/ToolsStudio.jsx"));
const AlloyCompositionPage = lazy(() => import("./pages/AlloyCompositionPage.jsx"));
const MetalPricingPage = lazy(() => import("./pages/MetalPricingPage.jsx"));
const RingSizePage = lazy(() => import("./pages/RingSizePage.jsx"));
const PrintSettingsPage = lazy(() => import("./pages/PrintSettingsPage.jsx"));
const LaserParametersPage = lazy(() => import("./pages/LaserParametersPage.jsx"));
const RingBlankPage = lazy(() => import("./pages/RingBlankPage.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
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
      <ThemeProvider>
        <CartProvider>
        <LanguageProvider>
          <BrowserRouter>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/jewelry/" element={<Jewelry />} />
                <Route path="/studio/" element={<Studio />} />
                <Route path="/blog/" element={<BlogIndex />} />
                <Route path="/blog/:slug/" element={<BlogPost />} />
                <Route path="/contact/" element={<Contact />} />
                <Route path="/glossary/" element={<Glossary />} />
                <Route path="/glossary/:id/" element={<GlossaryTerm />} />
                <Route path="/about/" element={<About />} />
                <Route path="/warranty/" element={<Warranty />} />
                <Route path="/returns/" element={<Returns />} />
                <Route path="/shipping/" element={<Shipping />} />
                <Route path="/toolsjewelry/" element={<ToolsJewelry />} />
                <Route path="/toolsjewelry/alloy-composition/" element={<AlloyCompositionPage />} />
                <Route path="/toolsjewelry/metal-pricing/" element={<MetalPricingPage />} />
                <Route path="/toolsjewelry/ring-size/" element={<RingSizePage />} />
                <Route path="/toolstudio/" element={<ToolsStudio />} />
                <Route path="/toolstudio/print-settings/" element={<PrintSettingsPage />} />
                <Route path="/toolstudio/laser-parameters/" element={<LaserParametersPage />} />
                <Route path="/toolsjewelry/ring-blank/" element={<RingBlankPage />} />
                <Route path="/privacy/" element={<Privacy />} />
                <Route path="/reviews/" element={<Reviews />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
          </BrowserRouter>
        </LanguageProvider>
        </CartProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);

const root = document.getElementById("root");
if (root.innerHTML.trim() && root.innerHTML !== "<!--ssr-outlet-->") {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
