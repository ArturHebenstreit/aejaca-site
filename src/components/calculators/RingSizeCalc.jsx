import { useState } from "react";
import { Link } from "../../i18n/nav.jsx";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { RING_SIZES as SIZES, MIN_EU, MAX_EU, MIN_DIA, MAX_DIA } from "../../data/ringSizes.js";


const LABELS = {
  pl: {
    modeCirc: "Sznurek / papier",
    modeDia: "Mam pierścionek",
    modeKnown: "Znam rozmiar",
    circLabel: "Obwód palca",
    diaLabel: "Średnica wewnętrzna",
    circHint: "Owiń sznurek lub pasek papieru wokół palca, zmierz linijką w mm.",
    diaHint: "Zmierz suwmiarką lub linijką wewnętrzną średnicę istniejącego pierścionka.",
    knownHint: "Wybierz system i kliknij swój rozmiar.",
    resultTitle: "Twój rozmiar",
    exactMatch: "dokładne",
    closestMatch: "przybliżone",
    systems: { eu: "EU / ISO", dia: "Ø mm", circ: "Obwód mm", us: "US", uk: "UK", jp: "JP" },
    systemTabs: { eu: "EU", us: "US", uk: "UK", jp: "JP" },
    systemPrompt: "Wybierz system, kliknij rozmiar:",
    tipsTitle: "Jak zmierzyć rozmiar palca?",
    tips: [
      "Mierz po południu - palce są wtedy najgrubsze.",
      "Sznurek: owiń wokół nasady palca, zaznacz złączenie, odetnij i zmierz linijką - wynik w mm = rozmiar EU.",
      "Pasek papieru (1 cm szer.) zamiast sznurka - łatwiej zmierzyć prosto.",
      "Pierścionek: zmierz suwmiarką wewnętrzną średnicę. Bez suwmiarki - połóż na kartce, obrysuj, zmierz.",
      "Kostka szersza od nasady? Zmierz obie i wybierz większy rozmiar.",
    ],
    disclaimer: "Rozmiary orientacyjne. Zawsze warto sprawdzić z fizycznym miernikiem jubilerskim.",
    sizerTitle: "Nie masz czym zmierzyć?",
    sizerText: "Wydrukuj naszą miarkę. Pasek z podziałką jest dokładniejszy od sznurka, bo nie rozciąga się i nie trzeba go przekładać na linijkę.",
    sizerBtn: "Miarka do pierścionków do wydruku",
  },
  en: {
    modeCirc: "String / paper",
    modeDia: "I have a ring",
    modeKnown: "I know my size",
    circLabel: "Finger circumference",
    diaLabel: "Inner diameter",
    circHint: "Wrap a string or paper strip around your finger, mark the overlap, measure in mm.",
    diaHint: "Measure the inner diameter of an existing ring with calipers or a ruler.",
    knownHint: "Select system and tap your size.",
    resultTitle: "Your size",
    exactMatch: "exact",
    closestMatch: "closest",
    systems: { eu: "EU / ISO", dia: "Ø mm", circ: "Circumf. mm", us: "US", uk: "UK", jp: "JP" },
    systemTabs: { eu: "EU", us: "US", uk: "UK", jp: "JP" },
    systemPrompt: "Select system, tap your size:",
    tipsTitle: "How to measure your ring size",
    tips: [
      "Measure in the afternoon - fingers are largest then.",
      "String method: wrap snugly around the base of your finger, mark where it meets, cut and measure in mm = EU size.",
      "Paper strip (1 cm wide) instead of string - easier to measure straight.",
      "Existing ring: measure inner diameter with calipers. No calipers? Trace on paper, measure the circle.",
      "Knuckle wider than base? Measure both; choose the larger size.",
    ],
    disclaimer: "Sizes are approximate. Always verify with a physical ring sizer.",
    sizerTitle: "Nothing to measure with?",
    sizerText: "Print our sizer. A printed strip beats string, because it does not stretch and you never transfer the result to a ruler.",
    sizerBtn: "Printable ring sizer",
  },
  de: {
    modeCirc: "Faden / Papier",
    modeDia: "Ich habe einen Ring",
    modeKnown: "Größe bekannt",
    circLabel: "Fingerumfang",
    diaLabel: "Innendurchmesser",
    circHint: "Faden oder Papierstreifen um den Finger wickeln, Überschneidung markieren, in mm messen.",
    diaHint: "Innendurchmesser eines vorhandenen Rings mit Messschieber oder Lineal messen.",
    knownHint: "System wählen und Größe antippen.",
    resultTitle: "Ihre Ringgröße",
    exactMatch: "genau",
    closestMatch: "nächste",
    systems: { eu: "EU / ISO", dia: "Ø mm", circ: "Umfang mm", us: "US", uk: "UK", jp: "JP" },
    systemTabs: { eu: "EU", us: "US", uk: "UK", jp: "JP" },
    systemPrompt: "System wählen, Größe antippen:",
    tipsTitle: "Wie misst man die Ringgröße?",
    tips: [
      "Nachmittags messen - Finger sind dann am dicksten.",
      "Fadenmethode: Faden eng um den Finger wickeln, Treffpunkt markieren, abschneiden und in mm messen = EU-Größe.",
      "Papierstreifen (1 cm breit) statt Faden - einfacher gerade zu messen.",
      "Vorhandener Ring: Innendurchmesser mit Messschieber messen. Auf Papier legen und abzeichnen wenn kein Messschieber.",
      "Knöchel breiter? Beide Stellen messen und die größere Größe wählen.",
    ],
    disclaimer: "Größen sind Richtwerte. Immer mit einem physischen Ringmaß vergleichen.",
    sizerTitle: "Nichts zum Messen zur Hand?",
    sizerText: "Drucken Sie unser Ringmaßband. Ein gedruckter Streifen schlägt den Faden, denn er dehnt sich nicht und muss nicht aufs Lineal übertragen werden.",
    sizerBtn: "Ringmaßband zum Ausdrucken",
  },
};

function findClosestByEu(euValue) {
  let best = null;
  let bestDiff = Infinity;
  for (const row of SIZES) {
    const diff = Math.abs(row.eu - euValue);
    if (diff < bestDiff) { bestDiff = diff; best = row; }
  }
  return { row: best, exact: bestDiff <= 0.5 };
}

// Unique values per system (preserving order from SIZES)
function uniqueValues(key) {
  const seen = new Set();
  return SIZES.filter(row => {
    const v = String(row[key]);
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

// Find SIZES row for a given system+value (first match)
function findBySystem(system, value) {
  return SIZES.find(row => String(row[system]) === String(value)) || null;
}

// SVG ring visualisation - scales between min/max dia
function RingVisual({ dia }) {
  const minD = MIN_DIA, maxD = MAX_DIA;
  const t = (dia - minD) / (maxD - minD); // 0..1
  // outer radius of the rendered ring (px): 44 → 60px, 70 → 92px
  const outerR = 30 + t * 30;
  const strokeW = 8;
  const innerR = outerR - strokeW;
  const svgSize = (outerR + 4) * 2;
  const cx = svgSize / 2;
  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} aria-hidden="true"
      style={{ transition: "all 0.25s ease" }}>
      {/* outer glow */}
      <circle cx={cx} cy={cx} r={outerR} fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth={strokeW + 6} />
      {/* ring body */}
      <circle cx={cx} cy={cx} r={outerR - strokeW / 2} fill="none"
        stroke="url(#ringGrad)" strokeWidth={strokeW}
        strokeLinecap="round" />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      {/* inner diameter label */}
      <text x={cx} y={cx + 4} textAnchor="middle" fill="rgba(255,255,255,0.5)"
        fontSize="9" fontFamily="monospace">{dia.toFixed(1)}mm</text>
    </svg>
  );
}

function ResultCard({ row, exact, L }) {
  const circ = (row.dia * Math.PI).toFixed(1);
  return (
    <div className="p-5 rounded-2xl bg-neutral-900 border border-amber-400/20" aria-live="polite">
      {/* header row: ring visual + EU hero */}
      <div className="flex items-center gap-5 mb-5">
        <RingVisual dia={row.dia} />
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-400 mb-0.5">{L.resultTitle}</div>
          <div className="text-6xl font-bold text-white leading-none font-mono">{row.eu}</div>
          <div className="text-neutral-400 text-xs mt-1 flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${exact ? "bg-emerald-400" : "bg-amber-400"}`} />
            {exact ? L.exactMatch : L.closestMatch}
          </div>
        </div>
      </div>
      {/* 5-chip grid for other systems */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: L.systems.dia,  value: `${row.dia.toFixed(1)} mm` },
          { label: L.systems.circ, value: `${circ} mm` },
          { label: L.systems.us,   value: row.us },
          { label: L.systems.uk,   value: row.uk },
          { label: L.systems.jp,   value: String(row.jp) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-800/70 rounded-xl p-2.5 flex flex-col gap-1 items-center text-center">
            <span className="text-xs uppercase tracking-wider text-amber-400/80 leading-tight">{label}</span>
            <span className="text-white font-semibold text-sm leading-tight font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SizeTileGrid({ system, selected, onSelect }) {
  const rows = uniqueValues(system);
  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {rows.map((row) => {
        const val = String(row[system]);
        const isSelected = selected === val;
        return (
          <button
            key={val}
            onClick={() => onSelect(val)}
            aria-pressed={isSelected}
            className={`min-w-[2.5rem] h-10 px-2.5 rounded-xl text-sm font-mono font-semibold border transition-all duration-150 ${
              isSelected
                ? "bg-amber-500 border-amber-400 text-neutral-950 shadow-lg shadow-amber-500/25 scale-110"
                : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/60 hover:text-white"
            }`}
          >
            {val}
          </button>
        );
      })}
    </div>
  );
}

// Styled range slider for circ / dia modes
function MeasureSlider({ mode, value, onChange, L }) {
  const isCirc = mode === "circ";
  const min = isCirc ? MIN_EU : MIN_DIA;
  const max = isCirc ? MAX_EU : MAX_DIA;
  const step = isCirc ? 0.5 : 0.1;
  const unit = "mm";
  const label = isCirc ? L.circLabel : L.diaLabel;
  const hint  = isCirc ? L.circHint  : L.diaHint;

  // percent for custom thumb track fill
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
      {/* label + live value */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-amber-400">{label}</span>
        <span className="font-mono text-2xl font-bold text-white">
          {value.toFixed(isCirc ? 0 : 1)}
          <span className="text-sm font-normal text-neutral-400 ml-1">{unit}</span>
        </span>
      </div>

      {/* range input */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, #f59e0b ${pct}%, #404040 ${pct}%)`,
          }}
        />
        {/* min/max labels */}
        <div className="flex justify-between text-xs text-neutral-600 mt-1 font-mono">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      {/* manual number input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-24 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-amber-400/60 text-center"
        />
        <span className="text-neutral-500 text-xs">{unit} - {hint}</span>
      </div>
    </div>
  );
}

export default function RingSizeCalc({ lang: langProp }) {
  const ctx = useLanguage();
  const lang = langProp || ctx?.lang || "pl";
  const L = LABELS[lang] || LABELS.pl;

  const [mode, setMode] = useState("circ");
  // slider states
  const [circVal, setCircVal] = useState(54);   // mm circumference
  const [diaVal, setDiaVal]   = useState(17.2); // mm diameter
  // known mode state
  const [knownSystem, setKnownSystem] = useState("eu"); // eu | us | uk | jp
  const [knownVal, setKnownVal] = useState(null);        // string value

  const match = (() => {
    if (mode === "circ") return findClosestByEu(circVal);
    if (mode === "dia")  return findClosestByEu(diaVal * Math.PI);
    if (mode === "known" && knownVal != null) {
      const row = findBySystem(knownSystem, knownVal);
      if (row) return { row, exact: true };
    }
    return null;
  })();

  const MODES = [
    { id: "circ",  label: L.modeCirc  },
    { id: "dia",   label: L.modeDia   },
    { id: "known", label: L.modeKnown },
  ];

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="p-1 rounded-2xl bg-neutral-900 border border-neutral-800 flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === m.id
                ? "bg-amber-500 text-neutral-950 shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Input section */}
      {mode === "circ" && (
        <MeasureSlider mode="circ" value={circVal} onChange={setCircVal} L={L} />
      )}
      {mode === "dia" && (
        <MeasureSlider mode="dia" value={diaVal} onChange={setDiaVal} L={L} />
      )}
      {mode === "known" && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          {/* System tabs */}
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-400 mb-2">{L.systemPrompt}</div>
            <div className="flex gap-1.5 mb-4">
              {["eu", "us", "uk", "jp"].map(sys => (
                <button
                  key={sys}
                  onClick={() => { setKnownSystem(sys); setKnownVal(null); }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                    knownSystem === sys
                      ? "bg-amber-500/20 border-amber-400 text-amber-300"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-amber-400/50 hover:text-white"
                  }`}
                >
                  {L.systemTabs[sys]}
                </button>
              ))}
            </div>
            <SizeTileGrid system={knownSystem} selected={knownVal} onSelect={setKnownVal} />
          </div>
        </div>
      )}

      {/* Result */}
      {match && <ResultCard row={match.row} exact={match.exact} L={L} />}

      {/* Tips */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.tipsTitle}</div>

        {/* Ta karta uczyla mierzenia sznurkiem i konczyla sie zdaniem, ze warto
            sprawdzic fizycznym miernikiem, nie proponujac zadnego. Miarka do
            wydruku jest naszym darmowym odpowiednikiem i musi stac PRZED
            instrukcja, a nie pod nia: kto doczytal do konca, juz siegnal po
            sznurek. */}
        <Link
          to="/toolsjewelry/ring-sizer/"
          className="group flex flex-col gap-1 mb-4 p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 hover:border-amber-400/40 hover:bg-amber-400/10 transition-all duration-300"
        >
          <span className="text-white text-sm font-medium">{L.sizerTitle}</span>
          <span className="text-neutral-400 text-xs leading-relaxed">{L.sizerText}</span>
          <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-medium mt-1">
            {L.sizerBtn}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <ol className="space-y-2 list-decimal list-inside">
          {L.tips.map((tip, i) => (
            <li key={i} className="text-neutral-400 text-xs leading-relaxed">{tip}</li>
          ))}
        </ol>
        <p className="text-neutral-600 text-xs mt-3 leading-relaxed">{L.disclaimer}</p>
      </div>
    </div>
  );
}
