// ============================================================
// FIBER LASER ESTIMATOR — Raycus 30W Galvo
// ============================================================
// Lenses: 70mm (field ~50×50mm) | 150mm (field ~110×110mm)
// Power consumption: ~0.50 kW
// Depreciation: ~14,000 PLN / 5000h = 2.80 PLN/h
// ============================================================
import { useState, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, Chips, CalcCard, ResultDisplay } from "./calcShared.jsx";

const FIBER_CONFIG = {
  POWER_KW: 0.50,
  DEPRECIATION_PLN_H: 2.80,
  PRECIOUS_PREMIUM: 0.20, // +20% surcharge for precious metals (risk/handling)
};

const MATERIALS = [
  { id: "stainless",  label: "Stal nierdzewna",    rateMin: 0.10, precious: false },
  { id: "aluminum",   label: "Aluminium",           rateMin: 0.08, precious: false },
  { id: "brass",      label: "Mosiądz",             rateMin: 0.12, precious: false },
  { id: "copper",     label: "Miedź",               rateMin: 0.15, precious: false },
  { id: "titanium",   label: "Tytan",               rateMin: 0.18, precious: false },
  { id: "silver",     label: "Srebro",              rateMin: 0.14, precious: true },
  { id: "gold",       label: "Złoto",               rateMin: 0.16, precious: true },
  { id: "anodized",   label: "Aluminium anodowane",  rateMin: 0.06, precious: false },
  { id: "hardplast",  label: "Tworzywo twarde",     rateMin: 0.05, precious: false },
  { id: "custom",     label: "Inny materiał",       rateMin: null, precious: false, custom: true },
];

const LENSES = [
  { id: "70mm",  label: "70mm — precyzyjne detale", fieldMm: 50,  speedMul: 1.0, desc: "Pole ~50×50mm, ultra fine" },
  { id: "150mm", label: "150mm — większe pole",     fieldMm: 110, speedMul: 0.85, desc: "Pole ~110×110mm, standard" },
];

const MARK_TYPES = [
  { id: "surface",  label: "Znakowanie powierzchniowe", depthMul: 1.0, desc: "Oxide / annealing mark" },
  { id: "medium",   label: "Średnia głębokość",         depthMul: 2.5, desc: "~0.1–0.3mm" },
  { id: "deep",     label: "Głębokie grawerowanie",     depthMul: 6.0, desc: "~0.3–1.0mm, wieloprzejściowe" },
  { id: "color",    label: "Znakowanie kolorowe",       depthMul: 1.8, desc: "Tylko stal nierdzewna" },
  { id: "custom",   label: "Niestandardowe",            depthMul: null, custom: true },
];

const AREAS = [
  { id: "XS", label: "XS — do 5 cm²",       area: 3 },
  { id: "S",  label: "S — 5–25 cm²",         area: 15 },
  { id: "M",  label: "M — 25–60 cm²",        area: 40 },
  { id: "L",  label: "L — powyżej 60 cm²",   area: 80 },
  { id: "XL", label: "XL — wielokrotne pola", area: null, custom: true },
];

function calculate({ matId, lensId, markId, areaId, quantityId }) {
  const mat = MATERIALS.find(m => m.id === matId);
  const lens = LENSES.find(l => l.id === lensId);
  const mark = MARK_TYPES.find(m => m.id === markId);
  const area = AREAS.find(a => a.id === areaId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !lens || !mark || !area || !qTier) return null;
  if (!mat.rateMin || !mark.depthMul || !area.area || !qTier.qty) return { type: "custom" };

  // Time per piece (minutes)
  const timeMin = area.area * mat.rateMin * mark.depthMul * lens.speedMul;
  const timeH = timeMin / 60;
  const setupH = 0.2 / qTier.qty; // Focus/align setup
  const totalTimeH = timeH + setupH;

  const energyCost = totalTimeH * FIBER_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * FIBER_CONFIG.DEPRECIATION_PLN_H;
  let baseCost = energyCost + deprCost;

  // Precious metal surcharge
  if (mat.precious) baseCost *= (1 + FIBER_CONFIG.PRECIOUS_PREMIUM);

  // Minimum cost floor (short jobs still have handling time)
  baseCost = Math.max(baseCost, 8.0);

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      { label: "Czas grawerowania", value: `${timeMin.toFixed(1)} min` },
      { label: "Czas + setup / szt.", value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: "Energia / szt.", value: `${energyCost.toFixed(2)} PLN` },
      { label: "Amortyzacja / szt.", value: `${deprCost.toFixed(2)} PLN` },
      ...(mat.precious ? [{ label: "Narzut metal szlachetny", value: `+${FIBER_CONFIG.PRECIOUS_PREMIUM * 100}%` }] : []),
      { divider: true },
      { label: "Koszt bazowy / szt.", value: `${baseCost.toFixed(2)} PLN`, bold: true },
      { label: "Marża", value: `${Math.round(CONFIG.BASE_MARGIN * 100)}%` },
      ...(qTier.discount > 0 ? [{ label: "Rabat seryjny", value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

export default function FiberLaserCalc({ lang = "pl" }) {
  const [matId, setMatId] = useState("stainless");
  const [lensId, setLensId] = useState("150mm");
  const [markId, setMarkId] = useState("surface");
  const [areaId, setAreaId] = useState("S");
  const [quantityId, setQuantityId] = useState("proto");

  const result = useMemo(() => calculate({ matId, lensId, markId, areaId, quantityId }),
    [matId, lensId, markId, areaId, quantityId]);

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">Raycus 30W Galvo · soczewki 70mm / 150mm</div>

      <CalcCard stepNum="①" label="Materiał">
        <Chips options={MATERIALS} value={matId} onChange={setMatId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="②" label="Soczewka / pole robocze">
        <div className="grid grid-cols-2 gap-3">
          {LENSES.map(l => (
            <button key={l.id} onClick={() => setLensId(l.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${lensId === l.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className={`text-sm font-bold mb-1 ${lensId === l.id ? "text-blue-300" : "text-white"}`}>{l.label}</div>
              <div className="text-[11px] text-neutral-500">{l.desc}</div>
            </button>
          ))}
        </div>
      </CalcCard>

      <CalcCard stepNum="③" label="Typ znakowania">
        <Chips options={MARK_TYPES} value={markId} onChange={setMarkId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="④" label="Powierzchnia grawerowania">
        <Chips options={AREAS} value={areaId} onChange={setAreaId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑤" label="Nakład">
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">Szacowany zakres cenowy</div>
        <ResultDisplay result={result} lang={lang} />
      </div>
    </div>
  );
}
