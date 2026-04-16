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
//   text         — treść oryginalna 1:1 z Google (pusty string = rating-only)
//   translations — { en, pl, de } — opcjonalne tłumaczenia (fallback: oryginał)
//
// SCHEMA.ORG:
// - aggregateRating pokazuje 5.0 / 22 w SERP (gwiazdki)
// - Review[] z publisher:Google = jawna atrybucja (SEO-safe)
// - W JSON-LD trafiają TYLKO opinie z treścią (Google guidelines wymagają reviewBody)
// - Wszystkie 22 (w tym rating-only) są widoczne na stronie = parity z aggregate count
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
// 22 rzeczywiste opinie z Google Maps (stan: kwiecień 2026)
// 8 z treścią + 14 rating-only (5★, bez tekstu — normalne na Google)
// Daty szacunkowe "miesiąc temu" — wszystkie w marcu 2026,
// oprócz Artur Hebenstreit (2 mies. temu wg odpowiedzi właściciela).
// -------------------------------------------------------------------

export const REVIEWS = [
  // --- Z TREŚCIĄ (8) ---
  {
    id: "r1",
    author: "Paweł Kołaszewski",
    rating: 5,
    date: "2026-03-16",
    originalLang: "pl",
    text: "Świetny sklep z biżuterią – możliwość graweru i druku 3D pozwala stworzyć naprawdę wyjątkowe, spersonalizowane projekty. Profesjonalna obsługa, wysoka jakość wykonania i szybka realizacja zamówienia sprawiają, że z czystym sumieniem polecam to miejsce.",
    translations: {
      en: "Great jewelry shop – engraving and 3D printing options let you create truly unique, personalized designs. Professional service, high-quality workmanship and fast order fulfillment make me recommend this place with a clear conscience.",
      de: "Großartiges Schmuckgeschäft – Gravur und 3D-Druck ermöglichen wirklich einzigartige, personalisierte Designs. Professioneller Service, hochwertige Verarbeitung und schnelle Auftragsabwicklung — ich empfehle diesen Ort mit gutem Gewissen.",
    },
  },
  {
    id: "r2",
    author: "Andrzej Ryczkowski",
    rating: 5,
    date: "2026-03-15",
    originalLang: "pl",
    text: "Bursztyn, srebro ... Wszystko pięknie",
    translations: {
      en: "Amber, silver ... Everything beautiful",
      de: "Bernstein, Silber ... Alles wunderschön",
    },
  },
  {
    id: "r3",
    author: "Martin Sabaranski",
    rating: 5,
    date: "2026-03-14",
    originalLang: "pl",
    text: "Pełen profesjonalizm. Polecam",
    translations: {
      en: "Full professionalism. Recommended",
      de: "Volle Professionalität. Sehr empfehlenswert",
    },
  },
  {
    id: "r4",
    author: "Krzysztof Kapica",
    rating: 5,
    date: "2026-03-13",
    originalLang: "pl",
    text: "Super sprawa ;)",
    translations: {
      en: "Super cool ;)",
      de: "Super Sache ;)",
    },
  },
  {
    id: "r5",
    author: "Alicja Wiśniewska",
    rating: 5,
    date: "2026-03-12",
    originalLang: "pl",
    text: "Cuda! 🤩",
    translations: {
      en: "Wonders! 🤩",
      de: "Wunder! 🤩",
    },
  },
  {
    id: "r6",
    author: "Artur Hebenstreit",
    rating: 5,
    // Google: "Edytowano 4 godziny temu"; odpowiedź właściciela "2 miesiące temu"
    // — więc oryginalna publikacja to ~luty 2026.
    date: "2026-02-15",
    originalLang: "en",
    text: "Highly recommend!",
    translations: {
      pl: "Serdecznie polecam!",
      de: "Sehr zu empfehlen!",
    },
  },
  {
    id: "r7",
    author: "Natalia Mietlicka-Szymańska",
    rating: 5,
    date: "2026-03-11",
    originalLang: "pl",
    text: "Super!",
    translations: {
      en: "Super!",
      de: "Super!",
    },
  },
  {
    id: "r8",
    author: "Krzysztof Haczynski",
    rating: 5,
    date: "2026-03-10",
    originalLang: "pl",
    text: "Super",
    translations: {
      en: "Super",
      de: "Super",
    },
  },

  // --- RATING-ONLY (14) — 5★ bez tekstu, widoczne jako nagłówek z gwiazdkami ---
  { id: "r9",  author: "Bartosz Kowalczyk",   rating: 5, date: "2026-03-16", originalLang: "pl", text: "" },
  { id: "r10", author: "M O",                 rating: 5, date: "2026-03-15", originalLang: "pl", text: "" },
  { id: "r11", author: "Aleksandra Kwaśnica", rating: 5, date: "2026-03-14", originalLang: "pl", text: "" },
  { id: "r12", author: "Daniel Dąbrowski",    rating: 5, date: "2026-03-13", originalLang: "pl", text: "" },
  { id: "r13", author: "Urszula Szczepańska", rating: 5, date: "2026-03-12", originalLang: "pl", text: "" },
  { id: "r14", author: "James Freeman",       rating: 5, date: "2026-03-11", originalLang: "en", text: "" },
  { id: "r15", author: "Carley Frohling",     rating: 5, date: "2026-03-10", originalLang: "en", text: "" },
  { id: "r16", author: "Mateusz Chomicki",    rating: 5, date: "2026-03-09", originalLang: "pl", text: "" },
  { id: "r17", author: "Wojciech Sawicki",    rating: 5, date: "2026-03-08", originalLang: "pl", text: "" },
  { id: "r18", author: "Piotr Nawrot",        rating: 5, date: "2026-03-07", originalLang: "pl", text: "" },
  { id: "r19", author: "Norbert Czulewicz",   rating: 5, date: "2026-03-06", originalLang: "pl", text: "" },
  { id: "r20", author: "Marcin Kosek",        rating: 5, date: "2026-03-05", originalLang: "pl", text: "" },
  { id: "r21", author: "Justyna Wodyńska",    rating: 5, date: "2026-03-04", originalLang: "pl", text: "" },
  { id: "r22", author: "Andrzej Buczkowski",  rating: 5, date: "2026-03-03", originalLang: "pl", text: "" },
];
