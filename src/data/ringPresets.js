// ============================================================
// PRESETY KREATORA
// ============================================================
// Punkt startowy, nie osobny produkt. Klient, ktory wchodzi na pusty formularz
// z dwunastoma polami, zamyka go. Klient, ktory klika "soliter klasyczny"
// i dopiero potem zmienia metal i rozmiar, konczy konfiguracje.
//
// Kazdy preset to WYLACZNIE zestaw parametrow, ktore i tak da sie ustawic
// recznie. Nie ma tu wlasnej geometrii ani wlasnej ceny, bo osobna sciezka
// dla presetu rozjechalaby sie z reszta przy pierwszej korekcie.
//
// CZEGO TU NIE MA i dlaczego:
//   halo, trylogia, eternity  brak geometrii, doloza sie razem z nia
//   cluster, fantasy          uklady swobodne, to jest projekt indywidualny,
//                             a nie konfiguracja, i idzie sciezka wyceny
//   monogram, odcisk palca    wymagaja wejscia z pliku, to osobna funkcja
//
// Lepiej pokazac osiem pozycji, ktore daja dokladnie to, co obiecuja, niz
// dwanascie, z ktorych cztery udaja cos, czego generator nie zbuduje.

export const RING_PRESETS = [
  {
    id: "solitaire",
    label: { pl: "Soliter klasyczny", en: "Classic solitaire", de: "Klassischer Solitär" },
    note: { pl: "Jeden kamień, cztery łapki, szyna zwężana ku głowicy.",
            en: "One stone, four claws, shank tapering towards the head.",
            de: "Ein Stein, vier Krappen, zur Fassung verjüngte Schiene." },
    params: {
      kind: "ring", profile: "round", taper: "tapered", width: 2.0, thickness: 1.5,
      stone: { cut: "round", size: 6.5 }, setting: "prong4", prongDia: 0.9,
      side: { count: 0 },
    },
  },
  {
    id: "six",
    label: { pl: "Soliter na sześciu łapkach", en: "Six-claw solitaire", de: "Solitär mit sechs Krappen" },
    note: { pl: "Więcej metalu nad rondystą, więc kamień siedzi pewniej.",
            en: "More metal over the girdle, so the stone sits more securely.",
            de: "Mehr Metall über der Rundiste, der Stein sitzt sicherer." },
    params: {
      kind: "ring", profile: "round", taper: "cathedral", width: 1.9, thickness: 1.5,
      stone: { cut: "round", size: 6.5 }, setting: "prong6", prongDia: 0.85,
      side: { count: 0 },
    },
  },
  {
    id: "pave",
    label: { pl: "Soliter z pavé", en: "Pavé solitaire", de: "Pavé-Solitär" },
    note: { pl: "Kamienie na ramionach prowadzą wzrok do głównego.",
            en: "Stones along the shoulders lead the eye to the centre stone.",
            de: "Steine an den Schultern führen den Blick zum Hauptstein." },
    params: {
      kind: "ring", profile: "round", taper: "tapered", width: 2.1, thickness: 1.6,
      stone: { cut: "round", size: 6.0 }, setting: "prong4", prongDia: 0.85,
      side: { count: 4, size: 1.5, setting: "pave" },
    },
  },
  {
    id: "bezel",
    label: { pl: "Kaseta nowoczesna", en: "Modern bezel", de: "Moderne Zarge" },
    note: { pl: "Rant dookoła kamienia. Nic nie wystaje, więc nie zaczepia.",
            en: "A rim all the way round. Nothing protrudes, so nothing catches.",
            de: "Ein Rand rundum. Nichts steht vor, nichts bleibt hängen." },
    params: {
      kind: "ring", profile: "round", taper: "none", width: 2.4, thickness: 1.7,
      stone: { cut: "round", size: 6.0 }, setting: "bezel",
      side: { count: 0 },
    },
  },
  {
    id: "emerald",
    label: { pl: "Ośmiokąt w kasecie", en: "Octagon in a bezel", de: "Achteck in Zarge" },
    note: { pl: "Szlif schodkowy pokazuje czystość kamienia zamiast ognia.",
            en: "A step cut shows the clarity of the stone rather than its fire.",
            de: "Ein Treppenschliff zeigt die Reinheit statt des Feuers." },
    params: {
      kind: "ring", profile: "flat", taper: "none", width: 2.2, thickness: 1.7,
      stone: { cut: "octagon", size: 7.0 }, setting: "bezel",
      side: { count: 0 },
    },
  },
  {
    id: "marquise",
    label: { pl: "Markiza w łapkach V", en: "Marquise in V-claws", de: "Navette in V-Krappen" },
    note: { pl: "Szpice muszą być zakryte, bo to najbardziej kruche miejsce kamienia.",
            en: "The points must be covered, being the most fragile part of the stone.",
            de: "Die Spitzen müssen bedeckt sein, sie sind die empfindlichste Stelle." },
    params: {
      kind: "ring", profile: "round", taper: "tapered", width: 1.9, thickness: 1.5,
      stone: { cut: "marquise", size: 8.0 }, setting: "vprong", prongDia: 0.9,
      side: { count: 0 },
    },
  },
  {
    id: "cabochon",
    label: { pl: "Kaboszon, kamień urodzeniowy", en: "Cabochon birthstone", de: "Cabochon-Geburtsstein" },
    note: { pl: "Kamień polerowany na gładko, bez fasetek. Tak nosi się ametyst czy turkus.",
            en: "Polished smooth, without facets. This is how amethyst or turquoise is worn.",
            de: "Glatt poliert, ohne Facetten. So trägt man Amethyst oder Türkis." },
    params: {
      kind: "ring", profile: "round", taper: "none", width: 2.6, thickness: 1.8,
      stone: { cut: "bufftop", size: 7.0, material: "amethyst" }, setting: "bezel",
      side: { count: 0 },
    },
  },
  {
    id: "signet",
    label: { pl: "Sygnet męski", en: "Men's signet", de: "Herren-Siegelring" },
    note: { pl: "Masywna tarcza i ramiona, które gęstnieją pod nią.",
            en: "A solid table with shoulders that thicken beneath it.",
            de: "Eine massive Platte mit Schultern, die darunter kräftiger werden." },
    params: {
      kind: "ring", profile: "round", taper: "signet", width: 3.2, thickness: 2.0,
      signet: { table: "cushion", length: 16 },
    },
    kind: "signet",
  },
  {
    id: "signetLady",
    label: { pl: "Sygnet damski", en: "Women's signet", de: "Damen-Siegelring" },
    note: { pl: "Ta sama konstrukcja, mniejsza tarcza i lżejsza szyna.",
            en: "The same construction with a smaller table and a lighter shank.",
            de: "Gleiche Konstruktion, kleinere Platte, leichtere Schiene." },
    params: {
      profile: "round", taper: "signet", width: 2.2, thickness: 1.6,
      signet: { table: "oval", length: 11 },
    },
    kind: "signet",
  },
  {
    id: "pinky",
    label: { pl: "Pinky, na mały palec", en: "Pinky ring", de: "Pinky-Ring" },
    note: { pl: "Mniejszy rozmiar i drobna tarcza. Nosi się go zamiast sygnetu pieczętnego.",
            en: "A smaller size and a small table, worn in place of a seal signet.",
            de: "Kleinere Größe und kleine Platte, statt eines Siegelrings getragen." },
    params: {
      innerDia: 15.6, profile: "round", taper: "signet", width: 2.0, thickness: 1.5,
      signet: { table: "oval", length: 9.5 },
    },
    kind: "signet",
  },
];

/**
 * Parametry presetu doklejone do biezacych.
 *
 * Rozmiar, metal i kolor NIE sa czescia presetu i celowo zostaja takie, jakie
 * ustawil klient. Preset zmienia ksztalt, a nie palec i nie portfel: zbicie
 * rozmiaru do domyslnego przy kazdym kliknieciu byloby walka z uzytkownikiem.
 * Wyjatkiem jest pinky, ktory rozmiar zmienia z definicji, bo to inny palec.
 */
export function applyPreset(preset, current) {
  const p = { ...current, ...preset.params };
  if (preset.kind) p.kind = preset.kind;
  p.stone = { ...current.stone, ...(preset.params.stone || {}) };
  p.side = { ...current.side, ...(preset.params.side || {}) };
  p.signet = { ...current.signet, ...(preset.params.signet || {}) };
  return p;
}
