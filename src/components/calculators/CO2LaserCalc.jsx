// ============================================================
// CO2 LASER ESTIMATOR — xTool P2 55W
// Work area: 600 × 288 mm (standard), extended with riser
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";

const CO2_CONFIG = {
  POWER_KW: 0.80,
  DEPRECIATION_PLN_H: 3.20,
  EXTENDED_AREA_TIME_MUL: 1.40,
  EXTENDED_AREA_COST_ADD: 15,
};

// Path sizes XS/S/M fit in standard area; L requires extended
const PATH_NEEDS_EXTENDED = { XS: false, S: false, M: false, L: true, XL: true };

const LBL = {
  pl: { mode: "Tryb pracy", engrave: "Grawerowanie", cut: "Cięcie",
    engraveDesc: "Raster — znakowanie powierzchni", cutDesc: "Wektor — wycinanie kształtów",
    material: "Materiał", matThick: "Materiał i grubość", area: "Powierzchnia grawerowania",
    detail: "Poziom detali", pathLen: "Długość ścieżki cięcia", complexity: "Złożoność",
    qty: "Nakład", workArea: "Obszar roboczy",
    stdArea: "Standardowy (600×288 mm)", extArea: "Rozszerzony (riser/passthrough)",
    stdAreaDesc: "Standardowe pole robocze xTool P2", extAreaDesc: "Wymaga podłączenia dodatkowego sprzętu — dłuższy setup i wyższy koszt",
    engraveTime: "Czas grawerowania", timeSetup: "Czas + setup / szt.", prepMat: "Przygotowanie mat.",
    energy: "Energia / szt.", depreciation: "Amortyzacja / szt.", workshop: "Usługi warsztatowe",
    estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie",
    cutTime: "Czas cięcia", materialCost: "Materiał / szt.", extSurcharge: "Narzut rozszerzony obszar" },
  en: { mode: "Work mode", engrave: "Engraving", cut: "Cutting",
    engraveDesc: "Raster — surface marking", cutDesc: "Vector — shape cutting",
    material: "Material", matThick: "Material & thickness", area: "Engraving area",
    detail: "Detail level", pathLen: "Cut path length", complexity: "Complexity",
    qty: "Quantity", workArea: "Work area",
    stdArea: "Standard (600×288 mm)", extArea: "Extended (riser/passthrough)",
    stdAreaDesc: "Standard xTool P2 work area", extAreaDesc: "Requires additional equipment — longer setup and higher cost",
    engraveTime: "Engraving time", timeSetup: "Time + setup / pc", prepMat: "Material prep",
    energy: "Energy / pc", depreciation: "Depreciation / pc", workshop: "Workshop services",
    estCost: "Estimated cost / pc", discount: "Series discount", totalProd: "Total production time",
    cutTime: "Cut time", materialCost: "Material / pc", extSurcharge: "Extended area surcharge" },
  de: { mode: "Arbeitsmodus", engrave: "Gravur", cut: "Schnitt",
    engraveDesc: "Raster — Oberflächenmarkierung", cutDesc: "Vektor — Formenschnitt",
    material: "Material", matThick: "Material & Stärke", area: "Gravurfläche",
    detail: "Detailgrad", pathLen: "Schnittpfadlänge", complexity: "Komplexität",
    qty: "Auflage", workArea: "Arbeitsbereich",
    stdArea: "Standard (600×288 mm)", extArea: "Erweitert (Riser/Passthrough)",
    stdAreaDesc: "Standard xTool P2 Arbeitsbereich", extAreaDesc: "Erfordert Zusatzausrüstung — längeres Setup und höhere Kosten",
    engraveTime: "Gravurzeit", timeSetup: "Zeit + Setup / Stk.", prepMat: "Materialvorbereitung",
    energy: "Energie / Stk.", depreciation: "Abschreibung / Stk.", workshop: "Werkstattleistungen",
    estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit",
    cutTime: "Schnittzeit", materialCost: "Material / Stk.", extSurcharge: "Aufpreis erweiterter Bereich" },
};

const ENGRAVE_MATERIALS = [
  { id: "wood",    label: { pl: "Drewno", en: "Wood", de: "Holz" },               rateMin: 0.07, prepCost: 0.5 },
  { id: "plywood", label: { pl: "Sklejka", en: "Plywood", de: "Sperrholz" },      rateMin: 0.07, prepCost: 0.4 },
  { id: "acrylic", label: { pl: "Akryl", en: "Acrylic", de: "Acryl" },            rateMin: 0.08, prepCost: 0.8 },
  { id: "glass",   label: { pl: "Szkło", en: "Glass", de: "Glas" },               rateMin: 0.20, prepCost: 1.0 },
  { id: "leather", label: { pl: "Skóra", en: "Leather", de: "Leder" },            rateMin: 0.06, prepCost: 1.2 },
  { id: "paper",   label: { pl: "Papier / karton", en: "Paper / cardboard", de: "Papier / Karton" }, rateMin: 0.05, prepCost: 0.2 },
  { id: "fabric",  label: { pl: "Tkanina", en: "Fabric", de: "Stoff" },           rateMin: 0.07, prepCost: 0.6 },
  { id: "rubber",  label: { pl: "Guma / pieczątki", en: "Rubber / stamps", de: "Gummi / Stempel" }, rateMin: 0.10, prepCost: 0.8 },
  { id: "stone",   label: { pl: "Kamień / łupek", en: "Stone / slate", de: "Stein / Schiefer" }, rateMin: 0.25, prepCost: 1.5 },
  { id: "custom",  label: { pl: "Inny materiał", en: "Other material", de: "Anderes Material" }, rateMin: null, prepCost: null, custom: true },
];

const ENGRAVE_AREAS = [
  { id: "XS", label: { pl: "XS — do 25 cm²", en: "XS — up to 25 cm²", de: "XS — bis 25 cm²" }, area: 15 },
  { id: "S",  label: { pl: "S — 25–100 cm²", en: "S — 25–100 cm²", de: "S — 25–100 cm²" }, area: 60 },
  { id: "M",  label: { pl: "M — 100–400 cm²", en: "M — 100–400 cm²", de: "M — 100–400 cm²" }, area: 250 },
  { id: "L",  label: { pl: "L — 400–1000 cm²", en: "L — 400–1000 cm²", de: "L — 400–1000 cm²" }, area: 700 },
  { id: "XL", label: { pl: "XL — powyżej 1000 cm²", en: "XL — over 1000 cm²", de: "XL — über 1000 cm²" }, area: null, custom: true },
];

const ENGRAVE_DETAIL = [
  { id: "simple",   label: { pl: "Prosty (tekst/logo)", en: "Simple (text/logo)", de: "Einfach (Text/Logo)" }, mul: 0.7 },
  { id: "standard", label: { pl: "Średni (grafika)", en: "Standard (graphics)", de: "Standard (Grafik)" }, mul: 1.0 },
  { id: "photo",    label: { pl: "Wysoki (fotograwer)", en: "High (photo engrave)", de: "Hoch (Fotogravur)" }, mul: 2.2 },
  { id: "custom",   label: { pl: "Niestandardowy", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

const CUT_MATERIALS = [
  { id: "ply3",     label: { pl: "Sklejka 3mm", en: "Plywood 3mm", de: "Sperrholz 3mm" }, cutRate: 0.15, matCost: 0.04 },
  { id: "ply5",     label: { pl: "Sklejka 5mm", en: "Plywood 5mm", de: "Sperrholz 5mm" }, cutRate: 0.25, matCost: 0.06 },
  { id: "ply8",     label: { pl: "Sklejka 8mm", en: "Plywood 8mm", de: "Sperrholz 8mm" }, cutRate: 0.50, matCost: 0.09 },
  { id: "acr3",     label: { pl: "Akryl 3mm", en: "Acrylic 3mm", de: "Acryl 3mm" }, cutRate: 0.20, matCost: 0.12 },
  { id: "acr5",     label: { pl: "Akryl 5mm", en: "Acrylic 5mm", de: "Acryl 5mm" }, cutRate: 0.35, matCost: 0.18 },
  { id: "acr8",     label: { pl: "Akryl 8mm", en: "Acrylic 8mm", de: "Acryl 8mm" }, cutRate: 0.60, matCost: 0.28 },
  { id: "leather2", label: { pl: "Skóra 1–2mm", en: "Leather 1–2mm", de: "Leder 1–2mm" }, cutRate: 0.10, matCost: 0.20 },
  { id: "leather4", label: { pl: "Skóra 3–4mm", en: "Leather 3–4mm", de: "Leder 3–4mm" }, cutRate: 0.20, matCost: 0.35 },
  { id: "paper",    label: { pl: "Papier / karton", en: "Paper / cardboard", de: "Papier / Karton" }, cutRate: 0.05, matCost: 0.01 },
  { id: "fabric",   label: { pl: "Tkanina / filc", en: "Fabric / felt", de: "Stoff / Filz" }, cutRate: 0.08, matCost: 0.06 },
  { id: "rubber",   label: { pl: "Guma 2–3mm", en: "Rubber 2–3mm", de: "Gummi 2–3mm" }, cutRate: 0.18, matCost: 0.10 },
  { id: "custom",   label: { pl: "Inny materiał", en: "Other material", de: "Anderes Material" }, cutRate: null, matCost: null, custom: true },
];

const CUT_PATHS = [
  { id: "XS", label: { pl: "XS — do 50 cm", en: "XS — up to 50 cm", de: "XS — bis 50 cm" }, pathCm: 30, sheetCm2: 50 },
  { id: "S",  label: { pl: "S — 50–200 cm", en: "S — 50–200 cm", de: "S — 50–200 cm" }, pathCm: 120, sheetCm2: 200 },
  { id: "M",  label: { pl: "M — 200–500 cm", en: "M — 200–500 cm", de: "M — 200–500 cm" }, pathCm: 350, sheetCm2: 600 },
  { id: "L",  label: { pl: "L — 500–1500 cm", en: "L — 500–1500 cm", de: "L — 500–1500 cm" }, pathCm: 1000, sheetCm2: 1500 },
  { id: "XL", label: { pl: "XL — powyżej 1500 cm", en: "XL — over 1500 cm", de: "XL — über 1500 cm" }, pathCm: null, sheetCm2: null, custom: true },
];

const CUT_COMPLEXITY = [
  { id: "simple",   label: { pl: "Proste kształty", en: "Simple shapes", de: "Einfache Formen" }, mul: 0.8 },
  { id: "moderate", label: { pl: "Średnie (krzywe)", en: "Moderate (curves)", de: "Mittel (Kurven)" }, mul: 1.0 },
  { id: "complex",  label: { pl: "Złożone (fine detail)", en: "Complex (fine detail)", de: "Komplex (Feindetail)" }, mul: 1.5 },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

function calcEngrave({ matId, areaId, detailId, quantityId }, lang) {
  const mat = ENGRAVE_MATERIALS.find(m => m.id === matId);
  const area = ENGRAVE_AREAS.find(a => a.id === areaId);
  const detail = ENGRAVE_DETAIL.find(d => d.id === detailId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !area || !detail || !qTier) return null;
  if (!mat.rateMin || !area.area || !detail.mul || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  const timeMin = area.area * mat.rateMin * detail.mul;
  const timeH = timeMin / 60;
  const setupH = 0.25 / qTier.qty;
  const handleH = 0.03;
  const totalTimeH = timeH + setupH + handleH;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const prepCost = area.area * mat.prepCost * 0.01;
  const baseCost = energyCost + deprCost + prepCost;
  const batchTimeH = (timeH + handleH) * qTier.qty + 0.25;

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.engraveTime, value: `${timeMin.toFixed(1)} min` },
      { label: l.timeSetup, value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: l.prepMat, value: fmtCost(prepCost, lang) },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      { label: l.workshop, value: fmtCost(baseCost * CONFIG.BASE_MARGIN, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + CONFIG.BASE_MARGIN), lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

function calcCut({ matId, pathId, complexId, quantityId, extended }, lang) {
  const mat = CUT_MATERIALS.find(m => m.id === matId);
  const path = CUT_PATHS.find(p => p.id === pathId);
  const cmplx = CUT_COMPLEXITY.find(c => c.id === complexId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !path || !cmplx || !qTier) return null;
  if (!mat.cutRate || !path.pathCm || !cmplx.mul || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  let cutTimeSec = path.pathCm * mat.cutRate * cmplx.mul;
  let extCostAdd = 0;
  if (extended) {
    cutTimeSec *= CO2_CONFIG.EXTENDED_AREA_TIME_MUL;
    extCostAdd = CO2_CONFIG.EXTENDED_AREA_COST_ADD;
  }
  const cutTimeMin = cutTimeSec / 60;
  const cutTimeH = cutTimeMin / 60;
  const setupH = (extended ? 0.5 : 0.2) / qTier.qty;
  const handleH = 0.03;
  const totalTimeH = cutTimeH + setupH + handleH;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const materialCost = path.sheetCm2 * mat.matCost * 1.15;
  const baseCost = materialCost + energyCost + deprCost + extCostAdd;
  const batchTimeH = (cutTimeH + handleH) * qTier.qty + (extended ? 0.5 : 0.2);

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.cutTime, value: `${cutTimeMin.toFixed(1)} min` },
      { label: l.materialCost, value: fmtCost(materialCost, lang) },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      ...(extended ? [{ label: l.extSurcharge, value: `+${fmtCost(extCostAdd, lang)}` }] : []),
      { divider: true },
      { label: l.baseCost, value: fmtCost(baseCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

const TECH_LABEL = { pl: "Laser CO2", en: "CO2 Laser", de: "CO2-Laser" };

export default function CO2LaserCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const [mode, setMode] = useState("engrave");
  const [eMatId, setEMatId] = useState("wood");
  const [eAreaId, setEAreaId] = useState("S");
  const [eDetailId, setEDetailId] = useState("standard");
  const [eQtyId, setEQtyId] = useState("proto");
  const [cMatId, setCMatId] = useState("ply3");
  const [cPathId, setCPathId] = useState("S");
  const [cComplexId, setCComplexId] = useState("moderate");
  const [cQtyId, setCQtyId] = useState("proto");
  const [extended, setExtended] = useState(false);

  // Auto-set work area based on path size
  useEffect(() => {
    const needsExtended = PATH_NEEDS_EXTENDED[cPathId];
    if (needsExtended !== undefined) setExtended(needsExtended);
  }, [cPathId]);

  const result = useMemo(() => {
    if (mode === "engrave") return calcEngrave({ matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId }, lang);
    return calcCut({ matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId, extended }, lang);
  }, [mode, eMatId, eAreaId, eDetailId, eQtyId, cMatId, cPathId, cComplexId, cQtyId, extended, lang]);

  // Determine which work area options are available based on path
  const pathNeedsExtended = PATH_NEEDS_EXTENDED[cPathId];
  const stdDisabled = pathNeedsExtended === true;
  const extDisabled = pathNeedsExtended === false;

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">xTool P2 · 55W CO2 · 600×288 mm</div>

      <CalcCard stepNum="①" label={l.mode}>
        <div className="grid grid-cols-2 gap-3">
          {[{ id: "engrave", lbl: l.engrave, desc: l.engraveDesc }, { id: "cut", lbl: l.cut, desc: l.cutDesc }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${mode === m.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className={`text-sm font-bold mb-1 ${mode === m.id ? "text-blue-300" : "text-white"}`}>{m.lbl}</div>
              <div className="text-[11px] text-neutral-500">{m.desc}</div>
            </button>
          ))}
        </div>
      </CalcCard>

      {mode === "engrave" ? (
        <>
          <CalcCard stepNum="②" label={l.material}><Chips options={ENGRAVE_MATERIALS} value={eMatId} onChange={setEMatId} lang={lang} /></CalcCard>
          <CalcCard stepNum="③" label={l.area}><Chips options={ENGRAVE_AREAS} value={eAreaId} onChange={setEAreaId} lang={lang} /></CalcCard>
          <CalcCard stepNum="④" label={l.detail}><Chips options={ENGRAVE_DETAIL} value={eDetailId} onChange={setEDetailId} lang={lang} /></CalcCard>
          <CalcCard stepNum="⑤" label={l.qty}><Chips options={QUANTITY_TIERS} value={eQtyId} onChange={setEQtyId} lang={lang} /></CalcCard>
        </>
      ) : (
        <>
          <CalcCard stepNum="②" label={l.matThick}><Chips options={CUT_MATERIALS} value={cMatId} onChange={setCMatId} lang={lang} /></CalcCard>
          <CalcCard stepNum="③" label={l.pathLen}><Chips options={CUT_PATHS} value={cPathId} onChange={setCPathId} lang={lang} /></CalcCard>
          <CalcCard stepNum="④" label={l.complexity}><Chips options={CUT_COMPLEXITY} value={cComplexId} onChange={setCComplexId} lang={lang} /></CalcCard>
          <CalcCard stepNum="⑤" label={l.workArea}>
            <div className="grid grid-cols-2 gap-3">
              {[{ ext: false, lbl: l.stdArea, desc: l.stdAreaDesc, dis: stdDisabled }, { ext: true, lbl: l.extArea, desc: l.extAreaDesc, dis: extDisabled }].map(a => (
                <button key={String(a.ext)} onClick={() => !a.dis && setExtended(a.ext)}
                  disabled={a.dis}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    a.dis ? "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed" :
                    extended === a.ext ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}>
                  <div className={`text-sm font-bold mb-1 ${a.dis ? "text-neutral-600" : extended === a.ext ? "text-blue-300" : "text-white"}`}>{a.lbl}</div>
                  <div className="text-[11px] text-neutral-500">{a.desc}</div>
                </button>
              ))}
            </div>
          </CalcCard>
          <CalcCard stepNum="⑥" label={l.qty}><Chips options={QUANTITY_TIERS} value={cQtyId} onChange={setCQtyId} lang={lang} /></CalcCard>
        </>
      )}

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
      </div>

      <InquiryForm lang={lang} techLabel={`${t(TECH_LABEL, lang)} — ${mode === "engrave" ? l.engrave : l.cut}`} paramsSummary={
        mode === "engrave"
          ? [t(ENGRAVE_MATERIALS.find(m => m.id === eMatId)?.label, lang), t(ENGRAVE_AREAS.find(a => a.id === eAreaId)?.label, lang), t(ENGRAVE_DETAIL.find(d => d.id === eDetailId)?.label, lang), t(QUANTITY_TIERS.find(q => q.id === eQtyId)?.label, lang)].join(" | ")
          : [t(CUT_MATERIALS.find(m => m.id === cMatId)?.label, lang), t(CUT_PATHS.find(p => p.id === cPathId)?.label, lang), t(CUT_COMPLEXITY.find(c => c.id === cComplexId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === cQtyId)?.label, lang)].join(" | ")
      } />
    </div>
  );
}
