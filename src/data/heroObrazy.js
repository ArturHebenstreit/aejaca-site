// ============================================================
// OBRAZY BOHATERSKIE: JEDNA LISTA SZEROKOSCI
// ============================================================
// Ta sama lista sluzy trzem rzeczom, dlatego stoi w jednym miejscu:
//   1. `scripts/build-hero-images.mjs` wycina wedlug niej warianty,
//   2. `src/components/HeroObraz.jsx` sklada z niej `srcset`,
//   3. `scripts/check-hero-images.mjs` sprawdza, czy pliki naprawde leza.
// Rozjazd miedzy nimi bylby cichy: `srcset` wskazujacy plik, ktorego nie ma,
// nie wywala strony, tylko po cichu wraca do oryginalu wazacego 600 kB.

export const SZEROKOSCI_HERO = {
  // Panorama przez cala szerokosc okna.
  "hero-studio": [768, 1152, 1536, 1920, 2560],
  "hero-jewelry": [768, 1152, 1536, 1920, 2560],
  // Kafelki na stronie glownej: polowa kontenera 1024 px, na telefonie calosc.
  "hero-home-jewelry": [384, 512, 768, 1024, 1536],
  "hero-home-studio": [384, 512, 768, 1024, 1536],
  "hero-print-settings": [384, 512, 768, 1024, 1536],
  // Paski nad narzedziami.
  "hero-toolstudio": [640, 960, 1280, 1584],
  "hero-toolsjewelry": [640, 960, 1280, 1584],
};

export const FORMATY_HERO = ["avif", "webp"];

/** `srcset` dla jednego formatu, np. "/img/hero/hero-studio-768.avif 768w, ..." */
export function zestawHero(nazwa, format) {
  const szerokosci = SZEROKOSCI_HERO[nazwa];
  if (!szerokosci) return "";
  return szerokosci.map((w) => `/img/hero/${nazwa}-${w}.${format} ${w}w`).join(", ");
}
