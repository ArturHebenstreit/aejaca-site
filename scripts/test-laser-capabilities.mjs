// ============================================================
// CO MASZYNA UMIE ZROBIC, A CZEGO NIE
// ============================================================
// Ten test pilnuje jednej rzeczy: zeby oferta nie obiecala roboty, ktorej
// maszyna nie wykona. Szklo da sie grawerowac i nie da sie przeciac laserem
// CO2; metalu ten laser nie rusza w ogole, od tego jest swiatlowod. To nie
// sa nasze decyzje handlowe, tylko fizyka, wiec stoja tu wypisane wprost.
//
// Awaria jest tu wyjatkowo kosztowna, bo ujawnia sie DOPIERO PRZY MASZYNIE.
// Klient placi, dostaje potwierdzenie, my rezerwujemy czas, a zlecenie
// odbija sie o rzeczywistosc dzien pozniej. Nic w kodzie nie krzyknie:
// wystarczy, ze ktos dopisze szklo do listy ciecia, bo "przeciez szklo
// grawerujemy".
//
// Zrodlem jest dokladnie jedna para tablic w cenniku: material da sie ciac
// wtedy i tylko wtedy, gdy jest w `CUT_MATERIALS`. Sklep, tryb zaawansowany
// i szybka wycena czytaja te same tablice, wiec spojnosc miedzy nimi jest
// wlasnoscia konstrukcji, a nie rzecza do pilnowania. Test sprawdza, czy to
// nadal prawda.

import { readFileSync } from "node:fs";
import { ENGRAVE_MATERIALS, CUT_MATERIALS } from "../src/pricing/laserCo2.js";
import { MATERIALS as FIBER_MATERIALS } from "../src/pricing/laserFiber.js";
import { TECH_FROM_MATERIAL } from "../src/pricing/simpleQuote.js";
import { stockOptions } from "../src/data/ourStock.js";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);

const idCiecia = new Set(CUT_MATERIALS.filter((m) => !m.custom).map((m) => m.id));
const idGraweru = new Set(ENGRAVE_MATERIALS.filter((m) => !m.custom).map((m) => m.id));
const idFibera = new Set(FIBER_MATERIALS.filter((m) => !m.custom).map((m) => m.id));

// --- 1. Czego xTool P2 nie przetnie -------------------------------------
sekcja("1. Grawerowac tak, przeciac nie (xTool P2, CO2 55 W)");
// Szklo peka od naprezen termicznych zamiast sie przecinac, kamien jest
// niepalny i wiazka go tylko matowi, a lite drewno powyzej 10 mm zweglaja
// sie szybciej, niz laser zdazy przejsc na wylot.
const TYLKO_GRAWER = ["glass", "stone", "wood_thick"];
for (const id of TYLKO_GRAWER) {
  if (!idGraweru.has(id)) zle(`${id}: zniknal z listy grawerowania, choc grawerujemy go normalnie`);
  if (idCiecia.has(id)) zle(`${id}: da sie wybrac do CIECIA, a laser CO2 tego nie przetnie`);
}
ok(`${TYLKO_GRAWER.join(", ")}: tylko grawerowanie`);

// --- 2. Metal nie nalezy do CO2 -----------------------------------------
sekcja("2. Metal idzie na swiatlowod, nie na CO2");
for (const id of idFibera) {
  if (idCiecia.has(id) || idGraweru.has(id)) zle(`${id}: metal wyciekl na liste CO2`);
}
for (const id of [...idCiecia, ...idGraweru]) {
  if (idFibera.has(id)) zle(`${id}: material CO2 wyciekl na liste swiatlowodu`);
}
if (TECH_FROM_MATERIAL.metal !== "fiber") {
  zle(`kafelek "Metal" prowadzi do ${TECH_FROM_MATERIAL.metal}, a metal znakujemy swiatlowodem`);
}
// Pytanie "ciecie czy grawerowanie" dotyczy WYLACZNIE CO2. Gdy klient wybral
// metal, wycena idzie swiatlowodem, wiec karta trybu nie ma sie z czego wziac.
const simple = readFileSync(new URL("../src/components/calculators/SimpleStudioCalc.jsx", import.meta.url), "utf8");
if (!/const isVectorCo2 = fileType === "svg" && resolved\?\.tech === "co2"/.test(simple)) {
  zle("karta ciecie/grawerowanie nie jest juz zwiazana z technologia CO2: przy metalu moze zostac widoczna");
}
ok("metal prowadzi do swiatlowodu, karta ciecie/grawer zwiazana z CO2");

// --- 3. Kazdy material do ciecia da sie tez grawerowac -------------------
sekcja("3. Ciecie zaklada grawerowanie");
// Nie na odwrot: to, co przecinamy, mozemy tez oznaczyc na powierzchni.
// Lista ciecia niesie grubosci ("Sklejka 3mm"), wiec porownujemy rodziny.
const RODZINA = { ply2: "plywood", ply3: "plywood", ply5: "plywood", ply8: "plywood", wood10: "wood",
  acr3: "acrylic", acr5: "acrylic", acr8: "acrylic", leather2: "leather", leather4: "leather",
  paper: "paper", fabric: "fabric", rubber: "rubber" };
for (const id of idCiecia) {
  const rodzina = RODZINA[id];
  if (!rodzina) { zle(`${id}: material do ciecia bez przypisanej rodziny, nie wiadomo, czy go grawerujemy`); continue; }
  if (!idGraweru.has(rodzina)) zle(`${id}: tniemy, ale rodziny "${rodzina}" nie ma na liscie grawerowania`);
}
ok(`${idCiecia.size} materialow do ciecia, kazdy ma odpowiednik w grawerowaniu`);

// --- 4. Lite drewno: 10 mm tniemy, grubsze tylko znakujemy ---------------
sekcja("4. Lite drewno");
if (!idCiecia.has("wood10")) zle("brak litego drewna 10 mm w cieciu");
if (!idGraweru.has("wood_thick")) zle("brak litego drewna powyzej 10 mm w grawerowaniu");
const cieteDrewno = stockOptions({ tech: "co2", mode: "cut", material: "wood" }).map((o) => o.id);
if (cieteDrewno.includes("wood_thick")) zle("grube lite drewno widac w wyborze do ciecia");
ok(`ciecie drewna: ${cieteDrewno.join(", ")}`);

// --- 5. Sklep i tryb zaawansowany czytaja te same tablice ----------------
sekcja("5. Sklep i tryb zaawansowany bez wlasnych kopii list");
const sklep = readFileSync(new URL("../src/data/orderCatalog.js", import.meta.url), "utf8");
const wymagane = [
  ['laser_engrave -> ENGRAVE_MATERIALS', /calculator: "laser_co2_engrave"[\s\S]{0,900}?options: ENGRAVE_MATERIALS/],
  ['laser_cut -> CUT_MATERIALS', /calculator: "laser_co2_cut"[\s\S]{0,900}?options: CUT_MATERIALS/],
];
for (const [opis, wzor] of wymagane) {
  if (!wzor.test(sklep)) zle(`sklep: ${opis} nie czyta listy z cennika, wiec moze sie z nia rozjechac`);
}
const co2Calc = readFileSync(new URL("../src/components/calculators/CO2LaserCalc.jsx", import.meta.url), "utf8");
if (!/ENGRAVE_MATERIALS/.test(co2Calc) || !/CUT_MATERIALS/.test(co2Calc)) {
  zle("tryb zaawansowany nie czyta obu list z cennika");
}
// Kopia listy w widoku to najczestsza droga do rozjazdu: cena z cennika,
// wybor z pamieci autora.
if (/const (CUT|ENGRAVE)_MATERIALS\s*=/.test(co2Calc) || /const (CUT|ENGRAVE)_MATERIALS\s*=/.test(sklep)) {
  zle("ktos zalozyl wlasna kopie listy materialow zamiast czytac cennik");
}
ok("sklep, tryb zaawansowany i szybka wycena czytaja jedna pare tablic");

// --- 6. Opisy kart sklepu nie obiecuja niemozliwego ----------------------
sekcja("6. Opisy uslug w sklepie");
// Opis karty ciecia jest tekstem recznym, wiec moze obiecac szklo, ktorego
// nie przetniemy. Sprawdzamy slowa, ktore w tym miejscu znaczy sie zle.
const opisCiecia = /id: "laser_cut"[\s\S]{0,700}?desc: L\(\s*"([^"]+)"/.exec(sklep)?.[1] || "";
for (const slowo of ["szkł", "szkl", "kamie", "metal", "stal"]) {
  if (opisCiecia.toLowerCase().includes(slowo)) {
    zle(`opis ciecia obiecuje "${slowo}", a tego laserem CO2 nie przetniemy: "${opisCiecia}"`);
  }
}
ok(`opis ciecia mowi tylko o tym, co tniemy: "${opisCiecia}"`);

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: oferta nie obiecuje roboty, ktorej maszyna nie wykona.");
