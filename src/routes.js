// ============================================================
// JEDNA LISTA TRAS DLA CALEGO SERWISU
// ============================================================
// Ta sama lista sciezek stala wczesniej w dwoch miejscach: w `main.jsx`
// (przegladarka, strony ladowane leniwie) i w `entry-server.jsx` (prerender,
// strony importowane zwyczajnie). Dwie listy rozjezdzaja sie przy pierwszej
// nowej stronie, i to po cichu: brakujaca pozycja nie jest bledem, tylko
// adresem, ktory dziala u klienta i nie istnieje w prerenderze, albo odwrotnie.
//
// Tutaj stoi sama TRESC trasy: sciezka bez prefiksu jezyka, nazwa komponentu
// i ewentualne wlasciwosci. Kazde z dwoch wejsc podstawia wlasna mape nazw na
// komponenty, bo tylko one wiedza, czy strona ma byc leniwa, czy nie.
//
// Sciezki sa WZGLEDNE wobec prefiksu jezyka i konczy je ukosnik, tak jak
// konczyly wczesniej. `""` to strona glowna danego jezyka.

/** Jezyki serwisu. Polski nie ma prefiksu, bo stoi pod adresami, ktore juz sa
 *  w wyszukiwarce, i nic z tego pozycjonowania nie wolno stracic. */
export const JEZYKI = ["pl", "en", "de"];
export const JEZYK_DOMYSLNY = "pl";

/** "/" dla polskiego, "/en/" i "/de/" dla pozostalych. */
export function prefiksJezyka(lang) {
  return lang === JEZYK_DOMYSLNY ? "/" : `/${lang}/`;
}

/** Sciezka publiczna dla danego jezyka: ("/studio/", "de") -> "/de/studio/". */
export function sciezkaJezyka(sciezka, lang) {
  if (typeof sciezka !== "string" || !sciezka.startsWith("/")) return sciezka;
  if (sciezka.startsWith("//")) return sciezka;
  if (lang === JEZYK_DOMYSLNY) return sciezka;
  return `/${lang}${sciezka}`;
}

/** Odwrotnosc: ("/de/studio/") -> { lang: "de", sciezka: "/studio/" }. */
export function rozbierzSciezke(pelna) {
  const m = /^\/(en|de)(\/.*)?$/.exec(pelna || "");
  if (!m) return { lang: JEZYK_DOMYSLNY, sciezka: pelna || "/" };
  return { lang: m[1], sciezka: m[2] || "/" };
}

export const TRASY = [
  { sciezka: "", komponent: "Home" },
  { sciezka: "jewelry/", komponent: "Jewelry" },
  { sciezka: "studio/", komponent: "Studio" },
  { sciezka: "blog/", komponent: "BlogIndex" },
  { sciezka: "blog/:slug/", komponent: "BlogPost" },
  { sciezka: "contact/", komponent: "Contact" },
  { sciezka: "glossary/", komponent: "Glossary" },
  { sciezka: "glossary/:id/", komponent: "GlossaryTerm" },
  { sciezka: "about/", komponent: "About" },
  { sciezka: "warranty/", komponent: "Warranty" },
  { sciezka: "returns/", komponent: "Returns" },
  { sciezka: "terms/", komponent: "Terms" },
  { sciezka: "cart/", komponent: "Cart" },
  { sciezka: "checkout/", komponent: "Checkout" },
  { sciezka: "shop/", komponent: "Shop" },
  { sciezka: "shop/jewelry/", komponent: "Shop" },
  { sciezka: "shop/studio/", komponent: "Shop" },
  { sciezka: "shop/service/:id/", komponent: "Service" },
  { sciezka: "shop/:slug/", komponent: "Product" },
  { sciezka: "order/", komponent: "Order" },
  { sciezka: "order/status/", komponent: "OrderStatus" },
  { sciezka: "quote/", komponent: "QuotePage" },
  { sciezka: "oferta/", komponent: "Offer" },
  { sciezka: "shipping/", komponent: "Shipping" },
  { sciezka: "payments/", komponent: "Payments" },
  { sciezka: "toolsjewelry/", komponent: "ToolsJewelry" },
  { sciezka: "toolsjewelry/alloy-composition/", komponent: "AlloyCompositionPage" },
  { sciezka: "toolsjewelry/metal-pricing/", komponent: "MetalPricingPage" },
  { sciezka: "toolsjewelry/ring-size/", komponent: "RingSizePage" },
  { sciezka: "toolsjewelry/ring-sizer/", komponent: "RingSizerPage" },
  { sciezka: "toolstudio/printability/", komponent: "PrintabilityPage" },
  { sciezka: "toolstudio/", komponent: "ToolsStudio" },
  { sciezka: "toolstudio/print-settings/", komponent: "PrintSettingsPage" },
  { sciezka: "toolstudio/resin-settings/", komponent: "ResinSettingsPage" },
  { sciezka: "toolstudio/laser-parameters/", komponent: "LaserParametersPage" },
  { sciezka: "toolstudio/shrinkage/", komponent: "ShrinkagePage" },
  { sciezka: "toolsjewelry/ring-blank/", komponent: "RingBlankPage" },
  { sciezka: "toolsjewelry/kreator/", komponent: "RingConfiguratorPage" },
  { sciezka: "privacy/", komponent: "Privacy" },
  { sciezka: "reviews/", komponent: "Reviews" },
  { sciezka: "b2b/", komponent: "B2B" },
  { sciezka: "druk-3d-piaseczno/", komponent: "LocalPrint3D", wlasciwosci: { city: "piaseczno" } },
  { sciezka: "druk-3d-warszawa/", komponent: "LocalPrint3D", wlasciwosci: { city: "warszawa" } },
];

/** Trasy bez parametrow, w postaci sciezek zaczynajacych sie ukosnikiem.
 *  Tego uzywa prerender i mapa witryny. */
export const TRASY_STALE = TRASY
  .filter((t) => !t.sciezka.includes(":"))
  .map((t) => "/" + t.sciezka);
