// ============================================================
// 3D PRINT ESTIMATOR — Bambu Lab H2D  v1.3
// ============================================================
import { useState, useEffect, useMemo, useRef, lazy, Suspense, useCallback } from "react";
import { Upload, X, AlertTriangle, ShoppingCart } from "lucide-react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards, QuoteEmailCapture } from "./calcShared.jsx";
import ColorPicker from "./ColorPicker.jsx";
import AddToCartToast from "../AddToCartToast.jsx";
import { useCart } from "../../cart/CartContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

const PRINT_CONFIG = {
  PRINTER_POWER_KW: 0.35,
  DEPRECIATION_PLN_H: 2.50,
  ENGINEERING_PREMIUM: 0.35,
  HANDLING_FEE: 8.0,
};

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

function STLUploadCard({ stlData, stlFileName, scale, onScaleChange, onUpload, onRemove, lang }) {
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
  const [stlFile, setStlFile] = useState(null);
  const [stlFileName, setStlFileName] = useState("");
  const [stlScale, setStlScale] = useState(1);
  const [wantOrder, setWantOrder] = useState(false);
  const [filamentColors, setFilamentColors] = useState([]);
  const [colorDescriptions, setColorDescriptions] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  const { addItem } = useCart();
  const { lang: ctxLang } = useLanguage();
  const showEur = lang === "en" || lang === "de";
  const PLN_PER_EUR = 4.25;

  const customInfill = INFILL_OPTIONS.find(i => i.id === infillId)?.custom;
  const customPrecision = PRECISION.find(p => p.id === precisionId)?.custom;
  const customColors = COLORS.find(c => c.id === colorId)?.custom;
  const needsStl = !stlData;
  const canOrder = !customInfill && !customPrecision && !customColors && !needsStl;

  useEffect(() => {
    const mats = Object.keys(FILAMENTS[segment].materials);
    if (!mats.includes(materialKey)) setMaterialKey(mats[0]);
  }, [segment]);

  useEffect(() => {
    if (!wantOrder) return;
    const count = colorId >= 1 && colorId <= 5 ? colorId : 1;
    setFilamentColors(prev => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => ({ id: "black", name: lang === "de" ? "Schwarz" : lang === "en" ? "Black" : "Czarny", hex: "#1a1a1a" }))];
      }
      return prev.slice(0, count);
    });
  }, [colorId, wantOrder, lang]);

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

  const handleAddToCart = useCallback(() => {
    if (!filamentColors.length) return;

    const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);

    const unitPricePLN = result?.perPcPLN?.min ?? 0;
    const unitPriceNetto = showEur
      ? parseFloat((unitPricePLN / PLN_PER_EUR).toFixed(2))
      : parseFloat(unitPricePLN.toFixed(2));

    const item = {
      type: "print3d",
      stlFilename: stlFileName || null,
      stlDims: stlData ? { x: +(stlData.bbox.x * 10).toFixed(1), y: +(stlData.bbox.y * 10).toFixed(1), z: +(stlData.bbox.z * 10).toFixed(1) } : null,
      stlVolumeCm3: scaledStlData?.volumeCm3 || null,
      material: materialKey,
      materialId: materialKey,
      segment: FILAMENTS[segment].label,
      colors: filamentColors,
      colorCount: colorId,
      colorDescriptions: colorDescriptions || null,
      infill: t(INFILL_OPTIONS.find(i => i.id === infillId)?.label, lang),
      precision: t(PRECISION.find(p => p.id === precisionId)?.label, lang),
      qty: qTier?.qty ?? 1,
      unitPriceNetto,
      currency: showEur ? "EUR" : "PLN",
    };

    addItem(item);
    setLastAdded(item);
    setShowToast(true);
  }, [filamentColors, colorDescriptions, segment, materialKey, infillId, colorId, precisionId, quantityId, stlFileName, stlData, scaledStlData, result, showEur, addItem, lang]);

  const matOptions = Object.entries(FILAMENTS[segment].materials).map(([k, v]) => ({
    id: k, label: k, sub: `${v.price_kg}zł`, img: FILAMENT_IMG[k],
  }));

  const stlSummary = stlData
    ? `STL: ${stlFileName} (${(stlData.volumeCm3 * stlScale ** 3).toFixed(1)} cm³${stlScale !== 1 ? ` ×${stlScale.toFixed(2)}` : ""})`
    : null;

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-400 mb-6">Bambu Lab H2D · 300×320×325 mm · Dual Extruder · AMS 2 Pro</div>

      <CalcCard stepNum="①" label={l.segment}>
        <HeroCards options={SEGMENTS} value={segment} onChange={setSegment} lang={lang} cols="grid-cols-2" minH={170} />
      </CalcCard>

      <CalcCard stepNum="②" label={`${l.filament} — ${FILAMENTS[segment].label}`}>
        <MaterialCards options={matOptions} value={materialKey} onChange={setMaterialKey} lang={lang} cols="grid-cols-3 sm:grid-cols-4 md:grid-cols-6" />
      </CalcCard>

      <CalcCard stepNum="③" label={stlData ? sl.stlSize : l.size} id="file-upload">
        <STLUploadCard stlData={stlData} stlFileName={stlFileName} scale={stlScale} onScaleChange={setStlScale} onUpload={handleSTLUpload} onRemove={handleSTLRemove} lang={lang} />
        {!stlData && <Chips options={SIZES} value={sizeId} onChange={setSizeId} lang={lang} />}
      </CalcCard>

      <CalcCard stepNum="④" label={l.infill}><HeroCards options={INFILL_OPTIONS} value={infillId} onChange={setInfillId} lang={lang} cols="grid-cols-2 sm:grid-cols-4" minH={150} /></CalcCard>
      <CalcCard stepNum="⑤" label={l.colors}><Chips options={COLORS} value={colorId} onChange={setColorId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑥" label={l.precision}><Chips options={PRECISION} value={precisionId} onChange={setPrecisionId} lang={lang} /></CalcCard>
      <CalcCard stepNum="⑦" label={l.qty}><Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} /></CalcCard>

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

      {!wantOrder ? (
        <button
          onClick={() => {
            const count = colorId >= 1 && colorId <= 5 ? colorId : 1;
            const initialColors = Array.from({ length: count }, () => ({ id: "black", name: lang === "de" ? "Schwarz" : lang === "en" ? "Black" : "Czarny", hex: "#1a1a1a" }));
            setFilamentColors(initialColors);
            setColorDescriptions("");
            setWantOrder(true);
          }}
          className="w-full mt-4 py-3 rounded-xl border border-amber-400/30 text-amber-400 text-sm font-medium hover:bg-amber-400/10 hover:border-amber-400/60 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {lang === "pl" ? "Chcę zlecić wydruk" : lang === "de" ? "Druckauftrag erteilen" : "I want to order a print"}
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {lang === "pl" ? "Zlecenie wydruku" : lang === "de" ? "Druckauftrag" : "Print order"}
            </div>
            <button onClick={() => setWantOrder(false)} className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors">
              {lang === "pl" ? "Anuluj" : lang === "de" ? "Abbrechen" : "Cancel"}
            </button>
          </div>

          {!canOrder ? (
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 mb-3">
                {lang === "pl" ? "Aby dodać do koszyka, uzupełnij poniższe:" : lang === "de" ? "Um in den Warenkorb zu legen, ergänze folgendes:" : "To add to cart, please complete the following:"}
              </p>
              <ul className="space-y-1.5">
                {needsStl && (
                  <li className="flex items-start gap-2 text-xs text-amber-300">
                    <span className="mt-0.5">•</span>
                    <span>{lang === "pl" ? "Załaduj plik STL — potrzebujemy dokładnych wymiarów modelu" : lang === "de" ? "STL-Datei hochladen — wir benötigen genaue Modellmaße" : "Upload an STL file — we need exact model dimensions"}</span>
                  </li>
                )}
                {customInfill && (
                  <li className="flex items-start gap-2 text-xs text-amber-300">
                    <span className="mt-0.5">•</span>
                    <span>{lang === "pl" ? "Wybierz standardowe wypełnienie (Niskie / Średnie / Wysokie)" : lang === "de" ? "Standard-Füllung wählen (Niedrig / Mittel / Hoch)" : "Select standard infill (Low / Medium / High)"}</span>
                  </li>
                )}
                {customPrecision && (
                  <li className="flex items-start gap-2 text-xs text-amber-300">
                    <span className="mt-0.5">•</span>
                    <span>{lang === "pl" ? "Wybierz standardową precyzję z listy" : lang === "de" ? "Standard-Präzision aus der Liste wählen" : "Select a standard precision option"}</span>
                  </li>
                )}
                {customColors && (
                  <li className="flex items-start gap-2 text-xs text-amber-300">
                    <span className="mt-0.5">•</span>
                    <span>{lang === "pl" ? "Niestandardowa kolorystyka wymaga indywidualnych ustaleń — skontaktuj się z nami" : lang === "de" ? "Individuelle Farbgebung erfordert persönliche Absprache — kontaktiere uns" : "Custom color scheme requires individual discussion — contact us"}</span>
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <>
              <div className="mb-1 text-xs font-medium text-neutral-300">
                {colorId === 1
                  ? (lang === "pl" ? "Kolor filamentu" : lang === "de" ? "Filamentfarbe" : "Filament color")
                  : (lang === "pl" ? `Kolory filamentu (${colorId})` : lang === "de" ? `Filamentfarben (${colorId})` : `Filament colors (${colorId})`)}
              </div>

              {colorId === 1 ? (
                <ColorPicker
                  value={filamentColors[0] || null}
                  onChange={c => setFilamentColors([c])}
                  lang={lang}
                />
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: colorId }).map((_, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-neutral-500 mb-1.5 uppercase tracking-wide">
                        {lang === "pl" ? `Kolor ${i + 1}` : lang === "de" ? `Farbe ${i + 1}` : `Color ${i + 1}`}
                      </div>
                      <ColorPicker
                        value={filamentColors[i] || null}
                        onChange={c => setFilamentColors(prev => { const next = [...prev]; next[i] = c; return next; })}
                        lang={lang}
                      />
                    </div>
                  ))}

                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1.5 uppercase tracking-wide">
                      {lang === "pl" ? "Przypisanie kolorów do elementów" : lang === "de" ? "Farbzuweisung zu Elementen" : "Color-to-element assignment"}
                    </div>
                    <textarea
                      value={colorDescriptions}
                      onChange={e => setColorDescriptions(e.target.value)}
                      rows={3}
                      placeholder={
                        lang === "pl" ? "Np. Kolor 1 (czarny) – korpus, Kolor 2 (biały) – logo…" :
                        lang === "de" ? "Z.B. Farbe 1 (Schwarz) – Gehäuse, Farbe 2 (Weiß) – Logo…" :
                        "E.g. Color 1 (black) – body, Color 2 (white) – logo…"
                      }
                      className="w-full rounded-lg bg-neutral-900/60 border border-white/10 text-sm text-neutral-200 placeholder-neutral-600 px-3 py-2 focus:outline-none focus:border-amber-400/40 resize-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {(() => {
                const allColorsSelected = filamentColors.length === (colorId || 1) && filamentColors.every(c => c != null);
                const needsDesc = colorId > 1 && !colorDescriptions.trim();
                const canAdd = allColorsSelected && !needsDesc;
                return (
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAdd}
                    title={needsDesc ? (lang === "pl" ? "Opisz przypisanie kolorów" : "Describe color assignment") : undefined}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      canAdd
                        ? "bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-400/20"
                        : "bg-white/5 text-neutral-500 cursor-not-allowed border border-white/10"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {canAdd
                      ? (lang === "pl" ? "Dodaj do koszyka" : lang === "de" ? "In den Warenkorb" : "Add to cart")
                      : needsDesc
                        ? (lang === "pl" ? "Opisz przypisanie kolorów" : lang === "de" ? "Farbzuweisung beschreiben" : "Describe color assignment")
                        : (lang === "pl" ? "Wybierz kolory" : lang === "de" ? "Farben auswählen" : "Select colors")}
                  </button>
                );
              })()}

              {showToast && lastAdded && (
                <AddToCartToast item={lastAdded} onClose={() => setShowToast(false)} />
              )}
            </>
          )}
        </div>
      )}

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
