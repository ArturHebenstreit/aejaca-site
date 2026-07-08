import { H2, H3, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./jak-przygotowac-plik-stl.meta.js";

export function Body({ lang }) {
  const t = (pl, en, de) => lang === "pl" ? pl : lang === "de" ? de : en;
  const id = t;

  return (
    <>
      <Lead>{t(
        <>Twój <A href="/glossary/druk-3d-fdm">wydruk 3D</A> jest tak dobry, jak plik źródłowy. Dobrze przygotowany STL oznacza szybszą wycenę, mniej niespodzianek i lepszy efekt końcowy.</>,
        <>Your <A href="/glossary/druk-3d-fdm">3D print</A> is only as good as your source file. A well-prepared STL means faster quoting, fewer surprises, and a better final result.</>,
        <>Ihr <A href="/glossary/druk-3d-fdm">3D-Druck</A> ist nur so gut wie Ihre Quelldatei. Eine gut vorbereitete STL bedeutet schnellere Angebote, weniger Überraschungen und ein besseres Endergebnis.</>
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
