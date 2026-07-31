// ============================================================
// SKLEP: hub oraz listy kategorii
// ============================================================
// Jedna strona obsluguje /shop/, /shop/jewelry/ i /shop/studio/.
// Produkty gotowe i uslugi lezą obok siebie, bo z perspektywy klienta
// to ta sama decyzja zakupowa, tylko z innym czasem realizacji.

import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Package, Download, Wrench, MessageCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { t } from "../pricing/config.js";
import {
  SHOP_CATEGORIES, productsByCategory, serviceCardsByCategory, PRODUCTS,
} from "../data/shopCatalog.js";

const UI = {
  pl: {
    title: "Produkty i usługi",
    lead: "Kup gotowe wyroby albo zamów usługę z wyceną w kilka minut. Płatność BLIK-iem lub szybkim przelewem.",
    products: "Produkty gotowe",
    productsLead: "Leżą u nas na półce albo czekają jako plik do pobrania. Płacisz i wysyłamy, bez konfigurowania.",
    services: "Usługi",
    servicesLead: "Konfigurujesz na karcie usługi, cena wiążąca pojawia się od razu, a przedmiot powstaje pod Twoje zamówienie.",
    inStock: "Dostępny",
    lastOne: "Ostatnia sztuka",
    outOfStock: "Chwilowo niedostępny",
    digital: "Plik do pobrania",
    madeToOrder: "Na zamówienie",
    from: "od",
    order: "Zamawiam",
    askQuote: "Wyślij do wyceny",
    details: "Szczegóły",
    ready: "Wysyłka w",
    days: "dni",
    immediate: "natychmiast po opłaceniu",
    quoteBadge: "Wycena indywidualna",
    quoteReply: "odpowiedź w 24 h",
    bothSections: "Wybierz dział",
  },
  en: {
    title: "Products and services",
    lead: "Buy ready-made pieces or order a service with a quote in minutes. Pay by BLIK or instant transfer.",
    products: "Ready-made products",
    productsLead: "On our shelf or ready as a download. You pay, we ship, nothing to configure.",
    services: "Services",
    servicesLead: "You configure it on the service card, the binding price appears at once, and the piece is made for your order.",
    inStock: "In stock",
    lastOne: "Last one",
    outOfStock: "Currently unavailable",
    digital: "Downloadable file",
    madeToOrder: "Made to order",
    from: "from",
    order: "Order",
    askQuote: "Request a quote",
    details: "Details",
    ready: "Ships in",
    days: "days",
    immediate: "immediately after payment",
    quoteBadge: "Individual quote",
    quoteReply: "reply within 24 h",
    bothSections: "Choose a section",
  },
  de: {
    title: "Produkte und Leistungen",
    lead: "Fertige Stücke kaufen oder eine Leistung mit Angebot in wenigen Minuten bestellen. Zahlung per BLIK oder Sofortüberweisung.",
    products: "Fertige Produkte",
    productsLead: "Liegen bei uns im Regal oder stehen als Datei bereit. Sie zahlen, wir versenden, nichts zu konfigurieren.",
    services: "Leistungen",
    servicesLead: "Sie konfigurieren auf der Leistungskarte, der verbindliche Preis erscheint sofort, und das Stück entsteht für Ihre Bestellung.",
    inStock: "Verfügbar",
    lastOne: "Letztes Stück",
    outOfStock: "Derzeit nicht verfügbar",
    digital: "Datei zum Download",
    madeToOrder: "Auf Bestellung",
    from: "ab",
    order: "Bestellen",
    askQuote: "Angebot anfordern",
    details: "Details",
    ready: "Versand in",
    days: "Tagen",
    immediate: "sofort nach Zahlung",
    quoteBadge: "Individuelles Angebot",
    quoteReply: "Antwort in 24 h",
    bothSections: "Bereich wählen",
  },
};

const money = (grosze) => `${(grosze / 100).toFixed(2).replace(".", ",")} PLN`;

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.03] text-neutral-400",
    good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    info: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Naglowek dzialu. Produkt gotowy i usluga to dwie rozne obietnice: jedno
 * lezy na polce, drugie dopiero powstanie. Bez wyraznej granicy klient czyta
 * to jako jedna liste i dziwi sie terminom.
 */
function SectionHead({ icon: Icon, title, lead, count, tone }) {
  const tones = {
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    blue: "border-blue-400/25 bg-blue-400/10 text-blue-300",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  };
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <h2 className="text-white font-serif text-xl sm:text-2xl font-bold">{title}</h2>
        <span className="text-neutral-600 text-xs font-medium tabular-nums">{count}</span>
      </div>
      <p className="text-neutral-500 text-xs leading-relaxed max-w-xl">{lead}</p>
      <div className="h-px bg-gradient-to-r from-white/15 to-transparent mt-4" />
    </div>
  );
}

function ProductCard({ product, lang, u }) {
  const isDigital = product.kind === "digital";
  const soldOut = product.stock === 0;

  return (
    <Link
      to={`/shop/${product.slug}/`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden
                 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="aspect-square bg-black overflow-hidden">
        <img
          src={product.images[0]}
          alt={t(product.title, lang)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {isDigital ? (
            <Badge tone="info"><Download className="w-3 h-3" />{u.digital}</Badge>
          ) : soldOut ? (
            <Badge tone="warn">{u.outOfStock}</Badge>
          ) : product.stock === 1 ? (
            <Badge tone="warn">{u.lastOne}</Badge>
          ) : (
            <Badge tone="good"><Package className="w-3 h-3" />{u.inStock}</Badge>
          )}
        </div>

        <h3 className="text-white font-medium text-sm leading-snug mb-1">{t(product.title, lang)}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed mb-3 flex-1">{t(product.short, lang)}</p>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-bold">{money(product.priceGrosze)}</div>
            <div className="text-neutral-500 text-[10px] mt-0.5">
              {isDigital ? u.immediate : `${u.ready} ${product.leadTimeDays} ${u.days}`}
            </div>
          </div>
          <span className="text-neutral-500 group-hover:text-white text-xs flex items-center gap-1 transition-colors">
            {u.details} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ServiceCard({ card, lang, u }) {
  return (
    <Link
      to={`/shop/service/${card.id}/`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden
                 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="aspect-square bg-black overflow-hidden">
        <img
          src={card.image}
          alt={t(card.title, lang)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.quoteOnly ? (
            <Badge tone="warn"><MessageCircle className="w-3 h-3" />{u.quoteBadge}</Badge>
          ) : (
            <Badge tone="neutral"><Wrench className="w-3 h-3" />{u.madeToOrder}</Badge>
          )}
        </div>

        <h3 className="text-white font-medium text-sm leading-snug mb-1">{t(card.title, lang)}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed mb-3 flex-1">{t(card.lead, lang)}</p>

        <div className="flex items-end justify-between">
          <div>
            {card.priceFromGrosze ? (
              <>
                <div className="text-white font-bold">
                  <span className="text-neutral-500 text-xs font-normal">{u.from} </span>
                  {money(card.priceFromGrosze)}
                </div>
                <div className="text-neutral-500 text-[10px] mt-0.5">
                  {u.ready} {card.leadTimeDays} {u.days}
                </div>
              </>
            ) : (
              <>
                <div className="text-amber-300 font-semibold text-sm">{u.quoteBadge}</div>
                <div className="text-neutral-500 text-[10px] mt-0.5">{u.quoteReply}</div>
              </>
            )}
          </div>
          <span className="text-neutral-500 group-hover:text-white text-xs flex items-center gap-1 transition-colors">
            {u.details} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Shop() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const { pathname } = useLocation();

  // Prerender renderuje sciezki bez koncowego ukosnika, przegladarka z nim,
  // wiec porownujemy na znormalizowanej postaci.
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const category = SHOP_CATEGORIES.find((c) => here === c.path) || null;
  const products = category ? productsByCategory(category.id) : PRODUCTS;
  const services = category ? serviceCardsByCategory(category.id) : [];

  const pageTitle = category ? `${t(category.title, lang)}, ${u.title.toLowerCase()}` : u.title;
  const path = category ? category.path : "/shop/";

  return (
    <>
      <SEOHead
        pageKey={category ? `shop_${category.id}` : "shop"}
        path={path}
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "AEJaCA", url: `${SITE.url}/` },
              { name: u.title, url: `${SITE.url}/shop/` },
              ...(category ? [{ name: t(category.title, lang), url: `${SITE.url}${category.path}` }] : []),
            ]
          ),
        ]}
      />

      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              ...(category ? [{ label: u.title, href: "/shop/" }] : []),
              { label: category ? t(category.title, lang) : u.title },
            ]}
          />

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">{pageTitle}</h1>
          <p className="text-neutral-400 text-sm mb-10 max-w-2xl leading-relaxed">
            {category ? t(category.lead, lang) : u.lead}
          </p>

          {/* Hub: wybor dzialu */}
          {!category && (
            <div className="grid sm:grid-cols-2 gap-4 mb-14">
              {SHOP_CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  to={c.path}
                  className={`group p-6 rounded-2xl border transition-all duration-300 ${
                    c.theme === "amber"
                      ? "border-amber-400/20 bg-amber-400/[0.03] hover:border-amber-400/40 hover:bg-amber-400/[0.07]"
                      : "border-blue-400/20 bg-blue-400/[0.03] hover:border-blue-400/40 hover:bg-blue-400/[0.07]"
                  }`}
                >
                  <h2 className="text-white font-semibold mb-1.5">{t(c.title, lang)}</h2>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-3">{t(c.lead, lang)}</p>
                  <span className={`text-xs flex items-center gap-1.5 ${c.theme === "amber" ? "text-amber-400" : "text-blue-400"}`}>
                    {u.details} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Produkty gotowe */}
          {products.length > 0 && (
            <section className="mb-16">
              <SectionHead
                icon={Package}
                title={u.products}
                lead={u.productsLead}
                count={products.length}
                tone="emerald"
              />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.slug} product={p} lang={lang} u={u} />
                ))}
              </div>
            </section>
          )}

          {/* Uslugi */}
          {services.length > 0 && (
            <section>
              <SectionHead
                icon={Wrench}
                title={u.services}
                lead={u.servicesLead}
                count={services.length}
                tone={category?.theme === "amber" ? "amber" : "blue"}
              />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((s) => (
                  <ServiceCard key={s.id} card={s} lang={lang} u={u} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
