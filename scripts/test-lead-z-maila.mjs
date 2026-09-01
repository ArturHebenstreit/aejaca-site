// ============================================================
// MAIL STAJE SIE SPRAWA DOPIERO Z NASZEJ DECYZJI
// ============================================================
// Do 1 wrzesnia 2026 dzialaly tu dwa mechanizmy naraz i zaden nie robil tego,
// co trzeba. Mail od nieznanego nadawcy zakladal sprawe z NUMEREM sam, bez
// zadnego sprawdzenia, wiec numer sprawy dostawal newsletter, faktura od
// dostawcy i oferta pozycjonowania. Rownolegle panel mial przyciski
// "Lead / Nie lead / Spam", ktore zmienialy wylacznie kolor plakietki.
// Decyzja zapadala wiec za wlasciciela, a jego wlasna decyzja nie znaczyla nic.
//
// Osobno: zgloszenie, z ktorego zrobiono oferte, zostawalo na stanie "quoted"
// takze po SKASOWANIU tej oferty. Przycisk "Zrob wycene" patrzyl na to pole,
// wiec zgloszenie ladowalo w slepym zaulku: oferty juz nie ma, a przycisku do
// zrobienia nowej tez nie ma.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const czytaj = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const gmail = czytaj("chat-api", "gmail.js");
const serwer = czytaj("chat-api", "server.js");
const quotes = czytaj("chat-api", "quotes.js");
const panel = czytaj("admin", "server.js");
const widokZgloszen = czytaj("admin", "views", "leads.ejs");
const widokPoczty = czytaj("admin", "views", "email-threads.ejs");

// --- 1. Poczta nie zaklada sprawy sama ------------------------------------
// Zapis do `leads` w gmail.js znaczylby powrot do nadawania numerow poczcie
// przychodzacej, czyli takze reklamie.
assert.doesNotMatch(gmail, /INSERT INTO leads/,
  "poczta przychodzaca nie zaklada juz sprawy sama");
assert.match(gmail, /SELECT id FROM leads WHERE email = \$1/,
  "mail od znanego adresu nadal podpina sie do jego sprawy");

// --- 2. Decyzja zaklada sprawe z numerem ----------------------------------
assert.match(serwer, /app\.post\("\/api\/email-threads\/:id\/tag"/,
  "jest trasa rozstrzygajaca o watku");
assert.match(serwer, /tag === "lead" && !leadId/,
  "sprawe zaklada wylacznie uznanie watku za zapytanie");
assert.match(serwer, /INSERT INTO leads[\s\S]{0,300}generateQuoteRef\(\)/,
  "sprawa z watku dostaje numer");
// Numer nadaje WYLACZNIE chat-api (ADR-0032). Panel piszacy po swojemu byl by
// drugim generatorem numerow, a dwa generatory jednego formatu rozjezdzaja sie
// po cichu, bo oba dzialaja.
assert.match(panel, /shopApi\(`\/api\/email-threads\/\$\{encodeURIComponent\(req\.params\.id\)\}\/tag`/,
  "panel wola API, zamiast pisac do bazy po swojemu");
assert.doesNotMatch(panel, /UPDATE email_threads SET tag/,
  "panel nie przestawia znacznika z pominieciem API");

// Tresc pierwszej wiadomosci PRZYCHODZACEJ, bo to ona jest zapytaniem.
// Nasza wlasna odpowiedz w tym samym watku nie jest niczyim pytaniem.
assert.match(serwer, /direction = 'inbound'\s*\n\s*ORDER BY received_at ASC LIMIT 1/,
  "sprawa bierze tresc z pierwszej wiadomosci przychodzacej");
// Ten sam klient piszacy drugi raz to ta sama sprawa, a nie nowa.
assert.match(serwer, /SELECT id, quote_ref FROM leads WHERE email = \$1 ORDER BY created_at DESC LIMIT 1/,
  "watek od adresu, ktory sprawe ma, podpina sie do niej");

// --- 3. Skasowanie oferty otwiera droge do nastepnej ----------------------
assert.match(quotes, /UPDATE leads SET status = 'new' WHERE quote_ref = \$1 AND status = 'quoted'/,
  "skasowanie oferty cofa zgloszenie do stanu sprzed niej");
// Przycisk pyta o ISTNIENIE oferty, a nie o zapamietane pole. Stan wyliczalny
// trzymany osobno rozjezdza sie z rzeczywistoscia przy pierwszej zmianie.
assert.match(panel, /EXISTS \(\s*\n?\s*SELECT 1 FROM quotes q WHERE q\.quote_ref = l\.quote_ref/,
  "panel liczy, czy oferta istnieje");
assert.match(widokZgloszen, /if \(!lead\.ma_wycene\)/,
  "przycisk zalezy od istnienia oferty");
assert.doesNotMatch(widokZgloszen, /lead\.status !== "quoted"/,
  "przycisk nie patrzy juz na zapamietane pole");

// --- 4. Numer widac tam, gdzie sie odpisuje -------------------------------
assert.match(widokPoczty, /thread\.lead_ref/, "lista watkow pokazuje numer sprawy");
assert.match(widokPoczty, /wynik\.zalozono && wynik\.quoteRef/,
  "po zalozeniu sprawy lista odswieza sie, zeby numer byl widoczny od razu");

console.log("Lead z maila: numer nadaje decyzja, a skasowanie oferty otwiera droge do nastepnej");
