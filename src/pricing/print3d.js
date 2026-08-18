// ============================================================
// 3D PRINT PRICING CORE, Bambu Lab H2D (FDM) + Elegoo Saturn 4 Ultra (MSLA)
// ============================================================
// Formuly przeniesione 1:1 z Print3DCalc.jsx. Ten plik liczy cene zarowno
// w przegladarce, jak i na backendzie zamowien, dlatego nie moze importowac
// Reacta ani niczego spoza src/pricing i src/data.

import { CONFIG, QUANTITY_TIERS, applyPricing, fmtCost, plDiscountRow, unitPriceGrosze } from "./config.js";
import { getResinsBySegment, getResin } from "../data/resins.js";


export const PRINT_CONFIG = {
  PRINTER_POWER_KW: 0.35,
  DEPRECIATION_PLN_H: 2.50,
  ENGINEERING_PREMIUM: 0.35,
  HANDLING_FEE: 8.0,
};

export const MSLA_CONFIG = {
  DEPRECIATION_PLN_H: 3.0,
  ENERGY_KW: 0.25,
  HANDLING_FEE: 8.0,
  POST_PLATFORM_PLN: 20.0,
  POST_PC_PLN: 3.0,
  CASTABLE_QC_MULTIPLIER: 3.0, // premia robocizny za kontrole wzorca pod inwestycje (dostrojona wyzej niz 1.3 z planu, patrz raport)
  MIN_ORDER_PLN: 49.0,
  WASTE_DEFAULT: 1.25,
  WASTE_FIGURINE: 1.35,
};

// Elegoo Saturn 4 Ultra 16K build volume
export const MSLA_BUILD_VOL_CM = { x: 21.8, y: 12.3, z: 25.0 };

/** Only castable resins may be picked for casting patterns */
export function isCastable(resinId) {
  return typeof resinId === "string" && resinId.startsWith("castable");
}

/** Resins available for a segment, filtered to castable-only when applicationId is "casting" */
export function getAvailableResins(segmentId, applicationId) {
  const bySeg = getResinsBySegment(segmentId);
  return applicationId === "casting" ? bySeg.filter(r => isCastable(r.id)) : bySeg;
}

export const APPLICATIONS = [
  { id: "prototype", label: { pl: "Prototyp", en: "Prototype", de: "Prototyp" },
    desc: { pl: "Części, obudowy, testy dopasowania", en: "Parts, housings, fit tests", de: "Teile, Gehäuse, Passtests" },
    img: "/img/calc/3d_apps/prototype.webp" },
  { id: "figurine",  label: { pl: "Figurka / miniatura", en: "Figurine / miniature", de: "Figur / Miniatur" },
    desc: { pl: "Kolekcjonerskie, do gier, dekoracyjne", en: "Collectible, gaming, decorative", de: "Sammler, Gaming, Deko" },
    img: "/img/calc/3d_apps/figurine.webp" },
  { id: "casting",   label: { pl: "Wzorzec odlewniczy", en: "Casting pattern", de: "Gussmodell" },
    desc: { pl: "Biżuteria, odlew lost-resin", en: "Jewelry, lost-resin casting", de: "Schmuck, Lost-Resin-Guss" },
    img: "/img/calc/3d_apps/casting.webp" },
];

export const LAYER_HEIGHTS = [
  { id: "standard", label: { pl: "0,05 mm (standard)", en: "0.05 mm (standard)", de: "0,05 mm (Standard)" }, speed: 35 },
  { id: "quality",  label: { pl: "0,03 mm (wysoka precyzja)", en: "0.03 mm (high precision)", de: "0,03 mm (hohe Präzision)" }, speed: 20 },
];

// Size presets for MSLA, max dimension in cm, matched against Saturn 4 Ultra plate 21.8x12.3x25.0 cm
export const MSLA_SIZES = [
  { id: "XS", label: { pl: "XS - do 2 cm", en: "XS - up to 2 cm", de: "XS - bis 2 cm" }, maxCm: 2,  volumeRef: 3,   pcsPerPlate: 30 },
  { id: "S",  label: { pl: "S - 2-5 cm", en: "S - 2-5 cm", de: "S - 2-5 cm" }, maxCm: 5,  volumeRef: 20,  pcsPerPlate: 12 },
  { id: "M",  label: { pl: "M - 5-10 cm", en: "M - 5-10 cm", de: "M - 5-10 cm" }, maxCm: 10, volumeRef: 80,  pcsPerPlate: 4 },
  { id: "L",  label: { pl: "L - 10-15 cm", en: "L - 10-15 cm", de: "L - 10-15 cm" }, maxCm: 15, volumeRef: 220, pcsPerPlate: 2 },
  { id: "XL", label: { pl: "XL - powyżej 15 cm", en: "XL - over 15 cm", de: "XL - über 15 cm" }, maxCm: null, volumeRef: null, pcsPerPlate: 1, custom: true },
];

export function estimatePcsPerPlateMSLA(bbox) {
  const partW = bbox.x + 0.3, partD = bbox.y + 0.3;
  if (partW > MSLA_BUILD_VOL_CM.x || partD > MSLA_BUILD_VOL_CM.y) return 1;
  return Math.max(1, Math.min(Math.floor(MSLA_BUILD_VOL_CM.x / partW) * Math.floor(MSLA_BUILD_VOL_CM.y / partD), 30));
}

export const MSLA_LBL = {
  pl: { application: "Zastosowanie", resinSegment: "Segment żywicy", resin: "Żywica", color: "Preferowany kolor (opcjonalnie)",
    colorDefault: "Do ustalenia", layer: "Wysokość warstwy", size: "Rozmiar modelu", qty: "Nakład",
    volume: "Objętość żywicy", resinCost: "Żywica / szt.", printTime: "Czas druku / szt.", machine: "Maszyna / szt.",
    postProc: "Post-processing / szt.", handling: "Obsługa / szt.", estCost: "Koszt szacunkowy / szt.",
    discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie", minOrder: "Zastosowano minimalną wartość zlecenia (49 PLN)" },
  en: { application: "Application", resinSegment: "Resin segment", resin: "Resin", color: "Preferred color (optional)",
    colorDefault: "To be decided", layer: "Layer height", size: "Model size", qty: "Quantity",
    volume: "Resin volume", resinCost: "Resin / pc", printTime: "Print time / pc", machine: "Machine / pc",
    postProc: "Post-processing / pc", handling: "Handling / pc", estCost: "Estimated cost / pc",
    discount: "Series discount", totalProd: "Total production time", minOrder: "Minimum order value applied (49 PLN)" },
  de: { application: "Anwendung", resinSegment: "Harz-Segment", resin: "Harz", color: "Wunschfarbe (optional)",
    colorDefault: "Nach Absprache", layer: "Schichthöhe", size: "Modellgröße", qty: "Auflage",
    volume: "Harzvolumen", resinCost: "Harz / Stk.", printTime: "Druckzeit / Stk.", machine: "Maschine / Stk.",
    postProc: "Nachbearbeitung / Stk.", handling: "Handhabung / Stk.", estCost: "Geschätzte Kosten / Stk.",
    discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit", minOrder: "Mindestbestellwert angewendet (49 PLN)" },
};

export function calculateMSLA(params, lang) {
  const { applicationId, resinKey, layerId, sizeId, quantityId, stlData } = params;
  const l = MSLA_LBL[lang] || MSLA_LBL.en;
  const application = APPLICATIONS.find(a => a.id === applicationId);
  const layer = LAYER_HEIGHTS.find(ly => ly.id === layerId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  const resin = getResin(resinKey);
  const size = stlData ? null : MSLA_SIZES.find(s => s.id === sizeId);
  if (!application || !layer || !qTier || !resin || (!stlData && !size)) return null;
  if (!qTier.qty || (size && size.custom)) return { type: "custom" };

  const volumeCm3 = stlData ? stlData.volumeCm3 : size.volumeRef;
  const heightCm = stlData ? stlData.bbox.z : size.maxCm * 0.8;
  const pcsPerPlate = stlData ? estimatePcsPerPlateMSLA(stlData.bbox) : size.pcsPerPlate;
  const wasteFactor = applicationId === "figurine" ? MSLA_CONFIG.WASTE_FIGURINE : MSLA_CONFIG.WASTE_DEFAULT;

  const resinCost = volumeCm3 * wasteFactor * (resin.price_kg * resin.density / 1000);
  const printTimeH = (heightCm * 10) / layer.speed;
  const platformDivisor = Math.max(1, Math.min(qTier.qty, pcsPerPlate));
  const machineCostPerPc = (printTimeH * (MSLA_CONFIG.DEPRECIATION_PLN_H + CONFIG.ENERGY_COST_PLN * MSLA_CONFIG.ENERGY_KW)) / platformDivisor;
  let postProcessing = (MSLA_CONFIG.POST_PLATFORM_PLN / platformDivisor) + MSLA_CONFIG.POST_PC_PLN;
  if (isCastable(resinKey)) postProcessing *= MSLA_CONFIG.CASTABLE_QC_MULTIPLIER;

  const baseCost = resinCost + machineCostPerPc + postProcessing + MSLA_CONFIG.HANDLING_FEE;
  const margin = CONFIG.BASE_MARGIN;

  const platesNeeded = Math.ceil(qTier.qty / (pcsPerPlate || 1));
  const totalTimeH = (printTimeH * platesNeeded) + 0.5;

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, margin, qTier.discount, qTier.qty, plDiscount);

  // Minimum order value floor (49 PLN)
  let minOrderApplied = false;
  if (pricing.totalPLN.min < MSLA_CONFIG.MIN_ORDER_PLN) {
    minOrderApplied = true;
    const floorPerPc = Math.max(pricing.perPcPLN.min, Math.ceil(MSLA_CONFIG.MIN_ORDER_PLN / qTier.qty));
    pricing.perPcPLN.min = floorPerPc;
    pricing.perPcPLN.max = Math.max(pricing.perPcPLN.max, floorPerPc);
    pricing.totalPLN.min = pricing.perPcPLN.min * qTier.qty;
    pricing.totalPLN.max = pricing.perPcPLN.max * qTier.qty;
    pricing.perPcEUR = {
      min: Math.max(1, Math.round(pricing.perPcPLN.min / CONFIG.EUR_PLN_RATE)),
      max: Math.max(1, Math.round(pricing.perPcPLN.max / CONFIG.EUR_PLN_RATE)),
    };
    pricing.totalEUR = {
      min: Math.round(pricing.totalPLN.min / CONFIG.EUR_PLN_RATE),
      max: Math.round(pricing.totalPLN.max / CONFIG.EUR_PLN_RATE),
    };
  }

  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? totalTimeH : null,
    breakdown: [
      { label: l.volume, value: `${volumeCm3.toFixed(1)} ml` },
      { label: l.resinCost, value: fmtCost(resinCost, lang) },
      { label: l.printTime, value: `${printTimeH.toFixed(2)} h` },
      { label: l.machine, value: fmtCost(machineCostPerPc, lang) },
      { label: l.postProc, value: fmtCost(postProcessing, lang) },
      { label: l.handling, value: fmtCost(MSLA_CONFIG.HANDLING_FEE, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + margin), lang), bold: true },
      ...(plDiscountRow(baseCost * (1 + margin), plDiscount, lang) ? [plDiscountRow(baseCost * (1 + margin), plDiscount, lang)] : []),
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${totalTimeH.toFixed(1)} h`, bold: true }] : []),
      ...(minOrderApplied ? [{ label: l.minOrder, value: "" }] : []),
    ],
  };
}

export const INFILL_OPTIONS = [
  { id: "low", label: { pl: "Niskie (≤15%)", en: "Low (≤15%)", de: "Niedrig (≤15%)" }, avg: 0.12,
    desc: { pl: "Lekki, oszczędny", en: "Light, economical", de: "Leicht, sparsam" },
    img: "/img/calc/3d_infill/low.webp" },
  { id: "medium", label: { pl: "Średnie (15–50%)", en: "Medium (15–50%)", de: "Mittel (15–50%)" }, avg: 0.35,
    desc: { pl: "Dobra wytrzymałość", en: "Good strength", de: "Gute Festigkeit" },
    img: "/img/calc/3d_infill/medium.webp" },
  { id: "high", label: { pl: "Wysokie (>50%)", en: "High (>50%)", de: "Hoch (>50%)" }, avg: 0.70,
    desc: { pl: "Maksymalna sztywność", en: "Maximum rigidity", de: "Maximale Steifigkeit" },
    img: "/img/calc/3d_infill/high.webp" },
  { id: "custom", label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, avg: null, custom: true },
];

// Bambu Lab H2D dual-nozzle build volume
export const BUILD_VOL_CM = { x: 30.0, y: 32.0, z: 32.5 };

// ============================================================
// SKALA WYDRUKU A POLE ROBOCZE MASZYNY
// ============================================================
// Klient wgrywa model i chce go czasem powiekszyc albo zmniejszyc. Powiekszac
// wolno tylko do granicy, w ktorej wydruk jeszcze miesci sie na stole. Bez tej
// granicy suwak obiecywalby cene za rzecz, ktorej nie da sie wydrukowac,
// a odkrylibysmy to dopiero przy realizacji, po zaplacie.
//
// Porownujemy wymiary POSORTOWANE, bo czesc ustawiamy na stole tak, jak nam
// wygodnie. Model 24 x 2 x 2 cm nie miesci sie wzdluz osi X drukarki zywicznej
// (21.8), ale postawiony pionowo miesci sie w 25.0 bez trudu.

export const PRINTER_BUILD_VOL_CM = {
  print3d_msla: MSLA_BUILD_VOL_CM,
  print3d_fdm: BUILD_VOL_CM,
};

/** Najwieksza skala dla podanego pola roboczego. Null, gdy nie da sie policzyc. */
export function maxScaleForBuildVolume(bbox, vol) {
  if (!vol || !bbox) return null;
  const model = [bbox.x, bbox.y, bbox.z].map(Number).sort((a, b) => a - b);
  if (!model.every((n) => Number.isFinite(n) && n > 0)) return null;
  const stol = [vol.x, vol.y, vol.z].sort((a, b) => a - b);
  return Math.min(...model.map((d, i) => stol[i] / d));
}

/** To samo, ale pole robocze bierzemy z nazwy kalkulatora */
export function maxScaleForBBox(bbox, calculator) {
  return maxScaleForBuildVolume(bbox, PRINTER_BUILD_VOL_CM[calculator]);
}

/** Czy bryla w tej skali miesci sie na stole. Nieznana maszyna nie blokuje wyceny. */
export function fitsBuildVolume(bbox, calculator, scale = 1) {
  const max = maxScaleForBBox(bbox, calculator);
  if (max == null) return true;
  // Zapas na bledy zaokraglenia, zeby model dokladnie na wymiar stolu nie
  // odbijal sie od wlasnej granicy.
  return Number(scale) <= max + 1e-4;
}

export function estimateTimeFromVolume(volumeCm3) {
  return 0.194 * Math.pow(volumeCm3, 0.602);
}

export function estimatePcsPerPlate(bbox) {
  const partW = bbox.x + 0.5, partD = bbox.y + 0.5;
  if (partW > BUILD_VOL_CM.x || partD > BUILD_VOL_CM.y) return 1;
  return Math.max(1, Math.min(Math.floor(BUILD_VOL_CM.x / partW) * Math.floor(BUILD_VOL_CM.y / partD), 8));
}

export const FILAMENTS = {
  standard: { label: "Standard", materials: {
    "PLA":        { price_kg: 80,  density: 1.24 },
    "PLA Silk":   { price_kg: 110, density: 1.24 },
    "PLA Matte":  { price_kg: 95,  density: 1.24 },
    "PLA Wood":   { price_kg: 120, density: 1.20 },
    "PLA Marble": { price_kg: 115, density: 1.24 },
    "PETG":       { price_kg: 90,  density: 1.27 },
    "PETG-CF":    { price_kg: 160, density: 1.30 },
    "TPU 95A":    { price_kg: 130, density: 1.21 },
    "PVA":        { price_kg: 200, density: 1.19 },
    "ASA":        { price_kg: 100, density: 1.07 },
    "ABS":        { price_kg: 85,  density: 1.04 },
  }},
  engineering: { label: "Engineering", materials: {
    "PA6-CF":  { price_kg: 280, density: 1.18 }, "PA6-GF":  { price_kg: 220, density: 1.25 },
    "PA12-CF": { price_kg: 300, density: 1.15 }, "PPA-CF":  { price_kg: 350, density: 1.22 },
    "PPA-GF":  { price_kg: 300, density: 1.30 }, "PC":      { price_kg: 180, density: 1.20 },
    "PC-ABS":  { price_kg: 170, density: 1.15 }, "PET-CF":  { price_kg: 240, density: 1.35 },
    "PPS":     { price_kg: 500, density: 1.35 }, "PPS-CF":  { price_kg: 600, density: 1.40 },
  }},
};

export const SIZES = [
  { id: "XS", label: { pl: "XS - do 5 cm", en: "XS - up to 5 cm", de: "XS - bis 5 cm" }, volumeRef: 30, timeBase: 1.5, pcsPerPlate: 8 },
  { id: "S",  label: { pl: "S - 5–10 cm", en: "S - 5–10 cm", de: "S - 5–10 cm" }, volumeRef: 150, timeBase: 4, pcsPerPlate: 4 },
  { id: "M",  label: { pl: "M - 10–20 cm", en: "M - 10–20 cm", de: "M - 10–20 cm" }, volumeRef: 800, timeBase: 10, pcsPerPlate: 2 },
  { id: "L",  label: { pl: "L - 20–30 cm", en: "L - 20–30 cm", de: "L - 20–30 cm" }, volumeRef: 3000, timeBase: 24, pcsPerPlate: 1 },
  { id: "XL", label: { pl: "XL - powyżej 30 cm", en: "XL - over 30 cm", de: "XL - über 30 cm" }, volumeRef: null, timeBase: null, pcsPerPlate: 1, custom: true },
];

export const INFILL = [
  { id: "low",    label: { pl: "Niskie (≤15%)", en: "Low (≤15%)", de: "Niedrig (≤15%)" }, avg: 0.12 },
  { id: "medium", label: { pl: "Średnie (15–50%)", en: "Medium (15–50%)", de: "Mittel (15–50%)" }, avg: 0.35 },
  { id: "high",   label: { pl: "Wysokie (>50%)", en: "High (>50%)", de: "Hoch (>50%)" }, avg: 0.70 },
  { id: "custom", label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, avg: null, custom: true },
];

export const COLORS = [
  { id: 1, label: { pl: "1 kolor", en: "1 color", de: "1 Farbe" }, timeMul: 1.0, wasteMul: 1.0 },
  { id: 2, label: { pl: "2 kolory (dual head)", en: "2 colors (dual head)", de: "2 Farben (dual head)" }, timeMul: 1.08, wasteMul: 1.05 },
  { id: 3, label: { pl: "3 kolory (AMS)", en: "3 colors (AMS)", de: "3 Farben (AMS)" }, timeMul: 1.30, wasteMul: 1.25 },
  { id: 4, label: { pl: "4 kolory (AMS)", en: "4 colors (AMS)", de: "4 Farben (AMS)" }, timeMul: 1.55, wasteMul: 1.45 },
  { id: 5, label: { pl: "5 kolorów (AMS)", en: "5 colors (AMS)", de: "5 Farben (AMS)" }, timeMul: 1.80, wasteMul: 1.65 },
  { id: 0, label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, timeMul: null, wasteMul: null, custom: true },
];

export const PRECISION = [
  { id: "draft_04",    label: "0.4mm Draft (0.28)", speedMul: 0.70 },
  { id: "standard_04", label: "0.4mm Standard (0.20)", speedMul: 1.00 },
  { id: "quality_04",  label: { pl: "0.4mm Jakość (0.12)", en: "0.4mm Quality (0.12)", de: "0.4mm Qualität (0.12)" }, speedMul: 1.50 },
  { id: "fine_04",     label: "0.4mm Fine (0.08)", speedMul: 2.20 },
  { id: "standard_02", label: "0.2mm Standard (0.10)", speedMul: 2.50 },
  { id: "fine_02",     label: "0.2mm Fine (0.06)", speedMul: 4.00 },
  { id: "custom",      label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, speedMul: null, custom: true },
];

export const LBL = {
  pl: { segment: "Segment wydruku", filament: "Filament", size: "Rozmiar modelu", infill: "Wypełnienie (infill)",
    colors: "Liczba kolorów", precision: "Precyzja (nozzle × warstwa)", qty: "Nakład",
    mass: "Masa / szt.", material: "Materiał / szt.", printTime: "Czas druku / szt.", timeSetup: "Czas + setup / szt.",
    energy: "Energia / szt.", depreciation: "Amortyzacja / szt.", handling: "Obsługa / szt.", workshop: "Usługi warsztatowe",
    estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie" },
  en: { segment: "Print segment", filament: "Filament", size: "Model size", infill: "Infill",
    colors: "Number of colors", precision: "Precision (nozzle × layer)", qty: "Quantity",
    mass: "Mass / pc", material: "Material / pc", printTime: "Print time / pc", timeSetup: "Time + setup / pc",
    energy: "Energy / pc", depreciation: "Depreciation / pc", handling: "Handling / pc", workshop: "Workshop services",
    estCost: "Estimated cost / pc", discount: "Series discount", totalProd: "Total production time" },
  de: { segment: "Drucksegment", filament: "Filament", size: "Modellgröße", infill: "Füllung (Infill)",
    colors: "Anzahl Farben", precision: "Präzision (Düse × Schicht)", qty: "Auflage",
    mass: "Masse / Stk.", material: "Material / Stk.", printTime: "Druckzeit / Stk.", timeSetup: "Zeit + Setup / Stk.",
    energy: "Energie / Stk.", depreciation: "Abschreibung / Stk.", handling: "Handhabung / Stk.", workshop: "Werkstattleistungen",
    estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit" },
};

export function calculate(params, lang) {
  const { segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, stlData } = params;
  const size = stlData
    ? { volumeRef: stlData.volumeCm3, timeBase: estimateTimeFromVolume(stlData.volumeCm3), pcsPerPlate: estimatePcsPerPlate(stlData.bbox) }
    : SIZES.find(s => s.id === sizeId);
  const infill = INFILL_OPTIONS.find(i => i.id === infillId);
  const color = COLORS.find(c => c.id === colorId);
  const prec = PRECISION.find(p => p.id === precisionId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  const mat = FILAMENTS[segment]?.materials[materialKey];
  if (!size || !infill || !color || !prec || !qTier || !mat) return null;
  if (!size.volumeRef || !infill.avg || color.timeMul == null || !prec.speedMul || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  const shellFrac = 0.18;
  const effectiveFill = shellFrac + infill.avg * (1 - shellFrac);
  const massG = size.volumeRef * effectiveFill * mat.density;
  const materialCost = (massG / 1000) * mat.price_kg * color.wasteMul * 1.05;
  const printTime = size.timeBase * prec.speedMul * color.timeMul;
  const setupPerPc = 0.5 / qTier.qty;
  const handlePerPc = 0.05;
  const timePerPc = printTime + setupPerPc + handlePerPc;
  const energyCost = timePerPc * PRINT_CONFIG.PRINTER_POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = timePerPc * PRINT_CONFIG.DEPRECIATION_PLN_H;
  const baseCost = materialCost + energyCost + deprCost + PRINT_CONFIG.HANDLING_FEE;
  let margin = CONFIG.BASE_MARGIN;
  if (segment === "engineering") margin += PRINT_CONFIG.ENGINEERING_PREMIUM;

  const platesNeeded = Math.ceil(qTier.qty / (size.pcsPerPlate || 1));
  const totalTimeH = (printTime * platesNeeded) + (0.5) + (handlePerPc * qTier.qty);

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, margin, qTier.discount, qTier.qty, plDiscount);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? totalTimeH : null,
    breakdown: [
      { label: l.mass, value: `${massG.toFixed(1)} g` },
      { label: l.material, value: fmtCost(materialCost, lang) },
      { label: l.printTime, value: `${printTime.toFixed(1)} h` },
      { label: l.timeSetup, value: `${timePerPc.toFixed(1)} h` },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      { label: l.handling, value: fmtCost(PRINT_CONFIG.HANDLING_FEE, lang) },
      { label: l.workshop, value: fmtCost(baseCost * margin, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + margin), lang), bold: true },
      ...(plDiscountRow(baseCost * (1 + margin), plDiscount, lang) ? [plDiscountRow(baseCost * (1 + margin), plDiscount, lang)] : []),
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${totalTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}
