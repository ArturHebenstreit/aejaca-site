import { StrictMode, Suspense } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import ScrollToHash from "./components/ScrollToHash.jsx";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
// Prerender rysuje po kolei kazdy z trzech jezykow, wiec potrzebuje wszystkich
// slownikow naraz i nie ma czego odkladac. W przegladarce jest odwrotnie:
// `main.jsx` pobiera dokladnie jeden, ten wynikajacy z adresu.
import { zarejestrujSlownik } from "./i18n/slowniki.js";
import slownikPL from "./i18n/pl.js";
import slownikEN from "./i18n/en.js";
import slownikDE from "./i18n/de.js";

zarejestrujSlownik("pl", slownikPL);
zarejestrujSlownik("en", slownikEN);
zarejestrujSlownik("de", slownikDE);
import { CurrencyProvider } from "./shop/CurrencyContext.jsx";
import { ThemeProvider } from "./i18n/ThemeContext.jsx";
import { CartProvider } from "./cart/CartContext.jsx";
import Layout from "./components/Layout.jsx";
import { TRASY, JEZYKI, prefiksJezyka } from "./routes.js";

import Home from "./pages/Home.jsx";
import Jewelry from "./pages/Jewelry.jsx";
import Studio from "./pages/Studio.jsx";
import BlogIndex from "./pages/BlogIndex.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import Contact from "./pages/Contact.jsx";
import Privacy from "./pages/Privacy.jsx";
import Glossary from "./pages/Glossary.jsx";
import GlossaryTerm from "./pages/GlossaryTerm.jsx";
import About from "./pages/About.jsx";
import Warranty from "./pages/Warranty.jsx";
import Returns from "./pages/Returns.jsx";
import Terms from "./pages/Terms.jsx";
import Order from "./pages/Order.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import Service from "./pages/Service.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderStatus from "./pages/OrderStatus.jsx";
import QuotePage from "./pages/QuotePage.jsx";
import Offer from "./pages/Offer.jsx";
import Shipping from "./pages/Shipping.jsx";
import Payments from "./pages/Payments.jsx";
import OrderProcess from "./pages/OrderProcess.jsx";
import Faq from "./pages/Faq.jsx";
import ToolsJewelry from "./pages/ToolsJewelry.jsx";
import ToolsStudio from "./pages/ToolsStudio.jsx";
import AlloyCompositionPage from "./pages/AlloyCompositionPage.jsx";
import MetalPricingPage from "./pages/MetalPricingPage.jsx";
import RingSizePage from "./pages/RingSizePage.jsx";
import RingSizerPage from "./pages/RingSizerPage.jsx";
import PrintabilityPage from "./pages/PrintabilityPage.jsx";
import PrintSettingsPage from "./pages/PrintSettingsPage.jsx";
import LaserParametersPage from "./pages/LaserParametersPage.jsx";
import RingBlankPage from "./pages/RingBlankPage.jsx";
import ShrinkagePage from "./pages/ShrinkagePage.jsx";
import ResinSettingsPage from "./pages/ResinSettingsPage.jsx";
import Reviews from "./pages/Reviews.jsx";
import B2B from "./pages/B2B.jsx";
import LocalPrint3D from "./pages/LocalPrint3D.jsx";
import NotFound from "./pages/NotFound.jsx";

// Ta sama lista tras co w `main.jsx`, tylko ze stronami importowanymi
// zwyczajnie: prerender rysuje wszystko na raz i nie ma czego odkladac.
const KOMPONENTY = {
  Home, Jewelry, Studio, BlogIndex, BlogPost, Contact, Glossary, GlossaryTerm,
  About, Warranty, Returns, Terms, Cart, Checkout, Shop, Service, Product,
  Order, OrderStatus, QuotePage, Offer, Shipping, Payments, OrderProcess, Faq,
  ToolsJewelry,
  AlloyCompositionPage, MetalPricingPage, RingSizePage, RingSizerPage,
  PrintabilityPage, ToolsStudio, PrintSettingsPage, ResinSettingsPage,
  LaserParametersPage, ShrinkagePage, RingBlankPage,
  Privacy, Reviews, B2B, LocalPrint3D, NotFound,
};

function galazJezyka(lang) {
  return (
    <Route key={lang} path={prefiksJezyka(lang)} element={<Layout />}>
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

export function render(url) {
  const helmetContext = {};

  const html = renderToString(
    // StrictMode jest w drzewie klienta, wiec musi byc i tutaj. Na serwerze nic
    // nie robi, ale liczy sie jako wezel przy nadawaniu identyfikatorow `useId`.
    <StrictMode>
    <HelmetProvider context={helmetContext}>
      <ThemeProvider>
        {/* Kolejnosc taka sama jak w `main.jsx`: router NAD dostawca jezyka,
            bo jezyk czyta sie ze sciezki. Rozna kolejnosc po obu stronach
            dawalaby inne numery `useId` i rozjazd przy hydracji. */}
        <StaticRouter location={url}>
        <LanguageProvider>
          <CurrencyProvider>
          <CartProvider>
          {/* Nic nie rysuje, ale zajmuje miejsce w drzewie, a `useId` liczy
              identyfikatory z polozenia wezla. Bez niego serwer i klient
              nadawaly polom formularzy rozne id i etykiety przestawaly je wskazywac. */}
          <ScrollToHash />
          {/* Ta sama granica Suspense co po stronie klienta, i to jest jej cala rola.
              Renderowanie na serwerze znaczy granice komentarzami <!--$--> i <!--/$-->.
              Gdy klient ma Suspense, a serwerowy HTML nie ma znacznikow, hydratacja
              nie znajduje czego szukala, przewraca sie i React RYSUJE CALA STRONE
              OD NOWA, wyrzucajac gotowy HTML. Tutaj nic sie nie zawiesza, bo strony
              sa importowane statycznie: chodzi wylacznie o to, zeby drzewa byly zgodne. */}
          <Suspense>
          <Routes>{trasy}</Routes>
          </Suspense>
          </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
        </StaticRouter>
      </ThemeProvider>
    </HelmetProvider>
    </StrictMode>
  );

  const { helmet } = helmetContext;
  return { html, helmet };
}
