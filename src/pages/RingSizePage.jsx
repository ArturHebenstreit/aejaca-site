import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import RingSizeCalc from "../components/calculators/RingSizeCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import ContentCTA from "../components/ContentCTA.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia jubilerskie",
    heroTitle: "Rozmiary pierścionków",
    heroDesc: "Konwerter rozmiarów EU / US / UK / JP. Oblicz rozmiar ze sznurka, średnicy lub wybierz z siatki.",
    introTitle: "Jak korzystać z konwertera?",
    introText: "Wybierz metodę: mierzysz sznurkiem → wpisz obwód w mm (= rozmiar EU). Masz pierścionek → wpisz średnicę wewnętrzną. Znasz rozmiar → wybierz system i kliknij wartość na siatce. Kalkulator pokaże odpowiedniki we wszystkich systemach.",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia jubilerskie",
    breadThis: "Rozmiary pierścionków",
    sizerTitle: "Nie znasz swojego rozmiaru?",
    sizerText: "Wydrukuj miarkę, wytnij pasek i zmierz palec w minutę. Arkusz ma wbudowane sprawdzenie skali wydruku.",
    sizerBtn: "Miarka do wydruku",
    footerCtaTitle: "Potrzebujesz pierścionka na miarę?",
    footerCtaText: "Znając swój rozmiar, możemy stworzyć pierścionek idealnie dopasowany - od projektu po gotowy wyrób.",
    footerCtaBtn: "Napisz do nas",
  },
  en: {
    heroTag: "Jewelry tools",
    heroTitle: "Ring Size Converter",
    heroDesc: "Convert EU / US / UK / JP ring sizes. Calculate from string measurement, diameter, or pick from a grid.",
    introTitle: "How to use the converter?",
    introText: "Choose a method: measuring with string → enter circumference in mm (= EU size). Have a ring → enter inner diameter. Know your size → select system and tap a tile. The calculator shows equivalents in all systems.",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry Tools",
    breadThis: "Ring Size Converter",
    sizerTitle: "Not sure of your size?",
    sizerText: "Print the sizer, cut the strip and measure your finger in a minute. The sheet checks the print scale for you.",
    sizerBtn: "Printable sizer",
    footerCtaTitle: "Need a custom-fit ring?",
    footerCtaText: "Knowing your size, we can create a perfectly fitted ring - from design to finished piece.",
    footerCtaBtn: "Contact us",
  },
  de: {
    heroTag: "Schmuck-Tools",
    heroTitle: "Ringgrößen-Konverter",
    heroDesc: "EU / US / UK / JP Ringgrößen umrechnen. Aus Fadenmaß, Durchmesser oder direkt aus dem Raster wählen.",
    introTitle: "Wie benutzt man den Konverter?",
    introText: "Methode wählen: Faden messen → Umfang in mm eingeben (= EU-Größe). Ring vorhanden → Innendurchmesser eingeben. Größe bekannt → System wählen und Kachel antippen. Der Rechner zeigt alle Entsprechungen.",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
    breadThis: "Ringgrößen-Konverter",
    sizerTitle: "Größe unbekannt?",
    sizerText: "Maßband ausdrucken, Streifen ausschneiden und den Finger in einer Minute messen. Das Blatt prüft den Druckmaßstab.",
    sizerBtn: "Maßband zum Ausdrucken",
    footerCtaTitle: "Einen maßgefertigten Ring bestellen?",
    footerCtaText: "Mit Ihrer Größe erstellen wir einen perfekt passenden Ring - vom Entwurf bis zum fertigen Stück.",
    footerCtaBtn: "Kontakt",
  },
};

const SEO_META = {
  pl: {
    title: "Rozmiary pierścionków - Konwerter EU / US / UK / JP | AEJaCA",
    description: "Kalkulator i konwerter rozmiarów pierścionków. Oblicz rozmiar EU ze sznurka lub średnicy. Przelicznik EU, US, UK, JP.",
  },
  en: {
    title: "Ring Size Converter - EU / US / UK / JP | AEJaCA",
    description: "Ring size calculator and converter. Calculate EU size from string measurement or diameter. EU, US, UK, JP chart.",
  },
  de: {
    title: "Ringgrößen-Konverter - EU / US / UK / JP | AEJaCA",
    description: "Ringgrößen Rechner und Konverter. EU-Größe aus Fadenmaß oder Durchmesser berechnen. EU, US, UK, JP Tabelle.",
  },
};

export default function RingSizePage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;

  const introRef = useScrollReveal();
  const calcRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const schemas = [
    buildWebPageSchema({
      title: seo.title,
      description: seo.description,
      url: `${SITE.url}/toolsjewelry/ring-size/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
      { name: L.breadThis, url: `${SITE.url}/toolsjewelry/ring-size/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolsjewelry"
        path="/toolsjewelry/ring-size"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[340px]">
          <img
            src="/hero-toolsjewelry.webp"
            alt="Rozmiary pierścionków - AEJaCA"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center flex flex-col items-center">
            <div className="text-amber-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{L.heroTag}</div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-semibold text-white mb-5 leading-[1.02] tracking-tight drop-shadow-2xl">{L.heroTitle}</h1>
            <p className="text-neutral-200 text-base max-w-xl leading-relaxed">{L.heroDesc}</p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadJewelry, href: "/jewelry/" },
              { label: L.breadTools, href: "/toolsjewelry/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        {/* Intro */}
        <section className="py-6 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcRef} className="reveal">
              <RingSizeCalc />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Review CTA */}
        <section className="px-4 bg-neutral-950">
          <ToolReviewCTA />
        </section>

        {/* Miarka do wydruku, druga polowa tej samej intencji */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/toolsjewelry/ring-sizer/"
              className="group flex flex-col gap-2 p-5 rounded-2xl glass hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="text-white font-semibold text-sm group-hover:text-amber-300 transition-colors">{L.sizerTitle}</div>
              <div className="text-neutral-400 text-xs leading-relaxed">{L.sizerText}</div>
              <div className="text-amber-400 text-xs font-medium">{L.sizerBtn}</div>
            </Link>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-10 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <ContentCTA service="jewelry_stones" category="jewelry" className="mb-8 text-left" />
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.footerCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.footerCtaText}</p>
            <a
              href="/contact/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-full hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              {L.footerCtaBtn}
            </a>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
