#!/usr/bin/env node
// ============================================================
// ASYSTENT LICZY, ZAMIAST ZGADYWAC
// ============================================================
// Asystent na stronie znal ceny wylacznie z tekstu wklejonego do polecenia
// systemowego, wiec na pytanie "ile kosztuje dwadziescia breloczkow z PETG"
// odpowiadal z pamieci i mylil sie: przeglad z 3 wrzesnia zlapal cztery
// odpowiedzi o pieniadzach niezgodne z kalkulatorem. Od 4 wrzesnia liczy
// narzedziem, ktore wola `priceItem`, czyli ten sam kod, ktory wystawia kwote
// w koszyku.
//
// Ten sprawdzian pilnuje szesciu rzeczy, kazdej po jednej awarii, ktora bez
// niego bylaby cicha:
//
// 1. NIE MA DRUGIEJ FORMULY. Narzedzie ma wolac `priceItem`, a nie miec
//    wlasna tabele cen: wlasna rozjechalaby sie z rdzeniem przy pierwszej
//    zmianie stawki i nikt by tego nie zobaczyl, bo rozmowa z asystentem nie
//    przechodzi przez zadna bramke.
//
// 2. ASYSTENT NIGDY NIE MOWI "WIAZACA". Kwota wiazaca powstaje w koszyku,
//    z numerem i terminem. Odpowiedz z rozmowy, ktora podaje sie za wiazaca,
//    jest obietnica, ktorej kasa nie przyjmie.
//
// 3. LICZBA SZTUK RZADZI PROGIEM NAKLADU. Bez tego dwadziescia sztuk liczylo
//    sie po cenie progu "prototyp", czyli DROZEJ niz w sklepie za to samo.
//
// 4. PARAMETRY DOBRANE ZA KLIENTA SA WYMIENIONE. Cicho dobrany wariant to
//    kwota za co innego, niz klient pytal, a on nie ma jak tego zauwazyc.
//
// 5. WARUNKI KODU CZYTAJA SIE Z TABELI RODZAJOW. Polecenie systemowe podawalo
//    90 dni waznosci kodu powitalnego, gdy kod zyje 45 (ADR-0038). Liczba
//    stojaca w dwoch miejscach rozjedzie sie.
//
// 6. TRASA CZATU NAPRAWDE PODAJE NARZEDZIA MODELOWI. Modul moze byc doskonaly
//    i nieuzywany: to jest awaria, ktorej nie widac po niczym poza tym, ze
//    asystent dalej zgaduje.
//
// Uruchamiany w `npm run build`.

import { readFileSync } from "node:fs";

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};

const N = await import("../chat-api/narzedziaAsystenta.js");
const { SERVICES } = await import("../chat-api/pricing/orderCatalog.js");
const { RODZAJE_KODOW } = await import("../chat-api/discounts.js");

console.log("1. Liczy tym samym kodem, co koszyk");
{
  const zrodlo = readFileSync(new URL("../chat-api/narzedziaAsystenta.js", import.meta.url), "utf8");
  ok(/import \{[^}]*priceItem[^}]*\} from "\.\/orders\.js"/.test(zrodlo),
    "narzedzie wola priceItem z orders.js");
  // Wlasna stawka w tym pliku znaczy druga formule cenowa.
  const podejrzane = zrodlo.match(/^\s*(?:const|let)\s+\w*(?:CENA|STAWKA|PRICE|RATE)\w*\s*=\s*\d/gim) || [];
  ok(podejrzane.length === 0, "nie ma tu wlasnych stawek", podejrzane);
}

console.log("2. Kazda usluga z katalogu odpowiada, a nie milczy");
{
  for (const s of SERVICES) {
    const w = await N.wykonajNarzedzie("policz_cene", { usluga: s.id }, { lang: "pl" });
    const sensowna = w.blad ? typeof w.wiadomosc === "string" && w.wiadomosc.length > 0
      : Number.isFinite(w.za_sztuke_pln) && w.za_sztuke_pln > 0;
    ok(sensowna, `${s.id}: kwota albo powod, nie cisza`, w.blad ? w.blad : w.za_sztuke_pln);
    if (!w.blad) ok(w.wiazaca === false, `${s.id}: kwota podana jako szacunek`, w.wiazaca);
    ok(typeof (w.adres || "") === "string" && (w.adres || "").includes("/shop/service/"),
      `${s.id}: odsyla tam, gdzie kwote da sie domknac`, w.adres);
  }
}

console.log("3. Liczba sztuk rzadzi progiem nakladu");
{
  const jedna = await N.wykonajNarzedzie("policz_cene", { usluga: "print_fdm", parametry: { materialKey: "PETG", sizeId: "S" }, sztuk: 1 }, { lang: "pl" });
  const dwadziescia = await N.wykonajNarzedzie("policz_cene", { usluga: "print_fdm", parametry: { materialKey: "PETG", sizeId: "S" }, sztuk: 20 }, { lang: "pl" });
  ok(dwadziescia.za_sztuke_pln < jedna.za_sztuke_pln,
    "dwadziescia sztuk jest tansze za sztuke niz jedna", [jedna.za_sztuke_pln, dwadziescia.za_sztuke_pln]);
  ok(dwadziescia.parametry_uzyte.quantityId !== jedna.parametry_uzyte.quantityId,
    "prog nakladu wyliczyl sie z liczby sztuk", [jedna.parametry_uzyte.quantityId, dwadziescia.parametry_uzyte.quantityId]);
  ok(Math.abs(dwadziescia.razem_pln - dwadziescia.za_sztuke_pln * 20) < 0.02,
    "razem to cena sztuki razy naklad", [dwadziescia.razem_pln, dwadziescia.za_sztuke_pln]);
}

console.log("4. Parametry dobrane za klienta sa wymienione");
{
  const w = await N.wykonajNarzedzie("policz_cene", { usluga: "print_fdm", parametry: { materialKey: "PETG" } }, { lang: "pl" });
  ok(Array.isArray(w.parametry_dobrane_domyslnie) && w.parametry_dobrane_domyslnie.length > 0,
    "lista dobranych parametrow nie jest pusta", w.parametry_dobrane_domyslnie);
  ok(!w.parametry_dobrane_domyslnie.includes("materialKey"),
    "to, co klient podal, nie jest zgloszone jako dobrane");
  ok(w.parametry_uzyte.materialKey === "PETG", "wybor klienta trafil do wyceny", w.parametry_uzyte.materialKey);
}

console.log("5. Warunki kodu ida z tabeli rodzajow");
{
  for (const [rodzaj, r] of Object.entries(RODZAJE_KODOW)) {
    const w = await N.wykonajNarzedzie("warunki_kodu", { rodzaj }, { lang: "pl" });
    ok(w.waznosc_dni === r.dni, `${rodzaj}: waznosc zgodna z tabela`, [w.waznosc_dni, r.dni]);
    ok(w.procent_domyslny === r.procent, `${rodzaj}: procent zgodny z tabela`, [w.procent_domyslny, r.procent]);
    ok(w.powtarzalny === Boolean(r.powtarzalny), `${rodzaj}: powtarzalnosc zgodna z tabela`);
  }
  const zly = await N.wykonajNarzedzie("warunki_kodu", { rodzaj: "nie-ma-takiego" }, { lang: "pl" });
  ok(zly.blad === "nieznany_rodzaj", "nieznany rodzaj oddaje blad, a nie zmyslone warunki");
}

console.log("6. Trasa czatu podaje narzedzia modelowi");
{
  const server = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  ok(/import \{[^}]*NARZEDZIA[^}]*wykonajNarzedzie[^}]*\} from "\.\/narzedziaAsystenta\.js"/.test(server),
    "server importuje narzedzia");
  ok(/tools: NARZEDZIA/.test(server), "przekazuje je do modelu");
  ok(/role: "tool"/.test(server), "i oddaje modelowi wynik wywolania");
  // Bez ogranicznika rund model, ktory woli liczyc, zapetlilby rozmowe.
  ok(/runda < \d/.test(server), "liczba rund narzedziowych jest ograniczona");
}

console.log("7. Trzy jezyki maja swoje zdanie o kodzie");
{
  const widziane = new Set();
  for (const lang of ["pl", "en", "de"]) {
    const w = await N.wykonajNarzedzie("warunki_kodu", { rodzaj: "prezent" }, { lang });
    ok(typeof w.jak_uzyc === "string" && w.jak_uzyc.length > 10, `${lang}: instrukcja uzycia istnieje`);
    widziane.add(w.jak_uzyc);
  }
  ok(widziane.size === 3, "kazdy jezyk ma wlasne zdanie, a nie kopie polskiego", widziane.size);
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nNarzedzia asystenta: liczy tym samym kodem, co koszyk");
process.exit(bledy ? 1 : 0);
