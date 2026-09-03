// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/data/describeParams.js
// Regeneracja: npm run sync:pricing

// ============================================================
// CO KLIENT WYBRAL, WYPISANE PO LUDZKU
// ============================================================
// Pozycja w koszyku jest TRESCIA UMOWY. Klient klika "zamawiam" pod tym, co
// widzi, i to jest jedyna rzecz, na ktora sie zgodzil. Koszyk pokazywal
// dotad nazwe uslugi, plik i opis, a caly zestaw ustawien (material, tryb
// pracy, powierzchnia, szczegolowosc, naklad, podloze) siedzial w pozycji
// jako `params` i nigdzie sie nie wyswietlal.
//
// To jest awaria cicha i ujawnia sie najpozniej ze wszystkich: dopiero przy
// sporze, kiedy nikt juz nie pamieta, co bylo na ekranie. Klient twierdzi,
// ze zamawial ciecie w sklejce, my mamy w bazie akryl 8 mm, i obie strony
// maja racje, bo nikt tego nie pokazal.
//
// SLOWNIKA NIE PISZEMY DRUGI RAZ. Karty uslug w `orderCatalog.js` juz maja
// `fields: [{ key, label, options }]`, czyli dokladnie mape "identyfikator
// parametru -> nazwa i lista wartosci". Czytamy ja, wiec nowa opcja pojawi
// sie w koszyku sama, a usunieta zniknie. Kopia tej mapy rozjechalaby sie
// przy pierwszej zmianie oferty i nikt by tego nie zauwazyl, bo koszyk
// dalej pokazywalby poprawnie wygladajace zdania.

import { getService } from "./orderCatalog.js";
import { getPackaging } from "../pricing/packaging.js";
import { DISTORTION_NOTE } from "../pricing/quoteSummary.js";
import { t } from "../pricing/config.js";
import { SUBSTRATES, SPARE_LABEL, SUBSTRATE_LABEL } from "./laserSubstrate.js";

/** Pola techniczne, ktore nie sa wyborem klienta i nic mu nie mowia. */
const TECHNICZNE = new Set([
  "svgData", "stlData", "printability", "stockId", "extended",
]);

const DODATKOWE = {
  pl: { materialNote: "Materiał (opis)", spare: "Zapas materiału", extended: "Obszar roboczy", extendedYes: "rozszerzony (przelotka)", wymiary: "Wymiary wyrobu", znieksztalcony: "Uwaga", resinColor: "Kolor żywicy" },
  en: { materialNote: "Material (description)", spare: "Spare material", extended: "Work area", extendedYes: "extended (pass-through)", wymiary: "Finished size", znieksztalcony: "Note", resinColor: "Resin colour" },
  de: { materialNote: "Material (Beschreibung)", spare: "Materialreserve", extended: "Arbeitsbereich", extendedYes: "erweitert (Passthrough)", wymiary: "Fertigmaß", znieksztalcony: "Hinweis", resinColor: "Harzfarbe" },
};

/**
 * Wartosc opcji po ludzku.
 *
 * Czesc pol ma liste ZALEZNA od innej odpowiedzi (`optionsFrom`): zywica
 * zalezy od zastosowania, bo do wzorca odlewniczego nie proponujemy zywicy
 * modelarskiej. Bez wywolania tej funkcji koszyk pokazywal surowy
 * identyfikator ("standard") zamiast nazwy, czyli nic.
 */
function etykietaOpcji(pole, wartosc, params, lang) {
  const opcje = pole?.options?.length
    ? pole.options
    : (typeof pole?.optionsFrom === "function" ? pole.optionsFrom(params || {}) || [] : []);
  const trafiona = opcje.find((o) => String(o.id) === String(wartosc));
  return trafiona ? t(trafiona.label, lang) : null;
}

/**
 * Wszystkie ustalenia pozycji jako pary etykieta-wartosc.
 *
 * @param {{serviceId?: string, calculator?: string, params?: object}} pozycja
 * @param {string} lang
 * @returns {{label: string, value: string}[]}
 */
export function describeParams(pozycja, lang = "pl") {
  const params = pozycja?.params;
  if (!params || typeof params !== "object") return [];
  const service = getService(pozycja.serviceId) || null;
  const extra = DODATKOWE[lang] || DODATKOWE.pl;
  const wypisane = new Set();
  const wynik = [];

  // 1. Kolejnosc bierzemy z karty uslugi, bo w tej samej kolejnosci klient
  //    odpowiadal na pytania. Lista posortowana alfabetycznie byla by
  //    poprawna i nieczytelna.
  for (const pole of service?.fields || []) {
    const wartosc = params[pole.key];
    if (wartosc == null || wartosc === "" || TECHNICZNE.has(pole.key)) continue;
    wypisane.add(pole.key);
    const etykieta = t(pole.label, lang);
    // Podloze ma wlasna liste w `laserSubstrate.js`, a nie w polach uslugi,
    // gdy pozycja przyszla z szybkiej wyceny.
    const wartoscTekst = etykietaOpcji(pole, wartosc, params, lang)
      || (pole.key === "podloze" ? t(SUBSTRATES.find((s) => s.id === wartosc)?.label, lang) : null)
      || String(wartosc);
    wynik.push({ label: etykieta, value: wartoscTekst });
  }

  // 2. Pozycja z szybkiej wyceny nie ma karty uslugi z pelnym zestawem pol,
  //    a te trzy ustalenia sa czescia umowy tak samo jak reszta.
  if (!wypisane.has("podloze") && params.podloze) {
    const s = SUBSTRATES.find((x) => x.id === params.podloze);
    if (s) wynik.push({ label: t(SUBSTRATE_LABEL, lang), value: t(s.label, lang) });
  }
  if (params.materialNote) {
    wynik.push({ label: extra.materialNote, value: String(params.materialNote) });
  }
  if (params.spare) {
    wynik.push({ label: t(SPARE_LABEL, lang), value: String(params.spare) });
  }
  // WYMIARY WYROBU SA USTALENIEM, nie ustawieniem kalkulatora. Bez tej linii
  // klient dostawal potwierdzenie, z ktorego nie wynikalo, jak duza rzecz
  // zamowil, a przy rozjechanych osiach takze to, ze ksztalt zostal zmieniony.
  if (params.wymiary) {
    wynik.push({ label: extra.wymiary, value: String(params.wymiary) });
  }
  // ZNIEKSZTALCENIE JEST OSOBNYM WIERSZEM, a nie dopiskiem przy wymiarach.
  // Klient ma na to przystac swiadomie: wykonamy rzecz o innych proporcjach
  // niz plik, ktory przyslal.
  if (params.znieksztalcony) {
    wynik.push({ label: extra.znieksztalcony, value: DISTORTION_NOTE[lang] || DISTORTION_NOTE.pl, uwaga: true });
  }
  // KOLOR ZYWICY JEST USTALENIEM, choc nie wchodzi do kwoty. Klient wybieral
  // go na ekranie i widzial w podsumowaniu, a pozycja go nie niosla: zamowienie
  // szlo do pracowni bez koloru, wiec szary wyjezdzal zamiast przezroczystego.
  // Nazwy kolorow zostaja w oryginale, bo tak sa opisane na butelkach i tak je
  // zamawiamy u dostawcy; tlumaczona "Przezroczysta" nie wskazuje jednej z nich.
  if (params.resinColor) {
    wynik.push({ label: extra.resinColor, value: String(params.resinColor) });
  }
  // Stary koszyk moze jeszcze niesc `extended` z czasow, gdy stol byl pytaniem.
  // Nowe pozycje go nie maja: wylicza go rdzen cenowy z wielkosci pracy.
  if (params.extended) {
    wynik.push({ label: extra.extended, value: extra.extendedYes });
  }

  return wynik;
}

/** To samo w jednej linii, do maila i do panelu. */
export function describeParamsLine(pozycja, lang = "pl") {
  return describeParams(pozycja, lang).map((p) => `${p.label}: ${p.value}`).join(" | ");
}

/**
 * Etykiety ustalen, ktore NIE sa polem karty uslugi.
 *
 * Opakowanie, grawer i opis zlecenia nie stoja w `fields`, bo nie wchodza do
 * wyceny przez kalkulator, a mimo to sa czescia umowy. Etykiety stoja tutaj,
 * a nie w koszyku, bo czyta je takze serwer pocztowy: potwierdzenie ma
 * pokazywac dokladnie to, co klient widzial przed zaplata, a dwie listy
 * napisane osobno rozjechalyby sie przy pierwszej zmianie.
 */
export const ETYKIETY_USTALEN = {
  pl: { packaging: "Opakowanie", engraving: "Grawer na wyrobie", engravingLid: "Grawer na wieku",
        engravingBack: "Grawer wewnątrz wieka", file: "Plik", description: "Opis zlecenia" },
  en: { packaging: "Packaging", engraving: "Engraving on the piece", engravingLid: "Engraving on the lid",
        engravingBack: "Engraving inside the lid", file: "File", description: "Job description" },
  de: { packaging: "Verpackung", engraving: "Gravur auf dem Stück", engravingLid: "Gravur auf dem Deckel",
        engravingBack: "Gravur innen im Deckel", file: "Datei", description: "Auftragsbeschreibung" },
};

/**
 * PELNA tresc pozycji: wybory z karty uslugi plus wszystko, co klient dopisal.
 *
 * `describeParams` opisuje same pola uslugi. Ta funkcja dokleja reszte umowy:
 * opakowanie, trzy niezalezne teksty graweru, nazwe pliku i opis zlecenia.
 * Uzywa jej potwierdzenie mailem i strona zamowienia, zeby po zaplacie klient
 * widzial to samo, co widzial w koszyku, a nie sama nazwe uslugi i kwote.
 *
 * Przyjmuje OBA ksztalty pozycji: koszykowy, gdzie te pola stoja na wierzchu,
 * i bazowy, gdzie zapis do `order_items` wklada je do `params`.
 */
export function ustaleniaPozycji(pozycja, lang = "pl") {
  const e = ETYKIETY_USTALEN[lang] || ETYKIETY_USTALEN.pl;
  const p = pozycja?.params || {};
  const zPozycji = (klucz) => pozycja?.[klucz] ?? p[klucz] ?? null;
  const wynik = [...describeParams(pozycja, lang)];

  const pack = getPackaging(zPozycji("packagingId"));
  if (pack) wynik.push({ label: e.packaging, value: t(pack.label, lang) });
  const cudzyslow = (v) => `\u201e${v}\u201d`;
  if (zPozycji("personalization")) wynik.push({ label: e.engraving, value: cudzyslow(zPozycji("personalization")) });
  if (zPozycji("packagingText")) wynik.push({ label: e.engravingLid, value: cudzyslow(zPozycji("packagingText")) });
  if (zPozycji("packagingTextBack")) wynik.push({ label: e.engravingBack, value: cudzyslow(zPozycji("packagingTextBack")) });
  const plik = pozycja?.fileName ?? pozycja?.file_name ?? null;
  if (plik) wynik.push({ label: e.file, value: String(plik) });
  if (zPozycji("description")) wynik.push({ label: e.description, value: String(zPozycji("description")) });
  return wynik;
}
