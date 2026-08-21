// ============================================================
// JEWELRY ESTIMATOR - AEJaCA Jewelry
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, NextStepPanel } from "./calcShared.jsx";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import { QuantityStepper } from "../shop/ConfigControls.jsx";
import { trackCalc } from "../../utils/analytics.js";
import CalcToCart from "./CalcToCart.jsx";
import { useMarketRates } from "../../hooks/useMarketRates.js";
import { useGemPrices } from "../../hooks/useGemPrices.js";
import {
  METAL_PRICES, EUR_PLN, MARGIN, MATERIAL_MARKUP, REPAIR_MARGIN, TOL_LOW, TOL_HIGH,
  SERVICE_TYPES, PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING,
  ENGRAVING_OPTIONS,
  GEMSTONES, STONE_SIZES, DIAMOND_CLARITY, DIAMOND_COLOR, GEM_QUALITY, CERTIFICATIONS,
  RENOVATION_SERVICES, REPAIR_SERVICES,
  REPAIR_METAL_MUL, QTY_TIERS, GENERIC_TYPES, RENOVATION_METALS, REPAIR_METALS,
  CHAIN_WEAVES, CHAIN_CLASPS, CHAIN_DEFAULT_LENGTH,
  NECKLACE_LENGTHS_WOMEN, NECKLACE_LENGTHS_MEN, BRACELET_LENGTHS,
  CHAIN_SVG_Y_WOMEN, CHAIN_SVG_Y_MEN,
} from "./jewelryConfig.js";
import { getProductType } from "./jewelry/productConfig.js";
import { calcWeight as computeWeight } from "./jewelry/WeightEngine.js";
import DimensionInputs from "./jewelry/DimensionInputs.jsx";
import WeightDisplay from "./jewelry/WeightDisplay.jsx";
import StoneComposer from "./jewelry/StoneComposer.jsx";

import {
  METAL_DENSITY, resolveMetalPricePerG, calcNew, calcChain, calcRenovation, calcRepair,
  LBL,
} from "../../pricing/jewelry.js";

// Re-eksport, bo SimpleJewelryCalc importuje kalkulacje stad.
export { calcNew, calcChain, calcRenovation, calcRepair };


// Map JEWELRY_TYPES ids → PRODUCT_TYPES ids (for dimension engine)
const TYPE_TO_FORM = {
  // woman line
  ring:       "ring",
  bracelet:   "bracelet",
  pendant:    "pendant",
  earrings:   "earrings",
  brooch:     "brooch",
  necklace:   null,    // no geometry model for chains/necklaces
  // men line
  signet:     "signet",
  medallion:  "pendant", // closest model
  bracelet_m: "bracelet",
  cufflinks:  null,
  tie_clip:   null,
  chain_m:    null,
  // pet line
  tag:        "pendant",
  charm:      "pendant",
  pin:        null,
  // wedding rings
  wedding_ring_w: "wedding_ring",
  wedding_ring_m: "wedding_ring",
};

const CHAIN_TYPES = new Set(["chain_m", "bracelet_m", "necklace"]);
const isChainType = (id) => CHAIN_TYPES.has(id);
const isNecklaceChain = (id) => id === "chain_m" || id === "necklace";

// ---- CHAIN BODY SILHOUETTE (SVG) ----
function ChainSilhouette({ lengthMm, gender = "women" }) {
  const yMap = gender === "men" ? CHAIN_SVG_Y_MEN : CHAIN_SVG_Y_WOMEN;
  const chainY = yMap[lengthMm] ?? (gender === "men" ? 190 : 185);
  const isMen = gender === "men";
  const lx = isMen ? 60 : 65;
  const rx = isMen ? 140 : 135;
  const connectY = isMen ? 96 : 99;

  return (
    // Dark container ensures silhouette + chain are always visible regardless of page bg
    <div className="bg-neutral-900 rounded-xl p-1 w-full">
      <svg viewBox="0 0 200 310" className="w-full h-auto" aria-hidden="true">
        {/* Body silhouette */}
        <g stroke="rgba(255,255,255,0.85)" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="100" cy="33" r="21" />
          <line x1="90" y1="54" x2="87" y2="72" />
          <line x1="110" y1="54" x2="113" y2="72" />
          {isMen ? (
            <>
              <path d="M87,72 L44,95 C36,118 35,152 39,172 C42,190 41,212 43,233 C44,250 46,265 50,278 L55,310" />
              <path d="M113,72 L156,95 C164,118 165,152 161,172 C158,190 159,212 157,233 C156,250 154,265 150,278 L145,310" />
            </>
          ) : (
            <>
              <path d="M87,72 L50,97 C42,117 40,146 44,166 C47,181 48,202 44,224 C40,246 42,264 50,276 L55,310" />
              <path d="M113,72 L150,97 C158,117 160,146 156,166 C153,181 152,202 156,224 C160,246 158,264 150,276 L145,310" />
            </>
          )}
        </g>

        {/* Guide line */}
        <line x1="18" y1={chainY} x2="182" y2={chainY}
          stroke="rgba(251,191,36,0.30)" strokeWidth="0.8" strokeDasharray="4,3" />

        {/* Chain arc */}
        <path d={`M${lx},${connectY} Q100,${chainY + 6} ${rx},${connectY}`}
          fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />

        {/* Clasp dots */}
        <circle cx={lx} cy={connectY} r="2.5" fill="#fbbf24" />
        <circle cx={rx} cy={connectY} r="2.5" fill="#fbbf24" />

        {/* Length label with solid dark background for readability */}
        <rect x="74" y={Math.min(chainY + 7, 295)} width="52" height="17" rx="8"
          fill="rgba(0,0,0,0.75)" stroke="#fbbf24" strokeWidth="1" />
        <text x="100" y={Math.min(chainY + 19, 307)} textAnchor="middle"
          fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
          {(lengthMm / 10).toFixed(0)} cm
        </text>
      </svg>
    </div>
  );
}






const TECH_LABEL = { pl: "Biżuteria AEJaCA", en: "AEJaCA Jewelry", de: "AEJaCA Schmuck" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stueckzahl" };

const RATE_NOTE = {
  pl: "Kursy na podstawie danych rynkowych - szczegóły w stopce strony",
  en: "Prices based on live market data - details in site footer",
  de: "Preise basierend auf Marktdaten - Details in der Fußzeile",
};

// Consigned-material (materiał powierzony) disclaimer - shown wherever the client
// declares they will supply their own precious metal. Worded in the name of the
// AEJaCA team. Reused by both the chain "from stock" mode and the supply toggle.
const CONSIGNED_NOTE = {
  pl: "Materiał powierzony: kruszec przyjmujemy na podstawie deklarowanej próby. Przy odbiorze ważymy i fotografujemy każdy element oraz weryfikujemy stop (gęstość, próba kwasowa); w razie wątpliwości proponujemy analizę w Urzędzie Probierczym przed wykonaniem (koszt po stronie Klienta). Zespół AEJaCA nie odpowiada za wady wyrobu wynikające z faktycznego składu powierzonego materiału, jeśli odbiega on od deklaracji.",
  en: "Consigned material: we accept metal based on its declared fineness. On receipt we weigh and photograph each item and verify the alloy (density, acid test); if in doubt we propose an assay at the State Assay Office before production (cost borne by the Client). The AEJaCA team is not liable for defects in the finished piece resulting from the supplied material's actual composition differing from the declaration.",
  de: "Beigestelltes Material: Wir nehmen das Metall auf Basis der angegebenen Feinheit an. Bei Annahme wiegen und fotografieren wir jedes Teil und prüfen die Legierung (Dichte, Säuretest); im Zweifel schlagen wir vor der Fertigung eine Analyse beim Punzierungsamt vor (Kosten trägt der Kunde). Das AEJaCA-Team haftet nicht für Mängel des fertigen Stücks, die sich aus einer von der Angabe abweichenden tatsächlichen Zusammensetzung des beigestellten Materials ergeben.",
};

function ConsignedNote({ lang }) {
  return (
    <div className="mt-2 flex gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2">
      <span aria-hidden="true" className="text-amber-400/80 text-xs leading-5">ⓘ</span>
      <p className="text-[11px] leading-relaxed text-neutral-300">
        {CONSIGNED_NOTE[lang] || CONSIGNED_NOTE.pl}
      </p>
    </div>
  );
}

export default function JewelryCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const { rates } = useMarketRates();
  const gemPrices = useGemPrices(); // null=loading, map otherwise
  const pln_per_eur = rates.pln_per_eur || 4.25;

  // Merge static gem metadata with dynamic EUR prices → basePLN
  const resolvedGemstones = useMemo(() =>
    GEMSTONES.map(g => {
      if (g.id === "none" || g.custom || g.basePLN === null) return g;
      const baseEur = gemPrices?.[g.id];
      if (baseEur == null) return g; // fallback to hardcoded basePLN
      return { ...g, basePLN: Math.round(baseEur * pln_per_eur) };
    }),
    [gemPrices, pln_per_eur]
  );

  // Shared
  // Karty uslug w sklepie prowadza tutaj z gotowym wyborem, zeby klient
  // nie musial drugi raz szukac tego, co juz wskazal (?service=, ?type=).
  const [searchParams] = useSearchParams();
  const urlService = searchParams.get("service");
  const urlType = searchParams.get("type");

  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  const [serviceId, setServiceId] = useState(
    SERVICE_TYPES.some((x) => x.id === urlService) ? urlService : "new"
  );
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty). Bizuteria ma
  // wlasna liste progow QTY_TIERS ("1", "2-5", "6-10", "10+"), nie
  // ogolna QUANTITY_TIERS studia, wiec kazde wywolanie dostaje ja wprost.
  const [qty, setQty] = useState(1);
  const qtyId = tierForQty(qty, QTY_TIERS).id;

  // New creation
  const [lineId, setLineId] = useState("woman");
  // JEWELRY_TYPES jest pogrupowane po linii (woman/men/pet), a link ze sklepu
  // podaje sam rodzaj, wiec sprawdzamy go w calej puli.
  const [typeId, setTypeId] = useState(
    Object.values(JEWELRY_TYPES).flat().some((x) => x.id === urlType) ? urlType : "ring"
  );

  // Geometry + client supply - productForm is derived from typeId (no separate selection needed)
  const productForm = useMemo(() => TYPE_TO_FORM[typeId] ?? null, [typeId]);
  const [dimensions, setDimensions] = useState({});     // fieldId: value
  // Reset dimensions whenever the jewelry type changes - populate defaults immediately
  useEffect(() => {
    if (!productForm) { setDimensions({}); return; }
    const pt = getProductType(productForm);
    if (!pt) { setDimensions({}); return; }
    const defaults = {};
    for (const field of pt.fields) {
      if (field.default !== undefined) {
        defaults[field.id] = field.default;
      }
    }
    setDimensions(defaults);
  }, [productForm]);
  useEffect(() => {
    setChainLengthMm(CHAIN_DEFAULT_LENGTH[typeId] ?? 450);
  }, [typeId]);
  const [clientSuppliesMetal, setClientSuppliesMetal] = useState(false);
  const [metalId, setMetalId] = useState("silver");
  const [weightId, setWeightId] = useState("light");
  const [methodId, setMethodId] = useState("cast");
  const [platingId, setPlatingId] = useState("none");
  const [engravingId, setEngravingId] = useState("none");
  // Chain-specific state
  const [calcMode, setCalcMode] = useState("standard"); // "standard" | "from_stock"
  const [stockMassG, setStockMassG] = useState(15);
  const [weaveId, setWeaveId] = useState("klasyczny");
  const [claspId, setClaspId] = useState("spring");
  const [chainLengthMm, setChainLengthMm] = useState(450);
  const [chainWidthMm, setChainWidthMm] = useState(3.0); // visible chain width (mm), wire diameter auto-derived via AR
  const [weaveModal, setWeaveModal] = useState(null);
  // Stone rows - up to 10 different stone entries
  const [stoneRows, setStoneRows] = useState([
    { rowId: "row0", gemId: "none", stoneSizeId: "small", count: 1, suppliedBy: "studio",
      clarityId: "VS", colorId: "GH", qualityId: "A", certId: "none" }
  ]);

  // Renovation
  const [renoServices, setRenoServices] = useState([]);
  const [renoJewType, setRenoJewType] = useState("ring_g");
  const [renoMetal, setRenoMetal] = useState("gold_g");

  // Repair
  const [repairId, setRepairId] = useState("resize");
  const [repairJewType, setRepairJewType] = useState("ring_g");
  const [repairMetal, setRepairMetal] = useState("gold_g");

  const types = JEWELRY_TYPES[lineId] || [];

  // Live geometric weight from WeightEngine (when productForm + dimensions are set)
  const weightResult = useMemo(() => {
    if (!productForm) return null;
    const selectedMetal = METALS.find(m => m.id === metalId);
    const density = METAL_DENSITY[selectedMetal?.metal] ?? 10.5;
    const result = computeWeight(productForm, dimensions, density, weightId);
    if (!result || typeof result.nettoG !== "number" || typeof result.bruttoG !== "number") return null;
    return result;
  }, [productForm, dimensions, metalId, weightId]);

  const result = useMemo(() => {
    if (serviceId === "new") {
      if (isChainType(typeId)) {
        return calcChain({ typeId, metalId, weaveId, claspId, platingId, engravingId,
          chainLengthMm, chainWidthMm,
          clientSuppliesMetal, qtyId, qty, calcMode, stockMassG }, lang, rates);
      }
      return calcNew({ lineId, typeId, metalId, weightId, methodId, platingId,
        stoneRows, qtyId, qty, engravingId,
        clientSuppliesMetal,
        overrideWeightG: weightResult?.nettoG ?? null }, lang, rates, resolvedGemstones);
    }
    if (serviceId === "renovation") {
      return calcRenovation({ jewTypeId: renoJewType, metalTypeId: renoMetal, services: renoServices, qtyId, qty }, lang);
    }
    return calcRepair({ jewTypeId: repairJewType, metalTypeId: repairMetal, repairId, qtyId, qty }, lang);
  }, [serviceId, lineId, typeId, metalId, weightId, methodId, platingId, engravingId,
    stoneRows, qtyId, weaveId, claspId, chainLengthMm, chainWidthMm,
    clientSuppliesMetal, weightResult, calcMode, stockMassG,
    renoServices, renoJewType, renoMetal, repairId, repairJewType, repairMetal, lang, rates, resolvedGemstones]);

  function toggleRenoService(id) {
    setRenoServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  let stepNum = 1;
  const step = () => String.fromCodePoint(0x2460 + stepNum++ - 1);

  // Podsumowanie wyborow stalo dotad dwa razy, przepisane slowo w slowo: raz
  // dla wyceny na maila, raz dla zapytania. Dwie kopie tego samego wyrazenia
  // rozjezdzaja sie przy pierwszej zmianie oferty i nikt tego nie zauwaza, bo
  // obie nadal generuja poprawnie wygladajacy tekst.
  const paramsSummary = useMemo(() => {
    if (serviceId === "renovation") {
      return `${t(SERVICE_TYPES[1].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === renoJewType)?.label, lang)} | ${renoServices.map(id => t(RENOVATION_SERVICES.find(s => s.id === id)?.label, lang)).join(", ")}`;
    }
    if (serviceId === "repair") {
      return `${t(SERVICE_TYPES[2].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === repairJewType)?.label, lang)} | ${t(REPAIR_SERVICES.find(r => r.id === repairId)?.label, lang)}`;
    }
    const wspolne = [
      t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
      t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
      t(METALS.find(m => m.id === metalId)?.label, lang),
    ];
    if (isChainType(typeId)) {
      return [
        ...wspolne,
        t(CHAIN_WEAVES.find(w => w.id === weaveId)?.label, lang),
        t(CHAIN_CLASPS.find(c => c.id === claspId)?.label, lang),
        `${chainLengthMm / 10}cm`,
        calcMode === "standard" ? `${chainWidthMm}mm szer.` : `${stockMassG}g`,
        engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === engravingId)?.label, lang) : null,
      ].filter(Boolean).join(" | ");
    }
    return [
      ...wspolne,
      t(METHODS.find(m => m.id === methodId)?.label, lang),
      engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === engravingId)?.label, lang) : null,
      ...stoneRows.filter(r => r.gemId !== "none").map(r => {
        const gem = resolvedGemstones.find(g => g.id === r.gemId);
        const sz = STONE_SIZES.find(s => s.id === r.stoneSizeId);
        return `${r.count}× ${t(gem?.label, lang) ?? r.gemId} (${t(sz?.label, lang) ?? r.stoneSizeId})${r.suppliedBy === "client" ? " [klient]" : ""}`;
      }),
    ].filter(Boolean).join(" | ");
  }, [serviceId, lang, lineId, typeId, metalId, methodId, engravingId, stoneRows, resolvedGemstones,
      weaveId, claspId, chainLengthMm, chainWidthMm, calcMode, stockMassG,
      renoJewType, renoServices, repairJewType, repairId]);

  // Wiazaca cena ma pokrycie tylko przy odlewie prostej bryly. Kamienie,
  // lancuszki i metal powierzony przez klienta wymagaja oceny czlowieka.
  const cartBlocked = serviceId === "new" && (
    methodId !== "cast" ||
    // Lista kamieni ma zawsze co najmniej jeden wiersz, domyslnie ustawiony
    // na "bez kamienia", wiec liczy sie tresc, nie dlugosc.
    stoneRows.some((r) => r.gemId && r.gemId !== "none") ||
    isChainType(typeId) ||
    clientSuppliesMetal
  );

  return (
    <div>
      {/* Step 1: Service Type */}
      <CalcCard stepNum={step()} label={l.service}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SERVICE_TYPES.map(s => {
            const active = serviceId === s.id;
            return (
              <button key={s.id} onClick={() => { setServiceId(s.id); trackCalc("jewelry", "service", s.id); }}
                className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[160px] ${
                  active ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_0_6px_rgba(251,191,36,0.16)]" : "border-white/10 hover:border-white/30"
                }`}>
                {/* Background image (full visibility) */}
                {s.img && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img src={s.img} alt={t(s.label, lang)} loading="lazy"
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"
                      }`} />
                    {/* Gradient only at bottom, preserves image visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                    {/* Active state: amber tint */}
                    {active && (
                      <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />
                    )}
                  </div>
                )}
                {/* Text content at bottom */}
                <div className="relative p-3 h-full min-h-[160px] flex flex-col justify-end">
                  <div className={`text-xs sm:text-sm font-bold mb-1 drop-shadow-lg tile-ink ${active ? "text-amber-300" : "text-white"}`}>{t(s.label, lang)}</div>
                  <div className="text-[10px] text-neutral-200 break-words drop-shadow-md tile-ink">{t(s.desc, lang)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </CalcCard>

      {/* === NEW CREATION FLOW === */}
      {serviceId === "new" && (
        <>
          <CalcCard stepNum={step()} label={l.line}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRODUCT_LINES.map(pl => {
                const active = lineId === pl.id;
                return (
                  <button key={pl.id} onClick={() => { setLineId(pl.id); setTypeId(JEWELRY_TYPES[pl.id]?.[0]?.id || ""); trackCalc("jewelry", "line", pl.id); }}
                    className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[180px] ${
                      active ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_0_6px_rgba(251,191,36,0.16)]" : "border-white/10 hover:border-white/30"
                    }`}>
                    {/* Background image (full visibility) */}
                    {pl.img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img src={pl.img} alt={pl.label} loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-500 ${
                            active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"
                          }`} />
                        {/* Gradient only at bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                        {/* Active state: amber tint */}
                        {active && (
                          <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />
                        )}
                      </div>
                    )}
                    {/* Text content at bottom */}
                    <div className="relative p-3 h-full min-h-[180px] flex flex-col justify-end">
                      <div className={`text-sm sm:text-base font-bold mb-1 drop-shadow-lg tile-ink ${active ? "text-amber-300" : "text-white"}`}>{pl.label}</div>
                      <div className="text-[10px] text-neutral-200 break-words drop-shadow-md tile-ink">{t(pl.desc, lang)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CalcCard>

          <CalcCard stepNum={step()} label={l.type}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {types.map(jt => {
                const active = typeId === jt.id;
                const label = t(jt.label, lang);
                const hasImg = !!jt.img;
                return (
                  <button key={jt.id}
                    onClick={() => { setTypeId(jt.id); trackCalc("jewelry", "type", jt.id); }}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className={`w-full aspect-square rounded-lg overflow-hidden ${
                      hasImg ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {hasImg ? (
                        <img src={jt.img} alt={label} loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                      ) : (
                        <span className="text-2xl opacity-60">◆</span>
                      )}
                    </div>
                    <span className={`text-[11px] sm:text-xs text-center leading-tight break-all line-clamp-2 ${
                      active ? "text-amber-300 font-medium" : "text-neutral-400"
                    }`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CalcCard>

          {/* Calc mode tabs - visible only for chain types */}
          {isChainType(typeId) && (
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/8 mb-2">
              {[
                { id: "standard", pl: "Klasyczny", en: "Standard pricing", de: "Standardkalkulation" },
                { id: "from_stock", pl: "Własny kruszec", en: "From metal stock", de: "Aus Metallvorrat" },
              ].map(mode => (
                <button key={mode.id} onClick={() => setCalcMode(mode.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    calcMode === mode.id
                      ? "bg-amber-500 text-black shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}>
                  {mode[lang] ?? mode.pl}
                </button>
              ))}
            </div>
          )}

          {!isChainType(typeId) && <CalcCard stepNum={step()} label={l.weight}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {WEIGHTS.map(w => {
                const active = weightId === w.id;
                if (w.custom) {
                  return (
                    <button key={w.id} onClick={() => setWeightId(w.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-dashed border transition-all text-xs ${
                        active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                      }`}>
                      <span className="text-lg opacity-50">?</span>
                      <span className="text-center leading-tight">{t(w.label, lang)}</span>
                    </button>
                  );
                }
                return (
                  <button key={w.id} onClick={() => setWeightId(w.id)}
                    className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[130px] ${
                      active ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_0_6px_rgba(251,191,36,0.16)]" : "border-white/10 hover:border-white/30"
                    }`}>
                    {w.img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img src={w.img} alt={t(w.label, lang)} loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-500 ${active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                        {active && <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />}
                      </div>
                    )}
                    <div className="relative p-2.5 h-full min-h-[130px] flex flex-col justify-end">
                      <div className={`text-[11px] sm:text-xs font-bold mb-0.5 drop-shadow-lg tile-ink ${active ? "text-amber-300" : "text-white"}`}>{t(w.label, lang)}</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-300 break-words drop-shadow-md tile-ink leading-tight">{t(w.desc, lang)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CalcCard>}

          {/* Shape & Dimensions / Chain dimensions step */}
          <CalcCard stepNum={step()} label={isChainType(typeId)
            ? ({ pl: "Długość łańcuszka", en: "Chain length", de: "Kettenlänge" }[lang])
            : ({ pl: "Kształt i wymiary", en: "Shape & Dimensions", de: "Form & Abmessungen" }[lang] || "Shape & Dimensions")}>
            {isChainType(typeId) ? (() => {
              // Gender is already known from the selected product line - no separate toggle needed
              const necklaceGender = lineId === "men" ? "men" : "women";
              const necklacePresets = necklaceGender === "men" ? NECKLACE_LENGTHS_MEN : NECKLACE_LENGTHS_WOMEN;
              return (
              <div className="space-y-3">
                {/* Necklace/chain: SVG silhouette + preset lengths (gender derived from lineId) */}
                {isNecklaceChain(typeId) && (
                  <div className="flex gap-3 items-start">
                    {/* Silhouette - always dark container, always readable */}
                    <div className="w-24 sm:w-28 flex-shrink-0">
                      <ChainSilhouette lengthMm={chainLengthMm} gender={necklaceGender} />
                    </div>

                    {/* Preset length buttons */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-neutral-500 mb-1.5">
                        {{ pl: "Wybierz długość", en: "Select length", de: "Länge wählen" }[lang]}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                        {necklacePresets.map(len => (
                          <button key={len} onClick={() => setChainLengthMm(len)}
                            className={`py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${
                              chainLengthMm === len
                                ? "border-amber-400 bg-amber-400/10 text-amber-300"
                                : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                            }`}>
                            {len / 10} cm
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bracelet: simple preset grid (no silhouette needed) */}
                {typeId === "bracelet_m" && (
                  <div>
                    <p className="text-[10px] text-neutral-500 mb-1.5">
                      {{ pl: "Długość bransoletki", en: "Bracelet length", de: "Armbandlänge" }[lang]}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {BRACELET_LENGTHS.map(len => (
                        <button key={len} onClick={() => setChainLengthMm(len)}
                          className={`py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                            chainLengthMm === len
                              ? "border-amber-400 bg-amber-400/10 text-amber-300"
                              : "border-white/10 text-neutral-400 hover:border-white/20"
                          }`}>
                          {len / 10} cm
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chain WIDTH input - standard mode only; wire diameter & thickness auto-derived from AR */}
                {calcMode === "standard" && (
                  <div className="mt-3 space-y-3">
                    {/* Section separator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest px-1">
                        {{ pl: "Parametry łańcuszka", en: "Chain parameters", de: "Kettenparameter" }[lang]}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    {/* Width input */}
                    <label className="flex flex-col gap-1.5 w-fit">
                      <span className="text-xs text-neutral-400">
                        {{ pl: "Szerokość łańcuszka (mm)", en: "Chain width (mm)", de: "Kettenbreite (mm)" }[lang]}
                      </span>
                      <input type="number" min={1.0} max={20.0} step={0.5}
                        value={chainWidthMm || ""}
                        onChange={e => { const n = parseFloat(e.target.value); if (n > 0) setChainWidthMm(n); }}
                        className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50" />
                    </label>
                    {/* Derived values - 5-cell grid */}
                    {result && result.type === "calculated" && !result.fromStock && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
                        {[
                          { label: `Ø ${{ pl: "drut", en: "wire", de: "Draht" }[lang]}`, val: `${result.wireDMm?.toFixed(2)} mm` },
                          { label: { pl: "Grubość splotu", en: "Weave thickness", de: "Flechtdicke" }[lang], val: `${result.thicknessMm?.toFixed(1)} mm` },
                          { label: "AR", val: CHAIN_WEAVES.find(w => w.id === weaveId)?.ar?.toFixed(1) ?? " - " },
                          { label: "WF", val: `×${CHAIN_WEAVES.find(w => w.id === weaveId)?.weaveFactor ?? " - "}` },
                          { label: { pl: "Potrzeba kruszcu", en: "Metal needed", de: "Metall benötigt" }[lang], val: result.grossMassG != null ? `${result.grossMassG.toFixed(1)} g` : " - " },
                        ].map(d => (
                          <div key={d.label} className="text-center px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/8">
                            <div className="text-neutral-500 text-[9px]">{d.label}</div>
                            <div className="text-amber-300 font-semibold">{d.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* From-stock: mass input */}
                {calcMode === "from_stock" && (
                  <div className="mt-3 space-y-3">
                    {/* Section separator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest px-1">
                        {{ pl: "Dobór do posiadanego kruszcu", en: "From your metal stock", de: "Aus Ihrem Metallvorrat" }[lang]}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    <div className="p-3 rounded-xl border border-white/10 bg-neutral-900 space-y-3">
                      <p className="text-[11px] text-neutral-300">
                        {{ pl: "Podaj masę posiadanego kruszcu - grubość drutu i wymiary łańcuszka zostaną dobrane automatycznie na podstawie AR splotu.",
                           en: "Enter your available metal mass - wire diameter and chain dimensions will be auto-calculated from weave AR.",
                           de: "Geben Sie Ihre Metallmasse ein - Drahtdurchmesser und Kettenmaße werden aus dem AR automatisch berechnet." }[lang]}
                      </p>
                      <label className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                          {{ pl: "Masa kruszcu (g)", en: "Metal mass (g)", de: "Metallmasse (g)" }[lang]}
                        </span>
                        <input type="number" min={1} max={500} step={0.5}
                          value={stockMassG === "" ? "" : stockMassG}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "") { setStockMassG(""); return; }
                            const n = parseFloat(v);
                            if (!isNaN(n) && n >= 0) setStockMassG(n);
                          }}
                          className="w-28 bg-white/8 border border-amber-400/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/80" />
                        <span className="text-sm text-amber-400 font-bold">{stockMassG || " - "} g</span>
                      </label>
                      {/* Live derived dimensions - 5-cell grid */}
                      {result && result.type === "calculated" && result.fromStock && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[
                            { label: { pl: "Ø drut", en: "Ø wire", de: "Ø Draht" }[lang], val: `${result.wireDMm?.toFixed(2)} mm` },
                            { label: { pl: "Szerokość", en: "Width", de: "Breite" }[lang], val: `${result.widthMm?.toFixed(1)} mm` },
                            { label: { pl: "Grubość splotu", en: "Weave thk.", de: "Flechtdicke" }[lang], val: `${result.thicknessMm?.toFixed(1)} mm` },
                            { label: "AR", val: CHAIN_WEAVES.find(w => w.id === weaveId)?.ar?.toFixed(1) ?? " - " },
                            { label: "WF", val: `×${CHAIN_WEAVES.find(w => w.id === weaveId)?.weaveFactor ?? " - "}` },
                          ].map(d => (
                            <div key={d.label} className="text-center p-1.5 rounded-lg bg-neutral-800 border border-white/8">
                              <div className="text-[9px] text-neutral-400">{d.label}</div>
                              <div className="text-xs text-amber-400 font-bold">{d.val}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Waste summary */}
                      {result && result.type === "calculated" && result.fromStock && result.wasteG > 0 && (
                        <div className="text-[11px] text-neutral-200 border-t border-white/10 pt-2">
                          {{ pl: `Z ${stockMassG} g kruszcu powstanie ${result.netMassG?.toFixed(1) ?? (stockMassG - result.wasteG).toFixed(1)} g gotowego łańcuszka - ${result.wasteG.toFixed(1)} g to nieodwracalne straty technologiczne: ubytek na topieniu (utlenianie miedzi i zgar), odpady przy ciągnieniu drutu oraz szlam i trociny z polerowania.`,
                             en: `From ${stockMassG} g you'll receive ${result.netMassG?.toFixed(1) ?? (stockMassG - result.wasteG).toFixed(1)} g as a finished chain - ${result.wasteG.toFixed(1)} g is irreversible process loss: melt/fire loss (copper oxidation + slag), wire-drawing offcuts, and polishing swarf + filings.`,
                             de: `Von ${stockMassG} g erhalten Sie ${result.netMassG?.toFixed(1) ?? (stockMassG - result.wasteG).toFixed(1)} g als fertige Kette - ${result.wasteG.toFixed(1)} g sind unwiederbringliche Prozessverluste: Schmelzverlust (Kupferoxidation + Schlacke), Drahtzieh-Verschnitt sowie Polierschlamm + Feilspäne.` }[lang]}
                        </div>
                      )}
                      <ConsignedNote lang={lang} />
                    </div>
                  </div>
                )}
              </div>
              );
            })() : (
              productForm ? (
                <div className="space-y-5">
                  {/* Show which geometry model is being used */}
                  {(() => {
                    const pt = getProductType(productForm);
                    return pt ? (
                      <p className="text-xs text-neutral-400">
                        {pt.icon} {t(pt.label, lang)} - {t(pt.notes, lang)}
                      </p>
                    ) : null;
                  })()}
                  <DimensionInputs
                    productTypeId={productForm}
                    values={dimensions}
                    onChange={(id, val) => setDimensions(prev => ({ ...prev, [id]: val }))}
                    lang={lang}
                  />

                  {/* Live weight display */}
                  {weightResult && (
                    <WeightDisplay
                      nettoG={weightResult.nettoG}
                      bruttoG={weightResult.bruttoG}
                      metalName={t(METALS.find(m => m.id === metalId)?.label, lang) ?? ""}
                      lang={lang}
                      clientSuppliesMetal={clientSuppliesMetal}
                    />
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  {{ pl: "Szczegółowe wymiary niedostępne dla tego rodzaju biżuterii.", en: "Detailed dimensions not available for this jewelry type.", de: "Detaillierte Abmessungen für diesen Schmucktyp nicht verfügbar." }[lang]}
                </p>
              )
            )}
          </CalcCard>

          {/* Weave selection - chain types only */}
          {isChainType(typeId) && (
            <CalcCard stepNum={step()} label={{ pl: "Splot łańcuszka", en: "Chain weave", de: "Kettenmuster" }[lang]}>
              <p className="text-[10px] text-neutral-500 mb-2">
                {{ pl: "Kliknij dwukrotnie na zdjęcie - powiększ podgląd splotu", en: "Double-click an image to preview the weave pattern", de: "Doppelklick auf ein Bild zum Vergrößern" }[lang]}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {CHAIN_WEAVES.map(w => {
                  const active = weaveId === w.id;
                  if (w.custom) {
                    return (
                      <button key={w.id} onClick={() => setWeaveId(w.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-dashed border transition-all text-xs ${
                          active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                        }`}>
                        <span className="text-lg opacity-50">?</span>
                        <span className="text-center leading-tight">{t(w.label, lang)}</span>
                      </button>
                    );
                  }
                  return (
                    <button key={w.id} onClick={() => setWeaveId(w.id)}
                      className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                        active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                        onDoubleClick={e => { e.stopPropagation(); if (w.img) setWeaveModal(w.id); }}>
                        {w.img ? (
                          <img src={w.img} alt={t(w.label, lang)} loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                        ) : (
                          <span className="text-2xl opacity-40">⛓</span>
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-[11px] text-center leading-tight ${active ? "text-amber-300 font-medium" : "text-neutral-400"}`}>
                        {t(w.label, lang)}
                      </span>
                      <span className="text-[9px] text-neutral-500">×{w.weaveFactor}</span>
                    </button>
                  );
                })}
              </div>
              {clientSuppliesMetal && !CHAIN_WEAVES.find(w=>w.id===weaveId)?.custom && (
                <div className="mt-3 p-3 rounded-xl border border-amber-400/20 bg-amber-400/5 text-xs text-amber-300">
                  {{ pl: `Odpad technologiczny splotu ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.pl}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% materiału - uwzględnij zapas przy dostarczaniu kruszcu.`,
                     en: `Weave waste for ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.en}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% - account for this when supplying metal.`,
                     de: `Webabfall für ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.de}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% - beim Liefern des Metalls berücksichtigen.`
                  }[lang]}
                </div>
              )}
            </CalcCard>
          )}

          {/* Weave image lightbox modal */}
          {weaveModal && (() => {
            const wm = CHAIN_WEAVES.find(x => x.id === weaveModal);
            if (!wm || !wm.img) return null;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                onClick={() => setWeaveModal(null)}>
                <div className="relative max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                  <img src={wm.img} alt={t(wm.label, lang)}
                    className="w-full rounded-2xl shadow-2xl shadow-black/60" />
                  <div className="mt-4 text-center">
                    <p className="text-white font-bold text-xl">{t(wm.label, lang)}</p>
                    <p className="text-neutral-400 text-sm mt-1">
                      {{ pl: `AR ${wm.ar ?? " - "} · czynnik ×${wm.weaveFactor} · szer. ×${wm.widthMul ?? " - "} · gr. ×${wm.thicknessMul ?? " - "} · odpad ~${wm.materialWaste}%`,
                         en: `AR ${wm.ar ?? " - "} · factor ×${wm.weaveFactor} · width ×${wm.widthMul ?? " - "} · thk ×${wm.thicknessMul ?? " - "} · waste ~${wm.materialWaste}%`,
                         de: `AR ${wm.ar ?? " - "} · Faktor ×${wm.weaveFactor} · Breite ×${wm.widthMul ?? " - "} · Dicke ×${wm.thicknessMul ?? " - "} · Abfall ~${wm.materialWaste}%`
                      }[lang]}
                    </p>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                    onClick={() => setWeaveModal(null)}>✕</button>
                </div>
              </div>
            );
          })()}

          {/* Clasp selection - chain types only */}
          {isChainType(typeId) && (
            <CalcCard stepNum={step()} label={{ pl: "Zapięcie", en: "Clasp", de: "Verschluss" }[lang]}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {CHAIN_CLASPS.map(c => {
                  const active = claspId === c.id;
                  if (c.custom) {
                    return (
                      <button key={c.id} onClick={() => setClaspId(c.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-dashed border transition-all text-xs ${
                          active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                        }`}>
                        <span className="text-lg opacity-50">?</span>
                        <span className="text-center leading-tight">{t(c.label, lang)}</span>
                      </button>
                    );
                  }
                  return (
                    <button key={c.id} onClick={() => setClaspId(c.id)}
                      className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                        active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
                        {c.img ? (
                          <img src={c.img} alt={t(c.label, lang)} loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                        ) : (
                          <span className="text-2xl opacity-40 flex items-center justify-center h-full">🔗</span>
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-[11px] text-center leading-tight ${active ? "text-amber-300 font-medium" : "text-neutral-400"}`}>
                        {t(c.label, lang)}
                      </span>
                      <span className="text-[9px] text-neutral-500">+{c.cost} PLN</span>
                    </button>
                  );
                })}
              </div>
            </CalcCard>
          )}

          <CalcCard stepNum={step()} label={l.metal}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2 sm:gap-3">
              {METALS.filter(m => !m.custom).map(m => {
                const active = metalId === m.id;
                const label = t(m.label, lang);
                return (
                  <button key={m.id} onClick={() => { setMetalId(m.id); trackCalc("jewelry", "metal", m.id); }}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className={`w-full aspect-square rounded-lg overflow-hidden ${
                      m.img ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {m.img ? (
                        <img src={m.img} alt={label} loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                      ) : (
                        <span className="text-2xl opacity-60">⬡</span>
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-all line-clamp-2 ${
                      active ? "text-amber-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
              {/* Custom metal chip */}
              {METALS.filter(m => m.custom).map(m => {
                const active = metalId === m.id;
                return (
                  <button key={m.id} onClick={() => { setMetalId(m.id); trackCalc("jewelry", "metal", m.id); }}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-dashed border transition-all text-xs ${
                      active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                    }`}>
                    <span className="text-lg opacity-50">?</span>
                    <span className="text-center leading-tight">{t(m.label, lang)}</span>
                  </button>
                );
              })}
            </div>
            {/* Client supplies metal toggle - hidden in from_stock mode (metal is always client-supplied there) */}
            {!(isChainType(typeId) && calcMode === "from_stock") && <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
              border-white/8 hover:border-amber-400/20"
              onClick={() => setClientSuppliesMetal(v => !v)}
              style={clientSuppliesMetal ? {borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.05)'} : {}}
            >
              <button
                type="button"
                role="switch"
                aria-checked={clientSuppliesMetal}
                onClick={e => { e.stopPropagation(); setClientSuppliesMetal(v => !v); }}
                className={`relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${
                  clientSuppliesMetal ? "bg-amber-500" : "bg-neutral-700"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  clientSuppliesMetal ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
              <div>
                <div className="text-sm font-medium text-neutral-300">
                  {{ pl: "Kruszec od klienta", en: "Client supplies metal", de: "Metall vom Kunden" }[lang]}
                </div>
                {clientSuppliesMetal && (
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {{ pl: "Odejmiemy koszt metalu - dostarcz kruszec przed realizacją", en: "Metal cost excluded - supply raw metal before production", de: "Metallkosten entfallen - Rohmetall vor der Produktion liefern" }[lang]}
                  </div>
                )}
                {clientSuppliesMetal && (
                  <div onClick={e => e.stopPropagation()}>
                    <ConsignedNote lang={lang} />
                  </div>
                )}
              </div>
            </div>}
          </CalcCard>

          {!isChainType(typeId) && <CalcCard stepNum={step()} label={l.method}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METHODS.filter(m => !m.custom).map(m => {
                const active = methodId === m.id;
                return (
                  <button key={m.id} onClick={() => setMethodId(m.id)}
                    className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[140px] ${
                      active ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_0_6px_rgba(251,191,36,0.16)]" : "border-white/10 hover:border-white/30"
                    }`}>
                    {m.img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img src={m.img} alt={t(m.label, lang)} loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-500 ${active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                        {active && <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />}
                      </div>
                    )}
                    <div className="relative p-3 h-full min-h-[140px] flex flex-col justify-end">
                      <div className={`text-xs sm:text-sm font-bold mb-1 drop-shadow-lg tile-ink ${active ? "text-amber-300" : "text-white"}`}>{t(m.label, lang)}</div>
                      <div className="text-[10px] text-neutral-300 break-words drop-shadow-md tile-ink">{t(m.desc, lang)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CalcCard>}

          <CalcCard stepNum={step()} label={l.plating}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {PLATING.map(pl => {
                const active = platingId === pl.id;
                const label = t(pl.label, lang);
                if (!pl.img && !pl.custom) {
                  // "none" - simple chip
                  return (
                    <button key={pl.id} onClick={() => setPlatingId(pl.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all text-xs ${
                        active ? "border-amber-400 bg-amber-400/10 text-amber-300 font-medium" : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                      }`}>
                      <span className="text-lg opacity-50">∅</span>
                      <span className="text-center leading-tight">{label}</span>
                    </button>
                  );
                }
                if (pl.custom) {
                  return (
                    <button key={pl.id} onClick={() => setPlatingId(pl.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-dashed border transition-all text-xs ${
                        active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                      }`}>
                      <span className="text-lg opacity-50">?</span>
                      <span className="text-center leading-tight">{label}</span>
                    </button>
                  );
                }
                return (
                  <button key={pl.id} onClick={() => setPlatingId(pl.id)}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
                      <img src={pl.img} alt={label} loading="lazy"
                        className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                    </div>
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-all line-clamp-2 ${
                      active ? "text-amber-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>

          <CalcCard stepNum={step()} label={typeId === "signet"
            ? ({ pl: "Grawerowanie oczka sygnetu", en: "Signet bezel engraving", de: "Siegelkopf-Gravur" }[lang] ?? l.engraving)
            : l.engraving}>
            {typeId === "signet" && (
              <p className="text-[11px] text-neutral-500 mb-3">
                {{ pl: "Grawer nakładany jest bezpośrednio na oczko sygnetu - może współistnieć z kamieniem lub zastąpić go.",
                   en: "Engraving is applied directly to the signet bezel - it can coexist with a stone or replace it.",
                   de: "Gravur wird direkt auf den Siegelkopf aufgetragen - kann mit einem Stein kombiniert werden oder ihn ersetzen." }[lang]}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ENGRAVING_OPTIONS.map(opt => {
                const active = engravingId === opt.id;
                return (
                  <button key={opt.id} onClick={() => setEngravingId(opt.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs text-center transition-all ${
                      active
                        ? "border-amber-400 bg-amber-400/10 text-amber-300 font-medium"
                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                    }`}>
                    <span className="text-lg leading-none">{opt.cost === 0 ? "∅" : "✦"}</span>
                    <span className="leading-tight break-words">{t(opt.label, lang)}</span>
                    {opt.cost > 0 && <span className="text-[9px] opacity-60">+{opt.cost} PLN</span>}
                  </button>
                );
              })}
            </div>
          </CalcCard>

          {!isChainType(typeId) && (
            <CalcCard stepNum={step()} label={typeId === "signet"
              ? ({ pl: "Kamień w oczku sygnetu", en: "Stone in signet bezel", de: "Stein im Siegelkopf" }[lang] ?? l.gem)
              : l.gem}>
              <StoneComposer
                stoneRows={stoneRows}
                onChange={setStoneRows}
                lang={lang}
                gemstones={resolvedGemstones}
              />
            </CalcCard>
          )}
        </>
      )}

      {/* === RENOVATION FLOW === */}
      {serviceId === "renovation" && (
        <>
          <CalcCard stepNum={step()} label={l.jewType}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {GENERIC_TYPES.map(jt => {
                const active = renoJewType === jt.id;
                const label = t(jt.label, lang);
                return (
                  <button key={jt.id} onClick={() => setRenoJewType(jt.id)}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-sky-400 bg-sky-400/10 shadow-lg shadow-sky-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className={`w-full aspect-square rounded-lg overflow-hidden relative ${
                      jt.img ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {jt.img ? (
                        <>
                          <img src={jt.img} alt={label} loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`}
                            style={{ filter: "grayscale(30%) sepia(20%)" }} />
                          <div className="absolute inset-0 bg-sky-900/30 mix-blend-multiply" />
                        </>
                      ) : (
                        <span className="text-2xl opacity-40">?</span>
                      )}
                    </div>
                    <span className={`text-[11px] sm:text-xs text-center leading-tight break-words ${
                      active ? "text-sky-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>
          <CalcCard stepNum={step()} label={l.metalType}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {RENOVATION_METALS.map(m => {
                const active = renoMetal === m.id;
                const label = t(m.label, lang);
                if (!m.img) {
                  return (
                    <button key={m.id} onClick={() => setRenoMetal(m.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-dashed border transition-all text-xs ${
                        active ? "border-sky-400 text-sky-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                      }`}>
                      <span className="text-lg opacity-50">?</span>
                      <span className="text-center leading-tight">{label}</span>
                    </button>
                  );
                }
                return (
                  <button key={m.id} onClick={() => setRenoMetal(m.id)}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-sky-400 bg-sky-400/10 shadow-lg shadow-sky-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className="w-full aspect-square rounded-lg overflow-hidden relative bg-black">
                      <img src={m.img} alt={label} loading="lazy"
                        className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`}
                        style={{ filter: "grayscale(30%) sepia(20%)" }} />
                      <div className="absolute inset-0 bg-sky-900/30 mix-blend-multiply" />
                    </div>
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-words ${
                      active ? "text-sky-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>
          <CalcCard stepNum={step()} label={l.renoServices}>
            <div className="flex flex-wrap gap-2">
              {RENOVATION_SERVICES.map(svc => {
                const active = renoServices.includes(svc.id);
                return (
                  <button key={svc.id} onClick={() => toggleRenoService(svc.id)}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border text-xs sm:text-sm transition-all duration-200 max-w-full break-words ${
                      active ? "border-amber-400 bg-amber-400/10 text-amber-300 font-medium"
                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                    }`}>
                    {t(svc.label, lang)}
                  </button>
                );
              })}
            </div>
          </CalcCard>
        </>
      )}

      {/* === REPAIR FLOW === */}
      {serviceId === "repair" && (
        <>
          <CalcCard stepNum={step()} label={l.jewType}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {GENERIC_TYPES.map(jt => {
                const active = repairJewType === jt.id;
                const label = t(jt.label, lang);
                return (
                  <button key={jt.id} onClick={() => setRepairJewType(jt.id)}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className={`w-full aspect-square rounded-lg overflow-hidden relative ${
                      jt.img ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {jt.img ? (
                        <>
                          <img src={jt.img} alt={label} loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`}
                            style={{ filter: "grayscale(45%) contrast(110%) sepia(10%)" }} />
                          <div className="absolute inset-0 bg-orange-900/25 mix-blend-multiply" />
                        </>
                      ) : (
                        <span className="text-2xl opacity-40">?</span>
                      )}
                    </div>
                    <span className={`text-[11px] sm:text-xs text-center leading-tight break-words ${
                      active ? "text-orange-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>
          <CalcCard stepNum={step()} label={l.metalType}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Naprawa wymaga lutowania, wiec bez platyny. */}
              {REPAIR_METALS.map(m => {
                const active = repairMetal === m.id;
                const label = t(m.label, lang);
                if (!m.img) {
                  return (
                    <button key={m.id} onClick={() => setRepairMetal(m.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-dashed border transition-all text-xs ${
                        active ? "border-orange-400 text-orange-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                      }`}>
                      <span className="text-lg opacity-50">?</span>
                      <span className="text-center leading-tight">{label}</span>
                    </button>
                  );
                }
                return (
                  <button key={m.id} onClick={() => setRepairMetal(m.id)}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      active ? "border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className="w-full aspect-square rounded-lg overflow-hidden relative bg-black">
                      <img src={m.img} alt={label} loading="lazy"
                        className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`}
                        style={{ filter: "grayscale(45%) contrast(110%) sepia(10%)" }} />
                      <div className="absolute inset-0 bg-orange-900/25 mix-blend-multiply" />
                    </div>
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-words ${
                      active ? "text-orange-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>
          <CalcCard stepNum={step()} label={l.repairType}>
            <Chips options={REPAIR_SERVICES} value={repairId} onChange={setRepairId} lang={lang} />
          </CalcCard>
        </>
      )}

      {/* Quantity */}
      <CalcCard stepNum={step()} label={l.qty}>
        <Chips options={QTY_TIERS} value={qtyId} onChange={(id) => setQty(qtyForTier(id, QTY_TIERS))} lang={lang} />
        <QuantityStepper label={t(QTY_STEPPER_LBL, lang)} value={qty} onChange={setQty}
          min={1} max={qtyLimit(QTY_TIERS)} openValue={qtyOpenValue(QTY_TIERS)} lang={lang} accent="amber" />
      </CalcCard>

      {/* Result */}
      <div className="rounded-2xl border-2 border-amber-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        <div className="mt-3 text-[10px] text-neutral-400 text-center italic">{l.priceSource}</div>
        <p className="text-xs text-neutral-500 mt-1 text-center">{RATE_NOTE[lang] || RATE_NOTE.pl}</p>
      </div>

      {/* Do koszyka trafia tylko to, co sklep potrafi wycenic wiazaco.
          Reszta idzie ta sama droga co dotad, tyle ze z tego samego okna. */}
      <NextStepPanel
        lang={lang}
        accent="amber"
        techLabel={t(TECH_LABEL, lang)}
        paramsSummary={paramsSummary}
        result={result}
        cartAvailable={!cartBlocked}
        rateSnapshot={{
          au: rates.au_pln_per_g,
          ag: rates.ag_pln_per_g,
          pt: rates.pt_pln_per_g,
          pln_per_eur: rates.pln_per_eur,
          sources: rates.sources,
        }}
        cart={
          <CalcToCart
            embedded
            onBinding={setBindingGrosze}
            calculator={serviceId === "renovation" ? "jewelry_renovation" : serviceId === "repair" ? "jewelry_repair" : "jewelry_new"}
            serviceId={serviceId === "renovation" ? "jewelry_renovation" : serviceId === "repair" ? "jewelry_repair" : "jewelry_plain"}
            params={
              serviceId === "renovation"
                ? { jewTypeId: renoJewType, metalTypeId: renoMetal, services: renoServices, qtyId }
                : serviceId === "repair"
                  ? { jewTypeId: repairJewType, metalTypeId: repairMetal, repairId, qtyId }
                  : { lineId, typeId, metalId, weightId, methodId, platingId, engravingId, qtyId }
            }
            qty={qty}
            blocked={cartBlocked}
            blockedReason="manual"
            lang={lang}
            accent="amber"
          />
        }
      />
    </div>
  );
}
