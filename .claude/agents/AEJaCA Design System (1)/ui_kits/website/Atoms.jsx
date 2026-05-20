/* AEJaCA — atoms (eyebrow, button, divider, rating pill).
   All consume CSS variables from the active brand class. */

/* Section eyebrow with flanking hairlines — used above every section
   title across the site. Uppercase, tracked tight on 0.32em, weight 600.
   Color defaults to --accent-hover so it reads boldly on light bg. */
function Eyebrow({ children, variant = "auto", color, style = {} }) {
  const resolvedColor =
    color ||
    (variant === "neutral" ? "var(--fg-4)" : "var(--accent-hover)");
  const hairlineColor = resolvedColor;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        fontSize: "var(--fs-caption)",
        letterSpacing: "var(--tracking-eyebrow-x)",
        textTransform: "uppercase",
        color: resolvedColor,
        ...style,
      }}
    >
      <span style={{ width: 28, height: 1, background: hairlineColor, opacity: 0.6, display: "inline-block" }} />
      <span>{children}</span>
      <span style={{ width: 28, height: 1, background: hairlineColor, opacity: 0.6, display: "inline-block" }} />
    </div>
  );
}

function GradientDivider({ style = {} }) {
  return (
    <div
      style={{
        height: 1,
        background: "var(--divider)",
        ...style,
      }}
    />
  );
}

function RatingPill({ rating = 4.9, count = 127, label = "Google reviews" }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href="#reviews"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 9999,
        border: `1px solid ${hover ? "var(--border-accent)" : "var(--border-default)"}`,
        background: hover ? "var(--accent-soft)" : "var(--bg-elevated)",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
        fontSize: 14,
        fontFamily: "var(--font-ui)",
        transition: "all var(--dur-base) var(--ease-editorial)",
      }}
    >
      <StarFilled size={14} style={{ color: "var(--accent)" }} />
      <b style={{ color: "var(--accent-hover)", fontWeight: 700 }}>{rating}</b>
      <span style={{ color: "var(--fg-5)" }}>·</span>
      <span style={{ color: "var(--fg-3)" }}>{count} {label}</span>
    </a>
  );
}

function Button({ variant = "primary", icon: TrailingIcon = ArrowRight, children, onClick, style = {} }) {
  const [hover, setHover] = React.useState(false);

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: variant === "primary" ? "13px 28px" : "11px 24px",
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: variant === "ghost" ? 600 : 500,
    letterSpacing: "0.02em",
    fontFamily: "var(--font-ui)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all var(--dur-base) var(--ease-editorial)",
    ...style,
  };

  const variants = {
    primary: {
      background: hover ? "var(--accent-hover)" : "var(--btn-primary-bg)",
      color: "var(--btn-primary-fg)",
      border: "none",
      boxShadow: hover ? "var(--shadow-accent-glow)" : "var(--shadow-card)",
    },
    accent: {
      background: hover ? "var(--accent)" : "var(--bg-elevated)",
      color: hover ? "var(--fg-on-accent)" : "var(--accent-hover)",
      border: `1px solid ${hover ? "var(--accent)" : "var(--border-accent)"}`,
    },
    ghost: {
      background: "transparent",
      color: hover ? "var(--accent-hover)" : "var(--accent)",
      border: "none",
      padding: 0,
    },
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant] }}
    >
      <span>{children}</span>
      {TrailingIcon && (
        <TrailingIcon
          size={14}
          style={{
            transition: "transform var(--dur-base) var(--ease-editorial)",
            transform: hover ? "translateX(4px)" : "translateX(0)",
          }}
        />
      )}
    </button>
  );
}

Object.assign(window, { Eyebrow, GradientDivider, RatingPill, Button });
