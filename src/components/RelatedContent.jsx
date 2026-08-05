// ============================================================
// TRESC POWIAZANA, ZE SKLEPU DO WIEDZY
// ============================================================
// Pomiar grafu linkow w zbudowanym serwisie pokazal skale problemu:
//
//   regulaminowe   210,8 linkow wewnetrznych na strone
//   oferta         226,3
//   sklep           31,2
//   haslo slownika   8,7
//   wpis blogowy     5,6
//
// Polityka prywatnosci dostaje trzydziesci osiem razy wiecej linkow niz wpis
// blogowy pisany przez kilka dni. Regulaminow nie da sie odlinkowac, bo czesc
// z nich musi byc dostepna przy zamowieniu. Jedyna dzwignia jest wiec podniesc
// tresc, a nie obnizyc regulaminy.
//
// Szesnascie stron sklepu mialo 499 linkow przychodzacych i NIE oddawalo
// z tego nic: zero odnosnikow do bloga i slownika. Ten komponent to zmienia,
// i przy okazji odpowiada na watpliwosci tam, gdzie klient je ma, czyli przed
// zamowieniem, a nie po.

import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getPostsByCategoryMeta } from "../blog/postsMeta.js";
import { getTermsByCategory } from "../data/glossary.js";

const UI = {
  pl: { tag: "Zanim zamówisz", posts: "Poradniki", terms: "Pojęcia z tej dziedziny", all: "Cały blog" },
  en: { tag: "Before you order", posts: "Guides", terms: "Terms from this field", all: "All articles" },
  de: { tag: "Vor der Bestellung", posts: "Ratgeber", terms: "Begriffe aus diesem Bereich", all: "Alle Artikel" },
};

export default function RelatedContent({ category = "studio", limit = 3, terms = 4, className = "" }) {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const posts = getPostsByCategoryMeta(category).slice(0, limit);
  const slownik = getTermsByCategory(category).slice(0, terms);
  if (!posts.length && !slownik.length) return null;

  const tint = category === "studio" ? "text-blue-400" : "text-amber-400";

  return (
    <section className={`py-14 px-4 bg-neutral-950 ${className}`} aria-labelledby="powiazane-heading">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className={`w-4 h-4 ${tint}`} />
          <h2 id="powiazane-heading" className={`text-xs uppercase tracking-[0.2em] ${tint}`}>{u.tag}</h2>
        </div>

        {posts.length > 0 && (
          <>
            <h3 className="text-white font-medium text-sm mb-3">{u.posts}</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}/`}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] p-4 transition-all duration-300"
                >
                  <h4 className="text-white text-sm font-medium leading-snug mb-1.5 line-clamp-2">
                    {p.title[lang] || p.title.en}
                  </h4>
                  <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">
                    {p.description?.[lang] || p.description?.en}
                  </p>
                  <span className={`inline-flex items-center gap-1 ${tint} text-xs mt-2`}>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {slownik.length > 0 && (
          <>
            <h3 className="text-white font-medium text-sm mb-3">{u.terms}</h3>
            <div className="flex flex-wrap gap-2">
              {slownik.map((term) => (
                <Link
                  key={term.id}
                  to={`/glossary/${term.id}/`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-neutral-300 text-xs hover:border-white/25 hover:text-white transition-all duration-300"
                >
                  {term.term[lang] || term.term.en}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
