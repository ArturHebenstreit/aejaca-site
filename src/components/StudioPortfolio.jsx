import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";

const CATEGORY_COLORS = {
  "3dprint": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  laser: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  resin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  nfc: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  custom: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export default function StudioPortfolio() {
  const { t } = useLanguage();
  const p = t.studio.portfolio;
  const [filter, setFilter] = useState("all");
  const sectionRef = useScrollReveal();
  const getCardRef = useStaggerReveal(80);

  const filtered = filter === "all" ? p.items : p.items.filter((item) => item.category === filter);

  return (
    <section className="py-20 px-4 bg-neutral-900/50">
      <div ref={sectionRef} className="reveal max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{p.tag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{p.title}</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {p.filterAll}
          </button>
          {p.filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
                filter === f.id
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => {
            const colorClass = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.custom;
            return (
              <div
                key={item.title + filter}
                ref={getCardRef(i)}
                className="reveal-scale p-5 rounded-xl glass hover:border-blue-500/20 transition-all duration-300 group"
              >
                <div className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium border mb-3 ${colorClass}`}>
                  {p.filters.find((f) => f.id === item.category)?.label || item.category}
                </div>
                <h3 className="text-white font-medium text-sm mb-2 group-hover:text-blue-300 transition-colors">{item.title}</h3>
                <p className="text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
