#!/usr/bin/env node
// ============================================================
// EDYCJA OFERTY: POZYCJE, KWOTY I UKLAD WYBORU
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
//      To samo dotyczy zaznaczania wariantow i dodatkow.
//   3. Dwa warianty z jednej grupy w kwocie naraz. Klient placi za jedna
//      rzecz, a do pracowni idzie zlecenie na dwie.
//   4. Druga trasa o tej samej sciezce. Express bierze zarejestrowana
//      wczesniej, a starsza cichnie razem z calym zabezpieczeniem.
//
//   node scripts/test-quote-edit.mjs

import { readFileSync } from "node:fs";
import { selectedQuoteItems, quoteAmountGrosze, quoteGroups } from "../chat-api/quotes.js";
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
  // Formularz panelu jest jeden, wiec i trasa zapisu jest jedna. Druga sciezka
  // do kwot znaczylaby druga regule ich sprawdzania.
  const ile = (PANEL.match(/app\.post\("\/quotes\/:ref\/edit"/g) || []).length;
  if (ile === 1) ok("panel zapisuje cala oferte jedna trasa");
  else zle(`tras zapisu oferty w panelu jest ${ile}`);
}

console.log("\n2. Wycena, ktora stala sie zamowieniem, jest zamknieta\n");
{
  const fn = QUOTES.slice(QUOTES.indexOf("export async function updateQuote"));
  const glowa = fn.slice(0, fn.indexOf("export async function chooseQuoteOption"));
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

console.log("\n3. Kwoty ida za iloscia i maja jedna regule\n");
{
  const fn = QUOTES.slice(QUOTES.indexOf("export async function updateQuote"));
  const glowa = fn.slice(0, fn.indexOf("export async function chooseQuoteOption"));
  ma(glowa, /line_grosze = \$\$\{wart\.length\}/, "zmiana ilosci przelicza wartosc pozycji");
  ma(glowa, /item\.unit_grosze \* qty/, "wartosc pozycji liczy sie z kwoty jednostkowej razy ilosc");
  ma(glowa, /status = 'new'/, "oferta bez wycenionych pozycji wraca do stanu nowego");
  ma(glowa, /no_contact/, "edycja nie pozwala zabrac naraz adresu i telefonu");
  // Kwota wpisuje sie teraz PRZY POZYCJI, a nie w drugim formularzu nizej.
  // Regula jej sprawdzania musi jednak zostac jedna, wspolna z wycenianiem:
  // dwie kopie rozjezdzaja sie przy pierwszej zmianie.
  ma(glowa, /kwotaJednostkowa\(poz\.unitGrosze\)/, "edycja zapisuje kwote jednostkowa pozycji");
  ma(QUOTES, /function kwotaJednostkowa[\s\S]{0,300}?bad_amount/, "kwota niedodatnia jest odrzucana w jednym miejscu");
  const wycenianie = QUOTES.slice(QUOTES.indexOf("export async function priceQuote"));
  ma(wycenianie.slice(0, 2000), /kwotaJednostkowa\(line\.unitGrosze\)/, "wycenianie uzywa tej samej reguly kwoty");
  // Dwa przypisania `line_grosze` w jednym zapisie znaczylyby wartosc pozycji
  // policzona ze STAREJ ceny razy nowa ilosc.
  ma(glowa, /poz\.unitGrosze === undefined/, "przy nowej kwocie wartosc pozycji nie liczy sie drugi raz ze starej");
  ma(glowa, /stan = quote\.status === "new" \? "priced" : quote\.status/, "pierwsza kwota czyni z zapytania oferte");
  ma(glowa, /validDays/, "termin waznosci da sie podac w dniach, bez wpisywania kwot od nowa");
}

console.log("\n4. Formularz panelu nie rozjezdza tablic\n");
{
  // Pole zaznaczane wysyla sie WYLACZNIE zaznaczone, wiec o usunieciu ani
  // o wyborze nie moze decydowac sama obecnosc pola w zadaniu.
  ma(WIDOK, /name="removeId" value="<%= it\.id %>"/, "krzyzyk niesie numer pozycji do usuniecia w wartosci");
  ma(WIDOK, /data-usun=/, "krzyzyk pyta o potwierdzenie przed usunieciem");
  ma(WIDOK, /window\.confirm\(b\.dataset\.usun\)/, "potwierdzenie usuniecia jest wpiete w skrypt widoku");
  ma(WIDOK, /data-edytuj/, "olowek otwiera pola pozycji");
  if (/name="itemAction"/.test(WIDOK)) zle("w wierszu pozycji zostala lista 'co zrobic', a mialy ja zastapic ikony");
  else ok("lista 'co zrobic' zniknela z wiersza pozycji");

  ma(WIDOK, /type="radio" name="pickGroup_<%= nrKarty\(it\) %>" value="<%= i %>"/, "przelacznik wariantu niesie numer wiersza w wartosci");
  ma(WIDOK, /type="checkbox" name="optionOn" value="<%= i %>"/, "pole dodatku niesie numer wiersza w wartosci");
  ma(WIDOK, /name="itemUnitPln"/, "kwota stoi przy pozycji, w tym samym formularzu");
  ma(WIDOK, /name="validDays"/, "waznosc oferty ustawia sie w tym samym formularzu");

  ma(PANEL, /String\(id\) === doUsuniecia/, "panel czyta usuwana pozycje z wartosci przycisku");
  ma(PANEL, /k === "optionOn" \|\| k\.startsWith\("pickGroup_"\)/, "panel zbiera zaznaczenia z obu rodzajow pol");
  ma(PANEL, /\[\]\.concat\(req\.body\.itemId \|\| \[\]\)/, "panel zbiera identyfikatory pozycji w tablice");
  // Kazde pole wiersza musi wysylac sie ZAWSZE, inaczej tablice po stronie
  // panelu przestaja do siebie pasowac.
  for (const pole of ["itemId", "itemTitle", "itemQty", "itemDescription", "itemUnitPln", "itemKind", "itemGroup"]) {
    const ile = (WIDOK.match(new RegExp(`name="${pole}"`, "g")) || []).length;
    if (ile === 1) ok(`pole ${pole} stoi w wierszu dokladnie raz`);
    else zle(`pole ${pole} stoi w wierszu ${ile} razy, tablice sie rozjada`);
  }
}

console.log("\n5. Uklad oferty: wariant z grupy, dodatek obok\n");
{
  const poz = (id, unit, extra = {}) => ({
    id, qty: 1, unit_grosze: unit, line_grosze: unit == null ? null : unit,
    kind: "fixed", group_key: null, selected: true, ...extra,
  });
  const w = (id, unit, grupa, wybrany) => poz(id, unit, { kind: "variant", group_key: grupa, selected: wybrany });
  const d = (id, unit, grupa, wybrany) => poz(id, unit, { kind: "option", group_key: grupa, selected: wybrany });
  const ids = (quote) => selectedQuoteItems(quote).map((i) => i.id);

  // Rachunek bez wyboru: wszystko wchodzi do kwoty.
  const rachunek = { items: [poz(1, 100_00), poz(2, 50_00)] };
  if (String(ids(rachunek)) === "1,2") ok("zwykla oferta liczy wszystkie pozycje");
  else zle("zwykla oferta gubi pozycje");
  if (quoteAmountGrosze(rachunek) === 150_00) ok("kwota zwyklej oferty to suma pozycji");
  else zle(`kwota zwyklej oferty wyszla ${quoteAmountGrosze(rachunek)}`);

  // Scenariusz wlasciciela: klucz 56 albo 68 mm, do tego opcjonalne polerowanie.
  const klucz = {
    items: [w(1, 40_00, "klucz", true), w(2, 45_00, "klucz", false), d(3, 30_00, "klucz", true)],
  };
  if (String(ids(klucz)) === "1,3") ok("z karty wchodzi jeden wariant i zaznaczony dodatek");
  else zle(`z karty weszlo ${ids(klucz)}`);
  if (quoteAmountGrosze(klucz) === 70_00) ok("kwota to wariant plus dodatek");
  else zle(`kwota karty wyszla ${quoteAmountGrosze(klucz)}`);

  const bezDodatku = { items: [w(1, 40_00, "klucz", true), w(2, 45_00, "klucz", false), d(3, 30_00, "klucz", false)] };
  if (quoteAmountGrosze(bezDodatku) === 40_00) ok("odznaczony dodatek nie wchodzi do kwoty");
  else zle(`odznaczony dodatek dolozyl sie do kwoty: ${quoteAmountGrosze(bezDodatku)}`);

  // Dwie karty naraz: pierscionek albo sygnet ORAZ figurka albo szkatulka.
  const dwieKarty = {
    items: [
      w(1, 800_00, "kruszec", false), w(2, 950_00, "kruszec", true),
      w(3, 120_00, "wydruk", true), w(4, 160_00, "wydruk", false),
    ],
  };
  if (String(ids(dwieKarty)) === "2,3") ok("kazda karta oddaje wlasny wariant");
  else zle(`dwie karty oddaly ${ids(dwieKarty)}`);
  if (quoteAmountGrosze(dwieKarty) === 1070_00) ok("kwota sumuje sie po kartach");
  else zle(`kwota dwoch kart wyszla ${quoteAmountGrosze(dwieKarty)}`);

  // Bez zaznaczenia karta nie moze zostac pusta, bo oferta stracilaby kwote.
  const bezZaznaczenia = { items: [w(1, null, "k", false), w(2, 45_00, "k", false)] };
  if (String(ids(bezZaznaczenia)) === "2") ok("bez zaznaczenia karta bierze pierwszy wyceniony wariant");
  else zle(`bez zaznaczenia karta oddala ${ids(bezZaznaczenia)}`);

  // Dodatek bez kwoty nie ma czego dolozyc.
  const dodatekBezKwoty = { items: [w(1, 40_00, "k", true), d(2, null, "k", true)] };
  if (String(ids(dodatekBezKwoty)) === "1") ok("dodatek bez kwoty nie wchodzi do rachunku");
  else zle("dodatek bez kwoty wszedl do rachunku");

  // Oferta wyslana przed ta zmiana: caly `pick_one`, wskazanie w naglowku.
  const stara = {
    pick_one: true, chosen_item_id: 9,
    items: [{ id: 7, qty: 1, unit_grosze: 850_00, line_grosze: 850_00 }, { id: 9, qty: 1, unit_grosze: 3200_00, line_grosze: 3200_00 }],
  };
  if (String(ids(stara)) === "9") ok("stara oferta wielowariantowa dalej oddaje wskazany wariant");
  else zle(`stara oferta oddala ${ids(stara)}`);
  const staraBezWskazania = { pick_one: true, chosen_item_id: null, items: stara.items };
  if (String(ids(staraBezWskazania)) === "7") ok("stara oferta bez wskazania bierze pierwszy wyceniony");
  else zle("stara oferta bez wskazania zostaje bez kwoty");
  const staraZwykla = { pick_one: false, items: stara.items };
  if (String(ids(staraZwykla)) === "7,9") ok("stara oferta zwykla dalej jest rachunkiem");
  else zle("stara oferta zwykla przestala byc rachunkiem");

  // Karty dla widoku: rachunek osobno, warianty i dodatki po grupach.
  const uklad = quoteGroups(klucz);
  if (!uklad.fixed.length && uklad.groups.length === 1 && uklad.groups[0].variants.length === 2 && uklad.groups[0].options.length === 1) {
    ok("uklad kart oddaje warianty i dodatki osobno");
  } else zle("uklad kart nie zgadza sie z pozycjami");

  // Sedno: do zamowienia i do rabatu idzie WYBRANY uklad, nie suma propozycji.
  ma(QUOTES, /const doZamowienia = selectedQuoteItems\(quote\)/, "do zamowienia trafia wylacznie wybrany uklad");
  ma(QUOTES, /no_variant/, "konwersja odmawia, gdy nie ma czego zamowic");
  ma(QUOTES, /const pozycje = selectedQuoteItems\(quote\)/, "rabat liczy sie od wybranego ukladu, nie od sumy propozycji");
  ma(SERWER, /doZaplaty = items[\s\S]{0,200}?filter\(\(i\) => i\.selected\)/, "strona oferty liczy kwote z pozycji wybranych");
}

console.log("\n6. Wybor po stronie klienta\n");
{
  const fn = QUOTES.slice(QUOTES.indexOf("export async function chooseQuoteOption"));
  const glowa = fn.slice(0, fn.indexOf("export async function deleteQuote"));
  for (const [wzor, opis] of [
    [/not_multi/, "odmawia wyboru przy pozycji, ktora jest skladnikiem rachunku"],
    [/unknown_item/, "sprawdza, czy pozycja nalezy do TEJ oferty"],
    [/not_priced/, "odmawia wyboru pozycji bez kwoty"],
    [/already_converted/, "odmawia zmiany po zlozeniu zamowienia"],
    [/SET selected = \(id = \$2\)/, "wybor wariantu gasi pozostale w tej samej grupie"],
    [/quoteAmountGrosze\(quote\)/, "kwote po wyborze liczy serwer, nie przegladarka"],
  ]) ma(glowa, wzor, `wybor klienta ${opis}`);

  const ile = (SERWER.match(/app\.post\("\/api\/quotes\/:ref\/choose"/g) || []).length;
  if (ile === 1) ok("trasa wyboru istnieje dokladnie raz");
  else zle(`tras wyboru jest ${ile}`);
  ma(SERWER, /app\.post\("\/api\/quotes\/:ref\/choose"[\s\S]{0,500}?secretMatches/, "wybor chroni token z linku");
  ma(SERWER, /req\.body\?\.selected === undefined \? true/, "brak pola 'selected' znaczy zaznaczenie");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nEdycja, uklad wyboru i usuwanie oferty: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
