import { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

// ============================================================
// CONFIG
// ============================================================
const API_BASE = "https://aejacachatapi-production.up.railway.app/api/filaments";
const CACHE_KEY = "filament-data-v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PLN_PER_EUR = 4.25;

// ============================================================
// LABELS (pl/en/de — self-contained)
// ============================================================
const LABELS = {
  pl: {
    loading: "Ładowanie bazy filamentów...",
    loadError: "Błąd ładowania danych. Spróbuj odświeżyć stronę.",
    retry: "Spróbuj ponownie",

    step1: "Wymagania",
    step2: "Dobór materiału",
    step3: "Wybierz markę",
    step4: "Parametry",

    step1Title: "Co chcesz wydrukować?",
    step1Hint: "Wybierz wymagania ważne dla Twojego projektu — lub przejdź od razu do listy",
    skipStep1: "Pokaż wszystkie materiały →",
    selectAll: "Zaznacz wszystkie",
    deselectAll: "Odznacz wszystkie",

    step2Title: "Wybierz materiał",
    searchPlaceholder: "Szukaj materiału...",
    standard: "Standardowe",
    engineering: "Inżynieryjne",
    flexible: "Elastyczne",
    specialty: "Specjalistyczne",
    noResults: "Dla tego wyboru nie udało się znaleźć filamentu",
    showAll: "Pokaż wszystkie materiały",
    expand: "Rozwiń",
    collapse: "Zwiń",

    step3Title: "Wybierz markę / producenta",
    step3Hint: "Opcjonalne — wybierz markę dla parametrów specyficznych lub zostań przy ogólnych",
    genericParams: "Parametry ogólne",
    genericDesc: "Uniwersalne parametry startowe dla tego materiału",
    verified: "Zweryfikowane ✓",
    communityApproved: "Społeczność ✓",
    next: "Dalej →",

    step4Title: "Parametry druku",
    sectionTemps: "Temperatury",
    sectionSpeed: "Prędkość i warstwy",
    sectionEnclosure: "Chłodzenie i obudowa",
    sectionProps: "Właściwości",
    sectionNotes: "Uwagi",
    nozzle: "Dysza",
    bed: "Łoże",
    tempRes: "Maks. temp. pracy",
    speed: "Prędkość",
    layerHeight: "Wysokość warstwy",
    retraction: "Retrakcja",
    cooling: "Chłodzenie",
    enclosure: "Obudowa",
    difficulty: "Trudność druku",
    density: "Gęstość",
    priceEst: "Cena orientacyjna",
    encNo: "Nie wymagana",
    encRec: "Zalecana",
    encReq: "Wymagana",
    uses: "Zastosowania",
    notes: "Uwagi techniczne",

    calcTitle: "Kalkulator filamentu",
    calcLength: "Długość",
    calcWidth: "Szerokość",
    calcHeight: "Wysokość",
    calcInfill: "Wypełnienie",
    calcMass: "Szacowana masa",
    calcCost: "Koszt materiału",
    calcRoll: "Udział rolki 1 kg",
    calcNote: "Szacunkowe wartości. Rzeczywiste zużycie zależy od slicera.",

    contribTitle: "Masz sprawdzone parametry?",
    contribToggle: "💡 Masz dokładniejsze parametry dla tej marki?",
    contribDesc: "Podziel się swoimi ustawieniami druku dla tej marki. Twoje dane trafią do weryfikacji przez społeczność.",
    contribBrand: "Marka",
    contribProduct: "Nazwa produktu",
    contribNozzle: "Temperatura dyszy (°C)",
    contribBed: "Temperatura łoża (°C)",
    contribSpeed: "Prędkość druku (mm/s)",
    contribNotes: "Uwagi dodatkowe",
    contribName: "Twoje imię (opcjonalne)",
    contribEmail: "Adres email *",
    contribGdpr: "Wyrażam zgodę na przetwarzanie adresu email w celu kontaktu dotyczącego zgłoszenia",
    contribSubmit: "Wyślij zgłoszenie",
    contribSending: "Wysyłanie...",
    contribSuccess: "Dziękujemy! Twoje parametry trafią do weryfikacji przez społeczność.",
    contribError: "Błąd wysyłania. Sprawdź pola i spróbuj ponownie.",
    rangeMin: "od",
    rangeMax: "do",

    communityContribs: "Sugestie społeczności",
    voteConfirm: "👍 Potwierdzam",
    voteDispute: "👎 Inne parametry",
    voteSuccess: "Głos zapisany!",
    voteDuplicate: "Już głosowałeś na to zgłoszenie.",
    confirms: "potwierdzeń",
    disputes: "głosów sprzeciwu",
    noContribs: "Brak sugestii społeczności dla tego materiału.",

    legendTitle: "Legenda",
    legendDiff: "Poziom trudności (1=łatwy, 5=trudny)",
    legendEncReq: "Obudowa wymagana",
    legendEncRec: "Obudowa zalecana",
    legendEncNo: "Obudowa niepotrzebna",
    legendHardNozzle: "Materiały CF/GF wymagają dyszy hartowanej",

    back: "← Wstecz",
    change: "Zmień",
    cta: "Zamów wydruk w sTuDiO →",

    orderTitle: "Złóż zamówienie",
    orderStlLabel: "Plik modelu 3D (opcjonalnie)",
    orderColorLabel: "Kolor filamentu",
    addToCart: "Dodaj do koszyka",
    addToCartHint: "Wybierz kolor, aby dodać do koszyka",

    reqEasy: "Łatwy w druku",
    reqFlexible: "Elastyczny / gumowy",
    reqHighTemp: "Odp. na temp. >100°C",
    reqOutdoor: "Zewnętrzny / UV",
    reqStrong: "Wysoka wytrzymałość / CF",
    reqChemical: "Odporność chemiczna",
    reqDecorative: "Dekoracyjny / błyszczący",
    reqSupport: "Materiał podporowy",
    reqFoodSafe: "Kontakt z żywnością",

    catStandard: "Standardowe",
    catEngineering: "Inżynieryjne",
    catFlexible: "Elastyczne",
    catSpecialty: "Specjalistyczne",
  },
  en: {
    loading: "Loading filament database...",
    loadError: "Error loading data. Try refreshing the page.",
    retry: "Try again",

    step1: "Requirements",
    step2: "Material",
    step3: "Choose brand",
    step4: "Parameters",

    step1Title: "What do you want to print?",
    step1Hint: "Select requirements important for your project — or go straight to the full list",
    skipStep1: "Show all materials →",
    selectAll: "Select all",
    deselectAll: "Deselect all",

    step2Title: "Pick a material",
    searchPlaceholder: "Search material...",
    standard: "Standard",
    engineering: "Engineering",
    flexible: "Flexible",
    specialty: "Specialty",
    noResults: "No filament found for this selection",
    showAll: "Show all materials",
    expand: "Expand",
    collapse: "Collapse",

    step3Title: "Choose brand / manufacturer",
    step3Hint: "Optional — pick a brand for specific parameters or stick with generic",
    genericParams: "Generic parameters",
    genericDesc: "Universal starting parameters for this material",
    verified: "Verified ✓",
    communityApproved: "Community ✓",
    next: "Next →",

    step4Title: "Print parameters",
    sectionTemps: "Temperatures",
    sectionSpeed: "Speed & layers",
    sectionEnclosure: "Cooling & enclosure",
    sectionProps: "Properties",
    sectionNotes: "Notes",
    nozzle: "Nozzle",
    bed: "Bed",
    tempRes: "Max service temp.",
    speed: "Speed",
    layerHeight: "Layer height",
    retraction: "Retraction",
    cooling: "Cooling",
    enclosure: "Enclosure",
    difficulty: "Print difficulty",
    density: "Density",
    priceEst: "Est. price",
    encNo: "Not required",
    encRec: "Recommended",
    encReq: "Required",
    uses: "Use cases",
    notes: "Technical notes",

    calcTitle: "Filament calculator",
    calcLength: "Length",
    calcWidth: "Width",
    calcHeight: "Height",
    calcInfill: "Infill",
    calcMass: "Estimated mass",
    calcCost: "Material cost",
    calcRoll: "Share of 1 kg spool",
    calcNote: "Estimated values. Actual usage depends on slicer settings.",

    contribTitle: "Have proven parameters?",
    contribToggle: "💡 Have more accurate parameters for this brand?",
    contribDesc: "Share your print settings for this brand. Your data will be verified by the community.",
    contribBrand: "Brand",
    contribProduct: "Product name",
    contribNozzle: "Nozzle temperature (°C)",
    contribBed: "Bed temperature (°C)",
    contribSpeed: "Print speed (mm/s)",
    contribNotes: "Additional notes",
    contribName: "Your name (optional)",
    contribEmail: "Email address *",
    contribGdpr: "I consent to processing of my email for follow-up regarding this submission",
    contribSubmit: "Submit",
    contribSending: "Sending...",
    contribSuccess: "Thank you! Your parameters will be verified by the community.",
    contribError: "Submission error. Check fields and try again.",
    rangeMin: "from",
    rangeMax: "to",

    communityContribs: "Community suggestions",
    voteConfirm: "👍 Confirm",
    voteDispute: "👎 Different params",
    voteSuccess: "Vote recorded!",
    voteDuplicate: "You already voted on this submission.",
    confirms: "confirms",
    disputes: "disputes",
    noContribs: "No community suggestions for this material yet.",

    legendTitle: "Legend",
    legendDiff: "Difficulty level (1=easy, 5=hard)",
    legendEncReq: "Enclosure required",
    legendEncRec: "Enclosure recommended",
    legendEncNo: "No enclosure needed",
    legendHardNozzle: "CF/GF materials need a hardened nozzle",

    back: "← Back",
    change: "Change",
    cta: "Order 3D print at sTuDiO →",

    orderTitle: "Place an order",
    orderStlLabel: "3D model file (optional)",
    orderColorLabel: "Filament color",
    addToCart: "Add to cart",
    addToCartHint: "Select a color to add to cart",

    reqEasy: "Easy to print",
    reqFlexible: "Flexible / rubber-like",
    reqHighTemp: "Heat resistance >100°C",
    reqOutdoor: "Outdoor / UV",
    reqStrong: "High strength / CF",
    reqChemical: "Chemical resistance",
    reqDecorative: "Decorative / shiny",
    reqSupport: "Support material",
    reqFoodSafe: "Food contact",

    catStandard: "Standard",
    catEngineering: "Engineering",
    catFlexible: "Flexible",
    catSpecialty: "Specialty",
  },
  de: {
    loading: "Filament-Datenbank wird geladen...",
    loadError: "Fehler beim Laden. Bitte Seite neu laden.",
    retry: "Erneut versuchen",

    step1: "Anforderungen",
    step2: "Material",
    step3: "Marke wählen",
    step4: "Parameter",

    step1Title: "Was möchten Sie drucken?",
    step1Hint: "Wählen Sie die für Ihr Projekt wichtigen Anforderungen — oder gehen Sie direkt zur Liste",
    skipStep1: "Alle Materialien anzeigen →",
    selectAll: "Alle auswählen",
    deselectAll: "Alle abwählen",

    step2Title: "Material auswählen",
    searchPlaceholder: "Material suchen...",
    standard: "Standard",
    engineering: "Technisch",
    flexible: "Flexibel",
    specialty: "Speziell",
    noResults: "Für diese Auswahl wurde kein Filament gefunden",
    showAll: "Alle Materialien anzeigen",
    expand: "Aufklappen",
    collapse: "Einklappen",

    step3Title: "Marke / Hersteller wählen",
    step3Hint: "Optional — Marke wählen für spezifische Parameter oder generisch bleiben",
    genericParams: "Generische Parameter",
    genericDesc: "Universelle Startparameter für dieses Material",
    verified: "Verifiziert ✓",
    communityApproved: "Community ✓",
    next: "Weiter →",

    step4Title: "Druckparameter",
    sectionTemps: "Temperaturen",
    sectionSpeed: "Geschwindigkeit & Schichten",
    sectionEnclosure: "Kühlung & Gehäuse",
    sectionProps: "Eigenschaften",
    sectionNotes: "Hinweise",
    nozzle: "Düse",
    bed: "Bett",
    tempRes: "Max. Einsatztemp.",
    speed: "Geschwindigkeit",
    layerHeight: "Schichthöhe",
    retraction: "Retraktion",
    cooling: "Kühlung",
    enclosure: "Gehäuse",
    difficulty: "Druckschwierigkeit",
    density: "Dichte",
    priceEst: "Richtpreis",
    encNo: "Nicht erforderlich",
    encRec: "Empfohlen",
    encReq: "Erforderlich",
    uses: "Anwendungen",
    notes: "Technische Hinweise",

    calcTitle: "Filamentrechner",
    calcLength: "Länge",
    calcWidth: "Breite",
    calcHeight: "Höhe",
    calcInfill: "Füllung",
    calcMass: "Geschätzte Masse",
    calcCost: "Materialkosten",
    calcRoll: "Anteil 1-kg-Spule",
    calcNote: "Schätzwerte. Tatsächlicher Verbrauch hängt vom Slicer ab.",

    contribTitle: "Haben Sie bewährte Parameter?",
    contribToggle: "💡 Genauere Parameter für diese Marke?",
    contribDesc: "Teilen Sie Ihre Druckeinstellungen für diese Marke. Die Daten werden von der Community geprüft.",
    contribBrand: "Marke",
    contribProduct: "Produktname",
    contribNozzle: "Düsentemperatur (°C)",
    contribBed: "Betttemperatur (°C)",
    contribSpeed: "Druckgeschwindigkeit (mm/s)",
    contribNotes: "Zusätzliche Hinweise",
    contribName: "Ihr Name (optional)",
    contribEmail: "E-Mail-Adresse *",
    contribGdpr: "Ich stimme der Verarbeitung meiner E-Mail-Adresse zur Kontaktaufnahme zu",
    contribSubmit: "Absenden",
    contribSending: "Wird gesendet...",
    contribSuccess: "Danke! Ihre Parameter werden von der Community geprüft.",
    contribError: "Fehler beim Senden. Bitte Felder prüfen und erneut versuchen.",
    rangeMin: "von",
    rangeMax: "bis",

    communityContribs: "Community-Vorschläge",
    voteConfirm: "👍 Bestätigen",
    voteDispute: "👎 Andere Parameter",
    voteSuccess: "Stimme gespeichert!",
    voteDuplicate: "Sie haben bereits abgestimmt.",
    confirms: "Bestätigungen",
    disputes: "Einsprüche",
    noContribs: "Noch keine Community-Vorschläge für dieses Material.",

    legendTitle: "Legende",
    legendDiff: "Schwierigkeitsgrad (1=leicht, 5=schwer)",
    legendEncReq: "Gehäuse erforderlich",
    legendEncRec: "Gehäuse empfohlen",
    legendEncNo: "Kein Gehäuse nötig",
    legendHardNozzle: "CF/GF-Materialien benötigen gehärtete Düse",

    back: "← Zurück",
    change: "Ändern",
    cta: "3D-Druck bei sTuDiO bestellen →",

    orderTitle: "Bestellung aufgeben",
    orderStlLabel: "3D-Modelldatei (optional)",
    orderColorLabel: "Filamentfarbe",
    addToCart: "In den Warenkorb",
    addToCartHint: "Farbe wählen, um in den Warenkorb zu legen",

    reqEasy: "Einfach zu drucken",
    reqFlexible: "Flexibel / gummiartig",
    reqHighTemp: "Wärmebeständig >100°C",
    reqOutdoor: "Außen / UV",
    reqStrong: "Hochfest / CF",
    reqChemical: "Chemikalienbeständig",
    reqDecorative: "Dekorativ / glänzend",
    reqSupport: "Stützmaterial",
    reqFoodSafe: "Lebensmittelkontakt",

    catStandard: "Standard",
    catEngineering: "Technisch",
    catFlexible: "Flexibel",
    catSpecialty: "Speziell",
  },
};

// ============================================================
// REQUIREMENT FILTERS (operate on API filament type objects)
// ============================================================
const REQUIREMENTS = [
  { id: "easy",      labelKey: "reqEasy",       match: t => (t.difficulty ?? 99) <= 2 },
  { id: "flexible",  labelKey: "reqFlexible",   match: t => hasProp(t, ["flexible","rubber-like"]) },
  { id: "highTemp",  labelKey: "reqHighTemp",   match: t => (t.temp_resistance ?? 0) >= 100 },
  { id: "outdoor",   labelKey: "reqOutdoor",    match: t => hasProp(t, ["uv-resistant","weather-resistant","outdoor"]) },
  { id: "strong",    labelKey: "reqStrong",     match: t => hasProp(t, ["high-strength","very-stiff","carbon-fiber"]) },
  { id: "chemical",  labelKey: "reqChemical",   match: t => hasProp(t, ["chemical-resistant"]) },
  { id: "decorative",labelKey: "reqDecorative", match: t => hasProp(t, ["shiny","decorative"]) },
  { id: "support",   labelKey: "reqSupport",    match: t => hasProp(t, ["support-material","water-soluble"]) },
  { id: "foodSafe",  labelKey: "reqFoodSafe",   match: t => hasProp(t, ["food-safe"]) },
];

function hasProp(type, needles) {
  if (!type?.props || !Array.isArray(type.props)) return false;
  return needles.some(n => type.props.includes(n));
}

const PROP_TRANSLATIONS = {
  "easy":               { pl: "łatwy w druku",      en: "easy to print",      de: "einfach zu drucken" },
  "rigid":              { pl: "sztywny",             en: "rigid",              de: "steif" },
  "flexible":           { pl: "elastyczny",          en: "flexible",           de: "flexibel" },
  "rubber-like":        { pl: "gumopodobny",         en: "rubber-like",        de: "gummiartig" },
  "semi-flexible":      { pl: "półelastyczny",       en: "semi-flexible",      de: "halbflexibel" },
  "tougher-than-pla":   { pl: "twardszy niż PLA",   en: "tougher than PLA",   de: "härter als PLA" },
  "low-warp":           { pl: "niskie odkształcenia",en: "low warping",        de: "geringes Verziehen" },
  "high-strength":      { pl: "wysoka wytrzymałość", en: "high strength",      de: "hohe Festigkeit" },
  "impact-resistant":   { pl: "odporny na udary",    en: "impact resistant",   de: "schlagfest" },
  "chemical-resistant": { pl: "odp. chemiczna",      en: "chemical resistant", de: "chemisch beständig" },
  "weather-resistant":  { pl: "odp. na pogodę",      en: "weather resistant",  de: "witterungsbeständig" },
  "uv-resistant":       { pl: "odp. na UV",          en: "UV resistant",       de: "UV-beständig" },
  "outdoor":            { pl: "zewnętrzny",          en: "outdoor",            de: "Außenbereich" },
  "high-temp":          { pl: "wysoka temp.",        en: "high temp",          de: "Hochtemperatur" },
  "temperature-resistant": { pl: "odp. na temp.",   en: "temp resistant",     de: "temperaturbeständig" },
  "carbon-fiber":       { pl: "włókno węglowe",      en: "carbon fiber",       de: "Kohlefaser" },
  "glass-fiber":        { pl: "włókno szklane",      en: "glass fiber",        de: "Glasfaser" },
  "shiny":              { pl: "błyszczący",          en: "shiny",              de: "glänzend" },
  "silk":               { pl: "jedwabisty",          en: "silk",               de: "Seide" },
  "decorative":         { pl: "dekoracyjny",         en: "decorative",         de: "dekorativ" },
  "transparent":        { pl: "przezroczysty",       en: "transparent",        de: "transparent" },
  "food-safe":          { pl: "kontakt z żywnością", en: "food safe",          de: "lebensmittelecht" },
  "water-soluble":      { pl: "rozpuszczalny w wodzie", en: "water soluble",  de: "wasserlöslich" },
  "support-material":   { pl: "materiał podporowy",  en: "support material",   de: "Stützmaterial" },
  "biodegradable":      { pl: "biodegradowalny",     en: "biodegradable",      de: "biologisch abbaubar" },
  "eco":                { pl: "eko",                  en: "eco",                de: "Öko" },
  "abrasive":           { pl: "ścierny",             en: "abrasive",           de: "abrasiv" },
  "stiff":              { pl: "twardy",              en: "stiff",              de: "hart" },
  "wood-fill":          { pl: "wypełnienie drewniane", en: "wood fill",        de: "Holzfüllung" },
  "metal-fill":         { pl: "wypełnienie metalowe", en: "metal fill",        de: "Metallfüllung" },
  "marble-fill":        { pl: "wypełnienie marmurowe", en: "marble fill",      de: "Marmorfüllung" },
};

// ============================================================
// PRIMITIVE UI COMPONENTS
// ============================================================

function DifficultyDots({ level }) {
  const lvl = level || 1;
  const color = lvl <= 2 ? "bg-green-400" : lvl === 3 ? "bg-amber-400" : "bg-red-400";
  return (
    <span className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-2 h-2 rounded-full ${i <= lvl ? color : "bg-white/10"}`} />
      ))}
    </span>
  );
}

function EnclosureBadge({ value, L }) {
  if (!value || value === "no") return null;
  const isReq = value === "required";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isReq ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
      {isReq ? L.encReq : L.encRec}
    </span>
  );
}

function PropChip({ prop, lang }) {
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
  const label = PROP_TRANSLATIONS[prop]?.[lang] || PROP_TRANSLATIONS[prop]?.en || prop;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function LegendPopup({ L }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors border border-white/10 rounded-lg px-2 py-1"
        aria-label={L.legendTitle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {L.legendTitle}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-72 bg-neutral-900 border border-white/15 rounded-xl shadow-2xl p-4 text-xs">
          <p className="font-semibold text-neutral-200 mb-3 uppercase tracking-wider text-[10px]">{L.legendTitle}</p>
          <div className="mb-3">
            <p className="text-neutral-400 mb-1.5">{L.legendDiff}</p>
            <div className="flex flex-col gap-1">
              {[1,2,3,4,5].map(lvl => (
                <div key={lvl} className="flex items-center gap-2">
                  <DifficultyDots level={lvl} />
                  <span className={`${lvl<=2?"text-green-400":lvl===3?"text-amber-400":"text-red-400"} font-medium`}>{lvl}/5</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-500/20 text-red-300">{L.encReq}</span>
              <span className="text-neutral-400">{L.legendEncReq}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300">{L.encRec}</span>
              <span className="text-neutral-400">{L.legendEncRec}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-neutral-600 italic">—</span>
              <span className="text-neutral-400">{L.legendEncNo}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-neutral-500 flex items-start gap-1.5">
            <span className="text-amber-400 mt-0.5">⚠</span>
            <span>{L.legendHardNozzle}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// RangeBar — visual slider-style range indicator
// ============================================================
function RangeBar({ min, max, scaleMin, scaleMax, unit, label }) {
  const safeMin = min ?? scaleMin;
  const safeMax = max ?? safeMin;
  const range = scaleMax - scaleMin || 1;
  const leftPct = Math.max(0, Math.min(100, ((safeMin - scaleMin) / range) * 100));
  const widthPct = Math.max(1, Math.min(100 - leftPct, ((safeMax - safeMin) / range) * 100));
  const displayValue = safeMin === safeMax ? `${safeMin}` : `${safeMin}–${safeMax}`;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-medium">{displayValue} {unit}</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden relative">
        <div
          className="absolute h-full bg-amber-400/80 rounded-full"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-neutral-600 mt-0.5">
        <span>{scaleMin}</span>
        <span>{scaleMax}</span>
      </div>
    </div>
  );
}

// ============================================================
// LOADING / ERROR STATES
// ============================================================
function LoadingState({ L }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center">
      <div className="inline-block w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-3" />
      <div className="text-sm text-neutral-400">{L.loading}</div>
    </div>
  );
}

function ErrorState({ L, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.03] p-10 text-center">
      <div className="text-red-300 text-sm mb-3">{L.loadError}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg border border-red-400/30 bg-red-400/10 text-red-200 text-sm hover:bg-red-400/20 transition-colors"
        >
          {L.retry}
        </button>
      )}
    </div>
  );
}

// ============================================================
// WIZARD PROGRESS
// ============================================================
function WizardProgress({ step, canNext, onPrev, onNext, onJump, L }) {
  const steps = [L.step1, L.step2, L.step3, L.step4];
  return (
    <div className="px-5 pt-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 flex items-center gap-1.5 sm:gap-2 pt-1">
          {steps.map((label, idx) => {
            const num = idx + 1;
            const isActive = num === step;
            const isDone = num < step;
            const clickable = isDone;
            return (
              <div key={num} className="flex-1 flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className={`h-1 w-full rounded-full transition-all duration-300 ${
                    isActive ? "bg-amber-400" : isDone ? "bg-green-400" : "bg-neutral-700"
                  }`} />
                  <div
                    onClick={clickable ? () => onJump(num) : undefined}
                    className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-center transition-colors ${
                      isActive ? "text-amber-300" :
                      isDone ? "text-green-400 cursor-pointer hover:text-amber-300" :
                      "text-neutral-600"
                    }`}
                  >
                    <span className="hidden sm:inline">{num}. </span>{label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Persistent nav arrows */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            disabled={step === 1}
            aria-label="Wstecz"
            className={`w-8 h-8 rounded-lg flex items-center justify-center border text-base transition-all ${
              step === 1
                ? "border-white/5 text-neutral-700 cursor-not-allowed"
                : "border-white/15 text-neutral-300 hover:border-white/30 hover:text-white"
            }`}
          >
            ←
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            aria-label="Dalej"
            className={`w-8 h-8 rounded-lg flex items-center justify-center border text-base transition-all ${
              !canNext
                ? "border-white/5 text-neutral-700 cursor-not-allowed"
                : "border-amber-400/30 text-amber-300 hover:border-amber-400/50 hover:bg-amber-400/10"
            }`}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BREADCRUMB CHIPS
// ============================================================
function BreadcrumbChips({ step, selectedType, selectedBrand, brandChoice, onJump, L }) {
  if (step === 1) return null;
  const chips = [];
  if (selectedType && step >= 2) {
    chips.push({ label: selectedType.name, jumpTo: 2 });
  }
  if (step >= 4) {
    chips.push({
      label: selectedBrand ? `${selectedBrand.brand}${selectedBrand.product_name ? " · " + selectedBrand.product_name : ""}` : L.genericParams,
      jumpTo: 3,
    });
  }
  if (!chips.length) return null;
  return (
    <div className="px-5 pt-3 flex flex-wrap items-center gap-1.5 text-xs">
      {chips.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-neutral-600">/</span>}
          <button
            onClick={() => onJump(c.jumpTo)}
            className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.03] text-neutral-300 hover:border-amber-400/40 hover:text-amber-300 transition-colors"
          >
            {c.label} <span className="text-neutral-500 ml-1">({L.change})</span>
          </button>
        </span>
      ))}
    </div>
  );
}

// ============================================================
// STEP 1 — REQUIREMENTS
// ============================================================
function Step1Requirements({ requirements, selected, onToggle, onDeselectAll, onShowAll, L }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-1">{L.step1Title}</h3>
      <p className="text-xs text-neutral-400 mb-4">{L.step1Hint}</p>

      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Left: Odznacz wszystkie */}
        <button
          onClick={onDeselectAll}
          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.03] text-xs font-medium text-neutral-300 hover:border-white/25 hover:text-white transition-all duration-200"
        >
          {L.deselectAll}
        </button>

        {/* Right: Pokaż wszystkie materiały → */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onShowAll}
            className="px-4 py-2 rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-300 text-sm font-medium hover:bg-blue-400/20 transition-all duration-200 whitespace-nowrap"
          >
            {L.showAll} →
          </button>
        </div>
      </div>

      {/* Requirement chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {requirements.map(r => {
          const active = selected.has(r.id);
          return (
            <button
              key={r.id}
              onClick={() => onToggle(r.id)}
              className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all duration-200 ${
                active
                  ? "border-amber-400 bg-amber-400/10 text-amber-300 font-medium"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}
            >
              {L[r.labelKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// STEP 2 — MATERIALS
// ============================================================
function MaterialMiniCard({ type, onSelect, L }) {
  return (
    <button
      onClick={() => onSelect(type)}
      className="text-left rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:border-amber-400/40 hover:bg-amber-400/[0.04] transition-all duration-200"
    >
      <div className="font-semibold text-white text-sm mb-1.5">{type.name}</div>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <DifficultyDots level={type.difficulty} />
        {type.temp_resistance != null && (
          <span className="text-[10px] text-neutral-400">{type.temp_resistance}°C</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <EnclosureBadge value={type.enclosure} L={L} />
        {type.brands && type.brands.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
            {type.brands.length} {type.brands.length === 1 ? "brand" : "brands"}
          </span>
        )}
      </div>
    </button>
  );
}

function CategorySection({ category, types, defaultOpen, onSelect, L }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!types.length) return null;
  const catLabel = L[`cat${category.charAt(0).toUpperCase()}${category.slice(1)}`] || category;
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-2 text-left group"
      >
        <div className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
          open ? "text-neutral-400" : "text-amber-300 group-hover:text-amber-200"
        }`}>
          {catLabel} <span className={open ? "text-neutral-600" : "text-amber-400/60"}>({types.length})</span>
        </div>
        <span className={`text-xs transition-colors ${open ? "text-neutral-500" : "text-amber-400 font-medium"}`}>
          {open ? L.collapse : L.expand}
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {types.map(t => <MaterialMiniCard key={t.id} type={t} onSelect={onSelect} L={L} />)}
        </div>
      )}
    </div>
  );
}

function Step2Materials({ types, allTypes, selectedReqs, onSelect, onClearReqs, L }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return types;
    const q = search.trim().toLowerCase();
    return types.filter(t => (t.name || "").toLowerCase().includes(q));
  }, [types, search]);

  const grouped = useMemo(() => {
    const g = { standard: [], engineering: [], flexible: [], specialty: [] };
    filtered.forEach(t => {
      const cat = g[t.category] ? t.category : "specialty";
      g[cat].push(t);
    });
    return g;
  }, [filtered]);

  const empty = filtered.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-lg font-bold text-white">{L.step2Title}</h3>
        <LegendPopup L={L} />
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={L.searchPlaceholder}
        className="w-full mb-4 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-colors"
      />

      {empty ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <div className="text-neutral-400 text-sm mb-3">{L.noResults}</div>
          {selectedReqs.size > 0 && (
            <button
              onClick={onClearReqs}
              className="px-4 py-2 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 text-sm hover:bg-amber-400/20 transition-colors"
            >
              {L.showAll}
            </button>
          )}
        </div>
      ) : (
        <>
          {["standard","engineering","flexible","specialty"].map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              types={grouped[cat]}
              defaultOpen={false}
              onSelect={onSelect}
              L={L}
            />
          ))}
        </>
      )}

    </div>
  );
}

// ============================================================
// STEP 3 — BRANDS
// ============================================================
function BrandCard({ active, onClick, title, subtitle, badge, badgeColor, rangePreview }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all duration-200 ${
        active
          ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-white text-sm">{title}</div>
        {badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <div className="text-xs text-neutral-400 mb-2">{subtitle}</div>}
      {rangePreview && (
        <div className="text-[11px] text-neutral-500 leading-relaxed">{rangePreview}</div>
      )}
    </button>
  );
}

function Step3Brands({ type, brandChoice, onSelect, L }) {
  const brands = type.brands || [];
  const verified = brands.filter(b => b.is_verified);
  const community = brands.filter(b => !b.is_verified && b.auto_approved);

  function fmtRange(min, max, unit) {
    if (min == null && max == null) return null;
    if (min === max) return `${min}${unit}`;
    return `${min ?? "?"}–${max ?? "?"}${unit}`;
  }
  function brandPreview(b) {
    const parts = [];
    const nozzle = fmtRange(b.nozzle_min, b.nozzle_max, "°C");
    const bed = fmtRange(b.bed_min, b.bed_max, "°C");
    if (nozzle) parts.push(`${L.nozzle}: ${nozzle}`);
    if (bed) parts.push(`${L.bed}: ${bed}`);
    return parts.join(" · ");
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-1">{L.step3Title}</h3>
      <p className="text-xs text-neutral-400 mb-4">{L.step3Hint}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BrandCard
          active={brandChoice === "generic"}
          onClick={() => onSelect("generic", null)}
          title={L.genericParams}
          subtitle={L.genericDesc}
          rangePreview={`${L.nozzle}: ${fmtRange(type.nozzle_min, type.nozzle_max, "°C")} · ${L.bed}: ${fmtRange(type.bed_min, type.bed_max, "°C")}`}
        />
        {verified.map(b => (
          <BrandCard
            key={b.id}
            active={brandChoice === b.id}
            onClick={() => onSelect(b.id, b)}
            title={b.brand}
            subtitle={b.product_name}
            badge={L.verified}
            badgeColor="bg-green-500/20 text-green-300"
            rangePreview={brandPreview(b)}
          />
        ))}
        {community.map(b => (
          <BrandCard
            key={b.id}
            active={brandChoice === b.id}
            onClick={() => onSelect(b.id, b)}
            title={b.brand}
            subtitle={b.product_name}
            badge={L.communityApproved}
            badgeColor="bg-blue-500/20 text-blue-300"
            rangePreview={brandPreview(b)}
          />
        ))}
      </div>

    </div>
  );
}

// ============================================================
// FILAMENT CALCULATOR (inline in step 4)
// ============================================================
function FilamentCalculator({ density, pricePerKg, lang, showEur, L }) {
  const [dimL, setDimL] = useState(50);
  const [dimW, setDimW] = useState(50);
  const [dimH, setDimH] = useState(50);
  const [infill, setInfill] = useState(20);

  const volCm3 = (dimL * dimW * dimH * 0.001) * (0.25 + (infill / 100) * 0.75);
  const massG = density ? parseFloat((volCm3 * density).toFixed(1)) : 0;
  const costPLN = pricePerKg ? (massG / 1000) * pricePerKg : 0;
  const costDisplay = showEur
    ? `${(costPLN / PLN_PER_EUR).toFixed(2)} EUR`
    : `${costPLN.toFixed(2)} PLN`;
  const rollPct = Math.min(100, Math.round((massG / 1000) * 100));

  const sliders = [
    { label: L.calcLength, val: dimL, set: setDimL, min: 1, max: 500, step: 1, unit: "mm" },
    { label: L.calcWidth,  val: dimW, set: setDimW, min: 1, max: 500, step: 1, unit: "mm" },
    { label: L.calcHeight, val: dimH, set: setDimH, min: 1, max: 500, step: 1, unit: "mm" },
    { label: L.calcInfill, val: infill, set: setInfill, min: 5, max: 100, step: 5, unit: "%" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mt-5">
      <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">{L.calcTitle}</div>

      <div className="space-y-3 mb-4">
        {sliders.map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">{s.label}</span>
              <span className="text-white font-medium">{s.val} {s.unit}</span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.val}
              onChange={e => s.set(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center py-1.5">
          <span className="text-neutral-400 text-sm">{L.calcMass}</span>
          <span className="text-white font-bold">{massG} g</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-t border-white/5">
          <span className="text-neutral-400 text-sm">{L.calcCost}</span>
          <span className="text-amber-300 font-bold">{costDisplay}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-t border-white/5">
          <span className="text-neutral-400 text-sm">{L.calcRoll}</span>
          <span className="text-neutral-200 font-semibold">{rollPct}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-amber-400 transition-all duration-300"
            style={{ width: `${rollPct}%` }}
          />
        </div>
        <div className="text-[10px] text-neutral-500 italic mt-2">{L.calcNote}</div>
      </div>
    </div>
  );
}

// ============================================================
// CONTRIBUTION FORM
// ============================================================
function ContributionForm({ typeId, defaultBrand, L }) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(defaultBrand || "");
  const [product, setProduct] = useState("");
  const [nozzleMin, setNozzleMin] = useState("");
  const [nozzleMax, setNozzleMax] = useState("");
  const [bedMin, setBedMin] = useState("");
  const [bedMax, setBedMax] = useState("");
  const [speedMin, setSpeedMin] = useState("");
  const [speedMax, setSpeedMax] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!brand.trim() || !email.trim() || !gdpr) {
      setStatus("error");
      setErrorMsg(L.contribError);
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const body = {
        filament_type_id: typeId,
        brand_name: brand.trim(),
        product_name: product.trim() || null,
        nozzle_min: nozzleMin ? Number(nozzleMin) : null,
        nozzle_max: nozzleMax ? Number(nozzleMax) : null,
        bed_min: bedMin ? Number(bedMin) : null,
        bed_max: bedMax ? Number(bedMax) : null,
        speed_min: speedMin ? Number(speedMin) : null,
        speed_max: speedMax ? Number(speedMax) : null,
        notes: notes.trim() || null,
        contributor_email: email.trim(),
        contributor_name: name.trim() || null,
        gdpr_consent: true,
      };
      const res = await fetch(`${API_BASE}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(L.contribError);
      }
    } catch {
      setStatus("error");
      setErrorMsg(L.contribError);
    }
  }

  if (status === "success") {
    return (
      <div className="mt-5 rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-center">
        <div className="text-green-300 text-sm font-medium">{L.contribSuccess}</div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-neutral-300 hover:border-amber-400/30 hover:text-amber-300 transition-colors"
      >
        {L.contribToggle}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-5"
        >
          <h4 className="text-sm font-bold text-white mb-1">{L.contribTitle}</h4>
          <p className="text-xs text-neutral-400 mb-4">{L.contribDesc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">{L.contribBrand} *</label>
              <input
                value={brand}
                onChange={e => setBrand(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">{L.contribProduct}</label>
              <input
                value={product}
                onChange={e => setProduct(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {[
            { label: L.contribNozzle, min: nozzleMin, max: nozzleMax, setMin: setNozzleMin, setMax: setNozzleMax },
            { label: L.contribBed,    min: bedMin,    max: bedMax,    setMin: setBedMin,    setMax: setBedMax },
            { label: L.contribSpeed,  min: speedMin,  max: speedMax,  setMin: setSpeedMin,  setMax: setSpeedMax },
          ].map(({ label, min, max, setMin, setMax }) => (
            <div key={label} className="mb-3">
              <label className="block text-[11px] text-neutral-400 mb-1">{label}</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                  placeholder={L.rangeMin}
                  className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                />
                <input
                  type="number"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                  placeholder={L.rangeMax}
                  className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}

          <div className="mb-3">
            <label className="block text-[11px] text-neutral-400 mb-1">{L.contribNotes}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">{L.contribName}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">{L.contribEmail}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={gdpr}
              onChange={e => setGdpr(e.target.checked)}
              className="mt-0.5 accent-amber-400 shrink-0"
            />
            <span className="text-[11px] text-neutral-400 leading-tight">{L.contribGdpr}</span>
          </label>

          {errorMsg && (
            <div className="text-[11px] text-red-400 mb-3 text-center">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={status === "sending" || !brand.trim() || !email.trim() || !gdpr}
            className="w-full py-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300 font-medium text-sm hover:bg-amber-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "sending" ? L.contribSending : L.contribSubmit}
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================
// COMMUNITY CONTRIBUTIONS (with voting)
// ============================================================
function CommunityContributions({ typeId, L }) {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [voteStatus, setVoteStatus] = useState({}); // { [id]: "success"|"duplicate"|"error" }

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/contributions?type_id=${typeId}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setList(Array.isArray(d.contributions) ? d.contributions : []);
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [typeId]);

  async function vote(contribId, type) {
    try {
      const res = await fetch(`${API_BASE}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_id: contribId, vote: type }),
      });
      if (res.status === 409) {
        setVoteStatus(s => ({ ...s, [contribId]: "duplicate" }));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setList(prev => prev.map(c => c.id === contribId
          ? { ...c, vote_confirm: data.votes?.vote_confirm ?? c.vote_confirm, vote_dispute: data.votes?.vote_dispute ?? c.vote_dispute }
          : c
        ));
        setVoteStatus(s => ({ ...s, [contribId]: "success" }));
      } else {
        setVoteStatus(s => ({ ...s, [contribId]: "error" }));
      }
    } catch {
      setVoteStatus(s => ({ ...s, [contribId]: "error" }));
    }
  }

  if (!loaded) return null;
  if (!list.length) return null;

  return (
    <div className="mt-5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
        {L.communityContribs} ({list.length})
      </h4>
      <div className="space-y-2">
        {list.map(c => {
          const status = voteStatus[c.id];
          const fmtR = (mn, mx, u) => mn != null || mx != null
            ? `${mn ?? "?"}–${mx ?? "?"}${u}`
            : null;
          const nozzle = fmtR(c.nozzle_min, c.nozzle_max, "°C");
          const bed = fmtR(c.bed_min, c.bed_max, "°C");
          const speed = fmtR(c.speed_min, c.speed_max, " mm/s");
          return (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                <div>
                  <div className="text-sm font-semibold text-white">{c.brand_name}</div>
                  {c.product_name && <div className="text-xs text-neutral-400">{c.product_name}</div>}
                </div>
                <div className="text-[10px] text-neutral-500">
                  <span className="text-green-400">{c.vote_confirm || 0}</span> {L.confirms}
                </div>
              </div>
              <div className="text-[11px] text-neutral-400 mb-2 space-x-2">
                {nozzle && <span>{L.nozzle}: <span className="text-neutral-200">{nozzle}</span></span>}
                {bed && <span>{L.bed}: <span className="text-neutral-200">{bed}</span></span>}
                {speed && <span>{L.speed}: <span className="text-neutral-200">{speed}</span></span>}
              </div>
              {c.notes && <div className="text-[11px] text-neutral-500 italic mb-2">{c.notes}</div>}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => vote(c.id, "confirm")}
                  disabled={status === "duplicate"}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-green-400/30 bg-green-400/10 text-green-300 hover:bg-green-400/20 transition-colors disabled:opacity-40"
                >
                  {L.voteConfirm}
                </button>
                <button
                  onClick={() => vote(c.id, "dispute")}
                  disabled={status === "duplicate"}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20 transition-colors disabled:opacity-40"
                >
                  {L.voteDispute}
                </button>
                {status === "success" && <span className="text-[10px] text-green-400">{L.voteSuccess}</span>}
                {status === "duplicate" && <span className="text-[10px] text-amber-400">{L.voteDuplicate}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================
// STEP 4 — PARAMETERS
// ============================================================
function Step4Parameters({ type, brand, params, lang, showEur, L }) {
  const encLabel = params.enclosure === "no" ? L.encNo : params.enclosure === "recommended" ? L.encRec : L.encReq;
  const encColor = params.enclosure === "no" ? "text-neutral-300" : params.enclosure === "recommended" ? "text-amber-300" : "text-red-300";
  const priceDisplay = showEur
    ? `~${(params.price_per_kg / PLN_PER_EUR).toFixed(0)} EUR/kg`
    : `~${params.price_per_kg} PLN/kg`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-white">{type.name}</h3>
          {brand && (
            <div className="text-xs text-amber-300 mt-0.5">
              {brand.brand}{brand.product_name ? ` · ${brand.product_name}` : ""}
              {brand.is_verified && <span className="ml-2 text-[10px] text-green-400">{L.verified}</span>}
            </div>
          )}
        </div>
        <LegendPopup L={L} />
      </div>

      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.03] p-5">
        {/* Temperatures */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">{L.sectionTemps}</div>
          <div className="space-y-3">
            <RangeBar min={params.nozzle_min} max={params.nozzle_max} scaleMin={150} scaleMax={450} unit="°C" label={L.nozzle} />
            <RangeBar min={params.bed_min} max={params.bed_max} scaleMin={0} scaleMax={200} unit="°C" label={L.bed} />
            <div className="flex justify-between items-center pt-1 text-sm">
              <span className="text-neutral-400 text-xs">{L.tempRes}</span>
              <span className="text-white font-medium text-xs">{params.temp_resistance}°C</span>
            </div>
          </div>
        </div>

        {/* Speed & layers */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">{L.sectionSpeed}</div>
          <div className="space-y-3">
            <RangeBar min={params.speed_min} max={params.speed_max} scaleMin={5} scaleMax={200} unit="mm/s" label={L.speed} />
            <RangeBar min={params.layer_min} max={params.layer_max} scaleMin={0.05} scaleMax={0.50} unit="mm" label={L.layerHeight} />
            <RangeBar min={params.retraction_min} max={params.retraction_max} scaleMin={0} scaleMax={10} unit="mm" label={L.retraction} />
          </div>
        </div>

        {/* Cooling & enclosure */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">{L.sectionEnclosure}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between items-center border-b border-white/5 py-1.5">
              <span className="text-neutral-400 text-xs">{L.cooling}</span>
              <span className="text-white font-medium text-xs">{params.cooling}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 py-1.5">
              <span className="text-neutral-400 text-xs">{L.enclosure}</span>
              <span className={`font-medium text-xs ${encColor}`}>{encLabel}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 py-1.5">
              <span className="text-neutral-400 text-xs">{L.difficulty}</span>
              <DifficultyDots level={params.difficulty} />
            </div>
            <div className="flex justify-between items-center border-b border-white/5 py-1.5">
              <span className="text-neutral-400 text-xs">{L.density}</span>
              <span className="text-white font-medium text-xs">{params.density} g/cm³</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 py-1.5 col-span-2">
              <span className="text-neutral-400 text-xs">{L.priceEst}</span>
              <span className="text-amber-300 font-medium text-xs">{priceDisplay}</span>
            </div>
          </div>
        </div>

        {/* Properties */}
        {params.props && params.props.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">{L.sectionProps}</div>
            <div className="flex flex-wrap gap-1.5">
              {params.props.map(p => <PropChip key={p} prop={p} lang={lang} />)}
            </div>
          </div>
        )}

        {/* Uses */}
        {params.uses && (
          <div className="mb-3 text-xs">
            <span className="font-semibold text-neutral-300">{L.uses}: </span>
            <span className="text-neutral-400 italic">{params.uses}</span>
          </div>
        )}

        {/* Notes */}
        {params.notes && (
          <div className={`text-xs leading-relaxed ${params.difficulty >= 4 ? "text-amber-200/80" : "text-neutral-400"}`}>
            {params.difficulty >= 4 && <span className="mr-1">⚠</span>}
            <span className="font-semibold text-neutral-300">{L.notes}: </span>
            {params.notes}
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <a
            href="https://www.aejaca.com/studio/#calculator"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {L.cta}
          </a>
        </div>
      </div>

      {/* Filament calculator */}
      <FilamentCalculator
        density={params.density}
        pricePerKg={params.price_per_kg}
        lang={lang}
        showEur={showEur}
        L={L}
      />

      {/* Contribution form */}
      <ContributionForm typeId={type.id} defaultBrand={brand?.brand || ""} L={L} />

      {/* Community contributions */}
      <CommunityContributions typeId={type.id} L={L} />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PrintSettings3DCalc() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;
  const showEur = lang === "en" || lang === "de";

  // Data
  const [types, setTypes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wizard state
  const calcRef = useRef(null);
  const [step, setStep] = useState(1);
  const [selectedReqs, setSelectedReqs] = useState(new Set());
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandChoice, setBrandChoice] = useState("generic");

  // Fetch with localStorage cache
  function loadData() {
    setLoading(true);
    setError(null);
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    } catch { cached = null; }

    const fetchFresh = () =>
      fetch(API_BASE)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(d => {
          if (!d || !Array.isArray(d.types)) throw new Error("Invalid payload");
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload: d }));
          } catch { /* quota errors are fine */ }
          setTypes(d.types);
          return d;
        });

    if (cached && cached.payload && Array.isArray(cached.payload.types) && Date.now() - cached.ts < CACHE_TTL_MS) {
      setTypes(cached.payload.types);
      setLoading(false);
      fetchFresh().catch(() => { /* silent background refresh failure */ });
    } else {
      fetchFresh()
        .catch(e => {
          if (cached && cached.payload && Array.isArray(cached.payload.types)) {
            setTypes(cached.payload.types);
          } else {
            setError(e.message || "load failed");
          }
        })
        .finally(() => setLoading(false));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtering
  const filteredTypes = useMemo(() => {
    if (!types) return [];
    if (selectedReqs.size === 0) return types;
    return types.filter(t =>
      REQUIREMENTS.every(r => !selectedReqs.has(r.id) || r.match(t))
    );
  }, [types, selectedReqs]);

  // Merge generic + brand overrides
  const activeParams = useMemo(() => {
    if (!selectedType) return null;
    const base = selectedType;
    const b = selectedBrand;
    const notesKey = `notes_${lang}`;
    const usesKey = `uses_${lang}`;
    return {
      nozzle_min: b?.nozzle_min ?? base.nozzle_min,
      nozzle_max: b?.nozzle_max ?? base.nozzle_max,
      bed_min: b?.bed_min ?? base.bed_min,
      bed_max: b?.bed_max ?? base.bed_max,
      speed_min: b?.speed_min ?? base.speed_min,
      speed_max: b?.speed_max ?? base.speed_max,
      layer_min: base.layer_min,
      layer_max: base.layer_max,
      retraction_min: base.retraction_min,
      retraction_max: base.retraction_max,
      cooling: base.cooling,
      enclosure: base.enclosure,
      difficulty: base.difficulty,
      density: base.density,
      price_per_kg: base.price_per_kg,
      temp_resistance: base.temp_resistance,
      props: base.props || [],
      notes: b
        ? (b[notesKey] || base[notesKey] || "")
        : (base[notesKey] || ""),
      uses: base[usesKey] || "",
    };
  }, [selectedType, selectedBrand, lang]);

  const canNext = useMemo(() => {
    if (step === 1) return selectedReqs.size > 0;
    if (step === 2) return selectedType != null;
    if (step === 3) return true;
    return false;
  }, [step, selectedReqs, selectedType]);

  if (loading && !types) return <LoadingState L={L} />;
  if (error && !types) return <ErrorState L={L} onRetry={loadData} />;
  if (!types) return <LoadingState L={L} />;

  function toggleReq(id) {
    setSelectedReqs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function goToStep(targetStep) {
    setStep(targetStep);
    setTimeout(() => {
      if (calcRef.current) {
        const top = calcRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 50);
  }

  function jumpTo(targetStep) {
    if (targetStep <= step) goToStep(targetStep);
  }

  function handleNext() {
    if (step === 1 && selectedReqs.size > 0) goToStep(2);
    else if (step === 2 && selectedType) goToStep(3);
    else if (step === 3) goToStep(4);
  }

  return (
    <div ref={calcRef} className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
      <WizardProgress step={step} canNext={canNext} onPrev={() => goToStep(step - 1)} onNext={handleNext} onJump={jumpTo} L={L} />
      <BreadcrumbChips
        step={step}
        selectedType={selectedType}
        selectedBrand={selectedBrand}
        brandChoice={brandChoice}
        onJump={jumpTo}
        L={L}
      />

      <div className="p-5">
        {step === 1 && (
          <Step1Requirements
            requirements={REQUIREMENTS}
            selected={selectedReqs}
            onToggle={toggleReq}
            onDeselectAll={() => setSelectedReqs(new Set())}
            onShowAll={() => { setSelectedReqs(new Set()); goToStep(2); }}
            L={L}
          />
        )}

        {step === 2 && (
          <Step2Materials
            types={filteredTypes}
            allTypes={types}
            selectedReqs={selectedReqs}
            onSelect={t => {
              setSelectedType(t);
              setSelectedBrand(null);
              setBrandChoice("generic");
              goToStep(3);
            }}
            onClearReqs={() => setSelectedReqs(new Set())}
            L={L}
          />
        )}

        {step === 3 && selectedType && (
          <Step3Brands
            type={selectedType}
            brandChoice={brandChoice}
            onSelect={(choice, brand) => {
              setBrandChoice(choice);
              setSelectedBrand(brand);
            }}
            L={L}
          />
        )}

        {step === 4 && selectedType && activeParams && (
          <Step4Parameters
            type={selectedType}
            brand={selectedBrand}
            params={activeParams}
            lang={lang}
            showEur={showEur}
            L={L}
          />
        )}
      </div>
    </div>
  );
}
