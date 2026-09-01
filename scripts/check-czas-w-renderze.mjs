// ============================================================
// CZAS W RENDERZE, CZYLI CICHY ZABOJCA PRERENDERU
// ============================================================
// Sto stron tego serwisu jest rysowanych przy buildzie i wysylanych gotowe.
// React laczy sie z tym HTML-em w przegladarce (hydracja) i porownuje go z tym,
// co sam by narysowal. Jesli cokolwiek sie rozjedzie, wyrzuca gotowa strone do
// kosza i rysuje ja od nowa na urzadzeniu klienta. Prerender przestaje sluzyc
// ludziom, choc roboty wyszukiwarek nadal widza tresc, wiec nic nie wyglada
// na zepsute.
//
// Najczestsza przyczyna rozjazdu to CZAS wpisany wprost w widok. `Date.now()`
// albo `new Date()` w renderze ma jedna wartosc w chwili builda i inna w chwili
// ogladania. Audyt z 27 sierpnia 2026 zlapal dokladnie to: date wzgledna
// w opiniach Google ("4 tyg. temu"), ktora psula strone glowna i obie strony
// marek, oraz rok w stopce, ktory psulby wszystkie sto stron po Nowym Roku.
//
// Ten straznik pilnuje dwoch rzeczy:
//
//   1. Zaden plik widoku nie wola `Date.now()` ani `new Date()` WPROST w JSX,
//      czyli w klamrach `{ }` wstawiajacych wartosc do drzewa. Uzycie tych
//      funkcji w `useEffect`, w obsludze zdarzenia albo przy zapisie do pamieci
//      jest w porzadku i nie jest tu ruszane.
//
//   2. Rok w stopce zgadza sie z rokiem biezacym. To jedna liczba do poprawienia
//      raz na rok i lepiej, zeby przypomnial o niej build niz klient.
//
//   node scripts/check-czas-w-renderze.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

// Czas w klamrze WSTAWIONEJ DO DRZEWA, a nie w dowolnej klamrze. Rozroznienie
// jest istotne: `{ ts: Date.now() }` w zapisie do pamieci podrecznej jest
// zupelnie w porzadku, a `<time>{Date.now()}</time>` juz nie. Lapiemy trzy
// ksztalty, w ktorych klamra na pewno stoi w JSX:
//
//   >{ ... }        miedzy znacznikami:  <span>{new Date().getFullYear()}</span>
//   ^  { ... }      wlasna linia widoku: samotne `{cos}` w bloku return
//   atrybut={ ... } wartosc atrybutu:    <time dateTime={new Date()...}>
const CZAS = String.raw`(Date\.now\(\s*\)|new Date\(\s*\))`;
const W_JSX = [
  new RegExp(String.raw`>\s*\{[^{}]*` + CZAS + String.raw`[^{}]*\}`),
  new RegExp(String.raw`^\s*\{[^{}]*` + CZAS + String.raw`[^{}]*\}\s*$`),
  new RegExp(String.raw`\s[A-Za-z][A-Za-z0-9]*=\{[^{}]*` + CZAS + String.raw`[^{}]*\}`),
  // Klamra ZACZYNAJACA sie od czasu: `{new Date().getFullYear()}`. Obiekt tak
  // nie wyglada, bo zaczyna sie od nazwy pola, a wstawka w napisie ma przed
  // klamra dolara. Zostaje wiec wartosc wstawiana do drzewa.
  new RegExp(String.raw`[^$]\{\s*` + CZAS),
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx$/.test(name)) out.push(full);
  }
  return out;
}

const problemy = [];

for (const plik of walk(SRC)) {
  const wzgledny = relative(ROOT, plik);
  const linie = readFileSync(plik, "utf8").split("\n");
  linie.forEach((linia, i) => {
    const bez = linia.trim();
    if (bez.startsWith("//") || bez.startsWith("*")) return;
    if (W_JSX.some((w) => w.test(linia))) {
      problemy.push(`${wzgledny}:${i + 1}\n    ${bez.slice(0, 120)}`);
    }
  });
}

// --- Termin ma jeden ksztalt, i to liczbowy ------------------------------
// Termin realizacji, waznosc oferty i data przelewu to dla klienta ta sama
// rzecz. Do 2 wrzesnia 2026 kazde miejsce pisalo ja inaczej: "22.09.2026"
// w mailu, "2026-09-22" na stronie oferty, "1.09.2026" przy przelewie.
// Klient dostawal dwie wiadomosci o jednej sprawie i widzial dwa zapisy jednej
// daty. Nic sie przez to nie psulo i wlasnie dlatego zylo tak dlugo.
//
// Decyzja wlasciciela: wszedzie liczbowo, "DD.MM.RRRR", przez
// `src/utils/dataDnia.js`. `toLocaleDateString` jest tu zakazane z dwoch
// powodow: daje inny ksztalt w kazdym jezyku i opiera sie na danych ICU, ktore
// w Node i w przegladarce bywaja z roznych wersji, a rozjazd na prerenderze
// wyrzuca cale poddrzewo (ADR-0022).
//
// Wyjatek maja teksty REDAKCYJNE, gdzie miesiac slownie jest wlasciwy i nie
// jest terminem: data wpisu na blogu i zdanie o tym, od kiedy prowadzimy
// wysylke. To nie sa obietnice zlozone klientowi.
const REDAKCYJNE = new Set([
  "src/pages/BlogPost.jsx",
  "src/components/NewsletterForm.jsx",
]);
for (const plik of walk(SRC)) {
  const wzgledny = relative(ROOT, plik).replace(/\\/g, "/");
  if (REDAKCYJNE.has(wzgledny)) continue;
  const linie = readFileSync(plik, "utf8").split("\n");
  linie.forEach((linia, i) => {
    const bez = linia.trim();
    if (bez.startsWith("//") || bez.startsWith("*")) return;
    if (/toLocaleDateString|toLocaleTimeString/.test(linia)) {
      problemy.push(
        `${wzgledny}:${i + 1}\n    ${bez.slice(0, 120)}\n` +
        "    Termin pisze sie liczbowo, przez dzienNumerycznie() z src/utils/dataDnia.js."
      );
    }
  });
}

// Rok w stopce
const FOOTER = join(SRC, "components", "Footer.jsx");
const rok = /const ROK_COPYRIGHT = (\d{4});/.exec(readFileSync(FOOTER, "utf8"));
const teraz = new Date().getUTCFullYear();
if (!rok) {
  problemy.push("src/components/Footer.jsx\n    brak stalej ROK_COPYRIGHT");
} else if (Number(rok[1]) !== teraz) {
  problemy.push(
    `src/components/Footer.jsx\n    ROK_COPYRIGHT = ${rok[1]}, a mamy ${teraz}. ` +
    "Popraw te liczbe, inaczej stopka klamie."
  );
}

if (problemy.length) {
  console.error(`\nCzas w renderze: ${problemy.length}\n`);
  for (const p of problemy) console.error(`  ${p}\n`);
  console.error("Wartosc zalezna od chwili ogladania nie moze trafic wprost do JSX.");
  console.error("Policz ja w useEffect albo oprzyj widok na danych, ktore sie nie zmieniaja.\n");
  process.exit(1);
}

console.log("Czas w renderze: czysto.");
