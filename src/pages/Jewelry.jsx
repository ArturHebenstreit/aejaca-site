import { Link } from "react-router-dom";
import { ArrowRight, Gem, Sparkles, Palette, Heart, Wand2, Crown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const icons = [Gem, Sparkles, Palette, Heart, Wand2, Crown];

export default function Jewelry() {
  const { t } = useLanguage();
  const j = t.jewelry;

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img src="/hero-jewelry.jpg" alt="AEJaCA Jewelry" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
            <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">{j.heroTag}</div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">{j.heroTitle}</h1>
            <p className="text-neutral-300 text-base max-w-2xl">{j.heroDesc}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 text-white">{j.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{j.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{j.aboutP2}</p>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.servicesTag}</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">{j.servicesTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {j.services.map((svc, i) => {
              const Icon = icons[i];
              return (
                <div key={i} className="p-6 rounded-xl bg-neutral-950 border border-emerald-900/20 hover:border-amber-700/40 transition-colors">
                  <Icon className="w-8 h-8 text-amber-400 mb-4" />
                  <h3 className="font-serif text-lg font-semibold text-white mb-2">{svc.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{svc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.processTag}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-12">{j.processTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {j.processSteps.map((step, i) => (
              <div key={i}>
                <div className="text-amber-400 font-mono text-2xl font-bold mb-2">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-serif text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-neutral-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-950/20 to-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-semibold text-white mb-10">{j.valuesTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {j.values.map((v, i) => (
              <div key={i}>
                <div className="text-amber-300 font-serif text-xl font-semibold mb-1">{v.word}</div>
                <p className="text-neutral-500 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Etsy */}
      <section className="py-16 px-4 text-center bg-neutral-900 border-t border-white/5">
        <h2 className="font-serif text-2xl font-semibold text-white mb-3">{j.shopTitle}</h2>
        <p className="text-neutral-400 mb-6">{j.shopText}</p>
        <a href="https://aejacashop.etsy.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-medium rounded-full hover:bg-amber-400 transition-colors">
          {j.shopBtn} <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-4">{j.ctaTitle}</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">{j.ctaText}</p>
        <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 border border-amber-400/60 text-amber-300 rounded-full hover:bg-amber-400 hover:text-black transition-all">
          {j.ctaBtn} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
