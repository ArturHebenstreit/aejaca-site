import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import RingBlankCalc from "../components/calculators/RingBlankCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";

const LABELS = {
  pl: {
    heroTag: "Narzędzia jubilerskie",
    heroTitle: "Kalkulator Rozwinięcia Obrączki",
    heroDesc: "Oblicz długość paska metalu do wykonania obrączki lub pierścionka metodą walcowania.",
    introTitle: "Jak korzystać z kalkulatora?",
    introText: "Oblicz długość paska metalu potrzebnego do wykonania obrączki lub pierścionka metodą walcowania. Wyniki uwzględniają grubość materiału i rozmiar palca.",
    breadHome: "Strona główna",
    breadJewelry: "Biżuteria",
    breadTools: "Narzędzia Jubilerskie",
    breadThis: "Kalkulator Rozwinięcia Obrączki",
    footerCtaTitle: "Chcesz zamówić obrączkę?",
    footerCtaText: "Znając wymiary, możemy wykonać obrączkę na miarę — od projektu po gotowy wyrób.",
    footerCtaBtn: "Napisz do nas",
  },
  en: {
    heroTag: "Jewelry tools",
    heroTitle: "Ring Blank Calculator",
    heroDesc: "Calculate the metal strip length needed to make a ring or band using the rolling method.",
    introTitle: "How to use the calculator?",
    introText: "Calculate the metal strip length needed to make a ring or band using the rolling method. Results account for material thickness and finger size.",
    breadHome: "Home",
    breadJewelry: "Jewelry",
    breadTools: "Jewelry Tools",
    breadThis: "Ring Blank Calculator",
    footerCtaTitle: "Want to order a ring?",
    footerCtaText: "Knowing your dimensions, we can create a custom ring — from design to finished piece.",
    footerCtaBtn: "Contact us",
  },
  de: {
    heroTag: "Schmuck-Tools",
    heroTitle: "Ring-Rohling-Rechner",
    heroDesc: "Berechnen Sie die Metallstreifenlänge für einen Ring oder ein Band nach der Walzmethode.",
    introTitle: "Wie benutzt man den Rechner?",
    introText: "Berechnen Sie die benötigte Metallstreifenlänge für einen Ring oder ein Band mit der Walzmethode. Die Ergebnisse berücksichtigen die Materialstärke und die Fingergröße.",
    breadHome: "Startseite",
    breadJewelry: "Schmuck",
    breadTools: "Schmuck-Tools",
    breadThis: "Ring-Rohling-Rechner",
    footerCtaTitle: "Einen Ring bestellen?",
    footerCtaText: "Mit Ihren Maßen erstellen wir einen maßgefertigten Ring — vom Entwurf bis zum fertigen Stück.",
    footerCtaBtn: "Kontakt",
  },
};

const SEO_META = {
  pl: {
    title: "Kalkulator Rozwinięcia Obrączki — Długość Paska Metalu | AEJaCA",
    description: "Oblicz długość paska metalu do wykonania obrączki metodą walcowania. Kalkulator uwzględnia grubość materiału, rozmiar palca i szerokość obrączki.",
  },
  en: {
    title: "Ring Blank Calculator — Metal Strip Length | AEJaCA",
    description: "Calculate the metal strip length for making a ring by rolling. Accounts for material thickness, finger size and band width.",
  },
  de: {
    title: "Ring-Rohling-Rechner — Metallstreifenlänge | AEJaCA",
    description: "Berechnen Sie die Metallstreifenlänge für einen Ring durch Walzen. Berücksichtigt Materialstärke, Fingergröße und Ringbreite.",
  },
};

export default function RingBlankPage() {
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
      url: `${SITE.url}/toolsjewelry/ring-blank/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadJewelry, url: `${SITE.url}/jewelry/` },
      { name: L.breadTools, url: `${SITE.url}/toolsjewelry/` },
      { name: L.breadThis, url: `${SITE.url}/toolsjewelry/ring-blank/` },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolsjewelry"
        path="/toolsjewelry/ring-blank"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="pt-16 bg-neutral-950">

        {/* Hero */}
        <section className="bg-neutral-950 py-10 px-4">
          <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden h-[40vh] min-h-[280px] bg-gradient-to-br from-stone-800 via-amber-950 to-stone-950">
            <img
              src="/hero-home-jewelry.webp"
              alt="Kalkulator Rozwinięcia Obrączki — AEJaCA"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1024"
              height="572"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-4 text-center">
              <div className="text-amber-400 text-xs uppercase tracking-[0.25em] mb-3">{L.heroTag}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">{L.heroTitle}</h1>
              <p className="text-neutral-300 text-base max-w-2xl">{L.heroDesc}</p>
            </div>
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
        <section className="py-10 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-amber-400/5 border border-amber-400/15">
              <h2 className="font-sans text-xl font-semibold text-amber-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-12 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={calcRef} className="reveal">
              <RingBlankCalc lang={lang} />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Review CTA */}
        <section className="px-4 bg-neutral-950">
          <ToolReviewCTA />
        </section>

        {/* Footer CTA */}
        <section className="py-12 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
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
