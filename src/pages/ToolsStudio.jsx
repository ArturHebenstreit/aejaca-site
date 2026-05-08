import { Link } from "react-router-dom";
import { ArrowRight, Cpu } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import LaserMaterialMatrix from "../components/calculators/LaserMaterialMatrix.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

const LABELS = {
  pl: {
    heroTag: "Wiedza otwarta",
    heroTitle: "Narzędzia dla Makerów",
    heroDesc: "Interaktywna tabela parametrów laserowania i kalkulator sTuDiO. Bezpłatne, bez rejestracji.",
    whyTitle: "Dlaczego dzielę się wiedzą?",
    whyText: "Cyfrowa fabrykacja stała się dostępna — ale wiedza o parametrach wciąż bywa strzeżona. Udostępniam te narzędzia, bo uważam, że społeczność makerów rośnie, gdy wiedza jest otwarta. Wspólna wiedza to wspólny postęp. Korzystaj bez ograniczeń.",
    calcCTATitle: "Kalkulator wyceny sTuDiO",
    calcCTADesc: "Wycena laserowania CO₂ i fiber, druku 3D FDM/SLA oraz odlewów żywicznych — online, bez czekania.",
    calcCTABtn: "Przejdź do kalkulatora wyceny",
    laserMatrixTitle: "Interaktywna tabela parametrów laserowania",
    laserMatrixSubtitle: "Rzeczywiste parametry dla CO₂, Fiber, Dioda, UV i IR. Filtruj po akcji, typie lasera i mocy — tabela dostosowuje się automatycznie.",
    footerCtaTitle: "Masz projekt do realizacji?",
    footerCtaText: "Parametry to teoria — wykonanie to nasza specjalność.",
    footerCtaBtn: "AEJaCA sTuDiO",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
  },
  en: {
    heroTag: "Open knowledge",
    heroTitle: "Tools for Makers",
    heroDesc: "Interactive laser parameter table and sTuDiO calculator. Free, no registration required.",
    whyTitle: "Why do I share this knowledge?",
    whyText: "Digital fabrication has become accessible — but parameter knowledge is still often hoarded. I share these tools because I believe the maker community grows when knowledge is open. Shared knowledge means shared progress. Use them freely.",
    calcCTATitle: "sTuDiO Pricing Calculator",
    calcCTADesc: "Estimate CO₂ and fiber laser engraving, FDM/SLA 3D printing, and resin casting — online, no waiting.",
    calcCTABtn: "Go to pricing calculator",
    laserMatrixTitle: "Interactive Laser Parameter Table",
    laserMatrixSubtitle: "Real parameters for CO₂, Fiber, Diode, UV, and IR lasers. Filter by action, laser type, and power — table adapts automatically.",
    footerCtaTitle: "Have a project to execute?",
    footerCtaText: "Parameters are theory — execution is our specialty.",
    footerCtaBtn: "AEJaCA sTuDiO",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO Tools",
  },
  de: {
    heroTag: "Offenes Wissen",
    heroTitle: "Tools für Maker",
    heroDesc: "Interaktive Laserparameter-Tabelle und sTuDiO-Kalkulator. Kostenlos, keine Registrierung.",
    whyTitle: "Warum teile ich dieses Wissen?",
    whyText: "Digitale Fertigung ist zugänglich geworden — aber Parameterwissen wird oft noch gehütet. Ich teile diese Tools, weil ich glaube, dass die Maker-Community wächst, wenn Wissen offen ist. Geteiltes Wissen bedeutet gemeinsamen Fortschritt. Nutze sie frei.",
    calcCTATitle: "sTuDiO-Preiskalkulator",
    calcCTADesc: "Angebot für CO₂- und Faserlaser, FDM/SLA-3D-Druck und Harzverguss — online, ohne Wartezeit.",
    calcCTABtn: "Zum Preiskalkulator",
    laserMatrixTitle: "Interaktive Laserparameter-Tabelle",
    laserMatrixSubtitle: "Reale Parameter für CO₂, Fiber, Dioden-, UV- und IR-Laser. Nach Aktion, Lasertyp und Leistung filtern — Tabelle passt sich automatisch an.",
    footerCtaTitle: "Projekt zur Ausführung?",
    footerCtaText: "Parameter sind Theorie — Ausführung ist unsere Spezialität.",
    footerCtaBtn: "AEJaCA sTuDiO",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
  },
};

export default function ToolsStudio() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = getSEO("toolstudio", lang);

  const whyRef = useScrollReveal();
  const calcCTARef = useScrollReveal();
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
        <section className="bg-neutral-950 py-10 px-4">
          <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px] bg-gradient-to-br from-slate-800 via-blue-950 to-slate-950">
            <img
              src="/hero-toolstudio.webp"
              alt="Narzędzia dla makerów — AEJaCA sTuDiO"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1024"
              height="572"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
              <div className="text-blue-400 text-xs uppercase tracking-[0.25em] mb-3">{L.heroTag}</div>
              <h1 className="font-sans text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg tracking-tight">{L.heroTitle}</h1>
              <p className="text-neutral-300 text-base max-w-2xl">{L.heroDesc}</p>
            </div>
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

        {/* CTA tile → /studio/#calculator */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcCTARef} className="reveal">
              <Link
                to="/studio/#calculator"
                className="group flex items-center gap-5 p-5 rounded-2xl glass hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300"
              >
                <Cpu className="w-10 h-10 text-blue-400 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors">{L.calcCTATitle}</div>
                  <div className="text-neutral-400 text-sm mt-0.5">{L.calcCTADesc}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 group-hover:text-blue-300 shrink-0 transition-colors">
                  {L.calcCTABtn} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Laser Material Matrix */}
        <section id="laser-params" className="py-16 px-4 bg-neutral-950">
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
        <section className="py-12 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.footerCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.footerCtaText}</p>
            <Link
              to="/studio/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
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
