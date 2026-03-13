import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="pt-16">
      {/* Split Hero */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
        {/* AEJaCA Jewelry Panel */}
        <Link
          to="/jewelry"
          className="group relative flex-1 min-h-[50vh] md:min-h-full overflow-hidden cursor-pointer"
        >
          <img
            src="/hero-jewelry.jpg"
            alt="AEJaCA Jewelry"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 transition-all duration-500" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-8 text-center">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              AEJaCA
            </h2>
            <p className="text-amber-300 text-lg md:text-xl font-light tracking-widest uppercase mb-4">
              Jewelry & Artistic Craftsmanship
            </p>
            <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-8">
              Handcrafted silver and gold jewelry with natural gemstones.
              Each piece carries soul, symbolism, and timeless elegance.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 border border-amber-400/60 text-amber-300 rounded-full text-sm tracking-wide group-hover:bg-amber-400 group-hover:text-black transition-all duration-300">
              Explore Jewelry <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Divider line — desktop only */}
        <div className="hidden md:block w-px bg-white/20" />

        {/* AEJaCA sTuDiO Panel */}
        <Link
          to="/studio"
          className="group relative flex-1 min-h-[50vh] md:min-h-full overflow-hidden cursor-pointer"
        >
          <img
            src="/hero-studio.jpg"
            alt="AEJaCA sTuDiO"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 transition-all duration-500" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-8 text-center">
            <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-lg tracking-tight">
              AEJaCA <span className="text-blue-400">sTuDiO</span>
            </h2>
            <p className="text-blue-300 text-lg md:text-xl font-light tracking-widest uppercase mb-4">
              Technology & Fabrication
            </p>
            <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-8">
              3D printing, laser engraving, CNC prototyping, and custom fabrication.
              From idea to physical product.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 border border-blue-400/60 text-blue-300 rounded-full text-sm tracking-wide group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              Explore Studio <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>

      {/* Brand Statement */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div className="max-w-3xl mx-auto">
          <img src="/brand-sign.png" alt="AEJaCA" className="w-20 h-20 mx-auto mb-8 invert opacity-60" />
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">
            Craft + Technology + Personalization
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed">
            AEJaCA is where traditional artistry meets modern innovation.
            Two complementary worlds — luxury handcrafted jewelry and advanced
            digital fabrication — united under one brand philosophy:
            creating unique, meaningful objects with precision and soul.
          </p>
        </div>
      </section>

      {/* Two Worlds Preview */}
      <section className="py-16 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Jewelry card */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-950/40 to-neutral-950 border border-emerald-900/30 p-8">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">
              Artistic & Luxury
            </div>
            <h3 className="font-serif text-2xl font-semibold mb-4">AEJaCA Jewelry</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              <li>Handcrafted rings, earrings, pendants & bracelets</li>
              <li>Natural gemstones & precious metals</li>
              <li>Custom & personalized jewelry projects</li>
              <li>Symbolic gifts & artistic objects</li>
              <li>Traditional craft meets 3D modeling</li>
            </ul>
            <Link
              to="/jewelry"
              className="inline-flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300 transition-colors"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Studio card */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-blue-950/40 to-neutral-950 border border-blue-900/30 p-8">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">
              Technical & Engineering
            </div>
            <h3 className="font-sans text-2xl font-semibold mb-4">AEJaCA sTuDiO</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              <li>3D design (CAD) & 3D printing</li>
              <li>Fiber laser & CO2 laser engraving/cutting</li>
              <li>Epoxy resin casting (UV & two-component)</li>
              <li>Rapid prototyping & small batch production</li>
              <li>NFC devices, smart tags & custom gadgets</li>
            </ul>
            <Link
              to="/studio"
              className="inline-flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4">
          Have an idea? Let&apos;s create it together.
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          Whether you need custom jewelry or a technical prototype — we&apos;re here to help.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors"
        >
          Get in Touch <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
