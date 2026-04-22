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
  defaultImage: "https://www.aejaca.com/hero-jewelry.jpg",
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
      title: "Glosariusz — AEJaCA | Pojecia z bizuterii i druku 3D",
      description: "Slownik pojec: bizuteria, druk 3D, grawerowanie laserowe, odlewy zywiczne. Kluczowe terminy wyjasnienie w prostych slowach.",
      keywords: "glosariusz bizuteria, slownik druk 3D, pojecia grawerowanie laserowe, terminologia jubilerska, AEJaCA",
      ogAlt: "Glosariusz AEJaCA — slownik pojec",
    },
    en: {
      title: "Glossary — AEJaCA | Jewelry & 3D Printing Terms",
      description: "Key terms from jewelry, 3D printing, laser engraving, and resin casting explained in plain language. Your AEJaCA knowledge base.",
      keywords: "jewelry glossary, 3D printing terms, laser engraving terminology, resin casting guide, AEJaCA",
      ogAlt: "AEJaCA Glossary — key terms explained",
    },
    de: {
      title: "Glossar — AEJaCA | Schmuck- & 3D-Druck-Begriffe",
      description: "Wichtige Begriffe aus Schmuck, 3D-Druck, Lasergravur und Harzguss einfach erklaert. Ihre AEJaCA-Wissensbasis.",
      keywords: "Schmuck Glossar, 3D-Druck Begriffe, Lasergravur Terminologie, Harzguss Leitfaden, AEJaCA",
      ogAlt: "AEJaCA Glossar — Fachbegriffe erklaert",
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
  return `${SITE.url}${path === "/" ? "" : path}`;
}
