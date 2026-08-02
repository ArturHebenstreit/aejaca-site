// ============================================================
// KARTA PRODUKTU
// ============================================================
// Przycisk "Do koszyka" jest na razie nieaktywny, bo koszyk powstaje
// w fazie 1. Karta ma jednak od poczatku pokazywac to, co decyduje
// o zakupie: dostepnosc, czas realizacji i rezim zwrotu.

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart, Package, Download, RotateCcw, Truck, ArrowLeft, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { t } from "../pricing/config.js";
import { useMoney } from "../shop/money.js";
import { useAvailability, stockOf } from "../shop/availability.js";
import { getProduct, WITHDRAWAL, SHOP_CATEGORIES } from "../data/shopCatalog.js";
import NotFound from "./NotFound.jsx";

const UI = {
  pl: {
    shop: "Produkty i usługi",
    addToCart: "Do koszyka",
    soonAvailable: "Koszyk uruchamiamy wkrótce",
    orderNow: "Zamów teraz",
    inStock: "Dostępny od ręki",
    lastOne: "Ostatnia sztuka",
    outOfStock: "Chwilowo niedostępny",
    digital: "Plik do pobrania",
    stockLeft: "sztuk w magazynie",
    shipping: "Wysyłka",
    shippingBody: "Paczkomat InPost 15,90 PLN, kurier 24,90 PLN, odbiór osobisty bezpłatnie.",
    digitalDelivery: "Dostawa",
    digitalDeliveryBody: "Link do pobrania wysyłamy na email natychmiast po zaksięgowaniu płatności.",
    returns: "Zwrot",
    returnsStandard: "14 dni na odstąpienie od umowy bez podania przyczyny.",
    returnsMade: "Rzecz wykonywana na Twoje zamówienie, prawo odstąpienia nie przysługuje po rozpoczęciu wykonania.",
    returnsDigital: "Treść cyfrowa dostarczana natychmiast, prawo odstąpienia wygasa z chwilą rozpoczęcia pobierania.",
    specs: "Specyfikacja",
    leadTime: "Czas realizacji",
    days: "dni roboczych",
    immediate: "natychmiast",
    back: "Wróć do sklepu",
    moreInfo: "Szczegóły",
    terms: "Regulamin",
  },
  en: {
    shop: "Products and services",
    addToCart: "Add to cart",
    soonAvailable: "The cart is coming soon",
    orderNow: "Order now",
    inStock: "Available now",
    lastOne: "Last one",
    outOfStock: "Currently unavailable",
    digital: "Downloadable file",
    stockLeft: "in stock",
    shipping: "Shipping",
    shippingBody: "InPost locker 15.90 PLN, courier 24.90 PLN, personal pickup free of charge.",
    digitalDelivery: "Delivery",
    digitalDeliveryBody: "The download link is emailed to you immediately after the payment is settled.",
    returns: "Returns",
    returnsStandard: "14 days to withdraw from the contract without giving a reason.",
    returnsMade: "Made to your order, the right of withdrawal does not apply once production has begun.",
    returnsDigital: "Digital content delivered immediately, the right of withdrawal expires once the download starts.",
    specs: "Specification",
    leadTime: "Lead time",
    days: "business days",
    immediate: "immediate",
    back: "Back to the shop",
    moreInfo: "Details",
    terms: "Terms of Service",
  },
  de: {
    shop: "Produkte und Leistungen",
    addToCart: "In den Warenkorb",
    soonAvailable: "Der Warenkorb kommt in Kürze",
    orderNow: "Jetzt bestellen",
    inStock: "Sofort verfügbar",
    lastOne: "Letztes Stück",
    outOfStock: "Derzeit nicht verfügbar",
    digital: "Datei zum Download",
    stockLeft: "auf Lager",
    shipping: "Versand",
    shippingBody: "InPost-Paketstation 15,90 PLN, Kurier 24,90 PLN, Selbstabholung kostenlos.",
    digitalDelivery: "Lieferung",
    digitalDeliveryBody: "Den Download-Link senden wir sofort nach Zahlungseingang per E-Mail.",
    returns: "Rückgabe",
    returnsStandard: "14 Tage Widerrufsrecht ohne Angabe von Gründen.",
    returnsMade: "Nach Ihren Vorgaben gefertigt, nach Fertigungsbeginn besteht kein Widerrufsrecht.",
    returnsDigital: "Digitale Inhalte werden sofort geliefert, das Widerrufsrecht erlischt mit Beginn des Downloads.",
    specs: "Spezifikation",
    leadTime: "Lieferzeit",
    days: "Werktage",
    immediate: "sofort",
    back: "Zurück zum Shop",
    moreInfo: "Details",
    terms: "AGB",
  },
};


export default function Product() {
  const { lang } = useLanguage();
  const { money } = useMoney();
  const u = UI[lang] || UI.en;
  const { slug } = useParams();
  const product = getProduct(slug);
  const availability = useAvailability();
  const [added, setAdded] = useState(false);
  const [shown, setShown] = useState(0);

  if (!product) return <NotFound />;

  const isDigital = product.kind === "digital";
  // Stan z bazy, nie ten zapisany w HTML przy wdrozeniu.
  const stock = stockOf(product, availability);
  const soldOut = stock === 0;
  const category = SHOP_CATEGORIES.find((c) => c.id === product.category);
  const accent = category?.theme === "amber" ? "amber" : "blue";

  const returnsText =
    product.withdrawal === WITHDRAWAL.DIGITAL
      ? u.returnsDigital
      : product.withdrawal === WITHDRAWAL.MADE_TO_ORDER
        ? u.returnsMade
        : u.returnsStandard;

  // Schemat Product: karta moze trafic do wynikow zakupowych Google,
  // czego przy sprzedazy przez Etsy nie mamy, bo widocznosc zbiera Etsy.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t(product.title, lang),
    description: t(product.short, lang),
    image: `${SITE.url}${product.images[0]}`,
    sku: product.slug,
    brand: { "@type": "Brand", name: "AEJaCA" },
    offers: {
      "@type": "Offer",
      price: (product.priceGrosze / 100).toFixed(2),
      priceCurrency: "PLN",
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${SITE.url}/shop/${product.slug}/`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <SEOHead
        pageKey="product"
        path={`/shop/${product.slug}`}
        title={`${t(product.title, lang)}, AEJaCA`}
        description={t(product.short, lang)}
        image={product.images[0]}
        ogType="product"
        schemas={[
          productSchema,
          buildBreadcrumbSchema([
            { name: "AEJaCA", url: `${SITE.url}/` },
            { name: u.shop, url: `${SITE.url}/shop/` },
            ...(category ? [{ name: t(category.title, lang), url: `${SITE.url}${category.path}` }] : []),
            { name: t(product.title, lang), url: `${SITE.url}/shop/${product.slug}/` },
          ]),
        ]}
      />

      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              { label: u.shop, href: "/shop/" },
              ...(category ? [{ label: t(category.title, lang), href: category.path }] : []),
              { label: t(product.title, lang) },
            ]}
          />

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Zdjecia: duze wybrane, pod nim reszta. Miniatury pokazujemy tylko
                wtedy, gdy jest co przelaczac. */}
            <div>
              <div className="rounded-2xl overflow-hidden bg-black border border-white/10 aspect-square">
                <img
                  src={product.images[shown] || product.images[0]}
                  alt={t(product.title, lang)}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-2">
                  {product.images.map((img, i) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setShown(i)}
                      aria-label={`${t(product.title, lang)} ${i + 1}`}
                      aria-current={i === shown}
                      className={`w-16 h-16 rounded-lg overflow-hidden border transition-colors ${
                        i === shown ? "border-white/50" : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel zakupowy */}
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                {t(product.title, lang)}
              </h1>
              <p className="text-neutral-400 text-sm mb-5">{t(product.short, lang)}</p>

              <div className="mb-1">
                <span className="text-3xl font-extrabold text-white">{money(product.priceGrosze)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-6">
                {isDigital ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-300">
                    <Download className="w-3.5 h-3.5" />{u.digital}
                  </span>
                ) : soldOut ? (
                  <span className="text-xs text-amber-300">{u.outOfStock}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                    <Package className="w-3.5 h-3.5" />
                    {stock === 1 ? u.lastOne : `${u.inStock}, ${stock} ${u.stockLeft}`}
                  </span>
                )}
                <span className="text-neutral-600">&middot;</span>
                <span className="text-xs text-neutral-400">
                  {u.leadTime}: {isDigital ? u.immediate : `${product.leadTimeDays} ${u.days}`}
                </span>
              </div>

              {/* Koszyk powstaje w fazie 1, przycisk jest tu, zeby ocenic uklad karty */}
              <button
                type="button"
                disabled={soldOut}
                onClick={() => setAdded(true)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors mb-2 ${
                  soldOut
                    ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                    : added
                      ? "bg-emerald-500 text-white"
                      : accent === "amber"
                        ? "bg-amber-500 hover:bg-amber-400 text-neutral-900"
                        : "bg-blue-500 hover:bg-blue-400 text-white"
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {added ? u.soonAvailable : u.addToCart}
              </button>
              <p className="text-neutral-600 text-[11px] text-center mb-7">{u.soonAvailable}</p>

              {/* Warunki, ktore realnie decyduja o zakupie */}
              <div className="space-y-3 text-xs">
                <div className="flex gap-3">
                  <Truck className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-neutral-300 font-medium mb-0.5">
                      {isDigital ? u.digitalDelivery : u.shipping}
                    </div>
                    <p className="text-neutral-500 leading-relaxed">
                      {isDigital ? u.digitalDeliveryBody : u.shippingBody}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <RotateCcw className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-neutral-300 font-medium mb-0.5">{u.returns}</div>
                    <p className="text-neutral-500 leading-relaxed">
                      {returnsText}{" "}
                      <Link to="/terms/#sec-10" className="text-neutral-400 hover:text-white underline underline-offset-2">
                        {u.terms}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opis i specyfikacja */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mt-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{u.moreInfo}</h2>
              {t(product.description, lang).split("\n\n").map((para, i) => (
                <p key={i} className="text-neutral-300 text-sm leading-relaxed mb-3">{para}</p>
              ))}
              {product.note && (
                <p className="text-neutral-500 text-xs italic mt-4 pt-4 border-t border-white/5">
                  {t(product.note, lang)}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{u.specs}</h2>
              <dl className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
                {product.specs.map((s, i) => (
                  <div key={i} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-neutral-500">{t(s.label, lang)}</dt>
                    <dd className="text-neutral-200 text-right">{t(s.value, lang)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <Link
            to={category ? category.path : "/shop/"}
            className="inline-flex items-center gap-2 mt-12 text-neutral-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />{u.back}
          </Link>
        </div>
      </div>
    </>
  );
}
