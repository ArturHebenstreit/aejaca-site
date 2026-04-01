import { Link } from "react-router-dom";
import { ArrowRight, Printer, Zap, Box, Cpu, Layers, Wrench } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import StudioCalculator from "../components/StudioCalculator.jsx";
import Portfolio from "../components/Portfolio.jsx";
import Testimonials from "../components/Testimonials.jsx";
import FAQ from "../components/FAQ.jsx";
import Tips from "../components/Tips.jsx";

const techIcons = [Cpu, Printer, Zap, Layers, Box, Wrench];

export default function Studio() {
  const { t } = useLanguage();
  const s = t.studio;

  const aboutRef = useScrollReveal();
  const techHeaderRef = useScrollReveal();
  const getTechRef = useStaggerReveal(100);
  const servicesRef = useScrollReveal();
  const getServiceRef = useStaggerReveal(80);
  const processRef = useScrollReveal();
  const getStepRef = useStaggerReveal(120);
  const etsyRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img src="/hero-studio.jpg" alt="AEJaCA sTuDiO — 3D printing, laser engraving, and custom fabrication workshop" className="absolute inset-0 w-full h-full object-cover" />
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
      <section id="about" className="py-20 px-4 bg-neutral-950">
        <div ref={aboutRef} className="reveal max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">{s.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{s.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{s.aboutP2}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Technologies */}
      <section id="technologies" className="py-20 px-4 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div ref={techHeaderRef} className="reveal text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.techTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{s.techTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {s.technologies.map((tech, i) => {
              const Icon = techIcons[i];
              return (
                <div key={i} ref={getTechRef(i)} className="reveal-scale p-6 rounded-xl glass-blue hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300 group">
                  <Icon className="w-8 h-8 text-blue-400 mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="font-sans text-lg font-semibold text-white mb-2">{tech.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{tech.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Studio Calculator */}
      <StudioCalculator />

      <div className="gradient-divider" />

      {/* Portfolio */}
      <Portfolio data={s.portfolio} accent="blue" id="portfolio" />

      <div className="gradient-divider" />

      {/* Services */}
      <section id="services" className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div ref={servicesRef} className="reveal text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.servicesTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{s.servicesTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {s.services.map((service, i) => (
              <div key={i} ref={getServiceRef(i)} className="reveal-scale flex items-start gap-3 p-4 rounded-lg glass hover:border-blue-500/20 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                <span className="text-neutral-300 text-sm">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-20 px-4 bg-gradient-to-b from-blue-950/20 to-neutral-950">
        <div ref={processRef} className="reveal max-w-4xl mx-auto text-center">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{s.processTag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">{s.processTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {s.processSteps.map((step, i) => (
              <div key={i} ref={getStepRef(i)} className="reveal-scale">
                <div className="text-blue-400 font-mono text-2xl font-bold mb-2">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-sans text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-neutral-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Testimonials */}
      <Testimonials data={s.testimonials} accent="blue" id="testimonials" />

      <div className="gradient-divider" />

      {/* FAQ */}
      <FAQ data={s.faq} accent="blue" id="faq" />

      <div className="gradient-divider" />

      {/* Tips & Advice */}
      <Tips data={s.tips} accent="blue" id="tips" />

      <div className="gradient-divider" />

      {/* Etsy */}
      <section id="shop" className="py-16 px-4 text-center bg-neutral-900/50">
        <div ref={etsyRef} className="reveal">
          <h2 className="font-sans text-2xl font-bold text-white mb-3 tracking-tight">{s.shopTitle}</h2>
          <p className="text-neutral-400 mb-6">{s.shopText}</p>
          <a href="https://aejaca2studio.etsy.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
            {s.shopBtn} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">{s.ctaTitle}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{s.ctaText}</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300">
            {s.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
