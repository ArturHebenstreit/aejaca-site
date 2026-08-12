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
export const GEM_DEFAULT = { color: "#dfe6ea", ior: 1.75, transmission: 0.82, roughness: 0.03 };

export const GEM_OPTICS = {
  none: null,

  // --- Bezbarwne, rozne tylko ogniem ---
  diamond:      { color: "#f3f7fa", ior: 2.42, transmission: 0.92, roughness: 0.01 },
  lab_diamond:  { color: "#f3f7fa", ior: 2.42, transmission: 0.92, roughness: 0.01 },
  moissanite:   { color: "#f2f8f2", ior: 2.65, transmission: 0.90, roughness: 0.01 },
  cz:           { color: "#eef4f8", ior: 2.15, transmission: 0.90, roughness: 0.02 },

  // --- Barwne przezroczyste ---
  ruby:         { color: "#b3123a", ior: 1.77, transmission: 0.72, roughness: 0.02 },
  lab_ruby:     { color: "#b3123a", ior: 1.77, transmission: 0.72, roughness: 0.02 },
  sapphire:     { color: "#12408f", ior: 1.77, transmission: 0.70, roughness: 0.02 },
  lab_sapphire: { color: "#12408f", ior: 1.77, transmission: 0.70, roughness: 0.02 },
  emerald:      { color: "#0f7a4a", ior: 1.58, transmission: 0.68, roughness: 0.04 },
  lab_emerald:  { color: "#0f7a4a", ior: 1.58, transmission: 0.68, roughness: 0.04 },
  tanzanite:    { color: "#4b3fa8", ior: 1.69, transmission: 0.74, roughness: 0.02 },
  aquamarine:   { color: "#8fd3d8", ior: 1.58, transmission: 0.86, roughness: 0.02 },
  tourmaline:   { color: "#b0407a", ior: 1.62, transmission: 0.76, roughness: 0.02 },
  topaz:        { color: "#c6d8e8", ior: 1.62, transmission: 0.88, roughness: 0.02 },
  amethyst:     { color: "#7c46b0", ior: 1.54, transmission: 0.78, roughness: 0.02 },
  citrine:      { color: "#d99a2b", ior: 1.55, transmission: 0.82, roughness: 0.02 },
  garnet:       { color: "#7d1220", ior: 1.79, transmission: 0.64, roughness: 0.02 },
  peridot:      { color: "#84a72a", ior: 1.65, transmission: 0.80, roughness: 0.02 },
  // Bursztynu tu NIE MA, bo nie ma go w katalogu kamieni. Wpis bez pozycji
  // w `GEMSTONES` nie dalby sie wybrac, a test parzystosci obu list slusznie
  // by go zglosil. Gdy bursztyn trafi do katalogu, wraca tu z barwa
  // okolo #c8761a, wspolczynnikiem 1,54 i wyrazna chropowatoscia.

  // --- Nieprzezroczyste, barwa z rozproszenia, nie z przeswitu ---
  opal:      { color: "#dfe7e2", ior: 1.45, transmission: 0.28, roughness: 0.14 },
  moonstone: { color: "#dde6ee", ior: 1.52, transmission: 0.42, roughness: 0.12 },
  lapis:     { color: "#20389c", ior: 1.50, transmission: 0.00, roughness: 0.28 },
  turquoise: { color: "#3fb3b8", ior: 1.62, transmission: 0.00, roughness: 0.32 },
  onyx:      { color: "#151517", ior: 1.55, transmission: 0.00, roughness: 0.12 },
  tiger_eye: { color: "#9a6a1f", ior: 1.54, transmission: 0.00, roughness: 0.22 },

  // Kamien spoza katalogu rysujemy neutralnie, bo nie wiemy, czym jest.
  custom_gem: { ...GEM_DEFAULT },
};

export function gemOptics(id) {
  if (id === "none") return null;
  return GEM_OPTICS[id] || GEM_DEFAULT;
}
