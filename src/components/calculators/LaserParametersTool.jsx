import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Copy, Check, RotateCcw, ExternalLink } from "lucide-react";
import { InquiryForm } from "./calcShared.jsx";

const API_BASE = import.meta.env.VITE_CHAT_API_URL || "";
const CACHE_KEY = "laser-matrix-v1";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// ── Laser metadata (from Excel Legenda sheet) ──────────────────────────────
const LASER_META = {
  "CO2":          { nm: "10 600 nm", color: "blue",   desc: { pl: "Organika, drewno, akryl, szkło",       en: "Organics, wood, acrylic, glass",          de: "Organik, Holz, Acryl, Glas" } },
  "DIODE":        { nm: "450 nm",    color: "indigo",  desc: { pl: "Ciemne materiały, drewno, skóra",      en: "Dark materials, wood, leather",           de: "Dunkle Materialien, Holz, Leder" } },
  "Fiber Raycus": { nm: "1 064 nm",  color: "orange",  desc: { pl: "Metale przemysłowe (cięcie/znakowanie)", en: "Industrial metals (cut/mark)",           de: "Industriemetalle (Schneiden/Markieren)" } },
  "MOPA":         { nm: "1 064 nm",  color: "amber",   desc: { pl: "Kolorowanie metali, znakowanie precyzyjne", en: "Metal colouring, precision marking",  de: "Metallfärbung, Präzisionsmarkierung" } },
  "GREEN":        { nm: "532 nm",    color: "green",   desc: { pl: "Cu/Ag/Au, kryształy, biżuteria",       en: "Cu/Ag/Au, crystals, jewellery",           de: "Cu/Ag/Au, Kristalle, Schmuck" } },
  "UV":           { nm: "355 nm",    color: "violet",  desc: { pl: "Zimny proces, tworzywa, szkło",        en: "Cold process, plastics, glass",           de: "Kalter Prozess, Kunststoffe, Glas" } },
  "IR (1064nm)":  { nm: "1 064 nm",  color: "red",     desc: { pl: "Znakowanie metali (XY, bez galvo)",    en: "Metal marking (XY, no galvo)",            de: "Metallmarkierung (XY, kein Galvo)" } },
};

const LASER_COLOR_CLASSES = {
  blue:   { bg: "bg-blue-950",   border: "border-blue-700",   text: "text-blue-300",   pill: "bg-blue-900 text-blue-200" },
  indigo: { bg: "bg-indigo-950", border: "border-indigo-700", text: "text-indigo-300", pill: "bg-indigo-900 text-indigo-200" },
  orange: { bg: "bg-orange-950", border: "border-orange-700", text: "text-orange-300", pill: "bg-orange-900 text-orange-200" },
  amber:  { bg: "bg-amber-950",  border: "border-amber-700",  text: "text-amber-300",  pill: "bg-amber-900 text-amber-200" },
  green:  { bg: "bg-green-950",  border: "border-green-700",  text: "text-green-300",  pill: "bg-green-900 text-green-200" },
  violet: { bg: "bg-violet-950", border: "border-violet-700", text: "text-violet-300", pill: "bg-violet-900 text-violet-200" },
  red:    { bg: "bg-red-950",    border: "border-red-700",    text: "text-red-300",    pill: "bg-red-900 text-red-200" },
};

// ── Material categories (keyword-based) ───────────────────────────────────
const MATERIAL_CATEGORIES = [
  { id: "metal",    pl: "Metale",      en: "Metals",       de: "Metalle",      kw: ["stal","alumin","miedź","mosiądz","tytan","złoto","srebro","nikiel","chrom","żelazo","węglik","żeliwo","cynk","pallad","rhodium","cermet","widia","inc"] },
  { id: "wood",     pl: "Drewno",      en: "Wood",         de: "Holz",         kw: ["drewn","sklejk","mdf","hdf","bambus","balsa","fornir","sosna","dąb","brzoz","orzech","klon","wiśnia"] },
  { id: "plastic",  pl: "Tworzywa",    en: "Plastics",     de: "Kunststoffe",  kw: ["akryl","pvc","abs","pc","poliwęglan","polietylen","pp","pe","pa","nylon","pom","delrin","peek","kapton","polim","plastik","tworzy","sintra","eva","pianka","foam","guma","rubber"] },
  { id: "glass",    pl: "Szkło",       en: "Glass",        de: "Glas",         kw: ["szkło","kryształ","kwarc","optyk","ceramik","płytki","porcel","krzemień","szafirow","zerodur","silicon"] },
  { id: "stone",    pl: "Kamień",      en: "Stone",        de: "Stein",        kw: ["kamień","granit","marmur","łupek","beton","cegła","slate","stone","granit"] },
  { id: "textile",  pl: "Tkaniny",     en: "Textiles",     de: "Textilien",    kw: ["skór","tkanin","felt","filc","korek","guma","rubber","tektur","papier","karton"] },
  { id: "other",    pl: "Pozostałe",   en: "Other",        de: "Sonstige",     kw: [] },
];

function categorizeMaterial(name) {
  const lower = name.toLowerCase();
  for (const cat of MATERIAL_CATEGORIES) {
    if (cat.kw.some(k => lower.includes(k))) return cat.id;
  }
  return "other";
}

// ── Translation helper ─────────────────────────────────────────────────────
function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

// ── Unique sorted values ───────────────────────────────────────────────────
function uniq(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
}

// ── Step Progress Bar ──────────────────────────────────────────────────────
function ProgressBar({ step, total, labels }) {
  return (
    <div className="flex items-start gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done   ? "bg-blue-600 text-white" :
                active ? "bg-blue-500 text-white ring-2 ring-blue-400/50 ring-offset-2 ring-offset-neutral-950" :
                         "bg-neutral-800 text-neutral-500"
              }`}>
                {done ? "✓" : n}
              </div>
              {labels && (
                <span className={`hidden sm:block text-xs mt-1 text-center leading-tight max-w-16 ${active ? "text-blue-300" : done ? "text-neutral-400" : "text-neutral-600"}`}>
                  {labels[i]}
                </span>
              )}
            </div>
            {n < total && (
              <div className={`flex-1 h-0.5 mx-1 mt-[15px] ${done ? "bg-blue-600" : "bg-neutral-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Breadcrumb chips showing current selections ────────────────────────────
function SelectionChips({ action, material, laserType, watts, onJump, labels }) {
  const chips = [
    { val: action,    step: 1, label: labels.step1chip },
    { val: material,  step: 2, label: labels.step2chip },
    { val: laserType, step: 3, label: labels.step3chip },
    { val: watts,     step: 4, label: labels.step4chip },
  ].filter(c => c.val);

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {chips.map(c => (
        <button key={c.step} onClick={() => onJump(c.step)}
          className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-full text-sm text-neutral-300 transition-colors">
          <span className="text-neutral-500 text-xs">{c.label}:</span>
          {c.val}
          <span className="text-neutral-500 text-xs ml-0.5">✕</span>
        </button>
      ))}
    </div>
  );
}

// ── Step 1: Action picker ──────────────────────────────────────────────────
// Group similar actions for cleaner UX
const ACTION_GROUPS = [
  { id: "cut",    pl: "Cięcie",        en: "Cutting",     de: "Schneiden",    icon: "✂", kw: ["cięcie","cut"] },
  { id: "engrave",pl: "Grawerowanie",  en: "Engraving",   de: "Gravur",       icon: "🎨", kw: ["grawerowanie","engrave","2.5d","3d","ekstrem","głęboki","matryc"] },
  { id: "mark",   pl: "Znakowanie",    en: "Marking",     de: "Markierung",   icon: "🏷", kw: ["znakowanie","mark","kolorowan"] },
  { id: "clean",  pl: "Czyszczenie",   en: "Cleaning",    de: "Reinigung",    icon: "🧹", kw: ["czyszcze","clean","usuwan","rdza","farb"] },
];

function groupAction(actionType) {
  if (!actionType) return "engrave";
  const lower = actionType.toLowerCase();
  for (const g of ACTION_GROUPS) {
    if (g.kw.some(k => lower.includes(k))) return g.id;
  }
  return "engrave";
}

function ActionPicker({ rows, onPick, lang }) {
  // Count rows per action group
  const counts = useMemo(() => {
    const c = {};
    for (const r of rows) {
      const g = groupAction(r.action_type);
      c[g] = (c[g] || 0) + 1;
    }
    return c;
  }, [rows]);

  // Get all distinct action_type values grouped
  const byGroup = useMemo(() => {
    const m = {};
    for (const r of rows) {
      const g = groupAction(r.action_type);
      if (!m[g]) m[g] = new Set();
      m[g].add(r.action_type);
    }
    return m;
  }, [rows]);

  const [expandedGroup, setExpandedGroup] = useState(null);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTION_GROUPS.filter(g => counts[g.id]).map(g => (
          <button
            key={g.id}
            onClick={() => {
              if (byGroup[g.id]?.size === 1) {
                onPick([...byGroup[g.id]][0]);
              } else {
                setExpandedGroup(expandedGroup === g.id ? null : g.id);
              }
            }}
            className={`w-full p-4 rounded-xl border transition-all text-left ${
              expandedGroup === g.id
                ? "bg-blue-950 border-blue-600 text-white"
                : "bg-neutral-900 border-white/10 hover:border-blue-700/50 hover:bg-neutral-800 text-neutral-200"
            }`}
          >
            <div className="text-2xl mb-2">{g.icon}</div>
            <div className="font-semibold text-sm">{t(g, lang)}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{counts[g.id]} kombinacji</div>
          </button>
        ))}
      </div>
      {/* Sub-action list rendered full-width below the grid */}
      {expandedGroup && byGroup[expandedGroup] && (
        <div className="mt-3 bg-neutral-900 border border-blue-700/50 rounded-xl p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {[...byGroup[expandedGroup]].sort().map(act => (
              <button key={act} onClick={() => onPick(act)}
                className="w-full text-left px-3 py-2.5 text-sm text-neutral-200 hover:bg-blue-950 hover:text-blue-300 rounded-lg transition-colors">
                {act}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Material picker with search + categories ───────────────────────
function MaterialPicker({ materials, onPick, onBack, lang }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  const categorized = useMemo(() => {
    const filtered = materials.filter(m =>
      m.toLowerCase().includes(search.toLowerCase())
    );
    const groups = {};
    for (const m of filtered) {
      const cat = categorizeMaterial(m);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    }
    return groups;
  }, [materials, search]);

  const toggleCat = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Wróć
      </button>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Szukaj materiału..."
        className="w-full max-w-md px-4 py-2.5 bg-neutral-800 border border-white/15 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-600 mb-5"
        autoFocus
      />
      <div className="space-y-2">
        {MATERIAL_CATEGORIES.map(cat => {
          const items = categorized[cat.id];
          if (!items?.length) return null;
          const isOpen = expanded[cat.id] !== false; // default open
          return (
            <div key={cat.id} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-left transition-colors"
              >
                <span className="text-sm font-medium text-neutral-200">{t(cat, lang)}</span>
                <span className="text-xs text-neutral-500">{items.length} materiałów {isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 p-2 bg-neutral-950">
                  {items.map(m => (
                    <button key={m} onClick={() => onPick(m)}
                      className="text-left px-3 py-2 text-sm text-neutral-300 hover:bg-blue-950 hover:text-blue-200 rounded-lg transition-colors border border-transparent hover:border-blue-800/50">
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(categorized).length === 0 && (
        <p className="text-neutral-500 text-sm py-4">Brak materiałów dla "{search}"</p>
      )}
    </div>
  );
}

// ── Step 3: Laser type picker ─────────────────────────────────────────────
function LaserPicker({ availableLasers, onPick, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Wróć
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(LASER_META).map(([id, meta]) => {
          const available = availableLasers.includes(id);
          const cls = LASER_COLOR_CLASSES[meta.color];
          return (
            <button
              key={id}
              disabled={!available}
              onClick={() => available && onPick(id)}
              title={!available ? "Brak danych dla tej kombinacji" : ""}
              className={`p-4 rounded-xl border text-left transition-all ${
                available
                  ? `${cls.bg} ${cls.border} hover:opacity-90 hover:scale-[1.01]`
                  : "bg-neutral-900 border-neutral-800 opacity-30 cursor-not-allowed"
              }`}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono mb-2 ${available ? cls.pill : "bg-neutral-800 text-neutral-600"}`}>
                {meta.nm}
              </div>
              <div className={`font-bold text-sm mb-1 ${available ? cls.text : "text-neutral-600"}`}>{id}</div>
              <div className="text-xs text-neutral-400">{meta.desc.pl}</div>
              {!available && <div className="text-xs text-neutral-600 mt-1 italic">Brak danych dla tej kombinacji</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Wattage picker ────────────────────────────────────────────────
function WattsPicker({ availableWatts, onPick, onBack }) {
  const sorted = useMemo(() => {
    return [...availableWatts].sort((a, b) => {
      const na = parseFloat(a); const nb = parseFloat(b);
      return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
    });
  }, [availableWatts]);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Wróć
      </button>
      <p className="text-xs text-neutral-500 mb-4">Wybierz nominalną moc maksymalną swojego urządzenia. Parametry w tabeli podane są jako % tej mocy.</p>
      <div className="flex flex-wrap gap-3">
        {sorted.map(w => (
          <button key={w} onClick={() => onPick(w)}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-neutral-900 hover:bg-blue-950 border border-white/10 hover:border-blue-600 rounded-xl text-white font-bold text-base sm:text-lg transition-all hover:scale-105">
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Parameter Card ─────────────────────────────────────────────────────────
const PARAM_SECTIONS = [
  {
    id: "power",
    icon: "⚡",
    label: { pl: "Moc i prędkość", en: "Power & speed", de: "Leistung & Geschwindigkeit" },
    fields: [
      { key: "speed",     label: { pl: "Prędkość (mm/s)", en: "Speed (mm/s)", de: "Geschwindigkeit (mm/s)" } },
      { key: "power_pct", label: { pl: "Moc (%)",         en: "Power (%)",    de: "Leistung (%)" } },
      { key: "passes",    label: { pl: "Przejścia",        en: "Passes",       de: "Durchgänge" } },
    ],
  },
  {
    id: "kinematics",
    icon: "📐",
    label: { pl: "Kinematyka", en: "Kinematics", de: "Kinematik" },
    fields: [
      { key: "dpi",            label: { pl: "Rozdzielczość (DPI)", en: "Resolution (DPI)",   de: "Auflösung (DPI)" } },
      { key: "hatch_mm",       label: { pl: "Hatch (mm)",          en: "Hatch (mm)",          de: "Schraffur (mm)" } },
      { key: "scan_angle_deg", label: { pl: "Kąt skanowania (°)",  en: "Scan angle (°)",      de: "Scanwinkel (°)" } },
      { key: "wobble_mm",      label: { pl: "Wobble (mm)",          en: "Wobble (mm)",         de: "Wobble (mm)" } },
      { key: "frequency_khz",  label: { pl: "Częstotliwość (kHz)", en: "Frequency (kHz)",     de: "Frequenz (kHz)" } },
      { key: "pulse_width_ns", label: { pl: "Szerokość impulsu (ns)", en: "Pulse width (ns)", de: "Impulsbreite (ns)" } },
    ],
  },
  {
    id: "optics",
    icon: "🔭",
    label: { pl: "Optyka i oś Z", en: "Optics & Z-axis", de: "Optik & Z-Achse" },
    fields: [
      { key: "optics_lens", label: { pl: "Soczewka",           en: "Lens",             de: "Linse" } },
      { key: "defocus_mm",  label: { pl: "Defokus (mm)",        en: "Defocus (mm)",     de: "Defokus (mm)" } },
      { key: "z_step_mm",   label: { pl: "Krok Z (mm)",         en: "Z-step (mm)",      de: "Z-Schritt (mm)" } },
      { key: "thickness_mm",label: { pl: "Grubość materiału",   en: "Material thickness", de: "Materialstärke" } },
    ],
  },
  {
    id: "gas",
    icon: "💨",
    label: { pl: "Asysta gazowa", en: "Gas assist", de: "Gasunterstützung" },
    fields: [
      { key: "gas_type",     label: { pl: "Rodzaj gazu",    en: "Gas type",    de: "Gasart" } },
      { key: "gas_pressure", label: { pl: "Ciśnienie",      en: "Pressure",    de: "Druck" } },
      { key: "galvo_delays", label: { pl: "Opóźnienia galvo", en: "Galvo delays", de: "Galvo-Verzögerungen" } },
    ],
  },
];

function ParameterCard({ row, lang, onInquiry }) {
  const [copied, setCopied] = useState(false);

  const notesText = (lang === "en" && row.notes_en) || (lang === "de" && row.notes_de) || row.notes;

  const copyText = () => {
    const lines = [
      `Laser: ${row.laser_type} ${row.watts}`,
      `Akcja: ${row.action_type}`,
      `Materiał: ${row.material}`,
      `Kinematyka: ${row.kinematics}`,
      ``,
      `Moc: ${row.power_pct || "—"} %`,
      `Prędkość: ${row.speed || "—"} mm/s`,
      `Przejścia: ${row.passes || "—"}`,
      row.dpi            ? `DPI: ${row.dpi}` : null,
      row.hatch_mm       ? `Hatch: ${row.hatch_mm} mm` : null,
      row.scan_angle_deg ? `Kąt skanowania: ${row.scan_angle_deg}°` : null,
      row.frequency_khz  ? `Częstotliwość: ${row.frequency_khz} kHz` : null,
      row.pulse_width_ns ? `Szerokość impulsu: ${row.pulse_width_ns} ns` : null,
      row.optics_lens    ? `Soczewka: ${row.optics_lens}` : null,
      row.defocus_mm     ? `Defokus: ${row.defocus_mm} mm` : null,
      row.z_step_mm      ? `Krok Z: ${row.z_step_mm} mm` : null,
      row.gas_type       ? `Gaz: ${row.gas_type} @ ${row.gas_pressure || "?"}` : null,
      row.galvo_delays   ? `Opóźnienia: ${row.galvo_delays}` : null,
      notesText          ? `\nUwagi: ${notesText}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const meta = LASER_META[row.laser_type];
  const cls = meta ? LASER_COLOR_CLASSES[meta.color] : LASER_COLOR_CLASSES.blue;

  return (
    <div className={`rounded-2xl border ${cls.border} bg-neutral-950 overflow-hidden animate-fadeIn`}>
      {/* Header */}
      <div className={`px-6 py-4 ${cls.bg} border-b ${cls.border}`}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-lg font-bold ${cls.text}`}>{row.laser_type} {row.watts}</span>
          <span className="text-neutral-400">·</span>
          <span className="text-white font-medium">{row.action_type}</span>
          <span className="text-neutral-400">·</span>
          <span className="text-neutral-300">{row.material}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
          {meta && <span>{meta.nm}</span>}
          <span>Kinematyka: {row.kinematics}</span>
          {row.wavelength_nm && <span>λ = {row.wavelength_nm} nm</span>}
        </div>
      </div>

      {/* Parameter sections */}
      <div className="divide-y divide-white/5">
        {PARAM_SECTIONS.map(sec => {
          const visibleFields = sec.fields.filter(f => row[f.key] && row[f.key] !== "N/A");
          if (!visibleFields.length) return null;
          return (
            <div key={sec.id} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{sec.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t(sec.label, lang)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {visibleFields.map(f => (
                  <div key={f.key}>
                    <div className="text-xs text-neutral-600">{t(f.label, lang)}</div>
                    <div className="text-sm font-mono text-neutral-200">{row[f.key]}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Notes */}
        {notesText && (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">💡</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Uwagi</span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{notesText}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-neutral-900/50 flex flex-wrap gap-2">
        <button onClick={copyText}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-lg text-sm text-neutral-200 transition-colors">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Skopiowano" : "Skopiuj parametry"}
        </button>
        <button onClick={onInquiry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white font-medium transition-colors">
          ✉ Zapytaj o usługę
        </button>
      </div>
    </div>
  );
}

// ── Carousel for multiple matching rows ────────────────────────────────────
function ParameterCardCarousel({ rows, lang }) {
  const [idx, setIdx] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const row = rows[idx];

  const paramsSummary = row
    ? `Laser: ${row.laser_type} ${row.watts} | ${row.material} | ${row.action_type} | ${row.speed || "?"} mm/s @ ${row.power_pct || "?"}%`
    : "";

  return (
    <div className="mt-6">
      {rows.length > 1 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-400">
            Wariant {idx + 1} z {rows.length}
            <span className="ml-2 text-neutral-600 text-xs">
              ({row?.kinematics} · {row?.optics_lens || "—"})
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1 px-1">
              {rows.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-blue-500" : "bg-neutral-700"}`} />
              ))}
            </div>
            <button onClick={() => setIdx(i => Math.min(rows.length - 1, i + 1))} disabled={idx === rows.length - 1}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <ParameterCard row={row} lang={lang} onInquiry={() => setShowInquiry(true)} />
      {showInquiry && (
        <div className="mt-4">
          <InquiryForm
            lang={lang}
            techLabel="LaserParameters"
            paramsSummary={paramsSummary}
            onClose={() => setShowInquiry(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LaserParametersTool({ lang = "pl" }) {
  const [allRows, setAllRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const [step,      setStep]      = useState(1);
  const [action,    setAction]    = useState(null);
  const [material,  setMaterial]  = useState(null);
  const [laserType, setLaserType] = useState(null);
  const [watts,     setWatts]     = useState(null);

  // ── Load data with hybrid localStorage cache ────────────────────────────
  useEffect(() => {
    const fetchFresh = async () => {
      try {
        if (!API_BASE) throw new Error("Brak konfiguracji VITE_CHAT_API_URL");
        const r = await fetch(`${API_BASE}/api/laser-matrix`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error("API niedostępne (deploy w toku)");
        }
        const data = await r.json();
        if (!data?.rows) throw new Error("Pusta odpowiedź z API");
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload: data }));
        setAllRows(data.rows);
        setLoading(false);
        setError(null);
      } catch (e) {
        if (!allRows) { setError(e.message); setLoading(false); }
      }
    };

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached?.payload?.rows && Date.now() - cached.ts < CACHE_TTL) {
        setAllRows(cached.payload.rows);
        setLoading(false);
        fetchFresh(); // background refresh
        return;
      }
    } catch { /* corrupt cache */ }
    fetchFresh();
  }, []);

  // ── Cascading filter options ─────────────────────────────────────────────
  const rows = allRows || [];
  const rowsByAction   = useMemo(() => rows.filter(r => r.action_type === action), [rows, action]);
  const rowsByMaterial = useMemo(() => rowsByAction.filter(r => r.material === material), [rowsByAction, material]);
  const rowsByLaser    = useMemo(() => rowsByMaterial.filter(r => r.laser_type === laserType), [rowsByMaterial, laserType]);

  const availableMaterials = useMemo(() => uniq(rowsByAction.map(r => r.material)), [rowsByAction]);
  const availableLasers    = useMemo(() => uniq(rowsByMaterial.map(r => r.laser_type)), [rowsByMaterial]);
  const availableWatts     = useMemo(() => uniq(rowsByLaser.map(r => r.watts)), [rowsByLaser]);

  const matchedRows = useMemo(() =>
    rowsByLaser.filter(r => r.watts === watts),
    [rowsByLaser, watts]
  );

  // ── Navigation helpers ───────────────────────────────────────────────────
  const jumpToStep = useCallback((s) => {
    if (s <= 1) { setAction(null); setMaterial(null); setLaserType(null); setWatts(null); setStep(1); return; }
    if (s <= 2) { setMaterial(null); setLaserType(null); setWatts(null); setStep(2); return; }
    if (s <= 3) { setLaserType(null); setWatts(null); setStep(3); return; }
    setWatts(null); setStep(4);
  }, []);

  const reset = () => jumpToStep(1);

  const stepLabels = ["Akcja", "Materiał", "Laser", "Moc"];

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Ładowanie bazy parametrów...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4 border border-amber-900/30 bg-amber-950/20 rounded-2xl">
        <div className="text-3xl mb-3">⚙️</div>
        <p className="text-amber-300 text-sm font-medium mb-1">Baza parametrów jest aktualizowana</p>
        <p className="text-neutral-500 text-xs mb-4">Wracamy za chwilę. Spróbuj ponownie za parę minut.</p>
        <button onClick={() => window.location.reload()} className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline">
          Odśwież stronę
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ProgressBar step={step} total={4} labels={stepLabels} />

      <SelectionChips
        action={action}
        material={material}
        laserType={laserType}
        watts={watts}
        onJump={jumpToStep}
        labels={{ step1chip: "Akcja", step2chip: "Materiał", step3chip: "Laser", step4chip: "Moc" }}
      />

      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Co chcesz zrobić?</h3>
          <ActionPicker rows={rows} onPick={a => { setAction(a); setStep(2); }} lang={lang} />
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Jaki materiał?</h3>
          <MaterialPicker
            materials={availableMaterials}
            onPick={m => { setMaterial(m); setStep(3); }}
            onBack={() => jumpToStep(1)}
            lang={lang}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Jaki masz laser?</h3>
          <LaserPicker
            availableLasers={availableLasers}
            onPick={l => { setLaserType(l); setStep(4); }}
            onBack={() => jumpToStep(2)}
          />
        </div>
      )}

      {step === 4 && !watts && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Jaka moc znamionowa?</h3>
          <WattsPicker
            availableWatts={availableWatts}
            onPick={w => setWatts(w)}
            onBack={() => jumpToStep(3)}
          />
        </div>
      )}

      {watts && matchedRows.length > 0 && (
        <ParameterCardCarousel rows={matchedRows} lang={lang} />
      )}

      {watts && matchedRows.length === 0 && (
        <div className="mt-6 text-center py-10 border border-white/10 rounded-xl">
          <p className="text-neutral-400 text-sm">Brak danych dla tej kombinacji.</p>
          <button onClick={reset} className="mt-3 flex items-center gap-2 mx-auto text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <RotateCcw className="w-4 h-4" /> Zacznij od nowa
          </button>
        </div>
      )}

      {watts && (
        <div className="mt-4 flex justify-end">
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            <RotateCcw className="w-3 h-3" /> Nowe wyszukiwanie
          </button>
        </div>
      )}
    </div>
  );
}
