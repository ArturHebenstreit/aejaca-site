// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/meshUnits.js
// Regeneracja: npm run sync:pricing

// ============================================================
// JEDNOSTKA PLIKU SIATKOWEGO, ZGADYWANA Z ROZMIARU
// ============================================================
// STL i OBJ nie niosa jednostki. Konwencja mowi milimetry i tak je czytamy,
// ale Blender, Meshy i wiekszosc generatorow AI zapisuja w metrach. Relief
// o wysokosci 20 cm przychodzi wtedy jako 0.2 i wyglada jak model o boku
// dwoch milimetrow.
//
// Awaria jest cicha i kosztuje po obu stronach. Klient widzi objetosc 0.0 cm3
// i cene minimalna, wiec albo wychodzi, bo uzna, ze kalkulator nie dziala,
// albo zamawia, a my drukujemy dwumilimetrowa grudke zamiast reliefu. Nic sie
// nie wywala, a plik jest formalnie poprawny.
//
// 3MF jednostke deklaruje i tam nic nie zgadujemy (patrz mesh.js).
//
// Zgadujemy WYLACZNIE wtedy, gdy wynik jest fizycznie nieprawdopodobny, i
// zawsze pytamy klienta. Sami niczego nie przeliczamy, bo to jest decyzja o
// wymiarze wyrobu, czyli o cenie i o tym, co klient dostanie.

/** Co realnie robimy: od poltora milimetra do metra. */
export const PLAUSIBLE_CM = { min: 0.5, max: 100 };

/**
 * Mnozniki wzgledem odczytu przy zalozeniu milimetrow.
 * Kolejnosc jest kolejnoscia typowosci, nie wielkosci: metry to przypadek
 * Blendera i Meshy, czyli ten, ktory widzimy najczesciej.
 */
export const UNIT_CANDIDATES = [
  { id: "m", factor: 1000, label: { pl: "metrach", en: "meters", de: "Metern" } },
  { id: "cm", factor: 10, label: { pl: "centymetrach", en: "centimeters", de: "Zentimetern" } },
  { id: "in", factor: 25.4, label: { pl: "calach", en: "inches", de: "Zoll" } },
];

/**
 * Wszystkie odczyty jednostki, ktore daja wiarygodny rozmiar.
 *
 * Zwraca liste, a nie jedna odpowiedz, i to jest swiadome. Model
 * znormalizowany do okolic jedynki (tak eksportuje Meshy) da sie odczytac
 * jako centymetry albo jako cale i obie liczby beda sensowne. Udawanie, ze
 * wiemy ktora, to zgadywanie za klienta wymiaru wyrobu, czyli ceny i tego,
 * co dostanie. Pokazujemy warianty i pytamy.
 *
 * @param {number} maxCm najwiekszy wymiar modelu po odczycie, w centymetrach
 * @returns {Array<{id, factor, label, correctedCm}>} pusta, gdy rozmiar jest
 *          wiarygodny albo gdy zadna poprawka nie wprowadza go w zakres.
 */
export function suspectUnits(maxCm) {
  const cm = Number(maxCm);
  if (!Number.isFinite(cm) || cm <= 0) return [];
  if (cm >= PLAUSIBLE_CM.min) return [];

  return UNIT_CANDIDATES
    .map((c) => ({ ...c, correctedCm: cm * c.factor }))
    .filter((c) => c.correctedCm >= PLAUSIBLE_CM.min && c.correctedCm <= PLAUSIBLE_CM.max);
}

/** Czy w ogole warto o to pytac. */
export function looksTooSmall(maxCm) {
  const cm = Number(maxCm);
  return Number.isFinite(cm) && cm > 0 && cm < PLAUSIBLE_CM.min;
}
