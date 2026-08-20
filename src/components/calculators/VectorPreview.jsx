// ============================================================
// PODGLAD RYSUNKU: pokazuje rysunek, a nie arkusz, na ktorym leży
// ============================================================
// Rysunek do lasera bardzo czesto jest malym znakiem na duzym plotnie:
// program eksportuje cala strone A4, a wzor zajmuje w niej dwa centymetry
// w rogu. Podglad rysowany z plotna pokazywal wtedy prostokat tla i ledwo
// widoczna kreske. Klient nie ma wtedy jak sprawdzic, czy wgral wlasciwy
// plik, a to jest jedyny powod, dla ktorego ten podglad istnieje.
//
// PRZYCINAMY DO TRESCI, a nie do plotna: parser zwraca oba prostokaty,
// wiec wiadomo, gdzie w arkuszu siedzi wzor i jak bardzo go przybliżyc.
//
// PLIK ZOSTAJE W `<img>`, I TO JEST ROZSTRZYGNIECIE BEZPIECZENSTWA, a nie
// wygody. SVG to dokument, ktory moze niesc `<script>`; wstawiony wprost do
// drzewa strony wykonalby sie z uprawnieniami naszej domeny. W `<img>`
// przegladarka skryptow nie uruchamia, wiec przyblizanie robimy transformacja
// CSS na obrazku, zamiast wstrzykiwac cudzy znacznik do dokumentu.
//
// Przyblizanie kolkiem i przesuwanie myszka dokladamy na wierzch, bo
// dopasowanie automatyczne trafia w wiekszosc przypadkow, ale nie w te,
// gdzie klient chce obejrzec jeden detal.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ZoomIn, RotateCcw } from "lucide-react";
import { fitToContent } from "../../utils/vectorFit.js";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 24;
/** Oddech przy krawedziach: wzor dotykajacy ramki wyglada na obciety. */
const MARGINES = 0.88;

const L = {
  pl: { hint: "Kółko myszy przybliża, przeciąganie przesuwa", reset: "Dopasuj" },
  en: { hint: "Scroll to zoom, drag to pan", reset: "Fit" },
  de: { hint: "Mausrad zoomt, Ziehen verschiebt", reset: "Einpassen" },
};

/**
 * @param {string} src blob URL rysunku
 * @param {{x,y,w,h}|null} contentBox prostokat tresci w jednostkach pliku
 * @param {{x,y,w,h}|null} canvasBox prostokat calego plotna, te same jednostki
 */
export default function VectorPreview({ src, contentBox = null, canvasBox = null, lang = "pl", height = 160, className = "" }) {
  const t = L[lang] || L.pl;
  const ramka = useRef(null);
  const [rozmiar, setRozmiar] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [przesun, setPrzesun] = useState({ x: 0, y: 0 });
  const ciagniecie = useRef(null);

  useLayoutEffect(() => {
    const el = ramka.current;
    if (!el) return;
    const zmierz = () => setRozmiar({ w: el.clientWidth, h: el.clientHeight });
    zmierz();
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(zmierz);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Dopasowanie do tresci liczone raz na plik i rozmiar ramki. Sam rachunek
  // stoi w `src/utils/vectorFit.js`, zeby dalo sie go sprawdzic liczbami.
  const dopasowanie = useMemo(
    () => fitToContent(rozmiar, contentBox, canvasBox, MARGINES),
    [rozmiar, contentBox, canvasBox]
  );

  const dopasuj = useCallback(() => { setZoom(1); setPrzesun({ x: 0, y: 0 }); }, []);
  useEffect(() => { dopasuj(); }, [src, dopasuj]);

  // Kolko podpinamy WPROST do elementu i jako listener nie-pasywny. React
  // rejestruje `onWheel` na korzeniu strony w trybie pasywnym, wiec strona
  // przewijalaby sie pod palcem w trakcie przyblizania, a `preventDefault`
  // nie mialby zadnego skutku. Podglad, ktory ucieka w gore, gdy probujesz
  // go powiekszyc, jest gorszy niz podglad bez przyblizania.
  useEffect(() => {
    const el = ramka.current;
    if (!el) return;
    const naKolku = (e) => {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))));
    };
    
    el.addEventListener("wheel", naKolku, { passive: false });
    return () => el.removeEventListener("wheel", naKolku);
  }, []);

  const start = (e) => {
    ciagniecie.current = { x: e.clientX, y: e.clientY, ox: przesun.x, oy: przesun.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const ruch = (e) => {
    const c = ciagniecie.current;
    if (!c) return;
    setPrzesun({ x: c.ox + (e.clientX - c.x), y: c.oy + (e.clientY - c.y) });
  };
  const koniec = () => { ciagniecie.current = null; };

  const przyblizony = zoom !== 1 || przesun.x !== 0 || przesun.y !== 0;
  const skala = dopasowanie.k * zoom;

  return (
    <div className={`relative w-full rounded-lg overflow-hidden bg-[#0c1222] border border-emerald-400/10 ${className}`} style={{ height }}>
      <div
        ref={ramka}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={start}
        onPointerMove={ruch}
        onPointerUp={koniec}
        onPointerCancel={koniec}
        onDoubleClick={dopasuj}
      >
        <img
          src={src}
          alt="SVG"
          draggable={false}
          className="absolute inset-0 w-full h-full opacity-90 select-none"
          style={{
            objectFit: "contain",
            filter: "invert(1) hue-rotate(180deg)",
            transform: `translate(${przesun.x}px, ${przesun.y}px) scale(${skala}) translate(${dopasowanie.dx}px, ${dopasowanie.dy}px)`,
            transformOrigin: "center",
          }}
        />
      </div>

      <div className="pointer-events-none absolute left-2 bottom-2 flex items-center gap-1.5 text-[10px] text-neutral-500">
        <ZoomIn size={11} className="shrink-0" />
        <span>{t.hint}</span>
      </div>

      {przyblizony && (
        <button
          type="button"
          onClick={dopasuj}
          className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md border border-white/15
                     bg-black/50 px-2 py-1 text-[10px] text-neutral-200 hover:border-white/35 transition-colors"
        >
          <RotateCcw size={10} />
          {t.reset}
        </button>
      )}
    </div>
  );
}
