import { useRef, useMemo, useEffect } from "react";
import VectorPreview from "./VectorPreview.jsx";
import DimensionBox from "./DimensionBox.jsx";
import { uniformScale, isUniform, dimsFor, fitsBox, AXES_2D } from "../../utils/dimScale.js";
import { Upload, X, AlertTriangle } from "lucide-react";

export const SVG_LBL = {
  pl: { upload: "Załaduj plik SVG", orManual: "lub wybierz parametry ręcznie poniżej",
    dropHint: "Kliknij lub przeciągnij plik SVG", dropSub: "Automatyczna wycena na podstawie wymiarów i ścieżek",
    dims: "Wymiary", area: "Powierzchnia", pathLen: "Długość ścieżek", paths: "Ścieżki",
    remove: "Usuń", exceeds: "Projekt przekracza pole robocze", fromSvg: "Parametry z pliku SVG",
    scale: "Skala", fitToArea: "Dopasuj do pola", fitToExt: "Dopasuj do XL" },
  en: { upload: "Upload SVG file", orManual: "or select parameters manually below",
    dropHint: "Click or drag & drop an SVG file", dropSub: "Auto-quote based on dimensions and paths",
    dims: "Dimensions", area: "Area", pathLen: "Path length", paths: "Paths",
    remove: "Remove", exceeds: "Design exceeds work area", fromSvg: "Parameters from SVG file",
    scale: "Scale", fitToArea: "Fit to area", fitToExt: "Fit to XL" },
  de: { upload: "SVG-Datei hochladen", orManual: "oder Parameter unten manuell wählen",
    dropHint: "Klicken oder SVG-Datei hierher ziehen", dropSub: "Automatische Kalkulation anhand von Maßen und Pfaden",
    dims: "Abmessungen", area: "Fläche", pathLen: "Pfadlänge", paths: "Pfade",
    remove: "Entfernen", exceeds: "Design überschreitet Arbeitsbereich", fromSvg: "Parameter aus SVG-Datei",
    scale: "Maßstab", fitToArea: "An Bereich anpassen", fitToExt: "An XL anpassen" },
};

const SCALE_STEPS_DOWN = [0.25, 0.5, 0.75, 1];
const SCALE_STEPS_UP = [1.25, 1.5, 2, 3];

export default function SVGUploadCard({ svgData, svgFileName, scale, onScaleChange, onUpload, onRemove, workAreaMm, extendedAreaMm, showPathLength, lang,
  sync = true, onSyncChange = () => {}, zapamietana = null, onZapamietanaChange = null, scaledData = null }) {
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  const fileRef = useRef(null);

  const fitScaleRaw = svgData && workAreaMm
    ? Math.min(workAreaMm.x / svgData.bboxMm.x, workAreaMm.y / svgData.bboxMm.y)
    : 1;
  const fitFloor = Math.floor(fitScaleRaw * 10000) / 10000;

  const fitExtendedRaw = svgData && extendedAreaMm
    ? Math.min(extendedAreaMm.x / svgData.bboxMm.x, extendedAreaMm.y / svgData.bboxMm.y)
    : 0;
  const fitExtendedFloor = Math.floor(fitExtendedRaw * 10000) / 10000;
  const maxAllowedScale = extendedAreaMm ? fitExtendedFloor : fitFloor;

  // Rysunek ma DWIE osie i skale osobna dla kazdej. Przyciski procentowe dalej
  // pracuja na jednej liczbie, wiec pytamy, czy osie stoja razem.
  const uni = isUniform(scale) ? Number(scale.x) : null;
  const scaledBbox = svgData ? dimsFor(svgData.bboxMm, scale) : null;
  const maxAreaForExceeds = extendedAreaMm || workAreaMm;
  const exceeds = svgData && maxAreaForExceeds && !fitsBox(svgData.bboxMm, scale, maxAreaForExceeds);

  const blobUrl = useMemo(() => {
    if (!svgData?.svgText) return null;
    return URL.createObjectURL(new Blob([svgData.svgText], { type: "image/svg+xml" }));
  }, [svgData?.svgText]);

  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  if (!svgData) {
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
        <input ref={fileRef} type="file" accept=".svg" className="hidden" onChange={onUpload} />
        <div className="text-[10px] text-neutral-400">{sl.orManual}</div>
      </div>
    );
  }

  // Pole rosnie iloczynem osi. Dlugosc sciezki NIE mnozy sie przez jedna
  // liczbe, gdy osie sie rozjada (kolo staje sie elipsa), wiec bierzemy ja
  // z ponownego pomiaru, ktory robi kalkulator. Brak pomiaru pokazujemy
  // kreska zamiast liczby wzietej z powietrza.
  const scaledAreaCm2 = svgData.engravAreaCm2 * Number(scale.x) * Number(scale.y);
  const scaledPathCm = scaledData ? scaledData.pathLengthCm : (uni != null ? svgData.pathLengthCm * uni : null);
  const cols = showPathLength ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-blue-300 truncate max-w-[70%]">{svgFileName}</div>
        <button onClick={onRemove} className="text-neutral-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
          <X className="w-3.5 h-3.5" />{sl.remove}
        </button>
      </div>
      <VectorPreview
        src={blobUrl}
        contentBox={svgData?.contentBox || null}
        canvasBox={svgData?.canvasBox || null}
        lang={lang}
        height={180}
        stretch={{ x: Number(scale.x), y: Number(scale.y) }}
      />
      <div className={`grid ${cols} gap-3 text-center text-[11px]`}>
        <div><div className="text-neutral-400">{sl.dims}</div><div className="font-bold">{scaledBbox.x.toFixed(1)}×{scaledBbox.y.toFixed(1)} mm</div></div>
        <div><div className="text-neutral-400">{sl.area}</div><div className="font-bold">{scaledAreaCm2.toFixed(1)} cm²</div></div>
        {showPathLength && <div><div className="text-neutral-400">{sl.pathLen}</div><div className="font-bold">{scaledPathCm == null ? "-" : `${scaledPathCm.toFixed(0)} cm`}</div></div>}
        <div><div className="text-neutral-400">{sl.paths}</div><div className="font-bold">{svgData.pathCount}</div></div>
      </div>

      {/* Scale controls */}
      <div className="border-t border-white/5 pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">{sl.scale}</span>
          <span className="font-bold text-blue-300">{uni == null ? "-" : `${Math.round(uni * 100)}%`}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SCALE_STEPS_DOWN.map(p => (
            <button key={p} onClick={() => onScaleChange(uniformScale(p, AXES_2D))}
              className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                uni != null && Math.abs(uni - p) < 0.005
                  ? "border-blue-400 bg-blue-400/10 text-blue-300"
                  : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}>
              {Math.round(p * 100)}%
            </button>
          ))}
          {extendedAreaMm && SCALE_STEPS_UP.map(p => {
            const disabled = p > maxAllowedScale + 0.001;
            return (
              <button key={p} onClick={() => !disabled && onScaleChange(uniformScale(p, AXES_2D))} disabled={disabled}
                className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                  uni != null && Math.abs(uni - p) < 0.005 ? "border-blue-400 bg-blue-400/10 text-blue-300" :
                  disabled ? "border-white/5 text-neutral-700 cursor-not-allowed" :
                  "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                }`}>
                {Math.round(p * 100)}%
              </button>
            );
          })}
          {fitFloor < 0.999 && (
            <button onClick={() => onScaleChange(uniformScale(fitFloor, AXES_2D))}
              className={`px-2 py-1 rounded text-[10px] border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-colors ${
                uni != null && Math.abs(uni - fitFloor) < 0.005 ? "bg-amber-400/10" : ""
              }`}>{sl.fitToArea}</button>
          )}
          {extendedAreaMm && fitExtendedFloor > 1.001 && (
            <button onClick={() => onScaleChange(uniformScale(fitExtendedFloor, AXES_2D))}
              className={`px-2 py-1 rounded text-[10px] border border-purple-400/30 text-purple-300 hover:bg-purple-400/10 transition-colors ${
                uni != null && Math.abs(uni - fitExtendedFloor) < 0.005 ? "bg-purple-400/10" : ""
              }`}>{sl.fitToExt}</button>
          )}
        </div>

        {/* Wymiary rysunku osobno w X i Y. Rysunek jest plaski, wiec osi Z tu
            nie ma i nie udajemy, ze jest. */}
        <DimensionBox
          bboxMm={svgData.bboxMm}
          scale={scale}
          onChange={onScaleChange}
          sync={sync}
          onSyncChange={onSyncChange}
          zapamietana={zapamietana}
          onZapamietanaChange={onZapamietanaChange}
          limitsMm={extendedAreaMm || workAreaMm || null}
          lang={lang}
        />
      </div>

      {/* Ostrzezenie o polu roboczym stoi w `DimensionBox` razem z przyciskiem
          "Dopasuj do pola", wiec druga kopia tutaj tylko dublowala komunikat. */}
    </div>
  );
}
