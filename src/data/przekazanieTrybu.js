// ============================================================
// SZYBKA WYCENA ODDAJE SWOJE ODPOWIEDZI TRYBOWI ZAAWANSOWANEMU
// ============================================================
// Kalkulator jubilerski ma dwa tryby na jednej stronie. Szybki zadaje piec
// pytan obrazkami i daje widelki; zaawansowany pyta o wszystko i dopiero on
// dochodzi do kwoty wiazacej, bo tylko on pyta o wymiary (ADR-0049).
//
// Do 15 wrzesnia 2026 przejscie miedzy nimi gubilo cala rozmowe: klient
// wybieral pierscionek, srebro i kamien, klikal "Dla zaawansowanych"
// i dostawal pusty formularz od zera. To jest gorsze niz brak przejscia,
// bo wyglada jak kara za ciekawosc, a ponowne wyklikanie tego samego
// zniechecalo skuteczniej niz sama dluga lista pytan.
//
// Ten modul jest tlumaczem miedzy dwoma slownikami. Stoi osobno, a nie
// w komponencie, z dwoch powodow: sprawdzian moze go uruchomic bez
// przegladarki, a zmiana katalogu pytan od razu widac jako rozjazd
// (`scripts/test-przekazanie-trybu.mjs` porownuje klucze z karta uslugi).

/**
 * Odpowiedzi szybkiej wyceny przelozone na stan trybu zaawansowanego.
 *
 * @param {object} resolved wynik `resolveJewelryParams` z szybkiej wyceny
 * @returns {{serviceId: string, params: object, stoneRows: Array|null, qtyId: string|null}|null}
 *   `null`, gdy nie ma czego przekazac: odpowiedzi sa niepelne albo wyrob nie
 *   ma odpowiednika w trybie zaawansowanym.
 */
export function przekazanieDoZaawansowanego(resolved) {
  if (!resolved || resolved.custom) return null;
  const params = resolved.params || {};

  if (resolved.flow === "new") {
    // KAMIENIE WYCHODZA Z PARAMETROW KATALOGOWYCH. Szybka wycena trzyma je
    // plasko (`gemId`, `stoneSizeId`, ...), bo pyta najwyzej o jeden kamien,
    // a tryb zaawansowany ma liste wierszy, w ktorej kazdy kamien jest osobny.
    // Wpuszczone do parametrow wyrobu byly by polami, ktorych karta uslugi
    // nie zna, i pojechaly by az do tresci zamowienia.
    const {
      gemId, stoneSizeId, stoneCountId, clarityId, colorId, qualityId, certId,
      qtyId, ...wyrob
    } = params;
    return {
      serviceId: "new",
      params: wyrob,
      qtyId: qtyId || null,
      stoneRows: gemId && gemId !== "none"
        ? [{
          rowId: "row0",
          gemId,
          stoneSizeId: stoneSizeId || "small",
          // Szybka wycena nie pyta o szlif, wiec zostaje odniesienie. Wyrob
          // z kamieniem i tak idzie do wyceny czlowieka, a szlif klient
          // wskazuje juz w trybie zaawansowanym.
          cutId: "brilliant",
          count: Math.max(1, Number(stoneCountId) || 1),
          suppliedBy: "studio",
          clarityId: clarityId || "VS",
          colorId: colorId || "GH",
          qualityId: qualityId || "A",
          certId: certId || "none",
        }]
        : null,
    };
  }

  if (resolved.flow === "renovation" || resolved.flow === "repair") {
    const { qtyId, ...reszta } = params;
    return { serviceId: resolved.flow, params: reszta, qtyId: qtyId || null, stoneRows: null };
  }

  // Bizuteria na sznurku i na gumce nie ma odpowiednika w trybie
  // zaawansowanym, wiec nie ma dokad przejsc: przeniesienie klienta do
  // formularza, ktory nie zna jego wyrobu, byloby gorsze od zostania tutaj.
  return null;
}
