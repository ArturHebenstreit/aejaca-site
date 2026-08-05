// ============================================================
// NARZEDZIA POWIAZANE Z TRESCIA
// ============================================================
// Zasada obowiazujaca w tym repozytorium: jesli tresc dotyka tematu, ktory
// mamy obsluzony narzedziem, ma do tego narzedzia prowadzic. Dotyczy blogow,
// slownika, kalkulatorow, sklepu i strony B2B.
//
// Pomiar przed wprowadzeniem tej zasady, na zbudowanym serwisie:
//
//   slownik   0,03 odnosnika do narzedzia na haslo (1 z 29)
//   blog      0,21 na wpis (2 z 18, oba dopisane recznie dzien wczesniej)
//   sklep     0,75 na strone (tylko jubilerskie, sTuDiO zero)
//   B2B       0
//
// Siedem z dziewieciu narzedzi mialo dokladnie dwie strony przychodzace: hub
// narzedzi i siebie samo. Byly wiec zbudowane, opisane w mapie witryny i dla
// czytelnika praktycznie nieistniejace.
//
// Mapowanie siedzi tutaj, a nie w plikach `.meta.js` wpisow i nie w hasłach
// slownika, z jednego powodu: nowe narzedzie ma sie wpinac w cala tresc przez
// edycje JEDNEGO pliku. Inaczej kazde kolejne oznacza obchodzenie
// czterdziestu siedmiu plikow i polowa zostanie pominieta.
//
// `audience` rozdziela odbiorcow. Kupujacy nie potrzebuje kalkulatora blanku
// obraczki ani tabeli parametrow lasera, to sa narzedzia warsztatowe. Za to
// na stronie B2B, gdzie po drugiej stronie siedzi pracownia, sa najwazniejsze.

export const TOOL_LINKS = [
  {
    id: "ring-sizer",
    category: "jewelry",
    audience: "buyer",
    to: "/toolsjewelry/ring-sizer/",
    label: { pl: "Miarka do pierścionków do wydruku", en: "Printable ring sizer", de: "Ringmaßband zum Ausdrucken" },
    desc: {
      pl: "Nie znasz rozmiaru? Wydrukuj, wytnij pasek i zmierz palec w minutę.",
      en: "Not sure of your size? Print it, cut the strip and measure in a minute.",
      de: "Größe unbekannt? Drucken, Streifen ausschneiden, in einer Minute messen.",
    },
  },
  {
    id: "ring-size",
    category: "jewelry",
    audience: "buyer",
    to: "/toolsjewelry/ring-size/",
    label: { pl: "Konwerter rozmiarów pierścionków", en: "Ring size converter", de: "Ringgrößen-Konverter" },
    desc: {
      pl: "Masz rozmiar w innym systemie? Przelicz EU, US, UK i JP.",
      en: "Got a size in another system? Convert EU, US, UK and JP.",
      de: "Größe in einem anderen System? EU, US, UK und JP umrechnen.",
    },
  },
  {
    id: "metal-pricing",
    category: "jewelry",
    audience: "both",
    to: "/toolsjewelry/metal-pricing/",
    label: { pl: "Ile warte jest moje złoto", en: "What is my gold worth", de: "Was ist mein Gold wert" },
    desc: {
      pl: "Wartość kruszcu z ceny spot i realne widełki skupu. Próby 333 do 999 i karaty.",
      en: "Metal value from the spot price plus a realistic buy-back range. Fineness 333 to 999 and karats.",
      de: "Materialwert aus dem Spotpreis und realistische Ankaufsspanne. Feingehalt 333 bis 999 und Karat.",
    },
  },
  {
    id: "alloy-composition",
    category: "jewelry",
    audience: "maker",
    to: "/toolsjewelry/alloy-composition/",
    label: { pl: "Skład stopów jubilerskich", en: "Jewelry alloy composition", de: "Legierungszusammensetzung" },
    desc: {
      pl: "Skład, zakres topnienia i twardość stopów złota, srebra i platyny.",
      en: "Composition, melting range and hardness for gold, silver and platinum alloys.",
      de: "Zusammensetzung, Schmelzbereich und Härte von Gold-, Silber- und Platinlegierungen.",
    },
  },
  {
    id: "ring-blank",
    category: "jewelry",
    audience: "maker",
    to: "/toolsjewelry/ring-blank/",
    label: { pl: "Kalkulator blanku obrączki", en: "Ring blank calculator", de: "Ring-Rohling-Rechner" },
    desc: {
      pl: "Długość pręta i masa blanku dla metalu, średnicy i szerokości obrączki.",
      en: "Strip length and blank weight for any metal, diameter and band width.",
      de: "Streifenlänge und Rohlinggewicht für Metall, Durchmesser und Ringbreite.",
    },
  },
  {
    id: "printability",
    category: "studio",
    audience: "both",
    to: "/toolstudio/printability/",
    label: { pl: "Sprawdzarka modeli 3D", en: "3D model checker", de: "3D-Modellprüfung" },
    desc: {
      pl: "Czy model się wydrukuje: szczelność siatki, grubość ścianek pod daną dyszę, gabaryty, nawisy.",
      en: "Will it print: watertight mesh, wall thickness for a given nozzle, build volume, overhangs.",
      de: "Druckbar oder nicht: geschlossenes Netz, Wandstärke je Düse, Bauraum, Überhänge.",
    },
  },
  {
    id: "print-settings",
    category: "studio",
    audience: "both",
    to: "/toolstudio/print-settings/",
    label: { pl: "Parametry druku 3D FDM", en: "FDM 3D print settings", de: "FDM-3D-Druckparameter" },
    desc: {
      pl: "Dobór filamentu pod wymagania, 45+ materiałów i 100+ profili marek.",
      en: "Pick a filament by requirement, 45+ materials and 100+ brand profiles.",
      de: "Filament nach Anforderung wählen, 45+ Materialien und 100+ Markenprofile.",
    },
  },
  {
    id: "resin-settings",
    category: "studio",
    audience: "both",
    to: "/toolstudio/resin-settings/",
    label: { pl: "Parametry druku 3D MSLA", en: "MSLA resin settings", de: "MSLA-Harzparameter" },
    desc: {
      pl: "Dobór żywicy pod zastosowanie, 13 żywic w trzech segmentach i tabela porównawcza.",
      en: "Pick a resin by application, 13 resins in three segments plus a comparison table.",
      de: "Harz nach Anwendung wählen, 13 Harze in drei Segmenten und Vergleichstabelle.",
    },
  },
  {
    id: "laser-parameters",
    category: "studio",
    audience: "maker",
    to: "/toolstudio/laser-parameters/",
    label: { pl: "Parametry laserowania", en: "Laser parameters", de: "Laserparameter" },
    desc: {
      pl: "7 typów laserów, 88 materiałów i ponad 1000 kombinacji mocy i prędkości.",
      en: "7 laser types, 88 materials and over 1000 power and speed combinations.",
      de: "7 Lasertypen, 88 Materialien und über 1000 Leistungs- und Geschwindigkeitskombinationen.",
    },
  },
  {
    id: "shrinkage",
    category: "studio",
    audience: "maker",
    to: "/toolstudio/shrinkage/",
    label: { pl: "Kompensacja skurczu odlewniczego", en: "Casting shrinkage compensation", de: "Gussschwund-Kompensation" },
    desc: {
      pl: "Wymiar wzorca przeliczony na wymiar po odlewie dla Au 585, Ag 925, Au 9K i 18K.",
      en: "Pattern size converted to the after-cast size for Au 585, Ag 925, Au 9K and 18K.",
      de: "Modellmaß auf das Maß nach dem Guss umgerechnet für Au 585, Ag 925, Au 9K und 18K.",
    },
  },
];

const byId = new Map(TOOL_LINKS.map((t) => [t.id, t]));

/** Narzedzia przypisane do konkretnego wpisu blogowego. */
const TOOLS_BY_POST = {
  "bizuteria-inwestycja": ["metal-pricing", "alloy-composition"],
  "druk-3d-krok-po-kroku": ["printability", "print-settings", "resin-settings"],
  "druk-miniatur-figurek-16k": ["resin-settings"],
  "grawerowanie-laserowe-przewodnik": ["laser-parameters"],
  "ile-kosztuje-bizuteria-na-zamowienie": ["metal-pricing", "ring-sizer"],
  "jak-dbac-o-bizuterie": ["alloy-composition"],
  "jak-przygotowac-plik-stl": ["printability", "print-settings", "resin-settings"],
  "lost-resin-krok-po-kroku": ["shrinkage", "resin-settings"],
  "materialy-laser-cutting": ["laser-parameters"],
  "modelowanie-3d-na-zamowienie": ["printability", "print-settings"],
  "obraczki-slubne": ["ring-sizer", "ring-size", "metal-pricing"],
  "odlewy-zywiczne-poradnik": ["resin-settings"],
  "pierscionek-zareczynowy-na-zamowienie": ["ring-sizer", "ring-size", "metal-pricing"],
  "prezenty-personalizowane": ["laser-parameters"],
  "rodzaje-splotow-lancuszkow": ["metal-pricing"],
  "srebro-vs-zloto": ["metal-pricing", "alloy-composition"],
  // projektowanie-ai i warsztat-od-kuchni celowo bez narzedzi: pierwszy jest
  // o procesie projektowym, drugi o wyposazeniu pracowni. Doklejenie tam
  // kalkulatora byloby wypelniaczem, a nie pomoca.
};

/** Narzedzia przypisane do hasla slownika. */
const TOOLS_BY_TERM = {
  "srebro-925": ["alloy-composition", "metal-pricing"],
  "zloto-probowane": ["metal-pricing", "alloy-composition"],
  "pierscionek-zareczynowy": ["ring-sizer", "ring-size"],
  "obraczki-slubne": ["ring-sizer", "ring-blank"],
  rodowanie: ["alloy-composition"],
  "rozmiar-pierscionka": ["ring-sizer", "ring-size"],
  "bizuteria-inwestycyjna": ["metal-pricing"],
  "druk-3d-fdm": ["print-settings", "printability"],
  "plik-stl": ["printability", "print-settings"],
  pla: ["print-settings"],
  petg: ["print-settings"],
  "zywica-uv": ["resin-settings"],
  "laser-co2": ["laser-parameters"],
  "laser-fiber": ["laser-parameters"],
  "plik-svg": ["laser-parameters"],
  "odlew-zywiczny": ["resin-settings"],
  prototypowanie: ["printability", "print-settings", "resin-settings"],
  "modelowanie-3d": ["printability", "print-settings", "shrinkage"],
  "lost-resin": ["shrinkage", "resin-settings"],
  "zywica-castable": ["resin-settings", "shrinkage"],
  "druk-msla": ["resin-settings", "printability"],
  "kompensacja-skurczu": ["shrinkage", "ring-blank"],
  "wycena-online": ["metal-pricing", "print-settings"],
  // kamien-szlachetny, moissanit, personalizowany-grawer, cad, personalizacja
  // i projektowanie-ai nie maja narzedzia, ktore realnie by im odpowiadalo.
};

function resolve(ids) {
  return (ids || []).map((id) => byId.get(id)).filter(Boolean);
}

/** Narzedzia dla sklepu i kart uslug: tylko to, co przyda sie kupujacemu. */
export function getToolsByCategory(category) {
  return TOOL_LINKS.filter((t) => t.category === category && t.audience !== "maker");
}

/** Narzedzia warsztatowe, dla odbiorcy zawodowego (B2B, hub narzedzi). */
export function getToolsForPros(category) {
  return TOOL_LINKS.filter((t) => (category ? t.category === category : true) && t.audience !== "buyer");
}

export function getToolsForPost(slug, category) {
  const explicit = resolve(TOOLS_BY_POST[slug]);
  if (explicit.length) return explicit;
  return TOOL_LINKS.filter((t) => t.category === category && t.audience !== "maker").slice(0, 2);
}

export function getToolsForTerm(id, category) {
  const explicit = resolve(TOOLS_BY_TERM[id]);
  if (explicit.length) return explicit;
  return TOOL_LINKS.filter((t) => t.category === category && t.audience !== "maker").slice(0, 2);
}

export function getToolById(id) {
  return byId.get(id) || null;
}
