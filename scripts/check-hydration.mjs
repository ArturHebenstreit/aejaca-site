#!/usr/bin/env node
// ============================================================
// HYDRATACJA: CZY PRERENDER JEST W OGOLE UZYWANY
// ============================================================
// Bledy React #418 i #423 w konsoli nie sa kosmetyka. Znacza: hydratacja
// sie nie powiodla, wiec React wyrzucil gotowy HTML z prerenderu i narysowal
// cala strone od nowa. Roboty wyszukiwarek nadal widza tresc, strona dziala,
// wiec nic nie wyglada na zepsute, a prerender przestaje sluzyc ludziom.
//
// TO NIE JEST CZESC BUILDA. Wymaga zbudowanego `dist/`, serwera statycznego
// i przegladarki, wiec uruchamia sie recznie przy pracy nad tym tematem.
//
//   npm run build
//   npx serve -s dist -l 4173 &
//   node scripts/check-hydration.mjs                 lista stron i ich bledy
//   node scripts/check-hydration.mjs --diff /contact/  porownanie drzew
//
// Do CZYTELNYCH komunikatow (zamiast "Minified React error #418") potrzebna
// jest rozwojowa wersja Reacta. Wystarczy zbudowac klienta i serwer z wlasna
// konfiguracja nadpisujaca `process.env.NODE_ENV` na "development" i wylaczajaca
// minifikacje, a potem uruchomic `node scripts/prerender.mjs`.
//
// UWAGA: `prerender.mjs` czyta szablon z `dist/index.html`, ktory sam potem
// nadpisuje. Uruchomiony BEZ wczesniejszego `vite build` pracuje na wlasnym
// poprzednim wyniku i pokazuje nieaktualny HTML. To juz raz dalo falszywie
// zielony wynik, wiec zawsze buduj klienta przed prerenderem.

import { readFileSync } from "node:fs";

const BASE = process.env.HYD_BASE || "http://localhost:4173";
const PAGES = [
  "/", "/jewelry/", "/studio/", "/blog/", "/shop/", "/contact/", "/terms/",
  "/toolstudio/printability/", "/toolsjewelry/metal-pricing/", "/quote/",
  "/cart/", "/b2b/", "/about/", "/glossary/", "/reviews/", "/toolstudio/",
];

const { chromium } = await import("playwright");

const diffAt = process.argv.indexOf("--diff");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });

if (diffAt !== -1) {
  // ------------------------------------------------------------
  // Porownanie drzew: serwerowy HTML kontra to, co rysuje przegladarka
  // ------------------------------------------------------------
  // Porownujemy WYLACZNIE ciag znacznikow. Teksty i komentarze serializuja
  // sie inaczej po obu stronach (SSR rozdziela sasiadujace teksty
  // komentarzem <!-- -->), wiec porownanie znak po znaku pokazuje tuziny
  // roznic, z ktorych zadna nie ma znaczenia dla hydratacji.
  const route = process.argv[diffAt + 1] || "/";
  const file = route === "/" ? "dist/index.html" : `dist${route}index.html`;

  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, locale: "pl-PL" });
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const client = await page.evaluate(() => document.getElementById("root").innerHTML);
  await browser.close();

  const html = readFileSync(file, "utf8");
  const from = html.indexOf('<div id="root">') + '<div id="root">'.length;
  const to = html.lastIndexOf("</div>", html.indexOf("<script", from));
  const server = html.slice(from, to);

  const tags = (src) => [...src.matchAll(/<\/?([a-zA-Z][\w-]*)/g)].map((m) => m[0]);
  const a = tags(server), c = tags(client);
  let i = 0;
  while (i < a.length && i < c.length && a[i] === c[i]) i++;

  console.log(`${route}: serwer ${a.length} znacznikow, klient ${c.length}`);
  if (i === a.length && i === c.length) {
    console.log("Drzewa koncowe sa IDENTYCZNE.");
    console.log("Czyli niezgodnosc jest przejsciowa: pojawia sie w pierwszym");
    console.log("renderze klienta i znika po efektach. Szukaj stanu, ktory");
    console.log("startuje inaczej i dopiero efekt ustawia go na wartosc serwera.");
  } else {
    console.log(`Pierwsza roznica na znaczniku ${i}`);
    console.log("kontekst: " + a.slice(Math.max(0, i - 15), i).join(" "));
    console.log("SERWER:   " + a.slice(i, i + 25).join(" "));
    console.log("KLIENT:   " + c.slice(i, i + 25).join(" "));
  }
  process.exit(0);
}

// ------------------------------------------------------------
// Przeglad: ktore strony zglaszaja niezgodnosc
// ------------------------------------------------------------
let bad = 0;
for (const route of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, locale: "pl-PL" });
  const errs = [];
  // Ostrzezenie z rozwojowego Reacta niesie stos komponentow i to ono mowi,
  // gdzie szukac. Wersja produkcyjna daje tylko numer bledu.
  // WERSJA PRODUKCYJNA MOWI SAMYM NUMEREM. Przez dlugi czas bylo tu tylko
  // dopasowanie do zdan rozwojowego Reacta, wiec narzedzie pokazywalo
  // "kazda strona hydratuje sie czysto" na buildzie, ktory w rzeczywistosci
  // zglaszal #418 i #421 na kazdym wejsciu. Falszywie zielone narzedzie
  // diagnostyczne jest gorsze niz jego brak, bo zamyka temat.
  page.on("console", (m) => {
    if (m.type() === "error" && /Expected server HTML|did not match|Text content|Minified React error #\d+|Hydration failed/.test(m.text())) {
      errs.push(m.text().split("\n").slice(0, 6).join("\n      "));
    }
  });
  page.on("pageerror", (e) => errs.push(e.message.match(/#\d+|Hydration failed[^.]*/)?.[0] || e.message.slice(0, 60)));
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
  } catch (e) {
    errs.push("nie udalo sie otworzyc: " + e.message.slice(0, 60));
  }
  await page.close();

  const unique = [...new Set(errs)];
  if (unique.length) {
    bad++;
    console.log(`\n### ${route}`);
    for (const m of unique.slice(0, 4)) console.log("      " + m);
  } else {
    console.log(`  ok  ${route}`);
  }
}
await browser.close();

console.log(bad ? `\n${bad}/${PAGES.length} stron odrzuca prerender` : "\nKazda strona hydratuje sie czysto");
process.exit(bad ? 1 : 0);
