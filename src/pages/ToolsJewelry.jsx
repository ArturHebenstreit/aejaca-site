import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Gem } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const LABELS = {
  pl: {
    tag: "Narzędzia jubilerskie",
    h1: "Narzędzia dla jubilerów",
    pageDesc: "Darmowe kalkulatory jubilerskie. Oblicz długość blanku obrączki, wycen biżuterię na zamówienie — bez rejestracji.",
    whyTitle: "Dlaczego dzielę się wiedzą?",
    whyText: "Rzemiosło jubilerskie powinno być dostępne. Każdy, kto chce tworzyć biżuterię, zasługuje na rzetelne informacje — bez ukrytych kalkulacji i marży za „tajniki zawodu\u201D. AEJaCA to pracownia, która wierzy, że wiedza otwiera więcej drzwi niż ją zamykanie. Te narzędzia są bezpłatne, bez reklam i bez rejestracji.",
    jewelryCtaTitle: "Chcesz zamówić biżuterię?",
    jewelryCtaText: "Kalkulatory to wiedza — realizacja zleceń to nasza specjalność.",
    jewelryCtaBtn: "Biżuteria AEJaCA →",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia",
    free: "Bezpłatne",
    open: "Otwórz",
    tools: {
      jewelryCalc: {
        title: "Kalkulator biżuterii",
        desc: "Szybka wycena pierścionków, obrączek, wisiorków. Wybierz metal, kamień i profil — orientacyjna cena w kilka sekund.",
        to: "/jewelry/#calculator",
      },
      ringBlank: {
        title: "Kalkulator blanku obrączki",
        desc: "Oblicz długość pręta i przybliżoną masę blanku dla dowolnego metalu, średnicy wewnętrznej i szerokości.",
        to: "/jewelry/#ring-blank",
      },
    },
  },
  en: {
    tag: "Jewelry tools",
    h1: "Tools for Jewelers",
    pageDesc: "Free jewelry calculators. Calculate ring blank length, estimate custom jewelry — no registration required.",
    whyTitle: "Why do I share this knowledge?",
    whyText: "Jewelry craft should be accessible. Everyone who wants to make jewelry deserves honest information — without hidden calculations or premium pricing for 'trade secrets'. AEJaCA is a studio that believes knowledge opens more doors than it closes. These tools are free, ad-free, and require no sign-up.",
    jewelryCtaTitle: "Want to order jewelry?",
    jewelryCtaText: "Calculators are knowledge — fulfilling orders is our specialty.",
    jewelryCtaBtn: "AEJaCA Jewelry →",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Tools",
    free: "Free",
    open: "Open",
    tools: {
      jewelryCalc: {
        title: "Jewelry Calculator",
        desc: "Quick estimate for rings, bands, pendants. Pick a metal, stone, and profile — indicative price in seconds.",
        to: "/jewelry/#calculator",
      },
      ringBlank: {
        title: "Ring Blank Calculator",
        desc: "Calculate strip length and approximate weight for any metal, inner diameter, and band width.",
        to: "/jewelry/#ring-blank",
      },
    },
  },
  de: {
    tag: "Schmuck-Tools",
    h1: "Tools für Goldschmiede",
    pageDesc: "Kostenlose Schmuck-Kalkulatoren. Rohlinglänge berechnen, Schmuck nach Maß kalkulieren — ohne Registrierung.",
    whyTitle: "Warum teile ich dieses Wissen?",
    whyText: "Das Schmuckhandwerk sollte zugänglich sein. Jeder, der Schmuck herstellen möchte, verdient ehrliche Informationen — ohne versteckte Berechnungen oder Aufpreise für 'Branchengeheimnisse'. AEJaCA ist ein Atelier, das glaubt, dass Wissen mehr Türen öffnet als es schließt. Diese Tools sind kostenlos, werbefrei und erfordern keine Anmeldung.",
    jewelryCtaTitle: "Schmuck bestellen?",
    jewelryCtaText: "Kalkulatoren sind Wissen — Auftragsausführung ist unsere Spezialität.",
    jewelryCtaBtn: "AEJaCA Schmuck →",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Tools",
    free: "Kostenlos",
    open: "Öffnen",
    tools: {
      jewelryCalc: {
        title: "Schmuckkalkulator",
        desc: "Schnelle Schätzung für Ringe, Manschetten, Anhänger. Metall, Stein und Profil wählen — Richtpreis in Sekunden.",
        to: "/jewelry/#calculator",
      },
      ringBlank: {
        title: "Ring-Rohling-Rechner",
        desc: "Streifenlänge und Näherungsgewicht berechnen für beliebige Metalle, Innendurchmesser und Ringbreite.",
        to: "/jewelry/#ring-blank",
      },
    },
  },
};

const TOOL_ICONS = { jewelryCalc: Calculator, ringBlank: Gem };

function ToolCard({ tool, Icon, free, open }) {
  return (
    <Link to={tool.to} className="group flex flex-col gap-4 p-6 rounded-2xl glass hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <Icon className="w-8 h-8 shrink-0 text-amber-400 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">{free}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-lg font-semibold text-white leading-snug">{tool.title}</h3>
        <p className="text-neutral-400 text-sm leading-relaxed flex-1">{tool.desc}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 group-hover:text-amber-300 transition-colors">
        {open} <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

export default function ToolsJewelry() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = getSEO("toolsjewelry", lang);

  const heroRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const getCardRef = useStaggerReveal(100);

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
        <section className="py-20 px-4 bg-neutral-900/50">
          <div ref={heroRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">{L.tag}</div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white tracking-tight mb-5">{L.h1}</h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-xl mx-auto">{L.pageDesc}</p>
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

        <div className="gradient-divider" />

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

        {/* Tool cards */}
        <section className="py-16 px-4 bg-neutral-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-5">
              {Object.keys(L.tools).map((key, i) => (
                <div key={key} ref={getCardRef(i)} className="reveal-scale">
                  <ToolCard
                    tool={L.tools[key]}
                    Icon={TOOL_ICONS[key]}
                    free={L.free}
                    open={L.open}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Footer CTA */}
        <section className="py-12 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.jewelryCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.jewelryCtaText}</p>
            <Link
              to="/jewelry/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.jewelryCtaBtn}
            </Link>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
