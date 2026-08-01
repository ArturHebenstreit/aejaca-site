// ============================================================
// STATUS ZAMOWIENIA, strona powrotu z bramki platniczej
// ============================================================
// Klient trafia tu po zaplacie. Strona niczego nie zmienia, tylko
// odpytuje backend o stan zamowienia. Status ustawia wylacznie
// komunikat ITN od Autopay, bo tylko on jest podpisany kluczem.

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";

const API = import.meta.env.VITE_CHAT_API_URL;

const UI = {
  pl: {
    title: "Status zamówienia",
    checking: "Sprawdzam status płatności",
    paidTitle: "Dziękujemy, płatność przyjęta",
    paidDesc: "Potwierdzenie wysłaliśmy na Twój adres email. Zabieramy się do pracy i odezwiemy się, gdy zamówienie będzie gotowe.",
    pendingTitle: "Czekamy na potwierdzenie płatności",
    pendingDesc: "Bank jeszcze nie potwierdził przelewu. To zwykle kwestia kilku minut, przy przelewie tradycyjnym do jednego dnia roboczego. Nie musisz nic robić, potwierdzenie przyjdzie mailem.",
    failedTitle: "Płatność nie doszła do skutku",
    failedDesc: "Nic nie zostało pobrane. Możesz spróbować ponownie albo napisać do nas, pomożemy dokończyć zamówienie.",
    invalidTitle: "Nie udało się potwierdzić tego zamówienia",
    invalidDesc: "Podpis linku powrotnego jest nieprawidłowy. Jeśli płatność została pobrana, napisz do nas z numerem zamówienia, sprawdzimy to ręcznie.",
    notFound: "Nie znaleziono takiego zamówienia",
    orderNo: "Numer zamówienia",
    amount: "Kwota",
    revisions: "Wykorzystane poprawki",
    contact: "Napisz do nas",
    home: "Wróć na stronę główną",
  },
  en: {
    title: "Order status",
    checking: "Checking payment status",
    paidTitle: "Thank you, payment received",
    paidDesc: "We have sent a confirmation to your email address. We are starting work and will get in touch once your order is ready.",
    pendingTitle: "Waiting for payment confirmation",
    pendingDesc: "Your bank has not confirmed the transfer yet. This usually takes a few minutes, or up to one business day for a traditional transfer. You do not need to do anything, the confirmation will arrive by email.",
    failedTitle: "The payment did not go through",
    failedDesc: "Nothing has been charged. You can try again or write to us and we will help you complete the order.",
    invalidTitle: "We could not confirm this order",
    invalidDesc: "The signature of the return link is invalid. If you were charged, write to us with the order number and we will check it manually.",
    notFound: "Order not found",
    orderNo: "Order number",
    amount: "Amount",
    revisions: "Revisions used",
    contact: "Write to us",
    home: "Back to home page",
  },
  de: {
    title: "Bestellstatus",
    checking: "Zahlungsstatus wird geprüft",
    paidTitle: "Vielen Dank, Zahlung erhalten",
    paidDesc: "Die Bestätigung haben wir an Ihre E-Mail-Adresse gesendet. Wir beginnen mit der Arbeit und melden uns, sobald Ihre Bestellung fertig ist.",
    pendingTitle: "Wir warten auf die Zahlungsbestätigung",
    pendingDesc: "Ihre Bank hat die Überweisung noch nicht bestätigt. Das dauert meist wenige Minuten, bei einer klassischen Überweisung bis zu einem Werktag. Sie müssen nichts tun, die Bestätigung kommt per E-Mail.",
    failedTitle: "Die Zahlung kam nicht zustande",
    failedDesc: "Es wurde nichts abgebucht. Sie können es erneut versuchen oder uns schreiben, wir helfen beim Abschluss der Bestellung.",
    invalidTitle: "Diese Bestellung konnte nicht bestätigt werden",
    invalidDesc: "Die Signatur des Rücksprunglinks ist ungültig. Falls abgebucht wurde, schreiben Sie uns mit der Bestellnummer, wir prüfen das manuell.",
    notFound: "Bestellung nicht gefunden",
    orderNo: "Bestellnummer",
    amount: "Betrag",
    revisions: "Genutzte Korrekturen",
    contact: "Schreiben Sie uns",
    home: "Zurück zur Startseite",
  },
};

export default function OrderStatus() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const [search] = useSearchParams();
  const ref = search.get("ref");
  const signatureError = search.get("error") === "invalid_signature";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(ref) && !signatureError);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ref || signatureError || !API) return;
    let cancelled = false;
    let attempts = 0;

    // ITN potrafi dotrzec chwile po powrocie klienta, wiec kilka razy
    // odpytujemy status, zamiast od razu straszyc go komunikatem o braku wplaty.
    async function check() {
      try {
        const resp = await fetch(`${API}/api/orders/${encodeURIComponent(ref)}`);
        if (resp.status === 404) {
          if (!cancelled) { setNotFound(true); setLoading(false); }
          return;
        }
        const data = await resp.json();
        if (cancelled) return;
        setOrder(data);
        setLoading(false);
        if (data.status !== "paid" && attempts < 5) {
          attempts++;
          setTimeout(check, 3000);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [ref, signatureError]);

  const paid = order?.status === "paid";
  const failed = order?.payment_status === "FAILURE";

  let icon = <Clock className="w-12 h-12 text-amber-400" />;
  let title = u.pendingTitle;
  let desc = u.pendingDesc;

  if (signatureError) {
    icon = <XCircle className="w-12 h-12 text-red-400" />;
    title = u.invalidTitle;
    desc = u.invalidDesc;
  } else if (paid) {
    icon = <CheckCircle2 className="w-12 h-12 text-emerald-400" />;
    title = u.paidTitle;
    desc = u.paidDesc;
  } else if (failed) {
    icon = <XCircle className="w-12 h-12 text-red-400" />;
    title = u.failedTitle;
    desc = u.failedDesc;
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
