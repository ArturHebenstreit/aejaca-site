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
import { readFileSync } from "node:fs";
import {
  okresy, kpi, dzienne, wedlug, tresc, lejekSklepu, lejekWycen,
  wyboryKalkulatora, narzedzia, sesje, sciezkaSesji, sygnaly,
  platnosciNieudane, rezygnacje, nieudaneKasy, KODY_REZYGNACJI,
  porzuconeKoszyki, nieudanePlatnosci, nieudaneKasyLista, zamowieniaBezZaplaty, odpadanie,
} from "./analityka.js";
// Import ponad granica katalogow jest tu bezpieczny: ten plik uruchamia sie
// wylacznie recznie przez `node`, z korzenia repozytorium, nigdy jako czesc
// wdrozonego panelu. Dzieki temu moze pelnic role, ktorej `analityka.js` (kod
// dzialajacy w produkcji, w osobnym katalogu wdrozenia) pelnic nie moze:
// sprawdzic, czy jego reczna kopia listy kodow nie rozjechala sie ze zrodlem.
import { KODY_REZYGNACJI as KODY_REZYGNACJI_ZRODLO } from "../src/data/powodyRezygnacji.js";

function atrapa(wiersze = []) {
  const zapytania = [];
  return {
    zapytania,
    query: async (sql, params) => { zapytania.push({ sql, params }); return { rows: wiersze }; },
  };
}

/** Jak `atrapa`, ale kazde kolejne wywolanie `query` oddaje NASTEPNA liste
 *  wierszy z `listy`. Potrzebne tam, gdzie jedna funkcja robi kilka roznych
 *  zapytan naraz i kazde ma zwrocic co innego. */
function atrapaSekw(...listy) {
  const zapytania = [];
  let i = 0;
  return {
    zapytania,
    query: async (sql, params) => {
      zapytania.push({ sql, params });
      const rows = listy[i] ?? [];
      i += 1;
      return { rows };
    },
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

{
  // Narzedzia: rozroznienie miedzy "wszedl" a "policzyl" jest cala wartoscia
  // tego zestawienia, wiec obie liczby musza brac sie z ROZNYCH zdarzen.
  const pool = atrapa();
  await narzedzia(pool, new Date(), new Date());
  const sql = pool.zapytania[0].sql;
  assert.match(sql, /FILTER \(WHERE category = 'tool'\)/, "uzycie liczy sie ze zdarzenia narzedzia");
  assert.match(sql, /category = 'page' AND action = 'view'/, "wejscie liczy sie z odslony");
  assert.match(sql, /toolsjewelry\|toolstudio/, "bierzemy wylacznie strony narzedziowe");
  assert.match(sql, /\(en\/\|de\/\)\?/, "razem z wersjami angielska i niemiecka");
}

// --- Ruch wlasciciela: domyslnie pominiety, na zadanie widoczny -----------
// Wlasciciel oznacza swoje urzadzenia sam (znacznik `?nolicz=1`), bo adresu IP
// nie da sie tu uzyc. Zdarzenia zapisujemy mimo oznaczenia i odsiewamy dopiero
// w zapytaniu: pusta tabela wygladalaby tak samo przy dzialajacym znaczniku
// i przy zepsutym liczniku.
{
  const pool = atrapa();
  await kpi(pool, new Date(), new Date());
  assert.match(pool.zapytania[0].sql, /AND NOT COALESCE\(internal, FALSE\)/,
    "domyslnie kokpit nie liczy ruchu wlasciciela");

  await kpi(pool, new Date(), new Date(), { zWlasnymi: true });
  assert.doesNotMatch(pool.zapytania[1].sql, /NOT COALESCE\(internal/,
    "przelacznik pokazuje ruch wlasciciela z powrotem");
}

{
  // Odsiewanie musi byc w KAZDYM zapytaniu. Jedno pominiete i kokpit mowi
  // dwie rozne prawdy na jednym ekranie.
  for (const [nazwa, wywolaj] of [
    ["dzienne", (p, o) => dzienne(p, new Date(), new Date(), o)],
    ["wedlug", (p, o) => wedlug(p, "kanal", new Date(), new Date(), 12, o)],
    ["tresc", (p, o) => tresc(p, new Date(), new Date(), 15, o)],
    ["lejekSklepu", (p, o) => lejekSklepu(p, new Date(), new Date(), o)],
    ["lejekWycen", (p, o) => lejekWycen(p, new Date(), new Date(), o)],
    ["wyboryKalkulatora", (p, o) => wyboryKalkulatora(p, new Date(), new Date(), 20, o)],
    ["narzedzia", (p, o) => narzedzia(p, new Date(), new Date(), o)],
    ["sesje", (p, o) => sesje(p, { od: new Date(), do: new Date(), ...o })],
    ["nieudaneKasy", (p, o) => nieudaneKasy(p, new Date(), new Date(), o)],
  ]) {
    const pool = atrapa();
    await wywolaj(pool, {});
    assert.match(pool.zapytania[0].sql, /AND NOT COALESCE\(internal, FALSE\)/,
      `${nazwa} odsiewa ruch wlasciciela`);
  }
}

// --- Sygnal nie moze wolac o pomoc z powodu wlasnej poprawki --------------
// 31 sierpnia 2026 licznik zaczal odsiewac roboty i oznaczac ruch wlasciciela.
// Porownanie z okresem sprzed tej daty pokazuje wiec "spadek", ktory jest
// w duzej czesci skutkiem odsiania. Alarm w takiej sytuacji wysyla wlasciciela
// w tygodniowe poszukiwanie kanalu, ktory nigdzie nie ubyl.
{
  const dane = {
    teraz: { wizyty: 100, zapytania: 3, odbicia: 20 },
    przedtem: { wizyty: 200, zapytania: 5, odbicia: 40 },
    kanaly: [], wejscia: [], lejekS: { koszyk: 0, kasa: 0, zlozone: 0, oplacone: 0, czekaja: 0 },
  };
  const stare = sygnaly({ ...dane, poprzedniOd: new Date("2026-07-01") });
  const nowe = sygnaly({ ...dane, poprzedniOd: new Date("2026-09-05") });
  const spadekStary = stare.find((x) => /Ruch/.test(x.tresc));
  const spadekNowy = nowe.find((x) => /Ruch/.test(x.tresc));
  assert.equal(spadekStary.waga, "uwaga", "porownanie przez granice pomiaru nie jest alarmem");
  assert.match(spadekStary.tresc, /NIE czytaj jako spadku/, "i mowi wprost, czego nie wolno z tego wyczytac");
  assert.equal(spadekNowy.waga, "alarm", "dwa okresy po zmianie porownuja sie normalnie");
}

// --- Zamowienie czekajace na przelew nie jest porzucone -------------------
// Zamowienie w euro jest nieoplacone z definicji, dopoki wlasciciel nie
// potwierdzi wplaty. Liczone jako porzucone zamienialo normalna kolejke
// w alarm o zepsutej bramce platniczej.
{
  const wspolne = { teraz: { wizyty: 50, zapytania: 2, odbicia: 5 }, przedtem: { wizyty: 50, zapytania: 2, odbicia: 5 },
                    kanaly: [], wejscia: [] };
  const czekaja = sygnaly({ ...wspolne, lejekS: { koszyk: 0, kasa: 0, zlozone: 8, oplacone: 2, czekaja: 6 } });
  const porzucone = sygnaly({ ...wspolne, lejekS: { koszyk: 0, kasa: 0, zlozone: 8, oplacone: 2, czekaja: 0 } });
  assert.ok(!czekaja.some((x) => /nie zostalo oplaconych/.test(x.tresc)),
    "szesc zamowien czekajacych na przelew to kolejka, nie alarm");
  assert.ok(porzucone.some((x) => /nie zostalo oplaconych/.test(x.tresc)),
    "ale zamowienia rozstrzygniete i nieoplacone alarmem sa");
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
  // Pierwsza rzecz do sprawdzenia jest POMIAR, a nie tresc strony: zapytania
  // licza sie przez `session_id`, a zgloszenie bez tej kolumny nie istnieje dla
  // analityki, choc lezy w tabeli. Alarm, ktory od razu kaze przepisywac teksty,
  // wysyla wlasciciela w zla strone na tydzien.
  assert.match(tresci, /identyfikator wizyty/, "alarm podaje pierwsza rzecz do sprawdzenia, a nie sama diagnoze");
  assert.match(tresci, /Dopiero potem patrz na formularz/, "i dopiero potem odsyla do formularza");
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

// --- Platnosci nieudane i rezygnacje: raport nad danymi, ktore juz leżą ---
// w bazie, ale dotad nikt na nie nie patrzyl (payment_notifications, orders
// anulowane). Patrz naglowek sekcji w analityka.js.

// Kopia kodow rezygnacji w panelu nie moze rozjechac sie ze zrodlem: nowy
// powod dopisany tylko po jednej stronie znaczylby, ze raport cichcem wrzuca
// go do worka "reczne", choc klient wybral go z listy.
assert.deepEqual(
  [...KODY_REZYGNACJI].sort(),
  [...KODY_REZYGNACJI_ZRODLO].sort(),
  "panel zna dokladnie te same kody rezygnacji, co formularz klienta i serwer"
);

{
  const pool = atrapaSekw(
    [{ status: "SUCCESS", ile: "41" }, { status: "FAILURE", ile: "9" }, { status: "PENDING", ile: "2" }],
    [{ szczegol: "card_declined", ile: "5" }, { szczegol: "(brak)", ile: "4" }],
    [{ kanal: 101, ile: "6" }, { kanal: 102, ile: "3" }],
    [{ zamowien_z_niepowodzeniem: "7", odzyskanych: "4" }]
  );
  const wynik = await platnosciNieudane(pool, new Date(), new Date());

  assert.equal(pool.zapytania.length, 4, "platnosci nieudane licza statusy, szczegoly, kanaly i odzysk osobnymi zapytaniami");
  const [status, szczegoly, kanaly, odzysk] = pool.zapytania;
  for (const q of [status, szczegoly, kanaly, odzysk]) {
    assert.equal(q.params.length, 2, "okno czasu idzie parametrami w kazdym z czterech zapytan");
  }
  assert.match(status.sql, /received_at >= \$1 AND received_at < \$2/, "okno liczy sie od chwili PRZYJECIA powiadomienia");
  assert.match(szczegoly.sql, /payment_status = 'FAILURE'/, "rozbicie po szczegole dotyczy wylacznie niepowodzen");
  assert.match(kanaly.sql, /gateway_id/, "rozbicie po kanale Autopay");
  assert.match(odzysk.sql, /payment_status = 'SUCCESS'/, "odzyskanie sprawdza sie po SUCCESS na tym samym order_ref");
  // SUCCESS, ktory odzyskuje zamowienie, moze przyjsc juz PO oknie: klient
  // czesto wraca dopiero nastepnego dnia. Sprawdzenie nie ma wiec prawa
  // ograniczac sie do tego samego `received_at >= $1`.
  assert.doesNotMatch(
    odzysk.sql.slice(odzysk.sql.indexOf("SUCCESS")),
    /received_at/,
    "SUCCESS, ktory ratuje zamowienie, nie jest ograniczony do okna raportu"
  );

  assert.equal(wynik.zamowienZNiepowodzeniem, 7);
  assert.equal(wynik.odzyskanych, 4, "FAILURE, po ktorym przyszedl SUCCESS, jest policzone jako odzyskane");
  assert.equal(wynik.niepowodzeniaWedlugSzczegolu[0].szczegol, "card_declined");
  assert.equal(wynik.niepowodzeniaWedlugKanalu[1].kanal, 102);
}

{
  // Rezygnacje: kod z prefiksu grupuje niezaleznie od wlasnego zdania klienta
  // dopisanego za dwukropkiem; notatka bez prefiksu (wpisana recznie przez
  // panel) i pusty zapis ida do wspolnego worka "reczne".
  const pool = atrapa([
    { cancelled_by: "klient", cancel_reason: "cena: za drogo przy tym terminie", total_grosze: 15000 },
    { cancelled_by: "klient", cancel_reason: "cena", total_grosze: 5000 },
    { cancelled_by: "panel", cancel_reason: "Klient zadzwonil i zrezygnowal telefonicznie", total_grosze: 20000 },
    { cancelled_by: null, cancel_reason: null, total_grosze: 0 },
  ]);
  const wynik = await rezygnacje(pool, new Date(), new Date());

  assert.equal(pool.zapytania[0].params.length, 2, "okno czasu idzie parametrami");
  assert.match(pool.zapytania[0].sql, /status = 'cancelled'/, "raport liczy wylacznie zamowienia anulowane");
  assert.match(pool.zapytania[0].sql, /cancelled_at >= \$1 AND cancelled_at < \$2/, "okno liczy sie od chwili REZYGNACJI, nie zlozenia zamowienia");

  const klientCena = wynik.find((w) => w.kto === "klient" && w.kod === "cena");
  assert.ok(klientCena, "rezygnacja z kodem trafia pod ten kod");
  assert.equal(klientCena.ile, 2, "wlasne zdanie klienta za dwukropkiem nie dzieli grupy");
  assert.equal(klientCena.sumaGrosze, 20000);

  const reczne = wynik.find((w) => w.kto === "panel" && w.kod === "reczne");
  assert.ok(reczne, "rezygnacja bez kodu trafia do worka recznego");
  assert.equal(reczne.ile, 2, "notatka bez prefiksu i zapis pusty ida do tego samego worka");
}

{
  const pool = atrapaSekw(
    [{ proby: "120", utworzone: "98", oplacone: "80" }],
    [{ powod: "order_create", ile: "10" }, { powod: "payment_start", ile: "6" }]
  );
  const wynik = await nieudaneKasy(pool, new Date(), new Date(), {});

  assert.equal(pool.zapytania.length, 2, "proby/utworzone/oplacone i rozbicie checkout_failed to osobne zapytania");
  assert.match(pool.zapytania[0].sql, /action = 'place_order'/, "proby licza sie z place_order");
  assert.match(pool.zapytania[0].sql, /action = 'order_created'/, "zapisane licza sie z order_created, nie z prob");
  assert.match(pool.zapytania[0].sql, /category = 'shop'/);
  assert.match(pool.zapytania[1].sql, /split_part\(label, '\|', 1\)/, "checkout_failed grupuje sie po PIERWSZYM czlonie etykiety");
  assert.match(pool.zapytania[1].sql, /action = 'checkout_failed'/);

  assert.equal(wynik.proby, 120);
  assert.equal(wynik.utworzone, 98);
  assert.equal(wynik.oplacone, 80);
  assert.equal(wynik.checkoutFailed[0].powod, "order_create");
}

// ── PORZUCENIA: pojedyncze wiersze, nie srednie ────────────────────────────
// Raporty zbiorcze mowia, CZY cos sie psuje. Przy siedmiu porzuconych koszykach
// w tygodniu srednia nie mowi nic, a siedem wierszy mowi wszystko. Te cztery
// funkcje oddaja wiersze, wiec sprawdzamy, czy pytaja o to, co obiecuja.
{
  const pool = atrapa([]);
  await porzuconeKoszyki(pool, new Date(), new Date(), {});
  const sql = pool.zapytania[0].sql;
  assert.match(sql, /ts >= \$1 AND ts < \$2/, "porzucone koszyki licza sie w oknie raportu");
  assert.match(sql, /category = 'shop'/, "i tylko ze zdarzen sklepu");
  assert.match(sql, /HAVING[\s\S]*>= 1/, "wizyta bez koszyka nie jest porzuceniem");
  // Wizyta zakonczona zaplata nie jest porzuceniem, nawet jesli po drodze cos
  // w niej padlo. SUCCESS liczymy w CALEJ historii, nie w oknie: klient wraca
  // nastepnego dnia, a raport za siedem dni nie ma prawa nazwac go porzuceniem.
  assert.match(sql, /paid_at IS NOT NULL/, "wizyta zakonczona zaplata odpada z listy");
  assert.doesNotMatch(
    sql.slice(sql.indexOf("zaplacone AS")),
    /created_at >= \$1/,
    "zaplata sprawdza sie w calej historii zamowienia, nie w oknie raportu"
  );
  assert.match(sql, /ORDER BY s\.wartosc DESC/, "od najwiekszej kwoty, bo tam boli najbardziej");
}

{
  const pool = atrapa([]);
  await nieudanePlatnosci(pool, new Date(), new Date(), {});
  const sql = pool.zapytania[0].sql;
  assert.match(sql, /payment_status = 'FAILURE'/, "lista bierze wylacznie odmowy");
  assert.match(sql, /status_details/, "z powodem odmowy, bo bank i BLIK psuja sie inaczej");
  assert.match(sql, /gateway_id/, "i z kanalem, bo to on bywa zepsuty");
  assert.match(sql, /payment_status = 'SUCCESS'/, "odzyskane poznajemy po pozniejszym SUCCESS");
  // To samo, co wyzej: klient wraca nastepnego dnia, wiec SUCCESS nie moze byc
  // zawezony do okna raportu, inaczej przy jego krawedzi kazda odmowa
  // wygladalaby na strate.
  const podzapytanie = sql.slice(sql.indexOf("SELECT 1 FROM payment_notifications"));
  assert.doesNotMatch(podzapytanie.slice(0, 200), /ts >= \$1/, "SUCCESS liczy sie bez wzgledu na okno raportu");
}

{
  const pool = atrapa([]);
  await nieudaneKasyLista(pool, new Date(), new Date(), {});
  const sql = pool.zapytania[0].sql;
  assert.match(sql, /action = 'checkout_failed'/, "lista bierze proby, po ktorych nie ma zamowienia");
  assert.match(sql, /session/, "z identyfikatorem wizyty, zeby dalo sie zobaczyc cala droge");
}

{
  const pool = atrapa([]);
  await zamowieniaBezZaplaty(pool, new Date(), new Date(), {});
  const sql = pool.zapytania[0].sql;
  assert.match(sql, /paid_at IS NULL/, "tylko nieoplacone");
  assert.match(sql, /cancel_reason/, "z powodem rezygnacji, jesli klient go podal");
  assert.match(sql, /customer_email/, "i z adresem, bo do tego klienta da sie napisac");
}

{
  // NAJWIEKSZEJ DZIURY SZUKAMY OD KOSZYKA W DOL. Przejscie "wizyty -> sklep"
  // zawsze traci najwiecej ludzi w liczbach bezwzglednych, bo wiekszosc przyszla
  // po darmowe narzedzie i nigdy nie zamierzala nic kupic. Wskazanie tego progu
  // jest prawdziwe arytmetycznie i bezuzyteczne.
  const w = odpadanie({ wizyty: 1000, sklep: 400, karta: 250, koszyk: 60, kasa: 22, zlozone: 14, oplacone: 9 });
  assert.equal(w.kroki.length, 7);
  assert.equal(w.kroki[0].stracone, 0, "pierwszy prog nie traci nikogo, bo nie ma z czego");
  assert.equal(w.kroki[1].stracone, 600);
  assert.equal(w.najwieksza.id, "koszyk", "wskazujemy prog, ktory da sie naprawic, a nie najwiekszy w liczbach");
  assert.equal(w.najwieksza.udzial, 76);
  assert.equal(odpadanie({}).najwieksza, null, "pusty okres nie wymysla dziury");
}

{
  // Raport, do ktorego nie ma jak wejsc, nie istnieje. Trasa musi stac za
  // logowaniem, bo pokazuje adresy klientow i kwoty zamowien.
  const serwer = readFileSync(new URL("./server.js", import.meta.url), "utf8");
  assert.match(serwer, /app\.get\("\/porzucenia", requireAuth/, "raport porzucen stoi za logowaniem");
  assert.match(serwer, /porzuconeKoszyki\(pool/, "trasa czyta porzucone koszyki");
  assert.match(serwer, /nieudanePlatnosci\(pool/, "i nieudane platnosci");
  assert.match(serwer, /odpadanie\(lejek\)/, "i przeklada lejek na odpadanie");
  const naglowek = readFileSync(new URL("./views/partials/header.ejs", import.meta.url), "utf8");
  assert.match(naglowek, /href: "\/porzucenia"/, "pozycja w nawigacji panelu");
  // Kazdy wiersz ma prowadzic dalej. Wiersz, ktorego nie da sie sprawdzic,
  // jest ciekawostka, a nie dana.
  const widok = readFileSync(new URL("./views/porzucenia.ejs", import.meta.url), "utf8");
  assert.match(widok, /\/analytics\/sesja\//, "wiersz porzucenia prowadzi do sciezki wizyty");
  assert.match(widok, /order_ref/, "wiersz platnosci niesie numer zamowienia");
}

console.log("Analityka panelu: zapytania i sygnaly zgodne z tym, co obiecuja");
