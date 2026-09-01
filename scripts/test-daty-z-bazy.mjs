// ============================================================
// DATA Z BAZY DOCHODZI DO KLIENTA JAKO DATA
// ============================================================
// Sterownik bazy oddaje kolumne DATE jako OBIEKT Date. Obcinanie go jak
// napisu daje "Tue Sep 22": wyglada jak data i przechodzi kazdy warunek
// sprawdzajacy, czy cos w ogole jest. Zglosil to wlasciciel 1 wrzesnia 2026:
// mail podawal planowana finalizacje 22.09.2026, a strona zamowienia w tym
// samym miejscu nie pokazywala NICZEGO.
//
// Trzy skutki jednej pomylki, kazdy sprawdzany osobno:
//   1. strona zamowienia gubila termin i odliczanie dni,
//   2. polski mail pisal pod kropkami "Thu Aug 27",
//   3. oferty nigdy nie wygasaly, bo "T" stoi w alfabecie za "2".

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { dataISO, dzisISO } from "../chat-api/daty.js";
import { dniDoTerminu } from "../chat-api/productionQueue.js";
import { buildStatusUpdate } from "../chat-api/orderMail.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const serwer = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");

// --- 1. Zamiana radzi sobie z kazda postacia, w ktorej data przychodzi ----
assert.equal(dataISO(new Date("2026-09-22T00:00:00")), "2026-09-22", "obiekt Date z bazy");
assert.equal(dataISO("2026-09-22"), "2026-09-22", "gotowy napis zostaje bez zmian");
assert.equal(dataISO("2026-09-22T10:00:00Z"), "2026-09-22", "znacznik czasu obcina sie do dnia");
for (const puste of [null, undefined, "", "nie data"]) {
  assert.equal(dataISO(puste), null, `${JSON.stringify(puste)} nie udaje daty`);
}
// Skladamy z pol lokalnych, a nie przez toISOString: kolumna DATE przychodzi
// jako polnoc LOKALNA, wiec przeliczenie na UTC cofnietoby date o dobe na
// wschod od Greenwich. Termin przesuniety o dzien jest gorszy od braku
// terminu, bo nikt go nie zakwestionuje.
const polnocLokalna = new Date(2026, 8, 22, 0, 0, 0);
assert.equal(dataISO(polnocLokalna), "2026-09-22", "polnoc lokalna nie ucieka o dobe");

// --- 2. Odliczanie dni dziala na obiekcie Date ----------------------------
// To ono gaslo najciszej: `new Date("Tue Sep 22T00:00:00Z")` jest data nie do
// odczytania, wiec funkcja oddawala null, a strona nie pokazywala ani daty,
// ani liczby dni.
const teraz = new Date("2026-09-01T12:00:00Z");
assert.equal(dniDoTerminu(new Date("2026-09-22T00:00:00"), teraz), 21, "termin jako obiekt Date");
assert.equal(dniDoTerminu("2026-09-22", teraz), 21, "termin jako napis");
assert.equal(dniDoTerminu(new Date("2026-08-25T00:00:00"), teraz), -7, "po terminie liczy na minus");
assert.equal(dniDoTerminu(null, teraz), null, "brak terminu to brak liczby");

// --- 3. Strona zamowienia dostaje date w postaci, ktora umie narysowac ----
// Strona sprawdza wzorzec RRRR-MM-DD i milczy, gdy sie nie zgadza. To jest
// dobre zachowanie (rozjazd dat wyrzuca prerender), ale znaczy, ze zle podana
// data znika bez sladu, wiec API musi ja podac dobrze.
assert.match(serwer, /deadlineAt: dataISO\(o\.deadline_at\)/,
  "kolejka i strona zamowienia podaja termin przez dataISO");
assert.doesNotMatch(serwer, /String\(o\.deadline_at\)\.slice/,
  "nigdzie nie obcinamy terminu jak napisu");
const strona = readFileSync(join(ROOT, "src", "pages", "OrderStatus.jsx"), "utf8");
assert.match(strona, /\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\//,
  "strona nadal sprawdza postac daty, zamiast ufac temu, co przyjdzie");

// --- 4. Mail pisze daty po polsku ----------------------------------------
const zamowienie = {
  order_ref: "AE20260827-3C1A1F40", lang: "pl", customer_email: "k@example.com",
  status: "queued", requires_details: true,
  paid_at: new Date("2026-08-27T10:00:00Z"),
  details_at: new Date("2026-08-30T12:00:00Z"),
  queued_at: new Date("2026-09-01T08:00:00Z"),
  deadline_at: new Date("2026-09-22T00:00:00"),
  delivery_method: "inpost_locker", lead_days: 21, access_token: "zeton",
};
const mail = buildStatusUpdate(zamowienie);
const stemple = [...mail.html.matchAll(/color:#bbb;margin-top:2px">([^<]*)</g)].map((m) => m[1]);
assert.deepEqual(stemple.slice(0, 3), ["27.08.2026", "30.08.2026", "01.09.2026"],
  "stemple pod kropkami sa po polsku, a nie 'Thu Aug 27'");
assert.match(mail.html, /22\.09\.2026/, "planowana finalizacja stoi w mailu");

// --- 5. Oferta wygasa ----------------------------------------------------
// Porownanie napisow "Tue Sep 22" < "2026-09-01" jest falszem ZAWSZE, bo "T"
// stoi w alfabecie za "2". Kazda oferta, takze sprzed miesiaca, wychodzila
// wiec jako wazna, i nikt tego nie widzial, bo brak wygasania nie rzuca bledu.
assert.match(serwer, /dataISO\(quote\.valid_until\) < dzisISO\(\)/,
  "waznosc oferty porownuje sie po dacie, a nie po napisie z bazy");
const staraOferta = dataISO(new Date("2026-08-01T00:00:00"));
assert.ok(staraOferta < dzisISO() || staraOferta === dzisISO(),
  "oferta sprzed miesiaca daje sie porownac z dzisiaj");
assert.ok(dataISO(new Date("2026-08-01T00:00:00")) < "2026-09-01", "i wychodzi na wygasla");

console.log("Daty z bazy: termin na stronie, stemple w mailu i wygasanie ofert liczone z prawdziwej daty");
