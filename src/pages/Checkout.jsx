// ============================================================
// FINALIZACJA ZAMOWIENIA
// ============================================================
// Zgody nie sa jedne na cale zamowienie, tylko zalezne od tego, co lezy
// w koszyku. Rzecz gotowa ma pelne 14 dni na zwrot, rzecz wykonywana na
// zamowienie nie ma go wcale, a tresc cyfrowa traci je z chwila pobrania.
// Zbiorcza zgoda "akceptuje wszystko" bylaby przy tym nieskuteczna.

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { useCart } from "../cart/CartContext.jsx";
import { DELIVERY_METHODS } from "../data/orderCatalog.js";
import { t } from "../pricing/config.js";
import { API_URL, postJSON, submitPaymentForm } from "../utils/api.js";

const UI = {
  pl: {
    title: "Zamówienie",
    empty: "Koszyk jest pusty",
    toShop: "Przejdź do sklepu",
    yourData: "Twoje dane",
    name: "Imię i nazwisko",
    email: "Adres email",
    phone: "Telefon",
    delivery: "Dostawa",
    address: "Adres",
    postal: "Kod pocztowy",
    city: "Miasto",
    lockerCode: "Kod paczkomatu",
    consents: "Zgody",
    consentTerms: "Akceptuję regulamin i politykę prywatności",
    consentMade: "Zamawiam rzecz wykonywaną według mojej specyfikacji i przyjmuję do wiadomości, że po rozpoczęciu wykonania tracę prawo odstąpienia od umowy",
    consentDigital: "Żądam dostarczenia treści cyfrowej przed upływem terminu na odstąpienie i przyjmuję do wiadomości, że z chwilą rozpoczęcia pobierania tracę prawo odstąpienia",
    summary: "Podsumowanie",
    items: "Pozycje",
    shipping: "Dostawa",
    total: "Do zapłaty",
    payMethod: "Metoda płatności",
    payAny: "Wybiorę na stronie płatności",
    pay: "Zapłać",
    processing: "Przetwarzam",
    back: "Wróć do koszyka",
    terms: "Regulamin",
    privacy: "Polityka prywatności",
    blocked: "Nie udało się otworzyć strony płatności. Zamówienie jest zapisane, napisz do nas z jego numerem, a prześlemy link do zapłaty.",
    timeout: "Serwer nie odpowiedział w wyznaczonym czasie. Spróbuj ponownie albo napisz do nas.",
    generic: "Coś poszło nie tak",
  },
  en: {
    title: "Order",
    empty: "Your cart is empty",
    toShop: "Go to the shop",
    yourData: "Your details",
    name: "Full name",
    email: "Email address",
    phone: "Phone",
    delivery: "Delivery",
    address: "Address",
    postal: "Postal code",
    city: "City",
    lockerCode: "Locker code",
    consents: "Consents",
    consentTerms: "I accept the Terms of Service and the Privacy Policy",
    consentMade: "I am ordering an item made to my specification and acknowledge that once production begins I lose the right of withdrawal",
    consentDigital: "I request delivery of the digital content before the withdrawal period ends and acknowledge that once the download starts I lose the right of withdrawal",
    summary: "Summary",
    items: "Items",
    shipping: "Delivery",
    total: "To pay",
    payMethod: "Payment method",
    payAny: "I will choose on the payment page",
    pay: "Pay",
    processing: "Processing",
    back: "Back to cart",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    blocked: "We could not open the payment page. Your order is saved, write to us with its number and we will send a payment link.",
    timeout: "The server did not respond in time. Please try again or write to us.",
    generic: "Something went wrong",
  },
  de: {
    title: "Bestellung",
    empty: "Ihr Warenkorb ist leer",
    toShop: "Zum Shop",
    yourData: "Ihre Daten",
    name: "Vor- und Nachname",
    email: "E-Mail-Adresse",
    phone: "Telefon",
    delivery: "Lieferung",
    address: "Adresse",
    postal: "Postleitzahl",
    city: "Stadt",
    lockerCode: "Paketstationscode",
    consents: "Einwilligungen",
    consentTerms: "Ich akzeptiere die AGB und die Datenschutzerklärung",
    consentMade: "Ich bestelle eine nach meinen Vorgaben gefertigte Sache und nehme zur Kenntnis, dass mit Fertigungsbeginn das Widerrufsrecht erlischt",
    consentDigital: "Ich verlange die Lieferung des digitalen Inhalts vor Ablauf der Widerrufsfrist und nehme zur Kenntnis, dass mit Beginn des Downloads das Widerrufsrecht erlischt",
    summary: "Zusammenfassung",
    items: "Positionen",
    shipping: "Lieferung",
    total: "Zu zahlen",
    payMethod: "Zahlungsmethode",
    payAny: "Ich wähle auf der Zahlungsseite",
    pay: "Bezahlen",
    processing: "Wird verarbeitet",
    back: "Zurück zum Warenkorb",
    terms: "AGB",
    privacy: "Datenschutz",
    blocked: "Die Zahlungsseite konnte nicht geöffnet werden. Ihre Bestellung ist gespeichert, schreiben Sie uns mit der Nummer.",
    timeout: "Der Server hat nicht rechtzeitig geantwortet. Bitte erneut versuchen oder uns schreiben.",
    generic: "Etwas ist schiefgelaufen",
  },
};

const money = (g) => `${(g / 100).toFixed(2).replace(".", ",")} PLN`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <label className="block mb-4">
      <span className="block text-[11px] uppercase tracking-wide text-neutral-500 mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm
                   placeholder:text-neutral-600 focus:border-blue-400/50 focus:outline-none transition-colors"
      />
    </label>
  );
}

function Consent({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-3 mb-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0"
      />
      <span className="text-neutral-400 text-xs leading-relaxed">{children}</span>
    </label>
  );
}

export default function Checkout() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const navigate = useNavigate();
  const { items, subtotalGrosze, ready, clear } = useCart();

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [deliveryId, setDeliveryId] = useState("inpost_locker");
  const [addr, setAddr] = useState({ line1: "", postalCode: "", city: "", point: "" });
  const [consents, setConsents] = useState({ terms: false, waiveWithdrawal: false, digitalImmediate: false });
  const [gatewayId, setGatewayId] = useState(0);
  const [methods, setMethods] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Zgody zalezne od zawartosci koszyka, nie od zamowienia jako calosci.
  const hasMadeToOrder = items.some((i) => i.withdrawal === "made_to_order" || i.kind === "service");
  const hasDigital = items.some((i) => i.withdrawal === "digital");
  const onlyDigital = items.length > 0 && items.every((i) => i.withdrawal === "digital");

  const delivery = onlyDigital
    ? { id: "digital", grosze: 0, label: { pl: "Dostawa cyfrowa", en: "Digital delivery", de: "Digitale Lieferung" } }
    : DELIVERY_METHODS.find((d) => d.id === deliveryId) || DELIVERY_METHODS[0];

  const totalGrosze = subtotalGrosze + delivery.grosze;

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/payment-methods`)
      .then((r) => r.json())
      .then((d) => setMethods(d.gateways || []))
      .catch(() => setMethods([]));
  }, []);

  const addressOk =
    onlyDigital ||
    deliveryId === "pickup" ||
    (deliveryId === "inpost_locker" ? addr.point.trim().length > 2 : addr.line1 && addr.postalCode && addr.city);

  const consentsOk =
    consents.terms &&
    (!hasMadeToOrder || consents.waiveWithdrawal) &&
    (!hasDigital || consents.digitalImmediate);

  const canPay = items.length > 0 && EMAIL_RE.test(customer.email) && addressOk && consentsOk && !busy;

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      if (!API_URL) {
        setError("Brak adresu API. Napisz do nas, zamowienie nie zostalo zlozone.");
        setBusy(false);
        return;
      }

      const created = await postJSON(`${API_URL}/api/orders`, {
        lang,
        items: items.map((i) => ({
          calculator: i.calculator,
          params: i.params,
          geometry: i.geometry || null,
          fileName: i.fileName || null,
          uploadToken: i.uploadToken || null,
          packagingId: i.packagingId || null,
          personalization: i.personalization || null,
          qty: i.qty || 1,
        })),
        customer,
        delivery: {
          method: delivery.id,
          shippingGrosze: delivery.grosze,
          point: addr.point || null,
          addressLine1: addr.line1 || null,
          postalCode: addr.postalCode || null,
          city: addr.city || null,
        },
        consents,
      });

      if (!created.ok) {
        setError(
          [created.data?.error || `${u.generic} (${created.status})`, created.data?.detail]
            .filter(Boolean)
            .join(" — ".replace(" — ", ": "))
        );
        setBusy(false);
        return;
      }

      const payment = await postJSON(`${API_URL}/api/orders/${created.data.orderRef}/pay`, {
        token: created.data.token,
        gatewayId,
      });

      if (!payment.ok) {
        setError(payment.data?.error || `${u.generic} (${payment.status})`);
        setBusy(false);
        return;
      }

      // Koszyk czyscimy dopiero teraz. Gdyby cokolwiek zawiodlo wczesniej,
      // klient wraca do pelnego koszyka, a nie do pustej strony.
      clear();
      submitPaymentForm(payment.data, () => {
        setBusy(false);
        setError(u.blocked);
      });
    } catch (e) {
      console.error("[checkout] blad:", e);
      setError(e?.name === "AbortError" ? u.timeout : `${u.generic}: ${e?.message || e}`);
      setBusy(false);
    }
  }

  if (ready && items.length === 0) {
    return (
      <>
        <SEOHead pageKey="checkout" path="/checkout" noindex schemas={[]} />
        <div className="min-h-[70vh] bg-neutral-950 pt-28 px-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-white mb-4">{u.empty}</h1>
          <Link to="/shop/" className="text-blue-400 hover:text-blue-300 text-sm">{u.toShop}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead pageKey="checkout" path="/checkout" noindex schemas={[]} />
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={[{ label: "Koszyk", href: "/cart/" }, { label: u.title }]} />
          <h1 className="font-serif text-3xl font-bold text-white mb-8">{u.title}</h1>

          {/* Podsumowanie */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{u.summary}</h2>
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm mb-2">
                <span className="text-neutral-300">{i.title} &times; {i.qty || 1}</span>
                <span className="text-white">{money(((i.unitGrosze || 0) + (i.packagingGrosze || 0)) * (i.qty || 1))}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-white/5">
              <span className="text-neutral-400">{u.shipping}: {t(delivery.label, lang)}</span>
              <span className="text-white">{money(delivery.grosze)}</span>
            </div>
            <div className="flex justify-between font-bold pt-3 mt-3 border-t border-white/10">
              <span className="text-white">{u.total}</span>
              <span className="text-blue-400 text-xl">{money(totalGrosze)}</span>
            </div>
          </div>

          <h2 className="text-white font-semibold mb-4">{u.yourData}</h2>
          <Field label={u.email} value={customer.email} onChange={(v) => setCustomer((c) => ({ ...c, email: v }))} type="email" required placeholder="twoj@email.com" />
          <Field label={u.name} value={customer.name} onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} />
          <Field label={u.phone} value={customer.phone} onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} type="tel" />

          {!onlyDigital && (
            <>
              <h2 className="text-white font-semibold mb-3 mt-8">{u.delivery}</h2>
              <div className="space-y-2 mb-4">
                {DELIVERY_METHODS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDeliveryId(d.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      deliveryId === d.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className={`text-sm ${deliveryId === d.id ? "text-blue-300 font-medium" : "text-neutral-300"}`}>{t(d.label, lang)}</div>
                      <div className="text-neutral-500 text-[11px]">{t(d.note, lang)}</div>
                    </div>
                    <div className="text-sm font-semibold text-white">{money(d.grosze)}</div>
                  </button>
                ))}
              </div>

              {deliveryId === "inpost_locker" && (
                <Field label={u.lockerCode} value={addr.point} onChange={(v) => setAddr((a) => ({ ...a, point: v }))} required placeholder="WAW01A" />
              )}
              {deliveryId === "courier" && (
                <>
                  <Field label={u.address} value={addr.line1} onChange={(v) => setAddr((a) => ({ ...a, line1: v }))} required />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={u.postal} value={addr.postalCode} onChange={(v) => setAddr((a) => ({ ...a, postalCode: v }))} required placeholder="00-000" />
                    <Field label={u.city} value={addr.city} onChange={(v) => setAddr((a) => ({ ...a, city: v }))} required />
                  </div>
                </>
              )}
            </>
          )}

          <h2 className="text-white font-semibold mb-3 mt-8">{u.consents}</h2>
          <Consent checked={consents.terms} onChange={(v) => setConsents((c) => ({ ...c, terms: v }))}>
            {u.consentTerms} (
            <Link to="/terms/" className="text-blue-400 hover:text-blue-300">{u.terms}</Link>
            {", "}
            <Link to="/privacy/" className="text-blue-400 hover:text-blue-300">{u.privacy}</Link>
            )
          </Consent>
          {hasMadeToOrder && (
            <Consent checked={consents.waiveWithdrawal} onChange={(v) => setConsents((c) => ({ ...c, waiveWithdrawal: v }))}>
              {u.consentMade}
            </Consent>
          )}
          {hasDigital && (
            <Consent checked={consents.digitalImmediate} onChange={(v) => setConsents((c) => ({ ...c, digitalImmediate: v }))}>
              {u.consentDigital}
            </Consent>
          )}

          <h2 className="text-white font-semibold mb-3 mt-8">{u.payMethod}</h2>
          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={() => setGatewayId(0)}
              className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                gatewayId === 0 ? "border-blue-400 bg-blue-400/10 text-blue-300" : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
              }`}
            >
              {u.payAny}
            </button>
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setGatewayId(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${
                  gatewayId === m.id ? "border-blue-400 bg-blue-400/10 text-blue-300" : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                }`}
              >
                {m.icon && <img src={m.icon} alt="" className="h-5 w-auto" loading="lazy" />}
                {m.name}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 mb-4 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={!canPay}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-500 hover:bg-blue-400
                       disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold transition-colors"
          >
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" />{u.processing}</> : <><ShieldCheck className="w-4 h-4" />{u.pay} {money(totalGrosze)}</>}
          </button>

          <button
            type="button"
            onClick={() => navigate("/cart/")}
            className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 text-neutral-500 hover:text-white text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />{u.back}
          </button>
        </div>
      </div>
    </>
  );
}
