import { Link } from "react-router-dom";
import { CheckCircle, XCircle, FileText, Mail } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";

const LABELS = {
  pl: {
    tag: "Zwroty",
    title: "Polityka zwrotów i wymian",
    description: "Zasady zwrotów produktów AEJaCA.",
    rightTitle: "Prawo odstąpienia od umowy (14 dni)",
    rightItems: [
      "Dotyczy produktów uniwersalnych (niespersonalizowanych)",
      "Towar musi być nieużywany, w oryginalnym opakowaniu",
      "Koszt wysyłki zwrotnej ponosi kupujący",
      "Zwrot środków w ciągu 14 dni od otrzymania towaru",
    ],
    excludeTitle: "Wyłączenia z prawa zwrotu",
    excludeItems: [
      "Biżuteria wykonana na indywidualne zamówienie (personalizacja)",
      "Produkty z elementami sprowadzonymi na specjalne życzenie (kamienie szlachetne, konkretne kruszce)",
      "Wyroby studio wykonane wg indywidualnej specyfikacji",
    ],
    complaintTitle: "Reklamacje",
    complaintDesc: "Reklamacje rozpatrywane są w ramach osobnej procedury gwarancyjnej.",
    complaintLink: "Szczegóły gwarancji",
    contactNote: "Pytania? Napisz na contact@aejaca.com",
  },
  en: {
    tag: "Returns",
    title: "Returns & Exchanges Policy",
    description: "Return policy for AEJaCA products.",
    rightTitle: "Right of Withdrawal (14 Days)",
    rightItems: [
      "Applies to universal (non-personalized) products",
      "Items must be unused, in original packaging",
      "Return shipping cost is borne by the buyer",
      "Refund within 14 days of receiving the returned item",
    ],
    excludeTitle: "Exclusions from Right of Return",
    excludeItems: [
      "Jewelry made to individual order (personalized)",
      "Products with specially ordered elements (gemstones, specific metals)",
      "Studio products made to individual specification",
    ],
    complaintTitle: "Complaints",
    complaintDesc: "Complaints are handled under a separate warranty procedure.",
    complaintLink: "Warranty details",
    contactNote: "Questions? Email contact@aejaca.com",
  },
  de: {
    tag: "Rückgabe",
    title: "Rückgabe- und Umtauschrichtlinien",
    description: "Rückgabebedingungen für AEJaCA-Produkte.",
    rightTitle: "Widerrufsrecht (14 Tage)",
    rightItems: [
      "Gilt für universelle (nicht personalisierte) Produkte",
      "Ware muss unbenutzt und in Originalverpackung sein",
      "Rücksendekosten trägt der Käufer",
      "Rückerstattung innerhalb von 14 Tagen nach Wareneingang",
    ],
    excludeTitle: "Ausschlüsse vom Rückgaberecht",
    excludeItems: [
      "Schmuck nach individueller Bestellung (personalisiert)",
      "Produkte mit speziell bestellten Elementen (Edelsteine, bestimmte Metalle)",
      "Studio-Produkte nach individueller Spezifikation",
    ],
    complaintTitle: "Reklamationen",
    complaintDesc:
      "Reklamationen werden im Rahmen eines separaten Garantieverfahrens bearbeitet.",
    complaintLink: "Garantiedetails",
    contactNote: "Fragen? Schreiben Sie an contact@aejaca.com",
  },
};

export default function Returns() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const headerRef = useScrollReveal();
  const rightRef = useScrollReveal();
  const excludeRef = useScrollReveal();
  const bottomRef = useScrollReveal();

  const pageUrl = `${SITE.url}/returns`;
  const schemas = [
    buildWebPageSchema({
      title: `${l.tag} — ${SITE.name}`,
      description: l.description,
      url: pageUrl,
      lang,
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.tag, url: pageUrl },
    ]),
  ];

  return (
    <>
      <SEOHead
        pageKey="returns"
        path="/returns"
        title={`${l.tag} — ${SITE.name}`}
        description={l.description}
        schemas={schemas}
      />
      <div className="pt-16">
        <section className="py-20 px-4 bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb
              items={[{ href: "/", label: "Home" }, { label: l.tag }]}
            />

            {/* Hero */}
            <div ref={headerRef} className="reveal text-center mb-14">
              <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">
                {l.tag}
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                {l.title}
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                {l.description}
              </p>
            </div>

            {/* Right of withdrawal */}
            <div
              ref={rightRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.rightTitle}</h2>
              </div>
              <ul className="space-y-2">
                {l.rightItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div
              ref={excludeRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.excludeTitle}</h2>
              </div>
              <ul className="space-y-2">
                {l.excludeItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                    <span className="text-rose-400 mt-0.5 shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Complaints + contact */}
            <div
              ref={bottomRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.complaintTitle}</h2>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                {l.complaintDesc}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Link
                  to="/warranty/"
                  className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm"
                >
                  {l.complaintLink} &rarr;
                </Link>
                <span className="hidden sm:block text-neutral-700">|</span>
                <span className="flex items-center gap-2 text-sm text-neutral-400">
                  <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                  {l.contactNote}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
