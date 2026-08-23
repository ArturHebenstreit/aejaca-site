// Mail po zakupie jest potwierdzeniem umowy na trwalym nosniku, wiec jego
// tresc liczy sie jako informacja udzielona konsumentowi. Sprawdzamy dokladnie
// to, co w nim stoi o prawie odstapienia.

import assert from "node:assert/strict";
import { buildOrderMessages, buildPaymentReviewMessage } from "./orderMail.js";

const order = {
  order_ref: "AE20260803-AABBCCDD",
  customer_email: "klient@example.com",
  lang: "pl",
  total_grosze: 129000,
  delivery_method: "inpost_locker",
  payment_method: "autopay",
};

const zPolki = { title: "Pierścionek z granatem", qty: 1, unit_grosze: 129000, line_grosze: 129000, item_type: "product", product_kind: "physical", product_offer: "ready" };
const naZamowienie = { title: "Grawer CO2", qty: 1, unit_grosze: 5000, line_grosze: 5000, item_type: "service", calculator: "laser_co2_engrave" };
const cyfrowy = { title: "Model do druku", qty: 1, unit_grosze: 2000, line_grosze: 2000, item_type: "product", product_kind: "digital", product_offer: "ready" };

const mailDo = (items, lang = "pl") => {
  const msgs = buildOrderMessages({ ...order, lang }, items);
  const klient = msgs.find((m) => m.to === order.customer_email);
  return `${klient.html}\n${klient.text}`;
};

// --- Rzecz z polki: prawo przysluguje i mail ma to powiedziec ---
const polka = mailDo([zPolki]);
assert.match(polka, /14 dni na odstąpienie/, "przy rzeczy z polki musi byc pouczenie o 14 dniach");
assert.match(polka, /najtańszej oferowanej dostawy/, "zwrot kosztu dostawy to pieniadze klienta");
assert.doesNotMatch(polka, /nie przysługuje/, "TO byl blad: prawo odbierane komus, kto je ma");
assert.match(polka, /Wzór formularza odstąpienia/, "wzor formularza dolaczamy, gdy prawo przysluguje");
assert.match(polka, /AE20260803-AABBCCDD/, "formularz niesie numer zamowienia");
assert.match(polka, /Artur Hebenstreit/, "adresat formularza to sprzedawca z imienia i nazwiska");
assert.match(polka, /Nowy Świat 33/, "razem z adresem do korespondencji");

// --- Rzecz wykonywana pod klienta: prawa nie ma i tak zostaje ---
const podKlienta = mailDo([naZamowienie]);
assert.match(podKlienta, /art\. 38 pkt 3/, "podajemy podstawe, a nie samo 'nie przysluguje'");
assert.match(podKlienta, /nie przysługuje/);
assert.doesNotMatch(podKlienta, /Wzór formularza/, "nie ma po co dawac formularza, gdy nie ma od czego odstapic");

// --- Tresc cyfrowa ---
const cyfrowa = mailDo([cyfrowy]);
assert.match(cyfrowa, /art\. 38 pkt 13/);
assert.match(cyfrowa, /pobierania/);

// --- Zamowienie mieszane: kazda pozycja opisana wlasciwie ---
const mieszane = mailDo([zPolki, naZamowienie]);
assert.match(mieszane, /obejmuje:[^<]*Pierścionek z granatem/, "pozycja objeta prawem wymieniona z nazwy");
assert.match(mieszane, /nie obejmuje[\s\S]*Grawer CO2/, "wylaczona rowniez z nazwy");
assert.match(mieszane, /14 dni na odstąpienie/);
assert.match(mieszane, /Wzór formularza odstąpienia/);

// --- Trzy jezyki ---
const en = mailDo([zPolki], "en");
assert.match(en, /14 days to withdraw/);
assert.match(en, /Model withdrawal form/);
const de = mailDo([zPolki], "de");
assert.match(de, /14 Tage Zeit/);
assert.match(de, /Muster-Widerrufsformular/);

// --- Zamowienie bez danych o rodzaju pozycji nie moze obiecac prawa na wyrost ---
const bezDanych = mailDo([{ title: "Coś", qty: 1, unit_grosze: 100, line_grosze: 100 }]);
assert.doesNotMatch(bezDanych, /14 dni na odstąpienie/);

// --- Wyjatek platnosci idzie tylko do wlasciciela, bez obietnicy realizacji ---
const review = buildPaymentReviewMessage({
  ...order,
  customer_name: "Jan Klient",
  payment_status: "SUCCESS",
  payment_status_details: "late_confirmation",
  payment_remote_id: "REMOTE-123",
  payment_review_previous_status: "cancelled",
  payment_review_reason: "unexpected_status:cancelled",
});
assert.match(review.subject, /PILNE PLATNOSC/);
assert.match(review.text, /Poprzedni stan: cancelled/);
assert.match(review.text, /realizacja NIE zostala uruchomiona/);
assert.match(review.text, /zwrot/);
assert.notEqual(review.to, order.customer_email, "alert nie moze udawac potwierdzenia dla klienta");

// --- Link do pliku ---
//
// Kupiony plik nie ma innej drogi do klienta niz ten mail, wiec sekcja
// z linkiem jest tu tak samo obowiazkowa jak pouczenie. Sprawdzamy oba
// warianty: link jest tam, gdzie plik zostal wydany, i NIE MA GO tam,
// gdzie nic do wydania nie bylo.
{
  process.env.API_URL = "https://api.example.com";
  const { buildOrderMessages: swiezy } = await import(`./orderMail.js?apiurl=${Date.now()}`);
  const zLinkiem = (items) => {
    const msgs = swiezy(order, items);
    const klient = msgs.find((m) => m.to === order.customer_email);
    return `${klient.html}\n${klient.text}`;
  };

  const plik = { title: "Plik STL i 3MF", qty: 1, unit_grosze: 8100, line_grosze: 8100,
    item_type: "service", calculator: "jewelry_ring_config", params: { output: "mesh" },
    download_token: "b".repeat(48), download_max: 5 };

  const zPlikiem = zLinkiem([plik]);
  assert.match(zPlikiem, /https:\/\/api\.example\.com\/api\/download\/b{48}/, "link musi byc w mailu");
  assert.match(zPlikiem, /Pliki do pobrania/);
  assert.match(zPlikiem, /Pobierz pliki/);
  // Wersja tekstowa jest tym, co zostaje przy wylaczonym HTML.
  const tylkoTekst = swiezy(order, [plik]).find((m) => m.to === order.customer_email).text;
  assert.match(tylkoTekst, /api\/download\/b{48}/, "link musi byc takze w wersji tekstowej");
  // Plik to tresc cyfrowa, wiec pouczenie idzie z art. 38 pkt 13, a nie pkt 3.
  assert.match(zPlikiem, /art\. 38 pkt 13/, "sprzedaz pliku to tresc cyfrowa");

  // Odlew nie jest plikiem: zaden link nie ma prawa sie tu pojawic.
  const odlew = { title: "Odlew bez kamieni", qty: 1, unit_grosze: 23000, line_grosze: 23000,
    item_type: "service", calculator: "jewelry_ring_config", params: { output: "cast" } };
  const bezPliku = zLinkiem([odlew]);
  assert.doesNotMatch(bezPliku, /api\/download\//, "przesylka nie dostaje linku do pobrania");
  assert.doesNotMatch(bezPliku, /Pliki do pobrania/);
  assert.match(bezPliku, /art\. 38 pkt 3/, "odlew powstaje wedlug specyfikacji klienta");
  delete process.env.API_URL;
}

console.log("Mail po zakupie: wszystkie sprawdzenia przeszly");
