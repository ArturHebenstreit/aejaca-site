/* AEJaCA Navbar — light variant with brand-aware accents.
   Tints itself based on the active brand context (jewelry vs studio).
   Light & dark mode both supported via CSS variables. */

const NAV_LINKS = [
  { id: "home", label: { pl: "Strona główna", en: "Home", de: "Startseite" } },
  {
    id: "jewelry", label: { pl: "AEJaCA Jewelry", en: "AEJaCA Jewelry", de: "AEJaCA Jewelry" }, brand: "jewelry",
    sections: [
      { pl: "Produkty i usługi", en: "Products & Services", de: "Produkte & Dienste" },
      { pl: "Cennik orientacyjny", en: "Indicative Pricing", de: "Richtpreise" },
      { pl: "Kalkulator", en: "Price Calculator", de: "Preisrechner" },
      { pl: "Proces", en: "Process", de: "Prozess" },
      { pl: "Portfolio", en: "Portfolio", de: "Portfolio" },
    ],
  },
  {
    id: "studio", label: { pl: "AEJaCA sTuDiO", en: "AEJaCA sTuDiO", de: "AEJaCA sTuDiO" }, brand: "studio",
    sections: [
      { pl: "Technologie", en: "Technologies", de: "Technologien" },
      { pl: "Kalkulator", en: "Price Calculator", de: "Preisrechner" },
      { pl: "Portfolio", en: "Portfolio", de: "Portfolio" },
      { pl: "Jak działamy", en: "How We Work", de: "Wie wir arbeiten" },
    ],
  },
  {
    id: "about", label: { pl: "O AEJaCA", en: "About AEJaCA", de: "Über AEJaCA" },
    sections: [
      { pl: "O nas", en: "About", de: "Über uns" },
      { pl: "Gwarancja", en: "Warranty", de: "Garantie" },
      { pl: "Wysyłka", en: "Shipping", de: "Versand" },
    ],
  },
  { id: "contact", label: { pl: "Kontakt", en: "Contact", de: "Kontakt" } },
];

const LANGS = [
  { code: "pl", flag: "🇵🇱", label: "Polski" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode((v) => !v)}
      aria-label={darkMode ? "Switch to light mode" : "Switch to night mode"}
      style={{
        width: 32,
        height: 32,
        borderRadius: 9999,
        background: "transparent",
        border: "1px solid var(--border-default)",
        color: "var(--fg-2)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all var(--dur-base) var(--ease-editorial)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-soft)";
        e.currentTarget.style.borderColor = "var(--border-accent)";
        e.currentTarget.style.color = "var(--accent-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.color = "var(--fg-2)";
      }}
    >
      {darkMode ? (
        // Sun icon — switch to light
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon — switch to dark
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

function Navbar({ lang, setLang, activePage, setActivePage, darkMode, setDarkMode }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [openDrop, setOpenDrop] = React.useState(null);
  const [langOpen, setLangOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentLang = LANGS.find((l) => l.code === lang) || LANGS[1];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: darkMode
          ? (scrolled ? "rgba(10,10,10,0.92)" : "rgba(10,10,10,0.78)")
          : (scrolled ? "rgba(248,244,237,0.92)" : "rgba(248,244,237,0.78)"),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "var(--border-default)" : "var(--border-faint)"}`,
        boxShadow: scrolled ? "0 8px 24px -16px rgba(0,0,0,0.16)" : "none",
        transition: "all var(--dur-base) var(--ease-editorial)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); setActivePage("home"); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}
        >
          <img
            src="../../assets/brand-sign.webp"
            alt="AEJaCA"
            width="42"
            height="42"
            style={{
              filter: darkMode
                ? "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.30))"
                : "brightness(0)",
              opacity: darkMode ? 0.92 : 0.88,
              height: 42, width: 42,
            }}
          />
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 600, letterSpacing: "0.02em", color: "var(--fg-1)" }}>AEJaCA</span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {NAV_LINKS.map((item) => {
            const isActive = activePage === item.id;
            const hasSections = !!item.sections;
            return (
              <div
                key={item.id}
                style={{ position: "relative" }}
                onMouseEnter={() => hasSections && setOpenDrop(item.id)}
                onMouseLeave={() => hasSections && setOpenDrop(null)}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => { e.preventDefault(); setActivePage(item.id); setOpenDrop(null); }}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "0.01em",
                    color: isActive ? "var(--accent)" : "var(--fg-2)",
                    textDecoration: "none",
                    transition: "color var(--dur-fast)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--fg-2)"; }}
                >
                  {item.label[lang]}
                  {hasSections && (
                    <ChevronDown
                      size={13}
                      style={{
                        transition: "transform var(--dur-fast)",
                        transform: openDrop === item.id ? "rotate(180deg)" : "rotate(0)",
                      }}
                    />
                  )}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0, right: 0, bottom: -23,
                        height: 2,
                        background: "var(--accent)",
                        borderRadius: 999,
                      }}
                    />
                  )}
                </a>

                {hasSections && openDrop === item.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 220,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "var(--shadow-card-hover)",
                      zIndex: 50,
                    }}
                  >
                    <div style={{ padding: "6px 0" }}>
                      {item.sections.map((sec, i) => (
                        <button
                          key={i}
                          onClick={() => { setOpenDrop(null); setActivePage(item.id); }}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 18px",
                            fontSize: 13,
                            color: "var(--fg-2)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "all var(--dur-fast)",
                            fontFamily: "var(--font-ui)",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-hover)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          {sec[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Language */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--fg-2)",
                background: "transparent",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                transition: "all var(--dur-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-1)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Globe size={14} />
              <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  width: 170,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  overflow: "hidden",
                  zIndex: 50,
                  boxShadow: "var(--shadow-card-hover)",
                }}
              >
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: 13,
                      color: l.code === lang ? "var(--accent-hover)" : "var(--fg-2)",
                      background: l.code === lang ? "var(--accent-soft)" : "transparent",
                      fontWeight: l.code === lang ? 600 : 400,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    <span>{l.flag}</span><span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Day / Night toggle */}
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
      </div>
    </nav>
  );
}

Object.assign(window, { Navbar, LANGS });
