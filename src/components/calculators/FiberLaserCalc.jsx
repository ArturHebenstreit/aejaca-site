// ============================================================
// FIBER LASER ESTIMATOR - Raycus 30W Galvo  v1.1
// Max work area: 150 × 150 mm
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards, QuoteEmailCapture } from "./calcShared.jsx";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";

import { FIBER_CONFIG, MATERIALS, LENSES, MARK_TYPES, AREAS, calculate,
  LBL,
} from "../../pricing/laserFiber.js";

export { MATERIALS, LENSES, MARK_TYPES, AREAS, calculate };


const TECH_LABEL = { pl: "Laser Fiber", en: "Fiber Laser", de: "Faserlaser" };

export default function FiberLaserCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  const [matId, setMatId] = useState("stainless");
  const [lensId, setLensId] = useState("150mm");
  const [markId, setMarkId] = useState("surface");
  const [areaId, setAreaId] = useState("S");
  const [quantityId, setQuantityId] = useState("proto");
  const [svgData, setSvgData] = useState(null);
  const [svgFileName, setSvgFileName] = useState("");
  const [svgFile, setSvgFile] = useState(null);
  const [svgScale, setSvgScale] = useState(1);

  const selectedLens = LENSES.find(ln => ln.id === lensId);
  const lensFieldMm = { x: selectedLens.fieldMm, y: selectedLens.fieldMm };

  useEffect(() => {
    if (svgData) return;
    const area = AREAS.find(a => a.id === areaId);
    if (area && area.area && selectedLens && area.area > selectedLens.maxAreaCm2) {
      const firstValid = AREAS.find(a => a.area && a.area <= selectedLens.maxAreaCm2);
      if (firstValid) setAreaId(firstValid.id);
    }
  }, [lensId]);

  async function handleSVGUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { parseSVG } = await import("../../utils/svgParser.js");
      const data = parseSVG(text);
      setSvgData(data);
      setSvgFileName(file.name);
      setSvgFile(file);
    } catch {}
  }

  function handleSVGRemove() {
    setSvgData(null);
    setSvgFileName("");
    setSvgFile(null);
    setSvgScale(1);
  }

  const scaledSvgData = useMemo(() => {
    if (!svgData || svgScale === 1) return svgData;
    const s = svgScale;
    return { ...svgData, bboxMm: { x: svgData.bboxMm.x * s, y: svgData.bboxMm.y * s }, pathLengthCm: svgData.pathLengthCm * s, engravAreaCm2: svgData.engravAreaCm2 * s * s };
  }, [svgData, svgScale]);

  const areaOptions = useMemo(() =>
    AREAS.map(a => ({
      ...a,
      disabled: a.area && selectedLens ? a.area > selectedLens.maxAreaCm2 : false,
      note: a.area && selectedLens && a.area > selectedLens.maxAreaCm2
        ? { pl: `Przekracza pole ${selectedLens.fieldMm}×${selectedLens.fieldMm}mm`, en: `Exceeds ${selectedLens.fieldMm}×${selectedLens.fieldMm}mm field`, de: `Überschreitet ${selectedLens.fieldMm}×${selectedLens.fieldMm}mm Feld` }
        : undefined,
    })),
  [lensId]);

  const result = useMemo(() => calculate({ matId, lensId, markId, areaId, quantityId, svgData: scaledSvgData }, lang),
    [matId, lensId, markId, areaId, quantityId, scaledSvgData, lang]);

  const paramsSummary = [
    t(MATERIALS.find(m => m.id === matId)?.label, lang),
    t(LENSES.find(ln => ln.id === lensId)?.label, lang),
    t(MARK_TYPES.find(m => m.id === markId)?.label, lang),
    svgData
      ? `SVG: ${svgFileName} (${(svgData.engravAreaCm2 * svgScale * svgScale).toFixed(1)} cm²${svgScale !== 1 ? ` ${Math.round(svgScale*100)}%` : ""})`
      : t(AREAS.find(a => a.id === areaId)?.label, lang),
    t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
  ].join(" | ");

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-400 mb-6">Raycus 30W Galvo · 70mm / 150mm · max 150×150 mm</div>

      <CalcCard stepNum="①" label={l.material}>
        <MaterialCards options={MATERIALS} value={matId} onChange={setMatId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="②" label={l.lens}>
        <HeroCards options={LENSES} value={lensId} onChange={setLensId} lang={lang} cols="grid-cols-2" minH={170} />
      </CalcCard>

      <CalcCard stepNum="③" label={l.markType}>
        <HeroCards options={MARK_TYPES} value={markId} onChange={setMarkId} lang={lang} cols="grid-cols-2 sm:grid-cols-4" minH={150} />
      </CalcCard>

      <CalcCard stepNum="④" label={svgData ? sl.fromSvg : l.area} id="file-upload">
        <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={lensFieldMm} showPathLength={false} lang={lang} />
        {!svgData && <Chips options={areaOptions} value={areaId} onChange={setAreaId} lang={lang} />}
      </CalcCard>

      <CalcCard stepNum="⑤" label={l.qty}>
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <MaterialNotice lang={lang} className="mb-4" />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} />
        <QuoteEmailCapture result={result} lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={paramsSummary} preAttachedFile={svgFile} />
        <CalcToCart
          onBinding={setBindingGrosze}
          calculator="laser_fiber"
          serviceId="laser_fiber"
          params={{ matId, lensId, markId, areaId, quantityId }}
          blocked={Boolean(svgData)}
          lang={lang}
        />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={paramsSummary} preAttachedFile={svgFile} />
    </div>
  );
}
