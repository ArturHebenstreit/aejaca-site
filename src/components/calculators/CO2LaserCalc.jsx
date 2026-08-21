// ============================================================
// CO2 LASER ESTIMATOR - xTool P2 55W  v1.1
// Work area: 600 × 288 mm (standard), extended with riser
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, MaterialCards, HeroCards, NextStepPanel } from "./calcShared.jsx";
import { uniformScale, isUniform, dimsFor, parseScale, serializeScale, describeScale as opisSkaliRysunku, describeDims, AXES_2D } from "../../utils/dimScale.js";
import { measureScaled } from "../../utils/svgParser.js";
import { coverageOf, coverageMeasured } from "../../pricing/engraveCoverage.js";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import { QuantityStepper } from "../shop/ConfigControls.jsx";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";
import { useMaterialStock } from "../../hooks/useMaterialStock.js";
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

import {
  WORK_AREA_MM, EXTENDED_AREA_MM, PATH_NEEDS_EXTENDED, AREA_NEEDS_EXTENDED,
  ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY,
  calcEngrave, calcCut,
  CO2_CONFIG, LBL,
} from "../../pricing/laserCo2.js";

export { ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY, calcEngrave, calcCut };


const TECH_LABEL = { pl: "Laser CO2", en: "CO2 Laser", de: "CO2-Laser" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stueckzahl" };

export default function CO2LaserCalc({ lang = "pl", initialMode = "engrave", handoff = null, onHandoffUsed = null }) {
  const l = LBL[lang] || LBL.en;
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  const [mode, setMode] = useState(initialMode);
  const [eMatId, setEMatId] = useState("wood");
  const [eAreaId, setEAreaId] = useState("S");
  const [eDetailId, setEDetailId] = useState("standard");
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty), zeby chipsy i
  // licznik nigdy nie pokazaly sprzecznych wartosci. Grawer i ciecie maja
  // wlasny naklad, wiec kazdy dostaje osobna pare liczba/prog.
  const [engraveQty, setEngraveQty] = useState(1);
  const eQtyId = tierForQty(engraveQty, QUANTITY_TIERS).id;
  const [cMatId, setCMatId] = useState("ply3");
  const [cPathId, setCPathId] = useState("S");
  const [cComplexId, setCComplexId] = useState("moderate");
  const [cutQty, setCutQty] = useState(1);
  const cQtyId = tierForQty(cutQty, QUANTITY_TIERS).id;
  const [extended, setExtended] = useState(false);
  // Podloze uslugi: przedmiot klienta, material klienta albo material nasz.
  // Od 2026-08-20 WPLYWA na wycene: przy materiale z naszego magazynu
  // doliczamy plyte ze stawki w tabeli, przy materiale klienta nie.
  const [podloze, setPodloze] = useState("our_stock");
  // Stawki materialow z magazynu: te same, z ktorych liczy serwer.
  const materialStock = useMaterialStock();
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
  // Skala rysunku jest OSOBNA DLA OSI X I Y. Rysunek jest plaski, wiec osi Z
  // tu nie ma. `sync` trzyma proporcje, `zapamietana` jest punktem powrotu.
  const [svgScale, setSvgScale] = useState(() => uniformScale(1, AXES_2D));
  const [svgSync, setSvgSync] = useState(true);
  const [svgZapamietana, setSvgZapamietana] = useState(null);

  const scaledSvgData = useMemo(() => {
    if (!svgData) return null;
    if (isUniform(svgScale) && Number(svgScale.x) === 1) return svgData;
    // PRZY ROZJECHANYCH OSIACH DLUGOSC SCIEZKI TRZEBA ZMIERZYC PONOWNIE.
    // Kolo rozciagniete w poziomie staje sie elipsa, a jej obwod nie jest ani
    // proporcjonalny do osi, ani sredni z nich. Cena ciecia idzie wprost
    // z dlugosci sciezki, wiec mnozenie dawaloby liczbe wygladajaca poprawnie
    // i nieprawdziwa. `measureScaled` probkuje rysunek i skraca blad w ilorazie.
    return measureScaled(svgData, Number(svgScale.x), Number(svgScale.y));
  }, [svgData, svgScale]);

  // POMIAR POKRYCIA DOCHODZI PO PARSOWANIU, bo wymaga narysowania pliku na
  // rastrze, a to jest asynchroniczne. Stoi w osobnym efekcie, a nie w obsludze
  // wgrywania, zeby objal tak samo rysunek przejety z szybkiej wyceny.
  // `coverage: null` po nieudanym pomiarze jest tu potrzebne: bez niego warunek
  // `!== undefined` nigdy by nie zgasl i mierzylibysmy w kolko.
  useEffect(() => {
    const tekst = svgData?.svgText;
    if (!tekst || svgData.coverage !== undefined) return;
    let zywy = true;
    (async () => {
      const { measureCoverage } = await import("../../utils/svgCoverage.js");
      const cov = await measureCoverage(tekst, svgData.bboxMm, svgData.contentBox);
      if (!zywy) return;
      setSvgData((d) => (d && d.svgText === tekst ? { ...d, coverage: null, ...(cov || {}) } : d));
    })();
    return () => { zywy = false; };
  }, [svgData?.svgText, svgData?.coverage]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // PRZEJECIE RYSUNKU Z SZYBKIEJ WYCENY. Rysunek jest juz sparsowany razem
  // ze skala z suwaka wielkosci, wiec nie kazemy klientowi wgrywac go drugi
  // raz tylko dlatego, ze zmienil tryb kalkulatora.
  useEffect(() => {
    if (!handoff?.data) return;
    setSvgData(handoff.data);
    setSvgFile(handoff.file || null);
    setSvgFileName(handoff.name || "");
    setSvgScale(parseScale(handoff.scale || 1, AXES_2D));
    onHandoffUsed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff]);

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
    setSvgScale(uniformScale(1, AXES_2D));
  }

  const result = useMemo(() => {
    // BRAK POMIARU NIE MOZE DAC KWOTY. `measureScaled` zwraca null, gdy nie da
    // sie zmierzyc rozciagnietego rysunku. Milczace zejscie na przedzialy
    // z listy podmienialoby podstawe wyceny bez slowa.
    if (svgData && !scaledSvgData) return { type: "custom" };
    if (mode === "engrave") return calcEngrave({ matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId, qty: engraveQty, extended, svgData: scaledSvgData, podloze }, lang, materialStock);
    return calcCut({ matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId, qty: cutQty, extended, svgData: scaledSvgData, podloze }, lang, materialStock);
  }, [svgData, mode, eMatId, eAreaId, eDetailId, eQtyId, cMatId, cPathId, cComplexId, cQtyId, extended, scaledSvgData, lang, podloze, materialStock]);

  const presetNeedsExtended = mode === "engrave" ? AREA_NEEDS_EXTENDED[eAreaId] : PATH_NEEDS_EXTENDED[cPathId];
  const needsExtended = scaledSvgData ? svgNeedsExtended : presetNeedsExtended;
  const stdDisabled = needsExtended === true;
  const extDisabled = scaledSvgData ? !svgNeedsExtended : needsExtended === false;

  const svgSummary = svgData
    ? (mode === "engrave"
      // Pokrycie jest CZESCIA USTALENIA, a nie ciekawostka z rozpiski: to ono
      // decyduje o kwocie, wiec musi pojechac razem z nia do maila i do zapytania.
      ? `SVG: ${svgFileName} (${(svgData.engravAreaCm2 * Number(svgScale.x) * Number(svgScale.y)).toFixed(1)} cm²${coverageMeasured(svgData) ? `, ${sl.coverage} ${Math.round(coverageOf(svgData) * 100)}%` : ""}${opisSkaliRysunku(svgScale)})`
      : `SVG: ${svgFileName} (${((scaledSvgData || svgData).pathLengthCm).toFixed(0)} cm${opisSkaliRysunku(svgScale)})`)
    : null;

  const substrateSummary = t(SUBSTRATES.find(s => s.id === podloze)?.label, lang);
  const paramsSummary = mode === "engrave"
    ? [t(ENGRAVE_MATERIALS.find(m => m.id === eMatId)?.label, lang), svgSummary || t(ENGRAVE_AREAS.find(a => a.id === eAreaId)?.label, lang), t(ENGRAVE_DETAIL.find(d => d.id === eDetailId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === eQtyId)?.label, lang), substrateSummary].join(" | ")
    : [t(CUT_MATERIALS.find(m => m.id === cMatId)?.label, lang), svgSummary || t(CUT_PATHS.find(p => p.id === cPathId)?.label, lang), t(CUT_COMPLEXITY.find(c => c.id === cComplexId)?.label, lang), extended ? l.extArea : l.stdArea, t(QUANTITY_TIERS.find(q => q.id === cQtyId)?.label, lang), substrateSummary].join(" | ");

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
            <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} sync={svgSync} onSyncChange={setSvgSync} zapamietana={svgZapamietana} onZapamietanaChange={setSvgZapamietana} scaledData={scaledSvgData} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={WORK_AREA_MM} extendedAreaMm={EXTENDED_AREA_MM} showPathLength={false} lang={lang} />
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
            <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} sync={svgSync} onSyncChange={setSvgSync} zapamietana={svgZapamietana} onZapamietanaChange={setSvgZapamietana} scaledData={scaledSvgData} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={WORK_AREA_MM} extendedAreaMm={EXTENDED_AREA_MM} showPathLength={true} lang={lang} />
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
        {mode === "engrave" ? (
          <>
            <Chips options={QUANTITY_TIERS} value={eQtyId} onChange={(id) => setEngraveQty(qtyForTier(id, QUANTITY_TIERS))} lang={lang} />
            <QuantityStepper label={t(QTY_STEPPER_LBL, lang)} value={engraveQty} onChange={setEngraveQty}
              min={1} max={qtyLimit(QUANTITY_TIERS)} openValue={qtyOpenValue(QUANTITY_TIERS)} lang={lang} accent="blue" />
          </>
        ) : (
          <>
            <Chips options={QUANTITY_TIERS} value={cQtyId} onChange={(id) => setCutQty(qtyForTier(id, QUANTITY_TIERS))} lang={lang} />
            <QuantityStepper label={t(QTY_STEPPER_LBL, lang)} value={cutQty} onChange={setCutQty}
              min={1} max={qtyLimit(QUANTITY_TIERS)} openValue={qtyOpenValue(QUANTITY_TIERS)} lang={lang} accent="blue" />
          </>
        )}
      </CalcCard>

      <CalcCard stepNum="⑦" label={t(SUBSTRATE_LABEL, lang)}>
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
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        {/* Materiał NIE jest w tej kwocie i klient musi to wiedzieć przed
            zakupem, a nie z regulaminu po fakcie. */}
        <MaterialNotice lang={lang} className="mt-4" delivery={Boolean(SUBSTRATES.find((x) => x.id === podloze)?.przysyla)} />
        <NextStepPanel
          lang={lang}
          techLabel={`${t(TECH_LABEL, lang)} - ${mode === "engrave" ? l.engrave : l.cut}`}
          paramsSummary={paramsSummary}
          result={result}
          preAttachedFile={svgFile}
          cart={
            <CalcToCart
              embedded
              onBinding={setBindingGrosze}
              calculator={mode === "engrave" ? "laser_co2_engrave" : "laser_co2_cut"}
              serviceId={mode === "engrave" ? "laser_engrave" : "laser_cut"}
              params={mode === "engrave"
                ? { matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId, extended, podloze, spare, materialNote,
                    ...(svgData ? { wymiary: describeDims(svgData.bboxMm, svgScale), znieksztalcony: !isUniform(svgScale) } : {}) }
                : { matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId, extended, podloze, spare, materialNote,
                    ...(svgData ? { wymiary: describeDims(svgData.bboxMm, svgScale), znieksztalcony: !isUniform(svgScale) } : {}) }}
              qty={mode === "engrave" ? engraveQty : cutQty}
              blocked={Boolean(svgData)}
              lang={lang}
            />
          }
        />
      </div>
    </div>
  );
}
