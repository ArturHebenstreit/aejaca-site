import { Link } from "../i18n/nav.jsx";
import { ShieldCheck, Mail, Phone } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schemas.js";
import { getSEO, adresStrony } from "../seo/seoData.js";
import PolicyLinks from "../components/PolicyLinks.jsx";
import { PRIVACY, PRIVACY_EFFECTIVE_DATE } from "../data/privacyContent.js";
import { SELLER } from "../data/sellerInfo.js";

const UI = {
  pl: { tag: "Prywatność", toc: "Spis treści", effective: "Obowiązuje od", contact: "Kontakt w sprawach danych", back: "Powrót na stronę główną" },
  en: { tag: "Privacy", toc: "Contents", effective: "Effective from", contact: "Contact on data matters", back: "Back to home" },
  de: { tag: "Datenschutz", toc: "Inhalt", effective: "Gültig ab", contact: "Kontakt in Datenschutzfragen", back: "Zurück zur Startseite" },
};

export default function Privacy() {
  const { lang } = useLanguage();
  const t = PRIVACY[lang] || PRIVACY.pl;
  const u = UI[lang] || UI.pl;
  const headerRef = useScrollReveal();
  const tocRef = useScrollReveal();

  const seo = getSEO("privacy", lang);
  const pageUrl = adresStrony("/privacy/", lang);
  const schemas = [
    buildWebPageSchema({ title: seo.title, description: seo.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: adresStrony("/", lang) },
      { name: "Privacy", url: pageUrl },
    ]),
  ];

  return (
    <>
      <SEOHead pageKey="privacy" path="/privacy" schemas={schemas} />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">

            <div ref={headerRef} className="reveal text-center mb-12">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{u.tag}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {t.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-4">{t.intro}</p>
              <p className="text-neutral-500 text-sm">
                {u.effective}: <time dateTime={PRIVACY_EFFECTIVE_DATE}>{PRIVACY_EFFECTIVE_DATE}</time>
              </p>
            </div>

            {/* Spis tresci. Dokument ma 11 sekcji, bez tego na telefonie
                nie da sie znalezc konkretnej rzeczy. */}
            <nav
              ref={tocRef}
              aria-label={u.toc}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold">{u.toc}</h2>
              </div>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {t.sections.map((s) => (
                  <li key={s.n}>
                    <a href={`#sec-${s.n}`} className="text-sm text-neutral-400 hover:text-amber-400 transition-colors">
                      <span className="text-neutral-600 mr-1.5">{s.n}.</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-8">
              {t.sections.map((s) => (
                <section
                  key={s.n}
                  id={`sec-${s.n}`}
                  className="scroll-mt-24 bg-neutral-900/40 border border-neutral-800 rounded-xl p-6"
                >
                  <h2 className="text-white font-semibold mb-4">
                    <span className="text-amber-400 mr-2">{s.n}.</span>
                    {s.title}
                  </h2>
                  <ClauseList items={s.items} />
                </section>
              ))}
            </div>

            <div className="mt-10 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">{u.contact}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-neutral-400">
                <a href={`mailto:${SELLER.email}`} className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                  {SELLER.email}
                </a>
                <span className="hidden sm:block text-neutral-700">|</span>
                <a href={SELLER.phoneHref} className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                  {SELLER.phone}
                </a>
              </div>
            </div>

            <PolicyLinks current="privacy" className="mt-5" />

            <div className="mt-8">
              <Link to="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
                &larr; {u.back}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/** Ten sam uklad co w Regulaminie: napis to ustep, tablica to wypunktowanie. */
function ClauseList({ items }) {
  let clause = 0;
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        if (Array.isArray(item)) {
          return (
            <ul key={i} className="space-y-1.5 pl-7">
              {item.map((sub, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-neutral-400 leading-relaxed">
                  <span className="text-neutral-600 mt-0.5 shrink-0">&bull;</span>
                  <span>{sub}</span>
                </li>
              ))}
            </ul>
          );
        }
        clause += 1;
        return (
          <p key={i} className="flex items-start gap-2.5 text-sm text-neutral-400 leading-relaxed">
            <span className="text-neutral-600 shrink-0 tabular-nums w-5 text-right">{clause}.</span>
            <span>{item}</span>
          </p>
        );
      })}
    </div>
  );
}
