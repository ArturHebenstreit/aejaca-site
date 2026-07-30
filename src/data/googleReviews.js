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
// - aggregateRating pokazuje 5.0 / 25 w SERP (gwiazdki)
// - Review[] z publisher:Google = jawna atrybucja (SEO-safe)
// - W JSON-LD trafiają TYLKO opinie z treścią (Google guidelines wymagają reviewBody)
// - Na stronie cytujemy tylko opinie z komentarzem (od najnowszej); rating-only
//   nie są wyświetlane, ale liczą się w aggregateRating (reviewCount = 25)
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
  totalReviews: 25,
};

// ============================================================
// TRUSTPILOT — osobne źródło, świadomie NIE łączone z Google
// ------------------------------------------------------------
// Dlaczego osobno: buildReviewsAugmentedOrganization emituje każdą
// opinię z publisher: "Google". Dopisanie tu opinii z Trustpilota
// zafałszowałoby atrybucję w JSON-LD i rozjechało reviewCount
// z rzeczywistą liczbą opinii na Google Business Profile.
//
// Widget na stronie głównej (TrustpilotWidget.jsx) ciąga dane na
// żywo z Trustpilota, więc te wartości służą wyłącznie tam, gdzie
// potrzebujemy ich po stronie serwera (prerender, treści).
// Aktualizuj ręcznie przy zmianach.
// ============================================================

export const TRUSTPILOT_BUSINESS = {
  profileUrl: "https://www.trustpilot.com/review/aejaca.com",
  writeReviewUrl: "https://www.trustpilot.com/evaluate/aejaca.com",
  // TrustScore, nie średnia arytmetyczna. Trustpilot waży ocenę wolumenem i
  // świeżością, więc przy dwóch opiniach na 5 gwiazdek wskaźnik wynosi 3,8 i
  // będzie rósł wraz z liczbą opinii. Dlatego NIE pokazujemy tej liczby jako
  // nagłówka: zaniża ona to, co klienci faktycznie ocenili, i stoi obok
  // Google 5,0. Prezentujemy fakt rozkładu gwiazdek, patrz Reviews.jsx.
  rating: 3.8,
  totalReviews: 2,
  // Udział ocen 5-gwiazdkowych. 1 = wszystkie.
  fiveStarShare: 1,
};

export const TRUSTPILOT_REVIEWS = [
  {
    id: "tp2",
    author: "Aleksandra Kwaśnica",
    rating: 5,
    date: "2026-07-29",
    originalLang: "pl",
    title: "Serdecznie polecam :) wykonanie",
    text: "Serdecznie polecam :) wykonanie, jakość i szybka, miła obsługa :)",
    translations: {
      en: "I warmly recommend :) the craftsmanship, the quality, and the fast, friendly service :)",
      de: "Ich empfehle es von Herzen :) die Ausführung, die Qualität und der schnelle, freundliche Service :)",
    },
    // Ta sama klientka ma też ocenę na Google (r11, bez treści, z marca).
    alsoOnGoogle: "r11",
  },
  {
    id: "tp1",
    author: "Jakub",
    rating: 5,
    date: "2026-07-28",
    originalLang: "pl",
    title: "Cudownie wykonana praca",
    text: "Cudownie wykonana praca! Kontakt był bardzo szybki i łatwy. Wspólnie z AEJaCA mogłem dojść do finalnego designu a wystarczył tylko pomysł. Zdecydowanie polecam!",
    translations: {
      en: "Wonderfully executed work! Contact was very quick and easy. Together with AEJaCA I was able to arrive at the final design, and an idea was all it took. I definitely recommend them!",
      de: "Wunderbar ausgeführte Arbeit! Der Kontakt war sehr schnell und unkompliziert. Gemeinsam mit AEJaCA kam ich zum finalen Design, und eine Idee genügte. Ich kann sie absolut empfehlen!",
    },
    // Uwaga: ten sam klient zostawił tę samą treść także na Google (r25).
    // Nie cytować obu naraz na jednej liście, bo wygląda to na sztuczne
    // zwielokrotnienie tej samej opinii.
    alsoOnGoogle: "r25",
  },
];

// -------------------------------------------------------------------
// 25 rzeczywistych opinii z Google Maps (stan: lipiec 2026)
// 11 z treścią + 14 rating-only (5★, bez tekstu, normalne na Google)
// Daty szacunkowe "miesiąc temu" — wszystkie w marcu 2026,
// oprócz Artur Hebenstreit (2 mies. temu wg odpowiedzi właściciela).
// -------------------------------------------------------------------

export const REVIEWS = [
  // --- Z TREŚCIĄ (10) ---
  {
    id: "r25",
    author: "Jacob",
    rating: 5,
    date: "2026-07-28",
    originalLang: "pl",
    text: "Cudownie wykonana praca! Kontakt był bardzo szybki i łatwy. Wspólnie z AEJaCA mogłem dojść do finalnego designu a wystarczył tylko pomysł. Zdecydowanie polecam!",
    translations: {
      en: "Wonderfully executed work! Contact was very quick and easy. Together with AEJaCA I was able to arrive at the final design, and an idea was all it took. I definitely recommend them!",
      de: "Wunderbar ausgeführte Arbeit! Der Kontakt war sehr schnell und unkompliziert. Gemeinsam mit AEJaCA kam ich zum finalen Design, und eine Idee genügte. Ich kann sie absolut empfehlen!",
    },
  },
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
  {
    id: "r24",
    author: "Renata Strzerzysz",
    rating: 5,
    date: "2026-06-29",
    originalLang: "pl",
    text: "Świetny kontakt, profesjonalne podejście do klienta. Propozycja wzoru pierścionka była idealna. Bardzo szybka realizacja zamówienia. Nic dodać, nic ująć. Gorąco polecam !!!",
    translations: {
      en: "Great contact, a professional approach to the customer. The ring design proposal was perfect. Very fast order fulfillment. Nothing to add, nothing to take away. Highly recommend !!!",
      de: "Toller Kontakt, professioneller Umgang mit dem Kunden. Der Entwurf des Ringmusters war perfekt. Sehr schnelle Auftragsabwicklung. Nichts hinzuzufügen, nichts wegzunehmen. Sehr zu empfehlen !!!",
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
  {
    id: "r23",
    author: "Ika Ryczkowska",
    rating: 5,
    date: "2026-06-05",
    originalLang: "pl",
    text: "Biżuteria oryginalna, niepowtarzalna. Polecam, miło mieć coś nietuzinkowego.",
    translations: {
      en: "Original, one-of-a-kind jewelry. I recommend it, it's nice to have something out of the ordinary.",
      de: "Origineller, einzigartiger Schmuck. Sehr zu empfehlen, es ist schön, etwas Außergewöhnliches zu haben.",
    },
  },
];
