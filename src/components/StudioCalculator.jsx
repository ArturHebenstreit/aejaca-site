import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { trackCalc } from "../utils/analytics.js";
import Print3DCalc from "./calculators/Print3DCalc.jsx";
import CO2LaserCalc from "./calculators/CO2LaserCalc.jsx";
import FiberLaserCalc from "./calculators/FiberLaserCalc.jsx";
import EpoxyCastCalc from "./calculators/EpoxyCastCalc.jsx";

const TECHS = [
  { id: "3dprint",     labelKey: "tab3d",    descKey: "desc3d",    img: "/img/calc/studio/3dprint.png" },
  { id: "co2_laser",   labelKey: "tabCO2",   descKey: "descCO2",   img: "/img/calc/studio/co2_laser.png" },
  { id: "fiber_laser", labelKey: "tabFiber", descKey: "descFiber", img: "/img/calc/studio/fiber_laser.png" },
  { id: "epoxy",       labelKey: "tabEpoxy", descKey: "descEpoxy", img: "/img/calc/studio/epoxy.png" },
];

const LABELS = {
  pl: { tag: "Kalkulatory Projektów", title: "Estymator Kosztów",
    tab3d: "Druk 3D", tabCO2: "Laser CO2", tabFiber: "Laser Fiber", tabEpoxy: "Odlewy żywiczne",
    desc3d: "Bambu Lab H2D — FDM i multi-materiał", descCO2: "xTool P2 55W — grawerowanie i cięcie", descFiber: "Raycus 30W — metal, biżuteria, kamień, ceramika", descEpoxy: "Żywica UV/dwukomponentowa — odlewy artystyczne",
    note: 'Kalkulacje są szacunkowe. Rzeczywista cena zależy od geometrii, złożoności i specyfikacji. Opcje "niestandardowe" wymagają indywidualnej wyceny.',
    vat: "Podane ceny są orientacyjne i nie zawierają stosownych podatków VAT czy ich odpowiedników, które należy doliczyć przy finalizacji zamówienia." },
  en: { tag: "Project Calculators", title: "Cost Estimator",
    tab3d: "3D Print", tabCO2: "CO2 Laser", tabFiber: "Fiber Laser", tabEpoxy: "Resin Casting",
    desc3d: "Bambu Lab H2D — FDM & multi-material", descCO2: "xTool P2 55W — engraving & cutting", descFiber: "Raycus 30W — metal, jewelry, stone & ceramics", descEpoxy: "UV/2K resin — artistic casting",
    note: "Estimates are approximate. Actual price depends on geometry, complexity, and specifications. Custom options require an individual quote.",
    vat: "Prices shown are indicative and do not include applicable VAT or equivalent taxes, which will be added upon order finalization." },
  de: { tag: "Projektkalkulatoren", title: "Kostenschätzer",
    tab3d: "3D-Druck", tabCO2: "CO2-Laser", tabFiber: "Faserlaser", tabEpoxy: "Harzguss",
    desc3d: "Bambu Lab H2D — FDM & Multi-Material", descCO2: "xTool P2 55W — Gravur & Schnitt", descFiber: "Raycus 30W — Metall, Schmuck, Stein & Keramik", descEpoxy: "UV/2K-Harz — Kunstguss",
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

        {/* Technology tiles */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {TECHS.map(({ id, labelKey, descKey, img }) => {
            const active = activeTech === id;
            return (
              <button key={id}
                onClick={() => { setActiveTech(id); trackCalc("studio", "tech_tab", id); }}
                className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[140px] ${
                  active ? "border-blue-400 shadow-lg shadow-blue-400/20" : "border-white/10 hover:border-white/30"
                }`}>
                {img && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img src={img} alt="" loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-500 ${active ? "scale-105" : "group-hover:scale-105"}`} />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
                    {active && <div className="absolute inset-0 bg-blue-400/10 mix-blend-overlay" />}
                  </div>
                )}
                <div className="relative p-3 h-full min-h-[140px] flex flex-col justify-end">
                  <div className={`text-xs sm:text-sm font-bold mb-1 drop-shadow-lg ${active ? "text-blue-300" : "text-white"}`}>{l[labelKey]}</div>
                  <div className="text-[10px] text-neutral-300 break-words drop-shadow-md">{l[descKey]}</div>
                </div>
              </button>
            );
          })}
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
