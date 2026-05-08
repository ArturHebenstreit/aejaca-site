// ============================================================
// RING BLANK CALCULATOR
// Calculates the blank length needed to make a ring/band.
// Formula: length_mm = PI * (d_inner + thickness) * width
// This is a free tool — no pricing, just geometry + mass estimate.
// ============================================================
import { useState, useMemo } from "react";
import { CalcCard, Chips, InquiryForm, t } from "./calcShared.jsx";

const METALS = {
  silver925: { density: 10.36, label: { pl: "Srebro 925", en: "Sterling Silver", de: "Sterlingsilber" } },
  gold14k:   { density: 13.07, label: { pl: "Złoto 14k",  en: "Gold 14k",        de: "Gold 14k" } },
  gold18k:   { density: 15.58, label: { pl: "Złoto 18k",  en: "Gold 18k",        de: "Gold 18k" } },
  copper:    { density: 8.96,  label: { pl: "Miedź",      en: "Copper",          de: "Kupfer" } },
  brass:     { density: 8.50,  label: { pl: "Mosiądz",    en: "Brass",           de: "Messing" } },
  titanium:  { density: 4.51,  label: { pl: "Tytan",      en: "Titanium",        de: "Titan" } },
};

const METAL_CHIPS = Object.entries(METALS).map(([id, v]) => ({ id, label: v.label }));

const LABELS = {
  pl: {
    title: "Kalkulator blanku obrączki",
    step1: "Materiał",
    step2: "Wymiary obrączki",
    step3: "Wynik",
    dInner: "Średnica wewnętrzna",
    thickness: "Grubość materiału",
    width: "Szerokość obrączki",
    blankLength: "Długość blanku",
    withAllowance: "Z naddatkiem +5%",
    approxMass: "Masa przybliżona",
    ctaLabel: "Zamów blank lub gotową obrączkę",
    mm: "mm",
    g: "g",
  },
  en: {
    title: "Ring Blank Calculator",
    step1: "Material",
    step2: "Ring Dimensions",
    step3: "Result",
    dInner: "Inner diameter",
    thickness: "Material thickness",
    width: "Ring width",
    blankLength: "Blank length",
    withAllowance: "With +5% allowance",
    approxMass: "Approximate mass",
    ctaLabel: "Order blank or custom ring",
    mm: "mm",
    g: "g",
  },
  de: {
    title: "Ring-Rohling-Rechner",
    step1: "Material",
    step2: "Ring-Abmessungen",
    step3: "Ergebnis",
    dInner: "Innendurchmesser",
    thickness: "Materialstärke",
    width: "Ringbreite",
    blankLength: "Rohling-Länge",
    withAllowance: "Mit +5% Zugabe",
    approxMass: "Ungefähre Masse",
    ctaLabel: "Rohling oder Ring bestellen",
    mm: "mm",
    g: "g",
  },
};

const TECH_LABEL = { pl: "Kalkulator blanku obrączki", en: "Ring Blank Calculator", de: "Ring-Rohling-Rechner" };

export default function RingBlankCalc({ lang = "pl" }) {
  const l = LABELS[lang] || LABELS.en;

  const [metalId, setMetalId] = useState("silver925");
  const [dInner, setDInner] = useState(17);
  const [thickness, setThickness] = useState(1.5);
  const [width, setWidth] = useState(6);

  const metal = METALS[metalId];

  const { length, lengthAllowance, mass } = useMemo(() => {
    const len = Math.PI * (dInner + thickness) * width;
    const lenAllowance = len * 1.05;
    // Cross-sectional area of a rectangle ≈ thickness × (mean circumference × thickness)
    // Volume ≈ length × thickness² ... more precisely: volume of the strip = len * thickness * thickness
    // Actually correct formula: volume = PI * thickness * (d_inner + thickness) * width * thickness
    // Simplified: volume_mm3 = length * thickness * thickness (rectangular cross section approx)
    // The given formula in task: PI * thickness * (d_inner + thickness) * width * 0.001 * density
    const m = Math.PI * thickness * (dInner + thickness) * width * 0.001 * metal.density;
    return { length: len, lengthAllowance: lenAllowance, mass: m };
  }, [dInner, thickness, width, metal]);

  const paramsSummary = [
    t(metal.label, lang),
    `d=${dInner}mm`,
    `t=${thickness}mm`,
    `w=${width}mm`,
    `L=${length.toFixed(1)}mm`,
  ].join(" | ");

  return (
    <div>
      {/* Step 1 — Material */}
      <CalcCard stepNum="①" label={l.step1}>
        <Chips options={METAL_CHIPS} value={metalId} onChange={setMetalId} lang={lang} />
      </CalcCard>

      {/* Step 2 — Dimensions */}
      <CalcCard stepNum="②" label={l.step2}>
        <div className="space-y-5">
          {/* Inner diameter */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-neutral-300">{l.dInner}</label>
              <span className="text-amber-400 font-semibold text-sm">{dInner} {l.mm}</span>
            </div>
            <input
              type="range"
              min={14}
              max={25}
              step={0.5}
              value={dInner}
              onChange={(e) => setDInner(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
              <span>14 {l.mm}</span>
              <span>25 {l.mm}</span>
            </div>
          </div>

          {/* Thickness */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-neutral-300">{l.thickness}</label>
              <span className="text-amber-400 font-semibold text-sm">{thickness} {l.mm}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
              <span>0.5 {l.mm}</span>
              <span>3.0 {l.mm}</span>
            </div>
          </div>

          {/* Width */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-neutral-300">{l.width}</label>
              <span className="text-amber-400 font-semibold text-sm">{width} {l.mm}</span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              step={0.5}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
              <span>3 {l.mm}</span>
              <span>15 {l.mm}</span>
            </div>
          </div>
        </div>
      </CalcCard>

      {/* Step 3 — Result */}
      <CalcCard stepNum="③" label={l.step3}>
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4" aria-live="polite" aria-atomic="true">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{l.blankLength}</span>
              <span className="text-amber-400 font-bold text-lg">{length.toFixed(1)} {l.mm}</span>
            </div>
            <div className="border-t border-amber-400/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{l.withAllowance}</span>
              <span className="text-amber-300 font-bold text-lg">{lengthAllowance.toFixed(1)} {l.mm}</span>
            </div>
            <div className="border-t border-amber-400/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{l.approxMass} ({t(metal.label, lang)})</span>
              <span className="text-amber-200 font-bold text-lg">{mass.toFixed(2)} {l.g}</span>
            </div>
          </div>
        </div>
      </CalcCard>

      {/* Inquiry form */}
      <InquiryForm
        lang={lang}
        techLabel={t(TECH_LABEL, lang)}
        paramsSummary={paramsSummary}
      />
    </div>
  );
}
