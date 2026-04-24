import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Printer, Zap, Box, Cpu, Layers, Wrench, Calculator, Tag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { getPost } from "../blog/posts.js";
import BlogCard from "../components/blog/BlogCard.jsx";
import StudioCalculator from "../components/StudioCalculator.jsx";
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

const techIcons = [Cpu, Printer, Zap, Layers, Box, Wrench];

const PRICING_LABELS = {
  pl: { tag: "Orientacyjne ceny", title: "Ile kosztują usługi studia?", note: "Ceny orientacyjne — dokładna wycena po wgraniu pliku STL/SVG.", cta: "Wyceń swój projekt" },
  en: { tag: "Indicative pricing", title: "How much do studio services cost?", note: "Indicative prices — upload your STL/SVG for an exact quote.", cta: "Quote your project" },
  de: { tag: "Richtpreise", title: "Was kosten Studio-Dienste?", note: "Richtpreise — laden Sie Ihre STL/SVG-Datei für ein genaues Angebot hoch.", cta: "Projekt kalkulieren" },
};

const STUDIO_PRICING = [
  { pl: "Druk 3D FDM (PLA/PETG)", en: "3D print FDM (PLA/PETG)", de: "3D-Druck FDM (PLA/PETG)", from: "25 PLN" },
  { pl: "Druk 3D żywica", en: "3D print resin (SLA)", de: "3D-Druck Harz (SLA)", from: "45 PLN" },
  { pl: "Grawer laserowy CO₂", en: "CO₂ laser engraving", de: "CO₂-Lasergravur", from: "15 PLN" },
  { pl: "Znakowanie laserem fibrowym", en: "Fiber laser marking", de: "Faserlasermarkierung", from: "20 PLN" },
  { pl: "Odlew żywiczny (epoksyd/UV)", en: "Resin casting (epoxy/UV)", de: "Harzguss (Epoxid/UV)", from: "40 PLN" },
];

const FLOATING_CTA_LABELS = {
  pl: "Wyceń STL/SVG",
  en: "Quote STL/SVG",
  de: "STL/SVG kalkulieren",
};

export default function Studio() {
  const { t, lang } = useLanguage();
  const s = t.studio;

  const aboutRef = useScrollReveal();
  const techHeaderRef = useScrollReveal();
  const getTechRef = useStaggerReveal(100);
  const servicesRef = useScrollReveal();
  const getServiceRef = useStaggerReveal(80);
  const processRef = useScrollReveal();
  const getStepRef = useStaggerReveal(120);
  const etsyRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const [showFloatingCta, setShowFloatingCta] = useState(false);
  useEffect(() => {
    function onScroll() { setShowFloatingCta(window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Service + FAQ schemas are the highest-impact AIO signal for pricing queries
  // ("how much does 3D printing cost?" — LLMs will cite this page verbatim).
  const seo = getSEO("studio", lang);
  const pageUrl = `${SITE.url}/studio`;
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "sTuDiO", url: pageUrl },
    ]),
    buildServiceSchema({
      name: seo.title,
      description: seo.description,
      serviceType: "3D printing, laser engraving, resin casting and digital fabrication",
      url: pageUrl,
      offers: { price: "25", minPrice: "5", maxPrice: "2000", currency: "EUR" },
    }),
    // HowTo schema: Idea → Design → Prototype → Production (AI citations for "how X works")
    s.processSteps?.length && buildHowToSchema({
      name: s.processTitle,
      description: s.processTag,
      steps: s.processSteps,
      image: `${SITE.url}/hero-studio.jpg`,
    }),
    s.faq?.items && buildFAQSchema(s.faq.items),
    // Product schemas = enable rich results (price) in Google Shopping + AI answers
    buildProductSchema({
      name: "Custom 3D Print (FDM) — AEJaCA sTuDiO",
      description: "Professional FDM 3D printing service using PLA, PETG, ABS, PA6-CF, and PPA-CF. From rapid prototypes to production parts.",
      image: `${SITE.url}/hero-studio.jpg`,
      sku: "AEJACA-3DPRINT",
      price: "25",
      currency: "EUR",
    }),
    buildProductSchema({
      name: "CO2 Laser Engraving & Cutting — AEJaCA sTuDiO",
      description: "xTool P2 55W CO2 laser engraving on wood, acrylic, glass, leather. Precision cutting of plywood, MDF, and acrylic sheets.",
      image: `${SITE.url}/hero-studio.jpg`,
      sku: "AEJACA-CO2LASER",
      price: "15",
      currency: "EUR",
    }),
    buildProductSchema({
      name: "Fiber Laser Marking — AEJaCA sTuDiO",
      description: "Raycus 30W fiber laser marking on stainless steel, titanium, silver, gold, brass, stone, and ceramics.",
      image: `${SITE.url}/hero-studio.jpg`,
      sku: "AEJACA-FIBER",
      price: "20",
      currency: "EUR",
    }),
  ];

  return (
    <>
      <SEOHead pageKey="studio" path="/studio" image={`${SITE.url}/hero-studio.jpg`} schemas={schemas} />
      <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img
            src="/hero-studio.jpg"
            alt="AEJaCA sTuDiO — 3D printing, laser engraving, and custom fabrication workshop"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1600"
            height="640"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
            <div className="text-blue-400 text-xs uppercase tracking-[0.25em] mb-3">{s.heroTag}</div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg tracking-tight">
              AEJaCA <span className="text-blue-400">{s.heroTitle}</span>
            </h1>
            <p className="text-neutral-300 text-base max-w-2xl">{s.heroDesc}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4 bg-neutral-950">
        <div ref={aboutRef} className="reveal max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">{s.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{s.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{s.aboutP2}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Technologies */}
      <section id="technologies" className="py-20 px-4 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div ref={techHeaderRef} className="reveal text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.techTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{s.techTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {s.technologies.map((tech, i) => {
              const Icon = techIcons[i];
              return (
                <div key={i} ref={getTechRef(i)} className="reveal-scale p-6 rounded-xl glass-blue hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300 group">
                  <Icon className="w-8 h-8 text-blue-400 mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="font-sans text-lg font-semibold text-white mb-2">{tech.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{tech.desc}</p>
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
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{PRICING_LABELS[lang]?.tag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{PRICING_LABELS[lang]?.title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STUDIO_PRICING.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl glass-blue">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-neutral-200 text-sm">{item[lang] || item.en}</span>
                </div>
                <span className="text-blue-300 font-semibold text-sm whitespace-nowrap ml-3">{{ pl: "od", en: "from", de: "ab" }[lang]} {item.from}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-neutral-400 text-sm mb-4">{PRICING_LABELS[lang]?.note}</p>
            <a href="#calculator" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              {PRICING_LABELS[lang]?.cta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Studio Calculator */}
      <StudioCalculator />

      <div className="gradient-divider" />

      {/* FAQ — moved right after calculator (audit recommendation).
          AI assistants rank FAQ near pricing signals higher. */}
      <FAQ data={s.faq} accent="blue" id="faq" />

      <div className="gradient-divider" />

      {/* Portfolio — temporarily replaced with placeholder */}
      <section id="portfolio" className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.portfolio?.tag || "Portfolio"}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight mb-8">{s.portfolio?.title || "Portfolio"}</h2>
          <div className="py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="text-neutral-400 text-lg">
              {{ pl: "W trakcie przygotowania", en: "In preparation", de: "In Vorbereitung" }[lang] || "In preparation"}
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Services */}
      <section id="services" className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div ref={servicesRef} className="reveal text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.servicesTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{s.servicesTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {s.services.map((service, i) => (
              <div key={i} ref={getServiceRef(i)} className="reveal-scale flex items-start gap-3 p-4 rounded-lg glass hover:border-blue-500/20 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                <span className="text-neutral-300 text-sm">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-20 px-4 bg-gradient-to-b from-blue-950/20 to-neutral-950">
        <div ref={processRef} className="reveal max-w-4xl mx-auto text-center">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.processTag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">{s.processTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {s.processSteps.map((step, i) => (
              <div key={i} ref={getStepRef(i)} className="reveal-scale">
                <div className="text-blue-400 font-mono text-2xl font-bold mb-2">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-sans text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-sm">{step.desc}</p>
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
      <Tips data={s.tips} accent="blue" id="tips" />

      <div className="gradient-divider" />

      {/* Related blog articles — internal linking (SEO signal) */}
      {(() => {
        const posts = [getPost("druk-3d-krok-po-kroku"), getPost("grawerowanie-laserowe-przewodnik")].filter(Boolean);
        if (!posts.length) return null;
        return (
          <section className="py-16 px-4 bg-neutral-950">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-2">Blog</div>
                <h2 className="font-sans text-xl font-bold text-white tracking-tight">
                  {{ pl: "Przeczytaj też", en: "Also read", de: "Lies auch" }[lang] || "Also read"}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {posts.map((p) => <BlogCard key={p.slug} post={p} />)}
              </div>
            </div>
          </section>
        );
      })()}

      <div className="gradient-divider" />

      {/* Etsy */}
      <section id="shop" className="py-16 px-4 text-center bg-neutral-900/50">
        <div ref={etsyRef} className="reveal">
          <h2 className="font-sans text-2xl font-bold text-white mb-3 tracking-tight">{s.shopTitle}</h2>
          <p className="text-neutral-400 mb-6">{s.shopText}</p>
          <a href="https://aejaca2studio.etsy.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
            {s.shopBtn} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">{s.ctaTitle}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{s.ctaText}</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300">
            {s.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Floating Quick Quote CTA — emphasize STL/SVG auto-pricing */}
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent("studio-quick-upload"));
        }}
        className={`floating-cta ${showFloatingCta ? "visible" : ""}`}
        aria-label={FLOATING_CTA_LABELS[lang] || FLOATING_CTA_LABELS.en}
      >
        <span className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-white font-medium rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors">
          <Calculator className="w-5 h-5" />
          {FLOATING_CTA_LABELS[lang] || FLOATING_CTA_LABELS.en}
        </span>
      </button>
      </div>
    </>
  );
}
