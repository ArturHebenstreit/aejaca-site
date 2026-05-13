/**
 * AEJaCA — Filament Types Seed Script
 * Usage: DATABASE_URL=postgres://... node scripts/seed-filament-types.mjs
 *
 * Idempotent: uses INSERT ... ON CONFLICT (type_id) DO UPDATE
 * Run after filament-schema.sql to populate initial data.
 */

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false,
});

// ============================================================
// FILAMENT TYPE DATA (~45 types)
// ============================================================
const TYPES = [
  // ── STANDARD ─────────────────────────────────────────────
  {
    type_id: "pla", name: "PLA", category: "standard",
    nozzle_min: 190, nozzle_max: 220, bed_min: 20, bed_max: 60, temp_resistance: 55,
    speed_min: 40, speed_max: 80, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 100, enclosure: "no",
    difficulty: 1, density: 1.24, price_per_kg: 70,
    props: ["easy", "rigid", "biodegradable", "low-warp"],
    uses_pl: "Modele dekoracyjne, prototypy, figurki, breloki, zabawki",
    uses_en: "Decorative models, prototypes, figurines, keychains, toys",
    uses_de: "Dekorationsmodelle, Prototypen, Figuren, Schlüsselanhänger, Spielzeug",
    notes_pl: "Najłatwiejszy w druku. Niska odporność na temperaturę — nie do zastosowań zewnętrznych ani w samochodzie.",
    notes_en: "Easiest to print. Low heat resistance — not for outdoor or car use.",
    notes_de: "Einfachstes Material. Geringe Wärmebeständigkeit — nicht für Außen- oder Fahrzeuganwendungen.",
  },
  {
    type_id: "pla-plus", name: "PLA+", category: "standard",
    nozzle_min: 200, nozzle_max: 230, bed_min: 25, bed_max: 60, temp_resistance: 65,
    speed_min: 40, speed_max: 80, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 100, enclosure: "no",
    difficulty: 1, density: 1.24, price_per_kg: 85,
    props: ["easy", "rigid", "tougher-than-pla", "low-warp"],
    uses_pl: "Użytkowe modele, obudowy, części wymagające większej wytrzymałości niż PLA",
    uses_en: "Functional models, enclosures, parts needing more toughness than PLA",
    uses_de: "Funktionelle Modelle, Gehäuse, Teile die robuster als PLA sein müssen",
    notes_pl: "Lepsze właściwości mechaniczne niż PLA standard. Trudniejszy w druku niż PLA, ale podobny. Wyższa udarność.",
    notes_en: "Better mechanical properties than standard PLA. Slightly harder to print but similar. Higher impact resistance.",
    notes_de: "Bessere mechanische Eigenschaften als Standard-PLA. Ähnlich einfach zu drucken. Höhere Schlagzähigkeit.",
  },
  {
    type_id: "pla-silk", name: "PLA Silk", category: "standard",
    nozzle_min: 210, nozzle_max: 230, bed_min: 25, bed_max: 60, temp_resistance: 52,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 4.0, retraction_max: 7.0, cooling: 100, enclosure: "no",
    difficulty: 2, density: 1.24, price_per_kg: 90,
    props: ["shiny", "rigid", "decorative", "low-warp"],
    uses_pl: "Ozdoby, biżuteria, trofea, figurki kolekcjonerskie, rekwizyty",
    uses_en: "Decorations, jewelry, trophies, collectibles, props",
    uses_de: "Dekorationen, Schmuck, Trophäen, Sammelstücke",
    notes_pl: "Efekt jedwabistego połysku. Wyższa temperatura niż PLA standard. Słabe mostki — wymaga wolniejszej prędkości.",
    notes_en: "Silky shine effect. Higher temp than standard PLA. Poor bridging — requires slower speed.",
    notes_de: "Seidiger Glanzeffekt. Höhere Temp. als Standard-PLA. Schlechte Überbrückung.",
  },
  {
    type_id: "pla-cf", name: "PLA-CF", category: "standard",
    nozzle_min: 200, nozzle_max: 230, bed_min: 25, bed_max: 60, temp_resistance: 60,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 100, enclosure: "no",
    difficulty: 2, density: 1.30, price_per_kg: 130,
    props: ["stiff", "carbon-fiber", "low-warp", "matte-finish"],
    uses_pl: "Lekkie obudowy, wsporniki, drony hobby, modele RC",
    uses_en: "Lightweight enclosures, brackets, hobby drones, RC models",
    uses_de: "Leichte Gehäuse, Halterungen, Hobby-Drohnen, RC-Modelle",
    notes_pl: "Wymaga hardened nozzle (stal hartowana). Matowe wykończenie z efektem węglowym. Bardziej sztywny niż PLA.",
    notes_en: "Requires hardened nozzle. Matte carbon-look finish. Stiffer than PLA.",
    notes_de: "Gehärtete Düse erforderlich. Matte Kohlenstoff-Optik. Steifer als PLA.",
  },
  {
    type_id: "pla-ht", name: "PLA HT", category: "standard",
    nozzle_min: 200, nozzle_max: 240, bed_min: 45, bed_max: 80, temp_resistance: 85,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 80, enclosure: "recommended",
    difficulty: 3, density: 1.24, price_per_kg: 120,
    props: ["rigid", "heat-tolerant", "low-warp"],
    uses_pl: "Elementy narażone na wyższe temperatury — wnętrze samochodu, obudowy sprzętu",
    uses_en: "Parts exposed to higher temps — car interior, equipment housings",
    uses_de: "Teile die höheren Temperaturen ausgesetzt sind — Fahrzeuginnenraum, Gerätegehäuse",
    notes_pl: "Wymaga wyżej temperaturę łoża. Po wydrukowaniu wymaga annealingu (wygrzewania) dla maksymalnej odporności.",
    notes_en: "Requires higher bed temp. Annealing after printing maximizes heat resistance.",
    notes_de: "Höhere Betttemperatur erforderlich. Wärmebehandlung nach dem Druck maximiert Wärmebeständigkeit.",
  },
  {
    type_id: "pla-wood", name: "PLA Wood", category: "specialty",
    nozzle_min: 195, nozzle_max: 220, bed_min: 20, bed_max: 60, temp_resistance: 55,
    speed_min: 30, speed_max: 50, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 100, enclosure: "no",
    difficulty: 2, density: 1.28, price_per_kg: 110,
    props: ["wood-fill", "natural-look", "sandable", "paintable"],
    uses_pl: "Dekoracje imitujące drewno, meble miniaturowe, figurki, gadżety",
    uses_en: "Wood-look decorations, miniature furniture, figurines, gadgets",
    uses_de: "Holzoptik-Dekorationen, Miniaturmöbel, Figuren, Gadgets",
    notes_pl: "Zawiera włókna drzewne — efekt drewna. Można szlifować, bejcować i malować. Może korkować dysze — otwarta dysza ≥0.4mm.",
    notes_en: "Contains wood fibers — wood feel. Can be sanded, stained and painted. May clog nozzle — use ≥0.4mm nozzle.",
    notes_de: "Enthält Holzfasern — Holzoptik. Schleifbar, beizbar und lackierbar. Kann Düse verstopfen — ≥0,4mm Düse verwenden.",
  },
  {
    type_id: "pla-metal", name: "PLA Metal", category: "specialty",
    nozzle_min: 195, nozzle_max: 220, bed_min: 20, bed_max: 60, temp_resistance: 55,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 100, enclosure: "no",
    difficulty: 2, density: 3.50, price_per_kg: 200,
    props: ["metal-fill", "heavy", "polishable", "decorative"],
    uses_pl: "Dekoracje imitujące metal (miedź, brąz, żelazo), figurki, biżuteria, ozdoby",
    uses_en: "Metal-look decorations (copper, bronze, iron), figurines, jewelry, ornaments",
    uses_de: "Metalloptik-Dekorationen (Kupfer, Bronze, Eisen), Figuren, Schmuck",
    notes_pl: "Wypełniony proszkiem metalowym — bardzo ciężki. Wymaga hardened nozzle. Można polerować do połysku metalicznego.",
    notes_en: "Filled with metal powder — very heavy. Requires hardened nozzle. Can be polished to metallic shine.",
    notes_de: "Mit Metallpulver gefüllt — sehr schwer. Gehärtete Düse erforderlich. Kann zu Metallglanz poliert werden.",
  },
  {
    type_id: "pla-marble", name: "PLA Marble", category: "specialty",
    nozzle_min: 195, nozzle_max: 220, bed_min: 20, bed_max: 60, temp_resistance: 55,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 100, enclosure: "no",
    difficulty: 1, density: 1.28, price_per_kg: 100,
    props: ["marble-look", "decorative", "low-warp"],
    uses_pl: "Dekoracje imitujące marmur, wazony, doniczki, rzeźby",
    uses_en: "Marble-look decorations, vases, planters, sculptures",
    uses_de: "Marmoroptik-Dekorationen, Vasen, Blumentöpfe, Skulpturen",
    notes_pl: "Efekt marmuru dzięki mieszance białego i szarego filamentu. Łatwy w druku jak PLA.",
    notes_en: "Marble effect from white and grey filament blend. As easy to print as PLA.",
    notes_de: "Marmoreffekt durch Mischung aus weißem und grauem Filament. Genauso einfach wie PLA.",
  },

  // ── FLEXIBLE ─────────────────────────────────────────────
  {
    type_id: "tpu-95a", name: "TPU 95A", category: "flexible",
    nozzle_min: 220, nozzle_max: 240, bed_min: 30, bed_max: 60, temp_resistance: 80,
    speed_min: 15, speed_max: 35, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 0.0, retraction_max: 2.0, cooling: 80, enclosure: "no",
    difficulty: 3, density: 1.21, price_per_kg: 100,
    props: ["flexible", "rubber-like", "abrasion-resistant", "shock-absorbing"],
    uses_pl: "Uszczelki, etui na telefon, podeszwy, amortyzatory, koła robotów",
    uses_en: "Gaskets, phone cases, soles, shock absorbers, robot wheels",
    uses_de: "Dichtungen, Handyhüllen, Sohlen, Stoßdämpfer, Roboterräder",
    notes_pl: "Bardzo wolna prędkość druku. Minimalna retrakcja. Direct drive zalecany — Bowden problematyczny.",
    notes_en: "Very slow print speed. Minimal retraction. Direct drive recommended — Bowden problematic.",
    notes_de: "Sehr langsame Druckgeschwindigkeit. Minimale Retraktion. Direktantrieb empfohlen.",
  },
  {
    type_id: "tpu-85a", name: "TPU 85A", category: "flexible",
    nozzle_min: 210, nozzle_max: 240, bed_min: 30, bed_max: 60, temp_resistance: 75,
    speed_min: 10, speed_max: 25, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 0.0, retraction_max: 1.0, cooling: 80, enclosure: "no",
    difficulty: 4, density: 1.18, price_per_kg: 120,
    props: ["very-flexible", "rubber-like", "soft-touch"],
    uses_pl: "Miękkie uszczelki, wkładki do butów, elementy antypoślizgowe",
    uses_en: "Soft gaskets, shoe insoles, anti-slip elements",
    uses_de: "Weiche Dichtungen, Schuheinlagen, rutschfeste Elemente",
    notes_pl: "Bardzo miękki — wymaga wyłącznie direct drive. Bardzo niska prędkość. Bez retrakcji.",
    notes_en: "Very soft — requires direct drive extruder only. Very low speed. No retraction.",
    notes_de: "Sehr weich — nur Direktantrieb. Sehr niedrige Geschwindigkeit. Keine Retraktion.",
  },
  {
    type_id: "tpu-45d", name: "TPU 45D", category: "flexible",
    nozzle_min: 215, nozzle_max: 240, bed_min: 30, bed_max: 50, temp_resistance: 70,
    speed_min: 8, speed_max: 20, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 0.0, retraction_max: 0.5, cooling: 80, enclosure: "no",
    difficulty: 5, density: 1.15, price_per_kg: 140,
    props: ["ultra-flexible", "gel-like", "soft-touch"],
    uses_pl: "Bardzo miękkie wkładki, elementy haptyczne, prototypy ergonomiczne",
    uses_en: "Very soft insoles, haptic elements, ergonomic prototypes",
    uses_de: "Sehr weiche Einlagen, haptische Elemente, ergonomische Prototypen",
    notes_pl: "Ekstremalnie miękki materiał (Shore A ~45). Tylko direct drive. Trudny w druku.",
    notes_en: "Extremely soft material (Shore A ~45). Direct drive only. Difficult to print.",
    notes_de: "Extrem weiches Material (Shore A ~45). Nur Direktantrieb. Schwer zu drucken.",
  },
  {
    type_id: "tpe", name: "TPE", category: "flexible",
    nozzle_min: 220, nozzle_max: 250, bed_min: 40, bed_max: 60, temp_resistance: 70,
    speed_min: 15, speed_max: 30, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 0.0, retraction_max: 2.0, cooling: 80, enclosure: "no",
    difficulty: 4, density: 1.20, price_per_kg: 110,
    props: ["flexible", "rubber-like", "chemical-resistant"],
    uses_pl: "Gumowe elementy, uszczelki chemoodporne",
    uses_en: "Rubber-like parts, chemically resistant gaskets",
    uses_de: "Gummiartige Teile, chemikalienbeständige Dichtungen",
    notes_pl: "Elastomer termoplastyczny. Podobny do TPU ale nieco twardszy. Direct drive zalecany.",
    notes_en: "Thermoplastic elastomer. Similar to TPU but slightly harder. Direct drive recommended.",
    notes_de: "Thermoplastisches Elastomer. Ähnlich wie TPU aber etwas härter. Direktantrieb empfohlen.",
  },

  // ── ENGINEERING — PETG FAMILY ────────────────────────────
  {
    type_id: "petg", name: "PETG", category: "engineering",
    nozzle_min: 230, nozzle_max: 250, bed_min: 70, bed_max: 90, temp_resistance: 80,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 50, enclosure: "recommended",
    difficulty: 2, density: 1.27, price_per_kg: 80,
    props: ["durable", "water-resistant", "uv-resistant", "food-safe"],
    uses_pl: "Części mechaniczne, pojemniki, elementy zewnętrzne, opakowania",
    uses_en: "Mechanical parts, containers, outdoor parts, packaging",
    uses_de: "Mechanische Teile, Behälter, Außenteile, Verpackungen",
    notes_pl: "Świetna alternatywa dla ABS — brak warpage. Bardzo dobra adhezja warstw. Lekki stringing.",
    notes_en: "Great ABS alternative — no warping. Excellent layer adhesion. Slight stringing.",
    notes_de: "Gute ABS-Alternative — kein Warping. Ausgezeichnete Schichthaftung. Leichtes Stringing.",
  },
  {
    type_id: "petg-cf", name: "PETG-CF", category: "engineering",
    nozzle_min: 240, nozzle_max: 260, bed_min: 70, bed_max: 90, temp_resistance: 85,
    speed_min: 30, speed_max: 50, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 50, enclosure: "recommended",
    difficulty: 3, density: 1.30, price_per_kg: 160,
    props: ["stiff", "lightweight", "water-resistant", "carbon-fiber"],
    uses_pl: "Lekkie obudowy, wsporniki, drony, komponenty UAV",
    uses_en: "Lightweight housings, brackets, drones, UAV components",
    uses_de: "Leichte Gehäuse, Halterungen, Drohnen, UAV-Komponenten",
    notes_pl: "Wymaga hardened nozzle (stal hartowana). Bardzo sztywny i lekki. Dobra odporność na wilgoć.",
    notes_en: "Requires hardened nozzle. Very stiff and light. Good moisture resistance.",
    notes_de: "Gehärtete Düse erforderlich. Sehr steif und leicht. Gute Feuchtigkeitsbeständigkeit.",
  },
  {
    type_id: "petg-gf", name: "PETG-GF", category: "engineering",
    nozzle_min: 240, nozzle_max: 260, bed_min: 70, bed_max: 90, temp_resistance: 85,
    speed_min: 25, speed_max: 50, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 40, enclosure: "recommended",
    difficulty: 3, density: 1.40, price_per_kg: 150,
    props: ["stiff", "glass-fiber", "water-resistant", "dimensional-stable"],
    uses_pl: "Części wymagające stabilności wymiarowej, wsporniki konstrukcyjne",
    uses_en: "Parts requiring dimensional stability, structural brackets",
    uses_de: "Teile die Maßhaltigkeit erfordern, Strukturhalterungen",
    notes_pl: "Włókno szklane zamiast węglowego. Wymaga hardened nozzle. Tańszy niż PETG-CF.",
    notes_en: "Glass fiber instead of carbon. Requires hardened nozzle. Cheaper than PETG-CF.",
    notes_de: "Glasfaser statt Kohlenstoff. Gehärtete Düse erforderlich. Günstiger als PETG-CF.",
  },

  // ── ENGINEERING — ASA/ABS ────────────────────────────────
  {
    type_id: "asa", name: "ASA", category: "engineering",
    nozzle_min: 240, nozzle_max: 260, bed_min: 90, bed_max: 110, temp_resistance: 100,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 20, enclosure: "required",
    difficulty: 4, density: 1.07, price_per_kg: 100,
    props: ["uv-resistant", "weather-resistant", "rigid", "outdoor"],
    uses_pl: "Elementy zewnętrzne, części samochodowe, osłony, znaki",
    uses_en: "Outdoor parts, car components, covers, signs",
    uses_de: "Außenteile, Fahrzeugteile, Abdeckungen, Schilder",
    notes_pl: "Konieczna zamknięta obudowa. Odporny na UV i warunki atmosferyczne. Opary — wentylacja wymagana.",
    notes_en: "Enclosed chamber required. UV and weather resistant. Fumes — ventilation mandatory.",
    notes_de: "Geschlossenes Gehäuse erforderlich. UV- und wetterbeständig. Belüftung obligatorisch.",
  },
  {
    type_id: "asa-cf", name: "ASA-CF", category: "engineering",
    nozzle_min: 245, nozzle_max: 265, bed_min: 90, bed_max: 110, temp_resistance: 105,
    speed_min: 25, speed_max: 50, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 10, enclosure: "required",
    difficulty: 4, density: 1.15, price_per_kg: 200,
    props: ["uv-resistant", "weather-resistant", "stiff", "carbon-fiber", "outdoor"],
    uses_pl: "Zewnętrzne wsporniki strukturalne, obudowy elektroniki outdoor",
    uses_en: "Outdoor structural brackets, outdoor electronics enclosures",
    uses_de: "Außenstrukturhalterungen, Außenelektronikgehäuse",
    notes_pl: "ASA z włóknem węglowym. Hardened nozzle obowiązkowa. Zwiększona sztywność względem ASA.",
    notes_en: "ASA with carbon fiber. Hardened nozzle mandatory. Increased stiffness over ASA.",
    notes_de: "ASA mit Kohlenstofffasern. Gehärtete Düse obligatorisch. Höhere Steifigkeit als ASA.",
  },
  {
    type_id: "abs", name: "ABS", category: "engineering",
    nozzle_min: 230, nozzle_max: 250, bed_min: 100, bed_max: 120, temp_resistance: 100,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 0, enclosure: "required",
    difficulty: 4, density: 1.04, price_per_kg: 80,
    props: ["rigid", "impact-resistant", "acetone-smoothable", "paintable"],
    uses_pl: "Części techniczne, obudowy elektroniki, elementy do wygładzania acetonem",
    uses_en: "Technical parts, electronics housings, acetone-smoothable parts",
    uses_de: "Technische Teile, Elektronikgehäuse, Acetonglättung",
    notes_pl: "Silny warpage bez obudowy. Opary szkodliwe — wentylacja wymagana. Wygładzanie acetonem po druku.",
    notes_en: "Heavy warping without enclosure. Harmful fumes. Acetone smoothing possible after printing.",
    notes_de: "Starkes Warping ohne Gehäuse. Schädliche Dämpfe — Belüftung erforderlich. Acetonglättung möglich.",
  },
  {
    type_id: "abs-cf", name: "ABS-CF", category: "engineering",
    nozzle_min: 235, nozzle_max: 255, bed_min: 100, bed_max: 120, temp_resistance: 105,
    speed_min: 25, speed_max: 50, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 0, enclosure: "required",
    difficulty: 5, density: 1.15, price_per_kg: 180,
    props: ["stiff", "carbon-fiber", "impact-resistant"],
    uses_pl: "Sztywne obudowy techniczne, wsporniki wymagające odporności na temp.",
    uses_en: "Rigid technical enclosures, brackets requiring heat resistance",
    uses_de: "Starre technische Gehäuse, Halterungen die Wärmebeständigkeit erfordern",
    notes_pl: "ABS z włóknem węglowym. Hardened nozzle obowiązkowa. Trudniejszy niż ABS. Nie do acetonu.",
    notes_en: "ABS with carbon fiber. Hardened nozzle mandatory. Harder than ABS. Not for acetone.",
    notes_de: "ABS mit Kohlenstofffasern. Gehärtete Düse obligatorisch. Schwerer als ABS. Kein Aceton.",
  },

  // ── ENGINEERING — CPE ────────────────────────────────────
  {
    type_id: "cpe", name: "CPE", category: "engineering",
    nozzle_min: 230, nozzle_max: 255, bed_min: 75, bed_max: 95, temp_resistance: 90,
    speed_min: 30, speed_max: 60, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 50, enclosure: "recommended",
    difficulty: 3, density: 1.27, price_per_kg: 120,
    props: ["chemical-resistant", "transparent-possible", "durable", "food-safe"],
    uses_pl: "Pojemniki chemoodporne, elementy kontaktu z żywnością, przezroczyste obudowy",
    uses_en: "Chemically resistant containers, food-contact parts, transparent enclosures",
    uses_de: "Chemikalienbeständige Behälter, Lebensmittelkontaktteile, transparente Gehäuse",
    notes_pl: "Co-Polyester. Lepsza odporność chemiczna niż PETG. Może być przezroczysty. Popularne: Ultimaker CPE.",
    notes_en: "Co-Polyester. Better chemical resistance than PETG. Can be transparent. Popular: Ultimaker CPE.",
    notes_de: "Co-Polyester. Bessere Chemikalienbeständigkeit als PETG. Kann transparent sein.",
  },

  // ── ENGINEERING — POLYCARBONATE ──────────────────────────
  {
    type_id: "pc", name: "PC", category: "engineering",
    nozzle_min: 270, nozzle_max: 300, bed_min: 100, bed_max: 120, temp_resistance: 130,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 0, enclosure: "required",
    difficulty: 5, density: 1.20, price_per_kg: 180,
    props: ["impact-resistant", "optical", "high-temp", "transparent-possible"],
    uses_pl: "Soczewki, osłony maszyn, elementy optyczne, części wymagające udaru",
    uses_en: "Lenses, machine guards, optical parts, high-impact parts",
    uses_de: "Linsen, Maschinenschutzabdeckungen, optische Teile, schlagfeste Teile",
    notes_pl: "Bardzo podatny na warpage. Łoże minimum 110°C. Wymaga high-end drukarki z hotendem 300°C+.",
    notes_en: "Very prone to warping. Bed minimum 110°C. High-end printer with 300°C+ hotend required.",
    notes_de: "Sehr warpanfällig. Bett mindestens 110°C. High-End-Drucker mit 300°C+ Hotend erforderlich.",
  },
  {
    type_id: "pc-abs", name: "PC-ABS", category: "engineering",
    nozzle_min: 250, nozzle_max: 270, bed_min: 100, bed_max: 110, temp_resistance: 115,
    speed_min: 25, speed_max: 50, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 3.0, retraction_max: 5.0, cooling: 10, enclosure: "required",
    difficulty: 4, density: 1.12, price_per_kg: 150,
    props: ["impact-resistant", "high-temp", "rigid"],
    uses_pl: "Obudowy elektroniki przemysłowej, części samochodowe, narzędzia",
    uses_en: "Industrial electronics housings, automotive parts, tools",
    uses_de: "Industrieelektronikgehäuse, Automobilteile, Werkzeuge",
    notes_pl: "Lepsze właściwości niż ABS, mniejszy warpage niż PC. Dobry kompromis temp/wytrzymałość.",
    notes_en: "Better than ABS, less warping than PC. Good temp/toughness compromise.",
    notes_de: "Besser als ABS, weniger Warping als PC. Guter Temp/Zähigkeit-Kompromiss.",
  },
  {
    type_id: "pc-cf", name: "PC-CF", category: "engineering",
    nozzle_min: 280, nozzle_max: 310, bed_min: 100, bed_max: 120, temp_resistance: 135,
    speed_min: 15, speed_max: 35, layer_min: 0.10, layer_max: 0.20,
    retraction_min: 1.0, retraction_max: 3.0, cooling: 0, enclosure: "required",
    difficulty: 5, density: 1.28, price_per_kg: 350,
    props: ["stiff", "carbon-fiber", "high-temp", "aerospace"],
    uses_pl: "Komponenty lotnicze, narzędzia precyzyjne, wsporniki wysokotemperaturowe",
    uses_en: "Aerospace components, precision tools, high-temp brackets",
    uses_de: "Luft- und Raumfahrtkomponenten, Präzisionswerkzeuge, Hochtemp-Halterungen",
    notes_pl: "Poliwęglan z włóknem węglowym. Hardened nozzle obowiązkowa. Ekstremalnie trudny w druku.",
    notes_en: "Polycarbonate with carbon fiber. Hardened nozzle mandatory. Extremely difficult to print.",
    notes_de: "Polycarbonat mit Kohlenstofffasern. Gehärtete Düse obligatorisch. Extrem schwer zu drucken.",
  },

  // ── ENGINEERING — PET ────────────────────────────────────
  {
    type_id: "pet-cf", name: "PET-CF", category: "engineering",
    nozzle_min: 250, nozzle_max: 270, bed_min: 70, bed_max: 85, temp_resistance: 110,
    speed_min: 25, speed_max: 45, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 4.0, cooling: 30, enclosure: "recommended",
    difficulty: 4, density: 1.35, price_per_kg: 240,
    props: ["stiff", "chemical-resistant", "carbon-fiber", "dimensional-stable"],
    uses_pl: "Części narażone na chemikalia, elementy przemysłowe, laboratoryjne",
    uses_en: "Chemically exposed parts, industrial and laboratory components",
    uses_de: "Chemisch belastete Teile, industrielle und Laborkomponenten",
    notes_pl: "Lepsza odporność chemiczna niż PETG-CF. Hardened nozzle wymagana.",
    notes_en: "Better chemical resistance than PETG-CF. Hardened nozzle required.",
    notes_de: "Bessere Chemikalienbeständigkeit als PETG-CF. Gehärtete Düse erforderlich.",
  },

  // ── ENGINEERING — NYLON/PA ───────────────────────────────
  {
    type_id: "pa6", name: "PA6 (Nylon 6)", category: "engineering",
    nozzle_min: 240, nozzle_max: 270, bed_min: 70, bed_max: 90, temp_resistance: 120,
    speed_min: 20, speed_max: 45, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 30, enclosure: "required",
    difficulty: 4, density: 1.14, price_per_kg: 150,
    props: ["flexible-tough", "impact-resistant", "chemical-resistant", "high-temp"],
    uses_pl: "Koła zębate, łożyska ślizgowe, wsporniki, elementy mechaniczne",
    uses_en: "Gears, slide bearings, brackets, mechanical parts",
    uses_de: "Zahnräder, Gleitlager, Halterungen, mechanische Teile",
    notes_pl: "Bardzo higroskopijny — suszyć 70°C/6h. Łoże z klejem PVA lub PEI. Wymagana obudowa.",
    notes_en: "Very hygroscopic — dry at 70°C/6h. Bed needs PVA glue or PEI. Enclosure required.",
    notes_de: "Sehr hygroskopisch — 70°C/6h trocknen. Bett mit PVA-Kleber oder PEI. Gehäuse erforderlich.",
  },
  {
    type_id: "pa6-cf", name: "PA6-CF", category: "engineering",
    nozzle_min: 260, nozzle_max: 280, bed_min: 70, bed_max: 90, temp_resistance: 170,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.20,
    retraction_min: 1.0, retraction_max: 3.0, cooling: 20, enclosure: "required",
    difficulty: 5, density: 1.14, price_per_kg: 280,
    props: ["very-stiff", "lightweight", "high-strength", "carbon-fiber", "low-creep"],
    uses_pl: "Protezy, części lotnicze, drony wyścigowe, CNC, narzędzia",
    uses_en: "Prosthetics, aerospace, racing drones, CNC, tools",
    uses_de: "Prothesen, Luft- und Raumfahrt, Renndrohnen, CNC, Werkzeuge",
    notes_pl: "Hardened nozzle obowiązkowa. Suszyć 70°C/4h przed drukiem. Bardzo niskie pełzanie.",
    notes_en: "Hardened nozzle mandatory. Dry at 70°C/4h before printing. Very low creep.",
    notes_de: "Gehärtete Düse obligatorisch. 70°C/4h vor dem Druck trocknen. Sehr niedriges Kriechen.",
  },
  {
    type_id: "pa12", name: "PA12 (Nylon 12)", category: "engineering",
    nozzle_min: 240, nozzle_max: 265, bed_min: 70, bed_max: 90, temp_resistance: 130,
    speed_min: 20, speed_max: 45, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 2.0, retraction_max: 5.0, cooling: 25, enclosure: "required",
    difficulty: 4, density: 1.02, price_per_kg: 200,
    props: ["flexible-tough", "chemical-resistant", "good-surface"],
    uses_pl: "Rurki, wężyki, złączki, elementy elastyczno-wytrzymałe",
    uses_en: "Tubes, hoses, connectors, flexible-tough parts",
    uses_de: "Rohre, Schläuche, Anschlüsse, flexibel-zähe Teile",
    notes_pl: "Mniejsza absorpcja wilgoci niż PA6. Lepsza powierzchnia. Niższa gęstość niż PA6.",
    notes_en: "Less moisture absorption than PA6. Better surface finish. Lower density than PA6.",
    notes_de: "Geringere Feuchtigkeitsaufnahme als PA6. Bessere Oberfläche. Geringere Dichte als PA6.",
  },
  {
    type_id: "pa12-cf", name: "PA12-CF", category: "engineering",
    nozzle_min: 255, nozzle_max: 275, bed_min: 70, bed_max: 90, temp_resistance: 150,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.20,
    retraction_min: 1.0, retraction_max: 3.0, cooling: 20, enclosure: "required",
    difficulty: 5, density: 1.02, price_per_kg: 320,
    props: ["stiff", "lightweight", "good-surface", "carbon-fiber"],
    uses_pl: "Lekkie obudowy, komponenty UAV, wsporniki strukturalne",
    uses_en: "Lightweight housings, UAV components, structural brackets",
    uses_de: "Leichte Gehäuse, UAV-Komponenten, Strukturhalterungen",
    notes_pl: "Mniejsza absorpcja wilgoci niż PA6-CF. Lepsza powierzchnia. Hardened nozzle.",
    notes_en: "Less moisture absorption than PA6-CF. Better surface. Hardened nozzle.",
    notes_de: "Geringere Feuchtigkeitsaufnahme als PA6-CF. Bessere Oberfläche. Gehärtete Düse.",
  },
  {
    type_id: "pa66-cf", name: "PA66-CF", category: "engineering",
    nozzle_min: 265, nozzle_max: 290, bed_min: 80, bed_max: 100, temp_resistance: 180,
    speed_min: 15, speed_max: 35, layer_min: 0.10, layer_max: 0.20,
    retraction_min: 1.0, retraction_max: 3.0, cooling: 10, enclosure: "required",
    difficulty: 5, density: 1.20, price_per_kg: 380,
    props: ["very-stiff", "high-temp", "carbon-fiber", "low-creep"],
    uses_pl: "Componenty przemysłowe wysokotemperaturowe, motoryzacja",
    uses_en: "High-temp industrial components, automotive",
    uses_de: "Hochtemperatur-Industriekomponenten, Automobilindustrie",
    notes_pl: "Nylon 66 z CF — wyższa temp. pracy niż PA6-CF. Hardened nozzle. Bardzo trudny.",
    notes_en: "Nylon 66 with CF — higher service temp than PA6-CF. Hardened nozzle. Very difficult.",
    notes_de: "Nylon 66 mit CF — höhere Einsatztemperatur als PA6-CF. Gehärtete Düse. Sehr schwierig.",
  },

  // ── ENGINEERING — HIGH TEMP ──────────────────────────────
  {
    type_id: "ppa-cf", name: "PPA-CF", category: "engineering",
    nozzle_min: 280, nozzle_max: 310, bed_min: 100, bed_max: 120, temp_resistance: 200,
    speed_min: 15, speed_max: 30, layer_min: 0.10, layer_max: 0.20,
    retraction_min: 1.0, retraction_max: 3.0, cooling: 10, enclosure: "required",
    difficulty: 5, density: 1.15, price_per_kg: 500,
    props: ["very-high-temp", "chemical-resistant", "carbon-fiber", "aerospace"],
    uses_pl: "Aplikacje lotnicze, mocowania silnikowe, przemysł wysokotemperaturowy",
    uses_en: "Aerospace, engine mounts, high-temp industrial",
    uses_de: "Luft- und Raumfahrt, Motorhalterungen, Hochtemperaturindustrie",
    notes_pl: "Praca do 200°C. Wymaga hotend 350°C. Hardened nozzle obowiązkowa. Zamknięta komora z podgrzewaniem.",
    notes_en: "Up to 200°C service temp. Requires 350°C hotend. Hardened nozzle mandatory. Heated enclosure.",
    notes_de: "Bis 200°C Einsatztemperatur. 350°C Hotend erforderlich. Gehärtete Düse obligatorisch.",
  },
  {
    type_id: "pp", name: "PP (Polypropylene)", category: "engineering",
    nozzle_min: 220, nozzle_max: 250, bed_min: 85, bed_max: 100, temp_resistance: 100,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.30,
    retraction_min: 4.0, retraction_max: 8.0, cooling: 50, enclosure: "recommended",
    difficulty: 5, density: 0.90, price_per_kg: 100,
    props: ["chemical-resistant", "lightweight", "flexible-tough", "food-safe"],
    uses_pl: "Pojemniki chemoodporne, elementy kontaktu z żywnością, zawiasy",
    uses_en: "Chemical-resistant containers, food-contact parts, living hinges",
    uses_de: "Chemikalienbeständige Behälter, Lebensmittelkontaktteile, Filmscharniere",
    notes_pl: "Bardzo trudna adhezja — wymaga specjalnego łoża (PP sheet, klej PP). Silny warpage.",
    notes_en: "Very difficult adhesion — requires special bed (PP sheet, PP glue). Heavy warping.",
    notes_de: "Sehr schwierige Haftung — spezielles Bett erforderlich (PP-Folie, PP-Kleber). Starkes Warping.",
  },
  {
    type_id: "pp-cf", name: "PP-CF", category: "engineering",
    nozzle_min: 230, nozzle_max: 255, bed_min: 85, bed_max: 100, temp_resistance: 105,
    speed_min: 15, speed_max: 35, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 3.0, retraction_max: 7.0, cooling: 40, enclosure: "required",
    difficulty: 5, density: 1.00, price_per_kg: 200,
    props: ["chemical-resistant", "lightweight", "stiff", "carbon-fiber"],
    uses_pl: "Lekkie chemoodporne komponenty, elementy przemysłowe",
    uses_en: "Lightweight chemical-resistant components, industrial parts",
    uses_de: "Leichte chemikalienbeständige Komponenten, Industrieteile",
    notes_pl: "PP z CF. Hardened nozzle. Wszystkie trudności PP + hardened nozzle. Bardzo trudny.",
    notes_en: "PP with CF. Hardened nozzle. All PP difficulties + hardened nozzle. Very difficult.",
    notes_de: "PP mit CF. Gehärtete Düse. Alle PP-Schwierigkeiten + gehärtete Düse. Sehr schwierig.",
  },
  {
    type_id: "pps", name: "PPS/PPS-CF", category: "engineering",
    nozzle_min: 300, nozzle_max: 340, bed_min: 120, bed_max: 150, temp_resistance: 220,
    speed_min: 10, speed_max: 25, layer_min: 0.08, layer_max: 0.20,
    retraction_min: 1.0, retraction_max: 2.0, cooling: 0, enclosure: "required",
    difficulty: 5, density: 1.35, price_per_kg: 600,
    props: ["ultra-high-temp", "flame-retardant", "chemical-resistant", "low-creep"],
    uses_pl: "Przemysł chemiczny, elektronika wysokotemperaturowa, lotnictwo",
    uses_en: "Chemical industry, high-temp electronics, aviation",
    uses_de: "Chemieindustrie, Hochtemperaturelektronik, Luftfahrt",
    notes_pl: "Jeden z najtrudniejszych materiałów. Do 220°C. Niepalny (UL94-V0). Wymaga specjalistycznej drukarki 400°C+.",
    notes_en: "One of the hardest to print. Up to 220°C. Flame retardant (UL94-V0). Specialist 400°C+ printer required.",
    notes_de: "Eines der schwierigsten Materialien. Bis 220°C. Flammhemmend (UL94-V0). 400°C+ Spezialdrucker erforderlich.",
  },
  {
    type_id: "peek", name: "PEEK", category: "engineering",
    nozzle_min: 360, nozzle_max: 400, bed_min: 120, bed_max: 160, temp_resistance: 250,
    speed_min: 5, speed_max: 15, layer_min: 0.05, layer_max: 0.15,
    retraction_min: 1.0, retraction_max: 2.0, cooling: 0, enclosure: "required",
    difficulty: 5, density: 1.32, price_per_kg: 1200,
    props: ["ultra-high-temp", "biocompatible", "chemical-resistant", "aerospace", "medical"],
    uses_pl: "Implanty medyczne, komponenty lotnicze, przemysł chemiczny",
    uses_en: "Medical implants, aerospace components, chemical industry",
    uses_de: "Medizinische Implantate, Luft- und Raumfahrtkomponenten, Chemieindustrie",
    notes_pl: "Jeden z najdroższych i najtrudniejszych materiałów. Wymaga specjalistycznej drukarki PEEK-grade.",
    notes_en: "One of the most expensive and difficult materials. PEEK-grade printer required.",
    notes_de: "Eines der teuersten und schwierigsten Materialien. PEEK-Drucker erforderlich.",
  },
  {
    type_id: "pei-ultem", name: "PEI (Ultem)", category: "engineering",
    nozzle_min: 360, nozzle_max: 400, bed_min: 140, bed_max: 160, temp_resistance: 217,
    speed_min: 10, speed_max: 20, layer_min: 0.05, layer_max: 0.15,
    retraction_min: 1.0, retraction_max: 2.0, cooling: 0, enclosure: "required",
    difficulty: 5, density: 1.27, price_per_kg: 1000,
    props: ["ultra-high-temp", "flame-retardant", "aerospace", "medical"],
    uses_pl: "Lotnictwo, medycyna, elektronika, pojazdy kosmiczne",
    uses_en: "Aerospace, medical, electronics, spacecraft",
    uses_de: "Luft- und Raumfahrt, Medizin, Elektronik, Raumfahrzeuge",
    notes_pl: "Polyetherimide. Ekstremalnie trudny w druku. Do 217°C. Certyfikaty lotnicze. FAR25.853.",
    notes_en: "Polyetherimide. Extremely difficult to print. Up to 217°C. Aviation certifications. FAR25.853.",
    notes_de: "Polyetherimid. Extrem schwer zu drucken. Bis 217°C. Luftfahrtzertifizierungen.",
  },

  // ── SPECIALTY ────────────────────────────────────────────
  {
    type_id: "pva", name: "PVA (support)", category: "specialty",
    nozzle_min: 185, nozzle_max: 200, bed_min: 35, bed_max: 60, temp_resistance: 50,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.20,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 100, enclosure: "no",
    difficulty: 3, density: 1.19, price_per_kg: 200,
    props: ["water-soluble", "support-material", "biodegradable"],
    uses_pl: "Materiał podporowy do rozpuszczania w wodzie (dual extrusion)",
    uses_en: "Water-soluble support material (dual extrusion)",
    uses_de: "Wasserlösliches Stützmaterial (Doppelextrusion)",
    notes_pl: "Wyłącznie jako support. Bardzo higroskopijny — przechowywać szczelnie. Kompatybilny z PLA.",
    notes_en: "Support material only. Very hygroscopic — store airtight. Compatible with PLA.",
    notes_de: "Nur Stützmaterial. Sehr hygroskopisch — luftdicht lagern. Kompatibel mit PLA.",
  },
  {
    type_id: "hips", name: "HIPS (support)", category: "specialty",
    nozzle_min: 230, nozzle_max: 245, bed_min: 100, bed_max: 115, temp_resistance: 85,
    speed_min: 30, speed_max: 50, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 3.0, retraction_max: 6.0, cooling: 0, enclosure: "required",
    difficulty: 3, density: 1.04, price_per_kg: 90,
    props: ["d-limonene-soluble", "support-material"],
    uses_pl: "Materiał podporowy do ABS (rozpuszczalny w limonenie D)",
    uses_en: "Support material for ABS (dissolves in D-limonene)",
    uses_de: "Stützmaterial für ABS (löst sich in D-Limonen)",
    notes_pl: "Kompatybilny z ABS (podobna temperatura). Rozpuszcza się w D-limonenie, nie wodzie. Opary — wentylacja.",
    notes_en: "Compatible with ABS (similar temp). Dissolves in D-limonene, not water. Fumes — ventilation.",
    notes_de: "Kompatibel mit ABS (ähnliche Temp.). Löst sich in D-Limonen, nicht Wasser. Belüftung erforderlich.",
  },
  {
    type_id: "pa-gf", name: "PA-GF (Nylon+Glass)", category: "engineering",
    nozzle_min: 250, nozzle_max: 280, bed_min: 70, bed_max: 90, temp_resistance: 160,
    speed_min: 20, speed_max: 40, layer_min: 0.10, layer_max: 0.25,
    retraction_min: 1.5, retraction_max: 3.5, cooling: 15, enclosure: "required",
    difficulty: 5, density: 1.35, price_per_kg: 260,
    props: ["stiff", "glass-fiber", "high-temp", "dimensional-stable"],
    uses_pl: "Przemysłowe elementy wymagające odporności na temp. i wymiarowej stabilności",
    uses_en: "Industrial parts requiring heat resistance and dimensional stability",
    uses_de: "Industrieteile die Wärmebeständigkeit und Maßhaltigkeit erfordern",
    notes_pl: "Nylon z włóknem szklanym. Hardened nozzle. Wysoka stabilność wymiarowa. Suszyć przed drukiem.",
    notes_en: "Nylon with glass fiber. Hardened nozzle. High dimensional stability. Dry before printing.",
    notes_de: "Nylon mit Glasfaser. Gehärtete Düse. Hohe Maßhaltigkeit. Vor dem Druck trocknen.",
  },
];

// ============================================================
// INITIAL BRAND DATA
// ============================================================
const BRANDS = [
  // PLA brands
  { type_id: "pla", brand: "Prusament", product_name: "PLA Galaxy Silver", nozzle_min: 210, nozzle_max: 230, bed_min: 55, bed_max: 65, is_verified: true, product_url: "https://www.prusa3d.com/prusament-pla/", notes_en: "Tight tolerances (±0.02mm). Very consistent quality. Recommended settings: 215°C nozzle, 60°C bed." },
  { type_id: "pla", brand: "eSUN", product_name: "ePLA-Matte", nozzle_min: 200, nozzle_max: 230, bed_min: 45, bed_max: 65, is_verified: true, product_url: "https://www.esun3d.com/", notes_en: "Matte PLA variant. Excellent value. Wide range of colors available." },
  { type_id: "pla", brand: "Bambu Lab", product_name: "PLA Basic", nozzle_min: 190, nozzle_max: 220, bed_min: 35, bed_max: 45, is_verified: true, notes_en: "Optimized for Bambu Lab printers. Works well on other printers too." },
  { type_id: "pla", brand: "Polymaker", product_name: "PolyLite PLA", nozzle_min: 195, nozzle_max: 230, bed_min: 25, bed_max: 60, is_verified: true, notes_en: "Entry-level reliable PLA. Good for beginners." },
  { type_id: "pla", brand: "Fiberlogy", product_name: "FiberFlex 40D", nozzle_min: 205, nozzle_max: 225, bed_min: 50, bed_max: 60, is_verified: true, notes_en: "Polish brand. Very good quality-to-price ratio." },

  // PETG brands
  { type_id: "petg", brand: "Prusament", product_name: "PETG Jet Black", nozzle_min: 240, nozzle_max: 250, bed_min: 80, bed_max: 90, is_verified: true, notes_en: "Prusament PETG — excellent clarity on transparent variants. 240-250°C nozzle recommended." },
  { type_id: "petg", brand: "eSUN", product_name: "ePETG", nozzle_min: 230, nozzle_max: 250, bed_min: 70, bed_max: 90, is_verified: true, notes_en: "Good all-round PETG. Budget-friendly." },
  { type_id: "petg", brand: "Bambu Lab", product_name: "PETG HF", nozzle_min: 240, nozzle_max: 260, bed_min: 70, bed_max: 90, is_verified: true, notes_en: "High-flow PETG. Optimized for speed on Bambu printers." },
  { type_id: "petg", brand: "Polymaker", product_name: "PolyLite PETG", nozzle_min: 230, nozzle_max: 250, bed_min: 70, bed_max: 85, is_verified: true, notes_en: "Reliable PETG. Low stringing." },

  // TPU brands
  { type_id: "tpu-95a", brand: "eSUN", product_name: "eTPU-95A", nozzle_min: 225, nozzle_max: 245, bed_min: 40, bed_max: 60, is_verified: true, notes_en: "Good all-round TPU. Can work with Bowden if speed is very low." },
  { type_id: "tpu-95a", brand: "Polymaker", product_name: "PolyFlex TPU95", nozzle_min: 220, nozzle_max: 235, bed_min: 25, bed_max: 45, is_verified: true, notes_en: "Lower temp TPU. Very consistent. Works on Bowden at very low speeds." },
  { type_id: "tpu-95a", brand: "Fiberlogy", product_name: "FiberFlex 30D", nozzle_min: 220, nozzle_max: 240, bed_min: 30, bed_max: 50, is_verified: true, notes_en: "Polish brand TPU. Good value." },

  // ASA brands
  { type_id: "asa", brand: "Prusament", product_name: "ASA Azure Blue", nozzle_min: 255, nozzle_max: 265, bed_min: 100, bed_max: 110, is_verified: true, notes_en: "High quality ASA. Needs heated enclosure. 260°C nozzle typical." },
  { type_id: "asa", brand: "Polymaker", product_name: "PolyLite ASA", nozzle_min: 240, nozzle_max: 260, bed_min: 90, bed_max: 110, is_verified: true, notes_en: "Good UV resistance. Requires enclosure." },

  // PA6-CF brands
  { type_id: "pa6-cf", brand: "Bambu Lab", product_name: "PA6-CF", nozzle_min: 260, nozzle_max: 280, bed_min: 45, bed_max: 65, is_verified: true, notes_en: "Pre-dried. Works well with Bambu AMS Lite dry box. High-performance." },
  { type_id: "pa6-cf", brand: "Polymaker", product_name: "PolyMide PA6-CF", nozzle_min: 260, nozzle_max: 275, bed_min: 70, bed_max: 90, is_verified: true, notes_en: "Very stiff and lightweight. Excellent layer adhesion for a CF material." },
  { type_id: "pa6-cf", brand: "BASF Ultrafuse", product_name: "PA6 GF30 Black", nozzle_min: 265, nozzle_max: 280, bed_min: 80, bed_max: 95, is_verified: true, notes_en: "Glass fiber reinforced PA6 from BASF. Industrial grade quality." },

  // PLA-CF brands
  { type_id: "pla-cf", brand: "Bambu Lab", product_name: "PLA-CF", nozzle_min: 220, nozzle_max: 240, bed_min: 35, bed_max: 45, is_verified: true, notes_en: "Very popular CF option. Matte black only. Requires hardened nozzle — included with X1C." },
  { type_id: "pla-cf", brand: "eSUN", product_name: "ePLA-CF", nozzle_min: 210, nozzle_max: 230, bed_min: 50, bed_max: 60, is_verified: true, notes_en: "Budget CF-PLA option. Good stiffness improvement over base PLA." },

  // PETG-CF brands
  { type_id: "petg-cf", brand: "Bambu Lab", product_name: "PETG-CF", nozzle_min: 250, nozzle_max: 265, bed_min: 70, bed_max: 80, is_verified: true, notes_en: "Excellent balance of stiffness and moisture resistance. Requires hardened nozzle." },
  { type_id: "petg-cf", brand: "Polymaker", product_name: "PolyMax PETG-CF", nozzle_min: 240, nozzle_max: 260, bed_min: 70, bed_max: 85, is_verified: true, notes_en: "Strong and stiff. Good surface finish for a CF material." },

  // PC brands
  { type_id: "pc", brand: "Polymaker", product_name: "PolyMax PC", nozzle_min: 260, nozzle_max: 280, bed_min: 100, bed_max: 110, is_verified: true, notes_en: "More printable than raw PC. Still needs enclosure and high temps." },
  { type_id: "pc", brand: "BASF Ultrafuse", product_name: "PC", nozzle_min: 265, nozzle_max: 285, bed_min: 100, bed_max: 120, is_verified: true, notes_en: "Industrial grade PC. Excellent for transparent optical parts." },

  // PVA brands
  { type_id: "pva", brand: "eSUN", product_name: "ePVA+", nozzle_min: 190, nozzle_max: 210, bed_min: 40, bed_max: 60, is_verified: true, notes_en: "Improved PVA+ dissolves faster than standard PVA. Store in dry box." },
  { type_id: "pva", brand: "Polymaker", product_name: "PolyDissolve S1", nozzle_min: 185, nozzle_max: 200, bed_min: 35, bed_max: 55, is_verified: true, notes_en: "PVOH-based support material. Compatible with PLA and PETG." },
];

// ============================================================
// SEED FUNCTION
// ============================================================
async function seed() {
  console.log("🌱 AEJaCA Filament Types Seed");
  console.log("=".repeat(50));

  let typeSuccess = 0, typeFailed = 0;
  let brandSuccess = 0, brandFailed = 0;

  // Insert types
  for (const t of TYPES) {
    try {
      await pool.query(
        `INSERT INTO filament_types (
          type_id, name, category,
          nozzle_min, nozzle_max, bed_min, bed_max, temp_resistance,
          speed_min, speed_max, layer_min, layer_max,
          retraction_min, retraction_max, cooling, enclosure,
          difficulty, density, price_per_kg, props,
          uses_pl, uses_en, uses_de,
          notes_pl, notes_en, notes_de,
          sort_order
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
        )
        ON CONFLICT (type_id) DO UPDATE SET
          name=$2, category=$3,
          nozzle_min=$4, nozzle_max=$5, bed_min=$6, bed_max=$7, temp_resistance=$8,
          speed_min=$9, speed_max=$10, layer_min=$11, layer_max=$12,
          retraction_min=$13, retraction_max=$14, cooling=$15, enclosure=$16,
          difficulty=$17, density=$18, price_per_kg=$19, props=$20,
          uses_pl=$21, uses_en=$22, uses_de=$23,
          notes_pl=$24, notes_en=$25, notes_de=$26,
          updated_at=NOW()`,
        [
          t.type_id, t.name, t.category,
          t.nozzle_min, t.nozzle_max, t.bed_min, t.bed_max, t.temp_resistance,
          t.speed_min, t.speed_max, t.layer_min, t.layer_max,
          t.retraction_min, t.retraction_max, t.cooling, t.enclosure,
          t.difficulty, t.density, t.price_per_kg, t.props,
          t.uses_pl, t.uses_en, t.uses_de,
          t.notes_pl, t.notes_en, t.notes_de,
          TYPES.indexOf(t),
        ]
      );
      typeSuccess++;
      console.log(`  ✓ ${t.name} (${t.category})`);
    } catch (err) {
      typeFailed++;
      console.error(`  ✗ ${t.name}: ${err.message}`);
    }
  }

  console.log(`\nTypes: ${typeSuccess} seeded, ${typeFailed} errors`);
  console.log("\nSeeding brands...");

  // Insert brands (needs type IDs)
  for (const b of BRANDS) {
    try {
      const { rows } = await pool.query(
        "SELECT id FROM filament_types WHERE type_id=$1", [b.type_id]
      );
      if (!rows[0]) { console.error(`  ✗ Brand '${b.brand}': type '${b.type_id}' not found`); brandFailed++; continue; }

      await pool.query(
        `INSERT INTO filament_brands (
          filament_type_id, brand, product_name,
          nozzle_min, nozzle_max, bed_min, bed_max,
          notes_en, product_url, is_verified
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT DO NOTHING`,
        [
          rows[0].id, b.brand, b.product_name || null,
          b.nozzle_min || null, b.nozzle_max || null,
          b.bed_min || null, b.bed_max || null,
          b.notes_en || null, b.product_url || null,
          b.is_verified ?? false,
        ]
      );
      brandSuccess++;
      console.log(`  ✓ ${b.brand} — ${b.product_name || b.type_id}`);
    } catch (err) {
      brandFailed++;
      console.error(`  ✗ ${b.brand}: ${err.message}`);
    }
  }

  console.log(`\nBrands: ${brandSuccess} seeded, ${brandFailed} errors`);
  console.log("\n✅ Seed complete");
}

seed()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => pool.end());
