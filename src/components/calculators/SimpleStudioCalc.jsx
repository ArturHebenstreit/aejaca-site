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
} from "lucide-react";
import {
  QUANTITY_TIERS, t, Chips, CalcCard, ResultHeader, ResultDisplay, LicenseNotice, NextStepPanel,
} from "./calcShared.jsx";
import CalcToCart from "./CalcToCart.jsx";
import MaterialNotice from "../MaterialNotice.jsx";
import {
  SUBSTRATE_LABEL, SUBSTRATES, SPARE_LABEL, spareOptionsFor, MIN_MATERIAL_NOTE,
} from "../../data/laserSubstrate.js";

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
import { resolveTechAndParams, runCalc } from "../../pricing/simpleQuote.js";
import { scaleMesh, scaleVector, meshMaxCm, vectorMaxCm } from "../../pricing/scaleGeometry.js";
import { looksTooSmall, suspectUnits } from "../../pricing/meshUnits.js";
import { BUILD_VOL_CM, maxScaleForBuildVolume } from "../../pricing/print3d.js";
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
const VECTOR_PRICED_EXT = new Set(["svg"]);

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
  { id: "glass",   icon: GlassWater, img: "/img/calc/studio_materials/glass.webp",   label: { pl: "Szkło / kamień", en: "Glass / stone", de: "Glas / Stein" } },
  { id: "resin",   icon: Droplet,    img: "/img/calc/studio_materials/resin.webp",   label: { pl: "Żywica",        en: "Resin",          de: "Harz" } },
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

const TECH_BADGE = {
  "3dprint": { pl: "Druk 3D",    en: "3D Print",     de: "3D-Druck" },
  "co2":     { pl: "Laser CO2",  en: "CO2 Laser",    de: "CO2-Laser" },
  "fiber":   { pl: "Laser Fiber", en: "Fiber Laser",  de: "Faserlaser" },
  "epoxy":   { pl: "Żywica",      en: "Resin casting", de: "Harzguss" },
  "msla":    { pl: "Żywica MSLA", en: "MSLA Resin",   de: "MSLA-Harz" },
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
    q0detected: "Wykryto", q0stl: "Model 3D (STL)", q0model: "Model 3D", q0svg: "Grafika wektorowa (SVG)",
    q0dims: "Wymiary", q0vol: "Objętość", q0area: "Powierzchnia", q0paths: "Ścieżki",
    q0remove: "Usuń plik", q0selected: "Wybrano", q0selSize: "Rozmiar", q0selMat: "Materiał",
    unitTitle: "Ten model ma po odczycie", unitTitleSuffix: "cm",
    unitText: "Pliki STL i OBJ nie zapisują jednostki, więc czytamy je jako milimetry - a ten plik prawdopodobnie zapisano inaczej.",
    unitRead: "Czytaj w", unitClose: "Jeśli żadna z tych wartości nie pasuje, wielkość można ustawić suwakiem poniżej.",
    haveMesh: "Mam gotowy plik 3D", haveMeshSub: "STL, OBJ, 3MF, STEP",
    haveVector: "Mam gotowy plik wektorowy", haveVectorSub: "SVG, DXF, AI, PDF",
    dimOriginal: "Wymiar oryginalny", dimTarget: "Wymiar do realizacji",
    manualOnly: "Ten format przyjmujemy, ale ceny z niego nie policzymy automatycznie. Dołączymy plik do zapytania i odpowiemy z wyceną.",
    overPlateTitle: "Ta wielkość nie zmieści się w całości na naszym stole",
    overPlateText: "Największa maszyna ma pole robocze 30 x 32 x 32,5 cm. Są dwa wyjścia i oba u nas działają.",
    overPlateFit: "Zmniejsz do największej, która się mieści",
    overPlateSplit: "Zostaw tę wielkość i poproś o wycenę: przy dużych obiektach tniemy model na części i sklejamy po wydruku. Szew planujemy na krawędzi, żeby go nie było widać.",
    q1file: "Do czego to służy?", q1fileHint: "Od tego zależy materiał i technologia, nie wielkość.",
    q1: "Co chcesz wykonać?", q2: "Jak duże?", q3: "Z jakiego materiału?", q4: "Jakość wykonania?", q5: "Ile sztuk?",
    suggestion: "Sugerowana technologia",
    why: "Dlaczego?",
    switchHint: 'Chcesz podać dokładniejsze parametry? Przełącz na tryb "Dla zaawansowanych" u góry.',
    note: 'Tryb Szybkiej Wyceny dobiera technologię i parametry automatycznie - dla dokładnej kontroli użyj trybu zaawansowanego.',
    mslaHint: "Ten model zmieści się na drukarce żywicznej MSLA 16K, to opcja z wyższą precyzją i gładszą powierzchnią niż odlew z żywicy.",
  },
  en: {
    q0: "Got a file ready?", q0hint: "Drop an STL or SVG file - we'll quote it automatically",
    q0drop: "Drag your file here", q0tap: "Tap to choose a file", q0or: "or click to browse", q0accept: ".stl, .obj, .3mf, .step, .svg, .dxf, .ai, .pdf",
    q0skip: "No file - I'll describe what I need",
    q0detected: "Detected", q0stl: "3D model (STL)", q0model: "3D model", q0svg: "Vector graphic (SVG)",
    q0dims: "Dimensions", q0vol: "Volume", q0area: "Area", q0paths: "Paths",
    q0remove: "Remove file", q0selected: "Selected", q0selSize: "Size", q0selMat: "Material",
    unitTitle: "This model reads as", unitTitleSuffix: "cm",
    unitText: "STL and OBJ files do not store a unit, so we read them as millimeters - this file was probably saved differently.",
    unitRead: "Read in", unitClose: "If none of these values fits, you can set the size with the slider below.",
    haveMesh: "I have a 3D file", haveMeshSub: "STL, OBJ, 3MF, STEP",
    haveVector: "I have a vector file", haveVectorSub: "SVG, DXF, AI, PDF",
    dimOriginal: "Original size", dimTarget: "Size we will make",
    manualOnly: "We accept this format, but we cannot price it automatically. We will attach the file to your enquiry and come back with a quote.",
    overPlateTitle: "This size will not fit our build plate in one piece",
    overPlateText: "The largest machine has a 30 x 32 x 32.5 cm build volume. There are two ways out and we do both.",
    overPlateFit: "Scale down to the largest that fits",
    overPlateSplit: "Keep this size and ask for a quote: on large objects we split the model and bond the parts after printing. We place the seam on an edge so it does not show.",
    q1file: "What is it for?", q1fileHint: "This drives the material and the technology, not the size.",
    q1: "What do you want to make?", q2: "How big?", q3: "What material?", q4: "Quality?", q5: "How many?",
    suggestion: "Suggested technology",
    why: "Why?",
    switchHint: 'Want more precise parameters? Switch to "Advanced" mode at the top.',
    note: 'Quick Quote mode picks technology and parameters automatically - for full control, use the advanced mode.',
    mslaHint: "This model fits the MSLA 16K resin printer, an option with higher precision and a smoother surface than a resin cast.",
  },
  de: {
    q0: "Haben Sie eine Datei?", q0hint: "Laden Sie eine STL- oder SVG-Datei hoch - wir kalkulieren automatisch",
    q0drop: "Datei hierher ziehen", q0tap: "Tippen um Datei auszuwählen", q0or: "oder klicken zum Auswählen", q0accept: ".stl, .obj, .3mf, .step, .svg, .dxf, .ai, .pdf",
    q0skip: "Keine Datei - ich beschreibe was ich brauche",
    q0detected: "Erkannt", q0stl: "3D-Modell (STL)", q0model: "3D-Modell", q0svg: "Vektorgrafik (SVG)",
    q0dims: "Maße", q0vol: "Volumen", q0area: "Fläche", q0paths: "Pfade",
    q0remove: "Datei entfernen", q0selected: "Ausgewählt", q0selSize: "Größe", q0selMat: "Material",
    unitTitle: "Dieses Modell wird gelesen als", unitTitleSuffix: "cm",
    unitText: "STL- und OBJ-Dateien speichern keine Einheit, wir lesen sie daher als Millimeter - diese Datei wurde wahrscheinlich anders gespeichert.",
    unitRead: "Lesen in", unitClose: "Wenn keiner dieser Werte passt, können Sie die Größe mit dem Regler unten einstellen.",
    haveMesh: "Ich habe eine 3D-Datei", haveMeshSub: "STL, OBJ, 3MF, STEP",
    haveVector: "Ich habe eine Vektordatei", haveVectorSub: "SVG, DXF, AI, PDF",
    dimOriginal: "Originalmaß", dimTarget: "Maß für die Ausführung",
    manualOnly: "Dieses Format nehmen wir an, automatisch kalkulieren können wir es aber nicht. Wir hängen die Datei an Ihre Anfrage und melden uns mit einem Angebot.",
    overPlateTitle: "Diese Größe passt nicht am Stück auf unsere Bauplatte",
    overPlateText: "Die größte Maschine hat einen Bauraum von 30 x 32 x 32,5 cm. Es gibt zwei Wege und beide gehen wir.",
    overPlateFit: "Auf die größte passende Größe verkleinern",
    overPlateSplit: "Diese Größe behalten und ein Angebot anfragen: bei großen Objekten teilen wir das Modell und fügen die Teile nach dem Druck. Die Naht legen wir auf eine Kante, damit sie nicht auffällt.",
    q1file: "Wofür ist es?", q1fileHint: "Davon hängen Material und Technologie ab, nicht die Größe.",
    q1: "Was möchten Sie herstellen?", q2: "Wie groß?", q3: "Welches Material?", q4: "Qualität?", q5: "Wie viele?",
    suggestion: "Empfohlene Technologie",
    why: "Warum?",
    switchHint: 'Genauere Parameter? Wechseln Sie oben in den "Fortgeschrittenen"-Modus.',
    note: 'Der Schnellkalkulationsmodus wählt Technologie und Parameter automatisch - für volle Kontrolle verwenden Sie den erweiterten Modus.',
    mslaHint: "Dieses Modell passt auf den MSLA-16K-Harzdrucker, eine Option mit höherer Präzision und glatterer Oberfläche als ein Harzguss.",
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
                  ? "border-emerald-400 shadow-lg shadow-emerald-400/20"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}>
            {hasImg ? (
              <>
                <div className="absolute inset-0 overflow-hidden bg-black">
                  <img src={opt.img} alt={label} loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      active ? "scale-105" : "group-hover:scale-105"
                    }`} />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/65 to-transparent" />
                  {active && <div className="absolute inset-0 bg-emerald-400/10 mix-blend-overlay" />}
                </div>
                <div className="relative p-2.5 sm:p-3 h-full min-h-[120px] sm:min-h-[140px] flex flex-col justify-end">
                  <div className={`text-[11px] sm:text-sm font-bold leading-tight drop-shadow-lg ${active ? "text-emerald-300" : "text-white"}`}>
                    {label}
                  </div>
                  {sub && (
                    <div className={`text-[10px] mt-0.5 drop-shadow-md ${active ? "text-emerald-200/90" : "text-neutral-200"}`}>
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

export default function SimpleStudioCalc({ lang = "pl" }) {
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

  // Zmiana podloza kasuje wybory zwiazane z poprzednim, inaczej po
  // przelaczeniu zostaje wybor niedozwolony przy nowym podlozu.
  function handlePodlozeChange(id) {
    setPodloze(id);
    setSpare("");
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
        const { parseSVG } = await import("../../utils/svgParser.js");
        const parsed = parseSVG(await file.text());
        setFileType("svg");
        setSvgData(parsed);
        setStlData(null);
        setMaterial("wood");
        setSizeCm(vectorMaxCm(parsed) || 8);
        trackCalc("studio_simple", "file_upload", "svg");
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
  const EXT_LABEL = { STL: "STL", OBJ: "OBJ", "3MF": "3MF", STEP: "STEP", STP: "STEP" };
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
  const fitCm = useMemo(() => {
    if (fileType !== "stl" || !stlData?.bbox || !originalCm) return null;
    const max = maxScaleForBuildVolume(stlData.bbox, BUILD_VOL_CM);
    return max ? originalCm * max : null;
  }, [fileType, stlData, originalCm]);

  const overPlate = fitCm != null && sizeCm > fitCm + 1e-4;

  const size = categoryForCm(sizeCm);

  const scaledStl = useMemo(() => scaleMesh(stlData, scale), [stlData, scale]);
  const scaledSvg = useMemo(() => scaleVector(svgData, scale), [svgData, scale]);

  const resolved = useMemo(
    () => resolveTechAndParams({ item, size, material, finish, quantity, fileType, stlData: scaledStl, svgData: scaledSvg }),
    [item, size, material, finish, quantity, fileType, scaledStl, scaledSvg]
  );

  // Ponad polem roboczym NIE podajemy kwoty. Cena za rzecz, ktorej nie da sie
  // wykonac w calosci, jest obietnica bez pokrycia, a klient dowiedzialby sie
  // o tym dopiero przy realizacji. Zamiast liczby pokazujemy droge.
  const result = useMemo(
    () => (overPlate ? { type: "custom" } : runCalc(resolved, lang)),
    [resolved, lang, overPlate]
  );

  // Szybka wycena otwiera sie domyslnie, wiec bez tego wiekszosc odwiedzajacych
  // w ogole nie widziala drogi do zakupu.
  const cartTarget = useMemo(() => cartTargetFor(resolved), [resolved]);

  const svgBlobUrl = useMemo(() => {
    if (!svgData?.svgText) return null;
    return URL.createObjectURL(new Blob([svgData.svgText], { type: "image/svg+xml" }));
  }, [svgData?.svgText]);

  useEffect(() => () => { if (svgBlobUrl) URL.revokeObjectURL(svgBlobUrl); }, [svgBlobUrl]);

  const handleSet = (setter, qid) => (v) => {
    setter(v);
    trackCalc("studio_simple", qid, v);
  };

  const STL_ALLOWED_MATS = useMemo(() => new Set(["plastic", "resin"]), []);
  const SVG_ALLOWED_MATS = useMemo(() => new Set(["wood", "metal", "glass"]), []);
  const matDisabledIds = useMemo(() => {
    if (!hasFile) return undefined;
    const allowed = fileType === "stl" ? STL_ALLOWED_MATS : SVG_ALLOWED_MATS;
    return new Set(MATERIALS.filter(m => !allowed.has(m.id)).map(m => m.id));
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
      <SimpleCard stepNum="①" label={hasFile ? l.q1file : l.q1} id="simple-upload">
        {/* Dwie drogi na skroty dla tych, ktorzy maja gotowy projekt */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
          {[
            { id: "mesh", label: l.haveMesh, sub: l.haveMeshSub, icon: FileBox },
            { id: "vector", label: l.haveVector, sub: l.haveVectorSub, icon: Layers },
          ].map((o) => {
            const active = fileMode === o.id;
            return (
              <button
                key={o.id}
                onClick={() => {
                  // Przy wgranym pliku kafelka nie odklikujemy: znikneloby pole
                  // wgrywania, a plik zostalby na ekranie i klient nie wiedzialby,
                  // co wlasnie zrobil. Od usuwania jest krzyzyk na karcie pliku.
                  if (hasFile || fileForHuman) { setFileMode(o.id); return; }
                  setFileMode(active ? null : o.id);
                  if (!active) trackCalc("studio_simple", "file_mode", o.id);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                  active
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.02] hover:border-emerald-400/40"
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
                    {l.q0detected}: {fileType === "stl" ? (detectedExtLabel ? `${l.q0model} (${detectedExtLabel})` : l.q0stl) : l.q0svg}
                  </div>
                </div>
              </div>
              <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0" title={l.q0remove}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {fileType === "stl" && stlData?.triangles && (
              <div className="mb-3">
                <Suspense fallback={<div className="w-full rounded-lg bg-[#0c1222] border border-emerald-400/10 animate-pulse" style={{ height: "200px" }} />}>
                  <STLViewer triangles={stlData.triangles} bbox={stlData.bbox} />
                </Suspense>
              </div>
            )}

            {fileType === "svg" && svgBlobUrl && (
              <div className="mb-3 w-full rounded-lg overflow-hidden bg-[#0c1222] border border-emerald-400/10 flex items-center justify-center" style={{ height: "160px" }}>
                <img src={svgBlobUrl} alt="SVG" className="max-w-full max-h-full p-3 opacity-90" style={{ filter: "invert(1) hue-rotate(180deg)" }} />
              </div>
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

        {/* Kafelki zostaja takze po wgraniu pliku, bo od tego, CO to jest,
            zalezy material i technologia: czesc techniczna dostaje filament
            inzynieryjny, breloczek nie.
            Zmienia sie natomiast PYTANIE. Przy pustym ekranie brzmi "co chcesz
            wykonac", czyli jest wyborem przedmiotu. Po wgraniu pliku ten sam
            wybor obok podgladu modelu czytal sie jak druga, konkurencyjna
            odpowiedz na to samo pytanie, wiec klient nie wiedzial, co wlasciwie
            zamawia. Teraz brzmi "do czego to sluzy" i jest doprecyzowaniem. */}
        {hasFile && (
          <p className="text-[11px] text-neutral-500 mb-2">{l.q1fileHint}</p>
        )}
        <TileGrid options={ITEMS} value={item} onChange={handleSet(setItem, "item")} lang={lang} cols={4} />
      </SimpleCard>

      {/* Wielkosc zaraz pod plikiem, zeby bylo widac zaleznosc: to suwak
          rozstrzyga, co wykonamy, a wgranie pliku tylko ustawia go na oryginale. */}
      <SimpleCard stepNum="②" label={l.q2}>
        <SizeSlider
          valueCm={sizeCm}
          onChange={(cm) => { setSizeCm(cm); trackCalc("studio_simple", "size_cm", String(Math.round(cm))); }}
          originalCm={originalCm}
          fitCm={fitCm}
          lang={lang}
        />

        {overPlate && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <h4 className="text-sm font-semibold text-amber-200">{l.overPlateTitle}</h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">{l.overPlateText}</p>
            <button
              onClick={() => { setSizeCm(fitCm); trackCalc("studio_simple", "fit_to_plate", String(Math.round(fitCm))); }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors"
            >
              {l.overPlateFit} ({fitCm.toFixed(1)} cm)
            </button>
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-3">{l.overPlateSplit}</p>
          </div>
        )}
      </SimpleCard>

      <SimpleCard stepNum="③" label={l.q3}>
        <TileGrid options={MATERIALS} value={material} onChange={handleSet(setMaterial, "material")} lang={lang} cols={3} disabledIds={matDisabledIds} />
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
        {/* Tylko przy laserze. Przy druku 3D materiał jest NASZ i wchodzi
            w cenę, więc ta sama informacja byłaby tam po prostu nieprawdą. */}
        {(resolved?.tech === "co2" || resolved?.tech === "fiber") && (
          <>
            <MaterialNotice lang={lang} className="mb-4" />
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(SUBSTRATE_LABEL, lang)}</div>
              <Chips options={SUBSTRATES} value={podloze} onChange={handlePodlozeChange} lang={lang} />
              {podloze !== "our_stock" ? (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(SPARE_LABEL, lang)}</div>
                  <Chips options={spareOptionsFor(podloze)} value={spare} onChange={setSpare} lang={lang} />
                </div>
              ) : (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-wide text-emerald-400/60 mb-2">{t(MATERIAL_NOTE_LBL, lang)}</div>
                  <textarea
                    value={materialNote}
                    onChange={(e) => setMaterialNote(e.target.value)}
                    placeholder={t(MATERIAL_NOTE_PLACEHOLDER, lang)}
                    rows={2}
                    minLength={MIN_MATERIAL_NOTE}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 resize-none transition-colors"
                  />
                </div>
              )}
            </div>
          </>
        )}
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} />
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
          techLabel={techLabel ? `Szybka wycena - ${techLabel}` : "Szybka wycena"}
          paramsSummary={paramsSummary}
          result={result}
          printability={printability}
          fileScale={scale}
          preAttachedFile={uploadedFile}
          requireLicenseConsent={isMslaPath}
          cartAvailable={!overPlate && !fileForHuman}
          cart={
            cartTarget ? (
              <CalcToCart
                embedded
                onBinding={setBindingGrosze}
                calculator={cartTarget.calculator}
                serviceId={cartTarget.serviceId}
                params={{
                  ...resolved.params,
                  ...((resolved?.tech === "co2" || resolved?.tech === "fiber") ? { podloze, spare, materialNote } : {}),
                  ...(printability ? { printability } : {}),
                }}
                lang={lang}
                hold={Boolean(printability?.blocked && !printability?.accepted)}
              />
            ) : null
          }
        />
        <div className="mt-4 pt-3 border-t border-emerald-400/10 text-[11px] text-emerald-400/60 italic text-center">
          {l.switchHint}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02] text-[11px] text-emerald-400/50 leading-relaxed text-center">
        {l.note}
      </div>
    </div>
  );
}
