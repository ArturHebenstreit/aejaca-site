import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const server = await readFile(new URL("./server.js", import.meta.url), "utf8");
const paymentState = await readFile(new URL("./paymentState.js", import.meta.url), "utf8");
const statusPage = await readFile(new URL("../src/pages/OrderStatus.jsx", import.meta.url), "utf8");
const schema = await readFile(new URL("../scripts/orders-schema.sql", import.meta.url), "utf8");
// Platnosc do recznej decyzji ma byc WIDOCZNA dla pracowni. Od 2026-08-30 stoi
// w kolejce razem z reszta zamowien (ADR-0029), a nie na osobnej stronie
// przelewow: zamowienie w euro nie pojawialo sie w kolejce w ogole.
const adminView = await readFile(new URL("../admin/views/queue.ejs", import.meta.url), "utf8");

assert.match(server, /allowedHeaders:\s*\["Content-Type", "Authorization"\]/);
assert.match(server, /orderAccessAllowed\(req\.headers\.authorization, o\.access_token\)/);
assert.match(server, /Cache-Control", "no-store, private"/);
assert.match(statusPage, /Authorization: `Bearer \$\{token\}`/);
assert.doesNotMatch(statusPage, /api\/orders\/[^\n]*\?token=/, "token statusu nie moze trafic do query string");
assert.match(statusPage, /resolveOrderAccessToken/);
assert.match(statusPage, /sessionStorageFor\(window\)/);

const returnStart = server.indexOf('app.get("/api/autopay/return"');
const returnEnd = server.indexOf("async function placePaymentInReview", returnStart);
assert.ok(returnStart >= 0 && returnEnd > returnStart, "nie znaleziono obslugi powrotu Autopay");
const returnRoute = server.slice(returnStart, returnEnd);
assert.match(returnRoute, /verifyReturn\(\{ ServiceID, OrderID, Hash \}\)/);
assert.match(returnRoute, /SELECT access_token FROM orders WHERE order_ref = \$1/);
assert.doesNotMatch(returnRoute, /status = 'awaiting_payment'|payment_method|fulfilled_at/,
  "podpisany powrot musi oddac token takze po ITN dla paid i payment_review");

assert.match(server, /status = 'awaiting_payment' AND fulfilled_at IS NULL\s+RETURNING id/,
  "realizacja ITN musi miec atomowa bramke stanu");
assert.match(server, /status = 'payment_review'/);
assert.match(server, /payment_review_previous_status = status/);
assert.match(server, /payment_review_reason = CASE WHEN \$4/,
  "powod review ma byc liczony atomowo z aktualnego stanu w bazie");
assert.doesNotMatch(paymentState, /paymentReviewReason/,
  "nie utrzymujemy drugiej, nieuzywanej kopii reguly review");
assert.match(schema, /'payment_review'/);
assert.match(adminView, /payment_review: \{ label:/,
  "stan platnosci do sprawdzenia musi miec nazwe w kolejce");
assert.match(adminView, /Pobrano pieniądze, zlecenie nie ruszyło/,
  "pracownia ma widziec, ze pieniadze sa, a zlecenie stoi");

// --- Trzy sytuacje po przelewie (ADR-0029, punkt 5) ---

// Wiadomosc o wygasnieciu idzie TYLKO przy przelewie. Zamowienie kartowe wygasa
// po siedmiu dniach najczesciej dlatego, ze klient zamknal karte w koszyku,
// a wtedy "zamowienie zostalo zamkniete" jest poczta za porzucony koszyk.
assert.match(server, /if \(o\.payment_method === "bank_transfer"\) sendOrderExpired/,
  "mail o wygasnieciu tylko przy przelewie, nie przy porzuconym koszyku");
assert.match(server, /RETURNING id, order_ref, payment_method/,
  "wygaszanie musi wiedziec, ktora droga platnosci wybrano");

// Prog drobnej roznicy: kwota ORAZ procent, z mniejszej strony. Sam procent
// zawodzi w obie strony, zaleznie od wielkosci zamowienia.
assert.match(server, /Math\.min\(TRANSFER_TOLERANCE_CENTS, Math\.round\(oczekiwane \* TRANSFER_TOLERANCE_RATE\)\)/,
  "prog niedoplaty bierze mniejsza z dwoch miar");

// Potwierdzenie kasuje slad po prosbie o doplate. Zostawiony kazalby stronie
// zamowienia liczyc brakujaca kwote takze wtedy, gdy juz nic nie brakuje.
assert.match(server, /transfer_asked_at = NULL/,
  "potwierdzenie wplaty zamyka sprawe doplaty");

// Termin na doplate siedzi w tym samym `expires_at`, ktory wygasza zamowienia
// nieoplacone. Drugi zegar rozjechalby sie z pierwszym.
assert.match(server, /expires_at = NOW\(\) \+ INTERVAL '\$\{DNI_NA_DOPLATE\} days'/,
  "termin doplaty korzysta z tego samego zegara co wygasanie");

// Zamowienie zamkniete bez zaplaty ma na stronie WLASNE zdanie. Bez niego
// spadalo do galezi domyslnej i mowilo "bank jeszcze nie potwierdzil przelewu,
// to zwykle kwestia kilku minut" komus, kogo zamowienie wygaslo tydzien temu.
assert.match(statusPage, /const expired = order\?\.status === "expired"/,
  "strona zamowienia rozpoznaje zamowienie wygasle");
assert.match(statusPage, /expiredTitle/, "wygasle zamowienie ma wlasny tytul");
assert.match(statusPage, /cancelledTitle/, "anulowane zamowienie ma wlasny tytul");
assert.match(statusPage, /"expired",\s*\n\s*"cancelled",\s*\n\];/,
  "zamkniete zamowienie nie jest odpytywane w kolko, bo sie juz nie zmieni");

assert.match(adminView, /Wpisz kwotę ŁĄCZNĄ/,
  "po prosbie o doplate panel pyta o kwote laczna, a nie o sama doplate");

console.log("Bezpieczenstwo platnosci i statusu: wszystkie sprawdzenia przeszly");
