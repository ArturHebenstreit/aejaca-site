// ============================================================
// WYDANIE PLIKOW: sprawdzenia
// ============================================================
// Baza jest tu udawana, bo sprawdzamy REGULY, a nie sterownik Postgresa:
// co jest plikiem, kiedy link jeszcze dziala, i czy powtorzony SUCCESS
// z bramki nie zaklada drugiego linku do tej samej pozycji.

import assert from "node:assert/strict";
import {
  isDigitalItem, downloadState, downloadName, issueDownloads, takeDownload,
  DOWNLOAD_DAYS, MAX_DOWNLOADS,
} from "./digitalDelivery.js";

// --- Co jest plikiem, a co przesylka ---
const plikSTL = { item_type: "service", calculator: "jewelry_ring_config", params: { output: "mesh" } };
const plikSTEP = { item_type: "service", calculator: "jewelry_ring_config", params: { output: "step" } };
const odlew = { item_type: "service", calculator: "jewelry_ring_config", params: { output: "cast" } };
const wyrob = { item_type: "service", calculator: "jewelry_ring_config", params: { output: "finished" } };
const wydruk = { item_type: "service", calculator: "print3d_fdm", params: {} };
const model = { item_type: "product", product_kind: "digital" };
const pierscionek = { item_type: "product", product_kind: "physical" };

assert.equal(isDigitalItem(plikSTL), true);
assert.equal(isDigitalItem(plikSTEP), true);
assert.equal(isDigitalItem(odlew), false, "odlew jedzie kurierem, nie linkiem");
assert.equal(isDigitalItem(wyrob), false, "gotowy wyrob tym bardziej");
assert.equal(isDigitalItem(wydruk), false, "wydruk z pliku klienta to usluga, nie tresc cyfrowa");
assert.equal(isDigitalItem(model), true);
assert.equal(isDigitalItem(pierscionek), false);
assert.equal(isDigitalItem({}), false, "brak danych nie moze przypadkiem wydac pliku");

// --- Stan linku ---
const zaTydzien = new Date(Date.now() + 7 * 864e5);
const wczoraj = new Date(Date.now() - 864e5);
assert.equal(downloadState({ expires_at: zaTydzien, download_count: 0, max_downloads: 5 }), "ok");
assert.equal(downloadState({ expires_at: wczoraj, download_count: 0, max_downloads: 5 }), "expired");
assert.equal(downloadState({ expires_at: zaTydzien, download_count: 5, max_downloads: 5 }), "exhausted");
assert.equal(downloadState(null), "unknown");
assert.match(downloadName("AEJ-2026-0007"), /^aejaca-aej-2026-0007\.zip$/);

// ------------------------------------------------------------
// Udawana baza
// ------------------------------------------------------------
function fakePool(stan) {
  const zapytania = [];
  return {
    zapytania,
    async query(sql, params = []) {
      zapytania.push(sql.trim().split(/\s+/)[0].toUpperCase());
      if (/FROM order_items oi\s*\n?\s*LEFT JOIN products/.test(sql)) return { rows: stan.items };
      if (/SELECT order_item_id, token FROM downloads/.test(sql)) return { rows: stan.downloads };
      if (/INSERT INTO downloads/.test(sql)) {
        stan.downloads.push({ order_item_id: params[1], token: params[3], max_downloads: params[4] });
        stan.wstawione = (stan.wstawione || 0) + 1;
        return { rows: [] };
      }
      throw new Error(`nieobsluzone zapytanie: ${sql.slice(0, 60)}`);
    },
  };
}

// --- Linki powstaja tylko dla plikow ---
{
  const stan = {
    items: [
      { id: 1, title: "Plik STL", item_type: "service", calculator: "jewelry_ring_config", params: { output: "mesh" } },
      { id: 2, title: "Gotowy wyrób", item_type: "service", calculator: "jewelry_ring_config", params: { output: "finished" } },
    ],
    downloads: [],
  };
  const pool = fakePool(stan);
  const linki = await issueDownloads(pool, 77);
  assert.equal(linki.length, 1, "link dostaje sam plik, nie cale zamowienie");
  assert.equal(linki[0].orderItemId, 1);
  assert.match(linki[0].token, /^[a-f0-9]{48}$/, "token ma byc losowy i dlugi");
  assert.equal(stan.downloads[0].max_downloads, MAX_DOWNLOADS);
}

// --- Powtorzony SUCCESS nie zaklada drugiego linku ---
//
// To nie jest teoria: Autopay potrafi przyslac ten sam komunikat drugi raz,
// a przelew bywa potwierdzany recznie po tym, jak bramka juz zadzialala.
// Drugi link znaczylby drugi komplet pobran do rozdania.
{
  const stan = {
    items: [{ id: 1, title: "Plik STL", item_type: "service", calculator: "jewelry_ring_config", params: { output: "mesh" } }],
    downloads: [],
  };
  const pool = fakePool(stan);
  const pierwsze = await issueDownloads(pool, 77);
  const drugie = await issueDownloads(pool, 77);
  assert.equal(stan.wstawione, 1, "drugie wywolanie nie ma prawa nic wstawic");
  assert.equal(drugie[0].token, pierwsze[0].token, "ten sam link wraca, a nie nowy");
}

// --- Zamowienie bez plikow nie dotyka tabeli wydan ---
{
  const stan = { items: [{ id: 9, title: "Odlew", item_type: "service", calculator: "jewelry_ring_config", params: { output: "cast" } }], downloads: [] };
  const pool = fakePool(stan);
  assert.deepEqual(await issueDownloads(pool, 5), []);
  assert.equal(pool.zapytania.filter((q) => q === "INSERT").length, 0);
}

// ------------------------------------------------------------
// Pobranie
// ------------------------------------------------------------
// Sedno jest w tym, ze licznik podnosi sie W TYM SAMYM zapytaniu, ktore
// sprawdza warunki. Udajemy wiec baze, ktora respektuje `WHERE`.
function poolPobran(wiersz) {
  return {
    async query(sql, params) {
      if (/^UPDATE downloads/.test(sql.trim())) {
        const ok = wiersz && new Date(wiersz.expires_at) > new Date()
          && wiersz.download_count < wiersz.max_downloads
          && wiersz.token === params[0];
        if (!ok) return { rows: [] };
        wiersz.download_count += 1;
        return { rows: [{ ...wiersz, order_item_id: 3, order_id: 8 }] };
      }
      if (/SELECT expires_at/.test(sql)) return { rows: wiersz && wiersz.token === params[0] ? [wiersz] : [] };
      if (/FROM order_items oi/.test(sql)) {
        return { rows: [{ id: 3, title: "Plik STL", calculator: "jewelry_ring_config", params: {}, order_ref: "AEJ-1", lang: "pl" }] };
      }
      throw new Error(`nieobsluzone: ${sql.slice(0, 40)}`);
    },
  };
}

const token = "a".repeat(48);
{
  const wiersz = { token, expires_at: zaTydzien, download_count: 0, max_downloads: 2 };
  const pool = poolPobran(wiersz);

  const pierwsze = await takeDownload(pool, token);
  assert.equal(pierwsze.ok, true);
  assert.equal(pierwsze.pozostalo, 1, "po pierwszym pobraniu zostaje jedno");
  assert.equal(pierwsze.item.order_ref, "AEJ-1");

  const drugie = await takeDownload(pool, token);
  assert.equal(drugie.ok, true);
  assert.equal(drugie.pozostalo, 0);

  const trzecie = await takeDownload(pool, token);
  assert.equal(trzecie.ok, false);
  assert.equal(trzecie.reason, "exhausted", "wyczerpany limit ma sie roznic od nieznanego linku");
}

// --- Link wygasly, nieznany i sfalszowany ---
{
  const stary = { token, expires_at: wczoraj, download_count: 0, max_downloads: 5 };
  assert.equal((await takeDownload(poolPobran(stary), token)).reason, "expired");
  assert.equal((await takeDownload(poolPobran(null), token)).reason, "unknown");
  // Token o zlym ksztalcie nie ma prawa dojsc do bazy: to jest pierwsza
  // linia obrony przed zgadywaniem i przed wstrzykiwaniem czegokolwiek.
  const wybuchowy = { async query() { throw new Error("baza nie powinna byc pytana"); } };
  for (const zly of ["", "abc", "../../etc/passwd", "'; DROP TABLE downloads; --", "Z".repeat(48)]) {
    assert.equal((await takeDownload(wybuchowy, zly)).reason, "unknown", `przeszlo: ${zly}`);
  }
}

assert.ok(DOWNLOAD_DAYS >= 7, "krotszy termin niz tydzien byloby pulapka na klienta");

console.log("Wydanie plikow: wszystkie sprawdzenia przeszly");
