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
// `colorDensity` rozbija gestosc na kolory stopu, bo to NIE jest kosmetyka.
// Bialy stop bierze gestsze domieszki, pal lad albo nikiel, i przy tej samej
// bryle wazy zauwazalnie wiecej niz zolty: dla proby 585 roznica siega
// dwunastu procent. Liczenie masy z jednej wartosci zanizaloby wycene
// bialego zlota o tyle samo, a metal jest tu glownym skladnikiem ceny.
//
// Wartosci sa typowe dla stopow odlewniczych i moga sie roznic o kilka
// dziesiatych w zaleznosci od receptury. Biale zloto na palladzie jest
// ciezsze od niklowego, wiec przy zmianie dostawcy warto to sprawdzic.
export const CASTING_ALLOYS = {
  ag925: { shrink: 1.016,  density: 10.36, metal: "silver", purity: 0.925,
           colors: ["white"],
           label: { pl: "Srebro 925", en: "Silver 925", de: "Silber 925" } },
  au9k:  { shrink: 1.021,  density: 11.30, metal: "gold", purity: 0.375,
           colorDensity: { yellow: 11.30, white: 11.90, rose: 11.20 },
           label: { pl: "Au 9K", en: "Au 9K", de: "Au 9K" } },
  au585: { shrink: 1.0196, density: 13.10, metal: "gold", purity: 0.585,
           colorDensity: { yellow: 13.10, white: 14.60, rose: 13.00 },
           label: { pl: "Au 585 (14K)", en: "Au 585 (14K)", de: "Au 585 (14K)" } },
  au750: { shrink: 1.018,  density: 15.50, metal: "gold", purity: 0.750,
           colorDensity: { yellow: 15.50, white: 15.90, rose: 15.20 },
           label: { pl: "Au 750 (18K)", en: "Au 750 (18K)", de: "Au 750 (18K)" } },
};

/**
 * Kolory stopu.
 *
 * `tone` to przyblizona barwa POLEROWANEJ powierzchni w sRGB, uzywana przez
 * podglad. Metal w renderze bierze barwe z odbicia, nie z rozproszenia, wiec
 * ta wartosc trafia do `color` materialu metalicznego i decyduje o tym, czy
 * zloto wyglada na zolte, czy na mosiadz.
 *
 * Srebro i biale zloto roznia sie w rzeczywistosci nieznacznie, ale biale
 * zloto jest rodowane, wiec na gotowym wyrobie widac rod, nie stop. Stad
 * ten sam chlodny odcien dla obu.
 */
export const METAL_COLORS = {
  yellow: { tone: "#e7c274", label: { pl: "żółte", en: "yellow", de: "gelb" } },
  white:  { tone: "#e9eaee", label: { pl: "białe", en: "white", de: "weiß" } },
  rose:   { tone: "#e5a488", label: { pl: "różowe", en: "rosé", de: "rosé" } },
};

/** Kolory dostepne dla danego stopu. Srebro ma jeden, i to nie jest wybor. */
export function colorsFor(alloyId) {
  const a = alloy(alloyId);
  if (!a) return [];
  return a.colors || Object.keys(a.colorDensity || { yellow: 0 });
}

/** Gestosc stopu w danym kolorze, z odwrotem na wartosc podstawowa. */
export function densityFor(alloyId, color) {
  const a = alloy(alloyId);
  if (!a) return null;
  return a.colorDensity?.[color] ?? a.density;
}

/** Stary klucz kalkulatora skurczu. Zostaje, zeby nie zmieniac adresow i zapisow. */
export const ALLOY_ALIASES = { au18k: "au750" };

export function alloy(id) {
  return CASTING_ALLOYS[ALLOY_ALIASES[id] || id] || null;
}

/**
 * Masa w gramach z objetosci w mm3.
 *
 * `color` jest opcjonalny i bez niego liczymy jak dotad, po gestosci
 * podstawowej. Kalkulator skurczu koloru nie zna i nie musi.
 */
export function massGrams(volumeMm3, alloyId, color) {
  const d = densityFor(alloyId, color);
  if (d == null) return null;
  return (volumeMm3 / 1000) * d;
}
