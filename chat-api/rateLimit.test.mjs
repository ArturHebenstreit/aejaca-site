import assert from "node:assert/strict";
import express from "express";
import { createLimiter, limitBy } from "./rateLimit.js";

// --- Sam licznik ---
const l = createLimiter({ limit: 3, windowMs: 60_000, name: "test" });

assert.equal(l.check("a"), true);
assert.equal(l.check("a"), true);
assert.equal(l.check("a"), true);
assert.equal(l.check("a"), false, "czwarte zapytanie w oknie odpada");
assert.equal(l.remaining("a"), 0);

// Klucze nie mieszaja sie ze soba
assert.equal(l.check("b"), true, "drugi klient ma wlasna pule");
assert.equal(l.remaining("b"), 2);

// Brak klucza nie jest powodem do kary
assert.equal(l.check(""), true);
assert.equal(l.check(undefined), true);

// Kara doklada sie do puli bez pytania o zgode
const m = createLimiter({ limit: 2, windowMs: 60_000 });
m.penalize("x");
assert.equal(m.remaining("x"), 1);
m.penalize("x");
assert.equal(m.remaining("x"), 0);
assert.equal(m.check("x"), false, "wyczerpana pula nietrafien zamyka droge");

// Wyzerowanie
m.reset("x");
assert.equal(m.remaining("x"), 2);

// Okno wygasa razem z upływem czasu
const short = createLimiter({ limit: 1, windowMs: 30 });
assert.equal(short.check("k"), true);
assert.equal(short.check("k"), false);
await new Promise((r) => setTimeout(r, 45));
assert.equal(short.check("k"), true, "po zamknieciu okna pula wraca");

// Sprzatanie nie trzyma procesu przy zyciu: gdyby zegar nie mial unref,
// ten plik nigdy by sie nie zakonczyl.
assert.equal(short.size(), 1);

// --- Warstwa posrednia ---
const app = express();
const routeLimit = createLimiter({ limit: 2, windowMs: 60_000 });
app.get("/x", limitBy(routeLimit, () => "staly-klucz", { error: "Za duzo", code: "rate_limited" }), (_req, res) =>
  res.json({ ok: true })
);

const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/x`;

assert.equal((await fetch(url)).status, 200);
assert.equal((await fetch(url)).status, 200);

const blocked = await fetch(url);
assert.equal(blocked.status, 429);
assert.ok(Number(blocked.headers.get("retry-after")) > 0, "429 musi mowic, kiedy wrocic");
const body = await blocked.json();
assert.equal(body.code, "rate_limited");
assert.ok(body.retryAfterSeconds > 0);

server.close();
console.log("Wszystkie sprawdzenia przeszly");
