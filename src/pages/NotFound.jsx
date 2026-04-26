import { Link } from "react-router-dom";
import { ArrowLeft, Gem, Cpu, BookOpen, Mail, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";

const LABELS = {
  pl: {
    title: "Strona nie znaleziona",
    text: "Wygląda na to, że ta strona nie istnieje lub została przeniesiona.",
    btn: "Wróć na stronę główną",
    metaTitle: "404 — Strona nie znaleziona | AEJaCA",
    explore: "Może zainteresuje Cię:",
    links: [
      { to: "/jewelry", label: "Biżuteria", desc: "Ręcznie robiona srebrna i złota biżuteria", icon: "gem" },
      { to: "/studio", label: "Studio", desc: "Druk 3D, laser, odlewy żywiczne", icon: "cpu" },
      { to: "/blog", label: "Blog", desc: "Poradniki, inspiracje i wiedza", icon: "book" },
      { to: "/glossary", label: "Glosariusz", desc: "Słownik pojęć biżuterii i fabrykacji", icon: "search" },
      { to: "/contact", label: "Kontakt", desc: "Napisz do nas — odpowiemy w 24h", icon: "mail" },
    ],
  },
  en: {
    title: "Page not found",
    text: "It looks like this page doesn't exist or has been moved.",
    btn: "Back to home",
    metaTitle: "404 — Page Not Found | AEJaCA",
    explore: "You might be looking for:",
    links: [
      { to: "/jewelry", label: "Jewelry", desc: "Handcrafted silver and gold jewelry", icon: "gem" },
      { to: "/studio", label: "Studio", desc: "3D printing, laser, resin casting", icon: "cpu" },
      { to: "/blog", label: "Blog", desc: "Guides, inspiration and knowledge", icon: "book" },
      { to: "/glossary", label: "Glossary", desc: "Jewelry and fabrication terms explained", icon: "search" },
      { to: "/contact", label: "Contact", desc: "Write to us — we reply within 24h", icon: "mail" },
    ],
  },
  de: {
    title: "Seite nicht gefunden",
    text: "Diese Seite existiert nicht oder wurde verschoben.",
    btn: "Zurück zur Startseite",
    metaTitle: "404 — Seite nicht gefunden | AEJaCA",
    explore: "Vielleicht suchen Sie:",
    links: [
      { to: "/jewelry", label: "Schmuck", desc: "Handgefertigter Silber- und Goldschmuck", icon: "gem" },
      { to: "/studio", label: "Studio", desc: "3D-Druck, Laser, Harzguss", icon: "cpu" },
      { to: "/blog", label: "Blog", desc: "Ratgeber, Inspiration und Wissen", icon: "book" },
      { to: "/glossary", label: "Glossar", desc: "Fachbegriffe einfach erklärt", icon: "search" },
      { to: "/contact", label: "Kontakt", desc: "Schreiben Sie uns — Antwort in 24h", icon: "mail" },
    ],
  },
};

const ICONS = { gem: Gem, cpu: Cpu, book: BookOpen, search: Search, mail: Mail };

export default function NotFound() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  return (
    <>
      <SEOHead
        pageKey="home"
        path="/404"
        title={l.metaTitle}
        description={l.text}
        noindex={true}
      />
      <div className="pt-16 min-h-[80vh] flex items-center justify-center px-4 bg-neutral-950">
        <div className="max-w-2xl w-full text-center">
          <div className="text-[10rem] font-mono font-bold leading-none text-white/5 select-none">404</div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-3 -mt-8">{l.title}</h1>
          <p className="text-neutral-400 mb-10">{l.text}</p>

          <div className="mb-10">
            <div className="text-neutral-400 text-xs uppercase tracking-widest mb-5">{l.explore}</div>
            <div className="grid sm:grid-cols-2 gap-3 text-left">
              {l.links.map((link) => {
                const Icon = ICONS[link.icon];
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group flex items-start gap-3 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-amber-400/30 hover:bg-neutral-900 transition-all"
                  >
                    <Icon className="w-5 h-5 text-amber-400/60 group-hover:text-amber-400 mt-0.5 shrink-0 transition-colors" />
                    <div>
                      <div className="text-white font-medium text-sm group-hover:text-amber-300 transition-colors">{link.label}</div>
                      <div className="text-neutral-400 text-xs mt-0.5">{link.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {l.btn}
          </Link>
        </div>
      </div>
    </>
  );
}
