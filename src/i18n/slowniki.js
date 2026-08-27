// ============================================================
// JEDEN SLOWNIK NA WIZYTE, NIE TRZY
// ============================================================
// Pliki `pl.js`, `en.js` i `de.js` to razem 150 kB zrodel i wszystkie trzy
// siedzialy w pliku wejsciowym. Kazdy odwiedzajacy pobieral trzy jezyki, zeby
// przeczytac jeden: Polak wozil ze soba caly niemiecki, Niemiec caly polski.
//
// Do 27 sierpnia 2026 nie dalo sie tego rozdzielic, bo jezyk byl znany dopiero
// po zamontowaniu aplikacji, czyli za pozno, zeby zdecydowac, co pobrac.
// Odkad jezyk wynika ze SCIEZKI, wiadomo to od pierwszej chwili.
//
// Slownik musi byc gotowy PRZED pierwszym renderem, bo inaczej granica
// Suspense zawiesilaby sie w trakcie hydracji i React wyrzucilby gotowy HTML.
// Dlatego `main.jsx` czeka na `wczytajSlownik(lang)` tak samo, jak czeka na
// fragment biezacej trasy, a prerender rejestruje wszystkie trzy z gory: on
// rysuje po kolei kazdy jezyk i nie ma czego odkladac.

const LADOWACZE = {
  pl: () => import("./pl.js"),
  en: () => import("./en.js"),
  de: () => import("./de.js"),
};

const wczytane = new Map();
const wTrakcie = new Map();

/** Rejestruje gotowy slownik. Uzywa tego prerender, ktory ma wszystkie trzy. */
export function zarejestrujSlownik(lang, slownik) {
  wczytane.set(lang, slownik);
}

/** Czy slownik jest juz pod reka. */
export function slownikGotowy(lang) {
  return wczytane.has(lang);
}

/** Pobiera slownik, jesli go jeszcze nie ma. Powtorne wywolania czekaja na to
 *  samo zadanie, wiec podwojne klikniecie w przelacznik nie pobiera dwa razy. */
export function wczytajSlownik(lang) {
  if (wczytane.has(lang)) return Promise.resolve(wczytane.get(lang));
  if (!LADOWACZE[lang]) return Promise.resolve(null);
  if (!wTrakcie.has(lang)) {
    wTrakcie.set(
      lang,
      LADOWACZE[lang]()
        .then((m) => {
          wczytane.set(lang, m.default);
          return m.default;
        })
        .finally(() => wTrakcie.delete(lang)),
    );
  }
  return wTrakcie.get(lang);
}

/** Slownik do natychmiastowego uzycia w renderze. Gdy zadanego nie ma (wejscie
 *  przyciskiem "wstecz" na obcy prefiks), oddajemy jakikolwiek wczytany, zeby
 *  strona sie narysowala, a `LanguageProvider` dociaga wlasciwy i przerysowuje.
 *  Widac wtedy mgnienie innego jezyka zamiast pustej strony. */
export function slownik(lang) {
  return wczytane.get(lang) || wczytane.values().next().value || null;
}
