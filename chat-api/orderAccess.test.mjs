import assert from "node:assert/strict";
import { bearerToken, orderAccessAllowed } from "./orderAccess.js";

const token = "a".repeat(48);

assert.equal(bearerToken(`Bearer ${token}`), token);
assert.equal(bearerToken(`bearer ${token}`), null, "schemat naglowka jest jawny i jednoznaczny");
assert.equal(bearerToken(`Bearer ${token} extra`), null, "token nie moze zawierac dopiskow");
assert.equal(bearerToken(undefined), null);

assert.equal(orderAccessAllowed(`Bearer ${token}`, token), true);
assert.equal(orderAccessAllowed(undefined, token), false, "brak naglowka zamyka dostep");
assert.equal(orderAccessAllowed("Bearer zly", token), false, "zly token zamyka dostep");
assert.equal(orderAccessAllowed(`Bearer ${token}`, undefined), false, "brak sekretu w bazie zamyka dostep");

console.log("Dostep do statusu zamowienia: wszystkie sprawdzenia przeszly");
