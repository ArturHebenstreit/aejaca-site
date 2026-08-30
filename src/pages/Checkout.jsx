// ============================================================
// FINALIZACJA ZAMOWIENIA
// ============================================================
// Zgody nie sa jedne na cale zamowienie, tylko zalezne od tego, co lezy
// w koszyku. Rzecz gotowa ma pelne 14 dni na zwrot, rzecz wykonywana na
// zamowienie nie ma go wcale, a tresc cyfrowa traci je z chwila pobrania.
// Zbiorcza zgoda "akceptuje wszystko" bylaby przy tym nieskuteczna.

import { useState, useEffect } from "react";
import { describeParams } from "../data/describeParams.js";
import { Link, useNavigate } from "../i18n/nav.jsx";
import { ShieldCheck, Loader2, ArrowLeft, AlertTriangle, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { useCart } from "../cart/CartContext.jsx";
import { DELIVERY_METHODS } from "../data/orderCatalog.js";
import { t } from "../pricing/config.js";
import { API_URL, postJSON, submitPaymentForm } from "../utils/api.js";
import { useMoney, formatPln, formatEur } from "../shop/money.js";
import { shippingOptions, shippingGrosze, needsCustoms, FREE_SHIPPING_FROM_GROSZE, leadDaysLabel } from "../pricing/shipping.js";
import { countryList } from "../data/countryNames.js";
import { inboundOptionsFor, wymagaPrzesylki } from "../data/inboundDelivery.js";
import { validateCustomer } from "../shop/customerFields.js";
import CustomerFields, { ValidatedField as Field } from "../components/shop/CustomerFields.jsx";
import PaymentPicker from "../components/shop/PaymentPicker.jsx";
import LockerPicker from "../components/shop/LockerPicker.jsx";

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
    missingTitle: "Zanim zapłacisz, uzupełnij:",
    freeShipping: "Gratis",
    freeShippingWhy: (kwota) => `w prezencie, bo zamówienie przekracza ${kwota}`,
    consents: "Zgody",
    inboundTitle: "Jak dostarczysz nam swój przedmiot",
    inboundWhy: "To zamówienie wymaga, żebyś przysłał nam materiał albo przedmiot. Bez tej deklaracji nie wiemy, czy czekać na paczkę, czy na Ciebie.",
    consentTerms: "Akceptuję regulamin i politykę prywatności",
    consentMade: "Zamawiam rzecz wykonywaną według mojej specyfikacji i przyjmuję do wiadomości, że po rozpoczęciu wykonania tracę prawo odstąpienia od umowy",
    consentDigital: "Żądam dostarczenia treści cyfrowej przed upływem terminu na odstąpienie i przyjmuję do wiadomości, że z chwilą rozpoczęcia pobierania tracę prawo odstąpienia",
    summary: "Podsumowanie",
    items: "Pozycje",
    shipping: "Dostawa",
    total: "Do zapłaty",
    codeLabel: "Kod rabatowy",
    codeIntro: "Masz kod rabatowy? Wpisz go w poniższym polu:",
    codePlaceholder: "np. AEJaCA10",
    codeApply: "Zastosuj",
    codeRemove: "Usuń kod",
    codeOk: "Kod naliczony",
    discount: "Rabat",
    payMethod: "Metoda płatności",
    beforeYouPay: "Zanim zapłacisz",
    linkProcess: "Jak wygląda proces",
    linkWarranty: "Gwarancja",
    linkReturns: "Zwroty",
    linkShipping: "Wysyłka",

    payAny: "Wybiorę na stronie płatności Autopay",
    pay: "Kupuję i płacę",
    processing: "Przetwarzam",
    back: "Wróć do koszyka",
    terms: "Regulamin",
    privacy: "Polityka prywatności",
    blocked: "Nie udało się otworzyć strony płatności. Zamówienie jest zapisane, napisz do nas z jego numerem, a prześlemy link do zapłaty.",
    timeout: "Serwer nie odpowiedział w wyznaczonym czasie. Spróbuj ponownie albo napisz do nas.",
    generic: "Coś poszło nie tak",
    country: "Kraj dostawy",
    carrier: "Przewoźnik",
    businessDays: "dni roboczych",
    customsTitle: "Przesyłka poza Unię Europejską",
    customsBody: "Cło i podatek importowy nalicza urząd celny kraju odbiorcy, a pobiera je kurier przy doręczeniu. Nie są zawarte w cenie i nie możemy ich za Ciebie opłacić. Do paczki dołączamy deklarację celną z opisem zawartości i wartością zamówienia.",
    handlingNote: "W cenie wysyłki zagranicznej zawarte jest 10 PLN za obsługę nadania i dokumentów.",
    heavyTitle: "Przesyłka powyżej 2 kg",
    heavyBody: "Przy tej wadze koszt zależy od kierunku zbyt mocno, żeby podać go z góry. Napisz do nas, wycenimy wysyłkę indywidualnie.",
    payInstant: "Płatność natychmiastowa",
    payInstantNote: "BLIK lub przelew z polskiego banku. Rozliczenie w złotówkach.",
    payTransfer: "Przelew bankowy w euro",
    payTransferNote: "Zwykły przelew SEPA. Dane rachunku pokażemy po złożeniu zamówienia.",
    howItWorks: "Jak przebiega płatność przelewem",
    step1: "Składasz zamówienie. Nic jeszcze nie płacisz.",
    step2: "Pokazujemy dane rachunku, kwotę w euro i tytuł przelewu równy numerowi zamówienia. To samo dostajesz mailem.",
    step3: "Robisz zwykły przelew SEPA ze swojego banku. Kwota jest ostateczna, nic nie dopłacasz.",
    step4: "Gdy pieniądze wpłyną, potwierdzamy to ręcznie i wysyłamy potwierdzenie przyjęcia wpłaty wraz z informacją o rozpoczęciu prac.",
    step5: "Termin realizacji liczymy od zaksięgowania wpłaty, nie od złożenia zamówienia.",
    lockNote: "Kwota w euro i rezerwacja towaru obowiązują przez 3 dni robocze od złożenia zamówienia. Jeżeli czwartego dnia roboczego wpłata nie zostanie zaksięgowana na wskazanym koncie, rezerwacja zostaje zdjęta, a towar wraca do sprzedaży.",
    placeOrder: "Zamawiam z obowiązkiem zapłaty przelewem",
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
    missingTitle: "Before you pay, please complete:",
    freeShipping: "Free",
    freeShippingWhy: (kwota) => `on us, your order is over ${kwota}`,
    consents: "Consents",
    inboundTitle: "How you will send us your item",
    inboundWhy: "This order needs you to send us material or an item. Without this we do not know whether to wait for a parcel or for you.",
    consentTerms: "I accept the Terms of Service and the Privacy Policy",
    consentMade: "I am ordering an item made to my specification and acknowledge that once production begins I lose the right of withdrawal",
    consentDigital: "I request delivery of the digital content before the withdrawal period ends and acknowledge that once the download starts I lose the right of withdrawal",
    summary: "Summary",
    items: "Items",
    shipping: "Delivery",
    total: "To pay",
    codeLabel: "Discount code",
    codeIntro: "Have a discount code? Enter it below:",
    codePlaceholder: "e.g. AEJaCA10",
    codeApply: "Apply",
    codeRemove: "Remove code",
    codeOk: "Code applied",
    discount: "Discount",
    payMethod: "Payment method",
    beforeYouPay: "Before you pay",
    linkProcess: "How the process works",
    linkWarranty: "Warranty",
    linkReturns: "Returns",
    linkShipping: "Shipping",

    payAny: "I will choose on the Autopay payment page",
    pay: "Buy and pay",
    processing: "Processing",
    back: "Back to cart",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    blocked: "We could not open the payment page. Your order is saved, write to us with its number and we will send a payment link.",
    timeout: "The server did not respond in time. Please try again or write to us.",
    generic: "Something went wrong",
    country: "Delivery country",
    carrier: "Carrier",
    businessDays: "business days",
    customsTitle: "Shipment outside the European Union",
    customsBody: "Customs duty and import tax are set by the customs office of the destination country and collected by the courier on delivery. They are not included in the price and we cannot pay them on your behalf. We attach a customs declaration with the contents and the order value.",
    handlingNote: "International shipping includes 10 PLN for handling the dispatch and the paperwork.",
    heavyTitle: "Shipment over 2 kg",
    heavyBody: "At this weight the cost depends too much on the destination to state upfront. Write to us and we will quote the shipping individually.",
    payInstant: "Instant payment",
    payInstantNote: "BLIK or a link to a Polish bank. Requires an account in a Polish bank, settled in PLN.",
    payTransfer: "Bank transfer in EUR",
    payTransferNote: "An ordinary SEPA transfer. We show the account details once the order is placed.",
    howItWorks: "How paying by transfer works",
    step1: "You place the order. Nothing is charged yet.",
    step2: "We show you the account details, the amount in EUR and a payment reference equal to your order number. The same arrives by email.",
    step3: "You make an ordinary SEPA transfer from your bank. The amount is final, there is nothing to pay on top.",
    step4: "Once the money lands, we confirm it by hand and send you a receipt confirmation together with a note that work has started.",
    step5: "The lead time is counted from the day the money clears, not from the day you order.",
    lockNote: "The amount in EUR and the reservation of the goods hold for 3 business days from placing the order. If the payment has not cleared on the stated account by the fourth business day, the reservation is released and the goods go back on sale.",
    placeOrder: "Order with an obligation to pay by transfer",
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
    missingTitle: "Vor der Zahlung bitte ergänzen:",
    freeShipping: "Gratis",
    freeShippingWhy: (kwota) => `geschenkt, Ihre Bestellung liegt über ${kwota}`,
    consents: "Einwilligungen",
    inboundTitle: "Wie Sie uns Ihr Objekt zusenden",
    inboundWhy: "Für diese Bestellung müssen Sie uns Material oder ein Objekt zusenden. Ohne diese Angabe wissen wir nicht, ob wir auf ein Paket oder auf Sie warten.",
    consentTerms: "Ich akzeptiere die AGB und die Datenschutzerklärung",
    consentMade: "Ich bestelle eine nach meinen Vorgaben gefertigte Sache und nehme zur Kenntnis, dass mit Fertigungsbeginn das Widerrufsrecht erlischt",
    consentDigital: "Ich verlange die Lieferung des digitalen Inhalts vor Ablauf der Widerrufsfrist und nehme zur Kenntnis, dass mit Beginn des Downloads das Widerrufsrecht erlischt",
    summary: "Zusammenfassung",
    items: "Positionen",
    shipping: "Lieferung",
    total: "Zu zahlen",
    codeLabel: "Rabattcode",
    codeIntro: "Sie haben einen Rabattcode? Geben Sie ihn unten ein:",
    codePlaceholder: "z. B. AEJaCA10",
    codeApply: "Einlösen",
    codeRemove: "Code entfernen",
    codeOk: "Code angerechnet",
    discount: "Rabatt",
    payMethod: "Zahlungsmethode",
    beforeYouPay: "Bevor Sie zahlen",
    linkProcess: "So läuft der Prozess",
    linkWarranty: "Garantie",
    linkReturns: "Rückgabe",
    linkShipping: "Versand",

    payAny: "Ich wähle auf der Autopay-Zahlungsseite",
    pay: "Kaufen und bezahlen",
    processing: "Wird verarbeitet",
    back: "Zurück zum Warenkorb",
    terms: "AGB",
    privacy: "Datenschutz",
    blocked: "Die Zahlungsseite konnte nicht geöffnet werden. Ihre Bestellung ist gespeichert, schreiben Sie uns mit der Nummer.",
    timeout: "Der Server hat nicht rechtzeitig geantwortet. Bitte erneut versuchen oder uns schreiben.",
    generic: "Etwas ist schiefgelaufen",
    country: "Lieferland",
    carrier: "Versanddienstleister",
    businessDays: "Werktage",
    customsTitle: "Sendung außerhalb der Europäischen Union",
    customsBody: "Zoll und Einfuhrsteuer setzt die Zollbehörde des Bestimmungslandes fest, der Kurier zieht sie bei der Zustellung ein. Sie sind nicht im Preis enthalten und wir können sie nicht für Sie entrichten. Der Sendung liegt eine Zollerklärung mit Inhalt und Bestellwert bei.",
    handlingNote: "Im Auslandsversand sind 10 PLN für die Abwicklung und die Papiere enthalten.",
    heavyTitle: "Sendung über 2 kg",
    heavyBody: "Bei diesem Gewicht hängen die Kosten zu stark vom Ziel ab, um sie vorab zu nennen. Schreiben Sie uns, wir kalkulieren den Versand individuell.",
    payInstant: "Sofortzahlung",
    payInstantNote: "BLIK oder Link zu einer polnischen Bank. Erfordert ein Konto in Polen, Abrechnung in PLN.",
    payTransfer: "Banküberweisung in EUR",
    payTransferNote: "Eine gewöhnliche SEPA-Überweisung. Die Kontodaten zeigen wir nach der Bestellung.",
    howItWorks: "So läuft die Zahlung per Überweisung",
    step1: "Sie geben die Bestellung auf. Es wird noch nichts abgebucht.",
    step2: "Wir zeigen Ihnen Kontodaten, den Betrag in EUR und einen Verwendungszweck gleich Ihrer Bestellnummer. Dasselbe kommt per E-Mail.",
    step3: "Sie überweisen ganz normal per SEPA. Der Betrag ist endgültig, es kommt nichts hinzu.",
    step4: "Sobald das Geld eingeht, bestätigen wir es persönlich und senden Ihnen die Zahlungsbestätigung samt Hinweis, dass die Arbeit beginnt.",
    step5: "Die Lieferzeit zählt ab Geldeingang, nicht ab Bestelldatum.",
    lockNote: "Der Betrag in EUR und die Reservierung der Ware gelten 3 Werktage ab Bestellung. Ist die Zahlung bis zum vierten Werktag nicht auf dem angegebenen Konto eingegangen, wird die Reservierung aufgehoben und die Ware geht zurück in den Verkauf.",
    placeOrder: "Zahlungspflichtig bestellen, Überweisung",
  },
};

/** Nazwy krajow bierzemy z przegladarki, zeby nie utrzymywac listy w trzech
 *  jezykach. Gdy srodowisko tego nie potrafi, zostaje kod ISO. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { money, showEur, currency, setCurrency, rate } = useMoney();
  const u = UI[lang] || UI.en;
  const navigate = useNavigate();
  const { items, subtotalGrosze, ready, clear } = useCart();

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  // Klient czytajacy strone po angielsku lub niemiecku prawie nigdy nie wysyla
  // do Polski, wiec nie zaczynamy od paczkomatu, ktorego u siebie nie ma.
  const [country, setCountry] = useState(lang === "de" ? "DE" : lang === "en" ? "GB" : "PL");
  const [deliveryId, setDeliveryId] = useState(lang === "pl" ? "inpost_locker" : "courier");
  const [addr, setAddr] = useState({ line1: "", postalCode: "", city: "", point: "" });
  const [consents, setConsents] = useState({ terms: false, waiveWithdrawal: false, digitalImmediate: false });
  // Jak klient dostarczy NAM swoj przedmiot. Pytamy tutaj, a nie w kalkulatorze,
  // bo dopiero tu znany jest kraj, a od kraju zalezy lista mozliwosci. Pytanie
  // o kraj drugi raz dawaloby dwie odpowiedzi, ktore moglyby sie roznic.
  const [inbound, setInbound] = useState("");
  const [gatewayId, setGatewayId] = useState(0);
  // Klient czytajacy strone po angielsku lub niemiecku widzi ceny w euro,
  // a zadnym kanalem Autopay z zagranicy nie zaplaci, wiec zaczynamy od przelewu.
  // Sposob zaplaty WYNIKA Z WALUTY, nie jest osobnym wyborem: bramka rozlicza
  // wylacznie zlotowki, wiec euro moze pojsc tylko przelewem. Klient zmienia
  // droge zmieniajac walute i to jest jedyna decyzja, ktora ma do podjecia.
  const payMode = currency === "EUR" ? "bank_transfer" : "autopay";
  const [methods, setMethods] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [applied, setApplied] = useState(null);   // { code, discountGrosze }
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState(null);

  // Zgody zalezne od zawartosci koszyka, nie od zamowienia jako calosci.
  const hasMadeToOrder = items.some((i) => i.withdrawal === "made_to_order" || i.kind === "service");
  const hasDigital = items.some((i) => i.withdrawal === "digital");
  const onlyDigital = items.length > 0 && items.every((i) => i.withdrawal === "digital");

  // Lista metod zalezy od kraju: paczkomat istnieje tylko w Polsce, a kurier
  // kosztuje inaczej w kazdej strefie.
  const options = shippingOptions(country, subtotalGrosze);
  const optionIds = options.map((o) => o.id);

  useEffect(() => {
    if (!onlyDigital && optionIds.length && !optionIds.includes(deliveryId)) {
      setDeliveryId(optionIds[0]);
    }
  }, [country, onlyDigital, deliveryId, optionIds.join(",")]);

  const deliveryGrosze = onlyDigital ? 0 : shippingGrosze(deliveryId, country, subtotalGrosze) ?? 0;
  const deliveryMeta = DELIVERY_METHODS.find((d) => d.id === deliveryId);
  const delivery = onlyDigital
    ? { id: "digital", grosze: 0, label: { pl: "Dostawa cyfrowa", en: "Digital delivery", de: "Digitale Lieferung" } }
    : { id: deliveryId, grosze: deliveryGrosze, label: deliveryMeta?.label || { pl: "Dostawa", en: "Delivery", de: "Lieferung" } };

  const abroad = !onlyDigital && country !== "PL";
  const customs = !onlyDigital && needsCustoms(country);

  // Kod rabatowy sprawdza serwer, tu pokazujemy wylacznie wynik. Kwota
  // policzona w przegladarce nie ma znaczenia: zamowienie i tak przeliczy
  // wszystko od nowa, a niezgodnosc odbije sie bledem zamiast tansza paczka.
  const discountItems = items.map((i) => ({
    lineGrosze: ((i.unitGrosze || 0) + (i.packagingGrosze || 0)) * (i.qty || 1),
    source: i.productSlug ? "product" : "service",
    category: i.category || (String(i.calculator || "").startsWith("jewelry") ? "jewelry" : "studio"),
  }));

  const discountGrosze = applied?.discountGrosze || 0;
  const totalGrosze = Math.max(subtotalGrosze - discountGrosze, 0) + delivery.grosze;

  async function checkCode(raw, { silent = false } = {}) {
    const code = String(raw || "").trim().toUpperCase();
    if (!code || !API_URL) return;
    setCodeBusy(true);
    if (!silent) setCodeError(null);
    try {
      const r = await postJSON(`${API_URL}/api/discounts/check`, {
        code, email: customer.email || null, items: discountItems,
      });
      if (r.ok && r.data?.ok) {
        setApplied({ code: r.data.code, discountGrosze: r.data.discountGrosze });
        setCodeError(null);
      } else {
        setApplied(null);
        if (!silent) setCodeError(r.data?.error || u.generic);
      }
    } catch {
      setApplied(null);
      if (!silent) setCodeError(u.generic);
    } finally {
      setCodeBusy(false);
    }
  }

  // Zmiana koszyka zmienia kwote znizki, a przy kodzie z progiem moze ja
  // odebrac w calosci. Przeliczamy po cichu, zeby na ekranie nie stala kwota
  // sprzed zmiany.
  useEffect(() => {
    if (applied?.code) checkCode(applied.code, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotalGrosze]);

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

  // Deklaracja dostarczenia obowiazuje tylko wtedy, gdy klient rzeczywiscie ma
  // nam cos przyslac. Regule liczy ta sama funkcja co serwer, wiec formularz
  // nie przepusci zamowienia, ktore serwer odrzuci, ani odwrotnie.
  const wymagaInbound = items.some((i) => wymagaPrzesylki(i));
  const inboundOpcje = inboundOptionsFor(country);
  // Zmiana kraju zmienia liste, wiec wybor sprzed zmiany trzeba wyczyscic.
  // Inaczej klient zaznacza paczkomat, przelacza sie na Niemcy i widzi liste
  // bez zaznaczenia, ale z wartoscia w stanie, ktora poszlaby do zamowienia.
  useEffect(() => {
    if (inbound && !inboundOptionsFor(country).some((m) => m.id === inbound)) setInbound("");
  }, [country, inbound]);
  const inboundOk = !wymagaInbound || inboundOpcje.some((m) => m.id === inbound);

  // Blad pokazujemy po wyjsciu z pola albo po probie zaplaty, nie w trakcie
  // pisania. Formularz ma pomagac, a nie poprawiac kazda litere.
  const [triedToPay, setTriedToPay] = useState(false);

  const fieldErrors = validateCustomer(customer);

  const customerOk = Object.keys(fieldErrors).length === 0;

  // Lista tego, czego brakuje. Przycisk zostaje czynny: wylaczony przycisk nie
  // mowi, czego chce, wiec klient klika w martwy prostokat i zgaduje. Klikniecie
  // z brakami odslania bledy i przewija do pierwszego z nich.
  const missing = [
    fieldErrors.email && u.email,
    fieldErrors.name && u.name,
    fieldErrors.phone && u.phone,
    !addressOk && u.delivery,
    !inboundOk && u.inboundTitle,
    !consentsOk && u.consents,
  ].filter(Boolean);

  const canPay = items.length > 0 && customerOk && addressOk && consentsOk && inboundOk && !busy;

  async function pay() {
    if (!canPay) {
      // Nie karcimy w ciszy: pokazujemy wszystkie braki naraz i idziemy
      // do pierwszego z nich, zeby klient nie szukal ich sam po stronie.
      setTriedToPay(true);
      const first = document.querySelector('[aria-invalid="true"], #locker-search, #locker-code');
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus?.({ preventScroll: true });
      return;
    }
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
        // Pozycja z polki idzie samym adresem: cene, wage i dostepnosc backend
        // bierze z katalogu, wiec nie ma czego podstawiac z przegladarki.
        items: items.map((i) =>
          i.productSlug
            ? {
                productSlug: i.productSlug,
                qty: i.qty || 1,
                personalization: i.personalization || null,
              }
            : {
                calculator: i.calculator,
                params: i.params,
                geometry: i.geometry || null,
                fileName: i.fileName || null,
                uploadToken: i.uploadToken || null,
                packagingId: i.packagingId || null,
                personalization: i.personalization || null,
                // OPIS I ZALACZNIKI MUSZA TU BYC.
                //
                // Ich brak w tym miejscu byl cicha wada przez caly czas
                // istnienia koszyka: kalkulator zbieral opis, wymagal go przed
                // dodaniem pozycji, koszyk go trzymal, serwer umial go zapisac,
                // a poczta zamowieniowa umiala go wydrukowac. Tylko ten jeden
                // obiekt go nie przekazywal, wiec do pracowni szlo zamowienie
                // bez ani jednego zdania od klienta. Wyszlo dopiero wtedy, gdy
                // przyszlo oplacone BLIKiem zlecenie na laser z samym plikiem.
                //
                // Zaden sprawdzian tego nie widzial, bo kazdy element osobno
                // dzialal poprawnie. Wada byla w SZWIE miedzy nimi.
                description: i.description || null,
                packagingText: i.packagingText || null,
                packagingTextBack: i.packagingTextBack || null,
                attachmentToken: i.attachmentToken || null,
                attachmentTokens: i.attachmentTokens || null,
                // Skala modelu wchodzi do CENY: serwer liczy pozycje jeszcze
                // raz i bez niej przeliczylby powiekszony wydruk jak zwykly.
                // Wycena zapisana (`QuotePage`) przekazywala ja od poczatku,
                // koszyk nie, wiec ta sama pozycja kosztowala inaczej zaleznie
                // od drogi, ktora klient poszedl.
                scale: i.scale || 1,
                // Numer wyceny zwalnia pozycje z wymogu opisu po stronie
                // serwera: przeszla przez czlowieka, ktory ja policzyl.
                quoteRef: i.quoteRef || null,
                qty: i.qty || 1,
              }
        ),
        customer,
        delivery: {
          method: delivery.id,
          country,
          // Kierunek odwrotny: jak klient dostarczy NAM swoj przedmiot.
          inbound: wymagaInbound ? inbound : null,
          shippingGrosze: delivery.grosze,
          point: addr.point || null,
          addressLine1: addr.line1 || null,
          postalCode: addr.postalCode || null,
          city: addr.city || null,
        },
        consents,
        paymentMethod: payMode,
        currency,
        discountCode: applied?.code || null,
      });

      if (!created.ok) {
        setError(
          [created.data?.error || `${u.generic} (${created.status})`, created.data?.detail]
            .filter(Boolean)
            .join(" - ".replace(" - ", ": "))
        );
        setBusy(false);
        return;
      }

      // Przelew nie ma bramki. Zamowienie jest zlozone, wiec czyscimy koszyk
      // i prowadzimy klienta na strone z danymi rachunku.
      if (payMode === "bank_transfer") {
        clear();
        navigate(`/order/status/?ref=${created.data.orderRef}&token=${created.data.token}`);
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
              <div key={i.id} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-300">{i.title} &times; {i.qty || 1}</span>
                  <span className="text-white">{money(((i.unitGrosze || 0) + (i.packagingGrosze || 0)) * (i.qty || 1))}</span>
                </div>
                {/* Ostatni ekran przed platnoscia musi pokazywac to samo, co
                    koszyk. Klient placi tutaj, wiec tutaj musi widziec, za co. */}
                <div className="text-neutral-500 text-xs mt-1 space-y-0.5">
                  {describeParams(i, lang).map((w) => (
                    <div key={w.label}>{w.label}: <span className="text-neutral-400">{w.value}</span></div>
                  ))}
                </div>
              </div>
            ))}
            {discountGrosze > 0 && (
              <div className="flex justify-between text-sm pt-2 mt-2 border-t border-white/5">
                <span className="text-emerald-300">{u.discount}: {applied.code}</span>
                <span className="text-emerald-300">-{money(discountGrosze)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-white/5">
              <span className="text-neutral-400">{u.shipping}: {t(delivery.label, lang)}</span>
              {delivery.grosze === 0 && !onlyDigital && delivery.id !== "pickup"
                ? <span className="text-emerald-300">{u.freeShipping}</span>
                : <span className="text-white">{money(delivery.grosze)}</span>}
            </div>
            <div className="flex justify-between font-bold pt-3 mt-3 border-t border-white/10">
              <span className="text-white">{u.total}</span>
              <span className="text-blue-400 text-xl">{money(totalGrosze)}</span>
            </div>

            {/* Kod rabatowy. Wpisany kod sprawdza serwer, wiec komunikat mowi
                dokladnie, dlaczego kod nie dziala: wygasl, byl juz uzyty albo
                nie obejmuje niczego z tego koszyka. */}
            <div className="pt-4 mt-4 border-t border-white/5">
              {applied ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-emerald-300 text-xs inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />{u.codeOk}: <strong>{applied.code}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setApplied(null); setCodeInput(""); setCodeError(null); }}
                    className="text-neutral-500 hover:text-white text-xs transition-colors"
                  >
                    {u.codeRemove}
                  </button>
                </div>
              ) : (
                <div>
                  {/* Samo pole bez zdania nad nim czytalo sie jak kolejna rubryka
                      do wypelnienia. Zdanie mowi wprost, ze to opcja dla tych,
                      ktorzy kod maja, a reszta moze przejsc dalej. */}
                  <label htmlFor="discount-code" className="block text-neutral-400 text-xs mb-2">
                    {u.codeIntro}
                  </label>
                  <div className="flex gap-2"><input
                    id="discount-code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && checkCode(codeInput)}
                    placeholder={u.codePlaceholder}
                    // Wpisywany kod idzie wielkimi literami, bo takie sa kody,
                    // ale podpowiedz zostaje w zapisie marki: AEJaCA10.
                    className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                               placeholder:text-neutral-600 placeholder:normal-case focus:outline-none focus:border-blue-400/50 uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => checkCode(codeInput)}
                    disabled={!codeInput.trim() || codeBusy}
                    className="px-4 py-2 rounded-lg border border-white/15 text-neutral-300 text-sm
                               hover:border-white/30 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    {codeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : u.codeApply}
                  </button>
                  </div>
                </div>
              )}
              {codeError && <p className="text-amber-300 text-xs mt-2">{codeError}</p>}
            </div>
          </div>

          <h2 className="text-white font-semibold mb-4">{u.yourData}</h2>
          <CustomerFields
            value={customer}
            onChange={setCustomer}
            labels={{ email: u.email, name: u.name, phone: u.phone }}
            lang={lang}
            showErrors={triedToPay}
          />

          {!onlyDigital && (
            <>
              <h2 className="text-white font-semibold mb-3 mt-8">{u.delivery}</h2>

              <label className="block text-xs font-medium text-neutral-400 mb-1.5">{u.country}</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
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
                        <div className="text-neutral-500 text-xs">
                          {o.id === "pickup"
                            ? t(meta.note, lang)
                            : `${u.carrier}: ${o.carrier}, ${leadDaysLabel(o)} ${u.businessDays}`}
                        </div>
                      </div>
                      {/* Samo "0,00 zl" obok nazwy przewoznika czyta sie jak
                          zepsuty cennik, a nie jak prezent. Slowo zamiast zera,
                          a pod nim powod. */}
                      <div className="text-sm font-semibold whitespace-nowrap text-right">
                        {o.grosze === 0 && o.id !== "pickup" ? (
                          <>
                            <span className="text-emerald-300">{u.freeShipping}</span>
                            <span className="block text-neutral-500 text-xs font-normal line-through">
                              {money(o.listGrosze ?? 0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-white">{money(o.grosze)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {options.some((o) => o.grosze === 0 && o.id !== "pickup") && (
                <p className="text-emerald-300/80 text-xs mb-4">
                  {u.freeShippingWhy(money(FREE_SHIPPING_FROM_GROSZE))}
                </p>
              )}

              {abroad && <p className="text-neutral-600 text-xs mb-4">{u.handlingNote}</p>}

              {/* Clo pobiera kurier przy doreczeniu. Klient musi to wiedziec
                  przed zaplata, a nie od kuriera pod drzwiami. */}
              {customs && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 mb-4">
                  <p className="text-amber-200 text-xs font-medium mb-1">{u.customsTitle}</p>
                  {/* amber-200/80, nie amber-100/80: tryb jasny przemalowuje
                      tylko klasy wypisane w index.css, a ta druga nie byla tam
                      obecna i akapit znikal na kremowym tle. */}
                  <p className="text-amber-200/80 text-xs leading-relaxed">{u.customsBody}</p>
                </div>
              )}

              {deliveryId === "inpost_locker" && (
                <LockerPicker
                  api={API_URL}
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
                    <span className="block text-neutral-400 text-xs mt-0.5">{t(m.note, lang)}</span>
                  </button>
                ))}
              </div>
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

          {/* Odnosniki do dokumentow STOJA TU, przy przycisku zaplaty, a nie
              tylko w stopce. To jest chwila, w ktorej klient pyta "co bedzie
              dalej": ile to potrwa, co jesli sie rozmysli, jak dziala gwarancja.
              Odpowiedzi istnialy od dawna, tylko trzeba bylo ich szukac. */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 mt-8 text-xs">
            <span className="text-neutral-500">{u.beforeYouPay}:</span>{" "}
            <Link to="/payments/" className="text-blue-400 hover:text-blue-300">{u.linkProcess}</Link>
            <span className="text-neutral-700"> &middot; </span>
            <Link to="/shipping/" className="text-blue-400 hover:text-blue-300">{u.linkShipping}</Link>
            <span className="text-neutral-700"> &middot; </span>
            <Link to="/warranty/" className="text-blue-400 hover:text-blue-300">{u.linkWarranty}</Link>
            <span className="text-neutral-700"> &middot; </span>
            <Link to="/returns/" className="text-blue-400 hover:text-blue-300">{u.linkReturns}</Link>
            <span className="text-neutral-700"> &middot; </span>
            <Link to="/terms/" className="text-blue-400 hover:text-blue-300">{u.terms}</Link>
          </div>

          <h2 className="text-white font-semibold mb-3 mt-8">{u.payMethod}</h2>

          {/* Wybor stoi przed KAZDYM klientem, nie tylko przed tym, ktory czyta
              po angielsku. Polak z kontem w euro i Niemiec z polska karta to sa
              prawdziwi ludzie, a wczesniej ani jeden, ani drugi nie mial jak
              zaplacic po swojemu. */}
          <div className="space-y-2 mb-5">
              <button
                type="button"
                onClick={() => setCurrency("EUR")}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  payMode === "bank_transfer" ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-medium ${payMode === "bank_transfer" ? "text-blue-300" : "text-neutral-300"}`}>
                    {u.payTransfer}
                  </span>
                  <span className="text-white text-sm font-semibold">{formatEur(totalGrosze, rate, lang)}</span>
                </div>
                <p className="text-neutral-500 text-xs mt-1">{u.payTransferNote}</p>
              </button>

              <button
                type="button"
                onClick={() => setCurrency("PLN")}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  payMode === "autopay" ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-medium ${payMode === "autopay" ? "text-blue-300" : "text-neutral-300"}`}>
                    {u.payInstant}
                  </span>
                  {/* Ta metoda rozlicza sie w zlotowkach, wiec kwote podajemy
                      w zlotowkach. Ukrycie jej konczy sie innym obciazeniem
                      niz to, ktore klient widzial. */}
                  <span className="text-white text-sm font-semibold">{formatPln(totalGrosze, lang)}</span>
                </div>
                <p className="text-neutral-500 text-xs mt-1">{u.payInstantNote}</p>
              </button>
            </div>

          {payMode === "bank_transfer" ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
              <h3 className="text-white text-sm font-medium mb-3">{u.howItWorks}</h3>
              <ol className="space-y-2">
                {[u.step1, u.step2, u.step3, u.step4, u.step5].map((step, n) => (
                  <li key={n} className="flex gap-2.5 text-neutral-400 text-xs leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full border border-white/15 text-xs text-neutral-300
                                     flex items-center justify-center tabular-nums">{n + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="text-neutral-600 text-xs mt-3">{u.lockNote}</p>
            </div>
          ) : (
          <PaymentPicker
            methods={methods}
            value={gatewayId}
            onChange={setGatewayId}
            anyLabel={u.payAny}
            lang={lang}
          />
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 mb-4 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Lista brakow stoi tuz nad przyciskiem, w kolorze ostrzezenia,
              nie bledu: to jeszcze nie pomylka, tylko niedokonczona robota. */}
          {missing.length > 0 && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 mb-3">
              <p className="text-amber-200 text-xs">
                {u.missingTitle} <span className="font-medium">{missing.join(", ")}</span>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={busy || items.length === 0}
            // Niebieski znaczy "mozna placic". Dopoki czegos brakuje, przycisk
            // jest szary, ale nadal czynny: klikniecie pokazuje, czego brakuje.
            // Wylaczony przycisk milczy, a szary mowi "jeszcze nie" i tlumaczy
            // sie po nacisnieciu.
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-colors
                       disabled:cursor-not-allowed ${
              // `busy` liczy sie jak komplet: w trakcie przetwarzania przycisk
              // nie ma prawa poszarzec, bo wygladaloby to jak cofniecie sie
              // formularza tuz po klinieciu.
              canPay || busy
                ? "bg-blue-500 hover:bg-blue-400 text-white"
                : "bg-neutral-800 text-neutral-400 border border-white/10 hover:border-white/20"
            }`}
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{u.processing}</>
            ) : payMode === "bank_transfer" ? (
              <><ShieldCheck className="w-4 h-4" />{u.placeOrder}</>
            ) : (
              <><ShieldCheck className="w-4 h-4" />{u.pay} {showEur ? formatPln(totalGrosze, lang) : money(totalGrosze)}</>
            )}
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
