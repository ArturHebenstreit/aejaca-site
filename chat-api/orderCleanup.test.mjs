import assert from "node:assert/strict";
import { deletionBlockers, canDelete, CANCELLABLE_STATUSES } from "./orderCleanup.js";

// Zamowienie, przy ktorym nic sie nie wydarzylo: pomylka albo test
const czyste = {
  paidAt: null, fulfilledAt: null, transferConfirmedAt: null,
  paymentNotifications: 0, consumedReservations: 0, consumedRedemptions: 0,
  downloads: 0, childOrders: 0, linkedQuotes: 0,
};
assert.deepEqual(deletionBlockers(czyste), []);
assert.equal(canDelete(czyste), true);

// Brak wiedzy o zamowieniu nie moze znaczyc zgody na kasowanie... ale tez nie
// moze blokowac: puste fakty to zamowienie swiezo zalozone. Liczy sie to, ze
// wywolujacy MUSI podac fakty, a nie to, co zrobi z brakiem.
assert.deepEqual(deletionBlockers({}), []);

// Kazdy slad po zdarzeniu blokuje osobno
const przypadki = [
  ["paidAt", "2026-08-03T10:00:00Z", "zostalo oplacone"],
  ["fulfilledAt", "2026-08-03T10:00:00Z", "zostalo rozliczone"],
  ["transferConfirmedAt", "2026-08-03T10:00:00Z", "przelew zostal potwierdzony recznie"],
  ["paymentNotifications", 1, "bramka platnicza przyslala powiadomienie"],
  ["consumedReservations", 1, "towar zostal zdjety ze stanu"],
  ["consumedRedemptions", 1, "kod rabatowy zostal uzyty"],
  ["downloads", 1, "wydano pliki do pobrania"],
  ["childOrders", 1, "wisi przy nim doplata"],
  ["linkedQuotes", 1, "powstalo z wyceny"],
];
for (const [pole, wartosc, powod] of przypadki) {
  const facts = { ...czyste, [pole]: wartosc };
  assert.deepEqual(deletionBlockers(facts), [powod], `pole ${pole}`);
  assert.equal(canDelete(facts), false, `pole ${pole} musi blokowac`);
}

// Kilka powodow naraz wraca w calosci, zeby panel mogl je wypisac
const oplaconeIzKodem = { ...czyste, paidAt: "x", consumedRedemptions: 1 };
assert.deepEqual(deletionBlockers(oplaconeIzKodem), ["zostalo oplacone", "kod rabatowy zostal uzyty"]);

// Odrzucone powiadomienie z bramki (bledny podpis) tez sie liczy: skoro cokolwiek
// przyszlo pod tym numerem, zamowienie zdazylo zyc w swiecie zewnetrznym.
assert.equal(canDelete({ ...czyste, paymentNotifications: 1 }), false);

// Stany, z ktorych da sie zrezygnowac
assert.deepEqual(CANCELLABLE_STATUSES, ["draft", "awaiting_payment", "awaiting_transfer"]);
assert.ok(!CANCELLABLE_STATUSES.includes("paid"), "z oplaconego nie rezygnuje sie przyciskiem");
assert.ok(!CANCELLABLE_STATUSES.includes("cancelled"), "drugi raz nie ma z czego rezygnowac");

console.log("Wszystkie sprawdzenia przeszly");
