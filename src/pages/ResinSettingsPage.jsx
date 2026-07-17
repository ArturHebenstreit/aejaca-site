import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import ResinSettingsCalc from "../components/calculators/ResinSettingsCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia sTuDiO",
    heroTitle: "Parametry druku 3D MSLA: żywice i dobór materiału",
    heroDesc: "Dobierz żywicę do druku żywicznego, sprawdź parametry warstwy, mycia i utwardzania, bezpłatnie, bez rejestracji.",
    introTitle: "Czym jest MSLA i po co 16K",
    introText: "MSLA (Masked Stereolithography) utwardza żywicę światłem UV wyświetlanym przez maskowany ekran LCD, warstwa po warstwie. Nasza drukarka Elegoo Saturn 4 Ultra ma rozdzielczość 16K i wielkość piksela ok. 14 mikrometrów, dzięki czemu odwzorowuje mikrodetal niedostępny dla druku FDM, ażurowe wzory, gwintowanie, mikrograwer czy wzorce jubilerskie do odlewu. Poniżej dobierzesz żywicę do swojego projektu i sprawdzisz jej parametry.",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
    breadThis: "Parametry druku 3D MSLA",
    faqHeading: "Najczęstsze pytania",
    faqQ1: "Czym różni się żywica standard od ABS-like?",
    faqA1: "Żywica standard jest twarda, ale krucha, sprawdza się w modelach i figurkach wizualnych, gdzie liczy się detal, a nie odporność na uderzenia. ABS-like ma podobną udarność do plastiku ABS i nie pęka przy zginaniu czy zatrzaskach, dlatego wybiera się ją do obudów i części mechanicznych, które muszą znieść realne obciążenia.",
    faqQ2: "Czy żywica water-washable jest gorsza od tej myjącej się w IPA?",
    faqA2: "Nie, jest tylko innym kompromisem. Woda zastępuje alkohol izopropylowy w myciu, co jest wygodniejsze i tańsze w domu, ale wydruk bywa nieco mniej odporny na wilgoć niż wydruk z żywicy myjącej się w IPA, dlatego do elementów wystawionych na wilgoć lepiej wybrać wersję IPA.",
    faqQ3: "Co to jest żywica castable i po co kosztuje aż 1399 zł/kg?",
    faqA3: "Żywica castable (np. BlueCast X-One) wypala się bez popiołu podczas odlewu metodą lost-resin, więc wzorzec znika bez śladu i nie zanieczyszcza formy. Wysoka cena wynika z precyzyjnej formuły chemicznej wymaganej do czystego spalania, to żywica dla jubilerów odlewających sygnety i bryłowe elementy, nie do druku codziennego.",
    faqQ4: "Jaka żywica sprawdzi się do figurek i miniatur?",
    faqA4: "Do zwykłych figurek wizualnych wystarczy żywica Standard lub Water-washable. Jeśli zależy Ci na maksymalnym mikrodetalu, ażurze i cienkich elementach na drukarce 16K, wybierz żywicę High-precision 14K, ma minimalny skurcz i najwyższą rozdzielczość odwzorowania.",
    faqQ5: "Czy wydruki z żywicy są trwałe?",
    faqA5: "Zależy od segmentu żywicy. Standardowe żywice wizualne są twarde, ale kruche i mogą pękać przy uderzeniu, dlatego nie nadają się do części użytkowych. Żywice techniczne, jak Tough czy ABS-like, są znacznie bardziej wytrzymałe mechanicznie i po prawidłowym utwardzeniu UV nadają się do prototypów funkcjonalnych i elementów eksploatacyjnych.",
    footerCtaTitle: "Potrzebujesz wydruku MSLA?",
    footerCtaText: "Drukujemy w standardowych, technicznych i precyzyjnych żywicach na drukarce 16K. Wyceń zlecenie online.",
    footerCtaBtn: "Kalkulator wyceny sTuDiO",
  },
  en: {
    heroTag: "sTuDiO Tools",
    heroTitle: "MSLA 3D Print Settings: Resins & Material Advisor",
    heroDesc: "Find the right resin for MSLA printing, check layer, wash and post-cure parameters, free, no sign-up.",
    introTitle: "What is MSLA, and why 16K",
    introText: "MSLA (Masked Stereolithography) cures resin with UV light projected through a masked LCD screen, layer by layer. Our Elegoo Saturn 4 Ultra printer has 16K resolution and a pixel size of roughly 14 microns, so it reproduces micro-detail unreachable for FDM printing, openwork patterns, threads, micro-engraving or jewelry casting patterns. Below you can pick a resin for your project and check its parameters.",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO Tools",
    breadThis: "MSLA 3D Print Settings",
    faqHeading: "Frequently asked questions",
    faqQ1: "What is the difference between standard and ABS-like resin?",
    faqA1: "Standard resin is hard but brittle, great for visual models and figurines where detail matters more than impact resistance. ABS-like resin has toughness similar to ABS plastic and does not crack under bending or snap-fits, so it is chosen for housings and mechanical parts that need to survive real loads.",
    faqQ2: "Is water-washable resin worse than IPA-washable resin?",
    faqA2: "No, it is simply a different trade-off. Water replaces isopropyl alcohol for washing, which is more convenient and cheaper at home, but the print can be slightly less moisture resistant than an IPA-washed print, so parts exposed to humidity are better made from the IPA version.",
    faqQ3: "What is castable resin, and why does it cost 1399 PLN/kg?",
    faqA3: "Castable resin (e.g. BlueCast X-One) burns out with no ash residue during lost-resin casting, so the pattern disappears without contaminating the mould. The high price comes from the precise chemical formula needed for clean burnout, this is a resin for jewelers casting signet rings and solid forms, not for everyday printing.",
    faqQ4: "Which resin works best for figurines and miniatures?",
    faqA4: "Standard visual figurines are fine with Standard or Water-washable resin. If you need maximum micro-detail, openwork and thin features on a 16K printer, choose High-precision 14K resin, it has minimal shrinkage and the highest reproduction resolution.",
    faqQ5: "Are resin prints durable?",
    faqA5: "It depends on the resin segment. Standard visual resins are hard but brittle and can crack on impact, so they are not suited to functional parts. Technical resins like Tough or ABS-like are much stronger mechanically and, once properly UV-cured, work well for functional prototypes and wear parts.",
    footerCtaTitle: "Need an MSLA print?",
    footerCtaText: "We print in standard, technical and precision resins on a 16K printer. Get an online quote.",
    footerCtaBtn: "sTuDiO Pricing Calculator",
  },
  de: {
    heroTag: "sTuDiO-Tools",
    heroTitle: "MSLA-3D-Druckparameter: Harze und Materialberater",
    heroDesc: "Passendes Harz für den MSLA-Druck finden, Schicht-, Reinigungs- und Nachhärteparameter prüfen, kostenlos, ohne Anmeldung.",
    introTitle: "Was ist MSLA, und wozu 16K",
    introText: "MSLA (Masked Stereolithography) härtet Harz schichtweise mit UV-Licht aus, das durch einen maskierten LCD-Bildschirm projiziert wird. Unser Drucker Elegoo Saturn 4 Ultra hat eine Auflösung von 16K und eine Pixelgröße von rund 14 Mikrometern, dadurch bildet er Mikrodetails ab, die im FDM-Druck nicht erreichbar sind, Durchbruchmuster, Gewinde, Mikrogravur oder Schmuck-Gussmodelle. Unten wählen Sie ein Harz für Ihr Projekt und prüfen dessen Parameter.",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
    breadThis: "MSLA-3D-Druckparameter",
    faqHeading: "Häufig gestellte Fragen",
    faqQ1: "Was unterscheidet Standardharz von ABS-like-Harz?",
    faqA1: "Standardharz ist hart, aber spröde und eignet sich für visuelle Modelle und Figuren, bei denen Detail wichtiger ist als Schlagfestigkeit. ABS-like-Harz hat eine Zähigkeit ähnlich wie ABS-Kunststoff und bricht nicht bei Biegung oder Schnappverbindungen, daher wird es für Gehäuse und mechanische Teile gewählt, die echten Belastungen standhalten müssen.",
    faqQ2: "Ist wasserwaschbares Harz schlechter als IPA-waschbares Harz?",
    faqA2: "Nein, es ist nur ein anderer Kompromiss. Wasser ersetzt Isopropylalkohol bei der Reinigung, was zu Hause praktischer und günstiger ist, aber der Druck kann etwas weniger feuchtigkeitsbeständig sein als ein IPA-gewaschener Druck, daher sind Teile mit Feuchtigkeitskontakt besser aus der IPA-Version.",
    faqQ3: "Was ist Castable-Harz, und warum kostet es 1399 PLN/kg?",
    faqA3: "Castable-Harz (z. B. BlueCast X-One) brennt beim Lost-Resin-Guss rückstandsfrei aus, sodass das Modell verschwindet, ohne die Gussform zu verunreinigen. Der hohe Preis ergibt sich aus der präzisen chemischen Formel für sauberes Ausbrennen, das ist ein Harz für Goldschmiede, die Siegelringe und massive Formen gießen, nicht für den Alltagsdruck.",
    faqQ4: "Welches Harz eignet sich am besten für Figuren und Miniaturen?",
    faqA4: "Für gewöhnliche visuelle Figuren reicht Standard- oder wasserwaschbares Harz. Wer maximales Mikrodetail, Durchbruch und dünne Elemente auf einem 16K-Drucker möchte, wählt High-precision-14K-Harz, es hat minimale Schrumpfung und die höchste Abbildungsauflösung.",
    faqQ5: "Sind Harzdrucke langlebig?",
    faqA5: "Das hängt vom Harzsegment ab. Standard-Visualharze sind hart, aber spröde und können bei Stößen brechen, daher eignen sie sich nicht für funktionale Teile. Technische Harze wie Tough oder ABS-like sind mechanisch deutlich belastbarer und eignen sich nach korrekter UV-Nachhärtung für Funktionsprototypen und Verschleißteile.",
    footerCtaTitle: "MSLA-Druck benötigt?",
    footerCtaText: "Wir drucken in Standard-, technischen und Präzisionsharzen auf einem 16K-Drucker. Online-Angebot einholen.",
    footerCtaBtn: "sTuDiO-Preiskalkulator",
  },
};

const SEO_META = {
  pl: {
    title: "Parametry druku 3D MSLA: żywice, ceny, dobór | AEJaCA",
    description: "Dobierz żywicę do druku MSLA, sprawdź warstwę, mycie i czas utwardzania UV. Darmowy kalkulator porównawczy dla 13 żywic Elegoo Saturn 4 Ultra 16K.",
  },
  en: {
    title: "MSLA 3D Print Settings: Resins, Prices, Advisor | AEJaCA",
    description: "Pick a resin for MSLA printing, check layer height, wash medium and UV post-cure time. Free comparison tool for 13 resins, 16K Elegoo Saturn 4 Ultra.",
  },
  de: {
    title: "MSLA-3D-Druckparameter: Harze, Preise, Beratung | AEJaCA",
    description: "Harz für den MSLA-Druck wählen, Schicht, Reinigung und UV-Nachhärtezeit prüfen. Kostenloses Vergleichstool für 13 Harze, 16K Elegoo Saturn 4 Ultra.",
  },
};

export default function ResinSettingsPage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;

  const introRef = useScrollReveal();
  const calcRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const faqItems = [
    { q: L.faqQ1, a: L.faqA1 },
    { q: L.faqQ2, a: L.faqA2 },
    { q: L.faqQ3, a: L.faqA3 },
    { q: L.faqQ4, a: L.faqA4 },
    { q: L.faqQ5, a: L.faqA5 },
  ];

  const schemas = [
    buildWebPageSchema({
      title: seo.title,
      description: seo.description,
      url: `${SITE.url}/toolstudio/resin-settings/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
      { name: L.breadThis, url: `${SITE.url}/toolstudio/resin-settings/` },
    ]),
    buildFAQSchema(faqItems),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolstudio"
        path="/toolstudio/resin-settings"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[340px]">
          <img
            src="/img/calc/3d_segments/msla_resin.webp"
            alt="Druk 3D MSLA, żywice i parametry, AEJaCA sTuDiO"
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
          <div className="max-w-4xl mx-auto">
            <div ref={calcRef} className="reveal">
              <ResinSettingsCalc lang={lang} />
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
