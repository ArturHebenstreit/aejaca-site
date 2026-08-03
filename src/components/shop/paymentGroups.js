// ============================================================
// PODZIAL KANALOW PLATNOSCI
// ============================================================
// Czysta logika, bez widoku, zeby dalo sie ja sprawdzic testem. Regula, ktora
// pilnujemy, jest jedna: BLIK stoi na wierzchu. Reszta ma prawo sie zmieniac,
// bo liste kanalow oddaje bramka i banki w niej przychodza i znikaja.

/** Kanaly, ktore zostaja na wierzchu, w tej kolejnosci. */
const PROMOTED = [/blik/i, /google\s?pay/i, /apple\s?pay/i, /paypal/i, /karta|card|visa|mastercard/i];

export function promotionRank(name) {
  const i = PROMOTED.findIndex((re) => re.test(name || ""));
  return i === -1 ? null : i;
}

/** Bez znakow diakrytycznych i wielkosci liter: "spoldzielczy" ma znalezc "Spółdzielczy". */
export function fold(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/gi, "l")
    .toLowerCase();
}

/** Kanaly na wierzchu i reszta, czyli banki chowane pod jednym wierszem. */
export function splitMethods(methods = []) {
  const promoted = [];
  const banks = [];
  for (const m of methods) {
    const rank = promotionRank(m.name);
    if (rank === null) banks.push(m);
    else promoted.push({ ...m, rank });
  }
  promoted.sort((a, b) => a.rank - b.rank);
  return { promoted, banks };
}

export function filterBanks(banks = [], query = "") {
  const q = fold(query).trim();
  return q ? banks.filter((m) => fold(m.name).includes(q)) : banks;
}
