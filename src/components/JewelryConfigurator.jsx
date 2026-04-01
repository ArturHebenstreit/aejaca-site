import { useState } from "react";
import { ArrowRight, ArrowLeft, Send, RotateCcw } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const STEPS = ["type", "metal", "stone", "style", "summary"];

export default function JewelryConfigurator() {
  const { t } = useLanguage();
  const cfg = t.jewelry.configurator;
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState({ type: null, metal: null, stone: null, style: null });
  const sectionRef = useScrollReveal();

  function select(key, id) {
    setChoices({ ...choices, [key]: id });
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }
  function restart() {
    setStep(0);
    setChoices({ type: null, metal: null, stone: null, style: null });
  }

  function sendInquiry() {
    const typeLabel = cfg.types.find((t) => t.id === choices.type)?.label || "";
    const metalLabel = cfg.metals.find((m) => m.id === choices.metal)?.label || "";
    const stoneLabel = cfg.stones.find((s) => s.id === choices.stone)?.label || "";
    const styleLabel = cfg.styles.find((s) => s.id === choices.style)?.label || "";
    const body = `${cfg.summaryType}: ${typeLabel}%0D%0A${cfg.summaryMetal}: ${metalLabel}%0D%0A${cfg.summaryStone}: ${stoneLabel}%0D%0A${cfg.summaryStyle}: ${styleLabel}`;
    window.location.href = `mailto:contact@aejaca.com?subject=${encodeURIComponent("[AEJaCA] Jewelry Configurator Inquiry")}&body=${body}`;
  }

  const currentStep = STEPS[step];
  const canNext = choices[currentStep] !== null || currentStep === "summary";

  function OptionGrid({ items, field, cols = "grid-cols-2 sm:grid-cols-3" }) {
    return (
      <div className={`grid ${cols} gap-3`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => select(field, item.id)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              choices[field] === item.id
                ? "border-amber-400 bg-amber-400/10 text-white"
                : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-amber-400/40 hover:bg-amber-400/5"
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
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-amber-400" : i < step ? "w-4 bg-amber-400/50" : "w-4 bg-white/10"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="py-20 px-4 bg-neutral-950">
      <div ref={sectionRef} className="reveal max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{cfg.tag}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-3">{cfg.title}</h2>
          <p className="text-neutral-400">{cfg.desc}</p>
        </div>

        <div className="rounded-2xl glass-amber p-6 sm:p-8">
          <StepIndicator />

          {currentStep === "type" && (
            <div>
              <h3 className="text-white font-medium mb-4">{cfg.stepType}</h3>
              <OptionGrid items={cfg.types} field="type" />
            </div>
          )}

          {currentStep === "metal" && (
            <div>
              <h3 className="text-white font-medium mb-4">{cfg.stepMetal}</h3>
              <OptionGrid items={cfg.metals} field="metal" cols="grid-cols-2" />
            </div>
          )}

          {currentStep === "stone" && (
            <div>
              <h3 className="text-white font-medium mb-4">{cfg.stepStone}</h3>
              <OptionGrid items={cfg.stones} field="stone" cols="grid-cols-2 sm:grid-cols-4" />
            </div>
          )}

          {currentStep === "style" && (
            <div>
              <h3 className="text-white font-medium mb-4">{cfg.stepStyle}</h3>
              <OptionGrid items={cfg.styles} field="style" cols="grid-cols-2 sm:grid-cols-3" />
            </div>
          )}

          {currentStep === "summary" && (
            <div className="space-y-4">
              <h3 className="text-white font-serif text-xl font-semibold mb-4">{cfg.summaryTitle}</h3>
              {[
                [cfg.summaryType, cfg.types.find((t) => t.id === choices.type)?.label],
                [cfg.summaryMetal, cfg.metals.find((m) => m.id === choices.metal)?.label],
                [cfg.summaryStone, cfg.stones.find((s) => s.id === choices.stone)?.label],
                [cfg.summaryStyle, cfg.styles.find((s) => s.id === choices.style)?.label],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-neutral-400 text-sm">{label}</span>
                  <span className="text-white font-medium text-sm">{value || "—"}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={back} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> {cfg.back}
              </button>
            ) : <div />}

            {currentStep === "summary" ? (
              <div className="flex items-center gap-3">
                <button onClick={restart} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" /> {cfg.restart}
                </button>
                <button onClick={sendInquiry} className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-black font-medium rounded-full hover:bg-amber-300 transition-colors text-sm">
                  <Send className="w-4 h-4" /> {cfg.sendInquiry}
                </button>
              </div>
            ) : (
              <button
                onClick={next}
                disabled={!canNext}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  canNext
                    ? "bg-amber-400 text-black hover:bg-amber-300"
                    : "bg-white/5 text-neutral-600 cursor-not-allowed"
                }`}
              >
                {cfg.next} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
