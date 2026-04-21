// ============================================================
// CO2 LASER ESTIMATOR — xTool P2 55W  v1.1
// Work area: 600 × 288 mm (standard), extended with riser
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards } from "./calcShared.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";

const CO2_CONFIG = {
  POWER_KW: 0.80,
  DEPRECIATION_PLN_H: 3.20,
  LABOR_PLN_MIN: 1.00,
  HANDLING_FEE: 5.0,
  EXTENDED_AREA_TIME_MUL: 1.40,
  EXTENDED_AREA_COST_ADD: 15,
};

const WORK_AREA_MM = { x: 600, y: 288 };
// Extended area: xTool P2 with passthrough enables long materials
const EXTENDED_AREA_MM = { x: 600, y: 3000 };

const PATH_NEEDS_EXTENDED = { XS: false, S: false, M: false, L: true, XL: true };
const AREA_NEEDS_EXTENDED = { XS: false, S: false, M: false, L: true, XL: true };

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

export const ENGRAVE_MATERIALS = [
  { id: "wood",    label: { pl: "Drewno", en: "Wood", de: "Holz" },               rateMin: 0.07, prepCost: 0.5, img: "/img/calc/co2_materials/wood.png" },
  { id: "plywood", label: { pl: "Sklejka", en: "Plywood", de: "Sperrholz" },      rateMin: 0.07, prepCost: 0.4, img: "/img/calc/co2_materials/plywood.png" },
  { id: "acrylic", label: { pl: "Akryl", en: "Acrylic", de: "Acryl" },            rateMin: 0.08, prepCost: 0.8, img: "/img/calc/co2_materials/acrylic.png" },
  { id: "glass",   label: { pl: "Szkło", en: "Glass", de: "Glas" },               rateMin: 0.20, prepCost: 1.0, img: "/img/calc/co2_materials/glass.png" },
  { id: "leather", label: { pl: "Skóra", en: "Leather", de: "Leder" },            rateMin: 0.06, prepCost: 1.2, img: "/img/calc/co2_materials/leather.png" },
  { id: "paper",   label: { pl: "Papier / karton", en: "Paper / cardboard", de: "Papier / Karton" }, rateMin: 0.05, prepCost: 0.2, img: "/img/calc/co2_materials/paper.png" },
  { id: "fabric",  label: { pl: "Tkanina", en: "Fabric", de: "Stoff" },           rateMin: 0.07, prepCost: 0.6, img: "/img/calc/co2_materials/fabric.png" },
  { id: "rubber",  label: { pl: "Guma / pieczątki", en: "Rubber / stamps", de: "Gummi / Stempel" }, rateMin: 0.10, prepCost: 0.8, img: "/img/calc/co2_materials/rubber.png" },
  { id: "stone",   label: { pl: "Kamień / łupek", en: "Stone / slate", de: "Stein / Schiefer" }, rateMin: 0.25, prepCost: 1.5, img: "/img/calc/co2_materials/stone.png" },
  { id: "custom",  label: { pl: "Inny materiał", en: "Other material", de: "Anderes Material" }, rateMin: null, prepCost: null, custom: true },
];

export const ENGRAVE_AREAS = [
  { id: "XS", label: { pl: "XS — do 25 cm²", en: "XS — up to 25 cm²", de: "XS — bis 25 cm²" }, area: 15 },
  { id: "S",  label: { pl: "S — 25–100 cm²", en: "S — 25–100 cm²", de: "S — 25–100 cm²" }, area: 60 },
  { id: "M",  label: { pl: "M — 100–400 cm²", en: "M — 100–400 cm²", de: "M — 100–400 cm²" }, area: 250 },
  { id: "L",  label: { pl: "L — 400–1000 cm²", en: "L — 400–1000 cm²", de: "L — 400–1000 cm²" }, area: 700 },
  { id: "XL", label: { pl: "XL — powyżej 1000 cm²", en: "XL — over 1000 cm²", de: "XL — über 1000 cm²" }, area: null, custom: true },
];

export const ENGRAVE_DETAIL = [
  { id: "simple",   label: { pl: "Prosty (tekst/logo)", en: "Simple (text/logo)", de: "Einfach (Text/Logo)" },     mul: 0.7, img: "/img/calc/co2_detail/simple.png",
    desc: { pl: "Tekst, logo, proste linie", en: "Text, logo, simple lines", de: "Text, Logo, einfache Linien" } },
  { id: "standard", label: { pl: "Średni (grafika)", en: "Standard (graphics)", de: "Standard (Grafik)" },         mul: 1.0, img: "/img/calc/co2_detail/standard.png",
    desc: { pl: "Ilustracja, ornament, line-art", en: "Illustration, ornament, line-art", de: "Illustration, Ornament, Strichzeichnung" } },
  { id: "photo",    label: { pl: "Wysoki (fotograwer)", en: "High (photo engrave)", de: "Hoch (Fotogravur)" },     mul: 2.2, img: "/img/calc/co2_detail/photo.png",
    desc: { pl: "Foto, raster, gradacja tonalna", en: "Photo, raster, tonal gradation", de: "Foto, Raster, Tonabstufung" } },
  { id: "custom",   label: { pl: "Niestandardowy", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

export const CUT_MATERIALS = [
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

export const CUT_PATHS = [
  { id: "XS", label: { pl: "XS — do 50 cm", en: "XS — up to 50 cm", de: "XS — bis 50 cm" }, pathCm: 30, sheetCm2: 50 },
  { id: "S",  label: { pl: "S — 50–200 cm", en: "S — 50–200 cm", de: "S — 50–200 cm" }, pathCm: 120, sheetCm2: 200 },
  { id: "M",  label: { pl: "M — 200–500 cm", en: "M — 200–500 cm", de: "M — 200–500 cm" }, pathCm: 350, sheetCm2: 600 },
  { id: "L",  label: { pl: "L — 500–1500 cm", en: "L — 500–1500 cm", de: "L — 500–1500 cm" }, pathCm: 1000, sheetCm2: 1500 },
  { id: "XL", label: { pl: "XL — powyżej 1500 cm", en: "XL — over 1500 cm", de: "XL — über 1500 cm" }, pathCm: null, sheetCm2: null, custom: true },
];

export const CUT_COMPLEXITY = [
  { id: "simple",   label: { pl: "Proste kształty", en: "Simple shapes", de: "Einfache Formen" }, mul: 0.8 },
  { id: "moderate", label: { pl: "Średnie (krzywe)", en: "Moderate (curves)", de: "Mittel (Kurven)" }, mul: 1.0 },
  { id: "complex",  label: { pl: "Złożone (fine detail)", en: "Complex (fine detail)", de: "Komplex (Feindetail)" }, mul: 1.5 },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

export function calcEngrave({ matId, areaId, detailId, quantityId, extended, svgData }, lang) {
  const mat = ENGRAVE_MATERIALS.find(m => m.id === matId);
  const area = svgData
    ? { area: svgData.engravAreaCm2 }
    : ENGRAVE_AREAS.find(a => a.id === areaId);
  const detail = ENGRAVE_DETAIL.find(d => d.id === detailId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !area || !detail || !qTier) return null;
  if (!mat.rateMin || !area.area || !detail.mul || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  let timeMin = area.area * mat.rateMin * detail.mul;
  let extCostAdd = 0;
  if (extended) {
    timeMin *= CO2_CONFIG.EXTENDED_AREA_TIME_MUL;
    extCostAdd = CO2_CONFIG.EXTENDED_AREA_COST_ADD;
  }
  const timeH = timeMin / 60;
  const setupH = (extended ? 0.5 : 0.25) / qTier.qty;
  const handleH = 0.03;
  const totalTimeH = timeH + setupH + handleH;
  const laborCost = timeMin * CO2_CONFIG.LABOR_PLN_MIN;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const prepCost = area.area * mat.prepCost * 0.01;
  const baseCost = laborCost + energyCost + deprCost + prepCost + CO2_CONFIG.HANDLING_FEE + extCostAdd;
  const batchTimeH = (timeH + handleH) * qTier.qty + (extended ? 0.5 : 0.25);

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.engraveTime, value: `${timeMin.toFixed(1)} min` },
      { label: l.timeSetup, value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: l.workshop, value: fmtCost(laborCost, lang) },
      { label: l.prepMat, value: fmtCost(prepCost, lang) },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      ...(extended ? [{ label: l.extSurcharge, value: `+${fmtCost(extCostAdd, lang)}` }] : []),
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + CONFIG.BASE_MARGIN), lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

export function calcCut({ matId, pathId, complexId, quantityId, extended, svgData }, lang) {
  const mat = CUT_MATERIALS.find(m => m.id === matId);
  const path = svgData
    ? { pathCm: svgData.pathLengthCm, sheetCm2: svgData.engravAreaCm2 }
    : CUT_PATHS.find(p => p.id === pathId);
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
  const laborCost = cutTimeMin * CO2_CONFIG.LABOR_PLN_MIN;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const materialCost = path.sheetCm2 * mat.matCost * 1.15;
  const baseCost = laborCost + materialCost + energyCost + deprCost + CO2_CONFIG.HANDLING_FEE + extCostAdd;
  const batchTimeH = (cutTimeH + handleH) * qTier.qty + (extended ? 0.5 : 0.2);

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.cutTime, value: `${cutTimeMin.toFixed(1)} min` },
      { label: l.workshop, value: fmtCost(laborCost, lang) },
      { label: l.materialCost, value: fmtCost(materialCost, lang) },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      ...(extended ? [{ label: l.extSurcharge, value: `+${fmtCost(extCostAdd, lang)}` }] : []),
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + CONFIG.BASE_MARGIN), lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

const TECH_LABEL = { pl: "Laser CO2", en: "CO2 Laser", de: "CO2-Laser" };

export default function CO2LaserCalc({ lang = "pl", initialMode = "engrave" }) {
  const l = LBL[lang] || LBL.en;
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  const [mode, setMode] = useState(initialMode);
  const [eMatId, setEMatId] = useState("wood");
  const [eAreaId, setEAreaId] = useState("S");
  const [eDetailId, setEDetailId] = useState("standard");
  const [eQtyId, setEQtyId] = useState("proto");
  const [cMatId, setCMatId] = useState("ply3");
  const [cPathId, setCPathId] = useState("S");
  const [cComplexId, setCComplexId] = useState("moderate");
  const [cQtyId, setCQtyId] = useState("proto");
  const [extended, setExtended] = useState(false);
  const [svgData, setSvgData] = useState(null);
  const [svgFileName, setSvgFileName] = useState("");
  const [svgScale, setSvgScale] = useState(1);

  const scaledSvgData = useMemo(() => {
    if (!svgData || svgScale === 1) return svgData;
    const s = svgScale;
    return { ...svgData, bboxMm: { x: svgData.bboxMm.x * s, y: svgData.bboxMm.y * s }, pathLengthCm: svgData.pathLengthCm * s, engravAreaCm2: svgData.engravAreaCm2 * s * s };
  }, [svgData, svgScale]);

  const svgNeedsExtended = scaledSvgData
    ? (scaledSvgData.bboxMm.x > WORK_AREA_MM.x + 0.5 || scaledSvgData.bboxMm.y > WORK_AREA_MM.y + 0.5)
    : false;

  useEffect(() => {
    if (scaledSvgData) {
      setExtended(svgNeedsExtended);
      return;
    }
    const needsExtended = mode === "engrave" ? AREA_NEEDS_EXTENDED[eAreaId] : PATH_NEEDS_EXTENDED[cPathId];
    if (needsExtended !== undefined) setExtended(needsExtended);
  }, [cPathId, eAreaId, scaledSvgData, svgNeedsExtended, mode]);

  async function handleSVGUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { parseSVG } = await import("../../utils/svgParser.js");
      const data = parseSVG(text);
      setSvgData(data);
      setSvgFileName(file.name);
    } catch {}
  }

  function handleSVGRemove() {
    setSvgData(null);
    setSvgFileName("");
    setSvgScale(1);
  }

  const result = useMemo(() => {
    if (mode === "engrave") return calcEngrave({ matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId, extended, svgData: scaledSvgData }, lang);
    return calcCut({ matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId, extended, svgData: scaledSvgData }, lang);
  }, [mode, eMatId, eAreaId, eDetailId, eQtyId, cMatId, cPathId, cComplexId, cQtyId, extended, scaledSvgData, lang]);

  const presetNeedsExtended = mode === "engrave" ? AREA_NEEDS_EXTENDED[eAreaId] : PATH_NEEDS_EXTENDED[cPathId];
  const needsExtended = scaledSvgData ? svgNeedsExtended : presetNeedsExtended;
  const stdDisabled = needsExtended === true;
  const extDisabled = scaledSvgData ? !svgNeedsExtended : needsExtended === false;

  const svgSummary = svgData
    ? (mode === "engrave"
      ? `SVG: ${svgFileName} (${(svgData.engravAreaCm2 * svgScale * svgScale).toFixed(1)} cm²${svgScale !== 1 ? ` ${Math.round(svgScale*100)}%` : ""})`
      : `SVG: ${svgFileName} (${(svgData.pathLengthCm * svgScale).toFixed(0)} cm${svgScale !== 1 ? ` ${Math.round(svgScale*100)}%` : ""})`)
    : null;

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">xTool P2 · 55W CO2 · 600×288 mm</div>

      <CalcCard stepNum="①" label={l.mode}>
        <HeroCards value={mode} onChange={setMode} lang={lang} options={[
          { id: "engrave", label: l.engrave, desc: l.engraveDesc, img: "/img/calc/co2_modes/engrave.png" },
          { id: "cut",     label: l.cut,     desc: l.cutDesc,     img: "/img/calc/co2_modes/cut.png" },
        ]} />
      </CalcCard>

      {mode === "engrave" ? (
        <>
          <CalcCard stepNum="②" label={l.material}><MaterialCards options={ENGRAVE_MATERIALS} value={eMatId} onChange={setEMatId} lang={lang} /></CalcCard>
          <CalcCard stepNum="③" label={svgData ? sl.fromSvg : l.area} id="file-upload">
            <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={WORK_AREA_MM} extendedAreaMm={EXTENDED_AREA_MM} showPathLength={false} lang={lang} />
            {!svgData && <Chips options={ENGRAVE_AREAS} value={eAreaId} onChange={setEAreaId} lang={lang} />}
          </CalcCard>
          <CalcCard stepNum="④" label={l.detail}>
            <HeroCards options={ENGRAVE_DETAIL} value={eDetailId} onChange={setEDetailId} lang={lang} cols="grid-cols-2 sm:grid-cols-4" minH={140} />
          </CalcCard>
        </>
      ) : (
        <>
          <CalcCard stepNum="②" label={l.matThick}><Chips options={CUT_MATERIALS} value={cMatId} onChange={setCMatId} lang={lang} /></CalcCard>
          <CalcCard stepNum="③" label={svgData ? sl.fromSvg : l.pathLen} id="file-upload">
            <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={WORK_AREA_MM} extendedAreaMm={EXTENDED_AREA_MM} showPathLength={true} lang={lang} />
            {!svgData && <Chips options={CUT_PATHS} value={cPathId} onChange={setCPathId} lang={lang} />}
          </CalcCard>
          <CalcCard stepNum="④" label={l.complexity}><Chips options={CUT_COMPLEXITY} value={cComplexId} onChange={setCComplexId} lang={lang} /></CalcCard>
        </>
      )}

      <CalcCard stepNum="⑤" label={l.workArea}>
        <HeroCards value={extended ? "ext" : "std"} onChange={(id) => setExtended(id === "ext")} lang={lang} options={[
          { id: "std", label: l.stdArea, desc: l.stdAreaDesc, img: "/img/calc/co2_workarea/standard.png", disabled: stdDisabled },
          { id: "ext", label: l.extArea, desc: l.extAreaDesc, img: "/img/calc/co2_workarea/extended.png", disabled: extDisabled },
        ]} />
      </CalcCard>

      <CalcCard stepNum="⑥" label={l.qty}>
        {mode === "engrave"
          ? <Chips options={QUANTITY_TIERS} value={eQtyId} onChange={setEQtyId} lang={lang} />
          : <Chips options={QUANTITY_TIERS} value={cQtyId} onChange={setCQtyId} lang={lang} />}
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
      </div>

      <InquiryForm lang={lang} techLabel={`${t(TECH_LABEL, lang)} — ${mode === "engrave" ? l.engrave : l.cut}`} paramsSummary={
        mode === "engrave"
          ? [t(ENGRAVE_MATERIALS.find(m => m.id === eMatId)?.label, lang), svgSummary || t(ENGRAVE_AREAS.find(a => a.id === eAreaId)?.label, lang), t(ENGRAVE_DETAIL.find(d => d.id === eDetailId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === eQtyId)?.label, lang)].join(" | ")
          : [t(CUT_MATERIALS.find(m => m.id === cMatId)?.label, lang), svgSummary || t(CUT_PATHS.find(p => p.id === cPathId)?.label, lang), t(CUT_COMPLEXITY.find(c => c.id === cComplexId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === cQtyId)?.label, lang)].join(" | ")
      } />
    </div>
  );
}
