import { StrictMode, Suspense } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import ScrollToHash from "./components/ScrollToHash.jsx";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { ThemeProvider } from "./i18n/ThemeContext.jsx";
import { CartProvider } from "./cart/CartContext.jsx";
import Layout from "./components/Layout.jsx";

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
import RingConfiguratorPage from "./pages/RingConfiguratorPage.jsx";
import ShrinkagePage from "./pages/ShrinkagePage.jsx";
import ResinSettingsPage from "./pages/ResinSettingsPage.jsx";
import Reviews from "./pages/Reviews.jsx";
import B2B from "./pages/B2B.jsx";
import LocalPrint3D from "./pages/LocalPrint3D.jsx";
import NotFound from "./pages/NotFound.jsx";

export function render(url) {
  const helmetContext = {};

  const html = renderToString(
    // StrictMode jest w drzewie klienta, wiec musi byc i tutaj. Na serwerze nic
    // nie robi, ale liczy sie jako wezel przy nadawaniu identyfikatorow `useId`.
    <StrictMode>
    <HelmetProvider context={helmetContext}>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
          <StaticRouter location={url}>
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
              <Route path="/oferta/" element={<Offer />} />
              <Route path="/shipping/" element={<Shipping />} />
              <Route path="/payments/" element={<Payments />} />
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
          </Routes>
          </Suspense>
          </StaticRouter>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
    </StrictMode>
  );

  const { helmet } = helmetContext;
  return { html, helmet };
}
