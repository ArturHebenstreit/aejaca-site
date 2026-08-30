// ============================================================
// NAJCZESCIEJ ZADAWANE PYTANIA
// ============================================================
// Pytania byly rozsypane po stronach procesu i zeby trafic na wlasciwe, trzeba
// bylo najpierw zgadnac, na ktorej stronie stoi. Ta strona zbiera wszystkie
// w jednym miejscu i daje dwa narzedzia, ktorych lista bez nich nie zastapi:
// wyszukiwanie po tresci i filtr tematow.
//
// Tresc pytan mieszka w `src/data/faq.js`, wspolnie ze stronami tematycznymi.
// Trzy kopie tego samego pytania rozjechalyby sie przy pierwszej poprawce,
// a klient dostalby dwie rozne odpowiedzi zaleznie od tego, gdzie trafil.

import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, HelpCircle, X } from "lucide-react";
import { Link } from "../i18n/nav.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import SEOHead from "../seo/SEOHead.jsx";
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "../seo/schemas.js";
import { SITE } from "../seo/seoData.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import FaqLista from "../components/FaqLista.jsx";
import PolicyLinks from "../components/PolicyLinks.jsx";
import { FAQ, FAQ_TEMATY, szukajFaq } from "../data/faq.js";

const L = {
  pl: {
    tag: "Pomoc",
    title: "Najczęściej zadawane pytania",
    description: "Odpowiedzi na pytania o płatność, oferty, termin realizacji, dostawę i odbiór zamówienia w AEJaCA. Z wyszukiwarką i podziałem na tematy.",
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
    description: "Answers about payment, offers, lead times, delivery and collecting an AEJaCA order. With search and topic filters.",
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
    linkRealizacji: "How your order is made",
    linkZamowienie: "Check your order",
  },
  de: {
    tag: "Hilfe",
    title: "Häufige Fragen",
    description: "Antworten zu Zahlung, Angeboten, Lieferzeit, Versand und Abholung einer AEJaCA-Bestellung. Mit Suche und Themenfiltern.",
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
    linkRealizacji: "Ablauf der Auftragsabwicklung",
    linkZamowienie: "Bestellung prüfen",
  },
};

export default function Faq() {
  const { lang } = useLanguage();
  const l = L[lang] || L.pl;
  // Temat w adresie, zeby dalo sie wyslac odnosnik do jednej grupy pytan,
  // a odswiezenie strony nie kasowalo wyboru.
  const [params, setParams] = useSearchParams();
  const temat = params.get("temat");
  const [fraza, setFraza] = useState("");

  const wynik = useMemo(() => szukajFaq(fraza, lang, temat), [fraza, lang, temat]);

  const pageUrl = `${SITE.url}/faq/`;
  const schemas = [
    buildWebPageSchema({ title: `${l.title}, ${SITE.name}`, description: l.description, url: pageUrl, lang }),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE.url },
      { name: l.title, url: pageUrl },
    ]),
    // Do schematu ida WSZYSTKIE pytania, niezaleznie od filtra: wyszukiwarka
    // czyta strone raz i nie klika w kafelki tematow.
    buildFAQSchema(FAQ.map((f) => ({ q: f.q[lang] || f.q.pl, a: f.a[lang] || f.a.pl }))),
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
              <FaqLista pytania={wynik} />
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
