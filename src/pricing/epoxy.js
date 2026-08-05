// ============================================================
// EPOXY CASTING PRICING CORE
// ============================================================
// Formuly przeniesione 1:1 z EpoxyCastCalc.jsx. Bez Reacta, zeby backend
// zamowien liczyl cene tym samym kodem co kalkulator.

import { CONFIG, QUANTITY_TIERS, applyPricing, t, fmtCost, plDiscountRow } from "./config.js";

export const EPOXY_CONFIG = {
  POWER_KW: 0.15,
  DEPRECIATION_PLN_H: 1.50,
  LABOR_PLN_H: 25.0,
  HANDLING_FEE: 5.0,
};

export const LBL = {
  pl: { resinType: "Typ żywicy", volume: "Objętość odlewu", mold: "Forma",
    inclusions: "Inkluzje / dodatki", finish: "Wykończenie", qty: "Nakład",
    resinCost: "Żywica / szt.", moldAmort: "Amortyzacja formy / szt.",
    inclusionCost: "Inkluzje / szt.", finishCost: "Wykończenie / szt.",
    laborCost: "Praca ręczna / szt.", handling: "Obsługa / szt.",
    workTime: "Czas pracy", cureTime: "Czas utwardzania",
    energy: "Energia / szt.", depreciation: "Amortyzacja narzędzi",
    workshop: "Usługi warsztatowe", estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny",
    totalProd: "Czas produkcji łącznie",
    customResin: "Inna żywica - wycena indywidualna" },
  en: { resinType: "Resin type", volume: "Cast volume", mold: "Mold",
    inclusions: "Inclusions / additives", finish: "Finish", qty: "Quantity",
    resinCost: "Resin / pc", moldAmort: "Mold amortization / pc",
    inclusionCost: "Inclusions / pc", finishCost: "Finish / pc",
    laborCost: "Manual labor / pc", handling: "Handling / pc",
    workTime: "Work time", cureTime: "Cure time",
    energy: "Energy / pc", depreciation: "Tool depreciation",
    workshop: "Workshop services", estCost: "Estimated cost / pc", discount: "Series discount",
    totalProd: "Total production time",
    customResin: "Other resin - individual quote" },
  de: { resinType: "Harztyp", volume: "Gussvolumen", mold: "Form",
    inclusions: "Einschlüsse / Zusätze", finish: "Finish", qty: "Auflage",
    resinCost: "Harz / Stk.", moldAmort: "Formamortisation / Stk.",
    inclusionCost: "Einschlüsse / Stk.", finishCost: "Finish / Stk.",
    laborCost: "Handarbeit / Stk.", handling: "Handhabung / Stk.",
    workTime: "Arbeitszeit", cureTime: "Aushärtezeit",
    energy: "Energie / Stk.", depreciation: "Werkzeugabschreibung",
    workshop: "Werkstattleistungen", estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt",
    totalProd: "Gesamte Produktionszeit",
    customResin: "Anderes Harz - individuelle Kalkulation" },
};

export const RESINS = [
  { id: "uv",          label: { pl: "Żywica UV", en: "UV Resin", de: "UV-Harz" },
    pricePerMl: 0.35, density: 1.10, cureH: 0.1,
    desc: { pl: "Szybkie utwardzanie, cienkie warstwy", en: "Fast curing, thin layers", de: "Schnelle Aushärtung, dünne Schichten" },
    img: "/img/calc/resin_types/uv.webp" },
  { id: "epoxy_clear", label: { pl: "Epoksyd - transparentny", en: "Epoxy - transparent", de: "Epoxid - transparent" },
    pricePerMl: 0.18, density: 1.15, cureH: 48,
    desc: { pl: "Krystalicznie czysty, 24-72h utwardzania", en: "Crystal clear, 24-72h curing", de: "Kristallklar, 24-72h Aushärtung" },
    img: "/img/calc/resin_types/epoxy_clear.webp" },
  { id: "epoxy_color", label: { pl: "Epoksyd - kolorowy", en: "Epoxy - colored", de: "Epoxid - farbig" },
    pricePerMl: 0.22, density: 1.15, cureH: 48,
    desc: { pl: "Z pigmentem, efekty artystyczne", en: "With pigment, artistic effects", de: "Mit Pigment, künstlerische Effekte" },
    img: "/img/calc/resin_types/epoxy_color.webp" },
  { id: "custom", label: { pl: "Inna żywica", en: "Other resin", de: "Anderes Harz" },
    pricePerMl: null, density: null, cureH: null, custom: true },
];

export const VOLUMES = [
  { id: "XS", label: { pl: "XS - biżuteria (do 10 ml)", en: "XS - jewelry (up to 10 ml)", de: "XS - Schmuck (bis 10 ml)" }, vol: 7 },
  { id: "S",  label: { pl: "S - brelok / mały (10-50 ml)", en: "S - keychain / small (10-50 ml)", de: "S - Schlüsselanhänger / klein (10-50 ml)" }, vol: 30 },
  { id: "M",  label: { pl: "M - podkładka / deko (50-250 ml)", en: "M - coaster / deco (50-250 ml)", de: "M - Untersetzer / Deko (50-250 ml)" }, vol: 150 },
  { id: "L",  label: { pl: "L - duży obiekt (250 ml - 1L)", en: "L - large object (250 ml - 1L)", de: "L - großes Objekt (250 ml - 1L)" }, vol: 600 },
  { id: "XL", label: { pl: "XL - powyżej 1L (river table itp.)", en: "XL - over 1L (river table etc.)", de: "XL - über 1L (River Table usw.)" }, vol: null, custom: true },
];

export const MOLD_TYPES = [
  { id: "existing", label: { pl: "Istniejąca forma", en: "Existing mold", de: "Vorhandene Form" },           moldCost: 0,   pourLife: 1,  img: "/img/calc/resin_molds/existing.webp" },
  { id: "new_s",    label: { pl: "Nowa forma - mała", en: "New mold - small", de: "Neue Form - klein" },     moldCost: 60,  pourLife: 40, img: "/img/calc/resin_molds/new_s.webp" },
  { id: "new_m",    label: { pl: "Nowa forma - średnia", en: "New mold - medium", de: "Neue Form - mittel" }, moldCost: 150, pourLife: 35, img: "/img/calc/resin_molds/new_m.webp" },
  { id: "new_l",    label: { pl: "Nowa forma - duża", en: "New mold - large", de: "Neue Form - groß" },     moldCost: 350, pourLife: 25, img: "/img/calc/resin_molds/new_l.webp" },
  { id: "client",   label: { pl: "Forma klienta", en: "Client mold", de: "Kundenform" },                      moldCost: 0,   pourLife: 1,  img: "/img/calc/resin_molds/client.webp" },
  { id: "custom",   label: { pl: "Forma niestandardowa", en: "Custom mold", de: "Individuelle Form" },        moldCost: null, pourLife: null, custom: true },
];

export const INCLUSIONS = [
  { id: "none",     label: { pl: "Brak", en: "None", de: "Keine" },                                              cost: 0,  img: "/img/calc/resin_inclusions/none.webp" },
  { id: "pigment",  label: { pl: "Pigment / brokat", en: "Pigment / glitter", de: "Pigment / Glitzer" },          cost: 3,  img: "/img/calc/resin_inclusions/pigment.webp" },
  { id: "object",   label: { pl: "Zalewany obiekt (kwiat, zdjęcie)", en: "Embedded object (flower, photo)", de: "Eingebettetes Objekt (Blume, Foto)" }, cost: 8,  img: "/img/calc/resin_inclusions/object.webp" },
  { id: "led",      label: { pl: "LED / elektronika", en: "LED / electronics", de: "LED / Elektronik" },          cost: 15, img: "/img/calc/resin_inclusions/led.webp" },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                              cost: null, custom: true },
];

export const FINISH_OPTIONS = [
  { id: "raw",      label: { pl: "Surowy (z formy)", en: "Raw (from mold)", de: "Roh (aus Form)" },               timeH: 0,   cost: 0,
    desc: { pl: "Naturalna faktura formy", en: "Natural mold texture", de: "Natürliche Formtextur" },
    img: "/img/calc/resin_finish/raw.webp" },
  { id: "sanded",   label: { pl: "Szlifowany + polerowany", en: "Sanded + polished", de: "Geschliffen + poliert" }, timeH: 0.5, cost: 5,
    desc: { pl: "Lustrzany połysk", en: "Mirror gloss", de: "Spiegelglanz" },
    img: "/img/calc/resin_finish/sanded.webp" },
  { id: "coated",   label: { pl: "Lakierowany / powlekany", en: "Coated / lacquered", de: "Lackiert / beschichtet" }, timeH: 0.3, cost: 8,
    desc: { pl: "Głęboki „mokry” efekt", en: "Deep wet-look effect", de: "Tiefer Nass-Effekt" },
    img: "/img/calc/resin_finish/coated.webp" },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                              timeH: null, cost: null, custom: true },
];

export function calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId }, lang) {
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

  const laborCost = workTimeH * EPOXY_CONFIG.LABOR_PLN_H;
  const energyCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.DEPRECIATION_PLN_H;
  const finishCost = fin.cost || 0;

  const baseCost = resinCost + moldPerPc + inclCost + finishCost + laborCost + energyCost + deprCost + EPOXY_CONFIG.HANDLING_FEE;
  const batchTimeH = (workTimeH + handleH) * qTier.qty + resin.cureH;

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty, plDiscount);
  const cureDisplay = resin.cureH < 1 ? `${Math.round(resin.cureH * 60)} min (UV)` : `${resin.cureH} h`;

  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.resinCost, value: `${fmtCost(resinCost, lang)} (${vol.vol} ml)` },
      { label: l.moldAmort, value: fmtCost(moldPerPc, lang) },
      { label: l.inclusionCost, value: fmtCost(inclCost, lang) },
      { label: l.finishCost, value: fmtCost(finishCost, lang) },
      { label: l.laborCost, value: fmtCost(laborCost, lang) },
      { label: l.handling, value: fmtCost(EPOXY_CONFIG.HANDLING_FEE, lang) },
      { label: l.workTime, value: `${(workTimeH * 60).toFixed(0)} min` },
      { label: l.cureTime, value: cureDisplay },
      { label: l.energy, value: fmtCost(energyCost, lang) },
      { label: l.depreciation, value: fmtCost(deprCost, lang) },
      { label: l.workshop, value: fmtCost(baseCost * CONFIG.BASE_MARGIN, lang) },
      { divider: true },
      { label: l.estCost, value: fmtCost(baseCost * (1 + CONFIG.BASE_MARGIN), lang), bold: true },
      ...(plDiscountRow(baseCost * (1 + CONFIG.BASE_MARGIN), plDiscount, lang) ? [plDiscountRow(baseCost * (1 + CONFIG.BASE_MARGIN), plDiscount, lang)] : []),
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

