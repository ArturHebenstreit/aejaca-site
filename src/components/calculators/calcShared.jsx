// ============================================================
// SHARED CONFIG, PRICING & UI — ALL STUDIO CALCULATORS
// ============================================================
import { useState } from "react";

export const CONFIG = {
  EUR_PLN_RATE: 4.28,
  TOLERANCE_LOW: 0.30,
  TOLERANCE_HIGH: 0.40,
  ENERGY_COST_PLN: 1.05,
  BASE_MARGIN: 0.40,
};

export const QUANTITY_TIERS = [
  { id: "proto",  label: { pl: "1 szt. (prototyp)", en: "1 pc (prototype)", de: "1 Stk. (Prototyp)" }, qty: 1, discount: 0.00 },
  { id: "micro",  label: { pl: "2–10 szt.", en: "2–10 pcs", de: "2–10 Stk." }, qty: 6, discount: 0.05 },
  { id: "small",  label: { pl: "11–20 szt.", en: "11–20 pcs", de: "11–20 Stk." }, qty: 15, discount: 0.10 },
  { id: "medium", label: { pl: "21–50 szt.", en: "21–50 pcs", de: "21–50 Stk." }, qty: 35, discount: 0.15 },
  { id: "large",  label: { pl: "51–100 szt.", en: "51–100 pcs", de: "51–100 Stk." }, qty: 75, discount: 0.20 },
  { id: "custom", label: { pl: "100+ / niestandardowe", en: "100+ / custom", de: "100+ / individuell" }, qty: null, discount: null },
];

/** Apply margin, discount, tolerance → price range PLN + EUR */
export function applyPricing(baseCost, margin, discountRate, qty) {
  const basePrice = baseCost * (1 + margin);
  const discounted = basePrice * (1 - discountRate);
  const perMin = Math.round(discounted * (1 - CONFIG.TOLERANCE_LOW));
  const perMax = Math.round(discounted * (1 + CONFIG.TOLERANCE_HIGH));
  return {
    perPcPLN: { min: perMin, max: perMax },
    perPcEUR: { min: Math.round(perMin / CONFIG.EUR_PLN_RATE), max: Math.round(perMax / CONFIG.EUR_PLN_RATE) },
    totalPLN: { min: perMin * qty, max: perMax * qty },
    totalEUR: { min: Math.round((perMin * qty) / CONFIG.EUR_PLN_RATE), max: Math.round((perMax * qty) / CONFIG.EUR_PLN_RATE) },
  };
}

// ============================================================
// SHARED UI COMPONENTS (Tailwind, blue accent for sTuDiO)
// ============================================================

/** Chip selector grid */
export function Chips({ options, value, onChange, lang = "pl" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        const isCustom = opt.custom;
        const label = typeof opt.label === "object" ? (opt.label[lang] || opt.label.en) : opt.label;
        const sub = opt.sub;
        return (
          <button
            key={String(opt.id)}
            onClick={() => onChange(opt.id)}
            title={opt.note}
            className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
              isCustom && !active ? "border-dashed border-white/10 text-neutral-500 italic text-xs" :
              isCustom && active ? "border-dashed border-blue-400 bg-blue-400/10 text-blue-300 font-medium" :
              active ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" :
              "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
            }`}
          >
            {label}
            {sub && <span className={`text-[10px] ml-1.5 ${active ? "opacity-80" : "text-neutral-600"}`}>{sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Section card wrapper */
export function CalcCard({ stepNum, label, children }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
        {stepNum && <span className="text-blue-400 mr-1.5">{stepNum}</span>}{label}
      </div>
      {children}
    </div>
  );
}

/** Price result display */
export function ResultDisplay({ result, lang = "pl" }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const labels = RESULT_LABELS[lang] || RESULT_LABELS.en;

  if (!result) return <div className="text-center text-neutral-600 py-4">{labels.selectAll}</div>;

  if (result.type === "custom") {
    return (
      <div className="text-center py-4">
        <div className="text-lg font-bold text-blue-400 mb-1">{labels.customQuote}</div>
        <div className="text-sm text-neutral-400">{labels.customDesc}</div>
      </div>
    );
  }

  const r = result;
  return (
    <>
      {/* Per piece */}
      <div className="text-center text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
        {labels.perPiece}
        {r.discount > 0 && <span className="text-green-400 ml-2 font-bold">(-{r.discount * 100}%)</span>}
      </div>
      <div className="flex items-baseline justify-center gap-3 mb-1">
        <span className="text-4xl font-extrabold tracking-tight">{r.perPcPLN.min}</span>
        <span className="text-xl text-neutral-600">—</span>
        <span className="text-4xl font-extrabold tracking-tight">{r.perPcPLN.max}</span>
        <span className="text-base font-semibold text-neutral-500">PLN</span>
      </div>
      <div className="text-center text-sm text-neutral-600 mb-5">
        {r.perPcEUR.min} — {r.perPcEUR.max} EUR
      </div>

      {/* Order total */}
      {r.qty > 1 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">
            {labels.order}: ~{r.qty} {labels.pcs}
          </div>
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-2xl font-extrabold text-blue-400">{r.totalPLN.min}</span>
            <span className="text-neutral-600">—</span>
            <span className="text-2xl font-extrabold text-blue-400">{r.totalPLN.max}</span>
            <span className="text-sm font-semibold text-neutral-500">PLN</span>
          </div>
          <div className="text-center text-xs text-neutral-600 mt-1">
            {r.totalEUR.min} — {r.totalEUR.max} EUR
          </div>
        </div>
      )}

      {/* Breakdown toggle */}
      {r.breakdown && (
        <>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-neutral-500 text-xs hover:text-neutral-300 transition-colors"
          >
            {showBreakdown ? "▲ " + labels.hideDetails : "▼ " + labels.showDetails}
          </button>
          {showBreakdown && (
            <div className="mt-3 p-4 bg-white/[0.02] rounded-xl text-sm space-y-1">
              {r.breakdown.map((row, i) => (
                row.divider ? <div key={i} className="border-t border-white/5 my-2" /> :
                <div key={i} className={`flex justify-between ${row.bold ? "font-bold" : ""} ${row.accent ? "text-blue-400" : ""}`}>
                  <span className="text-neutral-500">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div className="mt-2 text-[11px] text-neutral-600 italic">
                {labels.rangeNote.replace("{low}", CONFIG.TOLERANCE_LOW * 100).replace("{high}", CONFIG.TOLERANCE_HIGH * 100)}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

const RESULT_LABELS = {
  pl: {
    perPiece: "Cena za sztukę",
    order: "Zamówienie",
    pcs: "szt.",
    showDetails: "Pokaż szczegóły kalkulacji",
    hideDetails: "Ukryj szczegóły",
    customQuote: "Wycena indywidualna",
    customDesc: "Wybrano parametry niestandardowe — skontaktuj się w celu dokładnej wyceny.",
    selectAll: "Wybierz wszystkie parametry",
    rangeNote: "Zakres: -{low}% / +{high}% · Kurs {rate} PLN/EUR".replace("{rate}", CONFIG.EUR_PLN_RATE),
  },
  en: {
    perPiece: "Price per piece",
    order: "Order",
    pcs: "pcs",
    showDetails: "Show calculation details",
    hideDetails: "Hide details",
    customQuote: "Individual quote",
    customDesc: "Custom parameters selected — contact us for an exact quote.",
    selectAll: "Select all parameters",
    rangeNote: "Range: -{low}% / +{high}% · Rate {rate} PLN/EUR".replace("{rate}", CONFIG.EUR_PLN_RATE),
  },
  de: {
    perPiece: "Preis pro Stück",
    order: "Bestellung",
    pcs: "Stk.",
    showDetails: "Kalkulationsdetails anzeigen",
    hideDetails: "Details ausblenden",
    customQuote: "Individuelle Kalkulation",
    customDesc: "Individuelle Parameter gewählt — kontaktieren Sie uns für ein genaues Angebot.",
    selectAll: "Alle Parameter auswählen",
    rangeNote: "Bereich: -{low}% / +{high}% · Kurs {rate} PLN/EUR".replace("{rate}", CONFIG.EUR_PLN_RATE),
  },
};
