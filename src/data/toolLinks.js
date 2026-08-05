// ============================================================
// NARZEDZIA POWIAZANE Z KATEGORIA
// ============================================================
// Rejestr istnieje po to, zeby nowe narzedzie wpinalo sie w sklep i w karty
// uslug przez dopisanie jednego wpisu, a nie przez obchodzenie kilkunastu
// stron. Miarka do pierscionkow po zbudowaniu wisiala w powietrzu: linkowal
// do niej tylko hub narzedzi i konwerter rozmiarow, czyli miejsca, do
// ktorych klient trafia PO tym, jak juz jej poszukal.
//
// Kryterium wpisu jest jedno: czy to sie przydaje komus, kto wlasnie
// zamawia. Kalkulator blanku obraczki i sklad stopow sa dla zlotnika przy
// warsztacie, nie dla kupujacego, wiec ich tu nie ma, mimo ze istnieja.

export const TOOL_LINKS = [
  {
    id: "ring-sizer",
    category: "jewelry",
    to: "/toolsjewelry/ring-sizer/",
    label: { pl: "Miarka do pierścionków do wydruku", en: "Printable ring sizer", de: "Ringmaßband zum Ausdrucken" },
    desc: {
      pl: "Nie znasz rozmiaru? Wydrukuj, wytnij pasek i zmierz palec w minutę.",
      en: "Not sure of your size? Print it, cut the strip and measure in a minute.",
      de: "Größe unbekannt? Drucken, Streifen ausschneiden, in einer Minute messen.",
    },
  },
  {
    id: "ring-size",
    category: "jewelry",
    to: "/toolsjewelry/ring-size/",
    label: { pl: "Konwerter rozmiarów pierścionków", en: "Ring size converter", de: "Ringgrößen-Konverter" },
    desc: {
      pl: "Masz rozmiar w innym systemie? Przelicz EU, US, UK i JP.",
      en: "Got a size in another system? Convert EU, US, UK and JP.",
      de: "Größe in einem anderen System? EU, US, UK und JP umrechnen.",
    },
  },
];

export function getToolsByCategory(category) {
  return TOOL_LINKS.filter((t) => t.category === category);
}
