export const CATEGORIES = {
  jewelry: { pl: "Bizuteria", en: "Jewelry", de: "Schmuck" },
  studio: { pl: "Studio", en: "Studio", de: "Studio" },
  general: { pl: "Ogolne", en: "General", de: "Allgemein" },
};

export const GLOSSARY = [
  {
    id: "srebro-925",
    category: "jewelry",
    term: { pl: "Srebro 925 (Sterling)", en: "925 Sterling Silver", de: "925 Sterlingsilber" },
    definition: {
      pl: "Stop zawierajacy 92,5% czystego srebra i 7,5% miedzi. Standard w bizuterii AEJaCA — trwaly, hipoalergiczny i latwy do polerowania.",
      en: "An alloy of 92.5% pure silver and 7.5% copper. The standard for AEJaCA jewelry — durable, hypoallergenic, and easy to polish.",
      de: "Eine Legierung aus 92,5% reinem Silber und 7,5% Kupfer. Der Standard bei AEJaCA-Schmuck — langlebig, hypoallergen und leicht zu polieren.",
    },
    relatedBlog: "srebro-vs-zloto",
  },
  {
    id: "zloto-probowane",
    category: "jewelry",
    term: { pl: "Zloto probowane (14k / 18k)", en: "Hallmarked Gold (14k / 18k)", de: "Gestempeltes Gold (14k / 18k)" },
    definition: {
      pl: "14k (585) to 58,5% zlota — wytrzymale na co dzien. 18k (750) to 75% zlota — intensywniejszy kolor, idealny na pierscionki zareczynowe.",
      en: "14k (585) contains 58.5% gold — durable for everyday wear. 18k (750) is 75% gold — richer color, ideal for engagement rings.",
      de: "14k (585) enthalt 58,5% Gold — alltagstauglich. 18k (750) ist 75% Gold — intensivere Farbe, ideal fur Verlobungsringe.",
    },
    relatedBlog: "srebro-vs-zloto",
  },
  {
    id: "pierscionek-zareczynowy",
    category: "jewelry",
    term: { pl: "Pierscionek zareczynowy", en: "Engagement Ring", de: "Verlobungsring" },
    definition: {
      pl: "Pierscionek ofiarowywany przy zareczynach — najczesciej z diamentem, moissanitem lub kamieniem szlachetnym. AEJaCA projektuje je na zamowienie.",
      en: "A ring given at a proposal — typically set with a diamond, moissanite, or gemstone. AEJaCA designs them to order.",
      de: "Ein Ring, der beim Antrag uberreicht wird — meist mit Diamant, Moissanit oder Edelstein. AEJaCA fertigt ihn auf Bestellung.",
    },
    relatedBlog: "pierscionek-zareczynowy",
  },
  {
    id: "obraczki-slubne",
    category: "jewelry",
    term: { pl: "Obraczki slubne", en: "Wedding Bands", de: "Eheringe" },
    definition: {
      pl: "Para pierscionkow wymienianych podczas slubu. W AEJaCA mozna je spersonalizowac grawerem, faktura i profilem przekroju.",
      en: "A pair of rings exchanged during the wedding ceremony. At AEJaCA you can personalize them with engraving, texture, and profile.",
      de: "Ein Ringpaar, das bei der Trauung getauscht wird. Bei AEJaCA konnen Gravur, Textur und Profil individuell angepasst werden.",
    },
    relatedBlog: "obraczki-slubne",
  },
  {
    id: "kamien-szlachetny",
    category: "jewelry",
    term: { pl: "Kamien szlachetny", en: "Gemstone", de: "Edelstein" },
    definition: {
      pl: "Naturalny mineral o wyjatkowej twardosci, przezroczystosci i barwie (diament, rubin, szafir, szmaragd). Uzywany w pierscionkach i wisiorkach AEJaCA.",
      en: "A natural mineral valued for hardness, clarity, and color (diamond, ruby, sapphire, emerald). Used in AEJaCA rings and pendants.",
      de: "Ein naturliches Mineral, geschatzt fur Harte, Klarheit und Farbe (Diamant, Rubin, Saphir, Smaragd). Verwendet in AEJaCA-Ringen und -Anhangern.",
    },
    relatedBlog: "pierscionek-zareczynowy",
  },
  {
    id: "rodowanie",
    category: "jewelry",
    term: { pl: "Rodowanie", en: "Rhodium Plating", de: "Rhodinierung" },
    definition: {
      pl: "Galwaniczne pokrycie srebra lub bialego zlota cienka warstwa rodu — zwieksza polysk i odpornosc na matowienie.",
      en: "Electroplating silver or white gold with a thin rhodium layer — increases shine and tarnish resistance.",
      de: "Galvanische Beschichtung von Silber oder Weissgold mit einer dunnen Rhodiumschicht — erhoeht Glanz und Anlaufschutz.",
    },
    relatedBlog: "jak-dbac-o-bizuterie",
  },
  {
    id: "moissanit",
    category: "jewelry",
    term: { pl: "Moissanit", en: "Moissanite", de: "Moissanit" },
    definition: {
      pl: "Syntetyczny mineral (SiC) o blasku zblioznym do diamentu, ale w znacznie nizszej cenie. Twardosc 9,25 w skali Mohsa.",
      en: "A synthetic mineral (SiC) with diamond-like brilliance at a fraction of the cost. Mohs hardness 9.25.",
      de: "Ein synthetisches Mineral (SiC) mit diamantahnlichem Glanz zu einem Bruchteil der Kosten. Mohsharte 9,25.",
    },
    relatedBlog: "pierscionek-zareczynowy",
  },
  {
    id: "rozmiar-pierscionka",
    category: "jewelry",
    term: { pl: "Rozmiar pierscionka", en: "Ring Size", de: "Ringgroesse" },
    definition: {
      pl: "Srednica wewnetrzna pierscionka w mm. W Polsce uzywamy skali EU (np. 14 = 54 mm obwodu). AEJaCA pomaga dobrac rozmiar zdalnie.",
      en: "The inner diameter of a ring in mm. AEJaCA helps you measure your size remotely — just ask via the contact form.",
      de: "Der Innendurchmesser eines Rings in mm. AEJaCA hilft Ihnen, Ihre Groesse per Fernmessung zu bestimmen.",
    },
    relatedBlog: null,
  },
  {
    id: "personalizowany-grawer",
    category: "jewelry",
    term: { pl: "Personalizowany grawer", en: "Personalized Engraving", de: "Personalisierte Gravur" },
    definition: {
      pl: "Napis, data lub symbol wygrawerowany wewnatrz obraczki lub na wisiorku. AEJaCA wykonuje grawer laserowy fiber i reczny.",
      en: "Text, date, or symbol engraved inside a band or on a pendant. AEJaCA offers both fiber laser and hand engraving.",
      de: "Text, Datum oder Symbol, eingraviert in einen Ring oder Anhanger. AEJaCA bietet Faserlaser- und Handgravur an.",
    },
    relatedBlog: "prezenty-personalizowane",
  },
  {
    id: "bizuteria-inwestycyjna",
    category: "jewelry",
    term: { pl: "Bizuteria inwestycyjna", en: "Investment Jewelry", de: "Anlageschmuck" },
    definition: {
      pl: "Bizuteria ze zlota lub platyny z kamieniami szlachetnymi, ktora zachowuje lub zyskuje na wartosci w czasie.",
      en: "Gold or platinum jewelry with gemstones that retains or appreciates in value over time.",
      de: "Gold- oder Platinschmuck mit Edelsteinen, der seinen Wert behalt oder im Laufe der Zeit steigert.",
    },
    relatedBlog: "bizuteria-inwestycja",
  },
  {
    id: "druk-3d-fdm",
    category: "studio",
    term: { pl: "Druk 3D FDM", en: "FDM 3D Printing", de: "FDM 3D-Druck" },
    definition: {
      pl: "Metoda druku warstwa po warstwie z topionego filamentu (PLA, PETG, ABS). Ekonomiczna opcja na prototypy i czesci funkcjonalne w AEJaCA sTuDiO.",
      en: "Layer-by-layer printing from melted filament (PLA, PETG, ABS). An economical option for prototypes and functional parts at AEJaCA sTuDiO.",
      de: "Schicht-fur-Schicht-Druck aus geschmolzenem Filament (PLA, PETG, ABS). Wirtschaftliche Option fur Prototypen und Funktionsteile bei AEJaCA sTuDiO.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "plik-stl",
    category: "studio",
    term: { pl: "Plik STL", en: "STL File", de: "STL-Datei" },
    definition: {
      pl: "Standardowy format 3D (siatka trojkatow) uzywany w druku 3D. Kalkulator AEJaCA przyjmuje STL i od razu wycenia wydruk.",
      en: "Standard 3D format (triangle mesh) used in 3D printing. The AEJaCA calculator accepts STL files and quotes instantly.",
      de: "Standard-3D-Format (Dreiecksnetz) fur den 3D-Druck. Der AEJaCA-Rechner akzeptiert STL-Dateien und kalkuliert sofort.",
    },
    relatedBlog: "jak-przygotowac-plik-stl",
  },
  {
    id: "pla",
    category: "studio",
    term: { pl: "PLA (kwas polimlekowy)", en: "PLA (Polylactic Acid)", de: "PLA (Polymilchsaure)" },
    definition: {
      pl: "Biodegradowalny filament z kukurydzy — najpopularniejszy material do druku 3D. Latwy w druku, dostepny w wielu kolorach.",
      en: "Biodegradable corn-based filament — the most popular 3D printing material. Easy to print, available in many colors.",
      de: "Biologisch abbaubares Filament auf Maisbasis — das beliebteste 3D-Druck-Material. Einfach zu drucken, in vielen Farben erhaltlich.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "petg",
    category: "studio",
    term: { pl: "PETG", en: "PETG", de: "PETG" },
    definition: {
      pl: "Wytrzymaly filament odporny na uderzenia i chemikalia. Idealny na czesci mechaniczne i elementy outdoor.",
      en: "Tough filament resistant to impacts and chemicals. Ideal for mechanical parts and outdoor elements.",
      de: "Robustes Filament, bestandig gegen Schlag und Chemikalien. Ideal fur mechanische Teile und Outdoor-Elemente.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "zywica-uv",
    category: "studio",
    term: { pl: "Zywica UV (SLA/DLP)", en: "UV Resin (SLA/DLP)", de: "UV-Harz (SLA/DLP)" },
    definition: {
      pl: "Ciekla zywica utwardzana swiatlem UV — daje bardzo gladkie wydruki o wysokiej rozdzielczosci. Stosowana do modeli bizuterii i detali.",
      en: "Liquid resin cured by UV light — produces very smooth, high-resolution prints. Used for jewelry models and fine details.",
      de: "Flussigharz, das durch UV-Licht ausgehartet wird — liefert sehr glatte, hochauflosende Drucke. Fur Schmuckmodelle und Feinheiten.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "laser-co2",
    category: "studio",
    term: { pl: "Laser CO2", en: "CO2 Laser", de: "CO2-Laser" },
    definition: {
      pl: "Laser gazowy (10,6 um) do ciecia i grawerowania drewna, skory, akrylu, szkla. Dostepny w AEJaCA sTuDiO z natychmiastowa wycena online.",
      en: "A gas laser (10.6 um) for cutting and engraving wood, leather, acrylic, glass. Available at AEJaCA sTuDiO with instant online pricing.",
      de: "Ein Gaslaser (10,6 um) zum Schneiden und Gravieren von Holz, Leder, Acryl, Glas. Bei AEJaCA sTuDiO mit Sofort-Online-Preisrechner.",
    },
    relatedBlog: "grawerowanie-laserowe",
  },
  {
    id: "laser-fiber",
    category: "studio",
    term: { pl: "Laser Fiber (wloknowy)", en: "Fiber Laser", de: "Faserlaser" },
    definition: {
      pl: "Laser wloknowy (1064 nm) do precyzyjnego znakowania metali — stali, aluminium, srebra, zlota. Trwale oznaczenia i grawer na bizuterii.",
      en: "A fiber laser (1064 nm) for precision metal marking — steel, aluminum, silver, gold. Permanent markings and jewelry engraving.",
      de: "Ein Faserlaser (1064 nm) zur prazisen Metallmarkierung — Stahl, Aluminium, Silber, Gold. Dauerhafte Markierungen und Schmuckgravur.",
    },
    relatedBlog: "grawerowanie-laserowe",
  },
  {
    id: "plik-svg",
    category: "studio",
    term: { pl: "Plik SVG", en: "SVG File", de: "SVG-Datei" },
    definition: {
      pl: "Wektorowy format graficzny uzywany do ciecia i grawerowania laserowego. Kalkulator AEJaCA odczytuje wymiary SVG i od razu podaje cene.",
      en: "A vector graphics format used for laser cutting and engraving. The AEJaCA calculator reads SVG dimensions and quotes instantly.",
      de: "Ein Vektorgrafik-Format fur Laserschneiden und -gravur. Der AEJaCA-Rechner liest SVG-Abmessungen und kalkuliert sofort.",
    },
    relatedBlog: "materialy-laser-cutting",
  },
  {
    id: "odlew-zywiczny",
    category: "studio",
    term: { pl: "Odlew zywiczny (epoxy / 2K)", en: "Resin Casting (Epoxy / 2K)", de: "Harzguss (Epoxy / 2K)" },
    definition: {
      pl: "Odlewanie elementow z zywicy epoksydowej lub poliuretanowej w formach silikonowych. AEJaCA oferuje odlewy transparentne i barwione.",
      en: "Casting parts from epoxy or polyurethane resin in silicone molds. AEJaCA offers transparent and tinted castings.",
      de: "Giessen von Teilen aus Epoxid- oder Polyurethanharz in Silikonformen. AEJaCA bietet transparente und eingefarbte Gusse.",
    },
    relatedBlog: "odlewy-zywiczne-poradnik",
  },
  {
    id: "prototypowanie",
    category: "studio",
    term: { pl: "Prototypowanie", en: "Prototyping", de: "Prototyping" },
    definition: {
      pl: "Szybkie tworzenie fizycznego modelu przed produkcja seryna. Druk 3D w AEJaCA sTuDiO pozwala zweryfikowac projekt w kilka godzin.",
      en: "Rapidly creating a physical model before serial production. 3D printing at AEJaCA sTuDiO lets you validate a design in hours.",
      de: "Schnelles Erstellen eines physischen Modells vor der Serienproduktion. 3D-Druck bei AEJaCA sTuDiO verifiziert ein Design in Stunden.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "cad",
    category: "general",
    term: { pl: "CAD (projektowanie wspomagane komputerowo)", en: "CAD (Computer-Aided Design)", de: "CAD (Computergestutztes Design)" },
    definition: {
      pl: "Oprogramowanie do tworzenia precyzyjnych modeli 2D/3D (Fusion 360, Blender, Rhino). Plik CAD to punkt wyjscia do druku 3D lub CNC.",
      en: "Software for creating precise 2D/3D models (Fusion 360, Blender, Rhino). A CAD file is the starting point for 3D printing or CNC.",
      de: "Software zur Erstellung praziser 2D/3D-Modelle (Fusion 360, Blender, Rhino). Eine CAD-Datei ist der Ausgangspunkt fur 3D-Druck oder CNC.",
    },
    relatedBlog: "jak-przygotowac-plik-stl",
  },
  {
    id: "personalizacja",
    category: "general",
    term: { pl: "Personalizacja", en: "Personalization", de: "Personalisierung" },
    definition: {
      pl: "Dostosowanie produktu do indywidualnych potrzeb — grawer, kolor, rozmiar, material. Kluczowa usluga AEJaCA zarowno w bizuterii, jak i studio.",
      en: "Tailoring a product to individual needs — engraving, color, size, material. A key AEJaCA service across jewelry and studio.",
      de: "Anpassung eines Produkts an individuelle Bedurfnisse — Gravur, Farbe, Groesse, Material. Ein zentraler AEJaCA-Service fur Schmuck und Studio.",
    },
    relatedBlog: "prezenty-personalizowane",
  },
  {
    id: "projektowanie-ai",
    category: "general",
    term: { pl: "Projektowanie z AI", en: "AI-Assisted Design", de: "KI-gestutztes Design" },
    definition: {
      pl: "Wykorzystanie sztucznej inteligencji do generowania koncepcji, tekstur i wzorow — przyspieszenie procesu projektowego w AEJaCA.",
      en: "Using artificial intelligence to generate concepts, textures, and patterns — accelerating the AEJaCA design process.",
      de: "Nutzung kunstlicher Intelligenz zur Generierung von Konzepten, Texturen und Mustern — beschleunigt den AEJaCA-Designprozess.",
    },
    relatedBlog: "projektowanie-ai",
  },
  {
    id: "wycena-online",
    category: "general",
    term: { pl: "Wycena online", en: "Online Quote", de: "Online-Angebot" },
    definition: {
      pl: "Natychmiastowa kalkulacja ceny na stronie AEJaCA — zaladuj plik STL/SVG lub wybierz parametry i poznaj koszt w kilka sekund.",
      en: "Instant price calculation on the AEJaCA website — upload an STL/SVG file or choose parameters and get the cost in seconds.",
      de: "Sofortige Preiskalkulation auf der AEJaCA-Website — laden Sie eine STL/SVG-Datei hoch oder wahlen Sie Parameter und erhalten Sie den Preis in Sekunden.",
    },
    relatedBlog: null,
  },
];

export function getTermsByCategory(category) {
  return GLOSSARY.filter((t) => t.category === category);
}

export function searchTerms(query, lang = "en") {
  const q = query.toLowerCase();
  return GLOSSARY.filter(
    (t) => t.term[lang].toLowerCase().includes(q) || t.definition[lang].toLowerCase().includes(q)
  );
}
