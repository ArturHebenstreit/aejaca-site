// ============================================================
// KAZDA SPRAWA MA NUMER, I TO JEDEN
// ============================================================
// Zgloszenie z formularza dostawalo numer od poczatku, ale mail przyslany
// wprost na skrzynke juz nie, a numeru nie bylo widac ani w panelu, ani
// w potwierdzeniu do klienta. Skutek: wlasciciel odpisywal na zapytanie
// ofertowe, nie majac czego zacytowac, a wycena szla pod NOWYM oznaczeniem,
// wiec klient dostawal dwa numery, z ktorych jeden niczego nie otwieral.
//
// Ten sprawdzian pilnuje trzech rzeczy naraz:
//   1. kazda droga zakladajaca zgloszenie nadaje mu numer,
//   2. wycena ze zgloszenia PRZEJMUJE ten numer, zamiast losowac nowy,
//   3. panel ten numer pokazuje i pozwala jednym klikiem zrobic z niego ofertę.
//
// Czytamy zrodla, bo cala rzecz dzieje sie w zapytaniach do bazy i w szablonie,
// a bazy tu nie ma.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KATALOG = dirname(fileURLToPath(import.meta.url));
const ROOT = join(KATALOG, "..");
const server = readFileSync(join(KATALOG, "server.js"), "utf8");
const gmail = readFileSync(join(KATALOG, "gmail.js"), "utf8");
const quotes = readFileSync(join(KATALOG, "quotes.js"), "utf8");
const widok = readFileSync(join(ROOT, "admin", "views", "leads.ejs"), "utf8");
const panel = readFileSync(join(ROOT, "admin", "server.js"), "utf8");

// --- 1. Kazde zalozenie zgloszenia nadaje numer ---------------------------
// Szukamy WSZYSTKICH miejsc, ktore wstawiaja wiersz do `leads`, i wymagamy,
// zeby lista kolumn niosla `quote_ref`. Nowa droga zgloszen dopisana bez numeru
// zapali sie tutaj, a nie dopiero wtedy, gdy trzeba na nia odpisac.
for (const [nazwa, kod] of [["server.js", server], ["gmail.js", gmail]]) {
  const wstawki = [...kod.matchAll(/INSERT INTO leads\s*\(([^)]*)\)/g)];
  assert.ok(wstawki.length > 0, `${nazwa}: nie znalazlem zadnego zapisu zgloszenia`);
  for (const w of wstawki) {
    const kolumny = w[1].replace(/\s+/g, " ");
    assert.match(kolumny, /quote_ref/, `${nazwa}: zgloszenie zapisywane bez numeru (${kolumny.slice(0, 60)})`);
  }
}

// Mail od nieznanego nadawcy zaklada sprawe razem z trescia pierwszej
// wiadomosci. Sam temat nie wystarcza: po tygodniu nie wiadomo, o co pytal.
assert.match(gmail, /generateQuoteRef\(\)/, "mail przychodzacy nadaje numer sprawy");
assert.match(gmail, /INSERT INTO leads[\s\S]{0,200}description/, "tresc pierwszej wiadomosci zostaje w zgloszeniu");

// --- 2. Wycena przejmuje numer zgloszenia ---------------------------------
assert.match(quotes, /const quoteRef = input\.quoteRef \|\| generateQuoteRef\(\);/,
  "wycena umie przyjac gotowy numer");
assert.match(server, /app\.post\("\/api\/quotes\/from-lead"/, "jest trasa robiaca wycene ze zgloszenia");
assert.match(server, /quoteRef: lead\.quote_ref \|\| undefined/,
  "wycena ze zgloszenia idzie pod numerem zgloszenia");
assert.match(server, /SELECT quote_ref FROM quotes WHERE quote_ref = \$1/,
  "drugie klikniecie oddaje istniejaca wycene, zamiast zakladac blizniacza");
assert.match(server, /quote_ref = COALESCE\(quote_ref, \$2\)/,
  "zgloszenie sprzed numerow przejmuje numer swojej wyceny");
assert.match(server, /UPDATE leads SET status = 'quoted'/,
  "przepisane zgloszenie zmienia stan, zeby nie zrobic z niego drugiej oferty");

// --- 3. Zamowienie nosi numer sprawy z koncowka ---------------------------
// Jedna oferta rodzi wiele zamowien (ADR-0026), wiec sam numer sprawy nie
// wystarczy: bramka platnicza, rachunek i list przewozowy potrzebuja
// oznaczenia jednoznacznego. Stad koncowka, ktora mowi, ktora to zaplata.
{
  const q = readFileSync(join(KATALOG, "quotes.js"), "utf8");
  assert.match(q, /\$\{quote\.quote_ref\}-\$\{rows\[0\]\.ile \+ 1\}/,
    "numer zamowienia wyprowadza sie z numeru sprawy");
  assert.match(q, /order_ref = \$1 OR order_ref LIKE \$1 \|\| '-%'/,
    "koncowke liczymy z zamowien tej samej sprawy");
  // Liczenie stoi W TRANSAKCJI i PO zablokowaniu pozycji oferty. Odwrotna
  // kolejnosc znaczylaby, ze dwie rownolegle zaplaty z jednej oferty policza
  // te sama koncowke, a druga wstawka padnie na unikalnosci numeru.
  assert.ok(q.indexOf("BEGIN") < q.indexOf("const numerZamowienia"),
    "numer liczy sie w transakcji, a nie przed nia");
  assert.ok(q.indexOf("FOR UPDATE OF i") < q.indexOf("const numerZamowienia"),
    "numer liczy sie po zablokowaniu pozycji oferty");

  // Kolejna runda poprawek projektu to TO SAMO zlecenie, wiec nosi numer
  // rodzica, a nie nowy.
  assert.match(server, /const childRef = `\$\{order\.order_ref\}-R\$\{round\}`;/,
    "dodatkowa poprawka projektu nosi numer zamowienia z runda");

  // Zamowienie ze sklepu nie ma sprawy przed soba i zostaje przy wlasnym
  // numerze. To nie jest niekonsekwencja: nie bylo zgloszenia, ktore mialoby
  // przekazac numer.
  assert.match(server, /const orderRef = generateOrderRef\(\);/,
    "zamowienie prosto z koszyka ma wlasny numer");
}

// --- 4. Panel: numer widoczny i jedno klikniecie do oferty ----------------
assert.match(widok, /lead\.quote_ref/, "panel pokazuje numer sprawy");
assert.match(widok, /\/do-wyceny/, "panel ma przycisk robiacy wycene ze zgloszenia");
assert.match(widok, /lead\.status !== "quoted"/,
  "przy zgloszeniu juz przepisanym przycisku nie ma");
assert.match(panel, /app\.post\("\/leads\/:id\/do-wyceny"/, "trasa panelu istnieje");
assert.match(panel, /\/api\/quotes\/from-lead/, "panel wola backend, zamiast pisac do bazy po swojemu");

console.log("Numer sprawy: nadawany na kazdej drodze, przejmowany przez wycene, widoczny w panelu");
