import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";

const LABELS = {
  pl: {
    tag: "Twoja opinia ma znaczenie",
    headline: "Powiedz innym, jak Ci poszło",
    sub: "Każda recenzja pomaga kolejnym klientom trafić do AEJaCA i motywuje nas do jeszcze lepszej pracy. Zajmie to dosłownie minutę.",
    google: "Oceń na Google",
    trustpilot: "Oceń na Trustpilot",
    thanks: "Dziękujemy z całego serca 🙏",
  },
  en: {
    tag: "Your opinion matters",
    headline: "Tell others about your experience",
    sub: "Every review helps new customers find AEJaCA and motivates us to keep improving. It takes just a minute.",
    google: "Review on Google",
    trustpilot: "Review on Trustpilot",
    thanks: "Thank you from the bottom of our hearts 🙏",
  },
  de: {
    tag: "Ihre Meinung zählt",
    headline: "Erzählen Sie anderen von Ihrer Erfahrung",
    sub: "Jede Bewertung hilft neuen Kunden, AEJaCA zu finden, und motiviert uns, noch besser zu werden. Es dauert nur eine Minute.",
    google: "Auf Google bewerten",
    trustpilot: "Auf Trustpilot bewerten",
    thanks: "Herzlichen Dank 🙏",
  },
};

export default function Reviews() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.en;

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

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:justify-center">
          {/* Google */}
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJE7k_bwABwGwRNtWGAYfCHH4"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-neutral-900 font-semibold text-base hover:bg-neutral-100 transition-colors shadow-lg w-full sm:w-56"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.9 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.9 2 2 11.9 2 24s9.9 22 22 22c11 0 21-8 21-21 0-1.3-.2-2.7-.5-4z" />
            </svg>
            {L.google}
          </a>

          {/* TrustPilot */}
          <a
            href="https://www.trustpilot.com/review/aejaca.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-base text-white transition-colors shadow-lg w-full sm:w-56 hover:opacity-90"
            style={{ backgroundColor: "#00b67a" }}
          >
            <span aria-hidden="true" className="text-lg leading-none">★</span>
            {L.trustpilot}
          </a>
        </div>

        {/* Thanks footer */}
        <p className="text-neutral-600 text-xs mt-10">{L.thanks}</p>
      </div>
    </>
  );
}
