// ============================================================
// FIBER LASER ESTIMATOR — Raycus 30W Galvo
// ============================================================
// Lenses: 70mm (field ~50x50mm = 25cm2) | 150mm (field ~110x110mm = ~121cm2)
// Power consumption: ~0.50 kW
// Depreciation: ~14,000 PLN / 5000h = 2.80 PLN/h
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";

const FIBER_CONFIG = {
  POWER_KW: 0.50,
  DEPRECIATION_PLN_H: 2.80,
  PRECIOUS_PREMIUM: 0.25,   // +25% surcharge for precious metals (risk/handling/reflection)
  LABOR_PLN_MIN: 1.50,      // operator labor per minute of engraving
  MIN_COST_PLN: 3.0,        // minimum base cost floor
};

const LBL = {
  pl: { material: "Material", lens: "Soczewka / pole robocze", markType: "Typ znakowania",
    area: "Powierzchnia grawerowania", qty: "Naklad",
    engraveTime: "Czas grawerowania", timeSetup: "Czas + setup / szt.",
    laborCost: "Praca operatora / szt.",
    energy: "Energia / szt.", depreciation: "Amortyzacja / szt.", baseCost: "Koszt bazowy / szt.",
    discount: "Rabat seryjny", totalProd: "Czas produkcji lacznie",
    preciousSurcharge: "Narzut metal szlachetny",
    lens70desc: "Pole ~50x50mm (25 cm2), ultra fine", lens150desc: "Pole ~110x110mm (~121 cm2), standard" },
  en: { material: "Material", lens: "Lens / work field", markType: "Marking type",
    area: "Engraving area", qty: "Quantity",
    engraveTime: "Engraving time", timeSetup: "Time + setup / pc",
    laborCost: "Operator labor / pc",
    energy: "Energy / pc", depreciation: "Depreciation / pc", baseCost: "Base cost / pc",
    discount: "Series discount", totalProd: "Total production time",
    preciousSurcharge: "Precious metal surcharge",
    lens70desc: "Field ~50x50mm (25 cm2), ultra fine", lens150desc: "Field ~110x110mm (~121 cm2), standard" },
  de: { material: "Material", lens: "Linse / Arbeitsfeld", markType: "Markierungstyp",
    area: "Gravurflaeche", qty: "Auflage",
    engraveTime: "Gravurzeit", timeSetup: "Zeit + Setup / Stk.",
    laborCost: "Bedienerarbeit / Stk.",
    energy: "Energie / Stk.", depreciation: "Abschreibung / Stk.", baseCost: "Basiskosten / Stk.",
    discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit",
    preciousSurcharge: "Aufpreis Edelmetall",
    lens70desc: "Feld ~50x50mm (25 cm2), ultra fein", lens150desc: "Feld ~110x110mm (~121 cm2), Standard" },
};

const MATERIALS = [
  { id: "stainless",  label: { pl: "Stal nierdzewna", en: "Stainless steel", de: "Edelstahl" },   rateMin: 0.10, precious: false },
  { id: "aluminum",   label: { pl: "Aluminium", en: "Aluminum", de: "Aluminium" },                rateMin: 0.08, precious: false },
  { id: "brass",      label: { pl: "Mosiadz", en: "Brass", de: "Messing" },                       rateMin: 0.12, precious: false },
  { id: "copper",     label: { pl: "Miedz", en: "Copper", de: "Kupfer" },                         rateMin: 0.15, precious: false },
  { id: "titanium",   label: { pl: "Tytan", en: "Titanium", de: "Titan" },                        rateMin: 0.18, precious: false },
  { id: "silver",     label: { pl: "Srebro", en: "Silver", de: "Silber" },                        rateMin: 0.14, precious: true },
  { id: "gold",       label: { pl: "Zloto", en: "Gold", de: "Gold" },                             rateMin: 0.16, precious: true },
  { id: "anodized",   label: { pl: "Aluminium anodowane", en: "Anodized aluminum", de: "Eloxiertes Aluminium" }, rateMin: 0.06, precious: false },
  { id: "custom",     label: { pl: "Inny material", en: "Other material", de: "Anderes Material" }, rateMin: null, precious: false, custom: true },
];

const LENSES = [
  { id: "70mm",  label: { pl: "70mm — precyzyjne detale", en: "70mm — precision details", de: "70mm — Praezisionsdetails" }, fieldMm: 50, maxAreaCm2: 25,  speedMul: 1.0 },
  { id: "150mm", label: { pl: "150mm — wieksze pole", en: "150mm — larger field", de: "150mm — groesseres Feld" },           fieldMm: 110, maxAreaCm2: 121, speedMul: 0.85 },
];

const MARK_TYPES = [
  { id: "surface",  label: { pl: "Znakowanie powierzchniowe", en: "Surface marking", de: "Oberflaechenmarkierung" }, depthMul: 1.0 },
  { id: "medium",   label: { pl: "Srednia glebokosc", en: "Medium depth", de: "Mittlere Tiefe" },                    depthMul: 2.5 },
  { id: "deep",     label: { pl: "Glebokie grawerowanie", en: "Deep engraving", de: "Tiefgravur" },                  depthMul: 6.0 },
  { id: "color",    label: { pl: "Znakowanie kolorowe", en: "Color marking", de: "Farbmarkierung" },                 depthMul: 1.8 },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                                depthMul: null, custom: true },
];

const AREAS = [
  { id: "XS", label: { pl: "XS — do 5 cm2", en: "XS — up to 5 cm2", de: "XS — bis 5 cm2" },          area: 3 },
  { id: "S",  label: { pl: "S — 5-25 cm2", en: "S — 5-25 cm2", de: "S — 5-25 cm2" },                  area: 15 },
  { id: "M",  label: { pl: "M — 25-60 cm2", en: "M — 25-60 cm2", de: "M — 25-60 cm2" },               area: 40 },
  { id: "L",  label: { pl: "L — powyzej 60 cm2", en: "L — over 60 cm2", de: "L — ueber 60 cm2" },     area: 80 },
  { id: "XL", label: { pl: "XL — wielokrotne pola", en: "XL — multiple fields", de: "XL — mehrere Felder" }, area: null, custom: true },
];

function calculate({ matId, lensId, markId, areaId, quantityId }, lang) {
  const mat = MATERIALS.find(m => m.id === matId);
  const lens = LENSES.find(l => l.id === lensId);
  const mark = MARK_TYPES.find(m => m.id === markId);
  const area = AREAS.find(a => a.id === areaId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !lens || !mark || !area || !qTier) return null;
  if (!mat.rateMin || !mark.depthMul || !area.area || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  const timeMin = area.area * mat.rateMin * mark.depthMul * lens.speedMul;
  const timeH = timeMin / 60;
  const setupH = 0.2 / qTier.qty;
  const handleH = 0.03;
  const totalTimeH = timeH + setupH + handleH;

  const laborCost = timeMin * FIBER_CONFIG.LABOR_PLN_MIN;
  const energyCost = totalTimeH * FIBER_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * FIBER_CONFIG.DEPRECIATION_PLN_H;
  let baseCost = laborCost + energyCost + deprCost;

  if (mat.precious) baseCost *= (1 + FIBER_CONFIG.PRECIOUS_PREMIUM);
  baseCost = Math.max(baseCost, FIBER_CONFIG.MIN_COST_PLN);

  const batchTimeH = (timeH + handleH) * qTier.qty + 0.2;

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.engraveTime, value: `${timeMin.toFixed(1)} min` },
      { label: l.timeSetup, value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: l.laborCost, value: `${laborCost.toFixed(2)} PLN` },
      { label: l.energy, value: `${energyCost.toFixed(2)} PLN` },
      { label: l.depreciation, value: `${deprCost.toFixed(2)} PLN` },
      ...(mat.precious ? [{ label: l.preciousSurcharge, value: `+${FIBER_CONFIG.PRECIOUS_PREMIUM * 100}%` }] : []),
      { divider: true },
      { label: l.baseCost, value: `${baseCost.toFixed(2)} PLN`, bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

const TECH_LABEL = { pl: "Laser Fiber", en: "Fiber Laser", de: "Faserlaser" };

export default function FiberLaserCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const [matId, setMatId] = useState("stainless");
  const [lensId, setLensId] = useState("150mm");
  const [markId, setMarkId] = useState("surface");
  const [areaId, setAreaId] = useState("S");
  const [quantityId, setQuantityId] = useState("proto");

  const selectedLens = LENSES.find(ln => ln.id === lensId);

  useEffect(() => {
    const area = AREAS.find(a => a.id === areaId);
    if (area && area.area && selectedLens && area.area > selectedLens.maxAreaCm2) {
      const firstValid = AREAS.find(a => a.area && a.area <= selectedLens.maxAreaCm2);
      if (firstValid) setAreaId(firstValid.id);
    }
  }, [lensId]);

  const areaOptions = useMemo(() =>
    AREAS.map(a => ({
      ...a,
      disabled: a.area && selectedLens ? a.area > selectedLens.maxAreaCm2 : false,
      note: a.area && selectedLens && a.area > selectedLens.maxAreaCm2
        ? { pl: `Przekracza pole ${selectedLens.fieldMm}x${selectedLens.fieldMm}mm`, en: `Exceeds ${selectedLens.fieldMm}x${selectedLens.fieldMm}mm field`, de: `Ueberschreitet ${selectedLens.fieldMm}x${selectedLens.fieldMm}mm Feld` }
        : undefined,
    })),
  [lensId]);

  const result = useMemo(() => calculate({ matId, lensId, markId, areaId, quantityId }, lang),
    [matId, lensId, markId, areaId, quantityId, lang]);

  const paramsSummary = [
    t(MATERIALS.find(m => m.id === matId)?.label, lang),
    t(LENSES.find(ln => ln.id === lensId)?.label, lang),
    t(MARK_TYPES.find(m => m.id === markId)?.label, lang),
    t(AREAS.find(a => a.id === areaId)?.label, lang),
    t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
  ].join(" | ");

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">Raycus 30W Galvo · 70mm / 150mm</div>

      <CalcCard stepNum="\u2460" label={l.material}>
        <Chips options={MATERIALS} value={matId} onChange={setMatId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="\u2461" label={l.lens}>
        <div className="grid grid-cols-2 gap-3">
          {LENSES.map(ln => (
            <button key={ln.id} onClick={() => setLensId(ln.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${lensId === ln.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className={`text-sm font-bold mb-1 ${lensId === ln.id ? "text-blue-300" : "text-white"}`}>{t(ln.label, lang)}</div>
              <div className="text-[11px] text-neutral-500">{l[`lens${ln.id.replace("mm","")}desc`]}</div>
            </button>
          ))}
        </div>
      </CalcCard>

      <CalcCard stepNum="\u2462" label={l.markType}>
        <Chips options={MARK_TYPES} value={markId} onChange={setMarkId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="\u2463" label={l.area}>
        <Chips options={areaOptions} value={areaId} onChange={setAreaId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="\u2464" label={l.qty}>
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={paramsSummary} />
    </div>
  );
}
