import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { GLOSSARY, CATEGORIES } from "../data/glossary.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";

const LABELS = {
  pl: {
    glossary: "Słownik pojęć",
    category: "Kategoria",
    relatedArticle: "Powiązany artykuł",
    relatedTerms: "Powiązane pojęcia",
    backToGlossary: "← Wróć do glosariusza",
    notFound: "Nie znaleziono pojęcia",
    readArticle: "Czytaj artykuł →",
  },
  en: {
    glossary: "Glossary",
    category: "Category",
    relatedArticle: "Related article",
    relatedTerms: "Related terms",
    backToGlossary: "← Back to glossary",
    notFound: "Term not found",
    readArticle: "Read article →",
  },
  de: {
    glossary: "Glossar",
    category: "Kategorie",
    relatedArticle: "Verwandter Artikel",
    relatedTerms: "Verwandte Begriffe",
    backToGlossary: "← Zurück zum Glossar",
    notFound: "Begriff nicht gefunden",
    readArticle: "Artikel lesen →",
  },
};

function buildDefinedTermSchema(term, lang) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term[lang] || term.term.en,
    description: term.definition[lang] || term.definition.en,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "AEJaCA Glossary",
      url: `${SITE.url}/glossary`,
    },
    url: `${SITE.url}/glossary/${term.id}`,
  };
}

export default function GlossaryTerm() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const headerRef = useScrollReveal();

  const term = GLOSSARY.find((t) => t.id === id);

  if (!term) {
    return (
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-serif text-white mb-4">{l.notFound}</h1>
            <Link to="/glossary" className="text-amber-400 hover:underline">{l.backToGlossary}</Link>
          </div>
        </section>
      </div>
    );
  }

  const termName = term.term[lang] || term.term.en;
  const termDef = term.definition[lang] || term.definition.en;
  const catLabel = CATEGORIES[term.category]?.[lang] || term.category;
  const catColorClass = term.category === "jewelry" ? "text-amber-400" : term.category === "studio" ? "text-blue-400" : "text-emerald-400";

  const related = GLOSSARY.filter((t) => t.category === term.category && t.id !== term.id).slice(0, 6);

  const pageUrl = `${SITE.url}/glossary/${term.id}`;
  const schemas = [
    buildWebPageSchema({ title: `${termName} — ${SITE.name}`, description: termDef, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.glossary, url: `${SITE.url}/glossary` },
      { name: termName, url: pageUrl },
    ]),
    buildDefinedTermSchema(term, lang),
  ];

  return (
    <>
      <SEOHead
        pageKey="glossary"
        path={`/glossary/${term.id}`}
        title={`${termName} — ${l.glossary} — ${SITE.name}`}
        description={termDef}
        schemas={schemas}
      />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <Breadcrumb items={[
              { href: "/", label: "Home" },
              { href: "/glossary", label: l.glossary },
              { label: termName },
            ]} />

            <div ref={headerRef} className="reveal">
              <div className={`${catColorClass} text-xs uppercase tracking-[0.2em] mb-3`}>
                {l.category}: {catLabel}
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-6">
                {termName}
              </h1>
              <p className="text-neutral-300 text-lg leading-relaxed mb-8">
                {termDef}
              </p>

              {term.relatedBlog && (
                <div className="mb-10 p-5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">{l.relatedArticle}</div>
                  <Link
                    to={`/blog/${term.relatedBlog}`}
                    className={`${catColorClass} hover:underline font-medium`}
                  >
                    {l.readArticle}
                  </Link>
                </div>
              )}

              {related.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-white font-semibold text-xl mb-5">{l.relatedTerms}</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        to={`/glossary/${r.id}`}
                        className="block p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-400/30 transition-colors"
                      >
                        <div className="text-white font-medium mb-1">{r.term[lang] || r.term.en}</div>
                        <p className="text-neutral-400 text-sm line-clamp-2">
                          {r.definition[lang] || r.definition.en}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10">
                <Link to="/glossary" className={`${catColorClass} hover:underline text-sm`}>
                  {l.backToGlossary}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
