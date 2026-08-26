// ============================================================
// PODZIAL SKLEPU: PODKATEGORIE I FILTRY
// ============================================================
// Dwa dzialy, bizuteria i studio, to za grube sito. Klient szukajacy obroczki
// nie chce przewijac obok breloka dla psa, a ktos z plikiem do druku nie chce
// ogladac kolczykow. Podkategoria jest wiec tym, po czym da sie zawezic liste
// jednym kliknieciem, i tym, co widac na karcie jako ikona.
//
// Ikony dobrane tak, zeby czytalo sie je bez podpisu:
//   damska   Venus, meska Mars      przyjety znak plci, rozpoznawalny wszedzie
//   dla zwierzat  PawPrint          lapa, jedyny oczywisty znak w tym zestawie
//   FDM      Layers                 druk warstwa po warstwie
//   MSLA     Sun                    utwardzanie swiatlem
//   CO2      Flame                  wiazka wypala material
//   fiber    Zap                    impuls znakujacy metal
//   zywica   Droplets               material lany
//   cyfrowy  Download               nic nie wysylamy, plik idzie mailem
//
// Podkategoria jest kolumna w bazie (`products.subcategory`), wiec lista ID
// ponizej musi zgadzac sie z ograniczeniem w `scripts/products-schema.sql`.

import { Venus, Mars, PawPrint, Layers, Sun, Flame, Zap, Droplets, Download, Gem, FileCode } from "lucide-react";

const L = (pl, en, de) => ({ pl, en, de });

export const SUBCATEGORIES = [
  // ---------------- bizuteria ----------------
  { id: "women", category: "jewelry", Icon: Venus,    label: L("Damska", "Women", "Damen") },
  { id: "men",   category: "jewelry", Icon: Mars,     label: L("Męska", "Men", "Herren") },
  { id: "pet",   category: "jewelry", Icon: PawPrint, label: L("Dla zwierząt", "For pets", "Für Tiere") },
  // ---------------- studio ----------------
  { id: "fdm",     category: "studio", Icon: Layers,   label: L("Druk FDM", "FDM printing", "FDM-Druck") },
  { id: "msla",    category: "studio", Icon: Sun,      label: L("Druk żywiczny MSLA", "MSLA resin printing", "MSLA-Harzdruck") },
  { id: "co2",     category: "studio", Icon: Flame,    label: L("Laser CO2", "CO2 laser", "CO2-Laser") },
  { id: "fiber",   category: "studio", Icon: Zap,      label: L("Laser fiber", "Fiber laser", "Faserlaser") },
  { id: "resin",   category: "studio", Icon: Droplets, label: L("Żywica", "Resin", "Harz") },
  { id: "digital", category: "studio", Icon: Download, label: L("Cyfrowy", "Digital", "Digital") },
];

/** Lista ID do walidacji po stronie serwera i w panelu. */
export const SUBCATEGORY_IDS = SUBCATEGORIES.map((s) => s.id);

export function subcategory(id) {
  return SUBCATEGORIES.find((s) => s.id === id) || null;
}

export function subcategoriesFor(category) {
  return category ? SUBCATEGORIES.filter((s) => s.category === category) : SUBCATEGORIES;
}

/**
 * Uslugi maja wlasny podzial, bo pytanie brzmi tu inaczej: nie "dla kogo",
 * tylko "czym to wykonujemy". Cala rodzina lasera siedzi pod jednym filtrem,
 * bo klient z plikiem do wyciecia nie rozdziela CO2 od fiber, to my dobieramy
 * maszyne do materialu.
 */
export const SERVICE_FACETS = [
  { id: "print",   Icon: Layers,   label: L("Druk 3D", "3D printing", "3D-Druck") },
  { id: "laser",   Icon: Zap,      label: L("Laser", "Laser", "Laser") },
  { id: "resin",   Icon: Droplets, label: L("Żywica", "Resin", "Harz") },
  { id: "jewelry", Icon: Gem,      label: L("Jubilerstwo", "Jewelry", "Schmuck") },
  { id: "design",  Icon: FileCode, label: L("Projektowanie", "Design", "Konstruktion") },
];

const SERVICE_FACET_BY_ID = {
  print_fdm: "print",
  print_msla: "print",
  laser_engrave: "laser",
  laser_cut: "laser",
  laser_fiber: "laser",
  epoxy: "resin",
  cad_project: "design",
  // Odlew ze srebra i zlota to robota jubilerska, nie projektowanie. Bez tego
  // wpisu wpadal do filtra "Projektowanie" przez sam brak przedrostka.
  precious_metal_casting: "jewelry",
};

/** Uslugi jubilerskie maja wspolny przedrostek, wiec nie wypisujemy ich po jednej. */
export function serviceFacet(service) {
  if (SERVICE_FACET_BY_ID[service.id]) return SERVICE_FACET_BY_ID[service.id];
  return service.id.startsWith("jewelry") ? "jewelry" : "design";
}

export function serviceFacetMeta(id) {
  return SERVICE_FACETS.find((f) => f.id === id) || null;
}
