// ============================================================
// LISTA KRAJOW: WYSYLKA KONTRA NAZWY
// ============================================================
// `src/pricing/shipping.js` mowi, DOKAD wysylamy. `src/data/countryNames.js`
// mowi, JAK ten kraj sie nazywa w trzech jezykach i w jakiej kolejnosci stoi
// na liscie. Rozjazd miedzy nimi jest cichy: brakujacy kraj nie wywala strony,
// tylko znika z rozwijanej listy w kasie, wiec klient z tego kraju nie ma jak
// zlozyc zamowienia. Drugi kierunek jest lagodniejszy, ale tez mylacy: kraj na
// liscie, do ktorego nie liczymy wysylki.
//
//   node scripts/check-kraje.mjs

import { SHIPPING_COUNTRIES } from "../src/pricing/shipping.js";
import { COUNTRY_NAMES } from "../src/data/countryNames.js";

const problemy = [];
const wysylka = new Set(SHIPPING_COUNTRIES);

for (const [jezyk, lista] of Object.entries(COUNTRY_NAMES)) {
  const kody = lista.map((k) => k.code);
  const zbior = new Set(kody);

  for (const kod of SHIPPING_COUNTRIES) {
    if (!zbior.has(kod)) problemy.push(`${jezyk}: brak kraju ${kod}, do ktorego wysylamy`);
  }
  for (const kod of kody) {
    if (!wysylka.has(kod)) problemy.push(`${jezyk}: kraj ${kod} na liscie, a nie ma go w strefach wysylki`);
  }
  if (kody.length !== zbior.size) problemy.push(`${jezyk}: kod powtorzony na liscie`);

  const bezNazwy = lista.filter((k) => !k.name || k.name === k.code);
  if (bezNazwy.length) problemy.push(`${jezyk}: bez nazwy: ${bezNazwy.map((k) => k.code).join(", ")}`);

  // Kolejnosc musi byc gotowa w pliku, bo nikt jej juz nie sortuje w locie.
  const nazwy = lista.map((k) => k.name);
  const posortowane = [...nazwy].sort((a, b) => a.localeCompare(b, jezyk));
  if (nazwy.join("|") !== posortowane.join("|")) {
    const i = nazwy.findIndex((n, j) => n !== posortowane[j]);
    problemy.push(`${jezyk}: lista nie jest alfabetyczna, pierwszy rozjazd przy "${nazwy[i]}"`);
  }
}

if (problemy.length) {
  console.error("\nLista krajow rozjechana:\n");
  for (const p of problemy) console.error("  " + p);
  console.error("\nPopraw `src/data/countryNames.js`: kazdy kraj z `SHIPPING_COUNTRIES`,");
  console.error("w trzech jezykach, w kolejnosci alfabetycznej danego jezyka.\n");
  process.exit(1);
}

console.log(`Lista krajow: ${SHIPPING_COUNTRIES.length} krajow w trzech jezykach, zgodnie.`);
