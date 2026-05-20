import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import PrintSettings3DCalc from "../components/calculators/PrintSettings3DCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia dla drukarzy 3D",
    heroTitle: "Parametry druku 3D i dobór materiału",
    heroDesc: "Dobierz filament, sprawdź parametry i oblicz zużycie materiału — bezpłatnie, bez rejestracji.",
    introTitle: "Parametry jako punkt wyjścia",
    introText: "Podane zakresy to sprawdzone wartości startowe dla typowych drukarek FDM. Rzeczywiste parametry mogą się różnić w zależności od drukarki, slicera, jakości filamentu i geometrii modelu. Zawsze wykonaj test kalibracyjny przed drukiem produkcyjnym.",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
    breadThis: "Parametry druku 3D",
    footerCtaTitle: "Potrzebujesz wydruku 3D?",
    footerCtaText: "Drukujemy w PLA, PETG, TPU, PA-CF i wielu innych materiałach. Wyceń zlecenie online.",
    footerCtaBtn: "Kalkulator wyceny sTuDiO",
  },
  en: {
    heroTag: "Tools for 3D Printing",
    heroTitle: "3D Print Settings & Material Advisor",
    heroDesc: "Find the right filament, check print parameters and calculate material usage — free, no sign-up.",
    introTitle: "Parameters as a starting point",
    introText: "The listed ranges are tested starting values for typical FDM printers. Actual parameters may vary depending on printer, slicer, filament quality and model geometry. Always run a calibration print before production.",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO Tools",
    breadThis: "3D Print Settings",
    footerCtaTitle: "Need a 3D print?",
    footerCtaText: "We print in PLA, PETG, TPU, PA-CF and many more. Get an online quote.",
    footerCtaBtn: "sTuDiO Pricing Calculator",
  },
  de: {
    heroTag: "Tools für 3D-Druck",
    heroTitle: "3D-Druckparameter & Materialberater",
    heroDesc: "Richtiges Filament finden, Druckparameter prüfen und Materialverbrauch berechnen — kostenlos, ohne Anmeldung.",
    introTitle: "Parameter als Ausgangspunkt",
    introText: "Die aufgeführten Bereiche sind getestete Startwerte für typische FDM-Drucker. Tatsächliche Parameter können je nach Drucker, Slicer, Filamentqualität und Modellgeometrie abweichen. Führen Sie immer einen Kalibrierungsdruck durch.",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
    breadThis: "3D-Druckparameter",
    footerCtaTitle: "3D-Druck benötigt?",
    footerCtaText: "Wir drucken in PLA, PETG, TPU, PA-CF und vielen weiteren Materialien. Online-Angebot einholen.",
    footerCtaBtn: "sTuDiO-Preiskalkulator",
  },
};

const SEO_META = {
  pl: {
    title: "Parametry druku 3D — PLA, PETG, ABS, PA-CF | AEJaCA",
    description: "Dobierz materiał, sprawdź parametry druku i oblicz zużycie filamentu. Darmowy kalkulator dla 16 filamentów: PLA, PETG, TPU, PA-CF, PC i więcej.",
  },
  en: {
    title: "3D Print Settings Calculator — PLA, PETG, ABS, PA-CF | AEJaCA",
    description: "Find the right material, check print parameters and calculate filament usage. Free tool for 16 filaments.",
  },
  de: {
    title: "3D-Druckparameter-Rechner — PLA, PETG, ABS, PA-CF | AEJaCA",
    description: "Material auswählen, Druckparameter prüfen und Filamentverbrauch berechnen. Kostenloses Tool für 16 Filamente.",
  },
};

export default function PrintSettingsPage() {
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
      url: `${SITE.url}/toolstudio/print-settings/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
      { name: L.breadThis, url: `${SITE.url}/toolstudio/print-settings/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolstudio"
        path="/toolstudio/print-settings"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="pt-16 bg-neutral-950">

        {/* Hero */}
        <section className="bg-neutral-950 py-10 px-4">
          <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px] bg-gradient-to-br from-slate-800 via-blue-950 to-slate-950">
            <img
              src="/hero-print-settings.webp"
              alt="Druk 3D FDM — parametry filamentów, AEJaCA sTuDiO"
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
          <div className="max-w-4xl mx-auto">
            <div ref={calcRef} className="reveal">
              <PrintSettings3DCalc />
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
              href="/studio/#calculator"
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
