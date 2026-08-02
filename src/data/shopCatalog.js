// ============================================================
// KATALOG SKLEPU
// ============================================================
// Zrodlem prawdy o produkcie jest baza. Do repozytorium trafia jej odcisk
// (`products.generated.js`), bo strony sklepu sa budowane statycznie i kazda
// karta produktu musi istniec jako plik, a zdjecia i tak leza w repozytorium.
// Odcisk odswiezasz komenda `npm run products:pull`.
//
// Nic tu nie jest wpisane recznie: pusty odcisk oznacza pusta baze, a nie
// zapomniana liste w kodzie.

import { PRODUCTS_FROM_DB, GENERATED_AT } from "./products.generated.js";
import { OFFER_KIND, WITHDRAWAL, withdrawalFor } from "./offerKinds.js";

export { OFFER_KIND, WITHDRAWAL, GENERATED_AT };

/** Rezim odstapienia liczymy z rodzaju rzeczy, baza go nie przechowuje. */
const withRules = (p) => ({ ...p, withdrawal: withdrawalFor(p) });

const ALL = PRODUCTS_FROM_DB.map(withRules);

/** Rzeczy gotowe: pakujemy i wysylamy. */
export const PRODUCTS = ALL.filter((p) => p.offer === OFFER_KIND.READY);

/**
 * Gotowe polprodukty dopasowywane do klienta: kamienne podstawki pod drinki,
 * drewniane szkatulki, deski. Baza jest na polce, wiec termin liczy sie
 * w dniach, a nie w tygodniach, ale wysylka nastepuje dopiero po obrobce.
 */
export const PERSONALIZED = ALL.filter((p) => p.offer === OFFER_KIND.PERSONALIZED);

export function personalizedByCategory(category) {
  return PERSONALIZED.filter((p) => p.category === category);
}

/** Szuka po wszystkich pozycjach, bo adres karty nie zalezy od rodzaju oferty. */
export function getProduct(slug) {
  return ALL.find((p) => p.slug === slug) || null;
}

export function productsByCategory(category) {
  return PRODUCTS.filter((p) => p.category === category);
}

// Karty uslug mieszkaja w serviceCatalog.js, bo maja wlasne strony
// szczegolowe i tyle samo tresci co produkty.
export { SERVICES_FULL as SERVICE_CARDS, getServiceCard, serviceCardsByCategory } from "./serviceCatalog.js";

const L = (pl, en, de) => ({ pl, en, de });

export const SHOP_CATEGORIES = [
  {
    id: "jewelry",
    path: "/shop/jewelry/",
    theme: "amber",
    title: L("AEJaCA Biżuteria", "AEJaCA Jewelry", "AEJaCA Schmuck"),
    lead: L(
      "Wyroby gotowe oraz usługi jubilerskie: renowacja, naprawa i biżuteria na zamówienie.",
      "Ready-made pieces and jewelry services: renovation, repair and made-to-order work.",
      "Fertige Stücke und Schmuckleistungen: Aufarbeitung, Reparatur und Anfertigung nach Maß."
    ),
  },
  {
    id: "studio",
    path: "/shop/studio/",
    theme: "blue",
    title: L("AEJaCA sTuDiO", "AEJaCA sTuDiO", "AEJaCA sTuDiO"),
    lead: L(
      "Druk 3D, grawer laserowy, odlewy żywiczne, produkty gotowe i modele do pobrania.",
      "3D printing, laser engraving, resin casting, ready-made products and downloadable models.",
      "3D-Druck, Lasergravur, Harzguss, fertige Produkte und Modelle zum Download."
    ),
  },
];
