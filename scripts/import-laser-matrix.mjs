/**
 * One-shot seed script — reads docs/Laser_Matryca_Materialowa_20260509_v.1.0.xlsx
 * and imports all rows into PostgreSQL laser_matrix table.
 *
 * Usage:
 *   DATABASE_URL="postgresql://…" node scripts/import-laser-matrix.mjs
 *
 * Options:
 *   --dry-run    Parse only, don't write to DB
 *   --no-truncate  Append rows instead of replacing all
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");
const NO_TRUNCATE = process.argv.includes("--no-truncate");

const XLSX_PATH = join(ROOT, "docs", "Laser_Matryca_Materialowa_20260509_v.1.0.xlsx");

if (!existsSync(XLSX_PATH)) {
  console.error(`ERROR: File not found: ${XLSX_PATH}`);
  process.exit(1);
}

// Wavelength lookup from Legenda sheet
const LASER_WAVELENGTH = {
  "CO2":          10600,
  "DIODE":          450,
  "Fiber Raycus":  1064,
  "MOPA":          1064,
  "IR (1064nm)":   1064,
  "GREEN":          532,
  "UV":             355,
};

function normalize(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === "" || s === "N/A" || s === "n/a") return null;
  // Excel dates can appear as Date objects — convert pulse_width_ns numbers back to string
  if (val instanceof Date) {
    // MOPA pulse_width_ns got imported as date in Excel — extract the numeric month-day
    // e.g. "2026-06-02" was likely "2-6" ns (pulse width range)
    // Keep as-is but stringify safely
    return s;
  }
  return s;
}

function parseWatts(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // Already has "W" suffix — normalize
  if (s.endsWith("W")) return s;
  // Numeric — add W
  const n = parseFloat(s);
  if (!isNaN(n)) return `${n}W`;
  return s;
}

console.log(`Reading: ${XLSX_PATH}`);
const wb = XLSX.readFile(XLSX_PATH, { cellDates: false, raw: false });
const ws = wb.Sheets["Matryca Laserowa"];
if (!ws) {
  console.error("ERROR: Sheet 'Matryca Laserowa' not found");
  process.exit(1);
}

// Read as array of arrays — row 1 = section headers, row 2 = column headers, row 3+ = data
const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

// Row 2 (index 1) = column headers
const dataRows = rawRows.slice(2).filter(r => r.some(v => v !== null));

console.log(`Found ${dataRows.length} data rows`);

const records = dataRows.map((r, i) => {
  const laserType = normalize(r[0]);
  if (!laserType) return null; // skip empty rows

  return {
    laser_type:     laserType,
    action_type:    normalize(r[1])  || "Nieznany",
    kinematics:     normalize(r[2])  || "XY (Plotery)",
    wavelength_nm:  LASER_WAVELENGTH[laserType] || null,
    material:       normalize(r[4])  || "Nieznany",
    thickness_mm:   normalize(r[5]),
    watts:          parseWatts(normalize(r[6])) || "?",
    speed:          normalize(r[7]),
    power_pct:      normalize(r[8]),
    passes:         normalize(r[9]),
    dpi:            normalize(r[10]),
    hatch_mm:       normalize(r[11]),
    scan_angle_deg: normalize(r[12]),
    wobble_mm:      normalize(r[13]),
    frequency_khz:  normalize(r[14]),
    pulse_width_ns: normalize(r[15]),
    optics_lens:    normalize(r[16]),
    defocus_mm:     normalize(r[17]),
    z_step_mm:      normalize(r[18]),
    gas_type:       normalize(r[19]),
    gas_pressure:   normalize(r[20]),
    galvo_delays:   normalize(r[21]),
    notes:          normalize(r[22]),
  };
}).filter(Boolean);

console.log(`Parsed ${records.length} valid records`);

if (DRY_RUN) {
  console.log("DRY RUN — first 3 records:");
  records.slice(0, 3).forEach((r, i) => console.log(` [${i}]`, JSON.stringify(r)));
  console.log("DRY RUN complete, no DB writes.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const COLS = [
  "laser_type","action_type","kinematics","wavelength_nm","material","thickness_mm",
  "watts","speed","power_pct","passes",
  "dpi","hatch_mm","scan_angle_deg","wobble_mm","frequency_khz","pulse_width_ns",
  "optics_lens","defocus_mm","z_step_mm",
  "gas_type","gas_pressure","galvo_delays",
  "notes",
];

const INSERT_SQL = `
  INSERT INTO laser_matrix (${COLS.join(", ")})
  VALUES (${COLS.map((_, i) => `$${i + 1}`).join(", ")})
`;

try {
  await pool.query("BEGIN");

  if (!NO_TRUNCATE) {
    console.log("Truncating laser_matrix...");
    await pool.query("TRUNCATE laser_matrix RESTART IDENTITY");
  }

  // Batch insert in chunks of 100
  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    for (const rec of chunk) {
      const vals = COLS.map(c => rec[c] ?? null);
      await pool.query(INSERT_SQL, vals);
      inserted++;
    }
    process.stdout.write(`\r  Inserted ${inserted}/${records.length}...`);
  }

  await pool.query("COMMIT");
  console.log(`\nDone! ${inserted} rows inserted.`);

  // Verify
  const { rows } = await pool.query("SELECT COUNT(*) FROM laser_matrix");
  console.log(`DB count: ${rows[0].count} rows in laser_matrix`);

} catch (err) {
  await pool.query("ROLLBACK").catch(() => {});
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
