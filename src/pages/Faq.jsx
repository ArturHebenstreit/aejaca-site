// ============================================================
// NAJCZESCIEJ ZADAWANE PYTANIA
// ============================================================
// Pytania byly rozsypane po stronach procesu i zeby trafic na wlasciwe, trzeba
// bylo najpierw zgadnac, na ktorej stronie stoi. Ta strona zbiera wszystkie
// w jednym miejscu i daje dwa narzedzia, ktorych lista bez nich nie zastapi:
// wyszukiwanie po tresci i filtr tematow.
//
// Tresc pytan mieszka w `src/data/faq/`, wspolnie ze stronami tematycznymi:
// pytanie o bizuterie widac na stronie bizuterii, pytanie o sTuDiO na stronie
// sTuDiO, a wyszukac da sie KAZDE tutaj (ustalenie wlasciciela, 2026-08-30).
// Druga kopia tekstu rozjechalaby sie przy pierwszej poprawce, i to po cichu.
//
// Ta strona NIE oglasza schematu FAQPage. Kazde pytanie ma juz strone, ktora
// je posiada i ktora ten schemat niesie, a ten sam zestaw pytan ogloszony
// dwa razy pod dwoma adresami jest dla wyszukiwarki duplikatem. Tu liczy sie
// czlowiek z jednym pytaniem, nie drugi komplet danych strukturalnych.

import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, HelpCircle, X } from "lucide-react";
import { Link } from "../i18n/nav.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import FaqLista from "../components/FaqLista.jsx";
import PolicyLinks from "../components/PolicyLinks.jsx";
import { FAQ_TEMATY, szukajFaq } from "../data/faq/index.js";
import { kwotyWysylki, kwotyPln } from "../data/kwotyWysylki.js";
import { useMarketRates } from "../hooks/useMarketRates.js";

const L = {
  pl: {
    tag: "Pomoc",
    title: "Najczęściej zadawane pytania",
    description: "Wszystkie pytania i odpowiedzi AEJaCA w jednym miejscu: biżuteria, sTuDiO, płatność, oferty, realizacja, dostawa i narzędzia. Z wyszukiwarką i filtrami.",
    szukaj: "Szukaj w pytaniach",
    wyczysc: "Wyczyść",
    wszystkie: "Wszystkie",
    brak: "Nic nie pasuje do tego, czego szukasz.",
    brakRada: "Spróbuj innego słowa albo napisz do nas, odpowiemy tym samym kanałem.",
    ile: (n) => (n === 1 ? "1 pytanie" : n < 5 ? `${n} pytania` : `${n} pytań`),
    kontakt: "Nie ma tu Twojego pytania?",
    kontaktLink: "Napisz do nas",
    procesy: "Cały proces krok po kroku opisują dwie strony:",
    linkPlatnosci: "Proces płatności",
    linkRealizacji: "Proces realizacji",
    linkZamowienie: "Sprawdź swoje zamówienie",
  },
  en: {
    tag: "Help",
    title: "Frequently asked questions",
    description: "Every AEJaCA question and answer in one place: jewelry, sTuDiO, payment, offers, lead times, delivery and the tools. With search and topic filters.",
    szukaj: "Search the questions",
    wyczysc: "Clear",
    wszystkie: "All",
    brak: "Nothing matches what you are looking for.",
    brakRada: "Try another word, or write to us and we will answer the same way.",
    ile: (n) => (n === 1 ? "1 question" : `${n} questions`),
    kontakt: "Your question is not here?",
    kontaktLink: "Write to us",
    procesy: "Two pages describe the whole process step by step:",
    linkPlatnosci: "How payment works",
    linkRealizacji: "How we make your order",
    linkZamowienie: "Check your order",
  },
  de: {
    tag: "Hilfe",
    title: "Häufige Fragen",
    description: "Alle Fragen und Antworten von AEJaCA an einer Stelle: Schmuck, sTuDiO, Zahlung, Angebote, Fertigung, Lieferung und Werkzeuge. Mit Suche und Filtern.",
    szukaj: "In den Fragen suchen",
    wyczysc: "Löschen",
    wszystkie: "Alle",
    brak: "Nichts passt zu Ihrer Suche.",
    brakRada: "Versuchen Sie ein anderes Wort oder schreiben Sie uns, wir antworten auf demselben Weg.",
    ile: (n) => (n === 1 ? "1 Frage" : `${n} Fragen`),
    kontakt: "Ihre Frage steht nicht dabei?",
    kontaktLink: "Schreiben Sie uns",
    procesy: "Zwei Seiten beschreiben den gesamten Ablauf Schritt für Schritt:",
    linkPlatnosci: "Zahlungsablauf",
    linkRealizacji: "Ablauf der Fertigung",
    linkZamowienie: "Bestellung prüfen",
  },
};

// Nazwa strony, na ktorej pytanie stoi w swoim kontekscie. Sam odnosnik
// "zobacz" nic nie mowi, a "Biżuteria" od razu tlumaczy, czego dotyczy reszta
// tamtej strony. Sciezki sa te same, ktore niosa wpisy w `src/data/faq/`.
const STRONY = {
  pl: {
    "/": "Strona główna", "/jewelry/": "Biżuteria", "/studio/": "AEJaCA sTuDiO",
    "/payments/": "Proces płatności", "/order-process/": "Proces realizacji",
    "/shipping/": "Wysyłka i dostawa", "/b2b/": "Współpraca B2B",
    "/toolsjewelry/ring-sizer/": "Miarka do pierścionków",
    "/toolsjewelry/metal-pricing/": "Wycena kruszcu",
    "/toolstudio/printability/": "Sprawdzenie modelu do druku",
    "/toolstudio/shrinkage/": "Skurcz odlewniczy",
    "/toolstudio/resin-settings/": "Ustawienia druku z żywicy",
  },
  en: {
    "/": "Home", "/jewelry/": "Jewelry", "/studio/": "AEJaCA sTuDiO",
    "/payments/": "How payment works", "/order-process/": "How we make your order",
    "/shipping/": "Shipping and delivery", "/b2b/": "B2B",
    "/toolsjewelry/ring-sizer/": "Printable ring sizer",
    "/toolsjewelry/metal-pricing/": "Metal value calculator",
    "/toolstudio/printability/": "Printability check",
    "/toolstudio/shrinkage/": "Casting shrinkage",
    "/toolstudio/resin-settings/": "Resin print settings",
  },
  de: {
    "/": "Startseite", "/jewelry/": "Schmuck", "/studio/": "AEJaCA sTuDiO",
    "/payments/": "Zahlungsablauf", "/order-process/": "Ablauf der Fertigung",
    "/shipping/": "Versand und Lieferung", "/b2b/": "B2B",
    "/toolsjewelry/ring-sizer/": "Ringmaß zum Ausdrucken",
    "/toolsjewelry/metal-pricing/": "Metallwert-Rechner",
    "/toolstudio/printability/": "Druckbarkeitsprüfung",
    "/toolstudio/shrinkage/": "Gussschwindung",
    "/toolstudio/resin-settings/": "Harzdruck-Einstellungen",
  },
};

export default function Faq() {
  const { lang } = useLanguage();
  const l = L[lang] || L.pl;
  const nazwaStrony = (sciezka) => (STRONY[lang] || STRONY.pl)[sciezka] || null;
  // Temat w adresie, zeby dalo sie wyslac odnosnik do jednej grupy pytan,
  // a odswiezenie strony nie kasowalo wyboru.
  const [params, setParams] = useSearchParams();
  const temat = params.get("temat");
  const [fraza, setFraza] = useState("");
  // Czesc odpowiedzi o wysylce niesie kwoty z cennika, wiec szukanie musi
  // widziec je tak samo jak czytelnik: "400" ma znalezc prog darmowej wysylki.
  const { rates } = useMarketRates();
  const wartosci = useMemo(() => ({ ...kwotyWysylki({ lang, rates }), ...kwotyPln(lang) }), [lang, rates]);

  const wynik = useMemo(() => szukajFaq(fraza, lang, temat, wartosci), [fraza, lang, temat, wartosci]);

  const pageUrl = `${SITE.url}/faq/`;
  const schemas = [
    buildWebPageSchema({ title: `${l.title}, ${SITE.name}`, description: l.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.title, url: pageUrl },
    ]),
  ];

  const ustawTemat = (id) => {
    const nowe = new URLSearchParams(params);
    if (id) nowe.set("temat", id);
    else nowe.delete("temat");
    setParams(nowe, { replace: true });
  };

  return (
    <>
      <SEOHead pageKey="faq" path="/faq" title={`${l.title}, AEJaCA`} description={l.description} schemas={schemas} />

      <div className="bg-neutral-950 min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Breadcrumb items={[{ label: l.title }]} />

          <div className="flex items-center gap-3 mb-2 mt-4">
            <HelpCircle className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-3xl font-bold text-white">{l.title}</h1>
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">{l.description}</p>

          {/* Wyszukiwanie i filtr stoja NAD pytaniami i nie przewijaja sie
              razem z nimi: to one sa powodem, dla ktorego ta strona istnieje
              osobno, zamiast byc dluga lista na dole innej. */}
          <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-neutral-950/90 backdrop-blur border-b border-neutral-800 mb-6">
            <label className="relative block mb-3">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <span className="sr-only">{l.szukaj}</span>
              <input
                type="search"
                value={fraza}
                onChange={(e) => setFraza(e.target.value)}
                placeholder={l.szukaj}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none"
              />
              {fraza && (
                <button
                  type="button"
                  onClick={() => setFraza("")}
                  aria-label={l.wyczysc}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => ustawTemat(null)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  !temat ? "border-amber-400/50 text-amber-300 bg-amber-400/10" : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                {l.wszystkie}
              </button>
              {FAQ_TEMATY.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => ustawTemat(t.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    temat === t.id ? "border-amber-400/50 text-amber-300 bg-amber-400/10" : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  {t.label[lang] || t.label.pl}
                </button>
              ))}
            </div>
          </div>

          <p className="text-neutral-600 text-xs mb-3">{l.ile(wynik.length)}</p>

          {wynik.length > 0 ? (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-8">
              <FaqLista pytania={wynik} wartosci={wartosci} nazwaStrony={nazwaStrony} />
            </div>
          ) : (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-8 text-center">
              <p className="text-neutral-300 text-sm">{l.brak}</p>
              <p className="text-neutral-500 text-sm mt-1">{l.brakRada}</p>
            </div>
          )}

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 mb-8 text-sm">
            <p className="text-neutral-400 mb-3">{l.procesy}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link to="/payments/" className="text-amber-400 hover:text-amber-300">{l.linkPlatnosci}</Link>
              <Link to="/order-process/" className="text-amber-400 hover:text-amber-300">{l.linkRealizacji}</Link>
              <Link to="/order/status/" className="text-amber-400 hover:text-amber-300">{l.linkZamowienie}</Link>
            </div>
          </div>

          <p className="text-neutral-500 text-sm text-center mb-8">
            {l.kontakt}{" "}
            <Link to="/contact/" className="text-amber-400 hover:text-amber-300">{l.kontaktLink}</Link>
          </p>

          <PolicyLinks current="faq" />
        </div>
      </div>
    </>
  );
}
