// ============================================================
// CZEGO SZYBKA WYCENA NIE POKAZUJE, A TRYB ZAAWANSOWANY UMIE
// ============================================================
// Szybka wycena podejmuje za klienta kilkanascie decyzji, zeby zejsc do
// pieciu pytan. To jest jej sens, ale ma cene: karta mowi "Filament: PLA"
// i wyglada jak stwierdzenie, ze PLA to jedyna mozliwosc. Klient, ktory
// chce PETG albo TPU, wnioskuje, ze nie robimy PETG, i wychodzi.
//
// Tego nie naprawia sie doklejaniem opcji do prostego trybu, bo wtedy
// przestaje byc prosty. Naprawia sie to ZDANIEM W MIEJSCU, W KTORYM WYBOR
// ZOSTAL PODJETY: tu wybralismy za Ciebie, a wybor masz obok.
//
// LICZBY I NAZWY BIERZEMY Z CENNIKA, NIE Z PAMIECI. Przepisana lista
// "PETG, TPU, ABS" rozjechalaby sie przy pierwszym nowym filamencie i nikt
// by tego nie zauwazyl: tekst marketingowy nie ma testu, ktory by go zlapal.
// Dlatego nazwy parametrow czytamy z tych samych slownikow LBL, ktore
// rysuja tryb zaawansowany, a materialy z tych samych tablic, z ktorych
// liczy silnik.

import { FILAMENTS, LBL as PRINT_LBL, MSLA_LBL } from "../pricing/print3d.js";
import { LBL as CO2_LBL } from "../pricing/laserCo2.js";
import { LBL as FIBER_LBL } from "../pricing/laserFiber.js";
import { RESIN_TYPES } from "./resins.js";

/**
 * Ktora zakladka trybu zaawansowanego odpowiada technologii z szybkiej
 * wyceny. Bez tego przelacznik wyrzucalby klienta na druk 3D niezaleznie
 * od tego, ze liczyl grawer, i musialby szukac swojej uslugi od nowa.
 */
export const ADVANCED_TAB = {
  "3dprint": "3dprint",
  msla: "resin_msla",
  co2: "co2_laser",
  fiber: "fiber_laser",
  epoxy: "epoxy",
};

/**
 * Parametry, ktore tryb zaawansowany oddaje klientowi, a szybka wycena
 * ustawia sama. Klucze wskazuja na slowniki trybu zaawansowanego, wiec
 * nazwa w podpowiedzi jest doslownie ta sama, ktora klient tam zobaczy.
 */
const GRUPY = {
  "3dprint": { lbl: PRINT_LBL, klucze: ["filament", "infill", "colors", "precision"] },
  msla: { lbl: MSLA_LBL, klucze: ["resin", "color", "layer", "application"] },
  co2: { lbl: CO2_LBL, klucze: ["matThick", "detail", "complexity", "workArea"] },
  fiber: { lbl: FIBER_LBL, klucze: ["material", "lens", "markType", "area"] },
};

/** Technologie, dla ktorych umiemy powiedziec, co dokłada tryb zaawansowany. */
export const ADVANCED_TECHS = Object.keys(GRUPY);

/** Zadeklarowane klucze, do sprawdzenia w guardzie, czy kazdy ma nazwe. */
export const ADVANCED_KEYS = Object.fromEntries(
  Object.entries(GRUPY).map(([tech, g]) => [tech, g.klucze])
);

/**
 * Nazwy parametrow trybu zaawansowanego dla danej technologii.
 *
 * @param {string} tech
 * @param {string} lang
 * @returns {string[]}
 */
export function advancedParams(tech, lang = "pl") {
  const g = GRUPY[tech];
  if (!g) return [];
  const slownik = g.lbl[lang] || g.lbl.pl;
  return g.klucze.map((k) => slownik?.[k]).filter(Boolean);
}

/**
 * Materialy do wyboru w trybie zaawansowanym, ktorych szybka wycena nie
 * pokazuje. Laser ich nie zwraca, bo tam material wybiera sie juz w prostym
 * trybie i powtarzanie tego byloby nieprawda.
 *
 * @param {string} tech
 * @param {string} lang
 * @returns {string[]}
 */
export function advancedMaterials(tech, lang = "pl") {
  if (tech === "3dprint") {
    return Object.values(FILAMENTS).flatMap((seg) => Object.keys(seg.materials));
  }
  if (tech === "msla") {
    return RESIN_TYPES.filter((r) => !r.custom).map((r) => r.label?.[lang] || r.label?.pl).filter(Boolean);
  }
  return [];
}

/**
 * Trzy nazwy do pokazania w zdaniu.
 *
 * Sciete "pierwsze z brzegu" daloby przy filamencie same odmiany PLA, czyli
 * to samo, co klient wlasnie odrzuca, a sciete z konca listy same tworzywa
 * inzynieryjne za czterysta zlotych kilogram. Wybieramy wiec pozycje, ktore
 * naprawde rozszerzaja wyobrazenie o ofercie, ale NIE przepisujemy ich:
 * identyfikator musi istniec w cenniku, inaczej guard wywala build.
 */
const POKAZOWE = {
  "3dprint": ["PETG", "TPU 95A", "ABS"],
  msla: ["tough", "flexible", "castable_xone"],
};

export function advancedExamples(tech, lang = "pl") {
  const chciane = POKAZOWE[tech];
  if (!chciane) return [];
  if (tech === "3dprint") {
    const dostepne = new Set(advancedMaterials(tech, lang));
    return chciane.filter((n) => dostepne.has(n));
  }
  return chciane
    .map((id) => RESIN_TYPES.find((r) => r.id === id))
    .filter(Boolean)
    .map((r) => r.label?.[lang] || r.label?.pl);
}

/** Identyfikatory pokazowe, do sprawdzenia w guardzie. */
export const SHOWCASE_IDS = POKAZOWE;
