import { H2, H3, P, Lead, UL, LI, Strong, A, Callout, Table, CTABox } from "../../components/blog/Prose.jsx";

export { meta } from "./grawerowanie-laserowe.meta.js";

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
        <Strong>Krótko:</Strong> <A href="/glossary/laser-co2">CO2</A> = materiały organiczne + cięcie. <A href="/glossary/laser-fiber">Fiber</A> = metale + ekstremalny detal. AEJaCA sTuDiO ma oba, więc nie musisz szukać dwóch dostawców.
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
        Wyślij grafikę (<A href="/glossary/plik-svg">.SVG</A>, .AI, .DXF lub nawet .JPG) — wycenimy w 24h.
        <br /><A href="/studio#calculator">Kalkulator wyceny sTuDiO →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Zagrawiruj swój projekt"
        text="Prześlij grafikę lub opisz pomysł — wycenimy i zrealizujemy w 1–3 dni."
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
        <Strong>In short:</Strong> <A href="/glossary/laser-co2">CO2</A> = organic materials + cutting. <A href="/glossary/laser-fiber">Fiber</A> = metals + extreme detail. AEJaCA sTuDiO has both.
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
        Engraving removes a thin layer of surface material — creating text, images, or patterns. Depth: 0.01–2 mm. Cutting goes all the way through. <A href="/glossary/laser-co2">CO2</A> cuts wood up to ~10 mm, acrylic up to ~15 mm. <A href="/glossary/laser-fiber">Fiber</A> cuts thin sheet metal up to 1–2 mm.
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

      <Callout accent="blue" title="Tip">
        Send your artwork (<A href="/glossary/plik-svg">.SVG</A>, .AI, .DXF or even .JPG) — we'll quote within 24h.
        <br /><A href="/studio#calculator">sTuDiO pricing calculator →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Engrave your project"
        text="Send your artwork or describe your idea — we'll quote and deliver in 1–3 days."
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
        Gravieren entfernt eine dünne Materialschicht (Text, Bilder, Muster). Schneiden geht durch das gesamte Material. <A href="/glossary/laser-co2">CO2</A> schneidet Holz bis ~10 mm, Acryl bis ~15 mm. <A href="/glossary/laser-fiber">Faser</A> schneidet dünne Bleche bis 1–2 mm.
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
      <Callout accent="blue" title="Tipp">
        Senden Sie Ihre Grafik (<A href="/glossary/plik-svg">.SVG</A>, .AI, .DXF oder auch .JPG) — Angebot innerhalb von 24h.
        <br /><A href="/studio#calculator">sTuDiO-Preiskalkulator →</A>
      </Callout>

      <CTABox
        accent="blue"
        title="Gravieren Sie Ihr Projekt"
        text="Senden Sie Ihre Grafik oder beschreiben Sie Ihre Idee — Angebot und Lieferung in 1–3 Tagen."
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
