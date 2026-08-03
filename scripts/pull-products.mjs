// ============================================================
// ODCISK KATALOGU Z BAZY
// ============================================================
// Pobiera aktywne produkty z API i zapisuje je jako `src/data/products.generated.js`.
// Ten plik wchodzi do repozytorium razem ze zdjeciami, bo strony sklepu sa
// budowane statycznie i karta produktu musi istniec jako plik.
//
// Uzycie:
//   npm run products:pull
//   CHAT_API_URL=http://localhost:8080 npm run products:pull
//
// Swiadomie nie pobieramy katalogu w trakcie budowania na Cloudflare: budowa
// przestalaby byc powtarzalna, a chwilowa niedostepnosc bazy wywracalaby
// wdrozenie strony, ktora ze zdjeciami w repozytorium i tak jest kompletna.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../src/data/products.generated.js");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

const API = (process.env.CHAT_API_URL || "https://aejacachatapi-production.up.railway.app").replace(/\/$/, "");

/** Kolejnosc pol ustalona, zeby diff pokazywal zmiane tresci, a nie przetasowanie kluczy. */
const KEYS = [
  "slug", "category", "subcategory", "offer", "kind", "status",
  "title", "short", "description", "specs", "note",
  "images",
  "priceGrosze",
  // Okno porownawcze do informacji o obnizce ceny. Jedzie do odcisku razem
  // z cena, bo strony sklepu sa statyczne: zmiana ceny i tak wymaga wdrozenia,
  // wiec obie liczby zmieniaja sie w tej samej chwili i nie moga sie rozjechac.
  "lowest30Grosze", "highest30Grosze", "daysOnSale",
  "weightG", "stock", "leadTimeDays",
  "personalization", "license",
];

function tidy(p) {
  const out = {};
  for (const k of KEYS) if (p[k] !== undefined && p[k] !== null) out[k] = p[k];
  // `stock: null` znaczy "bez limitu" przy produkcie cyfrowym, wiec ta jedna
  // wartosc null musi przetrwac czyszczenie.
  if (p.stock === null) out.stock = null;
  return out;
}

const res = await fetch(`${API}/api/products`);
if (!res.ok) {
  console.error(`[produkty] API odpowiedzialo ${res.status} ${res.statusText}`);
  process.exit(1);
}
const data = await res.json();
const products = (Array.isArray(data) ? data : data.products || []).map(tidy);

products.sort((a, b) => a.slug.localeCompare(b.slug));

// Ostrzezenie, a nie blad: pelne sprawdzenie robi check-shop-images przy budowaniu.
for (const p of products) {
  for (const img of p.images || []) {
    if (!fs.existsSync(path.join(PUBLIC_DIR, img))) {
      console.warn(`[produkty] brak pliku zdjecia w repozytorium: ${img} (${p.slug})`);
    }
  }
}

const header = fs.readFileSync(OUT, "utf-8").split("export const GENERATED_AT")[0];
const body =
  header +
  `export const GENERATED_AT = ${JSON.stringify(new Date().toISOString())};\n\n` +
  `export const PRODUCTS_FROM_DB = ${JSON.stringify(products, null, 2)};\n`;

fs.writeFileSync(OUT, body);
console.log(`[produkty] zapisano ${products.length} pozycji do src/data/products.generated.js`);
console.log("[produkty] pamietaj o `npm run sitemap:shop` i o commicie zdjec razem z odciskiem");
