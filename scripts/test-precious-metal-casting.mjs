import assert from "node:assert/strict";
import {
  calculate,
  fitsCastingFlask,
  maxCastingScaleForBBox,
  PRECIOUS_METAL_CASTING_BUILD,
} from "../src/pricing/preciousMetalCasting.js";
import { priceItem } from "../chat-api/orders.js";

assert.equal(PRECIOUS_METAL_CASTING_BUILD, "1.005");
assert.equal(fitsCastingFlask({ x: 2.0, y: 2.2, z: 3.0 }), true);
assert.equal(fitsCastingFlask({ x: 2.5, y: 2.2, z: 3.0 }), false);
assert.equal(fitsCastingFlask({ x: 2.5, y: 2.2, z: 3.0 }, 0.9), true);
assert.ok(Math.abs(maxCastingScaleForBBox({ x: 3.0, y: 2.0, z: 1.0 }) - (35 / 30)) < 1e-9);

const base = { metalId: "silver", finishId: "clean", qtyId: "1" };
assert.equal(calculate({ ...base, variantId: "ready_pattern", materialSourceId: "aejaca" }, "pl").type, "custom");
assert.equal(calculate({ ...base, variantId: "model_3d", materialSourceId: "client" }, "pl").type, "custom");

const priced = calculate({
  ...base,
  variantId: "model_3d",
  materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
}, "pl");
assert.equal(priced.type, "calculated");
assert.ok(priced.unitGrosze > 0);
assert.ok(Math.abs(priced.finalMassG - 4.144) < 0.001);
assert.ok(priced.requiredMassG > priced.finalMassG);

const startingPrice = calculate({
  metalId: "silver", finishId: "raw", qtyId: "1",
  variantId: "model_3d", materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.2, bbox: { x: 2.0, y: 1.5, z: 0.6 } },
}, "pl");
assert.ok(startingPrice.unitGrosze >= 20000 && startingPrice.unitGrosze <= 22000);

assert.throws(
  () => priceItem({
    calculator: "jewelry_casting",
    params: { ...base, variantId: "model_3d", materialSourceId: "aejaca" },
    lang: "en",
    geometry: { volumeCm3: 0.2, bbox: { x: 3.0, y: 3.0, z: 4.0 } },
  }),
  (error) => error.code === "too_large_for_casting"
    && error.message.startsWith("At this scale the model exceeds"),
);

console.log("OK: odlew z metali szlachetnych, skala, cena startowa, masa, rezerwa i limity kolby");
