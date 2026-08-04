// Kopia przeplywow n8n. Dwie rzeczy moga tu zawiesc po cichu i obie sa grozne:
// wpisanie sekretu do repozytorium oraz kopia, ktora przy kazdym uruchomieniu
// wyglada jak zmiana, przez co nikt jej nie oglada. Test pilnuje obu.
//
// Skrypt uruchamiamy jako podproces, bo wykonuje sie od razu po zaimportowaniu.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "backup-n8n.mjs");
// Wlasny katalog: prawdziwa kopia w n8n-backup/ ma pozostac nietknieta.
const OUT = mkdtempSync(join(tmpdir(), "n8n-out-"));

/** Uruchamia skrypt z podstawionym serwerem n8n. */
function run(workflows) {
  const dir = mkdtempSync(join(tmpdir(), "n8n-test-"));
  const stub = join(dir, "stub.mjs");
  // Podstawiamy `fetch`, zeby nie wychodzic do sieci ani nie potrzebowac klucza.
  writeFileSync(stub, `
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ data: ${JSON.stringify(workflows)}, nextCursor: null }),
    });
    await import(${JSON.stringify(SCRIPT)});
  `);
  const r = spawnSync(process.execPath, [stub], {
    env: { ...process.env, N8N_API_URL: "https://przyklad.test", N8N_API_KEY: "test", N8N_BACKUP_DIR: OUT },
    encoding: "utf8",
  });
  rmSync(dir, { recursive: true, force: true });
  return r;
}

const przeplyw = (over = {}) => ({
  id: "abc123",
  name: "AEJaCA — Newsletter Signup (10% discount)",
  active: true,
  updatedAt: "2026-08-03T10:00:00.000Z",
  versionId: "losowa-wartosc",
  triggerCount: 1,
  nodes: [{ name: "Webhook", parameters: { path: "newsletter-signup" } }],
  ...over,
});

// --- Zwykla kopia ---
let r = run([przeplyw()]);
assert.equal(r.status, 0, `skrypt zakonczyl sie bledem: ${r.stderr}`);
assert.match(r.stdout, /Zapisano 1 przeplywow \(1 aktywnych\)/);

const pliki = readdirSync(OUT).filter((f) => f.endsWith(".json") && f !== "index.json");
assert.equal(pliki.length, 1);
assert.match(pliki[0], /^abc123--aejaca-newsletter-signup/, "nazwa pliku niesie identyfikator i czytelny tytul");

const zapisany = JSON.parse(readFileSync(join(OUT, pliki[0]), "utf8"));
assert.equal(zapisany.name, "AEJaCA — Newsletter Signup (10% discount)");
assert.equal(zapisany.updatedAt, undefined, "znacznik czasu zmienia sie sam i tylko zasmieca diff");
assert.equal(zapisany.versionId, undefined);
assert.equal(zapisany.triggerCount, undefined);

const indeks = JSON.parse(readFileSync(join(OUT, "index.json"), "utf8"));
assert.equal(indeks.count, 1);
assert.equal(indeks.workflows[0].active, true);

// --- Powtarzalnosc: druga kopia tych samych danych ma dac ten sam plik ---
const pierwszy = readFileSync(join(OUT, pliki[0]), "utf8");
run([przeplyw({ nodes: [{ parameters: { path: "newsletter-signup" }, name: "Webhook" }] })]);
const drugi = readFileSync(join(OUT, pliki[0]), "utf8");
assert.equal(drugi, pierwszy, "inna kolejnosc kluczy nie moze wygladac jak zmiana przeplywu");

// --- Przeplyw usuniety w n8n znika takze z kopii ---
run([przeplyw({ id: "inny1", name: "Inny przeplyw", active: false })]);
const poPodmianie = readdirSync(OUT).filter((f) => f.endsWith(".json") && f !== "index.json");
assert.deepEqual(poPodmianie.length, 1, "stary plik ma zniknac, inaczej kopia opisuje system, ktorego nie ma");
assert.match(poPodmianie[0], /^inny1--/);

// --- Sekret w eksporcie zatrzymuje zapis ---
for (const [opis, wpadka] of [
  ["klucz OpenAI", { nodes: [{ parameters: { auth: "sk-proj-AAAABBBBCCCCDDDDEEEEFFFF" } }] }],
  ["adres bazy z haslem", { nodes: [{ parameters: { conn: "postgresql://user:tajne@host:5432/db" } }] }],
  ["klucz Google", { nodes: [{ parameters: { key: "AIzaSyA1234567890123456789012345678901" } }] }],
]) {
  const zly = run([przeplyw(wpadka)]);
  assert.equal(zly.status, 1, `${opis}: skrypt powinien odmowic`);
  assert.match(zly.stderr, /NIE zapisuje kopii/, opis);
}

// --- Sekret wpisany wprost w parametr naglowka ---
// Przypadek z zycia: zeton oddzwonienia wklejony w naglowek `x-upload-token`
// w przeplywie od plikow zamowien. Zwykly losowy ciag, ktorego zaden wzorzec
// po ksztalcie nie zlapie, wiec szukamy po nazwie parametru.
const zNaglowkiem = run([przeplyw({
  nodes: [{
    name: "Oddzwonienie do AEJaCA",
    parameters: {
      sendHeaders: true,
      headerParameters: { parameters: [{ name: "x-upload-token", value: "losowy-ciag-ktory-jest-sekretem" }] },
    },
  }],
})]);
assert.equal(zNaglowkiem.status, 1, "zeton w naglowku musi zatrzymac kopie");
assert.match(zNaglowkiem.stderr, /x-upload-token/);

// Wyrazenie n8n w tym samym miejscu to NIE sekret: wartosc bierze sie z poswiadczen
const zWyrazeniem = run([przeplyw({
  nodes: [{
    name: "Oddzwonienie",
    parameters: {
      headerParameters: { parameters: [{ name: "x-upload-token", value: "={{ $credentials.token }}" }] },
    },
  }],
})]);
assert.equal(zWyrazeniem.status, 0, "wyrazenie nie moze byc uznane za sekret");

// Nazwa parametru bez zwiazku z sekretem nie moze wywolywac falszywego alarmu
const niewinny = run([przeplyw({
  nodes: [{ name: "Webhook", parameters: { headerParameters: { parameters: [{ name: "content-type", value: "application/json" }] } } }],
})]);
assert.equal(niewinny.status, 0, "zwykly naglowek to nie sekret");

// Poprzednia kopia musi przetrwac odmowe: skrypt sprawdza sekrety PRZED kasowaniem
assert.ok(readdirSync(OUT).length > 0, "odmowa nie moze zostawic pustego katalogu");

// --- Pusta odpowiedz z n8n nie moze wyczyscic kopii ---
const pusty = run([]);
assert.equal(pusty.status, 1);
assert.match(pusty.stderr, /nie oddal zadnego przeplywu/);

// Prawdziwa kopia nie moze byc dotknieta przez test
assert.notEqual(OUT, join(ROOT, "n8n-backup"));
rmSync(OUT, { recursive: true, force: true });

console.log("Kopia przeplywow n8n: wszystkie sprawdzenia przeszly");
