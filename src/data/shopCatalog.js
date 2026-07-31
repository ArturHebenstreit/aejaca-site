// ============================================================
// KATALOG SKLEPU, dane przykladowe do przegladu wizualnego
// ============================================================
// Ksztalt obiektu produktu odpowiada tabeli `products` w bazie, zeby
// przejscie na dane z bazy bylo podmiana zrodla, a nie przepisywaniem
// komponentow. Docelowo te trzy pozycje zastapi import z Etsy.
//
// Zdjecia pochodza z portfolio, wiec to prawdziwe prace AEJaCA, a nie atrapy.
// Przy imporcie z Etsy podmienimy je na zdjecia produktowe z listingow.

const L = (pl, en, de) => ({ pl, en, de });

/**
 * Rezim odstapienia decyduje o tresci zgod w koszyku:
 *  standard      rzecz gotowa, pelne 14 dni
 *  made_to_order rzecz na zamowienie, art. 38 pkt 3 UPK
 *  digital       tresc cyfrowa, art. 38 pkt 13 UPK
 */
export const WITHDRAWAL = {
  STANDARD: "standard",
  MADE_TO_ORDER: "made_to_order",
  DIGITAL: "digital",
};

export const PRODUCTS = [
  {
    slug: "pierscionek-granat-zloto-585",
    category: "jewelry",
    kind: "physical",
    withdrawal: WITHDRAWAL.STANDARD,
    title: L(
      "Pierścionek z granatem, złoto 585",
      "Garnet ring, 14K gold",
      "Granatring, 585er Gold"
    ),
    short: L(
      "Odlewany ręcznie, naturalny granat w oprawie krapowej.",
      "Hand-cast, natural garnet in a prong setting.",
      "Handgegossen, natürlicher Granat in Krappenfassung."
    ),
    description: L(
      "Pierścionek wykonany metodą odlewu na wosk tracony, z modelu przygotowanego w CAD i wydrukowanego w żywicy odlewniczej. Kamień to naturalny granat almandyn o średnicy 6 mm, osadzony w czterokrapowej oprawie, która pozostawia go widocznym z boku i przepuszcza światło.\n\nPowierzchnia polerowana lustrzanie, wnętrze obrączki wygładzone i zaokrąglone, żeby nie zaczepiało o skórę. Każdy egzemplarz powstaje osobno, więc drobne różnice w rysunku kamienia są naturalne.",
      "Cast using the lost-wax method from a CAD model printed in castable resin. The stone is a natural almandine garnet, 6 mm across, held in a four-prong setting that leaves it visible from the side and lets light through.\n\nMirror-polished surface, with the inside of the band smoothed and rounded so it does not catch on the skin. Each piece is made individually, so slight differences in the stone are natural.",
      "Im Wachsausschmelzverfahren gegossen, aus einem CAD-Modell in Gießharz gedruckt. Der Stein ist ein natürlicher Almandin-Granat mit 6 mm Durchmesser in einer Vierkrappenfassung, die ihn seitlich sichtbar lässt und Licht durchlässt.\n\nSpiegelpolierte Oberfläche, die Ringinnenseite geglättet und gerundet. Jedes Stück entsteht einzeln, kleine Unterschiede im Stein sind natürlich."
    ),
    images: ["/img/portfolio/jewelry-web/garnet-ring-585-v2.webp"],
    priceGrosze: 129000,
    stock: 1,
    weightG: 25,
    leadTimeDays: 3,
    specs: [
      { label: L("Kruszec", "Metal", "Metall"), value: L("Złoto 585 (14K)", "14K gold (585)", "585er Gold (14K)") },
      { label: L("Kamień", "Stone", "Stein"), value: L("Granat almandyn, 6 mm", "Almandine garnet, 6 mm", "Almandin-Granat, 6 mm") },
      { label: L("Oprawa", "Setting", "Fassung"), value: L("Czterokrapowa", "Four-prong", "Vierkrappen") },
      { label: L("Rozmiar", "Size", "Größe"), value: L("14, możliwa zmiana", "14, resizing available", "14, Änderung möglich") },
    ],
    note: L(
      "Zmiana rozmiaru w zakresie dwóch numerów jest bezpłatna, napisz przed wysyłką.",
      "Resizing within two sizes is free, write to us before shipping.",
      "Größenänderung um bis zu zwei Nummern ist kostenlos, schreiben Sie uns vor dem Versand."
    ),
  },
  {
    slug: "wizytowka-stalowa-nfc",
    category: "studio",
    kind: "physical",
    withdrawal: WITHDRAWAL.STANDARD,
    title: L(
      "Wizytówka stalowa z NFC",
      "Steel business card with NFC",
      "Stahl-Visitenkarte mit NFC"
    ),
    short: L(
      "Stal nierdzewna, grawer laserem fiber, chip NFC w środku.",
      "Stainless steel, fiber laser engraving, NFC chip inside.",
      "Edelstahl, Faserlasergravur, NFC-Chip im Inneren."
    ),
    description: L(
      "Wizytówka z blachy nierdzewnej 0,5 mm, znakowana laserem fiber. Grawer jest trwały, bo powstaje przez zmianę struktury metalu, a nie przez farbę, więc nie ściera się w portfelu ani nie blaknie.\n\nW środku ukryty chip NFC: zbliżenie telefonu otwiera stronę, wizytówkę kontaktową albo profil, który wskażesz. Treść pod tagiem można zmienić w każdej chwili bez wymiany karty.\n\nTa pozycja to egzemplarz pokazowy z gotowym projektem. Wizytówki z Twoimi danymi zamawiasz przez kartę usługi znakowania laserem fiber.",
      "Business card made from 0.5 mm stainless steel, marked with a fiber laser. The engraving is permanent because it changes the structure of the metal rather than sitting on top as paint, so it does not rub off in a wallet or fade.\n\nAn NFC chip is hidden inside: tapping a phone opens a website, a contact card or any profile you point it to. The content behind the tag can be changed at any time without replacing the card.\n\nThis listing is a demonstration piece with a ready design. Cards with your own details are ordered through the fiber laser marking service.",
      "Visitenkarte aus 0,5 mm Edelstahl, mit Faserlaser markiert. Die Gravur ist dauerhaft, da sie die Struktur des Metalls verändert und nicht wie Farbe aufliegt, sie reibt sich also nicht ab und verblasst nicht.\n\nIm Inneren verbirgt sich ein NFC-Chip: Antippen mit dem Telefon öffnet eine Website, eine Kontaktkarte oder ein Profil Ihrer Wahl. Der Inhalt lässt sich jederzeit ändern, ohne die Karte zu tauschen.\n\nDiese Position ist ein Vorführstück mit fertigem Design. Karten mit Ihren Daten bestellen Sie über die Leistung Faserlaser-Markierung."
    ),
    images: ["/img/portfolio/studio-web/steel-business-card.webp"],
    priceGrosze: 8900,
    stock: 12,
    weightG: 15,
    leadTimeDays: 2,
    specs: [
      { label: L("Materiał", "Material", "Material"), value: L("Stal nierdzewna 0,5 mm", "Stainless steel 0.5 mm", "Edelstahl 0,5 mm") },
      { label: L("Znakowanie", "Marking", "Markierung"), value: L("Laser fiber", "Fiber laser", "Faserlaser") },
      { label: L("Chip", "Chip", "Chip"), value: L("NTAG213, 144 bajty", "NTAG213, 144 bytes", "NTAG213, 144 Byte") },
      { label: L("Wymiary", "Dimensions", "Abmessungen"), value: "85 × 54 mm" },
    ],
  },
  {
    slug: "model-stl-gekon-geometryczny",
    category: "studio",
    kind: "digital",
    withdrawal: WITHDRAWAL.DIGITAL,
    title: L(
      "Model STL: gekon geometryczny",
      "STL model: geometric gecko",
      "STL-Modell: geometrischer Gecko"
    ),
    short: L(
      "Plik do druku 3D, przygotowany pod FDM bez podpór.",
      "3D print file, prepared for FDM printing without supports.",
      "3D-Druckdatei, für FDM ohne Stützen vorbereitet."
    ),
    description: L(
      "Model gekona w stylistyce low poly, przygotowany tak, żeby drukował się bez podpór na zwykłej drukarce FDM. Ściany mają grubość dobraną pod dyszę 0,4 mm, a spód jest płaski, więc nie potrzeba tratwy.\n\nW paczce znajdziesz plik STL oraz gotowy profil cięcia dla PrusaSlicera i Bambu Studio. Model przetestowaliśmy na PLA i PETG.\n\nLicencja obejmuje użytek osobisty oraz druk na sprzedaż w liczbie do 50 egzemplarzy. Odsprzedaż samego pliku nie jest dozwolona.",
      "A low-poly gecko model prepared to print without supports on an ordinary FDM printer. Wall thickness is matched to a 0.4 mm nozzle and the base is flat, so no raft is needed.\n\nThe package contains the STL file plus ready slicing profiles for PrusaSlicer and Bambu Studio. The model has been tested in PLA and PETG.\n\nThe licence covers personal use and printing for sale up to 50 pieces. Reselling the file itself is not permitted.",
      "Low-Poly-Gecko, so vorbereitet, dass er ohne Stützen auf einem gewöhnlichen FDM-Drucker druckt. Die Wandstärke ist auf eine 0,4-mm-Düse abgestimmt, die Unterseite ist flach, ein Raft ist nicht nötig.\n\nDas Paket enthält die STL-Datei sowie fertige Slicing-Profile für PrusaSlicer und Bambu Studio. Getestet mit PLA und PETG.\n\nDie Lizenz umfasst den privaten Gebrauch und den Druck zum Verkauf bis 50 Stück. Der Weiterverkauf der Datei selbst ist nicht gestattet."
    ),
    images: ["/img/portfolio/studio-web/3d-gecko.webp"],
    priceGrosze: 2900,
    stock: null,
    weightG: 0,
    leadTimeDays: 0,
    fileSizeMb: 8.4,
    license: "commercial_50",
    specs: [
      { label: L("Format", "Format", "Format"), value: "STL + 3MF" },
      { label: L("Rozmiar pliku", "File size", "Dateigröße"), value: "8,4 MB" },
      { label: L("Podpory", "Supports", "Stützen"), value: L("Niepotrzebne", "Not needed", "Nicht erforderlich") },
      { label: L("Licencja", "Licence", "Lizenz"), value: L("Osobista i druk do 50 szt.", "Personal and printing up to 50 pcs", "Privat und Druck bis 50 Stk.") },
    ],
  },
];

/**
 * Karty uslug. `service` wskazuje pozycje z orderCatalog.js, ktora obsluguje
 * kreator. `quoteOnly` oznacza usluge, ktorej nie da sie wycenic automatycznie,
 * wiec zamiast koszyka pokazujemy przycisk wysylki do wyceny.
 */
export const SERVICE_CARDS = [
  {
    id: "print_fdm",
    service: "print_fdm",
    category: "studio",
    image: "/img/portfolio/studio-web/3d-organizer.webp",
    priceFromGrosze: 1200,
    title: L("Druk 3D z filamentu", "FDM 3D printing", "FDM-3D-Druck"),
    lead: L(
      "Wgraj plik STL, poznaj cenę od razu.",
      "Upload an STL file and see the price immediately.",
      "STL-Datei hochladen, Preis sofort sehen."
    ),
    bullets: [
      L("Bambu Lab H2D, pole 300 × 320 × 325 mm", "Bambu Lab H2D, 300 × 320 × 325 mm build", "Bambu Lab H2D, Bauraum 300 × 320 × 325 mm"),
      L("Ponad 20 filamentów, od PLA po PPS-CF", "Over 20 filaments, from PLA to PPS-CF", "Über 20 Filamente, von PLA bis PPS-CF"),
      L("Do 5 kolorów w jednym wydruku", "Up to 5 colors in a single print", "Bis zu 5 Farben in einem Druck"),
      L("Cena liczona z geometrii Twojego modelu", "Priced from your model geometry", "Preis aus der Geometrie Ihres Modells"),
    ],
  },
  {
    id: "print_msla",
    service: "print_msla",
    category: "studio",
    image: "/img/calc/3d_apps/casting.webp",
    priceFromGrosze: 4900,
    title: L("Druk żywiczny MSLA", "MSLA resin printing", "MSLA-Harzdruck"),
    lead: L(
      "Mikrodetal 14 µm: figurki, miniatury, wzorce odlewnicze.",
      "14 µm micro-detail: figurines, miniatures, casting patterns.",
      "14-µm-Mikrodetail: Figuren, Miniaturen, Gussmodelle."
    ),
    bullets: [
      L("Elegoo Saturn 4 Ultra 16K", "Elegoo Saturn 4 Ultra 16K", "Elegoo Saturn 4 Ultra 16K"),
      L("Warstwa 0,03 mm w trybie jakości", "0.03 mm layer in quality mode", "0,03 mm Schicht im Qualitätsmodus"),
      L("Żywice odlewnicze pod lost-resin", "Castable resins for lost-resin casting", "Gießharze für Lost-Resin-Guss"),
      L("Mycie i doświetlanie w cenie", "Washing and post-curing included", "Waschen und Nachhärten inklusive"),
    ],
  },
  {
    id: "laser_engrave",
    service: "laser_engrave",
    category: "studio",
    image: "/img/portfolio/studio-web/engraved-bottle.webp",
    priceFromGrosze: 1500,
    title: L("Grawer laserowy CO2", "CO2 laser engraving", "CO2-Lasergravur"),
    lead: L(
      "Drewno, sklejka, akryl, skóra, szkło.",
      "Wood, plywood, acrylic, leather, glass.",
      "Holz, Sperrholz, Acryl, Leder, Glas."
    ),
    bullets: [
      L("Pole robocze 600 × 288 mm, z podnośnikiem dłuższe", "600 × 288 mm work area, longer with a riser", "Arbeitsfläche 600 × 288 mm, mit Erhöhung länger"),
      L("Grawer fotograficzny i wektorowy", "Photographic and vector engraving", "Foto- und Vektorgravur"),
      L("Personalizacja pojedynczych sztuk i serii", "Personalisation of single pieces and series", "Personalisierung von Einzelstücken und Serien"),
    ],
  },
  {
    id: "laser_fiber",
    service: "laser_fiber",
    category: "studio",
    image: "/img/portfolio/studio-web/steel-business-card.webp",
    priceFromGrosze: 2000,
    title: L("Znakowanie laserem fiber", "Fiber laser marking", "Faserlaser-Markierung"),
    lead: L(
      "Trwałe znakowanie metalu, które się nie ściera.",
      "Permanent metal marking that does not rub off.",
      "Dauerhafte Metallmarkierung, die sich nicht abreibt."
    ),
    bullets: [
      L("Stal, aluminium, mosiądz, tytan, srebro, złoto", "Steel, aluminium, brass, titanium, silver, gold", "Stahl, Aluminium, Messing, Titan, Silber, Gold"),
      L("Znakowanie powierzchniowe, głębokie i barwne", "Surface, deep and color marking", "Oberflächen-, Tief- und Farbmarkierung"),
      L("Numery seryjne, kody, logo, personalizacja", "Serial numbers, codes, logos, personalisation", "Seriennummern, Codes, Logos, Personalisierung"),
    ],
  },
  {
    id: "epoxy",
    service: "epoxy",
    category: "studio",
    image: "/img/portfolio/studio-web/gift-box.webp",
    priceFromGrosze: 3900,
    title: L("Odlew żywiczny", "Resin casting", "Harzguss"),
    lead: L(
      "Żywica UV i epoksydowa, barwienia i zatopienia.",
      "UV and epoxy resin, pigments and inclusions.",
      "UV- und Epoxidharz, Pigmente und Einschlüsse."
    ),
    bullets: [
      L("Formy silikonowe z naszego katalogu lub Twoje", "Silicone molds from our catalogue or yours", "Silikonformen aus unserem Katalog oder Ihre"),
      L("Zatopienia: kwiaty, drobiazgi, elektronika LED", "Inclusions: flowers, keepsakes, LED electronics", "Einschlüsse: Blumen, Andenken, LED-Elektronik"),
      L("Wykończenie od surowego po polerowane", "Finish from raw to polished", "Finish von roh bis poliert"),
    ],
  },
  {
    id: "jewelry_renovation",
    service: "jewelry_renovation",
    category: "jewelry",
    image: "/img/portfolio/jewelry-web/filigree-cross.webp",
    priceFromGrosze: 4000,
    title: L("Renowacja biżuterii", "Jewelry renovation", "Schmuckaufarbeitung"),
    lead: L(
      "Przywracamy blask, nie zmieniając charakteru.",
      "We restore the shine without changing the character.",
      "Wir bringen den Glanz zurück, ohne den Charakter zu verändern."
    ),
    bullets: [
      L("Czyszczenie ultradźwiękowe i polerowanie", "Ultrasonic cleaning and polishing", "Ultraschallreinigung und Polieren"),
      L("Rodowanie białego złota, złocenie srebra", "Rhodium plating of white gold, gilding of silver", "Rhodinierung von Weißgold, Vergolden von Silber"),
      L("Kontrola osadzenia kamieni przed oddaniem", "Stone setting checked before handover", "Fassungskontrolle vor der Übergabe"),
    ],
  },
  {
    id: "jewelry_repair",
    service: "jewelry_repair",
    category: "jewelry",
    image: "/img/portfolio/jewelry-web/gold-band-585-v3.webp",
    priceFromGrosze: 6000,
    title: L("Naprawa biżuterii", "Jewelry repair", "Schmuckreparatur"),
    lead: L(
      "Zmiana rozmiaru, krapy, zapięcia, lutowanie.",
      "Resizing, prongs, clasps, soldering.",
      "Weitenänderung, Krappen, Verschlüsse, Löten."
    ),
    bullets: [
      L("Zmiana rozmiaru obrączek i pierścionków", "Resizing of bands and rings", "Weitenänderung von Ringen"),
      L("Odbudowa krapów i wymiana zapięć", "Prong rebuilding and clasp replacement", "Krappenaufbau und Verschlusstausch"),
      L("Lutowanie łańcuszków i naprawa pęknięć", "Chain soldering and crack repair", "Kettenlöten und Rissreparatur"),
    ],
  },
  {
    id: "jewelry_plain",
    service: "jewelry_plain",
    category: "jewelry",
    image: "/img/portfolio/jewelry-web/gold-cross.webp",
    priceFromGrosze: 25000,
    title: L("Biżuteria bez kamieni", "Jewelry without stones", "Schmuck ohne Steine"),
    lead: L(
      "Obrączki, sygnety, zawieszki z samego kruszcu.",
      "Bands, signet rings and pendants in plain metal.",
      "Ringe, Siegelringe und Anhänger aus reinem Metall."
    ),
    bullets: [
      L("Srebro 925, złoto 585 i 750, platyna", "925 silver, 585 and 750 gold, platinum", "925er Silber, 585er und 750er Gold, Platin"),
      L("Odlew albo wykonanie ręczne", "Casting or handmade", "Guss oder Handarbeit"),
      L("Grawer wewnętrzny i zewnętrzny", "Inside and outside engraving", "Innen- und Außengravur"),
      L("Cena liczona z aktualnego kursu kruszcu", "Priced from the current metal rate", "Preis nach aktuellem Metallkurs"),
    ],
  },
  // ---- Uslugi wymagajace rozmowy, bez ceny automatycznej ----
  {
    id: "jewelry_stones",
    quoteOnly: true,
    category: "jewelry",
    image: "/img/portfolio/jewelry-web/citrine-star-ring.webp",
    title: L("Biżuteria z kamieniami", "Jewelry with stones", "Schmuck mit Steinen"),
    lead: L(
      "Pierścionki zaręczynowe i wyroby z kamieniem powierzonym.",
      "Engagement rings and pieces using a stone you provide.",
      "Verlobungsringe und Stücke mit von Ihnen gestelltem Stein."
    ),
    bullets: [
      L("Diamenty, moissanity, kamienie naturalne", "Diamonds, moissanites, natural stones", "Diamanten, Moissanite, Natursteine"),
      L("Możesz powierzyć własny kamień", "You can entrust us with your own stone", "Sie können uns Ihren eigenen Stein anvertrauen"),
      L("Projekt CAD z wizualizacją przed wykonaniem", "CAD design with a preview before making", "CAD-Entwurf mit Vorschau vor der Fertigung"),
    ],
    why: L(
      "Cena zależy od kamienia, jego oprawy i pracochłonności osadzenia, dlatego wyceniamy indywidualnie, zwykle w ciągu 24 godzin.",
      "The price depends on the stone, its setting and the labour involved, so we quote individually, usually within 24 hours.",
      "Der Preis hängt vom Stein, seiner Fassung und dem Aufwand ab, daher kalkulieren wir individuell, meist innerhalb von 24 Stunden."
    ),
  },
  {
    id: "jewelry_chain_custom",
    quoteOnly: true,
    category: "jewelry",
    image: "/img/portfolio/jewelry-web/byzantine-chain.webp",
    title: L("Łańcuszki i naszyjniki", "Chains and necklaces", "Ketten und Halsketten"),
    lead: L(
      "Trzynaście splotów, dowolna długość i grubość.",
      "Thirteen weaves, any length and thickness.",
      "Dreizehn Geflechte, beliebige Länge und Stärke."
    ),
    bullets: [
      L("Sploty od klasycznego po bizantyjski", "Weaves from classic to byzantine", "Geflechte von klassisch bis byzantinisch"),
      L("Wykonanie z Twojego kruszcu również możliwe", "Can also be made from metal you supply", "Auch aus Ihrem eigenen Metall möglich"),
      L("Zapięcia sprężynowe, karabińczyki, toggle", "Spring rings, lobster clasps, toggles", "Federringe, Karabiner, Knebelverschlüsse"),
    ],
    why: L(
      "Masa łańcuszka zależy od splotu, długości i grubości drutu, a kruszec wyceniamy po kursie z dnia wykonania.",
      "The mass of a chain depends on the weave, length and wire thickness, and the metal is priced at the rate on the day of making.",
      "Die Masse einer Kette hängt von Geflecht, Länge und Drahtstärke ab, das Metall wird zum Kurs am Fertigungstag berechnet."
    ),
  },
  {
    id: "cad_project",
    quoteOnly: true,
    category: "studio",
    image: "/img/portfolio/studio-web/city-map.webp",
    title: L("Projekt CAD i modelowanie 3D", "CAD design and 3D modelling", "CAD-Entwurf und 3D-Modellierung"),
    lead: L(
      "Nie masz pliku? Zaprojektujemy od zera.",
      "No file yet? We will design it from scratch.",
      "Noch keine Datei? Wir entwerfen von Grund auf."
    ),
    bullets: [
      L("Od szkicu, zdjęcia albo opisu do gotowego modelu", "From a sketch, photo or description to a finished model", "Von Skizze, Foto oder Beschreibung zum fertigen Modell"),
      L("Model przekazujemy w STL i STEP", "Model handed over as STL and STEP", "Modell wird als STL und STEP übergeben"),
      L("Prawa do wykorzystania bez ograniczeń", "Unrestricted rights to use the result", "Uneingeschränkte Nutzungsrechte"),
    ],
    why: L(
      "Wycena zależy od złożoności bryły i liczby iteracji, dlatego zaczynamy od rozmowy o tym, co ma powstać.",
      "The quote depends on the complexity of the shape and the number of iterations, so we start with a conversation about what you need.",
      "Das Angebot hängt von der Komplexität und der Zahl der Iterationen ab, daher beginnen wir mit einem Gespräch."
    ),
  },
];

export const SHOP_CATEGORIES = [
  {
    id: "jewelry",
    path: "/shop/jewelry/",
    theme: "amber",
    title: L("AEJaCA Biżuteria", "AEJaCA Jewelry", "AEJaCA Schmuck"),
    lead: L(
      "Wyroby gotowe oraz usługi jubilerskie: renowacja, naprawa i biżuteria na zamówienie.",
      "Ready-made pieces and jewelry services: renovation, repair and made-to-order work.",
      "Fertige Stücke und Schmuckleistungen: Aufarbeitung, Reparatur und Anfertigung nach Maß."
    ),
  },
  {
    id: "studio",
    path: "/shop/studio/",
    theme: "blue",
    title: L("AEJaCA sTuDiO", "AEJaCA sTuDiO", "AEJaCA sTuDiO"),
    lead: L(
      "Druk 3D, grawer laserowy, odlewy żywiczne, produkty gotowe i modele do pobrania.",
      "3D printing, laser engraving, resin casting, ready-made products and downloadable models.",
      "3D-Druck, Lasergravur, Harzguss, fertige Produkte und Modelle zum Download."
    ),
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

export function productsByCategory(category) {
  return PRODUCTS.filter((p) => p.category === category);
}

export function serviceCardsByCategory(category) {
  return SERVICE_CARDS.filter((s) => s.category === category);
}
