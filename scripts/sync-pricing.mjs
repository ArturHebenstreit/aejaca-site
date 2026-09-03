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
const GEO_SRC = join(ROOT, "src", "geometry", "ring");
const GEO_DEST = join(ROOT, "chat-api", "geometry");

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
  // Skurcz i gestosc stopow: korzysta z nich i wycena, i generator pierscionkow.
  { from: join(ROOT, "src", "data", "castingAlloys.js"), name: "castingAlloys.js", source: "src/data/castingAlloys.js" },
  // Gestosci kamieni siedza razem z ich barwa, bo to wlasciwosci tego samego
  // materialu. Wycena potrzebuje gestosci, zeby policzyc karaty z bryly.
  { from: join(ROOT, "src", "data", "gemOptics.js"), name: "gemOptics.js", source: "src/data/gemOptics.js" },
  // Deklaracja dostarczenia przedmiotu przez klienta. Jedzie tu, bo regule
  // krajowa (Polska: paczkomat albo osobiscie, zagranica: kurier) musza liczyc
  // TYM SAMYM kodem formularz i serwer. Dwie kopie rozjechalyby sie przy
  // pierwszej zmianie, a objawem bylby blad dopiero przy platnosci.
  { from: join(ROOT, "src", "data", "inboundDelivery.js"), name: "inboundDelivery.js", source: "src/data/inboundDelivery.js" },
  { from: join(ROOT, "src", "data", "laserSubstrate.js"), name: "laserSubstrate.js", source: "src/data/laserSubstrate.js" },
  // KATALOG PYTAN I OPISYWANIE ODPOWIEDZI. Jada tu razem, bo drugie czyta
  // pierwsze. Do 2026-09-03 serwer pocztowy ich nie widzial i wkladal do maila
  // dla pracowni surowy JSON parametrow, a do potwierdzenia dla klienta nie
  // wkladal ich wcale: pozycja, ktora w koszyku miala osiem wierszy opisu,
  // po zaplacie kurczyla sie do nazwy uslugi i kwoty. Kopia slownika napisana
  // dla serwera rozjechalaby sie z katalogiem przy pierwszej zmianie oferty,
  // a objawem bylby mail wygladajacy poprawnie i mowiacy nieprawde.
  { from: join(ROOT, "src", "data", "orderCatalog.js"), name: "orderCatalog.js", source: "src/data/orderCatalog.js" },
  { from: join(ROOT, "src", "data", "describeParams.js"), name: "describeParams.js", source: "src/data/describeParams.js" },
  // Skala w osobnych osiach: liczy z niej i przegladarka, i kwota wiazaca.
  // Objetosc rosnie iloczynem osi, wiec dwie kopie tego wzoru rozjechalyby sie
  // przy pierwszej poprawce, a objawem bylaby cena wygladajaca poprawnie.
  { from: join(ROOT, "src", "utils", "dimScale.js"), name: "dimScale.js", source: "src/utils/dimScale.js" },
];

/** W kopii wszystko lezy obok siebie, wiec ../data/x.js staje sie ./x.js */
function rewriteImports(code) {
  return code
    .replace(/from\s+"\.\.\/data\//g, 'from "./')
    .replace(/from\s+"\.\.\/utils\//g, 'from "./');
}

// Generator pierscionkow ma wlasny katalog, bo `build.js` w folderze z cenami
// bylby nazwa myląca, a rozbicie na pliki ma tu sens. Lustro zachowuje nazwy,
// zmienia tylko sciezke do wspoldzielonych danych.
function rewriteGeometry(code) {
  return code.replace(/from\s+"\.\.\/\.\.\/data\//g, 'from "../pricing/');
}

function buildGeometry() {
  return readdirSync(GEO_SRC)
    .filter((f) => f.endsWith(".js"))
    .map((name) => ({
      name,
      content: HEADER.replace("%SOURCE%", `src/geometry/ring/${name}`) + "\n"
        + rewriteGeometry(readFileSync(join(GEO_SRC, name), "utf8")),
    }));
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
const drift = [];

function mirror(files, dest, label) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const f of files) {
    const path = join(dest, f.name);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (current === f.content) continue;
    if (check) drift.push(`${label}/${f.name}`);
    else writeFileSync(path, f.content);
  }
  // Plik w kopii, ktory zniknal ze zrodla, tez jest dryfem
  const expected = new Set(files.map((f) => f.name));
  for (const name of readdirSync(dest).filter((f) => f.endsWith(".js"))) {
    if (!expected.has(name)) drift.push(`${label}/${name} (osierocony)`);
  }
}

const files = build();
const geoFiles = buildGeometry();
mirror(files, DEST, "pricing");
mirror(geoFiles, GEO_DEST, "geometry");

if (check && drift.length) {
  console.error("\nRdzen rozjechal sie z kopia w chat-api/:");
  for (const d of drift) console.error(`  - ${d}`);
  console.error("\nUruchom: npm run sync:pricing\n");
  process.exit(1);
}

console.log(check
  ? "Rdzen cenowy i generator zgodne z kopiami w chat-api/"
  : `Zsynchronizowano ${files.length} plikow cenowych i ${geoFiles.length} plikow generatora`);
