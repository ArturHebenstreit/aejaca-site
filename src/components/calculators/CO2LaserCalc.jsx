// ============================================================
// CO2 LASER ESTIMATOR — xTool P2 55W  v1.1
// Work area: 600 × 288 mm (standard), extended with riser
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards, QuoteEmailCapture } from "./calcShared.jsx";
import CalcToCart from "./CalcToCart.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";

import {
  WORK_AREA_MM, EXTENDED_AREA_MM, PATH_NEEDS_EXTENDED, AREA_NEEDS_EXTENDED,
  ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY,
  calcEngrave, calcCut,
  CO2_CONFIG, LBL,
} from "../../pricing/laserCo2.js";

export { ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY, calcEngrave, calcCut };


const TECH_LABEL = { pl: "Laser CO2", en: "CO2 Laser", de: "CO2-Laser" };

export default function CO2LaserCalc({ lang = "pl", initialMode = "engrave" }) {
  const l = LBL[lang] || LBL.en;
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

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
  const [svgFile, setSvgFile] = useState(null);
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
      setSvgFile(file);
    } catch {}
  }

  function handleSVGRemove() {
    setSvgData(null);
    setSvgFileName("");
    setSvgFile(null);
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

  const paramsSummary = mode === "engrave"
    ? [t(ENGRAVE_MATERIALS.find(m => m.id === eMatId)?.label, lang), svgSummary || t(ENGRAVE_AREAS.find(a => a.id === eAreaId)?.label, lang), t(ENGRAVE_DETAIL.find(d => d.id === eDetailId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === eQtyId)?.label, lang)].join(" | ")
    : [t(CUT_MATERIALS.find(m => m.id === cMatId)?.label, lang), svgSummary || t(CUT_PATHS.find(p => p.id === cPathId)?.label, lang), t(CUT_COMPLEXITY.find(c => c.id === cComplexId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === cQtyId)?.label, lang)].join(" | ");

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-400 mb-6">xTool P2 · 55W CO2 · 600×288 mm</div>

      <CalcCard stepNum="①" label={l.mode}>
        <HeroCards value={mode} onChange={setMode} lang={lang} options={[
          { id: "engrave", label: l.engrave, desc: l.engraveDesc, img: "/img/calc/co2_modes/engrave.webp" },
          { id: "cut",     label: l.cut,     desc: l.cutDesc,     img: "/img/calc/co2_modes/cut.webp" },
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
          { id: "std", label: l.stdArea, desc: l.stdAreaDesc, img: "/img/calc/co2_workarea/standard.webp", disabled: stdDisabled },
          { id: "ext", label: l.extArea, desc: l.extAreaDesc, img: "/img/calc/co2_workarea/extended.webp", disabled: extDisabled },
        ]} />
      </CalcCard>

      <CalcCard stepNum="⑥" label={l.qty}>
        {mode === "engrave"
          ? <Chips options={QUANTITY_TIERS} value={eQtyId} onChange={setEQtyId} lang={lang} />
          : <Chips options={QUANTITY_TIERS} value={cQtyId} onChange={setCQtyId} lang={lang} />}
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} />
        <QuoteEmailCapture result={result} lang={lang} techLabel={`${t(TECH_LABEL, lang)} — ${mode === "engrave" ? l.engrave : l.cut}`} paramsSummary={paramsSummary} preAttachedFile={svgFile} />
        <CalcToCart
          onBinding={setBindingGrosze}
          calculator={mode === "engrave" ? "laser_co2_engrave" : "laser_co2_cut"}
          serviceId={mode === "engrave" ? "laser_engrave" : "laser_cut"}
          params={mode === "engrave"
            ? { matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId, extended }
            : { matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId, extended }}
          blocked={Boolean(svgData)}
          lang={lang}
        />
      </div>

      <InquiryForm lang={lang} techLabel={`${t(TECH_LABEL, lang)} — ${mode === "engrave" ? l.engrave : l.cut}`} paramsSummary={paramsSummary} preAttachedFile={svgFile} />
    </div>
  );
}
