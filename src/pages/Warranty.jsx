import { Link } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Sparkles, Building2, Mail } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";

const LABELS = {
  pl: {
    tag: "Gwarancja",
    title: "Gwarancja AEJaCA — 24 miesiące",
    description: "Szczegóły gwarancji na biżuterię i produkty AEJaCA.",
    period: "Okres gwarancji",
    periodDesc: "24 miesiące od daty zakupu na wszystkie produkty AEJaCA.",
    scope: "Zakres gwarancji",
    scopeDesc: "Wady produkcyjne — wady materiałowe i błędy wykonania.",
    exclusions: "Gwarancja nie obejmuje",
    exclusionItems: [
      "Uszkodzenia mechaniczne (zarysowania, zgniecenia, złamania)",
      "Przebarwienia z kontaktu z kosmetykami, detergentami, potem",
      "Naturalne zużycie (ścieranie rodu, matowienie)",
      "Wypadnięcie kamieni z powodu niewłaściwego użytkowania",
      "Modyfikacje dokonane przez osoby trzecie",
    ],
    freeService: "Bezpłatny serwis",
    freeServiceDesc:
      "Pierwsze czyszczenie i odświeżenie biżuterii w ciągu 12 miesięcy od zakupu — bezpłatnie.",
    b2b: "B2B",
    b2bDesc:
      "Wyłączenie rękojmi wobec przedsiębiorców zgodnie z przepisami prawa polskiego.",
    claim: "Reklamacja",
    claimDesc:
      "Napisz na contact@aejaca.com — rozpatrzymy zgłoszenie w ciągu 14 dni roboczych.",
    careLink: "Jak dbać o biżuterię?",
  },
  en: {
    tag: "Warranty",
    title: "AEJaCA Warranty — 24 Months",
    description: "Warranty details for AEJaCA jewelry and products.",
    period: "Warranty Period",
    periodDesc: "24 months from the date of purchase on all AEJaCA products.",
    scope: "Coverage",
    scopeDesc: "Manufacturing defects — material flaws and workmanship errors.",
    exclusions: "Not Covered",
    exclusionItems: [
      "Mechanical damage (scratches, dents, breaks)",
      "Discoloration from cosmetics, detergents, or sweat",
      "Natural wear (rhodium wearing off, dulling)",
      "Gemstone loss due to improper use",
      "Modifications by third parties",
    ],
    freeService: "Complimentary Service",
    freeServiceDesc:
      "First cleaning and refresh of your jewelry within 12 months of purchase — free of charge.",
    b2b: "B2B",
    b2bDesc: "Statutory warranty exclusion for business customers under Polish law.",
    claim: "Filing a Claim",
    claimDesc:
      "Email contact@aejaca.com — we'll review your claim within 14 business days.",
    careLink: "How to care for your jewelry?",
  },
  de: {
    tag: "Garantie",
    title: "AEJaCA Garantie — 24 Monate",
    description: "Garantiedetails für AEJaCA-Schmuck und -Produkte.",
    period: "Garantiezeitraum",
    periodDesc: "24 Monate ab Kaufdatum auf alle AEJaCA-Produkte.",
    scope: "Abdeckung",
    scopeDesc: "Herstellungsfehler — Materialfehler und Verarbeitungsmängel.",
    exclusions: "Nicht abgedeckt",
    exclusionItems: [
      "Mechanische Schäden (Kratzer, Dellen, Brüche)",
      "Verfärbungen durch Kosmetika, Reinigungsmittel oder Schweiß",
      "Natürlicher Verschleiß (Rhodium-Abrieb, Mattierung)",
      "Steinverlust durch unsachgemäßen Gebrauch",
      "Änderungen durch Dritte",
    ],
    freeService: "Kostenloser Service",
    freeServiceDesc:
      "Erste Reinigung und Auffrischung Ihres Schmucks innerhalb von 12 Monaten nach dem Kauf — kostenlos.",
    b2b: "B2B",
    b2bDesc: "Gewährleistungsausschluss für Geschäftskunden nach polnischem Recht.",
    claim: "Reklamation",
    claimDesc:
      "Schreiben Sie an contact@aejaca.com — wir bearbeiten Ihre Anfrage innerhalb von 14 Werktagen.",
    careLink: "Wie pflege ich meinen Schmuck?",
  },
};

const SECTIONS = [
  { key: "period", iconKey: "shield" },
  { key: "scope", iconKey: "check" },
  { key: "freeService", iconKey: "sparkles" },
  { key: "b2b", iconKey: "building" },
  { key: "claim", iconKey: "mail" },
];

const ICONS = {
  shield: Shield,
  check: CheckCircle,
  sparkles: Sparkles,
  building: Building2,
  mail: Mail,
};

export default function Warranty() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const headerRef = useScrollReveal();
  const sectionsRef = useScrollReveal();
  const exclusionsRef = useScrollReveal();
  const footerRef = useScrollReveal();

  const pageUrl = `${SITE.url}/warranty/`;
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
        pageKey="warranty"
        path="/warranty"
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

            {/* Main sections grid */}
            <div ref={sectionsRef} className="reveal grid md:grid-cols-2 gap-5 mb-8">
              {SECTIONS.map(({ key, iconKey }) => {
                const Icon = ICONS[iconKey];
                return (
                  <div
                    key={key}
                    className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 hover:border-amber-400/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-amber-400 shrink-0" />
                      <h2 className="text-white font-semibold">{l[key]}</h2>
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {l[`${key}Desc`]}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Exclusions section — full width */}
            <div
              ref={exclusionsRef}
              className="reveal bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <h2 className="text-white font-semibold">{l.exclusions}</h2>
              </div>
              <ul className="space-y-2">
                {l.exclusionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                    <span className="text-rose-400 mt-0.5 shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom care link */}
            <div ref={footerRef} className="reveal text-center">
              <Link
                to="/blog/jak-dbac-o-bizuterie/"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm"
              >
                {l.careLink} &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
