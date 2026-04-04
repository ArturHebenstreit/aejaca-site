import { useLanguage } from "../i18n/LanguageContext.jsx";
import JewelryCalc from "./calculators/JewelryCalc.jsx";

const LABELS = {
  pl: {
    tag: "Kalkulator Biżuterii",
    title: "Estymator Kosztów",
    note: 'Kalkulacje są szacunkowe. Rzeczywista cena zależy od projektu, kamieni i specyfikacji. Opcje "niestandardowe" wymagają indywidualnej wyceny.',
    vat: "Podane ceny są orientacyjne i nie zawierają stosownych podatków VAT czy ich odpowiedników, które należy doliczyć przy finalizacji zamówienia.",
  },
  en: {
    tag: "Jewelry Calculator",
    title: "Cost Estimator",
    note: "Estimates are approximate. Actual price depends on design, gemstones, and specifications. Custom options require an individual quote.",
    vat: "Prices shown are indicative and do not include applicable VAT or equivalent taxes, which will be added upon order finalization.",
  },
  de: {
    tag: "Schmuckkalkulator",
    title: "Kostenschätzer",
    note: 'Kalkulationen sind Schätzungen. Der tatsächliche Preis hängt von Design, Edelsteinen und Spezifikationen ab. "Individuelle" Optionen erfordern ein separates Angebot.',
    vat: "Die angegebenen Preise sind Richtwerte und enthalten keine Mehrwertsteuer oder gleichwertige Abgaben, die bei der Auftragsabwicklung hinzukommen.",
  },
};

export default function JewelryEstimator() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  return (
    <section id="calculator" className="py-20 px-4 bg-neutral-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-amber-400 text-xs uppercase tracking-[0.2em] mb-3">{l.tag}</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight">{l.title}</h2>
        </div>

        <div className="glass-amber rounded-2xl p-5 sm:p-6">
          <JewelryCalc lang={lang} />
        </div>

        {/* VAT disclaimer */}
        <div className="mt-4 p-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.02] text-[11px] text-amber-400/60 leading-relaxed text-center">
          {l.vat}
        </div>

        {/* Footer note */}
        <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[11px] text-neutral-600 leading-relaxed">
          <strong className="text-neutral-500">AEJaCA Jewelry:</strong> {l.note}
        </div>
      </div>
    </section>
  );
}
