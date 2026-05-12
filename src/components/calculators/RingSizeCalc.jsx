import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const SIZES = [
  { eu: 44, dia: 14.0, us: "3",    uk: "F",   jp: 3  },
  { eu: 45, dia: 14.3, us: "3½",   uk: "G",   jp: 4  },
  { eu: 46, dia: 14.6, us: "3½",   uk: "G½",  jp: 5  },
  { eu: 47, dia: 15.0, us: "4",    uk: "H",   jp: 7  },
  { eu: 48, dia: 15.3, us: "4½",   uk: "H½",  jp: 8  },
  { eu: 49, dia: 15.6, us: "5",    uk: "I½",  jp: 9  },
  { eu: 50, dia: 15.9, us: "5½",   uk: "J½",  jp: 10 },
  { eu: 51, dia: 16.2, us: "6",    uk: "K",   jp: 11 },
  { eu: 52, dia: 16.6, us: "6",    uk: "K½",  jp: 12 },
  { eu: 53, dia: 16.9, us: "6½",   uk: "L½",  jp: 13 },
  { eu: 54, dia: 17.2, us: "7",    uk: "M",   jp: 14 },
  { eu: 55, dia: 17.5, us: "7½",   uk: "N",   jp: 15 },
  { eu: 56, dia: 17.8, us: "7½",   uk: "N½",  jp: 16 },
  { eu: 57, dia: 18.1, us: "8",    uk: "O",   jp: 17 },
  { eu: 58, dia: 18.5, us: "8½",   uk: "P",   jp: 18 },
  { eu: 59, dia: 18.8, us: "8½",   uk: "P½",  jp: 19 },
  { eu: 60, dia: 19.1, us: "9",    uk: "Q",   jp: 20 },
  { eu: 61, dia: 19.4, us: "9½",   uk: "Q½",  jp: 21 },
  { eu: 62, dia: 19.7, us: "10",   uk: "R½",  jp: 22 },
  { eu: 63, dia: 20.1, us: "10",   uk: "S",   jp: 23 },
  { eu: 64, dia: 20.4, us: "10½",  uk: "S½",  jp: 24 },
  { eu: 65, dia: 20.7, us: "11",   uk: "T½",  jp: 25 },
  { eu: 66, dia: 21.0, us: "11½",  uk: "U",   jp: 26 },
  { eu: 67, dia: 21.3, us: "11½",  uk: "U½",  jp: 27 },
  { eu: 68, dia: 21.6, us: "12",   uk: "V",   jp: 28 },
  { eu: 70, dia: 22.3, us: "13",   uk: "W½",  jp: 30 },
];

const MIN_EU = 44;
const MAX_EU = 70;
const MIN_DIA = 14.0;
const MAX_DIA = 22.3;

const LABELS = {
  pl: {
    modeCirc: "Sznurek / papier",
    modeDia: "Mam pierścionek",
    modeKnown: "Znam rozmiar EU",
    circLabel: "Obwód palca",
    diaLabel: "Średnica wewnętrzna",
    circHint: "Owiń sznurek lub pasek papieru wokół palca, zmierz linijką w mm.",
    diaHint: "Zmierz suwmiarką lub linijką wewnętrzną średnicę istniejącego pierścionka.",
    knownHint: "Kliknij rozmiar EU na skali poniżej.",
    resultTitle: "Twój rozmiar",
    exactMatch: "dokładne",
    closestMatch: "przybliżone",
    systems: { eu: "EU / ISO", dia: "Ø mm", circ: "Obwód mm", us: "US", uk: "UK", jp: "JP" },
    tipsTitle: "Jak zmierzyć rozmiar palca?",
    tips: [
      "Mierz po południu — palce są wtedy najgrubsze.",
      "Sznurek: owiń wokół nasady palca, zaznacz złączenie, odetnij i zmierz linijką — wynik w mm = rozmiar EU.",
      "Pasek papieru (1 cm szer.) zamiast sznurka — łatwiej zmierzyć prosto.",
      "Pierścionek: zmierz suwmiarką wewnętrzną średnicę. Bez suwmiarki — połóż na kartce, obrysuj, zmierz.",
      "Kostka szersza od nasady? Zmierz obie i wybierz większy rozmiar.",
    ],
    disclaimer: "Rozmiary orientacyjne. Zawsze warto sprawdzić z fizycznym miernikiem jubilerskim.",
  },
  en: {
    modeCirc: "String / paper",
    modeDia: "I have a ring",
    modeKnown: "I know EU size",
    circLabel: "Finger circumference",
    diaLabel: "Inner diameter",
    circHint: "Wrap a string or paper strip around your finger, mark the overlap, measure in mm.",
    diaHint: "Measure the inner diameter of an existing ring with calipers or a ruler.",
    knownHint: "Tap your EU size on the scale below.",
    resultTitle: "Your size",
    exactMatch: "exact",
    closestMatch: "closest",
    systems: { eu: "EU / ISO", dia: "Ø mm", circ: "Circumf. mm", us: "US", uk: "UK", jp: "JP" },
    tipsTitle: "How to measure your ring size",
    tips: [
      "Measure in the afternoon — fingers are largest then.",
      "String method: wrap snugly around the base of your finger, mark where it meets, cut and measure in mm = EU size.",
      "Paper strip (1 cm wide) instead of string — easier to measure straight.",
      "Existing ring: measure inner diameter with calipers. No calipers? Trace on paper, measure the circle.",
      "Knuckle wider than base? Measure both; choose the larger size.",
    ],
    disclaimer: "Sizes are approximate. Always verify with a physical ring sizer.",
  },
  de: {
    modeCirc: "Faden / Papier",
    modeDia: "Ich habe einen Ring",
    modeKnown: "EU-Größe bekannt",
    circLabel: "Fingerumfang",
    diaLabel: "Innendurchmesser",
    circHint: "Faden oder Papierstreifen um den Finger wickeln, Überschneidung markieren, in mm messen.",
    diaHint: "Innendurchmesser eines vorhandenen Rings mit Messschieber oder Lineal messen.",
    knownHint: "EU-Größe auf der Skala unten antippen.",
    resultTitle: "Ihre Ringgröße",
    exactMatch: "genau",
    closestMatch: "nächste",
    systems: { eu: "EU / ISO", dia: "Ø mm", circ: "Umfang mm", us: "US", uk: "UK", jp: "JP" },
    tipsTitle: "Wie misst man die Ringgröße?",
    tips: [
      "Nachmittags messen — Finger sind dann am dicksten.",
      "Fadenmethode: Faden eng um den Finger wickeln, Treffpunkt markieren, abschneiden und in mm messen = EU-Größe.",
      "Papierstreifen (1 cm breit) statt Faden — einfacher gerade zu messen.",
      "Vorhandener Ring: Innendurchmesser mit Messschieber messen. Auf Papier legen und abzeichnen wenn kein Messschieber.",
      "Knöchel breiter? Beide Stellen messen und die größere Größe wählen.",
    ],
    disclaimer: "Größen sind Richtwerte. Immer mit einem physischen Ringmaß vergleichen.",
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

// SVG ring visualisation — scales between min/max dia
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
          <div className="text-[10px] uppercase tracking-widest text-amber-400 mb-0.5">{L.resultTitle}</div>
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
            <span className="text-[9px] uppercase tracking-wider text-amber-400/80 leading-tight">{label}</span>
            <span className="text-white font-semibold text-sm leading-tight font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// EU tile grid used in "known" mode
function EuTileGrid({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {SIZES.map(({ eu }) => (
        <button
          key={eu}
          onClick={() => onSelect(eu)}
          aria-pressed={selected === eu}
          className={`w-10 h-10 rounded-xl text-sm font-mono font-semibold border transition-all duration-150 ${
            selected === eu
              ? "bg-amber-500 border-amber-400 text-neutral-950 shadow-lg shadow-amber-500/25 scale-110"
              : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/60 hover:text-white"
          }`}
        >
          {eu}
        </button>
      ))}
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
        <div className="flex justify-between text-[10px] text-neutral-600 mt-1 font-mono">
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
        <span className="text-neutral-500 text-xs">{unit} — {hint}</span>
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
  // tile state
  const [knownEu, setKnownEu] = useState(null);

  const match = (() => {
    if (mode === "circ") return findClosestByEu(circVal);
    if (mode === "dia")  return findClosestByEu(diaVal * Math.PI);
    if (mode === "known" && knownEu != null) return findClosestByEu(knownEu);
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
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="text-xs uppercase tracking-widest text-amber-400">{L.modeKnown}</div>
          <p className="text-neutral-500 text-xs">{L.knownHint}</p>
          <EuTileGrid selected={knownEu} onSelect={setKnownEu} />
        </div>
      )}

      {/* Result */}
      {match && <ResultCard row={match.row} exact={match.exact} L={L} />}
      {mode === "known" && !knownEu && (
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 text-center">
          <span className="text-neutral-500 text-sm">↑ wybierz rozmiar EU</span>
        </div>
      )}

      {/* Tips */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.tipsTitle}</div>
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
