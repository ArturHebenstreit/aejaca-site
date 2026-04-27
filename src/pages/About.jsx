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
    title: "Rzemiosło i technologia od 2023 roku",
    description: "AEJaCA to marka łącząca rzemiosło jubilerskie z technologią. Doświadczenie od 2023 roku, 150+ projektów, 5.0 na Google.",
    bioTitle: "Artur Hebenstreit",
    bioSubtitle: "Założyciel AEJaCA",
    bioText: "Wizjoner, twórca i rzemieślnik. Fascynacja biżuterią i kamieniami szlachetnymi towarzyszyła mu od najmłodszych lat — z czasem przerodziła się w głęboką pasję, która stała się sensem pracy twórczej. To, co tworzy, nie jest produktem — to manifestacja wizji, w której technologia spotyka się z duszą rzemiosła. AI, druk 3D, laser CO₂, laser fiber — to narzędzia w rękach kogoś, kto wie, dlaczego tworzy. Efekty mówią same za siebie.",
    philosophyTitle: "Filozofia marki",
    philosophyText: "AEJaCA nie jest marką dla każdego. To marka premium, stworzona dla wymagających, wyjątkowych klientów, którzy poszukują tego, czego nie znajdą w żadnej galerii handlowej. Dla tych, którzy cenią unikatowość, personalizację i niepowtarzalność — którzy pragną przedmiotów uduchowionych, z historią, nawet z nutą ezoteryki. Nie każdy zrozumie tę filozofię — i tak ma być. AEJaCA istnieje dla wybranych. Dla tych, którzy wiedzą, że prawdziwy luksus nie jest seryjny.",
    policyTitle: "Informacje",
    policyLinks: [
      { label: "Gwarancja", to: "/warranty/" },
      { label: "Polityka zwrotów", to: "/returns/" },
      { label: "Wysyłka", to: "/shipping/" },
      { label: "Polityka prywatności", to: "/privacy/" },
    ],
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
    ctaStudio: "Wyceń projekt w sTuDiO",
    workshopTitle: "Warsztat",
    breadcrumbHome: "Strona główna",
  },
  en: {
    tag: "About AEJaCA",
    title: "Craft and technology since 2023",
    description: "AEJaCA combines jewelry craft with technology. Experience since 2023, 150+ projects, 5.0 on Google.",
    bioTitle: "Artur Hebenstreit",
    bioSubtitle: "Founder of AEJaCA",
    bioText: "Visionary, creator, and craftsman. A fascination with jewelry and gemstones has accompanied him since his earliest years — growing into a deep passion that became the driving force of his creative work. What he creates is not a product — it's a manifestation of vision where technology meets the soul of craftsmanship. AI, 3D printing, CO₂ laser, fiber laser — these are tools in the hands of someone who knows why he creates. The results speak for themselves.",
    philosophyTitle: "Brand Philosophy",
    philosophyText: "AEJaCA is not a brand for everyone. It is a premium brand, created for discerning, exceptional clients who seek what no shopping mall can offer. For those who value uniqueness, personalization, and originality — who desire objects with soul, with story, even with a touch of the esoteric. Not everyone will understand this philosophy — and that is by design. AEJaCA exists for the chosen few. For those who know that true luxury is never mass-produced.",
    policyTitle: "Information",
    policyLinks: [
      { label: "Warranty", to: "/warranty/" },
      { label: "Returns Policy", to: "/returns/" },
      { label: "Shipping", to: "/shipping/" },
      { label: "Privacy Policy", to: "/privacy/" },
    ],
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
    ctaStudio: "Quote a sTuDiO project",
    workshopTitle: "Workshop",
    breadcrumbHome: "Home",
  },
  de: {
    tag: "Über AEJaCA",
    title: "Handwerk und Technologie seit 2023",
    description: "AEJaCA verbindet Schmuckhandwerk mit Technologie. Erfahrung seit 2023, 150+ Projekte, 5,0 auf Google.",
    bioTitle: "Artur Hebenstreit",
    bioSubtitle: "Gründer von AEJaCA",
    bioText: "Visionär, Schöpfer und Handwerker. Eine Faszination für Schmuck und Edelsteine begleitet ihn seit frühester Kindheit — sie wurde zu einer tiefen Leidenschaft und zur treibenden Kraft seines kreativen Schaffens. Was er erschafft, ist kein Produkt — es ist die Manifestation einer Vision, in der Technologie auf die Seele des Handwerks trifft. KI, 3D-Druck, CO₂-Laser, Faserlaser — das sind Werkzeuge in den Händen eines Menschen, der weiß, warum er schafft. Die Ergebnisse sprechen für sich.",
    philosophyTitle: "Markenphilosophie",
    philosophyText: "AEJaCA ist keine Marke für jedermann. Es ist eine Premium-Marke, geschaffen für anspruchsvolle, außergewöhnliche Kunden, die suchen, was kein Kaufhaus bieten kann. Für jene, die Einzigartigkeit, Personalisierung und Originalität schätzen — die nach Objekten mit Seele verlangen, mit Geschichte, vielleicht sogar mit einem Hauch von Esoterik. Nicht jeder wird diese Philosophie verstehen — und genau so soll es sein. AEJaCA existiert für die Auserwählten. Für jene, die wissen, dass wahrer Luxus nie in Serie geht.",
    policyTitle: "Informationen",
    policyLinks: [
      { label: "Garantie", to: "/warranty/" },
      { label: "Rückgaberecht", to: "/returns/" },
      { label: "Versand", to: "/shipping/" },
      { label: "Datenschutz", to: "/privacy/" },
    ],
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
    ctaStudio: "sTuDiO-Projekt kalkulieren",
    workshopTitle: "Werkstatt",
    breadcrumbHome: "Startseite",
  },
};

const equipIcons = [Printer, Flame, Cpu];

const GALLERY_PHOTOS = [
  {
    src: "/img/IMG_6808.webp",
    alt: {
      pl: "Mikroskop jubilerski w warsztacie AEJaCA",
      en: "Jeweler's microscope at AEJaCA workshop",
      de: "Schmuck-Mikroskop im AEJaCA-Werkstatt",
    },
  },
  {
    src: "/img/IMG_4610.webp",
    alt: {
      pl: "Laser CO₂ xTool P2 w warsztacie AEJaCA",
      en: "xTool P2 CO₂ laser at AEJaCA workshop",
      de: "xTool P2 CO₂-Laser in der AEJaCA-Werkstatt",
    },
  },
  {
    src: "/img/anki.webp",
    alt: {
      pl: "Narzędzia jubilerskie — anki i punce w warsztacie AEJaCA",
      en: "Jewelry tools — dapping punches and block at AEJaCA workshop",
      de: "Schmuckwerkzeuge — Punzen und Ankblock in der AEJaCA-Werkstatt",
    },
  },
  {
    src: "/img/36E156EB-83B4-4663-9348-3D281BE1C95F.webp",
    alt: {
      pl: "Stół jubilerski z narzędziami AEJaCA",
      en: "AEJaCA jeweler's workbench with tools",
      de: "AEJaCA Schmuck-Werkbank mit Werkzeug",
    },
  },
  {
    src: "/img/CieciePila.webp",
    alt: {
      pl: "Cięcie piłką jubilerską w warsztacie AEJaCA",
      en: "Jeweler's saw cutting at AEJaCA workshop",
      de: "Sägearbeit in der AEJaCA-Schmuckwerkstatt",
    },
  },
  {
    src: "/img/IMG_5014.webp",
    alt: {
      pl: "Myjka ultradźwiękowa w warsztacie AEJaCA",
      en: "Ultrasonic cleaner at AEJaCA workshop",
      de: "Ultraschallreiniger in der AEJaCA-Werkstatt",
    },
  },
  {
    src: "/img/6FC3C1BC-35BF-4085-AD4F-577ADA98FCAC.webp",
    alt: {
      pl: "Walcarka jubilerska AEJaCA",
      en: "AEJaCA jewelry rolling mill",
      de: "AEJaCA Schmuck-Walzwerk",
    },
  },
  {
    src: "/img/IMG_5387.webp",
    alt: {
      pl: "Galwanizacja biżuterii w warsztacie AEJaCA",
      en: "Jewelry electroplating at AEJaCA",
      de: "Schmuck-Galvanisierung bei AEJaCA",
    },
  },
  {
    src: "/img/AF21E4BF-6C3A-463E-AA8B-E9EE397A9180.webp",
    alt: {
      pl: "Narzędzia i imadło grawerskie AEJaCA",
      en: "AEJaCA tools and engraving vise",
      de: "AEJaCA Werkzeuge und Gravierstock",
    },
  },
  {
    src: "/img/IMG_7892.webp",
    alt: {
      pl: "Stanowisko fotografii produktowej AEJaCA",
      en: "AEJaCA product photography setup",
      de: "AEJaCA Produktfotografie-Setup",
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
  const philosophyRef = useScrollReveal();
  const policyRef = useScrollReveal();

  // Stagger refs
  const getLineCardRef = useStaggerReveal(120);
  const getQualityRef = useStaggerReveal(80);
  const getGalleryRef = useStaggerReveal(100);
  const getEquipRef = useStaggerReveal(110);

  const seo = getSEO("about", lang);
  const pageUrl = `${SITE.url}/about/`;
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
            src="/img/IMG_5145.webp"
            alt="AEJaCA workshop — jewelry and digital fabrication studio"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1200"
            height="900"
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
            <div className="flex flex-col gap-3 items-center md:items-start">
              <img
                src="/img/DSC05225.webp"
                alt="Artur Hebenstreit — founder of AEJaCA"
                className="rounded-2xl aspect-[3/4] object-cover object-top w-full max-w-[220px] md:max-w-[260px] shadow-2xl shadow-black/50"
                loading="lazy"
                decoding="async"
                width="1200"
                height="675"
              />
              <div className="flex gap-3">
                <img
                  src="/img/founder-workshop-1.webp"
                  alt="Artur Hebenstreit at the jeweler's workbench"
                  className="rounded-xl aspect-[3/4] object-cover w-[105px] md:w-[124px] shadow-xl shadow-black/40"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="800"
                />
                <img
                  src="/img/founder-workshop-2.webp"
                  alt="Artur Hebenstreit crafting jewelry"
                  className="rounded-xl aspect-[3/4] object-cover w-[105px] md:w-[124px] shadow-xl shadow-black/40"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="800"
                />
              </div>
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

        {/* ── Brand Philosophy ── */}
        <section className="py-20 px-4 bg-neutral-900/50">
          <div ref={philosophyRef} className="reveal max-w-3xl mx-auto text-center">
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight mb-6">
              {L.philosophyTitle}
            </h2>
            <p className="text-neutral-300 text-lg leading-relaxed italic">
              {L.philosophyText}
            </p>
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
                  to="/jewelry/"
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
                  to="/studio/#calculator"
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
                    width="1200"
                    height="1200"
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

        {/* ── Policy links ── */}
        <section className="py-16 px-4 bg-neutral-900/50">
          <div ref={policyRef} className="reveal max-w-2xl mx-auto text-center">
            <h2 className="font-sans text-2xl font-bold text-white tracking-tight mb-8">
              {L.policyTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {L.policyLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="p-4 rounded-xl glass hover:border-amber-500/20 transition-all duration-300 text-neutral-300 text-sm hover:text-amber-400"
                >
                  {link.label}
                </Link>
              ))}
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
                to="/jewelry/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
              >
                {L.ctaJewelry} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/studio/#calculator"
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
