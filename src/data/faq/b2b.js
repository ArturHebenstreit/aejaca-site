// ============================================================
// PYTANIA O WSPOLPRACE B2B
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
    id: "czy-moge-zamowic-sam-wydruk",
    temat: "b2b",
    strona: "/b2b/",
    q: {
      pl: "Czy mogę zamówić sam wydruk wzorca bez odlewu?",
      en: "Can I order just a printed pattern, without casting?",
      de: "Kann ich nur den Modelldruck ohne Guss bestellen?",
    },
    a: {
      pl: "Tak. Filar 2 (wzorce castable 16K) możesz zamówić samodzielnie, wysyłamy gotowy wzorzec do Twojej odlewni.",
      en: "Yes. Pillar 2 (castable 16K patterns) can be ordered on its own, we ship the finished pattern to your foundry.",
      de: "Ja. Säule 2 (Castable 16K-Modelle) kann einzeln bestellt werden, wir versenden das fertige Modell an Ihre Gießerei.",
    },
  },
  {
    id: "czy-wyroby-sa-cechowane",
    temat: "b2b",
    strona: "/b2b/",
    q: {
      pl: "Czy wyroby są cechowane?",
      en: "Are the pieces hallmarked?",
      de: "Werden die Stücke punziert?",
    },
    a: {
      pl: "Domyślnie tak, znak wytwórcy AEJaCA i zgłoszenie do Urzędu Probierczego. Po ustaleniu możemy przekazać wyrób bez cech, obowiązek zgłoszenia przechodzi wtedy na odbiorcę.",
      en: "By default yes, AEJaCA maker's mark plus a report to the Polish Assay Office. By arrangement we can hand over an unmarked piece, the reporting obligation then passes to you.",
      de: "Standardmäßig ja, AEJaCA-Herstellerzeichen plus Meldung beim polnischen Punzierungsamt. Nach Absprache können wir ein unpunziertes Stück übergeben, die Meldepflicht geht dann auf Sie über.",
    },
  },
  {
    id: "jak-wyglada-rozliczenie-przy-budowie",
    temat: "b2b",
    strona: "/b2b/",
    q: {
      pl: "Jak wygląda rozliczenie przy budowie marki?",
      en: "How does billing work when building a brand?",
      de: "Wie funktioniert die Abrechnung beim Markenaufbau?",
    },
    a: {
      pl: "Etapowe, płacisz po akceptacji każdego kamienia milowego procesu white-label.",
      en: "Staged, you pay after approving each milestone of the white-label process.",
      de: "Etappenweise, Sie zahlen nach Freigabe jedes Meilensteins des White-Label-Prozesses.",
    },
  },
  {
    id: "czy-podpisujecie-nda",
    temat: "b2b",
    strona: "/b2b/",
    q: {
      pl: "Czy podpisujecie NDA?",
      en: "Do you sign NDAs?",
      de: "Unterschreiben Sie NDAs?",
    },
    a: {
      pl: "Tak, standardowo przy projektach autorskich.",
      en: "Yes, standard practice for proprietary designs.",
      de: "Ja, Standard bei urheberrechtlich geschützten Entwürfen.",
    },
  },
  {
    id: "jakie-pliki-przyjmujecie",
    temat: "b2b",
    strona: "/b2b/",
    q: {
      pl: "Jakie pliki przyjmujecie?",
      en: "What files do you accept?",
      de: "Welche Dateien akzeptieren Sie?",
    },
    a: {
      pl: "STL, 3MF, STEP, OBJ. Jeśli nie masz pliku, wystarczy szkic lub zdjęcie, dopracujemy projekt w filarze 1 (CAD).",
      en: "STL, 3MF, STEP, OBJ. No file yet? A sketch or photo is enough, we'll refine the design under pillar 1 (CAD).",
      de: "STL, 3MF, STEP, OBJ. Noch keine Datei? Eine Skizze oder ein Foto genügt, wir verfeinern das Design in Säule 1 (CAD).",
    },
  },
];
