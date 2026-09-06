// ============================================================
// POWODY REZYGNACJI: JEDNA LISTA DLA KLIENTA I DLA PANELU
// ============================================================
// Do 2026-09-06 rezygnacje wpisywal wylacznie panel, bo trasa `/cancel` stala
// za zetonem administratora. Kolumna `cancel_reason` byla wiec zawsze NASZYM
// zdaniem o tym, dlaczego klient odpadl, pisanym po fakcie i wlasnymi slowami.
// Na pytanie "dlaczego ludzie rezygnuja" nie dalo sie odpowiedziec inaczej niz
// czytajac kilkadziesiat notatek i zgadujac, ktore znacza to samo.
//
// LISTA JEST ZAMKNIETA I MA KODY, a nie same napisy. Kod trafia do bazy i po
// nim grupuje raport; napis jest tylko tym, co klient widzi, i zmienia sie
// razem z jezykiem. Gdyby do bazy szedl napis, ten sam powod podany po polsku
// i po niemiecku bylby w zestawieniu dwoma roznymi powodami.
//
// KAZDY POWOD MA POLE NA WLASNE ZDANIE, nie tylko "inny". Klient, ktory
// zaznaczy "za drogo" i dopisze "za drogo przy tym terminie", mowi cos, czego
// sama kategoria nie niesie, a to jest najcenniejsza czesc tej odpowiedzi.
//
// Polskie napisy sa BEZ RODZAJU: "zmiana zdania", a nie "zmienilem zdanie".
// Pilnuje tego `scripts/check-rodzaj-meski.mjs` (PROJECT_RULES.md).

/** @type {{id: string, label: {pl: string, en: string, de: string}}[]} */
export const POWODY_REZYGNACJI = [
  { id: "cena", label: {
    pl: "Cena okazała się za wysoka",
    en: "The price turned out too high",
    de: "Der Preis war zu hoch" } },
  { id: "termin", label: {
    pl: "Termin realizacji jest za długi",
    en: "The lead time is too long",
    de: "Die Lieferzeit ist zu lang" } },
  { id: "zmiana_zdania", label: {
    pl: "Zmiana zdania, rzecz przestała być potrzebna",
    en: "Change of mind, no longer needed",
    de: "Meinungsänderung, wird nicht mehr gebraucht" } },
  { id: "platnosc", label: {
    pl: "Problem z płatnością",
    en: "A problem with the payment",
    de: "Ein Problem mit der Zahlung" } },
  { id: "pomylka", label: {
    pl: "Pomyłka w zamówieniu, złożę je jeszcze raz",
    en: "A mistake in the order, I will place it again",
    de: "Ein Fehler in der Bestellung, ich bestelle neu" } },
  { id: "gdzie_indziej", label: {
    pl: "Znalazłam(-em) to gdzie indziej",
    en: "Found it elsewhere",
    de: "Anderswo gefunden" } },
  { id: "inny", label: {
    pl: "Inny powód",
    en: "Another reason",
    de: "Ein anderer Grund" } },
];

/** Same kody, do sprawdzenia po stronie serwera. */
export const KODY_REZYGNACJI = POWODY_REZYGNACJI.map((p) => p.id);

/** Czy taki powod znamy. Nieznany kod odrzucamy, zeby raport zostal policzalny. */
export function znanyPowod(id) {
  return KODY_REZYGNACJI.includes(String(id || ""));
}

/**
 * Zapis powodu do kolumny `cancel_reason`.
 *
 * Kod stoi PIERWSZY i jest oddzielony dwukropkiem, wiec raport grupuje po
 * prefiksie, a czlowiek czyta calosc. Notatki wpisane recznie przez panel nie
 * maja prefiksu i wpadaja w raporcie do jednego worka "wpisane recznie", co
 * jest prawda o nich, a nie strata.
 */
export function zapisPowodu(kod, wlasne = "") {
  const czysty = String(wlasne || "").trim().slice(0, 500);
  if (!znanyPowod(kod)) return czysty || null;
  return czysty ? `${kod}: ${czysty}` : kod;
}

/** Kod odczytany z zapisu. `null` znaczy notatke wpisana recznie. */
export function kodZZapisu(zapis) {
  const tekst = String(zapis || "").trim();
  const kod = tekst.split(":")[0].trim();
  return znanyPowod(kod) ? kod : null;
}

/** Etykieta powodu w jezyku odbiorcy. */
export function etykietaPowodu(id, lang = "pl") {
  const p = POWODY_REZYGNACJI.find((x) => x.id === id);
  if (!p) return null;
  return p.label[["pl", "en", "de"].includes(lang) ? lang : "pl"] || p.label.pl;
}
