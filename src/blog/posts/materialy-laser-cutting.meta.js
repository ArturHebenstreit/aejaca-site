export const meta = {
  slug: "materialy-laser-cutting",
  category: "studio",
  accent: "blue",
  publishedAt: "2026-04-20",
  coverImage: "/img/blog/materialy-laser-cutting.webp",
  readingTime: { pl: 7, en: 5, de: 5 },
  title: {
    pl: "Materiały do cięcia laserowego — co się nadaje?",
    en: "Laser Cutting & Engraving Materials — What Works?",
    de: "Laserschnitt- & Gravurmaterialien — Was funktioniert?",
  },
  description: {
    pl: "Przegląd materiałów do lasera CO2 i Fiber: drewno, akryl, skóra, metal, szkło, kamień. Grubości, ograniczenia i ceny w AEJaCA sTuDiO.",
    en: "Overview of CO2 and Fiber laser materials: wood, acrylic, leather, metal, glass, stone. Thicknesses, limitations, and pricing at AEJaCA sTuDiO.",
    de: "Überblick über CO2- und Faserlaser-Materialien: Holz, Acryl, Leder, Metall, Glas, Stein. Stärken, Einschränkungen und Preise im AEJaCA sTuDiO.",
  },
  keywords: {
    pl: "materiały do lasera, cięcie laserowe drewno, grawerowanie metalu, laser CO2 materiały, fiber laser materiały, AEJaCA sTuDiO",
    en: "laser cutting materials, laser engraving wood, metal engraving, CO2 laser materials, fiber laser materials, AEJaCA sTuDiO",
    de: "Laserschnitt Materialien, Lasergravur Holz, Metallgravur, CO2-Laser Materialien, Faserlaser Materialien, AEJaCA sTuDiO",
  },
  toc: {
    pl: [
      { id: "co2", label: "Materiały CO2" },
      { id: "fiber", label: "Materiały Fiber" },
      { id: "nie-nadaje", label: "Czego unikać" },
      { id: "grubosci", label: "Grubości i limity" },
      { id: "cennik", label: "Cennik" },
    ],
    en: [
      { id: "co2", label: "CO2 materials" },
      { id: "fiber", label: "Fiber materials" },
      { id: "avoid", label: "What to avoid" },
      { id: "thickness", label: "Thickness limits" },
      { id: "pricing", label: "Pricing" },
    ],
    de: [
      { id: "co2", label: "CO2-Materialien" },
      { id: "fiber", label: "Faserlaser-Materialien" },
      { id: "vermeiden", label: "Was vermeiden" },
      { id: "staerken", label: "Stärken & Limits" },
      { id: "preise", label: "Preise" },
    ],
  },
  faq: {
    pl: [
      { q: "Czy laser CO2 tnie metal?", a: "Nie. CO2 55W tnie materiały organiczne (drewno, akryl, skóra) do 10mm. Do metalu potrzebny jest fiber laser." },
      { q: "Jaka jest maksymalna grubość cięcia?", a: "Drewno do 10mm, akryl do 12mm, skóra do 4mm. Powyżej tych wartości jakość krawędzi spada." },
      { q: "Czy można grawerować na szkle?", a: "Tak — laser CO2 graweruje na szkle (matowienie), ale go nie tnie. Fiber radzi sobie z ceramiką i kamieniem." },
      { q: "Jakie pliki potrzebuję do cięcia?", a: "Wektorowe: SVG, AI, DXF. Do grawerowania rastrowego: PNG, JPG (min. 300 DPI)." },
    ],
    en: [
      { q: "Can CO2 laser cut metal?", a: "No. CO2 55W cuts organic materials (wood, acrylic, leather) up to 10mm. Metal requires a fiber laser." },
      { q: "What's the maximum cutting thickness?", a: "Wood up to 10mm, acrylic up to 12mm, leather up to 4mm. Beyond these, edge quality drops." },
      { q: "Can you engrave on glass?", a: "Yes — CO2 laser engraves glass (frosting effect) but doesn't cut it. Fiber handles ceramics and stone." },
      { q: "What files do I need for cutting?", a: "Vector: SVG, AI, DXF. For raster engraving: PNG, JPG (min. 300 DPI)." },
    ],
    de: [
      { q: "Kann der CO2-Laser Metall schneiden?", a: "Nein. CO2 55W schneidet organische Materialien (Holz, Acryl, Leder) bis 10mm. Für Metall braucht man einen Faserlaser." },
      { q: "Was ist die maximale Schnittstärke?", a: "Holz bis 10mm, Acryl bis 12mm, Leder bis 4mm. Darüber hinaus nimmt die Kantenqualität ab." },
      { q: "Kann man auf Glas gravieren?", a: "Ja — der CO2-Laser graviert Glas (Mattierungseffekt), schneidet es aber nicht. Faserlaser bearbeitet Keramik und Stein." },
      { q: "Welche Dateien brauche ich zum Schneiden?", a: "Vektor: SVG, AI, DXF. Für Rastergravur: PNG, JPG (min. 300 DPI)." },
    ],
  },
  relatedPosts: ["grawerowanie-laserowe-przewodnik", "druk-3d-krok-po-kroku", "warsztat-od-kuchni"],
  relatedCalculators: [
    { to: "/studio/#laser-params", icon: "📊", label: { pl: "Tabela parametrów laserowania", en: "Laser Parameters Table", de: "Laserparameter-Tabelle" }, desc: { pl: "Orientacyjne ustawienia CO2 i Fiber", en: "Indicative CO2 and Fiber settings", de: "Richtwerte für CO2 und Fiber" } },
    { to: "/studio/#calculator", icon: "⚙️", label: { pl: "Kalkulator sTuDiO", en: "sTuDiO Calculator", de: "sTuDiO-Kalkulator" }, desc: { pl: "Wycena laserowania, druku 3D, odlewów żywicznych", en: "Quote for laser engraving, 3D print, resin casting", de: "Angebot für Laser, 3D-Druck, Harzverguss" } },
  ],
};
