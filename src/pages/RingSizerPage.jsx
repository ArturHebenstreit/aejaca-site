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
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import RingSizerPrint from "../components/calculators/RingSizerPrint.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import ContentCTA from "../components/ContentCTA.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildHowToSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const URL = `${SITE.url}/toolsjewelry/ring-sizer/`;

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

const FAQ = {
  pl: [
    { q: "Czy miarka do wydruku jest dokładna?", a: "Tak, pod jednym warunkiem: wydruk musi być w skali 100%. Opcja „Dopasuj do strony” zmniejsza kartkę o kilka procent, co przy obwodzie palca oznacza pomyłkę o jeden do dwóch rozmiarów. Dlatego na arkuszu jest prostokąt w rozmiarze karty płatniczej i linijka 100 mm do sprawdzenia." },
    { q: "O jakiej porze dnia mierzyć palec?", a: "Wieczorem. Rano palce są węższe nawet o pół rozmiaru, a po wysiłku, w upale albo po zmarznięciu różnica dochodzi do całego rozmiaru." },
    { q: "Czy rozmiar EU to obwód palca?", a: "Tak. W systemie europejskim rozmiar równa się obwodowi palca w milimetrach. Obwód 54 mm to rozmiar 54, czyli średnica wewnętrzna 17,2 mm." },
    { q: "Czy szeroka obrączka wymaga innego rozmiaru?", a: "Tak. Obrączka szersza niż 6 mm siedzi ciaśniej, bo dotyka większej powierzchni palca. Weź pół rozmiaru więcej niż zmierzony." },
    { q: "Mam dużą kostkę, co wtedy?", a: "Zmierz osobno kostkę i nasadę palca, a potem wybierz wartość pośrednią. Pierścionek musi przejść przez kostkę, ale nie może obracać się luźno na nasadzie." },
    { q: "Czy da się zmienić rozmiar gotowego pierścionka?", a: "Zwykle tak, ale nie zawsze bez śladu. Przy pierścionku z kamieniami na całym obwodzie albo z grawerem wewnątrz zmiana rozmiaru oznacza ingerencję w zdobienie. Dlatego lepiej ustalić rozmiar przed wykonaniem." },
  ],
  en: [
    { q: "Is a printable ring sizer accurate?", a: "Yes, on one condition: the sheet has to print at 100% scale. „Fit to page” shrinks it by a few percent, which on a finger circumference is worth one to two sizes. That is why the sheet carries a payment-card rectangle and a 100 mm ruler to check against." },
    { q: "What time of day should I measure?", a: "In the evening. Fingers are up to half a size slimmer in the morning, and after exercise, in heat or in the cold the swing reaches a full size." },
    { q: "Is the EU size the finger circumference?", a: "Yes. In the European system the size equals the circumference in millimetres. A 54 mm circumference is size 54, which is a 17.2 mm inner diameter." },
    { q: "Does a wide band need a different size?", a: "Yes. A band wider than 6 mm sits tighter because it touches more of the finger. Take half a size up from the measurement." },
    { q: "My knuckle is large, what then?", a: "Measure the knuckle and the base of the finger separately, then pick a value in between. The ring has to pass the knuckle without spinning loosely at the base." },
    { q: "Can a finished ring be resized?", a: "Usually yes, but not always invisibly. On a ring set with stones all around, or engraved inside, resizing means touching the decoration. Settling the size before making it is the safer route." },
  ],
  de: [
    { q: "Ist ein ausgedrucktes Ringmaßband genau?", a: "Ja, unter einer Bedingung: der Ausdruck muss in 100% erfolgen. „An Seite anpassen” verkleinert das Blatt um einige Prozent, beim Fingerumfang entspricht das ein bis zwei Größen. Deshalb enthält das Blatt ein Bankkarten-Rechteck und ein 100-mm-Lineal zur Kontrolle." },
    { q: "Zu welcher Tageszeit sollte man messen?", a: "Abends. Morgens sind Finger bis zu einer halben Größe schlanker, nach Sport, bei Hitze oder Kälte erreicht der Unterschied eine ganze Größe." },
    { q: "Ist die EU-Größe der Fingerumfang?", a: "Ja. Im europäischen System entspricht die Größe dem Umfang in Millimetern. 54 mm Umfang ist Größe 54, also 17,2 mm Innendurchmesser." },
    { q: "Braucht ein breiter Ring eine andere Größe?", a: "Ja. Ein Ring breiter als 6 mm sitzt enger, weil er mehr Fingerfläche berührt. Nehmen Sie eine halbe Größe mehr als gemessen." },
    { q: "Ich habe einen großen Knöchel, was nun?", a: "Messen Sie Knöchel und Fingeransatz getrennt und wählen Sie einen Wert dazwischen. Der Ring muss über den Knöchel passen, darf am Ansatz aber nicht lose drehen." },
    { q: "Lässt sich ein fertiger Ring in der Größe ändern?", a: "Meistens ja, aber nicht immer spurlos. Bei rundum gefassten Steinen oder einer Innengravur greift die Änderung in den Schmuck ein. Die Größe vorher festzulegen ist der sicherere Weg." },
  ],
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
  const faq = FAQ[lang] || FAQ.pl;

  const introRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: URL, lang }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
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
