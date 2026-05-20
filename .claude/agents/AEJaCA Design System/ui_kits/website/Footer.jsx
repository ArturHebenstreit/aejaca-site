/* AEJaCA Footer — newsletter block, 3-column footer, market rates ticker. */

const FOOTER_COPY = {
  pl: {
    tagline: "Artisan Elegance Jewelry and Crafted Art. Gdzie rzemiosło spotyka technologię.",
    quickLinks: "Szybkie linki",
    followUs: "Obserwuj nas",
    rights: "Wszelkie prawa zastrzeżone.",
    newsletterTitle: "Zapisz się — kod AEJACA10 −10 %",
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
        background: hover ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${hover ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)"}`,
        color: hover ? "#fff" : "var(--fg-3)",
        textDecoration: "none",
        transition: "all 300ms var(--ease-editorial)",
      }}
    >
      <IconComp size={16} />
    </a>
  );
}

function MarketRates({ lang, title }) {
  // Fake but plausible data — matches the live footer's structure.
  const showEur = lang === "en" || lang === "de";
  const currency = showEur ? "EUR" : "PLN";
  const conv = (pln) => (showEur ? (pln / 4.25).toFixed(2) : pln.toFixed(2));
  const fmt = (n, dec = 4) => Number(n).toLocaleString("pl-PL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-faint)" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--fg-4)", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12, color: "var(--fg-2)", marginBottom: 6 }}>
        <span><span style={{ color: "var(--amber-400)", fontWeight: 500 }}>Au</span> {conv(386.20)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
        <span><span style={{ color: "var(--slate-300)", fontWeight: 500 }}>Ag</span> {conv(4.42)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
        <span><span style={{ color: "var(--purple-300)", fontWeight: 500 }}>Pt</span> {conv(149.50)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
        <span><span style={{ color: "var(--cyan-300)", fontWeight: 500 }}>Pd</span> {conv(132.18)} <span style={{ color: "var(--fg-4)" }}>{currency}/g</span></span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: 12, color: "var(--fg-2)" }}>
        <span><span style={{ color: "var(--fg-3)" }}>PLN/USD</span> {fmt(4.0285)}</span>
        <span><span style={{ color: "var(--fg-3)" }}>PLN/EUR</span> {fmt(4.2418)}</span>
        <span><span style={{ color: "var(--fg-3)" }}>EUR/USD</span> {fmt(1.0530)}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: "var(--fg-5)" }}>
        Au: NBP 19.05 14:30 · Ag: gold-api.com 19.05 14:30
      </div>
    </div>
  );
}

function Footer({ lang }) {
  const t = FOOTER_COPY[lang];
  const links = QUICK[lang];

  return (
    <footer style={{ background: "var(--bg-page)", borderTop: "1px solid var(--border-default)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
        {/* Newsletter */}
        <div style={{ marginBottom: 40, maxWidth: 640 }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{t.newsletterTitle}</h3>
          <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "0 0 14px", lineHeight: 1.55 }}>{t.newsletterDesc}</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", gap: 8, alignItems: "stretch" }}
          >
            <input
              placeholder={t.newsletterPlaceholder}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                fontFamily: "var(--font-sans)",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--amber-500)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.18)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <Button variant="amber" icon={ArrowRight}>{t.newsletterCta}</Button>
          </form>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <img src="../../assets/brand-sign.webp" alt="AEJaCA" width="40" height="40" style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.30))", height: 40, width: 40 }} />
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "#fff" }}>AEJaCA</span>
            </div>
            <p style={{ color: "var(--fg-3)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{t.tagline}</p>
          </div>

          <nav>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", margin: "0 0 14px" }}>{t.quickLinks}</h4>
            <div style={{ display: "grid", gap: 8 }}>
              {links.map((l) => (
                <a key={l} href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, color: "var(--fg-2)", textDecoration: "none", transition: "color 200ms" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = l.includes("sTuDiO") ? "var(--blue-400)" : "var(--amber-400)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--fg-2)"}
                >{l}</a>
              ))}
            </div>
          </nav>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", margin: "0 0 14px" }}>{t.followUs}</h4>
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

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border-faint)", textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
          &copy; {new Date().getFullYear()} AEJaCA — {t.rights}
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Footer });
