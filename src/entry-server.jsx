import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
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
import Shipping from "./pages/Shipping.jsx";
import ToolsJewelry from "./pages/ToolsJewelry.jsx";
import ToolsStudio from "./pages/ToolsStudio.jsx";
import NotFound from "./pages/NotFound.jsx";

export function render(url) {
  const helmetContext = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <CartProvider>
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
              <Route path="/toolstudio/" element={<ToolsStudio />} />
              <Route path="/privacy/" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </StaticRouter>
        </LanguageProvider>
      </ThemeProvider>
      </CartProvider>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  return { html, helmet };
}
