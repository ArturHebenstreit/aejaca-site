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

/** Polityka rozbita na dyrektywy: `script-src` -> zbior zrodel. */
const directives = (csp) => {
  const out = new Map();
  for (const part of csp.split(";")) {
    const [name, ...src] = part.trim().split(/\s+/);
    if (name) out.set(name.toLowerCase(), new Set(src));
  }
  return out;
};

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
// Embind buduje funkcje wywolujace przez `new Function`, wiec samo
// `wasm-unsafe-eval` nie wystarcza i przegladarka odmawia z komunikatem
// "Evaluating a string as JavaScript violates...". Dyrektywy potrzebuje
// kalkulator druku, sprawdzarka drukowalnosci, konfigurator uslugi w sklepie
// i kreator pierscionkow, czyli szeroki kawalek serwisu, a nie jedna strona.
if (!/'unsafe-eval'/.test(scriptSrc)) {
  problems.push(
    "polityka ogolna nie ma 'unsafe-eval'. Embind tworzy funkcje przez\n" +
    "    `new Function`, wiec bez tego kreator i czytanie plikow STEP przewroca sie\n" +
    "    na produkcji. Wezsza sekcja tego NIE naprawi, patrz sprawdzenie nizej.",
  );
}

// NAJWAZNIEJSZE sprawdzenie w tym pliku, bo kosztowalo trzy wdrozenia.
//
// Cloudflare stosuje wszystkie pasujace reguly, wiec przy dwoch politykach
// przegladarka egzekwuje ich CZESC WSPOLNA. Wezsza sekcja moze polityke
// wylacznie zawezic. Zrodlo dopisane w wezszej sekcji, a nieobecne w ogolnej,
// nie dziala i nie daje o sobie znac inaczej niz bledem na produkcji.
const docDirectives = directives(csp);
for (const s of sections) {
  if (s.path === "/*" || !s.csp) continue;
  for (const [name, sources] of directives(s.csp)) {
    const allowed = docDirectives.get(name);
    if (!allowed) continue;
    const extra = [...sources].filter((x) => !allowed.has(x));
    if (extra.length) {
      problems.push(
        `sekcja ${s.path} dopisuje do ${name} zrodla, ktorych nie ma w regule ogolnej:\n` +
        `    ${extra.join(" ")}\n` +
        "    Wezsza regula moze polityke tylko ZAWEZIC, bo przegladarka dostaje obie\n" +
        "    i egzekwuje czesc wspolna. To poluzowanie nie zadziala.",
      );
    }
  }
}

// Strony platnicze zostaja ostrzejsze. To jedyne miejsca, gdzie klient podaje
// dane i placi, a zadne z nich nie czyta plikow ani nie liczy geometrii.
for (const path of ["/cart", "/checkout", "/order"]) {
  const sec = sections.find((s) => s.path.startsWith(path) && s.csp);
  if (!sec) {
    problems.push(
      `brak wlasnej, ostrzejszej polityki dla ${path}*. Regula ogolna ma 'unsafe-eval',\n` +
      "    wiec bez tej sekcji dostaja je takze strony platnicze.",
    );
    continue;
  }
  const secScript = (sec.csp.match(/script-src ([^;]+)/) || [])[1] || "";
  if (/'unsafe-eval'/.test(secScript)) {
    problems.push(`sekcja ${sec.path} ma 'unsafe-eval'. Strony platnicze maja byc bez niego.`);
  }
  // Przy laczeniu polityk brakujacy adres jest ZABRONIONY, a nie pominiety,
  // wiec zgubienie domen platnosci zatrzymaloby przelew bez komunikatu.
  for (const need of ["https://pay.autopay.eu", "https://testpay.autopay.eu"]) {
    if (!sec.csp.includes(need)) {
      problems.push(
        `sekcja ${sec.path} nie wymienia ${need} w form-action. Przy laczeniu polityk\n` +
        "    brak adresu znaczy zakaz, wiec formularz platnosci zostalby zablokowany.",
      );
    }
  }
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
