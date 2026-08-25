// ============================================================
// SIMPLE STUDIO CALCULATOR - "Szybka wycena" for laypeople
// Maps 5 plain-language questions → advanced calculator params
// Reuses pricing engines from Print3D / CO2 / Fiber / Epoxy.
// ============================================================
import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import {
  KeyRound, BookText, Sparkles, Stamp, Gift, Cog, Gem, HelpCircle,
  Circle, Hand, Book, Package, Maximize2,
  Boxes, TreePine, Wrench, GlassWater, Droplet,
  ZapOff, ShieldCheck, Award,
  Hash, Users, Factory, Truck,
  Lightbulb, Upload, X, FileBox, Ruler, Layers, Loader2, AlertTriangle,
  SlidersHorizontal, ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  QUANTITY_TIERS, t, Chips, CalcCard, ResultHeader, ResultDisplay, LicenseNotice, NextStepPanel,
} from "./calcShared.jsx";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import {
  SUBSTRATE_LABEL, SUBSTRATES, SPARE_LABEL, spareOptionsFor, MIN_MATERIAL_NOTE,
} from "../../data/laserSubstrate.js";
import { stockOptions, stockAllowed, STOCK_OTHER } from "../../data/ourStock.js";
import { advancedParams, advancedMaterials, advancedExamples } from "../../data/advancedOptions.js";
import { makeHandoff, stashHandoff } from "../../data/calcHandoff.js";

const IDK_TITLE = {
  pl: "Doradzamy: te materiały wchodzą w grę",
  en: "Our advice: these materials are in play",
  de: "Unser Rat: diese Materialien kommen infrage",
};
const IDK_TITLE_FILE = {
  pl: "Doradzamy: dla tego pliku wchodzą w grę",
  en: "Our advice: for this file these are in play",
  de: "Unser Rat: für diese Datei kommen infrage",
};
const IDK_HINT = {
  pl: "Możesz wybrać teraz albo zostawić \u201enie wiem\u201d: wtedy dobieramy sami i piszemy, co i dlaczego proponujemy.",
  en: "Pick one now, or leave \u201enot sure\u201d: we choose for you and write back with what we propose and why.",
  de: "Wählen Sie jetzt, oder lassen Sie \u201eweiß nicht\u201d stehen: dann wählen wir und schreiben, was wir vorschlagen und warum.",
};

const OWN_STOCK_NOTE_LBL = {
  pl: "Napisz, jaki materiał do nas przyślesz",
  en: "Tell us what material you will send",
  de: "Sagen Sie uns, welches Material Sie schicken",
};
const OWN_STOCK_NOTE_PLACEHOLDER = {
  pl: "np. sklejka brzozowa 4 mm, dwa arkusze 30x40 cm",
  en: "e.g. 4 mm birch plywood, two 30x40 cm sheets",
  de: "z. B. 4 mm Birkensperrholz, zwei Bogen 30x40 cm",
};
const ITEM_NOTE_LBL = {
  pl: "Opisz przedmiot, który do nas przyślesz",
  en: "Describe the item you will send us",
  de: "Beschreiben Sie das Objekt, das Sie uns senden",
};
const ITEM_NOTE_PLACEHOLDER = {
  pl: "np. drewniana deska 25x35 cm, grawer na środku; albo stalowy zegarek, grawer na kopercie z tyłu",
  en: "e.g. a 25x35 cm wooden board, engraving in the middle; or a steel watch, engraving on the case back",
  de: "z. B. Holzbrett 25x35 cm, Gravur mittig; oder eine Stahluhr, Gravur auf dem Gehäuseboden",
};

const STOCK_LBL = {
  pl: "Na jakim materiale z naszego magazynu",
  en: "Which material from our stock",
  de: "Welches Material aus unserem Lager",
};
const STOCK_OTHER_LBL = { pl: "Inny materiał", en: "Other material", de: "Anderes Material" };
// Wybor z listy MUSI zostac obietnica robocizny, a nie dostepnosci. Materialu
// nie ma w kwocie z kalkulatora i nie deklarujemy, ze lezy na polce.
const STOCK_HINT = {
  pl: "Dostępność i koszt samego materiału potwierdzamy przy realizacji. Kwota powyżej obejmuje wykonanie.",
  en: "We confirm availability and the cost of the material itself when we start. The amount above covers the work.",
  de: "Verfügbarkeit und Materialkosten bestätigen wir bei Auftragsbeginn. Der Betrag oben deckt die Arbeit.",
};

const MATERIAL_NOTE_LBL = {
  pl: "Napisz, na jakim konkretnie materiale ma być wykonana usługa",
  en: "Tell us exactly which material the job should use",
  de: "Sagen Sie uns genau, welches Material verwendet werden soll",
};
const MATERIAL_NOTE_PLACEHOLDER = {
  pl: "np. sklejka brzozowa 3 mm, czarny plexi 5 mm",
  en: "e.g. 3 mm birch plywood, 5 mm black acrylic",
  de: "z. B. 3 mm Birkensperrholz, 5 mm schwarzes Acrylglas",
};
import PrintabilityGate from "./PrintabilityGate.jsx";
import { nozzleFromPrecision } from "../../analysis/printability.js";
import SizeSlider, { categoryForCm } from "./SizeSlider.jsx";
import VectorPreview from "./VectorPreview.jsx";
import { resolveTechAndParams, runCalc, CAST_DEFAULT_ALLOY } from "../../pricing/simpleQuote.js";
import { CASTING_METALS, CASTING_ENVELOPE_MM, maxCastingScaleForBBox } from "../../pricing/preciousMetalCasting.js";
import { useMarketRates } from "../../hooks/useMarketRates.js";
import { useMaterialStock } from "../../hooks/useMaterialStock.js";
import { getResin } from "../../data/resins.js";
import { scaleMesh, scaleVector, meshMaxCm, vectorMaxCm, meshForPricing } from "../../pricing/scaleGeometry.js";
import { looksTooSmall, suspectUnits } from "../../pricing/meshUnits.js";
import { BUILD_VOL_CM, MSLA_BUILD_VOL_CM, maxScaleForBuildVolume } from "../../pricing/print3d.js";
import { bedFit } from "../../pricing/laserLimits.js";
import { trackCalc } from "../../utils/analytics.js";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

/** Formaty, ktore umie odczytac `src/pricing/mesh.js`. Ta sama lista co w sklepie. */
const ACCEPT_MESH = ".stl,.obj,.3mf,.step,.stp";

/**
 * Rysunki. Wyceniamy z geometrii tylko SVG, bo tylko jego parser podaje dlugosc
 * sciezki i pole grawerowania. Pozostale przyjmujemy swiadomie i mowimy wprost,
 * ze ida do wyceny przez czlowieka. Przyjac plik i po cichu go zignorowac byloby
 * gorsze niz go nie przyjac.
 */
const ACCEPT_VECTOR = ".svg,.dxf,.ai,.pdf";

/** Rozszerzenia, z ktorych potrafimy policzyc cene bez udzialu czlowieka. */
const MESH_EXT = new Set(["stl", "obj", "3mf", "step", "stp"]);
// Formaty wektorowe, z ktorych liczymy cene z geometrii. DXF doszedl
// 2026-08-19: jest formatem tekstowym stworzonym wprost do maszyn i niesie
// wspolrzedne oraz jednostke, wiec wycena z niego jest tak samo pewna jak
// z SVG (pilnuje tego scripts/test-dxf.mjs, ktory porownuje obie drogi).
const VECTOR_PRICED_EXT = new Set(["svg", "dxf"]);

// ============================================================
// QUESTIONS & OPTIONS
// ============================================================

const ITEMS = [
  { id: "keychain", icon: KeyRound,    img: "/img/calc/studio_items/keychain.webp", label: { pl: "Breloczek", en: "Keychain", de: "Schlüsselanhänger" } },
  { id: "sign",     icon: BookText,    img: "/img/calc/studio_items/sign.webp",     label: { pl: "Tabliczka / szyld", en: "Plate / sign", de: "Schild" } },
  { id: "figurine", icon: Sparkles,    img: "/img/calc/studio_items/figurine.webp", label: { pl: "Figurka / model", en: "Figurine / model", de: "Figur / Modell" } },
  { id: "figurine_msla", icon: Sparkles, img: "/img/calc/studio_materials/figurine.webp", label: { pl: "Figurka / miniatura (żywica)", en: "Figurine / miniature (resin)", de: "Figur / Miniatur (Harz)" } },
  { id: "stamp",    icon: Stamp,       img: "/img/calc/studio_items/stamp.webp",    label: { pl: "Pieczątka", en: "Stamp", de: "Stempel" } },
  { id: "gift",     icon: Gift,        img: "/img/calc/studio_items/gift.webp",     label: { pl: "Prezent / dekoracja", en: "Gift / decoration", de: "Geschenk / Deko" } },
  { id: "part",     icon: Cog,         img: "/img/calc/studio_items/part.webp",     label: { pl: "Część techniczna", en: "Technical part", de: "Technisches Teil" } },
  { id: "jewelry",  icon: Gem,         img: "/img/calc/studio_items/jewelry.webp",  label: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck" } },
  { id: "other",    icon: HelpCircle,  label: { pl: "Coś innego", en: "Something else", de: "Etwas anderes" } },
];

const SIZES = [
  { id: "coin",   icon: Circle,    img: "/img/calc/studio_sizes/coin.webp",   label: { pl: "Jak moneta", en: "Coin-sized", de: "Münzgröße" },          sub: { pl: "do 3 cm",      en: "up to 3 cm",  de: "bis 3 cm" } },
  { id: "palm",   icon: Hand,      img: "/img/calc/studio_sizes/palm.webp",   label: { pl: "Jak dłoń",    en: "Palm-sized", de: "Handflächengröße" },   sub: { pl: "3–10 cm",      en: "3–10 cm",     de: "3–10 cm" } },
  { id: "book",   icon: Book,      img: "/img/calc/studio_sizes/book.webp",   label: { pl: "Jak książka", en: "Book-sized", de: "Buchgröße" },          sub: { pl: "10–25 cm",     en: "10–25 cm",    de: "10–25 cm" } },
  { id: "box",    icon: Package,   img: "/img/calc/studio_sizes/box.webp",    label: { pl: "Pudełko po butach", en: "Shoebox",  de: "Schuhkarton" },    sub: { pl: "25–40 cm",     en: "25–40 cm",    de: "25–40 cm" } },
  { id: "bigger", icon: Maximize2, img: "/img/calc/studio_sizes/bigger.webp", label: { pl: "Większe",     en: "Bigger",     de: "Größer" },             sub: { pl: "powyżej 40 cm", en: "over 40 cm", de: "über 40 cm" } },
];

const MATERIALS = [
  { id: "plastic", icon: Boxes,      img: "/img/calc/studio_materials/plastic.webp", label: { pl: "Plastik",       en: "Plastic",        de: "Kunststoff" } },
  { id: "wood",    icon: TreePine,   img: "/img/calc/studio_materials/wood.webp",    label: { pl: "Drewno",        en: "Wood",           de: "Holz" } },
  { id: "metal",   icon: Wrench,     img: "/img/calc/studio_materials/metal.webp",   label: { pl: "Metal",         en: "Metal",          de: "Metall" } },
  // "Inne" nie jest ozdobnikiem: pod tym kaflem siedza akryl, skora, guma,
  // papier i tkanina, czyli polowa tego, co realnie tniemy i grawerujemy.
  // Bez tego slowa klient z akrylem nie mial gdzie kliknac.
  { id: "glass",   icon: GlassWater, img: "/img/calc/studio_materials/glass.webp",   label: { pl: "Szkło / kamień / inne", en: "Glass / stone / other", de: "Glas / Stein / Sonstiges" } },
  { id: "resin",   icon: Droplet,    img: "/img/calc/studio_materials/resin.webp",   label: { pl: "Żywica",        en: "Resin",          de: "Harz" } },
  // Kruszec to NIE jest ten sam kafelek co "Metal". Tam laser znakuje gotowy
  // przedmiot, tutaj odlewamy nowy z modelu, wiec i technologia, i cena sa inne.
  { id: "precious", icon: Gem,       img: "/img/shop/service/precious_metal_casting.webp", label: { pl: "Srebro / złoto (odlew)", en: "Silver / gold (casting)", de: "Silber / Gold (Guss)" } },
  { id: "idk",     icon: HelpCircle, label: { pl: "Nie wiem - doradźcie", en: "I'm not sure - advise me", de: "Weiß nicht - beraten Sie mich" } },
];

const FINISH = [
  { id: "prototype", icon: ZapOff,      img: "/img/calc/studio_finish/prototype.webp", label: { pl: "Prototyp",  en: "Prototype", de: "Prototyp" },  sub: { pl: "tanio i szybko", en: "cheap & fast", de: "günstig & schnell" } },
  { id: "standard",  icon: ShieldCheck, img: "/img/calc/studio_finish/standard.webp",  label: { pl: "Standard",  en: "Standard",  de: "Standard" },  sub: { pl: "dobra jakość",   en: "good quality", de: "gute Qualität" } },
  { id: "premium",   icon: Award,       img: "/img/calc/studio_finish/premium.webp",   label: { pl: "Premium",   en: "Premium",   de: "Premium" },   sub: { pl: "najwyższa jakość", en: "top quality", de: "höchste Qualität" } },
];

const QUANTITY = [
  { id: "one",  icon: Hash,    label: { pl: "1 sztuka",     en: "1 piece",      de: "1 Stück" } },
  { id: "few",  icon: Users,   label: { pl: "Kilka",        en: "A few",        de: "Einige" },        sub: { pl: "2–10",  en: "2–10",  de: "2–10"  } },
  { id: "many", icon: Factory, label: { pl: "Wiele",        en: "Many",         de: "Viele" },         sub: { pl: "11–50", en: "11–50", de: "11–50" } },
  { id: "lots", icon: Truck,   label: { pl: "Mnóstwo",      en: "Lots",         de: "Sehr viele" },    sub: { pl: "50+",   en: "50+",   de: "50+"   } },
];

// ============================================================
// MAPOWANIE ODPOWIEDZI NA PARAMETRY
// ============================================================
// Cala warstwa tlumaczaca piec pytan laika na parametry kalkulatora mieszka
// w `src/pricing/simpleQuote.js`. Wyniesiona stad, bo to czysty rachunek bez
// grama interfejsu, a w osobnym module da sie go przeliczyc w node i porownac
// z trybem zaawansowanym (patrz `scripts/test-simple-quote.mjs`). Dopoki
// siedziala w komponencie, jedynym sposobem sprawdzenia ceny bylo otwarcie
// strony i zaufanie temu, co pokaze.

/**
 * Mapowanie wyniku szybkiej wyceny na usluge w sklepie.
 * Zwraca null, gdy konfiguracji nie da sie kupic jednym kliknieciem.
 */
function cartTargetFor(resolved) {
  if (!resolved || resolved.custom) return null;
  const { tech, mode } = resolved;
  if (tech === "3dprint") return { calculator: "print3d_fdm", serviceId: "print_fdm" };
  if (tech === "msla")    return { calculator: "print3d_msla", serviceId: "print_msla" };
  if (tech === "epoxy")   return { calculator: "epoxy", serviceId: "epoxy" };
  if (tech === "cast")    return { calculator: "jewelry_casting", serviceId: "precious_metal_casting" };
  if (tech === "fiber")   return { calculator: "laser_fiber", serviceId: "laser_fiber" };
  if (tech === "co2") {
    return mode === "cut"
      ? { calculator: "laser_co2_cut", serviceId: "laser_cut" }
      : { calculator: "laser_co2_engrave", serviceId: "laser_engrave" };
  }
  return null;
}

// ============================================================
// UI - emerald-themed tile grid
// ============================================================

const ALLOY_LBL = {
  pl: "Z jakiego kruszcu odlewamy",
  en: "Which metal we cast in",
  de: "Aus welchem Metall wir giessen",
};
// ODLEW BEZ MODELU NIE MA MASY. Przedzial wielkosci opisuje gabaryt, a nie
// objetosc kruszcu: pierscionek "jak moneta" to w wiekszosci powietrze.
// Mowimy to wprost, zamiast pokazac liczbe wzieta znikad.
const CAST_HINT_NO_FILE = {
  pl: `Odlew wyceniamy z objętości modelu, więc potrzebujemy pliku 3D. Bez niego przygotujemy wycenę indywidualną. Automat obejmuje modele mieszczące się w ${CASTING_ENVELOPE_MM.join(" × ")} mm.`,
  en: `A casting is priced from the model's volume, so we need a 3D file. Without one we prepare an individual quote. Automatic pricing covers models fitting ${CASTING_ENVELOPE_MM.join(" × ")} mm.`,
  de: `Ein Guss wird aus dem Modellvolumen berechnet, wir brauchen also eine 3D-Datei. Ohne sie erstellen wir ein individuelles Angebot. Die Automatik gilt bis ${CASTING_ENVELOPE_MM.join(" × ")} mm.`,
};
const CAST_HINT_FILE = {
  pl: `Cena wynika z objętości Twojego modelu i bieżącego kursu kruszcu. Automat obejmuje modele mieszczące się w ${CASTING_ENVELOPE_MM.join(" × ")} mm; większe kierujemy do oceny indywidualnej.`,
  en: `The price follows your model's volume and the current metal rate. Automatic pricing covers models fitting ${CASTING_ENVELOPE_MM.join(" × ")} mm; larger ones go to individual review.`,
  de: `Der Preis folgt dem Volumen Ihres Modells und dem aktuellen Metallkurs. Die Automatik gilt bis ${CASTING_ENVELOPE_MM.join(" × ")} mm; groessere pruefen wir individuell.`,
};

const TECH_BADGE = {
  "3dprint": { pl: "Druk 3D",    en: "3D Print",     de: "3D-Druck" },
  "co2":     { pl: "Laser CO2",  en: "CO2 Laser",    de: "CO2-Laser" },
  "fiber":   { pl: "Laser Fiber", en: "Fiber Laser",  de: "Faserlaser" },
  "epoxy":   { pl: "Żywica",      en: "Resin casting", de: "Harzguss" },
  "msla":    { pl: "Żywica MSLA", en: "MSLA Resin",   de: "MSLA-Harz" },
  "cast":    { pl: "Odlew w metalu", en: "Metal casting", de: "Metallguss" },
};

const TECH_RATIONALE = {
  "3dprint": {
    pl: "Druk 3D najlepiej oddaje kształty i detale w plastiku.",
    en: "3D printing best captures shapes and details in plastic.",
    de: "3D-Druck erfasst Formen und Details in Kunststoff am besten.",
  },
  "co2": {
    pl: "Laser CO2 to najszybsza i najtańsza opcja dla drewna, sklejki, akrylu i szkła.",
    en: "CO2 laser is the fastest and cheapest option for wood, plywood, acrylic and glass.",
    de: "CO2-Laser ist die schnellste und günstigste Option für Holz, Sperrholz, Acryl und Glas.",
  },
  "fiber": {
    pl: "Laser fiber idealny do znakowania metalu i biżuterii.",
    en: "Fiber laser is ideal for marking metal and jewelry.",
    de: "Faserlaser ist ideal zum Markieren von Metall und Schmuck.",
  },
  "epoxy": {
    pl: "Odlewy z żywicy dają najlepsze efekty dla transparentnych i dekoracyjnych form.",
    en: "Resin casting gives best results for transparent and decorative forms.",
    de: "Harzguss liefert die besten Ergebnisse für transparente und dekorative Formen.",
  },
  "cast": {
    pl: "Odlew na wosk tracony: wzorzec drukujemy w żywicy odlewniczej, wypalamy i zalewamy srebrem albo złotem.",
    en: "Lost-wax casting: we print the pattern in castable resin, burn it out and pour silver or gold.",
    de: "Wachsausschmelzguss: Das Modell wird in Gießharz gedruckt, ausgebrannt und mit Silber oder Gold gefüllt.",
  },
  "msla": {
    pl: "Druk żywiczny MSLA 16K oddaje mikrodetal i gładkie powierzchnie, idealny do figurek i miniatur.",
    en: "MSLA 16K resin printing captures micro-detail and smooth surfaces, ideal for figurines and miniatures.",
    de: "MSLA-16K-Harzdruck erfasst Mikrodetails und glatte Oberflächen, ideal für Figuren und Miniaturen.",
  },
};

const LBL = {
  pl: {
    q0: "Masz gotowy plik?", q0hint: "Wrzuć plik STL lub SVG - wycenimy automatycznie",
    q0drop: "Przeciągnij plik tutaj", q0tap: "Kliknij, aby wybrać plik", q0or: "lub kliknij, aby wybrać", q0accept: ".stl, .obj, .3mf, .step, .svg, .dxf, .ai, .pdf",
    q0skip: "Nie mam pliku - opiszę co potrzebuję",
    q0locked: "Rodzaj pliku wynika z tego, co wgrałeś. Żeby wgrać inny, usuń obecny plik krzyżykiem.", filamentLbl: "Filament", resinLbl: "Żywica", q0detected: "Wykryto", q0stl: "Model 3D (STL)", q0model: "Model 3D", q0svg: "Grafika wektorowa (SVG)", q0vector: "Grafika wektorowa",
    q0dims: "Wymiary", q0vol: "Objętość", q0area: "Powierzchnia", q0paths: "Ścieżki",
    q0remove: "Usuń plik", q0selected: "Wybrano", q0selSize: "Rozmiar", q0selMat: "Materiał",
    unitTitle: "Ten model ma po odczycie", unitTitleSuffix: "cm",
    unitText: "Pliki STL i OBJ nie zapisują jednostki, więc czytamy je jako milimetry - a ten plik prawdopodobnie zapisano inaczej.",
    unitRead: "Czytaj w",
    dxfNoPreview: "Rysunek DXF czytamy z geometrii, ale podglądu z niego nie rysujemy.",
    dxfBlocks: "Uwaga: rysunek zawiera bloki, których nie rozwijamy. Policzona ścieżka może być krótsza niż rzeczywista, więc wycenę potwierdzimy przed realizacją.", unitClose: "Jeśli żadna z tych wartości nie pasuje, wielkość można ustawić suwakiem poniżej.",
    haveMesh: "Mam gotowy plik 3D", haveMeshSub: "STL, OBJ, 3MF, STEP",
    haveVector: "Mam gotowy plik wektorowy", haveVectorSub: "SVG, DXF, AI, PDF",
    dimOriginal: "Wymiar oryginalny", dimTarget: "Wymiar do realizacji",
    manualOnly: "Ten format przyjmujemy, ale ceny z niego nie policzymy automatycznie. Dołączymy plik do zapytania i odpowiemy z wyceną.",
    overPlateTitle: "Ta wielkość nie zmieści się w całości na naszym stole",
    overPlateTitleMsla: "Ta wielkość nie zmieści się na drukarce żywicznej",
    overPlateTextMsla: "Drukarka żywiczna (Elegoo Saturn 4 Ultra) ma pole 21,8 x 12,3 x 25 cm, czyli wyraźnie mniejsze niż filamentowa. Są trzy wyjścia.",
    overPlateSwitchFdm: "Wydrukuj z filamentu, tam ta wielkość się mieści",
    overPlateText: "Największa maszyna ma pole robocze 30 x 32 x 32,5 cm. Są dwa wyjścia i oba u nas działają.",
    overPlateFit: "Zmniejsz do największej, która się mieści",
    overPlateSplit: "Zostaw tę wielkość i poproś o wycenę: przy dużych obiektach tniemy model na części i sklejamy po wydruku. Szew planujemy na krawędzi, żeby go nie było widać.",
    techQ: "Jaką techniką wydrukować?",
    techFdmName: "Z filamentu (FDM)", techFdmDesc: "Wytrzymały, tańszy, widoczne warstwy. Do części, obudów i rzeczy używanych na co dzień.",
    techMslaName: "Z żywicy (MSLA)", techMslaDesc: "Gładka powierzchnia i drobne detale, za to bardziej krucha. Do figurek, miniatur i modeli.",
    techAuto: "wybrane automatycznie",
    q1file: "Do czego to służy?", q1fileHint: "Od tego zależy materiał i technologia, nie wielkość.",
    q1: "Co chcesz wykonać?", q2: "Jak duże?", q3: "Z jakiego materiału?", q4: "Jakość wykonania?", q5: "Ile sztuk?",
    suggestion: "Sugerowana technologia",
    why: "Dlaczego?",
    switchHint: 'Chcesz podać dokładniejsze parametry? Przełącz na tryb "Dla zaawansowanych" u góry.',
    moreTitle: "Chcesz wybrać sam parametry druku?",
    moreTitleLaser: "Chcesz wybrać sam parametry pracy?",
    moreLead3d: "W trybie szybkiej wyceny filament oraz parametry wydruku dobieramy automatycznie. W trybie dla zaawansowanych masz możliwość wyboru ich samodzielnie. Znajdziesz tam {n} filamentów, między innymi {ex} oraz inne, bardziej techniczne.",
    moreLeadMsla: "W trybie szybkiej wyceny żywicę oraz parametry wydruku dobieramy automatycznie. W trybie dla zaawansowanych masz możliwość wyboru ich samodzielnie. Znajdziesz tam {n} żywic, między innymi {ex} oraz inne, bardziej specjalistyczne.",
    moreLeadLaser: "W trybie szybkiej wyceny parametry pracy lasera dobieramy automatycznie. Materiał wybierasz powyżej, a w trybie dla zaawansowanych masz możliwość ustawienia reszty samodzielnie.",
    moreParams: "Tryb ten daje Ci również możliwość ustawienia takich parametrów jak {p}.",
    moreCta: "Przejdź do trybu dla zaawansowanych",
    moreShop: "Gotowe wyroby w sklepie",
    moreKeepsFile: "Wgrany plik i ustawiona wielkość przejdą tam razem z Tobą.",
    note: 'Szybka wycena liczy z Twoich wyborów, a po wgraniu pliku z jego geometrii. Technologię druku, cięcie albo grawer i materiał wybierasz sam. Tryb zaawansowany dokłada resztę parametrów: wypełnienie, precyzję i wykończenie.',
    mslaHint: "Ten model zmieści się na drukarce żywicznej MSLA 16K, to opcja z wyższą precyzją i gładszą powierzchnią niż odlew z żywicy.",
    co2ModeQ: "Cięcie czy grawerowanie?",
    co2CutName: "Cięcie na wylot", co2CutDesc: "Wycinamy kształt na wylot, zostaje gotowy element.",
    co2CutOffMetal: "Metalu nie tniemy: laser światłowodowy znakuje powierzchnię.",
    co2EngraveName: "Grawerowanie powierzchni", co2EngraveDesc: "Wypalamy rysunek na powierzchni, materiał zostaje w całości.",
    laserOverPlateTitle: "Ten rysunek nie zmieści się w polu roboczym lasera",
    laserOverPlateTextCo2: "Laser CO2 (xTool P2) ma pole robocze 60 x 30,8 cm.",
    laserOverPlateTextFiber: "Laser światłowodowy ma pole robocze 15 x 15 cm.",
    laserOverPlateFit: "Zmniejsz do największej, która się mieści",
    laserOverPlateCustom: "Przy tej wielkości wyceniamy indywidualnie: napisz do nas, a odpowiemy z ofertą.",
    laserExtendedNote: "Ta praca wymaga przelotki z podajnikiem (dłuższa oś), co wydłuża przygotowanie.",
    castOverFlaskTitle: "Ten model nie zmieści się w kolbie odlewniczej",
    castOverFlaskText: "Automatyczna wycena odlewu obejmuje modele mieszczące się po obrocie w 24 x 24 x 35 mm. Twój jest większy, więc albo go zmniejsz, albo zostaw wielkość i poproś o ocenę indywidualną.",
    castOverFlaskFit: "Zmniejsz do największej, która się mieści",
    castOverFlaskNote: "Zmniejszenie zmienia też grubość ścianek, krap i kanałów. Dopasowanie wymiarów nie zastępuje kontroli technologicznej przed odlewem.",
    quickQuote: "Szybka wycena",
  },
  en: {
    q0: "Got a file ready?", q0hint: "Drop an STL or SVG file - we'll quote it automatically",
    q0drop: "Drag your file here", q0tap: "Tap to choose a file", q0or: "or click to browse", q0accept: ".stl, .obj, .3mf, .step, .svg, .dxf, .ai, .pdf",
    q0skip: "No file - I'll describe what I need",
    q0locked: "The file type follows from what you uploaded. To upload a different one, remove the current file with the cross.", filamentLbl: "Filament", resinLbl: "Resin", q0detected: "Detected", q0stl: "3D model (STL)", q0model: "3D model", q0svg: "Vector graphic (SVG)", q0vector: "Vector graphic",
    q0dims: "Dimensions", q0vol: "Volume", q0area: "Area", q0paths: "Paths",
    q0remove: "Remove file", q0selected: "Selected", q0selSize: "Size", q0selMat: "Material",
    unitTitle: "This model reads as", unitTitleSuffix: "cm",
    unitText: "STL and OBJ files do not store a unit, so we read them as millimeters - this file was probably saved differently.",
    unitRead: "Read in",
    dxfNoPreview: "We read the DXF geometry, but we do not draw a preview from it.",
    dxfBlocks: "Note: the drawing contains blocks we do not expand. The measured path may be shorter than the real one, so we will confirm the quote before production.", unitClose: "If none of these values fits, you can set the size with the slider below.",
    haveMesh: "I have a 3D file", haveMeshSub: "STL, OBJ, 3MF, STEP",
    haveVector: "I have a vector file", haveVectorSub: "SVG, DXF, AI, PDF",
    dimOriginal: "Original size", dimTarget: "Size we will make",
    manualOnly: "We accept this format, but we cannot price it automatically. We will attach the file to your enquiry and come back with a quote.",
    overPlateTitle: "This size will not fit our build plate in one piece",
    overPlateTitleMsla: "This size will not fit the resin printer",
    overPlateTextMsla: "The resin printer (Elegoo Saturn 4 Ultra) has a 21.8 x 12.3 x 25 cm plate, clearly smaller than the filament one. There are three ways out.",
    overPlateSwitchFdm: "Print it in filament, where this size fits",
    overPlateText: "The largest machine has a 30 x 32 x 32.5 cm build volume. There are two ways out and we do both.",
    overPlateFit: "Scale down to the largest that fits",
    overPlateSplit: "Keep this size and ask for a quote: on large objects we split the model and bond the parts after printing. We place the seam on an edge so it does not show.",
    techQ: "Which printing technology?",
    techFdmName: "Filament (FDM)", techFdmDesc: "Tough, cheaper, visible layers. For parts, housings and everyday objects.",
    techMslaName: "Resin (MSLA)", techMslaDesc: "Smooth surface and fine detail, but more brittle. For figurines, miniatures and models.",
    techAuto: "chosen automatically",
    q1file: "What is it for?", q1fileHint: "This drives the material and the technology, not the size.",
    q1: "What do you want to make?", q2: "How big?", q3: "What material?", q4: "Quality?", q5: "How many?",
    suggestion: "Suggested technology",
    why: "Why?",
    switchHint: 'Want more precise parameters? Switch to "Advanced" mode at the top.',
    moreTitle: "Want to set the print parameters yourself?",
    moreTitleLaser: "Want to set the working parameters yourself?",
    moreLead3d: "In quick quote mode we pick the filament and the print parameters automatically. Advanced mode lets you choose them yourself. You will find {n} filaments there, among them {ex}, plus more technical ones.",
    moreLeadMsla: "In quick quote mode we pick the resin and the print parameters automatically. Advanced mode lets you choose them yourself. You will find {n} resins there, among them {ex}, plus more specialised ones.",
    moreLeadLaser: "In quick quote mode we set the laser parameters automatically. You pick the material above, and advanced mode lets you set the rest yourself.",
    moreParams: "It also lets you set parameters such as {p}.",
    moreCta: "Switch to advanced mode",
    moreShop: "Ready-made items in the shop",
    moreKeepsFile: "Your uploaded file and the size you set come along with you.",
    note: 'The quick quote follows your choices, and once you upload a file, its geometry. You pick the print technology, cutting or engraving, and the material yourself. Advanced mode adds the rest: infill, precision and finish.',
    mslaHint: "This model fits the MSLA 16K resin printer, an option with higher precision and a smoother surface than a resin cast.",
    co2ModeQ: "Cut or engrave?",
    co2CutName: "Cut through", co2CutDesc: "We cut the shape all the way through, leaving a finished piece.",
    co2CutOffMetal: "We do not cut metal: the fibre laser marks the surface.",
    co2EngraveName: "Surface engraving", co2EngraveDesc: "We burn the drawing into the surface, the material stays whole.",
    laserOverPlateTitle: "This drawing does not fit the laser's work area",
    laserOverPlateTextCo2: "The CO2 laser (xTool P2) has a 60 x 30.8 cm work area.",
    laserOverPlateTextFiber: "The fiber laser has a 15 x 15 cm work area.",
    laserOverPlateFit: "Scale down to the largest that fits",
    laserOverPlateCustom: "At this size we quote it individually: write to us and we will come back with an offer.",
    laserExtendedNote: "This job needs the passthrough riser (longer axis), which adds to the setup time.",
    castOverFlaskTitle: "This model does not fit our casting flask",
    castOverFlaskText: "Automatic casting prices cover models that fit 24 x 24 x 35 mm after rotation. Yours is larger, so either scale it down or keep the size and ask for an individual review.",
    castOverFlaskFit: "Scale down to the largest that fits",
    castOverFlaskNote: "Scaling down also changes wall, prong and channel thickness. Fitting the dimensions does not replace the manufacturing review before casting.",
    quickQuote: "Quick quote",
  },
  de: {
    q0: "Haben Sie eine Datei?", q0hint: "Laden Sie eine STL- oder SVG-Datei hoch - wir kalkulieren automatisch",
    q0drop: "Datei hierher ziehen", q0tap: "Tippen um Datei auszuwählen", q0or: "oder klicken zum Auswählen", q0accept: ".stl, .obj, .3mf, .step, .svg, .dxf, .ai, .pdf",
    q0skip: "Keine Datei - ich beschreibe was ich brauche",
    q0locked: "Der Dateityp ergibt sich aus dem Upload. Für eine andere Datei entfernen Sie die aktuelle mit dem Kreuz.", filamentLbl: "Filament", resinLbl: "Harz", q0detected: "Erkannt", q0stl: "3D-Modell (STL)", q0model: "3D-Modell", q0svg: "Vektorgrafik (SVG)", q0vector: "Vektorgrafik",
    q0dims: "Maße", q0vol: "Volumen", q0area: "Fläche", q0paths: "Pfade",
    q0remove: "Datei entfernen", q0selected: "Ausgewählt", q0selSize: "Größe", q0selMat: "Material",
    unitTitle: "Dieses Modell wird gelesen als", unitTitleSuffix: "cm",
    unitText: "STL- und OBJ-Dateien speichern keine Einheit, wir lesen sie daher als Millimeter - diese Datei wurde wahrscheinlich anders gespeichert.",
    unitRead: "Lesen in",
    dxfNoPreview: "Die DXF-Geometrie lesen wir, eine Vorschau zeichnen wir daraus nicht.",
    dxfBlocks: "Hinweis: Die Zeichnung enthält Blöcke, die wir nicht auflösen. Der gemessene Pfad kann kürzer sein als der tatsächliche, daher bestätigen wir das Angebot vor der Fertigung.", unitClose: "Wenn keiner dieser Werte passt, können Sie die Größe mit dem Regler unten einstellen.",
    haveMesh: "Ich habe eine 3D-Datei", haveMeshSub: "STL, OBJ, 3MF, STEP",
    haveVector: "Ich habe eine Vektordatei", haveVectorSub: "SVG, DXF, AI, PDF",
    dimOriginal: "Originalmaß", dimTarget: "Maß für die Ausführung",
    manualOnly: "Dieses Format nehmen wir an, automatisch kalkulieren können wir es aber nicht. Wir hängen die Datei an Ihre Anfrage und melden uns mit einem Angebot.",
    overPlateTitle: "Diese Größe passt nicht am Stück auf unsere Bauplatte",
    overPlateTitleMsla: "Diese Größe passt nicht auf den Harzdrucker",
    overPlateTextMsla: "Der Harzdrucker (Elegoo Saturn 4 Ultra) hat 21,8 x 12,3 x 25 cm, deutlich weniger als der Filamentdrucker. Es gibt drei Wege.",
    overPlateSwitchFdm: "Aus Filament drucken, dort passt diese Größe",
    overPlateText: "Die größte Maschine hat einen Bauraum von 30 x 32 x 32,5 cm. Es gibt zwei Wege und beide gehen wir.",
    overPlateFit: "Auf die größte passende Größe verkleinern",
    overPlateSplit: "Diese Größe behalten und ein Angebot anfragen: bei großen Objekten teilen wir das Modell und fügen die Teile nach dem Druck. Die Naht legen wir auf eine Kante, damit sie nicht auffällt.",
    techQ: "Mit welcher Drucktechnik?",
    techFdmName: "Aus Filament (FDM)", techFdmDesc: "Robust, günstiger, sichtbare Schichten. Für Teile, Gehäuse und Alltagsgegenstände.",
    techMslaName: "Aus Harz (MSLA)", techMslaDesc: "Glatte Oberfläche und feine Details, dafür spröder. Für Figuren, Miniaturen und Modelle.",
    techAuto: "automatisch gewählt",
    q1file: "Wofür ist es?", q1fileHint: "Davon hängen Material und Technologie ab, nicht die Größe.",
    q1: "Was möchten Sie herstellen?", q2: "Wie groß?", q3: "Welches Material?", q4: "Qualität?", q5: "Wie viele?",
    suggestion: "Empfohlene Technologie",
    why: "Warum?",
    switchHint: 'Genauere Parameter? Wechseln Sie oben in den "Fortgeschrittenen"-Modus.',
    moreTitle: "Druckparameter selbst wählen?",
    moreTitleLaser: "Arbeitsparameter selbst wählen?",
    moreLead3d: "In der Schnellkalkulation wählen wir Filament und Druckparameter automatisch. Im erweiterten Modus wählen Sie sie selbst. Dort finden Sie {n} Filamente, darunter {ex}, sowie weitere, technischere.",
    moreLeadMsla: "In der Schnellkalkulation wählen wir Harz und Druckparameter automatisch. Im erweiterten Modus wählen Sie sie selbst. Dort finden Sie {n} Harze, darunter {ex}, sowie weitere, speziellere.",
    moreLeadLaser: "In der Schnellkalkulation stellen wir die Laserparameter automatisch ein. Das Material wählen Sie oben, den Rest stellen Sie im erweiterten Modus selbst ein.",
    moreParams: "Dort stellen Sie zudem Parameter wie {p} ein.",
    moreCta: "In den erweiterten Modus wechseln",
    moreShop: "Fertige Produkte im Shop",
    moreKeepsFile: "Ihre hochgeladene Datei und die eingestellte Größe kommen mit.",
    note: 'Die Schnellkalkulation folgt Ihren Angaben und nach dem Upload der Geometrie der Datei. Drucktechnik, Schneiden oder Gravieren und das Material wählen Sie selbst. Der erweiterte Modus ergänzt Füllung, Präzision und Finish.',
    mslaHint: "Dieses Modell passt auf den MSLA-16K-Harzdrucker, eine Option mit höherer Präzision und glatterer Oberfläche als ein Harzguss.",
    co2ModeQ: "Schneiden oder Gravieren?",
    co2CutName: "Durchschneiden", co2CutDesc: "Wir schneiden die Form ganz durch, es bleibt ein fertiges Teil.",
    co2CutOffMetal: "Metall schneiden wir nicht: der Faserlaser markiert die Oberfläche.",
    co2EngraveName: "Oberflächengravur", co2EngraveDesc: "Wir brennen die Zeichnung in die Oberfläche, das Material bleibt vollständig erhalten.",
    laserOverPlateTitle: "Diese Zeichnung passt nicht in den Arbeitsbereich des Lasers",
    laserOverPlateTextCo2: "Der CO2-Laser (xTool P2) hat einen Arbeitsbereich von 60 x 30,8 cm.",
    laserOverPlateTextFiber: "Der Faserlaser hat einen Arbeitsbereich von 15 x 15 cm.",
    laserOverPlateFit: "Auf die größte passende Größe verkleinern",
    laserOverPlateCustom: "Bei dieser Größe kalkulieren wir individuell: schreiben Sie uns, wir melden uns mit einem Angebot.",
    laserExtendedNote: "Diese Arbeit braucht den Passthrough-Riser (längere Achse), was die Vorbereitung verlängert.",
    castOverFlaskTitle: "Dieses Modell passt nicht in unsere Gusskuevette",
    castOverFlaskText: "Die automatische Gusskalkulation gilt fuer Modelle, die nach Drehung in 24 x 24 x 35 mm passen. Ihres ist groesser, verkleinern Sie es also oder behalten Sie die Groesse und lassen Sie sie individuell pruefen.",
    castOverFlaskFit: "Auf die groesste passende Groesse verkleinern",
    castOverFlaskNote: "Das Verkleinern aendert auch Wand-, Krappen- und Kanalstaerken. Passende Masse ersetzen nicht die technische Pruefung vor dem Guss.",
    quickQuote: "Schnellkalkulation",
  },
};

/** Emerald-themed tile grid - pure visual, used for all 5 questions. */
function TileGrid({ options, value, onChange, lang, cols = 4, disabled = false, disabledIds }) {
  const gridCls = cols === 3
    ? "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
    : "grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3";
  return (
    <div className={`${gridCls} ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {options.map(opt => {
        const active = value === opt.id;
        const optDisabled = disabledIds?.has(opt.id);
        const Icon = opt.icon;
        const label = t(opt.label, lang);
        const sub = opt.sub ? t(opt.sub, lang) : null;
        const hasImg = !!opt.img;

        return (
          <button key={opt.id} onClick={() => !optDisabled && onChange(opt.id)} disabled={disabled || optDisabled}
            className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[120px] sm:min-h-[140px] ${
              optDisabled
                ? "opacity-30 pointer-events-none border-white/5"
                : active
                  ? "border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_0_6px_rgba(52,211,153,0.16)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}>
            {hasImg ? (
              <>
                <div className="absolute inset-0 overflow-hidden bg-black">
                  <img src={opt.img} alt={label} loading="lazy"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"
                    }`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                  {active && <div className="absolute inset-0 bg-emerald-400/10 mix-blend-overlay" />}
                </div>
                <div className="relative p-2.5 sm:p-3 h-full min-h-[120px] sm:min-h-[140px] flex flex-col justify-end">
                  <div className={`text-[11px] sm:text-sm font-bold leading-tight drop-shadow-lg tile-ink ${active ? "text-emerald-300" : "text-white"}`}>
                    {label}
                  </div>
                  {sub && (
                    <div className={`text-[10px] mt-0.5 drop-shadow-md tile-ink ${active ? "text-emerald-200/90" : "text-neutral-200"}`}>
                      {sub}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={`p-3 sm:p-4 h-full min-h-[120px] sm:min-h-[140px] flex flex-col ${
                active ? "bg-emerald-400/10" : ""
              }`}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 mb-2 ${active ? "text-emerald-300" : "text-neutral-400"}`} />
                <div className={`text-xs sm:text-sm font-semibold leading-tight ${active ? "text-emerald-200" : "text-white"}`}>
                  {label}
                </div>
                {sub && (
                  <div className={`text-[10px] sm:text-[11px] mt-0.5 ${active ? "text-emerald-400/80" : "text-neutral-400"}`}>
                    {sub}
                  </div>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Overrides CalcCard for emerald theme (step number in green). */
function SimpleCard({ stepNum, label, children, id }) {
  return (
    <div id={id} className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02] p-4 sm:p-5 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
        {stepNum && <span className="text-emerald-400 mr-1.5">{stepNum}</span>}{label}
      </div>
      {children}
    </div>
  );
}

/**
 * Wyliczenie z ludzkim spojnikiem przed ostatnia pozycja. "PETG, TPU 95A,
 * ABS, ASA" czyta sie jak zrzut z bazy, a nie jak zdanie napisane do
 * czlowieka.
 */
function wyliczenie(pozycje, lang) {
  if (pozycje.length < 2) return pozycje.join("");
  const spojnik = lang === "de" ? " oder " : lang === "en" ? " or " : " czy ";
  return pozycje.slice(0, -1).join(", ") + spojnik + pozycje[pozycje.length - 1];
}

/**
 * "TU WYBRALISMY ZA CIEBIE, A WYBOR MASZ OBOK".
 *
 * Karta mowi "Filament: PLA" i dla kogos, kto zna PETG albo TPU, brzmi to
 * jak deklaracja, ze innych nie robimy. Klient nie pisze wtedy z pytaniem,
 * tylko wychodzi, i nie mamy nawet sladu, ze go stracilismy. Milczenie w
 * tym miejscu kosztuje nas wiecej niz jedno zdanie.
 *
 * Zdanie stoi PRZY WYBORZE, a nie w stopce: informacja o alternatywie ma
 * sens tam, gdzie powstaje wrazenie jej braku.
 *
 * Liczba i nazwy ida z cennika (`src/data/advancedOptions.js`), wiec nowy
 * filament sam sie tu pojawi, a usuniety sam zniknie.
 */
function AdvancedHint({ lang, tech, l, onAdvanced, onShop = null, shop = false, keepsFile = false }) {
  const drukowy = tech === "3dprint" || tech === "msla";
  // Przy druku tworzywo nazywamy z imienia w pierwszym zdaniu, wiec z listy
  // parametrow je wyrzucamy: powtorzone brzmialoby jak zajakniecie.
  const params = advancedParams(tech, lang, { bezMaterialu: drukowy });
  const materialy = advancedMaterials(tech, lang);
  const przyklady = advancedExamples(tech, lang);

  const lead = tech === "3dprint" ? l.moreLead3d : tech === "msla" ? l.moreLeadMsla : l.moreLeadLaser;
  const zdanie = materialy.length && przyklady.length
    ? lead.replace("{n}", String(materialy.length)).replace("{ex}", wyliczenie(przyklady, lang))
    : l.moreLeadLaser;

  if (!params.length && !materialy.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <SlidersHorizontal size={13} className="text-neutral-400 shrink-0" />
        <span className="text-[11px] uppercase tracking-wide text-neutral-400">
          {drukowy ? l.moreTitle : l.moreTitleLaser}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-neutral-400">{zdanie}</p>
      {params.length > 0 && (
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-400">
          {l.moreParams.replace("{p}", wyliczenie(params, lang))}
        </p>
      )}
      {/* Obawa, ze przelaczenie trybu zmarnuje wgrany plik, potrafi zatrzymac
          klienta skuteczniej niz sama liczba opcji. Mowimy wprost, ze nie. */}
      {keepsFile && (
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">{l.moreKeepsFile}</p>
      )}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {/* Przycisk, a nie zdanie "przelacz u gory". Odeslanie klienta do
            szukania przelacznika jest instrukcja, a nie droga. */}
        {onAdvanced && (
          <button
            type="button"
            onClick={() => onAdvanced(tech)}
            className="px-3 py-1.5 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-200
                       hover:border-blue-400/60 text-[11.5px] transition-colors"
          >
            {l.moreCta}
          </button>
        )}
        {shop && (
          <Link
            to="/shop/studio/"
            onClick={onShop}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-neutral-300
                       hover:border-white/25 hover:text-white text-[11.5px] transition-colors
                       inline-flex items-center gap-1.5"
          >
            <ShoppingBag size={12} />
            {l.moreShop}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SimpleStudioCalc({ lang = "pl", onAdvanced = null }) {
  const l = LBL[lang] || LBL.en;
  const [item, setItem]         = useState("keychain");
  // Przedzialu wielkosci nie trzymamy juz w stanie: wynika z suwaka (`sizeCm`),
  // a dwa zrodla tej samej prawdy potrafily sie rozjechac, gdy plik ustawial
  // jedno, a klient klikal drugie.
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);
  // Szybka wycena tez przyjmuje pliki, wiec i tu model trzeba sprawdzic.
  // Bez tego klient omija bramke, wybierajac lagodniejsza sciezke.
  const [printability, setPrintability] = useState(null);

  const [material, setMaterial] = useState("idk");
  const [finish, setFinish]     = useState("standard");
  const [quantity, setQuantity] = useState("one");
  // Tylko przy laserze. Podloze uslugi: przedmiot klienta, material klienta
  // albo material nasz. Nie wplywa na wycene, patrz MaterialNotice.
  const [podloze, setPodloze] = useState("our_stock");
  const [spare, setSpare] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  // Material wybrany z naszego magazynu. null znaczy "klient jeszcze nie
  // wybral albo wpisuje wlasny", i wtedy wycena zostaje przy domysle.
  const [stockId, setStockId] = useState(null);
  // Kruszec do odlewu. Srebro i zloto 18k roznia sie w cenie kilkudziesiat
  // razy, wiec tego jednego nie da sie zgadnac za klienta. Domysl jest
  // najtanszy, zeby kwota nigdy nie obiecywala mniej, niz wyjdzie.
  const [alloyId, setAlloyId] = useState(CAST_DEFAULT_ALLOY);
  // Powod, dla ktorego kwoty wiazacej nie ma. Bez niego kafelek "Dodaj do
  // koszyka" swiecil sie na niebiesko, a pod nim nie dzialo sie nic.
  const [cartOffReason, setCartOffReason] = useState(null);

  // Czy przy tym podlozu klient cos do nas wysyla. Z tego samego zrodla
  // korzysta deklaracja dostarczenia w koszyku, wiec panel z adresem
  // paczkomatu pokazuje sie dokladnie wtedy, kiedy jest do czego.
  const przysylaCos = Boolean(SUBSTRATES.find((x) => x.id === podloze)?.przysyla);

  // Zmiana podloza kasuje wybory zwiazane z poprzednim, inaczej po
  // przelaczeniu zostaje wybor niedozwolony przy nowym podlozu.
  function handlePodlozeChange(id) {
    setPodloze(id);
    setSpare("");
    setMaterialNote("");
  }

  // Zmiana kafla materialu ZAWEZA liste ponizej, wiec poprzedni wybor moze
  // przestac do niej nalezec. Sam widok by tego nie pokazal (pozycja znika
  // z listy), ale identyfikator dalej szedlby do wyceny i po cichu zmienial
  // cene: klient widzialby "Drewno" i stawke akrylu. Kasujemy go razem
  // z opisem, bo opis byl etykieta tego wyboru.
  function handleMaterialChange(id) {
    handleSet(setMaterial, "material")(id);
    setStockId(null);
    setMaterialNote("");
  }

  // Smart Upload state
  const [fileType, setFileType] = useState(null); // "stl" | "svg" | null
  const [fileName, setFileName] = useState("");
  const [stlData, setStlData]   = useState(null);
  const [svgData, setSvgData]   = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [fileError, setFileError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Rodzaj pliku, ktory klient zadeklarowal kafelkiem: "mesh" albo "vector".
  // Deklaracja zamiast zgadywania z rozszerzenia, bo od niej zalezy, jakie
  // formaty w ogole pokazujemy w oknie wyboru pliku.
  const [fileMode, setFileMode] = useState(null);
  // Plik przyjety, ale nie do wyceny automatycznej (np. DXF). Jedzie do
  // zapytania, a klient wie o tym od razu, a nie po tygodniu ciszy.
  const [fileForHuman, setFileForHuman] = useState(false);
  // Wielkosc wykonania w centymetrach, najwiekszy wymiar. Suwak steruje nia
  // wprost, a przedzial ("jak moneta", "pudelko po butach") z niej wynika.
  // Osiem centymetrow, czyli srodek przedzialu "jak dlon", ktory byl domyslny
  // przed suwakiem. Punkt startowy zmienia wycene tym, ktorzy pliku nie maja,
  // wiec zostaje tam, gdzie byl.
  const [sizeCm, setSizeCm] = useState(8);

  const hasFile = fileType && (stlData || svgData);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (file.size > 50 * 1024 * 1024) {
      setFileError(true);
      return;
    }
    setFileError(false);
    setFileParsing(true);
    setFileName(file.name);
    setUploadedFile(file);

    setFileForHuman(false);

    try {
      if (MESH_EXT.has(ext)) {
        // Jeden parser na wszystkie formaty siatkowe i na STEP, ten sam, ktorego
        // uzywa tryb zaawansowany i sklep. Wczesniej stal tu parser wylacznie
        // STL, wiec pozostale formaty nie mialy jak zadzialac.
        const { parseMeshAsync } = await import("../../pricing/mesh.js");
        const parsed = await parseMeshAsync(await file.arrayBuffer(), file.name);
        if (!parsed?.triangles?.length) throw new Error("empty");
        setFileType("stl");
        setStlData(parsed);
        setSvgData(null);
        setMaterial("plastic");
        setSizeCm(meshMaxCm(parsed) || 8);
        trackCalc("studio_simple", "file_upload", ext);
      } else if (VECTOR_PRICED_EXT.has(ext)) {
        // Oba parsery oddaja ten sam ksztalt wyniku (bboxMm, pathLengthCm,
        // engravAreaCm2), bo obie drogi karmia ten sam silnik wyceny.
        const parsed = ext === "dxf"
          ? (await import("../../utils/dxfParser.js")).parseDXF(await file.text())
          : (await import("../../utils/svgParser.js")).parseSVG(await file.text());
        setFileType("svg");
        setSvgData(parsed);
        setStlData(null);
        setMaterial("wood");
        setSizeCm(vectorMaxCm(parsed) || 8);
        trackCalc("studio_simple", "file_upload", ext);
      } else {
        // Format przyjmujemy, ale wyceny z niego nie policzymy. Mowimy to wprost.
        setFileType(null);
        setStlData(null);
        setSvgData(null);
        setFileForHuman(true);
        trackCalc("studio_simple", "file_upload", `${ext}_manual`);
      }
    } catch {
      setFileType(null);
      setStlData(null);
      setSvgData(null);
      setFileForHuman(true);
    }
    setFileParsing(false);
  }, []);

  const clearFile = useCallback(() => {
    setFileType(null);
    setFileName("");
    setStlData(null);
    setSvgData(null);
    setUploadedFile(null);
    setFileError(false);
    setFileForHuman(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  // ----------------------------------------------------------
  // WIELKOSC WYKONANIA
  // ----------------------------------------------------------
  // Suwak podaje najwiekszy wymiar w centymetrach. Wszystko inne z niego
  // wynika: skala wzgledem oryginalu z pliku, geometria do wyceny i przedzial
  // ("jak moneta", "pudelko po butach"), ktory pokazujemy jako podpis.
  const originalCm = useMemo(
    () => (fileType === "stl" ? meshMaxCm(stlData) : fileType === "svg" ? vectorMaxCm(svgData) : null),
    [fileType, stlData, svgData]
  );

  // Rozszerzenie wgranego pliku, do etykiety "Wykryto". STL, OBJ, 3MF i STEP/STP
  // ida tym samym parserem, wiec bez tego etykieta zawsze mowila "STL", nawet
  // gdy klient wgral OBJ.
  const EXT_LABEL = { STL: "STL", OBJ: "OBJ", "3MF": "3MF", STEP: "STEP", STP: "STEP", SVG: "SVG", DXF: "DXF" };
  const detectedExtLabel = fileName ? EXT_LABEL[fileName.split(".").pop().toUpperCase()] || null : null;

  // Model po odczycie jest fizycznie nieprawdopodobny (patrz meshUnits.js):
  // najczesciej to plik zapisany w metrach albo centymetrach, a odczytany
  // jako milimetry. Pytamy klienta, zamiast zgadywac za niego.
  const unitOptions = fileType === "stl" && stlData && looksTooSmall(originalCm) ? suspectUnits(originalCm) : [];

  function applyUnitFix(factor, correctedCm) {
    setStlData(scaleMesh(stlData, factor));
    setSizeCm(correctedCm);
  }

  const scale = originalCm ? sizeCm / originalCm : 1;

  // Granica pola roboczego liczona z calej bryly, a nie z jednego wymiaru:
  // czesc za dluga w jednej osi czesto miesci sie po obroceniu.
  //
  // KAZDA MASZYNA MA WLASNE POLE i to nie jest szczegol. Bambu H2D ma
  // 30 x 32 x 32.5 cm, a Saturn 4 Ultra 21.8 x 12.3 x 25 cm, czyli w osi Y
  // niemal trzy razy mniej. Do tej pory szybka wycena sprawdzala ZAWSZE pole
  // drukarki filamentowej, takze po przelaczeniu na zywice, wiec model
  // 20 x 20 cm przechodzil, mimo ze na Saturnie nie ma prawa sie zmiescic.
  // Nic sie nie wywalalo: cena byla, dodanie do koszyka odbijalo sie dopiero
  // o serwer zamowien i to komunikatem, ktory niczego nie tlumaczyl.
  const fitCmFor = (vol) => {
    if (fileType !== "stl" || !stlData?.bbox || !originalCm) return null;
    const max = maxScaleForBuildVolume(stlData.bbox, vol);
    return max ? originalCm * max : null;
  };
  const fitCmFdm = useMemo(() => fitCmFor(BUILD_VOL_CM),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileType, stlData, originalCm]);
  const fitCmMsla = useMemo(() => fitCmFor(MSLA_BUILD_VOL_CM),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileType, stlData, originalCm]);
  // GRANICA KOLBY, liczona tak samo jak pole robocze drukarki wyzej. Bez niej
  // szybka wycena po prostu przestawala podawac kwote i NIE MOWILA DLACZEGO,
  // podczas gdy tryb zaawansowany pokazywal ostrzezenie i przycisk zmniejszenia.
  // Ten sam plik konczyl wiec w dwoch trybach inaczej, co wyglada na usterke,
  // a jest brakiem jednego komunikatu.
  const castFitCm = useMemo(() => {
    if (fileType !== "stl" || !stlData?.bbox || !originalCm) return null;
    const max = maxCastingScaleForBBox(stlData.bbox);
    // Scinamy w dol do promila, tak samo jak suwak w trybie zaawansowanym.
    // Skala dokladnie rowna granicy potrafi po podzieleniu przez wymiar
    // oryginalu wyjsc o ulamek promila za duza i przycisk "zmniejsz" nie
    // przywrocilby ceny, co wygladaloby na zepsuty przycisk.
    return max ? originalCm * (Math.floor(max * 1000) / 1000) : null;
  }, [fileType, stlData, originalCm]);

  const size = categoryForCm(sizeCm);

  // Wybor technologii druku. null znaczy "jak wynika z odpowiedzi", czyli tak,
  // jak dzialalo dotad. Wartosc pojawia sie dopiero, gdy klient sam przelaczy.
  const [printTech, setPrintTech] = useState(null);

  const scaledStl = useMemo(() => scaleMesh(stlData, scale), [stlData, scale]);
  const scaledSvg = useMemo(() => scaleVector(svgData, scale), [svgData, scale]);

  // Stawki materialow z magazynu. Ta sama lista trafia do silnika w
  // przegladarce i na serwerze, wiec kwota na ekranie i kwota wiazaca licza
  // sie z tych samych liczb.
  const materialStock = useMaterialStock();
  // Kursy kruszcow. Potrzebuje ich wylacznie odlew, ale hook musi stac
  // bezwarunkowo, bo React nie pozwala wywolac go pod warunkiem.
  const { rates } = useMarketRates();
  const odpowiedzi = { item, size, material, finish, quantity, fileType, stlData: scaledStl, svgData: scaledSvg, stockId, alloyId, podloze };

  const resolved = useMemo(
    () => resolveTechAndParams({ ...odpowiedzi, printTech }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item, size, material, finish, quantity, fileType, scaledStl, scaledSvg, printTech, stockId, alloyId, podloze]
  );

  // Pole robocze laserow, ten sam wzorzec co pole robocze drukarki (fitCm)
  // wyzej. Dotyczy tylko rysunkow wektorowych, bo bryly licza sie osobno.
  // Wymiary bierzemy z ORYGINALU pliku (svgData.bboxMm w milimetrach), bo
  // `scale` juz niesie stosunek wielkosci wykonania do oryginalu.
  const laserBedFit = useMemo(() => {
    if (fileType !== "svg" || !svgData?.bboxMm) return null;
    const tech = resolved?.tech;
    if (tech !== "co2" && tech !== "fiber") return null;
    return bedFit(svgData.bboxMm, tech, scale);
  }, [fileType, svgData, resolved?.tech, scale]);

  const laserOverPlate = laserBedFit?.fits === false;
  const laserNeedsExtended = laserBedFit?.fits === true && laserBedFit?.needsExtended === true;
  const laserFitCm = laserBedFit?.maxScale != null && originalCm ? originalCm * laserBedFit.maxScale : null;

  // Ciecie kontra grawerowanie CO2. null znaczy "jak wynika z odpowiedzi"
  // (CO2_MODE_FROM_ITEM w simpleQuote.js), tak samo jak printTech dla
  // FDM/MSLA wyzej: wartosc pojawia sie dopiero, gdy klient sam przelaczy.
  const [co2Mode, setCo2Mode] = useState(null);
  // Pytanie "ciecie czy grawerowanie" dotyczy WYLACZNIE lasera CO2. Metal
  // idzie na swiatlowod, ktory tnie tylko cienkie blachy i u nas sluzy do
  // znakowania, wiec przy metalu ta karta nie ma sie z czego wziac i znika.
  // Pilnuje tego `scripts/test-laser-capabilities.mjs`, bo pokazanie tu
  // ciecia obiecywaloby robote, ktorej maszyna nie wykona.
  const isVectorCo2 = fileType === "svg" && resolved?.tech === "co2";

  // KARTA TRYBU ZOSTAJE TAKZE PRZY METALU, tylko ciecie jest w niej wygaszone.
  // Znikajaca sekcja jest gorsza niz wygaszona pozycja: klient nie wie, czy
  // pytanie zniklo, bo odpowiedz jest oczywista, czy dlatego, ze cos zepsul,
  // i nie dowiaduje sie tego, czego naprawde potrzebuje, czyli ze metalu tym
  // laserem NIE PRZETNIEMY. Wygaszony kafelek z powodem uczy oferty; brak
  // kafelka uczy tylko tego, ze interfejs jest nieprzewidywalny.
  const naSwiatlowodzie = fileType === "svg" && resolved?.tech === "fiber";
  const pokazTrybLasera = isVectorCo2 || naSwiatlowodzie;

  // Obie kwoty licza sie tym samym silnikiem, przez `co2Mode`. Kopia
  // mapowania parametrow po stronie widoku rozjechalaby sie z simpleQuote.js
  // przy pierwszej zmianie oferty i nikt by tego nie zauwazyl, bo obie strony
  // nadal generowalyby poprawnie wygladajace liczby.
  const co2CutResult = useMemo(
    () => (isVectorCo2 && !laserOverPlate
      ? runCalc(resolveTechAndParams({ ...odpowiedzi, co2Mode: "cut" }), lang, materialStock, rates)
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVectorCo2, laserOverPlate, lang, item, size, material, finish, quantity, fileType, scaledSvg, stockId, podloze, materialStock, rates]
  );
  const co2EngraveResult = useMemo(
    () => (isVectorCo2 && !laserOverPlate
      ? runCalc(resolveTechAndParams({ ...odpowiedzi, co2Mode: "engrave" }), lang, materialStock, rates)
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVectorCo2, laserOverPlate, lang, item, size, material, finish, quantity, fileType, scaledSvg, stockId, podloze, materialStock, rates]
  );

  // Wybor klienta (kliknieta karta ciecie/grawerowanie) nadpisuje tryb, ktory
  // idzie do wyceny wiazacej i do koszyka. Bez tego karty pokazywalyby dwie
  // kwoty, ale kupic dalej dawaloby sie tylko ta wybrana automatycznie.
  const activeResolved = useMemo(
    () => (isVectorCo2 && co2Mode
      ? resolveTechAndParams({ ...odpowiedzi, co2Mode })
      : resolved),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVectorCo2, co2Mode, resolved, item, size, material, finish, quantity, fileType, scaledSvg, stockId, podloze]
  );

  // JAKIEGO TWORZYWA UZYJEMY. Karta mowila "z filamentu" i "z zywicy", czyli
  // nazywala rodzaj, a nie material. Klient szybkiej wyceny nie ma skad
  // wiedziec, ze filament to kilkanascie roznych tworzyw o roznej cenie
  // i wytrzymalosci, a my i tak juz wybralismy za niego konkretne.
  const tworzywoFdm = useMemo(
    () => resolveTechAndParams({ ...odpowiedzi, printTech: "fdm" })?.params?.materialKey || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item, size, material, finish, quantity, fileType, scaledStl, scaledSvg, stockId]
  );
  const tworzywoMsla = useMemo(() => {
    const klucz = resolveTechAndParams({ ...odpowiedzi, printTech: "msla" })?.params?.resinKey;
    // `label`, a nie `name`: pole `name` w cenniku zywic nie istnieje, wiec
    // karta MSLA po cichu nie pokazywala zadnej zywicy, choc kod wygladal
    // poprawnie i nic nie zglaszalo bledu.
    return klucz ? t(getResin(klucz)?.label, lang) || null : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, size, material, finish, quantity, fileType, scaledStl, scaledSvg, stockId, lang]);

  // Pole roboczej maszyny, ktora realnie wykona ten wydruk.
  const naZywicy = resolved?.tech === "msla";
  const fitCm = naZywicy ? fitCmMsla : fitCmFdm;
  const overPlate = fitCm != null && sizeCm > fitCm + 1e-4;
  const castOverFlask = material === "precious" && castFitCm != null && sizeCm > castFitCm + 1e-4;
  // Model, ktory nie miesci sie na zywicy, ale zmiescilby sie na filamencie.
  // To jest najtansza naprawa, jaka mozemy zaproponowac: jedno klikniecie
  // zamiast zmniejszania wyrobu.
  const zmiescSieNaFdm = naZywicy && overPlate && fitCmFdm != null && sizeCm <= fitCmFdm + 1e-4;

  // Ponad polem roboczym NIE podajemy kwoty. Cena za rzecz, ktorej nie da sie
  // wykonac w calosci, jest obietnica bez pokrycia, a klient dowiedzialby sie
  // o tym dopiero przy realizacji. Zamiast liczby pokazujemy droge.
  const result = useMemo(
    () => (overPlate || laserOverPlate ? { type: "custom" } : runCalc(activeResolved, lang, materialStock, rates)),
    [activeResolved, lang, overPlate, laserOverPlate, materialStock, rates]
  );

  // Druga technologia druku, policzona z TYCH SAMYCH odpowiedzi. Klient
  // szybkiej wyceny czesto nie wie, czym rozni sie filament od zywicy, a
  // roznica dotyczy i wygladu, i ceny. Sama nazwa technologii niczego mu nie
  // mowi; dwie kwoty obok siebie mowia wszystko.
  const drukowe = resolved?.tech === "3dprint" || resolved?.tech === "msla";
  const drugaTech = resolved?.tech === "msla" ? "fdm" : "msla";
  const drugiWynik = useMemo(
    () => (!drukowe || overPlate ? null : runCalc(resolveTechAndParams({ ...odpowiedzi, printTech: drugaTech }), lang, materialStock, rates)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drukowe, drugaTech, overPlate, lang, item, size, material, finish, quantity, fileType, scaledStl, scaledSvg, stockId, materialStock, rates]
  );

  // Przejscie do trybu zaawansowanego zabiera ze soba plik i ustawiona
  // wielkosc. Geometria idzie w skali ORYGINALU, a skala osobno, bo tryb
  // zaawansowany ma wlasny suwak i sam ja nalozy; wyslanie geometrii juz
  // przeskalowanej daloby skalowanie dwa razy i cene z sufitu.
  const zbudujPaczke = useCallback(() => (
    fileType === "stl"
      ? makeHandoff({ kind: "mesh", file: uploadedFile, name: fileName, data: stlData, scale })
      : fileType === "svg"
        ? makeHandoff({ kind: "vector", file: uploadedFile, name: fileName, data: svgData, scale })
        : null
  ), [fileType, uploadedFile, fileName, stlData, svgData, scale]);

  const przekazDoZaawansowanych = useCallback((tech) => {
    if (!onAdvanced) return;
    onAdvanced(tech, zbudujPaczke());
  }, [onAdvanced, zbudujPaczke]);

  // Do sklepu idziemy zmieniajac trase, wiec paczka nie ma jak pojechac
  // propsem. Odkladamy ja do poczekalni, a karta uslugi odbiera ja raz.
  const przekazDoSklepu = useCallback(() => {
    stashHandoff(zbudujPaczke());
  }, [zbudujPaczke]);

  // Szybka wycena otwiera sie domyslnie, wiec bez tego wiekszosc odwiedzajacych
  // w ogole nie widziala drogi do zakupu.
  const cartTarget = useMemo(() => cartTargetFor(activeResolved), [activeResolved]);

  const svgBlobUrl = useMemo(() => {
    if (!svgData?.svgText) return null;
    return URL.createObjectURL(new Blob([svgData.svgText], { type: "image/svg+xml" }));
  }, [svgData?.svgText]);

  useEffect(() => () => { if (svgBlobUrl) URL.revokeObjectURL(svgBlobUrl); }, [svgBlobUrl]);

  const handleSet = (setter, qid) => (v) => {
    setter(v);
    trackCalc("studio_simple", qid, v);
  };

  const STL_ALLOWED_MATS = useMemo(() => new Set(["plastic", "resin", "precious"]), []);
  const SVG_ALLOWED_MATS = useMemo(() => new Set(["wood", "metal", "glass"]), []);
  const matDisabledIds = useMemo(() => {
    if (!hasFile) return undefined;
    const allowed = fileType === "stl" ? STL_ALLOWED_MATS : SVG_ALLOWED_MATS;
    // "NIE WIEM, DORADZCIE" ZOSTAJE AKTYWNE ZAWSZE. Bylo wygaszane wraz
    // z materialami, ktore do pliku nie pasuja, czyli dokladnie w momencie,
    // w ktorym umiemy doradzic najlepiej: plik lezy u nas i widzimy geometrie.
    // Klient, ktory sie nie zna, tracil wtedy jedyna odpowiedz, jaka mial.
    return new Set(MATERIALS.filter(m => m.id !== "idk" && !allowed.has(m.id)).map(m => m.id));
  }, [hasFile, fileType, STL_ALLOWED_MATS, SVG_ALLOWED_MATS]);

  // Materialy, ktore realnie wchodza w gre dla tego, co klient wgral.
  // Wygaszony kafelek mowi "nie ta droga", ale nie mowi, ktora droga tak.
  const matSugerowane = useMemo(() => {
    const allowed = hasFile ? (fileType === "stl" ? STL_ALLOWED_MATS : SVG_ALLOWED_MATS) : null;
    return MATERIALS.filter((m) => m.id !== "idk" && (!allowed || allowed.has(m.id)));
  }, [hasFile, fileType, STL_ALLOWED_MATS, SVG_ALLOWED_MATS]);

  const techLabel = !resolved?.custom && resolved?.tech
    ? t(TECH_BADGE[resolved.tech], lang)
    : null;
  const techRationale = !resolved?.custom && resolved?.tech
    ? t(TECH_RATIONALE[resolved.tech], lang)
    : null;
  const isMslaPath = resolved?.tech === "msla";

  // STL + resin (decorative epoxy cast) but small enough for MSLA precision: suggest it as an alternative
  const showMslaHint = fileType === "stl" && stlData && material === "resin" &&
    Math.max(stlData.bbox.x, stlData.bbox.y, stlData.bbox.z) < 12;

  const paramsSummary = [
    hasFile ? `📁 ${fileName}` : null,
    t(ITEMS.find(i => i.id === item)?.label, lang),
    // Wielkosc podajemy ZAWSZE, takze przy wgranym pliku: klient mogl przesunac
    // suwak, a zapytanie ma opisywac to, co zamawia, a nie to, co bylo w pliku.
    `${t(SIZES.find(s => s.id === size)?.label, lang)}${originalCm ? ` (${sizeCm.toFixed(1)} cm)` : ""}`,
    t(MATERIALS.find(m => m.id === material)?.label, lang),
    t(FINISH.find(f => f.id === finish)?.label, lang),
    t(QUANTITY.find(q => q.id === quantity)?.label, lang),
    techLabel ? `→ ${techLabel}` : "",
  ].filter(Boolean).join(" | ");

  return (
    <div>
      {/* ------------------------------------------------------------------
          KOLEJNOSC PYTAN. Wgrywanie pliku stalo wczesniej PRZED pytaniem, co
          klient chce wykonac, i bylo osobna sekcja. Dla kogos, kto pliku nie ma,
          czyli dla wiekszosci odwiedzajacych, pierwszym ekranem bylo wiec pole,
          ktorego nie da sie wypelnic. Teraz zaczynamy od pytania, a plik jest
          jedna z odpowiedzi na nie.
          ------------------------------------------------------------------ */}
      <SimpleCard stepNum="①" label={l.q1} id="simple-upload">
        {/* Dwie drogi na skroty dla tych, ktorzy maja gotowy projekt */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
          {[
            { id: "mesh", label: l.haveMesh, sub: l.haveMeshSub, icon: FileBox },
            { id: "vector", label: l.haveVector, sub: l.haveVectorSub, icon: Layers },
          ].map((o) => {
            const active = fileMode === o.id;
            // PRZY WGRANYM PLIKU KAFELKI SA WYLACZONE, a nie tylko bezczynne.
            // Wczesniej drugi kafelek dawal sie klikac i podswietlal sie, ale
            // pole wgrywania pokazuje sie wylacznie przy braku pliku, wiec nic
            // sie nie dzialo. Klient widzial reakcje bez skutku, czyli dokladnie
            // to, co czyta sie jako usterke. Rodzaj pliku zmienia sie przez
            // usuniecie pliku krzyzykiem i to jest napisane pod kafelkami.
            const zablokowany = Boolean(hasFile || fileForHuman);
            return (
              <button
                key={o.id}
                type="button"
                disabled={zablokowany}
                aria-disabled={zablokowany || undefined}
                onClick={() => {
                  setFileMode(active ? null : o.id);
                  if (!active) trackCalc("studio_simple", "file_mode", o.id);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                  active
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.02]"
                } ${
                  zablokowany
                    ? "opacity-40 cursor-not-allowed"
                    : active ? "" : "hover:border-emerald-400/40"
                }`}
              >
                <o.icon className={`w-5 h-5 shrink-0 ${active ? "text-emerald-300" : "text-emerald-400/70"}`} />
                <span className="min-w-0">
                  <span className={`block text-xs sm:text-sm font-semibold truncate ${active ? "text-emerald-300" : "text-white"}`}>{o.label}</span>
                  <span className="block text-[10px] text-neutral-400 truncate">{o.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        {(hasFile || fileForHuman) && (
          <p className="-mt-1 mb-3 text-[11px] text-neutral-500 leading-relaxed">{l.q0locked}</p>
        )}

        {/* Pole wgrywania, tylko po zadeklarowaniu rodzaju pliku */}
        {fileMode && !hasFile && !fileForHuman && (
          <div className="mb-3">
            <label
              className={`group relative flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-emerald-400/30 bg-emerald-400/[0.06] hover:border-emerald-400/60 hover:bg-emerald-400/[0.08]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className={`p-3 rounded-full transition-colors ${dragOver ? "bg-emerald-400/20" : "bg-emerald-400/10 group-hover:bg-emerald-400/15"}`}>
                {fileParsing
                  ? <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  : <Upload className={`w-8 h-8 ${dragOver ? "text-emerald-300" : "text-emerald-400 group-hover:text-emerald-300"} transition-colors`} />}
              </div>
              <div className="text-center">
                <div className={`text-sm font-semibold ${dragOver ? "text-emerald-300" : "text-white"}`}>
                  <span className="hidden sm:inline">{l.q0drop}</span>
                  <span className="sm:hidden">{l.q0tap}</span>
                </div>
                <div className="text-[10px] text-emerald-400/60 mt-1">
                  {fileMode === "mesh" ? l.haveMeshSub : l.haveVectorSub}
                </div>
              </div>
              <input
                type="file"
                accept={fileMode === "mesh" ? ACCEPT_MESH : ACCEPT_VECTOR}
                onChange={onInputChange}
                className="sr-only"
              />
            </label>
            {fileError && (
              <div className="mt-2 text-center text-[11px] text-red-400">
                {{ pl: "Plik za duży, maksymalny rozmiar to 50 MB.", en: "File too large, maximum size is 50 MB.", de: "Datei zu groß, maximale Größe beträgt 50 MB." }[lang] || "File too large, max 50 MB."}
              </div>
            )}
          </div>
        )}

        {/* Format przyjety, ale bez wyceny z automatu */}
        {fileForHuman && (
          <div className="mb-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <FileBox className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{fileName}</div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed mt-1">{l.manualOnly}</p>
                </div>
              </div>
              <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0" title={l.q0remove}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wgrany plik: podglad, wymiar oryginalny i wymiar do realizacji */}
        {hasFile && (
          <div className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileBox className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{fileName}</div>
                  <div className="text-[11px] text-emerald-400/80">
                    {l.q0detected}: {fileType === "stl"
                      ? (detectedExtLabel ? `${l.q0model} (${detectedExtLabel})` : l.q0stl)
                      : (detectedExtLabel ? `${l.q0vector} (${detectedExtLabel})` : l.q0svg)}
                  </div>
                </div>
              </div>
              <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0" title={l.q0remove}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {fileType === "stl" && stlData?.triangles && (
              <div className="mb-3">
                <Suspense fallback={<div className="w-full rounded-lg bg-[#eef0f3] border border-black/10 animate-pulse" style={{ height: "200px" }} />}>
                  <STLViewer triangles={stlData.triangles} bbox={stlData.bbox} />
                </Suspense>
              </div>
            )}

            {/* DXF nie niesie obrazka, tylko wspolrzedne. Zamiast pustej
                czarnej ramki, ktora wyglada jak awaria, mowimy wprost, ze
                podgladu nie bedzie, a geometrie odczytalismy. */}
            {fileType === "svg" && !svgBlobUrl && svgData && (
              <p className="mb-3 text-[11px] text-neutral-500 leading-relaxed">{l.dxfNoPreview}</p>
            )}

            {/* Blok, ktorego nie rozwijamy, to kawalek rysunku, ktorego nie
                policzylismy. Milczenie o tym zaniżyloby cene bez sladu. */}
            {svgData?.blocksSkipped > 0 && (
              <p className="mb-3 text-[11px] text-amber-200/80 leading-relaxed">{l.dxfBlocks}</p>
            )}

            {fileType === "svg" && svgBlobUrl && (
              <VectorPreview
                src={svgBlobUrl}
                contentBox={svgData?.contentBox || null}
                canvasBox={svgData?.canvasBox || null}
                lang={lang}
                height={180}
                className="mb-3"
              />
            )}

            {/* DWA WYMIARY, JEDEN POD DRUGIM. Klient musi widziec, co przyszlo
                w pliku i co z tego wykonamy. Gdy suwak stoi na oryginale, oba
                wiersze pokazuja to samo i to tez jest informacja. */}
            <dl className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Ruler className="w-3 h-3 text-emerald-400/60 shrink-0" />
                <dt>{l.dimOriginal}:</dt>
                <dd className="text-white">
                  {fileType === "stl" && stlData
                    ? `${stlData.bbox.x.toFixed(1)}×${stlData.bbox.y.toFixed(1)}×${stlData.bbox.z.toFixed(1)} cm`
                    : `${svgData.bboxMm.x.toFixed(1)}×${svgData.bboxMm.y.toFixed(1)} mm`}
                </dd>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Maximize2 className="w-3 h-3 text-emerald-400/60 shrink-0" />
                <dt>{l.dimTarget}:</dt>
                <dd className="text-emerald-200 font-medium">
                  {fileType === "stl" && scaledStl
                    ? `${scaledStl.bbox.x.toFixed(1)}×${scaledStl.bbox.y.toFixed(1)}×${scaledStl.bbox.z.toFixed(1)} cm`
                    : `${scaledSvg.bboxMm.x.toFixed(1)}×${scaledSvg.bboxMm.y.toFixed(1)} mm`}
                  <span className="text-neutral-400 font-normal"> ({t(SIZES.find(s => s.id === size)?.label, lang)})</span>
                </dd>
              </div>
              {fileType === "stl" && scaledStl && (
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Layers className="w-3 h-3 text-emerald-400/60 shrink-0" />
                  <dt>{l.q0vol}:</dt>
                  <dd className="text-white">{scaledStl.volumeCm3.toFixed(1)} cm³</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Model odczytany jako nieprawdopodobnie maly. STL/OBJ nie niosa
            jednostki, wiec zgadujemy zamiast liczyc cene z grudki 2 mm. */}
        {unitOptions.length > 0 && (
          <div className="mb-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <h4 className="text-sm font-semibold text-amber-200">
                {l.unitTitle} {originalCm.toFixed(1)} {l.unitTitleSuffix}
              </h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">{l.unitText}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {unitOptions.map((u) => (
                <button
                  key={u.id}
                  onClick={() => applyUnitFix(u.factor, u.correctedCm)}
                  className="px-3 py-2 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors"
                >
                  {l.unitRead} {t(u.label, lang)} ({u.correctedCm.toFixed(1)} cm)
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">{l.unitClose}</p>
          </div>
        )}

        {/* Po wgraniu pliku kafelki znikaja calkowicie: klient ma juz plik,
            wiec wybor przedmiotu obok podgladu modelu czytal sie jak druga,
            konkurencyjna odpowiedz na to samo pytanie i mylil. `item` zostaje
            w stanie na swojej domyslnej wartosci ("keychain"), bo nadal
            steruje materialem i technologia (patrz DEFAULT_TECH_FROM_ITEM /
            CO2_MODE_FROM_ITEM w simpleQuote.js) - bez tego wycena po wgraniu
            pliku spadlaby do { custom: true }. */}
        {!hasFile && (
          <TileGrid options={ITEMS} value={item} onChange={handleSet(setItem, "item")} lang={lang} cols={4} />
        )}
      </SimpleCard>

      {/* Wielkosc zaraz pod plikiem, zeby bylo widac zaleznosc: to suwak
          rozstrzyga, co wykonamy, a wgranie pliku tylko ustawia go na oryginale. */}
      <SimpleCard stepNum="②" label={l.q2}>
        <SizeSlider
          valueCm={sizeCm}
          onChange={(cm) => { setSizeCm(cm); trackCalc("studio_simple", "size_cm", String(Math.round(cm))); }}
          originalCm={originalCm}
          fitCm={fitCm ?? laserFitCm}
          lang={lang}
        />

        {overPlate && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <h4 className="text-sm font-semibold text-amber-200">
                {naZywicy ? l.overPlateTitleMsla : l.overPlateTitle}
              </h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">
              {naZywicy ? l.overPlateTextMsla : l.overPlateText}
            </p>
            {/* Przejscie na filament jest najtansza naprawa, jaka mozemy
                zaproponowac: jedno klikniecie zamiast zmniejszania wyrobu.
                Dlatego stoi PRZED przyciskiem zmniejszania, a nie za nim. */}
            {zmiescSieNaFdm && (
              <button
                onClick={() => { setPrintTech("fdm"); trackCalc("studio_simple", "switch_to_fdm", String(Math.round(sizeCm))); }}
                className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 px-4 py-2 rounded-lg bg-emerald-400/15 border border-emerald-400/40 text-emerald-200 text-xs font-semibold hover:bg-emerald-400/25 transition-colors"
              >
                {l.overPlateSwitchFdm}
              </button>
            )}
            <button
              onClick={() => { setSizeCm(fitCm); trackCalc("studio_simple", "fit_to_plate", String(Math.round(fitCm))); }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors"
            >
              {l.overPlateFit} ({fitCm.toFixed(1)} cm)
            </button>
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-3">{l.overPlateSplit}</p>
          </div>
        )}

        {/* KOLBA ODLEWNICZA, ten sam wzorzec co pole robocze drukarki i lasera.
            Wczesniej model ponad limit po prostu przestawal miec cene i szybka
            wycena nic o tym nie mowila, a tryb zaawansowany pokazywal
            ostrzezenie i przycisk zmniejszenia. Ten sam plik konczyl w dwoch
            trybach inaczej i wygladalo to jak usterka jednego z nich. */}
        {castOverFlask && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <h4 className="text-sm font-semibold text-amber-200">{l.castOverFlaskTitle}</h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">{l.castOverFlaskText}</p>
            <button
              onClick={() => { setSizeCm(castFitCm); trackCalc("studio_simple", "fit_to_flask", String(Math.round(castFitCm * 10))); }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors"
            >
              {l.castOverFlaskFit} ({castFitCm.toFixed(1)} cm)
            </button>
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-3">{l.castOverFlaskNote}</p>
          </div>
        )}

        {/* Pole robocze lasera, ten sam wzorzec co pole robocze drukarki
            wyzej: bez ceny wiazacej dla rysunku, ktory nie miesci sie w
            calosci, tylko droga (pomniejsz) i informacja o wycenie
            indywidualnej. */}
        {laserOverPlate && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <h4 className="text-sm font-semibold text-amber-200">{l.laserOverPlateTitle}</h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">
              {resolved?.tech === "fiber" ? l.laserOverPlateTextFiber : l.laserOverPlateTextCo2}
            </p>
            {laserFitCm != null && (
              <button
                onClick={() => { setSizeCm(laserFitCm); trackCalc("studio_simple", "fit_to_laser_bed", String(Math.round(laserFitCm))); }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors"
              >
                {l.laserOverPlateFit} ({laserFitCm.toFixed(1)} cm)
              </button>
            )}
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-3">{l.laserOverPlateCustom}</p>
          </div>
        )}

        {/* Miesci sie, ale tylko przez przelotke z podajnikiem: cena zostaje
            (silnik CO2 juz to liczy przez flage `extended`), tu tylko
            uprzedzamy, ze przygotowanie trwa dluzej. */}
        {!laserOverPlate && laserNeedsExtended && (
          <p className="mt-4 text-[11px] text-amber-200/80 leading-relaxed">{l.laserExtendedNote}</p>
        )}
      </SimpleCard>

      {/* Technologia druku. Do tej pory wybieralismy ja po cichu, a klient
          szybkiej wyceny czesto nie wie, ze filament i zywica to dwie rozne
          rzeczy: inny wyglad, inna wytrzymalosc, inna cena. Dostawal wiec
          wyrob, ktorego sie nie spodziewal, i nie mial jak tego przewidziec.
          Nazwa technologii sama w sobie nic mu nie mowi, wiec kazda karta
          niesie zdanie o tym, do czego sie nadaje, i wlasna kwote. */}
      {drukowe && (
        <SimpleCard stepNum="◆" label={l.techQ}>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { id: "fdm", tech: "3dprint", nazwa: l.techFdmName, opis: l.techFdmDesc, tworzywo: tworzywoFdm, etykieta: l.filamentLbl },
              { id: "msla", tech: "msla", nazwa: l.techMslaName, opis: l.techMslaDesc, tworzywo: tworzywoMsla, etykieta: l.resinLbl },
            ].map((o) => {
              const aktywna = resolved?.tech === o.tech;
              const wynik = aktywna ? result : drugiWynik;
              const kwota = wynik?.type === "calculated"
                ? `${wynik.perPcPLN ? (lang === "pl" ? `${wynik.perPcPLN.min} - ${wynik.perPcPLN.max} PLN` : `${wynik.perPcEUR.min} - ${wynik.perPcEUR.max} EUR`) : ""}`
                : null;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPrintTech(o.id)}
                  aria-pressed={aktywna}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    aktywna ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <div className={`text-sm font-medium ${aktywna ? "text-emerald-300" : "text-neutral-200"}`}>{o.nazwa}</div>
                  <div className="text-[11px] text-neutral-500 leading-tight mt-1">{o.opis}</div>
                  {o.tworzywo && (
                    <div className="text-[11px] text-neutral-400 mt-1.5">
                      <span className="text-neutral-500">{o.etykieta}:</span> {o.tworzywo}
                    </div>
                  )}
                  {kwota && (
                    <div className={`text-xs mt-2 font-medium ${aktywna ? "text-emerald-300" : "text-neutral-400"}`}>{kwota}</div>
                  )}
                  {aktywna && printTech === null && (
                    <div className="text-[10px] text-neutral-600 mt-1">{l.techAuto}</div>
                  )}
                </button>
              );
            })}
          </div>

          <AdvancedHint
            lang={lang}
            tech={resolved?.tech === "msla" ? "msla" : "3dprint"}
            l={l}
            onAdvanced={onAdvanced ? przekazDoZaawansowanych : null}
            shop
            onShop={przekazDoSklepu}
            keepsFile={Boolean(hasFile)}
          />
        </SimpleCard>
      )}

      {/* Ciecie kontra grawerowanie CO2, ten sam wzorzec co wyzej: klient
          czesto nie wie, ze to dwie rozne uslugi (jedna zostawia gotowy
          element, druga tylko rysunek na powierzchni), wiec kazda karta
          niesie wlasny opis i wlasna kwote policzona z tych samych
          odpowiedzi. */}
      {pokazTrybLasera && (
        <SimpleCard stepNum="◆" label={l.co2ModeQ}>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { id: "cut", nazwa: l.co2CutName, opis: l.co2CutDesc, wynik: co2CutResult },
              { id: "engrave", nazwa: l.co2EngraveName, opis: l.co2EngraveDesc, wynik: naSwiatlowodzie ? result : co2EngraveResult },
            ].map((o) => {
              // Swiatlowod znakuje powierzchnie i u nas nie tnie, wiec przy
              // metalu grawer jest wybrany, a ciecie wylaczone razem z fokusem:
              // kafelek, ktory sie podswietla i nic nie robi, wyglada na
              // usterke, a nie na informacje.
              const wylaczona = naSwiatlowodzie && o.id === "cut";
              const aktywna = naSwiatlowodzie
                ? o.id === "engrave"
                : (co2Mode || resolved?.mode) === o.id;
              const kwota = !wylaczona && o.wynik?.type === "calculated"
                ? (lang === "pl" ? `${o.wynik.perPcPLN.min} - ${o.wynik.perPcPLN.max} PLN` : `${o.wynik.perPcEUR.min} - ${o.wynik.perPcEUR.max} EUR`)
                : null;
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={wylaczona}
                  onClick={() => { if (!wylaczona) setCo2Mode(o.id); }}
                  aria-pressed={aktywna}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    wylaczona
                      ? "border-white/10 bg-white/[0.02] opacity-40 cursor-not-allowed"
                      : aktywna ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <div className={`text-sm font-medium ${aktywna ? "text-emerald-300" : "text-neutral-200"}`}>{o.nazwa}</div>
                  <div className="text-[11px] text-neutral-500 leading-tight mt-1">{o.opis}</div>
                  {kwota && (
                    <div className={`text-xs mt-2 font-medium ${aktywna ? "text-emerald-300" : "text-neutral-400"}`}>{kwota}</div>
                  )}
                  {wylaczona && (
                    <div className="text-[10px] text-neutral-500 mt-2 leading-tight">{l.co2CutOffMetal}</div>
                  )}
                  {aktywna && !naSwiatlowodzie && co2Mode === null && (
                    <div className="text-[10px] text-neutral-600 mt-1">{l.techAuto}</div>
                  )}
                </button>
              );
            })}
          </div>
        </SimpleCard>
      )}

      <SimpleCard stepNum="③" label={l.q3}>
        <TileGrid options={MATERIALS} value={material} onChange={handleMaterialChange} lang={lang} cols={3} disabledIds={matDisabledIds} />

        {/* "Nie wiem" nie moze byc slepym zaulkiem. Mowimy, co wchodzi w gre,
            i pozwalamy wybrac od razu, zamiast odsylac klienta do maila. */}
        {material === "idk" && (
          <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-4">
            <p className="text-emerald-200 text-xs font-medium mb-1">
              {t(hasFile ? IDK_TITLE_FILE : IDK_TITLE, lang)}
            </p>
            <p className="text-neutral-400 text-[11px] leading-relaxed mb-3">{t(IDK_HINT, lang)}</p>
            <div className="flex flex-wrap gap-2">
              {matSugerowane.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMaterialChange(m.id)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-neutral-300
                             hover:border-white/25 hover:text-white text-xs transition-colors"
                >
                  {t(m.label, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

          {/* Kruszec to jedyna rzecz, ktorej przy odlewie nie wolno zgadnac:
              srebro i zloto 18k roznia sie w cenie kilkudziesiat razy. Pytamy
              wiec o niego tuz pod kaflem, a nie w szostym pytaniu dla
              wszystkich, bo pozostalych technologii to nie dotyczy. */}
          {material === "precious" && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(ALLOY_LBL, lang)}</div>
              <Chips options={CASTING_METALS} value={alloyId} onChange={handleSet(setAlloyId, "alloy")} lang={lang} />
              <p className="text-neutral-400 text-[11px] leading-relaxed mt-3">
                {t(hasFile ? CAST_HINT_FILE : CAST_HINT_NO_FILE, lang)}
              </p>
            </div>
          )}

          {/* JEDEN BLOK MATERIALU, A NIE DWA.
              Wczesniej klient wybieral material tutaj, a nizej, w panelu
              wyceny, pytalismy go o material drugi raz. Wygladalo to jak
              usterka formularza: skoro juz odpowiedzial, po co znowu.
              Teraz to jest doprecyzowanie pierwszego wyboru, stoi tuz pod
              nim i zmienia sie zaleznie od tego, kto dostarcza podloze. */}
          {(resolved?.tech === "co2" || resolved?.tech === "fiber") && (
            <div className="mt-5 pt-5 border-t border-white/10">
              {/* Panel dostawy niesie tylko ten, kto nam cos wysyla. Przy
                  materiale z naszego magazynu klient nie wysyla nic, wiec
                  adres paczkomatu zajmowal mu glowe bez powodu. */}
              <MaterialNotice lang={lang} className="mb-4" delivery={przysylaCos} />

              <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(SUBSTRATE_LABEL, lang)}</div>
              <Chips options={SUBSTRATES} value={podloze} onChange={handlePodlozeChange} lang={lang} />

              {podloze === "our_stock" ? (
                <StockPicker
                  options={stockOptions({ tech: activeResolved?.tech, mode: activeResolved?.mode, material })}
                  value={stockAllowed(stockId, { tech: activeResolved?.tech, mode: activeResolved?.mode, material }) ? stockId : null}
                  note={materialNote}
                  onPick={(id, etykieta) => { setStockId(id); setMaterialNote(etykieta); }}
                  onOther={() => { setStockId(null); setMaterialNote(""); }}
                  onNote={setMaterialNote}
                  lang={lang}
                />
              ) : (
                <>
                  {/* Przy WLASNYM materiale pytamy, co przyjedzie, a przy
                      WLASNYM PRZEDMIOCIE, co to za rzecz. To nie jest to samo
                      pytanie: arkusz opisuje sie gatunkiem i gruboscia,
                      a zegarek ksztaltem i miejscem graweru. Pole jest
                      nieobowiazkowe, bo opis zlecenia nizej i tak jest
                      wymagany i to on blokuje zakup. */}
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">
                      {t(podloze === "own_item" ? ITEM_NOTE_LBL : OWN_STOCK_NOTE_LBL, lang)}
                    </div>
                    <textarea
                      value={materialNote}
                      onChange={(e) => setMaterialNote(e.target.value)}
                      placeholder={t(podloze === "own_item" ? ITEM_NOTE_PLACEHOLDER : OWN_STOCK_NOTE_PLACEHOLDER, lang)}
                      rows={2}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 resize-none transition-colors"
                    />
                  </div>

                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(SPARE_LABEL, lang)}</div>
                    <Chips options={spareOptionsFor(podloze)} value={spare} onChange={setSpare} lang={lang} />
                  </div>
                </>
              )}

              <AdvancedHint lang={lang} tech={resolved?.tech} l={l} onAdvanced={onAdvanced ? przekazDoZaawansowanych : null} keepsFile={Boolean(hasFile)} />
            </div>
          )}
      </SimpleCard>

      <SimpleCard stepNum="④" label={l.q4}>
        <TileGrid options={FINISH} value={finish} onChange={handleSet(setFinish, "finish")} lang={lang} cols={3} />
      </SimpleCard>

      <SimpleCard stepNum="⑤" label={l.q5}>
        <TileGrid options={QUANTITY} value={quantity} onChange={handleSet(setQuantity, "quantity")} lang={lang} cols={4} />
      </SimpleCard>

      {/* MSLA hint for small resin STL uploads */}
      {showMslaHint && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/15 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-[12px] leading-relaxed text-emerald-400/70">{l.mslaHint}</div>
        </div>
      )}

      {/* License notice, MSLA figurine/miniature path only */}
      {isMslaPath && <LicenseNotice lang={lang} />}

      {/* Suggested tech badge */}
      {techLabel && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-[12px] leading-relaxed">
            <div className="text-emerald-300 font-semibold mb-0.5">
              {l.suggestion}: <span className="text-emerald-200">{techLabel}</span>
            </div>
            <div className="text-emerald-400/70">{techRationale}</div>
          </div>
        </div>
      )}

      {/* Result */}
      <div id={hasFile ? "file-upload" : undefined} className="rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-400/[0.04] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        {stlData?.triangles?.length > 0 && (resolved?.tech === "3dprint" || resolved?.tech === "msla") && (
          <PrintabilityGate
            triangles={stlData.triangles}
            tech={resolved.tech === "msla" ? "msla" : "fdm"}
            nozzleId={nozzleFromPrecision(resolved.params?.precisionId)}
            lang={lang}
            fileName={fileName || null}
            // Suwak wielkosci realnie skaluje model, wiec analiza musi isc na
            // tej skali. Bez tego suwak zmienialby cene, a grubosc scianek
            // ocenialibysmy nadal po oryginale z pliku.
            scale={scale}
            onResult={setPrintability}
          />
        )}
        <NextStepPanel
          lang={lang}
          tech={activeResolved?.tech || null}
          techLabel={
            // NAZWA IDZIE DO MAILA KLIENTA, wiec musi byc w jezyku strony.
            // Wpisana na sztywno po polsku dawala list, w ktorym naglowek i
            // lista wyborow byly po angielsku, a nazwa wyceny po polsku.
            // Nic sie nie wywalalo: mail przychodzil i byl czytelny.
            techLabel ? `${l.quickQuote} - ${techLabel}` : l.quickQuote
          }
          paramsSummary={paramsSummary}
          result={result}
          printability={printability}
          fileScale={scale}
          preAttachedFile={uploadedFile}
          requireLicenseConsent={isMslaPath}
          cartAvailable={!overPlate && !laserOverPlate && !fileForHuman && !cartOffReason}
          cartOffReason={cartOffReason}
          cart={
            cartTarget ? (
              <CalcToCart
                embedded
                onBinding={setBindingGrosze}
                onUnavailable={setCartOffReason}
                // Plik glowny jedzie do koszyka. Bez tego koszyk prosil o ten
                // sam rysunek drugi raz i blokowal zakup, dopoki klient nie
                // wgral go ponownie.
                file={uploadedFile}
                triangles={fileType === "stl" ? stlData?.triangles || null : null}
                scale={scale}
                calculator={cartTarget.calculator}
                serviceId={cartTarget.serviceId}
                params={{
                  ...activeResolved.params,
                  // Bez listy trojkatow. Serwer i tak ja wyrzuca i podstawia
                  // wlasny pomiar z pliku, a po drodze potrafila wywrocic
                  // zapytanie o cene swoim rozmiarem.
                  ...(activeResolved.params?.stlData ? { stlData: meshForPricing(activeResolved.params.stlData) } : {}),
                  ...((activeResolved?.tech === "co2" || activeResolved?.tech === "fiber") ? { podloze, spare, materialNote } : {}),
                  ...(printability ? { printability } : {}),
                }}
                lang={lang}
                hold={Boolean(printability?.blocked && !printability?.accepted)}
              />
            ) : null
          }
        />
        {/* Zdanie "przelacz u gory" bylo instrukcja bez drogi: klient musial
            sam znalezc przelacznik i zaczac od nowa. Teraz to jest przycisk,
            ktory otwiera wlasciwa zakladke trybu zaawansowanego. */}
        <div className="mt-4 pt-3 border-t border-emerald-400/10 text-center">
          {onAdvanced ? (
            <button
              type="button"
              onClick={() => przekazDoZaawansowanych(activeResolved?.tech)}
              className="text-[11px] text-emerald-400/70 hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              {l.moreCta}
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400/60 italic">{l.switchHint}</span>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02] text-[11px] text-emerald-400/50 leading-relaxed text-center">
        {l.note}
      </div>
    </div>
  );
}

/**
 * WYBOR MATERIALU Z NASZEGO MAGAZYNU zamiast pustego pola tekstowego.
 *
 * Puste pole trafialo w osobe, ktora wlasnie dlatego wybrala szybka wycene,
 * ze na materialach sie nie zna, i dostawalo odpowiedzi w rodzaju "cos
 * z drewna". Lista pochodzi z cennika, wiec kazda pozycja ma stawke i wybor
 * realnie zmienia kwote, zamiast tylko ladniej wygladac.
 *
 * "Inny material" zostaje na koncu, bo nasza lista nie wyczerpuje swiata,
 * a odebranie klientowi mozliwosci opisania czegos wlasnego byloby zamiana
 * jednej blokady na druga.
 */
function StockPicker({ options, value, note, onPick, onOther, onNote, lang }) {
  const wlasny = !value;
  if (!options.length) {
    // Technologia bez listy w cenniku. Lepiej zapytac otwarcie, niz pokazac
    // puste kafelki i udawac, ze wybor istnieje.
    return (
      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(MATERIAL_NOTE_LBL, lang)}</div>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={t(MATERIAL_NOTE_PLACEHOLDER, lang)}
          rows={2}
          minLength={MIN_MATERIAL_NOTE}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 resize-none transition-colors"
        />
      </div>
    );
  }

  const kafelek = (aktywny) =>
    `px-3 py-2 rounded-xl border text-xs transition-colors text-left ${
      aktywny
        ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
        : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:text-white"
    }`;

  return (
    <div className="mt-3">
      <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(STOCK_LBL, lang)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" className={kafelek(value === o.id)} onClick={() => onPick(o.id, t(o.label, lang))}>
            {t(o.label, lang)}
          </button>
        ))}
        <button key={STOCK_OTHER} type="button" className={kafelek(wlasny)} onClick={onOther}>
          {t(STOCK_OTHER_LBL, lang)}
        </button>
      </div>

      {wlasny && (
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={t(MATERIAL_NOTE_PLACEHOLDER, lang)}
          rows={2}
          minLength={MIN_MATERIAL_NOTE}
          className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 resize-none transition-colors"
        />
      )}

      <p className="text-neutral-500 text-[11px] mt-2 leading-relaxed">{t(STOCK_HINT, lang)}</p>
    </div>
  );
}
