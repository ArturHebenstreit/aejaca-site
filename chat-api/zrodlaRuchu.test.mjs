// ============================================================
// SKAD PRZYSZLA WIZYTA: SPRAWDZIAN KLASYFIKACJI
// ============================================================
// Kanal ruchu jest liczba, na ktorej opiera sie decyzja "gdzie pisac dalej".
// Zle przypisany kanal nie wyglada na blad: wyglada na to, ze Instagram nie
// dziala, a wyszukiwarka dowozi, albo odwrotnie. Stad ten sprawdzian.

import assert from "node:assert/strict";
import { zrodloWizyty, jezykZeSciezki, toRobot } from "./zrodlaRuchu.js";

// --- Brak referrera to wejscie wprost, a nie "nieznane" -------------------
assert.deepEqual(zrodloWizyty("", {}), { kanal: "wprost", zrodlo: "(wprost)" });
assert.deepEqual(zrodloWizyty(null, {}), { kanal: "wprost", zrodlo: "(wprost)" });

// --- Wyszukiwarki --------------------------------------------------------
for (const host of ["google.com/search", "www.google.pl/", "bing.com", "duckduckgo.com", "search.brave.com"]) {
  assert.equal(zrodloWizyty(host, {}).kanal, "wyszukiwarki", `${host} to wyszukiwarka`);
}

// --- Spolecznosciowe razem z domenami przekierowan ------------------------
// `l.instagram.com` i `t.co` to sa te adresy, ktore realnie widac w danych:
// aplikacja przepuszcza klikniecie przez wlasny skracacz.
for (const host of ["instagram.com", "l.instagram.com", "t.co", "lm.facebook.com", "youtube.com"]) {
  assert.equal(zrodloWizyty(host, {}).kanal, "spolecznosciowe", `${host} to serwis spolecznosciowy`);
}

// --- Poczta i asystenci --------------------------------------------------
assert.equal(zrodloWizyty("mail.google.com/mail", {}).kanal, "poczta");
assert.equal(zrodloWizyty("chatgpt.com", {}).kanal, "asystenci AI");

// --- Wlasna domena nie jest zrodlem ruchu --------------------------------
// Przejscie miedzy naszymi stronami to nie jest nowa wizyta z zewnatrz.
// Gdyby wchodzilo do zestawienia, aejaca.com bylaby najwiekszym "zrodlem".
assert.equal(zrodloWizyty("www.aejaca.com/shop/", {}).kanal, "wewnetrzne");
assert.equal(zrodloWizyty("aejaca.com", {}).kanal, "wewnetrzne");

// --- Reszta to polecenia -------------------------------------------------
assert.deepEqual(zrodloWizyty("forum.3dmodelarze.pl/watek/12", {}),
  { kanal: "polecenia", zrodlo: "forum.3dmodelarze.pl" });

// --- Kampania oznaczona przez nas wygrywa z referrerem --------------------
// To jedyna informacja, ktora ktos wpisal SWIADOMIE. Jesli link z newslettera
// otworzy sie w Gmailu, referrer powie "poczta", a utm powie prawde o kampanii.
assert.deepEqual(
  zrodloWizyty("mail.google.com", { source: "newsletter", medium: "email" }),
  { kanal: "poczta", zrodlo: "newsletter" }
);
// "paid_social" liczy sie jako PLATNE, a nie jako spolecznosciowe: pierwsze
// pytanie przy takim ruchu brzmi "ile za niego zaplacilismy", a to, ze byl
// na Instagramie, widac w kolumnie zrodla.
assert.deepEqual(zrodloWizyty("", { source: "instagram", medium: "paid_social" }),
  { kanal: "platne", zrodlo: "instagram" });
assert.equal(zrodloWizyty("", { source: "google", medium: "cpc" }).kanal, "platne");
assert.equal(zrodloWizyty("", { source: "wizytowka", medium: "qr" }).kanal, "poza siecia");
assert.equal(zrodloWizyty("", { source: "cokolwiek", medium: "" }).kanal, "kampania",
  "samo zrodlo bez medium to nadal kampania, a nie wejscie wprost");

// --- Jezyk z adresu ------------------------------------------------------
// Polski nie ma prefiksu (ADR-0023), wiec jego brak znaczy polski.
assert.equal(jezykZeSciezki("/shop/"), "pl");
assert.equal(jezykZeSciezki("/en/shop/"), "en");
assert.equal(jezykZeSciezki("/de/"), "de");
assert.equal(jezykZeSciezki("/en"), "en");
assert.equal(jezykZeSciezki("/energia/"), "pl", "adres zaczynajacy sie od liter jezyka to nie jest ten jezyk");

// --- Maszyny -------------------------------------------------------------
// Robot wyszukiwarki nie wykona JavaScriptu i tu nie dotrze, ale narzedzia do
// sprawdzania stron i przegladarki sterowane skryptem juz tak.
for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1)", "HeadlessChrome/120", "Lighthouse", "python-requests/2.31", "curl/8.4"]) {
  assert.equal(toRobot(ua), true, `${ua} to maszyna`);
}
assert.equal(toRobot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1"), false);
assert.equal(toRobot(""), false, "brak nagłowka nie jest dowodem na robota");

console.log("Zrodla ruchu: kanaly, jezyk i maszyny rozpoznawane zgodnie z opisem");
