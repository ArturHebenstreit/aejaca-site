#!/usr/bin/env node
// ============================================================
// KREATOR PIERSCIONKOW: prog akceptacji etapu drugiego
// ============================================================
// Wycena ma jedna wlasciwosc, ktorej nie da sie sprawdzic okiem: czy liczby,
// od ktorych zalezy, w ogole do niej docieraja. Rdzen bizuterii przyjmuje
// kursy kruszcow i ceny kamieni jako ARGUMENTY POZYCYJNE, wiec pominiety
// argument nie zglasza bledu, tylko po cichu wraca do stalych z konfiguracji
// i oddaje wiarygodnie wygladajaca, nieprawdziwa cene. Zlapalismy to na tym
// projekcie trzy razy w jeden dzien.
//
// Stad pierwsze dwa testy: podmieniamy kurs i cene kamienia na absurdalne
// i sprawdzamy, ze cena SIE ZMIENIA. Test, ktory nie potrafi paść, niczego
// nie pilnuje.
//
// Wchodzi do builda.

import { priceItem, ringGeometryFromParams, PricingError } from "../chat-api/orders.js";
import { calculate, caratFromVolume, priceMulForCarat } from "../src/pricing/ringConfigurator.js";
import { buildRing } from "../src/geometry/ring/build.js";
import { GEMSTONES } from "../src/pricing/jewelryConfig.js";

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { failed++; console.error(`  ✗ ${m}`); };
const zl = (g) => (g / 100).toFixed(2) + " zł";

const BASE = {
  innerDia: 17.2, alloy: "ag925",
  stone: { cut: "round", size: 6.5, material: "cz", origin: "stock" },
  setting: "prong4",
};
const geoFor = (p) => ringGeometryFromParams({ ...BASE, ...p });
const price = (p, opts = {}) => priceItem({
  calculator: "jewelry_ring_config",
  params: { ...BASE, ...p },
  geometry: opts.geometry,
  rates: opts.rates,
  gemstones: opts.gemstones,
  lang: "pl",
});

// ------------------------------------------------------------
console.log("\n1. Karat liczony z objetosci, nie z szerokosci");
// ------------------------------------------------------------
{
  const r = await buildRing({ ...BASE }, { segments: 64 });
  const ct = caratFromVolume(r.stoneVolumesMm3.center, "diamond");
  // Tabela jubilerska: brylant okragly 6,5 mm to okolo 1,00 ct.
  if (Math.abs(ct - 1.0) <= 0.08) ok(`brylant 6,5 mm to ${ct.toFixed(3)} ct, tabela podaje 1,00`);
  else bad(`brylant 6,5 mm wyszedl ${ct.toFixed(3)} ct, a tabela podaje 1,00`);

  const rosnie = [0.1, 0.5, 1, 2, 4].map(priceMulForCarat);
  if (rosnie.every((v, i) => i === 0 || v > rosnie[i - 1])) {
    ok(`mnoznik ceny rosnie z masa: ${rosnie.map((v) => v.toFixed(2)).join(" < ")}`);
  } else bad(`mnoznik ceny nie rosnie monotonicznie: ${rosnie.join(", ")}`);
}

// ------------------------------------------------------------
console.log("\n2. Kurs kruszcu NAPRAWDE dociera do wyceny");
// ------------------------------------------------------------
{
  const geometry = await geoFor({});
  const tanio = price({ output: "cast" }, { geometry, rates: { ag_pln_per_g: 1 } });
  const drogo = price({ output: "cast" }, { geometry, rates: { ag_pln_per_g: 40 } });
  if (drogo.unitGrosze > tanio.unitGrosze * 1.2) {
    ok(`srebro po 1 zl/g: ${zl(tanio.unitGrosze)}, po 40 zl/g: ${zl(drogo.unitGrosze)}`);
  } else {
    bad(`kurs kruszcu NIE dociera: 1 zl/g daje ${zl(tanio.unitGrosze)}, 40 zl/g daje ${zl(drogo.unitGrosze)}`);
  }
}

// ------------------------------------------------------------
console.log("\n3. Ceny kamieni NAPRAWDE docieraja do wyceny");
// ------------------------------------------------------------
{
  const geometry = await geoFor({});
  const zBazy = GEMSTONES.map((g) => (g.id === "cz" ? { ...g, basePLN: 9999 } : g));
  const normalnie = price({ output: "finished" }, { geometry });
  const podmienione = price({ output: "finished" }, { geometry, gemstones: zBazy });
  if (podmienione.unitGrosze > normalnie.unitGrosze * 2) {
    ok(`cyrkonia z konfiguracji: ${zl(normalnie.unitGrosze)}, z podmienionej bazy: ${zl(podmienione.unitGrosze)}`);
  } else {
    bad(`ceny kamieni NIE docieraja: ${zl(normalnie.unitGrosze)} wobec ${zl(podmienione.unitGrosze)}`);
  }
}

// ------------------------------------------------------------
console.log("\n4. Przegladarka nie ma wplywu na cene");
// ------------------------------------------------------------
{
  const geometry = await geoFor({});
  const uczciwie = price({ output: "cast" }, { geometry });
  // Klient podstawia wlasna, dziesieciokrotnie lzejsza bryle.
  const podrobka = priceItem({
    calculator: "jewelry_ring_config",
    params: { ...BASE, output: "cast", ringGeometry: { ...geometry, volumeMm3: 1, massG: 0.01, patternVolumeMm3: 1 } },
    geometry,
    lang: "pl",
  });
  if (podrobka.unitGrosze === uczciwie.unitGrosze) {
    ok(`podstawiona bryla zignorowana, cena bez zmian: ${zl(uczciwie.unitGrosze)}`);
  } else {
    bad(`podstawiona bryla ZMIENILA cene: ${zl(uczciwie.unitGrosze)} na ${zl(podrobka.unitGrosze)}`);
  }

  // Bez geometrii z serwera wycena ma sie NIE UDAC, a nie zgadnac mase.
  try {
    priceItem({ calculator: "jewelry_ring_config", params: { ...BASE, output: "cast" }, lang: "pl" });
    bad("wycena bez bryly serwerowej przeszla, a nie powinna");
  } catch (e) {
    if (e instanceof PricingError) ok(`bez bryly serwerowej wycena odmawia: ${e.code}`);
    else bad(`nieoczekiwany blad: ${e.message}`);
  }
}

// ------------------------------------------------------------
console.log("\n5. Cztery wyjscia, rosnaca cena");
// ------------------------------------------------------------
{
  const { OUTPUT_AVAILABLE } = await import("../src/pricing/ringConfigurator.js");
  const czynne = Object.keys(OUTPUT_AVAILABLE).filter((o) => OUTPUT_AVAILABLE[o]);
  const geometry = await geoFor({});
  const p = {};
  for (const out of czynne) p[out] = price({ output: out }, { geometry }).unitGrosze;

  let kolejnosc = true, opis = [];
  for (let i = 0; i < czynne.length; i++) {
    opis.push(`${czynne[i]} ${zl(p[czynne[i]])}`);
    if (i && p[czynne[i - 1]] >= p[czynne[i]]) kolejnosc = false;
  }
  if (kolejnosc) ok(opis.join(" < ")); else bad(`kolejnosc wyjsc niepoprawna: ${opis.join(", ")}`);

  // STEP jest policzony, ale generatora STEP-a nie ma, wiec nie wolno go
  // sprzedac. Kwota wiazaca jest oferta, a oferta na plik, ktorego nie
  // zbudujemy, konczy sie zwrotem i tlumaczeniem.
  for (const [id, czy] of Object.entries(OUTPUT_AVAILABLE)) {
    if (czy) continue;
    let padlo = false;
    try { price({ output: id }, { geometry }); } catch { padlo = true; }
    if (padlo) ok(`wyjście "${id}" jest wyłączone i nie da się go wycenić`);
    else bad(`wyjscie "${id}" jest wylaczone, a mimo to zwrocilo kwote`);
  }
}

// ------------------------------------------------------------
console.log("\n6. Kamien bez ceny idzie do indywidualnej wyceny");
// ------------------------------------------------------------
{
  const geometry = await geoFor({});
  // Tak wyglada wiersz z pusta kolumna `base_eur` w tabeli kamieni.
  const bezCeny = GEMSTONES.map((g) => (g.id === "cz" ? { ...g, basePLN: null } : g));
  const wynik = calculate({ ...BASE, output: "finished", ringGeometry: geometry }, "pl", null, bezCeny);
  if (wynik && wynik.type === "custom") ok("brak ceny kamienia zwraca typ `custom`");
  else bad(`brak ceny kamienia dal: ${JSON.stringify(wynik)?.slice(0, 90)}`);

  try {
    price({ output: "finished" }, { geometry, gemstones: bezCeny });
    bad("wycena przeszla, a powinna zazadac wyceny indywidualnej");
  } catch (e) {
    if (e.code === "needs_quote") ok("cala pozycja przechodzi do wyceny indywidualnej");
    else bad(`nieoczekiwany kod bledu: ${e.code}`);
  }
}

// ------------------------------------------------------------
console.log("\n7. Skurcz odlewniczy liczony w kruszcu");
// ------------------------------------------------------------
{
  for (const alloy of ["ag925", "au585", "au750"]) {
    const geometry = await geoFor({ alloy });
    const r = calculate({ ...BASE, alloy, output: "cast", ringGeometry: geometry }, "pl", null, null);
    // Wzorzec musi byc CIEZSZY od gotowego odlewu, bo stop kurczy sie stygnac.
    if (r.patternMassG > geometry.massG * 1.02) {
      ok(`${alloy}: odlew ${geometry.massG.toFixed(2)} g, wzorzec ${r.patternMassG.toFixed(2)} g, ${zl(r.unitGrosze)}`);
    } else {
      bad(`${alloy}: wzorzec ${r.patternMassG.toFixed(2)} g nie jest ciezszy od odlewu ${geometry.massG.toFixed(2)} g`);
    }
  }
}

// ------------------------------------------------------------
console.log("\n8. Cena rosnie z tym, co ja podnosi");
// ------------------------------------------------------------
{
  const wieksza = async (a, b, opis) => {
    const ga = await geoFor(a), gb = await geoFor(b);
    const pa = price({ ...a, output: "finished" }, { geometry: ga }).unitGrosze;
    const pb = price({ ...b, output: "finished" }, { geometry: gb }).unitGrosze;
    if (pb > pa) ok(`${opis}: ${zl(pa)} na ${zl(pb)}`);
    else bad(`${opis} nie podnioslo ceny: ${zl(pa)} wobec ${zl(pb)}`);
  };
  await wieksza({}, { stone: { ...BASE.stone, size: 9 } }, "wiekszy kamien");
  await wieksza({}, {
    width: 2.5,
    side: { count: 5, size: 1.6, setting: "pave", material: "cz" },
  }, "kamienie na szynie");
  await wieksza({}, { alloy: "au750" }, "zloto zamiast srebra");
  await wieksza({}, { thickness: 3.2, width: 5 }, "masywniejsza szyna");
  await wieksza({ stone: { ...BASE.stone, material: "cz" } },
                { stone: { ...BASE.stone, material: "diamond" } }, "brylant zamiast cyrkonii");
}

// ------------------------------------------------------------
console.log("\n9. Kamien powierzony przez klienta: sama robocizna");
// ------------------------------------------------------------
{
  const geometry = await geoFor({ stone: { ...BASE.stone, material: "diamond" } });
  const nasz = price({ output: "finished", stone: { ...BASE.stone, material: "diamond", origin: "stock" } }, { geometry }).unitGrosze;
  const jego = price({ output: "finished", stone: { ...BASE.stone, material: "diamond", origin: "customer" } }, { geometry }).unitGrosze;
  if (jego < nasz * 0.5) ok(`z naszym brylantem ${zl(nasz)}, z powierzonym ${zl(jego)}`);
  else bad(`kamien powierzony nie obnizyl ceny: ${zl(nasz)} wobec ${zl(jego)}`);
}

// ------------------------------------------------------------
console.log("\n10. Kreator niewidoczny dla klientow, dopoki nie ma interfejsu");
// ------------------------------------------------------------
{
  const { CALCULATORS } = await import("../chat-api/orders.js");
  const wpis = CALCULATORS.jewelry_ring_config;
  if (wpis?.internal) ok("kalkulator oznaczony jako `internal`, wiec nie trafia na publiczna liste");
  else bad("kalkulator BEZ znacznika `internal`, pokaze sie w /api/price/calculators");

  const fs = await import("node:fs");
  const server = fs.readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  if (/filter\(\(\[, c\]\) => !c\.internal\)/.test(server)) ok("endpoint listy odsiewa kalkulatory wewnetrzne");
  else bad("endpoint /api/price/calculators NIE odsiewa kalkulatorow wewnetrznych");

  // Jadro CAD nie moze byc warunkiem startu API, ktore obsluguje platnosci.
  const orders = fs.readFileSync(new URL("../chat-api/orders.js", import.meta.url), "utf8");
  if (/^import .*geometry\//m.test(orders)) {
    bad("orders.js importuje generator na starcie, wiec awaria jadra CAD zabija cale chat-api");
  } else ok("generator wczytywany dopiero przy uzyciu, awaria nie zabija chat-api");

  // Lock chat-api musi znac kazda zaleznosc z package.json, bo Railway
  // buduje przez `npm ci`, ktory przy rozjezdzie nie instaluje, tylko pada.
  const pkg = JSON.parse(fs.readFileSync(new URL("../chat-api/package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(fs.readFileSync(new URL("../chat-api/package-lock.json", import.meta.url), "utf8"));
  const brak = Object.keys(pkg.dependencies || {}).filter((d) => !lock.packages?.[`node_modules/${d}`]);
  if (brak.length) bad(`chat-api/package-lock.json nie zna: ${brak.join(", ")}. Railway padnie na npm ci`);
  else ok("lock chat-api zgodny z package.json, npm ci przejdzie");
}

// ------------------------------------------------------------
// Cztery wyjscia z jednej bryly
// ------------------------------------------------------------
// Ta sama konfiguracja daje cztery produkty i klient widzi je obok siebie.
// Kolejnosc kwot NIE jest przypadkowa i musi taka zostac: plik jest tanszy
// od odlewu, a odlew od gotowego wyrobu. Odwrocenie ktorejkolwiek pary
// znaczy blad w stawkach, ktorego nikt nie zauwazy poza ksiegowoscia.
console.log("\nCztery wyjścia z jednej bryły");
{
  const { ringGeometryFromParams, priceItem, PricingError } = await import("../chat-api/orders.js");

  const params = {
    innerDia: 17.2, alloy: "au585", color: "yellow", taper: "tapered",
    stone: { cut: "round", size: 6.5, material: "lab_diamond", origin: "stock" },
    setting: "prong4", side: { count: 0 },
  };
  const geo = await ringGeometryFromParams(params);

  const kwoty = { mesh: priceItem({ calculator: "jewelry_ring_config",
    params: { ...params, output: "mesh" }, lang: "pl", geometry: geo }).lineGrosze };

  // Kruszec wchodzi dopiero od odlewu: plik nie wazy nic i jego cena nie moze
  // zalezec od tego, czy klient wybral srebro, czy zloto 750.
  const wSrebrze = priceItem({ calculator: "jewelry_ring_config",
    params: { ...params, alloy: "ag925", output: "mesh" }, lang: "pl",
    geometry: await ringGeometryFromParams({ ...params, alloy: "ag925" }) });
  if (wSrebrze.lineGrosze === kwoty.mesh) ok("cena pliku nie zalezy od kruszcu");
  else bad(`plik w srebrze ${(wSrebrze.lineGrosze/100).toFixed(0)} PLN, w zlocie ${(kwoty.mesh/100).toFixed(0)} PLN`);

  // Kamien spoza cennika blokuje gotowy wyrob, ale NIE plik i nie odlew.
  // Trasa zwraca wtedy pozostale wyjscia, zamiast oddac blad na calosc.
  const dziwny = { ...params, stone: { ...params.stone, material: "custom_gem" } };
  const geo2 = await ringGeometryFromParams(dziwny);
  let plik = null, gotowy = null;
  try { plik = priceItem({ calculator: "jewelry_ring_config", params: { ...dziwny, output: "mesh" }, lang: "pl", geometry: geo2 }); } catch { /* zapisze nizej */ }
  try { gotowy = priceItem({ calculator: "jewelry_ring_config", params: { ...dziwny, output: "finished" }, lang: "pl", geometry: geo2 }); } catch (e) { gotowy = e instanceof PricingError ? e.code : "blad"; }

  if (plik?.lineGrosze > 0) ok("kamień spoza cennika nie blokuje ceny pliku");
  else bad("kamien spoza cennika zablokowal takze plik, a plik nie zawiera kamienia");
  if (gotowy === "needs_quote") ok("gotowy wyrób z takim kamieniem idzie do wyceny indywidualnej");
  else bad(`gotowy wyrob powinien isc do wyceny recznej, a wyszlo: ${JSON.stringify(gotowy)?.slice(0, 60)}`);
}

// ------------------------------------------------------------
// Spojnosc wycen w calym serwisie
// ------------------------------------------------------------
// Ten sam pierscionek wyceniony przez kalkulator bizuterii i przez kreator
// musi opierac sie na tych samych stawkach. Nie chodzi o identyczna kwote,
// bo wejscia sa inne: kalkulator pyta o "wage" z listy, kreator liczy ja
// z bryly. Chodzi o to, zeby SKLADNIKI liczyly sie tak samo, bo klient
// trafia do nas roznymi drzwiami i dwie kwoty za to samo to utrata zaufania.
console.log("\nSpójność wycen w całym serwisie");
{
  const cfg = await import("../src/pricing/jewelryConfig.js");
  const jew = await import("../src/pricing/jewelry.js");
  const ring = await import("../src/pricing/ringConfigurator.js");

  // 1. Stawka kruszcu: jedna funkcja, wiec z definicji ta sama liczba.
  //    Sprawdzamy, ze oba moduly siegaja PO TE SAMA, a nie po wlasna kopie.
  const kursy = { au_pln_per_g: 333.33, ag_pln_per_g: 4.44, pt_pln_per_g: 111.11 };
  const zJew = jew.resolveMetalPricePerG("gold", kursy);
  const zCfg = cfg.metalPricePerG("gold", kursy);
  if (zJew === zCfg && zJew === 333.33) ok(`stawka kruszcu wspólna dla obu kalkulatorów: ${zJew} zł/g`);
  else bad(`stawki sie roznia: kalkulator ${zJew}, wspolna ${zCfg}`);

  for (const metal of ["gold", "silver", "platinum"]) {
    if (jew.resolveMetalPricePerG(metal, null) === cfg.metalPricePerG(metal, null)) continue;
    bad(`${metal}: wartosc zapasowa rozjechala sie miedzy modulami`);
  }
  ok("wartości zapasowe kruszców zgodne przy braku kursów");

  // 2. Kamien: ta sama cena bazowa i ta sama krzywa masy.
  //    Kreator liczy karaty z bryly, kalkulator bierze je z listy rozmiarow,
  //    ale mnoznik dla tej samej masy MUSI byc ten sam.
  for (const s of cfg.STONE_SIZES.filter((x) => !x.custom)) {
    const mul = ring.priceMulForCarat(s.ct);
    if (Math.abs(mul - s.priceMul) < 0.001) ok(`mnożnik dla ${s.ct} ct zgodny z tabelą: ${mul.toFixed(2)}`);
    else bad(`mnoznik dla ${s.ct} ct: kreator ${mul.toFixed(3)}, tabela ${s.priceMul}`);
  }

  // 3. Gestosci: karat to masa, wiec obie strony musza liczyc go tak samo.
  const { gemDensity } = await import("../src/data/gemOptics.js");
  const brak = cfg.GEMSTONES.filter((g) => g.id !== "none" && !(gemDensity(g.id) > 0));
  if (!brak.length) ok(`gęstość znana dla wszystkich ${cfg.GEMSTONES.length - 1} kamieni z katalogu`);
  else bad(`kamienie bez gestosci: ${brak.map((g) => g.id).join(", ")}`);
}

// ------------------------------------------------------------
console.log("\nRozpiska sumuje sie do ceny, ktora widzi klient");
// ------------------------------------------------------------
// Kafelek pokazywal cene z marza, a rozpiska konczyla sie na sumie KOSZTOW.
// Przy gotowym wyrobie roznica siegala trzech tysiecy zlotych na dokumencie,
// ktorego jedynym zadaniem jest wytlumaczyc cene. Zaden inny test tego nie
// widzial, bo obie liczby byly z osobna poprawne.
{
  const doLiczby = (s) => Number(String(s).replace(/[^\d,.-]/g, "").replace(/\s/g, "").replace(",", ".")) || 0;

  for (const [nazwa, params] of [
    ["plik", { output: "mesh" }],
    ["odlew", { output: "cast" }],
    ["gotowy wyrób", { output: "finished" }],
    ["gotowy wyrób z pavé", { output: "finished", width: 2.5,
      side: { count: 4, size: 1.4, setting: "pave", material: "cz" } }],
  ]) {
    const geometry = await geoFor(params);
    const p = price(params, { geometry });
    const wiersze = p.breakdown.filter((b) => !b.divider);
    const suma = wiersze.slice(0, -1).reduce((s, b) => s + doLiczby(b.value), 0);
    const razem = doLiczby(wiersze[wiersze.length - 1].value);
    const cena = p.unitGrosze / 100;

    // Wiersze musza sumowac sie do wiersza "Razem"...
    if (Math.abs(suma - razem) > 1.5) {
      bad(`${nazwa}: wiersze sumuja sie do ${suma.toFixed(0)} zl, a "Razem" pokazuje ${razem.toFixed(0)} zl`);
      continue;
    }
    // ...a "Razem" musi byc ta sama liczba, ktora stoi na kafelku.
    if (Math.abs(razem - cena) > 1.5) {
      bad(`${nazwa}: "Razem" ${razem.toFixed(0)} zl, a kafelek pokazuje ${cena.toFixed(0)} zl`);
      continue;
    }
    ok(`${nazwa}: rozpiska sumuje sie do ${razem.toFixed(0)} zł, tyle samo co cena`);
  }
}

console.log(failed ? `\n${failed} bledow\n` : "\nWycena kreatora: wszystko sie zgadza\n");
process.exit(failed ? 1 : 0);
