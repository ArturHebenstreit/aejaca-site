import { useState } from "react";
import { ArrowRight, ArrowLeft, Send, RotateCcw } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const STEPS = ["tech", "size", "material", "qty", "result"];

// Rough base prices (EUR) by tech+size — just for estimation display
const BASE_PRICES = {
  "3dprint":     { small: 15, medium: 35, large: 70, xl: 150 },
  fiber_laser:   { small: 10, medium: 25, large: 50, xl: 100 },
  co2_laser:     { small: 8,  medium: 20, large: 45, xl: 90 },
  resin:         { small: 20, medium: 45, large: 90, xl: 180 },
  nfc:           { small: 12, medium: 20, large: 30, xl: 50 },
  custom:        { small: 30, medium: 60, large: 120, xl: 250 },
};

const QTY_MULTIPLIERS = { "1": 1, "5": 0.9, "20": 0.8, "50": 0.7, "100": 0.6 };

function estimatePrice(tech, size, qty) {
  const base = BASE_PRICES[tech]?.[size] || 50;
  const mult = QTY_MULTIPLIERS[qty] || 1;
  const qtyNum = parseInt(qty) || 1;
  const unitLow = Math.round(base * mult * 0.8);
  const unitHigh = Math.round(base * mult * 1.4);
  return { unitLow, unitHigh, totalLow: unitLow * qtyNum, totalHigh: unitHigh * qtyNum };
}

export default function StudioCalculator() {
  const { t } = useLanguage();
  const calc = t.studio.calculator;
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState({ tech: null, size: null, material: null, qty: null });
  const sectionRef = useScrollReveal();

  function select(key, id) { setChoices({ ...choices, [key]: id }); }
  function next() { if (step < STEPS.length - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }
  function restart() { setStep(0); setChoices({ tech: null, size: null, material: null, qty: null }); }

  function sendInquiry() {
    const techLabel = calc.techs.find((t) => t.id === choices.tech)?.label || "";
    const sizeLabel = calc.sizes.find((s) => s.id === choices.size)?.label || "";
    const qtyLabel = calc.quantities.find((q) => q.id === choices.qty)?.label || "";
    const materialList = calc.materials[choices.tech] || [];
    const matLabel = materialList.find((m) => m.id === choices.material)?.label || "";
    const body = `${calc.stepTech}: ${techLabel}%0D%0A${calc.stepSize}: ${sizeLabel}%0D%0A${calc.stepMaterial}: ${matLabel}%0D%0A${calc.stepQty}: ${qtyLabel}`;
    window.location.href = `mailto:contact@aejaca.com?subject=${encodeURIComponent("[AEJaCA sTuDiO] Quote Request")}&body=${body}`;
  }

  const currentStep = STEPS[step];
  const canNext = choices[currentStep] !== null || currentStep === "result";
  const materialOptions = choices.tech ? (calc.materials[choices.tech] || []) : [];

  function OptionGrid({ items, field, cols = "grid-cols-2 sm:grid-cols-3" }) {
    return (
      <div className={`grid ${cols} gap-3`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => select(field, item.id)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              choices[field] === item.id
                ? "border-blue-400 bg-blue-400/10 text-white"
                : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-blue-400/40 hover:bg-blue-400/5"
            }`}
          >
            {item.emoji && <span className="text-2xl mb-2 block">{item.emoji}</span>}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? "w-8 bg-blue-400" : i < step ? "w-4 bg-blue-400/50" : "w-4 bg-white/10"
          }`} />
        ))}
      </div>
    );
  }

  const price = choices.tech && choices.size && choices.qty
    ? estimatePrice(choices.tech, choices.size, choices.qty)
    : null;

  return (
    <section className="py-20 px-4 bg-neutral-950">
      <div ref={sectionRef} className="reveal max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{calc.tag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">{calc.title}</h2>
          <p className="text-neutral-400">{calc.desc}</p>
        </div>

        <div className="rounded-2xl glass-blue p-6 sm:p-8">
          <StepIndicator />

          {currentStep === "tech" && (
            <div>
              <h3 className="text-white font-medium mb-4">{calc.stepTech}</h3>
              <OptionGrid items={calc.techs} field="tech" />
            </div>
          )}

          {currentStep === "size" && (
            <div>
              <h3 className="text-white font-medium mb-4">{calc.stepSize}</h3>
              <OptionGrid items={calc.sizes} field="size" cols="grid-cols-2" />
            </div>
          )}

          {currentStep === "material" && (
            <div>
              <h3 className="text-white font-medium mb-4">{calc.stepMaterial}</h3>
              <OptionGrid items={materialOptions} field="material" cols="grid-cols-2" />
            </div>
          )}

          {currentStep === "qty" && (
            <div>
              <h3 className="text-white font-medium mb-4">{calc.stepQty}</h3>
              <OptionGrid items={calc.quantities} field="qty" cols="grid-cols-1 sm:grid-cols-2" />
            </div>
          )}

          {currentStep === "result" && price && (
            <div className="text-center">
              <h3 className="text-white font-sans text-xl font-bold mb-6">{calc.resultTitle}</h3>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-neutral-400 text-sm">{calc.resultFrom}</span>
                <span className="text-blue-400 text-4xl font-bold font-mono">{price.totalLow}</span>
                <span className="text-neutral-400 text-sm">{calc.resultTo}</span>
                <span className="text-blue-400 text-4xl font-bold font-mono">{price.totalHigh}</span>
                <span className="text-neutral-400 text-lg">EUR</span>
              </div>
              <p className="text-neutral-500 text-xs mt-4 max-w-md mx-auto">{calc.resultNote}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={back} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> {calc.back}
              </button>
            ) : <div />}

            {currentStep === "result" ? (
              <div className="flex items-center gap-3">
                <button onClick={restart} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" /> {calc.restart}
                </button>
                <button onClick={sendInquiry} className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 transition-colors text-sm">
                  <Send className="w-4 h-4" /> {calc.sendInquiry}
                </button>
              </div>
            ) : (
              <button onClick={next} disabled={!canNext}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  canNext ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-white/5 text-neutral-600 cursor-not-allowed"
                }`}
              >
                {calc.next} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
