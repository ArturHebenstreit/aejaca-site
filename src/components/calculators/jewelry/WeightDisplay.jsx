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

// Consigned-material (materiał powierzony) liability note — in the name of the AEJaCA team
const CONSIGNED_NOTE = {
  pl: "Materiał powierzony: kruszec przyjmujemy na podstawie deklarowanej próby. Przy odbiorze ważymy i fotografujemy każdy element oraz weryfikujemy stop (gęstość, próba kwasowa); w razie wątpliwości proponujemy analizę w Urzędzie Probierczym przed wykonaniem (koszt po stronie Klienta). Zespół AEJaCA nie odpowiada za wady wyrobu wynikające z faktycznego składu powierzonego materiału, jeśli odbiega on od deklaracji.",
  en: "Consigned material: we accept metal based on its declared fineness. On receipt we weigh and photograph each item and verify the alloy (density, acid test); if in doubt we propose an assay at the State Assay Office before production (cost borne by the Client). The AEJaCA team is not liable for defects in the finished piece resulting from the supplied material's actual composition differing from the declaration.",
  de: "Beigestelltes Material: Wir nehmen das Metall auf Basis der angegebenen Feinheit an. Bei Annahme wiegen und fotografieren wir jedes Teil und prüfen die Legierung (Dichte, Säuretest); im Zweifel schlagen wir vor der Fertigung eine Analyse beim Punzierungsamt vor (Kosten trägt der Kunde). Das AEJaCA-Team haftet nicht für Mängel des fertigen Stücks, die sich aus einer von der Angabe abweichenden tatsächlichen Zusammensetzung des beigestellten Materials ergeben.",
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

      {/* Weight bars — only render when valid */}
      {nettoG > 0 && bruttoG > 0 && (
        <>
          {/* Netto row */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-neutral-500 w-14 shrink-0">{LABEL_NETTO[l]}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${nettoPercent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-white [data-theme='light']:text-neutral-900 w-16 text-right shrink-0">
              {nettoG.toFixed(2)} g
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
            <span className="text-sm font-semibold text-white [data-theme='light']:text-neutral-900 w-16 text-right shrink-0">
              {bruttoG.toFixed(2)} g
            </span>
          </div>
        </>
      )}

      {/* Client supplies metal notice */}
      {clientSuppliesMetal && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs font-medium text-amber-300 [data-theme='light']:text-amber-700">
            {CLIENT_METAL_TEXT[l](bruttoG, metalName)}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {CLIENT_METAL_NOTE[l]}
          </div>
          <div className="text-[11px] leading-relaxed text-neutral-400 mt-2 pt-2 border-t border-amber-500/15">
            {CONSIGNED_NOTE[l]}
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
