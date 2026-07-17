// Katalog żywic MSLA (Elegoo Saturn 4 Ultra 16K) - jedno źródło prawdy
// dla kalkulatora zaawansowanego i strony /toolstudio/resin-settings/.
// Ceny detaliczne PLN/kg zweryfikowane rynkowo 2026-07-17 (Allegro / Elegoo EU / 3duv.pl),
// pozycje oznaczone estimated: true to szacunek z klasy materiału.

export const RESIN_SEGMENTS = {
  standard: {
    label: { pl: "Standardowe", en: "Standard", de: "Standard" },
    desc: { pl: "Żywice wizualne i hobbystyczne", en: "Visual and hobby resins", de: "Visuelle und Hobby-Harze" }
  },
  technical: {
    label: { pl: "Techniczne", en: "Technical", de: "Technisch" },
    desc: { pl: "Żywice funkcjonalne i inżynieryjne", en: "Functional and engineering resins", de: "Funktionale und technische Harze" }
  },
  precision: {
    label: { pl: "Precyzyjne i odlewnicze", en: "Precision and castable", de: "Präzision und Gießbar" },
    desc: { pl: "Mikrodetal i wzorce jubilerskie", en: "Micro-detail and jewelry patterns", de: "Mikrodetail und Schmuck-Gussmodelle" }
  }
};

export const RESIN_TYPES = [
  {
    id: "standard",
    segment: "standard",
    price_kg: 120,
    density: 1.1,
    layer_min: 0.025,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 10,
    hardness: "84D",
    difficulty: 1,
    colorable: true,
    label: { pl: "Standard", en: "Standard", de: "Standard" },
    desc: { pl: "Uniwersalna żywica do modeli wizualnych, twarda ale krucha", en: "Universal resin for visual models, hard but brittle", de: "Universalharz für visuelle Modelle, hart aber spröde" },
    applications: { pl: "figurki, prototypy wizualne, modele", en: "figurines, visual prototypes, models", de: "Figuren, visuelle Prototypen, Modelle" }
  },
  {
    id: "water_washable",
    segment: "standard",
    price_kg: 130,
    density: 1.1,
    layer_min: 0.025,
    layer_max: 0.05,
    wash: "water",
    postcure_min: 10,
    hardness: "82D",
    difficulty: 1,
    colorable: true,
    label: { pl: "Water-washable", en: "Water-washable", de: "Wasserwaschbar" },
    desc: { pl: "Mycie wodą zamiast IPA, prostszy post-processing", en: "Washes with water instead of IPA, simpler post-processing", de: "Reinigung mit Wasser statt IPA, einfachere Nachbearbeitung" },
    applications: { pl: "modele, figurki, prototypy", en: "models, figurines, prototypes", de: "Modelle, Figuren, Prototypen" }
  },
  {
    id: "plant_based",
    segment: "standard",
    price_kg: 140,
    density: 1.1,
    layer_min: 0.025,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 10,
    hardness: "80D",
    difficulty: 1,
    colorable: true,
    label: { pl: "Plant-based (eco)", en: "Plant-based (eco)", de: "Pflanzenbasiert (Öko)" },
    desc: { pl: "Na bazie soi, niski zapach, skurcz ok. 3,7%", en: "Soy-based, low odor, shrinkage approx. 3.7%", de: "Auf Sojabasis, geruchsarm, Schrumpfung ca. 3,7%" },
    applications: { pl: "modele, praca w domu i biurze", en: "models, home and office use", de: "Modelle, Heim- und Büroeinsatz" }
  },
  {
    id: "clear",
    segment: "standard",
    price_kg: 130,
    density: 1.1,
    layer_min: 0.025,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 8,
    hardness: "84D",
    difficulty: 2,
    colorable: false,
    label: { pl: "Transparentna (Clear)", en: "Transparent (Clear)", de: "Transparent (Clear)" },
    desc: { pl: "Przezierna po utwardzeniu, wymaga starannego post-cure", en: "Translucent after curing, needs careful post-cure", de: "Nach Aushärtung durchscheinend, sorgfältige Nachhärtung nötig" },
    applications: { pl: "lampy, soczewki, efekty wizualne", en: "lamps, lenses, visual effects", de: "Lampen, Linsen, visuelle Effekte" }
  },
  {
    id: "abs_like",
    segment: "technical",
    price_kg: 160,
    density: 1.1,
    layer_min: 0.05,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 15,
    hardness: "80D",
    difficulty: 2,
    colorable: true,
    label: { pl: "ABS-like 3.0+", en: "ABS-like 3.0+", de: "ABS-like 3.0+" },
    desc: { pl: "Udarna jak ABS, odporna na pęknięcia", en: "Impact-resistant like ABS, crack-resistant", de: "Schlagzäh wie ABS, rissbeständig" },
    applications: { pl: "obudowy, części mechaniczne", en: "housings, mechanical parts", de: "Gehäuse, mechanische Teile" }
  },
  {
    id: "tough",
    segment: "technical",
    price_kg: 150,
    density: 1.1,
    layer_min: 0.05,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 15,
    hardness: "78D",
    difficulty: 2,
    colorable: false,
    label: { pl: "Tough (wytrzymała)", en: "Tough", de: "Tough (robust)" },
    desc: { pl: "Znosi zatrzaski i obciążenia mechaniczne", en: "Handles snap-fits and mechanical loads", de: "Verträgt Schnappverbindungen und mechanische Lasten" },
    applications: { pl: "prototypy funkcjonalne, zatrzaski", en: "functional prototypes, snap-fits", de: "Funktionsprototypen, Schnappverbindungen" }
  },
  {
    id: "flexible",
    segment: "technical",
    price_kg: 320,
    density: 1.1,
    layer_min: 0.05,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 15,
    hardness: "60-70A",
    difficulty: 3,
    colorable: false,
    label: { pl: "Flexible (elastyczna)", en: "Flexible", de: "Flexibel" },
    desc: { pl: "Gumowata, wraca do kształtu po ściśnięciu", en: "Rubber-like, returns to shape after squeezing", de: "Gummiartig, kehrt nach Druck in Form zurück" },
    applications: { pl: "uszczelki, chwyty, elementy giętkie", en: "gaskets, grips, flexible parts", de: "Dichtungen, Griffe, flexible Teile" }
  },
  {
    id: "heat_resistant",
    segment: "technical",
    price_kg: 350,
    density: 1.1,
    estimated: true,
    layer_min: 0.05,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 20,
    hardness: "85D",
    difficulty: 3,
    colorable: false,
    label: { pl: "Heat-resistant", en: "Heat-resistant", de: "Hitzebeständig" },
    desc: { pl: "HDT 150-200 st. C, stabilna przy podwyższonej temperaturze", en: "HDT 150-200 C, stable at elevated temperatures", de: "HDT 150-200 Grad C, stabil bei erhöhten Temperaturen" },
    applications: { pl: "formy, elementy pracujące przy cieple", en: "molds, parts exposed to heat", de: "Formen, wärmebelastete Teile" }
  },
  {
    id: "fast",
    segment: "technical",
    price_kg: 140,
    density: 1.1,
    layer_min: 0.05,
    layer_max: 0.1,
    wash: "ipa",
    postcure_min: 8,
    hardness: "82D",
    difficulty: 1,
    colorable: false,
    label: { pl: "Fast (szybka)", en: "Fast", de: "Fast (schnell)" },
    desc: { pl: "Krótkie czasy naświetlania, szybsze wydruki", en: "Short exposure times, faster prints", de: "Kurze Belichtungszeiten, schnellere Drucke" },
    applications: { pl: "szybkie iteracje, większe serie", en: "quick iterations, larger batches", de: "schnelle Iterationen, größere Serien" }
  },
  {
    id: "high_precision",
    segment: "precision",
    price_kg: 280,
    density: 1.1,
    layer_min: 0.02,
    layer_max: 0.03,
    wash: "ipa",
    postcure_min: 10,
    hardness: "84D",
    difficulty: 3,
    colorable: false,
    label: { pl: "High-precision 14K", en: "High-precision 14K", de: "High-precision 14K" },
    desc: { pl: "Mikrodetal dla drukarek 14K/16K, minimalny skurcz", en: "Micro-detail for 14K/16K printers, minimal shrinkage", de: "Mikrodetail für 14K/16K-Drucker, minimale Schrumpfung" },
    applications: { pl: "miniatury premium, ażur, mikrograwer", en: "premium miniatures, openwork, micro-engraving", de: "Premium-Miniaturen, Durchbruch, Mikrogravur" }
  },
  {
    id: "rigid",
    segment: "precision",
    price_kg: 250,
    density: 1.1,
    estimated: true,
    layer_min: 0.03,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 15,
    hardness: "88D",
    difficulty: 3,
    colorable: false,
    label: { pl: "Rigid / Ceramic-filled", en: "Rigid / Ceramic-filled", de: "Rigid / Keramikgefüllt" },
    desc: { pl: "Sztywna i stabilna wymiarowo, matowa powierzchnia", en: "Stiff and dimensionally stable, matte surface", de: "Steif und maßhaltig, matte Oberfläche" },
    applications: { pl: "wzorce pomiarowe, oprzyrządowanie", en: "measurement patterns, tooling", de: "Messmodelle, Vorrichtungen" }
  },
  {
    id: "castable_xone",
    segment: "precision",
    price_kg: 1399,
    density: 1.1,
    layer_min: 0.03,
    layer_max: 0.05,
    wash: "ipa",
    postcure_min: 30,
    hardness: "n/d (burnout)",
    difficulty: 3,
    colorable: false,
    label: { pl: "Castable BlueCast X-One V2", en: "Castable BlueCast X-One V2", de: "Castable BlueCast X-One V2" },
    desc: { pl: "Wypalanie bez popiołu, do klasycznych wzorców odlewniczych", en: "Ash-free burnout, for classic casting patterns", de: "Rückstandsfreies Ausbrennen, für klassische Gussmodelle" },
    applications: { pl: "wzorce odlewnicze, sygnety, bryły", en: "casting patterns, signet rings, solid forms", de: "Gussmodelle, Siegelringe, massive Formen" }
  },
  {
    id: "castable_xwax",
    segment: "precision",
    price_kg: 1399,
    density: 1.1,
    layer_min: 0.02,
    layer_max: 0.03,
    wash: "ipa",
    postcure_min: 30,
    hardness: "n/d (burnout)",
    difficulty: 3,
    colorable: false,
    label: { pl: "Castable BlueCast X-Wax Filigree", en: "Castable BlueCast X-Wax Filigree", de: "Castable BlueCast X-Wax Filigree" },
    desc: { pl: "Wosko-żywica do filigranu i cienkich ścianek", en: "Wax-resin for filigree and thin walls", de: "Wachsharz für Filigran und dünne Wände" },
    applications: { pl: "filigran, ażur, cienkie ścianki", en: "filigree, openwork, thin walls", de: "Filigran, Durchbruch, dünne Wände" }
  }
];

export const RESIN_COLORS = ["Grey", "Black", "White", "Clear", "Beige", "Blue", "Clear Blue", "Clear Green", "Clear Red", "Translucent", "Yellow", "Mint Green", "Smoky Black", "Maroon", "Neon-Lime", "Neon-Lemon", "Neon-Peach", "Neon-Pumpkin"];

export function getResinsBySegment(segmentKey) {
  return RESIN_TYPES.filter(r => r.segment === segmentKey);
}

export function getResin(id) {
  return RESIN_TYPES.find(r => r.id === id) || null;
}
