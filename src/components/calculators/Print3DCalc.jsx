// ============================================================
// 3D PRINT ESTIMATOR — Bambu Lab H2D  v1.3
// ============================================================
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Upload, X, AlertTriangle } from "lucide-react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards, QuoteEmailCapture, LicenseNotice } from "./calcShared.jsx";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

const PRINT_CONFIG = {
  PRINTER_POWER_KW: 0.35,
  DEPRECIATION_PLN_H: 2.50,
  ENGINEERING_PREMIUM: 0.35,
  HANDLING_FEE: 8.0,
};

// ============================================================
// MSLA RESIN (Elegoo Saturn 4 Ultra 16K), pricing engine
// ============================================================

const MSLA_CONFIG = {
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
const MSLA_BUILD_VOL_CM = { x: 21.8, y: 12.3, z: 25.0 };

export const RESINS = {
  standard: {
    price_kg: 120, density: 1.1,
    label: { pl: "Standard", en: "Standard", de: "Standard" },
    desc: { pl: "Prototypy, figurki hobby", en: "Prototypes, hobby figurines", de: "Prototypen, Hobby-Figuren" },
    img: "/img/calc/3d_resins/standard.webp",
  },
  high_precision: {
    price_kg: 280, density: 1.1,
    label: { pl: "High Precision", en: "High Precision", de: "High Precision" },
    desc: { pl: "Miniatury kolekcjonerskie, mikrodetal", en: "Collectible miniatures, micro-detail", de: "Sammler-Miniaturen, Mikrodetail" },
    img: "/img/calc/3d_resins/high_precision.webp",
  },
  castable: {
    price_kg: 1399, density: 1.1,
    label: { pl: "Castable (BlueCast)", en: "Castable (BlueCast)", de: "Castable (BlueCast)" },
    desc: {
      pl: "Wzorce odlewnicze (BlueCast X-One V2 / X-Wax Filigree)",
      en: "Casting patterns (BlueCast X-One V2 / X-Wax Filigree)",
      de: "Gussmodelle (BlueCast X-One V2 / X-Wax Filigree)",
    },
    img: "/img/calc/3d_resins/castable.webp",
  },
};

export const APPLICATIONS = [
  { id: "prototype", label: { pl: "Prototyp", en: "Prototype", de: "Prototyp" } },
  { id: "figurine",  label: { pl: "Figurka / miniatura", en: "Figurine / miniature", de: "Figur / Miniatur" } },
  { id: "casting",   label: { pl: "Wzorzec odlewniczy", en: "Casting pattern", de: "Gussmodell" } },
];

export const LAYER_HEIGHTS = [
  { id: "standard", label: { pl: "0,05 mm (standard)", en: "0.05 mm (standard)", de: "0,05 mm (Standard)" }, speed: 35 },
  { id: "quality",  label: { pl: "0,03 mm (jakość)", en: "0.03 mm (quality)", de: "0,03 mm (Qualität)" }, speed: 20 },
];

// Size presets for MSLA, max dimension in cm, matched against Saturn 4 Ultra plate 21.8x12.3x25.0 cm
export const MSLA_SIZES = [
  { id: "XS", label: { pl: "XS - do 2 cm", en: "XS - up to 2 cm", de: "XS - bis 2 cm" }, maxCm: 2,  volumeRef: 3,   pcsPerPlate: 30 },
  { id: "S",  label: { pl: "S - 2-5 cm", en: "S - 2-5 cm", de: "S - 2-5 cm" }, maxCm: 5,  volumeRef: 20,  pcsPerPlate: 12 },
  { id: "M",  label: { pl: "M - 5-10 cm", en: "M - 5-10 cm", de: "M - 5-10 cm" }, maxCm: 10, volumeRef: 80,  pcsPerPlate: 4 },
  { id: "L",  label: { pl: "L - 10-15 cm", en: "L - 10-15 cm", de: "L - 10-15 cm" }, maxCm: 15, volumeRef: 220, pcsPerPlate: 2 },
  { id: "XL", label: { pl: "XL - powyżej 15 cm", en: "XL - over 15 cm", de: "XL - über 15 cm" }, maxCm: null, volumeRef: null, pcsPerPlate: 1, custom: true },
];

function estimatePcsPerPlateMSLA(bbox) {
  const partW = bbox.x + 0.3, partD = bbox.y + 0.3;
  if (partW > MSLA_BUILD_VOL_CM.x || partD > MSLA_BUILD_VOL_CM.y) return 1;
  return Math.max(1, Math.min(Math.floor(MSLA_BUILD_VOL_CM.x / partW) * Math.floor(MSLA_BUILD_VOL_CM.y / partD), 30));
}

const MSLA_LBL = {
  pl: { application: "Zastosowanie", resin: "Żywica", layer: "Wysokość warstwy", size: "Rozmiar modelu", qty: "Nakład",
    volume: "Objętość żywicy", resinCost: "Żywica / szt.", printTime: "Czas druku / szt.", machine: "Maszyna / szt.",
    postProc: "Post-processing / szt.", handling: "Obsługa / szt.", estCost: "Koszt szacunkowy / szt.",
    discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie", minOrder: "Zastosowano minimalną wartość zlecenia (49 PLN)" },
  en: { application: "Application", resin: "Resin", layer: "Layer height", size: "Model size", qty: "Quantity",
    volume: "Resin volume", resinCost: "Resin / pc", printTime: "Print time / pc", machine: "Machine / pc",
    postProc: "Post-processing / pc", handling: "Handling / pc", estCost: "Estimated cost / pc",
    discount: "Series discount", totalProd: "Total production time", minOrder: "Minimum order value applied (49 PLN)" },
  de: { application: "Anwendung", resin: "Harz", layer: "Schichthöhe", size: "Modellgröße", qty: "Auflage",
    volume: "Harzvolumen", resinCost: "Harz / Stk.", printTime: "Druckzeit / Stk.", machine: "Maschine / Stk.",
    postProc: "Nachbearbeitung / Stk.", handling: "Handhabung / Stk.", estCost: "Geschätzte Kosten / Stk.",
    discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit", minOrder: "Mindestbestellwert angewendet (49 PLN)" },
};

export function calculateMSLA(params, lang) {
  const { applicationId, resinKey: resinKeyRaw, layerId, sizeId, quantityId, stlData } = params;
  const l = MSLA_LBL[lang] || MSLA_LBL.en;
  const application = APPLICATIONS.find(a => a.id === applicationId);
  const layer = LAYER_HEIGHTS.find(ly => ly.id === layerId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  const resinKey = applicationId === "casting" ? "castable" : resinKeyRaw;
  const resin = RESINS[resinKey];
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
  if (resinKey === "castable") postProcessing *= MSLA_CONFIG.CASTABLE_QC_MULTIPLIER;

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
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${totalTimeH.toFixed(1)} h`, bold: true }] : []),
      ...(minOrderApplied ? [{ label: l.minOrder, value: "" }] : []),
    ],
  };
}

const FILAMENT_IMG = {
  "PLA": "/img/calc/3d_filaments/pla.webp", "PLA Silk": "/img/calc/3d_filaments/pla_silk.webp",
  "PLA Matte": "/img/calc/3d_filaments/pla_matte.webp", "PLA Wood": "/img/calc/3d_filaments/pla_wood.webp",
  "PLA Marble": "/img/calc/3d_filaments/pla_marble.webp", "PETG": "/img/calc/3d_filaments/petg.webp",
  "PETG-CF": "/img/calc/3d_filaments/petg_cf.webp", "TPU 95A": "/img/calc/3d_filaments/tpu.webp",
  "PVA": "/img/calc/3d_filaments/pva.webp", "ASA": "/img/calc/3d_filaments/asa.webp",
  "ABS": "/img/calc/3d_filaments/abs.webp",
  "PA6-CF": "/img/calc/3d_filaments/pa6_cf.webp", "PA6-GF": "/img/calc/3d_filaments/pa6_gf.webp",
  "PA12-CF": "/img/calc/3d_filaments/pa12_cf.webp", "PPA-CF": "/img/calc/3d_filaments/ppa_cf.webp",
  "PPA-GF": "/img/calc/3d_filaments/ppa_gf.webp", "PC": "/img/calc/3d_filaments/pc.webp",
  "PC-ABS": "/img/calc/3d_filaments/pc_abs.webp", "PET-CF": "/img/calc/3d_filaments/pet_cf.webp",
  "PPS": "/img/calc/3d_filaments/pps.webp", "PPS-CF": "/img/calc/3d_filaments/pps_cf.webp",
};

const SEGMENTS = [
  { id: "standard", label: "Standard",
    desc: { pl: "PLA, PETG, TPU, ASA, ABS", en: "PLA, PETG, TPU, ASA, ABS", de: "PLA, PETG, TPU, ASA, ABS" },
    img: "/img/calc/3d_segments/standard.webp" },
  { id: "engineering", label: "Engineering",
    desc: { pl: "PA-CF, PPA-CF, PC, PET-CF, PPS", en: "PA-CF, PPA-CF, PC, PET-CF, PPS", de: "PA-CF, PPA-CF, PC, PET-CF, PPS" },
    img: "/img/calc/3d_segments/engineering.webp" },
];

const INFILL_OPTIONS = [
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
const BUILD_VOL_CM = { x: 30.0, y: 32.0, z: 32.5 };

// Size presets matching manual XS/S/M/L categories (max dimension in cm)
const SIZE_PRESETS = [
  { id: "XS", maxCm: 5.0 },
  { id: "S",  maxCm: 10.0 },
  { id: "M",  maxCm: 20.0 },
  { id: "L",  maxCm: 30.0 },
];

// MSLA scale presets, matching MSLA_SIZES buckets (max dimension in cm)
const MSLA_SIZE_PRESETS = [
  { id: "XS", maxCm: 2.0 },
  { id: "S",  maxCm: 5.0 },
  { id: "M",  maxCm: 10.0 },
  { id: "L",  maxCm: 15.0 },
];

const TECHS = [
  { id: "fdm",  label: { pl: "FDM - Bambu Lab H2D", en: "FDM - Bambu Lab H2D", de: "FDM - Bambu Lab H2D" },
    desc: { pl: "Filament, części funkcjonalne i wielokolorowe", en: "Filament, functional and multi-color parts", de: "Filament, funktionale und mehrfarbige Teile" },
    img: "/img/calc/3d_segments/fdm_bambu.webp" },
  { id: "msla", label: { pl: "Żywica MSLA 16K - Elegoo Saturn 4 Ultra", en: "MSLA Resin 16K - Elegoo Saturn 4 Ultra", de: "MSLA-Harz 16K - Elegoo Saturn 4 Ultra" },
    desc: { pl: "Mikrodetal 14 µm: figurki, wzorce jubilerskie", en: "14 µm micro-detail: figurines, jewelry patterns", de: "14-µm-Mikrodetail: Figuren, Schmuck-Gussmodelle" },
    img: "/img/calc/3d_segments/msla_resin.webp" },
];

const TECH_SWITCH_LBL = { pl: "Technologia druku", en: "Print technology", de: "Drucktechnologie" };

function estimateTimeFromVolume(volumeCm3) {
  return 0.194 * Math.pow(volumeCm3, 0.602);
}

function estimatePcsPerPlate(bbox) {
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
  { id: "XS", label: { pl: "XS — do 5 cm", en: "XS — up to 5 cm", de: "XS — bis 5 cm" }, volumeRef: 30, timeBase: 1.5, pcsPerPlate: 8 },
  { id: "S",  label: { pl: "S — 5–10 cm", en: "S — 5–10 cm", de: "S — 5–10 cm" }, volumeRef: 150, timeBase: 4, pcsPerPlate: 4 },
  { id: "M",  label: { pl: "M — 10–20 cm", en: "M — 10–20 cm", de: "M — 10–20 cm" }, volumeRef: 800, timeBase: 10, pcsPerPlate: 2 },
  { id: "L",  label: { pl: "L — 20–30 cm", en: "L — 20–30 cm", de: "L — 20–30 cm" }, volumeRef: 3000, timeBase: 24, pcsPerPlate: 1 },
  { id: "XL", label: { pl: "XL — powyżej 30 cm", en: "XL — over 30 cm", de: "XL — über 30 cm" }, volumeRef: null, timeBase: null, pcsPerPlate: 1, custom: true },
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

const LBL = {
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

const STL_LBL = {
  pl: { upload: "Załaduj plik STL", orManual: "lub wybierz rozmiar ręcznie poniżej",
    dropHint: "Kliknij lub przeciągnij plik STL", dropSub: "Automatyczna wycena na podstawie objętości i wymiarów",
    volume: "Objętość", dims: "Wymiary",
    triangles: "Trójkąty", remove: "Usuń", exceeds: "Model przekracza przestrzeń druku", stlSize: "Rozmiar z pliku STL",
    scale: "Skala wydruku", fitToPlate: "Dopasuj do płyty", original: "Oryg." },
  en: { upload: "Upload STL file", orManual: "or select size manually below",
    dropHint: "Click or drag & drop an STL file", dropSub: "Auto-quote based on volume and dimensions",
    volume: "Volume", dims: "Dimensions",
    triangles: "Triangles", remove: "Remove", exceeds: "Model exceeds build volume", stlSize: "Size from STL file",
    scale: "Print scale", fitToPlate: "Fit to plate", original: "Orig." },
  de: { upload: "STL-Datei hochladen", orManual: "oder Größe unten manuell wählen",
    dropHint: "Klicken oder STL-Datei hierher ziehen", dropSub: "Automatische Kalkulation anhand von Volumen und Maßen",
    volume: "Volumen", dims: "Abmessungen",
    triangles: "Dreiecke", remove: "Entfernen", exceeds: "Modell überschreitet Bauraum", stlSize: "Größe aus STL-Datei",
    scale: "Druckmaßstab", fitToPlate: "An Platte anpassen", original: "Orig." },
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
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${totalTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

function STLUploadCard({ stlData, stlFileName, scale, onScaleChange, onUpload, onRemove, lang, buildVolCm = BUILD_VOL_CM, sizePresets = SIZE_PRESETS }) {
  const sl = STL_LBL[lang] || STL_LBL.en;
  const fileRef = useRef(null);

  if (!stlData) {
    return (
      <div className="flex flex-col items-center gap-2 mb-3">
        <button onClick={() => fileRef.current?.click()}
          className="group/upload flex flex-col items-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed border-blue-400/30 bg-gradient-to-b from-blue-400/[0.04] to-transparent text-blue-300 hover:bg-blue-400/10 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 w-full cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center group-hover/upload:bg-blue-400/20 group-hover/upload:scale-110 transition-all duration-300">
            <Upload className="w-7 h-7 text-blue-400" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-white mb-1">{sl.dropHint}</div>
            <div className="text-[11px] text-neutral-400">{sl.dropSub}</div>
          </div>
        </button>
        <input ref={fileRef} type="file" accept=".stl" className="hidden" onChange={onUpload} />
        <div className="text-[10px] text-neutral-400">{sl.orManual}</div>
      </div>
    );
  }

  const b = stlData.bbox;
  const rawMaxCm = Math.max(b.x, b.y, b.z);
  const fitScale = Math.min(buildVolCm.x / b.x, buildVolCm.y / b.y, buildVolCm.z / b.z);
  const fitFloor = Math.floor(fitScale * 10000) / 10000;
  const scaledB = { x: b.x * scale, y: b.y * scale, z: b.z * scale };
  const TOL = 0.05;
  const exceeds = scaledB.x > buildVolCm.x + TOL || scaledB.y > buildVolCm.y + TOL || scaledB.z > buildVolCm.z + TOL;
  const scaledVol = stlData.volumeCm3 * scale * scale * scale;

  return (
    <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-blue-300 truncate max-w-[70%]">{stlFileName}</div>
        <button onClick={onRemove} className="text-neutral-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
          <X className="w-3.5 h-3.5" />{sl.remove}
        </button>
      </div>
      <Suspense fallback={<div className="w-full rounded-lg bg-[#0c1222] border border-white/5 animate-pulse" style={{ height: "220px" }} />}>
        <STLViewer triangles={stlData.triangles} bbox={stlData.bbox} />
      </Suspense>
      <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
        <div><div className="text-neutral-400">{sl.volume}</div><div className="font-bold">{scaledVol.toFixed(1)} cm³</div></div>
        <div><div className="text-neutral-400">{sl.dims}</div><div className="font-bold">{(scaledB.x*10).toFixed(1)}×{(scaledB.y*10).toFixed(1)}×{(scaledB.z*10).toFixed(1)} mm</div></div>
        <div><div className="text-neutral-400">{sl.triangles}</div><div className="font-bold">{stlData.triangleCount.toLocaleString()}</div></div>
      </div>

      {/* Scale controls */}
      <div className="border-t border-white/5 pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">{sl.scale}</span>
          <span className="font-bold text-blue-300">{scale === 1 ? "1:1" : `×${scale.toFixed(2)}`}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sizePresets.map(p => {
            const s = Math.floor(Math.min(p.maxCm / rawMaxCm, fitScale) * 10000) / 10000;
            const isActive = Math.abs(scale - s) < 0.005;
            const disabled = p.maxCm / rawMaxCm > fitScale * 1.001;
            return (
              <button key={p.id} onClick={() => onScaleChange(s)} disabled={disabled}
                className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                  isActive ? "border-blue-400 bg-blue-400/10 text-blue-300" :
                  disabled ? "border-white/5 text-neutral-700 cursor-not-allowed" :
                  "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                }`}>
                {p.id}
              </button>
            );
          })}
          <button onClick={() => onScaleChange(1)}
            className={`px-2 py-1 rounded text-[10px] border transition-colors ${
              Math.abs(scale - 1) < 0.005 ? "border-blue-400 bg-blue-400/10 text-blue-300" : "border-white/10 text-neutral-400 hover:border-white/20"
            }`}>{sl.original}</button>
          {fitFloor < 0.999 && (
            <button onClick={() => onScaleChange(fitFloor)}
              className={`px-2 py-1 rounded text-[10px] border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-colors ${
                Math.abs(scale - fitFloor) < 0.005 ? "bg-amber-400/10" : ""
              }`}>{sl.fitToPlate}</button>
          )}
        </div>
      </div>

      {exceeds && (
        <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {sl.exceeds} ({(buildVolCm.x*10).toFixed(0)}×{(buildVolCm.y*10).toFixed(0)}×{(buildVolCm.z*10).toFixed(0)} mm)
        </div>
      )}
    </div>
  );
}

const TECH_LABEL = { pl: "Druk 3D", en: "3D Print", de: "3D-Druck" };
const TECH_LABEL_MSLA = { pl: "Druk żywiczny MSLA", en: "MSLA Resin Print", de: "MSLA-Harzdruck" };

export default function Print3DCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const sl = STL_LBL[lang] || STL_LBL.en;
  const ml = MSLA_LBL[lang] || MSLA_LBL.en;
  const [tech, setTech] = useState("fdm");

  // ---- FDM state ----
  const [segment, setSegment] = useState("standard");
  const [materialKey, setMaterialKey] = useState("PLA");
  const [sizeId, setSizeId] = useState("S");
  const [infillId, setInfillId] = useState("low");
  const [colorId, setColorId] = useState(1);
  const [precisionId, setPrecisionId] = useState("standard_04");
  const [quantityId, setQuantityId] = useState("proto");
  const [stlData, setStlData] = useState(null);
  const [stlFile, setStlFile] = useState(null);
  const [stlFileName, setStlFileName] = useState("");
  const [stlScale, setStlScale] = useState(1);

  // ---- MSLA state ----
  const [applicationId, setApplicationId] = useState("prototype");
  const [resinKey, setResinKey] = useState("standard");
  const [layerId, setLayerId] = useState("standard");
  const [mslaSizeId, setMslaSizeId] = useState("S");
  const [mslaQuantityId, setMslaQuantityId] = useState("proto");
  const [mslaStlData, setMslaStlData] = useState(null);
  const [mslaStlFile, setMslaStlFile] = useState(null);
  const [mslaStlFileName, setMslaStlFileName] = useState("");
  const [mslaStlScale, setMslaStlScale] = useState(1);

  useEffect(() => {
    const mats = Object.keys(FILAMENTS[segment].materials);
    if (!mats.includes(materialKey)) setMaterialKey(mats[0]);
  }, [segment]);

  // Casting patterns require the castable resin
  useEffect(() => {
    if (applicationId === "casting") setResinKey("castable");
    else if (resinKey === "castable") setResinKey("standard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function handleSTLUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const { parseSTL } = await import("../../utils/stlParser.js");
    const data = parseSTL(buffer);
    setStlData(data);
    setStlFile(file);
    setStlFileName(file.name);
    setStlScale(1);
  }

  function handleSTLRemove() {
    setStlData(null);
    setStlFile(null);
    setStlFileName("");
    setStlScale(1);
  }

  async function handleMslaSTLUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const { parseSTL } = await import("../../utils/stlParser.js");
    const data = parseSTL(buffer);
    setMslaStlData(data);
    setMslaStlFile(file);
    setMslaStlFileName(file.name);
    setMslaStlScale(1);
  }

  function handleMslaSTLRemove() {
    setMslaStlData(null);
    setMslaStlFile(null);
    setMslaStlFileName("");
    setMslaStlScale(1);
  }

  const scaledStlData = useMemo(() => {
    if (!stlData || stlScale === 1) return stlData;
    const s = stlScale;
    return {
      ...stlData,
      volumeCm3: stlData.volumeCm3 * s * s * s,
      bbox: { x: stlData.bbox.x * s, y: stlData.bbox.y * s, z: stlData.bbox.z * s },
    };
  }, [stlData, stlScale]);

  const scaledMslaStlData = useMemo(() => {
    if (!mslaStlData || mslaStlScale === 1) return mslaStlData;
    const s = mslaStlScale;
    return {
      ...mslaStlData,
      volumeCm3: mslaStlData.volumeCm3 * s * s * s,
      bbox: { x: mslaStlData.bbox.x * s, y: mslaStlData.bbox.y * s, z: mslaStlData.bbox.z * s },
    };
  }, [mslaStlData, mslaStlScale]);

  const result = useMemo(() => calculate({ segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, stlData: scaledStlData }, lang),
    [segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, scaledStlData, lang]);

  const mslaResult = useMemo(() => calculateMSLA({ applicationId, resinKey, layerId, sizeId: mslaSizeId, quantityId: mslaQuantityId, stlData: scaledMslaStlData }, lang),
    [applicationId, resinKey, layerId, mslaSizeId, mslaQuantityId, scaledMslaStlData, lang]);

  const matOptions = Object.entries(FILAMENTS[segment].materials).map(([k, v]) => ({
    id: k, label: k, sub: `${v.price_kg}zł`, img: FILAMENT_IMG[k],
  }));

  const resinOptions = Object.entries(RESINS).map(([k, v]) => ({
    id: k, label: v.label, desc: v.desc, img: v.img,
  }));

  const stlSummary = stlData
    ? `STL: ${stlFileName} (${(stlData.volumeCm3 * stlScale ** 3).toFixed(1)} cm³${stlScale !== 1 ? ` ×${stlScale.toFixed(2)}` : ""})`
    : null;

  const mslaStlSummary = mslaStlData
    ? `STL: ${mslaStlFileName} (${(mslaStlData.volumeCm3 * mslaStlScale ** 3).toFixed(1)} cm³${mslaStlScale !== 1 ? ` ×${mslaStlScale.toFixed(2)}` : ""})`
    : null;

  const isFigurine = applicationId === "figurine";

  if (tech === "msla") {
    const mslaParamsSummary = [
      t(APPLICATIONS.find(a => a.id === applicationId)?.label, lang),
      t(RESINS[resinKey]?.label, lang),
      t(LAYER_HEIGHTS.find(ly => ly.id === layerId)?.label, lang),
      mslaStlSummary || t(MSLA_SIZES.find(s => s.id === mslaSizeId)?.label, lang),
      t(QUANTITY_TIERS.find(q => q.id === mslaQuantityId)?.label, lang),
    ].join(" | ");

    return (
      <div>
        <div className="text-center text-[11px] text-neutral-400 mb-6">Elegoo Saturn 4 Ultra 16K · 218×123×250 mm · 14µm piksel</div>

        <CalcCard stepNum="①" label={t(TECH_SWITCH_LBL, lang)}>
          <HeroCards options={TECHS} value={tech} onChange={setTech} lang={lang} cols="grid-cols-2" minH={170} />
        </CalcCard>

        <CalcCard stepNum="②" label={ml.application}>
          <Chips options={APPLICATIONS} value={applicationId} onChange={setApplicationId} lang={lang} />
        </CalcCard>

        <CalcCard stepNum="③" label={ml.resin}>
          <MaterialCards options={resinOptions} value={resinKey} onChange={setResinKey} lang={lang} cols="grid-cols-3" />
        </CalcCard>

        {isFigurine && <LicenseNotice lang={lang} />}

        <CalcCard stepNum="④" label={ml.layer}>
          <Chips options={LAYER_HEIGHTS} value={layerId} onChange={setLayerId} lang={lang} />
        </CalcCard>

        <CalcCard stepNum="⑤" label={mslaStlData ? sl.stlSize : ml.size} id="file-upload">
          <STLUploadCard stlData={mslaStlData} stlFileName={mslaStlFileName} scale={mslaStlScale} onScaleChange={setMslaStlScale}
            onUpload={handleMslaSTLUpload} onRemove={handleMslaSTLRemove} lang={lang}
            buildVolCm={MSLA_BUILD_VOL_CM} sizePresets={MSLA_SIZE_PRESETS} />
          {!mslaStlData && <Chips options={MSLA_SIZES} value={mslaSizeId} onChange={setMslaSizeId} lang={lang} />}
        </CalcCard>

        <CalcCard stepNum="⑥" label={ml.qty}><Chips options={QUANTITY_TIERS} value={mslaQuantityId} onChange={setMslaQuantityId} lang={lang} /></CalcCard>

        <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
          <ResultHeader lang={lang} />
          <ResultDisplay result={mslaResult} lang={lang} />
          <QuoteEmailCapture result={mslaResult} lang={lang} techLabel={t(TECH_LABEL_MSLA, lang)} preAttachedFile={mslaStlFile} paramsSummary={mslaParamsSummary} />
        </div>

        <InquiryForm lang={lang} techLabel={t(TECH_LABEL_MSLA, lang)} preAttachedFile={mslaStlFile} paramsSummary={mslaParamsSummary}
          requireLicenseConsent={isFigurine} />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-400 mb-6">Bambu Lab H2D · 300×320×325 mm · Dual Extruder · AMS 2 Pro</div>

      <CalcCard stepNum="①" label={t(TECH_SWITCH_LBL, lang)}>
        <HeroCards options={TECHS} value={tech} onChange={setTech} lang={lang} cols="grid-cols-2" minH={170} />
      </CalcCard>

      <CalcCard stepNum="②" label={l.segment}>
        <HeroCards options={SEGMENTS} value={segment} onChange={setSegment} lang={lang} cols="grid-cols-2" minH={170} />
      </CalcCard>

      <CalcCard stepNum="③" label={`${l.filament} — ${FILAMENTS[segment].label}`}>
        <MaterialCards options={matOptions} value={materialKey} onChange={setMaterialKey} lang={lang} cols="grid-cols-3 sm:grid-cols-4 md:grid-cols-6" />
      </CalcCard>

      <CalcCard stepNum="④" label={stlData ? sl.stlSize : l.size} id="file-upload">
        <STLUploadCard stlData={stlData} stlFileName={stlFileName} scale={stlScale} onScaleChange={setStlScale} onUpload={handleSTLUpload} onRemove={handleSTLRemove} lang={lang} />
        {!stlData && <Chips options={SIZES} value={sizeId} onChange={setSizeId} lang={lang} />}
      </CalcCard>

      <CalcCard stepNum="⑤" label={l.infill}><HeroCards options={INFILL_OPTIONS} value={infillId} onChange={setInfillId} lang={lang} cols="grid-cols-2 sm:grid-cols-4" minH={150} /></CalcCard>
      <CalcCard stepNum="⑥" label={l.colors}><Chips options={COLORS} value={colorId} onChange={setColorId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑦" label={l.precision}><Chips options={PRECISION} value={precisionId} onChange={setPrecisionId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑧" label={l.qty}><Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} /></CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
        <QuoteEmailCapture result={result} lang={lang} techLabel={t(TECH_LABEL, lang)} preAttachedFile={stlFile} paramsSummary={[
          `${FILAMENTS[segment].label}: ${materialKey}`,
          stlSummary || t(SIZES.find(s => s.id === sizeId)?.label, lang),
          t(INFILL_OPTIONS.find(i => i.id === infillId)?.label, lang),
          t(COLORS.find(c => c.id === colorId)?.label, lang),
          t(PRECISION.find(p => p.id === precisionId)?.label, lang),
          t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
        ].join(" | ")} />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} preAttachedFile={stlFile} paramsSummary={[
        `${FILAMENTS[segment].label}: ${materialKey}`,
        stlSummary || t(SIZES.find(s => s.id === sizeId)?.label, lang),
        t(INFILL_OPTIONS.find(i => i.id === infillId)?.label, lang),
        t(COLORS.find(c => c.id === colorId)?.label, lang),
        t(PRECISION.find(p => p.id === precisionId)?.label, lang),
        t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
      ].join(" | ")} />
    </div>
  );
}
