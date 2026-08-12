// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/data/castingAlloys.js
// Regeneracja: npm run sync:pricing

// ============================================================
// STOPY ODLEWNICZE: skurcz i gestosc
// ============================================================
// Jedno zrodlo dla trzech miejsc naraz: kalkulatora kompensacji skurczu,
// generatora pierscionkow i wyceny masy. Wczesniej wspolczynniki siedzialy
// w samym kalkulatorze, wiec generator musialby je przepisac, a przepisane
// liczby rozjezdzaja sie przy pierwszej korekcie.
//
// `shrink` to mnoznik POWIEKSZAJACY model przed drukiem, zeby gotowy odlew
// mial docelowy wymiar. Ag 925 kurczy sie o okolo 1,6 procent, wiec model
// drukujemy razy 1,016.
//
// `density` w g/cm3 dotyczy STOPU, nie czystego kruszcu. Zloto 585 to nie
// jest 19,3 przemnozone przez prone: reszta stopu tez wazy.

// `metal` i `purity` sa tu po to, zeby wycena mogla siegnac po ten sam kurs,
// z ktorego korzystaja pozostale kalkulatory. Koszt kruszcu liczymy jak wszedzie
// indziej: masa razy cena czystego metalu razy proba, bo domieszka jest tania.
export const CASTING_ALLOYS = {
  ag925: { shrink: 1.016,  density: 10.36, metal: "silver", purity: 0.925,
           label: { pl: "Ag 925", en: "Ag 925", de: "Ag 925" } },
  au9k:  { shrink: 1.021,  density: 11.30, metal: "gold", purity: 0.375,
           label: { pl: "Au 9K", en: "Au 9K", de: "Au 9K" } },
  au585: { shrink: 1.0196, density: 13.10, metal: "gold", purity: 0.585,
           label: { pl: "Au 585 (14K)", en: "Au 585 (14K)", de: "Au 585 (14K)" } },
  au750: { shrink: 1.018,  density: 15.50, metal: "gold", purity: 0.750,
           label: { pl: "Au 750 (18K)", en: "Au 750 (18K)", de: "Au 750 (18K)" } },
};

/** Stary klucz kalkulatora skurczu. Zostaje, zeby nie zmieniac adresow i zapisow. */
export const ALLOY_ALIASES = { au18k: "au750" };

export function alloy(id) {
  return CASTING_ALLOYS[ALLOY_ALIASES[id] || id] || null;
}

/** Masa w gramach z objetosci w mm3. */
export function massGrams(volumeMm3, alloyId) {
  const a = alloy(alloyId);
  if (!a) return null;
  return (volumeMm3 / 1000) * a.density;
}
