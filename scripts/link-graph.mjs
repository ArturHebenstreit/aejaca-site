// ============================================================
// GRAF LINKOW WEWNETRZNYCH
// ============================================================
// Liczy, ile odnosnikow prowadzi do kazdej grupy stron w zbudowanym serwisie,
// osobno wszystkie i osobno te spoza naglowka i stopki.
//
// Powstal, bo audyt pokazal, ze polityka prywatnosci dostawala trzydziesci
// osiem razy wiecej linkow wewnetrznych niz wpis blogowy. Stopka linkuje do
// pietnastu miejsc z kazdej z dziewiecdziesieciu trzech stron, wiec regulaminy
// dostaja tyle samo uwagi co oferta. Regulaminow nie da sie odlinkowac, bo
// czesc musi byc dostepna przy zamowieniu, wiec jedyna dzwignia jest podniesc
// tresc.
//
// Uruchomienie: npm run build && node scripts/link-graph.mjs
// Nie jest wpiety w build: to miernik, nie straznik. Nie ma tu progu, ktory
// dalo by sie uczciwie ustawic, jest tylko liczba do porownania w czasie.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
const pliki = execSync('find dist -name "index.html"', {encoding:"utf8"}).trim().split("\n");
const wchodzace = new Map();   // wszystkie linki
const kontekstowe = new Map(); // poza <header> i <footer>
for (const f of pliki) {
  const html = readFileSync(f, "utf8");
  const body = html.slice(html.indexOf("<body"));
  // Tresc bez naglowka i stopki: wycinamy je zgrubnie po znacznikach.
  let tresc = body;
  for (const tag of ["header","footer","nav"]) {
    tresc = tresc.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "gi"), "");
  }
  const zbierz = (txt, mapa) => {
    for (const m of txt.matchAll(/href="(\/[^"#?]*)"/g)) {
      let u = m[1]; if (!u.endsWith("/")) u += "/";
      mapa.set(u, (mapa.get(u)||0)+1);
    }
  };
  zbierz(body, wchodzace);
  zbierz(tresc, kontekstowe);
}
const grupa = (u) =>
  /^\/(warranty|privacy|returns|terms|shipping)\//.test(u) ? "regulaminowe" :
  /^\/shop/.test(u) ? "sklep" :
  /^\/blog\/.+/.test(u) ? "wpis blogowy" :
  /^\/glossary\/.+/.test(u) ? "haslo slownika" :
  /^\/(druk-3d)/.test(u) ? "strona lokalna" :
  /^\/(jewelry|studio|b2b)\//.test(u) ? "oferta" :
  /^\/(tools)/.test(u) ? "narzedzie" : "inne";
const agg = {};
for (const [u,n] of wchodzace) {
  const g = grupa(u); agg[g] ??= {stron:0, wszystkie:0, kontekst:0};
  agg[g].stron++; agg[g].wszystkie += n; agg[g].kontekst += (kontekstowe.get(u)||0);
}
console.log("grupa".padEnd(15), "stron".padStart(6), "linkow".padStart(8), "sred./strone".padStart(13), "kontekstowych".padStart(14));
for (const [g,v] of Object.entries(agg).sort((a,b)=>b[1].wszystkie/b[1].stron - a[1].wszystkie/a[1].stron))
  console.log(g.padEnd(15), String(v.stron).padStart(6), String(v.wszystkie).padStart(8), (v.wszystkie/v.stron).toFixed(1).padStart(13), String(v.kontekst).padStart(14));
