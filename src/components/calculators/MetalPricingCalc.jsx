import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const LABELS = {
  pl: {
    title: "Wycena metali szlachetnych",
    metalLabel: "Metal",
    purityLabel: "Próba",
    weightLabel: "Masa (g)",
    weightPlaceholder: "np. 15.5",
    resultTitle: "Wartość szacunkowa",
    perGramPure: "Za gram czystego metalu",
    perGramAlloy: "Za gram stopu {{purity}}‰",
    totalValue: "Łączna wartość {{weight}}g",
    disclaimer: "Wartość informacyjna. Cena skupu przez jubilerów/mennicy będzie niższa o 10–25%.",
    spotSource: "Źródła kursów: stopka strony",
    manualPrice: "Wpisz cenę 1 uncji troy (PLN)",
    loading: "Pobieranie cen rynkowych...",
  },
  en: {
    title: "Precious Metal Valuation",
    metalLabel: "Metal",
    purityLabel: "Purity",
    weightLabel: "Weight (g)",
    weightPlaceholder: "e.g. 15.5",
    resultTitle: "Estimated Value",
    perGramPure: "Per gram pure metal",
    perGramAlloy: "Per gram {{purity}}‰ alloy",
    totalValue: "Total value {{weight}}g",
    disclaimer: "Indicative value. Buyback price by jewelers/mint will be 10–25% lower.",
    spotSource: "Rate sources: see page footer",
    manualPrice: "Enter 1 troy oz price (PLN)",
    loading: "Loading market prices...",
  },
  de: {
    title: "Edelmetallbewertung",
    metalLabel: "Metall",
    purityLabel: "Feingehalt",
    weightLabel: "Gewicht (g)",
    weightPlaceholder: "z.B. 15.5",
    resultTitle: "Geschätzter Wert",
    perGramPure: "Pro Gramm Reinmetall",
    perGramAlloy: "Pro Gramm {{purity}}‰ Legierung",
    totalValue: "Gesamtwert {{weight}}g",
    disclaimer: "Richtwert. Rückkaufpreis durch Juweliere/Münzanstalt liegt 10–25 % darunter.",
    spotSource: "Kursquellen: Seitenfußzeile",
    manualPrice: "Preis pro Feinunze eingeben (PLN)",
    loading: "Marktpreise werden geladen...",
  },
};

const PURITIES = {
  Au: [
    { fineness: 999, label: "Au 999 (24k)" },
    { fineness: 916, label: "Au 916 (22k)" },
    { fineness: 750, label: "Au 750 (18k)" },
    { fineness: 585, label: "Au 585 (14k)" },
    { fineness: 375, label: "Au 375 (9k)" },
  ],
  Ag: [
    { fineness: 999, label: "Ag 999" },
    { fineness: 958, label: "Ag 958 (Britannia)" },
    { fineness: 925, label: "Ag 925 (Sterling)" },
    { fineness: 800, label: "Ag 800" },
  ],
  Pt: [
    { fineness: 950, label: "Pt 950" },
    { fineness: 900, label: "Pt 900" },
  ],
  Pd: [
    { fineness: 950, label: "Pd 950" },
  ],
};

const METALS = ["Au", "Ag", "Pt", "Pd"];
const TROY_OZ_TO_GRAM = 31.1035;

function fmtPln(val) {
  return val.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " PLN";
}
function fmtEur(val) {
  return val.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
}

export default function MetalPricingCalc() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;

  const [selectedMetal, setSelectedMetal] = useState("Au");
  const [selectedFineness, setSelectedFineness] = useState(750);
  const [weight, setWeight] = useState("");
  const [prices, setPrices] = useState(null); // { Au_pln_per_g, Ag_pln_per_g, ... updatedAt }
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [manualOzPrice, setManualOzPrice] = useState("");

  const metalLabels = { Au: "Złoto (Au)", Ag: "Srebro (Ag)", Pt: "Platyna (Pt)", Pd: "Pallad (Pd)" };

  useEffect(() => {
    fetch("https://aejacachatapi-production.up.railway.app/api/market-rates")
      .then((r) => r.json())
      .then((data) => {
        // Normalize field names from market-rates API to internal format
        setPrices({
          Au_pln_per_g: data.au_pln_per_g ?? null,
          Ag_pln_per_g: data.ag_pln_per_g ?? null,
          Pt_pln_per_g: data.pt_pln_per_g ?? null,
          Pd_pln_per_g: data.pd_pln_per_g ?? null,
          plnPerEur: data.pln_per_eur ?? 4.25,
          sources: data.sources ?? null,
          updatedAt: data.sources?.au_pln_per_g?.fetched_at
            || data.sources?.ag_pln_per_g?.fetched_at
            || null,
        });
        setLoadingPrices(false);
      })
      .catch(() => {
        setLoadingPrices(false);
      });
  }, []);

  // When metal changes, reset fineness to first option
  function handleMetalSelect(m) {
    setSelectedMetal(m);
    setSelectedFineness(PURITIES[m][0].fineness);
    setManualOzPrice("");
  }

  const priceKey = `${selectedMetal}_pln_per_g`;
  const spotPerGramPure = prices
    ? prices[priceKey] || null
    : manualOzPrice
    ? parseFloat(manualOzPrice) / TROY_OZ_TO_GRAM
    : null;

  const fineness = selectedFineness;
  const purityRatio = fineness / 1000;
  const spotPerGramAlloy = spotPerGramPure != null ? spotPerGramPure * purityRatio : null;
  const weightNum = parseFloat(weight);
  const totalPln = spotPerGramAlloy != null && !isNaN(weightNum) && weightNum > 0
    ? spotPerGramAlloy * weightNum
    : null;
  const plnPerEur = prices?.plnPerEur || 4.25;
  const totalEur = totalPln != null ? totalPln / plnPerEur : null;

  const updatedAt = prices?.updatedAt
    ? new Date(prices.updatedAt).toLocaleTimeString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "pl-PL", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-6">
      {/* Metal select */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.metalLabel}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METALS.map((m) => (
            <button
              key={m}
              onClick={() => handleMetalSelect(m)}
              className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                selectedMetal === m
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
              }`}
            >
              {metalLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Purity select */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.purityLabel}</div>
        <div className="flex flex-wrap gap-2">
          {(PURITIES[selectedMetal] || []).map((p) => (
            <button
              key={p.fineness}
              onClick={() => setSelectedFineness(p.fineness)}
              className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all duration-200 ${
                selectedFineness === p.fineness
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spot price: loading / manual fallback */}
      {loadingPrices && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin shrink-0" />
          {L.loading}
        </div>
      )}
      {!loadingPrices && !prices && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <label className="block text-xs uppercase tracking-widest text-amber-400 mb-2">{L.manualPrice}</label>
          <input
            type="number"
            min="0"
            step="any"
            value={manualOzPrice}
            onChange={(e) => setManualOzPrice(e.target.value)}
            placeholder="np. 8500"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder:text-neutral-600"
          />
        </div>
      )}

      {/* Weight input */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <label className="block text-xs uppercase tracking-widest text-amber-400 mb-2">{L.weightLabel}</label>
        <input
          type="number"
          min="0"
          step="any"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={L.weightPlaceholder}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder:text-neutral-600"
        />
      </div>

      {/* Result */}
      {spotPerGramPure != null && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-amber-400/20 space-y-4">
          <div className="text-xs uppercase tracking-widest text-amber-400">{L.resultTitle}</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-800/60 rounded-xl p-3">
              <div className="text-neutral-400 text-xs mb-1">{L.perGramPure}</div>
              <div className="text-white font-mono font-semibold text-sm">{fmtPln(spotPerGramPure)}</div>
            </div>
            <div className="bg-neutral-800/60 rounded-xl p-3">
              <div className="text-neutral-400 text-xs mb-1">
                {L.perGramAlloy.replace("{{purity}}", fineness)}
              </div>
              <div className="text-white font-mono font-semibold text-sm">{fmtPln(spotPerGramAlloy)}</div>
            </div>
            {totalPln != null && (
              <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                <div className="text-amber-300 text-xs mb-1">
                  {L.totalValue.replace("{{weight}}", weightNum.toFixed(weightNum % 1 === 0 ? 0 : 2))}
                </div>
                <div className="text-white font-mono font-bold text-base">{fmtPln(totalPln)}</div>
                <div className="text-neutral-400 font-mono text-xs mt-0.5">{fmtEur(totalEur)}</div>
              </div>
            )}
          </div>

          {prices && (
            <div className="text-neutral-500 text-xs">{L.spotSource}</div>
          )}

          <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-3">
            <p className="text-neutral-400 text-xs leading-relaxed">{L.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
