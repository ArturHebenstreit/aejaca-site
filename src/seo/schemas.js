// ============================================================
// JSON-LD SCHEMA BUILDERS — structured data for SEO & AIO
// ------------------------------------------------------------
// Why this exists:
// - Structured data is THE signal Google/Bing use to render rich
//   results (stars, FAQs, breadcrumbs) in SERP.
// - ChatGPT, Claude, Gemini heavily rely on JSON-LD to understand
//   entities, offers, and pricing — critical for AI Search (AIO).
// - FAQPage schema is especially important: LLM crawlers ingest
//   Q&A pairs directly as ground-truth answers.
//
// All builders return plain JS objects that <SEOHead /> serializes
// into <script type="application/ld+json"> tags via Helmet.
// ============================================================

import { SITE } from "./seoData.js";

// ---------- Core entities (stable across pages) ----------

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    email: "contact@aejaca.com",
    telephone: "+48780737786",
    founder: { "@type": "Person", name: "Artur Hebenstreit" },
    sameAs: [
      "https://aejacashop.etsy.com",
      "https://aejaca2studio.etsy.com",
      "https://www.instagram.com/aejaca_",
      "https://www.tiktok.com/@aejaca_",
      "https://www.facebook.com/people/Artisan-Elegance-Jewelry-and-Crafted-Art/61570057929428/",
      "https://www.youtube.com/@aejaca",
    ],
  };
}

// ---------- Per-page WebPage wrapper ----------
// Ties together language, canonical URL, breadcrumbs — signals page-level intent to crawlers.
export function buildWebPageSchema({ title, description, url, lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
    },
  };
}

// ---------- Breadcrumb trail (sitelinks in SERP) ----------
// Provides hierarchical context; Google renders breadcrumb trail directly in results.
export function buildBreadcrumbSchema(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------- Service offering (for Jewelry / Studio service pages) ----------
// Google uses Service schema to surface provider + price range in local/service SERPs.
// AI assistants use this to answer "how much does X cost" queries directly.
export function buildServiceSchema({ name, description, serviceType, url, offers }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    url,
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: [
      { "@type": "Country", name: "Poland" },
      { "@type": "Country", name: "European Union" },
      { "@type": "Place", name: "Worldwide" },
    ],
    ...(offers && {
      offers: {
        "@type": "Offer",
        priceCurrency: offers.currency || "EUR",
        price: offers.price,
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: offers.minPrice,
          maxPrice: offers.maxPrice,
          priceCurrency: offers.currency || "EUR",
        },
        availability: "https://schema.org/InStock",
        url,
      },
    }),
  };
}

// ---------- Product schema (for individual jewelry pieces / studio products) ----------
// Required for Merchant listings + Google Shopping. `aggregateRating` + `offers`
// combo triggers rich "star review" snippet in SERP — big CTR boost.
export function buildProductSchema({ name, description, image, sku, price, currency = "EUR", inStock = true, rating, reviewCount }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    sku,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: String(price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };
  if (rating && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(rating),
      reviewCount: String(reviewCount),
    };
  }
  return schema;
}

// ---------- FAQPage (primary AIO signal) ----------
// Critical for AI Search: LLMs (ChatGPT, Gemini, Perplexity) ingest Q&A pairs
// as direct answers. Google renders expandable FAQ dropdowns in SERP.
export function buildFAQSchema(items) {
  if (!items || !items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };
}
