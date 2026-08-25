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
 * Czy wolno przestawic zamowienie na ten etap.
 *
 * @param {string} obecny status zamowienia w bazie
 * @param {string} etap docelowy etap pracy
 * @returns {{ok: boolean, pole?: string, z?: string[], powod?: string}}
 */
export function przejscie(obecny, etap) {
  const regula = ETAPY_PRACY[etap];
  if (!regula) return { ok: false, powod: "bad_stage" };
  if (!regula.z.includes(obecny)) return { ok: false, powod: "bad_transition", z: regula.z };
  return { ok: true, pole: regula.pole, z: regula.z };
}
