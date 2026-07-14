import { Link } from "react-router-dom";
import { ArrowRight, Layers, Printer, Flame, Sparkles, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import {
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildFAQSchema,
} from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";
import B2BInquiryForm from "../components/B2BInquiryForm.jsx";

// ============================================================
// COPY, inline dictionary (pattern from Reviews.jsx), pl/en/de.
// Prices: pl = PLN netto, en/de = EUR net (CONFIG.EUR_PLN_RATE ~4.28).
// ============================================================
const L = {
  pl: {
    heroTag: "AEJaCA sTuDiO",
    heroTitle: "Produkcja jubilerska B2B",
    heroSub: "Od wizji do wyrobu. Albo tylko ten jeden etap, którego Ci brakuje.",
    ctaBrand: "Buduję markę",
    ctaWorkshop: "Prowadzę pracownię",

    pathATitle: "Budujesz markę biżuterii",
    pathAText: "Masz wizję, nie masz warsztatu. Prowadzimy cały łańcuch: od projektu CAD, przez wzorzec i odlew, po wykończenie i zdjęcia gotowe do sprzedaży.",
    pathALink: "Zobacz proces white-label",
    pathBTitle: "Prowadzisz pracownię lub odlewnię",
    pathBText: "Masz warsztat, brakuje jednego ogniwa. Kupujesz pojedyncze usługi: sam druk 16K, sam odlew, samo wykończenie lub grawer, bez zobowiązań na resztę procesu.",
    pathBLink: "Zobacz cennik usług",

    pillarsTag: "4 filary usług",
    pillarsTitle: "Wybierz to, czego potrzebujesz",

    pillar1Title: "Projektowanie 3D / CAD",
    pillar1Text: "Od szkicu, zdjęcia lub opisu do pliku cast-ready. Rhino 8 + Grasshopper (parametryka), rendery do akceptacji, kompensacja skurczu dobrana per stop, dwie rundy rewizji w cenie.",
    pillar1Price1Label: "Prosta obrączka / sygnet gładki",
    pillar1Price1: "400-600 zł netto",
    pillar1Price2Label: "Model średni (kamienie, relief)",
    pillar1Price2: "600-900 zł netto",
    pillar1Price3Label: "Rzeźbiarski / filigran / openwork",
    pillar1Price3: "900-1200 zł netto",
    pillar1Term: "Termin: 2-5 dni roboczych",
    pillar1Deliver: "Otrzymujesz: STL/3MF do druku, STEP do edycji, render, raport wymiarowy",

    pillar2Title: "Wzorce castable 16K",
    pillar2Text: "Druk z Twojego pliku lub naszego CAD. Elegoo Saturn 4 Ultra 16K (piksel 14 µm), BlueCast X-Wax Filigree (filigran, detal od 0,2 mm, ponad 80% wosku) lub X-One V2 (elementy masywne, zero skurczu), kontrola QC pod inwestycję.",
    pillar2Price1Label: "Wzorzec",
    pillar2Price1: "90-180 zł netto",
    pillar2Price2Label: "Kolejny wzorzec z tej samej platformy",
    pillar2Price2: "-40%",
    pillar2Term: "Wysyłka: 24-48h od akceptacji pliku",
    pillar2Deliver: "Otrzymujesz: wzorzec gotowy do inwestycji, utwardzony, z raportem kontroli",

    pillar3Title: "Odlew i wykończenie",
    pillar3Text: "Pełny cykl lost-resin/lost-PLA in-house: inwestycja Omni-II, wypalanie, odlew próżniowy, Ag 925 / Au 585, obróbka (tumbler, poler), opcjonalnie rodowanie lub złocenie, setting kamieni pod mikroskopem.",
    pillar3Price1Label: "Prototyp w srebrze",
    pillar3Price1: "180-300 zł netto + materiał",
    pillar3Price2Label: "Odlew z wykończeniem",
    pillar3Price2: "wycena wg wagi, próby i złożoności w 24h",
    pillar3Deliver: "Cechowanie: patrz sekcja poniżej",

    pillar4Title: "Usługi uzupełniające",
    pillar4Laser: "Laser fiber 30W: grawer i personalizacja na złocie, srebrze, stali, tytanie; grawer obrotowy na obrączkach; od 20 zł netto/szt.",
    pillar4Photo: "Fotografia produktowa: makro (Sony A7IV + Sigma 70 Macro + Godox MF12), pakiety od 3 ujęć/produkt, wycena pakietowa.",
    pillar4Galvanic: "Galwanika: rodowanie, złocenie, wycena według powierzchni.",

    hallmarkTitle: "Cechowanie",
    hallmarkText: "Każdy wyrób ze złota lub srebra domyślnie oznaczamy znakiem wytwórcy AEJaCA i zgłaszamy do Urzędu Probierczego pod szyldem AEJaCA, otrzymujesz produkt z pełnymi cechami, gotowy do sprzedaży. Po indywidualnych ustaleniach możemy przekazać wyrób lub surowy odlew bez cech, np. gdy Twoja pracownia cechuje pod własnym numerem ewidencyjnym, obowiązek zgłoszenia do obrotu przechodzi wtedy na odbiorcę.",

    whiteLabelTag: "Twoja marka, nasza pracownia",
    whiteLabelTitle: "White-label",
    whiteLabelSteps: [
      { title: "Konsultacja i brief", desc: "Wizja, inspiracje, budżet docelowy." },
      { title: "Projekt CAD", desc: "Rendery do akceptacji." },
      { title: "Wzorzec 16K", desc: "Do oceny, opcjonalnie prototyp w srebrze." },
      { title: "Odlew Au/Ag", desc: "Wykończenie i setting kamieni." },
      { title: "Cechowanie i QC", desc: "Kontrola jakości przed dostawą." },
      { title: "Fotografia i dostawa", desc: "Zdjęcia produktowe, gotowe do sprzedaży." },
    ],
    whiteLabelNote: "Rozliczenie per etap, płacisz po akceptacji każdego kamienia milowego. Kolejne modele kolekcji na bazie umowy ramowej.",
    whiteLabelCta: "Zapytaj o białą etykietę",

    seriesTitle: "Produkcja seryjna",
    seriesText: "Serie z form gumowych realizujemy we współpracy z zaufanymi pracowniami partnerskimi, przyjmujemy zlecenie i koordynujemy cały proces. Jednostkowe i małoseryjne wyroby (do ok. 20 szt.) wykonujemy w całości u siebie.",

    faqTag: "Pytania i odpowiedzi",
    faqTitle: "FAQ B2B",
    faq: [
      { q: "Czy mogę zamówić sam wydruk wzorca bez odlewu?", a: "Tak. Filar 2 (wzorce castable 16K) możesz zamówić samodzielnie, wysyłamy gotowy wzorzec do Twojej odlewni." },
      { q: "Czy wyroby są cechowane?", a: "Domyślnie tak, znak wytwórcy AEJaCA i zgłoszenie do Urzędu Probierczego. Po ustaleniu możemy przekazać wyrób bez cech, obowiązek zgłoszenia przechodzi wtedy na odbiorcę." },
      { q: "Jak wygląda rozliczenie przy budowie marki?", a: "Etapowe, płacisz po akceptacji każdego kamienia milowego procesu white-label." },
      { q: "Czy podpisujecie NDA?", a: "Tak, standardowo przy projektach autorskich." },
      { q: "Jakie pliki przyjmujecie?", a: "STL, 3MF, STEP, OBJ. Jeśli nie masz pliku, wystarczy szkic lub zdjęcie, dopracujemy projekt w filarze 1 (CAD)." },
    ],

    formTag: "Wycena w 24h",
    formTitle: "Porozmawiajmy o Twoim projekcie",
  },

  en: {
    heroTag: "AEJaCA sTuDiO",
    heroTitle: "B2B Jewelry Production",
    heroSub: "From vision to finished piece. Or just the one stage you are missing.",
    ctaBrand: "I'm building a brand",
    ctaWorkshop: "I run a workshop",

    pathATitle: "Building a jewelry brand",
    pathAText: "You have a vision, not a workshop. We run the full chain: CAD design, pattern and casting, finishing and photography, ready to sell.",
    pathALink: "See the white-label process",
    pathBTitle: "Running a workshop or foundry",
    pathBText: "You have a workshop, missing one link. Buy single services: just 16K printing, just casting, just finishing or engraving, no commitment on the rest of the process.",
    pathBLink: "See service pricing",

    pillarsTag: "4 service pillars",
    pillarsTitle: "Pick what you need",

    pillar1Title: "3D Design / CAD",
    pillar1Text: "From a sketch, photo or description to a cast-ready file. Rhino 8 + Grasshopper (parametric design), renders for approval, shrinkage compensation tuned per alloy, two revision rounds included.",
    pillar1Price1Label: "Simple band / plain signet",
    pillar1Price1: "95-140 EUR net",
    pillar1Price2Label: "Medium complexity (stones, relief)",
    pillar1Price2: "140-210 EUR net",
    pillar1Price3Label: "Sculptural / filigree / openwork",
    pillar1Price3: "210-280 EUR net",
    pillar1Term: "Turnaround: 2-5 business days",
    pillar1Deliver: "You get: STL/3MF for printing, STEP for editing, render, dimensional report",

    pillar2Title: "Castable 16K patterns",
    pillar2Text: "Printed from your file or our CAD. Elegoo Saturn 4 Ultra 16K (14 µm pixel), BlueCast X-Wax Filigree (filigree, detail from 0.2 mm, over 80% wax) or X-One V2 (solid elements, zero shrinkage), QC checked before investment.",
    pillar2Price1Label: "Pattern",
    pillar2Price1: "21-42 EUR net",
    pillar2Price2Label: "Additional pattern, same platform",
    pillar2Price2: "-40%",
    pillar2Term: "Shipping: 24-48h after file approval",
    pillar2Deliver: "You get: pattern ready for investment, cured, with an inspection report",

    pillar3Title: "Casting and finishing",
    pillar3Text: "Full lost-resin/lost-PLA cycle in-house: Omni-II investment, burnout, vacuum casting, Ag 925 / Au 585, finishing (tumbling, polishing), optional rhodium or gold plating, stone setting under a microscope.",
    pillar3Price1Label: "Silver prototype",
    pillar3Price1: "42-70 EUR net + material",
    pillar3Price2Label: "Cast with finishing",
    pillar3Price2: "quoted by weight, alloy and complexity within 24h",
    pillar3Deliver: "Hallmarking: see the section below",

    pillar4Title: "Additional services",
    pillar4Laser: "Fiber laser 30W: engraving and personalization on gold, silver, steel, titanium; rotary engraving for rings; from 5 EUR net/pc.",
    pillar4Photo: "Product photography: macro (Sony A7IV + Sigma 70 Macro + Godox MF12), packages from 3 shots/product, package pricing.",
    pillar4Galvanic: "Electroplating: rhodium and gold plating, priced by surface area.",

    hallmarkTitle: "Hallmarking",
    hallmarkText: "By default, every gold or silver piece is stamped with the AEJaCA maker's mark and reported to the Polish Assay Office (Urząd Probierczy) under the AEJaCA name, you receive a product with full hallmarks, ready for sale (Polish hallmarking system). By individual arrangement, we can hand over the piece or the raw casting unmarked, e.g. when your workshop hallmarks under its own registration number, the obligation to report the item before sale then passes to you.",

    whiteLabelTag: "Your brand, our workshop",
    whiteLabelTitle: "White-label",
    whiteLabelSteps: [
      { title: "Consultation and brief", desc: "Vision, inspirations, target budget." },
      { title: "CAD design", desc: "Renders for approval." },
      { title: "16K pattern", desc: "For evaluation, optional silver prototype." },
      { title: "Au/Ag casting", desc: "Finishing and stone setting." },
      { title: "Hallmarking and QC", desc: "Quality control before delivery." },
      { title: "Photography and delivery", desc: "Product shots, ready to sell." },
    ],
    whiteLabelNote: "Billed per stage, you pay after approving each milestone. Follow-up models of the collection run on a framework agreement.",
    whiteLabelCta: "Ask about white-label",

    seriesTitle: "Series production",
    seriesText: "Rubber-mold series are produced with trusted partner workshops, we take the order and coordinate the whole process. Single pieces and small runs (up to about 20 pcs) are made entirely in-house.",

    faqTag: "Questions and answers",
    faqTitle: "B2B FAQ",
    faq: [
      { q: "Can I order just a printed pattern, without casting?", a: "Yes. Pillar 2 (castable 16K patterns) can be ordered on its own, we ship the finished pattern to your foundry." },
      { q: "Are the pieces hallmarked?", a: "By default yes, AEJaCA maker's mark plus a report to the Polish Assay Office. By arrangement we can hand over an unmarked piece, the reporting obligation then passes to you." },
      { q: "How does billing work when building a brand?", a: "Staged, you pay after approving each milestone of the white-label process." },
      { q: "Do you sign NDAs?", a: "Yes, standard practice for proprietary designs." },
      { q: "What files do you accept?", a: "STL, 3MF, STEP, OBJ. No file yet? A sketch or photo is enough, we'll refine the design under pillar 1 (CAD)." },
    ],

    formTag: "Quote within 24h",
    formTitle: "Let's talk about your project",
  },

  de: {
    heroTag: "AEJaCA sTuDiO",
    heroTitle: "B2B-Schmuckproduktion",
    heroSub: "Von der Vision zum fertigen Stück. Oder nur die eine Etappe, die Ihnen fehlt.",
    ctaBrand: "Ich baue eine Marke auf",
    ctaWorkshop: "Ich betreibe eine Werkstatt",

    pathATitle: "Sie bauen eine Schmuckmarke auf",
    pathAText: "Sie haben eine Vision, keine Werkstatt. Wir übernehmen die ganze Kette: CAD-Design, Modell und Guss, Veredelung und Produktfotos, verkaufsfertig.",
    pathALink: "White-Label-Prozess ansehen",
    pathBTitle: "Sie betreiben eine Werkstatt oder Gießerei",
    pathBText: "Sie haben eine Werkstatt, es fehlt ein Glied. Buchen Sie einzelne Leistungen: nur den 16K-Druck, nur den Guss, nur die Veredelung oder Gravur, ohne Verpflichtung für den Rest des Prozesses.",
    pathBLink: "Leistungspreise ansehen",

    pillarsTag: "4 Leistungssäulen",
    pillarsTitle: "Wählen Sie, was Sie brauchen",

    pillar1Title: "3D-Design / CAD",
    pillar1Text: "Von der Skizze, dem Foto oder der Beschreibung bis zur guss-fertigen Datei. Rhino 8 + Grasshopper (parametrisches Design), Renderings zur Freigabe, Schrumpfkompensation je Legierung abgestimmt, zwei Korrekturrunden inklusive.",
    pillar1Price1Label: "Einfacher Ring / glatter Siegelring",
    pillar1Price1: "95-140 EUR netto",
    pillar1Price2Label: "Mittlere Komplexität (Steine, Relief)",
    pillar1Price2: "140-210 EUR netto",
    pillar1Price3Label: "Skulptural / Filigran / Openwork",
    pillar1Price3: "210-280 EUR netto",
    pillar1Term: "Lieferzeit: 2-5 Werktage",
    pillar1Deliver: "Sie erhalten: STL/3MF für den Druck, STEP zur Bearbeitung, Rendering, Maßbericht",

    pillar2Title: "Castable 16K-Modelle",
    pillar2Text: "Druck aus Ihrer Datei oder unserem CAD. Elegoo Saturn 4 Ultra 16K (14 µm Pixel), BlueCast X-Wax Filigree (Filigran, Detail ab 0,2 mm, über 80% Wachs) oder X-One V2 (massive Elemente, kein Schrumpf), QC-Kontrolle vor der Einbettung.",
    pillar2Price1Label: "Modell",
    pillar2Price1: "21-42 EUR netto",
    pillar2Price2Label: "Weiteres Modell, gleiche Plattform",
    pillar2Price2: "-40%",
    pillar2Term: "Versand: 24-48h nach Dateifreigabe",
    pillar2Deliver: "Sie erhalten: gusseinbettbereites, ausgehärtetes Modell mit Kontrollbericht",

    pillar3Title: "Guss und Veredelung",
    pillar3Text: "Vollständiger Lost-Resin-/Lost-PLA-Zyklus im eigenen Haus: Omni-II-Einbettmasse, Ausbrennen, Vakuumguss, Ag 925 / Au 585, Nachbearbeitung (Trommeln, Polieren), optional Rhodinieren oder Vergolden, Steinfassung unter dem Mikroskop.",
    pillar3Price1Label: "Silberprototyp",
    pillar3Price1: "42-70 EUR netto + Material",
    pillar3Price2Label: "Guss mit Veredelung",
    pillar3Price2: "Angebot nach Gewicht, Legierung und Komplexität innerhalb von 24h",
    pillar3Deliver: "Punzierung: siehe Abschnitt unten",

    pillar4Title: "Zusatzleistungen",
    pillar4Laser: "Faserlaser 30W: Gravur und Personalisierung auf Gold, Silber, Stahl, Titan; Rundachsengravur für Ringe; ab 5 EUR netto/Stk.",
    pillar4Photo: "Produktfotografie: Makro (Sony A7IV + Sigma 70 Macro + Godox MF12), Pakete ab 3 Aufnahmen/Produkt, Paketpreise.",
    pillar4Galvanic: "Galvanik: Rhodinieren, Vergolden, Preis nach Oberfläche.",

    hallmarkTitle: "Punzierung",
    hallmarkText: "Standardmäßig versehen wir jedes Gold- oder Silberstück mit dem AEJaCA-Herstellerzeichen und melden es beim polnischen Punzierungsamt (Urząd Probierczy) unter dem Namen AEJaCA an (polnisches Punzierungssystem), Sie erhalten ein Produkt mit vollständigen Punzen, verkaufsfertig. Nach individueller Absprache können wir das Stück oder den rohen Guss unpunziert übergeben, z.B. wenn Ihre Werkstatt unter eigener Registrierungsnummer punziert, die Meldepflicht vor dem Verkauf geht dann auf Sie über.",

    whiteLabelTag: "Ihre Marke, unsere Werkstatt",
    whiteLabelTitle: "White-Label",
    whiteLabelSteps: [
      { title: "Beratung und Briefing", desc: "Vision, Inspirationen, Zielbudget." },
      { title: "CAD-Design", desc: "Renderings zur Freigabe." },
      { title: "16K-Modell", desc: "Zur Bewertung, optional Silberprototyp." },
      { title: "Au/Ag-Guss", desc: "Veredelung und Steinfassung." },
      { title: "Punzierung und QC", desc: "Qualitätskontrolle vor der Lieferung." },
      { title: "Fotografie und Lieferung", desc: "Produktfotos, verkaufsfertig." },
    ],
    whiteLabelNote: "Abrechnung pro Etappe, Sie zahlen nach Freigabe jedes Meilensteins. Weitere Kollektionsmodelle laufen über einen Rahmenvertrag.",
    whiteLabelCta: "Nach White-Label fragen",

    seriesTitle: "Serienproduktion",
    seriesText: "Serien aus Gummiformen realisieren wir in Zusammenarbeit mit vertrauenswürdigen Partnerwerkstätten, wir nehmen den Auftrag an und koordinieren den gesamten Prozess. Einzelstücke und Kleinserien (bis ca. 20 Stk.) fertigen wir vollständig selbst.",

    faqTag: "Fragen und Antworten",
    faqTitle: "B2B-FAQ",
    faq: [
      { q: "Kann ich nur den Modelldruck ohne Guss bestellen?", a: "Ja. Säule 2 (Castable 16K-Modelle) kann einzeln bestellt werden, wir versenden das fertige Modell an Ihre Gießerei." },
      { q: "Werden die Stücke punziert?", a: "Standardmäßig ja, AEJaCA-Herstellerzeichen plus Meldung beim polnischen Punzierungsamt. Nach Absprache können wir ein unpunziertes Stück übergeben, die Meldepflicht geht dann auf Sie über." },
      { q: "Wie funktioniert die Abrechnung beim Markenaufbau?", a: "Etappenweise, Sie zahlen nach Freigabe jedes Meilensteins des White-Label-Prozesses." },
      { q: "Unterschreiben Sie NDAs?", a: "Ja, Standard bei urheberrechtlich geschützten Entwürfen." },
      { q: "Welche Dateien akzeptieren Sie?", a: "STL, 3MF, STEP, OBJ. Noch keine Datei? Eine Skizze oder ein Foto genügt, wir verfeinern das Design in Säule 1 (CAD)." },
    ],

    formTag: "Angebot in 24h",
    formTitle: "Sprechen wir über Ihr Projekt",
  },
};

export default function B2B() {
  const { lang } = useLanguage();
  const t = L[lang] || L.en;

  const pathsRef = useScrollReveal();
  const pillarsHeaderRef = useScrollReveal();
  const getPillarRef = useStaggerReveal(90);
  const whiteLabelRef = useScrollReveal();
  const seriesRef = useScrollReveal();
  const faqHeaderRef = useScrollReveal();
  const getFaqRef = useStaggerReveal(80);
  const formRef = useScrollReveal();

  const seo = getSEO("b2b", lang);
  const pageUrl = `${SITE.url}/b2b/`;
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "sTuDiO", url: `${SITE.url}/studio/` },
      { name: "B2B", url: pageUrl },
    ]),
    buildServiceSchema({
      name: seo.title,
      description: seo.description,
      serviceType: "B2B jewelry manufacturing: CAD design, castable 3D patterns, casting, finishing, hallmarking, white-label production",
      url: pageUrl,
      offers: { price: "95", minPrice: "20", maxPrice: "1200", currency: "EUR" },
    }),
    buildFAQSchema(t.faq.map((f) => ({ q: f.q, a: f.a }))),
  ];

  const pillars = [
    {
      icon: Layers,
      img: "/img/b2b/pillar_cad.webp",
      title: t.pillar1Title,
      text: t.pillar1Text,
      prices: [
        { label: t.pillar1Price1Label, value: t.pillar1Price1 },
        { label: t.pillar1Price2Label, value: t.pillar1Price2 },
        { label: t.pillar1Price3Label, value: t.pillar1Price3 },
      ],
      term: t.pillar1Term,
      deliver: t.pillar1Deliver,
    },
    {
      icon: Printer,
      img: "/img/b2b/pillar_patterns.webp",
      title: t.pillar2Title,
      text: t.pillar2Text,
      prices: [
        { label: t.pillar2Price1Label, value: t.pillar2Price1 },
        { label: t.pillar2Price2Label, value: t.pillar2Price2 },
      ],
      term: t.pillar2Term,
      deliver: t.pillar2Deliver,
    },
    {
      icon: Flame,
      img: "/img/b2b/pillar_casting.webp",
      title: t.pillar3Title,
      text: t.pillar3Text,
      prices: [
        { label: t.pillar3Price1Label, value: t.pillar3Price1 },
        { label: t.pillar3Price2Label, value: t.pillar3Price2 },
      ],
      deliver: t.pillar3Deliver,
    },
    {
      icon: Sparkles,
      img: "/img/b2b/pillar_services.webp",
      title: t.pillar4Title,
      list: [t.pillar4Laser, t.pillar4Photo, t.pillar4Galvanic],
    },
  ];

  return (
    <>
      <SEOHead pageKey="b2b" path="/b2b" image={`${SITE.url}/img/b2b/hero.webp`} schemas={schemas} />
      <div className="bg-neutral-950">
        {/* Hero */}
        <section className="relative overflow-hidden min-h-[380px]">
          <img
            src="/img/b2b/hero.webp"
            alt={t.heroTitle}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            width="1920"
            height="820"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-neutral-950/85 to-neutral-950" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-10 text-center flex flex-col items-center">
            <div className="text-blue-400 text-xs font-medium uppercase tracking-[0.35em] mb-5">{t.heroTag}</div>
            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6 leading-[1.05] tracking-tight drop-shadow-2xl">
              {t.heroTitle}
            </h1>
            <p className="text-neutral-200 text-base md:text-lg max-w-xl leading-relaxed mb-8">{t.heroSub}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#white-label" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 transition-all">
                {t.ctaBrand} <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#uslugi" className="inline-flex items-center gap-2 px-6 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all">
                {t.ctaWorkshop} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Two paths */}
        <section id="sciezki" className="py-14 px-4 bg-neutral-950">
          <div ref={pathsRef} className="reveal max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl glass-blue">
              <h2 className="font-sans text-xl font-semibold text-white mb-3">{t.pathATitle}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{t.pathAText}</p>
              <a href="#white-label" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                {t.pathALink} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="p-6 rounded-2xl glass-blue">
              <h2 className="font-sans text-xl font-semibold text-white mb-3">{t.pathBTitle}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{t.pathBText}</p>
              <a href="#uslugi" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                {t.pathBLink} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Pillars */}
        <section id="uslugi" className="py-14 px-4 bg-neutral-900/50">
          <div className="max-w-6xl mx-auto">
            <div ref={pillarsHeaderRef} className="reveal text-center mb-12">
              <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{t.pillarsTag}</div>
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{t.pillarsTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={i} ref={getPillarRef(i)} className="reveal-scale rounded-2xl glass-blue overflow-hidden">
                    <div className="aspect-[21/9] bg-black overflow-hidden">
                      <img src={p.img} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-2.5 mb-3">
                        <Icon className="w-5 h-5 text-blue-400 shrink-0" />
                        <h3 className="font-sans text-lg font-semibold text-white">{p.title}</h3>
                      </div>
                      {p.text && <p className="text-neutral-400 text-sm leading-relaxed mb-4">{p.text}</p>}
                      {p.list && (
                        <ul className="space-y-2 mb-4">
                          {p.list.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-neutral-400 text-sm leading-relaxed">
                              <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.prices && (
                        <div className="space-y-1.5 mb-3 border-t border-white/5 pt-3">
                          {p.prices.map((pr, j) => (
                            <div key={j} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-neutral-400">{pr.label}</span>
                              <span className="text-blue-300 font-medium whitespace-nowrap">{pr.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {p.term && <div className="text-xs text-neutral-500 mb-1">{p.term}</div>}
                      {p.deliver && <div className="text-xs text-neutral-500">{p.deliver}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hallmarking notice */}
            <div className="mt-8 max-w-4xl mx-auto p-5 sm:p-6 rounded-2xl border border-blue-400/15 bg-blue-400/[0.04]">
              <h3 className="font-sans text-base font-semibold text-white mb-2">{t.hallmarkTitle}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{t.hallmarkText}</p>
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* White-label */}
        <section id="white-label" className="py-14 px-4 bg-gradient-to-b from-blue-950/20 to-neutral-950">
          <div ref={whiteLabelRef} className="reveal max-w-4xl mx-auto text-center">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{t.whiteLabelTag}</div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-8 tracking-tight">{t.whiteLabelTitle}</h2>
            <img src="/img/b2b/whitelabel.webp" alt={t.whiteLabelTitle} loading="lazy"
              className="w-full max-w-2xl mx-auto rounded-2xl border border-white/10 mb-12 object-cover" />
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-6 text-left">
              {t.whiteLabelSteps.map((step, i) => (
                <div key={i}>
                  <div className="text-blue-400 font-mono text-xl font-bold mb-2">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-sans text-sm font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto mt-10 mb-6 leading-relaxed">{t.whiteLabelNote}</p>
            <a href="#formularz" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-400 transition-all">
              {t.whiteLabelCta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Series production */}
        <section className="py-12 px-4 bg-neutral-950">
          <div ref={seriesRef} className="reveal max-w-3xl mx-auto text-center">
            <h2 className="font-sans text-2xl font-bold text-white mb-4 tracking-tight">{t.seriesTitle}</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">{t.seriesText}</p>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* FAQ */}
        <section id="faq" className="py-14 px-4 bg-neutral-900/50">
          <div className="max-w-3xl mx-auto">
            <div ref={faqHeaderRef} className="reveal text-center mb-10">
              <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{t.faqTag}</div>
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{t.faqTitle}</h2>
            </div>
            <div className="space-y-4">
              {t.faq.map((item, i) => (
                <div key={i} ref={getFaqRef(i)} className="reveal-scale p-5 rounded-xl glass-blue">
                  <h3 className="font-sans text-base font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gradient-divider" />

        {/* Inquiry form */}
        <section className="py-16 px-4 bg-neutral-950">
          <div ref={formRef} className="reveal">
            <div className="text-center mb-10">
              <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{t.formTag}</div>
              <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{t.formTitle}</h2>
            </div>
            <B2BInquiryForm lang={lang} id="formularz" />
          </div>
        </section>
      </div>
    </>
  );
}
