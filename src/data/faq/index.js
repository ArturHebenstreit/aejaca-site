// ============================================================
// WSZYSTKIE PYTANIA SERWISU, JEDEN ZBIOR
// ============================================================
// Pytania mieszkaja przy swoich dziedzinach: bizuteryjne w `bizuteria.js`,
// warsztatowe w `studio.js`, o kruszec w `wycenaMetalu.js` i tak dalej. Strona
// bierze WYLACZNIE swoj plik, wiec strona glowna nie wozi ze soba pytan
// o skurcz odlewniczy.
//
// Ten plik scala je w jedno i importuje go TYLKO `/faq/`, czyli jedyne miejsce,
// ktore pokazuje komplet. Dzieki temu wspolna sekcja jest naprawde wspolna, a
// pozostale strony nie tyja o tresc, ktorej nie wyswietlaja.
//
// Zasada podzialu (ustalenie wlasciciela, 2026-08-30): pytanie o bizuterie
// widac na stronie bizuterii, pytanie o sTuDiO na stronie sTuDiO, a wyszukac
// da sie KAZDE w jednym miejscu, pod "Marka AEJaCA".

import sklep from "./sklep.js";
import marka from "./marka.js";
import bizuteria from "./bizuteria.js";
import studio from "./studio.js";
import b2b from "./b2b.js";
import wysylka from "./wysylka.js";
import miarka from "./miarka.js";
import drukowalnosc from "./drukowalnosc.js";
import wycenaMetalu from "./wycenaMetalu.js";
import skurcz from "./skurcz.js";
import zywice from "./zywice.js";
import { odpowiedz, normalizuj } from "./pomoc.js";

/** Kolejnosc tematow jest kolejnoscia filtrow i kolejnoscia pytan na `/faq/`.
 *  Idzie od tego, co klient poznaje najpierw, do tego, o co pyta na koncu. */
export const FAQ_TEMATY = [
  { id: "firma", label: { pl: "O AEJaCA", en: "About AEJaCA", de: "Über AEJaCA" } },
  { id: "bizuteria", label: { pl: "Biżuteria", en: "Jewelry", de: "Schmuck" } },
  { id: "studio", label: { pl: "sTuDiO", en: "sTuDiO", de: "sTuDiO" } },
  { id: "platnosc", label: { pl: "Płatność", en: "Payment", de: "Zahlung" } },
  { id: "oferta", label: { pl: "Oferty i wyceny", en: "Offers and quotes", de: "Angebote" } },
  { id: "realizacja", label: { pl: "Realizacja", en: "Order process", de: "Ablauf" } },
  { id: "dostawa", label: { pl: "Dostawa i odbiór", en: "Delivery", de: "Lieferung" } },
  { id: "narzedzia", label: { pl: "Narzędzia", en: "Tools", de: "Werkzeuge" } },
  { id: "b2b", label: { pl: "Współpraca B2B", en: "B2B", de: "B2B" } },
];

const ZBIORY = [marka, bizuteria, studio, sklep, wysylka, miarka, drukowalnosc, wycenaMetalu, skurcz, zywice, b2b];

/** Wszystkie pytania, poukladane wedlug kolejnosci tematow. */
export const FAQ = FAQ_TEMATY.flatMap((t) => ZBIORY.flat().filter((f) => f.temat === t.id));

export function faqTematu(temat) {
  return FAQ.filter((f) => f.temat === temat);
}

export { odpowiedz, normalizuj } from "./pomoc.js";

/**
 * Szukanie po tresci pytania i odpowiedzi, z opcjonalnym zawezeniem do tematu.
 * Fraza dzieli sie na slowa i KAZDE musi wystapic: "wysylka niemcy" ma znalezc
 * jedna odpowiedz, a nie wszystko, co mowi o wysylce.
 */
export function szukajFaq(fraza, lang, temat = null, wartosci = {}) {
  const podstawa = temat ? faqTematu(temat) : FAQ;
  const slowa = normalizuj(fraza).split(/\s+/).filter(Boolean);
  if (!slowa.length) return podstawa;
  return podstawa.filter((f) => {
    const stog = normalizuj(`${f.q[lang] || f.q.pl} ${odpowiedz(f, lang, wartosci)}`);
    return slowa.every((s) => stog.includes(s));
  });
}
