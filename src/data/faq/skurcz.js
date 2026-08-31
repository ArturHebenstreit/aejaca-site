// ============================================================
// PYTANIA O SKURCZ ODLEWNICZY
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
    id: "czym-jest-skurcz-odlewniczy",
    temat: "narzedzia",
    strona: "/toolstudio/shrinkage/",
    q: {
      pl: "Czym jest skurcz odlewniczy?",
      en: "What is casting shrinkage?",
      de: "Was ist Gussschwindung?",
    },
    a: {
      pl: "To zmniejszenie wymiarów metalu podczas krzepnięcia w formie odlewniczej, po stopieniu i wypełnieniu wnęki po spalonym lub wytopionym wzorcu. Efekt widoczny jest zwłaszcza przy precyzyjnych elementach, jak obrączki czy oprawy kamieni.",
      en: "It is the reduction in metal dimensions as it solidifies inside the casting mould, after melting and filling the cavity left by the burned-out or dissolved pattern. The effect is most visible on precise elements like bands or stone settings.",
      de: "Das ist die Verringerung der Metallabmessungen beim Erstarren in der Gussform, nach dem Schmelzen und Füllen des Hohlraums, der vom ausgebrannten oder aufgelösten Modell zurückbleibt. Der Effekt ist besonders bei präzisen Elementen wie Ringschienen oder Fassungen sichtbar.",
    },
  },
  {
    id: "dlaczego-wspolczynnik-skurczu-jest-rozny",
    temat: "narzedzia",
    strona: "/toolstudio/shrinkage/",
    q: {
      pl: "Dlaczego współczynnik skurczu jest różny dla każdego stopu?",
      en: "Why is the shrinkage factor different for each alloy?",
      de: "Warum ist der Schwindungsfaktor bei jeder Legierung anders?",
    },
    a: {
      pl: "Każdy stop ma inny skład metali (Au, Ag, Cu, Zn i inne dodatki), a co za tym idzie inną temperaturę krzepnięcia i inną gęstość w stanie stałym względem ciekłego. Dlatego Ag 925, Au 9K, Au 14K (585) i Au 18K kurczą się w innym stopniu.",
      en: "Every alloy has a different metal composition (Au, Ag, Cu, Zn and other additions), which changes its solidification temperature and the density difference between liquid and solid states. That is why Ag 925, Au 9K, Au 14K (585) and Au 18K each shrink by a different amount.",
      de: "Jede Legierung hat eine andere Metallzusammensetzung (Au, Ag, Cu, Zn und weitere Zusätze), was die Erstarrungstemperatur und den Dichteunterschied zwischen flüssigem und festem Zustand verändert. Deshalb schwinden Ag 925, Au 9K, Au 14K (585) und Au 18K jeweils unterschiedlich stark.",
    },
  },
  {
    id: "jak-zastosowac-kompensacje-skurczu",
    temat: "narzedzia",
    strona: "/toolstudio/shrinkage/",
    q: {
      pl: "Jak zastosować kompensację skurczu w CAD lub slicerze?",
      en: "How do I apply shrinkage compensation in CAD or a slicer?",
      de: "Wie wende ich die Schwindungskompensation in CAD oder einem Slicer an?",
    },
    a: {
      pl: "Zamodeluj lub zaimportuj wzorzec w wymiarze docelowym, a następnie przeskaluj go jednorodnie (Scale/Skaluj, nie osobno w osiach) o wartość współczynnika dla wybranego stopu, np. x1,016 dla Ag 925. Wynik wydrukuj jako wzorzec castable i przekaż do odlewu.",
      en: "Model or import the pattern at the final target dimension, then scale it uniformly (Scale, not per-axis) by the factor for the chosen alloy, e.g. x1.016 for Ag 925. Print the result as a castable pattern and send it for casting.",
      de: "Modellieren oder importieren Sie das Modell im Zielmaß und skalieren Sie es dann einheitlich (Skalieren, nicht pro Achse) um den Faktor der gewählten Legierung, z. B. x1,016 für Ag 925. Drucken Sie das Ergebnis als Castable-Modell und geben Sie es zum Guss.",
    },
  },
];
