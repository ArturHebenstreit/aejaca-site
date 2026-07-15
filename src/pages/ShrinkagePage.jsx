import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import ShrinkageCalc from "../components/calculators/ShrinkageCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia dla makerów",
    heroTitle: "Kalkulator Kompensacji Skurczu Odlewniczego",
    heroDesc: "Przelicz wymiar wzorca castable na wymiar po odlewie dla Au 585, Ag 925, Au 9K i Au 18K, bezpłatnie, bez rejestracji.",
    introTitle: "Dlaczego wzorzec musi być większy?",
    introText: "Każdy stop metalu kurczy się podczas krzepnięcia w formie. Wzorzec wydrukowany lub wymodelowany w CAD musi być więc powiększony o odpowiedni współczynnik, inaczej gotowy odlew wyjdzie zauważalnie mniejszy niż zaplanowano. Poniższy kalkulator liczy to za Ciebie w obie strony.",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
    breadThis: "Kompensacja skurczu odlewniczego",
    footerCtaTitle: "Potrzebujesz wzorca castable lub odlewu?",
    footerCtaText: "Zamodelujemy w CAD, przeskalujemy o współczynnik skurczu i wykonamy odlew lost-resin, od projektu po gotowy wyrób.",
    footerCtaBtn: "Napisz do nas",
    seoTitle: "Skurcz odlewniczy w praktyce",
    seoP1: "Skurcz odlewniczy to zmniejszenie objętości metalu, gdy przechodzi on ze stanu ciekłego w stały. W jubilerstwie ma to bezpośrednie znaczenie przy odlewaniu metodą traconego wosku lub żywicy (lost-resin): wzorzec 3D wydrukowany w skali 1:1 po odlaniu da wyrób mniejszy o kilka dziesiątych milimetra, co przy pierścionkach oznacza realnie inny rozmiar.",
    seoP2: "Współczynnik skurczu zależy od stopu. Srebro 925 kurczy się mniej (x1,016) niż złoto próby 585/14K (x1,0196), a złoto 9K i 18K mają swoje własne wartości pośrednie, wynikające z odmiennego udziału metali dodatkowych w stopie. Dlatego uniwersalny mnożnik nie istnieje, każdy stop trzeba przeliczać osobno.",
    seoP3: "W AEJaCA stosujemy te dokładne współczynniki przy każdym projekcie odlewanym metodą lost-resin, od pierścionków po elementy scenografii jubilerskiej. Model CAD lub druk 16K trafia do nas w wymiarze docelowym, a wzorzec castable skalujemy automatycznie o właściwy procent, zanim trafi do formy.",
    faqHeading: "Najczęstsze pytania",
    faqQ1: "Czym jest skurcz odlewniczy?",
    faqA1: "To zmniejszenie wymiarów metalu podczas krzepnięcia w formie odlewniczej, po stopieniu i wypełnieniu wnęki po spalonym lub wytopionym wzorcu. Efekt widoczny jest zwłaszcza przy precyzyjnych elementach, jak obrączki czy oprawy kamieni.",
    faqQ2: "Dlaczego współczynnik skurczu jest różny dla każdego stopu?",
    faqA2: "Każdy stop ma inny skład metali (Au, Ag, Cu, Zn i inne dodatki), a co za tym idzie inną temperaturę krzepnięcia i inną gęstość w stanie stałym względem ciekłego. Dlatego Ag 925, Au 9K, Au 14K (585) i Au 18K kurczą się w innym stopniu.",
    faqQ3: "Jak zastosować kompensację skurczu w CAD lub slicerze?",
    faqA3: "Zamodeluj lub zaimportuj wzorzec w wymiarze docelowym, a następnie przeskaluj go jednorodnie (Scale/Skaluj, nie osobno w osiach) o wartość współczynnika dla wybranego stopu, np. x1,016 dla Ag 925. Wynik wydrukuj jako wzorzec castable i przekaż do odlewu.",
  },
  en: {
    heroTag: "Tools for Makers",
    heroTitle: "Casting Shrinkage Compensation Calculator",
    heroDesc: "Convert a castable pattern dimension to the dimension after casting for Au 585, Ag 925, Au 9K and Au 18K, free, no registration.",
    introTitle: "Why does the pattern need to be bigger?",
    introText: "Every metal alloy shrinks as it solidifies in the mould. A pattern printed or modeled in CAD has to be scaled up by the right factor first, otherwise the finished cast piece comes out noticeably smaller than planned. This calculator does the math both ways.",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO Tools",
    breadThis: "Casting Shrinkage Compensation",
    footerCtaTitle: "Need a castable pattern or a cast piece?",
    footerCtaText: "We model in CAD, scale by the shrinkage factor, and cast in lost-resin, from design to finished piece.",
    footerCtaBtn: "Contact us",
    seoTitle: "Casting shrinkage in practice",
    seoP1: "Casting shrinkage is the reduction in metal volume as it moves from a liquid to a solid state. In jewelry, it matters directly with lost-wax or lost-resin casting: a 3D-printed pattern at 1:1 scale casts into a piece a few tenths of a millimeter smaller, which on a ring can mean a genuinely different size.",
    seoP2: "The shrinkage factor depends on the alloy. Sterling silver (925) shrinks less (x1.016) than 14K gold (585, x1.0196), while 9K and 18K gold sit at their own intermediate values based on how much base metal is alloyed in. There is no universal multiplier, each alloy has to be calculated separately.",
    seoP3: "At AEJaCA we apply these exact factors on every lost-resin cast project, from rings to display pieces. A CAD model or 16K-resolution print arrives sized to the final dimension, and we automatically scale the castable pattern by the correct percentage before it goes into the mould.",
    faqHeading: "Frequently asked questions",
    faqQ1: "What is casting shrinkage?",
    faqA1: "It is the reduction in metal dimensions as it solidifies inside the casting mould, after melting and filling the cavity left by the burned-out or dissolved pattern. The effect is most visible on precise elements like bands or stone settings.",
    faqQ2: "Why is the shrinkage factor different for each alloy?",
    faqA2: "Every alloy has a different metal composition (Au, Ag, Cu, Zn and other additions), which changes its solidification temperature and the density difference between liquid and solid states. That is why Ag 925, Au 9K, Au 14K (585) and Au 18K each shrink by a different amount.",
    faqQ3: "How do I apply shrinkage compensation in CAD or a slicer?",
    faqA3: "Model or import the pattern at the final target dimension, then scale it uniformly (Scale, not per-axis) by the factor for the chosen alloy, e.g. x1.016 for Ag 925. Print the result as a castable pattern and send it for casting.",
  },
  de: {
    heroTag: "Tools für Maker",
    heroTitle: "Guss-Schwindungskompensations-Rechner",
    heroDesc: "Modellmaß in das Maß nach dem Guss umrechnen, für Au 585, Ag 925, Au 9K und Au 18K, kostenlos, ohne Registrierung.",
    introTitle: "Warum muss das Modell größer sein?",
    introText: "Jede Metalllegierung schwindet beim Erstarren in der Gussform. Ein gedrucktes oder in CAD modelliertes Modell muss deshalb zuerst um den passenden Faktor vergrößert werden, sonst fällt das fertige Gussstück spürbar kleiner aus als geplant. Dieser Rechner übernimmt die Umrechnung in beide Richtungen.",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
    breadThis: "Guss-Schwindungskompensation",
    footerCtaTitle: "Castable Modell oder Gussstück benötigt?",
    footerCtaText: "Wir modellieren in CAD, skalieren um den Schwindungsfaktor und gießen im Lost-Resin-Verfahren, vom Entwurf bis zum fertigen Stück.",
    footerCtaBtn: "Kontakt",
    seoTitle: "Gussschwindung in der Praxis",
    seoP1: "Gussschwindung ist die Volumenverringerung von Metall beim Übergang vom flüssigen in den festen Zustand. Im Schmuckbereich betrifft das direkt den Wachsausschmelz- oder Harzausschmelzguss (Lost-Resin): Ein 3D-gedrucktes Modell im Maßstab 1:1 wird nach dem Guss um einige Zehntelmillimeter kleiner, was bei einem Ring eine tatsächlich andere Größe bedeuten kann.",
    seoP2: "Der Schwindungsfaktor hängt von der Legierung ab. Sterlingsilber (925) schwindet weniger (x1,016) als 14-Karat-Gold (585, x1,0196), während 9- und 18-Karat-Gold ihre eigenen Zwischenwerte haben, abhängig vom Anteil der Zusatzmetalle in der Legierung. Es gibt keinen universellen Multiplikator, jede Legierung muss einzeln berechnet werden.",
    seoP3: "Bei AEJaCA wenden wir diese exakten Faktoren bei jedem Lost-Resin-Gussprojekt an, vom Ring bis zum Ausstellungsstück. Ein CAD-Modell oder ein 16K-Druck wird uns im Zielmaß übergeben, und wir skalieren das Castable-Modell automatisch um den korrekten Prozentsatz, bevor es in die Form geht.",
    faqHeading: "Häufig gestellte Fragen",
    faqQ1: "Was ist Gussschwindung?",
    faqA1: "Das ist die Verringerung der Metallabmessungen beim Erstarren in der Gussform, nach dem Schmelzen und Füllen des Hohlraums, der vom ausgebrannten oder aufgelösten Modell zurückbleibt. Der Effekt ist besonders bei präzisen Elementen wie Ringschienen oder Fassungen sichtbar.",
    faqQ2: "Warum ist der Schwindungsfaktor bei jeder Legierung anders?",
    faqA2: "Jede Legierung hat eine andere Metallzusammensetzung (Au, Ag, Cu, Zn und weitere Zusätze), was die Erstarrungstemperatur und den Dichteunterschied zwischen flüssigem und festem Zustand verändert. Deshalb schwinden Ag 925, Au 9K, Au 14K (585) und Au 18K jeweils unterschiedlich stark.",
    faqQ3: "Wie wende ich die Schwindungskompensation in CAD oder einem Slicer an?",
    faqA3: "Modellieren oder importieren Sie das Modell im Zielmaß und skalieren Sie es dann einheitlich (Skalieren, nicht pro Achse) um den Faktor der gewählten Legierung, z. B. x1,016 für Ag 925. Drucken Sie das Ergebnis als Castable-Modell und geben Sie es zum Guss.",
  },
};

const SEO_META = {
  pl: {
    title: "Kalkulator kompensacji skurczu odlewniczego | AEJaCA sTuDiO",
    description: "Przelicz wymiar wzorca castable na wymiar po odlewie dla Au 585, Ag 925, Au 9K, Au 18K. Darmowy kalkulator z tabelą rozmiarów pierścionków EU.",
  },
  en: {
    title: "Casting Shrinkage Compensation Calculator | AEJaCA sTuDiO",
    description: "Convert a castable pattern size to the after-cast size for Au 585, Ag 925, Au 9K, Au 18K. Free tool with an EU ring size lookup table.",
  },
  de: {
    title: "Guss-Schwindungskompensations-Rechner | AEJaCA sTuDiO",
    description: "Modellmaß in das Maß nach dem Guss umrechnen, für Au 585, Ag 925, Au 9K, Au 18K. Kostenloses Tool mit EU-Ringgrößentabelle.",
  },
};

export default function ShrinkagePage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;

  const introRef = useScrollReveal();
  const calcRef = useScrollReveal();
  const seoRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const faqItems = [
    { q: L.faqQ1, a: L.faqA1 },
    { q: L.faqQ2, a: L.faqA2 },
    { q: L.faqQ3, a: L.faqA3 },
  ];

  const schemas = [
    buildWebPageSchema({
      title: seo.title,
      description: seo.description,
      url: `${SITE.url}/toolstudio/shrinkage/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
      { name: L.breadThis, url: `${SITE.url}/toolstudio/shrinkage/` },
    ]),
    buildFAQSchema(faqItems),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolstudio"
        path="/toolstudio/shrinkage"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[340px]">
          <img
            src="/hero-toolstudio.webp"
            alt="Kalkulator kompensacji skurczu odlewniczego, AEJaCA sTuDiO"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center flex flex-col items-center">
            <div className="text-blue-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{L.heroTag}</div>
            <h1 className="font-sans text-4xl sm:text-5xl md:text-[54px] font-semibold text-white mb-5 leading-[1.05] tracking-tight drop-shadow-2xl">{L.heroTitle}</h1>
            <p className="text-neutral-200 text-base max-w-xl leading-relaxed">{L.heroDesc}</p>
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
        <section className="py-6 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-blue-400/5 border border-blue-400/15">
              <h2 className="font-sans text-xl font-semibold text-blue-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcRef} className="reveal">
              <ShrinkageCalc lang={lang} />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* SEO text section */}
        <section className="py-10 px-4 bg-neutral-950">
          <div ref={seoRef} className="reveal max-w-3xl mx-auto">
            <h2 className="font-sans text-2xl font-semibold text-white mb-4">{L.seoTitle}</h2>
            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
              <p>{L.seoP1}</p>
              <p>{L.seoP2}</p>
              <p>{L.seoP3}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* FAQ */}
        <section className="py-10 px-4 bg-neutral-950">
          <div ref={faqRef} className="reveal max-w-3xl mx-auto">
            <h2 className="font-sans text-2xl font-semibold text-white text-center mb-8">{L.faqHeading}</h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <details key={i} className="group bg-neutral-900/50 border border-neutral-800 rounded-xl px-6 py-4 [&_summary]:cursor-pointer">
                  <summary className="flex items-center justify-between text-base font-medium text-neutral-100 list-none">
                    <span>{item.q}</span>
                    <span className="text-blue-400 ml-4 shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-neutral-400 text-sm leading-relaxed mt-3">{item.a}</p>
                </details>
              ))}
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
