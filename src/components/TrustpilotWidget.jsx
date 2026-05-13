import { useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

// ── Trustpilot Business Unit ID ───────────────────────────────────────────────
// Find it: business.trustpilot.com → Integrations → TrustBox → any widget code
// Look for: data-businessunit-id="xxxxxxxxxxxxxxxxxxxxxxxx"  (24-char hex string)
// Then replace the placeholder below and redeploy.
const BUSINESS_UNIT_ID = "PASTE_YOUR_BUSINESS_UNIT_ID_HERE";
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_URL = "https://www.trustpilot.com/review/aejaca.com";
const LOCALES = { pl: "pl-PL", en: "en-US", de: "de-DE" };

const LABELS = {
  pl: {
    tag: "Trustpilot",
    title: "Zaufały nam kolejne osoby",
    subtitle: "Sprawdź opinie lub podziel się swoim doświadczeniem z AEJaCA.",
    ctaBtn: "Napisz recenzję na Trustpilot",
    setupNote: "Widget załaduje się po dodaniu Business Unit ID.",
  },
  en: {
    tag: "Trustpilot",
    title: "Trusted by our customers",
    subtitle: "Check our reviews or share your own experience with AEJaCA.",
    ctaBtn: "Write a review on Trustpilot",
    setupNote: "Widget will load after adding the Business Unit ID.",
  },
  de: {
    tag: "Trustpilot",
    title: "Von unseren Kunden vertraut",
    subtitle: "Lesen Sie unsere Bewertungen oder teilen Sie Ihre eigene Erfahrung.",
    ctaBtn: "Bewertung auf Trustpilot schreiben",
    setupNote: "Widget wird geladen, nachdem die Business Unit ID hinzugefügt wurde.",
  },
};

// Trustpilot star icon (official shape)
function TpStar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function TrustpilotWidget() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const widgetRef = useRef(null);
  const headerRef = useScrollReveal();
  const boxRef = useScrollReveal();

  const isConfigured = BUSINESS_UNIT_ID !== "PASTE_YOUR_BUSINESS_UNIT_ID_HERE";

  useEffect(() => {
    if (!isConfigured || !widgetRef.current) return;

    const init = () => {
      if (window.Trustpilot) {
        window.Trustpilot.loadFromElement(widgetRef.current, true);
      }
    };

    // Script already loaded (e.g. navigated back to Home)
    if (window.Trustpilot) {
      init();
      return;
    }

    // Load script once, then init
    if (!document.querySelector('script[src*="trustpilot.com/bootstrap"]')) {
      const script = document.createElement("script");
      script.src = "//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, [lang, isConfigured]);

  return (
    <section className="py-14 px-4 bg-neutral-950" aria-label="Trustpilot">
      <div className="max-w-4xl mx-auto text-center">

        {/* Header */}
        <div ref={headerRef} className="reveal mb-8">
          <div className="inline-flex items-center gap-1.5 text-[#00b67a] text-xs uppercase tracking-[0.2em] font-semibold mb-3">
            <TpStar size={14} />
            {L.tag}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-2">
            {L.title}
          </h2>
          <p className="text-neutral-400 text-sm">{L.subtitle}</p>
        </div>

        {/* TrustBox or setup notice */}
        <div ref={boxRef} className="reveal flex flex-col items-center gap-6">
          {isConfigured ? (
            <div
              ref={widgetRef}
              className="trustpilot-widget w-full max-w-xl"
              data-locale={LOCALES[lang] || "pl-PL"}
              data-template-id="53aa8912dec7e10d38f59f36"
              data-businessunit-id={BUSINESS_UNIT_ID}
              data-style-height="140px"
              data-style-width="100%"
              data-theme="dark"
            >
              {/* Fallback link shown before widget loads */}
              <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">
                Trustpilot
              </a>
            </div>
          ) : (
            <div className="w-full max-w-xl h-[140px] rounded-xl border border-[#00b67a]/20 bg-[#00b67a]/5 flex items-center justify-center">
              <p className="text-[#00b67a]/60 text-xs font-mono">{L.setupNote}</p>
            </div>
          )}

          {/* CTA button */}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00b67a] text-white font-semibold text-sm hover:bg-[#00a36c] hover:shadow-lg hover:shadow-[#00b67a]/25 transition-all duration-300"
          >
            <TpStar size={15} />
            {L.ctaBtn}
          </a>
        </div>

      </div>
    </section>
  );
}
