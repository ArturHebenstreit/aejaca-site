#!/usr/bin/env node
// ============================================================
// NIEUDANE SCIEZKI ZOSTAWIAJA SLAD
// ============================================================
// Wlasciciel zapytal 6 wrzesnia, czy zbieramy dane o nieudanych platnosciach
// i o rezygnacjach. Odpowiedz brzmiala "polowicznie" i to jest najgorszy
// rodzaj odpowiedzi: serwer zapisywal kazde powiadomienie z bramki, w tym
// `FAILURE`, a przegladarka nie zapisywala ani jednego zdarzenia o
// niepowodzeniu. Ginelo przez to wszystko, co dzieje sie PRZED bramka i PO
// niej: kasa, ktora odmowila zalozenia zamowienia, formularz bramki, ktory nie
// wyszedl z przegladarki, i klient, ktory wrocil na strone zamowienia.
//
// Do tego rezygnowac umial wylacznie panel, wiec kolumna `cancel_reason` byla
// zawsze NASZYM zdaniem o tym, dlaczego klient odpadl, pisanym po fakcie.
//
// Ten sprawdzian pilnuje szesciu rzeczy, kazdej po jednej cichej dziurze:
//
// 1. LISTA POWODOW JEST ZAMKNIETA I MA KODY. Napis poszedlby do bazy w trzech
//    jezykach i ten sam powod bylby w zestawieniu trzema roznymi powodami.
// 2. ZAPIS TRZYMA KOD Z PRZODU. Po nim grupuje raport, a notatka wpisana
//    recznie przez panel nie ma prefiksu i ma zostac rozpoznana jako reczna,
//    a nie przypisana do przypadkowego kodu.
// 3. TRASA KLIENTA WPUSZCZA ZETON ZAMOWIENIA, nie zeton administratora, i nie
//    dotyka zamowienia oplaconego: zwrot pieniedzy to osobna droga i osobna
//    decyzja (regulamin par. 11).
// 4. REZYGNACJA ZWALNIA TOWAR I KOD, tak samo jak rezygnacja z panelu. Inaczej
//    sztuka stalaby zarezerwowana do wygasniecia.
// 5. KAZDA NIEUDANA SCIEZKA W KASIE MA SWOJE ZDARZENIE. `place_order` liczy
//    PROBY, wiec bez tego kasa, ktora odmowila, wygladala w lejku dokladnie
//    jak kasa, ktora przyjela.
// 6. STRONA ZAMOWIENIA ZGLASZA, ZE KLIENT ZOBACZYL NIEPOWODZENIE i czy
//    sprobowal jeszcze raz. Z samej tabeli bramki tego nie widac.
//
// Uruchamiany w `npm run build`.

import { readFileSync } from "node:fs";

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};
const plik = (sciezka) => readFileSync(new URL(sciezka, import.meta.url), "utf8");

const P = await import("../src/data/powodyRezygnacji.js");

console.log("1. Lista powodow jest zamknieta, ma kody i trzy jezyki");
{
  ok(Array.isArray(P.POWODY_REZYGNACJI) && P.POWODY_REZYGNACJI.length >= 5,
    "powodow jest tyle, zeby klient znalazl swoj", P.POWODY_REZYGNACJI?.length);
  ok(P.POWODY_REZYGNACJI.some((p) => p.id === "inny"),
    "jest worek na powod spoza listy, inaczej czesc ludzi nie odpowie wcale");
  for (const p of P.POWODY_REZYGNACJI) {
    ok(/^[a-z_]+$/.test(p.id), `${p.id}: kod bez znakow, ktore psuja zapytanie`);
    for (const lang of ["pl", "en", "de"]) {
      ok(typeof p.label?.[lang] === "string" && p.label[lang].length > 3,
        `${p.id}: napis po ${lang}`);
    }
  }
  const kody = P.POWODY_REZYGNACJI.map((p) => p.id);
  ok(new Set(kody).size === kody.length, "kody sie nie powtarzaja");
  ok(P.znanyPowod("cena") && !P.znanyPowod("nie-ma-takiego"), "nieznany kod odpada");
}

console.log("2. Zapis trzyma kod z przodu, notatka reczna zostaje reczna");
{
  ok(P.zapisPowodu("cena") === "cena", "sam kod, gdy klient nic nie dopisal");
  ok(P.zapisPowodu("cena", "przy tym terminie") === "cena: przy tym terminie",
    "kod, dwukropek, zdanie klienta", P.zapisPowodu("cena", "przy tym terminie"));
  ok(P.kodZZapisu("cena: przy tym terminie") === "cena", "kod da sie odczytac z powrotem");
  ok(P.kodZZapisu("klient dzwonil, rozmyslil sie") === null,
    "notatka panelu nie udaje kodu", P.kodZZapisu("klient dzwonil, rozmyslil sie"));
  ok(P.kodZZapisu(null) === null && P.kodZZapisu("") === null, "pusty zapis nie wywraca odczytu");
  // Zdanie klienta bywa dluzsze niz kolumna. Obciecie ma byc po naszej stronie.
  ok(P.zapisPowodu("inny", "x".repeat(900)).length < 600, "dlugie zdanie jest obcinane");
  ok(P.etykietaPowodu("cena", "de") && P.etykietaPowodu("cena", "de") !== P.etykietaPowodu("cena", "pl"),
    "etykieta idzie w jezyku odbiorcy");
}

console.log("3. Trasa rezygnacji klienta stoi na zetonie zamowienia");
{
  const server = plik("../chat-api/server.js");
  const m = server.match(/app\.post\("\/api\/orders\/:ref\/cancel-by-customer"[\s\S]{0,3000}?\n\}\);/);
  ok(Boolean(m), "trasa istnieje");
  const t = m ? m[0] : "";
  ok(!/requireAdmin/.test(t), "NIE stoi za zetonem administratora, bo uzywa jej klient");
  ok(/secretMatches\(token, order\.access_token\)/.test(t), "sprawdza zeton zamowienia");
  ok(/znanyPowod\(kod\)/.test(t), "odrzuca powod spoza listy");
  ok(/order\.paid_at \|\| order\.fulfilled_at/.test(t),
    "nie dotyka zamowienia oplaconego: zwrot pieniedzy to osobna droga");
  ok(/CANCELLABLE_STATUSES\.includes\(order\.status\)/.test(t), "tylko stany, z ktorych jest z czego rezygnowac");
  ok(/cancelled_by = 'klient'/.test(t), "zapisuje, ze to byla decyzja klienta, a nie nasza");
  ok(/zapisPowodu\(kod, wlasne\)/.test(t), "powod zapisuje sie kodem, nie napisem");
  ok(/releaseOrderReservations/.test(t) && /releaseOrderRedemptions/.test(t),
    "towar i kod rabatowy wracaja do puli");
  // Warunek w UPDATE, a nie tylko odczyt wyzej: miedzy SELECT a UPDATE moze
  // wejsc powiadomienie z bramki.
  ok(/paid_at IS NULL AND fulfilled_at IS NULL AND status = ANY/.test(t),
    "UPDATE sam pilnuje stanu, a nie ufa odczytowi sprzed chwili");
}

console.log("4. Kazda nieudana sciezka w kasie ma swoje zdarzenie");
{
  const kasa = plik("../src/pages/Checkout.jsx");
  for (const [etykieta, wzor] of [
    ["nieudane zalozenie zamowienia", /trackCheckout\("checkout_failed", `order_create\|/],
    ["nieudany start platnosci", /trackCheckout\("checkout_failed", `payment_start\|/],
    ["formularz bramki nie wyszedl", /trackCheckout\("checkout_failed", "gateway_form_blocked"/],
    ["wyjatek po drodze", /trackCheckout\("checkout_failed", `wyjatek\|/],
    ["zamowienie naprawde powstalo", /trackCheckout\("order_created"/],
  ]) {
    ok(wzor.test(kasa), etykieta);
  }
  // `place_order` MUSI stac przed sprawdzeniem odpowiedzi, inaczej przestaje
  // liczyc proby i roznica "proby minus zalozone" znika razem z nim.
  ok(kasa.indexOf('trackCheckout("place_order"') < kasa.indexOf("if (!created.ok)"),
    "place_order dalej liczy PROBY, a nie sukcesy");
}

console.log("5. Strona zamowienia zglasza, co zobaczyl i zrobil klient");
{
  const strona = plik("../src/pages/OrderStatus.jsx");
  // Nazwa zdarzenia jest tu wyliczana (`failed ? ... : expired ? ...`), wiec
  // szukamy samego napisu, a nie wywolania z napisem w srodku.
  ok(/"payment_failed_seen"/.test(strona), "zobaczona nieudana platnosc");
  ok(/trackCheckout\("payment_retry_click"/.test(strona), "klikniecie ponowienia");
  ok(/trackCheckout\("checkout_failed", `retry\|/.test(strona), "nieudane ponowienie");
  ok(/trackCheckout\("order_cancelled_by_customer"/.test(strona), "rezygnacja klienta");
  ok(/order_expired_seen/.test(strona), "zobaczone wygasniecie");
  // Zdarzenie raz na wejscie, a nie przy kazdym renderze: strona odpytuje
  // status kilka razy pod rzad, czekajac na powiadomienie z bramki.
  ok(/zgloszonyStan/.test(strona), "zdarzenie stanu idzie raz, a nie przy kazdym odpytaniu");
  ok(/cancel-by-customer/.test(strona), "strona wola trase rezygnacji klienta");
  ok(/paidAt/.test(strona) && /awaiting_payment", "awaiting_transfer/.test(strona),
    "przycisk rezygnacji tylko przy zamowieniu nieoplaconym");
}

console.log("6. Lustro dla serwera istnieje");
{
  const lustro = plik("../chat-api/pricing/powodyRezygnacji.js");
  ok(/POWODY_REZYGNACJI/.test(lustro) && /zapisPowodu/.test(lustro),
    "chat-api/pricing/powodyRezygnacji.js jest kopia z src/data");
  const zrodlo = plik("../src/data/powodyRezygnacji.js");
  const kody = (t) => [...t.matchAll(/\{ id: "([a-z_]+)"/g)].map((m) => m[1]).join(",");
  ok(kody(lustro) === kody(zrodlo), "kopia niesie te same kody co oryginal", [kody(lustro), kody(zrodlo)]);
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nNieudane sciezki: kazda zostawia slad");
process.exit(bledy ? 1 : 0);
