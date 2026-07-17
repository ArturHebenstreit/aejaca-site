import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { ThemeProvider } from "./i18n/ThemeContext.jsx";
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
import Shipping from "./pages/Shipping.jsx";
import ToolsJewelry from "./pages/ToolsJewelry.jsx";
import ToolsStudio from "./pages/ToolsStudio.jsx";
import AlloyCompositionPage from "./pages/AlloyCompositionPage.jsx";
import MetalPricingPage from "./pages/MetalPricingPage.jsx";
import RingSizePage from "./pages/RingSizePage.jsx";
import PrintSettingsPage from "./pages/PrintSettingsPage.jsx";
import LaserParametersPage from "./pages/LaserParametersPage.jsx";
import RingBlankPage from "./pages/RingBlankPage.jsx";
import ShrinkagePage from "./pages/ShrinkagePage.jsx";
import ResinSettingsPage from "./pages/ResinSettingsPage.jsx";
import Reviews from "./pages/Reviews.jsx";
import B2B from "./pages/B2B.jsx";
import NotFound from "./pages/NotFound.jsx";

export function render(url) {
  const helmetContext = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <ThemeProvider>
        <LanguageProvider>
          <StaticRouter location={url}>
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
              <Route path="/toolstudio/resin-settings/" element={<ResinSettingsPage />} />
              <Route path="/toolstudio/laser-parameters/" element={<LaserParametersPage />} />
              <Route path="/toolstudio/shrinkage/" element={<ShrinkagePage />} />
              <Route path="/toolsjewelry/ring-blank/" element={<RingBlankPage />} />
              <Route path="/privacy/" element={<Privacy />} />
              <Route path="/reviews/" element={<Reviews />} />
              <Route path="/b2b/" element={<B2B />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </StaticRouter>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  return { html, helmet };
}
