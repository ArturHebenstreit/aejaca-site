#!/usr/bin/env node
// ============================================================
// WALUTA OFERTY I ZAPLATY
// ============================================================
// Do tej pory walute rozstrzygal jezyk: pl znaczylo zlotowki, en i de euro.
// To jest dobry domysl i zly przymus, bo waluta wynika z tego, GDZIE KLIENT
// TRZYMA PIENIADZE, a nie z tego, w jakim jezyku czyta. Polak mieszkajacy
// w Niemczech i Niemiec z polska karta nie mieli jak zaplacic po swojemu.
//
// Awarie, ktore ten test zamyka, wszystkie ciche:
//
//   1. Waluta wyswietlania rozjezdza sie z waluta zaplaty. Klient widzi euro,
//      a bramka obciaza go zlotowkami po innym kursie niz pokazany.
//   2. Rabat schodzi z kwoty w zlotowkach, a przelew opiewa na cene sprzed
//      rabatu. Klient przelewa za duzo i mamy nadplate do zwrotu.
//   3. Euro bez rachunku walutowego: wybor waluty, w ktorej nie mamy gdzie
//      przyjac pieniedzy.
//   4. Dwie tabelki "jezyk -> waluta", w kodzie strony i w backendzie, ktore
//      po pierwszej zmianie mowia co innego.
//
//   node scripts/test-offer-currency.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultCurrency, normalizeCurrency, paymentMethodForCurrency,
  eurCentsFromGrosze, EUR_FX_MARGIN, CURRENCY_BY_LANG,
} from "../src/pricing/currency.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const czytaj = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const QUOTES = czytaj("chat-api", "quotes.js");
const SERWER = czytaj("chat-api", "server.js");
const PANEL = czytaj("admin", "server.js");
const OFERTA = czytaj("src", "pages", "Offer.jsx");
const KASA = czytaj("src", "pages", "Checkout.jsx");
const MONEY = czytaj("src", "shop", "money.js");
const MIRROR = czytaj("chat-api", "pricing", "currency.js");
const BRAMKA = czytaj("chat-api", "autopay.js");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);
const ma = (tekst, wzor, opis) => (wzor.test(tekst) ? ok(opis) : zle(`NIE ${opis}`));

console.log("\n1. Jezyk podpowiada walute, nie narzuca jej\n");
{
  if (defaultCurrency("pl") === "PLN") ok("polski zaczyna od zlotowek");
  else zle("polski nie zaczyna od zlotowek");
  if (defaultCurrency("en") === "EUR" && defaultCurrency("de") === "EUR") ok("angielski i niemiecki zaczynaja od euro");
  else zle("angielski albo niemiecki nie zaczyna od euro");
  if (defaultCurrency("xx") === "EUR") ok("nieznany jezyk dostaje euro, nie wyjatek");
  else zle("nieznany jezyk wywraca regule");

  // Waluta spoza listy nie moze przejsc dalej: to ona wybiera droge platnosci.
  if (normalizeCurrency("USD", "pl") === "PLN") ok("nieznana waluta spada na domysl jezyka");
  else zle("nieznana waluta przechodzi dalej");
  if (normalizeCurrency("eur", "pl") === "EUR") ok("mala litera nie psuje wyboru");
  else zle("mala litera psuje wybor");

  // Ta sama tabelka po obu stronach. Kopia w chat-api powstaje z sync:pricing,
  // wiec rozjazd znaczy zapomniana synchronizacje.
  if (MIRROR.includes("CURRENCY_BY_LANG")) ok("kopia dla backendu zna te sama tabelke");
  else zle("kopia dla backendu nie ma tabelki walut, uruchom npm run sync:pricing");
  if (Object.keys(CURRENCY_BY_LANG).join(",") === "pl,en,de") ok("tabelka obejmuje wszystkie trzy jezyki");
  else zle(`tabelka obejmuje ${Object.keys(CURRENCY_BY_LANG)}`);
}

console.log("\n2. Waluta wybiera droge zaplaty\n");
{
  if (paymentMethodForCurrency("PLN") === "autopay") ok("zlotowki ida bramka");
  else zle("zlotowki nie ida bramka");
  if (paymentMethodForCurrency("EUR") === "bank_transfer") ok("euro idzie przelewem");
  else zle("euro nie idzie przelewem");

  // Bramka rozlicza wylacznie zlotowki, wiec nie wolno wpuscic do niej euro.
  ma(BRAMKA, /params\.Currency = "PLN"/, "bramka dalej dostaje wylacznie PLN");
  ma(SERWER, /paymentMethodForCurrency\(walutaOferty\) === "bank_transfer"/, "zaplata za oferte wynika z waluty oferty");
  ma(SERWER, /przelew && !transferConfigured\(\)/, "euro bez rachunku walutowego jest odrzucane");
  ma(SERWER, /przelew && !kursEur/, "przelew bez kursu jest odrzucany, zamiast zamrozic pusta kwote");

  // Stara regula wiazala przelew z jezykiem strony i to ona blokowala Polaka
  // z kontem w euro.
  if (/Przelew jest dostepny wylacznie przy cenach w euro/.test(SERWER)) {
    zle("w kasie sklepu zostala regula wiazaca przelew z jezykiem");
  } else ok("kasa sklepu nie wiaze przelewu z jezykiem strony");
  ma(SERWER, /walutaZadana\s*\n?\s*\? paymentMethodForCurrency\(walutaZadana\)/, "kasa sklepu czyta walute z zadania");
}

console.log("\n3. Kwota w euro liczy sie raz, w jednym miejscu\n");
{
  // Narzut i zaokraglenie w gore: kazdy inny wynik znaczy niedoplate.
  const kurs = 4.25;
  const centy = eurCentsFromGrosze(10000, kurs);
  const spodziewane = Math.ceil((10000 / kurs) * EUR_FX_MARGIN);
  if (centy === spodziewane) ok(`100 zl to ${(centy / 100).toFixed(2)} EUR po kursie ${kurs} z narzutem ${EUR_FX_MARGIN}`);
  else zle(`przeliczenie dalo ${centy}, a mialo ${spodziewane}`);
  if (eurCentsFromGrosze(1, kurs) >= 1) ok("kwota nie schodzi do zera przy groszu");
  else zle("grosz gubi sie w przeliczeniu");

  ma(QUOTES, /eurCentsFromGrosze\(total, eurRate\)/, "zamowienie z oferty zamraza kwote w euro");
  ma(QUOTES, /eur_rate_locked_at/, "zamowienie z oferty zapisuje chwile zamrozenia kursu");
  // Rabat schodzi po zapisie zamowienia, wiec kwota w euro musi zejsc razem z nim.
  ma(QUOTES, /amount_eur_cents = CASE WHEN amount_eur_cents IS NULL THEN NULL ELSE \$5 END/, "rabat schodzi takze z kwoty w euro");
  ma(QUOTES, /przelew \? "awaiting_transfer" : "awaiting_payment"/, "zamowienie za przelew czeka na ksiegowanie, nie na bramke");
}

console.log("\n4. Waluta dotyczy calej oferty\n");
{
  ma(QUOTES, /if \(patch\.currency !== undefined\)/, "panel zmienia walute oferty");
  ma(QUOTES, /bad_currency/, "waluta spoza listy jest odrzucana");
  ma(QUOTES, /normalizeCurrency\(input\.currency, lang\)/, "nowa wycena bierze walute z jezyka");

  const ile = (SERWER.match(/app\.post\("\/api\/quotes\/:ref\/currency"/g) || []).length;
  if (ile === 1) ok("trasa wyboru waluty istnieje dokladnie raz");
  else zle(`tras wyboru waluty jest ${ile}`);
  ma(SERWER, /app\.post\("\/api\/quotes\/:ref\/currency"[\s\S]{0,600}?secretMatches/, "wybor waluty chroni token z linku");
  ma(SERWER, /app\.post\("\/api\/quotes\/:ref\/currency"[\s\S]{0,900}?already_converted/, "waluty nie da sie zmienic po zlozeniu zamowienia");
  ma(SERWER, /ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency/, "kolumna waluty zaklada sie sama przy starcie");
  ma(SERWER, /UPDATE quotes SET currency = 'EUR' WHERE lang IN \('en','de'\)/, "stare oferty en i de dostaja walute, ktora ich klient juz widzial");
}

console.log("\n5. Strona pokazuje te walute, ktora klient zaplaci\n");
{
  ma(MONEY, /const \{ currency, setCurrency \} = useCurrency\(\)/, "kwoty sklepu ida za wyborem klienta");
  if (/showEur = lang === "en" \|\| lang === "de"/.test(MONEY)) zle("w kwotach sklepu zostala regula wiazaca walute z jezykiem");
  else ok("kwoty sklepu nie wiaza waluty z jezykiem");

  ma(OFERTA, /const walutaOferty = offer\?\.currency/, "strona oferty czyta walute z oferty");
  ma(OFERTA, /created\.data\.paymentMethod === "bank_transfer"/, "zaplata w euro nie idzie do bramki");
  ma(OFERTA, /zmienWalute/, "klient przestawia walute na stronie oferty");
  ma(KASA, /currency === "EUR" \? "bank_transfer" : "autopay"/, "kasa wyprowadza sposob zaplaty z waluty");
  ma(KASA, /currency,/, "kasa wysyla walute do backendu");
  // Waluta jest polem naglowka oferty, wiec idzie ta sama trasa co dane klienta
  // i termin. Zapis pozycji jej nie dotyka.
  ma(PANEL, /if \(b\.currency !== undefined\) patch\.currency = b\.currency/, "panel przekazuje walute oferty");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nWaluta oferty i zaplaty: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
