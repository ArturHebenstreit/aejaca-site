// ============================================================
// JEWELRY ESTIMATOR — AEJaCA Jewelry
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, QuoteEmailCapture } from "./calcShared.jsx";
import { trackCalc } from "../../utils/analytics.js";
import { useMarketRates } from "../../hooks/useMarketRates.js";
import { useGemPrices } from "../../hooks/useGemPrices.js";
import {
  METAL_PRICES, EUR_PLN, MARGIN, REPAIR_MARGIN, TOL_LOW, TOL_HIGH,
  SERVICE_TYPES, PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING,
  ENGRAVING_OPTIONS,
  GEMSTONES, STONE_SIZES, DIAMOND_CLARITY, DIAMOND_COLOR, GEM_QUALITY, CERTIFICATIONS,
  RENOVATION_SERVICES, REPAIR_SERVICES,
  REPAIR_METAL_MUL, QTY_TIERS, GENERIC_TYPES, GENERIC_METALS,
  CHAIN_WEAVES, CHAIN_CLASPS, CHAIN_DEFAULT_LENGTH,
  NECKLACE_LENGTHS_WOMEN, NECKLACE_LENGTHS_MEN, BRACELET_LENGTHS,
  CHAIN_SVG_Y_WOMEN, CHAIN_SVG_Y_MEN,
} from "./jewelryConfig.js";
import { getProductType } from "./jewelry/productConfig.js";
import { calcWeight as computeWeight } from "./jewelry/WeightEngine.js";
import DimensionInputs from "./jewelry/DimensionInputs.jsx";
import WeightDisplay from "./jewelry/WeightDisplay.jsx";
import StoneComposer from "./jewelry/StoneComposer.jsx";

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
        <g stroke="rgba(255,255,255,0.55)" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

// Density (g/cm³) by metal type key
const METAL_DENSITY = {
  gold: 19.3,      // approximated as 24k; purity scaling handled implicitly
  silver: 10.5,
  platinum: 21.4,
};

const LBL = {
  pl: {
    service: "Typ usługi", line: "Linia produktowa", type: "Rodzaj biżuterii",
    metal: "Kruszec i próba", weight: "Waga / masywność", method: "Metoda wytworzenia",
    plating: "Powłoka galwaniczna", gem: "Kamień", stoneSize: "Wielkość kamienia",
    stoneCount: "Liczba kamieni", clarity: "Czystość (diament)", color: "Barwa (diament)",
    quality: "Jakość kamienia", cert: "Certyfikat", qty: "Nakład",
    metalCost: "Kruszec", laborCost: "Robocizna", gemCost: "Kamienie",
    platingCost: "Powłoka galwaniczna", settingCost: "Osadzanie kamieni",
    workshop: "Warsztat i podatki lokalne", estCost: "Koszt szacunkowy / szt.", discount: "Rabat",
    serviceLabel: "Usługi", repairLabel: "Naprawa", repairType: "Rodzaj naprawy",
    renoServices: "Usługi renowacyjne", jewType: "Rodzaj biżuterii", metalType: "Kruszec",
    serviceCost: "Koszt usług", materialCost: "Materiały", total: "Łącznie",
    priceSource: "Ceny kruszców: LBMA/Kitco | Kamienie: Rapaport/GemVal",
    engraving: "Grawerowanie laserowe",
  },
  en: {
    service: "Service type", line: "Product line", type: "Jewelry type",
    metal: "Metal & purity", weight: "Weight / boldness", method: "Manufacturing method",
    plating: "Galvanic plating", gem: "Gemstone", stoneSize: "Stone size",
    stoneCount: "Number of stones", clarity: "Clarity (diamond)", color: "Color (diamond)",
    quality: "Stone quality", cert: "Certificate", qty: "Quantity",
    metalCost: "Metal", laborCost: "Labor", gemCost: "Gemstones",
    platingCost: "Galvanic plating", settingCost: "Stone setting",
    workshop: "Workshop & local taxes", estCost: "Estimated cost / pc", discount: "Discount",
    serviceLabel: "Services", repairLabel: "Repair", repairType: "Repair type",
    renoServices: "Renovation services", jewType: "Jewelry type", metalType: "Metal",
    serviceCost: "Service cost", materialCost: "Materials", total: "Total",
    priceSource: "Metal prices: LBMA/Kitco | Gems: Rapaport/GemVal",
    engraving: "Laser engraving",
  },
  de: {
    service: "Dienstleistungstyp", line: "Produktlinie", type: "Schmuckart",
    metal: "Metall & Feingehalt", weight: "Gewicht / Massivität", method: "Herstellungsmethode",
    plating: "Galvanische Beschichtung", gem: "Edelstein", stoneSize: "Steingröße",
    stoneCount: "Anzahl der Steine", clarity: "Reinheit (Diamant)", color: "Farbe (Diamant)",
    quality: "Steinqualität", cert: "Zertifikat", qty: "Auflage",
    metalCost: "Metall", laborCost: "Arbeit", gemCost: "Edelsteine",
    platingCost: "Galvanische Beschichtung", settingCost: "Steinfassung",
    workshop: "Werkstatt & lokale Steuern", estCost: "Geschätzte Kosten / Stk.", discount: "Rabatt",
    serviceLabel: "Dienstleistungen", repairLabel: "Reparatur", repairType: "Reparaturart",
    renoServices: "Renovierungsleistungen", jewType: "Schmuckart", metalType: "Metall",
    serviceCost: "Servicekosten", materialCost: "Materialien", total: "Gesamt",
    priceSource: "Metallpreise: LBMA/Kitco | Steine: Rapaport/GemVal",
    engraving: "Lasergravur",
  },
};

function applyJewelryPricing(baseCost, discountRate, qty, margin = MARGIN, eurPln = EUR_PLN) {
  const basePrice = baseCost * (1 + margin);
  const discounted = basePrice * (1 - discountRate);
  const perMin = Math.round(discounted * (1 - TOL_LOW));
  const perMax = Math.round(discounted * (1 + TOL_HIGH));
  return {
    perPcPLN: { min: Math.max(1, perMin), max: Math.max(1, perMax) },
    perPcEUR: { min: Math.max(1, Math.round(perMin / eurPln)), max: Math.max(1, Math.round(perMax / eurPln)) },
    totalPLN: { min: Math.max(1, perMin) * qty, max: Math.max(1, perMax) * qty },
    totalEUR: { min: Math.round((Math.max(1, perMin) * qty) / eurPln), max: Math.round((Math.max(1, perMax) * qty) / eurPln) },
  };
}

// Map metal.metal key to live rates field
function resolveMetalPricePerG(metalKey, rates) {
  if (metalKey === "gold")     return rates?.au_pln_per_g ?? METAL_PRICES.gold.plnPerG;
  if (metalKey === "silver")   return rates?.ag_pln_per_g ?? METAL_PRICES.silver.plnPerG;
  if (metalKey === "platinum") return rates?.pt_pln_per_g ?? METAL_PRICES.platinum.plnPerG;
  return METAL_PRICES[metalKey]?.plnPerG ?? 0;
}

// ---- NEW CREATION CALCULATOR ----
export function calcNew({ lineId, typeId, metalId, weightId, methodId, platingId,
  stoneRows, qtyId, engravingId,
  clientSuppliesMetal, overrideWeightG }, lang, rates, gemstones) {
  const l = LBL[lang] || LBL.en;
  const line = PRODUCT_LINES.find(p => p.id === lineId);
  const jType = JEWELRY_TYPES[lineId]?.find(j => j.id === typeId);
  const metal = METALS.find(m => m.id === metalId);
  const weight = WEIGHTS.find(w => w.id === weightId);
  const method = METHODS.find(m => m.id === methodId);
  const plat = PLATING.find(p => p.id === platingId);
  const qTier = QTY_TIERS.find(q => q.id === qtyId);

  if (!line || !jType || !metal || !weight || !method || !plat || !qTier) return null;
  if (metal.custom || weight.custom || method.custom || plat.custom || qTier.custom) return { type: "custom" };

  // Metal cost — use live rates when available, fall back to static config
  const plnPerG = resolveMetalPricePerG(metal.metal, rates);
  // Use geometric weight override if provided (from WeightEngine), else fall back to baseWeight × mul
  const weightG = (overrideWeightG != null && overrideWeightG > 0)
    ? overrideWeightG
    : jType.baseWeight * weight.mul;
  const metalCost = clientSuppliesMetal ? 0 : weightG * plnPerG * metal.purity;

  // Labor cost (weight affects labor — lighter pieces need less finishing)
  const laborCost = jType.laborH * method.laborRate * method.laborMul * metal.laborMul * jType.complexity * (weight.laborMul || 1);

  // Stone costs — iterate all rows
  let gemCost = 0;
  let settingCost = 0;
  const _gems = gemstones || GEMSTONES;

  for (const row of (stoneRows || [])) {
    if (!row.gemId || row.gemId === "none") continue;
    const gem = _gems.find(g => g.id === row.gemId);
    if (!gem || gem.custom || !gem.basePLN) continue;

    const stoneSize = STONE_SIZES.find(s => s.id === row.stoneSizeId);
    if (!stoneSize || stoneSize.custom) continue;

    const count = Math.max(1, parseInt(row.count) || 1);

    // Quality multiplier
    let qualMul = 1.0;
    if (gem.hasGrades && (gem.id === "diamond" || gem.id === "lab_diamond")) {
      const cl = DIAMOND_CLARITY.find(c => c.id === row.clarityId);
      const co = DIAMOND_COLOR.find(c => c.id === row.colorId);
      if (cl && co) qualMul = cl.mul * co.mul;
    } else if (gem.hasGrades) {
      const q = GEM_QUALITY.find(q => q.id === row.qualityId);
      if (q) qualMul = q.mul;
    }

    // Cert
    const cert = CERTIFICATIONS.find(c => c.id === row.certId);
    const certMul = cert?.mul ?? 1.0;

    const pricePerStone = gem.basePLN * stoneSize.priceMul * qualMul * certMul;

    // Only add gem purchase cost if NOT supplied by client
    if (row.suppliedBy !== "client") {
      gemCost += pricePerStone * count;
    }

    // Setting cost always applies (regardless of who supplies the stone)
    settingCost += count * (stoneSize.ct >= 0.3 ? 120 : 60);
  }

  // Plating
  const platingCost = plat.cost;

  // Engraving
  const engraving = ENGRAVING_OPTIONS.find(e => e.id === (engravingId || "none"));
  const engravingCost = engraving?.cost ?? 0;

  const baseCost = metalCost + laborCost + gemCost + settingCost + platingCost + engravingCost;
  const workshopCost = baseCost * MARGIN;
  const estCost = baseCost + workshopCost;
  const qty = qTier.qty;
  const liveEurPln = rates?.pln_per_eur ?? EUR_PLN;
  const pricing = applyJewelryPricing(baseCost, qTier.discount, qty, MARGIN, liveEurPln);

  return {
    type: "calculated", ...pricing, qty, discount: qTier.discount,
    breakdown: [
      { label: `${l.metalCost} (${weightG.toFixed(1)}g ${t(metal.label, lang)})`, value: fmtCost(metalCost, lang) },
      { label: l.laborCost, value: fmtCost(laborCost, lang) },
      ...(gemCost > 0 ? [{ label: l.gemCost, value: fmtCost(gemCost, lang) }] : []),
      ...(settingCost > 0 ? [{ label: l.settingCost, value: fmtCost(settingCost, lang) }] : []),
      ...(platingCost > 0 ? [{ label: l.platingCost, value: fmtCost(platingCost, lang) }] : []),
      ...(engravingCost > 0 ? [{ label: { pl: "Grawerowanie laserowe", en: "Laser engraving", de: "Lasergravur" }[lang] ?? "Laser engraving", value: fmtCost(engravingCost, lang) }] : []),
      { label: l.workshop, value: fmtCost(workshopCost, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(estCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

// Wire diameter validity range for from-stock feedback
const WIRE_D_MIN_MM = 0.4;
const WIRE_D_MAX_MM = 3.0;

// ---- CHAIN / NECKLACE / BRACELET CALCULATOR ----
// AR (Aspect Ratio = ID / wire_diameter) is defined per weave in CHAIN_WEAVES.
// In from_stock mode: user supplies mass + picks length → we derive wire diameter.
// In standard mode: user picks length + wire diameter → mass is computed.
// Standard mode: user inputs chainWidthMm (visible chain width) → wire diameter derived from AR.
// From-stock mode: user inputs stockMassG + picks length → wire diameter derived from physics.
export function calcChain({ typeId, metalId, weaveId, claspId, platingId, engravingId,
  chainLengthMm, chainWidthMm,
  clientSuppliesMetal, qtyId, calcMode, stockMassG }, lang, rates) {
  const l = LBL[lang] || LBL.en;
  const ln = (pl, en, de) => ({ pl, en, de }[lang] ?? pl);
  const metal = METALS.find(m => m.id === metalId);
  const weave = CHAIN_WEAVES.find(w => w.id === weaveId);
  const clasp = CHAIN_CLASPS.find(c => c.id === claspId);
  const plat = PLATING.find(p => p.id === platingId);
  const qTier = QTY_TIERS.find(q => q.id === qtyId);
  const engraving = ENGRAVING_OPTIONS.find(e => e.id === (engravingId || "none"));

  if (!metal || !weave || !clasp || !plat || !qTier) return null;
  if (metal.custom || plat.custom || qTier.custom || weave.custom || clasp.custom) return { type: "custom" };

  const density = METAL_DENSITY[metal.metal] ?? 10.5;
  const wasteFactor = 1 + weave.materialWaste / 100;
  const ar = weave.ar ?? 4.0;
  const fromStock = calcMode === "from_stock";
  const inputMassG = fromStock ? (stockMassG || 10) : null;
  const lengthCm = (chainLengthMm || 450) / 10;

  let wireDMm, wireDCm;

  if (fromStock) {
    // Derive wire diameter from mass + selected length + weave physics
    // grossMass = π × (d/2)² × lengthCm × density × weaveFactor × wasteFactor
    // → d = sqrt(grossMass / (π/4 × lengthCm × density × weaveFactor × wasteFactor))
    const d2 = inputMassG / ((Math.PI / 4) * lengthCm * density * weave.weaveFactor * wasteFactor);
    wireDCm = Math.sqrt(Math.max(0, d2));
    wireDMm = wireDCm * 10;
  } else {
    // User inputs chain WIDTH → wire diameter derived from weave's widthMul
    const inputWidthMm = chainWidthMm || 3.0;
    wireDMm = inputWidthMm / (weave.widthMul ?? 4.0);
    wireDCm = wireDMm / 10;
  }

  const r = wireDCm / 2;
  const wireVolPerCm = Math.PI * r * r; // cm³ per cm of chain
  const netMassG   = lengthCm * wireVolPerCm * density * weave.weaveFactor; // metal in finished chain
  const grossMassG = netMassG * wasteFactor;   // metal you need to supply (includes production waste)
  const wasteG     = grossMassG - netMassG;    // production loss (polishing chips, sprues)

  // Derived chain dimensions from AR
  const innerDiamMm  = ar * wireDMm;
  const widthMm      = (weave.widthMul ?? 4.0) * wireDMm;
  const thicknessMm  = (weave.thicknessMul ?? 2.0) * wireDMm;

  const wireDWarning = fromStock && (wireDMm < WIRE_D_MIN_MM || wireDMm > WIRE_D_MAX_MM);

  const plnPerG = resolveMetalPricePerG(metal.metal, rates);
  const effectiveClientMetal = fromStock ? true : clientSuppliesMetal;
  const metalCost = effectiveClientMetal ? 0 : grossMassG * plnPerG * metal.purity;

  const BASE_CHAIN_LABOR_RATE = 48; // PLN per 10 cm, calibrated to market rates
  const laborCost    = (lengthCm / 10) * BASE_CHAIN_LABOR_RATE * weave.laborMul * metal.laborMul;
  const claspCost    = clasp.cost;
  const platingCost  = plat.cost;
  const engravingCost = engraving?.cost ?? 0;

  const baseCost     = metalCost + laborCost + claspCost + platingCost + engravingCost;
  const workshopCost = baseCost * MARGIN;
  const qty          = qTier.qty;
  const liveEurPln   = rates?.pln_per_eur ?? EUR_PLN;
  const pricing      = applyJewelryPricing(baseCost, qTier.discount, qty, MARGIN, liveEurPln);

  return {
    type: "calculated", ...pricing, qty, discount: qTier.discount,
    fromStock, wireDMm, widthMm, thicknessMm, wasteG,
    breakdown: [
      // Dimensions summary
      { label: ln(
          `🔗 ${lengthCm.toFixed(1)} cm · Ø drut ${wireDMm.toFixed(2)} mm · szer. ${widthMm.toFixed(1)} mm · gr. ${thicknessMm.toFixed(1)} mm (AR ${ar.toFixed(1)})`,
          `🔗 ${lengthCm.toFixed(1)} cm · Ø wire ${wireDMm.toFixed(2)} mm · w ${widthMm.toFixed(1)} mm · t ${thicknessMm.toFixed(1)} mm (AR ${ar.toFixed(1)})`,
          `🔗 ${lengthCm.toFixed(1)} cm · Ø Draht ${wireDMm.toFixed(2)} mm · Br. ${widthMm.toFixed(1)} mm · Dicke ${thicknessMm.toFixed(1)} mm (AR ${ar.toFixed(1)})`
        ), value: "", bold: false },
      // Wire diameter warning (from_stock only)
      ...(wireDWarning ? [{ label: ln(
          `⚠ Grubość drutu ${wireDMm.toFixed(2)} mm jest ${wireDMm < WIRE_D_MIN_MM ? "zbyt mała" : "zbyt duża"} — zmień długość lub masę`,
          `⚠ Wire ${wireDMm.toFixed(2)} mm is ${wireDMm < WIRE_D_MIN_MM ? "too thin" : "too thick"} — adjust length or mass`,
          `⚠ Draht ${wireDMm.toFixed(2)} mm ist ${wireDMm < WIRE_D_MIN_MM ? "zu dünn" : "zu dick"} — Länge oder Masse anpassen`
        ), value: "", accent: true }] : []),
      // Waste row (from_stock — key client information)
      ...(fromStock ? [{ label: ln(
          `♻ Twój kruszec: ${inputMassG.toFixed(1)} g → łańcuszek: ${netMassG.toFixed(1)} g + odpady: ${wasteG.toFixed(1)} g (szlam jubilerski)`,
          `♻ Your metal: ${inputMassG.toFixed(1)} g → chain: ${netMassG.toFixed(1)} g + waste: ${wasteG.toFixed(1)} g (polishing swarf)`,
          `♻ Ihr Metall: ${inputMassG.toFixed(1)} g → Kette: ${netMassG.toFixed(1)} g + Abfall: ${wasteG.toFixed(1)} g (Polierschlamm)`
        ), value: "", accent: true }] : []),
      // Standard-mode mass + waste info
      ...(!fromStock ? [{ label: ln(
          `Masa: ${grossMassG.toFixed(1)} g (w łańcuszku: ${netMassG.toFixed(1)} g + ${wasteG.toFixed(1)} g odpadów)`,
          `Mass: ${grossMassG.toFixed(1)} g (in chain: ${netMassG.toFixed(1)} g + ${wasteG.toFixed(1)} g waste)`,
          `Masse: ${grossMassG.toFixed(1)} g (in Kette: ${netMassG.toFixed(1)} g + ${wasteG.toFixed(1)} g Abfall)`
        ), value: "" }] : []),
      // Cost rows
      { label: `${l.metalCost} (${grossMassG.toFixed(1)} g ${t(metal.label, lang)})`,
        value: fmtCost(metalCost, lang) },
      { label: l.laborCost, value: fmtCost(laborCost, lang) },
      { label: ln("Zapięcie", "Clasp", "Verschluss"), value: fmtCost(claspCost, lang) },
      ...(platingCost > 0 ? [{ label: l.platingCost, value: fmtCost(platingCost, lang) }] : []),
      ...(engravingCost > 0 ? [{ label: l.engraving, value: fmtCost(engravingCost, lang) }] : []),
      { label: l.workshop, value: fmtCost(workshopCost, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost + workshopCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

// ---- RENOVATION CALCULATOR ----
export function calcRenovation({ jewTypeId, metalTypeId, services, qtyId }, lang) {
  const l = LBL[lang] || LBL.en;
  const gMetal = GENERIC_METALS.find(m => m.id === metalTypeId);
  const qTier = QTY_TIERS.find(q => q.id === qtyId);
  if (!gMetal || !qTier || qTier.custom || services.length === 0) return services.length === 0 ? null : { type: "custom" };

  const metalMul = REPAIR_METAL_MUL[gMetal.metalKey] || 1.0;
  let totalService = 0;
  const rows = [];
  for (const svcId of services) {
    const svc = RENOVATION_SERVICES.find(s => s.id === svcId);
    if (svc) {
      const cost = svc.basePLN * metalMul;
      totalService += cost;
      rows.push({ label: t(svc.label, lang), value: fmtCost(cost, lang) });
    }
  }
  const workshopCost = totalService * REPAIR_MARGIN;
  const estCost = totalService + workshopCost;
  const pricing = applyJewelryPricing(totalService, qTier.discount, qTier.qty, REPAIR_MARGIN);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      ...rows,
      { label: l.workshop, value: fmtCost(workshopCost, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(estCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

// ---- REPAIR CALCULATOR ----
export function calcRepair({ jewTypeId, metalTypeId, repairId, qtyId }, lang) {
  const l = LBL[lang] || LBL.en;
  const gMetal = GENERIC_METALS.find(m => m.id === metalTypeId);
  const repair = REPAIR_SERVICES.find(r => r.id === repairId);
  const qTier = QTY_TIERS.find(q => q.id === qtyId);
  if (!gMetal || !repair || !qTier || qTier.custom) return { type: "custom" };

  const metalMul = REPAIR_METAL_MUL[gMetal.metalKey] || 1.0;
  const cost = repair.basePLN * metalMul;
  const workshopCost = cost * REPAIR_MARGIN;
  const estCost = cost + workshopCost;
  const pricing = applyJewelryPricing(cost, qTier.discount, qTier.qty, REPAIR_MARGIN);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      { label: t(repair.label, lang), value: fmtCost(cost, lang) },
      { label: l.workshop, value: fmtCost(workshopCost, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(estCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

const TECH_LABEL = { pl: "Biżuteria AEJaCA", en: "AEJaCA Jewelry", de: "AEJaCA Schmuck" };

const RATE_NOTE = {
  pl: "Kursy na podstawie danych rynkowych — szczegóły w stopce strony",
  en: "Prices based on live market data — details in site footer",
  de: "Preise basierend auf Marktdaten — Details in der Fußzeile",
};

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
  const [serviceId, setServiceId] = useState("new");
  const [qtyId, setQtyId] = useState("1");

  // New creation
  const [lineId, setLineId] = useState("woman");
  const [typeId, setTypeId] = useState("ring");

  // Geometry + client supply — productForm is derived from typeId (no separate selection needed)
  const productForm = useMemo(() => TYPE_TO_FORM[typeId] ?? null, [typeId]);
  const [dimensions, setDimensions] = useState({});     // fieldId: value
  // Reset dimensions whenever the jewelry type changes — populate defaults immediately
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
  // Stone rows — up to 10 different stone entries
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
          clientSuppliesMetal, qtyId, calcMode, stockMassG }, lang, rates);
      }
      return calcNew({ lineId, typeId, metalId, weightId, methodId, platingId,
        stoneRows, qtyId, engravingId,
        clientSuppliesMetal,
        overrideWeightG: weightResult?.nettoG ?? null }, lang, rates, resolvedGemstones);
    }
    if (serviceId === "renovation") {
      return calcRenovation({ jewTypeId: renoJewType, metalTypeId: renoMetal, services: renoServices, qtyId }, lang);
    }
    return calcRepair({ jewTypeId: repairJewType, metalTypeId: repairMetal, repairId, qtyId }, lang);
  }, [serviceId, lineId, typeId, metalId, weightId, methodId, platingId, engravingId,
    stoneRows, qtyId, weaveId, claspId, chainLengthMm, chainWidthMm,
    clientSuppliesMetal, weightResult, calcMode, stockMassG,
    renoServices, renoJewType, renoMetal, repairId, repairJewType, repairMetal, lang, rates, resolvedGemstones]);

  function toggleRenoService(id) {
    setRenoServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  let stepNum = 1;
  const step = () => String.fromCodePoint(0x2460 + stepNum++ - 1);

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
                  active ? "border-amber-400 shadow-lg shadow-amber-400/20" : "border-white/10 hover:border-white/30"
                }`}>
                {/* Background image (full visibility) */}
                {s.img && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img src={s.img} alt={t(s.label, lang)} loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        active ? "scale-105" : "group-hover:scale-105"
                      }`} />
                    {/* Gradient only at bottom, preserves image visibility */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
                    {/* Active state: amber tint */}
                    {active && (
                      <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />
                    )}
                  </div>
                )}
                {/* Text content at bottom */}
                <div className="relative p-3 h-full min-h-[160px] flex flex-col justify-end">
                  <div className={`text-xs sm:text-sm font-bold mb-1 drop-shadow-lg ${active ? "text-amber-300" : "text-white"}`}>{t(s.label, lang)}</div>
                  <div className="text-[10px] text-neutral-200 break-words drop-shadow-md">{t(s.desc, lang)}</div>
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
                      active ? "border-amber-400 shadow-lg shadow-amber-400/20" : "border-white/10 hover:border-white/30"
                    }`}>
                    {/* Background image (full visibility) */}
                    {pl.img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img src={pl.img} alt={pl.label} loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            active ? "scale-105" : "group-hover:scale-105"
                          }`} />
                        {/* Gradient only at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/65 to-transparent" />
                        {/* Active state: amber tint */}
                        {active && (
                          <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />
                        )}
                      </div>
                    )}
                    {/* Text content at bottom */}
                    <div className="relative p-3 h-full min-h-[180px] flex flex-col justify-end">
                      <div className={`text-sm sm:text-base font-bold mb-1 drop-shadow-lg ${active ? "text-amber-300" : "text-white"}`}>{pl.label}</div>
                      <div className="text-[10px] text-neutral-200 break-words drop-shadow-md">{t(pl.desc, lang)}</div>
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
                      active ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className={`w-full aspect-square rounded-lg overflow-hidden ${
                      hasImg ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {hasImg ? (
                        <img src={jt.img} alt={label} loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`} />
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

          {/* Calc mode tabs — visible only for chain types */}
          {isChainType(typeId) && (
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/8 mb-2">
              {[
                { id: "standard", pl: "Klasyczny", en: "Standard pricing", de: "Standardkalkulation" },
                { id: "from_stock", pl: "Dobór do kruszcu", en: "From metal stock", de: "Aus Metallvorrat" },
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
                      active ? "border-amber-400 shadow-lg shadow-amber-400/20" : "border-white/10 hover:border-white/30"
                    }`}>
                    {w.img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img src={w.img} alt={t(w.label, lang)} loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-500 ${active ? "scale-105" : "group-hover:scale-105"}`} />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
                        {active && <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />}
                      </div>
                    )}
                    <div className="relative p-2.5 h-full min-h-[130px] flex flex-col justify-end">
                      <div className={`text-[11px] sm:text-xs font-bold mb-0.5 drop-shadow-lg ${active ? "text-amber-300" : "text-white"}`}>{t(w.label, lang)}</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-300 break-words drop-shadow-md leading-tight">{t(w.desc, lang)}</div>
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
              // Gender is already known from the selected product line — no separate toggle needed
              const necklaceGender = lineId === "men" ? "men" : "women";
              const necklacePresets = necklaceGender === "men" ? NECKLACE_LENGTHS_MEN : NECKLACE_LENGTHS_WOMEN;
              return (
              <div className="space-y-3">
                {/* Necklace/chain: SVG silhouette + preset lengths (gender derived from lineId) */}
                {isNecklaceChain(typeId) && (
                  <div className="flex gap-3 items-start">
                    {/* Silhouette — always dark container, always readable */}
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

                {/* Chain WIDTH input — standard mode only; wire diameter & thickness auto-derived from AR */}
                {calcMode === "standard" && (
                  <div className="mt-2 flex flex-wrap gap-4 items-end">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-neutral-400">
                        {{ pl: "Szerokość łańcuszka (mm)", en: "Chain width (mm)", de: "Kettenbreite (mm)" }[lang]}
                      </span>
                      <input type="number" min={1.0} max={20.0} step={0.5}
                        value={chainWidthMm || ""}
                        onChange={e => { const n = parseFloat(e.target.value); if (n > 0) setChainWidthMm(n); }}
                        className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50" />
                    </label>
                    {/* Show derived values live */}
                    {result && result.type === "calculated" && !result.fromStock && (
                      <div className="flex gap-3 text-[11px]">
                        <div className="text-center px-2 py-1 rounded-lg bg-white/[0.03] border border-white/8">
                          <div className="text-neutral-500">Ø { { pl: "drut", en: "wire", de: "Draht" }[lang]}</div>
                          <div className="text-amber-300 font-semibold">{result.wireDMm?.toFixed(2)} mm</div>
                        </div>
                        <div className="text-center px-2 py-1 rounded-lg bg-white/[0.03] border border-white/8">
                          <div className="text-neutral-500">{ { pl: "Grubość", en: "Thickness", de: "Dicke" }[lang]}</div>
                          <div className="text-amber-300 font-semibold">{result.thicknessMm?.toFixed(1)} mm</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* From-stock: mass input */}
                {calcMode === "from_stock" && (
                  <div className="mt-2 p-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] space-y-2">
                    <p className="text-[11px] text-amber-300/80">
                      {{ pl: "Podaj masę posiadanego kruszcu — grubość drutu i wymiary łańcuszka zostaną dobrane automatycznie na podstawie AR splotu.",
                         en: "Enter your available metal mass — wire diameter and chain dimensions will be auto-calculated from weave AR.",
                         de: "Geben Sie Ihre Metallmasse ein — Drahtdurchmesser und Kettenmaße werden aus dem AR automatisch berechnet." }[lang]}
                    </p>
                    <label className="flex items-center gap-3">
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {{ pl: "Masa kruszcu (g)", en: "Metal mass (g)", de: "Metallmasse (g)" }[lang]}
                      </span>
                      <input type="number" min={1} max={500} step={0.5}
                        value={stockMassG || ""}
                        onChange={e => { const n = parseFloat(e.target.value); if (n > 0) setStockMassG(n); }}
                        className="w-28 bg-white/5 border border-amber-400/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/70" />
                      <span className="text-xs text-amber-300/70 font-medium">{stockMassG} g</span>
                    </label>
                    {/* Live derived dimensions preview */}
                    {result && result.type === "calculated" && result.fromStock && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[
                          { label: { pl: "Ø drut", en: "Ø wire", de: "Ø Draht" }[lang], val: `${result.wireDMm?.toFixed(2)} mm` },
                          { label: { pl: "Szerokość", en: "Width", de: "Breite" }[lang], val: `${result.widthMm?.toFixed(1)} mm` },
                          { label: { pl: "Grubość", en: "Thickness", de: "Dicke" }[lang], val: `${result.thicknessMm?.toFixed(1)} mm` },
                        ].map(d => (
                          <div key={d.label} className="text-center p-1.5 rounded-lg bg-white/[0.03] border border-white/8">
                            <div className="text-[9px] text-neutral-500">{d.label}</div>
                            <div className="text-xs text-amber-300 font-semibold">{d.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Waste summary */}
                    {result && result.type === "calculated" && result.fromStock && result.wasteG > 0 && (
                      <div className="text-[11px] text-amber-300/70 border-t border-white/5 pt-2">
                        {{ pl: `Uwaga: z ${stockMassG} g oddasz ${(stockMassG - result.wasteG).toFixed(1)} g jako gotowy łańcuszek — ${result.wasteG.toFixed(1)} g to nieodwracalne odpady produkcyjne (szlam + trociny jubilerskie).`,
                           en: `Note: from ${stockMassG} g you'll receive ${(stockMassG - result.wasteG).toFixed(1)} g as a finished chain — ${result.wasteG.toFixed(1)} g is irreversible production waste (polishing swarf + filings).`,
                           de: `Hinweis: Von ${stockMassG} g erhalten Sie ${(stockMassG - result.wasteG).toFixed(1)} g als fertige Kette — ${result.wasteG.toFixed(1)} g sind unwiederbringliche Produktionsabfälle (Polierschlamm + Feilspäne).` }[lang]}
                      </div>
                    )}
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
                        {pt.icon} {t(pt.label, lang)} — {t(pt.notes, lang)}
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

          {/* Weave selection — chain types only */}
          {isChainType(typeId) && (
            <CalcCard stepNum={step()} label={{ pl: "Splot łańcuszka", en: "Chain weave", de: "Kettenmuster" }[lang]}>
              <p className="text-[10px] text-neutral-500 mb-2">
                {{ pl: "Kliknij dwukrotnie na zdjęcie — powiększ podgląd splotu", en: "Double-click an image to preview the weave pattern", de: "Doppelklick auf ein Bild zum Vergrößern" }[lang]}
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
                        active ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                        onDoubleClick={e => { e.stopPropagation(); if (w.img) setWeaveModal(w.id); }}>
                        {w.img ? (
                          <img src={w.img} alt={t(w.label, lang)} loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`} />
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
                  {{ pl: `Odpad technologiczny splotu ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.pl}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% materiału — uwzględnij zapas przy dostarczaniu kruszcu.`,
                     en: `Weave waste for ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.en}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% — account for this when supplying metal.`,
                     de: `Webabfall für ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.de}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% — beim Liefern des Metalls berücksichtigen.`
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
                      {{ pl: `AR ${wm.ar ?? "—"} · czynnik ×${wm.weaveFactor} · szer. ×${wm.widthMul ?? "—"} · gr. ×${wm.thicknessMul ?? "—"} · odpad ~${wm.materialWaste}%`,
                         en: `AR ${wm.ar ?? "—"} · factor ×${wm.weaveFactor} · width ×${wm.widthMul ?? "—"} · thk ×${wm.thicknessMul ?? "—"} · waste ~${wm.materialWaste}%`,
                         de: `AR ${wm.ar ?? "—"} · Faktor ×${wm.weaveFactor} · Breite ×${wm.widthMul ?? "—"} · Dicke ×${wm.thicknessMul ?? "—"} · Abfall ~${wm.materialWaste}%`
                      }[lang]}
                    </p>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                    onClick={() => setWeaveModal(null)}>✕</button>
                </div>
              </div>
            );
          })()}

          {/* Clasp selection — chain types only */}
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
                        active ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
                        {c.img ? (
                          <img src={c.img} alt={t(c.label, lang)} loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`} />
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
                      active ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className={`w-full aspect-square rounded-lg overflow-hidden ${
                      m.img ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {m.img ? (
                        <img src={m.img} alt={label} loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`} />
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
            {/* Client supplies metal toggle — hidden in from_stock mode (metal is always client-supplied there) */}
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
                    {{ pl: "Odejmiemy koszt metalu — dostarcz kruszec przed realizacją", en: "Metal cost excluded — supply raw metal before production", de: "Metallkosten entfallen — Rohmetall vor der Produktion liefern" }[lang]}
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
                      active ? "border-amber-400 shadow-lg shadow-amber-400/20" : "border-white/10 hover:border-white/30"
                    }`}>
                    {m.img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img src={m.img} alt={t(m.label, lang)} loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-500 ${active ? "scale-105" : "group-hover:scale-105"}`} />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
                        {active && <div className="absolute inset-0 bg-amber-400/10 mix-blend-overlay" />}
                      </div>
                    )}
                    <div className="relative p-3 h-full min-h-[140px] flex flex-col justify-end">
                      <div className={`text-xs sm:text-sm font-bold mb-1 drop-shadow-lg ${active ? "text-amber-300" : "text-white"}`}>{t(m.label, lang)}</div>
                      <div className="text-[10px] text-neutral-300 break-words drop-shadow-md">{t(m.desc, lang)}</div>
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
                  // "none" — simple chip
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
                      active ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
                      <img src={pl.img} alt={label} loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`} />
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
                {{ pl: "Grawer nakładany jest bezpośrednio na oczko sygnetu — może współistnieć z kamieniem lub zastąpić go.",
                   en: "Engraving is applied directly to the signet bezel — it can coexist with a stone or replace it.",
                   de: "Gravur wird direkt auf den Siegelkopf aufgetragen — kann mit einem Stein kombiniert werden oder ihn ersetzen." }[lang]}
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
                            className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
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
              {GENERIC_METALS.map(m => {
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
                        className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
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
                            className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
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
              {GENERIC_METALS.map(m => {
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
                        className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
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
        <Chips options={QTY_TIERS} value={qtyId} onChange={setQtyId} lang={lang} />
      </CalcCard>

      {/* Result */}
      <div className="rounded-2xl border-2 border-amber-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
        <div className="mt-3 text-[10px] text-neutral-400 text-center italic">{l.priceSource}</div>
        <p className="text-xs text-neutral-500 mt-1 text-center">{RATE_NOTE[lang] || RATE_NOTE.pl}</p>
        <QuoteEmailCapture result={result} lang={lang} techLabel={t(TECH_LABEL, lang)}
          rateSnapshot={{
            au: rates.au_pln_per_g,
            ag: rates.ag_pln_per_g,
            pt: rates.pt_pln_per_g,
            pln_per_eur: rates.pln_per_eur,
            sources: rates.sources,
          }}
          paramsSummary={
          serviceId === "new"
            ? isChainType(typeId)
              ? [t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
                 t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
                 t(METALS.find(m => m.id === metalId)?.label, lang),
                 t(CHAIN_WEAVES.find(w => w.id === weaveId)?.label, lang),
                 t(CHAIN_CLASPS.find(c => c.id === claspId)?.label, lang),
                 `${chainLengthMm / 10}cm`,
                 calcMode === "standard" ? `${chainWidthMm}mm szer.` : `${stockMassG}g`,
                 engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === engravingId)?.label, lang) : null,
                ].filter(Boolean).join(" | ")
              : [t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
                 t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
                 t(METALS.find(m => m.id === metalId)?.label, lang),
                 t(METHODS.find(m => m.id === methodId)?.label, lang),
                 engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === engravingId)?.label, lang) : null,
                 ...stoneRows.filter(r => r.gemId !== "none").map(r => {
                   const gem = resolvedGemstones.find(g => g.id === r.gemId);
                   const sz = STONE_SIZES.find(s => s.id === r.stoneSizeId);
                   return `${r.count}× ${t(gem?.label, lang) ?? r.gemId} (${t(sz?.label, lang) ?? r.stoneSizeId})${r.suppliedBy === "client" ? " [klient]" : ""}`;
                 })].filter(Boolean).join(" | ")
            : serviceId === "renovation"
              ? `${t(SERVICE_TYPES[1].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === renoJewType)?.label, lang)} | ${renoServices.map(id => t(RENOVATION_SERVICES.find(s => s.id === id)?.label, lang)).join(", ")}`
              : `${t(SERVICE_TYPES[2].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === repairJewType)?.label, lang)} | ${t(REPAIR_SERVICES.find(r => r.id === repairId)?.label, lang)}`
        } />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={
        serviceId === "new"
          ? isChainType(typeId)
            ? [t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
               t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
               t(METALS.find(m => m.id === metalId)?.label, lang),
               t(CHAIN_WEAVES.find(w => w.id === weaveId)?.label, lang),
               t(CHAIN_CLASPS.find(c => c.id === claspId)?.label, lang),
               `${chainLengthMm / 10}cm`,
               calcMode === "standard" ? `${chainWidthMm}mm szer.` : `${stockMassG}g`,
               engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === engravingId)?.label, lang) : null,
              ].filter(Boolean).join(" | ")
            : [t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
               t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
               t(METALS.find(m => m.id === metalId)?.label, lang),
               t(METHODS.find(m => m.id === methodId)?.label, lang),
               engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === engravingId)?.label, lang) : null,
               ...stoneRows.filter(r => r.gemId !== "none").map(r => {
                 const gem = resolvedGemstones.find(g => g.id === r.gemId);
                 const sz = STONE_SIZES.find(s => s.id === r.stoneSizeId);
                 return `${r.count}× ${t(gem?.label, lang) ?? r.gemId} (${t(sz?.label, lang) ?? r.stoneSizeId})${r.suppliedBy === "client" ? " [klient]" : ""}`;
               })].filter(Boolean).join(" | ")
          : serviceId === "renovation"
            ? `${t(SERVICE_TYPES[1].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === renoJewType)?.label, lang)} | ${renoServices.map(id => t(RENOVATION_SERVICES.find(s => s.id === id)?.label, lang)).join(", ")}`
            : `${t(SERVICE_TYPES[2].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === repairJewType)?.label, lang)} | ${t(REPAIR_SERVICES.find(r => r.id === repairId)?.label, lang)}`
      } />
    </div>
  );
}
