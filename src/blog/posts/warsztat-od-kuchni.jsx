import { H2, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "warsztat-od-kuchni",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/warsztat-od-kuchni.webp",
  readingTime: { pl: 6, en: 5, de: 5 },
  title: {
    pl: "AEJaCA od kuchni — sprzęt, materiały i proces tworzenia",
    en: "Inside AEJaCA — Equipment, Materials & Creative Process",
    de: "Hinter den Kulissen von AEJaCA — Ausstattung, Materialien & Prozess",
  },
  description: {
    pl: "Zaglądamy do warsztatu AEJaCA: drukarki 3D, lasery, narzędzia jubilerskie. Jak powstaje biżuteria i projekty studyjne od A do Z.",
    en: "A peek inside AEJaCA's workshop: 3D printers, lasers, jewelry tools. How jewelry and studio projects are made from A to Z.",
    de: "Ein Blick in die AEJaCA-Werkstatt: 3D-Drucker, Laser, Juwelierwerkzeuge. Wie Schmuck und Studio-Projekte von A bis Z entstehen.",
  },
  keywords: {
    pl: "warsztat jubilerski, drukarka 3D Bambu Lab, laser xTool P2, narzędzia jubilerskie, AEJaCA, proces tworzenia biżuterii",
    en: "jewelry workshop, 3D printer Bambu Lab, xTool P2 laser, jewelry tools, AEJaCA, jewelry making process",
    de: "Schmuckwerkstatt, 3D-Drucker Bambu Lab, xTool P2 Laser, Juwelierwerkzeuge, AEJaCA, Schmuckherstellung Prozess",
  },
  toc: {
    pl: [
      { id: "drukarki", label: "Drukarki 3D" },
      { id: "lasery", label: "Lasery" },
      { id: "jubilerstwo", label: "Narzędzia jubilerskie" },
      { id: "materialy", label: "Materiały" },
      { id: "flow", label: "Typowy dzień w warsztacie" },
    ],
    en: [
      { id: "printers", label: "3D printers" },
      { id: "lasers", label: "Lasers" },
      { id: "jewelry-tools", label: "Jewelry tools" },
      { id: "materials", label: "Materials" },
      { id: "flow", label: "A day in the workshop" },
    ],
    de: [
      { id: "drucker", label: "3D-Drucker" },
      { id: "laser", label: "Laser" },
      { id: "werkzeuge", label: "Juwelierwerkzeuge" },
      { id: "materialien", label: "Materialien" },
      { id: "ablauf", label: "Ein Tag in der Werkstatt" },
    ],
  },
  faq: {
    pl: [
      { q: "Czy mogę odwiedzić warsztat AEJaCA?", a: "Tak — po wcześniejszym umówieniu. Zapraszamy na konsultacje projektowe, podczas których można zobaczyć sprzęt i materiały na żywo." },
      { q: "Jakiej drukarki 3D używacie?", a: "Bambu Lab H2D — druk FDM z multi-materiałem (do 4 filamentów jednocześnie). Precyzja 0.1mm, powierzchnia robocza 256×256×256mm." },
      { q: "Jaki laser macie?", a: "CO2: xTool P2 55W (600×300mm) do materiałów organicznych. Fiber: Raycus 30W do metali, kamienia i ceramiki." },
      { q: "Czy realizujecie zlecenia dla firm?", a: "Tak — produkcja małoseryjna, prototypy, gadżety firmowe, biżuteria brandowa. Rabaty ilościowe od 20 sztuk." },
    ],
    en: [
      { q: "Can I visit the AEJaCA workshop?", a: "Yes — by appointment. We welcome design consultations where you can see equipment and materials in person." },
      { q: "What 3D printer do you use?", a: "Bambu Lab H2D — FDM with multi-material (up to 4 filaments simultaneously). 0.1mm precision, 256×256×256mm build volume." },
      { q: "What laser do you have?", a: "CO2: xTool P2 55W (600×300mm) for organic materials. Fiber: Raycus 30W for metals, stone, and ceramics." },
      { q: "Do you take business orders?", a: "Yes — small batch production, prototypes, branded merchandise, corporate jewelry. Volume discounts from 20 pieces." },
    ],
    de: [
      { q: "Kann ich die AEJaCA-Werkstatt besuchen?", a: "Ja — nach Vereinbarung. Wir begrüßen Designberatungen, bei denen Sie Geräte und Materialien persönlich sehen können." },
      { q: "Welchen 3D-Drucker nutzen Sie?", a: "Bambu Lab H2D — FDM mit Multi-Material (bis zu 4 Filamente gleichzeitig). 0,1mm Präzision, 256×256×256mm Bauraum." },
      { q: "Welchen Laser haben Sie?", a: "CO2: xTool P2 55W (600×300mm) für organische Materialien. Faserlaser: Raycus 30W für Metalle, Stein und Keramik." },
      { q: "Nehmen Sie Firmenaufträge an?", a: "Ja — Kleinserienproduktion, Prototypen, Markenartikel, Firmenschmuck. Mengenrabatte ab 20 Stück." },
    ],
  },
  relatedPosts: ["grawerowanie-laserowe-przewodnik", "druk-3d-krok-po-kroku", "odlewy-zywiczne-poradnik"],
};

export function Body({ lang }) {
  const t = (pl, en, de) => (lang === "pl" ? pl : lang === "de" ? de : en);

  return (
    <>
      <Lead>{t(
        "Za każdym pierścionkiem, każdym wydrukiem 3D i każdym grawerem stoi konkretny sprzęt, materiał i proces. Zapraszamy na wycieczkę po warsztacie AEJaCA.",
        "Behind every ring, every 3D print, and every engraving is specific equipment, material, and process. Welcome to the AEJaCA workshop tour.",
        "Hinter jedem Ring, jedem 3D-Druck und jeder Gravur stehen bestimmte Geräte, Materialien und Prozesse. Willkommen zur AEJaCA-Werkstattführung."
      )}</Lead>

      <H2 id={t("drukarki", "printers", "drucker")}>{t("Drukarki 3D", "3D Printers", "3D-Drucker")}</H2>
      <P>{t(
        "Serce naszego sTuDiO to Bambu Lab H2D — drukarka FDM nowej generacji.",
        "The heart of our sTuDiO is the Bambu Lab H2D — a next-gen FDM printer.",
        "Das Herz unseres sTuDiOs ist der Bambu Lab H2D — ein FDM-Drucker der nächsten Generation."
      )}</P>
      <Table
        headers={t(
          ["Parametr", "Wartość"],
          ["Parameter", "Value"],
          ["Parameter", "Wert"]
        )}
        rows={[
          [t("Technologia", "Technology", "Technologie"), "FDM (Fused Deposition Modeling)"],
          [t("Powierzchnia robocza", "Build volume", "Bauraum"), "256 × 256 × 256 mm"],
          [t("Precyzja warstwy", "Layer precision", "Schichtpräzision"), "0.05–0.3 mm"],
          [t("Materiały", "Materials", "Materialien"), "PLA, PETG, ABS, TPU, ASA, PA, PC"],
          [t("Multi-materiał", "Multi-material", "Multi-Material"), t("Do 4 filamentów jednocześnie (AMS)", "Up to 4 filaments simultaneously (AMS)", "Bis zu 4 Filamente gleichzeitig (AMS)")],
          [t("Prędkość max", "Max speed", "Max. Geschwindigkeit"), "500 mm/s"],
        ]}
      />
      <P>{t(
        "Multi-materiał oznacza, że w jednym wydruku łączymy kolory, twardości i materiały — np. elastyczny uchwyt z twardą obudową.",
        "Multi-material means we combine colors, hardnesses, and materials in a single print — e.g., a flexible grip with a hard housing.",
        "Multi-Material bedeutet, dass wir Farben, Härtegrade und Materialien in einem Druck kombinieren — z.B. einen flexiblen Griff mit einem harten Gehäuse."
      )}</P>

      <H2 id={t("lasery", "lasers", "laser")}>{t("Lasery", "Lasers", "Laser")}</H2>
      <Table
        headers={t(
          ["Maszyna", "Typ", "Moc", "Pole robocze", "Zastosowanie"],
          ["Machine", "Type", "Power", "Work area", "Application"],
          ["Maschine", "Typ", "Leistung", "Arbeitsfläche", "Anwendung"]
        )}
        rows={[
          ["xTool P2", "CO2", "55W", "600 × 300 mm", t("Drewno, akryl, skóra, szkło, papier", "Wood, acrylic, leather, glass, paper", "Holz, Acryl, Leder, Glas, Papier")],
          ["Raycus", t("Fiber (włóknowy)", "Fiber", "Faser"), "30W", "110 × 110 mm", t("Metal, biżuteria, kamień, ceramika", "Metal, jewelry, stone, ceramics", "Metall, Schmuck, Stein, Keramik")],
        ]}
      />
      <Callout accent="blue" title={t("Dwie maszyny, pełne pokrycie", "Two machines, full coverage", "Zwei Maschinen, volle Abdeckung")}>
        {t(
          "CO2 tnie i graweruje materiały organiczne. Fiber graweruje metale z precyzją 0.01mm. Razem obsługują 95% zamówień.",
          "CO2 cuts and engraves organic materials. Fiber engraves metals at 0.01mm precision. Together they handle 95% of orders.",
          "CO2 schneidet und graviert organische Materialien. Faserlaser graviert Metalle mit 0,01mm Präzision. Zusammen decken sie 95 % der Aufträge ab."
        )}
      </Callout>

      <H2 id={t("jubilerstwo", "jewelry-tools", "werkzeuge")}>{t("Narzędzia jubilerskie", "Jewelry Tools", "Juwelierwerkzeuge")}</H2>
      <P>{t(
        "Poza technologią cyfrową, warsztat jubilerski to klasyczne narzędzia rzemieślnicze:",
        "Beyond digital tech, our jewelry bench features classic craft tools:",
        "Neben digitaler Technik umfasst unsere Schmuckwerkbank klassische Handwerkzeuge:"
      )}</P>
      <UL>
        <LI><Strong>{t("Palnik jubilerski", "Jeweler's torch", "Juwelierbrenner")}</Strong> — {t("lutowanie srebra i złota, podgrzewanie do kucia", "soldering silver and gold, heating for forging", "Löten von Silber und Gold, Erhitzen zum Schmieden")}</LI>
        <LI><Strong>{t("Piłki i pilniki", "Saws & files", "Sägen & Feilen")}</Strong> — {t("precyzyjne cięcie i kształtowanie metalu", "precision cutting and shaping metal", "Präzisionsschnitt und Metallformung")}</LI>
        <LI><Strong>{t("Polerka / tumbler", "Polisher / tumbler", "Poliermaschine / Tumbler")}</Strong> — {t("wykończenie powierzchni od matu do lustra", "surface finishing from matte to mirror", "Oberflächenbearbeitung von matt bis Spiegel")}</LI>
        <LI><Strong>{t("Narzędzia do osadzania", "Setting tools", "Fasswerkzeuge")}</Strong> — {t("oprawki, pchacze, kołki do kamieni szlachetnych", "bezels, pushers, prongs for gemstones", "Zargenfasser, Drücker, Krappen für Edelsteine")}</LI>
        <LI><Strong>{t("Lupa jubilerska 10×", "Jeweler's loupe 10×", "Juwelierlupe 10×")}</Strong> — {t("kontrola jakości kamieni i lutów", "quality control of stones and solder joints", "Qualitätskontrolle von Steinen und Lötstellen")}</LI>
      </UL>

      <H2 id={t("materialy", "materials", "materialien")}>{t("Materiały na stanie", "Materials in Stock", "Materialien auf Lager")}</H2>
      <UL>
        <LI><Strong>{t("Metale", "Metals", "Metalle")}</Strong> — {t("Ag 925, Au 585, Au 750, mosiądz, miedź, stal nierdzewna", "Ag 925, Au 585, Au 750, brass, copper, stainless steel", "Ag 925, Au 585, Au 750, Messing, Kupfer, Edelstahl")}</LI>
        <LI><Strong>{t("Kamienie", "Stones", "Steine")}</Strong> — {t("diamenty, moissanity, szafiry, szmaragdy, rubiny, turmaliny, opale, perły", "diamonds, moissanites, sapphires, emeralds, rubies, tourmalines, opals, pearls", "Diamanten, Moissanite, Saphire, Smaragde, Rubine, Turmaline, Opale, Perlen")}</LI>
        <LI><Strong>{t("Filamenty 3D", "3D filaments", "3D-Filamente")}</Strong> — {t("PLA, PETG, ABS, TPU, PA (nylon), ASA — ponad 40 kolorów", "PLA, PETG, ABS, TPU, PA (nylon), ASA — over 40 colors", "PLA, PETG, ABS, TPU, PA (Nylon), ASA — über 40 Farben")}</LI>
        <LI><Strong>{t("Żywice", "Resins", "Harze")}</Strong> — {t("UV (ABS-like, flex), epoksydowa dwukomponentowa, barwniki i pigmenty", "UV (ABS-like, flex), 2K epoxy, dyes and pigments", "UV (ABS-artig, flex), 2K-Epoxid, Farbstoffe und Pigmente")}</LI>
        <LI><Strong>{t("Materiały laserowe", "Laser materials", "Lasermaterialien")}</Strong> — {t("sklejka brzozowa, akryl, skóra, filc, anodyzowane aluminium", "birch plywood, acrylic, leather, felt, anodized aluminum", "Birkensperrholz, Acryl, Leder, Filz, eloxiertes Aluminium")}</LI>
      </UL>

      <H2 id={t("flow", "flow", "ablauf")}>{t("Typowy dzień w warsztacie", "A Day in the Workshop", "Ein Tag in der Werkstatt")}</H2>
      <P>{t(
        "Nie ma dwóch takich samych dni — ale typowy flow wygląda mniej więcej tak:",
        "No two days are the same — but a typical flow looks roughly like this:",
        "Kein Tag gleicht dem anderen — aber ein typischer Ablauf sieht ungefähr so aus:"
      )}</P>
      <UL>
        <LI><Strong>{t("Rano", "Morning", "Morgens")}</Strong> — {t("sprawdzenie zamówień, odpowiedzi na maile, planowanie kolejności", "check orders, reply to emails, plan sequence", "Bestellungen prüfen, E-Mails beantworten, Reihenfolge planen")}</LI>
        <LI><Strong>{t("Przed południem", "Late morning", "Vormittags")}</Strong> — {t("praca jubilerska: lutowanie, pilowanie, osadzanie kamieni", "jewelry work: soldering, filing, stone setting", "Schmuckarbeit: Löten, Feilen, Steinfassung")}</LI>
        <LI><Strong>{t("Po południu", "Afternoon", "Nachmittags")}</Strong> — {t("druk 3D i laser: przygotowanie plików, uruchomienie maszyn, kontrola jakości", "3D printing and laser: file prep, machine runs, quality control", "3D-Druck und Laser: Dateivorbereitung, Maschinenlauf, Qualitätskontrolle")}</LI>
        <LI><Strong>{t("Wieczorem", "Evening", "Abends")}</Strong> — {t("długie wydruki na noc, dokumentacja fotograficzna, wysyłka", "overnight prints, photo documentation, shipping", "Übernacht-Drucke, Fotodokumentation, Versand")}</LI>
      </UL>

      <CTABox
        accent="blue"
        title={t("Zamów projekt w sTuDiO", "Order a sTuDiO Project", "Bestellen Sie ein sTuDiO-Projekt")}
        text={t(
          "Wrzuć plik STL/SVG do kalkulatora lub napisz do nas z opisem projektu — wycenimy go w ciągu 24h.",
          "Upload an STL/SVG to the calculator or write to us with your project description — we'll quote within 24h.",
          "Laden Sie eine STL/SVG in den Kalkulator hoch oder schreiben Sie uns mit Ihrer Projektbeschreibung — wir kalkulieren innerhalb von 24 Stunden."
        )}
        href="/studio#calculator"
        cta={t("Otwórz kalkulator", "Open calculator", "Kalkulator öffnen")}
      />
    </>
  );
}
