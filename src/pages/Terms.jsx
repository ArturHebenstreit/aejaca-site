import { Scale, Mail, Phone } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import PolicyLinks from "../components/PolicyLinks.jsx";
import { TERMS, TERMS_EFFECTIVE_DATE } from "../data/termsContent.js";
import { SELLER } from "../data/sellerInfo.js";

const UI = {
  pl: {
    toc: "Spis treści",
    contact: "Kontakt w sprawach regulaminu",
    sellerHeading: "Sprzedawca",
    sellerStatus:
      "prowadzący działalność nierejestrowaną w rozumieniu art. 5 ust. 1 ustawy Prawo przedsiębiorców, bez numerów NIP i REGON, zwolniony z podatku od towarów i usług",
    sellerBrand: "Marka",
  },
  en: {
    toc: "Contents",
    contact: "Contact regarding these Terms",
    sellerHeading: "Seller",
    sellerStatus:
      "carrying out unregistered business activity within the meaning of Article 5(1) of the Polish Entrepreneurs' Law, without NIP or REGON numbers, exempt from value added tax",
    sellerBrand: "Brand",
  },
  de: {
    toc: "Inhalt",
    contact: "Kontakt zu diesen AGB",
    sellerHeading: "Verkäufer",
    sellerStatus:
      "Ausübung einer nicht registrierten Erwerbstätigkeit im Sinne von Art. 5 Abs. 1 des polnischen Unternehmerrechts, ohne NIP- und REGON-Nummer, von der Umsatzsteuer befreit",
    sellerBrand: "Marke",
  },
};

export default function Terms() {
  const { lang } = useLanguage();
  const t = TERMS[lang] || TERMS.pl;
  const u = UI[lang] || UI.pl;
  const headerRef = useScrollReveal();
  const tocRef = useScrollReveal();

  const pageUrl = `${SITE.url}/terms/`;
  const schemas = [
    buildWebPageSchema({
      title: `${t.title}, ${SITE.name}`,
      description: t.lead,
      url: pageUrl,
      lang,
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: t.tag, url: pageUrl },
    ]),
  ];

  return (
    <>
      <SEOHead pageKey="terms" path="/terms" schemas={schemas} />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb items={[{ href: "/", label: "Home" }, { label: t.tag }]} />

            {/* Hero */}
            <div ref={headerRef} className="reveal text-center mb-12">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">
                {t.tag}
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {t.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-4">{t.lead}</p>
              <p className="text-neutral-500 text-sm">
                {t.effectiveLabel}: <time dateTime={TERMS_EFFECTIVE_DATE}>{TERMS_EFFECTIVE_DATE}</time>
              </p>
            </div>

            {/* Dane sprzedawcy wyciągnięte nad spis treści.
                Autopay wymaga imienia, nazwiska i informacji o działalności
                nierejestrowanej wprost w regulaminie. To samo jest w § 1 i § 3,
                ale weryfikator skanuje dokument wzrokiem i nie powinien szukać. */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5">
              <h2 className="text-white font-semibold mb-3">{u.sellerHeading}</h2>
              <p className="text-white text-sm font-medium">{SELLER.legalName}</p>
              <p className="text-neutral-400 text-sm leading-relaxed mt-1">{u.sellerStatus}.</p>
              <p className="text-neutral-400 text-sm mt-2">
                {u.sellerBrand}: {SELLER.brandName}. {SELLER.addressLines.join(", ")}.
              </p>
              <p className="text-neutral-400 text-sm mt-1">
                {SELLER.email} &middot; {SELLER.phone}
              </p>
            </div>

            {/* Spis treści. Dokument ma 17 sekcji, bez tego jest nieczytelny na telefonie. */}
            <nav
              ref={tocRef}
              aria-label={u.toc}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold">{u.toc}</h2>
              </div>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {t.sections.map((s) => (
                  <li key={s.n}>
                    <a
                      href={`#sec-${s.n}`}
                      className="text-sm text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      <span className="text-neutral-600 mr-1.5">{s.n}.</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Treść */}
            <div className="space-y-8">
              {t.sections.map((s) => (
                <section
                  key={s.n}
                  id={`sec-${s.n}`}
                  className="scroll-mt-24 bg-neutral-900/40 border border-neutral-800 rounded-xl p-6"
                >
                  <h2 className="text-white font-semibold mb-4">
                    <span className="text-amber-400 mr-2">§ {s.n}</span>
                    {s.title}
                  </h2>
                  <ClauseList items={s.items} />
                </section>
              ))}
            </div>

            {/* Kontakt */}
            <div className="mt-10 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">{u.contact}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-neutral-400">
                <a
                  href={`mailto:${SELLER.email}`}
                  className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                  {SELLER.email}
                </a>
                <span className="hidden sm:block text-neutral-700">|</span>
                <a
                  href={SELLER.phoneHref}
                  className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                  {SELLER.phone}
                </a>
              </div>
            </div>

            <PolicyLinks current="terms" className="mt-5" />
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Renderuje ustępy sekcji. String to numerowany ustęp, tablica to lista
 * wypunktowana przypięta do poprzedniego ustępu. Numeracja liczy wyłącznie
 * stringi, żeby wstawienie listy nie przesuwało numerów ustępów.
 */
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
