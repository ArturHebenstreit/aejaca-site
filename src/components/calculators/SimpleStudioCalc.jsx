// ============================================================
// SIMPLE STUDIO CALCULATOR — "Szybka wycena" for laypeople
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
  Lightbulb, Upload, X, FileBox, Ruler, Layers,
} from "lucide-react";
import {
  QUANTITY_TIERS, t, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm,
} from "./calcShared.jsx";
import { calculate as calcPrint3D } from "./Print3DCalc.jsx";
import { calcEngrave as calcCO2Engrave, calcCut as calcCO2Cut } from "./CO2LaserCalc.jsx";
import { calculate as calcFiber } from "./FiberLaserCalc.jsx";
import { calculate as calcEpoxy } from "./EpoxyCastCalc.jsx";
import { trackCalc } from "../../utils/analytics.js";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

function autoSizeFromCm(maxCm) {
  if (maxCm <= 3) return "coin";
  if (maxCm <= 10) return "palm";
  if (maxCm <= 25) return "book";
  if (maxCm <= 40) return "box";
  return "bigger";
}

// ============================================================
// QUESTIONS & OPTIONS
// ============================================================

const ITEMS = [
  { id: "keychain", icon: KeyRound,    img: "/img/calc/studio_items/keychain.png", label: { pl: "Breloczek", en: "Keychain", de: "Schlüsselanhänger" } },
  { id: "sign",     icon: BookText,    img: "/img/calc/studio_items/sign.png",     label: { pl: "Tabliczka / szyld", en: "Plate / sign", de: "Schild" } },
  { id: "figurine", icon: Sparkles,    img: "/img/calc/studio_items/figurine.png", label: { pl: "Figurka / model", en: "Figurine / model", de: "Figur / Modell" } },
  { id: "stamp",    icon: Stamp,       img: "/img/calc/studio_items/stamp.png",    label: { pl: "Pieczątka", en: "Stamp", de: "Stempel" } },
  { id: "gift",     icon: Gift,        img: "/img/calc/studio_items/gift.png",     label: { pl: "Prezent / dekoracja", en: "Gift / decoration", de: "Geschenk / Deko" } },
  { id: "part",     icon: Cog,         img: "/img/calc/studio_items/part.png",     label: { pl: "Część techniczna", en: "Technical part", de: "Technisches Teil" } },
  { id: "jewelry",  icon: Gem,         img: "/img/calc/studio_items/jewelry.png",  label: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck" } },
  { id: "other",    icon: HelpCircle,  label: { pl: "Coś innego", en: "Something else", de: "Etwas anderes" } },
];

const SIZES = [
  { id: "coin",   icon: Circle,    img: "/img/calc/studio_sizes/coin.png",   label: { pl: "Jak moneta", en: "Coin-sized", de: "Münzgröße" },          sub: { pl: "do 3 cm",      en: "up to 3 cm",  de: "bis 3 cm" } },
  { id: "palm",   icon: Hand,      img: "/img/calc/studio_sizes/palm.png",   label: { pl: "Jak dłoń",    en: "Palm-sized", de: "Handflächengröße" },   sub: { pl: "3–10 cm",      en: "3–10 cm",     de: "3–10 cm" } },
  { id: "book",   icon: Book,      img: "/img/calc/studio_sizes/book.png",   label: { pl: "Jak książka", en: "Book-sized", de: "Buchgröße" },          sub: { pl: "10–25 cm",     en: "10–25 cm",    de: "10–25 cm" } },
  { id: "box",    icon: Package,   img: "/img/calc/studio_sizes/box.png",    label: { pl: "Pudełko po butach", en: "Shoebox",  de: "Schuhkarton" },    sub: { pl: "25–40 cm",     en: "25–40 cm",    de: "25–40 cm" } },
  { id: "bigger", icon: Maximize2, img: "/img/calc/studio_sizes/bigger.png", label: { pl: "Większe",     en: "Bigger",     de: "Größer" },             sub: { pl: "powyżej 40 cm", en: "over 40 cm", de: "über 40 cm" } },
];

const MATERIALS = [
  { id: "plastic", icon: Boxes,      img: "/img/calc/studio_materials/plastic.png", label: { pl: "Plastik",       en: "Plastic",        de: "Kunststoff" } },
  { id: "wood",    icon: TreePine,   img: "/img/calc/studio_materials/wood.png",    label: { pl: "Drewno",        en: "Wood",           de: "Holz" } },
  { id: "metal",   icon: Wrench,     img: "/img/calc/studio_materials/metal.png",   label: { pl: "Metal",         en: "Metal",          de: "Metall" } },
  { id: "glass",   icon: GlassWater, img: "/img/calc/studio_materials/glass.png",   label: { pl: "Szkło / kamień", en: "Glass / stone", de: "Glas / Stein" } },
  { id: "resin",   icon: Droplet,    img: "/img/calc/studio_materials/resin.png",   label: { pl: "Żywica",        en: "Resin",          de: "Harz" } },
  { id: "idk",     icon: HelpCircle, label: { pl: "Nie wiem — doradźcie", en: "I'm not sure — advise me", de: "Weiß nicht — beraten Sie mich" } },
];

const FINISH = [
  { id: "prototype", icon: ZapOff,      img: "/img/calc/studio_finish/prototype.png", label: { pl: "Prototyp",  en: "Prototype", de: "Prototyp" },  sub: { pl: "tanio i szybko", en: "cheap & fast", de: "günstig & schnell" } },
  { id: "standard",  icon: ShieldCheck, img: "/img/calc/studio_finish/standard.png",  label: { pl: "Standard",  en: "Standard",  de: "Standard" },  sub: { pl: "dobra jakość",   en: "good quality", de: "gute Qualität" } },
  { id: "premium",   icon: Award,       img: "/img/calc/studio_finish/premium.png",   label: { pl: "Premium",   en: "Premium",   de: "Premium" },   sub: { pl: "najwyższa jakość", en: "top quality", de: "höchste Qualität" } },
];

const QUANTITY = [
  { id: "one",  icon: Hash,    label: { pl: "1 sztuka",     en: "1 piece",      de: "1 Stück" } },
  { id: "few",  icon: Users,   label: { pl: "Kilka",        en: "A few",        de: "Einige" },        sub: { pl: "2–10",  en: "2–10",  de: "2–10"  } },
  { id: "many", icon: Factory, label: { pl: "Wiele",        en: "Many",         de: "Viele" },         sub: { pl: "11–50", en: "11–50", de: "11–50" } },
  { id: "lots", icon: Truck,   label: { pl: "Mnóstwo",      en: "Lots",         de: "Sehr viele" },    sub: { pl: "50+",   en: "50+",   de: "50+"   } },
];

// ============================================================
// MAPPING ENGINE — layperson answers → advanced params
// ============================================================

const TECH_FROM_MATERIAL = {
  plastic: "3dprint",
  wood:    "co2",
  metal:   "fiber",
  glass:   "co2",
  resin:   "epoxy",
};

const DEFAULT_TECH_FROM_ITEM = {
  keychain: "3dprint",
  sign:     "co2",
  figurine: "3dprint",
  stamp:    "co2",
  gift:     "co2",
  part:     "3dprint",
  jewelry:  "fiber",
};

const SIZE_MAP = {
  coin:   { "3dprint": "XS", co2: "XS", fiber: "XS", epoxy: "XS" },
  palm:   { "3dprint": "S",  co2: "S",  fiber: "S",  epoxy: "S"  },
  book:   { "3dprint": "M",  co2: "M",  fiber: "M",  epoxy: "M"  },
  box:    { "3dprint": "L",  co2: "L",  fiber: "L",  epoxy: "L"  },
  bigger: { "3dprint": "XL", co2: "XL", fiber: "XL", epoxy: "XL" },
};

const QTY_MAP = { one: "proto", few: "micro", many: "medium", lots: "large" };

const CO2_MODE_FROM_ITEM = {
  keychain: "cut",
  sign:     "engrave",
  figurine: "cut",
  stamp:    "engrave",
  gift:     "engrave",
  part:     "cut",
  jewelry:  "engrave",
};

/** Given Simple-Mode answers, return { tech, mode?, params } or { custom: true } */
export function resolveTechAndParams({ item, size, material, finish, quantity, fileType, stlData, svgData }) {
  // STL always means 3D printing — override material choice
  if (fileType === "stl" && stlData) {
    if (!item || !finish || !quantity) return { custom: true };
    const quantityId = QTY_MAP[quantity];
    const isEngineering = item === "part" && (finish === "premium" || finish === "standard");
    const segment = isEngineering ? "engineering" : "standard";
    const materialKey = segment === "engineering"
      ? (finish === "premium" ? "PPA-CF" : "PA6-CF")
      : (finish === "premium" ? "PLA Silk" : "PLA");
    return {
      tech: "3dprint", params: {
        segment, materialKey,
        sizeId: "M",
        infillId: finish === "prototype" ? "low" : "medium",
        colorId: 1,
        precisionId: finish === "prototype" ? "draft_04" : finish === "premium" ? "quality_04" : "standard_04",
        quantityId,
        stlData,
      },
    };
  }

  // SVG — route based on material (CO2 or Fiber)
  if (fileType === "svg" && svgData) {
    if (!item || !material || !finish || !quantity) return { custom: true };
    const tech = material === "idk" ? DEFAULT_TECH_FROM_ITEM[item] : TECH_FROM_MATERIAL[material];
    if (!tech || tech === "epoxy") return { custom: true };
    const quantityId = QTY_MAP[quantity];

    if (tech === "3dprint") {
      // SVG doesn't make sense for 3D print — reroute to CO2
      const mode = CO2_MODE_FROM_ITEM[item] || "engrave";
      if (mode === "engrave") {
        return { tech: "co2", mode, params: { matId: "wood", areaId: "M", detailId: finish === "prototype" ? "simple" : finish === "premium" ? "photo" : "standard", quantityId, svgData } };
      }
      return { tech: "co2", mode, params: { matId: "ply3", pathId: "M", complexId: finish === "prototype" ? "simple" : finish === "premium" ? "complex" : "moderate", quantityId, extended: false, svgData } };
    }

    if (tech === "co2") {
      const mode = CO2_MODE_FROM_ITEM[item] || "engrave";
      if (mode === "engrave") {
        const matId = material === "glass" ? "glass" : material === "wood" ? "wood" : item === "stamp" ? "rubber" : "wood";
        return { tech, mode, params: { matId, areaId: "M", detailId: finish === "prototype" ? "simple" : finish === "premium" ? "photo" : "standard", quantityId, svgData } };
      }
      const matId = material === "glass" ? "acr3" : finish === "premium" ? "ply5" : "ply3";
      return { tech, mode, params: { matId, pathId: "M", complexId: finish === "prototype" ? "simple" : finish === "premium" ? "complex" : "moderate", quantityId, extended: false, svgData } };
    }

    if (tech === "fiber") {
      if (material === "glass") {
        return resolveTechAndParams({ item, size: "palm", material: "wood", finish, quantity, fileType, svgData });
      }
      const matId = item === "jewelry" ? "silver" : "stainless";
      return { tech, params: { matId, lensId: "150mm", markId: finish === "prototype" ? "surface" : finish === "premium" ? "medium" : "surface", areaId: "M", quantityId, svgData } };
    }

    return { custom: true };
  }

  // No file — original logic
  if (!item || item === "other" || !size || !material || !finish || !quantity) {
    return { custom: true };
  }

  const tech = material === "idk" ? DEFAULT_TECH_FROM_ITEM[item] : TECH_FROM_MATERIAL[material];
  if (!tech) return { custom: true };

  const sizeId = SIZE_MAP[size][tech];
  const quantityId = QTY_MAP[quantity];

  if (tech === "3dprint") {
    const isEngineering = item === "part" && (finish === "premium" || finish === "standard");
    const segment = isEngineering ? "engineering" : "standard";
    const materialKey = segment === "engineering"
      ? (finish === "premium" ? "PPA-CF" : "PA6-CF")
      : (finish === "premium" ? "PLA Silk" : "PLA");
    return {
      tech, params: {
        segment, materialKey,
        sizeId,
        infillId: finish === "prototype" ? "low" : "medium",
        colorId: 1,
        precisionId: finish === "prototype" ? "draft_04" : finish === "premium" ? "quality_04" : "standard_04",
        quantityId,
      },
    };
  }

  if (tech === "co2") {
    const mode = CO2_MODE_FROM_ITEM[item] || "engrave";
    if (mode === "engrave") {
      const matId = material === "glass" ? "glass" : material === "wood" ? "wood" :
                    item === "stamp" ? "rubber" : "wood";
      return {
        tech, mode, params: {
          matId, areaId: sizeId,
          detailId: finish === "prototype" ? "simple" : finish === "premium" ? "photo" : "standard",
          quantityId,
        },
      };
    } else {
      const matId = material === "glass" ? "acr3" :
                    finish === "premium" ? "ply5" : "ply3";
      return {
        tech, mode, params: {
          matId, pathId: sizeId,
          complexId: finish === "prototype" ? "simple" : finish === "premium" ? "complex" : "moderate",
          quantityId, extended: false,
        },
      };
    }
  }

  if (tech === "fiber") {
    if (material === "glass") {
      return resolveTechAndParams({ item, size, material: "wood", finish, quantity });
    }
    const matId = item === "jewelry" ? "silver" : "stainless";
    const fiberSize = SIZE_MAP[size].fiber;
    const lensId = (size === "coin") ? "70mm" : "150mm";
    return {
      tech, params: {
        matId, lensId,
        markId: finish === "prototype" ? "surface" : finish === "premium" ? "medium" : "surface",
        areaId: fiberSize,
        quantityId,
      },
    };
  }

  if (tech === "epoxy") {
    return {
      tech, params: {
        resinId: finish === "prototype" ? "uv" : "epoxy_clear",
        volumeId: sizeId,
        moldId: quantity === "one" ? "existing" : "new_s",
        inclusionId: "none",
        finishId: finish === "prototype" ? "raw" : finish === "premium" ? "coated" : "sanded",
        quantityId,
      },
    };
  }

  return { custom: true };
}

function runCalc(resolved, lang) {
  if (!resolved || resolved.custom) return { type: "custom" };
  const { tech, mode, params } = resolved;
  if (tech === "3dprint") return calcPrint3D(params, lang);
  if (tech === "co2")     return mode === "cut" ? calcCO2Cut(params, lang) : calcCO2Engrave(params, lang);
  if (tech === "fiber")   return calcFiber(params, lang);
  if (tech === "epoxy")   return calcEpoxy(params, lang);
  return null;
}

// ============================================================
// UI — emerald-themed tile grid
// ============================================================

const TECH_BADGE = {
  "3dprint": { pl: "Druk 3D",    en: "3D Print",     de: "3D-Druck" },
  "co2":     { pl: "Laser CO2",  en: "CO2 Laser",    de: "CO2-Laser" },
  "fiber":   { pl: "Laser Fiber", en: "Fiber Laser",  de: "Faserlaser" },
  "epoxy":   { pl: "Żywica",      en: "Resin casting", de: "Harzguss" },
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
};

const LBL = {
  pl: {
    q0: "Masz gotowy plik?", q0hint: "Wrzuć plik STL lub SVG — wycenimy automatycznie",
    q0drop: "Przeciągnij plik tutaj", q0or: "lub kliknij, aby wybrać", q0accept: ".stl, .svg",
    q0skip: "Nie mam pliku — opiszę co potrzebuję",
    q0detected: "Wykryto", q0stl: "Model 3D (STL)", q0svg: "Grafika wektorowa (SVG)",
    q0dims: "Wymiary", q0vol: "Objętość", q0area: "Powierzchnia", q0paths: "Ścieżki",
    q0remove: "Usuń plik", q0sizeAuto: "Rozmiar obliczony z pliku",
    q1: "Co chcesz wykonać?", q2: "Jak duże?", q3: "Z jakiego materiału?", q4: "Jakość wykonania?", q5: "Ile sztuk?",
    suggestion: "Sugerowana technologia",
    why: "Dlaczego?",
    switchHint: 'Chcesz podać dokładniejsze parametry? Przełącz na tryb "Dla zaawansowanych" u góry.',
    note: 'Tryb Szybkiej Wyceny dobiera technologię i parametry automatycznie — dla dokładnej kontroli użyj trybu zaawansowanego.',
  },
  en: {
    q0: "Got a file ready?", q0hint: "Drop an STL or SVG file — we'll quote it automatically",
    q0drop: "Drag your file here", q0or: "or click to browse", q0accept: ".stl, .svg",
    q0skip: "No file — I'll describe what I need",
    q0detected: "Detected", q0stl: "3D model (STL)", q0svg: "Vector graphic (SVG)",
    q0dims: "Dimensions", q0vol: "Volume", q0area: "Area", q0paths: "Paths",
    q0remove: "Remove file", q0sizeAuto: "Size calculated from file",
    q1: "What do you want to make?", q2: "How big?", q3: "What material?", q4: "Quality?", q5: "How many?",
    suggestion: "Suggested technology",
    why: "Why?",
    switchHint: 'Want more precise parameters? Switch to "Advanced" mode at the top.',
    note: 'Quick Quote mode picks technology and parameters automatically — for full control, use the advanced mode.',
  },
  de: {
    q0: "Haben Sie eine Datei?", q0hint: "Laden Sie eine STL- oder SVG-Datei hoch — wir kalkulieren automatisch",
    q0drop: "Datei hierher ziehen", q0or: "oder klicken zum Auswählen", q0accept: ".stl, .svg",
    q0skip: "Keine Datei — ich beschreibe was ich brauche",
    q0detected: "Erkannt", q0stl: "3D-Modell (STL)", q0svg: "Vektorgrafik (SVG)",
    q0dims: "Maße", q0vol: "Volumen", q0area: "Fläche", q0paths: "Pfade",
    q0remove: "Datei entfernen", q0sizeAuto: "Größe aus Datei berechnet",
    q1: "Was möchten Sie herstellen?", q2: "Wie groß?", q3: "Welches Material?", q4: "Qualität?", q5: "Wie viele?",
    suggestion: "Empfohlene Technologie",
    why: "Warum?",
    switchHint: 'Genauere Parameter? Wechseln Sie oben in den "Fortgeschrittenen"-Modus.',
    note: 'Der Schnellkalkulationsmodus wählt Technologie und Parameter automatisch — für volle Kontrolle verwenden Sie den erweiterten Modus.',
  },
};

/** Emerald-themed tile grid — pure visual, used for all 5 questions. */
function TileGrid({ options, value, onChange, lang, cols = 4 }) {
  const gridCls = cols === 3
    ? "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
    : "grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3";
  return (
    <div className={gridCls}>
      {options.map(opt => {
        const active = value === opt.id;
        const Icon = opt.icon;
        const label = t(opt.label, lang);
        const sub = opt.sub ? t(opt.sub, lang) : null;
        const hasImg = !!opt.img;

        return (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[120px] sm:min-h-[140px] ${
              active
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
                  <div className={`text-[10px] sm:text-[11px] mt-0.5 ${active ? "text-emerald-400/80" : "text-neutral-500"}`}>
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
  const [size, setSize]         = useState("palm");
  const [material, setMaterial] = useState("idk");
  const [finish, setFinish]     = useState("standard");
  const [quantity, setQuantity] = useState("one");

  // Smart Upload state
  const [fileType, setFileType] = useState(null); // "stl" | "svg" | null
  const [fileName, setFileName] = useState("");
  const [stlData, setStlData]   = useState(null);
  const [svgData, setSvgData]   = useState(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const hasFile = fileType && (stlData || svgData);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    setFileParsing(true);
    setFileName(file.name);

    if (ext === "stl") {
      const { parseSTL } = await import("../../utils/stlParser.js");
      const buf = await file.arrayBuffer();
      const parsed = parseSTL(buf);
      setFileType("stl");
      setStlData(parsed);
      setSvgData(null);
      setMaterial("plastic");
      const maxCm = Math.max(parsed.bbox.x, parsed.bbox.y, parsed.bbox.z);
      setSize(autoSizeFromCm(maxCm));
      trackCalc("studio_simple", "file_upload", "stl");
    } else if (ext === "svg") {
      const { parseSVG } = await import("../../utils/svgParser.js");
      const text = await file.text();
      const parsed = parseSVG(text);
      setFileType("svg");
      setSvgData(parsed);
      setStlData(null);
      setMaterial("wood");
      const maxCm = Math.max(parsed.bboxMm.x, parsed.bboxMm.y) / 10;
      setSize(autoSizeFromCm(maxCm));
      trackCalc("studio_simple", "file_upload", "svg");
    }
    setFileParsing(false);
  }, []);

  const clearFile = useCallback(() => {
    setFileType(null);
    setFileName("");
    setStlData(null);
    setSvgData(null);
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

  const resolved = useMemo(
    () => resolveTechAndParams({ item, size, material, finish, quantity, fileType, stlData, svgData }),
    [item, size, material, finish, quantity, fileType, stlData, svgData]
  );
  const result = useMemo(() => runCalc(resolved, lang), [resolved, lang]);

  const svgBlobUrl = useMemo(() => {
    if (!svgData?.svgText) return null;
    return URL.createObjectURL(new Blob([svgData.svgText], { type: "image/svg+xml" }));
  }, [svgData?.svgText]);

  useEffect(() => () => { if (svgBlobUrl) URL.revokeObjectURL(svgBlobUrl); }, [svgBlobUrl]);

  const handleSet = (setter, qid) => (v) => {
    setter(v);
    trackCalc("studio_simple", qid, v);
  };

  const techLabel = !resolved?.custom && resolved?.tech
    ? t(TECH_BADGE[resolved.tech], lang)
    : null;
  const techRationale = !resolved?.custom && resolved?.tech
    ? t(TECH_RATIONALE[resolved.tech], lang)
    : null;

  const paramsSummary = [
    hasFile ? `📁 ${fileName}` : null,
    t(ITEMS.find(i => i.id === item)?.label, lang),
    !hasFile ? t(SIZES.find(s => s.id === size)?.label, lang) : null,
    t(MATERIALS.find(m => m.id === material)?.label, lang),
    t(FINISH.find(f => f.id === finish)?.label, lang),
    t(QUANTITY.find(q => q.id === quantity)?.label, lang),
    techLabel ? `→ ${techLabel}` : "",
  ].filter(Boolean).join(" | ");

  return (
    <div>
      {/* Step 0: Smart Upload */}
      <SimpleCard stepNum="⓪" label={l.q0} id="simple-upload">
        {!hasFile ? (
          <div>
            <label
              className={`group relative flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-emerald-400/30 hover:border-emerald-400/60 hover:bg-emerald-400/[0.04]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className={`p-3 rounded-full transition-colors ${dragOver ? "bg-emerald-400/20" : "bg-emerald-400/10 group-hover:bg-emerald-400/15"}`}>
                <Upload className={`w-8 h-8 ${dragOver ? "text-emerald-300" : "text-emerald-400/60 group-hover:text-emerald-400"} transition-colors`} />
              </div>
              <div className="text-center">
                <div className={`text-sm font-semibold ${dragOver ? "text-emerald-300" : "text-white"}`}>
                  {l.q0drop}
                </div>
                <div className="text-xs text-neutral-500 mt-1">{l.q0or}</div>
                <div className="text-[10px] text-emerald-400/50 mt-1">{l.q0accept}</div>
              </div>
              <input type="file" accept=".stl,.svg" onChange={onInputChange} className="hidden" />
            </label>
            <div className="text-center mt-3 text-[11px] text-neutral-500">{l.q0hint}</div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
            {/* Header: filename + type + remove */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileBox className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{fileName}</div>
                  <div className="text-[11px] text-emerald-400/80">
                    {l.q0detected}: {fileType === "stl" ? l.q0stl : l.q0svg}
                  </div>
                </div>
              </div>
              <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0" title={l.q0remove}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3D Preview for STL */}
            {fileType === "stl" && stlData?.triangles && (
              <div className="mb-3">
                <Suspense fallback={<div className="w-full rounded-lg bg-[#0c1222] border border-emerald-400/10 animate-pulse" style={{ height: "200px" }} />}>
                  <STLViewer triangles={stlData.triangles} bbox={stlData.bbox} />
                </Suspense>
              </div>
            )}

            {/* SVG Preview */}
            {fileType === "svg" && svgBlobUrl && (
              <div className="mb-3 w-full rounded-lg overflow-hidden bg-[#0c1222] border border-emerald-400/10 flex items-center justify-center" style={{ height: "160px" }}>
                <img src={svgBlobUrl} alt="SVG" className="max-w-full max-h-full p-3 opacity-90" style={{ filter: "invert(1) hue-rotate(180deg)" }} />
              </div>
            )}

            {/* File stats */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {fileType === "stl" && stlData && (
                <>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Ruler className="w-3 h-3 text-emerald-400/60" />
                    {l.q0dims}: <span className="text-white">{stlData.bbox.x.toFixed(1)}×{stlData.bbox.y.toFixed(1)}×{stlData.bbox.z.toFixed(1)} cm</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Layers className="w-3 h-3 text-emerald-400/60" />
                    {l.q0vol}: <span className="text-white">{stlData.volumeCm3.toFixed(1)} cm³</span>
                  </div>
                </>
              )}
              {fileType === "svg" && svgData && (
                <>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Ruler className="w-3 h-3 text-emerald-400/60" />
                    {l.q0dims}: <span className="text-white">{svgData.bboxMm.x.toFixed(1)}×{svgData.bboxMm.y.toFixed(1)} mm</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Layers className="w-3 h-3 text-emerald-400/60" />
                    {l.q0area}: <span className="text-white">{svgData.engravAreaCm2.toFixed(1)} cm²</span>
                  </div>
                </>
              )}
            </div>

            {/* Auto-detected size badge */}
            <div className="mt-3 pt-2 border-t border-emerald-400/10 text-[10px] text-emerald-400/50 flex items-center gap-1.5">
              <Ruler className="w-3 h-3" />
              {l.q0sizeAuto}: <span className="text-emerald-300 font-semibold">{t(SIZES.find(s => s.id === size)?.label, lang)}</span>
              {fileType === "stl" && <span className="text-neutral-600">· {t(MATERIALS.find(m => m.id === "plastic")?.label, lang)}</span>}
              {fileType === "svg" && <span className="text-neutral-600">· {t(MATERIALS.find(m => m.id === material)?.label, lang)}</span>}
            </div>
          </div>
        )}
      </SimpleCard>

      <SimpleCard stepNum="①" label={l.q1}>
        <TileGrid options={ITEMS} value={item} onChange={handleSet(setItem, "item")} lang={lang} cols={4} />
      </SimpleCard>

      {/* Size step — skip when file provides dimensions */}
      {!hasFile && (
        <SimpleCard stepNum="②" label={l.q2}>
          <TileGrid options={SIZES} value={size} onChange={handleSet(setSize, "size")} lang={lang} cols={3} />
        </SimpleCard>
      )}

      {/* Material — skip for STL (always 3D print), show for SVG (determines CO2/Fiber) */}
      {fileType !== "stl" && (
        <SimpleCard stepNum={hasFile ? "②" : "③"} label={l.q3}>
          <TileGrid options={MATERIALS} value={material} onChange={handleSet(setMaterial, "material")} lang={lang} cols={3} />
        </SimpleCard>
      )}

      <SimpleCard stepNum={hasFile ? (fileType === "stl" ? "②" : "③") : "④"} label={l.q4}>
        <TileGrid options={FINISH} value={finish} onChange={handleSet(setFinish, "finish")} lang={lang} cols={3} />
      </SimpleCard>

      <SimpleCard stepNum={hasFile ? (fileType === "stl" ? "③" : "④") : "⑤"} label={l.q5}>
        <TileGrid options={QUANTITY} value={quantity} onChange={handleSet(setQuantity, "quantity")} lang={lang} cols={4} />
      </SimpleCard>

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
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
        <div className="mt-4 pt-3 border-t border-emerald-400/10 text-[11px] text-emerald-400/60 italic text-center">
          {l.switchHint}
        </div>
      </div>

      <InquiryForm
        lang={lang}
        techLabel={techLabel ? `Szybka wycena — ${techLabel}` : "Szybka wycena"}
        paramsSummary={paramsSummary}
      />

      <div className="mt-4 p-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02] text-[11px] text-emerald-400/50 leading-relaxed text-center">
        {l.note}
      </div>
    </div>
  );
}
