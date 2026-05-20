/* AEJaCA — Light/premium variant exploration.
   Each artboard renders the same "title page" content under a
   different theme so the user can compare palette + type + tone. */

/* ----------------------------------------------------------------
   Theme tokens — one object per variant.
   ---------------------------------------------------------------- */

const THEMES = {
  dark: {
    label: "Current dark",
    vibe: "AEJaCA today — premium, editorial, low-key",
    brandSplit: "Same canvas for Jewelry + sTuDiO; only typography & accent differ",
    bg: "#0a0a0a",
    surface: "rgba(255,255,255,0.02)",
    surfaceHover: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
    borderAccent: "rgba(245,158,11,0.30)",
    fg1: "#ffffff",
    fg2: "#d4d4d4",
    fg3: "#a3a3a3",
    fg4: "#737373",
    accent: "#f59e0b",
    accentHover: "#fcd34d",
    accentSoft: "rgba(245,158,11,0.10)",
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "Inter, system-ui, sans-serif",
    heroScrim: "linear-gradient(180deg, rgba(10,10,10,0.40) 0%, rgba(10,10,10,0.85) 70%, #0a0a0a 100%)",
    btnBg: "#fff",
    btnFg: "#000",
  },

  museum: {
    label: "Museum white",
    vibe: "Cartier · Van Cleef · Bvlgari",
    brandSplit: "Restrained — black wordmark, refined gold serif accent",
    bg: "#ffffff",
    surface: "#FAFAF8",
    surfaceHover: "#F4F2EC",
    border: "#E5E3DC",
    borderAccent: "#C9A961",
    fg1: "#0A0A0A",
    fg2: "#3D3D3D",
    fg3: "#6B6B6B",
    fg4: "#9B9B9B",
    accent: "#8B6914",   // deep antique gold
    accentHover: "#5C4509",
    accentSoft: "#F5EBD8",
    accentLight: "#E6C580",  // bright tone for white-on-dark hero use
    fontDisplay: "'Playfair Display', 'Bodoni Moda', Georgia, serif",
    fontBody: "Inter, system-ui, sans-serif",
    heroScrim: "linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.25) 40%, rgba(255,255,255,0.55) 75%, #ffffff 100%)",
    btnBg: "#0A0A0A",
    btnFg: "#FAFAF8",
  },

  cream: {
    label: "Warm cream",
    vibe: "Mejuri · Catbird · Missoma",
    brandSplit: "Hospitable, lifestyle — cream canvas, champagne gold, warm gray text",
    bg: "#F8F4ED",
    surface: "#FFFFFF",
    surfaceHover: "#FBF7EF",
    border: "#E0D5BC",
    borderAccent: "#A0742B",
    fg1: "#1F1A14",
    fg2: "#4A4138",
    fg3: "#6B5F4F",
    fg4: "#8F8170",
    accent: "#A87425",        // stronger champagne against cream
    accentHover: "#7A5217",    // deeper rich gold for eyebrows / hover states
    accentSoft: "#EDDDB6",
    accentLight: "#E6C580",    // luminous champagne for hero (on dark scrim)
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "Inter, system-ui, sans-serif",
    heroScrim: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 40%, rgba(248,244,237,0.55) 75%, #F8F4ED 100%)",
    btnBg: "#1F1A14",
    btnFg: "#F8F4ED",
  },

  boutique: {
    label: "Champagne boutique",
    vibe: "Ana Khouri · Aurate · Loquet",
    brandSplit: "Editorial-rich — sand canvas, sage accent, brass details",
    bg: "#EDE6D5",
    surface: "#F7F2E3",
    surfaceHover: "#F2EBDA",
    border: "#D8CFB8",
    borderAccent: "#7A8460",
    fg1: "#2D2A20",
    fg2: "#5A5340",
    fg3: "#7A7158",
    fg4: "#9F9577",
    accent: "#5D6E3F",   // sage olive
    accentHover: "#3F4C29",
    accentSoft: "#DFE2CE",
    accentLight: "#B8C594",  // bright sage for hero
    fontDisplay: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    fontBody: "Inter, system-ui, sans-serif",
    heroScrim: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 40%, rgba(237,230,213,0.55) 75%, #EDE6D5 100%)",
    btnBg: "#2D2A20",
    btnFg: "#EDE6D5",
  },

  studioLight: {
    label: "sTuDiO Light (technical)",
    vibe: "Bambu Lab · Formlabs · Prusa",
    brandSplit: "Cool light, blueprint blue — keeps a hard split from Jewelry",
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    surfaceHover: "#EEF1F5",
    border: "#D9DFE8",
    borderAccent: "#2563EB",
    fg1: "#0F172A",
    fg2: "#334155",
    fg3: "#64748B",
    fg4: "#94A3B8",
    accent: "#2563EB",
    accentHover: "#1D4ED8",
    accentSoft: "#DBEAFE",
    accentLight: "#93C5FD",   // bright blueprint blue for hero
    fontDisplay: "Inter, system-ui, sans-serif",
    fontBody: "Inter, system-ui, sans-serif",
    heroScrim: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 40%, rgba(244,246,249,0.60) 75%, #F4F6F9 100%)",
    btnBg: "#0F172A",
    btnFg: "#fff",
  },
};

/* ----------------------------------------------------------------
   Content (same across themes so they're directly comparable).
   ---------------------------------------------------------------- */

const JEWELRY_CONTENT = {
  eyebrow: "ARTISTIC & LUXURY",
  title: "AEJaCA Jewelry",
  subtitle:
    "Handcrafted jewelry with soul. Natural gemstones, precious metals, and artistic design — each piece is a unique story.",
  aboutEyebrow: "THE PHILOSOPHY",
  aboutTitle: "Where Art Meets Craftsmanship",
  aboutBody:
    "AEJaCA represents the artistic and luxury side of the brand. Every piece is handcrafted with meticulous attention to detail, combining traditional silversmithing techniques with modern 3D design.",
  pricingEyebrow: "INDICATIVE PRICING",
  pricingTitle: "From silver to gold",
  ctaPrimary: "Discover the collection",
  ctaSecondary: "Start a custom project",
  pricing: [
    { label: "Silver ring", price: "from €60" },
    { label: "Gold ring 14K", price: "from €210" },
    { label: "Engagement ring", price: "from €280" },
  ],
  heroImage: "../../assets/hero-jewelry.webp",
};

const STUDIO_CONTENT = {
  eyebrow: "TECHNOLOGY & ENGINEERING",
  title: "AEJaCA sTuDiO",
  subtitle:
    "Advanced creative fabrication studio. 3D printing, laser engraving, prototyping, and custom manufacturing — from idea to physical product.",
  aboutEyebrow: "THE APPROACH",
  aboutTitle: "Innovation Meets Precision",
  aboutBody:
    "We combine digital fabrication, rapid prototyping, and creative production to transform ideas into real, functional products. From single prototype to small batch.",
  pricingEyebrow: "INDICATIVE PRICING",
  pricingTitle: "Per-service starting points",
  ctaPrimary: "Quote a project",
  ctaSecondary: "Browse capabilities",
  pricing: [
    { label: "3D print FDM", price: "from €6" },
    { label: "CO₂ engraving", price: "from €4" },
    { label: "Fiber marking", price: "from €5" },
  ],
  heroImage: "../../assets/hero-studio.webp",
};

/* ----------------------------------------------------------------
   Themed page renderer
   ---------------------------------------------------------------- */

/* Section eyebrow: uppercase tag flanked by hairlines on light variants.
   Kept identical between hero and inner sections so the rhythm reads
   consistently down the whole page. */
function SectionEyebrow({ children, color, fontBody, isLight, hairlineWidth = 24 }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {isLight && (
        <span style={{ width: hairlineWidth, height: 1, background: color, opacity: 0.65 }} />
      )}
      <span
        style={{
          fontSize: 12,
          letterSpacing: "0.32em",
          fontWeight: 600,
          color,
          fontFamily: fontBody,
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
      {isLight && (
        <span style={{ width: hairlineWidth, height: 1, background: color, opacity: 0.65 }} />
      )}
    </div>
  );
}

function ThemedTitlePage({ theme, content, accentName = "amber" }) {
  const t = theme;
  const isLight = t.bg !== "#0a0a0a";
  // INNER sections (about, pricing): darker eyebrow on light bg / accent on dark.
  const innerEyebrowColor = isLight ? t.accentHover : t.accent;
  // HERO eyebrow sits on a darkened scrim regardless of theme — use the light
  // accent variant so it pops against a dark background.
  const heroEyebrowColor = t.accentLight || t.accent;
  // Hero text is ALWAYS white-over-scrim (dark theme: white anyway; light themes:
  // we darken the photo with the scrim and stick white text on top).
  const heroTitleColor = "#ffffff";
  const heroSubtitleColor = "rgba(255,255,255,0.88)";
  return (
    <div
      style={{
        background: t.bg,
        color: t.fg1,
        fontFamily: t.fontBody,
        width: 720,
        minHeight: 1100,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hero */}
      <section style={{ position: "relative", height: 380, overflow: "hidden" }}>
        <img
          src={content.heroImage}
          alt={content.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: t.heroScrim }} />
        <div style={{ position: "relative", padding: "70px 40px 60px", textAlign: "center" }}>
          {/* Hero eyebrow — smaller, lighter accent on the darkened scrim */}
          <div style={{ marginBottom: 18 }}>
            <SectionEyebrow color={heroEyebrowColor} fontBody={t.fontBody} isLight={true} hairlineWidth={28}>
              {content.eyebrow}
            </SectionEyebrow>
          </div>
          <h1
            style={{
              fontFamily: t.fontDisplay,
              fontSize: 48,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: heroTitleColor,
              margin: "0 0 14px",
              lineHeight: 1.05,
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
            }}
          >
            {content.title}
          </h1>
          <p
            style={{
              color: heroSubtitleColor,
              fontSize: 14,
              maxWidth: 440,
              margin: "0 auto",
              lineHeight: 1.6,
              fontWeight: 400,
              textShadow: "0 1px 8px rgba(0,0,0,0.40)",
            }}
          >
            {content.subtitle}
          </p>
        </div>
      </section>

      {/* About */}
      <section style={{ padding: "72px 40px 40px", textAlign: "center" }}>
        <SectionEyebrow color={innerEyebrowColor} fontBody={t.fontBody} isLight={isLight}>{content.aboutEyebrow}</SectionEyebrow>
        <h2
          style={{
            fontFamily: t.fontDisplay,
            fontSize: 38,
            fontWeight: 600,
            color: t.fg1,
            margin: "18px 0 20px",
            letterSpacing: "-0.015em",
            lineHeight: 1.15,
          }}
        >
          {content.aboutTitle}
        </h2>
        <p style={{ color: t.fg2, fontSize: 17, lineHeight: 1.7, margin: "0 auto", maxWidth: 540 }}>
          {content.aboutBody}
        </p>
      </section>

      {/* Pricing */}
      <section style={{ padding: "40px 40px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <SectionEyebrow color={innerEyebrowColor} fontBody={t.fontBody} isLight={isLight}>{content.pricingEyebrow}</SectionEyebrow>
          <h3
            style={{
              fontFamily: t.fontDisplay,
              fontSize: 26,
              fontWeight: 600,
              color: t.fg1,
              margin: "14px 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            {content.pricingTitle}
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {content.pricing.map((p, i) => (
            <div
              key={i}
              style={{
                padding: "22px 16px",
                borderRadius: 12,
                background: t.surface,
                border: `1px solid ${t.border}`,
                textAlign: "center",
              }}
            >
              <div style={{
                color: innerEyebrowColor,
                fontSize: 10,
                marginBottom: 10,
                letterSpacing: "0.22em",
                fontWeight: 600,
                textTransform: "uppercase",
              }}>
                {p.label}
              </div>
              <div
                style={{
                  fontFamily: t.fontDisplay,
                  fontSize: 22,
                  fontWeight: 600,
                  color: t.fg1,
                }}
              >
                {p.price}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section style={{ padding: "0 40px 80px", display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          style={{
            padding: "14px 28px",
            background: t.btnBg,
            color: t.btnFg,
            border: "none",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.04em",
            fontFamily: t.fontBody,
            cursor: "pointer",
          }}
        >
          {content.ctaPrimary} →
        </button>
        <button
          style={{
            padding: "14px 28px",
            background: "transparent",
            color: t.fg1,
            border: `1px solid ${t.border}`,
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: t.fontBody,
            cursor: "pointer",
          }}
        >
          {content.ctaSecondary}
        </button>
      </section>

      {/* Theme info footer (small) */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          padding: "0 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          color: t.fg4,
          fontFamily: "ui-monospace, Menlo, monospace",
          letterSpacing: "0.05em",
        }}
      >
        <span>
          bg {t.bg} · accent {t.accent}
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          {[t.accent, t.fg1, t.surface, t.border].map((c, i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: c,
                boxShadow: `0 0 0 1px ${t.border}`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   App — assemble canvas
   ---------------------------------------------------------------- */

const STUDIO_DARK_THEME = {
  ...THEMES.dark,
  accent: "#3b82f6",
  accentHover: "#93c5fd",
  accentSoft: "rgba(59,130,246,0.10)",
  fontDisplay: "Inter, system-ui, sans-serif",
};

function App() {
  const jewelryThemes = [
    { id: "museum", theme: THEMES.museum },
    { id: "cream", theme: THEMES.cream },
    { id: "boutique", theme: THEMES.boutique },
    { id: "dark", theme: THEMES.dark },
  ];

  return (
    <DesignCanvas>
      <DCSection
        id="jewelry-light"
        title="AEJaCA Jewelry — light premium directions"
        subtitle="Three light variants plus the current dark for reference. Same content, same hero photo, same components — only palette and typography change."
      >
        {jewelryThemes.map(({ id, theme }) => (
          <DCArtboard
            key={id}
            id={`jewelry-${id}`}
            label={`${theme.label} · ${theme.vibe}`}
            width={720}
            height={1100}
          >
            <ThemedTitlePage theme={theme} content={JEWELRY_CONTENT} />
          </DCArtboard>
        ))}
      </DCSection>

      <DCSection
        id="studio-split"
        title="AEJaCA sTuDiO — keep the brand split visible"
        subtitle="Whichever direction you pick for Jewelry, sTuDiO needs its own visual handwriting. Two options: stay with the current dark technical, or move to the light blueprint variant — both read instantly different from any Jewelry variant."
      >
        <DCArtboard id="studio-dark" label="sTuDiO Dark — current" width={720} height={1100}>
          <ThemedTitlePage theme={STUDIO_DARK_THEME} content={STUDIO_CONTENT} />
        </DCArtboard>
        <DCArtboard
          id="studio-light"
          label="sTuDiO Light — blueprint, Bambu Lab-ish"
          width={720}
          height={1100}
        >
          <ThemedTitlePage theme={THEMES.studioLight} content={STUDIO_CONTENT} />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
