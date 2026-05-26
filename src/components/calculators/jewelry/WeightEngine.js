import { EU_RING_SIZES, getProductType } from "./productConfig.js";

export const BRUTTO_FACTOR = 1.15;

export function formatWeight(grams) {
  if (grams < 10) return grams.toFixed(2) + " g";
  return grams.toFixed(1) + " g";
}

function getFillFactor(productTypeId, params) {
  const pt = getProductType(productTypeId);
  if (!pt) return 1;
  const key = params.massiveness || params.style || pt.defaultFill;
  return pt.fillFactors[key] ?? pt.fillFactors[pt.defaultFill];
}

function calcRingWeight(params, metalDensity) {
  const innerDiameterMm = EU_RING_SIZES[Number(params.ringSize)] ?? EU_RING_SIZES[54];
  const wallThickness = Number(params.wallThickness);
  const width = Number(params.width);
  const fillFactor = getFillFactor("ring", params);

  const r_out = innerDiameterMm / 2 + wallThickness;
  const r_in = innerDiameterMm / 2;
  const V_mm3 = Math.PI * (r_out * r_out - r_in * r_in) * width;
  const V_cm3 = V_mm3 / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "hollow-cylinder" };
}

function calcSignetWeight(params, metalDensity) {
  const innerDiameterMm = EU_RING_SIZES[Number(params.ringSize)] ?? EU_RING_SIZES[54];
  const wallThickness = Number(params.wallThickness);
  const width = Number(params.width);
  const faceWidth = Number(params.faceWidth);
  const faceHeight = Number(params.faceHeight);
  const fillFactor = getFillFactor("signet", params);

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
  const fillFactor = getFillFactor("pendant", params);

  const V_cm3 = (height * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

function calcBraceletWeight(params, metalDensity) {
  const length = Number(params.length);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const fillFactor = getFillFactor("bracelet", params);

  const V_cm3 = (length * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

function calcEarringWeight(params, metalDensity) {
  const height = Number(params.height);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const isPair = params.isPair === true || params.isPair === "true";
  const fillFactor = getFillFactor("earrings", params);

  const V_cm3 = (height * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor * (isPair ? 2 : 1);
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

function calcBroochWeight(params, metalDensity) {
  const height = Number(params.height);
  const width = Number(params.width);
  const thickness = Number(params.thickness);
  const fillFactor = getFillFactor("brooch", params);

  const V_cm3 = (height * width * thickness) / 1000;
  const nettoG = V_cm3 * metalDensity * fillFactor;
  return { nettoG, bruttoG: nettoG * BRUTTO_FACTOR, method: "bounding-box" };
}

export function calcWeight(productTypeId, params, metalDensity) {
  switch (productTypeId) {
    case "ring":
      return calcRingWeight(params, metalDensity);
    case "signet":
      return calcSignetWeight(params, metalDensity);
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
