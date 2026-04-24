import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gem, Sparkles, Palette, Heart, Wand2, Crown, Calculator } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { getPost } from "../blog/posts.js";
import BlogCard from "../components/blog/BlogCard.jsx";
import JewelryEstimator from "../components/JewelryEstimator.jsx";
import ProcessGallery from "../components/ProcessGallery.jsx";
// import Portfolio from "../components/Portfolio.jsx"; // temporarily disabled
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
} from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const icons = [Gem, Sparkles, Palette, Heart, Wand2, Crown];

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
    // Product schemas = enable rich results (price, rating) in Google Shopping + AI answers
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
      <SEOHead pageKey="jewelry" path="/jewelry" image={`${SITE.url}/hero-jewelry.jpg`} schemas={schemas} />
      <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img
            src="/hero-jewelry.jpg"
            alt="AEJaCA Jewelry — handcrafted silver rings, earrings, and gemstone pieces"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1600"
            height="640"
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

      {/* Portfolio — temporarily replaced with placeholder */}
      <section id="portfolio" className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.portfolio?.tag || "Portfolio"}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-8">{j.portfolio?.title || "Portfolio"}</h2>
          <div className="py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="text-neutral-400 text-lg">
              {{ pl: "W trakcie przygotowania", en: "In preparation", de: "In Vorbereitung" }[lang] || "In preparation"}
            </div>
          </div>
        </div>
      </section>

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
