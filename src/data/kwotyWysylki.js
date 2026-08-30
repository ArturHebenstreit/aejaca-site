// ============================================================
// KWOTY DO ODPOWIEDZI O WYSYLCE
// ============================================================
// Odpowiedzi o koszty dostawy nie moga miec kwot wpisanych w tekscie: cennik
// stoi w `src/pricing/shipping.js` i zmienia sie tam, a napis w odpowiedzi
// zostalby stary. Bez slowa, bo nic sie przy tym nie psuje: klient po prostu
// czyta cene, ktorej juz nie ma.
//
// Stad jedno miejsce, ktore liczy te kwoty, i dwa miejsca, ktore je czytaja:
// strona wysylki i wspolna sekcja `/faq/`.

import { ZONES, HANDLING_GROSZE, FREE_SHIPPING_FROM_GROSZE } from "../pricing/shipping.js";

const pln = (grosze) => Math.round(grosze / 100);
/** Kwota co do grosza. Odpowiedzi, ktore podaja cene wprost ("paczkomat
 *  16,49 zl"), nie moga jej zaokraglac, bo klient porownuje ja z kasa. */
const zlote = (grosze) => (grosze / 100).toFixed(2).replace(".", ",");

export const KRAJ_OD = { kurier: pln(ZONES.pl.courierGrosze), paczkomat: pln(ZONES.pl.lockerGrosze) };
export const KRAJ_DOKLADNIE = { kurier: ZONES.pl.courierGrosze, paczkomat: ZONES.pl.lockerGrosze };
export const DARMOWA_OD = { pln: pln(FREE_SHIPPING_FROM_GROSZE), eur: 100 };
export const UE_OD = pln(ZONES.eu_near.courierGrosze + HANDLING_GROSZE);
export const UE_DO = pln(ZONES.eu_far.courierGrosze + HANDLING_GROSZE);
export const UK = pln(ZONES.eur_non_eu.courierGrosze + HANDLING_GROSZE);
export const USA = pln(ZONES.world_am.courierGrosze + HANDLING_GROSZE);
export const AZJA = pln(ZONES.world_rest.courierGrosze + HANDLING_GROSZE);

/**
 * Kwoty w ZLOTYCH, bez przeliczania na euro i bez kursu.
 *
 * Czesc odpowiedzi podaje polski cennik takze po angielsku i po niemiecku
 * ("InPost parcel locker PLN 16.49"), bo dotyczy wysylki krajowej. Takie
 * odpowiedzi nie potrzebuja kursu, wiec nie wolno im go wymagac: strona
 * glowna nie ma sie odpytywac o kursy metali po to, zeby napisac, ile
 * kosztuje paczkomat.
 *
 * Oddaje same liczby, bez waluty, bo kazdy jezyk pisze ja u siebie inaczej.
 *
 * @param {string} lang jezyk strony, rozstrzyga o przecinku albo kropce
 */
export function kwotyPln(lang) {
  const przecinek = lang !== "en";
  const liczba = (grosze) => {
    const t = (grosze / 100).toFixed(2);
    return przecinek ? t.replace(".", ",") : t;
  };
  return {
    paczkomat: liczba(KRAJ_DOKLADNIE.paczkomat),
    kurier: liczba(KRAJ_DOKLADNIE.kurier),
    darmowaOd: String(DARMOWA_OD.pln),
    ueOdPln: String(UE_OD),
    ueDoPln: String(UE_DO),
  };
}

/**
 * Kwoty gotowe do wstawienia w odpowiedz, w walucie, ktora klient widzi.
 *
 * @param {{lang: string, rates: object}} arg jezyk strony i kursy z rynku
 * @returns {object} napisy do podstawienia w odpowiedziach o wysylce
 */
export function kwotyWysylki({ lang, rates }) {
  const wEuro = lang === "en" || lang === "de";
  const kurs = rates?.pln_per_eur || 4.25;
  const kwota = (z) => (wEuro ? `€${Math.round(z / kurs)}` : `${z} zł`);
  const zakres = (od, do_) =>
    wEuro ? `€${Math.round(od / kurs)}–${Math.round(do_ / kurs)}` : `${od}–${do_} zł`;

  return {
    courier: kwota(KRAJ_OD.kurier),
    locker: kwota(KRAJ_OD.paczkomat),
    free: wEuro ? `€${DARMOWA_OD.eur}` : `${DARMOWA_OD.pln} zł`,
    eu: zakres(UE_OD, UE_DO),
    uk5: kwota(UK),
    uk10: kwota(UK),
    uk2030: kwota(UK),
    usa1: kwota(USA),
    usa10: kwota(USA),
    asia: kwota(AZJA),
    // Wersje co do grosza dla odpowiedzi, ktore podaja cene wprost.
    kurierDokladnie: wEuro ? kwota(KRAJ_OD.kurier) : `${zlote(KRAJ_DOKLADNIE.kurier)} zł`,
    paczkomatDokladnie: wEuro ? kwota(KRAJ_OD.paczkomat) : `${zlote(KRAJ_DOKLADNIE.paczkomat)} zł`,
    ueOd: kwota(UE_OD),
    ueDo: kwota(UE_DO),
  };
}
