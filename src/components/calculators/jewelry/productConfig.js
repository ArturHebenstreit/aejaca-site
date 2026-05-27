export const EU_RING_SIZES = {
  44: 14.0, 45: 14.3, 46: 14.6, 47: 15.0, 48: 15.3,
  49: 15.6, 50: 15.9, 51: 16.2, 52: 16.6, 53: 16.9,
  54: 17.2, 55: 17.5, 56: 17.8, 57: 18.2, 58: 18.5,
  59: 18.8, 60: 19.1, 61: 19.4, 62: 19.7, 63: 20.1,
  64: 20.4, 65: 20.7, 66: 21.0, 67: 21.3, 68: 21.7,
  69: 22.0, 70: 22.3, 71: 22.6, 72: 22.9, 73: 23.3,
  74: 23.6,
};

// US → inner diameter (mm)
export const US_RING_SIZES = {
  "3": 14.1, "3.5": 14.5, "4": 14.9, "4.5": 15.3, "5": 15.7,
  "5.5": 16.1, "6": 16.5, "6.5": 16.9, "7": 17.3, "7.5": 17.7,
  "8": 18.2, "8.5": 18.6, "9": 19.0, "9.5": 19.4, "10": 19.8,
  "10.5": 20.2, "11": 20.6, "11.5": 21.0, "12": 21.4, "12.5": 21.8, "13": 22.2,
};

// UK/AU → inner diameter (mm)
export const UK_RING_SIZES = {
  "F": 13.5, "G": 14.0, "H": 14.5, "I": 14.9, "J": 15.3,
  "K": 15.7, "L": 16.1, "M": 16.5, "N": 16.9, "O": 17.3,
  "P": 17.8, "Q": 18.2, "R": 18.6, "S": 19.0, "T": 19.4,
  "U": 19.8, "V": 20.2, "W": 20.6, "X": 21.0, "Y": 21.4, "Z": 21.8,
};

// JP → inner diameter (mm)
export const JP_RING_SIZES = {
  "1": 12.9, "2": 13.2, "3": 13.5, "4": 13.9, "5": 14.2,
  "6": 14.5, "7": 14.9, "8": 15.2, "9": 15.5, "10": 15.9,
  "11": 16.2, "12": 16.5, "13": 16.9, "14": 17.2, "15": 17.5,
  "16": 17.9, "17": 18.2, "18": 18.5, "19": 18.9, "20": 19.2,
  "21": 19.5, "22": 19.9, "23": 20.2, "24": 20.5, "25": 20.9, "26": 21.2, "27": 21.5,
};

// Helper: get inner diameter from any system
export function getRingInnerDiameter(system, value) {
  if (system === "EU") return EU_RING_SIZES[value] ?? 17.2;
  if (system === "US") return US_RING_SIZES[String(value)] ?? 17.2;
  if (system === "UK") return UK_RING_SIZES[String(value)] ?? 17.2;
  if (system === "JP") return JP_RING_SIZES[String(value)] ?? 17.2;
  if (system === "mm") return parseFloat(value) || 17.2; // direct diameter
  return 17.2;
}

export const PRODUCT_TYPES = [
  {
    id: "ring",
    icon: "💍",
    label: { pl: "Pierścionek", en: "Ring", de: "Ring" },
    description: {
      pl: "Klasyczny pierścionek lub obrączka — oblicz wagę na podstawie rozmiaru i grubości ścianki.",
      en: "Classic ring or band — estimate weight from size and wall thickness.",
      de: "Klassischer Ring oder Reif — Gewicht anhand von Größe und Wandstärke berechnen.",
    },
    fields: [
      {
        id: "ringSize",
        type: "ringSize",
        label: { pl: "Rozmiar pierścionka", en: "Ring size", de: "Ringgröße" },
        default: { system: "EU", value: 54 },
      },
      {
        id: "width",
        label: { pl: "Szerokość obrączki", en: "Band width", de: "Ringbreite" },
        type: "number",
        unit: "mm",
        min: 2,
        max: 20,
        default: 5,
        step: 0.5,
      },
      {
        id: "wallThickness",
        label: { pl: "Grubość ścianki", en: "Wall thickness", de: "Wandstärke" },
        type: "number",
        unit: "mm",
        min: 0.5,
        max: 4,
        default: 1.5,
        step: 0.1,
      },
    ],
    // Keys match WEIGHTS ids from jewelryConfig.js: light / standard / heavy
    fillFactors: { light: 0.42, standard: 0.72, heavy: 0.88 },
    defaultFill: "standard",
    notes: {
      pl: "Waga szacowana metodą walca z uwzględnieniem współczynnika wypełnienia.",
      en: "Weight estimated using hollow cylinder formula with fill factor.",
      de: "Gewicht mit Hohlzylinderformel und Füllfaktor geschätzt.",
    },
  },
  {
    id: "signet",
    icon: "🔰",
    label: { pl: "Sygnet", en: "Signet", de: "Siegelring" },
    description: {
      pl: "Sygnet z oczkiem — uwzględnia bryłę pierścienia i płytkę czołową.",
      en: "Signet ring with face plate — accounts for ring body and face.",
      de: "Siegelring mit Kopfplatte — berücksichtigt Ringkörper und Kopffläche.",
    },
    fields: [
      {
        id: "ringSize",
        type: "ringSize",
        label: { pl: "Rozmiar sygnetu", en: "Ring size", de: "Ringgröße" },
        default: { system: "EU", value: 54 },
      },
      {
        id: "width",
        label: { pl: "Szerokość sygnetu", en: "Signet width", de: "Siegelringbreite" },
        type: "number",
        unit: "mm",
        min: 8,
        max: 30,
        default: 16,
        step: 1,
      },
      {
        id: "faceWidth",
        label: { pl: "Szerokość oczka", en: "Face width", de: "Kopfbreite" },
        type: "number",
        unit: "mm",
        min: 8,
        max: 28,
        default: 14,
        step: 1,
      },
      {
        id: "faceHeight",
        label: { pl: "Wysokość oczka", en: "Face height", de: "Kopfhöhe" },
        type: "number",
        unit: "mm",
        min: 8,
        max: 25,
        default: 12,
        step: 1,
      },
      {
        id: "wallThickness",
        label: { pl: "Grubość ścianki", en: "Wall thickness", de: "Wandstärke" },
        type: "number",
        unit: "mm",
        min: 0.5,
        max: 4,
        default: 2,
        step: 0.1,
      },
    ],
    // Keys match WEIGHTS ids from jewelryConfig.js: light / standard / heavy
    fillFactors: { light: 0.62, standard: 0.78, heavy: 0.88 },
    defaultFill: "standard",
    notes: {
      pl: "Model łączy walec pierścienia z prostokątną płytką czołową.",
      en: "Model combines ring cylinder with a rectangular face plate.",
      de: "Modell kombiniert Ringzylinder mit rechteckiger Kopfplatte.",
    },
  },
  {
    id: "pendant",
    icon: "📿",
    label: { pl: "Wisiorek", en: "Pendant", de: "Anhänger" },
    description: {
      pl: "Wisiorek — bryła prostopadłościenna przemnożona przez współczynnik stylu.",
      en: "Pendant — bounding box volume scaled by style fill factor.",
      de: "Anhänger — Quadervolumen skaliert mit dem Stil-Füllfaktor.",
    },
    fields: [
      {
        id: "height",
        label: { pl: "Wysokość", en: "Height", de: "Höhe" },
        type: "number",
        unit: "mm",
        min: 10,
        max: 100,
        default: 30,
        step: 1,
      },
      {
        id: "width",
        label: { pl: "Szerokość", en: "Width", de: "Breite" },
        type: "number",
        unit: "mm",
        min: 5,
        max: 80,
        default: 20,
        step: 1,
      },
      {
        id: "thickness",
        label: { pl: "Grubość", en: "Thickness", de: "Stärke" },
        type: "number",
        unit: "mm",
        min: 1,
        max: 20,
        default: 4,
        step: 0.5,
      },
      {
        id: "style",
        label: { pl: "Styl", en: "Style", de: "Stil" },
        type: "select",
        options: [
          { id: "solid", pl: "Lity", en: "Solid", de: "Massiv" },
          { id: "withStone", pl: "Z kamieniem", en: "With stone", de: "Mit Stein" },
          { id: "openwork", pl: "Ażurowy", en: "Openwork", de: "Filigran" },
        ],
        default: "withStone",
      },
    ],
    fillFactors: { solid: 0.85, withStone: 0.55, openwork: 0.38 },
    defaultFill: "withStone",
    notes: {
      pl: "Waga szacowana z objętości bryły ograniczającej.",
      en: "Weight estimated from bounding box volume.",
      de: "Gewicht aus dem umgebenden Quadervolumen geschätzt.",
    },
  },
  {
    id: "bracelet",
    icon: "⭕",
    label: { pl: "Bransoletka", en: "Bracelet", de: "Armband" },
    description: {
      pl: "Bransoletka — objętość wydłużonego prostopadłościanu z korektą stylu.",
      en: "Bracelet — elongated box volume with style correction.",
      de: "Armband — längliches Quadervolumen mit Stilkorrektur.",
    },
    fields: [
      {
        id: "length",
        label: { pl: "Długość", en: "Length", de: "Länge" },
        type: "number",
        unit: "mm",
        min: 150,
        max: 250,
        default: 185,
        step: 5,
      },
      {
        id: "width",
        label: { pl: "Szerokość", en: "Width", de: "Breite" },
        type: "number",
        unit: "mm",
        min: 3,
        max: 30,
        default: 8,
        step: 1,
      },
      {
        id: "thickness",
        label: { pl: "Grubość", en: "Thickness", de: "Stärke" },
        type: "number",
        unit: "mm",
        min: 1,
        max: 10,
        default: 2.5,
        step: 0.5,
      },
      {
        id: "style",
        label: { pl: "Styl", en: "Style", de: "Stil" },
        type: "select",
        options: [
          { id: "solid", pl: "Lita", en: "Solid", de: "Massiv" },
          { id: "link", pl: "Ogniwa", en: "Link chain", de: "Gliederarmband" },
          { id: "bangle", pl: "Obręcz", en: "Bangle", de: "Armreif" },
        ],
        default: "link",
      },
    ],
    fillFactors: { solid: 0.85, link: 0.62, bangle: 0.75 },
    defaultFill: "link",
    notes: {
      pl: "Model prostoliniowy — dla bransolet o skomplikowanej formie wynik jest przybliżony.",
      en: "Linear model — results are approximate for complex shaped bracelets.",
      de: "Lineares Modell — Ergebnisse bei komplex geformten Armbändern sind Näherungswerte.",
    },
  },
  {
    id: "earrings",
    icon: "✨",
    label: { pl: "Kolczyki", en: "Earrings", de: "Ohrringe" },
    description: {
      pl: "Kolczyki — waga jednej sztuki lub pary, z korektą dla stylu.",
      en: "Earrings — weight per piece or pair, scaled by style.",
      de: "Ohrringe — Gewicht pro Stück oder Paar, nach Stil skaliert.",
    },
    fields: [
      {
        id: "height",
        label: { pl: "Wysokość", en: "Height", de: "Höhe" },
        type: "number",
        unit: "mm",
        min: 5,
        max: 60,
        default: 20,
        step: 1,
      },
      {
        id: "width",
        label: { pl: "Szerokość", en: "Width", de: "Breite" },
        type: "number",
        unit: "mm",
        min: 3,
        max: 40,
        default: 12,
        step: 1,
      },
      {
        id: "thickness",
        label: { pl: "Grubość", en: "Thickness", de: "Stärke" },
        type: "number",
        unit: "mm",
        min: 0.5,
        max: 10,
        default: 2,
        step: 0.5,
      },
      {
        id: "style",
        label: { pl: "Styl", en: "Style", de: "Stil" },
        type: "select",
        options: [
          { id: "stud", pl: "Wkręt", en: "Stud", de: "Ohrstecker" },
          { id: "drop", pl: "Zwisające", en: "Drop", de: "Hänger" },
          { id: "hoop", pl: "Kółko", en: "Hoop", de: "Creole" },
        ],
        default: "stud",
      },
      {
        id: "isPair",
        label: { pl: "Para (×2)", en: "Pair (×2)", de: "Paar (×2)" },
        type: "toggle",
        default: true,
      },
    ],
    fillFactors: { stud: 0.88, drop: 0.62, hoop: 0.45 },
    defaultFill: "stud",
    notes: {
      pl: "Przy zaznaczonej opcji 'Para' waga jest podwojona.",
      en: "When 'Pair' is selected the weight is doubled.",
      de: "Bei aktivierter Option 'Paar' wird das Gewicht verdoppelt.",
    },
  },
  {
    id: "brooch",
    icon: "🌸",
    label: { pl: "Broszka", en: "Brooch", de: "Brosche" },
    description: {
      pl: "Broszka — płaska lub rzeźbiona forma z korektą wypełnienia.",
      en: "Brooch — flat or sculptural form with fill correction.",
      de: "Brosche — flache oder skulpturale Form mit Füllfaktorkorrektur.",
    },
    fields: [
      {
        id: "height",
        label: { pl: "Wysokość", en: "Height", de: "Höhe" },
        type: "number",
        unit: "mm",
        min: 15,
        max: 80,
        default: 35,
        step: 1,
      },
      {
        id: "width",
        label: { pl: "Szerokość", en: "Width", de: "Breite" },
        type: "number",
        unit: "mm",
        min: 15,
        max: 80,
        default: 45,
        step: 1,
      },
      {
        id: "thickness",
        label: { pl: "Grubość", en: "Thickness", de: "Stärke" },
        type: "number",
        unit: "mm",
        min: 1,
        max: 8,
        default: 3,
        step: 0.5,
      },
      {
        id: "style",
        label: { pl: "Styl", en: "Style", de: "Stil" },
        type: "select",
        options: [
          { id: "flat", pl: "Płaska", en: "Flat", de: "Flach" },
          { id: "sculptural", pl: "Rzeźbiona", en: "Sculptural", de: "Dreidimensional" },
          { id: "openwork", pl: "Ażurowa", en: "Openwork", de: "Filigran" },
        ],
        default: "flat",
      },
    ],
    fillFactors: { flat: 0.75, sculptural: 0.60, openwork: 0.38 },
    defaultFill: "flat",
    notes: {
      pl: "Waga szacowana z prostopadłościanu z korektą dla stylu wykonania.",
      en: "Weight estimated from bounding box with correction for style.",
      de: "Gewicht aus Quader mit Korrektur für den Ausführungsstil geschätzt.",
    },
  },
];

export function getProductType(id) {
  return PRODUCT_TYPES.find((p) => p.id === id);
}
