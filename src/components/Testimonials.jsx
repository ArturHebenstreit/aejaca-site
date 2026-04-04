import { Quote } from "lucide-react";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";

/**
 * Reusable testimonials section.
 * @param {Object} props
 * @param {Object} props.data - { tag, title, items: [{ text, author, role }] }
 * @param {"amber"|"blue"} props.accent - Color accent
 */
export default function Testimonials({ data, accent = "amber", id }) {
  const sectionRef = useScrollReveal();
  const getCardRef = useStaggerReveal(120);

  const isAmber = accent === "amber";
  const tagColor = isAmber ? "text-amber-400" : "text-blue-400";
  const quoteColor = isAmber ? "text-amber-400/20" : "text-blue-400/20";
  const cardClass = isAmber ? "glass-amber" : "glass-blue";
  const authorColor = isAmber ? "text-amber-300" : "text-blue-300";

  return (
    <section id={id} className="py-20 px-4 bg-neutral-950">
      <div ref={sectionRef} className="reveal max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className={`${tagColor} text-xs uppercase tracking-[0.2em] mb-3`}>{data.tag}</div>
          <h2 className={`${isAmber ? "font-serif" : "font-sans"} text-3xl md:text-4xl font-semibold text-white ${!isAmber ? "tracking-tight" : ""}`}>
            {data.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {data.items.map((item, i) => (
            <div key={i} ref={getCardRef(i)} className={`reveal-scale rounded-xl ${cardClass} p-6 relative`}>
              <Quote className={`w-8 h-8 ${quoteColor} absolute top-4 right-4`} />
              <p className="text-neutral-300 text-sm leading-relaxed mb-6 relative z-10">"{item.text}"</p>
              <div>
                <div className={`${authorColor} text-sm font-semibold`}>{item.author}</div>
                <div className="text-neutral-500 text-xs">{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
