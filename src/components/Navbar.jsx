import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "../i18n/nav.jsx";

// Porownanie sciezek bez koncowego ukosnika.
//
// Odnosniki w menu maja ukosnik ("/about/"), a prerender renderuje trasy bez
// niego ("/about", patrz STATIC_ROUTES w scripts/prerender.mjs). Zwykle ===
// dawalo wiec na serwerze "nieaktywny", a w przegladarce "aktywny", czyli
// inny HTML po obu stronach. React zglaszal to jako blad hydracji 418/423,
// wyrzucal gotowa strone i renderowal wszystko od nowa. Na KAZDEJ stronie,
// bo pasek nawigacji jest wszedzie i wszedzie jeden odnosnik jest aktywny.
const samePath = (a, b) => String(a).replace(/\/+$/, "") === String(b).replace(/\/+$/, "");
import { Menu, X, Globe, ChevronDown, Sun, Moon, ShoppingCart, ExternalLink } from "lucide-react";
import { useLanguage, LANGUAGES } from "../i18n/LanguageContext.jsx";
import { sciezkaJezyka } from "../routes.js";
import { useCurrency } from "../shop/CurrencyContext.jsx";
import { useTheme } from "../i18n/ThemeContext.jsx";
import { useCart } from "../cart/CartContext.jsx";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // "jewelry" | "studio" | "about" | "gallery" | "resources" | null
  const [mobileExpanded, setMobileExpanded] = useState(null); // "jewelry" | "studio" | "about" | "gallery" | "resources" | null
  const langRefDesktop = useRef(null);
  const langRefMobile = useRef(null);
  const dropdownTimeout = useRef(null);
  // Sciezka BEZ prefiksu jezyka, bo adresy w menu pisane sa bez niego.
  // Surowe `pathname` na `/de/studio/` nie zrownaloby sie z `/studio/`
  // i podswietlenie biezacej pozycji zniknelo by w obu obcych jezykach.
  const { sciezkaBezJezyka: pathname } = useLanguage();
  const sciezkaBezJezyka = pathname;
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  // Waluta zaplaty stoi w tym samym menu co jezyk, bo domyslnie idzie za nim.
  // Osobny przelacznik w pasku dolozylby element do i tak ciasnej nawigacji,
  // a rozdzielilby dwie decyzje, ktore klient podejmuje razem.
  const { currency, setCurrency } = useCurrency();
  const { isDark, toggleTheme } = useTheme();
  const { count: cartCount } = useCart();

  const navLinks = [
    { to: "/jewelry/", label: t.nav.jewelry, sections: t.nav.jewelrySections },
    { to: "/studio/", label: t.nav.studio, sections: t.nav.studioSections },
    { to: "/gallery/", label: t.nav.gallery, sections: t.nav.gallerySections },
    { to: "/about/", label: t.nav.about, sections: t.nav.aboutSections },
    { to: "/resources/", label: t.nav.resources, sections: t.nav.resourcesSections },
    { to: "/contact/", label: t.nav.contact },
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
        // Force reveal animations, IntersectionObserver may miss
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

    if (samePath(pathname, pagePath)) {
      // Already on the page, small delay for mobile menu close animation
      setTimeout(doScroll, 100);
    } else {
      // Navigate then scroll after render, retry for slow mobile devices
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
      <div className="absolute right-0 mt-2 w-40 bg-neutral-900/95 backdrop-blur-lg border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50" aria-label="Select language">
        {/* ODNOSNIKI, NIE PRZYCISKI. Kazdy jezyk stoi pod wlasnym adresem, wiec
            wybor jezyka jest przejsciem, a nie zmiana stanu. Robot wyszukiwarki
            ma czym przejsc do wersji obcojezycznej, odwiedzajacy moze otworzyc
            ja w nowej karcie, a `hreflang` w naglowku mowi to samo maszynowo.
            `<a>` z prawdziwym `href` obsluguje to wszystko za darmo. */}
        {LANGUAGES.map((l) => (
          <a
            key={l.code}
            href={sciezkaJezyka(sciezkaBezJezyka, l.code)}
            hreflang={l.code}
            lang={l.code}
            onClick={(e) => {
              // Zwykle klikniecie zostaje w aplikacji, bez przeladowania strony.
              // Srodkowy przycisk, Ctrl i Cmd niech dzialaja jak zawsze.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setLang(l.code);
              setLangOpen(false);
            }}
            aria-current={lang === l.code ? "true" : undefined}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
              lang === l.code ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span aria-hidden="true">{l.flag}</span><span>{l.label}</span>
          </a>
        ))}

        <div className="border-t border-white/10 px-4 pt-2.5 pb-3">
          <div className="text-neutral-500 text-xs mb-1.5">{t("nav.currency")}</div>
          <div className="flex gap-1.5">
            {["PLN", "EUR"].map((w) => (
              <button
                key={w}
                onClick={() => { setCurrency(w); setLangOpen(false); }}
                aria-pressed={currency === w}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  currency === w ? "bg-amber-400 text-neutral-950 font-medium" : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <p className="text-neutral-600 text-xs leading-snug mt-2">{t("nav.currencyHint")}</p>
        </div>
      </div>
    );
  }

  function getDropdownKey(to) {
    if (to === "/jewelry/") return "jewelry";
    if (to === "/studio/") return "studio";
    if (to === "/about/") return "about";
    if (to === "/gallery/") return "gallery";
    if (to === "/resources/") return "resources";
    return null;
  }

  const handleNavClick = (e, to) => {
    if (to === "/gallery/" || to === "/resources/") {
      e.preventDefault();
      return;
    }
    if (samePath(pathname, to)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
          : "backdrop-blur-md border-b border-white/5"
      }`}
      style={{ background: scrolled ? "var(--ds-navbar-bg-s)" : "var(--ds-navbar-bg)" }}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" onClick={(e) => handleNavClick(e, "/")} className="flex items-center gap-3 group">
            <img src="/brand-sign.webp" alt="AEJaCA" width="44" height="44" className="h-11 w-11 brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-105" />
            <span className="font-serif text-xl font-semibold tracking-wide">AEJaCA</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label, sections }) => {
              const dropKey = getDropdownKey(to);
              const hasSections = sections && sections.length > 0;
              const isDropdownOnly = to === "/gallery/" || to === "/resources/";
              const isActive = samePath(pathname, to);
              const accentColor = to === "/studio/" ? "blue" : "amber";
              const triggerClass = `relative text-sm tracking-wide transition-colors hover:text-amber-400 flex items-center gap-1 ${
                isActive ? "text-amber-400" : "text-neutral-300"
              }`;
              const triggerContent = (
                <>
                  {label}
                  {hasSections && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openDropdown === dropKey ? "rotate-180" : ""
                    }`} />
                  )}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                  )}
                </>
              );

              return (
                <div
                  key={to}
                  className="relative"
                  onMouseEnter={() => hasSections && handleDropdownEnter(dropKey)}
                  onMouseLeave={() => hasSections && handleDropdownLeave()}
                >
                  {isDropdownOnly ? (
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === dropKey ? null : dropKey)}
                      aria-haspopup="true"
                      aria-expanded={openDropdown === dropKey}
                      className={triggerClass}
                    >
                      {triggerContent}
                    </button>
                  ) : (
                    <Link
                      to={to}
                      onClick={(e) => handleNavClick(e, to)}
                      className={triggerClass}
                    >
                      {triggerContent}
                    </Link>
                  )}

                  {/* Desktop dropdown */}
                  {hasSections && openDropdown === dropKey && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      onMouseEnter={() => handleDropdownEnter(dropKey)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <div className="py-1.5">
                        {sections.map((sec) =>
                          // Etsy prowadzi poza serwis, wiec musi otwierac sie
                          // w nowej karcie i byc widocznie oznaczone.
                          sec.href ? (
                            <a
                              key={sec.href}
                              href={sec.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenDropdown(null)}
                              className={`flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors ${
                                accentColor === "blue"
                                  ? "text-neutral-400 hover:text-blue-300 hover:bg-blue-400/5"
                                  : "text-neutral-400 hover:text-amber-300 hover:bg-amber-400/5"
                              }`}
                            >
                              {sec.label}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : sec.to ? (
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
                              // Sam `sec.id` nie wystarcza: w menu Galeria dwie
                              // pozycje maja id "portfolio" i roznia sie wylacznie
                              // strona docelowa. React z dwoma takimi samymi kluczami
                              // moze pominac jedna pozycje albo zdublowac druga.
                              key={`${sec.pagePath || to}#${sec.id}`}
                              onClick={() => scrollToSection(sec.pagePath || to, sec.id)}
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
            {/* Sklep, ikona zamiast pozycji tekstowej: akcja zakupowa
                stoi przy nawigacji, przelaczniki motywu i jezyka zostaja razem */}
            <Link
              to="/cart/"
              aria-label={t.nav.order}
              title={t.nav.order}
              className="relative flex items-center justify-center w-8 h-8 rounded-md text-neutral-300 hover:text-amber-300 hover:bg-amber-400/10 transition-all duration-300"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-neutral-900 text-xs font-bold flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
              title={isDark ? "Light mode" : "Dark mode"}
              className="flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
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
            <Link
              to="/cart/"
              aria-label={t.nav.order}
              className="relative text-neutral-300 hover:text-amber-300 p-1 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-neutral-900 text-xs font-bold flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            {/* Theme toggle mobile */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
              className="text-neutral-400 hover:text-white p-1 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
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
              const accentColor = to === "/studio/" ? "blue" : "amber";

              return (
                <div key={to}>
                  {hasSections ? (
                    <button
                      onClick={() => setMobileExpanded(isExpanded ? null : dropKey)}
                      className={`flex items-center w-full px-3 py-3 rounded-lg text-base tracking-wide text-left transition-all ${
                        samePath(pathname, to)
                          ? "text-amber-400 bg-amber-400/5"
                          : "text-neutral-300 hover:text-amber-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex-1">{label}</span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <Link
                      to={to}
                      onClick={(e) => { handleNavClick(e, to); setMenuOpen(false); setMobileExpanded(null); }}
                      className={`block px-3 py-3 rounded-lg text-base tracking-wide transition-all ${
                        samePath(pathname, to)
                          ? "text-amber-400 bg-amber-400/5"
                          : "text-neutral-300 hover:text-amber-400 hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </Link>
                  )}

                  {/* Mobile sub-sections */}
                  {hasSections && (
                    <div className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}>
                      <div className="pl-6 pb-2 space-y-0.5">
                        {sections.map((sec) =>
                          sec.href ? (
                            <a
                              key={sec.href}
                              href={sec.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => { setMenuOpen(false); setMobileExpanded(null); }}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                accentColor === "blue"
                                  ? "text-neutral-400 hover:text-blue-300 hover:bg-blue-400/5"
                                  : "text-neutral-400 hover:text-amber-300 hover:bg-amber-400/5"
                              }`}
                            >
                              {sec.label}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : sec.to ? (
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
                              // Sam `sec.id` nie wystarcza: w menu Galeria dwie
                              // pozycje maja id "portfolio" i roznia sie wylacznie
                              // strona docelowa. React z dwoma takimi samymi kluczami
                              // moze pominac jedna pozycje albo zdublowac druga.
                              key={`${sec.pagePath || to}#${sec.id}`}
                              onClick={() => scrollToSection(sec.pagePath || to, sec.id)}
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
