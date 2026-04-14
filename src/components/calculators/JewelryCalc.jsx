// ============================================================
// JEWELRY ESTIMATOR — AEJaCA Jewelry
// ============================================================
import { useState, useMemo } from "react";
import { t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";
import { trackCalc } from "../../utils/analytics.js";
import {
  METAL_PRICES, EUR_PLN, MARGIN, REPAIR_MARGIN, TOL_LOW, TOL_HIGH,
  SERVICE_TYPES, PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING,
  GEMSTONES, STONE_SIZES, STONE_COUNTS, DIAMOND_CLARITY, DIAMOND_COLOR,
  GEM_QUALITY, CERTIFICATIONS, RENOVATION_SERVICES, REPAIR_SERVICES,
  REPAIR_METAL_MUL, QTY_TIERS, GENERIC_TYPES, GENERIC_METALS,
} from "./jewelryConfig.js";

const LBL = {
  pl: {
    service: "Typ usługi", line: "Linia produktowa", type: "Rodzaj biżuterii",
    metal: "Kruszec i próba", weight: "Waga / masywność", method: "Metoda wytworzenia",
    plating: "Powłoka galwaniczna", gem: "Kamień", stoneSize: "Wielkość kamienia",
    stoneCount: "Liczba kamieni", clarity: "Czystość (diament)", color: "Barwa (diament)",
    quality: "Jakość kamienia", cert: "Certyfikat", qty: "Nakład",
    metalCost: "Kruszec", laborCost: "Robocizna", gemCost: "Kamienie",
    platingCost: "Powłoka galwaniczna", settingCost: "Osadzanie kamieni",
    workshop: "Usługi warsztatowe", estCost: "Koszt szacunkowy / szt.", discount: "Rabat",
    serviceLabel: "Usługi", repairLabel: "Naprawa", repairType: "Rodzaj naprawy",
    renoServices: "Usługi renowacyjne", jewType: "Rodzaj biżuterii", metalType: "Kruszec",
    serviceCost: "Koszt usług", materialCost: "Materiały", total: "Łącznie",
    priceSource: "Ceny kruszców: LBMA/Kitco | Kamienie: Rapaport/GemVal",
  },
  en: {
    service: "Service type", line: "Product line", type: "Jewelry type",
    metal: "Metal & purity", weight: "Weight / boldness", method: "Manufacturing method",
    plating: "Galvanic plating", gem: "Gemstone", stoneSize: "Stone size",
    stoneCount: "Number of stones", clarity: "Clarity (diamond)", color: "Color (diamond)",
    quality: "Stone quality", cert: "Certificate", qty: "Quantity",
    metalCost: "Metal", laborCost: "Labor", gemCost: "Gemstones",
    platingCost: "Galvanic plating", settingCost: "Stone setting",
    workshop: "Workshop services", estCost: "Estimated cost / pc", discount: "Discount",
    serviceLabel: "Services", repairLabel: "Repair", repairType: "Repair type",
    renoServices: "Renovation services", jewType: "Jewelry type", metalType: "Metal",
    serviceCost: "Service cost", materialCost: "Materials", total: "Total",
    priceSource: "Metal prices: LBMA/Kitco | Gems: Rapaport/GemVal",
  },
  de: {
    service: "Dienstleistungstyp", line: "Produktlinie", type: "Schmuckart",
    metal: "Metall & Feingehalt", weight: "Gewicht / Massivität", method: "Herstellungsmethode",
    plating: "Galvanische Beschichtung", gem: "Edelstein", stoneSize: "Steingröße",
    stoneCount: "Anzahl der Steine", clarity: "Reinheit (Diamant)", color: "Farbe (Diamant)",
    quality: "Steinqualität", cert: "Zertifikat", qty: "Auflage",
    metalCost: "Metall", laborCost: "Arbeit", gemCost: "Edelsteine",
    platingCost: "Galvanische Beschichtung", settingCost: "Steinfassung",
    workshop: "Werkstattleistungen", estCost: "Geschätzte Kosten / Stk.", discount: "Rabatt",
    serviceLabel: "Dienstleistungen", repairLabel: "Reparatur", repairType: "Reparaturart",
    renoServices: "Renovierungsleistungen", jewType: "Schmuckart", metalType: "Metall",
    serviceCost: "Servicekosten", materialCost: "Materialien", total: "Gesamt",
    priceSource: "Metallpreise: LBMA/Kitco | Steine: Rapaport/GemVal",
  },
};

function applyJewelryPricing(baseCost, discountRate, qty, margin = MARGIN) {
  const basePrice = baseCost * (1 + margin);
  const discounted = basePrice * (1 - discountRate);
  const perMin = Math.round(discounted * (1 - TOL_LOW));
  const perMax = Math.round(discounted * (1 + TOL_HIGH));
  return {
    perPcPLN: { min: Math.max(1, perMin), max: Math.max(1, perMax) },
    perPcEUR: { min: Math.max(1, Math.round(perMin / EUR_PLN)), max: Math.max(1, Math.round(perMax / EUR_PLN)) },
    totalPLN: { min: Math.max(1, perMin) * qty, max: Math.max(1, perMax) * qty },
    totalEUR: { min: Math.round((Math.max(1, perMin) * qty) / EUR_PLN), max: Math.round((Math.max(1, perMax) * qty) / EUR_PLN) },
  };
}

// ---- NEW CREATION CALCULATOR ----
function calcNew({ lineId, typeId, metalId, weightId, methodId, platingId,
  gemId, stoneSizeId, stoneCountId, clarityId, colorId, qualityId, certId, qtyId }, lang) {
  const l = LBL[lang] || LBL.en;
  const line = PRODUCT_LINES.find(p => p.id === lineId);
  const jType = JEWELRY_TYPES[lineId]?.find(j => j.id === typeId);
  const metal = METALS.find(m => m.id === metalId);
  const weight = WEIGHTS.find(w => w.id === weightId);
  const method = METHODS.find(m => m.id === methodId);
  const plat = PLATING.find(p => p.id === platingId);
  const gem = GEMSTONES.find(g => g.id === gemId);
  const qTier = QTY_TIERS.find(q => q.id === qtyId);

  if (!line || !jType || !metal || !weight || !method || !plat || !gem || !qTier) return null;
  if (metal.custom || weight.custom || method.custom || plat.custom || gem.custom || qTier.custom) return { type: "custom" };

  // Metal cost
  const metalPrice = METAL_PRICES[metal.metal];
  const weightG = jType.baseWeight * weight.mul;
  const metalCost = weightG * metalPrice.plnPerG * metal.purity;

  // Labor cost
  const laborCost = jType.laborH * method.laborRate * method.laborMul * metal.laborMul * jType.complexity;

  // Gemstone cost
  let gemCost = 0;
  let settingCost = 0;
  if (gem.id !== "none" && gem.basePLN > 0) {
    const stoneSize = STONE_SIZES.find(s => s.id === stoneSizeId);
    const stoneCount = STONE_COUNTS.find(c => c.id === stoneCountId);
    const cert = CERTIFICATIONS.find(c => c.id === certId);
    if (!stoneSize || !stoneCount || !cert || stoneSize.custom || stoneCount.custom) return { type: "custom" };

    let qualMul = 1.0;
    if (gem.hasGrades && (gem.id === "diamond" || gem.id === "lab_diamond")) {
      const cl = DIAMOND_CLARITY.find(c => c.id === clarityId);
      const co = DIAMOND_COLOR.find(c => c.id === colorId);
      if (cl && co) qualMul = cl.mul * co.mul;
    } else if (gem.hasGrades) {
      const q = GEM_QUALITY.find(q => q.id === qualityId);
      if (q) qualMul = q.mul;
    }

    const pricePerStone = gem.basePLN * stoneSize.priceMul * qualMul * cert.mul;
    gemCost = pricePerStone * stoneCount.count;
    settingCost = stoneCount.count * (stoneSize.ct >= 0.3 ? 120 : 60);
  }

  // Plating
  const platingCost = plat.cost;

  const baseCost = metalCost + laborCost + gemCost + settingCost + platingCost;
  const workshopCost = baseCost * MARGIN;
  const estCost = baseCost + workshopCost;
  const qty = qTier.qty;
  const pricing = applyJewelryPricing(baseCost, qTier.discount, qty);

  return {
    type: "calculated", ...pricing, qty, discount: qTier.discount,
    breakdown: [
      { label: `${l.metalCost} (${weightG.toFixed(1)}g ${t(metal.label, lang)})`, value: fmtCost(metalCost, lang) },
      { label: l.laborCost, value: fmtCost(laborCost, lang) },
      ...(gemCost > 0 ? [{ label: l.gemCost, value: fmtCost(gemCost, lang) }] : []),
      ...(settingCost > 0 ? [{ label: l.settingCost, value: fmtCost(settingCost, lang) }] : []),
      ...(platingCost > 0 ? [{ label: l.platingCost, value: fmtCost(platingCost, lang) }] : []),
      { label: l.workshop, value: fmtCost(workshopCost, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(estCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

// ---- RENOVATION CALCULATOR ----
function calcRenovation({ jewTypeId, metalTypeId, services, qtyId }, lang) {
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
function calcRepair({ jewTypeId, metalTypeId, repairId, qtyId }, lang) {
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

export default function JewelryCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;

  // Shared
  const [serviceId, setServiceId] = useState("new");
  const [qtyId, setQtyId] = useState("1");

  // New creation
  const [lineId, setLineId] = useState("woman");
  const [typeId, setTypeId] = useState("ring");
  const [metalId, setMetalId] = useState("gold_18k");
  const [weightId, setWeightId] = useState("standard");
  const [methodId, setMethodId] = useState("handmade");
  const [platingId, setPlatingId] = useState("none");
  const [gemId, setGemId] = useState("none");
  const [stoneSizeId, setStoneSizeId] = useState("medium");
  const [stoneCountId, setStoneCountId] = useState("1");
  const [clarityId, setClarityId] = useState("VS");
  const [colorId, setColorId] = useState("GH");
  const [qualityId, setQualityId] = useState("A");
  const [certId, setCertId] = useState("none");

  // Renovation
  const [renoServices, setRenoServices] = useState([]);
  const [renoJewType, setRenoJewType] = useState("ring_g");
  const [renoMetal, setRenoMetal] = useState("gold_g");

  // Repair
  const [repairId, setRepairId] = useState("resize");
  const [repairJewType, setRepairJewType] = useState("ring_g");
  const [repairMetal, setRepairMetal] = useState("gold_g");

  const selectedGem = GEMSTONES.find(g => g.id === gemId);
  const showGemDetails = selectedGem && selectedGem.id !== "none" && !selectedGem.custom && selectedGem.basePLN > 0;
  const types = JEWELRY_TYPES[lineId] || [];

  const result = useMemo(() => {
    if (serviceId === "new") {
      return calcNew({ lineId, typeId, metalId, weightId, methodId, platingId,
        gemId, stoneSizeId, stoneCountId, clarityId, colorId, qualityId, certId, qtyId }, lang);
    }
    if (serviceId === "renovation") {
      return calcRenovation({ jewTypeId: renoJewType, metalTypeId: renoMetal, services: renoServices, qtyId }, lang);
    }
    return calcRepair({ jewTypeId: repairJewType, metalTypeId: repairMetal, repairId, qtyId }, lang);
  }, [serviceId, lineId, typeId, metalId, weightId, methodId, platingId,
    gemId, stoneSizeId, stoneCountId, clarityId, colorId, qualityId, certId, qtyId,
    renoServices, renoJewType, renoMetal, repairId, repairJewType, repairMetal, lang]);

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
                    <img src={s.img} alt="" loading="lazy"
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
                        <img src={pl.img} alt="" loading="lazy"
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
                    <span className={`text-[11px] sm:text-xs text-center leading-tight break-words ${
                      active ? "text-amber-300 font-medium" : "text-neutral-400"
                    }`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CalcCard>

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
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-words ${
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
                      active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-400"
                    }`}>
                    <span className="text-lg opacity-50">?</span>
                    <span className="text-center leading-tight">{t(m.label, lang)}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>

          <CalcCard stepNum={step()} label={l.weight}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {WEIGHTS.map(w => {
                const active = weightId === w.id;
                if (w.custom) {
                  return (
                    <button key={w.id} onClick={() => setWeightId(w.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-dashed border transition-all text-xs ${
                        active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-400"
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
                        <img src={w.img} alt="" loading="lazy"
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
          </CalcCard>

          <CalcCard stepNum={step()} label={l.method}>
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
                        <img src={m.img} alt="" loading="lazy"
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
          </CalcCard>

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
                        active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-400"
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
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-words ${
                      active ? "text-amber-300 font-medium" : "text-neutral-400"
                    }`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </CalcCard>

          <CalcCard stepNum={step()} label={l.gem}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
              {GEMSTONES.map(g => {
                const active = gemId === g.id;
                const label = t(g.label, lang);
                const hasImg = !!g.img;
                const isSpecial = g.id === "none" || g.custom;

                return (
                  <button key={g.id}
                    onClick={() => { setGemId(g.id); trackCalc("jewelry", "gem", g.id); }}
                    className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                      isSpecial && !active ? "border-dashed border-white/10 hover:border-white/20" :
                      isSpecial && active ? "border-dashed border-amber-400 bg-amber-400/10" :
                      active ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10" :
                      "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    {/* Image or placeholder */}
                    <div className={`w-full aspect-square rounded-lg overflow-hidden ${
                      hasImg ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                    }`}>
                      {hasImg ? (
                        <img src={g.img} alt={label} loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`} />
                      ) : (
                        <span className={`text-2xl ${isSpecial ? "opacity-40" : "opacity-60"}`}>
                          {g.id === "none" ? "∅" : g.custom ? "?" : "◆"}
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-words ${
                      active ? "text-amber-300 font-medium" : "text-neutral-400"
                    }`}>
                      {label}
                    </span>
                    {/* LAB badge */}
                    {g.lab && (
                      <span className={`absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded font-semibold tracking-wider ${
                        active ? "bg-amber-400/30 text-amber-200" : "bg-black/60 text-amber-400/80"
                      }`}>LAB</span>
                    )}
                  </button>
                );
              })}
            </div>
          </CalcCard>

          {showGemDetails && (
            <>
              <CalcCard stepNum={step()} label={l.stoneSize}>
                <div className="flex flex-wrap gap-3">
                  {STONE_SIZES.map(s => {
                    const active = stoneSizeId === s.id;
                    const v = s.visual;
                    return (
                      <button key={s.id} onClick={() => setStoneSizeId(s.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all min-w-[90px] ${
                          s.custom && !active ? "border-dashed border-white/10 text-neutral-500 italic text-xs" :
                          active ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}>
                        {v && <div className="rounded-full" style={{ width: v.gemD, height: v.gemD, background: active ? "rgb(251 191 36 / 0.6)" : "rgb(255 255 255 / 0.3)" }} />}
                        <span className={`text-[11px] text-center leading-tight ${active ? "text-amber-300 font-medium" : "text-neutral-400"}`}>{t(s.label, lang)}</span>
                      </button>
                    );
                  })}
                </div>
              </CalcCard>

              <CalcCard stepNum={step()} label={l.stoneCount}>
                <Chips options={STONE_COUNTS} value={stoneCountId} onChange={setStoneCountId} lang={lang} />
              </CalcCard>

              {(selectedGem.id === "diamond" || selectedGem.id === "lab_diamond") && (
                <>
                  <CalcCard stepNum={step()} label={l.clarity}>
                    <Chips options={DIAMOND_CLARITY} value={clarityId} onChange={setClarityId} lang={lang} />
                  </CalcCard>
                  <CalcCard stepNum={step()} label={l.color}>
                    <Chips options={DIAMOND_COLOR} value={colorId} onChange={setColorId} lang={lang} />
                  </CalcCard>
                </>
              )}

              {selectedGem.hasGrades && selectedGem.id !== "diamond" && (
                <CalcCard stepNum={step()} label={l.quality}>
                  <Chips options={GEM_QUALITY} value={qualityId} onChange={setQualityId} lang={lang} />
                </CalcCard>
              )}

              <CalcCard stepNum={step()} label={l.cert}>
                <Chips options={CERTIFICATIONS} value={certId} onChange={setCertId} lang={lang} />
              </CalcCard>
            </>
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
                        active ? "border-sky-400 text-sky-300" : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-400"
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
                        active ? "border-orange-400 text-orange-300" : "border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-400"
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
        <div className="mt-3 text-[10px] text-neutral-600 text-center italic">{l.priceSource}</div>
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={
        serviceId === "new"
          ? [t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
             t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
             t(METALS.find(m => m.id === metalId)?.label, lang),
             t(METHODS.find(m => m.id === methodId)?.label, lang),
             gemId !== "none" ? t(GEMSTONES.find(g => g.id === gemId)?.label, lang) : ""].filter(Boolean).join(" | ")
          : serviceId === "renovation"
            ? `${t(SERVICE_TYPES[1].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === renoJewType)?.label, lang)} | ${renoServices.map(id => t(RENOVATION_SERVICES.find(s => s.id === id)?.label, lang)).join(", ")}`
            : `${t(SERVICE_TYPES[2].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === repairJewType)?.label, lang)} | ${t(REPAIR_SERVICES.find(r => r.id === repairId)?.label, lang)}`
      } />
    </div>
  );
}
