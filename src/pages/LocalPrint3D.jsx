import { Link } from "../i18n/nav.jsx";
import { FileUp, Printer, Truck, MapPin, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import {
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildFAQSchema,
} from "../seo/schemas.js";
import { getSEO, adresStrony } from "../seo/seoData.js";
import { LOCAL_PAGES, LOCAL_MACHINES } from "../data/localPages.js";

const UI = {
  pl: {
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    machinesTitle: "Na czym drukujemy",
    materialsLabel: "Materiały",
    pricingTitle: "Ile to kosztuje",
    pricingText: "Cenę liczymy z objętości modelu, czasu druku, zużycia materiału i obróbki. Minimalna wartość zlecenia to 49 zł, a drukujemy od jednej sztuki. Wycena z pliku STL jest bezpłatna i nie zobowiązuje.",
    ctaCalc: "Wyceń z pliku STL",
    ctaContact: "Napisz do nas",
    faqTitle: "Najczęstsze pytania",
    footerTitle: "Masz plik albo tylko pomysł?",
    footerText: "Wgraj model do kalkulatora i zobacz cenę od razu. Jeśli nie masz pliku, opisz czego potrzebujesz, a odezwiemy się z propozycją.",
  },
  en: {
    breadHome: "Home",
    breadStudio: "sTuDiO",
    machinesTitle: "What we print on",
    materialsLabel: "Materials",
    pricingTitle: "What it costs",
    pricingText: "Price is calculated from model volume, print time, material use and finishing. Minimum order value is 49 PLN and we print from a single piece. Quoting from an STL file is free and carries no obligation.",
    ctaCalc: "Get a quote from your STL",
    ctaContact: "Get in touch",
    faqTitle: "Frequently asked questions",
    footerTitle: "Got a file, or just an idea?",
    footerText: "Upload a model to the calculator and see the price straight away. With no file, describe what you need and we will come back with a proposal.",
  },
  de: {
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    machinesTitle: "Worauf wir drucken",
    materialsLabel: "Materialien",
    pricingTitle: "Was es kostet",
    pricingText: "Der Preis ergibt sich aus Modellvolumen, Druckzeit, Materialverbrauch und Nachbearbeitung. Der Mindestbestellwert liegt bei 49 PLN, gedruckt wird ab einem Stück. Das Angebot aus einer STL-Datei ist kostenlos und unverbindlich.",
    ctaCalc: "Angebot aus STL-Datei",
    ctaContact: "Kontakt aufnehmen",
    faqTitle: "Häufige Fragen",
    footerTitle: "Datei vorhanden oder nur eine Idee?",
    footerText: "Laden Sie ein Modell in den Kalkulator und sehen Sie den Preis sofort. Ohne Datei beschreiben Sie einfach, was Sie brauchen.",
  },
};

/** Resolve a value that may be a plain string or a { pl, en, de } object. */
function tx(value, lang) {
  if (!value) return "";
  return typeof value === "string" ? value : value[lang] || value.en || value.pl;
}

export default function LocalPrint3D({ city }) {
  const { lang } = useLanguage();
  const page = LOCAL_PAGES[city];
  const c = page[lang] || page.en;
  const L = UI[lang] || UI.en;
  const seo = getSEO(page.seoKey, lang);

  const introRef = useScrollReveal();
  const whoRef = useScrollReveal();
  const machinesRef = useScrollReveal();

  const pageUrl = adresStrony(page.path, lang);

  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: adresStrony("/", lang) },
      { name: L.breadStudio, url: adresStrony("/studio/", lang) },
      { name: c.h1, url: pageUrl },
    ]),
    buildServiceSchema({
      name: c.h1,
      description: seo.description,
      serviceType: "3D printing service",
      url: pageUrl,
      offers: { price: "25", minPrice: "12", maxPrice: "2000", currency: "EUR" },
    }),
    buildFAQSchema(c.faq.map(({ q, a }) => ({ q, a }))),
  ];

  return (
    <>
      <SEOHead pageKey={page.seoKey} path={page.path} schemas={schemas} />

      <div className="bg-neutral-950 text-neutral-200 pt-24 pb-20 px-5">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadStudio, href: "/studio/" },
              { label: c.h1 },
            ]}
          />

          {/* Hero */}
          <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            <MapPin className="w-3.5 h-3.5" />
            {page.city}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            {c.h1}
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed mb-10">{c.lead}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Link
              to="/studio/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors"
            >
              <FileUp className="w-4 h-4" />
              {L.ctaCalc}
            </Link>
            <Link
              to="/contact/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-semibold transition-colors"
            >
              {L.ctaContact}
            </Link>
          </div>

          {/* Intro */}
          <section ref={introRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-4">{c.introTitle}</h2>
            <p className="text-neutral-400 leading-relaxed">{c.intro}</p>
          </section>

          {/* Who */}
          <section ref={whoRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-5">{c.whoTitle}</h2>
            <ul className="space-y-3">
              {c.who.map((item) => (
                <li key={item} className="flex gap-3 text-neutral-400 leading-relaxed">
                  <Check className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Machines */}
          <section ref={machinesRef} className="reveal mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-5">{L.machinesTitle}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {LOCAL_MACHINES.map((m) => (
                <div key={m.name} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span className="text-xs uppercase tracking-wider text-neutral-500">{m.tech}</span>
                  </div>
                  <div className="text-white font-semibold mb-1">{m.name}</div>
                  <div className="text-sm text-neutral-400 mb-3">{tx(m.specs, lang)}</div>
                  <div className="text-xs text-neutral-500">
                    {L.materialsLabel}: {tx(m.materials, lang)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery / pickup */}
          <section className="mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              {c.pickupTitle}
            </h2>
            <p className="text-neutral-400 leading-relaxed">{c.pickup}</p>
          </section>

          {/* Pricing */}
          <section className="mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-4">{L.pricingTitle}</h2>
            <p className="text-neutral-400 leading-relaxed">{L.pricingText}</p>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="font-serif text-2xl font-semibold text-white mb-6">{L.faqTitle}</h2>
            <div className="space-y-5">
              {c.faq.map(({ q, a }) => (
                <div key={q} className="border-b border-neutral-800 pb-5">
                  <h3 className="text-white font-semibold mb-2">{q}</h3>
                  <p className="text-neutral-400 leading-relaxed text-sm">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer CTA */}
          <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-7 text-center">
            <h2 className="font-serif text-2xl font-semibold text-white mb-3">{L.footerTitle}</h2>
            <p className="text-neutral-400 leading-relaxed mb-6">{L.footerText}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/studio/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors"
              >
                <FileUp className="w-4 h-4" />
                {L.ctaCalc}
              </Link>
              <Link
                to="/contact/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-semibold transition-colors"
              >
                {L.ctaContact}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
