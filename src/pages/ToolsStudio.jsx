import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Table } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import LaserMaterialMatrix from "../components/calculators/LaserMaterialMatrix.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const LABELS = {
  pl: {
    tag: "Narzędzia sTuDiO",
    h1: "Narzędzia dla Makerów",
    pageDesc: "Darmowe narzędzia dla twórców cyfrowych. Parametry laserowania CO₂ i Fiber, wycena druku 3D i odlewów — bez rejestracji.",
    whyTitle: "Dlaczego dzielę się wiedzą?",
    whyText: "Cyfrowa fabrykacja stała się dostępna — ale wiedza o parametrach wciąż bywa strzeżona. Udostępniam te narzędzia, bo uważam, że społeczność makerów rośnie, gdy wiedza jest otwarta. Wspólna wiedza to wspólny postęp. Korzystaj bez ograniczeń.",
    studioCtaTitle: "Masz projekt do realizacji?",
    studioCtaText: "Tabele parametrów to teoria — wykonanie to nasza specjalność.",
    studioCtaBtn: "sTuDiO AEJaCA →",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia",
    free: "Bezpłatne",
    open: "Otwórz",
    calcTitle: "Kalkulator sTuDiO",
    calcDesc: "Wycena laserowania CO₂ i fiber, druku 3D FDM/SLA oraz odlewów żywicznych — online, bez czekania.",
    laserMatrixTitle: "Tabela parametrów laserowania",
    laserMatrixSubtitle: "Interaktywna baza parametrów dla laserów CO₂, Fiber, Dioda, UV i IR. Wybierz akcję, typ lasera i system prowadzenia.",
  },
  en: {
    tag: "sTuDiO Tools",
    h1: "Tools for Makers",
    pageDesc: "Free tools for digital makers. CO₂ and Fiber laser parameters, 3D print and resin casting estimates — no registration.",
    whyTitle: "Why do I share this knowledge?",
    whyText: "Digital fabrication has become accessible — but parameter knowledge is still often hoarded. I share these tools because I believe the maker community grows when knowledge is open. Shared knowledge means shared progress. Use them freely.",
    studioCtaTitle: "Have a project to execute?",
    studioCtaText: "Parameter tables are theory — execution is our specialty.",
    studioCtaBtn: "AEJaCA sTuDiO →",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "Tools",
    free: "Free",
    open: "Open",
    calcTitle: "sTuDiO Calculator",
    calcDesc: "Estimate CO₂ and fiber laser engraving, FDM/SLA 3D printing, and resin casting — online, no waiting.",
    laserMatrixTitle: "Laser Parameter Table",
    laserMatrixSubtitle: "Interactive parameter database for CO₂, Fiber, Diode, UV, and IR lasers. Choose action, laser type, and delivery system.",
  },
  de: {
    tag: "sTuDiO-Tools",
    h1: "Tools für Maker",
    pageDesc: "Kostenlose Tools für digitale Maker. CO₂- und Fiber-Laserparameter, 3D-Druck und Harzguss-Schätzungen — ohne Registrierung.",
    whyTitle: "Warum teile ich dieses Wissen?",
    whyText: "Digitale Fertigung ist zugänglich geworden — aber Parameterwissen wird oft noch gehütet. Ich teile diese Tools, weil ich glaube, dass die Maker-Community wächst, wenn Wissen offen ist. Geteiltes Wissen bedeutet gemeinsamen Fortschritt. Nutze sie frei.",
    studioCtaTitle: "Projekt zur Ausführung?",
    studioCtaText: "Parametertabellen sind Theorie — Ausführung ist unsere Spezialität.",
    studioCtaBtn: "AEJaCA sTuDiO →",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "Tools",
    free: "Kostenlos",
    open: "Öffnen",
    calcTitle: "sTuDiO-Kalkulator",
    calcDesc: "Angebot für CO₂- und Faserlaser, FDM/SLA-3D-Druck und Harzverguss — online, ohne Wartezeit.",
    laserMatrixTitle: "Laserparameter-Tabelle",
    laserMatrixSubtitle: "Interaktive Parameterdatenbank für CO₂-, Fiber-, Dioden-, UV- und IR-Laser. Aktion, Lasertyp und Zuführsystem wählen.",
  },
};

function ToolCard({ title, desc, to, Icon, free, open }) {
  return (
    <Link to={to} className="group flex flex-col gap-4 p-6 rounded-2xl glass hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <Icon className="w-8 h-8 shrink-0 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20">{free}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="font-sans text-lg font-semibold text-white leading-snug">{title}</h3>
        <p className="text-neutral-400 text-sm leading-relaxed flex-1">{desc}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
        {open} <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

export default function ToolsStudio() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = getSEO("toolstudio", lang);

  const heroRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const cardRef = useStaggerReveal(100);
  const matrixRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: `${SITE.url}/toolstudio/` }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
    ]),
  ];

  return (
    <>
      <SEOHead pageKey="toolstudio" path="/toolstudio" schemas={schemas} />
      <div className="pt-16 bg-neutral-950">

        {/* Hero */}
        <section className="py-20 px-4 bg-neutral-900/50">
          <div ref={heroRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="text-blue-400 text-xs uppercase tracking-[0.25em] mb-3">{L.tag}</div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white tracking-tight mb-5">{L.h1}</h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-xl mx-auto">{L.pageDesc}</p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadStudio, href: "/studio/" },
              { label: L.breadTools },
            ]}
          />
        </div>

        <div className="gradient-divider" />

        {/* Why I share this knowledge */}
        <section className="py-12 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={whyRef} className="reveal p-6 rounded-2xl bg-blue-400/5 border border-blue-400/15">
              <h2 className="font-sans text-xl font-semibold text-blue-300 mb-3">{L.whyTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.whyText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Studio Calculator tile */}
        <section className="py-16 px-4 bg-neutral-900/50">
          <div className="max-w-sm mx-auto">
            <div ref={cardRef(0)} className="reveal-scale">
              <ToolCard
                title={L.calcTitle}
                desc={L.calcDesc}
                to="/studio/#calculator"
                Icon={Cpu}
                free={L.free}
                open={L.open}
              />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Laser Material Matrix */}
        <section className="py-16 px-4 bg-neutral-950">
          <div className="max-w-5xl mx-auto">
            <div ref={matrixRef} className="reveal mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{L.laserMatrixTitle}</h2>
              <p className="text-neutral-400">{L.laserMatrixSubtitle}</p>
            </div>
            <LaserMaterialMatrix lang={lang} />
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Footer CTA */}
        <section className="py-12 px-4 bg-neutral-900/50 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.studioCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.studioCtaText}</p>
            <Link
              to="/studio/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
            >
              {L.studioCtaBtn}
            </Link>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
