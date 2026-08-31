// ============================================================
// WLASNY RUCH: WIDAC GO, DA SIE GO WYLACZYC, I NIKT NIE UDAJE, ZE WIE WIECEJ
// ============================================================
// Wlasciciel oglada swoj serwis czesciej niz ktokolwiek inny, wiec jego wejscia
// zawyzaja kazdy wykres. Wyklucza je znacznik, ktory stawia sobie sam. Rzecz
// ma jedna pulapke: stan "nie liczymy tej przegladarki" wyglada dokladnie tak
// samo jak "znacznik sie nie zapisal" i jak "to inna przegladarka". Dlatego
// stan musi byc WIDOCZNY, i to tam, gdzie naprawde da sie go odczytac.
//
// Panel stoi pod innym adresem niz serwis, wiec pamieci przegladarki
// z aejaca.com nie odczyta. Ten sprawdzian pilnuje, zeby panel nie zaczal tego
// udawac, a serwis nie przestal pokazywac.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const czytaj = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const licznik = czytaj("src", "utils", "analytics.js");
const plakietka = czytaj("src", "components", "ZnacznikRuchu.jsx");
const uklad = czytaj("src", "components", "Layout.jsx");
const pulpit = czytaj("admin", "views", "dashboard.ejs");
const panel = czytaj("admin", "server.js");

// --- 1. Znacznik da sie odczytac i przestawic z kodu ----------------------
assert.match(licznik, /export function stanLiczenia\(\)/, "licznik umie powiedziec, czy liczy");
assert.match(licznik, /export function ustawLiczenie\(licz\)/, "licznik umie przestawic liczenie");
// Trzeci stan nazwany wprost. Bez niego tryb prywatny wyglada jak "liczony"
// i wlasciciel klika w kolko, nie widzac zadnego skutku.
assert.match(licznik, /"niedostepny"/, "pamiec zablokowana jest osobnym stanem, a nie udawanym liczeniem");

// --- 2. Parametr z adresu dziala RAZ --------------------------------------
// Zostawiony w adresie odwracalby kazde pozniejsze klikniecie w plakietce, bo
// znacznik ustala sie przy kazdej odslonie strony.
assert.match(licznik, /history\.replaceState/, "parametr nolicz znika z adresu, gdy zadziala");
assert.match(licznik, /export function zadanoPrzelaczenia\(\)/,
  "plakietka pyta licznik o przelaczenie, bo w adresie parametru juz nie ma");

// --- 3. Plakietka stoi w serwisie i milczy dla zwyklego odwiedzajacego ----
assert.match(uklad, /<ZnacznikRuchu \/>/, "plakietka jest wpieta w uklad strony");
assert.match(plakietka, /if \(!stan \|\| schowana\) return null;/,
  "bez znacznika i bez parametru plakietka nie rysuje niczego");
for (const jezyk of ["pl", "en", "de"]) {
  assert.match(plakietka, new RegExp(`\\n  ${jezyk}: \\{`), `plakietka ma tekst w jezyku ${jezyk}`);
}

// --- 4. Panel nie udaje, ze zna stan znacznika ----------------------------
// Pamiec przegladarki nalezy do adresu aejaca.com, a panel stoi pod innym.
// Ramka tez by nie pomogla: przegladarki dziela pamiec osobno dla kazdej
// strony nadrzednej, wiec ramka widzialaby pusta polke i pokazywala "liczony"
// nawet dla oznaczonego urzadzenia. Falszywa lampka jest gorsza od zadnej.
assert.doesNotMatch(pulpit, /aejaca_nolicz|localStorage/,
  "pulpit panelu nie probuje czytac znacznika z cudzej pamieci");
assert.match(pulpit, /\/\?nolicz=1/, "pulpit otwiera serwis z wylaczeniem liczenia");
assert.match(pulpit, /\/\?nolicz=0/, "pulpit otwiera serwis z powrotem do liczenia");
assert.match(panel, /COUNT\(\*\) FILTER \(WHERE ts >= NOW\(\) - INTERVAL '7 days'\) AS zdarzenia_7d/,
  "pulpit pokazuje dowod ze skutku: ile oznaczonych zdarzen przyszlo");

// --- 5. Skrot analityki liczy to samo, co pelna analityka -----------------
// Dwie liczby pod jedna nazwa, rozne o wejscia wlasciciela, byly by gorsze niz
// brak skrotu: nie wiadomo, ktorej wierzyc.
const skrot = panel.slice(panel.indexOf("AS visitors_today"), panel.indexOf("AS zdarzenia_7d"));
assert.match(skrot, /FROM events WHERE NOT COALESCE\(internal, FALSE\)/,
  "skrot analityki na pulpicie pomija wlasny ruch");
assert.match(skrot, /AND NOT COALESCE\(internal, FALSE\)/,
  "najczestsza strona dnia tez liczy sie bez wlasnego ruchu");

console.log("Wlasny ruch: plakietka w serwisie, dowod w panelu, skrot bez wlasnych wejsc");
