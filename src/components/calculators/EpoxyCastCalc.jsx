// ============================================================
// EPOXY / RESIN CASTING ESTIMATOR
// ============================================================
// Types: UV Resin | Epoxy Clear | Epoxy Colored | Polyurethane
// Molds: silicone (platinum-cure)
// Depreciation (UV lamp + tools): ~1.50 PLN/h
// ============================================================
import { useState, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, Chips, CalcCard, ResultDisplay } from "./calcShared.jsx";

const EPOXY_CONFIG = {
  POWER_KW: 0.15, // UV lamp + heat pad avg
  DEPRECIATION_PLN_H: 1.50,
};

const RESINS = [
  { id: "uv",          label: "Żywica UV",              pricePerMl: 0.35, density: 1.10, cureH: 0.1, desc: "Szybkie utwardzanie, cienkie warstwy" },
  { id: "epoxy_clear", label: "Epoksyd — transparentny", pricePerMl: 0.18, density: 1.15, cureH: 48,  desc: "Krystalicznie czysty, 24–72h utwardzania" },
  { id: "epoxy_color", label: "Epoksyd — kolorowy",      pricePerMl: 0.22, density: 1.15, cureH: 48,  desc: "Z pigmentem, efekty artystyczne" },
  { id: "pu",          label: "Poliuretan (PU)",         pricePerMl: 0.28, density: 1.08, cureH: 4,   desc: "Sztywny, funkcjonalny, szybszy niż epoksyd" },
  { id: "custom",      label: "Inna żywica",             pricePerMl: null, density: null, cureH: null, custom: true },
];

const VOLUMES = [
  { id: "XS", label: "XS — biżuteria (do 10 ml)",    vol: 7 },
  { id: "S",  label: "S — brelok / mały (10–50 ml)",  vol: 30 },
  { id: "M",  label: "M — podkładka / deko (50–250 ml)", vol: 150 },
  { id: "L",  label: "L — duży obiekt (250 ml – 1L)",    vol: 600 },
  { id: "XL", label: "XL — powyżej 1L (river table itp.)", vol: null, custom: true },
];

const MOLD_TYPES = [
  { id: "existing", label: "Istniejąca forma",          moldCost: 0,   pourLife: 1,  desc: "Forma już w magazynie" },
  { id: "new_s",    label: "Nowa forma — mała",         moldCost: 60,  pourLife: 40, desc: "Silikon ~60 PLN, ~40 odlewów" },
  { id: "new_m",    label: "Nowa forma — średnia",       moldCost: 150, pourLife: 35, desc: "Silikon ~150 PLN, ~35 odlewów" },
  { id: "new_l",    label: "Nowa forma — duża",          moldCost: 350, pourLife: 25, desc: "Silikon ~350 PLN, ~25 odlewów" },
  { id: "client",   label: "Forma klienta",              moldCost: 0,   pourLife: 1,  desc: "Klient dostarcza formę" },
  { id: "custom",   label: "Forma niestandardowa",       moldCost: null, pourLife: null, custom: true },
];

const INCLUSIONS = [
  { id: "none",     label: "Brak",                    cost: 0 },
  { id: "pigment",  label: "Pigment / brokat",        cost: 3 },
  { id: "object",   label: "Zalewany obiekt (kwiat, zdjęcie)", cost: 8 },
  { id: "led",      label: "LED / elektronika",       cost: 15 },
  { id: "custom",   label: "Niestandardowe",           cost: null, custom: true },
];

const FINISH = [
  { id: "raw",      label: "Surowy (z formy)",        timeH: 0,   cost: 0 },
  { id: "sanded",   label: "Szlifowany + polerowany",  timeH: 0.5, cost: 5 },
  { id: "coated",   label: "Lakierowany / powlekany",  timeH: 0.3, cost: 8 },
  { id: "custom",   label: "Niestandardowe",            timeH: null, cost: null, custom: true },
];

function calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId }) {
  const resin = RESINS.find(r => r.id === resinId);
  const vol = VOLUMES.find(v => v.id === volumeId);
  const mold = MOLD_TYPES.find(m => m.id === moldId);
  const incl = INCLUSIONS.find(i => i.id === inclusionId);
  const fin = FINISH.find(f => f.id === finishId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!resin || !vol || !mold || !incl || !fin || !qTier) return null;
  if (!resin.pricePerMl || !vol.vol || mold.moldCost == null || incl.cost == null || fin.cost == null || !qTier.qty) return { type: "custom" };

  // Resin cost (volume × price × 1.10 waste)
  const resinCost = vol.vol * resin.pricePerMl * 1.10;

  // Mold amortization per piece
  const moldPerPc = mold.pourLife > 0 ? mold.moldCost / mold.pourLife : 0;

  // Inclusions
  const inclCost = incl.cost;

  // Work time: mixing (5min) + pouring (5min) + demolding (5min) + finish
  const workTimeH = 0.25 + (fin.timeH || 0);
  // Cure time occupies workspace but is passive — charge at reduced rate
  const cureOverheadH = resin.cureH * 0.02; // 2% of cure time as workspace occupation cost

  const energyCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.DEPRECIATION_PLN_H;
  const finishCost = fin.cost || 0;

  const baseCost = resinCost + moldPerPc + inclCost + finishCost + energyCost + deprCost;

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    breakdown: [
      { label: "Żywica / szt.", value: `${resinCost.toFixed(2)} PLN (${vol.vol} ml)` },
      { label: "Amortyzacja formy / szt.", value: `${moldPerPc.toFixed(2)} PLN` },
      { label: "Inkluzje / szt.", value: `${inclCost.toFixed(2)} PLN` },
      { label: "Wykończenie / szt.", value: `${finishCost.toFixed(2)} PLN` },
      { label: "Czas pracy", value: `${(workTimeH * 60).toFixed(0)} min` },
      { label: "Czas utwardzania", value: resin.cureH < 1 ? `${Math.round(resin.cureH * 60)} min (UV)` : `${resin.cureH} h` },
      { label: "Energia / szt.", value: `${energyCost.toFixed(2)} PLN` },
      { label: "Amortyzacja narzędzi", value: `${deprCost.toFixed(2)} PLN` },
      { divider: true },
      { label: "Koszt bazowy / szt.", value: `${baseCost.toFixed(2)} PLN`, bold: true },
      { label: "Marża", value: `${Math.round(CONFIG.BASE_MARGIN * 100)}%` },
      ...(qTier.discount > 0 ? [{ label: "Rabat seryjny", value: `-${qTier.discount * 100}%`, accent: true }] : []),
    ],
  };
}

export default function EpoxyCastCalc({ lang = "pl" }) {
  const [resinId, setResinId] = useState("epoxy_clear");
  const [volumeId, setVolumeId] = useState("S");
  const [moldId, setMoldId] = useState("existing");
  const [inclusionId, setInclusionId] = useState("none");
  const [finishId, setFinishId] = useState("raw");
  const [quantityId, setQuantityId] = useState("proto");

  const result = useMemo(() => calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId }),
    [resinId, volumeId, moldId, inclusionId, finishId, quantityId]);

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">UV Resin · Epoxy 2K · Polyurethane · Silicone Molds</div>

      <CalcCard stepNum="①" label="Typ żywicy">
        {RESINS.filter(r => !r.custom).map(r => (
          <button key={r.id} onClick={() => setResinId(r.id)}
            className={`w-full mb-2 p-3 rounded-xl border text-left transition-all ${resinId === r.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-bold ${resinId === r.id ? "text-blue-300" : "text-white"}`}>{r.label}</span>
              <span className="text-[11px] text-neutral-500">{r.pricePerMl} PLN/ml</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{r.desc}</div>
          </button>
        ))}
        <button onClick={() => setResinId("custom")}
          className={`w-full p-2.5 rounded-xl border border-dashed text-left text-xs transition-all ${resinId === "custom" ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" : "border-white/10 text-neutral-500 italic"}`}>
          Inna żywica — wycena indywidualna
        </button>
      </CalcCard>

      <CalcCard stepNum="②" label="Objętość odlewu">
        <Chips options={VOLUMES} value={volumeId} onChange={setVolumeId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="③" label="Forma">
        <Chips options={MOLD_TYPES} value={moldId} onChange={setMoldId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="④" label="Inkluzje / dodatki">
        <Chips options={INCLUSIONS} value={inclusionId} onChange={setInclusionId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑤" label="Wykończenie">
        <Chips options={FINISH} value={finishId} onChange={setFinishId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑥" label="Nakład">
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">Szacowany zakres cenowy</div>
        <ResultDisplay result={result} lang={lang} />
      </div>
    </div>
  );
}
