/* AEJaCA — Sub-page templates: Jewelry, sTuDiO, Contact, About.
   These are full-fidelity recreations of the "strona tytułowa"
   (title page) hero + opening sections from src/pages/Jewelry.jsx
   and src/pages/Studio.jsx. */

/* ----------------------------------------------------------------
   Shared section primitives
   ---------------------------------------------------------------- */

function SectionHead({ accent = "amber", tag, title, desc, serif = true, align = "center" }) {
  return (
    <div style={{ maxWidth: 720, margin: align === "center" ? "0 auto" : 0, textAlign: align, marginBottom: 40 }}>
      <Eyebrow variant={accent} style={{ marginBottom: 14 }}>{tag}</Eyebrow>
      <h2 style={{
        fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
        fontSize: 36, fontWeight: 600, color: "#fff",
        margin: "0 0 16px", letterSpacing: "-0.01em", lineHeight: 1.15,
      }}>{title}</h2>
      {desc && <p style={{ color: "var(--fg-3)", fontSize: 16, lineHeight: 1.65, margin: 0 }}>{desc}</p>}
    </div>
  );
}

function PageHero({ accent = "amber", img, tag, title, desc, serif = true }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: 520 }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(10,10,10,0.40) 0%, rgba(10,10,10,0.80) 60%, var(--bg-page) 100%)",
        }} />
      </div>
      <div style={{ position: "relative", maxWidth: 1024, margin: "0 auto", padding: "120px 24px 140px", textAlign: "center" }}>
        <Eyebrow variant={accent} style={{ marginBottom: 18 }}>{tag}</Eyebrow>
        <h1 style={{
          fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
          fontSize: "clamp(44px, 7vw, 72px)",
          fontWeight: 600, letterSpacing: "-0.025em",
          color: "#fff", margin: "0 0 22px", lineHeight: 1.02,
        }}>{title}</h1>
        <p style={{ color: "var(--fg-2)", fontSize: 19, maxWidth: 640, margin: "0 auto", lineHeight: 1.6, textWrap: "pretty" }}>{desc}</p>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Indicative pricing card — same vocabulary on both subpages.
   ---------------------------------------------------------------- */

function IndicativePricing({ accent = "amber", lang, items, copy }) {
  const showEur = lang === "en" || lang === "de";
  const accentColor = accent === "blue" ? "var(--blue-500)" : "var(--amber-500)";
  const accentHover = accent === "blue" ? "var(--blue-300)" : "var(--amber-300)";

  return (
    <section style={{ padding: "80px 16px", background: "rgba(23,23,23,0.40)" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <SectionHead
          accent={accent}
          tag={copy.tag}
          title={copy.title}
          desc={copy.note}
          serif={accent === "amber"}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}>
          {items.map((it, i) => {
            const label = it[lang] || it.en;
            const primary = showEur ? `€${it.eur}` : `${it.pln} zł`;
            const secondary = showEur ? `${it.pln} zł` : `€${it.eur}`;
            return (
              <div key={i} style={{
                padding: 22,
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-default)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                transition: "all 250ms var(--ease-editorial)",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent === "blue" ? "var(--border-blue-hi)" : "var(--border-amber-hi)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ color: "var(--fg-2)", fontSize: 14 }}>{label}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#fff", fontSize: 16 }}>{copy.from} {primary}</div>
                  <div style={{ fontFamily: "var(--font-mono)", color: "var(--fg-5)", fontSize: 11, marginTop: 2 }}>{secondary}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: accentColor, fontSize: 14, fontWeight: 500, textDecoration: "none",
              transition: "color 200ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = accentHover}
            onMouseLeave={(e) => e.currentTarget.style.color = accentColor}
          >
            {copy.cta} <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Process timeline — numbered steps, alternating left/right rails.
   ---------------------------------------------------------------- */

function ProcessTimeline({ accent = "amber", tag, title, steps, serif = true }) {
  const accentColor = accent === "blue" ? "var(--blue-500)" : "var(--amber-500)";
  const accentBorder = accent === "blue" ? "var(--border-blue)" : "var(--border-amber)";
  const accentBg = accent === "blue" ? "rgba(59,130,246,0.06)" : "rgba(245,158,11,0.06)";

  return (
    <section style={{ padding: "96px 16px", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <SectionHead accent={accent} tag={tag} title={title} serif={serif} />
        <div style={{ display: "grid", gap: 18 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              gap: 24,
              padding: 28,
              borderRadius: 16,
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              backdropFilter: "blur(16px)",
            }}>
              <div style={{
                fontFamily: "var(--font-serif)",
                fontSize: 44, fontWeight: 600,
                color: accentColor,
                lineHeight: 1, opacity: 0.85,
              }}>{step.num || String(i + 1).padStart(2, "0")}</div>
              <div>
                <h3 style={{
                  fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
                  fontSize: 20, fontWeight: 600, color: "#fff",
                  margin: "0 0 10px",
                }}>{step.title}</h3>
                <p style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.65, margin: "0 0 8px" }}>{step.desc}</p>
                {step.when && (
                  <p style={{ color: "var(--fg-5)", fontSize: 12, fontStyle: "italic", margin: 0 }}>{step.when}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Services / Technologies grid with icons.
   ---------------------------------------------------------------- */

function ServicesGrid({ accent = "amber", tag, title, items, serif = true }) {
  return (
    <section style={{ padding: "96px 16px", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <SectionHead accent={accent} tag={tag} title={title} serif={serif} />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}>
          {items.map((it, i) => {
            const IconComp = it.icon || Sparkles;
            return (
              <div key={i} style={{
                padding: 28,
                borderRadius: 16,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-default)",
                transition: "all 300ms var(--ease-editorial)",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent === "blue" ? "var(--border-blue-hi)" : "var(--border-amber-hi)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = accent === "blue"
                    ? "0 20px 40px -16px rgba(30,58,138,0.30)"
                    : "0 20px 40px -16px rgba(120,53,15,0.30)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 18,
                  background: accent === "blue" ? "rgba(59,130,246,0.08)" : "rgba(245,158,11,0.08)",
                  border: accent === "blue" ? "1px solid var(--border-blue)" : "1px solid var(--border-amber)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: accent === "blue" ? "var(--blue-400)" : "var(--amber-400)",
                }}>
                  <IconComp size={20} strokeWidth={1.6} />
                </div>
                <h3 style={{
                  fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
                  fontSize: 19, fontWeight: 600, color: "#fff",
                  margin: "0 0 10px",
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
   About-style two-paragraph intro that sits below the hero.
   ---------------------------------------------------------------- */

function AboutIntro({ accent = "amber", title, p1, p2, serif = true }) {
  return (
    <section style={{ padding: "96px 16px", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{
          fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
          fontSize: 38, fontWeight: 600, color: "#fff",
          margin: "0 0 22px", letterSpacing: "-0.01em", lineHeight: 1.15,
        }}>{title}</h2>
        <p style={{ color: "var(--fg-2)", fontSize: 17, lineHeight: 1.7, margin: "0 0 18px" }}>{p1}</p>
        <p style={{ color: "var(--fg-3)", fontSize: 16, lineHeight: 1.7, margin: 0 }}>{p2}</p>
      </div>
    </section>
  );
}

/* ================================================================
   COPY — Jewelry + Studio + Contact, in all three languages.
   Pulled directly from src/i18n/{pl,en,de}.js where possible.
   ================================================================ */

const JEWELRY_HERO = {
  pl: { tag: "Artystyczne & Luksusowe", title: "AEJaCA Jewelry", desc: "Biżuteria z duszą, robiona ręcznie. Naturalne kamienie, metale szlachetne i artystyczny projekt — każdy egzemplarz to osobna historia." },
  en: { tag: "Artistic & Luxury", title: "AEJaCA Jewelry", desc: "Handcrafted jewelry with soul. Natural gemstones, precious metals, and artistic design — each piece is a unique story." },
  de: { tag: "Künstlerisch & Luxuriös", title: "AEJaCA Jewelry", desc: "Handgefertigter Schmuck mit Seele. Naturedelsteine, Edelmetalle und künstlerisches Design — jedes Stück ist eine eigene Geschichte." },
};

const JEWELRY_ABOUT = {
  pl: { title: "Tam, gdzie sztuka spotyka rzemiosło",
        p1: "AEJaCA to artystyczna, luksusowa odsłona marki. Każdy egzemplarz biżuterii jest wykonywany ręcznie, z drobiazgową dbałością o detal, łącząc tradycyjne techniki złotnicze z nowoczesnym projektowaniem 3D.",
        p2: "Wierzymy, że biżuteria powinna nieść znaczenie. Każda kreacja ma wywoływać emocje, opowiadać historię i stać się ponadczasowym towarzyszem." },
  en: { title: "Where Art Meets Craftsmanship",
        p1: "AEJaCA represents the artistic and luxury side of the brand. Every piece of jewelry is handcrafted with meticulous attention to detail, combining traditional silversmithing techniques with modern 3D design and prototyping technologies.",
        p2: "We believe that jewelry should carry meaning. Each creation is designed to evoke emotion, tell a story, and become a timeless companion." },
  de: { title: "Wo Kunst auf Handwerk trifft",
        p1: "AEJaCA steht für die künstlerische, luxuriöse Seite der Marke. Jedes Schmuckstück wird mit akribischer Detailliebe handgefertigt — traditionelle Goldschmiedetechnik vereint mit modernem 3D-Design.",
        p2: "Wir glauben, dass Schmuck Bedeutung tragen sollte. Jede Kreation soll Emotion wecken, eine Geschichte erzählen und zum zeitlosen Begleiter werden." },
};

const JEWELRY_SERVICES_COPY = {
  pl: { tag: "Co tworzymy", title: "Produkty i usługi", items: [
    { icon: "Gem", title: "Biżuteria ręcznie wykonywana", desc: "Pierścionki, kolczyki, wisiorki i bransoletki ze srebra i złota, kończone ręcznie z precyzją." },
    { icon: "Sparkles", title: "Kamienie naturalne", desc: "Starannie dobrane szmaragdy, szafiry, ametysty i inne, oprawione w unikalne kompozycje." },
    { icon: "Palette", title: "Projekty na zamówienie", desc: "Od Twojej wizji do gotowego dzieła. Projektujemy i wykonujemy biżuterię na miarę Twojej historii." },
    { icon: "Heart", title: "Spersonalizowane prezenty", desc: "Wyjątkowe prezenty — grawerowane, dopasowane, niosące emocję." },
    { icon: "Wand2", title: "Projekt 3D i prototypowanie", desc: "Tradycyjne rzemiosło spotyka modelowanie 3D — prototyp przed produkcją." },
    { icon: "Crown", title: "Przedmioty symboliczne", desc: "Artystyczne obiekty i symbole, które wykraczają poza biżuterię — ponadczasowe pamiątki." },
  ]},
  en: { tag: "What We Create", title: "Products & Services", items: [
    { icon: "Gem", title: "Handcrafted Jewelry", desc: "Rings, earrings, pendants and bracelets made with silver and gold, finished by hand with precision." },
    { icon: "Sparkles", title: "Natural Gemstones", desc: "Carefully selected natural stones — emeralds, sapphires, amethysts — set into unique designs." },
    { icon: "Palette", title: "Custom Projects", desc: "From your vision to a finished piece. We design and create jewelry tailored to your story." },
    { icon: "Heart", title: "Personalized Gifts", desc: "Meaningful, one-of-a-kind gifts — engraved, customized, and made to carry emotion." },
    { icon: "Wand2", title: "3D Design & Prototyping", desc: "Combining traditional craftsmanship with modern 3D modeling to prototype and perfect each piece." },
    { icon: "Crown", title: "Symbolic Objects", desc: "Artistic objects and symbolic creations that go beyond jewelry — timeless keepsakes and art pieces." },
  ]},
  de: { tag: "Was wir erschaffen", title: "Produkte & Dienste", items: [
    { icon: "Gem", title: "Handgefertigter Schmuck", desc: "Ringe, Ohrringe, Anhänger und Armbänder aus Silber und Gold, mit Präzision per Hand veredelt." },
    { icon: "Sparkles", title: "Naturedelsteine", desc: "Sorgfältig ausgewählte Smaragde, Saphire, Amethyste — eingefasst in einzigartige Designs." },
    { icon: "Palette", title: "Individuelle Projekte", desc: "Von Ihrer Vision zum fertigen Stück. Wir gestalten Schmuck, der Ihre Geschichte erzählt." },
    { icon: "Heart", title: "Personalisierte Geschenke", desc: "Bedeutungsvolle Unikate — graviert, angepasst, emotional aufgeladen." },
    { icon: "Wand2", title: "3D-Design & Prototyping", desc: "Traditionelles Handwerk trifft modernes 3D-Modeling — wir perfektionieren jedes Stück vorab." },
    { icon: "Crown", title: "Symbolische Objekte", desc: "Künstlerische Objekte jenseits klassischen Schmucks — zeitlose Erinnerungsstücke." },
  ]},
};

const JEWELRY_PROCESS = {
  pl: { tag: "Od pomysłu do dzieła", title: "Jak powstaje Twoja biżuteria", steps: [
    { num: "01", title: "Konsultacja", desc: "Zaczynamy od rozmowy — Twoja wizja, symbolika, styl życia i budżet.", when: "Każdy projekt na zamówienie" },
    { num: "02", title: "Projekt i CAD", desc: "Ręczne szkice ewoluują w precyzyjne modele 3D CAD. Iterujemy, aż projekt będzie idealny.", when: "Każdy projekt na zamówienie" },
    { num: "03", title: "Wzór z wosku / druk 3D", desc: "Powstaje fizyczny prototyp — ręcznie rzeźbiony w wosku lub drukowany w żywicy.", when: "Pierścionki, wisiorki, formy złożone" },
    { num: "04", title: "Odlew metodą traconego wosku", desc: "Zatwierdzony model zamykany w ceramicznej skorupie, do której wlewamy stopione srebro lub złoto.", when: "Elementy odlewane" },
    { num: "05", title: "Wykonanie ręczne i wykończenie", desc: "Polerowanie, lutowanie, teksturowanie. Powierzchnie polerowane środkami tripoli i pasta polerska.", when: "Każdy egzemplarz" },
    { num: "06", title: "Osadzanie kamieni i kontrola jakości", desc: "Kamienie osadzane ręcznie w łapach, korazji lub kanale. Końcowa inspekcja pod lupą.", when: "Egzemplarze z kamieniami" },
  ]},
  en: { tag: "From Idea to Masterpiece", title: "How Your Jewelry Is Made", steps: [
    { num: "01", title: "Consultation", desc: "We start with a conversation — your vision, symbolism, lifestyle, and budget. Every great piece begins with understanding the story it should tell.", when: "Every custom project" },
    { num: "02", title: "Design & CAD", desc: "Hand sketches evolve into precise 3D CAD models. You see realistic digital renderings from every angle, and we iterate until the design is perfect.", when: "Every custom project" },
    { num: "03", title: "Wax Model / 3D Print", desc: "A physical prototype is created — either hand-carved in wax or 3D printed in resin. You can hold it, check proportions, and approve before we proceed.", when: "Cast pieces (rings, pendants, complex forms)" },
    { num: "04", title: "Lost-Wax Casting", desc: "The approved model is encased in a ceramic shell, heated to burn away the wax, and molten silver or gold is poured into the cavity.", when: "Cast pieces; hand-fabricated pieces skip this step" },
    { num: "05", title: "Hand Fabrication & Finishing", desc: "The cast piece is filed, soldered, textured, and shaped by hand. Surfaces are polished with tripoli and rouge compounds.", when: "Every piece — the artisan's signature touch" },
    { num: "06", title: "Stone Setting & Quality Control", desc: "Gemstones are hand-set using prong, bezel, or channel techniques. Final inspection under magnification.", when: "Pieces with gemstones" },
  ]},
  de: { tag: "Von der Idee zum Meisterwerk", title: "Wie Ihr Schmuck entsteht", steps: [
    { num: "01", title: "Beratung", desc: "Wir beginnen mit einem Gespräch — Ihre Vision, Symbolik, Lebensstil und Budget.", when: "Jedes individuelle Projekt" },
    { num: "02", title: "Design & CAD", desc: "Skizzen werden zu präzisen 3D-Modellen. Sie sehen realistische Renderings, wir iterieren bis zur Perfektion.", when: "Jedes individuelle Projekt" },
    { num: "03", title: "Wachsmodell / 3D-Druck", desc: "Ein physischer Prototyp entsteht — in Wachs geschnitzt oder im SLA-Druck.", when: "Gegossene Stücke" },
    { num: "04", title: "Wachsausschmelzguss", desc: "Das genehmigte Modell wird in einer Keramikform geschmolzen, Silber oder Gold gegossen.", when: "Gegossene Stücke" },
    { num: "05", title: "Handfertigung & Finish", desc: "Feilen, Löten, Texturieren von Hand. Politur mit Tripoli- und Rougepaste.", when: "Jedes Stück" },
    { num: "06", title: "Steinfassung & Qualitätskontrolle", desc: "Edelsteine werden von Hand gefasst — Krappen-, Zargen- oder Kanalfassung.", when: "Stücke mit Edelsteinen" },
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

/* ---------- Studio copy ---------- */

const STUDIO_HERO = {
  pl: { tag: "Technologia & Inżynieria", title: "AEJaCA sTuDiO", desc: "Zaawansowane studio produkcji kreatywnej. Druk 3D, grawer laserowy, prototypowanie i produkcja na zamówienie — od pomysłu do fizycznego produktu." },
  en: { tag: "Technology & Engineering", title: "AEJaCA sTuDiO", desc: "Advanced creative fabrication studio. 3D printing, laser engraving, prototyping, and custom manufacturing — from idea to physical product." },
  de: { tag: "Technologie & Ingenieurkunst", title: "AEJaCA sTuDiO", desc: "Studio für kreative Fertigung. 3D-Druck, Lasergravur, Prototyping und Auftragsfertigung — von der Idee zum physischen Produkt." },
};

const STUDIO_ABOUT = {
  pl: { title: "Innowacja spotyka precyzję",
        p1: "AEJaCA sTuDiO to techniczne i inżynierskie ramię marki. Łączymy fabrykację cyfrową, szybkie prototypowanie i kreatywną produkcję, by zmieniać idee w działające produkty.",
        p2: "Pojedynczy prototyp, krótka seria czy w pełni zindywidualizowane rozwiązanie techniczne — mamy narzędzia, wiedzę i doświadczenie, by dostarczyć z precyzją." },
  en: { title: "Innovation Meets Precision",
        p1: "AEJaCA sTuDiO is the technical and engineering arm of the brand. We combine digital fabrication, rapid prototyping, and creative production to transform ideas into real, functional products.",
        p2: "Whether you need a single prototype, a small production run, or a fully customized technical solution — our studio has the tools, knowledge, and experience to deliver with precision." },
  de: { title: "Innovation trifft Präzision",
        p1: "AEJaCA sTuDiO ist der technische, ingenieurnahe Zweig der Marke. Wir kombinieren digitale Fertigung, Rapid Prototyping und kreative Produktion.",
        p2: "Ob Einzelprototyp, Kleinserie oder vollständig individuelle technische Lösung — wir haben die Werkzeuge, das Wissen und die Erfahrung." },
};

const STUDIO_TECH_COPY = {
  pl: { tag: "Nasze możliwości", title: "Technologie", items: [
    { icon: "Cpu", title: "Projektowanie 3D (CAD)", desc: "Profesjonalne modelowanie 3D w Autodesk Fusion i Rhino — projekt produktu, prototyp, plik gotowy do produkcji." },
    { icon: "Printer", title: "Druk 3D", desc: "Druk 3D FDM dla szybkiego prototypowania, części funkcjonalnych i krótkich serii." },
    { icon: "Zap", title: "Grawer laserem fibrowym", desc: "Wysokoprecyzyjny laser galwo do znakowania metalu, biżuterii i komponentów technicznych." },
    { icon: "Flame", title: "Cięcie laserem CO₂", desc: "Cięcie i grawerowanie drewna, akrylu, szkła, skóry i tworzyw." },
    { icon: "Layers", title: "Odlewy z żywicy epoksydowej", desc: "Żywice UV i dwuskładnikowe — obiekty dekoracyjne, zatapianie, formy na zamówienie." },
    { icon: "Wrench", title: "Produkcja na zamówienie", desc: "NFC, smart tagi, produkty promocyjne, niestandardowe komponenty techniczne." },
  ]},
  en: { tag: "Our Capabilities", title: "Technologies", items: [
    { icon: "Cpu", title: "3D Design (CAD)", desc: "Professional 3D modeling in Autodesk Fusion & Rhino — product design, prototyping, and manufacturing-ready files." },
    { icon: "Printer", title: "3D Printing", desc: "FDM 3D printing for rapid prototyping, functional parts, and small batch production." },
    { icon: "Zap", title: "Fiber Laser Engraving", desc: "High-precision galvo laser systems for marking metal, jewelry, tools, and technical components." },
    { icon: "Flame", title: "CO2 Laser Cutting", desc: "Laser cutting and engraving on wood, acrylic, glass, leather, and plastics." },
    { icon: "Layers", title: "Epoxy Resin Casting", desc: "UV and two-component resin systems for decorative objects, encapsulation, and custom molds." },
    { icon: "Wrench", title: "Custom Fabrication", desc: "NFC devices, smart tags, promotional products, and bespoke technical components." },
  ]},
  de: { tag: "Unsere Fähigkeiten", title: "Technologien", items: [
    { icon: "Cpu", title: "3D-Design (CAD)", desc: "Professionelles 3D-Modeling in Autodesk Fusion & Rhino — Produktdesign, Prototyp, fertigungsbereite Dateien." },
    { icon: "Printer", title: "3D-Druck", desc: "FDM-3D-Druck für Rapid Prototyping, Funktionsteile und Kleinserien." },
    { icon: "Zap", title: "Faserlasergravur", desc: "Galvo-Lasersysteme zum Markieren von Metall, Schmuck und technischen Komponenten." },
    { icon: "Flame", title: "CO₂-Laserschneiden", desc: "Laserschneiden und -gravieren auf Holz, Acryl, Glas, Leder und Kunststoffen." },
    { icon: "Layers", title: "Epoxidharzguss", desc: "UV- und zweikomponentige Harze — Deko-Objekte, Einbettung, Sonderformen." },
    { icon: "Wrench", title: "Auftragsfertigung", desc: "NFC-Geräte, Smart Tags, Werbeartikel, technische Sonderteile." },
  ]},
};

const STUDIO_PROCESS = {
  pl: { tag: "Jak działamy", title: "Od pomysłu do produktu", steps: [
    { num: "01", title: "Pomysł", desc: "Podziel się koncepcją, szkicem lub referencją — słuchamy i doradzamy." },
    { num: "02", title: "Projekt 3D", desc: "Profesjonalne modelowanie CAD z iteracjami do zatwierdzenia." },
    { num: "03", title: "Prototyp", desc: "Druk 3D lub element wycięty laserem do testów i walidacji." },
    { num: "04", title: "Produkcja", desc: "Finalny produkt wyprodukowany zgodnie ze specyfikacją." },
  ]},
  en: { tag: "How We Work", title: "From Idea to Product", steps: [
    { num: "01", title: "Idea", desc: "Share your concept, sketch, or reference — we listen and advise." },
    { num: "02", title: "3D Design", desc: "Professional CAD modeling with iterations until you approve." },
    { num: "03", title: "Prototype", desc: "3D printed or laser-cut prototype for testing and validation." },
    { num: "04", title: "Production", desc: "Final product manufactured to exact specifications." },
  ]},
  de: { tag: "Wie wir arbeiten", title: "Von der Idee zum Produkt", steps: [
    { num: "01", title: "Idee", desc: "Teilen Sie Ihre Vision, Skizze oder Referenz — wir hören zu und beraten." },
    { num: "02", title: "3D-Design", desc: "Professionelles CAD-Modeling mit Iterationen bis zur Freigabe." },
    { num: "03", title: "Prototyp", desc: "3D-Druck oder Laserschnitt-Prototyp zum Testen und Validieren." },
    { num: "04", title: "Produktion", desc: "Finales Produkt nach exakter Spezifikation gefertigt." },
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

/* Icon name → component lookup (only the ones referenced above). */
const ICON_MAP = { Gem: Sparkles, Sparkles, Palette: Sparkles, Heart: Sparkles, Wand2: Sparkles, Crown: Sparkles, Cpu, Printer, Zap, Flame, Layers: FileUp, Wrench: Cpu };

function resolveIcons(items) {
  return items.map((it) => ({ ...it, icon: ICON_MAP[it.icon] || Sparkles }));
}

/* ================================================================
   Page compositions
   ================================================================ */

function JewelryPage({ lang }) {
  const hero = JEWELRY_HERO[lang];
  const about = JEWELRY_ABOUT[lang];
  const services = JEWELRY_SERVICES_COPY[lang];
  const proc = JEWELRY_PROCESS[lang];
  return (
    <div>
      <PageHero accent="amber" img="../../assets/hero-jewelry.webp" {...hero} serif />
      <AboutIntro accent="amber" {...about} serif />
      <IndicativePricing accent="amber" lang={lang} items={JEWELRY_PRICING_ITEMS} copy={JEWELRY_PRICING_COPY[lang]} />
      <ServicesGrid accent="amber" tag={services.tag} title={services.title} items={resolveIcons(services.items)} serif />
      <ProcessTimeline accent="amber" tag={proc.tag} title={proc.title} steps={proc.steps} serif />
    </div>
  );
}

function StudioPage({ lang }) {
  const hero = STUDIO_HERO[lang];
  const about = STUDIO_ABOUT[lang];
  const techs = STUDIO_TECH_COPY[lang];
  const proc = STUDIO_PROCESS[lang];
  return (
    <div>
      <PageHero accent="blue" img="../../assets/hero-studio.webp" {...hero} serif={false} />
      <AboutIntro accent="blue" {...about} serif={false} />
      <IndicativePricing accent="blue" lang={lang} items={STUDIO_PRICING_ITEMS} copy={STUDIO_PRICING_COPY[lang]} />
      <ServicesGrid accent="blue" tag={techs.tag} title={techs.title} items={resolveIcons(techs.items)} serif={false} />
      <ProcessTimeline accent="blue" tag={proc.tag} title={proc.title} steps={proc.steps} serif={false} />
    </div>
  );
}

/* ================================================================
   Contact / About (kept simple — these are stubs)
   ================================================================ */

function Field({ label, placeholder, textarea = false, type = "text" }) {
  const [focus, setFocus] = React.useState(false);
  const base = {
    width: "100%", padding: "12px 14px",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${focus ? "var(--amber-500)" : "var(--border-default)"}`,
    borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "var(--font-sans)",
    outline: "none", boxShadow: focus ? "0 0 0 3px rgba(245,158,11,0.18)" : "none",
    transition: "all 200ms", boxSizing: "border-box",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</label>
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
    <section style={{ padding: "80px 16px", background: "var(--bg-page)", minHeight: 600 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Eyebrow variant="amber" style={{ marginBottom: 14 }}>Get in Touch</Eyebrow>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 48, fontWeight: 600, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.02em" }}>Contact Us</h1>
          <p style={{ color: "var(--fg-3)", fontSize: 16, lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>Custom jewelry, personalized products, technical prototypes, or just a question — we'd love to hear from you.</p>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: 48, background: "rgba(52,211,153,0.06)", border: "1px solid var(--border-emerald)", borderRadius: 16 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "#fff", margin: "0 0 10px" }}>Thank you!</h2>
            <p style={{ color: "var(--fg-3)", margin: "0 0 18px" }}>We'll get back to you shortly. For urgent matters, email us directly at contact@aejaca.com.</p>
            <a onClick={(e) => { e.preventDefault(); setSent(false); }} href="#" style={{ color: "var(--amber-500)", fontSize: 14, fontWeight: 500 }}>Send another message →</a>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "grid", gap: 20, padding: 36, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-default)", borderRadius: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Name" placeholder="Your name" />
              <Field label="Email" placeholder="your@email.com" type="email" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>I'm interested in</label>
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
                      border: `1px solid ${interest === o.v ? "var(--amber-500)" : "var(--border-default)"}`,
                      background: interest === o.v ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.02)",
                      color: interest === o.v ? "var(--amber-300)" : "var(--fg-2)",
                      fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 200ms",
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
    <section style={{ padding: "120px 16px", textAlign: "center", background: "var(--bg-page)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Eyebrow variant="amber" style={{ marginBottom: 14 }}>The Studio</Eyebrow>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 48, fontWeight: 600, color: "#fff", margin: "0 0 18px", letterSpacing: "-0.02em" }}>About AEJaCA</h1>
        <p style={{ color: "var(--fg-3)", fontSize: 18, lineHeight: 1.7, margin: 0 }}>
          AEJaCA is a small Polish studio that combines two crafts under one roof — fine handcrafted jewelry and digital fabrication. Founded by Artur Hebenstreit in Chełmża, Poland, with clients across the EU, UK, and beyond.
        </p>
      </div>
    </section>
  );
}

Object.assign(window, { JewelryPage, StudioPage, ContactPage, AboutPage });
