// ============================================================
// WGRANIE DANYCH STARTOWYCH KATALOGU
// ============================================================
// Wpisuje przykladowe produkty z `src/data/productSeed.js` do bazy, zeby dalo
// sie przejsc sklep od karty produktu po platnosc, zanim wejdzie prawdziwy
// asortyment.
//
// Uzycie: DATABASE_URL=postgres://... node scripts/seed-products.mjs
//         ... node scripts/seed-products.mjs --activate
//
// Domyslnie pozycje trafiaja do bazy jako nieaktywne. Sklep pokazywalby
// inaczej rzeczy, ktorych nie mamy na polce, a zamowienie ich skonczyloby sie
// tlumaczeniem klientowi, ze to bylo tylko na probe.
//
// Powtarzalne: ON CONFLICT (slug) DO UPDATE nadpisuje tresc, ale zostawia
// stan magazynowy i widocznosc takie, jakie ustawiono w panelu.

import pg from "pg";
import { PRODUCT_SEED } from "../src/data/productSeed.js";

const { Pool } = pg;
const activate = process.argv.includes("--activate");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false,
});

let inserted = 0;
for (const p of PRODUCT_SEED) {
  const { rows } = await pool.query(
    `INSERT INTO products
       (slug, kind, category, subcategory, offer, active, title, short, description, specs, note,
        images, price_grosze, weight_g, stock, lead_time_days, license)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (slug) DO UPDATE SET
       kind = EXCLUDED.kind, category = EXCLUDED.category, subcategory = EXCLUDED.subcategory,
       offer = EXCLUDED.offer,
       title = EXCLUDED.title, short = EXCLUDED.short, description = EXCLUDED.description,
       specs = EXCLUDED.specs, note = EXCLUDED.note, images = EXCLUDED.images,
       price_grosze = EXCLUDED.price_grosze, weight_g = EXCLUDED.weight_g,
       lead_time_days = EXCLUDED.lead_time_days, license = EXCLUDED.license,
       updated_at = NOW()
     RETURNING slug, active`,
    [
      p.slug, p.kind, p.category, p.subcategory || null, p.offer, activate,
      JSON.stringify(p.title), JSON.stringify(p.short), JSON.stringify(p.description),
      JSON.stringify(p.specs || []), p.note ? JSON.stringify(p.note) : null,
      JSON.stringify(p.images || []),
      p.priceGrosze, p.weightG ?? null, p.stock ?? null, p.leadTimeDays ?? 2,
      p.license || null,
    ]
  );
  inserted += rows.length;
  console.log(`  ${rows[0].slug}  ${rows[0].active ? "widoczny" : "ukryty"}`);
}

console.log(`[produkty] wgrano ${inserted} pozycji`);
if (!activate) console.log("[produkty] pozycje sa ukryte, wlacz je w panelu albo uruchom z --activate");
await pool.end();
