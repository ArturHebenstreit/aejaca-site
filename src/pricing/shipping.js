// ============================================================
// WYSYLKA: STREFY I KOSZTY
// ============================================================
// Ceny sa stale, nie pobierane z API przewoznika: cenniki DHL i FedEx wymagaja
// konta firmowego z umowa, ktorego przy dzialalnosci nierejestrowanej nie ma.
// Tabela jest wiec utrzymywana recznie i celowo konserwatywna, bo pomylka
// w dol przy jednej paczce do Azji zjada marze calego zamowienia.
//
// Struktura jest przygotowana pod podmiane na odpytanie brokera (Furgonetka,
// Apaczka): wystarczy zastapic `shippingGrosze` wywolaniem API, reszta kodu
// pyta wylacznie o strefe i metode.
//
// Waga: jeden przedzial do 2 kg. Wyzej wysylka idzie do wyceny indywidualnej,
// bo miedzy 2 a 10 kg roznice sa zbyt duze, zeby je usrednic.

/** Panstwa Unii Europejskiej. Poza ta lista przesylka przechodzi odprawe celna. */
export const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

/** Doplata za obsluge nadania u brokera, takze za dokumenty celne. */
export const HANDLING_GROSZE = 1000;

/** Gorna granica wagi obslugiwana cennikiem. Wyzej: wycena indywidualna. */
export const MAX_PARCEL_G = 2000;

/**
 * Darmowa wysylka w Polsce od tej kwoty zamowienia. Obietnica stoi na stronie
 * /shipping/ od dawna, wiec kasa musi ja honorowac, a nie tylko o niej pisac.
 * Za granica nie obowiazuje: tam sam kurier kosztuje wielokrotnie wiecej.
 */
export const FREE_SHIPPING_FROM_GROSZE = 40000;

export const ZONES = {
  pl: {
    id: "pl",
    carrier: "InPost",
    locker: true,
    courierGrosze: 2490,
    lockerGrosze: 1590,
    leadDays: 2,
    countries: ["PL"],
  },
  eu_near: {
    id: "eu_near",
    carrier: "DHL",
    locker: false,
    courierGrosze: 9000,
    leadDays: 3,
    countries: ["DE", "CZ", "SK", "LT"],
  },
  eu_far: {
    id: "eu_far",
    carrier: "DHL",
    locker: false,
    courierGrosze: 13000,
    leadDays: 4,
    countries: [
      "AT", "BE", "BG", "HR", "CY", "DK", "EE", "FI", "FR", "GR", "HU",
      "IE", "IT", "LV", "LU", "MT", "NL", "PT", "RO", "SI", "ES", "SE",
    ],
  },
  eur_non_eu: {
    id: "eur_non_eu",
    carrier: "DHL",
    locker: false,
    courierGrosze: 18000,
    leadDays: 5,
    countries: ["GB", "NO", "CH", "IS", "LI", "RS", "BA", "ME", "MK", "AL", "MD"],
  },
  world_am: {
    id: "world_am",
    carrier: "DHL / FedEx",
    locker: false,
    courierGrosze: 38000,
    leadDays: 7,
    countries: ["US", "CA", "MX", "BR", "AR", "CL", "CO"],
  },
  world_rest: {
    id: "world_rest",
    carrier: "DHL / FedEx",
    locker: false,
    courierGrosze: 44000,
    leadDays: 9,
    countries: [
      "JP", "KR", "CN", "HK", "TW", "SG", "MY", "TH", "VN", "PH", "ID", "IN",
      "AE", "SA", "IL", "TR", "QA", "KW", "AU", "NZ", "ZA", "EG", "MA", "GE", "UA", "KZ",
    ],
  },
};

/** Kraje wybieralne w kasie, w kolejnosci stref. */
export const SHIPPING_COUNTRIES = Object.values(ZONES).flatMap((z) => z.countries);

export function zoneForCountry(country) {
  const code = String(country || "").toUpperCase();
  return Object.values(ZONES).find((z) => z.countries.includes(code)) || null;
}

export function isEuCountry(country) {
  return EU_COUNTRIES.includes(String(country || "").toUpperCase());
}

/** Poza UE przesylka przechodzi odprawe, a clo i VAT importowy placi odbiorca. */
export function needsCustoms(country) {
  const code = String(country || "").toUpperCase();
  return Boolean(code) && !isEuCountry(code);
}

/**
 * Koszt wysylki w groszach albo null, gdy metoda nie jest dostepna w tym kraju.
 * Paczkomat dziala wylacznie w Polsce, bo miedzynarodowa siec InPost wymaga
 * osobnej umowy, ktorej nie mamy.
 */
export function shippingGrosze(methodId, country = "PL", itemsTotalGrosze = 0) {
  if (methodId === "pickup") return 0;
  if (methodId === "digital") return 0;

  const zone = zoneForCountry(country);
  if (!zone) return null;

  if (zone.id === "pl" && itemsTotalGrosze >= FREE_SHIPPING_FROM_GROSZE) return 0;

  if (methodId === "inpost_locker") return zone.locker ? zone.lockerGrosze : null;
  if (methodId === "courier") {
    // Doplata brokera dotyczy wylacznie przesylek zagranicznych: w kraju
    // nadajemy sami, bez posrednika i bez dokumentow celnych.
    return zone.id === "pl" ? zone.courierGrosze : zone.courierGrosze + HANDLING_GROSZE;
  }
  return null;
}

/** Metody dostepne dla danego kraju, w kolejnosci od najtanszej. */
export function shippingOptions(country = "PL", itemsTotalGrosze = 0) {
  const zone = zoneForCountry(country);
  if (!zone) return [];
  const ids = zone.id === "pl" ? ["inpost_locker", "courier", "pickup"] : ["courier"];
  return ids
    .map((id) => ({
      id,
      grosze: shippingGrosze(id, country, itemsTotalGrosze),
      // Cena bez rabatu za prog darmowej wysylki. Kasa pokazuje ja przekreslona
      // obok slowa "Gratis", zeby bylo widac, ile klient zaoszczedzil; samo zero
      // wyglada jak zepsuty cennik.
      listGrosze: shippingGrosze(id, country, 0),
      carrier: zone.carrier,
      leadDays: zone.leadDays,
    }))
    .filter((o) => o.grosze !== null);
}
