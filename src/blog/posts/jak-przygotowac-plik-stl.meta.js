export const meta = {
  slug: "jak-przygotowac-plik-stl",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/jak-przygotowac-plik-stl.webp",
  readingTime: { pl: 7, en: 5, de: 5 },
  title: {
    pl: "Jak przygotować plik STL do druku 3D — poradnik",
    en: "How to Prepare an STL File for 3D Printing — Guide",
    de: "STL-Datei für den 3D-Druck vorbereiten — Anleitung",
  },
  description: {
    pl: "Wszystko o plikach STL: formaty, naprawianie błędów, optymalizacja siatki, eksport z popularnych programów. Prześlij gotowy plik do kalkulatora AEJaCA.",
    en: "Everything about STL files: formats, error fixing, mesh optimization, export from popular software. Upload your file to AEJaCA's instant calculator.",
    de: "Alles über STL-Dateien: Formate, Fehlerbehebung, Netz-Optimierung, Export aus gängiger Software. Laden Sie Ihre Datei in den AEJaCA-Kalkulator.",
  },
  keywords: {
    pl: "plik STL do druku 3D, przygotowanie STL, naprawa siatki STL, eksport STL, kalkulator druku 3D online, AEJaCA sTuDiO",
    en: "STL file for 3D printing, STL preparation, mesh repair, STL export, 3D print calculator online, AEJaCA sTuDiO",
    de: "STL-Datei für 3D-Druck, STL vorbereiten, Netz reparieren, STL exportieren, 3D-Druck Kalkulator online, AEJaCA sTuDiO",
  },
  toc: {
    pl: [
      { id: "co-to-stl", label: "Czym jest STL" },
      { id: "formaty", label: "Obsługiwane formaty" },
      { id: "bledy", label: "Typowe błędy" },
      { id: "naprawa", label: "Jak naprawić" },
      { id: "eksport", label: "Eksport z programów" },
    ],
    en: [
      { id: "what-is-stl", label: "What is STL" },
      { id: "formats", label: "Supported formats" },
      { id: "errors", label: "Common errors" },
      { id: "fixing", label: "How to fix" },
      { id: "export", label: "Software export tips" },
    ],
    de: [
      { id: "was-ist-stl", label: "Was ist STL" },
      { id: "formate", label: "Unterstützte Formate" },
      { id: "fehler", label: "Typische Fehler" },
      { id: "reparatur", label: "Reparaturanleitung" },
      { id: "export-de", label: "Export aus Software" },
    ],
  },
  faq: {
    pl: [
      { q: "Jakie formaty plików akceptujecie do druku 3D?", a: "STL, 3MF, STEP i OBJ. Najlepszy wybór to STL (uniwersalny) lub 3MF (multi-materiał z kolorami)." },
      { q: "Jaka jest minimalna grubość ścianki dla druku FDM?", a: "Zalecamy minimum 1,2 mm (3 ścieżki dyszy 0,4 mm). Dla detali strukturalnych — 2 mm." },
      { q: "Mój plik STL ma błędy — czy możecie go naprawić?", a: "Tak — sprawdzamy każdy plik przed drukiem. Drobne naprawy są bezpłatne. Większe przebudowy siatki wyceniamy indywidualnie." },
      { q: "Jak wyeksportować STL z Fusion 360 / Blender?", a: "Fusion 360: File → Export → STL, ustaw dokładność 'High'. Blender: File → Export → STL, zaznacz 'Apply Modifiers'." },
    ],
    en: [
      { q: "What file formats do you accept for 3D printing?", a: "STL, 3MF, STEP, and OBJ. Best choice is STL (universal) or 3MF (multi-material with colors)." },
      { q: "What's the minimum wall thickness for FDM printing?", a: "We recommend at least 1.2 mm (3 passes of a 0.4 mm nozzle). For structural details — 2 mm." },
      { q: "My STL has errors — can you fix it?", a: "Yes — we check every file before printing. Minor repairs are free. Major mesh rebuilds are quoted individually." },
      { q: "How do I export STL from Fusion 360 / Blender?", a: "Fusion 360: File → Export → STL, set refinement to 'High'. Blender: File → Export → STL, check 'Apply Modifiers'." },
    ],
    de: [
      { q: "Welche Dateiformate akzeptieren Sie für den 3D-Druck?", a: "STL, 3MF, STEP und OBJ. Beste Wahl: STL (universell) oder 3MF (Multi-Material mit Farben)." },
      { q: "Wie dick muss die Wand beim FDM-Druck mindestens sein?", a: "Wir empfehlen mindestens 1,2 mm (3 Bahnen einer 0,4-mm-Düse). Für strukturelle Details — 2 mm." },
      { q: "Meine STL-Datei hat Fehler — können Sie sie reparieren?", a: "Ja — wir prüfen jede Datei vor dem Druck. Kleine Reparaturen sind kostenlos. Größere Netz-Umbauten werden individuell berechnet." },
      { q: "Wie exportiere ich STL aus Fusion 360 / Blender?", a: "Fusion 360: Datei → Exportieren → STL, Genauigkeit auf ‚Hoch'. Blender: Datei → Exportieren → STL, ‚Modifikatoren anwenden' aktivieren." },
    ],
  },
  relatedPosts: ["druk-3d-krok-po-kroku", "odlewy-zywiczne-poradnik"],
};
