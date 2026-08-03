// Sprawdzenie na zywym serwerze, nie na atrapie zadania: chodzi o to, jak
// Express przycina lancuch X-Forwarded-For, a tego atrapa by nie odtworzyla.

import assert from "node:assert/strict";
import express from "express";
import { extractIP, normalizeIP, isPrivateIP, TRUSTED_PROXY_HOPS } from "./clientIp.js";

const app = express();
app.set("trust proxy", TRUSTED_PROXY_HOPS);
app.get("/ip", (req, res) => res.json({ ip: extractIP(req) }));

const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}/ip`;

const ipWith = async (headers) => (await (await fetch(base, { headers })).json()).ip;

// Krawedz Railway dopisuje adres polaczenia na KONIEC lancucha. Klient dopisal
// sobie z przodu 9.9.9.9, zeby zmylic licznik. Liczy sie ten z konca.
assert.equal(
  await ipWith({ "x-forwarded-for": "9.9.9.9, 8.8.8.8" }),
  "8.8.8.8",
  "podstawiony wpis z poczatku lancucha nie moze wygrac"
);

// Dokladnie ten przypadek przepuszczala stara wersja, biorac pierwszy wpis.
assert.notEqual(await ipWith({ "x-forwarded-for": "9.9.9.9, 8.8.8.8" }), "9.9.9.9");

// Kilka podstawionych wpisow z przodu niczego nie zmienia.
assert.equal(await ipWith({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3, 8.8.8.8" }), "8.8.8.8");

// cf-connecting-ip jest ignorowany, dopoki nie stoimy za Cloudflare.
assert.equal(
  await ipWith({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "9.9.9.9, 8.8.8.8" }),
  "8.8.8.8",
  "naglowek Cloudflare bez Cloudflare przed nami nic nie znaczy"
);

// x-real-ip tak samo: to napis od klienta, nie od nas.
assert.equal(await ipWith({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "9.9.9.9, 8.8.8.8" }), "8.8.8.8");

// Po wlaczeniu zaufania do Cloudflare naglowek zaczyna obowiazywac.
assert.equal(
  extractIP({ headers: { "cf-connecting-ip": "9.9.9.9" }, ip: "8.8.8.8" }, { trustCloudflare: true }),
  "9.9.9.9"
);
assert.equal(
  extractIP({ headers: {}, ip: "8.8.8.8" }, { trustCloudflare: true }),
  "8.8.8.8",
  "brak naglowka Cloudflare wraca do adresu polaczenia"
);

// Drobiazgi
assert.equal(normalizeIP("::ffff:8.8.8.8"), "8.8.8.8");
assert.equal(normalizeIP(undefined), "");
assert.equal(isPrivateIP("10.0.0.4"), true);
assert.equal(isPrivateIP("8.8.8.8"), false);
assert.equal(isPrivateIP(""), true);

server.close();
console.log("Wszystkie sprawdzenia przeszly");
