// ============================================================
// STATUS ZAMOWIENIA, strona powrotu z bramki platniczej
// ============================================================
// Klient trafia tu po zaplacie. Strona niczego nie zmienia, tylko
// odpytuje backend o stan zamowienia. Status ustawia wylacznie
// komunikat ITN od Autopay, bo tylko on jest podpisany kluczem.

import { useState, useEffect } from "react";
import { dzienNumerycznie } from "../utils/dataDnia.js";
import { useSearchParams } from "react-router-dom";
import { Link } from "../i18n/nav.jsx";
import { sciezkaJezyka } from "../routes.js";
import { CheckCircle2, Clock, XCircle, HelpCircle, Loader2, ArrowRight, RefreshCw, Hammer, Truck, MessageSquare, PackageCheck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { DELIVERY_METHODS } from "../data/orderCatalog.js";
import { przewoznicyZNazwy, sledzenieUrl } from "../pricing/shipping.js";
import SEOHead from "../seo/SEOHead.jsx";
import { WZOR_ZAMOWIENIA, WZOR_OFERTY, PRZYKLAD_OFERTY, PRZYKLAD_ZAMOWIENIA } from "../shop/numerySpraw.js";
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
  "details",
  "queued",
  "in_production",
  "ready",
  "shipped",
  "completed",
  // Zamowienie zamkniete tez sie juz nie zmieni. Bez tych dwoch strona
  // odpytywala baze piec razy o zamowienie, ktore wygaslo tydzien temu.
  "expired",
  "cancelled",
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


// ============================================================
// OS CZASU ZLECENIA
// ============================================================
// To samo, co widzi pracownia w panelu, tylko jezykiem klienta. Od 2026-08-30
// "czeka w kolejce" i "w realizacji" to DWA przystanki, a nie jeden: zlecenie
// lezace w kolejce przedstawialo sie wczesniej jako juz robione, a dwa
// powiadomienia pod rzad rysowaly ten sam obrazek. Wolimy powiedziec wprost,
// ze nikt jeszcze nie wzial zlecenia do reki.
//
// Daty formatujemy z napisu, a nie przez `Intl`: dane ICU w Node i w
// przegladarce bywaja z roznych wersji, a rozjazd na prerenderze wyrzuca cale
// poddrzewo (ADR-0022). Z tego samego powodu nie liczymy tu nic z `Date.now()`:
// `daysLeft` przychodzi policzone z serwera.
// Wszystkie terminy w serwisie i w mailach maja JEDEN ksztalt, "DD.MM.RRRR"
// (wlasciciel, 2026-09-02). Formater stoi w `utils/dataDnia.js`, zeby nie
// dalo sie go rozjechac miedzy strona a mailem.
const dzienZeStempla = dzienNumerycznie;

function OsCzasu({ order, u, lang, odbiorOsobisty, zaplacone, nazwaDostawy }) {
  if (!order) return null;

  // Pozycje, na ktorych ustalenia jeszcze czekamy. Klient ma prawo wiedziec,
  // NA CO czekamy: "ustalamy szczegoly" bez wskazania rzeczy brzmi jak zwloka,
  // a nie jak pytanie, ktore do niego wyslalismy.
  const doUstalenia = (order.items || [])
    .filter((i) => i.requiresDetails && !i.detailsSettled)
    .map((i) => i.title);

  // Pozycje z ustaleniami juz domknietymi, do wypisania pod terminem.
  const ustalone = (order.items || []).filter((i) => i.requiresDetails && i.detailsSettled);

  // Przewoznik przychodzi z API: pracownia wybiera go przy nadaniu, a gdy nie
  // wybrala, API podstawia przewoznika ze strefy wysylkowej.
  const sledzenieKlienta = przewoznicyZNazwy(order.carrier)
    .map((kto) => ({ kto, href: sledzenieUrl(kto, order.trackingNumber, lang) }))
    .filter((sl) => sl.href);

  // Dopoki wplata nie jest zaksiegowana, przystanek nazywa sie "Zapłata"
  // i nie ma stempla: "Zapłacone" bez daty czytaloby sie jak zaprzeczenie
  // ekranu stojacego wyzej, ktory prosi o przelew.
  const kroki = [{ id: "paid", label: order.paidAt ? u.tlPaid : u.tlPayment, data: order.paidAt }];
  if (order.requiresDetails) {
    kroki.push({ id: "details", label: u.tlDetails, data: order.detailsAt, pozycje: doUstalenia });
  }
  // "Czeka w kolejce" i "w realizacji" to OSOBNE przystanki (decyzja
  // wlasciciela, 2026-08-30). Wczesniej dzielily jeden, wiec zlecenie lezace
  // w kolejce pokazywalo sie klientowi jako juz robione, a dwa powiadomienia
  // pod rzad rysowaly ten sam obrazek i drugie wygladalo na pomylke.
  kroki.push({ id: "queued", label: u.tlQueued, data: order.queuedAt });
  kroki.push({ id: "work", label: u.tlProduction, data: order.productionStartedAt });
  kroki.push({ id: "ready", label: u.tlReady, data: order.readyAt });
  kroki.push({ id: "shipped", label: odbiorOsobisty ? u.tlHanded : u.tlShipped, data: order.shippedAt });
  // Doreczenie jest OSOBNYM przystankiem (decyzja wlasciciela, 2026-08-30).
  // Wczesniej "wyslane" i "zamkniete" dzielily ostatnia kropke, wiec paczka
  // wlozona do paczkomatu wygladala tak samo jak paczka odebrana, a droga
  // klienta nigdy nie konczyla sie na zielono.
  kroki.push({ id: "delivered", label: odbiorOsobisty ? u.tlCollected : u.tlDelivered, data: order.completedAt });

  // Numer etapu, na ktorym stoi zlecenie. Jedna liczba zamiast piatki warunkow
  // rozsianych po widoku: dzieki niej "przebyte" i "przed nami" liczy sie samo.
  const gdzie = { awaiting_transfer: 0, payment_review: 0, paid: 0, details: 0, queued: 1, in_production: 2, ready: 3, shipped: 4, completed: 5 };
  const teraz = order.requiresDetails
    ? { awaiting_transfer: 0, payment_review: 0, paid: 0, details: 1, queued: 2, in_production: 3, ready: 4, shipped: 5, completed: 6 }[order.status]
    : gdzie[order.status];
  // Potwierdzone doreczenie zamyka cala droge, wiec KAZDA kropka jest przebyta.
  // Ostatni przystanek jako "biezacy" swiecilby na bursztynowo, czyli mowilby
  // "trwa" o czymkolwiek, co juz sie stalo.
  const naEtapie = order.status === "completed" ? kroki.length : Number.isInteger(teraz) ? teraz : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 mb-4 text-left">
      {/* Numer, stan platnosci i data zaplaty stoja TU, a nie w osobnej karcie
          pod spodem. Klient czyta te trzy rzeczy razem z postepem, bo razem
          odpowiadaja na jedno pytanie: co sie dzieje z moim zamowieniem. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-4 mb-4 border-b border-white/10">
        <span className="font-mono text-xs text-white">{order.orderRef}</span>
        <span className="text-xs">
          <span className={zaplacone ? "text-emerald-300" : "text-amber-300"}>
            {zaplacone ? u.statusPaid : u.statusPending}
          </span>
          {dzienZeStempla(order.paidAt) && (
            <span className="text-neutral-500"> &middot; {dzienZeStempla(order.paidAt)}</span>
          )}
        </span>
      </div>

      <div className="text-neutral-500 text-xs mb-4">{u.tlTitle}</div>

      {/* Os idzie w DOL, a nie w bok. Strona zamowienia stoi w waskiej kolumnie
          i piec przystankow ustawionych poziomo lamalo podpisy na dwie linie,
          co wygladalo na scisniete, a nie na zamierzone. W pionie kazdy
          przystanek ma cala szerokosc na nazwe i date. */}
      <ol className="relative">
        {kroki.map((k, i) => {
          const przebyty = i < naEtapie;
          const biezacy = i === naEtapie;
          const kropka = biezacy
            ? "border-amber-400 bg-amber-400 shadow-[0_0_0_5px_rgba(251,191,36,0.18)]"
            : przebyty
              ? "border-emerald-400 bg-emerald-400"
              : "border-white/20 bg-neutral-900";
          return (
            <li key={k.id} className="relative flex gap-4 pb-5 last:pb-0">
              {/* Kreska laczaca stoi POD kropka i konczy sie na ostatnim
                  przystanku, zeby os nie wisiala w powietrzu. */}
              {i < kroki.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[5px] top-4 bottom-0 w-px ${przebyty ? "bg-emerald-400/40" : "bg-white/10"}`}
                />
              )}
              <span className={`relative z-10 mt-1 w-3 h-3 shrink-0 rounded-full border-2 transition-colors ${kropka}`} />
              <div className={`flex-1 min-w-0 ${biezacy ? "-mt-0.5" : ""}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-sm leading-tight ${biezacy ? "text-amber-300 font-semibold" : przebyty ? "text-neutral-200" : "text-neutral-600"}`}>
                    {k.label}
                  </span>
                  {dzienZeStempla(k.data) && (
                    <span className="text-neutral-500 text-xs tabular-nums shrink-0">{dzienZeStempla(k.data)}</span>
                  )}
                </div>
                {/* Nazwy pozycji, na ktore czekamy. Pokazujemy je tylko na
                    biezacym przystanku: przy etapie juz przebytym byloby to
                    przypominanie o pytaniu, na ktore klient dawno odpowiedzial. */}
                {biezacy && k.pozycje && k.pozycje.length > 0 && (
                  <div className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
                    <span className="text-neutral-500">{u.tlWaitingFor}</span>{" "}
                    {k.pozycje.join(", ")}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Termin domyka os, bo jest tym, do czego ona zmierza. Do chwili
          domkniecia ustalen nie ma daty i mowimy to wprost, zamiast pokazywac
          date, ktorej nikt nie obiecal. */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-baseline justify-between gap-4">
        <span className="text-neutral-500 text-xs">{u.tlDeadline}</span>
        <span className="text-right">
          {order.deadlineAt ? (
            <>
              <span className="text-white text-sm font-semibold tabular-nums">{dzienZeStempla(order.deadlineAt)}</span>
              {order.daysLeft != null && (
                <span className={`block text-xs ${order.daysLeft < 0 ? "text-amber-300" : "text-neutral-500"}`}>
                  {order.daysLeft === 0
                    ? u.daysToday
                    : order.daysLeft < 0
                      ? `${Math.abs(order.daysLeft)} ${Math.abs(order.daysLeft) === 1 ? u.dayUnit : u.daysUnit} ${u.daysOver}`
                      : `${order.daysLeft} ${order.daysLeft === 1 ? u.dayUnit : u.daysUnit}`}
                </span>
              )}
            </>
          ) : (
            <span className="text-neutral-400 text-sm">
              {order.leadDays
                ? `${u.tlUpTo} ${order.leadDays} ${u.daysUnit} ${u.tlAfterDetails}`
                : u.tlAfterDetails}
            </span>
          )}
        </span>
      </div>

      {/* CO USTALILISMY. Data mowi, ze rozmowa byla, ale nie mowi, na czym
          stanela, a to jest jedyna rzecz, ktora klient i pracownia musza
          pamietac tak samo. Pokazujemy wylacznie pozycje juz domkniete:
          te otwarte stoja wyzej, przy przystanku, na ktorym czekaja. */}
      {ustalone.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-neutral-500 text-xs mb-2">{u.tlAgreed}</div>
          <ul className="space-y-2">
            {ustalone.map((i, n) => (
              <li key={n} className="text-xs leading-relaxed">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-neutral-300">{i.title}</span>
                  {dzienZeStempla(i.detailsSettledAt) && (
                    <span className="text-neutral-500 tabular-nums shrink-0">{dzienZeStempla(i.detailsSettledAt)}</span>
                  )}
                </div>
                {i.detailsNote && <p className="text-neutral-400 mt-0.5">{i.detailsNote}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dostawa razem z numerem punktu. Klient wybieral paczkomat tydzien
          wczesniej i zwykle nie pamieta, ktory, a paczka jedzie wlasnie tam. */}
      {(nazwaDostawy || order.deliveryPoint || order.trackingNumber) && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
          {nazwaDostawy && (
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-neutral-500">{u.deliveryLabel}</span>
              <span className="text-neutral-300 text-right">{nazwaDostawy}</span>
            </div>
          )}
          {order.deliveryPoint && (
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-neutral-500">{u.tlPickupPoint}</span>
              <span className="text-neutral-200 font-mono text-right">{order.deliveryPoint}</span>
            </div>
          )}
          {order.trackingNumber && (
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-neutral-500">{u.trackingLabel}</span>
              <span className="text-right">
                <span className="text-neutral-200 font-mono block">{order.trackingNumber}</span>
                {/* Sam numer jest dla klienta ciagiem cyfr. Adres sledzenia
                    budujemy tym samym pomocnikiem co mail, zeby jedno miejsce
                    zmieniane po stronie przewoznika poprawialo oba. */}
                {sledzenieKlienta.map((sl) => (
                  <a key={sl.href} href={sl.href} target="_blank" rel="noopener noreferrer"
                     className="text-amber-300 hover:text-amber-200 underline underline-offset-2 ml-2">
                    {sl.kto}
                  </a>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Wzorce numerow stoja w `src/shop/numerySpraw.js`. Trzymanie ich tutaj
// znaczylo, ze zamowienie z oferty (numer sprawy z koncowka) bylo odrzucane
// jako "zly numer", zanim ktokolwiek zapytal o nie serwer. ADR-0032.

const UI = {
  pl: {
    title: "Status zamówienia",
    checking: "Sprawdzam status płatności",
    paidTitle: "Dziękujemy, płatność przyjęta",
    paidDesc: "Potwierdzenie wysłaliśmy na Twój adres email. Zabieramy się do pracy i odezwiemy się, gdy zamówienie będzie gotowe.",
    productionTitle: "Status realizacji zamówienia",
    // Zdania o wydaniu zalezą od tego, co klient wybral przy zamowieniu.
    // Jedno zdanie dla wszystkich mowilo o paczce w drodze komus, kto odbiera
    // osobiscie, i o wysylce komus, kto kupil plik.
    productionDesc: {
      ship: "Płatność mamy, praca ruszyła. Odezwiemy się, gdy zamówienie będzie spakowane i pojedzie do Ciebie. Nie musisz nic robić.",
      pickup: "Płatność mamy, praca ruszyła. Odezwiemy się, gdy zamówienie będzie gotowe do odbioru, i umówimy godzinę. Nie musisz nic robić.",
      digital: "Płatność mamy, praca ruszyła. Odezwiemy się, gdy pliki będą gotowe do pobrania. Nie musisz nic robić.",
    },
    shippedTitle: "Zamówienie wysłane",
    shippedDesc: {
      ship: "Paczka jest w drodze. Jeżeli przesyłka ma numer do śledzenia, znajdziesz go poniżej.",
      pickup: "Zamówienie czeka na Ciebie w Józefosławiu, o umówionej godzinie.",
      digital: "Pliki są przekazane. Link do pobrania jest w mailu z potwierdzeniem zamówienia.",
    },
    expiredTitle: "Zamówienie wygasło",
    expiredDesc: "Wpłata nie dotarła w terminie, więc zamówienie zostało zamknięte, a zarezerwowany towar wrócił do sprzedaży. Jeżeli pieniądze wyszły po terminie, wrócą na rachunek, z którego przyszły. Zamówienie możesz złożyć ponownie w każdej chwili.",
    cancelledTitle: "Zamówienie anulowane",
    cancelledDesc: "To zamówienie zostało anulowane, a zarezerwowany towar wrócił do sprzedaży. Jeżeli to pomyłka, napisz do nas, odpowiadamy na każdą wiadomość.",
    completedTitle: "Zamówienie dostarczone",
    completedDesc: {
      ship: "Potwierdzamy dostarczenie przesyłki. Dziękujemy. Jeżeli coś jest nie tak z wyrobem, napisz do nas, odpowiadamy na każdą wiadomość.",
      pickup: "Potwierdzamy odbiór zamówienia. Dziękujemy. Jeżeli coś jest nie tak z wyrobem, napisz do nas, odpowiadamy na każdą wiadomość.",
      digital: "Zamówienie jest zamknięte. Dziękujemy. Jeżeli coś jest nie tak z plikami, napisz do nas, odpowiadamy na każdą wiadomość.",
    },
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
    lookupTitle: "Sprawdź swoje zamówienie",
    lookupDesc: "Podaj numer zamówienia albo numer oferty i adres e-mail, na który poszło potwierdzenie. Pokażemy stan płatności i realizacji.",
    lookupNeedEmail: "Mamy numer, brakuje jeszcze potwierdzenia, że to Twoje zamówienie. Podaj adres e-mail, na który wysłaliśmy potwierdzenie.",
    lookupRef: "Numer zamówienia lub oferty",
    lookupEmail: "Adres e-mail z potwierdzenia",
    lookupButton: "Sprawdź",
    lookupBad: `Numer wygląda tak: ${PRZYKLAD_ZAMOWIENIA} albo ${PRZYKLAD_OFERTY}`,
    lookupNotFound: "Nie znaleźliśmy zamówienia o tym numerze albo dane się nie zgadzają",
    stageTitle: "Realizacja",
    tlTitle: "Postęp zlecenia",
    tlPaid: "Zapłacone",
    tlPayment: "Zapłata",
    tlDetails: "Ustalamy szczegóły",
    tlQueued: "Czeka w kolejce",
    tlProduction: "W realizacji",
    tlReady: "Gotowe",
    tlShipped: "Wysłane",
    tlHanded: "Przekazane",
    tlDelivered: "Dostarczone",
    tlCollected: "Odebrane",
    tlDeadline: "Planowana finalizacja",
    tlAfterDetails: "po dokonaniu wszystkich ustaleń",
    tlUpTo: "do",
    tlWaitingFor: "Czekamy na ustalenia do:",
    tlAgreed: "Co ustaliliśmy",
    tlPickupPoint: "Punkt odbioru",

    stageDetails: "Ustalanie szczegółów zlecenia",
    stageDetailsDesc: "Czekamy na ustalenie szczegółów z Tobą. Czas realizacji zacznie biec dopiero po nich.",
    stageRunning: "Zlecenie w realizacji",
    stageReady: "Zrealizowane",
    stageReadyDesc: {
      ship: "Praca skończona. Pakujemy zamówienie i przygotowujemy je do wysyłki.",
      pickup: "Praca skończona. Przygotowujemy zamówienie do odbioru osobistego, odezwiemy się, żeby umówić godzinę.",
      digital: "Praca skończona. Pliki do pobrania są w mailu z potwierdzeniem zamówienia.",
    },
    stageHanded: "Przekazane",
    daysUnit: "dni",
    dayUnit: "dzień",
    daysToday: "dzisiaj",
    daysOver: "po terminie",
    leadLabel: "Umówiony czas realizacji",
    leadFromStart: "dni od rozpoczęcia pracy",
    noRefTitle: "Nie wiemy, o które zamówienie chodzi",
    noRefDesc: "Ta strona pokazuje stan konkretnego zamówienia, a ten adres nie niesie jego numeru. Otwórz link z maila z potwierdzeniem albo napisz do nas, podając numer zamówienia, a odeślemy nowy link.",
    itemsTitle: "Zamówione pozycje",
    deliveryLabel: "Dostawa",
    discountLabel: "Rabat",
    creditLabel: "Odliczenie za projekt",
    paidLabel: "Zapłacono",
    toPayLabel: "Do zapłaty",
    paidAtLabel: "Data zapłaty",
    statusLabel: "Stan płatności",
    statusPaid: "Zapłacone",
    statusPending: "Czeka na zapłatę",
    orderNo: "Numer zamówienia",
    amount: "Kwota",
    revisions: "Wykorzystane poprawki",
    contact: "Napisz do nas",
    home: "Wróć na stronę główną",
    transferTitle: "Zamówienie przyjęte, czekamy na przelew",
    transferDesc: "Nic nie zostało pobrane. Poniżej masz dane do przelewu. Ten sam komplet wysłaliśmy Ci mailem.",
    transferAmount: "Kwota do przelewu",
    transferShortfall: "Do dopłaty",
    transferReceived: "Wpłynęło",
    transferOf: "z",
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
    productionTitle: "Order progress",
    productionDesc: {
      ship: "We have your payment and the work has started. We will write once your order is packed and on its way to you. You do not need to do anything.",
      pickup: "We have your payment and the work has started. We will write once your order is ready for collection, and we will agree a time. You do not need to do anything.",
      digital: "We have your payment and the work has started. We will write once your files are ready to download. You do not need to do anything.",
    },
    shippedTitle: "Your order has been shipped",
    shippedDesc: {
      ship: "The parcel is on its way. If the shipment has a tracking number, you will find it below.",
      pickup: "Your order is waiting for you in Józefosław, at the time we agreed.",
      digital: "Your files have been handed over. The download link is in your order confirmation e-mail.",
    },
    expiredTitle: "The order has expired",
    expiredDesc: "The payment did not arrive in time, so the order was closed and the reserved goods went back on sale. If the money left after that date, it will return to the account it came from. You can place the order again at any time.",
    cancelledTitle: "Order cancelled",
    cancelledDesc: "This order was cancelled and the reserved goods went back on sale. If that is a mistake, write to us, we answer every message.",
    completedTitle: "Order delivered",
    completedDesc: {
      ship: "We confirm your parcel has been delivered. Thank you. If anything is wrong with the piece, write to us, we answer every message.",
      pickup: "We confirm your order has been collected. Thank you. If anything is wrong with the piece, write to us, we answer every message.",
      digital: "Your order is now closed. Thank you. If anything is wrong with the files, write to us, we answer every message.",
    },
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
    lookupTitle: "Check your order",
    lookupDesc: "Enter the order number or the offer number, and the e-mail address the confirmation went to. We will show the payment and the work.",
    lookupNeedEmail: "We have the number; we still need to know the order is yours. Enter the e-mail address we sent the confirmation to.",
    lookupRef: "Order or offer number",
    lookupEmail: "E-mail from the confirmation",
    lookupButton: "Check",
    lookupBad: `The number looks like this: ${PRZYKLAD_ZAMOWIENIA} or ${PRZYKLAD_OFERTY}`,
    lookupNotFound: "We found no order with that number, or the details do not match",
    stageTitle: "Progress",
    tlTitle: "Order progress",
    tlPaid: "Paid",
    tlPayment: "Payment",
    tlDetails: "Agreeing details",
    tlQueued: "In the queue",
    tlProduction: "In the workshop",
    tlReady: "Finished",
    tlShipped: "Dispatched",
    tlHanded: "Handed over",
    tlDelivered: "Delivered",
    tlCollected: "Collected",
    tlDeadline: "Planned completion",
    tlAfterDetails: "once everything is agreed",
    tlUpTo: "up to",
    tlWaitingFor: "Waiting to agree:",
    tlAgreed: "What we agreed",
    tlPickupPoint: "Pickup point",

    stageDetails: "Agreeing the details",
    stageDetailsDesc: "We are waiting to agree the details with you. The lead time starts only after that.",
    stageRunning: "In the workshop",
    stageReady: "Finished",
    stageReadyDesc: {
      ship: "The work is done. We are packing your order and getting it ready for dispatch.",
      pickup: "The work is done. We are getting your order ready for collection and will write to agree a time.",
      digital: "The work is done. The download links are in your order confirmation e-mail.",
    },
    stageHanded: "Handed over",

    daysUnit: "days",
    dayUnit: "day",
    daysToday: "today",
    daysOver: "past the date",
    leadLabel: "Agreed lead time",
    leadFromStart: "days from the start of work",
    noRefTitle: "We do not know which order you mean",
    noRefDesc: "This page shows the state of one order, and this address carries no order number. Open the link from your confirmation e-mail, or write to us with the order number and we will send a new link.",
    itemsTitle: "Items ordered",
    deliveryLabel: "Delivery",
    discountLabel: "Discount",
    creditLabel: "Design credit",
    paidLabel: "Paid",
    toPayLabel: "To pay",
    paidAtLabel: "Paid on",
    statusLabel: "Payment",
    statusPaid: "Paid",
    statusPending: "Awaiting payment",
    orderNo: "Order number",
    amount: "Amount",
    revisions: "Revisions used",
    contact: "Write to us",
    home: "Back to home page",
    transferTitle: "Order received, waiting for your transfer",
    transferDesc: "Nothing has been charged. Below are the transfer details. We sent you the same set by email.",
    transferAmount: "Amount to transfer",
    transferShortfall: "Still due",
    transferReceived: "Received",
    transferOf: "of",
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
    productionTitle: "Status Ihrer Bestellung",
    productionDesc: {
      ship: "Die Zahlung ist bei uns, die Arbeit hat begonnen. Wir melden uns, sobald Ihre Bestellung verpackt ist und zu Ihnen unterwegs geht. Sie müssen nichts tun.",
      pickup: "Die Zahlung ist bei uns, die Arbeit hat begonnen. Wir melden uns, sobald Ihre Bestellung zur Abholung bereit ist, und vereinbaren eine Uhrzeit. Sie müssen nichts tun.",
      digital: "Die Zahlung ist bei uns, die Arbeit hat begonnen. Wir melden uns, sobald Ihre Dateien zum Download bereitstehen. Sie müssen nichts tun.",
    },
    shippedTitle: "Ihre Bestellung wurde versandt",
    shippedDesc: {
      ship: "Das Paket ist unterwegs. Sofern die Sendung eine Sendungsnummer hat, finden Sie sie unten.",
      pickup: "Ihre Bestellung wartet in Józefosław zur vereinbarten Uhrzeit auf Sie.",
      digital: "Ihre Dateien wurden übergeben. Der Download-Link steht in Ihrer Bestellbestätigung.",
    },
    expiredTitle: "Die Bestellung ist abgelaufen",
    expiredDesc: "Die Zahlung ist nicht rechtzeitig eingegangen, daher wurde die Bestellung geschlossen und die reservierte Ware ging zurück in den Verkauf. Sollte das Geld nach diesem Termin herausgegangen sein, kommt es auf das Konto zurück, von dem es kam. Sie können jederzeit erneut bestellen.",
    cancelledTitle: "Bestellung storniert",
    cancelledDesc: "Diese Bestellung wurde storniert und die reservierte Ware ging zurück in den Verkauf. Sollte das ein Versehen sein, schreiben Sie uns, wir beantworten jede Nachricht.",
    completedTitle: "Bestellung zugestellt",
    completedDesc: {
      ship: "Wir bestätigen die Zustellung Ihrer Sendung. Vielen Dank. Falls mit dem Stück etwas nicht stimmt, schreiben Sie uns, wir beantworten jede Nachricht.",
      pickup: "Wir bestätigen die Abholung Ihrer Bestellung. Vielen Dank. Falls mit dem Stück etwas nicht stimmt, schreiben Sie uns, wir beantworten jede Nachricht.",
      digital: "Ihre Bestellung ist abgeschlossen. Vielen Dank. Falls mit den Dateien etwas nicht stimmt, schreiben Sie uns, wir beantworten jede Nachricht.",
    },
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
    lookupTitle: "Bestellung prüfen",
    lookupDesc: "Geben Sie die Bestell- oder Angebotsnummer an und die E-Mail-Adresse, an die die Bestätigung ging. Wir zeigen Zahlung und Fortschritt.",
    lookupNeedEmail: "Die Nummer haben wir; es fehlt noch der Nachweis, dass die Bestellung Ihnen gehört. Geben Sie die E-Mail-Adresse an, an die wir die Bestätigung geschickt haben.",
    lookupRef: "Bestell- oder Angebotsnummer",
    lookupEmail: "E-Mail aus der Bestätigung",
    lookupButton: "Prüfen",
    lookupBad: `Die Nummer sieht so aus: ${PRZYKLAD_ZAMOWIENIA} oder ${PRZYKLAD_OFERTY}`,
    lookupNotFound: "Wir haben keine Bestellung mit dieser Nummer gefunden, oder die Daten stimmen nicht überein",
    stageTitle: "Fortschritt",
    tlTitle: "Auftragsfortschritt",
    tlPaid: "Bezahlt",
    tlPayment: "Zahlung",
    tlDetails: "Details klären",
    tlQueued: "In der Warteschlange",
    tlProduction: "In Arbeit",
    tlReady: "Fertig",
    tlShipped: "Versandt",
    tlHanded: "Übergeben",
    tlDelivered: "Zugestellt",
    tlCollected: "Abgeholt",
    tlDeadline: "Geplante Fertigstellung",
    tlAfterDetails: "nach allen Absprachen",
    tlUpTo: "bis zu",
    tlWaitingFor: "Wir warten auf Absprachen zu:",
    tlAgreed: "Was wir vereinbart haben",
    tlPickupPoint: "Abholpunkt",

    stageDetails: "Details werden abgestimmt",
    stageDetailsDesc: "Wir warten darauf, die Details mit Ihnen abzustimmen. Die Lieferzeit läuft erst danach.",
    stageRunning: "In der Werkstatt",
    stageReady: "Fertiggestellt",
    stageReadyDesc: {
      ship: "Die Arbeit ist fertig. Wir verpacken Ihre Bestellung und bereiten den Versand vor.",
      pickup: "Die Arbeit ist fertig. Wir bereiten Ihre Bestellung zur Abholung vor und melden uns, um eine Uhrzeit zu vereinbaren.",
      digital: "Die Arbeit ist fertig. Die Download-Links stehen in Ihrer Bestellbestätigung.",
    },
    stageHanded: "Übergeben",
    daysUnit: "Tage",
    dayUnit: "Tag",
    daysToday: "heute",
    daysOver: "über dem Termin",
    leadLabel: "Vereinbarte Lieferzeit",
    leadFromStart: "Tage ab Arbeitsbeginn",
    noRefTitle: "Wir wissen nicht, um welche Bestellung es geht",
    noRefDesc: "Diese Seite zeigt den Stand einer bestimmten Bestellung, und diese Adresse enthält keine Bestellnummer. Öffnen Sie den Link aus der Bestätigungsmail, oder schreiben Sie uns mit der Bestellnummer, dann schicken wir einen neuen Link.",
    itemsTitle: "Bestellte Positionen",
    deliveryLabel: "Versand",
    discountLabel: "Rabatt",
    creditLabel: "Entwurfsgutschrift",
    paidLabel: "Bezahlt",
    toPayLabel: "Zu zahlen",
    paidAtLabel: "Bezahlt am",
    statusLabel: "Zahlung",
    statusPaid: "Bezahlt",
    statusPending: "Wartet auf Zahlung",
    orderNo: "Bestellnummer",
    amount: "Betrag",
    revisions: "Genutzte Korrekturen",
    contact: "Schreiben Sie uns",
    home: "Zurück zur Startseite",
    transferTitle: "Bestellung eingegangen, wir warten auf Ihre Überweisung",
    transferDesc: "Es wurde nichts abgebucht. Unten finden Sie die Überweisungsdaten. Dieselben Angaben haben wir Ihnen per E-Mail geschickt.",
    transferAmount: "Zu überweisender Betrag",
    transferShortfall: "Noch offen",
    transferReceived: "Eingegangen",
    transferOf: "von",
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
  const [search, setSearch] = useSearchParams();
  const ref = search.get("ref");
  const tokenFromUrl = search.get("token");
  const signatureError = search.get("error") === "invalid_signature";
  const [token, setToken] = useState(null);
  const [accessResolved, setAccessResolved] = useState(false);
  // BRAK DOSTEPU TO PYTANIE, A NIE ODMOWA.
  //
  // Dwa przypadki, jedna odpowiedz: adres bez numeru (ktory do tej pory
  // schodzil do galezi domyslnej i oznajmial "czekamy na potwierdzenie
  // platnosci", czyli podawal stan zamowienia, ktorego nigdy nie zobaczyl)
  // oraz numer BEZ zetonu, czyli dokladnie to, co zostaje po wpisaniu numeru
  // w koszyku. Ten drugi konczyl sie ekranem "ten link nie daje dostepu",
  // choc numer byl dobry i brakowalo wylacznie adresu e-mail. Klient
  // dostawal odmowe zamiast pytania o druga polowe danych.
  const bezDostepu = !signatureError && (!ref || (accessResolved && !token));
  // Numer byl podany, wiec pytamy juz tylko o adres.
  const samNumer = Boolean(ref) && bezDostepu;

  // Wejscie z samego numeru i adresu. Do tej pory zamowienie otwieral WYLACZNIE
  // prywatny link z maila, wiec klient, ktory tego maila skasowal, nie mial jak
  // sprawdzic swojego zlecenia. Numer oferty tez tu wolno wpisac: prowadzi na
  // strone oferty, ktora zna droge dalej.
  // Numer z adresu wpisuje sie do formularza sam: klient wlasnie go podal
  // w koszyku i przepisywanie go drugi raz bylo by kara za nasza wlasna
  // niedorobke.
  const [formRef, setFormRef] = useState(ref || "");
  const [formEmail, setFormEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  async function lookup(e) {
    e.preventDefault();
    const numer = formRef.trim().toUpperCase();
    if (WZOR_OFERTY.test(numer)) {
      // Oferta ma wlasna strone i wlasna droge potwierdzania tozsamosci.
      // Przepisywanie jej tutaj dalo by druga regule dostepu do tych samych
      // danych, a to jest dokladnie ten rodzaj powtorzenia, ktory sie rozjezdza.
      window.location.assign(`${sciezkaJezyka("/oferta/", lang)}?ref=${encodeURIComponent(numer)}`);
      return;
    }
    if (!WZOR_ZAMOWIENIA.test(numer)) { setLookupError(u.lookupBad); return; }
    setLooking(true);
    setLookupError(null);
    const r = await postJSON(`${API}/api/orders/lookup`, { ref: numer, email: formEmail.trim() });
    setLooking(false);
    if (!r.ok) { setLookupError(u.lookupNotFound); return; }
    setSearch({ ref: r.data.ref, token: r.data.token });
  }

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
  // Naglowek strony jest dla obu etapow ten sam, bo mowi o stanie zamowienia
  // jako calosci. Roznice miedzy "czeka w kolejce" a "w realizacji" pokazuje
  // os czasu wyzej, i tam sa to osobne przystanki.
  const inProduction = order?.status === "queued" || order?.status === "in_production";
  const shipped = order?.status === "shipped";
  const completed = order?.status === "completed";
  const failed = order?.paymentStatus === "FAILURE";
  const paymentReview = order?.status === "payment_review";
  const canRetry = Boolean(order?.canRetryPayment && token);
  // Przelew czeka na nasze reczne potwierdzenie, wiec ta strona nie jest
  // "czekamy na bank", tylko instrukcja, co klient ma teraz zrobic.
  const awaitingTransfer = order?.status === "awaiting_transfer";
  // Zamowienie zamkniete bez zaplaty spadalo do galezi domyslnej i mowilo
  // "bank jeszcze nie potwierdzil przelewu, to zwykle kwestia kilku minut"
  // komus, kogo zamowienie wygaslo tydzien temu. Od 2026-08-30 mail o wygasnieciu
  // wprost zaprasza na te strone, wiec klamstwo bylo widoczne dla kazdego.
  const expired = order?.status === "expired";
  const cancelledOrder = order?.status === "cancelled";
  // "Zaplacone" znaczy tu: pieniadze u nas. Stany dalsze (produkcja, wysylka,
  // zakonczone) tez sa oplacone i bez tej listy strona mowilaby oplaconemu
  // klientowi, ze czeka na jego wplate.
  // Kazdy etap PO zaplacie. Pominiecie ktoregokolwiek znaczy podsumowanie
  // mowiace "do zaplaty" komus, kto zaplacil, i to jest dokladnie ten sam
  // blad, ktory strona popelniala przy adresie bez numeru.
  const zaplacone = ["paid", "details", "queued", "in_production", "ready", "shipped", "completed"].includes(order?.status);
  // Os czasu zaczyna sie przy zaplacie, a nie po niej (decyzja wlasciciela,
  // 2026-08-30). Zamowienie w euro czeka na zaksiegowanie przelewu i klient
  // pytal wtedy "czy potwierdziliscie", bo widzial sam ekran oczekiwania.
  // Pierwsza kropka swieci, dopoki pieniadze nie doszly, i to jest odpowiedz.
  const czekaNaPieniadze = ["awaiting_transfer", "payment_review"].includes(order?.status);
  const zOsia = zaplacone || czekaNaPieniadze;
  const etapSzczegolow = order?.status === "details";
  const etapGotowe = order?.status === "ready";
  // Odbior osobisty konczy sie przekazaniem, a nie wysylka. To samo pole
  // `shipped_at`, inne zdanie: paczka, ktora nigdzie nie jechala, nie jest
  // "w drodze" i klient nie ma na co czekac pod drzwiami.
  const odbiorOsobisty = order?.deliveryMethod === "pickup";
  // Droga wydania rozstrzyga zdania o pakowaniu, odbiorze i pobraniu plikow.
  // Pole znamy od zamowienia, wiec nie ma powodu, zeby strona wyliczala klientowi
  // wszystkie mozliwosci naraz.
  const droga = order?.deliveryMethod === "pickup" ? "pickup" : order?.deliveryMethod === "digital" ? "digital" : "ship";
  // Kwoty formatuje strona, a nie serwer, bo ten sam wiersz musi umiec pokazac
  // pozycje, dostawe i rabat, a nie tylko sume.
  const zlote = (grosze) =>
    grosze == null ? "-" : `${(grosze / 100).toFixed(2).replace(".", ",")} PLN`;
  const nazwaDostawy =
    DELIVERY_METHODS.find((m) => m.id === order?.deliveryMethod)?.label?.[lang] || "";
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
  } else if (etapSzczegolow) {
    // Wlasna galaz, bo bez niej zamowienie w ustalaniu szczegolow spadaloby do
    // domyslnej i mowilo klientowi, ze czekamy na jego platnosc, choc wlasnie
    // ja dostalismy.
    icon = <MessageSquare className="w-12 h-12 text-sky-300" />;
    title = u.stageDetails;
    desc = u.stageDetailsDesc;
  } else if (inProduction) {
    icon = <Hammer className="w-12 h-12 text-amber-400" />;
    title = u.productionTitle;
    desc = u.productionDesc[droga];
  } else if (etapGotowe) {
    icon = <PackageCheck className="w-12 h-12 text-emerald-400" />;
    title = u.stageReady;
    desc = u.stageReadyDesc[droga];
  } else if (shipped) {
    icon = <Truck className="w-12 h-12 text-blue-400" />;
    title = odbiorOsobisty ? u.stageHanded : u.shippedTitle;
    desc = u.shippedDesc[droga];
  } else if (completed) {
    icon = <CheckCircle2 className="w-12 h-12 text-emerald-400" />;
    title = u.completedTitle;
    desc = u.completedDesc[droga];
  } else if (paid) {
    icon = <CheckCircle2 className="w-12 h-12 text-emerald-400" />;
    title = u.paidTitle;
    desc = u.paidDesc;
  } else if (failed) {
    icon = <XCircle className="w-12 h-12 text-red-400" />;
    title = u.failedTitle;
    desc = u.failedDesc;
  } else if (expired) {
    icon = <XCircle className="w-12 h-12 text-neutral-500" />;
    title = u.expiredTitle;
    desc = u.expiredDesc;
  } else if (cancelledOrder) {
    icon = <XCircle className="w-12 h-12 text-neutral-500" />;
    title = u.cancelledTitle;
    desc = u.cancelledDesc;
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
          ) : bezDostepu ? (
            <>
              <HelpCircle className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-white mb-3">{u.lookupTitle}</h1>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                {samNumer ? u.lookupNeedEmail : u.lookupDesc}
              </p>
              <form onSubmit={lookup} className="space-y-3 text-left">
                <label className="block">
                  <span className="text-neutral-400 text-xs">{u.lookupRef}</span>
                  <input
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value.toUpperCase())}
                    placeholder={PRZYKLAD_ZAMOWIENIA}
                    className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-neutral-400 text-xs">{u.lookupEmail}</span>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="twoj@email.com"
                    className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                {lookupError && <p className="text-amber-300 text-xs">{lookupError}</p>}
                <button
                  type="submit"
                  disabled={looking || !formRef.trim()}
                  className="w-full py-3 rounded-xl bg-amber-400 text-neutral-950 font-medium hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {looking ? <Loader2 className="w-4 h-4 animate-spin inline" /> : u.lookupButton}
                </button>
                <p className="text-neutral-600 text-xs leading-relaxed">{u.noRefDesc}</p>
              </form>
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
                    {/* Po czesciowej wplacie liczy sie kwota BRAKUJACA, a nie
                        kwota zamowienia: klient ma doplacic roznice, a nie
                        przelac wszystkiego jeszcze raz. */}
                    <div className="text-center pb-3 mb-3 border-b border-white/10">
                      <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                        {tr.shortfallEur ? u.transferShortfall : u.transferAmount}
                      </div>
                      <div className="text-3xl font-extrabold text-white tabular-nums">
                        {tr.shortfallEur || tr.amountEur} EUR
                      </div>
                      {tr.shortfallEur && (
                        <div className="text-neutral-500 text-xs mt-1 tabular-nums">
                          {u.transferReceived} {tr.receivedEur} EUR {u.transferOf} {tr.amountEur} EUR
                        </div>
                      )}
                    </div>
                    <TransferRow label={u.transferIban} value={tr.iban} mono />
                    {tr.bic && <TransferRow label={u.transferBic} value={tr.bic} mono />}
                    {tr.holder && <TransferRow label={u.transferHolder} value={tr.holder} />}
                    {tr.bank && <TransferRow label={u.transferBank} value={tr.bank} />}
                    <TransferRow label={u.transferRef} value={tr.reference} mono highlight />
                    {tr.dueAt && (
                      <TransferRow label={u.transferDue} value={dzienNumerycznie(tr.dueAt)} />
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

              {/* POSTEP ZLECENIA. Zastapil karte z sama data: klient pytal
                  nie tylko "na kiedy", ale przede wszystkim "co sie dzieje",
                  a na to sama data nie odpowiada. Termin domyka os, wiec
                  wszystko stoi w jednym miejscu.

                  `daysLeft` przychodzi POLICZONE z serwera. Data liczona tutaj
                  wychodzi inna przy buildzie i inna u klienta, React uznaje to
                  za rozjazd i wyrzuca cale poddrzewo (ADR-0022), a strona
                  zamowienia to ostatnie miejsce, w ktorym wolno nam zgasnac. */}
              {order && zOsia && (
                <OsCzasu order={order} u={u} lang={lang} odbiorOsobisty={odbiorOsobisty}
                         zaplacone={zaplacone} nazwaDostawy={nazwaDostawy} />
              )}

              {/* Podsumowanie takie samo jak w mailu z potwierdzeniem: pozycje,
                  dostawa i kwota. Do tej pory strona pokazywala sam numer
                  i sume, wiec klient wracajacy po tygodniu nie mial gdzie
                  sprawdzic, CO wlasciwie zamowil, poza mailem, ktory bywa
                  skasowany. */}
              {order && order.items && order.items.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm mb-4 text-left">
                  <div className="text-neutral-500 text-xs mb-2">{u.itemsTitle}</div>
                  {order.items.map((it, i) => (
                    <div key={`${it.title}-${i}`} className="flex justify-between gap-4 py-1.5 border-b border-white/5">
                      <span className="text-neutral-200 min-w-0">
                        {it.title}{it.qty > 1 ? ` \u00d7 ${it.qty}` : ""}
                      </span>
                      <span className="text-neutral-200 shrink-0 tabular-nums">{zlote(it.lineGrosze)}</span>
                    </div>
                  ))}
                  {order.shippingGrosze != null && (
                    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5">
                      <span className="text-neutral-400">
                        {u.deliveryLabel}{nazwaDostawy ? `: ${nazwaDostawy}` : ""}
                      </span>
                      <span className="text-neutral-200 shrink-0 tabular-nums">{zlote(order.shippingGrosze)}</span>
                    </div>
                  )}
                  {order.discountGrosze > 0 && (
                    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5">
                      <span className="text-neutral-400">
                        {u.discountLabel}{order.discountCode ? ` ${order.discountCode}` : ""}
                      </span>
                      <span className="text-emerald-300 shrink-0 tabular-nums">-{zlote(order.discountGrosze)}</span>
                    </div>
                  )}
                  {order.creditGrosze > 0 && (
                    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5">
                      <span className="text-neutral-400">{u.creditLabel}</span>
                      <span className="text-emerald-300 shrink-0 tabular-nums">-{zlote(order.creditGrosze)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 pt-3">
                    <span className="text-white font-semibold">{zaplacone ? u.paidLabel : u.toPayLabel}</span>
                    <span className="text-white font-bold tabular-nums">{zlote(order.totalGrosze)}</span>
                  </div>
                </div>
              )}

              {/* Numer, stan platnosci, data zaplaty, dostawa i numer przesylki
                  przeniosly sie do karty postepu: klient czyta je razem z tym,
                  co sie ze zleceniem dzieje, a nie w osobnej ramce nizej.
                  Zostaja dwie rzeczy, ktore tam nie pasuja. */}
              {order && ((!order.items || !order.items.length) || order.revisions) && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm mb-6 text-left">
                  {/* Backend i strona wdrazaja sie osobno. Starsza wersja API nie
                      przysyla pozycji, wiec kwota musi miec tu wlasne miejsce,
                      inaczej przez chwile nie byloby jej nigdzie. */}
                  {(!order.items || !order.items.length) && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{u.amount}</span>
                      <span className="text-white font-semibold">{String(order.totalPLN).replace(".", ",")} PLN</span>
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
