// ============================================================
// PYTANIA O USTAWIENIA DRUKU Z ZYWICY
// ============================================================
// Pytania stoja w danych, a nie w pliku strony, bo czyta je DWOJE:
// strona, ktorej dotycza, i wspolna sekcja `/faq/` z wyszukiwarka. Kopia
// w drugim miejscu rozjechalaby sie przy pierwszej poprawce, i to po cichu:
// klient dostalby dwie rozne odpowiedzi zaleznie od tego, gdzie trafil.
//
// `id` jest kotwica w adresie, wiec ZOSTAJE, nawet gdy zmieni sie tresc:
// odnosnik do konkretnej odpowiedzi ma dzialac za rok.

export default [
  {
    id: "czym-rozni-sie-zywica-standard",
    temat: "narzedzia",
    strona: "/toolstudio/resin-settings/",
    q: {
      pl: "Czym różni się żywica standard od ABS-like?",
      en: "What is the difference between standard and ABS-like resin?",
      de: "Was unterscheidet Standardharz von ABS-like-Harz?",
    },
    a: {
      pl: "Żywica standard jest twarda, ale krucha, sprawdza się w modelach i figurkach wizualnych, gdzie liczy się detal, a nie odporność na uderzenia. ABS-like ma podobną udarność do plastiku ABS i nie pęka przy zginaniu czy zatrzaskach, dlatego wybiera się ją do obudów i części mechanicznych, które muszą znieść realne obciążenia.",
      en: "Standard resin is hard but brittle, great for visual models and figurines where detail matters more than impact resistance. ABS-like resin has toughness similar to ABS plastic and does not crack under bending or snap-fits, so it is chosen for housings and mechanical parts that need to survive real loads.",
      de: "Standardharz ist hart, aber spröde und eignet sich für visuelle Modelle und Figuren, bei denen Detail wichtiger ist als Schlagfestigkeit. ABS-like-Harz hat eine Zähigkeit ähnlich wie ABS-Kunststoff und bricht nicht bei Biegung oder Schnappverbindungen, daher wird es für Gehäuse und mechanische Teile gewählt, die echten Belastungen standhalten müssen.",
    },
  },
  {
    id: "czy-zywica-water-washable-jest",
    temat: "narzedzia",
    strona: "/toolstudio/resin-settings/",
    q: {
      pl: "Czy żywica water-washable jest gorsza od tej myjącej się w IPA?",
      en: "Is water-washable resin worse than IPA-washable resin?",
      de: "Ist wasserwaschbares Harz schlechter als IPA-waschbares Harz?",
    },
    a: {
      pl: "Nie, jest tylko innym kompromisem. Woda zastępuje alkohol izopropylowy w myciu, co jest wygodniejsze i tańsze w domu, ale wydruk bywa nieco mniej odporny na wilgoć niż wydruk z żywicy myjącej się w IPA, dlatego do elementów wystawionych na wilgoć lepiej wybrać wersję IPA.",
      en: "No, it is simply a different trade-off. Water replaces isopropyl alcohol for washing, which is more convenient and cheaper at home, but the print can be slightly less moisture resistant than an IPA-washed print, so parts exposed to humidity are better made from the IPA version.",
      de: "Nein, es ist nur ein anderer Kompromiss. Wasser ersetzt Isopropylalkohol bei der Reinigung, was zu Hause praktischer und günstiger ist, aber der Druck kann etwas weniger feuchtigkeitsbeständig sein als ein IPA-gewaschener Druck, daher sind Teile mit Feuchtigkeitskontakt besser aus der IPA-Version.",
    },
  },
  {
    id: "co-to-jest-zywica-castable",
    temat: "narzedzia",
    strona: "/toolstudio/resin-settings/",
    q: {
      pl: "Co to jest żywica castable i po co kosztuje aż 1399 zł/kg?",
      en: "What is castable resin, and why does it cost 1399 PLN/kg?",
      de: "Was ist Castable-Harz, und warum kostet es 1399 PLN/kg?",
    },
    a: {
      pl: "Żywica castable (np. BlueCast X-One) wypala się bez popiołu podczas odlewu metodą lost-resin, więc wzorzec znika bez śladu i nie zanieczyszcza formy. Wysoka cena wynika z precyzyjnej formuły chemicznej wymaganej do czystego spalania, to żywica dla jubilerów odlewających sygnety i bryłowe elementy, nie do druku codziennego.",
      en: "Castable resin (e.g. BlueCast X-One) burns out with no ash residue during lost-resin casting, so the pattern disappears without contaminating the mould. The high price comes from the precise chemical formula needed for clean burnout, this is a resin for jewelers casting signet rings and solid forms, not for everyday printing.",
      de: "Castable-Harz (z. B. BlueCast X-One) brennt beim Lost-Resin-Guss rückstandsfrei aus, sodass das Modell verschwindet, ohne die Gussform zu verunreinigen. Der hohe Preis ergibt sich aus der präzisen chemischen Formel für sauberes Ausbrennen, das ist ein Harz für Goldschmiede, die Siegelringe und massive Formen gießen, nicht für den Alltagsdruck.",
    },
  },
  {
    id: "jaka-zywica-sprawdzi-sie",
    temat: "narzedzia",
    strona: "/toolstudio/resin-settings/",
    q: {
      pl: "Jaka żywica sprawdzi się do figurek i miniatur?",
      en: "Which resin works best for figurines and miniatures?",
      de: "Welches Harz eignet sich am besten für Figuren und Miniaturen?",
    },
    a: {
      pl: "Do zwykłych figurek wizualnych wystarczy żywica Standard lub Water-washable. Jeśli zależy Ci na maksymalnym mikrodetalu, ażurze i cienkich elementach na drukarce 16K, wybierz żywicę High-precision 14K, ma minimalny skurcz i najwyższą rozdzielczość odwzorowania.",
      en: "Standard visual figurines are fine with Standard or Water-washable resin. If you need maximum micro-detail, openwork and thin features on a 16K printer, choose High-precision 14K resin, it has minimal shrinkage and the highest reproduction resolution.",
      de: "Für gewöhnliche visuelle Figuren reicht Standard- oder wasserwaschbares Harz. Wer maximales Mikrodetail, Durchbruch und dünne Elemente auf einem 16K-Drucker möchte, wählt High-precision-14K-Harz, es hat minimale Schrumpfung und die höchste Abbildungsauflösung.",
    },
  },
  {
    id: "czy-wydruki-z-zywicy",
    temat: "narzedzia",
    strona: "/toolstudio/resin-settings/",
    q: {
      pl: "Czy wydruki z żywicy są trwałe?",
      en: "Are resin prints durable?",
      de: "Sind Harzdrucke langlebig?",
    },
    a: {
      pl: "Zależy od segmentu żywicy. Standardowe żywice wizualne są twarde, ale kruche i mogą pękać przy uderzeniu, dlatego nie nadają się do części użytkowych. Żywice techniczne, jak Tough czy ABS-like, są znacznie bardziej wytrzymałe mechanicznie i po prawidłowym utwardzeniu UV nadają się do prototypów funkcjonalnych i elementów eksploatacyjnych.",
      en: "It depends on the resin segment. Standard visual resins are hard but brittle and can crack on impact, so they are not suited to functional parts. Technical resins like Tough or ABS-like are much stronger mechanically and, once properly UV-cured, work well for functional prototypes and wear parts.",
      de: "Das hängt vom Harzsegment ab. Standard-Visualharze sind hart, aber spröde und können bei Stößen brechen, daher eignen sie sich nicht für funktionale Teile. Technische Harze wie Tough oder ABS-like sind mechanisch deutlich belastbarer und eignen sich nach korrekter UV-Nachhärtung für Funktionsprototypen und Verschleißteile.",
    },
  },
];
