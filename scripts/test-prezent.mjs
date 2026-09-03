#!/usr/bin/env node
// ============================================================
// KOD PREZENTOWY: wystawianie i wreczanie
// ============================================================
// Polecenie wlasciciela, 2026-09-03: jeden formularz ma wystawic kod i albo
// wyslac go mailem, albo zapisac do wreczenia inna droga. Warunki domyslne:
// jedno uzycie, caly asortyment, 90 dni.
//
// Trzy rzeczy, ktore ten sprawdzian trzyma na miejscu:
//
// 1. PREZENT NIGDY NIE ODZYSKUJE CUDZEGO KODU. `issueSingleUseCode` celowo
//    oddaje kod juz wystawiony temu adresowi w tej samej kampanii, zeby klient
//    proszacy piec razy o wycene dostal jeden rabat. Przy prezencie ta sama
//    regula znaczylaby, ze drugi prezent dla tej samej osoby po cichu
//    przejmuje wartosc pierwszego, a panel pokazuje jeden kod zamiast dwoch.
//
// 2. GRANICE SA SPRAWDZANE PRZY WYSTAWIANIU, a nie dopiero przez baze.
//    Warunek `discount_percent_range` odrzucilby 150%, ale bledem bazy,
//    czyli piecset ze strony panelu zamiast zdania po polsku.
//
// 3. BEZ ADRESU KOD JEST NA OKAZICIELA i to jest swiadomy skutek. Imienny kod
//    bez adresu nie istnieje, wiec formularz musi o tym mowic, a kod musi sie
//    wystawic, a nie odmowic.
//
// Uruchamiany w `npm run build`.

import { readFileSync } from "node:fs";
import { issueGiftCode, MAX_PERCENT } from "../chat-api/discounts.js";
import { buildPrezent } from "../chat-api/leadMail.js";

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};

/**
 * Atrapa bazy. Zapisuje kazde zapytanie, zeby dalo sie sprawdzic NIE TYLKO to,
 * co funkcja zwrocila, ale i to, o co zapytala: brak SELECT-a szukajacego
 * cudzego kodu jest tu cala poanta.
 */
function atrapaBazy() {
  const zapytania = [];
  return {
    zapytania,
    async query(sql, params) {
      zapytania.push({ sql, params });
      if (!/^\s*INSERT/i.test(sql)) return { rows: [] };
      return {
        rows: [{
          code: params[0],
          valid_from: new Date("2026-09-03T10:00:00Z"),
          valid_to: new Date("2026-12-02T10:00:00Z"),
        }],
      };
    },
  };
}

console.log("1. Prezent zawsze wystawia NOWY kod");
{
  const pool = atrapaBazy();
  const kod = await issueGiftCode(pool, { email: "anna@example.com", kind: "percent", value: 15 });
  ok(Boolean(kod?.code), "kod powstal", kod);
  ok(pool.zapytania.length === 1, "jedno zapytanie, bez szukania kodu wczesniejszego", pool.zapytania.length);
  ok(/^\s*INSERT/i.test(pool.zapytania[0].sql), "i jest nim INSERT");
  ok(!/SELECT code/i.test(pool.zapytania.map((z) => z.sql).join("\n")),
    "nigdzie nie odzyskuje kodu wystawionego wczesniej");
}

console.log("2. Warunki domyslne prezentu");
{
  const pool = atrapaBazy();
  await issueGiftCode(pool, { email: "anna@example.com", kind: "percent", value: 15 });
  const { sql, params } = pool.zapytania[0];
  ok(/'prezent'/.test(sql), "kampania to `prezent`, wiec da sie je znalezc na liscie");
  ok(/'all'/.test(sql), "obejmuje caly asortyment");
  ok(/max_uses, max_uses_per_email/.test(sql) && /1, 1,/.test(sql), "jedno uzycie i jeden adres");
  ok(params.includes("90"), "domyslnie 90 dni", params);
  ok(params[5] === "anna@example.com", "wystawiony na adres odbiorcy", params[5]);
}

console.log("3. Bez adresu kod jest na okaziciela, a nie odmowa");
{
  const pool = atrapaBazy();
  const kod = await issueGiftCode(pool, { kind: "amount", value: 20000 });
  ok(Boolean(kod?.code), "kod powstal mimo braku adresu", kod);
  ok(pool.zapytania[0].params[5] === null, "adres jest pusty, wiec kod dziala u kazdego",
    pool.zapytania[0].params[5]);
}

console.log("4. Granice sprawdza silnik, a nie baza");
{
  const pool = atrapaBazy();
  ok(await issueGiftCode(pool, { value: MAX_PERCENT + 1 }) === null, `procent ponad ${MAX_PERCENT} odpada`);
  ok(await issueGiftCode(pool, { value: 0 }) === null, "zero odpada");
  ok(await issueGiftCode(pool, { value: 12.5 }) === null, "ulamek odpada");
  ok(await issueGiftCode(pool, { value: -5 }) === null, "wartosc ujemna odpada");
  ok(pool.zapytania.length === 0, "zadne z nich nie dotknelo bazy", pool.zapytania.length);
  // Kwota nie ma gornej granicy procentowej: 200 zl to 20000 groszy, czyli
  // liczba wieksza od MAX_PERCENT, a mimo to poprawna.
  ok(Boolean(await issueGiftCode(pool, { kind: "amount", value: 20000 })), "kwota 200 zl przechodzi");
}

console.log("5. Waznosc trzymana w rozsadnych granicach");
{
  const pool = atrapaBazy();
  await issueGiftCode(pool, { value: 10, days: 5000 });
  ok(pool.zapytania[0].params[4] === "730", "dwa lata to gora", pool.zapytania[0].params[4]);
  await issueGiftCode(pool, { value: 10, days: 0 });
  ok(pool.zapytania[1].params[4] === "90", "zero dni czyta sie jako brak wyboru", pool.zapytania[1].params[4]);
}

console.log("6. Trasa prezentu nie siega po odzyskiwanie kodow");
{
  // Regula, ktora latwo zlamac przy nastepnym porzadkowaniu: obie funkcje
  // wygladaja podobnie, a roznica miedzy nimi jest cala rzecza.
  const server = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  const trasa = server.match(/app\.post\("\/api\/admin\/discounts\/gift"[\s\S]*?\n\}\);/)?.[0] || "";
  ok(trasa.length > 0, "trasa prezentu istnieje");
  ok(/issueGiftCode/.test(trasa), "wystawia kod przez issueGiftCode");
  ok(!/issueSingleUseCode/.test(trasa), "i nie przez issueSingleUseCode");
  ok(/no_email/.test(trasa), "odmawia wyslania bez adresu, zamiast po cichu zapisywac");
  ok(/mail_failed/.test(trasa) && /codeIssued/.test(trasa),
    "gdy poczta padnie, oddaje kod, ktory juz powstal");
}

console.log("7. Wiadomosc niesie to, co ma niesc");
{
  const m = buildPrezent({
    lang: "pl", to: "anna@example.com", kod: "AEJP-3M8QRT", wartosc: "200.00 PLN",
    waznyOd: "03.09.2026", waznyDo: "02.12.2026", powod: "Za cierpliwość przy opóźnieniu odlewu",
  });
  ok(m.to === "anna@example.com", "idzie do odbiorcy");
  ok(/AEJP-3M8QRT/.test(m.html) && /AEJP-3M8QRT/.test(m.text), "kod w obu wersjach, HTML i tekstowej");
  ok(/200\.00 PLN/.test(m.text), "wartosc w walucie jezyka");
  ok(/od 03\.09\.2026 do 02\.12\.2026/.test(m.text), "obie daty waznosci");
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nPrezent: wszystko sie zgadza");
process.exit(bledy ? 1 : 0);
