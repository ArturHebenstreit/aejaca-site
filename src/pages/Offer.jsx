// ============================================================
// STRONA OFERTY, czyli zaplata za wycene ustalona z czlowiekiem
// ============================================================
// Do tej pory zaplacic dalo sie WYLACZNIE za to, co klient policzyl sam
// w kalkulatorze. Kto dostal kwote mailem albo uslyszal ja przez telefon,
// nie mial dokad pojsc: numeru nie bylo, konta nie podawalismy, a koszyk
// nie umial przyjac ceny, ktorej nie policzyl silnik.
//
// Ta strona zamyka te dziure. Wchodzi sie na nia dwiema drogami:
//
//   1. z linku w ofercie (`?ref=...&token=...`),
//   2. z samego numeru wyceny, podanego tutaj razem z adresem e-mail, na
//      ktory poszla oferta, albo z kodem odbioru przy rozmowie telefonicznej.
//
// Numer sam w sobie dowodem nie jest, bo oferta niesie nazwisko, telefon
// i adres. Dlatego drugie wejscie zawsze o cos jeszcze pyta.
//
// ZADNEJ KWOTY NIE LICZY TA STRONA. Pozycje przychodza z API, koszt dostawy
// liczy serwer z wlasnego cennika, a znizke rezerwuje dopiero zlozenie
// zamowienia, w jednej transakcji z jego zapisem. Przegladarka pokazuje.

import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Tag, Check, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import LockerPicker from "../components/shop/LockerPicker.jsx";
import CustomerFields, { ValidatedField as Field } from "../components/shop/CustomerFields.jsx";
import { validateCustomer } from "../shop/customerFields.js";
import { DELIVERY_METHODS } from "../data/orderCatalog.js";
import { shippingOptions, SHIPPING_COUNTRIES, leadDaysLabel } from "../pricing/shipping.js";
import { useMoney } from "../shop/money.js";

const API = import.meta.env.VITE_CHAT_API_URL;

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* pusta odpowiedz to tez odpowiedz */ }
  return { ok: res.ok, status: res.status, data };
}

/** Kraj klient szuka po nazwie w swoim jezyku, nie po kodzie. */
function countryName(code, lang) {
  try {
    return new Intl.DisplayNames([lang === "pl" ? "pl" : lang === "de" ? "de" : "en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

const UI = {
  pl: {
    title: "Twoja oferta",
    lead: "Podaj numer oferty, który dostałeś od nas mailem albo w rozmowie. Pokażemy kwotę, przyjmiemy kod rabatowy i przeprowadzimy przez płatność.",
    refLabel: "Numer oferty",
    emailLabel: "Adres e-mail, na który poszła oferta",
    codeLabel: "albo kod odbioru z rozmowy",
    codeHint: "Kod podajemy telefonicznie tym, którzy nie zostawili adresu e-mail.",
    open: "Otwórz ofertę",
    loading: "Wczytuję ofertę",
    notFound: "Nie znaleźliśmy oferty o tym numerze albo dane się nie zgadzają",
    number: "Numer oferty",
    items: "Co wykonujemy",
    variants: "Warianty do wyboru",
    variantsLead: "Przygotowaliśmy kilka wariantów. Zaznacz ten, który wybierasz, a kwota do zapłaty dopasuje się do niego. Wybór możesz zmienić aż do zapłaty.",
    pickOneHere: "Wybierz jedną pozycję",
    optionsHere: "Dodatki, jeśli chcesz",
    perPc: "za sztukę",
    pcs: "szt.",
    note: "Ustalenia do tej oferty",
    validUntil: "Oferta obowiązuje do",
    expiredTitle: "Ta oferta straciła ważność",
    expiredDesc: "Kwota przestała obowiązywać, więc nie możemy jej teraz przyjąć. Napisz do nas, wystawimy nową.",
    doneTitle: "Ta oferta ma już zamówienie",
    doneDesc: "Zamówienie zostało złożone. Stan i płatność sprawdzisz na stronie zamówienia.",
    goToOrder: "Przejdź do zamówienia",
    discount: "Kod rabatowy",
    discountPlaceholder: "np. AEJ-XXXXXX",
    check: "Sprawdź",
    discountOn: "Kod {code} obniża kwotę o {amount}",
    delivery: "Dostawa",
    country: "Kraj",
    method: "Sposób dostawy",
    addressLine1: "Ulica i numer",
    addressLine2: "Mieszkanie, piętro (opcjonalnie)",
    postalCode: "Kod pocztowy",
    city: "Miejscowość",
    contact: "Dane kontaktowe",
    email: "E-mail",
    name: "Imię i nazwisko",
    phone: "Telefon",
    emailLocked: "Oferta jest przypisana do tego adresu, więc potwierdzenie pójdzie właśnie tam.",
    summary: "Do zapłaty",
    itemsTotal: "Wartość zlecenia",
    discountRow: "Rabat",
    shippingRow: "Dostawa",
    credit: "Odliczenie za projekt",
    terms: "Akceptuję regulamin i politykę prywatności",
    waive: "Zamawiam rzecz wykonywaną na moje zamówienie i wiem, że po jej wykonaniu nie przysługuje mi odstąpienie od umowy",
    pay: "Zapłać",
    paying: "Przechodzę do płatności",
    needTerms: "Zaznacz akceptację regulaminu.",
    needDelivery: "Wybierz sposób dostawy i uzupełnij adres.",
    needCustomer: "Uzupełnij dane kontaktowe.",
    payNote: "Płatność obsługuje Autopay: BLIK albo szybki przelew online. Tytułem płatności jest numer tej oferty.",
    errorGeneric: "Coś poszło nie tak",
    days: "dni robocze",
    back: "Wróć na stronę główną",
  },
  en: {
    title: "Your offer",
    lead: "Enter the offer number we sent you by e-mail or gave you on the phone. We will show the amount, accept a discount code and take you through payment.",
    refLabel: "Offer number",
    emailLabel: "The e-mail address the offer was sent to",
    codeLabel: "or the pickup code from our call",
    codeHint: "We give the code over the phone to customers who left no e-mail address.",
    open: "Open the offer",
    loading: "Loading the offer",
    notFound: "We found no offer with that number, or the details do not match",
    number: "Offer number",
    items: "What we will make",
    variants: "Choose a variant",
    variantsLead: "We prepared several variants. Tick the one you want and the amount to pay follows it. You can change the choice up until payment.",
    pickOneHere: "Pick one item",
    optionsHere: "Add-ons, if you want them",
    perPc: "per piece",
    pcs: "pcs",
    note: "Terms of this offer",
    validUntil: "The offer is valid until",
    expiredTitle: "This offer has expired",
    expiredDesc: "The amount no longer stands, so we cannot accept it now. Write to us and we will issue a new one.",
    doneTitle: "This offer already has an order",
    doneDesc: "The order has been placed. You can check its status and payment on the order page.",
    goToOrder: "Go to the order",
    discount: "Discount code",
    discountPlaceholder: "e.g. AEJ-XXXXXX",
    check: "Check",
    discountOn: "Code {code} lowers the amount by {amount}",
    delivery: "Delivery",
    country: "Country",
    method: "Delivery method",
    addressLine1: "Street and number",
    addressLine2: "Flat, floor (optional)",
    postalCode: "Postal code",
    city: "City",
    contact: "Contact details",
    email: "E-mail",
    name: "Full name",
    phone: "Phone",
    emailLocked: "The offer is tied to this address, so the confirmation goes there.",
    summary: "To pay",
    itemsTotal: "Work",
    discountRow: "Discount",
    shippingRow: "Delivery",
    credit: "Design fee credit",
    terms: "I accept the terms and the privacy policy",
    waive: "I am ordering an item made to my specification and I understand the right of withdrawal does not apply once it is made",
    pay: "Pay",
    paying: "Going to payment",
    needTerms: "Please accept the terms.",
    needDelivery: "Choose a delivery method and complete the address.",
    needCustomer: "Complete your contact details.",
    payNote: "Payment is handled by Autopay: BLIK or an instant bank transfer. The payment title is the number of this offer.",
    errorGeneric: "Something went wrong",
    days: "business days",
    back: "Back to the home page",
  },
  de: {
    title: "Ihr Angebot",
    lead: "Geben Sie die Angebotsnummer ein, die Sie per E-Mail oder im Gespräch erhalten haben. Wir zeigen den Betrag, nehmen einen Rabattcode an und führen Sie durch die Zahlung.",
    refLabel: "Angebotsnummer",
    emailLabel: "E-Mail-Adresse, an die das Angebot ging",
    codeLabel: "oder der Abholcode aus dem Gespräch",
    codeHint: "Den Code geben wir telefonisch an Kunden ohne E-Mail-Adresse.",
    open: "Angebot öffnen",
    loading: "Angebot wird geladen",
    notFound: "Wir haben kein Angebot mit dieser Nummer gefunden, oder die Daten stimmen nicht überein",
    number: "Angebotsnummer",
    items: "Was wir anfertigen",
    variants: "Varianten zur Auswahl",
    variantsLead: "Wir haben mehrere Varianten vorbereitet. Wählen Sie die gewünschte aus, der zu zahlende Betrag folgt ihr. Die Auswahl können Sie bis zur Zahlung ändern.",
    pickOneHere: "Wählen Sie eine Position",
    optionsHere: "Zusätze, wenn Sie mögen",
    perPc: "pro Stück",
    pcs: "Stk.",
    note: "Vereinbarungen zu diesem Angebot",
    validUntil: "Das Angebot gilt bis",
    expiredTitle: "Dieses Angebot ist abgelaufen",
    expiredDesc: "Der Betrag gilt nicht mehr, wir können ihn jetzt nicht annehmen. Schreiben Sie uns, wir stellen ein neues aus.",
    doneTitle: "Zu diesem Angebot gibt es bereits eine Bestellung",
    doneDesc: "Die Bestellung wurde aufgegeben. Status und Zahlung sehen Sie auf der Bestellseite.",
    goToOrder: "Zur Bestellung",
    discount: "Rabattcode",
    discountPlaceholder: "z. B. AEJ-XXXXXX",
    check: "Prüfen",
    discountOn: "Code {code} senkt den Betrag um {amount}",
    delivery: "Versand",
    country: "Land",
    method: "Versandart",
    addressLine1: "Straße und Nummer",
    addressLine2: "Wohnung, Etage (optional)",
    postalCode: "Postleitzahl",
    city: "Ort",
    contact: "Kontaktdaten",
    email: "E-Mail",
    name: "Vor- und Nachname",
    phone: "Telefon",
    emailLocked: "Das Angebot ist dieser Adresse zugeordnet, die Bestätigung geht dorthin.",
    summary: "Zu zahlen",
    itemsTotal: "Leistung",
    discountRow: "Rabatt",
    shippingRow: "Versand",
    credit: "Anrechnung der Entwurfsgebühr",
    terms: "Ich akzeptiere die AGB und die Datenschutzerklärung",
    waive: "Ich bestelle eine nach meinen Vorgaben gefertigte Sache und weiß, dass danach kein Widerrufsrecht besteht",
    pay: "Bezahlen",
    paying: "Weiter zur Zahlung",
    needTerms: "Bitte akzeptieren Sie die AGB.",
    needDelivery: "Wählen Sie eine Versandart und vervollständigen Sie die Adresse.",
    needCustomer: "Vervollständigen Sie Ihre Kontaktdaten.",
    payNote: "Die Zahlung wickelt Autopay ab: BLIK oder Sofortüberweisung. Verwendungszweck ist die Nummer dieses Angebots.",
    errorGeneric: "Etwas ist schiefgelaufen",
    days: "Werktage",
    back: "Zurück zur Startseite",
  },
};

/**
 * Jeden wiersz pozycji: nazwa, drobiazgi pod nia i kwota po prawej.
 *
 * Ten sam ksztalt sluzy rachunkowi, wariantowi i dodatkowi, bo klient ma
 * porownywac kwoty, a nie uczyc sie trzech ukladow na jednej stronie.
 * Przy wariancie i dodatku ilosc schodzi z oczu (`bezIlosci`): licza sie
 * kwota i to, czym pozycja jest.
 */
function Wiersz({ it, money, u, bezIlosci = false }) {
  const drobiazgi = [
    bezIlosci ? null : `${it.qty} ${u.pcs}`,
    !bezIlosci && it.unitGrosze != null && it.qty > 1 ? `${money(it.unitGrosze)} ${u.perPc}` : null,
    it.fileName || null,
  ].filter(Boolean);

  return (
    <>
      <div className="min-w-0">
        <div className="text-neutral-200 text-sm">{it.title}</div>
        {drobiazgi.length > 0 && (
          <div className="text-neutral-600 text-xs mt-0.5">{drobiazgi.join(" · ")}</div>
        )}
        {it.description && (
          <p className="text-neutral-500 text-xs mt-1 whitespace-pre-wrap">{it.description}</p>
        )}
      </div>
      <div className="text-neutral-200 text-sm shrink-0">{it.lineGrosze != null ? money(it.lineGrosze) : "-"}</div>
    </>
  );
}

export default function Offer() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.pl;
  const { money } = useMoney();
  const [params, setParams] = useSearchParams();

  const ref = params.get("ref") || "";
  const token = params.get("token") || "";

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- wejscie z numeru ----------------------------------------------------
  const [formRef, setFormRef] = useState(ref);
  const [formEmail, setFormEmail] = useState("");
  const [formCode, setFormCode] = useState("");
  const [looking, setLooking] = useState(false);

  // --- wybor wariantu ------------------------------------------------------
  // `odswiez` podbija licznik, ktory przeladowuje oferte po zmianie wariantu.
  // Kwote do zaplaty ustala serwer, wiec po wyborze czytamy ja od nowa,
  // zamiast liczyc ja w przegladarce i modlic sie, ze wyszlo to samo.
  const [choosing, setChoosing] = useState(false);
  const [chooseError, setChooseError] = useState(null);
  const [odswiez, setOdswiez] = useState(0);

  // --- kod rabatowy --------------------------------------------------------
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [codeError, setCodeError] = useState(null);
  const [checkingCode, setCheckingCode] = useState(false);

  // --- dostawa i dane ------------------------------------------------------
  const [country, setCountry] = useState("PL");
  const [method, setMethod] = useState("");
  const [addr, setAddr] = useState({ point: "", line1: "", line2: "", postalCode: "", city: "" });
  const [customer, setCustomer] = useState({ email: "", name: "", phone: "" });
  const [consents, setConsents] = useState({ terms: false, waiveWithdrawal: false });
  const [tried, setTried] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!ref || !token || !API) return;
    setLoading(true);
    setError(null);
    fetch(`${API}/api/quotes/${encodeURIComponent(ref)}?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setOffer(d);
        setCustomer({
          email: d.customer?.email || "",
          name: d.customer?.name || "",
          phone: d.customer?.phone || "",
        });
      })
      .catch(() => setError(u.notFound))
      .finally(() => setLoading(false));
    // Jezyk zmienia wylacznie tresc komunikatu, wiec nie ma po co pobierac
    // oferty drugi raz po jego przelaczeniu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, token, odswiez]);

  // Pozycje w kartach. Rachunek osobno, a kazda karta to jedna grupa: warianty,
  // z ktorych klient bierze jeden, i dodatki, ktore da sie do nich dolozyc.
  const uklad = useMemo(() => {
    const fixed = [];
    const karty = [];
    for (const it of offer?.items || []) {
      const rodzaj = it.kind || "fixed";
      if (rodzaj === "fixed") { fixed.push(it); continue; }
      const klucz = it.groupKey || "wybor";
      let karta = karty.find((k) => k.key === klucz);
      if (!karta) { karta = { key: klucz, variants: [], options: [] }; karty.push(karta); }
      karta[rodzaj === "variant" ? "variants" : "options"].push(it);
    }
    return { fixed, karty };
  }, [offer]);

  // Po zlozeniu zamowienia i po terminie uklad jest juz tylko do ogladania:
  // kwota z zamowienia zostala wyslana do bramki i nie ma jej jak zmienic.
  const zablokowane = choosing || Boolean(offer?.expired) || Boolean(offer?.orderRef);

  async function lookup(e) {
    e.preventDefault();
    setLooking(true);
    setError(null);
    const r = await postJSON(`${API}/api/quotes/lookup`, {
      ref: formRef.trim(),
      email: formEmail.trim(),
      code: formCode.trim(),
    });
    setLooking(false);
    if (!r.ok) { setError(r.data?.error ? u.notFound : u.errorGeneric); return; }
    setParams({ ref: r.data.ref, token: r.data.token }, { replace: true });
  }

  async function ustawWybor(itemId, selected) {
    if (choosing) return;
    setChoosing(true);
    setChooseError(null);
    const r = await postJSON(`${API}/api/quotes/${encodeURIComponent(ref)}/choose`, { token, itemId, selected });
    setChoosing(false);
    if (!r.ok) { setChooseError(r.data?.error || u.errorGeneric); return; }
    // Znizka byla policzona dla poprzedniego ukladu, wiec przestaje
    // obowiazywac. Lepiej kazac wpisac kod jeszcze raz niz pokazac kwote,
    // ktorej serwer nie potwierdzi przy skladaniu zamowienia.
    setDiscount(null);
    setCodeError(null);
    setOdswiez((n) => n + 1);
  }

  async function checkCode() {
    if (!code.trim()) return;
    setCheckingCode(true);
    setCodeError(null);
    const r = await postJSON(`${API}/api/quotes/${encodeURIComponent(ref)}/discount`, { token, code: code.trim() });
    setCheckingCode(false);
    if (!r.ok) { setDiscount(null); setCodeError(r.data?.error || u.errorGeneric); return; }
    setDiscount(r.data);
  }

  const kraje = useMemo(
    () => SHIPPING_COUNTRIES
      .map((code) => ({ code, name: countryName(code, lang) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang === "pl" ? "pl" : lang === "de" ? "de" : "en")),
    [lang]
  );

  const opcje = useMemo(
    () => shippingOptions(country, offer?.totalGrosze || 0).filter((o) => o.grosze != null),
    [country, offer?.totalGrosze]
  );

  const wybrana = opcje.find((o) => o.id === method) || null;
  const shipping = wybrana?.grosze ?? 0;
  const itemsTotal = offer?.totalGrosze || 0;
  const discountGrosze = discount?.discountGrosze || 0;
  const doZaplaty = Math.max(0, itemsTotal - discountGrosze) + shipping;

  const adresOk = !wybrana
    ? false
    : wybrana.id === "pickup"
      ? true
      : wybrana.id === "inpost_locker"
        ? addr.point.trim().length > 2
        : Boolean(addr.line1.trim() && addr.postalCode.trim() && addr.city.trim());
  const daneOk = Object.keys(validateCustomer(customer)).length === 0;
  const gotowe = adresOk && daneOk && consents.terms;

  async function pay() {
    if (!gotowe) { setTried(true); return; }
    setPaying(true);
    setError(null);
    const created = await postJSON(`${API}/api/quotes/${encodeURIComponent(ref)}/checkout`, {
      token,
      discountCode: discount?.code || null,
      customer,
      consents,
      delivery: {
        method: wybrana.id,
        country,
        point: addr.point || null,
        addressLine1: addr.line1 || null,
        addressLine2: addr.line2 || null,
        postalCode: addr.postalCode || null,
        city: addr.city || null,
      },
    });
    if (!created.ok) {
      setError(created.data?.error || `${u.errorGeneric} (${created.status})`);
      setPaying(false);
      return;
    }

    const payment = await postJSON(`${API}/api/orders/${created.data.orderRef}/pay`, {
      token: created.data.token,
      gatewayId: 0,
    });
    if (!payment.ok) {
      setError(payment.data?.error || `${u.errorGeneric} (${payment.status})`);
      setPaying(false);
      return;
    }

    // Bramka oczekuje zwyklego formularza POST, nie wywolania fetch.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payment.data.url;
    for (const [k, v] of Object.entries(payment.data.params)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    // Polityka bezpieczenstwa potrafi zablokowac wysylke po cichu. Bez tego
    // przycisk zostawalby w stanie "przechodze do platnosci" na zawsze.
    setTimeout(() => setPaying(false), 8000);
  }

  const zaplacone = Boolean(offer?.orderRef);

  return (
    <>
      {/* Bez `noindex`: to jest adres, ktory podajemy w mailu, w instrukcji
          platnosci i przez telefon, wiec ma byc do znalezienia takze wtedy,
          gdy klient zgubil i link, i maila. Sama tresc oferty jest za tokenem,
          wiec indeksowany jest wylacznie formularz z numerem. */}
      <SEOHead pageKey="offer" path="/oferta" schemas={[]} />
      <div className="min-h-[80vh] bg-neutral-950 pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          <h1 className="text-3xl font-bold text-white mb-2">{u.title}</h1>

          {loading && (
            <div className="flex flex-col items-center gap-4 text-neutral-400 py-20">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">{u.loading}</span>
            </div>
          )}

          {/* --- wejscie z numeru ------------------------------------------ */}
          {!loading && !offer && (
            <form onSubmit={lookup} className="mt-6 space-y-4">
              <p className="text-neutral-400 text-sm leading-relaxed">{u.lead}</p>

              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-red-300 text-sm">{error}</div>
              )}

              <Field label={u.refLabel} value={formRef} onChange={setFormRef} required placeholder="WY20260825-A1B2C3D4" />
              <Field label={u.emailLabel} value={formEmail} onChange={setFormEmail} type="email" placeholder="twoj@email.com" />
              <Field label={u.codeLabel} value={formCode} onChange={setFormCode} placeholder="ABCD1234" hint={u.codeHint} />

              <button
                type="submit"
                disabled={looking || !formRef.trim()}
                className="w-full py-3 rounded-xl bg-amber-400 text-neutral-950 font-medium hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {looking ? <Loader2 className="w-4 h-4 animate-spin inline" /> : u.open}
              </button>

              <Link to="/" className="block text-center text-neutral-500 text-xs hover:text-white transition-colors">{u.back}</Link>
            </form>
          )}

          {/* --- oferta ----------------------------------------------------- */}
          {!loading && offer && (
            <div className="mt-6 space-y-6">
              <div className="text-neutral-500 text-xs font-mono">{u.number}: {offer.quoteRef}</div>

              {zaplacone && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                  <h2 className="text-emerald-300 font-semibold mb-1">{u.doneTitle}</h2>
                  <p className="text-emerald-300/80 text-sm leading-relaxed mb-3">{u.doneDesc}</p>
                  <Link to="/order/status/" className="inline-flex items-center gap-2 text-emerald-300 text-sm hover:text-emerald-200">
                    {u.goToOrder} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {offer.expired && !zaplacone && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5">
                  <h2 className="text-amber-300 font-semibold mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {u.expiredTitle}
                  </h2>
                  <p className="text-amber-300/80 text-sm leading-relaxed">{u.expiredDesc}</p>
                </div>
              )}

              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <h2 className="text-white font-semibold mb-3">{uklad.karty.length ? u.variants : u.items}</h2>
                {uklad.karty.length > 0 && (
                  <p className="text-neutral-400 text-sm leading-relaxed mb-4">{u.variantsLead}</p>
                )}

                {/* Skladniki rachunku: te sa w kwocie zawsze i nie ma przy nich
                    czego wybierac. */}
                {uklad.fixed.length > 0 && (
                  <div className="space-y-3">
                    {uklad.fixed.map((it) => (
                      <div key={it.id} className="flex items-start justify-between gap-4">
                        <Wiersz it={it} money={money} u={u} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Karta wyboru: warianty wykluczaja sie wzajemnie, dodatki
                    dokladaja sie do wybranego. Kazde klikniecie idzie na serwer
                    od razu, bo to on ustala kwote do zaplaty, nie przegladarka. */}
                {uklad.karty.map((karta, nr) => (
                  <div
                    key={karta.key}
                    className={`rounded-xl border border-white/10 p-4 space-y-2 ${uklad.fixed.length || nr > 0 ? "mt-4" : ""}`}
                  >
                    {karta.variants.length > 0 && (
                      <div className="text-neutral-500 text-xs">{u.pickOneHere}</div>
                    )}
                    {karta.variants.map((it) => (
                      <label
                        key={it.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          it.selected ? "border-amber-400/50 bg-amber-400/[0.06]" : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`wariant-${karta.key}`}
                          className="mt-1 accent-amber-400"
                          checked={Boolean(it.selected)}
                          disabled={zablokowane}
                          onChange={() => ustawWybor(it.id, true)}
                        />
                        <span className="flex items-start justify-between gap-4 flex-1 min-w-0">
                          <Wiersz it={it} money={money} u={u} bezIlosci />
                        </span>
                      </label>
                    ))}

                    {karta.options.length > 0 && (
                      <div className="text-neutral-500 text-xs pt-2">{u.optionsHere}</div>
                    )}
                    {karta.options.map((it) => (
                      <label
                        key={it.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          it.selected ? "border-amber-400/50 bg-amber-400/[0.06]" : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 accent-amber-400"
                          checked={Boolean(it.selected)}
                          disabled={zablokowane}
                          onChange={() => ustawWybor(it.id, !it.selected)}
                        />
                        <span className="flex items-start justify-between gap-4 flex-1 min-w-0">
                          <Wiersz it={it} money={money} u={u} bezIlosci />
                        </span>
                      </label>
                    ))}
                  </div>
                ))}

                {chooseError && (
                  <p className="text-amber-300 text-xs mt-3">{chooseError}</p>
                )}

                {offer.priceNote && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-neutral-600 text-xs mb-1">{u.note}</div>
                    <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">{offer.priceNote}</p>
                  </div>
                )}

                {offer.validUntil && (
                  <div className="mt-3 text-neutral-500 text-xs">
                    {u.validUntil} {String(offer.validUntil).slice(0, 10)}
                  </div>
                )}
              </section>

              {!zaplacone && !offer.expired && (
                <>
                  {/* --- kod rabatowy --------------------------------------- */}
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-400" /> {u.discount}
                    </h2>
                    <div className="flex gap-2">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder={u.discountPlaceholder}
                        className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={checkCode}
                        disabled={checkingCode || !code.trim()}
                        className="px-4 rounded-lg border border-white/15 text-neutral-200 text-sm hover:border-white/35 disabled:opacity-40 transition-colors"
                      >
                        {checkingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : u.check}
                      </button>
                    </div>
                    {codeError && <p className="text-red-300 text-xs mt-2">{codeError}</p>}
                    {discount && (
                      <p className="text-emerald-300 text-xs mt-2 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {u.discountOn.replace("{code}", discount.code).replace("{amount}", money(discount.discountGrosze))}
                      </p>
                    )}
                  </section>

                  {/* --- dostawa -------------------------------------------- */}
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h2 className="text-white font-semibold">{u.delivery}</h2>

                    <label className="block">
                      <span className="text-neutral-400 text-xs">{u.country}</span>
                      <select
                        value={country}
                        onChange={(e) => { setCountry(e.target.value); setMethod(""); }}
                        className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white"
                      >
                        {kraje.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </label>

                    <div>
                      <span className="text-neutral-400 text-xs">{u.method}</span>
                      <div className="mt-2 space-y-2">
                        {opcje.map((o) => {
                          const meta = DELIVERY_METHODS.find((m) => m.id === o.id);
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setMethod(o.id)}
                              className={`w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                                method === o.id ? "border-amber-400/60 bg-amber-400/10" : "border-white/10 hover:border-white/25"
                              }`}
                            >
                              <span>
                                <span className="block text-sm text-white">{meta?.label?.[lang] || o.id}</span>
                                <span className="block text-neutral-500 text-xs">
                                  {o.carrier}{leadDaysLabel(o) ? ` · ${leadDaysLabel(o)} ${u.days}` : ""}
                                </span>
                              </span>
                              <span className="text-sm text-neutral-200">{o.grosze ? money(o.grosze) : "0"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {method === "inpost_locker" && (
                      <LockerPicker api={API} value={addr.point} onChange={(v) => setAddr((a) => ({ ...a, point: v }))} lang={lang} />
                    )}

                    {method === "courier" && (
                      <div className="space-y-3">
                        <Field label={u.addressLine1} value={addr.line1} onChange={(v) => setAddr((a) => ({ ...a, line1: v }))} required
                               error={u.needDelivery} showError={tried && !addr.line1.trim()} />
                        <Field label={u.addressLine2} value={addr.line2} onChange={(v) => setAddr((a) => ({ ...a, line2: v }))} />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label={u.postalCode} value={addr.postalCode} onChange={(v) => setAddr((a) => ({ ...a, postalCode: v }))} required
                                 error={u.needDelivery} showError={tried && !addr.postalCode.trim()} />
                          <Field label={u.city} value={addr.city} onChange={(v) => setAddr((a) => ({ ...a, city: v }))} required
                                 error={u.needDelivery} showError={tried && !addr.city.trim()} />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* --- dane kontaktowe ------------------------------------ */}
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <h2 className="text-white font-semibold">{u.contact}</h2>
                    {offer.customer?.email ? (
                      <>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2">
                          <span className="block text-neutral-500 text-[11px]">{u.email}</span>
                          <span className="block text-neutral-200 text-sm">{offer.customer.email}</span>
                        </div>
                        <p className="text-neutral-600 text-[11px] leading-relaxed">{u.emailLocked}</p>
                        <Field label={u.name} value={customer.name} onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} required
                               error={u.needCustomer} showError={tried && !customer.name.trim()} />
                        <Field label={u.phone} value={customer.phone} onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} type="tel" required
                               error={u.needCustomer} showError={tried && !customer.phone.trim()} />
                      </>
                    ) : (
                      <CustomerFields
                        value={customer}
                        onChange={setCustomer}
                        labels={{ email: u.email, name: u.name, phone: u.phone }}
                        lang={lang}
                        showErrors={tried}
                      />
                    )}
                  </section>

                  {/* --- podsumowanie i zaplata ----------------------------- */}
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h2 className="text-white font-semibold">{u.summary}</h2>

                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-neutral-400">{u.itemsTotal}</dt>
                        <dd className="text-neutral-200">{money(itemsTotal)}</dd>
                      </div>
                      {discountGrosze > 0 && (
                        <div className="flex justify-between">
                          <dt className="text-emerald-300">{u.discountRow} {discount.code}</dt>
                          <dd className="text-emerald-300">-{money(discountGrosze)}</dd>
                        </div>
                      )}
                      {wybrana && (
                        <div className="flex justify-between">
                          <dt className="text-neutral-400">{u.shippingRow}</dt>
                          <dd className="text-neutral-200">{money(shipping)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-white/10">
                        <dt className="text-white font-semibold">{u.summary}</dt>
                        <dd className="text-white font-bold text-lg">{money(doZaplaty)}</dd>
                      </div>
                    </dl>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={consents.terms}
                             onChange={(e) => setConsents((c) => ({ ...c, terms: e.target.checked }))}
                             className="mt-0.5 accent-amber-400" />
                      <span className="text-neutral-400 text-xs leading-relaxed">
                        {u.terms} (<Link to="/terms/" className="text-amber-400 hover:text-amber-300">/terms</Link>,{" "}
                        <Link to="/privacy/" className="text-amber-400 hover:text-amber-300">/privacy</Link>)
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={consents.waiveWithdrawal}
                             onChange={(e) => setConsents((c) => ({ ...c, waiveWithdrawal: e.target.checked }))}
                             className="mt-0.5 accent-amber-400" />
                      <span className="text-neutral-400 text-xs leading-relaxed">{u.waive}</span>
                    </label>

                    {tried && !gotowe && (
                      <p className="text-amber-300 text-xs">
                        {!adresOk ? u.needDelivery : !daneOk ? u.needCustomer : u.needTerms}
                      </p>
                    )}
                    {error && <p className="text-red-300 text-xs">{error}</p>}

                    <button
                      type="button"
                      onClick={pay}
                      disabled={paying}
                      className="w-full py-3 rounded-xl bg-amber-400 text-neutral-950 font-medium hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {paying ? (
                        <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {u.paying}</span>
                      ) : (
                        `${u.pay} ${money(doZaplaty)}`
                      )}
                    </button>

                    <p className="text-neutral-600 text-[11px] leading-relaxed flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {u.payNote}
                    </p>
                  </section>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
