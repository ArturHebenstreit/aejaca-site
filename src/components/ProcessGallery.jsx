import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const STEP_COLORS = [
  "from-amber-900/30 to-amber-950/10",
  "from-amber-800/25 to-amber-950/10",
  "from-emerald-900/25 to-emerald-950/10",
  "from-amber-900/20 to-amber-950/10",
  "from-emerald-800/25 to-emerald-950/10",
  "from-amber-700/20 to-amber-950/10",
];

export default function ProcessGallery() {
  const { t } = useLanguage();
  const j = t.jewelry;
  const steps = j.processSteps;
  const [active, setActive] = useState(0);
  const sectionRef = useScrollReveal();

  function prev() { setActive((active - 1 + steps.length) % steps.length); }
  function next() { setActive((active + 1) % steps.length); }

  return (
    <section id="process" className="py-20 px-4 bg-neutral-900/50">
      <div ref={sectionRef} className="reveal max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.processTag}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">{j.processTitle}</h2>
        </div>

        {/* Step cards row */}
        <div className="hidden sm:grid grid-cols-6 gap-3 mb-8">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                i === active
                  ? "border-amber-400/50 bg-gradient-to-b " + STEP_COLORS[i] + " scale-105"
                  : "border-white/5 bg-white/[0.02] hover:border-amber-400/20"
              }`}
            >
              <div className={`text-xs font-mono font-bold mb-1 ${i === active ? "text-amber-400" : "text-neutral-400"}`}>
                {step.num}
              </div>
              <div className={`text-xs font-medium ${i === active ? "text-white" : "text-neutral-400"}`}>
                {step.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active step detail */}
        <div className={`rounded-2xl border border-amber-400/10 bg-gradient-to-b ${STEP_COLORS[active]} p-8 text-center transition-all duration-300`}>
          <div className="text-amber-400 font-mono text-4xl font-bold mb-3">
            {steps[active].num}
          </div>
          <h3 className="font-serif text-2xl font-semibold text-white mb-3">{steps[active].title}</h3>
          <p className="text-neutral-300 max-w-lg mx-auto mb-4">{steps[active].desc}</p>
          {steps[active].when && (
            <div className="inline-block px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-300 text-xs font-medium">
              {steps[active].when}
            </div>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center justify-center gap-4 mt-6 sm:hidden">
          <button onClick={prev} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-amber-400/40 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-neutral-400 text-sm font-mono">{active + 1} / {steps.length}</span>
          <button onClick={next} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-amber-400/40 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
