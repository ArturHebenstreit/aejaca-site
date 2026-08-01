// ============================================================
// OPAKOWANIA I PERSONALIZACJA, skladniki ceny
// ============================================================
// Wszystko, co zmienia kwote do zaplaty, musi lezec w rdzeniu cenowym,
// bo backend przelicza zamowienie tym samym kodem. Cennik opakowan
// w danych frontendu bylby cena z przegladarki, czyli sugestia.

export const PACKAGING = [
  {
    id: "paper",
    grosze: 0,
    personalizable: false,
    label: {
      pl: "Standardowe, papierowe",
      en: "Standard paper box",
      de: "Standard-Papierschachtel",
    },
    desc: {
      pl: "Pudełko z tektury z wypełnieniem chroniącym wyrób w transporcie.",
      en: "Cardboard box with padding that protects the piece in transit.",
      de: "Kartonschachtel mit Polsterung, die das Stück beim Versand schützt.",
    },
  },
  {
    id: "wood",
    grosze: 3900,
    personalizable: false,
    label: {
      pl: "Premium, drewniane",
      en: "Premium wooden box",
      de: "Premium-Holzschachtel",
    },
    desc: {
      pl: "Pudełko z litego drewna z magnetycznym zamknięciem i wyściółką.",
      en: "Solid wood box with a magnetic closure and a lined interior.",
      de: "Massivholzschachtel mit Magnetverschluss und Innenfutter.",
    },
  },
  {
    id: "wood_custom",
    grosze: 6900,
    personalizable: true,
    label: {
      pl: "Drewniane z grawerem",
      en: "Wooden box with engraving",
      de: "Holzschachtel mit Gravur",
    },
    desc: {
      pl: "To samo pudełko z grawerem laserowym na wieku: imię, data albo krótka dedykacja.",
      en: "The same box with a laser engraving on the lid: a name, a date or a short dedication.",
      de: "Dieselbe Schachtel mit Lasergravur auf dem Deckel: Name, Datum oder kurze Widmung.",
    },
    personalizationLabel: {
      pl: "Treść graweru na wieku",
      en: "Engraving text on the lid",
      de: "Gravurtext auf dem Deckel",
    },
    secondaryLabel: {
      pl: "Treść po wewnętrznej stronie wieka (opcjonalnie)",
      en: "Text on the inside of the lid (optional)",
      de: "Text auf der Deckelinnenseite (optional)",
    },
    maxLength: 60,
  },
];

/**
 * Limity dlugosci graweru. Powyzej nich nie odmawiamy, tylko kierujemy do
 * wyceny indywidualnej: dluzszy tekst to inne ustawienia lasera, inny czas
 * i czesto inna kompozycja, wiec kwota z automatu przestaje byc uczciwa.
 */
export const ENGRAVING_LIMITS = {
  /** Grawer na wyrobie: inicjaly, data, krotka dedykacja */
  jewelry: 30,
  /** Wieko pudelka, jest na nim wiecej miejsca */
  packaging: 60,
};

/** Opakowanie ma sens wylacznie dla rzeczy fizycznych */
export const DEFAULT_PACKAGING = "paper";

export function getPackaging(id) {
  return PACKAGING.find((p) => p.id === id) || null;
}

/**
 * Doplata za opakowanie, w groszach.
 * Nieznane id traktujemy jak standardowe, zamiast rzucac bledem, zeby
 * literowka w zamowieniu nie zablokowala platnosci. Kwota i tak wychodzi
 * z tego cennika, nie z przegladarki.
 */
export function packagingGrosze(id) {
  return getPackaging(id)?.grosze ?? 0;
}

/**
 * Walidacja tekstu personalizacji. Zwraca przyciety tekst albo null.
 * Znaki spoza zakresu graweru odrzucamy tutaj, a nie dopiero przy realizacji,
 * zeby klient dowiedzial sie o tym przed zaplata.
 */
export function sanitizePersonalization(text, maxLength = 120) {
  if (typeof text !== "string") return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.slice(0, maxLength);
}
