// ============================================================
// MSLA RESIN SETTINGS ADVISOR
// Static reference tool: helps pick a resin for an Elegoo Saturn
// 4 Ultra (16K) style MSLA printer, shows layer height, wash medium,
// post-cure time, hardness and price. No API calls, no pricing quote,
// no community contribution, purely informational + comparison table.
// ============================================================
import { useState, useMemo } from "react";
import { RESIN_SEGMENTS, RESIN_TYPES, RESIN_COLORS } from "../../data/resins.js";
import { t, fmtNum } from "./calcShared.jsx";

const PLN_PER_EUR = 4.28;

// ============================================================
// LABELS
// ============================================================
const LABELS = {
  pl: {
    step1: "Zastosowanie",
    step2: "Wybór żywicy",
    step3: "Parametry",
    step1Title: "Czego potrzebujesz?",
    step1Hint: "Wybierz wymagania ważne dla Twojego projektu, listę można dowolnie zawężać",
    filterAll: "Wszystkie",
    filterFigurines: "Figurki / miniatury",
    filterFunctional: "Części funkcjonalne",
    filterFlexible: "Elementy elastyczne",
    filterTransparent: "Przezierne",
    filterHeat: "Odporne na ciepło",
    filterCastable: "Wzorce odlewnicze / jubilerskie",
    filterMicro: "Mikrodetal",
    filterEco: "Eko / niski zapach",
    filterWaterWash: "Mycie wodą",
    noResults: "Brak żywic dla tego zestawu wymagań",
    showAll: "Pokaż wszystkie żywice",
    step2Title: "Wybierz żywicę",
    estimated: "cena szacunkowa",
    perKg: "/kg",
    colors: "kolorów",
    difficulty: "Trudność",
    washIpa: "IPA",
    washWater: "woda",
    step3Title: "Parametry wybranej żywicy",
    layer: "Wysokość warstwy",
    wash: "Mycie",
    postcure: "Utwardzanie UV (post-cure)",
    hardness: "Twardość",
    density: "Gęstość",
    applications: "Zastosowania",
    tipTitle: "Wskazówki praktyczne",
    tipStandard: "Żywice standardowe: stosuj proste, cienkie wsparcia i umiarkowany kąt nachylenia, druk jest tolerancyjny na błędy kalibracji.",
    tipTechnical: "Żywice techniczne: przeprowadź kalibrację naświetlania (exposure test) dla każdej nowej partii, właściwości mechaniczne mocno zależą od czasu ekspozycji.",
    tipPrecision: "Żywice precyzyjne i odlewnicze: pracuj w rękawiczkach, używaj świeżego IPA i delikatnych, cienkich wsparć, by nie zostawić śladów na mikrodetalu.",
    tableTitle: "Porównanie wszystkich żywic",
    colResin: "Żywica",
    colSegment: "Segment",
    colPrice: "Cena/kg",
    colLayer: "Warstwa (mm)",
    colWash: "Mycie",
    colPostcure: "Post-cure (min)",
    colHardness: "Twardość",
    colDifficulty: "Trudność",
    colApplications: "Zastosowania",
    footnote: "* cena szacunkowa, brak stabilnej oferty rynkowej w momencie aktualizacji danych",
    ctaText: "Policz wycenę wydruku MSLA",
  },
  en: {
    step1: "Application",
    step2: "Resin choice",
    step3: "Parameters",
    step1Title: "What do you need?",
    step1Hint: "Select requirements important for your project, the list narrows as you go",
    filterAll: "All",
    filterFigurines: "Figurines / miniatures",
    filterFunctional: "Functional parts",
    filterFlexible: "Flexible parts",
    filterTransparent: "Transparent",
    filterHeat: "Heat resistant",
    filterCastable: "Casting / jewelry patterns",
    filterMicro: "Micro-detail",
    filterEco: "Eco / low odor",
    filterWaterWash: "Water washable",
    noResults: "No resin matches this set of requirements",
    showAll: "Show all resins",
    step2Title: "Pick a resin",
    estimated: "estimated price",
    perKg: "/kg",
    colors: "colors",
    difficulty: "Difficulty",
    washIpa: "IPA",
    washWater: "water",
    step3Title: "Selected resin parameters",
    layer: "Layer height",
    wash: "Wash",
    postcure: "UV post-cure",
    hardness: "Hardness",
    density: "Density",
    applications: "Applications",
    tipTitle: "Practical tips",
    tipStandard: "Standard resins: use simple, thin supports and a moderate tilt angle, the process tolerates calibration errors well.",
    tipTechnical: "Technical resins: run an exposure calibration test for every new batch, mechanical properties depend heavily on exposure time.",
    tipPrecision: "Precision and castable resins: work with gloves, use fresh IPA and delicate, thin supports to avoid marking the micro-detail.",
    tableTitle: "Comparison of all resins",
    colResin: "Resin",
    colSegment: "Segment",
    colPrice: "Price/kg",
    colLayer: "Layer (mm)",
    colWash: "Wash",
    colPostcure: "Post-cure (min)",
    colHardness: "Hardness",
    colDifficulty: "Difficulty",
    colApplications: "Applications",
    footnote: "* estimated price, no stable market offer at the time of data update",
    ctaText: "Get an MSLA print quote",
  },
  de: {
    step1: "Anwendung",
    step2: "Harzwahl",
    step3: "Parameter",
    step1Title: "Was brauchen Sie?",
    step1Hint: "Wählen Sie die für Ihr Projekt wichtigen Anforderungen, die Liste wird dadurch enger",
    filterAll: "Alle",
    filterFigurines: "Figuren / Miniaturen",
    filterFunctional: "Funktionale Teile",
    filterFlexible: "Flexible Teile",
    filterTransparent: "Transparent",
    filterHeat: "Hitzebeständig",
    filterCastable: "Guss- / Schmuckmodelle",
    filterMicro: "Mikrodetail",
    filterEco: "Öko / geruchsarm",
    filterWaterWash: "Wasserwaschbar",
    noResults: "Kein Harz erfüllt diese Anforderungen",
    showAll: "Alle Harze anzeigen",
    step2Title: "Harz wählen",
    estimated: "Richtpreis",
    perKg: "/kg",
    colors: "Farben",
    difficulty: "Schwierigkeit",
    washIpa: "IPA",
    washWater: "Wasser",
    step3Title: "Parameter des gewählten Harzes",
    layer: "Schichthöhe",
    wash: "Reinigung",
    postcure: "UV-Nachhärtung",
    hardness: "Härte",
    density: "Dichte",
    applications: "Anwendungen",
    tipTitle: "Praktische Hinweise",
    tipStandard: "Standardharze: einfache, dünne Stützen und moderater Neigungswinkel, der Prozess verzeiht Kalibrierfehler gut.",
    tipTechnical: "Technische Harze: bei jeder neuen Charge einen Belichtungstest durchführen, die mechanischen Eigenschaften hängen stark von der Belichtungszeit ab.",
    tipPrecision: "Präzisions- und Gussharze: mit Handschuhen arbeiten, frisches IPA und filigrane, dünne Stützen verwenden, um das Mikrodetail nicht zu beschädigen.",
    tableTitle: "Vergleich aller Harze",
    colResin: "Harz",
    colSegment: "Segment",
    colPrice: "Preis/kg",
    colLayer: "Schicht (mm)",
    colWash: "Reinigung",
    colPostcure: "Nachhärtung (min)",
    colHardness: "Härte",
    colDifficulty: "Schwierigkeit",
    colApplications: "Anwendungen",
    footnote: "* Richtpreis, kein stabiles Marktangebot zum Zeitpunkt der Datenaktualisierung",
    ctaText: "MSLA-Druckangebot berechnen",
  },
};

// ============================================================
// APPLICATION FILTERS
// ============================================================
const FILTERS = [
  { id: "figurines", labelKey: "filterFigurines", match: r => ["standard", "water_washable", "plant_based", "high_precision"].includes(r.id) },
  { id: "functional", labelKey: "filterFunctional", match: r => ["abs_like", "tough", "fast"].includes(r.id) },
  { id: "flexible", labelKey: "filterFlexible", match: r => r.id === "flexible" },
  { id: "transparent", labelKey: "filterTransparent", match: r => r.id === "clear" },
  { id: "heat", labelKey: "filterHeat", match: r => r.id === "heat_resistant" },
  { id: "castable", labelKey: "filterCastable", match: r => r.segment === "precision" && r.id.startsWith("castable") },
  { id: "micro", labelKey: "filterMicro", match: r => r.id === "high_precision" },
  { id: "eco", labelKey: "filterEco", match: r => r.id === "plant_based" },
  { id: "waterWash", labelKey: "filterWaterWash", match: r => r.wash === "water" },
];

const SEGMENT_ORDER = ["standard", "technical", "precision"];

// ============================================================
// PRICE FORMATTING (pl -> PLN primary, en/de -> EUR primary)
// ============================================================
function formatPrice(pricePLN, lang) {
  const showEur = lang !== "pl";
  const eur = Math.round(pricePLN / PLN_PER_EUR);
  const primary = showEur ? `~${fmtNum(eur)} EUR/kg` : `~${fmtNum(pricePLN)} zł/kg`;
  const secondary = showEur ? `~${fmtNum(pricePLN)} zł/kg` : `~${fmtNum(eur)} EUR/kg`;
  return { primary, secondary };
}

// ============================================================
// SMALL UI PIECES
// ============================================================
function DifficultyDots({ level }) {
  const lvl = level || 1;
  const color = lvl === 1 ? "bg-green-400" : lvl === 2 ? "bg-amber-400" : "bg-red-400";
  return (
    <span className="flex gap-0.5 items-center">
      {[1, 2, 3].map(i => (
        <span key={i} className={`w-2 h-2 rounded-full ${i <= lvl ? color : "bg-white/10"}`} />
      ))}
    </span>
  );
}

function WashBadge({ wash, L }) {
  const isWater = wash === "water";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isWater ? "bg-cyan-500/20 text-cyan-300" : "bg-purple-500/20 text-purple-300"}`}>
      {isWater ? L.washWater : L.washIpa}
    </span>
  );
}

function ColorableBadge({ colorable, L }) {
  if (!colorable) return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300">
      {RESIN_COLORS.length} {L.colors}
    </span>
  );
}

// ============================================================
// STEP 1 - APPLICATION FILTER CHIPS
// ============================================================
function Step1Filters({ selected, onToggle, onReset, L }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-1">{L.step1Title}</h3>
      <p className="text-xs text-neutral-400 mb-4">{L.step1Hint}</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onReset}
          className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
            selected.size === 0
              ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium"
              : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
          }`}
        >
          {L.filterAll}
        </button>
        {FILTERS.map(f => {
          const active = selected.has(f.id);
          return (
            <button
              key={f.id}
              onClick={() => onToggle(f.id)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                active
                  ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}
            >
              {L[f.labelKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// STEP 2 - RESIN CARDS GROUPED BY SEGMENT
// ============================================================
function ResinCard({ resin, active, onSelect, lang, L }) {
  const price = formatPrice(resin.price_kg, lang);
  return (
    <button
      onClick={() => onSelect(resin.id)}
      className={`text-left rounded-xl border p-3 transition-all duration-200 ${
        active
          ? "border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className="font-semibold text-white text-sm mb-1">{t(resin.label, lang)}</div>
      <div className="mb-1.5">
        <div className={`text-sm font-medium ${active ? "text-blue-300" : "text-neutral-200"}`}>{price.primary}</div>
        <div className="text-[10px] text-neutral-500">{price.secondary}{resin.estimated ? ` · ${L.estimated}` : ""}</div>
      </div>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <DifficultyDots level={resin.difficulty} />
        <WashBadge wash={resin.wash} L={L} />
        <ColorableBadge colorable={resin.colorable} L={L} />
      </div>
    </button>
  );
}

function SegmentSection({ segmentKey, resins, lang, selectedId, onSelect }) {
  const segment = RESIN_SEGMENTS[segmentKey];
  if (!resins.length) return null;
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1">
        {t(segment.label, lang)} <span className="text-neutral-600">({resins.length})</span>
      </div>
      <div className="text-[11px] text-neutral-500 mb-2">{t(segment.desc, lang)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {resins.map(r => (
          <ResinCard key={r.id} resin={r} active={selectedId === r.id} onSelect={onSelect} lang={lang} L={LABELS[lang] || LABELS.pl} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STEP 3 - PARAMETER PANEL
// ============================================================
function ParamRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-t border-white/5 first:border-t-0">
      <span className="text-neutral-400 text-xs">{label}</span>
      <span className="text-white text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function ParameterPanel({ resin, lang, L }) {
  const price = formatPrice(resin.price_kg, lang);
  const tip = resin.segment === "standard" ? L.tipStandard : resin.segment === "technical" ? L.tipTechnical : L.tipPrecision;
  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-base font-bold text-white">{t(resin.label, lang)}</h4>
        <div className="text-right">
          <div className="text-blue-300 font-semibold text-sm">{price.primary}{resin.estimated ? " *" : ""}</div>
          <div className="text-[10px] text-neutral-500">{price.secondary}</div>
        </div>
      </div>
      <p className="text-neutral-300 text-sm leading-relaxed mb-4">{t(resin.desc, lang)}</p>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 mb-4">
        <ParamRow label={L.layer} value={`${resin.layer_min}–${resin.layer_max} mm`} />
        <ParamRow label={L.wash} value={resin.wash === "water" ? L.washWater : L.washIpa} />
        <ParamRow label={L.postcure} value={`~${resin.postcure_min} min`} />
        <ParamRow label={L.hardness} value={resin.hardness} />
        <ParamRow label={L.density} value={`${resin.density} g/cm³`} />
        <ParamRow label={L.applications} value={t(resin.applications, lang)} />
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-400/15 bg-blue-400/[0.04] text-xs leading-relaxed text-neutral-300">
        <span className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true">ⓘ</span>
        <span>{tip}</span>
      </div>
    </div>
  );
}

// ============================================================
// COMPARISON TABLE
// ============================================================
function ComparisonTable({ lang, L }) {
  return (
    <div className="mt-2">
      <h3 className="text-lg font-bold text-white mb-3">{L.tableTitle}</h3>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-white/[0.03] text-neutral-400 uppercase tracking-wide text-[10px]">
              <th className="text-left px-3 py-2.5 font-semibold">{L.colResin}</th>
              <th className="text-left px-3 py-2.5 font-semibold">{L.colSegment}</th>
              <th className="text-right px-3 py-2.5 font-semibold">{L.colPrice}</th>
              <th className="text-right px-3 py-2.5 font-semibold">{L.colLayer}</th>
              <th className="text-left px-3 py-2.5 font-semibold">{L.colWash}</th>
              <th className="text-right px-3 py-2.5 font-semibold">{L.colPostcure}</th>
              <th className="text-left px-3 py-2.5 font-semibold">{L.colHardness}</th>
              <th className="text-left px-3 py-2.5 font-semibold">{L.colDifficulty}</th>
              <th className="text-left px-3 py-2.5 font-semibold">{L.colApplications}</th>
            </tr>
          </thead>
          <tbody>
            {RESIN_TYPES.map((r, i) => {
              const price = formatPrice(r.price_kg, lang);
              return (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white/[0.01]" : ""}>
                  <td className="px-3 py-2.5 text-neutral-100 font-medium whitespace-nowrap">{t(r.label, lang)}</td>
                  <td className="px-3 py-2.5 text-neutral-400 whitespace-nowrap">{t(RESIN_SEGMENTS[r.segment].label, lang)}</td>
                  <td className="px-3 py-2.5 text-neutral-200 text-right whitespace-nowrap">{price.primary}{r.estimated ? "*" : ""}</td>
                  <td className="px-3 py-2.5 text-neutral-400 text-right whitespace-nowrap">{r.layer_min}–{r.layer_max}</td>
                  <td className="px-3 py-2.5 text-neutral-400 whitespace-nowrap">{r.wash === "water" ? L.washWater : L.washIpa}</td>
                  <td className="px-3 py-2.5 text-neutral-400 text-right whitespace-nowrap">{r.postcure_min}</td>
                  <td className="px-3 py-2.5 text-neutral-400 whitespace-nowrap">{r.hardness}</td>
                  <td className="px-3 py-2.5"><DifficultyDots level={r.difficulty} /></td>
                  <td className="px-3 py-2.5 text-neutral-400 min-w-[180px]">{t(r.applications, lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-neutral-500 italic mt-2">{L.footnote}</div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ResinSettingsCalc({ lang = "pl" }) {
  const L = LABELS[lang] || LABELS.pl;
  const [selectedFilters, setSelectedFilters] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);

  const filteredTypes = useMemo(() => {
    if (selectedFilters.size === 0) return RESIN_TYPES;
    return RESIN_TYPES.filter(r =>
      FILTERS.every(f => !selectedFilters.has(f.id) || f.match(r))
    );
  }, [selectedFilters]);

  const grouped = useMemo(() => {
    const g = { standard: [], technical: [], precision: [] };
    filteredTypes.forEach(r => { if (g[r.segment]) g[r.segment].push(r); });
    return g;
  }, [filteredTypes]);

  const selectedResin = selectedId ? RESIN_TYPES.find(r => r.id === selectedId) : null;

  function toggleFilter(id) {
    setSelectedFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setSelectedFilters(new Set());
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900/40 overflow-hidden">
      <div className="p-5">
        <Step1Filters selected={selectedFilters} onToggle={toggleFilter} onReset={resetFilters} L={L} />
      </div>

      <div className="border-t border-white/5 p-5">
        <h3 className="text-lg font-bold text-white mb-3">{L.step2Title}</h3>
        {filteredTypes.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <div className="text-neutral-400 text-sm mb-3">{L.noResults}</div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-300 text-sm hover:bg-blue-400/20 transition-colors"
            >
              {L.showAll}
            </button>
          </div>
        ) : (
          SEGMENT_ORDER.map(seg => (
            <SegmentSection
              key={seg}
              segmentKey={seg}
              resins={grouped[seg]}
              lang={lang}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ))
        )}
      </div>

      {selectedResin && (
        <div className="border-t border-white/5 p-5 bg-white/[0.015]">
          <ParameterPanel resin={selectedResin} lang={lang} L={L} />
        </div>
      )}

      <div className="border-t border-white/5 p-5">
        <ComparisonTable lang={lang} L={L} />
      </div>

      <div className="border-t border-white/5 p-5 text-center">
        <a
          href="/studio/#calculator"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
        >
          {L.ctaText}
        </a>
      </div>
    </div>
  );
}
