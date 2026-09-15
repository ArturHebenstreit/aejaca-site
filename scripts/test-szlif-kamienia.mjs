#!/usr/bin/env node
// ============================================================
// SZLIF KAMIENIA JEST OSOBNYM POLEM WYCENY
// ============================================================
// Zapytanie z Niemiec, 13 wrzesnia 2026: klient przy wisiorku prosil o kamien
// "ursprünglicher und nicht zu fest funkeln", czyli kaboszon albo rozetke
// zamiast szlifu brylantowego. W serwisie nie bylo pola, w ktorym da sie to
// powiedziec, wiec ani cena kamienia, ani koszt osadzenia tego nie liczyly.
//
// Ten sprawdzian pilnuje czterech rzeczy:
// 1. brak `cutId` liczy sie dokladnie tak samo jak `cutId: "brilliant"`
//    (stare kosze, oferty i zamowienia nie znaly tego pola),
// 2. kaboszon jest tanszy na samym kamieniu, ale drozszy w osadzeniu,
// 3. `custom_cut` daje wycene czlowieka,
// 4. kazdy szlif poza custom ma oba mnozniki i komplet trzech jezykow.
//
// Uruchamiany w `npm run build`.

import { STONE_CUTS } from "../src/pricing/jewelryConfig.js";
import { calcNew } from "../src/pricing/jewelry.js";

let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };

/** Bazowe parametry wisiorka z jednym kamieniem, zeby kazdy przypadek roznil sie tylko szlifem. */
function paramsZSzlifem(cutId) {
  return {
    lineId: "woman", typeId: "pendant", metalId: "silver", weightId: "standard",
    methodId: "cast", platingId: "none", qtyId: "1", qty: 1, engravingId: "none",
    clientSuppliesMetal: false,
    stoneRows: [{
      rowId: "row1", gemId: "sapphire", stoneSizeId: "medium", count: 1,
      suppliedBy: "studio", qualityId: "A", certId: "none",
      ...(cutId != null ? { cutId } : {}),
    }],
  };
}

console.log("\n1. Zgodnosc wsteczna: brak cutId to szlif brylantowy\n");
{
  const bezPola = calcNew(paramsZSzlifem(null), "pl", null);
  const zBrylantowym = calcNew(paramsZSzlifem("brilliant"), "pl", null);
  if (!bezPola || bezPola.type !== "calculated" || !zBrylantowym || zBrylantowym.type !== "calculated") {
    zle("wycena wisiorka z szafirem nie policzyla sie w ogole, reszta punktu nic nie sprawdza");
  } else if (bezPola.unitGrosze === zBrylantowym.unitGrosze) {
    ok(`wiersz bez cutId daje te sama kwote co "brilliant" (${bezPola.unitGrosze} gr)`);
  } else {
    zle(`brak cutId: ${bezPola.unitGrosze} gr, "brilliant": ${zBrylantowym.unitGrosze} gr, powinny byc rowne`);
  }
}

console.log("\n2. Kaboszon: tanszy kamien, drozsze osadzenie\n");
{
  const brylantowy = calcNew(paramsZSzlifem("brilliant"), "pl", null);
  const kaboszon = calcNew(paramsZSzlifem("cabochon"), "pl", null);
  if (!brylantowy || !kaboszon || brylantowy.type !== "calculated" || kaboszon.type !== "calculated") {
    zle("wycena z brylantowym albo kaboszonem nie policzyla sie, reszta punktu nic nie sprawdza");
  } else {
    const gemCostZWiersza = (wynik) => wynik.breakdown.find((w) => /kamien/i.test(w.label))?.value;
    const settingCostZWiersza = (wynik) => wynik.breakdown.find((w) => /osadz/i.test(w.label))?.value;
    const naLiczbe = (v) => v == null ? null : Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
    const kamienBrylant = naLiczbe(gemCostZWiersza(brylantowy));
    const kamienKaboszon = naLiczbe(gemCostZWiersza(kaboszon));
    const osadzenieBrylant = naLiczbe(settingCostZWiersza(brylantowy));
    const osadzenieKaboszon = naLiczbe(settingCostZWiersza(kaboszon));
    if (kamienBrylant == null || kamienKaboszon == null || osadzenieBrylant == null || osadzenieKaboszon == null) {
      zle("rozpiska nie ma wiersza kamienia albo osadzania, nie da sie porownac kwot");
    } else {
      if (kamienKaboszon < kamienBrylant) ok(`kaboszon tanszy na kamieniu (${kamienKaboszon} wobec ${kamienBrylant})`);
      else zle(`kaboszon nie jest tanszy na kamieniu: ${kamienKaboszon} wobec ${kamienBrylant}`);

      if (osadzenieKaboszon > osadzenieBrylant) ok(`kaboszon drozszy w osadzeniu (${osadzenieKaboszon} wobec ${osadzenieBrylant})`);
      else zle(`kaboszon nie jest drozszy w osadzeniu: ${osadzenieKaboszon} wobec ${osadzenieBrylant}`);
    }
  }
}

console.log("\n3. Inny szlif prowadzi do wyceny czlowieka\n");
{
  const inny = calcNew(paramsZSzlifem("custom_cut"), "pl", null);
  if (inny?.type === "custom") ok('"custom_cut" daje { type: "custom" }');
  else zle(`"custom_cut" powinien dac wycene czlowieka, dostalismy ${JSON.stringify(inny)}`);
}

console.log("\n4. Kazdy szlif poza custom ma oba mnozniki i trzy jezyki\n");
{
  for (const cut of STONE_CUTS) {
    if (cut.custom) {
      if (cut.priceMul == null && cut.settingMul == null) ok(`${cut.id}: szlif niestandardowy bez mnoznikow, zgodnie z reszta pliku`);
      else zle(`${cut.id}: szlif niestandardowy nie powinien miec mnoznikow`);
      continue;
    }
    const maMnozniki = typeof cut.priceMul === "number" && typeof cut.settingMul === "number";
    if (maMnozniki) ok(`${cut.id}: ma priceMul (${cut.priceMul}) i settingMul (${cut.settingMul})`);
    else zle(`${cut.id}: brakuje priceMul albo settingMul`);

    for (const jezyk of ["pl", "en", "de"]) {
      if (cut.label?.[jezyk]) ok(`${cut.id}: label.${jezyk} obecny`);
      else zle(`${cut.id}: brak label.${jezyk}`);
      if (cut.desc?.[jezyk]) ok(`${cut.id}: desc.${jezyk} obecny`);
      else zle(`${cut.id}: brak desc.${jezyk}`);
    }
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nSzlif kamienia: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
