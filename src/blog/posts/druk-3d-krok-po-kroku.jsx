import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./druk-3d-krok-po-kroku.meta.js";

// ======================= PL =======================
function BodyPL() {
  return (
    <>
      <Lead>
        Druk 3D brzmi futurystycznie, ale rzeczywistość jest prostsza niż myślisz:
        wysyłasz plik (albo szkic), my zamieniamy go w fizyczny obiekt warstwa po warstwie.
        Ten przewodnik wyjaśnia co, jak, za ile — i kiedy druk 3D ma sens, a kiedy nie.
      </Lead>

      <H2 id="czym-jest">Czym w ogóle jest druk 3D?</H2>
      <P>
        Druk 3D (wytwarzanie addytywne) to technologia, w której obiekt powstaje warstwa po warstwie z materiału cyfrowego modelu — zamiast wycinania z bloku (CNC) lub odlewania w formie. Nie potrzebujesz formy wtryskowej, nie potrzebujesz minimum 1000 sztuk. <Strong>Możesz wydrukować 1 egzemplarz</Strong> — i to jest rewolucja.
      </P>

      <H2 id="fdm-vs-zywica">FDM vs żywica (SLA/MSLA) — którą technologię wybrać?</H2>
      <Table
        headers={["", "FDM (filament)", "Żywica (MSLA)"]}
        rows={[
          ["Materiał", "PLA, PETG, ABS, ASA, TPU, PA, PC", "Standardowa, elastyczna, odlewnicza, dental"],
          ["Precyzja warstwy", "0.1–0.3 mm", "0.025–0.05 mm"],
          ["Powierzchnia", "Widoczne warstwy (można szlifować)", "Gładka, prawie formowa jakość"],
          ["Rozmiar max", "256 × 256 × 256 mm (Bambu Lab)", "218 × 123 × 235 mm (Elegoo Saturn)"],
          ["Najlepsze do", "Prototypy, obudowy, gadżety, duże elementy", "Biżuteria, miniatury, detale, formy odlewnicze"],
          ["Cena wydruku", "Od 20 zł", "Od 40 zł"],
        ]}
      />
      <P>
        <Strong>Krótko:</Strong> <A href="/glossary/druk-3d-fdm">FDM</A> = szybciej, taniej, większe. <A href="/glossary/zywica-uv">Żywica</A> = precyzyjniej, gładziej, mniejsze. W AEJaCA sTuDiO masz obie technologie pod jednym dachem.
      </P>

      <H2 id="proces">Od pliku do wydruku — 5 etapów</H2>
      <OL>
        <LI><Strong>Przesłanie pliku</Strong> — <A href="/glossary/plik-stl">.STL</A>, .3MF, .STEP, .OBJ. Nie masz pliku? Możemy zaprojektować model <A href="/glossary/cad">CAD</A> na podstawie szkicu, zdjęcia lub opisu.</LI>
        <LI><Strong>Analiza i wycena</Strong> — sprawdzamy geometrię, dobieramy technologię (FDM/żywica), materiał, orientację wydruku. Wycena w 24h.</LI>
        <LI><Strong>Slicing i przygotowanie</Strong> — model jest cięty na warstwy w oprogramowaniu (Bambu Studio / Lychee). Ustawiamy podpory, wypełnienie, parametry.</LI>
        <LI><Strong>Druk</Strong> — drukarka buduje obiekt warstwa po warstwie. Czas: od 1h (mały element) do 24h+ (duży, gęsty model).</LI>
        <LI><Strong>Post-processing</Strong> — usunięcie podpór, szlifowanie, opcjonalne malowanie, sklejanie wieloczęściowe. Dla żywicy: mycie IPA + utwardzanie UV.</LI>
      </OL>

      <H2 id="co-mozna">Co możesz wydrukować (i czego NIE warto)</H2>
      <H3>Świetne zastosowania:</H3>
      <UL>
        <LI>Prototypy produktów i obudowy elektroniki</LI>
        <LI>Figurki, miniatury, modele architektoniczne</LI>
        <LI>Formy odlewnicze do biżuterii (wypalana żywica)</LI>
        <LI>Gadżety firmowe, tagi NFC, personalizowane prezenty</LI>
        <LI>Części zamienne do urządzeń domowych</LI>
        <LI>Narzędzia, uchwyty, jigi do warsztatu</LI>
      </UL>
      <H3>Kiedy druk 3D NIE jest najlepszym wyborem:</H3>
      <UL>
        <LI>Serie &gt; 500 szt. — wtedy forma wtryskowa jest tańsza per sztukę</LI>
        <LI>Elementy nośne pod dużym obciążeniem mechanicznym — metal CNC będzie trwalszy</LI>
        <LI>Kontakt z żywnością — większość filamentów nie jest food-safe (ale PETG certyfikowany tak)</LI>
      </UL>

      <H2 id="ceny">Ile kosztuje druk 3D?</H2>
      <Table
        headers={["Kategoria", "Technologia", "Orientacyjna cena"]}
        rows={[
          ["Mały element (3–5 cm)", "FDM", "20–65 zł"],
          ["Średni prototyp (10–15 cm)", "FDM", "65–170 zł"],
          ["Duży model (20+ cm)", "FDM", "170–520 zł"],
          ["Miniatura / detal biżuteryjny", "Żywica", "40–130 zł"],
          ["Forma odlewnicza", "Żywica wypalana", "85–260 zł"],
          ["Projektowanie CAD (od zera)", "—", "od 130 zł/h"],
        ]}
      />
      <Callout accent="blue" title="Wskazówka">
        Dokładną wycenę Twojego projektu dostaniesz w ciągu 24h.
        <br /><A href="/studio#calculator">Sprawdź orientacyjną cenę w kalkulatorze sTuDiO →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Wydrukuj swój projekt"
        text="Prześlij plik .STL lub opisz pomysł — wycenimy go w 24h."
        href="/contact/"
        cta="Wyślij zapytanie"
      />
    </>
  );
}

// ======================= EN =======================
function BodyEN() {
  return (
    <>
      <Lead>
        3D printing sounds futuristic, but the reality is simpler than you think: you send a file (or a sketch), and we turn it into a physical object, layer by layer.
      </Lead>

      <H2 id="what-is">What is 3D printing?</H2>
      <P>
        3D printing (additive manufacturing) builds objects layer by layer from a digital model — no mold required, no minimum order quantity. <Strong>You can print a single piece</Strong>, and that's the revolution.
      </P>

      <H2 id="fdm-vs-resin">FDM vs resin (MSLA) — which technology?</H2>
      <Table
        headers={["", "FDM (filament)", "Resin (MSLA)"]}
        rows={[
          ["Material", "PLA, PETG, ABS, ASA, TPU, PA, PC", "Standard, flexible, castable, dental"],
          ["Layer precision", "0.1–0.3 mm", "0.025–0.05 mm"],
          ["Surface", "Visible layers (sandable)", "Smooth, near mold quality"],
          ["Best for", "Prototypes, enclosures, large parts", "Jewelry, miniatures, fine details, casting molds"],
          ["Price from", "€5", "€10"],
        ]}
      />
      <P>
        <Strong>Summary:</Strong> <A href="/glossary/druk-3d-fdm">FDM</A> = faster, cheaper, bigger. <A href="/glossary/zywica-uv">Resin</A> = more precise, smoother, smaller. At AEJaCA sTuDiO, you get both under one roof.
      </P>

      <H2 id="process">From file to print — 5 steps</H2>
      <OL>
        <LI><Strong>Submit your file</Strong> — <A href="/glossary/plik-stl">.STL</A>, .3MF, .STEP, .OBJ. No file? We can design a <A href="/glossary/cad">CAD</A> model from a sketch or photo.</LI>
        <LI><Strong>Analysis & quote</Strong> — we check geometry, choose technology and material. Quote within 24h.</LI>
        <LI><Strong>Slicing</Strong> — the model is sliced into layers, supports and parameters are configured.</LI>
        <LI><Strong>Printing</Strong> — the printer builds the object layer by layer. Time: 1h to 24h+ depending on size.</LI>
        <LI><Strong>Post-processing</Strong> — support removal, sanding, optional painting. For resin: IPA wash + UV curing.</LI>
      </OL>

      <H2 id="what-can">What you can (and can't) print</H2>
      <P>
        Great for: product prototypes, miniatures, jewelry casting molds, NFC gadgets, custom gifts, replacement parts.
        Not ideal for: 500+ unit runs (injection molding is cheaper), heavy load-bearing parts (CNC metal is stronger), or food-contact items (most filaments aren't food-safe).
      </P>

      <H2 id="pricing">Pricing</H2>
      <P>
        Small FDM prints start at €5, resin from €10, large models €40–120. CAD design from scratch: from €30/h.
      </P>
      <Callout accent="blue" title="Tip">
        Get an exact quote within 24h.
        <br /><A href="/studio#calculator">Check approximate pricing in the sTuDiO calculator →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Print your project"
        text="Send a .STL file or describe your idea — we'll quote it within 24h."
        href="/contact/"
        cta="Send inquiry"
      />
    </>
  );
}

// ======================= DE =======================
function BodyDE() {
  return (
    <>
      <Lead>
        3D-Druck klingt futuristisch, aber die Realität ist einfacher als gedacht: Sie senden eine Datei (oder eine Skizze), und wir verwandeln sie Schicht für Schicht in ein physisches Objekt.
      </Lead>

      <H2 id="was-ist">Was ist 3D-Druck?</H2>
      <P>
        3D-Druck (additive Fertigung) baut Objekte Schicht für Schicht aus einem digitalen Modell auf — keine Form nötig, keine Mindestbestellmenge. <Strong>Sie können ein einzelnes Stück drucken</Strong>.
      </P>

      <H2 id="fdm-vs-harz">FDM vs. Harz (MSLA)</H2>
      <Table
        headers={["", "FDM (Filament)", "Harz (MSLA)"]}
        rows={[
          ["Material", "PLA, PETG, ABS, ASA, TPU, PA, PC", "Standard, flexibel, gießbar, dental"],
          ["Schichtpräzision", "0,1–0,3 mm", "0,025–0,05 mm"],
          ["Oberfläche", "Sichtbare Schichten (schleifbar)", "Glatt, nahezu Formenqualität"],
          ["Am besten für", "Prototypen, Gehäuse, große Teile", "Schmuck, Miniaturen, feine Details"],
          ["Preis ab", "5 €", "10 €"],
        ]}
      />

      <H2 id="prozess">Von der Datei zum Druck — 5 Schritte</H2>
      <OL>
        <LI><Strong>Datei einreichen</Strong> — <A href="/glossary/plik-stl">.STL</A>, .3MF, .STEP, .OBJ. Keine Datei? Wir erstellen ein <A href="/glossary/cad">CAD</A>-Modell nach Skizze oder Foto.</LI>
        <LI><Strong>Analyse & Angebot</Strong> — Geometrieprüfung, Technologie- und Materialauswahl. Angebot innerhalb von 24h.</LI>
        <LI><Strong>Slicing</Strong> — das Modell wird in Schichten geschnitten, Stützen und Parameter konfiguriert.</LI>
        <LI><Strong>Druck</Strong> — der Drucker baut das Objekt Schicht für Schicht auf.</LI>
        <LI><Strong>Nachbearbeitung</Strong> — Stützenentfernung, Schleifen, optionale Lackierung. Für Harz: IPA-Wäsche + UV-Härtung.</LI>
      </OL>

      <H2 id="was-kann">Was man drucken kann</H2>
      <P>
        Ideal: Produktprototypen, Miniaturen, Schmuck-Gussformen, NFC-Gadgets, individuelle Geschenke, Ersatzteile.
        Nicht ideal: Serien über 500 Stück, stark belastete Bauteile, Lebensmittelkontakt.
      </P>

      <H2 id="preise">Preise</H2>
      <P>
        Einfache <A href="/glossary/druk-3d-fdm">FDM</A>-Drucke ab 5 €, <A href="/glossary/zywica-uv">Harz</A> ab 10 €, große Modelle 40–120 €. CAD-Design: ab 30 €/h.
      </P>

      <CTABox
        accent="blue"
        title="Drucken Sie Ihr Projekt"
        text="Senden Sie eine .STL-Datei oder beschreiben Sie Ihre Idee — Angebot innerhalb von 24h."
        href="/contact/"
        cta="Anfrage senden"
      />
    </>
  );
}

export function Body({ lang }) {
  if (lang === "en") return <BodyEN />;
  if (lang === "de") return <BodyDE />;
  return <BodyPL />;
}
