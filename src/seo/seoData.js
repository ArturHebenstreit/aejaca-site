// ============================================================
// SEO METADATA — centralized per-page, per-language copy
// ------------------------------------------------------------
// Why this exists:
// - Keeps title/description/keywords ≤ 155 chars, optimized for CTR
// - Matches keyword intent per language (PL / EN / DE)
// - Used by <SEOHead /> and schema builders
//
// Guidelines per Google SERP 2026:
// - title  ≤ 60 chars (shown fully on desktop)
// - desc   ≤ 155 chars (truncated at ~160 on mobile)
// - use brand suffix " — AEJaCA" consistently (recognition)
// - front-load primary keyword in title
// - natural-language descriptions (ChatGPT/Gemini ranking signal)
// ============================================================

export const SITE = {
  url: "https://www.aejaca.com",
  name: "AEJaCA",
  defaultImage: "https://www.aejaca.com/og-default.jpg",
  twitterHandle: "@aejaca_",
  locales: {
    pl: "pl_PL",
    en: "en_US",
    de: "de_DE",
  },
};

// Pages × languages — keep titles ≤ 60 chars, descriptions ≤ 155 chars
export const SEO = {
  home: {
    pl: {
      title: "AEJaCA — Biżuteria Artystyczna i sTuDiO Fabrykacji",
      description: "Ręcznie robiona biżuteria ze srebra i złota z kamieniami + studio druku 3D, grawerowania laserowego i odlewów. Projekt na zamówienie.",
      keywords: "biżuteria ręcznie robiona, srebro, kamienie szlachetne, druk 3D, grawerowanie laserowe, AEJaCA, personalizowane prezenty",
      ogAlt: "Biżuteria AEJaCA — ręcznie robiona z kamieniami szlachetnymi",
    },
    en: {
      title: "AEJaCA — Handcrafted Jewelry & Digital Fabrication Studio",
      description: "Handmade silver & gold jewelry with natural gemstones + 3D printing, laser engraving, and resin casting studio. Custom projects on request.",
      keywords: "handmade silver jewelry, natural gemstones, 3D printing, laser engraving, custom jewelry, AEJaCA, personalized gifts",
      ogAlt: "AEJaCA handcrafted jewelry with natural gemstones",
    },
    de: {
      title: "AEJaCA — Handgefertigter Schmuck & Fabrikations-Studio",
      description: "Handgefertigter Silber- und Goldschmuck mit Edelsteinen + 3D-Druck, Lasergravur und Harzguss-Studio. Individuelle Projekte auf Anfrage.",
      keywords: "handgefertigter Schmuck, Silber, Edelsteine, 3D-Druck, Lasergravur, AEJaCA, personalisierte Geschenke",
      ogAlt: "AEJaCA handgefertigter Schmuck mit Edelsteinen",
    },
  },

  jewelry: {
    pl: {
      title: "AEJaCA Biżuteria — Ręcznie Robione Srebro, Złoto, Kamienie",
      description: "Biżuteria na zamówienie: pierścionki zaręczynowe, kolczyki, wisiorki ze srebra 925 i złota 14k/18k z kamieniami. Natychmiastowy kalkulator online.",
      keywords: "pierścionek zaręczynowy na zamówienie, kalkulator biżuterii online, biżuteria srebrna, pierścionki z kamieniami, kolczyki, bransoletki, biżuteria na zamówienie, personalizowana biżuteria",
      ogAlt: "Ręcznie robione pierścionki i biżuteria AEJaCA",
    },
    en: {
      title: "AEJaCA Jewelry — Handmade Silver, Gold & Gemstone Pieces",
      description: "Custom engagement rings, earrings, pendants in silver 925 & gold 14k/18k with natural gemstones. Instant online jewelry price calculator.",
      keywords: "engagement rings online, custom jewelry calculator, silver jewelry, gemstone rings, earrings, bracelets, personalized jewelry, custom jewelry design, handmade pendants",
      ogAlt: "AEJaCA handmade rings and jewelry pieces",
    },
    de: {
      title: "AEJaCA Schmuck — Handgefertigte Ringe, Ohrringe, Anhänger",
      description: "Individuelle Verlobungsringe, Ohrringe, Anhänger aus Silber 925 & Gold 14k/18k mit Edelsteinen. Sofort-Preisrechner für Schmuck online.",
      keywords: "Verlobungsring auf Bestellung, Schmuck-Preisrechner online, Silberschmuck, Ringe mit Edelsteinen, Ohrringe, Armbänder, personalisierter Schmuck, individuelles Schmuckdesign",
      ogAlt: "AEJaCA handgefertigte Ringe und Schmuckstücke",
    },
  },

  studio: {
    pl: {
      title: "AEJaCA sTuDiO — Druk 3D, Laser, Odlewy Żywiczne",
      description: "Kalkulator wyceny druku 3D online (STL/SVG) + grawerowanie laser CO2/Fiber + odlewy żywiczne. Prototypy i produkcja małoseryjna.",
      keywords: "kalkulator wyceny druku 3D online, wycena STL online, druk 3D na zamówienie, grawerowanie laserowe cena, laser fiber, CO2 laser, odlewy żywiczne, prototypowanie, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO — warsztat druku 3D i grawerowania laserowego",
    },
    en: {
      title: "AEJaCA sTuDiO — 3D Printing, Laser Engraving & Resin Casting",
      description: "3D printing cost calculator online (STL/SVG) + CO2/Fiber laser engraving + UV/2K resin casting. Instant quote for prototypes & custom parts.",
      keywords: "3D printing cost calculator online, STL upload instant quote, laser engraving price calculator, custom 3D prints, fiber laser, CO2 laser, resin casting, prototyping, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO — 3D printing and laser engraving workshop",
    },
    de: {
      title: "AEJaCA sTuDiO — 3D-Druck, Lasergravur, Harzguss",
      description: "3D-Druck-Preisrechner online (STL/SVG) + CO2-/Faserlasergravur + UV-/2K-Harzguss. Sofort-Angebot für Prototypen & Kleinserien.",
      keywords: "3D-Druck Preisrechner online, STL Sofort-Angebot, Lasergravur Preis Rechner, individueller 3D-Druck, Faserlaser, CO2-Laser, Harzguss, Prototyping, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO — 3D-Druck- und Lasergravurwerkstatt",
    },
  },

  contact: {
    pl: {
      title: "Kontakt — AEJaCA | Biżuteria & sTuDiO",
      description: "Skontaktuj się z AEJaCA — zamówienia indywidualne biżuterii, wyceny druku 3D i grawerowania laserowego. Odpowiadamy w ciągu 24 godzin.",
      keywords: "kontakt AEJaCA, zamówienie biżuterii, wycena druku 3D, grawerowanie laserowe",
      ogAlt: "Skontaktuj się z AEJaCA",
    },
    en: {
      title: "Contact — AEJaCA | Jewelry & sTuDiO",
      description: "Get in touch with AEJaCA for custom jewelry commissions, 3D printing quotes and laser engraving. We respond within 24 hours.",
      keywords: "contact AEJaCA, jewelry commission, 3D print quote, laser engraving order",
      ogAlt: "Contact AEJaCA",
    },
    de: {
      title: "Kontakt — AEJaCA | Schmuck & sTuDiO",
      description: "Kontaktieren Sie AEJaCA für individuelle Schmuckanfertigungen, 3D-Druck-Angebote und Lasergravur. Antwort innerhalb von 24 Stunden.",
      keywords: "Kontakt AEJaCA, Schmuckanfertigung, 3D-Druck Angebot, Lasergravur Auftrag",
      ogAlt: "AEJaCA kontaktieren",
    },
  },

  glossary: {
    pl: {
      title: "Słownik pojęć — AEJaCA | Biżuteria i druk 3D",
      description: "Słownik pojęć: biżuteria, druk 3D, grawerowanie laserowe, odlewy żywiczne. Kluczowe terminy wyjaśnione w prostych słowach.",
      keywords: "glosariusz biżuteria, słownik druk 3D, pojęcia grawerowanie laserowe, terminologia jubilerska, AEJaCA",
      ogAlt: "Glosariusz AEJaCA — słownik pojęć",
    },
    en: {
      title: "Glossary — AEJaCA | Jewelry & 3D Printing Terms",
      description: "Key terms from jewelry, 3D printing, laser engraving, and resin casting explained in plain language. Your AEJaCA knowledge base.",
      keywords: "jewelry glossary, 3D printing terms, laser engraving terminology, resin casting guide, AEJaCA",
      ogAlt: "AEJaCA Glossary — key terms explained",
    },
    de: {
      title: "Glossar — AEJaCA | Schmuck- & 3D-Druck-Begriffe",
      description: "Wichtige Begriffe aus Schmuck, 3D-Druck, Lasergravur und Harzguss einfach erklärt. Ihre AEJaCA-Wissensbasis.",
      keywords: "Schmuck Glossar, 3D-Druck Begriffe, Lasergravur Terminologie, Harzguss Leitfaden, AEJaCA",
      ogAlt: "AEJaCA Glossar — Fachbegriffe erklärt",
    },
  },

  about: {
    pl: {
      title: "O AEJaCA — Rzemiosło i technologia od 2023 roku",
      description: "AEJaCA to marka łącząca rzemiosło jubilerskie z technologią. Artur Hebenstreit — doświadczenie od 2023 roku, 150+ projektów, ocena 5.0 na Google.",
      keywords: "o AEJaCA, Artur Hebenstreit, biżuteria ręcznie robiona, druk 3D, laser, Bambu Lab H2D, xTool P2, Raycus fiber",
      ogAlt: "Warsztat AEJaCA — biżuteria i studio fabrykacji cyfrowej",
    },
    en: {
      title: "About AEJaCA — Craft and technology for 3+ years",
      description: "AEJaCA combines jewelry craft with technology. Artur Hebenstreit — experience since 2023, 150+ projects, 5.0 rating on Google.",
      keywords: "about AEJaCA, Artur Hebenstreit, handmade jewelry, 3D printing, laser engraving, Bambu Lab H2D, xTool P2, Raycus fiber",
      ogAlt: "AEJaCA workshop — jewelry and digital fabrication studio",
    },
    de: {
      title: "Über AEJaCA — Handwerk und Technologie seit 3+ Jahren",
      description: "AEJaCA verbindet Schmuckhandwerk mit Technologie. Artur Hebenstreit — Erfahrung seit 2023, 150+ Projekte, 5,0 auf Google.",
      keywords: "über AEJaCA, Artur Hebenstreit, handgefertigter Schmuck, 3D-Druck, Lasergravur, Bambu Lab H2D, xTool P2, Raycus Faser",
      ogAlt: "AEJaCA Werkstatt — Schmuck und digitale Fertigung",
    },
  },

  warranty: {
    pl: {
      title: "Gwarancja 24 miesiące — AEJaCA",
      description: "Gwarancja AEJaCA: 24 miesiące na wady produkcyjne, bezpłatny serwis w pierwszym roku, reklamacja w 14 dni roboczych.",
      keywords: "gwarancja biżuteria, reklamacja AEJaCA, serwis biżuterii, wady produkcyjne",
      ogAlt: "Gwarancja AEJaCA — 24 miesiące",
    },
    en: {
      title: "24-Month Warranty — AEJaCA",
      description: "AEJaCA warranty: 24 months on manufacturing defects, complimentary first-year service, claims handled within 14 business days.",
      keywords: "jewelry warranty, AEJaCA claim, jewelry service, manufacturing defects",
      ogAlt: "AEJaCA 24-month warranty",
    },
    de: {
      title: "24 Monate Garantie — AEJaCA",
      description: "AEJaCA Garantie: 24 Monate auf Herstellungsfehler, kostenloser Service im ersten Jahr, Bearbeitung innerhalb von 14 Werktagen.",
      keywords: "Schmuck Garantie, AEJaCA Reklamation, Schmuckservice, Herstellungsfehler",
      ogAlt: "AEJaCA 24 Monate Garantie",
    },
  },

  returns: {
    pl: {
      title: "Zwroty i wymiany — AEJaCA",
      description: "Polityka zwrotów AEJaCA: 14-dniowe prawo odstąpienia dla produktów niespersonalizowanych. Biżuteria na zamówienie wyłączona.",
      keywords: "zwrot biżuteria, polityka zwrotów AEJaCA, prawo odstąpienia, wymiana produktów",
      ogAlt: "Polityka zwrotów AEJaCA",
    },
    en: {
      title: "Returns & Exchanges — AEJaCA",
      description: "AEJaCA return policy: 14-day withdrawal right for non-personalized products. Custom jewelry orders are excluded from returns.",
      keywords: "return policy jewelry, AEJaCA returns, right of withdrawal, product exchange",
      ogAlt: "AEJaCA returns and exchanges policy",
    },
    de: {
      title: "Rückgabe & Umtausch — AEJaCA",
      description: "AEJaCA Rückgabebedingungen: 14-tägiges Widerrufsrecht für nicht personalisierte Produkte. Individuelle Bestellungen ausgeschlossen.",
      keywords: "Rückgabe Schmuck, AEJaCA Rückgabebedingungen, Widerrufsrecht, Produktumtausch",
      ogAlt: "AEJaCA Rückgabe- und Umtauschrichtlinien",
    },
  },

  shipping: {
    pl: {
      title: "Wysyłka i dostawa — AEJaCA",
      description: "Koszty i czasy dostawy AEJaCA: kurier InPost, paczkomat, odbiór osobisty. Darmowa wysyłka od 400 zł. Europa i świat na zamówienie.",
      keywords: "wysyłka biżuteria, koszty dostawy AEJaCA, InPost, czas realizacji, darmowa wysyłka",
      ogAlt: "Wysyłka i dostawa AEJaCA",
    },
    en: {
      title: "Shipping & Delivery — AEJaCA",
      description: "AEJaCA shipping: InPost courier, parcel locker, personal pickup. Free shipping over 400 PLN. Europe & worldwide on request.",
      keywords: "jewelry shipping, AEJaCA delivery, InPost, fulfillment time, free shipping Poland",
      ogAlt: "AEJaCA shipping and delivery",
    },
    de: {
      title: "Versand & Lieferung — AEJaCA",
      description: "AEJaCA Versand: InPost Kurier, Paketautomat, persönliche Abholung. Kostenloser Versand ab 400 PLN. Europa & weltweit auf Anfrage.",
      keywords: "Schmuck Versand, AEJaCA Lieferung, InPost, Bearbeitungszeit, kostenloser Versand",
      ogAlt: "AEJaCA Versand und Lieferung",
    },
  },

  privacy: {
    pl: {
      title: "Polityka prywatności — AEJaCA",
      description: "Polityka prywatności AEJaCA — dane osobowe, RODO, pliki cookies. Dowiedz się, jak chronimy Twoje dane przy zamówieniach i kontaktach.",
      keywords: "polityka prywatności, RODO, dane osobowe, cookies, AEJaCA",
      ogAlt: "Polityka prywatności AEJaCA",
    },
    en: {
      title: "Privacy Policy — AEJaCA",
      description: "AEJaCA privacy policy — personal data, GDPR, cookies. Learn how we protect your information when you order or contact us.",
      keywords: "privacy policy, GDPR, personal data, cookies, AEJaCA",
      ogAlt: "AEJaCA privacy policy",
    },
    de: {
      title: "Datenschutz — AEJaCA",
      description: "AEJaCA Datenschutzerklärung — persönliche Daten, DSGVO, Cookies. Erfahren Sie, wie wir Ihre Daten bei Bestellungen und Anfragen schützen.",
      keywords: "Datenschutz, DSGVO, persönliche Daten, Cookies, AEJaCA",
      ogAlt: "AEJaCA Datenschutzerklärung",
    },
  },
};

// Get page SEO data (with English fallback)
export function getSEO(pageKey, lang = "en") {
  const page = SEO[pageKey] || SEO.home;
  return page[lang] || page.en || page.pl;
}

// Get canonical URL for a given path
export function canonicalUrl(path = "/") {
  if (path === "/") return SITE.url;
  return `${SITE.url}${path.endsWith("/") ? path : path + "/"}`;
}
