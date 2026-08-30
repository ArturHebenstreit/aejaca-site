// ============================================================
// ILE TRWA REALIZACJA, JEDNA ODPOWIEDZ NA CALY SERWIS
// ============================================================
// To pytanie stalo w czterech miejscach naraz i kazde odpowiadalo inaczej:
// bizuteria mowila o przyroscie 3-7 dni przy zamawianiu materialow, wysylka
// o sumie 10-14 dni, sTuDiO o wlasnym przyroscie, a proces realizacji, ze
// liczba i tak bierze sie z oferty. Dopoki lezaly na czterech stronach, nikt
// ich nie zestawial. Wspolna sekcja `/faq/` postawila je obok siebie i widac
// bylo cztery rozne liczby na jedno pytanie.
//
// Zostaje JEDNA odpowiedz, czytana przez wszystkie cztery strony (decyzja
// wlasciciela, 2026-08-30). Wiazaca jest liczba z oferty albo z potwierdzenia
// zamowienia, a liczby ponizej sa orientacyjne i nazwane jako orientacyjne.

export default [
  {
    id: "ile-trwa-realizacja",
    temat: "realizacja",
    strona: "/order-process/",
    q: {
      pl: "Ile trwa realizacja i skąd wiem, na kiedy?",
      en: "How long does it take, and how do I know the date?",
      de: "Wie lange dauert es und woher kenne ich den Termin?",
    },
    a: {
      pl: "Wiążąca jest liczba dni podana w Twojej ofercie albo w potwierdzeniu zamówienia; liczymy ją w dniach kalendarzowych. Orientacyjnie, przy materiałach na stanie: biżuteria do 7 dni roboczych, sTuDiO 3-5 dni roboczych. Sprowadzenie materiału wydłuża to o 3-7 dni, a komponenty pod specyfikację o kolejne 7-14. Przy zleceniu, które nie wymaga ustaleń, czas biegnie od zapłaty; przy takim, które ich wymaga, dopiero od chwili, gdy wszystko jest ustalone. Konkretną datę i liczbę pozostałych dni widzisz na stronie swojego zlecenia. Ta data to planowana finalizacja, czyli dzień, w którym kończymy pracę i przekazujemy paczkę kurierowi albo mamy ją gotową do odbioru; czas przewozu liczy się dopiero od niej. Gdy w zamówieniu jest kilka rzeczy, obowiązuje najdłuższy z terminów, bo paczka wychodzi jedna.",
      en: "What binds us is the number of days written on your offer or order confirmation, counted in calendar days. As a rough guide, with materials in stock: jewelry up to 7 working days, sTuDiO 3-5 working days. Ordering material in adds 3-7 days, and components made to specification another 7-14. For an order that needs no agreeing, the clock starts at payment; for one that does, only once everything is agreed. You see the exact date and the days remaining on your own order page. That date is the planned completion: the day we finish the work and hand the parcel to the carrier or have it ready for collection, with transit counted from it. With several items in one order the longest of their times applies, because one parcel goes out.",
      de: "Verbindlich ist die Anzahl der Tage auf Ihrem Angebot oder in der Bestellbestätigung, gezählt in Kalendertagen. Als Anhaltspunkt, bei vorrätigem Material: Schmuck bis zu 7 Werktage, sTuDiO 3-5 Werktage. Muss Material bestellt werden, kommen 3-7 Tage dazu, bei Komponenten nach Spezifikation weitere 7-14. Bei einem Auftrag ohne Absprachen läuft die Zeit ab der Zahlung, bei einem mit Absprachen erst, wenn alles geklärt ist. Das genaue Datum und die verbleibenden Tage sehen Sie auf Ihrer Auftragsseite. Dieses Datum ist die geplante Fertigstellung: der Tag, an dem wir die Arbeit beenden und das Paket übergeben oder zur Abholung bereithalten; die Laufzeit beginnt erst danach. Bei mehreren Positionen gilt die längste Zeit, denn es geht ein Paket raus.",
    },
  },
];
