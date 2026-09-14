import { EU_RING_SIZES, getProductType, getRingInnerDiameter } from "./jewelryProductConfig.js";

export const BRUTTO_FACTOR = 1.15;

export function formatWeight(grams) {
  if (grams < 10) return grams.toFixed(2) + " g";
  return grams.toFixed(1) + " g";
}

function getFillFactor(productTypeId, params, weightId) {
  const pt = getProductType(productTypeId);
  if (!pt) return 1;
  // For ring/signet: weightId from the visual WEIGHTS step takes priority
  if (weightId && pt.fillFactors[weightId] != null) {
    return pt.fillFactors[weightId];
  }
  // For other types: use params.style (pendant, bracelet, earrings, brooch)
  const key = params.style || pt.defaultFill;
  return pt.fillFactors[key] ?? pt.fillFactors[pt.defaultFill];
}

function resolveRingInnerDiameter(params) {
  const ringSizeParam = params.ringSize;
  if (ringSizeParam && typeof ringSizeParam === "object") {
    return getRingInnerDiameter(ringSizeParam.system, ringSizeParam.value);
  }
  // legacy: plain EU size number
  return EU_RING_SIZES[Number(ringSizeParam)] ?? 17.2;
}

// OBRACZKA LICZY SIE TYM SAMYM WZOREM CO PIERSCIONEK, ale wlasnymi
// wspolczynnikami wypelnienia: jest wezsza i bardziej lita, wiec ma je
// w katalogu bryl osobno. Do 14 wrzesnia 2026 `calcWeight` nie znal jej wcale
// i oddawal zero gramow, a wywolujacy odczytywal zero jako "nie ma pomiaru"
// i cicho wracal do stalej katalogowej. Dwa pytania o rozmiar i szerokosc
// stalyby wiec na ekranie bez zadnego wplywu na cene.
function calcRingWeight(params, metalDensity, weightId, typId = "ring") {
  const innerDiameterMm = resolveRingInnerDiameter(params);
  const wallThickness = Number(params.wallThickness);
  const width = Number(params.width);
  const fillFactor = getFillFactor(typId, params, weightId);

  const r_out = innerDiameterMm / 2 + wallThickness;
  const r_in = innerDiameterMm / 2;
  const V_mm3 = Math.PI * (r_out * r_out - r_in * r_in) * width;
  const V_cm3 = V_mm3 / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "hollow-cylinder" };
}

function calcSignetWeight(params, metalDensity, weightId) {
  const innerDiameterMm = resolveRingInnerDiameter(params);
  const wallThickness = Number(params.wallThickness);
  const width = Number(params.width);
  const faceWidth = Number(params.faceWidth);
  const faceHeight = Number(params.faceHeight);
  const fillFactor = getFillFactor("signet", params, weightId);

  const r_out = innerDiameterMm / 2 + wallThickness;
  const r_in = innerDiameterMm / 2;
  const V_ring_mm3 = Math.PI * (r_out * r_out - r_in * r_in) * width;
  const V_face_mm3 = faceWidth * faceHeight * 2.0;
  const V_total_cm3 = (V_ring_mm3 + V_face_mm3) / 1000;
  const nettoG = V_total_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "signet-composite" };
}

function calcPendantWeight(params, metalDensity) {
  const height = Number(params.height);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const fillFactor = getFillFactor("pendant", params, null);

  const V_cm3 = (height * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

function calcBraceletWeight(params, metalDensity) {
  const length = Number(params.length);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const fillFactor = getFillFactor("bracelet", params, null);

  const V_cm3 = (length * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

function calcEarringWeight(params, metalDensity) {
  const height = Number(params.height);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const isPair = params.isPair === true || params.isPair === "true";
  const fillFactor = getFillFactor("earrings", params, null);

  const V_cm3 = (height * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor * (isPair ? 2 : 1);
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

function calcBroochWeight(params, metalDensity) {
  const height = Number(params.height);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const fillFactor = getFillFactor("brooch", params, null);

  const V_cm3 = (height * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

export function calcWeight(productTypeId, params, metalDensity, weightId = null) {
  switch (productTypeId) {
    case "ring":
      return calcRingWeight(params, metalDensity, weightId);
    case "wedding_ring":
      return calcRingWeight(params, metalDensity, weightId, "wedding_ring");
    case "signet":
      return calcSignetWeight(params, metalDensity, weightId);
    case "pendant":
      return calcPendantWeight(params, metalDensity);
    case "bracelet":
      return calcBraceletWeight(params, metalDensity);
    case "earrings":
      return calcEarringWeight(params, metalDensity);
    case "brooch":
      return calcBroochWeight(params, metalDensity);
    default:
      return { nettoG: 0, bruttoG: 0, method: "unknown" };
  }
}
