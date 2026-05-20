/* AEJaCA — Home page sections + a single Footer */

function GatewayTile({ img, eyebrow, desc, ctaLabel, accent = "amber", onClick }) {
  const [hover, setHover] = React.useState(false);
  const accentBorder = accent === "blue" ? "var(--border-blue-hi)" : "var(--border-amber-hi)";
  const accentColor = accent === "blue" ? "var(--blue-300)" : "var(--amber-300)";
  const accentBg = accent === "blue" ? "rgba(59,130,246,0.05)" : "rgba(245,158,11,0.05)";
  const accentFillBg = accent === "blue" ? "var(--blue-500)" : "var(--amber-500)";
  const accentFillFg = accent === "blue" ? "#fff" : "#000";
  const shadowHover = accent === "blue" ? "0 25px 50px -12px rgba(30,58,138,0.40)" : "0 25px 50px -12px rgba(120,53,15,0.40)";

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
        boxShadow: hover ? shadowHover : "0 10px 15px -3px rgba(0,0,0,0.40)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        transition: "all 500ms var(--ease-editorial)",
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
            transition: "transform 700ms var(--ease-editorial)",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.90), rgba(0,0,0,0.30) 50%, transparent 80%)",
          }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: accent === "blue" ? "var(--blue-400)" : "var(--amber-400)", marginBottom: 8 }}>{eyebrow}</div>
        <p style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.55, margin: "0 auto 20px", maxWidth: 320 }}>{desc}</p>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 9999,
            border: `1px solid ${hover ? accentFillBg : accentBorder}`,
            background: hover ? accentFillBg : accentBg,
            backdropFilter: "blur(12px)",
            color: hover ? accentFillFg : accentColor,
            fontSize: 14, letterSpacing: "0.02em",
            transition: "all 300ms var(--ease-editorial)",
          }}
        >
          {ctaLabel} <ArrowRight size={14} style={{ transition: "transform 300ms", transform: hover ? "translateX(4px)" : "translateX(0)" }} />
        </span>
      </div>
    </a>
  );
}

function QuickQuoteCard({ tag, title, desc, ctaLabel, icon: IconComp = Sparkles, accent = "amber", onClick, serif = false }) {
  const [hover, setHover] = React.useState(false);
  const accentColor = accent === "blue" ? "var(--blue-500)" : "var(--amber-500)";
  const accentColorHover = accent === "blue" ? "var(--blue-300)" : "var(--amber-300)";
  const border = accent === "blue" ? (hover ? "var(--border-blue-hi)" : "var(--border-blue)") : (hover ? "var(--border-amber-hi)" : "var(--border-amber)");
  const grad = accent === "blue"
    ? "linear-gradient(135deg, rgba(30,58,138,0.20), #0a0a0a 70%)"
    : "linear-gradient(135deg, rgba(120,53,15,0.20), #0a0a0a 70%)";
  const shadowHover = accent === "blue" ? "0 20px 40px -16px rgba(30,58,138,0.30)" : "0 20px 40px -16px rgba(120,53,15,0.30)";

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
        border: `1px solid ${border}`,
        background: grad,
        padding: 32,
        textDecoration: "none",
        boxShadow: hover ? shadowHover : "none",
        transition: "all 300ms var(--ease-editorial)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <IconComp size={28} style={{ color: accentColor }} strokeWidth={1.6} />
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: accent === "blue" ? "rgba(59,130,246,0.6)" : "rgba(245,158,11,0.6)" }}>{tag}</span>
      </div>
      <h3 style={{ fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)", fontSize: 24, fontWeight: 600, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>{title}</h3>
      <p style={{ color: "var(--fg-3)", fontSize: 14, lineHeight: 1.55, margin: "0 0 20px" }}>{desc}</p>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: hover ? accentColorHover : accentColor, fontSize: 14, fontWeight: 500, transition: "color 200ms" }}>
        {ctaLabel} <ArrowRight size={14} style={{ transition: "transform 300ms", transform: hover ? "translateX(4px)" : "translateX(0)" }} />
      </span>
    </a>
  );
}

function GlassFeatureCard({ eyebrow, title, items, ctaLabel, accent = "amber", serif = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  const accentColor = accent === "blue" ? "var(--blue-500)" : "var(--amber-500)";
  const accentHover = accent === "blue" ? "var(--blue-300)" : "var(--amber-300)";
  const accentBg = accent === "blue" ? "rgba(59,130,246,0.06)" : "rgba(245,158,11,0.06)";
  const accentBorder = accent === "blue" ? "var(--border-blue)" : "var(--border-amber)";
  const shadowHover = accent === "blue" ? "0 20px 40px -16px rgba(30,58,138,0.30)" : "0 20px 40px -16px rgba(120,53,15,0.30)";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 16,
        padding: 32,
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: hover ? shadowHover : "none",
        transition: "box-shadow 300ms var(--ease-editorial)",
      }}
    >
      <Eyebrow variant={accent} style={{ marginBottom: 12 }}>{eyebrow}</Eyebrow>
      <h3 style={{
        fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
        fontSize: 24, fontWeight: 600, color: "#fff", margin: "0 0 16px",
      }}>{title}</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "grid", gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>
            <span style={{ color: accentColor }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <a
        onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
        href="#"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: accentColor, fontSize: 14, fontWeight: 500, textDecoration: "none",
          transition: "color 200ms",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = accentHover}
        onMouseLeave={(e) => e.currentTarget.style.color = accentColor}
      >
        {ctaLabel} <ArrowRight size={14} />
      </a>
    </div>
  );
}

/* STL/SVG tile inside the emerald banner */
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
        border: `1px solid ${hover ? "var(--border-emerald)" : "rgba(52,211,153,0.10)"}`,
        minHeight: 180,
        textDecoration: "none",
        transition: "all 300ms var(--ease-editorial)",
        boxShadow: hover ? "0 20px 40px -16px rgba(6,78,59,0.20)" : "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <img
          src={img}
          alt={title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hover ? "scale(1.05)" : "scale(1)",
            transition: "transform 500ms var(--ease-editorial)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.60), rgba(0,0,0,0.30))" }} />
      </div>
      <div style={{ position: "relative", padding: 14, minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <IconComp size={20} style={{ color: "var(--emerald-400)", marginBottom: 6, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{title}</h4>
        <p style={{ fontSize: 10, color: "var(--fg-2)", lineHeight: 1.4, margin: "0 0 8px" }}>{desc}</p>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--emerald-400)", fontSize: 11, fontWeight: 500 }}>
          {cta} <ArrowRight size={11} />
        </span>
      </div>
    </a>
  );
}

Object.assign(window, { GatewayTile, QuickQuoteCard, GlassFeatureCard, StlTile });
