import { Link } from "react-router-dom";
import { ArrowRight, Award, Shield, Cpu, Gem, Printer, Flame } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";

// All labels inline — trilingual, no i18n file needed for a single page
const LABELS = {
  pl: {
    tag: "O AEJaCA",
    title: "Rzemiosło i technologia od ponad 3 lat",
    description: "AEJaCA to marka łącząca rzemiosło jubilerskie z technologią. Ponad 3 lata doświadczenia, 150+ projektów, 5.0 na Google.",
    bioTitle: "Artur Hebenstreit",
    bioSubtitle: "Założyciel AEJaCA",
    bioText: "Pasja do pięknych przedmiotów z formą, detalem i charakterem. Połączenie technologii — AI, druku 3D, lasera CO₂ i fiber — z klasycznymi metodami rzemieślniczymi. Każdy projekt to rozmowa, nie katalog.",
    twoLinesTitle: "Dwie linie — jedna filozofia",
    jewelryLine: "AEJaCA Biżuteria",
    jewelryLineDesc: "Ręcznie robiona biżuteria ze srebra 925, złota 14k/18k i kamieni naturalnych. Pierścionki zaręczynowe, obrączki, wisiorki — każdy projekt indywidualny.",
    studioLine: "AEJaCA sTuDiO",
    studioLineDesc: "Druk 3D FDM/SLA, grawerowanie laserowe CO₂ i fiber, odlewy żywiczne. Prototypy, produkcja małoseryjna, personalizacja.",
    qualityTitle: "Jakość i zgodność",
    qualityItems: [
      "Weryfikacja przez Urząd Probierczy",
      "Marka zarejestrowana w Urzędzie Patentowym",
      "Współpraca z lokalnymi przedsiębiorcami",
      "Ponad 150 zrealizowanych projektów",
    ],
    equipTitle: "Sprzęt",
    equipItems: [
      { name: "Bambu Lab H2D", desc: "Drukarka 3D multi-materiałowa" },
      { name: "xTool P2 55W", desc: "Laser CO₂ do cięcia i grawerowania" },
      { name: "Raycus 30W", desc: "Laser fiber do znakowania metali" },
    ],
    ctaJewelry: "Zobacz biżuterię",
    ctaStudio: "Wyceń projekt online",
    workshopTitle: "Warsztat",
    breadcrumbHome: "Strona główna",
  },
  en: {
    tag: "About AEJaCA",
    title: "Craft and technology for over 3 years",
    description: "AEJaCA combines jewelry craft with technology. Over 3 years of experience, 150+ projects, 5.0 on Google.",
    bioTitle: "Artur Hebenstreit",
    bioSubtitle: "Founder of AEJaCA",
    bioText: "A passion for beautiful objects with form, detail, and character. Combining technology — AI, 3D printing, CO₂ and fiber laser — with classical craft methods. Every project is a conversation, not a catalog.",
    twoLinesTitle: "Two lines — one philosophy",
    jewelryLine: "AEJaCA Jewelry",
    jewelryLineDesc: "Handmade jewelry from 925 silver, 14k/18k gold, and natural gemstones. Engagement rings, wedding bands, pendants — every design is unique.",
    studioLine: "AEJaCA sTuDiO",
    studioLineDesc: "FDM/SLA 3D printing, CO₂ and fiber laser engraving, resin casting. Prototypes, small-batch production, personalization.",
    qualityTitle: "Quality & Compliance",
    qualityItems: [
      "Verified by the Polish Assay Office",
      "Trademark registered at the Patent Office",
      "Collaboration with local artisans",
      "Over 150 completed projects",
    ],
    equipTitle: "Equipment",
    equipItems: [
      { name: "Bambu Lab H2D", desc: "Multi-material 3D printer" },
      { name: "xTool P2 55W", desc: "CO₂ laser for cutting and engraving" },
      { name: "Raycus 30W", desc: "Fiber laser for metal marking" },
    ],
    ctaJewelry: "See the jewelry",
    ctaStudio: "Get an online quote",
    workshopTitle: "Workshop",
    breadcrumbHome: "Home",
  },
  de: {
    tag: "Über AEJaCA",
    title: "Handwerk und Technologie seit über 3 Jahren",
    description: "AEJaCA verbindet Schmuckhandwerk mit Technologie. Über 3 Jahre Erfahrung, 150+ Projekte, 5,0 auf Google.",
    bioTitle: "Artur Hebenstreit",
    bioSubtitle: "Gründer von AEJaCA",
    bioText: "Eine Leidenschaft für schöne Objekte mit Form, Detail und Charakter. Verbindung von Technologie — KI, 3D-Druck, CO₂- und Faserlaser — mit klassischen Handwerksmethoden. Jedes Projekt ist ein Gespräch, kein Katalog.",
    twoLinesTitle: "Zwei Linien — eine Philosophie",
    jewelryLine: "AEJaCA Schmuck",
    jewelryLineDesc: "Handgefertigter Schmuck aus 925 Silber, 14k/18k Gold und natürlichen Edelsteinen. Verlobungsringe, Eheringe, Anhänger — jedes Design ist einzigartig.",
    studioLine: "AEJaCA sTuDiO",
    studioLineDesc: "FDM/SLA 3D-Druck, CO₂- und Faserlasergravur, Harzguss. Prototypen, Kleinserienfertigung, Personalisierung.",
    qualityTitle: "Qualität & Konformität",
    qualityItems: [
      "Verifiziert durch das polnische Prüfamt",
      "Marke eingetragen beim Patentamt",
      "Zusammenarbeit mit lokalen Handwerkern",
      "Über 150 abgeschlossene Projekte",
    ],
    equipTitle: "Ausrüstung",
    equipItems: [
      { name: "Bambu Lab H2D", desc: "Multi-Material 3D-Drucker" },
      { name: "xTool P2 55W", desc: "CO₂-Laser zum Schneiden und Gravieren" },
      { name: "Raycus 30W", desc: "Faserlaser zur Metallmarkierung" },
    ],
    ctaJewelry: "Schmuck ansehen",
    ctaStudio: "Online-Angebot einholen",
    workshopTitle: "Werkstatt",
    breadcrumbHome: "Startseite",
  },
};

const equipIcons = [Printer, Flame, Cpu];

const GALLERY_PHOTOS = [
  {
    src: "/img/IMG_6808.JPEG",
    alt: {
      pl: "Mikroskop jubilerski w warsztacie AEJaCA",
      en: "Jeweler's microscope at AEJaCA workshop",
      de: "Schmuck-Mikroskop im AEJaCA-Werkstatt",
    },
  },
  {
    src: "/img/36E156EB-83B4-4663-9348-3D281BE1C95F.JPEG",
    alt: {
      pl: "Stół jubilerski z narzędziami AEJaCA",
      en: "AEJaCA jeweler's workbench with tools",
      de: "AEJaCA Schmuck-Werkbank mit Werkzeug",
    },
  },
  {
    src: "/img/IMG_5387.JPEG",
    alt: {
      pl: "Galwanizacja biżuterii w warsztacie AEJaCA",
      en: "Jewelry electroplating at AEJaCA",
      de: "Schmuck-Galvanisierung bei AEJaCA",
    },
  },
  {
    src: "/img/AF21E4BF-6C3A-463E-AA8B-E9EE397A9180.JPEG",
    alt: {
      pl: "Narzędzia i imadło grawerskie AEJaCA",
      en: "AEJaCA tools and engraving vise",
      de: "AEJaCA Werkzeuge und Gravierstock",
    },
  },
];

export default function About() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.en;

  // Scroll reveal refs
  const heroRef = useScrollReveal();
  const bioRef = useScrollReveal();
  const twoLinesRef = useScrollReveal();
  const qualityRef = useScrollReveal();
  const workshopRef = useScrollReveal();
  const equipRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  // Stagger refs
  const getLineCardRef = useStaggerReveal(120);
  const getQualityRef = useStaggerReveal(80);
  const getGalleryRef = useStaggerReveal(100);
  const getEquipRef = useStaggerReveal(110);

  const seo = getSEO("about", lang);
  const pageUrl = `${SITE.url}/about`;
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: L.tag, url: pageUrl },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="about"
        path="/about"
        image={`${SITE.url}/img/IMG_5145.JPEG`}
        schemas={schemas}
      />
      <div className="pt-16 bg-neutral-950">

        {/* ── Hero ── */}
        <section className="relative min-h-[50vh] flex items-end overflow-hidden">
          <img
            src="/img/IMG_5145.JPEG"
            alt="AEJaCA workshop — jewelry and digital fabrication studio"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/50 to-black/20" />
          <div ref={heroRef} className="reveal relative z-10 w-full max-w-4xl mx-auto px-4 pb-14 text-center">
            <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">{L.tag}</div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white drop-shadow-lg tracking-tight">
              {L.title}
            </h1>
          </div>
        </section>

        {/* ── Breadcrumb ── */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <Breadcrumb
            items={[
              { label: L.breadcrumbHome, href: "/" },
              { label: L.tag },
            ]}
          />
        </div>

        <div className="gradient-divider" />

        {/* ── Bio section ── */}
        <section className="py-20 px-4 bg-neutral-950">
          <div ref={bioRef} className="reveal max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            {/* Portrait */}
            <div className="flex justify-center md:justify-start">
              <img
                src="/img/DSC05225.JPEG"
                alt="Artur Hebenstreit — founder of AEJaCA"
                className="rounded-2xl aspect-[3/4] object-cover object-top w-full max-w-[220px] md:max-w-[260px] shadow-2xl shadow-black/50"
                loading="lazy"
                decoding="async"
              />
            </div>
            {/* Text */}
            <div>
              <p className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-2">{L.bioSubtitle}</p>
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                {L.bioTitle}
              </h2>
              <p className="text-neutral-300 text-lg leading-relaxed">{L.bioText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* ── Two Lines section ── */}
        <section className="py-20 px-4 bg-neutral-900/50">
          <div className="max-w-4xl mx-auto">
            <div ref={twoLinesRef} className="reveal text-center mb-12">
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
                {L.twoLinesTitle}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Jewelry card */}
              <div
                ref={getLineCardRef(0)}
                className="reveal-scale p-7 rounded-2xl glass-amber flex flex-col gap-4 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-300 group"
              >
                <Gem className="w-9 h-9 text-amber-400 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="font-sans text-xl font-semibold text-white">{L.jewelryLine}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed flex-1">{L.jewelryLineDesc}</p>
                <Link
                  to="/jewelry"
                  className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors"
                >
                  {L.ctaJewelry} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {/* Studio card */}
              <div
                ref={getLineCardRef(1)}
                className="reveal-scale p-7 rounded-2xl glass-blue flex flex-col gap-4 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300 group"
              >
                <Cpu className="w-9 h-9 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="font-sans text-xl font-semibold text-white">{L.studioLine}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed flex-1">{L.studioLineDesc}</p>
                <Link
                  to="/studio"
                  className="inline-flex items-center gap-1.5 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
                >
                  {L.ctaStudio} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* ── Quality section ── */}
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <div ref={qualityRef} className="reveal text-center mb-12">
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
                {L.qualityTitle}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {L.qualityItems.map((item, i) => (
                <div
                  key={i}
                  ref={getQualityRef(i)}
                  className="reveal-scale flex items-start gap-4 p-5 rounded-xl glass hover:border-amber-500/20 transition-all duration-300"
                >
                  {i % 2 === 0 ? (
                    <Shield className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Award className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span className="text-neutral-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* ── Workshop gallery ── */}
        <section className="py-20 px-4 bg-neutral-900/50">
          <div className="max-w-4xl mx-auto">
            <div ref={workshopRef} className="reveal text-center mb-12">
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
                {L.workshopTitle}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {GALLERY_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  ref={getGalleryRef(i)}
                  className="reveal-scale overflow-hidden rounded-xl aspect-square"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt[lang] || photo.alt.en}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* ── Equipment section ── */}
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <div ref={equipRef} className="reveal text-center mb-12">
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
                {L.equipTitle}
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {L.equipItems.map((item, i) => {
                const Icon = equipIcons[i];
                return (
                  <div
                    key={i}
                    ref={getEquipRef(i)}
                    className="reveal-scale p-6 rounded-xl glass-blue hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300 group text-center"
                  >
                    <Icon className="w-8 h-8 text-blue-400 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="font-sans text-base font-semibold text-white mb-2">{item.name}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* ── CTA section ── */}
        <section className="py-20 px-4 text-center bg-neutral-900/50">
          <div ref={ctaRef} className="reveal max-w-2xl mx-auto">
            <p className="text-neutral-400 mb-8">{L.description}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/jewelry"
                className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
              >
                {L.ctaJewelry} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/studio"
                className="inline-flex items-center gap-2 px-8 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300"
              >
                {L.ctaStudio} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
