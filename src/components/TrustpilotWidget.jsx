import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { TRUSTPILOT_BUSINESS, TRUSTPILOT_REVIEWS } from "../data/googleReviews.js";

// ============================================================
// OPINIE Z TRUSTPILOTA, RYSOWANE PRZEZ NAS
// ============================================================
// Do 6 wrzesnia 2026 stala tu ramka Trustpilota, dociagana skryptem
// z `widget.trustpilot.com`. Nasze CSP dopuszcza skrypty tylko z wlasnej
// domeny i z Cloudflare, wiec przegladarka odmawiala go wykonac i ramka nie
// mogla sie pojawic ani razu, od poczatku. Sekcja nie byla widoczna wylacznie
// dlatego, ze strona glowna zaslania ja progiem liczby opinii.
//
// Decyzja wlasciciela z 2026-09-06: pokazujemy opinie, ktore trzymamy u siebie,
// tak jak robi to blok Google. Tresci lezaly juz w `googleReviews.js` razem
// z tlumaczeniami i nie czytal ich zaden plik.
//
// Co przez to tracimy: gwiazdki nie odswiezaja sie same, wiec nowa opinia
// wymaga dopisania jej do `TRUSTPILOT_REVIEWS`. Co zyskujemy: sekcja rysuje sie
// zawsze, tak samo w prerenderze i u klienta, i nikt obcy nie wykonuje kodu na
// stronie glownej.

const LABELS = {
  pl: {
    tag: "Trustpilot",
    title: "Zaufały nam kolejne osoby",
    subtitle: "Sprawdź opinie lub podziel się swoim doświadczeniem z AEJaCA.",
    ctaBtn: "Napisz recenzję na Trustpilot",
    stars: "gwiazdek na pięć",
    translationOf: "Tłumaczenie",
    all: "Zobacz wszystkie opinie na Trustpilot",
  },
  en: {
    tag: "Trustpilot",
    title: "Trusted by our customers",
    subtitle: "Check our reviews or share your own experience with AEJaCA.",
    ctaBtn: "Write a review on Trustpilot",
    stars: "stars out of five",
    translationOf: "Translation",
    all: "See all reviews on Trustpilot",
  },
  de: {
    tag: "Trustpilot",
    title: "Von unseren Kunden vertraut",
    subtitle: "Lesen Sie unsere Bewertungen oder teilen Sie Ihre eigene Erfahrung.",
    ctaBtn: "Bewertung auf Trustpilot schreiben",
    stars: "von fünf Sternen",
    translationOf: "Übersetzung",
    all: "Alle Bewertungen auf Trustpilot ansehen",
  },
};

// Nazwy miesiecy wpisane wprost, z tego samego powodu, co w bloku Google:
// dane lokalizacyjne w Node i w przegladarce bywaja z roznych wersji ICU,
// a rozjazd w renderze wyrzuca gotowy HTML do kosza.
const MIESIACE = {
  pl: ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
       "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"],
  en: ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni",
       "Juli", "August", "September", "Oktober", "November", "Dezember"],
};

function dataOpinii(dateStr, lang) {
  const m = /^(\d{4})-(\d{2})/.exec(dateStr || "");
  if (!m) return "";
  const nazwy = MIESIACE[lang] || MIESIACE.en;
  const miesiac = nazwy[Number(m[2]) - 1];
  return miesiac ? `${miesiac} ${m[1]}` : m[1];
}

// Gwiazdka Trustpilota: bialy znak na zielonym kwadracie marki.
function TpStar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Gwiazdki({ rating, label }) {
  const ile = Math.round(Number(rating) || 0);
  return (
    <span className="tp-marka inline-flex gap-0.5" role="img" aria-label={`${ile} ${label}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < ile ? "" : "opacity-25"}>
          <TpStar size={13} />
        </span>
      ))}
    </span>
  );
}

function KartaOpinii({ opinia, lang, L }) {
  const wOryginale = opinia.originalLang === lang;
  const tlumaczenie = !wOryginale && opinia.translations?.[lang];

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-3 text-left hover:border-white/20 transition-colors duration-300">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-medium text-sm">{opinia.author}</div>
          <div className="flex items-center gap-2 mt-1">
            <Gwiazdki rating={opinia.rating} label={L.stars} />
            <time className="text-xs text-neutral-400" dateTime={opinia.date}>
              {dataOpinii(opinia.date, lang)}
            </time>
          </div>
        </div>
      </header>

      {opinia.title && (
        <div className="text-white text-sm font-semibold" lang={opinia.originalLang}>
          {opinia.title}
        </div>
      )}

      <blockquote lang={opinia.originalLang} className="text-neutral-300 text-sm leading-relaxed">
        &ldquo;{opinia.text}&rdquo;
      </blockquote>

      {tlumaczenie && (
        <div className="pt-3 border-t border-white/5">
          <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
            {L.translationOf} ({lang.toUpperCase()})
          </div>
          <p lang={lang} className="text-neutral-400 text-xs leading-relaxed italic">
            {tlumaczenie}
          </p>
        </div>
      )}
    </article>
  );
}

export default function TrustpilotWidget() {
  const { lang, t } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const headerRef = useScrollReveal();
  const boxRef = useScrollReveal();

  // Kolejnosc bierzemy z zapisanej daty, a nie z zegara: napis ma byc ten sam
  // przy buildzie i przy ogladaniu. Porownujemy napisy ISO zwyklym mniejsze
  // wieksze, bo `localeCompare` siega po dane lokalizacyjne, a te w Node i
  // w przegladarce bywaja z roznych wersji i wtedy kolejnosc potrafi sie
  // rozjechac miedzy prerenderem a hydracja.
  const opinie = [...TRUSTPILOT_REVIEWS]
    .filter((o) => o.text && o.text.trim())
    .sort((a, b) => (String(a.date) < String(b.date) ? 1 : String(a.date) > String(b.date) ? -1 : 0));

  if (!opinie.length) return null;

  return (
    <section className="py-14 px-4 bg-neutral-950" aria-label={t.a11y.trustpilot}>
      <div className="max-w-4xl mx-auto text-center">
        <div ref={headerRef} className="reveal mb-8">
          <div className="tp-napis inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] font-semibold mb-3">
            <TpStar size={14} />
            {L.tag}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-2">
            {L.title}
          </h2>
          <p className="text-neutral-400 text-sm">{L.subtitle}</p>
        </div>

        <div ref={boxRef} className="reveal flex flex-col items-center gap-6">
          <div className="grid gap-4 sm:grid-cols-2 w-full">
            {opinie.map((o) => (
              <KartaOpinii key={o.id} opinia={o} lang={lang} L={L} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={TRUSTPILOT_BUSINESS.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white text-sm underline underline-offset-4 transition-colors"
            >
              {L.all}
            </a>
            <a
              href={TRUSTPILOT_BUSINESS.writeReviewUrl || TRUSTPILOT_BUSINESS.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-trustpilot inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#00b67a]/25 transition-all duration-300"
            >
              <TpStar size={15} />
              {L.ctaBtn}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
