// ============================================================
// KREATOR ZAMOWIEN, piec krokow od wyboru uslugi do zaplaty
// ============================================================
// Cena widoczna na tej stronie NIGDY nie jest liczona w przegladarce.
// Kazda kwota pochodzi z /api/price, a przy skladaniu zamowienia backend
// przelicza ja jeszcze raz. Frontend nie ma jak wplynac na to, ile zaplaci
// klient, i taka jest intencja.

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Upload, X, Check, ArrowLeft, ArrowRight, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { SERVICES, GROUPS, getService, DELIVERY_METHODS } from "../data/orderCatalog.js";
import { t } from "../pricing/config.js";

const API = import.meta.env.VITE_CHAT_API_URL;

const UI = {
  pl: {
    title: "Zamów online",
    lead: "Wybierz usługę, podaj parametry, zapłać BLIK-iem lub przelewem. Cenę wyliczamy wiążąco, bez widełek.",
    steps: ["Usługa", "Parametry", "Cena", "Dane", "Płatność"],
    chooseService: "Co mamy dla Ciebie zrobić?",
    quotePath: "Nie widzisz swojej usługi?",
    quotePathDesc: "Biżuteria z kamieniami, łańcuszki i projekty wymagające doprecyzowania wyceniamy indywidualnie, zwykle w ciągu 24 godzin.",
    quotePathCta: "Poproś o wycenę",
    dropFile: "Kliknij lub przeciągnij plik STL",
    dropSub: "Cenę policzymy z objętości i wymiarów modelu",
    fileOptional: "Plik jest opcjonalny. Bez niego wybierzesz rozmiar z listy.",
    remove: "Usuń",
    volume: "Objętość",
    dims: "Wymiary",
    scale: "Skala",
    binding: "Cena wiążąca",
    perPc: "za sztukę",
    total: "Razem",
    pcs: "szt.",
    prodTime: "Szacowany czas produkcji",
    priceNote: "Cena zawiera materiał, pracę i przygotowanie. Obowiązuje 7 dni.",
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
    consentWithdrawal: "Zamawiam rzecz wykonywaną według mojej specyfikacji i przyjmuję do wiadomości, że tracę prawo odstąpienia od umowy po rozpoczęciu wykonania",
    payMethod: "Metoda płatności",
    payAny: "Wybiorę na stronie płatności",
    payNow: "Zapłać",
    back: "Wstecz",
    next: "Dalej",
    summary: "Podsumowanie",
    shipping: "Dostawa",
    calculating: "Liczę cenę",
    needsQuote: "Ta konfiguracja wymaga indywidualnej wyceny",
    needsQuoteCta: "Napisz do nas, przygotujemy wycenę zwykle w 24 godziny",
    errorGeneric: "Coś poszło nie tak",
    termsLink: "Regulamin",
    privacyLink: "Polityka prywatności",
    required: "Pole wymagane",
    creating: "Tworzę zamówienie",
    redirecting: "Przekierowuję do płatności",
    redirectBlocked: "Nie udało się otworzyć strony płatności. Zamówienie jest zapisane, napisz do nas z jego numerem, a prześlemy link do zapłaty.",
  },
  en: {
    title: "Order online",
    lead: "Pick a service, set the parameters, pay by BLIK or transfer. The price is binding, not a range.",
    steps: ["Service", "Parameters", "Price", "Details", "Payment"],
    chooseService: "What can we make for you?",
    quotePath: "Not seeing your service?",
    quotePathDesc: "Jewelry with stones, chains and projects that need clarification are quoted individually, usually within 24 hours.",
    quotePathCta: "Request a quote",
    dropFile: "Click or drag an STL file",
    dropSub: "We price it from the model volume and dimensions",
    fileOptional: "The file is optional. Without it, pick a size from the list.",
    remove: "Remove",
    volume: "Volume",
    dims: "Dimensions",
    scale: "Scale",
    binding: "Binding price",
    perPc: "per piece",
    total: "Total",
    pcs: "pcs",
    prodTime: "Estimated production time",
    priceNote: "Includes material, labour and setup. Valid for 7 days.",
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
    consentWithdrawal: "I am ordering an item made to my specification and acknowledge that I lose the right of withdrawal once production begins",
    payMethod: "Payment method",
    payAny: "I will choose on the payment page",
    payNow: "Pay",
    back: "Back",
    next: "Next",
    summary: "Summary",
    shipping: "Delivery",
    calculating: "Calculating",
    needsQuote: "This configuration needs an individual quote",
    needsQuoteCta: "Write to us, we usually quote within 24 hours",
    errorGeneric: "Something went wrong",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    required: "Required",
    creating: "Creating order",
    redirecting: "Redirecting to payment",
    redirectBlocked: "We could not open the payment page. Your order is saved, write to us with its number and we will send a payment link.",
  },
  de: {
    title: "Online bestellen",
    lead: "Leistung wählen, Parameter angeben, per BLIK oder Überweisung zahlen. Der Preis ist verbindlich, keine Spanne.",
    steps: ["Leistung", "Parameter", "Preis", "Daten", "Zahlung"],
    chooseService: "Was dürfen wir für Sie anfertigen?",
    quotePath: "Ihre Leistung ist nicht dabei?",
    quotePathDesc: "Schmuck mit Steinen, Ketten und Projekte mit Klärungsbedarf kalkulieren wir individuell, meist innerhalb von 24 Stunden.",
    quotePathCta: "Angebot anfordern",
    dropFile: "STL-Datei klicken oder hierher ziehen",
    dropSub: "Wir berechnen den Preis aus Volumen und Maßen",
    fileOptional: "Die Datei ist optional. Ohne sie wählen Sie eine Größe aus der Liste.",
    remove: "Entfernen",
    volume: "Volumen",
    dims: "Abmessungen",
    scale: "Maßstab",
    binding: "Verbindlicher Preis",
    perPc: "pro Stück",
    total: "Gesamt",
    pcs: "Stk.",
    prodTime: "Geschätzte Produktionszeit",
    priceNote: "Enthält Material, Arbeit und Einrichtung. 7 Tage gültig.",
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
    consentWithdrawal: "Ich bestelle eine nach meinen Vorgaben gefertigte Sache und nehme zur Kenntnis, dass das Widerrufsrecht mit Fertigungsbeginn erlischt",
    payMethod: "Zahlungsmethode",
    payAny: "Ich wähle auf der Zahlungsseite",
    payNow: "Bezahlen",
    back: "Zurück",
    next: "Weiter",
    summary: "Zusammenfassung",
    shipping: "Lieferung",
    calculating: "Berechne",
    needsQuote: "Diese Konfiguration erfordert ein individuelles Angebot",
    needsQuoteCta: "Schreiben Sie uns, wir kalkulieren meist innerhalb von 24 Stunden",
    errorGeneric: "Etwas ist schiefgelaufen",
    termsLink: "AGB",
    privacyLink: "Datenschutz",
    required: "Pflichtfeld",
    creating: "Bestellung wird angelegt",
    redirecting: "Weiterleitung zur Zahlung",
    redirectBlocked: "Die Zahlungsseite konnte nicht geöffnet werden. Ihre Bestellung ist gespeichert, schreiben Sie uns mit der Nummer und wir senden einen Zahlungslink.",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StepBar({ step, labels }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 mb-8 overflow-x-auto">
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs border transition-colors ${
              active ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium"
                : done ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400"
                : "border-white/10 text-neutral-500"
            }`}>
              {done ? <Check className="w-3 h-3" /> : <span className="font-bold">{i + 1}</span>}
              {label}
            </div>
            {i < labels.length - 1 && <div className="w-3 h-px bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

function OptionRow({ field, value, onChange, lang }) {
  const options = field.optionsFrom ? field.optionsFrom(value) : field.options;
  const current = value[field.key];
  const isMulti = field.multi;

  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">{t(field.label, lang)}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = isMulti ? (current || []).includes(o.id) : current === o.id;
          return (
            <button
              key={String(o.id)}
              type="button"
              onClick={() => {
                if (isMulti) {
                  const list = current || [];
                  onChange(field.key, list.includes(o.id) ? list.filter((x) => x !== o.id) : [...list, o.id]);
                } else {
                  onChange(field.key, o.id);
                }
              }}
              className={`px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all ${
                active ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}
            >
              {t(o.label, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <label className="block mb-4">
      <span className="block text-[11px] uppercase tracking-wide text-neutral-400 mb-1.5">
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

export default function Order() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(null);
  const [params, setParams] = useState({});
  const [file, setFile] = useState(null);
  const [scale, setScale] = useState(1);
  const [geometry, setGeometry] = useState(null);
  const [price, setPrice] = useState(null);
  const [pricing, setPricing] = useState(false);
  const [priceError, setPriceError] = useState(null);

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [deliveryId, setDeliveryId] = useState("inpost_locker");
  const [addr, setAddr] = useState({ line1: "", postalCode: "", city: "", point: "" });
  const [consents, setConsents] = useState({ terms: false, waiveWithdrawal: false });

  const [methods, setMethods] = useState([]);
  const [gatewayId, setGatewayId] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileRef = useRef(null);
  const service = getService(serviceId);
  const delivery = DELIVERY_METHODS.find((d) => d.id === deliveryId) || DELIVERY_METHODS[0];

  useEffect(() => {
    if (!API || step < 4) return;
    fetch(`${API}/api/payment-methods`)
      .then((r) => r.json())
      .then((d) => setMethods(d.gateways || []))
      .catch(() => setMethods([]));
  }, [step]);

  const setParam = useCallback((key, val) => {
    setParams((p) => ({ ...p, [key]: val }));
  }, []);

  /** Wycena zawsze po stronie serwera, nawet dla konfiguracji bez pliku */
  const fetchPrice = useCallback(async () => {
    if (!service || !API) return;
    setPricing(true);
    setPriceError(null);
    setPrice(null);
    try {
      const body = new FormData();
      body.append("calculator", service.calculator);
      body.append("lang", lang);
      body.append("scale", String(scale));
      body.append("params", JSON.stringify({ ...params, ...(service.fixed || {}) }));
      if (file) body.append("file", file);

      const resp = await fetch(`${API}/api/price`, { method: "POST", body });
      const data = await resp.json();
      if (!resp.ok) {
        setPriceError({ message: data.error || u.errorGeneric, code: data.code });
        return;
      }
      setPrice(data.item);
      if (data.geometry) setGeometry(data.geometry);
    } catch {
      setPriceError({ message: u.errorGeneric });
    } finally {
      setPricing(false);
    }
  }, [service, params, file, scale, lang, u.errorGeneric]);

  useEffect(() => {
    if (step === 2) fetchPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scale]);

  function pickService(s) {
    setServiceId(s.id);
    setParams({ ...s.defaults });
    setFile(null);
    setGeometry(null);
    setScale(1);
    setPrice(null);
    setStep(1);
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setGeometry(null);
    setPrice(null);
  }

  const totalGrosze = price ? price.lineGrosze + delivery.grosze : 0;

  const dataValid =
    EMAIL_RE.test(customer.email) &&
    consents.terms &&
    consents.waiveWithdrawal &&
    (deliveryId === "pickup" ||
      (deliveryId === "inpost_locker" ? addr.point.trim().length > 2 : addr.line1 && addr.postalCode && addr.city));

  async function submitOrder() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const orderResp = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          items: [{
            calculator: service.calculator,
            params: { ...params, ...(service.fixed || {}) },
            geometry,
            scale,
            fileName: file?.name || null,
          }],
          customer,
          delivery: {
            method: deliveryId,
            shippingGrosze: delivery.grosze,
            point: addr.point || null,
            addressLine1: addr.line1 || null,
            postalCode: addr.postalCode || null,
            city: addr.city || null,
          },
          consents,
        }),
      });
      const order = await orderResp.json();
      if (!orderResp.ok) {
        setSubmitError(order.error || u.errorGeneric);
        setSubmitting(false);
        return;
      }

      const payResp = await fetch(`${API}/api/orders/${order.orderRef}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: order.token, gatewayId }),
      });
      const pay = await payResp.json();
      if (!payResp.ok) {
        setSubmitError(pay.error || u.errorGeneric);
        setSubmitting(false);
        return;
      }

      // Bramka oczekuje zwyklego formularza POST, nie wywolania fetch.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = pay.url;
      for (const [k, v] of Object.entries(pay.params)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();

      // Przegladarka blokuje wysylke formularza po cichu, gdy polityka
      // bezpieczenstwa nie dopuszcza domeny bramki. Bez tego zabezpieczenia
      // przycisk zostawal w stanie przekierowania na zawsze, a klient nie
      // wiedzial, ze cokolwiek poszlo nie tak.
      setTimeout(() => {
        setSubmitting(false);
        setSubmitError(u.redirectBlocked);
      }, 8000);
    } catch {
      setSubmitError(u.errorGeneric);
      setSubmitting(false);
    }
  }

  const money = (grosze) => (grosze / 100).toFixed(2).replace(".", ",");

  return (
    <>
      <SEOHead
        pageKey="order"
        path="/order"
        schemas={[buildBreadcrumbSchema([
          { name: "AEJaCA", url: `${SITE.url}/` },
          { name: u.title, url: `${SITE.url}/order/` },
        ])]}
      />
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={[{ label: u.title }]} />

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">{u.title}</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl leading-relaxed">{u.lead}</p>

          <StepBar step={step} labels={u.steps} />

          {/* KROK 1: wybor uslugi */}
          {step === 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">{u.chooseService}</h2>
              {GROUPS.map((g) => {
                const items = SERVICES.filter((s) => s.group === g.id);
                if (!items.length) return null;
                return (
                  <div key={g.id} className="mb-6">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{t(g.label, lang)}</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {items.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => pickService(s)}
                          className="text-left p-4 rounded-xl border border-white/10 bg-white/[0.02]
                                     hover:border-blue-400/40 hover:bg-blue-400/[0.04] transition-all"
                        >
                          <div className="text-white font-medium text-sm mb-1">{t(s.title, lang)}</div>
                          <div className="text-neutral-400 text-xs leading-relaxed">{t(s.desc, lang)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="mt-8 p-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.03]">
                <div className="text-amber-300 font-medium text-sm mb-1">{u.quotePath}</div>
                <p className="text-neutral-400 text-xs leading-relaxed mb-3">{u.quotePathDesc}</p>
                <Link to="/contact/" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm transition-colors">
                  {u.quotePathCta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* KROK 2: parametry */}
          {step === 1 && service && (
            <div>
              <h2 className="text-white font-semibold mb-1">{t(service.title, lang)}</h2>
              <p className="text-neutral-400 text-xs mb-6">{t(service.desc, lang)}</p>

              {service.acceptsFile && (
                <div className="mb-6">
                  {!file ? (
                    <>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex flex-col items-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed
                                   border-blue-400/30 bg-blue-400/[0.03] hover:bg-blue-400/[0.07] hover:border-blue-400/50 transition-all"
                      >
                        <Upload className="w-7 h-7 text-blue-400" />
                        <div className="text-center">
                          <div className="text-white font-medium text-sm">{u.dropFile}</div>
                          <div className="text-neutral-400 text-[11px] mt-1">{u.dropSub}</div>
                        </div>
                      </button>
                      <input ref={fileRef} type="file" accept=".stl" className="hidden" onChange={onFile} />
                      <p className="text-neutral-600 text-[11px] mt-2 text-center">{u.fileOptional}</p>
                    </>
                  ) : (
                    <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-300 text-sm truncate max-w-[70%]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => { setFile(null); setGeometry(null); setPrice(null); }}
                          className="text-neutral-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />{u.remove}
                        </button>
                      </div>
                      {geometry && (
                        <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
                          <div>
                            <div className="text-neutral-500">{u.volume}</div>
                            <div className="text-white font-medium">{geometry.volumeCm3} cm³</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">{u.dims}</div>
                            <div className="text-white font-medium">
                              {(geometry.bbox.x * 10).toFixed(0)} × {(geometry.bbox.y * 10).toFixed(0)} × {(geometry.bbox.z * 10).toFixed(0)} mm
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {service.fields
                .filter((f) => !(f.hiddenWithFile && file))
                .map((f) => (
                  <OptionRow key={f.key} field={f} value={params} onChange={setParam} lang={lang} />
                ))}
            </div>
          )}

          {/* KROK 3: cena */}
          {step === 2 && (
            <div>
              {pricing && (
                <div className="flex items-center justify-center gap-3 py-16 text-neutral-400">
                  <Loader2 className="w-5 h-5 animate-spin" />{u.calculating}
                </div>
              )}

              {!pricing && priceError && (
                <div className="p-6 rounded-xl border border-amber-400/30 bg-amber-400/[0.05]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-amber-300 font-medium text-sm mb-1">
                        {priceError.code === "needs_quote" ? u.needsQuote : priceError.message}
                      </div>
                      <p className="text-neutral-400 text-xs mb-3">{u.needsQuoteCta}</p>
                      <Link to="/contact/" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm">
                        {u.quotePathCta} <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {!pricing && price && (
                <div>
                  <div className="text-center p-8 rounded-2xl border border-blue-400/20 bg-gradient-to-b from-blue-400/[0.06] to-transparent">
                    <div className="text-[11px] uppercase tracking-wider text-blue-400 mb-3">{u.binding}</div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        {money(price.unitGrosze)}
                      </span>
                      <span className="text-lg font-semibold text-neutral-400">PLN</span>
                    </div>
                    <div className="text-neutral-500 text-xs mt-1">{u.perPc}</div>

                    {price.qty > 1 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                          {u.total}: {price.qty} {u.pcs}
                        </div>
                        <div className="text-2xl font-bold text-blue-400">{money(price.lineGrosze)} PLN</div>
                      </div>
                    )}

                    {price.totalTimeH && (
                      <div className="text-neutral-500 text-xs mt-3">
                        {u.prodTime}: ~{price.totalTimeH.toFixed(1)} h
                      </div>
                    )}
                  </div>

                  <p className="text-neutral-500 text-[11px] mt-3 text-center">{u.priceNote}</p>

                  {price.breakdown && (
                    <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
                      {price.breakdown.map((row, i) =>
                        row.divider ? (
                          <div key={i} className="border-t border-white/5 my-2" />
                        ) : (
                          <div key={i} className={`flex justify-between ${row.bold ? "font-bold text-white" : "text-neutral-400"}`}>
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* KROK 4: dane, dostawa, zgody */}
          {step === 3 && (
            <div>
              <h2 className="text-white font-semibold mb-4">{u.yourData}</h2>
              <Field label={u.email} value={customer.email} onChange={(v) => setCustomer((c) => ({ ...c, email: v }))} type="email" required placeholder="twoj@email.com" />
              <Field label={u.name} value={customer.name} onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} />
              <Field label={u.phone} value={customer.phone} onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} type="tel" />

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
                    <div className="text-sm font-semibold text-white">
                      {d.grosze === 0 ? "0,00" : money(d.grosze)} PLN
                    </div>
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

              <h2 className="text-white font-semibold mb-3 mt-8">{u.consents}</h2>
              <label className="flex items-start gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.terms}
                  onChange={(e) => setConsents((c) => ({ ...c, terms: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0"
                />
                <span className="text-neutral-400 text-xs leading-relaxed">
                  {u.consentTerms} (
                  <Link to="/terms/" className="text-blue-400 hover:text-blue-300">{u.termsLink}</Link>
                  {", "}
                  <Link to="/privacy/" className="text-blue-400 hover:text-blue-300">{u.privacyLink}</Link>
                  )
                </span>
              </label>
              {/* Odrebna zgoda, bo art. 38 UPK wymaga wyraznego oswiadczenia,
                  a nie punktu ukrytego w akceptacji regulaminu. */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.waiveWithdrawal}
                  onChange={(e) => setConsents((c) => ({ ...c, waiveWithdrawal: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0"
                />
                <span className="text-neutral-400 text-xs leading-relaxed">{u.consentWithdrawal}</span>
              </label>
            </div>
          )}

          {/* KROK 5: platnosc */}
          {step === 4 && price && (
            <div>
              <h2 className="text-white font-semibold mb-4">{u.summary}</h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-400">{price.title} × {price.qty}</span>
                  <span className="text-white">{money(price.lineGrosze)} PLN</span>
                </div>
                <div className="flex justify-between mb-3 pb-3 border-b border-white/5">
                  <span className="text-neutral-400">{u.shipping}: {t(delivery.label, lang)}</span>
                  <span className="text-white">{money(delivery.grosze)} PLN</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-white">{u.total}</span>
                  <span className="text-blue-400 text-lg">{money(totalGrosze)} PLN</span>
                </div>
              </div>

              <h2 className="text-white font-semibold mb-3">{u.payMethod}</h2>
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

              {submitError && (
                <div className="p-3 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-xs mb-4">
                  {submitError}
                </div>
              )}

              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-500 hover:bg-blue-400
                           disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{u.redirecting}</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" />{u.payNow} {money(totalGrosze)} PLN</>
                )}
              </button>
            </div>
          )}

          {/* Nawigacja */}
          {step > 0 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-neutral-400
                           hover:text-white hover:border-white/20 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />{u.back}
              </button>

              {step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={(step === 2 && !price) || (step === 3 && !dataValid)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400
                             disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-sm font-medium transition-colors"
                >
                  {u.next}<ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
