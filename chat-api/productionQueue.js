// ============================================================
// KOLEJKA PRACOWNI: ETAPY I DOZWOLONE PRZEJSCIA
// ============================================================
// Statusy `in_production`, `shipped` i `completed` stoja w ograniczeniu tabeli
// `orders` od poczatku, ale przez dlugi czas nic ich nie ustawialo. Oplacone
// zamowienie zostawalo w stanie `paid` na zawsze, wiec pytanie "co jest dzisiaj
// do zrobienia i co czeka najdluzej" odpowiadala skrzynka mailowa i pamiec.
//
// Przejscia sa WYPISANE, a nie dowolne, i to jest cala tresc tego pliku.
// Klikniecie w zlym wierszu nie ma prawa zrobic z zamowienia nieoplaconego
// zamowienia wyslanego: zadna kwota by sie przy tym nie zmienila, wiec nikt
// by tego nie zauwazyl az do chwili, w ktorej klient pyta, gdzie jest paczka.
//
// Osobny plik, a nie stala w `server.js`, wylacznie po to, zeby te regule dalo
// sie sprawdzic testem bez stawiania serwera i bazy.

/**
 * Etap pracy: z jakich stanow wolno w niego wejsc i ktora kolumna zapisuje
 * chwile wejscia.
 *
 * `paid -> shipped` z pominieciem `in_production` jest dozwolone SWIADOMIE:
 * rzecz z polki pakuje sie i wysyla tego samego dnia, a wymuszanie po drodze
 * etapu "w robocie" uczyloby wylacznie klikania na sile.
 */
export const ETAPY_PRACY = {
  // Ustalanie szczegolow zlecenia. ZEGAR TU NIE BIEGNIE: czekamy na rozmowe
  // z klientem, a nie na warsztat, wiec liczenie mu terminu byloby liczeniem
  // czasu, ktory zuzywa on, a nie my.
  details: { z: ["paid"], pole: "details_at" },
  in_production: { z: ["paid", "details"], pole: "production_started_at" },
  // Zrobione, czeka na wysylke albo na odbior. Osobny etap, bo miedzy
  // skonczeniem pracy a wydaniem paczki potrafi minac kilka dni i to wlasnie
  // tam gubily sie zlecenia.
  ready: { z: ["in_production"], pole: "ready_at" },
  shipped: { z: ["paid", "details", "in_production", "ready"], pole: "shipped_at" },
  completed: { z: ["in_production", "ready", "shipped"], pole: "completed_at" },
};

/**
 * Etap, w ktorym biegnie termin realizacji.
 *
 * Jedno miejsce, bo pytaja o to trzy strony naraz: przypomnienia (kogo
 * pilnowac), panel (ile dni zostalo) i strona klienta (ile dni do wysylki).
 * Trzy odpowiedzi na to samo pytanie znaczylyby klienta, ktory widzi inny
 * termin niz my.
 */
export const ETAP_Z_ZEGAREM = "in_production";

/** Etapy PO zaplacie: zamowienie jest nasze do zrobienia. */
export const ETAPY_PO_ZAPLACIE = ["paid", "details", "in_production", "ready", "shipped", "completed"];

/**
 * Czy taki etap w ogole istnieje.
 *
 * Zwykle `ETAPY_PRACY[etap]` nie wystarcza, bo obiekt dziedziczy po
 * `Object.prototype`: dla `"__proto__"` albo `"toString"` odczyt oddaje cos
 * prawdziwego, walidacja przepuszcza taki etap dalej, a `regula.z` jest juz
 * `undefined` i przewraca obsluge zadania. Zadanie przychodzi od zalogowanego
 * pracownika, wiec to nie jest dziura na zewnatrz, ale jest to 500 zamiast
 * czytelnego "nie znamy takiego etapu".
 *
 * @param {string} etap nazwa etapu z zadania
 * @returns {boolean}
 */
export function znanyEtap(etap) {
  return Object.hasOwn(ETAPY_PRACY, String(etap));
}

/**
 * Czy wolno przestawic zamowienie na ten etap.
 *
 * @param {string} obecny status zamowienia w bazie
 * @param {string} etap docelowy etap pracy
 * @returns {{ok: boolean, pole?: string, z?: string[], powod?: string}}
 */
export function przejscie(obecny, etap) {
  if (!znanyEtap(etap)) return { ok: false, powod: "bad_stage" };
  const regula = ETAPY_PRACY[etap];
  if (!regula.z.includes(obecny)) return { ok: false, powod: "bad_transition", z: regula.z };
  return { ok: true, pole: regula.pole, z: regula.z };
}

/**
 * Etapy, miedzy ktorymi wolno POPRAWIAC recznie, gdy ktos kliknal nie ten
 * wiersz albo nie ten przycisk.
 *
 * Kolejnosc ma znaczenie: pozycja w tej tablicy mowi, ktore stemple przestaja
 * byc prawda po cofnieciu. Zamowienie cofniete z "wyslane" do "w robocie" nie
 * moze dalej niesc daty wysylki, bo nic nie wyjechalo.
 */
export const ETAPY_KOLEJNO = ["paid", "details", "in_production", "ready", "shipped", "completed"];

/** Kolumna ze stemplem dla etapu, albo null dla `paid` (stempluje go platnosc). */
const STEMPEL = {
  paid: null,
  details: "details_at",
  in_production: "production_started_at",
  ready: "ready_at",
  shipped: "shipped_at",
  completed: "completed_at",
};

/**
 * Czy wolno poprawic zamowienie na ten etap, i ktore stemple trzeba przy tym
 * wyczyscic.
 *
 * Korekta NIE jest furtka do obejscia reguly przejsc. Wchodzi w gre wylacznie
 * miedzy etapami pracy, czyli dla zamowienia, ktore JUZ jest oplacone. Ze stanu
 * nieoplaconego, anulowanego czy zwroconego nie da sie tedy zrobic zamowienia
 * w robocie, tak samo jak przez `przejscie`.
 *
 * @param {string} obecny status zamowienia w bazie
 * @param {string} etap docelowy etap pracy
 * @returns {{ok: boolean, doWyczyszczenia?: string[], powod?: string}}
 */
export function korekta(obecny, etap) {
  if (!ETAPY_KOLEJNO.includes(etap)) return { ok: false, powod: "bad_stage" };
  if (!ETAPY_KOLEJNO.includes(obecny)) return { ok: false, powod: "not_in_queue" };
  if (obecny === etap) return { ok: false, powod: "no_change" };

  // Stemple etapow PO docelowym przestaja byc prawda: cofniecie z "wyslane"
  // do "w robocie" kasuje date wysylki. Stempel samego etapu docelowego
  // ZOSTAJE, bo praca naprawde ruszyla wtedy, kiedy ruszyla, a nie dzisiaj.
  const odIndeksu = ETAPY_KOLEJNO.indexOf(etap);
  const doWyczyszczenia = ETAPY_KOLEJNO.slice(odIndeksu + 1)
    .map((e) => STEMPEL[e])
    .filter(Boolean);
  // Cofniecie PRZED etap z zegarem zabiera takze termin i slad po wyslanych
  // przypomnieniach. Zostawiony termin byloby data policzona z pracy, ktora
  // jeszcze sie nie zaczela, a zostawione przypomnienia zamknelyby drugie
  // podejscie: progi juz raz wyslane nie odezwalyby sie ponownie.
  if (odIndeksu < ETAPY_KOLEJNO.indexOf(ETAP_Z_ZEGAREM)) {
    doWyczyszczenia.push("deadline_at");
    doWyczyszczenia.push("reminders_sent");
  }
  return { ok: true, doWyczyszczenia };
}

/**
 * Etap, w ktory wpada zamowienie w chwili zaplaty.
 *
 * Do ADR-0027 kazde zamowienie zostawalo w `paid` az ktos kliknal w panelu.
 * Teraz zaplata od razu pcha je dalej, bo to ona jest momentem, w ktorym
 * praca sie zaczyna. Zlecenie ze znacznikiem "wymaga ustalenia szczegolow"
 * idzie najpierw do rozmowy i wtedy zegar czeka.
 *
 * @param {boolean} wymagaSzczegolow znacznik zamrozony na zamowieniu
 * @returns {"details"|"in_production"}
 */
export function etapPoZaplacie(wymagaSzczegolow) {
  return wymagaSzczegolow ? "details" : ETAP_Z_ZEGAREM;
}

/**
 * Termin realizacji: dzien, na ktory umowilismy sie z klientem.
 *
 * Liczymy w dniach KALENDARZOWYCH, nie roboczych (decyzja wlasciciela
 * z 2026-08-29). Wynik jest data, a nie liczba dni, bo liczba przeliczana
 * przy kazdym odczycie przesuwalaby termin razem z data odczytu.
 *
 * @param {Date|string} start chwila wejscia w etap z zegarem
 * @param {number|null} dni termin zamrozony na zamowieniu
 * @returns {string|null} data w postaci RRRR-MM-DD
 */
export function terminRealizacji(start, dni) {
  const d = Number(dni);
  if (!start || !Number.isFinite(d) || d <= 0) return null;
  const od = new Date(start);
  if (Number.isNaN(od.getTime())) return null;
  return new Date(od.getTime() + d * 86400_000).toISOString().slice(0, 10);
}

/**
 * Ile dni zostalo do terminu. Liczy SERWER, i to jest istotne.
 *
 * Data w JSX zmienia sie miedzy buildem a ogladaniem, wiec React uznaje to za
 * rozjazd i wyrzuca cale poddrzewo (ADR-0022). Strona dostaje wiec gotowa
 * liczbe, a nie material do liczenia.
 *
 * @returns {number|null} ujemna liczba znaczy dni PO terminie
 */
export function dniDoTerminu(deadline, teraz = new Date()) {
  if (!deadline) return null;
  const cel = new Date(`${String(deadline).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(cel.getTime())) return null;
  const dzis = new Date(`${teraz.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((cel.getTime() - dzis.getTime()) / 86400_000);
}
