// ============================================================
// PODGLAD RYSUNKU: czy pokazuje rysunek, czy arkusz
// ============================================================
// Podglad rysunku ma jedno zadanie: pozwolic klientowi sprawdzic, ze wgral
// ten plik, ktory chcial. Zawodzi po cichu, bo cos jednak pokazuje:
//
//   - parser przestaje zwracac polozenie tresci -> przyciecie sie wylacza
//     i wracamy do znaczka na pustym tle, ale nic nie krzyczy,
//   - dopasowanie zaczyna POMNIEJSZAC -> rysunek wypelniajacy arkusz nagle
//     kurczy sie do polowy ramki,
//   - ktos wstawia cudzy SVG wprost do drzewa strony, zeby latwiej bylo go
//     skalowac -> plik klienta moze wykonac skrypt na naszej domenie.
//
// Ostatni punkt jest powodem, dla ktorego ten test istnieje takze wtedy,
// gdy podglad wyglada dobrze.

import { readFileSync } from "node:fs";
import { fitToContent } from "../src/utils/vectorFit.js";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const sekcja = (n) => console.log(`\n${n}`);
const blisko = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

const RAMKA = { w: 600, h: 180 };
const A4 = { x: 0, y: 0, w: 210, h: 297 };

// --- 1. Znak w rogu arkusza ----------------------------------------------
sekcja("1. Maly znak na duzym arkuszu");
const znak = { x: 180, y: 10, w: 20, h: 20 };
const dopasowanieZnaku = fitToContent(RAMKA, znak, A4);
if (!(dopasowanieZnaku.k > 5)) {
  zle(`znak 20x20 mm na A4 powiekszony tylko ${dopasowanieZnaku.k.toFixed(2)}x: podglad dalej pokazuje glownie tlo`);
}
// Przesuniecie musi isc W STRONE srodka: znak lezy w prawym gornym rogu,
// wiec jedzie w lewo i w dol.
if (!(dopasowanieZnaku.dx < 0)) zle("znak z prawej strony arkusza nie zostal przesuniety w lewo");
if (!(dopasowanieZnaku.dy > 0)) zle("znak z gory arkusza nie zostal przesuniety w dol");
console.log(`  powiekszenie ${dopasowanieZnaku.k.toFixed(1)}x, przesuniecie ${dopasowanieZnaku.dx.toFixed(0)}, ${dopasowanieZnaku.dy.toFixed(0)} px`);

// --- 2. Rysunek na cale plotno -------------------------------------------
sekcja("2. Rysunek wypelniajacy plotno zostaje bez zmian");
const pelny = fitToContent(RAMKA, { ...A4 }, A4);
if (!blisko(pelny.k, 1)) zle(`rysunek na cale plotno przeskalowany ${pelny.k}, a powinien zostac 1`);
if (!blisko(pelny.dx, 0) || !blisko(pelny.dy, 0)) zle("rysunek na cale plotno zostal przesuniety, choc juz jest na srodku");

// Nigdy nie pomniejszamy: to dolozyloby pustki zamiast ja usunac.
const szerokiRysunek = fitToContent({ w: 100, h: 100 }, { x: 0, y: 0, w: 1000, h: 1000 }, { x: 0, y: 0, w: 1000, h: 1000 });
if (szerokiRysunek.k < 1) zle(`dopasowanie POMNIEJSZA (${szerokiRysunek.k}), a mialo tylko przyblizac`);
console.log("  bez zmiany skali i bez przesuniecia, pomniejszenie niemozliwe");

// --- 3. Brakujace dane nie wywracaja podgladu ----------------------------
sekcja("3. Brak danych o polozeniu tresci");
for (const [opis, wynik] of [
  ["brak obu prostokatow", fitToContent(RAMKA, null, null)],
  ["brak plotna", fitToContent(RAMKA, znak, null)],
  ["plotno zerowe", fitToContent(RAMKA, znak, { x: 0, y: 0, w: 0, h: 0 })],
  ["ramka niezmierzona", fitToContent({ w: 0, h: 0 }, znak, A4)],
]) {
  if (!blisko(wynik.k, 1) || !blisko(wynik.dx, 0) || !blisko(wynik.dy, 0)) {
    zle(`${opis}: podglad dostal transformacje zamiast neutralnej (${JSON.stringify(wynik)})`);
  }
}
console.log("  cztery przypadki brzegowe konczą sie neutralnym podgladem, bez wywrotki");

// --- 4. Parser oddaje polozenie tresci -----------------------------------
sekcja("4. Parser zwraca oba prostokaty");
const parser = readFileSync(new URL("../src/utils/svgParser.js", import.meta.url), "utf8");
for (const pole of ["contentBox", "canvasBox"]) {
  if (!new RegExp(`\\n\\s*${pole},`).test(parser)) zle(`parser SVG nie zwraca \`${pole}\`, przyciecie do tresci sie wylaczy`);
}
if (!/bb\.x/.test(parser) || !/bb\.y/.test(parser)) {
  zle("parser nie czyta POLOZENIA tresci (bb.x, bb.y), tylko jej rozmiar");
}
console.log("  contentBox i canvasBox wracaja z parsera");

// --- 5. Cudzy SVG nie trafia do drzewa strony ----------------------------
sekcja("5. Plik klienta zostaje w <img>");
const podglad = readFileSync(new URL("../src/components/calculators/VectorPreview.jsx", import.meta.url), "utf8");
if (/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(podglad)) {
  zle("podglad wstawia cudzy SVG do drzewa strony: plik klienta moze wykonac skrypt na naszej domenie");
}
if (!/<img/.test(podglad)) zle("podglad nie rysuje rysunku przez <img>");

// Kolko musi byc podpiete WPROST, jako listener nie-pasywny. React rejestruje
// `onWheel` na korzeniu strony pasywnie: przyblizanie wtedy nie dziala, a
// strona przewija sie pod kursorem. Sprawdzone w przegladarce, dlatego stoi
// tu na stale.
if (/onWheel=/.test(podglad)) {
  zle("kolko podpiete przez onWheel: React robi to pasywnie, wiec strona przewija sie zamiast przyblizac");
}
if (!/addEventListener\("wheel"[^)]*\{\s*passive:\s*false/.test(podglad)) {
  zle("brak nie-pasywnego listenera kolka, przyblizanie nie zadziala");
}
console.log("  brak wstrzykiwania znacznikow, <img>, kolko podpiete nie-pasywnie");

// --- 6. Oba miejsca podaja prostokaty ------------------------------------
sekcja("6. Oba kalkulatory podaja podgladowi dane");
for (const plik of [
  "../src/components/calculators/SimpleStudioCalc.jsx",
  "../src/components/calculators/SVGUploadCard.jsx",
]) {
  const tresc = readFileSync(new URL(plik, import.meta.url), "utf8");
  const nazwa = plik.split("/").pop();
  if (!/<VectorPreview/.test(tresc)) zle(`${nazwa} nie uzywa wspolnego podgladu`);
  if (!/contentBox=\{/.test(tresc)) zle(`${nazwa} nie podaje contentBox, podglad nie przytnie do tresci`);
  if (!/canvasBox=\{/.test(tresc)) zle(`${nazwa} nie podaje canvasBox, podglad nie przytnie do tresci`);
  // Stary podglad rysowal `<img>` wprost i to on pokazywal pustke.
  if (/<img src=\{(svgBlobUrl|blobUrl)\}/.test(tresc)) zle(`${nazwa} rysuje rysunek starym sposobem, z pominieciem dopasowania`);
}
console.log("  szybka wycena i tryb zaawansowany korzystaja z tego samego podgladu");

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: podglad rysunku pokazuje rysunek, nie arkusz.");
