#!/usr/bin/env node
// ============================================================
// KAFELEK POKAZUJE PRODUKT, A NIE SWOJ WLASNY STAN
// ============================================================
// Zgloszenie wlasciciela wracalo szesc razy w brzmieniu "wybrany kafelek i ten
// pod myszka sa ciemne", a za siodmym razem w brzmieniu "sa juz jasne, ale
// jakby byly za mgla". Obie skargi mialy to samo zrodlo: zdjecie produktu
// przerabialismy po to, zeby powiedziec, ktory kafelek jest zaznaczony.
//
// Warstw bylo cztery, kazda osobno sensowna, razem nie do przejrzenia:
// odbarwienie kafelka niewybranego (`grayscale`), obnizony kontrast na
// wszystkich (`contrast(0.90)`, bo tanio podnosi srednia jasnosc), krycie 0,85
// i warstwa bieli `plus-lighter` na wierzchu. Dodanie bieli podnosi kazdy
// piksel o te sama wartosc, wiec ROZNICE zostaja, a ich stosunek maleje: to
// jest mgla, tylko zapisana w CSS.
//
// Decyzja wlasciciela z 2026-09-04 (ADR-0041): fotografia zostaje fotografia,
// a stan wyboru niesie obwodka z pierscieniem na samym przycisku.
//
// Ta bramka pilnuje szesciu rzeczy:
//
// 1. ZADNA REGULA DOTYCZACA ZDJECIA W KAFELKU NIE OBNIZA KONTRASTU. Kontrast
//    ponizej jedynki sciaga czernie i biele do szarosci, czyli robi mgle.
//    Miara "srednia jasnosc" tego nie zlapala i wlasnie dlatego to jest bramka
//    czytajaca CSS, a nie pomiar sredniej.
// 2. NIE MA ODBARWIANIA. Odbarwione zdjecie produktu nie sprzedaje produktu.
// 3. NIE MA WELONU BIELI nad fotografia (`mix-blend-mode: plus-lighter`).
// 4. ZDJECIE JEST NIEPRZEZROCZYSTE. Krycie ponizej jedynki miesza zdjecie
//    z czarnym tlem kafelka, czyli znowu obniza kontrast.
// 5. KAZDY KOMPONENT Z KAFELKAMI ZE ZDJECIEM ZNACZY WYBOR OBWODKA I PIERSCIENIEM.
//    Skoro zdjecie nie odpowiada juz za stan, musi odpowiadac za niego ramka,
//    inaczej nie odpowiada za niego nic.
// 6. KAFELEK PLASKI (bez zdjecia) W MOTYWIE JASNYM NIE JEST CIEMNIEJSZY OD
//    SIATKI. Pomiar 2026-09-04: zaznaczenie mialo 0,777 przy wygaszonych
//    0,938, a najazd schodzil jeszcze nizej. Liczymy jasnosc odcienia, bo
//    nazwa koloru nie mowi nic: `amber-100` i `amber-700` roznia sie jedna
//    cyfra.
//
// Uruchamiana w `npm run build`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const CSS = readFileSync(join(SRC, "index.css"), "utf8");

/** Prog jasnosci dla zaznaczenia w motywie jasnym. Wygaszone kafelki maja
 *  zmierzone 0,89 do 0,95, wiec 0,80 zostawia margines na odcien, ale nie na
 *  zalanie kafelka ciemnym kolorem. */
const PROG_JASNY = 0.80;

const bledy = [];

const jasnosc = ([r, g, b]) => {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
/** Odcien polozony na podkladzie. Podklad ma znaczenie: ten sam odcien bez
 *  wlasnej bieli pod spodem siada na kremowej kartce i wychodzi ciemniejszy. */
const KARTKA = [246, 237, 228];
const naPodkladzie = ([r, g, b, a], [pr, pg, pb]) =>
  [r * a + pr * (1 - a), g * a + pg * (1 - a), b * a + pb * (1 - a)];

// ── 1 do 4. Reguly dotykajace zdjecia w kafelku ───────────────────────────
{
  // Regula "dotyczy zdjecia w kafelku", gdy jej selektor wymienia `img`.
  const reguly = [...CSS.matchAll(/([^{}]*\bimg\b[^{}]*)\{([^}]*)\}/g)];
  for (const [, selektor, tresc] of reguly) {
    const gdzie = selektor.trim().replace(/\s+/g, " ").slice(0, 90);
    const kontrast = tresc.match(/contrast\(\s*([0-9.]+)\s*\)/);
    if (kontrast && Number(kontrast[1]) < 1) {
      bledy.push(`src/index.css: "${gdzie}" obniza kontrast do ${kontrast[1]}, czyli robi mgle (ADR-0041)`);
    }
    const szarosc = tresc.match(/grayscale\(\s*([0-9.]+)\s*\)/);
    if (szarosc && Number(szarosc[1]) > 0) {
      bledy.push(`src/index.css: "${gdzie}" odbarwia zdjecie produktu (grayscale ${szarosc[1]}, ADR-0041)`);
    }
    const krycie = tresc.match(/opacity:\s*([0-9.]+)/);
    if (krycie && Number(krycie[1]) < 1) {
      bledy.push(`src/index.css: "${gdzie}" ustawia krycie ${krycie[1]}, wiec zdjecie miesza sie z tlem kafelka`);
    }
  }
  // Welon bieli nad fotografia. `plus-lighter` z bialym tlem to dokladnie on.
  const welon = [...CSS.matchAll(/\{[^}]*mix-blend-mode:\s*plus-lighter[^}]*\}/g)]
    .filter((m) => /background(?:-color)?:\s*(?:#fff|rgba?\(\s*255\s*,\s*255\s*,\s*255)/i.test(m[0]));
  if (welon.length) {
    bledy.push(`src/index.css: wrocil welon bieli nad zdjeciem (mix-blend-mode: plus-lighter), ${welon.length} raz(y)`);
  }
}

// ── 5. Wybor znaczy obwodka i pierscien, w kazdym komponencie ze zdjeciami ──
function jsxy(dir, out = []) {
  for (const nazwa of readdirSync(dir)) {
    const pelna = join(dir, nazwa);
    if (statSync(pelna).isDirectory()) jsxy(pelna, out);
    else if (nazwa.endsWith(".jsx")) out.push(pelna);
  }
  return out;
}
for (const plik of jsxy(SRC)) {
  const tresc = readFileSync(plik, "utf8");
  if (!/tile-foto/.test(tresc)) continue;
  const nazwa = relative(ROOT, plik);
  // Pierscien jest tu konieczny, a nie ozdobny: sama obwodka o szerokosci
  // jednego piksela ginie na kontrastowej fotografii, a to byl pierwotny
  // powod, dla ktorego ktos zaczal przerabiac samo zdjecie.
  if (!/ring-2/.test(tresc)) {
    bledy.push(`${nazwa}: kafelki ze zdjeciem nie znacza wyboru pierscieniem (ring-2), a zdjecia juz nie odbarwiamy`);
  }
  if (!/border-(amber|blue|emerald|violet)-400(?![/\d])/.test(tresc)) {
    bledy.push(`${nazwa}: kafelki ze zdjeciem nie znacza wyboru pelna obwodka akcentu`);
  }
}

// ── 6. Kafelek plaski w motywie jasnym nie ciemnieje ───────────────────────
const bloki = [...CSS.matchAll(/\[data-theme="light"\][^{}]*button\.border-(amber|blue)-400[^{}]*\{([^}]*)\}/g)];
if (bloki.length < 4) {
  bledy.push(`src/index.css: motyw jasny opisuje ${bloki.length} regul zaznaczenia kafelka plaskiego, spodziewane cztery`);
}
const zmierzone = { amber: {}, blue: {} };
const podklad = { amber: KARTKA, blue: KARTKA };
for (const b of bloki) {
  if (/:hover/.test(b[0].slice(0, b[0].indexOf("{")))) continue;
  if (/background-color:\s*#(fff|ffffff)\b/i.test(b[2])) podklad[b[1]] = [255, 255, 255];
}
for (const b of bloki) {
  const akcent = b[1];
  const najazdowa = /:hover/.test(b[0].slice(0, b[0].indexOf("{")));
  const m = b[2].match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
  if (!m) { bledy.push(`src/index.css: regula zaznaczenia ${akcent} bez czytelnego odcienia rgba()`); continue; }
  const L = jasnosc(naPodkladzie([+m[1], +m[2], +m[3], +m[4]], podklad[akcent]));
  zmierzone[akcent][najazdowa ? "najazd" : "spoczynek"] = L;
  if (L < PROG_JASNY) {
    bledy.push(`src/index.css: zaznaczenie ${akcent}${najazdowa ? " pod myszka" : ""} w motywie jasnym ma jasnosc ${L.toFixed(3)}, prog to ${PROG_JASNY}`);
  }
}
for (const akcent of ["amber", "blue"]) {
  const { spoczynek: s, najazd: n } = zmierzone[akcent];
  if (s != null && n != null && n < s) {
    bledy.push(`src/index.css: najazd na wybrany kafelek ${akcent} w motywie jasnym CIEMNIEJE (${s.toFixed(3)} -> ${n.toFixed(3)})`);
  }
}

if (bledy.length) {
  console.error("\nKafelki:\n");
  for (const b of bledy) console.error(`  ✗ ${b}`);
  process.exit(1);
}
console.log("OK kafelki: zdjecie bez mgly, wybor znaczy obwodka, motyw jasny nie ciemnieje");
