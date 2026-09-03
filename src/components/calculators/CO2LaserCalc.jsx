// ============================================================
// CO2 LASER ESTIMATOR - xTool P2 55W  v1.1
// Work area: 600 × 288 mm (standard), extended with riser
//
// PYTANIA SA WZIETE ZE SKLEPU (`orderCatalog.js`, rysuje `PolaUslugi`).
// Tryb pracy zostaje tutaj, bo to nie jest pole uslugi, tylko wybor MIEDZY
// dwiema uslugami: grawerowaniem i cieciem.
//
// STOL ROBOCZY PRZESTAL BYC PYTANIEM. Stal tu jako krok, w ktorym zawsze
// dokladnie jedna kafelka byla klikalna, bo wynika w calosci z wielkosci
// pracy. Liczy go teraz `wymagaRozszerzonego` w rdzeniu cenowym, wiec sklep
// przestal sprzedawac grawer L za 110,37 zl przy wycenie 150,00 zl.
// Decyzja wlasciciela 2026-09-03, ADR-0037.
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { QUANTITY_TIERS, t, Chips, CalcCard, ResultHeader, ResultDisplay, HeroCards, NextStepPanel } from "./calcShared.jsx";
import { uniformScale, isUniform, parseScale, describeScale as opisSkaliRysunku, describeDims, AXES_2D } from "../../utils/dimScale.js";
import { measureScaled } from "../../utils/svgParser.js";
import { coverageOf, coverageMeasured } from "../../pricing/engraveCoverage.js";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import PolaUslugi from "../shop/PolaUslugi.jsx";
import { getService } from "../../data/orderCatalog.js";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";
import { useMaterialStock } from "../../hooks/useMaterialStock.js";
import {
  SUBSTRATES, SPARE_LABEL, spareOptionsFor, MIN_MATERIAL_NOTE,
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
  WORK_AREA_MM, EXTENDED_AREA_MM, wymagaRozszerzonego,
  ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY,
  calcEngrave, calcCut, LBL,
} from "../../pricing/laserCo2.js";

export { ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY, calcEngrave, calcCut };


const TECH_LABEL = { pl: "Laser CO2", en: "CO2 Laser", de: "CO2-Laser" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stueckzahl" };

/** Zdanie zamiast pytania: stol wynika z wielkosci pracy, wiec go oznajmiamy. */
const STOL_NOTE = {
  pl: `Praca nie mieści się na standardowym stole ${WORK_AREA_MM.x}×${WORK_AREA_MM.y} mm, więc idzie przez przelot ${EXTENDED_AREA_MM.x}×${EXTENDED_AREA_MM.y} mm. Narzut i dłuższe przygotowanie są już w kwocie poniżej.`,
  en: `This job does not fit the standard ${WORK_AREA_MM.x}×${WORK_AREA_MM.y} mm bed, so it runs through the ${EXTENDED_AREA_MM.x}×${EXTENDED_AREA_MM.y} mm passthrough. The surcharge and longer setup are already in the amount below.`,
  de: `Diese Arbeit passt nicht auf den Standardtisch ${WORK_AREA_MM.x}×${WORK_AREA_MM.y} mm und läuft durch den Durchlass ${EXTENDED_AREA_MM.x}×${EXTENDED_AREA_MM.y} mm. Aufpreis und längere Rüstzeit sind im Betrag unten enthalten.`,
};

/** Opisy obu uslug wspolne ze sklepem: stad biora sie pytania i stan startowy. */
const USLUGI = { engrave: getService("laser_engrave"), cut: getService("laser_cut") };

export default function CO2LaserCalc({ lang = "pl", initialMode = "engrave", handoff = null, onHandoffUsed = null }) {
  const l = LBL[lang] || LBL.en;
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  const [mode, setMode] = useState(initialMode);
  // STAN POCZATKOWY OBU USLUG IDZIE Z KATALOGU, tego samego, ktory czyta karta
  // uslugi. Grawer i ciecie maja osobne zestawy, zeby przelaczenie trybu nie
  // kasowalo tego, co klient juz ustawil po drugiej stronie.
  const [eParams, setEParams] = useState(() => ({ ...USLUGI.engrave.defaults }));
  const [cParams, setCParams] = useState(() => ({ ...USLUGI.cut.defaults }));
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty), zeby chipsy i
  // licznik nigdy nie pokazaly sprzecznych wartosci. Grawer i ciecie maja
  // wlasny naklad, wiec kazdy dostaje osobna pare liczba/prog.
  const [engraveQty, setEngraveQty] = useState(1);
  const eQtyId = tierForQty(engraveQty, QUANTITY_TIERS).id;
  const [cutQty, setCutQty] = useState(1);
  const cQtyId = tierForQty(cutQty, QUANTITY_TIERS).id;
  const { matId: eMatId, areaId: eAreaId, detailId: eDetailId } = eParams;
  const { matId: cMatId, pathId: cPathId, complexId: cComplexId } = cParams;
  // Podloze uslugi: przedmiot klienta, material klienta albo material nasz.
  // Od 2026-08-20 WPLYWA na wycene: przy materiale z naszego magazynu
  // doliczamy plyte ze stawki w tabeli, przy materiale klienta nie.
  // Jest wspolne dla obu trybow, bo dotyczy tej samej pracowni i tej samej
  // sztuki materialu, a nie tego, czy tniemy, czy grawerujemy.
  const [podloze, setPodloze] = useState("our_stock");
  // Stawki materialow z magazynu: te same, z ktorych liczy serwer.
  const materialStock = useMaterialStock();
  const [spare, setSpare] = useState("");
  const [materialNote, setMaterialNote] = useState("");

  // Zmiana podloza kasuje wybory zwiazane z poprzednim, inaczej po
  // przelaczeniu zostaje wybor niedozwolony przy nowym podlozu.
  const setParam = (klucz, wartosc) => {
    if (klucz === "quantityId") {
      (mode === "engrave" ? setEngraveQty : setCutQty)(qtyForTier(wartosc, QUANTITY_TIERS));
      return;
    }
    if (klucz === "podloze") { setPodloze(wartosc); setSpare(""); setMaterialNote(""); return; }
    (mode === "engrave" ? setEParams : setCParams)((p) => ({ ...p, [klucz]: wartosc }));
  };
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
    if (mode === "engrave") return calcEngrave({ matId: eMatId, areaId: eAreaId, detailId: eDetailId, quantityId: eQtyId, qty: engraveQty, svgData: scaledSvgData, podloze }, lang, materialStock);
    return calcCut({ matId: cMatId, pathId: cPathId, complexId: cComplexId, quantityId: cQtyId, qty: cutQty, svgData: scaledSvgData, podloze }, lang, materialStock);
  }, [svgData, mode, eMatId, eAreaId, eDetailId, eQtyId, engraveQty, cMatId, cPathId, cComplexId, cQtyId, cutQty, scaledSvgData, lang, podloze, materialStock]);

  // Stol liczy rdzen cenowy, tu tylko pytamy go o to samo, zeby napisac
  // klientowi, co sie dzieje. Zadna z tych dwoch drog nie moze odpowiedziec
  // inaczej niz druga, bo obie wolaja te sama funkcje.
  const extended = wymagaRozszerzonego(
    mode === "engrave"
      ? { areaId: eAreaId, svgData: scaledSvgData }
      : { pathId: cPathId, svgData: scaledSvgData },
  );

  const svgSummary = svgData
    ? (mode === "engrave"
      // Pokrycie jest CZESCIA USTALENIA, a nie ciekawostka z rozpiski: to ono
      // decyduje o kwocie, wiec musi pojechac razem z nia do maila i do zapytania.
      ? `SVG: ${svgFileName} (${(svgData.engravAreaCm2 * Number(svgScale.x) * Number(svgScale.y)).toFixed(1)} cm²${coverageMeasured(svgData) ? `, ${sl.coverage} ${Math.round(coverageOf(svgData) * 100)}%` : ""}${opisSkaliRysunku(svgScale)})`
      : `SVG: ${svgFileName} (${((scaledSvgData || svgData).pathLengthCm).toFixed(0)} cm${opisSkaliRysunku(svgScale)})`)
    : null;

  const substrateSummary = t(SUBSTRATES.find(s => s.id === podloze)?.label, lang);
  const paramsSummary = mode === "engrave"
    ? [t(ENGRAVE_MATERIALS.find(m => m.id === eMatId)?.label, lang), svgSummary || t(ENGRAVE_AREAS.find(a => a.id === eAreaId)?.label, lang), t(ENGRAVE_DETAIL.find(d => d.id === eDetailId)?.label, lang), ...(extended ? [l.extArea] : []), t(QUANTITY_TIERS.find(q => q.id === eQtyId)?.label, lang), substrateSummary].join(" | ")
    : [t(CUT_MATERIALS.find(m => m.id === cMatId)?.label, lang), svgSummary || t(CUT_PATHS.find(p => p.id === cPathId)?.label, lang), t(CUT_COMPLEXITY.find(c => c.id === cComplexId)?.label, lang), ...(extended ? [l.extArea] : []), t(QUANTITY_TIERS.find(q => q.id === cQtyId)?.label, lang), substrateSummary].join(" | ");

  return (
    <div>
      <div className="text-center text-xs text-neutral-400 mb-6">xTool P2 · 55W CO2 · 600×288 mm</div>

      <CalcCard stepNum="①" label={l.mode}>
        <HeroCards value={mode} onChange={setMode} lang={lang} options={[
          { id: "engrave", label: l.engrave, desc: l.engraveDesc, img: "/img/calc/co2_modes/engrave.webp" },
          { id: "cut",     label: l.cut,     desc: l.cutDesc,     img: "/img/calc/co2_modes/cut.webp" },
        ]} />
      </CalcCard>

      <PolaUslugi
        service={USLUGI[mode]}
        params={mode === "engrave"
          ? { ...eParams, quantityId: eQtyId, podloze }
          : { ...cParams, quantityId: cQtyId, podloze }}
        setParam={setParam}
        lang={lang}
        wyglad="kalkulator"
        pierwszyNumer={2}
        tierKey="quantityId"
        qty={mode === "engrave" ? engraveQty : cutQty}
        onQty={mode === "engrave" ? setEngraveQty : setCutQty}
        qtyMax={qtyLimit(QUANTITY_TIERS)}
        qtyOpen={qtyOpenValue(QUANTITY_TIERS)}
        qtyLabel={t(QTY_STEPPER_LBL, lang)}
        dodatki={{
          // Rysunek nie jest osobnym pytaniem, tylko drugim sposobem
          // odpowiedzenia na to samo: wgrany zastepuje wybor progu z listy
          // i przejmuje etykiete kartki.
          [mode === "engrave" ? "areaId" : "pathId"]: {
            id: "file-upload",
            etykieta: svgData ? sl.fromSvg : null,
            ukryjWarianty: Boolean(svgData),
            przed: () => (
              <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} sync={svgSync} onSyncChange={setSvgSync} zapamietana={svgZapamietana} onZapamietanaChange={setSvgZapamietana} scaledData={scaledSvgData} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={WORK_AREA_MM} extendedAreaMm={EXTENDED_AREA_MM} showPathLength={mode === "cut"} lang={lang} />
            ),
          },
          // Sztuka na proby albo nazwa materialu: obie zaleza od podloza,
          // wiec stoja w tej samej kartce, pod tym samym pytaniem.
          podloze: {
            po: () => (podloze !== "our_stock" ? (
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">{t(SPARE_LABEL, lang)}</div>
                <Chips options={spareOptionsFor(podloze)} value={spare} onChange={setSpare} lang={lang} />
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">{t(MATERIAL_NOTE_LBL, lang)}</div>
                <textarea
                  value={materialNote}
                  onChange={(e) => setMaterialNote(e.target.value)}
                  placeholder={t(MATERIAL_NOTE_PLACEHOLDER, lang)}
                  rows={2}
                  minLength={MIN_MATERIAL_NOTE}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 resize-none transition-colors"
                />
              </div>
            )),
          },
        }}
      />

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        {/* Stol rozszerzony jest SKUTKIEM wielkosci pracy, a nie wyborem, wiec
            stoi tu jako zdanie o kwocie, a nie wyzej jako pytanie z jedna
            klikalna odpowiedzia. */}
        {extended && <p className="text-neutral-400 text-xs leading-relaxed mb-4">{t(STOL_NOTE, lang)}</p>}
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
