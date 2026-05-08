import { useState, useMemo } from "react";

function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

const ACTIONS = [
  { id: "cut",       label: { pl: "Cięcie",            en: "Cutting",            de: "Schneiden" } },
  { id: "engrave",   label: { pl: "Grawerowanie",      en: "Engraving",          de: "Gravur" } },
  { id: "engrave25", label: { pl: "Obrazy 2.5D",       en: "2.5D Relief",        de: "2.5D-Relief" } },
  { id: "engrave3d", label: { pl: "Grawer 3D (szkło)", en: "3D Glass Engraving", de: "3D-Glasgravur" } },
];

const ACTION_LASER_MAP = {
  cut:       ["co2", "fiber", "diode"],
  engrave:   ["co2", "fiber", "ir", "diode", "uv"],
  engrave25: ["co2", "fiber", "ir", "uv"],
  engrave3d: ["fiber", "uv"],
};

const LASER_CATEGORIES = [
  { id: "co2",   label: "CO₂" },
  { id: "fiber", label: "Fiber" },
  { id: "ir",    label: "IR Diode" },
  { id: "diode", label: "Diode" },
  { id: "uv",    label: "UV" },
];

const LASER_WATTAGES = {
  co2:   [10, 20, 40, 55, 60, 80, 100, 130],
  fiber: [20, 30, 60, 100, 200],
  ir:    [10, 20, 30],
  diode: [5, 10, 20, 40],
  uv:    [3, 5, 10],
};

const LENSES = [
  { id: "110", label: "110mm", area: "70×70mm" },
  { id: "163", label: "163mm", area: "110×110mm" },
  { id: "254", label: "254mm", area: "170×170mm" },
  { id: "330", label: "330mm", area: "220×220mm" },
];

// power density ∝ 1/f² — data calibrated for 163mm baseline
const LENS_SPEED_FACTOR = { "110": 2.20, "163": 1.00, "254": 0.41, "330": 0.24 };

const MAT_LABELS = {
  plywood:     { pl: "Sklejka",         en: "Plywood",         de: "Sperrholz" },
  acrylic:     { pl: "Akryl",           en: "Acrylic",         de: "Acryl" },
  leather:     { pl: "Skóra",           en: "Leather",         de: "Leder" },
  fabric:      { pl: "Tkanina",         en: "Fabric",          de: "Textil" },
  mdf:         { pl: "MDF",             en: "MDF",             de: "MDF" },
  cardboard:   { pl: "Tektura",         en: "Cardboard",       de: "Pappe" },
  glass:       { pl: "Szkło",           en: "Glass",           de: "Glas" },
  crystal:     { pl: "Kryształ",        en: "Crystal",         de: "Kristall" },
  steel:       { pl: "Stal nierdzewna", en: "Stainless Steel", de: "Edelstahl" },
  aluminum:    { pl: "Aluminium",       en: "Aluminum",        de: "Aluminium" },
  brass:       { pl: "Mosiądz",         en: "Brass",           de: "Messing" },
  copper:      { pl: "Miedź",           en: "Copper",          de: "Kupfer" },
  titanium:    { pl: "Tytan",           en: "Titanium",        de: "Titan" },
  silver:      { pl: "Srebro",          en: "Silver",          de: "Silber" },
  gold:        { pl: "Złoto",           en: "Gold",            de: "Gold" },
  stone:       { pl: "Kamień",          en: "Stone",           de: "Stein" },
  slate:       { pl: "Łupek",           en: "Slate",           de: "Schiefer" },
  ceramic:     { pl: "Ceramika",        en: "Ceramics",        de: "Keramik" },
  cork:        { pl: "Korek",           en: "Cork",            de: "Kork" },
  rubber:      { pl: "Guma",            en: "Rubber",          de: "Gummi" },
  foam:        { pl: "Pianka",          en: "Foam",            de: "Schaum" },
  wood:        { pl: "Drewno lite",     en: "Solid Wood",      de: "Massivholz" },
  plastic_abs: { pl: "ABS",             en: "ABS Plastic",     de: "ABS" },
  plastic_pc:  { pl: "Poliwęglan",      en: "Polycarbonate",   de: "Polycarbonat" },
};

// watts = exact calibrated wattage (not minimum). galvo entries calibrated for 163mm lens.
const MATRIX = [
  // ── Diode engraving std — per-wattage ───────────────────────────────────
  { action:"engrave", mat:"wood",     subtype:{pl:"sosna/brzoza",    en:"pine/birch",      de:"Kiefer/Birke"},     thick:null, laserType:"diode", watts:5,  delivery:"std",   power:90, speed:60,   passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"powolne",      en:"slow",       de:"langsam"} },
  { action:"engrave", mat:"wood",     subtype:{pl:"sosna/brzoza",    en:"pine/birch",      de:"Kiefer/Birke"},     thick:null, laserType:"diode", watts:10, delivery:"std",   power:75, speed:120,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"wood",     subtype:{pl:"sosna/brzoza",    en:"pine/birch",      de:"Kiefer/Birke"},     thick:null, laserType:"diode", watts:20, delivery:"std",   power:60, speed:250,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"wood",     subtype:{pl:"sosna/brzoza",    en:"pine/birch",      de:"Kiefer/Birke"},     thick:null, laserType:"diode", watts:40, delivery:"std",   power:42, speed:450,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"40W — wysoka prędkość", en:"40W — high speed", de:"40W — hohe Geschwindigkeit"} },
  { action:"engrave", mat:"plywood",  subtype:{pl:"sklejka brzozowa",en:"birch plywood",   de:"Birkensperrholz"},  thick:null, laserType:"diode", watts:5,  delivery:"std",   power:92, speed:50,   passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood",  subtype:{pl:"sklejka brzozowa",en:"birch plywood",   de:"Birkensperrholz"},  thick:null, laserType:"diode", watts:10, delivery:"std",   power:78, speed:100,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood",  subtype:{pl:"sklejka brzozowa",en:"birch plywood",   de:"Birkensperrholz"},  thick:null, laserType:"diode", watts:20, delivery:"std",   power:62, speed:200,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood",  subtype:{pl:"sklejka brzozowa",en:"birch plywood",   de:"Birkensperrholz"},  thick:null, laserType:"diode", watts:40, delivery:"std",   power:44, speed:400,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather",  subtype:{pl:"naturalna",       en:"natural",         de:"natürlich"},         thick:null, laserType:"diode", watts:5,  delivery:"std",   power:80, speed:80,   passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather",  subtype:{pl:"naturalna",       en:"natural",         de:"natürlich"},         thick:null, laserType:"diode", watts:10, delivery:"std",   power:65, speed:160,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather",  subtype:{pl:"naturalna",       en:"natural",         de:"natürlich"},         thick:null, laserType:"diode", watts:20, delivery:"std",   power:50, speed:300,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather",  subtype:{pl:"naturalna",       en:"natural",         de:"natürlich"},         thick:null, laserType:"diode", watts:40, delivery:"std",   power:32, speed:500,  passes:1, airAssist:10,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"cork",     subtype:{pl:"korek",           en:"cork",            de:"Kork"},              thick:null, laserType:"diode", watts:5,  delivery:"std",   power:65, speed:100,  passes:1, airAssist:5,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"cork",     subtype:{pl:"korek",           en:"cork",            de:"Kork"},              thick:null, laserType:"diode", watts:10, delivery:"std",   power:50, speed:200,  passes:1, airAssist:5,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"cork",     subtype:{pl:"korek",           en:"cork",            de:"Kork"},              thick:null, laserType:"diode", watts:20, delivery:"std",   power:38, speed:350,  passes:1, airAssist:5,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"cork",     subtype:{pl:"korek",           en:"cork",            de:"Kork"},              thick:null, laserType:"diode", watts:40, delivery:"std",   power:25, speed:600,  passes:1, airAssist:5,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"slate",    subtype:{pl:"łupek",           en:"slate",           de:"Schiefer"},          thick:null, laserType:"diode", watts:20, delivery:"std",   power:80, speed:120,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"slate",    subtype:{pl:"łupek",           en:"slate",           de:"Schiefer"},          thick:null, laserType:"diode", watts:40, delivery:"std",   power:62, speed:200,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"anodowane czarne",en:"black anodized",  de:"schwarz eloxiert"},  thick:null, laserType:"diode", watts:20, delivery:"std",   power:85, speed:120,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"wymaga ciemnego anodowania", en:"requires dark anodizing", de:"erfordert dunkle Eloxierung"} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"anodowane czarne",en:"black anodized",  de:"schwarz eloxiert"},  thick:null, laserType:"diode", watts:40, delivery:"std",   power:68, speed:200,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"wymaga ciemnego anodowania", en:"requires dark anodizing", de:"erfordert dunkle Eloxierung"} },

  // ── Diode cutting std — per-wattage ─────────────────────────────────────
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 2mm",   en:"cardboard 2mm", de:"Pappe 2mm"},   thick:2, laserType:"diode", watts:5,  delivery:"std", power:72, speed:25,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 2mm",   en:"cardboard 2mm", de:"Pappe 2mm"},   thick:2, laserType:"diode", watts:10, delivery:"std", power:60, speed:45,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 2mm",   en:"cardboard 2mm", de:"Pappe 2mm"},   thick:2, laserType:"diode", watts:20, delivery:"std", power:45, speed:80,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 2mm",   en:"cardboard 2mm", de:"Pappe 2mm"},   thick:2, laserType:"diode", watts:40, delivery:"std", power:30, speed:150, passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna/jeans", en:"cotton/denim",  de:"Baumwolle"},   thick:1, laserType:"diode", watts:5,  delivery:"std", power:75, speed:30,  passes:1, airAssist:20,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna/jeans", en:"cotton/denim",  de:"Baumwolle"},   thick:1, laserType:"diode", watts:10, delivery:"std", power:60, speed:60,  passes:1, airAssist:20,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna/jeans", en:"cotton/denim",  de:"Baumwolle"},   thick:1, laserType:"diode", watts:20, delivery:"std", power:45, speed:100, passes:1, airAssist:20,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna/jeans", en:"cotton/denim",  de:"Baumwolle"},   thick:1, laserType:"diode", watts:40, delivery:"std", power:30, speed:180, passes:1, airAssist:20,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm", en:"natural 2mm",   de:"natürlich 2mm"},thick:2, laserType:"diode", watts:5,  delivery:"std", power:90, speed:12,  passes:2, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm", en:"natural 2mm",   de:"natürlich 2mm"},thick:2, laserType:"diode", watts:10, delivery:"std", power:80, speed:20,  passes:2, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm", en:"natural 2mm",   de:"natürlich 2mm"},thick:2, laserType:"diode", watts:20, delivery:"std", power:68, speed:35,  passes:1, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm", en:"natural 2mm",   de:"natürlich 2mm"},thick:2, laserType:"diode", watts:40, delivery:"std", power:52, speed:60,  passes:1, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sklejka 3mm",   en:"plywood 3mm",   de:"Sperrholz 3mm"},thick:3, laserType:"diode", watts:10, delivery:"std", power:100,speed:8,   passes:3, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{pl:"wiele przejść", en:"multiple passes", de:"mehrere Durchgänge"} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sklejka 3mm",   en:"plywood 3mm",   de:"Sperrholz 3mm"},thick:3, laserType:"diode", watts:20, delivery:"std", power:100,speed:12,  passes:2, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sklejka 3mm",   en:"plywood 3mm",   de:"Sperrholz 3mm"},thick:3, laserType:"diode", watts:40, delivery:"std", power:100,speed:20,  passes:2, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sklejka 5mm",   en:"plywood 5mm",   de:"Sperrholz 5mm"},thick:5, laserType:"diode", watts:20, delivery:"std", power:100,speed:6,   passes:4, airAssist:90,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sklejka 5mm",   en:"plywood 5mm",   de:"Sperrholz 5mm"},thick:5, laserType:"diode", watts:40, delivery:"std", power:100,speed:10,  passes:3, airAssist:90,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── CO2 engraving std — per-wattage ─────────────────────────────────────
  { action:"engrave", mat:"wood",    subtype:{pl:"sosna/brzoza",  en:"pine/birch",     de:"Kiefer/Birke"},    thick:null, laserType:"co2", watts:20,  delivery:"std",   power:30, speed:300,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"wood",    subtype:{pl:"sosna/brzoza",  en:"pine/birch",     de:"Kiefer/Birke"},    thick:null, laserType:"co2", watts:40,  delivery:"std",   power:22, speed:500,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"wood",    subtype:{pl:"sosna/brzoza",  en:"pine/birch",     de:"Kiefer/Birke"},    thick:null, laserType:"co2", watts:60,  delivery:"std",   power:18, speed:800,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"wood",    subtype:{pl:"sosna/brzoza",  en:"pine/birch",     de:"Kiefer/Birke"},    thick:null, laserType:"co2", watts:80,  delivery:"std",   power:15, speed:1200, passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"wood",    subtype:{pl:"sosna/brzoza",  en:"pine/birch",     de:"Kiefer/Birke"},    thick:null, laserType:"co2", watts:100, delivery:"std",   power:12, speed:1800, passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood", subtype:{pl:"sklejka brzoza",en:"birch plywood",  de:"Birkensperrholz"}, thick:null, laserType:"co2", watts:20,  delivery:"std",   power:32, speed:280,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood", subtype:{pl:"sklejka brzoza",en:"birch plywood",  de:"Birkensperrholz"}, thick:null, laserType:"co2", watts:40,  delivery:"std",   power:24, speed:480,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{} },
  { action:"engrave", mat:"plywood", subtype:{pl:"sklejka brzoza",en:"birch plywood",  de:"Birkensperrholz"}, thick:null, laserType:"co2", watts:60,  delivery:"std",   power:20, speed:750,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{} },
  { action:"engrave", mat:"acrylic", subtype:{pl:"lany (cast)",   en:"cast acrylic",   de:"Acryl gegossen"},  thick:null, laserType:"co2", watts:20,  delivery:"std",   power:22, speed:250,  passes:1, airAssist:10, frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{pl:"niski % = lepszy kontrast", en:"low power = better contrast", de:"niedrige Leistung = besserer Kontrast"} },
  { action:"engrave", mat:"acrylic", subtype:{pl:"lany (cast)",   en:"cast acrylic",   de:"Acryl gegossen"},  thick:null, laserType:"co2", watts:40,  delivery:"std",   power:18, speed:400,  passes:1, airAssist:10, frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"acrylic", subtype:{pl:"lany (cast)",   en:"cast acrylic",   de:"Acryl gegossen"},  thick:null, laserType:"co2", watts:60,  delivery:"std",   power:15, speed:600,  passes:1, airAssist:10, frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather", subtype:{pl:"naturalna",     en:"natural",        de:"natürlich"},        thick:null, laserType:"co2", watts:20,  delivery:"std",   power:18, speed:280,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"leather", subtype:{pl:"naturalna",     en:"natural",        de:"natürlich"},        thick:null, laserType:"co2", watts:40,  delivery:"std",   power:14, speed:450,  passes:1, airAssist:20, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"glass",   subtype:{pl:"hartowane",     en:"tempered",       de:"gehärtet"},         thick:null, laserType:"co2", watts:20,  delivery:"std",   power:22, speed:150,  passes:1, airAssist:0,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"tylko pow. matowienie", en:"surface frosting only", de:"nur Oberflächenmattierung"} },
  { action:"engrave", mat:"glass",   subtype:{pl:"hartowane",     en:"tempered",       de:"gehärtet"},         thick:null, laserType:"co2", watts:40,  delivery:"std",   power:18, speed:250,  passes:1, airAssist:0,  frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{pl:"tylko pow. matowienie", en:"surface frosting only", de:"nur Oberflächenmattierung"} },
  { action:"engrave", mat:"slate",   subtype:{pl:"łupek",         en:"slate",          de:"Schiefer"},         thick:null, laserType:"co2", watts:20,  delivery:"std",   power:62, speed:80,   passes:1, airAssist:0,  frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"slate",   subtype:{pl:"łupek",         en:"slate",          de:"Schiefer"},         thick:null, laserType:"co2", watts:40,  delivery:"std",   power:50, speed:130,  passes:1, airAssist:0,  frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"rubber",  subtype:{pl:"stempel",       en:"rubber stamp",   de:"Gummistempel"},     thick:null, laserType:"co2", watts:20,  delivery:"std",   power:38, speed:200,  passes:1, airAssist:30, frequency:null, wobble:null, dpi:500, hatch:true,  scanAngle:null, note:{pl:"wysoka DPI", en:"high DPI", de:"hohe DPI"} },
  { action:"engrave", mat:"rubber",  subtype:{pl:"stempel",       en:"rubber stamp",   de:"Gummistempel"},     thick:null, laserType:"co2", watts:40,  delivery:"std",   power:28, speed:350,  passes:1, airAssist:30, frequency:null, wobble:null, dpi:500, hatch:true,  scanAngle:null, note:{pl:"wysoka DPI", en:"high DPI", de:"hohe DPI"} },
  { action:"engrave", mat:"cork",    subtype:{pl:"korek",         en:"cork",           de:"Kork"},             thick:null, laserType:"co2", watts:20,  delivery:"std",   power:22, speed:250,  passes:1, airAssist:10, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"cork",    subtype:{pl:"korek",         en:"cork",           de:"Kork"},             thick:null, laserType:"co2", watts:40,  delivery:"std",   power:16, speed:400,  passes:1, airAssist:10, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },

  // ── CO2 engraving galvo ──────────────────────────────────────────────────
  { action:"engrave", mat:"wood",    subtype:{pl:"lite/sklejka",  en:"solid/plywood",  de:"Massivholz"},       thick:null, laserType:"co2", watts:30,  delivery:"galvo", power:32, speed:1800, passes:1, airAssist:null, frequency:null, wobble:null, dpi:300, hatch:true,  scanAngle:null, note:{pl:"galvo CO2 — duża prędkość", en:"galvo CO2 — high speed", de:"Galvo CO2 — hohe Geschwindigkeit"} },
  { action:"engrave", mat:"acrylic", subtype:{pl:"lany",          en:"cast",           de:"gegossen"},         thick:null, laserType:"co2", watts:30,  delivery:"galvo", power:24, speed:1400, passes:1, airAssist:null, frequency:null, wobble:null, dpi:254, hatch:false, scanAngle:null, note:{} },
  { action:"engrave", mat:"glass",   subtype:{pl:"szkło",         en:"glass",          de:"Glas"},             thick:null, laserType:"co2", watts:30,  delivery:"galvo", power:20, speed:1600, passes:1, airAssist:null, frequency:null, wobble:null, dpi:300, hatch:false, scanAngle:null, note:{} },

  // ── CO2 cutting std — per-wattage ────────────────────────────────────────
  { action:"cut", mat:"plywood",   subtype:{pl:"sosna/brzoza 3mm",en:"pine/birch 3mm", de:"Kiefer/Birke 3mm"}, thick:3,  laserType:"co2", watts:40,  delivery:"std", power:65, speed:18,  passes:1, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sosna/brzoza 3mm",en:"pine/birch 3mm", de:"Kiefer/Birke 3mm"}, thick:3,  laserType:"co2", watts:60,  delivery:"std", power:55, speed:28,  passes:1, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"sosna/brzoza 3mm",en:"pine/birch 3mm", de:"Kiefer/Birke 3mm"}, thick:3,  laserType:"co2", watts:80,  delivery:"std", power:48, speed:40,  passes:1, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"brzoza 6mm",      en:"birch 6mm",      de:"Birke 6mm"},         thick:6,  laserType:"co2", watts:60,  delivery:"std", power:78, speed:10,  passes:2, airAssist:90,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"brzoza 6mm",      en:"birch 6mm",      de:"Birke 6mm"},         thick:6,  laserType:"co2", watts:80,  delivery:"std", power:65, speed:15,  passes:2, airAssist:90,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"brzoza 12mm",     en:"birch 12mm",     de:"Birke 12mm"},        thick:12, laserType:"co2", watts:100, delivery:"std", power:90, speed:6,   passes:3, airAssist:100, frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"plywood",   subtype:{pl:"brzoza 12mm",     en:"birch 12mm",     de:"Birke 12mm"},        thick:12, laserType:"co2", watts:130, delivery:"std", power:78, speed:10,  passes:2, airAssist:100, frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany 3mm",        en:"cast 3mm",       de:"gegossen 3mm"},      thick:3,  laserType:"co2", watts:40,  delivery:"std", power:70, speed:15,  passes:1, airAssist:60,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{pl:"cast nie wytłaczany", en:"cast not extruded", de:"gegossen nicht extrudiert"} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany 3mm",        en:"cast 3mm",       de:"gegossen 3mm"},      thick:3,  laserType:"co2", watts:60,  delivery:"std", power:55, speed:25,  passes:1, airAssist:60,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany 6mm",        en:"cast 6mm",       de:"gegossen 6mm"},      thick:6,  laserType:"co2", watts:60,  delivery:"std", power:82, speed:8,   passes:1, airAssist:70,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany 6mm",        en:"cast 6mm",       de:"gegossen 6mm"},      thick:6,  laserType:"co2", watts:80,  delivery:"std", power:70, speed:12,  passes:1, airAssist:70,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"acrylic",   subtype:{pl:"lany 10mm",       en:"cast 10mm",      de:"gegossen 10mm"},     thick:10, laserType:"co2", watts:100, delivery:"std", power:80, speed:8,   passes:1, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"mdf",       subtype:{pl:"MDF 3mm",         en:"MDF 3mm",        de:"MDF 3mm"},           thick:3,  laserType:"co2", watts:40,  delivery:"std", power:65, speed:18,  passes:1, airAssist:85,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"mdf",       subtype:{pl:"MDF 3mm",         en:"MDF 3mm",        de:"MDF 3mm"},           thick:3,  laserType:"co2", watts:60,  delivery:"std", power:52, speed:28,  passes:1, airAssist:85,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"mdf",       subtype:{pl:"MDF 6mm",         en:"MDF 6mm",        de:"MDF 6mm"},           thick:6,  laserType:"co2", watts:60,  delivery:"std", power:80, speed:10,  passes:2, airAssist:90,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm",   en:"natural 2mm",    de:"natürlich 2mm"},     thick:2,  laserType:"co2", watts:20,  delivery:"std", power:42, speed:28,  passes:1, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"naturalna 2mm",   en:"natural 2mm",    de:"natürlich 2mm"},     thick:2,  laserType:"co2", watts:40,  delivery:"std", power:30, speed:50,  passes:1, airAssist:50,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"leather",   subtype:{pl:"gruba 4mm",       en:"thick 4mm",      de:"dick 4mm"},          thick:4,  laserType:"co2", watts:40,  delivery:"std", power:58, speed:18,  passes:1, airAssist:60,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna",         en:"cotton",         de:"Baumwolle"},         thick:1,  laserType:"co2", watts:10,  delivery:"std", power:26, speed:48,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"fabric",    subtype:{pl:"bawełna",         en:"cotton",         de:"Baumwolle"},         thick:1,  laserType:"co2", watts:20,  delivery:"std", power:20, speed:80,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"foam",      subtype:{pl:"EVA 5mm",         en:"EVA foam 5mm",  de:"EVA 5mm"},           thick:5,  laserType:"co2", watts:20,  delivery:"std", power:32, speed:35,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{pl:"bez nadmuchu", en:"no air assist", de:"kein Luftstrom"} },
  { action:"cut", mat:"foam",      subtype:{pl:"EVA 5mm",         en:"EVA foam 5mm",  de:"EVA 5mm"},           thick:5,  laserType:"co2", watts:40,  delivery:"std", power:22, speed:60,  passes:1, airAssist:0,   frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{pl:"bez nadmuchu", en:"no air assist", de:"kein Luftstrom"} },
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 3mm",     en:"cardboard 3mm", de:"Pappe 3mm"},         thick:3,  laserType:"co2", watts:10,  delivery:"std", power:52, speed:22,  passes:1, airAssist:40,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cardboard", subtype:{pl:"tektura 3mm",     en:"cardboard 3mm", de:"Pappe 3mm"},         thick:3,  laserType:"co2", watts:20,  delivery:"std", power:40, speed:40,  passes:1, airAssist:40,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cork",      subtype:{pl:"korek 5mm",       en:"cork 5mm",      de:"Kork 5mm"},          thick:5,  laserType:"co2", watts:20,  delivery:"std", power:48, speed:28,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"cork",      subtype:{pl:"korek 5mm",       en:"cork 5mm",      de:"Kork 5mm"},          thick:5,  laserType:"co2", watts:40,  delivery:"std", power:35, speed:48,  passes:1, airAssist:30,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"rubber",    subtype:{pl:"kauczuk 3mm",     en:"rubber 3mm",    de:"Gummi 3mm"},         thick:3,  laserType:"co2", watts:40,  delivery:"std", power:55, speed:18,  passes:1, airAssist:80,  frequency:null, wobble:null, dpi:null, hatch:null, scanAngle:null, note:{pl:"mocna wentylacja!", en:"strong ventilation!", de:"starke Lüftung!"} },

  // ── Fiber engraving std — per-wattage ────────────────────────────────────
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:20,  delivery:"std",   power:80, speed:1200, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"hatch 45°", en:"hatch 45°", de:"Hatch 45°"} },
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:60,  delivery:"std",   power:70, speed:2500, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:100, delivery:"std",   power:60, speed:4000, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",en:"anodized aluminum",  de:"eloxiertes Aluminium"},thick:null, laserType:"fiber", watts:20,  delivery:"std",   power:62, speed:1500, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",en:"anodized aluminum",  de:"eloxiertes Aluminium"},thick:null, laserType:"fiber", watts:60,  delivery:"std",   power:50, speed:3500, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:20,  delivery:"std",   power:92, speed:700,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:60,  delivery:"std",   power:80, speed:1500, passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:20,  delivery:"std",   power:72, speed:800,  passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"kolor przy niskiej mocy", en:"color at low power", de:"Farbe bei niedriger Leistung"} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:60,  delivery:"std",   power:60, speed:1800, passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"silver",   subtype:{pl:"srebro 925",         en:"sterling silver",    de:"Sterlingsilber"},      thick:null, laserType:"fiber", watts:20,  delivery:"std",   power:50, speed:1100, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"gold",     subtype:{pl:"złoto 14k",          en:"gold 14k",           de:"Gold 14k"},            thick:null, laserType:"fiber", watts:20,  delivery:"std",   power:45, speed:1400, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"copper",   subtype:{pl:"miedź",              en:"copper",             de:"Kupfer"},              thick:null, laserType:"fiber", watts:30,  delivery:"std",   power:100,speed:500,  passes:1, airAssist:null, frequency:25, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"stone",    subtype:{pl:"granit/marmur",      en:"granite/marble",     de:"Granit/Marmor"},       thick:null, laserType:"fiber", watts:30,  delivery:"std",   power:80, speed:500,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"ceramic",  subtype:{pl:"ceramika",           en:"ceramics",           de:"Keramik"},             thick:null, laserType:"fiber", watts:30,  delivery:"std",   power:75, speed:700,  passes:1, airAssist:null, frequency:35, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },

  // ── Fiber engraving galvo ────────────────────────────────────────────────
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:72, speed:2500, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"galvo — bardzo szybko", en:"galvo — very fast", de:"Galvo — sehr schnell"} },
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:60,  delivery:"galvo", power:62, speed:5000, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",en:"anodized aluminum",  de:"eloxiertes Aluminium"},thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:55, speed:3500, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:88, speed:1800, passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:65, speed:2200, passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"silver",   subtype:{pl:"srebro",             en:"silver",             de:"Silber"},              thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:45, speed:2800, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },

  // ── Fiber cutting std ────────────────────────────────────────────────────
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 0.5mm",en:"stainless 0.5mm", de:"Edelstahl 0.5mm"}, thick:0.5, laserType:"fiber", watts:20,  delivery:"std", power:100, speed:700,  passes:1, airAssist:90,  frequency:20, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 0.5mm",en:"stainless 0.5mm", de:"Edelstahl 0.5mm"}, thick:0.5, laserType:"fiber", watts:60,  delivery:"std", power:100, speed:2000, passes:1, airAssist:90,  frequency:20, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 1mm",  en:"stainless 1mm",   de:"Edelstahl 1mm"},   thick:1,   laserType:"fiber", watts:60,  delivery:"std", power:100, speed:400,  passes:1, airAssist:100, frequency:20, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 1mm",  en:"stainless 1mm",   de:"Edelstahl 1mm"},   thick:1,   laserType:"fiber", watts:100, delivery:"std", power:100, speed:1200, passes:1, airAssist:100, frequency:20, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 2mm",  en:"stainless 2mm",   de:"Edelstahl 2mm"},   thick:2,   laserType:"fiber", watts:100, delivery:"std", power:100, speed:200,  passes:2, airAssist:100, frequency:15, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"aluminum", subtype:{pl:"aluminium 1mm",        en:"aluminum 1mm",    de:"Aluminium 1mm"},   thick:1,   laserType:"fiber", watts:60,  delivery:"std", power:100, speed:600,  passes:1, airAssist:100, frequency:20, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"brass",    subtype:{pl:"mosiądz 0.5mm",        en:"brass 0.5mm",     de:"Messing 0.5mm"},   thick:0.5, laserType:"fiber", watts:20,  delivery:"std", power:100, speed:450,  passes:1, airAssist:90,  frequency:25, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"brass",    subtype:{pl:"mosiądz 1mm",          en:"brass 1mm",       de:"Messing 1mm"},     thick:1,   laserType:"fiber", watts:60,  delivery:"std", power:100, speed:280,  passes:2, airAssist:100, frequency:20, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"copper",   subtype:{pl:"miedź 0.5mm",          en:"copper 0.5mm",    de:"Kupfer 0.5mm"},    thick:0.5, laserType:"fiber", watts:60,  delivery:"std", power:100, speed:350,  passes:1, airAssist:90,  frequency:25, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{pl:"trudna w cięciu", en:"challenging to cut", de:"schwierig zu schneiden"} },
  { action:"cut", mat:"titanium", subtype:{pl:"tytan 0.5mm",          en:"titanium 0.5mm",  de:"Titan 0.5mm"},     thick:0.5, laserType:"fiber", watts:30,  delivery:"std", power:100, speed:550,  passes:1, airAssist:80,  frequency:20, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── Fiber cutting galvo ──────────────────────────────────────────────────
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 0.3mm",en:"stainless 0.3mm", de:"Edelstahl 0.3mm"}, thick:0.3, laserType:"fiber", watts:20, delivery:"galvo", power:100, speed:300, passes:1, airAssist:null, frequency:30, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{pl:"galvo — cienka blacha", en:"galvo — thin sheet", de:"Galvo — dünnes Blech"} },
  { action:"cut", mat:"brass",    subtype:{pl:"mosiądz 0.3mm",        en:"brass 0.3mm",     de:"Messing 0.3mm"},   thick:0.3, laserType:"fiber", watts:20, delivery:"galvo", power:100, speed:250, passes:1, airAssist:null, frequency:30, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── UV engraving galvo — per-wattage ─────────────────────────────────────
  { action:"engrave", mat:"glass",       subtype:{pl:"szkło sodowe",  en:"soda-lime glass", de:"Kalk-Natron-Glas"}, thick:null, laserType:"uv", watts:3,  delivery:"galvo", power:65, speed:400,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{pl:"UV galvo — głęboka grawitacja", en:"UV galvo — deep engraving", de:"UV Galvo — tiefe Gravur"} },
  { action:"engrave", mat:"glass",       subtype:{pl:"szkło sodowe",  en:"soda-lime glass", de:"Kalk-Natron-Glas"}, thick:null, laserType:"uv", watts:5,  delivery:"galvo", power:52, speed:650,  passes:1, airAssist:null, frequency:35, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"glass",       subtype:{pl:"szkło sodowe",  en:"soda-lime glass", de:"Kalk-Natron-Glas"}, thick:null, laserType:"uv", watts:10, delivery:"galvo", power:38, speed:1000, passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"crystal",     subtype:{pl:"kryształ",      en:"crystal",         de:"Kristall"},          thick:null, laserType:"uv", watts:5,  delivery:"galvo", power:70, speed:300,  passes:1, airAssist:null, frequency:25, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"crystal",     subtype:{pl:"kryształ",      en:"crystal",         de:"Kristall"},          thick:null, laserType:"uv", watts:10, delivery:"galvo", power:55, speed:500,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"plastic_abs", subtype:{pl:"ABS biały",     en:"white ABS",       de:"weißes ABS"},        thick:null, laserType:"uv", watts:3,  delivery:"galvo", power:42, speed:500,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"plastic_abs", subtype:{pl:"ABS biały",     en:"white ABS",       de:"weißes ABS"},        thick:null, laserType:"uv", watts:5,  delivery:"galvo", power:30, speed:800,  passes:1, airAssist:null, frequency:35, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"plastic_pc",  subtype:{pl:"Poliwęglan",    en:"Polycarbonate",   de:"Polycarbonat"},      thick:null, laserType:"uv", watts:3,  delivery:"galvo", power:38, speed:600,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"plastic_pc",  subtype:{pl:"Poliwęglan",    en:"Polycarbonate",   de:"Polycarbonat"},      thick:null, laserType:"uv", watts:5,  delivery:"galvo", power:28, speed:900,  passes:1, airAssist:null, frequency:35, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },

  // ── 3D Glass engraving (engrave3d, galvo) ───────────────────────────────
  { action:"engrave3d", mat:"crystal", subtype:{pl:"kryształ optyczny",  en:"optical crystal",   de:"optisches Kristall"},    thick:null, laserType:"uv",    watts:5,  delivery:"galvo", power:68, speed:200, passes:3, airAssist:null, frequency:20, wobble:null, dpi:600, hatch:true, scanAngle:45, note:{pl:"warstwy 3D, głębokość", en:"3D layers, depth", de:"3D-Schichten, Tiefe"} },
  { action:"engrave3d", mat:"glass",   subtype:{pl:"szkło borokrzemowe", en:"borosilicate glass", de:"Borosilikatglas"},       thick:null, laserType:"uv",    watts:5,  delivery:"galvo", power:78, speed:150, passes:3, airAssist:null, frequency:15, wobble:null, dpi:600, hatch:true, scanAngle:45, note:{pl:"precyzyjne ogniskowanie Z", en:"precise Z-focus", de:"präzise Z-Fokussierung"} },
  { action:"engrave3d", mat:"crystal", subtype:{pl:"kryształ — Fiber IR",en:"crystal — Fiber IR", de:"Kristall — Fiber IR"},   thick:null, laserType:"fiber", watts:20, delivery:"galvo", power:80, speed:280, passes:3, airAssist:null, frequency:30, wobble:null, dpi:600, hatch:true, scanAngle:45, note:{pl:"fiber IR 1064nm", en:"fiber IR 1064nm", de:"Fiber IR 1064nm"} },

  // ── CO2 2.5D relief ──────────────────────────────────────────────────────
  { action:"engrave25", mat:"wood",    subtype:{pl:"lite drewno", en:"solid wood", de:"Massivholz"}, thick:null, laserType:"co2", watts:40, delivery:"std", power:40, speed:200, passes:1, airAssist:15, frequency:null, wobble:null, dpi:254, hatch:true, scanAngle:null, note:{pl:"mapa głębokości z szarości", en:"depth map from grayscale", de:"Tiefenkarte aus Graustufen"} },
  { action:"engrave25", mat:"wood",    subtype:{pl:"lite drewno", en:"solid wood", de:"Massivholz"}, thick:null, laserType:"co2", watts:60, delivery:"std", power:32, speed:320, passes:1, airAssist:15, frequency:null, wobble:null, dpi:254, hatch:true, scanAngle:null, note:{} },
  { action:"engrave25", mat:"plywood", subtype:{pl:"sklejka",     en:"plywood",    de:"Sperrholz"},  thick:null, laserType:"co2", watts:40, delivery:"std", power:45, speed:180, passes:1, airAssist:10, frequency:null, wobble:null, dpi:254, hatch:true, scanAngle:null, note:{} },
  { action:"engrave25", mat:"acrylic", subtype:{pl:"lany",        en:"cast",       de:"gegossen"},   thick:null, laserType:"co2", watts:40, delivery:"std", power:35, speed:150, passes:1, airAssist:0,  frequency:null, wobble:null, dpi:300, hatch:true, scanAngle:null, note:{pl:"podświetlany efekt 3D", en:"backlit 3D effect", de:"3D-Hintergrundbeleuchtung"} },
  { action:"engrave25", mat:"mdf",     subtype:{pl:"MDF",         en:"MDF",        de:"MDF"},         thick:null, laserType:"co2", watts:40, delivery:"std", power:50, speed:160, passes:1, airAssist:15, frequency:null, wobble:null, dpi:254, hatch:true, scanAngle:null, note:{} },
  { action:"engrave25", mat:"foam",    subtype:{pl:"pianka PUR",  en:"PUR foam",   de:"PUR-Schaum"}, thick:null, laserType:"co2", watts:20, delivery:"std", power:25, speed:280, passes:1, airAssist:0,  frequency:null, wobble:null, dpi:300, hatch:true, scanAngle:null, note:{} },

  // ── Fiber 200W engraving std ─────────────────────────────────────────────
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:200, delivery:"std",   power:45, speed:8000,  passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"200W — bardzo wysoka prędkość", en:"200W — very high speed", de:"200W — sehr hohe Geschwindigkeit"} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",en:"anodized aluminum",  de:"eloxiertes Aluminium"},thick:null, laserType:"fiber", watts:200, delivery:"std",   power:35, speed:14000, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:200, delivery:"std",   power:55, speed:5000,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:200, delivery:"std",   power:40, speed:6000,  passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"copper",   subtype:{pl:"miedź",              en:"copper",             de:"Kupfer"},              thick:null, laserType:"fiber", watts:200, delivery:"std",   power:65, speed:2500,  passes:1, airAssist:null, frequency:25, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"silver",   subtype:{pl:"srebro 925",         en:"sterling silver",    de:"Sterlingsilber"},      thick:null, laserType:"fiber", watts:200, delivery:"std",   power:30, speed:5000,  passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },

  // ── Fiber 200W engraving galvo ───────────────────────────────────────────
  { action:"engrave", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:200, delivery:"galvo", power:38, speed:15000, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{pl:"200W galvo — masowa produkcja", en:"200W galvo — mass production", de:"200W Galvo — Massenproduktion"} },
  { action:"engrave", mat:"aluminum", subtype:{pl:"aluminium anodowane",en:"anodized aluminum",  de:"eloxiertes Aluminium"},thick:null, laserType:"fiber", watts:200, delivery:"galvo", power:28, speed:20000, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:false, scanAngle:0,  note:{} },
  { action:"engrave", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:200, delivery:"galvo", power:50, speed:8000,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },
  { action:"engrave", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:200, delivery:"galvo", power:35, speed:10000, passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true,  scanAngle:45, note:{} },

  // ── Fiber 200W cutting std ───────────────────────────────────────────────
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 1mm",  en:"stainless 1mm",   de:"Edelstahl 1mm"},   thick:1,   laserType:"fiber", watts:200, delivery:"std", power:80, speed:5000, passes:1, airAssist:100, frequency:20, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 3mm",  en:"stainless 3mm",   de:"Edelstahl 3mm"},   thick:3,   laserType:"fiber", watts:200, delivery:"std", power:90, speed:2000, passes:1, airAssist:100, frequency:15, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"steel",    subtype:{pl:"stal nierdzewna 5mm",  en:"stainless 5mm",   de:"Edelstahl 5mm"},   thick:5,   laserType:"fiber", watts:200, delivery:"std", power:95, speed:800,  passes:1, airAssist:100, frequency:12, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"aluminum", subtype:{pl:"aluminium 3mm",        en:"aluminum 3mm",    de:"Aluminium 3mm"},   thick:3,   laserType:"fiber", watts:200, delivery:"std", power:75, speed:4000, passes:1, airAssist:100, frequency:20, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"brass",    subtype:{pl:"mosiądz 2mm",          en:"brass 2mm",       de:"Messing 2mm"},     thick:2,   laserType:"fiber", watts:200, delivery:"std", power:88, speed:2500, passes:1, airAssist:100, frequency:20, wobble:true,  dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"copper",   subtype:{pl:"miedź 1mm",            en:"copper 1mm",      de:"Kupfer 1mm"},      thick:1,   laserType:"fiber", watts:200, delivery:"std", power:85, speed:2000, passes:1, airAssist:90,  frequency:25, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },
  { action:"cut", mat:"titanium", subtype:{pl:"tytan 1mm",            en:"titanium 1mm",    de:"Titan 1mm"},       thick:1,   laserType:"fiber", watts:200, delivery:"std", power:82, speed:2500, passes:1, airAssist:80,  frequency:20, wobble:false, dpi:null, hatch:null, scanAngle:null, note:{} },

  // ── engrave25 — Fiber galvo (2.5D surface relief) ────────────────────────
  { action:"engrave25", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:72, speed:800,  passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{pl:"galvo 2.5D — mapa głębokości", en:"galvo 2.5D — depth map", de:"Galvo 2.5D — Tiefenkarte"} },
  { action:"engrave25", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:60,  delivery:"galvo", power:62, speed:1800, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"steel",    subtype:{pl:"stal nierdzewna",    en:"stainless steel",    de:"Edelstahl"},           thick:null, laserType:"fiber", watts:100, delivery:"galvo", power:50, speed:3500, passes:1, airAssist:null, frequency:50, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"aluminum", subtype:{pl:"aluminium",          en:"aluminum",           de:"Aluminium"},           thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:60, speed:1000, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"aluminum", subtype:{pl:"aluminium",          en:"aluminum",           de:"Aluminium"},           thick:null, laserType:"fiber", watts:60,  delivery:"galvo", power:48, speed:2500, passes:1, airAssist:null, frequency:60, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:85, speed:600,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"brass",    subtype:{pl:"mosiądz",            en:"brass",              de:"Messing"},             thick:null, laserType:"fiber", watts:60,  delivery:"galvo", power:70, speed:1500, passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:20,  delivery:"galvo", power:68, speed:700,  passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"titanium", subtype:{pl:"tytan",              en:"titanium",           de:"Titan"},               thick:null, laserType:"fiber", watts:60,  delivery:"galvo", power:55, speed:1800, passes:1, airAssist:null, frequency:40, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"stone",    subtype:{pl:"granit/marmur",      en:"granite/marble",     de:"Granit/Marmor"},       thick:null, laserType:"fiber", watts:30,  delivery:"galvo", power:82, speed:400,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"stone",    subtype:{pl:"granit/marmur",      en:"granite/marble",     de:"Granit/Marmor"},       thick:null, laserType:"fiber", watts:60,  delivery:"galvo", power:68, speed:900,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"ceramic",  subtype:{pl:"ceramika",           en:"ceramics",           de:"Keramik"},             thick:null, laserType:"fiber", watts:30,  delivery:"galvo", power:78, speed:500,  passes:1, airAssist:null, frequency:35, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{} },

  // ── engrave25 — UV galvo (2.5D) ───────────────────────────────────────────
  { action:"engrave25", mat:"glass",       subtype:{pl:"szkło",         en:"glass",           de:"Glas"},         thick:null, laserType:"uv", watts:5,  delivery:"galvo", power:68, speed:200, passes:2, airAssist:null, frequency:25, wobble:null, dpi:400, hatch:true, scanAngle:45, note:{pl:"2.5D UV galvo — szklane reliefy", en:"2.5D UV galvo — glass relief", de:"2.5D UV Galvo — Glasrelief"} },
  { action:"engrave25", mat:"glass",       subtype:{pl:"szkło",         en:"glass",           de:"Glas"},         thick:null, laserType:"uv", watts:10, delivery:"galvo", power:52, speed:400, passes:2, airAssist:null, frequency:30, wobble:null, dpi:400, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"crystal",     subtype:{pl:"kryształ",      en:"crystal",         de:"Kristall"},     thick:null, laserType:"uv", watts:5,  delivery:"galvo", power:75, speed:150, passes:2, airAssist:null, frequency:20, wobble:null, dpi:500, hatch:true, scanAngle:45, note:{} },
  { action:"engrave25", mat:"acrylic",     subtype:{pl:"akryl lany",    en:"cast acrylic",    de:"Acryl gegossen"},thick:null,laserType:"uv", watts:5,  delivery:"galvo", power:45, speed:400, passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:true, scanAngle:45, note:{pl:"podświetlane efekty 3D", en:"backlit 3D effects", de:"3D-Hintergrundbeleuchtung"} },

  // ── engrave25 — CO2 galvo ─────────────────────────────────────────────────
  { action:"engrave25", mat:"wood",    subtype:{pl:"lite/sklejka",   en:"solid/plywood",   de:"Massivholz"},    thick:null, laserType:"co2", watts:30, delivery:"galvo", power:35, speed:1500, passes:1, airAssist:null, frequency:null, wobble:null, dpi:300, hatch:true, scanAngle:null, note:{pl:"CO2 galvo 2.5D — duża prędkość", en:"CO2 galvo 2.5D — high speed", de:"CO2 Galvo 2.5D — hohe Geschwindigkeit"} },
  { action:"engrave25", mat:"acrylic", subtype:{pl:"lany",           en:"cast",            de:"gegossen"},      thick:null, laserType:"co2", watts:30, delivery:"galvo", power:26, speed:1200, passes:1, airAssist:null, frequency:null, wobble:null, dpi:254, hatch:true, scanAngle:null, note:{} },

  // ── engrave25 — IR galvo ──────────────────────────────────────────────────
  { action:"engrave25", mat:"plastic_abs", subtype:{pl:"ABS",  en:"ABS",           de:"ABS"},           thick:null, laserType:"ir", watts:20, delivery:"galvo", power:42, speed:600, passes:1, airAssist:null, frequency:20, wobble:null, dpi:300, hatch:true, scanAngle:0, note:{pl:"IR galvo 2.5D na plastiku", en:"IR galvo 2.5D on plastic", de:"IR Galvo 2.5D auf Kunststoff"} },
  { action:"engrave25", mat:"plastic_pc",  subtype:{pl:"PC",   en:"Polycarbonate",  de:"Polycarbonat"},  thick:null, laserType:"ir", watts:20, delivery:"galvo", power:38, speed:700, passes:1, airAssist:null, frequency:20, wobble:null, dpi:300, hatch:true, scanAngle:0, note:{} },

  // ── IR Diode engraving — per-wattage ─────────────────────────────────────
  { action:"engrave", mat:"plastic_abs", subtype:{pl:"ABS cz/b",      en:"ABS black/white", de:"ABS schwarz/weiß"}, thick:null, laserType:"ir", watts:10, delivery:"std", power:35, speed:800,  passes:1, airAssist:null, frequency:20, wobble:null, dpi:300, hatch:false, scanAngle:0, note:{pl:"IR 1064nm na ABS", en:"IR 1064nm on ABS", de:"IR 1064nm auf ABS"} },
  { action:"engrave", mat:"plastic_abs", subtype:{pl:"ABS cz/b",      en:"ABS black/white", de:"ABS schwarz/weiß"}, thick:null, laserType:"ir", watts:20, delivery:"std", power:25, speed:1500, passes:1, airAssist:null, frequency:25, wobble:null, dpi:300, hatch:false, scanAngle:0, note:{} },
  { action:"engrave", mat:"plastic_pc",  subtype:{pl:"Poliwęglan",    en:"Polycarbonate",   de:"Polycarbonat"},     thick:null, laserType:"ir", watts:10, delivery:"std", power:30, speed:900,  passes:1, airAssist:null, frequency:20, wobble:null, dpi:300, hatch:false, scanAngle:0, note:{} },
  { action:"engrave", mat:"plastic_pc",  subtype:{pl:"Poliwęglan",    en:"Polycarbonate",   de:"Polycarbonat"},     thick:null, laserType:"ir", watts:20, delivery:"std", power:22, speed:1800, passes:1, airAssist:null, frequency:25, wobble:null, dpi:300, hatch:false, scanAngle:0, note:{} },
  { action:"engrave", mat:"glass",       subtype:{pl:"szkło Cermark",  en:"glass Cermark",   de:"Glas Cermark"},     thick:null, laserType:"ir", watts:20, delivery:"std", power:75, speed:400,  passes:1, airAssist:null, frequency:30, wobble:null, dpi:300, hatch:false, scanAngle:0, note:{pl:"wymagana pasta Cermark", en:"Cermark paste required", de:"Cermark-Paste erforderlich"} },
  { action:"engrave", mat:"glass",       subtype:{pl:"szkło Cermark",  en:"glass Cermark",   de:"Glas Cermark"},     thick:null, laserType:"ir", watts:30, delivery:"std", power:60, speed:600,  passes:1, airAssist:null, frequency:35, wobble:null, dpi:300, hatch:false, scanAngle:0, note:{pl:"wymagana pasta Cermark", en:"Cermark paste required", de:"Cermark-Paste erforderlich"} },
];

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------
const UI = {
  pl: {
    step1: "1 — Rodzaj operacji", step2: "2 — Typ lasera i moc", step3: "3 — System prowadzenia",
    wattNote:     "Wybierz nominalną moc maksymalną urządzenia. Parametry w tabeli podane są jako % tej mocy.",
    lensLabel:    "Obiektyw F-Theta:",
    lensNote:     "Zmiana obiektywu zmienia rozmiar plamki i gęstość mocy — prędkości korygowane automatycznie względem 163mm.",
    noData:       "Brak danych dla tej kombinacji. Spróbuj innej mocy lub akcji.",
    colMat:       "Materiał", colSubtype: "Wariant", colPower: "Moc (%)", colSpeed: "Prędkość (mm/s)",
    colPasses: "Przejścia", colThick: "Grubość (mm)", colAirAssist: "Nadmuch (%)",
    colFreq: "Częst. (kHz)", colWobble: "Wobble", colDpi: "DPI", colHatch: "Hatch", colScanAngle: "Kąt skan. (°)", colNote: "Uwagi",
    yes: "Tak", no: "Nie",
    disclaimer:   "Parametry orientacyjne. Mogą się różnić w zależności od producenta, kondycji optyki i partii materiału.",
    ctaText:      "Potrzebujesz wyceny laserowania?", ctaLink: "Kalkulator sTuDiO",
    incompatible: "Niekompatybilny z wybraną akcją", workArea: "Pole robocze:", selectWatt: "Moc lasera:",
  },
  en: {
    step1: "1 — Operation type", step2: "2 — Laser type & wattage", step3: "3 — Delivery system",
    wattNote:     "Select your device's nominal maximum power. Table parameters are given as % of this power.",
    lensLabel:    "F-Theta lens:",
    lensNote:     "Lens change alters spot size and power density — table speeds auto-corrected relative to 163mm baseline.",
    noData:       "No data for this combination. Try a different wattage or action.",
    colMat:       "Material", colSubtype: "Variant", colPower: "Power (%)", colSpeed: "Speed (mm/s)",
    colPasses: "Passes", colThick: "Thickness (mm)", colAirAssist: "Air Assist (%)",
    colFreq: "Freq. (kHz)", colWobble: "Wobble", colDpi: "DPI", colHatch: "Hatch", colScanAngle: "Scan Angle (°)", colNote: "Notes",
    yes: "Yes", no: "No",
    disclaimer:   "Reference parameters for typical machines. May vary by manufacturer, optics condition, and material batch.",
    ctaText:      "Need a laser cutting quote?", ctaLink: "sTuDiO Calculator",
    incompatible: "Incompatible with selected action", workArea: "Work area:", selectWatt: "Laser wattage:",
  },
  de: {
    step1: "1 — Operationstyp", step2: "2 — Lasertyp & Leistung", step3: "3 — Führungssystem",
    wattNote:     "Wählen Sie die nominale Maximalleistung Ihres Geräts. Parameter sind als % dieser Leistung angegeben.",
    lensLabel:    "F-Theta-Objektiv:",
    lensNote:     "Objektivwechsel ändert Spotgröße und Leistungsdichte — Geschwindigkeiten automatisch relativ zu 163mm korrigiert.",
    noData:       "Keine Daten für diese Kombination. Andere Leistung oder Aktion wählen.",
    colMat:       "Material", colSubtype: "Variante", colPower: "Leistung (%)", colSpeed: "Geschw. (mm/s)",
    colPasses: "Durchgänge", colThick: "Stärke (mm)", colAirAssist: "Luftunterstützung (%)",
    colFreq: "Frequenz (kHz)", colWobble: "Wobble", colDpi: "DPI", colHatch: "Hatch", colScanAngle: "Scanwinkel (°)", colNote: "Hinweise",
    yes: "Ja", no: "Nein",
    disclaimer:   "Richtwerte für typische Maschinen. Können je nach Hersteller, Optik und Material abweichen.",
    ctaText:      "Benötigen Sie ein Laser-Angebot?", ctaLink: "sTuDiO-Rechner",
    incompatible: "Inkompatibel mit der gewählten Aktion", workArea: "Arbeitsfeld:", selectWatt: "Laserleistung:",
  },
};

const LASER_COLOR = {
  co2:   { active: "bg-blue-500 text-white border-blue-500",       inactive: "border-blue-400/40 text-blue-300 hover:bg-blue-400/10" },
  fiber: { active: "bg-emerald-500 text-white border-emerald-500", inactive: "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10" },
  ir:    { active: "bg-emerald-600 text-white border-emerald-600", inactive: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/10" },
  diode: { active: "bg-sky-500 text-white border-sky-500",         inactive: "border-sky-400/40 text-sky-300 hover:bg-sky-400/10" },
  uv:    { active: "bg-violet-500 text-white border-violet-500",   inactive: "border-violet-400/40 text-violet-300 hover:bg-violet-400/10" },
};

function powerColor(pct) {
  if (pct < 40) return "text-green-400";
  if (pct < 65) return "text-yellow-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LaserMaterialMatrix({ lang = "pl" }) {
  const ui = UI[lang] || UI.en;

  const [action,    setAction]    = useState("engrave");
  const [laserType, setLaserType] = useState("diode");
  const [watts,     setWatts]     = useState(40);
  const [delivery,  setDelivery]  = useState("std");
  const [lens,      setLens]      = useState("163");

  const validLasers = ACTION_LASER_MAP[action] || [];

  const handleAction = (newAction) => {
    setAction(newAction);
    const valid = ACTION_LASER_MAP[newAction] || [];
    if (!valid.includes(laserType)) {
      const first = valid[0] ?? null;
      setLaserType(first);
      const avail = first ? LASER_WATTAGES[first] : [];
      setWatts(avail.length ? avail[avail.length - 1] : null);
    }
  };

  const handleLaserType = (lc) => {
    if (!validLasers.includes(lc.id)) return;
    if (laserType === lc.id) return;
    setLaserType(lc.id);
    const avail = LASER_WATTAGES[lc.id] || [];
    setWatts(avail.length ? avail[avail.length - 1] : null);
  };

  const isEngrave3d = action === "engrave3d";
  const effectiveDelivery = isEngrave3d ? "galvo" : delivery;

  const showThick     = action === "cut";
  const showAirAssist = effectiveDelivery === "std";
  const showFreq      = ["fiber","ir","uv"].includes(laserType);
  const showWobble    = laserType === "fiber" && action === "cut";
  const showDpi       = ["fiber","ir","diode","uv"].includes(laserType) && action !== "cut";
  const showHatch     = showDpi;
  const showScanAngle = ["fiber","ir"].includes(laserType) && action !== "cut";

  const rows = useMemo(() => {
    if (!laserType || watts === null || !effectiveDelivery) return [];
    // All rows calibrated at or below selected wattage
    const candidates = MATRIX.filter(r =>
      r.action === action &&
      r.laserType === laserType &&
      r.watts <= watts &&
      (r.delivery === effectiveDelivery || r.delivery === "both")
    );
    if (candidates.length === 0) return [];
    // For each (mat, subtype) pair keep only the highest-wattage row — best params at selected power
    const best = new Map();
    for (const r of candidates) {
      const key = `${r.mat}|${r.subtype?.en ?? ""}|${r.thick ?? ""}`;
      if (!best.has(key) || best.get(key).watts < r.watts) best.set(key, r);
    }
    return [...best.values()];
  }, [action, laserType, watts, effectiveDelivery]);

  const lensFactor = LENS_SPEED_FACTOR[lens] ?? 1.0;
  const isGalvo = effectiveDelivery === "galvo";
  const wattageOptions = laserType ? (LASER_WATTAGES[laserType] || []) : [];
  const boolCell = (val) => val === null || val === undefined ? "—" : val ? ui.yes : ui.no;

  const cols = [
    { key: "mat",       label: ui.colMat,       always: true },
    { key: "subtype",   label: ui.colSubtype,    always: true },
    { key: "power",     label: ui.colPower,      always: true },
    { key: "speed",     label: ui.colSpeed,      always: true },
    { key: "passes",    label: ui.colPasses,     always: true },
    { key: "thick",     label: ui.colThick,      show: showThick },
    { key: "airAssist", label: ui.colAirAssist,  show: showAirAssist },
    { key: "frequency", label: ui.colFreq,       show: showFreq },
    { key: "wobble",    label: ui.colWobble,     show: showWobble },
    { key: "dpi",       label: ui.colDpi,        show: showDpi },
    { key: "hatch",     label: ui.colHatch,      show: showHatch },
    { key: "scanAngle", label: ui.colScanAngle,  show: showScanAngle },
    { key: "note",      label: ui.colNote,       always: true },
  ].filter(c => c.always || c.show);

  const leftAlign = new Set(["mat","subtype","note"]);

  return (
    <div className="space-y-6">

      {/* Step 1 */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">{ui.step1}</div>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map(a => (
            <button key={a.id} onClick={() => handleAction(a.id)}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                action === a.id
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-white/15 text-neutral-400 hover:border-blue-400/40 hover:text-blue-300"
              }`}>
              {t(a.label, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">{ui.step2}</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {LASER_CATEGORIES.map(lc => {
            const compat = validLasers.includes(lc.id);
            const active = laserType === lc.id;
            const color = LASER_COLOR[lc.id];
            return (
              <button key={lc.id} onClick={() => handleLaserType(lc)}
                title={!compat ? ui.incompatible : undefined}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                  !compat
                    ? "opacity-30 cursor-not-allowed border-white/10 text-neutral-500"
                    : active
                    ? color.active
                    : color.inactive
                }`}>
                {lc.label}
              </button>
            );
          })}
        </div>

        {laserType && (
          <div>
            <div className="text-[11px] text-neutral-500 mb-2">{ui.selectWatt}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {wattageOptions.map(w => (
                <button key={w} onClick={() => setWatts(w)}
                  className={`min-w-[52px] px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    watts === w
                      ? "bg-blue-500/20 border-blue-400 text-blue-300"
                      : "border-white/15 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                  }`}>
                  {w} W
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 italic">{ui.wattNote}</p>
          </div>
        )}
      </div>

      {/* Step 3 */}
      {laserType && watts !== null && (
        <div>
          {isEngrave3d ? (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">{ui.lensLabel}</div>
              <div className="flex flex-wrap gap-2">
                {LENSES.map(l => (
                  <button key={l.id} onClick={() => setLens(l.id)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      lens === l.id ? "bg-neutral-200 text-neutral-900 border-neutral-200" : "border-white/15 text-neutral-400 hover:border-white/30"
                    }`}>
                    {l.label} <span className="text-[10px] opacity-50 ml-1">{l.area}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">{ui.step3}</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "std",   label: { pl: "Standardowa (XY)", en: "Standard (XY)", de: "Standard (XY)" } },
                  { id: "galvo", label: { pl: "Galvo",             en: "Galvo",          de: "Galvo" } },
                ].map(d => (
                  <button key={d.id} onClick={() => setDelivery(d.id)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      delivery === d.id
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-white/15 text-neutral-400 hover:border-blue-400/40 hover:text-blue-300"
                    }`}>
                    {t(d.label, lang)}
                  </button>
                ))}
              </div>

              {delivery === "galvo" && (
                <div className="mt-3">
                  <div className="text-[11px] text-neutral-500 mb-2">{ui.lensLabel}</div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {LENSES.map(l => (
                      <button key={l.id} onClick={() => setLens(l.id)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          lens === l.id ? "bg-neutral-200 text-neutral-900 border-neutral-200" : "border-white/15 text-neutral-400 hover:border-white/30"
                        }`}>
                        {l.label} <span className="opacity-50 ml-0.5">{l.area}</span>
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

      {/* Table */}
      {laserType && watts !== null && effectiveDelivery && (
        <div>
          {rows.length === 0 ? (
            <div className="py-10 text-center text-neutral-500 text-sm bg-neutral-900/40 border border-white/10 rounded-xl">
              {ui.noData}
            </div>
          ) : (
            <div className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-900 border-b border-white/10 text-neutral-400 text-xs uppercase tracking-wide">
                      {cols.map(c => (
                        <th key={c.key}
                          className={`px-3 py-3 font-medium whitespace-nowrap ${leftAlign.has(c.key) ? "text-left" : "text-right"}`}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const displaySpeed = isGalvo ? Math.round(row.speed * lensFactor) : row.speed;
                      return (
                        <tr key={i}
                          className={`hover:bg-white/5 transition-colors ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.025]"}`}>
                          {cols.map(c => {
                            let cell;
                            switch (c.key) {
                              case "mat":      cell = <span className="font-medium text-neutral-200">{t(MAT_LABELS[row.mat], lang) || row.mat}</span>; break;
                              case "subtype":  cell = <span className="text-neutral-400 text-xs">{t(row.subtype, lang)}</span>; break;
                              case "power":    cell = <span className={`tabular-nums font-semibold ${powerColor(row.power)}`}>{row.power}%</span>; break;
                              case "speed":    cell = <span className="tabular-nums text-neutral-300">{displaySpeed}</span>; break;
                              case "passes":   cell = <span className="tabular-nums text-neutral-300">{row.passes}</span>; break;
                              case "thick":    cell = <span className="tabular-nums text-neutral-300">{row.thick ?? "—"}</span>; break;
                              case "airAssist":cell = <span className="tabular-nums text-neutral-300">{row.airAssist ?? "—"}</span>; break;
                              case "frequency":cell = <span className="tabular-nums text-neutral-300">{row.frequency ?? "—"}</span>; break;
                              case "wobble":   cell = <span className="text-neutral-300">{boolCell(row.wobble)}</span>; break;
                              case "dpi":      cell = <span className="tabular-nums text-neutral-300">{row.dpi ?? "—"}</span>; break;
                              case "hatch":    cell = <span className="text-neutral-300">{boolCell(row.hatch)}</span>; break;
                              case "scanAngle":cell = <span className="tabular-nums text-neutral-300">{row.scanAngle ?? "—"}</span>; break;
                              case "note":     cell = <span className="text-neutral-500 text-xs">{t(row.note, lang) || "—"}</span>; break;
                              default:         cell = null;
                            }
                            return (
                              <td key={c.key}
                                className={`px-3 py-2.5 ${leftAlign.has(c.key) ? "text-left" : "text-right"}`}>
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
          <p className="mt-3 text-[11px] text-neutral-600 italic px-1">{ui.disclaimer}</p>
        </div>
      )}

      {/* CTA */}
      <div className="p-4 rounded-xl bg-blue-400/10 border border-blue-400/20 text-sm text-center">
        <span className="text-neutral-300">{ui.ctaText} </span>
        <a href="/studio/#calculator" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
          → {ui.ctaLink}
        </a>
      </div>
    </div>
  );
}
