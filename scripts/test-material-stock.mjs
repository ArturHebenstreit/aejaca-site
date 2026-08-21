// ============================================================
// TABELA MATERIALOW: czy liczby w niej i w kodzie mowia to samo
// ============================================================
// Ceny materialow to jedyne dane w wycenie, ktore pochodza SPOZA nas: rynek
// je ustala, my je tylko przepisujemy. Rozjezdzaja sie po cichu na trzy
// sposoby i za kazdym razem kwota wyglada poprawnie:
//
//   - stala domyslna zostaje w tyle za tabela, wiec material nieznany
//     wycenia sie wedlug rynku sprzed roku,
//   - pozycja kupowana na sztuki (szklanka, plytka lupkowa) dostaje cene za
//     metr kwadratowy, czyli liczbe bez znaczenia,
//   - material rozliczany wagowo (srebro, zloto) dostaje jakakolwiek cene
//     i przestaje isc do wyceny indywidualnej.
//
// Zadnego z tych trzech nie zglosi zaden wyjatek.

import { readFileSync } from "node:fs";
import {
  DEFAULT_PLN_PER_M2, MATERIAL_WASTE, MATERIAL_MARKUP,
  materialCostPLN, ratePerPiece, pricedSeparately, salePerM2,
} from "../src/pricing/materialStock.js";
import { CUT_MATERIALS, ENGRAVE_MATERIALS } from "../src/pricing/laserCo2.js";
import { MATERIAL_CORRECTIONS } from "../src/pricing/materialCorrections.js";
import { MATERIAL_SEED, seedAsStock } from "../src/pricing/materialStockSeed.js";
import { calculate as calcFiber } from "../src/pricing/laserFiber.js";
import { priceItem } from "../chat-api/orders.js";
import { resolveTechAndParams } from "../src/pricing/simpleQuote.js";
import { MATERIALS as FIBER_MATERIALS } from "../src/pricing/laserFiber.js";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);

// Tabela zyje w bazie, ale jej wartosci startowe opisuja, co uwazamy za cene
// rynkowa, i sa jednym plikiem: czyta go serwer przy zakladaniu tabeli, skrypt
// etykiet "od X zl" i ten test. Wczesniej byly tekstem SQL wyluskiwanym stad
// wyrazeniem regularnym, ktore przestawalo pasowac przy pierwszej zmianie
// zapisu, a test milkl zamiast zaczerwienic sie.
const WIERSZE = MATERIAL_SEED.map((m) => ({
  id: m.material_id, nazwa: m.name_pl, m2: m.pln_per_m2, szt: m.pln_per_piece,
}));

const mediana = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// --- 1. Tabela w ogole sie czyta -----------------------------------------
sekcja("1. Wartosci startowe tabeli");
if (WIERSZE.length < 20) zle(`zestaw startowy ma tylko ${WIERSZE.length} pozycji, a cennik lasera potrzebuje ich wiecej`);
else ok(`${WIERSZE.length} pozycji w zestawie startowym`);

// --- 2. Stala domyslna trzyma sie mediany --------------------------------
sekcja("2. Stawka domyslna kontra tabela");
const naMetry = WIERSZE.filter((w) => w.m2 > 0).map((w) => w.m2);
const med = mediana(naMetry);
const srednia = naMetry.reduce((a, b) => a + b, 0) / naMetry.length;
// Mediana, a nie srednia: srednia jest ciagnieta przez tytan i miedz, ktorych
// prawie nie tniemy, wiec opisuje material, ktorego nikt nie zamawia.
if (Math.abs(DEFAULT_PLN_PER_M2 - med) > med * 0.25) {
  zle(`stala domyslna ${DEFAULT_PLN_PER_M2} zl odjechala od mediany tabeli ${med} zl o wiecej niz cwierc`);
} else {
  ok(`domyslna ${DEFAULT_PLN_PER_M2} zl przy medianie ${med} zl (srednia ${srednia.toFixed(0)} zl, ${naMetry.length} pozycji)`);
}

// --- 3. Sztuki nie udaja metrow ------------------------------------------
sekcja("3. Materialy kupowane na sztuki");
const stock = seedAsStock();
const NA_SZTUKI = ["glass", "stone"];
for (const id of NA_SZTUKI) {
  const w = WIERSZE.find((x) => x.id === id);
  if (!w) { zle(`${id}: brak w tabeli`); continue; }
  if (!(w.szt > 0)) zle(`${id}: kupujemy go sztukami, a nie ma ceny za sztuke`);
  if (w.m2 > 0) zle(`${id}: ma cene za metr kwadratowy, ktora dla przedmiotu nic nie znaczy`);
  if (ratePerPiece(id, stock) == null) zle(`${id}: silnik nie widzi ceny za sztuke`);
}
// Cena za sztuke NIE zalezy od pola: przedmiot jest jeden, niezaleznie od
// tego, jak duzy wzor na nim wypalimy.
const male = materialCostPLN({ areaCm2: 20, matId: "glass", podloze: "our_stock", stock });
const duze = materialCostPLN({ areaCm2: 400, matId: "glass", podloze: "our_stock", stock });
if (male !== duze) zle(`cena szklanki zalezy od wielkosci graweru (${male} vs ${duze}), a to jest ta sama szklanka`);
else ok(`cena za sztuke stala niezaleznie od pola graweru (${male.toFixed(2)} zl)`);

// --- 4. Metale szlachetne ida do wyceny indywidualnej --------------------
sekcja("4. Srebro i zloto");
for (const id of ["silver", "gold"]) {
  if (!pricedSeparately(id, stock)) zle(`${id}: dostal cene w tabeli, a rozliczamy go wagowo`);
  if (materialCostPLN({ areaCm2: 100, matId: id, podloze: "our_stock", stock }) !== 0) {
    zle(`${id}: doliczony do kwoty, choc ma isc do wyceny indywidualnej`);
  }
}
ok("srebro i zloto nie wchodza do automatycznej kwoty");

// --- 5. Kazdy material z cennika ma swoja cene ---------------------------
sekcja("5. Pokrycie cennika");
const wTabeli = new Set(WIERSZE.map((w) => w.id));
const zCennika = [...CUT_MATERIALS, ...ENGRAVE_MATERIALS, ...FIBER_MATERIALS].filter((m) => !m.custom).map((m) => m.id);
const braki = [...new Set(zCennika)].filter((id) => !wTabeli.has(id));
if (braki.length) {
  zle(`materialy bez ceny w tabeli, wyceniaja sie stawka domyslna: ${braki.join(", ")}`);
} else {
  ok(`wszystkie ${new Set(zCennika).size} materialow z cennika ma swoja cene`);
}

// --- 6. Zapas na odpad jest w cenie, ale nie przy sztukach ---------------
sekcja("6. Zapas na odpad");
const arkusz = materialCostPLN({ areaCm2: 10000, matId: "acr5", podloze: "our_stock", stock });
const bezZapasu = (10000 / 10000) * (WIERSZE.find((w) => w.id === "acr5")?.m2 || 0);
if (Math.abs(arkusz - bezZapasu * MATERIAL_WASTE * MATERIAL_MARKUP) > 0.01) {
  zle(`zapas ${MATERIAL_WASTE} nie wchodzi do ceny z metrow: ${arkusz.toFixed(2)} zamiast ${(bezZapasu * MATERIAL_WASTE * MATERIAL_MARKUP).toFixed(2)}`);
}
ok(`metr kwadratowy akrylu 5 mm kosztuje klienta ${arkusz.toFixed(2)} zl (zakup ${bezZapasu.toFixed(0)}, zapas ${Math.round((MATERIAL_WASTE - 1) * 100)}%, narzut ${Math.round((MATERIAL_MARKUP - 1) * 100)}%)`);

// --- 6b. Narzut wchodzi do obu drog liczenia -----------------------------
sekcja("6b. Narzut na material");
// W tabeli trzymamy KOSZT ZAKUPU, wiec narzut musi dojsc w silniku, i to
// tak samo przy metrach i przy sztukach. Doliczony tylko w jednej drodze
// bylby bledem niewidocznym: obie kwoty wygladaja poprawnie osobno.
const kosztAkrylu = WIERSZE.find((w) => w.id === "acr5")?.m2 || 0;
const zMetrow = materialCostPLN({ areaCm2: 10000, matId: "acr5", podloze: "our_stock", stock });
const oczekiwaneZMetrow = kosztAkrylu * MATERIAL_WASTE * MATERIAL_MARKUP;
if (Math.abs(zMetrow - oczekiwaneZMetrow) > 0.01) {
  zle(`narzut nie wchodzi do ceny z metrow: ${zMetrow.toFixed(2)} zamiast ${oczekiwaneZMetrow.toFixed(2)}`);
}
const kosztSzkla = WIERSZE.find((w) => w.id === "glass")?.szt || 0;
const zeSztuk = materialCostPLN({ areaCm2: 100, matId: "glass", podloze: "our_stock", stock });
if (Math.abs(zeSztuk - kosztSzkla * MATERIAL_MARKUP) > 0.01) {
  zle(`narzut nie wchodzi do ceny za sztuke: ${zeSztuk.toFixed(2)} zamiast ${(kosztSzkla * MATERIAL_MARKUP).toFixed(2)}`);
}
if (Math.abs(salePerM2(kosztAkrylu) - kosztAkrylu * MATERIAL_MARKUP) > 0.01) {
  zle("cena sprzedazy pokazywana w panelu liczy sie inaczej niz w silniku");
}
ok(`narzut ${Math.round((MATERIAL_MARKUP - 1) * 100)}% w obu drogach: akryl ${zMetrow.toFixed(2)} zl/m2, szklo ${zeSztuk.toFixed(2)} zl/szt.`);

// Panel administracyjny ma wlasna kopie tej liczby, bo wdraza sie go osobno.
// Rozjazd oznaczalby, ze wlasciciel widzi inna cene sprzedazy niz klient.
const adminSrc = readFileSync(new URL("../admin/server.js", import.meta.url), "utf8");
const wAdminie = Number(/const MATERIAL_MARKUP = ([\d.]+);/.exec(adminSrc)?.[1]);
if (wAdminie !== MATERIAL_MARKUP) {
  zle(`panel liczy narzut ${wAdminie}, a silnik ${MATERIAL_MARKUP}: wlasciciel widzi inna cene niz klient`);
} else {
  ok(`panel i silnik licza ten sam narzut (${MATERIAL_MARKUP})`);
}

// --- 7. Rozpiska pokazuje material ---------------------------------------
sekcja("7. Material widoczny w rozpisce");
const silnik = readFileSync(new URL("../src/pricing/laserCo2.js", import.meta.url), "utf8");
if ((silnik.match(/label: l\.materialCost/g) || []).length < 2) {
  zle("material nie jest wypisany w rozpisce obu silnikow CO2");
}
ok("ciecie i grawer wypisuja material w rozpisce");

// --- 9. Nic nierozstrzygnietego nie wchodzi do koszyka ---------------------
sekcja("9. Material bez ceny nie daje kwoty wiazacej");
// Kwota w koszyku jest UMOWA, wiec nie moze zawierac pozycji "do ustalenia".
// Przy srebrze i zlocie z naszego magazynu takiej ceny nie ma, dopoki nie
// zwazymy blaszki. Silnik musi wtedy zwrocic `custom`, bo dopiero to chowa
// przycisk koszyka i kaze serwerowi odmowic wyceny.
for (const [mat, podloze, oczekiwane] of [
  ["silver", "our_stock", "custom"],
  ["gold", "our_stock", "custom"],
  ["silver", "own_item", "calculated"],
  ["stainless", "our_stock", "calculated"],
]) {
  const r = calcFiber({ matId: mat, lensId: "150mm", markId: "surface", areaId: "M", quantityId: "proto", podloze }, "pl", stock);
  if (r?.type !== oczekiwane) {
    zle(`Fiber ${mat} / ${podloze}: dostalem "${r?.type}", a ma byc "${oczekiwane}"`);
  }
}
// Awaria bazy nie moze zamienic kruszcu w material po stawce domyslnej.
const bezTabeli = calcFiber({ matId: "silver", lensId: "150mm", markId: "surface", areaId: "M", quantityId: "proto", podloze: "our_stock" }, "pl", null);
if (bezTabeli?.type !== "custom") {
  zle("bez tabeli srebro dostaje kwote wiazaca ze stawki domyslnej, czyli liczbe wziete z powietrza");
}
// Serwer musi odmowic tej samej konfiguracji, inaczej obejscie przegladarki
// wystarczy, zeby kupic rzecz bez ustalonej ceny.
let odmowil = false;
try { priceItem({ calculator: "laser_fiber", lang: "pl", params: { matId: "silver", lensId: "150mm", markId: "surface", areaId: "M", quantityId: "proto", podloze: "our_stock" }, materialStock: stock }); }
catch (e) { odmowil = e?.code === "needs_quote" || /needs_quote/.test(String(e?.message)); }
if (!odmowil) zle("serwer wycenia srebro z naszego magazynu, choc ceny materialu nie znamy");
ok("kruszec z naszego magazynu idzie do wyceny indywidualnej, takze po stronie serwera");

// --- 10. Szybka wycena przekazuje odpowiedz o podlozu -----------------------
sekcja("10. Podloze dociera z szybkiej wyceny do silnika");
// Odpowiedz "na czym pracujemy" decyduje o tym, czy material wchodzi do kwoty.
// Sciezka BEZ wgranego pliku dlugo jej nie przekazywala, wiec klient placil za
// plyte, ktora sam przyslal. Nic tego nie zglaszalo: kwota wygladala poprawnie.
{
  const wspolne = { size: "palm", finish: "standard", quantity: "few", podloze: "own_item" };
  const rysunek = { pathLengthCm: 120, engravAreaCm2: 200 };
  const przypadki = [
    ["grawer CO2, bez pliku", { ...wspolne, item: "sign", material: "wood" }],
    ["ciecie CO2, bez pliku", { ...wspolne, item: "sign", material: "wood", co2Mode: "cut" }],
    ["Fiber, bez pliku", { ...wspolne, item: "jewelry", material: "metal" }],
    ["grawer CO2, z rysunkiem", { ...wspolne, item: "sign", material: "wood", fileType: "svg", svgData: rysunek }],
    ["Fiber, z rysunkiem", { ...wspolne, item: "jewelry", material: "metal", fileType: "svg", svgData: rysunek }],
    ["szklo, przekierowane na drewno", { ...wspolne, item: "sign", material: "glass" }],
  ];
  for (const [nazwa, odpowiedzi] of przypadki) {
    const r = resolveTechAndParams(odpowiedzi);
    if (r?.params?.podloze !== "own_item") {
      zle(`${nazwa}: podloze nie dotarlo do silnika (${JSON.stringify(r?.params?.podloze)}), material policzy sie jako nasz`);
    }
  }
  ok("podloze przechodzi kazda sciezka szybkiej wyceny, z plikiem i bez");
}

// --- 8. Etykieta "od" liczy sie z tej samej tabeli --------------------------
sekcja("8. Cena 'od' na kartach uslug");
// Skrypt etykiet nie ma dostepu do bazy, wiec bierze zestaw startowy. Gdy
// przestanie go podawac, silnik zjedzie na stawke domyslna i karta uslugi
// zacznie obiecywac inna cene niz kalkulator. Roznica bywa mniejsza niz
// zaokraglenie do zlotowki, wiec sam `--check` tego nie zlapie.
const deriveSrc = readFileSync(new URL("./derive-service-prices.mjs", import.meta.url), "utf8");
if (!/seedAsStock\(\)/.test(deriveSrc)) {
  zle("skrypt cen 'od' nie bierze tabeli materialow, wiec karta uslugi liczy inna stawke niz koszyk");
} else if (!/fn\([^\n]*,\s*"pl",\s*stock\)/.test(deriveSrc)) {
  zle("tabela jest wczytana, ale nie trafia do wywolania kalkulatora");
} else {
  ok("karta uslugi i koszyk licza material z tego samego zestawu");
}

// --- 11. Korekty stawek juz zapisanych w bazie ------------------------------
sekcja("11. Korekty stawek w istniejacej bazie");
// Zestaw startowy wchodzi z `ON CONFLICT DO NOTHING`, wiec poprawiona liczba
// w repozytorium NIE DOCHODZI do tabeli zalozonej wczesniej. To najgorszy
// rodzaj awarii: build zielony, kod poprawny, klient placi po staremu.
// Korekta z `materialCorrections.js` to naprawia, ale sama moze sie zepsuc
// cicho na trzy sposoby, i kazdy jest tu sprawdzany.
{
  const seedWg = new Map(MATERIAL_SEED.map((m) => [m.material_id, m]));
  const widziane = new Set();
  for (const k of MATERIAL_CORRECTIONS) {
    if (!k.id || widziane.has(k.id)) zle(`korekta bez identyfikatora albo powtorzona: ${k.id}`);
    widziane.add(k.id);
    const m = seedWg.get(k.material_id);
    if (!m) { zle(`korekta ${k.id} dotyczy materialu ${k.material_id}, ktorego nie ma w zestawie startowym`); continue; }
    if (!(Number(k.from_pln_per_m2) > 0) || !(Number(k.to_pln_per_m2) > 0)) {
      zle(`korekta ${k.id} ma stawke, ktora nie jest dodatnia`);
    }
    if (Number(k.from_pln_per_m2) === Number(k.to_pln_per_m2)) zle(`korekta ${k.id} nic nie zmienia`);
    // NAJWAZNIEJSZE: nowa baza dostaje zestaw startowy, a stara korekte.
    // Gdy te dwie liczby sie rozjada, cena zalezy od tego, kiedy ktos zalozyl
    // instancje, i zadna strona tego nie zglosi.
    if (Number(m.pln_per_m2) !== Number(k.to_pln_per_m2)) {
      zle(`korekta ${k.id} celuje w ${k.to_pln_per_m2} zl, a zestaw startowy ma ${m.pln_per_m2} zl: nowa i stara baza policzą inaczej`);
    }
  }

  const srv = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  // Bez warunku na stara wartosc wdrozenie cofaloby wlascicielowi kazda
  // poprawke zrobiona w panelu, i to bez sladu.
  if (!/WHERE material_id=\$3 AND pln_per_m2=\$4/.test(srv)) {
    zle("korekta nie sprawdza starej stawki, wiec nadpisze poprawke wlasciciela z panelu");
  }
  // Bez zapisu wykonania korekta chodzilaby przy kazdym restarcie.
  if (!/INSERT INTO material_corrections \(/.test(srv)) zle("wykonana korekta nie jest nigdzie zapisywana");
  if (!/SELECT id FROM material_corrections WHERE id=\$1/.test(srv)) zle("korekta nie sprawdza, czy juz byla wykonana");
  // Korekta jest wolana W LANCUCHU STARTOWYM, ktory konczy sie `.catch(() => {})`.
  // Ten catch polyka wszystko, wiec zamiana deklaracji funkcji na `const fn = ...`
  // wywalilaby korekte na TDZ i NIKT by sie o tym nie dowiedzial: serwer wstaje
  // normalnie, a cena zostaje stara. Deklaracja musi byc hoistowana.
  if (!/^async function zastosujKorektyStawek\(\)/m.test(srv)) {
    zle("korekta nie jest hoistowana deklaracja funkcji, wiec wywali sie przy starcie, a catch to polknie");
  }
  if (!/\.then\(\(\) => zastosujKorektyStawek\(\)\)/.test(srv)) zle("korekta nie jest wolana przy starcie");
  // Stawka wisi w dwoch pamieciach naraz; wyczyszczenie jednej daje godzine,
  // w ktorej podglad i kwota wiazaca mowia co innego.
  const ciało = srv.match(/async function zastosujKorektyStawek\(\)[\s\S]*?\n\}/);
  if (!ciało) zle("nie znalazlem funkcji korekt w chat-api/server.js");
  else {
    if (!/_materialCache = \{ ts: 0/.test(ciało[0]) || !/_materialPriceCache = \{ ts: 0/.test(ciało[0])) {
      zle("korekta nie czysci obu pamieci podrecznych, wiec podglad i kwota wiazaca rozjada sie na godzine");
    }
  }
  ok(`${MATERIAL_CORRECTIONS.length} korekt: kazda celuje w wartosc z zestawu startowego i nie rusza poprawek z panelu`);
}

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: tabela materialow i wycena mowia to samo.");
