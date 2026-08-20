// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/materialStockSeed.js
// Regeneracja: npm run sync:pricing

// ============================================================
// ZESTAW STARTOWY TABELI MATERIALOW
// ============================================================
// Te liczby opisuja, ILE PLACIMY za material (rynek 2026-08). Narzut i zapas
// dokladamy w silniku, w `materialStock.js`, zeby ta tabela zostala zapisem
// kosztu, ktory da sie sprawdzic z faktura.
//
// DLACZEGO OSOBNY PLIK. Te same wartosci sa potrzebne w trzech miejscach,
// ktore nie widza sie nawzajem:
//
//   - `chat-api/server.js` zaklada z nich tabele w bazie,
//   - `scripts/derive-service-prices.mjs` liczy z nich etykiete "od X zl"
//     na kartach uslug w sklepie (build nie ma dostepu do bazy),
//   - `scripts/test-material-stock.mjs` sprawdza, czy stawka domyslna
//     trzyma sie mediany.
//
// Wczesniej byly wpisane jako tekst SQL w serwerze, a skrypt buildu wyluskiwal
// je z niego wyrazeniem regularnym. Dzialalo to do pierwszej zmiany zapisu:
// wtedy etykieta cichnie na starych cenach, a nikt tego nie zglasza, bo kwota
// dalej wyglada poprawnie.
//
// UWAGA NA GRANICE. Baza jest zrodlem prawdy dla WYCENY: wlasciciel zmienia
// stawke w panelu i kwota dla klienta idzie za nia od razu. Ten plik jest
// zrodlem prawdy dla ZALOZENIA tabeli i dla liczb, ktorych build nie moze
// odpytac z bazy. Etykieta "od" na karcie uslugi jest wiec z definicji
// z chwili buildu, a nie z chwili zakupu.

/**
 * @typedef {object} MaterialSeed
 * @property {string} material_id identyfikator zgodny z cennikiem lasera
 * @property {string} name_pl
 * @property {string} name_en
 * @property {string} name_de
 * @property {number} pln_per_m2 koszt zakupu za metr kwadratowy; 0 znaczy
 *   "nie kupujemy na metry"
 * @property {number|null} pln_per_piece koszt zakupu sztuki; ma pierwszenstwo
 *   przed stawka za metr
 * @property {number|null} thickness_mm
 * @property {string} notes
 */

/** @type {MaterialSeed[]} */
export const MATERIAL_SEED = [
  // ── ciecie CO2: plyty ────────────────────────────────────────────────────
  { material_id: "ply2", name_pl: "Sklejka 2mm", name_en: "Plywood 2mm", name_de: "Sperrholz 2mm", pln_per_m2: 18, pln_per_piece: null, thickness_mm: 2, notes: "rynek 2026-08" },
  { material_id: "ply3", name_pl: "Sklejka 3mm", name_en: "Plywood 3mm", name_de: "Sperrholz 3mm", pln_per_m2: 24, pln_per_piece: null, thickness_mm: 3, notes: "rynek 2026-08" },
  { material_id: "ply56", name_pl: "Sklejka 5-6mm", name_en: "Plywood 5-6mm", name_de: "Sperrholz 5-6mm", pln_per_m2: 40, pln_per_piece: null, thickness_mm: 6, notes: "rynek 2026-08" },
  // HDF, bez MDF (polecenie wlasciciela, 2026-08-20). Cena z Castoramy: arkusz
  // surowy 2800x2070x3 mm kosztuje 118 zl przy 5,796 m2, czyli 20,36 zl/m2.
  // Szescmilimetrowa plyta pilsniowa chodzi po 21-26 zl/m2, bo w tym materiale
  // cena prawie nie rosnie z gruboscia (inaczej niz w akrylu). Stad 22 zl/m2
  // dla calego zakresu do 6 mm. Wczesniej stalo tu 42 zl/m2, liczone dla MDF
  // 8 mm, czyli materialu, ktorego juz nie oferujemy.
  { material_id: "mdf8", name_pl: "Plyta HDF do 6mm", name_en: "HDF board up to 6mm", name_de: "HDF-Platte bis 6mm", pln_per_m2: 22, pln_per_piece: null, thickness_mm: 6, notes: "HDF surowe, Castorama 2026-08" },
  { material_id: "wood10", name_pl: "Lite drewno do 10mm", name_en: "Solid wood up to 10mm", name_de: "Massivholz bis 10mm", pln_per_m2: 115, pln_per_piece: null, thickness_mm: 10, notes: "dab, rynek 2026-08" },
  { material_id: "acr3", name_pl: "Akryl 3mm", name_en: "Acrylic 3mm", name_de: "Acryl 3mm", pln_per_m2: 167, pln_per_piece: null, thickness_mm: 3, notes: "rynek 2026-08" },
  { material_id: "acr5", name_pl: "Akryl 5mm", name_en: "Acrylic 5mm", name_de: "Acryl 5mm", pln_per_m2: 265, pln_per_piece: null, thickness_mm: 5, notes: "rynek 2026-08" },
  { material_id: "acr8", name_pl: "Akryl 8mm", name_en: "Acrylic 8mm", name_de: "Acryl 8mm", pln_per_m2: 425, pln_per_piece: null, thickness_mm: 8, notes: "rynek 2026-08" },
  { material_id: "leather2", name_pl: "Skora 1-2mm", name_en: "Leather 1-2mm", name_de: "Leder 1-2mm", pln_per_m2: 115, pln_per_piece: null, thickness_mm: 2, notes: "rynek 2026-08" },
  { material_id: "leather4", name_pl: "Skora 3-4mm", name_en: "Leather 3-4mm", name_de: "Leder 3-4mm", pln_per_m2: 200, pln_per_piece: null, thickness_mm: 4, notes: "rynek 2026-08" },
  { material_id: "paper", name_pl: "Papier / karton", name_en: "Paper / cardboard", name_de: "Papier / Karton", pln_per_m2: 10, pln_per_piece: null, thickness_mm: null, notes: "rynek 2026-08" },
  { material_id: "fabric", name_pl: "Tkanina / filc", name_en: "Fabric / felt", name_de: "Stoff / Filz", pln_per_m2: 32, pln_per_piece: null, thickness_mm: null, notes: "filc 3mm, rynek 2026-08" },
  { material_id: "rubber", name_pl: "Guma 2-3mm", name_en: "Rubber 2-3mm", name_de: "Gummi 2-3mm", pln_per_m2: 320, pln_per_piece: null, thickness_mm: 3, notes: "guma do pieczatek, rynek 2026-08" },

  // ── grawer CO2: material bez deklarowanej grubosci ───────────────────────
  { material_id: "wood", name_pl: "Lite drewno", name_en: "Solid wood", name_de: "Massivholz", pln_per_m2: 115, pln_per_piece: null, thickness_mm: null, notes: "dab, rynek 2026-08" },
  { material_id: "plywood", name_pl: "Sklejka", name_en: "Plywood", name_de: "Sperrholz", pln_per_m2: 24, pln_per_piece: null, thickness_mm: null, notes: "rynek 2026-08" },
  { material_id: "wood_other", name_pl: "Inne materialy drewnopochodne", name_en: "Other wood-based materials", name_de: "Andere Holzwerkstoffe", pln_per_m2: 30, pln_per_piece: null, thickness_mm: null, notes: "HDF/MDF, rynek 2026-08" },
  { material_id: "acrylic", name_pl: "Akryl", name_en: "Acrylic", name_de: "Acryl", pln_per_m2: 167, pln_per_piece: null, thickness_mm: null, notes: "3mm, rynek 2026-08" },
  { material_id: "leather", name_pl: "Skora", name_en: "Leather", name_de: "Leder", pln_per_m2: 115, pln_per_piece: null, thickness_mm: null, notes: "rynek 2026-08" },

  // ── kupowane na sztuki, nie na metry ─────────────────────────────────────
  { material_id: "glass", name_pl: "Szklo", name_en: "Glass", name_de: "Glas", pln_per_m2: 0, pln_per_piece: 12, thickness_mm: null, notes: "kupujemy sztukami, nie na metry" },
  { material_id: "stone", name_pl: "Kamien / lupek", name_en: "Stone / slate", name_de: "Stein / Schiefer", pln_per_m2: 0, pln_per_piece: 15, thickness_mm: null, notes: "plytka lupkowa, kupujemy sztukami" },

  // ── metale (laser Fiber) ─────────────────────────────────────────────────
  { material_id: "stainless", name_pl: "Stal nierdzewna 1mm", name_en: "Stainless steel 1mm", name_de: "Edelstahl 1mm", pln_per_m2: 300, pln_per_piece: null, thickness_mm: 1, notes: "rynek 2026-08" },
  { material_id: "aluminum", name_pl: "Aluminium 1mm", name_en: "Aluminium 1mm", name_de: "Aluminium 1mm", pln_per_m2: 200, pln_per_piece: null, thickness_mm: 1, notes: "rynek 2026-08" },
  { material_id: "anodized", name_pl: "Aluminium anodowane 1mm", name_en: "Anodised aluminium 1mm", name_de: "Eloxiertes Aluminium 1mm", pln_per_m2: 250, pln_per_piece: null, thickness_mm: 1, notes: "rynek 2026-08" },
  { material_id: "brass", name_pl: "Mosiadz 1mm", name_en: "Brass 1mm", name_de: "Messing 1mm", pln_per_m2: 750, pln_per_piece: null, thickness_mm: 1, notes: "rynek 2026-08" },
  { material_id: "copper", name_pl: "Miedz 1mm", name_en: "Copper 1mm", name_de: "Kupfer 1mm", pln_per_m2: 850, pln_per_piece: null, thickness_mm: 1, notes: "rynek 2026-08" },
  { material_id: "titanium", name_pl: "Tytan 1mm", name_en: "Titanium 1mm", name_de: "Titan 1mm", pln_per_m2: 1200, pln_per_piece: null, thickness_mm: 1, notes: "rynek 2026-08" },

  // ── wycena indywidualna: zero w OBU kolumnach ────────────────────────────
  // Zero nie znaczy "za darmo", tylko "tutaj nie wyceniamy". Kruszec rozlicza
  // sie wagowo i wedlug proby, wiec kazda liczba za metr bylaby fikcja.
  { material_id: "silver", name_pl: "Srebro", name_en: "Silver", name_de: "Silber", pln_per_m2: 0, pln_per_piece: 0, thickness_mm: null, notes: "metal rozliczany wagowo, wycena indywidualna" },
  { material_id: "gold", name_pl: "Zloto", name_en: "Gold", name_de: "Gold", pln_per_m2: 0, pln_per_piece: 0, thickness_mm: null, notes: "metal rozliczany wagowo, wycena indywidualna" },
];

/**
 * Zestaw startowy w postaci, ktorej oczekuje wycena.
 *
 * Silnik czyta `pln_per_m2` i `pln_per_piece` po `material_id`, czyli dokladnie
 * to, co zwraca zapytanie do bazy. Dzieki temu etykieta liczona przy buildzie
 * i kwota liczona przy zakupie ida z tego samego ksztaltu danych.
 */
export function seedAsStock() {
  return MATERIAL_SEED.map((m) => ({
    material_id: m.material_id,
    pln_per_m2: m.pln_per_m2,
    pln_per_piece: m.pln_per_piece,
  }));
}
