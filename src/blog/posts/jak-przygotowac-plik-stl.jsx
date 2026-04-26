import { H2, H3, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

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

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const id = t;

  return (
    <>
      <Lead>{t(
        "Twój wydruk 3D jest tak dobry, jak plik źródłowy. Dobrze przygotowany STL oznacza szybszą wycenę, mniej niespodzianek i lepszy efekt końcowy.",
        "Your 3D print is only as good as your source file. A well-prepared STL means faster quoting, fewer surprises, and a better final result.",
        "Ihr 3D-Druck ist nur so gut wie Ihre Quelldatei. Eine gut vorbereitete STL bedeutet schnellere Angebote, weniger Überraschungen und ein besseres Endergebnis."
      )}</Lead>

      <H2 id={id("co-to-stl", "what-is-stl", "was-ist-stl")}>{t("Czym jest plik STL?", "What Is an STL File?", "Was ist eine STL-Datei?")}</H2>
      <P>{t(
        "STL (Standard Tessellation Language) to format opisu geometrii 3D za pomocą siatki trójkątów. Standard branżowy od lat 80., akceptowany przez praktycznie każdą drukarkę 3D.",
        "STL (Standard Tessellation Language) describes 3D geometry as a mesh of triangles. It's been the industry standard since the 1980s and is accepted by virtually every 3D printer.",
        "STL (Standard Tessellation Language) beschreibt 3D-Geometrie als Dreiecksnetz. Seit den 1980ern Industriestandard, von praktisch jedem 3D-Drucker akzeptiert."
      )}</P>
      <UL>
        <LI>{t("Opisuje tylko geometrię powierzchni — bez koloru, tekstury ani jednostek", "Describes surface geometry only — no color, texture, or units", "Beschreibt nur die Oberflächengeometrie — keine Farbe, Textur oder Einheiten")}</LI>
        <LI>{t("Im więcej trójkątów, tym gładszy model — ale większy plik", "More triangles = smoother model, but larger file", "Mehr Dreiecke = glatteres Modell, aber größere Datei")}</LI>
        <LI>{t("Typowy plik STL: 1–50 MB. Powyżej 100 MB — warto zoptymalizować", "Typical STL: 1–50 MB. Above 100 MB — consider optimizing", "Typische STL: 1–50 MB. Über 100 MB — Optimierung empfohlen")}</LI>
      </UL>
      <Callout accent="blue" title={t("Wskazówka", "Tip", "Tipp")}>{t(
        "Nasz kalkulator akceptuje pliki STL, 3MF, STEP i OBJ — ale STL jest najbardziej uniwersalny.",
        "Our calculator accepts STL, 3MF, STEP, and OBJ files — but STL is the most universal format.",
        "Unser Kalkulator akzeptiert STL, 3MF, STEP und OBJ — aber STL ist das universellste Format."
      )}</Callout>

      <H2 id={id("formaty", "formats", "formate")}>{t("Obsługiwane formaty", "Supported Formats", "Unterstützte Formate")}</H2>
      <Table
        headers={[
          t("Format", "Format", "Format"),
          t("Rozszerzenie", "Extension", "Dateierweiterung"),
          t("Najlepszy do", "Best for", "Am besten für"),
          t("Uwagi", "Notes", "Hinweise"),
        ]}
        rows={[
          ["STL", ".stl", t("uniwersalne zastosowanie", "universal use", "universelle Verwendung"), t("najbardziej kompatybilny", "most compatible", "am kompatibelsten")],
          ["3MF", ".3mf", t("multi-materiał, kolory", "multi-material, colors", "Multi-Material, Farben"), t("zawiera jednostki i kolor", "includes units and color", "enthält Einheiten und Farbe")],
          ["STEP", ".step / .stp", t("inżynieria, precyzja", "engineering, precision", "Ingenieurwesen, Präzision"), t("krzywe → konwersja na siatkę", "curves → converted to mesh", "Kurven → in Netz konvertiert")],
          ["OBJ", ".obj", t("modele wizualne", "visual models", "visuelle Modelle"), t("może zawierać tekstury", "may include textures", "kann Texturen enthalten")],
        ]}
      />

      <H2 id={id("bledy", "errors", "fehler")}>{t("Typowe błędy w plikach STL", "Common STL Errors", "Typische STL-Fehler")}</H2>
      <UL>
        <LI><Strong>{t("Krawędzie nie-manifold", "Non-manifold edges", "Nicht-manifolde Kanten")}</Strong> — {t("dziury w siatce, model nie jest zamknięty", "holes in the mesh, model isn't watertight", "Löcher im Netz, Modell ist nicht wasserdicht")}</LI>
        <LI><Strong>{t("Odwrócone normalne", "Inverted normals", "Invertierte Normalen")}</Strong> — {t("niektóre ściany są odwrócone 'do wewnątrz'", "some faces point inward instead of outward", "einige Flächen zeigen nach innen statt nach außen")}</LI>
        <LI><Strong>{t("Przecinające się ściany", "Self-intersecting geometry", "Sich schneidende Geometrie")}</Strong> — {t("elementy modelu przenikają się nawzajem", "parts of the model overlap each other", "Teile des Modells überlappen sich")}</LI>
        <LI><Strong>{t("Za mało / za dużo trójkątów", "Too few / too many triangles", "Zu wenige / zu viele Dreiecke")}</Strong> — {t("za mało = kanciaste powierzchnie, za dużo = ogromny plik", "too few = faceted look, too many = huge file", "zu wenige = kantige Oberflächen, zu viele = riesige Datei")}</LI>
        <LI><Strong>{t("Zła skala", "Wrong scale", "Falsche Skalierung")}</Strong> — {t("model w calach, drukarka oczekuje milimetrów", "model in inches, printer expects millimeters", "Modell in Zoll, Drucker erwartet Millimeter")}</LI>
      </UL>
      <Callout accent="blue" title={t("Nie martw się", "Don't worry", "Keine Sorge")}>{t(
        "80% plików, które otrzymujemy, wymaga przynajmniej jednej poprawki. Sprawdzamy każdy plik przed drukiem.",
        "80% of files we receive need at least one fix. We check every file before printing.",
        "80 % der Dateien, die wir erhalten, brauchen mindestens eine Korrektur. Wir prüfen jede Datei vor dem Druck."
      )}</Callout>

      <H2 id={id("naprawa", "fixing", "reparatur")}>{t("Jak naprawić plik STL?", "How to Fix Your STL", "STL-Datei reparieren")}</H2>
      <P>{t(
        "Darmowe narzędzia, z których możesz skorzystać:",
        "Free tools you can use:",
        "Kostenlose Tools, die Sie verwenden können:"
      )}</P>
      <UL>
        <LI><Strong>Meshmixer</Strong> (Autodesk) — {t("najlepsze ogólne narzędzie do naprawy siatek", "best all-around mesh repair tool", "bestes Allround-Tool zur Netzreparatur")}</LI>
        <LI><Strong>Netfabb Online</Strong> — {t("automatyczna naprawa w przeglądarce, bez instalacji", "automatic browser-based repair, no install needed", "automatische Reparatur im Browser, keine Installation")}</LI>
        <LI><Strong>3D Builder</Strong> (Windows) — {t("proste naprawy jednym kliknięciem", "simple one-click repairs", "einfache Ein-Klick-Reparaturen")}</LI>
        <LI><Strong>PrusaSlicer</Strong> — {t("auto-naprawa przy imporcie pliku", "auto-repair on file import", "Auto-Reparatur beim Dateiimport")}</LI>
      </UL>
      <P>{t(
        "Schemat: Import → Analiza → Auto-naprawa → Ponowny eksport → Sprawdź rozmiar pliku.",
        "Workflow: Import → Analyze → Auto-repair → Re-export → Check file size.",
        "Ablauf: Import → Analyse → Auto-Reparatur → Erneuter Export → Dateigröße prüfen."
      )}</P>

      <H2 id={id("eksport", "export", "export-de")}>{t("Eksport z popularnych programów", "Export from Popular Software", "Export aus gängiger Software")}</H2>
      <UL>
        <LI><Strong>Fusion 360</Strong> — {t("File → Export → STL, ustaw dokładność na 'High'", "File → Export → STL, set refinement to 'High'", "Datei → Exportieren → STL, Genauigkeit auf ‚Hoch'")}</LI>
        <LI><Strong>Blender</Strong> — {t("File → Export → STL, zaznacz 'Apply Modifiers'", "File → Export → STL, check 'Apply Modifiers'", "Datei → Exportieren → STL, ‚Modifikatoren anwenden' aktivieren")}</LI>
        <LI><Strong>TinkerCAD</Strong> — {t("Export → .STL (zawsze zamknięta siatka)", "Export → .STL (always watertight)", "Export → .STL (immer wasserdicht)")}</LI>
        <LI><Strong>SolidWorks</Strong> — {t("File → Save As → STL, ustaw odchylenie i kąt", "File → Save As → STL, set deviation and angle", "Datei → Speichern unter → STL, Abweichung und Winkel einstellen")}</LI>
        <LI><Strong>FreeCAD</Strong> — {t("Part → Export → Mesh, max odchylenie 0,1 mm", "Part → Export → Mesh, max deviation 0.1 mm", "Part → Export → Mesh, max. Abweichung 0,1 mm")}</LI>
      </UL>

      <CTABox
        accent="blue"
        title={t("Gotowy do druku?", "Ready to print?", "Bereit zum Drucken?")}
        text={t(
          "Prześlij plik STL do naszego kalkulatora — wycena w kilka sekund.",
          "Upload your STL to our calculator — get a quote in seconds.",
          "Laden Sie Ihre STL in unseren Kalkulator hoch — Angebot in Sekunden."
        )}
        href="/studio#calculator"
        cta={t("Kalkulator druku 3D", "3D print calculator", "3D-Druck-Kalkulator")}
      />
    </>
  );
}
