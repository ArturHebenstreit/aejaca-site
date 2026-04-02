// ============================================================
// 3D PRINT ESTIMATOR — Bambu Lab H2D  v1.1
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, Chips, CalcCard, ResultDisplay } from "./calcShared.jsx";

const PRINT_CONFIG = {
  PRINTER_POWER_KW: 0.35,
  DEPRECIATION_PLN_H: 2.50,
  ENGINEERING_PREMIUM: 0.35,
};

const FILAMENTS = {
  standard: {
    label: "FDM Classic",
    materials: {
      "PLA":        { price_kg: 80,  density: 1.24, desc: "Uniwersalny" },
      "PLA Silk":   { price_kg: 110, density: 1.24, desc: "Efekt metaliczny" },
      "PLA Matte":  { price_kg: 95,  density: 1.24, desc: "Matowe" },
      "PLA Wood":   { price_kg: 120, density: 1.20, desc: "Efekt drewna" },
      "PLA Marble": { price_kg: 115, density: 1.24, desc: "Efekt marmuru" },
      "PETG":       { price_kg: 90,  density: 1.27, desc: "Odporność chem." },
      "PETG-CF":    { price_kg: 160, density: 1.30, desc: "PETG + carbon" },
      "TPU 95A":    { price_kg: 130, density: 1.21, desc: "Elastyczny" },
      "PVA":        { price_kg: 200, density: 1.19, desc: "Rozpuszczalny" },
      "ASA":        { price_kg: 100, density: 1.07, desc: "UV-odporny" },
      "ABS":        { price_kg: 85,  density: 1.04, desc: "Wytrzymały" },
    }
  },
  engineering: {
    label: "Engineering",
    materials: {
      "PA6-CF":   { price_kg: 280, density: 1.18, desc: "Nylon + CF" },
      "PA6-GF":   { price_kg: 220, density: 1.25, desc: "Nylon + GF" },
      "PA12-CF":  { price_kg: 300, density: 1.15, desc: "PA12 + CF" },
      "PPA-CF":   { price_kg: 350, density: 1.22, desc: "PPA + CF" },
      "PPA-GF":   { price_kg: 300, density: 1.30, desc: "PPA + GF" },
      "PC":       { price_kg: 180, density: 1.20, desc: "Poliwęglan" },
      "PC-ABS":   { price_kg: 170, density: 1.15, desc: "PC + ABS" },
      "PET-CF":   { price_kg: 240, density: 1.35, desc: "PET + CF" },
      "PPS":      { price_kg: 500, density: 1.35, desc: "Polisulfon" },
      "PPS-CF":   { price_kg: 600, density: 1.40, desc: "PPS + CF" },
    }
  }
};

const SIZES = [
  { id: "XS", label: "XS — do 5 cm", volumeRef: 30, timeBase: 1.5 },
  { id: "S",  label: "S — 5–10 cm",   volumeRef: 150, timeBase: 4 },
  { id: "M",  label: "M — 10–20 cm",  volumeRef: 800, timeBase: 10 },
  { id: "L",  label: "L — 20–30 cm",  volumeRef: 3000, timeBase: 24 },
  { id: "XL", label: "XL — powyżej 30 cm", volumeRef: null, timeBase: null, custom: true },
];

const INFILL = [
  { id: "low",    label: "Niskie (≤15%)",    avg: 0.12 },
  { id: "medium", label: "Średnie (15–50%)",  avg: 0.35 },
  { id: "high",   label: "Wysokie (>50%)",    avg: 0.70 },
  { id: "custom", label: "Niestandardowe",    avg: null, custom: true },
];

const COLORS = [
  { id: 1, label: "1 kolor",              timeMul: 1.0,  wasteMul: 1.0 },
  { id: 2, label: "2 kolory (dual head)", timeMul: 1.08, wasteMul: 1.05 },
  { id: 3, label: "3 kolory (AMS)",       timeMul: 1.30, wasteMul: 1.25 },
  { id: 4, label: "4 kolory (AMS)",       timeMul: 1.55, wasteMul: 1.45 },
  { id: 5, label: "5 kolorów (AMS)",      timeMul: 1.80, wasteMul: 1.65 },
  { id: 0, label: "Niestandardowe",       timeMul: null, wasteMul: null, custom: true },
];

const PRECISION = [
  { id: "draft_04",    label: "0.4mm Draft (0.28)",   speedMul: 0.70 },
  { id: "standard_04", label: "0.4mm Standard (0.20)", speedMul: 1.00 },
  { id: "quality_04",  label: "0.4mm Jakość (0.12)",   speedMul: 1.50 },
  { id: "fine_04",     label: "0.4mm Fine (0.08)",     speedMul: 2.20 },
  { id: "standard_02", label: "0.2mm Standard (0.10)", speedMul: 2.50 },
  { id: "fine_02",     label: "0.2mm Fine (0.06)",     speedMul: 4.00 },
  { id: "custom",      label: "Niestandardowe",        speedMul: null, custom: true },
];

function calculate(params) {
  const { segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId } = params;
  const size = SIZES.find(s => s.id === sizeId);
  const infill = INFILL.find(i => i.id === infillId);
  const color = COLORS.find(c => c.id === colorId);
  const prec = PRECISION.find(p => p.id === precisionId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  const mat = FILAMENTS[segment]?.materials[materialKey];
  if (!size || !infill || !color || !prec || !qTier || !mat) return null;
  if (!size.volumeRef || !infill.avg || color.timeMul == null || !prec.speedMul || !qTier.qty) return { type: "custom" };

  const shellFrac = 0.18;
  const effectiveFill = shellFrac + infill.avg * (1 - shellFrac);
  const massG = size.volumeRef * effectiveFill * mat.density;
  const materialCost = (massG / 1000) * mat.price_kg * color.wasteMul * 1.05;
  const printTime = size.timeBase * prec.speedMul * color.timeMul;
  const timePerPc = printTime + 0.5 / qTier.qty;
  const energyCost = timePerPc * PRINT_CONFIG.PRINTER_POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = timePerPc * PRINT_CONFIG.DEPRECIATION_PLN_H;
  const baseCost = materialCost + energyCost + deprCost;
  let margin = CONFIG.BASE_MARGIN;
  if (segment === "engineering") margin += PRINT_CONFIG.ENGINEERING_PREMIUM;

  const pricing = applyPricing(baseCost, margin, qTier.discount, qTier.qty);
  return {
    type: "calculated",
    ...pricing,
    qty: qTier.qty,
    discount: qTier.discount,
    breakdown: [
      { label: "Masa / szt.", value: `${(massG).toFixed(1)} g` },
      { label: "Materiał / szt.", value: `${materialCost.toFixed(2)} PLN` },
      { label: "Czas druku / szt.", value: `${printTime.toFixed(1)} h` },
      { label: "Czas + setup / szt.", value: `${timePerPc.toFixed(1)} h` },
      { label: "Energia / szt.", value: `${energyCost.toFixed(2)} PLN` },
      { label: "Amortyzacja / szt.", value: `${deprCost.toFixed(2)} PLN` },
      { divider: true },
      { label: "Koszt bazowy / szt.", value: `${baseCost.toFixed(2)} PLN`, bold: true },
      { label: "Marża", value: `${Math.round(margin * 100)}%` },
      ...(qTier.discount > 0 ? [{ label: `Rabat seryjny`, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

export default function Print3DCalc({ lang = "pl" }) {
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

  const result = useMemo(() => calculate({ segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId }),
    [segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId]);

  const matOptions = Object.entries(FILAMENTS[segment].materials).map(([k, v]) => ({
    id: k, label: k, sub: `${v.price_kg}zł`, note: v.desc,
  }));

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">Bambu Lab H2D · Dual Extruder · AMS 2 Pro</div>

      {/* Segment */}
      <CalcCard stepNum="①" label="Segment wydruku">
        <div className="grid grid-cols-2 gap-3">
          {["standard", "engineering"].map(seg => (
            <button key={seg} onClick={() => setSegment(seg)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                segment === seg
                  ? "border-blue-400 bg-blue-400/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}>
              <div className={`text-sm font-bold mb-1 ${segment === seg ? "text-blue-300" : "text-white"}`}>
                {seg === "standard" ? "FDM Classic" : "Engineering"}
              </div>
              <div className="text-[11px] text-neutral-500">
                {seg === "standard" ? "PLA, PETG, TPU, ASA, ABS" : "PA-CF, PPA-CF, PC, PET-CF, PPS"}
              </div>
            </button>
          ))}
        </div>
      </CalcCard>

      <CalcCard stepNum="②" label={`Filament — ${FILAMENTS[segment].label}`}>
        <Chips options={matOptions} value={materialKey} onChange={setMaterialKey} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="③" label="Rozmiar modelu">
        <Chips options={SIZES} value={sizeId} onChange={setSizeId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="④" label="Wypełnienie (infill)">
        <Chips options={INFILL} value={infillId} onChange={setInfillId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑤" label="Liczba kolorów">
        <Chips options={COLORS} value={colorId} onChange={setColorId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑥" label="Precyzja (nozzle × warstwa)">
        <Chips options={PRECISION} value={precisionId} onChange={setPrecisionId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑦" label="Nakład">
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      {/* Result */}
      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">Szacowany zakres cenowy</div>
        <ResultDisplay result={result} lang={lang} />
      </div>
    </div>
  );
}
