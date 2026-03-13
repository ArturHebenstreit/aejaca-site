import { Link } from "react-router-dom";
import { ArrowRight, Printer, Zap, Box, Cpu, Layers, Wrench } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const techIcons = [Cpu, Printer, Zap, Layers, Box, Wrench];

export default function Studio() {
  const { t } = useLanguage();
  const s = t.studio;

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img src="/hero-studio.jpg" alt="AEJaCA sTuDiO" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
            <div className="text-blue-400 text-xs uppercase tracking-[0.25em] mb-3">{s.heroTag}</div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg tracking-tight">
              AEJaCA <span className="text-blue-400">{s.heroTitle}</span>
            </h1>
            <p className="text-neutral-300 text-base max-w-2xl">{s.heroDesc}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">{s.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{s.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{s.aboutP2}</p>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.techTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{s.techTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {s.technologies.map((tech, i) => {
              const Icon = techIcons[i];
              return (
                <div key={i} className="p-6 rounded-xl bg-neutral-950 border border-blue-900/20 hover:border-blue-600/40 transition-colors">
                  <Icon className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-sans text-lg font-semibold text-white mb-2">{tech.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{tech.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.servicesTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{s.servicesTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {s.services.map((service, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-neutral-900 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                <span className="text-neutral-300 text-sm">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-950/20 to-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.processTag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">{s.processTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {s.processSteps.map((step, i) => (
              <div key={i}>
                <div className="text-blue-400 font-mono text-2xl font-bold mb-2">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-sans text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-neutral-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Etsy */}
      <section className="py-16 px-4 text-center bg-neutral-900 border-t border-white/5">
        <h2 className="font-sans text-2xl font-bold text-white mb-3 tracking-tight">{s.shopTitle}</h2>
        <p className="text-neutral-400 mb-6">{s.shopText}</p>
        <a href="https://aejaca2studio.etsy.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 transition-colors">
          {s.shopBtn} <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">{s.ctaTitle}</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">{s.ctaText}</p>
        <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 border border-blue-400/60 text-blue-300 rounded-full hover:bg-blue-500 hover:text-white transition-all">
          {s.ctaBtn} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
