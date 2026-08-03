// ============================================================
// KONTROLA ARKUSZA PANELU
// ============================================================
// Panel przestal ciagnac Tailwind z cudzego serwera i buduje arkusz u siebie
// (`npm run build:css`). Roznica jest istotna: skrypt z sieci skladal klasy
// w locie, a arkusz zbudowany zna wylacznie te, ktore widzial przy budowaniu.
// Klasa dopisana pozniej do szablonu po prostu nie zadziala i nikt tego nie
// zauwazy, bo strona sie wyswietli, tylko bez odstepu albo bez koloru.
//
// Skrypt czyta klasy z szablonow i z server.js (czesc nazw powstaje po stronie
// serwera) i sprawdza, czy kazda z nich jest w arkuszu.
//
//   node check-styles.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CSS = join(ROOT, "public", "tailwind.css");

/** Klasy, ktore nie generuja wlasnej reguly i nie moga byc powodem alarmu. */
// Klasy bez wlasnej reguly: warianty Tailwinda oraz `hot-warn`, ktory jest
// wylacznie uchwytem dla skryptu przelaczajacego widocznosc ostrzezenia.
const NO_RULE = new Set(["group", "peer", "dark", "contents", "hot-warn"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ejs|js)$/.test(name)) out.push(full);
  }
  return out;
}

const css = readFileSync(CSS, "utf8");
const files = [...walk(join(ROOT, "views")), join(ROOT, "server.js")];

/**
 * Nazwa klasy w postaci, w jakiej stoi w arkuszu. Tailwind poprzedza ukosnikiem
 * znaki, ktore w CSS znacza co innego, wiec `max-w-[100px]` zapisuje jako
 * `.max-w-\\[100px\\]`. Najpierw budujemy wiec prawdziwy tekst selektora,
 * dopiero potem escapujemy go na potrzeby wyrazenia regularnego. Odwrotna
 * kolejnosc daje wyrazenie, ktore szuka `[` zamiast `\\[` i nie znajduje nic.
 */
function cssSelector(cls) {
  return "." + cls.replace(/([:/.[\]()%,#!*])/g, "\\$1");
}

function hasRule(cls) {
  const literal = cssSelector(cls).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(literal + "(?![a-zA-Z0-9_-])").test(css);
}

/** Ksztalt nazwy klasy Tailwinda. Odsiewa fragmenty kodu wyciete z szablonu. */
const CLASS_SHAPE = /^-?[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9.]+)*(:-?[a-z][a-zA-Z0-9-]*(\/[0-9.]+)?)*(\/[0-9.]+)?$/;
const ARBITRARY = /^[a-z-]+(:[a-z-]+)*(-)?\[[^\]]+\]$/;

function classesIn(code) {
  const out = [];
  for (const attr of code.match(/class="([^"]*)"/g) || []) {
    // Wstawki EJS wycinamy razem z zawartoscia: to kod, nie nazwy klas.
    const raw = attr.slice(7, -1).replace(/<%[\s\S]*?%>/g, " ");
    for (const cls of raw.split(/\s+/)) {
      if (!cls || NO_RULE.has(cls)) continue;
      if (!CLASS_SHAPE.test(cls) && !ARBITRARY.test(cls)) continue;
      out.push(cls);
    }
  }
  return out;
}

const missing = new Map();
for (const file of files) {
  for (const cls of classesIn(readFileSync(file, "utf8"))) {
    if (hasRule(cls)) continue;
    if (!missing.has(cls)) missing.set(cls, []);
    missing.get(cls).push(relative(ROOT, file));
  }
}

if (!missing.size) {
  console.log("Arkusz panelu: wszystkie klasy z szablonow maja regule w tailwind.css");
  process.exit(0);
}

console.error(`\nKlasy bez reguly w arkuszu (${missing.size}):\n`);
for (const [cls, where] of [...missing].sort()) {
  console.error(`  ${cls}\n    ${[...new Set(where)].slice(0, 3).join(", ")}`);
}
console.error("\nUruchom: npm run build:css");
process.exit(1);
