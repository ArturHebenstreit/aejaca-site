// ============================================================
// PRICING CORE, shared between the browser and the order backend
// ============================================================
// Ten katalog jest JEDYNYM źródłem prawdy o cenach. Kalkulatory w
// przeglądarce pokazują wynik, ale kwotę do zapłaty liczy backend tym
// samym kodem. Pliki z src/pricing/ są kopiowane do chat-api/pricing/
// skryptem scripts/sync-pricing.mjs, dlatego nie wolno tu importować
// niczego z Reacta ani z katalogów spoza src/pricing i src/data.

export const CONFIG = {
  EUR_PLN_RATE: 4.28,
  TOLERANCE_LOW: 0.30,
  TOLERANCE_HIGH: 0.40,
  ENERGY_COST_PLN: 1.05,
  BASE_MARGIN: 0.40,
  PL_MARKET_DISCOUNT: 0.15,
};

export const QUANTITY_TIERS = [
  { id: "proto",  label: { pl: "1 szt. (prototyp)", en: "1 pc (prototype)", de: "1 Stk. (Prototyp)" }, qty: 1, discount: 0.00 },
  { id: "micro",  label: { pl: "2-10 szt.", en: "2-10 pcs", de: "2-10 Stk." }, qty: 6, discount: 0.05 },
  { id: "small",  label: { pl: "11-20 szt.", en: "11-20 pcs", de: "11-20 Stk." }, qty: 15, discount: 0.10 },
  { id: "medium", label: { pl: "21-50 szt.", en: "21-50 pcs", de: "21-50 Stk." }, qty: 35, discount: 0.15 },
  { id: "large",  label: { pl: "51-100 szt.", en: "51-100 pcs", de: "51-100 Stk." }, qty: null, discount: null, custom: true },
  { id: "custom", label: { pl: "100+ / niestandardowe", en: "100+ / custom", de: "100+ / individuell" }, qty: null, discount: null, custom: true },
];

/** Lookup helper for multilingual labels */
export function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

/** Format integer with non-breaking thin space as thousands separator */
export function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

/** Format a PLN cost amount in the right currency for the given language */
export function fmtCost(plnAmount, lang) {
  if (lang === "pl") return `${plnAmount.toFixed(2)} PLN`;
  return `${(plnAmount / CONFIG.EUR_PLN_RATE).toFixed(2)} EUR`;
}

/**
 * Cena jednostkowa przed rozrzutem tolerancji, w groszach.
 *
 * To jest liczba, którą realnie obciążamy klienta w sklepie. Widełki
 * -30%/+40% z applyPricing() opisują niepewność szacunku i mają sens w
 * kalkulatorze poglądowym, ale nie da się z nich wystawić płatności.
 * Liczymy w groszach, bo złotówki zmiennoprzecinkowe gubią grosze przy
 * mnożeniu przez nakład, a Autopay porównuje kwotę co do grosza.
 */
export function unitPriceGrosze(baseCost, margin, discountRate, localDiscount = 0) {
  const basePrice = baseCost * (1 + margin) * (1 - localDiscount);
  const discounted = basePrice * (1 - discountRate);
  return Math.max(1, Math.round(discounted * 100));
}

/** Apply margin, discount, tolerance -> price range PLN + EUR */
export function applyPricing(baseCost, margin, discountRate, qty, localDiscount = 0) {
  const basePrice = baseCost * (1 + margin) * (1 - localDiscount);
  const discounted = basePrice * (1 - discountRate);
  const perMin = Math.round(discounted * (1 - CONFIG.TOLERANCE_LOW));
  const perMax = Math.round(discounted * (1 + CONFIG.TOLERANCE_HIGH));
  return {
    perPcPLN: { min: Math.max(1, perMin), max: Math.max(1, perMax) },
    perPcEUR: { min: Math.max(1, Math.round(perMin / CONFIG.EUR_PLN_RATE)), max: Math.max(1, Math.round(perMax / CONFIG.EUR_PLN_RATE)) },
    totalPLN: { min: Math.max(1, perMin) * qty, max: Math.max(1, perMax) * qty },
    totalEUR: { min: Math.round((Math.max(1, perMin) * qty) / CONFIG.EUR_PLN_RATE), max: Math.round((Math.max(1, perMax) * qty) / CONFIG.EUR_PLN_RATE) },
  };
}

/** Format grosze as a PLN string with two decimals, the format Autopay expects */
export function formatAmountPLN(grosze) {
  return (grosze / 100).toFixed(2);
}
