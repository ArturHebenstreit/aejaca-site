import assert from "node:assert/strict";
import { calculate, fitsCastingFlask, PRECIOUS_METAL_CASTING_BUILD } from "../src/pricing/preciousMetalCasting.js";

assert.equal(PRECIOUS_METAL_CASTING_BUILD, "1.004");
assert.equal(fitsCastingFlask({ x: 2.0, y: 2.2, z: 3.0 }), true);
assert.equal(fitsCastingFlask({ x: 2.5, y: 2.2, z: 3.0 }), false);

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

console.log("OK: odlew z metali szlachetnych, warianty, masa, rezerwa i limity kolby");
