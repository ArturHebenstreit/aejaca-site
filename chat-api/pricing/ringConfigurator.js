// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/ringConfigurator.js
// Regeneracja: npm run sync:pricing

// ============================================================
// KREATOR PIERSCIONKOW: wycena
// ============================================================
// Cztery wyjscia z jednej konfiguracji, kazde wyceniane osobno:
//
//   mesh      plik STL i 3MF do druku albo odlewu
//   step      model powierzchniowy do edycji w Rhino czy Matrixie
//   cast      odlew bez kamieni, gniazda gotowe pod zakucie
//   finished  gotowy wyrob z zakutymi kamieniami
//
// Masa NIE jest tu liczona. Przychodzi z generatora w `ringGeometry`,
// policzona na serwerze z tej samej bryly, ktora klient dostanie w pliku.
// Przegladarka liczy to samo dla podgladu, ale jej wynikowi nie ufamy,
// bo jest o jedno `fetch` od podmiany.

import { CONFIG, applyPricing } from "./config.js";
import { GEMSTONES, STONE_SIZES, METAL_PRICES } from "./jewelryConfig.js";
import { CASTING_ALLOYS } from "./castingAlloys.js";

// ------------------------------------------------------------
// Kamien: karaty z objetosci
// ------------------------------------------------------------
// Karat to jednostka MASY, nie rozmiaru, wiec liczymy go z objetosci bryly,
// ktora i tak wygenerowalismy, razy gestosc kamienia. Kontrola: brylant
// okragly 6,5 mm wychodzi z tego okolo 1,00 ct, czyli tyle, ile podaje
// kazda tabela jubilerska.
const GEM_DENSITY = {
  diamond: 3.52, lab_diamond: 3.52,
  moissanite: 3.21,
  cz: 5.68,
  ruby: 4.00, lab_ruby: 4.00,
  sapphire: 4.00, lab_sapphire: 4.00,
  emerald: 2.72,
  garnet: 3.90,
  amber: 1.08,
  topaz: 3.55,
  amethyst: 2.65,
};
const DEFAULT_GEM_DENSITY = 3.6;   // typowy kamien fasetowany
const CT_PER_GRAM = 5;             // 1 ct = 0,2 g

export function caratFromVolume(volumeMm3, gemId) {
  const d = GEM_DENSITY[gemId] ?? DEFAULT_GEM_DENSITY;
  return (Math.max(0, volumeMm3) / 1000) * d * CT_PER_GRAM;
}

/**
 * Mnoznik ceny dla zadanej masy kamienia.
 *
 * Cena kamienia rosnie szybciej niz jego masa, bo duze kamienie sa rzadsze.
 * Krzywej nie wymyslamy: interpolujemy tabele `STONE_SIZES`, z ktorej korzysta
 * kalkulator bizuterii, zeby ten sam kamien nie kosztowal w dwoch miejscach
 * serwisu dwoch roznych kwot.
 */
export function priceMulForCarat(ct) {
  const tiers = STONE_SIZES
    .filter((s) => !s.custom && s.ct > 0 && s.priceMul > 0)
    .sort((a, b) => a.ct - b.ct);
  if (!tiers.length) return 1;
  if (ct <= tiers[0].ct) {
    // Ponizej najmniejszego progu skalujemy liniowo, zeby cena nie skakala.
    return tiers[0].priceMul * (ct / tiers[0].ct);
  }
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i], b = tiers[i + 1];
    if (ct <= b.ct) {
      // Interpolacja w skali logarytmicznej, bo tabela jest wykladnicza.
      const t = (Math.log(ct) - Math.log(a.ct)) / (Math.log(b.ct) - Math.log(a.ct));
      return Math.exp(Math.log(a.priceMul) + t * (Math.log(b.priceMul) - Math.log(a.priceMul)));
    }
  }
  // Powyzej najwiekszego progu przedluzamy nachylenie ostatniego odcinka.
  const a = tiers[tiers.length - 2], b = tiers[tiers.length - 1];
  const k = Math.log(b.priceMul / a.priceMul) / Math.log(b.ct / a.ct);
  return b.priceMul * (ct / b.ct) ** k;
}

// ------------------------------------------------------------
// Stawki
// ------------------------------------------------------------
export const RING_RATES = {
  /** Plik siatkowy: praca jest jednorazowa, wiec cena zalezy od zlozonosci, nie od masy. */
  meshBasePLN: 42,
  meshPerFeaturePLN: 16,
  /** STEP powstaje na drugim jadrze, wolniej i dla innego odbiorcy. */
  stepPremiumPLN: 80,

  /** Odlew: przygotowanie wzorca, wypalanie, odlanie, obrobka. */
  castSetupPLN: 95,
  castPerGramPLN: 6,
  finishingPLN: 45,

  /** Zakucie liczone od kamienia, bo tyle trwa niezaleznie od jego ceny. */
  settingPLN: { prong4: 45, prong6: 55, corner: 60, vprong: 65, bezel: 50, channel: 40, drilled: 25 },
  sideSettingPLN: { pave: 22, channel: 18, prong: 26 },

  /** Sygnet ma wiecej polerowania niz pierscionek z kamieniem. */
  signetFinishingPLN: 60,
  engravingPLN: { none: 0, mono: 60, crest: 180 },
};

const OUTPUTS = ["mesh", "step", "cast", "finished"];

const LBL = {
  pl: { metal: "Kruszec", cast: "Odlew i obróbka", gems: "Kamienie", setting: "Zakucie",
        file: "Przygotowanie pliku", step: "Konwersja do STEP", engrave: "Grawer",
        pattern: "Wzorzec po kompensacji skurczu", total: "Razem" },
  en: { metal: "Metal", cast: "Casting and finishing", gems: "Stones", setting: "Setting",
        file: "File preparation", step: "STEP conversion", engrave: "Engraving",
        pattern: "Pattern after shrinkage compensation", total: "Total" },
  de: { metal: "Edelmetall", cast: "Guss und Finish", gems: "Steine", setting: "Fassen",
        file: "Dateiaufbereitung", step: "STEP-Konvertierung", engrave: "Gravur",
        pattern: "Modell nach Schwundkompensation", total: "Gesamt" },
};

const fmt = (pln, lang) =>
  `${pln.toLocaleString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-US",
    { maximumFractionDigits: 0 })} zł`;

function metalPricePerG(metalKey, rates) {
  if (metalKey === "gold") return rates?.au_pln_per_g ?? METAL_PRICES.gold.plnPerG;
  if (metalKey === "silver") return rates?.ag_pln_per_g ?? METAL_PRICES.silver.plnPerG;
  if (metalKey === "platinum") return rates?.pt_pln_per_g ?? METAL_PRICES.platinum.plnPerG;
  return METAL_PRICES[metalKey]?.plnPerG ?? 0;
}

/**
 * @param {object} params        konfiguracja pierscionka plus `output`
 * @param {string} lang          pl | en | de
 * @param {object} [rates]       kursy kruszcow, TRZECI argument
 * @param {Array}  [gemstones]   ceny kamieni z bazy, CZWARTY argument
 */
export function calculate(params, lang = "pl", rates, gemstones) {
  const l = LBL[lang] || LBL.pl;
  const output = OUTPUTS.includes(params?.output) ? params.output : "mesh";
  const geo = params?.ringGeometry;

  // Bez geometrii z serwera nie ma wyceny. To NIE jest blad do naprawienia
  // wartoscia zapasowa: liczba wzieta z sufitu wygladalaby jak cena.
  if (!geo || !(geo.volumeMm3 > 0)) return null;

  const alloy = CASTING_ALLOYS[params.alloy] || CASTING_ALLOYS.ag925;
  const gems = gemstones && gemstones.length ? gemstones : GEMSTONES;
  const breakdown = [];
  let cost = 0;

  // ---- plik ----
  const features = (geo.sideStoneCount ? 1 : 0)
    + (geo.kind === "signet" ? 1 : 0)
    + (["marquise", "heart", "trillion", "pear"].includes(geo.cut) ? 1 : 0)
    + (params.setting === "bezel" || params.setting === "channel" ? 1 : 0);
  const filePLN = RING_RATES.meshBasePLN + features * RING_RATES.meshPerFeaturePLN;

  if (output === "mesh" || output === "step") {
    cost += filePLN;
    breakdown.push({ label: l.file, value: fmt(filePLN, lang) });
    if (output === "step") {
      cost += RING_RATES.stepPremiumPLN;
      breakdown.push({ label: l.step, value: fmt(RING_RATES.stepPremiumPLN, lang) });
    }
    const pricing = applyPricing(cost, CONFIG.BASE_MARGIN, 0, 1);
    return {
      type: "calculated", ...pricing, qty: 1, output,
      massG: geo.massG, caratTotal: 0,
      breakdown: [...breakdown, { divider: true },
        { label: l.total, value: fmt(cost, lang), bold: true }],
    };
  }

  // ---- metal ----
  // Liczymy mase WZORCA, nie gotowego odlewu: tyle metalu trzeba wlac, bo
  // stop kurczy sie przy krzepnieciu. Roznica to okolo pieciu procent i przy
  // zlocie widac ja w rachunku.
  const patternMassG = (geo.patternVolumeMm3 / 1000) * alloy.density;
  const metalCost = patternMassG * metalPricePerG(alloy.metal, rates) * alloy.purity;
  cost += metalCost;
  breakdown.push({
    label: `${l.metal} (${patternMassG.toFixed(2)} g ${alloy.label[lang] || alloy.label.pl})`,
    value: fmt(metalCost, lang),
  });

  // ---- odlew i obrobka ----
  const castCost = RING_RATES.castSetupPLN
    + patternMassG * RING_RATES.castPerGramPLN
    + (geo.kind === "signet" ? RING_RATES.signetFinishingPLN : RING_RATES.finishingPLN);
  cost += castCost;
  breakdown.push({ label: l.cast, value: fmt(castCost, lang) });

  if (geo.kind === "signet") {
    const eng = RING_RATES.engravingPLN[params.signet?.engraving] || 0;
    if (eng) {
      cost += eng;
      breakdown.push({ label: l.engrave, value: fmt(eng, lang) });
    }
  }

  if (output === "cast") {
    const pricing = applyPricing(cost, CONFIG.BASE_MARGIN, 0, 1);
    return {
      type: "calculated", ...pricing, qty: 1, output,
      massG: geo.massG, patternMassG, caratTotal: 0,
      breakdown: [...breakdown, { divider: true },
        { label: l.total, value: fmt(cost, lang), bold: true }],
    };
  }

  // ---- kamienie i zakucie ----
  let gemCost = 0, settingCost = 0, caratTotal = 0;
  for (const s of geo.stones || []) {
    // Materiał wienca i obwodu przychodzi RAZEM z kamieniem, bo tam liczba
    // kamieni wynika z geometrii, a nie z formularza. Dla centralnego
    // i bocznych zostaje po staremu, z parametrow.
    const id = s.material
      || (s.role === "side" ? params.side?.material : params.stone?.material);
    const gem = gems.find((g) => g.id === id);

    // Kamien bez ceny w bazie nie idzie na wartosc zapasowa. Cala pozycja
    // przechodzi do indywidualnej wyceny, bo lepiej odpowiedziec recznie niz
    // sprzedac szafir w cenie cyrkonii.
    if (!gem || gem.custom || !(gem.basePLN > 0)) return { type: "custom" };

    const count = s.count || 1;
    const ct = caratFromVolume(s.volumeMm3, gem.id);
    caratTotal += ct * count;

    // Kamien powierzony przez klienta wycenia sie tylko robocizna. Wieniec
    // i obwod licza sie zawsze jako nasze: klient nie przynosi trzydziestu
    // dobranych kamyków, a jesli przyniesie, idzie to wycena indywidualna.
    const owned = s.role === "side" ? params.side?.origin
      : s.role === "center" ? params.stone?.origin : "studio";
    if (owned !== "customer") gemCost += gem.basePLN * priceMulForCarat(ct) * count;

    // Zakucie drobnicy wycenia sie od sztuki, tak samo jak pave na ramionach:
    // to jest ta sama robota, tylko powtorzona wiecej razy.
    settingCost += count * (
      s.role === "center"
        ? (RING_RATES.settingPLN[params.setting] ?? 45)
        : s.role === "band"
          ? (RING_RATES.sideSettingPLN[params.band?.setting] ?? 22)
          : (RING_RATES.sideSettingPLN[params.side?.setting] ?? 22));
  }
  cost += gemCost + settingCost;
  if (gemCost > 0) breakdown.push({ label: `${l.gems} (${caratTotal.toFixed(2)} ct)`, value: fmt(gemCost, lang) });
  if (settingCost > 0) breakdown.push({ label: l.setting, value: fmt(settingCost, lang) });

  const pricing = applyPricing(cost, CONFIG.BASE_MARGIN, 0, 1);
  return {
    type: "calculated", ...pricing, qty: 1, output,
    massG: geo.massG, patternMassG, caratTotal,
    breakdown: [...breakdown, { divider: true },
      { label: l.total, value: fmt(cost, lang), bold: true }],
  };
}
