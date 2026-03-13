import { Link } from "react-router-dom";
import { ArrowRight, Printer, Zap, Box, Cpu, Layers, Wrench } from "lucide-react";

const technologies = [
  { icon: Cpu, title: "3D Design (CAD)", desc: "Professional 3D modeling for product design, prototyping, and manufacturing-ready files." },
  { icon: Printer, title: "3D Printing", desc: "FDM & resin 3D printing for rapid prototyping, functional parts, and small batch production." },
  { icon: Zap, title: "Fiber Laser Engraving", desc: "High-precision galvo laser systems for marking metal, jewelry, tools, and technical components." },
  { icon: Layers, title: "CO2 Laser Cutting", desc: "Laser cutting and engraving on wood, acrylic, glass, leather, and plastics." },
  { icon: Box, title: "Epoxy Resin Casting", desc: "UV and two-component resin systems for decorative objects, encapsulation, and custom molds." },
  { icon: Wrench, title: "Custom Fabrication", desc: "NFC devices, smart tags, promotional products, and bespoke technical components." },
];

const services = [
  "3D modeling & CAD design services",
  "3D printing services (prototypes & production)",
  "Laser engraving on metal, wood, glass & plastics",
  "Laser cutting of various materials",
  "Custom objects & gadgets manufacturing",
  "NFC devices and smart tags",
  "Technical prototypes & functional parts",
  "Personalized promotional products",
  "Custom technical components & tools",
];

export default function Studio() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src="/hero-studio.jpg"
          alt="AEJaCA sTuDiO"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/50 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 px-4 text-center">
          <div className="text-blue-400 text-xs uppercase tracking-[0.25em] mb-3">
            Technology & Engineering
          </div>
          <h1 className="font-sans text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
            AEJaCA <span className="text-blue-400">sTuDiO</span>
          </h1>
          <p className="text-neutral-300 text-lg max-w-2xl">
            Advanced creative fabrication studio. 3D printing, laser engraving,
            prototyping, and custom manufacturing — from idea to physical product.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">
            Innovation Meets Precision
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">
            AEJaCA sTuDiO is the technical and engineering arm of the brand. We combine
            digital fabrication, rapid prototyping, and creative production to transform
            ideas into real, functional products.
          </p>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Whether you need a single prototype, a small production run, or a fully
            customized technical solution — our studio has the tools, knowledge, and
            experience to deliver with precision.
          </p>
        </div>
      </section>

      {/* Technologies Grid */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">
              Our Capabilities
            </div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
              Technologies
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {technologies.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-xl bg-neutral-950 border border-blue-900/20 hover:border-blue-600/40 transition-colors"
              >
                <Icon className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-sans text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">
              What We Offer
            </div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
              Services
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-start gap-3 p-4 rounded-lg bg-neutral-900 border border-white/5"
              >
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
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">
            How We Work
          </div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">
            From Idea to Product
          </h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Idea", desc: "Share your concept, sketch, or reference — we listen and advise" },
              { step: "02", title: "3D Design", desc: "Professional CAD modeling with iterations until you approve" },
              { step: "03", title: "Prototype", desc: "3D printed or laser-cut prototype for testing and validation" },
              { step: "04", title: "Production", desc: "Final product manufactured to exact specifications" },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div className="text-blue-400 font-mono text-2xl font-bold mb-2">{step}</div>
                <h3 className="font-sans text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-neutral-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Etsy Store */}
      <section className="py-16 px-4 text-center bg-neutral-900 border-t border-white/5">
        <h2 className="font-sans text-2xl font-bold text-white mb-3 tracking-tight">
          Browse Our Products
        </h2>
        <p className="text-neutral-400 mb-6">
          See ready-made products and custom options on our Etsy store.
        </p>
        <a
          href="https://aejaca2studio.etsy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 transition-colors"
        >
          Visit Etsy Studio Store <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
          Have a project in mind?
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          From prototypes to production — let&apos;s bring your idea to life.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 border border-blue-400/60 text-blue-300 rounded-full hover:bg-blue-500 hover:text-white transition-all"
        >
          Request a Quote <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
