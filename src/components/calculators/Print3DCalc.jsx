// ============================================================
// 3D PRINT ESTIMATOR - Bambu Lab H2D  v1.3
//
// PYTANIA SA WZIETE ZE SKLEPU (`orderCatalog.js`, rysuje `PolaUslugi`).
// Wybor technologii zostaje tutaj, bo to nie jest pole uslugi, tylko wybor
// MIEDZY dwiema uslugami: drukiem z filamentu i drukiem zywicznym.
// Segment zywicy przeniosl sie stad do katalogu: dopoki stal tu, karta uslugi
// w sklepie wykladala wszystkie trzynascie zywic w jednej siatce.
// Decyzja: ADR-0037.
// ============================================================
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Upload, X, AlertTriangle } from "lucide-react";
import DimensionBox from "./DimensionBox.jsx";
import { uniformScale, isUniform, dimsFor, volumeFactor, fitsBox, parseScale, serializeScale, describeDims } from "../../utils/dimScale.js";
import { QUANTITY_TIERS, t, CalcCard, ResultHeader, ResultDisplay, HeroCards, LicenseNotice, NextStepPanel } from "./calcShared.jsx";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import PolaUslugi, { poprawkiWyboru } from "../shop/PolaUslugi.jsx";
import { getService } from "../../data/orderCatalog.js";
import CalcToCart from "./CalcToCart.jsx";
import PrintabilityGate from "./PrintabilityGate.jsx";
import { nozzleFromPrecision } from "../../analysis/printability.js";
import { looksTooSmall, suspectUnits } from "../../pricing/meshUnits.js";

/** Te same formaty, ktore przyjmuje konfigurator w sklepie */
const ACCEPT_MODEL = ".stl,.obj,.3mf,.step,.stp";
import { RESIN_COLORS, getResin } from "../../data/resins.js";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

import {
  PRINT_CONFIG, MSLA_CONFIG, MSLA_BUILD_VOL_CM, BUILD_VOL_CM,
  APPLICATIONS, LAYER_HEIGHTS, MSLA_SIZES, FILAMENTS, SIZES, INFILL, INFILL_OPTIONS, COLORS, PRECISION,
  isCastable, estimateTimeFromVolume, estimatePcsPerPlate, estimatePcsPerPlateMSLA,
  maxScaleForBuildVolume,
  calculate, calculateMSLA,
  LBL, MSLA_LBL,
} from "../../pricing/print3d.js";

// Re-eksport, bo SimpleStudioCalc i inne moduly importuja te symbole stad.
export {
  APPLICATIONS, LAYER_HEIGHTS, MSLA_SIZES, FILAMENTS, SIZES, INFILL, COLORS, PRECISION,
  calculate, calculateMSLA,
};





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
  pl: { upload: "Załaduj model 3D", orManual: "lub wybierz rozmiar ręcznie poniżej",
    dropHint: "Kliknij lub przeciągnij model: STL, OBJ, 3MF lub STEP", dropSub: "Automatyczna wycena na podstawie objętości i wymiarów",
    volume: "Objętość", dims: "Wymiary",
    triangles: "Trójkąty", remove: "Usuń", exceeds: "Model przekracza przestrzeń druku", stlSize: "Rozmiar z pliku",
    scale: "Skala wydruku", fitToPlate: "Dopasuj do płyty", original: "Oryg.",
    unitTitle: "Ten model ma po odczycie", unitText: "Pliki STL i OBJ nie zapisują jednostki, więc czytamy je jako milimetry - a ten plik prawdopodobnie zapisano inaczej.",
    unitRead: "Czytaj w", unitClose: "Jeśli żadna z tych wartości nie pasuje, wielkość ustaw skalą wydruku powyżej." },
  en: { upload: "Upload a 3D model", orManual: "or select size manually below",
    dropHint: "Click or drag a model: STL, OBJ, 3MF or STEP", dropSub: "Auto-quote based on volume and dimensions",
    volume: "Volume", dims: "Dimensions",
    triangles: "Triangles", remove: "Remove", exceeds: "Model exceeds build volume", stlSize: "Size from file",
    scale: "Print scale", fitToPlate: "Fit to plate", original: "Orig.",
    unitTitle: "This model reads as", unitText: "STL and OBJ files do not store a unit, so we read them as millimeters - this file was probably saved differently.",
    unitRead: "Read in", unitClose: "If none of these values fits, set the size with the print scale above." },
  de: { upload: "3D-Modell hochladen", orManual: "oder Größe unten manuell wählen",
    dropHint: "Modell klicken oder ziehen: STL, OBJ, 3MF oder STEP", dropSub: "Automatische Kalkulation anhand von Volumen und Maßen",
    volume: "Volumen", dims: "Abmessungen",
    triangles: "Dreiecke", remove: "Entfernen", exceeds: "Modell überschreitet Bauraum", stlSize: "Größe aus Datei",
    scale: "Druckmaßstab", fitToPlate: "An Platte anpassen", original: "Orig.",
    unitTitle: "Dieses Modell wird gelesen als", unitText: "STL- und OBJ-Dateien speichern keine Einheit, wir lesen sie daher als Millimeter - diese Datei wurde wahrscheinlich anders gespeichert.",
    unitRead: "Lesen in", unitClose: "Wenn keiner dieser Werte passt, stellen Sie die Größe oben über den Druckmaßstab ein." },
};


/** Gabaryt z centymetrow na milimetry, bo klient wpisuje i czyta milimetry. */
function skalujDoMm(bboxCm) {
  return { x: bboxCm.x * 10, y: bboxCm.y * 10, z: bboxCm.z * 10 };
}

/** "40.0 x 30.0 x 12.5 mm" z gabarytu w centymetrach i skali osi. */
function opisWymiarow(bboxCm, scale) {
  const d = dimsFor(bboxCm, scale);
  return `${(d.x * 10).toFixed(1)} × ${(d.y * 10).toFixed(1)} × ${(d.z * 10).toFixed(1)} mm`;
}

function STLUploadCard({ stlData, stlFileName, scale, onScaleChange, onUpload, onRemove, lang, buildVolCm = BUILD_VOL_CM, sizePresets = SIZE_PRESETS,
  sync = true, onSyncChange = () => {}, zapamietana = null, onZapamietanaChange = null }) {
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
            <div className="text-xs text-neutral-400">{sl.dropSub}</div>
          </div>
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT_MODEL} className="hidden" onChange={onUpload} />
        <div className="text-xs text-neutral-400">{sl.orManual}</div>
      </div>
    );
  }

  const b = stlData.bbox;
  const rawMaxCm = Math.max(b.x, b.y, b.z);
  // Granice pola roboczego liczy `maxScaleForBuildVolume`, ten sam kod, ktorym
  // serwer odmawia wyceny za duzego modelu. Osobny wzor tutaj znaczylby, ze
  // kalkulator pokazuje skale, ktora kwota wiazaca odrzuci.
  const fitScale = maxScaleForBuildVolume(b, buildVolCm);
  const fitFloor = Math.floor(fitScale * 10000) / 10000;
  // Skala jest teraz OSOBNA DLA KAZDEJ OSI. Przyciski gotowych rozmiarow dalej
  // pracuja na jednej liczbie, wiec pytamy, czy osie stoja razem; gdy sie
  // rozjada, zaden preset nie jest "wybrany" i tak to pokazujemy.
  const uni = isUniform(scale) ? Number(scale.x) : null;
  const scaledB = dimsFor(b, scale);
  const exceeds = !fitsBox(b, scale, buildVolCm);
  // Objetosc rosnie ILOCZYNEM osi, nie szescianem jednej z nich. Przy
  // splaszczonym modelu roznica to cala cena filamentu.
  const scaledVol = stlData.volumeCm3 * volumeFactor(scale);

  // Zgadujemy jednostke tylko z odczytu SUROWEGO (bez skali uzytkownika),
  // bo o niej wlasnie chodzi: czy plik przyszedl w metrach albo centymetrach
  // zamiast w milimetrach. Patrz src/pricing/meshUnits.js.
  const unitOptions = looksTooSmall(rawMaxCm) ? suspectUnits(rawMaxCm) : [];

  return (
    <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-blue-300 truncate max-w-[70%]">{stlFileName}</div>
        <button onClick={onRemove} className="text-neutral-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
          <X className="w-3.5 h-3.5" />{sl.remove}
        </button>
      </div>
      <Suspense fallback={<div className="w-full rounded-lg bg-[#eef0f3] border border-black/10 animate-pulse" style={{ height: "220px" }} />}>
        <STLViewer triangles={stlData.triangles} bbox={stlData.bbox} scale={scale} />
      </Suspense>
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div><div className="text-neutral-400">{sl.volume}</div><div className="font-bold">{scaledVol.toFixed(1)} cm³</div></div>
        <div><div className="text-neutral-400">{sl.dims}</div><div className="font-bold">{(scaledB.x*10).toFixed(1)}×{(scaledB.y*10).toFixed(1)}×{(scaledB.z*10).toFixed(1)} mm</div></div>
        <div><div className="text-neutral-400">{sl.triangles}</div><div className="font-bold">{stlData.triangleCount.toLocaleString()}</div></div>
      </div>

      {/* Model odczytany jako nieprawdopodobnie maly: najczesciej plik zapisano
          w metrach albo centymetrach, a odczytujemy go jako milimetry. */}
      {unitOptions.length > 0 && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <h4 className="text-xs font-semibold text-amber-200">{sl.unitTitle} {rawMaxCm.toFixed(1)} cm</h4>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-2">{sl.unitText}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {unitOptions.map((u) => (
              <button
                key={u.id}
                onClick={() => onScaleChange(uniformScale(u.factor))}
                className="px-2 py-1.5 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors"
              >
                {sl.unitRead} {t(u.label, lang)} ({u.correctedCm.toFixed(1)} cm)
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">{sl.unitClose}</p>
        </div>
      )}

      {/* Scale controls */}
      <div className="border-t border-white/5 pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">{sl.scale}</span>
          <span className="font-bold text-blue-300">{uni == null ? "×–" : uni === 1 ? "1:1" : `×${uni.toFixed(2)}`}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sizePresets.map(p => {
            const s = Math.floor(Math.min(p.maxCm / rawMaxCm, fitScale) * 10000) / 10000;
            const isActive = uni != null && Math.abs(uni - s) < 0.005;
            const disabled = p.maxCm / rawMaxCm > fitScale * 1.001;
            return (
              <button key={p.id} onClick={() => onScaleChange(uniformScale(s))} disabled={disabled}
                className={`px-2 py-1 rounded text-xs border transition-colors ${
                  isActive ? "border-blue-400 bg-blue-400/10 text-blue-300" :
                  disabled ? "border-white/5 text-neutral-700 cursor-not-allowed" :
                  "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                }`}>
                {p.id}
              </button>
            );
          })}
          <button onClick={() => onScaleChange(uniformScale(1))}
            className={`px-2 py-1 rounded text-xs border transition-colors ${
              uni != null && Math.abs(uni - 1) < 0.005 ? "border-blue-400 bg-blue-400/10 text-blue-300" : "border-white/10 text-neutral-400 hover:border-white/20"
            }`}>{sl.original}</button>
          {fitFloor < 0.999 && (
            <button onClick={() => onScaleChange(uniformScale(fitFloor))}
              className={`px-2 py-1 rounded text-xs border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-colors ${
                uni != null && Math.abs(uni - fitFloor) < 0.005 ? "bg-amber-400/10" : ""
              }`}>{sl.fitToPlate}</button>
          )}
        </div>

        {/* Wymiary osobno dla kazdej osi. Pole robocze podajemy w milimetrach,
            bo w nich klient wpisuje wymiar. */}
        <DimensionBox
          bboxMm={{ x: b.x * 10, y: b.y * 10, z: b.z * 10 }}
          scale={scale}
          onChange={onScaleChange}
          sync={sync}
          onSyncChange={onSyncChange}
          zapamietana={zapamietana}
          onZapamietanaChange={onZapamietanaChange}
          limitsMm={{ x: buildVolCm.x * 10, y: buildVolCm.y * 10, z: buildVolCm.z * 10 }}
          lang={lang}
        />
      </div>

      {exceeds && (
        <div className="flex items-center gap-1.5 text-amber-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {sl.exceeds} ({(buildVolCm.x*10).toFixed(0)}×{(buildVolCm.y*10).toFixed(0)}×{(buildVolCm.z*10).toFixed(0)} mm)
        </div>
      )}
    </div>
  );
}

const TECH_LABEL = { pl: "Druk 3D", en: "3D Print", de: "3D-Druck" };
const TECH_LABEL_MSLA = { pl: "Druk żywiczny MSLA", en: "MSLA Resin Print", de: "MSLA-Harzdruck" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stueckzahl" };

/** Opisy obu uslug wspolne ze sklepem: stad biora sie pytania i stan startowy. */
const USLUGI = { fdm: getService("print_fdm"), msla: getService("print_msla") };

export default function Print3DCalc({ lang = "pl", initialTech = "fdm", handoff = null, onHandoffUsed = null }) {
  const l = LBL[lang] || LBL.en;
  const sl = STL_LBL[lang] || STL_LBL.en;
  const ml = MSLA_LBL[lang] || MSLA_LBL.en;
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  const [tech, setTech] = useState(initialTech);

  // ---- FDM state ----
  // STAN POCZATKOWY OBU USLUG IDZIE Z KATALOGU, tego samego, ktory czyta
  // karta uslugi. Kazda technologia ma wlasny zestaw, zeby przelaczenie nie
  // kasowalo tego, co klient ustawil po drugiej stronie.
  const [fdmParams, setFdmParams] = useState(() => ({ ...USLUGI.fdm.defaults }));
  const [mslaParams, setMslaParams] = useState(() => ({ ...USLUGI.msla.defaults }));
  // Wybor spoza listy przystawiamy w RENDERZE ta sama funkcja, ktorej uzywa
  // sklep: material musi nalezec do segmentu, a zywica do swojego rodzaju.
  const poprawkiFdm = poprawkiWyboru(USLUGI.fdm, fdmParams);
  if (poprawkiFdm) setFdmParams((x) => ({ ...x, ...poprawkiFdm }));
  const poprawkiMsla = poprawkiWyboru(USLUGI.msla, mslaParams);
  if (poprawkiMsla) setMslaParams((x) => ({ ...x, ...poprawkiMsla }));
  const { segment, materialKey, sizeId, infillId, colorId, precisionId } = { ...fdmParams, ...poprawkiFdm };
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty), zeby chipsy i
  // licznik nigdy nie pokazaly sprzecznych wartosci.
  const [fdmQty, setFdmQty] = useState(1);
  const quantityId = tierForQty(fdmQty, QUANTITY_TIERS).id;
  const [stlData, setStlData] = useState(null);
  const [stlFile, setStlFile] = useState(null);
  const [stlFileName, setStlFileName] = useState("");
  // SKALA JEST TERAZ OSOBNA DLA KAZDEJ OSI. `sync` decyduje, czy ruch jednej
  // ciagnie pozostale, a `zapamietana` trzyma punkt, do ktorego wracamy po
  // ponownym wlaczeniu synchronizacji.
  const [stlScale, setStlScale] = useState(() => uniformScale(1));
  const [stlSync, setStlSync] = useState(true);
  const [stlZapamietana, setStlZapamietana] = useState(null);

  // ---- MSLA state ----
  const { applicationId, resinSegmentId, resinKey, layerId, sizeId: mslaSizeId } = { ...mslaParams, ...poprawkiMsla };
  // Kolor jest PREFERENCJA, nie parametrem wyceny: nie wchodzi do kwoty, wiec
  // nie stoi w katalogu razem z pytaniami, ktore o kwocie decyduja.
  const [resinColor, setResinColor] = useState("");
  const [mslaQty, setMslaQty] = useState(1);
  const mslaQuantityId = tierForQty(mslaQty, QUANTITY_TIERS).id;

  /** Zapis pola, osobny dla kazdej technologii. */
  const setParam = (klucz, wartosc) => {
    if (tech === "msla") {
      if (klucz === "quantityId") { setMslaQty(qtyForTier(wartosc, QUANTITY_TIERS)); return; }
      // Zmiana zywicy kasuje kolor: paleta zalezy od zywicy, wiec kolor
      // wybrany przy poprzedniej moglby przy nowej nie istniec.
      if (klucz === "resinKey") setResinColor("");
      // Zastosowanie PODPOWIADA rodzaj zywicy, a nie tylko go ogranicza:
      // wzorzec odlewniczy wymaga precyzyjnych, figurka zaczyna od
      // standardowych. Samo `optionsFrom` przystawiloby tylko odlew.
      if (klucz === "applicationId") {
        const podpowiedz = wartosc === "casting" ? "precision" : wartosc === "figurine" ? "standard" : null;
        setMslaParams((x) => ({ ...x, applicationId: wartosc, ...(podpowiedz ? { resinSegmentId: podpowiedz } : {}) }));
        return;
      }
      setMslaParams((x) => ({ ...x, [klucz]: wartosc }));
      return;
    }
    if (klucz === "quantityId") { setFdmQty(qtyForTier(wartosc, QUANTITY_TIERS)); return; }
    setFdmParams((x) => ({ ...x, [klucz]: wartosc }));
  };

  async function handleSTLUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const { parseMeshAsync } = await import("../../pricing/mesh.js");
    const data = await parseMeshAsync(buffer, file.name);
    setStlData(data);
    setStlFile(file);
    setStlFileName(file.name);
    setStlScale(uniformScale(1));
  }

  function handleSTLRemove() {
    setStlData(null);
    setStlFile(null);
    setStlFileName("");
    setStlScale(uniformScale(1));
  }

  // PRZEJECIE PLIKU Z SZYBKIEJ WYCENY. Klient wgral go raz i ustawil
  // wielkosc; kazanie mu powtorzyc obie te czynnosci po skorzystaniu z naszej
  // wlasnej rady bylo kara za posluchanie. Siatka jest juz sparsowana, wiec
  // nie czytamy pliku drugi raz.
  useEffect(() => {
    if (!handoff?.data) return;
    setStlData(handoff.data);
    setStlFile(handoff.file || null);
    setStlFileName(handoff.name || "");
    setStlScale(parseScale(handoff.scale || 1));
    onHandoffUsed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff]);

  // Wynik bramki drukowalnosci. Jedzie do koszyka w `params`, wiec trafia
  // do zamowienia i do maili bez osobnej sciezki.
  const [fdmPrint, setFdmPrint] = useState(null);
  const [mslaPrint, setMslaPrint] = useState(null);

  const scaledStlData = useMemo(() => {
    if (!stlData || isUniform(stlScale) && Number(stlScale.x) === 1) return stlData;
    // Objetosc rosnie ILOCZYNEM osi. Przy skali rownomiernej wychodzi z tego
    // stare `s^3`, wiec nie ma dwoch wzorow do rozjechania.
    return {
      ...stlData,
      volumeCm3: stlData.volumeCm3 * volumeFactor(stlScale),
      bbox: dimsFor(stlData.bbox, stlScale),
    };
  }, [stlData, stlScale]);

  const result = useMemo(() => calculate({ segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, qty: fdmQty, stlData: scaledStlData }, lang),
    [segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, fdmQty, scaledStlData, lang]);

  const mslaResult = useMemo(() => calculateMSLA({ applicationId, resinKey, layerId, sizeId: mslaSizeId, quantityId: mslaQuantityId, qty: mslaQty, stlData: scaledStlData }, lang),
    [applicationId, resinKey, layerId, mslaSizeId, mslaQuantityId, mslaQty, scaledStlData, lang]);

  const selectedResin = getResin(resinKey);

  const stlSummary = stlData
    ? `STL: ${stlFileName} (${(stlData.volumeCm3 * volumeFactor(stlScale)).toFixed(1)} cm³, ${opisWymiarow(stlData.bbox, stlScale)})`
    : null;

  const isFigurine = applicationId === "figurine";

  if (tech === "msla") {
    const mslaParamsSummary = [
      t(APPLICATIONS.find(a => a.id === applicationId)?.label, lang),
      t(selectedResin?.label, lang),
      ...(selectedResin?.colorable && resinColor ? [`${ml.color}: ${resinColor}`] : []),
      t(LAYER_HEIGHTS.find(ly => ly.id === layerId)?.label, lang),
      stlSummary || t(MSLA_SIZES.find(s => s.id === mslaSizeId)?.label, lang),
      t(QUANTITY_TIERS.find(q => q.id === mslaQuantityId)?.label, lang),
    ].join(" | ");

    return (
      <div>
        <div className="text-center text-xs text-neutral-400 mb-6">Elegoo Saturn 4 Ultra 16K · 218×123×250 mm · 14µm piksel</div>

        <CalcCard stepNum="①" label={t(TECH_SWITCH_LBL, lang)}>
          <HeroCards options={TECHS} value={tech} onChange={setTech} lang={lang} cols="grid-cols-2" minH={170} />
        </CalcCard>

        <PolaUslugi
          service={USLUGI.msla}
          params={{ ...mslaParams, ...poprawkiMsla, quantityId: mslaQuantityId }}
          setParam={setParam}
          lang={lang}
          wyglad="kalkulator"
          pierwszyNumer={2}
          tierKey="quantityId"
          qty={mslaQty}
          onQty={setMslaQty}
          qtyMax={qtyLimit(QUANTITY_TIERS)}
          qtyOpen={qtyOpenValue(QUANTITY_TIERS)}
          qtyLabel={t(QTY_STEPPER_LBL, lang)}
          wstawki={[
            // Ostrzezenie licencyjne dotyczy figurek, a nie wyceny, wiec nie
            // jest pytaniem: stoi jako kartka miedzy zywica a warstwa.
            { po: "resinKey", label: null, render: () => (isFigurine ? <LicenseNotice lang={lang} /> : null) },
          ]}
          dodatki={{
            // Kolor jest preferencja do zywicy, wiec stoi pod nia, a nie
            // w osobnym kroku z wlasnym numerem.
            resinKey: {
              po: () => (selectedResin?.colorable ? (
                <div className="mt-3">
                  <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">{ml.color}</div>
                  <select value={resinColor} onChange={(e) => setResinColor(e.target.value)}
                    aria-label={ml.color}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-colors">
                    <option value="">{ml.colorDefault}</option>
                    {RESIN_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : null),
            },
            // Wgrany model zastepuje wybor rozmiaru z listy i przejmuje
            // etykiete kartki: to ta sama odpowiedz, tylko zmierzona.
            sizeId: {
              id: "file-upload",
              etykieta: stlData ? sl.stlSize : null,
              ukryjWarianty: Boolean(stlData),
              przed: () => (
                <STLUploadCard stlData={stlData} stlFileName={stlFileName} scale={stlScale} onScaleChange={setStlScale}
                  sync={stlSync} onSyncChange={setStlSync} zapamietana={stlZapamietana} onZapamietanaChange={setStlZapamietana}
                  onUpload={handleSTLUpload} onRemove={handleSTLRemove} lang={lang}
                  buildVolCm={MSLA_BUILD_VOL_CM} sizePresets={MSLA_SIZE_PRESETS} />
              ),
            },
          }}
        />

        <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
          <ResultHeader lang={lang} binding={bindingGrosze != null} />
          <ResultDisplay result={mslaResult} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
          <PrintabilityGate
            triangles={stlData?.triangles || null}
            tech="msla"
            lang={lang}
            fileName={stlFileName || null}
            scale={serializeScale(stlScale)}
            onResult={setMslaPrint}
          />
          <NextStepPanel
            lang={lang}
            tech="msla"
            techLabel={t(TECH_LABEL_MSLA, lang)}
            paramsSummary={mslaParamsSummary}
            result={mslaResult}
            printability={mslaPrint}
            fileScale={serializeScale(stlScale)}
            preAttachedFile={stlFile}
            requireLicenseConsent={isFigurine}
            cart={
              <CalcToCart
                embedded
                onBinding={setBindingGrosze}
                calculator="print3d_msla"
                serviceId="print_msla"
                params={{ applicationId, resinKey, layerId, sizeId: mslaSizeId, quantityId: mslaQuantityId, printability: mslaPrint,
                  ...(stlData ? { wymiary: describeDims(skalujDoMm(stlData.bbox), stlScale), znieksztalcony: !isUniform(stlScale) } : {}) }}
                qty={mslaQty}
                file={stlFile}
                triangles={stlData?.triangles || null}
                scale={serializeScale(stlScale)}
                lang={lang}
                hold={Boolean(mslaPrint?.blocked && !mslaPrint?.accepted)}
              />
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center text-xs text-neutral-400 mb-6">Bambu Lab H2D · 300×320×325 mm · Dual Extruder · AMS 2 Pro</div>

      <CalcCard stepNum="①" label={t(TECH_SWITCH_LBL, lang)}>
        <HeroCards options={TECHS} value={tech} onChange={setTech} lang={lang} cols="grid-cols-2" minH={170} />
      </CalcCard>

      <PolaUslugi
        service={USLUGI.fdm}
        params={{ ...fdmParams, ...poprawkiFdm, quantityId }}
        setParam={setParam}
        lang={lang}
        wyglad="kalkulator"
        pierwszyNumer={2}
        tierKey="quantityId"
        qty={fdmQty}
        onQty={setFdmQty}
        qtyMax={qtyLimit(QUANTITY_TIERS)}
        qtyOpen={qtyOpenValue(QUANTITY_TIERS)}
        qtyLabel={t(QTY_STEPPER_LBL, lang)}
        dodatki={{
          sizeId: {
            id: "file-upload",
            etykieta: stlData ? sl.stlSize : null,
            ukryjWarianty: Boolean(stlData),
            przed: () => (
              <STLUploadCard stlData={stlData} stlFileName={stlFileName} scale={stlScale} onScaleChange={setStlScale}
                onUpload={handleSTLUpload} onRemove={handleSTLRemove} lang={lang}
                sync={stlSync} onSyncChange={setStlSync} zapamietana={stlZapamietana} onZapamietanaChange={setStlZapamietana} />
            ),
          },
        }}
      />

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        {/* Siatke podajemy w oryginale, a skale osobno: bramka skaluje ja sama
            przed analiza. `scaledStlData` przelicza tylko objetosc i gabaryt,
            wiec podane stad trojkaty mialy wymiary sprzed zmniejszenia. */}
        <PrintabilityGate
          triangles={stlData?.triangles || null}
          tech="fdm"
          nozzleId={nozzleFromPrecision(precisionId)}
          lang={lang}
          fileName={stlFileName || null}
          scale={serializeScale(stlScale)}
          onResult={setFdmPrint}
        />
        <NextStepPanel
          lang={lang}
          tech="3dprint"
          printability={fdmPrint}
          fileScale={serializeScale(stlScale)}
          techLabel={t(TECH_LABEL, lang)}
          paramsSummary={[
            `${FILAMENTS[segment].label}: ${materialKey}`,
            stlSummary || t(SIZES.find(s => s.id === sizeId)?.label, lang),
            t(INFILL_OPTIONS.find(i => i.id === infillId)?.label, lang),
            t(COLORS.find(c => c.id === colorId)?.label, lang),
            t(PRECISION.find(p => p.id === precisionId)?.label, lang),
            t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
          ].join(" | ")}
          result={result}
          preAttachedFile={stlFile}
          cart={
            <CalcToCart
              embedded
              onBinding={setBindingGrosze}
              calculator="print3d_fdm"
              serviceId="print_fdm"
              params={{ segment, materialKey, sizeId, infillId, colorId, precisionId, quantityId, printability: fdmPrint,
                ...(stlData ? { wymiary: describeDims(skalujDoMm(stlData.bbox), stlScale), znieksztalcony: !isUniform(stlScale) } : {}) }}
              qty={fdmQty}
              file={stlFile}
              triangles={stlData?.triangles || null}
              scale={serializeScale(stlScale)}
              lang={lang}
              hold={Boolean(fdmPrint?.blocked && !fdmPrint?.accepted)}
            />
          }
        />
      </div>
    </div>
  );
}
