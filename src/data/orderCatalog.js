// ============================================================
// KATALOG KREATORA ZAMOWIEN
// ============================================================
// Opisuje, o co pytamy klienta dla kazdej uslugi. Opcje pochodza
// wprost z rdzenia cenowego, wiec kreator nigdy nie zaproponuje
// wyboru, ktorego kalkulator nie zna.

import { QUANTITY_TIERS } from "../pricing/config.js";
import {
  APPLICATIONS, LAYER_HEIGHTS, MSLA_SIZES, SIZES, INFILL_OPTIONS, COLORS, PRECISION, FILAMENTS,
} from "../pricing/print3d.js";
import { RESIN_TYPES } from "../data/resins.js";
import {
  QTY_TIERS, GENERIC_TYPES, RENOVATION_METALS, REPAIR_METALS, RENOVATION_SERVICES, REPAIR_SERVICES,
  SHAPE_COMPLEXITY,
  PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING, ENGRAVING_OPTIONS,
} from "../pricing/jewelryConfig.js";
import {
  ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY,
} from "../pricing/laserCo2.js";
import { MATERIALS as FIBER_MATERIALS, LENSES, MARK_TYPES, AREAS as FIBER_AREAS } from "../pricing/laserFiber.js";
import { RESINS, VOLUMES, MOLD_TYPES, INCLUSIONS, FINISH_OPTIONS } from "../pricing/epoxy.js";
import { CAD_COMPLEXITY, CAD_DELIVERABLES, CAD_REVISIONS } from "../pricing/cadDesign.js";

const L = (pl, en, de) => ({ pl, en, de });

/** Opcje materialu FDM zaleza od wybranego segmentu */
function filamentOptions(segment) {
  const seg = FILAMENTS[segment] || FILAMENTS.standard;
  return Object.keys(seg.materials).map((key) => ({ id: key, label: key }));
}

/** Do wzorcow odlewniczych dopuszczamy wylacznie zywice odlewnicze */
function resinOptions(applicationId) {
  const list = applicationId === "casting"
    ? RESIN_TYPES.filter((r) => r.id.startsWith("castable"))
    : RESIN_TYPES;
  return list.map((r) => ({ id: r.id, label: r.label || r.name || r.id }));
}

export const GROUPS = [
  { id: "print", label: L("Druk 3D", "3D printing", "3D-Druck"), theme: "blue" },
  { id: "jewelry", label: L("Biżuteria", "Jewelry", "Schmuck"), theme: "amber" },
  { id: "laser", label: L("Laser", "Laser", "Laser"), theme: "blue" },
  { id: "cast", label: L("Odlewy", "Casting", "Guss"), theme: "blue" },
];

/**
 * Uslugi wyceniane automatycznie, czyli takie, w ktorych klient placi od razu.
 * Wszystko, czego tu nie ma, idzie sciezka wyceny indywidualnej.
 */
export const SERVICES = [
  {
    id: "print_fdm",
    calculator: "print3d_fdm",
    group: "print",
    title: L("Druk 3D z filamentu", "FDM 3D print", "FDM-3D-Druck"),
    desc: L(
      "Części funkcjonalne, obudowy, prototypy. Wgraj plik STL, cenę policzymy z jego geometrii.",
      "Functional parts, housings, prototypes. Upload an STL file and we price it from its geometry.",
      "Funktionsteile, Gehäuse, Prototypen. STL-Datei hochladen, Preis aus der Geometrie."
    ),
    acceptsFile: true,
    fields: [
      { key: "segment", label: L("Segment", "Segment", "Segment"), options: [
        { id: "standard", label: L("Standard (PLA, PETG, TPU)", "Standard (PLA, PETG, TPU)", "Standard (PLA, PETG, TPU)") },
        { id: "engineering", label: L("Inżynieryjny (PA-CF, PC, PPS)", "Engineering (PA-CF, PC, PPS)", "Technisch (PA-CF, PC, PPS)") },
      ] },
      { key: "materialKey", label: L("Materiał", "Material", "Material"), optionsFrom: (v) => filamentOptions(v.segment) },
      { key: "sizeId", label: L("Rozmiar", "Size", "Größe"), options: SIZES, hiddenWithFile: true },
      { key: "infillId", label: L("Wypełnienie", "Infill", "Füllung"), options: INFILL_OPTIONS },
      { key: "colorId", label: L("Liczba kolorów", "Colors", "Farben"), options: COLORS },
      { key: "precisionId", label: L("Precyzja", "Precision", "Präzision"), options: PRECISION },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { segment: "standard", materialKey: "PLA", sizeId: "S", infillId: "medium", colorId: 1, precisionId: "standard_04", quantityId: "proto" },
  },
  {
    id: "print_msla",
    calculator: "print3d_msla",
    group: "print",
    title: L("Druk żywiczny MSLA", "MSLA resin print", "MSLA-Harzdruck"),
    desc: L(
      "Mikrodetal 14 µm: figurki, miniatury, wzorce odlewnicze do biżuterii.",
      "14 µm micro-detail: figurines, miniatures, jewelry casting patterns.",
      "14-µm-Mikrodetail: Figuren, Miniaturen, Schmuck-Gussmodelle."
    ),
    acceptsFile: true,
    fields: [
      { key: "applicationId", label: L("Zastosowanie", "Application", "Anwendung"), options: APPLICATIONS },
      { key: "resinKey", label: L("Żywica", "Resin", "Harz"), optionsFrom: (v) => resinOptions(v.applicationId) },
      { key: "layerId", label: L("Wysokość warstwy", "Layer height", "Schichthöhe"), options: LAYER_HEIGHTS },
      { key: "sizeId", label: L("Rozmiar", "Size", "Größe"), options: MSLA_SIZES, hiddenWithFile: true },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { applicationId: "prototype", resinKey: "standard", layerId: "standard", sizeId: "S", quantityId: "proto" },
  },
  {
    id: "jewelry_renovation",
    requiresDescription: true,
    calculator: "jewelry_renovation",
    group: "jewelry",
    title: L("Renowacja biżuterii", "Jewelry renovation", "Schmuckaufarbeitung"),
    desc: L(
      "Czyszczenie, rodowanie, złocenie, kontrola osadzenia kamieni.",
      "Cleaning, rhodium plating, gold plating, stone setting check.",
      "Reinigung, Rhodinierung, Vergoldung, Fassungskontrolle."
    ),
    fields: [
      { key: "jewTypeId", label: L("Rodzaj", "Type", "Art"), options: GENERIC_TYPES },
      { key: "metalTypeId", label: L("Kruszec", "Metal", "Metall"), options: RENOVATION_METALS },
      { key: "services", label: L("Zakres usług", "Services", "Leistungen"), options: RENOVATION_SERVICES, multi: true },
      { key: "qtyId", label: L("Liczba sztuk", "Quantity", "Stückzahl"), options: QTY_TIERS },
    ],
    defaults: { jewTypeId: "ring_g", metalTypeId: "silver_g", services: ["clean"], qtyId: "1" },
  },
  {
    id: "jewelry_repair",
    requiresDescription: true,
    calculator: "jewelry_repair",
    group: "jewelry",
    title: L("Naprawa biżuterii", "Jewelry repair", "Schmuckreparatur"),
    desc: L(
      "Zmiana rozmiaru, naprawa krapów, wymiana zapięcia, lutowanie.",
      "Resizing, prong repair, clasp replacement, soldering.",
      "Weitenänderung, Krappenreparatur, Verschlusstausch, Löten."
    ),
    fields: [
      { key: "jewTypeId", label: L("Rodzaj", "Type", "Art"), options: GENERIC_TYPES },
      { key: "metalTypeId", label: L("Kruszec", "Metal", "Metall"), options: REPAIR_METALS },
      { key: "repairId", label: L("Rodzaj naprawy", "Repair type", "Reparaturart"), options: REPAIR_SERVICES },
      { key: "qtyId", label: L("Liczba sztuk", "Quantity", "Stückzahl"), options: QTY_TIERS },
    ],
    defaults: { jewTypeId: "ring_g", metalTypeId: "silver_g", repairId: "resize", qtyId: "1" },
  },
  {
    id: "jewelry_plain",
    requiresDescription: true,
    calculator: "jewelry_new",
    group: "jewelry",
    title: L("Biżuteria bez kamieni", "Jewelry without stones", "Schmuck ohne Steine"),
    desc: L(
      "Obrączki, sygnety, zawieszki z samego kruszcu. Wyroby z kamieniami wyceniamy indywidualnie.",
      "Wedding bands, signets, plain metal pendants. Pieces with stones are quoted individually.",
      "Trauringe, Siegelringe, Anhänger aus reinem Metall. Stücke mit Steinen individuell."
    ),
    fields: [
      { key: "lineId", label: L("Linia", "Line", "Linie"), options: PRODUCT_LINES },
      { key: "typeId", label: L("Rodzaj", "Type", "Art"), optionsFrom: (v) => JEWELRY_TYPES[v.lineId] || JEWELRY_TYPES.woman },
      { key: "metalId", label: L("Kruszec i próba", "Metal and purity", "Metall und Feingehalt"), options: METALS },
      { key: "weightId", label: L("Masywność", "Boldness", "Massivität"), options: WEIGHTS },
      { key: "methodId", label: L("Metoda", "Method", "Methode"), options: METHODS },
      { key: "platingId", label: L("Powłoka", "Plating", "Beschichtung"), options: PLATING },
      { key: "engravingId", label: L("Grawer", "Engraving", "Gravur"), options: ENGRAVING_OPTIONS },
      { key: "complexityId", label: L("Złożoność kształtu", "Shape complexity", "Formkomplexität"), options: SHAPE_COMPLEXITY },
      { key: "qtyId", label: L("Liczba sztuk", "Quantity", "Stückzahl"), options: QTY_TIERS },
    ],
    defaults: { lineId: "woman", typeId: "ring", metalId: "silver", weightId: "standard", methodId: "cast", platingId: "none", engravingId: "none", complexityId: "simple", qtyId: "1", gemId: "none", stoneCount: 0, certId: "none" },
    fixed: { gemId: "none", stoneCount: 0, certId: "none" },
  },
  {
    id: "laser_engrave",
    acceptsVector: true,
    requiresVector: true,
    calculator: "laser_co2_engrave",
    group: "laser",
    title: L("Grawer laserowy CO2", "CO2 laser engraving", "CO2-Lasergravur"),
    desc: L(
      "Drewno, sklejka, akryl, skóra, szkło. Pole robocze do 600 × 288 mm.",
      "Wood, plywood, acrylic, leather, glass. Work area up to 600 × 288 mm.",
      "Holz, Sperrholz, Acryl, Leder, Glas. Arbeitsfläche bis 600 × 288 mm."
    ),
    fields: [
      { key: "matId", label: L("Materiał", "Material", "Material"), options: ENGRAVE_MATERIALS },
      { key: "areaId", label: L("Pole grawerowania", "Engraving area", "Gravurfläche"), options: ENGRAVE_AREAS },
      { key: "detailId", label: L("Szczegółowość", "Detail", "Detailgrad"), options: ENGRAVE_DETAIL },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { matId: "wood", areaId: "S", detailId: "standard", quantityId: "proto", extended: false },
  },
  {
    id: "laser_cut",
    acceptsVector: true,
    requiresVector: true,
    calculator: "laser_co2_cut",
    group: "laser",
    title: L("Cięcie laserem CO2", "CO2 laser cutting", "CO2-Laserschnitt"),
    desc: L(
      "Sklejka, akryl, skóra, filc. Kształty z pliku wektorowego.",
      "Plywood, acrylic, leather, felt. Shapes from a vector file.",
      "Sperrholz, Acryl, Leder, Filz. Formen aus einer Vektordatei."
    ),
    fields: [
      { key: "matId", label: L("Materiał", "Material", "Material"), options: CUT_MATERIALS },
      { key: "pathId", label: L("Długość ścieżki", "Path length", "Pfadlänge"), options: CUT_PATHS },
      { key: "complexId", label: L("Złożoność", "Complexity", "Komplexität"), options: CUT_COMPLEXITY },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { matId: "ply3", pathId: "S", complexId: "moderate", quantityId: "proto", extended: false },
  },
  {
    id: "laser_fiber",
    acceptsVector: true,
    requiresVector: true,
    calculator: "laser_fiber",
    group: "laser",
    title: L("Znakowanie laserem fiber", "Fiber laser marking", "Faserlaser-Markierung"),
    desc: L(
      "Stal, aluminium, mosiądz, tytan, srebro. Trwałe znakowanie metalu.",
      "Steel, aluminium, brass, titanium, silver. Permanent metal marking.",
      "Stahl, Aluminium, Messing, Titan, Silber. Dauerhafte Metallmarkierung."
    ),
    fields: [
      { key: "matId", label: L("Metal", "Metal", "Metall"), options: FIBER_MATERIALS },
      { key: "lensId", label: L("Obiektyw", "Lens", "Objektiv"), options: LENSES },
      { key: "markId", label: L("Rodzaj znakowania", "Marking type", "Markierungsart"), options: MARK_TYPES },
      { key: "areaId", label: L("Pole", "Area", "Fläche"), options: FIBER_AREAS },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { matId: "stainless", lensId: "70mm", markId: "surface", areaId: "S", quantityId: "proto" },
  },
  {
    id: "epoxy",
    calculator: "epoxy",
    group: "cast",
    title: L("Odlew żywiczny", "Resin casting", "Harzguss"),
    desc: L(
      "Żywica UV i epoksydowa, barwienie, zatopienia, wykończenie.",
      "UV and epoxy resin, pigments, inclusions, finishing.",
      "UV- und Epoxidharz, Pigmente, Einschlüsse, Finish."
    ),
    fields: [
      { key: "resinId", label: L("Żywica", "Resin", "Harz"), options: RESINS },
      { key: "volumeId", label: L("Objętość", "Volume", "Volumen"), options: VOLUMES },
      { key: "moldId", label: L("Forma", "Mold", "Form"), options: MOLD_TYPES },
      { key: "inclusionId", label: L("Zatopienia", "Inclusions", "Einschlüsse"), options: INCLUSIONS },
      { key: "finishId", label: L("Wykończenie", "Finish", "Finish"), options: FINISH_OPTIONS },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { resinId: "uv", volumeId: "S", moldId: "existing", inclusionId: "none", finishId: "sanded", quantityId: "proto" },
  },
  {
    id: "cad_design",
    calculator: "cad_design",
    // Wynikiem sa pliki, wiec nie ma czego pakowac ani wysylac.
    digital: true,
    requiresDescription: true,
    acceptsVector: true,
    fields: [
      { key: "complexityId", label: L("Złożoność projektu", "Design complexity", "Komplexität"), options: CAD_COMPLEXITY },
      { key: "deliverablesId", label: L("Zakres plików", "Deliverables", "Dateiumfang"), options: CAD_DELIVERABLES },
      { key: "revisionsId", label: L("Rundy poprawek", "Revision rounds", "Korrekturrunden"), options: CAD_REVISIONS },
    ],
    defaults: { complexityId: "simple", deliverablesId: "stl", revisionsId: "2" },
  },
];

export function getService(id) {
  return SERVICES.find((s) => s.id === id) || null;
}

/** Metody dostawy, koszt w groszach */
export const DELIVERY_METHODS = [
  { id: "pickup", grosze: 0, label: L("Odbiór osobisty", "Personal pickup", "Selbstabholung"),
    note: L("Józefosław, gmina Piaseczno, po wcześniejszym uzgodnieniu", "Józefosław near Warsaw, by prior arrangement", "Józefosław bei Warschau, nach Absprache") },
  { id: "inpost_locker", grosze: 1649, label: L("Paczkomat InPost", "InPost locker", "InPost-Paketstation"),
    note: L("2 dni robocze", "2 business days", "2 Werktage") },
  { id: "courier", grosze: 1949, label: L("Kurier", "Courier", "Kurier"),
    note: L("1 dzień roboczy", "1 business day", "1 Werktag") },
];
