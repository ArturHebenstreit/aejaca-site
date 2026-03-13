import { Link } from "react-router-dom";
import { ArrowRight, Gem, Sparkles, Palette, Heart, Wand2, Crown } from "lucide-react";

const services = [
  { icon: Gem, title: "Handcrafted Jewelry", desc: "Rings, earrings, pendants and bracelets made with silver and gold, finished by hand with precision." },
  { icon: Sparkles, title: "Natural Gemstones", desc: "Carefully selected natural stones — emeralds, sapphires, amethysts, and more — set into unique designs." },
  { icon: Palette, title: "Custom Projects", desc: "From your vision to a finished piece. We design and create jewelry tailored to your story." },
  { icon: Heart, title: "Personalized Gifts", desc: "Meaningful, one-of-a-kind gifts — engraved, customized, and made to carry emotion." },
  { icon: Wand2, title: "3D Design & Prototyping", desc: "Combining traditional craftsmanship with modern 3D modeling to prototype and perfect each piece." },
  { icon: Crown, title: "Symbolic Objects", desc: "Artistic objects and symbolic creations that go beyond jewelry — timeless keepsakes and art pieces." },
];

export default function Jewelry() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src="/hero-jewelry.jpg"
          alt="AEJaCA Jewelry"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/50 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-4 text-center">
          <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">
            Artistic & Luxury
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            AEJaCA Jewelry
          </h1>
          <p className="text-neutral-300 text-lg max-w-2xl">
            Handcrafted jewelry with soul. Natural gemstones, precious metals,
            and artistic design — each piece is a unique story.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 text-white">
            Where Art Meets Craftsmanship
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">
            AEJaCA represents the artistic and luxury side of the brand. Every piece of jewelry
            is handcrafted with meticulous attention to detail, combining traditional silversmithing
            techniques with modern 3D design and prototyping technologies.
          </p>
          <p className="text-neutral-400 text-lg leading-relaxed">
            We believe that jewelry should carry meaning. Each creation is designed to evoke emotion,
            tell a story, and become a timeless companion. From concept sketches to 3D models to the
            final handcrafted piece — every step is guided by passion and precision.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">
              What We Create
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">
              Products & Services
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-xl bg-neutral-950 border border-emerald-900/20 hover:border-amber-700/40 transition-colors"
              >
                <Icon className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="font-serif text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">
            Our Approach
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-12">
            The Creative Process
          </h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Concept", desc: "Understanding your vision, symbolism, and desired aesthetic" },
              { step: "02", title: "Design", desc: "Hand sketches and 3D CAD modeling of the piece" },
              { step: "03", title: "Prototype", desc: "3D printed model for review and refinement" },
              { step: "04", title: "Handcraft", desc: "Final piece crafted in silver or gold with gemstones" },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div className="text-amber-400 font-mono text-2xl font-bold mb-2">{step}</div>
                <h3 className="font-serif text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-neutral-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-950/20 to-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-semibold text-white mb-10">
            What Defines AEJaCA
          </h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { word: "Uniqueness", desc: "No two pieces are the same" },
              { word: "Emotion", desc: "Jewelry that speaks to the heart" },
              { word: "Symbolism", desc: "Meaning woven into every detail" },
              { word: "Timelessness", desc: "Designs that transcend trends" },
            ].map(({ word, desc }) => (
              <div key={word}>
                <div className="text-amber-300 font-serif text-xl font-semibold mb-1">{word}</div>
                <p className="text-neutral-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Etsy Link */}
      <section className="py-16 px-4 text-center bg-neutral-900 border-t border-white/5">
        <h2 className="font-serif text-2xl font-semibold text-white mb-3">
          Shop Our Collection
        </h2>
        <p className="text-neutral-400 mb-6">
          Browse available pieces on our Etsy store.
        </p>
        <a
          href="https://aejacashop.etsy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-medium rounded-full hover:bg-amber-400 transition-colors"
        >
          Visit Etsy Store <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-4">
          Looking for something unique?
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          Tell us about your dream piece — we&apos;ll design and craft it just for you.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 border border-amber-400/60 text-amber-300 rounded-full hover:bg-amber-400 hover:text-black transition-all"
        >
          Start a Custom Project <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
