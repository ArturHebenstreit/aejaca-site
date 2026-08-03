import assert from "node:assert/strict";
import { secretMatches, requireSecret } from "./auth.js";
import { randomCode } from "./discounts.js";

function fakeRes() {
  const r = { code: null, body: null };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
}
const reqWith = (headers) => ({ method: "POST", path: "/test", headers });

// 1. Zgodnosc zetonu
assert.equal(secretMatches("abc", "abc"), true);
assert.equal(secretMatches("abc", "abd"), false);
assert.equal(secretMatches("abc", "abcd"), false, "rozna dlugosc nie moze rzucac wyjatkiem");
assert.equal(secretMatches(undefined, "abc"), false);
assert.equal(secretMatches("abc", undefined), false);
assert.equal(secretMatches(undefined, undefined), false, "brak sekretu po obu stronach to NIE zgodnosc");
assert.equal(secretMatches("", ""), false);

// 2. Brak zmiennej srodowiskowej zamyka drzwi, zamiast je otwierac
let res = fakeRes();
assert.equal(requireSecret(reqWith({}), res, "x-admin-token", "ADMIN_API_TOKEN", {}), false);
assert.equal(res.code, 503, "bez skonfigurowanego zetonu odmawiamy, i to jako blad uslugi");

// Stara wersja przepuszczala dokladnie ten przypadek: naglowka brak,
// zmiennej brak, undefined !== undefined jest falszem.
res = fakeRes();
assert.equal(requireSecret(reqWith({ "x-admin-token": "cokolwiek" }), res, "x-admin-token", "ADMIN_API_TOKEN", {}), false);
assert.equal(res.code, 503);

// 3. Zly zeton przy poprawnej konfiguracji
const env = { ADMIN_API_TOKEN: "prawdziwy-zeton" };
res = fakeRes();
assert.equal(requireSecret(reqWith({ "x-admin-token": "zly" }), res, "x-admin-token", "ADMIN_API_TOKEN", env), false);
assert.equal(res.code, 401);

res = fakeRes();
assert.equal(requireSecret(reqWith({}), res, "x-admin-token", "ADMIN_API_TOKEN", env), false);
assert.equal(res.code, 401, "brak naglowka przy ustawionym zetonie to zwykla odmowa");

// 4. Dobry zeton przechodzi
res = fakeRes();
assert.equal(requireSecret(reqWith({ "x-admin-token": "prawdziwy-zeton" }), res, "x-admin-token", "ADMIN_API_TOKEN", env), true);
assert.equal(res.code, null, "przy zgodzie nie wysylamy zadnej odpowiedzi");

// 5. Kody rabatowe: format i brak powtorzen
const codes = new Set();
for (let i = 0; i < 5000; i++) {
  const c = randomCode("AEJ10");
  assert.match(c, /^AEJ10-[ACDEFGHJKMNPQRTUVWXY2346789]{6}$/, `zly format: ${c}`);
  codes.add(c);
}
assert.ok(codes.size > 4990, `za duzo kolizji: ${5000 - codes.size}`);

console.log("Wszystkie sprawdzenia przeszly");
