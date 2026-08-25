import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculate,
  fitsCastingFlask,
  maxCastingScaleForBBox,
  PRECIOUS_METAL_CASTING_BUILD,
} from "../src/pricing/preciousMetalCasting.js";
import { priceItem } from "../chat-api/orders.js";
import { SUPPORTED_EXTENSIONS } from "../src/pricing/mesh.js";

assert.equal(PRECIOUS_METAL_CASTING_BUILD, "1.006");
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

// Rozpiska musi trzymac jedna walute w calosci. Przygotowanie wzorca i
// wykonczenie mialy koncowke "PLN" wpisana na sztywno, wiec klient czytajacy
// po angielsku widzial euro w kruszcu i zlotowki dwa wiersze nizej. Nic sie
// przy tym nie wywalalo, dlatego mierzymy to testem, a nie okiem.
for (const lang of ["en", "de"]) {
  const obcy = calculate({
    ...base,
    variantId: "model_3d",
    materialSourceId: "aejaca",
    stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
  }, lang);
  const waluty = new Set(obcy.breakdown.map((row) => String(row.value).replace(/[\d\s.,-]/g, "")).filter(Boolean));
  assert.deepEqual([...waluty], ["EUR"], `rozpiska odlewu w ${lang} miesza waluty: ${[...waluty].join(", ")}`);
}
const rodzima = calculate({
  ...base,
  variantId: "model_3d",
  materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
}, "pl");
assert.deepEqual(
  [...new Set(rodzima.breakdown.map((row) => String(row.value).replace(/[\d\s.,-]/g, "")).filter(Boolean))],
  ["PLN"],
);

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

assert.throws(
  () => priceItem({
    calculator: "jewelry_casting",
    params: { variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver" },
    lang: "en",
  }),
  (error) => error.code === "incomplete_params"
    && error.message === "Some required parameters are missing",
);

assert.deepEqual([...SUPPORTED_EXTENSIONS].sort(), ["3mf", "obj", "step", "stl", "stp"]);
const controls = readFileSync(new URL("../src/components/shop/ConfigControls.jsx", import.meta.url), "utf8");
assert.match(controls, /disabled=\{zaDuzy && purpose !== "casting"\}/);
assert.match(controls, /Dostosuj możliwości techniczne/);
assert.match(controls, /purpose === "casting" \? Math\.max\(gora, 1\) : gora/);
assert.match(controls, /onDrop=\{/);

console.log("OK: odlew z metali szlachetnych, skala, formaty, lokalizacja, cena, masa i limity kolby");
