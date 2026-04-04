// ============================================================
// 3D PRINT ESTIMATOR — Bambu Lab H2D  v1.1
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";

const PRINT_CONFIG = {
  PRINTER_POWER_KW: 0.35,
  DEPRECIATION_PLN_H: 2.50,
  ENGINEERING_PREMIUM: 0.35,
};

const FILAMENTS = {
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

const SIZES = [
  { id: "XS", label: { pl: "XS — do 5 cm", en: "XS — up to 5 cm", de: "XS — bis 5 cm" }, volumeRef: 30, timeBase: 1.5, pcsPerPlate: 8 },
  { id: "S",  label: { pl: "S — 5–10 cm", en: "S — 5–10 cm", de: "S — 5–10 cm" }, volumeRef: 150, timeBase: 4, pcsPerPlate: 4 },
  { id: "M",  label: { pl: "M — 10–20 cm", en: "M — 10–20 cm", de: "M — 10–20 cm" }, volumeRef: 800, timeBase: 10, pcsPerPlate: 2 },
  { id: "L",  label: { pl: "L — 20–30 cm", en: "L — 20–30 cm", de: "L — 20–30 cm" }, volumeRef: 3000, timeBase: 24, pcsPerPlate: 1 },
  { id: "XL", label: { pl: "XL — powyżej 30 cm", en: "XL — over 30 cm", de: "XL — über 30 cm" }, volumeRef: null, timeBase: null, pcsPerPlate: 1, custom: true },
];

const INFILL = [
  { id: "low",    label: { pl: "Niskie (≤15%)", en: "Low (≤15%)", de: "Niedrig (≤15%)" }, avg: 0.12 },
  { id: "medium", label: { pl: "Średnie (15–50%)", en: "Medium (15–50%)", de: "Mittel (15–50%)" }, avg: 0.35 },
  { id: "high",   label: { pl: "Wysokie (>50%)", en: "High (>50%)", de: "Hoch (>50%)" }, avg: 0.70 },
  { id: "custom", label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, avg: null, custom: true },
];

const COLORS = [
  { id: 1, label: { pl: "1 kolor", en: "1 color", de: "1 Farbe" }, timeMul: 1.0, wasteMul: 1.0 },
  { id: 2, label: { pl: "2 kolory (dual head)", en: "2 colors (dual head)", de: "2 Farben (dual head)" }, timeMul: 1.08, wasteMul: 1.05 },
  { id: 3, label: { pl: "3 kolory (AMS)", en: "3 colors (AMS)", de: "3 Farben (AMS)" }, timeMul: 1.30, wasteMul: 1.25 },
  { id: 4, label: { pl: "4 kolory (AMS)", en: "4 colors (AMS)", de: "4 Farben (AMS)" }, timeMul: 1.55, wasteMul: 1.45 },
  { id: 5, label: { pl: "5 kolorów (AMS)", en: "5 colors (AMS)", de: "5 Farben (AMS)" }, timeMul: 1.80, wasteMul: 1.65 },
  { id: 0, label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, timeMul: null, wasteMul: null, custom: true },
];

const PRECISION = [
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
    energy: "Energia / szt.", depreciation: "Amortyzacja / szt.", workshop: "Usługi warsztatowe",
    estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie" },
  en: { segment: "Print segment", filament: "Filament", size: "Model size", infill: "Infill",
    colors: "Number of colors", precision: "Precision (nozzle × layer)", qty: "Quantity",
    mass: "Mass / pc", material: "Material / pc", printTime: "Print time / pc", timeSetup: "Time + setup / pc",
    energy: "Energy / pc", depreciation: "Depreciation / pc", workshop: "Workshop services",
    estCost: "Estimated cost / pc", discount: "Series discount", totalProd: "Total production time" },
  de: { segment: "Drucksegment", filament: "Filament", size: "Modellgröße", infill: "Füllung (Infill)",
    colors: "Anzahl Farben", precision: "Präzision (Düse × Schicht)", qty: "Auflage",
    mass: "Masse / Stk.", material: "Material / Stk.", printTime: "Druckzeit / Stk.", timeSetup: "Zeit + Setup / Stk.",
    energy: "Energie / Stk.", depreciation: "Abschreibung / Stk.", workshop: "Werkstattleistungen",
    estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit" },
};

function calculate(params, lang) {
  const { segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId } = params;
  const size = SIZES.find(s => s.id === sizeId);
  const infill = INFILL.find(i => i.id === infillId);
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
  const handlePerPc = 0.05; // 3min load/unload per piece
  const timePerPc = printTime + setupPerPc + handlePerPc;
  const energyCost = timePerPc * PRINT_CONFIG.PRINTER_POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = timePerPc * PRINT_CONFIG.DEPRECIATION_PLN_H;
  const baseCost = materialCost + energyCost + deprCost;
  let margin = CONFIG.BASE_MARGIN;
  if (segment === "engineering") margin += PRINT_CONFIG.ENGINEERING_PREMIUM;

  // Batch time: account for packing multiple pieces per plate
  const platesNeeded = Math.ceil(qTier.qty / (size.pcsPerPlate || 1));
  const totalTimeH = (printTime * platesNeeded) + (0.5) + (handlePerPc * qTier.qty);

  const pricing = applyPricing(baseCost, margin, qTier.discount, qTier.qty);
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
      { label: l.workshop, value: fmtCost(baseCost * margin, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + margin), lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${totalTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

const TECH_LABEL = { pl: "Druk 3D", en: "3D Print", de: "3D-Druck" };

export default function Print3DCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const [segment, setSegment] = useState("standard");
  const [materialKey, setMaterialKey] = useState("PLA");
  const [sizeId, setSizeId] = useState("S");
  const [infillId, setInfillId] = useState("low");
  const [colorId, setColorId] = useState(1);
  const [precisionId, setPrecisionId] = useState("standard_04");
  const [quantityId, setQuantityId] = useState("proto");

  useEffect(() => {
    const mats = Object.keys(FILAMENTS[segment].materials);
    if (!mats.includes(materialKey)) setMaterialKey(mats[0]);
  }, [segment]);

  const result = useMemo(() => calculate({ segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId }, lang),
    [segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, lang]);

  const matOptions = Object.entries(FILAMENTS[segment].materials).map(([k, v]) => ({
    id: k, label: k, sub: `${v.price_kg}zł`,
  }));

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">Bambu Lab H2D · Dual Extruder · AMS 2 Pro</div>

      <CalcCard stepNum="①" label={l.segment}>
        <div className="grid grid-cols-2 gap-3">
          {["standard", "engineering"].map(seg => (
            <button key={seg} onClick={() => setSegment(seg)}
              className={`p-3.5 rounded-xl border text-left transition-all ${segment === seg ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className={`text-sm font-bold mb-1 ${segment === seg ? "text-blue-300" : "text-white"}`}>
                {seg === "standard" ? "Standard" : "Engineering"}
              </div>
              <div className="text-[11px] text-neutral-500">
                {seg === "standard" ? "PLA, PETG, TPU, ASA, ABS" : "PA-CF, PPA-CF, PC, PET-CF, PPS"}
              </div>
            </button>
          ))}
        </div>
      </CalcCard>

      <CalcCard stepNum="②" label={`${l.filament} — ${FILAMENTS[segment].label}`}>
        <Chips options={matOptions} value={materialKey} onChange={setMaterialKey} lang={lang} />
      </CalcCard>
      <CalcCard stepNum="③" label={l.size}><Chips options={SIZES} value={sizeId} onChange={setSizeId} lang={lang} /></CalcCard>
      <CalcCard stepNum="④" label={l.infill}><Chips options={INFILL} value={infillId} onChange={setInfillId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑤" label={l.colors}><Chips options={COLORS} value={colorId} onChange={setColorId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑥" label={l.precision}><Chips options={PRECISION} value={precisionId} onChange={setPrecisionId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑦" label={l.qty}><Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} /></CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={[
        `${FILAMENTS[segment].label}: ${materialKey}`,
        t(SIZES.find(s => s.id === sizeId)?.label, lang),
        t(INFILL.find(i => i.id === infillId)?.label, lang),
        t(COLORS.find(c => c.id === colorId)?.label, lang),
        t(PRECISION.find(p => p.id === precisionId)?.label, lang),
        t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
      ].join(" | ")} />
    </div>
  );
}
