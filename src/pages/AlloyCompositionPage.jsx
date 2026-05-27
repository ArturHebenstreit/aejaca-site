import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import AlloyCompositionCalc from "../components/calculators/AlloyCompositionCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Metalurgia jubilerska",
    heroTitle: "Skład stopów jubilerskich",
    heroDesc: "Dokładny skład chemiczny, temperatura topnienia i twardość stopów złota, srebra i platyny.",
    introTitle: "Dane techniczne stopów",
    introText: "Wszystkie dane oparte na normach europejskich (EN ISO 8654) i standardach branżowych. Skład podany w % wagowych.",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia jubilerskie",
    breadThis: "Skład stopów",
    footerCtaTitle: "Chcesz zamówić biżuterię ze stopu na zamówienie?",
    footerCtaText: "Dobieramy metal i stop do projektu — od srebra 925 po platynę 950.",
    footerCtaBtn: "Napisz do nas",
  },
  en: {
    heroTag: "Jewelry Metallurgy",
    heroTitle: "Alloy Composition Calculator",
    heroDesc: "Exact chemical composition, melting range and hardness of gold, silver and platinum alloys.",
    introTitle: "Alloy Technical Data",
    introText: "All data based on European standards (EN ISO 8654) and industry standards. Composition given in weight %.",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry Tools",
    breadThis: "Alloy Composition",
    footerCtaTitle: "Want to order custom alloy jewelry?",
    footerCtaText: "We select the metal and alloy for your project — from sterling silver to platinum 950.",
    footerCtaBtn: "Contact us",
  },
  de: {
    heroTag: "Schmuckmetallurgie",
    heroTitle: "Legierungszusammensetzung",
    heroDesc: "Genaue chemische Zusammensetzung, Schmelzbereich und Härte von Gold-, Silber- und Platinlegierungen.",
    introTitle: "Technische Legierungsdaten",
    introText: "Alle Daten basieren auf europäischen Normen (EN ISO 8654) und Branchenstandards. Zusammensetzung in Gewichtsprozent.",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
    breadThis: "Legierungszusammensetzung",
    footerCtaTitle: "Schmuck aus einer bestimmten Legierung bestellen?",
    footerCtaText: "Wir wählen Metall und Legierung für Ihr Projekt — von Sterlingsilber bis Platin 950.",
    footerCtaBtn: "Kontakt",
  },
};

const SEO_META = {
  pl: {
    title: "Skład stopów jubilerskich — złoto, srebro, platyna | AEJaCA",
    description: "Kalkulator składu stopów jubilerskich. Złoto 585, 750, 925 srebro, platyna 950 — skład %, temperatura topnienia, twardość Vickers.",
  },
  en: {
    title: "Jewelry Alloy Composition — Gold, Silver, Platinum | AEJaCA",
    description: "Alloy composition calculator for jewelers. Gold 585, 750, silver 925, platinum 950 — composition %, melting range, Vickers hardness.",
  },
  de: {
    title: "Legierungszusammensetzung Schmuck — Gold, Silber, Platin | AEJaCA",
    description: "Legierungsrechner für Goldschmiede. Gold 585, 750, Silber 925, Platin 950 — Zusammensetzung %, Schmelzbereich, Vickers-Härte.",
  },
};

export default function AlloyCompositionPage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;

  const introRef = useScrollReveal();
  const calcRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const schemas = [
    buildWebPageSchema({
      title: seo.title,
      description: seo.description,
      url: `${SITE.url}/toolsjewelry/alloy-composition/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
      { name: L.breadThis, url: `${SITE.url}/toolsjewelry/alloy-composition/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolsjewelry"
        path="/toolsjewelry/alloy-composition"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[340px]">
          <img
            src="/hero-toolsjewelry.webp"
            alt="Skład stopów jubilerskich — AEJaCA"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center flex flex-col items-center">
            <div className="text-amber-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{L.heroTag}</div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-semibold text-white mb-5 leading-[1.02] tracking-tight drop-shadow-2xl">{L.heroTitle}</h1>
            <p className="text-neutral-200 text-base max-w-xl leading-relaxed">{L.heroDesc}</p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadJewelry, href: "/jewelry/" },
              { label: L.breadTools, href: "/toolsjewelry/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        {/* Intro */}
        <section className="py-6 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcRef} className="reveal">
              <AlloyCompositionCalc />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Review CTA */}
        <section className="px-4 bg-neutral-950">
          <ToolReviewCTA />
        </section>

        {/* Footer CTA */}
        <section className="py-10 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.footerCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.footerCtaText}</p>
            <a
              href="/contact/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.footerCtaBtn}
            </a>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
