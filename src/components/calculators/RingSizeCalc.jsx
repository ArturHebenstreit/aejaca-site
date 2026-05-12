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

const LABELS = {
  pl: {
    modeCirc: "Mierzę sznurkiem",
    modeDia: "Mam pierścionek",
    modeKnown: "Znam rozmiar",
    circLabel: "Obwód palca (mm)",
    circPlaceholder: "np. 54",
    circHint: "Owiń sznurek lub pasek papieru wokół palca, zmierz linijką.",
    diaLabel: "Średnica wewnętrzna (mm)",
    diaPlaceholder: "np. 17.2",
    diaHint: "Zmierz suwmiarką lub linijką wewnętrzną średnicę pierścionka.",
    knownLabel: "System",
    knownPlaceholder: "np. 54 / 7 / O / 14",
    resultTitle: "Twój rozmiar",
    exactMatch: "Dokładne dopasowanie",
    closestMatch: "Najbliższe dopasowanie",
    systems: { eu: "EU / ISO", dia: "Średnica", circ: "Obwód", us: "US", uk: "UK", jp: "JP" },
    tipsTitle: "Jak zmierzyć rozmiar palca?",
    tips: [
      "Mierz po południu — palce są wtedy najgrubsze (poranne pomiary dają zaniżone wyniki).",
      "Sznurek: owiń wokół nasady palca (tuż nad kostką), zaznacz miejsce złączenia, odetnij i zmierz linijką — to Twój obwód w mm = rozmiar EU.",
      "Pasek papieru (1 cm szerokości) zamiast sznurka — łatwiej zmierzyć prosto.",
      "Istniejący pierścionek: zmierz suwmiarką wewnętrzną średnicę. Jeśli nie masz suwmiarki — połóż na kartce, obrysuj okrąg, zmierz linijką.",
      "Przy krawędzi czy nad kostką? Jeśli kostka jest wyraźnie szersza od nasady — zmierz obie, wybierz większy rozmiar.",
    ],
    disclaimer: "Rozmiary są orientacyjne. Różne pracownie mogą stosować inne siatki rozmiarów — zawsze warto porównać z fizycznym miernikiem.",
    enterValue: "Wpisz wartość powyżej, aby zobaczyć rozmiar.",
    noMatch: "Nie znaleziono dopasowania dla podanego rozmiaru.",
  },
  en: {
    modeCirc: "Measure with string",
    modeDia: "I have a ring",
    modeKnown: "I know my size",
    circLabel: "Finger circumference (mm)",
    circPlaceholder: "e.g. 54",
    circHint: "Wrap a string or paper strip around your finger, mark the overlap, measure with a ruler.",
    diaLabel: "Inner diameter (mm)",
    diaPlaceholder: "e.g. 17.2",
    diaHint: "Measure the inner diameter of an existing ring with calipers or a ruler.",
    knownLabel: "System",
    knownPlaceholder: "e.g. 54 / 7 / O / 14",
    resultTitle: "Your size",
    exactMatch: "Exact match",
    closestMatch: "Closest match",
    systems: { eu: "EU / ISO", dia: "Diameter", circ: "Circumference", us: "US", uk: "UK", jp: "JP" },
    tipsTitle: "How to measure your ring size",
    tips: [
      "Measure in the afternoon — fingers are at their largest then (morning measurements tend to be smaller).",
      "String method: wrap a string snugly around the base of your finger (just above the knuckle), mark where it meets, cut and measure — that's your circumference in mm = EU size.",
      "Paper strip (1 cm wide) instead of string — easier to measure straight.",
      "Existing ring: measure the inner diameter with calipers. No calipers? Place on paper, trace the inner circle, measure with a ruler.",
      "Knuckle wider than base? Measure both; choose the larger size.",
    ],
    disclaimer: "Sizes are approximate. Different jewelers may use slightly different size charts — always compare with a physical ring sizer.",
    enterValue: "Enter a value above to see your ring size.",
    noMatch: "No match found for the entered size.",
  },
  de: {
    modeCirc: "Mit Faden messen",
    modeDia: "Ich habe einen Ring",
    modeKnown: "Ich kenne meine Größe",
    circLabel: "Fingerumfang (mm)",
    circPlaceholder: "z.B. 54",
    circHint: "Wickeln Sie einen Faden oder Papierstreifen um den Finger, markieren Sie die Überschneidung und messen Sie mit einem Lineal.",
    diaLabel: "Innendurchmesser (mm)",
    diaPlaceholder: "z.B. 17,2",
    diaHint: "Messen Sie den Innendurchmesser eines vorhandenen Rings mit einem Messschieber oder Lineal.",
    knownLabel: "System",
    knownPlaceholder: "z.B. 54 / 7 / O / 14",
    resultTitle: "Ihre Ringgröße",
    exactMatch: "Genaue Übereinstimmung",
    closestMatch: "Nächste Übereinstimmung",
    systems: { eu: "EU / ISO", dia: "Durchmesser", circ: "Umfang", us: "US", uk: "UK", jp: "JP" },
    tipsTitle: "Wie misst man die Ringgröße?",
    tips: [
      "Nachmittags messen — Finger sind dann am dicksten (morgens kleinere Ergebnisse).",
      "Fadenmethode: Faden eng um den Fingerring wickeln (knapp über dem Knöchel), Treffpunkt markieren, abschneiden und messen — das ist Ihr Umfang in mm = EU-Größe.",
      "Papierstreifen (1 cm breit) statt Faden — einfacher gerade zu messen.",
      "Vorhandener Ring: Innendurchmesser mit Messschieber messen. Kein Messschieber? Auf Papier legen, innen abzeichnen, mit Lineal messen.",
      "Knöchel breiter als Basis? Beide messen; größere Größe wählen.",
    ],
    disclaimer: "Größen sind Richtwerte. Verschiedene Juweliere verwenden möglicherweise leicht unterschiedliche Größentabellen — immer mit einem physischen Ringmaß vergleichen.",
    enterValue: "Geben Sie oben einen Wert ein, um Ihre Ringgröße zu sehen.",
    noMatch: "Keine Übereinstimmung für die eingegebene Größe gefunden.",
  },
};

function findClosestByEu(euValue) {
  let best = null;
  let bestDiff = Infinity;
  for (const row of SIZES) {
    const diff = Math.abs(row.eu - euValue);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = row;
    }
  }
  return { row: best, diff: bestDiff, exact: bestDiff <= 0.5 };
}

function parseKnownSize(input) {
  const raw = input.trim();
  if (!raw) return null;

  // Try EU numeric first (e.g. "54", "54.0")
  const numVal = parseFloat(raw.replace(",", "."));
  if (!isNaN(numVal)) {
    // Check if it could be a JP size (integer ≤ 30)
    const isInteger = Number.isInteger(numVal) || raw === String(Math.round(numVal));
    if (isInteger && numVal <= 30) {
      // Try JP match first if it looks small
      const jpRow = SIZES.find((r) => r.jp === numVal);
      if (jpRow) {
        // Ambiguous: could be EU or JP. EU range starts at 44, so if ≤ 30 it's JP
        if (numVal <= 30) {
          return { row: jpRow, exact: true, system: "JP" };
        }
      }
    }
    // Try EU match
    if (numVal >= 40 && numVal <= 75) {
      return findClosestByEu(numVal);
    }
    // Try US fraction match (e.g. "7", "7.5")
    if (numVal <= 14) {
      // Normalize to fraction string like "7" or "7½"
      const usStr = numVal % 1 === 0.5
        ? `${Math.floor(numVal)}½`
        : numVal % 1 === 0
        ? `${numVal}`
        : null;
      if (usStr) {
        const usRow = SIZES.find((r) => r.us === usStr);
        if (usRow) return { row: usRow, exact: true, system: "US" };
        // Try closest
        const usNum = SIZES.map((r) => {
          const parsed = parseFloat(r.us.replace("½", ".5"));
          return { row: r, diff: Math.abs(parsed - numVal) };
        }).sort((a, b) => a.diff - b.diff)[0];
        if (usNum && usNum.diff <= 0.5) return { row: usNum.row, exact: usNum.diff === 0, system: "US" };
      }
      // Just find closest US
      const best = SIZES.map((r) => {
        const parsed = parseFloat(r.us.replace("½", ".5"));
        return { row: r, diff: Math.abs(parsed - numVal) };
      }).sort((a, b) => a.diff - b.diff)[0];
      if (best && best.diff <= 1) return { row: best.row, exact: best.diff === 0, system: "US" };
    }
    // Fallback: try EU
    if (numVal > 0) return findClosestByEu(numVal);
    return null;
  }

  // Try UK letter match (e.g. "O", "P½", "K")
  const ukNormalized = raw.replace("1/2", "½").replace("1⁄2", "½");
  const ukRow = SIZES.find((r) => r.uk.toLowerCase() === ukNormalized.toLowerCase());
  if (ukRow) return { row: ukRow, exact: true, system: "UK" };

  // Partial UK match (first letter)
  const ukPartial = SIZES.filter((r) => r.uk.toLowerCase().startsWith(ukNormalized.toLowerCase()));
  if (ukPartial.length === 1) return { row: ukPartial[0], exact: false, system: "UK" };

  return null;
}

function ResultCard({ match, L }) {
  if (!match) return null;
  const { row, exact } = match;
  const circ = (row.dia * Math.PI).toFixed(1);

  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-amber-400/20" aria-live="polite" aria-atomic="true">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs uppercase tracking-widest text-amber-400">{L.resultTitle}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exact ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"}`}>
          {exact ? L.exactMatch : L.closestMatch}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-400">{L.systems.eu}</span>
          <span className="text-white font-bold text-xl leading-none">{row.eu}</span>
        </div>
        <div className="bg-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-400">{L.systems.dia}</span>
          <span className="text-white font-bold text-xl leading-none">{row.dia.toFixed(1)} <span className="text-sm font-normal text-neutral-400">mm</span></span>
        </div>
        <div className="bg-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-400">{L.systems.circ}</span>
          <span className="text-white font-bold text-xl leading-none">{circ} <span className="text-sm font-normal text-neutral-400">mm</span></span>
        </div>
        <div className="bg-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-400">{L.systems.us}</span>
          <span className="text-white font-bold text-xl leading-none">{row.us}</span>
        </div>
        <div className="bg-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-400">{L.systems.uk}</span>
          <span className="text-white font-bold text-xl leading-none">{row.uk}</span>
        </div>
        <div className="bg-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-400">{L.systems.jp}</span>
          <span className="text-white font-bold text-xl leading-none">{row.jp}</span>
        </div>
      </div>
    </div>
  );
}

export default function RingSizeCalc({ lang: langProp }) {
  const ctx = useLanguage();
  const lang = langProp || ctx?.lang || "pl";
  const L = LABELS[lang] || LABELS.pl;

  const [mode, setMode] = useState("circ");
  const [inputVal, setInputVal] = useState("");

  const match = (() => {
    const raw = inputVal.trim().replace(",", ".");
    if (!raw) return null;
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0) return null;

    if (mode === "circ") {
      return findClosestByEu(num);
    }
    if (mode === "dia") {
      const circ = num * Math.PI;
      return findClosestByEu(circ);
    }
    if (mode === "known") {
      return parseKnownSize(inputVal);
    }
    return null;
  })();

  const MODES = [
    { id: "circ", label: L.modeCirc },
    { id: "dia", label: L.modeDia },
    { id: "known", label: L.modeKnown },
  ];

  const activeInput = {
    circ: { label: L.circLabel, placeholder: L.circPlaceholder, hint: L.circHint },
    dia:  { label: L.diaLabel,  placeholder: L.diaPlaceholder,  hint: L.diaHint  },
    known:{ label: L.knownLabel, placeholder: L.knownPlaceholder, hint: null },
  }[mode];

  function handleModeChange(id) {
    setMode(id);
    setInputVal("");
  }

  const hasInput = inputVal.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex gap-2 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === m.id
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Input section */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <label className="block text-sm text-neutral-300 mb-2">{activeInput.label}</label>
        <input
          type={mode === "known" ? "text" : "number"}
          inputMode={mode === "known" ? "text" : "decimal"}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={activeInput.placeholder}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors text-base"
        />
        {activeInput.hint && (
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">{activeInput.hint}</p>
        )}
      </div>

      {/* Result */}
      {hasInput && match && <ResultCard match={match} L={L} />}
      {hasInput && !match && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <p className="text-neutral-400 text-sm">{L.noMatch}</p>
        </div>
      )}
      {!hasInput && (
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
          <p className="text-neutral-500 text-sm text-center">{L.enterValue}</p>
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
