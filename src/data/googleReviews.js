// ============================================================
// GOOGLE REVIEWS — statyczne dane z Google Business Profile
// ------------------------------------------------------------
// Dlaczego statyczne:
// - Google Places API ma limit 5 recenzji / zapytanie (nie 22)
// - ToS Places API: cache max 30 dni — trzeba regenerować regularnie
// - Statyczny JSON = pełna kontrola, wszystkie 22 opinie, zero kosztów
//
// AKTUALIZACJA:
// 1. Wejdź na https://maps.app.goo.gl/D9XHVQD4ufjjA5X18
// 2. Skopiuj nowe opinie do tablicy REVIEWS poniżej
// 3. Commit → Cloudflare automatycznie przebuduje stronę
//
// STRUKTURA OPINII:
//   id           — unikalny identyfikator (r1, r2…)
//   author       — imię i inicjał nazwiska (jak na Google Maps)
//   rating       — 1–5
//   date         — data publikacji (ISO: YYYY-MM-DD)
//   originalLang — język oryginalny ("pl" | "en" | "de" | "fr"…)
//   text         — treść oryginalna 1:1 z Google (bez poprawek)
//   translations — { en, pl, de } — opcjonalne tłumaczenia (fallback: oryginał)
//
// SCHEMA.ORG:
// - aggregateRating pokazuje 5.0 / 22 w SERP (gwiazdki)
// - Review[] z publisher:Google = jawna atrybucja (SEO-safe)
// ============================================================

export const GOOGLE_BUSINESS = {
  // Google Business Profile AEJaCA Warszawa
  name: "AEJaCA - Artisan Elegance Jewelry and Crafted Art",
  // Google Maps short link (istniejący, używany w footerze)
  mapsUrl: "https://maps.app.goo.gl/D9XHVQD4ufjjA5X18",
  // Deep link do zakładki "Napisz opinię" (działa z CID)
  // CID decimal = 9087352033228805430 (z feature ID 0x7e1cc2870186d536)
  // Uwaga: dla 100% bezpośredniego linku na formularz, właściciel GBP
  // może skopiować "Link do opinii" z panelu Google Business Profile
  // (Home → Get more reviews → Share review form) — wtedy wkleić tutaj.
  writeReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJE7k_bwABwGwRNtWGAYfCHH4",
  // Agregaty (aktualizuj przy zmianach)
  rating: 5.0,
  totalReviews: 22,
};

// -------------------------------------------------------------------
// Lista 22 recenzji — DO UZUPEŁNIENIA Z GOOGLE MAPS
// -------------------------------------------------------------------
// Na razie przykładowa struktura + placeholdery.
// Wejdź na link Maps, skopiuj każdą opinię do tablicy poniżej.
// -------------------------------------------------------------------

export const REVIEWS = [
  {
    id: "r1",
    author: "Przykładowy autor 1",
    rating: 5,
    date: "2026-01-15",
    originalLang: "pl",
    text: "PLACEHOLDER — zastąp treścią z Google Maps. Przykład: 'Świetna jakość wykonania, biżuteria ze srebra z kamieniami naturalnymi. Polecam każdemu, kto szuka czegoś unikalnego.'",
    translations: {
      en: "PLACEHOLDER — replace with translation. Example: 'Great workmanship, silver jewelry with natural stones. Recommended for anyone looking for something unique.'",
      de: "PLACEHOLDER — Ersetze mit Übersetzung. Beispiel: 'Tolle Verarbeitung, Silberschmuck mit Natursteinen. Empfohlen für alle, die etwas Einzigartiges suchen.'",
    },
  },
  {
    id: "r2",
    author: "Przykładowy autor 2",
    rating: 5,
    date: "2025-12-20",
    originalLang: "en",
    text: "PLACEHOLDER — replace with original English review from Google Maps.",
    translations: {
      pl: "PLACEHOLDER — tłumaczenie polskie.",
      de: "PLACEHOLDER — deutsche Übersetzung.",
    },
  },
  {
    id: "r3",
    author: "Przykładowy autor 3",
    rating: 5,
    date: "2025-11-10",
    originalLang: "pl",
    text: "PLACEHOLDER — kolejny przykład polskiej opinii.",
    translations: {
      en: "PLACEHOLDER — English translation.",
      de: "PLACEHOLDER — Deutsche Übersetzung.",
    },
  },
  // TODO: dodaj pozostałe 19 opinii (total 22)
  // Struktura powyżej — po prostu skopiuj i wypełnij.
];
