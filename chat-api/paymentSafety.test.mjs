import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const server = await readFile(new URL("./server.js", import.meta.url), "utf8");
const paymentState = await readFile(new URL("./paymentState.js", import.meta.url), "utf8");
const statusPage = await readFile(new URL("../src/pages/OrderStatus.jsx", import.meta.url), "utf8");
const schema = await readFile(new URL("../scripts/orders-schema.sql", import.meta.url), "utf8");
const adminView = await readFile(new URL("../admin/views/transfers.ejs", import.meta.url), "utf8");

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
assert.match(adminView, /Pilne płatności do ręcznej decyzji/);

console.log("Bezpieczenstwo platnosci i statusu: wszystkie sprawdzenia przeszly");
