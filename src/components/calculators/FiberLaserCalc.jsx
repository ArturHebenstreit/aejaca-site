// ============================================================
// FIBER LASER ESTIMATOR - Raycus 30W Galvo  v1.1
// Max work area: 150 × 150 mm
//
// PYTANIA SA WZIETE ZE SKLEPU. Lista pol, kolejnosc, etykiety i sposob
// rysowania stoja w `orderCatalog.js`, rysuje je `PolaUslugi`. Zaleznosc
// "obiektyw ogranicza pole znakowania" przeniosla sie stad do rdzenia
// cenowego (`areaOptionsForLens`), bo nalezy do oferty, a nie do ekranu:
// dopoki stala tutaj, karta uslugi w sklepie pozwalala wybrac pole wieksze
// niz zasieg soczewki i policzyc za nie cene. Decyzja: ADR-0037.
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { QUANTITY_TIERS, t, Chips, ResultHeader, ResultDisplay, NextStepPanel } from "./calcShared.jsx";
import { uniformScale, isUniform, parseScale, describeScale as opisSkaliRysunku, describeDims, AXES_2D } from "../../utils/dimScale.js";
import { measureScaled } from "../../utils/svgParser.js";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import PolaUslugi from "../shop/PolaUslugi.jsx";
import { getService } from "../../data/orderCatalog.js";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import SVGUploadCard, { SVG_LBL } from "./SVGUploadCard.jsx";
import {
  SUBSTRATES, SPARE_LABEL, spareOptionsFor, MIN_MATERIAL_NOTE,
} from "../../data/laserSubstrate.js";
import { useMaterialStock } from "../../hooks/useMaterialStock.js";

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

import { MATERIALS, LENSES, MARK_TYPES, AREAS, areaOptionsForLens, calculate } from "../../pricing/laserFiber.js";

export { MATERIALS, LENSES, MARK_TYPES, AREAS, calculate };


const TECH_LABEL = { pl: "Laser Fiber", en: "Fiber Laser", de: "Faserlaser" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stueckzahl" };

/** Opis uslugi wspolny ze sklepem: stad biora sie pytania i stan poczatkowy. */
const USLUGA = getService("laser_fiber");

export default function FiberLaserCalc({ lang = "pl", handoff = null, onHandoffUsed = null }) {
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  // STAN POCZATKOWY IDZIE Z KATALOGU, tego samego, ktory czyta karta uslugi.
  const [params, setParams] = useState(() => ({ ...USLUGA.defaults }));
  const { matId, lensId, markId, areaId, podloze } = params;
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty), zeby chipsy i
  // licznik nigdy nie pokazaly sprzecznych wartosci.
  const [qty, setQty] = useState(1);
  const quantityId = tierForQty(qty, QUANTITY_TIERS).id;
  // Podloze uslugi: przedmiot klienta, material klienta albo material nasz.
  // WPLYWA na wycene: material z naszego magazynu jest pozycja kwoty, liczona
  // z tabeli stanow magazynowych, tak samo jak przy laserze CO2.
  const materialStock = useMaterialStock();
  const [spare, setSpare] = useState("");
  const [materialNote, setMaterialNote] = useState("");

  // Zmiana podloza kasuje wybory zwiazane z poprzednim, inaczej po
  // przelaczeniu zostaje wybor niedozwolony przy nowym podlozu.
  const setParam = (klucz, wartosc) => {
    if (klucz === "quantityId") { setQty(qtyForTier(wartosc, QUANTITY_TIERS)); return; }
    if (klucz === "podloze") { setSpare(""); setMaterialNote(""); }
    setParams((p) => ({ ...p, [klucz]: wartosc }));
  };
  const [svgData, setSvgData] = useState(null);
  const [svgFileName, setSvgFileName] = useState("");
  const [svgFile, setSvgFile] = useState(null);
  // Skala rysunku jest OSOBNA DLA OSI X I Y. Rysunek jest plaski, wiec osi Z
  // tu nie ma. `sync` trzyma proporcje, `zapamietana` jest punktem powrotu.
  const [svgScale, setSvgScale] = useState(() => uniformScale(1, AXES_2D));
  const [svgSync, setSvgSync] = useState(true);
  const [svgZapamietana, setSvgZapamietana] = useState(null);

  const selectedLens = LENSES.find(ln => ln.id === lensId);
  const lensFieldMm = { x: selectedLens.fieldMm, y: selectedLens.fieldMm };

  useEffect(() => {
    if (svgData) return;
    const dostepne = areaOptionsForLens(lensId);
    if (!dostepne.find((a) => a.id === areaId)?.disabled) return;
    const pierwsze = dostepne.find((a) => a.area && !a.disabled);
    if (pierwsze) setParams((p) => ({ ...p, areaId: pierwsze.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lensId]);

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

  // POMIAR POKRYCIA DOCHODZI PO PARSOWANIU, bo wymaga narysowania pliku na
  // rastrze, a to jest asynchroniczne. Ta sama regula co przy CO2, bo fiber
  // znakuje tak samo wierszami.
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


  const result = useMemo(() => {
    // Brak pomiaru rozciagnietego rysunku nie moze cicho zejsc na przedzialy
    // z listy: to podmiana podstawy wyceny bez slowa dla klienta.
    if (svgData && !scaledSvgData) return { type: "custom" };
    return calculate({ matId, lensId, markId, areaId, quantityId, qty, svgData: scaledSvgData, podloze }, lang, materialStock);
  }, [svgData, matId, lensId, markId, areaId, quantityId, qty, scaledSvgData, lang, podloze, materialStock]);

  const paramsSummary = [
    t(MATERIALS.find(m => m.id === matId)?.label, lang),
    t(LENSES.find(ln => ln.id === lensId)?.label, lang),
    t(MARK_TYPES.find(m => m.id === markId)?.label, lang),
    svgData
      ? `SVG: ${svgFileName} (${(svgData.engravAreaCm2 * Number(svgScale.x) * Number(svgScale.y)).toFixed(1)} cm²${opisSkaliRysunku(svgScale)})`
      : t(AREAS.find(a => a.id === areaId)?.label, lang),
    t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
    t(SUBSTRATES.find(s => s.id === podloze)?.label, lang),
  ].join(" | ");

  return (
    <div>
      <div className="text-center text-xs text-neutral-400 mb-6">Raycus 30W Galvo · 70mm / 150mm · max 150×150 mm</div>

      <PolaUslugi
        service={USLUGA}
        params={{ ...params, quantityId }}
        setParam={setParam}
        lang={lang}
        wyglad="kalkulator"
        tierKey="quantityId"
        qty={qty}
        onQty={setQty}
        qtyMax={qtyLimit(QUANTITY_TIERS)}
        qtyOpen={qtyOpenValue(QUANTITY_TIERS)}
        qtyLabel={t(QTY_STEPPER_LBL, lang)}
        dodatki={{
          // Rysunek nie jest osobnym pytaniem, tylko drugim sposobem
          // odpowiedzenia na to samo: wgrany zastepuje wybor pola z listy
          // i przejmuje etykiete kartki.
          areaId: {
            id: "file-upload",
            etykieta: svgData ? sl.fromSvg : null,
            ukryjWarianty: Boolean(svgData),
            przed: () => (
              <SVGUploadCard svgData={svgData} svgFileName={svgFileName} scale={svgScale} onScaleChange={setSvgScale} sync={svgSync} onSyncChange={setSvgSync} zapamietana={svgZapamietana} onZapamietanaChange={setSvgZapamietana} scaledData={scaledSvgData} onUpload={handleSVGUpload} onRemove={handleSVGRemove} workAreaMm={lensFieldMm} showPathLength={false} lang={lang} />
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
        <MaterialNotice lang={lang} className="mb-4" delivery={Boolean(SUBSTRATES.find((x) => x.id === podloze)?.przysyla)} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
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
              params={{ matId, lensId, markId, areaId, quantityId, podloze, spare, materialNote,
                ...(svgData ? { wymiary: describeDims(svgData.bboxMm, svgScale), znieksztalcony: !isUniform(svgScale) } : {}) }}
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
