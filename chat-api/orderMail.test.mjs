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

const doKlienta = (items, lang = "pl") =>
  buildOrderMessages({ ...order, lang }, items).find((m) => m.to === order.customer_email);

const mailDo = (items, lang = "pl") => {
  const klient = doKlienta(items, lang);
  return `${klient.html}\n${klient.text}`;
};

/** Tresc zalacznikow, sklejona. Od 2026-08-30 wzor oswiadczenia nie stoi
 *  w tresci maila, tylko jedzie zalacznikiem. */
const zalaczniki = (items, lang = "pl") =>
  (doKlienta(items, lang).attachments || []).map((z) => z.content).join("\n");

// --- Rzecz z polki: prawo przysluguje i mail ma to powiedziec ---
const polka = mailDo([zPolki]);
assert.match(polka, /14 dni na odstąpienie/, "przy rzeczy z polki musi byc pouczenie o 14 dniach");
assert.match(polka, /najtańszej oferowanej dostawy/, "zwrot kosztu dostawy to pieniadze klienta");
assert.doesNotMatch(polka, /nie przysługuje/, "TO byl blad: prawo odbierane komus, kto je ma");
assert.match(zalaczniki([zPolki]), /Wzór oświadczenia o odstąpieniu/, "wzor jedzie zalacznikiem, gdy prawo przysluguje");
assert.doesNotMatch(polka, /Data odbioru:/, "a w tresci maila juz go nie ma");
const wzorPolka = zalaczniki([zPolki]);
assert.match(wzorPolka, /AE20260803-AABBCCDD/, "wzor niesie numer zamowienia");
assert.match(wzorPolka, /Artur Hebenstreit/, "adresat wzoru to sprzedawca z imienia i nazwiska");
assert.match(wzorPolka, /Nowy Świat 33/, "razem z adresem do korespondencji");

// --- Rzecz wykonywana pod klienta: prawa nie ma i tak zostaje ---
const podKlienta = mailDo([naZamowienie]);
assert.match(podKlienta, /art\. 38 pkt 3/, "podajemy podstawe, a nie samo 'nie przysluguje'");
assert.match(podKlienta, /nie przysługuje/);
assert.equal(zalaczniki([naZamowienie]), "", "nie ma po co dawac wzoru, gdy nie ma od czego odstapic");

// --- Tresc cyfrowa ---
const cyfrowa = mailDo([cyfrowy]);
assert.match(cyfrowa, /art\. 38 pkt 13/);
assert.match(cyfrowa, /pobierania/);

// --- Zamowienie mieszane: kazda pozycja opisana wlasciwie ---
const mieszane = mailDo([zPolki, naZamowienie]);
assert.match(mieszane, /obejmuje:[^<]*Pierścionek z granatem/, "pozycja objeta prawem wymieniona z nazwy");
assert.match(mieszane, /nie obejmuje[\s\S]*Grawer CO2/, "wylaczona rowniez z nazwy");
assert.match(mieszane, /14 dni na odstąpienie/);
assert.match(zalaczniki([zPolki, naZamowienie]), /Wzór oświadczenia o odstąpieniu/);

// --- Trzy jezyki ---
const en = mailDo([zPolki], "en");
assert.match(en, /14 days to withdraw/);
assert.match(zalaczniki([zPolki], "en"), /Model withdrawal form/);
const de = mailDo([zPolki], "de");
assert.match(de, /14 Tage Zeit/);
assert.match(zalaczniki([zPolki], "de"), /Muster-Widerrufsformular/);

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

// ============================================================
// MAIL DO NAS NIE JEST ZRZUTEM BAZY, I TERMIN W NIM STOI
// ============================================================
// 2026-08-29 wlasciciel pokazal, co dostaje po zaplacie: przy kazdej pozycji
// "kalkulator: null" i surowy JSON, w ktorym jedynym niepustym polem byl numer
// oferty. Zamowienie z oferty nie ma kalkulatora i nie ma parametrow, wiec
// caly ten zrzut byl informacja o tym, ze pola istnieja, a nie o zamowieniu.
{
  const zOferty = [{
    title: "wydruk zywiczny - klucz 56 mm", qty: 1, unit_grosze: 2000, line_grosze: 2000,
    calculator: null, params: { fromQuote: "WY20260825-F84D7EEB", description: null },
  }];
  const doNas = (o = {}) => buildOrderMessages({ ...order, ...o }, zOferty)
    .find((m) => m.to !== order.customer_email).text;

  const goly = doNas();
  assert.doesNotMatch(goly, /kalkulator: null/, "pusty kalkulator nie ma o czym mowic");
  assert.doesNotMatch(goly, /parametry: \{"fromQuote"/, "numer oferty nie jest zrzutem JSON");
  assert.doesNotMatch(goly, /"description":null/, "pusty opis nie jest trescia");
  assert.match(goly, /z oferty: WY20260825-F84D7EEB/, "numer oferty ma wlasny wiersz");

  // Parametry, ktore naprawde cos znacza, zostaja: czyszczenie nie moze
  // zjadac tresci razem z pustymi polami.
  const zParametrami = buildOrderMessages(order, [{
    ...zOferty[0], calculator: "print_3d",
    params: { fromQuote: "WY1", description: "zielony", warstwa: "0.1 mm" },
  }]).find((m) => m.to !== order.customer_email).text;
  assert.match(zParametrami, /kalkulator: print_3d/);
  assert.match(zParametrami, /parametry: \{"warstwa":"0.1 mm"\}/, "parametr o tresci zostaje");
  assert.match(zParametrami, /OPIS OD KLIENTA: zielony/, "opis ma wlasny akapit, a nie JSON");

  // Termin: po zaplacie to jedyna rzecz, ktora naprawde zmienia prace pracowni.
  assert.match(doNas({ lead_days: 14, deadline_at: "2026-09-12" }),
    /TERMIN: 14 dni, planowana wysylka 2026-09-12/);
  assert.match(doNas({ lead_days: 14, requires_details: true }),
    /TERMIN: zegar STOI/, "zlecenie czekajace na ustalenia mowi to wprost");
  assert.match(goly, /TERMIN: nie ustalony/, "brak terminu tez jest informacja");

  // Klient dostaje to samo, ale zdaniem, i tylko wtedy, gdy jest co powiedziec.
  const doKlienta = (o = {}) => buildOrderMessages({ ...order, ...o }, zOferty)
    .find((m) => m.to === order.customer_email);
  // Data i odmiana ida do klienta po ludzku. Wersja z myslnikami i "1 dni"
  // dotarla do klientki (zgloszenie 2026-08-30), wiec obie sa tu na stale.
  assert.match(doKlienta({ lead_days: 14, deadline_at: "2026-09-12" }).text,
    /Termin realizacji: 14 dni\. Planowana finalizacja: 12\.09\.2026\./);
  assert.match(doKlienta({ lead_days: 1, deadline_at: new Date(2026, 8, 12) }).text,
    /Termin realizacji: 1 dzień\. Planowana finalizacja: 12\.09\.2026\./,
    "kolumna DATE przychodzi jako obiekt Date, a jeden dzien to nie sa dni");
  assert.match(doKlienta({ lead_days: 14, requires_details: true }).html,
    /liczymy dopiero od ustaleń/, "klient wie, ze zegar rusza po ustaleniach");
  assert.doesNotMatch(doKlienta().text, /Termin realizacji/,
    "puste zdanie o terminie jest gorsze niz jego brak");
}

console.log("Mail po zakupie: wszystkie sprawdzenia przeszly");
