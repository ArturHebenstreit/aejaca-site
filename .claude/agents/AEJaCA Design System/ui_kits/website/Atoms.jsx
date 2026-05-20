/* AEJaCA — small atoms */

function Eyebrow({ children, variant = "amber", icon = null, style = {}, className = "" }) {
  const color =
    variant === "blue" ? "var(--blue-500)" :
    variant === "emerald" ? "var(--emerald-400)" :
    variant === "neutral" ? "var(--fg-4)" :
    "var(--amber-500)";
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

function GradientDivider({ style = {} }) {
  return (
    <div
      style={{
        height: 1,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
        ...style,
      }}
    />
  );
}

function RatingPill({ rating = 4.9, count = 127, label = "Google reviews" }) {
  return (
    <a
      href="#reviews"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 9999,
        border: "1px solid var(--border-amber)",
        background: "rgba(245,158,11,0.03)",
        textDecoration: "none",
        fontSize: 14,
        transition: "all 300ms var(--ease-editorial)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(245,158,11,0.10)";
        e.currentTarget.style.borderColor = "var(--border-amber-hi)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(245,158,11,0.03)";
        e.currentTarget.style.borderColor = "var(--border-amber)";
      }}
    >
      <StarFilled size={14} style={{ color: "var(--amber-400)" }} />
      <b style={{ color: "var(--amber-300)", fontWeight: 700 }}>{rating}</b>
      <span style={{ color: "var(--fg-4)" }}>·</span>
      <span style={{ color: "var(--fg-3)" }}>{count} {label}</span>
    </a>
  );
}

function Button({ variant = "primary", icon: TrailingIcon = ArrowRight, children, onClick, style = {} }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.02em",
    cursor: "pointer",
    transition: "all 300ms var(--ease-editorial)",
    border: "none",
    fontFamily: "var(--font-sans)",
    ...style,
  };
  const variants = {
    primary: { background: "#fff", color: "#000" },
    amber: {
      background: "rgba(245,158,11,0.05)",
      color: "var(--amber-300)",
      border: "1px solid var(--border-amber-hi)",
      backdropFilter: "blur(12px)",
      padding: "10px 24px",
    },
    blue: {
      background: "rgba(59,130,246,0.05)",
      color: "var(--blue-300)",
      border: "1px solid var(--border-blue-hi)",
      backdropFilter: "blur(12px)",
      padding: "10px 24px",
    },
  };
  const [hover, setHover] = React.useState(false);
  const hoverFx = {
    primary: hover ? { background: "#e5e5e5", boxShadow: "0 10px 30px -10px rgba(255,255,255,0.15)" } : {},
    amber: hover
      ? { background: "var(--amber-500)", color: "#000", borderColor: "var(--amber-500)" }
      : {},
    blue: hover
      ? { background: "var(--blue-500)", color: "#fff", borderColor: "var(--blue-500)" }
      : {},
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant], ...hoverFx[variant] }}
    >
      <span>{children}</span>
      {TrailingIcon && (
        <TrailingIcon
          size={14}
          style={{
            transition: "transform 300ms var(--ease-editorial)",
            transform: hover ? "translateX(4px)" : "translateX(0)",
          }}
        />
      )}
    </button>
  );
}

Object.assign(window, { Eyebrow, GradientDivider, RatingPill, Button });
