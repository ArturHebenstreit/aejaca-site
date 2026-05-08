import { Link } from "react-router-dom";
import { ArrowRight, Gem, Cpu, Calculator, Table } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const LABELS = {
  pl: {
    tag: "Narzędzia online",
    pageTitle: "Narzędzia i Kalkulatory",
    pageDesc: "Darmowe kalkulatory i tabele referencyjne dla jubilerów i twórców. Oblicz długość blanku, wycen projekt, sprawdź parametry laserowania.",
    jewelryTitle: "Biżuteria",
    studioTitle: "sTuDiO",
    tools: {
      jewelryCalc: {
        title: "Kalkulator biżuterii",
        desc: "Szybka wycena pierścionków, obrączek, wisiorków. Wybierz metal, kamień i profil — otrzymasz orientacyjną cenę w kilka sekund.",
        to: "/jewelry/#calculator",
      },
      ringBlank: {
        title: "Kalkulator blanku obrączki",
        desc: "Oblicz długość pręta i przybliżoną masę blanku dla dowolnego metalu, średnicy i szerokości.",
        to: "/jewelry/#ring-blank",
      },
      studioCalc: {
        title: "Kalkulator sTuDiO",
        desc: "Wycena laserowania CO₂ i fiber, druku 3D FDM/SLA oraz odlewów żywicznych — online, bez czekania.",
        to: "/studio/#calculator",
      },
      laserParams: {
        title: "Tabela parametrów laserowania",
        desc: "Orientacyjne ustawienia mocy, prędkości i liczby przejść dla CO₂ i lasera fiber na 6+ materiałach.",
        to: "/studio/#laser-params",
      },
    },
    breadcrumbHome: "Strona główna",
    free: "Bezpłatne",
    goTo: "Przejdź",
  },
  en: {
    tag: "Online tools",
    pageTitle: "Tools & Calculators",
    pageDesc: "Free calculators and reference tables for jewelers and makers. Calculate ring blank length, estimate projects, check laser parameters.",
    jewelryTitle: "Jewelry",
    studioTitle: "sTuDiO",
    tools: {
      jewelryCalc: {
        title: "Jewelry Calculator",
        desc: "Quick estimate for rings, bands, pendants. Pick a metal, stone, and profile — get an indicative price in seconds.",
        to: "/jewelry/#calculator",
      },
      ringBlank: {
        title: "Ring Blank Calculator",
        desc: "Calculate the strip length and approximate weight for any metal, inner diameter, and band width.",
        to: "/jewelry/#ring-blank",
      },
      studioCalc: {
        title: "sTuDiO Calculator",
        desc: "Estimate CO₂ and fiber laser engraving, FDM/SLA 3D printing, and resin casting — online, no waiting.",
        to: "/studio/#calculator",
      },
      laserParams: {
        title: "Laser Parameters Table",
        desc: "Indicative power, speed, and pass settings for CO₂ and fiber laser on 6+ materials.",
        to: "/studio/#laser-params",
      },
    },
    breadcrumbHome: "Home",
    free: "Free",
    goTo: "Open",
  },
  de: {
    tag: "Online-Tools",
    pageTitle: "Tools & Kalkulatoren",
    pageDesc: "Kostenlose Kalkulatoren und Referenztabellen für Goldschmiede und Maker. Rohlinglänge berechnen, Projekte kalkulieren, Laserparameter prüfen.",
    jewelryTitle: "Schmuck",
    studioTitle: "sTuDiO",
    tools: {
      jewelryCalc: {
        title: "Schmuckkalkulator",
        desc: "Schnelle Schätzung für Ringe, Manschetten, Anhänger. Metall, Stein und Profil wählen — in Sekunden zum Richtpreis.",
        to: "/jewelry/#calculator",
      },
      ringBlank: {
        title: "Ring-Rohling-Rechner",
        desc: "Berechnen Sie Streifenlänge und Näherungsgewicht für beliebige Metalle, Innendurchmesser und Ringbreite.",
        to: "/jewelry/#ring-blank",
      },
      studioCalc: {
        title: "sTuDiO-Kalkulator",
        desc: "Angebot für CO₂- und Faserlaser, FDM/SLA-3D-Druck und Harzverguss — online, ohne Wartezeit.",
        to: "/studio/#calculator",
      },
      laserParams: {
        title: "Laserparameter-Tabelle",
        desc: "Richtwerte für Leistung, Geschwindigkeit und Durchgänge für CO₂ und Faserlaser auf 6+ Materialien.",
        to: "/studio/#laser-params",
      },
    },
    breadcrumbHome: "Startseite",
    free: "Kostenlos",
    goTo: "Öffnen",
  },
};

const JEWELRY_TOOLS = [
  { key: "jewelryCalc", Icon: Calculator },
  { key: "ringBlank", Icon: Gem },
];

const STUDIO_TOOLS = [
  { key: "studioCalc", Icon: Cpu },
  { key: "laserParams", Icon: Table },
];

function ToolCard({ tool, Icon, accent, free, goTo }) {
  const isAmber = accent === "amber";
  return (
    <Link
      to={tool.to}
      className={`group flex flex-col gap-4 p-6 rounded-2xl glass hover:shadow-lg transition-all duration-300 ${
        isAmber
          ? "hover:border-amber-500/30 hover:shadow-amber-900/20"
          : "hover:border-blue-500/30 hover:shadow-blue-900/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon
          className={`w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
            isAmber ? "text-amber-400" : "text-blue-400"
          }`}
        />
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isAmber
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
              : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
          }`}
        >
          {free}
        </span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="font-sans text-lg font-semibold text-white leading-snug">
          {tool.title}
        </h3>
        <p className="text-neutral-400 text-sm leading-relaxed flex-1">
          {tool.desc}
        </p>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
          isAmber
            ? "text-amber-400 group-hover:text-amber-300"
            : "text-blue-400 group-hover:text-blue-300"
        }`}
      >
        {goTo} <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

export default function Tools() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = getSEO("tools", lang);

  const heroRef = useScrollReveal();
  const jewelryRef = useScrollReveal();
  const studioRef = useScrollReveal();
  const getJewelryCardRef = useStaggerReveal(100);
  const getStudioCardRef = useStaggerReveal(100);

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: `${SITE.url}/tools/` }),
    buildBreadcrumbSchema([
      { name: L.breadcrumbHome, url: SITE.url },
      { name: L.pageTitle, url: `${SITE.url}/tools/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="tools"
        path="/tools"
        schemas={schemas}
      />
      <div className="pt-16 bg-neutral-950">

        {/* ── Hero ── */}
        <section className="py-20 px-4 bg-neutral-900/50">
          <div ref={heroRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">
              {L.tag}
            </div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white tracking-tight mb-5">
              {L.pageTitle}
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-xl mx-auto">
              {L.pageDesc}
            </p>
          </div>
        </section>

        {/* ── Breadcrumb ── */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadcrumbHome, href: "/" },
              { label: L.pageTitle },
            ]}
          />
        </div>

        <div className="gradient-divider" />

        {/* ── Jewelry section ── */}
        <section id="jewelry" className="py-16 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <div ref={jewelryRef} className="reveal flex items-center gap-3 mb-8">
              <Gem className="w-6 h-6 text-amber-400 shrink-0" />
              <h2 className="font-sans text-2xl md:text-3xl font-bold text-white tracking-tight">
                {L.jewelryTitle}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {JEWELRY_TOOLS.map(({ key, Icon }, i) => (
                <div key={key} ref={getJewelryCardRef(i)} className="reveal-scale">
                  <ToolCard
                    tool={L.tools[key]}
                    Icon={Icon}
                    accent="amber"
                    free={L.free}
                    goTo={L.goTo}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* ── Studio section ── */}
        <section id="studio" className="py-16 px-4 bg-neutral-900/50">
          <div className="max-w-4xl mx-auto">
            <div ref={studioRef} className="reveal flex items-center gap-3 mb-8">
              <Cpu className="w-6 h-6 text-blue-400 shrink-0" />
              <h2 className="font-sans text-2xl md:text-3xl font-bold text-white tracking-tight">
                {L.studioTitle}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {STUDIO_TOOLS.map(({ key, Icon }, i) => (
                <div key={key} ref={getStudioCardRef(i)} className="reveal-scale">
                  <ToolCard
                    tool={L.tools[key]}
                    Icon={Icon}
                    accent="blue"
                    free={L.free}
                    goTo={L.goTo}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
