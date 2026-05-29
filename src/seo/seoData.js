// ============================================================
// SEO METADATA, centralized per-page, per-language copy
// ------------------------------------------------------------
// Why this exists:
// - Keeps title/description/keywords ≤ 155 chars, optimized for CTR
// - Matches keyword intent per language (PL / EN / DE)
// - Used by <SEOHead /> and schema builders
//
// Guidelines per Google SERP 2026:
// - title  ≤ 60 chars (shown fully on desktop)
// - desc   ≤ 155 chars (truncated at ~160 on mobile)
// - use brand suffix ", AEJaCA" consistently (recognition)
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

// Pages × languages, keep titles ≤ 60 chars, descriptions ≤ 155 chars
export const SEO = {
  home: {
    pl: {
      title: "AEJaCA — Biżuteria Artystyczna & sTuDiO Fabrykacji Cyfrowej",
      description: "Dwie marki, jedno studio. AEJaCA Biżuteria: srebro, złoto, kamienie szlachetne, żywica epoksydowa. AEJaCA sTuDiO: druk 3D, grawer CO2 & Fiber.",
      keywords: "biżuteria ręcznie robiona, srebro, złoto, kamienie szlachetne, żywica epoksydowa, druk 3D, materiały inżynierskie, grawerowanie laserowe CO2, Fiber laser, modelowanie 3D, Rhino, Fusion 360, AEJaCA",
      ogAlt: "AEJaCA Biżuteria i sTuDiO — dwie marki, jedno studio rzemiosła",
    },
    en: {
      title: "AEJaCA — Handcrafted Jewelry & Digital Fabrication Studio",
      description: "Two brands, one studio. AEJaCA Jewelry: silver, gold, natural gemstones, epoxy resin. AEJaCA sTuDiO: 3D printing, CO2 & Fiber laser engraving.",
      keywords: "handmade jewelry, silver, gold, natural gemstones, epoxy resin, 3D printing, engineering materials, CO2 laser engraving, Fiber laser, 3D modeling, Rhino, Fusion 360, AEJaCA",
      ogAlt: "AEJaCA Jewelry and sTuDiO — two brands, one craft studio",
    },
    de: {
      title: "AEJaCA — Handgefertigter Schmuck & Studio für Digitalfertigung",
      description: "Zwei Marken, ein Studio. AEJaCA Schmuck: Silber, Gold, Edelsteine, Epoxidharz. AEJaCA sTuDiO: 3D-Druck, CO2- & Fiber-Lasergravur.",
      keywords: "handgefertigter Schmuck, Silber, Gold, Edelsteine, Epoxidharz, 3D-Druck, Ingenieurswerkstoffe, CO2-Lasergravur, Fiber-Laser, 3D-Modellierung, Rhino, Fusion 360, AEJaCA",
      ogAlt: "AEJaCA Schmuck und sTuDiO — zwei Marken, ein Handwerksstudio",
    },
  },

  jewelry: {
    pl: {
      title: "AEJaCA Biżuteria, Ręcznie Robione Srebro, Złoto, Kamienie",
      description: "Biżuteria na zamówienie: pierścionki zaręczynowe, kolczyki, wisiorki ze srebra 925 i złota 14k/18k z kamieniami. Natychmiastowy kalkulator online.",
      keywords: "pierścionek zaręczynowy na zamówienie, kalkulator biżuterii online, biżuteria srebrna, pierścionki z kamieniami, kolczyki, bransoletki, biżuteria na zamówienie, personalizowana biżuteria, kamienie szlachetne, kamienie półszlachetne, diament, rubin, szafir, szmaragd, turkus, onyks, perła, opal, granat, topaz",
      ogAlt: "Ręcznie robione pierścionki i biżuteria AEJaCA",
    },
    en: {
      title: "AEJaCA Jewelry, Handmade Silver, Gold & Gemstone Pieces",
      description: "Custom engagement rings, earrings, pendants in silver 925 & gold 14k/18k with natural gemstones. Instant online jewelry price calculator.",
      keywords: "engagement rings online, custom jewelry calculator, silver jewelry, gemstone rings, earrings, bracelets, personalized jewelry, custom jewelry design, handmade pendants, natural gemstones, semi-precious stones, diamond, ruby, sapphire, emerald, turquoise, onyx, pearl, opal, garnet, topaz",
      ogAlt: "AEJaCA handmade rings and jewelry pieces",
    },
    de: {
      title: "AEJaCA Schmuck, Handgefertigte Ringe, Ohrringe, Anhänger",
      description: "Individuelle Verlobungsringe, Ohrringe, Anhänger aus Silber 925 & Gold 14k/18k mit Edelsteinen. Sofort-Preisrechner für Schmuck online.",
      keywords: "Verlobungsring auf Bestellung, Schmuck-Preisrechner online, Silberschmuck, Ringe mit Edelsteinen, Ohrringe, Armbänder, personalisierter Schmuck, individuelles Schmuckdesign, Edelsteine, Halbedelsteine, Diamant, Rubin, Saphir, Smaragd, Türkis, Onyx, Perle, Opal, Granat, Topas",
      ogAlt: "AEJaCA handgefertigte Ringe und Schmuckstücke",
    },
  },

  studio: {
    pl: {
      title: "AEJaCA sTuDiO, Druk 3D, Laser, Modelowanie 3D, Odlewy",
      description: "Kalkulator wyceny druku 3D online (STL) + laser CO2/Fiber + odlewy żywiczne. Modelowanie 3D (Rhino, Fusion 360). Materiały inżynierskie, małe serie.",
      keywords: "kalkulator wyceny druku 3D online, wycena STL online, druk 3D na zamówienie, materiały inżynierskie, PETG, ASA, PA6, PC, PEEK, TPU, druk 3D funkcjonalny, grawerowanie laserowe, laser CO2, Fiber laser, odlewy żywiczne, modelowanie 3D, Rhino 3D, Fusion 360, projekt 3D na zamówienie, prototypowanie, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO, druk 3D, laser, modelowanie 3D i odlewy żywiczne",
    },
    en: {
      title: "AEJaCA sTuDiO, 3D Printing, Laser Engraving & 3D Modeling",
      description: "3D printing quote online (STL) + CO2/Fiber laser engraving + resin casting. 3D modeling (Rhino, Fusion 360). Engineering materials, small runs.",
      keywords: "3D printing cost calculator online, STL upload instant quote, laser engraving price, engineering materials, PETG, ASA, PA6, PC, PEEK, TPU, functional 3D printing, fiber laser, CO2 laser, resin casting, 3D modeling, Rhino 3D, Fusion 360, custom 3D design, prototyping, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO, 3D printing, laser engraving and 3D modeling",
    },
    de: {
      title: "AEJaCA sTuDiO, 3D-Druck, Lasergravur, 3D-Modellierung",
      description: "3D-Druck Preisrechner online (STL) + CO2-/Fiber-Lasergravur + Harzguss. 3D-Modellierung (Rhino, Fusion 360). Ingenieurswerkstoffe, Kleinserien.",
      keywords: "3D-Druck Preisrechner online, STL Sofort-Angebot, Lasergravur Preis, Ingenieurswerkstoffe, PETG, ASA, PA6, PC, PEEK, TPU, technischer 3D-Druck, Faserlaser, CO2-Laser, Harzguss, 3D-Modellierung, Rhino 3D, Fusion 360, 3D-Design auf Bestellung, Prototyping, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO, 3D-Druck, Lasergravur und 3D-Modellierung",
    },
  },

  contact: {
    pl: {
      title: "Kontakt, AEJaCA | Biżuteria & sTuDiO",
      description: "Skontaktuj się z AEJaCA, zamówienia indywidualne biżuterii, wyceny druku 3D i grawerowania laserowego. Odpowiadamy w ciągu 24 godzin.",
      keywords: "kontakt AEJaCA, zamówienie biżuterii, wycena druku 3D, grawerowanie laserowe",
      ogAlt: "Skontaktuj się z AEJaCA",
    },
    en: {
      title: "Contact, AEJaCA | Jewelry & sTuDiO",
      description: "Get in touch with AEJaCA for custom jewelry commissions, 3D printing quotes and laser engraving. We respond within 24 hours.",
      keywords: "contact AEJaCA, jewelry commission, 3D print quote, laser engraving order",
      ogAlt: "Contact AEJaCA",
    },
    de: {
      title: "Kontakt, AEJaCA | Schmuck & sTuDiO",
      description: "Kontaktieren Sie AEJaCA für individuelle Schmuckanfertigungen, 3D-Druck-Angebote und Lasergravur. Antwort innerhalb von 24 Stunden.",
      keywords: "Kontakt AEJaCA, Schmuckanfertigung, 3D-Druck Angebot, Lasergravur Auftrag",
      ogAlt: "AEJaCA kontaktieren",
    },
  },

  glossary: {
    pl: {
      title: "Słownik pojęć, AEJaCA | Biżuteria i druk 3D",
      description: "Słownik pojęć: biżuteria, druk 3D, grawerowanie laserowe, odlewy żywiczne. Kluczowe terminy wyjaśnione w prostych słowach.",
      keywords: "glosariusz biżuteria, słownik druk 3D, pojęcia grawerowanie laserowe, terminologia jubilerska, AEJaCA",
      ogAlt: "Glosariusz AEJaCA, słownik pojęć",
    },
    en: {
      title: "Glossary, AEJaCA | Jewelry & 3D Printing Terms",
      description: "Key terms from jewelry, 3D printing, laser engraving, and resin casting explained in plain language. Your AEJaCA knowledge base.",
      keywords: "jewelry glossary, 3D printing terms, laser engraving terminology, resin casting guide, AEJaCA",
      ogAlt: "AEJaCA Glossary, key terms explained",
    },
    de: {
      title: "Glossar, AEJaCA | Schmuck- & 3D-Druck-Begriffe",
      description: "Wichtige Begriffe aus Schmuck, 3D-Druck, Lasergravur und Harzguss einfach erklärt. Ihre AEJaCA-Wissensbasis.",
      keywords: "Schmuck Glossar, 3D-Druck Begriffe, Lasergravur Terminologie, Harzguss Leitfaden, AEJaCA",
      ogAlt: "AEJaCA Glossar, Fachbegriffe erklärt",
    },
  },

  toolsjewelry: {
    pl: {
      title: "Narzędzia jubilerskie, Kalkulatory AEJaCA | Biżuteria",
      description: "Darmowe kalkulatory jubilerskie AEJaCA. Kalkulator blanku obrączki, wycena biżuterii na zamówienie. Bez rejestracji.",
      keywords: "kalkulator jubilerski, kalkulator blanku obrączki, wycena biżuterii online, AEJaCA",
      ogAlt: "Narzędzia jubilerskie AEJaCA, kalkulatory online",
    },
    en: {
      title: "Jewelry Tools & Calculators, AEJaCA",
      description: "Free AEJaCA jewelry calculators. Ring blank calculator, custom jewelry estimator. No registration required.",
      keywords: "jewelry calculator, ring blank calculator, custom jewelry estimate, AEJaCA",
      ogAlt: "AEJaCA Jewelry Tools, online calculators",
    },
    de: {
      title: "Schmuck-Tools & Kalkulatoren, AEJaCA",
      description: "Kostenlose AEJaCA-Schmuck-Kalkulatoren. Ring-Rohling-Rechner, Schmuck nach Maß kalkulieren. Keine Registrierung.",
      keywords: "Schmuckkalkulator, Ring-Rohling-Rechner, Schmuck kalkulieren, AEJaCA",
      ogAlt: "AEJaCA Schmuck-Tools, Online-Kalkulatoren",
    },
  },

  toolstudio: {
    pl: {
      title: "Narzędzia sTuDiO, Parametry laserowania i kalkulator AEJaCA",
      description: "Darmowe narzędzia dla makerów. Interaktywna tabela parametrów laserowania CO₂, Fiber, Dioda, UV. Kalkulator wyceny sTuDiO.",
      keywords: "parametry laserowania, kalkulator laserowy, tabela parametrów laser, CO2 laser drewno, fiber laser stal, AEJaCA",
      ogAlt: "Narzędzia sTuDiO AEJaCA, parametry laserowania i kalkulator",
    },
    en: {
      title: "sTuDiO Tools, Laser Parameters & Calculator, AEJaCA",
      description: "Free tools for makers. Interactive laser parameter table for CO₂, Fiber, Diode, UV lasers. sTuDiO project estimator.",
      keywords: "laser parameters table, laser calculator, CO2 laser settings, fiber laser parameters, AEJaCA",
      ogAlt: "AEJaCA sTuDiO Tools, laser parameters and calculator",
    },
    de: {
      title: "sTuDiO-Tools, Laserparameter & Kalkulator, AEJaCA",
      description: "Kostenlose Tools für Maker. Interaktive Laserparameter-Tabelle für CO₂, Fiber, Dioden-, UV-Laser. sTuDiO-Projektkalkulator.",
      keywords: "Laserparameter Tabelle, Laser Kalkulator, CO2 Laser Einstellungen, Fiber Laser Parameter, AEJaCA",
      ogAlt: "AEJaCA sTuDiO-Tools, Laserparameter und Kalkulator",
    },
  },

  about: {
    pl: {
      title: "O AEJaCA, Rzemiosło i technologia od 2023 roku",
      description: "AEJaCA to marka łącząca rzemiosło jubilerskie z technologią. Artur Hebenstreit, doświadczenie od 2023 roku, 150+ projektów, ocena 5.0 na Google.",
      keywords: "o AEJaCA, Artur Hebenstreit, biżuteria ręcznie robiona, druk 3D, laser, Bambu Lab H2D, xTool P2, Raycus fiber",
      ogAlt: "Warsztat AEJaCA, biżuteria i studio fabrykacji cyfrowej",
    },
    en: {
      title: "About AEJaCA, Craft and technology for 3+ years",
      description: "AEJaCA combines jewelry craft with technology. Artur Hebenstreit, experience since 2023, 150+ projects, 5.0 rating on Google.",
      keywords: "about AEJaCA, Artur Hebenstreit, handmade jewelry, 3D printing, laser engraving, Bambu Lab H2D, xTool P2, Raycus fiber",
      ogAlt: "AEJaCA workshop, jewelry and digital fabrication studio",
    },
    de: {
      title: "Über AEJaCA, Handwerk und Technologie seit 3+ Jahren",
      description: "AEJaCA verbindet Schmuckhandwerk mit Technologie. Artur Hebenstreit, Erfahrung seit 2023, 150+ Projekte, 5,0 auf Google.",
      keywords: "über AEJaCA, Artur Hebenstreit, handgefertigter Schmuck, 3D-Druck, Lasergravur, Bambu Lab H2D, xTool P2, Raycus Faser",
      ogAlt: "AEJaCA Werkstatt, Schmuck und digitale Fertigung",
    },
  },

  warranty: {
    pl: {
      title: "Gwarancja 24 miesiące, AEJaCA",
      description: "Gwarancja AEJaCA: 24 miesiące na wady produkcyjne, bezpłatny serwis w pierwszym roku, reklamacja w 14 dni roboczych.",
      keywords: "gwarancja biżuteria, reklamacja AEJaCA, serwis biżuterii, wady produkcyjne",
      ogAlt: "Gwarancja AEJaCA, 24 miesiące",
    },
    en: {
      title: "24-Month Warranty, AEJaCA",
      description: "AEJaCA warranty: 24 months on manufacturing defects, complimentary first-year service, claims handled within 14 business days.",
      keywords: "jewelry warranty, AEJaCA claim, jewelry service, manufacturing defects",
      ogAlt: "AEJaCA 24-month warranty",
    },
    de: {
      title: "24 Monate Garantie, AEJaCA",
      description: "AEJaCA Garantie: 24 Monate auf Herstellungsfehler, kostenloser Service im ersten Jahr, Bearbeitung innerhalb von 14 Werktagen.",
      keywords: "Schmuck Garantie, AEJaCA Reklamation, Schmuckservice, Herstellungsfehler",
      ogAlt: "AEJaCA 24 Monate Garantie",
    },
  },

  returns: {
    pl: {
      title: "Zwroty i wymiany, AEJaCA",
      description: "Polityka zwrotów AEJaCA: 14-dniowe prawo odstąpienia dla produktów niespersonalizowanych. Biżuteria na zamówienie wyłączona.",
      keywords: "zwrot biżuteria, polityka zwrotów AEJaCA, prawo odstąpienia, wymiana produktów",
      ogAlt: "Polityka zwrotów AEJaCA",
    },
    en: {
      title: "Returns & Exchanges, AEJaCA",
      description: "AEJaCA return policy: 14-day withdrawal right for non-personalized products. Custom jewelry orders are excluded from returns.",
      keywords: "return policy jewelry, AEJaCA returns, right of withdrawal, product exchange",
      ogAlt: "AEJaCA returns and exchanges policy",
    },
    de: {
      title: "Rückgabe & Umtausch, AEJaCA",
      description: "AEJaCA Rückgabebedingungen: 14-tägiges Widerrufsrecht für nicht personalisierte Produkte. Individuelle Bestellungen ausgeschlossen.",
      keywords: "Rückgabe Schmuck, AEJaCA Rückgabebedingungen, Widerrufsrecht, Produktumtausch",
      ogAlt: "AEJaCA Rückgabe- und Umtauschrichtlinien",
    },
  },

  shipping: {
    pl: {
      title: "Wysyłka i dostawa, AEJaCA",
      description: "Koszty i czasy dostawy AEJaCA: kurier InPost, paczkomat, odbiór osobisty. Darmowa wysyłka od 400 zł. Europa i świat na zamówienie.",
      keywords: "wysyłka biżuteria, koszty dostawy AEJaCA, InPost, czas realizacji, darmowa wysyłka",
      ogAlt: "Wysyłka i dostawa AEJaCA",
    },
    en: {
      title: "Shipping & Delivery, AEJaCA",
      description: "AEJaCA shipping: InPost courier, parcel locker, personal pickup. Free shipping over 400 PLN. Europe & worldwide on request.",
      keywords: "jewelry shipping, AEJaCA delivery, InPost, fulfillment time, free shipping Poland",
      ogAlt: "AEJaCA shipping and delivery",
    },
    de: {
      title: "Versand & Lieferung, AEJaCA",
      description: "AEJaCA Versand: InPost Kurier, Paketautomat, persönliche Abholung. Kostenloser Versand ab 400 PLN. Europa & weltweit auf Anfrage.",
      keywords: "Schmuck Versand, AEJaCA Lieferung, InPost, Bearbeitungszeit, kostenloser Versand",
      ogAlt: "AEJaCA Versand und Lieferung",
    },
  },

  reviews: {
    pl: {
      title: "Oceń AEJaCA, Google & Trustpilot | Podziel się opinią",
      description: "Twoja opinia pomaga nam rosnąć. Zostaw recenzję na Google lub Trustpilot, zajmie to minutę.",
      keywords: "opinie AEJaCA, recenzja Google, Trustpilot AEJaCA",
      ogAlt: "Oceń AEJaCA na Google i Trustpilot",
    },
    en: {
      title: "Review AEJaCA, Google & Trustpilot | Share Your Experience",
      description: "Your review helps us grow. Leave feedback on Google or Trustpilot, it takes just a minute.",
      keywords: "AEJaCA reviews, Google review, Trustpilot AEJaCA",
      ogAlt: "Review AEJaCA on Google and Trustpilot",
    },
    de: {
      title: "AEJaCA bewerten, Google & Trustpilot | Ihre Meinung",
      description: "Ihre Bewertung hilft uns zu wachsen. Hinterlassen Sie eine Rezension auf Google oder Trustpilot.",
      keywords: "AEJaCA Bewertungen, Google Bewertung, Trustpilot AEJaCA",
      ogAlt: "AEJaCA auf Google und Trustpilot bewerten",
    },
  },

  privacy: {
    pl: {
      title: "Polityka prywatności, AEJaCA",
      description: "Polityka prywatności AEJaCA, dane osobowe, RODO, pliki cookies. Dowiedz się, jak chronimy Twoje dane przy zamówieniach i kontaktach.",
      keywords: "polityka prywatności, RODO, dane osobowe, cookies, AEJaCA",
      ogAlt: "Polityka prywatności AEJaCA",
    },
    en: {
      title: "Privacy Policy, AEJaCA",
      description: "AEJaCA privacy policy, personal data, GDPR, cookies. Learn how we protect your information when you order or contact us.",
      keywords: "privacy policy, GDPR, personal data, cookies, AEJaCA",
      ogAlt: "AEJaCA privacy policy",
    },
    de: {
      title: "Datenschutz, AEJaCA",
      description: "AEJaCA Datenschutzerklärung, persönliche Daten, DSGVO, Cookies. Erfahren Sie, wie wir Ihre Daten bei Bestellungen und Anfragen schützen.",
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
