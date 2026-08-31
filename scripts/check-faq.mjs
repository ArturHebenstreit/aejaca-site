// ============================================================
// WYSZUKIWARKA FAQ, WPISANA NAPRAWDE
// ============================================================
// Wyszukiwanie i filtry tematow dzialaja DOPIERO PO WPISANIU i PO KLIKNIECIU,
// wiec prerender ich nie widzi, a przeglad stron oglada tylko pierwszy ekran.
// Zepsute filtrowanie stalo by przy zielonym buildzie: lista po prostu
// pokazywalaby caly zbior i nikt by nie zauwazyl.
//
// Ten sprawdzian pisze w polu i klika w kafelki tematow. Sprawdza trzy rzeczy,
// ktorych zaden inny sprawdzian nie lapie: ze komplet naprawde jest kompletem,
// ze szukanie zawezi liste do sensownej garstki, i ze filtr tematu oddaje
// dokladnie tyle pytan, ile ten temat ma w danych.
//
// Nie stoi w `npm run build`, bo build leci na Cloudflare Pages, gdzie nie ma
// przegladarki. Uruchamia sie recznie: `npm run check:faq`, po `npm run build`.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { FAQ, FAQ_TEMATY } from "../src/data/faq/index.js";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(KORZEN, "dist");

const TYPY = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".avif": "image/avif", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

const serwer = createServer(async (req, res) => {
  const sciezka = decodeURIComponent(req.url.split("?")[0]);
  const kandydat = sciezka.endsWith("/") ? join(DIST, sciezka, "index.html") : join(DIST, sciezka);
  try {
    const dane = await readFile(kandydat);
    res.writeHead(200, { "Content-Type": TYPY[extname(kandydat)] || "application/octet-stream" });
    res.end(dane);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404");
  }
});
await new Promise((gotowe) => serwer.listen(0, "127.0.0.1", gotowe));
const BAZA = `http://127.0.0.1:${serwer.address().port}`;

const przegladarka = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});
const usterki = [];
const karta = await przegladarka.newPage({ viewport: { width: 1280, height: 900 } });
const wyjatki = [];
karta.on("pageerror", (e) => wyjatki.push(e.message));

const ilePytan = () => karta.locator('[id^="pytanie-"]').count();

await karta.goto(BAZA + "/faq/", { waitUntil: "networkidle" });
await karta.waitForTimeout(600);

// 1. Komplet. Sekcja wspolna ma pokazywac WSZYSTKIE pytania serwisu, takze te,
//    ktore mieszkaja przy bizuterii, przy sTuDiO i przy narzedziach.
const naStarcie = await ilePytan();
if (naStarcie !== FAQ.length) {
  usterki.push(`na starcie widac ${naStarcie} pytan, a zbior ma ${FAQ.length}`);
}

// 2. Szukanie zawęża. Slowo z jednej odpowiedzi nie moze zwrocic calosci.
const pole = karta.locator('input[type="search"]').first();
await pole.fill("paczkomat");
await karta.waitForTimeout(300);
const poSzukaniu = await ilePytan();
if (poSzukaniu === 0 || poSzukaniu >= naStarcie) {
  usterki.push(`szukanie "paczkomat" dalo ${poSzukaniu} pytan (przed szukaniem ${naStarcie})`);
}

// Ogonki nie moga decydowac o wyniku: nikt ich nie wpisuje w polu szukania.
await pole.fill("wysylka");
await karta.waitForTimeout(300);
const bezOgonkow = await ilePytan();
await pole.fill("wysyłka");
await karta.waitForTimeout(300);
const zOgonkami = await ilePytan();
if (bezOgonkow === 0 || bezOgonkow !== zOgonkami) {
  usterki.push(`"wysylka" dalo ${bezOgonkow}, a "wysyłka" ${zOgonkami}: ogonki zmieniaja wynik`);
}

await pole.fill("");
await karta.waitForTimeout(300);

// 3. Filtr tematu oddaje dokladnie tyle, ile ten temat ma w danych.
for (const temat of FAQ_TEMATY) {
  const oczekiwane = FAQ.filter((f) => f.temat === temat.id).length;
  const kafelek = karta.getByRole("button", { name: temat.label.pl, exact: true });
  if (!(await kafelek.count())) {
    usterki.push(`brak kafelka tematu "${temat.label.pl}"`);
    continue;
  }
  await kafelek.first().click();
  await karta.waitForTimeout(300);
  const widac = await ilePytan();
  if (widac !== oczekiwane) {
    usterki.push(`temat "${temat.label.pl}": widac ${widac} pytan, w danych jest ${oczekiwane}`);
  } else {
    console.log(`  OK  temat ${temat.label.pl.padEnd(16)} ${widac} pytan`);
  }
}

if (wyjatki.length) usterki.push(`wyjatek w przegladarce: ${wyjatki[0].slice(0, 160)}`);

await karta.close();
await przegladarka.close();
serwer.close();

if (usterki.length) {
  console.error("\nWyszukiwarka FAQ:");
  usterki.forEach((u) => console.error("  " + u));
  process.exit(1);
}
console.log(`Wyszukiwarka FAQ: ${FAQ.length} pytan, ${FAQ_TEMATY.length} tematow, szukanie zaweza, ogonki bez znaczenia.`);
