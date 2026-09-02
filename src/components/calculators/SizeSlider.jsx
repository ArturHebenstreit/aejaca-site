// ============================================================
// SUWAK WIELKOSCI (uproszczony kalkulator sTuDiO)
// ============================================================
// Komponent czysto prezentacyjny: dostaje centymetry, oddaje centymetry.
// Skala pod spodem jest logarytmiczna, bo liniowy zakres 1-100 cm zostawialby
// bizuterii i brelokom ulamek procenta drogi suwaka, wiec nie dalyby sie
// trafic palcem. Kazda kategoria dostaje porownywalny kawalek trasy.
//
// Logika, ktora musi byc testowalna bez React, stoi w wyeksportowanych
// funkcjach ponizej (categoryForCm, posToCm, cmToPos). JSX ich nie dotyka
// poza wywolaniem.

import { useId, useMemo } from "react";

/** Gornej granice kategorii pilnuje reszta kalkulatora (mapowanie technologii
 * i cen), wiec identyfikatory sa stale i nie wolno ich zmieniac. */
export const SIZE_CATEGORIES = [
  { id: "coin", maxCm: 3 },
  { id: "palm", maxCm: 10 },
  { id: "book", maxCm: 25 },
  { id: "box", maxCm: 40 },
  { id: "bigger", maxCm: Infinity },
];

const CATEGORY_LABELS = {
  coin: { pl: "Jak moneta", en: "Coin-sized", de: "Münzgröße" },
  palm: { pl: "Jak dłoń", en: "Palm-sized", de: "Handflächengröße" },
  book: { pl: "Jak książka", en: "Book-sized", de: "Buchgröße" },
  box: { pl: "Pudełko po butach", en: "Shoebox", de: "Schuhkarton" },
  bigger: { pl: "Większe", en: "Bigger", de: "Größer" },
};

export function categoryForCm(cm) {
  const hit = SIZE_CATEGORIES.find((c) => cm <= c.maxCm);
  return (hit ?? SIZE_CATEGORIES[SIZE_CATEGORIES.length - 1]).id;
}

/** Gestosc suwaka pod spodem. Wiecej krokow, plynniejszy ruch palca. */
export const RANGE_STEPS = 1000;

/** Pozycja suwaka (0..RANGE_STEPS) na centymetry, skala logarytmiczna. */
export function posToCm(pos, minCm, maxCm, steps = RANGE_STEPS) {
  const clampedPos = Math.min(Math.max(pos, 0), steps);
  const ratio = maxCm / minCm;
  return minCm * Math.pow(ratio, clampedPos / steps);
}

/** Centymetry na pozycje suwaka. Odwrotnosc posToCm. */
export function cmToPos(cm, minCm, maxCm, steps = RANGE_STEPS) {
  const clampedCm = Math.min(Math.max(cm, minCm), maxCm);
  const ratio = maxCm / minCm;
  return (steps * Math.log(clampedCm / minCm)) / Math.log(ratio);
}

function formatCm(cm) {
  return cm < 10 ? cm.toFixed(1) : String(Math.round(cm));
}

function t(obj, lang) {
  return obj[lang] || obj.pl;
}

/**
 * Suwak wielkosci modelu, w centymetrach, na skali logarytmicznej.
 *
 * Nie liczy niczego poza wlasnym odwzorowaniem pozycja<->cm. Kategoria,
 * dopasowanie do pola roboczego i wycena zyja poza tym komponentem.
 */
export default function SizeSlider({
  valueCm,
  onChange,
  originalCm = null,
  fitCm = null,
  minCm = 1,
  maxCm = 100,
  lang = "pl",
}) {
  const id = useId();
  const clampedValue = Math.min(Math.max(valueCm, minCm), maxCm);
  const pos = Math.round(cmToPos(clampedValue, minCm, maxCm));
  const category = categoryForCm(clampedValue);

  // Segmenty do podpisania trasy: kazda kategoria dostaje kawalek miedzy
  // wlasna dolna a gorna granica, przycietymi do [minCm, maxCm].
  const segments = useMemo(() => {
    const out = [];
    let lo = minCm;
    for (const c of SIZE_CATEGORIES) {
      const hi = Math.min(maxCm, c.maxCm);
      if (hi > lo) {
        out.push({
          id: c.id,
          startPct: (cmToPos(lo, minCm, maxCm) / RANGE_STEPS) * 100,
          endPct: (cmToPos(hi, minCm, maxCm) / RANGE_STEPS) * 100,
        });
      }
      lo = Math.min(maxCm, c.maxCm);
      if (lo >= maxCm) break;
    }
    return out;
  }, [minCm, maxCm]);

  // Znaczniki granic, czyli koniec kazdego segmentu opisanego wyzej, poza
  // samym koncem trasy (nic po nim juz nie zaczyna).
  const boundaryTicks = segments.slice(0, -1).map((s) => s.endPct);

  const originalPct = originalCm != null
    ? (cmToPos(originalCm, minCm, maxCm) / RANGE_STEPS) * 100
    : null;

  const fitPct = fitCm != null
    ? (cmToPos(Math.min(fitCm, maxCm), minCm, maxCm) / RANGE_STEPS) * 100
    : null;
  const overFit = fitCm != null && clampedValue > fitCm;

  const handleChange = (e) => {
    onChange(posToCm(Number(e.target.value), minCm, maxCm));
  };

  const resetToOriginal = () => {
    if (originalCm != null) onChange(originalCm);
  };

  const valueText = `${formatCm(clampedValue)} cm, ${t(CATEGORY_LABELS[category], lang)}`;

  // Ten gradient ZOSTAJE kolorowy, w odroznieniu od reszty kalkulatora
  // (odbarwionej 2026-09-02). Zielen do `fitPct` znaczy "miesci sie na stole
  // roboczym", bursztyn dalej znaczy "nie miesci sie": kolor niesie tu tresc,
  // a nie stan wybrania. Odbarwienie skasowaloby informacje, a nie ozdobe.
  // Stan "wybrane" w tym samym komponencie idzie juz przez `--ds-wybor`
  // (klasa `suwak-wybor` na uchwycie i biala etykieta aktywnej kategorii).
  const trackStyle = fitPct != null
    ? {
        background: `linear-gradient(to right, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0.35) ${fitPct}%, rgba(251,191,36,0.35) ${fitPct}%, rgba(251,191,36,0.35) 100%)`,
      }
    : { background: "rgba(16,185,129,0.30)" };

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          {t({ pl: "Wielkość", en: "Size", de: "Größe" }, lang)}
        </span>
        {/* Odczyt zmienia barwe razem ze sciezka, gdy wielkosc wychodzi poza
            pole robocze. Kolor przy samej liczbie widac wczesniej niz kolor
            odcinka trasy, ktory jest w drugim koncu kontrolki. */}
        <span className={`text-xs font-medium ${overFit ? "text-amber-300" : "text-white"}`}>
          {formatCm(clampedValue)} cm &middot; {t(CATEGORY_LABELS[category], lang)}
        </span>
      </div>

      <div className="relative pt-4 pb-6">
        {/* Znacznik oryginalu, nad trasa */}
        {originalPct != null && (
          <button
            type="button"
            onClick={resetToOriginal}
            className="absolute top-0 flex flex-col items-center text-xs text-neutral-400 hover:text-white transition-colors"
            style={{ left: `${originalPct}%`, transform: "translateX(-50%)" }}
          >
            <span>{t({ pl: "oryginał", en: "original", de: "Original" }, lang)}</span>
            <span className="block w-px h-2 bg-white/40" />
          </button>
        )}

        {/* Trasa: zielona w polu roboczym, burstynowa poza nim */}
        <div
          className="absolute inset-x-0 top-[22px] h-1.5 rounded-full pointer-events-none"
          style={trackStyle}
        />

        {/* Znaczniki granic kategorii na trasie */}
        {boundaryTicks.map((pct, i) => (
          <span
            key={i}
            className="absolute top-[19px] w-px h-4 bg-white/25 pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        ))}

        <input
          id={id}
          type="range"
          min={0}
          max={RANGE_STEPS}
          step={1}
          value={pos}
          onChange={handleChange}
          className="relative w-full h-1.5 suwak-wybor"
          aria-label={t({ pl: "Wielkość modelu", en: "Model size", de: "Modellgröße" }, lang)}
          aria-valuetext={valueText}
          aria-valuemin={minCm}
          aria-valuemax={maxCm}
          aria-valuenow={Math.round(clampedValue * 10) / 10}
        />

        {/* Podpisy kategorii pod trasa, aktywna wyrozniona */}
        <div className="relative mt-1 h-4">
          {segments.map((s) => {
            const centerPct = (s.startPct + s.endPct) / 2;
            const active = s.id === category;
            return (
              <span
                key={s.id}
                className={`absolute top-0 -translate-x-1/2 text-xs whitespace-nowrap ${
                  active ? "text-white font-semibold" : "text-neutral-400"
                }`}
                style={{ left: `${centerPct}%` }}
              >
                {t(CATEGORY_LABELS[s.id], lang)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Zdania o przekroczeniu pola roboczego TU NIE MA i to jest swiadome.
          Sam fakt widac na sciezce, ktora powyzej granicy robi sie bursztynowa,
          a wyjasnienie razem z wyjsciem (pomniejsz albo potnij i sklej) podaje
          rodzic. Dwa razy to samo zdanie obok siebie czyta sie jak usterka. */}
    </div>
  );
}
