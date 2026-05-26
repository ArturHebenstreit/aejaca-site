const TITLE = {
  pl: "Szacunkowa waga",
  en: "Estimated Weight",
  de: "Geschätztes Gewicht",
};

const CLIENT_METAL_TEXT = {
  pl: (bruttoG, metalName) => `Kruszec od klienta: dostarcz ${bruttoG.toFixed(1)} g ${metalName}`,
  en: (bruttoG, metalName) => `Client supplies metal: provide ${bruttoG.toFixed(1)} g of ${metalName}`,
  de: (bruttoG, metalName) => `Metall vom Kunden: ${bruttoG.toFixed(1)} g ${metalName} bereitstellen`,
};

const CLIENT_METAL_NOTE = {
  pl: "Weryfikujemy próbę i wagę (+1–2 dni robocze)",
  en: "We verify purity and weight (+1–2 business days)",
  de: "Wir prüfen Reinheit und Gewicht (+1–2 Werktage)",
};

const DISCLAIMER = {
  pl: "Szacunek ±15–20%. Dokładna waga podawana po wizualizacji projektu.",
  en: "Estimate ±15–20%. Exact weight provided after project visualization.",
  de: "Schätzung ±15–20%. Genaues Gewicht nach Projektvisualisierung.",
};

const LABEL_NETTO = { pl: "Netto", en: "Netto", de: "Netto" };
const LABEL_BRUTTO = { pl: "Brutto", en: "Brutto", de: "Brutto" };

export default function WeightDisplay({ nettoG, bruttoG, metalName, lang, clientSuppliesMetal }) {
  const l = lang || "pl";

  // Netto bar is ~87% of brutto bar width (100/1.15)
  const nettoPercent = bruttoG > 0 ? Math.round((nettoG / bruttoG) * 100) : 87;

  return (
    <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/15 [data-theme='light']:bg-amber-50 [data-theme='light']:border-amber-200">
      <div className="text-xs font-medium text-amber-400 [data-theme='light']:text-amber-700 uppercase tracking-wide mb-3">
        {TITLE[l]}
      </div>

      {/* Netto row */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-neutral-500 w-14 shrink-0">{LABEL_NETTO[l]}</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${nettoPercent}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-white [data-theme='light']:text-neutral-900 w-14 text-right">
          {nettoG.toFixed(1)} g
        </span>
      </div>

      {/* Brutto row */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500 w-14 shrink-0">{LABEL_BRUTTO[l]}</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400/40 rounded-full transition-all duration-500"
            style={{ width: "100%" }}
          />
        </div>
        <span className="text-sm font-semibold text-white [data-theme='light']:text-neutral-900 w-14 text-right">
          {bruttoG.toFixed(1)} g
        </span>
      </div>

      {/* Client supplies metal notice */}
      {clientSuppliesMetal && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs font-medium text-amber-300 [data-theme='light']:text-amber-700">
            {CLIENT_METAL_TEXT[l](bruttoG, metalName)}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {CLIENT_METAL_NOTE[l]}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-2 text-[11px] text-neutral-600 leading-relaxed">
        {DISCLAIMER[l]}
      </div>
    </div>
  );
}
