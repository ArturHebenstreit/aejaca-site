import { Link } from "react-router-dom";
import { Package, Truck, Globe, Clock } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";

const LABELS = {
  pl: {
    tag: "Wysyłka",
    title: "Wysyłka i dostawa",
    description: "Informacje o wysyłce, kosztach i czasie realizacji.",
    domestic: "Polska",
    domesticItems: [
      { label: "Kurier InPost", price: "od 12 zł" },
      { label: "Paczkomat InPost", price: "od 12 zł" },
      { label: "Odbiór osobisty (Józefosław)", price: "bezpłatnie" },
    ],
    freeShipping: "DARMOWA WYSYŁKA przy zamówieniu od 400 zł",
    europe: "Europa (UE + UK)",
    europeDesc:
      "Wysyłka do wszystkich krajów europejskich. Koszt od 25 zł, czas dostawy 5–10 dni roboczych.",
    world: "USA i inne kraje",
    worldDesc:
      "Wysyłka możliwa po indywidualnym ustaleniu — napisz na contact@aejaca.com",
    timesTitle: "Czas realizacji",
    times: [
      { label: "Biżuteria (materiały na stanie)", value: "do 7 dni roboczych" },
      { label: "Biżuteria (zamawianie materiałów)", value: "10–14 dni roboczych" },
      { label: "Studio (materiały na stanie)", value: "3–5 dni roboczych" },
      { label: "Studio (zamawianie materiałów)", value: "6–12 dni roboczych" },
    ],
  },
  en: {
    tag: "Shipping",
    title: "Shipping & Delivery",
    description: "Shipping information, costs, and fulfillment times.",
    domestic: "Poland",
    domesticItems: [
      { label: "InPost Courier", price: "from 12 PLN" },
      { label: "InPost Parcel Locker", price: "from 12 PLN" },
      { label: "Personal pickup (Józefosław)", price: "free" },
    ],
    freeShipping: "FREE SHIPPING on orders over 400 PLN",
    europe: "Europe (EU + UK)",
    europeDesc:
      "Shipping to all European countries. From 25 PLN, delivery in 5–10 business days.",
    world: "USA & Other Countries",
    worldDesc:
      "International shipping available upon request — email contact@aejaca.com",
    timesTitle: "Fulfillment Times",
    times: [
      { label: "Jewelry (materials in stock)", value: "up to 7 business days" },
      { label: "Jewelry (ordering materials)", value: "10–14 business days" },
      { label: "Studio (materials in stock)", value: "3–5 business days" },
      { label: "Studio (ordering materials)", value: "6–12 business days" },
    ],
  },
  de: {
    tag: "Versand",
    title: "Versand & Lieferung",
    description: "Versandinformationen, Kosten und Bearbeitungszeiten.",
    domestic: "Polen",
    domesticItems: [
      { label: "InPost Kurier", price: "ab 12 PLN" },
      { label: "InPost Paketautomat", price: "ab 12 PLN" },
      { label: "Persönliche Abholung (Józefosław)", price: "kostenlos" },
    ],
    freeShipping: "KOSTENLOSER VERSAND ab 400 PLN Bestellwert",
    europe: "Europa (EU + UK)",
    europeDesc:
      "Versand in alle europäischen Länder. Ab 25 PLN, Lieferzeit 5–10 Werktage.",
    world: "USA & andere Länder",
    worldDesc:
      "Internationaler Versand auf Anfrage — E-Mail an contact@aejaca.com",
    timesTitle: "Bearbeitungszeiten",
    times: [
      { label: "Schmuck (Material auf Lager)", value: "bis zu 7 Werktage" },
      { label: "Schmuck (Materialbestellung)", value: "10–14 Werktage" },
      { label: "Studio (Material auf Lager)", value: "3–5 Werktage" },
      { label: "Studio (Materialbestellung)", value: "6–12 Werktage" },
    ],
  },
};

export default function Shipping() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const headerRef = useScrollReveal();
  const domesticRef = useScrollReveal();
  const internationalRef = useScrollReveal();
  const timesRef = useScrollReveal();

  const pageUrl = `${SITE.url}/shipping`;
  const schemas = [
    buildWebPageSchema({
      title: `${l.tag} — ${SITE.name}`,
      description: l.description,
      url: pageUrl,
      lang,
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.tag, url: pageUrl },
    ]),
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
                {l.domesticItems.map((item, i) => (
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

            {/* International — 2 cols */}
            <div ref={internationalRef} className="reveal grid md:grid-cols-2 gap-5 mb-5">
              {/* Europe */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 hover:border-amber-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                  <h2 className="text-white font-semibold">{l.europe}</h2>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">{l.europeDesc}</p>
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
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
