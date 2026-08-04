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

/** Znacznik w miejscu sekretu. Widoczny od razu i nie do pomylenia z wartoscia. */
const REDACTED = "__USTAW_PRZY_ODTWARZANIU__";

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

/**
 * Nazwy parametrow, ktore z natury niosa sekret. Wartosc przy takiej nazwie
 * ma byc odwolaniem do poswiadczenia albo wyrazeniem, nigdy naplem.
 */
const SECRET_NAMES = /^(x-)?(api[-_]?key|auth|authorization|token|secret|password|passwd|signature|.*[-_]token|.*[-_]key|.*[-_]secret)$/i;

/** Wyrazenie n8n, a nie wartosc: zaczyna sie od `=` albo zawiera `{{ }}`. */
function isExpression(v) {
  return typeof v === "string" && (v.startsWith("=") || v.includes("{{"));
}

/** Wartosc, ktora juz zamienilismy. Bez tego skaner zglaszalby wlasny znacznik. */
function isRedacted(v) {
  return v === REDACTED;
}

/**
 * Sekret wpisany wprost w parametr wezla.
 *
 * Znaleziony w praktyce: zeton oddzwonienia wklejony w naglowek `x-upload-token`
 * w przeplywie od plikow zamowien. Zwykly losowy ciag, bez przedrostka, wiec
 * zaden wzorzec z SECRET_PATTERNS by go nie zlapal. Szukamy wiec po NAZWIE
 * parametru, a nie po ksztalcie wartosci.
 */
function scanNamedSecrets(node, where, hits) {
  const walk = (value, path) => {
    if (Array.isArray(value)) return value.forEach((v, i) => walk(v, path));
    if (!value || typeof value !== "object") return;

    // Ksztalt n8n: { name: "x-upload-token", value: "..." }
    if (typeof value.name === "string" && SECRET_NAMES.test(value.name.trim())) {
      const v = value.value;
      if (typeof v === "string" && v.length >= 8 && !isExpression(v) && !isRedacted(v)) {
        hits.push(`${where}: wartosc wpisana wprost w parametr "${value.name}"`);
      }
    }
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_NAMES.test(k) && typeof v === "string" && v.length >= 8 && !isExpression(v) && !isRedacted(v)) {
        hits.push(`${where}: wartosc wpisana wprost w polu "${k}"`);
      }
      walk(v, `${path}.${k}`);
    }
  };
  walk(node, "");
}

/**
 * Zamienia wartosci sekretow na znacznik i oddaje liste miejsc do uzupelnienia.
 *
 * Odmowa zapisu chronila repozytorium, ale zostawiala nas bez kopii. Zamiana
 * daje jedno i drugie: struktura przeplywu jest zachowana w calosci, a w miejscu
 * klucza stoi napis, ktory przy odtwarzaniu mowi, co trzeba wpisac recznie.
 */
function redactNode(node, where, notes) {
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;

    if (typeof value.name === "string" && SECRET_NAMES.test(value.name.trim())) {
      const v = value.value;
      if (typeof v === "string" && v.length >= 8 && !isExpression(v)) {
        value.value = REDACTED;
        notes.push({ where, field: value.name });
      }
    }
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_NAMES.test(k) && typeof v === "string" && v.length >= 8 && !isExpression(v)) {
        value[k] = REDACTED;
        notes.push({ where, field: k });
      } else {
        walk(v);
      }
    }
  };
  walk(node);
}

function scanForSecrets(wf) {
  const where = wf.name || wf.id;
  const hits = [];
  const text = JSON.stringify(wf);
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) hits.push(`${where}: ${name}`);
  }
  // Poswiadczenia n8n (`credentials`) to same odwolania po identyfikatorze,
  // wiec ich nie przegladamy. Chodzi wylacznie o parametry wezlow.
  for (const node of wf.nodes || []) scanNamedSecrets(node.parameters, `${where} / ${node.name || "?"}`, hits);
  return [...new Set(hits)];
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

// Najpierw zamiana wartosci przy nazwach mowiacych o sekrecie.
const notes = [];
for (const wf of workflows) {
  for (const node of wf.nodes || []) redactNode(node.parameters, `${wf.name} / ${node.name || "?"}`, notes);
  // `activeVersion` niesie kopie wezlow, wiec trzeba przejsc i po niej.
  for (const node of wf.activeVersion?.nodes || []) redactNode(node.parameters, `${wf.name} / ${node.name || "?"}`, notes);
}

// To, czego zamiana nie objela, nadal zatrzymuje kopie. Klucz o ksztalcie
// `sk-...` w dowolnym miejscu tresci znaczy, ze zamiana czegos nie zlapala,
// a wpisanie go do repozytorium byloby gorsze niz brak kopii.
const problems = workflows.flatMap(scanForSecrets);
if (problems.length) {
  console.error(`\nZostaly wartosci wygladajace na sekret, ktorych nie da sie zamienic po nazwie:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("\nPrzenies je do poswiadczen n8n (Credentials) i powtorz.");
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

// Notatka odtworzeniowa: co trzeba wpisac recznie po wgraniu przeplywow.
// Bez niej odtworzony przeplyw wyglada poprawnie i po cichu nie dziala.
const byFlow = new Map();
for (const n of notes) {
  if (!byFlow.has(n.where)) byFlow.set(n.where, new Set());
  byFlow.get(n.where).add(n.field);
}
const restore = [
  "# Odtworzenie przeplywow n8n",
  "",
  "Pliki JSON w tym katalogu wgrywa sie w n8n przez Import from File.",
  "",
  `Wartosci sekretow zostaly zamienione na \`${REDACTED}\`. Po wgraniu trzeba je`,
  "uzupelnic, najlepiej przenoszac do poswiadczen n8n (Credentials) zamiast wpisywac",
  "wprost, bo wpisana wartosc wroci do kopii przy nastepnym eksporcie.",
  "",
  byFlow.size ? "## Miejsca do uzupelnienia" : "## Brak miejsc do uzupelnienia",
  "",
];
for (const [where, fields] of [...byFlow].sort()) {
  restore.push(`- **${where}**: ${[...fields].sort().join(", ")}`);
}
restore.push(
  "",
  "Zrodlo wartosci: zmienne srodowiskowe uslugi chat-api w Railway.",
  "",
  "---",
  "",
  "Ten plik powstaje na nowo przy kazdym uruchomieniu skryptu, wiec nie dopisuj",
  "tu niczego recznie. Uwagi trwale, ktore maja przetrwac kolejna kopie, ida do",
  "`n8n-backup/README.md`.",
  ""
);
writeFileSync(join(OUT, "ODTWORZENIE.md"), restore.join("\n"));

const active = index.filter((w) => w.active).length;
console.log(`Zapisano ${index.length} przeplywow (${active} aktywnych) do n8n-backup/`);
console.log(`Zamieniono sekretow: ${notes.length}. Lista w n8n-backup/ODTWORZENIE.md`);
console.log("Sprawdz `git diff`, potem zatwierdz razem z reszta kodu.");
