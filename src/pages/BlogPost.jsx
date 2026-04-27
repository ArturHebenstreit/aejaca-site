import { useParams, Link, Navigate } from "react-router-dom";
import { Clock, Calendar, Tag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getPost, getSortedPosts } from "../blog/posts.js";
import Prose from "../components/blog/Prose.jsx";
import BlogCard from "../components/blog/BlogCard.jsx";
import FAQ from "../components/FAQ.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import {
  buildArticleSchema,
  buildFAQSchema,
  buildBreadcrumbSchema,
} from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";

const CATEGORY_LABELS = {
  jewelry: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck" },
  studio:  { pl: "sTuDiO", en: "sTuDiO", de: "sTuDiO" },
};

function formatDate(dateStr, lang) {
  return new Date(dateStr).toLocaleDateString(
    { pl: "pl-PL", en: "en-US", de: "de-DE" }[lang] || "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
}

function TOC({ items, lang }) {
  const label = { pl: "Spis treści", en: "Table of contents", de: "Inhaltsverzeichnis" }[lang] || "Table of contents";
  if (!items || !items.length) return null;
  return (
    <nav className="mb-10 rounded-xl border border-white/10 bg-white/[0.02] p-5" aria-label={label}>
      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-3 font-semibold">{label}</div>
      <ol className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-neutral-300 hover:text-amber-400 transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const post = getPost(slug);

  if (!post) return <Navigate to="/blog/" replace />;

  const { Body } = post;
  const title = post.title[lang] || post.title.pl;
  const description = post.description[lang] || post.description.pl;
  const readTime = post.readingTime[lang] || post.readingTime.pl;
  const faqItems = post.faq?.[lang] || post.faq?.pl;
  const tocItems = post.toc?.[lang] || post.toc?.pl;
  const catLabel = CATEGORY_LABELS[post.category]?.[lang] || post.category;
  const accent = post.accent || "amber";

  const pageUrl = `${SITE.url}/blog/${post.slug}/`;
  const schemas = [
    buildArticleSchema({
      headline: title,
      description,
      url: pageUrl,
      image: `${SITE.url}${post.coverImage}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      keywords: post.keywords?.[lang] || post.keywords?.pl,
      articleSection: catLabel,
      inLanguage: lang,
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: "Blog", url: `${SITE.url}/blog/` },
      { name: title, url: pageUrl },
    ]),
    faqItems?.length && buildFAQSchema(faqItems),
  ];

  const allPosts = getSortedPosts();
  const explicit = post.relatedPosts?.map((s) => allPosts.find((p) => p.slug === s)).filter(Boolean);
  const sameCat = allPosts.filter((p) => p.slug !== slug && p.category === post.category);
  const related = (explicit?.length ? explicit : sameCat).slice(0, 3);

  const relatedLabel = { pl: "Przeczytaj też", en: "Also read", de: "Lies auch" }[lang] || "Also read";

  return (
    <>
      <SEOHead
        pageKey="home"
        path={`/blog/${post.slug}/`}
        title={title}
        description={description}
        keywords={post.keywords?.[lang]}
        image={`${SITE.url}${post.coverImage}`}
        ogType="article"
        articleMeta={{
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt || post.publishedAt,
          author: "Artur Hebenstreit",
          section: catLabel,
          tags: post.keywords?.[lang]?.split(", "),
        }}
        schemas={schemas}
      />
      <div className="pt-16">
        {/* Hero */}
        <section className="bg-neutral-950 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <Breadcrumb items={[
              { href: "/", label: "Home" },
              { href: "/blog/", label: "Blog" },
              { label: title },
            ]} />

            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-neutral-400">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                accent === "blue" ? "border-blue-400/30 text-blue-400" : "border-amber-400/30 text-amber-400"
              }`}>
                <Tag className="w-3 h-3" />
                {catLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, lang)}</time>
              </span>
              {post.updatedAt && post.updatedAt !== post.publishedAt && (
                <span className="inline-flex items-center gap-1 text-neutral-400">
                  ·
                  <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, lang)}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readTime} min
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.15] mb-6">
              {title}
            </h1>
            <p className="text-neutral-300 text-lg leading-relaxed mb-8">
              {description}
            </p>
          </div>
        </section>

        {/* Cover image */}
        <section className="bg-neutral-950 px-4 pb-10">
          <div className="max-w-4xl mx-auto">
            <img
              src={post.coverImage}
              alt={title}
              className="w-full rounded-2xl object-cover max-h-[400px]"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1200"
              height="509"
            />
          </div>
        </section>

        {/* Article body */}
        <article className="py-12 px-4 bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            <TOC items={tocItems} lang={lang} />
            <Prose accent={accent}>
              <Body lang={lang} />
            </Prose>
          </div>
        </article>

        <div className="gradient-divider" />

        {/* FAQ */}
        {faqItems?.length > 0 && (
          <>
            <FAQ
              data={{ tag: "FAQ", title: "FAQ", items: faqItems }}
              accent={accent}
              id="faq"
            />
            <div className="gradient-divider" />
          </>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="py-16 px-4 bg-neutral-900/50">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-white mb-8 text-center">{relatedLabel}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {related.map((p) => (
                  <BlogCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
