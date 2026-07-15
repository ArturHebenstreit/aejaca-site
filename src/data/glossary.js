export const CATEGORIES = {
  jewelry: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck" },
  studio: { pl: "Studio", en: "Studio", de: "Studio" },
  general: { pl: "Ogólne", en: "General", de: "Allgemein" },
};

export const GLOSSARY = [
  {
    id: "srebro-925",
    category: "jewelry",
    term: { pl: "Srebro 925 (Sterling)", en: "925 Sterling Silver", de: "925 Sterlingsilber" },
    definition: {
      pl: "Stop zawierający 92,5% czystego srebra i 7,5% miedzi. Standard w biżuterii AEJaCA — trwały, hipoalergiczny i łatwy do polerowania.",
      en: "An alloy of 92.5% pure silver and 7.5% copper. The standard for AEJaCA jewelry — durable, hypoallergenic, and easy to polish.",
      de: "Eine Legierung aus 92,5% reinem Silber und 7,5% Kupfer. Der Standard bei AEJaCA-Schmuck — langlebig, hypoallergen und leicht zu polieren.",
    },
    relatedBlog: "srebro-vs-zloto",
  },
  {
    id: "zloto-probowane",
    category: "jewelry",
    term: { pl: "Złoto próbowane (14k / 18k)", en: "Hallmarked Gold (14k / 18k)", de: "Gestempeltes Gold (14k / 18k)" },
    definition: {
      pl: "14k (585) to 58,5% złota — wytrzymałe na co dzień. 18k (750) to 75% złota — intensywniejszy kolor, idealny na pierścionki zaręczynowe.",
      en: "14k (585) contains 58.5% gold — durable for everyday wear. 18k (750) is 75% gold — richer color, ideal for engagement rings.",
      de: "14k (585) enthält 58,5% Gold — alltagstauglich. 18k (750) ist 75% Gold — intensivere Farbe, ideal für Verlobungsringe.",
    },
    relatedBlog: "srebro-vs-zloto",
  },
  {
    id: "pierscionek-zareczynowy",
    category: "jewelry",
    term: { pl: "Pierścionek zaręczynowy", en: "Engagement Ring", de: "Verlobungsring" },
    definition: {
      pl: "Pierścionek ofiarowywany przy zaręczynach — najczęściej z diamentem, moissanitem lub kamieniem szlachetnym. AEJaCA projektuje je na zamówienie.",
      en: "A ring given at a proposal — typically set with a diamond, moissanite, or gemstone. AEJaCA designs them to order.",
      de: "Ein Ring, der beim Antrag überreicht wird — meist mit Diamant, Moissanit oder Edelstein. AEJaCA fertigt ihn auf Bestellung.",
    },
    relatedBlog: "pierscionek-zareczynowy",
  },
  {
    id: "obraczki-slubne",
    category: "jewelry",
    term: { pl: "Obrączki ślubne", en: "Wedding Bands", de: "Eheringe" },
    definition: {
      pl: "Para pierścionków wymienianych podczas ślubu. W AEJaCA można je spersonalizować grawerem, fakturą i profilem przekroju.",
      en: "A pair of rings exchanged during the wedding ceremony. At AEJaCA you can personalize them with engraving, texture, and profile.",
      de: "Ein Ringpaar, das bei der Trauung getauscht wird. Bei AEJaCA können Gravur, Textur und Profil individuell angepasst werden.",
    },
    relatedBlog: "obraczki-slubne",
  },
  {
    id: "kamien-szlachetny",
    category: "jewelry",
    term: { pl: "Kamień szlachetny", en: "Gemstone", de: "Edelstein" },
    definition: {
      pl: "Naturalny minerał o wyjątkowej twardości, przezroczystości i barwie (diament, rubin, szafir, szmaragd). Używany w pierścionkach i wisiorkach AEJaCA.",
      en: "A natural mineral valued for hardness, clarity, and color (diamond, ruby, sapphire, emerald). Used in AEJaCA rings and pendants.",
      de: "Ein natürliches Mineral, geschätzt für Härte, Klarheit und Farbe (Diamant, Rubin, Saphir, Smaragd). Verwendet in AEJaCA-Ringen und -Anhängern.",
    },
    relatedBlog: "pierscionek-zareczynowy",
  },
  {
    id: "rodowanie",
    category: "jewelry",
    term: { pl: "Rodowanie", en: "Rhodium Plating", de: "Rhodinierung" },
    definition: {
      pl: "Galwaniczne pokrycie srebra lub białego złota cienką warstwą rodu — zwiększa połysk i odporność na matowienie.",
      en: "Electroplating silver or white gold with a thin rhodium layer — increases shine and tarnish resistance.",
      de: "Galvanische Beschichtung von Silber oder Weißgold mit einer dünnen Rhodiumschicht — erhöht Glanz und Anlaufschutz.",
    },
    relatedBlog: "jak-dbac-o-bizuterie",
  },
  {
    id: "moissanit",
    category: "jewelry",
    term: { pl: "Moissanit", en: "Moissanite", de: "Moissanit" },
    definition: {
      pl: "Syntetyczny minerał (SiC) o blasku zbliżonym do diamentu, ale w znacznie niższej cenie. Twardość 9,25 w skali Mohsa.",
      en: "A synthetic mineral (SiC) with diamond-like brilliance at a fraction of the cost. Mohs hardness 9.25.",
      de: "Ein synthetisches Mineral (SiC) mit diamantähnlichem Glanz zu einem Bruchteil der Kosten. Mohshärte 9,25.",
    },
    relatedBlog: "pierscionek-zareczynowy",
  },
  {
    id: "rozmiar-pierscionka",
    category: "jewelry",
    term: { pl: "Rozmiar pierścionka", en: "Ring Size", de: "Ringgröße" },
    definition: {
      pl: "Średnica wewnętrzna pierścionka w mm. W Polsce używamy skali EU (np. 14 = 54 mm obwodu). AEJaCA pomaga dobrać rozmiar zdalnie.",
      en: "The inner diameter of a ring in mm. AEJaCA helps you measure your size remotely — just ask via the contact form.",
      de: "Der Innendurchmesser eines Rings in mm. AEJaCA hilft Ihnen, Ihre Größe per Fernmessung zu bestimmen.",
    },
    relatedBlog: null,
  },
  {
    id: "personalizowany-grawer",
    category: "jewelry",
    term: { pl: "Personalizowany grawer", en: "Personalized Engraving", de: "Personalisierte Gravur" },
    definition: {
      pl: "Napis, data lub symbol wygrawerowany wewnątrz obrączki lub na wisiorku. AEJaCA wykonuje grawer laserowy fiber i ręczny.",
      en: "Text, date, or symbol engraved inside a band or on a pendant. AEJaCA offers both fiber laser and hand engraving.",
      de: "Text, Datum oder Symbol, eingraviert in einen Ring oder Anhänger. AEJaCA bietet Faserlaser- und Handgravur an.",
    },
    relatedBlog: "prezenty-personalizowane",
  },
  {
    id: "bizuteria-inwestycyjna",
    category: "jewelry",
    term: { pl: "Biżuteria inwestycyjna", en: "Investment Jewelry", de: "Anlageschmuck" },
    definition: {
      pl: "Biżuteria ze złota lub platyny z kamieniami szlachetnymi, która zachowuje lub zyskuje na wartości w czasie.",
      en: "Gold or platinum jewelry with gemstones that retains or appreciates in value over time.",
      de: "Gold- oder Platinschmuck mit Edelsteinen, der seinen Wert behält oder im Laufe der Zeit steigert.",
    },
    relatedBlog: "bizuteria-inwestycja",
  },
  {
    id: "druk-3d-fdm",
    category: "studio",
    term: { pl: "Druk 3D FDM", en: "FDM 3D Printing", de: "FDM 3D-Druck" },
    definition: {
      pl: "Metoda druku warstwa po warstwie z topionego filamentu (PLA, PETG, ABS). Ekonomiczna opcja na prototypy i części funkcjonalne w AEJaCA sTuDiO.",
      en: "Layer-by-layer printing from melted filament (PLA, PETG, ABS). An economical option for prototypes and functional parts at AEJaCA sTuDiO.",
      de: "Schicht-für-Schicht-Druck aus geschmolzenem Filament (PLA, PETG, ABS). Wirtschaftliche Option für Prototypen und Funktionsteile bei AEJaCA sTuDiO.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "plik-stl",
    category: "studio",
    term: { pl: "Plik STL", en: "STL File", de: "STL-Datei" },
    definition: {
      pl: "Standardowy format 3D (siatka trójkątów) używany w druku 3D. Kalkulator AEJaCA przyjmuje STL i od razu wycenia wydruk.",
      en: "Standard 3D format (triangle mesh) used in 3D printing. The AEJaCA calculator accepts STL files and quotes instantly.",
      de: "Standard-3D-Format (Dreiecksnetz) für den 3D-Druck. Der AEJaCA-Rechner akzeptiert STL-Dateien und kalkuliert sofort.",
    },
    relatedBlog: "jak-przygotowac-plik-stl",
  },
  {
    id: "pla",
    category: "studio",
    term: { pl: "PLA (kwas polimlekowy)", en: "PLA (Polylactic Acid)", de: "PLA (Polymilchsäure)" },
    definition: {
      pl: "Biodegradowalny filament z kukurydzy — najpopularniejszy materiał do druku 3D. Łatwy w druku, dostępny w wielu kolorach.",
      en: "Biodegradable corn-based filament — the most popular 3D printing material. Easy to print, available in many colors.",
      de: "Biologisch abbaubares Filament auf Maisbasis — das beliebteste 3D-Druck-Material. Einfach zu drucken, in vielen Farben erhältlich.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "petg",
    category: "studio",
    term: { pl: "PETG", en: "PETG", de: "PETG" },
    definition: {
      pl: "Wytrzymały filament odporny na uderzenia i chemikalia. Idealny na części mechaniczne i elementy outdoor.",
      en: "Tough filament resistant to impacts and chemicals. Ideal for mechanical parts and outdoor elements.",
      de: "Robustes Filament, beständig gegen Schlag und Chemikalien. Ideal für mechanische Teile und Outdoor-Elemente.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "zywica-uv",
    category: "studio",
    term: { pl: "Żywica UV (SLA/DLP)", en: "UV Resin (SLA/DLP)", de: "UV-Harz (SLA/DLP)" },
    definition: {
      pl: "Ciekła żywica utwardzana światłem UV — daje bardzo gładkie wydruki o wysokiej rozdzielczości. Stosowana do modeli biżuterii i detali.",
      en: "Liquid resin cured by UV light — produces very smooth, high-resolution prints. Used for jewelry models and fine details.",
      de: "Flüssigharz, das durch UV-Licht ausgehärtet wird — liefert sehr glatte, hochauflösende Drucke. Für Schmuckmodelle und Feinheiten.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "laser-co2",
    category: "studio",
    term: { pl: "Laser CO₂", en: "CO₂ Laser", de: "CO₂-Laser" },
    definition: {
      pl: "Laser gazowy (10,6 μm) do cięcia i grawerowania drewna, skóry, akrylu, szkła. Dostępny w AEJaCA sTuDiO z natychmiastową wyceną online.",
      en: "A gas laser (10.6 μm) for cutting and engraving wood, leather, acrylic, glass. Available at AEJaCA sTuDiO with instant online pricing.",
      de: "Ein Gaslaser (10,6 μm) zum Schneiden und Gravieren von Holz, Leder, Acryl, Glas. Bei AEJaCA sTuDiO mit Sofort-Online-Preisrechner.",
    },
    relatedBlog: "grawerowanie-laserowe",
  },
  {
    id: "laser-fiber",
    category: "studio",
    term: { pl: "Laser Fiber (włóknowy)", en: "Fiber Laser", de: "Faserlaser" },
    definition: {
      pl: "Laser włóknowy (1064 nm) do precyzyjnego znakowania metali — stali, aluminium, srebra, złota. Trwałe oznaczenia i grawer na biżuterii.",
      en: "A fiber laser (1064 nm) for precision metal marking — steel, aluminum, silver, gold. Permanent markings and jewelry engraving.",
      de: "Ein Faserlaser (1064 nm) zur präzisen Metallmarkierung — Stahl, Aluminium, Silber, Gold. Dauerhafte Markierungen und Schmuckgravur.",
    },
    relatedBlog: "grawerowanie-laserowe",
  },
  {
    id: "plik-svg",
    category: "studio",
    term: { pl: "Plik SVG", en: "SVG File", de: "SVG-Datei" },
    definition: {
      pl: "Wektorowy format graficzny używany do cięcia i grawerowania laserowego. Kalkulator AEJaCA odczytuje wymiary SVG i od razu podaje cenę.",
      en: "A vector graphics format used for laser cutting and engraving. The AEJaCA calculator reads SVG dimensions and quotes instantly.",
      de: "Ein Vektorgrafik-Format für Laserschneiden und -gravur. Der AEJaCA-Rechner liest SVG-Abmessungen und kalkuliert sofort.",
    },
    relatedBlog: "materialy-laser-cutting",
  },
  {
    id: "odlew-zywiczny",
    category: "studio",
    term: { pl: "Odlew żywiczny (epoxy / 2K)", en: "Resin Casting (Epoxy / 2K)", de: "Harzguss (Epoxy / 2K)" },
    definition: {
      pl: "Odlewanie elementów z żywicy epoksydowej lub poliuretanowej w formach silikonowych. AEJaCA oferuje odlewy transparentne i barwione.",
      en: "Casting parts from epoxy or polyurethane resin in silicone molds. AEJaCA offers transparent and tinted castings.",
      de: "Gießen von Teilen aus Epoxid- oder Polyurethanharz in Silikonformen. AEJaCA bietet transparente und eingefärbte Güsse.",
    },
    relatedBlog: "odlewy-zywiczne-poradnik",
  },
  {
    id: "prototypowanie",
    category: "studio",
    term: { pl: "Prototypowanie", en: "Prototyping", de: "Prototyping" },
    definition: {
      pl: "Szybkie tworzenie fizycznego modelu przed produkcją seryjną. Druk 3D w AEJaCA sTuDiO pozwala zweryfikować projekt w kilka godzin.",
      en: "Rapidly creating a physical model before serial production. 3D printing at AEJaCA sTuDiO lets you validate a design in hours.",
      de: "Schnelles Erstellen eines physischen Modells vor der Serienproduktion. 3D-Druck bei AEJaCA sTuDiO verifiziert ein Design in Stunden.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
  },
  {
    id: "cad",
    category: "general",
    term: { pl: "CAD (projektowanie wspomagane komputerowo)", en: "CAD (Computer-Aided Design)", de: "CAD (Computergestütztes Design)" },
    definition: {
      pl: "Oprogramowanie do tworzenia precyzyjnych modeli 2D/3D (Fusion 360, Blender, Rhino). Plik CAD to punkt wyjścia do druku 3D lub CNC.",
      en: "Software for creating precise 2D/3D models (Fusion 360, Blender, Rhino). A CAD file is the starting point for 3D printing or CNC.",
      de: "Software zur Erstellung präziser 2D/3D-Modelle (Fusion 360, Blender, Rhino). Eine CAD-Datei ist der Ausgangspunkt für 3D-Druck oder CNC.",
    },
    relatedBlog: "jak-przygotowac-plik-stl",
  },
  {
    id: "modelowanie-3d",
    category: "general",
    term: { pl: "Modelowanie 3D (Rhino, Fusion 360)", en: "3D Modeling (Rhino, Fusion 360)", de: "3D-Modellierung (Rhino, Fusion 360)" },
    definition: {
      pl: "Tworzenie precyzyjnych modeli 3D w Rhino i Fusion 360 — zarówno organicznych form biżuteryjnych, jak i technicznych części funkcjonalnych (projektowanie parametryczne, tolerancje mechaniczne, inżynieria odwrotna). AEJaCA modeluje od szkicu, zdjęcia lub pomysłu, przygotowując pliki gotowe do druku 3D lub odlewu.",
      en: "Creating precise 3D models in Rhino and Fusion 360 — both organic jewelry forms and functional technical parts (parametric design, mechanical tolerances, reverse engineering). AEJaCA models from a sketch, photo, or idea, preparing files ready for 3D printing or casting.",
      de: "Erstellung präziser 3D-Modelle in Rhino und Fusion 360 — sowohl organische Schmuckformen als auch funktionale technische Teile (parametrisches Design, mechanische Toleranzen, Reverse Engineering). AEJaCA modelliert aus Skizze, Foto oder Idee und bereitet druck- oder gussfertige Dateien vor.",
    },
    relatedBlog: "jak-przygotowac-plik-stl",
  },
  {
    id: "personalizacja",
    category: "general",
    term: { pl: "Personalizacja", en: "Personalization", de: "Personalisierung" },
    definition: {
      pl: "Dostosowanie produktu do indywidualnych potrzeb — grawer, kolor, rozmiar, materiał. Kluczowa usługa AEJaCA zarówno w biżuterii, jak i studio.",
      en: "Tailoring a product to individual needs — engraving, color, size, material. A key AEJaCA service across jewelry and studio.",
      de: "Anpassung eines Produkts an individuelle Bedürfnisse — Gravur, Farbe, Größe, Material. Ein zentraler AEJaCA-Service für Schmuck und Studio.",
    },
    relatedBlog: "prezenty-personalizowane",
  },
  {
    id: "projektowanie-ai",
    category: "general",
    term: { pl: "Projektowanie z AI", en: "AI-Assisted Design", de: "KI-gestütztes Design" },
    definition: {
      pl: "Wykorzystanie sztucznej inteligencji do generowania koncepcji, tekstur i wzorów — przyspieszenie procesu projektowego w AEJaCA.",
      en: "Using artificial intelligence to generate concepts, textures, and patterns — accelerating the AEJaCA design process.",
      de: "Nutzung künstlicher Intelligenz zur Generierung von Konzepten, Texturen und Mustern — beschleunigt den AEJaCA-Designprozess.",
    },
    relatedBlog: "projektowanie-ai",
  },
  {
    id: "wycena-online",
    category: "general",
    term: { pl: "Wycena online", en: "Online Quote", de: "Online-Angebot" },
    definition: {
      pl: "Natychmiastowa kalkulacja ceny na stronie AEJaCA — załaduj plik STL/SVG lub wybierz parametry i poznaj koszt w kilka sekund.",
      en: "Instant price calculation on the AEJaCA website — upload an STL/SVG file or choose parameters and get the cost in seconds.",
      de: "Sofortige Preiskalkulation auf der AEJaCA-Website — laden Sie eine STL/SVG-Datei hoch oder wählen Sie Parameter und erhalten Sie den Preis in Sekunden.",
    },
    relatedBlog: null,
  },
  {
    id: "lost-resin",
    category: "studio",
    term: { pl: "Lost-resin (odlew z wypalanego wzorca żywicznego)", en: "Lost-Resin Casting", de: "Lost-Resin-Guss" },
    definition: {
      pl: "Metoda odlewnicza, w której wzorzec wydrukowany z żywicy castable jest inwestowany w masę wypalającą, a następnie wypalany w piecu do ok. 600°C, tak że żywica spala się bez śladu, zostawiając pustą formę gotową na metal. Tym wzorcem odlewamy pierścionki i figurki w Ag 925 lub Au 585.",
      en: "A casting method where a pattern printed in castable resin is invested in casting plaster, then burned out in a kiln at around 600°C so the resin combusts cleanly, leaving an empty cavity ready for metal. AEJaCA uses this pattern to cast rings and figurines in 925 silver or 585 gold.",
      de: "Ein Gussverfahren, bei dem ein aus Gussharz gedrucktes Modell in Einbettmasse eingebettet und anschließend im Ofen bei rund 600°C ausgebrannt wird, sodass das Harz rückstandslos verbrennt und eine leere Form für das Metall zurückbleibt. AEJaCA nutzt dieses Modell zum Gießen von Ringen und Figuren in 925-Silber oder 585-Gold.",
    },
    relatedBlog: "druk-miniatur-figurek-16k",
  },
  {
    id: "zywica-castable",
    category: "studio",
    term: { pl: "Żywica castable (BlueCast)", en: "Castable Resin (BlueCast)", de: "Gussharz (BlueCast)" },
    definition: {
      pl: "Żywica do druku MSLA zaprojektowana do czystego wypalania w piecu odlewniczym. AEJaCA używa BlueCast X-One V2 (zero skurczu, do szyn i masywnych elementów) oraz BlueCast X-Wax Filigree (ponad 80% wosku, do filigranu i detali od 0,2 mm). Wysoka zawartość wosku ułatwia całkowite spalenie bez pozostałości popiołu, co chroni formę odlewniczą.",
      en: "A resin for MSLA printing designed to burn out cleanly in a casting kiln. AEJaCA uses BlueCast X-One V2 (zero shrinkage, for shanks and bulky elements) and BlueCast X-Wax Filigree (over 80% wax content, for filigree and details down to 0.2 mm). High wax content ensures complete combustion with no ash residue, protecting the casting mold.",
      de: "Ein Harz für den MSLA-Druck, das für ein sauberes Ausbrennen im Gussofen ausgelegt ist. AEJaCA verwendet BlueCast X-One V2 (kein Schrumpf, für Ringschienen und massive Elemente) und BlueCast X-Wax Filigree (über 80% Wachsanteil, für Filigran und Details ab 0,2 mm). Der hohe Wachsanteil sorgt für rückstandsfreies Verbrennen ohne Ascherückstände und schont die Gussform.",
    },
    relatedBlog: "odlewy-zywiczne-poradnik",
  },
  {
    id: "druk-msla",
    category: "studio",
    term: { pl: "Druk MSLA", en: "MSLA Printing", de: "MSLA-Druck" },
    definition: {
      pl: "Technologia druku żywicznego, w której cała warstwa jest utwardzana naraz światłem UV wyświetlanym przez ekran mono LCD (nie punktowo, jak w klasycznym SLA laserowym). Rozdzielczość zależy od wielkości piksela ekranu (na Elegoo Saturn 4 Ultra 16K: 14x19 µm), a nie od średnicy dyszy jak w druku FDM. Daje gładką powierzchnię i detal od ok. 0,2 mm, znacznie precyzyjniejszy niż FDM (0,4-0,8 mm).",
      en: "A resin printing technology where an entire layer is cured at once by UV light projected through a mono LCD screen, rather than point-by-point as in classic laser SLA. Resolution depends on the screen's pixel size (14x19 µm on the Elegoo Saturn 4 Ultra 16K), not on nozzle diameter as with FDM. It produces a smooth surface and detail from about 0.2 mm, far finer than FDM's 0.4-0.8 mm.",
      de: "Eine Harzdrucktechnologie, bei der eine ganze Schicht gleichzeitig durch UV-Licht ausgehärtet wird, das über einen Mono-LCD-Bildschirm projiziert wird, statt punktweise wie beim klassischen Laser-SLA. Die Auflösung hängt von der Pixelgröße des Bildschirms ab (14x19 µm beim Elegoo Saturn 4 Ultra 16K), nicht vom Düsendurchmesser wie beim FDM-Druck. Sie liefert eine glatte Oberfläche und Details ab etwa 0,2 mm, deutlich feiner als FDM mit 0,4-0,8 mm.",
    },
    relatedBlog: "druk-miniatur-figurek-16k",
  },
  {
    id: "kompensacja-skurczu",
    category: "studio",
    term: { pl: "Kompensacja skurczu odlewniczego", en: "Casting Shrinkage Compensation", de: "Gussschwund-Kompensation" },
    definition: {
      pl: "Powiększenie modelu CAD przed drukiem o współczynnik odpowiadający skurczowi stopu podczas krzepnięcia, tak by gotowy odlew miał docelowy wymiar. AEJaCA stosuje: Au 585 x1,0196, Ag 925 x1,016, Au 9K x1,021, Au 18K x1,018. Bez tej korekty odlew wychodzi mniejszy niż zaprojektowany model.",
      en: "Scaling up a CAD model before printing by a factor matching the alloy's shrinkage during solidification, so the finished casting reaches its target size. AEJaCA applies: Au 585 x1.0196, Ag 925 x1.016, Au 9K x1.021, Au 18K x1.018. Without this correction, the casting comes out smaller than the designed model.",
      de: "Vergrößerung eines CAD-Modells vor dem Druck um einen Faktor, der dem Schwund der Legierung beim Erstarren entspricht, damit der fertige Guss die Zielgröße erreicht. AEJaCA verwendet: Au 585 x1,0196, Ag 925 x1,016, Au 9K x1,021, Au 18K x1,018. Ohne diese Korrektur fällt der Guss kleiner aus als das entworfene Modell.",
    },
    relatedBlog: "druk-3d-krok-po-kroku",
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
