// ============================================================
// CZTERY DROGI WYJSCIA ZE SPRAWY, KAZDA Z INNA KWOTA
// ============================================================
// "Anulowane" bylo jednym slowem na cztery zdarzenia, ktore regulamin
// rozroznia: odstapienie konsumenta w 14 dni, nasze niedowiezienie, nasza
// odmowa i rezygnacja z rzeczy robionej na zamowienie. Przy trzech pierwszych
// zwrot jest OBOWIAZKIEM, przy czwartej decyzja handlowa (regulamin par. 11:
// prawa odstapienia przy rzeczy na zamowienie nie ma).
//
// Sprawdzian pilnuje trzech rzeczy: ze drogi sa rozroznione w danych, ze
// kwota zwrotu stoi osobno od stanu sprawy, i ze pieniadze do oddania widac
// takze wtedy, gdy zamknietej sprawy nie ma w widoku.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DROGI_ZAMKNIECIA, drogaZamkniecia, drogiNaEtapie, domyslnyZwrotGrosze }
  from "../chat-api/drogiZamkniecia.js";
import { buildZamkniecieSprawy } from "../chat-api/orderMail.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const czytaj = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const serwer = czytaj("chat-api", "server.js");
const panel = czytaj("admin", "server.js");
const widok = czytaj("admin", "views", "queue.ejs");
const schemat = czytaj("scripts", "orders-schema.sql");

// --- 1. Cztery drogi, kazda opisana i osadzona na etapach -----------------
assert.equal(DROGI_ZAMKNIECIA.length, 4, "drog wyjscia jest cztery");
for (const d of DROGI_ZAMKNIECIA) {
  assert.ok(d.label && d.opis, `${d.id}: droga bez nazwy albo bez opisu jest wyborem w ciemno`);
  assert.ok(d.etapy.length > 0, `${d.id}: droga bez etapow nie pokaze sie nigdy`);
  assert.ok(["pelny", "decyzja"].includes(d.zwrot), `${d.id}: nieznana zasada zwrotu`);
}

// Odstapienie konsumenta dziala TAKZE po wydaniu rzeczy: to jest wlasnie ten
// przypadek, w ktorym klient odsyla paczke. Reszta drog po wydaniu nie ma
// sensu, bo to juz nie zamkniecie sprawy, tylko reklamacja albo zwrot.
assert.deepEqual(drogiNaEtapie("shipped").map((d) => d.id), ["odstapienie_14"],
  "po wydaniu rzeczy zostaje wylacznie odstapienie konsumenta");
assert.equal(drogiNaEtapie("in_production").length, 4, "w trakcie pracy otwarte sa wszystkie cztery drogi");

// Przy rzeczy na zamowienie prawa odstapienia nie ma, ale czy dana sztuka byla
// robiona na miare, wie czlowiek, a nie kolumna. Panel wiec OSTRZEGA, zamiast
// blokowac, i to ostrzezenie musi istniec.
assert.ok(drogaZamkniecia("odstapienie_14").ostrzezenieNaZamowienie,
  "przy odstapieniu w 14 dni stoi ostrzezenie o rzeczy na zamowienie");

// --- 2. Podpowiedz kwoty idzie za obowiazkiem, nie za nastrojem -----------
const oplacone = { paid_at: new Date(), total_grosze: 45000 };
for (const id of ["odstapienie_14", "nasza_wina", "nasza_decyzja"]) {
  assert.equal(domyslnyZwrotGrosze(drogaZamkniecia(id), oplacone), 45000,
    `${id}: zwrot jest obowiazkiem, wiec podpowiadamy cala wplate`);
}
assert.equal(domyslnyZwrotGrosze(drogaZamkniecia("rezygnacja_klienta"), oplacone), 0,
  "przy rezygnacji z rzeczy na zamowienie nic sie nie nalezy, wiec podpowiadamy zero");
assert.equal(domyslnyZwrotGrosze(drogaZamkniecia("nasza_wina"), { paid_at: null, total_grosze: 45000 }), 0,
  "z zamowienia nieoplaconego nie ma czego zwracac");

// --- 3. Kwota stoi OSOBNO od stanu sprawy ---------------------------------
// Drugi stan koncowy ("zwrocone") znaczylby, ze "anulowane" zaczyna znaczyc
// "anulowane, ale pieniadze jeszcze wisza": dwie nazwy na jedna rzecz.
assert.match(schemat, /cancel_kind\s+VARCHAR/, "schemat pamieta, ktora droga");
assert.match(schemat, /refund_grosze\s+INTEGER/, "schemat pamieta, ile sie nalezy");
assert.match(schemat, /refunded_at\s+TIMESTAMPTZ/, "schemat pamieta, czy pieniadze poszly");
assert.match(serwer, /UPDATE orders SET status = 'cancelled'[\s\S]{0,400}cancel_kind = \$4, refund_grosze = \$5/,
  "zamkniecie zapisuje droge i kwote razem ze stanem");
// Decyzja to nie przelew. `refunded_at` stawia dopiero potwierdzenie, bo
// miedzy jednym a drugim stoi czlowiek przy koncie bankowym.
assert.doesNotMatch(serwer, /status = 'cancelled'[\s\S]{0,400}refunded_at = NOW\(\)/,
  "zamkniecie sprawy nie udaje, ze pieniadze juz poszly");
assert.match(serwer, /app\.post\("\/api\/orders\/:ref\/refunded"/, "jest osobne potwierdzenie zwrotu");
assert.match(serwer, /refund_grosze > 0 AND refunded_at IS NULL/,
  "potwierdzic mozna wylacznie zwrot, ktory sie nalezy i jeszcze nie poszedl");

// Zwrot nigdy nie przekracza tego, co klient zaplacil.
assert.match(serwer, /const zaplacone = order\.paid_at \? Number\(order\.total_grosze \|\| 0\) : 0;/,
  "zaplacona kwota jest sufitem zwrotu");

// --- 4. Dlug widac takze poza filtrem ------------------------------------
// Sprawa zamknieta nie stoi w domyslnym widoku kolejki, wiec bez tej liczby
// zobowiazanie znikaloby z ekranu razem z wierszem.
assert.match(serwer, /FROM orders WHERE status = 'cancelled' AND refund_grosze > 0 AND refunded_at IS NULL/,
  "kolejka liczy pieniadze do oddania poza filtrem");
assert.match(widok, /Do zwrotu:/, "kolejka pokazuje pieniadze do oddania");
assert.match(panel, /app\.post\("\/queue\/:ref\/close"/, "panel ma trase zamkniecia sprawy");
assert.match(panel, /app\.post\("\/queue\/:ref\/refunded"/, "panel ma trase potwierdzenia zwrotu");
// Zadnej drogi nie zaznaczamy z gory: wybor ma byc decyzja, a nie skutkiem
// przeoczenia przy zamykaniu cudzego zamowienia.
const pole = widok.match(/<input type="radio" name="kind"[\s\S]{0,400}?\/>/);
assert.ok(pole, "w formularzu stoi wybor drogi");
assert.doesNotMatch(pole[0], /checked/, "zadna droga nie jest zaznaczona z gory");
assert.match(pole[0], /required/, "bez wskazania drogi formularz nie przechodzi");

// --- 5. Kazda droga ma wlasny mail, w trzech jezykach ---------------------
const zamowienie = {
  order_ref: "WY20260831-A1B2C3D4-1", customer_email: "k@example.com",
  paid_at: new Date(), total_grosze: 45000,
};
for (const jezyk of ["pl", "en", "de"]) {
  const tematy = new Set();
  for (const d of DROGI_ZAMKNIECIA) {
    const mail = buildZamkniecieSprawy({ ...zamowienie, lang: jezyk }, d.id, 45000);
    assert.ok(mail, `${jezyk}/${d.id}: brak wiadomosci`);
    tematy.add(mail.subject);
    assert.ok(mail.text.includes(zamowienie.order_ref), `${jezyk}/${d.id}: mail bez numeru sprawy`);
  }
  // Cztery rozne zdarzenia, cztery rozne tematy. Jeden wspolny brzmialby jak
  // formularz, a przy naszej winie wygladalby na obojetnosc.
  assert.equal(tematy.size, 4, `${jezyk}: kazda droga ma wlasny temat`);
}

// Trzy przypadki pieniedzy, trzy rozne zdania. Milczenie o pieniadzach czyta
// sie jak zla wiadomosc, nawet gdy nia nie jest.
const pelny = buildZamkniecieSprawy({ ...zamowienie, lang: "pl" }, "nasza_wina", 45000);
const czesc = buildZamkniecieSprawy({ ...zamowienie, lang: "pl" }, "rezygnacja_klienta", 12000);
const zero = buildZamkniecieSprawy({ ...zamowienie, lang: "pl" }, "rezygnacja_klienta", 0);
assert.match(pelny.text, /Zwracamy 450,00 PLN/, "pelny zwrot podaje kwote");
assert.match(czesc.text, /część wpłaty, 120,00 PLN/, "czesciowy zwrot mowi, ze jest czesciowy");
assert.match(zero.text, /nie wraca/, "brak zwrotu tez jest powiedziany wprost");
// Zwrot wiekszy niz wplata nie istnieje, takze w mailu.
const zaduzo = buildZamkniecieSprawy({ ...zamowienie, lang: "pl" }, "nasza_wina", 99900);
assert.match(zaduzo.text, /450,00 PLN/, "mail nie obiecuje wiecej, niz klient zaplacil");

console.log("Zamkniecie sprawy: cztery drogi, kwota osobno od stanu, dlug widoczny, mail na kazda droge");
