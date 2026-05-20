import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import MetalPricingCalc from "../components/calculators/MetalPricingCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Wycena surowca",
    heroTitle: "Kalkulator wartości metali szlachetnych",
    heroDesc: "Oblicz wartość złota, srebra i platyny w PLN i EUR na podstawie aktualnych cen spot.",
    introTitle: "Skąd pochodzi cena?",
    introText: "Cena spot pobierana jest z rynku globalnego (XAU/XAG/XPT w USD, przeliczana na PLN według kursu NBP). Aktualizacja co 60 minut.",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia jubilerskie",
    breadThis: "Wycena surowca",
    footerCtaTitle: "Chcesz sprzedać lub kupić metal szlachetny?",
    footerCtaText: "Skontaktuj się z nami — wycenimy surowiec i doradzimy w wyborze stopu do projektu.",
    footerCtaBtn: "Napisz do nas",
  },
  en: {
    heroTag: "Metal Valuation",
    heroTitle: "Precious Metal Pricing Calculator",
    heroDesc: "Calculate the value of gold, silver and platinum in PLN and EUR based on current spot prices.",
    introTitle: "Where does the price come from?",
    introText: "Spot price is sourced from the global market (XAU/XAG/XPT in USD, converted to PLN at NBP rate). Updated every 60 minutes.",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry Tools",
    breadThis: "Metal Pricing",
    footerCtaTitle: "Want to sell or buy precious metal?",
    footerCtaText: "Contact us — we will value the material and advise on alloy choice for your project.",
    footerCtaBtn: "Contact us",
  },
  de: {
    heroTag: "Metallbewertung",
    heroTitle: "Edelmetall-Preiskalkulator",
    heroDesc: "Berechnen Sie den Wert von Gold, Silber und Platin in PLN und EUR basierend auf aktuellen Spotpreisen.",
    introTitle: "Woher kommt der Preis?",
    introText: "Der Spotpreis stammt vom Weltmarkt (XAU/XAG/XPT in USD, in PLN zum NBP-Kurs umgerechnet). Aktualisierung alle 60 Minuten.",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
    breadThis: "Metallbewertung",
    footerCtaTitle: "Edelmetall kaufen oder verkaufen?",
    footerCtaText: "Kontaktieren Sie uns — wir bewerten das Material und beraten bei der Legierungswahl.",
    footerCtaBtn: "Kontakt",
  },
};

const SEO_META = {
  pl: {
    title: "Wycena metali szlachetnych — złoto, srebro, platyna PLN | AEJaCA",
    description: "Kalkulator wartości metali szlachetnych. Oblicz cenę złota 585/750/999, srebra 925, platyny 950 w PLN na podstawie ceny spot.",
  },
  en: {
    title: "Precious Metal Pricing Calculator — Gold, Silver, Platinum | AEJaCA",
    description: "Calculate the value of gold, silver and platinum alloys in PLN and EUR based on live spot prices.",
  },
  de: {
    title: "Edelmetall-Preiskalkulator — Gold, Silber, Platin PLN | AEJaCA",
    description: "Berechnen Sie den Wert von Gold, Silber und Platin in PLN und EUR auf Basis aktueller Spotpreise.",
  },
};

export default function MetalPricingPage() {
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
      url: `${SITE.url}/toolsjewelry/metal-pricing/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
      { name: L.breadThis, url: `${SITE.url}/toolsjewelry/metal-pricing/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolsjewelry"
        path="/toolsjewelry/metal-pricing"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[480px]">
          <img
            src="/hero-toolsjewelry.webp"
            alt="Wycena metali szlachetnych — AEJaCA"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-20 text-center flex flex-col items-center">
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
        <section className="py-10 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-12 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcRef} className="reveal">
              <MetalPricingCalc />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Review CTA */}
        <section className="px-4 bg-neutral-950">
          <ToolReviewCTA />
        </section>

        {/* Footer CTA */}
        <section className="py-12 px-4 bg-neutral-950 text-center">
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
