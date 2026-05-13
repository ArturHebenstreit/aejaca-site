import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import LaserParametersTool from "../components/calculators/LaserParametersTool.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia dla makerów",
    heroTitle: "Kreator parametrów laserowania",
    heroDesc: "Dobierz parametry dla 7 typów laserów i 88 materiałów — bezpłatnie, bez rejestracji.",
    introTitle: "Parametry jako punkt startowy",
    introText: "Dobierz parametry dla 7 typów laserów, 88 materiałów i ponad 1000 kombinacji. Wyniki są punktem startowym — zawsze wykonaj test przed produkcją.",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
    breadThis: "Kreator parametrów laserowania",
    footerCtaTitle: "Masz projekt do realizacji?",
    footerCtaText: "Parametry to teoria — wykonanie to nasza specjalność.",
    footerCtaBtn: "AEJaCA sTuDiO",
  },
  en: {
    heroTag: "Tools for Makers",
    heroTitle: "Laser Parameter Wizard",
    heroDesc: "Find parameters for 7 laser types and 88 materials — free, no registration required.",
    introTitle: "Parameters as a starting point",
    introText: "Find parameters for 7 laser types, 88 materials and over 1000 combinations. Results are a starting point — always run a test before production.",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO Tools",
    breadThis: "Laser Parameter Wizard",
    footerCtaTitle: "Have a project to execute?",
    footerCtaText: "Parameters are theory — execution is our specialty.",
    footerCtaBtn: "AEJaCA sTuDiO",
  },
  de: {
    heroTag: "Tools für Maker",
    heroTitle: "Laserparameter-Assistent",
    heroDesc: "Parameter für 7 Lasertypen und 88 Materialien finden — kostenlos, ohne Registrierung.",
    introTitle: "Parameter als Ausgangspunkt",
    introText: "Parameter für 7 Lasertypen, 88 Materialien und über 1000 Kombinationen finden. Ergebnisse sind Ausgangspunkte — führen Sie immer einen Test vor der Produktion durch.",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
    breadThis: "Laserparameter-Assistent",
    footerCtaTitle: "Projekt zur Ausführung?",
    footerCtaText: "Parameter sind Theorie — Ausführung ist unsere Spezialität.",
    footerCtaBtn: "AEJaCA sTuDiO",
  },
};

const SEO_META = {
  pl: {
    title: "Kreator parametrów laserowania — 88 materiałów, 7 laserów | AEJaCA",
    description: "Dobierz parametry laserowania dla CO₂, fiber, diodowych i innych. Ponad 1000 kombinacji materiał–laser. Darmowy kreator bez rejestracji.",
  },
  en: {
    title: "Laser Parameter Wizard — 88 Materials, 7 Laser Types | AEJaCA",
    description: "Find laser parameters for CO₂, fiber, diode and more. Over 1000 material–laser combinations. Free tool, no sign-up.",
  },
  de: {
    title: "Laserparameter-Assistent — 88 Materialien, 7 Lasertypen | AEJaCA",
    description: "Laserparameter für CO₂, Faser, Diode und mehr finden. Über 1000 Material-Laser-Kombinationen. Kostenloses Tool ohne Anmeldung.",
  },
};

export default function LaserParametersPage() {
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
      url: `${SITE.url}/toolstudio/laser-parameters/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
      { name: L.breadThis, url: `${SITE.url}/toolstudio/laser-parameters/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolstudio"
        path="/toolstudio/laser-parameters"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="pt-16 bg-neutral-950">

        {/* Hero */}
        <section className="bg-neutral-950 py-10 px-4">
          <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px] bg-gradient-to-br from-slate-800 via-blue-950 to-slate-950">
            <img
              src="/hero-toolstudio.webp"
              alt="Kreator parametrów laserowania — AEJaCA sTuDiO"
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
              { label: L.breadTools, href: "/toolstudio/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        {/* Intro */}
        <section className="py-10 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-blue-400/5 border border-blue-400/15">
              <h2 className="font-sans text-xl font-semibold text-blue-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-12 px-4 bg-neutral-950">
          <div className="max-w-5xl mx-auto">
            <div ref={calcRef} className="reveal">
              <LaserParametersTool lang={lang} />
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
              href="/studio/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
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
