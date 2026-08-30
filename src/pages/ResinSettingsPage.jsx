import { useLanguage } from "../i18n/LanguageContext.jsx";
import PYTANIA from "../data/faq/zywice.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import ResinSettingsCalc from "../components/calculators/ResinSettingsCalc.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import ToolReviewCTA from "../components/ToolReviewCTA.jsx";
import { Link } from "../i18n/nav.jsx";
import Obraz from "../components/Obraz.jsx";
import { opisObrazu } from "../data/opisyObrazow.js";

const LABELS = {
  pl: {
    heroTag: "Narzędzia sTuDiO",
    heroTitle: "Parametry druku 3D MSLA: żywice i dobór materiału",
    heroDesc: "Dobierz żywicę do druku żywicznego, sprawdź parametry warstwy, mycia i utwardzania, bezpłatnie, bez rejestracji.",
    introTitle: "Czym jest MSLA i po co 16K",
    introText: "MSLA (Masked Stereolithography) utwardza żywicę światłem UV wyświetlanym przez maskowany ekran LCD, warstwa po warstwie. Nasza drukarka Elegoo Saturn 4 Ultra ma rozdzielczość 16K i wielkość piksela ok. 14 mikrometrów, dzięki czemu odwzorowuje mikrodetal niedostępny dla druku FDM, ażurowe wzory, gwintowanie, mikrograwer czy wzorce jubilerskie do odlewu. Poniżej dobierzesz żywicę do swojego projektu i sprawdzisz jej parametry.",
    breadHome: "Strona główna",
    breadStudio: "sTuDiO",
    breadTools: "Narzędzia sTuDiO",
    breadThis: "Parametry druku 3D MSLA",
    faqHeading: "Najczęstsze pytania",
    footerCtaTitle: "Potrzebujesz wydruku MSLA?",
    footerCtaText: "Drukujemy w standardowych, technicznych i precyzyjnych żywicach na drukarce 16K. Wyceń zlecenie online.",
    footerCtaBtn: "Kalkulator wyceny sTuDiO",
  },
  en: {
    heroTag: "sTuDiO Tools",
    heroTitle: "MSLA 3D Print Settings: Resins & Material Advisor",
    heroDesc: "Find the right resin for MSLA printing, check layer, wash and post-cure parameters, free, no sign-up.",
    introTitle: "What is MSLA, and why 16K",
    introText: "MSLA (Masked Stereolithography) cures resin with UV light projected through a masked LCD screen, layer by layer. Our Elegoo Saturn 4 Ultra printer has 16K resolution and a pixel size of roughly 14 microns, so it reproduces micro-detail unreachable for FDM printing, openwork patterns, threads, micro-engraving or jewelry casting patterns. Below you can pick a resin for your project and check its parameters.",
    breadHome: "Home",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO Tools",
    breadThis: "MSLA 3D Print Settings",
    faqHeading: "Frequently asked questions",
    footerCtaTitle: "Need an MSLA print?",
    footerCtaText: "We print in standard, technical and precision resins on a 16K printer. Get an online quote.",
    footerCtaBtn: "sTuDiO Pricing Calculator",
  },
  de: {
    heroTag: "sTuDiO-Tools",
    heroTitle: "MSLA-3D-Druckparameter: Harze und Materialberater",
    heroDesc: "Passendes Harz für den MSLA-Druck finden, Schicht-, Reinigungs- und Nachhärteparameter prüfen, kostenlos, ohne Anmeldung.",
    introTitle: "Was ist MSLA, und wozu 16K",
    introText: "MSLA (Masked Stereolithography) härtet Harz schichtweise mit UV-Licht aus, das durch einen maskierten LCD-Bildschirm projiziert wird. Unser Drucker Elegoo Saturn 4 Ultra hat eine Auflösung von 16K und eine Pixelgröße von rund 14 Mikrometern, dadurch bildet er Mikrodetails ab, die im FDM-Druck nicht erreichbar sind, Durchbruchmuster, Gewinde, Mikrogravur oder Schmuck-Gussmodelle. Unten wählen Sie ein Harz für Ihr Projekt und prüfen dessen Parameter.",
    breadHome: "Startseite",
    breadStudio: "sTuDiO",
    breadTools: "sTuDiO-Tools",
    breadThis: "MSLA-3D-Druckparameter",
    faqHeading: "Häufig gestellte Fragen",
    footerCtaTitle: "MSLA-Druck benötigt?",
    footerCtaText: "Wir drucken in Standard-, technischen und Präzisionsharzen auf einem 16K-Drucker. Online-Angebot einholen.",
    footerCtaBtn: "sTuDiO-Preiskalkulator",
  },
};

const SEO_META = {
  pl: {
    title: "Parametry druku 3D MSLA: żywice, ceny, dobór | AEJaCA",
    description: "Dobierz żywicę do druku MSLA, sprawdź warstwę, mycie i czas utwardzania UV. Darmowy kalkulator porównawczy dla 13 żywic Elegoo Saturn 4 Ultra 16K.",
  },
  en: {
    title: "MSLA 3D Print Settings: Resins, Prices, Advisor | AEJaCA",
    description: "Pick a resin for MSLA printing, check layer height, wash medium and UV post-cure time. Free comparison tool for 13 resins, 16K Elegoo Saturn 4 Ultra.",
  },
  de: {
    title: "MSLA-3D-Druckparameter: Harze, Preise, Beratung | AEJaCA",
    description: "Harz für den MSLA-Druck wählen, Schicht, Reinigung und UV-Nachhärtezeit prüfen. Kostenloses Vergleichstool für 13 Harze, 16K Elegoo Saturn 4 Ultra.",
  },
};

export default function ResinSettingsPage() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const seo = SEO_META[lang] || SEO_META.pl;

  const introRef = useScrollReveal();
  const calcRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  // Pytania stoja we wspolnym zbiorze danych, wiec te same odpowiedzi da sie
  // znalezc przez wyszukiwarke na `/faq/`, bez drugiej kopii tekstu.
  const faqItems = PYTANIA.map((f) => ({ id: f.id, q: f.q[lang] || f.q.pl, a: f.a[lang] || f.a.pl }));

  const schemas = [
    buildWebPageSchema({
      title: seo.title,
      description: seo.description,
      url: `${SITE.url}/toolstudio/resin-settings/`,
    }),
    buildBreadcrumbSchema([
      { name: L.breadHome, url: SITE.url },
      { name: L.breadStudio, url: `${SITE.url}/studio/` },
      { name: L.breadTools, url: `${SITE.url}/toolstudio/` },
      { name: L.breadThis, url: `${SITE.url}/toolstudio/resin-settings/` },
    ]),
    buildFAQSchema(faqItems),
  ];

  return (
    <>
      <SEOHead
        pageKey="toolstudio"
        path="/toolstudio/resin-settings"
        schemas={schemas}
        title={seo.title}
        description={seo.description}
      />
      <div className="bg-neutral-950">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-[340px]">
          <Obraz
            src="/img/calc/3d_segments/msla_resin.webp"
            alt={opisObrazu("zywica-msla", lang)}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1024"
            height="572"
            sizes="100vw"
          />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />
          <div className="hero-text relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-6 text-center flex flex-col items-center">
            <div className="text-blue-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{L.heroTag}</div>
            <h1 className="font-sans text-4xl sm:text-5xl md:text-[54px] font-semibold text-white mb-5 leading-[1.05] tracking-tight drop-shadow-2xl">{L.heroTitle}</h1>
            <p className="text-neutral-200 text-base max-w-xl leading-relaxed">{L.heroDesc}</p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
          <Breadcrumb
            items={[
              { label: L.breadHome, href: "/" },
              { label: L.breadStudio, href: "/studio/" },
              { label: L.breadTools, href: "/toolstudio/" },
              { label: L.breadThis },
            ]}
          />
        </div>

        {/* Intro */}
        <section className="py-6 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <div ref={introRef} className="reveal p-6 rounded-2xl bg-blue-400/5 border border-blue-400/15">
              <h2 className="font-sans text-xl font-semibold text-blue-300 mb-3">{L.introTitle}</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">{L.introText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Calculator */}
        <section className="py-8 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <div ref={calcRef} className="reveal">
              <ResinSettingsCalc lang={lang} />
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* FAQ */}
        <section className="py-10 px-4 bg-neutral-950">
          <div ref={faqRef} className="reveal max-w-3xl mx-auto">
            <h2 className="font-sans text-2xl font-semibold text-white text-center mb-8">{L.faqHeading}</h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <details key={i} className="group bg-neutral-900/50 border border-neutral-800 rounded-xl px-6 py-4 [&_summary]:cursor-pointer">
                  <summary className="flex items-center justify-between text-base font-medium text-neutral-100 list-none">
                    <span>{item.q}</span>
                    <span className="text-blue-400 ml-4 shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-neutral-400 text-sm leading-relaxed mt-3">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Review CTA */}
        <section className="px-4 bg-neutral-950">
          <ToolReviewCTA />
        </section>

        {/* Footer CTA */}
        <section className="py-10 px-4 bg-neutral-950 text-center">
          <div ref={ctaRef} className="reveal max-w-xl mx-auto">
            <h2 className="font-sans text-xl font-semibold text-white mb-2">{L.footerCtaTitle}</h2>
            <p className="text-neutral-400 text-sm mb-6">{L.footerCtaText}</p>
            <Link
              to="/studio/#calculator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
            >
              {L.footerCtaBtn}
            </Link>
          </div>
        </section>

        <div className="gradient-divider" />

      </div>
    </>
  );
}
