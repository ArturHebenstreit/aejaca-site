// ============================================================
// PORANNE PODSUMOWANIE DNIA
// ============================================================
// Polecenie wlasciciela z 2026-09-10, po zdarzeniu, ktore je wymusilo:
// zamowienie przelewem z 8 wrzesnia stalo dwa dni, powiadomienie o nim nie
// doszlo, a wlasciciel dowiedzial sie o zleceniu od klienta. Rezerwacja miala
// wygasnac nastepnego dnia, wiec zamiatarka zamknelaby oplacone zamowienie
// i napisala klientowi, ze towar wrocil do sprzedazy.
//
// Powiadomienia pojedyncze zawiodly w sposob, ktorego nie da sie wykryc od
// srodka: brak maila nie rozni sie od braku zdarzenia. Podsumowanie zamyka
// wlasnie te dziure, bo mowi, CO STOI W BAZIE, a nie co udalo sie wyslac.
// Dlatego przychodzi codziennie, takze w dniu, w ktorym nic sie nie dzieje:
// mail o pustej kolejce znaczy "sprawdzone i nic nie czeka", a brak maila
// znaczy "zepsulo sie" i te dwie rzeczy musza wygladac inaczej.
//
// UKLAD PLIKU. Tresc powstaje w funkcji CZYSTEJ (`tresc`), a baza i poczta
// stoja osobno. Regula pierwszenstwa spraw jest cala wartoscia tego kodu
// i musi dac sie sprawdzic bez stawiania Postgresa, bez zegara systemowego
// i bez Gmaila. `zbierz` tylko czyta, `tresc` tylko sklada.
//
// Wysylke robi `sendPodsumowanieDnia` w `orderMail.js`, bo tam stoi caly
// aparat pocztowy. Ten plik nie importuje poczty i nie moze: zaleznosc
// poszlaby w kolko.

import { dniDoTerminu } from "./productionQueue.js";

/** Etapy, ktore znacza "to jest do zrobienia". Bez `shipped` i `completed`. */
export const ETAPY_W_KOLEJCE = ["paid", "details", "queued", "in_production", "ready"];

/** Stany zamowienia, ktore czekaja na pieniadze. */
export const ETAPY_BEZ_WPLATY = ["awaiting_payment", "awaiting_transfer"];

/** Nazwy etapow po polsku. Podsumowanie czyta czlowiek, nie panel. */
const ETAP_PL = {
  paid: "zaplacone, czeka na wejscie do kolejki",
  details: "ustalanie szczegolow, zegar STOI",
  queued: "w kolejce",
  in_production: "w realizacji",
  ready: "gotowe, czeka na wydanie",
};

const ZRODLO_PL = { contact: "formularz kontaktowy", quote: "kalkulator", chat: "czat" };

const STAN_WYCENY_PL = {
  new: "bez kwot, czeka na wycene",
  priced: "wyceniona, jeszcze niewyslana",
};

/** Ile pozycji jednej sekcji wypisujemy, zanim przejdziemy na sam licznik. */
const LIMIT_SEKCJI = 15;

/** Data po ludzku, w ksztalcie uzywanym w calym serwisie. */
function dzien(wartosc) {
  if (!wartosc) return "-";
  const d = new Date(wartosc);
  if (Number.isNaN(d.getTime())) return "-";
  const cz = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", year: "numeric",
  });
  return cz.format(d);
}

/** Kwota w walucie, ktora placi TEN klient. Wiersz nie miesza dwoch walut. */
function kwota(zamowienie) {
  if (zamowienie.amountEurCents != null) return `${(zamowienie.amountEurCents / 100).toFixed(2)} EUR`;
  return `${((zamowienie.totalGrosze || 0) / 100).toFixed(2).replace(".", ",")} PLN`;
}

/** Klient w jednym napisie: nazwisko, a gdy go nie ma, adres. */
function klient(w) {
  const nazwa = String(w.klient || "").trim();
  return nazwa ? `${nazwa} <${w.email || "brak adresu"}>` : (w.email || "brak danych klienta");
}

/**
 * Ile dni temu, w postaci do czytania. Zero dni znaczy "dzisiaj", a nie
 * "0 dni": zdanie "zapytanie z 0 dni" nikomu nic nie mowi.
 */
function odIle(dni) {
  if (dni == null) return "";
  if (dni <= 0) return "dzisiaj";
  if (dni === 1) return "wczoraj";
  return `${dni} dni temu`;
}

/** Wiek wiersza w dniach, liczony po polskim kalendarzu. */
export function wiekWDniach(kiedy, teraz = new Date()) {
  if (!kiedy) return null;
  const d = new Date(kiedy);
  if (Number.isNaN(d.getTime())) return null;
  const dzienISO = (x) => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(x);
  const od = new Date(`${dzienISO(d)}T00:00:00Z`);
  const do_ = new Date(`${dzienISO(teraz)}T00:00:00Z`);
  return Math.round((do_ - od) / 86400_000);
}

/**
 * Tresc podsumowania.
 *
 * KOLEJNOSC SEKCJI JEST KOLEJNOSCIA PILNOSCI, a nie kolejnoscia tabel w bazie.
 * Najpierw to, co traci pieniadze albo klienta dzisiaj, potem praca, na koncu
 * to, co poczeka. Sekcja pusta ZNIKA, ale liczba na gorze zostaje: inaczej
 * pusty mail wyglada jak zepsuty mail.
 *
 * @param {object} dane wynik `zbierz`
 * @param {Date} teraz chwila, dla ktorej liczymy dni; wstrzykiwana, zeby
 *        sprawdzian nie zalezal od zegara systemowego
 */
export function tresc(dane, teraz = new Date()) {
  const { kolejka = [], bezWplaty = [], doWeryfikacji = [], zapytania = [], wyceny = [] } = dane || {};

  // Rzeczy, ktore trzeba tknac dzisiaj. To one decyduja o tytule maila, bo
  // tytul jest jedyna czescia, ktora widac z telefonu bez otwierania.
  const poTerminie = kolejka.filter((z) => z.dniDoTerminu != null && z.dniDoTerminu < 0);
  const rezerwacjaKonczySie = bezWplaty.filter((z) => z.dniDoKonca != null && z.dniDoKonca <= 1);
  const pilne = poTerminie.length + rezerwacjaKonczySie.length + doWeryfikacji.length;

  const naglowek = pilne
    ? `[AEJaCA] Poranek ${dzien(teraz)}: ${pilne} do ruszenia dzisiaj`
    : `[AEJaCA] Poranek ${dzien(teraz)}: nic pilnego`;

  const linie = [
    `PODSUMOWANIE DNIA, ${dzien(teraz)}`,
    "",
    `W kolejce: ${kolejka.length}${poTerminie.length ? `, z tego PO TERMINIE: ${poTerminie.length}` : ""}`,
    `Czeka na wplate: ${bezWplaty.length}${rezerwacjaKonczySie.length ? `, z tego rezerwacja konczy sie dzis albo jutro: ${rezerwacjaKonczySie.length}` : ""}`,
    `Platnosci do recznej weryfikacji: ${doWeryfikacji.length}`,
    `Zapytania bez odpowiedzi: ${zapytania.length}`,
    `Wyceny do domkniecia: ${wyceny.length}`,
  ];

  // --- Platnosc, ktora wisi miedzy bramka a nami --------------------------
  // Pieniadze klienta sa juz w drodze albo doszly, a zamowienie nie ruszylo.
  // Stoi najwyzej, bo to jedyny stan, w ktorym klient zaplacil i nic nie ma.
  if (doWeryfikacji.length) {
    linie.push("", "== PLATNOSCI DO RECZNEJ WERYFIKACJI ==");
    for (const z of doWeryfikacji.slice(0, LIMIT_SEKCJI)) {
      linie.push(`- ${z.ref}, ${kwota(z)}, ${klient(z)}`);
      linie.push(`    powod: ${z.powod || "nieznany"}, stan bramki: ${z.stanBramki || "-"}`);
    }
  }

  // --- Rezerwacja, ktora zaraz przepadnie --------------------------------
  // Zdarzenie z 8 wrzesnia 2026: klient przelal pieniadze, przelew SEPA
  // szedl trzy dni, a zamiatarka zamknelaby zamowienie dzien przed jego
  // przyjsciem. Ta sekcja istnieje po to, zeby to bylo widoczne DZIEN
  // WCZESNIEJ, a nie po fakcie.
  if (bezWplaty.length) {
    linie.push("", "== CZEKA NA WPLATE ==");
    for (const z of bezWplaty.slice(0, LIMIT_SEKCJI)) {
      const pilnosc = z.dniDoKonca == null ? ""
        : z.dniDoKonca < 0 ? "  !! REZERWACJA JUZ WYGASLA, zamiatarka zamknie zamowienie"
        : z.dniDoKonca === 0 ? "  !! REZERWACJA WYGASA DZISIAJ"
        : z.dniDoKonca === 1 ? "  !! rezerwacja wygasa jutro"
        : "";
      linie.push(`- ${z.ref}, ${kwota(z)}, ${z.metoda === "bank_transfer" ? "przelew" : "bramka"}, ${klient(z)}`);
      linie.push(`    zlozone ${odIle(z.wiekDni)}, rezerwacja do ${dzien(z.rezerwacjaDo)}${pilnosc}`);
    }
    if (bezWplaty.length > LIMIT_SEKCJI) linie.push(`  ... i ${bezWplaty.length - LIMIT_SEKCJI} wiecej`);
  }

  // --- Kolejka pracowni --------------------------------------------------
  if (kolejka.length) {
    linie.push("", "== KOLEJKA PRACOWNI ==");
    for (const z of kolejka.slice(0, LIMIT_SEKCJI)) {
      const dni = z.dniDoTerminu;
      const oTerminie = z.termin == null
        ? (z.wymagaUstalen ? "termin poznamy po ustaleniach" : "bez terminu")
        : dni == null ? `termin ${dzien(z.termin)}`
        : dni < 0 ? `!! PO TERMINIE o ${Math.abs(dni)} ${Math.abs(dni) === 1 ? "dzien" : "dni"}, mialo byc ${dzien(z.termin)}`
        : dni === 0 ? `TERMIN DZISIAJ (${dzien(z.termin)})`
        : `${dni} ${dni === 1 ? "dzien" : "dni"} do terminu (${dzien(z.termin)})`;
      linie.push(`- ${z.ref}, ${ETAP_PL[z.etap] || z.etap}, ${oTerminie}`);
      linie.push(`    ${klient(z)}, ${kwota(z)}${z.pozycje ? `, pozycji: ${z.pozycje}` : ""}`);
    }
    if (kolejka.length > LIMIT_SEKCJI) linie.push(`  ... i ${kolejka.length - LIMIT_SEKCJI} wiecej`);
  }

  // --- Zapytania bez odpowiedzi ------------------------------------------
  if (zapytania.length) {
    linie.push("", "== ZAPYTANIA BEZ ODPOWIEDZI ==");
    for (const z of zapytania.slice(0, LIMIT_SEKCJI)) {
      linie.push(`- ${z.ref || `zgloszenie #${z.id}`}, ${ZRODLO_PL[z.zrodlo] || z.zrodlo || "nieznane zrodlo"}, ${odIle(z.wiekDni)}`);
      linie.push(`    ${klient(z)}${z.opis ? `\n    ${String(z.opis).replace(/\s+/g, " ").slice(0, 160)}` : ""}`);
    }
    if (zapytania.length > LIMIT_SEKCJI) linie.push(`  ... i ${zapytania.length - LIMIT_SEKCJI} wiecej`);
  }

  // --- Wyceny w polowie drogi -------------------------------------------
  if (wyceny.length) {
    linie.push("", "== WYCENY DO DOMKNIECIA ==");
    for (const w of wyceny.slice(0, LIMIT_SEKCJI)) {
      linie.push(`- ${w.ref}, ${STAN_WYCENY_PL[w.stan] || w.stan}, ${odIle(w.wiekDni)}, ${klient(w)}`);
    }
    if (wyceny.length > LIMIT_SEKCJI) linie.push(`  ... i ${wyceny.length - LIMIT_SEKCJI} wiecej`);
  }

  if (!pilne && !kolejka.length && !zapytania.length && !wyceny.length && !bezWplaty.length) {
    linie.push("", "Nic nie czeka. Kolejka pusta, zapytania odpowiedziane.");
  }

  return { subject: naglowek, text: linie.join("\n") };
}

/**
 * Odczyt stanu z bazy. Same zapytania, zero skladania tekstu.
 *
 * Wszystkie liczniki i daty przychodza Z SERWERA policzone, tak samo jak
 * przy stronie zamowienia (ADR-0022): data liczona przy skladaniu maila
 * zalezalaby od strefy procesu, a ten chodzi w UTC.
 */
export async function zbierz(pool, teraz = new Date()) {
  const { rows: kolejkaRows } = await pool.query(
    `SELECT o.order_ref, o.status, o.deadline_at, o.requires_details, o.total_grosze,
            o.amount_eur_cents, o.customer_name, o.customer_email,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS pozycje
       FROM orders o
      WHERE o.status = ANY($1::text[])
      ORDER BY o.deadline_at ASC NULLS LAST, o.paid_at ASC`,
    [ETAPY_W_KOLEJCE]
  );

  const { rows: bezWplatyRows } = await pool.query(
    `SELECT order_ref, status, payment_method, expires_at, created_at,
            total_grosze, amount_eur_cents, customer_name, customer_email
       FROM orders
      WHERE status = ANY($1::text[]) AND paid_at IS NULL
      ORDER BY expires_at ASC NULLS LAST`,
    [ETAPY_BEZ_WPLATY]
  );

  const { rows: weryfikacjaRows } = await pool.query(
    `SELECT order_ref, total_grosze, amount_eur_cents, customer_name, customer_email,
            payment_review_reason, payment_status, payment_status_details
       FROM orders
      WHERE status = 'payment_review'
      ORDER BY created_at ASC`
  );

  // Zapytanie bez `contacted_at` to zapytanie, na ktore nikt nie odpisal.
  // Ta sama definicja co na liscie zgloszen w panelu, zeby dwie liczby
  // w dwoch miejscach nie mowily czegos innego o tym samym.
  const { rows: zapytaniaRows } = await pool.query(
    `SELECT id, quote_ref, source, email, description, params, created_at
       FROM leads
      WHERE contacted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 100`
  );

  const { rows: wycenyRows } = await pool.query(
    `SELECT quote_ref, status, customer_name, customer_email, created_at
       FROM quotes
      WHERE status IN ('new', 'priced')
      ORDER BY created_at ASC
      LIMIT 100`
  );

  return {
    kolejka: kolejkaRows.map((r) => ({
      ref: r.order_ref, etap: r.status, termin: r.deadline_at,
      dniDoTerminu: dniDoTerminu(r.deadline_at, teraz),
      wymagaUstalen: r.requires_details === true,
      totalGrosze: r.total_grosze, amountEurCents: r.amount_eur_cents,
      klient: r.customer_name, email: r.customer_email, pozycje: Number(r.pozycje) || 0,
    })),
    bezWplaty: bezWplatyRows.map((r) => ({
      ref: r.order_ref, metoda: r.payment_method, rezerwacjaDo: r.expires_at,
      dniDoKonca: dniDoTerminu(r.expires_at, teraz),
      wiekDni: wiekWDniach(r.created_at, teraz),
      totalGrosze: r.total_grosze, amountEurCents: r.amount_eur_cents,
      klient: r.customer_name, email: r.customer_email,
    })),
    doWeryfikacji: weryfikacjaRows.map((r) => ({
      ref: r.order_ref, totalGrosze: r.total_grosze, amountEurCents: r.amount_eur_cents,
      klient: r.customer_name, email: r.customer_email,
      powod: r.payment_review_reason,
      stanBramki: [r.payment_status, r.payment_status_details].filter(Boolean).join(" / "),
    })),
    zapytania: zapytaniaRows.map((r) => ({
      id: r.id, ref: r.quote_ref, zrodlo: r.source, email: r.email,
      opis: r.description || r.params, wiekDni: wiekWDniach(r.created_at, teraz),
    })),
    wyceny: wycenyRows.map((r) => ({
      ref: r.quote_ref, stan: r.status, klient: r.customer_name, email: r.customer_email,
      wiekDni: wiekWDniach(r.created_at, teraz),
    })),
  };
}
