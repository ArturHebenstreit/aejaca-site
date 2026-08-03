// Odpowiedz InPostu odwzorowana z prawdziwego ksztaltu, zeby dalo sie sprawdzic
// przetwarzanie bez wychodzenia do sieci. Sam fakt, ze InPost odpowiada, sprawdza
// sie osobno, na zywej usludze.

import assert from "node:assert/strict";
import { findLockers, normalizePoints, LockerError } from "./lockers.js";

const ODPOWIEDZ = {
  items: [
    {
      name: "WAW01A",
      location_type: "Outdoor",
      location_description: "przy sklepie Żabka",
      opening_hours: "24/7",
      address: { line1: "Puławska 12" },
      address_details: { city: "Warszawa", post_code: "02-679", street: "Puławska" },
    },
    {
      name: "KRA42M",
      location_type: "Indoor",
      location_description: "w galerii, poziom -1",
      opening_hours: "9:00-21:00",
      address: { line1: "Rynek 1" },
      address_details: { city: "Kraków", post_code: "31-042", street: "Rynek" },
    },
    // Punkt bez nazwy nie da sie wybrac, wiec nie ma po co go pokazywac.
    { name: null, address_details: { city: "Gdańsk" } },
  ],
};

const points = normalizePoints(ODPOWIEDZ);
assert.equal(points.length, 2, "punkt bez kodu wypada z listy");
assert.deepEqual(points[0], {
  code: "WAW01A",
  street: "Puławska 12",
  city: "Warszawa",
  postCode: "02-679",
  description: "przy sklepie Żabka",
  open247: true,
});
assert.equal(points[1].open247, false, "punkt w galerii nie jest calodobowy");

// Odpowiedz pusta albo dziwna nie moze wywrocic kasy
assert.deepEqual(normalizePoints({}), []);
assert.deepEqual(normalizePoints(null), []);
assert.deepEqual(normalizePoints({ items: "nonsens" }), []);

// --- Zapytanie ---
let ostatniAdres = null;
const fakeFetch = async (url) => {
  ostatniAdres = url;
  return { ok: true, json: async () => ODPOWIEDZ };
};

// Kod pocztowy rozpoznajemy w kazdym zapisie, bo ludzie pisza i tak, i tak
for (const wpis of ["02-679", "02679", " 02 679 "]) {
  await findLockers(wpis, { fetchImpl: fakeFetch });
  assert.ok(ostatniAdres.includes("relative_post_code=02-679"), `zly adres dla "${wpis}": ${ostatniAdres}`);
}

// Nazwa miasta idzie jako miasto, nie jako kod
await findLockers("Piaseczno", { fetchImpl: fakeFetch });
assert.ok(ostatniAdres.includes("city=Piaseczno"));
assert.ok(!ostatniAdres.includes("relative_post_code"));

// Same paczkomaty, i tylko czynne
assert.ok(ostatniAdres.includes("type=parcel_locker"));
assert.ok(ostatniAdres.includes("status=Operating"));

// Za krotkie zapytanie nie leci do InPostu
await assert.rejects(() => findLockers("aa", { fetchImpl: fakeFetch }), (e) => e instanceof LockerError && e.code === "too_short");
await assert.rejects(() => findLockers("", { fetchImpl: fakeFetch }), (e) => e.code === "too_short");

// Pamiec podreczna: drugie pytanie o to samo nie wychodzi na zewnatrz
let wywolan = 0;
const liczacy = async () => { wywolan++; return { ok: true, json: async () => ODPOWIEDZ }; };
await findLockers("Zakopane", { fetchImpl: liczacy });
await findLockers("zakopane", { fetchImpl: liczacy });
assert.equal(wywolan, 1, "to samo zapytanie ma isc do InPostu raz");

// Awaria po tamtej stronie ma byc rozpoznawalna, a nie udawac braku punktow
await assert.rejects(
  () => findLockers("Sopot", { fetchImpl: async () => ({ ok: false, status: 503 }) }),
  (e) => e instanceof LockerError && e.code === "upstream"
);
await assert.rejects(
  () => findLockers("Gdynia", { fetchImpl: async () => { throw new Error("ECONNRESET"); } }),
  (e) => e instanceof LockerError && e.code === "unreachable"
);

console.log("Paczkomaty: wszystkie sprawdzenia przeszly");
