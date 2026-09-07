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
// Dlatego ta bramka czyta SAM KSZTALT zapytania. Regul jest dwie, bo pierwsza
// wersja tej bramki zlapala tamten INSERT i PRZEPUSCILA ten sam blad obok.
//
// REGULA 1: w jednym poleceniu ten sam parametr nie moze raz miec rzutowania,
// a raz go nie miec.
//
// REGULA 2: parametr w wyrazeniu CASE musi miec rzutowanie, nawet gdy w calym
// zapytaniu wystepuje tylko raz. Dopisana 7 wrzesnia 2026, po tym jak dzien po
// naprawieniu INSERT zaplata z oferty NADAL konczyla sie ta sama piecsetka,
// tyle ze wylacznie przy kodzie rabatowym:
//
//   UPDATE orders SET amount_eur_cents =
//     CASE WHEN amount_eur_cents IS NULL THEN NULL ELSE $5 END
//
// Jedna galaz to NULL, czyli typ nieznany, druga to goly parametr, ktory idzie
// bez typu. Postgres nie ma z czego wyprowadzic typu calego wyrazenia i schodzi
// do `text`. Regula 1 tego nie widziala, bo $5 stoi tu tylko raz i nie ma sie
// z czym rozjechac. Bramka patrzy tez na UPDATE, nie na sam INSERT: to nie ma
// znaczenia dla Postgresa, ktore to polecenie.
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

/** Polecenia zapisujace, wycinane z literalow szablonowych. */
function zapisy(tresc) {
  const out = [];
  // Literal szablonowy z INSERT albo UPDATE w srodku. Nie parsujemy
  // JavaScriptu: wystarczy kawalek tekstu miedzy odwrotnymi apostrofami, bo tak
  // wygladaja u nas wszystkie zapytania.
  for (const m of tresc.matchAll(/`([^`]*(?:INSERT\s+INTO|UPDATE\s+[A-Za-z_])[^`]*)`/gis)) {
    out.push({ sql: m[1], indeks: m.index });
  }
  return out;
}

/**
 * Wyrazenia CASE w zapytaniu, razem z ich trescia.
 *
 * Bierzemy najkrotsze dopasowanie do najblizszego END, bo nasze zapytania nie
 * zagniezdzaja CASE w CASE. Gdyby kiedys zagniezdzily, ta bramka zobaczy tylko
 * wewnetrzne i to nadal jest po stronie bezpiecznej: zglosi wiecej, nie mniej.
 */
function wyrazeniaCase(kod) {
  return [...kod.matchAll(/\bCASE\b[\s\S]*?\bEND\b/gi)].map((m) => m[0]);
}

for (const katalog of KATALOGI) {
  for (const plik of pliki(join(ROOT, katalog))) {
    const tresc = readFileSync(plik, "utf8");
    for (const { sql, indeks } of zapisy(tresc)) {
      // Komentarze SQL wycinamy: stoi w nich opis bledu, razem z przykladami
      // parametrow, a to nie jest kod.
      const kod = sql.replace(/--[^\n]*/g, "");
      const linia = () => tresc.slice(0, indeks).split("\n").length;

      // REGULA 2: goly parametr w CASE. Typ wyrazenia nie ma sie skad wziac,
      // gdy druga galaz to NULL albo inny parametr, wiec Postgres schodzi do
      // `text` i zapis pada dopiero przy kolumnie, na produkcji, u klienta.
      for (const wyrazenie of wyrazeniaCase(kod)) {
        for (const m of wyrazenie.matchAll(/\$(\d+)(?!\d)(?!\s*::)/g)) {
          bledy.push(
            `${relative(ROOT, plik)}:${linia()}  parametr $${m[1]} stoi w CASE bez rzutowania. ` +
            `Galaz NULL nie niesie typu, wiec Postgres rozstrzygnie cale wyrazenie jako text.`
          );
        }
      }

      const zRzutowaniem = new Set([...kod.matchAll(/\$(\d+)\s*::\s*[A-Za-z]/g)].map((m) => m[1]));
      if (!zRzutowaniem.size) continue;
      for (const nr of zRzutowaniem) {
        // Goly parametr: `$n` bez rzutowania i bez cyfry obok (zeby `$2` nie
        // zlapalo `$23`).
        const goly = new RegExp(`\\$${nr}(?!\\d)(?!\\s*::)`);
        if (goly.test(kod)) {
          bledy.push(
            `${relative(ROOT, plik)}:${linia()}  parametr $${nr} raz z rzutowaniem, raz bez. ` +
            `Postgres rozstrzygnie go jako text i wpis padnie przy kolumnie o innym typie.`
          );
        }
      }
    }
  }
}

if (bledy.length) {
  console.error("\nParametry SQL bez rozstrzygnietego typu:\n");
  for (const b of bledy) console.error(`  ✗ ${b}`);
  console.error("\nDopisz rzutowanie: to samo w kazdym wystapieniu, i zawsze w CASE.\n");
  process.exit(1);
}
console.log("Parametry SQL: kazdy ma jeden typ we wszystkich wystapieniach");
