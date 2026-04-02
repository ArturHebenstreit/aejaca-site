// ============================================================
// CO2 LASER ESTIMATOR — xTool P2 55W
// ============================================================
// Modes: Engraving (raster) | Cutting (vector)
// Work area: 600 × 288 mm
// Power consumption: ~0.80 kW
// Depreciation: ~16,000 PLN / 5000h = 3.20 PLN/h
// ============================================================
import { useState, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, Chips, CalcCard, ResultDisplay } from "./calcShared.jsx";

const CO2_CONFIG = {
  POWER_KW: 0.80,
  DEPRECIATION_PLN_H: 3.20,
};

// --- ENGRAVING: time in minutes per cm² at standard detail ---
const ENGRAVE_MATERIALS = [
  { id: "wood",    label: "Drewno",           rateMin: 0.07, prepCost: 0.5 },
  { id: "plywood", label: "Sklejka",          rateMin: 0.07, prepCost: 0.4 },
  { id: "acrylic", label: "Akryl",            rateMin: 0.08, prepCost: 0.8 },
  { id: "glass",   label: "Szkło",            rateMin: 0.20, prepCost: 1.0 },
  { id: "leather", label: "Skóra",            rateMin: 0.06, prepCost: 1.2 },
  { id: "paper",   label: "Papier / karton",  rateMin: 0.05, prepCost: 0.2 },
  { id: "fabric",  label: "Tkanina",          rateMin: 0.07, prepCost: 0.6 },
  { id: "rubber",  label: "Guma / pieczątki", rateMin: 0.10, prepCost: 0.8 },
  { id: "stone",   label: "Kamień / łupek",   rateMin: 0.25, prepCost: 1.5 },
  { id: "custom",  label: "Inny materiał",    rateMin: null, prepCost: null, custom: true },
];

const ENGRAVE_AREAS = [
  { id: "XS", label: "XS — do 25 cm²",        area: 15 },
  { id: "S",  label: "S — 25–100 cm²",         area: 60 },
  { id: "M",  label: "M — 100–400 cm²",        area: 250 },
  { id: "L",  label: "L — 400–1000 cm²",       area: 700 },
  { id: "XL", label: "XL — powyżej 1000 cm²",  area: null, custom: true },
];

const ENGRAVE_DETAIL = [
  { id: "simple",   label: "Prosty (tekst/logo)",     mul: 0.7 },
  { id: "standard", label: "Średni (grafika)",         mul: 1.0 },
  { id: "photo",    label: "Wysoki (fotograwer)",      mul: 2.2 },
  { id: "custom",   label: "Niestandardowy",           mul: null, custom: true },
];

// --- CUTTING: time in seconds per cm of path, material cost PLN/cm² of sheet ---
const CUT_MATERIALS = [
  { id: "ply3",     label: "Sklejka 3mm",     cutRate: 0.15, matCost: 0.04 },
  { id: "ply5",     label: "Sklejka 5mm",     cutRate: 0.25, matCost: 0.06 },
  { id: "ply8",     label: "Sklejka 8mm",     cutRate: 0.50, matCost: 0.09 },
  { id: "acr3",     label: "Akryl 3mm",       cutRate: 0.20, matCost: 0.12 },
  { id: "acr5",     label: "Akryl 5mm",       cutRate: 0.35, matCost: 0.18 },
  { id: "acr8",     label: "Akryl 8mm",       cutRate: 0.60, matCost: 0.28 },
  { id: "leather2", label: "Skóra 1–2mm",     cutRate: 0.10, matCost: 0.20 },
  { id: "leather4", label: "Skóra 3–4mm",     cutRate: 0.20, matCost: 0.35 },
  { id: "paper",    label: "Papier / karton",  cutRate: 0.05, matCost: 0.01 },
  { id: "fabric",   label: "Tkanina / filc",  cutRate: 0.08, matCost: 0.06 },
  { id: "rubber",   label: "Guma 2–3mm",      cutRate: 0.18, matCost: 0.10 },
  { id: "custom",   label: "Inny materiał",   cutRate: null, matCost: null, custom: true },
];

const CUT_PATHS = [
  { id: "XS", label: "XS — do 50 cm",         pathCm: 30,   sheetCm2: 50 },
  { id: "S",  label: "S — 50–200 cm",          pathCm: 120,  sheetCm2: 200 },
  { id: "M",  label: "M — 200–500 cm",         pathCm: 350,  sheetCm2: 600 },
  { id: "L",  label: "L — 500–1500 cm",        pathCm: 1000, sheetCm2: 1500 },
  { id: "XL", label: "XL — powyżej 1500 cm",   pathCm: null, sheetCm2: null, custom: true },
];

const CUT_COMPLEXITY = [
  { id: "simple",   label: "Proste kształty",      mul: 0.8 },
  { id: "moderate", label: "Średnie (krzywe, wcięcia)", mul: 1.0 },
  { id: "complex",  label: "Złożone (intricate/fine)",  mul: 1.5 },
  { id: "custom",   label: "Niestandardowe",        mul: null, custom: true },
];

function calcEngrave({ matId, areaId, detailId, quantityId }) {
  const mat = ENGRAVE_MATERIALS.find(m => m.id === matId);
  const area = ENGRAVE_AREAS.find(a => a.id === areaId);
  const detail = ENGRAVE_DETAIL.find(d => d.id === detailId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !area || !detail || !qTier) return null;
  if (!mat.rateMin || !area.area || !detail.mul || !qTier.qty) return { type: "custom" };

  const timeMin = area.area * mat.rateMin * detail.mul;
  const timeH = timeMin / 60;
  const setupH = 0.25 / qTier.qty; // 15min setup / qty
  const totalTimeH = timeH + setupH;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const prepCost = area.area * mat.prepCost * 0.01; // material surface prep per cm²
  const baseCost = energyCost + deprCost + prepCost;

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      { label: "Czas grawerowania", value: `${timeMin.toFixed(1)} min` },
      { label: "Czas + setup / szt.", value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: "Przygotowanie mat.", value: `${prepCost.toFixed(2)} PLN` },
      { label: "Energia / szt.", value: `${energyCost.toFixed(2)} PLN` },
      { label: "Amortyzacja / szt.", value: `${deprCost.toFixed(2)} PLN` },
      { divider: true },
      { label: "Koszt bazowy / szt.", value: `${baseCost.toFixed(2)} PLN`, bold: true },
      { label: "Marża", value: `${Math.round(CONFIG.BASE_MARGIN * 100)}%` },
      ...(qTier.discount > 0 ? [{ label: "Rabat seryjny", value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

function calcCut({ matId, pathId, complexId, quantityId }) {
  const mat = CUT_MATERIALS.find(m => m.id === matId);
  const path = CUT_PATHS.find(p => p.id === pathId);
  const cmplx = CUT_COMPLEXITY.find(c => c.id === complexId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !path || !cmplx || !qTier) return null;
  if (!mat.cutRate || !path.pathCm || !cmplx.mul || !qTier.qty) return { type: "custom" };

  const cutTimeSec = path.pathCm * mat.cutRate * cmplx.mul;
  const cutTimeMin = cutTimeSec / 60;
  const cutTimeH = cutTimeMin / 60;
  const setupH = 0.2 / qTier.qty;
  const totalTimeH = cutTimeH + setupH;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const materialCost = path.sheetCm2 * mat.matCost * 1.15; // +15% waste
  const baseCost = materialCost + energyCost + deprCost;

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      { label: "Czas cięcia", value: `${cutTimeMin.toFixed(1)} min` },
      { label: "Materiał / szt.", value: `${materialCost.toFixed(2)} PLN` },
      { label: "Energia / szt.", value: `${energyCost.toFixed(2)} PLN` },
      { label: "Amortyzacja / szt.", value: `${deprCost.toFixed(2)} PLN` },
      { divider: true },
      { label: "Koszt bazowy / szt.", value: `${baseCost.toFixed(2)} PLN`, bold: true },
      { label: "Marża", value: `${Math.round(CONFIG.BASE_MARGIN * 100)}%` },
      ...(qTier.discount > 0 ? [{ label: "Rabat seryjny", value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

export default function CO2LaserCalc({ lang = "pl" }) {
  const [mode, setMode] = useState("engrave");
  // Engrave state
  const [eMatId, setEMatId] = useState("wood");
  const [eAreaId, setEAreaId] = useState("S");
  const [eDetailId, setEDetailId] = useState("standard");
  const [eQtyId, setEQtyId] = useState("proto");
  // Cut state
  const [cMatId, setCMatId] = useState("ply3");
  const [cPathId, setCPathId] = useState("S");
  const [cComplexId, setCComplexId] = useState("moderate");
  const [cQtyId, setCQtyId] = useState("proto");

  const result = useMemo(() => {
    if (mode === "engrave") return calcEngrave({ matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId });
    return calcCut({ matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId });
  }, [mode, eMatId, eAreaId, eDetailId, eQtyId, cMatId, cPathId, cComplexId, cQtyId]);

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">xTool P2 · 55W CO2 · 600×288 mm</div>

      {/* Mode */}
      <CalcCard stepNum="①" label="Tryb pracy">
        <div className="grid grid-cols-2 gap-3">
          {[{ id: "engrave", label: "Grawerowanie", desc: "Raster — znakowanie powierzchni" },
            { id: "cut", label: "Cięcie", desc: "Wektor — wycinanie kształtów" }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${mode === m.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className={`text-sm font-bold mb-1 ${mode === m.id ? "text-blue-300" : "text-white"}`}>{m.label}</div>
              <div className="text-[11px] text-neutral-500">{m.desc}</div>
            </button>
          ))}
        </div>
      </CalcCard>

      {mode === "engrave" ? (
        <>
          <CalcCard stepNum="②" label="Materiał">
            <Chips options={ENGRAVE_MATERIALS} value={eMatId} onChange={setEMatId} lang={lang} />
          </CalcCard>
          <CalcCard stepNum="③" label="Powierzchnia grawerowania">
            <Chips options={ENGRAVE_AREAS} value={eAreaId} onChange={setEAreaId} lang={lang} />
          </CalcCard>
          <CalcCard stepNum="④" label="Poziom detali">
            <Chips options={ENGRAVE_DETAIL} value={eDetailId} onChange={setEDetailId} lang={lang} />
          </CalcCard>
          <CalcCard stepNum="⑤" label="Nakład">
            <Chips options={QUANTITY_TIERS} value={eQtyId} onChange={setEQtyId} lang={lang} />
          </CalcCard>
        </>
      ) : (
        <>
          <CalcCard stepNum="②" label="Materiał i grubość">
            <Chips options={CUT_MATERIALS} value={cMatId} onChange={setCMatId} lang={lang} />
          </CalcCard>
          <CalcCard stepNum="③" label="Długość ścieżki cięcia">
            <Chips options={CUT_PATHS} value={cPathId} onChange={setCPathId} lang={lang} />
          </CalcCard>
          <CalcCard stepNum="④" label="Złożoność">
            <Chips options={CUT_COMPLEXITY} value={cComplexId} onChange={setCComplexId} lang={lang} />
          </CalcCard>
          <CalcCard stepNum="⑤" label="Nakład">
            <Chips options={QUANTITY_TIERS} value={cQtyId} onChange={setCQtyId} lang={lang} />
          </CalcCard>
        </>
      )}

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">Szacowany zakres cenowy</div>
        <ResultDisplay result={result} lang={lang} />
      </div>
    </div>
  );
}
