import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { getSortedPosts } from "../blog/posts.js";
import BlogCard from "../components/blog/BlogCard.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";

const LABELS = {
  pl: {
    tag: "Blog",
    title: "Wiedza, porady i inspiracje",
    description: "Praktyczne przewodniki po biżuterii na zamówienie, druku 3D i grawerowaniu laserowym. Ceny, procesy, materiały — wszystko w jednym miejscu.",
  },
  en: {
    tag: "Blog",
    title: "Knowledge, tips & inspiration",
    description: "Practical guides to custom jewelry, 3D printing, and laser engraving. Pricing, processes, materials — all in one place.",
  },
  de: {
    tag: "Blog",
    title: "Wissen, Tipps & Inspiration",
    description: "Praktische Leitfäden zu individuellem Schmuck, 3D-Druck und Lasergravur. Preise, Prozesse, Materialien — alles an einem Ort.",
  },
};

export default function BlogIndex() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const posts = getSortedPosts();
  const headerRef = useScrollReveal();
  const getCardRef = useStaggerReveal(100);

  const pageUrl = `${SITE.url}/blog/`;
  const schemas = [
    buildWebPageSchema({ title: `${l.tag} — ${l.title} — ${SITE.name}`, description: l.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "Blog", url: pageUrl },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="home"
        path="/blog"
        title={`${l.tag} — ${l.title} — ${SITE.name}`}
        description={l.description}
        schemas={schemas}
      />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-6xl mx-auto">
            <div ref={headerRef} className="reveal text-center mb-14">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{l.tag}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {l.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{l.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <div key={post.slug} ref={getCardRef(i)} className="reveal-scale">
                  <BlogCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
