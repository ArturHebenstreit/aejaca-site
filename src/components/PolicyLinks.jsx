import { Link } from "../i18n/nav.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// Wspólny blok nawigacji między dokumentami prawnymi.
//
// Powód: /returns/ podaje wyłączenie prawa odstąpienia w formie skrótu, a
// wiążący zapis jest w § 10 regulaminu. Klient czytający skrót musi mieć jak
// dojść do pełnego tekstu, i odwrotnie. Bez tego bloku linkowanie było
// jednokierunkowe.
//
// Użycie: <PolicyLinks current="returns" />, gdzie current wypada z listy.

const LABELS = {
  pl: {
    heading: "Dokumenty powiązane",
    terms: "Regulamin",
    payments: "Proces płatności",
    returns: "Zwroty i wymiany",
    warranty: "Gwarancja",
    shipping: "Wysyłka i dostawa",
    privacy: "Polityka prywatności",
  },
  en: {
    heading: "Related documents",
    terms: "Terms of Service",
    payments: "How payment works",
    returns: "Returns & exchanges",
    warranty: "Warranty",
    shipping: "Shipping & delivery",
    privacy: "Privacy policy",
  },
  de: {
    heading: "Zugehörige Dokumente",
    terms: "AGB",
    payments: "Zahlungsablauf",
    returns: "Rückgabe und Umtausch",
    warranty: "Garantie",
    shipping: "Versand und Lieferung",
    privacy: "Datenschutzerklärung",
  },
};

const DOCS = [
  { key: "terms", path: "/terms/" },
  { key: "payments", path: "/payments/" },
  { key: "returns", path: "/returns/" },
  { key: "warranty", path: "/warranty/" },
  { key: "shipping", path: "/shipping/" },
  { key: "privacy", path: "/privacy/" },
];

export default function PolicyLinks({ current, className = "" }) {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.pl;

  return (
    <nav
      aria-label={l.heading}
      className={`bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 ${className}`}
    >
      <h2 className="text-white font-semibold mb-4">{l.heading}</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {DOCS.filter((d) => d.key !== current).map((d) => (
          <Link
            key={d.key}
            to={d.path}
            className="text-neutral-400 hover:text-amber-400 transition-colors"
          >
            {l[d.key]} &rarr;
          </Link>
        ))}
      </div>
    </nav>
  );
}
