// ============================================================
// STATUS ZAMOWIENIA, strona powrotu z bramki platniczej
// ============================================================
// Klient trafia tu po zaplacie. Strona niczego nie zmienia, tylko
// odpytuje backend o stan zamowienia. Status ustawia wylacznie
// komunikat ITN od Autopay, bo tylko on jest podpisany kluczem.

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "../i18n/nav.jsx";
import { CheckCircle2, Clock, XCircle, Loader2, ArrowRight, RefreshCw, Hammer, Truck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import {
  forgetOrderAccessToken,
  orderStatusLocationWithoutToken,
  resolveOrderAccessToken,
  sessionStorageFor,
} from "../shop/orderStatusAccess.js";
import { postJSON, submitPaymentForm } from "../utils/api.js";

const API = import.meta.env.VITE_CHAT_API_URL;

// Stany, w ktorych nie ma juz na co czekac: pieniadze doszly, czekaja na nasza
// reczna decyzje albo praca poszla dalej. Zamowienie w robocie odpytywane piec
// razy z rzedu nie zmieni sie od patrzenia, a kazdy strzal to zapytanie do bazy.
const STANY_USTALONE = [
  "paid",
  "awaiting_transfer",
  "payment_review",
  "in_production",
  "shipped",
  "completed",
];

/** Wiersz danych do przelewu. Numer rachunku i tytul musza byc latwe do
 *  przepisania, wiec ida czcionka o stalej szerokosci i lamia sie w calosci. */
function TransferRow({ label, value, mono, highlight }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5">
      <span className="text-neutral-500 text-xs">{label}</span>
      <span className={`text-sm break-all ${mono ? "font-mono text-xs" : ""} ${highlight ? "text-blue-300 font-semibold" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

const UI = {
  pl: {
    title: "Status zamówienia",
    checking: "Sprawdzam status płatności",
    paidTitle: "Dziękujemy, płatność przyjęta",
    paidDesc: "Potwierdzenie wysłaliśmy na Twój adres email. Zabieramy się do pracy i odezwiemy się, gdy zamówienie będzie gotowe.",
    productionTitle: "Zamówienie jest w robocie",
    productionDesc: "Płatność mamy, praca ruszyła. Odezwiemy się, gdy zamówienie będzie gotowe do wysyłki. Nie musisz nic robić.",
    shippedTitle: "Zamówienie wysłane",
    shippedDesc: "Paczka jest w drodze. Jeżeli przesyłka ma numer do śledzenia, znajdziesz go poniżej.",
    completedTitle: "Zamówienie zakończone",
    completedDesc: "Dziękujemy. Jeżeli coś jest nie tak z wyrobem, napisz do nas, odpowiadamy na każdą wiadomość.",
    shippedAtLabel: "Data wysyłki",
    trackingLabel: "Numer przesyłki",
    pendingTitle: "Czekamy na potwierdzenie płatności",
    pendingDesc: "Bank jeszcze nie potwierdził przelewu. To zwykle kwestia kilku minut, przy przelewie tradycyjnym do jednego dnia roboczego. Nie musisz nic robić, potwierdzenie przyjdzie mailem.",
    failedTitle: "Płatność nie doszła do skutku",
    failedDesc: "Nic nie zostało pobrane. Możesz spróbować ponownie albo napisać do nas, pomożemy dokończyć zamówienie.",
    reviewTitle: "Płatność wymaga naszej weryfikacji",
    reviewDesc: "Operator potwierdził wpłatę, ale zamówienie było już zamknięte albo kwota wymaga sprawdzenia. Nie płać ponownie. Skontaktujemy się z Tobą po ręcznej weryfikacji.",
    invalidTitle: "Nie udało się potwierdzić tego zamówienia",
    invalidDesc: "Podpis linku powrotnego jest nieprawidłowy. Jeśli płatność została pobrana, napisz do nas z numerem zamówienia, sprawdzimy to ręcznie.",
    accessTitle: "Ten link nie daje dostępu do zamówienia",
    accessDesc: "Ze względów bezpieczeństwa pełny status wymaga prywatnego linku otrzymanego po złożeniu zamówienia. Napisz do nas z numerem zamówienia, prześlemy nowy link.",
    notFound: "Nie znaleziono takiego zamówienia",
    orderNo: "Numer zamówienia",
    amount: "Kwota",
    revisions: "Wykorzystane poprawki",
    contact: "Napisz do nas",
    home: "Wróć na stronę główną",
    transferTitle: "Zamówienie przyjęte, czekamy na przelew",
    transferDesc: "Nic nie zostało pobrane. Poniżej masz dane do przelewu. Ten sam komplet wysłaliśmy Ci mailem.",
    transferAmount: "Kwota do przelewu",
    transferIban: "Numer rachunku (IBAN)",
    transferBic: "BIC / SWIFT",
    transferHolder: "Odbiorca",
    transferBank: "Bank",
    transferRef: "Tytuł przelewu",
    transferDue: "Rezerwacja i kwota obowiązują do",
    transferAfter: "Po zaksięgowaniu wpłaty potwierdzamy ją ręcznie i wysyłamy potwierdzenie przyjęcia należności wraz z informacją o rozpoczęciu prac. Termin realizacji liczymy od tego momentu. Towar rezerwujemy dla Ciebie przez 3 dni robocze. Jeżeli czwartego dnia roboczego wpłata nie zostanie zaksięgowana na wskazanym koncie, rezerwacja zostaje zdjęta, a towar wraca do sprzedaży.",
    transferMissing: "Dane rachunku nie są jeszcze skonfigurowane. Napisz do nas, prześlemy je od ręki.",
  },
  en: {
    title: "Order status",
    checking: "Checking payment status",
    paidTitle: "Thank you, payment received",
    paidDesc: "We have sent a confirmation to your email address. We are starting work and will get in touch once your order is ready.",
    productionTitle: "Your order is in the workshop",
    productionDesc: "We have your payment and the work has started. We will get in touch once the order is ready to ship. You do not need to do anything.",
    shippedTitle: "Your order has been shipped",
    shippedDesc: "The parcel is on its way. If the shipment has a tracking number, you will find it below.",
    completedTitle: "Order completed",
    completedDesc: "Thank you. If anything is wrong with the piece, write to us, we answer every message.",
    shippedAtLabel: "Shipping date",
    trackingLabel: "Tracking number",
    pendingTitle: "Waiting for payment confirmation",
    pendingDesc: "Your bank has not confirmed the transfer yet. This usually takes a few minutes, or up to one business day for a traditional transfer. You do not need to do anything, the confirmation will arrive by email.",
    failedTitle: "The payment did not go through",
    failedDesc: "Nothing has been charged. You can try again or write to us and we will help you complete the order.",
    reviewTitle: "Your payment needs our review",
    reviewDesc: "The provider confirmed the payment, but the order was already closed or the amount needs checking. Do not pay again. We will contact you after a manual review.",
    invalidTitle: "We could not confirm this order",
    invalidDesc: "The signature of the return link is invalid. If you were charged, write to us with the order number and we will check it manually.",
    accessTitle: "This link cannot access the order",
    accessDesc: "For security, the full status requires the private link received after placing the order. Write to us with the order number and we will send a new link.",
    notFound: "Order not found",
    orderNo: "Order number",
    amount: "Amount",
    revisions: "Revisions used",
    contact: "Write to us",
    home: "Back to home page",
    transferTitle: "Order received, waiting for your transfer",
    transferDesc: "Nothing has been charged. Below are the transfer details. We sent you the same set by email.",
    transferAmount: "Amount to transfer",
    transferIban: "Account number (IBAN)",
    transferBic: "BIC / SWIFT",
    transferHolder: "Beneficiary",
    transferBank: "Bank",
    transferRef: "Payment reference",
    transferDue: "Reservation and amount valid until",
    transferAfter: "Once the money clears we confirm it by hand and send you a receipt confirmation together with a note that work has started. The lead time is counted from that moment. We reserve the goods for you for 3 business days. If the payment has not cleared on the stated account by the fourth business day, the reservation is released and the goods go back on sale.",
    transferMissing: "The account details are not configured yet. Write to us and we will send them straight away.",
  },
  de: {
    title: "Bestellstatus",
    checking: "Zahlungsstatus wird geprüft",
    paidTitle: "Vielen Dank, Zahlung erhalten",
    paidDesc: "Die Bestätigung haben wir an Ihre E-Mail-Adresse gesendet. Wir beginnen mit der Arbeit und melden uns, sobald Ihre Bestellung fertig ist.",
    productionTitle: "Ihre Bestellung ist in Arbeit",
    productionDesc: "Die Zahlung ist bei uns, die Arbeit hat begonnen. Wir melden uns, sobald die Bestellung versandfertig ist. Sie müssen nichts tun.",
    shippedTitle: "Ihre Bestellung wurde versandt",
    shippedDesc: "Das Paket ist unterwegs. Sofern die Sendung eine Sendungsnummer hat, finden Sie sie unten.",
    completedTitle: "Bestellung abgeschlossen",
    completedDesc: "Vielen Dank. Falls mit dem Stück etwas nicht stimmt, schreiben Sie uns, wir beantworten jede Nachricht.",
    shippedAtLabel: "Versanddatum",
    trackingLabel: "Sendungsnummer",
    pendingTitle: "Wir warten auf die Zahlungsbestätigung",
    pendingDesc: "Ihre Bank hat die Überweisung noch nicht bestätigt. Das dauert meist wenige Minuten, bei einer klassischen Überweisung bis zu einem Werktag. Sie müssen nichts tun, die Bestätigung kommt per E-Mail.",
    failedTitle: "Die Zahlung kam nicht zustande",
    failedDesc: "Es wurde nichts abgebucht. Sie können es erneut versuchen oder uns schreiben, wir helfen beim Abschluss der Bestellung.",
    reviewTitle: "Ihre Zahlung muss geprüft werden",
    reviewDesc: "Der Zahlungsanbieter hat den Eingang bestätigt, aber die Bestellung war bereits geschlossen oder der Betrag muss geprüft werden. Zahlen Sie nicht erneut. Wir melden uns nach der manuellen Prüfung.",
    invalidTitle: "Diese Bestellung konnte nicht bestätigt werden",
    invalidDesc: "Die Signatur des Rücksprunglinks ist ungültig. Falls abgebucht wurde, schreiben Sie uns mit der Bestellnummer, wir prüfen das manuell.",
    accessTitle: "Dieser Link gibt keinen Zugriff auf die Bestellung",
    accessDesc: "Aus Sicherheitsgründen erfordert der vollständige Status den privaten Link, den Sie nach der Bestellung erhalten haben. Schreiben Sie uns mit der Bestellnummer, dann senden wir einen neuen Link.",
    notFound: "Bestellung nicht gefunden",
    orderNo: "Bestellnummer",
    amount: "Betrag",
    revisions: "Genutzte Korrekturen",
    contact: "Schreiben Sie uns",
    home: "Zurück zur Startseite",
    transferTitle: "Bestellung eingegangen, wir warten auf Ihre Überweisung",
    transferDesc: "Es wurde nichts abgebucht. Unten finden Sie die Überweisungsdaten. Dieselben Angaben haben wir Ihnen per E-Mail geschickt.",
    transferAmount: "Zu überweisender Betrag",
    transferIban: "Kontonummer (IBAN)",
    transferBic: "BIC / SWIFT",
    transferHolder: "Empfänger",
    transferBank: "Bank",
    transferRef: "Verwendungszweck",
    transferDue: "Reservierung und Betrag gültig bis",
    transferAfter: "Nach Geldeingang bestätigen wir ihn persönlich und senden Ihnen die Zahlungsbestätigung samt Hinweis, dass die Arbeit beginnt. Die Lieferzeit zählt ab diesem Moment. Wir reservieren die Ware 3 Werktage lang für Sie. Ist die Zahlung bis zum vierten Werktag nicht auf dem angegebenen Konto eingegangen, wird die Reservierung aufgehoben und die Ware geht zurück in den Verkauf.",
    transferMissing: "Die Kontodaten sind noch nicht hinterlegt. Schreiben Sie uns, wir senden sie umgehend.",
  },
};

export default function OrderStatus() {
  const { lang, t } = useLanguage();
  const u = UI[lang] || UI.en;
  const [search] = useSearchParams();
  const ref = search.get("ref");
  const tokenFromUrl = search.get("token");
  const signatureError = search.get("error") === "invalid_signature";
  const [token, setToken] = useState(null);
  const [accessResolved, setAccessResolved] = useState(false);
  const missingAccess = Boolean(accessResolved && ref && !token && !signatureError);

  const [order, setOrder] = useState(null);
  // Pierwszy render jest taki sam w prerenderze i przegladarce. Dopiero efekt
  // rozstrzyga dostep z URL albo sessionStorage, bez migania ekranu odmowy.
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  useEffect(() => {
    setAccessResolved(false);
    setOrder(null);
    setNotFound(false);
    setRetryError("");

    if (!ref || signatureError || typeof window === "undefined") {
      setToken(null);
      setAccessResolved(true);
      setLoading(false);
      return;
    }

    // Token z nowego linku ma pierwszenstwo i jest zapisywany przed usunieciem
    // go z adresu. sessionStorage przezywa F5, ale pozostaje zwiazany z sesja karty.
    const resolved = resolveOrderAccessToken({
      orderRef: ref,
      urlToken: tokenFromUrl,
      storage: sessionStorageFor(window),
    });
    setToken(resolved);
    setAccessResolved(true);
    setLoading(Boolean(resolved));

    if (tokenFromUrl) {
      window.history.replaceState(
        window.history.state,
        "",
        orderStatusLocationWithoutToken(window.location.href)
      );
    }
  }, [ref, tokenFromUrl, signatureError]);

  useEffect(() => {
    if (!accessResolved || !ref || !token || signatureError || !API) return;
    let cancelled = false;
    let attempts = 0;

    // ITN potrafi dotrzec chwile po powrocie klienta, wiec kilka razy
    // odpytujemy status, zamiast od razu straszyc go komunikatem o braku wplaty.
    async function check() {
      try {
        const resp = await fetch(`${API}/api/orders/${encodeURIComponent(ref)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (resp.status === 404) {
          if (!cancelled) {
            if (typeof window !== "undefined") {
              forgetOrderAccessToken({ orderRef: ref, storage: sessionStorageFor(window) });
            }
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const data = await resp.json();
        if (cancelled) return;
        setOrder(data);
        setLoading(false);
        // Przy przelewie nie ma czego odpytywac: potwierdzenie przychodzi
        // z naszej strony, nie z bramki.
        if (!STANY_USTALONE.includes(data.status) && attempts < 5) {
          attempts++;
          setTimeout(check, 3000);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [accessResolved, ref, token, signatureError]);

  const paid = order?.status === "paid";
  // Etapy pracy z kolejki pracowni. Bez nich zamowienie pchniete do produkcji
  // spadalo na galaz domyslna i mowilo oplaconemu klientowi, ze czekamy na
  // jego platnosc. Stoja w lancuchu PRZED `failed`, bo pozniejsza nieudana
  // proba platnosci nie cofa zamowienia, ktore juz jest w robocie.
  const inProduction = order?.status === "in_production";
  const shipped = order?.status === "shipped";
  const completed = order?.status === "completed";
  const failed = order?.paymentStatus === "FAILURE";
  const paymentReview = order?.status === "payment_review";
  const canRetry = Boolean(order?.canRetryPayment && token);
  // Przelew czeka na nasze reczne potwierdzenie, wiec ta strona nie jest
  // "czekamy na bank", tylko instrukcja, co klient ma teraz zrobic.
  const awaitingTransfer = order?.status === "awaiting_transfer";
  const tr = order?.transfer || null;

  async function retryPayment() {
    if (!API || !ref || !token || retrying) return;
    setRetrying(true);
    setRetryError("");
    try {
      const payment = await postJSON(`${API}/api/orders/${encodeURIComponent(ref)}/pay`, {
        token,
        gatewayId: 0,
      });
      if (!payment.ok) {
        setRetrying(false);
        setRetryError(payment.data?.error || t.orderStatus.retryFailed);
        return;
      }
      submitPaymentForm(payment.data, () => {
        setRetrying(false);
        setRetryError(t.orderStatus.retryFailed);
      });
    } catch {
      setRetrying(false);
      setRetryError(t.orderStatus.retryFailed);
    }
  }

  let icon = <Clock className="w-12 h-12 text-amber-400" />;
  let title = u.pendingTitle;
  let desc = u.pendingDesc;

  if (awaitingTransfer) {
    title = u.transferTitle;
    desc = u.transferDesc;
  }

  if (signatureError) {
    icon = <XCircle className="w-12 h-12 text-red-400" />;
    title = u.invalidTitle;
    desc = u.invalidDesc;
  } else if (inProduction) {
    icon = <Hammer className="w-12 h-12 text-amber-400" />;
    title = u.productionTitle;
    desc = u.productionDesc;
  } else if (shipped) {
    icon = <Truck className="w-12 h-12 text-blue-400" />;
    title = u.shippedTitle;
    desc = u.shippedDesc;
  } else if (completed) {
    icon = <CheckCircle2 className="w-12 h-12 text-emerald-400" />;
    title = u.completedTitle;
    desc = u.completedDesc;
  } else if (paid) {
    icon = <CheckCircle2 className="w-12 h-12 text-emerald-400" />;
    title = u.paidTitle;
    desc = u.paidDesc;
  } else if (failed) {
    icon = <XCircle className="w-12 h-12 text-red-400" />;
    title = u.failedTitle;
    desc = u.failedDesc;
  } else if (paymentReview) {
    icon = <Clock className="w-12 h-12 text-amber-400" />;
    title = u.reviewTitle;
    desc = u.reviewDesc;
  }

  return (
    <>
      <SEOHead pageKey="orderStatus" path="/order/status" noindex schemas={[]} />
      <div className="min-h-[80vh] bg-neutral-950 pt-28 pb-20 px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">{u.checking}</span>
            </div>
          ) : missingAccess ? (
            <>
              <XCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-white mb-3">{u.accessTitle}</h1>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">{u.accessDesc}</p>
            </>
          ) : notFound ? (
            <>
              <XCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-white mb-6">{u.notFound}</h1>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-5">{icon}</div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">{title}</h1>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">{desc}</p>

              {canRetry && (
                <button
                  type="button"
                  onClick={retryPayment}
                  disabled={retrying}
                  className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
                  {retrying
                    ? t.orderStatus.retryingPayment
                    : failed ? t.orderStatus.retryPayment : t.orderStatus.payNow}
                </button>
              )}

              {failed && !canRetry && (
                <p className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-200">
                  {t.orderStatus.retryUnavailable}
                </p>
              )}

              {retryError && (
                <p className="mb-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-xs leading-relaxed text-red-200">
                  {retryError}
                </p>
              )}

              {awaitingTransfer && (
                tr?.iban ? (
                  <div className="rounded-xl border border-blue-400/25 bg-blue-400/[0.05] p-4 mb-6 text-left">
                    <div className="text-center pb-3 mb-3 border-b border-white/10">
                      <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{u.transferAmount}</div>
                      <div className="text-3xl font-extrabold text-white tabular-nums">{tr.amountEur} EUR</div>
                    </div>
                    <TransferRow label={u.transferIban} value={tr.iban} mono />
                    {tr.bic && <TransferRow label={u.transferBic} value={tr.bic} mono />}
                    {tr.holder && <TransferRow label={u.transferHolder} value={tr.holder} />}
                    {tr.bank && <TransferRow label={u.transferBank} value={tr.bank} />}
                    <TransferRow label={u.transferRef} value={tr.reference} mono highlight />
                    {tr.dueAt && (
                      <TransferRow label={u.transferDue} value={new Date(tr.dueAt).toLocaleDateString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-IE")} />
                    )}
                    <p className="text-neutral-500 text-xs leading-relaxed mt-3 pt-3 border-t border-white/10">
                      {u.transferAfter}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 mb-6">
                    <p className="text-amber-200 text-xs leading-relaxed">{u.transferMissing}</p>
                  </div>
                )
              )}

              {order && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-500">{u.orderNo}</span>
                    <span className="text-white font-mono text-xs">{order.orderRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{u.amount}</span>
                    <span className="text-white font-semibold">{String(order.totalPLN).replace(".", ",")} PLN</span>
                  </div>
                  {/* Numer przesylki pokazujemy klientowi, bo pytanie "gdzie jest
                      paczka" inaczej wraca do nas mailem i odpowiada na nie czlowiek. */}
                  {order.shippedAt && (
                    <div className="flex justify-between mt-1">
                      <span className="text-neutral-500">{u.shippedAtLabel}</span>
                      <span className="text-white">
                        {new Date(order.shippedAt).toLocaleDateString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-IE")}
                      </span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex justify-between mt-1 gap-3">
                      <span className="text-neutral-500 shrink-0">{u.trackingLabel}</span>
                      <span className="text-white font-mono text-xs break-all text-right">{order.trackingNumber}</span>
                    </div>
                  )}
                  {/* Licznik poprawek widoczny od poczatku, zeby trzecia runda
                      byla swiadomym wyborem, a nie niespodzianka przy rachunku. */}
                  {order.revisions && (
                    <div className="flex justify-between mt-1">
                      <span className="text-neutral-500">{u.revisions}</span>
                      <span className="text-white">
                        {order.revisions.used} / {order.revisions.included}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Link
              to="/contact/"
              className="px-5 py-2.5 rounded-lg border border-white/10 text-neutral-300 hover:border-white/20 hover:text-white text-sm transition-colors"
            >
              {u.contact}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 text-neutral-300 hover:bg-white/10 text-sm transition-colors"
            >
              {u.home} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
