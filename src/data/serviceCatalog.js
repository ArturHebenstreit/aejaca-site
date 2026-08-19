// ============================================================
// KATALOG USLUG, tresc kart i stron szczegolowych
// ============================================================
// Usluga jest dla klienta takim samym produktem jak rzecz z polki, tylko
// z innym czasem realizacji i innym rezimem zwrotu. Dlatego ma taka sama
// karte, wlasna strone, opis, specyfikacje i zdjecie.
//
// `service` wskazuje pozycje w orderCatalog.js, ktora obsluguje kreator.
// `quoteOnly` oznacza usluge bez ceny automatycznej: zamiast koszyka
// pokazujemy wysylke do wyceny wraz z wyjasnieniem, dlaczego.
//
// `imagePrompt` to gotowy opis do wygenerowania zdjecia procesu przez
// Gemini. Do czasu wygenerowania uzywamy zdjec z portfolio.

const L = (pl, en, de) => ({ pl, en, de });

export const SERVICES_FULL = [
  // ---------------- sTuDiO ----------------
  {
    id: "print_fdm",
    calcHref: "/studio/?tab=3dprint#calculator",
    service: "print_fdm",
    category: "studio",
    image: "/img/shop/service/print_fdm.webp",
    imagePrompt:
      "Close-up of a Bambu Lab H2D 3D printer mid-print, nozzle laying a fresh layer of black PETG on a partially finished functional part, build plate visible, cool blue rim light from upper left, black background, premium product photography, shallow depth of field",
    priceFromGrosze: 1900,
    leadTimeDays: 3,
    title: L("Druk 3D z filamentu", "FDM 3D printing", "FDM-3D-Druck"),
    lead: L(
      "Wgraj plik STL, poznaj wiążącą cenę od razu.",
      "Upload an STL file and get a binding price immediately.",
      "STL-Datei hochladen, verbindlichen Preis sofort erhalten."
    ),
    description: L(
      "Drukujemy na Bambu Lab H2D, maszynie z dwiema głowicami i przestrzenią roboczą 300 × 320 × 325 mm. To pozwala wykonać zarówno pojedynczy prototyp, jak i serię kilkudziesięciu sztuk bez przerywania pracy na wymianę materiału.\n\nCenę liczymy z geometrii Twojego modelu: objętości, wymiarów i wysokości, bo to one decydują o zużyciu filamentu i czasie druku. Dlatego po wgraniu pliku widzisz konkretną kwotę, a nie widełki.\n\nDysponujemy ponad dwudziestoma filamentami, od standardowego PLA po materiały inżynieryjne z włóknem węglowym, takie jak PA6-CF czy PPS-CF, które wytrzymują temperaturę i obciążenia mechaniczne.",
      "We print on a Bambu Lab H2D, a dual-nozzle machine with a 300 × 320 × 325 mm build volume. That covers both a single prototype and a run of several dozen pieces without stopping to swap material.\n\nThe price comes from your model geometry: volume, dimensions and height, because those determine filament use and print time. That is why you see a specific figure after uploading the file, not a range.\n\nWe stock over twenty filaments, from standard PLA to carbon-filled engineering materials such as PA6-CF and PPS-CF, which withstand heat and mechanical load.",
      "Wir drucken auf einer Bambu Lab H2D mit zwei Düsen und 300 × 320 × 325 mm Bauraum. Das deckt sowohl den Einzelprototyp als auch eine Serie von mehreren Dutzend Stück ab, ohne für den Materialwechsel zu stoppen.\n\nDer Preis ergibt sich aus der Geometrie Ihres Modells: Volumen, Abmessungen und Höhe bestimmen Filamentverbrauch und Druckzeit. Deshalb sehen Sie nach dem Hochladen einen konkreten Betrag statt einer Spanne.\n\nWir führen über zwanzig Filamente, von Standard-PLA bis zu carbonverstärkten technischen Materialien wie PA6-CF und PPS-CF, die Hitze und mechanischer Belastung standhalten."
    ),
    process: [
      { title: L("Wgrywasz plik", "You upload the file", "Sie laden die Datei hoch"),
        body: L("Plik STL, dowolnej wielkości do 60 MB. Liczymy objętość i wymiary od razu.", "An STL file up to 60 MB. We compute volume and dimensions immediately.", "Eine STL-Datei bis 60 MB. Volumen und Maße werden sofort berechnet.") },
      { title: L("Wybierasz materiał i jakość", "You pick material and quality", "Sie wählen Material und Qualität"),
        body: L("Filament, wypełnienie, liczba kolorów i precyzja warstwy. Cena zmienia się na bieżąco.", "Filament, infill, number of colors and layer precision. The price updates as you go.", "Filament, Füllung, Farbanzahl und Schichtpräzision. Der Preis aktualisiert sich laufend.") },
      { title: L("Drukujemy i kontrolujemy", "We print and inspect", "Wir drucken und prüfen"),
        body: L("Po wydruku usuwamy podpory i sprawdzamy wymiary krytyczne.", "After printing we remove supports and check the critical dimensions.", "Nach dem Druck entfernen wir Stützen und prüfen kritische Maße.") },
      { title: L("Wysyłamy", "We ship", "Wir versenden"),
        body: L("Paczkomat, kurier albo odbiór osobisty w Józefosławiu.", "Locker, courier or personal pickup in Józefosław.", "Paketstation, Kurier oder Selbstabholung in Józefosław.") },
    ],
    specs: [
      { label: L("Maszyna", "Machine", "Maschine"), value: "Bambu Lab H2D" },
      { label: L("Przestrzeń robocza", "Build volume", "Bauraum"), value: "300 × 320 × 325 mm" },
      { label: L("Warstwa", "Layer height", "Schichthöhe"), value: "0,06 do 0,28 mm" },
      { label: L("Kolory", "Colors", "Farben"), value: L("Do 5 w jednym wydruku", "Up to 5 in one print", "Bis zu 5 in einem Druck") },
      { label: L("Materiały", "Materials", "Materialien"), value: L("PLA, PETG, TPU, ASA, ABS, PA-CF, PC, PPS", "PLA, PETG, TPU, ASA, ABS, PA-CF, PC, PPS", "PLA, PETG, TPU, ASA, ABS, PA-CF, PC, PPS") },
    ],
    bullets: [
      L("Cena liczona z geometrii Twojego modelu", "Priced from your model geometry", "Preis aus der Geometrie Ihres Modells"),
      L("Ponad 20 filamentów, od PLA po PPS-CF", "Over 20 filaments, from PLA to PPS-CF", "Über 20 Filamente, von PLA bis PPS-CF"),
      L("Do 5 kolorów w jednym wydruku", "Up to 5 colors in a single print", "Bis zu 5 Farben in einem Druck"),
    ],
  },
  {
    id: "print_msla",
    calcHref: "/studio/?tab=resin_msla#calculator",
    service: "print_msla",
    category: "studio",
    image: "/img/shop/service/print_msla.webp",
    imagePrompt:
      "Resin 3D printer build plate lifting out of a vat, a highly detailed miniature figure hanging upside down covered in glossy grey resin, dramatic side lighting, black background, premium product photography, macro detail",
    priceFromGrosze: 4700,
    leadTimeDays: 4,
    title: L("Druk żywiczny MSLA", "MSLA resin printing", "MSLA-Harzdruck"),
    lead: L(
      "Mikrodetal 14 µm: figurki, miniatury, wzorce odlewnicze.",
      "14 µm micro-detail: figurines, miniatures, casting patterns.",
      "14-µm-Mikrodetail: Figuren, Miniaturen, Gussmodelle."
    ),
    description: L(
      "Elegoo Saturn 4 Ultra 16K odwzorowuje detal o wielkości 14 mikrometrów, czyli mniejszy niż grubość ludzkiego włosa. To technologia do rzeczy, w których liczy się faktura powierzchni, a nie wytrzymałość: miniatur, figurek kolekcjonerskich i wzorców jubilerskich.\n\nDla odlewnictwa mamy osobne żywice odlewnicze, które wypalają się bez pozostałości. Wzorzec z takiej żywicy trafia prosto do masy formierskiej, a po wypaleniu zostaje po nim pusta forma gotowa na metal. Tę ścieżkę kontrolujemy wnikliwiej niż zwykły wydruk, bo błąd na wzorcu ujawnia się dopiero po odlaniu, gdy kruszec jest już zużyty.\n\nW cenie jest mycie w alkoholu izopropylowym i doświetlanie, czyli pełne przygotowanie modelu do użycia.",
      "The Elegoo Saturn 4 Ultra 16K resolves detail down to 14 micrometres, finer than a human hair. This is the technology for pieces where surface texture matters more than strength: miniatures, collectible figurines and jewelry casting patterns.\n\nFor casting we keep separate castable resins that burn out without residue. A pattern printed in such resin goes straight into investment, and after burnout it leaves a clean cavity ready for metal. We inspect this route more carefully than an ordinary print, because a fault in the pattern only shows after casting, when the metal is already spent.\n\nWashing in isopropyl alcohol and post-curing are included, so the model arrives ready to use.",
      "Der Elegoo Saturn 4 Ultra 16K löst Details bis 14 Mikrometer auf, feiner als ein menschliches Haar. Das ist die Technologie für Stücke, bei denen die Oberflächenstruktur wichtiger ist als die Festigkeit: Miniaturen, Sammelfiguren und Schmuck-Gussmodelle.\n\nFür den Guss halten wir separate Gießharze bereit, die rückstandsfrei ausbrennen. Ein solches Modell geht direkt in die Einbettmasse und hinterlässt nach dem Ausbrennen einen sauberen Hohlraum für das Metall. Diesen Weg prüfen wir gründlicher als einen gewöhnlichen Druck, denn ein Fehler am Modell zeigt sich erst nach dem Guss, wenn das Metall bereits verbraucht ist.\n\nWaschen in Isopropanol und Nachhärten sind inbegriffen."
    ),
    process: [
      { title: L("Plik albo rozmiar z listy", "File or size from the list", "Datei oder Größe aus der Liste"),
        body: L("Możesz wgrać STL albo wybrać jeden z gotowych rozmiarów.", "You can upload an STL or pick one of the preset sizes.", "Sie können eine STL hochladen oder eine voreingestellte Größe wählen.") },
      { title: L("Dobieramy żywicę", "We match the resin", "Wir wählen das Harz"),
        body: L("Do wzorców odlewniczych wyłącznie żywice wypalane bez popiołu.", "For casting patterns only ash-free burnout resins.", "Für Gussmodelle ausschließlich aschefreie Ausbrennharze.") },
      { title: L("Druk, mycie, doświetlanie", "Print, wash, cure", "Druck, Waschen, Härten"),
        body: L("Pełny cykl obróbki, model przychodzi gotowy do użycia.", "The full post-processing cycle, the model arrives ready to use.", "Der komplette Nachbearbeitungszyklus, das Modell kommt einsatzbereit.") },
    ],
    specs: [
      { label: L("Maszyna", "Machine", "Maschine"), value: "Elegoo Saturn 4 Ultra 16K" },
      { label: L("Rozdzielczość XY", "XY resolution", "XY-Auflösung"), value: "14 µm" },
      { label: L("Warstwa", "Layer height", "Schichthöhe"), value: "0,03 do 0,05 mm" },
      { label: L("Przestrzeń robocza", "Build volume", "Bauraum"), value: "218 × 123 × 250 mm" },
      { label: L("Żywice odlewnicze", "Castable resins", "Gießharze"), value: L("Tak, wypalane bez popiołu", "Yes, ash-free burnout", "Ja, aschefreier Ausbrand") },
    ],
    bullets: [
      L("Mikrodetal 14 µm", "14 µm micro-detail", "14-µm-Mikrodetail"),
      L("Żywice odlewnicze pod lost-resin", "Castable resins for lost-resin casting", "Gießharze für Lost-Resin-Guss"),
      L("Mycie i doświetlanie w cenie", "Washing and post-curing included", "Waschen und Nachhärten inklusive"),
    ],
  },
  {
    id: "laser_engrave",
    calcHref: "/studio/?tab=co2_laser&co2mode=engrave#calculator",
    service: "laser_engrave",
    category: "studio",
    image: "/img/shop/service/laser_engrave.webp",
    imagePrompt:
      "CO2 laser head engraving a wooden board, thin wisp of smoke rising, glowing red laser dot, fine detail appearing in the wood grain, dark workshop, dramatic lighting from upper left, premium product photography",
    priceFromGrosze: 1000,
    leadTimeDays: 3,
    title: L("Grawer laserowy CO2", "CO2 laser engraving", "CO2-Lasergravur"),
    lead: L(
      "Drewno, sklejka, akryl, skóra, szkło.",
      "Wood, plywood, acrylic, leather, glass.",
      "Holz, Sperrholz, Acryl, Leder, Glas."
    ),
    description: L(
      "Laser CO2 xTool P2 o mocy 55 W grawerem wypala rysunek w materiale, więc efekt jest trwały i nie schodzi z powierzchni. Pole robocze ma 600 × 288 mm, a z podnośnikiem obsługujemy przedmioty dłuższe i wyższe, na przykład butelki czy deski.\n\nGrawerujemy zarówno wektory, czyli logotypy, napisy i wzory, jak i fotografie, gdzie odcienie szarości oddajemy gęstością punktów. Ten drugi tryb wymaga więcej czasu maszyny, dlatego kalkulator pyta o szczegółowość.\n\nPersonalizacja pojedynczej sztuki kosztuje tyle samo za obsługę co seria, więc przy większych nakładach cena za sztukę wyraźnie spada.\n\nPowyższa cena obejmuje wyłącznie robociznę. Materiał możesz powierzyć albo zamówić u nas, wybierzesz to w konfiguratorze poniżej.",
      "The 55 W xTool P2 CO2 laser burns the design into the material, so the result is permanent and does not sit on the surface. The work area is 600 × 288 mm, and with a riser we handle longer and taller objects such as bottles or boards.\n\nWe engrave both vectors, meaning logos, lettering and patterns, and photographs, where greyscale is rendered through dot density. The second mode takes considerably more machine time, which is why the calculator asks about detail level.\n\nPersonalising a single piece carries the same setup cost as a series, so the price per piece drops noticeably on larger runs.\n\nThe price above covers labour only. You can supply your own material or order it from us, choose it in the configurator below.",
      "Der 55-W-CO2-Laser xTool P2 brennt das Motiv in das Material, das Ergebnis ist dauerhaft und liegt nicht auf der Oberfläche. Die Arbeitsfläche misst 600 × 288 mm, mit Erhöhung bearbeiten wir längere und höhere Objekte wie Flaschen oder Bretter.\n\nWir gravieren sowohl Vektoren, also Logos, Schriftzüge und Muster, als auch Fotografien, bei denen Graustufen über die Punktdichte entstehen. Der zweite Modus braucht deutlich mehr Maschinenzeit, deshalb fragt der Kalkulator nach dem Detailgrad.\n\nDie Personalisierung eines Einzelstücks kostet dieselbe Einrichtung wie eine Serie, bei größeren Auflagen sinkt der Stückpreis daher deutlich.\n\nDer obige Preis umfasst nur die Arbeitsleistung. Sie können eigenes Material beistellen oder es bei uns bestellen, wählen Sie es unten im Konfigurator."
    ),
    process: [
      { title: L("Przysyłasz grafikę", "You send the artwork", "Sie senden die Grafik"),
        body: L("SVG, PDF albo zdjęcie. Doradzimy, co da najlepszy efekt na wybranym materiale.", "SVG, PDF or a photo. We will advise what works best on the chosen material.", "SVG, PDF oder ein Foto. Wir beraten, was auf dem gewählten Material am besten wirkt.") },
      { title: L("Dobieramy parametry", "We set the parameters", "Wir stellen die Parameter ein"),
        body: L("Moc i prędkość dobieramy do materiału, żeby nie przypalić i nie zostawić śladu poza wzorem.", "Power and speed matched to the material, so nothing scorches outside the design.", "Leistung und Geschwindigkeit passend zum Material, damit nichts außerhalb des Motivs verbrennt.") },
      { title: L("Grawer i czyszczenie", "Engraving and cleaning", "Gravur und Reinigung"),
        body: L("Po grawerze usuwamy osad i sprawdzamy kontrast wzoru.", "After engraving we remove residue and check the contrast of the design.", "Nach der Gravur entfernen wir Rückstände und prüfen den Kontrast.") },
    ],
    specs: [
      { label: L("Maszyna", "Machine", "Maschine"), value: "xTool P2, 55 W CO2" },
      { label: L("Pole robocze", "Work area", "Arbeitsfläche"), value: "600 × 288 mm" },
      { label: L("Z podnośnikiem", "With riser", "Mit Erhöhung"), value: L("Do 3000 mm długości", "Up to 3000 mm long", "Bis 3000 mm Länge") },
      { label: L("Materiały", "Materials", "Materialien"), value: L("Drewno, sklejka, akryl, skóra, papier, szkło, kamień", "Wood, plywood, acrylic, leather, paper, glass, stone", "Holz, Sperrholz, Acryl, Leder, Papier, Glas, Stein") },
    ],
    bullets: [
      L("Pole robocze 600 × 288 mm, z podnośnikiem dłuższe", "600 × 288 mm work area, longer with a riser", "Arbeitsfläche 600 × 288 mm, mit Erhöhung länger"),
      L("Grawer fotograficzny i wektorowy", "Photographic and vector engraving", "Foto- und Vektorgravur"),
      L("Im większy nakład, tym niższa cena za sztukę", "The larger the run, the lower the price per piece", "Je größer die Auflage, desto niedriger der Stückpreis"),
    ],
  },
  {
    id: "laser_cut",
    calcHref: "/studio/?tab=co2_laser&co2mode=cut#calculator",
    service: "laser_cut",
    category: "studio",
    image: "/img/shop/service/laser_cut.webp",
    imagePrompt:
      "CO2 laser cutting through 3 mm plywood, bright cutting spark at the kerf, precise intricate shape emerging, thin smoke, dark workshop background, dramatic side light, premium product photography",
    priceFromGrosze: 1000,
    leadTimeDays: 3,
    title: L("Cięcie laserem CO2", "CO2 laser cutting", "CO2-Laserschnitt"),
    lead: L(
      "Kształty z pliku wektorowego, sklejka, akryl, skóra, filc.",
      "Shapes from a vector file: plywood, acrylic, leather, felt.",
      "Formen aus einer Vektordatei: Sperrholz, Acryl, Leder, Filz."
    ),
    description: L(
      "Cięcie laserem daje krawędź, której nie uzyskasz piłą ani frezem: bez wyrwań, bez konieczności szlifowania, z dokładnością odwzorowania rysunku co do dziesiątej części milimetra. Dlatego sprawdza się przy elementach ażurowych, szablonach i opakowaniach.\n\nCenę wyznacza łączna długość ścieżki cięcia oraz złożoność wzoru, bo to one przekładają się na czas pracy maszyny. Kształt prosty przetniemy szybciej niż koronkowy o tej samej powierzchni.\n\nW akrylu bezbarwnym krawędź po cięciu wychodzi przezroczysta i polerowana, co często wykorzystujemy przy podświetlanych elementach.\n\nPowyższa cena obejmuje wyłącznie robociznę. Materiał możesz powierzyć albo zamówić u nas, wybierzesz to w konfiguratorze poniżej.",
      "Laser cutting gives an edge you will not get with a saw or a router: no tear-out, no sanding needed, tracing the drawing to a tenth of a millimetre. That makes it the right tool for openwork parts, templates and packaging.\n\nThe price follows the total cutting path length and the complexity of the pattern, because those translate into machine time. A simple shape cuts faster than a lace-like one of the same area.\n\nIn clear acrylic the cut edge comes out transparent and polished, which we often use for backlit elements.\n\nThe price above covers labour only. You can supply your own material or order it from us, choose it in the configurator below.",
      "Laserschneiden liefert eine Kante, die Säge oder Fräse nicht erreichen: ohne Ausrisse, ohne Schleifen, mit einer Genauigkeit von einem Zehntelmillimeter. Deshalb eignet es sich für durchbrochene Teile, Schablonen und Verpackungen.\n\nDer Preis richtet sich nach der Gesamtlänge des Schnittpfads und der Komplexität des Musters, denn beides bestimmt die Maschinenzeit. Eine einfache Form wird schneller geschnitten als eine spitzenartige gleicher Fläche.\n\nIn klarem Acryl bleibt die Schnittkante transparent und poliert, was wir gern für hinterleuchtete Elemente nutzen.\n\nDer obige Preis umfasst nur die Arbeitsleistung. Sie können eigenes Material beistellen oder es bei uns bestellen, wählen Sie es unten im Konfigurator."
    ),
    process: [
      { title: L("Przysyłasz wektor", "You send a vector", "Sie senden einen Vektor"),
        body: L("SVG albo DXF. Jeśli masz tylko rysunek, przygotujemy wektor za dopłatą.", "SVG or DXF. If you only have a drawing, we can prepare the vector for a surcharge.", "SVG oder DXF. Wenn Sie nur eine Zeichnung haben, erstellen wir den Vektor gegen Aufpreis.") },
      { title: L("Rozkładamy na arkuszu", "We nest on the sheet", "Wir schachteln auf der Platte"),
        body: L("Układamy elementy tak, żeby zmieściło się ich jak najwięcej i zmniejszyć koszt materiału.", "We arrange the parts to fit as many as possible and cut material cost.", "Wir ordnen die Teile so an, dass möglichst viele passen und Materialkosten sinken.") },
      { title: L("Cięcie i kontrola krawędzi", "Cutting and edge check", "Schneiden und Kantenprüfung"),
        body: L("Sprawdzamy przypalenia i w razie potrzeby czyścimy krawędź.", "We check for scorching and clean the edge if needed.", "Wir prüfen auf Brandspuren und reinigen die Kante bei Bedarf.") },
    ],
    specs: [
      { label: L("Maszyna", "Machine", "Maschine"), value: "xTool P2, 55 W CO2" },
      { label: L("Pole robocze", "Work area", "Arbeitsfläche"), value: "600 × 288 mm" },
      { label: L("Sklejka", "Plywood", "Sperrholz"), value: L("3, 5 i 8 mm", "3, 5 and 8 mm", "3, 5 und 8 mm") },
      { label: L("Akryl", "Acrylic", "Acryl"), value: L("3, 5 i 8 mm", "3, 5 and 8 mm", "3, 5 und 8 mm") },
      { label: L("Dokładność", "Accuracy", "Genauigkeit"), value: "± 0,1 mm" },
    ],
    bullets: [
      L("Krawędź bez wyrwań, bez szlifowania", "Edge without tear-out, no sanding", "Kante ohne Ausrisse, ohne Schleifen"),
      L("Przezroczysta polerowana krawędź w akrylu", "Transparent polished edge in acrylic", "Transparente polierte Kante in Acryl"),
      L("Rozkład elementów optymalizujemy pod koszt materiału", "Parts nested to reduce material cost", "Teile werden materialsparend geschachtelt"),
    ],
  },
  {
    id: "laser_fiber",
    calcHref: "/studio/?tab=fiber_laser#calculator",
    service: "laser_fiber",
    category: "studio",
    image: "/img/shop/service/laser_fiber.webp",
    imagePrompt:
      "Fiber laser marking a stainless steel plate, bright white spark trail following the beam, crisp dark engraved lines appearing on brushed metal, black background, cool rim light from upper left, premium macro product photography",
    priceFromGrosze: 900,
    leadTimeDays: 2,
    title: L("Znakowanie laserem fiber", "Fiber laser marking", "Faserlaser-Markierung"),
    lead: L(
      "Trwałe znakowanie metalu, które się nie ściera.",
      "Permanent metal marking that does not rub off.",
      "Dauerhafte Metallmarkierung, die sich nicht abreibt."
    ),
    description: L(
      "Laser fiber nie nakłada niczego na powierzchnię, tylko zmienia strukturę metalu. Znak nie ściera się w kieszeni, nie blaknie od słońca i przetrwa mycie w myjce ultradźwiękowej, w przeciwieństwie do nadruku czy farby.\n\nMamy trzy tryby: znakowanie powierzchniowe do numerów i logotypów, głębokie do oznaczeń narzędzi oraz barwne, gdzie sterując parametrami uzyskujemy kolor na stali nierdzewnej bez żadnego barwnika.\n\nZnakujemy stal, aluminium, mosiądz, tytan, a także srebro i złoto, dlatego ta usługa łączy się z biżuterią: grawer wewnątrz obrączki wykonujemy tym samym laserem.\n\nPowyższa cena obejmuje wyłącznie robociznę. Przedmiot do znakowania zwykle przysyłasz Ty, ale możesz też zamówić u nas gotowy blank, wybierzesz to w konfiguratorze poniżej.",
      "A fiber laser does not add anything to the surface, it changes the structure of the metal. The mark does not rub off in a pocket, does not fade in sunlight and survives an ultrasonic cleaner, unlike print or paint.\n\nWe work in three modes: surface marking for numbers and logos, deep marking for tool identification, and color marking, where controlling the parameters produces color on stainless steel without any dye.\n\nWe mark steel, aluminium, brass, titanium, and also silver and gold, which is why this service connects to jewelry: the engraving inside a wedding band is done with the same laser.\n\nThe price above covers labour only. You usually send us the item to mark, but you can also order a ready blank from us, choose it in the configurator below.",
      "Ein Faserlaser trägt nichts auf die Oberfläche auf, er verändert die Struktur des Metalls. Die Markierung reibt sich nicht in der Tasche ab, verblasst nicht in der Sonne und übersteht das Ultraschallbad, anders als Druck oder Farbe.\n\nWir arbeiten in drei Modi: Oberflächenmarkierung für Nummern und Logos, Tiefenmarkierung für Werkzeugkennzeichnung und Farbmarkierung, bei der über die Parameter Farbe auf Edelstahl ohne jeden Farbstoff entsteht.\n\nWir markieren Stahl, Aluminium, Messing, Titan sowie Silber und Gold. Deshalb hängt diese Leistung mit Schmuck zusammen: Die Gravur im Trauring entsteht mit demselben Laser.\n\nDer obige Preis umfasst nur die Arbeitsleistung. Meist senden Sie uns das zu markierende Objekt, Sie können aber auch einen fertigen Rohling bei uns bestellen, wählen Sie es unten im Konfigurator."
    ),
    process: [
      { title: L("Ustalamy treść", "We agree the content", "Wir klären den Inhalt"),
        body: L("Tekst, logo, numer seryjny albo kod QR. Podpowiemy, co zmieści się czytelnie.", "Text, logo, serial number or QR code. We will advise what fits legibly.", "Text, Logo, Seriennummer oder QR-Code. Wir beraten, was lesbar hineinpasst.") },
      { title: L("Próba na ścince", "Test on an offcut", "Test am Reststück"),
        body: L("Przy nietypowym stopie robimy próbę, zanim znakujemy Twój przedmiot.", "For an unusual alloy we run a test before marking your item.", "Bei ungewöhnlichen Legierungen testen wir, bevor wir Ihr Objekt markieren.") },
      { title: L("Znakowanie", "Marking", "Markierung"),
        body: L("Sam proces trwa sekundy, dlatego serie robimy szybko.", "The process itself takes seconds, which makes series work fast.", "Der Vorgang dauert Sekunden, Serien gehen daher schnell.") },
    ],
    specs: [
      { label: L("Obiektywy", "Lenses", "Objektive"), value: L("70 mm i 150 mm", "70 mm and 150 mm", "70 mm und 150 mm") },
      { label: L("Tryby", "Modes", "Modi"), value: L("Powierzchniowy, głęboki, barwny", "Surface, deep, color", "Oberfläche, Tiefe, Farbe") },
      { label: L("Metale", "Metals", "Metalle"), value: L("Stal, aluminium, mosiądz, tytan, srebro, złoto", "Steel, aluminium, brass, titanium, silver, gold", "Stahl, Aluminium, Messing, Titan, Silber, Gold") },
      { label: L("Trwałość", "Durability", "Beständigkeit"), value: L("Nie ściera się i nie blaknie", "Does not rub off or fade", "Reibt sich nicht ab und verblasst nicht") },
    ],
    bullets: [
      L("Znak w strukturze metalu, nie na powierzchni", "Mark in the metal structure, not on the surface", "Markierung in der Metallstruktur, nicht darauf"),
      L("Kolor na stali bez użycia barwnika", "Color on steel without any dye", "Farbe auf Stahl ohne Farbstoff"),
      L("Numery seryjne, kody QR, logo, personalizacja", "Serial numbers, QR codes, logos, personalisation", "Seriennummern, QR-Codes, Logos, Personalisierung"),
    ],
  },
  {
    id: "epoxy",
    calcHref: "/studio/?tab=epoxy#calculator",
    service: "epoxy",
    category: "studio",
    image: "/img/shop/service/epoxy.webp",
    imagePrompt:
      "Clear epoxy resin being poured into a silicone mold, amber-tinted resin catching warm light, small dried flowers suspended inside, glossy surface, black background, upper left key light, premium product photography",
    priceFromGrosze: 2100,
    leadTimeDays: 7,
    title: L("Odlew żywiczny", "Resin casting", "Harzguss"),
    lead: L(
      "Żywica UV i epoksydowa, barwienia i zatopienia.",
      "UV and epoxy resin, pigments and inclusions.",
      "UV- und Epoxidharz, Pigmente und Einschlüsse."
    ),
    description: L(
      "Odlew żywiczny pozwala zamknąć coś na stałe: kwiaty ze ślubnego bukietu, pamiątkę, element elektroniczny albo źródło światła. Powstaje przedmiot, którego nie da się wykonać żadną inną techniką, bo zatopienie jest widoczne przez materiał.\n\nPracujemy na żywicy UV, która utwardza się w minuty i nadaje się do małych form, oraz na epoksydowej, która wymaga doby, ale pozwala odlewać większe bryły bez pęcherzy i bez nadmiernego grzania.\n\nMożesz skorzystać z naszych form silikonowych, zamówić wykonanie nowej albo przysłać własną. Wykończenie ustalamy osobno: od surowego, przez szlifowane, po polerowane na lustro.",
      "Resin casting lets you seal something permanently: flowers from a wedding bouquet, a keepsake, an electronic component or a light source. The result is an object no other technique can produce, because the inclusion stays visible through the material.\n\nWe work with UV resin, which cures in minutes and suits small molds, and with epoxy, which needs a day but allows larger volumes without bubbles or excessive heat.\n\nYou can use our silicone molds, order a new one, or send your own. Finishing is agreed separately: from raw, through sanded, to mirror polished.",
      "Harzguss erlaubt es, etwas dauerhaft einzuschließen: Blumen aus dem Hochzeitsstrauß, ein Andenken, ein elektronisches Bauteil oder eine Lichtquelle. Es entsteht ein Objekt, das keine andere Technik hervorbringt, denn der Einschluss bleibt durch das Material sichtbar.\n\nWir arbeiten mit UV-Harz, das in Minuten aushärtet und für kleine Formen geeignet ist, sowie mit Epoxid, das einen Tag braucht, aber größere Volumen ohne Blasen und ohne übermäßige Wärme erlaubt.\n\nSie können unsere Silikonformen nutzen, eine neue bestellen oder Ihre eigene schicken. Das Finish wird separat vereinbart: von roh über geschliffen bis spiegelpoliert."
    ),
    process: [
      { title: L("Ustalamy formę", "We agree the mold", "Wir klären die Form"),
        body: L("Z naszego katalogu, nowa na zamówienie albo Twoja własna.", "From our catalogue, made to order, or your own.", "Aus unserem Katalog, nach Maß oder Ihre eigene.") },
      { title: L("Przygotowanie zatopień", "Preparing the inclusions", "Vorbereitung der Einschlüsse"),
        body: L("Kwiaty muszą być wysuszone, inaczej z czasem zbrązowieją w żywicy.", "Flowers must be dried, otherwise they will brown inside the resin over time.", "Blumen müssen getrocknet sein, sonst bräunen sie im Harz mit der Zeit.") },
      { title: L("Zalewanie i utwardzanie", "Pouring and curing", "Gießen und Aushärten"),
        body: L("Odpowietrzamy żywicę, żeby w bryle nie zostały pęcherze.", "We degas the resin so no bubbles remain in the piece.", "Wir entgasen das Harz, damit keine Blasen bleiben.") },
      { title: L("Wykończenie", "Finishing", "Finish"),
        body: L("Szlif i polerowanie do wybranego poziomu połysku.", "Sanding and polishing to the chosen level of gloss.", "Schleifen und Polieren bis zum gewünschten Glanzgrad.") },
    ],
    specs: [
      { label: L("Żywice", "Resins", "Harze"), value: L("UV, epoksydowa bezbarwna, epoksydowa barwiona", "UV, clear epoxy, tinted epoxy", "UV, klares Epoxid, getöntes Epoxid") },
      { label: L("Zatopienia", "Inclusions", "Einschlüsse"), value: L("Pigment, przedmioty, elektronika LED", "Pigment, objects, LED electronics", "Pigment, Objekte, LED-Elektronik") },
      { label: L("Formy", "Molds", "Formen"), value: L("Nasze, nowe na zamówienie lub powierzone", "Ours, made to order, or supplied by you", "Unsere, nach Maß oder von Ihnen gestellt") },
      { label: L("Wykończenie", "Finish", "Finish"), value: L("Surowe, szlifowane, polerowane", "Raw, sanded, polished", "Roh, geschliffen, poliert") },
    ],
    bullets: [
      L("Zatopienia: kwiaty, pamiątki, elektronika LED", "Inclusions: flowers, keepsakes, LED electronics", "Einschlüsse: Blumen, Andenken, LED-Elektronik"),
      L("Formy nasze, nowe albo Twoje", "Molds ours, new, or yours", "Formen unsere, neue oder Ihre"),
      L("Odpowietrzanie żywicy, bryła bez pęcherzy", "Resin degassed, no bubbles in the piece", "Harz entgast, Stück ohne Blasen"),
    ],
  },
  // ---------------- Bizuteria ----------------
  {
    id: "jewelry_renovation",
    calcHref: "/jewelry/?service=renovation#calculator",
    service: "jewelry_renovation",
    category: "jewelry",
    image: "/img/shop/service/jewelry_renovation.webp",
    imagePrompt:
      "Jeweler polishing a tarnished silver pendant on a polishing wheel, half of the piece already mirror bright and half still dark, hands in focus, warm amber key light from upper left, black background, premium product photography",
    priceFromGrosze: 3500,
    leadTimeDays: 5,
    title: L("Renowacja biżuterii", "Jewelry renovation", "Schmuckaufarbeitung"),
    lead: L(
      "Przywracamy blask, nie zmieniając charakteru.",
      "We restore the shine without changing the character.",
      "Wir bringen den Glanz zurück, ohne den Charakter zu verändern."
    ),
    description: L(
      "Renowacja to nie polerowanie do połysku za wszelką cenę. Przy starej biżuterii patyna w zagłębieniach jest częścią jej wyglądu, a zdarcie jej sprawia, że wyrób traci głębię i wygląda na nowy w złym znaczeniu. Dlatego zaczynamy od rozmowy o tym, jak daleko chcesz pójść.\n\nStandardowo wykonujemy mycie ultradźwiękowe, usunięcie zaczernień i polerowanie powierzchni zewnętrznych. Osobno wyceniamy rodowanie białego złota, które z czasem żółknie, oraz złocenie srebra.\n\nKażdą sztukę z kamieniami sprawdzamy przed oddaniem: mycie ultradźwiękowe potrafi obluzować kamień osadzony w zmęczonych krapach, a lepiej dowiedzieć się o tym u nas niż po zgubieniu kamienia.",
      "Renovation is not polishing to a shine at any cost. On older jewelry the patina in the recesses is part of how the piece looks, and stripping it makes the work lose depth and look new in the wrong sense. So we start with a conversation about how far you want to go.\n\nAs standard we do ultrasonic cleaning, removal of tarnish and polishing of the outer surfaces. Rhodium plating of white gold, which yellows over time, and gilding of silver are quoted separately.\n\nEvery piece with stones is checked before handover: ultrasonic cleaning can loosen a stone held by tired prongs, and it is better to learn that here than after losing the stone.",
      "Aufarbeitung ist kein Polieren auf Hochglanz um jeden Preis. Bei älterem Schmuck gehört die Patina in den Vertiefungen zum Erscheinungsbild, und ihr Entfernen nimmt dem Stück die Tiefe. Deshalb beginnen wir mit einem Gespräch darüber, wie weit Sie gehen möchten.\n\nStandardmäßig führen wir Ultraschallreinigung, Entfernung von Anlauf und Politur der Außenflächen durch. Rhodinierung von Weißgold, das mit der Zeit vergilbt, und Vergoldung von Silber werden separat kalkuliert.\n\nJedes Stück mit Steinen prüfen wir vor der Übergabe: Ultraschallreinigung kann einen Stein in ermüdeten Krappen lockern, und das erfährt man besser bei uns als nach dem Verlust."
    ),
    process: [
      { title: L("Oględziny i ustalenia", "Inspection and agreement", "Begutachtung und Absprache"),
        body: L("Oceniamy stan i ustalamy, ile patyny zostawiamy.", "We assess the condition and agree how much patina to keep.", "Wir beurteilen den Zustand und legen fest, wie viel Patina bleibt.") },
      { title: L("Mycie i usuwanie zaczernień", "Cleaning and tarnish removal", "Reinigung und Anlaufentfernung"),
        body: L("Ultradźwięki, a przy delikatnych wyrobach czyszczenie ręczne.", "Ultrasonic, or hand cleaning for delicate pieces.", "Ultraschall, bei empfindlichen Stücken Handreinigung.") },
      { title: L("Polerowanie i powłoka", "Polishing and plating", "Politur und Beschichtung"),
        body: L("Opcjonalnie rodowanie białego złota albo złocenie srebra.", "Optionally rhodium plating of white gold or gilding of silver.", "Optional Rhodinierung von Weißgold oder Vergoldung von Silber.") },
      { title: L("Kontrola osadzenia", "Setting check", "Fassungskontrolle"),
        body: L("Sprawdzamy każdy kamień, zanim oddamy wyrób.", "We check every stone before handing the piece back.", "Wir prüfen jeden Stein vor der Rückgabe.") },
    ],
    specs: [
      { label: L("Zakres", "Scope", "Umfang"), value: L("Czyszczenie, polerowanie, rodowanie, złocenie", "Cleaning, polishing, rhodium, gilding", "Reinigung, Politur, Rhodinierung, Vergoldung") },
      { label: L("Kruszce", "Metals", "Metalle"), value: L("Srebro, złoto, platyna (renowacja bez lutowania)", "Silver, gold, platinum (renovation without soldering)", "Silber, Gold, Platin (Renovierung ohne Löten)") },
      { label: L("Kontrola kamieni", "Stone check", "Steinkontrolle"), value: L("W każdym zleceniu", "Included in every order", "In jedem Auftrag enthalten") },
      { label: L("Czas realizacji", "Lead time", "Bearbeitungszeit"), value: L("3 do 5 dni roboczych", "3 to 5 business days", "3 bis 5 Werktage") },
    ],
    bullets: [
      L("Czyszczenie ultradźwiękowe i polerowanie", "Ultrasonic cleaning and polishing", "Ultraschallreinigung und Polieren"),
      L("Rodowanie białego złota, złocenie srebra", "Rhodium plating of white gold, gilding of silver", "Rhodinierung von Weißgold, Vergolden von Silber"),
      L("Kontrola osadzenia kamieni przed oddaniem", "Stone setting checked before handover", "Fassungskontrolle vor der Übergabe"),
    ],
  },
  {
    id: "jewelry_repair",
    calcHref: "/jewelry/?service=repair#calculator",
    service: "jewelry_repair",
    category: "jewelry",
    image: "/img/shop/service/jewelry_repair.webp",
    imagePrompt:
      "Jeweler's torch soldering a gold ring held in tweezers, small bright flame, molten solder flowing at the joint, dark workshop, warm amber light from upper left, black background, premium macro product photography",
    priceFromGrosze: 6000,
    leadTimeDays: 5,
    title: L("Naprawa biżuterii", "Jewelry repair", "Schmuckreparatur"),
    lead: L(
      "Zmiana rozmiaru, krapy, zapięcia, lutowanie.",
      "Resizing, prongs, clasps, soldering.",
      "Weitenänderung, Krappen, Verschlüsse, Löten."
    ),
    description: L(
      "Naprawiamy to, co da się naprawić, i mówimy wprost, kiedy się nie da. Przy wyrobach mocno zużytych albo z cienką, przetartą obrączką naprawa bywa droższa od wykonania nowego egzemplarza, a jej trwałość i tak jest ograniczona. Wtedy powiemy to od razu, zamiast brać pieniądze za coś, co pęknie za pół roku.\n\nNajczęstsze zlecenia to zmiana rozmiaru pierścionka, odbudowa zużytych krapów trzymających kamień, wymiana zapięcia i lutowanie przerwanego łańcuszka.\n\nPrzy zmianie rozmiaru pamiętaj, że pierścionek z kamieniami osadzonymi wokół całej obwodu zwykle nie da się zmienić bez ingerencji w osadzenie. Napisz przed wysłaniem, ocenimy na zdjęciu.",
      "We repair what can be repaired, and say plainly when it cannot. On heavily worn pieces, or a band worn thin, the repair can cost more than making a new one and its durability is limited anyway. In that case we say so straight away instead of taking money for something that will crack in six months.\n\nThe most common jobs are resizing a ring, rebuilding worn prongs holding a stone, replacing a clasp and soldering a broken chain.\n\nWith resizing, bear in mind that a ring set with stones all the way around usually cannot be changed without touching the setting. Write to us before sending it and we will assess from a photo.",
      "Wir reparieren, was sich reparieren lässt, und sagen klar, wenn es nicht geht. Bei stark abgenutzten Stücken oder dünn gelaufenen Ringschienen kann die Reparatur teurer sein als eine Neuanfertigung, und ihre Haltbarkeit bleibt begrenzt. Dann sagen wir das sofort, statt Geld für etwas zu nehmen, das in einem halben Jahr bricht.\n\nDie häufigsten Aufträge sind Weitenänderung, Aufbau abgenutzter Krappen, Verschlusstausch und das Löten gerissener Ketten.\n\nBeachten Sie bei der Weitenänderung: Ein rundum mit Steinen besetzter Ring lässt sich meist nicht ändern, ohne die Fassung zu berühren. Schreiben Sie uns vorher, wir beurteilen es anhand eines Fotos."
    ),
    process: [
      { title: L("Zdjęcie i wstępna ocena", "Photo and first assessment", "Foto und erste Einschätzung"),
        body: L("Przyślij zdjęcie, powiemy, czy naprawa ma sens.", "Send a photo and we will say whether the repair makes sense.", "Senden Sie ein Foto, wir sagen, ob sich die Reparatur lohnt.") },
      { title: L("Wycena po obejrzeniu", "Quote after inspection", "Angebot nach Begutachtung"),
        body: L("Ostateczną kwotę potwierdzamy, gdy wyrób jest u nas.", "The final figure is confirmed once the piece is with us.", "Den endgültigen Betrag bestätigen wir, sobald das Stück bei uns ist.") },
      { title: L("Naprawa", "Repair", "Reparatur"),
        body: L("Lutowanie w atmosferze ochronnej, żeby nie przypalić kamieni.", "Soldering under a protective atmosphere so stones are not damaged.", "Löten unter Schutzatmosphäre, damit Steine nicht beschädigt werden.") },
      { title: L("Wykończenie i kontrola", "Finishing and check", "Finish und Kontrolle"),
        body: L("Polerowanie miejsca naprawy i sprawdzenie osadzenia.", "Polishing the repaired area and checking the setting.", "Polieren der Reparaturstelle und Kontrolle der Fassung.") },
    ],
    specs: [
      { label: L("Zakres", "Scope", "Umfang"), value: L("Rozmiar, krapy, kamienie, zapięcia, łańcuszki, lutowanie", "Resizing, prongs, stones, clasps, chains, soldering", "Weite, Krappen, Steine, Verschlüsse, Ketten, Löten") },
      { label: L("Kruszce", "Metals", "Metalle"), value: L("Srebro, złoto", "Silver, gold", "Silber, Gold") },
      { label: L("Wycena", "Quote", "Angebot"), value: L("Wstępna ze zdjęcia, ostateczna po obejrzeniu", "Preliminary from a photo, final after inspection", "Vorläufig per Foto, endgültig nach Begutachtung") },
      { label: L("Czas realizacji", "Lead time", "Bearbeitungszeit"), value: L("3 do 7 dni roboczych", "3 to 7 business days", "3 bis 7 Werktage") },
    ],
    bullets: [
      L("Zmiana rozmiaru obrączek i pierścionków", "Resizing of bands and rings", "Weitenänderung von Ringen"),
      L("Odbudowa krapów i wymiana zapięć", "Prong rebuilding and clasp replacement", "Krappenaufbau und Verschlusstausch"),
      L("Powiemy wprost, gdy naprawa nie ma sensu", "We say plainly when a repair is not worth it", "Wir sagen klar, wenn sich eine Reparatur nicht lohnt"),
    ],
  },
  {
    id: "jewelry_plain",
    calcHref: "/jewelry/?service=new#calculator",
    service: "jewelry_plain",
    category: "jewelry",
    image: "/img/shop/service/jewelry_plain.webp",
    imagePrompt:
      "Molten gold being poured into an investment casting flask, glowing orange metal stream, sparks, dark workshop, warm amber key light from upper left, black background, premium product photography",
    priceFromGrosze: 13000,
    leadTimeDays: 10,
    title: L("Biżuteria bez kamieni", "Jewelry without stones", "Schmuck ohne Steine"),
    lead: L(
      "Obrączki, sygnety i zawieszki z samego kruszcu.",
      "Bands, signet rings and pendants in plain metal.",
      "Ringe, Siegelringe und Anhänger aus reinem Metall."
    ),
    description: L(
      "Wyrób z samego kruszcu da się wycenić od ręki, bo cena składa się z dwóch znanych rzeczy: masy metalu przeliczonej po aktualnym kursie oraz pracy zależnej od metody wykonania. Dlatego ta kategoria jest w sklepie, a wyroby z kamieniami nie.\n\nOdlew sprawdza się przy formach pełnych i powtarzalnych, a wykonanie ręczne przy prostych obrączkach i wszędzie tam, gdzie chcesz uzyskać fakturę kutego metalu.\n\nKurs kruszcu pobieramy z NBP i aktualizujemy co godzinę, więc cena, którą widzisz, odpowiada rynkowi z tego dnia. Przy zamówieniu jest wiążąca przez 7 dni niezależnie od tego, co zrobi złoto.",
      "A piece made of plain metal can be quoted immediately, because the price consists of two known things: the mass of metal converted at the current rate, and the labour that follows from the method of making. That is why this category is in the shop and pieces with stones are not.\n\nCasting suits solid, repeatable forms, while handmaking suits plain bands and anywhere you want the texture of forged metal.\n\nThe metal rate comes from the Polish central bank and is refreshed hourly, so the price you see reflects that day's market. Once ordered it is binding for 7 days regardless of what gold does.",
      "Ein Stück aus reinem Metall lässt sich sofort kalkulieren, denn der Preis besteht aus zwei bekannten Größen: der Metallmasse zum aktuellen Kurs und dem Arbeitsaufwand je nach Fertigungsmethode. Deshalb steht diese Kategorie im Shop, Stücke mit Steinen nicht.\n\nGuss eignet sich für massive, wiederholbare Formen, Handarbeit für schlichte Ringe und überall dort, wo die Textur geschmiedeten Metalls gewünscht ist.\n\nDen Metallkurs beziehen wir von der polnischen Nationalbank und aktualisieren ihn stündlich. Der angezeigte Preis entspricht also dem Markt dieses Tages und ist nach Bestellung 7 Tage verbindlich."
    ),
    process: [
      { title: L("Wybierasz kruszec i formę", "You choose metal and form", "Sie wählen Metall und Form"),
        body: L("Rodzaj wyrobu, próba, masywność i metoda wykonania.", "Type of piece, purity, boldness and making method.", "Art des Stücks, Feingehalt, Massivität und Methode.") },
      { title: L("Model i przymiarka", "Model and fitting", "Modell und Anprobe"),
        body: L("Przy nietypowych rozmiarach wysyłamy wydruk próbny do przymiarki.", "For unusual sizes we send a test print to try on.", "Bei ungewöhnlichen Größen senden wir einen Probedruck zur Anprobe.") },
      { title: L("Odlew albo wykonanie ręczne", "Casting or handmaking", "Guss oder Handarbeit"),
        body: L("Metoda zgodna z tym, co wybrałeś przy wycenie.", "The method matches what you chose when quoting.", "Die Methode entspricht Ihrer Wahl bei der Kalkulation.") },
      { title: L("Wykończenie i grawer", "Finishing and engraving", "Finish und Gravur"),
        body: L("Polerowanie, opcjonalna powłoka i grawer wewnętrzny.", "Polishing, optional plating and inside engraving.", "Politur, optionale Beschichtung und Innengravur.") },
    ],
    specs: [
      { label: L("Kruszce", "Metals", "Metalle"), value: L("Srebro 925 i 800, złoto 375, 585, 750", "925 and 800 silver, 375, 585 and 750 gold", "925er und 800er Silber, 375er, 585er und 750er Gold") },
      { label: L("Metody", "Methods", "Methoden"), value: L("Odlew na wosk tracony, wykonanie ręczne", "Lost-wax casting, handmaking", "Wachsausschmelzguss, Handarbeit") },
      { label: L("Powłoki", "Plating", "Beschichtungen"), value: L("Rod, złoto, różowe złoto", "Rhodium, gold, rose gold", "Rhodium, Gold, Roségold") },
      { label: L("Kurs kruszcu", "Metal rate", "Metallkurs"), value: L("NBP, aktualizowany co godzinę", "Polish central bank, refreshed hourly", "Polnische Nationalbank, stündlich aktualisiert") },
    ],
    bullets: [
      L("Srebro 925 i 800, złoto od 375 do 750", "925 and 800 silver, gold from 375 to 750", "925er und 800er Silber, Gold von 375 bis 750"),
      L("Cena z aktualnego kursu kruszcu, wiążąca 7 dni", "Priced at the current metal rate, binding for 7 days", "Preis zum aktuellen Metallkurs, 7 Tage verbindlich"),
      L("Grawer wewnętrzny i zewnętrzny", "Inside and outside engraving", "Innen- und Außengravur"),
    ],
  },
  // ---------------- Wymagajace rozmowy ----------------
  {
    id: "jewelry_stones",
    calcHref: "/jewelry/?service=new#calculator",
    quoteOnly: true,
    category: "jewelry",
    image: "/img/shop/service/jewelry_stones.webp",
    imagePrompt:
      "Jeweler setting a brilliant-cut stone into a gold ring under a microscope, tweezers holding the stone, prongs visible, extreme macro, warm amber light from upper left, black background, premium product photography",
    leadTimeDays: 21,
    title: L("Biżuteria z kamieniami", "Jewelry with stones", "Schmuck mit Steinen"),
    lead: L(
      "Pierścionki zaręczynowe i wyroby z kamieniem powierzonym.",
      "Engagement rings and pieces using a stone you provide.",
      "Verlobungsringe und Stücke mit von Ihnen gestelltem Stein."
    ),
    description: L(
      "To jest ta część naszej pracy, której nie da się zamknąć w kalkulatorze, i dobrze. Pierścionek zaręczynowy albo wyrób z kamieniem po babci to rozmowa, nie formularz.\n\nZaczynamy od tego, co ma powstać i z jakim kamieniem. Możesz kupić kamień u nas albo powierzyć własny, także z rozbieranego starego wyrobu. Potem przygotowujemy projekt CAD z wizualizacją, żebyś zobaczył efekt przed wykonaniem, a nie po.\n\nOsadzanie kamieni to najbardziej pracochłonna część i to ona decyduje o cenie. Kamień w oprawie krapowej osadza się inaczej niż w bezel, a mikropavé z kilkudziesięcioma kamieniami to praca na wiele godzin pod mikroskopem.",
      "This is the part of our work that cannot be reduced to a calculator, and that is as it should be. An engagement ring, or a piece built around a stone from your grandmother, is a conversation, not a form.\n\nWe start from what you want made and with which stone. You can buy the stone from us or entrust us with your own, including one taken from an old piece. We then prepare a CAD design with a preview, so you see the result before it is made rather than after.\n\nStone setting is the most labour-intensive part and it drives the price. A stone in a prong setting is set differently from a bezel, and micro-pavé with dozens of stones means many hours under a microscope.",
      "Das ist der Teil unserer Arbeit, der sich nicht in einen Kalkulator pressen lässt, und das ist gut so. Ein Verlobungsring oder ein Stück um den Stein der Großmutter herum ist ein Gespräch, kein Formular.\n\nWir beginnen damit, was entstehen soll und mit welchem Stein. Sie können den Stein bei uns kaufen oder Ihren eigenen anvertrauen, auch aus einem alten Stück. Danach erstellen wir einen CAD-Entwurf mit Vorschau, damit Sie das Ergebnis vor und nicht nach der Fertigung sehen.\n\nDas Fassen ist der aufwendigste Teil und bestimmt den Preis. Ein Stein in Krappenfassung wird anders gefasst als in einer Zarge, und Mikro-Pavé mit Dutzenden Steinen bedeutet viele Stunden unter dem Mikroskop."
    ),
    process: [
      { title: L("Rozmowa o pomyśle", "A conversation about the idea", "Gespräch über die Idee"),
        body: L("Co ma powstać, dla kogo, na kiedy i w jakim budżecie.", "What is to be made, for whom, by when and within what budget.", "Was entstehen soll, für wen, bis wann und in welchem Budget.") },
      { title: L("Kamień", "The stone", "Der Stein"),
        body: L("Dobieramy nowy albo oceniamy Twój, także z rozbieranego wyrobu.", "We source a new one or assess yours, including from a piece being taken apart.", "Wir beschaffen einen neuen oder beurteilen Ihren, auch aus einem zerlegten Stück.") },
      { title: L("Projekt CAD i wizualizacja", "CAD design and preview", "CAD-Entwurf und Vorschau"),
        body: L("Zobaczysz wyrób przed wykonaniem i możesz poprosić o poprawki.", "You see the piece before it is made and can ask for changes.", "Sie sehen das Stück vor der Fertigung und können Änderungen wünschen.") },
      { title: L("Odlew i osadzenie", "Casting and setting", "Guss und Fassen"),
        body: L("Wykonanie, osadzenie kamieni pod mikroskopem i wykończenie.", "Making, setting the stones under a microscope, and finishing.", "Fertigung, Fassen unter dem Mikroskop und Finish.") },
    ],
    specs: [
      { label: L("Kamienie", "Stones", "Steine"), value: L("Diamenty, moissanity, kamienie naturalne", "Diamonds, moissanites, natural stones", "Diamanten, Moissanite, Natursteine") },
      { label: L("Kamień powierzony", "Your own stone", "Eigener Stein"), value: L("Tak, także ze starego wyrobu", "Yes, including from an old piece", "Ja, auch aus einem alten Stück") },
      { label: L("Projekt", "Design", "Entwurf"), value: L("CAD z wizualizacją przed wykonaniem", "CAD with a preview before making", "CAD mit Vorschau vor der Fertigung") },
      { label: L("Czas realizacji", "Lead time", "Bearbeitungszeit"), value: L("Zwykle 3 do 4 tygodni", "Usually 3 to 4 weeks", "Meist 3 bis 4 Wochen") },
    ],
    bullets: [
      L("Diamenty, moissanity, kamienie naturalne", "Diamonds, moissanites, natural stones", "Diamanten, Moissanite, Natursteine"),
      L("Możesz powierzyć własny kamień", "You can entrust us with your own stone", "Sie können uns Ihren eigenen Stein anvertrauen"),
      L("Projekt CAD z wizualizacją przed wykonaniem", "CAD design with a preview before making", "CAD-Entwurf mit Vorschau vor der Fertigung"),
    ],
    why: L(
      "Cena zależy od kamienia, rodzaju oprawy i pracochłonności osadzenia, dlatego wyceniamy indywidualnie, zwykle w ciągu 24 godzin.",
      "The price depends on the stone, the type of setting and the labour involved, so we quote individually, usually within 24 hours.",
      "Der Preis hängt vom Stein, der Fassungsart und dem Aufwand ab, daher kalkulieren wir individuell, meist innerhalb von 24 Stunden."
    ),
  },
  {
    id: "jewelry_chain_custom",
    calcHref: "/jewelry/?service=new&type=necklace#calculator",
    quoteOnly: true,
    category: "jewelry",
    image: "/img/shop/service/jewelry_chain_custom.webp",
    imagePrompt:
      "Jeweler assembling a byzantine chain link by link with two pliers, silver rings catching the light, extreme macro of hands and links, warm amber light from upper left, black background, premium product photography",
    leadTimeDays: 14,
    title: L("Łańcuszki i naszyjniki", "Chains and necklaces", "Ketten und Halsketten"),
    lead: L(
      "Trzynaście splotów, dowolna długość i grubość.",
      "Thirteen weaves, any length and thickness.",
      "Dreizehn Geflechte, beliebige Länge und Stärke."
    ),
    description: L(
      "Łańcuszek to wyrób, w którym masa kruszcu rośnie szybciej, niż podpowiada intuicja. Podwojenie grubości drutu przy tej samej długości oznacza mniej więcej czterokrotnie więcej metalu, a więc czterokrotnie wyższy koszt materiału.\n\nSplot decyduje o tym samym: pancerka zużywa inaczej metal niż bizantyjski o tej samej szerokości, bo inaczej upakowane są ogniwa. Dlatego zamiast podawać cennik, liczymy masę dla konkretnej konfiguracji.\n\nMożesz też powierzyć nam własny kruszec, na przykład ze starych, zerwanych łańcuszków. Wtedy płacisz wyłącznie za pracę, a metal odzyskujemy z tego, co przyniesiesz.",
      "A chain is a piece where the mass of metal grows faster than intuition suggests. Doubling the wire thickness at the same length means roughly four times more metal, and so four times the material cost.\n\nThe weave decides the same thing: a curb chain uses metal differently from a byzantine one of the same width, because the links pack differently. So instead of publishing a price list, we compute the mass for the specific configuration.\n\nYou can also entrust us with your own metal, for example from old broken chains. Then you pay only for the labour and we recover the metal from what you bring.",
      "Eine Kette ist ein Stück, bei dem die Metallmasse schneller wächst, als die Intuition vermuten lässt. Die doppelte Drahtstärke bei gleicher Länge bedeutet etwa die vierfache Metallmenge und damit die vierfachen Materialkosten.\n\nDas Geflecht entscheidet dasselbe: Eine Panzerkette verbraucht Metall anders als eine byzantinische gleicher Breite, weil die Glieder anders gepackt sind. Statt einer Preisliste berechnen wir daher die Masse für die konkrete Konfiguration.\n\nSie können uns auch eigenes Metall anvertrauen, etwa aus alten, gerissenen Ketten. Dann zahlen Sie nur die Arbeit."
    ),
    process: [
      { title: L("Wybór splotu i wymiarów", "Choosing weave and dimensions", "Wahl von Geflecht und Maßen"),
        body: L("Splot, długość, szerokość i rodzaj zapięcia.", "Weave, length, width and type of clasp.", "Geflecht, Länge, Breite und Verschlussart.") },
      { title: L("Wyliczenie masy i wycena", "Mass calculation and quote", "Massenberechnung und Angebot"),
        body: L("Liczymy masę z fizyki splotu, nie z tabeli.", "We compute the mass from the physics of the weave, not from a table.", "Wir berechnen die Masse aus der Physik des Geflechts, nicht aus einer Tabelle.") },
      { title: L("Wykonanie ogniwo po ogniwie", "Making it link by link", "Fertigung Glied für Glied"),
        body: L("Sploty ręczne powstają ogniwo po ogniwie, stąd czas realizacji.", "Hand weaves are built link by link, hence the lead time.", "Handgeflechte entstehen Glied für Glied, daher die Fertigungszeit.") },
    ],
    specs: [
      { label: L("Sploty", "Weaves", "Geflechte"), value: L("13 rodzajów, od klasycznego po bizantyjski", "13 types, from classic to byzantine", "13 Arten, von klassisch bis byzantinisch") },
      { label: L("Kruszce", "Metals", "Metalle"), value: L("Srebro, złoto", "Silver, gold", "Silber, Gold") },
      { label: L("Twój kruszec", "Your own metal", "Ihr Metall"), value: L("Tak, płacisz wtedy za samą pracę", "Yes, you then pay for labour only", "Ja, Sie zahlen dann nur die Arbeit") },
      { label: L("Zapięcia", "Clasps", "Verschlüsse"), value: L("Sprężynowe, karabińczyki, box, toggle", "Spring rings, lobster, box, toggle", "Federringe, Karabiner, Box, Knebel") },
    ],
    bullets: [
      L("Sploty od klasycznego po bizantyjski", "Weaves from classic to byzantine", "Geflechte von klassisch bis byzantinisch"),
      L("Wykonanie z Twojego kruszcu również możliwe", "Can also be made from metal you supply", "Auch aus Ihrem eigenen Metall möglich"),
      L("Masę liczymy z fizyki splotu, nie z tabeli", "Mass computed from the physics of the weave", "Masse aus der Physik des Geflechts berechnet"),
    ],
    why: L(
      "Masa łańcuszka zależy od splotu, długości i grubości drutu, a kruszec wyceniamy po kursie z dnia wykonania.",
      "The mass of a chain depends on the weave, length and wire thickness, and the metal is priced at the rate on the day of making.",
      "Die Masse einer Kette hängt von Geflecht, Länge und Drahtstärke ab, das Metall wird zum Kurs am Fertigungstag berechnet."
    ),
  },
  {
    id: "cad_project",
    priceFromGrosze: 50000,
    service: "cad_design",
    category: "studio",
    image: "/img/shop/service/cad_project.webp",
    imagePrompt:
      "Computer screen showing a 3D CAD model being sculpted, wireframe and solid views side by side, designer's hand on a mouse, dark studio, cool blue screen glow, premium product photography",
    leadTimeDays: 7,
    title: L("Projekt CAD i modelowanie 3D", "CAD design and 3D modelling", "CAD-Entwurf und 3D-Modellierung"),
    lead: L(
      "Nie masz pliku? Zaprojektujemy od zera.",
      "No file yet? We will design it from scratch.",
      "Noch keine Datei? Wir entwerfen von Grund auf."
    ),
    description: L(
      "Większość osób, które trafiają do nas z pomysłem, nie ma pliku. Mają zdjęcie, szkic na serwetce albo zepsutą część, której nikt już nie produkuje. Od tego zaczynamy.\n\nModel przekazujemy w dwóch formatach: STL do druku oraz STEP, czyli postać parametryczną, którą da się dalej edytować w dowolnym programie CAD. To istotne, bo sam STL jest siatką i późniejsza zmiana wymiaru oznacza modelowanie od nowa.\n\nPrawa do wyniku przechodzą na Ciebie bez ograniczeń. Możesz go drukować gdzie indziej, sprzedawać albo zlecić produkcję komu chcesz. Nie zatrzymujemy plików klientów jako zakładnika kolejnych zamówień.",
      "Most people who come to us with an idea do not have a file. They have a photo, a sketch on a napkin, or a broken part nobody makes any more. That is where we start.\n\nWe hand over the model in two formats: STL for printing and STEP, the parametric form that can be edited further in any CAD program. This matters, because an STL on its own is a mesh, and changing a dimension later means modelling it again.\n\nRights to the result pass to you without restriction. You can print it elsewhere, sell it or have it produced by anyone you like. We do not hold customer files hostage to future orders.",
      "Die meisten, die mit einer Idee zu uns kommen, haben keine Datei. Sie haben ein Foto, eine Skizze auf einer Serviette oder ein defektes Teil, das niemand mehr herstellt. Dort beginnen wir.\n\nWir übergeben das Modell in zwei Formaten: STL zum Drucken und STEP, die parametrische Form, die sich in jedem CAD-Programm weiterbearbeiten lässt. Das ist wichtig, denn eine STL allein ist ein Netz, und eine spätere Maßänderung bedeutet erneutes Modellieren.\n\nDie Rechte am Ergebnis gehen uneingeschränkt an Sie über. Wir halten Kundendateien nicht als Pfand für Folgeaufträge zurück."
    ),
    process: [
      { title: L("Rozmowa i materiały", "Conversation and materials", "Gespräch und Unterlagen"),
        body: L("Zdjęcia, wymiary, szkic albo sam przedmiot do obmiarowania.", "Photos, dimensions, a sketch or the object itself to measure.", "Fotos, Maße, eine Skizze oder das Objekt selbst zum Vermessen.") },
      { title: L("Model wstępny", "First model", "Erstes Modell"),
        body: L("Pokazujemy bryłę do akceptacji, zanim dopracujemy detale.", "We show the shape for approval before refining the details.", "Wir zeigen die Form zur Freigabe, bevor wir Details ausarbeiten.") },
      { title: L("Iteracje", "Iterations", "Iterationen"),
        body: L("Poprawki aż do wersji, którą zatwierdzasz.", "Revisions until the version you approve.", "Überarbeitungen bis zur von Ihnen freigegebenen Fassung.") },
      { title: L("Przekazanie plików", "File handover", "Dateiübergabe"),
        body: L("STL i STEP, prawa bez ograniczeń po Twojej stronie.", "STL and STEP, unrestricted rights on your side.", "STL und STEP, uneingeschränkte Rechte auf Ihrer Seite.") },
    ],
    specs: [
      { label: L("Formaty wyjściowe", "Output formats", "Ausgabeformate"), value: "STL + STEP" },
      { label: L("Wejście", "Input", "Eingabe"), value: L("Zdjęcie, szkic, wymiary albo przedmiot", "Photo, sketch, dimensions or the object", "Foto, Skizze, Maße oder das Objekt") },
      { label: L("Prawa", "Rights", "Rechte"), value: L("Przechodzą na klienta bez ograniczeń", "Pass to the customer without restriction", "Gehen uneingeschränkt an den Kunden über") },
      { label: L("Iteracje", "Iterations", "Iterationen"), value: L("Do akceptacji, ustalane przy wycenie", "Until approval, agreed when quoting", "Bis zur Freigabe, bei der Kalkulation vereinbart") },
    ],
    bullets: [
      L("Od szkicu, zdjęcia albo opisu do gotowego modelu", "From a sketch, photo or description to a finished model", "Von Skizze, Foto oder Beschreibung zum fertigen Modell"),
      L("Model w STL i STEP, edytowalny dalej", "Model as STL and STEP, editable further", "Modell als STL und STEP, weiter bearbeitbar"),
      L("Prawa do wyniku bez ograniczeń po Twojej stronie", "Unrestricted rights to the result on your side", "Uneingeschränkte Rechte am Ergebnis bei Ihnen"),
    ],
    why: L(
      "Wycena zależy od złożoności bryły i liczby iteracji, dlatego zaczynamy od rozmowy o tym, co ma powstać.",
      "The quote depends on the complexity of the shape and the number of iterations, so we start with a conversation about what you need.",
      "Das Angebot hängt von der Komplexität und der Zahl der Iterationen ab, daher beginnen wir mit einem Gespräch."
    ),
  },
];

export function getServiceCard(id) {
  return SERVICES_FULL.find((s) => s.id === id) || null;
}

export function serviceCardsByCategory(category) {
  return SERVICES_FULL.filter((s) => s.category === category);
}
