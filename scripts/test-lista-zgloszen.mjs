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
assert.match(panel, /app\.post\("\/leads\/:id\/edit"/, "jest zapis tego, co nasze");
assert.match(panel, /SET status = COALESCE\(\$2, status\)/, "zapis nie rusza tresci zapytania");

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
