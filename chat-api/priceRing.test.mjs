// ============================================================
// WYCENA KREATORA BEZ KURSOW Z BAZY
// ============================================================
// `/api/price/ring` czytalo `rates.pln_per_eur` bez sprawdzenia, czy kursy
// w ogole przyszly. `currentMetalRates` oddaje `null` bez bazy, przy
// padnietym zapytaniu i przy pustej tabeli kursow, wiec w kazdym z tych
// trzech przypadkow kreator dostawal 500 "Wycena chwilowo niedostepna",
// chociaz rdzen wyceny liczy z kursow zapasowych bez zadnego problemu.
// Sasiednia trasa `/api/price` miala warunek od poczatku.
//
// Testy jednostkowe tego nie zlapaly, bo trasa jest wpisana w `server.js`,
// a nie w module. Jedyna uczciwa kontrola to podniesienie serwera bez bazy
// i zapytanie go o cene domyslnego pierscionka. Znalezione w audycie
// kreatora 2026-09-12.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULTS } from "./geometry/params.js";

const API = dirname(fileURLToPath(import.meta.url));
const PORTY = [39931, 39932, 39933];
const CZEKAJ_MS = 40_000;

async function zSerwerem(port, praca) {
  const dziecko = spawn(process.execPath, ["server.js"], {
    cwd: API,
    env: { ...process.env, NODE_ENV: "test", OPENAI_API_KEY: "test-nieuzywany", DATABASE_URL: "", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let wyjscie = "";
  dziecko.stdout.on("data", (d) => { wyjscie += d; });
  dziecko.stderr.on("data", (d) => { wyjscie += d; });
  let padl = null;
  dziecko.on("exit", (kod) => { padl = kod ?? "sygnal"; });
  try {
    const koniec = Date.now() + CZEKAJ_MS;
    let wstal = false;
    while (Date.now() < koniec && !wstal) {
      if (padl !== null) return { zajety: /EADDRINUSE/.test(wyjscie), wyjscie, wynik: null };
      try {
        const r = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) });
        wstal = r.status === 200;
      } catch { await new Promise((res) => setTimeout(res, 300)); }
    }
    if (!wstal) return { zajety: false, wyjscie, wynik: null };
    return { zajety: false, wyjscie, wynik: await praca(port) };
  } finally {
    dziecko.kill("SIGKILL");
  }
}

let wynik = null, wyjscie = "";
for (const port of PORTY) {
  const w = await zSerwerem(port, async (p) => {
    const r = await fetch(`http://127.0.0.1:${p}/api/price/ring`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params: DEFAULTS, lang: "pl" }),
      signal: AbortSignal.timeout(30_000),
    });
    return { status: r.status, body: await r.json() };
  });
  wyjscie = w.wyjscie;
  if (w.zajety) continue;
  wynik = w.wynik;
  break;
}

assert.ok(wynik, `serwer nie wstal albo nie odpowiedzial:\n${wyjscie.slice(-800)}`);
assert.equal(wynik.status, 200, `bez bazy trasa ma liczyc z kursow zapasowych, a oddala ${wynik.status}: ${JSON.stringify(wynik.body)}`);
assert.equal(wynik.body.ok, true, "odpowiedz ma byc oznaczona jako udana");
for (const wyjscieCeny of ["mesh", "cast", "finished"]) {
  const it = wynik.body.items?.[wyjscieCeny];
  assert.ok(it && it.lineGrosze > 0, `wyjscie ${wyjscieCeny} ma miec kwote, a ma: ${JSON.stringify(it)}`);
}
assert.ok(wynik.body.geometry?.massG > 0, "masa metalu z serwera ma byc dodatnia");
console.log(`priceRing.test.mjs: bez kursow z bazy kreator wycenia plik ${wynik.body.items.mesh.lineGrosze / 100} zl, odlew ${wynik.body.items.cast.lineGrosze / 100} zl, wyrob ${wynik.body.items.finished.lineGrosze / 100} zl`);
console.log("priceRing.test.mjs: wszystkie sprawdzenia przeszly");
