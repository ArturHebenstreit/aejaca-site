import { useLanguage } from "../i18n/LanguageContext.jsx";

const LABELS = {
  pl: {
    title: "Czy narzędzie okazało się przydatne?",
    desc: "Jeśli narzędzie Ci pomogło — zostaw opinię na Google lub Trustpilot. Pomaga nam to rozwijać witrynę i wspierać społeczność twórców.",
    google: "Oceń na Google",
    trustpilot: "Oceń na Trustpilot",
  },
  en: {
    title: "Did you find this tool useful?",
    desc: "If this tool helped you — leave a review on Google or Trustpilot. It helps us grow the site and support the maker community.",
    google: "Review on Google",
    trustpilot: "Review on Trustpilot",
  },
  de: {
    title: "War das Werkzeug hilfreich?",
    desc: "Wenn Ihnen dieses Tool geholfen hat — hinterlassen Sie eine Bewertung bei Google oder Trustpilot. Es hilft uns, die Website weiterzuentwickeln.",
    google: "Auf Google bewerten",
    trustpilot: "Auf Trustpilot bewerten",
  },
};

export default function ToolReviewCTA() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 text-center my-10 max-w-2xl mx-auto">
      <h3 className="text-white font-semibold text-lg mb-2">{L.title}</h3>
      <p className="text-neutral-400 text-sm mb-6 leading-relaxed">{L.desc}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="https://search.google.com/local/writereview?placeid=ChIJE7k_bwABwGwRNtWGAYfCHH4"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:border-white/40 hover:bg-white/5 transition-all duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {L.google}
        </a>
        <a
          href="https://www.trustpilot.com/review/aejaca.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full bg-[#00b67a] text-white text-sm font-medium hover:bg-[#00a36c] transition-all duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l2.9 8.9H24l-7.5 5.4 2.9 8.9L12 20.8l-7.4 4.4 2.9-8.9L0 10.9h9.1z" />
          </svg>
          {L.trustpilot}
        </a>
      </div>
    </div>
  );
}
