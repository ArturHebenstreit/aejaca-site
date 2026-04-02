// ============================================================
// EPOXY / RESIN CASTING ESTIMATOR
// ============================================================
// Types: UV Resin | Epoxy Clear | Epoxy Colored
// Molds: silicone (platinum-cure)
// Depreciation (UV lamp + tools): ~1.50 PLN/h
// ============================================================
import { useState, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm } from "./calcShared.jsx";

const EPOXY_CONFIG = {
  POWER_KW: 0.15,
  DEPRECIATION_PLN_H: 1.50,
};

const LBL = {
  pl: { resinType: "Typ zywicy", volume: "Objetosc odlewu", mold: "Forma",
    inclusions: "Inkluzje / dodatki", finish: "Wykonczenie", qty: "Naklad",
    resinCost: "Zywica / szt.", moldAmort: "Amortyzacja formy / szt.",
    inclusionCost: "Inkluzje / szt.", finishCost: "Wykonczenie / szt.",
    workTime: "Czas pracy", cureTime: "Czas utwardzania",
    energy: "Energia / szt.", depreciation: "Amortyzacja narzedzi",
    baseCost: "Koszt bazowy / szt.", discount: "Rabat seryjny",
    totalProd: "Czas produkcji lacznie",
    customResin: "Inna zywica — wycena indywidualna" },
  en: { resinType: "Resin type", volume: "Cast volume", mold: "Mold",
    inclusions: "Inclusions / additives", finish: "Finish", qty: "Quantity",
    resinCost: "Resin / pc", moldAmort: "Mold amortization / pc",
    inclusionCost: "Inclusions / pc", finishCost: "Finish / pc",
    workTime: "Work time", cureTime: "Cure time",
    energy: "Energy / pc", depreciation: "Tool depreciation",
    baseCost: "Base cost / pc", discount: "Series discount",
    totalProd: "Total production time",
    customResin: "Other resin — individual quote" },
  de: { resinType: "Harztyp", volume: "Gussvolumen", mold: "Form",
    inclusions: "Einschluesse / Zusaetze", finish: "Finish", qty: "Auflage",
    resinCost: "Harz / Stk.", moldAmort: "Formamortisation / Stk.",
    inclusionCost: "Einschluesse / Stk.", finishCost: "Finish / Stk.",
    workTime: "Arbeitszeit", cureTime: "Aushaertezeit",
    energy: "Energie / Stk.", depreciation: "Werkzeugabschreibung",
    baseCost: "Basiskosten / Stk.", discount: "Serienrabatt",
    totalProd: "Gesamte Produktionszeit",
    customResin: "Anderes Harz — individuelle Kalkulation" },
};

const RESINS = [
  { id: "uv",          label: { pl: "Zywica UV", en: "UV Resin", de: "UV-Harz" },
    pricePerMl: 0.35, density: 1.10, cureH: 0.1,
    desc: { pl: "Szybkie utwardzanie, cienkie warstwy", en: "Fast curing, thin layers", de: "Schnelle Aushaertung, duenne Schichten" } },
  { id: "epoxy_clear", label: { pl: "Epoksyd — transparentny", en: "Epoxy — transparent", de: "Epoxid — transparent" },
    pricePerMl: 0.18, density: 1.15, cureH: 48,
    desc: { pl: "Krystalicznie czysty, 24-72h utwardzania", en: "Crystal clear, 24-72h curing", de: "Kristallklar, 24-72h Aushaertung" } },
  { id: "epoxy_color", label: { pl: "Epoksyd — kolorowy", en: "Epoxy — colored", de: "Epoxid — farbig" },
    pricePerMl: 0.22, density: 1.15, cureH: 48,
    desc: { pl: "Z pigmentem, efekty artystyczne", en: "With pigment, artistic effects", de: "Mit Pigment, kuenstlerische Effekte" } },
  { id: "custom", label: { pl: "Inna zywica", en: "Other resin", de: "Anderes Harz" },
    pricePerMl: null, density: null, cureH: null, custom: true },
];

const VOLUMES = [
  { id: "XS", label: { pl: "XS — bizuteria (do 10 ml)", en: "XS — jewelry (up to 10 ml)", de: "XS — Schmuck (bis 10 ml)" }, vol: 7 },
  { id: "S",  label: { pl: "S — brelok / maly (10-50 ml)", en: "S — keychain / small (10-50 ml)", de: "S — Schluesselanhaenger / klein (10-50 ml)" }, vol: 30 },
  { id: "M",  label: { pl: "M — podkladka / deko (50-250 ml)", en: "M — coaster / deco (50-250 ml)", de: "M — Untersetzer / Deko (50-250 ml)" }, vol: 150 },
  { id: "L",  label: { pl: "L — duzy obiekt (250 ml - 1L)", en: "L — large object (250 ml - 1L)", de: "L — grosses Objekt (250 ml - 1L)" }, vol: 600 },
  { id: "XL", label: { pl: "XL — powyzej 1L (river table itp.)", en: "XL — over 1L (river table etc.)", de: "XL — ueber 1L (River Table usw.)" }, vol: null, custom: true },
];

const MOLD_TYPES = [
  { id: "existing", label: { pl: "Istniejaca forma", en: "Existing mold", de: "Vorhandene Form" },           moldCost: 0,   pourLife: 1 },
  { id: "new_s",    label: { pl: "Nowa forma — mala", en: "New mold — small", de: "Neue Form — klein" },     moldCost: 60,  pourLife: 40 },
  { id: "new_m",    label: { pl: "Nowa forma — srednia", en: "New mold — medium", de: "Neue Form — mittel" }, moldCost: 150, pourLife: 35 },
  { id: "new_l",    label: { pl: "Nowa forma — duza", en: "New mold — large", de: "Neue Form — gross" },     moldCost: 350, pourLife: 25 },
  { id: "client",   label: { pl: "Forma klienta", en: "Client mold", de: "Kundenform" },                      moldCost: 0,   pourLife: 1 },
  { id: "custom",   label: { pl: "Forma niestandardowa", en: "Custom mold", de: "Individuelle Form" },        moldCost: null, pourLife: null, custom: true },
];

const INCLUSIONS = [
  { id: "none",     label: { pl: "Brak", en: "None", de: "Keine" },                                              cost: 0 },
  { id: "pigment",  label: { pl: "Pigment / brokat", en: "Pigment / glitter", de: "Pigment / Glitzer" },          cost: 3 },
  { id: "object",   label: { pl: "Zalewany obiekt (kwiat, zdjecie)", en: "Embedded object (flower, photo)", de: "Eingebettetes Objekt (Blume, Foto)" }, cost: 8 },
  { id: "led",      label: { pl: "LED / elektronika", en: "LED / electronics", de: "LED / Elektronik" },          cost: 15 },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                              cost: null, custom: true },
];

const FINISH_OPTIONS = [
  { id: "raw",      label: { pl: "Surowy (z formy)", en: "Raw (from mold)", de: "Roh (aus Form)" },               timeH: 0,   cost: 0 },
  { id: "sanded",   label: { pl: "Szlifowany + polerowany", en: "Sanded + polished", de: "Geschliffen + poliert" }, timeH: 0.5, cost: 5 },
  { id: "coated",   label: { pl: "Lakierowany / powlekany", en: "Coated / lacquered", de: "Lackiert / beschichtet" }, timeH: 0.3, cost: 8 },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                              timeH: null, cost: null, custom: true },
];

function calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId }, lang) {
  const resin = RESINS.find(r => r.id === resinId);
  const vol = VOLUMES.find(v => v.id === volumeId);
  const mold = MOLD_TYPES.find(m => m.id === moldId);
  const incl = INCLUSIONS.find(i => i.id === inclusionId);
  const fin = FINISH_OPTIONS.find(f => f.id === finishId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!resin || !vol || !mold || !incl || !fin || !qTier) return null;
  if (!resin.pricePerMl || !vol.vol || mold.moldCost == null || incl.cost == null || fin.cost == null || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  const resinCost = vol.vol * resin.pricePerMl * 1.10;
  const moldPerPc = mold.pourLife > 0 ? mold.moldCost / mold.pourLife : 0;
  const inclCost = incl.cost;
  const workTimeH = 0.25 + (fin.timeH || 0);
  const cureOverheadH = resin.cureH * 0.02;
  const handleH = 0.05;

  const energyCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.DEPRECIATION_PLN_H;
  const finishCost = fin.cost || 0;

  const baseCost = resinCost + moldPerPc + inclCost + finishCost + energyCost + deprCost;
  const batchTimeH = (workTimeH + handleH) * qTier.qty + resin.cureH;

  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty);
  const cureDisplay = resin.cureH < 1 ? `${Math.round(resin.cureH * 60)} min (UV)` : `${resin.cureH} h`;

  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.resinCost, value: `${fmtCost(resinCost, lang)} (${vol.vol} ml)` },
      { label: l.moldAmort, value: fmtCost(moldPerPc, lang) },
      { label: l.inclusionCost, value: fmtCost(inclCost, lang) },
      { label: l.finishCost, value: fmtCost(finishCost, lang) },
      { label: l.workTime, value: `${(workTimeH * 60).toFixed(0)} min` },
      { label: l.cureTime, value: cureDisplay },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      { divider: true },
      { label: l.baseCost, value: fmtCost(baseCost, lang), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

const TECH_LABEL = { pl: "Odlewy zywiczne", en: "Resin Casting", de: "Harzguss" };

export default function EpoxyCastCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const [resinId, setResinId] = useState("epoxy_clear");
  const [volumeId, setVolumeId] = useState("S");
  const [moldId, setMoldId] = useState("existing");
  const [inclusionId, setInclusionId] = useState("none");
  const [finishId, setFinishId] = useState("raw");
  const [quantityId, setQuantityId] = useState("proto");

  const result = useMemo(() => calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId }, lang),
    [resinId, volumeId, moldId, inclusionId, finishId, quantityId, lang]);

  const paramsSummary = [
    t(RESINS.find(r => r.id === resinId)?.label, lang),
    t(VOLUMES.find(v => v.id === volumeId)?.label, lang),
    t(MOLD_TYPES.find(m => m.id === moldId)?.label, lang),
    t(INCLUSIONS.find(i => i.id === inclusionId)?.label, lang),
    t(FINISH_OPTIONS.find(f => f.id === finishId)?.label, lang),
    t(QUANTITY_TIERS.find(q => q.id === quantityId)?.label, lang),
  ].join(" | ");

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-600 mb-6">UV Resin · Epoxy 2K · Silicone Molds</div>

      <CalcCard stepNum="①" label={l.resinType}>
        {RESINS.filter(r => !r.custom).map(r => (
          <button key={r.id} onClick={() => setResinId(r.id)}
            className={`w-full mb-2 p-3 rounded-xl border text-left transition-all ${resinId === r.id ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-bold ${resinId === r.id ? "text-blue-300" : "text-white"}`}>{t(r.label, lang)}</span>
              <span className="text-[11px] text-neutral-500">{r.pricePerMl} PLN/ml</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{t(r.desc, lang)}</div>
          </button>
        ))}
        <button onClick={() => setResinId("custom")}
          className={`w-full p-2.5 rounded-xl border border-dashed text-left text-xs transition-all ${resinId === "custom" ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" : "border-white/10 text-neutral-500 italic"}`}>
          {l.customResin}
        </button>
      </CalcCard>

      <CalcCard stepNum="②" label={l.volume}>
        <Chips options={VOLUMES} value={volumeId} onChange={setVolumeId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="③" label={l.mold}>
        <Chips options={MOLD_TYPES} value={moldId} onChange={setMoldId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="④" label={l.inclusions}>
        <Chips options={INCLUSIONS} value={inclusionId} onChange={setInclusionId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑤" label={l.finish}>
        <Chips options={FINISH_OPTIONS} value={finishId} onChange={setFinishId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑥" label={l.qty}>
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={paramsSummary} />
    </div>
  );
}
