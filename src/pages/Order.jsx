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
import PaymentPicker from "../components/shop/PaymentPicker.jsx";
import LockerPicker from "../components/shop/LockerPicker.jsx";
import CustomerFields, { ValidatedField as Field } from "../components/shop/CustomerFields.jsx";
import { validateCustomer } from "../shop/customerFields.js";
import { SERVICES, GROUPS, getService, DELIVERY_METHODS } from "../data/orderCatalog.js";
import { shippingOptions, shippingGrosze, needsCustoms, SHIPPING_COUNTRIES, leadDaysLabel } from "../pricing/shipping.js";
import { t, tierForQty, qtyForTier, qtyLimit, qtyOpenValue, QUANTITY_TIERS } from "../pricing/config.js";
import { useMoney } from "../shop/money.js";
import { wymagaPrzesylki, inboundOptionsFor } from "../data/inboundDelivery.js";
import { SPARE_LABEL, spareOptionsFor, brakPodloza } from "../data/laserSubstrate.js";
import { QuantityStepper, ScaleControl } from "../components/shop/ConfigControls.jsx";
import { maxScaleForBBox } from "../pricing/print3d.js";

// Ten sam prog co w koszyku i na serwerze. Rozjazd znaczylby, ze formularz
// przepuszcza opis, ktory kasa odrzuci, czyli blad przy platnosci.
const MIN_DESCRIPTION = 20;

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
    descTitle: "Co mamy wykonać",
    descHint: "Napisz, co ma powstać: co grawerujemy, na czym, jaki napis, jakie wymiary. Bez tego zlecenie trafia do pracowni bez ani jednego zdania od Ciebie.",
    descPlaceholder: "Np. grawer imienia na drewnianej desce 30 x 20 cm, napis wysokosci okolo 3 cm, czcionka jak w zalaczonym pliku.",
    descTooShort: "Opisz zlecenie w co najmniej " + MIN_DESCRIPTION + " znakach.",
    substrateGapTitle: "Zlecenie laserowe jest niekompletne",
    needSubstrate: "Wybierz, na czym mamy pracować.",
    needSpare: "Wybierz sposób próby: sztuka ponad zamówienie albo przedmiot niepowtarzalny.",
    needMaterialNote: "Napisz, na jakim konkretnie materiale mamy wykonać usługę.",
    materialNoteLabel: "Na jakim materiale",
    materialNotePlaceholder: "Np. sklejka brzozowa 4 mm, akryl bezbarwny 3 mm",
    inboundTitle: "Jak dostarczysz nam swój przedmiot",
    inboundWhy: "To zamówienie wymaga, żebyś przysłał nam materiał albo przedmiot. Bez tej deklaracji nie wiemy, czy czekać na paczkę, czy na Ciebie.",
    dropFile: "Kliknij lub przeciągnij plik STL",
    dropSub: "Cenę policzymy z objętości i wymiarów modelu",
    fileOptional: "Plik jest opcjonalny. Bez niego wybierzesz rozmiar z listy.",
    remove: "Usuń",
    volume: "Objętość",
    dims: "Wymiary",
    scale: "Skala",
    printSize: "Wielkość wydruku",
    binding: "Cena wiążąca",
    perPc: "za sztukę",
    total: "Razem",
    pcs: "szt.",
    qty: "Liczba sztuk",
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
    country: "Kraj dostawy",
    carrier: "Przewoźnik",
    businessDays: "dni roboczych",
    customsTitle: "Przesyłka poza Unię Europejską",
    customsBody: "Cło i podatek importowy nalicza urząd celny kraju odbiorcy, a pobiera je kurier przy doręczeniu. Nie są zawarte w cenie i nie możemy ich za Ciebie opłacić.",
    handlingNote: "W cenie wysyłki zagranicznej zawarte jest 10 PLN za obsługę nadania i dokumentów.",
    consents: "Zgody",
    consentTerms: "Akceptuję regulamin i politykę prywatności",
    consentWithdrawal: "Zamawiam rzecz wykonywaną według mojej specyfikacji i przyjmuję do wiadomości, że tracę prawo odstąpienia od umowy po rozpoczęciu wykonania",
    payMethod: "Metoda płatności",
    payAny: "Wybiorę na stronie płatności",
    payNow: "Kupuję i płacę",
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
    descTitle: "What we are to make",
    descHint: "Write what should be produced: what we engrave, on what, what text, what size. Without it the job reaches the workshop without a single sentence from you.",
    descPlaceholder: "E.g. a name engraved on a 30 x 20 cm wooden board, letters about 3 cm high, typeface as in the attached file.",
    descTooShort: "Describe the job in at least " + MIN_DESCRIPTION + " characters.",
    substrateGapTitle: "The laser job is incomplete",
    needSubstrate: "Choose what we are to work on.",
    needSpare: "Choose the test piece: one beyond the order, or a one of a kind item.",
    needMaterialNote: "Tell us exactly which material the job should use.",
    materialNoteLabel: "Which material",
    materialNotePlaceholder: "E.g. 4 mm birch plywood, 3 mm clear acrylic",
    inboundTitle: "How you will send us your item",
    inboundWhy: "This order needs you to send us material or an item. Without this we do not know whether to wait for a parcel or for you.",
    dropFile: "Click or drag an STL file",
    dropSub: "We price it from the model volume and dimensions",
    fileOptional: "The file is optional. Without it, pick a size from the list.",
    remove: "Remove",
    volume: "Volume",
    dims: "Dimensions",
    scale: "Scale",
    printSize: "Print size",
    binding: "Binding price",
    perPc: "per piece",
    total: "Total",
    pcs: "pcs",
    qty: "Quantity",
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
    country: "Delivery country",
    carrier: "Carrier",
    businessDays: "business days",
    customsTitle: "Shipment outside the European Union",
    customsBody: "Customs duty and import tax are set by the destination country and collected by the courier on delivery. They are not included in the price and we cannot pay them on your behalf.",
    handlingNote: "International shipping includes 10 PLN for handling the dispatch and the paperwork.",
    consents: "Consents",
    consentTerms: "I accept the Terms of Service and the Privacy Policy",
    consentWithdrawal: "I am ordering an item made to my specification and acknowledge that I lose the right of withdrawal once production begins",
    payMethod: "Payment method",
    payAny: "I will choose on the payment page",
    payNow: "Buy and pay",
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
    descTitle: "Was wir anfertigen sollen",
    descHint: "Beschreiben Sie, was entstehen soll: was wir gravieren, worauf, welcher Text, welche Masse. Ohne das erreicht der Auftrag die Werkstatt ohne einen einzigen Satz von Ihnen.",
    descPlaceholder: "Z. B. ein Name auf einem Holzbrett 30 x 20 cm, Buchstaben etwa 3 cm hoch, Schrift wie in der angehaengten Datei.",
    descTooShort: "Beschreiben Sie den Auftrag in mindestens " + MIN_DESCRIPTION + " Zeichen.",
    substrateGapTitle: "Der Laserauftrag ist unvollstaendig",
    needSubstrate: "Waehlen Sie, worauf wir arbeiten sollen.",
    needSpare: "Waehlen Sie das Probestueck: eines ueber die Bestellung hinaus oder ein einzigartiges Objekt.",
    needMaterialNote: "Sagen Sie uns genau, welches Material verwendet werden soll.",
    materialNoteLabel: "Welches Material",
    materialNotePlaceholder: "Z. B. Birkensperrholz 4 mm, Acryl klar 3 mm",
    inboundTitle: "Wie Sie uns Ihr Objekt zusenden",
    inboundWhy: "Fuer diese Bestellung muessen Sie uns Material oder ein Objekt zusenden. Ohne diese Angabe wissen wir nicht, ob wir auf ein Paket oder auf Sie warten.",
    dropFile: "STL-Datei klicken oder hierher ziehen",
    dropSub: "Wir berechnen den Preis aus Volumen und Maßen",
    fileOptional: "Die Datei ist optional. Ohne sie wählen Sie eine Größe aus der Liste.",
    remove: "Entfernen",
    volume: "Volumen",
    dims: "Abmessungen",
    scale: "Maßstab",
    printSize: "Druckgroesse",
    binding: "Verbindlicher Preis",
    perPc: "pro Stück",
    total: "Gesamt",
    pcs: "Stk.",
    qty: "Stueckzahl",
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
    country: "Lieferland",
    carrier: "Versanddienstleister",
    businessDays: "Werktage",
    customsTitle: "Sendung außerhalb der Europäischen Union",
    customsBody: "Zoll und Einfuhrsteuer setzt das Bestimmungsland fest, der Kurier zieht sie bei der Zustellung ein. Sie sind nicht im Preis enthalten und wir können sie nicht für Sie entrichten.",
    handlingNote: "Im Auslandsversand sind 10 PLN für die Abwicklung und die Papiere enthalten.",
    consents: "Einwilligungen",
    consentTerms: "Ich akzeptiere die AGB und die Datenschutzerklärung",
    consentWithdrawal: "Ich bestelle eine nach meinen Vorgaben gefertigte Sache und nehme zur Kenntnis, dass das Widerrufsrecht mit Fertigungsbeginn erlischt",
    payMethod: "Zahlungsmethode",
    payAny: "Ich wähle auf der Zahlungsseite",
    payNow: "Kaufen und bezahlen",
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


/** Nazwy krajow z przegladarki, posortowane alfabetycznie w jezyku klienta. */
function countryName(code, lang) {
  try {
    return new Intl.DisplayNames([lang === "pl" ? "pl" : lang === "de" ? "de" : "en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function countryList(lang) {
  const locale = lang === "pl" ? "pl" : lang === "de" ? "de" : "en";
  return SHIPPING_COUNTRIES
    .map((code) => ({ code, name: countryName(code, lang) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

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


/**
 * Zapytanie z twardym limitem czasu.
 *
 * Bez tego zawieszone polaczenie zostawialo przycisk w stanie
 * "przekierowuje" na zawsze, bo obietnica fetch nigdy sie nie rozstrzygala.
 * Kazdy etap loguje sie tez do konsoli, zeby przy zgloszeniu bledu bylo
 * widac, ktory krok nie doszedl do skutku.
 */
async function postJSON(url, body, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    console.info("[order] ->", url);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { error: `Serwer zwrocil odpowiedz, ktorej nie da sie odczytac (${resp.status})`, raw: text.slice(0, 200) }; }
    console.info("[order] <-", url, resp.status, data);
    return { ok: resp.ok, status: resp.status, data };
  } finally {
    clearTimeout(timer);
  }
}

export default function Order() {
  const { lang } = useLanguage();
  const { money } = useMoney();
  const u = UI[lang] || UI.en;

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(null);
  const [params, setParams] = useState({});
  // Liczba sztuk jest zrodlem prawdy, prog nakladu z niej wynika. Ta sama
  // regula co na karcie uslugi, liczona tym samym kodem z `pricing/config.js`.
  const [qty, setQty] = useState(1);
  const [file, setFile] = useState(null);
  // Opis zlecenia i deklaracja dostarczenia. Obu tu nie bylo, a serwer obu
  // wymaga, wiec KAZDE zamowienie z tej strony konczylo sie bledem 400.
  const [description, setDescription] = useState("");
  const [inbound, setInbound] = useState("");
  const [scale, setScale] = useState(1);
  const [geometry, setGeometry] = useState(null);
  const [price, setPrice] = useState(null);
  const [pricing, setPricing] = useState(false);
  const [priceError, setPriceError] = useState(null);

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [country, setCountry] = useState(lang === "de" ? "DE" : lang === "en" ? "GB" : "PL");
  const [deliveryId, setDeliveryId] = useState(lang === "pl" ? "inpost_locker" : "courier");
  const [addr, setAddr] = useState({ line1: "", postalCode: "", city: "", point: "" });
  const [consents, setConsents] = useState({ terms: false, waiveWithdrawal: false });

  const [methods, setMethods] = useState([]);
  const [gatewayId, setGatewayId] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileRef = useRef(null);
  const service = getService(serviceId);
  // Prog nakladu nazywa sie inaczej w studiu (quantityId) niz w bizuterii (qtyId).
  const tierKey = service?.fields.some((f) => f.key === "quantityId")
    ? "quantityId"
    : service?.fields.some((f) => f.key === "qtyId") ? "qtyId" : null;
  const tiers = (tierKey && service.fields.find((f) => f.key === tierKey)?.options) || QUANTITY_TIERS;
  // Granica skali wynika z pola roboczego maszyny, tym samym kodem, ktorym
  // serwer odmawia kwoty wiazacej za model wiekszy niz stol.
  const maxScale = geometry?.bbox ? maxScaleForBBox(geometry.bbox, service?.calculator) : null;
  // Metody i ceny zaleza od kraju: paczkomat dziala tylko w Polsce.
  const options = shippingOptions(country);
  const deliveryMeta = DELIVERY_METHODS.find((d) => d.id === deliveryId) || DELIVERY_METHODS[0];
  const delivery = { ...deliveryMeta, id: deliveryId, grosze: shippingGrosze(deliveryId, country) ?? 0 };
  const abroad = country !== "PL";
  const customs = needsCustoms(country);

  useEffect(() => {
    if (!API || step < 4) return;
    fetch(`${API}/api/payment-methods`)
      .then((r) => r.json())
      .then((d) => setMethods(d.gateways || []))
      .catch(() => setMethods([]));
  }, [step]);

  const setParam = useCallback((key, val) => {
    // Zmiana podloza czysci pola, ktore od niego zaleza. Po przelaczeniu
    // z przedmiotu klienta na nasz material zostawalby inaczej wybor sposobu
    // proby, ktory przy naszym materiale nie ma sensu, a serwer i tak by go
    // odrzucil, juz po podaniu danych do platnosci.
    setParams((p) => (
      key === "podloze" ? { ...p, podloze: val, spare: "", materialNote: "" } : { ...p, [key]: val }
    ));
    // Prog nakladu mowi "chce co najmniej tyle", wiec ustawia licznik na dolna
    // granice przedzialu. To jedyny kierunek, w ktorym prog dotyka liczby.
    if (key === "quantityId" || key === "qtyId") setQty(qtyForTier(val, tiers));
    // `tiers` jest stale dla danej uslugi (katalog oddaje ten sam obiekt),
    // wiec ta zaleznosc nie powoduje przeliczania przy kazdym renderowaniu.
  }, [tiers]);

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
    setQty(1);
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

  // Kwota do zaplaty liczy sie z licznika sztuk, bo to jego wysylamy w
  // zamowieniu. `price.lineGrosze` niesie naklad reprezentatywny progu i byloby
  // to podsumowanie innego zamowienia niz to skladane.
  const totalGrosze = price ? price.unitGrosze * qty + delivery.grosze : 0;

  const [triedToSubmit, setTriedToSubmit] = useState(false);
  const customerErrors = validateCustomer(customer);

  // Opis i deklaracja dostarczenia licza sie TA SAMA regula co w koszyku
  // i na serwerze, z tego samego modulu. Wlasna kopia rozjechalaby sie przy
  // pierwszej nowej usludze, a objawem bylby blad dopiero przy platnosci.
  const opisOk = description.trim().length >= MIN_DESCRIPTION;
  // Podloze uslugi laserowej: ta sama regula co w koszyku i na serwerze.
  // Pole `podloze` renderuje sie samo z `service.fields`, ale `spare`
  // i `materialNote` od niego zaleza, wiec stoja osobno, nizej w kroku
  // parametrow.
  const brakPodl = service ? brakPodloza({ calculator: service.calculator, params }) : null;
  // Zmiana kraju zmienia liste sposobow dostarczenia: paczkomat istnieje tylko
  // w Polsce. Wybor zrobiony przed zmiana kraju zostalby wyborem, ktorego
  // serwer nie przyjmie, a klient nie mialby powodu zajrzec tam ponownie.
  useEffect(() => { setInbound(""); }, [country]);
  const wymagaInbound = Boolean(service) && wymagaPrzesylki({ calculator: service.calculator, params });
  const inboundOpcje = inboundOptionsFor(country);
  const inboundOk = !wymagaInbound || inboundOpcje.some((m) => m.id === inbound);

  const dataValid =
    opisOk &&
    !brakPodl &&
    inboundOk &&
    Object.keys(customerErrors).length === 0 &&
    consents.terms &&
    consents.waiveWithdrawal &&
    (deliveryId === "pickup" ||
      (deliveryId === "inpost_locker" ? addr.point.trim().length > 2 : addr.line1 && addr.postalCode && addr.city));

  async function submitOrder() {
    // Puste pole nie tlumaczy sie samo, wiec klikniecie z brakami odslania
    // wszystkie bledy naraz i przewija do pierwszego z nich.
    if (!dataValid) {
      setTriedToSubmit(true);
      const first = document.querySelector('[aria-invalid="true"], #locker-search, #locker-code');
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus?.({ preventScroll: true });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!API) {
        setSubmitError("Brak adresu API. Skontaktuj sie z nami, zamowienie nie zostalo zlozone.");
        setSubmitting(false);
        return;
      }

      const created = await postJSON(`${API}/api/orders`, {
          lang,
          items: [{
            calculator: service.calculator,
            params: { ...params, ...(service.fixed || {}) },
            description,
            geometry,
            scale,
            fileName: file?.name || null,
            qty,
          }],
          customer,
          delivery: {
            method: deliveryId,
            country,
            inbound: inbound || null,
            shippingGrosze: delivery.grosze,
            point: addr.point || null,
            addressLine1: addr.line1 || null,
            postalCode: addr.postalCode || null,
            city: addr.city || null,
          },
          consents,
      });
      if (!created.ok) {
        setSubmitError(created.data?.error || `${u.errorGeneric} (${created.status})`);
        setSubmitting(false);
        return;
      }
      const order = created.data;

      const payment = await postJSON(`${API}/api/orders/${order.orderRef}/pay`, {
        token: order.token,
        gatewayId,
      });
      if (!payment.ok) {
        setSubmitError(payment.data?.error || `${u.errorGeneric} (${payment.status})`);
        setSubmitting(false);
        return;
      }
      const pay = payment.data;

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
    } catch (e) {
      console.error("[order] blad:", e);
      setSubmitError(
        e?.name === "AbortError"
          ? "Serwer nie odpowiedzial w wyznaczonym czasie. Sprobuj ponownie albo napisz do nas."
          : `${u.errorGeneric}: ${e?.message || e}`
      );
      setSubmitting(false);
    }
  }


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

              {/* WIELKOSC WYDRUKU. `/order/` liczylo skale i wysylalo ja do wyceny,
                  ale nie mialo kontrolki, wiec zawsze byla jedynka i klient nie
                  mial jak jej zmienic. Ta sama kontrolka co na karcie uslugi. */}
              {geometry && maxScale != null && (
                <ScaleControl
                  label={u.printSize}
                  bbox={geometry.bbox}
                  volumeCm3={geometry.volumeCm3}
                  scale={scale}
                  onChange={setScale}
                  maxScale={maxScale}
                  lang={lang}
                />
              )}

              {service.fields
                .filter((f) => !(f.hiddenWithFile && file))
                .map((f) => (
                  <OptionRow key={f.key} field={f} value={params} onChange={setParam} lang={lang} />
                ))}

              {tierKey && (
                <QuantityStepper
                  label={u.qty}
                  value={qty}
                  onChange={(n) => {
                    setQty(n);
                    setParams((p) => ({ ...p, [tierKey]: tierForQty(n, tiers).id }));
                  }}
                  min={1}
                  max={qtyLimit(tiers)}
                  openValue={qtyOpenValue(tiers)}
                  lang={lang}
                />
              )}

              {/* Sztuka na proby albo nazwa materialu, zaleznie od podloza.
                  Samo podloze renderuje `OptionRow` wyzej razem z reszta
                  parametrow, bo siedzi w katalogu uslug. */}
              {spareOptionsFor(params.podloze).length > 0 && (
                <OptionRow
                  field={{ key: "spare", label: SPARE_LABEL, options: spareOptionsFor(params.podloze) }}
                  value={params}
                  onChange={setParam}
                  lang={lang}
                />
              )}

              {params.podloze === "our_stock" && (
                <div className="mb-5">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">{u.materialNoteLabel}</div>
                  <input
                    type="text"
                    value={params.materialNote || ""}
                    onChange={(e) => setParam("materialNote", e.target.value)}
                    placeholder={u.materialNotePlaceholder}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                               placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/60"
                  />
                </div>
              )}

              {/* OPIS ZLECENIA. Parametry mowia, ILE to kosztuje, a nie CO mamy
                  zrobic. Bez tego pola do pracowni trafialo zamowienie oplacone
                  i niewykonalne, i tak sie to raz skonczylo naprawde. */}
              <div className="mt-2">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">{u.descTitle}</div>
                <textarea
                  id="job-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={u.descPlaceholder}
                  aria-invalid={triedToSubmit && !opisOk ? "true" : undefined}
                  className={`w-full bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white
                             placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/60 ${
                    triedToSubmit && !opisOk ? "border-red-400/60" : "border-white/10"
                  }`}
                />
                <p className="text-neutral-500 text-[11px] mt-1.5">{u.descHint}</p>
                {triedToSubmit && !opisOk && (
                  <p className="text-red-400 text-[11px] mt-1">{u.descTooShort}</p>
                )}
              </div>

              {triedToSubmit && brakPodl && (
                <p className="text-red-400 text-[11px] mt-3">
                  {{ substrate_required: u.needSubstrate, spare_required: u.needSpare, material_note_required: u.needMaterialNote }[brakPodl]}
                </p>
              )}
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
                    </div>
                    <div className="text-neutral-500 text-xs mt-1">{u.perPc}</div>

                    {/* Razem liczy sie z LICZNIKA, nie z progu. Prog niesie tylko
                        rabat, a jego reprezentatywny naklad to inna liczba niz
                        ta, ktora klient wpisal, wiec pokazanie jej tutaj znaczylo
                        podsumowanie niezgodne z rachunkiem. */}
                    {qty > 1 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                          {u.total}: {qty} {u.pcs}
                        </div>
                        <div className="text-2xl font-bold text-blue-400">{money(price.unitGrosze * qty)}</div>
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
              <CustomerFields
                value={customer}
                onChange={setCustomer}
                labels={{ email: u.email, name: u.name, phone: u.phone }}
                lang={lang}
                showErrors={triedToSubmit}
              />

              <h2 className="text-white font-semibold mb-3 mt-8">{u.delivery}</h2>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">{u.country}</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  const ids = shippingOptions(e.target.value).map((o) => o.id);
                  if (!ids.includes(deliveryId)) setDeliveryId(ids[0]);
                }}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4
                           focus:outline-none focus:border-blue-400/50"
              >
                {countryList(lang).map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>

              <div className="space-y-2 mb-4">
                {options.map((o) => {
                  const meta = DELIVERY_METHODS.find((d) => d.id === o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setDeliveryId(o.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-all ${
                        deliveryId === o.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div>
                        <div className={`text-sm ${deliveryId === o.id ? "text-blue-300 font-medium" : "text-neutral-300"}`}>
                          {meta ? t(meta.label, lang) : o.id}
                        </div>
                        <div className="text-neutral-500 text-[11px]">
                          {o.id === "pickup" ? t(meta.note, lang) : `${u.carrier}: ${o.carrier}, ${leadDaysLabel(o)} ${u.businessDays}`}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-white whitespace-nowrap">{money(o.grosze)}</div>
                    </button>
                  );
                })}
              </div>

              {abroad && <p className="text-neutral-600 text-[11px] mb-4">{u.handlingNote}</p>}

              {customs && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 mb-4">
                  <p className="text-amber-200 text-xs font-medium mb-1">{u.customsTitle}</p>
                  {/* amber-200/80, nie amber-100/80: tryb jasny przemalowuje
                      tylko klasy wypisane w index.css, a ta druga nie byla tam
                      obecna i akapit znikal na kremowym tle. */}
                  <p className="text-amber-200/80 text-[11px] leading-relaxed">{u.customsBody}</p>
                </div>
              )}

              {deliveryId === "inpost_locker" && (
                <LockerPicker
                  api={API}
                  value={addr.point}
                  onChange={(v) => setAddr((a) => ({ ...a, point: v }))}
                  lang={lang}
                />
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

              {wymagaInbound && (
                <>
                  <h2 className="text-white font-semibold mb-1 mt-8">{u.inboundTitle}</h2>
                  <p className="text-neutral-400 text-[12px] mb-3">{u.inboundWhy}</p>
                  <div className="space-y-2">
                    {inboundOpcje.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setInbound(m.id)}
                        className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                          inbound === m.id
                            ? "border-blue-400/60 bg-blue-400/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/25"
                        }`}
                      >
                        <span className={`block text-sm font-medium ${inbound === m.id ? "text-blue-200" : "text-neutral-200"}`}>
                          {t(m.label, lang)}
                        </span>
                        <span className="block text-neutral-400 text-[11px] mt-0.5">{t(m.note, lang)}</span>
                      </button>
                    ))}
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
                  <span className="text-neutral-400">{price.title} × {qty}</span>
                  <span className="text-white">{money(price.unitGrosze * qty)}</span>
                </div>
                <div className="flex justify-between mb-3 pb-3 border-b border-white/5">
                  <span className="text-neutral-400">{u.shipping}: {t(delivery.label, lang)}</span>
                  <span className="text-white">{money(delivery.grosze)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-white">{u.total}</span>
                  <span className="text-blue-400 text-lg">{money(totalGrosze)}</span>
                </div>
              </div>

              <h2 className="text-white font-semibold mb-3">{u.payMethod}</h2>
              <PaymentPicker
                methods={methods}
                value={gatewayId}
                onChange={setGatewayId}
                anyLabel={u.payAny}
                lang={lang}
              />

              {submitError && (
                <div className="p-3 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-xs mb-4">
                  {submitError}
                </div>
              )}

              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-colors
                           disabled:cursor-not-allowed ${
                  dataValid || submitting
                    ? "bg-blue-500 hover:bg-blue-400 text-white"
                    : "bg-neutral-800 text-neutral-400 border border-white/10 hover:border-white/20"
                }`}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{u.redirecting}</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" />{u.payNow} {money(totalGrosze)}</>
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
                  // Krok dalej z brakami nie jest martwym przyciskiem: pokazuje,
                  // czego brakuje, zamiast milczec.
                  onClick={() => {
                    // Opis mieszka na kroku parametrow, wiec brak zatrzymujemy
                    // TUTAJ. Zatrzymanie dopiero przy platnosci odsylaloby
                    // klienta trzy kroki wstecz, do pola, ktorego juz nie widzi.
                    if (step === 1 && (!opisOk || brakPodl)) {
                      setTriedToSubmit(true);
                      const pole = document.getElementById("job-description");
                      pole?.scrollIntoView({ behavior: "smooth", block: "center" });
                      pole?.focus?.({ preventScroll: true });
                      return;
                    }
                    if (step === 3 && !dataValid) {
                      setTriedToSubmit(true);
                      const first = document.querySelector('[aria-invalid="true"], #locker-search, #locker-code');
                      first?.scrollIntoView({ behavior: "smooth", block: "center" });
                      first?.focus?.({ preventScroll: true });
                      return;
                    }
                    setStep((s) => s + 1);
                  }}
                  disabled={step === 2 && !price}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
                             disabled:bg-neutral-800 disabled:text-neutral-600 disabled:border disabled:border-white/10
                             disabled:cursor-not-allowed ${
                    step === 3 && !dataValid
                      ? "bg-neutral-800 text-neutral-400 border border-white/10 hover:border-white/20"
                      : "bg-blue-500 hover:bg-blue-400 text-white"
                  }`}
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
