/* AEJaCA — Subpages. Light theme by default; brand-jewelry / brand-studio
   wrappers swap accent + typography. */

/* ----------------------------------------------------------------
   Shared primitives
   ---------------------------------------------------------------- */

function SectionHead({ tag, title, desc, serif = true }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", marginBottom: 44 }}>
      <Eyebrow style={{ marginBottom: 18 }}>{tag}</Eyebrow>
      <h2 style={{
        fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
        fontSize: 42, fontWeight: 600, color: "var(--fg-1)",
        margin: "0 0 16px", letterSpacing: "-0.015em", lineHeight: 1.15,
      }}>{title}</h2>
      {desc && <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.65, margin: 0 }}>{desc}</p>}
    </div>
  );
}

function PageHero({ img, tag, title, desc, serif = true }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: 540 }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "var(--hero-scrim)" }} />
      </div>
      <div style={{ position: "relative", maxWidth: 1024, margin: "0 auto", padding: "120px 24px 140px", textAlign: "center" }}>
        <div style={{ marginBottom: 22 }}>
          <Eyebrow color="var(--accent-light)">{tag}</Eyebrow>
        </div>
        <h1 style={{
          fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
          fontSize: "clamp(44px, 7vw, 72px)",
          fontWeight: 600, letterSpacing: "-0.025em",
          color: "#ffffff", margin: "0 0 22px", lineHeight: 1.02,
          textShadow: "0 2px 16px rgba(0,0,0,0.35)",
        }}>{title}</h1>
        <p style={{
          color: "rgba(255,255,255,0.92)", fontSize: 18, maxWidth: 640,
          margin: "0 auto", lineHeight: 1.6, textWrap: "pretty",
          textShadow: "0 1px 8px rgba(0,0,0,0.40)",
        }}>{desc}</p>
      </div>
    </section>
  );
}

function AboutIntro({ eyebrow, title, p1, p2, serif = true }) {
  return (
    <section style={{ padding: "88px 16px", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <Eyebrow style={{ marginBottom: 18 }}>{eyebrow}</Eyebrow>
        <h2 style={{
          fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
          fontSize: 42, fontWeight: 600, color: "var(--fg-1)",
          margin: "0 0 22px", letterSpacing: "-0.015em", lineHeight: 1.12,
        }}>{title}</h2>
        <p style={{ color: "var(--fg-2)", fontSize: 18, lineHeight: 1.7, margin: "0 0 18px" }}>{p1}</p>
        <p style={{ color: "var(--fg-3)", fontSize: 16, lineHeight: 1.7, margin: 0 }}>{p2}</p>
      </div>
    </section>
  );
}

function IndicativePricing({ lang, items, copy }) {
  const showEur = lang === "en" || lang === "de";
  return (
    <section style={{ padding: "88px 16px", background: "var(--bg-page-soft)" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <SectionHead tag={copy.tag} title={copy.title} desc={copy.note} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {items.map((it, i) => {
            const label = it[lang] || it.en;
            const primary = showEur ? `€${it.eur}` : `${it.pln} zł`;
            const secondary = showEur ? `${it.pln} zł` : `€${it.eur}`;
            return (
              <div key={i} style={{
                padding: 22,
                borderRadius: 14,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                transition: "all var(--dur-base) var(--ease-editorial)",
                boxShadow: "var(--shadow-card)",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-accent)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, color: "var(--accent-hover)" }}>{label}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, color: "var(--fg-1)", fontSize: 20 }}>{copy.from} {primary}</div>
                  <div style={{ fontFamily: "var(--font-mono)", color: "var(--fg-4)", fontSize: 11, marginTop: 2 }}>{secondary}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button variant="accent" onClick={() => {}}>{copy.cta}</Button>
        </div>
      </div>
    </section>
  );
}

function ProcessTimeline({ tag, title, steps, serif = true }) {
  return (
    <section style={{ padding: "96px 16px", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <SectionHead tag={tag} title={title} serif={serif} />
        <div style={{ display: "grid", gap: 16 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr",
              gap: 24,
              padding: 32,
              borderRadius: 16,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}>
              <div style={{
                fontFamily: "var(--font-serif)",
                fontSize: 52, fontWeight: 600,
                color: "var(--accent)",
                lineHeight: 1, opacity: 0.9,
              }}>{step.num || String(i + 1).padStart(2, "0")}</div>
              <div>
                <h3 style={{
                  fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
                  fontSize: 22, fontWeight: 600, color: "var(--fg-1)",
                  margin: "0 0 10px", letterSpacing: "-0.01em",
                }}>{step.title}</h3>
                <p style={{ color: "var(--fg-2)", fontSize: 15, lineHeight: 1.65, margin: "0 0 8px" }}>{step.desc}</p>
                {step.when && <p style={{ color: "var(--fg-4)", fontSize: 12, fontStyle: "italic", margin: 0 }}>{step.when}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesGrid({ tag, title, items, serif = true }) {
  return (
    <section style={{ padding: "96px 16px", background: "var(--bg-page-soft)" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <SectionHead tag={tag} title={title} serif={serif} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {items.map((it, i) => {
            const IconComp = it.icon || Sparkles;
            return (
              <div key={i} style={{
                padding: 30,
                borderRadius: 16,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-card)",
                transition: "all var(--dur-base) var(--ease-editorial)",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-accent)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-accent-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-card)";
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 20,
                  background: "var(--accent-soft)",
                  border: "1px solid var(--border-accent)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent)",
                }}>
                  <IconComp size={22} strokeWidth={1.6} />
                </div>
                <h3 style={{
                  fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
                  fontSize: 19, fontWeight: 600, color: "var(--fg-1)",
                  margin: "0 0 10px", letterSpacing: "-0.01em",
                }}>{it.title}</h3>
                <p style={{ color: "var(--fg-3)", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Copy banks
   ---------------------------------------------------------------- */

const JEWELRY_HERO = {
  pl: { tag: "Artystyczne & Luksusowe", title: "AEJaCA Jewelry", desc: "Biżuteria z duszą, robiona ręcznie. Naturalne kamienie, metale szlachetne i artystyczny projekt — każdy egzemplarz to osobna historia." },
  en: { tag: "Artistic & Luxury", title: "AEJaCA Jewelry", desc: "Handcrafted jewelry with soul. Natural gemstones, precious metals, and artistic design — each piece is a unique story." },
  de: { tag: "Künstlerisch & Luxuriös", title: "AEJaCA Jewelry", desc: "Handgefertigter Schmuck mit Seele. Naturedelsteine, Edelmetalle und künstlerisches Design." },
};
const JEWELRY_ABOUT = {
  pl: { eyebrow: "Filozofia", title: "Tam, gdzie sztuka spotyka rzemiosło",
        p1: "AEJaCA to artystyczna, luksusowa odsłona marki. Każdy egzemplarz biżuterii jest wykonywany ręcznie, z drobiazgową dbałością o detal, łącząc tradycyjne techniki złotnicze z nowoczesnym projektowaniem 3D.",
        p2: "Wierzymy, że biżuteria powinna nieść znaczenie. Każda kreacja ma wywoływać emocje, opowiadać historię i stać się ponadczasowym towarzyszem." },
  en: { eyebrow: "The Philosophy", title: "Where Art Meets Craftsmanship",
        p1: "AEJaCA represents the artistic and luxury side of the brand. Every piece is handcrafted with meticulous attention to detail, combining traditional silversmithing techniques with modern 3D design.",
        p2: "We believe that jewelry should carry meaning. Each creation is designed to evoke emotion, tell a story, and become a timeless companion." },
  de: { eyebrow: "Die Philosophie", title: "Wo Kunst auf Handwerk trifft",
        p1: "AEJaCA steht für die künstlerische, luxuriöse Seite der Marke. Jedes Schmuckstück wird mit akribischer Detailliebe handgefertigt.",
        p2: "Wir glauben, dass Schmuck Bedeutung tragen sollte. Jede Kreation soll Emotion wecken." },
};
const JEWELRY_SERVICES = {
  pl: { tag: "Co tworzymy", title: "Produkty i usługi", items: [
    { title: "Biżuteria ręcznie wykonywana", desc: "Pierścionki, kolczyki, wisiorki i bransoletki ze srebra i złota, kończone ręcznie z precyzją." },
    { title: "Kamienie naturalne", desc: "Starannie dobrane szmaragdy, szafiry, ametysty i inne, oprawione w unikalne kompozycje." },
    { title: "Projekty na zamówienie", desc: "Od Twojej wizji do gotowego dzieła. Projektujemy i wykonujemy biżuterię na miarę Twojej historii." },
    { title: "Spersonalizowane prezenty", desc: "Wyjątkowe prezenty — grawerowane, dopasowane, niosące emocję." },
    { title: "Projekt 3D i prototypowanie", desc: "Tradycyjne rzemiosło spotyka modelowanie 3D — prototyp przed produkcją." },
    { title: "Przedmioty symboliczne", desc: "Artystyczne obiekty i symbole, które wykraczają poza biżuterię — ponadczasowe pamiątki." },
  ]},
  en: { tag: "What We Create", title: "Products & Services", items: [
    { title: "Handcrafted Jewelry", desc: "Rings, earrings, pendants and bracelets in silver and gold, finished by hand with precision." },
    { title: "Natural Gemstones", desc: "Carefully selected stones — emeralds, sapphires, amethysts — set into unique designs." },
    { title: "Custom Projects", desc: "From your vision to a finished piece. Jewelry tailored to your story." },
    { title: "Personalized Gifts", desc: "Meaningful, one-of-a-kind gifts — engraved, customized, made to carry emotion." },
    { title: "3D Design & Prototyping", desc: "Traditional craft meets modern 3D modeling to prototype every piece." },
    { title: "Symbolic Objects", desc: "Artistic objects and symbolic creations beyond jewelry — timeless keepsakes." },
  ]},
  de: { tag: "Was wir erschaffen", title: "Produkte & Dienste", items: [
    { title: "Handgefertigter Schmuck", desc: "Ringe, Ohrringe, Anhänger und Armbänder aus Silber und Gold." },
    { title: "Naturedelsteine", desc: "Sorgfältig ausgewählte Smaragde, Saphire, Amethyste." },
    { title: "Individuelle Projekte", desc: "Schmuck, der Ihre Geschichte erzählt." },
    { title: "Personalisierte Geschenke", desc: "Bedeutungsvolle Unikate — graviert, angepasst." },
    { title: "3D-Design & Prototyping", desc: "Tradition trifft modernes 3D-Modeling." },
    { title: "Symbolische Objekte", desc: "Künstlerische Objekte jenseits klassischen Schmucks." },
  ]},
};
const JEWELRY_PROCESS = {
  pl: { tag: "Od pomysłu do dzieła", title: "Jak powstaje Twoja biżuteria", steps: [
    { num: "01", title: "Konsultacja", desc: "Zaczynamy od rozmowy — Twoja wizja, symbolika, styl życia i budżet.", when: "Każdy projekt na zamówienie" },
    { num: "02", title: "Projekt i CAD", desc: "Ręczne szkice ewoluują w precyzyjne modele 3D CAD.", when: "Każdy projekt na zamówienie" },
    { num: "03", title: "Wzór z wosku / druk 3D", desc: "Powstaje fizyczny prototyp — ręcznie rzeźbiony lub drukowany w żywicy.", when: "Pierścionki, wisiorki, formy złożone" },
    { num: "04", title: "Odlew metodą traconego wosku", desc: "Zatwierdzony model w ceramicznej skorupie, do której wlewamy stopione srebro lub złoto.", when: "Elementy odlewane" },
    { num: "05", title: "Wykonanie ręczne i wykończenie", desc: "Polerowanie, lutowanie, teksturowanie. Powierzchnie polerowane środkami tripoli.", when: "Każdy egzemplarz" },
    { num: "06", title: "Osadzanie kamieni i kontrola jakości", desc: "Kamienie osadzane ręcznie w łapach, koronkach lub kanale. Inspekcja pod lupą.", when: "Egzemplarze z kamieniami" },
  ]},
  en: { tag: "From Idea to Masterpiece", title: "How Your Jewelry Is Made", steps: [
    { num: "01", title: "Consultation", desc: "We start with a conversation — your vision, symbolism, lifestyle, and budget.", when: "Every custom project" },
    { num: "02", title: "Design & CAD", desc: "Hand sketches evolve into precise 3D CAD models. We iterate until the design is perfect.", when: "Every custom project" },
    { num: "03", title: "Wax Model / 3D Print", desc: "A physical prototype is hand-carved in wax or 3D-printed in resin.", when: "Cast pieces" },
    { num: "04", title: "Lost-Wax Casting", desc: "The model is encased in a ceramic shell; molten silver or gold is poured in.", when: "Cast pieces" },
    { num: "05", title: "Hand Fabrication & Finishing", desc: "Filing, soldering, texturing, hand-polishing with tripoli and rouge compounds.", when: "Every piece" },
    { num: "06", title: "Stone Setting & QC", desc: "Hand-set gemstones (prong, bezel, channel). Final inspection under magnification.", when: "Pieces with gemstones" },
  ]},
  de: { tag: "Von der Idee zum Meisterwerk", title: "Wie Ihr Schmuck entsteht", steps: [
    { num: "01", title: "Beratung", desc: "Wir beginnen mit einem Gespräch.", when: "Jedes individuelle Projekt" },
    { num: "02", title: "Design & CAD", desc: "Skizzen werden zu präzisen 3D-Modellen.", when: "Jedes individuelle Projekt" },
    { num: "03", title: "Wachsmodell / 3D-Druck", desc: "Ein physischer Prototyp entsteht.", when: "Gegossene Stücke" },
    { num: "04", title: "Wachsausschmelzguss", desc: "Silber oder Gold wird gegossen.", when: "Gegossene Stücke" },
    { num: "05", title: "Handfertigung", desc: "Feilen, Löten, Texturieren von Hand.", when: "Jedes Stück" },
    { num: "06", title: "Steinfassung & QC", desc: "Edelsteine werden von Hand gefasst.", when: "Stücke mit Edelsteinen" },
  ]},
};
const JEWELRY_PRICING_COPY = {
  pl: { tag: "Orientacyjne ceny", title: "Ile kosztuje biżuteria?", note: "Ceny orientacyjne — dokładna wycena w kalkulatorze.", cta: "Wyceń w kalkulatorze", from: "od" },
  en: { tag: "Indicative pricing", title: "How much does jewelry cost?", note: "Indicative prices — use the calculator for an exact quote.", cta: "Get a quote", from: "from" },
  de: { tag: "Richtpreise", title: "Was kostet Schmuck?", note: "Richtpreise — der Rechner liefert ein exaktes Angebot.", cta: "Zum Rechner", from: "ab" },
};
const JEWELRY_PRICING_ITEMS = [
  { pl: "Srebrny pierścionek", en: "Silver ring", de: "Silberring", pln: 250, eur: 60 },
  { pl: "Srebrne kolczyki", en: "Silver earrings", de: "Silberohrringe", pln: 180, eur: 40 },
  { pl: "Złoty pierścionek 14K", en: "Gold ring 14K", de: "Goldring 14K", pln: 900, eur: 210 },
  { pl: "Złoty wisiorek 14K", en: "Gold pendant 14K", de: "Goldanhänger 14K", pln: 600, eur: 140 },
  { pl: "Pierścionek z kamieniem", en: "Ring with gemstone", de: "Ring mit Edelstein", pln: 350, eur: 80 },
  { pl: "Pierścionek zaręczynowy", en: "Engagement ring", de: "Verlobungsring", pln: 1200, eur: 280 },
];

const STUDIO_HERO = {
  pl: { tag: "Technologia & Inżynieria", title: "AEJaCA sTuDiO", desc: "Zaawansowane studio produkcji kreatywnej. Druk 3D, grawer laserowy, prototypowanie i produkcja na zamówienie — od pomysłu do fizycznego produktu." },
  en: { tag: "Technology & Engineering", title: "AEJaCA sTuDiO", desc: "Advanced creative fabrication studio. 3D printing, laser engraving, prototyping, and custom manufacturing — from idea to physical product." },
  de: { tag: "Technologie & Ingenieurkunst", title: "AEJaCA sTuDiO", desc: "Studio für kreative Fertigung — von der Idee zum physischen Produkt." },
};
const STUDIO_ABOUT = {
  pl: { eyebrow: "Podejście", title: "Innowacja spotyka precyzję",
        p1: "AEJaCA sTuDiO to techniczne i inżynierskie ramię marki. Łączymy fabrykację cyfrową, szybkie prototypowanie i kreatywną produkcję, by zmieniać idee w działające produkty.",
        p2: "Pojedynczy prototyp, krótka seria czy w pełni zindywidualizowane rozwiązanie techniczne — mamy narzędzia, wiedzę i doświadczenie." },
  en: { eyebrow: "The Approach", title: "Innovation Meets Precision",
        p1: "AEJaCA sTuDiO is the technical and engineering arm of the brand. We combine digital fabrication, rapid prototyping, and creative production to transform ideas into real, functional products.",
        p2: "Whether you need a single prototype, a small production run, or a fully customized solution — our studio has the tools, knowledge, and experience." },
  de: { eyebrow: "Der Ansatz", title: "Innovation trifft Präzision",
        p1: "AEJaCA sTuDiO ist der technische Zweig der Marke. Digitale Fertigung, Rapid Prototyping und kreative Produktion.",
        p2: "Ob Einzelprototyp oder Kleinserie — wir haben die Werkzeuge und das Wissen." },
};
const STUDIO_TECHS = {
  pl: { tag: "Nasze możliwości", title: "Technologie", items: [
    { icon: Cpu, title: "Projektowanie 3D (CAD)", desc: "Profesjonalne modelowanie 3D w Autodesk Fusion i Rhino." },
    { icon: Printer, title: "Druk 3D", desc: "FDM dla prototypów i części funkcjonalnych." },
    { icon: Zap, title: "Grawer laserem fibrowym", desc: "Wysokoprecyzyjny laser galwo do znakowania metali." },
    { icon: Flame, title: "Cięcie laserem CO₂", desc: "Drewno, akryl, szkło, skóra i tworzywa." },
    { icon: FileUp, title: "Odlewy z żywicy", desc: "Żywice UV i dwuskładnikowe." },
    { icon: Cpu, title: "Produkcja na zamówienie", desc: "NFC, smart tagi, gadżety promocyjne." },
  ]},
  en: { tag: "Our Capabilities", title: "Technologies", items: [
    { icon: Cpu, title: "3D Design (CAD)", desc: "Professional 3D modeling in Autodesk Fusion & Rhino." },
    { icon: Printer, title: "3D Printing", desc: "FDM 3D printing for rapid prototyping and small batches." },
    { icon: Zap, title: "Fiber Laser Engraving", desc: "High-precision galvo laser systems for marking metal, jewelry, and tools." },
    { icon: Flame, title: "CO2 Laser Cutting", desc: "Laser cutting and engraving on wood, acrylic, glass, leather, plastics." },
    { icon: FileUp, title: "Epoxy Resin Casting", desc: "UV and two-component resin for decorative objects and custom molds." },
    { icon: Cpu, title: "Custom Fabrication", desc: "NFC devices, smart tags, promotional products, bespoke components." },
  ]},
  de: { tag: "Unsere Fähigkeiten", title: "Technologien", items: [
    { icon: Cpu, title: "3D-Design (CAD)", desc: "Professionelles 3D-Modeling in Autodesk Fusion & Rhino." },
    { icon: Printer, title: "3D-Druck", desc: "FDM-3D-Druck für Prototyping und Kleinserien." },
    { icon: Zap, title: "Faserlasergravur", desc: "Galvo-Lasersysteme zum Markieren von Metall und Schmuck." },
    { icon: Flame, title: "CO₂-Laserschneiden", desc: "Laserschneiden auf Holz, Acryl, Glas, Leder." },
    { icon: FileUp, title: "Epoxidharzguss", desc: "UV- und zweikomponentige Harze." },
    { icon: Cpu, title: "Auftragsfertigung", desc: "NFC-Geräte, Smart Tags, technische Sonderteile." },
  ]},
};
const STUDIO_PROCESS = {
  pl: { tag: "Jak działamy", title: "Od pomysłu do produktu", steps: [
    { num: "01", title: "Pomysł", desc: "Podziel się koncepcją, szkicem lub referencją — słuchamy i doradzamy." },
    { num: "02", title: "Projekt 3D", desc: "Profesjonalne modelowanie CAD z iteracjami do zatwierdzenia." },
    { num: "03", title: "Prototyp", desc: "Druk 3D lub element wycięty laserem do testów." },
    { num: "04", title: "Produkcja", desc: "Finalny produkt wyprodukowany zgodnie ze specyfikacją." },
  ]},
  en: { tag: "How We Work", title: "From Idea to Product", steps: [
    { num: "01", title: "Idea", desc: "Share your concept, sketch, or reference — we listen and advise." },
    { num: "02", title: "3D Design", desc: "Professional CAD modeling with iterations until you approve." },
    { num: "03", title: "Prototype", desc: "3D printed or laser-cut prototype for testing and validation." },
    { num: "04", title: "Production", desc: "Final product manufactured to exact specifications." },
  ]},
  de: { tag: "Wie wir arbeiten", title: "Von der Idee zum Produkt", steps: [
    { num: "01", title: "Idee", desc: "Teilen Sie Ihre Vision — wir hören zu." },
    { num: "02", title: "3D-Design", desc: "Professionelles CAD-Modeling mit Iterationen." },
    { num: "03", title: "Prototyp", desc: "3D-Druck oder Laserschnitt-Prototyp." },
    { num: "04", title: "Produktion", desc: "Finales Produkt nach exakter Spezifikation." },
  ]},
};
const STUDIO_PRICING_COPY = {
  pl: { tag: "Orientacyjne ceny", title: "Ile kosztują usługi sTuDiO?", note: "Ceny orientacyjne — dokładna wycena po wgraniu pliku STL/SVG.", cta: "Wyceń swój projekt", from: "od" },
  en: { tag: "Indicative pricing", title: "How much do sTuDiO services cost?", note: "Indicative prices — upload your STL/SVG for an exact quote.", cta: "Quote your project", from: "from" },
  de: { tag: "Richtpreise", title: "Was kosten sTuDiO-Dienste?", note: "Richtpreise — laden Sie Ihre STL/SVG für ein exaktes Angebot hoch.", cta: "Projekt kalkulieren", from: "ab" },
};
const STUDIO_PRICING_ITEMS = [
  { pl: "Druk 3D FDM (PLA/PETG)", en: "3D print FDM (PLA/PETG)", de: "3D-Druck FDM (PLA/PETG)", pln: 25, eur: 6 },
  { pl: "Wycinanie laserem CO₂", en: "CO₂ laser cutting", de: "CO₂-Laserschneiden", pln: 30, eur: 7 },
  { pl: "Grawer laserowy CO₂", en: "CO₂ laser engraving", de: "CO₂-Lasergravur", pln: 15, eur: 4 },
  { pl: "Znakowanie laserem fibrowym", en: "Fiber laser marking", de: "Faserlasermarkierung", pln: 20, eur: 5 },
  { pl: "Odlew żywiczny", en: "Resin casting", de: "Harzguss", pln: 40, eur: 10 },
];

/* ----------------------------------------------------------------
   Compositions
   ---------------------------------------------------------------- */

function JewelryPage({ lang }) {
  return (
    <div className="brand-jewelry" style={{ background: "var(--bg-page)" }}>
      <PageHero img="../../assets/hero-jewelry.webp" {...JEWELRY_HERO[lang]} serif />
      <AboutIntro {...JEWELRY_ABOUT[lang]} serif />
      <IndicativePricing lang={lang} items={JEWELRY_PRICING_ITEMS} copy={JEWELRY_PRICING_COPY[lang]} />
      <ServicesGrid {...JEWELRY_SERVICES[lang]} serif />
      <ProcessTimeline {...JEWELRY_PROCESS[lang]} serif />
    </div>
  );
}

function StudioPage({ lang }) {
  return (
    <div className="brand-studio" style={{ background: "var(--bg-page)" }}>
      <PageHero img="../../assets/hero-studio.webp" {...STUDIO_HERO[lang]} serif={false} />
      <AboutIntro {...STUDIO_ABOUT[lang]} serif={false} />
      <IndicativePricing lang={lang} items={STUDIO_PRICING_ITEMS} copy={STUDIO_PRICING_COPY[lang]} />
      <ServicesGrid {...STUDIO_TECHS[lang]} serif={false} />
      <ProcessTimeline {...STUDIO_PROCESS[lang]} serif={false} />
    </div>
  );
}

/* ----------------------------------------------------------------
   Contact + About (stubs)
   ---------------------------------------------------------------- */

function Field({ label, placeholder, textarea = false, type = "text" }) {
  const [focus, setFocus] = React.useState(false);
  const base = {
    width: "100%", padding: "12px 14px",
    background: "var(--bg-elevated)",
    border: `1px solid ${focus ? "var(--accent)" : "var(--border-default)"}`,
    borderRadius: 8, color: "var(--fg-1)", fontSize: 14, fontFamily: "var(--font-ui)",
    outline: "none", boxShadow: focus ? "0 0 0 3px var(--accent-soft)" : "none",
    transition: "all 200ms", boxSizing: "border-box",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>{label}</label>
      {textarea
        ? <textarea rows={5} placeholder={placeholder} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={{ ...base, minHeight: 120, resize: "vertical" }} />
        : <input type={type} placeholder={placeholder} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={base} />
      }
    </div>
  );
}

function ContactPage() {
  const [sent, setSent] = React.useState(false);
  const [interest, setInterest] = React.useState("jewelry");
  return (
    <section className="brand-jewelry" style={{ padding: "80px 16px", background: "var(--bg-page)", minHeight: 600 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <Eyebrow style={{ marginBottom: 18 }}>Get in Touch</Eyebrow>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 52, fontWeight: 600, color: "var(--fg-1)", margin: "0 0 14px", letterSpacing: "-0.02em" }}>Contact Us</h1>
          <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>Custom jewelry, personalized products, technical prototypes, or just a question — we'd love to hear from you.</p>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: 48, background: "var(--accent-soft)", border: "1px solid var(--border-accent)", borderRadius: 16 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--fg-1)", margin: "0 0 10px" }}>Thank you!</h2>
            <p style={{ color: "var(--fg-2)", margin: "0 0 18px" }}>We'll get back to you shortly. For urgent matters, email us directly at contact@aejaca.com.</p>
            <a onClick={(e) => { e.preventDefault(); setSent(false); }} href="#" style={{ color: "var(--accent)", fontSize: 14, fontWeight: 600 }}>Send another message →</a>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            style={{ display: "grid", gap: 20, padding: 36, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Name" placeholder="Your name" />
              <Field label="Email" placeholder="your@email.com" type="email" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>I'm interested in</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { v: "jewelry", l: "Custom Jewelry" },
                  { v: "studio", l: "Technical Services (sTuDiO)" },
                  { v: "both", l: "Both — Jewelry & Studio" },
                  { v: "other", l: "Other" },
                ].map((o) => (
                  <button key={o.v} type="button" onClick={() => setInterest(o.v)}
                    style={{
                      padding: "8px 14px", borderRadius: 9999,
                      border: `1px solid ${interest === o.v ? "var(--accent)" : "var(--border-default)"}`,
                      background: interest === o.v ? "var(--accent-soft)" : "var(--bg-page)",
                      color: interest === o.v ? "var(--accent-hover)" : "var(--fg-2)",
                      fontSize: 13, fontFamily: "var(--font-ui)", cursor: "pointer",
                      fontWeight: interest === o.v ? 600 : 500,
                      transition: "all 200ms",
                    }}>{o.l}</button>
                ))}
              </div>
            </div>
            <Field label="Message" placeholder="Tell us about your project or idea…" textarea />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" onClick={() => setSent(true)}>Send Message</Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="brand-jewelry" style={{ padding: "120px 16px", textAlign: "center", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Eyebrow style={{ marginBottom: 18 }}>The Studio</Eyebrow>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 52, fontWeight: 600, color: "var(--fg-1)", margin: "0 0 22px", letterSpacing: "-0.02em" }}>About AEJaCA</h1>
        <p style={{ color: "var(--fg-2)", fontSize: 18, lineHeight: 1.7, margin: "0 0 22px" }}>
          AEJaCA is a small Polish studio that combines two crafts under one roof — fine handcrafted jewelry and digital fabrication. Founded by Artur Hebenstreit in Chełmża, Poland, with clients across the EU, UK, and beyond.
        </p>
        <p style={{ color: "var(--fg-4)", fontSize: 13, fontStyle: "italic", margin: 0 }}>This page in the kit is a stub — the live site has full content here.</p>
      </div>
    </section>
  );
}

Object.assign(window, { JewelryPage, StudioPage, ContactPage, AboutPage });
