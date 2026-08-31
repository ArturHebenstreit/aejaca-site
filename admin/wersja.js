// ============================================================
// WERSJA PANELU
// ============================================================
// Panel i backend sklepu wdrazaja sie OSOBNO. Zmiana, ktora dotyka obu, przez
// chwile zyje w polowie: nowy formularz rozmawia ze starym API i po cichu gubi
// pola, ktorych tamto jeszcze nie zna. Wyglada to identycznie jak blad w kodzie,
// bo ekran jest nowy, a zapis nie dziala.
//
// Dlatego naglowek panelu pokazuje trzy rzeczy: swoja wersje, wersje backendu
// i stan schematu bazy. Rozjazd widac wtedy z jednego spojrzenia, zamiast
// zgadywac go z zachowania formularza.
//
// Numer podnosimy RECZNIE i tylko przy zmianie, ktora widac w panelu, i robimy
// to na TRZECIEJ pozycji: `1.1.02` -> `1.1.03`. Trzecia pozycja jest zawsze
// dwucyfrowa, wiec numery ustawiaja sie w kolumnie i widac na pierwszy rzut oka,
// ktora wersja jest nowsza. Pierwsze dwie liczby zostaja na zmiany, ktore
// przestawiaja sposob pracy panelu, a nie na kazda poprawke ekranu.

export const PANEL_WERSJA = "1.1.04";

/** Skrot commita z wdrozenia, jesli platforma go poda. */
export function wersjaZWdrozenia() {
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.COMMIT_SHA || "";
  return sha ? sha.slice(0, 7) : null;
}

/** Wersja panelu w postaci, ktora idzie na ekran. */
export function opisWersji() {
  const sha = wersjaZWdrozenia();
  return sha ? `${PANEL_WERSJA} (${sha})` : PANEL_WERSJA;
}
