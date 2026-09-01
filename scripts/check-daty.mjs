// ============================================================
// DATA Z BAZY NIE JEST NAPISEM
// ============================================================
// Sterownik bazy oddaje kolumne DATE i TIMESTAMPTZ jako OBIEKT Date.
// `String(data).slice(0, 10)` daje wtedy "Tue Sep 22": wyglada jak data,
// przechodzi kazde sprawdzenie "czy w ogole jest" i psuje sie dopiero
// u klienta. W jeden dzien zrobilo trzy szkody naraz:
//
//   1. Strona zamowienia nie pokazywala terminu WCALE. Wzorzec "RRRR-MM-DD"
//      odrzucal "Tue Sep 22", a odrzucona data nie rysuje niczego, wiec
//      naglowek "Planowana finalizacja" stal nad pusta przestrzenia, mimo ze
//      ta sama data byla w mailu.
//   2. Polski mail o etapie pisal pod kropkami "Thu Aug 27".
//   3. Oferty NIGDY nie wygasaly: warunek porownywal "Tue Sep 22" z "2026-09-01"
//      jak dwa napisy, a "T" stoi za "2", wiec kazda oferta wychodzila wazna.
//
// Poprawka w jednym miejscu nie wystarczy, bo wzorzec jest wygodny i wraca.
// Zamiana ma jedno miejsce: `dataISO()` w `chat-api/daty.js`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KATALOGI = ["chat-api", "admin", "workers"];

// Miejsca, w ktorych wzorzec jest poprawny, bo napis NA PEWNO jest napisem.
const WOLNO = new Set([
  "chat-api/daty.js",       // sama zamiana
  "chat-api/mailSzata.js",  // `dzien()` sprawdza wczesniej, czy to Date
  "chat-api/autopay.js",    // tnie napis zlozony przez nas samych, nie date z bazy
]);

// `new Date(...).toISOString().slice(0, 10)` jest w porzadku: obiekt Date
// zamieniono najpierw na napis ISO, wiec dziesiec pierwszych znakow to data.
const DOZWOLONY = /\.toISOString\(\)\s*\.slice\(0,\s*10\)/;
const PODEJRZANY = /String\([^)]*\)\s*\.slice\(0,\s*10\)/g;

function pliki(katalog) {
  const wynik = [];
  const wejdz = (sciezka) => {
    for (const wpis of readdirSync(sciezka)) {
      if (wpis === "node_modules" || wpis.startsWith(".")) continue;
      const pelna = join(sciezka, wpis);
      if (statSync(pelna).isDirectory()) wejdz(pelna);
      else if (/\.(js|mjs)$/.test(wpis) && !wpis.endsWith(".test.mjs")) wynik.push(pelna);
    }
  };
  wejdz(katalog);
  return wynik;
}

const zle = [];
let sprawdzone = 0;
for (const katalog of KATALOGI) {
  let lista;
  try { lista = pliki(join(ROOT, katalog)); } catch { continue; }
  for (const plik of lista) {
    const wzgledna = relative(ROOT, plik).replace(/\\/g, "/");
    if (WOLNO.has(wzgledna)) continue;
    sprawdzone++;
    const linie = readFileSync(plik, "utf8").split("\n");
    linie.forEach((linia, i) => {
      // Komentarz OPISUJACY ten blad jest po naszej stronie, wiec go pomijamy.
      // Inaczej ostrzezenie przed pulapka samo zapalaloby bramke.
      const kod = linia.replace(/\/\/.*$/, "").replace(/\*.*$/, "");
      if (DOZWOLONY.test(kod)) return;
      const trafienia = kod.match(PODEJRZANY);
      if (trafienia) zle.push(`${wzgledna}:${i + 1}  ${trafienia[0]}`);
    });
  }
}

if (zle.length) {
  console.error("\nData z bazy obcieta jak napis. Uzyj dataISO() z chat-api/daty.js:\n");
  for (const w of zle) console.error(`  ${w}`);
  console.error("\nSterownik oddaje DATE jako obiekt Date, wiec wychodzi z tego \"Tue Sep 22\".\n");
  process.exit(1);
}

console.log(`Daty z bazy: sprawdzono ${sprawdzone} plikow, wszystkie ida przez dataISO().`);
