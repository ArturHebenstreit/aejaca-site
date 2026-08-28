// ============================================================
// WARTOSC METALU SZLACHETNEGO, STRONA
// ============================================================
// Strona istniala wczesniej pod tytulem "Wycena surowca" i byla napisana dla
// jubilera liczacego koszt materialu do projektu. Zapytanie, ktore realnie
// generuje ruch, brzmi jednak "ile warte jest moje zloto" i zadaje je ktos ze
// zlomem w szufladzie. To ta sama matematyka i inny czytelnik.
//
// Rozwazalem osobna strone pod ta intencje. Odrzucone: kalkulator bylby w
// 95% ten sam, a dwie strony o wartosci zlota na jednej domenie konkuruja ze
// soba w wynikach zamiast sie sumowac. Zamiast tego jedna strona z naglowkiem
// pod intencje konsumencka i sekcjami, ktore obsluguja obie.
//
// Sekcja o karatach jest tu, bo "ile to jest 585 w karatach" to osobne
// zapytanie, na ktore i tak trzeba odpowiedziec, a tabela w kalkulatorze
// pokazuje ceny, nie definicje.

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import MetalPricingCalc from "../components/calculators/MetalPricingCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import ToolLinks from "../components/ToolLinks.jsx";
import { getToolById } from "../data/toolLinks.js";
import {
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildHowToSchema,
  buildFAQSchema,
} from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";
import HeroObraz from "../components/HeroObraz.jsx";
import { Link } from "../i18n/nav.jsx";

const URL = `${SITE.url}/toolsjewelry/metal-pricing/`;

const LABELS = {
  pl: {
    heroTag: "Wycena metalu",
    heroTitle: "Ile warte jest moje złoto?",
    heroDesc: "Podaj próbę i masę, a policzymy wartość kruszcu po dzisiejszej cenie spot oraz to, ile realnie płaci za nią skup.",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia jubilerskie",
    breadThis: "Wartość metalu",
    introTitle: "Skąd pochodzi cena",
    introText: "Cena spot pochodzi z rynku globalnego (XAU, XAG, XPT i XPD w USD), przeliczana na złote po kursie NBP i odświeżana co 60 minut. Złoto wyceniamy według notowania NBP dla złota próby 999.",
    howtoTitle: "Jak wycenić złoto krok po kroku",
    karatTitle: "Próba a karaty",
    karatText: "Próba to zawartość czystego złota w tysięcznych częściach stopu. Karat to ta sama informacja w dwudziestu czwartych częściach. Złoto 585 zawiera 58,5% czystego złota, czyli 14 z 24 części, i dlatego bywa oznaczane jako 14K.",
    karatHead: ["Próba", "Karaty", "Zawartość złota", "Gdzie spotykana"],
    whyTitle: "Dlaczego skup płaci mniej niż wynosi wartość kruszcu",
    whyText: "Skup musi zarobić, a przed odsprzedażą metal trafia do rafinacji, która kosztuje i trwa. Do tego dochodzi ryzyko: dopóki złom nie zostanie przetopiony i zbadany, kupujący zna próbę tylko z cechy probierczej. Stąd widełki od 70 do 90%. Niższy koniec dotyczy pojedynczych, lekkich sztuk i niskich prób, wyższy większych partii próby 585 i wyżej.",
    whyText2: "Jest jeszcze druga strona. Wyroby sygnowane, zabytkowe albo po prostu ładne i sprawne bywają warte kilkukrotnie więcej jako biżuteria niż jako surowiec. Zanim oddasz coś na wagę, sprawdź, czy nie sprzedajesz projektu w cenie metalu.",
    faqTitle: "Częste pytania",
    footerCtaTitle: "Chcesz przerobić stare złoto na coś nowego?",
    footerCtaText: "Przetapiamy powierzony metal i wykonujemy z niego nową biżuterię. Napisz, co masz, a powiemy, co da się z tego zrobić.",
    footerCtaBtn: "Napisz do nas",
  },
  en: {
    heroTag: "Metal valuation",
    heroTitle: "What is my gold worth?",
    heroDesc: "Enter the purity and the weight, and we will work out the metal value at today's spot price plus what a buyer realistically pays for it.",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry tools",
    breadThis: "Metal value",
    introTitle: "Where the price comes from",
    introText: "The spot price comes from the global market (XAU, XAG, XPT and XPD in USD), converted to Polish zloty at the NBP rate and refreshed hourly. Gold follows the NBP quotation for 999 fine gold.",
    howtoTitle: "How to value gold step by step",
    karatTitle: "Fineness and karat",
    karatText: "Fineness is the amount of pure gold in an alloy expressed in thousandths. Karat is the same fact in twenty-fourths. Gold 585 holds 58.5% pure gold, which is 14 parts out of 24, and that is why it is also stamped 14K.",
    karatHead: ["Fineness", "Karat", "Gold content", "Where you meet it"],
    whyTitle: "Why a buyer pays less than the metal is worth",
    whyText: "A buyer has to earn, and before resale the metal goes to a refinery, which costs money and takes time. Then there is risk: until scrap is melted and assayed, the buyer knows the purity only from a stamp. Hence the 70 to 90% band. The low end applies to single light pieces and low purities, the high end to larger lots of 585 and above.",
    whyText2: "There is another side to this. Signed, antique or simply attractive and intact pieces are often worth several times more as jewelry than as raw material. Before selling something by weight, check whether you are selling a design at the price of metal.",
    faqTitle: "Common questions",
    footerCtaTitle: "Want to turn old gold into something new?",
    footerCtaText: "We melt down metal you supply and make new jewelry from it. Tell us what you have and we will tell you what can be made of it.",
    footerCtaBtn: "Contact us",
  },
  de: {
    heroTag: "Metallbewertung",
    heroTitle: "Was ist mein Gold wert?",
    heroDesc: "Feingehalt und Gewicht eingeben, und wir berechnen den Materialwert zum heutigen Spotpreis sowie das, was ein Ankäufer realistisch dafür zahlt.",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
    breadThis: "Metallwert",
    introTitle: "Woher der Preis kommt",
    introText: "Der Spotpreis stammt vom Weltmarkt (XAU, XAG, XPT und XPD in USD), wird zum NBP-Kurs in Zloty umgerechnet und stündlich aktualisiert. Gold folgt der NBP-Notierung für Feingold 999.",
    howtoTitle: "Gold Schritt für Schritt bewerten",
    karatTitle: "Feingehalt und Karat",
    karatText: "Der Feingehalt gibt den Reingoldanteil einer Legierung in Tausendsteln an. Karat nennt dieselbe Größe in Vierundzwanzigsteln. Gold 585 enthält 58,5% Reingold, also 14 von 24 Teilen, und trägt deshalb auch die Punze 14K.",
    karatHead: ["Feingehalt", "Karat", "Goldanteil", "Wo verbreitet"],
    whyTitle: "Warum der Ankauf weniger zahlt als das Metall wert ist",
    whyText: "Ein Ankäufer muss verdienen, und vor dem Weiterverkauf geht das Metall in die Scheidung, die Geld und Zeit kostet. Dazu kommt das Risiko: bis Altgold eingeschmolzen und geprüft ist, kennt der Käufer den Feingehalt nur von der Punze. Daher die Spanne von 70 bis 90%. Das untere Ende gilt für einzelne leichte Stücke und niedrige Feingehalte, das obere für größere Posten ab 585.",
    whyText2: "Es gibt noch eine andere Seite. Signierte, antike oder schlicht schöne und intakte Stücke sind als Schmuck oft ein Vielfaches wert im Vergleich zum Materialwert. Bevor Sie etwas nach Gewicht verkaufen, prüfen Sie, ob Sie nicht ein Design zum Metallpreis abgeben.",
    faqTitle: "Häufige Fragen",
    footerCtaTitle: "Altgold in etwas Neues verwandeln?",
    footerCtaText: "Wir schmelzen beigestelltes Metall ein und fertigen daraus neuen Schmuck. Schreiben Sie uns, was Sie haben, und wir sagen Ihnen, was daraus werden kann.",
    footerCtaBtn: "Kontakt",
  },
};

const SEO_META = {
  pl: {
    title: "Ile warte jest moje złoto? Kalkulator wartości | AEJaCA",
    description: "Policz wartość złota, srebra i platyny po aktualnej cenie spot. Próby 333, 375, 585, 750 i 999, przelicznik na karaty i realne widełki skupu.",
  },
  en: {
    title: "What is my gold worth? Metal value calculator | AEJaCA",
    description: "Work out the value of gold, silver and platinum at the current spot price. Fineness 333 to 999, karat conversion and a realistic buy-back range.",
  },
  de: {
    title: "Was ist mein Gold wert? Wertrechner | AEJaCA",
    description: "Berechnen Sie den Wert von Gold, Silber und Platin zum aktuellen Spotpreis. Feingehalt 333 bis 999, Karat-Umrechnung und realistische Ankaufsspanne.",
  },
};

// Przelicznik proby na karaty. Kolumna "gdzie spotykana" jest wazniejsza, niz
// wyglada: ktos z niemieckim spadkiem po babci trzyma w reku 333 i nie znajdzie
// tej proby w polskich tabelach, bo w Polsce jej sie nie stosuje.
const KARAT_TABLE = {
  pl: [
    ["999", "24K", "99,9%", "Sztabki i monety inwestycyjne"],
    ["916", "22K", "91,6%", "Monety, biżuteria bliskowschodnia i indyjska"],
    ["750", "18K", "75,0%", "Biżuteria wyższej klasy, standard w Europie Zachodniej"],
    ["585", "14K", "58,5%", "Najczęstsza próba w Polsce i Niemczech"],
    ["417", "10K", "41,7%", "Biżuteria amerykańska"],
    ["375", "9K", "37,5%", "Biżuteria brytyjska"],
    ["333", "8K", "33,3%", "Starsza biżuteria niemiecka, w Polsce niestosowana"],
  ],
  en: [
    ["999", "24K", "99.9%", "Investment bars and coins"],
    ["916", "22K", "91.6%", "Coins, Middle Eastern and Indian jewelry"],
    ["750", "18K", "75.0%", "Higher-end jewelry, the Western European standard"],
    ["585", "14K", "58.5%", "The most common fineness in Poland and Germany"],
    ["417", "10K", "41.7%", "American jewelry"],
    ["375", "9K", "37.5%", "British jewelry"],
    ["333", "8K", "33.3%", "Older German jewelry, not used in Poland"],
  ],
  de: [
    ["999", "24K", "99,9%", "Barren und Anlagemünzen"],
    ["916", "22K", "91,6%", "Münzen, nahöstlicher und indischer Schmuck"],
    ["750", "18K", "75,0%", "Gehobener Schmuck, Standard in Westeuropa"],
    ["585", "14K", "58,5%", "Häufigster Feingehalt in Polen und Deutschland"],
    ["417", "10K", "41,7%", "Amerikanischer Schmuck"],
    ["375", "9K", "37,5%", "Britischer Schmuck"],
    ["333", "8K", "33,3%", "Älterer deutscher Schmuck, in Polen nicht gebräuchlich"],
  ],
};

const HOWTO_STEPS = {
  pl: [
    { title: "Znajdź cechę probierczą", desc: "Szukaj wybitej liczby: wewnątrz obrączki, przy zapięciu łańcuszka albo na sztyfcie kolczyka. 585, 750 i 333 to próba w tysięcznych, 14K i 18K to ta sama informacja w karatach." },
    { title: "Zważ bez dodatków", desc: "Użyj wagi z dokładnością do 0,01 g. Odejmij lub odczep kamienie, sznurki, gumki i zapięcia z innego metalu, bo skup ich nie kupuje." },
    { title: "Rozdziel próby", desc: "Ważaj osobno każdą próbę. Wrzucenie obrączki 750 i łańcuszka 333 na jedną szalkę daje wynik, którego nie da się poprawnie przeliczyć." },
    { title: "Policz i odczytaj widełki", desc: "Wpisz próbę i masę w kalkulatorze. Górna liczba to wartość samego kruszcu, dolna to kwota, jakiej realnie możesz się spodziewać w skupie." },
  ],
  en: [
    { title: "Find the hallmark", desc: "Look for a stamped number: inside a ring band, near a chain clasp or on an earring post. 585, 750 and 333 are fineness in thousandths, 14K and 18K are the same fact in karats." },
    { title: "Weigh without extras", desc: "Use a scale accurate to 0.01 g. Remove or deduct stones, cords, elastics and clasps made of another metal, because a buyer does not pay for them." },
    { title: "Separate the purities", desc: "Weigh each fineness on its own. Putting a 750 ring and a 333 chain on the same pan gives a figure that cannot be converted correctly." },
    { title: "Calculate and read the band", desc: "Enter the fineness and the weight. The top figure is the value of the metal itself, the lower one is what you can realistically expect from a buyer." },
  ],
  de: [
    { title: "Punze suchen", desc: "Suchen Sie die eingeschlagene Zahl: innen am Ring, nahe dem Kettenverschluss oder am Ohrsteckerstift. 585, 750 und 333 sind Tausendstel, 14K und 18K dieselbe Angabe in Karat." },
    { title: "Ohne Zubehör wiegen", desc: "Nutzen Sie eine Waage mit 0,01 g Genauigkeit. Steine, Bänder, Gummis und Verschlüsse aus anderem Metall abziehen oder entfernen, dafür zahlt kein Ankäufer." },
    { title: "Feingehalte trennen", desc: "Jeden Feingehalt einzeln wiegen. Ein 750er Ring und eine 333er Kette auf derselben Waage ergeben einen Wert, der sich nicht korrekt umrechnen lässt." },
    { title: "Rechnen und Spanne ablesen", desc: "Feingehalt und Gewicht eingeben. Die obere Zahl ist der reine Materialwert, die untere das, was ein Ankäufer realistisch zahlt." },
  ],
};

const FAQ = {
  pl: [
    { q: "Ile dostanę za gram złota 585 w skupie?", a: "Od 70 do 90% wartości kruszcu. Przy złocie 585 wartość kruszcu to 58,5% ceny czystego złota za gram, więc skup płaci mniej więcej od 41 do 53% ceny złota próby 999. Dokładna stawka zależy od masy partii i od tego, czy skup musi najpierw sprawdzić próbę." },
    { q: "Czy kamienie w pierścionku liczą się do wagi?", a: "Nie. Skup kupuje metal, a kamienie są dla niego balastem, który trzeba usunąć. Cyrkonie zwykle przepadają. Diament, szafir czy szmaragd o sensownej wielkości warto wyjąć i wycenić osobno, bo jego wartość bywa wyższa niż całej oprawy." },
    { q: "Co oznacza próba 585 w karatach?", a: "14 karatów. Próba to zawartość czystego złota w tysięcznych, karat w dwudziestych czwartych. 585 tysięcznych to 58,5%, a 14 z 24 części to 58,3%, więc obie liczby opisują ten sam stop." },
    { q: "Moja biżuteria nie ma żadnej cechy. Co teraz?", a: "Brak cechy nie oznacza, że to nie złoto, ale sam nie ustalisz próby na oko. Jubiler lub skup sprawdzi ją kamieniem probierczym z kwasami albo spektrometrem XRF, zwykle bezpłatnie i bez uszkodzenia wyrobu. Dopiero z tym wynikiem kalkulator ma sens." },
    { q: "Czy złoto białe jest warte tyle samo co żółte?", a: "Przy tej samej próbie tak. Kolor bierze się z domieszek, a te są bez znaczenia dla wyceny. Złoto białe 585 zawiera dokładnie tyle samo czystego złota co żółte 585. Powłoka rodowa nie dodaje wartości." },
    { q: "Czy opłaca się sprzedać starą biżuterię na wagę?", a: "Nie zawsze. Wyroby sygnowane, przedwojenne albo po prostu sprawne i ładne bywają warte kilkukrotność wartości metalu na rynku wtórnym. Sprzedaż na wagę ma sens przy uszkodzonych, pogiętych i pojedynczych sztukach, których nikt nie kupi jako biżuterii." },
    { q: "Czy zamiast sprzedawać, można przerobić stare złoto?", a: "Tak i często wychodzi to korzystniej. Przyjmujemy powierzony metal, przetapiamy go i wykonujemy z niego nowy wyrób, a wtedy płacisz tylko za robociznę i ewentualny brakujący surowiec, zamiast tracić marżę skupu i marżę na zakupie nowego złota." },
  ],
  en: [
    { q: "How much will I get for a gram of 585 gold?", a: "Between 70 and 90% of the metal value. In 585 gold the metal value is 58.5% of the price of pure gold per gram, so a buyer pays roughly 41 to 53% of the 999 gold price. The exact rate depends on the size of the lot and on whether the buyer has to verify the purity first." },
    { q: "Do the stones in a ring count towards the weight?", a: "No. A buyer purchases metal, and stones are ballast that has to be removed. Cubic zirconia is usually lost. A diamond, sapphire or emerald of any real size is worth removing and valuing separately, because it can be worth more than the whole setting." },
    { q: "What is 585 fineness in karat?", a: "14 karat. Fineness states the pure gold content in thousandths, karat in twenty-fourths. 585 thousandths is 58.5%, and 14 parts out of 24 is 58.3%, so both numbers describe the same alloy." },
    { q: "My jewelry has no hallmark. What now?", a: "A missing stamp does not mean it is not gold, but you cannot establish the fineness by eye. A jeweler or a buyer will test it with a touchstone and acids or with an XRF spectrometer, usually free of charge and without damaging the piece. Only with that result does the calculator mean anything." },
    { q: "Is white gold worth the same as yellow?", a: "At the same fineness, yes. The colour comes from the alloying metals, which do not matter for valuation. White gold 585 holds exactly as much pure gold as yellow 585. Rhodium plating adds no value." },
    { q: "Is it worth selling old jewelry by weight?", a: "Not always. Signed, pre-war or simply intact and attractive pieces can be worth several times the metal value on the secondary market. Selling by weight makes sense for damaged, bent and odd single pieces that nobody would buy as jewelry." },
    { q: "Can old gold be remade instead of sold?", a: "Yes, and it often works out better. We accept metal you supply, melt it down and make a new piece from it. You then pay for the work and any material shortfall, instead of losing both the buyer's margin and the margin on buying new gold." },
  ],
  de: [
    { q: "Wie viel bekomme ich für ein Gramm 585er Gold?", a: "Zwischen 70 und 90% des Materialwerts. Bei 585er Gold beträgt der Materialwert 58,5% des Feingoldpreises pro Gramm, ein Ankäufer zahlt also etwa 41 bis 53% des 999er Goldpreises. Der genaue Satz hängt von der Menge ab und davon, ob der Feingehalt erst geprüft werden muss." },
    { q: "Zählen Steine im Ring zum Gewicht?", a: "Nein. Der Ankauf kauft Metall, Steine sind Ballast, der entfernt werden muss. Zirkonia geht meist verloren. Ein Diamant, Saphir oder Smaragd von nennenswerter Größe sollte ausgefasst und getrennt bewertet werden, sein Wert übersteigt oft den der ganzen Fassung." },
    { q: "Was bedeutet Feingehalt 585 in Karat?", a: "14 Karat. Der Feingehalt nennt den Reingoldanteil in Tausendsteln, Karat in Vierundzwanzigsteln. 585 Tausendstel sind 58,5%, und 14 von 24 Teilen sind 58,3%, beide Zahlen beschreiben dieselbe Legierung." },
    { q: "Mein Schmuck hat keine Punze. Was nun?", a: "Eine fehlende Punze heißt nicht, dass es kein Gold ist, aber der Feingehalt lässt sich nicht mit bloßem Auge bestimmen. Ein Juwelier oder Ankäufer prüft ihn mit Prüfstein und Säuren oder per XRF-Spektrometer, meist kostenlos und ohne Schaden am Stück. Erst mit diesem Ergebnis ist der Rechner aussagekräftig." },
    { q: "Ist Weißgold so viel wert wie Gelbgold?", a: "Bei gleichem Feingehalt ja. Die Farbe kommt von den Zusatzmetallen, die für die Bewertung ohne Belang sind. Weißgold 585 enthält genauso viel Reingold wie gelbes 585. Eine Rhodinierung erhöht den Wert nicht." },
    { q: "Lohnt es sich, alten Schmuck nach Gewicht zu verkaufen?", a: "Nicht immer. Signierte, Vorkriegs- oder schlicht intakte und schöne Stücke erzielen auf dem Zweitmarkt oft ein Vielfaches des Materialwerts. Der Verkauf nach Gewicht lohnt bei beschädigten, verbogenen und einzelnen Teilen, die niemand als Schmuck kauft." },
    { q: "Kann man Altgold umarbeiten statt verkaufen?", a: "Ja, und häufig ist das günstiger. Wir nehmen beigestelltes Metall an, schmelzen es ein und fertigen daraus ein neues Stück. Sie zahlen dann Arbeitszeit und fehlendes Material, statt gleichzeitig die Ankaufsmarge und die Marge auf neues Gold zu verlieren." },
  ],
};

const RELATED_TOOL_IDS = ["alloy-composition", "ring-blank", "ring-sizer"];

export default function MetalPricingPage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;
  const faq = FAQ[lang] || FAQ.pl;
  const karats = KARAT_TABLE[lang] || KARAT_TABLE.pl;
  const steps = HOWTO_STEPS[lang] || HOWTO_STEPS.pl;

  const introRef = useScrollReveal();
  const howtoRef = useScrollReveal();
  const karatRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const toolsRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const relatedTools = RELATED_TOOL_IDS.map(getToolById).filter(Boolean);

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: URL, lang }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
      { name: L.breadThis, url: URL },
    ]),
    buildHowToSchema({
      name: L.howtoTitle,
      description: seo.description,
      steps,
      totalTime: "PT5M",
    }),
    buildFAQSchema(faq),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolsjewelry"
        path="/toolsjewelry/metal-pricing"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[340px]">
          <HeroObraz
            nazwa="hero-toolsjewelry"
            alt={L.heroTitle}
            className="absolute inset-0 w-full h-full object-cover"
            width={1024}
            height={572}
            sizes="100vw"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center flex flex-col items-center">
            <div className="text-amber-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{L.heroTag}</div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-semibold text-white mb-5 leading-[1.02] tracking-tight drop-shadow-2xl">{L.heroTitle}</h1>
            <p className="text-neutral-200 text-base max-w-xl leading-relaxed">{L.heroDesc}</p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadJewelry, href: "/jewelry/" },
              { label: L.breadTools, href: "/toolsjewelry/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        {/* Kalkulator od razu, przed dluzszymi wyjasnieniami. Czytelnik przyszedl
            po liczbe, a nie po lekture o rynku kruszcow. */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <MetalPricingCalc />
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Skad cena */}
        <section className="py-6 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        {/* Krok po kroku */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={howtoRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-5">{L.howtoTitle}</h2>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4 p-5 rounded-2xl glass">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-white font-medium text-sm mb-1">{s.title}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Proba a karaty */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={karatRef} className="reveal">
              <h2 className="text-xl font-semibold text-white mb-3">{L.karatTitle}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">{L.karatText}</p>
              <div className="rounded-2xl glass p-5 overflow-x-auto">
                <table className="w-full text-sm min-w-[440px]">
                  <thead>
                    <tr className="text-neutral-500 text-xs uppercase tracking-wider">
                      {L.karatHead.map((h, i) => (
                        <th key={h} className={`font-medium pb-2 ${i === 0 ? "text-left" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {karats.map((row) => (
                      <tr key={row[0]} className="border-t border-neutral-800 text-neutral-300">
                        <td className="py-2 font-mono text-amber-300">{row[0]}</td>
                        <td className="py-2 font-mono">{row[1]}</td>
                        <td className="py-2 font-mono">{row[2]}</td>
                        <td className="py-2 text-neutral-400">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Dlaczego skup placi mniej */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={whyRef} className="reveal p-6 rounded-2xl glass">
              <h2 className="text-xl font-semibold text-white mb-3">{L.whyTitle}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-3">{L.whyText}</p>
              <p className="text-neutral-400 text-sm leading-relaxed">{L.whyText2}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* FAQ */}
        <section className="py-8 px-4 bg-neutral-950">
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

        {/* Powiazane narzedzia */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={toolsRef} className="reveal">
              <ToolLinks tools={relatedTools} variant="content" accent="amber" />
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
            <Link
              to="/contact/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.footerCtaBtn}
            </Link>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
