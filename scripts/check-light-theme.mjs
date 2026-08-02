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
    found.add(m[1].replace(/\\/g, "").replace(/:(hover|focus|active|focus-visible)$/, ""));
  }
  return found;
}

/**
 * Czy klasa moze zniknac w trybie jasnym. Bierzemy tylko trzy przypadki,
 * bo tylko one daja realny brak kontrastu.
 */
function isRisky(cls) {
  const bare = cls.replace(/^(hover|focus|active|group-hover|focus-visible):/, "");

  // Gradienty i czern z przezroczystoscia to prawie zawsze przyciemnienie
  // zdjecia, ktore ma wygladac tak samo w obu trybach. Nie ruszamy ich.
  if (/^(from|to|via)-/.test(bare)) return false;
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

for (const file of walk(SRC)) {
  const code = readFileSync(file, "utf8");
  const lines = code.split("\n");
  lines.forEach((line, i) => {
    // Interesuja nas wylacznie literalne listy klas, nie dowolny tekst.
    const classAttrs = line.match(/className=(?:"[^"]*"|\{`[^`]*`\}|\{"[^"]*"\})/g) || [];
    const inline = line.match(/^\s*(?:idle|chip|icon|[a-z]+):\s*"[^"]*"/) ? [line] : [];
    for (const attr of [...classAttrs, ...inline]) {
      for (const cls of attr.split(/[\s"`{}]+/)) {
        if (!cls || cls.includes("$") || cls.includes("[")) continue;
        if (!isRisky(cls)) continue;
        const bare = cls.replace(/^(hover|focus|active|group-hover|focus-visible):/, "");
        if (covered.has(cls) || covered.has(bare) || allowed.has(cls) || allowed.has(bare)) continue;
        problems.push({ file: relative(ROOT, file), line: i + 1, cls });
      }
    }
  });
}

if (!problems.length) {
  console.log(`Tryb jasny: wszystkie ${covered.size} klasy kolorystyczne maja nadpisanie.`);
  process.exit(0);
}

const byClass = new Map();
for (const p of problems) {
  if (!byClass.has(p.cls)) byClass.set(p.cls, []);
  byClass.get(p.cls).push(`${p.file}:${p.line}`);
}

console.error(`\nKlasy bez nadpisania w trybie jasnym (${byClass.size}):\n`);
for (const [cls, where] of [...byClass].sort()) {
  console.error(`  ${cls}`);
  console.error(`    ${where.slice(0, 4).join(", ")}${where.length > 4 ? `, +${where.length - 4}` : ""}`);
}
console.error(`\nDopisz reguly do src/index.css albo uzyj klasy, ktora juz jest obsluzona.`);
process.exit(1);
