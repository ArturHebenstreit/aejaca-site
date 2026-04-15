// ============================================================
// SIMPLE STUDIO CALCULATOR — "Szybka wycena" for laypeople
// Maps 5 plain-language questions → advanced calculator params
// Reuses pricing engines from Print3D / CO2 / Fiber / Epoxy.
// ============================================================
import { useState, useMemo } from "react";
import {
  KeyRound, BookText, Sparkles, Stamp, Gift, Cog, Gem, HelpCircle,
  Circle, Hand, Book, Package, Maximize2,
  Boxes, TreePine, Wrench, GlassWater, Droplet,
  ZapOff, ShieldCheck, Award,
  Hash, Users, Factory, Truck,
  Lightbulb,
} from "lucide-react";
import {
  QUANTITY_TIERS, t, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm,
} from "./calcShared.jsx";
import { calculate as calcPrint3D } from "./Print3DCalc.jsx";
import { calcEngrave as calcCO2Engrave, calcCut as calcCO2Cut } from "./CO2LaserCalc.jsx";
import { calculate as calcFiber } from "./FiberLaserCalc.jsx";
import { calculate as calcEpoxy } from "./EpoxyCastCalc.jsx";
import { trackCalc } from "../../utils/analytics.js";

// ============================================================
// QUESTIONS & OPTIONS
// ============================================================

const ITEMS = [
  { id: "keychain", icon: KeyRound,    label: { pl: "Breloczek", en: "Keychain", de: "Schlüsselanhänger" } },
  { id: "sign",     icon: BookText,    label: { pl: "Tabliczka / szyld", en: "Plate / sign", de: "Schild" } },
  { id: "figurine", icon: Sparkles,    label: { pl: "Figurka / model", en: "Figurine / model", de: "Figur / Modell" } },
  { id: "stamp",    icon: Stamp,       label: { pl: "Pieczątka", en: "Stamp", de: "Stempel" } },
  { id: "gift",     icon: Gift,        label: { pl: "Prezent / dekoracja", en: "Gift / decoration", de: "Geschenk / Deko" } },
  { id: "part",     icon: Cog,         label: { pl: "Część techniczna", en: "Technical part", de: "Technisches Teil" } },
  { id: "jewelry",  icon: Gem,         label: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck" } },
  { id: "other",    icon: HelpCircle,  label: { pl: "Coś innego", en: "Something else", de: "Etwas anderes" } },
];

const SIZES = [
  { id: "coin",   icon: Circle,    label: { pl: "Jak moneta", en: "Coin-sized", de: "Münzgröße" },          sub: { pl: "do 3 cm",      en: "up to 3 cm",  de: "bis 3 cm" } },
  { id: "palm",   icon: Hand,      label: { pl: "Jak dłoń",    en: "Palm-sized", de: "Handflächengröße" },   sub: { pl: "3–10 cm",      en: "3–10 cm",     de: "3–10 cm" } },
  { id: "book",   icon: Book,      label: { pl: "Jak książka", en: "Book-sized", de: "Buchgröße" },          sub: { pl: "10–25 cm",     en: "10–25 cm",    de: "10–25 cm" } },
  { id: "box",    icon: Package,   label: { pl: "Pudełko po butach", en: "Shoebox",  de: "Schuhkarton" },    sub: { pl: "25–40 cm",     en: "25–40 cm",    de: "25–40 cm" } },
  { id: "bigger", icon: Maximize2, label: { pl: "Większe",     en: "Bigger",     de: "Größer" },             sub: { pl: "powyżej 40 cm", en: "over 40 cm", de: "über 40 cm" } },
];

const MATERIALS = [
  { id: "plastic", icon: Boxes,      label: { pl: "Plastik",       en: "Plastic",        de: "Kunststoff" } },
  { id: "wood",    icon: TreePine,   label: { pl: "Drewno",        en: "Wood",           de: "Holz" } },
  { id: "metal",   icon: Wrench,     label: { pl: "Metal",         en: "Metal",          de: "Metall" } },
  { id: "glass",   icon: GlassWater, label: { pl: "Szkło / kamień", en: "Glass / stone", de: "Glas / Stein" } },
  { id: "resin",   icon: Droplet,    label: { pl: "Żywica",        en: "Resin",          de: "Harz" } },
  { id: "idk",     icon: HelpCircle, label: { pl: "Nie wiem — doradźcie", en: "I'm not sure — advise me", de: "Weiß nicht — beraten Sie mich" } },
];

const FINISH = [
  { id: "prototype", icon: ZapOff,      label: { pl: "Prototyp",  en: "Prototype", de: "Prototyp" },  sub: { pl: "tanio i szybko", en: "cheap & fast", de: "günstig & schnell" } },
  { id: "standard",  icon: ShieldCheck, label: { pl: "Standard",  en: "Standard",  de: "Standard" },  sub: { pl: "dobra jakość",   en: "good quality", de: "gute Qualität" } },
  { id: "premium",   icon: Award,       label: { pl: "Premium",   en: "Premium",   de: "Premium" },   sub: { pl: "najwyższa jakość", en: "top quality", de: "höchste Qualität" } },
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
export function resolveTechAndParams({ item, size, material, finish, quantity }) {
  if (!item || item === "other" || !size || !material || !finish || !quantity) {
    return { custom: true };
  }

  // Pick technology — material wins, or fall back to item default
  const tech = material === "idk" ? DEFAULT_TECH_FROM_ITEM[item] : TECH_FROM_MATERIAL[material];
  if (!tech) return { custom: true };

  const sizeId = SIZE_MAP[size][tech];
  const quantityId = QTY_MAP[quantity];

  // ---------- 3D PRINT ----------
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

  // ---------- CO2 LASER ----------
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
      // cut
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

  // ---------- FIBER LASER ----------
  if (tech === "fiber") {
    // CO2 handles glass/stone engraving better than fiber — reroute
    if (material === "glass") {
      return resolveTechAndParams({ item, size, material: "wood", finish, quantity });
    }
    const matId = item === "jewelry" ? "silver" : "stainless";
    const fiberSize = SIZE_MAP[size].fiber;
    // coin/palm fit in 70mm; larger sizes need 150mm
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

  // ---------- EPOXY ----------
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
    q1: "Co chcesz wykonać?", q2: "Jak duże?", q3: "Z jakiego materiału?", q4: "Jakość wykonania?", q5: "Ile sztuk?",
    suggestion: "Sugerowana technologia",
    why: "Dlaczego?",
    switchHint: 'Chcesz podać dokładniejsze parametry? Przełącz na tryb "Dla zaawansowanych" u góry.',
    note: 'Tryb Szybkiej Wyceny dobiera technologię i parametry automatycznie — dla dokładnej kontroli użyj trybu zaawansowanego.',
  },
  en: {
    q1: "What do you want to make?", q2: "How big?", q3: "What material?", q4: "Quality?", q5: "How many?",
    suggestion: "Suggested technology",
    why: "Why?",
    switchHint: 'Want more precise parameters? Switch to "Advanced" mode at the top.',
    note: 'Quick Quote mode picks technology and parameters automatically — for full control, use the advanced mode.',
  },
  de: {
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
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all duration-200 min-h-[88px] ${
              active
                ? "border-emerald-400 bg-emerald-400/10 shadow-md shadow-emerald-400/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 ${active ? "text-emerald-300" : "text-neutral-400"}`} />
            <div className={`text-xs sm:text-sm font-semibold leading-tight ${active ? "text-emerald-200" : "text-white"}`}>
              {t(opt.label, lang)}
            </div>
            {opt.sub && (
              <div className={`text-[10px] sm:text-[11px] mt-0.5 ${active ? "text-emerald-400/80" : "text-neutral-500"}`}>
                {t(opt.sub, lang)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Overrides CalcCard for emerald theme (step number in green). */
function SimpleCard({ stepNum, label, children }) {
  return (
    <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02] p-4 sm:p-5 mb-4">
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

  const resolved = useMemo(
    () => resolveTechAndParams({ item, size, material, finish, quantity }),
    [item, size, material, finish, quantity]
  );
  const result = useMemo(() => runCalc(resolved, lang), [resolved, lang]);

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
    t(ITEMS.find(i => i.id === item)?.label, lang),
    t(SIZES.find(s => s.id === size)?.label, lang),
    t(MATERIALS.find(m => m.id === material)?.label, lang),
    t(FINISH.find(f => f.id === finish)?.label, lang),
    t(QUANTITY.find(q => q.id === quantity)?.label, lang),
    techLabel ? `→ ${techLabel}` : "",
  ].filter(Boolean).join(" | ");

  return (
    <div>
      <SimpleCard stepNum="①" label={l.q1}>
        <TileGrid options={ITEMS} value={item} onChange={handleSet(setItem, "item")} lang={lang} cols={4} />
      </SimpleCard>

      <SimpleCard stepNum="②" label={l.q2}>
        <TileGrid options={SIZES} value={size} onChange={handleSet(setSize, "size")} lang={lang} cols={3} />
      </SimpleCard>

      <SimpleCard stepNum="③" label={l.q3}>
        <TileGrid options={MATERIALS} value={material} onChange={handleSet(setMaterial, "material")} lang={lang} cols={3} />
      </SimpleCard>

      <SimpleCard stepNum="④" label={l.q4}>
        <TileGrid options={FINISH} value={finish} onChange={handleSet(setFinish, "finish")} lang={lang} cols={3} />
      </SimpleCard>

      <SimpleCard stepNum="⑤" label={l.q5}>
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

      {/* Result — use shared ResultDisplay (emerald border) */}
      <div className="rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-400/[0.04] to-transparent p-6 mt-2">
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
