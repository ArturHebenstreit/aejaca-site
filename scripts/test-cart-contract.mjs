// ============================================================
// POZYCJA W KOSZYKU JEST TRESCIA UMOWY
// ============================================================
// Klient placi za to, co widzi w koszyku, i tylko na to sie zgadza. Jesli
// wybral akryl 5 mm, a koszyk pokazuje sama nazwe uslugi, to przy sporze nie
// da sie odtworzyc, na co przystal: my mamy w bazie jedno, on pamieta drugie,
// i nikt nie ma dowodu.
//
// Awaria jest cicha i ujawnia sie NAJPOZNIEJ ze wszystkich, bo dopiero przy
// reklamacji, kiedy pozycja ma juz kilka tygodni. Kod dziala, zamowienie
// wychodzi, pieniadze wplywaja.
//
// Slownik ustalen czytamy z kart uslug (`orderCatalog.js`), wiec nowa opcja
// pojawi sie w koszyku sama. Ten test sprawdza, czy nadal tak jest.

import { readFileSync } from "node:fs";
import { describeParams, describeParamsLine } from "../src/data/describeParams.js";
import { SERVICES } from "../src/data/orderCatalog.js";

const LANGS = ["pl", "en", "de"];
let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);

// --- 1. Kazda usluga umie opisac swoja domyslna konfiguracje --------------
sekcja("1. Kazda usluga opisuje swoje ustalenia");
for (const usluga of SERVICES) {
  const pozycja = { serviceId: usluga.id, calculator: usluga.calculator, params: { ...(usluga.defaults || {}) } };
  const polaWyboru = (usluga.fields || []).filter(
    (f) => (f.options || []).length || typeof f.optionsFrom === "function"
  );
  if (!polaWyboru.length) continue;

  for (const lang of LANGS) {
    const opis = describeParams(pozycja, lang);
    if (!opis.length) {
      zle(`${usluga.id}/${lang}: pozycja nie pokazuje zadnego ustalenia, choc ma ${polaWyboru.length} pol wyboru`);
      continue;
    }
    const puste = opis.filter((w) => !w.label || !w.value);
    if (puste.length) zle(`${usluga.id}/${lang}: ustalenie bez nazwy albo bez wartosci`);
    // Surowy identyfikator zamiast nazwy znaczy, ze etykieta nie istnieje
    // w tym jezyku: klient zobaczylby "acr5" i nic by z tego nie wynioslo.
    // Wartosc pokazana jako identyfikator znaczy, ze nie znalezlismy dla niej
    // nazwy: klient zobaczylby "acr5" albo "standard" i nic by z tego nie
    // wynioslo. Listy zalezne (`optionsFrom`) tez licza sie do sprawdzenia,
    // bo to wlasnie one wypadaly po cichu.
    const surowe = opis.filter((w) => {
      const v = String(w.value);
      if (!/^[a-z0-9_]+$/.test(v)) return false;
      return polaWyboru.some((f) => {
        const opcje = (f.options || []).length ? f.options : (f.optionsFrom?.(usluga.defaults || {}) || []);
        return opcje.some((o) => String(o.id) === v);
      });
    });
    if (surowe.length) {
      zle(`${usluga.id}/${lang}: wartosc pokazana jako identyfikator: ${surowe.map((w) => w.value).join(", ")}`);
    }
  }
}
ok(`${SERVICES.length} uslug, kazda opisuje swoja konfiguracje w trzech jezykach`);

// --- 2. Material jest widoczny, bo od niego zalezy wykonanie --------------
sekcja("2. Material widoczny w pozycji");
const ciecie = {
  serviceId: "laser_cut", calculator: "laser_co2_cut",
  params: { matId: "acr5", pathId: "S", complexId: "moderate", quantityId: "proto", podloze: "our_stock" },
};
const opisCiecia = describeParams(ciecie, "pl");
if (!opisCiecia.some((w) => /Akryl 5mm/.test(w.value))) {
  zle(`wybrany material nie pojawia sie w pozycji: ${describeParamsLine(ciecie, "pl")}`);
}
if (!opisCiecia.some((w) => /materiale AEJaCA/i.test(w.value))) {
  zle("nie widac, kto dostarcza material, a od tego zalezy, czy jest w cenie");
}
ok(`ciecie: ${describeParamsLine(ciecie, "pl")}`);

// --- 3. Pola techniczne nie zasmiecaja umowy -----------------------------
sekcja("3. Bez pol technicznych");
const zGeometria = {
  serviceId: "laser_cut", calculator: "laser_co2_cut",
  params: { matId: "ply3", pathId: "S", complexId: "moderate", quantityId: "proto",
    svgData: { pathLengthCm: 120 }, stlData: { volumeCm3: 1 }, printability: { blocked: false }, stockId: "ply3" },
};
const opisTech = describeParams(zGeometria, "pl");
// Liczba wierszy musi odpowiadac ZADEKLAROWANYM polom uslugi, ktore maja
// wartosc. Kto kiedys przepisze to na `Object.keys(params)`, dostanie tu
// czerwone swiatlo, zanim geometria trafi do umowy jako [object Object].
const uslugaCiecia = SERVICES.find((u) => u.id === "laser_cut");
const oczekiwane = (uslugaCiecia.fields || []).filter((f) => zGeometria.params[f.key] != null && zGeometria.params[f.key] !== "").length;
if (opisTech.length !== oczekiwane) {
  zle(`opis ma ${opisTech.length} wierszy zamiast ${oczekiwane}: ${opisTech.map((w) => w.label).join(", ")}`);
}
for (const zakazane of ["svgData", "stlData", "printability", "stockId"]) {
  if (opisTech.some((w) => w.label === zakazane)) zle(`pole techniczne "${zakazane}" wycieklo do umowy`);
}
if (opisTech.some((w) => String(w.value).includes("[object"))) zle("obiekt wypisany jako [object Object]");
ok(`geometria i wynik bramki zostaja poza opisem (${opisTech.length} wierszy)`);

// --- 4. Pozycja bez parametrow nie wywraca widoku ------------------------
sekcja("4. Przypadki brzegowe");
for (const [opis, pozycja] of [
  ["brak pozycji", null],
  ["brak params", { serviceId: "laser_cut" }],
  ["params to nie obiekt", { serviceId: "laser_cut", params: "akryl" }],
  ["nieznana usluga", { serviceId: "nie_ma_takiej", params: { matId: "acr5" } }],
]) {
  const w = describeParams(pozycja, "pl");
  if (!Array.isArray(w)) zle(`${opis}: opis nie jest lista, widok koszyka by sie wywrocil`);
}
ok("cztery przypadki brzegowe zwracaja pusta liste zamiast bledu");

// --- 5. Koszyk i podsumowanie platnosci pokazuja to samo -----------------
sekcja("5. Oba ekrany pokazuja ustalenia");
for (const plik of ["../src/pages/Cart.jsx", "../src/pages/Checkout.jsx"]) {
  const tresc = readFileSync(new URL(plik, import.meta.url), "utf8");
  const nazwa = plik.split("/").pop();
  if (!/describeParams\(i, lang\)/.test(tresc)) {
    zle(`${nazwa} nie wypisuje ustalen pozycji, wiec klient placi za cos, czego nie widzi`);
  }
}
ok("koszyk i ostatni ekran przed platnoscia wypisuja te same ustalenia");

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: pozycja w koszyku pokazuje wszystko, na co klient przystaje.");
