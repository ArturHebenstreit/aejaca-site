// ============================================================
// WALUTA ZAPLATY
// ============================================================
// Do tej pory walute rozstrzygal jezyk: pl znaczylo zlotowki, en i de euro.
// To jest dobry DOMYSL i zly przymus. Polak mieszkajacy w Niemczech czyta po
// polsku i placi z konta w euro, a Niemiec kupujacy prezent w Krakowie czyta
// po niemiecku i ma polska karte. Waluta wynika z tego, gdzie klient trzyma
// pieniadze, a nie z tego, w jakim jezyku czyta.
//
// Waluta zmienia DROGE ZAPLATY, wiec nie jest kosmetyka: zlotowki ida bramka
// (BLIK, pay-by-link), euro przelewem na rachunek walutowy, bo nasza umowa
// z operatorem bramki nie obejmuje euro.
//
// Cena zrodlowa zostaje w groszach PLN. Euro liczy sie z niej po kursie NBP
// i narzucie z `src/pricing/currency.js`, po obu stronach tak samo.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { defaultCurrency, normalizeCurrency } from "../pricing/currency.js";

const STORAGE_KEY = "aejaca-currency";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const { lang } = useLanguage();
  // Start zawsze z domyslu jezyka, bo tak samo renderuje sie strona wstepnie
  // zbudowana. Wybor z pamieci wchodzi dopiero po hydracji, inaczej pierwszy
  // render rozjechalby sie z tym, co przyszlo z serwera.
  const [currency, setCurrencyRaw] = useState(() => defaultCurrency(lang));
  const wybrana = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const zapisana = localStorage.getItem(STORAGE_KEY);
      if (zapisana) {
        wybrana.current = true;
        setCurrencyRaw(normalizeCurrency(zapisana, lang));
      }
    } catch { /* prywatne okno albo zablokowana pamiec: zostajemy przy domysle */ }
    // Odczyt raz na wejscie. Zmiana jezyka nizej ma wlasny efekt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zmiana jezyka przestawia walute TYLKO wtedy, gdy klient nie wybral jej sam.
  // Inaczej przelaczenie strony na angielski kasowaloby swiadoma decyzje
  // "chce placic w zlotowkach".
  useEffect(() => {
    if (wybrana.current) return;
    setCurrencyRaw(defaultCurrency(lang));
  }, [lang]);

  const setCurrency = useCallback((nowa) => {
    const w = normalizeCurrency(nowa, lang);
    wybrana.current = true;
    setCurrencyRaw(w);
    try { localStorage.setItem(STORAGE_KEY, w); } catch { /* jak wyzej */ }
  }, [lang]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Waluta zaplaty. Poza dostawca zwraca domysl jezyka, zeby komponent uzyty
 * w prerenderze albo w tescie nie wywracal sie na braku kontekstu.
 */
export function useCurrency() {
  const { lang } = useLanguage();
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  return { currency: defaultCurrency(lang), setCurrency: () => {} };
}
