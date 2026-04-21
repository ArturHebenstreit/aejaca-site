import { useState } from "react";
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
    modeSimpleDesc: "Kilka prostych pytań — dla każdego",
    modeAdvanced: "Dla zaawansowanych",
    modeAdvancedDesc: "Pełna kontrola parametrów",
    modeHint: "Szybka wycena daje orientacyjną cenę w 30 sekund. Tryb zaawansowany pozwala kontrolować każdy parametr (metal, próba, kamienie, praca jubilerska).",
    note: 'Kalkulacje są szacunkowe. Rzeczywista cena zależy od projektu, kamieni i specyfikacji. Opcje "niestandardowe" wymagają indywidualnej wyceny.',
    vat: "Podane ceny są orientacyjne i nie zawierają stosownych podatków VAT czy ich odpowiedników, które należy doliczyć przy finalizacji zamówienia.",
    shipping: "Ceny nie uwzględniają kosztów transportu.",
  },
  en: {
    tag: "Jewelry Calculator",
    title: "Cost Estimator",
    modeSimple: "Quick quote",
    modeSimpleDesc: "A few simple questions — for everyone",
    modeAdvanced: "For advanced users",
    modeAdvancedDesc: "Full control over parameters",
    modeHint: "Quick quote gives a rough estimate in 30 seconds. Advanced mode lets you control every parameter (metal, karat, stones, labor).",
    note: "Estimates are approximate. Actual price depends on design, gemstones, and specifications. Custom options require an individual quote.",
    vat: "Prices shown are indicative and do not include applicable VAT or equivalent taxes, which will be added upon order finalization.",
    shipping: "Prices do not include shipping costs.",
  },
  de: {
    tag: "Schmuckkalkulator",
    title: "Kostenschätzer",
    modeSimple: "Schnellkalkulation",
    modeSimpleDesc: "Ein paar einfache Fragen — für jeden",
    modeAdvanced: "Für Fortgeschrittene",
    modeAdvancedDesc: "Volle Kontrolle über Parameter",
    modeHint: "Schnellkalkulation liefert eine grobe Schätzung in 30 Sekunden. Der erweiterte Modus bietet volle Kontrolle über jeden Parameter (Metall, Karat, Steine, Arbeit).",
    note: 'Kalkulationen sind Schätzungen. Der tatsächliche Preis hängt von Design, Edelsteinen und Spezifikationen ab. "Individuelle" Optionen erfordern ein separates Angebot.',
    vat: "Die angegebenen Preise sind Richtwerte und enthalten keine Mehrwertsteuer oder gleichwertige Abgaben, die bei der Auftragsabwicklung hinzukommen.",
    shipping: "Preise verstehen sich ohne Versandkosten.",
  },
};

export default function JewelryEstimator() {
  const [mode, setMode] = useState("simple");
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  const isSimple = mode === "simple";
  const accentClass = isSimple ? "text-rose-300" : "text-amber-400";

  return (
    <section id="calculator" className={`py-20 px-4 transition-colors duration-500 ${isSimple ? "bg-gradient-to-b from-neutral-950 via-rose-950/10 to-neutral-950" : "bg-neutral-950"}`}>
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
                ? "border-rose-400 bg-rose-400/10 shadow-lg shadow-rose-400/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/30"
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-4 h-4 ${isSimple ? "text-rose-300" : "text-neutral-400"}`} />
              <div className={`text-sm font-bold ${isSimple ? "text-rose-300" : "text-white"}`}>{l.modeSimple}</div>
            </div>
            <div className={`text-[11px] ${isSimple ? "text-rose-400/80" : "text-neutral-500"}`}>{l.modeSimpleDesc}</div>
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
            <div className={`text-[11px] ${!isSimple ? "text-amber-400/80" : "text-neutral-500"}`}>{l.modeAdvancedDesc}</div>
          </button>
        </div>

        {/* Mode hint — clarifies when to use each (audit: UX friction) */}
        <div className="mb-6 flex items-start gap-2 px-3 text-[11px] text-neutral-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-600" />
          <span>{l.modeHint}</span>
        </div>

        {/* SIMPLE MODE */}
        {isSimple && (
          <div className="rounded-2xl p-5 sm:p-6 border border-rose-400/10 bg-rose-400/[0.02]">
            <SimpleJewelryCalc lang={lang} />
          </div>
        )}

        {/* ADVANCED MODE */}
        {!isSimple && (
          <div className="glass-amber rounded-2xl p-5 sm:p-6">
            <JewelryCalc lang={lang} />
          </div>
        )}

        {/* VAT + shipping disclaimer */}
        <div className={`mt-4 p-3 rounded-xl border text-[11px] leading-relaxed text-center ${
          isSimple
            ? "border-rose-400/10 bg-rose-400/[0.02] text-rose-400/60"
            : "border-amber-400/10 bg-amber-400/[0.02] text-amber-400/60"
        }`}>
          {l.vat} {l.shipping}
        </div>

        {/* Footer note */}
        <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[11px] text-neutral-600 leading-relaxed">
          <strong className="text-neutral-500">AEJaCA Jewelry:</strong> {l.note}
        </div>
      </div>
    </section>
  );
}
