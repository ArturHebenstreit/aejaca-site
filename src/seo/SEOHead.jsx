// ============================================================
// SEOHead - per-page meta + JSON-LD via react-helmet-async
// ------------------------------------------------------------
// SEO / AIO impact:
// - Dynamic <title> & <meta description> per route + language - 
//   critical for SPA ranking (Googlebot now renders JS, but the
//   head must change between routes to avoid duplicate-title).
// - Canonical + hreflang prevent duplicate-content penalties
//   and tell Google which language version to serve per region.
// - Open Graph / Twitter Cards drive social CTR (Facebook,
//   LinkedIn, X, Discord, Slack previews).
// - JSON-LD children are injected via Helmet so every page
//   can ship its own structured data (Service, FAQ, Product).
// ============================================================

import { Helmet } from "react-helmet-async";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getSEO, SITE } from "./seoData.js";
import { JEZYKI, JEZYK_DOMYSLNY, sciezkaJezyka } from "../routes.js";

export default function SEOHead({
  pageKey = "home",
  path = "/",
  image,           // optional override (e.g. product image)
  schemas = [],    // array of JSON-LD objects (Service / FAQ / Product / Breadcrumb)
  noindex = false, // true for thank-you / draft pages
  // Dynamic pages (blog posts, products) supply meta directly - bypass seoData map.
  title,
  description,
  keywords,
  ogAlt,
  ogType = "website",
  articleMeta, // { publishedTime, modifiedTime, author, section, tags[] }
}) {
  const { lang } = useLanguage();
  const base = getSEO(pageKey, lang);
  const seo = {
    title: title || base.title,
    description: description || base.description,
    keywords: keywords || base.keywords,
    ogAlt: ogAlt || base.ogAlt,
  };
  // `path` przychodzi BEZ prefiksu jezyka, bo strona nie musi wiedziec, w
  // ktorym jezyku ja wlasnie rysujemy. Prefiks doklada sie tutaj, raz.
  const sciezka = path === "/" ? "/" : (path.endsWith("/") ? path : path + "/");
  const adres = (jezyk) => {
    const pelna = sciezkaJezyka(sciezka, jezyk);
    return pelna === "/" ? SITE.url : `${SITE.url}${pelna}`;
  };
  const canonical = adres(lang);
  const ogImage = image || SITE.defaultImage;
  const locale = SITE.locales[lang] || SITE.locales.en;

  return (
    <Helmet>
      {/* Document language - signals lang to accessibility tools & crawlers */}
      <html lang={lang} />

      {/* Primary tags - front-loaded keywords boost ranking */}
      <title>{seo.title}</title>
      <meta name="title" content={seo.title} />
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta
        name="robots"
        content={noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}
      />

      {/* Kanoniczny adres TEJ wersji jezykowej. Od 27 sierpnia 2026 kazdy
          jezyk ma wlasny adres (`/studio/`, `/en/studio/`, `/de/studio/`),
          wiec `hreflang` ma wreszcie na co wskazywac. Wczesniej wszystkie trzy
          jezyki dzielily jeden adres i `hreflang` byloby wtedy nie tylko
          bezuzyteczne, ale wprost bledne. */}
      <link rel="canonical" href={canonical} />
      {JEZYKI.map((jezyk) => (
        <link key={jezyk} rel="alternate" hreflang={SITE.hreflang?.[jezyk] || jezyk} href={adres(jezyk)} />
      ))}
      {/* `x-default` to wersja dla kogos, kogo zaden z trzech jezykow nie
          opisuje. Wskazuje polska, bo to ona stoi pod golym adresem. */}
      <link rel="alternate" hreflang="x-default" href={adres(JEZYK_DOMYSLNY)} />

      {/* Open Graph - Facebook, LinkedIn, WhatsApp, Discord previews */}
      <meta property="og:type" content={ogType} />
      {articleMeta?.publishedTime && (
        <meta property="article:published_time" content={articleMeta.publishedTime} />
      )}
      {articleMeta?.modifiedTime && (
        <meta property="article:modified_time" content={articleMeta.modifiedTime} />
      )}
      {articleMeta?.author && (
        <meta property="article:author" content={articleMeta.author} />
      )}
      {articleMeta?.section && (
        <meta property="article:section" content={articleMeta.section} />
      )}
      {articleMeta?.tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={locale} />
      {Object.entries(SITE.locales)
        .filter(([k]) => k !== lang)
        .map(([, v]) => (
          <meta key={v} property="og:locale:alternate" content={v} />
        ))}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={seo.ogAlt || seo.title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter / X Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE.twitterHandle} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={seo.ogAlt || seo.title} />

      {/* JSON-LD structured data - per-page schemas for rich SERP + AIO */}
      {schemas
        .filter(Boolean)
        .map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
    </Helmet>
  );
}
