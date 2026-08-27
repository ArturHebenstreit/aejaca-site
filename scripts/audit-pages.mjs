#!/usr/bin/env node
// ============================================================
// PRZEGLAD CALEGO SERWISU W PRAWDZIWEJ PRZEGLADARCE
// ============================================================
// Sprawdza KAZDA prerenderowana strone, nie probke. Powstal dlatego, ze
// przy audycie otworzylem dwanascie stron dobranych "reprezentatywnie" i
// wlasciciel slusznie zapytal, czemu dwanascie, skoro w przegladarce widac
// dziewiecdziesiat kilka. Probka opisuje probke. Zeby powiedziec cokolwiek
// o serwisie, trzeba przejsc serwis.
//
// Lapie rzeczy, ktorych zaden test tekstowy nie zobaczy, bo powstaja dopiero
// po uruchomieniu strony:
//
//   1. Obrazy, ktore sie nie wczytuja. Sciezka w kodzie moze byc poprawna,
//      a plik nie istniec albo byc uszkodzony.
//   2. Brakujace `alt`. Grep po `<img` bez `alt=` klamie przy wieloliniowym
//      JSX; przegladarka zna prawde, bo widzi gotowy atrybut.
//   3. Bledy hydracji (React #418, #422, #425). Znacza, ze prerender zostal
//      wyrzucony i strona narysowana od nowa. Nic nie wyglada na zepsute.
//   4. Poziome przewijanie na telefonie. Widac wylacznie przy realnej
//      szerokosci okna.
//   5. Napisy ponizej 12 pikseli i przyciski bez dostepnej nazwy.
//
// TO NIE JEST CZESC BUILDA. Wymaga zbudowanego `dist/`, serwera statycznego
// i przegladarki, wiec uruchamia sie recznie. Przejscie stu stron trwa
// kilkanascie minut.
//
//   npm run build
//   (cd dist && python3 -m http.server 4173) &
//   node scripts/audit-pages.mjs                 wszystkie strony z dist/
//   node scripts/audit-pages.mjs /shop/ /studio/  tylko wskazane
//
// SERWER NIE MOZE MIEC REGULY LAPIACEJ WSZYSTKO. `npx serve -s dist` ma ja
// domyslnie (`-s` znaczy "single page application") i oddaje `index.html` pod
// KAZDYM adresem. Pomiar idzie wtedy po stronie glownej sto razy, a React
// hydruje strone glowna w router, ktory rysuje inna trase, wiec rozjazd jest
// gwarantowany przez serwer, nie przez serwis. Kosztowalo mnie to falszywy
// wniosek "hydracja pada na kazdej stronie" wpisany do raportu dla wlasciciela,
// dlatego skrypt sprawdza to teraz sam i odmawia startu. Produkcja tej reguly
// nie ma, co `public/_redirects` mowi wprost.
//
// W srodowisku zdalnym obce hosty (fonty Google, opinie) nie odpowiadaja i
// kazde zadanie wisi kilkanascie sekund, wiec skrypt je odcina. Nie zmienia
// to niczego w tym, co mierzy: obce zasoby nie wplywaja na obrazy, `alt`,
// hydracje ani szerokosc dokumentu.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.AUDIT_BASE || "http://localhost:4173";
const EXE = process.env.PW_EXECUTABLE_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PROG_MIN_PX = 12;

/** Trasy bierzemy z prerenderu, bo to on jest lista stron, ktore naprawde stoja. */
function trasyZDist(katalog = "dist", prefiks = "") {
  const out = [];
  for (const wpis of readdirSync(katalog)) {
    const p = join(katalog, wpis);
    if (wpis === "index.html") out.push(prefiks + "/");
    else if (statSync(p).isDirectory() && wpis !== "assets") out.push(...trasyZDist(p, prefiks + "/" + wpis));
  }
  return [...new Set(out)].sort();
}

const trasy = process.argv.slice(2).length ? process.argv.slice(2) : trasyZDist();

/**
 * Adres, ktory na pewno nie istnieje. Serwer bez reguly lapiacej wszystko odda
 * na to 404. Serwer z ta regula odda 200 i strone glowna, czyli dokladnie to,
 * co unieważnia caly pomiar.
 */
const NIEISTNIEJACY = "/__audyt-sprawdza-serwer-" + trasy.length + "/";
const proba = await fetch(BASE + NIEISTNIEJACY).catch(() => null);
if (!proba) {
  console.error(`Nie ma serwera pod ${BASE}. Uruchom: (cd dist && python3 -m http.server 4173) &`);
  process.exit(2);
}
if (proba.status === 200) {
  console.error(
    `Serwer pod ${BASE} oddaje HTTP 200 na adres, ktorego nie ma.\n` +
    `Ma regule lapiaca wszystko, wiec pod kazda trasa poda strone glowna, a\n` +
    `caly pomiar bylby pomiarem strony glownej. Produkcja tej reguly nie ma.\n` +
    `Uruchom zamiast tego: (cd dist && python3 -m http.server 4173) &`
  );
  process.exit(2);
}

const { chromium } = await import("playwright");
const przegladarka = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const kontekst = await przegladarka.newContext({ locale: "pl-PL", viewport: { width: 390, height: 844 } });
await kontekst.route("**", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));

const wyniki = [];
for (const trasa of trasy) {
  const strona = await kontekst.newPage();
  const react = new Set(), http = new Set(), inne = new Set();
  strona.on("pageerror", (e) => {
    const m = String(e).match(/error #(\d+)/);
    m ? react.add(m[1]) : inne.add(String(e).slice(0, 90));
  });
  strona.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) http.add(`${r.status()} ${r.url().replace(BASE, "")}`); });

  let dane = null;
  try {
    await strona.goto(BASE + trasa, { waitUntil: "domcontentloaded", timeout: 20000 });
    await strona.waitForTimeout(700);
    // Przewijamy calosc, bo obrazy z `loading="lazy"` nie wczytuja sie inaczej,
    // a niewczytany obraz wyglada wtedy identycznie jak zepsuty.
    await strona.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    });
    await strona.waitForTimeout(500);
    dane = await strona.evaluate((prog) => {
      const im = [...document.querySelectorAll("img")];
      return {
        obrazow: im.length,
        puste: im.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")).slice(0, 3),
        bezAlt: im.filter((i) => i.getAttribute("alt") === null).length,
        drobne: [...document.querySelectorAll("p,span,li,a,div,td,th,label,button")]
          .filter((e) => !e.children.length && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < prog).length,
        przelew: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        naglowkow1: document.querySelectorAll("h1").length,
        bezNazwy: [...document.querySelectorAll("button,a")]
          .filter((e) => !e.textContent.trim() && !e.getAttribute("aria-label") && !e.querySelector('img[alt]:not([alt=""])')).length,
      };
    }, PROG_MIN_PX);
  } catch (e) { inne.add("NAWIGACJA " + String(e).slice(0, 60)); }

  wyniki.push({ trasa, dane, react: [...react], http: [...http], inne: [...inne] });
  process.stderr.write(`\r  ${wyniki.length}/${trasy.length}  ${trasa}`.padEnd(70));
  await strona.close();
}
await przegladarka.close();
process.stderr.write("\n\n");

if (process.env.AUDIT_JSON) { console.log(JSON.stringify(wyniki, null, 1)); process.exit(0); }

const licz = (f) => wyniki.filter(f).length;
const suma = (f) => wyniki.reduce((a, w) => a + (f(w) || 0), 0);

for (const w of wyniki) {
  const d = w.dane;
  const uwagi = [];
  if (!d) uwagi.push("STRONA SIE NIE OTWORZYLA");
  else {
    if (d.puste.length) uwagi.push(`obrazy nie wczytane: ${d.puste.join(", ")}`);
    if (d.bezAlt) uwagi.push(`bez alt: ${d.bezAlt}`);
    if (d.przelew) uwagi.push("POZIOME PRZEWIJANIE");
    if (d.naglowkow1 !== 1) uwagi.push(`naglowkow h1: ${d.naglowkow1}`);
    if (d.bezNazwy) uwagi.push(`elementy klikalne bez nazwy: ${d.bezNazwy}`);
  }
  if (w.http.length) uwagi.push(...w.http);
  if (w.inne.length) uwagi.push(...w.inne);
  if (uwagi.length) console.log(`${w.trasa}\n    ${uwagi.join("\n    ")}`);
}

console.log(`
Stron sprawdzonych           ${wyniki.length}
Nie otworzylo sie            ${licz((w) => !w.dane)}
Z niewczytanymi obrazami     ${licz((w) => w.dane?.puste.length)}
Z brakujacym alt             ${licz((w) => w.dane?.bezAlt)}
Z poziomym przewijaniem      ${licz((w) => w.dane?.przelew)}
Inaczej niz jeden h1         ${licz((w) => w.dane && w.dane.naglowkow1 !== 1)}
Z bledami hydracji           ${licz((w) => w.react.length)}
Napisow ponizej ${PROG_MIN_PX}px          ${suma((w) => w.dane?.drobne)}
Odpowiedzi 4xx/5xx           ${suma((w) => w.http.length)}`);

process.exit(licz((w) => !w.dane || w.dane.puste.length || w.http.length) ? 1 : 0);
