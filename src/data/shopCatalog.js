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

/**
 * Produkty gotowe. Wpisy ponizej sa przykladowe, przygotowane pod przyszly
 * asortyment, i **nie sa wystawione na sprzedaz**: sklep pokazywalby wtedy
 * rzeczy, ktorych nie mamy na polce, a zamowienie ich skonczyloby sie
 * tlumaczeniem klientowi, ze to bylo tylko na probe.
 *
 * Zeby wystawic asortyment, ustaw `draft: false` przy gotowych pozycjach.
 */
export const PRODUCTS_DRAFT = [
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

// Karty uslug mieszkaja w serviceCatalog.js, bo maja wlasne strony
// szczegolowe i tyle samo tresci co produkty.
export { SERVICES_FULL as SERVICE_CARDS, getServiceCard, serviceCardsByCategory } from "./serviceCatalog.js";

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

/** Wystawiamy wylacznie to, co naprawde da sie kupic */
export const PRODUCTS = PRODUCTS_DRAFT.filter((p) => p.draft === false);

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

export function productsByCategory(category) {
  return PRODUCTS.filter((p) => p.category === category);
}
