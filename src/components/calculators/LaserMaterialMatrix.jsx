// ============================================================
// LASER MATERIAL MATRIX — interactive reference tool
// Step 1: Action → Step 2: Laser category + wattage →
// Step 3: Delivery system → Filtered parameter table
// ============================================================
import { useState, useMemo } from "react";
import { Chips } from "./calcShared.jsx";

// ---------------------------------------------------------------------------
// i18n helpers
// ---------------------------------------------------------------------------
function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const ACTIONS = [
  { id: "cut",       label: { pl: "Cięcie",           en: "Cutting",            de: "Schneiden" } },
  { id: "engrave",   label: { pl: "Grawerowanie",     en: "Engraving",          de: "Gravur" } },
  { id: "engrave25", label: { pl: "Obrazy 2.5D",      en: "2.5D Relief",        de: "2.5D-Relief" } },
  { id: "engrave3d", label: { pl: "Grawer 3D (szkło)",en: "3D Glass Engraving", de: "3D-Glasgravur" } },
];

// Which laser categories are valid for each action
const ACTION_LASER_MAP = {
  cut:       ["co2", "fiber", "diode"],
  engrave:   ["co2", "fiber", "ir", "diode", "uv"],
  engrave25: ["co2", "fiber", "ir", "diode", "uv"],
  engrave3d: ["fiber", "uv"],
};

const LASER_CATEGORIES = [
  { id: "co2",   label: "CO₂",      color: "blue"    },
  { id: "fiber", label: "Fiber",    color: "emerald" },
  { id: "ir",    label: "IR Diode", color: "emerald" },
  { id: "diode", label: "Diode",    color: "blue"    },
  { id: "uv",    label: "UV",       color: "blue"    },
];

const LASER_WATTAGES = {
  co2:   [10, 20, 40, 55, 60, 80, 100, 130],
  fiber: [20, 30, 50, 100],
  ir:    [10, 20, 30],
  diode: [5, 10, 20, 40],
  uv:    [3, 5, 10],
};

const LENSES = [
  { id: "110", label: "F-Theta 110mm" },
  { id: "163", label: "F-Theta 163mm" },
  { id: "254", label: "F-Theta 254mm" },
  { id: "330", label: "F-Theta 330mm" },
];

const DELIVERY_OPTIONS = [
  { id: "std",   label: { pl: "Standardowa (prowadnica XY)", en: "Standard (XY gantry)",   de: "Standard (XY-Achse)" } },
  { id: "galvo", label: { pl: "Galvo",                       en: "Galvo",                  de: "Galvo" } },
];

// ---------------------------------------------------------------------------
// Material labels
// ---------------------------------------------------------------------------
const MAT_LABELS = {
  plywood:     { pl: "Sklejka",           en: "Plywood",         de: "Sperrholz" },
  acrylic:     { pl: "Akryl",             en: "Acrylic",         de: "Acryl" },
  leather:     { pl: "Skóra",             en: "Leather",         de: "Leder" },
  fabric:      { pl: "Tkanina",           en: "Fabric",          de: "Textil" },
  mdf:         { pl: "MDF",               en: "MDF",             de: "MDF" },
  cardboard:   { pl: "Tektura",           en: "Cardboard",       de: "Pappe" },
  glass:       { pl: "Szkło",             en: "Glass",           de: "Glas" },
  crystal:     { pl: "Kryształ",          en: "Crystal",         de: "Kristall" },
  steel:       { pl: "Stal nierdzewna",   en: "Stainless Steel", de: "Edelstahl" },
  aluminum:    { pl: "Aluminium",         en: "Aluminum",        de: "Aluminium" },
  brass:       { pl: "Mosiądz",           en: "Brass",           de: "Messing" },
  copper:      { pl: "Miedź",             en: "Copper",          de: "Kupfer" },
  titanium:    { pl: "Tytan",             en: "Titanium",        de: "Titan" },
  silver:      { pl: "Srebro",            en: "Silver",          de: "Silber" },
  gold:        { pl: "Złoto",             en: "Gold",            de: "Gold" },
  stone:       { pl: "Kamień",            en: "Stone",           de: "Stein" },
  slate:       { pl: "Łupek",             en: "Slate",           de: "Schiefer" },
  ceramic:     { pl: "Ceramika",          en: "Ceramics",        de: "Keramik" },
  cork:        { pl: "Korek",             en: "Cork",            de: "Kork" },
  rubber:      { pl: "Guma",              en: "Rubber",          de: "Gummi" },
  foam:        { pl: "Pianka",            en: "Foam",            de: "Schaum" },
  wood:        { pl: "Drewno lite",       en: "Solid Wood",      de: "Massivholz" },
  plastic_abs: { pl: "Plastik ABS",       en: "ABS Plastic",     de: "ABS-Kunststoff" },
  plastic_pc:  { pl: "Poliwęglan",        en: "Polycarbonate",   de: "Polycarbonat" },
};

// ---------------------------------------------------------------------------
// Dataset — ~80 entries
// ---------------------------------------------------------------------------
const MATRIX = [
  // ── CO2 — Cutting (std) ──────────────────────────────────────────────────
  { action:"cut", mat:"plywood",   subtype:{pl:"sosna/brzoza 3mm",      en:"pine/birch 3mm",       de:"Kiefer/Birke 3mm"},    thick:3,   laserType:"co2",   minWatts:40,  delivery:"std",   power:65,  speed:18,  passes:1, airAssist:80,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"dobry nadmuch, bez zatrzymań",     en:"good airflow, no stops",         de:"guter Luftstrom, keine Pausen"} },
  { action:"cut", mat:"plywood",   subtype:{pl:"brzoza 6mm",            en:"birch 6mm",            de:"Birke 6mm"},            thick:6,   laserType:"co2",   minWatts:60,  delivery:"std",   power:80,  speed:10,  passes:2, airAssist:90,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"2 przejścia z nadmuchem",          en:"2 passes with air assist",       de:"2 Durchgänge mit Luftunterstützung"} },
  { action:"cut", mat:"plywood",   subtype:{pl:"brzoza 12mm",           en:"birch 12mm",           de:"Birke 12mm"},           thick:12,  laserType:"co2",   minWatts:100, delivery:"std",   power:90,  speed:6,   passes:3, airAssist:100, frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"wymaga mocnego lasera",            en:"requires high-power laser",      de:"benötigt starken Laser"} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany (cast) 3mm",       en:"cast 3mm",             de:"gegossen 3mm"},         thick:3,   laserType:"co2",   minWatts:40,  delivery:"std",   power:70,  speed:15,  passes:1, airAssist:60,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"cast acrylic, nie wytłaczany",    en:"cast acrylic, not extruded",     de:"gegossen, nicht extrudiert"} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany (cast) 6mm",       en:"cast 6mm",             de:"gegossen 6mm"},         thick:6,   laserType:"co2",   minWatts:60,  delivery:"std",   power:85,  speed:8,   passes:1, airAssist:70,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany (cast) 10mm",      en:"cast 10mm",            de:"gegossen 10mm"},        thick:10,  laserType:"co2",   minWatts:80,  delivery:"std",   power:95,  speed:5,   passes:2, airAssist:80,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"wolny feed",                       en:"slow feed",                      de:"langsam"} },
  { action:"cut", mat:"mdf",       subtype:{pl:"standard 3mm",          en:"standard 3mm",         de:"Standard 3mm"},         thick:3,   laserType:"co2",   minWatts:40,  delivery:"std",   power:65,  speed:18,  passes:1, airAssist:85,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"mdf",       subtype:{pl:"standard 6mm",          en:"standard 6mm",         de:"Standard 6mm"},         thick:6,   laserType:"co2",   minWatts:60,  delivery:"std",   power:82,  speed:10,  passes:2, airAssist:90,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm",         en:"natural 2mm",          de:"natürlich 2mm"},        thick:2,   laserType:"co2",   minWatts:20,  delivery:"std",   power:40,  speed:30,  passes:1, airAssist:50,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"gruba 4mm",             en:"thick 4mm",            de:"dick 4mm"},             thick:4,   laserType:"co2",   minWatts:40,  delivery:"std",   power:60,  speed:18,  passes:1, airAssist:60,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna/jeans",         en:"cotton/denim",         de:"Baumwolle/Jeans"},      thick:1,   laserType:"co2",   minWatts:10,  delivery:"std",   power:25,  speed:50,  passes:1, airAssist:30,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"filc 3mm",              en:"felt 3mm",             de:"Filz 3mm"},             thick:3,   laserType:"co2",   minWatts:10,  delivery:"std",   power:35,  speed:35,  passes:1, airAssist:20,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"foam",      subtype:{pl:"EVA 5mm",               en:"EVA foam 5mm",         de:"EVA-Schaum 5mm"},       thick:5,   laserType:"co2",   minWatts:20,  delivery:"std",   power:30,  speed:40,  passes:1, airAssist:0,   frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"bez nadmuchu — rozwiewa materiał", en:"no air — blows material",        de:"kein Luft — bläst Material weg"} },
  { action:"cut", mat:"foam",      subtype:{pl:"EVA 10mm",              en:"EVA foam 10mm",        de:"EVA-Schaum 10mm"},      thick:10,  laserType:"co2",   minWatts:20,  delivery:"std",   power:40,  speed:25,  passes:1, airAssist:0,   frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"rubber",    subtype:{pl:"kauczuk 3mm",           en:"rubber 3mm",           de:"Gummi 3mm"},            thick:3,   laserType:"co2",   minWatts:40,  delivery:"std",   power:55,  speed:20,  passes:1, airAssist:80,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{pl:"mocna wentylacja!",               en:"strong ventilation!",            de:"starke Lüftung!"} },
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 3mm",           en:"cardboard 3mm",        de:"Pappe 3mm"},            thick:3,   laserType:"co2",   minWatts:10,  delivery:"std",   power:50,  speed:25,  passes:1, airAssist:40,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cork",      subtype:{pl:"korek 5mm",             en:"cork 5mm",             de:"Kork 5mm"},             thick:5,   laserType:"co2",   minWatts:20,  delivery:"std",   power:45,  speed:30,  passes:1, airAssist:30,  frequency:null, wobble:null,  dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── CO2 — Engraving std ──────────────────────────────────────────────────
  { action:"engrave", mat:"wood",     subtype:{pl:"lita sosna/brzoza",   en:"solid pine/birch",    de:"Massivholz"},           thick:null, laserType:"co2",  minWatts:20,  delivery:"std",   power:25,  speed:400, passes:1, airAssist:20,  frequency:null, wobble:null, dpi:300,  hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood",  subtype:{pl:"sklejka brzozowa",    en:"birch plywood",       de:"Birkensperrholz"},      thick:null, laserType:"co2",  minWatts:20,  delivery:"std",   power:30,  speed:350, passes:1, airAssist:20,  frequency:null, wobble:null, dpi:300,  hatch:true,  scanAngle:null, note:{} },
  { action:"engrave", mat:"acrylic",  subtype:{pl:"lany",                en:"cast",                de:"gegossen"},             thick:null, laserType:"co2",  minWatts:20,  delivery:"std",   power:20,  speed:300, passes:1, airAssist:10,  frequency:null, wobble:null, dpi:254,  hatch:false, scanAngle:null, note:{pl:"niski % mocy dla kontrastu",   en:"low power for contrast",         de:"niedrige Leistung für Kontrast"} },
  { action:"engrave", mat:"leather",  subtype:{pl:"naturalna",           en:"natural",             de:"natürlich"},            thick:null, laserType:"co2",  minWatts:10,  delivery:"std",   power:18,  speed:300, passes:1, airAssist:20,  frequency:null, wobble:null, dpi:300,  hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"glass",    subtype:{pl:"hartowane",           en:"tempered",            de:"gehärtet"},             thick:null, laserType:"co2",  minWatts:20,  delivery:"std",   power:20,  speed:200, passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300,  hatch:false, scanAngle:null, note:{pl:"tylko powierzchniowe matowienie",en:"surface frosting only",         de:"nur Oberflächenmattierung"} },
  { action:"engrave", mat:"ceramic",  subtype:{pl:"biała płytka",        en:"white tile",          de:"Weißfliese"},           thick:null, laserType:"co2",  minWatts:30,  delivery:"std",   power:65,  speed:100, passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300,  hatch:false, scanAngle:null, note:{pl:"metoda Nortonów lub farba",    en:"Norton method or paint",         de:"Norton-Methode oder Farbe"} },
  { action:"engrave", mat:"slate",    subtype:{pl:"łupek",               en:"slate",               de:"Schiefer"},             thick:null, laserType:"co2",  minWatts:20,  delivery:"std",   power:60,  speed:100, passes:1, airAssist:0,   frequency:null, wobble:null, dpi:254,  hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"cork",     subtype:{pl:"korek",               en:"cork",                de:"Kork"},                 thick:null, laserType:"co2",  minWatts:10,  delivery:"std",   power:20,  speed:300, passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300,  hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"rubber",   subtype:{pl:"stempel gumowy",      en:"rubber stamp",        de:"Gummistempel"},         thick:null, laserType:"co2",  minWatts:20,  delivery:"std",   power:35,  speed:250, passes:1, airAssist:30,  frequency:null, wobble:null, dpi:500,  hatch:true,  scanAngle:null, note:{pl:"wysoka DPI dla detali",        en:"high DPI for details",           de:"hohe DPI für Details"} },

  // ── CO2 — Engraving galvo ────────────────────────────────────────────────
  { action:"engrave", mat:"wood",     subtype:{pl:"lita/sklejka",        en:"solid/plywood",       de:"Massivholz"},           thick:null, laserType:"co2",  minWatts:30,  delivery:"galvo", power:30,  speed:2000, passes:1, airAssist:null, frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{pl:"galvo CO2 — duża prędkość",   en:"galvo CO2 — high speed",         de:"Galvo CO2 — hohe Geschwindigkeit"} },
  { action:"engrave", mat:"acrylic",  subtype:{pl:"lany",                en:"cast",                de:"gegossen"},             thick:null, laserType:"co2",  minWatts:30,  delivery:"galvo", power:22,  speed:1500, passes:1, airAssist:null, frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"glass",    subtype:{pl:"szkło zwykłe",        en:"plain glass",         de:"Normalglas"},           thick:null, laserType:"co2",  minWatts:30,  delivery:"galvo", power:18,  speed:1800, passes:1, airAssist:null, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },

  // ── Fiber — Cutting std ──────────────────────────────────────────────────
  { action:"cut", mat:"steel",     subtype:{pl:"stal nierdzewna 0.5mm", en:"stainless 0.5mm",    de:"Edelstahl 0.5mm"},      thick:0.5, laserType:"fiber", minWatts:20,  delivery:"std",   power:100, speed:800,  passes:1, airAssist:90,  frequency:20,   wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",     subtype:{pl:"stal nierdzewna 1mm",  en:"stainless 1mm",       de:"Edelstahl 1mm"},        thick:1,   laserType:"fiber", minWatts:50,  delivery:"std",   power:100, speed:400,  passes:1, airAssist:100, frequency:20,   wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",     subtype:{pl:"stal nierdzewna 2mm",  en:"stainless 2mm",       de:"Edelstahl 2mm"},        thick:2,   laserType:"fiber", minWatts:100, delivery:"std",   power:100, speed:200,  passes:2, airAssist:100, frequency:15,   wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"aluminum",  subtype:{pl:"aluminium 1mm",        en:"aluminum 1mm",        de:"Aluminium 1mm"},        thick:1,   laserType:"fiber", minWatts:50,  delivery:"std",   power:100, speed:600,  passes:1, airAssist:100, frequency:20,   wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"brass",     subtype:{pl:"mosiądz 0.5mm",        en:"brass 0.5mm",         de:"Messing 0.5mm"},        thick:0.5, laserType:"fiber", minWatts:20,  delivery:"std",   power:100, speed:500,  passes:1, airAssist:90,  frequency:25,   wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"brass",     subtype:{pl:"mosiądz 1mm",          en:"brass 1mm",           de:"Messing 1mm"},          thick:1,   laserType:"fiber", minWatts:50,  delivery:"std",   power:100, speed:300,  passes:2, airAssist:100, frequency:20,   wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"copper",    subtype:{pl:"miedź 0.5mm",          en:"copper 0.5mm",        de:"Kupfer 0.5mm"},         thick:0.5, laserType:"fiber", minWatts:50,  delivery:"std",   power:100, speed:400,  passes:1, airAssist:90,  frequency:25,   wobble:false, dpi:null, hatch:null, scanAngle:null, note:{pl:"trudna w cięciu",               en:"challenging to cut",             de:"schwierig zu schneiden"} },
  { action:"cut", mat:"titanium",  subtype:{pl:"tytan 0.5mm",          en:"titanium 0.5mm",      de:"Titan 0.5mm"},          thick:0.5, laserType:"fiber", minWatts:30,  delivery:"std",   power:100, speed:600,  passes:1, airAssist:80,  frequency:20,   wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── Fiber — Cutting galvo ────────────────────────────────────────────────
  { action:"cut", mat:"steel",     subtype:{pl:"stal nierdzewna 0.3mm", en:"stainless 0.3mm",    de:"Edelstahl 0.3mm"},      thick:0.3, laserType:"fiber", minWatts:20,  delivery:"galvo", power:100, speed:300,  passes:1, airAssist:null, frequency:30,  wobble:false, dpi:null, hatch:null, scanAngle:null, note:{pl:"galvo fiber — cienka blacha",   en:"galvo fiber — thin sheet",       de:"Galvo Fiber — dünnes Blech"} },
  { action:"cut", mat:"brass",     subtype:{pl:"mosiądz 0.3mm",        en:"brass 0.3mm",         de:"Messing 0.3mm"},        thick:0.3, laserType:"fiber", minWatts:20,  delivery:"galvo", power:100, speed:250,  passes:1, airAssist:null, frequency:30,  wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── Fiber — Engraving std ────────────────────────────────────────────────
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",      en:"stainless steel",    de:"Edelstahl"},            thick:null, laserType:"fiber", minWatts:20, delivery:"std",   power:80,  speed:1500, passes:1, airAssist:null, frequency:50,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"hatch 45° dla równomierności",  en:"hatch 45° for uniformity",       de:"Hatch 45° für Gleichmäßigkeit"} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",  en:"anodized aluminum",  de:"eloxiertes Aluminium"}, thick:null, laserType:"fiber", minWatts:20, delivery:"std",   power:60,  speed:2000, passes:1, airAssist:null, frequency:60,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{pl:"usunięcie anodowania",          en:"anodizing removal",              de:"Eloxierung entfernen"} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",              en:"brass",               de:"Messing"},              thick:null, laserType:"fiber", minWatts:20, delivery:"std",   power:90,  speed:800,  passes:1, airAssist:null, frequency:30,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"copper",   subtype:{pl:"miedź",                en:"copper",              de:"Kupfer"},               thick:null, laserType:"fiber", minWatts:30, delivery:"std",   power:100, speed:600,  passes:1, airAssist:null, frequency:25,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",                en:"titanium",            de:"Titan"},                thick:null, laserType:"fiber", minWatts:20, delivery:"std",   power:70,  speed:1000, passes:1, airAssist:null, frequency:40,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"kolorowe oznakowanie przy niskiej mocy", en:"color marking at low power", de:"Farbmarkierung bei niedriger Leistung"} },
  { action:"engrave", mat:"silver",   subtype:{pl:"srebro 925",           en:"sterling silver",     de:"Sterlingsilber"},       thick:null, laserType:"fiber", minWatts:20, delivery:"std",   power:50,  speed:1200, passes:1, airAssist:null, frequency:50,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{pl:"znakowanie delikatne",          en:"gentle marking",                 de:"schonende Markierung"} },
  { action:"engrave", mat:"gold",     subtype:{pl:"złoto 14k",            en:"gold 14k",            de:"Gold 14k"},             thick:null, laserType:"fiber", minWatts:20, delivery:"std",   power:45,  speed:1500, passes:1, airAssist:null, frequency:50,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"stone",    subtype:{pl:"granit/marmur",        en:"granite/marble",      de:"Granit/Marmor"},        thick:null, laserType:"fiber", minWatts:30, delivery:"std",   power:80,  speed:600,  passes:1, airAssist:null, frequency:30,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"ceramic",  subtype:{pl:"ceramika",             en:"ceramics",            de:"Keramik"},              thick:null, laserType:"fiber", minWatts:30, delivery:"std",   power:75,  speed:800,  passes:1, airAssist:null, frequency:35,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },

  // ── Fiber — Engraving galvo ──────────────────────────────────────────────
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",      en:"stainless steel",    de:"Edelstahl"},            thick:null, laserType:"fiber", minWatts:20, delivery:"galvo", power:70,  speed:3000, passes:1, airAssist:null, frequency:50,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"galvo — bardzo szybko",         en:"galvo — very fast",              de:"Galvo — sehr schnell"} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",  en:"anodized aluminum",  de:"eloxiertes Aluminium"}, thick:null, laserType:"fiber", minWatts:20, delivery:"galvo", power:55,  speed:4000, passes:1, airAssist:null, frequency:60,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",              en:"brass",               de:"Messing"},              thick:null, laserType:"fiber", minWatts:20, delivery:"galvo", power:85,  speed:2000, passes:1, airAssist:null, frequency:30,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",                en:"titanium",            de:"Titan"},                thick:null, laserType:"fiber", minWatts:20, delivery:"galvo", power:65,  speed:2500, passes:1, airAssist:null, frequency:40,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"silver",   subtype:{pl:"srebro",               en:"silver",              de:"Silber"},               thick:null, laserType:"fiber", minWatts:20, delivery:"galvo", power:45,  speed:3000, passes:1, airAssist:null, frequency:50,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },

  // ── Diode — Cutting std ──────────────────────────────────────────────────
  { action:"cut", mat:"plywood",  subtype:{pl:"cienka sklejka 3mm",     en:"thin plywood 3mm",    de:"dünnes Sperrholz 3mm"}, thick:3,   laserType:"diode", minWatts:10,  delivery:"std",   power:100, speed:10,   passes:2, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{pl:"wiele przejść powolnych",       en:"multiple slow passes",           de:"mehrere langsame Durchgänge"} },
  { action:"cut", mat:"plywood",  subtype:{pl:"sklejka 5mm",            en:"plywood 5mm",         de:"Sperrholz 5mm"},        thick:5,   laserType:"diode", minWatts:20,  delivery:"std",   power:100, speed:8,    passes:3, airAssist:90,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",  subtype:{pl:"naturalna 2mm",          en:"natural 2mm",         de:"natürlich 2mm"},        thick:2,   laserType:"diode", minWatts:5,   delivery:"std",   power:85,  speed:15,   passes:2, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cardboard",subtype:{pl:"tektura 2mm",            en:"cardboard 2mm",       de:"Pappe 2mm"},            thick:2,   laserType:"diode", minWatts:5,   delivery:"std",   power:70,  speed:25,   passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",   subtype:{pl:"bawełna",                en:"cotton",              de:"Baumwolle"},            thick:1,   laserType:"diode", minWatts:5,   delivery:"std",   power:65,  speed:30,   passes:1, airAssist:20,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── Diode — Engraving std ────────────────────────────────────────────────
  { action:"engrave", mat:"wood",     subtype:{pl:"lite drewno",         en:"solid wood",          de:"Massivholz"},           thick:null, laserType:"diode", minWatts:5,  delivery:"std",   power:50,  speed:3000, passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather",  subtype:{pl:"naturalna",           en:"natural",             de:"natürlich"},            thick:null, laserType:"diode", minWatts:5,  delivery:"std",   power:40,  speed:2500, passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"anodowane czarne",    en:"black anodized",      de:"schwarz eloxiert"},     thick:null, laserType:"diode", minWatts:20, delivery:"std",   power:80,  speed:1000, passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"wymaga min 20W diody",          en:"requires min 20W diode",         de:"benötigt min 20W Diode"} },
  { action:"engrave", mat:"cork",     subtype:{pl:"korek",               en:"cork",                de:"Kork"},                 thick:null, laserType:"diode", minWatts:5,  delivery:"std",   power:35,  speed:2500, passes:1, airAssist:5,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"slate",    subtype:{pl:"łupek",               en:"slate",               de:"Schiefer"},             thick:null, laserType:"diode", minWatts:20, delivery:"std",   power:75,  speed:800,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },

  // ── UV — Engraving galvo ─────────────────────────────────────────────────
  { action:"engrave", mat:"glass",       subtype:{pl:"szkło sodowo-wapniowe",en:"soda-lime glass",  de:"Kalk-Natron-Glas"},     thick:null, laserType:"uv", minWatts:3,  delivery:"galvo", power:60,  speed:500,  passes:1, airAssist:null, frequency:30,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{pl:"UV galvo — głęboka grawitacja powierzchniowa", en:"UV galvo — deep surface engraving", de:"UV Galvo — tiefe Oberflächengravur"} },
  { action:"engrave", mat:"crystal",     subtype:{pl:"kryształ",           en:"crystal",            de:"Kristall"},             thick:null, laserType:"uv", minWatts:5,  delivery:"galvo", power:70,  speed:400,  passes:1, airAssist:null, frequency:25,  wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"plastic_abs", subtype:{pl:"ABS biały",          en:"white ABS",          de:"weißes ABS"},           thick:null, laserType:"uv", minWatts:3,  delivery:"galvo", power:40,  speed:600,  passes:1, airAssist:null, frequency:30,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"plastic_pc",  subtype:{pl:"Poliwęglan",         en:"Polycarbonate",      de:"Polycarbonat"},         thick:null, laserType:"uv", minWatts:3,  delivery:"galvo", power:35,  speed:700,  passes:1, airAssist:null, frequency:30,  wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },

  // ── Fiber/UV — 3D Glass Engraving (engrave3d, galvo) ────────────────────
  { action:"engrave3d", mat:"crystal", subtype:{pl:"kryształ optyczny",              en:"optical crystal",           de:"optisches Kristall"},    thick:null, laserType:"uv",    minWatts:5,  delivery:"galvo", power:65,  speed:200, passes:3, airAssist:null, frequency:20,  wobble:null, dpi:600, hatch:true,  scanAngle:45, note:{pl:"warstwy 3D — wiele przejść na głębokości",      en:"3D layers — multiple depth passes",      de:"3D-Schichten — mehrere Tiefendurchgänge"} },
  { action:"engrave3d", mat:"glass",   subtype:{pl:"szkło borokrzemowe",             en:"borosilicate glass",        de:"Borosilikatglas"},        thick:null, laserType:"uv",    minWatts:5,  delivery:"galvo", power:75,  speed:150, passes:3, airAssist:null, frequency:15,  wobble:null, dpi:600, hatch:true,  scanAngle:45, note:{pl:"wymaga precyzyjnego ogniskowania Z",             en:"requires precise Z-focus",               de:"erfordert präzise Z-Fokussierung"} },
  { action:"engrave3d", mat:"crystal", subtype:{pl:"kryształ optyczny — Fiber IR",   en:"optical crystal — Fiber IR",de:"Optisches Kristall — Fiber IR"}, thick:null, laserType:"fiber", minWatts:20, delivery:"galvo", power:80, speed:300, passes:3, airAssist:null, frequency:30, wobble:null, dpi:600, hatch:true, scanAngle:45, note:{pl:"fiber IR 1064nm dla kryształów",  en:"fiber IR 1064nm for crystals",           de:"Fiber IR 1064nm für Kristalle"} },

  // ── CO2 — 2.5D Relief std ────────────────────────────────────────────────
  { action:"engrave25", mat:"wood",    subtype:{pl:"lite drewno",         en:"solid wood",          de:"Massivholz"},           thick:null, laserType:"co2",  minWatts:40, delivery:"std",   power:40,  speed:200,  passes:1, airAssist:15,  frequency:null, wobble:null, dpi:254, hatch:true,  scanAngle:null, note:{pl:"mapa głębokości z szarości",    en:"depth map from grayscale",       de:"Tiefenkarte aus Graustufen"} },
  { action:"engrave25", mat:"plywood", subtype:{pl:"sklejka",             en:"plywood",             de:"Sperrholz"},            thick:null, laserType:"co2",  minWatts:40, delivery:"std",   power:45,  speed:180,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:254, hatch:true,  scanAngle:null, note:{} },
  { action:"engrave25", mat:"acrylic", subtype:{pl:"lany",                en:"cast",                de:"gegossen"},             thick:null, laserType:"co2",  minWatts:40, delivery:"std",   power:35,  speed:150,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{pl:"podświetlany efekt 3D",         en:"backlit 3D effect",              de:"hinterbeleuchteter 3D-Effekt"} },
  { action:"engrave25", mat:"mdf",     subtype:{pl:"MDF",                 en:"MDF",                 de:"MDF"},                  thick:null, laserType:"co2",  minWatts:40, delivery:"std",   power:50,  speed:160,  passes:1, airAssist:15,  frequency:null, wobble:null, dpi:254, hatch:true,  scanAngle:null, note:{} },
  { action:"engrave25", mat:"foam",    subtype:{pl:"gąbka PUR",           en:"PUR foam",            de:"PUR-Schaum"},           thick:null, laserType:"co2",  minWatts:20, delivery:"std",   power:25,  speed:300,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{} },
];

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------
const UI = {
  pl: {
    stepAction:      "Krok 1 — Rodzaj operacji",
    stepLaser:       "Krok 2 — Typ lasera i moc",
    stepDelivery:    "Krok 3 — System prowadzenia",
    wattNote:        "Wyniki poniżej odnoszą się do wybranej mocy nominalnej urządzenia.",
    lensLabel:       "Obiektyw F-Theta:",
    lensNote:        "Wybór obiektywu wpływa na pole robocze, nie na parametry cięcia/graweru.",
    noData:          "Brak danych dla tej kombinacji.",
    colMat:          "Materiał",
    colSubtype:      "Wariant",
    colPower:        "Moc (%)",
    colSpeed:        "Prędkość (mm/s)",
    colPasses:       "Przejścia",
    colThick:        "Grubość (mm)",
    colAirAssist:    "Nadmuch (%)",
    colFreq:         "Częstotliwość (kHz)",
    colWobble:       "Wobble",
    colDpi:          "Rozdzielczość (DPI)",
    colHatch:        "Hatch fill",
    colScanAngle:    "Kąt skanowania (°)",
    colNote:         "Uwagi",
    yes:             "Tak",
    no:              "Nie",
    disclaimer:      "Parametry orientacyjne dla maszyn typowych. Mogą się różnić w zależności od producenta, kondycji optyki i materiału.",
    ctaText:         "Potrzebujesz wyceny laserowania?",
    ctaLink:         "Kalkulator sTuDiO",
    selectWattage:   "Wybierz moc lasera:",
  },
  en: {
    stepAction:      "Step 1 — Operation type",
    stepLaser:       "Step 2 — Laser type & wattage",
    stepDelivery:    "Step 3 — Delivery system",
    wattNote:        "Results below refer to the selected nominal wattage.",
    lensLabel:       "F-Theta lens:",
    lensNote:        "Lens choice affects working area, not cutting/engraving parameters.",
    noData:          "No data for this combination.",
    colMat:          "Material",
    colSubtype:      "Variant",
    colPower:        "Power (%)",
    colSpeed:        "Speed (mm/s)",
    colPasses:       "Passes",
    colThick:        "Thickness (mm)",
    colAirAssist:    "Air Assist (%)",
    colFreq:         "Frequency (kHz)",
    colWobble:       "Wobble",
    colDpi:          "Resolution (DPI)",
    colHatch:        "Hatch fill",
    colScanAngle:    "Scan Angle (°)",
    colNote:         "Notes",
    yes:             "Yes",
    no:              "No",
    disclaimer:      "Reference parameters for typical machines. May vary by manufacturer, optics condition, and material.",
    ctaText:         "Need a laser cutting quote?",
    ctaLink:         "sTuDiO Calculator",
    selectWattage:   "Select laser wattage:",
  },
  de: {
    stepAction:      "Schritt 1 — Operationstyp",
    stepLaser:       "Schritt 2 — Lasertyp & Leistung",
    stepDelivery:    "Schritt 3 — Führungssystem",
    wattNote:        "Ergebnisse beziehen sich auf die gewählte Nennleistung.",
    lensLabel:       "F-Theta-Objektiv:",
    lensNote:        "Die Objektivwahl beeinflusst das Arbeitsfeld, nicht die Schneid-/Gravurparameter.",
    noData:          "Keine Daten für diese Kombination.",
    colMat:          "Material",
    colSubtype:      "Variante",
    colPower:        "Leistung (%)",
    colSpeed:        "Geschw. (mm/s)",
    colPasses:       "Durchgänge",
    colThick:        "Stärke (mm)",
    colAirAssist:    "Luftunterstützung (%)",
    colFreq:         "Frequenz (kHz)",
    colWobble:       "Wobble",
    colDpi:          "Auflösung (DPI)",
    colHatch:        "Hatch fill",
    colScanAngle:    "Scanwinkel (°)",
    colNote:         "Hinweise",
    yes:             "Ja",
    no:              "Nein",
    disclaimer:      "Richtwerte für typische Maschinen. Können je nach Hersteller, Optikzustand und Material variieren.",
    ctaText:         "Benötigen Sie ein Laser-Angebot?",
    ctaLink:         "sTuDiO-Rechner",
    selectWattage:   "Laserleistung wählen:",
  },
};

// Laser category color mapping
const LASER_COLOR = {
  co2:   { active: "bg-blue-500 text-white border-blue-500",   inactive: "border-blue-400/40 text-blue-300 hover:bg-blue-400/10" },
  fiber: { active: "bg-emerald-500 text-white border-emerald-500", inactive: "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10" },
  ir:    { active: "bg-emerald-500 text-white border-emerald-500", inactive: "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10" },
  diode: { active: "bg-blue-500 text-white border-blue-500",   inactive: "border-blue-400/40 text-blue-300 hover:bg-blue-400/10" },
  uv:    { active: "bg-blue-500 text-white border-blue-500",   inactive: "border-blue-400/40 text-blue-300 hover:bg-blue-400/10" },
};

const LASER_BADGE = {
  co2:   "bg-blue-400/15 text-blue-300 border-blue-400/20",
  fiber: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  ir:    "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  diode: "bg-blue-400/15 text-blue-300 border-blue-400/20",
  uv:    "bg-violet-400/15 text-violet-300 border-violet-400/20",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LaserMaterialMatrix({ lang = "pl" }) {
  const ui = UI[lang] || UI.en;

  const [action,    setAction]    = useState("cut");
  const [laserType, setLaserType] = useState(null);
  const [watts,     setWatts]     = useState(null);
  const [delivery,  setDelivery]  = useState(null);
  const [lens,      setLens]      = useState("163");

  // Derived: which laser categories are valid for the selected action
  const validLasers = ACTION_LASER_MAP[action] || [];

  // When action changes, reset laser/watts/delivery if no longer valid
  const handleAction = (newAction) => {
    setAction(newAction);
    const valid = ACTION_LASER_MAP[newAction] || [];
    if (laserType && !valid.includes(laserType)) {
      setLaserType(null);
      setWatts(null);
      setDelivery(null);
    }
  };

  // When laser type changes, reset watts to highest available by default
  const handleLaserType = (newType) => {
    setLaserType(newType);
    const avail = LASER_WATTAGES[newType] || [];
    setWatts(avail[avail.length - 1] ?? null);
    setDelivery(null);
  };

  // For engrave3d: force galvo delivery
  const isEngrave3d = action === "engrave3d";
  const effectiveDelivery = isEngrave3d ? "galvo" : delivery;

  // Column visibility flags
  const showThick     = action === "cut";
  const showAirAssist = effectiveDelivery === "std";
  const showFreq      = laserType === "fiber" || laserType === "ir" || laserType === "uv";
  const showWobble    = laserType === "fiber" && action === "cut";
  const showDpi       = (laserType === "fiber" || laserType === "ir" || laserType === "diode" || laserType === "uv") && action !== "cut";
  const showHatch     = showDpi;
  const showScanAngle = (laserType === "fiber" || laserType === "ir") && action !== "cut";

  // Filtered rows
  const rows = useMemo(() => {
    if (!laserType || !watts || !effectiveDelivery) return [];
    return MATRIX.filter((row) => {
      if (row.action !== action) return false;
      if (row.laserType !== laserType) return false;
      if (row.minWatts > watts) return false;
      if (row.delivery !== effectiveDelivery && row.delivery !== "both") return false;
      return true;
    });
  }, [action, laserType, watts, effectiveDelivery]);

  // Wattage chips for the selected laser type
  const wattageOptions = laserType
    ? (LASER_WATTAGES[laserType] || []).map((w) => ({
        id: w,
        label: `${w} W`,
      }))
    : [];

  const boolCell = (val) => {
    if (val === null || val === undefined) return "—";
    return val ? ui.yes : ui.no;
  };

  // Build dynamic columns array for the table header
  const cols = [
    { key: "mat",       label: ui.colMat,       always: true  },
    { key: "subtype",   label: ui.colSubtype,    always: true  },
    { key: "power",     label: ui.colPower,      always: true  },
    { key: "speed",     label: ui.colSpeed,      always: true  },
    { key: "passes",    label: ui.colPasses,     always: true  },
    { key: "thick",     label: ui.colThick,      show: showThick },
    { key: "airAssist", label: ui.colAirAssist,  show: showAirAssist },
    { key: "frequency", label: ui.colFreq,       show: showFreq },
    { key: "wobble",    label: ui.colWobble,     show: showWobble },
    { key: "dpi",       label: ui.colDpi,        show: showDpi },
    { key: "hatch",     label: ui.colHatch,      show: showHatch },
    { key: "scanAngle", label: ui.colScanAngle,  show: showScanAngle },
    { key: "note",      label: ui.colNote,       always: true  },
  ].filter((c) => c.always || c.show);

  const colCount = cols.length;

  return (
    <div className="space-y-6">

      {/* ── Step 1: Action ── */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
          {ui.stepAction}
        </div>
        <Chips
          options={ACTIONS}
          value={action}
          onChange={handleAction}
          lang={lang}
        />
      </div>

      {/* ── Step 2: Laser category + wattage ── */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
          {ui.stepLaser}
        </div>

        {/* Category chips — custom styled by laser color */}
        <div className="flex flex-wrap gap-2 mb-4">
          {LASER_CATEGORIES.filter((lc) => validLasers.includes(lc.id)).map((lc) => {
            const active = laserType === lc.id;
            const color = LASER_COLOR[lc.id];
            return (
              <button
                key={lc.id}
                onClick={() => handleLaserType(lc.id)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                  active ? color.active : color.inactive
                }`}
              >
                {lc.label}
              </button>
            );
          })}
        </div>

        {/* Wattage sub-selector */}
        {laserType && (
          <div>
            <div className="text-[11px] text-neutral-500 mb-2">{ui.selectWattage}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {wattageOptions.map((opt) => {
                const active = watts === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setWatts(opt.id)}
                    className={`px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-all ${
                      active
                        ? "bg-neutral-200 text-neutral-900 border-neutral-200"
                        : "border-white/15 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-500 italic">{ui.wattNote}</p>
          </div>
        )}
      </div>

      {/* ── Step 3: Delivery ── */}
      {laserType && watts && (
        <div>
          {isEngrave3d ? (
            /* engrave3d: no std/galvo chips, just show lens selector */
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                {ui.lensLabel}
              </div>
              <div className="flex flex-wrap gap-2">
                {LENSES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLens(l.id)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      lens === l.id
                        ? "bg-neutral-200 text-neutral-900 border-neutral-200"
                        : "border-white/15 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-neutral-500 italic">{ui.lensNote}</p>
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                {ui.stepDelivery}
              </div>
              <Chips
                options={DELIVERY_OPTIONS}
                value={delivery}
                onChange={setDelivery}
                lang={lang}
              />

              {/* Lens selector if galvo */}
              {delivery === "galvo" && (
                <div className="mt-3">
                  <div className="text-[11px] text-neutral-500 mb-2">{ui.lensLabel}</div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {LENSES.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLens(l.id)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          lens === l.id
                            ? "bg-neutral-200 text-neutral-900 border-neutral-200"
                            : "border-white/15 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500 italic">{ui.lensNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Table (only when all selectors are set) ── */}
      {laserType && watts && effectiveDelivery && (
        <div>
          {rows.length === 0 ? (
            <div className="py-10 text-center text-neutral-500 text-sm bg-neutral-900/40 border border-white/10 rounded-xl">
              {ui.noData}
            </div>
          ) : (
            <div className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-white/5 text-neutral-400 text-xs uppercase tracking-wide">
                      {cols.map((c) => (
                        <th
                          key={c.key}
                          className={`px-3 py-3 font-medium whitespace-nowrap ${
                            c.key === "mat" || c.key === "subtype" || c.key === "note"
                              ? "text-left"
                              : "text-right"
                          }`}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const noteText = t(row.note, lang);
                      return (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? "bg-transparent" : "bg-white/[0.025]"}
                        >
                          {cols.map((c) => {
                            let cell;
                            switch (c.key) {
                              case "mat":
                                cell = (
                                  <span className="font-medium text-neutral-200">
                                    {t(MAT_LABELS[row.mat], lang) || row.mat}
                                  </span>
                                );
                                break;
                              case "subtype":
                                cell = (
                                  <span className="text-neutral-400 text-xs">
                                    {t(row.subtype, lang)}
                                  </span>
                                );
                                break;
                              case "power":
                                cell = <span className="tabular-nums text-neutral-300">{row.power}%</span>;
                                break;
                              case "speed":
                                cell = <span className="tabular-nums text-neutral-300">{row.speed}</span>;
                                break;
                              case "passes":
                                cell = <span className="tabular-nums text-neutral-300">{row.passes}</span>;
                                break;
                              case "thick":
                                cell = <span className="tabular-nums text-neutral-300">{row.thick ?? "—"}</span>;
                                break;
                              case "airAssist":
                                cell = <span className="tabular-nums text-neutral-300">{row.airAssist ?? "—"}</span>;
                                break;
                              case "frequency":
                                cell = <span className="tabular-nums text-neutral-300">{row.frequency ?? "—"}</span>;
                                break;
                              case "wobble":
                                cell = <span className="text-neutral-300">{boolCell(row.wobble)}</span>;
                                break;
                              case "dpi":
                                cell = <span className="tabular-nums text-neutral-300">{row.dpi ?? "—"}</span>;
                                break;
                              case "hatch":
                                cell = <span className="text-neutral-300">{boolCell(row.hatch)}</span>;
                                break;
                              case "scanAngle":
                                cell = <span className="tabular-nums text-neutral-300">{row.scanAngle ?? "—"}</span>;
                                break;
                              case "note":
                                cell = (
                                  <span className="text-neutral-500 text-xs">
                                    {noteText || "—"}
                                  </span>
                                );
                                break;
                              default:
                                cell = null;
                            }
                            return (
                              <td
                                key={c.key}
                                className={`px-3 py-2.5 ${
                                  c.key === "mat" || c.key === "subtype" || c.key === "note"
                                    ? "text-left"
                                    : "text-right"
                                }`}
                              >
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-3 text-[11px] text-neutral-600 italic px-1">
            {ui.disclaimer}
          </p>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="mt-2 p-4 rounded-xl bg-blue-400/10 border border-blue-400/20 text-sm text-center">
        <span className="text-neutral-300">{ui.ctaText} </span>
        <a
          href="/studio/#calculator"
          className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
        >
          {"→"} {ui.ctaLink}
        </a>
      </div>
    </div>
  );
}
