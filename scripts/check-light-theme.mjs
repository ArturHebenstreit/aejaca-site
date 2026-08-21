// ============================================================
// KONTROLA CZYTELNOSCI W TRYBIE JASNYM
// ============================================================
// Tryb jasny nie dziala tu przez warianty `dark:`, tylko przez liste nadpisan
// w src/index.css: `[data-theme="light"] .jakas-klasa { ... }`. Klasa spoza tej
// listy zostaje w kolorze przeznaczonym na czarne tlo, wiec jasny tekst albo
// ciemne tlo staja sie na kremowym tle niewidoczne. Trafilo sie to juz dwa razy
// (pasek dzialow w sklepie, ostrzezenie o cle w kasie), za kazdym razem
// wychodzilo dopiero ze zrzutu ekranu od uzytkownika.
//
// Skrypt sprawdza wylacznie klasy, ktore realnie znikaja: jasny tekst,
// ciemne tlo i obramowania oparte na bieli. Ciemny tekst na jasnym tle jest
// czytelny w obu trybach, wiec go nie ruszamy.
//
//   node scripts/check-light-theme.mjs          raport
//   node scripts/check-light-theme.mjs --fix    tylko wypisuje gotowe reguly CSS

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = join(ROOT, "src", "index.css");
const ALLOW = join(ROOT, "scripts", "light-theme-allow.json");
const SRC = join(ROOT, "src");

// ── Napisy na kafelkach ze zdjeciem ────────────────────────────────────────
// Kafelki kalkulatorow maja bialy napis polozony na fotografii. Fotografia
// bywa jasna w dowolnym miejscu, wiec sam rozmyty cien go nie ratuje: napis
// znika. Ratuje ciemna obwodka z klasy `.tile-ink`.
//
// Sa tu dwie pulapki, obie ciche:
//
//   1. Nowy kafelek dopisany bez `.tile-ink` wyglada poprawnie na ciemnym
//      zdjeciu i znika na jasnym, czyli awaria zalezy od zdjecia.
//   2. Reguly motywu jasnego ustawiaja WLASNY `text-shadow` na tym samym
//      tekscie. Maja te sama wage co nasza, wiec rozstrzyga KOLEJNOSC
//      W PLIKU. Przesuniecie bloku wyzej cofa obwodke bez zadnego bledu.
{
  const css = readFileSync(CSS, "utf8");
  const zle = [];

  if (!/--tile-ink-shadow\s*:/.test(css)) zle.push("brak zmiennej --tile-ink-shadow w src/index.css");
  if (!/\.tile-ink\s*\{/.test(css)) zle.push("brak klasy .tile-ink w src/index.css");

  const nadpisanieMotywu = css.search(/\[data-theme="light"\][^\n]*:has\(\.from-black[^\n]*\.text-white/);
  const obwodkaWMotywie = css.search(/\[data-theme="light"\][^\n]*:has\(\.from-black[^\n]*\.tile-ink/);
  if (obwodkaWMotywie === -1) {
    zle.push("motyw jasny nie ma reguly dla .tile-ink, wiec obwodka przegra z jego wlasnym text-shadow");
  } else if (nadpisanieMotywu !== -1 && obwodkaWMotywie < nadpisanieMotywu) {
    zle.push("regula .tile-ink stoi PRZED nadpisaniami motywu jasnego, wiec nie zadziala; musi byc po nich");
  }

  // Kazdy napis na kafelku ze zdjeciem musi miec obwodke.
  const PLIKI_KAFELKOW = [
    "components/StudioCalculator.jsx",
    "components/calculators/calcShared.jsx",
    "components/calculators/JewelryCalc.jsx",
    "components/calculators/SimpleStudioCalc.jsx",
    "components/calculators/SimpleJewelryCalc.jsx",
  ];
  for (const wzgledna of PLIKI_KAFELKOW) {
    const tresc = readFileSync(join(SRC, wzgledna), "utf8");
    tresc.split("\n").forEach((linia, i) => {
      if (/drop-shadow-(lg|md)/.test(linia) && !/tile-ink/.test(linia)) {
        zle.push(`src/${wzgledna}:${i + 1}: napis na kafelku bez .tile-ink, na jasnym zdjeciu zniknie`);
      }
    });
  }

  if (zle.length) {
    console.error("\nObwodka napisow na kafelkach:\n");
    for (const b of zle) console.error(`  ${b}`);
    process.exit(1);
  }
  console.log(`OK obwodka napisow na kafelkach: ${PLIKI_KAFELKOW.length} plikow, regula po nadpisaniach motywu`);
}

/** Odcienie uznawane za jasne, czyli takie, ktore na kremowym tle znikaja. */
const LIGHT_SHADES = new Set(["50", "100", "200", "300"]);
/** Odcienie tla uznawane za ciemne. */
const DARK_SHADES = new Set(["700", "800", "900", "950"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(full);
  }
  return out;
}

/** Klasy z nadpisaniem w trybie jasnym, po odescapowaniu ukosnikow. */
function coveredClasses() {
  const css = readFileSync(CSS, "utf8");
  const found = new Set();
  const re = /\[data-theme=["']light["']\][^{]*?\.([A-Za-z0-9_\\/:.\-[\]]+)/g;
  let m;
  while ((m = re.exec(css))) {
    // `.hover\:bg-x:hover` w CSS opisuje klase `hover:bg-x`, wiec koncowa
    // pseudoklase odcinamy, inaczej nadpisanie nie zostaloby rozpoznane.
    found.add(m[1].replace(/\\/g, "").replace(/:(hover|focus|active|focus-visible|disabled)$/, ""));
  }
  return found;
}

/**
 * Czy klasa moze zniknac w trybie jasnym. Bierzemy tylko trzy przypadki,
 * bo tylko one daja realny brak kontrastu.
 */
function isRisky(cls) {
  const bare = cls.replace(/^(hover|focus|active|group-hover|focus-visible|disabled):/, "");

  // Gradienty i czern z przezroczystoscia to prawie zawsze przyciemnienie
  // zdjecia, ktore ma wygladac tak samo w obu trybach. Nie ruszamy ich.
  if (/^(from|to|via)-/.test(bare)) return false;
  // Czern z przezroczystoscia ma DWA rozne zastosowania i tylko jedno z nich
  // jest bezpieczne. Gesta, powyzej mniej wiecej czterdziestu procent, to
  // przyciemnienie zdjecia albo tlo modalu: ma wygladac tak samo w obu
  // trybach i nie ruszamy jej. Rzadka to TINT PANELU, ktory na kremowej
  // stronie robi sie szara plama, a tekst dobrany pod ciemne tlo znika na
  // niej razem z nagłowkiem sekcji. Tak wlasnie zniknal blok "jak dostarczyc
  // przedmiot" w komunikacie o materiale.
  const czern = bare.match(/^bg-black\/(\d{1,3})$/);
  if (czern) return Number(czern[1]) <= 40;
  if (/-black(\/\d{1,3})?$/.test(bare)) return false;

  const m = bare.match(/^(text|bg|border|divide)-([a-z]+)-(\d{2,3})(\/\d{1,3})?$/);
  if (!m) return false;
  const [, prop, , shade] = m;

  // Jasny tekst: to jest ten blad, ktory dwa razy trafil na produkcje.
  if (prop === "text" && LIGHT_SHADES.has(shade)) return true;
  // Ciemne tlo panelu na jasnej stronie zostaje czarnym prostokatem.
  if (prop === "bg" && DARK_SHADES.has(shade)) return true;
  return false;
}

const covered = coveredClasses();
// Swiadome wyjatki z uzasadnieniem, np. ciemny przycisk albo nakladka na zdjecie.
const allowed = new Set(Object.keys(JSON.parse(readFileSync(ALLOW, "utf8"))).filter((k) => !k.startsWith("_")));
const problems = [];

/**
 * Listy klas czytamy z calego pliku, nie linia po linii.
 *
 * Dluga lista klas lamie sie w JSX na kilka linii, a wyrazenie dopasowywane do
 * pojedynczej linii nie widzi wtedy ani jej poczatku, ani konca. Tak wlasnie
 * umknal nieczytelny przycisk "Zaplac" w kasie: `disabled:bg-neutral-800`
 * stalo w drugiej linii atrybutu, wiec kontrola po prostu go nie czytala.
 */
function classAttributes(code) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g;
  let m;
  while ((m = re.exec(code))) {
    const line = code.slice(0, m.index).split("\n").length;
    out.push({ text: m[1] ?? m[2] ?? m[3] ?? "", line });
  }
  return out;
}

for (const file of walk(SRC)) {
  const code = readFileSync(file, "utf8");
  // Klasy podawane w mapach stylow (np. `idle: "..."`) stoja w jednej linii.
  const inline = code.split("\n")
    .map((line, i) => ({ line: i + 1, text: line }))
    .filter((l) => /^\s*(?:idle|chip|icon|[a-z]+):\s*"[^"]*"/.test(l.text));

  [...classAttributes(code), ...inline].forEach(({ text: attr, line: lineNo }) => {
    {
      const i = lineNo - 1;
      const classes = attr.split(/[\s"`{}]+/).filter((c) => c && !c.includes("$") && !c.includes("["));
      const isCovered = (c) => covered.has(c) || allowed.has(c);

      for (const cls of classes) {
        const bare = cls.replace(/^(hover|focus|active|group-hover|focus-visible|disabled):/, "");
        if (isCovered(cls)) continue;

        // Wariant `disabled:` musi miec WLASNA regule. Nadpisanie klasy
        // podstawowej go nie obejmuje, bo `.disabled\:bg-x:disabled` to inny
        // selektor niz `.bg-x`. Wlasnie tak nieczynny przycisk "Zaplac" zostal
        // w kasie czarnym prostokatem na kremowej stronie, czyli wygladal na
        // gotowy do klikniecia.
        if (cls.startsWith("disabled:") && isRisky(bare)) {
          problems.push({ file: relative(ROOT, file), line: i + 1, cls, why: "wariant disabled potrzebuje wlasnej reguly" });
          continue;
        }

        if (isCovered(bare)) continue;

        if (isRisky(cls)) {
          problems.push({ file: relative(ROOT, file), line: i + 1, cls, why: "brak nadpisania" });
          continue;
        }

        // Nadpisania stanu podstawowego niosa !important, wiec hover bez
        // wlasnej reguly nigdy nie zadziala: element wyglada w trybie jasnym
        // tak samo z kursorem i bez niego.
        const m = cls.match(/^hover:(bg|border|text)-[a-z]+-\d{2,3}(\/\d{1,3})?$/);
        if (m) {
          const prop = m[1];
          const baseSameProp = classes.some(
            (c) => !c.startsWith("hover:") && c.startsWith(`${prop}-`) && isCovered(c)
          );
          if (baseSameProp) {
            problems.push({ file: relative(ROOT, file), line: i + 1, cls, why: "hover nie przebije !important stanu podstawowego" });
          }
        }
      }
    }
  });
}

if (!problems.length) {
  console.log(`Tryb jasny: wszystkie ${covered.size} klasy kolorystyczne maja nadpisanie.`);
  process.exit(0);
}

const byClass = new Map();
const whyByClass = new Map();
for (const p of problems) {
  if (!byClass.has(p.cls)) byClass.set(p.cls, []);
  byClass.get(p.cls).push(`${p.file}:${p.line}`);
  whyByClass.set(p.cls, p.why);
}

console.error(`\nProblemy z trybem jasnym (${byClass.size}):\n`);
for (const [cls, where] of [...byClass].sort()) {
  console.error(`  ${cls}  (${whyByClass.get(cls)})`);
  console.error(`    ${where.slice(0, 4).join(", ")}${where.length > 4 ? `, +${where.length - 4}` : ""}`);
}
console.error(`\nDopisz reguly do src/index.css albo uzyj klasy, ktora juz jest obsluzona.`);
process.exit(1);
