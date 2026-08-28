import { Link } from "../i18n/nav.jsx";
import { useState } from "react";
import { CheckCircle, XCircle, FileText, Mail, Copy, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import PolicyLinks from "../components/PolicyLinks.jsx";
import { SELLER } from "../data/sellerInfo.js";

const LABELS = {
  pl: {
    tag: "Zwroty",
    title: "Polityka zwrotów i wymian",
    description: "Zasady zwrotów produktów AEJaCA.",
    rightTitle: "Prawo odstąpienia od umowy (14 dni)",
    rightItems: [
      "Dotyczy produktów gotowych, kupionych bez personalizacji",
      "Masz 14 dni od odebrania przesyłki, żeby powiadomić nas o odstąpieniu. Wystarczy wiadomość na contact@aejaca.com, bez podawania powodu i bez żadnego formularza",
      "Zwracamy wszystkie otrzymane płatności, w tym koszt najtańszej oferowanej dostawy, w ciągu 14 dni od otrzymania Twojego oświadczenia",
      "Możemy wstrzymać się ze zwrotem do chwili otrzymania towaru albo dowodu jego odesłania",
      "Towar odsyłasz w ciągu 14 dni od złożenia oświadczenia, a bezpośredni koszt odesłania ponosisz Ty",
      "Odpowiadasz za zmniejszenie wartości rzeczy wynikające z korzystania z niej ponad to, co konieczne do sprawdzenia jej charakteru i działania",
    ],
    excludeTitle: "Wyłączenia z prawa odstąpienia",
    excludeItems: [
      "Wydruki wykonane z pliku przekazanego przez Ciebie",
      "Wyroby grawerowane lub znakowane treścią, którą wskazałeś",
      "Biżuteria wykonana według indywidualnego projektu, w tym z doborem rozmiaru",
      "Wyroby z kamieniami lub kruszcami sprowadzonymi na Twoje indywidualne życzenie",
      "Usługi projektowe wykonane w całości za Twoją wyraźną zgodą na rozpoczęcie przed upływem terminu odstąpienia",
      "Treści cyfrowe, po rozpoczęciu pobierania za Twoją wyraźną zgodą",
    ],
    formTitle: "Wzór formularza odstąpienia od umowy",
    formNote: "Formularz jest dobrowolny, wystarczy zwykła wiadomość. Zostawiamy go, żebyś nie musiał szukać, co w niej napisać.",
    formLines: [
      "Adresat: {seller}, {address}, contact@aejaca.com",
      "Ja niniejszym informuję o moim odstąpieniu od umowy sprzedaży następujących rzeczy:",
      "Numer zamówienia:",
      "Data odbioru:",
      "Imię i nazwisko konsumenta:",
      "Adres konsumenta:",
      "Data:",
      "Podpis (tylko jeżeli formularz jest przesyłany w wersji papierowej):",
    ],
    formCopy: "Skopiuj formularz",
    formCopied: "Skopiowano",
    complaintTitle: "Reklamacje",
    complaintDesc: "Reklamacje rozpatrywane są w ramach osobnej procedury gwarancyjnej.",
    complaintLink: "Szczegóły gwarancji",
    contactNote: "Pytania? Napisz na contact@aejaca.com",
    termsNote: "Wiążące brzmienie tych zasad zawiera",
    termsLink: "Regulamin, § 10",
  },
  en: {
    tag: "Returns",
    title: "Returns & Exchanges Policy",
    description: "Return policy for AEJaCA products.",
    rightTitle: "Right of withdrawal (14 days)",
    rightItems: [
      "Applies to ready-made products bought without personalisation",
      "You have 14 days from receiving the parcel to tell us you are withdrawing. An email to contact@aejaca.com is enough, with no reason and no form",
      "We refund every payment received, including the cost of the cheapest delivery we offer, within 14 days of receiving your statement",
      "We may hold the refund until the goods come back or you show proof of sending them",
      "You send the goods back within 14 days of your statement and bear the direct cost of the return",
      "You are liable for any diminished value resulting from handling beyond what is necessary to establish the nature and functioning of the goods",
    ],
    excludeTitle: "Where the right of withdrawal does not apply",
    excludeItems: [
      "Prints made from a file you supplied",
      "Items engraved or marked with content you specified",
      "Jewelry made to an individual design, including a chosen size",
      "Items using stones or metals sourced at your individual request",
      "Design services performed in full with your express consent to start before the withdrawal period ends",
      "Digital content, once the download has started with your express consent",
    ],
    formTitle: "Model withdrawal form",
    formNote: "The form is optional, a plain message is enough. We include it so you do not have to work out what to write.",
    formLines: [
      "To: {seller}, {address}, contact@aejaca.com",
      "I hereby give notice that I withdraw from the contract of sale of the following goods:",
      "Order number:",
      "Date of receipt:",
      "Consumer's name:",
      "Consumer's address:",
      "Date:",
      "Signature (only if this form is sent on paper):",
    ],
    formCopy: "Copy the form",
    formCopied: "Copied",
    complaintTitle: "Complaints",
    complaintDesc: "Complaints are handled under a separate warranty procedure.",
    complaintLink: "Warranty details",
    contactNote: "Questions? Email contact@aejaca.com",
    termsNote: "The binding wording of these rules is set out in",
    termsLink: "Terms of Service, section 10",
  },
  de: {
    tag: "Rückgabe",
    title: "Rückgabe- und Umtauschrichtlinien",
    description: "Rückgabebedingungen für AEJaCA-Produkte.",
    rightTitle: "Widerrufsrecht (14 Tage)",
    rightItems: [
      "Gilt für fertige Produkte, die ohne Personalisierung gekauft wurden",
      "Sie haben 14 Tage ab Erhalt der Sendung, um uns den Widerruf mitzuteilen. Eine Nachricht an contact@aejaca.com genügt, ohne Begründung und ohne Formular",
      "Wir erstatten alle erhaltenen Zahlungen einschließlich der Kosten der günstigsten angebotenen Lieferung innerhalb von 14 Tagen nach Eingang Ihrer Erklärung",
      "Wir dürfen die Erstattung zurückhalten, bis die Ware bei uns eingeht oder Sie den Versandnachweis vorlegen",
      "Die Ware senden Sie innerhalb von 14 Tagen nach Ihrer Erklärung zurück und tragen die unmittelbaren Rücksendekosten",
      "Für einen Wertverlust durch einen Umgang, der über die Prüfung von Beschaffenheit und Funktion hinausgeht, haften Sie",
    ],
    excludeTitle: "Wann das Widerrufsrecht nicht gilt",
    excludeItems: [
      "Drucke aus einer von Ihnen übermittelten Datei",
      "Waren, die mit einem von Ihnen vorgegebenen Inhalt graviert oder markiert wurden",
      "Schmuck nach individuellem Entwurf, einschließlich gewählter Größe",
      "Waren mit Steinen oder Metallen, die auf Ihren individuellen Wunsch beschafft wurden",
      "Designleistungen, die mit Ihrer ausdrücklichen Zustimmung vor Ablauf der Widerrufsfrist vollständig erbracht wurden",
      "Digitale Inhalte, sobald der Download mit Ihrer ausdrücklichen Zustimmung begonnen hat",
    ],
    formTitle: "Muster-Widerrufsformular",
    formNote: "Das Formular ist freiwillig, eine formlose Nachricht genügt. Wir stellen es bereit, damit Sie nicht überlegen müssen, was hineingehört.",
    formLines: [
      "An: {seller}, {address}, contact@aejaca.com",
      "Hiermit widerrufe ich den Vertrag über den Kauf der folgenden Waren:",
      "Bestellnummer:",
      "Erhalten am:",
      "Name des Verbrauchers:",
      "Anschrift des Verbrauchers:",
      "Datum:",
      "Unterschrift (nur bei Mitteilung auf Papier):",
    ],
    formCopy: "Formular kopieren",
    formCopied: "Kopiert",
    complaintTitle: "Reklamationen",
    complaintDesc:
      "Reklamationen werden im Rahmen eines separaten Garantieverfahrens bearbeitet.",
    complaintLink: "Garantiedetails",
    contactNote: "Fragen? Schreiben Sie an contact@aejaca.com",
    termsNote: "Der verbindliche Wortlaut dieser Regeln findet sich in den",
    termsLink: "AGB, Abschnitt 10",
  },
};

export default function Returns() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const headerRef = useScrollReveal();
  const rightRef = useScrollReveal();
  const excludeRef = useScrollReveal();
  const bottomRef = useScrollReveal();

  const pageUrl = `${SITE.url}/returns/`;
  const schemas = [
    buildWebPageSchema({
      title: `${l.tag}, ${SITE.name}`,
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
              {/* Ta strona jest skrótem. Wiążący zapis wyłączenia siedzi w § 10
                  regulaminu, więc klient musi mieć stąd do niego drogę. */}
              <p className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-500">
                {l.termsNote}{" "}
                <Link to="/terms/#sec-10" className="text-amber-400 hover:text-amber-300 transition-colors">
                  {l.termsLink}
                </Link>
                .
              </p>
            </div>

            {/* Wzor formularza odstapienia (zalacznik nr 2 do ustawy o prawach
                konsumenta). Ustawa wymaga jego udostepnienia, nawet jesli
                oswiadczenie nie wymaga zadnej formy, wiec stoi tu do przepisania
                albo skopiowania jednym przyciskiem. */}
            <WithdrawalForm l={l} className="mb-5" />

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

            <PolicyLinks current="returns" className="mt-5" />
          </div>
        </section>
      </div>
    </>
  );
}

function WithdrawalForm({ l, className = "" }) {
  const [copied, setCopied] = useState(false);
  const lines = l.formLines.map((line) =>
    line.replace("{seller}", SELLER.legalName).replace("{address}", SELLER.addressLines.join(", "))
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Schowek bywa niedostepny (starsza przegladarka, brak zgody). Formularz
      // stoi na wierzchu, wiec zawsze da sie go zaznaczyc i skopiowac recznie.
    }
  }

  return (
    <div className={`bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-neutral-400 shrink-0" />
          <h2 className="text-white font-semibold">{l.formTitle}</h2>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? l.formCopied : l.formCopy}
        </button>
      </div>
      <p className="text-neutral-500 text-xs mb-4">{l.formNote}</p>
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-neutral-400 text-xs leading-relaxed">{line}</p>
        ))}
      </div>
    </div>
  );
}
