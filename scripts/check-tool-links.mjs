// ============================================================
// STRAZNIK REJESTRU ODNOSNIKOW DO NARZEDZI
// ============================================================
// Powstal, bo `src/data/toolLinks.js` mial trzy klucze wskazujace na slugi
// wpisow, ktore nie istnieja: "pierscionek-zareczynowy" zamiast
// "pierscionek-zareczynowy-na-zamowienie" i dwa podobne. Nic sie nie
// wywalilo. `getToolsForPost` ma fallback na dwa domyslne narzedzia z tej
// samej kategorii, wiec strona renderowala sie poprawnie, tylko z innymi
// narzedziami niz przypisane recznie. Build przeszedl, prerender wypisal
// 94 strony i zero bledow, a link do wyceny metalu po prostu nie pojawil sie
// tam, gdzie mial.
//
// To dokladnie ten rodzaj usterki, przed ktorym bronia pozostali straznicy
// w tym repozytorium: wyglada dobrze i jest cicho zle.
//
// Sprawdzamy trzy rzeczy:
//   1. kazdy klucz TOOLS_BY_POST odpowiada istniejacemu slugowi wpisu
//   2. kazdy klucz TOOLS_BY_TERM odpowiada istniejacemu hasłu slownika
//   3. kazdy identyfikator narzedzia w wartosciach istnieje w TOOL_LINKS
//
// Celowo NIE wymagamy, zeby kazdy wpis mial narzedzie. Wpisy o projektowaniu
// z AI i o wyposazeniu pracowni sa bez przypisania swiadomie, bo zadne
// narzedzie im nie odpowiada, a wypelniacz szkodzi bardziej niz jego brak.

import { readFileSync } from "node:fs";
import { POSTS_META } from "../src/blog/postsMeta.js";
import { GLOSSARY } from "../src/data/glossary.js";
import { TOOL_LINKS } from "../src/data/toolLinks.js";

const SRC = readFileSync(new URL("../src/data/toolLinks.js", import.meta.url), "utf8");

// Klucze czytamy z tekstu zrodla, bo obie mapy sa prywatne dla modulu.
// Eksportowanie ich tylko po to, zeby dalo sie je sprawdzic, rozszerzyloby
// interfejs modulu dla potrzeb testu, a nie odwrotnie.
function keysOf(declaration) {
  const start = SRC.indexOf(declaration);
  if (start === -1) throw new Error(`Nie znaleziono deklaracji ${declaration} w toolLinks.js`);
  const body = SRC.slice(start, SRC.indexOf("\n};", start));
  return [...body.matchAll(/^\s+"?([a-z0-9-]+)"?:\s*\[([^\]]*)\]/gm)].map((m) => ({
    key: m[1],
    tools: [...m[2].matchAll(/"([a-z0-9-]+)"/g)].map((t) => t[1]),
  }));
}

const postEntries = keysOf("const TOOLS_BY_POST");
const termEntries = keysOf("const TOOLS_BY_TERM");

const slugs = new Set(POSTS_META.map((p) => p.slug));
const termIds = new Set(GLOSSARY.map((t) => t.id));
const toolIds = new Set(TOOL_LINKS.map((t) => t.id));

const problems = [];

for (const { key, tools } of postEntries) {
  if (!slugs.has(key)) problems.push(`TOOLS_BY_POST: "${key}" nie odpowiada zadnemu wpisowi w POSTS_META`);
  for (const id of tools) {
    if (!toolIds.has(id)) problems.push(`TOOLS_BY_POST["${key}"]: narzedzie "${id}" nie istnieje w TOOL_LINKS`);
  }
}

for (const { key, tools } of termEntries) {
  if (!termIds.has(key)) problems.push(`TOOLS_BY_TERM: "${key}" nie odpowiada zadnemu hasłu w GLOSSARY`);
  for (const id of tools) {
    if (!toolIds.has(id)) problems.push(`TOOLS_BY_TERM["${key}"]: narzedzie "${id}" nie istnieje w TOOL_LINKS`);
  }
}

// Kazde narzedzie musi miec komplet pol, bo brak tlumaczenia objawia sie
// dopiero u czytelnika w danym jezyku.
for (const t of TOOL_LINKS) {
  for (const lang of ["pl", "en", "de"]) {
    if (!t.label?.[lang]) problems.push(`TOOL_LINKS "${t.id}": brak label.${lang}`);
    if (!t.desc?.[lang]) problems.push(`TOOL_LINKS "${t.id}": brak desc.${lang}`);
  }
  if (!["buyer", "maker", "both"].includes(t.audience)) {
    problems.push(`TOOL_LINKS "${t.id}": audience musi byc buyer, maker albo both, jest "${t.audience}"`);
  }
  if (!t.to?.startsWith("/") || !t.to.endsWith("/")) {
    problems.push(`TOOL_LINKS "${t.id}": sciezka "${t.to}" musi zaczynac sie i konczyc ukosnikiem`);
  }
}

// ------------------------------------------------------------
// 4. Odnosnik "sprawdz, zanim zamowisz" przy przycisku koszyka
// ------------------------------------------------------------
// Sekcja z narzedziami lezy POD calym kalkulatorem, czyli za decyzja o zakupie.
// Klient, ktory wlasnie dodaje do koszyka, konczy w koszyku i nigdy tam nie
// dojezdza, wiec sprawdzarka modeli, ktora ma go uchronic przed zamowieniem
// niedrukowalnego pliku, nie ma jak zadzialac. Panel akcji dostal wiec wlasny
// odnosnik, a ten test pilnuje, zeby wskazywal istniejace narzedzia i zeby
// kalkulatory druku faktycznie podawaly swoja technologie.
{
  const shared = readFileSync(new URL("../src/components/calculators/calcShared.jsx", import.meta.url), "utf8");
  const blok = /const CHECK_TOOLS = \{([\s\S]*?)\};/.exec(shared)?.[1] || "";
  // Tylko wartosci z nawiasow kwadratowych: klucz "3dprint" to technologia,
  // a nie narzedzie, i bez tego zawezenia test bralby go za identyfikator.
  const uzyte = [...blok.matchAll(/\[([^\]]*)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]));

  if (!uzyte.length) {
    problems.push("calcShared: CHECK_TOOLS jest puste, przycisk koszyka nie prowadzi do zadnego narzedzia");
  }
  for (const id of uzyte) {
    if (!TOOL_LINKS.some((t) => t.id === id)) {
      problems.push(`calcShared CHECK_TOOLS wskazuje na narzedzie "${id}", ktorego nie ma w TOOL_LINKS`);
    }
  }
  // Narzedzia warsztatowe nie moga trafic do kupujacego przy koszyku.
  for (const id of uzyte) {
    const narzedzie = TOOL_LINKS.find((t) => t.id === id);
    if (narzedzie && narzedzie.audience === "maker") {
      problems.push(`calcShared CHECK_TOOLS podsuwa kupujacemu narzedzie warsztatowe "${id}"`);
    }
  }
  if (!/l\.checkFirst/.test(shared)) {
    problems.push("calcShared: odnosnik do narzedzi nie ma naglowka, wiec nie wiadomo, po co tam jest");
  }

  const print3d = readFileSync(new URL("../src/components/calculators/Print3DCalc.jsx", import.meta.url), "utf8");
  if (!/tech="msla"/.test(print3d) || !/tech="3dprint"/.test(print3d)) {
    problems.push("Print3DCalc nie podaje technologii do panelu akcji, wiec odnosnik do narzedzi sie nie pokaze");
  }
  const simple = readFileSync(new URL("../src/components/calculators/SimpleStudioCalc.jsx", import.meta.url), "utf8");
  if (!/tech=\{activeResolved\?\.tech/.test(simple)) {
    problems.push("SimpleStudioCalc nie podaje technologii do panelu akcji");
  }
}

if (problems.length) {
  console.error("check-tool-links: rejestr narzedzi rozjechal sie z trescia\n");
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nKlucz, ktory nie pasuje do zadnego slugu, nie wywala buildu sam z siebie:" +
    "\ngetToolsForPost ma fallback, wiec strona pokaze DOMYSLNE narzedzia zamiast przypisanych."
  );
  process.exit(1);
}

const mappedPosts = postEntries.length;
const mappedTerms = termEntries.length;
console.log(
  `check-tool-links: OK (${TOOL_LINKS.length} narzedzi, ` +
  `${mappedPosts}/${slugs.size} wpisow i ${mappedTerms}/${termIds.size} hasel z przypisaniem)`
);
