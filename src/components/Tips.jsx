import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

/**
 * Reusable Tips / Advice section with category tabs and expandable cards.
 * @param {Object} props
 * @param {Object} props.data - { tag, title, categories: [{ name, tips: [{ q, a }] }] }
 * @param {"amber"|"blue"} props.accent
 */
export default function Tips({ data, accent = "amber", id }) {
  const [activeCat, setActiveCat] = useState(0);
  const [openTip, setOpenTip] = useState(null);
  const sectionRef = useScrollReveal();

  const isAmber = accent === "amber";
  const tagColor = isAmber ? "text-amber-400" : "text-blue-400";
  const activeBg = isAmber ? "bg-amber-400 text-black" : "bg-blue-500 text-white";
  const inactiveBg = "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200";
  const borderActive = isAmber ? "border-amber-400/30" : "border-blue-400/30";
  const chevronColor = isAmber ? "text-amber-400" : "text-blue-400";
  const iconColor = isAmber ? "text-amber-400/60" : "text-blue-400/60";

  function toggleTip(i) {
    setOpenTip(openTip === i ? null : i);
  }

  function switchCategory(i) {
    setActiveCat(i);
    setOpenTip(null);
  }

  const tips = data.categories[activeCat]?.tips || [];

  return (
    <section id={id} className="py-20 px-4 bg-neutral-950">
      <div ref={sectionRef} className="reveal max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Lightbulb className={`w-4 h-4 ${tagColor}`} />
            <span className={`${tagColor} text-xs uppercase tracking-[0.2em]`}>{data.tag}</span>
          </div>
          <h2 className={`${isAmber ? "font-serif" : "font-sans"} text-3xl md:text-4xl font-semibold text-white ${!isAmber ? "tracking-tight" : ""}`}>
            {data.title}
          </h2>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {data.categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => switchCategory(i)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 ${
                i === activeCat ? activeBg + " border-transparent" : inactiveBg
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Category hero image */}
        {data.categories[activeCat]?.img && (
          <div className="mb-6 rounded-xl overflow-hidden border border-white/5">
            <img
              src={data.categories[activeCat].img}
              alt={data.categories[activeCat].name}
              loading="lazy"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Tips accordion */}
        <div className="space-y-3">
          {tips.map((tip, i) => {
            const isOpen = openTip === i;
            return (
              <div
                key={`${activeCat}-${i}`}
                className={`rounded-xl border transition-all duration-300 ${
                  isOpen ? borderActive + " bg-white/[0.03]" : "border-white/5 bg-white/[0.01]"
                }`}
              >
                <button
                  onClick={() => toggleTip(i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-3"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Lightbulb className={`w-4 h-4 shrink-0 ${isOpen ? chevronColor : iconColor}`} />
                    <span className="text-white text-sm font-medium">{tip.q}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isOpen ? `rotate-180 ${chevronColor}` : "text-neutral-400"
                  }`} />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 pb-5 pl-12 text-neutral-400 text-sm leading-relaxed">{tip.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
