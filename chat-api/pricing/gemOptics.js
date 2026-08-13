// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/data/gemOptics.js
// Regeneracja: npm run sync:pricing

// ============================================================
// KAMIENIE: wlasciwosci optyczne do podgladu
// ============================================================
// Wylacznie do rysowania. Ceny, gestosci i dostepnosc leza gdzie indziej:
// w `jewelryConfig.js` i w wycenie kreatora. Tutaj chodzi o to, zeby szafir
// byl niebieski, onyks czarny i matowy, a diament przezroczysty.
//
// Klucze sa TE SAME co identyfikatory w `GEMSTONES`. Rozjazd wychodzi
// w tescie, ktory porownuje obie listy, bo kamien bez wpisu renderowalby sie
// domyslnym szarym szklem i nikt by nie zauwazyl, ze to blad, a nie decyzja.
//
// `ior` to wspolczynnik zalamania, czyli fizyczna wlasciwosc materialu.
// Diament ma 2,42 i wlasnie stad bierze sie jego ogien: swiatlo zalamuje sie
// tak mocno, ze rozszczepia sie na barwy. Cyrkonia ma 2,15 i dlatego z bliska
// widac roznice, mimo ze obie sa bezbarwne.
//
// `transmission` mowi, ile swiatla przechodzi przez kamien. Jeden to szklo,
// zero to kamien nieprzezroczysty, ktory bierze barwe z rozproszenia.

/** Domyslne wlasciwosci dla kamienia spoza listy. Neutralne, blade szklo. */
export const GEM_DEFAULT = { color: "#dfe6ea", ior: 1.75, transmission: 0.82, roughness: 0.03, density: 3.6 };

export const GEM_OPTICS = {
  none: null,

  // --- Bezbarwne, rozne tylko ogniem ---
  diamond:      { color: "#f3f7fa", ior: 2.42, transmission: 0.92, roughness: 0.01, density: 3.52 },
  lab_diamond:  { color: "#f3f7fa", ior: 2.42, transmission: 0.92, roughness: 0.01, density: 3.52 },
  moissanite:   { color: "#f2f8f2", ior: 2.65, transmission: 0.90, roughness: 0.01, density: 3.21 },
  cz:           { color: "#eef4f8", ior: 2.15, transmission: 0.90, roughness: 0.02, density: 5.68 },

  // --- Barwne przezroczyste ---
  ruby:         { color: "#b3123a", ior: 1.77, transmission: 0.72, roughness: 0.02, density: 4.0 },
  lab_ruby:     { color: "#b3123a", ior: 1.77, transmission: 0.72, roughness: 0.02, density: 4.0 },
  sapphire:     { color: "#12408f", ior: 1.77, transmission: 0.70, roughness: 0.02, density: 4.0 },
  lab_sapphire: { color: "#12408f", ior: 1.77, transmission: 0.70, roughness: 0.02, density: 4.0 },
  emerald:      { color: "#0f7a4a", ior: 1.58, transmission: 0.68, roughness: 0.04, density: 2.72 },
  lab_emerald:  { color: "#0f7a4a", ior: 1.58, transmission: 0.68, roughness: 0.04, density: 2.72 },
  tanzanite:    { color: "#4b3fa8", ior: 1.69, transmission: 0.74, roughness: 0.02, density: 3.35 },
  aquamarine:   { color: "#8fd3d8", ior: 1.58, transmission: 0.86, roughness: 0.02, density: 2.7 },
  tourmaline:   { color: "#b0407a", ior: 1.62, transmission: 0.76, roughness: 0.02, density: 3.1 },
  topaz:        { color: "#c6d8e8", ior: 1.62, transmission: 0.88, roughness: 0.02, density: 3.55 },
  amethyst:     { color: "#7c46b0", ior: 1.54, transmission: 0.78, roughness: 0.02, density: 2.65 },
  citrine:      { color: "#d99a2b", ior: 1.55, transmission: 0.82, roughness: 0.02, density: 2.65 },
  garnet:       { color: "#7d1220", ior: 1.79, transmission: 0.64, roughness: 0.02, density: 3.9 },
  peridot:      { color: "#84a72a", ior: 1.65, transmission: 0.80, roughness: 0.02, density: 3.34 },
  // Bursztynu tu NIE MA, bo nie ma go w katalogu kamieni. Wpis bez pozycji
  // w `GEMSTONES` nie dalby sie wybrac, a test parzystosci obu list slusznie
  // by go zglosil. Gdy bursztyn trafi do katalogu, wraca tu z barwa
  // okolo #c8761a, wspolczynnikiem 1,54 i wyrazna chropowatoscia.

  // --- Nieprzezroczyste, barwa z rozproszenia, nie z przeswitu ---
  opal:      { color: "#dfe7e2", ior: 1.45, transmission: 0.28, roughness: 0.14, density: 2.1 },
  moonstone: { color: "#dde6ee", ior: 1.52, transmission: 0.42, roughness: 0.12, density: 2.58 },
  lapis:     { color: "#20389c", ior: 1.50, transmission: 0.00, roughness: 0.28, density: 2.8 },
  turquoise: { color: "#3fb3b8", ior: 1.62, transmission: 0.00, roughness: 0.32, density: 2.7 },
  onyx:      { color: "#151517", ior: 1.55, transmission: 0.00, roughness: 0.12, density: 2.65 },
  tiger_eye: { color: "#9a6a1f", ior: 1.54, transmission: 0.00, roughness: 0.22, density: 2.64 },

  // Kamien spoza katalogu rysujemy neutralnie, bo nie wiemy, czym jest.
  custom_gem: { ...GEM_DEFAULT },
};

/**
 * Gestosc kamienia w g/cm3.
 *
 * Karat jest jednostka MASY, wiec bez gestosci nie da sie go policzyc
 * z bryly. Ta sama liczba sluzy do podania masy gotowego pierscionka,
 * bo kamien tez wazy: brylant 1 ct to 0,2 g, a przy pave to sie sumuje.
 *
 * Jedno zrodlo dla wyceny i dla masy. Dwie listy rozjechalyby sie przy
 * pierwszym dolozonym kamieniu i nikt by nie zauwazyl, ktora jest prawdziwa.
 */
export function gemDensity(id) {
  return (GEM_OPTICS[id] || GEM_DEFAULT).density ?? GEM_DEFAULT.density;
}

export function gemOptics(id) {
  if (id === "none") return null;
  return GEM_OPTICS[id] || GEM_DEFAULT;
}
