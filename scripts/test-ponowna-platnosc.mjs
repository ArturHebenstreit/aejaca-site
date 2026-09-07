#!/usr/bin/env node
// ============================================================
// PORZUCONA PLATNOSC NIE ZAMYKA DROGI
// ============================================================
// Klientka nacisnela "Zaplac", trafila do Autopay i tam odpadla. Wrocila po
// chwili i zamiast platnosci zobaczyla ekran bez wyjscia, bo zamowienie
// przekroczylo swoj kwadrans. Zasada wlasciciela z 2026-09-07:
//
//   - porzucenie platnosci konczy sie stanem takim, jakby nigdy nie bylo
//     zaplaty, i wolno zaplacic nowa transakcja;
//   - kod rabatowy zostaje przy kliencie DO CHWILI ZAPLATY, bo porzucona
//     platnosc nie jest uzyciem kodu;
//   - za pozycje, ktorych jeszcze nie oplacil, wolno zaplacic do konca
//     waznosci oferty.
//
// Ten sprawdzian pilnuje reguly (funkcja czysta) i ksztaltu trasy, bo samo
// wskrzeszenie dzieje sie w bazie, ktorej tu nie ma.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { canRevivePayment, publicPaymentState, paymentStartProblem, REVIVABLE_PROBLEMS } from "../chat-api/paymentState.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const sprawdz = (warunek, gdyZle, gdyDobrze) => (warunek ? ok(gdyDobrze) : zle(gdyZle));

const przedChwila = new Date(Date.now() - 60_000);
const zaChwile = new Date(Date.now() + 60_000);

console.log("\n1. Co wolno wskrzesic\n");
{
  sprawdz(canRevivePayment({ status: "awaiting_payment", expires_at: przedChwila }),
    "zamowienie po terminie i bez zaplaty ma dac sie wskrzesic",
    "po terminie, nigdy nieoplacone: wskrzeszamy");
  sprawdz(canRevivePayment({ status: "expired" }),
    "zamowienie wygaszone przez zamiatarke ma dac sie wskrzesic",
    "wygaszone przez zamiatarke: wskrzeszamy");
}

console.log("\n2. Czego wskrzesic NIE wolno\n");
{
  const nie = [
    ["zaplacone", { status: "paid" }],
    ["z data zaplaty", { status: "awaiting_payment", paid_at: przedChwila }],
    ["rozliczone", { status: "awaiting_payment", fulfilled_at: przedChwila }],
    ["odwolane", { status: "cancelled" }],
    ["z data odwolania", { status: "awaiting_payment", cancelled_at: przedChwila }],
    ["czekajace na nasz przeglad", { status: "payment_review" }],
    ["przelewem, nie bramka", { status: "awaiting_transfer", payment_method: "bank_transfer" }],
  ];
  for (const [nazwa, zamowienie] of nie) {
    sprawdz(!canRevivePayment(zamowienie),
      `${nazwa}: wskrzeszenie ma byc odmowione, a nie jest`,
      `${nazwa}: nie ruszamy`);
  }
}

console.log("\n3. Przycisk zaplaty widac zanim zamowienie zostanie wskrzeszone\n");
{
  const poTerminie = { status: "awaiting_payment", expires_at: przedChwila, payment_method: "autopay" };
  sprawdz(paymentStartProblem(poTerminie) === "expired",
    "stan sam w sobie ma nadal byc odmowa, zeby nikt nie pomylil go z gotowoscia",
    "sam stan mowi 'po terminie', i dobrze");
  sprawdz(publicPaymentState(poTerminie).canRetryPayment === true,
    "strona zamowienia ma pokazac przycisk zaplaty, bo dla klienta to jedna czynnosc",
    "strona zamowienia pokazuje przycisk zaplaty");
  sprawdz(publicPaymentState({ status: "paid" }).canRetryPayment === false,
    "zamowienie zaplacone nie moze pokazywac przycisku zaplaty",
    "zaplacone nie pokazuje przycisku");
  sprawdz(REVIVABLE_PROBLEMS.includes("expired") && REVIVABLE_PROBLEMS.includes("unavailable"),
    "lista odmow do cofniecia ma obejmowac 'expired' i 'unavailable'",
    "obie odmowy z uplywu czasu da sie cofnac");
}

console.log("\n4. Trasa platnosci naprawde probuje wskrzesic\n");
{
  const serwer = readFileSync(join(ROOT, "chat-api/server.js"), "utf8");
  const start = serwer.indexOf('app.post("/api/orders/:ref/pay"');
  const trasa = serwer.slice(start, start + 2500);

  sprawdz(/canRevivePayment\(order\)/.test(trasa) && /wskrzesZamowienie\(order\)/.test(trasa),
    "trasa nie probuje wskrzeszac zamowienia przed odmowa",
    "trasa probuje wskrzesic, zanim odmowi");
  sprawdz(trasa.indexOf("wskrzesZamowienie") < trasa.indexOf("errors ="),
    "wskrzeszenie musi stac PRZED tabela odmow, inaczej klient dostanie odmowe mimo wszystko",
    "wskrzeszenie stoi przed odmowa");

  const fn = serwer.slice(serwer.indexOf("async function wskrzesZamowienie"));
  const ciało = fn.slice(0, fn.indexOf("\n}\n") + 3);
  sprawdz(/BEGIN/.test(ciało) && /COMMIT/.test(ciało) && /ROLLBACK/.test(ciało),
    "wskrzeszenie ma isc w jednej transakcji: albo wraca komplet, albo nic",
    "wskrzeszenie idzie w jednej transakcji");
  sprawdz(/FOR UPDATE/.test(ciało) && /canRevivePayment\(teraz\)/.test(ciało),
    "wskrzeszenie ma jeszcze raz sprawdzic stan pod blokada wiersza",
    "stan sprawdzony powtornie pod blokada wiersza");
  sprawdz(/reserveProduct/.test(ciało),
    "wskrzeszenie ma odzyskac rezerwacje towaru albo odmowic",
    "towar z polki jest rezerwowany na nowo");
  sprawdz(/out_of_stock/.test(ciało),
    "brak sztuk ma dac wlasny komunikat, a nie ciche przyjecie zaplaty",
    "brak sztuk ma wlasny komunikat");
  sprawdz(/reclaimRedemptions/.test(ciało),
    "wskrzeszenie ma odzyskac kod rabatowy",
    "kod rabatowy wraca do zamowienia");
  sprawdz(/discount_gone|przestal obowiazywac/.test(ciało),
    "kod, ktory przestal obowiazywac, ma zatrzymac wskrzeszenie zamiast po cichu podniesc cene",
    "kod nie do odzyskania zatrzymuje wskrzeszenie zamiast zmieniac cene");
}

console.log("\n5. Kod rabatowy wraca ten sam, a nie liczony od nowa\n");
{
  const rabaty = readFileSync(join(ROOT, "chat-api/discounts.js"), "utf8");
  const fn = rabaty.slice(rabaty.indexOf("export async function reclaimRedemptions"));
  const ciało = fn.slice(0, fn.indexOf("\n}\n") + 3);

  sprawdz(/released_at = NULL/.test(ciało),
    "odzyskanie ma zdjac znacznik zwolnienia z istniejacego wpisu",
    "odzyskujemy wlasny, zwolniony wpis");
  sprawdz(!/INSERT INTO discount_redemptions/.test(ciało),
    "odzyskanie nie moze zakladac nowego wpisu: kwota rabatu ma zostac ta sama",
    "nie zakladamy nowego wpisu, wiec kwota rabatu zostaje ta sama");
  sprawdz(/checkWindow/.test(ciało) && /max_uses/.test(ciało),
    "odzyskanie ma sprawdzic, czy kod nadal wolno wziac",
    "sprawdzamy, czy kod nadal obowiazuje i czy sie nie wyczerpal");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nPonowna zaplata po porzuceniu: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
