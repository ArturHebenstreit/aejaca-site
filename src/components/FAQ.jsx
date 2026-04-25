import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

function renderWithLinks(text) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return part;
    return (
      <Link key={i} to={match[2]} className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2 transition-colors">
        {match[1]}
      </Link>
    );
  });
}

/**
 * Reusable FAQ accordion.
 * @param {Object} props
 * @param {Object} props.data - { tag, title, items: [{ q, a }] }
 * @param {"amber"|"blue"} props.accent - Color accent
 */
export default function FAQ({ data, accent = "amber", id }) {
  const [openIndex, setOpenIndex] = useState(null);
  const sectionRef = useScrollReveal();

  const isAmber = accent === "amber";
  const tagColor = isAmber ? "text-amber-400" : "text-blue-400";
  const borderActive = isAmber ? "border-amber-400/30" : "border-blue-400/30";
  const chevronColor = isAmber ? "text-amber-400" : "text-blue-400";

  function toggle(i) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section id={id} className="py-20 px-4 bg-neutral-900/50">
      <div ref={sectionRef} className="reveal max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className={`${tagColor} text-xs uppercase tracking-[0.2em] mb-3`}>{data.tag}</div>
          <h2 className={`${isAmber ? "font-serif" : "font-sans"} text-3xl md:text-4xl font-semibold text-white ${!isAmber ? "tracking-tight" : ""}`}>
            {data.title}
          </h2>
        </div>

        <div className="space-y-3">
          {data.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-300 ${
                  isOpen ? borderActive + " bg-white/[0.02]" : "border-white/5 bg-white/[0.01]"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-white text-sm font-medium pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isOpen ? `rotate-180 ${chevronColor}` : "text-neutral-400"
                  }`} />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 pb-5 text-neutral-400 text-sm leading-relaxed">{renderWithLinks(item.a)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
