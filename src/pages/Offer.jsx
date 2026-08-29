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
import { useSearchParams } from "react-router-dom";
import { Link } from "../i18n/nav.jsx";
import { Loader2, Tag, Check, CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowRight, Coins } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import LockerPicker from "../components/shop/LockerPicker.jsx";
import CustomerFields, { ValidatedField as Field } from "../components/shop/CustomerFields.jsx";
import { validateCustomer } from "../shop/customerFields.js";
import { DELIVERY_METHODS } from "../data/orderCatalog.js";
import { shippingOptions, leadDaysLabel } from "../pricing/shipping.js";
import { countryList } from "../data/countryNames.js";
import { useMoney, formatPln, formatEur } from "../shop/money.js";
import { TRANSFER_HOLD_BUSINESS_DAYS } from "../pricing/businessDays.js";

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
    currencyTitle: "Waluta zapłaty",
    currencyLead: "Kwota jest ta sama, zmienia się tylko waluta i droga zapłaty. Wybór dotyczy całej oferty.",
    currencyPln: "Złotówki, BLIK albo przelew online",
    currencyEur: "Euro, przelew na nasz rachunek walutowy",
    currencyRate: "Przeliczone po kursie {rate} zł za euro z dnia dzisiejszego. Kwotę zamrażamy w chwili złożenia zamówienia.",
    howTransfer: "Jak przebiega zapłata przelewem",
    tr1: "Składasz zamówienie tutaj. Kwota w euro i kurs zostają zamrożone w tej chwili.",
    tr2: "Dostajesz stronę zamówienia z numerem rachunku, kwotą i tytułem przelewu. To samo idzie mailem.",
    tr3: "Robisz przelew w swoim banku. Tytułem jest numer zamówienia, po nim rozpoznajemy wpłatę.",
    tr4: "Księgujemy wpłatę ręcznie, zwykle następnego dnia roboczego. Dostajesz potwierdzenie.",
    tr5: "Zaczynamy pracę. Od tej chwili zamówienie idzie tą samą drogą co każde inne.",
    trHold: "Kwota i kurs obowiązują {days} dni robocze. Po tym czasie zamówienie wygasa, a ofertę wystawiamy na nowo.",
    howInstant: "Jak przebiega zapłata w złotówkach",
    in1: "Składasz zamówienie tutaj i przechodzisz do bramki płatniczej.",
    in2: "Płacisz BLIK-iem albo przelewem online, w swoim banku.",
    in3: "Potwierdzenie wraca do nas w kilka sekund i zamówienie od razu trafia do pracowni.",
    optionsHere: "Dodatki, jeśli chcesz",
    perPc: "za sztukę",
    pcs: "szt.",
    leadDaysUnit: "dni",
    leadDayUnit: "dzień",
    leadNeedsDetails: "wymaga ustalenia szczegółów",
    leadGroup: "Termin tej grupy",
    leadTotalTitle: "Termin realizacji wybranego zakresu zlecenia",
    leadTotalDesc: "Liczymy najdłuższy termin spośród zaznaczonych pozycji, bo paczka wychodzi jedna. Czas biegnie od zapłaty.",
    leadAfterDetails: "po ustaleniu szczegółów wyniesie {n}",
    leadItemNote: "termin realizacji tej pozycji - {n}",
    defaultIncluded: "wybrana domyślnie",
    leadTotalDetails: "Zaznaczyłeś pozycję, która wymaga ustalenia szczegółów. Najpierw się odezwiemy, a czas realizacji ruszy dopiero po ustaleniach, więc nic Ci nie ucieka. Podana liczba dni to najdłuższy termin spośród zaznaczonych pozycji, bo paczka wychodzi jedna.",
    leadNone: "Termin ustalimy przy potwierdzeniu.",
    note: "Opis oferty",
    validUntil: "Oferta obowiązuje do",
    validUntilPast: "Oferta obowiązywała do",
    expiredTitle: "Ta oferta straciła ważność",
    expiredDesc: "Kwota przestała obowiązywać, więc nie możemy jej teraz przyjąć. Napisz do nas, wystawimy nową.",
    doneTitle: "Oferta opłacona i zlecona",
    doneDesc: "Nie ma tu już nic do zapłacenia. Stan realizacji sprawdzisz na stronie zamówienia.",
    goToOrder: "Przejdź do zamówienia",
    partialTitle: "Część tej oferty jest już zlecona",
    partialDesc: "Poniżej został wyłącznie ten zakres, którego jeszcze nie zamawiałeś. Możesz zapłacić za niego teraz albo wrócić tu później, dopóki oferta jest ważna.",
    yourOrders: "Zamówienia z tej oferty",
    stateSettled: "Zlecone",
    stateReserved: "Czeka na zapłatę",
    orderNo: "Zamówienie {ref}",
    groupClosed: "Wybór w tej grupie jest już zlecony, więc pozostałe propozycje są nieaktualne.",
    nothingPicked: "Nic nie jest zaznaczone. Zaznacz to, za co chcesz zapłacić.",
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
    currencyTitle: "Payment currency",
    currencyLead: "The amount stays the same, only the currency and the way you pay change. The choice covers the whole offer.",
    currencyPln: "Zloty, BLIK or an online transfer",
    currencyEur: "Euro, transfer to our currency account",
    currencyRate: "Converted at {rate} zloty per euro, today's rate. The amount is locked when you place the order.",
    howTransfer: "How paying by transfer works",
    tr1: "You place the order here. The euro amount and the rate are locked at that moment.",
    tr2: "You get an order page with the account number, the amount and the payment title. The same goes out by email.",
    tr3: "You make the transfer in your bank. The title is the order number, that is how we recognise the payment.",
    tr4: "We book the payment by hand, usually on the next working day. You get a confirmation.",
    tr5: "We start the work. From here the order follows the same path as any other.",
    trHold: "The amount and the rate hold for {days} business days. After that the order expires and we issue the offer again.",
    howInstant: "How paying in zloty works",
    in1: "You place the order here and go to the payment gateway.",
    in2: "You pay with BLIK or an online transfer, in your own bank.",
    in3: "The confirmation reaches us within seconds and the order goes straight to the workshop.",
    optionsHere: "Add-ons, if you want them",
    perPc: "per piece",
    pcs: "pcs",
    leadDaysUnit: "days",
    leadDayUnit: "day",
    leadNeedsDetails: "details to be agreed first",
    leadGroup: "Lead time for this group",
    leadTotalTitle: "Lead time for the selected scope",
    leadTotalDesc: "We take the longest lead time among the ticked items, because the parcel goes out once. The clock starts at payment.",
    leadAfterDetails: "{n} once the details are agreed",
    leadItemNote: "lead time for this item - {n}",
    defaultIncluded: "included by default",
    leadTotalDetails: "You ticked an item whose details we need to agree first. We will get in touch, and the lead time starts only after that, so nothing is running out. The number of days is the longest among the ticked items, because the parcel goes out once.",
    leadNone: "We will agree the lead time when we confirm the order.",
    note: "About this offer",
    validUntil: "The offer is valid until",
    validUntilPast: "The offer was valid until",
    expiredTitle: "This offer has expired",
    expiredDesc: "The amount no longer stands, so we cannot accept it now. Write to us and we will issue a new one.",
    doneTitle: "Offer paid and in progress",
    doneDesc: "There is nothing left to pay for here. You can follow the work on the order page.",
    goToOrder: "Go to the order",
    partialTitle: "Part of this offer is already ordered",
    partialDesc: "What you see below is only the part you have not ordered yet. Pay for it now, or come back later while the offer is still valid.",
    yourOrders: "Orders from this offer",
    stateSettled: "Ordered",
    stateReserved: "Awaiting payment",
    orderNo: "Order {ref}",
    groupClosed: "The choice in this group has already been ordered, so the other proposals no longer apply.",
    nothingPicked: "Nothing is ticked. Tick what you want to pay for.",
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
    currencyTitle: "Zahlungswährung",
    currencyLead: "Der Betrag bleibt gleich, nur die Währung und der Zahlweg ändern sich. Die Wahl gilt für das ganze Angebot.",
    currencyPln: "Zloty, BLIK oder Online-Überweisung",
    currencyEur: "Euro, Überweisung auf unser Währungskonto",
    currencyRate: "Umgerechnet zum heutigen Kurs von {rate} Zloty je Euro. Den Betrag frieren wir bei der Bestellung ein.",
    howTransfer: "So läuft die Zahlung per Überweisung",
    tr1: "Sie bestellen hier. Eurobetrag und Kurs werden in diesem Moment eingefroren.",
    tr2: "Sie erhalten eine Bestellseite mit Kontonummer, Betrag und Verwendungszweck. Dasselbe geht per E-Mail raus.",
    tr3: "Sie überweisen in Ihrer Bank. Der Verwendungszweck ist die Bestellnummer, daran erkennen wir die Zahlung.",
    tr4: "Wir buchen die Zahlung von Hand, meist am nächsten Werktag. Sie bekommen eine Bestätigung.",
    tr5: "Wir beginnen die Arbeit. Ab hier läuft die Bestellung wie jede andere.",
    trHold: "Betrag und Kurs gelten {days} Werktage. Danach verfällt die Bestellung und wir stellen das Angebot neu aus.",
    howInstant: "So läuft die Zahlung in Zloty",
    in1: "Sie bestellen hier und gehen zum Zahlungs-Gateway.",
    in2: "Sie zahlen mit BLIK oder per Online-Überweisung in Ihrer Bank.",
    in3: "Die Bestätigung erreicht uns in Sekunden und die Bestellung geht direkt in die Werkstatt.",
    optionsHere: "Zusätze, wenn Sie mögen",
    perPc: "pro Stück",
    pcs: "Stk.",
    leadDaysUnit: "Tage",
    leadDayUnit: "Tag",
    leadNeedsDetails: "Details sind vorher abzustimmen",
    leadGroup: "Lieferzeit dieser Gruppe",
    leadTotalTitle: "Lieferzeit des gewählten Umfangs",
    leadTotalDesc: "Wir nehmen die längste Lieferzeit der angehakten Positionen, denn das Paket geht einmal raus. Die Zeit läuft ab der Zahlung.",
    leadAfterDetails: "{n} nach Abstimmung der Details",
    leadItemNote: "Lieferzeit dieser Position - {n}",
    defaultIncluded: "standardmäßig enthalten",
    leadTotalDetails: "Sie haben eine Position angehakt, deren Details wir zuerst abstimmen müssen. Wir melden uns, und die Lieferzeit beginnt erst danach, es geht Ihnen also nichts verloren. Die Zahl der Tage ist die längste unter den angehakten Positionen, denn das Paket geht einmal raus.",
    leadNone: "Die Lieferzeit stimmen wir bei der Bestätigung ab.",
    note: "Zum Angebot",
    validUntil: "Das Angebot gilt bis",
    validUntilPast: "Das Angebot galt bis",
    expiredTitle: "Dieses Angebot ist abgelaufen",
    expiredDesc: "Der Betrag gilt nicht mehr, wir können ihn jetzt nicht annehmen. Schreiben Sie uns, wir stellen ein neues aus.",
    doneTitle: "Angebot bezahlt und beauftragt",
    doneDesc: "Hier ist nichts mehr zu bezahlen. Den Stand der Arbeit sehen Sie auf der Bestellseite.",
    goToOrder: "Zur Bestellung",
    partialTitle: "Ein Teil dieses Angebots ist bereits beauftragt",
    partialDesc: "Unten steht nur noch das, was Sie noch nicht bestellt haben. Sie können es jetzt bezahlen oder später wiederkommen, solange das Angebot gilt.",
    yourOrders: "Bestellungen aus diesem Angebot",
    stateSettled: "Beauftragt",
    stateReserved: "Wartet auf Zahlung",
    orderNo: "Bestellung {ref}",
    groupClosed: "Die Wahl in dieser Gruppe ist bereits beauftragt, die übrigen Vorschläge gelten daher nicht mehr.",
    nothingPicked: "Nichts ist angehakt. Haken Sie an, wofür Sie zahlen möchten.",
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
/** "5 dni" albo "1 dzien". Jedna regula, bo liczba stoi w trzech miejscach. */
function dni(ile, u) {
  return `${ile} ${ile === 1 ? u.leadDayUnit : u.leadDaysUnit}`;
}

function Wiersz({ it, money, u, bezIlosci = false }) {
  const drobiazgi = [
    bezIlosci ? null : `${it.qty} ${u.pcs}`,
    !bezIlosci && it.unitGrosze != null && it.qty > 1 ? `${money(it.unitGrosze)} ${u.perPc}` : null,
    it.requiresDetails ? u.leadNeedsDetails : null,
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
        {/* Pozycja juz sprzedana mowi to wprost, razem z numerem zamowienia:
            klient sprawdza po nim stan realizacji i to jedyny powod, dla
            ktorego numer tu stoi. */}
        {/* Termin PRZY POZYCJI, na koncu i na szaro: klient wybiera miedzy
            propozycjami takze czasem, nie sama cena, ale liczba dni przy
            pozycji nie jest terminem calego zlecenia i nie moze wygladac tak
            samo jak on. Terminem zlecenia jest najdluzszy z zaznaczonych
            i stoi osobno, pod pozycjami. */}
        {it.leadDays ? (
          <div className="text-neutral-600 text-xs mt-0.5">
            ({u.leadItemNote.replace("{n}", dni(it.leadDays, u))})
          </div>
        ) : null}
        {it.state && it.state !== "available" && (
          <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${it.state === "settled" ? "text-emerald-300" : "text-amber-300"}`}>
            {it.state === "settled" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
            <span>
              {it.state === "settled" ? u.stateSettled : u.stateReserved}
              {it.orderRef ? ` · ${u.orderNo.replace("{ref}", it.orderRef)}` : ""}
            </span>
          </div>
        )}
      </div>
      <div className="text-neutral-200 text-sm shrink-0">{it.lineGrosze != null ? money(it.lineGrosze) : "-"}</div>
    </>
  );
}

/**
 * Pozycja, przy ktorej nie ma juz czego wybierac.
 *
 * Wyszarzone pole zaznaczania znaczy "nie wolno ci zmienic wyboru", a nie
 * "to jest juz zrobione", wiec kontrolki tu po prostu nie ma. `ton` odroznia
 * rzecz zlecona od propozycji, ktora odpadla razem z wyborem w swojej grupie.
 */
function PozycjaBezWyboru({ it, money, u, ton }) {
  const zrobione = ton === "zrobione";
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        zrobione ? "border-emerald-400/25 bg-emerald-400/[0.05]" : "border-white/5 bg-white/[0.01] opacity-50"
      }`}
    >
      <span className="flex items-start justify-between gap-4 flex-1 min-w-0">
        <Wiersz it={it} money={money} u={u} bezIlosci />
      </span>
    </div>
  );
}

/** Zamowienia zlozone z tej oferty. Jedna oferta rodzi ich tyle, ile razy klient cos z niej wzial. */
function ListaZamowien({ zamowienia, u }) {
  if (!zamowienia.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="text-neutral-400 text-xs">{u.yourOrders}</div>
      {/* Odnosnik niesie NUMER I ZETON. Bez nich strona statusu nie wie, o ktore
          zamowienie chodzi, i pokazuje stan domyslny, czyli "czekamy na
          potwierdzenie platnosci": zdanie nieprawdziwe przy zamowieniu
          rozliczonym miesiac temu i bez zadnej wskazowki, czego dotyczy. */}
      {zamowienia.map((z) => (
        <div key={z.orderRef} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-mono text-neutral-200">{z.orderRef}</span>
          <span className={`text-xs ${z.paid ? "text-emerald-300" : "text-amber-300"}`}>
            {z.paid ? u.stateSettled : u.stateReserved}
          </span>
          <Link
            to={{
              pathname: "/order/status/",
              search: `?ref=${encodeURIComponent(z.orderRef)}${z.token ? `&token=${encodeURIComponent(z.token)}` : ""}`,
            }}
            className="inline-flex items-center gap-1.5 text-emerald-300 text-xs hover:text-emerald-200"
          >
            {u.goToOrder} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function Offer() {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.pl;
  const { money: moneyPrzegladarki, rate, setCurrency: ustawWaluteSklepu } = useMoney();

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

  // Kwoty tej strony ida za waluta OFERTY, a nie za ustawieniem sklepu: oferta
  // jest dokumentem handlowym i ma jedna walute, te sama w mailu, na ekranie
  // i w przelewie.
  const walutaOferty = offer?.currency || null;
  const kursOferty = offer?.eurRate || rate;
  const money = walutaOferty
    ? (grosze) => (walutaOferty === "EUR" ? formatEur(grosze, kursOferty, lang) : formatPln(grosze, lang))
    : moneyPrzegladarki;

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
    // Wariant kupiony zamyka swoja grupe: pozostale byly alternatywami, a nie
    // rzeczami do dokupienia. Dodatki z tej samej karty zostaja otwarte, bo
    // polerowanie doklada sie do klucza, ktory klient wlasnie kupil.
    for (const karta of karty) {
      karta.rozstrzygnieta = karta.variants.some((v) => v.state && v.state !== "available");
      const terminy = [...karta.variants, ...karta.options]
        .map((i) => Number(i.leadDays))
        .filter((d) => Number.isFinite(d) && d > 0);
      karta.leadDays = terminy.length ? Math.max(...terminy) : null;
    }
    return { fixed, karty };
  }, [offer]);

  // Nie zostalo nic do wziecia. Zablokowana jest wtedy CALA oferta; przy
  // ofercie czesciowo zleconej reszta pozycji dalej sie klika, bo po to tam
  // zostala.
  const domkniete = Boolean(offer?.settled);
  const zamowienia = offer?.orders || [];
  const czesciowo = !domkniete && zamowienia.length > 0;
  const zablokowane = choosing || Boolean(offer?.expired) || domkniete;

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

  async function zmienWalute(waluta) {
    if (choosing || waluta === walutaOferty) return;
    setChoosing(true);
    setChooseError(null);
    const r = await postJSON(`${API}/api/quotes/${encodeURIComponent(ref)}/currency`, { token, currency: waluta });
    setChoosing(false);
    if (!r.ok) { setChooseError(r.data?.error || u.errorGeneric); return; }
    // Znizka byla policzona w poprzedniej walucie i w poprzedniej drodze
    // zaplaty, wiec przestaje obowiazywac razem z nimi.
    setDiscount(null);
    setCodeError(null);
    // Sklep idzie za oferta: klient, ktory wybral tu euro, ma potem widziec
    // euro takze w koszyku, zamiast wracac do cen liczonych inaczej.
    ustawWaluteSklepu(waluta);
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

  const kraje = countryList(lang);

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
  // Nic nie jest zaznaczone. Przy ofercie nietknietej to stan niemozliwy,
  // bo serwer nie pozwala jej zostac bez kwoty. Po czesciowym zleceniu jest
  // za to zwyczajny: klient kupil jeden dodatek, pozostale zostawil odznaczone
  // i wroci po nie pozniej. Wtedy przycisk gasnie zamiast wysylac zero.
  const pustyKoszyk = itemsTotal <= 0;
  const gotowe = adresOk && daneOk && consents.terms && !pustyKoszyk;

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

    // Przelew nie ma bramki. Zamowienie jest zlozone, wiec prowadzimy klienta
    // na strone zamowienia: tam stoi numer rachunku, kwota w euro i tytul.
    if (created.data.paymentMethod === "bank_transfer") {
      window.location.assign(`/order/status/?ref=${created.data.orderRef}&token=${created.data.token}`);
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

              {domkniete && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                  <h2 className="text-emerald-300 font-semibold mb-1">{u.doneTitle}</h2>
                  <p className="text-emerald-300/80 text-sm leading-relaxed">{u.doneDesc}</p>
                  <ListaZamowien zamowienia={zamowienia} u={u} />
                </div>
              )}

              {/* Czesc oferty jest zlecona, reszta dalej stoi. To jest stan,
                  ktorego ta strona do tej pory nie umiala pokazac: pierwsze
                  zamowienie gasilo cala oferte razem z rzeczami, ktorych nikt
                  nie kupil. */}
              {czesciowo && (
                <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-5">
                  <h2 className="text-sky-300 font-semibold mb-1">{u.partialTitle}</h2>
                  <p className="text-sky-300/80 text-sm leading-relaxed">{u.partialDesc}</p>
                  <ListaZamowien zamowienia={zamowienia} u={u} />
                </div>
              )}

              {offer.expired && !domkniete && (
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

                {/* Opis oferty stoi NAD pozycjami, bo to on mowi, o czym jest
                    cala reszta. Pod nimi czytalo sie jak przypis do rachunku,
                    a jest odwrotnie: rachunek jest szczegolem tego opisu. */}
                {offer.priceNote && (
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <div className="text-neutral-600 text-xs mb-1">{u.note}</div>
                    <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">{offer.priceNote}</p>
                  </div>
                )}

                {/* Skladniki rachunku: te sa w kwocie zawsze i nie ma przy nich
                    czego wybierac. */}
                {/* Skladnik rachunku wchodzi do kwoty ZAWSZE i nie ma przy nim
                    czego wybierac, ale do tej pory nie mial tez zadnego
                    oznaczenia: klient widzial nazwe i cene, i nie mial jak
                    poznac, ze wlasnie za to placi. Ramka jest ta sama, co przy
                    zaznaczonym dodatku, bo znaczy to samo: to jest w zamowieniu.
                    Rozni ja podpis, bo tu niczego sie nie klika. */}
                {uklad.fixed.length > 0 && (
                  <div className="space-y-2">
                    {uklad.fixed.map((it) => (
                      <div
                        key={it.id}
                        className="rounded-lg border border-amber-400/50 bg-amber-400/[0.06] p-4"
                      >
                        <div className="text-amber-300/80 text-xs mb-1.5">{u.defaultIncluded}</div>
                        <div className="flex items-start justify-between gap-4">
                          <Wiersz it={it} money={money} u={u} />
                        </div>
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
                    {karta.variants.map((it) => {
                      // Trzy rozne wiersze, bo to trzy rozne zdania: "wybierz",
                      // "to juz zlecone" i "ta propozycja odpadla".
                      if (it.state && it.state !== "available") {
                        return <PozycjaBezWyboru key={it.id} it={it} money={money} u={u} ton="zrobione" />;
                      }
                      if (karta.rozstrzygnieta) {
                        return <PozycjaBezWyboru key={it.id} it={it} money={money} u={u} ton="nieaktualne" />;
                      }
                      return (
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
                      );
                    })}
                    {karta.rozstrzygnieta && karta.variants.length > 1 && (
                      <p className="text-neutral-500 text-xs pt-1">{u.groupClosed}</p>
                    )}

                    {karta.options.length > 0 && (
                      <div className="text-neutral-500 text-xs pt-2">{u.optionsHere}</div>
                    )}
                    {/* Dodatek kupiony znika z wyboru, ale dodatek stojacy przy
                        zamknietej grupie wariantow zostaje: doklada sie do rzeczy,
                        ktora klient wlasnie kupil, i po to tam jest. */}
                    {karta.options.map((it) => (
                      it.state && it.state !== "available" ? (
                        <PozycjaBezWyboru key={it.id} it={it} money={money} u={u} ton="zrobione" />
                      ) : (
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
                      )
                    ))}

                    {/* Termin grupy to NAJDLUZSZY sposrod jej pozycji, ta sama
                        regula co dla calego zamowienia. Stoi POD pozycjami,
                        bo jest ich podsumowaniem: nad nimi czytalo sie jak
                        zapowiedz czegos, czego jeszcze nie widac. */}
                    {karta.leadDays ? (
                      <p className="text-neutral-500 text-xs pt-2">
                        {u.leadGroup}: {dni(karta.leadDays, u)}
                      </p>
                    ) : null}
                  </div>
                ))}

                {chooseError && (
                  <p className="text-amber-300 text-xs mt-3">{chooseError}</p>
                )}

                {/* TERMIN CALOSCI. Zmienia sie przy kazdym klikniecu razem
                    z kwota, bo obie liczby wynikaja z tego samego zaznaczenia
                    i liczy je ten sam serwer. */}
                {!domkniete && (offer.leadDays || offer.requiresDetails) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    {/* Na waskim ekranie tytul i liczba dni nie mieszcza sie
                        obok siebie, wiec schodza pod siebie zamiast sciskac
                        wartosc do jednego slowa w kolumnie. */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                      <span className="text-white text-sm font-medium">{u.leadTotalTitle}</span>
                      {/* LICZBA DNI STOI TU ZAWSZE, gdy tylko ja znamy.
                          Pierwsza wersja podmieniala ja na "wymaga ustalenia
                          szczegolow" i klient, ktory chcial wiedziec, ile to
                          potrwa, dowiadywal sie wylacznie, ze bedziemy o tym
                          rozmawiac. Znacznik ustalen zmienia to, OD KIEDY
                          termin biegnie, a nie to, ile wynosi. */}
                      <span className="text-white text-sm font-semibold shrink-0 sm:text-right">
                        {offer.leadDays
                          ? (offer.requiresDetails
                              ? u.leadAfterDetails.replace("{n}", dni(offer.leadDays, u))
                              : dni(offer.leadDays, u))
                          : offer.requiresDetails ? u.leadNeedsDetails : u.leadNone}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed mt-1">
                      {offer.requiresDetails ? u.leadTotalDetails : u.leadTotalDesc}
                    </p>
                  </div>
                )}


                {/* Termin w czasie przeszlym, gdy nie ma juz czego brac.
                    "Obowiazuje do" jest informacja dla kogos, kto ma jeszcze
                    wybor; przy ofercie zleconej w calosci albo wygaslej to samo
                    zdanie jest obietnica bez adresata. */}
                {offer.validUntil && (
                  <div className="mt-3 text-neutral-500 text-xs">
                    {domkniete || offer.expired ? u.validUntilPast : u.validUntil}
                    {" "}
                    {String(offer.validUntil).slice(0, 10)}
                  </div>
                )}
              </section>

              {!domkniete && !offer.expired && (
                <>
                  {/* --- waluta i droga zaplaty ----------------------------- */}
                  {/* Waluta dotyczy CALEJ oferty i zmienia droge zaplaty, wiec
                      stoi przed kodem rabatowym i przed dostawa: to pierwsza
                      decyzja, a nie ozdoba na koncu formularza. */}
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" /> {u.currencyTitle}
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-4">{u.currencyLead}</p>

                    <div className="grid sm:grid-cols-2 gap-2">
                      {[
                        { kod: "PLN", opis: u.currencyPln },
                        { kod: "EUR", opis: u.currencyEur },
                      ].map((w) => (
                        <button
                          key={w.kod}
                          type="button"
                          onClick={() => zmienWalute(w.kod)}
                          disabled={choosing}
                          className={`p-3 rounded-lg border text-left transition-colors disabled:opacity-50 ${
                            walutaOferty === w.kod
                              ? "border-amber-400/50 bg-amber-400/[0.06]"
                              : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className={`text-sm font-medium ${walutaOferty === w.kod ? "text-amber-300" : "text-neutral-300"}`}>
                              {w.kod}
                            </span>
                            <span className="text-white text-sm font-semibold">
                              {w.kod === "EUR" ? formatEur(doZaplaty, kursOferty, lang) : formatPln(doZaplaty, lang)}
                            </span>
                          </span>
                          <span className="block text-neutral-500 text-xs mt-1">{w.opis}</span>
                        </button>
                      ))}
                    </div>

                    {walutaOferty === "EUR" && kursOferty && (
                      <p className="text-neutral-600 text-xs mt-3">
                        {u.currencyRate.replace("{rate}", kursOferty.toFixed(4))}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h3 className="text-neutral-300 text-xs font-medium mb-2">
                        {walutaOferty === "EUR" ? u.howTransfer : u.howInstant}
                      </h3>
                      <ol className="space-y-2">
                        {(walutaOferty === "EUR"
                          ? [u.tr1, u.tr2, u.tr3, u.tr4, u.tr5]
                          : [u.in1, u.in2, u.in3]
                        ).map((krok, n) => (
                          <li key={n} className="flex gap-2.5 text-neutral-400 text-xs leading-relaxed">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border border-white/15 text-xs text-neutral-300
                                             flex items-center justify-center tabular-nums">{n + 1}</span>
                            {krok}
                          </li>
                        ))}
                      </ol>
                      {walutaOferty === "EUR" && (
                        <p className="text-neutral-600 text-xs mt-3">
                          {u.trHold.replace("{days}", String(TRANSFER_HOLD_BUSINESS_DAYS))}
                        </p>
                      )}
                    </div>
                  </section>

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
                          <span className="block text-neutral-500 text-xs">{u.email}</span>
                          <span className="block text-neutral-200 text-sm">{offer.customer.email}</span>
                        </div>
                        <p className="text-neutral-600 text-xs leading-relaxed">{u.emailLocked}</p>
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

                    {pustyKoszyk && <p className="text-amber-300 text-xs">{u.nothingPicked}</p>}
                    {tried && !gotowe && !pustyKoszyk && (
                      <p className="text-amber-300 text-xs">
                        {!adresOk ? u.needDelivery : !daneOk ? u.needCustomer : u.needTerms}
                      </p>
                    )}
                    {error && <p className="text-red-300 text-xs">{error}</p>}

                    <button
                      type="button"
                      onClick={pay}
                      disabled={paying || pustyKoszyk}
                      className="w-full py-3 rounded-xl bg-amber-400 text-neutral-950 font-medium hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {paying ? (
                        <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {u.paying}</span>
                      ) : (
                        `${u.pay} ${money(doZaplaty)}`
                      )}
                    </button>

                    <p className="text-neutral-600 text-xs leading-relaxed flex items-start gap-2">
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
