// ============================================================
// SYNC PRICING CORE -> chat-api/pricing/
// ============================================================
// Railway buduje chat-api z katalogu chat-api jako root, wiec backend nie
// widzi src/. Zamiast duplikowac formuly, kopiujemy tu rdzen z src/pricing
// i src/data/resins.js, a `--check` pilnuje, zeby kopie nie odjechaly od
// oryginalu. Build sie wywala, gdy ktos zmieni cene tylko po jednej stronie.
//
//   node scripts/sync-pricing.mjs          zapisuje kopie
//   node scripts/sync-pricing.mjs --check  tylko weryfikuje, kod wyjscia 1 przy dryfie

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_PRICING = join(ROOT, "src", "pricing");
const DEST = join(ROOT, "chat-api", "pricing");

const HEADER = `// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: %SOURCE%
// Regeneracja: npm run sync:pricing
`;

/** Pliki spoza src/pricing, ktorych rdzen cenowy potrzebuje */
const EXTRA = [
  { from: join(ROOT, "src", "data", "resins.js"), name: "resins.js", source: "src/data/resins.js" },
  // Kontrola danych klienta jezdzi tu razem z cenami z tego samego powodu:
  // przegladarka i serwer musza uznawac za poprawne dokladnie to samo.
  { from: join(ROOT, "src", "shop", "customerFields.js"), name: "customerFields.js", source: "src/shop/customerFields.js" },
  // Dane sprzedawcy jada tu z tego samego powodu: stoja w pouczeniu o odstapieniu
  // i we wzorze formularza, czyli w tresci, ktora ma moc wobec konsumenta.
  // Reczne lustro w orderMail.js zdazylo sie juz rozjechac (brak adresu).
  { from: join(ROOT, "src", "data", "sellerInfo.js"), name: "sellerInfo.js", source: "src/data/sellerInfo.js" },
];

/** W kopii wszystko lezy obok siebie, wiec ../data/x.js staje sie ./x.js */
function rewriteImports(code) {
  return code.replace(/from\s+"\.\.\/data\//g, 'from "./');
}

function build() {
  const files = [];
  for (const name of readdirSync(SRC_PRICING).filter((f) => f.endsWith(".js"))) {
    const source = `src/pricing/${name}`;
    const code = rewriteImports(readFileSync(join(SRC_PRICING, name), "utf8"));
    files.push({ name, content: HEADER.replace("%SOURCE%", source) + "\n" + code });
  }
  for (const e of EXTRA) {
    const code = rewriteImports(readFileSync(e.from, "utf8"));
    files.push({ name: e.name, content: HEADER.replace("%SOURCE%", e.source) + "\n" + code });
  }
  return files;
}

const check = process.argv.includes("--check");
const files = build();

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

const drift = [];
for (const f of files) {
  const path = join(DEST, f.name);
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === f.content) continue;
  if (check) drift.push(f.name);
  else writeFileSync(path, f.content);
}

// Plik w kopii, ktory zniknal ze zrodla, tez jest dryfem
const expected = new Set(files.map((f) => f.name));
for (const name of existsSync(DEST) ? readdirSync(DEST).filter((f) => f.endsWith(".js")) : []) {
  if (!expected.has(name)) drift.push(`${name} (osierocony)`);
}

if (check && drift.length) {
  console.error("\nRdzen cenowy rozjechal sie z kopia w chat-api/pricing/:");
  for (const d of drift) console.error(`  - ${d}`);
  console.error("\nUruchom: npm run sync:pricing\n");
  process.exit(1);
}

console.log(check ? "Rdzen cenowy zgodny z chat-api/pricing/" : `Zsynchronizowano ${files.length} plikow do chat-api/pricing/`);
