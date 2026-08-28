// ============================================================
// PRZELACZNIK JEZYKA, KLIKNIETY NAPRAWDE
// ============================================================
// Prerender rysuje 300 stron, a przeglad w przegladarce je oglada. Obie siatki
// widza tylko to, co jest na ekranie od razu. Lista wyboru jezyka pojawia sie
// DOPIERO PO KLIKNIECIU, wiec przez dwa dni stala zepsuta przy zielonym
// buildzie i zielonym przegladzie: klikniecie wywalalo wyjatek w renderze,
// React odmontowywal cale drzewo i zostawal bialy ekran.
//
// Ten sprawdzian klika. Dla kazdego z trzech jezykow: otwiera przelacznik,
// sprawdza, ze strona nadal zyje, przechodzi do innego jezyka i sprawdza, ze
// trafil pod wlasciwy adres z wlasciwa trescia.
//
// Nie stoi w `npm run build`, bo build leci na Cloudflare Pages, gdzie nie ma
// przegladarki. Uruchamia sie recznie: `npm run check:jezyk`, po `npm run build`.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(KORZEN, "dist");

const TYPY = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".avif": "image/avif", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

// Serwer bez awaryjnego podawania index.html: martwy adres ma oddac 404,
// inaczej sprawdzian przeoczylby literowke w prefiksie jezyka.
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

// Skad startujemy i dokad przelaczamy. Trzy jezyki, trzy przejscia.
// Dwie szerokosci, bo pasek nawigacji ma dwie osobne kopie przelacznika:
// szeroka z `aria-haspopup`, waska z `aria-label`. Zepsucie jednej nie musi
// psuc drugiej, wiec obie trzeba kliknac.
const PROBY = [
  { z: "/studio/", na: "en", oczekiwany: "/en/studio/", szerokosc: 1280 },
  { z: "/en/studio/", na: "de", oczekiwany: "/de/studio/", szerokosc: 1280 },
  { z: "/de/studio/", na: "pl", oczekiwany: "/studio/", szerokosc: 1280 },
  { z: "/studio/", na: "de", oczekiwany: "/de/studio/", szerokosc: 390 },
  { z: "/de/studio/", na: "en", oczekiwany: "/en/studio/", szerokosc: 390 },
];

const przegladarka = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});
const usterki = [];

for (const proba of PROBY) {
  const komorka = proba.szerokosc < 900;
  const karta = await przegladarka.newPage({ viewport: { width: proba.szerokosc, height: komorka ? 844 : 900 } });
  const wyjatki = [];
  karta.on("pageerror", (e) => wyjatki.push(e.message));

  await karta.goto(BAZA + proba.z, { waitUntil: "networkidle" });
  await karta.waitForTimeout(600);

  const przelacznik = komorka
    ? karta.locator('button[aria-label="Change language"]').first()
    : karta.locator('button[aria-haspopup="listbox"]').first();
  await przelacznik.click();
  await karta.waitForTimeout(400);

  const tekstPoOtwarciu = await karta.evaluate(() => document.body.innerText.trim().length);
  if (tekstPoOtwarciu < 500) {
    usterki.push(`${proba.z} (${proba.szerokosc}px): po otwarciu przelacznika strona ma ${tekstPoOtwarciu} znakow tekstu (bialy ekran)`);
  }

  // Obie kopie listy stoja w drzewie jednoczesnie, widoczna jest jedna.
  const odnosnik = karta.locator(`a[hreflang="${proba.na}"]:visible`).first();
  if (!(await odnosnik.count())) {
    usterki.push(`${proba.z} (${proba.szerokosc}px): lista jezykow nie zawiera widocznego odnosnika do "${proba.na}"`);
    await karta.close();
    continue;
  }

  await odnosnik.click();
  await karta.waitForTimeout(1500);

  const stan = await karta.evaluate(() => ({
    sciezka: location.pathname,
    tekst: document.body.innerText.trim().length,
    jezykHtml: document.documentElement.lang,
  }));

  if (stan.sciezka !== proba.oczekiwany) {
    usterki.push(`${proba.z} -> ${proba.na}: adres ${stan.sciezka}, oczekiwano ${proba.oczekiwany}`);
  }
  if (stan.tekst < 500) {
    usterki.push(`${proba.z} -> ${proba.na}: strona ma ${stan.tekst} znakow tekstu (bialy ekran)`);
  }
  if (stan.jezykHtml !== proba.na) {
    usterki.push(`${proba.z} -> ${proba.na}: <html lang="${stan.jezykHtml}">, oczekiwano "${proba.na}"`);
  }
  if (wyjatki.length) {
    usterki.push(`${proba.z} -> ${proba.na}: wyjatek w przegladarce: ${wyjatki[0].slice(0, 120)}`);
  }

  if (!usterki.length || !usterki.at(-1).startsWith(proba.z)) {
    console.log(`  OK  ${proba.szerokosc}px  ${proba.z} -> ${proba.oczekiwany} (${stan.tekst} znakow, lang="${stan.jezykHtml}")`);
  }
  await karta.close();
}

await przegladarka.close();
serwer.close();

if (usterki.length) {
  console.error("\nPrzelacznik jezyka:");
  usterki.forEach((u) => console.error("  " + u));
  process.exit(1);
}
console.log(`Przelacznik jezyka: ${PROBY.length} przejsc, obie szerokosci, bez wyjatkow.`);
