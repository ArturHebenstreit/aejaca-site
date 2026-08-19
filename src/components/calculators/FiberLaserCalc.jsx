// ============================================================
// FIBER LASER ESTIMATOR - Raycus 30W Galvo  v1.1
// Max work area: 150 × 150 mm
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, MaterialCards, HeroCards, NextStepPanel } from "./calcShared.jsx";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import { QuantityStepper } from "../shop/ConfigControls.jsx";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";
import {
  SUBSTRATE_LABEL, SUBSTRATES, SPARE_LABEL, spareOptionsFor, MIN_MATERIAL_NOTE,
} from "../../data/laserSubstrate.js";

const MATERIAL_NOTE_LBL = {
  pl: "Napisz, na jakim konkretnie materiale ma być wykonana usługa",
  en: "Tell us exactly which material the job should use",
  de: "Sagen Sie uns genau, welches Material verwendet werden soll",
};
const MATERIAL_NOTE_PLACEHOLDER = {
  pl: "np. sklejka brzozowa 3 mm, czarny plexi 5 mm",
  en: "e.g. 3 mm birch plywood, 5 mm black acrylic",
  de: "z. B. 3 mm Birkensperrholz, 5 mm schwarzes Acrylglas",
};

import { FIBER_CONFIG, MATERIALS, LENSES, MARK_TYPES, AREAS, calculate,
  LBL,
} from "../../pricing/laserFiber.js";

export { MATERIALS, LENSES, MARK_TYPES, AREAS, calculate };


const TECH_LABEL = { pl: "Laser Fiber", en: "Fiber Laser", de: "Faserlaser" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stueckzahl" };

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
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty), zeby chipsy i
  // licznik nigdy nie pokazaly sprzecznych wartosci.
  const [qty, setQty] = useState(1);
  const quantityId = tierForQty(qty, QUANTITY_TIERS).id;
  // Podloze uslugi: przedmiot klienta, material klienta albo material nasz.
  // Nie wplywa na wycene ponizej, ta liczy wylacznie robocizne, patrz MaterialNotice.
  const [podloze, setPodloze] = useState("our_stock");
  const [spare, setSpare] = useState("");
  const [materialNote, setMaterialNote] = useState("");

  // Zmiana podloza kasuje wybory zwiazane z poprzednim, inaczej po
  // przelaczeniu zostaje wybor niedozwolony przy nowym podlozu.
  function handlePodlozeChange(id) {
    setPodloze(id);
    setSpare("");
    setMaterialNote("");
  }
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
    t(SUBSTRATES.find(s => s.id === podloze)?.label, lang),
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
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={(id) => setQty(qtyForTier(id, QUANTITY_TIERS))} lang={lang} />
        <QuantityStepper label={t(QTY_STEPPER_LBL, lang)} value={qty} onChange={setQty}
          min={1} max={qtyLimit(QUANTITY_TIERS)} openValue={qtyOpenValue(QUANTITY_TIERS)} lang={lang} accent="blue" />
      </CalcCard>

      <CalcCard stepNum="⑥" label={t(SUBSTRATE_LABEL, lang)}>
        <Chips options={SUBSTRATES} value={podloze} onChange={handlePodlozeChange} lang={lang} />
        {podloze !== "our_stock" ? (
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">{t(SPARE_LABEL, lang)}</div>
            <Chips options={spareOptionsFor(podloze)} value={spare} onChange={setSpare} lang={lang} />
          </div>
        ) : (
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">{t(MATERIAL_NOTE_LBL, lang)}</div>
            <textarea
              value={materialNote}
              onChange={(e) => setMaterialNote(e.target.value)}
              placeholder={t(MATERIAL_NOTE_PLACEHOLDER, lang)}
              rows={2}
              minLength={MIN_MATERIAL_NOTE}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 resize-none transition-colors"
            />
          </div>
        )}
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <MaterialNotice lang={lang} className="mb-4" delivery={Boolean(SUBSTRATES.find((x) => x.id === podloze)?.przysyla)} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} />
        <NextStepPanel
          lang={lang}
          techLabel={t(TECH_LABEL, lang)}
          paramsSummary={paramsSummary}
          result={result}
          preAttachedFile={svgFile}
          cart={
            <CalcToCart
              embedded
              onBinding={setBindingGrosze}
              calculator="laser_fiber"
              serviceId="laser_fiber"
              params={{ matId, lensId, markId, areaId, quantityId, podloze, spare, materialNote }}
              qty={qty}
              blocked={Boolean(svgData)}
              lang={lang}
            />
          }
        />
      </div>
    </div>
  );
}
