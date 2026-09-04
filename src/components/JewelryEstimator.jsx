import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Zap, SlidersHorizontal, Info } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { trackCalc } from "../utils/analytics.js";
import JewelryCalc from "./calculators/JewelryCalc.jsx";
import SimpleJewelryCalc from "./calculators/SimpleJewelryCalc.jsx";

const LABELS = {
  pl: {
    tag: "Kalkulator Biżuterii",
    title: "Estymator Kosztów",
    modeSimple: "Szybka wycena",
    modeSimpleDesc: "Kilka prostych pytań - dla każdego",
    modeAdvanced: "Dla zaawansowanych",
    modeAdvancedDesc: "Pełna kontrola parametrów",
    modeHint: "Szybka wycena daje orientacyjną cenę w 30 sekund. Tryb zaawansowany pozwala kontrolować każdy parametr (metal, próba, kamienie, praca jubilerska).",
    note: 'Kalkulacje są szacunkowe. Rzeczywista cena zależy od projektu, kamieni i specyfikacji. Opcje "niestandardowe" wymagają indywidualnej wyceny.',
    vat: "Kwoty w kalkulatorze są orientacyjne. Wiążąca jest dopiero kwota dodana do koszyka: obowiązuje 7 dni i to ona jest podstawą zamówienia.",
    shipping: "Ceny nie uwzględniają kosztów transportu.",
  },
  en: {
    tag: "Jewelry Calculator",
    title: "Cost Estimator",
    modeSimple: "Quick quote",
    modeSimpleDesc: "A few simple questions - for everyone",
    modeAdvanced: "For advanced users",
    modeAdvancedDesc: "Full control over parameters",
    modeHint: "Quick quote gives a rough estimate in 30 seconds. Advanced mode lets you control every parameter (metal, karat, stones, labor).",
    note: "Estimates are approximate. Actual price depends on design, gemstones, and specifications. Custom options require an individual quote.",
    vat: "Amounts in the calculator are indicative. Only the amount added to the cart is binding: it holds for 7 days and the order is based on it.",
    shipping: "Prices do not include shipping costs.",
  },
  de: {
    tag: "Schmuckkalkulator",
    title: "Kostenschätzer",
    modeSimple: "Schnellkalkulation",
    modeSimpleDesc: "Ein paar einfache Fragen - für jeden",
    modeAdvanced: "Für Fortgeschrittene",
    modeAdvancedDesc: "Volle Kontrolle über Parameter",
    modeHint: "Schnellkalkulation liefert eine grobe Schätzung in 30 Sekunden. Der erweiterte Modus bietet volle Kontrolle über jeden Parameter (Metall, Karat, Steine, Arbeit).",
    note: 'Kalkulationen sind Schätzungen. Der tatsächliche Preis hängt von Design, Edelsteinen und Spezifikationen ab. "Individuelle" Optionen erfordern ein separates Angebot.',
    vat: "Die Beträge im Kalkulator sind Richtwerte. Verbindlich ist erst der Betrag im Warenkorb: er gilt 7 Tage und ist die Grundlage der Bestellung.",
    shipping: "Preise verstehen sich ohne Versandkosten.",
  },
};

export default function JewelryEstimator() {
  // Wejscie z karty uslugi ("Otworz kalkulator zaawansowany") niesie w adresie
  // wybrana usluge. Skoro klient prosil o pelna kontrole, otwieramy tryb
  // zaawansowany od razu, zamiast kazac mu przelaczac go recznie.
  const [searchParams] = useSearchParams();
  const deepLinked = ["service", "type", "mode"].some((k) => searchParams.get(k));
  // ADRES Z PARAMETREM NIE MOZE ZMIENIC PIERWSZEGO RYSOWANIA. Strona jest
  // prerenderowana bez zapytania: serwer nie widzi `?tab=`, `?service=` ani
  // `?mode=`, wiec rysuje stan domyslny. Ustawienie innego stanu w `useState`
  // znaczylo, ze klient rysuje co innego niz przyszlo w HTML-u, React uznaje
  // to za rozjazd i wyrzuca CALE poddrzewo, zeby narysowac je od nowa.
  // Pomiar 2026-09-04: 42 bledy hydracji na `/studio/?tab=3dprint` i 38 na
  // `/jewelry/?service=new`, przy zielonym buildzie i zielonym prerenderze.
  // Dlatego link glboki przyjmujemy DOPIERO PO ZAMONTOWANIU, w efekcie:
  // pierwsze rysowanie zgadza sie z serwerem, drugie ustawia to, o co prosil
  // adres. Kosztem jest jedna klatka stanu domyslnego.
  const [mode, setMode] = useState("simple");
  const [linkPrzyjety, setLinkPrzyjety] = useState(false);
  useEffect(() => {
    if (!deepLinked || linkPrzyjety) return;
    setMode("advanced");
    setLinkPrzyjety(true);
  }, [deepLinked, linkPrzyjety]);
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  const isSimple = mode === "simple";
  const accentClass = isSimple ? "text-violet-300" : "text-amber-400";

  return (
    <section id="calculator" className={`py-20 px-4 transition-colors duration-500 ${isSimple ? "bg-gradient-to-b from-neutral-950 via-violet-950/10 to-neutral-950" : "bg-neutral-950"}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className={`text-xs uppercase tracking-[0.2em] mb-3 ${accentClass}`}>{l.tag}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight">{l.title}</h2>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => { setMode("simple"); trackCalc("jewelry", "mode", "simple"); }}
            className={`group p-4 rounded-xl border text-left transition-all duration-200 ${
              isSimple
                ? "border-violet-400 bg-violet-400/10 shadow-lg shadow-violet-400/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/30"
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-4 h-4 ${isSimple ? "text-violet-300" : "text-neutral-400"}`} />
              <div className={`text-sm font-bold ${isSimple ? "text-violet-300" : "text-white"}`}>{l.modeSimple}</div>
            </div>
            <div className={`text-xs ${isSimple ? "text-violet-300" : "text-neutral-400"}`}>{l.modeSimpleDesc}</div>
          </button>
          <button
            onClick={() => { setMode("advanced"); trackCalc("jewelry", "mode", "advanced"); }}
            className={`group p-4 rounded-xl border text-left transition-all duration-200 ${
              !isSimple
                ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/30"
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className={`w-4 h-4 ${!isSimple ? "text-amber-300" : "text-neutral-400"}`} />
              <div className={`text-sm font-bold ${!isSimple ? "text-amber-300" : "text-white"}`}>{l.modeAdvanced}</div>
            </div>
            <div className={`text-xs ${!isSimple ? "text-amber-400/80" : "text-neutral-400"}`}>{l.modeAdvancedDesc}</div>
          </button>
        </div>

        {/* Mode hint - clarifies when to use each (audit: UX friction) */}
        <div className="mb-6 flex items-start gap-2 px-3 text-xs text-neutral-400 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
          <span>{l.modeHint}</span>
        </div>

        {/* SIMPLE MODE */}
        {isSimple && (
          <div className="rounded-2xl p-5 sm:p-6 border border-violet-400/10 bg-violet-400/[0.02]">
            <SimpleJewelryCalc lang={lang} />
          </div>
        )}

        {/* ADVANCED MODE */}
        {!isSimple && (
          <div className="glass-amber rounded-2xl p-5 sm:p-6">
            <JewelryCalc lang={lang} />
          </div>
        )}

        {/* Kwota orientacyjna kontra wiazaca, plus transport. O VAT tu nie
            mowimy: kwoty w kalkulatorze sa tymi, ktore klient placi. */}
        <div className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed text-center ${
          isSimple
            ? "border-violet-400/10 bg-violet-400/[0.02] text-violet-300"
            : "border-amber-400/10 bg-amber-400/[0.02] text-amber-400/60"
        }`}>
          {l.vat} {l.shipping}
        </div>

        {/* Footer note */}
        <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] text-xs text-neutral-400 leading-relaxed">
          <strong className="text-neutral-400">AEJaCA Jewelry:</strong> {l.note}
        </div>
      </div>
    </section>
  );
}
