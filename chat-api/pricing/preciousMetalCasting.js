// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/preciousMetalCasting.js
// Regeneracja: npm run sync:pricing

import { calcNew } from "./jewelry.js";

export const PRECIOUS_METAL_CASTING_BUILD = "1.005";

export const CASTING_ENVELOPE_MM = [24, 24, 35];

const L = (pl, en, de) => ({ pl, en, de });

export const CASTING_VARIANTS = [
  { id: "ready_pattern", label: L("Gotowy wzorzec", "Ready pattern", "Fertiges Modell"), sub: L("Dostarczony wosk lub żywica odlewnicza", "Supplied wax or castable resin", "Angeliefertes Wachs oder Gießharz") },
  { id: "model_3d", label: L("Model 3D", "3D model", "3D-Modell"), sub: L("Przesyłasz plik, my drukujemy i odlewamy", "You upload, we print and cast", "Datei hochladen, wir drucken und gießen") },
  { id: "client_idea", label: L("Pomysł klienta", "Your idea", "Ihre Idee"), sub: L("Projekt, wydruk i odlew po stronie AEJaCA", "AEJaCA designs, prints and casts", "AEJaCA entwirft, druckt und gießt") },
];

export const CASTING_MATERIAL_SOURCES = [
  { id: "aejaca", label: L("Kruszec AEJaCA", "AEJaCA metal", "AEJaCA-Metall") },
  { id: "client", label: L("Kruszec powierzony", "Customer-supplied metal", "Beigestelltes Metall") },
];

export const CASTING_METALS = [
  { id: "silver", label: L("Srebro 925", "Silver 925", "Silber 925"), density: 10.36 },
  { id: "silver_800", label: L("Srebro 800", "Silver 800", "Silber 800"), density: 10.20 },
  { id: "gold_9k", label: L("Złoto 9k (375)", "Gold 9k (375)", "Gold 9k (375)"), density: 11.20 },
  { id: "gold_14k", label: L("Złoto 14k (585)", "Gold 14k (585)", "Gold 14k (585)"), density: 13.07 },
  { id: "gold_18k", label: L("Złoto 18k (750)", "Gold 18k (750)", "Gold 18k (750)"), density: 15.58 },
  { id: "gold_24k", label: L("Złoto 24k (999)", "Gold 24k (999)", "Gold 24k (999)"), density: 19.32 },
];

export const CASTING_FINISHES = [
  { id: "raw", label: L("Surowy odlew", "Raw casting", "Rohguss"), extraGrosze: 0 },
  { id: "clean", label: L("Odcięcie i oczyszczenie", "Cut and cleaned", "Abgetrennt und gereinigt"), extraGrosze: 7000 },
  { id: "polished", label: L("Wykończenie jubilerskie", "Jewellery finish", "Juwelierfinish"), extraGrosze: 16000 },
];

export const CASTING_RESERVE_RATE = 0.12;

function sortedMillimetres(bbox) {
  if (!bbox) return null;
  const dims = [bbox.x, bbox.y, bbox.z].map((v) => Number(v) * 10).sort((a, b) => a - b);
  return dims.every((v) => Number.isFinite(v) && v > 0) ? dims : null;
}

/** Największa jednolita skala, która po obrocie mieści model w kolbie. */
export function maxCastingScaleForBBox(bbox) {
  const dims = sortedMillimetres(bbox);
  if (!dims) return null;
  return Math.min(...dims.map((dimension, index) => CASTING_ENVELOPE_MM[index] / dimension));
}

export function fitsCastingFlask(bbox, scale = 1) {
  const maxScale = maxCastingScaleForBBox(bbox);
  return maxScale != null && Number.isFinite(Number(scale)) && Number(scale) > 0 && Number(scale) <= maxScale + 1e-9;
}

export function calculate(params, lang = "pl", rates) {
  const { variantId, materialSourceId, metalId, finishId, qtyId = "1", stlData } = params || {};
  if (!CASTING_VARIANTS.some((v) => v.id === variantId)
    || !CASTING_MATERIAL_SOURCES.some((v) => v.id === materialSourceId)
    || !CASTING_METALS.some((v) => v.id === metalId)
    || !CASTING_FINISHES.some((v) => v.id === finishId)) return null;

  if (variantId !== "model_3d" || materialSourceId !== "aejaca") return { type: "custom" };
  if (!stlData?.volumeCm3 || !stlData?.bbox) return null;
  if (!fitsCastingFlask(stlData.bbox)) return { type: "custom" };

  const metal = CASTING_METALS.find((v) => v.id === metalId);
  const finish = CASTING_FINISHES.find((v) => v.id === finishId);
  const finalMassG = stlData.volumeCm3 * metal.density;
  const requiredMassG = finalMassG * (1 + CASTING_RESERVE_RATE);
  const base = calcNew({
    lineId: "woman", typeId: "ring", metalId, weightId: "standard", methodId: "cast",
    platingId: "none", stoneRows: [], qtyId, engravingId: "none",
    clientSuppliesMetal: false, overrideWeightG: requiredMassG,
  }, lang, rates, undefined, {
    // Wewnętrzna opcja, nie parametr zamówienia: klient nie może nią sterować.
    // Odlew nie jest wykonaniem całego pierścionka od zera. Poprzednio silnik
    // doliczał sześć godzin pełnej pracy jubilerskiej, a następnie jeszcze
    // przygotowanie wzorca, przez co cena startowa była sztucznie zawyżona.
    laborHours: 1.5,
  });
  if (!base || base.type !== "calculated") return base;

  const patternPreparationGrosze = 12000;
  const extraGrosze = patternPreparationGrosze + finish.extraGrosze;
  const unitGrosze = base.unitGrosze + extraGrosze;
  const ln = lang === "de"
    ? [`Metallmasse des Teils: ${finalMassG.toFixed(2)} g`, `Prozessreserve 12%: ${(requiredMassG - finalMassG).toFixed(2)} g`, "Prüfung und Gussmodell-Druck", "Finish"]
    : lang === "en"
      ? [`Finished metal mass: ${finalMassG.toFixed(2)} g`, `12% process reserve: ${(requiredMassG - finalMassG).toFixed(2)} g`, "Model check and casting-pattern print", "Finish"]
      : [`Masa gotowego odlewu: ${finalMassG.toFixed(2)} g`, `Rezerwa procesowa 12%: ${(requiredMassG - finalMassG).toFixed(2)} g`, "Kontrola modelu i wydruk wzorca", "Wykończenie"];
  return {
    ...base,
    unitGrosze,
    lineGrosze: unitGrosze * (base.qty || 1),
    finalMassG,
    requiredMassG,
    breakdown: [
      ...(base.breakdown || []).filter((row) => !row.divider && !row.bold),
      { label: ln[0], value: "" },
      { label: ln[1], value: "" },
      { label: ln[2], value: `${(patternPreparationGrosze / 100).toFixed(0)} PLN` },
      { label: ln[3], value: `${(finish.extraGrosze / 100).toFixed(0)} PLN` },
    ],
  };
}
