import { useState } from "react";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";

const CATEGORY_COLORS_AMBER = {
  rings: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  earrings: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  pendants: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  custom: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  symbolic: "bg-amber-600/10 text-amber-300 border-amber-600/20",
};

const CATEGORY_COLORS_BLUE = {
  "3dprint": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  laser: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  resin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  nfc: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  custom: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

/**
 * Reusable portfolio with category filters.
 * @param {Object} props
 * @param {Object} props.data - { tag, title, filterAll, filters, items }
 * @param {"amber"|"blue"} props.accent
 */
export default function Portfolio({ data, accent = "amber", id }) {
  const [filter, setFilter] = useState("all");
  const sectionRef = useScrollReveal();
  const getCardRef = useStaggerReveal(80);

  const isAmber = accent === "amber";
  const tagColor = isAmber ? "text-amber-400" : "text-blue-400";
  const activeBtn = isAmber ? "bg-amber-500 text-black" : "bg-blue-500 text-white";
  const hoverCard = isAmber ? "hover:border-amber-500/20" : "hover:border-blue-500/20";
  const hoverTitle = isAmber ? "group-hover:text-amber-300" : "group-hover:text-blue-300";
  const glassClass = isAmber ? "glass-amber" : "glass";
  const colorMap = isAmber ? CATEGORY_COLORS_AMBER : CATEGORY_COLORS_BLUE;

  const filtered = filter === "all" ? data.items : data.items.filter((item) => item.category === filter);

  return (
    <section id={id} className="py-20 px-4 bg-neutral-900/50">
      <div ref={sectionRef} className="reveal max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className={`${tagColor} text-xs uppercase tracking-[0.2em] mb-3`}>{data.tag}</div>
          <h2 className={`${isAmber ? "font-serif" : "font-sans"} text-3xl md:text-4xl font-semibold text-white ${!isAmber ? "tracking-tight font-bold" : ""}`}>
            {data.title}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
              filter === "all" ? activeBtn : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {data.filterAll}
          </button>
          {data.filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
                filter === f.id ? activeBtn : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => {
            const catColor = colorMap[item.category] || colorMap.custom || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
            return (
              <div
                key={item.title + filter}
                ref={getCardRef(i)}
                className={`reveal-scale p-5 rounded-xl ${glassClass} ${hoverCard} transition-all duration-300 group`}
              >
                <div className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium border mb-3 ${catColor}`}>
                  {data.filters.find((f) => f.id === item.category)?.label || item.category}
                </div>
                <h3 className={`text-white font-medium text-sm mb-2 ${hoverTitle} transition-colors`}>{item.title}</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
