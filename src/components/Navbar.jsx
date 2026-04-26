import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useLanguage, LANGUAGES } from "../i18n/LanguageContext.jsx";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // "jewelry" | "studio" | null
  const [mobileExpanded, setMobileExpanded] = useState(null); // "jewelry" | "studio" | null
  const langRefDesktop = useRef(null);
  const langRefMobile = useRef(null);
  const dropdownTimeout = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { to: "/", label: t.nav.home },
    { to: "/jewelry", label: t.nav.jewelry, sections: t.nav.jewelrySections },
    { to: "/studio", label: t.nav.studio, sections: t.nav.studioSections },
    { to: "/about", label: t.nav.about, sections: t.nav.aboutSections },
    { to: "/blog", label: t.nav.blog || "Blog" },
    { to: "/glossary", label: t.nav.glossary },
    { to: "/contact", label: t.nav.contact },
  ];

  // Track scroll for enhanced navbar styling
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      const inDesktop = langRefDesktop.current && langRefDesktop.current.contains(e.target);
      const inMobile = langRefMobile.current && langRefMobile.current.contains(e.target);
      if (!inDesktop && !inMobile) setLangOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") { setLangOpen(false); setOpenDropdown(null); }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKeyDown); };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  function scrollToSection(pagePath, sectionId) {
    setOpenDropdown(null);
    setMenuOpen(false);
    setMobileExpanded(null);

    const doScroll = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Force reveal animations — IntersectionObserver may miss
        // elements when scrollIntoView jumps directly to them
        requestAnimationFrame(() => {
          el.querySelectorAll(".reveal, .reveal-scale, .reveal-left, .reveal-right").forEach(
            r => r.setAttribute("data-visible", "true")
          );
          if (el.classList.contains("reveal")) el.setAttribute("data-visible", "true");
        });
      }
      return !!el;
    };

    if (pathname === pagePath) {
      // Already on the page — small delay for mobile menu close animation
      setTimeout(doScroll, 100);
    } else {
      // Navigate then scroll after render — retry for slow mobile devices
      navigate(pagePath);
      const tryScroll = (attempts) => {
        if (!doScroll() && attempts > 0) {
          setTimeout(() => tryScroll(attempts - 1), 300);
        }
      };
      setTimeout(() => tryScroll(5), 200);
    }
  }

  function handleDropdownEnter(key) {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(key);
  }

  function handleDropdownLeave() {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
  }

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  function LangDropdown() {
    if (!langOpen) return null;
    return (
      <div className="absolute right-0 mt-2 w-40 bg-neutral-900/95 backdrop-blur-lg border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50" role="listbox" aria-label="Select language">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => { setLang(l.code); setLangOpen(false); }}
            role="option"
            aria-selected={lang === l.code}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
              lang === l.code ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>{l.flag}</span><span>{l.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function getDropdownKey(to) {
    if (to === "/jewelry") return "jewelry";
    if (to === "/studio") return "studio";
    if (to === "/about") return "about";
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-neutral-950/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-neutral-950/80 backdrop-blur-md border-b border-white/5"
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/brand-sign.webp" alt="AEJaCA" width="44" height="44" className="h-11 w-11 brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-105" />
            <span className="font-serif text-xl font-semibold tracking-wide">AEJaCA</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label, sections }) => {
              const dropKey = getDropdownKey(to);
              const hasSections = sections && sections.length > 0;
              const isActive = pathname === to;
              const accentColor = to === "/studio" ? "blue" : "amber";

              return (
                <div
                  key={to}
                  className="relative"
                  onMouseEnter={() => hasSections && handleDropdownEnter(dropKey)}
                  onMouseLeave={() => hasSections && handleDropdownLeave()}
                >
                  <Link
                    to={to}
                    className={`relative text-sm tracking-wide transition-colors hover:text-amber-400 flex items-center gap-1 ${
                      isActive ? "text-amber-400" : "text-neutral-300"
                    }`}
                  >
                    {label}
                    {hasSections && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === dropKey ? "rotate-180" : ""
                      }`} />
                    )}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                    )}
                  </Link>

                  {/* Desktop dropdown */}
                  {hasSections && openDropdown === dropKey && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      onMouseEnter={() => handleDropdownEnter(dropKey)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <div className="py-1.5">
                        {sections.map((sec) =>
                          sec.to ? (
                            <Link
                              key={sec.to}
                              to={sec.to}
                              onClick={() => setOpenDropdown(null)}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                accentColor === "blue"
                                  ? "text-neutral-400 hover:text-blue-300 hover:bg-blue-400/5"
                                  : "text-neutral-400 hover:text-amber-300 hover:bg-amber-400/5"
                              }`}
                            >
                              {sec.label}
                            </Link>
                          ) : (
                            <button
                              key={sec.id}
                              onClick={() => scrollToSection(to, sec.id)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                accentColor === "blue"
                                  ? "text-neutral-400 hover:text-blue-300 hover:bg-blue-400/5"
                                  : "text-neutral-400 hover:text-amber-300 hover:bg-amber-400/5"
                              }`}
                            >
                              {sec.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={langRefDesktop} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
              >
                <Globe className="w-4 h-4" />
                <span>{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
              </button>
              <LangDropdown />
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <div ref={langRefMobile} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                aria-expanded={langOpen}
                aria-label="Change language"
                className="text-sm text-neutral-400 hover:text-white px-2 py-1"
              >
                {currentLang?.flag}
              </button>
              <LangDropdown />
            </div>
            <button
              className="text-neutral-300 hover:text-white p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu with slide animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 overflow-y-auto max-h-[70vh]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ to, label, sections }) => {
              const dropKey = getDropdownKey(to);
              const hasSections = sections && sections.length > 0;
              const isExpanded = mobileExpanded === dropKey;
              const accentColor = to === "/studio" ? "blue" : "amber";

              return (
                <div key={to}>
                  <div className="flex items-center">
                    <Link
                      to={to}
                      onClick={() => { setMenuOpen(false); setMobileExpanded(null); }}
                      className={`flex-1 px-3 py-3 rounded-lg text-base tracking-wide transition-all ${
                        pathname === to
                          ? "text-amber-400 bg-amber-400/5"
                          : "text-neutral-300 hover:text-amber-400 hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </Link>
                    {hasSections && (
                      <button
                        onClick={() => setMobileExpanded(isExpanded ? null : dropKey)}
                        className="p-3 text-neutral-400 hover:text-white transition-colors"
                        aria-label="Show sections"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* Mobile sub-sections */}
                  {hasSections && (
                    <div className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}>
                      <div className="pl-6 pb-2 space-y-0.5">
                        {sections.map((sec) =>
                          sec.to ? (
                            <Link
                              key={sec.to}
                              to={sec.to}
                              onClick={() => { setMenuOpen(false); setMobileExpanded(null); }}
                              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                accentColor === "blue"
                                  ? "text-neutral-400 hover:text-blue-300 hover:bg-blue-400/5"
                                  : "text-neutral-400 hover:text-amber-300 hover:bg-amber-400/5"
                              }`}
                            >
                              {sec.label}
                            </Link>
                          ) : (
                            <button
                              key={sec.id}
                              onClick={() => scrollToSection(to, sec.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                accentColor === "blue"
                                  ? "text-neutral-400 hover:text-blue-300 hover:bg-blue-400/5"
                                  : "text-neutral-400 hover:text-amber-300 hover:bg-amber-400/5"
                              }`}
                            >
                              {sec.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
