// ============================================================
// POMOCNIKI DO PYTAN, BEZ ZADNYCH IMPORTOW
// ============================================================
// Ten plik NIE importuje zbiorow pytan i to jest cala jego racja bytu.
// Wspolny widok listy potrzebuje `odpowiedz`, a gdyby bral ja z `index.js`,
// kazda strona rysujaca swoje pytania ciagnelaby za soba caly zbior serwisu:
// strona platnosci wozilaby pytania o skurcz odlewniczy.

/** Odpowiedz bywa funkcja, bo niesie kwoty z cennika i nie wolno jej zamrozic
 *  w tekscie: cennik zmienia sie w jednym miejscu, a odpowiedz ma isc za nim. */
export function odpowiedz(wpis, lang, wartosci = {}) {
  const a = wpis.a[lang] || wpis.a.pl;
  return typeof a === "function" ? a(wartosci) : a;
}

/** Porownanie bez ogonkow i bez wielkosci liter: nikt nie wpisuje "przesyłka"
 *  z ogonkiem w polu wyszukiwania, a odpowiedz ma sie znalezc mimo to. */
export function normalizuj(tekst) {
  return String(tekst)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l").replace(/Ł/g, "L")
    .toLowerCase();
}
