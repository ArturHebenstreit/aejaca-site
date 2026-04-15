import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import {
  buildOrganizationSchema,
  buildWebPageSchema,
  buildBreadcrumbSchema,
} from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

export default function Home() {
  const { t, lang } = useLanguage();
  const h = t.home;

  const brandRef = useScrollReveal();
  const worldsRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const getCardRef = useStaggerReveal(120);

  // Build structured data at render time so it picks up current language.
  // Organization + WebPage + Breadcrumb give Google + LLMs the full entity graph
  // needed for rich results and accurate AI summarization.
  const seo = getSEO("home", lang);
  const schemas = [
    buildOrganizationSchema(),
    buildWebPageSchema({ title: seo.title, description: seo.description, url: SITE.url, lang }),
    buildBreadcrumbSchema([{ name: "Home", url: SITE.url }]),
  ];

  return (
    <>
      <SEOHead pageKey="home" path="/" schemas={schemas} />
      <div className="pt-16">
        {/* Split Hero — single H1 for SEO hierarchy (only one per page) */}
        <section className="relative min-h-[calc(75vh-4rem)] flex flex-col md:flex-row" aria-label={h.heroAria || "AEJaCA — two worlds"}>
          {/* Visually-hidden H1 packs primary keywords above the fold — Googlebot reads DOM order */}
          <h1 className="sr-only">{h.h1 || "AEJaCA — Handcrafted Jewelry & Digital Fabrication Studio"}</h1>

          {/* Jewelry Panel */}
          <Link to="/jewelry" className="group relative flex-1 min-h-[50vh] md:min-h-full overflow-hidden cursor-pointer" aria-label={h.jewelryBtn}>
            {/* LCP image: eager + fetchpriority=high tells browser to prioritize — Core Web Vitals (LCP < 2.5s) */}
            <img
              src="/hero-jewelry.jpg"
              alt="AEJaCA Jewelry — handcrafted silver and gold jewelry with natural gemstones"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1200"
              height="900"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/60 transition-all duration-500" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-8 text-center">
              <p className="text-amber-300 text-lg md:text-xl font-light tracking-widest uppercase mb-4">{h.jewelrySubtitle}</p>
              <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-8">{h.jewelryDesc}</p>
              <span className="inline-flex items-center gap-2 px-6 py-3 border border-amber-400/30 bg-amber-400/5 backdrop-blur-md text-amber-300 rounded-full text-sm tracking-wide group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 transition-all duration-300">
                {h.jewelryBtn} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <div className="hidden md:block w-px bg-white/20" />

          {/* Studio Panel */}
          <Link to="/studio" className="group relative flex-1 min-h-[50vh] md:min-h-full overflow-hidden cursor-pointer" aria-label={h.studioBtn}>
            <img
              src="/hero-studio.jpg"
              alt="AEJaCA sTuDiO — 3D printing, laser engraving, resin casting, and custom fabrication"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1200"
              height="900"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/60 transition-all duration-500" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-8 text-center">
              <p className="text-blue-300 text-lg md:text-xl font-light tracking-widest uppercase mb-4">{h.studioSubtitle}</p>
              <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-8">{h.studioDesc}</p>
              <span className="inline-flex items-center gap-2 px-6 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full text-sm tracking-wide group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                {h.studioBtn} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>

      {/* Brand Statement */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={brandRef} className="reveal max-w-3xl mx-auto">
          {/* Below-the-fold image: lazy loaded to save bandwidth — no LCP impact */}
          <img src="/brand-sign.png" alt="AEJaCA brand mark" loading="lazy" decoding="async" className="w-36 h-36 mx-auto mb-8 brightness-0 invert opacity-80 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" />
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">{h.brandHeading}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">{h.brandText}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Two Worlds */}
      <section className="py-16 px-4 bg-neutral-900/50">
        <div ref={worldsRef} className="reveal max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div ref={getCardRef(0)} className="reveal-scale rounded-2xl glass-amber p-8 hover:shadow-lg hover:shadow-amber-900/10 transition-shadow duration-300">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{h.artisticLuxury}</div>
            <h3 className="font-serif text-2xl font-semibold mb-4">{h.jewelryCardTitle}</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              {h.jewelryCardItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/jewelry" className="inline-flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300 transition-colors group/link">
              {h.learnMore} <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>

          <div ref={getCardRef(1)} className="reveal-scale rounded-2xl glass-blue p-8 hover:shadow-lg hover:shadow-blue-900/10 transition-shadow duration-300">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{h.technicalEngineering}</div>
            <h3 className="font-sans text-2xl font-semibold mb-4">{h.studioCardTitle}</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              {h.studioCardItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/studio" className="inline-flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300 transition-colors group/link">
              {h.learnMore} <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4">{h.ctaHeading}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{h.ctaText}</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10 transition-all duration-300">
            {h.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}
