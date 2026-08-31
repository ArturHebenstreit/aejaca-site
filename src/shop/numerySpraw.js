// ============================================================
// NUMERY: SPRAWA, OFERTA, ZAMOWIENIE
// ============================================================
// Od 2026-08-31 (ADR-0032) klient posluguje sie JEDNYM numerem przez cala
// droge. Zgloszenie i oferta noszą numer sprawy (`WY` + data + osiem znakow),
// a zamowienie ten sam numer z koncowka mowiaca, ktora to zaplata z tej oferty:
//
//   WY20260831-A1B2C3D4       zgloszenie, potem oferta
//   WY20260831-A1B2C3D4-1     pierwsza zaplata z tej oferty
//   WY20260831-A1B2C3D4-2     druga zaplata z tej samej oferty (ADR-0026)
//   WY20260831-A1B2C3D4-1-R2  druga runda poprawek tego samego projektu
//
// Zamowienie zlozone prosto z koszyka nie ma sprawy przed soba i zostaje przy
// wlasnym numerze `AE` + data + osiem znakow. To nie jest niekonsekwencja:
// nie bylo zgloszenia, ktore mialoby ten numer przekazac.
//
// Wzorce stoja W JEDNYM MIEJSCU, bo do 2026-08-31 lezaly w dwoch plikach
// interfejsu i oba przyjmowaly wylacznie `AE...`. Zamowienie z oferty zostaloby
// przez nie odrzucone jako "zly numer", zanim ktokolwiek zapytalby o nie serwer,
// i wygladaloby to na blad klienta, a nie na nasza pomylke.

/** Sprawa albo oferta: bez koncowki. */
export const WZOR_OFERTY = /^WY\d{8}-[0-9A-F]{8}$/;

/**
 * Zamowienie: stary numer `AE`, albo numer sprawy z koncowka zaplaty
 * i ewentualna runda poprawek.
 */
export const WZOR_ZAMOWIENIA = /^(?:AE\d{8}-[0-9A-F]{8}|WY\d{8}-[0-9A-F]{8}-\d+(?:-R\d+)?)$/;

/** Czy to numer, ktory otwiera strone zamowienia. */
export const toZamowienie = (numer) => WZOR_ZAMOWIENIA.test(String(numer || "").trim().toUpperCase());

/** Czy to numer oferty, czyli sprawy bez zaplaty. */
export const toOferta = (numer) => WZOR_OFERTY.test(String(numer || "").trim().toUpperCase());

/** Przyklady do podpowiedzi w formularzach. Jedno miejsce, zeby nie rozjechaly
 *  sie z tym, co naprawde generuje backend. */
export const PRZYKLAD_OFERTY = "WY20260825-A1B2C3D4";
export const PRZYKLAD_ZAMOWIENIA = "WY20260825-A1B2C3D4-1";
