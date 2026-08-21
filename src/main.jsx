import { StrictMode, lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, createRoutesFromElements, matchRoutes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./utils/analytics.js";  // init analytics (side-effect)
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { ThemeProvider } from "./i18n/ThemeContext.jsx";
import { CartProvider } from "./cart/CartContext.jsx";
import Layout from "./components/Layout.jsx";
import ScrollToHash from "./components/ScrollToHash.jsx";
import Home from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";

// Lazy-loaded routes - split into separate chunks to reduce initial bundle.
// Blog + Privacy are not on critical landing paths; loading them on-demand
// saves ~70KB from the main chunk (3 article bodies + Prose components).
const Jewelry = strona(() => import("./pages/Jewelry.jsx"));
const Studio = strona(() => import("./pages/Studio.jsx"));
const BlogIndex = strona(() => import("./pages/BlogIndex.jsx"));
const BlogPost = strona(() => import("./pages/BlogPost.jsx"));
const Privacy = strona(() => import("./pages/Privacy.jsx"));
const Glossary = strona(() => import("./pages/Glossary.jsx"));
const GlossaryTerm = strona(() => import("./pages/GlossaryTerm.jsx"));
const About = strona(() => import("./pages/About.jsx"));
const Warranty = strona(() => import("./pages/Warranty.jsx"));
const Returns = strona(() => import("./pages/Returns.jsx"));
const Terms = strona(() => import("./pages/Terms.jsx"));
const Order = strona(() => import("./pages/Order.jsx"));
const Shop = strona(() => import("./pages/Shop.jsx"));
const Product = strona(() => import("./pages/Product.jsx"));
const Service = strona(() => import("./pages/Service.jsx"));
const Cart = strona(() => import("./pages/Cart.jsx"));
const Checkout = strona(() => import("./pages/Checkout.jsx"));
const OrderStatus = strona(() => import("./pages/OrderStatus.jsx"));
const QuotePage = strona(() => import("./pages/QuotePage.jsx"));
const Shipping = strona(() => import("./pages/Shipping.jsx"));
const ToolsJewelry = strona(() => import("./pages/ToolsJewelry.jsx"));
const ToolsStudio = strona(() => import("./pages/ToolsStudio.jsx"));
const AlloyCompositionPage = strona(() => import("./pages/AlloyCompositionPage.jsx"));
const MetalPricingPage = strona(() => import("./pages/MetalPricingPage.jsx"));
const RingSizePage = strona(() => import("./pages/RingSizePage.jsx"));
const RingSizerPage = strona(() => import("./pages/RingSizerPage.jsx"));
const PrintabilityPage = strona(() => import("./pages/PrintabilityPage.jsx"));
const PrintSettingsPage = strona(() => import("./pages/PrintSettingsPage.jsx"));
const LaserParametersPage = strona(() => import("./pages/LaserParametersPage.jsx"));
const RingBlankPage = strona(() => import("./pages/RingBlankPage.jsx"));
// Wersja robocza: trasa istnieje, ale nic do niej nie prowadzi.
const RingConfiguratorPage = strona(() => import("./pages/RingConfiguratorPage.jsx"));
const ShrinkagePage = strona(() => import("./pages/ShrinkagePage.jsx"));
const ResinSettingsPage = strona(() => import("./pages/ResinSettingsPage.jsx"));
const Reviews = strona(() => import("./pages/Reviews.jsx"));
const B2B = strona(() => import("./pages/B2B.jsx"));
const LocalPrint3D = strona(() => import("./pages/LocalPrint3D.jsx"));
const NotFound = strona(() => import("./pages/NotFound.jsx"));

// ============================================================
// LENIWA TRASA, KTORA DA SIE WCZYTAC PRZED HYDRATACJA
// ============================================================
// Kazda strona poza glowna wchodzi przez `lazy()`. Przy hydratacji gotowego
// HTML-a to znaczy, ze granica `Suspense` zawiesza sie na pobraniu fragmentu,
// a React musi PORZUCIC PRERENDER i narysowac strone od nowa po stronie
// klienta. W konsoli zostaja bledy #421 (aktualizacja przed dokonczeniem
// hydratacji) i #418 (niezgodnosc hydratacji).
//
// Awaria jest cicha, bo strona dziala. Traci sie tylko to, po co prerender
// istnieje: pierwszy widok bez czekania na JavaScript. Zmierzone: przy
// szybkim laczu pada mniej wiecej co trzecie wejscie, przy fragmencie
// opoznionym o 300 ms KAZDE. Strona glowna nie pada nigdy, bo jest
// importowana zwyczajnie i nie ma czego czekac.
//
// `preload` daje dostep do tego samego importu, ktorego uzywa `lazy`, wiec
// mozemy wczytac fragment biezacej trasy PRZED `hydrateRoot`.
function strona(zaladuj) {
  const Komponent = lazy(zaladuj);
  Komponent.preload = zaladuj;
  return Komponent;
}

function LazyFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

// JEDNA LISTA TRAS, uzywana i do renderowania, i do wczytania fragmentu przed
// hydratacja. Druga lista rozjechalaby sie przy pierwszej nowej stronie, i to
// po cichu: brakujaca pozycja nie jest bledem, tylko powrotem do starej awarii.
const trasy = (
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
    <Route path="/terms/" element={<Terms />} />
    <Route path="/cart/" element={<Cart />} />
    <Route path="/checkout/" element={<Checkout />} />
    <Route path="/shop/" element={<Shop />} />
    <Route path="/shop/jewelry/" element={<Shop />} />
    <Route path="/shop/studio/" element={<Shop />} />
    <Route path="/shop/service/:id/" element={<Service />} />
    <Route path="/shop/:slug/" element={<Product />} />
    <Route path="/order/" element={<Order />} />
    <Route path="/order/status/" element={<OrderStatus />} />
    <Route path="/quote/" element={<QuotePage />} />
    <Route path="/shipping/" element={<Shipping />} />
    <Route path="/toolsjewelry/" element={<ToolsJewelry />} />
    <Route path="/toolsjewelry/alloy-composition/" element={<AlloyCompositionPage />} />
    <Route path="/toolsjewelry/metal-pricing/" element={<MetalPricingPage />} />
    <Route path="/toolsjewelry/ring-size/" element={<RingSizePage />} />
    <Route path="/toolsjewelry/ring-sizer/" element={<RingSizerPage />} />
    <Route path="/toolstudio/printability/" element={<PrintabilityPage />} />
    <Route path="/toolstudio/" element={<ToolsStudio />} />
    <Route path="/toolstudio/print-settings/" element={<PrintSettingsPage />} />
    <Route path="/toolstudio/resin-settings/" element={<ResinSettingsPage />} />
    <Route path="/toolstudio/laser-parameters/" element={<LaserParametersPage />} />
    <Route path="/toolstudio/shrinkage/" element={<ShrinkagePage />} />
    <Route path="/toolsjewelry/ring-blank/" element={<RingBlankPage />} />
    <Route path="/toolsjewelry/kreator/" element={<RingConfiguratorPage />} />
    <Route path="/privacy/" element={<Privacy />} />
    <Route path="/reviews/" element={<Reviews />} />
    <Route path="/b2b/" element={<B2B />} />
    <Route path="/druk-3d-piaseczno/" element={<LocalPrint3D city="piaseczno" />} />
    <Route path="/druk-3d-warszawa/" element={<LocalPrint3D city="warszawa" />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);

const app = (
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
          <BrowserRouter>
          <ScrollToHash />
          <Suspense fallback={<LazyFallback />}>
            <Routes>{trasy}</Routes>
          </Suspense>
          </BrowserRouter>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);

/**
 * Wczytuje fragment trasy, ktora odpowiada biezacemu adresowi.
 *
 * Dopasowanie robi sam router na TEJ SAMEJ deklaracji tras, ktora renderujemy,
 * wiec nie ma tu drugiej listy sciezek do utrzymania. Strony importowane
 * zwyczajnie (glowna, kontakt) nie maja `preload` i po prostu wypadaja.
 *
 * Cokolwiek pojdzie tu nie tak, hydratujemy mimo wszystko: to jest
 * przyspieszenie, a nie warunek dzialania strony.
 */
async function wczytajTraseBiezaca() {
  try {
    const dopasowane = matchRoutes(createRoutesFromElements(trasy), window.location.pathname) || [];
    await Promise.all(
      dopasowane.map((m) => m.route?.element?.type?.preload).filter(Boolean).map((p) => p())
    );
  } catch {
    /* nie blokujemy strony na wczytywaniu na zapas */
  }
}

const root = document.getElementById("root");
if (root.innerHTML.trim() && root.innerHTML !== "<!--ssr-outlet-->") {
  // HYDRATACJA DOPIERO PO WCZYTANIU FRAGMENTU. Odwrotna kolejnosc znaczy, ze
  // granica Suspense zawiesza sie w trakcie hydratacji, React porzuca gotowy
  // HTML i rysuje strone od nowa, a odwiedzajacy oglada kreciolek zamiast
  // tresci, ktora juz przyszla z serwera.
  wczytajTraseBiezaca().then(() => hydrateRoot(root, app));
} else {
  createRoot(root).render(app);
}
