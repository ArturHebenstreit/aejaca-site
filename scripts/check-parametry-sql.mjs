#!/usr/bin/env node
// ============================================================
// PARAMETR SQL MA JEDEN TYP, A NIE DWA
// ============================================================
// 6 wrzesnia 2026 kazda zaplata z oferty konczyla sie piecsetka. Klientka
// klikala "Zaplac" dziewiec razy, dostala dziewiec razy "Nie udalo sie zlozyc
// zamowienia", potem blokade "Za duzo prob" i napisala do nas, ze link nie
// dziala. W logu stalo jedno zdanie:
//
//   column "amount_eur_cents" is of type integer but expression is of type text
//
// Przyczyna nie byla w danych. Sterownik `pg` wysyla parametry BEZ typu, wiec
// typ ustala serwer z kontekstu. Ten sam parametr stal w zapytaniu dwa razy:
// raz goly, przy kolumnie, i raz z rzutowaniem `$23::INTEGER` w warunku nizej.
// Parametr, ktorego serwer nie rozstrzygnie, schodzi do `text`, a rzutowanie
// w drugim miejscu tego nie cofa. Przy kolumnie zostawal tekst i wpis padal.
//
// TEGO NIE ZLAPIE ZADEN Z NASZYCH SPRAWDZIANOW. Skladnia jest poprawna, kod
// przechodzi `node --check`, testy chodza na atrapach bazy, a bramki czytaja
// pliki, nie Postgresa. Blad byl widoczny wylacznie na produkcji i wylacznie
// dla klienta, ktory probowal zaplacic.
//
// Dlatego ta bramka czyta SAM KSZTALT zapytania: w jednym poleceniu INSERT ten
// sam parametr nie moze raz miec rzutowania, a raz nie miec. To jest regula
// mechaniczna i sprawdzalna bez bazy, a dokladnie ona zawiodla.
//
// Uruchamiana w `npm run build`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KATALOGI = ["chat-api", "admin"];

const bledy = [];

function pliki(dir, out = []) {
  for (const nazwa of readdirSync(dir)) {
    if (nazwa === "node_modules" || nazwa === "pricing") continue;
    const pelna = join(dir, nazwa);
    if (statSync(pelna).isDirectory()) pliki(pelna, out);
    else if (nazwa.endsWith(".js")) out.push(pelna);
  }
  return out;
}

/** Polecenia INSERT wycinane z literalow szablonowych. */
function inserty(tresc) {
  const out = [];
  // Literal szablonowy z INSERT w srodku. Nie parsujemy JavaScriptu: wystarczy
  // kawalek tekstu miedzy odwrotnymi apostrofami, bo tak wygladaja u nas
  // wszystkie zapytania.
  for (const m of tresc.matchAll(/`([^`]*INSERT\s+INTO[^`]*)`/gis)) {
    out.push({ sql: m[1], indeks: m.index });
  }
  return out;
}

for (const katalog of KATALOGI) {
  for (const plik of pliki(join(ROOT, katalog))) {
    const tresc = readFileSync(plik, "utf8");
    for (const { sql, indeks } of inserty(tresc)) {
      // Komentarze SQL wycinamy: stoi w nich opis bledu, razem z przykladami
      // parametrow, a to nie jest kod.
      const kod = sql.replace(/--[^\n]*/g, "");
      const zRzutowaniem = new Set([...kod.matchAll(/\$(\d+)\s*::\s*[A-Za-z]/g)].map((m) => m[1]));
      if (!zRzutowaniem.size) continue;
      for (const nr of zRzutowaniem) {
        // Goly parametr: `$n` bez rzutowania i bez cyfry obok (zeby `$2` nie
        // zlapalo `$23`).
        const goly = new RegExp(`\\$${nr}(?!\\d)(?!\\s*::)`);
        if (goly.test(kod)) {
          const linia = tresc.slice(0, indeks).split("\n").length;
          bledy.push(
            `${relative(ROOT, plik)}:${linia}  parametr $${nr} raz z rzutowaniem, raz bez. ` +
            `Postgres rozstrzygnie go jako text i wpis padnie przy kolumnie o innym typie.`
          );
        }
      }
    }
  }
}

if (bledy.length) {
  console.error("\nParametry SQL o dwoch twarzach:\n");
  for (const b of bledy) console.error(`  ✗ ${b}`);
  console.error("\nDopisz to samo rzutowanie w KAZDYM wystapieniu tego parametru.\n");
  process.exit(1);
}
console.log("Parametry SQL: kazdy ma jeden typ we wszystkich wystapieniach");
