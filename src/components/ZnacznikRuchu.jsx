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
import { stanLiczenia, ustawLiczenie, pytanoZAdresu } from "../utils/analytics.js";

const TEKSTY = {
  pl: {
    liczony: "Ten ruch jest liczony",
    pominiety: "Ten ruch nie jest liczony",
    niedostepny: "Ta przeglądarka nie pozwala zapisać znacznika, więc ruch liczy się normalnie.",
    zLiczonego: "Kliknij, żeby przestać liczyć",
    zPominietego: "Kliknij, żeby liczyć",
    zamknij: "Zamknij",
  },
  en: {
    liczony: "This traffic is counted",
    pominiety: "This traffic is not counted",
    niedostepny: "This browser will not store the marker, so the traffic counts normally.",
    zLiczonego: "Click to stop counting it",
    zPominietego: "Click to start counting it",
    zamknij: "Close",
  },
  de: {
    liczony: "Diese Zugriffe werden gezählt",
    pominiety: "Diese Zugriffe werden nicht gezählt",
    niedostepny: "Dieser Browser speichert die Markierung nicht, die Zugriffe zählen also normal.",
    zLiczonego: "Klicken, um nicht mehr zu zählen",
    zPominietego: "Klicken, um wieder zu zählen",
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
    const zParametru = pytanoZAdresu();
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
      className="fixed bottom-4 left-4 z-40 max-w-xs rounded-xl border border-white/15 bg-neutral-900/95 px-3 py-3 text-xs text-neutral-200 shadow-lg backdrop-blur"
      role="status"
    >
      <div className="flex items-start gap-2">
        {stan === "niedostepny" ? (
          <p className="flex-1 py-1">{tekst.niedostepny}</p>
        ) : (
          // JEDEN klawisz na odpowiedz i na przestawienie. Kolor i napis mowia
          // o stanie TERAZ, druga linijka o tym, co zrobi klikniecie. Osobny
          // napis obok osobnego przycisku dalo by sie rozjechac, a sam napis
          // na przycisku nie mowi, czy opisuje stan, czy zapowiada zmiane.
          <button
            type="button"
            onClick={() => setStan(ustawLiczenie(pomijany))}
            className={`flex-1 rounded-lg px-3 py-2 text-left font-semibold text-white transition-colors ${
              pomijany
                ? "bg-red-600 hover:bg-red-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {tekst[stan]}
            <span className="mt-0.5 block font-normal text-white/80">
              {pomijany ? tekst.zPominietego : tekst.zLiczonego}
            </span>
          </button>
        )}
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
