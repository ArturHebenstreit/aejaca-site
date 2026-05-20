/* AEJaCA — home page cards (light variant).
   accent="amber" uses jewelry tokens; accent="blue" overrides locally
   to studio tokens by wrapping in .brand-studio. */

/* Wraps a child in the opposite brand's CSS variable context so the
   studio cards on the jewelry-themed home page get cobalt accents. */
function BrandScope({ brand, children, style = {} }) {
  return (
    <div className={brand === "studio" ? "brand-studio" : "brand-jewelry"} style={style}>
      {children}
    </div>
  );
}

/* Gateway tile — 3:4 photo + dark scrim + bright accent eyebrow + white title */
function GatewayTile({ img, eyebrow, desc, ctaLabel, accent = "amber", onClick }) {
  const [hover, setHover] = React.useState(false);
  const isStudio = accent === "blue";
  // accent-light reads bright on the dark scrim; pill bg picks accent
  const accentLight = isStudio ? "#93C5FD" : "#E6C580";
  const accentDark = isStudio ? "#2563EB" : "#A87425";
  const shadowHover = isStudio
    ? "0 25px 50px -12px rgba(30,58,138,0.40)"
    : "0 25px 50px -12px rgba(120,53,15,0.40)";

  return (
    <a
      onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
      href="#"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "block",
        overflow: "hidden",
        borderRadius: 16,
        cursor: "pointer",
        textDecoration: "none",
        boxShadow: hover ? shadowHover : "var(--shadow-card)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        transition: "all var(--dur-slow) var(--ease-editorial)",
      }}
    >
      <div style={{ aspectRatio: "3 / 4", position: "relative", overflow: "hidden" }}>
        <img
          src={img}
          alt={eyebrow}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover",
            transform: hover ? "scale(1.05)" : "scale(1)",
            transition: "transform var(--dur-reveal) var(--ease-editorial)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.30) 55%, transparent 80%)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 32, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase",
          fontWeight: 600, color: accentLight, marginBottom: 12,
          textShadow: "0 1px 4px rgba(0,0,0,0.50)",
        }}>
          <span style={{ width: 22, height: 1, background: accentLight, opacity: 0.7 }} />
          <span>{eyebrow}</span>
          <span style={{ width: 22, height: 1, background: accentLight, opacity: 0.7 }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 1.55, margin: "0 auto 20px", maxWidth: 320, textShadow: "0 1px 8px rgba(0,0,0,0.40)" }}>{desc}</p>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 9999,
            border: `1px solid ${hover ? accentDark : accentLight}`,
            background: hover ? accentDark : "rgba(0,0,0,0.20)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            fontSize: 14, letterSpacing: "0.02em", fontWeight: 500,
            transition: "all var(--dur-base) var(--ease-editorial)",
          }}
        >
          {ctaLabel} <ArrowRight size={14} style={{ transition: "transform var(--dur-base)", transform: hover ? "translateX(4px)" : "translateX(0)" }} />
        </span>
      </div>
    </a>
  );
}

/* QuickQuote card — light surface, accent gradient corner */
function QuickQuoteCardInner({ tag, title, desc, ctaLabel, icon: IconComp = Sparkles, serif = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
      href="#"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "block",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${hover ? "var(--border-accent)" : "var(--border-default)"}`,
        background: "var(--bg-elevated)",
        padding: 32,
        textDecoration: "none",
        boxShadow: hover ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all var(--dur-base) var(--ease-editorial)",
      }}
    >
      {/* Soft accent wash in corner */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 200, height: 200,
        background: "radial-gradient(circle, var(--accent-soft), transparent 70%)",
        opacity: 0.6, pointerEvents: "none",
      }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "var(--accent-soft)",
          border: "1px solid var(--border-accent)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent)",
        }}>
          <IconComp size={22} strokeWidth={1.6} />
        </div>
        <span style={{ fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 600, color: "var(--accent-hover)" }}>{tag}</span>
      </div>
      <h3 style={{
        position: "relative",
        fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
        fontSize: 24, fontWeight: 600, color: "var(--fg-1)",
        margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-0.01em",
      }}>{title}</h3>
      <p style={{ position: "relative", color: "var(--fg-2)", fontSize: 14, lineHeight: 1.65, margin: "0 0 22px" }}>{desc}</p>
      <span style={{
        position: "relative",
        display: "inline-flex", alignItems: "center", gap: 6,
        color: hover ? "var(--accent-hover)" : "var(--accent)",
        fontSize: 14, fontWeight: 600,
      }}>
        {ctaLabel} <ArrowRight size={14} style={{ transition: "transform var(--dur-base)", transform: hover ? "translateX(4px)" : "translateX(0)" }} />
      </span>
    </a>
  );
}

function QuickQuoteCard({ accent = "amber", ...props }) {
  if (accent === "blue") {
    return (
      <BrandScope brand="studio" style={{ display: "block" }}>
        <QuickQuoteCardInner {...props} />
      </BrandScope>
    );
  }
  return <QuickQuoteCardInner {...props} />;
}

/* Two-worlds feature card — light surface, brand-tinted border + bullets */
function GlassFeatureCardInner({ eyebrow, title, items, ctaLabel, serif = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 16,
        padding: 32,
        background: "var(--bg-elevated)",
        border: `1px solid ${hover ? "var(--border-accent)" : "var(--border-default)"}`,
        boxShadow: hover ? "var(--shadow-accent-glow)" : "var(--shadow-card)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all var(--dur-base) var(--ease-editorial)",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h3 style={{
        fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
        fontSize: 24, fontWeight: 600, color: "var(--fg-1)",
        margin: "0 0 18px", letterSpacing: "-0.01em",
      }}>{title}</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "grid", gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            <span style={{ color: "var(--accent)" }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <a
        onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
        href="#"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "var(--accent)", fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}
      >
        {ctaLabel} <ArrowRight size={14} />
      </a>
    </div>
  );
}

function GlassFeatureCard({ accent = "amber", ...props }) {
  if (accent === "blue") {
    return (
      <BrandScope brand="studio">
        <GlassFeatureCardInner {...props} />
      </BrandScope>
    );
  }
  return <GlassFeatureCardInner {...props} />;
}

/* Small STL upload tile */
function StlTile({ img, icon: IconComp, title, desc, cta, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
      href="#"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "block",
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${hover ? "rgba(37,99,235,0.40)" : "var(--border-default)"}`,
        minHeight: 180,
        textDecoration: "none",
        transition: "all var(--dur-base) var(--ease-editorial)",
        boxShadow: hover ? "0 20px 40px -16px rgba(30,58,138,0.30)" : "var(--shadow-card)",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <img
          src={img}
          alt={title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hover ? "scale(1.05)" : "scale(1)",
            transition: "transform var(--dur-slow) var(--ease-editorial)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.60), rgba(0,0,0,0.30))" }} />
      </div>
      <div style={{ position: "relative", padding: 14, minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <IconComp size={20} style={{ color: "#93C5FD", marginBottom: 6, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{title}</h4>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", lineHeight: 1.4, margin: "0 0 8px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{desc}</p>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#93C5FD", fontSize: 11, fontWeight: 600 }}>
          {cta} <ArrowRight size={11} />
        </span>
      </div>
    </a>
  );
}

Object.assign(window, { GatewayTile, QuickQuoteCard, GlassFeatureCard, StlTile, BrandScope });
