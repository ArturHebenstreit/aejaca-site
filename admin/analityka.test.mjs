// ============================================================
// ANALITYKA: CZEGO PILNUJEMY W ZAPYTANIACH KOKPITU
// ============================================================
// Zapytania analityczne maja te wlasciwosc, ze BLAD W NICH JEST NIEWIDOCZNY.
// Zle policzona konwersja nie wywala strony, tylko pokazuje liczbe, ktora
// wyglada wiarygodnie, i na jej podstawie zapada decyzja. Dlatego sprawdzamy
// nie wyglad ekranu, tylko to, co idzie do bazy.
//
// Atrapa polaczenia zapisuje zapytania i oddaje puste wiersze: sprawdzamy
// KSZTALT zapytania, a nie wynik, bo bazy tu nie ma.

import assert from "node:assert/strict";
import {
  okresy, kpi, dzienne, wedlug, tresc, lejekSklepu, lejekWycen,
  wyboryKalkulatora, sesje, sciezkaSesji, sygnaly,
} from "./analityka.js";

function atrapa(wiersze = []) {
  const zapytania = [];
  return {
    zapytania,
    query: async (sql, params) => { zapytania.push({ sql, params }); return { rows: wiersze }; },
  };
}

// --- Okresy ---------------------------------------------------------------

const o = okresy(30);
assert.equal(o.dni, 30);
assert.equal(+o.poprzedniDo, +o.od, "poprzedni okres konczy sie tam, gdzie zaczyna sie biezacy");
assert.equal(o.do - o.od, o.poprzedniDo - o.poprzedniOd, "oba okresy maja te sama dlugosc");
assert.equal(okresy(9999).dni, 365, "okres dluzszy niz rok schodzi do roku");
assert.equal(okresy("nonsens").dni, 30, "nonsens w adresie daje trzydziesci dni, a nie NaN");

// --- Wymiar nie moze wejsc do SQL-a z adresu -------------------------------
// `wymiar` przychodzi z paska adresu panelu i trafia do zapytania jako NAZWA
// KOLUMNY, wiec nie da sie go podac parametrem. Jedyna obrona jest biala lista
// i ona musi odmawiac wszystkiego spoza niej.
await assert.rejects(
  () => wedlug(atrapa(), "kraj; DROP TABLE events", new Date(), new Date()),
  /nieznany wymiar/,
  "wymiar spoza bialej listy jest odrzucany, a nie wklejany do zapytania"
);
await assert.rejects(() => wedlug(atrapa(), "haslo", new Date(), new Date()), /nieznany wymiar/);

// --- Zapytania licza to, co obiecuja --------------------------------------

{
  const pool = atrapa();
  await kpi(pool, new Date(), new Date());
  const sql = pool.zapytania[0].sql;
  assert.match(sql, /LEFT JOIN zapytania  q ON q\.session_id/, "zapytania dolaczaja sie po session_id");
  assert.match(sql, /LEFT JOIN zamowienia o ON o\.session_id/, "zamowienia dolaczaja sie po session_id");
  assert.match(sql, /paid_at IS NOT NULL/, "przychod liczy sie z zamowien OPLACONYCH");
  assert.match(sql, /odslony <= 1 AND interakcje = 0/, "odbicie to jedna strona BEZ interakcji");
  assert.equal(pool.zapytania[0].params.length, 2, "okres idzie parametrami, nie sklejaniem");
}

{
  const pool = atrapa();
  await wedlug(pool, "kanal", new Date(), new Date());
  assert.match(pool.zapytania[0].sql, /COALESCE\(kanal, '\(brak\)'\)/);
}

{
  const pool = atrapa();
  await tresc(pool, new Date(), new Date());
  const sql = pool.zapytania[0].sql;
  // Czas czytania to zdarzenie `engaged`, a nie `view`: liczenie ich razem
  // dawaloby srednia z sekund i zer, czyli liczbe bez znaczenia.
  assert.match(sql, /action = 'engaged'/);
  assert.match(sql, /category = 'page' AND action = 'view'/);
}

{
  const pool = atrapa();
  await lejekSklepu(pool, new Date(), new Date());
  const sql = pool.zapytania[0].sql;
  for (const krok of ["add_to_cart", "begin_checkout", "place_order"]) {
    assert.match(sql, new RegExp(krok), `lejek sklepu zna krok ${krok}`);
  }
  assert.match(sql, /COUNT\(DISTINCT session\)/, "lejek liczy LUDZI, a nie klikniecia");
}

{
  const pool = atrapa();
  await lejekWycen(pool, new Date(), new Date());
  assert.match(pool.zapytania[0].sql, /converted_order_id/, "zamowienie z wyceny poznajemy po kolumnie w wycenie");
}

{
  const pool = atrapa();
  await sesje(pool, { od: new Date(), do: new Date(), wymiar: "kanal", wartosc: "wyszukiwarki" });
  assert.equal(pool.zapytania[0].params.length, 3, "wartosc filtru idzie PARAMETREM");
  assert.match(pool.zapytania[0].sql, /WHERE COALESCE\(kanal, '\(brak\)'\) = \$3/);
}

{
  const pool = atrapa();
  await sesje(pool, { od: new Date(), do: new Date(), wymiar: null, wartosc: null });
  assert.equal(pool.zapytania[0].params.length, 2, "bez wymiaru nie ma trzeciego parametru");
}

{
  const pool = atrapa();
  await sciezkaSesji(pool, "abc");
  assert.deepEqual(pool.zapytania[0].params, ["abc"]);
}

{
  const pool = atrapa();
  await dzienne(pool, new Date(), new Date());
  assert.match(pool.zapytania[0].sql, /GROUP BY DATE\(start\)/, "dzien liczy sie od POCZATKU wizyty");
  await wyboryKalkulatora(pool, new Date(), new Date());
  assert.match(pool.zapytania[1].sql, /split_part\(action, ':', 1\)/, "kalkulator wyciaga sie z nazwy akcji");
}

// --- Sygnaly: prog musi dzialac w obie strony -----------------------------

{
  const wynik = sygnaly({
    teraz: { wizyty: 100, zapytania: 0, odbicia: 20 },
    przedtem: { wizyty: 200, zapytania: 5, odbicia: 40 },
    kanaly: [], wejscia: [], lejekS: { koszyk: 0, kasa: 0, zlozone: 0, oplacone: 0 },
  });
  const tresci = wynik.map((s) => s.tresc).join(" | ");
  assert.match(tresci, /Ruch spadl o 50 procent/, "spadek ruchu o polowe jest alarmem");
  assert.match(tresci, /zapytan nie ma ani jednego/, "ruch bez zapytan jest alarmem");
  assert.match(tresci, /czy formularz w ogole wysyla/, "alarm podaje pierwsza rzecz do sprawdzenia, a nie sama diagnoze");
}

{
  const wynik = sygnaly({
    teraz: { wizyty: 100, zapytania: 8, odbicia: 20 },
    przedtem: { wizyty: 98, zapytania: 7, odbicia: 22 },
    kanaly: [{ wartosc: "wyszukiwarki", wizyty: 90, zaangazowane: 60 }],
    wejscia: [{ wartosc: "/blog/", wizyty: 10, zapytania: 0, zamowienia: 0 }],
    lejekS: { koszyk: 10, kasa: 8, zlozone: 5, oplacone: 5 },
  });
  assert.equal(wynik.length, 1, "gdy nic nie odstaje, zostaje jedno zdanie");
  assert.equal(wynik[0].waga, "spokoj");
  // Strona wejscia z dziesiecioma wizytami NIE jest jeszcze sygnalem: przy tak
  // malej probce zero zapytan nie znaczy nic i alarm bylby szumem.
  assert.doesNotMatch(wynik[0].tresc, /blog/);
}

{
  const wynik = sygnaly({
    teraz: { wizyty: 100, zapytania: 5, odbicia: 20 },
    przedtem: { wizyty: 100, zapytania: 5, odbicia: 20 },
    kanaly: [],
    wejscia: [{ wartosc: "/toolstudio/laser-parameters/", wizyty: 40, zapytania: 0, zamowienia: 0 }],
    lejekS: { koszyk: 10, kasa: 2, zlozone: 5, oplacone: 2 },
  });
  const tresci = wynik.map((s) => s.tresc).join(" | ");
  assert.match(tresci, /laser-parameters/, "strona z realnym ruchem i zerem zapytan jest sygnalem");
  assert.match(tresci, /Z koszyka do kasy/, "ucieczka miedzy koszykiem a kasa jest sygnalem");
  assert.match(tresci, /nie zostalo oplaconych/, "zamowienia bez zaplaty sa alarmem");
}

console.log("Analityka panelu: zapytania i sygnaly zgodne z tym, co obiecuja");
