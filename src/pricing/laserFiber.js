// ============================================================
// FIBER LASER PRICING CORE
// ============================================================
// Formuly przeniesione 1:1 z FiberLaserCalc.jsx. Bez Reacta, zeby backend
// zamowien liczyl cene tym samym kodem co kalkulator.

import { CONFIG, QUANTITY_TIERS, applyPricing, t, netCostFmt, orderQty, tierDiscount } from "./config.js";
import { materialCostPLN, materialIsOurs, pricedSeparately } from "./materialStock.js";
import { sweptAreaCm2, coverageOf, coverageMeasured } from "./engraveCoverage.js";

export const FIBER_CONFIG = {
  POWER_KW: 0.50,
  DEPRECIATION_PLN_H: 2.80,
  PRECIOUS_PREMIUM: 0.25,
  LABOR_PLN_MIN: 1.50,
  HANDLING_FEE_PLN: 5.0,
  MAX_FIELD_MM: 150,
};
export const LBL = {
  pl: { material: "Materiał", lens: "Soczewka / pole robocze", markType: "Typ znakowania",
    area: "Powierzchnia grawerowania", qty: "Nakład",
    engraveTime: "Czas grawerowania", timeSetup: "Czas + setup / szt.",
    laborCost: "Praca operatora / szt.", handling: "Obsługa / szt.",
    energy: "Energia / szt.", depreciation: "Amortyzacja / szt.", workshop: "Usługi warsztatowe",
    estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie",
    preciousSurcharge: "Narzut metal szlachetny",
    materialCost: "Materiał / szt.", materialSeparate: "wycena indywidualna",
    coverage: "Pokrycie rysunku",
    lens70desc: "Pole ~50×50mm (25 cm²), ultra fine", lens150desc: "Pole ~110×110mm (~121 cm²), standard" },
  en: { material: "Material", lens: "Lens / work field", markType: "Marking type",
    area: "Engraving area", qty: "Quantity",
    engraveTime: "Engraving time", timeSetup: "Time + setup / pc",
    laborCost: "Operator labor / pc", handling: "Handling / pc",
    energy: "Energy / pc", depreciation: "Depreciation / pc", workshop: "Workshop services",
    estCost: "Estimated cost / pc", discount: "Series discount", totalProd: "Total production time",
    preciousSurcharge: "Precious metal surcharge",
    materialCost: "Material / pc", materialSeparate: "quoted separately",
    coverage: "Artwork coverage",
    lens70desc: "Field ~50×50mm (25 cm²), ultra fine", lens150desc: "Field ~110×110mm (~121 cm²), standard" },
  de: { material: "Material", lens: "Linse / Arbeitsfeld", markType: "Markierungstyp",
    area: "Gravurfläche", qty: "Auflage",
    engraveTime: "Gravurzeit", timeSetup: "Zeit + Setup / Stk.",
    laborCost: "Bedienerarbeit / Stk.", handling: "Handhabung / Stk.",
    energy: "Energie / Stk.", depreciation: "Abschreibung / Stk.", workshop: "Werkstattleistungen",
    estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit",
    preciousSurcharge: "Aufpreis Edelmetall",
    materialCost: "Material / Stk.", materialSeparate: "separate Kalkulation",
    coverage: "Zeichnungsabdeckung",
    lens70desc: "Feld ~50×50mm (25 cm²), ultra fein", lens150desc: "Feld ~110×110mm (~121 cm²), Standard" },
};

export const MATERIALS = [
  { id: "stainless",  label: { pl: "Stal nierdzewna", en: "Stainless steel", de: "Edelstahl" },   rateMin: 0.10, precious: false, grupa: "metal", img: "/img/calc/fiber_materials/stainless.webp" },
  { id: "aluminum",   label: { pl: "Aluminium", en: "Aluminum", de: "Aluminium" },                rateMin: 0.08, precious: false, grupa: "metal", img: "/img/calc/fiber_materials/aluminum.webp" },
  { id: "brass",      label: { pl: "Mosiądz", en: "Brass", de: "Messing" },                      rateMin: 0.12, precious: false, grupa: "metal", img: "/img/calc/fiber_materials/brass.webp" },
  { id: "copper",     label: { pl: "Miedź", en: "Copper", de: "Kupfer" },                         rateMin: 0.15, precious: false, grupa: "metal", img: "/img/calc/fiber_materials/copper.webp" },
  { id: "titanium",   label: { pl: "Tytan", en: "Titanium", de: "Titan" },                        rateMin: 0.18, precious: false, grupa: "metal", img: "/img/calc/fiber_materials/titanium.webp" },
  { id: "silver",     label: { pl: "Srebro", en: "Silver", de: "Silber" },                        rateMin: 0.14, precious: true,  grupa: "metal", img: "/img/calc/fiber_materials/silver.webp" },
  { id: "gold",       label: { pl: "Złoto", en: "Gold", de: "Gold" },                             rateMin: 0.16, precious: true,  grupa: "metal", img: "/img/calc/fiber_materials/gold.webp" },
  { id: "anodized",   label: { pl: "Aluminium anodowane", en: "Anodized aluminum", de: "Eloxiertes Aluminium" }, rateMin: 0.06, precious: false, grupa: "metal", img: "/img/calc/fiber_materials/anodized.webp" },
  { id: "custom",     label: { pl: "Inny materiał", en: "Other material", de: "Anderes Material" }, rateMin: null, precious: false, custom: true },
];

export const LENSES = [
  { id: "70mm",  label: { pl: "70mm - precyzyjne detale", en: "70mm - precision details", de: "70mm - Präzisionsdetails" },
    desc: { pl: "Pole ~50×50mm (25 cm²), ultra fine", en: "Field ~50×50mm (25 cm²), ultra fine", de: "Feld ~50×50mm (25 cm²), ultra fein" },
    fieldMm: 50, maxAreaCm2: 25, speedMul: 1.0, img: "/img/calc/fiber_lens/lens_70.webp" },
  { id: "150mm", label: { pl: "150mm - większe pole", en: "150mm - larger field", de: "150mm - größeres Feld" },
    desc: { pl: "Pole ~150×150mm (~225 cm²), standard", en: "Field ~150×150mm (~225 cm²), standard", de: "Feld ~150×150mm (~225 cm²), Standard" },
    // Pole tej soczewki to 150 x 150 mm, potwierdzone przez wlasciciela
    // 2026-08-19. Wczesniej stalo tu 110 x 110 mm i klient czytal te liczbe
    // przed zakupem, a kalkulator odrzucal na jej podstawie prace, ktore
    // realnie umiemy wykonac.
    fieldMm: 150, maxAreaCm2: 225, speedMul: 0.85, img: "/img/calc/fiber_lens/lens_150.webp" },
];

export const MARK_TYPES = [
  { id: "surface",  label: { pl: "Znakowanie powierzchniowe", en: "Surface marking", de: "Oberflächenmarkierung" },
    desc: { pl: "Ciemny ślad, gładka powierzchnia", en: "Dark mark, smooth surface", de: "Dunkle Markierung, glatte Oberfläche" },
    depthMul: 1.0, img: "/img/calc/fiber_marks/surface.webp" },
  { id: "medium",   label: { pl: "Średnia głębokość", en: "Medium depth", de: "Mittlere Tiefe" },
    desc: { pl: "Wyczuwalny rowek ~0,1–0,2 mm", en: "Tactile groove ~0.1–0.2 mm", de: "Fühlbare Rille ~0,1–0,2 mm" },
    depthMul: 2.5, img: "/img/calc/fiber_marks/medium.webp" },
  { id: "deep",     label: { pl: "Głębokie grawerowanie", en: "Deep engraving", de: "Tiefgravur" },
    desc: { pl: "Trwały ślad 0,5–1 mm", en: "Permanent mark 0.5–1 mm", de: "Dauerhaft 0,5–1 mm" },
    depthMul: 6.0, img: "/img/calc/fiber_marks/deep.webp" },
  { id: "color",    label: { pl: "Znakowanie kolorowe", en: "Color marking", de: "Farbmarkierung" },
    desc: { pl: "Tytan / stal - tęczowe kolory", en: "Titanium / steel - rainbow colors", de: "Titan / Stahl - Regenbogenfarben" },
    depthMul: 1.8, img: "/img/calc/fiber_marks/color.webp" },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                               depthMul: null, custom: true },
];

export const AREAS = [
  { id: "XS", label: { pl: "XS - do 5 cm²", en: "XS - up to 5 cm²", de: "XS - bis 5 cm²" },          area: 3 },
  { id: "S",  label: { pl: "S - 5–25 cm²", en: "S - 5–25 cm²", de: "S - 5–25 cm²" },                  area: 15 },
  { id: "M",  label: { pl: "M - 25–60 cm²", en: "M - 25–60 cm²", de: "M - 25–60 cm²" },               area: 40 },
  { id: "L",  label: { pl: "L - powyżej 60 cm²", en: "L - over 60 cm²", de: "L - über 60 cm²" },      area: 80 },
  { id: "XL", label: { pl: "XL - wielokrotne pola", en: "XL - multiple fields", de: "XL - mehrere Felder" }, area: null, custom: true },
];

/**
 * @param {object} p parametry z kalkulatora
 * @param {string|null} p.podloze kto dostarcza material; brak znaczy "nasz"
 * @param {string} lang
 * @param {Array|null} stock tabela stanow magazynowych; brak znaczy stawka
 *   domyslna
 */
export function calculate({ matId, lensId, markId, areaId, quantityId, qty: sztuk, svgData, podloze = null }, lang, stock = null) {
  const mat = MATERIALS.find(m => m.id === matId);
  const lens = LENSES.find(l => l.id === lensId);
  const mark = MARK_TYPES.find(m => m.id === markId);
  const area = svgData
    ? { area: svgData.engravAreaCm2 }
    : AREAS.find(a => a.id === areaId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !lens || !mark || !area || !qTier) return null;
  if (!mat.rateMin || !mark.depthMul || !area.area || !qTier.qty) return { type: "custom" };
  // LICZYMY PO LICZBIE SZTUK, KTORA KLIENT NAPRAWDE ZAMAWIA, a nie po nakladzie
  // reprezentatywnym progu. Przy dwoch sztukach przygotowanie dzieli sie przez
  // dwie, a nie przez szesc. Rabat zostaje przy progu i jest przycinany tak,
  // zeby wieksze zlecenie nigdy nie bylo tansze (`tierDiscount`).
  const qty = orderQty(quantityId, { qty: sztuk });
  const rabat = tierDiscount(quantityId, qty);
  const l = LBL[lang] || LBL.en;

  // CZAS IDZIE Z POLA, PO KTORYM GLOWICA JEZDZI. Znakowanie fiber jest tak
  // samo rastrowe jak grawer CO2, wiec obowiazuje ta sama regula i czytamy ja
  // z tego samego pliku. Material zostaje przy calym prostokacie: blaszke
  // kupujemy w calosci niezaleznie od tego, jak gesty jest wzor.
  const swept = sweptAreaCm2(area.area, svgData);
  const timeMin = swept * mat.rateMin * mark.depthMul * lens.speedMul;
  const timeH = timeMin / 60;
  const setupH = 0.2 / qty;
  const handleH = 0.03;
  const totalTimeH = timeH + setupH + handleH;

  const laborCost = timeMin * FIBER_CONFIG.LABOR_PLN_MIN;
  const energyCost = totalTimeH * FIBER_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * FIBER_CONFIG.DEPRECIATION_PLN_H;
  const handlingFee = FIBER_CONFIG.HANDLING_FEE_PLN;
  let baseCost = laborCost + energyCost + deprCost + handlingFee;

  if (mat.precious) baseCost *= (1 + FIBER_CONFIG.PRECIOUS_PREMIUM);

  // MATERIAL LICZY SIE TAK SAMO JAK PRZY CO2, z tej samej tabeli i tylko
  // wtedy, gdy plyta jest nasza. Wczesniej Fiber nie doliczal go nigdy, choc
  // kalkulator pyta o podloze, a w koszyku stala odpowiedz "z naszego
  // magazynu": klient placil tyle samo za nasza blaszke i za swoja obraczke.
  //
  // Doliczamy PO narzucie za metal szlachetny, bo ten narzut placi za ryzyko
  // pracy na cudzym kruszcu, a nie za material. Zreszta srebro i zloto maja
  // w tabeli zero w obu kolumnach i ida do wyceny indywidualnej.
  // MATERIAL BEZ USTALONEJ CENY WYKLUCZA KWOTE WIAZACA.
  //
  // Dotyczy to przede wszystkim srebra i zlota z naszego magazynu: kruszec
  // rozlicza sie wagowo i wedlug proby, wiec dopoki nie zwazymy blaszki, nie
  // istnieje liczba, ktora moglibysmy nazwac umowa. Klient idzie do wyceny
  // indywidualnej, a nie do koszyka z pozycja "do ustalenia".
  //
  // Warunek pyta NAJPIERW o `mat.precious`, a dopiero potem o tabele. Gdyby
  // pytal wylacznie o tabele, awaria bazy zamienilaby srebro w material po
  // stawce domyslnej 140 zl/m2, czyli w kwote wiazaca wzieta z powietrza.
  if (materialIsOurs(podloze) && (mat.precious || pricedSeparately(mat.id, stock))) {
    return { type: "custom" };
  }
  const materialCost = materialCostPLN({ areaCm2: area.area, matId: mat.id, podloze, stock });
  baseCost += materialCost;

  const batchTimeH = (timeH + handleH) * qty + 0.2;

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, rabat, qty, plDiscount);
  const fc = netCostFmt(lang, pricing.plFactor);
  return {
    type: "calculated", ...pricing, qty, discount: rabat,
    totalTimeH: qty > 1 ? batchTimeH : null,
    breakdown: [
      ...(coverageMeasured(svgData) ? [{ label: l.coverage, value: `${Math.round(coverageOf(svgData) * 100)}%` }] : []),
      { label: l.engraveTime, value: `${timeMin.toFixed(1)} min` },
      { label: l.timeSetup, value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: l.laborCost, value: fc(laborCost) },
      { label: l.handling, value: fc(handlingFee) },
      { label: l.energy, value: fc(energyCost) },
      { label: l.depreciation, value: fc(deprCost) },
      ...(mat.precious ? [{ label: l.preciousSurcharge, value: `+${FIBER_CONFIG.PRECIOUS_PREMIUM * 100}%` }] : []),
      // Pozycja materialu MUSI byc widoczna, gdy go liczymy. Gdy nie umiemy,
      // ta konfiguracja nie dochodzi do kwoty w ogole, patrz wyzej.
      ...(materialCost > 0 ? [{ label: l.materialCost, value: fc(materialCost) }] : []),
      { label: l.workshop, value: fc(baseCost * CONFIG.BASE_MARGIN) },
      { divider: true },
      { label: l.estCost, value: fc(baseCost * (1 + CONFIG.BASE_MARGIN)), bold: true },
      ...(rabat > 0 ? [{ label: l.discount, value: `-${Math.round(rabat * 1000) / 10}%`, accent: true }] : []),
      ...(qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

