import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { GOOGLE_BUSINESS, TRUSTPILOT_BUSINESS } from "../data/googleReviews.js";
import { reviewCountLabel } from "../utils/reviewCount.js";

const LABELS = {
  pl: {
    tag: "Powiedz nam szczerze",
    headline: "Jak nam poszło? Jak nas oceniasz?",
    sub: "Jak nam poszło? Jak nas oceniasz? Twoja opinia - dobra lub zła - pomaga nam być lepszymi i dociera do kolejnych klientów. Zajmie to dosłownie minutę.",
    google: "Oceń na Google",
    trustpilot: "Oceń na Trustpilot",
    thanks: "Dziękujemy z całego serca 🙏",
  },
  en: {
    tag: "Be honest with us",
    headline: "How did we do?",
    sub: "Did you enjoy working with AEJaCA? How would you rate us? Your feedback - good or bad - helps us improve and reach new customers. It takes just a minute.",
    google: "Review on Google",
    trustpilot: "Review on Trustpilot",
    thanks: "Thank you from the bottom of our hearts 🙏",
  },
  de: {
    tag: "Sagen Sie uns ehrlich",
    headline: "Wie haben wir abgeschnitten? Wie bewerten Sie uns?",
    sub: "Hat Ihnen die Zusammenarbeit gefallen? Wie würden Sie uns bewerten? Ihre Meinung - positiv oder negativ - hilft uns besser zu werden. Es dauert nur eine Minute.",
    google: "Auf Google bewerten",
    trustpilot: "Auf Trustpilot bewerten",
    thanks: "Herzlichen Dank 🙏",
  },
};

const TRUSTPILOT_SCORE = {
  pl: { allFive: "wszystkie na 5 gwiazdek", on: "Zobacz na" },
  en: { allFive: "all rated 5 stars", on: "See it on" },
  de: { allFive: "alle mit 5 Sternen", on: "Ansehen auf" },
};

const GOOGLE_SCORE = {
  pl: { avg: "średnia", on: "Zobacz na" },
  en: { avg: "average", on: "See it on" },
  de: { avg: "Durchschnitt", on: "Ansehen auf" },
};

const TRUSTPILOT_URL = {
  pl: "https://pl.trustpilot.com/review/aejaca.com",
  de: "https://de.trustpilot.com/review/aejaca.com",
  en: "https://www.trustpilot.com/review/aejaca.com",
};

// Official Trustpilot star: white glyph on the brand green square.
function TpStar({ filled = true }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center w-6 h-6 rounded-[3px]"
      style={{ backgroundColor: filled ? "#00b67a" : "#dcdce6" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9L12 17.6 5.9 21.2l1.5-6.9L2.2 9.6l6.9-.7L12 2.5z" />
      </svg>
    </span>
  );
}

// Deliberately NOT wired into JSON-LD. The Organization schema already carries
// an aggregateRating built from Google reviews, and a second rating for the
// same entity would misreport it.
//
// Nie pokazujemy tu liczby TrustScore. Przy trzech opiniach Trustpilot wylicza
// 4,0, mimo że wszystkie trzy oceny to 5 gwiazdek, bo wskaźnik jest ważony
// wolumenem. Wyświetlenie go obok Google "5,0" sugerowałoby klientowi coś, czego nie
// powiedział ani jeden recenzent. Podajemy więc fakt sprawdzalny na profilu:
// ile jest opinii i jak się rozkładają. Gwiazdek nie rysujemy, bo rząd pięciu
// zielonych gwiazdek czytałby się jako TrustScore 5,0, czyli w drugą stronę.
function TrustpilotScore({ lang }) {
  const S = TRUSTPILOT_SCORE[lang] || TRUSTPILOT_SCORE.en;
  const { totalReviews, fiveStarShare, profileUrl } = TRUSTPILOT_BUSINESS;

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 group"
    >
      <TpStar />
      <div className="text-sm text-neutral-300">
        <span className="font-semibold text-white">{reviewCountLabel(totalReviews, lang)}</span>
        {fiveStarShare === 1 && <span className="text-neutral-500"> · {S.allFive}</span>}
      </div>
      <div className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
        {S.on} Trustpilot
      </div>
    </a>
  );
}

/**
 * Ile opinii mamy w Google i jaka jest srednia.
 *
 * Trustpilot mial tu swoj blok od poczatku, a Google nie, chociaz to Google
 * ma dwadziescia kilka opinii, a Trustpilot kilka. Prosba o ocene bez pokazania,
 * ile osob juz ja wystawilo, traci najmocniejszy argument, jaki mamy.
 *
 * Srednia podajemy, bo w Google jest wyliczana wprost z ocen i zgadza sie z
 * profilem. Przy Trustpilot jej nie podajemy, i to jest napisane nizej.
 */
function GoogleScore({ lang }) {
  const S = GOOGLE_SCORE[lang] || GOOGLE_SCORE.en;
  const { totalReviews, rating, mapsUrl } = GOOGLE_BUSINESS;
  const ocena = rating.toFixed(1).replace(".", lang === "en" ? "." : ",");

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 group"
    >
      <span aria-hidden="true" className="inline-flex items-center justify-center w-6 h-6 rounded-[3px] bg-amber-400/15 border border-amber-400/40">
        <svg width="14" height="14" viewBox="0 0 24 24" className="fill-amber-400">
          <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9L12 17.6 5.9 21.2l1.5-6.9L2.2 9.6l6.9-.7L12 2.5z" />
        </svg>
      </span>
      <div className="text-sm text-neutral-300">
        <span className="font-semibold text-white">{reviewCountLabel(totalReviews, lang)}</span>
        <span className="text-neutral-500"> · {ocena}/5 {S.avg}</span>
      </div>
      <div className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
        {S.on} Google
      </div>
    </a>
  );
}

export default function Reviews() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.en;
  const trustpilotUrl = TRUSTPILOT_URL[lang] || TRUSTPILOT_URL.en;

  return (
    <>
      <SEOHead pageKey="reviews" path="/reviews" schemas={[]} />
      <div className="min-h-[100dvh] pt-16 bg-neutral-950 flex flex-col items-center justify-center px-6 text-center">
        {/* Brand tag */}
        <div className="text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-2">
          AEJaCA
        </div>

        {/* Hook tag */}
        <div className="text-neutral-500 text-xs uppercase tracking-[0.2em] mb-6">
          {L.tag}
        </div>

        {/* Headline */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4 max-w-md leading-tight">
          {L.headline}
        </h1>

        {/* Supporting copy */}
        <p className="text-neutral-400 text-sm max-w-sm mb-10 leading-relaxed">
          {L.sub}
        </p>

        {/* Ile opinii juz mamy, osobno na kazdej platformie. Sumowac ich nie
            wolno: czesc osob wystawila ocene w obu miejscach. */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-8">
          <GoogleScore lang={lang} />
          <TrustpilotScore lang={lang} />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:justify-center">
          {/* Google */}
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJE7k_bwABwGwRNtWGAYfCHH4"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-amber group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-base w-full sm:w-56
                       hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
                       transition-all duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.9 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.9 2 2 11.9 2 24s9.9 22 22 22c11 0 21-8 21-21 0-1.3-.2-2.7-.5-4z" />
            </svg>
            {L.google}
          </a>

          {/* TrustPilot */}
          <a
            href={trustpilotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-trustpilot flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-base shadow-lg w-full sm:w-56
                       hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
                       transition-all duration-300"
            style={{ "--tw-ring-color": "#00b67a" }}
          >
            {/* Gwiazdka rysowana wprost, a nie znakiem ★: glif dziedziczy kolor
                tekstu, a nadpisanie trybu jasnego robilo z niego czarna plamke
                na zielonym tle. */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9L12 17.6 5.9 21.2l1.5-6.9L2.2 9.6l6.9-.7L12 2.5z" />
            </svg>
            {L.trustpilot}
          </a>
        </div>

        {/* Thanks footer */}
        <p className="text-neutral-600 text-xs mt-10">{L.thanks}</p>
      </div>
    </>
  );
}
