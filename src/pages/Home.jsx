import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Home() {
  const { t } = useLanguage();
  const h = t.home;

  return (
    <div className="pt-16">
      {/* Split Hero */}
      <section className="relative min-h-[calc(75vh-4rem)] flex flex-col md:flex-row">
        {/* Jewelry Panel */}
        <Link to="/jewelry" className="group relative flex-1 min-h-[50vh] md:min-h-full overflow-hidden cursor-pointer">
          <img src="/hero-jewelry.jpg" alt="AEJaCA Jewelry" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 transition-all duration-500" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-8 text-center">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-lg">{h.jewelryTitle}</h2>
            <p className="text-amber-300 text-lg md:text-xl font-light tracking-widest uppercase mb-4">{h.jewelrySubtitle}</p>
            <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-8">{h.jewelryDesc}</p>
            <span className="inline-flex items-center gap-2 px-6 py-3 border border-amber-400/60 text-amber-300 rounded-full text-sm tracking-wide group-hover:bg-amber-400 group-hover:text-black transition-all duration-300">
              {h.jewelryBtn} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        <div className="hidden md:block w-px bg-white/20" />

        {/* Studio Panel */}
        <Link to="/studio" className="group relative flex-1 min-h-[50vh] md:min-h-full overflow-hidden cursor-pointer">
          <img src="/hero-studio.jpg" alt="AEJaCA sTuDiO" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 transition-all duration-500" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-8 text-center">
            <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-lg tracking-tight">
              AEJaCA <span className="text-blue-400">{h.studioTitle}</span>
            </h2>
            <p className="text-blue-300 text-lg md:text-xl font-light tracking-widest uppercase mb-4">{h.studioSubtitle}</p>
            <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-8">{h.studioDesc}</p>
            <span className="inline-flex items-center gap-2 px-6 py-3 border border-blue-400/60 text-blue-300 rounded-full text-sm tracking-wide group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              {h.studioBtn} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>

      {/* Brand Statement */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div className="max-w-3xl mx-auto">
          <img src="/brand-sign.png" alt="AEJaCA" className="w-36 h-36 mx-auto mb-8 invert opacity-60" />
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">{h.brandHeading}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">{h.brandText}</p>
        </div>
      </section>

      {/* Two Worlds */}
      <section className="py-16 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-gradient-to-b from-emerald-950/40 to-neutral-950 border border-emerald-900/30 p-8">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{h.artisticLuxury}</div>
            <h3 className="font-serif text-2xl font-semibold mb-4">{h.jewelryCardTitle}</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              {h.jewelryCardItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <Link to="/jewelry" className="inline-flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300 transition-colors">
              {h.learnMore} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-blue-950/40 to-neutral-950 border border-blue-900/30 p-8">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{h.technicalEngineering}</div>
            <h3 className="font-sans text-2xl font-semibold mb-4">{h.studioCardTitle}</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              {h.studioCardItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <Link to="/studio" className="inline-flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300 transition-colors">
              {h.learnMore} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4">{h.ctaHeading}</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">{h.ctaText}</p>
        <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors">
          {h.ctaBtn} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
