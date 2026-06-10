import { Link } from "react-router-dom";
import { Package, Truck, Globe, Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { useMarketRates } from "../hooks/useMarketRates.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";

// All shipping costs are stored in PLN (base). For en/de the EUR amount is
// computed live from the NBP rate (pln_per_eur) via useMarketRates — never
// hardcoded — so quoted prices track the real exchange rate.
const DOMESTIC_FROM_PLN = { courier: 30, locker: 17 };
const FREE_SHIP = { pln: 400, eur: 100 }; // round policy threshold per locale
const EU_FROM_PLN = 50;
const UK_TIERS_PLN = [
  { kg: "5", min: 70, max: 120 },
  { kg: "10", min: 110, max: 150 },
  { kg: "20-30", min: 150, max: 270 },
];
const USA_TIERS_PLN = [
  { kg: "1", min: 140, max: 190 },
  { kg: "10", min: 330, max: 400 },
];

const LABELS = {
  pl: {
    tag: "Wysyłka",
    title: "Wysyłka i dostawa",
    description: "Informacje o wysyłce, kosztach i czasie realizacji.",
    domestic: "Polska",
    from: "od",
    courierLabel: "Kurier InPost",
    lockerLabel: "Paczkomat InPost",
    pickupLabel: "Odbiór osobisty (Józefosław)",
    freeLabel: "bezpłatnie",
    freeShipping: `DARMOWA WYSYŁKA w Polsce przy zamówieniu od ${FREE_SHIP.pln} zł`,
    europe: "Europa (UE)",
    euPrefix: "Wysyłka do krajów UE. InPost tam, gdzie dostępny, w pozostałych krajach DHL. Koszt od",
    euSuffix: "dostawa 5–10 dni roboczych.",
    uk: "Wielka Brytania",
    ukDesc: "Kurier ekspresowy (DHL, UPS, FedEx), zwykle 3–5 dni roboczych. Od czasu Brexitu każda przesyłka podlega odprawie celnej.",
    world: "USA, Azja i reszta świata",
    worldDesc: "DHL Express na cały świat, w tym USA i Azja. Przesyłki lotnicze docierają zwykle w 2–5 dni roboczych.",
    timesTitle: "Czas realizacji",
    times: [
      { label: "Biżuteria (materiały na stanie)", value: "do 7 dni roboczych" },
      { label: "Biżuteria (zamawianie materiałów)", value: "10–14 dni roboczych" },
      { label: "Studio (materiały na stanie)", value: "3–5 dni roboczych" },
      { label: "Studio (zamawianie materiałów)", value: "6–12 dni roboczych" },
    ],
    timesNote: "Powyższe wartości są orientacyjne — podstawowy czas realizacji ustalamy indywidualnie dla każdego projektu.",
    ratesTitle: "Koszty międzynarodowe",
    ratesIntro: "Koszt przewoźnika zależy od wagi i wymiarów przesyłki. Poniżej kwoty orientacyjne, które warto wziąć pod uwagę.",
    upTo: "do",
    ukRatesTitle: "Wielka Brytania",
    usaRatesTitle: "USA",
    calcNote: "Dokładny koszt potwierdzamy indywidualnie przed wysyłką.",
    customsTitle: "Cło poza Unią Europejską",
    customsDesc: "Przesyłki poza UE (w tym Wielka Brytania, USA, Azja) mogą podlegać cłu i podatkom importowym naliczanym przez kraj odbiorcy. Koszty te ponosi odbiorca i nie są wliczone w cenę wysyłki.",
    faqTitle: "Najczęstsze pytania o wysyłkę",
    faq: [
      { q: "Ile kosztuje wysyłka w Polsce?", a: (f) => `W Polsce: kurier InPost od ${f.courier}, paczkomat InPost od ${f.locker}, a odbiór osobisty w Józefosławiu jest bezpłatny. Przy zamówieniu od ${f.free} wysyłka w Polsce jest darmowa.` },
      { q: "Czy wysyłacie do krajów Unii Europejskiej?", a: (f) => `Tak. Wysyłka do UE od ${f.eu}, dostawa zwykle 5–10 dni roboczych. Korzystamy z InPost tam, gdzie jest dostępny, a w pozostałych krajach z DHL.` },
      { q: "Ile kosztuje wysyłka do Wielkiej Brytanii?", a: (f) => `Kurierem ekspresowym (DHL, UPS, FedEx) zwykle 3–5 dni roboczych. Koszt zależy od wagi: do 5 kg ${f.uk5}, do 10 kg ${f.uk10}, 20–30 kg ${f.uk2030}. Od czasu Brexitu przesyłki podlegają odprawie celnej.` },
      { q: "Ile kosztuje wysyłka do USA i innych krajów świata?", a: (f) => `DHL Express lotniczo na cały świat, w tym USA i Azja, zwykle 2–5 dni roboczych. Koszt: do 1 kg ${f.usa1}, do 10 kg ${f.usa10}.` },
      { q: "Czy muszę zapłacić cło?", a: () => `Przesyłki poza UE (m.in. Wielka Brytania, USA, Azja) mogą podlegać cłu i podatkom importowym naliczanym przez kraj odbiorcy. Koszty te ponosi odbiorca i nie są wliczone w cenę wysyłki.` },
      { q: "Jak długo trwa realizacja zamówienia?", a: () => `Biżuteria: do 7 dni roboczych przy materiałach na stanie, 10–14 dni przy zamawianiu materiałów. Studio (druk 3D, laser): 3–5 dni na stanie, 6–12 dni przy zamawianiu materiałów. Czas realizacji jest niezależny od czasu transportu i potwierdzamy go indywidualnie.` },
    ],
  },
  en: {
    tag: "Shipping",
    title: "Shipping & Delivery",
    description: "Shipping information, costs, and fulfillment times.",
    domestic: "Poland",
    from: "from",
    courierLabel: "InPost Courier",
    lockerLabel: "InPost Parcel Locker",
    pickupLabel: "Personal pickup (Józefosław)",
    freeLabel: "free",
    freeShipping: `FREE SHIPPING in Poland on orders over €${FREE_SHIP.eur}`,
    europe: "Europe (EU)",
    euPrefix: "Shipping to EU countries. InPost where available, otherwise DHL. From",
    euSuffix: "delivery in 5–10 business days.",
    uk: "United Kingdom",
    ukDesc: "Express courier (DHL, UPS, FedEx), typically 3–5 business days. Since Brexit, every parcel clears customs.",
    world: "USA, Asia & rest of world",
    worldDesc: "DHL Express worldwide, including the USA and Asia. Air shipments typically arrive in 2–5 business days.",
    timesTitle: "Fulfillment Times",
    times: [
      { label: "Jewelry (materials in stock)", value: "up to 7 business days" },
      { label: "Jewelry (ordering materials)", value: "10–14 business days" },
      { label: "Studio (materials in stock)", value: "3–5 business days" },
      { label: "Studio (ordering materials)", value: "6–12 business days" },
    ],
    timesNote: "The values above are indicative — the base lead time is agreed individually for each project.",
    ratesTitle: "International Costs",
    ratesIntro: "Carrier cost depends on parcel weight and dimensions. Indicative amounts to budget for are shown below.",
    upTo: "up to",
    ukRatesTitle: "United Kingdom",
    usaRatesTitle: "USA",
    calcNote: "We confirm the exact cost individually before shipping.",
    customsTitle: "Customs outside the EU",
    customsDesc: "Shipments outside the EU (including the UK, USA, Asia) may be subject to customs duties and import taxes charged by the destination country. These are paid by the recipient and are not included in the shipping price.",
    faqTitle: "Shipping — frequently asked questions",
    faq: [
      { q: "How much does shipping cost within Poland?", a: (f) => `Within Poland: InPost courier from ${f.courier}, InPost parcel locker from ${f.locker}, and personal pickup in Józefosław is free. Orders over ${f.free} ship free within Poland.` },
      { q: "Do you ship to EU countries?", a: (f) => `Yes. Shipping to the EU from ${f.eu}, usually 5–10 business days. We use InPost where available, otherwise DHL.` },
      { q: "How much does shipping to the United Kingdom cost?", a: (f) => `By express courier (DHL, UPS, FedEx), typically 3–5 business days. Cost depends on weight: up to 5 kg ${f.uk5}, up to 10 kg ${f.uk10}, 20–30 kg ${f.uk2030}. Since Brexit, parcels clear customs.` },
      { q: "How much does shipping to the USA and the rest of the world cost?", a: (f) => `DHL Express by air worldwide, including the USA and Asia, typically 2–5 business days. Cost: up to 1 kg ${f.usa1}, up to 10 kg ${f.usa10}.` },
      { q: "Will I have to pay customs duty?", a: () => `Shipments outside the EU (including the UK, USA, Asia) may be subject to customs duties and import taxes charged by the destination country. These are paid by the recipient and are not included in the shipping price.` },
      { q: "How long does an order take to make?", a: () => `Jewelry: up to 7 business days when materials are in stock, 10–14 days if materials must be ordered. Studio (3D printing, laser): 3–5 days in stock, 6–12 days if materials must be ordered. Fulfillment time is separate from shipping transit time and is confirmed individually.` },
    ],
  },
  de: {
    tag: "Versand",
    title: "Versand & Lieferung",
    description: "Versandinformationen, Kosten und Bearbeitungszeiten.",
    domestic: "Polen",
    from: "ab",
    courierLabel: "InPost Kurier",
    lockerLabel: "InPost Paketautomat",
    pickupLabel: "Persönliche Abholung (Józefosław)",
    freeLabel: "kostenlos",
    freeShipping: `KOSTENLOSER VERSAND in Polen ab €${FREE_SHIP.eur} Bestellwert`,
    europe: "Europa (EU)",
    euPrefix: "Versand in EU-Länder. InPost wo verfügbar, sonst DHL. Ab",
    euSuffix: "Lieferung in 5–10 Werktagen.",
    uk: "Großbritannien",
    ukDesc: "Express-Kurier (DHL, UPS, FedEx), in der Regel 3–5 Werktage. Seit dem Brexit ist für jedes Paket eine Zollabfertigung erforderlich.",
    world: "USA, Asien & restliche Welt",
    worldDesc: "DHL Express weltweit, inkl. USA und Asien. Luftsendungen treffen in der Regel in 2–5 Werktagen ein.",
    timesTitle: "Bearbeitungszeiten",
    times: [
      { label: "Schmuck (Material auf Lager)", value: "bis zu 7 Werktage" },
      { label: "Schmuck (Materialbestellung)", value: "10–14 Werktage" },
      { label: "Studio (Material auf Lager)", value: "3–5 Werktage" },
      { label: "Studio (Materialbestellung)", value: "6–12 Werktage" },
    ],
    timesNote: "Die obigen Werte sind Richtwerte — die grundlegende Bearbeitungszeit wird für jedes Projekt individuell vereinbart.",
    ratesTitle: "Internationale Kosten",
    ratesIntro: "Die Kosten des Spediteurs hängen von Gewicht und Maßen ab. Nachfolgend Richtwerte zur Orientierung.",
    upTo: "bis",
    ukRatesTitle: "Großbritannien",
    usaRatesTitle: "USA",
    calcNote: "Die genauen Kosten bestätigen wir vor dem Versand individuell.",
    customsTitle: "Zoll außerhalb der EU",
    customsDesc: "Sendungen außerhalb der EU (inkl. Großbritannien, USA, Asien) können Zöllen und Einfuhrsteuern unterliegen, die vom Bestimmungsland erhoben werden. Diese trägt der Empfänger und sind nicht im Versandpreis enthalten.",
    faqTitle: "Häufige Fragen zum Versand",
    faq: [
      { q: "Wie viel kostet der Versand innerhalb Polens?", a: (f) => `Innerhalb Polens: InPost Kurier ab ${f.courier}, InPost Paketautomat ab ${f.locker}, persönliche Abholung in Józefosław kostenlos. Bestellungen ab ${f.free} werden innerhalb Polens kostenlos versandt.` },
      { q: "Versenden Sie in EU-Länder?", a: (f) => `Ja. Versand in die EU ab ${f.eu}, in der Regel 5–10 Werktage. Wir nutzen InPost, wo verfügbar, sonst DHL.` },
      { q: "Wie viel kostet der Versand nach Großbritannien?", a: (f) => `Per Express-Kurier (DHL, UPS, FedEx), in der Regel 3–5 Werktage. Die Kosten richten sich nach dem Gewicht: bis 5 kg ${f.uk5}, bis 10 kg ${f.uk10}, 20–30 kg ${f.uk2030}. Seit dem Brexit werden Pakete verzollt.` },
      { q: "Wie viel kostet der Versand in die USA und den Rest der Welt?", a: (f) => `DHL Express per Luftfracht weltweit, inkl. USA und Asien, in der Regel 2–5 Werktage. Kosten: bis 1 kg ${f.usa1}, bis 10 kg ${f.usa10}.` },
      { q: "Muss ich Zoll bezahlen?", a: () => `Sendungen außerhalb der EU (inkl. Großbritannien, USA, Asien) können Zöllen und Einfuhrsteuern unterliegen, die vom Bestimmungsland erhoben werden. Diese trägt der Empfänger und sind nicht im Versandpreis enthalten.` },
      { q: "Wie lange dauert die Anfertigung einer Bestellung?", a: () => `Schmuck: bis zu 7 Werktage bei Material auf Lager, 10–14 Tage bei Materialbestellung. Studio (3D-Druck, Laser): 3–5 Tage auf Lager, 6–12 Tage bei Materialbestellung. Die Bearbeitungszeit ist unabhängig von der Transportzeit und wird individuell bestätigt.` },
    ],
  },
};

export default function Shipping() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const { rates } = useMarketRates();
  const headerRef = useScrollReveal();
  const domesticRef = useScrollReveal();
  const internationalRef = useScrollReveal();
  const ratesRef = useScrollReveal();
  const timesRef = useScrollReveal();

  const showEur = lang === "en" || lang === "de";
  const rate = rates.pln_per_eur || 4.25;
  const fmtFrom = (pln) => (showEur ? `€${Math.round(pln / rate)}` : `${pln} zł`);
  const fmtRange = (min, max) =>
    showEur
      ? `€${Math.round(min / rate)}–${Math.round(max / rate)}`
      : `${min}–${max} zł`;
  const tierLabel = (kg) =>
    kg.includes("-") ? `${kg.replace("-", "–")} kg` : `${l.upTo} ${kg} kg`;

  const domesticItems = [
    { label: l.courierLabel, price: `${l.from} ${fmtFrom(DOMESTIC_FROM_PLN.courier)}` },
    { label: l.lockerLabel, price: `${l.from} ${fmtFrom(DOMESTIC_FROM_PLN.locker)}` },
    { label: l.pickupLabel, price: l.freeLabel },
  ];

  // Shared formatted values — used by BOTH the visible FAQ section and the
  // FAQPage JSON-LD, so the structured data always matches what users see.
  const freeDisp = showEur ? `€${FREE_SHIP.eur}` : `${FREE_SHIP.pln} zł`;
  const faqValues = {
    courier: fmtFrom(DOMESTIC_FROM_PLN.courier),
    locker: fmtFrom(DOMESTIC_FROM_PLN.locker),
    free: freeDisp,
    eu: fmtFrom(EU_FROM_PLN),
    uk5: fmtRange(UK_TIERS_PLN[0].min, UK_TIERS_PLN[0].max),
    uk10: fmtRange(UK_TIERS_PLN[1].min, UK_TIERS_PLN[1].max),
    uk2030: fmtRange(UK_TIERS_PLN[2].min, UK_TIERS_PLN[2].max),
    usa1: fmtRange(USA_TIERS_PLN[0].min, USA_TIERS_PLN[0].max),
    usa10: fmtRange(USA_TIERS_PLN[1].min, USA_TIERS_PLN[1].max),
  };
  const faqItems = l.faq.map(({ q, a }) => ({ q, a: a(faqValues) }));

  const pageUrl = `${SITE.url}/shipping/`;
  const schemas = [
    buildWebPageSchema({
      title: `${l.tag}, ${SITE.name}`,
      description: l.description,
      url: pageUrl,
      lang,
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.tag, url: pageUrl },
    ]),
    buildFAQSchema(faqItems),
  ];

  return (
    <>
      <SEOHead
        pageKey="shipping"
        path="/shipping"
        schemas={schemas}
      />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb
              items={[{ href: "/", label: "Home" }, { label: l.tag }]}
            />

            {/* Hero */}
            <div ref={headerRef} className="reveal text-center mb-14">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">
                {l.tag}
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {l.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                {l.description}
              </p>
            </div>

            {/* Domestic shipping */}
            <div
              ref={domesticRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.domestic}</h2>
              </div>
              <div className="divide-y divide-neutral-800">
                {domesticItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm text-neutral-300">{item.label}</span>
                    <span className="text-sm text-amber-400 font-medium">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Free shipping banner */}
            <div className="reveal bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-6 py-4 mb-5 text-center">
              <span className="text-emerald-400 font-semibold text-sm tracking-wide">
                {l.freeShipping}
              </span>
            </div>

            {/* International, 3 cols */}
            <div ref={internationalRef} className="reveal grid md:grid-cols-3 gap-5 mb-5">
              {/* Europe EU */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 hover:border-amber-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                  <h2 className="text-white font-semibold">{l.europe}</h2>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {l.euPrefix} {fmtFrom(EU_FROM_PLN)}, {l.euSuffix}
                </p>
              </div>

              {/* UK */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 hover:border-amber-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                  <h2 className="text-white font-semibold">{l.uk}</h2>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">{l.ukDesc}</p>
              </div>

              {/* World */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 hover:border-amber-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-amber-400 shrink-0" />
                  <h2 className="text-white font-semibold">{l.world}</h2>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">{l.worldDesc}</p>
              </div>
            </div>

            {/* International indicative rates */}
            <div
              ref={ratesRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.ratesTitle}</h2>
              </div>
              <p className="text-neutral-400 text-sm mb-5">{l.ratesIntro}</p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {/* UK tiers */}
                <div>
                  <h3 className="text-neutral-200 text-sm font-medium mb-2">{l.ukRatesTitle}</h3>
                  <div className="divide-y divide-neutral-800">
                    {UK_TIERS_PLN.map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-sm text-neutral-300">{tierLabel(row.kg)}</span>
                        <span className="text-sm text-amber-400 font-medium">{fmtRange(row.min, row.max)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* USA tiers */}
                <div>
                  <h3 className="text-neutral-200 text-sm font-medium mb-2">{l.usaRatesTitle}</h3>
                  <div className="divide-y divide-neutral-800">
                    {USA_TIERS_PLN.map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-sm text-neutral-300">{tierLabel(row.kg)}</span>
                        <span className="text-sm text-amber-400 font-medium">{fmtRange(row.min, row.max)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-neutral-500 text-xs mt-5">{l.calcNote}</p>
            </div>

            {/* Customs notice (non-EU) */}
            <div className="reveal bg-amber-500/10 border border-amber-500/30 rounded-xl px-6 py-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-amber-300 font-semibold text-sm mb-1">{l.customsTitle}</h2>
                  <p className="text-neutral-300 text-sm leading-relaxed">{l.customsDesc}</p>
                </div>
              </div>
            </div>

            {/* Fulfillment times */}
            <div
              ref={timesRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.timesTitle}</h2>
              </div>
              <div className="divide-y divide-neutral-800">
                {l.times.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm text-neutral-300">{row.label}</span>
                    <span className="text-sm text-neutral-400">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-neutral-500 text-xs mt-4">{l.timesNote}</p>
            </div>

            {/* FAQ — visible Q&A mirrors the FAQPage JSON-LD (parity = SEO-safe) */}
            <div className="reveal mt-5">
              <h2 className="text-white font-semibold text-lg mb-4">{l.faqTitle}</h2>
              <div className="space-y-3">
                {faqItems.map((item, i) => (
                  <details
                    key={i}
                    className="group bg-neutral-900/60 border border-neutral-800 rounded-xl px-6 py-4 [&_summary]:cursor-pointer"
                  >
                    <summary className="flex items-center justify-between text-sm font-medium text-neutral-200 list-none">
                      <span>{item.q}</span>
                      <span className="text-amber-400 ml-4 shrink-0 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-3">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
