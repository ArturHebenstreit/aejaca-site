import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gem, Sparkles, Palette, Heart, Wand2, Crown, Calculator, Tag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { getPost } from "../blog/posts.js";
import BlogCard from "../components/blog/BlogCard.jsx";
import JewelryEstimator from "../components/JewelryEstimator.jsx";
import ProcessGallery from "../components/ProcessGallery.jsx";
import Portfolio from "../components/Portfolio.jsx";
import GoogleReviews from "../components/GoogleReviews.jsx";
import FAQ from "../components/FAQ.jsx";
import Tips from "../components/Tips.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import {
  buildServiceSchema,
  buildFAQSchema,
  buildBreadcrumbSchema,
  buildWebPageSchema,
  buildHowToSchema,
  buildProductSchema,
  buildItemListSchema,
} from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const icons = [Gem, Sparkles, Palette, Heart, Wand2, Crown];

const PRICING_LABELS = {
  pl: { tag: "Orientacyjne ceny", title: "Ile kosztuje biżuteria?", note: "Ceny orientacyjne — dokładna wycena w kalkulatorze poniżej.", cta: "Wyceń w kalkulatorze" },
  en: { tag: "Indicative pricing", title: "How much does jewelry cost?", note: "Indicative prices — use the calculator below for an exact quote.", cta: "Get a quote" },
  de: { tag: "Richtpreise", title: "Was kostet Schmuck?", note: "Richtpreise — nutzen Sie den Rechner unten für ein genaues Angebot.", cta: "Zum Rechner" },
};

const PRICING_ITEMS = [
  { pl: "Srebrny pierścionek", en: "Silver ring", de: "Silberring", pln: 250, eur: 60 },
  { pl: "Srebrne kolczyki", en: "Silver earrings", de: "Silberohrringe", pln: 180, eur: 40 },
  { pl: "Złoty pierścionek 14K", en: "Gold ring 14K", de: "Goldring 14K", pln: 900, eur: 210 },
  { pl: "Złoty wisiorek 14K", en: "Gold pendant 14K", de: "Goldanhänger 14K", pln: 600, eur: 140 },
  { pl: "Pierścionek z kamieniem", en: "Ring with gemstone", de: "Ring mit Edelstein", pln: 350, eur: 80 },
  { pl: "Pierścionek zaręczynowy", en: "Engagement ring", de: "Verlobungsring", pln: 1200, eur: 280 },
];

const FLOATING_CTA_LABELS = {
  pl: "Wyceń online",
  en: "Quick quote",
  de: "Sofort-Angebot",
};

export default function Jewelry() {
  const { t, lang } = useLanguage();
  const j = t.jewelry;

  const aboutRef = useScrollReveal();
  const servicesHeaderRef = useScrollReveal();
  const getServiceRef = useStaggerReveal(100);
  const valuesRef = useScrollReveal();
  const etsyRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const [showFloatingCta, setShowFloatingCta] = useState(false);
  useEffect(() => {
    function onScroll() { setShowFloatingCta(window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Per-page schemas: Service (jewelry as commissionable craft) + FAQ (AIO gold)
  // + Breadcrumb (SERP navigation) + WebPage (canonical wrapper).
  const seo = getSEO("jewelry", lang);
  const pageUrl = `${SITE.url}/jewelry`;
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "Jewelry", url: pageUrl },
    ]),
    buildServiceSchema({
      name: seo.title,
      description: seo.description,
      serviceType: "Custom handcrafted jewelry design and production",
      url: pageUrl,
      offers: { price: "150", minPrice: "80", maxPrice: "3500", currency: "EUR" },
    }),
    // HowTo schema = step-by-step process (AI assistants cite verbatim for "how is X made?")
    j.processSteps?.length && buildHowToSchema({
      name: j.processTitle,
      description: j.processTag,
      steps: j.processSteps,
      image: `${SITE.url}/hero-jewelry.jpg`,
    }),
    // FAQ schema = direct ranking signal for Google's "People Also Ask" + LLM answers
    j.faq?.items && buildFAQSchema(j.faq.items),
    buildItemListSchema({
      name: "AEJaCA Handcrafted Jewelry Collection",
      url: pageUrl,
      items: [
        { name: "Custom Silver Ring with Gemstone", url: `${pageUrl}#rings`, image: `${SITE.url}/hero-jewelry.jpg`, description: "Handcrafted sterling silver ring with natural gemstone setting" },
        { name: "Gold Engagement Ring", url: `${pageUrl}#engagement`, image: `${SITE.url}/hero-jewelry.jpg`, description: "Bespoke 14K/18K gold engagement ring with premium gemstone" },
        { name: "Silver Earrings with Gemstones", url: `${pageUrl}#earrings`, image: `${SITE.url}/hero-jewelry.jpg`, description: "Artisan sterling silver earrings with natural gemstones" },
        { name: "Gemstone Bracelet", url: `${pageUrl}#bracelets`, image: `${SITE.url}/hero-jewelry.jpg`, description: "Natural stone bead bracelet with silver elements" },
        { name: "Wedding Bands", url: `${pageUrl}#wedding`, image: `${SITE.url}/hero-jewelry.jpg`, description: "Personalized wedding ring pairs with custom engraving" },
        { name: "Personalized Pendant", url: `${pageUrl}#pendants`, image: `${SITE.url}/hero-jewelry.jpg`, description: "Custom pendant with gemstone or engraved design" },
      ],
    }),
    buildProductSchema({
      name: "Custom Silver Ring with Gemstone — AEJaCA",
      description: "Handcrafted sterling silver ring with natural gemstone, custom designed to order. Available with amethyst, emerald, sapphire, or ruby.",
      image: `${SITE.url}/hero-jewelry.jpg`,
      sku: "AEJACA-RING-925",
      price: "150",
      currency: "EUR",
      rating: 4.9,
      reviewCount: 23,
    }),
    buildProductSchema({
      name: "Handmade Gold Engagement Ring — AEJaCA",
      description: "Bespoke 14K or 18K gold engagement ring with premium gemstone setting. Prong, bezel, or channel setting available.",
      image: `${SITE.url}/hero-jewelry.jpg`,
      sku: "AEJACA-ENGAGE-14K",
      price: "450",
      currency: "EUR",
      rating: 4.9,
      reviewCount: 23,
    }),
    buildProductSchema({
      name: "Silver Earrings with Natural Gemstones — AEJaCA",
      description: "Artisan-crafted sterling silver earrings featuring hand-selected natural gemstones. Each pair is unique.",
      image: `${SITE.url}/hero-jewelry.jpg`,
      sku: "AEJACA-EARR-925",
      price: "95",
      currency: "EUR",
      rating: 4.9,
      reviewCount: 23,
    }),
  ];

  return (
    <>
      <SEOHead pageKey="jewelry" path="/jewelry" image={`${SITE.url}/og-jewelry.jpg`} schemas={schemas} />
      <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img
            src="/hero-jewelry.webp"
            alt="AEJaCA Jewelry — handcrafted silver rings, earrings, and gemstone pieces"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
            <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">{j.heroTag}</div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">{j.heroTitle}</h1>
            <p className="text-neutral-300 text-base max-w-2xl">{j.heroDesc}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4 bg-neutral-950">
        <div ref={aboutRef} className="reveal max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 text-white">{j.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{j.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{j.aboutP2}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Services */}
      <section id="services" className="py-20 px-4 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div ref={servicesHeaderRef} className="reveal text-center mb-14">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.servicesTag}</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">{j.servicesTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {j.services.map((svc, i) => {
              const Icon = icons[i];
              return (
                <div key={i} ref={getServiceRef(i)} className="reveal-scale p-6 rounded-xl glass-amber hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 group">
                  <Icon className="w-8 h-8 text-amber-400 mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="font-serif text-lg font-semibold text-white mb-2">{svc.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{svc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Indicative Pricing */}
      <section id="pricing" className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{PRICING_LABELS[lang]?.tag}</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">{PRICING_LABELS[lang]?.title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRICING_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl glass-amber">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-neutral-200 text-sm">{item[lang] || item.en}</span>
                </div>
                <span className="text-amber-300 font-semibold text-sm whitespace-nowrap ml-3">
                  {{ pl: "od", en: "from", de: "ab" }[lang]}{" "}
                  {lang === "pl"
                    ? `${item.pln.toLocaleString("pl-PL")} zł`
                    : `€${item.eur.toLocaleString("de-DE")}`}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-neutral-400 text-sm mb-4">{PRICING_LABELS[lang]?.note}</p>
            <a href="#calculator" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
              {PRICING_LABELS[lang]?.cta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Jewelry Calculator */}
      <JewelryEstimator />

      <div className="gradient-divider" />

      {/* FAQ — moved right after calculator so users get answers
          before they need to scroll through portfolio / reviews.
          AI assistants also rank FAQ above-the-fold higher. */}
      <FAQ data={j.faq} accent="amber" id="faq" />

      <div className="gradient-divider" />

      {/* Process Gallery */}
      <ProcessGallery />

      <div className="gradient-divider" />

      <Portfolio data={j.portfolio} accent="amber" id="portfolio" />

      <div className="gradient-divider" />

      {/* Values */}
      <section id="values" className="py-20 px-4 bg-gradient-to-b from-emerald-950/20 to-neutral-950">
        <div ref={valuesRef} className="reveal max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-semibold text-white mb-10">{j.valuesTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {j.values.map((v, i) => (
              <div key={i}>
                <div className="text-amber-300 font-serif text-xl font-semibold mb-1">{v.word}</div>
                <p className="text-neutral-400 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Google Reviews — real social proof replaces hardcoded testimonials */}
      <GoogleReviews id="testimonials" limit={3} compact />

      <div className="gradient-divider" />

      {/* Tips & Advice */}
      <Tips data={j.tips} accent="amber" id="tips" />

      <div className="gradient-divider" />

      {/* Related blog article — internal linking (SEO signal) */}
      {/* Glossary terms */}
      <section className="py-16 px-4 bg-neutral-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-2">
              {{ pl: "Słownik", en: "Glossary", de: "Glossar" }[lang] || "Glossary"}
            </div>
            <h2 className="font-serif text-xl font-semibold text-white">
              {{ pl: "Kluczowe pojęcia", en: "Key terms", de: "Schlüsselbegriffe" }[lang] || "Key terms"}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: "srebro-925", pl: "Srebro 925", en: "Sterling Silver", de: "Sterlingsilber" },
              { id: "zloto-probowane", pl: "Złoto 14K/18K", en: "Gold 14K/18K", de: "Gold 14K/18K" },
              { id: "moissanit", pl: "Moissanit", en: "Moissanite", de: "Moissanit" },
              { id: "kamien-szlachetny", pl: "Kamienie szlachetne", en: "Gemstones", de: "Edelsteine" },
              { id: "rodowanie", pl: "Rodowanie", en: "Rhodium plating", de: "Rhodinierung" },
              { id: "personalizowany-grawer", pl: "Grawer", en: "Engraving", de: "Gravur" },
              { id: "pierscionek-zareczynowy", pl: "Pierścionek zaręczynowy", en: "Engagement ring", de: "Verlobungsring" },
              { id: "obraczki-slubne", pl: "Obrączki ślubne", en: "Wedding bands", de: "Eheringe" },
            ].map((term) => (
              <Link key={term.id} to={`/glossary/${term.id}`}
                className="px-4 py-2 rounded-full text-sm bg-neutral-800/60 text-neutral-300 hover:bg-amber-400/10 hover:text-amber-300 border border-neutral-700/50 hover:border-amber-400/30 transition-all">
                {term[lang] || term.en}
              </Link>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to="/glossary" className="text-amber-400/70 text-xs hover:text-amber-300 hover:underline transition-colors">
              {{ pl: "Zobacz pełny glosariusz →", en: "View full glossary →", de: "Vollständiges Glossar →" }[lang] || "View full glossary →"}
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {(() => {
        const post = getPost("pierscionek-zareczynowy-na-zamowienie");
        if (!post) return null;
        return (
          <section className="py-16 px-4 bg-neutral-950">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-2">Blog</div>
                <h2 className="font-serif text-xl font-semibold text-white">
                  {{ pl: "Przeczytaj też", en: "Also read", de: "Lies auch" }[lang] || "Also read"}
                </h2>
              </div>
              <BlogCard post={post} />
            </div>
          </section>
        );
      })()}

      <div className="gradient-divider" />

      {/* Etsy */}
      <section id="shop" className="py-16 px-4 text-center bg-neutral-900/50">
        <div ref={etsyRef} className="reveal">
          <h2 className="font-serif text-2xl font-semibold text-white mb-3">{j.shopTitle}</h2>
          <p className="text-neutral-400 mb-6">{j.shopText}</p>
          <a href="https://aejacashop.etsy.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-medium rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300">
            {j.shopBtn} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-4">{j.ctaTitle}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{j.ctaText}</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 border border-amber-400/30 bg-amber-400/5 backdrop-blur-md text-amber-300 rounded-full hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300">
            {j.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Floating Quick Quote CTA — jumps user straight to calculator (conversion driver) */}
      <a
        href="#calculator"
        className={`floating-cta ${showFloatingCta ? "visible" : ""}`}
        aria-label={FLOATING_CTA_LABELS[lang] || FLOATING_CTA_LABELS.en}
      >
        <span className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-black font-medium rounded-full shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-colors">
          <Calculator className="w-5 h-5" />
          {FLOATING_CTA_LABELS[lang] || FLOATING_CTA_LABELS.en}
        </span>
      </a>
      </div>
    </>
  );
}
