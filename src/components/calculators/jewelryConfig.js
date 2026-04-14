// ============================================================
// JEWELRY CALCULATOR — CONFIG, DATA & PRICING
// ============================================================
// Metal prices source: LBMA / Kitco (April 2026)
// Gemstone prices source: Rapaport / GemVal / IGS
// ============================================================

// --- METAL SPOT PRICES (PLN per gram, pure 999) ---
// Gold: ~$4,690/oz, Silver: ~$73.75/oz, Platinum: ~$1,950/oz
// 1 troy oz = 31.1035g, EUR/PLN = 4.28
export const METAL_PRICES = {
  gold:     { plnPerG: 645, symbol: "Au" },
  silver:   { plnPerG: 10.15, symbol: "Ag" },
  platinum: { plnPerG: 268, symbol: "Pt" },
};

export const EUR_PLN = 4.28;
export const MARGIN = 0.45;          // new creation margin
export const REPAIR_MARGIN = 0.15;   // repair/renovation margin (labor IS the product)
export const TOL_LOW = 0.25;
export const TOL_HIGH = 0.35;

// --- SERVICE TYPES ---
export const SERVICE_TYPES = [
  { id: "new", label: { pl: "Nowe zlecenie", en: "New creation", de: "Neuanfertigung" },
    desc: { pl: "Projektowanie i wykonanie biżuterii na zamówienie", en: "Custom jewelry design and creation", de: "Individuelles Schmuckdesign und -herstellung" },
    img: "/img/calc/services/new.png" },
  { id: "renovation", label: { pl: "Renowacja / Odświeżenie", en: "Renovation / Refresh", de: "Renovation / Auffrischung" },
    desc: { pl: "Czyszczenie, polerowanie, powlekanie, kontrola kamieni", en: "Cleaning, polishing, replating, stone check", de: "Reinigung, Politur, Neubeschichtung, Steinkontrolle" },
    img: "/img/calc/services/renovation.png" },
  { id: "repair", label: { pl: "Naprawa", en: "Repair", de: "Reparatur" },
    desc: { pl: "Zmiana rozmiaru, naprawa oprawek, wymiana kamieni, lutowanie", en: "Resizing, prong repair, stone replacement, soldering", de: "Größenanpassung, Fassungsreparatur, Steinersatz, Löten" },
    img: "/img/calc/services/repair.png" },
];

// --- PRODUCT LINES ---
export const PRODUCT_LINES = [
  { id: "woman", label: "AEJaCA Woman", desc: { pl: "Pierścionki, bransoletki, wisiorki, kolczyki, brosze", en: "Rings, bracelets, pendants, earrings, brooches", de: "Ringe, Armbänder, Anhänger, Ohrringe, Broschen" }, img: "/img/calc/lines/woman.png" },
  { id: "men", label: "AEJaCA Men", desc: { pl: "Sygnety, medaliki, bransoletki, spinki, łańcuchy", en: "Signet rings, medallions, bracelets, cufflinks, chains", de: "Siegelringe, Medaillons, Armbänder, Manschettenknöpfe, Ketten" }, img: "/img/calc/lines/men.png" },
  { id: "pet", label: "AEJaCA Pet", desc: { pl: "Zawieszki, ozdoby na obrożę, spinki", en: "Tags, collar charms, collar pins", de: "Anhänger, Halsbandschmuck, Nadeln" }, img: "/img/calc/lines/pet.png" },
];

// --- JEWELRY TYPES per line ---
export const JEWELRY_TYPES = {
  woman: [
    { id: "ring",      label: { pl: "Pierścionek", en: "Ring", de: "Ring" }, baseWeight: 4, laborH: 6, complexity: 1.0, img: "/img/calc/types/ring.png" },
    { id: "bracelet",  label: { pl: "Bransoletka", en: "Bracelet", de: "Armband" }, baseWeight: 15, laborH: 8, complexity: 1.2, img: "/img/calc/types/bracelet.png" },
    { id: "pendant",   label: { pl: "Wisiorek", en: "Pendant", de: "Anhänger" }, baseWeight: 4, laborH: 4, complexity: 0.8, img: "/img/calc/types/pendant.png" },
    { id: "earrings",  label: { pl: "Kolczyki (para)", en: "Earrings (pair)", de: "Ohrringe (Paar)" }, baseWeight: 4, laborH: 7, complexity: 1.1, img: "/img/calc/types/earrings.png" },
    { id: "brooch",    label: { pl: "Broszka", en: "Brooch", de: "Brosche" }, baseWeight: 8, laborH: 6, complexity: 1.0, img: "/img/calc/types/brooch.png" },
    { id: "necklace",  label: { pl: "Naszyjnik / łańcuszek", en: "Necklace / chain", de: "Halskette / Kette" }, baseWeight: 12, laborH: 5, complexity: 0.9, img: "/img/calc/types/necklace.png" },
  ],
  men: [
    { id: "signet",    label: { pl: "Sygnet", en: "Signet ring", de: "Siegelring" }, baseWeight: 12, laborH: 7, complexity: 1.1, img: "/img/calc/types/signet.png" },
    { id: "medallion", label: { pl: "Medalik", en: "Medallion", de: "Medaillon" }, baseWeight: 8, laborH: 5, complexity: 0.9, img: "/img/calc/types/medallion.png" },
    { id: "bracelet_m",label: { pl: "Bransoletka", en: "Bracelet", de: "Armband" }, baseWeight: 25, laborH: 8, complexity: 1.0, img: "/img/calc/types/bracelet_m.png" },
    { id: "cufflinks", label: { pl: "Spinki do mankietów (para)", en: "Cufflinks (pair)", de: "Manschettenknöpfe (Paar)" }, baseWeight: 10, laborH: 6, complexity: 1.0, img: "/img/calc/types/cufflinks.png" },
    { id: "tie_clip",  label: { pl: "Spinka do krawata", en: "Tie clip", de: "Krawattennadel" }, baseWeight: 6, laborH: 4, complexity: 0.7, img: "/img/calc/types/tie_clip.png" },
    { id: "chain_m",   label: { pl: "Łańcuch", en: "Chain", de: "Kette" }, baseWeight: 20, laborH: 5, complexity: 0.8, img: "/img/calc/types/chain_m.png" },
  ],
  pet: [
    { id: "tag",       label: { pl: "Zawieszka / adresówka", en: "Tag / ID pendant", de: "Anhänger / Adressmarke" }, baseWeight: 4, laborH: 3, complexity: 0.6, img: "/img/calc/types/tag.png" },
    { id: "charm",     label: { pl: "Ozdoba na obrożę", en: "Collar charm", de: "Halsbandschmuck" }, baseWeight: 3, laborH: 3, complexity: 0.6, img: "/img/calc/types/charm.png" },
    { id: "pin",       label: { pl: "Spinka na obrożę", en: "Collar pin", de: "Halsbandnadel" }, baseWeight: 2, laborH: 2, complexity: 0.5, img: "/img/calc/types/pin.png" },
  ],
};

// --- METALS with purity ---
export const METALS = [
  { id: "gold_24k", metal: "gold", label: { pl: "Złoto 24k (999)", en: "Gold 24k (999)", de: "Gold 24k (999)" }, purity: 0.999, laborMul: 1.3 },
  { id: "gold_18k", metal: "gold", label: { pl: "Złoto 18k (750)", en: "Gold 18k (750)", de: "Gold 18k (750)" }, purity: 0.750, laborMul: 1.0 },
  { id: "gold_14k", metal: "gold", label: { pl: "Złoto 14k (585)", en: "Gold 14k (585)", de: "Gold 14k (585)" }, purity: 0.585, laborMul: 1.0 },
  { id: "gold_9k",  metal: "gold", label: { pl: "Złoto 9k (375)", en: "Gold 9k (375)", de: "Gold 9k (375)" }, purity: 0.375, laborMul: 0.9 },
  { id: "silver",   metal: "silver", label: { pl: "Srebro 925", en: "Silver 925", de: "Silber 925" }, purity: 0.925, laborMul: 0.7 },
  { id: "platinum",  metal: "platinum", label: { pl: "Platyna 950", en: "Platinum 950", de: "Platin 950" }, purity: 0.950, laborMul: 1.5 },
  { id: "custom_metal", metal: null, label: { pl: "Inny kruszec", en: "Other metal", de: "Anderes Metall" }, purity: null, laborMul: null, custom: true },
];

// --- WEIGHT RANGES ---
// visual: ringW = border width for ring silhouette, ringS = size
export const WEIGHTS = [
  { id: "light",    label: { pl: "Lekka / delikatna", en: "Light / delicate", de: "Leicht / zart" }, mul: 0.6, visual: { ringW: 1, ringS: 28 } },
  { id: "standard", label: { pl: "Klasyczna", en: "Standard", de: "Standard" }, mul: 1.0, visual: { ringW: 3, ringS: 32 } },
  { id: "heavy",    label: { pl: "Masywna", en: "Heavy / bold", de: "Massiv / kräftig" }, mul: 1.8, visual: { ringW: 6, ringS: 38 } },
  { id: "custom_w", label: { pl: "Niestandardowa", en: "Custom", de: "Individuell" }, mul: null, custom: true },
];

// --- MANUFACTURING METHODS ---
export const METHODS = [
  { id: "handmade", label: { pl: "Ręczna (lutowanie + osadzanie)", en: "Handmade (soldering + setting)", de: "Handarbeit (Löten + Fassen)" },
    desc: { pl: "Najwyższa jakość, unikalne wykonanie", en: "Highest quality, unique craftsmanship", de: "Höchste Qualität, einzigartige Handwerkskunst" }, laborMul: 1.0, laborRate: 150 },
  { id: "cast", label: { pl: "Odlew (lost wax)", en: "Cast (lost wax)", de: "Guss (Wachsausschmelzverfahren)" },
    desc: { pl: "Precyzyjny odlew, idealne do serii", en: "Precision casting, ideal for series", de: "Präzisionsguss, ideal für Serien" }, laborMul: 0.6, laborRate: 150 },
  { id: "custom_m", label: { pl: "Niestandardowa", en: "Custom", de: "Individuell" }, laborMul: null, custom: true },
];

// --- GALVANIC PLATING ---
export const PLATING = [
  { id: "none",     label: { pl: "Brak", en: "None", de: "Keine" }, cost: 0 },
  { id: "rhodium",  label: { pl: "Rod (standard dla białego złota/srebra)", en: "Rhodium (standard for white gold/silver)", de: "Rhodium (Standard für Weißgold/Silber)" }, cost: 120 },
  { id: "gold_pl",  label: { pl: "Złocenie (vermeil)", en: "Gold plating (vermeil)", de: "Vergoldung (Vermeil)" }, cost: 90 },
  { id: "rose_pl",  label: { pl: "Złocenie różowe", en: "Rose gold plating", de: "Roségold-Beschichtung" }, cost: 90 },
  { id: "custom_pl",label: { pl: "Inne pokrycie", en: "Other plating", de: "Andere Beschichtung" }, cost: null, custom: true },
];

// --- GEMSTONES ---
// basePLN = approximate wholesale PLN per carat for medium quality, ~0.5ct
export const GEMSTONES = [
  { id: "none", label: { pl: "Bez kamienia", en: "No gemstone", de: "Ohne Stein" }, basePLN: 0, precious: false, hasGrades: false },
  // --- Natural precious ---
  { id: "diamond",   label: { pl: "Diament", en: "Diamond", de: "Diamant" }, basePLN: 12800, precious: true, hasGrades: true, img: "/img/calc/gems/diamond.png" },
  { id: "ruby",      label: { pl: "Rubin", en: "Ruby", de: "Rubin" }, basePLN: 6400, precious: true, hasGrades: true, img: "/img/calc/gems/ruby.png" },
  { id: "sapphire",  label: { pl: "Szafir", en: "Sapphire", de: "Saphir" }, basePLN: 4300, precious: true, hasGrades: true, img: "/img/calc/gems/sapphire.png" },
  { id: "emerald",   label: { pl: "Szmaragd", en: "Emerald", de: "Smaragd" }, basePLN: 3400, precious: true, hasGrades: true, img: "/img/calc/gems/emerald.png" },
  // --- Lab-grown (synthetic) ---
  { id: "lab_diamond",  label: { pl: "Diament lab-grown", en: "Lab-grown diamond", de: "Labor-Diamant" }, basePLN: 1500, precious: false, hasGrades: true, lab: true, img: "/img/calc/gems/diamond.png" },
  { id: "moissanite",   label: { pl: "Mosanit", en: "Moissanite", de: "Moissanit" }, basePLN: 400, precious: false, hasGrades: false, lab: true, img: "/img/calc/gems/moissanite.png" },
  { id: "cz",           label: { pl: "Cyrkonia (CZ)", en: "Cubic zirconia (CZ)", de: "Zirkonia (CZ)" }, basePLN: 10, precious: false, hasGrades: false, lab: true, img: "/img/calc/gems/cz.png" },
  { id: "lab_ruby",     label: { pl: "Rubin lab-grown", en: "Lab-grown ruby", de: "Labor-Rubin" }, basePLN: 800, precious: false, hasGrades: true, lab: true, img: "/img/calc/gems/ruby.png" },
  { id: "lab_sapphire", label: { pl: "Szafir lab-grown", en: "Lab-grown sapphire", de: "Labor-Saphir" }, basePLN: 600, precious: false, hasGrades: true, lab: true, img: "/img/calc/gems/sapphire.png" },
  { id: "lab_emerald",  label: { pl: "Szmaragd lab-grown", en: "Lab-grown emerald", de: "Labor-Smaragd" }, basePLN: 500, precious: false, hasGrades: true, lab: true, img: "/img/calc/gems/emerald.png" },
  // --- Natural semi-precious ---
  { id: "tanzanite", label: { pl: "Tanzanit", en: "Tanzanite", de: "Tansanit" }, basePLN: 1700, precious: false, hasGrades: true, img: "/img/calc/gems/tanzanite.png" },
  { id: "aquamarine",label: { pl: "Akwamaryn", en: "Aquamarine", de: "Aquamarin" }, basePLN: 430, precious: false, hasGrades: false, img: "/img/calc/gems/aquamarine.png" },
  { id: "tourmaline",label: { pl: "Turmalin", en: "Tourmaline", de: "Turmalin" }, basePLN: 640, precious: false, hasGrades: false, img: "/img/calc/gems/tourmaline.png" },
  { id: "topaz",     label: { pl: "Topaz", en: "Topaz", de: "Topas" }, basePLN: 130, precious: false, hasGrades: false, img: "/img/calc/gems/topaz.png" },
  { id: "amethyst",  label: { pl: "Ametyst", en: "Amethyst", de: "Amethyst" }, basePLN: 65, precious: false, hasGrades: false, img: "/img/calc/gems/amethyst.png" },
  { id: "citrine",   label: { pl: "Cytryn", en: "Citrine", de: "Citrin" }, basePLN: 55, precious: false, hasGrades: false, img: "/img/calc/gems/citrine.png" },
  { id: "garnet",    label: { pl: "Granat", en: "Garnet", de: "Granat" }, basePLN: 85, precious: false, hasGrades: false, img: "/img/calc/gems/garnet.png" },
  { id: "peridot",   label: { pl: "Perydot", en: "Peridot", de: "Peridot" }, basePLN: 170, precious: false, hasGrades: false, img: "/img/calc/gems/peridot.png" },
  { id: "opal",      label: { pl: "Opal", en: "Opal", de: "Opal" }, basePLN: 430, precious: false, hasGrades: false, img: "/img/calc/gems/opal.png" },
  { id: "moonstone", label: { pl: "Kamień księżycowy", en: "Moonstone", de: "Mondstein" }, basePLN: 85, precious: false, hasGrades: false, img: "/img/calc/gems/moonstone.png" },
  { id: "lapis",     label: { pl: "Lapis lazuli", en: "Lapis lazuli", de: "Lapislazuli" }, basePLN: 55, precious: false, hasGrades: false, img: "/img/calc/gems/lapis.png" },
  { id: "turquoise", label: { pl: "Turkus", en: "Turquoise", de: "Türkis" }, basePLN: 85, precious: false, hasGrades: false, img: "/img/calc/gems/turquoise.png" },
  { id: "onyx",      label: { pl: "Onyks", en: "Onyx", de: "Onyx" }, basePLN: 30, precious: false, hasGrades: false, img: "/img/calc/gems/onyx.png" },
  { id: "tiger_eye", label: { pl: "Tygrysie oko", en: "Tiger eye", de: "Tigerauge" }, basePLN: 20, precious: false, hasGrades: false, img: "/img/calc/gems/tiger_eye.png" },
  { id: "custom_gem",label: { pl: "Inny kamień", en: "Other stone", de: "Anderer Stein" }, basePLN: null, precious: false, hasGrades: false, custom: true },
];

// --- STONE SIZE categories ---
// visual: gemD = diameter in px for stone size preview circle
export const STONE_SIZES = [
  { id: "accent", label: { pl: "Akcent (0.01-0.05 ct)", en: "Accent (0.01-0.05 ct)", de: "Akzent (0.01-0.05 ct)" }, ct: 0.03, priceMul: 0.15, visual: { gemD: 4 } },
  { id: "small",  label: { pl: "Mały (0.1-0.3 ct)", en: "Small (0.1-0.3 ct)", de: "Klein (0.1-0.3 ct)" }, ct: 0.2, priceMul: 0.5, visual: { gemD: 8 } },
  { id: "medium", label: { pl: "Średni (0.3-0.7 ct)", en: "Medium (0.3-0.7 ct)", de: "Mittel (0.3-0.7 ct)" }, ct: 0.5, priceMul: 1.0, visual: { gemD: 14 } },
  { id: "large",  label: { pl: "Duży (0.7-1.5 ct)", en: "Large (0.7-1.5 ct)", de: "Groß (0.7-1.5 ct)" }, ct: 1.0, priceMul: 2.2, visual: { gemD: 20 } },
  { id: "xl",     label: { pl: "XL (1.5+ ct)", en: "XL (1.5+ ct)", de: "XL (1.5+ ct)" }, ct: null, priceMul: null, custom: true },
];

// --- STONE COUNT ---
export const STONE_COUNTS = [
  { id: "1",  label: { pl: "1 kamień", en: "1 stone", de: "1 Stein" }, count: 1 },
  { id: "3",  label: { pl: "3 kamienie", en: "3 stones", de: "3 Steine" }, count: 3 },
  { id: "5",  label: { pl: "5 kamieni", en: "5 stones", de: "5 Steine" }, count: 5 },
  { id: "10", label: { pl: "10 kamieni (pavé)", en: "10 stones (pavé)", de: "10 Steine (Pavé)" }, count: 10 },
  { id: "20", label: { pl: "20+ kamieni (halo/pavé)", en: "20+ stones (halo/pavé)", de: "20+ Steine (Halo/Pavé)" }, count: 20 },
  { id: "custom_n", label: { pl: "Niestandardowa ilość", en: "Custom count", de: "Individuelle Anzahl" }, count: null, custom: true },
];

// --- DIAMOND CLARITY grades ---
export const DIAMOND_CLARITY = [
  { id: "IF",  label: "IF / FL", mul: 2.0 },
  { id: "VVS", label: "VVS1 / VVS2", mul: 1.4 },
  { id: "VS",  label: "VS1 / VS2", mul: 1.0 },
  { id: "SI",  label: "SI1 / SI2", mul: 0.65 },
  { id: "I",   label: "I1 / I2", mul: 0.35 },
];

// --- DIAMOND COLOR grades ---
export const DIAMOND_COLOR = [
  { id: "DEF", label: "D-F (Colorless)", mul: 1.5 },
  { id: "GH",  label: "G-H (Near colorless)", mul: 1.0 },
  { id: "IJ",  label: "I-J", mul: 0.75 },
  { id: "KL",  label: "K-L+", mul: 0.55 },
];

// --- COLORED STONE quality grades ---
export const GEM_QUALITY = [
  { id: "AAA", label: { pl: "Premium (AAA)", en: "Premium (AAA)", de: "Premium (AAA)" }, mul: 2.5 },
  { id: "AA",  label: { pl: "Dobra (AA)", en: "Fine (AA)", de: "Fein (AA)" }, mul: 1.5 },
  { id: "A",   label: { pl: "Standardowa (A)", en: "Standard (A)", de: "Standard (A)" }, mul: 1.0 },
  { id: "B",   label: { pl: "Komercyjna (B)", en: "Commercial (B)", de: "Kommerziell (B)" }, mul: 0.5 },
];

// --- CERTIFICATION ---
export const CERTIFICATIONS = [
  { id: "gia",   label: { pl: "GIA / IGI (międzynarodowy)", en: "GIA / IGI (international)", de: "GIA / IGI (international)" }, mul: 1.30 },
  { id: "other", label: { pl: "Inny certyfikat", en: "Other certificate", de: "Anderes Zertifikat" }, mul: 1.15 },
  { id: "none",  label: { pl: "Bez certyfikatu", en: "No certificate", de: "Ohne Zertifikat" }, mul: 1.0 },
];

// --- RENOVATION SERVICES (market-verified PLN, 2025-2026) ---
// Sources: Jubiler Legnica, Fafreto, Slojewski, Stanczyk Warszawa
export const RENOVATION_SERVICES = [
  { id: "clean",    label: { pl: "Głębokie czyszczenie i polerowanie", en: "Deep cleaning & polishing", de: "Tiefenreinigung & Politur" }, basePLN: 30 },
  { id: "rhodium_r",label: { pl: "Rodowanie (replating)", en: "Rhodium replating", de: "Rhodium-Neubeschichtung" }, basePLN: 60 },
  { id: "gold_r",   label: { pl: "Złocenie (replating)", en: "Gold replating", de: "Neuvergoldung" }, basePLN: 70 },
  { id: "stone_ck", label: { pl: "Kontrola i dokręcenie kamieni", en: "Stone check & tightening", de: "Steinkontrolle & Nachfassen" }, basePLN: 35 },
  { id: "engrave",  label: { pl: "Grawerowanie / personalizacja", en: "Engraving / personalization", de: "Gravur / Personalisierung" }, basePLN: 55 },
];

// --- REPAIR SERVICES (market-verified PLN, 2025-2026) ---
// Sources: Jubiler Legnica, RAJ Legnica, Markiewicz, cennik-uslug.pl
export const REPAIR_SERVICES = [
  { id: "resize",   label: { pl: "Zmiana rozmiaru pierścionka", en: "Ring resizing", de: "Ringgröße ändern" }, basePLN: 80 },
  { id: "prong",    label: { pl: "Naprawa łapek / oprawki", en: "Prong / setting repair", de: "Krappen- / Fassungsreparatur" }, basePLN: 60 },
  { id: "stone_rep",label: { pl: "Wymiana kamienia (bez kosztu kamienia)", en: "Stone replacement (excl. stone cost)", de: "Steinersatz (ohne Steinkosten)" }, basePLN: 70 },
  { id: "clasp",    label: { pl: "Naprawa zapięcia / mechanizmu", en: "Clasp / mechanism repair", de: "Verschluss- / Mechanismus-Reparatur" }, basePLN: 50 },
  { id: "chain_rep",label: { pl: "Naprawa łańcuszka / ogniwa", en: "Chain / link repair", de: "Ketten- / Gliederreparatur" }, basePLN: 50 },
  { id: "solder",   label: { pl: "Lutowanie / łączenie", en: "Soldering / joining", de: "Löten / Verbinden" }, basePLN: 50 },
];

// Metal multiplier for repair/renovation costs
// Gold higher due to careful work + risk, platinum highest
export const REPAIR_METAL_MUL = { silver: 1.0, gold: 1.3, platinum: 1.7 };

// --- QUANTITY TIERS (jewelry-specific) ---
export const QTY_TIERS = [
  { id: "1",    label: { pl: "1 szt.", en: "1 pc", de: "1 Stk." }, qty: 1, discount: 0 },
  { id: "2-5",  label: { pl: "2-5 szt.", en: "2-5 pcs", de: "2-5 Stk." }, qty: 3, discount: 0.05 },
  { id: "6-10", label: { pl: "6-10 szt.", en: "6-10 pcs", de: "6-10 Stk." }, qty: 8, discount: 0.10 },
  { id: "10+",  label: { pl: "10+ szt.", en: "10+ pcs", de: "10+ Stk." }, qty: null, discount: null, custom: true },
];

// --- GENERIC JEWELRY TYPES (for renovation/repair) ---
export const GENERIC_TYPES = [
  { id: "ring_g",     label: { pl: "Pierścionek / sygnet", en: "Ring / signet", de: "Ring / Siegelring" }, img: "/img/calc/types/ring.png" },
  { id: "bracelet_g", label: { pl: "Bransoletka", en: "Bracelet", de: "Armband" },                         img: "/img/calc/types/bracelet.png" },
  { id: "pendant_g",  label: { pl: "Wisiorek / medalik", en: "Pendant / medallion", de: "Anhänger / Medaillon" }, img: "/img/calc/types/pendant.png" },
  { id: "earrings_g", label: { pl: "Kolczyki", en: "Earrings", de: "Ohrringe" },                           img: "/img/calc/types/earrings.png" },
  { id: "necklace_g", label: { pl: "Naszyjnik / łańcuszek", en: "Necklace / chain", de: "Halskette / Kette" }, img: "/img/calc/types/necklace.png" },
  { id: "other_g",    label: { pl: "Inne", en: "Other", de: "Andere" } },
];

// --- GENERIC METALS (for renovation/repair) ---
export const GENERIC_METALS = [
  { id: "silver_g",   label: { pl: "Srebro", en: "Silver", de: "Silber" }, metalKey: "silver" },
  { id: "gold_g",     label: { pl: "Złoto", en: "Gold", de: "Gold" }, metalKey: "gold" },
  { id: "platinum_g", label: { pl: "Platyna", en: "Platinum", de: "Platin" }, metalKey: "platinum" },
  { id: "other_m",    label: { pl: "Inny / nie wiem", en: "Other / not sure", de: "Anderes / unsicher" }, metalKey: "silver" },
];
