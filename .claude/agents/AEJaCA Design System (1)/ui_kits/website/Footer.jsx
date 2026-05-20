/* AEJaCA Footer — light variant with brand-aware accents.
   Newsletter block + 3-column nav + market rates ticker. */

const FOOTER_COPY = {
  pl: {
    tagline: "Artisan Elegance Jewelry and Crafted Art. Gdzie rzemiosło spotyka technologię.",
    quickLinks: "Szybkie linki",
    followUs: "Obserwuj nas",
    rights: "Wszelkie prawa zastrzeżone.",
    newsletterTitle: "Zapisz się — kod AEJACA10 −10%",
    newsletterDesc: "Newsletter raz w miesiącu. Najpierw o nowych projektach, kalkulatorach i poradnikach.",
    newsletterCta: "Zapisz mnie",
    newsletterPlaceholder: "twoj@email.pl",
    rates: "Kursy rynkowe",
  },
  en: {
    tagline: "Artisan Elegance Jewelry and Crafted Art. Where craftsmanship meets technology.",
    quickLinks: "Quick Links",
    followUs: "Follow Us",
    rights: "All rights reserved.",
    newsletterTitle: "Subscribe — AEJACA10 code for −10%",
    newsletterDesc: "One newsletter a month. First word on new pieces, calculators, and how-tos.",
    newsletterCta: "Subscribe",
    newsletterPlaceholder: "your@email.com",
    rates: "Market rates",
  },
  de: {
    tagline: "Artisan Elegance Jewelry and Crafted Art. Wo Handwerk auf Technologie trifft.",
    quickLinks: "Schnellzugriff",
    followUs: "Folge uns",
    rights: "Alle Rechte vorbehalten.",
    newsletterTitle: "Abonnieren — Code AEJACA10 für −10 %",
    newsletterDesc: "Ein Newsletter pro Monat. Neue Stücke, Rechner und Anleitungen zuerst.",
    newsletterCta: "Abonnieren",
    newsletterPlaceholder: "ihre@email.de",
    rates: "Marktkurse",
  },
};

const QUICK = {
  pl: ["AEJaCA Jewelry", "AEJaCA sTuDiO", "Blog", "Słownik", "O AEJaCA", "Kontakt", "Gwarancja", "Wysyłka", "Polityka prywatności"],
  en: ["AEJaCA Jewelry", "AEJaCA sTuDiO", "Blog", "Glossary", "About AEJaCA", "Contact", "Warranty", "Shipping", "Privacy Policy"],
  de: ["AEJaCA Jewelry", "AEJaCA sTuDiO", "Blog", "Glossar", "Über AEJaCA", "Kontakt", "Garantie", "Versand", "Datenschutz"],
};

function SocialIcon({ icon: IconComp, label }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 40,
        height: 40,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9999,
        background: hover ? "var(--accent-soft)" : "var(--bg-elevated)",
        border: `1px solid ${hover ? "var(--border-accent)" : "var(--border-default)"}`,
        color: hover ? "var(--accent-hover)" : "var(--fg-3)",
        textDecoration: "none",
        transition: "all var(--dur-base) var(--ease-editorial)",
      }}
    >
      <IconComp size={16} />
    </a>
  );
}

function MarketRates({ lang, title }) {
  const showEur = lang === "en" || lang === "de";
  const currency = showEur ? "EUR" : "PLN";
  const conv = (pln) => (showEur ? (pln / 4.25).toFixed(2) : pln.toFixed(2));
  const fmt = (n, dec = 4) => Number(n).toLocaleString("pl-PL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-faint)" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 600, color: "var(--fg-4)", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12, color: "var(--fg-2)", marginBottom: 6 }}>
        <span><span style={{ color: "#A87425", fontWeight: 600 }}>Au</span> {conv(386.20)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
        <span><span style={{ color: "#94A3B8", fontWeight: 600 }}>Ag</span> {conv(4.42)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
        <span><span style={{ color: "#7C3AED", fontWeight: 600 }}>Pt</span> {conv(149.50)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
        <span><span style={{ color: "#0891B2", fontWeight: 600 }}>Pd</span> {conv(132.18)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: 11, color: "var(--fg-3)" }}>
        <span><span style={{ color: "var(--fg-4)" }}>PLN/USD</span> {fmt(4.0285)}</span>
        <span><span style={{ color: "var(--fg-4)" }}>PLN/EUR</span> {fmt(4.2418)}</span>
        <span><span style={{ color: "var(--fg-4)" }}>EUR/USD</span> {fmt(1.0530)}</span>
      </div>
    </div>
  );
}

function Footer({ lang }) {
  const t = FOOTER_COPY[lang];
  const links = QUICK[lang];

  return (
    <footer style={{ background: "var(--bg-page-soft)", borderTop: "1px solid var(--border-default)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px" }}>
        {/* Newsletter */}
        <div style={{ marginBottom: 44, maxWidth: 640 }}>
          <h3 style={{
            fontFamily: "var(--font-h2)", fontSize: 26, fontWeight: 600,
            color: "var(--fg-1)", margin: "0 0 6px", letterSpacing: "-0.01em",
          }}>{t.newsletterTitle}</h3>
          <p style={{ color: "var(--fg-3)", fontSize: 15, margin: "0 0 16px", lineHeight: 1.6 }}>{t.newsletterDesc}</p>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <input
              placeholder={t.newsletterPlaceholder}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                color: "var(--fg-1)",
                fontSize: 14,
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <Button variant="accent" icon={ArrowRight}>{t.newsletterCta}</Button>
          </form>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <img
                src="../../assets/brand-sign.webp"
                alt="AEJaCA"
                width="40" height="40"
                style={{ filter: "brightness(0)", opacity: 0.85, height: 40, width: 40 }}
              />
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 600, color: "var(--fg-1)" }}>AEJaCA</span>
            </div>
            <p style={{ color: "var(--fg-3)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{t.tagline}</p>
          </div>

          <nav>
            <h4 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--fg-3)", margin: "0 0 14px" }}>{t.quickLinks}</h4>
            <div style={{ display: "grid", gap: 8 }}>
              {links.map((l) => (
                <a key={l} href="#" onClick={(e) => e.preventDefault()}
                  style={{ fontSize: 14, color: "var(--fg-2)", textDecoration: "none", transition: "color var(--dur-fast)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--fg-2)"}
                >{l}</a>
              ))}
            </div>
          </nav>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--fg-3)", margin: "0 0 14px" }}>{t.followUs}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <SocialIcon icon={Store} label="Etsy Jewelry" />
              <SocialIcon icon={Store} label="Etsy Studio" />
              <SocialIcon icon={Instagram} label="Instagram" />
              <SocialIcon icon={Music2} label="TikTok" />
              <SocialIcon icon={Facebook} label="Facebook" />
              <SocialIcon icon={Youtube} label="YouTube" />
              <SocialIcon icon={MessageCircleMore} label="WhatsApp" />
              <SocialIcon icon={Mail} label="Email" />
            </div>
            <MarketRates lang={lang} title={t.rates} />
          </div>
        </div>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border-faint)", textAlign: "center", color: "var(--fg-4)", fontSize: 12 }}>
          &copy; {new Date().getFullYear()} AEJaCA — {t.rights}
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Footer });
