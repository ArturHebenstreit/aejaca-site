import { H2, H3, P, Lead, OL, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "druk-3d-krok-po-kroku",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-17",
  updatedAt: "2026-04-17",
  coverImage: "/img/blog/druk-3d-krok-po-kroku.jpg",
  readingTime: { pl: 7, en: 5, de: 5 },
  title: {
    pl: "Druk 3D krok po kroku — jak zamienić pomysł w gotowy produkt",
    en: "3D Printing Step by Step — How to Turn an Idea into a Finished Product",
    de: "3D-Druck Schritt für Schritt — So wird aus einer Idee ein fertiges Produkt",
  },
  description: {
    pl: "Jak działa druk 3D? FDM vs żywica, od pliku do wydruku, ceny, materiały. Kompletny przewodnik po usługach druku 3D w AEJaCA sTuDiO.",
    en: "How does 3D printing work? FDM vs resin, from file to print, pricing, materials. A complete guide to 3D printing services at AEJaCA sTuDiO.",
    de: "Wie funktioniert 3D-Druck? FDM vs. Harz, von der Datei zum Druck, Preise, Materialien. Ein vollständiger Leitfaden zu den 3D-Druckdiensten von AEJaCA sTuDiO.",
  },
  keywords: {
    pl: "druk 3D krok po kroku, jak działa druk 3D, FDM vs żywica, usługi druku 3D Warszawa, druk 3D na zamówienie cena",
    en: "3D printing step by step, FDM vs resin, 3D printing service Europe, custom 3D printing cost",
    de: "3D-Druck Schritt für Schritt, FDM vs Harz, 3D-Druck Service Europa, 3D-Druck Kosten",
  },
  faq: {
    pl: [
      { q: "Ile kosztuje druk 3D na zamówienie?", a: "Cena zależy od materiału, rozmiaru i technologii. W AEJaCA sTuDiO proste wydruki FDM zaczynają się od 20 zł, wydruki żywiczne od 40 zł. Wycenę dostaniesz w ciągu 24h po przesłaniu pliku .STL lub opisu." },
      { q: "Jakie pliki są potrzebne do druku 3D?", a: "Najczęściej .STL lub .3MF. Akceptujemy też .STEP, .OBJ i .FBX. Jeśli nie masz pliku — możemy zaprojektować model 3D (CAD) na podstawie szkicu lub zdjęcia." },
      { q: "Czym różni się FDM od druku żywicznego?", a: "FDM (filament) jest tańszy, szybszy, dobre do prototypów i dużych obiektów. Żywica (MSLA) daje gładką powierzchnię i precyzję do 0.05 mm — idealna do biżuterii, miniatur i detali." },
      { q: "Ile trwa realizacja druku 3D?", a: "Standardowo 2–5 dni roboczych od zatwierdzenia pliku. Ekspres (24–48h) jest możliwy za dopłatą. Czas druku samego modelu to od 1h do 24h+ w zależności od rozmiaru." },
    ],
    en: [
      { q: "How much does custom 3D printing cost?", a: "It depends on material, size, and technology. At AEJaCA sTuDiO, simple FDM prints start at €5, resin prints from €10. You'll receive a quote within 24h after submitting a .STL file or description." },
      { q: "What files are needed for 3D printing?", a: "Most commonly .STL or .3MF. We also accept .STEP, .OBJ, and .FBX. If you don't have a file, we can design a 3D (CAD) model from a sketch or photo." },
      { q: "What's the difference between FDM and resin printing?", a: "FDM (filament) is cheaper and faster — great for prototypes and large objects. Resin (MSLA) offers smooth surfaces and precision down to 0.05 mm — ideal for jewelry, miniatures, and fine details." },
      { q: "How long does a 3D print take?", a: "Standard turnaround is 2–5 business days from file approval. Express (24–48h) is available for a surcharge." },
    ],
    de: [
      { q: "Was kostet individueller 3D-Druck?", a: "Das hängt von Material, Größe und Technologie ab. Bei AEJaCA sTuDiO beginnen einfache FDM-Drucke bei 5 €, Harzdrucke ab 10 €. Sie erhalten innerhalb von 24 Stunden ein Angebot." },
      { q: "Welche Dateien werden für den 3D-Druck benötigt?", a: "Am häufigsten .STL oder .3MF. Wir akzeptieren auch .STEP, .OBJ und .FBX. Wenn Sie keine Datei haben, können wir ein 3D-Modell (CAD) nach Skizze oder Foto erstellen." },
      { q: "Was ist der Unterschied zwischen FDM und Harzdruck?", a: "FDM (Filament) ist günstiger und schneller — ideal für Prototypen und große Objekte. Harz (MSLA) bietet glatte Oberflächen und Präzision bis 0,05 mm — perfekt für Schmuck und Miniaturen." },
      { q: "Wie lange dauert ein 3D-Druck?", a: "Standardmäßig 2–5 Werktage ab Dateifreigabe. Express (24–48h) ist gegen Aufpreis möglich." },
    ],
  },
  toc: {
    pl: [
      { id: "czym-jest", label: "Czym jest druk 3D" },
      { id: "fdm-vs-zywica", label: "FDM vs żywica" },
      { id: "proces", label: "Od pliku do wydruku" },
      { id: "co-mozna", label: "Co można wydrukować" },
      { id: "ceny", label: "Ceny" },
      { id: "faq", label: "FAQ" },
    ],
    en: [
      { id: "what-is", label: "What is 3D printing" },
      { id: "fdm-vs-resin", label: "FDM vs resin" },
      { id: "process", label: "From file to print" },
      { id: "what-can", label: "What you can print" },
      { id: "pricing", label: "Pricing" },
      { id: "faq", label: "FAQ" },
    ],
    de: [
      { id: "was-ist", label: "Was ist 3D-Druck" },
      { id: "fdm-vs-harz", label: "FDM vs Harz" },
      { id: "prozess", label: "Von der Datei zum Druck" },
      { id: "was-kann", label: "Was man drucken kann" },
      { id: "preise", label: "Preise" },
      { id: "faq", label: "FAQ" },
    ],
  },
};

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
        <Strong>Krótko:</Strong> FDM = szybciej, taniej, większe. Żywica = precyzyjniej, gładziej, mniejsze. W AEJaCA sTuDiO masz obie technologie pod jednym dachem.
      </P>

      <H2 id="proces">Od pliku do wydruku — 5 etapów</H2>
      <OL>
        <LI><Strong>Przesłanie pliku</Strong> — .STL, .3MF, .STEP, .OBJ. Nie masz pliku? Możemy zaprojektować model CAD na podstawie szkicu, zdjęcia lub opisu.</LI>
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
        href="/contact"
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
        <Strong>Summary:</Strong> FDM = faster, cheaper, bigger. Resin = more precise, smoother, smaller. At AEJaCA sTuDiO, you get both under one roof.
      </P>

      <H2 id="process">From file to print — 5 steps</H2>
      <OL>
        <LI><Strong>Submit your file</Strong> — .STL, .3MF, .STEP, .OBJ. No file? We can design a CAD model from a sketch or photo.</LI>
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
        href="/contact"
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
        <LI><Strong>Datei einreichen</Strong> — .STL, .3MF, .STEP, .OBJ. Keine Datei? Wir erstellen ein CAD-Modell nach Skizze oder Foto.</LI>
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
        Einfache FDM-Drucke ab 5 €, Harz ab 10 €, große Modelle 40–120 €. CAD-Design: ab 30 €/h.
      </P>

      <CTABox
        accent="blue"
        title="Drucken Sie Ihr Projekt"
        text="Senden Sie eine .STL-Datei oder beschreiben Sie Ihre Idee — Angebot innerhalb von 24h."
        href="/contact"
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
