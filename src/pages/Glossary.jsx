import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { GLOSSARY, CATEGORIES } from "../data/glossary.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";

const LABELS = {
  pl: {
    tag: "Glosariusz",
    title: "Slownik pojec",
    description: "Kluczowe pojecia z zakresu bizuterii, druku 3D, grawerowania laserowego i odlewow zywicznych — wyjasnienia w prostych slowach.",
    search: "Szukaj pojecia...",
    all: "Wszystkie",
    readMore: "Czytaj wiecej",
    noResults: "Brak wynikow dla",
  },
  en: {
    tag: "Glossary",
    title: "Key terms explained",
    description: "Essential terms from jewelry, 3D printing, laser engraving, and resin casting — explained in plain language.",
    search: "Search terms...",
    all: "All",
    readMore: "Read more",
    noResults: "No results for",
  },
  de: {
    tag: "Glossar",
    title: "Fachbegriffe erklaert",
    description: "Wichtige Begriffe aus Schmuck, 3D-Druck, Lasergravur und Harzguss — einfach erklaert.",
    search: "Begriff suchen...",
    all: "Alle",
    readMore: "Mehr lesen",
    noResults: "Keine Ergebnisse fuer",
  },
};

function buildFAQSchema(terms, lang) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: terms.map((t) => ({
      "@type": "Question",
      name: `${t.term[lang]}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: t.definition[lang],
      },
    })),
  };
}

export default function Glossary() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const headerRef = useScrollReveal();
  const getCardRef = useStaggerReveal(80);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return GLOSSARY.filter((t) => {
      const matchesCat = activeCat === "all" || t.category === activeCat;
      const matchesQuery =
        !q ||
        t.term[lang]?.toLowerCase().includes(q) ||
        t.definition[lang]?.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, activeCat, lang]);

  const pageUrl = `${SITE.url}/glossary`;
  const schemas = [
    buildWebPageSchema({ title: `${l.tag} — ${SITE.name}`, description: l.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.tag, url: pageUrl },
    ]),
    buildFAQSchema(GLOSSARY, lang),
  ];

  const cats = ["all", ...Object.keys(CATEGORIES)];

  return (
    <>
      <SEOHead
        pageKey="glossary"
        path="/glossary"
        title={`${l.tag} — ${SITE.name}`}
        description={l.description}
        schemas={schemas}
      />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-6xl mx-auto">
            <div ref={headerRef} className="reveal text-center mb-10">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{l.tag}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {l.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{l.description}</p>
            </div>

            <div className="max-w-xl mx-auto mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={l.search}
                className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>

            <div className="flex justify-center gap-2 flex-wrap mb-10">
              {cats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    activeCat === cat
                      ? "bg-amber-400 text-neutral-950 font-medium"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {cat === "all" ? l.all : (CATEGORIES[cat]?.[lang] || CATEGORIES[cat]?.en)}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-neutral-500">
                {l.noResults} &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((term, i) => (
                  <div
                    key={term.id}
                    ref={getCardRef(i)}
                    className="reveal-scale bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 hover:border-amber-400/30 transition-colors"
                  >
                    <div className="text-amber-400/70 text-[10px] uppercase tracking-widest mb-2">
                      {CATEGORIES[term.category]?.[lang] || term.category}
                    </div>
                    <h2 className="text-white font-semibold text-lg mb-2">
                      {term.term[lang] || term.term.en}
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-3">
                      {term.definition[lang] || term.definition.en}
                    </p>
                    {term.relatedBlog && (
                      <Link
                        to={`/blog/${term.relatedBlog}`}
                        className="text-amber-400 text-xs hover:underline"
                      >
                        {l.readMore} &rarr;
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
