// ============================================================
// CASTING SHRINKAGE COMPENSATION CALCULATOR
// A 3D-printed / CAD pattern must be enlarged before casting to
// compensate for the alloy's solidification shrinkage. This tool
// converts a target (final, after-cast) dimension into the pattern
// dimension, or the other way around, plus a bonus EU ring-size
// lookup table with per-alloy pattern sizing.
// Free tool, no pricing, just geometry.
// ============================================================
import { useState, useMemo } from "react";
import { CalcCard, Chips, InquiryForm, t } from "./calcShared.jsx";

const ALLOYS = {
  au585: { factor: 1.0196, label: { pl: "Au 585 (14K)", en: "Au 585 (14K)", de: "Au 585 (14K)" } },
  ag925: { factor: 1.016, label: { pl: "Ag 925", en: "Ag 925", de: "Ag 925" } },
  au9k: { factor: 1.021, label: { pl: "Au 9K", en: "Au 9K", de: "Au 9K" } },
  au18k: { factor: 1.018, label: { pl: "Au 18K", en: "Au 18K", de: "Au 18K" } },
};

const ALLOY_CHIPS = Object.entries(ALLOYS).map(([id, v]) => ({ id, label: v.label }));

const RING_SIZES_EU = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];

const LABELS = {
  pl: {
    step1: "Stop odlewniczy",
    step2: "Kierunek przeliczenia",
    step3: "Wymiar",
    step4: "Wynik",
    dirToPattern: "Wymiar docelowy → wymiar wzorca",
    dirToResult: "Wymiar wzorca → wymiar po odlewie",
    inputToPattern: "Wymiar docelowy (po odlewie)",
    inputToResult: "Wymiar wzorca (przed odlewem)",
    resultToPattern: "Wymiar wzorca",
    resultToResult: "Wymiar po odlewie",
    diff: "Różnica",
    diffPct: "Skurcz",
    mm: "mm",
    tableTitle: "Tabela rozmiarów pierścionków EU 48-58",
    tableEU: "Rozmiar EU",
    tableID: "Średnica wewn. (mm)",
    tablePattern: "Wymiar wzorca (mm)",
    tableNote: "Średnica wewnętrzna liczona jako obwód (rozmiar EU w mm) podzielony przez π. Kolumna wzorca uwzględnia współczynnik skurczu wybranego stopu.",
    ctaLabel: "Zamów wzorzec castable lub gotowy odlew",
  },
  en: {
    step1: "Casting alloy",
    step2: "Conversion direction",
    step3: "Dimension",
    step4: "Result",
    dirToPattern: "Target size → pattern size",
    dirToResult: "Pattern size → size after casting",
    inputToPattern: "Target dimension (after casting)",
    inputToResult: "Pattern dimension (before casting)",
    resultToPattern: "Pattern dimension",
    resultToResult: "Dimension after casting",
    diff: "Difference",
    diffPct: "Shrinkage",
    mm: "mm",
    tableTitle: "EU ring size table 48-58",
    tableEU: "EU size",
    tableID: "Inner diameter (mm)",
    tablePattern: "Pattern dimension (mm)",
    tableNote: "Inner diameter is calculated as circumference (EU size in mm) divided by π. The pattern column applies the shrinkage factor of the selected alloy.",
    ctaLabel: "Order a castable pattern or a finished cast piece",
  },
  de: {
    step1: "Gusslegierung",
    step2: "Umrechnungsrichtung",
    step3: "Maß",
    step4: "Ergebnis",
    dirToPattern: "Zielmaß → Modellmaß",
    dirToResult: "Modellmaß → Maß nach dem Guss",
    inputToPattern: "Zielmaß (nach dem Guss)",
    inputToResult: "Modellmaß (vor dem Guss)",
    resultToPattern: "Modellmaß",
    resultToResult: "Maß nach dem Guss",
    diff: "Differenz",
    diffPct: "Schwindung",
    mm: "mm",
    tableTitle: "EU-Ringgrößentabelle 48-58",
    tableEU: "EU-Größe",
    tableID: "Innendurchmesser (mm)",
    tablePattern: "Modellmaß (mm)",
    tableNote: "Der Innendurchmesser wird als Umfang (EU-Größe in mm) geteilt durch π berechnet. Die Modellspalte berücksichtigt den Schwindungsfaktor der gewählten Legierung.",
    ctaLabel: "Castable Modell oder fertigen Guss bestellen",
  },
};

const TECH_LABEL = {
  pl: "Kalkulator kompensacji skurczu odlewniczego",
  en: "Casting Shrinkage Compensation Calculator",
  de: "Guss-Schwindungskompensations-Rechner",
};

export default function ShrinkageCalc({ lang = "pl" }) {
  const l = LABELS[lang] || LABELS.en;

  const [alloyId, setAlloyId] = useState("ag925");
  const [direction, setDirection] = useState("toPattern");
  const [dimension, setDimension] = useState(16.0);

  const alloy = ALLOYS[alloyId];
  const isToPattern = direction === "toPattern";

  const DIRECTION_CHIPS = [
    { id: "toPattern", label: { pl: l.dirToPattern, en: l.dirToPattern, de: l.dirToPattern } },
    { id: "toResult", label: { pl: l.dirToResult, en: l.dirToResult, de: l.dirToResult } },
  ];

  const { resultDim, diff, diffPct } = useMemo(() => {
    const dim = Number(dimension) || 0;
    const result = isToPattern ? dim * alloy.factor : dim / alloy.factor;
    return {
      resultDim: result,
      diff: result - dim,
      diffPct: dim ? ((result - dim) / dim) * 100 : 0,
    };
  }, [dimension, alloy, isToPattern]);

  const paramsSummary = [
    t(alloy.label, lang),
    isToPattern ? l.dirToPattern : l.dirToResult,
    `in=${dimension}mm`,
    `out=${resultDim.toFixed(3)}mm`,
  ].join(" | ");

  return (
    <div>
      {/* Step 1, Alloy */}
      <CalcCard stepNum="①" label={l.step1}>
        <Chips options={ALLOY_CHIPS} value={alloyId} onChange={setAlloyId} lang={lang} />
      </CalcCard>

      {/* Step 2, Direction */}
      <CalcCard stepNum="②" label={l.step2}>
        <Chips options={DIRECTION_CHIPS} value={direction} onChange={setDirection} lang={lang} />
      </CalcCard>

      {/* Step 3, Dimension */}
      <CalcCard stepNum="③" label={l.step3}>
        <div>
          <label className="block text-sm text-neutral-300 mb-1.5">
            {isToPattern ? l.inputToPattern : l.inputToResult}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={0.1}
              value={dimension}
              onChange={(e) => setDimension(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-32 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-colors"
            />
            <span className="text-neutral-400 text-sm">{l.mm}</span>
          </div>
        </div>
      </CalcCard>

      {/* Step 4, Result */}
      <CalcCard stepNum="④" label={l.step4}>
        <div className="bg-blue-400/10 border border-blue-400/20 rounded-xl p-4" aria-live="polite" aria-atomic="true">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{isToPattern ? l.resultToPattern : l.resultToResult}</span>
              <span className="text-blue-400 font-bold text-lg">{resultDim.toFixed(3)} {l.mm}</span>
            </div>
            <div className="border-t border-blue-400/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{l.diff}</span>
              <span className="text-blue-300 font-bold text-lg">{diff >= 0 ? "+" : ""}{diff.toFixed(3)} {l.mm}</span>
            </div>
            <div className="border-t border-blue-400/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{l.diffPct} ({t(alloy.label, lang)})</span>
              <span className="text-blue-200 font-bold text-lg">{diffPct >= 0 ? "+" : ""}{diffPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </CalcCard>

      {/* Bonus, EU ring size table */}
      <CalcCard label={l.tableTitle}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-neutral-400 text-left">
                <th className="px-2 py-1.5">{l.tableEU}</th>
                <th className="px-2 py-1.5">{l.tableID}</th>
                <th className="px-2 py-1.5 text-blue-300">{l.tablePattern}</th>
              </tr>
            </thead>
            <tbody>
              {RING_SIZES_EU.map((eu) => {
                const id = eu / Math.PI;
                const pattern = id * alloy.factor;
                return (
                  <tr key={eu} className="border-t border-white/5">
                    <td className="px-2 py-1.5 text-neutral-300">{eu}</td>
                    <td className="px-2 py-1.5 text-neutral-400">{id.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-blue-300 font-medium">{pattern.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-neutral-500 mt-3 leading-relaxed">{l.tableNote}</p>
      </CalcCard>

      {/* Inquiry form */}
      <InquiryForm
        lang={lang}
        techLabel={t(TECH_LABEL, lang)}
        paramsSummary={paramsSummary}
      />
    </div>
  );
}
