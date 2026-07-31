// ============================================================
// KOSZYK
// ============================================================
// Kwoty pokazane tutaj pochodza z wycen zapisanych przy dodawaniu pozycji.
// Sa informacyjne. Wiazaca kwota powstaje przy skladaniu zamowienia, gdy
// backend przelicza wszystko od nowa, i wtedy klient zobaczy ewentualna
// roznice zanim zaplaci.

import { Link } from "react-router-dom";
import { Trash2, ShoppingCart, ArrowRight, AlertTriangle, Package, Download, Wrench } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { useCart } from "../cart/CartContext.jsx";
import { getPackaging } from "../pricing/packaging.js";
import { t } from "../pricing/config.js";

const UI = {
  pl: {
    title: "Koszyk",
    empty: "Koszyk jest pusty",
    emptyLead: "Zajrzyj do produktów i usług, wszystko wycenimy od ręki.",
    toShop: "Przejdź do sklepu",
    qty: "szt.",
    packaging: "Opakowanie",
    engraving: "Grawer",
    file: "Plik",
    subtotal: "Wartość zamówienia",
    shippingNote: "Koszt dostawy policzymy w następnym kroku.",
    checkout: "Przejdź do zamówienia",
    soon: "Finalizację zamówienia uruchamiamy w następnym kroku",
    remove: "Usuń",
    volatile: "Pozycje z wgranym plikiem znikną po odświeżeniu strony",
    volatileBody: "Pliki klientów nie mieszczą się w pamięci przeglądarki. Do czasu przeniesienia ich na serwer dokończ takie zamówienie w tej samej sesji.",
    returns14: "Zwrot 14 dni",
    returnsNone: "Bez prawa zwrotu, na zamówienie",
    returnsDigital: "Bez prawa zwrotu po pobraniu",
  },
  en: {
    title: "Cart",
    empty: "Your cart is empty",
    emptyLead: "Have a look at the products and services, everything is quoted on the spot.",
    toShop: "Go to the shop",
    qty: "pcs",
    packaging: "Packaging",
    engraving: "Engraving",
    file: "File",
    subtotal: "Order value",
    shippingNote: "Delivery cost is calculated in the next step.",
    checkout: "Proceed to order",
    soon: "Order completion arrives in the next step",
    remove: "Remove",
    volatile: "Items with an uploaded file disappear when the page is refreshed",
    volatileBody: "Customer files do not fit in browser storage. Until they move to the server, finish such an order in the same session.",
    returns14: "14-day return",
    returnsNone: "No return, made to order",
    returnsDigital: "No return once downloaded",
  },
  de: {
    title: "Warenkorb",
    empty: "Ihr Warenkorb ist leer",
    emptyLead: "Sehen Sie sich Produkte und Leistungen an, alles wird sofort kalkuliert.",
    toShop: "Zum Shop",
    qty: "Stk.",
    packaging: "Verpackung",
    engraving: "Gravur",
    file: "Datei",
    subtotal: "Bestellwert",
    shippingNote: "Die Versandkosten berechnen wir im nächsten Schritt.",
    checkout: "Zur Bestellung",
    soon: "Der Bestellabschluss folgt im nächsten Schritt",
    remove: "Entfernen",
    volatile: "Positionen mit hochgeladener Datei verschwinden beim Neuladen",
    volatileBody: "Kundendateien passen nicht in den Browserspeicher. Bis sie auf den Server wandern, schließen Sie eine solche Bestellung in derselben Sitzung ab.",
    returns14: "14 Tage Rückgabe",
    returnsNone: "Keine Rückgabe, auf Bestellung",
    returnsDigital: "Keine Rückgabe nach Download",
  },
};

const money = (g) => `${(g / 100).toFixed(2).replace(".", ",")} PLN`;

export default function Cart() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const { items, subtotalGrosze, remove, setQty, hasVolatile, ready } = useCart();

  const regimeLabel = (r) =>
    r === "digital" ? u.returnsDigital : r === "made_to_order" ? u.returnsNone : u.returns14;

  return (
    <>
      <SEOHead pageKey="cart" path="/cart" noindex schemas={[]} />
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={[{ label: u.title }]} />
          <h1 className="font-serif text-3xl font-bold text-white mb-8">{u.title}</h1>

          {ready && items.length === 0 && (
            <div className="text-center py-16">
              <ShoppingCart className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
              <h2 className="text-white font-medium mb-2">{u.empty}</h2>
              <p className="text-neutral-500 text-sm mb-6">{u.emptyLead}</p>
              <Link
                to="/shop/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 text-neutral-200 hover:bg-white/10 text-sm transition-colors"
              >
                {u.toShop} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <>
              {hasVolatile && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-4 mb-5 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-amber-300 text-xs font-medium mb-1">{u.volatile}</div>
                    <p className="text-neutral-400 text-xs leading-relaxed">{u.volatileBody}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {items.map((i) => {
                  const pack = getPackaging(i.packagingId);
                  const line = ((i.unitGrosze || 0) + (i.packagingGrosze || 0)) * (i.qty || 1);
                  const Icon = i.kind === "service" ? Wrench : i.withdrawal === "digital" ? Download : Package;
                  return (
                    <div key={i.id} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      {i.image && (
                        <img src={i.image} alt="" className="w-16 h-16 rounded-lg object-cover bg-black flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Icon className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                              <span className="text-white text-sm font-medium truncate">{i.title}</span>
                            </div>
                            <div className="text-neutral-500 text-[11px]">{regimeLabel(i.withdrawal)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(i.id)}
                            aria-label={u.remove}
                            className="text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-neutral-500 text-[11px] mt-1.5 space-y-0.5">
                          {pack && <div>{u.packaging}: {t(pack.label, lang)}{pack.grosze ? ` (+${money(pack.grosze)})` : ""}</div>}
                          {i.personalization && <div>{u.engraving}: &bdquo;{i.personalization}&rdquo;</div>}
                          {i.fileName && <div>{u.file}: {i.fileName}</div>}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQty(i.id, (i.qty || 1) - 1)}
                              className="w-7 h-7 rounded-md border border-white/10 text-neutral-400 hover:text-white hover:border-white/25 transition-colors"
                            >
                              &minus;
                            </button>
                            <span className="text-white text-sm w-10 text-center">{i.qty || 1} {u.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(i.id, (i.qty || 1) + 1)}
                              className="w-7 h-7 rounded-md border border-white/10 text-neutral-400 hover:text-white hover:border-white/25 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-white font-semibold text-sm">{money(line)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-neutral-300 text-sm">{u.subtotal}</span>
                  <span className="text-white font-bold text-xl">{money(subtotalGrosze)}</span>
                </div>
                <p className="text-neutral-600 text-[11px] mb-4">{u.shippingNote}</p>
                <Link
                  to="/checkout/"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400
                             text-white font-semibold text-sm transition-colors"
                >
                  {u.checkout} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
