// ============================================================
// CO2 LASER PRICING CORE
// ============================================================
// Formuly przeniesione 1:1 z CO2LaserCalc.jsx. Bez Reacta, zeby backend
// zamowien liczyl cene tym samym kodem co kalkulator.

import { CONFIG, QUANTITY_TIERS, applyPricing, t, netCostFmt } from "./config.js";


export const CO2_CONFIG = {
  POWER_KW: 0.80,
  DEPRECIATION_PLN_H: 3.20,
  LABOR_PLN_MIN: 1.00,
  HANDLING_FEE: 5.0,
  EXTENDED_AREA_TIME_MUL: 1.40,
  EXTENDED_AREA_COST_ADD: 15,
};

export const WORK_AREA_MM = { x: 600, y: 288 };
// Extended area: xTool P2 with passthrough enables long materials
export const EXTENDED_AREA_MM = { x: 600, y: 3000 };

export const PATH_NEEDS_EXTENDED = { XS: false, S: false, M: false, L: true, XL: true };
export const AREA_NEEDS_EXTENDED = { XS: false, S: false, M: false, L: true, XL: true };
export const LBL = {
  pl: { mode: "Tryb pracy", engrave: "Grawerowanie", cut: "Cięcie",
    engraveDesc: "Raster - znakowanie powierzchni", cutDesc: "Wektor - wycinanie kształtów",
    material: "Materiał", matThick: "Materiał i grubość", area: "Powierzchnia grawerowania",
    detail: "Poziom detali", pathLen: "Długość ścieżki cięcia", complexity: "Złożoność",
    qty: "Nakład", workArea: "Obszar roboczy",
    stdArea: "Standardowy (600×288 mm)", extArea: "Rozszerzony (riser/passthrough)",
    stdAreaDesc: "Standardowe pole robocze xTool P2", extAreaDesc: "Wymaga podłączenia dodatkowego sprzętu - dłuższy setup i wyższy koszt",
    engraveTime: "Czas grawerowania", timeSetup: "Czas + setup / szt.", prepMat: "Przygotowanie mat.",
    energy: "Energia / szt.", depreciation: "Amortyzacja / szt.", workshop: "Usługi warsztatowe",
    estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny", totalProd: "Czas produkcji łącznie",
    cutTime: "Czas cięcia", materialCost: "Materiał / szt.", extSurcharge: "Narzut rozszerzony obszar" },
  en: { mode: "Work mode", engrave: "Engraving", cut: "Cutting",
    engraveDesc: "Raster - surface marking", cutDesc: "Vector - shape cutting",
    material: "Material", matThick: "Material & thickness", area: "Engraving area",
    detail: "Detail level", pathLen: "Cut path length", complexity: "Complexity",
    qty: "Quantity", workArea: "Work area",
    stdArea: "Standard (600×288 mm)", extArea: "Extended (riser/passthrough)",
    stdAreaDesc: "Standard xTool P2 work area", extAreaDesc: "Requires additional equipment - longer setup and higher cost",
    engraveTime: "Engraving time", timeSetup: "Time + setup / pc", prepMat: "Material prep",
    energy: "Energy / pc", depreciation: "Depreciation / pc", workshop: "Workshop services",
    estCost: "Estimated cost / pc", discount: "Series discount", totalProd: "Total production time",
    cutTime: "Cut time", materialCost: "Material / pc", extSurcharge: "Extended area surcharge" },
  de: { mode: "Arbeitsmodus", engrave: "Gravur", cut: "Schnitt",
    engraveDesc: "Raster - Oberflächenmarkierung", cutDesc: "Vektor - Formenschnitt",
    material: "Material", matThick: "Material & Stärke", area: "Gravurfläche",
    detail: "Detailgrad", pathLen: "Schnittpfadlänge", complexity: "Komplexität",
    qty: "Auflage", workArea: "Arbeitsbereich",
    stdArea: "Standard (600×288 mm)", extArea: "Erweitert (Riser/Passthrough)",
    stdAreaDesc: "Standard xTool P2 Arbeitsbereich", extAreaDesc: "Erfordert Zusatzausrüstung - längeres Setup und höhere Kosten",
    engraveTime: "Gravurzeit", timeSetup: "Zeit + Setup / Stk.", prepMat: "Materialvorbereitung",
    energy: "Energie / Stk.", depreciation: "Abschreibung / Stk.", workshop: "Werkstattleistungen",
    estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt", totalProd: "Gesamte Produktionszeit",
    cutTime: "Schnittzeit", materialCost: "Material / Stk.", extSurcharge: "Aufpreis erweiterter Bereich" },
};
// `grupa` odpowiada kaflowi materialu w szybkiej wycenie i zawezа liste
// wyboru: drewno pokazuje drewniane, metal metalowe, reszta idzie pod
// "Szklo / Kamien / Inne". Pole stoi PRZY STAWCE, a nie w osobnej tablicy,
// bo material dopisany do cennika bez grupy zniknalby z wyboru po cichu:
// cena by istniala, a klient nie mialby jak jej wybrac. Guard tego pilnuje.
export const ENGRAVE_MATERIALS = [
  // GRAWER NIE PYTA O GRUBOSC. Wiazka siega powierzchni, wiec deska 6 mm
  // i bal 40 mm kosztuja tyle samo; podzial na grubosci ma sens dopiero
  // przy cieciu. Stad trzy pozycje po rodzaju materialu, a nie po wymiarze.
  { id: "wood",    label: { pl: "Lite drewno", en: "Solid wood", de: "Massivholz" }, rateMin: 0.07, prepCost: 0.5, grupa: "wood", img: "/img/calc/co2_materials/wood.webp" },
  { id: "plywood", label: { pl: "Sklejka", en: "Plywood", de: "Sperrholz" },      rateMin: 0.07, prepCost: 0.4, grupa: "wood", img: "/img/calc/co2_materials/plywood.webp" },
  // HDF, MDF, fornir, korek, plyta meblowa. Grawer wychodzi na nich inaczej
  // niz na litym drewnie (klej i prasowane wlokno daja rowniejszy, ciemniejszy
  // slad), ale czas maszyny jest ten sam.
  { id: "wood_other", label: { pl: "Inne materiały drewnopochodne", en: "Other wood-based materials", de: "Andere Holzwerkstoffe" }, rateMin: 0.07, prepCost: 0.5, grupa: "wood", img: "/img/calc/co2_materials/plywood.webp" },
  { id: "acrylic", label: { pl: "Akryl", en: "Acrylic", de: "Acryl" },            rateMin: 0.08, prepCost: 0.8, grupa: "other", img: "/img/calc/co2_materials/acrylic.webp" },
  { id: "glass",   label: { pl: "Szkło", en: "Glass", de: "Glas" },               rateMin: 0.20, prepCost: 1.0, grupa: "other", img: "/img/calc/co2_materials/glass.webp" },
  { id: "leather", label: { pl: "Skóra", en: "Leather", de: "Leder" },            rateMin: 0.06, prepCost: 1.2, grupa: "other", img: "/img/calc/co2_materials/leather.webp" },
  { id: "paper",   label: { pl: "Papier / karton", en: "Paper / cardboard", de: "Papier / Karton" }, rateMin: 0.05, prepCost: 0.2, grupa: "other", img: "/img/calc/co2_materials/paper.webp" },
  { id: "fabric",  label: { pl: "Tkanina", en: "Fabric", de: "Stoff" },           rateMin: 0.07, prepCost: 0.6, grupa: "other", img: "/img/calc/co2_materials/fabric.webp" },
  { id: "rubber",  label: { pl: "Guma / pieczątki", en: "Rubber / stamps", de: "Gummi / Stempel" }, rateMin: 0.10, prepCost: 0.8, grupa: "other", img: "/img/calc/co2_materials/rubber.webp" },
  { id: "stone",   label: { pl: "Kamień / łupek", en: "Stone / slate", de: "Stein / Schiefer" }, rateMin: 0.25, prepCost: 1.5, grupa: "other", img: "/img/calc/co2_materials/stone.webp" },
  { id: "custom",  label: { pl: "Inny materiał", en: "Other material", de: "Anderes Material" }, rateMin: null, prepCost: null, custom: true },
];

export const ENGRAVE_AREAS = [
  { id: "XS", label: { pl: "XS - do 25 cm²", en: "XS - up to 25 cm²", de: "XS - bis 25 cm²" }, area: 15 },
  { id: "S",  label: { pl: "S - 25–100 cm²", en: "S - 25–100 cm²", de: "S - 25–100 cm²" }, area: 60 },
  { id: "M",  label: { pl: "M - 100–400 cm²", en: "M - 100–400 cm²", de: "M - 100–400 cm²" }, area: 250 },
  { id: "L",  label: { pl: "L - 400–1000 cm²", en: "L - 400–1000 cm²", de: "L - 400–1000 cm²" }, area: 700 },
  { id: "XL", label: { pl: "XL - powyżej 1000 cm²", en: "XL - over 1000 cm²", de: "XL - über 1000 cm²" }, area: null, custom: true },
];

export const ENGRAVE_DETAIL = [
  { id: "simple",   label: { pl: "Prosty (tekst/logo)", en: "Simple (text/logo)", de: "Einfach (Text/Logo)" },     mul: 0.7, img: "/img/calc/co2_detail/simple.webp",
    desc: { pl: "Tekst, logo, proste linie", en: "Text, logo, simple lines", de: "Text, Logo, einfache Linien" } },
  { id: "standard", label: { pl: "Średni (grafika)", en: "Standard (graphics)", de: "Standard (Grafik)" },         mul: 1.0, img: "/img/calc/co2_detail/standard.webp",
    desc: { pl: "Ilustracja, ornament, line-art", en: "Illustration, ornament, line-art", de: "Illustration, Ornament, Strichzeichnung" } },
  { id: "photo",    label: { pl: "Wysoki (fotograwer)", en: "High (photo engrave)", de: "Hoch (Fotogravur)" },     mul: 2.2, img: "/img/calc/co2_detail/photo.webp",
    desc: { pl: "Foto, raster, gradacja tonalna", en: "Photo, raster, tonal gradation", de: "Foto, Raster, Tonabstufung" } },
  { id: "custom",   label: { pl: "Niestandardowy", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

export const CUT_MATERIALS = [
  // Sklejka 2 mm dochodzi do listy na polecenie wlasciciela (2026-08-19).
  // Stawki wyprowadzone z sasiadow, a nie zgadniete: ciecie 3 mm to 0.15,
  // 5 mm to 0.25, wiec krok na milimetr wynosi 0.05, a material 0.04 przy
  // 3 mm i 0.06 przy 5 mm, czyli 0.01 na milimetr. Cienszy arkusz tnie sie
  // szybciej i kosztuje mniej, wiec obie liczby ida o jeden krok w dol.
  { id: "ply2",     label: { pl: "Sklejka 2mm", en: "Plywood 2mm", de: "Sperrholz 2mm" }, cutRate: 0.10, matCost: 0.03, grupa: "wood" },
  { id: "ply3",     label: { pl: "Sklejka 3mm", en: "Plywood 3mm", de: "Sperrholz 3mm" }, cutRate: 0.15, matCost: 0.04, grupa: "wood" },
  { id: "ply56",    label: { pl: "Sklejka 5-6mm", en: "Plywood 5-6mm", de: "Sperrholz 5-6mm" }, cutRate: 0.25, matCost: 0.06, grupa: "wood" },
  // HDF i MDF zastapily sklejke 8 mm na polecenie wlasciciela (2026-08-20):
  // prasowane wlokno tnie sie rowniej niz osiem milimetrow sklejki, gdzie
  // kleje miedzy warstwami potrafia zatrzymac wiazke. Czas maszyny ten sam,
  // material tanszy, stad 0.07 zamiast 0.09.
  { id: "mdf8",     label: { pl: "Płyta HDF/MDF do 8mm", en: "HDF/MDF board up to 8mm", de: "HDF/MDF-Platte bis 8mm" }, cutRate: 0.50, matCost: 0.07, grupa: "wood" },
  // Lite drewno do 10 mm dochodzi na polecenie wlasciciela (2026-08-20).
  //
  // Wyprowadzenie z sasiadow dawalo 0.67 za centymetr sciezki (sklejka idzie
  // 0.25 przy 5 mm i 0.50 przy 8 mm, czyli okolo 0.083 na milimetr), ale
  // WLASCICIEL PODNIOSL STAWKE DO 1.00 i to jest liczba obowiazujaca. Powod
  // jest warsztatowy, nie arytmetyczny: lita deska ma sloje, zywice i
  // niejednorodna gestosc, wiec przejscie na wylot wymaga kilku powtorzen
  // i pilnowania, a nie jednego przejazdu jak przy sklejce. Interpolacja ze
  // sklejki tego nie widzi, bo sklejka jest materialem jednorodnym.
  //
  // Material 0.16 (potwierdzone): 0.11 z kroku sklejki, podniesione, bo deska
  // lita kosztuje wiecej niz sklejka tej samej grubosci.
  { id: "wood10",   label: { pl: "Lite drewno do 10mm", en: "Solid wood up to 10mm", de: "Massivholz bis 10mm" }, cutRate: 1.00, matCost: 0.16, grupa: "wood" },
  { id: "acr3",     label: { pl: "Akryl 3mm", en: "Acrylic 3mm", de: "Acryl 3mm" }, cutRate: 0.20, matCost: 0.12, grupa: "other" },
  { id: "acr5",     label: { pl: "Akryl 5mm", en: "Acrylic 5mm", de: "Acryl 5mm" }, cutRate: 0.35, matCost: 0.18, grupa: "other" },
  { id: "acr8",     label: { pl: "Akryl 8mm", en: "Acrylic 8mm", de: "Acryl 8mm" }, cutRate: 0.60, matCost: 0.28, grupa: "other" },
  { id: "leather2", label: { pl: "Skóra 1–2mm", en: "Leather 1–2mm", de: "Leder 1–2mm" }, cutRate: 0.10, matCost: 0.20, grupa: "other" },
  { id: "leather4", label: { pl: "Skóra 3–4mm", en: "Leather 3–4mm", de: "Leder 3–4mm" }, cutRate: 0.20, matCost: 0.35, grupa: "other" },
  { id: "paper",    label: { pl: "Papier / karton", en: "Paper / cardboard", de: "Papier / Karton" }, cutRate: 0.05, matCost: 0.01, grupa: "other" },
  { id: "fabric",   label: { pl: "Tkanina / filc", en: "Fabric / felt", de: "Stoff / Filz" }, cutRate: 0.08, matCost: 0.06, grupa: "other" },
  { id: "rubber",   label: { pl: "Guma 2–3mm", en: "Rubber 2–3mm", de: "Gummi 2–3mm" }, cutRate: 0.18, matCost: 0.10, grupa: "other" },
  { id: "custom",   label: { pl: "Inny materiał", en: "Other material", de: "Anderes Material" }, cutRate: null, matCost: null, custom: true },
];

export const CUT_PATHS = [
  { id: "XS", label: { pl: "XS - do 50 cm", en: "XS - up to 50 cm", de: "XS - bis 50 cm" }, pathCm: 30, sheetCm2: 50 },
  { id: "S",  label: { pl: "S - 50–200 cm", en: "S - 50–200 cm", de: "S - 50–200 cm" }, pathCm: 120, sheetCm2: 200 },
  { id: "M",  label: { pl: "M - 200–500 cm", en: "M - 200–500 cm", de: "M - 200–500 cm" }, pathCm: 350, sheetCm2: 600 },
  { id: "L",  label: { pl: "L - 500–1500 cm", en: "L - 500–1500 cm", de: "L - 500–1500 cm" }, pathCm: 1000, sheetCm2: 1500 },
  { id: "XL", label: { pl: "XL - powyżej 1500 cm", en: "XL - over 1500 cm", de: "XL - über 1500 cm" }, pathCm: null, sheetCm2: null, custom: true },
];

export const CUT_COMPLEXITY = [
  { id: "simple",   label: { pl: "Proste kształty", en: "Simple shapes", de: "Einfache Formen" }, mul: 0.8 },
  { id: "moderate", label: { pl: "Średnie (krzywe)", en: "Moderate (curves)", de: "Mittel (Kurven)" }, mul: 1.0 },
  { id: "complex",  label: { pl: "Złożone (fine detail)", en: "Complex (fine detail)", de: "Komplex (Feindetail)" }, mul: 1.5 },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

export function calcEngrave({ matId, areaId, detailId, quantityId, extended, svgData }, lang) {
  const mat = ENGRAVE_MATERIALS.find(m => m.id === matId);
  const area = svgData
    ? { area: svgData.engravAreaCm2 }
    : ENGRAVE_AREAS.find(a => a.id === areaId);
  const detail = ENGRAVE_DETAIL.find(d => d.id === detailId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !area || !detail || !qTier) return null;
  if (!mat.rateMin || !area.area || !detail.mul || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  let timeMin = area.area * mat.rateMin * detail.mul;
  let extCostAdd = 0;
  if (extended) {
    timeMin *= CO2_CONFIG.EXTENDED_AREA_TIME_MUL;
    extCostAdd = CO2_CONFIG.EXTENDED_AREA_COST_ADD;
  }
  const timeH = timeMin / 60;
  const setupH = (extended ? 0.5 : 0.25) / qTier.qty;
  const handleH = 0.03;
  const totalTimeH = timeH + setupH + handleH;
  const laborCost = timeMin * CO2_CONFIG.LABOR_PLN_MIN;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const prepCost = area.area * mat.prepCost * 0.01;
  const baseCost = laborCost + energyCost + deprCost + prepCost + CO2_CONFIG.HANDLING_FEE + extCostAdd;
  const batchTimeH = (timeH + handleH) * qTier.qty + (extended ? 0.5 : 0.25);

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty, plDiscount);
  const fc = netCostFmt(lang, pricing.plFactor);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.engraveTime, value: `${timeMin.toFixed(1)} min` },
      { label: l.timeSetup, value: `${(totalTimeH * 60).toFixed(1)} min` },
      { label: l.workshop, value: fc(laborCost) },
      { label: l.prepMat, value: fc(prepCost) },
      { label: l.energy, value: fc(energyCost) },
      { label: l.depreciation, value: fc(deprCost) },
      ...(extended ? [{ label: l.extSurcharge, value: `+${fc(extCostAdd)}` }] : []),
      { divider: true },
      { label: l.estCost, value: fc(baseCost * (1 + CONFIG.BASE_MARGIN)), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

export function calcCut({ matId, pathId, complexId, quantityId, extended, svgData }, lang) {
  const mat = CUT_MATERIALS.find(m => m.id === matId);
  const path = svgData
    ? { pathCm: svgData.pathLengthCm, sheetCm2: svgData.engravAreaCm2 }
    : CUT_PATHS.find(p => p.id === pathId);
  const cmplx = CUT_COMPLEXITY.find(c => c.id === complexId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!mat || !path || !cmplx || !qTier) return null;
  if (!mat.cutRate || !path.pathCm || !cmplx.mul || !qTier.qty) return { type: "custom" };
  const l = LBL[lang] || LBL.en;

  let cutTimeSec = path.pathCm * mat.cutRate * cmplx.mul;
  let extCostAdd = 0;
  if (extended) {
    cutTimeSec *= CO2_CONFIG.EXTENDED_AREA_TIME_MUL;
    extCostAdd = CO2_CONFIG.EXTENDED_AREA_COST_ADD;
  }
  const cutTimeMin = cutTimeSec / 60;
  const cutTimeH = cutTimeMin / 60;
  const setupH = (extended ? 0.5 : 0.2) / qTier.qty;
  const handleH = 0.03;
  const totalTimeH = cutTimeH + setupH + handleH;
  const laborCost = cutTimeMin * CO2_CONFIG.LABOR_PLN_MIN;
  const energyCost = totalTimeH * CO2_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = totalTimeH * CO2_CONFIG.DEPRECIATION_PLN_H;
  const materialCost = path.sheetCm2 * mat.matCost * 1.15;
  const baseCost = laborCost + materialCost + energyCost + deprCost + CO2_CONFIG.HANDLING_FEE + extCostAdd;
  const batchTimeH = (cutTimeH + handleH) * qTier.qty + (extended ? 0.5 : 0.2);

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, qTier.discount, qTier.qty, plDiscount);
  const fc = netCostFmt(lang, pricing.plFactor);
  return {
    type: "calculated", ...pricing, qty: qTier.qty, discount: qTier.discount,
    totalTimeH: qTier.qty > 1 ? batchTimeH : null,
    breakdown: [
      { label: l.cutTime, value: `${cutTimeMin.toFixed(1)} min` },
      { label: l.workshop, value: fc(laborCost) },
      { label: l.materialCost, value: fc(materialCost) },
      { label: l.energy, value: fc(energyCost) },
      { label: l.depreciation, value: fc(deprCost) },
      ...(extended ? [{ label: l.extSurcharge, value: `+${fc(extCostAdd)}` }] : []),
      { divider: true },
      { label: l.estCost, value: fc(baseCost * (1 + CONFIG.BASE_MARGIN)), bold: true },
      ...(qTier.discount > 0 ? [{ label: l.discount, value: `-${qTier.discount * 100}%`, accent: true }] : []),
      ...(qTier.qty > 1 ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}

