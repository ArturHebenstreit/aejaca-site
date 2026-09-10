#!/usr/bin/env node
// ============================================================
// PORANNE PODSUMOWANIE DNIA
// ============================================================
// Zdarzenie, ktore wymusilo ten mechanizm (2026-09-10): zamowienie przelewem
// z 8 wrzesnia stalo dwa dni, powiadomienie o nim nie doszlo, wlasciciel
// dowiedzial sie o zleceniu od klienta, a rezerwacja miala wygasnac
// nastepnego dnia. Zamiatarka zamknelaby wtedy oplacone zamowienie i napisala
// klientowi, ze towar wrocil do sprzedazy.
//
// Sprawdzian pilnuje trzech rzeczy, i wszystkie trzy to REGULY, a nie ksztalt
// napisu:
//
//   1. Rezerwacja, ktora konczy sie dzis albo jutro, MUSI byc widoczna jako
//      pilna, bo tylko wtedy podsumowanie zdazy przed zamiatarka.
//   2. Zlecenie po terminie musi byc nazwane po terminie, a nie schowane
//      miedzy pozostalymi.
//   3. Mail przychodzi TAKZE wtedy, gdy nic sie nie dzieje. Cisza i awaria
//      musza wygladac inaczej, bo caly ten mechanizm istnieje wlasnie po to,
//      ze brak maila nie rozni sie od braku zdarzenia.
//
// Wszystko liczy sie wobec chwili WSTRZYKNIETEJ, nie wobec zegara maszyny:
// test uruchamiany w innym miesiacu ma dawac ten sam wynik.

import { tresc, wiekWDniach, ETAPY_W_KOLEJCE, ETAPY_BEZ_WPLATY } from "../chat-api/podsumowanieDnia.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const sprawdz = (warunek, gdyZle, gdyDobrze) => (warunek ? ok(gdyDobrze) : zle(gdyZle));

const TERAZ = new Date("2026-09-10T05:45:00Z"); // 7:45 czasu polskiego

console.log("\n1. Rezerwacja konczaca sie jutro trafia na gore i do tytulu\n");
{
  // Dokladnie zamowienie z 8 wrzesnia: przelew, rezerwacja do 11 wrzesnia.
  const dane = {
    kolejka: [],
    bezWplaty: [{
      ref: "AE20260908-DB173D06", metoda: "bank_transfer",
      rezerwacjaDo: "2026-09-11T15:19:00Z", dniDoKonca: 1, wiekDni: 2,
      totalGrosze: 549591, amountEurCents: 137542,
      klient: "Raffael Almer", email: "r.almer@gmx.at",
    }],
    doWeryfikacji: [], zapytania: [], wyceny: [],
  };
  const { subject, text } = tresc(dane, TERAZ);

  sprawdz(/1 do ruszenia dzisiaj/.test(subject),
    `tytul nie liczy pilnej sprawy: ${subject}`,
    "tytul mowi, ile jest do ruszenia, wiec widac to z telefonu");
  sprawdz(/rezerwacja wygasa jutro/.test(text),
    "podsumowanie nie ostrzega, ze rezerwacja konczy sie jutro",
    "rezerwacja konczaca sie jutro jest nazwana wprost");
  sprawdz(text.indexOf("CZEKA NA WPLATE") < (text.indexOf("KOLEJKA PRACOWNI") === -1 ? Infinity : text.indexOf("KOLEJKA PRACOWNI")),
    "sekcja o wplatach stoi po kolejce, czyli pilne nizej niz niepilne",
    "pieniadze stoja wyzej niz praca");
  // JEDNA WALUTA W WIERSZU. Zgloszenie wlasciciela z tego samego dnia.
  sprawdz(/1375\.42 EUR/.test(text) && !/5495,91 PLN/.test(text),
    "wiersz miesza waluty albo podaje zlotowki klientowi placacemu w euro",
    "kwota w walucie, ktora placi ten klient, bez drugiej obok");
}

console.log("\n2. Rezerwacja, ktora juz wygasla, mowi o zamiatarce\n");
{
  const dane = {
    kolejka: [], doWeryfikacji: [], zapytania: [], wyceny: [],
    bezWplaty: [{
      ref: "AE20260901-AAAA1111", metoda: "bank_transfer",
      rezerwacjaDo: "2026-09-09T10:00:00Z", dniDoKonca: -1, wiekDni: 9,
      totalGrosze: 10000, amountEurCents: null, klient: null, email: "x@y.pl",
    }],
  };
  const { text } = tresc(dane, TERAZ);
  sprawdz(/REZERWACJA JUZ WYGASLA/.test(text),
    "wygasla rezerwacja nie jest odrozniona od czekajacej",
    "wygasla rezerwacja jest nazwana wygasla");
  sprawdz(/100,00 PLN/.test(text),
    "zamowienie zlotowkowe nie pokazuje kwoty w zlotowkach",
    "zamowienie zlotowkowe zostaje w zlotowkach");
  sprawdz(/x@y\.pl/.test(text),
    "klient bez nazwiska gubi adres, czyli jedyna droge kontaktu",
    "klient bez nazwiska pokazuje adres");
}

console.log("\n3. Zlecenie po terminie jest nazwane po terminie\n");
{
  const dane = {
    bezWplaty: [], doWeryfikacji: [], zapytania: [], wyceny: [],
    kolejka: [
      { ref: "AE1", etap: "in_production", termin: "2026-09-07", dniDoTerminu: -3,
        totalGrosze: 50000, amountEurCents: null, klient: "A", email: "a@a.pl", pozycje: 2 },
      { ref: "AE2", etap: "queued", termin: "2026-09-10", dniDoTerminu: 0,
        totalGrosze: 20000, amountEurCents: null, klient: "B", email: "b@b.pl", pozycje: 1 },
      { ref: "AE3", etap: "details", termin: null, dniDoTerminu: null, wymagaUstalen: true,
        totalGrosze: 30000, amountEurCents: null, klient: "C", email: "c@c.pl", pozycje: 1 },
    ],
  };
  const { subject, text } = tresc(dane, TERAZ);
  sprawdz(/PO TERMINIE o 3 dni/.test(text),
    "zlecenie po terminie nie jest wyroznione",
    "zlecenie po terminie mowi o ile dni");
  sprawdz(/TERMIN DZISIAJ/.test(text),
    "termin na dzis nie jest wyrozniony",
    "termin na dzis jest wyrozniony");
  sprawdz(/termin poznamy po ustaleniach/.test(text),
    "zlecenie czekajace na ustalenia udaje zlecenie bez terminu",
    "zlecenie w ustaleniach mowi, czemu nie ma daty");
  sprawdz(/z tego PO TERMINIE: 1/.test(text) && /1 do ruszenia dzisiaj/.test(subject),
    "licznik na gorze nie zgadza sie z trescia",
    "licznik na gorze zgadza sie z trescia");
  sprawdz(/zegar STOI/.test(text),
    "etap ustalen nie mowi, ze zegar nie biegnie",
    "etap ustalen mowi, ze zegar stoi");
}

console.log("\n4. Mail przychodzi takze w dniu, w ktorym nic nie czeka\n");
{
  const { subject, text } = tresc({}, TERAZ);
  sprawdz(/nic pilnego/.test(subject),
    "pusty dzien nie ma wlasnego tytulu, wiec nie da sie go odroznic od awarii",
    "pusty dzien ma wlasny tytul");
  sprawdz(/Nic nie czeka/.test(text),
    "pusty dzien daje pusty mail, ktory wyglada jak zepsuty",
    "pusty dzien mowi wprost, ze nic nie czeka");
  sprawdz(/W kolejce: 0/.test(text),
    "liczniki znikaja przy pustym dniu, wiec nie widac, ze mechanizm liczyl",
    "liczniki stoja takze przy zerach");
  sprawdz(!/==/.test(text),
    "puste sekcje zostaja jako naglowki bez tresci",
    "puste sekcje znikaja, licznik zostaje");
}

console.log("\n5. Platnosc do recznej weryfikacji stoi najwyzej\n");
{
  const dane = {
    kolejka: [{ ref: "AE9", etap: "queued", termin: "2026-09-20", dniDoTerminu: 10,
      totalGrosze: 100, amountEurCents: null, klient: "X", email: "x@x.pl", pozycje: 1 }],
    bezWplaty: [], zapytania: [], wyceny: [],
    doWeryfikacji: [{ ref: "AE8", totalGrosze: 40000, amountEurCents: null,
      klient: "Y", email: "y@y.pl", powod: "late_success", stanBramki: "SUCCESS / AUTHORIZED" }],
  };
  const { text, subject } = tresc(dane, TERAZ);
  sprawdz(text.indexOf("PLATNOSCI DO RECZNEJ WERYFIKACJI") < text.indexOf("KOLEJKA PRACOWNI"),
    "platnosc do weryfikacji nie stoi nad kolejka, choc klient juz zaplacil",
    "platnosc do weryfikacji stoi nad kolejka");
  sprawdz(/late_success/.test(text) && /SUCCESS \/ AUTHORIZED/.test(text),
    "brak powodu i stanu bramki, czyli nie wiadomo, co sprawdzic",
    "powod i stan bramki sa w mailu");
  sprawdz(/1 do ruszenia dzisiaj/.test(subject),
    "platnosc do weryfikacji nie liczy sie jako pilna",
    "platnosc do weryfikacji liczy sie jako pilna");
}

console.log("\n6. Wiek liczy sie po polskim kalendarzu\n");
{
  // 8 wrzesnia 17:19 czasu polskiego to 15:19 UTC. Wobec 10 wrzesnia rano
  // sa to dwa dni, nie trzy i nie jeden.
  sprawdz(wiekWDniach("2026-09-08T15:19:00Z", TERAZ) === 2,
    `wiek zgloszenia z 8 wrzesnia wyszedl ${wiekWDniach("2026-09-08T15:19:00Z", TERAZ)}, a ma byc 2`,
    "wiek zgloszenia liczy sie po dniach kalendarzowych");
  // Polnoc czasu polskiego to jeszcze poprzedni dzien w UTC: bez nazwanej
  // strefy zgloszenie zlozone o 00:30 wygladaloby na dzien starsze.
  sprawdz(wiekWDniach("2026-09-09T22:30:00Z", TERAZ) === 0,
    `zgloszenie z 10 wrzesnia 00:30 wyszlo jako ${wiekWDniach("2026-09-09T22:30:00Z", TERAZ)} dni, a ma byc dzisiejsze`,
    "zgloszenie zlozone po polnocy jest dzisiejsze, a nie wczorajsze");
}

console.log("\n7. Kolejka i cron stoja tam, gdzie maja\n");
{
  const SERWER = readFileSync(join(ROOT, "chat-api/server.js"), "utf8");
  sprawdz(/cron\.schedule\("45 6 \* \* \*", \(\) => sendPodsumowanieDnia\(pool\), \{ timezone: "Europe\/Warsaw" \}\)/.test(SERWER),
    "podsumowanie nie ma crona o poranku w czasie polskim",
    "cron chodzi o 6:45 czasu polskiego, a nie o 6:45 UTC");

  const MODUL = readFileSync(join(ROOT, "chat-api/podsumowanieDnia.js"), "utf8");
  if (/from "\.\/orderMail\.js"/.test(MODUL)) zle("modul podsumowania importuje poczte, wiec zaleznosc idzie w kolko");
  else ok("modul podsumowania nie zna poczty, wiec tresc da sie sprawdzic bez niej");

  // Etapy bierzemy z jednej listy, a nie z przepisanej kopii: nowy etap pracy
  // dodany w `productionQueue.js` musialby inaczej trafic do podsumowania
  // recznie, czyli nigdy.
  sprawdz(ETAPY_W_KOLEJCE.includes("in_production") && ETAPY_W_KOLEJCE.includes("details")
    && !ETAPY_W_KOLEJCE.includes("shipped") && !ETAPY_W_KOLEJCE.includes("completed"),
    "lista etapow w kolejce obejmuje wyslane albo pomija realizacje",
    "kolejka to praca do zrobienia, bez wyslanych i zamknietych");
  sprawdz(ETAPY_BEZ_WPLATY.length === 2 && ETAPY_BEZ_WPLATY.includes("awaiting_transfer"),
    "lista stanow bez wplaty pomija przelew, czyli ten przypadek, ktory to wymusil",
    "stany bez wplaty obejmuja bramke i przelew");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nPoranne podsumowanie: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
