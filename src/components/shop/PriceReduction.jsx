import { reductionNotice } from "../../shop/priceHistory.js";

// ============================================================
// INFORMACJA O OBNIZCE CENY
// ============================================================
// Pojawia sie WYLACZNIE wtedy, gdy cena naprawde jest nizsza niz w ostatnich
// 30 dniach. Przy cenie niezmienionej nie ma jej wcale, bo napis "najnizsza
// cena z 30 dni" obok ceny, ktora nie zostala obnizona, sugeruje promocje,
// ktorej nie ma.
//
// Osobne zdanie dla pozycji krotszej w sprzedazy niz 30 dni: wtedy ustawa kaze
// podac cene z okresu od rozpoczecia oferowania, a nie z pelnych 30 dni.

const T = {
  pl: {
    full: (cena) => `Najniższa cena z 30 dni przed obniżką: ${cena}`,
    short: (cena) => `Najniższa cena od rozpoczęcia sprzedaży: ${cena}`,
  },
  en: {
    full: (price) => `Lowest price in the 30 days before the reduction: ${price}`,
    short: (price) => `Lowest price since this item went on sale: ${price}`,
  },
  de: {
    full: (preis) => `Niedrigster Preis der letzten 30 Tage vor der Senkung: ${preis}`,
    short: (preis) => `Niedrigster Preis seit Verkaufsbeginn: ${preis}`,
  },
};

/**
 * @param {object} p
 * @param {object} p.product  pozycja katalogu (priceGrosze, lowest30Grosze, highest30Grosze, daysOnSale)
 * @param {(grosze:number)=>string} p.money  formatowanie kwoty w walucie jezyka
 */
export default function PriceReduction({ product, money, lang = "pl", className = "" }) {
  const notice = reductionNotice({
    priceGrosze: product?.priceGrosze,
    lowest30Grosze: product?.lowest30Grosze,
    highest30Grosze: product?.highest30Grosze,
    daysOnSale: product?.daysOnSale,
  });
  if (!notice) return null;

  const t = T[lang] || T.pl;
  const text = notice.shortHistory ? t.short(money(notice.lowestGrosze)) : t.full(money(notice.lowestGrosze));
  return <p className={`text-neutral-500 text-[11px] leading-snug ${className}`}>{text}</p>;
}
