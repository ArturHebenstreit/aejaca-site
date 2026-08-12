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
  const geometry = await geoFor({});
  const p = {};
  for (const out of ["mesh", "step", "cast", "finished"]) {
    p[out] = price({ output: out }, { geometry }).unitGrosze;
  }
  const kolejnosc = p.mesh < p.step && p.step < p.cast && p.cast < p.finished;
  const opis = `plik ${zl(p.mesh)} < STEP ${zl(p.step)} < odlew ${zl(p.cast)} < wyrób ${zl(p.finished)}`;
  if (kolejnosc) ok(opis); else bad(`kolejnosc wyjsc niepoprawna: ${opis}`);
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
  await wieksza({}, { side: { count: 5, size: 1.6, setting: "pave", material: "cz" } }, "kamienie na szynie");
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

console.log(failed ? `\n${failed} bledow\n` : "\nWycena kreatora: wszystko sie zgadza\n");
process.exit(failed ? 1 : 0);
