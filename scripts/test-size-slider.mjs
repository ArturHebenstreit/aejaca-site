// ============================================================
// TEST LOGIKI SUWAKA WIELKOSCI (bez React)
// ============================================================
// Sprawdza wylacznie funkcje wyeksportowane z SizeSlider.jsx:
// categoryForCm, posToCm, cmToPos, RANGE_STEPS.
//
//   node scripts/test-size-slider.mjs

// SizeSlider.jsx zawiera JSX, ktorego plain node nie sparsuje. Przepuszczamy
// je przez esbuild (jest juz w node_modules jako zaleznosc Vite) i ladujemy
// jako zwykly ESM z pliku tymczasowego wewnatrz repo, zeby import "react"
// znalazl node_modules tak samo jak w normalnej budowie. Plik znika w finally.
import esbuild from "esbuild";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(HERE, "../src/components/calculators/SizeSlider.jsx");
const TMP = path.resolve(HERE, ".size-slider-test-tmp.mjs");

const { code } = esbuild.transformSync(readFileSync(SOURCE, "utf8"), {
  loader: "jsx",
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "react",
});
writeFileSync(TMP, code);

let categoryForCm, posToCm, cmToPos, RANGE_STEPS;
try {
  ({ categoryForCm, posToCm, cmToPos, RANGE_STEPS } = await import(`file://${TMP}?t=${Date.now()}`));
} finally {
  rmSync(TMP, { force: true });
}

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  OK  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? `  (${detail})` : ""}`);
  }
}

console.log("categoryForCm, granice kategorii:");
check("2.99 -> coin", categoryForCm(2.99) === "coin");
check("3 -> coin", categoryForCm(3) === "coin");
check("3.01 -> palm", categoryForCm(3.01) === "palm");
check("10 -> palm", categoryForCm(10) === "palm");
check("10.01 -> book", categoryForCm(10.01) === "book");
check("25 -> book", categoryForCm(25) === "book");
check("25.01 -> box", categoryForCm(25.01) === "box");
check("40 -> box", categoryForCm(40) === "box");
check("41 -> bigger", categoryForCm(41) === "bigger");

console.log("\nposToCm / cmToPos, skrajne pozycje:");
const minCm = 1;
const maxCm = 100;
check("posToCm(0) === minCm", Math.abs(posToCm(0, minCm, maxCm) - minCm) < 1e-9, posToCm(0, minCm, maxCm));
check(
  "posToCm(RANGE_STEPS) === maxCm",
  Math.abs(posToCm(RANGE_STEPS, minCm, maxCm) - maxCm) < 1e-9,
  posToCm(RANGE_STEPS, minCm, maxCm),
);
check("cmToPos(minCm) === 0", Math.abs(cmToPos(minCm, minCm, maxCm) - 0) < 1e-9, cmToPos(minCm, minCm, maxCm));
check(
  "cmToPos(maxCm) === RANGE_STEPS",
  Math.abs(cmToPos(maxCm, minCm, maxCm) - RANGE_STEPS) < 1e-9,
  cmToPos(maxCm, minCm, maxCm),
);

console.log("\nOdwracalnosc pos -> cm -> pos, na calym zakresie:");
let reversible = true;
let worstDelta = 0;
for (let pos = 0; pos <= RANGE_STEPS; pos += 1) {
  const cm = posToCm(pos, minCm, maxCm);
  const backPos = cmToPos(cm, minCm, maxCm);
  const delta = Math.abs(backPos - pos);
  worstDelta = Math.max(worstDelta, delta);
  if (delta > 0.01) reversible = false;
}
check("pos -> cm -> pos wraca z dokladnoscia do zaokraglenia", reversible, `najwieksza roznica: ${worstDelta}`);

console.log("\nMonotonicznosc odwzorowania pos -> cm:");
let monotonic = true;
let prevCm = -Infinity;
for (let pos = 0; pos <= RANGE_STEPS; pos += 1) {
  const cm = posToCm(pos, minCm, maxCm);
  if (cm < prevCm) monotonic = false;
  prevCm = cm;
}
check("wieksza pozycja to zawsze wiekszy lub rowny wymiar", monotonic);

console.log("\nSkrajne pozycje na innym zakresie (minCm=2, maxCm=50):");
check("posToCm(0, 2, 50) === 2", Math.abs(posToCm(0, 2, 50) - 2) < 1e-9);
check("posToCm(RANGE_STEPS, 2, 50) === 50", Math.abs(posToCm(RANGE_STEPS, 2, 50) - 50) < 1e-9);

if (failures > 0) {
  console.error(`\n${failures} test(y) nie przeszly.`);
  process.exit(1);
}
console.log("\nWszystkie testy przeszly.");
