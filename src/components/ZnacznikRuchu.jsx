// ============================================================
// LAMPKA WLASNEGO RUCHU: CZY TA PRZEGLADARKA JEST LICZONA
// ============================================================
// Wlasciciel oglada wlasny serwis czesciej niz ktokolwiek inny, z trzech
// urzadzen i ze zmiennych adresow IP, wiec jego wejscia zawyzaja kazdy wykres.
// Wykluczenie po adresie nie ma czego zlapac, a przegladarka nie zdradza
// zadnego identyfikatora urzadzenia i tak ma byc. Zostaje znacznik, ktory
// wlasciciel stawia sobie sam (`?nolicz=1`), opisany w `utils/analytics.js`.
//
// Sam znacznik byl dotad NIEWIDOCZNY. Stan "nie liczymy tej przegladarki"
// wygladal dokladnie tak samo jak "znacznik sie nie zapisal" i tak samo jak
// "to inna przegladarka niz ta oznaczona". Trzy rozne rzeczy, jeden widok:
// zaden. Ta plakietka nazywa stan wprost i pozwala go odwrocic jednym
// klikniecem, bez wpisywania parametru z pamieci.
//
// Zwykly odwiedzajacy nie zobaczy jej NIGDY: bez znacznika i bez parametru
// `?nolicz` w adresie komponent nie rysuje niczego.
//
// Dlaczego tutaj, a nie w panelu administracyjnym: znacznik nalezy do pamieci
// przegladarki pod adresem aejaca.com, a panel stoi pod innym adresem. Cudzej
// pamieci zadna strona nie odczyta, i nie pomoze tu ramka: przegladarki od
// dawna dziela pamiec osobno dla kazdej strony nadrzednej, wiec ramka
// z naszym adresem w panelu widzialaby PUSTA polke, a nie te wlasciwa.
// Panel pokazuje wiec to, co naprawde wie: ile oznaczonych zdarzen dotarlo.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { stanLiczenia, ustawLiczenie, zadanoPrzelaczenia } from "../utils/analytics.js";

const TEKSTY = {
  pl: {
    pominiety: "Ruch z tej przeglądarki nie jest liczony w statystyce.",
    liczony: "Ruch z tej przeglądarki jest liczony w statystyce.",
    niedostepny: "Ta przeglądarka nie pozwala zapisać znacznika, więc ruch liczy się normalnie.",
    wylacz: "Nie licz mnie",
    wlacz: "Licz z powrotem",
    zamknij: "Zamknij",
  },
  en: {
    pominiety: "Traffic from this browser is left out of the statistics.",
    liczony: "Traffic from this browser counts towards the statistics.",
    niedostepny: "This browser will not store the marker, so the traffic counts normally.",
    wylacz: "Do not count me",
    wlacz: "Count me again",
    zamknij: "Close",
  },
  de: {
    pominiety: "Zugriffe aus diesem Browser zählen nicht zur Statistik.",
    liczony: "Zugriffe aus diesem Browser zählen zur Statistik.",
    niedostepny: "Dieser Browser speichert die Markierung nicht, die Zugriffe zählen also normal.",
    wylacz: "Mich nicht zählen",
    wlacz: "Wieder zählen",
    zamknij: "Schließen",
  },
};

export default function ZnacznikRuchu() {
  const { lang } = useLanguage();
  const [stan, setStan] = useState(null);
  const [schowana, setSchowana] = useState(false);

  useEffect(() => {
    // Pierwszy render musi byc taki sam na serwerze i w przegladarce, wiec
    // pamiec przegladarki i adres czytamy dopiero po zamontowaniu.
    // Parametru w adresie juz nie ma: licznik zdejmuje go, gdy zadziala, zeby
    // nie odwracal pozniejszych klikniec. Pytamy wiec licznik, a nie adres.
    const zParametru = zadanoPrzelaczenia();
    const teraz = stanLiczenia();
    // Plakietka pokazuje sie, gdy ruch jest pomijany (stan trzeba widziec cały
    // czas) albo gdy wlasciciel wlasnie uzyl parametru (potwierdzenie, ze
    // przelaczenie zadzialalo, takze to w druga strone).
    setStan(teraz === "liczony" && !zParametru ? null : teraz);
  }, []);

  if (!stan || schowana) return null;
  const tekst = TEKSTY[lang] || TEKSTY.pl;
  const pomijany = stan === "pominiety";

  return (
    <div
      className="fixed bottom-4 left-4 z-40 max-w-xs rounded-xl border border-white/15 bg-neutral-900/95 px-4 py-3 text-xs text-neutral-200 shadow-lg backdrop-blur"
      role="status"
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${pomijany ? "bg-amber-400" : "bg-emerald-400"}`}
          aria-hidden="true"
        />
        <div className="flex-1">
          <p>{tekst[stan]}</p>
          {stan !== "niedostepny" && (
            <button
              type="button"
              onClick={() => setStan(ustawLiczenie(pomijany))}
              className="mt-2 rounded-lg border border-white/20 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
            >
              {pomijany ? tekst.wlacz : tekst.wylacz}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSchowana(true)}
          aria-label={tekst.zamknij}
          className="text-neutral-400 transition-colors hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
