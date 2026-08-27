// ============================================================
// PODPOWIEDZ JEZYKA, ZAMIAST CICHEGO PRZEKIEROWANIA
// ============================================================
// Do 27 sierpnia 2026 serwis podmienial jezyk sam, po `navigator.languages`,
// pod tym samym adresem. Bylo to wygodne dla odwiedzajacego i szkodliwe dla
// wyszukiwarki: pod jednym adresem stala raz polska, raz niemiecka tresc.
//
// Teraz kazdy jezyk ma wlasny adres, wiec podmiana tresci pod adresem polskim
// byloby dokladnie tym, przed czym Google ostrzega. Zamiast tego rozrozniamy
// dwa przypadki:
//
//   1. Odwiedzajacy JUZ WYBRAL jezyk (jest zapis w pamieci przegladarki).
//      Wtedy wejscie na goly adres przenosi go tam, gdzie byl. To jest jego
//      wlasna decyzja, a nie nasze zgadywanie, wiec przenosimy bez pytania.
//
//   2. Odwiedzajacy jest tu pierwszy raz, a jego przegladarka prosi o inny
//      jezyk. Wtedy POKAZUJEMY PASEK z odnosnikiem i nie ruszamy tresci.
//      Klikniecie jest wyborem i zostaje zapamietane. Zamkniecie paska tez
//      jest wyborem: znaczy "zostaje przy tym, co widze".
//
// Robot wyszukiwarki nie ma pamieci przegladarki i nie klika, wiec dla niego
// nic sie nie zmienia: pod polskim adresem stoi polska tresc, zawsze.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLanguage, zapamietanyJezyk, jezykPrzegladarki } from "../i18n/LanguageContext.jsx";
import { JEZYK_DOMYSLNY, sciezkaJezyka } from "../routes.js";

const TEKSTY = {
  en: {
    zdanie: "This page is also available in English.",
    przycisk: "Read in English",
    zamknij: "Close",
  },
  de: {
    zdanie: "Diese Seite gibt es auch auf Deutsch.",
    przycisk: "Auf Deutsch lesen",
    zamknij: "Schließen",
  },
  pl: {
    zdanie: "Ta strona jest też po polsku.",
    przycisk: "Czytaj po polsku",
    zamknij: "Zamknij",
  },
};

export default function JezykPodpowiedz() {
  const { lang, setLang, sciezkaBezJezyka } = useLanguage();
  const [proponowany, setProponowany] = useState(null);

  useEffect(() => {
    // Pierwszy render musi byc taki sam na serwerze i w przegladarce, wiec
    // wszystko, co zalezy od pamieci przegladarki, dzieje sie dopiero tutaj.
    const zapamietany = zapamietanyJezyk();

    if (zapamietany && zapamietany !== lang && lang === JEZYK_DOMYSLNY) {
      setLang(zapamietany, { zastap: true });
      return;
    }
    if (zapamietany) return;

    const chciany = jezykPrzegladarki();
    if (chciany && chciany !== lang) setProponowany(chciany);
  }, [lang, setLang]);

  if (!proponowany) return null;
  const tekst = TEKSTY[proponowany] || TEKSTY.en;

  return (
    <div
      className="bg-amber-400/10 border-b border-amber-400/20 px-4 py-2.5"
      lang={proponowany}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap text-xs">
        <span className="text-neutral-200">{tekst.zdanie}</span>
        <a
          href={sciezkaJezyka(sciezkaBezJezyka, proponowany)}
          hreflang={proponowany}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            setLang(proponowany);
            setProponowany(null);
          }}
          className="text-amber-300 hover:text-amber-200 font-medium underline underline-offset-2"
        >
          {tekst.przycisk}
        </a>
        <button
          type="button"
          // Zamkniecie zapamietujemy jako wybor biezacego jezyka, wiec pasek
          // nie wraca na kazdej kolejnej stronie. Ta sama polka co przelacznik
          // w menu, wiec nie przybywa nic do `check-browser-storage.mjs`.
          onClick={() => { setLang(lang); setProponowany(null); }}
          aria-label={tekst.zamknij}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
