// ============================================================
// GoogleReviews - embed opinii z Google Business Profile
// ------------------------------------------------------------
// CRO / Trust impact:
// - Social proof nad foldem = +34% konwersji (Baymard Institute)
// - Prawdziwe recenzje z atrybucją Google = najsilniejszy trust signal
// - Dwa CTAs: "Zobacz więcej na Google Maps" + "Dodaj swoją opinię"
//   (strategia: budowanie większej bazy recenzji przez aktywną prośbę)
//
// SEO / AIO:
// - aggregateRating w JSON-LD → gwiazdki w SERP (CTR +20-30%)
// - Review[] z publisher:Google = jawna atrybucja (SEO-safe gray zone)
// - Każda recenzja widoczna na stronie = parity z claim'em w schema
//
// A11y:
// - aria-label na gwiazdkach, semantic <article> per opinia
// - lang attribute na treści oryginalnej
// ============================================================

import { useState } from "react";
import { Star, ExternalLink, Edit3 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { GOOGLE_BUSINESS, REVIEWS } from "../data/googleReviews.js";

// Google "G" badge (inline SVG, brand-accurate)
function GoogleLogo({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

// 5-star rating renderer
function Stars({ rating = 5, size = "w-4 h-4" }) {
  return (
    <div className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-neutral-700"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

const LABELS = {
  pl: {
    tag: "Opinie z Google",
    verification: "Wszystkie opinie pochodzą z profilu AEJaCA w Google Maps i wyświetlamy je w całości, bez wybierania korzystnych. Opinię może tam wystawić każdy, kto ma konto Google, a my nie mamy możliwości ani usunięcia opinii, ani sprawdzenia, czy jej autor faktycznie u nas kupił. Nie zamawiamy opinii i nie płacimy za nie.",
    title: "Co mówią nasi klienci",
    basedOn: "opinii na Google",
    showMore: "Pokaż więcej opinii",
    showLess: "Zwiń",
    viewAll: "Zobacz wszystkie na Google Maps",
    writeReview: "Dodaj swoją opinię na Google",
    translationOf: "Tłumaczenie",
    ratingOnly: "Ocena bez komentarza",
  },
  en: {
    tag: "Google Reviews",
    verification: "Every review comes from the AEJaCA profile on Google Maps and is shown in full, without cherry-picking the flattering ones. Anyone with a Google account can post one there; we can neither remove a review nor verify that its author actually bought from us. We do not solicit or pay for reviews.",
    title: "What our clients say",
    basedOn: "reviews on Google",
    showMore: "Show more reviews",
    showLess: "Collapse",
    viewAll: "See all on Google Maps",
    writeReview: "Write your review on Google",
    translationOf: "Translation",
    ratingOnly: "Rating without comment",
  },
  de: {
    tag: "Google-Bewertungen",
    verification: "Alle Bewertungen stammen aus dem AEJaCA-Profil bei Google Maps und werden vollständig angezeigt, ohne Auswahl der vorteilhaften. Dort kann jeder mit einem Google-Konto eine Bewertung abgeben; wir können weder eine Bewertung entfernen noch prüfen, ob die Person tatsächlich bei uns gekauft hat. Wir bestellen keine Bewertungen und bezahlen nicht dafür.",
    title: "Was unsere Kunden sagen",
    basedOn: "Bewertungen auf Google",
    showMore: "Mehr Bewertungen anzeigen",
    showLess: "Einklappen",
    viewAll: "Alle auf Google Maps ansehen",
    writeReview: "Eigene Bewertung auf Google schreiben",
    translationOf: "Übersetzung",
    ratingOnly: "Bewertung ohne Kommentar",
  },
};

// ============================================================
// DATA OPINII
// ============================================================
// Wczesniej stalo tu "4 tyg. temu", liczone z `Date.now()`. Taki napis ma dwie
// rozne wartosci: jedna w chwili prerenderu, druga w chwili ogladania strony.
// React porownuje jedno z drugim przy hydracji, nie zgadza sie i wyrzuca caly
// gotowy HTML do kosza, zeby narysowac strone od nowa na telefonie klienta.
// Kosztowalo to strone glowna i obie strony marek.
//
// Miesiac i rok zaleza wylacznie od daty opinii, wiec sa takie same zawsze i
// wszedzie. Przy okazji czytelnik dostaje informacje uczciwsza: "sierpien 2026"
// mowi wprost, kiedy ktos u nas byl, a "4 tyg. temu" starzeje sie w milczeniu.
// Pelna date niesie atrybut `dateTime`, wiec czytniki ekranu i wyszukiwarki
// maja ja w postaci maszynowej.
//
// Nazwy miesiecy sa wpisane wprost, a nie brane z `Intl.DateTimeFormat`,
// bo dane lokalizacyjne w Node i w przegladarce bywaja z roznych wersji ICU
// i wtedy wracamy do tego samego rozjazdu, tyle ze trudniejszego do zlapania.
const MIESIACE = {
  pl: ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
       "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"],
  en: ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni",
       "Juli", "August", "September", "Oktober", "November", "Dezember"],
};

function reviewDate(dateStr, lang) {
  const m = /^(\d{4})-(\d{2})/.exec(dateStr || "");
  if (!m) return "";
  const nazwy = MIESIACE[lang] || MIESIACE.en;
  const miesiac = nazwy[Number(m[2]) - 1];
  return miesiac ? `${miesiac} ${m[1]}` : m[1];
}

// Single review card
function ReviewCard({ review, lang, labels }) {
  const hasText = Boolean(review.text && review.text.trim());
  const isOriginalLang = review.originalLang === lang;
  const translation = hasText && !isOriginalLang && review.translations?.[lang];

  return (
    <article
      className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-3 hover:border-white/20 transition-colors duration-300"
    >
      {/* Header: name + stars + date */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-medium text-sm">{review.author}</div>
          <div className="flex items-center gap-2 mt-1">
            <Stars rating={review.rating} size="w-3.5 h-3.5" />
            <time
              className="text-xs text-neutral-400"
              dateTime={review.date}
            >
              {reviewDate(review.date, lang)}
            </time>
          </div>
        </div>
        <GoogleLogo className="w-4 h-4 shrink-0 opacity-80" />
      </header>

      {/* Original text - lang attribute tells browsers + screen readers the language */}
      {hasText ? (
        <blockquote
          lang={review.originalLang}
          className="text-neutral-300 text-sm leading-relaxed"
        >
          &ldquo;{review.text}&rdquo;
        </blockquote>
      ) : (
        // Rating-only review (normalne na Google - klient dał 5★ bez komentarza)
        <div className="text-neutral-400 text-xs italic">{labels.ratingOnly}</div>
      )}

      {/* Translation (tylko gdy jest treść i aktualny język ≠ oryginał) */}
      {translation && (
        <div className="pt-3 border-t border-white/5">
          <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
            {labels.translationOf} ({lang.toUpperCase()})
          </div>
          <p lang={lang} className="text-neutral-400 text-xs leading-relaxed italic">
            {translation}
          </p>
        </div>
      )}
    </article>
  );
}

export default function GoogleReviews({
  limit = 6,     // initial visible count
  compact = false, // true for Jewelry/Studio pages (smaller header)
  id = "reviews",
}) {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const [expanded, setExpanded] = useState(false);

  // Cytujemy tylko opinie z komentarzem, posortowane po dacie (najnowsze pierwsze).
  // Oceny bez treści (rating-only) nadal liczą się w agregacie
  // (GOOGLE_BUSINESS.totalReviews w nagłówku), ale nie zaśmiecają listy cytatów.
  const sorted = [...REVIEWS]
    .filter((r) => r.text && r.text.trim())
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const visible = expanded ? sorted : sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <section
      id={id}
      className={`${compact ? "py-14" : "py-20"} px-4 bg-gradient-to-b from-neutral-950 via-neutral-900/40 to-neutral-950`}
      aria-labelledby={`${id}-title`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with aggregate score */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-400 mb-3">
            <GoogleLogo className="w-3.5 h-3.5" />
            {l.tag}
          </div>
          <h2
            id={`${id}-title`}
            className={`font-serif ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} font-semibold text-white mb-4`}
          >
            {l.title}
          </h2>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-neutral-900/60 border border-amber-400/20">
            <span className="text-amber-400 text-2xl font-semibold leading-none">
              {GOOGLE_BUSINESS.rating.toFixed(1)}
            </span>
            <Stars rating={GOOGLE_BUSINESS.rating} size="w-4 h-4" />
            <span className="text-neutral-400 text-sm">
              · {GOOGLE_BUSINESS.totalReviews} {l.basedOn}
            </span>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {visible.map((r) => (
            <ReviewCard key={r.id} review={r} lang={lang} labels={l} />
          ))}
        </div>

        {/* Show more / less */}
        {hasMore && (
          <div className="text-center mb-8">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] text-neutral-300 text-sm hover:bg-white/[0.05] hover:border-white/20 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? l.showLess : `${l.showMore} (+${sorted.length - limit})`}
            </button>
          </div>
        )}

        {/* Skad sa te opinie i czego o nich NIE wiemy. Po dyrektywie Omnibus
            prezentowanie opinii bez informacji o sposobie ich weryfikacji jest
            wymienione wprost jako praktyka wprowadzajaca w blad, a napisanie
            "zweryfikowane", gdy nie sposob tego sprawdzic, byloby gorsze. */}
        <p className="text-neutral-500 text-xs leading-relaxed max-w-2xl mx-auto text-center mb-6">
          {l.verification}
        </p>

        {/* Dual CTA: View all + Write review */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={GOOGLE_BUSINESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 text-sm hover:bg-white/[0.06] hover:border-white/20 transition-colors"
          >
            <GoogleLogo className="w-4 h-4" />
            {l.viewAll}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
          <a
            href={GOOGLE_BUSINESS.writeReviewUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-400 text-black text-sm font-semibold hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            {l.writeReview}
          </a>
        </div>
      </div>
    </section>
  );
}
