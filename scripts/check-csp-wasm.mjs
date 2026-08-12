#!/usr/bin/env node
// ============================================================
// STRAZNIK: CSP kontra WebAssembly
// ============================================================
// Serwis uruchamia WebAssembly w przegladarce w dwoch miejscach:
// `occt-import-js` czyta pliki STEP wgrywane przez klienta, a `manifold-3d`
// buduje bryle w kreatorze pierscionkow. Polityka bezpieczenstwa musi na to
// pozwolic, inaczej przegladarka odmawia kompilacji modulu:
//
//   Aborted(CompileError: WebAssembly.instantiate(): Compiling or
//   instantiating WebAssembly module violates the following Content
//   Security policy directive because 'unsafe-eval' is not an allowed
//   source of script...)
//
// Ten straznik istnieje, bo tego bledu NIE WIDAC lokalnie. `npx serve` i
// `vite preview` nie stosuja `public/_headers`, wiec narzedzie dziala na
// komputerze i przewraca sie dopiero po wdrozeniu. Wgrywanie plikow STEP
// bylo tak zepsute i nikt tego nie zauwazyl.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const headers = readFileSync(join(ROOT, "public", "_headers"), "utf8");

// Czy w ogole wysylamy WebAssembly do przegladarki
const wasmSources = [];
const scan = (dir, rel = "") => {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) scan(join(dir, e.name), `${rel}/${e.name}`);
    else if (e.name.endsWith(".wasm")) wasmSources.push(`${rel}/${e.name}`);
  }
};
scan(join(ROOT, "public"));
const importsWasm = /manifold-3d|occt-import-js/.test(
  readFileSync(join(ROOT, "package.json"), "utf8"),
);

if (!wasmSources.length && !importsWasm) {
  console.log("CSP: serwis nie uzywa WebAssembly, nic do sprawdzenia");
  process.exit(0);
}

// `_headers` jest podzielone na sekcje wedlug sciezki, a polityka watku
// roboczego celowo rozni sie od polityki dokumentu, wiec czytamy obie.
const sections = [];
{
  let cur = null;
  for (const line of headers.split("\n")) {
    if (/^\//.test(line)) { cur = { path: line.trim(), csp: null, cache: null }; sections.push(cur); }
    else if (cur && line.trim().startsWith("Content-Security-Policy:")) {
      cur.csp = line.slice(line.indexOf(":") + 1).trim();
    } else if (cur && line.trim().startsWith("Cache-Control:")) {
      cur.cache = line.slice(line.indexOf(":") + 1).trim();
    }
  }
}
const docSection = sections.find((s) => s.path === "/*" && s.csp);
const assetSection = sections.find((s) => s.path.startsWith("/assets") && s.csp);

if (!docSection) {
  console.error("  ✗ Brak naglowka Content-Security-Policy dla dokumentu w public/_headers");
  process.exit(1);
}
const csp = docSection.csp;
const scriptSrc = (csp.match(/script-src ([^;]+)/) || [])[1] || "";

const problems = [];
if (!/'wasm-unsafe-eval'|'unsafe-eval'/.test(scriptSrc)) {
  problems.push(
    "script-src nie pozwala na WebAssembly. Dodaj 'wasm-unsafe-eval', inaczej\n" +
    "    czytanie plikow STEP i kreator pierscionkow przewroca sie na produkcji,\n" +
    "    a lokalnie beda dzialac, bo `_headers` nie jest tam stosowany.",
  );
}
// Dokument NIE moze miec `unsafe-eval`. Strony platnosci chodza pod ta sama
// polityka, a embind potrzebuje `eval` wylacznie w watku roboczym.
if (/'unsafe-eval'/.test(scriptSrc)) {
  problems.push(
    "polityka DOKUMENTU ma 'unsafe-eval'. Watek roboczy bierze polityke z naglowkow\n" +
    "    wlasnego pliku, wiec poluzowanie nalezy do sekcji /assets, a nie tutaj.",
  );
}

// Embind buduje funkcje przez `new Function`, wiec sam `wasm-unsafe-eval` nie
// wystarcza. Bez tej sekcji kreator przewraca sie z komunikatem
// "Refused to evaluate a string as JavaScript", i to WYLACZNIE na produkcji.
if (!assetSection || !/'unsafe-eval'/.test(assetSection.csp)) {
  problems.push(
    "sekcja /assets/* nie daje watkom roboczym 'unsafe-eval'. Generator pierscionkow\n" +
    "    nie zbuduje bryly, bo embind tworzy funkcje przez `new Function`.",
  );
}

// Polityka moze byc poprawna i mimo to nie dotrzec: przychodzi razem
// z dokumentem, wiec dokument w cache niesie takze stara polityke.
const docCache = sections.find((x) => x.path === "/*")?.cache;
if (!docCache || !/max-age=0|no-cache|must-revalidate/.test(docCache)) {
  problems.push(
    "sekcja /* nie wymusza odswiezania HTML. Polityka bezpieczenstwa jedzie razem\n" +
    "    z dokumentem, wiec bez tego jej poprawka nie dotrze do nikogo, kto strone\n" +
    "    juz odwiedzil, a wyglada to jak niewdrozona zmiana.",
  );
}

if (problems.length) {
  console.error("\nPolityka bezpieczenstwa kontra WebAssembly:\n");
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error("");
  process.exit(1);
}
console.log(`CSP: WebAssembly dozwolone (${wasmSources.length} plikow .wasm w public/)`);
