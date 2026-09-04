// ============================================================
// ODLEW ZYWICZNY, KALKULATOR sTuDiO
// ============================================================
// Types: UV Resin | Epoxy Clear | Epoxy Colored
// Molds: silicone (platinum-cure)
// Depreciation (UV lamp + tools): ~1.50 PLN/h
//
// PYTANIA SA WZIETE ZE SKLEPU. Lista pol, ich kolejnosc, etykiety i sposob
// rysowania stoja w `orderCatalog.js`, a rysuje je `PolaUslugi`, wiec ten
// ekran nie moze zapytac o co innego niz karta uslugi. Decyzja: ADR-0037.
// ============================================================
import { useState, useMemo } from "react";
import { QUANTITY_TIERS, t, ResultHeader, ResultDisplay, NextStepPanel } from "./calcShared.jsx";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import PolaUslugi from "../shop/PolaUslugi.jsx";
import { getService } from "../../data/orderCatalog.js";
import CalcToCart from "./CalcToCart.jsx";

import { RESINS, VOLUMES, MOLD_TYPES, INCLUSIONS, FINISH_OPTIONS, calculate } from "../../pricing/epoxy.js";

export { RESINS, VOLUMES, MOLD_TYPES, INCLUSIONS, FINISH_OPTIONS, calculate };

const TECH_LABEL = { pl: "Odlewy żywiczne", en: "Resin Casting", de: "Harzguss" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stückzahl" };

/** Opis uslugi wspolny ze sklepem: stad biora sie pytania i stan poczatkowy. */
const USLUGA = getService("epoxy");

export default function EpoxyCastCalc({ lang = "pl" }) {
  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  // STAN POCZATKOWY TEZ IDZIE Z KATALOGU. Kalkulator zaczynal od innej zywicy
  // i innego wykonczenia niz karta uslugi, wiec ten sam klient widzial dwie
  // rozne kwoty startowe, zaleznie od tego, ktorymi drzwiami wszedl.
  const [params, setParams] = useState(() => ({ ...USLUGA.defaults }));
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty), zeby chipsy i
  // licznik nigdy nie pokazaly sprzecznych wartosci.
  const [qty, setQty] = useState(1);
  const quantityId = tierForQty(qty, QUANTITY_TIERS).id;
  const stan = { ...params, quantityId };

  const setParam = (klucz, wartosc) => {
    if (klucz === "quantityId") { setQty(qtyForTier(wartosc, QUANTITY_TIERS)); return; }
    setParams((p) => ({ ...p, [klucz]: wartosc }));
  };

  const { resinId, volumeId, moldId, inclusionId, finishId } = params;

  const result = useMemo(() => calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId, qty }, lang),
    [resinId, volumeId, moldId, inclusionId, finishId, quantityId, qty, lang]);

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
      <div className="text-center text-xs text-neutral-400 mb-6">UV Resin · Epoxy 2K · Silicone Molds</div>

      <PolaUslugi
        service={USLUGA}
        params={stan}
        setParam={setParam}
        lang={lang}
        wyglad="kalkulator"
        tierKey="quantityId"
        qty={qty}
        onQty={setQty}
        qtyMax={qtyLimit(QUANTITY_TIERS)}
        qtyOpen={qtyOpenValue(QUANTITY_TIERS)}
        qtyLabel={t(QTY_STEPPER_LBL, lang)}
      />

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        <NextStepPanel
          lang={lang}
          techLabel={t(TECH_LABEL, lang)}
          paramsSummary={paramsSummary}
          result={result}
          cart={
            <CalcToCart
              embedded
              onBinding={setBindingGrosze}
              calculator="epoxy"
              serviceId="epoxy"
              params={{ resinId, volumeId, moldId, inclusionId, finishId, quantityId }}
              qty={qty}
              lang={lang}
            />
          }
        />
      </div>
    </div>
  );
}
