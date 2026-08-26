#!/usr/bin/env node
// ============================================================
// ZAPLATA ZA OFERTE: PIENIADZE, KOD RABATOWY I TRANSAKCJA
// ============================================================
// Ta sciezka jest jedynym miejscem w serwisie, w ktorym klient placi za kwote
// ustalona przez czlowieka, a nie policzona przez silnik. Wszystko, co moze tu
// pojsc zle, idzie zle po cichu: numer parametru przesuniety o jeden, znizka
// policzona od dostawy, rezerwacja kodu poza transakcja.
//
// Test uruchamia `convertQuoteToOrder` na PODSTAWIONEJ bazie: udawany `pool`
// zapisuje kazde zapytanie razem z parametrami i oddaje z gory ustalone wiersze.
// Dzieki temu sprawdzamy zachowanie, a nie ksztalt kodu, i robimy to bez bazy,
// ktorej w tym srodowisku nie ma.
//
// Zamkniete tu awarie:
//   1. INSERT z inna liczba `$N` niz przekazanych parametrow. Postgres odmawia,
//      ale dopiero na produkcji; tutaj wychodzi od razu.
//   2. Znizka schodzaca z kosztu dostawy albo ponizej zera.
//   3. Rezerwacja kodu poza BEGIN/COMMIT, czyli dwoch klientow z tym samym
//      kodem jednorazowym.
//   4. Odliczenie za projekt zapisane na nowym zamowieniu zamiast na starym,
//      przez co ten sam projekt dalby sie odliczyc drugi raz.
//   5. Zgoda na regulamin zapisana mimo jej braku.
//
//   node scripts/test-offer-payment.mjs

import { readFileSync } from "node:fs";
import { convertQuoteToOrder, quoteItemsForDiscount } from "../chat-api/quotes.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

const WYCENA = {
  id: 7, quote_ref: "WY20260825-A1B2C3D4", lang: "pl", status: "sent",
  customer_email: "klient@example.com", customer_name: "Klient", customer_phone: "600000000",
  total_grosze: 50000, ip_hash: null, converted_order_id: null, valid_until: "2026-09-10",
};
const POZYCJE = [
  { id: 1, calculator: "print3d_fdm", title: "Wydruk", qty: 2, unit_grosze: 20000, line_grosze: 40000, params: {}, description: "opis", file_name: null, upload_id: null },
  { id: 2, calculator: "jewelry_new", title: "Sygnet", qty: 1, unit_grosze: 10000, line_grosze: 10000, params: null, description: null, file_name: null, upload_id: null },
];

/**
 * Udawana baza. Oddaje wiersze po ksztalcie zapytania i zapisuje wszystko,
 * co zostalo wykonane, razem z tym, na ktorym polaczeniu.
 */
function fakePool({ kredyt = null } = {}) {
  const log = [];
  const odpowiedz = (sql) => {
    if (/FROM quotes WHERE quote_ref/.test(sql)) return { rows: [WYCENA] };
    if (/FROM quote_items/.test(sql)) return { rows: POZYCJE };
    if (/JOIN order_items i ON i\.order_id = o\.id AND i\.calculator = 'cad_design'/.test(sql)) {
      return { rows: kredyt ? [kredyt] : [] };
    }
    if (/INSERT INTO orders/.test(sql)) return { rows: [{ id: 999 }] };
    return { rows: [] };
  };
  const query = (gdzie) => async (sql, params) => {
    log.push({ gdzie, sql: String(sql), params: params || null });
    return odpowiedz(String(sql));
  };
  return {
    log,
    query: query("pool"),
    connect: async () => ({ query: query("client"), release() {} }),
  };
}

const znajdz = (log, wzor) => log.find((z) => wzor.test(z.sql));

/**
 * Wartosc zapisana do wskazanej KOLUMNY, a nie do wskazanego miejsca w tablicy.
 *
 * Wczesniej test siegal po `params.at(-2)` i trzymal sie tego, ze zgody stoja
 * na koncu listy. Dopisanie dwoch kolumn (kwota w euro, kurs) przesunelo je
 * o dwa miejsca i test zaczal sprawdzac kurs zamiast zgody, choc zapis byl
 * poprawny. Ustalamy wiec pozycje z samego zapytania: numer kolumny w liscie
 * `INSERT INTO ... (...)` wskazuje pozycje w klauzuli VALUES, a ta niesie
 * `$n` albo wartosc wpisana wprost.
 */
function wartoscKolumny(zapis, kolumna) {
  const kolumny = zapis.sql.slice(zapis.sql.indexOf("(") + 1, zapis.sql.indexOf(")"))
    .split(",").map((k) => k.trim());
  const i = kolumny.indexOf(kolumna);
  if (i < 0) return { brak: true };

  const odVALUES = zapis.sql.slice(zapis.sql.indexOf("VALUES"));
  const tuple = odVALUES.slice(odVALUES.indexOf("(") + 1, odVALUES.lastIndexOf(")"));
  // Podzial po przecinkach spoza nawiasow: CASE WHEN ... END niesie wlasne.
  const pola = [];
  let glebokosc = 0;
  let biezace = "";
  for (const znak of tuple) {
    if (znak === "(") glebokosc++;
    if (znak === ")") glebokosc--;
    if (znak === "," && glebokosc === 0) { pola.push(biezace.trim()); biezace = ""; continue; }
    biezace += znak;
  }
  pola.push(biezace.trim());

  const pole = pola[i];
  if (pole === undefined) return { brak: true };
  const m = pole.match(/^\$(\d+)/);
  return m ? { wartosc: zapis.params[Number(m[1]) - 1] } : { literal: pole };
}
const indeks = (log, wzor) => log.findIndex((z) => wzor.test(z.sql));

console.log("\n1. Kazdy parametr ma swoje miejsce w zapytaniu\n");
{
  const pool = fakePool();
  await convertQuoteToOrder(pool, WYCENA.quote_ref, {
    orderRef: "ZAM-1",
    delivery: { method: "courier", country: "PL", shippingGrosze: 1949, addressLine1: "Ulica 1", postalCode: "00-001", city: "Warszawa" },
    consents: { terms: true, waiveWithdrawal: true },
  });

  for (const zapis of pool.log.filter((z) => /INSERT|UPDATE/.test(z.sql) && z.params)) {
    const najwyzszy = Math.max(0, ...[...zapis.sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
    if (najwyzszy !== zapis.params.length) {
      zle(`zapytanie uzywa $${najwyzszy}, a dostalo ${zapis.params.length} parametrow: ${zapis.sql.slice(0, 60)}...`);
    }
  }
  if (!bledy) ok(`${pool.log.filter((z) => z.params).length} zapytan ma tyle parametrow, ile miejsc`);

  const zamowienie = znajdz(pool.log, /INSERT INTO orders/);
  if (zamowienie.params[4] === 50000 + 1949) ok("suma to kwota oferty powiekszona o dostawe");
  else zle(`suma wyszla ${zamowienie.params[4]} zamiast ${50000 + 1949}`);

  if (wartoscKolumny(zamowienie, "accepted_terms_at").wartosc instanceof Date) ok("zgoda na regulamin zapisana z data");
  else zle("zgoda na regulamin nie zostala zapisana");
  if (wartoscKolumny(zamowienie, "waived_withdrawal_at").wartosc instanceof Date) ok("zrzeczenie sie odstapienia zapisane z data");
  else zle("zrzeczenie sie odstapienia nie zostalo zapisane");
}

console.log("\n2. Bez zgody nie ma daty zgody\n");
{
  const pool = fakePool();
  await convertQuoteToOrder(pool, WYCENA.quote_ref, {
    orderRef: "ZAM-2",
    delivery: { method: "pickup", shippingGrosze: 0 },
    consents: null,
  });
  const zamowienie = znajdz(pool.log, /INSERT INTO orders/);
  if (wartoscKolumny(zamowienie, "accepted_terms_at").wartosc === null
      && wartoscKolumny(zamowienie, "waived_withdrawal_at").wartosc === null) ok("brak zgody zostaje pusty, nic sie nie domyslamy");
  else zle("puste zgody zapisaly sie jako udzielone");
}

console.log("\n3. Znizka nie dotyka dostawy i nie schodzi ponizej zera\n");
{
  const pool = fakePool();
  const wynik = await convertQuoteToOrder(pool, WYCENA.quote_ref, {
    orderRef: "ZAM-3",
    delivery: { method: "courier", country: "PL", shippingGrosze: 1949 },
    consents: { terms: true },
    discount: { code: "AEJ-TEST", reserve: async () => ({ code: "AEJ-TEST", discountGrosze: 5000 }) },
  });
  if (wynik.totalGrosze === 50000 - 5000 + 1949) ok("znizka zeszla z pozycji, dostawa zostala nietknieta");
  else zle(`do zaplaty wyszlo ${wynik.totalGrosze} zamiast ${50000 - 5000 + 1949}`);

  const pool2 = fakePool();
  const wynik2 = await convertQuoteToOrder(pool2, WYCENA.quote_ref, {
    orderRef: "ZAM-4",
    delivery: { method: "courier", country: "PL", shippingGrosze: 1949 },
    consents: { terms: true },
    // Kod wiekszy niz cala oferta. Nie ma prawa zrobic z dostawy darmowej,
    // ani tym bardziej oddac klientowi pieniedzy.
    discount: { code: "AEJ-DUZY", reserve: async () => ({ code: "AEJ-DUZY", discountGrosze: 90000 }) },
  });
  if (wynik2.totalGrosze === 1949) ok("znizka wieksza od oferty zostawia sama dostawe");
  else zle(`znizka ponad kwote dala ${wynik2.totalGrosze} zamiast 1949`);
}

console.log("\n4. Rezerwacja kodu zyje i ginie razem z zamowieniem\n");
{
  const pool = fakePool();
  let gdzieRezerwacja = null;
  await convertQuoteToOrder(pool, WYCENA.quote_ref, {
    orderRef: "ZAM-5",
    delivery: { method: "pickup", shippingGrosze: 0 },
    consents: { terms: true },
    discount: {
      code: "AEJ-TEST",
      reserve: async (client, dane) => {
        gdzieRezerwacja = { log: pool.log.length, orderId: dane.orderId, klient: typeof client?.query === "function" };
        return { code: "AEJ-TEST", discountGrosze: 1000 };
      },
    },
  });

  const iBegin = indeks(pool.log, /^BEGIN$/);
  const iCommit = indeks(pool.log, /^COMMIT$/);
  if (iBegin >= 0 && iCommit > iBegin && gdzieRezerwacja.log > iBegin && gdzieRezerwacja.log < iCommit) {
    ok("kod rezerwuje sie miedzy BEGIN a COMMIT, wiec blokada wiersza cos znaczy");
  } else {
    zle(`rezerwacja stoi poza transakcja (BEGIN ${iBegin}, rezerwacja ${gdzieRezerwacja?.log}, COMMIT ${iCommit})`);
  }
  if (gdzieRezerwacja.klient) ok("rezerwacja dostaje polaczenie transakcji, nie pule");
  else zle("rezerwacja dostala cos, co nie umie pytac bazy");
  if (gdzieRezerwacja.orderId === 999) ok("rezerwacja zna numer zamowienia, wiec da sie ja pozniej zwolnic");
  else zle(`rezerwacja dostala orderId ${gdzieRezerwacja.orderId}`);

  // Kontrola negatywna: kod odrzucony przez baze ma wycofac cale zamowienie.
  const pool2 = fakePool();
  let rzucil = false;
  try {
    await convertQuoteToOrder(pool2, WYCENA.quote_ref, {
      orderRef: "ZAM-6",
      delivery: { method: "pickup", shippingGrosze: 0 },
      consents: { terms: true },
      discount: { code: "AEJ-ZUZYTY", reserve: async () => { throw new Error("kod zuzyty"); } },
    });
  } catch { rzucil = true; }
  const cofniete = znajdz(pool2.log, /^ROLLBACK$/);
  const zatwierdzone = znajdz(pool2.log, /^COMMIT$/);
  if (rzucil && cofniete && !zatwierdzone) ok("odrzucony kod wycofuje zamowienie zamiast zostawiac je bez znizki");
  else zle("odrzucony kod nie wycofal zamowienia");
}

console.log("\n5. Odliczenie za projekt zuzywa STARE zamowienie\n");
{
  const pool = fakePool({ kredyt: { id: 42, order_ref: "ZAM-PROJEKT", items_total_grosze: 20000 } });
  await convertQuoteToOrder(pool, WYCENA.quote_ref, {
    orderRef: "ZAM-7",
    delivery: { method: "pickup", shippingGrosze: 0 },
    consents: { terms: true },
  });
  // Szukamy ZAPISU, nie zapytania. `credit_consumed_by` stoi tez w warunku
  // SELECT-a szukajacego projektu, wiec sam ten napis trafia w dwa rozne
  // zapytania i porownanie leci na niewlasciwym.
  const zapis = znajdz(pool.log, /UPDATE orders SET credit_consumed_by/);
  if (!zapis) {
    zle("odliczenie nie zostalo nigdzie zapisane");
  } else if (zapis.params[0] === 42 && zapis.params[1] === 999) {
    ok("zuzyty zostaje projekt (42), a wskazuje na nowe zamowienie (999)");
  } else {
    zle(`odliczenie zapisane odwrotnie: ${JSON.stringify(zapis.params)}, przez co projekt dalby sie odliczyc drugi raz`);
  }
}

console.log("\n6. Pozycje do znizki niosa dzial, a nie sam tytul\n");
{
  const pozycje = quoteItemsForDiscount({ items: POZYCJE });
  const dzialy = pozycje.map((p) => p.category);
  if (dzialy[0] === "studio" && dzialy[1] === "jewelry") ok("druk idzie do sTuDiO, bizuteria do jubilerki");
  else zle(`dzialy wyszly ${JSON.stringify(dzialy)}`);
  if (pozycje.every((p) => p.source === "service")) ok("wszystkie pozycje oferty to uslugi, wiec kod na produkty ich nie obejmie");
  else zle("pozycja oferty udaje towar z polki");
}

console.log("\n7. Strona oferty jest wpieta we wszystkie trzy listy tras\n");
{
  const czytaj = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
  const listy = [
    ["src/main.jsx", /path="\/oferta\/"/],
    ["src/entry-server.jsx", /path="\/oferta\/"/],
    ["scripts/prerender.mjs", /"\/oferta"/],
  ];
  for (const [plik, wzor] of listy) {
    if (wzor.test(czytaj(`../${plik}`))) ok(`${plik} zna trase oferty`);
    else zle(`${plik} nie zna trasy oferty, wiec Cloudflare odda twarde 404`);
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nZaplata za oferte: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
