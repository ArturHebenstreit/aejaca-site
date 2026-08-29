#!/usr/bin/env node
// ============================================================
// KOLEJKA PRACOWNI: ETAPY, PRZEJSCIA I KOLUMNY POD NIMI
// ============================================================
// `chat-api/productionQueue.js` zostal wydzielony z serwera po to, zeby regule
// przejsc dalo sie sprawdzic bez stawiania bazy. Do tej pory nikt tego nie
// robil, wiec plik mial komentarz o testowalnosci i zero testow.
//
// Klasa awarii jest tu cicha, dokladnie jak przy geometrii: zadna kwota sie
// nie zmienia. Zle przejscie robi z zamowienia NIEOPLACONEGO zamowienie
// WYSLANE, panel pokazuje zielony wiersz, a rzecz wychodzi dopiero wtedy, gdy
// klient pyta, gdzie jest paczka, ktorej nikt nie nadal i za ktora nikt nie
// zaplacil.
//
// Test pilnuje czterech rzeczy:
//   1. wypisane przejscia dzialaja, w tym swiadomy skrot paid -> shipped,
//   2. przejscia spoza listy sa odrzucane, ze `awaiting_payment` na czele,
//   3. nazwa kolumny ze stemplem jest bezpiecznym identyfikatorem, bo trafia
//      do UPDATE przez interpolacje, a nie przez parametr,
//   4. kazda taka kolumna naprawde powstaje przy starcie serwera, i kazdy
//      status z reguly istnieje w ograniczeniu tabeli `orders`,
//   5. korekta etapu nie jest furtka do obejscia punktu 2, a cofniecie kasuje
//      stemple, ktore przestaly byc prawda,
//   6. usuwanie zamowienia wymaga potwierdzenia i chodzi w transakcji.
//
//   node scripts/test-production-queue.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ETAPY_PRACY, ETAPY_KOLEJNO, przejscie, korekta, etapPoZaplacie, terminRealizacji,
         dniDoTerminu, zegarBiegnie, ETAP_STARTU_ZEGARA, ETAPY_Z_ZEGAREM } from "../chat-api/productionQueue.js";
import { PROGI, progDoWyslania, szturchnacSzczegoly, nazwaProgu } from "../chat-api/deadlineReminders.js";
import { terminGrupy, quoteLeadDays, quoteRequiresDetails } from "../chat-api/quotes.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERWER = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");
const SCHEMAT = readFileSync(join(ROOT, "scripts", "orders-schema.sql"), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

console.log("\n1. Wypisane przejscia dzialaja\n");
{
  for (const [etap, regula] of Object.entries(ETAPY_PRACY)) {
    for (const zrodlo of regula.z) {
      const w = przejscie(zrodlo, etap);
      if (!w.ok) zle(`${zrodlo} -> ${etap}: odrzucone, a ma byc dozwolone`);
      else if (w.pole !== regula.pole) zle(`${zrodlo} -> ${etap}: stempel w "${w.pole}", a ma byc "${regula.pole}"`);
      else ok(`${zrodlo} -> ${etap}, stempel w ${w.pole}`);
    }
  }

  // Rzecz z polki pakuje sie i wysyla tego samego dnia. Ten skrot jest
  // swiadomy i ma zostac, wiec pilnuje go osobny przypadek.
  if (przejscie("paid", "shipped").ok) ok("skrot paid -> shipped zostaje, bez wymuszania etapu posredniego");
  else zle("skrot paid -> shipped zniknal, a byl swiadomy");
}

console.log("\n2. Przejscia spoza listy sa odrzucane\n");
{
  const zakazane = [
    ["awaiting_payment", "in_production", "praca rusza za darmo"],
    ["awaiting_payment", "shipped", "paczka jedzie bez zaplaty"],
    ["awaiting_transfer", "shipped", "paczka jedzie przed przelewem"],
    ["payment_review", "in_production", "praca rusza przed rozstrzygnieciem wplaty"],
    ["draft", "in_production", "koszyk trafia do pracowni"],
    ["cancelled", "shipped", "anulowane zamowienie zostaje wyslane"],
    ["expired", "in_production", "wygasle zamowienie wraca do pracy"],
    ["refunded", "completed", "zwrocone zamowienie zostaje zamkniete jako zrobione"],
    ["paid", "completed", "zamowienie zamyka sie bez pracy i bez wysylki"],
    ["shipped", "in_production", "wyslana paczka wraca do pracowni"],
    ["completed", "shipped", "zamkniete zamowienie jedzie drugi raz"],
  ];
  for (const [zrodlo, etap, opis] of zakazane) {
    const w = przejscie(zrodlo, etap);
    if (w.ok) zle(`${zrodlo} -> ${etap} przeszlo: ${opis}`);
    else if (w.powod !== "bad_transition") zle(`${zrodlo} -> ${etap}: powod "${w.powod}", a ma byc "bad_transition"`);
    else ok(`${zrodlo} -> ${etap} odrzucone (${opis})`);
  }

  for (const etap of ["", "done", "in-production", "IN_PRODUCTION", "__proto__", "toString"]) {
    const w = przejscie("paid", etap);
    if (w.ok) zle(`etap "${etap}" przeszedl, a nie istnieje`);
    else if (w.powod !== "bad_stage") zle(`etap "${etap}": powod "${w.powod}", a ma byc "bad_stage"`);
    else ok(`etap "${etap}" odrzucony jako nieznany`);
  }
}

console.log("\n3. Nazwa kolumny trafia do SQL przez interpolacje\n");
{
  // `${regula.pole}` stoi w UPDATE bez parametryzacji, bo nazwy kolumny nie da
  // sie podac przez $N. Jest to bezpieczne dopoki wartosc pochodzi z tej
  // tabeli, a nie z zadania. Test pilnuje, ze nikt nie wstawi tu niczego,
  // co po interpolacji przestanie byc nazwa kolumny.
  const identyfikator = /^[a-z][a-z0-9_]{2,40}$/;
  for (const [etap, regula] of Object.entries(ETAPY_PRACY)) {
    if (identyfikator.test(regula.pole)) ok(`${etap}: "${regula.pole}" jest zwykla nazwa kolumny`);
    else zle(`${etap}: "${regula.pole}" nie jest bezpieczna nazwa kolumny`);
  }
  if (/\$\{regula\.pole\}/.test(SERWER)) ok("serwer bierze nazwe kolumny z reguly, nie z tresci zadania");
  else zle("serwer nie uzywa juz nazwy kolumny z reguly, sprawdz UPDATE etapu");
  if (/WHERE id = \$1 AND status = ANY\(\$5::text\[\]\)/.test(SERWER)) ok("UPDATE powtarza warunek statusu, wiec wyscig nie przestawi anulowanego");
  else zle("UPDATE nie powtarza warunku statusu, dwa okna moga sie rozjechac");
}

console.log("\n4. Kolumny i statusy naprawde istnieja\n");
{
  for (const [etap, regula] of Object.entries(ETAPY_PRACY)) {
    const wzor = new RegExp(`ADD COLUMN IF NOT EXISTS ${regula.pole}\\b`);
    if (wzor.test(SERWER)) ok(`${regula.pole}: dokladana przy starcie serwera`);
    else zle(`${regula.pole}: brak ALTER TABLE przy starcie, UPDATE etapu "${etap}" wywali sie na produkcji`);

    const wSchemacie = new RegExp(`\\b${regula.pole}\\b`).test(SCHEMAT);
    if (wSchemacie) ok(`${regula.pole}: opisana w orders-schema.sql`);
    else zle(`${regula.pole}: nie ma jej w orders-schema.sql, swieza baza z pliku nie zna tej kolumny`);
  }

  // Ograniczenie CHECK jest jedynym miejscem, ktore wie, jakie statusy w ogole
  // istnieja. Literowka w regule ("payed") nie wywalilaby niczego przy starcie,
  // tylko cicho zablokowalaby jedno przejscie na zawsze.
  const check = SCHEMAT.match(/CHECK \(status IN \(([^)]+)\)\)/);
  if (!check) {
    zle("nie znalazlem ograniczenia CHECK na statusie zamowienia");
  } else {
    const znane = new Set(check[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")));
    const uzyte = new Set(Object.entries(ETAPY_PRACY).flatMap(([etap, r]) => [etap, ...r.z]));
    for (const status of [...uzyte].sort()) {
      if (znane.has(status)) ok(`status "${status}" istnieje w tabeli orders`);
      else zle(`status "${status}" z reguly przejsc nie istnieje w ograniczeniu tabeli orders`);
    }
  }
}

console.log("\n5. Korekta etapu nie omija reguly przejsc\n");
{
  // Korekta ma poprawiac pomylke miedzy etapami pracy. Zamowienie, ktore nie
  // jest oplacone, nie ma czego poprawiac i nie moze tedy wejsc do pracowni.
  for (const zrodlo of ["awaiting_payment", "awaiting_transfer", "payment_review", "draft", "cancelled", "expired", "refunded"]) {
    const w = korekta(zrodlo, "in_production");
    if (w.ok) zle(`korekta ${zrodlo} -> in_production przeszla, a to obejscie reguly przejsc`);
    else if (w.powod !== "not_in_queue") zle(`korekta ${zrodlo}: powod "${w.powod}", a ma byc "not_in_queue"`);
    else ok(`korekta ze stanu ${zrodlo} odrzucona`);
  }

  for (const etap of ["", "done", "__proto__", "cancelled"]) {
    const w = korekta("paid", etap);
    if (w.ok) zle(`korekta na "${etap}" przeszla, a to nie jest etap pracy`);
    else ok(`korekta na "${etap}" odrzucona`);
  }

  if (!korekta("in_production", "in_production").ok && korekta("in_production", "in_production").powod === "no_change") {
    ok("korekta na ten sam etap odrzucona jako brak zmiany");
  } else zle("korekta na ten sam etap nie zglasza braku zmiany");

  // Sedno cofniecia: stempel etapu docelowego ZOSTAJE, bo praca ruszyla wtedy,
  // kiedy ruszyla. Znikaja stemple etapow, ktore sie nie wydarzyly.
  const wstecz = korekta("shipped", "in_production");
  if (!wstecz.ok) zle("cofniecie shipped -> in_production odrzucone, a jest sensem tej funkcji");
  else if (wstecz.doWyczyszczenia.includes("production_started_at")) {
    zle("cofniecie do in_production kasuje date rozpoczecia pracy, czyli przepisuje historie");
  } else if (!wstecz.doWyczyszczenia.includes("shipped_at")) {
    zle("cofniecie z shipped nie kasuje daty wysylki, wiec zamowienie dalej twierdzi, ze wyjechalo");
  } else ok(`cofniecie shipped -> in_production kasuje ${wstecz.doWyczyszczenia.join(", ")}`);

  const wPrzod = korekta("paid", "shipped");
  if (wPrzod.ok && !wPrzod.doWyczyszczenia.includes("shipped_at")) ok("poprawka w przod nie kasuje stempla etapu docelowego");
  else zle("poprawka paid -> shipped kasuje wlasny stempel albo jest odrzucana");

  // Kolejnosc etapow decyduje o tym, co sie czysci, wiec musi pokrywac sie
  // z reguly przejsc. Dopisany etap bez wpisu tutaj cichnie w korekcie.
  for (const etap of Object.keys(ETAPY_PRACY)) {
    if (ETAPY_KOLEJNO.includes(etap)) ok(`etap "${etap}" ma swoje miejsce w kolejnosci`);
    else zle(`etap "${etap}" nie wystepuje w ETAPY_KOLEJNO, korekta go nie zna`);
  }
}

console.log("\n6. Kasowanie zamowienia ma jedna trase i lamie warunki tylko na zadanie\n");
{
  // Trasa kasowania istnieje w tym pliku od dawna, razem z warunkami
  // z orderCleanup.js. Dopisanie DRUGIEJ trasy o tej samej sciezce nie jest
  // bledem skladni ani lintu: Express bierze te zarejestrowana wczesniej,
  // a starsza cichnie razem z calym zabezpieczeniem. Wlasnie tak wygladala
  // pierwsza wersja tej zmiany, wiec liczba tras jest tu sprawdzana wprost.
  const ile = (SERWER.match(/app\.delete\("\/api\/orders\/:ref"/g) || []).length;
  if (ile === 1) ok("kasowanie ma dokladnie jedna trase");
  else zle(`tras kasowania jest ${ile}, wiec ta zarejestrowana pozniej nie odpowiada na nic`);

  const start = SERWER.indexOf('app.delete("/api/orders/:ref"');
  const trasa = start < 0 ? "" : SERWER.slice(start, start + 4000);
  const wymagane = [
    [/requireAdmin\(req, res\)/, "wymaga zalogowanego pracownika"],
    [/const force = req\.body\?\.force === true/, "lamie warunki wylacznie na wyrazne zadanie"],
    [/if \(force && String\(req\.body\?\.confirmRef \|\| ""\)\.trim\(\) !== ref\)/, "przy lamaniu warunkow zada przepisania numeru"],
    [/if \(blockers\.length && !force\)/, "bez zadania nadal odmawia, gdy cokolwiek sie wydarzylo"],
    [/used_count = GREATEST\(0, c\.used_count - z\.ile\)/, "oddaje zuzycie kodu rabatowego"],
    [/SKASOWANE MIMO WARUNKOW/, "zapisuje w logu, co przelamano"],
  ];
  for (const [wzor, opis] of wymagane) {
    if (wzor.test(trasa)) ok(`kasowanie ${opis}`);
    else zle(`kasowanie NIE ${opis}`);
  }

  // Potwierdzenie ma stac PRZED odczytem zamowienia z bazy.
  const iPotwierdzenie = trasa.indexOf("confirm_mismatch");
  const iBaza = trasa.indexOf("pool.query");
  if (iPotwierdzenie > 0 && iPotwierdzenie < iBaza) ok("potwierdzenie stoi przed zapytaniem do bazy");
  else zle("potwierdzenie stoi po zapytaniu do bazy albo go nie ma");

  // Warunki nadal maja pochodzic z jednego miejsca, a nie byc przepisane.
  if (/deletionBlockers\(\{/.test(trasa)) ok("warunki bierze z orderCleanup.js, a nie z wlasnej listy");
  else zle("trasa nie uzywa juz deletionBlockers, warunki rozjada sie z orderCleanup.js");
}

console.log("\n7. Termin realizacji: najdluzszy, i tylko z tego, co wybrane\n");
{
  const rowne = (a, b, opis) => (a === b ? ok(opis) : zle(`NIE ${opis} (jest ${a}, ma byc ${b})`));
  const poz = (id, o = {}) => ({ id, qty: 1, unit_grosze: 10000, kind: "option", selected: true, lead_days: null, ...o });
  const oferta = (items) => ({ pick_one: false, items });

  // Paczka wychodzi jedna, wiec calosc czeka na to, co robi sie najdluzej.
  // Wziecie sredniej albo pierwszej pozycji obiecywaloby termin, ktorego nie
  // da sie dotrzymac, i to bez zadnego bledu po drodze.
  rowne(terminGrupy([poz(1, { lead_days: 3 }), poz(2, { lead_days: 21 })]), 21, "grupa bierze termin najdluzszy");
  rowne(terminGrupy([poz(1), poz(2)]), null, "grupa bez terminow nie wymysla terminu");
  rowne(terminGrupy([poz(1, { lead_days: 5 }), poz(2)]), 5, "pozycja bez terminu nie zaniza terminu grupy");

  // Termin liczy sie z TEGO, co klient placi teraz, tak samo jak kwota.
  rowne(quoteLeadDays(oferta([poz(1, { lead_days: 5 }), poz(2, { lead_days: 30, selected: false })])), 5,
        "odznaczona pozycja nie podnosi terminu");
  rowne(quoteLeadDays(oferta([
    poz(1, { lead_days: 30, order_id: 7, order_status: "paid" }),
    poz(2, { lead_days: 5 }),
  ])), 5, "pozycja juz sprzedana nie podnosi terminu reszty oferty");
  rowne(quoteRequiresDetails(oferta([poz(1), poz(2, { requires_details: true })])), true,
        "jedna pozycja z ustaleniami wystarczy, zeby zatrzymac zegar");
  rowne(quoteRequiresDetails(oferta([poz(1), poz(2, { requires_details: true, selected: false })])), false,
        "znacznik przy pozycji odznaczonej nie zatrzymuje zegara");

  // Zaplata pcha zlecenie dalej, ale zegar czeka na ustalenia.
  rowne(etapPoZaplacie(false), ETAP_STARTU_ZEGARA, "bez znacznika zaplata od razu startuje termin");
  rowne(etapPoZaplacie(true), "details", "ze znacznikiem zaplata zatrzymuje sie na ustaleniach");
  ok("zegar startuje w etapie " + ETAP_STARTU_ZEGARA);

  // SEDNO ADR-0028. Termin obiecany klientowi nie moze czekac na to, az ktos
  // w pracowni wezmie zlecenie do reki: kazdy dzien lezenia w kolejce
  // przesuwalby po cichu date, ktora klient ma na pismie. Dlatego zegar
  // startuje w "gotowe do pobrania", a nie w "w realizacji".
  rowne(ETAP_STARTU_ZEGARA, "queued", "zegar startuje w chwili, od ktorej klient liczy dni");
  rowne(zegarBiegnie("queued"), true, "w kolejce termin biegnie, choc nikt jeszcze nic nie robi");
  rowne(zegarBiegnie("in_production"), true, "w robocie termin biegnie dalej");
  rowne(zegarBiegnie("ready"), true, "zrobione i niewyslane tez ma przed soba dzien nadania");
  rowne(zegarBiegnie("details"), false, "w ustalaniu szczegolow zegar stoi, bo czekamy na klienta");
  rowne(zegarBiegnie("shipped"), false, "po wysylce nie ma czego pilnowac");
  // Pobranie do pracy jest znacznikiem pracy, a nie zdarzeniem terminowym.
  // Gdyby stemplowalo termin, panel i mail klienta mowilyby dwie rozne daty.
  rowne(ETAPY_PRACY.in_production.pole, "production_started_at", "pobranie stempluje wlasna kolumne");
  rowne(ETAPY_PRACY.queued.pole, "queued_at", "wejscie do kolejki ma wlasny stempel");
  rowne(ETAPY_Z_ZEGAREM.includes("paid"), false, "stan przelotowy po ITN nie liczy sie do zegara");

  rowne(terminRealizacji("2026-09-01T10:00:00Z", 14), "2026-09-15", "termin to data, a nie liczba dni");
  rowne(terminRealizacji("2026-09-01T10:00:00Z", null), null, "bez liczby dni nie ma terminu");
  rowne(terminRealizacji(null, 14), null, "bez chwili startu nie ma terminu");
  rowne(dniDoTerminu("2026-09-15", new Date("2026-09-10T23:00:00Z")), 5, "dni do terminu liczy sie po dniach, nie po godzinach");
  rowne(dniDoTerminu("2026-09-15", new Date("2026-09-15T06:00:00Z")), 0, "w dniu terminu zostaje zero");
  rowne(dniDoTerminu("2026-09-15", new Date("2026-09-18T06:00:00Z")), -3, "po terminie liczba jest ujemna");
}

console.log("\n8. Przypomnienia: jeden prog na przebieg, zaden dwa razy\n");
{
  const rowne = (a, b, opis) => (a === b ? ok(opis) : zle(`NIE ${opis} (jest ${a}, ma byc ${b})`));

  rowne(progDoWyslania(20, []), null, "przed pierwszym progiem nic nie wychodzi");
  rowne(progDoWyslania(14, [])?.prog, 14, "czternascie dni przed terminem odzywa sie prog 14");
  rowne(progDoWyslania(13, [])?.prog, 14, "prog raz przekroczony odzywa sie takze dzien pozniej");
  rowne(progDoWyslania(13, ["d14"])?.prog, undefined, "prog juz wyslany nie wraca");
  rowne(progDoWyslania(7, ["d14"])?.prog, 7, "kolejny prog odzywa sie osobno");
  rowne(progDoWyslania(0, ["d14", "d7", "d3"])?.prog, 0, "w dniu wysylki odzywa sie prog zerowy");
  rowne(progDoWyslania(-5, ["d14", "d7", "d3", "d0"]), null, "po terminie i po wszystkich progach jest cisza");

  // SEDNO. Zlecenie z terminem dwudniowym przekracza progi 14, 7 i 3 w tej
  // samej chwili. Bez domykania dalszych progow dostalibysmy trzy maile
  // jednego ranka o jednej rzeczy, a szum sie ignoruje razem z trescia.
  const krotkie = progDoWyslania(2, []);
  rowne(krotkie?.prog, 3, "krotki termin bierze prog najblizszy prawdzie");
  rowne(krotkie?.domkniete.join(","), "d14,d7,d3", "dalsze progi zamykaja sie tym samym mailem");
  rowne(progDoWyslania(2, krotkie.domkniete), null, "po domknieciu nic sie juz nie powtarza");
  rowne(PROGI.join(","), "14,7,3,0", "progi stoja od najdalszego, bo tak sie je czyta");
  rowne(nazwaProgu(7), "d7", "nazwa progu jest krotka, bo stoi w bazie");

  // Ustalanie szczegolow nie ma terminu, wiec ma wlasny rytm.
  const dzien = 86400_000;
  const teraz = new Date("2026-09-10T08:00:00Z");
  rowne(szturchnacSzczegoly(new Date(teraz - 2 * dzien), null, teraz), false, "przez trzy dni nie zawracamy sobie glowy");
  rowne(szturchnacSzczegoly(new Date(teraz - 3 * dzien), null, teraz), true, "po trzech dniach stania przychodzi szturchniecie");
  rowne(szturchnacSzczegoly(new Date(teraz - 9 * dzien), new Date(teraz - 1 * dzien), teraz), false,
        "liczymy od ostatniego odezwania sie, nie od wejscia w etap");
  rowne(szturchnacSzczegoly(new Date(teraz - 9 * dzien), new Date(teraz - 4 * dzien), teraz), true,
        "po kolejnych trzech dniach szturchamy znowu");
  rowne(szturchnacSzczegoly(null, null, teraz), false, "bez stempla wejscia nie ma czego liczyc");
}

console.log("\n9. Nowe etapy sa wpiete wszedzie, nie tylko w regule\n");
{
  const SCHEMAT = readFileSync(join(ROOT, "scripts", "orders-schema.sql"), "utf8");
  const SERWER = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");
  const KOLEJKA = readFileSync(join(ROOT, "admin", "views", "queue.ejs"), "utf8");
  const ma = (tekst, wzor, opis) => (wzor.test(tekst) ? ok(opis) : zle(`NIE ${opis}`));

  for (const etap of ["details", "queued", "ready"]) {
    ma(SCHEMAT, new RegExp(`'${etap}'`), `schemat zamowien zna etap ${etap}`);
    ma(SERWER, new RegExp(`'${etap}'`), `migracja statusow zna etap ${etap}`);
    ma(KOLEJKA, new RegExp(`\\b${etap}\\b`), `kolejka w panelu pokazuje etap ${etap}`);
  }
  // Etap bez nazwy w panelu jest etapem, do ktorego zlecenie wpada i z ktorego
  // nikt go nie wyciaga, bo nikt go nie widzi. Kazdy etap pracy musi miec
  // wiersz w mapie `STAN`, inaczej widok wywala sie na `STAN[o.status].label`.
  for (const etap of ETAPY_KOLEJNO) {
    ma(KOLEJKA, new RegExp(`\\n\\s*${etap}: \\{ label:`), `kolejka umie nazwac etap ${etap}`);
  }
  ma(SERWER, /DOZWOLONE_STANY = \["paid", "details", "queued", "in_production", "ready"/, "kolejka wpuszcza nowe etapy");
  ma(SERWER, /: \["paid", "details", "queued", "in_production", "ready"\]/, "domyslny widok kolejki pokazuje nowe etapy");
  // Sortowanie idzie do `ORDER BY` przez interpolacje, bo Postgres nie
  // przyjmuje tam parametru. Bez bialej listy panel bylby droga wstrzykniecia.
  ma(SERWER, /SORTOWANIA = \{[\s\S]{0,400}?\};[\s\S]{0,300}?Object\.hasOwn\(SORTOWANIA/,
     "kolejnosc listy bierze sie z bialej listy, a nie z parametru");
  // Odliczenie za projekt czytalo sam stan "paid". Od chwili, w ktorej zaplata
  // pcha zamowienie dalej, taki warunek nie znajduje juz niczego.
  const QUOTES = readFileSync(join(ROOT, "chat-api", "quotes.js"), "utf8");
  ma(QUOTES, /o\.status IN \('paid','details','queued','in_production','ready','shipped','completed'\)/,
     "odliczenie za projekt widzi zamowienia po zaplacie");
  // Pozycja oferty zamknieta zaplata nie moze wrocic do sprzedazy dlatego,
  // ze zlecenie poszlo etap dalej. Etap pominiety w tej liscie spada na
  // "zajeta", czyli na zdanie "ktos wlasnie za to placi".
  for (const etap of ETAPY_KOLEJNO) {
    ma(QUOTES, new RegExp(`ZAMOWIENIE_DOSZLO = new Set\\(\\[[\\s\\S]{0,200}?"${etap}"`),
       `pozycja w etapie ${etap} zostaje zamknieta`);
  }
  ma(SCHEMAT, /queued_at\s+TIMESTAMPTZ/, "schemat ma kolumne na chwile wejscia do kolejki");
  ma(SERWER, /ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ/, "migracja doklada kolumne queued_at");
  // Zamowienia stojace w `paid` to wlasnie "gotowe do pobrania". Zostawione
  // tam wisialyby w panelu jako osobna grupa znaczaca to samo, co grupa obok.
  ma(SERWER, /UPDATE orders SET status = 'queued', queued_at = COALESCE\(queued_at, paid_at\)/,
     "stare zamowienia w paid trafiaja do kolejki");
  // Panel przysyla liczbe dni i date przy KAZDYM zapisie, wiec sama obecnosc
  // pola nic nie znaczy. Bez porownania ze stanem w bazie niezmieniona data
  // wygrywalaby zawsze i termin nie ruszylby sie nigdy.
  // Postgres odrzuca `SET a = 1, a = 2`, i to dopiero w bazie. Korekta etapu
  // z "wyslane" kasuje list przewozowy, a panel przysyla go przy kazdym
  // zapisie, wiec plaska lista skladala zapytanie, ktore nie mialo prawa sie
  // wykonac: kazde takie cofniecie konczylo sie bledem 500.
  ma(SERWER, /const pola = new Map\(\)[\s\S]{0,3000}?const zmiany = \[\.\.\.pola\.values\(\)\]/,
     "korekta sklada przypisania pod nazwa kolumny, wiec dwa zapisy sie nie zderzaja");
  // Parametr dolozony do zapytania i w nim nieuzyty wywala cale zapytanie na
  // "could not determine data type", wiec sprawdzamy to przed wpisaniem.
  ma(SERWER, /const zegarWyzerowany = czyszczone\.includes\("deadline_at"\)[\s\S]{0,900}?dataZmieniona && !zegarWyzerowany/,
     "cofniecie przed etap z zegarem wygrywa z obiema drogami do terminu");
  ma(SERWER, /dataZmieniona = termin !== undefined && termin !== terminWBazie/,
     "korekta wie, ktore pole terminu operator naprawde ruszyl");
  ma(SERWER, /if \(dni !== null && !dataZmieniona && !zegarWyzerowany\)[\s\S]{0,400}?COALESCE\(queued_at, production_started_at, paid_at\)/,
     "zmiana liczby dni przelicza termin od startu zegara, a nie od dzisiaj");
  // Od ADR-0027 `paid` trwa ulamek sekundy, wiec warunek na nim samym przestal
  // chronic cokolwiek: dziwna ITN wciagalaby do weryfikacji zlecenie w robocie.
  ma(SERWER, /status <> 'payment_review' AND status <> ALL\(\$5::text\[\]\)/,
     "weryfikacja platnosci nie siega zlecenia, ktore juz jest w pracy");
  ma(SERWER, /WHERE id = \$1 AND fulfilled_at IS NULL AND status <> ALL\(\$4::text\[\]\)/,
     "FAILURE po udanej platnosci nie dopisuje sie do zlecenia w pracy");
  ma(SERWER, /async function ruszZlecenie/, "zaplata ma czym ruszyc zlecenie");
  ma(SERWER, /AND status = 'paid' RETURNING id/, "start zlecenia da sie powtorzyc bez szkody");
  ma(SERWER, /cron\.schedule\("0 7 \* \* \*", przypomnijOTerminach/, "przeglad terminow jedzie raz na dobe");
  // Zapis "wyslane" przed wysylka zamknalby prog na zawsze przy pierwszej
  // awarii poczty, i to po cichu.
  ma(SERWER, /if \(!await sendDeadlineReminder[\s\S]{0,200}?continue;[\s\S]{0,200}?UPDATE orders SET reminders_sent/,
     "prog zapisuje sie dopiero po udanej wysylce");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nKolejka pracowni: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
