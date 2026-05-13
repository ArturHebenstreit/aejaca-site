import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

// ============================================================
// MATERIALS DATA
// ============================================================
const MATERIALS = [
  // STANDARD
  { id:"pla",     name:"PLA",        category:"standard",    nozzle:[190,220], bed:[20,60],   speed:[40,80],  layer:[0.1,0.3],  cooling:100, retraction:[3,6],  enclosure:"no",          difficulty:1, density:1.24, tempRes:55,  pricePerKg:70,
    props:["easy","rigid","biodegradable","low-warp"],
    uses:{ pl:"Modele dekoracyjne, prototypy, figurki, breloki", en:"Decorative models, prototypes, figurines, keychains", de:"Dekorationsmodelle, Prototypen, Figuren, Schlüsselanhänger" },
    notes:{ pl:"Najłatwiejszy w druku. Niska odporność na temp. — nie do zastosowań zewnętrznych ani w samochodzie.", en:"Easiest to print. Low heat resistance — not for outdoor or car use.", de:"Einfachstes Material. Geringe Wärmebeständigkeit." } },

  { id:"plaSilk", name:"PLA Silk",   category:"standard",    nozzle:[210,230], bed:[25,60],   speed:[30,60],  layer:[0.1,0.25], cooling:100, retraction:[4,7],  enclosure:"no",          difficulty:2, density:1.24, tempRes:52,  pricePerKg:90,
    props:["shiny","rigid","decorative","low-warp"],
    uses:{ pl:"Ozdoby, biżuteria, trofea, figurki kolekcjonerskie", en:"Decorations, jewelry, trophies, collectibles", de:"Dekorationen, Schmuck, Trophäen" },
    notes:{ pl:"Efekt jedwabistego połysku. Wyższa temp. niż PLA standard. Słabe mostki.", en:"Silky shine effect. Higher temp than standard PLA. Poor bridging.", de:"Seidiger Glanzeffekt. Höhere Temp. als Standard-PLA." } },

  { id:"petg",    name:"PETG",       category:"standard",    nozzle:[230,250], bed:[70,90],   speed:[30,60],  layer:[0.1,0.3],  cooling:50,  retraction:[3,6],  enclosure:"recommended", difficulty:2, density:1.27, tempRes:80,  pricePerKg:80,
    props:["durable","water-resistant","uv-resistant","food-safe"],
    uses:{ pl:"Części mechaniczne, pojemniki, elementy zewnętrzne", en:"Mechanical parts, containers, outdoor parts", de:"Mechanische Teile, Behälter, Außenteile" },
    notes:{ pl:"Świetna alternatywa dla ABS — brak warpage. Bardzo dobra adhezja warstw.", en:"Great ABS alternative — no warping. Excellent layer adhesion.", de:"Gute ABS-Alternative — kein Warping." } },

  { id:"petgCF",  name:"PETG-CF",    category:"standard",    nozzle:[240,260], bed:[70,90],   speed:[30,50],  layer:[0.1,0.25], cooling:50,  retraction:[2,5],  enclosure:"recommended", difficulty:3, density:1.30, tempRes:85,  pricePerKg:160,
    props:["stiff","lightweight","water-resistant","carbon-fiber"],
    uses:{ pl:"Lekkie obudowy, wsporniki, drony", en:"Lightweight housings, brackets, drones", de:"Leichte Gehäuse, Halterungen, Drohnen" },
    notes:{ pl:"Wymaga hardened nozzle (stal hartowana). Bardzo sztywny i lekki.", en:"Requires hardened nozzle. Very stiff and light.", de:"Gehärtete Düse erforderlich. Sehr steif und leicht." } },

  { id:"tpu",     name:"TPU 95A",    category:"standard",    nozzle:[220,240], bed:[30,60],   speed:[15,35],  layer:[0.1,0.3],  cooling:80,  retraction:[0,2],  enclosure:"no",          difficulty:3, density:1.21, tempRes:80,  pricePerKg:100,
    props:["flexible","rubber-like","abrasion-resistant","shock-absorbing"],
    uses:{ pl:"Uszczelki, etui, podeszwy, amortyzatory", en:"Gaskets, phone cases, soles, shock absorbers", de:"Dichtungen, Handyhüllen, Sohlen, Stoßdämpfer" },
    notes:{ pl:"Bardzo wolna prędkość. Minimalna retrakcja. Direct drive zalecany — Bowden problematyczny.", en:"Very slow speed. Minimal retraction. Direct drive recommended.", de:"Sehr langsam. Minimale Retraktion. Direktantrieb empfohlen." } },

  { id:"asa",     name:"ASA",        category:"standard",    nozzle:[240,260], bed:[90,110],  speed:[30,60],  layer:[0.1,0.3],  cooling:20,  retraction:[3,6],  enclosure:"required",    difficulty:4, density:1.07, tempRes:100, pricePerKg:100,
    props:["uv-resistant","weather-resistant","rigid","outdoor"],
    uses:{ pl:"Elementy zewnętrzne, części samochodowe, znaki", en:"Outdoor parts, car components, signs", de:"Außenteile, Fahrzeugteile, Schilder" },
    notes:{ pl:"Konieczna zamknięta obudowa. Odporny na UV i warunki atmosferyczne. Opary — wentylacja wymagana.", en:"Enclosed chamber required. UV resistant. Fumes — ventilation mandatory.", de:"Geschlossenes Gehäuse erforderlich. UV-beständig. Belüftung obligatorisch." } },

  { id:"abs",     name:"ABS",        category:"standard",    nozzle:[230,250], bed:[100,120], speed:[30,60],  layer:[0.1,0.3],  cooling:0,   retraction:[3,6],  enclosure:"required",    difficulty:4, density:1.04, tempRes:100, pricePerKg:80,
    props:["rigid","impact-resistant","acetone-smoothable","paintable"],
    uses:{ pl:"Części techniczne, obudowy elektroniki, elementy do wygładzania acetonem", en:"Technical parts, electronics housings, acetone-smoothable parts", de:"Technische Teile, Elektronikgehäuse, Acetonglättung" },
    notes:{ pl:"Silny warpage bez obudowy. Opary szkodliwe — wentylacja. Wygładzanie acetonem.", en:"Heavy warping without enclosure. Harmful fumes. Acetone smoothing possible.", de:"Starkes Warping ohne Gehäuse. Schädliche Dämpfe. Acetonglättung möglich." } },

  { id:"pva",     name:"PVA",        category:"standard",    nozzle:[185,200], bed:[35,60],   speed:[20,40],  layer:[0.1,0.2],  cooling:100, retraction:[3,6],  enclosure:"no",          difficulty:3, density:1.19, tempRes:50,  pricePerKg:200,
    props:["water-soluble","support-material","biodegradable"],
    uses:{ pl:"Materiał podporowy do rozpuszczania w wodzie", en:"Water-soluble support material", de:"Wasserlösliches Stützmaterial" },
    notes:{ pl:"Wyłącznie jako support. Bardzo higroskopijny — przechowywać szczelnie.", en:"Support material only. Very hygroscopic — store airtight.", de:"Nur Stützmaterial. Sehr hygroskopisch — luftdicht lagern." } },

  // ENGINEERING
  { id:"pa6cf",   name:"PA6-CF",     category:"engineering", nozzle:[260,280], bed:[70,90],   speed:[20,40],  layer:[0.1,0.2],  cooling:20,  retraction:[1,3],  enclosure:"required",    difficulty:5, density:1.14, tempRes:170, pricePerKg:280,
    props:["very-stiff","lightweight","high-strength","carbon-fiber","low-creep"],
    uses:{ pl:"Protezy, części lotnicze, drony wyścigowe, CNC", en:"Prosthetics, aerospace, racing drones, CNC", de:"Prothesen, Luft- und Raumfahrt, Renndrohnen, CNC" },
    notes:{ pl:"Hardened nozzle obowiązkowa. Suszyć 70°C/4h przed drukiem. Bardzo niskie pełzanie.", en:"Hardened nozzle mandatory. Dry at 70°C/4h before printing. Very low creep.", de:"Gehärtete Düse obligatorisch. 70°C/4h vor dem Druck trocknen." } },

  { id:"pa12cf",  name:"PA12-CF",    category:"engineering", nozzle:[255,275], bed:[70,90],   speed:[20,40],  layer:[0.1,0.2],  cooling:20,  retraction:[1,3],  enclosure:"required",    difficulty:5, density:1.02, tempRes:150, pricePerKg:320,
    props:["stiff","lightweight","good-surface","carbon-fiber"],
    uses:{ pl:"Lekkie obudowy, komponenty UAV, wsporniki strukturalne", en:"Lightweight housings, UAV components, structural brackets", de:"Leichte Gehäuse, UAV-Komponenten, Strukturhalterungen" },
    notes:{ pl:"Mniejsza absorpcja wilgoci niż PA6. Lepsza powierzchnia niż PA6-CF. Hardened nozzle.", en:"Less moisture absorption than PA6. Better surface than PA6-CF. Hardened nozzle.", de:"Geringere Feuchtigkeitsaufnahme als PA6. Bessere Oberfläche." } },

  { id:"pc",      name:"PC",         category:"engineering", nozzle:[270,300], bed:[100,120], speed:[20,40],  layer:[0.1,0.25], cooling:0,   retraction:[2,5],  enclosure:"required",    difficulty:5, density:1.20, tempRes:130, pricePerKg:180,
    props:["impact-resistant","optical","high-temp","transparent-possible"],
    uses:{ pl:"Soczewki, osłony maszyn, elementy optyczne", en:"Lenses, machine guards, optical parts", de:"Linsen, Maschinenschutzabdeckungen, optische Teile" },
    notes:{ pl:"Bardzo podatny na warpage. Łoże min. 110°C. Wymaga high-end drukarki.", en:"Very prone to warping. Bed min 110°C. High-end printer required.", de:"Sehr warpanfällig. Bett min. 110°C. High-End-Drucker erforderlich." } },

  { id:"pcabs",   name:"PC-ABS",     category:"engineering", nozzle:[250,270], bed:[100,110], speed:[25,50],  layer:[0.1,0.25], cooling:10,  retraction:[3,5],  enclosure:"required",    difficulty:4, density:1.12, tempRes:115, pricePerKg:150,
    props:["impact-resistant","high-temp","rigid"],
    uses:{ pl:"Obudowy elektroniki przemysłowej, części samochodowe, narzędzia", en:"Industrial electronics housings, automotive parts, tools", de:"Industrieelektronikgehäuse, Automobilteile, Werkzeuge" },
    notes:{ pl:"Lepsze właściwości niż ABS, mniejszy warpage niż PC. Dobry kompromis.", en:"Better than ABS, less warping than PC. Good compromise.", de:"Besser als ABS, weniger Warping als PC." } },

  { id:"petCF",   name:"PET-CF",     category:"engineering", nozzle:[250,270], bed:[70,85],   speed:[25,45],  layer:[0.1,0.25], cooling:30,  retraction:[2,4],  enclosure:"recommended", difficulty:4, density:1.35, tempRes:110, pricePerKg:240,
    props:["stiff","chemical-resistant","carbon-fiber","dimensional-stable"],
    uses:{ pl:"Części narażone na chemikalia, elementy przemysłowe", en:"Chemically exposed parts, industrial components", de:"Chemisch belastete Teile, Industriekomponenten" },
    notes:{ pl:"Lepsza odporność chemiczna niż PETG-CF. Hardened nozzle wymagana.", en:"Better chemical resistance than PETG-CF. Hardened nozzle required.", de:"Bessere Chemikalienbeständigkeit als PETG-CF. Gehärtete Düse erforderlich." } },

  { id:"ppacf",   name:"PPA-CF",     category:"engineering", nozzle:[280,310], bed:[100,120], speed:[15,30],  layer:[0.1,0.2],  cooling:10,  retraction:[1,3],  enclosure:"required",    difficulty:5, density:1.15, tempRes:200, pricePerKg:500,
    props:["very-high-temp","chemical-resistant","carbon-fiber","aerospace"],
    uses:{ pl:"Aplikacje lotnicze, mocowania silnikowe, przemysł", en:"Aerospace, engine mounts, industrial", de:"Luft- und Raumfahrt, Motorhalterungen, Industrie" },
    notes:{ pl:"Praca do 200°C. Wymaga hotend 350°C. Hardened nozzle obowiązkowa.", en:"Up to 200°C service temp. Requires 350°C hotend. Hardened nozzle mandatory.", de:"Bis 200°C. 350°C Hotend erforderlich. Gehärtete Düse obligatorisch." } },

  { id:"pps",     name:"PPS/PPS-CF", category:"engineering", nozzle:[300,340], bed:[120,150], speed:[10,25],  layer:[0.08,0.2], cooling:0,   retraction:[1,2],  enclosure:"required",    difficulty:5, density:1.35, tempRes:220, pricePerKg:600,
    props:["ultra-high-temp","flame-retardant","chemical-resistant","low-creep"],
    uses:{ pl:"Przemysł chemiczny, elektronika wysokotemperaturowa, lotnictwo", en:"Chemical industry, high-temp electronics, aviation", de:"Chemieindustrie, Hochtemperaturelektronik, Luftfahrt" },
    notes:{ pl:"Jeden z najtrudniejszych materiałów. Do 220°C. Niepalny (UL94-V0). Wymaga specjalistycznej drukarki.", en:"One of the hardest to print. Up to 220°C. Flame retardant (UL94-V0). Specialist printer required.", de:"Eines der schwierigsten Materialien. Bis 220°C. Flammhemmend (UL94-V0)." } },
];

// ============================================================
// REQUIREMENT FILTERS
// ============================================================
const REQUIREMENTS = [
  { id: "easy",      label: { pl: "Łatwy w druku",                         en: "Easy to print",              de: "Einfach zu drucken"         }, match: m => m.difficulty <= 2 },
  { id: "flexible",  label: { pl: "Elastyczny/gumowy",                     en: "Flexible/rubber-like",       de: "Flexibel/gummiartig"        }, match: m => m.props.includes("flexible") || m.props.includes("rubber-like") },
  { id: "highTemp",  label: { pl: "Odporność na temp. >100°C",             en: "Temp. resistance >100°C",    de: "Wärmebeständig >100°C"      }, match: m => m.tempRes >= 100 },
  { id: "outdoor",   label: { pl: "Zastosowania zewnętrzne/UV",            en: "Outdoor/UV resistant",       de: "Außen/UV-beständig"         }, match: m => m.props.includes("uv-resistant") || m.props.includes("weather-resistant") || m.props.includes("outdoor") },
  { id: "strong",    label: { pl: "Wysoka wytrzymałość/CF",                en: "High strength/CF",           de: "Hochfest/CF"                }, match: m => m.props.includes("high-strength") || m.props.includes("very-stiff") || m.props.includes("carbon-fiber") },
  { id: "chemical",  label: { pl: "Odporność chemiczna",                   en: "Chemical resistance",        de: "Chemikalienbeständig"       }, match: m => m.props.includes("chemical-resistant") },
  { id: "decorative",label: { pl: "Dekoracyjny/błyszczący",                en: "Decorative/shiny",           de: "Dekorativ/glänzend"         }, match: m => m.props.includes("shiny") || m.props.includes("decorative") },
  { id: "support",   label: { pl: "Materiał podporowy (rozpuszczalny)",    en: "Soluble support material",   de: "Lösliches Stützmaterial"    }, match: m => m.props.includes("support-material") },
  { id: "foodSafe",  label: { pl: "Kontakt z żywnością",                   en: "Food-safe",                  de: "Lebensmittelecht"           }, match: m => m.props.includes("food-safe") },
];

// ============================================================
// LABELS
// ============================================================
const LABELS = {
  pl: {
    tab1: "Dobieracz materiału",
    tab2: "Parametry druku",
    tab3: "Kalkulator filamentu",
    reqTitle: "Wymagania (multiselect):",
    reqAll: "Brak wyboru = pokaż wszystkie",
    resultsTitle: "Dopasowane materiały",
    noMatch: "Brak materiałów spełniających wszystkie wymagania. Spróbuj mniej filtrów.",
    seeParams: "Zobacz parametry →",
    diffLabel: "Trudność",
    tempResLabel: "Maks. temp. pracy",
    standardLabel: "Standardowe",
    engineeringLabel: "Inżynieryjne",
    paramNozzle: "Dysza",
    paramBed: "Łoże",
    paramSpeed: "Prędkość",
    paramLayer: "Wysokość warstwy",
    paramCooling: "Chłodzenie",
    paramRetraction: "Retrakcja",
    paramEnclosure: "Obudowa",
    paramDifficulty: "Trudność",
    paramTempRes: "Odp. na temp.",
    paramPrice: "Cena orientacyjna",
    paramUses: "Zastosowania",
    paramNotes: "Uwagi",
    encNo: "Nie wymagana",
    encRec: "Zalecana",
    encReq: "Wymagana",
    ctaText: "Zamawiaj wydruki z tego materiału →",
    calcTitle: "Kalkulator filamentu",
    calcSelectMat: "Wybierz materiał:",
    calcInputMode: "Tryb wprowadzania:",
    calcModeVol: "Objętość modelu (cm³)",
    calcModeDim: "Wymiary (L×W×H)",
    calcVolLabel: "Objętość modelu",
    calcVolUnit: "cm³",
    calcLengthLabel: "Długość",
    calcWidthLabel: "Szerokość",
    calcHeightLabel: "Wysokość",
    calcInfillLabel: "Wypełnienie",
    calcResultTitle: "Wynik kalkulacji",
    calcMass: "Szacowana masa",
    calcCost: "Koszt materiału",
    calcRoll: "Udział rolki 1 kg",
    calcNote: "Waga szacunkowa. Rzeczywiste zużycie zależy od slicera, supportów i wypełnienia.",
    calcSelectFirst: "Wybierz materiał aby zobaczyć wynik.",
    calcCTA: "Wycena druku 3D w sTuDiO →",
  },
  en: {
    tab1: "Material Advisor",
    tab2: "Print Parameters",
    tab3: "Filament Calculator",
    reqTitle: "Requirements (multiselect):",
    reqAll: "No selection = show all",
    resultsTitle: "Matching materials",
    noMatch: "No materials match all requirements. Try fewer filters.",
    seeParams: "See parameters →",
    diffLabel: "Difficulty",
    tempResLabel: "Max service temp.",
    standardLabel: "Standard",
    engineeringLabel: "Engineering",
    paramNozzle: "Nozzle",
    paramBed: "Bed",
    paramSpeed: "Speed",
    paramLayer: "Layer height",
    paramCooling: "Cooling",
    paramRetraction: "Retraction",
    paramEnclosure: "Enclosure",
    paramDifficulty: "Difficulty",
    paramTempRes: "Heat resistance",
    paramPrice: "Est. price",
    paramUses: "Use cases",
    paramNotes: "Notes",
    encNo: "Not required",
    encRec: "Recommended",
    encReq: "Required",
    ctaText: "Order prints in this material →",
    calcTitle: "Filament Calculator",
    calcSelectMat: "Select material:",
    calcInputMode: "Input mode:",
    calcModeVol: "Model volume (cm³)",
    calcModeDim: "Dimensions (L×W×H)",
    calcVolLabel: "Model volume",
    calcVolUnit: "cm³",
    calcLengthLabel: "Length",
    calcWidthLabel: "Width",
    calcHeightLabel: "Height",
    calcInfillLabel: "Infill",
    calcResultTitle: "Calculation result",
    calcMass: "Estimated mass",
    calcCost: "Material cost",
    calcRoll: "Share of 1 kg spool",
    calcNote: "Estimated weight. Actual usage depends on slicer, supports, and infill.",
    calcSelectFirst: "Select a material to see the result.",
    calcCTA: "Get 3D print quote at sTuDiO →",
  },
  de: {
    tab1: "Material-Berater",
    tab2: "Druckparameter",
    tab3: "Filamentrechner",
    reqTitle: "Anforderungen (Mehrfachauswahl):",
    reqAll: "Keine Auswahl = alle anzeigen",
    resultsTitle: "Passende Materialien",
    noMatch: "Kein Material erfüllt alle Anforderungen. Weniger Filter versuchen.",
    seeParams: "Parameter ansehen →",
    diffLabel: "Schwierigkeit",
    tempResLabel: "Max. Einsatztemp.",
    standardLabel: "Standard",
    engineeringLabel: "Technisch",
    paramNozzle: "Düse",
    paramBed: "Bett",
    paramSpeed: "Geschwindigkeit",
    paramLayer: "Schichthöhe",
    paramCooling: "Kühlung",
    paramRetraction: "Retraktion",
    paramEnclosure: "Gehäuse",
    paramDifficulty: "Schwierigkeit",
    paramTempRes: "Wärmebeständigkeit",
    paramPrice: "Richtpreis",
    paramUses: "Anwendungen",
    paramNotes: "Hinweise",
    encNo: "Nicht erforderlich",
    encRec: "Empfohlen",
    encReq: "Erforderlich",
    ctaText: "Drucke in diesem Material bestellen →",
    calcTitle: "Filamentrechner",
    calcSelectMat: "Material auswählen:",
    calcInputMode: "Eingabemodus:",
    calcModeVol: "Modellvolumen (cm³)",
    calcModeDim: "Abmessungen (L×B×H)",
    calcVolLabel: "Modellvolumen",
    calcVolUnit: "cm³",
    calcLengthLabel: "Länge",
    calcWidthLabel: "Breite",
    calcHeightLabel: "Höhe",
    calcInfillLabel: "Füllung",
    calcResultTitle: "Berechnungsergebnis",
    calcMass: "Geschätzte Masse",
    calcCost: "Materialkosten",
    calcRoll: "Anteil an 1-kg-Spule",
    calcNote: "Schätzgewicht. Tatsächlicher Verbrauch hängt von Slicer, Stützen und Füllung ab.",
    calcSelectFirst: "Material auswählen um Ergebnis zu sehen.",
    calcCTA: "3D-Druck-Angebot bei sTuDiO →",
  },
};

const PLN_PER_EUR = 4.25;

// ============================================================
// HELPER COMPONENTS
// ============================================================

function DifficultyDots({ level }) {
  const color = level <= 2 ? "bg-green-400" : level === 3 ? "bg-amber-400" : "bg-red-400";
  return (
    <span className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-2 h-2 rounded-full ${i <= level ? color : "bg-white/10"}`} />
      ))}
    </span>
  );
}

function EnclosureBadge({ value, L }) {
  if (value === "no") return null;
  const isReq = value === "required";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isReq ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
      {isReq ? L.encReq : L.encRec}
    </span>
  );
}

function PropChip({ prop }) {
  const colors = {
    "carbon-fiber": "bg-neutral-600/40 text-neutral-300",
    "uv-resistant": "bg-blue-500/20 text-blue-300",
    "flexible": "bg-purple-500/20 text-purple-300",
    "rubber-like": "bg-purple-500/20 text-purple-300",
    "easy": "bg-green-500/20 text-green-300",
    "food-safe": "bg-green-500/20 text-green-300",
    "water-soluble": "bg-cyan-500/20 text-cyan-300",
    "support-material": "bg-cyan-500/20 text-cyan-300",
    "shiny": "bg-amber-500/20 text-amber-300",
    "decorative": "bg-amber-500/20 text-amber-300",
    "outdoor": "bg-emerald-500/20 text-emerald-300",
    "weather-resistant": "bg-emerald-500/20 text-emerald-300",
  };
  const cls = colors[prop] || "bg-white/10 text-neutral-300";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{prop}</span>
  );
}

// ============================================================
// TAB 1 — MATERIAL ADVISOR
// ============================================================
function Tab1Advisor({ lang, L, onGoToParams }) {
  const [selected, setSelected] = useState(new Set());

  function toggleReq(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const scored = MATERIALS.map(m => {
    if (selected.size === 0) return { m, score: 0, match: true };
    const reqs = REQUIREMENTS.filter(r => selected.has(r.id));
    const matchCount = reqs.filter(r => r.match(m)).length;
    return { m, score: matchCount, match: matchCount === reqs.size };
  }).sort((a, b) => b.score - a.score);

  const topMatches = scored.filter(x => x.match);
  const list = selected.size === 0 ? scored : topMatches;

  const borderColors = ["border-amber-400/70", "border-green-400/70", "border-blue-400/70"];

  return (
    <div>
      {/* Requirement chips */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">{L.reqTitle}</div>
        <div className="flex flex-wrap gap-2">
          {REQUIREMENTS.map(r => {
            const active = selected.has(r.id);
            const label = r.label[lang] || r.label.en;
            return (
              <button
                key={r.id}
                onClick={() => toggleReq(r.id)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all duration-200 ${
                  active
                    ? "border-amber-400 bg-amber-400/10 text-amber-300 font-medium"
                    : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {selected.size === 0 && (
          <div className="text-xs text-neutral-500 mt-2 italic">{L.reqAll}</div>
        )}
      </div>

      {/* Results */}
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
        {L.resultsTitle} ({list.length})
      </div>

      {list.length === 0 && (
        <div className="text-neutral-400 text-sm py-4 text-center">{L.noMatch}</div>
      )}

      <div className="space-y-3">
        {list.map(({ m }, idx) => {
          const borderCls = selected.size > 0 && idx < 3 ? borderColors[idx] : "border-white/10";
          return (
            <div key={m.id} className={`rounded-xl border ${borderCls} bg-white/[0.02] p-4`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-white text-base">{m.name}</span>
                  {selected.size > 0 && idx < 3 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      idx === 0 ? "bg-amber-400/20 text-amber-300" :
                      idx === 1 ? "bg-green-400/20 text-green-300" :
                      "bg-blue-400/20 text-blue-300"
                    }`}>
                      #{idx + 1}
                    </span>
                  )}
                  <DifficultyDots level={m.difficulty} />
                </div>
                <button
                  onClick={() => onGoToParams(m.id)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                >
                  {L.seeParams}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                <span>{L.tempResLabel}: <span className="text-neutral-200">{m.tempRes}°C</span></span>
                <EnclosureBadge value={m.enclosure} L={L} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.props.map(p => <PropChip key={p} prop={p} />)}
              </div>
              <div className="text-xs text-neutral-400 mt-2 italic">{m.uses[lang] || m.uses.en}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PARAMETER CARD
// ============================================================
function ParameterCard({ m, lang, L }) {
  const showEur = lang === "en" || lang === "de";
  const priceDisplay = showEur
    ? `~${(m.pricePerKg / PLN_PER_EUR).toFixed(0)} EUR/kg`
    : `~${m.pricePerKg} PLN/kg`;

  const encLabel = m.enclosure === "no" ? L.encNo : m.enclosure === "recommended" ? L.encRec : L.encReq;
  const encColor = m.enclosure === "no" ? "text-neutral-300" : m.enclosure === "recommended" ? "text-amber-300" : "text-red-300";

  const params = [
    { label: `🌡 ${L.paramNozzle}`,        value: `${m.nozzle[0]}–${m.nozzle[1]}°C` },
    { label: `🛏 ${L.paramBed}`,           value: `${m.bed[0]}–${m.bed[1]}°C` },
    { label: `⚡ ${L.paramSpeed}`,         value: `${m.speed[0]}–${m.speed[1]} mm/s` },
    { label: `📏 ${L.paramLayer}`,         value: `${m.layer[0].toFixed(2)}–${m.layer[1].toFixed(2)} mm` },
    { label: `❄ ${L.paramCooling}`,        value: `${m.cooling}%` },
    { label: `↩ ${L.paramRetraction}`,     value: `${m.retraction[0]}–${m.retraction[1]} mm` },
    { label: `🔒 ${L.paramEnclosure}`,     value: encLabel, valueClass: encColor },
    { label: `⭐ ${L.paramDifficulty}`,    value: null, diffLevel: m.difficulty },
    { label: `🌡 ${L.paramTempRes}`,       value: `${m.tempRes}°C` },
    { label: `💶 ${L.paramPrice}`,         value: priceDisplay },
  ];

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.03] p-5 mt-4">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="font-bold text-white text-xl">{m.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          m.category === "engineering" ? "bg-blue-500/20 text-blue-300" : "bg-neutral-500/20 text-neutral-300"
        }`}>
          {m.category === "engineering" ? L.engineeringLabel : L.standardLabel}
        </span>
      </div>

      {/* Params grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
        {params.map(({ label, value, valueClass, diffLevel }) => (
          <div key={label} className="flex items-center justify-between text-sm border-b border-white/5 py-1.5">
            <span className="text-neutral-400 text-xs">{label}</span>
            {diffLevel !== undefined
              ? <DifficultyDots level={diffLevel} />
              : <span className={`font-medium text-xs ${valueClass || "text-neutral-200"}`}>{value}</span>
            }
          </div>
        ))}
      </div>

      {/* Props */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {m.props.map(p => <PropChip key={p} prop={p} />)}
      </div>

      {/* Uses */}
      <div className="text-xs text-neutral-400 italic mb-2">
        <span className="font-semibold text-neutral-300 not-italic">{L.paramUses}: </span>
        {m.uses[lang] || m.uses.en}
      </div>

      {/* Notes */}
      <div className={`text-xs leading-relaxed ${m.difficulty >= 4 ? "text-amber-200/80" : "text-neutral-400"}`}>
        {m.difficulty >= 4 && <span className="mr-1">⚠</span>}
        <span className="font-semibold text-neutral-300">{L.paramNotes}: </span>
        {m.notes[lang] || m.notes.en}
      </div>

      {/* CTA */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <a
          href="https://www.aejaca.com/studio/#calculator"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {L.ctaText}
        </a>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2 — PRINT PARAMETERS
// ============================================================
function Tab2Parameters({ lang, L, initialMat }) {
  const [selected, setSelected] = useState(initialMat || null);

  const standard = MATERIALS.filter(m => m.category === "standard");
  const engineering = MATERIALS.filter(m => m.category === "engineering");
  const selectedMat = MATERIALS.find(m => m.id === selected);

  function MatGrid({ mats }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {mats.map(m => {
          const active = selected === m.id;
          const diffColor = m.difficulty <= 2 ? "text-green-400" : m.difficulty === 3 ? "text-amber-400" : "text-red-400";
          return (
            <button
              key={m.id}
              onClick={() => setSelected(active ? null : m.id)}
              className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                active
                  ? "border-amber-400/50 bg-amber-400/[0.06] shadow-lg shadow-amber-400/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="font-semibold text-white text-sm mb-1.5">{m.name}</div>
              <div className="flex items-center gap-2 mb-1">
                <DifficultyDots level={m.difficulty} />
                <span className={`text-[10px] font-bold ${diffColor}`}>{m.difficulty}/5</span>
              </div>
              <EnclosureBadge value={m.enclosure} L={L} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">{L.standardLabel}</div>
        <MatGrid mats={standard} />
      </div>
      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">{L.engineeringLabel}</div>
        <MatGrid mats={engineering} />
      </div>

      {selectedMat && <ParameterCard m={selectedMat} lang={lang} L={L} />}
    </div>
  );
}

// ============================================================
// TAB 3 — FILAMENT CALCULATOR
// ============================================================
function Tab3Calculator({ lang, L }) {
  const [matId, setMatId] = useState(null);
  const [mode, setMode] = useState("vol"); // "vol" | "dim"
  const [vol, setVol] = useState("");
  const [dimL, setDimL] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const [infill, setInfill] = useState(20);

  const mat = MATERIALS.find(m => m.id === matId);

  // Calculate volume
  let volCm3 = null;
  if (mode === "vol") {
    const v = parseFloat(vol);
    if (!isNaN(v) && v > 0) volCm3 = v;
  } else {
    const l = parseFloat(dimL), w = parseFloat(dimW), h = parseFloat(dimH);
    if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
      volCm3 = (l * w * h * 0.001) * (0.25 + (infill / 100) * 0.75);
    }
  }

  const massG = mat && volCm3 !== null ? parseFloat((volCm3 * mat.density).toFixed(1)) : null;
  const showEur = lang === "en" || lang === "de";
  const costDisplay = mat && massG !== null
    ? showEur
      ? `${((massG / 1000) * mat.pricePerKg / PLN_PER_EUR).toFixed(2)} EUR`
      : `${((massG / 1000) * mat.pricePerKg).toFixed(2)} PLN`
    : null;
  const rollPct = massG !== null ? Math.round((massG / 1000) * 100) : null;

  const standard = MATERIALS.filter(m => m.category === "standard");
  const engineering = MATERIALS.filter(m => m.category === "engineering");

  function MatChips({ mats }) {
    return (
      <div className="flex flex-wrap gap-2">
        {mats.map(m => (
          <button
            key={m.id}
            onClick={() => setMatId(m.id === matId ? null : m.id)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-all duration-200 ${
              matId === m.id
                ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium"
                : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Material selector */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">{L.calcSelectMat}</div>
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">{L.standardLabel}</div>
        <MatChips mats={standard} />
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-3 mb-2">{L.engineeringLabel}</div>
        <MatChips mats={engineering} />
      </div>

      {/* Input mode */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">{L.calcInputMode}</div>
        <div className="flex gap-2 mb-4">
          {["vol", "dim"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                mode === m
                  ? "border-amber-400 bg-amber-400/10 text-amber-300 font-medium"
                  : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}
            >
              {m === "vol" ? L.calcModeVol : L.calcModeDim}
            </button>
          ))}
        </div>

        {mode === "vol" ? (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="0.1"
              value={vol}
              onChange={e => setVol(e.target.value)}
              placeholder="0.0"
              className="w-36 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-colors"
            />
            <span className="text-neutral-400 text-sm">{L.calcVolUnit}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: L.calcLengthLabel, val: dimL, set: setDimL },
                { label: L.calcWidthLabel,  val: dimW, set: setDimW },
                { label: L.calcHeightLabel, val: dimH, set: setDimH },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <div className="text-xs text-neutral-400 mb-1">{label} (mm)</div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>{L.calcInfillLabel}</span>
                <span className="text-amber-300 font-medium">{infill}%</span>
              </div>
              <input
                type="range"
                min="5" max="100" step="5"
                value={infill}
                onChange={e => setInfill(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                <span>5%</span><span>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">{L.calcResultTitle}</div>
        {!mat || massG === null ? (
          <div className="text-neutral-400 text-sm text-center py-4">{L.calcSelectFirst}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-neutral-400 text-sm">{L.calcMass}</span>
              <span className="text-white font-bold text-lg">{massG} g</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-neutral-400 text-sm">{L.calcCost}</span>
              <span className="text-amber-300 font-bold text-lg">{costDisplay}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-400 text-sm">{L.calcRoll}</span>
              <span className="text-neutral-200 font-semibold">{rollPct}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, rollPct)}%` }}
              />
            </div>
            <div className="text-[11px] text-neutral-500 italic mt-2">{L.calcNote}</div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-white/5">
          <a
            href="/studio/#calculator"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {L.calcCTA}
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PrintSettings3DCalc() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const [activeTab, setActiveTab] = useState(0);
  const [paramsMat, setParamsMat] = useState(null);

  const tabs = [L.tab1, L.tab2, L.tab3];

  function handleGoToParams(matId) {
    setParamsMat(matId);
    setActiveTab(1);
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-1 px-3 py-3.5 text-sm font-medium transition-all duration-200 relative ${
              activeTab === i
                ? "text-amber-300"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab}
            {activeTab === i && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 0 && <Tab1Advisor lang={lang} L={L} onGoToParams={handleGoToParams} />}
        {activeTab === 1 && <Tab2Parameters lang={lang} L={L} initialMat={paramsMat} />}
        {activeTab === 2 && <Tab3Calculator lang={lang} L={L} />}
      </div>
    </div>
  );
}
