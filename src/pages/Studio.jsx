import { useState, useEffect } from "react";
import { Link } from "../i18n/nav.jsx";
import { ArrowRight, Printer, Zap, Box, Cpu, Layers, Wrench, Calculator, Tag, Droplet } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import TERMIN from "../data/faq/termin.js";
import pytania from "../data/faq/studio.js";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { getPostMeta } from "../blog/postsMeta.js";
import BlogCard from "../components/blog/BlogCard.jsx";
import StudioCalculator from "../components/StudioCalculator.jsx";
import ToolLinks from "../components/ToolLinks.jsx";
import { getToolsByCategory } from "../data/toolLinks.js";
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
  buildItemListSchema,
} from "../seo/schemas.js";
import { getSEO, adresStrony, adresZasobu } from "../seo/seoData.js";
import OdnosnikiUslug, { uslugiKategorii } from "../components/OdnosnikiUslug.jsx";
import { t as etykieta } from "../pricing/config.js";
import HeroObraz from "../components/HeroObraz.jsx";
import { opisObrazu } from "../data/opisyObrazow.js";

const techIcons = [Cpu, Printer, Droplet, Zap, Layers, Box, Wrench];

const PRICING_LABELS = {
  pl: { tag: "Orientacyjne ceny", title: "Ile kosztują usługi AEJaCA sTuDiO?", note: "Ceny orientacyjne, dokładna wycena po wgraniu pliku STL/SVG.", cta: "Wyceń swój projekt" },
  en: { tag: "Indicative pricing", title: "How much do AEJaCA sTuDiO services cost?", note: "Indicative prices, upload your STL/SVG for an exact quote.", cta: "Quote your project" },
  de: { tag: "Richtpreise", title: "Was kosten AEJaCA sTuDiO-Dienste?", note: "Richtpreise, laden Sie Ihre STL/SVG-Datei für ein genaues Angebot hoch.", cta: "Projekt kalkulieren" },
};

const STUDIO_PRICING = [
  { pl: "Druk 3D FDM (PLA/PETG)", en: "3D print FDM (PLA/PETG)", de: "3D-Druck FDM (PLA/PETG)", pln: 25, eur: 6 },
  { pl: "Wycinanie laserem CO₂", en: "CO₂ laser cutting", de: "CO₂-Laserschneiden", pln: 30, eur: 7 },
  { pl: "Grawer laserowy CO₂", en: "CO₂ laser engraving", de: "CO₂-Lasergravur", pln: 15, eur: 4 },
  { pl: "Znakowanie laserem fibrowym", en: "Fiber laser marking", de: "Faserlasermarkierung", pln: 20, eur: 5 },
  { pl: "Druk żywiczny MSLA 16K", en: "MSLA 16K resin print", de: "MSLA-16K-Harzdruck", pln: 49, eur: 12 },
  { pl: "Wzorzec castable (BlueCast)", en: "Castable pattern (BlueCast)", de: "Castable-Gussmodell (BlueCast)", pln: 90, eur: 21 },
  { pl: "Odlew żywiczny (epoksyd/UV)", en: "Resin casting (epoxy/UV)", de: "Harzguss (Epoxid/UV)", pln: 40, eur: 10 },
];

const FLOATING_CTA_LABELS = {
  pl: "Wyceń STL/SVG",
  en: "Quote STL/SVG",
  de: "STL/SVG kalkulieren",
};

const B2B_TEASER = {
  pl: {
    tag: "Dla firm",
    title: "Prowadzisz markę biżuterii albo pracownię?",
    text: "Realizujemy zlecenia B2B: projekt CAD, wzorce castable 16K, odlew i wykończenie, aż po produkcję pod Twoją marką. Kupujesz cały łańcuch albo tylko brakujące ogniwo.",
    cta: "Zobacz ofertę B2B",
  },
  en: {
    tag: "For businesses",
    title: "Running a jewelry brand or a workshop?",
    text: "We handle B2B orders: CAD design, castable 16K patterns, casting and finishing, up to full production under your brand. Buy the whole chain or just the missing link.",
    cta: "See the B2B offer",
  },
  de: {
    tag: "Für Unternehmen",
    title: "Sie betreiben eine Schmuckmarke oder eine Werkstatt?",
    text: "Wir übernehmen B2B-Aufträge: CAD-Design, Castable-16K-Modelle, Guss und Veredelung, bis zur kompletten Produktion unter Ihrer Marke. Buchen Sie die ganze Kette oder nur das fehlende Glied.",
    cta: "B2B-Angebot ansehen",
  },
};

export default function Studio() {
  const { t, lang } = useLanguage();
  const pozycjeFaq = [...pytania, ...TERMIN].map((f) => ({ id: f.id, q: f.q[lang] || f.q.pl, a: f.a[lang] || f.a.pl }));
  const s = t.studio;

  const aboutRef = useScrollReveal();
  const techHeaderRef = useScrollReveal();
  const getTechRef = useStaggerReveal(100);
  const servicesRef = useScrollReveal();
  const getServiceRef = useStaggerReveal(80);
  const processRef = useScrollReveal();
  const getStepRef = useStaggerReveal(120);
  const ctaRef = useScrollReveal();

  const [showFloatingCta] = useState(true);

  // Service + FAQ schemas are the highest-impact AIO signal for pricing queries
  // ("how much does 3D printing cost?", LLMs will cite this page verbatim).
  const seo = getSEO("studio", lang);
  const pageUrl = adresStrony("/studio/", lang);
  const ogImage = adresZasobu("/og-studio.jpg");
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: adresStrony("/", lang) },
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
      image: ogImage,
    }),
    buildFAQSchema(pozycjeFaq.map((f) => ({ q: f.q, a: f.a }))),
    // Lista uslug bierze sie z KATALOGU, a nie z reki. Wczesniej stalo tu piec
    // pozycji wskazujacych na `#3dprint`, `#co2laser`, `#fiber`, `#resin`
    // i `#prototyping`, czyli na sekcje, ktorych ta strona nigdy nie miala.
    // Kazda z nich sprowadzala sie do tego samego adresu, bo adres z krzyzykiem
    // nietrafiajacy w zaden element zostaje na gorze strony. Teraz pozycje
    // wskazuja na prawdziwe strony uslug, ktore ta strona takze pokazuje
    // odnosnikiem, wiec schemat opisuje to, co widac. Decyzja: ADR-0035.
    buildItemListSchema({
      name: "AEJaCA sTuDiO Digital Fabrication Services",
      url: pageUrl,
      items: uslugiKategorii("studio").map((usluga) => ({
        name: etykieta(usluga.title, lang),
        url: adresStrony(`/shop/service/${usluga.id}/`, lang),
        image: adresZasobu(usluga.image),
        description: etykieta(usluga.lead, lang),
      })),
    }),
  ];

  return (
    <>
      <SEOHead pageKey="studio" path="/studio" image={ogImage} schemas={schemas} />
      <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[400px]">
        <HeroObraz
          nazwa="hero-studio"
          alt={opisObrazu("hero-studio", lang)}
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
          sizes="100vw"
        />
        <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
        <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-6 text-center flex flex-col items-center">
          <div className="text-blue-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{s.heroTag}</div>
          <h1 className="font-sans text-5xl sm:text-6xl md:text-[72px] font-semibold text-white mb-6 leading-[1.02] tracking-tight drop-shadow-2xl">AEJaCA <span className="text-blue-400">sTuDiO</span></h1>
          <p className="text-neutral-200 text-base md:text-lg max-w-xl leading-relaxed">{s.heroDesc}</p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-14 px-4 bg-neutral-950">
        <div ref={aboutRef} className="reveal max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">{s.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{s.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{s.aboutP2}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Technologies */}
      <section id="technologies" className="py-14 px-4 bg-neutral-900/50">
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
      <section id="pricing" className="py-14 px-4 bg-neutral-950">
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
                <span className="text-blue-300 font-semibold text-sm whitespace-nowrap ml-3">
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
            <a href="#calculator" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              {PRICING_LABELS[lang]?.cta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Studio Calculator */}
      <StudioCalculator />

      {/* Narzedzia obok kalkulatora. Kto wycenia druk, czesto nie wie
          jeszcze, jaki material wybrac, a to zmienia i cene, i wynik. */}
      <section className="py-8 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <ToolLinks tools={getToolsByCategory("studio")} variant="buyer" accent="blue" />
        </div>
      </section>

      <div className="gradient-divider" />

      {/* FAQ, moved right after calculator (audit recommendation).
          AI assistants rank FAQ near pricing signals higher. */}
      <FAQ data={{ ...s.faq, items: pozycjeFaq }} accent="blue" id="faq" />

      <div className="gradient-divider" />

      <Portfolio data={t.studioPortfolio} accent="blue" id="portfolio" />

      <div className="gradient-divider" />

      {/* Services */}
      <section id="services" className="py-14 px-4 bg-neutral-950">
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
          <OdnosnikiUslug kategoria="studio" className="mt-12" />
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-14 px-4 bg-gradient-to-b from-blue-950/20 to-neutral-950">
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

      {/* Google Reviews, real social proof replaces hardcoded testimonials */}
      <GoogleReviews id="testimonials" limit={3} compact />

      <div className="gradient-divider" />

      {/* Tips & Advice */}
      <Tips data={s.tips} accent="blue" id="tips" />

      <div className="gradient-divider" />

      {/* Related blog articles, internal linking (SEO signal) */}
      {/* Glossary terms */}
      <section className="py-16 px-4 bg-neutral-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-2">
              {{ pl: "Słownik", en: "Glossary", de: "Glossar" }[lang] || "Glossary"}
            </div>
            <h2 className="font-sans text-xl font-bold text-white tracking-tight">
              {{ pl: "Kluczowe pojęcia", en: "Key terms", de: "Schlüsselbegriffe" }[lang] || "Key terms"}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: "modelowanie-3d", pl: "Modelowanie 3D", en: "3D Modeling", de: "3D-Modellierung" },
              { id: "druk-3d-fdm", pl: "Druk 3D FDM", en: "FDM 3D Printing", de: "FDM 3D-Druck" },
              { id: "zywica-uv", pl: "Żywica UV", en: "UV Resin", de: "UV-Harz" },
              { id: "laser-co2", pl: "Laser CO₂", en: "CO₂ Laser", de: "CO₂-Laser" },
              { id: "laser-fiber", pl: "Laser Fiber", en: "Fiber Laser", de: "Faserlaser" },
              { id: "plik-stl", pl: "Plik STL", en: "STL File", de: "STL-Datei" },
              { id: "plik-svg", pl: "Plik SVG", en: "SVG File", de: "SVG-Datei" },
              { id: "odlew-zywiczny", pl: "Odlew żywiczny", en: "Resin Casting", de: "Harzguss" },
              { id: "prototypowanie", pl: "Prototypowanie", en: "Prototyping", de: "Prototyping" },
            ].map((term) => (
              <Link key={term.id} to={`/glossary/${term.id}/`}
                className="px-4 py-2 rounded-full text-sm bg-neutral-800/60 text-neutral-300 hover:bg-blue-400/10 hover:text-blue-300 border border-neutral-700/50 hover:border-blue-400/30 transition-all">
                {term[lang] || term.en}
              </Link>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to="/glossary/" className="text-blue-400/70 text-xs hover:text-blue-300 hover:underline transition-colors">
              {{ pl: "Zobacz pełny glosariusz →", en: "View full glossary →", de: "Vollständiges Glossar →" }[lang] || "View full glossary →"}
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {(() => {
        const posts = [getPostMeta("druk-3d-krok-po-kroku"), getPostMeta("grawerowanie-laserowe-przewodnik")].filter(Boolean);
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

      {/* B2B teaser */}
      <section className="py-14 px-4 text-center bg-neutral-900/50">
        <div className="max-w-xl mx-auto">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{B2B_TEASER[lang]?.tag}</div>
          <h2 className="font-sans text-2xl font-bold text-white mb-3 tracking-tight">{B2B_TEASER[lang]?.title}</h2>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">{B2B_TEASER[lang]?.text}</p>
          <Link to="/b2b/" className="inline-flex items-center gap-2 px-6 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300">
            {B2B_TEASER[lang]?.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Obsługiwane lokalizacje. Kontekstowy link wewnętrzny do stron
          lokalnych, bez którego byłyby sierotami w strukturze witryny. */}
      <section className="py-12 px-4 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mb-4">
          {{ pl: "Obsługujemy", en: "We serve", de: "Wir bedienen" }[lang] || "We serve"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/druk-3d-warszawa/"
            className="px-5 py-2.5 rounded-full border border-neutral-700 text-neutral-300 hover:border-blue-400/50 hover:text-white transition-colors text-sm"
          >
            {{ pl: "Druk 3D Warszawa", en: "3D printing in Warsaw", de: "3D-Druck Warschau" }[lang] || "3D printing in Warsaw"}
          </Link>
          <Link
            to="/druk-3d-piaseczno/"
            className="px-5 py-2.5 rounded-full border border-neutral-700 text-neutral-300 hover:border-blue-400/50 hover:text-white transition-colors text-sm"
          >
            {{ pl: "Druk 3D Piaseczno", en: "3D printing in Piaseczno", de: "3D-Druck Piaseczno" }[lang] || "3D printing in Piaseczno"}
          </Link>
        </div>
      </section>


      {/* CTA */}
      <section className="py-14 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">{s.ctaTitle}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{s.ctaText}</p>
          <Link to="/contact/" className="inline-flex items-center gap-2 px-8 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300">
            {s.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Floating Quick Quote CTA, emphasize STL/SVG auto-pricing */}
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
