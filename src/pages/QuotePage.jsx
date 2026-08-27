// ============================================================
// ZAPISANA WYCENA, strona pod prywatnym linkiem
// ============================================================
// Adres zawiera token, wiec strona jest `noindex` i nie ma do niej odnosnika
// z zadnego menu. Wycena zawiera parametry i kwoty konkretnej osoby.
//
// Strona nie liczy niczego sama. Kwoty przychodza z API, ktore przelicza je
// w chwili otwarcia: robocizna zostaje ta obiecana, kruszec idzie po dzisiejszym
// kursie. Gdyby liczyla je przegladarka, ta sama wycena pokazywalaby dwie rozne
// liczby zaleznie od tego, czyj komputer ja otworzyl.

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "../i18n/nav.jsx";
import { Loader2, XCircle, Clock, ShoppingCart, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useCart } from "../cart/CartContext.jsx";
import { useMarketRates } from "../hooks/useMarketRates.js";
import { SERVICES_FULL } from "../data/serviceCatalog.js";
import { SERVICES } from "../data/orderCatalog.js";
import { t } from "../pricing/config.js";
import SEOHead from "../seo/SEOHead.jsx";

const API = import.meta.env.VITE_CHAT_API_URL;

/**
 * Karta uslugi dla kalkulatora, ktorym policzono pozycje.
 *
 * Wycena zna kalkulator (`jewelry_new`), a koszyk potrzebuje karty uslugi
 * (`jewelry_plain`), zeby miec tytul i zdjecie. Jeden kalkulator obsluguje
 * kilka kart, wiec bierzemy pierwsza pasujaca: tytul i tak wraca z wyceny,
 * a karta daje wylacznie oprawe wizualna.
 */
function cardForCalculator(calculator) {
  const svc = SERVICES.find((s) => s.calculator === calculator);
  if (!svc) return null;
  return SERVICES_FULL.find((c) => (c.service || c.id) === svc.id) || null;
}

const UI = {
  pl: {
    title: "Twoja wycena",
    loading: "Wczytuję wycenę",
    notFound: "Nie znaleźliśmy tej wyceny",
    notFoundDesc: "Link jest niepełny, wygasł albo wycena została usunięta. Wyceny zapisane usuwamy po 90 dniach.",
    number: "Numer wyceny",
    items: "Pozycje",
    total: "Razem",
    validUntil: "Obowiązuje do",
    expiredTitle: "Ta wycena straciła ważność",
    expiredDesc: "Kwoty poniżej pokazujemy takie, jakie były w dniu zapisu. Policz konfigurację jeszcze raz albo napisz do nas, potwierdzimy cenę.",
    metalUp: "Kruszec podrożał od dnia zapisu",
    metalDown: "Kruszec potaniał od dnia zapisu",
    metalNote: "Robocizna w tej wycenie jest wiążąca do końca okresu ważności. Wartość kruszcu przeliczamy według kursu z dnia otwarcia, dlatego kwota przy złocie i srebrze może się nieznacznie różnić od zapisanej.",
    savedWas: "w dniu zapisu",
    addToCart: "Dodaj do koszyka",
    added: "Dodano do koszyka",
    goToCart: "Przejdź do koszyka",
    noObligation: "Ta wycena nie jest zamówieniem. Nic nie zostało pobrane i do niczego Cię nie zobowiązuje.",
    questions: "Masz pytania",
    contact: "Napisz do nas",
    file: "Plik",
    perPc: "za sztukę",
    pcs: "szt.",
  },
  en: {
    title: "Your quote",
    loading: "Loading the quote",
    notFound: "We could not find this quote",
    notFoundDesc: "The link is incomplete, expired, or the quote has been deleted. Saved quotes are removed after 90 days.",
    number: "Quote number",
    items: "Items",
    total: "Total",
    validUntil: "Valid until",
    expiredTitle: "This quote has expired",
    expiredDesc: "The amounts below are shown as they were on the day it was saved. Run the configuration again or write to us and we will confirm the price.",
    metalUp: "Precious metal has risen since the quote was saved",
    metalDown: "Precious metal has fallen since the quote was saved",
    metalNote: "The labour in this quote is binding until the end of the validity period. Precious metal is recalculated at the rate on the day you open it, so for gold and silver the amount may differ slightly from the saved one.",
    savedWas: "when saved",
    addToCart: "Add to cart",
    added: "Added to cart",
    goToCart: "Go to cart",
    noObligation: "This quote is not an order. Nothing has been charged and it commits you to nothing.",
    questions: "Any questions",
    contact: "Write to us",
    file: "File",
    perPc: "per piece",
    pcs: "pcs",
  },
  de: {
    title: "Ihr Angebot",
    loading: "Angebot wird geladen",
    notFound: "Dieses Angebot wurde nicht gefunden",
    notFoundDesc: "Der Link ist unvollständig, abgelaufen, oder das Angebot wurde gelöscht. Gespeicherte Angebote entfernen wir nach 90 Tagen.",
    number: "Angebotsnummer",
    items: "Positionen",
    total: "Gesamt",
    validUntil: "Gültig bis",
    expiredTitle: "Dieses Angebot ist abgelaufen",
    expiredDesc: "Die Beträge unten zeigen den Stand vom Tag der Speicherung. Berechnen Sie die Konfiguration erneut oder schreiben Sie uns, wir bestätigen den Preis.",
    metalUp: "Edelmetall ist seit der Speicherung teurer geworden",
    metalDown: "Edelmetall ist seit der Speicherung günstiger geworden",
    metalNote: "Die Arbeitsleistung in diesem Angebot ist bis zum Ende der Gültigkeit verbindlich. Edelmetall wird zum Kurs des Öffnungstages neu berechnet, bei Gold und Silber kann der Betrag daher leicht abweichen.",
    savedWas: "bei Speicherung",
    addToCart: "In den Warenkorb",
    added: "In den Warenkorb gelegt",
    goToCart: "Zum Warenkorb",
    noObligation: "Dieses Angebot ist keine Bestellung. Es wurde nichts abgebucht und es verpflichtet zu nichts.",
    questions: "Noch Fragen",
    contact: "Schreiben Sie uns",
    file: "Datei",
    perPc: "pro Stück",
    pcs: "Stk.",
  },
};

const pln = (g) => `${(g / 100).toFixed(2).replace(".", ",")} PLN`;

export default function QuotePage() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const cart = useCart();
  const { rates } = useMarketRates();
  const [search] = useSearchParams();
  const ref = search.get("ref");
  const token = search.get("token");

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(Boolean(ref && token));
  const [notFound, setNotFound] = useState(!ref || !token);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!ref || !token) return;
    // Bez adresu API nie ma skad wziac wyceny. Wyjscie z efektu bez ruszenia
    // stanu zostawialo krecace sie kolko na zawsze, czyli komunikat "zaraz
    // bedzie", ktory nigdy sie nie spelnia.
    if (!API) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${API}/api/quotes/${encodeURIComponent(ref)}?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not_found"))))
      .then((d) => { if (!cancelled) { setQuote(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [ref, token]);

  // Zasada walutowa serwisu: po polsku zlotowki, po angielsku i niemiecku euro.
  // Kwota wiazaca jest i tak w zlotowkach, wiec euro idzie obok, jako przelicznik.
  const showEur = lang === "en" || lang === "de";
  const eurPln = rates?.pln_per_eur || 4.25;
  const eur = (g) => `${(g / 100 / eurPln).toFixed(2)} EUR`;

  function addAll() {
    if (!quote?.items?.length) return;
    for (const i of quote.items) {
      const card = cardForCalculator(i.calculator);
      cart.add({
        kind: "service",
        calculator: i.calculator,
        serviceId: card?.id || i.calculator,
        title: card ? t(card.title, lang) : i.title,
        image: card?.image,
        params: i.params || {},
        fileName: i.fileName,
        uploadToken: i.uploadToken,
        fileRetained: Boolean(i.uploadToken),
        unitGrosze: i.unitGrosze,
        description: i.description,
        packagingId: "paper",
        packagingGrosze: 0,
        withdrawal: "made_to_order",
        qty: i.qty,
        // Slad pochodzenia: ta pozycja ma numer wyceny, ktory warto miec
        // w zamowieniu, gdyby pozniej doszlo do rozmowy o cenie.
        source: "quote",
        quoteRef: quote.quoteRef,
      });
    }
    setAdded(true);
  }

  const dateFmt = (d) =>
    new Date(d).toLocaleDateString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-IE");

  const delta = quote?.metalDeltaGrosze || 0;

  return (
    <>
      <SEOHead pageKey="quote" path="/quote" noindex schemas={[]} />
      <div className="min-h-[80vh] bg-neutral-950 pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-neutral-400 py-20">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">{u.loading}</span>
            </div>
          ) : notFound || !quote ? (
            <div className="text-center py-20">
              <XCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-white mb-3">{u.notFound}</h1>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto mb-6">{u.notFoundDesc}</p>
              <Link to="/contact/" className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white text-sm">
                {u.contact} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl font-bold text-white mb-1">{u.title}</h1>
              <p className="text-neutral-500 text-xs mb-6">
                {u.number}: <span className="font-mono text-neutral-300">{quote.quoteRef}</span>
              </p>

              {quote.expired && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 text-sm font-semibold">{u.expiredTitle}</span>
                  </div>
                  <p className="text-amber-200/80 text-xs leading-relaxed">{u.expiredDesc}</p>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-3">{u.items}</div>

                {quote.items.map((i) => (
                  <div key={i.id} className="py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <div className="text-white text-sm">
                          {i.title}{i.qty > 1 ? ` (${i.qty} ${u.pcs})` : ""}
                        </div>
                        {i.fileName && (
                          <div className="text-neutral-500 text-xs mt-0.5">{u.file}: {i.fileName}</div>
                        )}
                        {i.description && (
                          <div className="text-neutral-400 text-xs mt-1 leading-relaxed">{i.description}</div>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-white font-semibold text-sm tabular-nums">{pln(i.lineGrosze)}</div>
                        {i.qty > 1 && (
                          <div className="text-neutral-500 text-xs">{pln(i.unitGrosze)} {u.perPc}</div>
                        )}
                        {/* Kwota zapisana zostaje widoczna, a nie do odtworzenia
                            z pamieci. Roznica ma byc sprawdzalna, nie ukryta. */}
                        {i.repriced && (
                          <div className="text-neutral-500 text-xs">
                            {pln(i.savedUnitGrosze * i.qty)} {u.savedWas}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-baseline justify-between gap-4 pt-4 mt-2 border-t border-white/10">
                  <span className="text-neutral-400 text-sm">{u.total}</span>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-white leading-tight tabular-nums">
                      {pln(quote.totalGrosze)}
                    </div>
                    {showEur && <div className="text-neutral-500 text-xs">{eur(quote.totalGrosze)}</div>}
                  </div>
                </div>
              </div>

              {delta !== 0 && !quote.expired && (
                <div className="flex items-start gap-2 text-neutral-400 text-xs mb-4">
                  {delta > 0 ? <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span>
                    {delta > 0 ? u.metalUp : u.metalDown}: {delta > 0 ? "+" : ""}{pln(delta)}
                  </span>
                </div>
              )}

              {quote.validUntil && (
                <p className="text-neutral-400 text-xs mb-1">
                  {u.validUntil} <span className="text-white">{dateFmt(quote.validUntil)}</span>
                </p>
              )}
              <p className="text-neutral-500 text-xs leading-relaxed mb-6">{u.metalNote}</p>

              {!quote.expired && (
                <>
                  <button
                    type="button"
                    onClick={addAll}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                      added ? "bg-emerald-500 text-white" : "bg-blue-500 hover:bg-blue-400 text-white"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {added ? u.added : u.addToCart}
                  </button>
                  {added && (
                    <Link
                      to="/cart/"
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 text-neutral-400 hover:text-white text-xs transition-colors"
                    >
                      {u.goToCart} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </>
              )}

              <p className="text-neutral-500 text-xs leading-relaxed mt-4">{u.noObligation}</p>
              <p className="text-neutral-500 text-xs mt-4">
                {u.questions}?{" "}
                <Link to="/contact/" className="text-neutral-300 hover:text-white underline underline-offset-2">
                  {u.contact}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
