// ============================================================
// MIARKA DO PIERSCIONKOW DO WYDRUKU, STRONA
// ============================================================
// Osobna strona, a nie sekcja w konwerterze rozmiarow, i to jest decyzja
// swiadoma. Konwerter odpowiada na pytanie "ile to jest w US", miarka na
// pytanie "jaki mam rozmiar". To dwa rozne zapytania, dwie rozne intencje
// i dwie rozne strony w wynikach wyszukiwania. Obie linkuja do siebie
// nawzajem, wiec ruch trafiajacy na jedna znajduje druga.
//
// Schemat HowTo jest tu na miejscu doslownie: strona opisuje procedure
// krok po kroku. FAQ odpowiada na pytania, ktore i tak przychodza mailem
// (kiedy mierzyc, co z szeroka obraczka, co z duza kostka).

import { Link } from "../i18n/nav.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import PYTANIA from "../data/faq/miarka.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import RingSizerPrint from "../components/calculators/RingSizerPrint.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import ContentCTA from "../components/ContentCTA.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildHowToSchema, buildFAQSchema } from "../seo/schemas.js";
import { adresStrony } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia jubilerskie",
    heroTitle: "Miarka do pierścionków do wydruku",
    heroDesc: "Wydrukuj, wytnij, zmierz palec w minutę. Bez rejestracji i bez zamawiania miarki pocztą.",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia jubilerskie",
    breadThis: "Miarka do wydruku",
    introTitle: "Dwie metody na jednej kartce",
    introText: "Pasek owijany wokół palca działa, gdy nie masz żadnego pierścionka. Tabela kółek działa, gdy masz pierścionek, który dobrze leży. Jeżeli możesz, użyj obu i porównaj wynik, bo każda z nich myli się w inną stronę.",
    faqTitle: "Częste pytania",
    convTitle: "Znasz już rozmiar EU?",
    convText: "Przelicz go na US, UK i JP albo sprawdź średnicę wewnętrzną w konwerterze rozmiarów.",
    convBtn: "Konwerter rozmiarów",
    footerCtaTitle: "Zamów pierścionek w swoim rozmiarze",
    footerCtaText: "Robimy na wymiar, więc rozmiar ustalamy przed pierwszym cięciem metalu, a nie po.",
    footerCtaBtn: "Napisz do nas",
  },
  en: {
    heroTag: "Jewelry tools",
    heroTitle: "Printable ring sizer",
    heroDesc: "Print it, cut it, measure your finger in a minute. No sign-up, no waiting for a sizer in the post.",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry tools",
    breadThis: "Printable sizer",
    introTitle: "Two methods on one sheet",
    introText: "The wrap-around strip works when you have no ring at all. The circle chart works when you have a ring that fits well. Use both if you can and compare, because each errs in a different direction.",
    faqTitle: "Common questions",
    convTitle: "Already know your EU size?",
    convText: "Convert it to US, UK and JP, or check the inner diameter in the size converter.",
    convBtn: "Size converter",
    footerCtaTitle: "Order a ring in your size",
    footerCtaText: "We make to measure, so the size is settled before the first cut, not after.",
    footerCtaBtn: "Contact us",
  },
  de: {
    heroTag: "Schmuck-Tools",
    heroTitle: "Ringmaßband zum Ausdrucken",
    heroDesc: "Drucken, ausschneiden, in einer Minute messen. Ohne Anmeldung und ohne Warten auf ein Maßband per Post.",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
    breadThis: "Maßband zum Ausdrucken",
    introTitle: "Zwei Methoden auf einem Blatt",
    introText: "Der Streifen zum Umwickeln hilft, wenn Sie gar keinen Ring haben. Die Kreistabelle hilft, wenn ein Ring gut sitzt. Nutzen Sie beide und vergleichen Sie, denn jede irrt in eine andere Richtung.",
    faqTitle: "Häufige Fragen",
    convTitle: "EU-Größe schon bekannt?",
    convText: "Rechnen Sie sie in US, UK und JP um oder prüfen Sie den Innendurchmesser im Konverter.",
    convBtn: "Größenkonverter",
    footerCtaTitle: "Ring in Ihrer Größe bestellen",
    footerCtaText: "Wir fertigen nach Maß, die Größe steht also vor dem ersten Schnitt fest, nicht danach.",
    footerCtaBtn: "Kontakt",
  },
};

const SEO_META = {
  pl: {
    title: "Miarka do pierścionków do wydruku, PDF za darmo | AEJaCA",
    description: "Darmowa miarka do pierścionków do wydruku. Zmierz rozmiar palca paskiem lub tabelą kółek, ze sprawdzeniem skali wydruku. Rozmiary EU, US, UK, JP.",
  },
  en: {
    title: "Printable ring sizer, free download | AEJaCA",
    description: "Free printable ring sizer. Measure your finger with a paper strip or a circle chart, with a built-in print scale check. EU, US, UK, JP sizes.",
  },
  de: {
    title: "Ringmaßband zum Ausdrucken, gratis | AEJaCA",
    description: "Kostenloses Ringmaßband zum Ausdrucken. Fingergröße mit Streifen oder Kreistabelle messen, inklusive Maßstabskontrolle. EU, US, UK, JP.",
  },
};

const HOWTO_STEPS = {
  pl: [
    { title: "Sprawdź skalę wydruku", desc: "Wydrukuj arkusz w skali 100% i przyłóż kartę płatniczą do prostokąta na kartce. Musi go zakryć co do milimetra." },
    { title: "Wytnij pasek", desc: "Wytnij pasek wzdłuż konturu i przetnij szczelinę zaznaczoną przy szerszym końcu." },
    { title: "Owiń palec", desc: "Owiń pasek wokół palca cyframi na zewnątrz i przewlecz koniec przez szczelinę." },
    { title: "Zaciśnij i odczytaj", desc: "Zaciśnij tak, żeby pasek zsuwał się przez kostkę, ale nie obracał luźno. Liczba przy krawędzi szczeliny to rozmiar EU." },
  ],
  en: [
    { title: "Check the print scale", desc: "Print the sheet at 100% and lay a payment card on the printed rectangle. It has to cover it exactly." },
    { title: "Cut the strip", desc: "Cut along the outline and cut open the slot marked near the wider end." },
    { title: "Wrap your finger", desc: "Wrap the strip around the finger with the numbers facing out and thread the tip through the slot." },
    { title: "Tighten and read", desc: "Tighten so it slides over the knuckle but does not spin loosely. The number at the slot edge is your EU size." },
  ],
  de: [
    { title: "Druckmaßstab prüfen", desc: "Drucken Sie das Blatt in 100% und legen Sie eine Bankkarte auf das gedruckte Rechteck. Sie muss es genau abdecken." },
    { title: "Streifen ausschneiden", desc: "Entlang der Kontur ausschneiden und den Schlitz am breiteren Ende aufschneiden." },
    { title: "Finger umwickeln", desc: "Den Streifen mit den Zahlen nach außen um den Finger legen und die Spitze durch den Schlitz ziehen." },
    { title: "Festziehen und ablesen", desc: "So festziehen, dass er über den Knöchel gleitet, sich aber nicht lose dreht. Die Zahl an der Schlitzkante ist die EU-Größe." },
  ],
};

export default function RingSizerPage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;
  // Pytania stoja we wspolnym zbiorze danych, wiec te same odpowiedzi da sie
  // znalezc przez wyszukiwarke na `/faq/`, bez drugiej kopii tekstu.
  const faq = PYTANIA.map((f) => ({ id: f.id, q: f.q[lang] || f.q.pl, a: f.a[lang] || f.a.pl }));

  const introRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const URL = adresStrony("/toolsjewelry/ring-sizer/", lang);

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: URL, lang }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: adresStrony("/", lang) },
      { name: L.breadJewelry, url: adresStrony("/jewelry/", lang) },
      { name: L.breadTools, url: adresStrony("/toolsjewelry/", lang) },
      { name: L.breadThis, url: URL },
    ]),
    buildHowToSchema({
      name: L.heroTitle,
      description: seo.description,
      steps: HOWTO_STEPS[lang] || HOWTO_STEPS.pl,
      totalTime: "PT3M",
    }),
    buildFAQSchema(faq),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolsjewelry"
        path="/toolsjewelry/ring-sizer"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        <section className="pt-28 pb-6 px-4 text-center">
          <div className="text-amber-400 text-xs font-medium uppercase tracking-[0.35em] mb-4">{L.heroTag}</div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4 leading-tight">{L.heroTitle}</h1>
          <p className="text-neutral-300 text-base max-w-xl mx-auto leading-relaxed">{L.heroDesc}</p>
        </section>

        <div className="max-w-3xl mx-auto px-4 pt-2 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadJewelry, href: "/jewelry/" },
              { label: L.breadTools, href: "/toolsjewelry/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        <section className="py-6 px-4">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-5 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-lg font-semibold text-amber-300 mb-2">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <section className="py-4 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Bez `reveal`: kontener z transformacja staje sie blokiem
                zawierajacym i przy druku spycha arkusz o jedna kartke w dol.
                Narzedzie jest tresc glowna tej strony, nie ma czego odslaniac. */}
            <RingSizerPrint />
          </div>
        </section>

        <div className="gradient-divider rs-hide-print" />

        {/* Konwerter, druga polowa tej samej intencji */}
        <section className="py-8 px-4 rs-hide-print">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/toolsjewelry/ring-size/"
              className="group flex flex-col gap-2 p-5 rounded-2xl glass hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="text-white font-semibold text-sm group-hover:text-amber-300 transition-colors">{L.convTitle}</div>
              <div className="text-neutral-400 text-xs leading-relaxed">{L.convText}</div>
              <div className="text-amber-400 text-xs font-medium">{L.convBtn}</div>
            </Link>
          </div>
        </section>

        <section className="py-8 px-4 rs-hide-print">
          <div className="max-w-3xl mx-auto">
            <div ref={faqRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-5">{L.faqTitle}</h2>
              <div className="space-y-4">
                {faq.map((item) => (
                  <div key={item.q} className="p-5 rounded-2xl glass">
                    <h3 className="text-white font-medium text-sm mb-2">{item.q}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="gradient-divider rs-hide-print" />

        <section className="px-4 rs-hide-print">
          <ToolReviewCTA />
        </section>

        <section className="py-10 px-4 text-center rs-hide-print">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <ContentCTA service="jewelry_stones" category="jewelry" className="mb-8 text-left" />
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.footerCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.footerCtaText}</p>
            <Link
              to="/contact/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.footerCtaBtn}
            </Link>
          </div>
        </section>

        <div className="gradient-divider rs-hide-print" />

      </div>
    </>
  );
}
