// ============================================================
// SZEW MIEDZY KOSZYKIEM A ZAMOWIENIEM
// ============================================================
// 2026-08-16 przyszlo oplacone BLIKiem zlecenie na znakowanie laserem, w ktorym
// byl sam plik i ani jednego zdania o tym, co z nim zrobic. Sledztwo pokazalo
// wade, ktorej nie widzial zaden sprawdzian, bo KAZDY ELEMENT Z OSOBNA DZIALAL
// POPRAWNIE:
//
//   kalkulator zbieral opis  ->  koszyk go trzymal  ->  ??? ->  serwer umial go
//   zapisac  ->  poczta zamowieniowa umiala go wydrukowac
//
// Puste miejsce w srodku to `src/pages/Checkout.jsx`: budujac cialo zadania do
// `/api/orders` przepisywal z pozycji koszyka tylko czesc pol i opis do nich nie
// nalezal. Do pracowni szlo wiec zamowienie bez opisu, zawsze, od poczatku
// istnienia koszyka.
//
// Ten sprawdzian pilnuje calego szwu, a nie jednego pola. Bierze WSZYSTKIE pola,
// ktore serwer czyta z pozycji uslugowej (`raw.cos`), i sprawdza, ze zamowienie
// je wysyla. Nowe pole dodane po stronie serwera i zapomniane w przegladarce
// odbije sie tutaj, zanim odbije sie na kliencie.
//
// Uwaga na kierunek: NIE sprawdzamy odwrotnie (pole wyslane, a nieczytane), bo
// wysylanie czegos w zapasie jest nieszkodliwe, a czytanie czegos, czego nikt
// nie wysyla, jest cicha utrata danych.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tu = path.dirname(fileURLToPath(import.meta.url));
const czytaj = (p) => readFileSync(path.resolve(tu, "..", p), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// ------------------------------------------------------------
// 1. Pola, ktore serwer czyta z pozycji uslugowej
// ------------------------------------------------------------
const server = czytaj("chat-api/server.js");

// Blok wyceny pozycji uslugowych zaczyna sie od petli po pozycjach bez
// `productSlug` i konczy na `priced.push`. Tylko tam `raw` opisuje usluge.
const start = server.indexOf('for (const raw of items.filter((i) => !i.productSlug))');
const koniec = server.indexOf("const itemsTotal", start);
if (start < 0 || koniec < 0) {
  zle("nie znalazlem w server.js petli wyceniajacej pozycje uslugowe, sprawdzian nie ma czego pilnowac");
} else {
  const blok = server.slice(start, koniec);
  const czytane = new Set([...blok.matchAll(/\braw\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]));

  // ------------------------------------------------------------
  // 2. Pola, ktore zamowienie wysyla
  // ------------------------------------------------------------
  const checkout = czytaj("src/pages/Checkout.jsx");
  const cialoStart = checkout.indexOf("items: items.map((i) =>");
  const cialoKoniec = checkout.indexOf("customer,", cialoStart);
  if (cialoStart < 0 || cialoKoniec < 0) {
    zle("nie znalazlem w Checkout.jsx mapowania pozycji na cialo zadania");
  } else {
    const cialo = checkout.slice(cialoStart, cialoKoniec);
    const wysylane = new Set([...cialo.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)].map((m) => m[1]));

    // `productSlug` odsiewa pozycje z polki i sam nigdy nie jest polem uslugi.
    czytane.delete("productSlug");

    const brakujace = [...czytane].filter((f) => !wysylane.has(f)).sort();
    if (brakujace.length) {
      zle(`serwer czyta pola, ktorych zamowienie nie wysyla: ${brakujace.join(", ")}`);
      console.error("    Kazde z nich znika po cichu miedzy koszykiem a pracownia.");
    } else {
      ok(`wszystkie ${czytane.size} pol czytanych przez serwer sa wysylane z koszyka`);
    }
  }
}

// ------------------------------------------------------------
// 3. Opis jest wymagany po OBU stronach
// ------------------------------------------------------------
// Sam formularz nie wystarczy, bo da sie go ominac, a skutkiem jest zamowienie
// oplacone i niewykonalne. Sam serwer tez nie wystarczy, bo klient dowiadywalby
// sie o braku dopiero przy platnosci.
if (!/MIN_JOB_DESCRIPTION/.test(server) || !/code: "description_required"/.test(server)) {
  zle("serwer nie odrzuca zlecenia na usluge bez opisu");
} else {
  ok("serwer odrzuca zlecenie na usluge bez opisu");
}

// ------------------------------------------------------------
// 4. Zwolnienia z wymogu opisu musza byc nieliczne i uzasadnione
// ------------------------------------------------------------
// Zwolnienie znaczy, ze zlecenie trafi do pracowni bez ani jednego zdania od
// klienta. Lista, ktora rosnie bez kontroli, po cichu cofa cala poprawke.
const zwolnienia = /const USLUGI_BEZ_OPISU = new Set\(\[([^\]]*)\]\)/.exec(server)?.[1] ?? "";
const ile = zwolnienia.split(",").map((x) => x.trim()).filter(Boolean).length;
if (ile > 2) {
  zle(`${ile} uslug zwolnionych z wymogu opisu, a to ma byc wyjatek, nie regula`);
} else {
  ok(`${ile} usluga zwolniona z opisu, kazda z powodem napisanym w kodzie`);
}

// Kreator pierscionkow MUSI byc zwolniony, inaczej sprzedaz z niego przestaje
// dzialac: RingPriceBox nie zbiera opisu, bo caly wyrob opisuja parametry.
if (!/jewelry_ring_config/.test(zwolnienia)) {
  zle("kreator pierscionkow nie jest zwolniony z opisu, wiec kazde zamowienie z niego dostanie 400");
} else {
  ok("kreator pierscionkow zwolniony, sprzedaz z niego dziala");
}

const katalog = czytaj("src/data/orderCatalog.js");
if (!/export function wymagaOpisu/.test(katalog) || !/requiresDescription !== false/.test(katalog)) {
  zle("katalog uslug nie wymaga opisu domyslnie, wiec nowa usluga wejdzie bez niego");
} else {
  ok("katalog uslug wymaga opisu domyslnie, zwolnienie trzeba napisac jawnie");
}

// Progi po obu stronach musza byc te same, inaczej formularz przepuszcza opis,
// ktory serwer odrzuci, i klient dostaje blad przy platnosci.
const progSerwera = Number(/const MIN_JOB_DESCRIPTION = (\d+)/.exec(server)?.[1]);
const progKlienta = Number(/const MIN_DESCRIPTION = (\d+)/.exec(czytaj("src/components/calculators/CalcToCart.jsx"))?.[1]);
if (!progSerwera || !progKlienta || progSerwera !== progKlienta) {
  zle(`prog dlugosci opisu rozjechal sie: serwer ${progSerwera}, przegladarka ${progKlienta}`);
} else {
  ok(`prog dlugosci opisu ten sam po obu stronach (${progSerwera} znakow)`);
}

// ------------------------------------------------------------
// 5. DRUGA DROGA DO KASY: kreator `/order/`
// ------------------------------------------------------------
// Sprawdzian powyzej pilnowal JEDNEJ drogi, koszyka, i przez to przegapil
// druga. Strona `/order/` sklada zamowienie WPROST do `/api/orders`, z pominie-
// ciem koszyka, a linkuje do niej kazda karta uslugi (`Service.jsx`). Gdy opis
// i deklaracja dostarczenia staly sie obowiazkowe, ta droga przestala dzialac
// calkowicie: serwer odbijal kazde zamowienie bledem 400, bo `Order.jsx` nie
// zbieral ani jednego, ani drugiego.
//
// Nauka jest prosta i dlatego jest tu zapisana: straznik postawiony na jednej
// sciezce nie pilnuje pozostalych. Kazda droga do `/api/orders` musi wysylac
// to, czego `/api/orders` wymaga.
{
  const order = czytaj("src/pages/Order.jsx");
  const cialoStart = order.indexOf("await postJSON(`${API}/api/orders`");
  const cialoKoniec = order.indexOf("consents,", cialoStart);
  if (cialoStart < 0 || cialoKoniec < 0) {
    zle("nie znalazlem w Order.jsx ciala zadania do /api/orders");
  } else {
    const cialo = order.slice(cialoStart, cialoKoniec);
    if (!/\bdescription\b/.test(cialo)) {
      zle("Order.jsx nie wysyla opisu zlecenia, wiec kazde zamowienie z /order/ dostanie 400");
    } else {
      ok("Order.jsx wysyla opis zlecenia");
    }
    if (!/\binbound\b/.test(cialo)) {
      zle("Order.jsx nie wysyla deklaracji dostarczenia, wiec material powierzony z /order/ dostanie 400");
    } else {
      ok("Order.jsx wysyla deklaracje dostarczenia");
    }
  }

  // Prog musi byc ten sam co na serwerze takze tutaj, inaczej formularz
  // przepusci opis, ktory kasa odrzuci.
  const progOrder = Number(/const MIN_DESCRIPTION = (\d+)/.exec(order)?.[1]);
  if (progOrder !== progSerwera) {
    zle(`prog dlugosci opisu w Order.jsx (${progOrder}) rozjechal sie z serwerem (${progSerwera})`);
  } else {
    ok(`prog dlugosci opisu w /order/ ten sam co na serwerze (${progOrder} znakow)`);
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nSzew koszyk-zamowienie: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
