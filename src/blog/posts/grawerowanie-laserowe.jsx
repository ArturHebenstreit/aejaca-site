import { H2, H3, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export const meta = {
  slug: "grawerowanie-laserowe-przewodnik",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-17",
  updatedAt: "2026-04-17",
  coverImage: "/img/blog/grawerowanie-laserowe.jpg",
  readingTime: { pl: 6, en: 5, de: 5 },
  title: {
    pl: "Grawerowanie laserowe — przewodnik po materiałach, technikach i zastosowaniach",
    en: "Laser Engraving — A Guide to Materials, Techniques & Applications",
    de: "Lasergravur — Leitfaden zu Materialien, Techniken & Anwendungen",
  },
  description: {
    pl: "Laser CO2 vs fiber, jakie materiały można grawerować, zastosowania, ceny. Kompletny przewodnik po usługach grawerowania laserowego w AEJaCA sTuDiO.",
    en: "CO2 vs fiber laser, which materials can be engraved, applications, pricing. A complete guide to laser engraving services at AEJaCA sTuDiO.",
    de: "CO2- vs. Faserlaser, welche Materialien graviert werden können, Anwendungen, Preise. Ein vollständiger Leitfaden zu den Lasergravurdiensten von AEJaCA sTuDiO.",
  },
  keywords: {
    pl: "grawerowanie laserowe, laser CO2, laser fiber, grawer na metalu, grawerowanie laserowe cena, usługi grawerowania Warszawa",
    en: "laser engraving guide, CO2 vs fiber laser, laser engraving materials, custom engraving service Europe",
    de: "Lasergravur Leitfaden, CO2 vs Faserlaser, Lasergravur Materialien, individuelle Gravur Europa",
  },
  faq: {
    pl: [
      { q: "Ile kosztuje grawerowanie laserowe?", a: "Cena zależy od materiału, rozmiaru i złożoności grafiki. Prosty grawer na drewnie (10×10 cm) to od 40 zł, na metalu od 65 zł. Personalizacja biżuterii (np. inskrypcja w pierścionku) od 20 zł. Wycena w 24h." },
      { q: "Jakie materiały można grawerować laserem?", a: "Laser CO2: drewno, sklejka, akryl, skóra, papier, tkaniny, szkło (powierzchniowo). Laser fiber: stal, aluminium, miedź, mosiądz, tytan, srebro, złoto, ceramika, kamień." },
      { q: "Czym różni się grawerowanie od cięcia laserowego?", a: "Grawerowanie usuwa materiał z powierzchni (tworzy rysunek/tekst). Cięcie przechodzi przez cały materiał. Laser CO2 tnie drewno i akryl do 10 mm grubości, fiber tnie cienkie metale do 1-2 mm." },
      { q: "Czy mogę dostarczyć własny plik graficzny?", a: "Tak — akceptujemy .SVG, .AI, .DXF, .PDF (wektory) oraz .PNG/.JPG (rastry, konwertujemy na wektor). Jeśli nie masz pliku, zaprojektujemy grafikę od zera." },
    ],
    en: [
      { q: "How much does laser engraving cost?", a: "It depends on material, size, and design complexity. A simple wood engraving (10×10 cm) starts at €10, metal from €15. Jewelry personalization (e.g., ring inscription) from €5. Quote within 24h." },
      { q: "What materials can be laser engraved?", a: "CO2 laser: wood, plywood, acrylic, leather, paper, fabric, glass (surface). Fiber laser: steel, aluminum, copper, brass, titanium, silver, gold, ceramics, stone." },
      { q: "What's the difference between engraving and cutting?", a: "Engraving removes surface material (creates a design/text). Cutting goes through the entire material. CO2 cuts wood and acrylic up to 10 mm thick, fiber cuts thin metals up to 1-2 mm." },
      { q: "Can I provide my own design file?", a: "Yes — we accept .SVG, .AI, .DXF, .PDF (vectors) and .PNG/.JPG (rasters, we'll convert to vector). If you don't have a file, we'll design the artwork from scratch." },
    ],
    de: [
      { q: "Was kostet Lasergravur?", a: "Das hängt von Material, Größe und Designkomplexität ab. Eine einfache Holzgravur (10×10 cm) beginnt bei 10 €, Metall ab 15 €. Schmuckpersonalisierung (z.B. Ringgravur) ab 5 €. Angebot innerhalb von 24h." },
      { q: "Welche Materialien können lasergraviert werden?", a: "CO2-Laser: Holz, Sperrholz, Acryl, Leder, Papier, Stoff, Glas (Oberfläche). Faserlaser: Stahl, Aluminium, Kupfer, Messing, Titan, Silber, Gold, Keramik, Stein." },
      { q: "Was ist der Unterschied zwischen Gravieren und Schneiden?", a: "Gravieren entfernt Oberflächenmaterial (erzeugt Design/Text). Schneiden geht durch das gesamte Material. CO2 schneidet Holz und Acryl bis 10 mm, Faser schneidet dünne Metalle bis 1-2 mm." },
      { q: "Kann ich meine eigene Designdatei liefern?", a: "Ja — wir akzeptieren .SVG, .AI, .DXF, .PDF (Vektoren) und .PNG/.JPG (Raster, wir konvertieren zu Vektor)." },
    ],
  },
  toc: {
    pl: [
      { id: "co2-vs-fiber", label: "CO2 vs fiber" },
      { id: "materialy", label: "Materiały" },
      { id: "grawer-vs-ciecie", label: "Grawer vs cięcie" },
      { id: "zastosowania", label: "Zastosowania" },
      { id: "ceny", label: "Ceny" },
      { id: "faq", label: "FAQ" },
    ],
    en: [
      { id: "co2-vs-fiber", label: "CO2 vs fiber" },
      { id: "materials", label: "Materials" },
      { id: "engrave-vs-cut", label: "Engraving vs cutting" },
      { id: "applications", label: "Applications" },
      { id: "pricing", label: "Pricing" },
      { id: "faq", label: "FAQ" },
    ],
    de: [
      { id: "co2-vs-faser", label: "CO2 vs Faser" },
      { id: "materialien", label: "Materialien" },
      { id: "gravieren-vs-schneiden", label: "Gravieren vs Schneiden" },
      { id: "anwendungen", label: "Anwendungen" },
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
        Grawerowanie laserowe to najszybsza droga od grafiki do trwałego znaku na dowolnym materiale — od drewna i skóry, przez akryl, po stal i srebro. W AEJaCA sTuDiO mamy dwa typy laserów, z których każdy ma swoją supermoc.
      </Lead>

      <H2 id="co2-vs-fiber">Laser CO2 vs laser światłowodowy (fiber) — różnica</H2>
      <Table
        headers={["", "Laser CO2", "Laser Fiber (Raycus 30W)"]}
        rows={[
          ["Długość fali", "10 600 nm (podczerwień)", "1064 nm (bliski podczerwień)"],
          ["Materiały", "Organiczne: drewno, skóra, akryl, papier, tkaniny, szkło", "Metale: stal, aluminium, miedź, mosiądz, tytan, srebro, złoto + ceramika, kamień"],
          ["Grawer", "Tak (wypalanie/odbarwianie)", "Tak (znakowanie, anilowanie, głębokie trawienie)"],
          ["Cięcie", "Tak — drewno do 10 mm, akryl do 15 mm", "Cienkie metale do 1–2 mm"],
          ["Precyzja", "~0.1 mm", "~0.02 mm"],
          ["Najlepsze do", "Tabliczki, pudełka, dekoracje, skórzane wyroby", "Biżuteria, narzędzia, tabliczki znamionowe, elektronika"],
        ]}
      />
      <P>
        <Strong>Krótko:</Strong> CO2 = materiały organiczne + cięcie. Fiber = metale + ekstremalny detal. AEJaCA sTuDiO ma oba, więc nie musisz szukać dwóch dostawców.
      </P>

      <H2 id="materialy">Jakie materiały możesz grawerować?</H2>
      <H3>Laser CO2:</H3>
      <UL>
        <LI><Strong>Drewno i sklejka</Strong> — najpopularniejsze. Ciemny, kontrastowy grawer. Możliwość cięcia kształtów.</LI>
        <LI><Strong>Akryl (pleksi)</Strong> — gładki, biały grawer na kolorowym tle. Cięcie daje polerowaną krawędź.</LI>
        <LI><Strong>Skóra naturalna i ekologiczna</Strong> — personalizacja portfeli, pasków, okładek.</LI>
        <LI><Strong>Papier i karton</Strong> — precyzyjne wycinanie zaproszeń, wizytówek, opakowań.</LI>
        <LI><Strong>Szkło</Strong> — grawerowanie powierzchniowe (matowienie). Nie tnie szkła.</LI>
      </UL>
      <H3>Laser Fiber:</H3>
      <UL>
        <LI><Strong>Stal nierdzewna, aluminium</Strong> — czarny lub biały grawer (anilowanie / trawienie). Tabliczki znamionowe, narzędzia, elementy maszyn.</LI>
        <LI><Strong>Miedź, mosiądz</Strong> — personalizacja elementów dekoracyjnych, klamek, osprzętu.</LI>
        <LI><Strong>Srebro i złoto</Strong> — inskrypcje w biżuterii, znakowanie próby. Precyzja do 0.02 mm.</LI>
        <LI><Strong>Tytan</Strong> — kolorowe znakowanie (anilowanie tytanu daje tęczowy efekt przy odpowiedniej mocy).</LI>
        <LI><Strong>Ceramika i kamień</Strong> — grawerowanie na płytkach, nagrobkach, pamiątkach.</LI>
      </UL>

      <H2 id="grawer-vs-ciecie">Grawerowanie vs cięcie — co możesz zrobić?</H2>
      <P>
        <Strong>Grawerowanie</Strong> usuwa cienką warstwę materiału, tworząc rysunek, tekst lub zdjęcie na powierzchni. Głębokość: od 0.01 mm (znakowanie) do 2 mm (głęboki grawer).
      </P>
      <P>
        <Strong>Cięcie</Strong> przechodzi przez cały materiał — wycinasz kształt. CO2 tnie drewno do ~10 mm, akryl do ~15 mm. Fiber tnie cienkie blachy (do 1–2 mm w zależności od metalu).
      </P>

      <H2 id="zastosowania">Najpopularniejsze zastosowania</H2>
      <UL>
        <LI><Strong>Personalizacja biżuterii</Strong> — inskrypcje, daty, inicjały na pierścionkach, bransoletkach, wisiorach</LI>
        <LI><Strong>Gadżety firmowe</Strong> — logo na długopisach, pendrive'ach, brelokach, butelkach</LI>
        <LI><Strong>Dekoracje wnętrz</Strong> — tabliczki z drewna/akrylu, ramki, podkładki pod kubki</LI>
        <LI><Strong>Prototypy i małe serie</Strong> — wycinanie elementów obudów, maskowanie, szablony</LI>
        <LI><Strong>Prezenty personalizowane</Strong> — pudełka, albumy, etui na telefon z dedykacją</LI>
        <LI><Strong>Tabliczki znamionowe</Strong> — trwałe znakowanie maszyn, urządzeń, paneli</LI>
      </UL>

      <H2 id="ceny">Cena i czas realizacji</H2>
      <Table
        headers={["Usługa", "Orientacyjna cena"]}
        rows={[
          ["Grawer na drewnie / akrylu (do 10×10 cm)", "od 40 zł"],
          ["Grawer na metalu (do 10×10 cm)", "od 65 zł"],
          ["Personalizacja biżuterii (inskrypcja)", "od 20 zł"],
          ["Cięcie laserowe drewna/akrylu (do A4)", "od 35 zł"],
          ["Projekt grafiki wektorowej", "od 85 zł"],
        ]}
      />
      <P>
        Standardowy czas realizacji: <Strong>1–3 dni robocze</Strong>. Ekspres (ten sam dzień / 24h) możliwy za dopłatą.
      </P>
      <Callout accent="blue" title="Wskazówka">
        Wyślij grafikę (.SVG, .AI, .DXF lub nawet .JPG) — wycenimy w 24h.
        <br /><A href="/studio#calculator">Kalkulator wyceny sTuDiO →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Zagrawiruj swój projekt"
        text="Prześlij grafikę lub opisz pomysł — wycenimy i zrealizujemy w 1–3 dni."
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
        Laser engraving is the fastest path from a graphic to a permanent mark on virtually any material — from wood and leather to steel and silver. At AEJaCA sTuDiO, we run two laser types, each with its own superpower.
      </Lead>

      <H2 id="co2-vs-fiber">CO2 laser vs fiber laser — the difference</H2>
      <Table
        headers={["", "CO2 Laser", "Fiber Laser (Raycus 30W)"]}
        rows={[
          ["Materials", "Organic: wood, leather, acrylic, paper, fabric, glass", "Metals: steel, aluminum, copper, brass, titanium, silver, gold + ceramics, stone"],
          ["Engraving", "Yes (burning / discoloring)", "Yes (marking, annealing, deep etching)"],
          ["Cutting", "Yes — wood to 10 mm, acrylic to 15 mm", "Thin metals to 1–2 mm"],
          ["Precision", "~0.1 mm", "~0.02 mm"],
          ["Best for", "Signs, boxes, décor, leather goods", "Jewelry, tools, nameplates, electronics"],
        ]}
      />
      <P>
        <Strong>In short:</Strong> CO2 = organic materials + cutting. Fiber = metals + extreme detail. AEJaCA sTuDiO has both.
      </P>

      <H2 id="materials">What materials can you engrave?</H2>
      <P>
        <Strong>CO2:</Strong> wood, plywood, acrylic, leather, paper, cardboard, fabric, glass (surface only).
      </P>
      <P>
        <Strong>Fiber:</Strong> stainless steel, aluminum, copper, brass, silver, gold, titanium (rainbow annealing!), ceramics, stone.
      </P>

      <H2 id="engrave-vs-cut">Engraving vs cutting</H2>
      <P>
        Engraving removes a thin layer of surface material — creating text, images, or patterns. Depth: 0.01–2 mm. Cutting goes all the way through. CO2 cuts wood up to ~10 mm, acrylic up to ~15 mm. Fiber cuts thin sheet metal up to 1–2 mm.
      </P>

      <H2 id="applications">Most popular applications</H2>
      <UL>
        <LI>Jewelry personalization — inscriptions, dates, initials on rings and pendants</LI>
        <LI>Corporate gifts — logos on pens, USB drives, keychains, bottles</LI>
        <LI>Home décor — wooden/acrylic signs, coasters, frames</LI>
        <LI>Prototyping — enclosure cutouts, stencils, jigs</LI>
        <LI>Personalized gifts — boxes, albums, phone cases with dedications</LI>
        <LI>Nameplates — permanent marking for machines and equipment</LI>
      </UL>

      <H2 id="pricing">Pricing & turnaround</H2>
      <P>
        Wood/acrylic engraving from €10, metal from €15, jewelry inscriptions from €5. Standard turnaround: <Strong>1–3 business days</Strong>. Express (same day / 24h) available for a surcharge.
      </P>

      <CTABox
        accent="blue"
        title="Engrave your project"
        text="Send your artwork or describe your idea — we'll quote and deliver in 1–3 days."
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
        Lasergravur ist der schnellste Weg von einer Grafik zu einer dauerhaften Markierung auf praktisch jedem Material — von Holz und Leder bis hin zu Stahl und Silber.
      </Lead>

      <H2 id="co2-vs-faser">CO2-Laser vs. Faserlaser</H2>
      <Table
        headers={["", "CO2-Laser", "Faserlaser (Raycus 30W)"]}
        rows={[
          ["Materialien", "Organisch: Holz, Leder, Acryl, Papier, Stoff, Glas", "Metalle: Stahl, Alu, Kupfer, Messing, Titan, Silber, Gold + Keramik, Stein"],
          ["Gravur", "Ja (Brennen / Verfärben)", "Ja (Markieren, Anlassen, Tiefätzung)"],
          ["Schneiden", "Ja — Holz bis 10 mm, Acryl bis 15 mm", "Dünne Metalle bis 1–2 mm"],
          ["Präzision", "~0,1 mm", "~0,02 mm"],
          ["Am besten für", "Schilder, Boxen, Dekor, Lederwaren", "Schmuck, Werkzeuge, Typenschilder"],
        ]}
      />

      <H2 id="materialien">Welche Materialien können graviert werden?</H2>
      <P>
        <Strong>CO2:</Strong> Holz, Sperrholz, Acryl, Leder, Papier, Stoff, Glas (Oberfläche).
        <br /><Strong>Faser:</Strong> Edelstahl, Aluminium, Kupfer, Messing, Silber, Gold, Titan, Keramik, Stein.
      </P>

      <H2 id="gravieren-vs-schneiden">Gravieren vs. Schneiden</H2>
      <P>
        Gravieren entfernt eine dünne Materialschicht (Text, Bilder, Muster). Schneiden geht durch das gesamte Material. CO2 schneidet Holz bis ~10 mm, Acryl bis ~15 mm. Faser schneidet dünne Bleche bis 1–2 mm.
      </P>

      <H2 id="anwendungen">Beliebteste Anwendungen</H2>
      <UL>
        <LI>Schmuckpersonalisierung — Gravuren auf Ringen, Anhängern, Armbändern</LI>
        <LI>Firmengeschenke — Logos auf Kugelschreibern, USB-Sticks, Schlüsselanhängern</LI>
        <LI>Wohndeko — Holz-/Acrylschilder, Untersetzer, Rahmen</LI>
        <LI>Prototypen — Gehäuseausschnitte, Schablonen</LI>
        <LI>Typenschilder — dauerhafte Markierung für Maschinen und Geräte</LI>
      </UL>

      <H2 id="preise">Preise & Lieferzeit</H2>
      <P>
        Holz-/Acrylgravur ab 10 €, Metall ab 15 €, Schmuckgravur ab 5 €. Standardlieferzeit: <Strong>1–3 Werktage</Strong>.
      </P>

      <CTABox
        accent="blue"
        title="Gravieren Sie Ihr Projekt"
        text="Senden Sie Ihre Grafik oder beschreiben Sie Ihre Idee — Angebot und Lieferung in 1–3 Tagen."
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
