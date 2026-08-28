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
  pl: { hint: "Kółko myszy przybliża, przeciąganie przesuwa", reset: "Dopasuj", opis: "Podgląd wgranego rysunku" },
  en: { hint: "Scroll to zoom, drag to pan", reset: "Fit", opis: "Preview of the uploaded drawing" },
  de: { hint: "Mausrad zoomt, Ziehen verschiebt", reset: "Einpassen", opis: "Vorschau der hochgeladenen Zeichnung" },
};

/**
 * @param {string} src blob URL rysunku
 * @param {{x,y,w,h}|null} contentBox prostokat tresci w jednostkach pliku
 * @param {{x,y,w,h}|null} canvasBox prostokat calego plotna, te same jednostki
 */
export default function VectorPreview({ src, contentBox = null, canvasBox = null, lang = "pl", height = 160, className = "", stretch = null }) {
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
  // ZNIEKSZTALCENIE Z POL WYMIAROW. Rozciagniecie osi ma byc widac tutaj, bo
  // to jedyne miejsce, gdzie klient sprawdzi, czy o to mu chodzilo. Mnozymy
  // przez wspolczynnik wzgledny (os / wieksza z osi), zeby rysunek nie
  // wyskakiwal poza kadr przy powiekszeniu obu osi naraz: samo dopasowanie
  // odpowiada za wielkosc, to tylko za proporcje.
  const sx = Number(stretch?.x) > 0 ? Number(stretch.x) : 1;
  const sy = Number(stretch?.y) > 0 ? Number(stretch.y) : 1;
  const wiodaca = Math.max(sx, sy);
  const rx = sx / wiodaca;
  const ry = sy / wiodaca;

  return (
    // CIEMNA TRESC NA BARDZO JASNYM TLE. Wczesniej bylo odwrotnie: ciemne tlo
    // i rysunek odwracany filtrem `invert`. Odwrocenie robilo z czarnej kreski
    // biala, a z bieli czern, wiec cienki wzor na duzym plotnie gubil sie
    // w tle i po wgraniu modelu nie bylo widac, co wlasnie doszlo. Rysunki do
    // lasera sa prawie zawsze czarne na przezroczystym, wiec pokazujemy je tak,
    // jak wygladaja w pliku, na jasnej plycie. Wzor narysowany biela bedzie tu
    // slabo widoczny i to jest swiadomy wybor mniejszego zla: bialych rysunkow
    // do ciecia praktycznie nie ma, czarnych sa wszystkie.
    <div className={`relative w-full rounded-lg overflow-hidden bg-[#eef0f3] border border-black/10 ${className}`} style={{ height }}>
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
          alt={t.opis}
          draggable={false}
          className="absolute inset-0 w-full h-full select-none"
          style={{
            objectFit: "contain",
            filter: "contrast(1.1)",
            transform: `translate(${przesun.x}px, ${przesun.y}px) scale(${skala * rx}, ${skala * ry}) translate(${dopasowanie.dx}px, ${dopasowanie.dy}px)`,
            transformOrigin: "center",
          }}
        />
      </div>

      <div className="pointer-events-none absolute left-2 bottom-2 flex items-center gap-1.5 text-xs text-neutral-600">
        <ZoomIn size={11} className="shrink-0" />
        <span>{t.hint}</span>
      </div>

      {przyblizony && (
        <button
          type="button"
          onClick={dopasuj}
          className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md border border-black/15
                     bg-white/80 px-2 py-1 text-xs text-neutral-700 hover:border-black/35 transition-colors"
        >
          <RotateCcw size={10} />
          {t.reset}
        </button>
      )}
    </div>
  );
}
