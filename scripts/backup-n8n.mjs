// ============================================================
// KOPIA PRZEPLYWOW N8N
// ============================================================
// Przeplywy n8n istnieja dzis w jednym miejscu: w instancji na Railway.
// Osiem z nich jest aktywnych i obsluguje rzeczy, ktorych nie da sie odtworzyc
// z pamieci: formularz kontaktowy, wyceny, newsletter wystawiajacy kody
// rabatowe, pliki zamowien na Dysk, przeniesienie plikow po zaplacie,
// automatyczna odpowiedz, raport tygodniowy i alert anomalii.
//
// Ten skrypt zapisuje je jako pliki JSON w katalogu n8n-backup/, wersjonowane
// razem z kodem. Diff pokazuje wtedy, co i kiedy zmienilo sie w przeplywie,
// a odtworzenie sprowadza sie do wgrania pliku z powrotem.
//
// UWAGA na sekrety. n8n trzyma poswiadczenia osobno od przeplywow i eksport
// zawiera wylacznie ODWOLANIA do nich, nie wartosci. Zdarza sie jednak, ze
// ktos wklei klucz wprost do parametru wezla, dlatego skrypt skanuje eksport
// i ODMAWIA zapisu, gdy znajdzie cos, co wyglada jak sekret. Lepiej zatrzymac
// kopie niz wpisac klucz do repozytorium.
//
// Uruchomienie:
//   N8N_API_URL=https://twoja-instancja.up.railway.app \
//   N8N_API_KEY=... \
//   node scripts/backup-n8n.mjs
//
// Klucz tworzy sie w n8n: Settings, n8n API, Create an API key.
// Klucza NIE wpisujemy do repozytorium ani nie wklejamy w rozmowie.

import { writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Katalog docelowy da sie podmienic, zeby test nigdy nie dotknal prawdziwej
// kopii. Test, ktory potrafi skasowac dane, jest usterka, nie testem.
const OUT = process.env.N8N_BACKUP_DIR || join(ROOT, "n8n-backup");

const API_URL = (process.env.N8N_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.N8N_API_KEY || "";

/**
 * Wzorce, ktore w eksporcie oznaczaja wpadke: klucz wklejony wprost zamiast
 * uzycia poswiadczenia. Kazde trafienie zatrzymuje zapis.
 */
const SECRET_PATTERNS = [
  { name: "klucz OpenAI", re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: "klucz Google API", re: /\bAIza[0-9A-Za-z_-]{30,}/ },
  { name: "adres bazy z haslem", re: /postgres(ql)?:\/\/[^\s"']*:[^\s"'@]+@/i },
  { name: "klucz prywatny", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "zeton bearer", re: /\bBearer\s+[A-Za-z0-9._-]{20,}/ },
  { name: "numer rachunku IBAN", re: /\bPL\d{26}\b/ },
];

/** Nazwa pliku: czytelna, ale stabilna, zeby diff nie skakal po zmianie tytulu. */
function fileNameFor(wf) {
  const slug = String(wf.name || "bez-nazwy")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/gi, "l")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `${wf.id}--${slug}.json`;
}

/**
 * Porzadkujemy klucze alfabetycznie. Bez tego n8n potrafi oddac te same dane
 * w innej kolejnosci i kazda kopia wygladalaby jak zmiana.
 */
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  }
  return value;
}

/** Pola, ktore zmieniaja sie same i tylko zasmiecalyby diff. */
const NOISE = new Set(["updatedAt", "versionId", "activeVersionId", "triggerCount", "scopes", "shared"]);

function tidy(wf) {
  const out = {};
  for (const [k, v] of Object.entries(wf)) if (!NOISE.has(k)) out[k] = v;
  return stable(out);
}

async function fetchAll() {
  const workflows = [];
  let cursor = null;
  do {
    const url = new URL(`${API_URL}/api/v1/workflows`);
    url.searchParams.set("limit", "250");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers: { "X-N8N-API-KEY": API_KEY, Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`n8n odpowiedzial ${res.status}. Sprawdz N8N_API_URL i klucz.`);
    }
    const page = await res.json();
    workflows.push(...(page.data || []));
    cursor = page.nextCursor || null;
  } while (cursor);
  return workflows;
}

function scanForSecrets(text, where) {
  const hits = [];
  for (const { name, re } of SECRET_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(`${where}: ${name} (${m[0].slice(0, 12)}...)`);
  }
  return hits;
}

if (!API_URL || !API_KEY) {
  console.error("Brakuje N8N_API_URL albo N8N_API_KEY.\n");
  console.error("  N8N_API_URL=https://twoja-instancja.up.railway.app \\");
  console.error("  N8N_API_KEY=... node scripts/backup-n8n.mjs\n");
  console.error("Klucz: n8n, Settings, n8n API, Create an API key.");
  process.exit(1);
}

const workflows = await fetchAll();
if (!workflows.length) {
  console.error("n8n nie oddal zadnego przeplywu. Kopia przerwana, zeby nie skasowac poprzedniej.");
  process.exit(1);
}

// Sekrety sprawdzamy PRZED zapisem czegokolwiek. Polowiczna kopia z kluczem
// w srodku jest gorsza niz brak kopii.
const problems = workflows.flatMap((wf) => scanForSecrets(JSON.stringify(wf), wf.name || wf.id));
if (problems.length) {
  console.error(`\nZnaleziono ${problems.length} rzeczy wygladajacych na sekret. NIE zapisuje kopii:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("\nPrzenies te wartosci do poswiadczen n8n (Credentials) i powtorz.");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
// Kasujemy stare pliki, zeby przeplyw usuniety w n8n zniknal takze z kopii.
// Inaczej po roku katalog opisuje system, ktorego juz nie ma.
if (existsSync(OUT)) {
  for (const f of readdirSync(OUT)) if (f.endsWith(".json")) rmSync(join(OUT, f));
}

const index = [];
for (const wf of workflows) {
  const name = fileNameFor(wf);
  writeFileSync(join(OUT, name), JSON.stringify(tidy(wf), null, 2) + "\n");
  index.push({ id: wf.id, name: wf.name, active: Boolean(wf.active), file: name });
}

index.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
writeFileSync(
  join(OUT, "index.json"),
  JSON.stringify({ exportedFrom: API_URL, count: index.length, workflows: index }, null, 2) + "\n"
);

const active = index.filter((w) => w.active).length;
console.log(`Zapisano ${index.length} przeplywow (${active} aktywnych) do n8n-backup/`);
console.log("Sprawdz `git diff`, potem zatwierdz razem z reszta kodu.");
