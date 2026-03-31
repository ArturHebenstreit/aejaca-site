import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage, LANGUAGES } from "../i18n/LanguageContext.jsx";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRefDesktop = useRef(null);
  const langRefMobile = useRef(null);
  const { pathname } = useLocation();
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { to: "/", label: t.nav.home },
    { to: "/jewelry", label: t.nav.jewelry },
    { to: "/studio", label: t.nav.studio },
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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-neutral-950/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-neutral-950/80 backdrop-blur-md border-b border-white/5"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/brand-sign.png" alt="AEJaCA" className="h-11 w-11 brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-105" />
            <span className="font-serif text-xl font-semibold tracking-wide">AEJaCA</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative text-sm tracking-wide transition-colors hover:text-amber-400 ${
                  pathname === to ? "text-amber-400" : "text-neutral-300"
                }`}
              >
                {label}
                {pathname === to && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                )}
              </Link>
            ))}
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
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-neutral-950/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-3 rounded-lg text-base tracking-wide transition-all ${
                  pathname === to
                    ? "text-amber-400 bg-amber-400/5"
                    : "text-neutral-300 hover:text-amber-400 hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
