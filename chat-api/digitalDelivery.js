// ============================================================
// WYDANIE PLIKOW PO OPLACENIU
// ============================================================
// Do tej pory plik STL byl w kreatorze policzony, wyceniony, sprzedany
// i na tym sie konczylo: tabela `downloads` istniala od poczatku, ale nic
// nie zakladalo w niej wierszy i nic ich nie obslugiwalo. Klient placil
// osiemdziesiat jeden zlotych za rzecz, ktora nie miala jak do niego dotrzec.
//
// Trzy rozstrzygniecia, ktore stoja za ksztaltem tego modulu:
//
// 1. LINK POWSTAJE PO ZAPLACIE, nie przy skladaniu zamowienia. Zamowienie
//    nieoplacone nie ma prawa dac dostepu do pliku, a porzuconych koszykow
//    jest wiecej niz oplaconych.
//
// 2. PLIKU NIE TRZYMAMY. Buduje sie go z parametrow zamowienia w chwili
//    pobierania, tym samym kodem, ktory policzyl cene. Plik na dysku moglby
//    rozjechac sie z wycena po kazdej poprawce generatora, a tak jedno i
//    drugie pochodzi z jednej bryly. Kosztuje to sekunde procesora, czyli
//    mniej niz jeden przebieg podgladu.
//
// 3. LINK MA TERMIN I LICZNIK. Nie dlatego, ze nie ufamy klientowi, tylko
//    dlatego, ze wieczysty adres bez uwierzytelnienia predzej czy pozniej
//    trafia na forum. Trzydziesci dni i piec pobran to zapas dla kogos, kto
//    zmienia komputer, i za malo dla kogos, kto chce rozdac plik dalej.

import crypto from "node:crypto";
import { isDigitalService } from "./withdrawal.js";

/** Ile dni zyje link i ile razy wolno z niego skorzystac. */
export const DOWNLOAD_DAYS = 30;
export const MAX_DOWNLOADS = 5;

/**
 * Czy ta pozycja zamowienia jest TRESCIA CYFROWA, czyli czy klient kupil plik.
 *
 * Kreator pierscionkow sprzedaje z jednej konfiguracji cztery rzeczy i tylko
 * dwie z nich sa plikiem. Odlew i gotowy wyrob jada kurierem, wiec link do
 * pobrania bylby przy nich nie tylko zbedny, ale i mylacy: sugerowalby, ze
 * klient dostal to, za co zaplacil, podczas gdy czeka na przesylke.
 *
 * Rozstrzygniecie, CO jest plikiem, mieszka w `withdrawal.js`, bo to ono
 * decyduje takze o pouczeniu w mailu. Dwie kopie tej reguly rozjechalyby sie
 * przy pierwszym nowym wyjsciu kreatora i skonczyloby sie zamowieniem, ktore
 * dostaje link, ale pouczenie ma jak dla rzeczy szytej na miare.
 */
export function isDigitalItem(item = {}) {
  if (item.item_type === "product") return item.product_kind === "digital";
  return isDigitalService(item);
}

/**
 * Stan linku, policzony z samego wiersza. Osobno od bazy, zeby dalo sie go
 * sprawdzic bez niej i zeby komunikat dla klienta mowil, CO jest nie tak.
 */
export function downloadState(row, teraz = new Date()) {
  if (!row) return "unknown";
  if (new Date(row.expires_at) <= teraz) return "expired";
  if (row.download_count >= row.max_downloads) return "exhausted";
  return "ok";
}

/** Nazwa pliku, ktory dostaje klient. Numer zamowienia w nazwie nie jest ozdoba:
 *  po roku to jedyne, co laczy plik na dysku z rachunkiem. */
export function downloadName(orderRef) {
  // Nazwa idzie do naglowka `Content-Disposition`, ktory jest polem tekstowym
  // w odpowiedzi HTTP. Cudzyslow albo nowa linia w nazwie rozbija ten naglowek,
  // wiec przepuszczamy wylacznie znaki, ktore maja tu prawo byc.
  const czysty = String(orderRef || "zamowienie").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `aejaca-${czysty || "zamowienie"}.zip`;
}

/**
 * Zaklada linki dla wszystkich cyfrowych pozycji zamowienia.
 *
 * Wywolywane po KAZDYM potwierdzeniu zaplaty, wiec musi byc odporne na
 * powtorzenie: Autopay potrafi przyslac ten sam SUCCESS drugi raz, a przelew
 * bywa potwierdzany recznie po tym, jak bramka juz zadzialala. Pozycja, ktora
 * ma juz link, nie dostaje drugiego.
 *
 * @returns {Promise<Array<{token, orderItemId, title}>>} linki tego zamowienia
 */
export async function issueDownloads(pool, orderId, opts = {}) {
  const dni = opts.days ?? DOWNLOAD_DAYS;
  const ile = opts.max ?? MAX_DOWNLOADS;

  const { rows: items } = await pool.query(
    `SELECT oi.id, oi.title, oi.item_type, oi.calculator, oi.params, oi.product_id,
            p.kind AS product_kind
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
    [orderId]
  );
  const cyfrowe = items.filter(isDigitalItem);
  if (!cyfrowe.length) return [];

  const { rows: juzSa } = await pool.query(
    "SELECT order_item_id, token FROM downloads WHERE order_id = $1",
    [orderId]
  );
  const maja = new Map(juzSa.map((r) => [Number(r.order_item_id), r.token]));

  const wynik = [];
  for (const item of cyfrowe) {
    const stary = maja.get(Number(item.id));
    if (stary) {
      wynik.push({ token: stary, orderItemId: Number(item.id), title: item.title });
      continue;
    }
    const token = crypto.randomBytes(24).toString("hex");
    await pool.query(
      `INSERT INTO downloads (order_id, order_item_id, product_id, token, max_downloads, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' days')::INTERVAL)`,
      [orderId, item.id, item.product_id || null, token, ile, String(dni)]
    );
    wynik.push({ token, orderItemId: Number(item.id), title: item.title });
  }
  return wynik;
}

/**
 * Zuzywa jedno pobranie i oddaje pozycje, ktorej dotyczy.
 *
 * Licznik podnosi sie W TYM SAMYM zapytaniu, ktore sprawdza warunki, bo
 * inaczej dwa rownolegle klikniecia w link przechodza oba przy ostatnim
 * dostepnym pobraniu. Warunek w `WHERE` zalatwia to bez transakcji i bez
 * blokady wiersza.
 *
 * @returns {Promise<{ok: true, item, order} | {ok: false, reason}>}
 */
export async function takeDownload(pool, token) {
  const czysty = String(token || "").trim();
  if (!/^[a-f0-9]{32,64}$/.test(czysty)) return { ok: false, reason: "unknown" };

  const { rows } = await pool.query(
    `UPDATE downloads
        SET download_count = download_count + 1, last_downloaded_at = NOW()
      WHERE token = $1 AND expires_at > NOW() AND download_count < max_downloads
      RETURNING id, order_id, order_item_id, download_count, max_downloads, expires_at`,
    [czysty]
  );

  if (!rows.length) {
    // Nic nie zuzylismy, wiec mozemy spokojnie zapytac, dlaczego.
    const { rows: podglad } = await pool.query(
      "SELECT expires_at, download_count, max_downloads FROM downloads WHERE token = $1",
      [czysty]
    );
    return { ok: false, reason: downloadState(podglad[0]) };
  }

  const wydanie = rows[0];
  const { rows: items } = await pool.query(
    `SELECT oi.id, oi.title, oi.calculator, oi.params, o.order_ref, o.lang
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = $1`,
    [wydanie.order_item_id]
  );
  if (!items.length) return { ok: false, reason: "unknown" };

  return {
    ok: true,
    item: items[0],
    pozostalo: Math.max(0, wydanie.max_downloads - wydanie.download_count),
    expiresAt: wydanie.expires_at,
  };
}
