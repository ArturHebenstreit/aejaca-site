// ============================================================
// KATALOG KREATORA ZAMOWIEN
// ============================================================
// Opisuje, o co pytamy klienta dla kazdej uslugi. Opcje pochodza
// wprost z rdzenia cenowego, wiec kreator nigdy nie zaproponuje
// wyboru, ktorego kalkulator nie zna.

import { QUANTITY_TIERS, CONFIG } from "../pricing/config.js";
import { SUBSTRATE_LABEL, SUBSTRATES } from "./laserSubstrate.js";
import {
  APPLICATIONS, LAYER_HEIGHTS, MSLA_SIZES, SIZES, INFILL_OPTIONS, COLORS, PRECISION, FILAMENTS,
  getAvailableResins,
} from "../pricing/print3d.js";
import { RESIN_TYPES, RESIN_SEGMENTS } from "../data/resins.js";
import {
  QTY_TIERS, GENERIC_TYPES, RENOVATION_METALS, REPAIR_METALS, RENOVATION_SERVICES, REPAIR_SERVICES,
  SHAPE_COMPLEXITY, isChainType,
  PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING, ENGRAVING_OPTIONS,
} from "../pricing/jewelryConfig.js";
import {
  ENGRAVE_MATERIALS, ENGRAVE_AREAS, ENGRAVE_DETAIL, CUT_MATERIALS, CUT_PATHS, CUT_COMPLEXITY,
} from "../pricing/laserCo2.js";
import { MATERIALS as FIBER_MATERIALS, LENSES, MARK_TYPES, areaOptionsForLens } from "../pricing/laserFiber.js";
import { RESINS, VOLUMES, MOLD_TYPES, INCLUSIONS, FINISH_OPTIONS } from "../pricing/epoxy.js";
import { CAD_COMPLEXITY, CAD_DELIVERABLES, CAD_REVISIONS } from "../pricing/cadDesign.js";
import {
  CASTING_VARIANTS, CASTING_MATERIAL_SOURCES, CASTING_METALS, CASTING_FINISHES,
  castingFinishesFor, CASTING_PLATINGS, castingPlatingAvailable,
  CASTING_ENGRAVINGS, castingEngravingAvailable,
} from "../pricing/preciousMetalCasting.js";

const L = (pl, en, de) => ({ pl, en, de });

/** Zdjecia segmentow zywicy. Naleza do pola, wiec ogladaja je obie drogi. */
const ZDJECIA_SEGMENTOW_ZYWIC = {
  standard: "/img/calc/3d_resins/standard.webp",
  technical: "/img/calc/3d_resins/technical.webp",
  precision: "/img/calc/3d_resins/high_precision.webp",
};

const SEGMENTY_ZYWIC = Object.entries(RESIN_SEGMENTS).map(([id, seg]) => ({
  id, label: seg.label, desc: seg.desc, img: ZDJECIA_SEGMENTOW_ZYWIC[id],
}));

/** Zdjecia filamentow. Naleza do pola, wiec ogladaja je obie drogi. */
const ZDJECIA_FILAMENTOW = {
  "PLA": "/img/calc/3d_filaments/pla.webp", "PLA Silk": "/img/calc/3d_filaments/pla_silk.webp",
  "PLA Matte": "/img/calc/3d_filaments/pla_matte.webp", "PLA Wood": "/img/calc/3d_filaments/pla_wood.webp",
  "PLA Marble": "/img/calc/3d_filaments/pla_marble.webp", "PETG": "/img/calc/3d_filaments/petg.webp",
  "PETG-CF": "/img/calc/3d_filaments/petg_cf.webp", "TPU 95A": "/img/calc/3d_filaments/tpu.webp",
  "PVA": "/img/calc/3d_filaments/pva.webp", "ASA": "/img/calc/3d_filaments/asa.webp",
  "ABS": "/img/calc/3d_filaments/abs.webp",
  "PA6-CF": "/img/calc/3d_filaments/pa6_cf.webp", "PA6-GF": "/img/calc/3d_filaments/pa6_gf.webp",
  "PA12-CF": "/img/calc/3d_filaments/pa12_cf.webp", "PPA-CF": "/img/calc/3d_filaments/ppa_cf.webp",
  "PPA-GF": "/img/calc/3d_filaments/ppa_gf.webp", "PC": "/img/calc/3d_filaments/pc.webp",
  "PC-ABS": "/img/calc/3d_filaments/pc_abs.webp", "PET-CF": "/img/calc/3d_filaments/pet_cf.webp",
  "PPS": "/img/calc/3d_filaments/pps.webp", "PPS-CF": "/img/calc/3d_filaments/pps_cf.webp",
};

/**
 * Opcje materialu FDM zaleza od wybranego segmentu.
 *
 * Kafelek niesie zdjecie i cene kilograma, bo material rozpoznaje sie po
 * fakturze i po tym, ile kosztuje. Karta uslugi w sklepie pokazywala do tej
 * pory sama nazwe, kalkulator zdjecie i cene: ten sam wybor, dwa rozne
 * poziomy wiedzy, zaleznie od tego, ktoredy klient wszedl.
 */
function filamentOptions(segment) {
  const seg = FILAMENTS[segment] || FILAMENTS.standard;
  return Object.entries(seg.materials).map(([key, v]) => ({
    id: key, label: key, sub: `${v.price_kg}zł`, img: ZDJECIA_FILAMENTOW[key],
  }));
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
      { key: "segment", label: L("Segment", "Segment", "Segment"),
        widok: "zdjecia", kolumny: "grid-cols-2", wysokosc: 170, options: [
          // Nazwa segmentu krotka, a lista materialow pod nia: na kafelku ze
          // zdjeciem opis jest osobnym wierszem, wiec nie musi sie miescic
          // w nawiasie przy nazwie.
          { id: "standard", label: L("Standard", "Standard", "Standard"),
            desc: L("PLA, PETG, TPU, ASA, ABS", "PLA, PETG, TPU, ASA, ABS", "PLA, PETG, TPU, ASA, ABS"),
            img: "/img/calc/3d_segments/standard.webp" },
          { id: "engineering", label: L("Inżynieryjny", "Engineering", "Technisch"),
            desc: L("PA-CF, PPA-CF, PC, PET-CF, PPS", "PA-CF, PPA-CF, PC, PET-CF, PPS", "PA-CF, PPA-CF, PC, PET-CF, PPS"),
            img: "/img/calc/3d_segments/engineering.webp" },
        ] },
      { key: "materialKey", label: L("Materiał", "Material", "Material"),
        optionsFrom: (v) => filamentOptions(v.segment), widok: "kafelki",
        kolumny: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" },
      { key: "sizeId", label: L("Rozmiar", "Size", "Größe"), options: SIZES, hiddenWithFile: true },
      { key: "infillId", label: L("Wypełnienie", "Infill", "Füllung"), options: INFILL_OPTIONS,
        widok: "zdjecia", kolumny: "grid-cols-2 sm:grid-cols-4" },
      { key: "colorId", label: L("Liczba kolorów", "Colors", "Farben"), options: COLORS },
      { key: "precisionId", label: L("Precyzja", "Precision", "Präzision"), options: PRECISION },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    // Wypelnienie startowe: "low". Katalog mial "medium", kalkulator "low",
    // wiec ta sama usluga zaczynala od dwoch roznych kwot, zaleznie od drzwi.
    defaults: { segment: "standard", materialKey: "PLA", sizeId: "S", infillId: "low", colorId: 1, precisionId: "standard_04", quantityId: "proto" },
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
      { key: "applicationId", label: L("Zastosowanie", "Application", "Anwendung"), options: APPLICATIONS,
        widok: "kafelki", kolumny: "grid-cols-3" },
      // SEGMENT ZWEZA LISTE ZYWIC. Trzynascie zywic w jednej siatce to sciana;
      // dwa kroki po cztery to rozmowa. Stalo to tylko w kalkulatorze, wiec
      // karta uslugi w sklepie wykladala wszystkie naraz. Wzorzec odlewniczy
      // wymaga segmentu precyzyjnego, wiec przy odlewie zostaje tylko on.
      { key: "resinSegmentId", label: L("Rodzaj żywicy", "Resin type", "Harzart"),
        widok: "zdjecia", kolumny: "grid-cols-3", wysokosc: 130,
        optionsFrom: (v) => SEGMENTY_ZYWIC.filter((x) => v.applicationId !== "casting" || x.id === "precision") },
      { key: "resinKey", label: L("Żywica", "Resin", "Harz"), widok: "opisowe",
        optionsFrom: (v) => getAvailableResins(v.resinSegmentId, v.applicationId) },
      { key: "layerId", label: L("Wysokość warstwy", "Layer height", "Schichthöhe"), options: LAYER_HEIGHTS },
      { key: "sizeId", label: L("Rozmiar", "Size", "Größe"), options: MSLA_SIZES, hiddenWithFile: true },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
    ],
    defaults: { applicationId: "prototype", resinSegmentId: "standard", resinKey: "standard", layerId: "standard", sizeId: "S", quantityId: "proto" },
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
      { key: "jewTypeId", label: L("Rodzaj", "Type", "Art"), options: GENERIC_TYPES,
        widok: "kafelki", kolumny: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" },
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
      { key: "jewTypeId", label: L("Rodzaj", "Type", "Art"), options: GENERIC_TYPES,
        widok: "kafelki", kolumny: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" },
      { key: "metalTypeId", label: L("Kruszec", "Metal", "Metall"), options: REPAIR_METALS },
      { key: "repairId", label: L("Rodzaj naprawy", "Repair type", "Reparaturart"), options: REPAIR_SERVICES },
      { key: "qtyId", label: L("Liczba sztuk", "Quantity", "Stückzahl"), options: QTY_TIERS },
    ],
    defaults: { jewTypeId: "ring_g", metalTypeId: "silver_g", repairId: "resize", qtyId: "1" },
  },
  {
    id: "precious_metal_casting",
    requiresDescription: true,
    acceptsFile: true,
    calculator: "jewelry_casting",
    group: "cast",
    title: L("Odlew z metalu szlachetnego", "Precious metal casting", "Edelmetallguss"),
    desc: L(
      "Wzorzec, model 3D albo pomysł. Odlewamy w srebrze i złocie.",
      "Pattern, 3D model or idea. Cast in silver and gold.",
      "Modell, 3D-Datei oder Idee. Guss in Silber und Gold."
    ),
    fields: [
      // ZDJECIE ZAMIAST TRZECH LINIJEK OPISU. Wzorzec, model i pomysl to trzy
      // rozne drogi wspolpracy, nie trzy warianty tego samego, wiec kafelek
      // pokazuje dokladnie to, co wariant obiecuje. Zdjecia stoja przy polu,
      // a nie przy ekranie, bo oba ekrany pytaja o to samo.
      { key: "variantId", label: L("Co nam przekazujesz", "What you provide", "Was Sie liefern"),
        options: CASTING_VARIANTS, widok: "zdjecia", obrazy: {
          ready_pattern: "/img/calc/3d_apps/casting.webp",
          model_3d: "/img/b2b/pillar_cad.webp",
          client_idea: "/img/shop/service/cad_project.webp",
        } },
      { key: "materialSourceId", label: L("Źródło kruszcu", "Metal source", "Metallquelle"), options: CASTING_MATERIAL_SOURCES },
      { key: "metalId", label: L("Kruszec i próba", "Metal and purity", "Metall und Feingehalt"), options: CASTING_METALS },
      // Lista poziomow zalezy od zrodla kruszcu: przy metalu AEJaCA nie wydajemy
      // odlewu z kanalami, bo ten metal wraca do przetopu (patrz komentarz przy
      // `castingFinishesFor`).
      { key: "finishId", label: L("Zakres wykończenia", "Finishing", "Finish"), optionsFrom: (v) => castingFinishesFor(v.materialSourceId) },
      // Powloka pojawia sie dopiero przy wykonczeniu jubilerskim, bo galwanika
      // odwzorowuje powierzchnie pod soba.
      { key: "platingId", label: L("Powłoka galwaniczna", "Galvanic plating", "Galvanische Beschichtung"),
        options: CASTING_PLATINGS, ukryjGdy: (v) => !castingPlatingAvailable(v.finishId),
        uwaga: L(
          "Powłokę kładziemy na wypolerowaną powierzchnię. Rod daje biel na srebrze i złocie, złocenie żółte albo różowe zmienia barwę wierzchu. Warstwa galwaniczna z czasem się ściera i odnawia się ją serwisowo.",
          "Plating goes on a polished surface. Rhodium gives a white finish on silver and gold; yellow or rose plating changes the surface colour. A galvanic layer wears with time and is renewed as a service.",
          "Die Beschichtung kommt auf eine polierte Oberfläche. Rhodium ergibt Weiß auf Silber und Gold, Gelb- oder Roségold ändert die Oberflächenfarbe. Eine galvanische Schicht nutzt sich mit der Zeit ab und wird im Service erneuert."
        ) },
      // GRAWER DOMAWIA SIE DO ODLEWU, tak samo jak powloka: grawerujemy po
      // wypolerowaniu, wiec przy niższych poziomach wykonczenia pytanie nie ma
      // sensu. Doplata z tej samej tabeli, ktora widzi klient w kalkulatorze
      // jubilerskim, w walucie jezyka.
      { key: "engravingId", label: L("Grawer", "Engraving", "Gravur"),
        options: CASTING_ENGRAVINGS, ukryjGdy: (v) => !castingEngravingAvailable(v.finishId),
        podpis: (o, lang) => (o.cost
          ? (lang === "pl" ? `+${o.cost} zł` : `+${Math.round(o.cost / CONFIG.EUR_PLN_RATE)} EUR`)
          : null),
        uwaga: L(
          "Grawer wykonujemy laserem na wypolerowanej powierzchni, po odlaniu i wykończeniu. Treść podajesz przy dodawaniu do koszyka. Jeśli zamawiasz też powłokę galwaniczną, grawer robimy przed nią, więc zostaje widoczny pod warstwą.",
          "We laser-engrave the polished surface after casting and finishing. You give us the text when adding to the cart. If you also order plating, the engraving goes on first, so it stays visible under the layer.",
          "Wir gravieren mit dem Laser auf der polierten Oberfläche, nach Guss und Finish. Den Text geben Sie beim Hinzufügen zum Warenkorb an. Bei zusätzlicher Beschichtung gravieren wir zuerst, damit die Gravur unter der Schicht sichtbar bleibt."
        ) },
      { key: "qtyId", label: L("Liczba sztuk", "Quantity", "Stückzahl"), options: QTY_TIERS },
    ],
    defaults: { variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver", finishId: "clean", platingId: "none", engravingId: "none", qtyId: "1" },
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
      { key: "lineId", label: L("Linia", "Line", "Linie"), options: PRODUCT_LINES,
        widok: "zdjecia", kolumny: "grid-cols-1 sm:grid-cols-3", wysokosc: 180 },
      { key: "typeId", label: L("Rodzaj", "Type", "Art"), widok: "kafelki",
        kolumny: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        optionsFrom: (v) => JEWELRY_TYPES[v.lineId] || JEWELRY_TYPES.woman },
      { key: "metalId", label: L("Kruszec i próba", "Metal and purity", "Metall und Feingehalt"), options: METALS,
        widok: "kafelki", kolumny: "grid-cols-3 sm:grid-cols-4" },
      // Lancuch nie ma masywnosci ani metody wykonania: liczy go `calcChain`
      // ze splotu, dlugosci i szerokosci. Pytanie o nie bylo pytaniem bez
      // wplywu na nic, a odpowiedz i tak konczyla sie brakiem ceny.
      { key: "weightId", label: L("Masywność", "Boldness", "Massivität"), options: WEIGHTS,
        widok: "zdjecia", kolumny: "grid-cols-2 sm:grid-cols-4", wysokosc: 130,
        ukryjGdy: (v) => isChainType(v.typeId) },
      { key: "methodId", label: L("Metoda", "Method", "Methode"), options: METHODS,
        widok: "zdjecia", kolumny: "grid-cols-1 sm:grid-cols-2", wysokosc: 150,
        ukryjGdy: (v) => isChainType(v.typeId) },
      { key: "platingId", label: L("Powłoka", "Plating", "Beschichtung"), options: PLATING,
        widok: "kafelki", kolumny: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5" },
      // Doplata za grawer stoi przy wariancie, bo to ona rozstrzyga wybor.
      // W walucie jezyka: polski czyta zlotowki, reszta euro.
      { key: "engravingId", label: L("Grawer", "Engraving", "Gravur"), options: ENGRAVING_OPTIONS,
        podpis: (o, lang) => (o.cost
          ? (lang === "pl" ? `+${o.cost} zł` : `+${Math.round(o.cost / CONFIG.EUR_PLN_RATE)} EUR`)
          : null) },
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
      { key: "matId", label: L("Materiał", "Material", "Material"), options: ENGRAVE_MATERIALS, widok: "kafelki" },
      { key: "areaId", label: L("Pole grawerowania", "Engraving area", "Gravurfläche"), options: ENGRAVE_AREAS },
      { key: "detailId", label: L("Szczegółowość", "Detail", "Detailgrad"), options: ENGRAVE_DETAIL,
        widok: "zdjecia", kolumny: "grid-cols-2 sm:grid-cols-4", wysokosc: 140 },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
      { key: "podloze", label: SUBSTRATE_LABEL, options: SUBSTRATES },
    ],
    defaults: { matId: "wood", areaId: "S", detailId: "standard", quantityId: "proto", podloze: "our_stock" },
  },
  {
    id: "laser_cut",
    acceptsVector: true,
    requiresVector: true,
    calculator: "laser_co2_cut",
    group: "laser",
    title: L("Cięcie laserem CO2", "CO2 laser cutting", "CO2-Laserschnitt"),
    desc: L(
      "Sklejka, lite drewno do 10 mm, akryl, skóra, filc. Kształty z pliku wektorowego.",
      "Plywood, solid wood up to 10 mm, acrylic, leather, felt. Shapes from a vector file.",
      "Sperrholz, Massivholz bis 10 mm, Acryl, Leder, Filz. Formen aus einer Vektordatei."
    ),
    fields: [
      { key: "matId", label: L("Materiał", "Material", "Material"), options: CUT_MATERIALS },
      { key: "pathId", label: L("Długość ścieżki", "Path length", "Pfadlänge"), options: CUT_PATHS },
      { key: "complexId", label: L("Złożoność", "Complexity", "Komplexität"), options: CUT_COMPLEXITY },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
      { key: "podloze", label: SUBSTRATE_LABEL, options: SUBSTRATES },
    ],
    defaults: { matId: "ply3", pathId: "S", complexId: "moderate", quantityId: "proto", podloze: "our_stock" },
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
      { key: "matId", label: L("Metal", "Metal", "Metall"), options: FIBER_MATERIALS,
        widok: "kafelki" },
      { key: "lensId", label: L("Obiektyw", "Lens", "Objektiv"), options: LENSES,
        widok: "zdjecia", kolumny: "grid-cols-2", wysokosc: 170 },
      { key: "markId", label: L("Rodzaj znakowania", "Marking type", "Markierungsart"), options: MARK_TYPES,
        widok: "zdjecia", kolumny: "grid-cols-2 sm:grid-cols-4" },
      // Obiektyw ogranicza pole znakowania. Zaleznosc siedzi w rdzeniu cenowym,
      // wiec sklep i kalkulator wyszarzaja te same warianty.
      { key: "areaId", label: L("Pole", "Area", "Fläche"), optionsFrom: (v) => areaOptionsForLens(v.lensId) },
      { key: "quantityId", label: L("Nakład", "Quantity", "Auflage"), options: QUANTITY_TIERS },
      { key: "podloze", label: SUBSTRATE_LABEL, options: SUBSTRATES },
    ],
    // Obiektyw 150 mm jest STANDARDOWY (pole 150x150 mm, tak opisuje go rdzen
    // cenowy). Katalog startowal na 70 mm, kalkulator na 150 mm, wiec ta sama
    // usluga miala dwie rozne kwoty startowe, zaleznie od tego, ktoredy klient
    // wszedl. Jedno zrodlo, wartosc szersza z dwoch.
    defaults: { matId: "stainless", lensId: "150mm", markId: "surface", areaId: "S", quantityId: "proto", podloze: "our_stock" },
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
      // Zywica, forma, wtracenie i wykonczenie to wybory MATERIALOWE: rozpoznaje
      // sie je po fakturze, nie po nazwie. Zdjecia stoja przy wariantach
      // w rdzeniu cenowym, wiec obie drogi pokazuja te same.
      { key: "resinId", label: L("Żywica", "Resin", "Harz"), options: RESINS,
        widok: "zdjecia", kolumny: "grid-cols-1 sm:grid-cols-3", wysokosc: 170 },
      { key: "volumeId", label: L("Objętość", "Volume", "Volumen"), options: VOLUMES },
      { key: "moldId", label: L("Forma", "Mold", "Form"), options: MOLD_TYPES,
        widok: "kafelki", kolumny: "grid-cols-3 sm:grid-cols-5" },
      { key: "inclusionId", label: L("Zatopienia", "Inclusions", "Einschlüsse"), options: INCLUSIONS,
        widok: "kafelki", kolumny: "grid-cols-2 sm:grid-cols-4" },
      { key: "finishId", label: L("Wykończenie", "Finish", "Finish"), options: FINISH_OPTIONS,
        widok: "zdjecia", kolumny: "grid-cols-1 sm:grid-cols-3" },
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

/**
 * OPIS ZLECENIA JEST WYMAGANY DOMYSLNIE, dla kazdej uslugi.
 *
 * Zasada wlasciciela z 2026-08-16, po zdarzeniu, ktore ja wymusilo: przyszlo
 * oplacone BLIKiem zlecenie na znakowanie laserem fiber, w ktorym byl sam plik
 * i ani slowa o tym, co z nim zrobic. Pieniadze na koncie, zlecenia nie da sie
 * wykonac, a klientke trzeba dopytywac po fakcie.
 *
 * Flaga jest wiec ODWROCONA: brak wpisu znaczy "wymagany". Usluga dopisana za
 * pol roku bedzie objeta zasada, nie czekajac, az ktos pamieta o dopisaniu
 * pola. Zwolnic z opisu mozna tylko przez jawne `requiresDescription: false`,
 * co zmusza do napisania w kodzie, dlaczego akurat ta usluga go nie potrzebuje.
 *
 * Sam plik nie zastepuje opisu i to jest sedno. Plik mowi, JAKI jest ksztalt.
 * Nie mowi, co ma byc na czym, ktora strona, jaka glebokosc, ile sztuk z jednej
 * deski ani co zrobic, gdy material okaze sie inny, niz klient sadzil.
 */
export function wymagaOpisu(svc) {
  return Boolean(svc) && svc.requiresDescription !== false;
}

/**
 * Uslugi z domysznym `requiresDescription`, policzonym RAZ przy wczytaniu modulu.
 *
 * TOZSAMOSC ZWRACANEGO OBIEKTU JEST TU CZESCIA UMOWY, a nie szczegolem.
 *
 * Bylo tu `return { ...svc, requiresDescription: wymagaOpisu(svc) }`, czyli
 * NOWY obiekt przy kazdym wywolaniu. `ServiceConfigurator` i `Order` wolaja
 * `getService` w trakcie renderowania, a wynik wchodzi do zaleznosci
 * `useCallback`, ktory buduje zapytanie o cene. Nowa tozsamosc przy kazdym
 * renderze znaczyla wiec: nowy `fetchPrice`, nowe uruchomienie efektu, nowe
 * zapytanie do `/api/price`, nowy stan, nowy render. Petla co 350 ms.
 *
 * Objawem bylo migotanie konfiguratora i blad "Za duzo zapytan, sprobuj za
 * chwile", czyli wlasny limit zapytan uderzajacy we wlasnego klienta. Cena
 * i parametry byly przez caly czas poprawne, wiec zaden sprawdzian tego nie
 * widzial: to bylo widac dopiero na zywej stronie.
 *
 * Mapa liczy sie raz, wiec `getService(id) === getService(id)`. Sprawdzian
 * `test-order-seam.mjs` pilnuje tej rownosci.
 */
const SERVICES_BY_ID = new Map(
  SERVICES.map((s) => [s.id, { ...s, requiresDescription: wymagaOpisu(s) }]),
);

export function getService(id) {
  return SERVICES_BY_ID.get(id) || null;
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
