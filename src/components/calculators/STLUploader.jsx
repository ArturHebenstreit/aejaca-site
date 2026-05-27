import { useRef, useState, useCallback } from "react";
import { Upload, FileX, Box } from "lucide-react";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

const LABELS = {
  drop: { pl: "Przeciągnij plik .STL lub kliknij", en: "Drag .STL file or click", de: ".STL-Datei hierher ziehen oder klicken" },
  parsing: { pl: "Analizowanie pliku…", en: "Parsing file…", de: "Datei wird analysiert…" },
  remove: { pl: "Usuń plik", en: "Remove file", de: "Datei entfernen" },
  dims: { pl: "Wymiary z pliku", en: "Dimensions from file", de: "Abmessungen aus Datei" },
  volume: { pl: "Objętość", en: "Volume", de: "Volumen" },
  note: { pl: "Parametry kalkulatora są wytyczną zamówienia", en: "Calculator parameters define the order specification", de: "Rechnerparameter definieren die Bestellvorgabe" },
  errFormat: { pl: "Nieprawidłowy format pliku. Wymagany .stl", en: "Invalid file format. .stl required", de: "Ungültiges Dateiformat. .stl erforderlich" },
};

export default function STLUploader({ onFile, lang = "pl" }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const t = (obj) => obj[lang] || obj.pl;

  async function parseSTL(arrayBuffer) {
    return new Promise((resolve, reject) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(arrayBuffer);
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox;
        const dims = {
          x: parseFloat((bb.max.x - bb.min.x).toFixed(1)),
          y: parseFloat((bb.max.y - bb.min.y).toFixed(1)),
          z: parseFloat((bb.max.z - bb.min.z).toFixed(1)),
        };
        // Signed volume calculation from mesh triangles
        const pos = geometry.attributes.position;
        let volume = 0;
        for (let i = 0; i < pos.count; i += 3) {
          const v1 = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
          const v2 = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
          const v3 = new THREE.Vector3(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
          volume += v1.dot(v2.clone().cross(v3)) / 6;
        }
        const volumeCm3 = Math.abs(parseFloat((volume / 1000).toFixed(2)));
        resolve({ dims, volumeCm3 });
      } catch (e) { reject(e); }
    });
  }

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".stl")) {
      setError(t(LABELS.errFormat));
      return;
    }
    setError(null);
    setParsing(true);
    try {
      const ab = await f.arrayBuffer();
      const { dims, volumeCm3 } = await parseSTL(ab);
      const result = {
        filename: f.name,
        sizeBytes: f.size,
        dims,
        volumeCm3,
        file: f,
      };
      setFile(result);
      onFile(result);
    } catch {
      setError("Błąd parsowania pliku STL");
    } finally {
      setParsing(false);
    }
  }, [lang, onFile]);

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }

  function onInputChange(e) {
    handleFile(e.target.files[0]);
  }

  function removeFile() {
    setFile(null);
    onFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Box className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{file.filename}</span>
            <span className="text-xs text-neutral-500 shrink-0">({(file.sizeBytes / 1024).toFixed(0)} KB)</span>
          </div>
          <button onClick={removeFile} className="text-neutral-500 hover:text-red-400 transition-colors shrink-0" title={t(LABELS.remove)}>
            <FileX className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
          <span className="text-amber-400/80">{t(LABELS.dims)}:</span>
          <span className="text-white font-medium">{file.dims.x} × {file.dims.y} × {file.dims.z} mm</span>
          <span className="text-amber-400/80">{t(LABELS.volume)}:</span>
          <span className="text-white font-medium">~{file.volumeCm3} cm³</span>
        </div>
        <p className="text-[11px] text-neutral-600 italic">ℹ {t(LABELS.note)}</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
        dragging
          ? "border-amber-400 bg-amber-400/10"
          : "border-white/20 hover:border-amber-400/40 hover:bg-amber-400/[0.02]"
      }`}
    >
      <input ref={inputRef} type="file" accept=".stl" className="hidden" onChange={onInputChange} />
      {parsing ? (
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <div className="w-6 h-6 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs">{t(LABELS.parsing)}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-neutral-500" />
          <span className="text-sm text-neutral-400">{t(LABELS.drop)}</span>
          <span className="text-xs text-neutral-600">.STL — maks. 50 MB</span>
          {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
        </div>
      )}
    </div>
  );
}
