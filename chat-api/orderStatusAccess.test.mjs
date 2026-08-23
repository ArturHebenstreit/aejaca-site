import assert from "node:assert/strict";
import {
  forgetOrderAccessToken,
  orderStatusLocationWithoutToken,
  orderTokenStorageKey,
  resolveOrderAccessToken,
  sessionStorageFor,
} from "../src/shop/orderStatusAccess.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const storage = memoryStorage();
const ref = "AEJ-2026-001";

assert.equal(orderTokenStorageKey(ref), `aejaca:order-token:${ref}`);
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: "nowy", storage }), "nowy");
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: null, storage }), "nowy",
  "F5 odzyskuje token tej samej karty");
assert.equal(resolveOrderAccessToken({ orderRef: "INNE", urlToken: null, storage }), null,
  "inne zamowienie nie dziedziczy tokenu");

assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: "swiezszy", storage }), "swiezszy");
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: null, storage }), "swiezszy",
  "token z nowego linku nadpisuje zapamietany");

const blockedStorage = {
  getItem: () => { throw new Error("storage blocked"); },
  setItem: () => { throw new Error("storage blocked"); },
  removeItem: () => { throw new Error("storage blocked"); },
};
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: "z-url", storage: blockedStorage }), "z-url");
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: null, storage: blockedStorage }), null);
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: null, storage: null }), null,
  "prerender bez window pozostaje bezpieczny");
assert.equal(sessionStorageFor(undefined), null);
assert.equal(sessionStorageFor({ get sessionStorage() { throw new Error("storage blocked"); } }), null,
  "zablokowany getter sessionStorage nie wywala strony");

forgetOrderAccessToken({ orderRef: ref, storage });
assert.equal(resolveOrderAccessToken({ orderRef: ref, urlToken: null, storage }), null);

assert.equal(
  orderStatusLocationWithoutToken("https://www.aejaca.com/order/status/?ref=AEJ-1&token=sekret&source=return#stan"),
  "/order/status/?ref=AEJ-1&source=return#stan",
  "czyszczenie usuwa tylko token"
);

console.log("Dostep strony statusu: wszystkie sprawdzenia przeszly");
