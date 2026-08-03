// Najnizsza cena z 30 dni. Liczba pokazywana klientowi jako fakt, wiec test
// pilnuje przede wszystkim tego, KIEDY jej NIE pokazywac: informacja o obnizce
// przy cenie, ktora nie zostala obnizona, wprowadza w blad.

import assert from "node:assert/strict";
import { reductionNotice, WINDOW_DAYS } from "../src/shop/priceHistory.js";

const P = (over = {}) => ({ priceGrosze: 100000, lowest30Grosze: 100000, highest30Grosze: 100000, daysOnSale: 90, ...over });

// --- Brak obnizki: milczymy ---
assert.equal(reductionNotice(P()), null, "cena bez zmian to nie obnizka");
assert.equal(reductionNotice(P({ priceGrosze: 120000, highest30Grosze: 100000, lowest30Grosze: 100000 })), null,
  "podwyzka to tym bardziej nie obnizka");
assert.equal(reductionNotice(P({ priceGrosze: 100000, highest30Grosze: 100000, lowest30Grosze: 90000 })), null,
  "cena wrocila do poprzedniego poziomu, wiec dzis nie ma obnizki");

// --- Obnizka: podajemy najnizsza z okna ---
const obnizka = reductionNotice(P({ priceGrosze: 80000, highest30Grosze: 100000, lowest30Grosze: 90000 }));
assert.deepEqual(obnizka, { lowestGrosze: 80000, shortHistory: false },
  "najnizsza cena nie moze byc wyzsza od biezacej, bo biezaca wlasnie sie nia stala");

const obnizkaGlebsza = reductionNotice(P({ priceGrosze: 85000, highest30Grosze: 100000, lowest30Grosze: 70000 }));
assert.equal(obnizkaGlebsza.lowestGrosze, 70000, "w oknie byla nizsza cena i to ona jest najnizsza");

// --- Krotka historia: inne zdanie, ta sama liczba ---
const nowosc = reductionNotice(P({ priceGrosze: 80000, highest30Grosze: 100000, lowest30Grosze: 80000, daysOnSale: 10 }));
assert.equal(nowosc.shortHistory, true, "pozycja w sprzedazy 10 dni nie ma pelnych 30 dni historii");
const stary = reductionNotice(P({ priceGrosze: 80000, highest30Grosze: 100000, lowest30Grosze: 80000, daysOnSale: 30 }));
assert.equal(stary.shortHistory, false, "rowno 30 dni to juz pelne okno");

// --- Braki danych nie moga wyprodukowac zdania o obnizce ---
assert.equal(reductionNotice({ priceGrosze: 80000 }), null, "bez historii nie ma z czym porownac");
assert.equal(reductionNotice({ priceGrosze: 80000, highest30Grosze: 100000 }), null);
assert.equal(reductionNotice({}), null);
assert.equal(reductionNotice({ priceGrosze: null, highest30Grosze: 1, lowest30Grosze: 1 }), null);

assert.equal(WINDOW_DAYS, 30);

console.log("Najnizsza cena z 30 dni: wszystkie sprawdzenia przeszly");
