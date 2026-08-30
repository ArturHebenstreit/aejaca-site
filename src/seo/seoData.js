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
  // Kody dla `hreflang`. Swiadomie BEZ regionu: `en` zamiast `en-US` i `de`
  // zamiast `de-DE`. Regionu tu nie chcemy, bo wysylamy do calej Unii i dalej,
  // a `de-DE` powiedzialoby wyszukiwarce, ze wersja niemiecka jest dla Niemiec,
  // nie dla Austrii i Szwajcarii.
  hreflang: {
    pl: "pl",
    en: "en",
    de: "de",
  },
};

// Pages × languages, keep titles ≤ 60 chars, descriptions ≤ 155 chars
export const SEO = {
  // Wersja robocza, strona niesie `noindex` i nie jest nigdzie linkowana.
  // Wpis istnieje, bo `SEOHead` go wymaga, a nie dlatego, ze chcemy
  // te strone indeksowac.
  ringConfigurator: {
    pl: {
      title: "Kreator pierścionków - wersja robocza | AEJaCA",
      description: "Narzędzie w budowie. Pierścionek składany z parametrów, z podglądem 3D.",
      keywords: "kreator pierścionków, konfigurator biżuterii, AEJaCA",
      ogAlt: "Kreator pierścionków AEJaCA, wersja robocza",
    },
    en: {
      title: "Ring configurator - draft | AEJaCA",
      description: "Tool under construction. A ring built from parameters, with a 3D preview.",
      keywords: "ring configurator, jewelry configurator, AEJaCA",
      ogAlt: "AEJaCA ring configurator, draft",
    },
    de: {
      title: "Ring-Konfigurator - Entwurf | AEJaCA",
      description: "Werkzeug im Aufbau. Ein Ring aus Parametern, mit 3D-Vorschau.",
      keywords: "Ring-Konfigurator, Schmuckkonfigurator, AEJaCA",
      ogAlt: "AEJaCA Ring-Konfigurator, Entwurf",
    },
  },

  home: {
    pl: {
      title: "AEJaCA - Biżuteria Artystyczna & sTuDiO Fabrykacji Cyfrowej",
      description: "Dwie marki, jedno studio. AEJaCA Biżuteria: srebro, złoto, kamienie szlachetne, żywica epoksydowa. AEJaCA sTuDiO: druk 3D, grawer CO2 & Fiber.",
      keywords: "biżuteria ręcznie robiona, srebro, złoto, kamienie szlachetne, żywica epoksydowa, druk 3D, materiały inżynierskie, grawerowanie laserowe CO2, Fiber laser, modelowanie 3D, Rhino, Fusion 360, AEJaCA",
      ogAlt: "AEJaCA Biżuteria i sTuDiO - dwie marki, jedno studio rzemiosła",
    },
    en: {
      title: "AEJaCA - Handcrafted Jewelry & Digital Fabrication Studio",
      description: "Two brands, one studio. AEJaCA Jewelry: silver, gold, natural gemstones, epoxy resin. AEJaCA sTuDiO: 3D printing, CO2 & Fiber laser engraving.",
      keywords: "handmade jewelry, silver, gold, natural gemstones, epoxy resin, 3D printing, engineering materials, CO2 laser engraving, Fiber laser, 3D modeling, Rhino, Fusion 360, AEJaCA",
      ogAlt: "AEJaCA Jewelry and sTuDiO - two brands, one craft studio",
    },
    de: {
      title: "AEJaCA - Handgefertigter Schmuck & digitale Fertigung",
      description: "Zwei Marken, ein Studio. AEJaCA Schmuck: Silber, Gold, Edelsteine, Epoxidharz. AEJaCA sTuDiO: 3D-Druck, CO2- & Fiber-Lasergravur.",
      keywords: "handgefertigter Schmuck, Silber, Gold, Edelsteine, Epoxidharz, 3D-Druck, Ingenieurswerkstoffe, CO2-Lasergravur, Fiber-Laser, 3D-Modellierung, Rhino, Fusion 360, AEJaCA",
      ogAlt: "AEJaCA Schmuck und sTuDiO - zwei Marken, ein Handwerksstudio",
    },
  },

  jewelry: {
    pl: {
      title: "AEJaCA Biżuteria, Ręcznie Robione Srebro, Złoto, Kamienie",
      description: "Biżuteria na zamówienie: pierścionki zaręczynowe, kolczyki, wisiorki ze srebra 925 i złota 14k/18k z kamieniami. Natychmiastowy kalkulator online.",
      keywords: "pierścionek zaręczynowy na zamówienie, kalkulator biżuterii online, biżuteria srebrna, modelowanie 3D biżuterii, Rhino, Fusion 360, pierścionki z kamieniami, kolczyki, bransoletki, biżuteria na zamówienie, personalizowana biżuteria, kamienie szlachetne, diament, rubin, szafir, szmaragd",
      ogAlt: "Ręcznie robione pierścionki i biżuteria AEJaCA",
    },
    en: {
      title: "AEJaCA Jewelry, Handmade Silver, Gold & Gemstone Pieces",
      description: "Custom engagement rings, earrings, pendants in silver 925 & gold 14k/18k with natural gemstones. Instant online jewelry price calculator.",
      keywords: "engagement rings online, custom jewelry calculator, silver jewelry, 3D jewelry modeling, Rhino, Fusion 360, gemstone rings, earrings, bracelets, personalized jewelry, custom jewelry design, handmade pendants, natural gemstones, diamond, ruby, sapphire, emerald",
      ogAlt: "AEJaCA handmade rings and jewelry pieces",
    },
    de: {
      title: "AEJaCA Schmuck, Handgefertigte Ringe, Ohrringe, Anhänger",
      description: "Individuelle Verlobungsringe, Ohrringe, Anhänger aus Silber 925 & Gold 14k/18k mit Edelsteinen. Sofort-Preisrechner für Schmuck online.",
      keywords: "Verlobungsring auf Bestellung, Schmuck-Preisrechner online, Silberschmuck, 3D-Schmuckmodellierung, Rhino, Fusion 360, Ringe mit Edelsteinen, Ohrringe, Armbänder, personalisierter Schmuck, individuelles Schmuckdesign, Edelsteine, Diamant, Rubin, Saphir, Smaragd",
      ogAlt: "AEJaCA handgefertigte Ringe und Schmuckstücke",
    },
  },

  studio: {
    pl: {
      title: "AEJaCA sTuDiO, Druk 3D, Laser, Modelowanie 3D, Odlewy",
      description: "Wycena druku 3D z pliku STL, laser CO2 i Fiber, odlewy żywiczne oraz odlew w srebrze i złocie z modelu 3D. Modelowanie w Rhino i Fusion 360, małe serie.",
      keywords: "kalkulator wyceny druku 3D online, wycena STL online, druk 3D na zamówienie, materiały inżynierskie, PETG, ASA, PA6, PC, PEEK, TPU, druk 3D funkcjonalny, grawerowanie laserowe, laser CO2, Fiber laser, odlewy żywiczne, odlew srebra, odlew złota, odlew z modelu 3D, modelowanie 3D, Rhino 3D, Fusion 360, projekt 3D na zamówienie, prototypowanie, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO, druk 3D, laser, modelowanie 3D i odlewy żywiczne",
    },
    en: {
      title: "AEJaCA sTuDiO, 3D Printing, Laser Engraving & 3D Modeling",
      description: "3D printing quote from your STL, CO2 and Fiber laser engraving, resin casting and silver or gold casting from a 3D model. Modelling in Rhino and Fusion 360.",
      keywords: "3D printing cost calculator online, STL upload instant quote, laser engraving price, engineering materials, PETG, ASA, PA6, PC, PEEK, TPU, functional 3D printing, fiber laser, CO2 laser, resin casting, silver casting, gold casting, casting from 3d model, 3D modeling, Rhino 3D, Fusion 360, custom 3D design, prototyping, Bambu Lab H2D",
      ogAlt: "AEJaCA sTuDiO, 3D printing, laser engraving and 3D modeling",
    },
    de: {
      title: "AEJaCA sTuDiO, 3D-Druck, Lasergravur, 3D-Modellierung",
      description: "3D-Druck Preisrechner nach STL, CO2- und Fiber-Lasergravur, Harzguss sowie Silber- und Goldguss nach 3D-Modell. Modellierung in Rhino und Fusion 360.",
      keywords: "3D-Druck Preisrechner online, STL Sofort-Angebot, Lasergravur Preis, Ingenieurswerkstoffe, PETG, ASA, PA6, PC, PEEK, TPU, technischer 3D-Druck, Faserlaser, CO2-Laser, Harzguss, Silberguss, Goldguss, Guss nach 3D-Modell, 3D-Modellierung, Rhino 3D, Fusion 360, 3D-Design auf Bestellung, Prototyping, Bambu Lab H2D",
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

  // --- Strony lokalne (druk 3D) ---
  // Tytuł zaczyna się od frazy, nie od marki. Marka jest dopisana na końcu,
  // bo nikt nie szuka "AEJaCA sTuDiO", a pierwsze słowa tytułu ważą najwięcej.
  druk3dPiaseczno: {
    pl: {
      title: "Druk 3D Piaseczno, wydruki na zamówienie i odbiór osobisty",
      description: "Druk 3D w Piasecznie i okolicy. FDM i żywica 16K, wydruk z pliku STL lub modelowanie od zera. Odbiór osobisty w Józefosławiu, od 49 zł.",
      keywords: "druk 3d piaseczno, wydruk 3d piaseczno, drukarnia 3d piaseczno, druk 3d józefosław, modelowanie 3d piaseczno",
      ogAlt: "Druk 3D Piaseczno, pracownia AEJaCA sTuDiO",
    },
    en: {
      title: "3D Printing in Piaseczno, custom prints, local pickup",
      description: "3D printing in Piaseczno and the surrounding area. FDM and 16K resin, printing from your STL or modelling from scratch. Collection in Józefosław, from 49 PLN.",
      keywords: "3d printing piaseczno, 3d print service piaseczno, 3d printing warsaw area, 3d modelling piaseczno",
      ogAlt: "3D printing in Piaseczno, AEJaCA sTuDiO workshop",
    },
    de: {
      title: "3D-Druck Piaseczno, Einzelanfertigung mit Abholung vor Ort",
      description: "3D-Druck in Piaseczno und Umgebung. FDM und 16K-Harz, Druck aus Ihrer STL-Datei oder Modellierung von Grund auf. Abholung in Józefosław, ab 49 PLN.",
      keywords: "3d druck piaseczno, 3d druckservice piaseczno, 3d modellierung piaseczno",
      ogAlt: "3D-Druck Piaseczno, Werkstatt AEJaCA sTuDiO",
    },
  },

  druk3dWarszawa: {
    pl: {
      title: "Druk 3D Warszawa, wycena z pliku STL, wysyłka w 24 h",
      description: "Druk 3D na zamówienie dla Warszawy. FDM i żywica 16K, prototypy, makiety, części zamienne i wzorce odlewnicze. Od jednej sztuki, od 49 zł.",
      keywords: "druk 3d warszawa, wydruk 3d warszawa, drukarnia 3d warszawa, prototypy 3d warszawa, druk 3d na zamówienie",
      ogAlt: "Druk 3D Warszawa, pracownia AEJaCA sTuDiO",
    },
    en: {
      title: "3D Printing in Warsaw, STL quote, next-day dispatch",
      description: "Custom 3D printing for Warsaw. FDM and 16K resin, prototypes, architectural models, spare parts and casting patterns. From one piece, from 49 PLN.",
      keywords: "3d printing warsaw, 3d print service warsaw, rapid prototyping warsaw, resin printing warsaw",
      ogAlt: "3D printing in Warsaw, AEJaCA sTuDiO workshop",
    },
    de: {
      title: "3D-Druck Warschau, Angebot aus STL, Versand am Folgetag",
      description: "3D-Druck nach Maß für Warschau. FDM und 16K-Harz, Prototypen, Architekturmodelle, Ersatzteile und Gussmodelle. Ab einem Stück, ab 49 PLN.",
      keywords: "3d druck warschau, 3d druckservice warschau, prototypen warschau, harzdruck warschau",
      ogAlt: "3D-Druck Warschau, Werkstatt AEJaCA sTuDiO",
    },
  },

  about: {
    pl: {
      title: "O AEJaCA, Rzemiosło i technologia od 2023 roku",
      description: "AEJaCA łączy rzemiosło jubilerskie z modelowaniem 3D (Rhino, Fusion 360) i fabrykacją cyfrową. Artur Hebenstreit, od 2023 roku, 150+ projektów, 5.0 Google.",
      keywords: "o AEJaCA, Artur Hebenstreit, biżuteria ręcznie robiona, modelowanie 3D, Rhino, Fusion 360, druk 3D, laser, Bambu Lab H2D, xTool P2, Raycus fiber",
      ogAlt: "Warsztat AEJaCA, biżuteria i studio fabrykacji cyfrowej",
    },
    en: {
      title: "About AEJaCA, Craft and technology for 3+ years",
      description: "AEJaCA combines jewelry craft with 3D modeling (Rhino, Fusion 360) and digital fabrication. Artur Hebenstreit, since 2023, 150+ projects, 5.0 Google.",
      keywords: "about AEJaCA, Artur Hebenstreit, handmade jewelry, 3D modeling, Rhino, Fusion 360, 3D printing, laser engraving, Bambu Lab H2D, xTool P2, Raycus fiber",
      ogAlt: "AEJaCA workshop, jewelry and digital fabrication studio",
    },
    de: {
      title: "Über AEJaCA, Handwerk und Technologie seit 3+ Jahren",
      description: "AEJaCA verbindet Schmuckhandwerk mit 3D-Modellierung (Rhino, Fusion 360) und digitaler Fertigung. Artur Hebenstreit, seit 2023, 150+ Projekte, 5,0 Google.",
      keywords: "über AEJaCA, Artur Hebenstreit, handgefertigter Schmuck, 3D-Modellierung, Rhino, Fusion 360, 3D-Druck, Lasergravur, Bambu Lab H2D, xTool P2, Raycus Faser",
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

  shop: {
    pl: { title: "Produkty i usługi, AEJaCA", description: "Gotowe wyroby jubilerskie, produkty sTuDiO i modele do pobrania, a obok usługi wyceniane online: druk 3D, grawer laserowy, odlewy żywiczne, renowacja biżuterii.", keywords: "sklep aejaca, biżuteria online, druk 3d sklep, modele stl do pobrania", ogAlt: "Sklep AEJaCA" },
    en: { title: "Products and services, AEJaCA", description: "Ready-made jewelry, sTuDiO products and downloadable models, alongside services quoted online: 3D printing, laser engraving, resin casting, jewelry renovation.", keywords: "aejaca shop, handmade jewelry, 3d printing shop, stl models", ogAlt: "AEJaCA shop" },
    de: { title: "Produkte und Leistungen, AEJaCA", description: "Fertiger Schmuck, sTuDiO-Produkte und Modelle zum Download, dazu online kalkulierte Leistungen: 3D-Druck, Lasergravur, Harzguss, Schmuckaufarbeitung.", keywords: "aejaca shop, handgefertigter schmuck, 3d druck shop, stl modelle", ogAlt: "AEJaCA Shop" },
  },
  shop_jewelry: {
    pl: { title: "Biżuteria: produkty i usługi, AEJaCA", description: "Wyroby gotowe ze złota i srebra oraz usługi jubilerskie: renowacja, naprawa, łańcuszki w trzynastu splotach, biżuteria na zamówienie i wyroby z kamieniami.", keywords: "biżuteria ręcznie robiona, renowacja biżuterii, naprawa biżuterii, pierścionek na zamówienie", ogAlt: "Biżuteria AEJaCA" },
    en: { title: "Jewelry: products and services, AEJaCA", description: "Ready-made gold and silver pieces plus jewelry services: renovation, repair, chains in thirteen weaves, made-to-order work and pieces with stones.", keywords: "handmade jewelry, jewelry renovation, jewelry repair, custom ring", ogAlt: "AEJaCA jewelry" },
    de: { title: "Schmuck: Produkte und Leistungen, AEJaCA", description: "Fertige Stücke aus Gold und Silber sowie Schmuckleistungen: Aufarbeitung, Reparatur, Ketten in dreizehn Geflechten, Anfertigung nach Maß und Stücke mit Steinen.", keywords: "handgefertigter schmuck, schmuckaufarbeitung, schmuckreparatur, ring nach maß", ogAlt: "AEJaCA Schmuck" },
  },
  shop_studio: {
    pl: { title: "sTuDiO: produkty i usługi, AEJaCA", description: "Druk 3D z filamentu i żywicy, grawer i cięcie laserem oraz odlewy ze srebra i złota z wzorca, modelu 3D albo samego pomysłu. Wiążąca cena z wgranego pliku.", keywords: "druk 3d na zamówienie, odlew srebra, odlew złota, odlew z modelu 3d", ogAlt: "AEJaCA sTuDiO" },
    en: { title: "sTuDiO: products and services, AEJaCA", description: "Filament and resin 3D printing, laser engraving and cutting, silver or gold casting from a pattern, a 3D model or just an idea. Binding price from your file.", keywords: "custom 3d printing, silver casting, gold casting, casting from 3d model", ogAlt: "AEJaCA sTuDiO" },
    de: { title: "sTuDiO: Produkte und Leistungen, AEJaCA", description: "3D-Druck aus Filament und Harz, Lasergravur und -schnitt sowie Silber- und Goldguss nach Modell, 3D-Datei oder bloßer Idee. Verbindlicher Preis aus Ihrer Datei.", keywords: "3d druck nach maß, silberguss, goldguss, guss nach 3d modell", ogAlt: "AEJaCA sTuDiO" },
  },
  cart: {
    pl: { title: "Koszyk, AEJaCA", description: "Twój koszyk w sklepie AEJaCA.", keywords: "koszyk", ogAlt: "Koszyk AEJaCA" },
    en: { title: "Cart, AEJaCA", description: "Your cart in the AEJaCA shop.", keywords: "cart", ogAlt: "AEJaCA cart" },
    de: { title: "Warenkorb, AEJaCA", description: "Ihr Warenkorb im AEJaCA-Shop.", keywords: "warenkorb", ogAlt: "AEJaCA Warenkorb" },
  },
  checkout: {
    pl: { title: "Zamówienie, AEJaCA", description: "Finalizacja zamówienia w sklepie AEJaCA.", keywords: "zamówienie", ogAlt: "Zamówienie AEJaCA" },
    en: { title: "Order, AEJaCA", description: "Completing your order in the AEJaCA shop.", keywords: "order", ogAlt: "AEJaCA order" },
    de: { title: "Bestellung, AEJaCA", description: "Bestellabschluss im AEJaCA-Shop.", keywords: "bestellung", ogAlt: "AEJaCA Bestellung" },
  },
  service: {
    pl: { title: "Usługa, AEJaCA", description: "Szczegóły usługi w AEJaCA.", keywords: "usługa aejaca", ogAlt: "Usługa AEJaCA" },
    en: { title: "Service, AEJaCA", description: "Service details at AEJaCA.", keywords: "aejaca service", ogAlt: "AEJaCA service" },
    de: { title: "Leistung, AEJaCA", description: "Details zur Leistung bei AEJaCA.", keywords: "aejaca leistung", ogAlt: "AEJaCA Leistung" },
  },
  product: {
    pl: { title: "Produkt, AEJaCA", description: "Szczegóły produktu w sklepie AEJaCA.", keywords: "produkt aejaca", ogAlt: "Produkt AEJaCA" },
    en: { title: "Product, AEJaCA", description: "Product details in the AEJaCA shop.", keywords: "aejaca product", ogAlt: "AEJaCA product" },
    de: { title: "Produkt, AEJaCA", description: "Produktdetails im AEJaCA-Shop.", keywords: "aejaca produkt", ogAlt: "AEJaCA Produkt" },
  },
  order: {
    pl: {
      title: "Zamów online, druk 3D, grawer i biżuteria, AEJaCA",
      description: "Wyceń i zamów w kilka minut. Wgraj plik STL, poznaj wiążącą cenę i zapłać BLIK-iem. Druk 3D, grawer laserowy, odlewy, renowacja biżuterii.",
      keywords: "zamów druk 3d online, wycena stl online, druk 3d na zamówienie, grawer laserowy zamówienie, płatność blik",
      ogAlt: "Kreator zamówień AEJaCA",
    },
    en: {
      title: "Order online, 3D printing, engraving and jewelry, AEJaCA",
      description: "Quote and order in minutes. Upload an STL, get a binding price and pay by BLIK or instant transfer. 3D printing, engraving, casting, jewelry repair.",
      keywords: "order 3d printing online, stl instant quote, custom 3d print, laser engraving order",
      ogAlt: "AEJaCA order wizard",
    },
    de: {
      title: "Online bestellen, 3D-Druck, Gravur und Schmuck, AEJaCA",
      description: "In Minuten kalkulieren und bestellen. STL hochladen, verbindlichen Preis erhalten, per BLIK oder Sofortüberweisung zahlen. 3D-Druck, Gravur, Guss.",
      keywords: "3d druck online bestellen, stl sofortangebot, lasergravur bestellen",
      ogAlt: "AEJaCA Bestellassistent",
    },
  },
  orderStatus: {
    pl: { title: "Status zamówienia, AEJaCA", description: "Status Twojego zamówienia i płatności w AEJaCA.", keywords: "status zamówienia", ogAlt: "Status zamówienia AEJaCA" },
    en: { title: "Order status, AEJaCA", description: "The status of your AEJaCA order and payment.", keywords: "order status", ogAlt: "AEJaCA order status" },
    de: { title: "Bestellstatus, AEJaCA", description: "Der Status Ihrer AEJaCA-Bestellung und Zahlung.", keywords: "bestellstatus", ogAlt: "AEJaCA Bestellstatus" },
  },
  // Strona prywatna, dostepna wylacznie z tokenem w adresie. Opis istnieje
  // dla porzadku, bo strona jest `noindex` i nigdy nie trafi do wynikow.
  quote: {
    pl: { title: "Twoja wycena, AEJaCA", description: "Wycena zapisana w kalkulatorze AEJaCA.", keywords: "wycena", ogAlt: "Zapisana wycena AEJaCA" },
    en: { title: "Your quote, AEJaCA", description: "A quote saved in the AEJaCA calculator.", keywords: "quote", ogAlt: "Saved AEJaCA quote" },
    de: { title: "Ihr Angebot, AEJaCA", description: "Ein im AEJaCA-Rechner gespeichertes Angebot.", keywords: "angebot", ogAlt: "Gespeichertes AEJaCA-Angebot" },
  },
  // Strona oferty: wchodzi sie na nia z linku albo z numeru wyceny. Nie ma
  // do niej odnosnika z menu i nie ma czego indeksowac, bo bez numeru pokazuje
  // sam formularz.
  offer: {
    pl: {
      title: "Zapłać za ofertę, AEJaCA",
      description: "Masz od nas ofertę? Podaj jej numer, sprawdź kwotę, wpisz kod rabatowy i zapłać. Numer oferty dostajesz od nas mailem albo w rozmowie.",
      keywords: "zapłać za ofertę AEJaCA, numer oferty, płatność za wycenę, WY numer oferty",
      ogAlt: "Zapłata za ofertę AEJaCA",
    },
    en: {
      title: "Pay for your offer, AEJaCA",
      description: "Have an offer from us? Enter its number, check the amount, add a discount code and pay. We give you the offer number by e-mail or on the phone.",
      keywords: "pay AEJaCA offer, offer number, paying a quote, WY offer number",
      ogAlt: "Paying an AEJaCA offer",
    },
    de: {
      title: "Angebot bezahlen, AEJaCA",
      description: "Sie haben ein Angebot von uns? Nummer eingeben, Betrag prüfen, Rabattcode eintragen und zahlen. Die Nummer erhalten Sie per E-Mail oder im Gespräch.",
      keywords: "AEJaCA Angebot bezahlen, Angebotsnummer, Kostenvoranschlag bezahlen",
      ogAlt: "AEJaCA Angebot bezahlen",
    },
  },
  terms: {
    pl: {
      title: "Regulamin serwisu i sprzedaży, AEJaCA",
      description: "Regulamin AEJaCA: zawarcie umowy, ceny i płatności, terminy realizacji, prawo odstąpienia, reklamacje, prawa do plików i tolerancje wykonania.",
      keywords: "regulamin AEJaCA, warunki sprzedaży, prawo odstąpienia, reklamacje, druk 3D regulamin",
      ogAlt: "Regulamin serwisu AEJaCA",
    },
    en: {
      title: "Terms of Service and Sale, AEJaCA",
      description: "AEJaCA terms: contract conclusion, prices and payment, lead times, right of withdrawal, complaints, file rights and manufacturing tolerances.",
      keywords: "AEJaCA terms, terms of sale, right of withdrawal, complaints, 3D printing terms",
      ogAlt: "AEJaCA terms of service and sale",
    },
    de: {
      title: "Allgemeine Geschäftsbedingungen, AEJaCA",
      description: "AEJaCA AGB: Vertragsschluss, Preise und Zahlung, Lieferzeiten, Widerrufsrecht, Reklamationen, Dateirechte und Fertigungstoleranzen.",
      keywords: "AEJaCA AGB, Verkaufsbedingungen, Widerrufsrecht, Reklamation, 3D-Druck AGB",
      ogAlt: "AEJaCA Allgemeine Geschäftsbedingungen",
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

  payments: {
    pl: {
      title: "Proces płatności, AEJaCA",
      description: "Jak płacisz w AEJaCA krok po kroku: zakup w sklepie, zapłata za ofertę z numerem, metody, waluta, terminy i co dzieje się po zapłacie.",
      keywords: "proces płatności AEJaCA, BLIK, przelew online, numer oferty, kod rabatowy, płatność za wycenę",
      ogAlt: "Proces płatności w AEJaCA",
    },
    en: {
      title: "How payment works, AEJaCA",
      description: "Paying AEJaCA step by step: buying in the shop, paying for an offer by its number, methods, currency, deadlines and what happens after payment.",
      keywords: "AEJaCA payment process, BLIK, instant transfer, offer number, discount code, paying a quote",
      ogAlt: "How payment works at AEJaCA",
    },
    de: {
      title: "Zahlungsablauf, AEJaCA",
      description: "Bezahlen bei AEJaCA Schritt für Schritt: Kauf im Shop, Zahlung für ein Angebot mit Nummer, Methoden, Währung, Fristen und was nach der Zahlung passiert.",
      keywords: "AEJaCA Zahlungsablauf, BLIK, Sofortüberweisung, Angebotsnummer, Rabattcode, Angebot bezahlen",
      ogAlt: "Zahlungsablauf bei AEJaCA",
    },
  },
  orderProcess: {
    pl: {
      title: "Proces realizacji, AEJaCA",
      description: "Co dzieje się po zapłacie w AEJaCA: ustalenia szczegółów, liczenie terminu, praca w pracowni, gotowe do wysyłki i odbiór zamówienia.",
      keywords: "proces realizacji AEJaCA, termin realizacji, status zamówienia, ustalenia szczegółów, odbiór zamówienia",
      ogAlt: "Proces realizacji zamówienia w AEJaCA",
    },
    en: {
      title: "How we make your order, AEJaCA",
      description: "What happens after payment at AEJaCA: settling details, when the clock starts, work in the workshop, ready to ship and collecting your order.",
      keywords: "AEJaCA order process, lead time, order status, settling details, order collection",
      ogAlt: "How an AEJaCA order is made",
    },
    de: {
      title: "Ablauf der Fertigung, AEJaCA",
      description: "Was nach der Zahlung bei AEJaCA passiert: Details klären, Frist zählen, Arbeit in der Werkstatt, versandfertig und Abholung der Bestellung.",
      keywords: "AEJaCA Fertigungsablauf, Lieferfrist, Bestellstatus, Details klären, Bestellung abholen",
      ogAlt: "Ablauf einer AEJaCA Bestellung",
    },
  },
  faq: {
    pl: {
      title: "Najczęściej zadawane pytania, AEJaCA",
      description: "Odpowiedzi na pytania o płatność, ofertę, realizację i dostawę w AEJaCA. Wyszukiwarka treści i filtry tematyczne w jednym miejscu.",
      keywords: "FAQ AEJaCA, pytania i odpowiedzi, płatność, oferta, termin realizacji, dostawa",
      ogAlt: "Najczęściej zadawane pytania AEJaCA",
    },
    en: {
      title: "Frequently asked questions, AEJaCA",
      description: "Answers about payment, offers, order progress and delivery at AEJaCA. Search the answers and filter them by topic, all in one place.",
      keywords: "AEJaCA FAQ, questions and answers, payment, offer, lead time, delivery",
      ogAlt: "AEJaCA frequently asked questions",
    },
    de: {
      title: "Häufige Fragen, AEJaCA",
      description: "Antworten zu Zahlung, Angebot, Fertigung und Lieferung bei AEJaCA. Volltextsuche und Themenfilter an einer einzigen Stelle.",
      keywords: "AEJaCA FAQ, Fragen und Antworten, Zahlung, Angebot, Lieferfrist, Versand",
      ogAlt: "Häufige Fragen zu AEJaCA",
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
      description: "Podziel się opinią o AEJaCA: biżuterii na zamówienie i usługach sTuDiO. Recenzja na Google lub Trustpilot zajmuje minutę i pomaga innym klientom.",
      keywords: "opinie AEJaCA, recenzja Google, Trustpilot AEJaCA",
      ogAlt: "Oceń AEJaCA na Google i Trustpilot",
    },
    en: {
      title: "Review AEJaCA, Google & Trustpilot | Share Your Experience",
      description: "Share your experience with AEJaCA custom jewelry and sTuDiO fabrication. A Google or Trustpilot review takes a minute and helps other customers decide.",
      keywords: "AEJaCA reviews, Google review, Trustpilot AEJaCA",
      ogAlt: "Review AEJaCA on Google and Trustpilot",
    },
    de: {
      title: "AEJaCA bewerten, Google & Trustpilot | Ihre Meinung",
      description: "Teilen Sie Ihre Erfahrung mit AEJaCA Schmuck und sTuDiO-Fertigung. Eine Google- oder Trustpilot-Bewertung dauert eine Minute und hilft anderen Kunden.",
      keywords: "AEJaCA Bewertungen, Google Bewertung, Trustpilot AEJaCA",
      ogAlt: "AEJaCA auf Google und Trustpilot bewerten",
    },
  },

  b2b: {
    pl: {
      title: "Produkcja jubilerska B2B, CAD, wzorce 16K, odlew | AEJaCA",
      description: "Usługi B2B dla marek i pracowni: projektowanie CAD, wzorce castable 16K, odlew Au 585 / Ag 925, wykończenie, cechowanie. Wycena w 24h.",
      keywords: "produkcja jubilerska B2B, CAD biżuteria zlecenie, wzorce castable 16K, odlew srebra na zlecenie, odlew złota na zlecenie, white label biżuteria, wykończenie biżuterii B2B, cechowanie biżuterii, AEJaCA",
      ogAlt: "AEJaCA B2B, produkcja jubilerska dla marek i pracowni partnerskich",
    },
    en: {
      title: "B2B Jewelry Production, CAD, 16K Patterns, Casting | AEJaCA",
      description: "B2B services for jewelry brands and workshops: CAD design, castable 16K patterns, Au 585 / Ag 925 casting, finishing, hallmarking. Quote in 24h.",
      keywords: "B2B jewelry manufacturing, jewelry CAD outsourcing, castable 16K patterns, silver casting service, gold casting service, jewelry white label, jewelry finishing B2B, hallmarking, AEJaCA",
      ogAlt: "AEJaCA B2B, jewelry production for brands and partner workshops",
    },
    de: {
      title: "B2B-Schmuckproduktion, CAD, 16K-Modelle, Guss | AEJaCA",
      description: "B2B-Leistungen für Schmuckmarken und Werkstätten: CAD-Design, Castable-16K-Modelle, Au-585/Ag-925-Guss, Veredelung, Punzierung. Angebot in 24h.",
      keywords: "B2B Schmuckproduktion, Schmuck CAD Auftragsfertigung, Castable 16K Modelle, Silberguss Auftrag, Goldguss Auftrag, Schmuck White Label, Schmuckveredelung B2B, Punzierung, AEJaCA",
      ogAlt: "AEJaCA B2B, Schmuckproduktion für Marken und Partnerwerkstätten",
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
