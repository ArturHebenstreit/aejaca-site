// ============================================================
// JEWELRY ESTIMATOR — AEJaCA Jewelry
// ============================================================
import { useState, useMemo } from "react";
import { t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";
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
    baseCost: "Koszt bazowy / szt.", margin: "Marża warsztatowa", afterMargin: "Po marży / szt.", discount: "Rabat",
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
    baseCost: "Base cost / pc", margin: "Workshop margin", afterMargin: "After margin / pc", discount: "Discount",
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
    baseCost: "Basiskosten / Stk.", margin: "Werkstattmarge", afterMargin: "Nach Marge / Stk.", discount: "Rabatt",
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
    if (gem.hasGrades && gem.id === "diamond") {
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
  const afterMargin = baseCost * (1 + MARGIN);
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
      { divider: true },
      { label: l.baseCost, value: fmtCost(baseCost, lang) },
      { label: `${l.margin} (+${MARGIN * 100}%)`, value: fmtCost(baseCost * MARGIN, lang) },
      { label: l.afterMargin, value: fmtCost(afterMargin, lang), bold: true },
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
  const afterMargin = totalService * (1 + REPAIR_MARGIN);
  const pricing = applyJewelryPricing(totalService, qTier.discount, qTier.qty, REPAIR_MARGIN);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      ...rows,
      { divider: true },
      { label: l.serviceCost, value: fmtCost(totalService, lang) },
      { label: `${l.margin} (+${REPAIR_MARGIN * 100}%)`, value: fmtCost(totalService * REPAIR_MARGIN, lang) },
      { label: l.afterMargin, value: fmtCost(afterMargin, lang), bold: true },
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
  const afterMargin = cost * (1 + REPAIR_MARGIN);
  const pricing = applyJewelryPricing(cost, qTier.discount, qTier.qty, REPAIR_MARGIN);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      { label: t(repair.label, lang), value: fmtCost(cost, lang) },
      { divider: true },
      { label: l.baseCost, value: fmtCost(cost, lang) },
      { label: `${l.margin} (+${REPAIR_MARGIN * 100}%)`, value: fmtCost(cost * REPAIR_MARGIN, lang) },
      { label: l.afterMargin, value: fmtCost(afterMargin, lang), bold: true },
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
        <div className="grid grid-cols-3 gap-3">
          {SERVICE_TYPES.map(s => (
            <button key={s.id} onClick={() => setServiceId(s.id)}
              className={`p-3 rounded-xl border text-left transition-all ${serviceId === s.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className={`text-sm font-bold mb-1 ${serviceId === s.id ? "text-amber-300" : "text-white"}`}>{t(s.label, lang)}</div>
              <div className="text-[10px] text-neutral-500">{t(s.desc, lang)}</div>
            </button>
          ))}
        </div>
      </CalcCard>

      {/* === NEW CREATION FLOW === */}
      {serviceId === "new" && (
        <>
          <CalcCard stepNum={step()} label={l.line}>
            <div className="grid grid-cols-3 gap-3">
              {PRODUCT_LINES.map(pl => (
                <button key={pl.id} onClick={() => { setLineId(pl.id); setTypeId(JEWELRY_TYPES[pl.id]?.[0]?.id || ""); }}
                  className={`p-3 rounded-xl border text-left transition-all ${lineId === pl.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <div className={`text-sm font-bold mb-1 ${lineId === pl.id ? "text-amber-300" : "text-white"}`}>{pl.label}</div>
                  <div className="text-[10px] text-neutral-500">{t(pl.desc, lang)}</div>
                </button>
              ))}
            </div>
          </CalcCard>

          <CalcCard stepNum={step()} label={l.type}>
            <Chips options={types} value={typeId} onChange={setTypeId} lang={lang} />
          </CalcCard>

          <CalcCard stepNum={step()} label={l.metal}>
            <Chips options={METALS} value={metalId} onChange={setMetalId} lang={lang} />
          </CalcCard>

          <CalcCard stepNum={step()} label={l.weight}>
            <Chips options={WEIGHTS} value={weightId} onChange={setWeightId} lang={lang} />
          </CalcCard>

          <CalcCard stepNum={step()} label={l.method}>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.filter(m => !m.custom).map(m => (
                <button key={m.id} onClick={() => setMethodId(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${methodId === m.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <div className={`text-sm font-bold mb-1 ${methodId === m.id ? "text-amber-300" : "text-white"}`}>{t(m.label, lang)}</div>
                  <div className="text-[10px] text-neutral-500">{t(m.desc, lang)}</div>
                </button>
              ))}
            </div>
          </CalcCard>

          <CalcCard stepNum={step()} label={l.plating}>
            <Chips options={PLATING} value={platingId} onChange={setPlatingId} lang={lang} />
          </CalcCard>

          <CalcCard stepNum={step()} label={l.gem}>
            <Chips options={GEMSTONES} value={gemId} onChange={setGemId} lang={lang} />
          </CalcCard>

          {showGemDetails && (
            <>
              <CalcCard stepNum={step()} label={l.stoneSize}>
                <Chips options={STONE_SIZES} value={stoneSizeId} onChange={setStoneSizeId} lang={lang} />
              </CalcCard>

              <CalcCard stepNum={step()} label={l.stoneCount}>
                <Chips options={STONE_COUNTS} value={stoneCountId} onChange={setStoneCountId} lang={lang} />
              </CalcCard>

              {selectedGem.id === "diamond" && (
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
            <Chips options={GENERIC_TYPES} value={renoJewType} onChange={setRenoJewType} lang={lang} />
          </CalcCard>
          <CalcCard stepNum={step()} label={l.metalType}>
            <Chips options={GENERIC_METALS} value={renoMetal} onChange={setRenoMetal} lang={lang} />
          </CalcCard>
          <CalcCard stepNum={step()} label={l.renoServices}>
            <div className="flex flex-wrap gap-2">
              {RENOVATION_SERVICES.map(svc => {
                const active = renoServices.includes(svc.id);
                return (
                  <button key={svc.id} onClick={() => toggleRenoService(svc.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
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
            <Chips options={GENERIC_TYPES} value={repairJewType} onChange={setRepairJewType} lang={lang} />
          </CalcCard>
          <CalcCard stepNum={step()} label={l.metalType}>
            <Chips options={GENERIC_METALS} value={repairMetal} onChange={setRepairMetal} lang={lang} />
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
