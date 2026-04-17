// ============================================================
// SIMPLE JEWELRY CALCULATOR — "Szybka wycena" for laypeople
// Maps plain-language answers → advanced calcNew / calcRenovation / calcRepair
// ============================================================
import { useState, useMemo } from "react";
import {
  Sparkles, Wrench, Wand2, HelpCircle,
  Circle, Hand, Gem as GemIcon, Ear, Link2, Crown, MoreHorizontal,
  Coins,
  Award, ShieldCheck, ZapOff,
  Droplet, Scissors, Key, Sparkles as SparkleAlt,
  Hash, Users, Factory,
  Lightbulb,
} from "lucide-react";
import { ResultHeader, ResultDisplay, InquiryForm, t } from "./calcShared.jsx";
import { calcNew, calcRenovation, calcRepair } from "./JewelryCalc.jsx";
import { trackCalc } from "../../utils/analytics.js";

// ============================================================
// OPTION TABLES
// ============================================================

const SERVICES = [
  { id: "new",         icon: Sparkles,   img: "/img/calc/services/new.png",
    label: { pl: "Nowa biżuteria",          en: "New jewelry",           de: "Neuer Schmuck" } },
  { id: "renovation",  icon: Wand2,      img: "/img/calc/services/renovation.png",
    label: { pl: "Renowacja / odświeżenie", en: "Renovation / refresh",  de: "Renovierung / Auffrischung" } },
  { id: "repair",      icon: Wrench,     img: "/img/calc/services/repair.png",
    label: { pl: "Naprawa",                 en: "Repair",                de: "Reparatur" } },
  { id: "unsure",      icon: HelpCircle, label: { pl: "Nie jestem pewien",        en: "I'm not sure",          de: "Ich bin mir nicht sicher" } },
];

const PIECES = [
  { id: "ring",     icon: Circle,          img: "/img/calc/types/ring.png",
    label: { pl: "Pierścionek",             en: "Ring",         de: "Ring" } },
  { id: "signet",   icon: Crown,           img: "/img/calc/types/signet.png",
    label: { pl: "Sygnet",                  en: "Signet ring",  de: "Siegelring" } },
  { id: "bracelet", icon: Hand,            img: "/img/calc/types/bracelet.png",
    label: { pl: "Bransoletka",             en: "Bracelet",     de: "Armband" } },
  { id: "pendant",  icon: GemIcon,         img: "/img/calc/types/pendant.png",
    label: { pl: "Wisiorek / medalik",      en: "Pendant",      de: "Anhänger" } },
  { id: "earrings", icon: Ear,             img: "/img/calc/types/earrings.png",
    label: { pl: "Kolczyki",                en: "Earrings",     de: "Ohrringe" } },
  { id: "necklace", icon: Link2,           img: "/img/calc/types/necklace.png",
    label: { pl: "Naszyjnik / łańcuszek",   en: "Necklace / chain", de: "Halskette / Kette" } },
  { id: "cord_bracelet", icon: Hand,
    label: { pl: "Bransoletka z kamieni (gumka/rzemyk)", en: "Stone cord bracelet", de: "Edelstein-Kordel-Armband" },
    sub:   { pl: "kamienie na gumce jubilerskiej lub rzemyku", en: "stones on elastic or leather cord", de: "Steine auf Gummiband oder Lederband" } },
  { id: "cord_necklace", icon: Link2,
    label: { pl: "Naszyjnik z kamieni (gumka/rzemyk)", en: "Stone cord necklace", de: "Edelstein-Kordel-Halskette" },
    sub:   { pl: "kamienie na gumce jubilerskiej lub rzemyku", en: "stones on elastic or leather cord", de: "Steine auf Gummiband oder Lederband" } },
  { id: "other",    icon: MoreHorizontal,  label: { pl: "Inne",                    en: "Other",        de: "Andere" } },
];

const METALS = [
  { id: "silver",   icon: Coins,      img: "/img/calc/metals/silver.png",
    label: { pl: "Srebro",    en: "Silver",    de: "Silber" } },
  { id: "gold",     icon: Coins,      img: "/img/calc/metals/gold_14k.png",
    label: { pl: "Złoto",     en: "Gold",      de: "Gold" } },
  { id: "platinum", icon: Coins,      img: "/img/calc/metals/platinum.png",
    label: { pl: "Platyna",   en: "Platinum",  de: "Platin" } },
  { id: "unsure",   icon: HelpCircle, label: { pl: "Nie wiem",  en: "Not sure",  de: "Unsicher" } },
];

// --- Q4 for NEW: gemstone category ---
const GEM_CATEGORIES = [
  { id: "none",    icon: ZapOff,      label: { pl: "Bez kamienia",                  en: "No stone",         de: "Ohne Stein" } },
  { id: "accent",  icon: SparkleAlt,  img: "/img/calc/gems/cz.png",
    label: { pl: "Delikatny akcent",              en: "Subtle accent",    de: "Feiner Akzent" },
    sub: { pl: "drobne cyrkonie / lab-grown", en: "small CZ / lab-grown", de: "kleine CZ / Labor-Stein" } },
  { id: "colored", icon: GemIcon,     img: "/img/calc/gems/sapphire.png",
    label: { pl: "Kolorowy kamień",               en: "Colored stone",    de: "Farbstein" },
    sub: { pl: "ametyst, topaz, szafir…", en: "amethyst, topaz, sapphire…", de: "Amethyst, Topas, Saphir…" } },
  { id: "diamond", icon: Award,       img: "/img/calc/gems/diamond.png",
    label: { pl: "Diament / drogi kamień",        en: "Diamond / precious", de: "Diamant / Edelstein" },
    sub: { pl: "rubin, szmaragd, brylant", en: "ruby, emerald, brilliant", de: "Rubin, Smaragd, Brillant" } },
];

// --- Q4 for RENOVATION: work scope ---
const RENO_SCOPES = [
  { id: "clean",      icon: Droplet,    label: { pl: "Czyszczenie + polerka",     en: "Cleaning + polish",    de: "Reinigung + Politur" } },
  { id: "replate",    icon: SparkleAlt, label: { pl: "Odnowa pokrycia",           en: "Replating",            de: "Neubeschichtung" },
    sub: { pl: "rodowanie / złocenie",   en: "rhodium / gold plating", de: "Rhodium / Vergoldung" } },
  { id: "full",       icon: Award,      label: { pl: "Pełne odświeżenie",         en: "Full refresh",         de: "Komplette Auffrischung" },
    sub: { pl: "czyszczenie + rodowanie + kontrola kamieni", en: "cleaning + rhodium + stone check", de: "Reinigung + Rhodium + Steinkontrolle" } },
  { id: "full_eng",   icon: Wand2,      label: { pl: "Pełne + grawer",            en: "Full + engraving",     de: "Komplett + Gravur" } },
];

// --- Q4 for REPAIR: what's broken ---
const REPAIR_ISSUES = [
  { id: "resize",    icon: Circle,   label: { pl: "Za duży / za mały (rozmiar)", en: "Wrong size (resize)",    de: "Größe anpassen" } },
  { id: "prong",     icon: Wrench,   label: { pl: "Łapka / oprawka kamienia",    en: "Prong / stone setting",  de: "Krappen / Fassung" } },
  { id: "stone_rep", icon: GemIcon,  label: { pl: "Zgubiony / uszkodzony kamień", en: "Lost / damaged stone", de: "Verlorener / beschädigter Stein" } },
  { id: "clasp",     icon: Key,      label: { pl: "Zapięcie / mechanizm",        en: "Clasp / mechanism",      de: "Verschluss / Mechanismus" } },
  { id: "chain_rep", icon: Link2,    label: { pl: "Łańcuszek / ogniwo",          en: "Chain / link",           de: "Kette / Glied" } },
  { id: "solder",    icon: Scissors, label: { pl: "Lutowanie / łączenie",        en: "Soldering / joining",    de: "Löten / Verbinden" } },
];

// --- Q5 for NEW: quality tier (uses weight images — quality→weight mapping: budget=light, standard=standard, premium=heavy) ---
const QUALITY_TIERS = [
  { id: "budget",   icon: ZapOff,      img: "/img/calc/weights/light.png",
    label: { pl: "Przystępny",    en: "Affordable", de: "Erschwinglich" },
    sub: { pl: "tanio i solidnie", en: "affordable & solid", de: "günstig & solide" } },
  { id: "standard", icon: ShieldCheck, img: "/img/calc/weights/standard.png",
    label: { pl: "Standard",      en: "Standard",   de: "Standard" },
    sub: { pl: "dobra jakość",     en: "good quality",       de: "gute Qualität" } },
  { id: "premium",  icon: Award,       img: "/img/calc/weights/heavy.png",
    label: { pl: "Premium",       en: "Premium",    de: "Premium" },
    sub: { pl: "najwyższa jakość", en: "top quality",        de: "höchste Qualität" } },
];

// --- Q5 for RENO/REPAIR: quantity ---
const QUANTITIES = [
  { id: "1",    icon: Hash,    label: { pl: "1 sztuka",  en: "1 piece", de: "1 Stück" } },
  { id: "2-5",  icon: Users,   label: { pl: "2–5 sztuk", en: "2–5 pcs", de: "2–5 Stk." } },
  { id: "6-10", icon: Factory, label: { pl: "6–10 sztuk", en: "6–10 pcs", de: "6–10 Stk." } },
];

// ============================================================
// MAPPING ENGINE
// ============================================================

/** Map Simple piece → advanced (lineId, typeId) for NEW flow */
const PIECE_TO_LINE_TYPE = {
  ring:     { lineId: "woman", typeId: "ring" },
  signet:   { lineId: "men",   typeId: "signet" },
  bracelet: { lineId: "woman", typeId: "bracelet" },
  pendant:  { lineId: "woman", typeId: "pendant" },
  earrings: { lineId: "woman", typeId: "earrings" },
  necklace: { lineId: "woman", typeId: "necklace" },
};

/** Map Simple piece → GENERIC_TYPES id for RENOVATION/REPAIR */
const PIECE_TO_GENERIC = {
  ring:     "ring_g",
  signet:   "ring_g",
  bracelet: "bracelet_g",
  pendant:  "pendant_g",
  earrings: "earrings_g",
  necklace: "necklace_g",
  other:    "other_g",
};

/** Map Simple metal+quality → advanced metalId */
function mapMetal(metal, quality) {
  if (metal === "silver")   return "silver";
  if (metal === "platinum") return "platinum";
  if (metal === "gold") {
    if (quality === "budget")   return "gold_9k";
    if (quality === "premium")  return "gold_18k";
    return "gold_14k";
  }
  // unsure → scale with quality
  if (quality === "premium") return "gold_18k";
  if (quality === "standard") return "gold_14k";
  return "silver";
}

/** Map Simple metal → GENERIC_METALS id for RENOVATION/REPAIR */
function mapGenericMetal(metal) {
  if (metal === "silver")   return "silver_g";
  if (metal === "gold")     return "gold_g";
  if (metal === "platinum") return "platinum_g";
  return "other_m";
}

/** Quantity tier id */
function mapQty(qty) {
  if (qty === "1") return "1";
  if (qty === "2-5") return "2-5";
  return "6-10";
}

/** Gemstone preset based on category × quality */
function mapGem(category, quality) {
  if (category === "none") return { gemId: "none" };

  if (category === "accent") {
    return {
      gemId: quality === "premium" ? "lab_diamond" : "cz",
      stoneSizeId: "small",
      stoneCountId: "3",
      certId: "none",
    };
  }

  if (category === "colored") {
    const gemId = quality === "budget" ? "amethyst" : quality === "premium" ? "sapphire" : "topaz";
    return {
      gemId,
      stoneSizeId: "medium",
      stoneCountId: "1",
      qualityId: quality === "premium" ? "AAA" : quality === "standard" ? "AA" : "A",
      certId: quality === "premium" ? "other" : "none",
    };
  }

  if (category === "diamond") {
    const gemId = quality === "budget" ? "lab_diamond" : quality === "premium" ? "diamond" : "lab_diamond";
    return {
      gemId,
      stoneSizeId: quality === "budget" ? "small" : quality === "premium" ? "large" : "medium",
      stoneCountId: "1",
      clarityId: quality === "premium" ? "VVS" : "VS",
      colorId: quality === "premium" ? "DEF" : "GH",
      certId: quality === "premium" ? "gia" : quality === "standard" ? "other" : "none",
    };
  }
  return { gemId: "none" };
}

/** RENOVATION scope → services[] (matches RENOVATION_SERVICES ids) */
function mapRenoScope(scope) {
  switch (scope) {
    case "clean":    return ["clean"];
    case "replate":  return ["rhodium_r"];
    case "full":     return ["clean", "rhodium_r", "stone_ck"];
    case "full_eng": return ["clean", "rhodium_r", "stone_ck", "engrave"];
    default:         return [];
  }
}

// --- CORD JEWELRY PRICING ---
const CORD_ITEMS = {
  cord_bracelet: {
    materialCostPLN: { budget: 18, standard: 28, premium: 45 },
    laborCostPLN: 35,
  },
  cord_necklace: {
    materialCostPLN: { budget: 28, standard: 40, premium: 65 },
    laborCostPLN: 45,
  },
};

/** Main engine — given Simple answers, return advanced params + which calc to run */
export function resolveJewelryParams(state) {
  const { service, piece, metal, gemCategory, renoScope, repairIssue, quality, quantity } = state;

  if (!service || service === "unsure") return { custom: true };
  if (!piece || piece === "other") return { custom: true };

  // CORD JEWELRY — fixed pricing, no metal/gem questions needed
  if (piece === "cord_bracelet" || piece === "cord_necklace") {
    if (service !== "new") return { custom: true };
    const tier = quality || "standard";
    return { flow: "cord", piece, quality: tier };
  }

  // NEW CREATION
  if (service === "new") {
    if (!metal || !gemCategory || !quality) return { custom: true };
    const { lineId, typeId } = PIECE_TO_LINE_TYPE[piece] || {};
    if (!lineId) return { custom: true };
    const metalId = mapMetal(metal, quality);
    const weightId = quality === "budget" ? "light" : quality === "premium" ? "heavy" : "standard";
    const methodId = quality === "premium" ? "handmade" : "cast";
    // Platinum/white gold needs rhodium; gold can stay bare
    const platingId = (quality === "premium" && (metalId === "silver" || metalId === "platinum")) ? "rhodium" : "none";
    const gem = mapGem(gemCategory, quality);
    return {
      flow: "new",
      params: {
        lineId, typeId, metalId, weightId, methodId, platingId,
        ...gem,
        qtyId: "1",
      },
    };
  }

  // RENOVATION
  if (service === "renovation") {
    if (!metal || !renoScope || !quantity) return { custom: true };
    return {
      flow: "renovation",
      params: {
        jewTypeId: PIECE_TO_GENERIC[piece],
        metalTypeId: mapGenericMetal(metal),
        services: mapRenoScope(renoScope),
        qtyId: mapQty(quantity),
      },
    };
  }

  // REPAIR
  if (service === "repair") {
    if (!metal || !repairIssue || !quantity) return { custom: true };
    return {
      flow: "repair",
      params: {
        jewTypeId: PIECE_TO_GENERIC[piece],
        metalTypeId: mapGenericMetal(metal),
        repairId: repairIssue,
        qtyId: mapQty(quantity),
      },
    };
  }

  return { custom: true };
}

function calcCord(resolved, lang) {
  const cfg = CORD_ITEMS[resolved.piece];
  if (!cfg) return null;
  const matCost = cfg.materialCostPLN[resolved.quality] || cfg.materialCostPLN.standard;
  const laborCost = cfg.laborCostPLN;
  const baseCost = matCost + laborCost;
  const margin = 0.45;
  const basePrice = baseCost * (1 + margin);
  const tolLow = 0.25, tolHigh = 0.35;
  const perMin = Math.max(1, Math.round(basePrice * (1 - tolLow)));
  const perMax = Math.max(1, Math.round(basePrice * (1 + tolHigh)));
  const eurPln = 4.28;
  const workshopCost = baseCost * margin;
  const materialLabel = { pl: "Kamienie i sznurek", en: "Stones & cord", de: "Steine & Kordel" }[lang] || "Stones & cord";
  const laborLabel = { pl: "Robocizna", en: "Labor", de: "Arbeit" }[lang] || "Labor";
  const workshopLabel = { pl: "Warsztat i podatki lokalne", en: "Workshop & local taxes", de: "Werkstatt & lokale Steuern" }[lang] || "Workshop & local taxes";
  const estLabel = { pl: "Koszt szacunkowy", en: "Estimated cost", de: "Geschätzte Kosten" }[lang] || "Estimated cost";
  const fmtCost = (v) => lang === "pl" ? `${v.toFixed(2)} PLN` : `${(v / eurPln).toFixed(2)} EUR`;
  return {
    type: "calculated",
    perPcPLN: { min: perMin, max: perMax },
    perPcEUR: { min: Math.max(1, Math.round(perMin / eurPln)), max: Math.max(1, Math.round(perMax / eurPln)) },
    totalPLN: { min: perMin, max: perMax },
    totalEUR: { min: Math.max(1, Math.round(perMin / eurPln)), max: Math.max(1, Math.round(perMax / eurPln)) },
    qty: 1, discount: 0,
    breakdown: [
      { label: materialLabel, value: fmtCost(matCost) },
      { label: laborLabel, value: fmtCost(laborCost) },
      { label: workshopLabel, value: fmtCost(workshopCost) },
      { divider: true },
      { label: estLabel, value: fmtCost(baseCost + workshopCost), bold: true },
    ],
  };
}

function runCalc(resolved, lang) {
  if (!resolved || resolved.custom) return { type: "custom" };
  if (resolved.flow === "cord")       return calcCord(resolved, lang);
  if (resolved.flow === "new")        return calcNew(resolved.params, lang);
  if (resolved.flow === "renovation") return calcRenovation(resolved.params, lang);
  if (resolved.flow === "repair")     return calcRepair(resolved.params, lang);
  return null;
}

// ============================================================
// UI — rose theme
// ============================================================

const LBL = {
  pl: {
    q1: "Czego potrzebujesz?",
    q2: "Co to jest?",
    q3: "Z jakiego kruszcu?",
    q4_new:    "Kamień?",
    q4_reno:   "Zakres odświeżenia?",
    q4_repair: "Co naprawić?",
    q5_new:    "Poziom jakości?",
    q5_qty:    "Ile sztuk?",
    summary:   "Podsumowanie",
    pickAll:   "Odpowiedz na wszystkie pytania",
    switchHint: 'Chcesz podać dokładniejsze parametry? Przełącz na tryb "Dla zaawansowanych" u góry.',
    note: 'Tryb Szybkiej Wyceny dobiera próbę kruszcu, metodę i parametry kamienia automatycznie — dla pełnej kontroli użyj trybu zaawansowanego.',
  },
  en: {
    q1: "What do you need?",
    q2: "What piece?",
    q3: "What metal?",
    q4_new:    "Gemstone?",
    q4_reno:   "Refresh scope?",
    q4_repair: "What to repair?",
    q5_new:    "Quality level?",
    q5_qty:    "How many?",
    summary:   "Summary",
    pickAll:   "Answer all questions",
    switchHint: 'Want more precise parameters? Switch to "Advanced" mode at the top.',
    note: 'Quick Quote mode picks metal purity, method and stone parameters automatically — for full control use the advanced mode.',
  },
  de: {
    q1: "Was benötigen Sie?",
    q2: "Welches Schmuckstück?",
    q3: "Welches Metall?",
    q4_new:    "Stein?",
    q4_reno:   "Umfang der Auffrischung?",
    q4_repair: "Was reparieren?",
    q5_new:    "Qualitätsstufe?",
    q5_qty:    "Wie viele?",
    summary:   "Zusammenfassung",
    pickAll:   "Beantworten Sie alle Fragen",
    switchHint: 'Genauere Parameter? Wechseln Sie oben in den "Fortgeschrittenen"-Modus.',
    note: 'Der Schnellkalkulationsmodus wählt Feingehalt, Methode und Steinparameter automatisch — für volle Kontrolle verwenden Sie den erweiterten Modus.',
  },
};

function TileGrid({ options, value, onChange, lang, cols = 4 }) {
  const gridCls = cols === 3
    ? "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
    : cols === 2
      ? "grid grid-cols-2 gap-2 sm:gap-3"
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
                ? "border-rose-400 shadow-lg shadow-rose-400/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}>
            {hasImg ? (
              <>
                {/* Background image */}
                <div className="absolute inset-0 overflow-hidden bg-black">
                  <img src={opt.img} alt={label} loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      active ? "scale-105" : "group-hover:scale-105"
                    }`} />
                  {/* Bottom gradient for text legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/65 to-transparent" />
                  {/* Active state tint */}
                  {active && <div className="absolute inset-0 bg-rose-400/10 mix-blend-overlay" />}
                </div>
                {/* Text at bottom */}
                <div className="relative p-2.5 sm:p-3 h-full min-h-[120px] sm:min-h-[140px] flex flex-col justify-end">
                  <div className={`text-[11px] sm:text-sm font-bold leading-tight drop-shadow-lg ${active ? "text-rose-300" : "text-white"}`}>
                    {label}
                  </div>
                  {sub && (
                    <div className={`text-[10px] mt-0.5 drop-shadow-md ${active ? "text-rose-200/90" : "text-neutral-200"}`}>
                      {sub}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Icon fallback (no image) */
              <div className={`p-3 sm:p-4 h-full min-h-[120px] sm:min-h-[140px] flex flex-col ${
                active ? "bg-rose-400/10" : ""
              }`}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 mb-2 ${active ? "text-rose-300" : "text-neutral-400"}`} />
                <div className={`text-xs sm:text-sm font-semibold leading-tight ${active ? "text-rose-200" : "text-white"}`}>
                  {label}
                </div>
                {sub && (
                  <div className={`text-[10px] sm:text-[11px] mt-0.5 ${active ? "text-rose-400/80" : "text-neutral-500"}`}>
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

function SimpleCard({ stepNum, label, children }) {
  return (
    <div className="rounded-xl border border-rose-400/10 bg-rose-400/[0.02] p-4 sm:p-5 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
        {stepNum && <span className="text-rose-400 mr-1.5">{stepNum}</span>}{label}
      </div>
      {children}
    </div>
  );
}

export default function SimpleJewelryCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;

  const [service, setService] = useState("new");
  const [piece, setPiece] = useState("ring");
  const [metal, setMetal] = useState("gold");
  const [gemCategory, setGemCategory] = useState("none");
  const [renoScope, setRenoScope] = useState("clean");
  const [repairIssue, setRepairIssue] = useState("resize");
  const [quality, setQuality] = useState("standard");
  const [quantity, setQuantity] = useState("1");

  const handle = (setter, key) => (v) => {
    setter(v);
    trackCalc("jewelry_simple", key, v);
  };

  const state = { service, piece, metal, gemCategory, renoScope, repairIssue, quality, quantity };
  const resolved = useMemo(() => resolveJewelryParams(state), [service, piece, metal, gemCategory, renoScope, repairIssue, quality, quantity]);
  const result = useMemo(() => runCalc(resolved, lang), [resolved, lang]);

  const isNew    = service === "new";
  const isReno   = service === "renovation";
  const isRepair = service === "repair";
  const isCord   = piece === "cord_bracelet" || piece === "cord_necklace";

  const serviceLabel   = t(SERVICES.find(s => s.id === service)?.label, lang);
  const pieceLabel     = t(PIECES.find(p => p.id === piece)?.label, lang);
  const metalLabel     = isCord ? "" : t(METALS.find(m => m.id === metal)?.label, lang);
  const extraLabel     = isCord ? ""
                       : isNew    ? t(GEM_CATEGORIES.find(g => g.id === gemCategory)?.label, lang)
                       : isReno   ? t(RENO_SCOPES.find(r => r.id === renoScope)?.label, lang)
                       : isRepair ? t(REPAIR_ISSUES.find(r => r.id === repairIssue)?.label, lang)
                       : "";
  const finalLabel     = isNew ? t(QUALITY_TIERS.find(q => q.id === quality)?.label, lang)
                                : t(QUANTITIES.find(q => q.id === quantity)?.label, lang);

  const paramsSummary = [serviceLabel, pieceLabel, metalLabel, extraLabel, finalLabel].filter(Boolean).join(" | ");

  return (
    <div>
      <SimpleCard stepNum="①" label={l.q1}>
        <TileGrid options={SERVICES} value={service} onChange={handle(setService, "service")} lang={lang} cols={4} />
      </SimpleCard>

      <SimpleCard stepNum="②" label={l.q2}>
        <TileGrid options={PIECES} value={piece} onChange={handle(setPiece, "piece")} lang={lang} cols={4} />
      </SimpleCard>

      {!isCord && (
        <SimpleCard stepNum="③" label={l.q3}>
          <TileGrid options={METALS} value={metal} onChange={handle(setMetal, "metal")} lang={lang} cols={4} />
        </SimpleCard>
      )}

      {isNew && !isCord && (
        <SimpleCard stepNum={isCord ? "③" : "④"} label={l.q4_new}>
          <TileGrid options={GEM_CATEGORIES} value={gemCategory} onChange={handle(setGemCategory, "gem")} lang={lang} cols={2} />
        </SimpleCard>
      )}
      {isReno && !isCord && (
        <SimpleCard stepNum="④" label={l.q4_reno}>
          <TileGrid options={RENO_SCOPES} value={renoScope} onChange={handle(setRenoScope, "scope")} lang={lang} cols={2} />
        </SimpleCard>
      )}
      {isRepair && !isCord && (
        <SimpleCard stepNum="④" label={l.q4_repair}>
          <TileGrid options={REPAIR_ISSUES} value={repairIssue} onChange={handle(setRepairIssue, "issue")} lang={lang} cols={3} />
        </SimpleCard>
      )}

      {isNew ? (
        <SimpleCard stepNum={isCord ? "③" : "⑤"} label={l.q5_new}>
          <TileGrid options={QUALITY_TIERS} value={quality} onChange={handle(setQuality, "quality")} lang={lang} cols={3} />
        </SimpleCard>
      ) : (isReno || isRepair) ? (
        <SimpleCard stepNum="⑤" label={l.q5_qty}>
          <TileGrid options={QUANTITIES} value={quantity} onChange={handle(setQuantity, "quantity")} lang={lang} cols={3} />
        </SimpleCard>
      ) : null}

      {/* Summary badge */}
      {!resolved?.custom && (
        <div className="mb-3 p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="text-[12px] leading-relaxed">
            <div className="text-rose-300 font-semibold mb-0.5">{l.summary}</div>
            <div className="text-rose-400/80">{paramsSummary}</div>
          </div>
        </div>
      )}

      {/* Result */}
      <div className="rounded-2xl border-2 border-rose-400/30 bg-gradient-to-br from-rose-400/[0.04] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
        <div className="mt-4 pt-3 border-t border-rose-400/10 text-[11px] text-rose-400/60 italic text-center">
          {l.switchHint}
        </div>
      </div>

      <InquiryForm
        lang={lang}
        techLabel={`Szybka wycena biżuterii — ${serviceLabel}`}
        paramsSummary={paramsSummary}
      />

      <div className="mt-4 p-3 rounded-xl border border-rose-400/10 bg-rose-400/[0.02] text-[11px] text-rose-400/50 leading-relaxed text-center">
        {l.note}
      </div>
    </div>
  );
}
