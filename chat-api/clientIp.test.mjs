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

// Lancuch dokladnie taki, jaki pisze krawedz Railway: adres klienta, potem
// adres jej wlasnego wezla. Wartosci wprost z pomiaru na zywej usludze.
// Klientem jest wpis PIERWSZY.
assert.equal(
  await ipWith({ "x-forwarded-for": "152.55.185.159, 152.233.12.242" }),
  "152.55.185.159",
  "adres wezla Railway nie moze podszyc sie pod klienta"
);

// Wziecie ostatniego wpisu wsadzaloby wszystkich klientow do jednego worka,
// bo wezlow krawedzi jest garstka.
assert.notEqual(
  await ipWith({ "x-forwarded-for": "152.55.185.159, 152.233.12.242" }),
  "152.233.12.242"
);

// Krawedz kasuje lancuch przyslany przez klienta i pisze go od nowa, wiec
// podstawione wpisy nie docieraja. Gdyby kiedys przestala, dwie warstwy nadal
// odrzucaja wszystko, co klient dopisze ZA swoim adresem.
assert.equal(
  await ipWith({ "x-forwarded-for": "8.8.8.8, 9.9.9.9, 1.1.1.1" }),
  "9.9.9.9",
  "liczymy od konca, wiec doklejanie wpisow na koncu nic nie daje"
);

// cf-connecting-ip jest ignorowany, dopoki nie stoimy za Cloudflare.
assert.equal(
  await ipWith({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "152.55.185.159, 152.233.12.242" }),
  "152.55.185.159",
  "naglowek Cloudflare bez Cloudflare przed nami nic nie znaczy"
);

// x-real-ip tak samo: przy naszej krawedzi pokrywa sie z pierwszym wpisem,
// ale sam w sobie jest napisem, ktory klient moze podac.
assert.equal(
  await ipWith({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "152.55.185.159, 152.233.12.242" }),
  "152.55.185.159"
);

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
