// ============================================================
// CO KLIENT ZAMOWIL, WYPISANE PO LUDZKU, PO STRONIE SERWERA
// ============================================================
// Do 2026-09-03 opis wyboru istnial WYLACZNIE w przegladarce: koszyk i kasa
// wypisywaly go przez `describeParams`, a serwer pocztowy tego slownika nie
// widzial. Skutki byly dwa i oba zglosil wlasciciel po prawdziwym zamowieniu.
//
// Mail do pracowni wkladal do wiadomosci surowy JSON parametrow:
//   parametry: {"qtyId":"2-5","metalId":"silver","finishId":"clean",...}
// czyli tresc, ktora trzeba odszyfrowac zamiast przeczytac.
//
// Potwierdzenie dla klienta nie wkladalo ich WCALE. Pozycja, ktora w koszyku
// miala osiem wierszy ustalen, po zaplacie kurczyla sie do nazwy uslugi
// i kwoty. Nagłowek `describeParams.js` nazywa to wprost: pozycja jest trescia
// umowy, a awaria jest cicha i ujawnia sie dopiero przy sporze. Do tego ten sam
// mail powoluje sie na art. 38 pkt 3 ("rzecz wykonana wedlug Twojej
// specyfikacji") i tej specyfikacji nie podaje.
//
// SLOWNIKA NIE PISZEMY DRUGI RAZ. `orderCatalog.js` i `describeParams.js`
// jezdza do `chat-api/pricing/` razem z rdzeniem cenowym (`npm run
// sync:pricing`), wiec nowa opcja w ofercie pojawia sie w mailu sama.
//
// USLUGE ROZPOZNAJEMY PO KALKULATORZE. `order_items` nie ma kolumny z
// identyfikatorem uslugi, ale kazdy kalkulator nalezy do dokladnie jednej
// (pilnuje tego `scripts/test-opis-pozycji.mjs`), wiec opis da sie odtworzyc
// takze dla zamowien zlozonych wczesniej, bez migracji i bez wstecznego
// dopisywania czegokolwiek do bazy.

import { SERVICES, uslugaKalkulatora } from "./pricing/orderCatalog.js";
import { describeParams, ustaleniaPozycji as ustaleniaZKatalogu } from "./pricing/describeParams.js";

/** Klucze, ktore maja w mailu wlasny wiersz, wiec w opisie bylyby drugi raz. */
const OSOBNO = new Set([
  "description", "fromQuote", "serviceId",
  "personalization", "packagingId", "packagingText", "packagingTextBack",
  "wymiary", "znieksztalcony", "podloze", "spare", "materialNote",
  "svgData", "stlData", "printability", "stockId", "extended", "resinColor",
]);

/** Identyfikator uslugi dla pozycji zamowienia albo wyceny. */
export function uslugaPozycji(item) {
  return item?.params?.serviceId || uslugaKalkulatora(item?.calculator) || null;
}

/**
 * Ustalenia pozycji jako pary etykieta-wartosc, tym samym slownikiem co koszyk.
 *
 * Pusta lista znaczy "nie umiem tego opisac", a nie "nie bylo wyborow": pozycja
 * z oferty nie ma karty uslugi, bo jej tresc ustalil czlowiek.
 */
export function opisParametrow(item, lang = "pl") {
  const serviceId = uslugaPozycji(item);
  if (!serviceId || !item?.params) return [];
  return describeParams({ serviceId, params: item.params }, lang);
}

/**
 * PELNA tresc pozycji: wybory z karty uslugi, opakowanie, grawery, plik i opis.
 *
 * To jest lista, ktora klient widzial w koszyku, zanim zaplacil. Po zaplacie
 * ma zobaczyc dokladnie ja, i w potwierdzeniu, i na stronie zamowienia.
 */
export function ustaleniaPozycji(item, lang = "pl") {
  const serviceId = uslugaPozycji(item);
  if (!item) return [];
  return ustaleniaZKatalogu({ ...item, serviceId }, lang);
}

/**
 * Parametry, ktorych opis NIE objal, jako surowe pary.
 *
 * Pracownia nie moze stracic niczego, co klient wybral. Gdy oferta dostanie
 * nowe pole, a katalog jeszcze go nie opisuje, ma ono wyjsc w mailu jako
 * `klucz=wartosc`, a nie zniknac. Cichy ubytek bylby gorszy od brzydkiego
 * wiersza: pracownia zrobilaby rzecz inna niz zamowiona i nikt by nie wiedzial
 * dlaczego.
 */
export function parametryNieopisane(item, lang = "pl") {
  const params = item?.params;
  if (!params || typeof params !== "object") return [];
  const opisane = new Set(opisParametrow(item, lang).map((w) => w.klucz).filter(Boolean));
  const serviceId = uslugaPozycji(item);
  const usluga = SERVICES.find((s) => s.id === serviceId);
  const znane = new Set((usluga?.fields || []).map((f) => f.key));
  return Object.entries(params)
    .filter(([k, v]) => v != null && v !== "" && !OSOBNO.has(k) && !znane.has(k) && !opisane.has(k))
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`);
}
