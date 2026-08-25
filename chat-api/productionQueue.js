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
  in_production: { z: ["paid"], pole: "production_started_at" },
  shipped: { z: ["paid", "in_production"], pole: "shipped_at" },
  completed: { z: ["in_production", "shipped"], pole: "completed_at" },
};

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
export const ETAPY_KOLEJNO = ["paid", "in_production", "shipped", "completed"];

/** Kolumna ze stemplem dla etapu, albo null dla `paid` (stempluje go platnosc). */
const STEMPEL = {
  paid: null,
  in_production: "production_started_at",
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
  return { ok: true, doWyczyszczenia };
}
