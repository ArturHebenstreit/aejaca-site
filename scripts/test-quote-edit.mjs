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
  // Zapis idzie na poziomie rekordu: pozycja i naglowek maja po jednej trasie.
  // Trzecia droga do kwot znaczylaby trzecia regule ich sprawdzania.
  const trasyZapisu = (PANEL.match(/app\.post\("\/quotes\/:ref\/(item|header)"/g) || []).length;
  if (trasyZapisu === 2) ok("panel zapisuje wycene dwiema trasami: pozycja i naglowek");
  else zle(`tras zapisu wyceny w panelu jest ${trasyZapisu}`);
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
  ma(glowa, /swiezoZaznaczone/, "zaznaczenie z biezacego zapisu wygrywa z zastanym");
}

console.log("\n4. Zapis na poziomie rekordu, bez przycisku zapisz\n");
{
  // Rekord to jedna pozycja albo naglowek oferty. Olowek otwiera, zielony
  // ptaszek wysyla do bazy. Zapis po kazdym znaku wkladalby do bazy stany
  // niedokonczone ("Wydruk klu", cena 4 grosze), a przy ofercie juz wyslanej
  // widzialby je klient na swojej stronie.
  ma(WIDOK, /data-rekord="naglowek"/, "naglowek oferty jest osobnym rekordem");
  ma(WIDOK, /data-rekord="pozycja" data-id="<%= it\.id %>"/, "kazda pozycja jest rekordem z wlasnym identyfikatorem");
  ma(WIDOK, /data-edytuj/, "olowek otwiera rekord do edycji");
  ma(WIDOK, /data-zapisz disabled/, "ptaszek jest nieczynny, dopoki rekord nie jest otwarty");
  ma(WIDOK, /data-anuluj hidden/, "odrzucenie zmian pokazuje sie dopiero przy edycji");
  ma(WIDOK, /data-dodaj/, "pozycje dodaje sie przyciskiem, a nie pustym wierszem na zapas");

  // Stary formularz wysylal wszystkie pozycje naraz w tablicach i to z niego
  // brala sie awaria "znika nie ten wiersz". Tablic juz nie ma.
  if (/name="itemId"/.test(WIDOK)) zle("w widoku zostaly tablice formularza, wrocila awaria rozjezdzajacych sie indeksow");
  else ok("w widoku nie ma juz tablic formularza");
  if (/Zapisz ofertę|Zapisz kwoty/.test(WIDOK)) zle("w widoku zostal przycisk zbiorczego zapisu");
  else ok("nie ma przycisku zbiorczego zapisu");

  // W trakcie edycji dziala wylacznie ptaszek: krzyzyk gasnie, zeby nie dalo
  // sie skasowac wiersza w polowie wpisywania.
  ma(WIDOK, /przyciski\.usun\.disabled = edycja/, "krzyzyk gasnie na czas edycji");
  ma(WIDOK, /przyciski\.edytuj\.disabled = edycja/, "olowek gasnie na czas edycji");
  ma(WIDOK, /przyciski\.zapisz\.disabled = !edycja/, "ptaszek zapala sie na czas edycji");
  ma(WIDOK, /window\.confirm\(/, "krzyzyk pyta o potwierdzenie przed usunieciem");
  ma(WIDOK, /beforeunload/, "wyjscie ze strony w trakcie edycji ostrzega");

  // Klikniecie w kolko albo kwadracik JEST cala decyzja, wiec idzie do bazy
  // od razu. Odpowiedz serwera przepisuje stan wszystkich wierszy, bo to on
  // gasi pozostale warianty w grupie.
  ma(WIDOK, /data-wybor/, "wybor domyslny ma wlasna kontrolke w wierszu");
  ma(WIDOK, /zapiszWybor/, "klikniecie w wybor zapisuje sie od razu");

  // Zapis jednej pozycji potrafi przestawic inne: wybor wariantu gasi pozostale
  // w grupie, a zmiana rodzaju odbiera pozycji prawo do zaznaczenia. Bez
  // przerysowania z odpowiedzi ekran pokazywal stan sprzed zapisu az do F5.
  ma(WIDOK, /function odswiezWiersze\(pozycje\)/, "wiersze przerysowuja sie z odpowiedzi serwera");
  ma(WIDOK, /function ustawKontrolke\(rekord, poz\)/, "kontrolka wyboru zmienia sie razem z rodzajem pozycji");
  ma(WIDOK, /data-wybor-miejsce/, "kontrolka wyboru ma miejsce, ktore da sie wymienic");
  ma(WIDOK, /if \(!rekord\.dataset\.edycja\)/, "przerysowanie nie nadpisuje wiersza otwartego do edycji");
  // Nazwa przelacznika po obu stronach musi powstawac z tej samej reguly,
  // inaczej po pierwszym zapisie polowa grupy przestaje sie wykluczac.
  ma(WIDOK, /const nazwaGrupy = \(it\) => "pickGroup_"/, "szablon liczy nazwe grupy z jej nazwy");
  ma(WIDOK, /function nazwaGrupy\(klucz\)/, "skrypt liczy nazwe grupy z tej samej reguly");
  ma(WIDOK, /data-podpowiedzi-grup/, "grupy z innych pozycji stoja przy polu do klikniecia");
  ma(WIDOK, /function odswiezGrupy\(pozycje\)/, "lista grup odswieza sie po zapisie");

  // Nowa pozycja trafia do bazy dopiero po zatwierdzeniu, inaczej kazde
  // omylkowe klikniecie zostawialoby wiersz bez nazwy i bez kwoty.
  ma(WIDOK, /nowy\.removeAttribute\("data-id"\)/, "nowa pozycja nie ma identyfikatora, dopoki nie zostanie zapisana");
  ma(WIDOK, /rekord\.dataset\.id = dane\.items\[dane\.items\.length - 1\]\.id/, "zapisana pozycja dostaje identyfikator, wiec drugi zapis ja poprawia");

  // Trasy panelu: JSON, bo wola je strona, a nie formularz.
  for (const [wzor, nazwa] of [
    [/app\.post\("\/quotes\/:ref\/item"/g, "POST /quotes/:ref/item"],
    [/app\.post\("\/quotes\/:ref\/header"/g, "POST /quotes/:ref/header"],
  ]) {
    const ile = (PANEL.match(wzor) || []).length;
    if (ile === 1) ok(`${nazwa}: dokladnie jedna trasa`);
    else zle(`${nazwa}: tras jest ${ile}`);
  }
  ma(PANEL, /app\.post\("\/quotes\/:ref\/item", requireAuth/, "zapis pozycji wymaga zalogowanego pracownika");
  ma(PANEL, /app\.post\("\/quotes\/:ref\/header", requireAuth/, "zapis naglowka wymaga zalogowanego pracownika");
  // Pole pominiete w zadaniu ma zostac nietkniete: zapis jednego przelacznika
  // nie moze skasowac opisu, ktorego to zadanie nie nioslo.
  ma(PANEL, /if \(poz\.title !== undefined\) item\.title = poz\.title/, "zapis pozycji rusza wylacznie pola, ktore przyszly");
  ma(PANEL, /if \(b\.validUntil !== undefined\) patch\.validUntil = b\.validUntil/, "zapis naglowka rusza wylacznie pola, ktore przyszly");
  if (/app\.post\("\/quotes\/:ref\/edit"/.test(PANEL)) zle("zostala stara trasa zbiorczego zapisu, sa wiec dwie drogi do kwot");
  else ok("do zapisu wyceny prowadzi jedna droga");
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

console.log("\n7. Wersje panelu i backendu widac z ekranu\n");
{
  const NAGLOWEK = readFileSync(join(ROOT, "admin", "views", "partials", "header.ejs"), "utf8");
  const WERSJA = readFileSync(join(ROOT, "admin", "wersja.js"), "utf8");
  // Panel i backend sklepu wdrazaja sie osobno. Nowy formularz rozmawiajacy ze
  // starym backendem gubi pola po cichu i wyglada to jak blad w kodzie.
  ma(WERSJA, /export const PANEL_WERSJA = "\d+\.\d+\.\d+"/, "panel zna swoja wersje");
  ma(SERWER, /const WERSJA_API = "\d+\.\d+\.\d+"/, "backend sklepu zna swoja wersje");
  const ile = (SERWER.match(/app\.get\("\/api\/version"/g) || []).length;
  if (ile === 1) ok("trasa wersji istnieje dokladnie raz");
  else zle(`tras wersji jest ${ile}`);
  ma(SERWER, /app\.get\("\/api\/version"[\s\S]{0,200}?requireAdmin\(req, res\)/, "wersja backendu nie wychodzi na zewnatrz bez tokenu");
  ma(SERWER, /quoteItemKinds/, "backend mowi, czy baza ma juz kolumny wyboru");
  ma(PANEL, /res\.locals\.wersjaPanelu/, "panel podaje wersje kazdemu widokowi");
  ma(PANEL, /res\.locals\.ostrzezenieWersji/, "panel podaje ostrzezenie o rozjezdzie wersji");
  ma(NAGLOWEK, /wersjaPanelu/, "naglowek pokazuje wersje panelu");
  ma(NAGLOWEK, /api v/, "naglowek pokazuje wersje backendu sklepu");
  // Zapytanie o wersje nie moze wstrzymywac strony panelu ani jej wywalac,
  // gdy backend sklepu nie odpowiada.
  ma(PANEL, /shopApi\("\/api\/version"\)[\s\S]{0,900}?\.catch\(/, "brak odpowiedzi backendu nie wywala panelu");
  if (/await shopApi\("\/api\/version"\)/.test(PANEL)) zle("panel czeka na wersje backendu przy kazdym zadaniu");
  else ok("wersja backendu odswieza sie w tle");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nEdycja, uklad wyboru i usuwanie oferty: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
