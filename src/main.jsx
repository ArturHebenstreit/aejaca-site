import { StrictMode, lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, createRoutesFromElements, matchRoutes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./utils/analytics.js";  // init analytics (side-effect)
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { CurrencyProvider } from "./shop/CurrencyContext.jsx";
import { ThemeProvider } from "./i18n/ThemeContext.jsx";
import { CartProvider } from "./cart/CartContext.jsx";
import Layout from "./components/Layout.jsx";
import { TRASY, JEZYKI, prefiksJezyka, rozbierzSciezke } from "./routes.js";
import { wczytajSlownik } from "./i18n/slowniki.js";
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
const Offer = strona(() => import("./pages/Offer.jsx"));
const Shipping = strona(() => import("./pages/Shipping.jsx"));
const Payments = strona(() => import("./pages/Payments.jsx"));
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

// TRASY BUDOWANE Z JEDNEJ LISTY, TRZY RAZY: PO POLSKU, ANGIELSKU I NIEMIECKU.
// Lista sciezek stoi w `src/routes.js` i sluzy takze prerenderowi oraz mapie
// witryny. Wczesniej byla przepisana osobno tutaj i w `entry-server.jsx`, wiec
// nowa strona musiala trafic w dwa miejsca, a brak w jednym z nich nie byl
// bledem, tylko adresem dzialajacym w polowie przypadkow.
const KOMPONENTY = {
  Home, Jewelry, Studio, BlogIndex, BlogPost, Contact, Glossary, GlossaryTerm,
  About, Warranty, Returns, Terms, Cart, Checkout, Shop, Service, Product,
  Order, OrderStatus, QuotePage, Offer, Shipping, Payments, ToolsJewelry,
  AlloyCompositionPage, MetalPricingPage, RingSizePage, RingSizerPage,
  PrintabilityPage, ToolsStudio, PrintSettingsPage, ResinSettingsPage,
  LaserParametersPage, ShrinkagePage, RingBlankPage, RingConfiguratorPage,
  Privacy, Reviews, B2B, LocalPrint3D, NotFound,
};

function galazJezyka(lang) {
  const Layoutowa = <Layout />;
  return (
    <Route key={lang} path={prefiksJezyka(lang)} element={Layoutowa}>
      {TRASY.map((t) => {
        const Strona = KOMPONENTY[t.komponent];
        const element = <Strona {...(t.wlasciwosci || {})} />;
        return t.sciezka === ""
          ? <Route key={`${lang}-index`} index element={element} />
          : <Route key={`${lang}-${t.sciezka}`} path={t.sciezka} element={element} />;
      })}
      <Route key={`${lang}-reszta`} path="*" element={<NotFound />} />
    </Route>
  );
}

const trasy = <>{JEZYKI.map(galazJezyka)}</>;

// KOLEJNOSC MA ZNACZENIE: router stoi NAD dostawca jezyka, bo jezyk czyta sie
// teraz ze sciezki (`/de/studio/`), a nie z pamieci przegladarki. Dostawca
// jezyka wola `useLocation`, wiec musi byc w srodku routera. Ta sama kolejnosc
// obowiazuje w `entry-server.jsx`: rozna dawalaby inne numery `useId` po obu
// stronach i rozjazd przy hydracji.
const app = (
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
        <LanguageProvider>
          <CurrencyProvider>
          <CartProvider>
          <ScrollToHash />
          <Suspense fallback={<LazyFallback />}>
            <Routes>{trasy}</Routes>
          </Suspense>
          </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
        </BrowserRouter>
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
    await Promise.all([
      // SLOWNIK JEZYKA Z ADRESU, i tylko ten jeden. Wczesniej wszystkie trzy
      // jechaly w pliku wejsciowym, bo jezyk byl znany dopiero po zamontowaniu
      // aplikacji. Teraz wynika ze sciezki, wiec da sie pobrac dokladnie ten,
      // ktory bedzie czytany. Musi byc gotowy PRZED hydracja, inaczej granica
      // Suspense zawiesza sie w jej trakcie i React wyrzuca gotowy HTML.
      wczytajSlownik(rozbierzSciezke(window.location.pathname).lang),
      ...dopasowane.map((m) => m.route?.element?.type?.preload).filter(Boolean).map((p) => p()),
    ]);
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
  // Serwer deweloperski i awaryjne wejscie bez prerenderu. Slownik i tak musi
  // byc pierwszy, bo bez niego nie ma czym narysowac ani jednego napisu.
  wczytajTraseBiezaca().then(() => createRoot(root).render(app));
}
