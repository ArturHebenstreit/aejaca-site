// ============================================================
// AUTOPAY, protokol bramki platniczej
// ============================================================
// Zrodlo: "Dokumentacja bramki platniczej" Autopay, wersja 2026-07-29.
// Skrot regul w MDs/AEJaCA_Autopay_Integration.md.
//
// Klucz wspoldzielony czytamy wylacznie ze zmiennej srodowiskowej.
// Nie moze trafic do repozytorium, logow ani odpowiedzi HTTP.

import crypto from "node:crypto";

export const AUTOPAY = {
  serviceId: process.env.AUTOPAY_SERVICE_ID || "",
  hashKey: process.env.AUTOPAY_HASH_KEY || "",
  hashAlgo: (process.env.AUTOPAY_HASH_ALGO || "sha256").toLowerCase(),
  host: process.env.AUTOPAY_HOST || "https://pay.autopay.eu",
  startPath: process.env.AUTOPAY_START_PATH || "/payment",
};

export function autopayConfigured() {
  return Boolean(AUTOPAY.serviceId && AUTOPAY.hashKey);
}

export function startUrl() {
  return `${AUTOPAY.host.replace(/\/$/, "")}${AUTOPAY.startPath}`;
}

/**
 * Suma kontrolna komunikatu.
 *
 * Sklejamy same wartosci, w kolejnosci numeracji z dokumentacji, separatorem
 * "|", a na koncu doklejamy klucz wspoldzielony. Pole puste lub nieobecne
 * wypada RAZEM ze swoim separatorem, dlatego filtrujemy przed zlaczeniem.
 * To najczestsza przyczyna odrzucenia transakcji, bo bramka nie mowi, ktore
 * pole jest zle.
 */
export function computeHash(values, key = AUTOPAY.hashKey) {
  const parts = values
    .filter((v) => v !== null && v !== undefined && String(v) !== "")
    .map((v) => String(v));
  parts.push(key);
  return crypto.createHash(AUTOPAY.hashAlgo).update(parts.join("|"), "utf8").digest("hex");
}

/** Porownanie odporne na atak czasowy */
export function hashEquals(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/** Kwota w formacie, ktorego wymaga Autopay: 0.00, kropka dziesietna */
export function formatAmount(grosze) {
  return (grosze / 100).toFixed(2);
}

/**
 * Tytul przelewu. Dokumentacja dopuszcza wylacznie znaki alfanumeryczne
 * alfabetu lacinskiego oraz . : - , i spacje, maksymalnie 79 znakow.
 * Polskie znaki diakrytyczne trzeba rozlozyc, inaczej bramka odrzuci pole.
 */
export function sanitizeDescription(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^A-Za-z0-9.:,\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 79);
}

/**
 * Parametry startu transakcji wraz z podpisem.
 * Kolejnosc pol w tablicy do hasha odpowiada numeracji z dokumentacji:
 * ServiceID 1, OrderID 2, Amount 3, Description 4, GatewayID 5,
 * Currency 6, CustomerEmail 7, ValidityTime 19, LinkValidityTime 34.
 */
export function buildStartTransaction({ orderId, amountGrosze, description, gatewayId, customerEmail, validityTime }) {
  const params = {
    ServiceID: AUTOPAY.serviceId,
    OrderID: orderId,
    Amount: formatAmount(amountGrosze),
  };
  const desc = sanitizeDescription(description);
  if (desc) params.Description = desc;
  if (gatewayId !== null && gatewayId !== undefined && gatewayId !== "") params.GatewayID = String(gatewayId);
  params.Currency = "PLN";
  params.CustomerEmail = customerEmail;
  if (validityTime) params.ValidityTime = validityTime;

  params.Hash = computeHash([
    params.ServiceID,
    params.OrderID,
    params.Amount,
    params.Description,
    params.GatewayID,
    params.Currency,
    params.CustomerEmail,
    params.ValidityTime,
  ]);

  return { url: startUrl(), method: "POST", params };
}

/** ValidityTime w formacie YYYY-MM-DD HH:MM:SS, czas CET */
export function formatValidityTime(date) {
  const s = date.toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 19)}`;
}

/**
 * Weryfikacja powrotu klienta z platnosci.
 * Hash = SHA256("ServiceID|OrderID|klucz"). Dokumentacja okresla te
 * weryfikacje jako obowiazkowa: bez niej dowolna osoba moze wejsc na
 * adres powrotu z cudzym numerem zamowienia.
 */
export function verifyReturn({ ServiceID, OrderID, Hash }) {
  if (!ServiceID || !OrderID || !Hash) return false;
  if (String(ServiceID) !== String(AUTOPAY.serviceId)) return false;
  return hashEquals(String(Hash).toLowerCase(), computeHash([ServiceID, OrderID]));
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : null;
}

/**
 * Rozpakowanie komunikatu ITN.
 * Przychodzi jako parametr POST "transactions", XML zakodowany base64.
 * Wezel transactions zawiera zawsze dokladnie jedna transakcje.
 */
export function parseITN(transactionsB64) {
  if (!transactionsB64) return { ok: false, error: "missing_payload" };

  let xml;
  try {
    xml = Buffer.from(String(transactionsB64), "base64").toString("utf8");
  } catch {
    return { ok: false, error: "bad_base64" };
  }
  if (!xml.includes("<transactionList")) return { ok: false, error: "bad_xml" };

  const serviceID = tag(xml, "serviceID");
  const hash = (tag(xml, "hash") || "").toLowerCase();
  const txMatch = xml.match(/<transaction>([\s\S]*?)<\/transaction>/i);
  if (!txMatch) return { ok: false, error: "no_transaction", xml };

  const tx = txMatch[1];
  const fields = {
    orderID: tag(tx, "orderID"),
    remoteID: tag(tx, "remoteID"),
    amount: tag(tx, "amount"),
    currency: tag(tx, "currency"),
    gatewayID: tag(tx, "gatewayID"),
    paymentDate: tag(tx, "paymentDate"),
    paymentStatus: tag(tx, "paymentStatus"),
    paymentStatusDetails: tag(tx, "paymentStatusDetails"),
  };

  // Kolejnosc pol do hasha wprost z dokumentacji, str. 31
  const expected = computeHash([
    serviceID,
    fields.orderID,
    fields.remoteID,
    fields.amount,
    fields.currency,
    fields.gatewayID,
    fields.paymentDate,
    fields.paymentStatus,
    fields.paymentStatusDetails,
  ]);

  const hashValid = hashEquals(hash, expected) && String(serviceID) === String(AUTOPAY.serviceId);
  return { ok: true, serviceID, hashValid, xml, ...fields };
}

/**
 * Odpowiedz potwierdzajaca odbior ITN.
 * Bez niej system ponawia wysylke. Potwierdzamy KAZDY komunikat, takze taki,
 * ktory niczego nie zmienia w zamowieniu.
 */
export function buildITNConfirmation(orderId, confirmation = "CONFIRMED") {
  const serviceId = AUTOPAY.serviceId;
  const hash = computeHash([serviceId, orderId, confirmation]);
  return `<?xml version="1.0" encoding="UTF-8"?>
<confirmationList>
  <serviceID>${serviceId}</serviceID>
  <transactionsConfirmations>
    <transactionConfirmed>
      <orderID>${orderId}</orderID>
      <confirmation>${confirmation}</confirmation>
    </transactionConfirmed>
  </transactionsConfirmations>
  <hash>${hash}</hash>
</confirmationList>`;
}

/**
 * Lista kanalow platnosci, zeby nie zaszywac GatewayID w kodzie.
 * Hash = SHA256("ServiceID|MessageID|Currencies|Language|klucz").
 */
let _gatewayCache = { ts: 0, data: null };
const GATEWAY_TTL = 6 * 60 * 60 * 1000;

export async function fetchGatewayList({ language = "PL", currencies = "PLN" } = {}) {
  if (!autopayConfigured()) return null;
  if (_gatewayCache.data && Date.now() - _gatewayCache.ts < GATEWAY_TTL) return _gatewayCache.data;

  // Ta metoda, w odroznieniu od startu transakcji, przyjmuje JSON (REST),
  // a ServiceID jest w nim liczba, nie napisem. Wyslanie formularza konczy
  // sie odpowiedzia HTTP 415.
  const messageID = crypto.randomBytes(16).toString("hex");
  const body = JSON.stringify({
    ServiceID: Number(AUTOPAY.serviceId),
    MessageID: messageID,
    Currencies: currencies,
    Language: language,
    Hash: computeHash([AUTOPAY.serviceId, messageID, currencies, language]),
  });

  try {
    const resp = await fetch(`${AUTOPAY.host.replace(/\/$/, "")}/gatewayList/v3`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error(`HTTP ${resp.status} ${detail.slice(0, 200)}`);
    }
    const json = await resp.json();
    if (json.result !== "OK") throw new Error(`${json.errorStatus || "gatewayList error"}: ${json.description || ""}`);
    _gatewayCache = { ts: Date.now(), data: json };
    return json;
  } catch (e) {
    console.error("[autopay] gatewayList failed:", e.message);
    return _gatewayCache.data;
  }
}
