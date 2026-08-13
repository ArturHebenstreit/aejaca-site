// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/jewelry.js
// Regeneracja: npm run sync:pricing

// ============================================================
// JEWELRY PRICING CORE, AEJaCA Jewelry
// ============================================================
// Formuly przeniesione 1:1 z JewelryCalc.jsx. Kurs kruszcow i kamieni
// wchodzi parametrem (rates / gemPrices), zeby ten sam kod dzialal
// w przegladarce i na backendzie zamowien. Bez Reacta i bez importow
// spoza src/pricing.

import { t, fmtCost } from "./config.js";
import {
  METAL_PRICES, EUR_PLN, MARGIN, MATERIAL_MARKUP, REPAIR_MARGIN, TOL_LOW, TOL_HIGH,
  SERVICE_TYPES, PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING,
  ENGRAVING_OPTIONS,
  metalPricePerG,
  GEMSTONES, STONE_SIZES, DIAMOND_CLARITY, DIAMOND_COLOR, GEM_QUALITY, CERTIFICATIONS,
  RENOVATION_SERVICES, REPAIR_SERVICES,
  REPAIR_METAL_MUL, QTY_TIERS, GENERIC_TYPES, GENERIC_METALS,
  CHAIN_WEAVES, CHAIN_CLASPS, CHAIN_DEFAULT_LENGTH,
} from "./jewelryConfig.js";


// Density (g/cm3) by metal type key
export const METAL_DENSITY = {
  gold: 19.3,      // approximated as 24k; purity scaling handled implicitly
  silver: 10.5,
  platinum: 21.4,
};

export const LBL = {
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

// sellPrice is already marked up (material markup + workshop margin applied by caller).
// This only applies the quantity discount and the estimate tolerance band.
function applyJewelryPricing(sellPrice, discountRate, qty, eurPln = EUR_PLN) {
  const discounted = sellPrice * (1 - discountRate);
  const perMin = Math.round(discounted * (1 - TOL_LOW));
  const perMax = Math.round(discounted * (1 + TOL_HIGH));
  return {
    // Kwota wiazaca, patrz applyPricing w config.js
    unitGrosze: Math.max(1, Math.round(discounted * 100)),
    perPcPLN: { min: Math.max(1, perMin), max: Math.max(1, perMax) },
    perPcEUR: { min: Math.max(1, Math.round(perMin / eurPln)), max: Math.max(1, Math.round(perMax / eurPln)) },
    totalPLN: { min: Math.max(1, perMin) * qty, max: Math.max(1, perMax) * qty },
    totalEUR: { min: Math.round((Math.max(1, perMin) * qty) / eurPln), max: Math.round((Math.max(1, perMax) * qty) / eurPln) },
  };
}

// Stawka kruszcu jest JEDNA dla calego serwisu i mieszka w `jewelryConfig.js`.
// Ta funkcja byla tu skopiowana slowo w slowo z wyceny kreatora; zostaje
// wylacznie jako nazwa, ktorej uzywa reszta tego pliku i ktora eksportujemy
// dalej, zeby nie ruszac wywolan.
export const resolveMetalPricePerG = metalPricePerG;

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

  // Metal cost - use live rates when available, fall back to static config
  const plnPerG = resolveMetalPricePerG(metal.metal, rates);
  // Use geometric weight override if provided (from WeightEngine), else fall back to baseWeight × mul
  const weightG = (overrideWeightG != null && overrideWeightG > 0)
    ? overrideWeightG
    : jType.baseWeight * weight.mul;
  const metalCost = clientSuppliesMetal ? 0 : weightG * plnPerG * metal.purity;

  // Labor cost (weight affects labor - lighter pieces need less finishing)
  const laborCost = jType.laborH * method.laborRate * method.laborMul * metal.laborMul * jType.complexity * (weight.laborMul || 1);

  // Stone costs - iterate all rows
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

    // Setting cost always applies (regardless of who supplies the stone).
    // Per-stone rate tapers with count - micro-pavé is far cheaper per stone than a solitaire.
    const perStone = stoneSize.ct >= 0.3 ? 110 : (count <= 3 ? 55 : count <= 10 ? 35 : 22);
    settingCost += count * perStone;
  }

  // Plating
  const platingCost = plat.cost;

  // Engraving
  const engraving = ENGRAVING_OPTIONS.find(e => e.id === (engravingId || "none"));
  const engravingCost = engraving?.cost ?? 0;

  // Split markup: raw material (metal + stone) carries only a modest handling markup;
  // the workshop margin lives on labor + setting + plating + engraving.
  const materialCost = metalCost + gemCost;
  const workCost = laborCost + settingCost + platingCost + engravingCost;
  const estCost = materialCost * (1 + MATERIAL_MARKUP) + workCost * (1 + MARGIN);
  const workshopCost = estCost - (materialCost + workCost); // combined markup+margin (shown as workshop line)
  const qty = qTier.qty;
  const liveEurPln = rates?.pln_per_eur ?? EUR_PLN;
  const pricing = applyJewelryPricing(estCost, qTier.discount, qty, liveEurPln);

  return {
    type: "calculated", ...pricing, qty, discount: qTier.discount,
    tolLow: TOL_LOW, tolHigh: TOL_HIGH, eurPln: liveEurPln,
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

  const BASE_CHAIN_LABOR_RATE = 48;   // PLN per 10 cm - calibrated to simple chains
  const MASS_LABOR_PLN_PER_G  = 6.0;  // PLN per gram of finished chain (before massLaborMul)
  // Mass-based component captures that complex weaves need far more operations per gram
  // (Byzantine 200g = ~1000 links × manual threading × soldering vs. simple curb 15g = ~200 links)
  const laborCost    = (lengthCm / 10) * BASE_CHAIN_LABOR_RATE * weave.laborMul * metal.laborMul
                     + netMassG * MASS_LABOR_PLN_PER_G * (weave.massLaborMul ?? 0.4) * metal.laborMul;
  const claspCost    = clasp.cost;
  const platingCost  = plat.cost;
  const engravingCost = engraving?.cost ?? 0;

  // Split markup: raw metal carries only handling markup; labor/clasp/finish carry full margin.
  const workChainCost = laborCost + claspCost + platingCost + engravingCost;
  const estCost       = metalCost * (1 + MATERIAL_MARKUP) + workChainCost * (1 + MARGIN);
  const workshopCost  = estCost - (metalCost + workChainCost);
  const qty           = qTier.qty;
  const liveEurPln    = rates?.pln_per_eur ?? EUR_PLN;
  const pricing       = applyJewelryPricing(estCost, qTier.discount, qty, liveEurPln);

  return {
    type: "calculated", ...pricing, qty, discount: qTier.discount,
    fromStock, wireDMm, widthMm, thicknessMm, wasteG, grossMassG, netMassG,
    breakdown: [
      // Dimensions summary
      { label: ln(
          `🔗 ${lengthCm.toFixed(1)} cm · Ø drut ${wireDMm.toFixed(2)} mm · szer. ${widthMm.toFixed(1)} mm · gr. ${thicknessMm.toFixed(1)} mm (AR ${ar.toFixed(1)})`,
          `🔗 ${lengthCm.toFixed(1)} cm · Ø wire ${wireDMm.toFixed(2)} mm · w ${widthMm.toFixed(1)} mm · t ${thicknessMm.toFixed(1)} mm (AR ${ar.toFixed(1)})`,
          `🔗 ${lengthCm.toFixed(1)} cm · Ø Draht ${wireDMm.toFixed(2)} mm · Br. ${widthMm.toFixed(1)} mm · Dicke ${thicknessMm.toFixed(1)} mm (AR ${ar.toFixed(1)})`
        ), value: "", bold: false },
      // Wire diameter warning (from_stock only)
      ...(wireDWarning ? [{ label: ln(
          `⚠ Grubość drutu ${wireDMm.toFixed(2)} mm jest ${wireDMm < WIRE_D_MIN_MM ? "zbyt mała" : "zbyt duża"} - zmień długość lub masę`,
          `⚠ Wire ${wireDMm.toFixed(2)} mm is ${wireDMm < WIRE_D_MIN_MM ? "too thin" : "too thick"} - adjust length or mass`,
          `⚠ Draht ${wireDMm.toFixed(2)} mm ist ${wireDMm < WIRE_D_MIN_MM ? "zu dünn" : "zu dick"} - Länge oder Masse anpassen`
        ), value: "", accent: true }] : []),
      // Waste row (from_stock - key client information)
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
      { label: l.estCost, value: fmtCost(estCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
    tolLow: TOL_LOW, tolHigh: TOL_HIGH, eurPln: liveEurPln,
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
  const estCost = totalService * (1 + REPAIR_MARGIN);
  const workshopCost = estCost - totalService;
  const pricing = applyJewelryPricing(estCost, qTier.discount, qTier.qty);
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
  const estCost = cost * (1 + REPAIR_MARGIN);
  const workshopCost = estCost - cost;
  const pricing = applyJewelryPricing(estCost, qTier.discount, qTier.qty);
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

