#!/usr/bin/env node
// ============================================================
// KOLEJKA PRACOWNI: ETAPY, PRZEJSCIA I KOLUMNY POD NIMI
// ============================================================
// `chat-api/productionQueue.js` zostal wydzielony z serwera po to, zeby regule
// przejsc dalo sie sprawdzic bez stawiania bazy. Do tej pory nikt tego nie
// robil, wiec plik mial komentarz o testowalnosci i zero testow.
//
// Klasa awarii jest tu cicha, dokladnie jak przy geometrii: zadna kwota sie
// nie zmienia. Zle przejscie robi z zamowienia NIEOPLACONEGO zamowienie
// WYSLANE, panel pokazuje zielony wiersz, a rzecz wychodzi dopiero wtedy, gdy
// klient pyta, gdzie jest paczka, ktorej nikt nie nadal i za ktora nikt nie
// zaplacil.
//
// Test pilnuje czterech rzeczy:
//   1. wypisane przejscia dzialaja, w tym swiadomy skrot paid -> shipped,
//   2. przejscia spoza listy sa odrzucane, ze `awaiting_payment` na czele,
//   3. nazwa kolumny ze stemplem jest bezpiecznym identyfikatorem, bo trafia
//      do UPDATE przez interpolacje, a nie przez parametr,
//   4. kazda taka kolumna naprawde powstaje przy starcie serwera, i kazdy
//      status z reguly istnieje w ograniczeniu tabeli `orders`.
//
//   node scripts/test-production-queue.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ETAPY_PRACY, przejscie } from "../chat-api/productionQueue.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERWER = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");
const SCHEMAT = readFileSync(join(ROOT, "scripts", "orders-schema.sql"), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

console.log("\n1. Wypisane przejscia dzialaja\n");
{
  for (const [etap, regula] of Object.entries(ETAPY_PRACY)) {
    for (const zrodlo of regula.z) {
      const w = przejscie(zrodlo, etap);
      if (!w.ok) zle(`${zrodlo} -> ${etap}: odrzucone, a ma byc dozwolone`);
      else if (w.pole !== regula.pole) zle(`${zrodlo} -> ${etap}: stempel w "${w.pole}", a ma byc "${regula.pole}"`);
      else ok(`${zrodlo} -> ${etap}, stempel w ${w.pole}`);
    }
  }

  // Rzecz z polki pakuje sie i wysyla tego samego dnia. Ten skrot jest
  // swiadomy i ma zostac, wiec pilnuje go osobny przypadek.
  if (przejscie("paid", "shipped").ok) ok("skrot paid -> shipped zostaje, bez wymuszania etapu posredniego");
  else zle("skrot paid -> shipped zniknal, a byl swiadomy");
}

console.log("\n2. Przejscia spoza listy sa odrzucane\n");
{
  const zakazane = [
    ["awaiting_payment", "in_production", "praca rusza za darmo"],
    ["awaiting_payment", "shipped", "paczka jedzie bez zaplaty"],
    ["awaiting_transfer", "shipped", "paczka jedzie przed przelewem"],
    ["payment_review", "in_production", "praca rusza przed rozstrzygnieciem wplaty"],
    ["draft", "in_production", "koszyk trafia do pracowni"],
    ["cancelled", "shipped", "anulowane zamowienie zostaje wyslane"],
    ["expired", "in_production", "wygasle zamowienie wraca do pracy"],
    ["refunded", "completed", "zwrocone zamowienie zostaje zamkniete jako zrobione"],
    ["paid", "completed", "zamowienie zamyka sie bez pracy i bez wysylki"],
    ["shipped", "in_production", "wyslana paczka wraca do pracowni"],
    ["completed", "shipped", "zamkniete zamowienie jedzie drugi raz"],
  ];
  for (const [zrodlo, etap, opis] of zakazane) {
    const w = przejscie(zrodlo, etap);
    if (w.ok) zle(`${zrodlo} -> ${etap} przeszlo: ${opis}`);
    else if (w.powod !== "bad_transition") zle(`${zrodlo} -> ${etap}: powod "${w.powod}", a ma byc "bad_transition"`);
    else ok(`${zrodlo} -> ${etap} odrzucone (${opis})`);
  }

  for (const etap of ["", "done", "in-production", "IN_PRODUCTION", "__proto__", "toString"]) {
    const w = przejscie("paid", etap);
    if (w.ok) zle(`etap "${etap}" przeszedl, a nie istnieje`);
    else if (w.powod !== "bad_stage") zle(`etap "${etap}": powod "${w.powod}", a ma byc "bad_stage"`);
    else ok(`etap "${etap}" odrzucony jako nieznany`);
  }
}

console.log("\n3. Nazwa kolumny trafia do SQL przez interpolacje\n");
{
  // `${regula.pole}` stoi w UPDATE bez parametryzacji, bo nazwy kolumny nie da
  // sie podac przez $N. Jest to bezpieczne dopoki wartosc pochodzi z tej
  // tabeli, a nie z zadania. Test pilnuje, ze nikt nie wstawi tu niczego,
  // co po interpolacji przestanie byc nazwa kolumny.
  const identyfikator = /^[a-z][a-z0-9_]{2,40}$/;
  for (const [etap, regula] of Object.entries(ETAPY_PRACY)) {
    if (identyfikator.test(regula.pole)) ok(`${etap}: "${regula.pole}" jest zwykla nazwa kolumny`);
    else zle(`${etap}: "${regula.pole}" nie jest bezpieczna nazwa kolumny`);
  }
  if (/\$\{regula\.pole\}/.test(SERWER)) ok("serwer bierze nazwe kolumny z reguly, nie z tresci zadania");
  else zle("serwer nie uzywa juz nazwy kolumny z reguly, sprawdz UPDATE etapu");
  if (/WHERE id = \$1 AND status = ANY\(\$5::text\[\]\)/.test(SERWER)) ok("UPDATE powtarza warunek statusu, wiec wyscig nie przestawi anulowanego");
  else zle("UPDATE nie powtarza warunku statusu, dwa okna moga sie rozjechac");
}

console.log("\n4. Kolumny i statusy naprawde istnieja\n");
{
  for (const [etap, regula] of Object.entries(ETAPY_PRACY)) {
    const wzor = new RegExp(`ADD COLUMN IF NOT EXISTS ${regula.pole}\\b`);
    if (wzor.test(SERWER)) ok(`${regula.pole}: dokladana przy starcie serwera`);
    else zle(`${regula.pole}: brak ALTER TABLE przy starcie, UPDATE etapu "${etap}" wywali sie na produkcji`);

    const wSchemacie = new RegExp(`\\b${regula.pole}\\b`).test(SCHEMAT);
    if (wSchemacie) ok(`${regula.pole}: opisana w orders-schema.sql`);
    else zle(`${regula.pole}: nie ma jej w orders-schema.sql, swieza baza z pliku nie zna tej kolumny`);
  }

  // Ograniczenie CHECK jest jedynym miejscem, ktore wie, jakie statusy w ogole
  // istnieja. Literowka w regule ("payed") nie wywalilaby niczego przy starcie,
  // tylko cicho zablokowalaby jedno przejscie na zawsze.
  const check = SCHEMAT.match(/CHECK \(status IN \(([^)]+)\)\)/);
  if (!check) {
    zle("nie znalazlem ograniczenia CHECK na statusie zamowienia");
  } else {
    const znane = new Set(check[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")));
    const uzyte = new Set(Object.entries(ETAPY_PRACY).flatMap(([etap, r]) => [etap, ...r.z]));
    for (const status of [...uzyte].sort()) {
      if (znane.has(status)) ok(`status "${status}" istnieje w tabeli orders`);
      else zle(`status "${status}" z reguly przejsc nie istnieje w ograniczeniu tabeli orders`);
    }
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nKolejka pracowni: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
