import { Link } from "react-router-dom";
import { ArrowRight, Gem, Sparkles, Palette, Heart, Wand2, Crown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import JewelryConfigurator from "../components/JewelryConfigurator.jsx";
import ProcessGallery from "../components/ProcessGallery.jsx";
import Testimonials from "../components/Testimonials.jsx";
import FAQ from "../components/FAQ.jsx";

const icons = [Gem, Sparkles, Palette, Heart, Wand2, Crown];

export default function Jewelry() {
  const { t } = useLanguage();
  const j = t.jewelry;

  const aboutRef = useScrollReveal();
  const servicesHeaderRef = useScrollReveal();
  const getServiceRef = useStaggerReveal(100);
  const processRef = useScrollReveal();
  const getStepRef = useStaggerReveal(120);
  const valuesRef = useScrollReveal();
  const etsyRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-neutral-950 py-10 px-4">
        <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px]">
          <img src="/hero-jewelry.jpg" alt="AEJaCA Jewelry — handcrafted silver rings, earrings, and gemstone pieces" className="absolute inset-0 w-full h-full object-cover" />
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
        <div ref={aboutRef} className="reveal max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 text-white">{j.aboutTitle}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">{j.aboutP1}</p>
          <p className="text-neutral-400 text-lg leading-relaxed">{j.aboutP2}</p>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Services */}
      <section className="py-20 px-4 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div ref={servicesHeaderRef} className="reveal text-center mb-14">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.servicesTag}</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">{j.servicesTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {j.services.map((svc, i) => {
              const Icon = icons[i];
              return (
                <div key={i} ref={getServiceRef(i)} className="reveal-scale p-6 rounded-xl glass-amber hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 group">
                  <Icon className="w-8 h-8 text-amber-400 mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="font-serif text-lg font-semibold text-white mb-2">{svc.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{svc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Jewelry Configurator */}
      <JewelryConfigurator />

      <div className="gradient-divider" />

      {/* Process Gallery */}
      <ProcessGallery />

      <div className="gradient-divider" />

      {/* Process Steps */}
      <section className="py-20 px-4 bg-neutral-950">
        <div ref={processRef} className="reveal max-w-4xl mx-auto text-center">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{j.processTag}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-12">{j.processTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {j.processSteps.map((step, i) => (
              <div key={i} ref={getStepRef(i)} className="reveal-scale">
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
        <div ref={valuesRef} className="reveal max-w-4xl mx-auto text-center">
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

      <div className="gradient-divider" />

      {/* Testimonials */}
      <Testimonials data={j.testimonials} accent="amber" />

      <div className="gradient-divider" />

      {/* FAQ */}
      <FAQ data={j.faq} accent="amber" />

      <div className="gradient-divider" />

      {/* Etsy */}
      <section className="py-16 px-4 text-center bg-neutral-900/50">
        <div ref={etsyRef} className="reveal">
          <h2 className="font-serif text-2xl font-semibold text-white mb-3">{j.shopTitle}</h2>
          <p className="text-neutral-400 mb-6">{j.shopText}</p>
          <a href="https://aejacashop.etsy.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-medium rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300">
            {j.shopBtn} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-4">{j.ctaTitle}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{j.ctaText}</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 border border-amber-400/30 bg-amber-400/5 backdrop-blur-md text-amber-300 rounded-full hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300">
            {j.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
