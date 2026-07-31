// ============================================================
// EPOXY / RESIN CASTING ESTIMATOR
// ============================================================
// Types: UV Resin | Epoxy Clear | Epoxy Colored
// Molds: silicone (platinum-cure)
// Depreciation (UV lamp + tools): ~1.50 PLN/h
// ============================================================
import { useState, useMemo } from "react";
import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, Chips, CalcCard, ResultHeader, ResultDisplay, InquiryForm, MaterialCards, HeroCards, QuoteEmailCapture } from "./calcShared.jsx";
import CalcToCart from "./CalcToCart.jsx";

import { EPOXY_CONFIG, RESINS, VOLUMES, MOLD_TYPES, INCLUSIONS, FINISH_OPTIONS, calculate,
  LBL,
} from "../../pricing/epoxy.js";

export { RESINS, VOLUMES, MOLD_TYPES, INCLUSIONS, FINISH_OPTIONS, calculate };

const TECH_LABEL = { pl: "Odlewy żywiczne", en: "Resin Casting", de: "Harzguss" };

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
      <div className="text-center text-[11px] text-neutral-400 mb-6">UV Resin · Epoxy 2K · Silicone Molds</div>

      <CalcCard stepNum="①" label={l.resinType}>
        <HeroCards options={RESINS} value={resinId} onChange={setResinId} lang={lang} cols="grid-cols-1 sm:grid-cols-3" minH={170} />
      </CalcCard>

      <CalcCard stepNum="②" label={l.volume}>
        <Chips options={VOLUMES} value={volumeId} onChange={setVolumeId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="③" label={l.mold}>
        <MaterialCards options={MOLD_TYPES} value={moldId} onChange={setMoldId} lang={lang} cols="grid-cols-3 sm:grid-cols-5" />
      </CalcCard>

      <CalcCard stepNum="④" label={l.inclusions}>
        <MaterialCards options={INCLUSIONS} value={inclusionId} onChange={setInclusionId} lang={lang} cols="grid-cols-2 sm:grid-cols-4" />
      </CalcCard>

      <CalcCard stepNum="⑤" label={l.finish}>
        <HeroCards options={FINISH_OPTIONS} value={finishId} onChange={setFinishId} lang={lang} cols="grid-cols-1 sm:grid-cols-3" minH={150} />
      </CalcCard>

      <CalcCard stepNum="⑥" label={l.qty}>
        <Chips options={QUANTITY_TIERS} value={quantityId} onChange={setQuantityId} lang={lang} />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} />
        <ResultDisplay result={result} lang={lang} />
        <QuoteEmailCapture result={result} lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={paramsSummary} />
        <CalcToCart
          calculator="epoxy"
          serviceId="epoxy"
          params={{ resinId, volumeId, moldId, inclusionId, finishId, quantityId }}
          lang={lang}
        />
      </div>

      <InquiryForm lang={lang} techLabel={t(TECH_LABEL, lang)} paramsSummary={paramsSummary} />
    </div>
  );
}
