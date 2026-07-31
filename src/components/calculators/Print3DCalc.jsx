// ============================================================
// 3D PRINT ESTIMATOR — Bambu Lab H2D  v1.3
// ============================================================
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Upload, X, AlertTriangle } from "lucide-react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards, QuoteEmailCapture, LicenseNotice } from "./calcShared.jsx";
import { RESIN_SEGMENTS, RESIN_COLORS, getResinsBySegment, getResin } from "../../data/resins.js";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

import {
  PRINT_CONFIG, MSLA_CONFIG, MSLA_BUILD_VOL_CM, BUILD_VOL_CM,
  APPLICATIONS, LAYER_HEIGHTS, MSLA_SIZES, FILAMENTS, SIZES, INFILL, INFILL_OPTIONS, COLORS, PRECISION,
  isCastable, getAvailableResins, estimateTimeFromVolume, estimatePcsPerPlate, estimatePcsPerPlateMSLA,
  calculate, calculateMSLA,
  LBL, MSLA_LBL,
} from "../../pricing/print3d.js";

// Re-eksport, bo SimpleStudioCalc i inne moduly importuja te symbole stad.
export {
  APPLICATIONS, LAYER_HEIGHTS, MSLA_SIZES, FILAMENTS, SIZES, INFILL, COLORS, PRECISION,
  calculate, calculateMSLA,
};





// Resin segment tiles (hero cards), images generated for the 3 RESIN_SEGMENTS buckets
const RESIN_SEGMENT_IMG = {
  standard: "/img/calc/3d_resins/standard.webp",
  technical: "/img/calc/3d_resins/technical.webp",
  precision: "/img/calc/3d_resins/high_precision.webp",
};

const RESIN_SEGMENT_OPTIONS = Object.entries(RESIN_SEGMENTS).map(([id, seg]) => ({
  id, label: seg.label, desc: seg.desc, img: RESIN_SEGMENT_IMG[id],
}));





/** Text-based resin option cards: label, short desc, price hint. Mirrors MaterialCards but adds desc/price text. */
function ResinCards({ options, value, onChange, lang }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`text-left p-3 rounded-xl border transition-all duration-200 ${
              active ? "border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}>
            <div className={`text-xs sm:text-sm font-semibold mb-0.5 ${active ? "text-blue-300" : "text-white"}`}>{t(o.label, lang)}</div>
            <div className="text-[11px] text-neutral-400 mb-1.5 leading-snug">{t(o.desc, lang)}</div>
            <div className={`text-[10px] font-medium ${active ? "text-blue-300" : "text-neutral-500"}`}>{o.priceHint}</div>
          </button>
        );
      })}
    </div>
  );
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

export default function Print3DCalc({ lang = "pl", initialTech = "fdm" }) {
  const l = LBL[lang] || LBL.en;
  const sl = STL_LBL[lang] || STL_LBL.en;
  const ml = MSLA_LBL[lang] || MSLA_LBL.en;
  const [tech, setTech] = useState(initialTech);

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
  const [resinSegmentId, setResinSegmentId] = useState("standard");
  const [resinKey, setResinKey] = useState("standard");
  const [resinColor, setResinColor] = useState("");
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

  // Casting patterns require the precision segment, figurines default to standard segment
  useEffect(() => {
    if (applicationId === "casting") setResinSegmentId("precision");
    else if (applicationId === "figurine") setResinSegmentId("standard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // Keep the selected resin valid for the current segment / application, reset to the first match otherwise
  useEffect(() => {
    const avail = getAvailableResins(resinSegmentId, applicationId);
    if (!avail.find(r => r.id === resinKey)) setResinKey(avail[0]?.id || "standard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resinSegmentId, applicationId]);

  // Reset the preferred color whenever the resin changes
  useEffect(() => {
    setResinColor("");
  }, [resinKey]);

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

  const resinSegmentOptions = applicationId === "casting"
    ? RESIN_SEGMENT_OPTIONS.filter(s => s.id === "precision")
    : RESIN_SEGMENT_OPTIONS;

  const availableResins = getAvailableResins(resinSegmentId, applicationId);
  const resinOptions = availableResins.map(r => ({
    id: r.id, label: r.label, desc: r.desc,
    priceHint: lang === "pl" ? `od ${Math.round(r.price_kg)} zł/kg` : `from ${Math.round(r.price_kg / CONFIG.EUR_PLN_RATE)} EUR/kg`,
  }));

  const selectedResin = getResin(resinKey);

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
      t(selectedResin?.label, lang),
      ...(selectedResin?.colorable && resinColor ? [`${ml.color}: ${resinColor}`] : []),
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
          <MaterialCards options={APPLICATIONS} value={applicationId} onChange={setApplicationId} lang={lang} cols="grid-cols-3" />
        </CalcCard>

        <CalcCard stepNum="③" label={ml.resinSegment}>
          <HeroCards options={resinSegmentOptions} value={resinSegmentId} onChange={setResinSegmentId} lang={lang} cols="grid-cols-3" minH={130} />
        </CalcCard>

        <CalcCard stepNum="④" label={ml.resin}>
          <ResinCards options={resinOptions} value={resinKey} onChange={setResinKey} lang={lang} />
        </CalcCard>

        {selectedResin?.colorable && (
          <CalcCard label={ml.color}>
            <select value={resinColor} onChange={(e) => setResinColor(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-colors">
              <option value="">{ml.colorDefault}</option>
              {RESIN_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </CalcCard>
        )}

        {isFigurine && <LicenseNotice lang={lang} />}

        <CalcCard stepNum="⑤" label={ml.layer}>
          <Chips options={LAYER_HEIGHTS} value={layerId} onChange={setLayerId} lang={lang} />
        </CalcCard>

        <CalcCard stepNum="⑥" label={mslaStlData ? sl.stlSize : ml.size} id="file-upload">
          <STLUploadCard stlData={mslaStlData} stlFileName={mslaStlFileName} scale={mslaStlScale} onScaleChange={setMslaStlScale}
            onUpload={handleMslaSTLUpload} onRemove={handleMslaSTLRemove} lang={lang}
            buildVolCm={MSLA_BUILD_VOL_CM} sizePresets={MSLA_SIZE_PRESETS} />
          {!mslaStlData && <Chips options={MSLA_SIZES} value={mslaSizeId} onChange={setMslaSizeId} lang={lang} />}
        </CalcCard>

        <CalcCard stepNum="⑦" label={ml.qty}><Chips options={QUANTITY_TIERS} value={mslaQuantityId} onChange={setMslaQuantityId} lang={lang} /></CalcCard>

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
