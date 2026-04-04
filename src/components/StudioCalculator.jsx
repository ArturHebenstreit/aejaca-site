import { useState } from "react";
import { Printer, Zap, Layers, Box } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { trackCalc } from "../utils/analytics.js";
import Print3DCalc from "./calculators/Print3DCalc.jsx";
import CO2LaserCalc from "./calculators/CO2LaserCalc.jsx";
import FiberLaserCalc from "./calculators/FiberLaserCalc.jsx";
import EpoxyCastCalc from "./calculators/EpoxyCastCalc.jsx";

const TECHS = [
  { id: "3dprint",    icon: Printer, labelKey: "tab3d" },
  { id: "co2_laser",  icon: Zap,     labelKey: "tabCO2" },
  { id: "fiber_laser", icon: Zap,    labelKey: "tabFiber" },
  { id: "epoxy",      icon: Box,     labelKey: "tabEpoxy" },
];

const LABELS = {
  pl: { tag: "Kalkulatory Projektów", title: "Estymator Kosztów", tab3d: "Druk 3D", tabCO2: "Laser CO2", tabFiber: "Laser Fiber", tabEpoxy: "Odlewy żywiczne",
    note: 'Kalkulacje są szacunkowe. Rzeczywista cena zależy od geometrii, złożoności i specyfikacji. Opcje "niestandardowe" wymagają indywidualnej wyceny.',
    vat: "Podane ceny są orientacyjne i nie zawierają stosownych podatków VAT czy ich odpowiedników, które należy doliczyć przy finalizacji zamówienia." },
  en: { tag: "Project Calculators", title: "Cost Estimator", tab3d: "3D Print", tabCO2: "CO2 Laser", tabFiber: "Fiber Laser", tabEpoxy: "Resin Casting",
    note: "Estimates are approximate. Actual price depends on geometry, complexity, and specifications. Custom options require an individual quote.",
    vat: "Prices shown are indicative and do not include applicable VAT or equivalent taxes, which will be added upon order finalization." },
  de: { tag: "Projektkalkulatoren", title: "Kostenschätzer", tab3d: "3D-Druck", tabCO2: "CO2-Laser", tabFiber: "Faserlaser", tabEpoxy: "Harzguss",
    note: 'Kalkulationen sind Schätzungen. Der tatsächliche Preis hängt von Geometrie, Komplexität und Spezifikationen ab. "Individuelle" Optionen erfordern ein separates Angebot.',
    vat: "Die angegebenen Preise sind Richtwerte und enthalten keine Mehrwertsteuer oder gleichwertige Abgaben, die bei der Auftragsabwicklung hinzukommen." },
};

export default function StudioCalculator() {
  const [activeTech, setActiveTech] = useState("3dprint");
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  return (
    <section id="calculator" className="py-20 px-4 bg-neutral-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">{l.tag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{l.title}</h2>
        </div>

        {/* Technology tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TECHS.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              onClick={() => { setActiveTech(id); trackCalc("studio", "tech_tab", id); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                activeTech === id
                  ? "border-blue-400 bg-blue-400/10 text-blue-300"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {l[labelKey]}
            </button>
          ))}
        </div>

        {/* Active calculator */}
        <div className="glass-blue rounded-2xl p-5 sm:p-6">
          {activeTech === "3dprint" && <Print3DCalc lang={lang} />}
          {activeTech === "co2_laser" && <CO2LaserCalc lang={lang} />}
          {activeTech === "fiber_laser" && <FiberLaserCalc lang={lang} />}
          {activeTech === "epoxy" && <EpoxyCastCalc lang={lang} />}
        </div>

        {/* VAT disclaimer */}
        <div className="mt-4 p-3 rounded-xl border border-blue-400/10 bg-blue-400/[0.02] text-[11px] text-blue-400/60 leading-relaxed text-center">
          {l.vat}
        </div>

        {/* Footer note */}
        <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[11px] text-neutral-600 leading-relaxed">
          <strong className="text-neutral-500">sTuDiO:</strong> {l.note}
        </div>
      </div>
    </section>
  );
}
