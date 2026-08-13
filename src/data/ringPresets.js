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
//   cluster, fantasy          uklady swobodne, to jest projekt indywidualny,
//                             a nie konfiguracja, i idzie sciezka wyceny
//   monogram, odcisk palca    wymagaja wejscia z pliku, to osobna funkcja
//
// Lepiej pokazac osiem pozycji, ktore daja dokladnie to, co obiecuja, niz
// dwanascie, z ktorych cztery udaja cos, czego generator nie zbuduje.

// GRUPY STYLOW. Klient najpierw wybiera rodzaj wyrobu, a dopiero potem
// wariant, bo szesnascie kafelkow obok siebie to sciana, w ktorej nie widac
// zadnej roznicy. Podzial idzie po tym, CZYM rzecz jest, a nie po tym, jak
// ja zbudowalismy: obraczka i eternity to dla kupujacego jedna polka.
export const PRESET_GROUPS = [
  { id: "solitaire", label: { pl: "Z jednym kamieniem", en: "Single stone", de: "Mit einem Stein" } },
  { id: "multi",     label: { pl: "Z kilkoma kamieniami", en: "Several stones", de: "Mehrere Steine" } },
  { id: "bands",     label: { pl: "Obrączki", en: "Bands", de: "Ringe" } },
  { id: "signets",   label: { pl: "Sygnety", en: "Signets", de: "Siegelringe" } },
];

export const RING_PRESETS = [
  {
    id: "solitaire",
    group: "solitaire",
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
    group: "solitaire",
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
    group: "multi",
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
    group: "solitaire",
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
    group: "solitaire",
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
    group: "solitaire",
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
    group: "solitaire",
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
    id: "halo",
    group: "multi",
    label: { pl: "Halo", en: "Halo", de: "Halo" },
    note: { pl: "Wieniec drobnych kamieni powiększa optycznie kamień centralny o pół karata.",
            en: "A wreath of small stones makes the centre stone look about half a carat larger.",
            de: "Ein Kranz kleiner Steine lässt den Hauptstein rund ein halbes Karat größer wirken." },
    params: {
      kind: "ring", profile: "round", taper: "tapered", width: 2.0, thickness: 1.6,
      stone: { cut: "round", size: 5.5 }, setting: "prong4", prongDia: 0.8,
      halo: { on: true, size: 1.3 }, side: { count: 0 },
    },
  },
  {
    id: "diana",
    group: "multi",
    label: { pl: "Owal w halo, z pavé", en: "Oval halo with pavé", de: "Ovales Halo mit Pavé" },
    note: { pl: "Owal w wieńcu, kamienie na ramionach. Wzór znany z pierścionka księżnej Diany.",
            en: "An oval in a wreath with stones along the shoulders, the pattern known from Princess Diana's ring.",
            de: "Ein Oval im Kranz mit Steinen an den Schultern, bekannt vom Ring von Prinzessin Diana." },
    params: {
      kind: "ring", profile: "round", taper: "tapered", width: 2.1, thickness: 1.6,
      stone: { cut: "oval", size: 6.5, material: "sapphire" }, setting: "prong4", prongDia: 0.8,
      halo: { on: true, size: 1.3 },
      side: { count: 3, size: 1.4, setting: "pave" },
    },
  },
  {
    id: "trilogy",
    group: "multi",
    label: { pl: "Trylogia", en: "Trilogy", de: "Trilogie" },
    note: { pl: "Trzy kamienie: przeszłość, teraźniejszość, przyszłość. Boczne we własnych łapkach.",
            en: "Three stones for past, present and future, the side ones in claws of their own.",
            de: "Drei Steine für Vergangenheit, Gegenwart und Zukunft, die seitlichen in eigenen Krappen." },
    params: {
      kind: "ring", profile: "round", taper: "tapered", width: 2.2, thickness: 1.7,
      stone: { cut: "round", size: 6.0 }, setting: "prong4", prongDia: 0.9,
      side: { count: 1, size: 4.0, setting: "prong" },
    },
  },
  {
    id: "band",
    group: "bands",
    label: { pl: "Obrączka gładka", en: "Plain band", de: "Glatter Ring" },
    note: { pl: "Bez kamieni. Profil comfort zsuwa się po palcu zamiast go ścinać krawędzią.",
            en: "No stones. A comfort profile slides over the finger instead of cutting into it.",
            de: "Ohne Steine. Das Comfort-Profil gleitet über den Finger, statt einzuschneiden." },
    params: {
      profile: "comfort", taper: "none", width: 4.0, thickness: 1.8,
      band: { coverage: "none" },
    },
    kind: "band",
  },
  {
    id: "halfEternity",
    group: "bands",
    label: { pl: "Half eternity", en: "Half eternity", de: "Half Eternity" },
    note: { pl: "Kamienie na górnej połowie. Dół zostaje gładki, więc rozmiar da się później zmienić.",
            en: "Stones across the upper half. The lower half stays plain, so the size can be altered later.",
            de: "Steine auf der oberen Hälfte. Die untere bleibt glatt, die Größe lässt sich später ändern." },
    params: {
      profile: "round", taper: "none", width: 2.4, thickness: 1.8,
      band: { coverage: "half", size: 1.8, setting: "pave" },
    },
    kind: "band",
  },
  {
    id: "eternity",
    group: "bands",
    label: { pl: "Eternity", en: "Eternity", de: "Eternity" },
    note: { pl: "Kamienie dookoła. UWAGA: takiego pierścionka nie da się później zwęzić ani rozciągnąć, bo nie ma gładkiego odcinka.",
            en: "Stones all the way round. Note that such a ring cannot be sized later, as there is no plain stretch to work on.",
            de: "Steine rundum. Achtung: ein solcher Ring lässt sich später nicht weiten, es fehlt der glatte Abschnitt." },
    params: {
      profile: "round", taper: "none", width: 2.4, thickness: 1.8,
      band: { coverage: "full", size: 1.8, setting: "pave" },
    },
    kind: "band",
  },
  {
    id: "signet",
    group: "signets",
    label: { pl: "Sygnet męski", en: "Men's signet", de: "Herren-Siegelring" },
    note: { pl: "Masywna tarcza i ramiona, które gęstnieją pod nią.",
            en: "A solid table with shoulders that thicken beneath it.",
            de: "Eine massive Platte mit Schultern, die darunter kräftiger werden." },
    params: {
      kind: "ring", profile: "round", taper: "signet", width: 2.9, thickness: 1.8,
      signet: { table: "cushion", length: 15, face: "flat" },
    },
    kind: "signet",
  },
  {
    id: "signetLady",
    group: "signets",
    label: { pl: "Sygnet damski", en: "Women's signet", de: "Damen-Siegelring" },
    note: { pl: "Ta sama konstrukcja, mniejsza tarcza i lżejsza szyna.",
            en: "The same construction with a smaller table and a lighter shank.",
            de: "Gleiche Konstruktion, kleinere Platte, leichtere Schiene." },
    params: {
      profile: "round", taper: "signet", width: 2.0, thickness: 1.5,
      signet: { table: "oval", length: 11, face: "flat" },
    },
    kind: "signet",
  },
  {
    id: "pinky",
    group: "signets",
    label: { pl: "Pinky, na mały palec", en: "Pinky ring", de: "Pinky-Ring" },
    note: { pl: "Mniejszy rozmiar i drobna tarcza. Nosi się go zamiast sygnetu pieczętnego.",
            en: "A smaller size and a small table, worn in place of a seal signet.",
            de: "Kleinere Größe und kleine Platte, statt eines Siegelrings getragen." },
    params: {
      innerDia: 15.6, profile: "round", taper: "signet", width: 1.8, thickness: 1.35,
      signet: { table: "oval", length: 9.0, face: "flat" },
    },
    kind: "signet",
  },
  {
    id: "signetRound",
    group: "signets",
    label: { pl: "Sygnet okrągły", en: "Round signet", de: "Runder Siegelring" },
    note: { pl: "Okrągła tarcza i gładka powierzchnia. Najspokojniejszy z całej rodziny.",
            en: "A round table and a plain surface. The quietest of the family.",
            de: "Runde Platte, glatte Oberfläche. Der ruhigste der Familie." },
    params: {
      profile: "round", taper: "signet", width: 2.6, thickness: 1.7,
      signet: { table: "round", length: 12.5, face: "flat" },
    },
    kind: "signet",
  },
  {
    id: "signetPanel",
    group: "signets",
    label: { pl: "Sygnet z wpuszczonym polem", en: "Signet with recessed panel", de: "Siegelring mit vertieftem Feld" },
    note: { pl: "Rant dookoła, w środku wpuszczone pole. Grawer siedzi niżej niż krawędź, więc się nie ściera.",
            en: "A rim all round with a sunken panel inside. The engraving sits below the edge, so it does not wear away.",
            de: "Umlaufender Rand mit vertieftem Feld. Die Gravur liegt tiefer als die Kante und reibt sich nicht ab." },
    params: {
      profile: "round", taper: "signet", width: 2.8, thickness: 1.8,
      signet: { table: "cushion", length: 14, face: "recessed" },
    },
    kind: "signet",
  },
  {
    id: "signetBar",
    group: "signets",
    label: { pl: "Sygnet poprzeczny", en: "Bar signet", de: "Quer-Siegelring" },
    note: { pl: "Tarcza położona wzdłuż obwodu, nie wzdłuż palca. Niska i szeroka, nie zahacza o rękaw.",
            en: "The table lies along the circumference rather than along the finger. Low and wide, it does not catch on a sleeve.",
            de: "Die Platte liegt entlang des Umfangs statt entlang des Fingers. Flach und breit, bleibt nicht am Ärmel hängen." },
    params: {
      profile: "round", taper: "signet", width: 2.4, thickness: 1.6,
      signet: { table: "bar", length: 15, face: "recessed" },
    },
    kind: "signet",
  },
  {
    id: "signetHeart",
    group: "signets",
    label: { pl: "Sygnet serce", en: "Heart signet", de: "Herz-Siegelring" },
    note: { pl: "Tarcza w kształcie serca, lekka szyna. Sygnet na prezent, nie do pieczętowania.",
            en: "A heart-shaped table on a light shank. A signet to give, not to seal with.",
            de: "Herzförmige Platte auf schmaler Schiene. Ein Siegelring zum Verschenken, nicht zum Siegeln." },
    params: {
      profile: "round", taper: "signet", width: 2.0, thickness: 1.5,
      signet: { table: "heart", length: 11, face: "domed" },
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
  // Halo i obwod nie sa dziedziczone: preset bez halo ma byc BEZ halo,
  // a nie z resztka po poprzednim kliknieciu.
  p.halo = { ...current.halo, on: false, ...(preset.params.halo || {}) };
  p.band = { ...current.band, coverage: "none", ...(preset.params.band || {}) };
  return p;
}
