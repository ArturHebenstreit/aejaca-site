import { useRef, useMemo, useEffect } from "react";
import { Upload, X, AlertTriangle } from "lucide-react";

export const SVG_LBL = {
  pl: { upload: "Załaduj plik SVG", orManual: "lub wybierz parametry ręcznie poniżej",
    dims: "Wymiary", area: "Powierzchnia", pathLen: "Długość ścieżek", paths: "Ścieżki",
    remove: "Usuń", exceeds: "Projekt przekracza pole robocze", fromSvg: "Parametry z pliku SVG" },
  en: { upload: "Upload SVG file", orManual: "or select parameters manually below",
    dims: "Dimensions", area: "Area", pathLen: "Path length", paths: "Paths",
    remove: "Remove", exceeds: "Design exceeds work area", fromSvg: "Parameters from SVG file" },
  de: { upload: "SVG-Datei hochladen", orManual: "oder Parameter unten manuell wählen",
    dims: "Abmessungen", area: "Fläche", pathLen: "Pfadlänge", paths: "Pfade",
    remove: "Entfernen", exceeds: "Design überschreitet Arbeitsbereich", fromSvg: "Parameter aus SVG-Datei" },
};

export default function SVGUploadCard({ svgData, svgFileName, onUpload, onRemove, workAreaMm, showPathLength, lang }) {
  const sl = SVG_LBL[lang] || SVG_LBL.en;
  const fileRef = useRef(null);
  const exceeds = svgData && workAreaMm && (svgData.bboxMm.x > workAreaMm.x || svgData.bboxMm.y > workAreaMm.y);

  const blobUrl = useMemo(() => {
    if (!svgData?.svgText) return null;
    return URL.createObjectURL(new Blob([svgData.svgText], { type: "image/svg+xml" }));
  }, [svgData?.svgText]);

  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  if (!svgData) {
    return (
      <div className="flex flex-col items-center gap-2 mb-3">
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-blue-400/30 bg-blue-400/[0.03] text-blue-300 text-sm hover:bg-blue-400/10 hover:border-blue-400/50 transition-all w-full justify-center">
          <Upload className="w-4 h-4" />
          {sl.upload}
        </button>
        <input ref={fileRef} type="file" accept=".svg" className="hidden" onChange={onUpload} />
        <div className="text-[10px] text-neutral-600">{sl.orManual}</div>
      </div>
    );
  }

  const b = svgData.bboxMm;
  const cols = showPathLength ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-blue-300 truncate max-w-[70%]">{svgFileName}</div>
        <button onClick={onRemove} className="text-neutral-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
          <X className="w-3.5 h-3.5" />{sl.remove}
        </button>
      </div>
      <div className="w-full rounded-lg overflow-hidden bg-[#0c1222] border border-white/5 flex items-center justify-center" style={{ height: "160px" }}>
        <img src={blobUrl} alt="SVG" className="max-w-full max-h-full p-3 opacity-90" style={{ filter: "invert(1) hue-rotate(180deg)" }} />
      </div>
      <div className={`grid ${cols} gap-3 text-center text-[11px]`}>
        <div><div className="text-neutral-500">{sl.dims}</div><div className="font-bold">{b.x.toFixed(1)}×{b.y.toFixed(1)} mm</div></div>
        <div><div className="text-neutral-500">{sl.area}</div><div className="font-bold">{svgData.engravAreaCm2.toFixed(1)} cm²</div></div>
        {showPathLength && <div><div className="text-neutral-500">{sl.pathLen}</div><div className="font-bold">{svgData.pathLengthCm.toFixed(0)} cm</div></div>}
        <div><div className="text-neutral-500">{sl.paths}</div><div className="font-bold">{svgData.pathCount}</div></div>
      </div>
      {exceeds && (
        <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{sl.exceeds} ({workAreaMm.x}×{workAreaMm.y} mm)
        </div>
      )}
    </div>
  );
}
