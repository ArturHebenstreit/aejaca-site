// ============================================================
// LISTA ZGLOSZEN: LICZNIKI FILTRUJA, WIERSZ SIE ROZWIJA
// ============================================================
// Kafelki u gory strony byly ozdoba: mowily "Skontaktowano 36" i nic sie po
// nich nie dzialo. Tresc zapytania stala w komorce tabeli i rozpychala wiersz
// na pol ekranu, wiec lista przestawala byc lista. Wszystkie dzialania stoja
// teraz w rozwinieciu wiersza, w tym decyzja "zapytanie czy nie" razem
// z podpowiedzia automatu.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const czytaj = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const panel = czytaj("admin", "server.js");
const widok = czytaj("admin", "views", "leads.ejs");

// --- 1. Filtry z BIALEJ LISTY --------------------------------------------
// Warunek sklejony z parametru bylby wstrzyknieciem, i to takim, ktore
// przechodzi przez panel.
assert.match(panel, /const FILTRY = \{/, "filtry stoja na bialej liscie");
for (const f of ["wszystkie", "skontaktowane", "nowe", "bez_reakcji", "wycenione"]) {
  assert.match(panel, new RegExp(`\\n\\s*${f}:`), `panel zna filtr ${f}`);
}
assert.match(panel, /Object\.hasOwn\(FILTRY, String\(req\.query\.filtr \|\| ""\)\)/,
  "nieznany filtr wraca do domyslnego, zamiast trafiac do zapytania");
assert.match(panel, /const SORTY = \{/, "kolejnosc tez z bialej listy");
assert.match(panel, /ORDER BY \$\{SORTY\[sort\]\}/, "bo ORDER BY nie przyjmuje parametru wiazanego");

// Kalkulator idzie jako WARTOSC parametru, wiec nie potrzebuje bialej listy.
assert.match(panel, /warunki\.push\(`l\.calculator = \$\$\{parametry\.length\}`\)/,
  "zrodlo zgloszenia filtruje sie parametrem wiazanym");

// --- 2. Liczniki licza CALOSC, nie przefiltrowana liste -------------------
// Inaczej po kliknieciu w jeden kafelek reszta pokazywalaby zera i nie dalo by
// sie z nich wrocic.
assert.match(panel, /COUNT\(\*\) FILTER \(WHERE contacted_at IS NOT NULL\) as contacted[\s\S]{0,400}FROM leads`\)/,
  "liczniki kafelkow licza sie bez filtru");
assert.match(widok, /KAFELKI\.forEach/, "kafelki rysuja sie z jednej listy");
assert.match(widok, /<a href="<%= adresListy\(\{ filtr: k\.klucz \}\) %>"/,
  "kazdy kafelek jest odnosnikiem zawezajacym liste");
// Filtr, zrodlo i kolejnosc nie moga sie gubic nawzajem.
assert.match(widok, /const stan = \{ filtr, kalkulator, sort, \.\.\.zmiany \};/,
  "adres sklada sie ze stanu, a nie z jednego parametru");

// --- 3. Wiersz sie rozwija, tresc zostaje do czytania ---------------------
assert.match(widok, /data-otworz="<%= lead\.id %>"/, "wiersz otwiera sie klikniecem");
assert.match(widok, /data-edycja="<%= lead\.id %>" class="hidden/,
  "rozwiniecie stoi w HTML od poczatku, wiec bez skryptu widac cala liste");
assert.match(widok, /doOtwarcia/, "po zapisie wracamy do tego samego wiersza, otwartego");
// Tresc od klienta jest do CZYTANIA, nie do poprawiania: zapis tego, co
// powiedzial czlowiek, poprawiony przez nas przestaje byc dowodem.
assert.doesNotMatch(widok, /name="description"|name="email"/,
  "tresci i adresu z maila nie da sie edytowac");
// Tresc bierzemy Z POCZTY, gdy zgloszenie ja ma. Stara droga zapisywala
// w zgloszeniu sam temat, wiec w panelu stalo jedno zdanie, a cala wiadomosc
// lezala obok, w tabeli poczty, i nie dalo sie jej przeczytac.
assert.match(panel, /SELECT em\.body_text FROM email_messages em/,
  "lista siega po tresc wiadomosci, a nie tylko po opis zgloszenia");
assert.match(widok, /lead\.watek_tresc && lead\.watek_tresc\.trim\(\)/,
  "tresc z poczty wygrywa z krotkim opisem zapisanym przy zgloszeniu");

// --- 3b. Podglad i edycja to DWA tryby -----------------------------------
// W podgladzie pola sa wylaczone, zeby przewijanie dlugiego maila nie
// konczylo sie przypadkowa zmiana stanu sprawy. Olowek wlacza edycje, zapis
// i wycofanie z niej wychodza.
assert.match(widok, /data-tryb="podglad"/, "rozwiniecie otwiera sie do czytania");
assert.match(widok, /data-edytuj="<%= lead\.id %>"/, "olowek wlacza edycje");
assert.match(widok, /<textarea name="contactNote"[\s\S]{0,120}disabled/,
  "pola stoja wylaczone, dopoki nie wlaczysz edycji");
assert.match(widok, /pole\.disabled = !czy/, "edycja wlacza pola, a wyjscie z niej je wylacza");
assert.match(widok, /formularz\.reset\(\)/, "wycofanie przywraca zapisane wartosci");
assert.match(panel, /app\.post\("\/leads\/:id\/edit"/, "jest zapis tego, co nasze");
assert.match(panel, /SET status = COALESCE\(\$2, status\)/, "zapis nie rusza tresci zapytania");

// --- 3a. Data kontaktu wraca do pola ---------------------------------------
// `<input type="date">` przyjmuje WYLACZNIE "RRRR-MM-DD". Stala tam data po
// polsku, ktorej przegladarka nie odczytala, wiec pole wygladalo na puste mimo
// zapisanej daty, a nastepny zapis wysylal pusta wartosc i kasowal ja w bazie.
// Bledu nie bylo widac nigdzie: pole po prostu stalo puste.
assert.match(panel, /res\.locals\.dataPola = \(d\) =>/, "panel ma formater dla POLA daty");
assert.doesNotMatch(panel, /dataPola[\s\S]{0,300}toISOString/,
  "data do pola sklada sie z pol lokalnych, bo polnoc lokalna cofnelaby sie o dobe");
assert.match(widok, /value="<%= dataPola\(lead\.contacted_at\) %>"/,
  "pole daty kontaktu bierze wartosc w postaci, ktora przegladarka rozumie");
// Stan "skontaktowano" bez daty to dwa pola opisujace jeden fakt, mowiace co
// innego: licznik "bez reakcji" liczy po dacie, wiec zgloszenie zalatwione
// wisialoby dalej jako zaniedbane.
assert.match(panel, /\["contacted", "quoted", "closed"\]\.includes\(stan\) \? dzisiajISO\(\)/,
  "stan zalatwiony bez daty stempluje sie dniem dzisiejszym");

// --- 4. Decyzja o watku razem z podpowiedzia ------------------------------
assert.match(widok, /lead\.watek_sugestia/, "widac, co typuje automat");
assert.match(widok, /lead\.watek_tag === "unclassified" && lead\.watek_sugestia/,
  "podpowiedz znika, gdy decyzja zapadla");
assert.match(panel, /app\.post\("\/leads\/:id\/watek-tag"/, "decyzje da sie podjac z listy zgloszen");
assert.match(panel, /shopApi\(`\/api\/email-threads\//,
  "i idzie ta sama trasa co ze skrzynki, bo to ta sama decyzja");

// --- 5. Kazdy przycisk mowi, co robi --------------------------------------
// Panel obsluguje jedna osoba, raz na kilka dni. Przycisk bez opisu znaczy
// zgadywanie przy kazdym powrocie.
const przyciski = [...widok.matchAll(/<button\b((?:(?!<\/button>).)*?)<\/button>/gs)];
const bezOpisu = przyciski.filter((m) => !m[1].includes("data-dymek") && !m[1].includes("aria-label"));
assert.equal(bezOpisu.length, 0,
  `przyciski bez dymka: ${bezOpisu.map((m) => m[1].slice(0, 40)).join(" | ")}`);

console.log("Lista zgloszen: kafelki filtruja, wiersz sie rozwija, kazdy przycisk mowi, co robi");
