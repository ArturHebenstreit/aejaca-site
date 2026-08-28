// ============================================================
// KARTA PRODUKTU
// ============================================================
// Karta pokazuje to, co decyduje o zakupie: dostepnosc, czas realizacji
// i rezim zwrotu. Dostepnosc bierzemy z bazy na zywo, wiec sztuka sprzedana
// przed chwila nie da sie dolozyc do koszyka.
//
// Ta sama rzecz dolozona drugi raz podbija ilosc istniejacej pozycji, a nie
// tworzy drugiej: dwie linie z tym samym pierscionkiem czytaja sie jak pomylka.

import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "../i18n/nav.jsx";
import { ShoppingCart, Package, Download, RotateCcw, Truck, ArrowLeft, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { t } from "../pricing/config.js";
import { useCart } from "../cart/CartContext.jsx";
import { useMoney } from "../shop/money.js";
import { useAvailability, stockOf, statusOf } from "../shop/availability.js";
import { getProduct, WITHDRAWAL, SHOP_CATEGORIES } from "../data/shopCatalog.js";
import NotFound from "./NotFound.jsx";
import PriceReduction from "../components/shop/PriceReduction.jsx";
import Obraz from "../components/Obraz.jsx";

const UI = {
  pl: {
    shop: "Produkty i usługi",
    addToCart: "Do koszyka",
    addAnother: "Dołóż jeszcze jedną",
    inCart: "W koszyku",
    goToCart: "Przejdź do koszyka",
    allInCart: "Masz w koszyku wszystko, co mamy na półce.",
    freeShippingHint: "Wysyłka gratis w Polsce od 400 zł.",
    orderNow: "Zamów teraz",
    inStock: "Dostępny od ręki",
    lastOne: "Ostatnia sztuka",
    outOfStock: "Chwilowo niedostępny",
    soldOutBack: "Wyprzedany, będzie ponownie",
    soldOutBody: "Ten egzemplarz jest już sprzedany. Wykonamy kolejny, napisz do nas, jeśli chcesz go zarezerwować.",
    withdrawn: "Pozycja wycofana ze sklepu",
    withdrawnBody: "Tej pozycji nie ma już w sprzedaży. Zajrzyj do sklepu po podobne wyroby albo zamów wykonanie na zamówienie.",
    digital: "Plik do pobrania",
    stockLeft: "sztuk w magazynie",
    shipping: "Wysyłka",
    shippingBody: "Paczkomat InPost 16,49 PLN, kurier 19,49 PLN, odbiór osobisty bezpłatnie.",
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
    addAnother: "Add another one",
    inCart: "In your cart",
    goToCart: "Go to cart",
    allInCart: "Your cart already holds everything we have on the shelf.",
    freeShippingHint: "Shipping is calculated at checkout, from your country.",
    orderNow: "Order now",
    inStock: "Available now",
    lastOne: "Last one",
    outOfStock: "Currently unavailable",
    soldOutBack: "Sold out, coming back",
    soldOutBody: "This piece is already sold. We will make another one, write to us if you would like to reserve it.",
    withdrawn: "No longer in the shop",
    withdrawnBody: "This item is no longer for sale. Have a look at the shop for similar pieces, or order one made to your requirements.",
    digital: "Downloadable file",
    stockLeft: "in stock",
    shipping: "Shipping",
    shippingBody: "InPost locker 16.49 PLN, courier 19.49 PLN, personal pickup free of charge.",
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
    addAnother: "Noch eins hinzufügen",
    inCart: "Im Warenkorb",
    goToCart: "Zum Warenkorb",
    allInCart: "Ihr Warenkorb enthält bereits alles, was wir im Regal haben.",
    freeShippingHint: "Die Versandkosten werden an der Kasse nach Land berechnet.",
    orderNow: "Jetzt bestellen",
    inStock: "Sofort verfügbar",
    lastOne: "Letztes Stück",
    outOfStock: "Derzeit nicht verfügbar",
    soldOutBack: "Ausverkauft, kommt wieder",
    soldOutBody: "Dieses Stück ist bereits verkauft. Wir fertigen ein weiteres, schreiben Sie uns, wenn Sie es reservieren möchten.",
    withdrawn: "Nicht mehr im Shop",
    withdrawnBody: "Diese Position ist nicht mehr im Verkauf. Sehen Sie sich ähnliche Stücke im Shop an oder bestellen Sie eine Anfertigung nach Maß.",
    digital: "Datei zum Download",
    stockLeft: "auf Lager",
    shipping: "Versand",
    shippingBody: "InPost-Paketstation 16,49 PLN, Kurier 19,49 PLN, Selbstabholung kostenlos.",
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
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const [shown, setShown] = useState(0);

  if (!product) return <NotFound />;

  const isDigital = product.kind === "digital";
  // Stan z bazy, nie ten zapisany w HTML przy wdrozeniu.
  const stock = stockOf(product, availability);
  const status = statusOf(product, availability);
  // Zdjeta ze sklepu: strona zostaje, bo moze byc w zakladkach i w wynikach
  // wyszukiwania, ale mowi wprost, ze pozycji nie ma, zamiast udawac sklep.
  const withdrawn = status === "withdrawn";
  const soldOut = stock === 0 || status === "sold_out" || withdrawn;
  const category = SHOP_CATEGORIES.find((c) => c.id === product.category);
  const accent = category?.theme === "amber" ? "amber" : "blue";

  // Ta sama rzecz dolozona drugi raz podbija ilosc, zamiast tworzyc druga
  // pozycje: dwie linie z tym samym pierscionkiem czytaja sie jak pomylka.
  const inCart = cart.items.find((i) => i.productSlug === product.slug);
  const inCartQty = inCart?.qty || 0;
  // Wiecej niz mamy na polce nie damy dolozyc. Produkt cyfrowy nie ma limitu.
  const canAdd = !soldOut && (stock === null || inCartQty < stock);

  function addToCart() {
    if (!canAdd) return;
    if (inCart) {
      cart.setQty(inCart.id, inCartQty + 1);
    } else {
      cart.add({
        // `kind` opisuje rodzaj pozycji w koszyku, `productSlug` mowi backendowi,
        // ze cene i dostepnosc ma wziac z katalogu, a nie z kalkulatora.
        kind: isDigital ? "digital" : "product",
        productSlug: product.slug,
        title: t(product.title, lang),
        image: product.images[0],
        unitGrosze: product.priceGrosze,
        qty: 1,
        withdrawal: product.withdrawal,
        category: product.category,
        leadTimeDays: product.leadTimeDays,
        weightG: product.weightG,
      });
    }
    setAdded(true);
  }

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
      availability: withdrawn
        ? "https://schema.org/Discontinued"
        : soldOut
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
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
                <Obraz
                  src={product.images[shown] || product.images[0]}
                  alt={t(product.title, lang)}
                  className="w-full h-full object-cover"
                  sizes="(min-width: 1024px) 560px, 94vw"
                  loading="eager"
                  fetchpriority="high"
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
                      <Obraz src={img} alt="" className="w-full h-full object-cover"
                        sizes="88px"
                      />
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
              <PriceReduction product={product} money={money} lang={lang} className="mb-2" />

              <div className="flex flex-wrap items-center gap-2 mb-6">
                {isDigital ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-300">
                    <Download className="w-3.5 h-3.5" />{u.digital}
                  </span>
                ) : withdrawn ? (
                  <span className="text-xs text-amber-300">{u.withdrawn}</span>
                ) : status === "sold_out" ? (
                  <span className="text-xs text-amber-300">{u.soldOutBack}</span>
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
                disabled={!canAdd}
                onClick={addToCart}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors mb-2 ${
                  !canAdd
                    ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                    : accent === "amber"
                      ? "bg-amber-500 hover:bg-amber-400 text-neutral-900"
                      : "bg-blue-500 hover:bg-blue-400 text-white"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {inCartQty > 0 ? u.addAnother : u.addToCart}
              </button>

              {/* Po dolozeniu nie przerzucamy klienta do koszyka: wiekszosc
                  chce jeszcze poogladac, a kto chce zaplacic, ma link obok. */}
              {added && (
                <div className="flex items-center justify-between gap-3 mb-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
                  <span className="text-emerald-300 text-xs inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />{u.inCart}: {inCartQty}
                  </span>
                  <Link to="/cart/" className="text-emerald-300 hover:text-emerald-200 text-xs underline underline-offset-2">
                    {u.goToCart}
                  </Link>
                </div>
              )}

              <p className="text-neutral-600 text-xs text-center mb-7">
                {withdrawn
                  ? u.withdrawnBody
                  : status === "sold_out"
                    ? u.soldOutBody
                    : stock !== null && inCartQty >= stock
                      ? u.allInCart
                      : u.freeShippingHint}
              </p>

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
