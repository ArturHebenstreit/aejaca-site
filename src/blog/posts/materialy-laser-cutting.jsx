import { H2, H3, P, Lead, UL, LI, Strong, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "materialy-laser-cutting",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/materialy-laser-cutting.webp",
  readingTime: { pl: 7, en: 5, de: 5 },
  title: {
    pl: "Materiały do grawerowania i cięcia laserowego — co się nadaje?",
    en: "Laser Cutting & Engraving Materials — What Works?",
    de: "Laserschnitt- & Gravurmaterialien — Was funktioniert?",
  },
  description: {
    pl: "Przegląd materiałów do lasera CO2 i Fiber: drewno, akryl, skóra, metal, szkło, kamień. Grubości, ograniczenia i ceny w AEJaCA sTuDiO.",
    en: "Overview of CO2 and Fiber laser materials: wood, acrylic, leather, metal, glass, stone. Thicknesses, limitations, and pricing at AEJaCA sTuDiO.",
    de: "Überblick über CO2- und Faserlaser-Materialien: Holz, Acryl, Leder, Metall, Glas, Stein. Stärken, Einschränkungen und Preise im AEJaCA sTuDiO.",
  },
  keywords: {
    pl: "materiały do lasera, cięcie laserowe drewno, grawerowanie metalu, laser CO2 materiały, fiber laser materiały, AEJaCA sTuDiO",
    en: "laser cutting materials, laser engraving wood, metal engraving, CO2 laser materials, fiber laser materials, AEJaCA sTuDiO",
    de: "Laserschnitt Materialien, Lasergravur Holz, Metallgravur, CO2-Laser Materialien, Faserlaser Materialien, AEJaCA sTuDiO",
  },
  toc: {
    pl: [
      { id: "co2", label: "Materiały CO2" },
      { id: "fiber", label: "Materiały Fiber" },
      { id: "nie-nadaje", label: "Czego unikać" },
      { id: "grubosci", label: "Grubości i limity" },
      { id: "cennik", label: "Cennik" },
    ],
    en: [
      { id: "co2", label: "CO2 materials" },
      { id: "fiber", label: "Fiber materials" },
      { id: "avoid", label: "What to avoid" },
      { id: "thickness", label: "Thickness limits" },
      { id: "pricing", label: "Pricing" },
    ],
    de: [
      { id: "co2", label: "CO2-Materialien" },
      { id: "fiber", label: "Faserlaser-Materialien" },
      { id: "vermeiden", label: "Was vermeiden" },
      { id: "staerken", label: "Stärken & Limits" },
      { id: "preise", label: "Preise" },
    ],
  },
  faq: {
    pl: [
      { q: "Czy laser CO2 tnie metal?", a: "Nie. CO2 55W tnie materiały organiczne (drewno, akryl, skóra) do 10mm. Do metalu potrzebny jest fiber laser." },
      { q: "Jaka jest maksymalna grubość cięcia?", a: "Drewno do 10mm, akryl do 12mm, skóra do 4mm. Powyżej tych wartości jakość krawędzi spada." },
      { q: "Czy można grawerować na szkle?", a: "Tak — laser CO2 graweruje na szkle (matowienie), ale go nie tnie. Fiber radzi sobie z ceramiką i kamieniem." },
      { q: "Jakie pliki potrzebuję do cięcia?", a: "Wektorowe: SVG, AI, DXF. Do grawerowania rastrowego: PNG, JPG (min. 300 DPI)." },
    ],
    en: [
      { q: "Can CO2 laser cut metal?", a: "No. CO2 55W cuts organic materials (wood, acrylic, leather) up to 10mm. Metal requires a fiber laser." },
      { q: "What's the maximum cutting thickness?", a: "Wood up to 10mm, acrylic up to 12mm, leather up to 4mm. Beyond these, edge quality drops." },
      { q: "Can you engrave on glass?", a: "Yes — CO2 laser engraves glass (frosting effect) but doesn't cut it. Fiber handles ceramics and stone." },
      { q: "What files do I need for cutting?", a: "Vector: SVG, AI, DXF. For raster engraving: PNG, JPG (min. 300 DPI)." },
    ],
    de: [
      { q: "Kann der CO2-Laser Metall schneiden?", a: "Nein. CO2 55W schneidet organische Materialien (Holz, Acryl, Leder) bis 10mm. Für Metall braucht man einen Faserlaser." },
      { q: "Was ist die maximale Schnittstärke?", a: "Holz bis 10mm, Acryl bis 12mm, Leder bis 4mm. Darüber hinaus nimmt die Kantenqualität ab." },
      { q: "Kann man auf Glas gravieren?", a: "Ja — der CO2-Laser graviert Glas (Mattierungseffekt), schneidet es aber nicht. Faserlaser bearbeitet Keramik und Stein." },
      { q: "Welche Dateien brauche ich zum Schneiden?", a: "Vektor: SVG, AI, DXF. Für Rastergravur: PNG, JPG (min. 300 DPI)." },
    ],
  },
  relatedPosts: ["grawerowanie-laserowe-przewodnik", "druk-3d-krok-po-kroku", "warsztat-od-kuchni"],
};

export function Body({ lang }) {
  const t = (pl, en, de) => (lang === "pl" ? pl : lang === "de" ? de : en);

  return (
    <>
      <Lead>{t(
        "Nie każdy materiał nadaje się do lasera — a ten sam materiał zachowuje się inaczej pod CO2 i Fiber. Oto kompletny przegląd.",
        "Not every material works with a laser — and the same material behaves differently under CO2 vs Fiber. Here's the complete overview.",
        "Nicht jedes Material eignet sich für den Laser — und dasselbe Material verhält sich unter CO2 und Faserlaser unterschiedlich. Hier der komplette Überblick."
      )}</Lead>

      <H2 id="co2">{t("Materiały do lasera CO2", "CO2 Laser Materials", "CO2-Laser-Materialien")}</H2>
      <P>{t(
        "Laser CO2 (xTool P2, 55W) to maszyna do materiałów organicznych i niemetalowych. Grawer + cięcie.",
        "The CO2 laser (xTool P2, 55W) is designed for organic and non-metal materials. Engraving + cutting.",
        "Der CO2-Laser (xTool P2, 55W) ist für organische und nichtmetallische Materialien ausgelegt. Gravur + Schnitt."
      )}</P>
      <Table
        headers={t(
          ["Materiał", "Grawer", "Cięcie", "Max grubość", "Uwagi"],
          ["Material", "Engrave", "Cut", "Max thickness", "Notes"],
          ["Material", "Gravur", "Schnitt", "Max. Stärke", "Hinweise"]
        )}
        rows={[
          [t("Sklejka/drewno", "Plywood/wood", "Sperrholz/Holz"), "✓", "✓", "10mm", t("Brzoza, buk, bambus najlepsze", "Birch, beech, bamboo work best", "Birke, Buche, Bambus am besten")],
          [t("Akryl (plexiglas)", "Acrylic (plexiglass)", "Acryl (Plexiglas)"), "✓", "✓", "12mm", t("Lany > ekstrudowany", "Cast > extruded", "Gegossen > extrudiert")],
          [t("Skóra naturalna", "Natural leather", "Naturleder"), "✓", "✓", "4mm", t("Bez PVC! (toksyczne opary)", "No PVC! (toxic fumes)", "Kein PVC! (giftige Dämpfe)")],
          [t("Filc/tkanina", "Felt/fabric", "Filz/Stoff"), "✓", "✓", "3mm", t("Syntetyki mogą się topić", "Synthetics may melt", "Synthetik kann schmelzen")],
          [t("Papier/karton", "Paper/cardboard", "Papier/Karton"), "✓", "✓", "2mm", t("Idealne na zaproszenia, modele", "Perfect for invitations, models", "Ideal für Einladungen, Modelle")],
          [t("Szkło", "Glass", "Glas"), "✓", "✗", "—", t("Matowienie powierzchni", "Surface frosting", "Oberflächenmattierung")],
          [t("Anodyzowany aluminium", "Anodized aluminum", "Eloxiertes Aluminium"), "✓", "✗", "—", t("Usuwa warstwę barwiącą", "Removes color layer", "Entfernt Farbschicht")],
        ]}
      />

      <H2 id="fiber">{t("Materiały do lasera Fiber", "Fiber Laser Materials", "Faserlaser-Materialien")}</H2>
      <P>{t(
        "Fiber laser (Raycus 30W) to precyzyjne narzędzie do metali i twardych materiałów. Tylko grawer — nie tnie.",
        "The fiber laser (Raycus 30W) is a precision tool for metals and hard materials. Engraving only — no cutting.",
        "Der Faserlaser (Raycus 30W) ist ein Präzisionswerkzeug für Metalle und harte Materialien. Nur Gravur — kein Schnitt."
      )}</P>
      <Table
        headers={t(
          ["Materiał", "Jakość graweru", "Zastosowanie"],
          ["Material", "Engrave quality", "Application"],
          ["Material", "Gravurqualität", "Anwendung"]
        )}
        rows={[
          [t("Stal nierdzewna", "Stainless steel", "Edelstahl"), t("Doskonała", "Excellent", "Ausgezeichnet"), t("Biżuteria, narzędzia, tabliczki", "Jewelry, tools, plates", "Schmuck, Werkzeuge, Schilder")],
          [t("Srebro 925", "Silver 925", "Silber 925"), t("Doskonała", "Excellent", "Ausgezeichnet"), t("Pierścionki, wisiorki, sygnety", "Rings, pendants, signets", "Ringe, Anhänger, Siegelringe")],
          [t("Złoto", "Gold", "Gold"), t("Bardzo dobra", "Very good", "Sehr gut"), t("Obrączki, bransoletki", "Bands, bracelets", "Ringe, Armbänder")],
          [t("Mosiądz", "Brass", "Messing"), t("Doskonała", "Excellent", "Ausgezeichnet"), t("Tabliczki firmowe, dekory", "Business plates, decor", "Firmenschilder, Deko")],
          [t("Tytan", "Titanium", "Titan"), t("Bardzo dobra", "Very good", "Sehr gut"), t("Pierścionki, implanty", "Rings, implants", "Ringe, Implantate")],
          [t("Ceramika", "Ceramics", "Keramik"), t("Dobra", "Good", "Gut"), t("Kubki, kafelki, tablice", "Mugs, tiles, plates", "Tassen, Fliesen, Tafeln")],
          [t("Kamień", "Stone", "Stein"), t("Dobra", "Good", "Gut"), t("Nagrobki, pamiątki", "Tombstones, souvenirs", "Grabsteine, Souvenirs")],
        ]}
      />

      <H2 id={t("nie-nadaje", "avoid", "vermeiden")}>{t("Czego unikać", "What to Avoid", "Was vermeiden")}</H2>
      <Callout accent="blue" title={t("Ostrzeżenie", "Warning", "Warnung")}>
        {t(
          "Nigdy nie tnij laserowo PVC, winylu ani poliwęglanu — wydziela trujący chlorowodór (HCl). Materiały odbijające (lustra, polerowana miedź) mogą uszkodzić optykę CO2.",
          "Never laser cut PVC, vinyl, or polycarbonate — they release toxic hydrogen chloride (HCl). Reflective materials (mirrors, polished copper) can damage CO2 optics.",
          "Niemals PVC, Vinyl oder Polycarbonat laserschneiden — sie setzen giftigen Chlorwasserstoff (HCl) frei. Reflektierende Materialien (Spiegel, poliertes Kupfer) können die CO2-Optik beschädigen."
        )}
      </Callout>
      <UL>
        <LI><Strong>PVC / Vinyl</Strong> — {t("toksyczne opary, zakazane", "toxic fumes, forbidden", "giftige Dämpfe, verboten")}</LI>
        <LI><Strong>{t("Poliwęglan (Lexan)", "Polycarbonate (Lexan)", "Polycarbonat (Lexan)")}</Strong> — {t("żółknie, nie tnie się czysto", "yellows, doesn't cut cleanly", "vergilbt, schneidet nicht sauber")}</LI>
        <LI><Strong>ABS</Strong> — {t("topi się, wydziela opary", "melts, releases fumes", "schmilzt, setzt Dämpfe frei")}</LI>
        <LI><Strong>{t("Styropian/pianka", "Styrofoam/foam", "Styropor/Schaum")}</Strong> — {t("ryzyko pożaru", "fire hazard", "Brandgefahr")}</LI>
      </UL>

      <H2 id={t("grubosci", "thickness", "staerken")}>{t("Grubości i limity", "Thickness Limits", "Stärken & Limits")}</H2>
      <P>{t(
        "Nasze limity cięcia zależą od materiału i mocy lasera (xTool P2 55W CO2):",
        "Our cutting limits depend on material and laser power (xTool P2 55W CO2):",
        "Unsere Schnittgrenzen hängen von Material und Laserleistung ab (xTool P2 55W CO2):"
      )}</P>
      <UL>
        <LI>{t("Drewno: do 10mm (jedna przejazd), 15mm (wieloprzejazd, gorsze krawędzie)", "Wood: up to 10mm (single pass), 15mm (multi-pass, rougher edges)", "Holz: bis 10mm (Einzeldurchgang), 15mm (Mehrfachdurchgang, rauere Kanten)")}</LI>
        <LI>{t("Akryl: do 12mm (lany), 8mm (ekstrudowany)", "Acrylic: up to 12mm (cast), 8mm (extruded)", "Acryl: bis 12mm (gegossen), 8mm (extrudiert)")}</LI>
        <LI>{t("Skóra: do 4mm", "Leather: up to 4mm", "Leder: bis 4mm")}</LI>
        <LI>{t("Obszar roboczy: 600×300mm", "Work area: 600×300mm", "Arbeitsfläche: 600×300mm")}</LI>
      </UL>

      <H2 id={t("cennik", "pricing", "preise")}>{t("Cennik orientacyjny", "Indicative Pricing", "Richtpreise")}</H2>
      <Table
        headers={t(
          ["Usługa", "Cena od", "Czas"],
          ["Service", "Price from", "Turnaround"],
          ["Leistung", "Preis ab", "Lieferzeit"]
        )}
        rows={[
          [t("Grawer CO2 (do A4)", "CO2 engraving (up to A4)", "CO2-Gravur (bis A4)"), t("od 20 zł", "from €5", "ab 5 €"), t("1 dzień roboczy", "1 business day", "1 Werktag")],
          [t("Cięcie CO2 (do A4)", "CO2 cutting (up to A4)", "CO2-Schnitt (bis A4)"), t("od 35 zł", "from €8", "ab 8 €"), t("1 dzień roboczy", "1 business day", "1 Werktag")],
          [t("Grawer Fiber na metalu", "Fiber engraving on metal", "Faserlaser-Gravur auf Metall"), t("od 40 zł", "from €10", "ab 10 €"), t("1–2 dni robocze", "1–2 business days", "1–2 Werktage")],
          [t("Grawer biżuterii (pierścionek)", "Jewelry engraving (ring)", "Schmuckgravur (Ring)"), t("od 65 zł", "from €15", "ab 15 €"), t("1 dzień roboczy", "1 business day", "1 Werktag")],
          [t("Seria 50+ sztuk", "Batch 50+ pieces", "Serie 50+ Stück"), t("wycena indywidualna", "individual quote", "individuelles Angebot"), t("2–5 dni roboczych", "2–5 business days", "2–5 Werktage")],
        ]}
      />

      <CTABox
        accent="blue"
        title={t("Wycena grawerowania i cięcia", "Engraving & Cutting Quote", "Gravur- & Schnitt-Angebot")}
        text={t(
          "Wybierz materiał i wymiar w kalkulatorze sTuDiO — otrzymasz wycenę w kilka sekund.",
          "Pick your material and size in the sTuDiO calculator — get a quote in seconds.",
          "Wählen Sie Material und Größe im sTuDiO-Kalkulator — Angebot in Sekunden."
        )}
        href="/studio#calculator"
        cta={t("Otwórz kalkulator", "Open calculator", "Kalkulator öffnen")}
      />
    </>
  );
}
