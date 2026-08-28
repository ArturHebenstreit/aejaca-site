// ============================================================
// Prose - shared typography wrapper for blog article bodies
// ------------------------------------------------------------
// Why custom (nie @tailwindcss/typography):
// - AEJaCA-specific palette (amber for jewelry, blue for studio)
// - Full control over heading sizes, link colors, callout styling
// - Zero extra deps (Tailwind 4 native utilities only)
// ============================================================

import { Link } from "../../i18n/nav.jsx";

export default function Prose({ accent = "amber", children }) {
  const accentClasses = accent === "blue"
    ? "prose-blue"
    : "prose-amber";
  return (
    <div className={`aejaca-prose ${accentClasses} text-neutral-300 text-[17px] leading-[1.75]`}>
      {children}
    </div>
  );
}

// Section heading (H2) - auto-scrollable via id; renders anchor for TOC
export function H2({ id, children }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 font-serif text-2xl md:text-3xl font-semibold text-white mt-14 mb-5 tracking-tight"
    >
      {children}
    </h2>
  );
}

export function H3({ id, children }) {
  return (
    <h3
      id={id}
      className="scroll-mt-24 font-sans text-xl md:text-2xl font-semibold text-white mt-10 mb-4 tracking-tight"
    >
      {children}
    </h3>
  );
}

export function P({ children }) {
  return <p className="mb-5">{children}</p>;
}

export function Lead({ children }) {
  return (
    <p className="text-lg md:text-xl text-neutral-200 leading-relaxed mb-8 font-light">
      {children}
    </p>
  );
}

export function UL({ children }) {
  return <ul className="mb-6 space-y-2 list-disc pl-6 marker:text-neutral-400">{children}</ul>;
}

export function OL({ children }) {
  return <ol className="mb-6 space-y-2 list-decimal pl-6 marker:text-neutral-400">{children}</ol>;
}

export function LI({ children }) {
  return <li className="leading-relaxed">{children}</li>;
}

export function A({ href, children, external = false }) {
  const isInternal = href.startsWith("/");
  const classes = "text-amber-400 hover:text-amber-300 underline decoration-amber-500/40 underline-offset-4 transition-colors";
  if (isInternal && !external) {
    const to = href.includes("#") || href.endsWith("/") ? href : href + "/";
    return <Link to={to} className={classes}>{children}</Link>;
  }
  return (
    <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Strong({ children }) {
  return <strong className="text-white font-semibold">{children}</strong>;
}

// Callout - highlighted insight box; great for AIO (LLMs love structured facts)
export function Callout({ accent = "amber", title, children }) {
  const palette = accent === "blue"
    ? "border-blue-400/30 bg-blue-500/5"
    : "border-amber-400/30 bg-amber-500/5";
  const headingColor = accent === "blue" ? "text-blue-300" : "text-amber-300";
  return (
    <aside className={`my-8 rounded-xl border ${palette} p-5 md:p-6`}>
      {title && (
        <div className={`text-xs uppercase tracking-[0.2em] ${headingColor} mb-2 font-semibold`}>
          {title}
        </div>
      )}
      <div className="text-neutral-200 text-base leading-relaxed">{children}</div>
    </aside>
  );
}

// Comparison table - minimal styling, semantic HTML for accessibility
export function Table({ headers, rows }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-semibold text-white border-b border-white/10">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-white/5 last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-neutral-300 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline CTA block - drives from article → calculator / contact
export function CTABox({ accent = "amber", title, text, href, cta }) {
  const palette = accent === "blue"
    ? "from-blue-950/40 to-neutral-900 border-blue-400/30"
    : "from-amber-950/40 to-neutral-900 border-amber-400/30";
  const btnColor = accent === "blue"
    ? "bg-blue-500 hover:bg-blue-400 text-white"
    : "bg-amber-400 hover:bg-amber-300 text-black";
  const to = href.startsWith("/") && !href.includes("#") && !href.endsWith("/") ? href + "/" : href;
  return (
    <aside className={`my-10 rounded-2xl border bg-gradient-to-br ${palette} p-6 md:p-8 text-center`}>
      <h3 className="font-serif text-xl md:text-2xl font-semibold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-neutral-300 mb-5 max-w-xl mx-auto">{text}</p>
      <Link
        to={to}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm ${btnColor} transition-colors shadow-lg`}
      >
        {cta}
      </Link>
    </aside>
  );
}

// ------------------------------------------------------------
// Zrodla pod wpisem
// ------------------------------------------------------------
// Cytowanie zrodel jest najsilniejsza pojedyncza dzwignia widocznosci
// w wyszukiwarkach opartych na modelach jezykowych (badanie GEO, KDD 2024:
// +40% cytowan, a przy witrynach o niskiej pozycji wyjsciowej nawet +115%).
// Dziala tez w druga strone, na czytelnika: twierdzenie o twardosci stopu
// albo o przepisie unijnym jest warte tyle, ile jego zrodlo.
//
// Blok jest jeden i wspolny, zeby zrodla wygladaly tak samo we wszystkich
// wpisach i zeby dalo sie je pozniej wystawic maszynowo w danych
// strukturalnych, zamiast wylawiac odnosniki z tresci.
//
//   <Sources lang={lang} items={[
//     { title: "PN-EN ISO 9202, proby stopow metali szlachetnych", href: "https://..." },
//     { title: "REACH, zalacznik XVII, pozycja 27 (nikiel)", href: "https://...", note: "limit uwalniania niklu" },
//   ]} />

const SOURCES_LABEL = {
  pl: "Źródła",
  en: "Sources",
  de: "Quellen",
};

export function Sources({ lang = "pl", items = [] }) {
  if (!items.length) return null;
  const label = SOURCES_LABEL[lang] || SOURCES_LABEL.en;

  return (
    <section className="my-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">{label}</h2>
      <ol className="space-y-2.5 list-decimal list-inside marker:text-neutral-600">
        {items.map((s) => (
          <li key={s.href} className="text-sm text-neutral-400 leading-relaxed">
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-200 hover:text-amber-400 underline decoration-white/20 underline-offset-4 transition-colors"
            >
              {s.title}
            </a>
            {s.note ? <span className="text-neutral-500">, {s.note}</span> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
