// ============================================================
// WARTOSC METALU SZLACHETNEGO
// ============================================================
// Kalkulator obsluguje dwie intencje na raz i to jest celowe:
//
//   "ile warte jest moje zloto"      - ktos ma zlom w szufladzie i chce wiedziec,
//                                      ile realnie dostanie w skupie
//   "ile kosztuje gram zlota 585"    - ktos liczy koszt materialu do projektu
//
// Roznica miedzy nimi to nie inny wzor, tylko inna liczba na koncu. Wartosc
// kruszcu jest jedna, a cena skupu to jej ulamek. Dlatego widelki skupu sa tu
// osobna karta z konkretna kwota, a nie zdaniem petitem pod spodem. Ktos, kto
// zobaczy 4000 PLN i dostanie 3000, poczuje sie oszukany przez nas, mimo ze
// nie my skupujemy.
//
// Celowo BEZ `useMarketRates`: ten hook ma wartosci zapasowe (au 645 PLN/g),
// ktore w pasku w stopce sa akceptowalne, a w wycenie czyjegos zlota juz nie.
// Nieaktualna cena podana jako wartosc majatku szkodzi bardziej niz jej brak,
// wiec przy braku kursow prosimy o reczne wpisanie ceny uncji.

import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const API = "https://aejacachatapi-production.up.railway.app";
const TROY_OZ_TO_GRAM = 31.1035;

// Realny udzial ceny skupu w wartosci kruszcu. Dolna granica dotyczy drobnych
// sztuk i niskich prob, gorna wiekszych partii proby 585 i wyzej.
const BUYBACK_MIN = 0.7;
const BUYBACK_MAX = 0.9;

const LABELS = {
  pl: {
    metalLabel: "Metal",
    purityLabel: "Próba",
    weightLabel: "Masa w gramach",
    weightPlaceholder: "np. 15.5",
    weightHint: "Waż bez kamieni, sznurków i zapięć z innego metalu.",
    resultTitle: "Wynik",
    metalValue: "Wartość kruszcu",
    buyback: "Realnie w skupie (70 do 90%)",
    rangeTo: "do",
    perGramAlloy: "Za gram próby {{purity}}",
    tableTitle: "Cena za gram według próby",
    tablePurity: "Próba",
    tableKarat: "Karaty",
    tableGram: "Za 1 g",
    disclaimer: "To wartość samego kruszcu przy dzisiejszej cenie spot, a nie oferta kupna. Skup odejmuje swoją marżę i koszt rafinacji, dlatego realna wypłata mieści się zwykle w przedziale 70 do 90% tej kwoty. Wyroby sygnowane, zabytkowe albo w dobrym stanie bywają warte znacznie więcej jako biżuteria niż jako złom.",
    spotSource: "Kursy metali i NBP, aktualizacja co 60 minut. Źródła w stopce strony.",
    manualPrice: "Brak kursu dla tego metalu. Wpisz cenę 1 uncji troy w PLN",
    manualHint: "Uncja troy to 31,1035 g.",
    loading: "Pobieranie cen rynkowych...",
  },
  en: {
    metalLabel: "Metal",
    purityLabel: "Purity",
    weightLabel: "Weight in grams",
    weightPlaceholder: "e.g. 15.5",
    weightHint: "Weigh without stones, cords or clasps made of another metal.",
    resultTitle: "Result",
    metalValue: "Metal value",
    buyback: "Realistic buy-back (70 to 90%)",
    rangeTo: "to",
    perGramAlloy: "Per gram of {{purity}}",
    tableTitle: "Price per gram by purity",
    tablePurity: "Purity",
    tableKarat: "Karat",
    tableGram: "Per 1 g",
    disclaimer: "This is the value of the metal itself at today's spot price, not an offer to buy. A buyer deducts their margin and the cost of refining, so the actual payout usually lands between 70 and 90% of this figure. Signed, antique or well-preserved pieces are often worth considerably more as jewelry than as scrap.",
    spotSource: "Metal and NBP rates, refreshed hourly. Sources in the page footer.",
    manualPrice: "No rate for this metal. Enter the price of 1 troy ounce in PLN",
    manualHint: "A troy ounce is 31.1035 g.",
    loading: "Loading market prices...",
  },
  de: {
    metalLabel: "Metall",
    purityLabel: "Feingehalt",
    weightLabel: "Gewicht in Gramm",
    weightPlaceholder: "z.B. 15.5",
    weightHint: "Ohne Steine, Bänder und Verschlüsse aus anderem Metall wiegen.",
    resultTitle: "Ergebnis",
    metalValue: "Materialwert",
    buyback: "Realistischer Ankauf (70 bis 90%)",
    rangeTo: "bis",
    perGramAlloy: "Pro Gramm {{purity}}",
    tableTitle: "Preis pro Gramm nach Feingehalt",
    tablePurity: "Feingehalt",
    tableKarat: "Karat",
    tableGram: "Pro 1 g",
    disclaimer: "Dies ist der Wert des Metalls zum heutigen Spotpreis, kein Kaufangebot. Ein Ankäufer zieht seine Marge und die Scheidekosten ab, die tatsächliche Auszahlung liegt daher meist bei 70 bis 90% dieses Betrags. Signierte, antike oder gut erhaltene Stücke sind als Schmuck oft deutlich mehr wert als als Altgold.",
    spotSource: "Metall- und NBP-Kurse, stündlich aktualisiert. Quellen in der Fußzeile.",
    manualPrice: "Kein Kurs für dieses Metall. Preis für 1 Feinunze in PLN eingeben",
    manualHint: "Eine Feinunze entspricht 31,1035 g.",
    loading: "Marktpreise werden geladen...",
  },
};

// Proby faktycznie spotykane w obrocie. Au 333 jest tu, bo w Niemczech to
// najczestsza proba w starszej bizuterii, a niemiecki to jeden z trzech
// jezykow serwisu. Au 417 to amerykanskie 10k, ktore przychodzi w spadkach.
const PURITIES = {
  Au: [
    { fineness: 999, karat: "24K" },
    { fineness: 916, karat: "22K" },
    { fineness: 750, karat: "18K" },
    { fineness: 585, karat: "14K" },
    { fineness: 417, karat: "10K" },
    { fineness: 375, karat: "9K" },
    { fineness: 333, karat: "8K" },
  ],
  Ag: [
    { fineness: 999 },
    { fineness: 958, note: "Britannia" },
    { fineness: 925, note: "Sterling" },
    { fineness: 830 },
    { fineness: 800 },
  ],
  Pt: [
    { fineness: 999 },
    { fineness: 950 },
    { fineness: 900 },
    { fineness: 850 },
  ],
  Pd: [
    { fineness: 999 },
    { fineness: 950 },
    { fineness: 500 },
  ],
};

const METALS = ["Au", "Ag", "Pt", "Pd"];

const METAL_NAMES = {
  pl: { Au: "Złoto", Ag: "Srebro", Pt: "Platyna", Pd: "Pallad" },
  en: { Au: "Gold", Ag: "Silver", Pt: "Platinum", Pd: "Palladium" },
  de: { Au: "Gold", Ag: "Silber", Pt: "Platin", Pd: "Palladium" },
};

const LOCALES = { pl: "pl-PL", en: "en-GB", de: "de-DE" };

function purityLabel(metal, p) {
  const base = `${metal} ${p.fineness}`;
  if (p.karat) return `${base} (${p.karat})`;
  if (p.note) return `${base} (${p.note})`;
  return base;
}

export default function MetalPricingCalc() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const locale = LOCALES[lang] || LOCALES.pl;
  const showEur = lang === "en" || lang === "de";
  const metalNames = METAL_NAMES[lang] || METAL_NAMES.pl;

  const [selectedMetal, setSelectedMetal] = useState("Au");
  const [selectedFineness, setSelectedFineness] = useState(585);
  const [weight, setWeight] = useState("");
  const [prices, setPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [manualOzPrice, setManualOzPrice] = useState("");

  useEffect(() => {
    fetch(`${API}/api/market-rates`)
      .then((r) => r.json())
      .then((data) => {
        setPrices({
          Au_pln_per_g: data.au_pln_per_g ?? null,
          Ag_pln_per_g: data.ag_pln_per_g ?? null,
          Pt_pln_per_g: data.pt_pln_per_g ?? null,
          Pd_pln_per_g: data.pd_pln_per_g ?? null,
          plnPerEur: data.pln_per_eur ?? 4.25,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, []);

  function handleMetalSelect(m) {
    setSelectedMetal(m);
    // Domyslna proba dla nowego metalu: ta, ktora ludzie faktycznie maja.
    // Dla zlota 585, nie 999, bo sztabek w szufladzie jest znacznie mniej
    // niz starych obraczek.
    const preferred = { Au: 585, Ag: 925, Pt: 950, Pd: 950 }[m];
    const list = PURITIES[m];
    setSelectedFineness(list.some((p) => p.fineness === preferred) ? preferred : list[0].fineness);
    setManualOzPrice("");
  }

  const plnPerEur = prices?.plnPerEur || 4.25;
  const spotFromApi = prices ? prices[`${selectedMetal}_pln_per_g`] : null;
  const spotFromManual = manualOzPrice ? parseFloat(manualOzPrice) / TROY_OZ_TO_GRAM : null;
  // Reczna cena jest zapasem dla KAZDEGO braku kursu, nie tylko dla awarii
  // calego API. Pallad potrafi byc pusty, gdy odpowiedz przyszla, ale bez tego
  // pola, a wtedy poprzednia wersja pokazywala pusta strone bez wyjscia.
  const spotPerGramPure = spotFromApi ?? spotFromManual;
  const needsManual = !loadingPrices && spotFromApi == null;

  const purityRatio = selectedFineness / 1000;
  const spotPerGramAlloy = spotPerGramPure != null ? spotPerGramPure * purityRatio : null;

  const weightNum = parseFloat(weight);
  const hasWeight = !isNaN(weightNum) && weightNum > 0;
  const totalPln = spotPerGramAlloy != null && hasWeight ? spotPerGramAlloy * weightNum : null;

  function fmt(pln, digits = 2) {
    const val = showEur ? pln / plnPerEur : pln;
    const num = val.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return `${num} ${showEur ? "EUR" : "PLN"}`;
  }
  function fmtAlt(pln, digits = 2) {
    const val = showEur ? pln : pln / plnPerEur;
    const num = val.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return `${num} ${showEur ? "PLN" : "EUR"}`;
  }

  const selected = PURITIES[selectedMetal].find((p) => p.fineness === selectedFineness);
  const hasKarat = PURITIES[selectedMetal].some((p) => p.karat);

  return (
    <div className="space-y-6">

      {/* Metal */}
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
              {metalNames[m]} <span className="text-neutral-300 font-normal">({m})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Proba */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.purityLabel}</div>
        <div className="flex flex-wrap gap-2">
          {PURITIES[selectedMetal].map((p) => (
            <button
              key={p.fineness}
              onClick={() => setSelectedFineness(p.fineness)}
              className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all duration-200 ${
                selectedFineness === p.fineness
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
              }`}
            >
              {purityLabel(selectedMetal, p)}
            </button>
          ))}
        </div>
      </div>

      {loadingPrices && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin shrink-0" />
          {L.loading}
        </div>
      )}

      {needsManual && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <label className="block text-xs uppercase tracking-widest text-amber-400 mb-2" htmlFor="mp-manual">
            {L.manualPrice}
          </label>
          <input
            id="mp-manual"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={manualOzPrice}
            onChange={(e) => setManualOzPrice(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder:text-neutral-600"
          />
          <p className="text-neutral-500 text-xs mt-2">{L.manualHint}</p>
        </div>
      )}

      {/* Masa */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <label className="block text-xs uppercase tracking-widest text-amber-400 mb-2" htmlFor="mp-weight">
          {L.weightLabel}
        </label>
        <input
          id="mp-weight"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={L.weightPlaceholder}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder:text-neutral-600"
        />
        <p className="text-neutral-500 text-xs mt-2">{L.weightHint}</p>
      </div>

      {/* Wynik */}
      {spotPerGramPure != null && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-amber-400/20 space-y-4">
          <div className="text-xs uppercase tracking-widest text-amber-400">{L.resultTitle}</div>

          <div className="bg-neutral-800/60 rounded-xl p-3">
            <div className="text-neutral-400 text-xs mb-1">
              {L.perGramAlloy.replace("{{purity}}", purityLabel(selectedMetal, selected))}
            </div>
            <div className="text-white font-mono font-semibold text-sm">{fmt(spotPerGramAlloy)}</div>
          </div>

          {totalPln != null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4">
                <div className="text-amber-300 text-xs mb-1">{L.metalValue}</div>
                <div className="text-white font-mono font-bold text-xl">{fmt(totalPln)}</div>
                <div className="text-neutral-400 font-mono text-xs mt-1">{fmtAlt(totalPln)}</div>
              </div>
              {/* Widelki skupu jako osobna karta o tej samej wadze wizualnej.
                  Schowane pod dyskretnym zdaniem sprawialyby, ze czytelnik
                  zapamieta tylko wieksza liczbe. */}
              <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-4">
                <div className="text-neutral-300 text-xs mb-1">{L.buyback}</div>
                <div className="text-white font-mono font-bold text-xl">
                  {fmt(totalPln * BUYBACK_MIN, 0)}
                  <span className="text-neutral-300 font-normal font-sans text-sm"> {L.rangeTo} </span>
                  {fmt(totalPln * BUYBACK_MAX, 0)}
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-3">
            <p className="text-neutral-400 text-xs leading-relaxed">{L.disclaimer}</p>
          </div>

          {prices && <div className="text-neutral-500 text-xs">{L.spotSource}</div>}
        </div>
      )}

      {/* Tabela cen za gram. Uzyteczna bez wpisywania czegokolwiek, wiec
          odpowiada na zapytanie "cena zlota 585 za gram" od razu po wejsciu
          i nadaje sie do zacytowania przez wyszukiwarki i asystentow. */}
      {spotPerGramPure != null && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.tableTitle}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="text-left font-medium pb-2">{L.tablePurity}</th>
                  {hasKarat && <th className="text-left font-medium pb-2">{L.tableKarat}</th>}
                  <th className="text-right font-medium pb-2">{L.tableGram}</th>
                </tr>
              </thead>
              <tbody>
                {PURITIES[selectedMetal].map((p) => (
                  <tr
                    key={p.fineness}
                    className={`border-t border-neutral-800 ${
                      p.fineness === selectedFineness ? "text-amber-300" : "text-neutral-300"
                    }`}
                  >
                    <td className="py-2">
                      {selectedMetal} {p.fineness}
                      {p.note && <span className="text-neutral-500"> ({p.note})</span>}
                    </td>
                    {hasKarat && <td className="py-2 text-neutral-400">{p.karat || ""}</td>}
                    <td className="py-2 text-right font-mono">
                      {fmt(spotPerGramPure * (p.fineness / 1000))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
