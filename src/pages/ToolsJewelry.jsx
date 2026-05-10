import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import RingBlankCalc from "../components/calculators/RingBlankCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const LABELS = {
  pl: {
    heroTag: "Wiedza otwarta",
    heroTitle: "Narzędzia dla jubilerów",
    heroDesc: "Darmowe kalkulatory dla złotników i twórców biżuterii. Oblicz blank, zaplanuj projekt.",
    whyTitle: "Dlaczego dzielę się wiedzą?",
    whyText: "Rzemiosło jubilerskie powinno być dostępne. Każdy, kto chce tworzyć biżuterię, zasługuje na rzetelne informacje — bez ukrytych kalkulacji i marży za „tajniki zawodu”. AEJaCA to pracownia, która wierzy, że wiedza otwiera więcej drzwi niż jej zamykanie. Te narzędzia są bezpłatne, bez reklam, bez rejestracji.",
    calcCTATitle: "Kalkulator wyceny biżuterii",
    calcCTADesc: "Szybka wycena pierścionków, obrączek, wisiorków na podstawie aktualnych cen metali i kamieni.",
    calcCTABtn: "Przejdź do kalkulatora wyceny",
    ringBlankTitle: "Kalkulator blanku obrączki",
    ringBlankSubtitle: "Oblicz długość pręta i masę blanku dla dowolnego metalu, średnicy i szerokości obrączki.",
    footerCtaTitle: "Chcesz zamówić biżuterię?",
    footerCtaText: "Kalkulatory to wiedza — realizacja to nasza specjalność.",
    footerCtaBtn: "AEJaCA Biżuteria",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia jubilerskie",
  },
  en: {
    heroTag: "Open knowledge",
    heroTitle: "Tools for Jewelers",
    heroDesc: "Free calculators for goldsmiths and jewelry makers. Calculate ring blanks, plan your project.",
    whyTitle: "Why do I share this knowledge?",
    whyText: "Jewelry craft should be accessible. Everyone who wants to make jewelry deserves honest information — without hidden calculations or premium pricing for 'trade secrets'. AEJaCA is a studio that believes knowledge opens more doors than it closes. These tools are free, ad-free, no sign-up required.",
    calcCTATitle: "Jewelry Pricing Calculator",
    calcCTADesc: "Quick estimate for rings, bands, pendants based on current metal and gemstone prices.",
    calcCTABtn: "Go to pricing calculator",
    ringBlankTitle: "Ring Blank Calculator",
    ringBlankSubtitle: "Calculate strip length and weight for any metal, inner diameter, and band width.",
    footerCtaTitle: "Want to order jewelry?",
    footerCtaText: "Calculators are knowledge — execution is our specialty.",
    footerCtaBtn: "AEJaCA Jewelry",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry Tools",
  },
  de: {
    heroTag: "Offenes Wissen",
    heroTitle: "Tools für Goldschmiede",
    heroDesc: "Kostenlose Kalkulatoren für Goldschmiede und Schmuckmacher. Rohling berechnen, Projekt planen.",
    whyTitle: "Warum teile ich dieses Wissen?",
    whyText: "Das Schmuckhandwerk sollte zugänglich sein. Jeder, der Schmuck herstellen möchte, verdient ehrliche Informationen — ohne versteckte Berechnungen oder Aufpreise für 'Branchengeheimnisse'. AEJaCA ist ein Atelier, das glaubt, dass Wissen mehr Türen öffnet als es schließt. Diese Tools sind kostenlos, werbefrei und erfordern keine Anmeldung.",
    calcCTATitle: "Schmuck-Preiskalkulator",
    calcCTADesc: "Schnelle Schätzung für Ringe, Bänder, Anhänger basierend auf aktuellen Metall- und Edelsteinpreisen.",
    calcCTABtn: "Zum Preiskalkulator",
    ringBlankTitle: "Ring-Rohling-Rechner",
    ringBlankSubtitle: "Streifen-länge und Gewicht für beliebige Metalle, Innendurchmesser und Ringbreite berechnen.",
    footerCtaTitle: "Schmuck bestellen?",
    footerCtaText: "Kalkulatoren sind Wissen — Ausführung ist unsere Spezialität.",
    footerCtaBtn: "AEJaCA Schmuck",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
  },
};

export default function ToolsJewelry() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = getSEO("toolsjewelry", lang);

  const whyRef = useScrollReveal();
  const calcCTARef = useScrollReveal();
  const ringBlankRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: `${SITE.url}/toolsjewelry/` }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
    ]),
  ];

  return (
    <>
      <SEOHead pageKey="toolsjewelry" path="/toolsjewelry" schemas={schemas} />
      <div className="pt-16 bg-neutral-950">

        {/* Hero */}
        <section className="bg-neutral-950 py-10 px-4">
          <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px] bg-gradient-to-br from-stone-800 via-amber-950 to-stone-950">
            <img
              src="/hero-toolsjewelry.webp"
              alt="Narzędzia dla jubilerów — AEJaCA"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1024"
              height="572"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
              <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">{L.heroTag}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">{L.heroTitle}</h1>
              <p className="text-neutral-300 text-base max-w-2xl">{L.heroDesc}</p>
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadJewelry, href: "/jewelry/" },
              { label: L.breadTools },
            ]}
          />
        </div>

        {/* Why I share this knowledge */}
        <section className="py-12 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={whyRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.whyTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.whyText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* CTA tile → /jewelry/#calculator */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcCTARef} className="reveal">
              <Link
                to="/jewelry/#calculator"
                className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-5 rounded-2xl glass hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <Calculator className="w-10 h-10 text-amber-400 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-base group-hover:text-amber-300 transition-colors">{L.calcCTATitle}</div>
                    <div className="text-neutral-400 text-sm mt-0.5 leading-relaxed">{L.calcCTADesc}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 group-hover:text-amber-300 sm:ml-auto shrink-0 transition-colors">
                  {L.calcCTABtn} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Ring Blank Calculator */}
        <section id="ring-blank" className="py-16 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={ringBlankRef} className="reveal mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{L.ringBlankTitle}</h2>
              <p className="text-neutral-400">{L.ringBlankSubtitle}</p>
            </div>
            <RingBlankCalc lang={lang} />
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Footer CTA */}
        <section className="py-12 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.footerCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.footerCtaText}</p>
            <Link
              to="/jewelry/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.footerCtaBtn} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
