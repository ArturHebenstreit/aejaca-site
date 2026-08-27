// ============================================================
// DOLNA GRANICA WIELKOSCI PISMA
// ============================================================
// Przeglad wszystkich stu stron w przegladarce (27 sierpnia 2026) naliczyl
// 1033 napisy mniejsze niz dwanascie pikseli, na kazdej stronie serwisu.
// Ponizej dwunastu czyta sie zle na telefonie i jest to najczestsza uwaga
// w audytach dostepnosci. Etykiety schodzily nawet do siedmiu pikseli.
//
// Dwanascie pikseli (`text-xs`) jest dolna granica i nie ma wyjatkow. Jesli
// cos sie po podniesieniu nie miesci, to nie znak, ze napis ma byc mniejszy,
// tylko ze kratka jest za ciasna.
//
// Straznik patrzy na klasy z wpisana wielkoscia (`text-[10px]`, `text-[0.7rem]`),
// bo skala Tailwinda zaczyna sie wlasnie od `text-xs`. Wielkosci w atrybutach
// `style` i w rysunkach SVG (`src/index.css`, klasy `.rs-*`) nie sa tu
// sprawdzane: to podglad wydruku w skali milimetrowej, nie tekst do czytania.
//
//   node scripts/check-drobny-tekst.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const MINIMUM_PX = 12;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(full);
  }
  return out;
}

const problemy = [];
const WZOR = /text-\[([0-9.]+)(px|rem)\]/g;

for (const plik of walk(SRC)) {
  const linie = readFileSync(plik, "utf8").split("\n");
  linie.forEach((linia, i) => {
    for (const m of linia.matchAll(WZOR)) {
      const px = m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
      if (px < MINIMUM_PX) {
        problemy.push(`${relative(ROOT, plik)}:${i + 1}  ${m[0]}  (${px} px)`);
      }
    }
  });
}

if (problemy.length) {
  console.error(`\nNapisy ponizej ${MINIMUM_PX} px: ${problemy.length}\n`);
  for (const p of problemy.slice(0, 30)) console.error("  " + p);
  if (problemy.length > 30) console.error(`  ...i ${problemy.length - 30} wiecej`);
  console.error(`\nDolna granica to ${MINIMUM_PX} px, czyli \`text-xs\`.`);
  console.error("Nie miesci sie? Poszerz kratke albo skroc napis, nie zmniejszaj pisma.\n");
  process.exit(1);
}

console.log(`Wielkosc pisma: nic ponizej ${MINIMUM_PX} px.`);
