import { Link } from "react-router-dom";
import { ArrowRight, Zap, Sparkles, FileUp, Printer, Flame, Cpu, Scissors, Star } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal.js";
import { getSortedPosts } from "../blog/posts.js";
import BlogCard from "../components/blog/BlogCard.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import {
  buildReviewsAugmentedOrganization,
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
} from "../seo/schemas.js";
import { SITE, getSEO } from "../seo/seoData.js";
import GoogleReviews from "../components/GoogleReviews.jsx";
import { GOOGLE_BUSINESS, REVIEWS } from "../data/googleReviews.js";

export default function Home() {
  const { t, lang } = useLanguage();
  const h = t.home;

  const brandRef = useScrollReveal();
  const quoteRef = useScrollReveal();
  const worldsRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const getCardRef = useStaggerReveal(120);

  // Build structured data at render time so it picks up current language.
  // Organization (augmented with aggregateRating + Review[]) gives Google
  // star ratings in SERP (+20-30% CTR) + LLM trust signal for AIO.
  const seo = getSEO("home", lang);
  const schemas = [
    buildReviewsAugmentedOrganization({
      rating: GOOGLE_BUSINESS.rating,
      reviewCount: GOOGLE_BUSINESS.totalReviews,
      reviews: REVIEWS,
    }),
    buildWebPageSchema({ title: seo.title, description: seo.description, url: SITE.url, lang }),
    buildBreadcrumbSchema([{ name: "Home", url: SITE.url }]),
    buildLocalBusinessSchema(),
  ];

  return (
    <>
      <SEOHead pageKey="home" path="/" schemas={schemas} />
      <div className="pt-16">
        {/* Hero intro — visible StoryBrand tagline (H1 now visible, not sr-only).
            One H1 per page = SEO rule; value prop is front-and-center for humans + LLMs. */}
        <section className="bg-neutral-950 pt-10 pb-6 md:pt-14 md:pb-8 px-4 text-center" aria-labelledby="hero-tagline">
          <h1
            id="hero-tagline"
            className="font-serif text-3xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight max-w-4xl mx-auto leading-[1.1]"
          >
            {h.h1}
          </h1>
          {h.heroSubtitle && (
            <p className="mt-4 md:mt-6 text-neutral-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {h.heroSubtitle}
            </p>
          )}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/20 bg-amber-400/[0.03]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-amber-300">{GOOGLE_BUSINESS.rating}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-400">{GOOGLE_BUSINESS.totalReviews} {h.brandReviewsBadge}</span>
          </div>
        </section>

        {/* Split Hero — two equal paths (jewelry / studio) act as primary CTAs */}
        <section className="relative min-h-[calc(40vh-4rem)] flex flex-col md:flex-row" aria-label={h.heroAria || "AEJaCA — two worlds"}>
          {/* Jewelry Panel */}
          <Link to="/jewelry" className="group relative flex-1 min-h-[35vh] md:min-h-full overflow-hidden cursor-pointer" aria-label={h.jewelryBtn}>
            {/* LCP image: eager + fetchpriority=high tells browser to prioritize — Core Web Vitals (LCP < 2.5s) */}
            <img
              src="/hero-jewelry.webp"
              alt="AEJaCA Jewelry — handcrafted silver and gold jewelry with natural gemstones"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1024"
              height="572"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/60 transition-all duration-500" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-8 text-center">
              <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-6">{h.jewelryDesc}</p>
              <span className="inline-flex items-center gap-2 px-6 py-3 border border-amber-400/30 bg-amber-400/5 backdrop-blur-md text-amber-300 rounded-full text-sm tracking-wide group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 transition-all duration-300">
                {h.jewelryBtn} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <div className="hidden md:block w-px bg-white/20" />

          {/* Studio Panel */}
          <Link to="/studio" className="group relative flex-1 min-h-[35vh] md:min-h-full overflow-hidden cursor-pointer" aria-label={h.studioBtn}>
            <img
              src="/hero-studio.webp"
              alt="AEJaCA sTuDiO — 3D printing, laser engraving, resin casting, and custom fabrication"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1024"
              height="572"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/60 transition-all duration-500" />
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-8 text-center">
              <p className="text-neutral-200 max-w-md text-sm md:text-base leading-relaxed mb-6">{h.studioDesc}</p>
              <span className="inline-flex items-center gap-2 px-6 py-3 border border-blue-400/30 bg-blue-400/5 backdrop-blur-md text-blue-300 rounded-full text-sm tracking-wide group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                {h.studioBtn} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>

      {/* Brand Statement */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={brandRef} className="reveal max-w-3xl mx-auto">
          {/* Below-the-fold image: lazy loaded to save bandwidth — no LCP impact */}
          <img src="/brand-sign.webp" alt="AEJaCA brand mark" loading="lazy" decoding="async" className="w-36 h-36 mx-auto mb-8 brightness-0 invert opacity-80 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" />
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">{h.brandHeading}</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">{h.brandText}</p>
          <a href="#reviews" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full border border-amber-400/20 bg-amber-400/[0.03] text-sm hover:bg-amber-400/10 hover:border-amber-400/40 transition-all duration-300">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-amber-300">{GOOGLE_BUSINESS.rating}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-400">{GOOGLE_BUSINESS.totalReviews} {h.brandReviewsBadge}</span>
          </a>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Quick Quote — showcase calculators + STL/SVG upload (conversion driver) */}
      <section className="py-20 px-4 bg-gradient-to-b from-neutral-950 via-neutral-900/30 to-neutral-950">
        <div ref={quoteRef} className="reveal max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs uppercase tracking-[0.2em]">{h.quickQuoteTag}</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
              {h.quickQuoteTitle}
            </h2>
            <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {h.quickQuoteSubtitle}
            </p>
          </div>

          {/* Two calculator cards — Jewelry + Studio (side by side) */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Link to="/jewelry#calculator" className="group relative rounded-2xl overflow-hidden border border-amber-400/20 bg-gradient-to-br from-amber-950/20 to-neutral-950 p-6 md:p-8 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <Sparkles className="w-7 h-7 text-amber-400" />
                <span className="text-amber-400/60 text-xs tracking-wider uppercase">{h.quickQuoteJewelryTag}</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-white mb-3">{h.quickQuoteJewelryTitle}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">{h.quickQuoteJewelryDesc}</p>
              <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:text-amber-300 transition-colors">
                {h.quickQuoteJewelryCta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link to="/studio#calculator" className="group relative rounded-2xl overflow-hidden border border-blue-400/20 bg-gradient-to-br from-blue-950/20 to-neutral-950 p-6 md:p-8 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <FileUp className="w-7 h-7 text-blue-400" />
                <span className="text-blue-400/60 text-xs tracking-wider uppercase">{h.quickQuoteStudioTag}</span>
              </div>
              <h3 className="font-sans text-xl md:text-2xl font-semibold text-white mb-3">{h.quickQuoteStudioTitle}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">{h.quickQuoteStudioDesc}</p>
              <span className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                {h.quickQuoteStudioCta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          {/* Green STL/SVG banner with 4 deep-link tiles inside */}
          <div className="rounded-2xl overflow-hidden border border-emerald-400/20 bg-gradient-to-r from-emerald-950/20 via-neutral-900/50 to-emerald-950/20 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-6">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                  <FileUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-emerald-400/70 text-xs uppercase tracking-wider">{h.quickQuoteStlTag}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-lg font-semibold text-white mb-1">{h.quickQuoteStlTitle}</h3>
                <p className="text-neutral-400 text-sm">{h.quickQuoteStlDesc}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: "/studio?tab=3dprint", Icon: Printer, title: h.quickQuote3dTitle, desc: h.quickQuote3dDesc, cta: h.quickQuote3dCta, img: "/img/calc/home/print3d.webp" },
                { to: "/studio?tab=co2_laser", Icon: Flame, title: h.quickQuoteCo2EngTitle, desc: h.quickQuoteCo2EngDesc, cta: h.quickQuoteCo2EngCta, img: "/img/calc/home/co2engrave.webp" },
                { to: "/studio?tab=fiber_laser", Icon: Cpu, title: h.quickQuoteFiberTitle, desc: h.quickQuoteFiberDesc, cta: h.quickQuoteFiberCta, img: "/img/calc/home/fiber.webp" },
                { to: "/studio?tab=co2_laser&co2mode=cut", Icon: Scissors, title: h.quickQuoteCo2CutTitle, desc: h.quickQuoteCo2CutDesc, cta: h.quickQuoteCo2CutCta, img: "/img/calc/home/co2cut.webp" },
              ].map(({ to, Icon, title, desc, cta, img }) => (
                <Link key={to} to={to} className="group relative rounded-xl overflow-hidden border border-emerald-400/10 hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-900/10 transition-all duration-300 min-h-[180px]">
                  <div className="absolute inset-0">
                    <img src={img} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
                  </div>
                  <div className="relative p-3 h-full min-h-[180px] flex flex-col justify-end">
                    <Icon className="w-5 h-5 text-emerald-400 mb-1.5 drop-shadow-lg" />
                    <h4 className="font-sans text-sm font-bold text-white mb-0.5 drop-shadow-lg">{title}</h4>
                    <p className="text-neutral-300 text-[10px] leading-snug mb-2 drop-shadow-md">{desc}</p>
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium group-hover:text-emerald-300 transition-colors">
                      {cta} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Blog highlights — internal linking + content discovery (SEO + AIO) */}
      <section className="py-16 px-4 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">Blog</div>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight">
              {h.blogTitle}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSortedPosts().slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {h.blogAllLink} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Two Worlds */}
      <section className="py-16 px-4 bg-neutral-900/50">
        <div ref={worldsRef} className="reveal max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div ref={getCardRef(0)} className="reveal-scale rounded-2xl glass-amber p-8 hover:shadow-lg hover:shadow-amber-900/10 transition-shadow duration-300">
            <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{h.artisticLuxury}</div>
            <h3 className="font-serif text-2xl font-semibold mb-4">{h.jewelryCardTitle}</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              {h.jewelryCardItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/jewelry" className="inline-flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300 transition-colors group/link">
              {h.learnMore} <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>

          <div ref={getCardRef(1)} className="reveal-scale rounded-2xl glass-blue p-8 hover:shadow-lg hover:shadow-blue-900/10 transition-shadow duration-300">
            <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{h.technicalEngineering}</div>
            <h3 className="font-sans text-2xl font-semibold mb-4">{h.studioCardTitle}</h3>
            <ul className="space-y-2 text-neutral-300 text-sm mb-6">
              {h.studioCardItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/studio" className="inline-flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300 transition-colors group/link">
              {h.learnMore} <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Google Reviews — social proof before CTA (trust → action pattern) */}
      <GoogleReviews id="reviews" limit={6} />

      <div className="gradient-divider" />

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-neutral-950">
        <div ref={ctaRef} className="reveal">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4">{h.ctaHeading}</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">{h.ctaText}</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10 transition-all duration-300">
            {h.ctaBtn} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}
