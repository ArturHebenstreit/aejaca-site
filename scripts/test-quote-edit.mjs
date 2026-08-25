#!/usr/bin/env node
// ============================================================
// EDYCJA I USUWANIE ZAPISANEJ OFERTY
// ============================================================
// Wycena powstaje z zapytania przepisanego ze skrzynki albo z rozmowy, wiec
// literowka w adresie i zla ilosc sa tu norma. Do tej pory jedyna droga bylo
// zalozenie wyceny od nowa, czyli NOWY NUMER: inny w watku i inny w tytule
// platnosci niz ten, ktory klient juz od nas dostal.
//
// Awarie, ktore ten test zamyka, sa ciche, bo zadna z nich niczego nie wywala:
//
//   1. Zmiana ilosci bez przeliczenia `line_grosze` i sumy naglowka. Oferta
//      na trzy sztuki pokazywalaby wtedy kwote za jedna, a klient zaplacilby
//      sume, ktora nie zgadza sie z wlasnymi pozycjami.
//   2. Usuwanie pozycji polem ZAZNACZANYM. Pole zaznaczane wysyla sie tylko
//      gdy jest zaznaczone, wiec przy dwoch usuwanych z pieciu tablice
//      w formularzu rozjezdzaja sie o dwa miejsca i znikaja NIE TE wiersze.
//   3. Druga trasa o tej samej sciezce. Express bierze zarejestrowana
//      wczesniej, a starsza cichnie razem z calym zabezpieczeniem.
//
//   node scripts/test-quote-edit.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUOTES = readFileSync(join(ROOT, "chat-api", "quotes.js"), "utf8");
const SERWER = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");
const PANEL = readFileSync(join(ROOT, "admin", "server.js"), "utf8");
const WIDOK = readFileSync(join(ROOT, "admin", "views", "quote-edit.ejs"), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);
const ma = (tekst, wzor, opis) => (wzor.test(tekst) ? ok(opis) : zle(`NIE ${opis}`));

console.log("\n1. Trasy istnieja pojedynczo\n");
{
  for (const [wzor, nazwa] of [
    [/app\.post\("\/api\/quotes\/:ref\/update"/g, "POST /api/quotes/:ref/update"],
    [/app\.delete\("\/api\/quotes\/:ref"/g, "DELETE /api/quotes/:ref"],
  ]) {
    const ile = (SERWER.match(wzor) || []).length;
    if (ile === 1) ok(`${nazwa}: dokladnie jedna trasa`);
    else zle(`${nazwa}: tras jest ${ile}, wiec pozniejsza nie odpowiada na nic`);
  }
  ma(SERWER, /app\.post\("\/api\/quotes\/:ref\/update"[\s\S]{0,200}?requireAdmin\(req, res\)/, "edycja wymaga zalogowanego pracownika");
  ma(SERWER, /app\.delete\("\/api\/quotes\/:ref"[\s\S]{0,300}?requireAdmin\(req, res\)/, "usuwanie wymaga zalogowanego pracownika");
}

console.log("\n2. Wycena, ktora stala sie zamowieniem, jest zamknieta\n");
{
  const fn = QUOTES.slice(QUOTES.indexOf("export async function updateQuote"));
  const glowa = fn.slice(0, fn.indexOf("export async function deleteQuote"));
  ma(glowa, /status === "converted"/, "edycja odmawia wycenie w stanie converted");
  // Ta sama regula co w `priceQuote`. Rozjazd znaczylby, ze jedna droga
  // wpuszcza to, czego druga broni.
  ma(QUOTES, /priceQuote[\s\S]{0,800}?status === "converted"/, "wycenianie nadal odmawia wycenie w stanie converted");

  const del = QUOTES.slice(QUOTES.indexOf("export async function deleteQuote"));
  ma(del, /status === "converted" && !force/, "usuwanie wyceny z zamowieniem wymaga osobnego potwierdzenia");
  ma(SERWER, /app\.delete\("\/api\/quotes\/:ref"[\s\S]{0,600}?confirm_mismatch/, "usuwanie wyceny wymaga przepisanego numeru");

  const trasa = SERWER.slice(SERWER.indexOf('app.delete("/api/quotes/:ref"'));
  const iPotwierdzenie = trasa.indexOf("confirm_mismatch");
  const iBaza = trasa.indexOf("deleteQuote(");
  if (iPotwierdzenie > 0 && iPotwierdzenie < iBaza) ok("potwierdzenie stoi przed siegnieciem do bazy");
  else zle("potwierdzenie stoi po siegnieciu do bazy albo go nie ma");
}

console.log("\n3. Kwoty ida za iloscia\n");
{
  const fn = QUOTES.slice(QUOTES.indexOf("export async function updateQuote"));
  const glowa = fn.slice(0, fn.indexOf("export async function deleteQuote"));
  ma(glowa, /line_grosze = \$\$\{wart\.length\}/, "zmiana ilosci przelicza wartosc pozycji");
  ma(glowa, /item\.unit_grosze \* qty/, "wartosc pozycji liczy sie z kwoty jednostkowej razy ilosc");
  // Sume liczymy z pozycji, a nie korygujemy o roznice: po usunieciu i dodaniu
  // pozycji w jednym zapisie roznica przestaje byc policzalna.
  ma(glowa, /SUM\(line_grosze\)/, "suma naglowka liczy sie z pozycji, a nie z korekty o roznice");
  ma(glowa, /status = 'new'/, "oferta bez wycenionych pozycji wraca do stanu nowego");
  ma(glowa, /no_contact/, "edycja nie pozwala zabrac naraz adresu i telefonu");
  // Kwoty jednostkowe maja jedna droge, przez wycenianie. Gdyby edycja tez je
  // ustawiala, kontrola "kwota musi byc dodatnia" mialaby obejscie.
  if (/unit_grosze = /.test(glowa)) zle("edycja ustawia kwoty jednostkowe, a od tego jest wycenianie");
  else ok("edycja nie ustawia kwot jednostkowych");
}

console.log("\n4. Usuwanie pozycji nie rozjezdza formularza\n");
{
  // Pole zaznaczane wysyla sie WYLACZNIE zaznaczone, wiec przy kilku
  // usuwanych pozycjach indeksy tablic przestaja do siebie pasowac.
  const rzad = WIDOK.slice(WIDOK.indexOf('name="itemId"'), WIDOK.indexOf('name="newTitle"'));
  if (/<select[^>]*name="itemAction"/.test(rzad)) ok("o usunieciu pozycji decyduje lista, ktora wysyla sie zawsze");
  else zle("usuwanie pozycji nie idzie przez liste, sprawdz czy nie wrocilo pole zaznaczane");
  if (/type="checkbox"[^>]*name="item/.test(rzad)) zle("w wierszu pozycji stoi pole zaznaczane, indeksy sie rozjada");
  else ok("w wierszu pozycji nie ma pola zaznaczanego");

  ma(PANEL, /akcje\[i\] === "remove"/, "panel czyta decyzje o usunieciu z tej samej listy");
  ma(PANEL, /\[\]\.concat\(req\.body\.itemId \|\| \[\]\)/, "panel zbiera identyfikatory pozycji w tablice");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nEdycja i usuwanie oferty: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
