// ============================================================
// 3D PRINT ESTIMATOR — Bambu Lab H2D  v1.3
// ============================================================
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Upload, X, AlertTriangle } from "lucide-react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

const PRINT_CONFIG = {
  PRINTER_POWER_KW: 0.35,
  DEPRECIATION_PLN_H: 2.50,
  ENGINEERING_PREMIUM: 0.35,
};

// Bambu Lab H2D dual-nozzle build volume
const BUILD_VOL_CM = { x: 30.0, y: 32.0, z: 32.5 };

// Size presets matching manual XS/S/M/L categories (max dimension in cm)
const SIZE_PRESETS = [
  { id: "XS", maxCm: 5.0 },
  { id: "S",  maxCm: 10.0 },
  { id: "M",  maxCm: 20.0 },
  { id: "L",  maxCm: 30.0 },
];

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

const STL_LBL = {
  pl: { upload: "Załaduj plik STL", orManual: "lub wybierz rozmiar ręcznie poniżej", volume: "Objętość", dims: "Wymiary",
    triangles: "Trójkąty", remove: "Usuń", exceeds: "Model przekracza przestrzeń druku", stlSize: "Rozmiar z pliku STL",
    scale: "Skala wydruku", fitToPlate: "Dopasuj do płyty", original: "Oryg." },
  en: { upload: "Upload STL file", orManual: "or select size manually below", volume: "Volume", dims: "Dimensions",
    triangles: "Triangles", remove: "Remove", exceeds: "Model exceeds build volume", stlSize: "Size from STL file",
    scale: "Print scale", fitToPlate: "Fit to plate", original: "Orig." },
  de: { upload: "STL-Datei hochladen", orManual: "oder Größe unten manuell wählen", volume: "Volumen", dims: "Abmessungen",
    triangles: "Dreiecke", remove: "Entfernen", exceeds: "Modell überschreitet Bauraum", stlSize: "Größe aus STL-Datei",
    scale: "Druckmaßstab", fitToPlate: "An Platte anpassen", original: "Orig." },
};

export function calculate(params, lang) {
  const { segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, stlData } = params;
  const size = stlData
    ? { volumeRef: stlData.volumeCm3, timeBase: estimateTimeFromVolume(stlData.volumeCm3), pcsPerPlate: estimatePcsPerPlate(stlData.bbox) }
    : SIZES.find(s => s.id === sizeId);
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
  const handlePerPc = 0.05;
  const timePerPc = printTime + setupPerPc + handlePerPc;
  const energyCost = timePerPc * PRINT_CONFIG.PRINTER_POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = timePerPc * PRINT_CONFIG.DEPRECIATION_PLN_H;
  const baseCost = materialCost + energyCost + deprCost;
  let margin = CONFIG.BASE_MARGIN;
  if (segment === "engineering") margin += PRINT_CONFIG.ENGINEERING_PREMIUM;

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

function STLUploadCard({ stlData, stlFileName, scale, onScaleChange, onUpload, onRemove, lang }) {
  const sl = STL_LBL[lang] || STL_LBL.en;
  const fileRef = useRef(null);

  if (!stlData) {
    return (
      <div className="flex flex-col items-center gap-2 mb-3">
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-blue-400/30 bg-blue-400/[0.03] text-blue-300 text-sm hover:bg-blue-400/10 hover:border-blue-400/50 transition-all w-full justify-center">
          <Upload className="w-4 h-4" />
          {sl.upload}
        </button>
        <input ref={fileRef} type="file" accept=".stl" className="hidden" onChange={onUpload} />
        <div className="text-[10px] text-neutral-600">{sl.orManual}</div>
      </div>
    );
  }

  const b = stlData.bbox;
  const rawMaxCm = Math.max(b.x, b.y, b.z);
  const fitScale = Math.min(BUILD_VOL_CM.x / b.x, BUILD_VOL_CM.y / b.y, BUILD_VOL_CM.z / b.z);
  const fitFloor = Math.floor(fitScale * 10000) / 10000;
  const scaledB = { x: b.x * scale, y: b.y * scale, z: b.z * scale };
  const TOL = 0.05;
  const exceeds = scaledB.x > BUILD_VOL_CM.x + TOL || scaledB.y > BUILD_VOL_CM.y + TOL || scaledB.z > BUILD_VOL_CM.z + TOL;
  const scaledVol = stlData.volumeCm3 * scale * scale * scale;

  return (
    <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-blue-300 truncate max-w-[70%]">{stlFileName}</div>
        <button onClick={onRemove} className="text-neutral-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
          <X className="w-3.5 h-3.5" />{sl.remove}
        </button>
      </div>
      <Suspense fallback={<div className="w-full rounded-lg bg-[#0c1222] border border-white/5 animate-pulse" style={{ height: "220px" }} />}>
        <STLViewer triangles={stlData.triangles} bbox={stlData.bbox} />
      </Suspense>
      <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
        <div><div className="text-neutral-500">{sl.volume}</div><div className="font-bold">{scaledVol.toFixed(1)} cm³</div></div>
        <div><div className="text-neutral-500">{sl.dims}</div><div className="font-bold">{(scaledB.x*10).toFixed(1)}×{(scaledB.y*10).toFixed(1)}×{(scaledB.z*10).toFixed(1)} mm</div></div>
        <div><div className="text-neutral-500">{sl.triangles}</div><div className="font-bold">{stlData.triangleCount.toLocaleString()}</div></div>
      </div>

      {/* Scale controls */}
      <div className="border-t border-white/5 pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-500">{sl.scale}</span>
          <span className="font-bold text-blue-300">{scale === 1 ? "1:1" : `×${scale.toFixed(2)}`}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_PRESETS.map(p => {
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
          {sl.exceeds} (300×320×325 mm)
        </div>
      )}
    </div>
  );
}

const TECH_LABEL = { pl: "Druk 3D", en: "3D Print", de: "3D-Druck" };

export default function Print3DCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const sl = STL_LBL[lang] || STL_LBL.en;
  const [segment, setSegment] = useState("standard");
  const [materialKey, setMaterialKey] = useState("PLA");
  const [sizeId, setSizeId] = useState("S");
  const [infillId, setInfillId] = useState("low");
  const [colorId, setColorId] = useState(1);
  const [precisionId, setPrecisionId] = useState("standard_04");
  const [quantityId, setQuantityId] = useState("proto");
  const [stlData, setStlData] = useState(null);
  const [stlFileName, setStlFileName] = useState("");
  const [stlScale, setStlScale] = useState(1);

  useEffect(() => {
    const mats = Object.keys(FILAMENTS[segment].materials);
    if (!mats.includes(materialKey)) setMaterialKey(mats[0]);
  }, [segment]);

  async function handleSTLUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const { parseSTL } = await import("../../utils/stlParser.js");
    const data = parseSTL(buffer);
    setStlData(data);
    setStlFileName(file.name);
    setStlScale(1);
  }

  function handleSTLRemove() {
    setStlData(null);
    setStlFileName("");
    setStlScale(1);
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

  const result = useMemo(() => calculate({ segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, stlData: scaledStlData }, lang),
    [segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, scaledStlData, lang]);

  const matOptions = Object.entries(FILAMENTS[segment].materials).map(([k, v]) => ({
    id: k, label: k, sub: `${v.price_kg}zł`,
  }));

  const stlSummary = stlData
    ? `STL: ${stlFileName} (${(stlData.volumeCm3 * stlScale ** 3).toFixed(1)} cm³${stlScale !== 1 ? ` ×${stlScale.toFixed(2)}` : ""})`
    : null;

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">Bambu Lab H2D · 300×320×325 mm · Dual Extruder · AMS 2 Pro</div>

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

      <CalcCard stepNum="③" label={stlData ? sl.stlSize : l.size}>
        <STLUploadCard stlData={stlData} stlFileName={stlFileName} scale={stlScale} onScaleChange={setStlScale} onUpload={handleSTLUpload} onRemove={handleSTLRemove} lang={lang} />
        {!stlData && <Chips options={SIZES} value={sizeId} onChange={setSizeId} lang={lang} />}
      </CalcCard>

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
        stlSummary || t(SIZES.find(s => s.id === sizeId)?.label, lang),
        t(INFILL.find(i => i.id === infillId)?.label, lang),
        t(COLORS.find(c => c.id === colorId)?.label, lang),
        t(PRECISION.find(p => p.id === precisionId)?.label, lang),
        t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
      ].join(" | ")} />
    </div>
  );
}
