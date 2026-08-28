// ============================================================
// JEZYK BIERZE SIE Z ADRESU
// ============================================================
// Do 27 sierpnia 2026 wszystkie trzy jezyki dzielily jeden adres. Jezyk
// wybieral sie po stronie przegladarki, z `localStorage` i `navigator.languages`,
// a wyszukiwarka dostawala pod kazdym adresem ten sam polski dokument. Cala
// praca wlozona w tlumaczenia nie miala wejscia z wyszukiwarki: Niemiec
// szukajacy "Schmuck 3D Druck" nie mial jak trafic na aejaca.com, bo pod
// zadnym adresem tej strony po niemiecku nie bylo.
//
// Teraz jezyk WYNIKA ZE SCIEZKI: `/studio/` jest polskie, `/en/studio/`
// angielskie, `/de/studio/` niemieckie. Kazda z trzech wersji ma wlasny adres,
// wlasny dokument w prerenderze i wzajemne `hreflang`.
//
// Dzieki temu jezyk jest znany juz przy pierwszym renderze, tak samo na
// serwerze jak w przegladarce. Wczesniej pierwszy render zawsze byl polski,
// a jezyk podmienial sie po zamontowaniu, wiec Niemiec ogladal blysk polskiego.
//
// `localStorage` zostaje, ale w innej roli: pamieta WYBOR odwiedzajacego, zeby
// nastepnym razem wejscie na goly adres przenioslo go tam, gdzie byl. Nie
// decyduje juz o tym, co widzi, bo o tym decyduje adres.

import { createContext, useContext, useEffect, useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { slownik, slownikGotowy, wczytajSlownik } from "./slowniki.js";
import { trackLangChange } from "../utils/analytics.js";
import { JEZYKI, JEZYK_DOMYSLNY, rozbierzSciezke, sciezkaJezyka } from "../routes.js";

const STORAGE_KEY = "aejaca-lang";

const LanguageContext = createContext();

/** Zapisuje wybor jezyka. Wywolanie na biezacym jezyku tez jest wyborem:
 *  znaczy "zostaje przy tym, co widze", i wylacza podpowiedz na przyszlosc. */
function zapamietaj(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* tryb prywatny */ }
}

export function LanguageProvider({ children }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { lang, sciezka } = rozbierzSciezke(pathname);
  const prevLang = useRef(lang);

  // Zmiana jezyka to PRZEJSCIE POD INNY ADRES, a nie podmiana stanu. Ten sam
  // ekran, ten sam moment, inny prefiks. Dzieki temu odwiedzajacy moze wyslac
  // komus odnosnik do tego, co widzi, a wyszukiwarka ma co zaindeksowac.
  const setLang = useCallback(
    (nowy, { zastap = false } = {}) => {
      if (!JEZYKI.includes(nowy)) return;
      zapamietaj(nowy);
      if (nowy === lang) return;
      trackLangChange(prevLang.current, nowy);
      prevLang.current = nowy;
      // Slownik nowego jezyka najpierw, przejscie potem. Odwrotna kolejnosc
      // znaczylaby mgnienie poprzedniego jezyka na nowej stronie.
      wczytajSlownik(nowy).then(() =>
        navigate(sciezkaJezyka(sciezka, nowy) + search + hash, { replace: zastap }),
      );
    },
    [lang, sciezka, search, hash, navigate],
  );

  useEffect(() => {
    prevLang.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  // Slownik biezacego jezyka. Przy pierwszym renderze jest juz wczytany, bo
  // `main.jsx` czeka na niego przed hydracja, a prerender rejestruje wszystkie
  // trzy z gory. Zostaje jeden przypadek: wejscie "wstecz" na adres w jezyku,
  // ktorego jeszcze nie pobralismy. Wtedy rysujemy tym, co mamy, i dociagamy.
  const [, przerysuj] = useState(0);
  useEffect(() => {
    if (slownikGotowy(lang)) return;
    let zywy = true;
    wczytajSlownik(lang).then(() => { if (zywy) przerysuj((n) => n + 1); });
    return () => { zywy = false; };
  }, [lang]);

  const t = slownik(lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, sciezkaBezJezyka: sciezka }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Jezyk zapamietany przez odwiedzajacego, albo null. */
export function zapamietanyJezyk() {
  try {
    const zapis = localStorage.getItem(STORAGE_KEY);
    return zapis && JEZYKI.includes(zapis) ? zapis : null;
  } catch {
    return null;
  }
}

/** Jezyk, ktorego przegladarka odwiedzajacego chce najbardziej. */
export function jezykPrzegladarki() {
  if (typeof navigator === "undefined") return null;
  const lista = navigator.languages || [navigator.language || ""];
  for (const wpis of lista) {
    const kod = String(wpis).toLowerCase();
    if (kod.startsWith("pl")) return "pl";
    if (kod.startsWith("de")) return "de";
    if (kod.startsWith("en")) return "en";
  }
  return null;
}

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];
