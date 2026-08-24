// ============================================================
// KARTA USLUGI
// ============================================================
// Uklad celowo lustrzany wobec karty produktu: usluga jest dla klienta
// takim samym zakupem, tylko z innym czasem realizacji. Roznica jest
// jedna i istotna: przy usludze bez ceny automatycznej zamiast koszyka
// pokazujemy wysylke do wyceny wraz z powodem.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Clock, RotateCcw, MessageCircle, Wrench, Calculator } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import RelatedContent from "../components/RelatedContent.jsx";
import { buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { t } from "../pricing/config.js";
import { useMoney } from "../shop/money.js";
import { getServiceCard } from "../data/serviceCatalog.js";
import ServiceConfigurator from "../components/shop/ServiceConfigurator.jsx";
import { SHOP_CATEGORIES } from "../data/shopCatalog.js";
import NotFound from "./NotFound.jsx";

const UI = {
  pl: {
    shop: "Produkty i usługi",
    from: "Cena od",
    quotePrice: "Wycena indywidualna",
    order: "Konfiguruj i zamów",
    askQuote: "Wyślij do wyceny",
    openCalc: "Policz szacunkowo w kalkulatorze",
    advCalc: "Potrzebujesz więcej parametrów? Otwórz kalkulator zaawansowany",
    calcNote: "Kalkulator poda widełki. Kwota wiążąca przychodzi od nas po wycenie.",
    orderNote: "Konfiguracja i wycena poniżej, bez opuszczania tej strony.",
    quoteNote: "Odpowiadamy zwykle w ciągu 24 godzin.",
    leadTime: "Czas realizacji",
    days: "dni roboczych",
    howItWorks: "Jak to przebiega",
    about: "O usłudze",
    specs: "Specyfikacja",
    returns: "Prawo odstąpienia",
    returnsMade: "Usługa wykonywana według Twojej specyfikacji, prawo odstąpienia nie przysługuje po rozpoczęciu wykonania.",
    terms: "Regulamin",
    whyQuote: "Dlaczego bez ceny z góry",
    back: "Wróć do listy",
    madeToOrder: "Na zamówienie",
    currentPrice: "Cena tej konfiguracji",
    configureForPrice: "Skonfiguruj poniżej, aby poznać cenę",
  },
  en: {
    shop: "Products and services",
    from: "Price from",
    quotePrice: "Individual quote",
    order: "Configure and order",
    askQuote: "Request a quote",
    openCalc: "Estimate it in the calculator",
    advCalc: "Need more parameters? Open the advanced calculator",
    calcNote: "The calculator gives a range. The binding amount comes from us with the quote.",
    orderNote: "Configuration and pricing below, without leaving this page.",
    quoteNote: "We usually reply within 24 hours.",
    leadTime: "Lead time",
    days: "business days",
    howItWorks: "How it works",
    about: "About this service",
    specs: "Specification",
    returns: "Right of withdrawal",
    returnsMade: "A service performed to your specification, the right of withdrawal does not apply once work has begun.",
    terms: "Terms of Service",
    whyQuote: "Why there is no price upfront",
    back: "Back to the list",
    madeToOrder: "Made to order",
    currentPrice: "Price for this configuration",
    configureForPrice: "Configure below to see the price",
  },
  de: {
    shop: "Produkte und Leistungen",
    from: "Preis ab",
    quotePrice: "Individuelles Angebot",
    order: "Konfigurieren und bestellen",
    askQuote: "Angebot anfordern",
    openCalc: "Im Kalkulator schätzen",
    advCalc: "Mehr Parameter nötig? Erweiterten Kalkulator öffnen",
    calcNote: "Der Kalkulator nennt eine Spanne. Den verbindlichen Betrag erhalten Sie mit dem Angebot.",
    orderNote: "Konfiguration und Preis unten, ohne diese Seite zu verlassen.",
    quoteNote: "Wir antworten meist innerhalb von 24 Stunden.",
    leadTime: "Bearbeitungszeit",
    days: "Werktage",
    howItWorks: "So läuft es ab",
    about: "Über diese Leistung",
    specs: "Spezifikation",
    returns: "Widerrufsrecht",
    returnsMade: "Eine nach Ihren Vorgaben erbrachte Leistung, nach Arbeitsbeginn besteht kein Widerrufsrecht.",
    terms: "AGB",
    whyQuote: "Warum kein Preis im Voraus",
    back: "Zurück zur Liste",
    madeToOrder: "Auf Bestellung",
    currentPrice: "Preis dieser Konfiguration",
    configureForPrice: "Unten konfigurieren, um den Preis zu sehen",
  },
};


export default function Service() {
  const { lang } = useLanguage();
  const { money } = useMoney();
  const u = UI[lang] || UI.en;
  const { id } = useParams();
  const card = getServiceCard(id);
  const [configuredPrice, setConfiguredPrice] = useState(null);

  useEffect(() => setConfiguredPrice(null), [id]);

  if (!card) return <NotFound />;

  const category = SHOP_CATEGORIES.find((c) => c.id === card.category);
  const amber = category?.theme === "amber";
  const target = card.quoteOnly ? "/contact/" : `/order/?service=${card.service}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t(card.title, lang),
    description: t(card.lead, lang),
    image: `${SITE.url}${card.image}`,
    provider: { "@type": "Organization", name: "AEJaCA", url: SITE.url },
    areaServed: "PL",
    ...(card.priceFromGrosze
      ? {
          offers: {
            "@type": "Offer",
            price: (card.priceFromGrosze / 100).toFixed(2),
            priceCurrency: "PLN",
            url: `${SITE.url}/shop/service/${card.id}/`,
          },
        }
      : {}),
  };

  return (
    <>
      <SEOHead
        pageKey="service"
        path={`/shop/service/${card.id}`}
        title={`${t(card.title, lang)}, AEJaCA`}
        description={t(card.lead, lang)}
        image={card.image}
        schemas={[
          serviceSchema,
          buildBreadcrumbSchema([
            { name: "AEJaCA", url: `${SITE.url}/` },
            { name: u.shop, url: `${SITE.url}/shop/` },
            ...(category ? [{ name: t(category.title, lang), url: `${SITE.url}${category.path}` }] : []),
            { name: t(card.title, lang), url: `${SITE.url}/shop/service/${card.id}/` },
          ]),
        ]}
      />

      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              { label: u.shop, href: "/shop/" },
              ...(category ? [{ label: t(category.title, lang), href: category.path }] : []),
              { label: t(card.title, lang) },
            ]}
          />

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
              <img src={card.image} alt={t(card.title, lang)} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="mb-3">
                {card.quoteOnly ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-medium">
                    <MessageCircle className="w-3 h-3" />{u.quotePrice}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.03] text-neutral-400 text-[10px] font-medium">
                    <Wrench className="w-3 h-3" />{u.madeToOrder}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                {t(card.title, lang)}
              </h1>
              <p className="text-neutral-400 text-sm mb-5">{t(card.lead, lang)}</p>

              {card.priceFromGrosze ? (
                <div className="mb-2">
                  {configuredPrice ? (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{u.currentPrice}</div>
                      <div className="text-3xl font-extrabold text-white tabular-nums">{money(configuredPrice.lineGrosze)}</div>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-neutral-300">{u.configureForPrice}</div>
                  )}
                  <div className="mt-1 text-[11px] text-neutral-500">
                    {u.from} <span className="font-medium text-neutral-400">{money(card.priceFromGrosze)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold text-amber-300 mb-1">{u.quotePrice}</div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-6">
                <Clock className="w-3.5 h-3.5" />
                {u.leadTime}: {card.leadTimeDays} {u.days}
              </div>

              {card.quoteOnly ? (
                <>
                  <Link
                    to={target}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm
                               border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {u.askQuote}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-neutral-600 text-[11px] text-center mt-2 mb-3">{u.quoteNote}</p>
                  {/* Klient, ktory szuka rzedu wielkosci, nie chce czekac
                      dobe na maila. Kalkulator odpowie od razu, a wycena
                      i tak zostaje jedynym zrodlem kwoty wiazacej. */}
                  {card.calcHref && (
                    <>
                      <Link
                        to={card.calcHref}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm
                                   border border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/25 hover:text-white transition-colors"
                      >
                        <Calculator className="w-4 h-4" />
                        {u.openCalc}
                      </Link>
                      <p className="text-neutral-600 text-[11px] text-center mt-2 mb-7">{u.calcNote}</p>
                    </>
                  )}
                </>
              ) : (
                // Konfiguracja odbywa sie nizej, na tej samej stronie. Kotwica
                // zamiast przejscia, zeby nie wyrzucac klienta poza karte uslugi.
                <>
                  <a
                    href="#konfigurator"
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                      amber ? "bg-amber-500 hover:bg-amber-400 text-neutral-900" : "bg-blue-500 hover:bg-blue-400 text-white"
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    {u.order}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <p className="text-neutral-600 text-[11px] text-center mt-2 mb-7">{u.orderNote}</p>
                </>
              )}

              {card.why && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4 mb-5">
                  <div className="text-amber-300 text-xs font-medium mb-1">{u.whyQuote}</div>
                  <p className="text-neutral-400 text-xs leading-relaxed">{t(card.why, lang)}</p>
                </div>
              )}

              <div className="flex gap-3 text-xs">
                <RotateCcw className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-300 font-medium mb-0.5">{u.returns}</div>
                  <p className="text-neutral-500 leading-relaxed">
                    {u.returnsMade}{" "}
                    <Link to="/terms/#sec-10" className="text-neutral-400 hover:text-white underline underline-offset-2">
                      {u.terms}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Opis i specyfikacja, uklad jak przy produkcie */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mt-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{u.about}</h2>
              {t(card.description, lang).split("\n\n").map((para, i) => (
                <p key={i} className="text-neutral-300 text-sm leading-relaxed mb-3">{para}</p>
              ))}
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{u.specs}</h2>
              <dl className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
                {card.specs.map((s, i) => (
                  <div key={i} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-neutral-500 flex-shrink-0">{t(s.label, lang)}</dt>
                    <dd className="text-neutral-200 text-right">{t(s.value, lang)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Przebieg przed konfiguratorem: klient najpierw ma zrozumiec,
              co sie wydarzy, a dopiero potem podawac parametry. */}
          <div className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">{u.howItWorks}</h2>
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {card.process.map((step, i) => (
                <li key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mb-2.5 ${
                      amber ? "bg-amber-400/10 text-amber-300" : "bg-blue-400/10 text-blue-300"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="text-white text-sm font-medium mb-1">{t(step.title, lang)}</div>
                  <p className="text-neutral-400 text-xs leading-relaxed">{t(step.body, lang)}</p>
                </li>
              ))}
            </ol>
          </div>
          {/* Konfigurator, tylko dla uslug z cena automatyczna */}
          {!card.quoteOnly && (
            <div id="konfigurator" className="mt-12 scroll-mt-24">
              <ServiceConfigurator
                card={card}
                lang={lang}
                accent={amber ? "amber" : "blue"}
                onPriceChange={setConfiguredPrice}
              />
              {/* Konfigurator pokazuje wybor typowy. Kto potrzebuje pelnej
                  kontroli, idzie do kalkulatora, ktory liczy tym samym kodem. */}
              {card.calcHref && (
                <Link
                  to={card.calcHref}
                  className="mt-3 flex items-center justify-center gap-2 py-2.5 text-neutral-500 hover:text-neutral-200 text-xs transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {u.advCalc}
                </Link>
              )}
            </div>
          )}


          <Link
            to={category ? category.path : "/shop/"}
            className="inline-flex items-center gap-2 mt-12 text-neutral-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />{u.back}
          </Link>
        </div>

        {/* Wiedza z tej dziedziny. Szesnascie stron sklepu mialo 499 linkow
            przychodzacych i nie oddawalo z nich nic do bloga ani slownika,
            ktore dostawaly odpowiednio 5,6 i 8,7 linku na strone. */}
        <RelatedContent category={card.category} />
      </div>
    </>
  );
}
