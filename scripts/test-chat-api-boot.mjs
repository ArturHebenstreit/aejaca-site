#!/usr/bin/env node
// ============================================================
// CZY SERWER API W OGOLE WSTAJE
// ============================================================
// Awaria, ktora ten test zamyka, polozyla `chat-api` na produkcji i nie
// zauwazyl jej ani build, ani eslint, ani zaden z pozostalych piecdziesieciu
// skryptow. Trasa strony oferty zostala dopisana tysiac linii nad licznikiem
// limitu, po ktory siega, a `const` nie daje sie odczytac przed swoja
// deklaracja. Modul wywalal sie w chwili wczytania:
//
//   ReferenceError: Cannot access 'discountCheckLimit' before initialization
//
// Zadna funkcja nie byla wywolana w testach, wiec testy jednostkowe przeszly.
// `no-undef` tego nie widzi, bo nazwa ISTNIEJE, tylko jeszcze nie zyje.
// Railway pokazal wylacznie "Healthcheck failure" po pieciu minutach.
//
// Jedyna kontrola, ktora to lapie, to uruchomienie serwera. Test podstawia
// atrapy sekretow, podnosi proces na wysokim porcie i pyta o `/health`.
// Baza nie jest potrzebna: bez `DATABASE_URL` serwer ma dzialac dalej,
// tylko bez trwalego zapisu, i to tez jest tu sprawdzane.
//
//   node scripts/test-chat-api-boot.mjs

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = join(ROOT, "chat-api");

if (!existsSync(join(API, "node_modules"))) {
  console.log("Start chat-api: pominiete, brak chat-api/node_modules (npm install w chat-api/)");
  process.exit(0);
}

const PORTY = [39917, 39918, 39919];
const CZEKAJ_MS = 30_000;

/** Atrapy sekretow. Serwer ma wstac bez dostepu do czegokolwiek na zewnatrz. */
const SRODOWISKO = {
  ...process.env,
  NODE_ENV: "test",
  OPENAI_API_KEY: "test-nieuzywany",
  DATABASE_URL: "",
};

async function sprobuj(port) {
  const dziecko = spawn(process.execPath, ["server.js"], {
    cwd: API,
    env: { ...SRODOWISKO, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let wyjscie = "";
  dziecko.stdout.on("data", (d) => { wyjscie += d; });
  dziecko.stderr.on("data", (d) => { wyjscie += d; });

  let padl = null;
  dziecko.on("exit", (kod) => { padl = kod ?? "sygnal"; });

  const koniec = Date.now() + CZEKAJ_MS;
  try {
    while (Date.now() < koniec) {
      if (padl !== null) return { ok: false, wyjscie, powod: `proces padl z kodem ${padl}` };
      try {
        const odp = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) });
        const tresc = await odp.json();
        if (odp.status === 200 && tresc?.ok === true) return { ok: true, wyjscie };
        return { ok: false, wyjscie, powod: `/health oddal ${odp.status} ${JSON.stringify(tresc)}` };
      } catch {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    return { ok: false, wyjscie, powod: `brak odpowiedzi z /health przez ${CZEKAJ_MS / 1000} s` };
  } finally {
    dziecko.kill("SIGKILL");
  }
}

let wynik = null;
for (const port of PORTY) {
  wynik = await sprobuj(port);
  // Zajety port to nie jest awaria serwera, tylko nasz problem z wyborem portu.
  if (!wynik.ok && /EADDRINUSE/.test(wynik.wyjscie)) continue;
  break;
}

if (wynik?.ok) {
  console.log("Start chat-api: serwer wstaje i /health oddaje ok, bez bazy i bez sekretow");
  process.exit(0);
}

console.error(`\n  ✗ chat-api nie wstal: ${wynik?.powod || "nieznany powod"}\n`);
console.error(String(wynik?.wyjscie || "").trimEnd().split("\n").slice(0, 25).map((l) => `    ${l}`).join("\n"));
console.error("\n  To jest dokladnie to, co Railway pokazuje jako \"Healthcheck failure\".\n");
process.exit(1);
