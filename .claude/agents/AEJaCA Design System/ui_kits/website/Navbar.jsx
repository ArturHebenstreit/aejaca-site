/* AEJaCA Navbar — fixed translucent top bar with brand dropdowns + lang switcher.
   Cosmetic recreation; dropdowns are simulated state, no router. */

const NAV_LINKS = [
  { id: "home", label: { pl: "Strona główna", en: "Home", de: "Startseite" } },
  {
    id: "jewelry", label: { pl: "AEJaCA Jewelry", en: "AEJaCA Jewelry", de: "AEJaCA Jewelry" }, accent: "amber",
    sections: [
      { pl: "Produkty i usługi", en: "Products & Services", de: "Produkte & Dienste" },
      { pl: "Cennik orientacyjny", en: "Indicative Pricing", de: "Richtpreise" },
      { pl: "Kalkulator", en: "Price Calculator", de: "Preisrechner" },
      { pl: "Proces", en: "Process", de: "Prozess" },
      { pl: "Portfolio", en: "Portfolio", de: "Portfolio" },
    ],
  },
  {
    id: "studio", label: { pl: "AEJaCA sTuDiO", en: "AEJaCA sTuDiO", de: "AEJaCA sTuDiO" }, accent: "blue",
    sections: [
      { pl: "Technologie", en: "Technologies", de: "Technologien" },
      { pl: "Kalkulator", en: "Price Calculator", de: "Preisrechner" },
      { pl: "Portfolio", en: "Portfolio", de: "Portfolio" },
      { pl: "Jak działamy", en: "How We Work", de: "Wie wir arbeiten" },
    ],
  },
  {
    id: "about", label: { pl: "O AEJaCA", en: "About AEJaCA", de: "Über AEJaCA" }, accent: "amber",
    sections: [
      { pl: "O nas", en: "About", de: "Über uns" },
      { pl: "Gwarancja", en: "Warranty", de: "Garantie" },
      { pl: "Wysyłka", en: "Shipping", de: "Versand" },
      { pl: "Polityka prywatności", en: "Privacy Policy", de: "Datenschutz" },
    ],
  },
  { id: "contact", label: { pl: "Kontakt", en: "Contact", de: "Kontakt" } },
];

const LANGS = [
  { code: "pl", flag: "🇵🇱", label: "Polski" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

function Navbar({ lang, setLang, activePage, setActivePage }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [openDrop, setOpenDrop] = React.useState(null);
  const [langOpen, setLangOpen] = React.useState(false);

  React.useEffect(() => {
    const scope = document.querySelector("[data-scroll-host]") || window;
    const onScroll = () => setScrolled((scope.scrollTop || window.scrollY) > 20);
    scope.addEventListener("scroll", onScroll, { passive: true });
    return () => scope.removeEventListener("scroll", onScroll);
  }, []);

  const currentLang = LANGS.find((l) => l.code === lang) || LANGS[1];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 300ms var(--ease-editorial)",
        background: scrolled ? "rgba(10,10,10,0.95)" : "rgba(10,10,10,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid var(--border-default)" : "1px solid var(--border-faint)",
        boxShadow: scrolled ? "0 10px 30px -20px rgba(0,0,0,0.6)" : "none",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); setActivePage("home"); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}
        >
          <img
            src="../../assets/brand-sign.webp"
            alt="AEJaCA"
            width="44"
            height="44"
            style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.30))", height: 44, width: 44 }}
          />
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, letterSpacing: "0.02em", color: "#fff" }}>AEJaCA</span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {NAV_LINKS.map((item) => {
            const isActive = activePage === item.id;
            const hasSections = !!item.sections;
            const accentVar = item.accent === "blue" ? "var(--blue-300)" : "var(--amber-300)";
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
                    fontSize: 13,
                    letterSpacing: "0.02em",
                    color: isActive ? "var(--amber-500)" : "var(--fg-2)",
                    textDecoration: "none",
                    transition: "color 200ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--amber-400)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--fg-2)"; }}
                >
                  {item.label[lang]}
                  {hasSections && (
                    <ChevronDown
                      size={13}
                      style={{
                        transition: "transform 200ms",
                        transform: openDrop === item.id ? "rotate(180deg)" : "rotate(0)",
                      }}
                    />
                  )}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0, right: 0, bottom: -22,
                        height: 2,
                        background: "var(--amber-500)",
                        borderRadius: 999,
                      }}
                    />
                  )}
                </a>

                {hasSections && openDrop === item.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 200,
                      background: "rgba(23,23,23,0.96)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
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
                            padding: "8px 16px",
                            fontSize: 13,
                            color: "var(--fg-3)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 200ms",
                            fontFamily: "var(--font-sans)",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = accentVar; e.currentTarget.style.background = item.accent === "blue" ? "rgba(59,130,246,0.05)" : "rgba(245,158,11,0.05)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "transparent"; }}
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

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--fg-3)",
                background: "transparent",
                border: "none",
                padding: "4px 8px",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 200ms",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "transparent"; }}
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
                  width: 160,
                  background: "rgba(23,23,23,0.96)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  overflow: "hidden",
                  zIndex: 50,
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
                      color: l.code === lang ? "#fff" : "var(--fg-3)",
                      background: l.code === lang ? "rgba(255,255,255,0.08)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

Object.assign(window, { Navbar, LANGS });
