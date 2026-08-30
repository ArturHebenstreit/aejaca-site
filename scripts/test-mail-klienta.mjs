// ============================================================
// MAILE DO KLIENTA: JEDNA SZATA, JEDEN PODPIS, WLASCIWE ODNOSNIKI
// ============================================================
// Maile wychodzily w trzech roznych wygladach i z trzema roznymi podpisami,
// a klient dostaje je jeden po drugim od tej samej firmy. Do tego data
// z kolumny DATE trafiala do polskiego maila jako "Mon Aug 31", bo sterownik
// bazy oddaje ja jako obiekt `Date`, a nie jako napis.
//
// Ten sprawdzian SKLADA prawdziwe wiadomosci i oglada wynik. Regula na kodzie
// przepuscilaby mail, ktory sie sklada, ale nic w nim nie ma.

import {
  buildOrderMessages,
  buildTransferMessage,
  buildStatusUpdate,
  buildQuoteMessage,
} from "../chat-api/orderMail.js";
import { SELLER } from "../chat-api/pricing/sellerInfo.js";

/** Adres serwisu. `sellerInfo` go nie niesie, a sklejanie z `SELLER.site`
 *  dawaloby ciche "undefined/order-process/" i sprawdzian zielony na nic. */
const STRONA = "https://www.aejaca.com";

let bledy = 0;
const ok = (warunek, opis) => {
  if (warunek) console.log(`  ✓ ${opis}`);
  else { console.log(`  ✗ ${opis}`); bledy++; }
};

const ZAMOWIENIE = {
  id: 1, order_ref: "AE20260830-BEDBA9E9", customer_email: "klient@example.com",
  status: "queued", payment_method: "autopay", delivery_method: "inpost_locker",
  shipping_grosze: 1649, items_total_grosze: 8000, total_grosze: 9649, paid_grosze: 9649,
  lead_days: 1, deadline_at: new Date(2026, 7, 31), requires_details: false,
  access_token: "zeton123", paid_at: "2026-08-30T10:00:00Z", queued_at: "2026-08-30T10:05:00Z",
};
const POZYCJE = [{ title: "Klucz Modern", qty: 1, unit_grosze: 8000, line_grosze: 8000, item_type: "service" }];
const PRZELEW = {
  amountEur: "120.00", iban: "PL61109010140000071219812874", bic: "WBKPPLPP",
  holder: "AEJaCA", bank: "Santander", reference: "AE20260830-BEDBA9E9", dueAt: "2026-09-02T00:00:00Z",
};
const WYCENA = {
  quote_ref: "WY20260825-A1B2C3D4", customer_email: "klient@example.com",
  total_grosze: 45000, valid_until: new Date(2026, 8, 1),
};
const POZYCJE_WYCENY = [{ title: "Pierścionek", qty: 1, unit_grosze: 45000, line_grosze: 45000, kind: "item", selected: true }];

/** Wszystkie wiadomosci do KLIENTA, w danym jezyku. Warsztatowe pomijamy. */
function doKlienta(lang) {
  const zam = { ...ZAMOWIENIE, lang };
  return [
    ["potwierdzenie", buildOrderMessages(zam, POZYCJE, []).find((m) => m.to === zam.customer_email)],
    ["przelew", buildTransferMessage({ ...zam, status: "pending" }, PRZELEW)],
    ["etap", buildStatusUpdate({ ...zam, status: "in_production" })],
    ["wycena", buildQuoteMessage({ ...WYCENA, lang }, POZYCJE_WYCENY, "https://www.aejaca.com/oferta/?ref=WY20260825-A1B2C3D4")],
  ];
}

console.log("\n1. Kazdy mail do klienta niesie ten sam podpis\n");

// Podpis jest obietnica wobec klienta, ze pisze do niego ta sama firma.
// Rozjazd miedzy mailami widzi on, nie my.
for (const lang of ["pl", "en", "de"]) {
  for (const [nazwa, mail] of doKlienta(lang)) {
    if (!mail) { ok(false, `${lang}/${nazwa}: wiadomosc w ogole nie powstala`); continue; }
    const komplet = [
      "AEJaCA - Artisan Elegance Jewelry and Crafted Art",
      SELLER.email,
      "www.AEJaCA.com",
      SELLER.phone,
    ];
    const wHtml = komplet.every((cz) => mail.html.includes(cz));
    const wText = komplet.every((cz) => mail.text.includes(cz));
    ok(wHtml && wText, `${lang}/${nazwa}: pelny podpis w HTML i w tekscie`);
    ok(mail.html.includes("/logo.png"), `${lang}/${nazwa}: znak firmowy w naglowku i w podpisie`);
  }
}

console.log("\n2. Powitanie w podpisie idzie w jezyku maila\n");

const POWITANIE = { pl: "Pozdrawiamy serdecznie,", en: "Kind regards,", de: "Mit freundlichen Grüßen," };
for (const lang of ["pl", "en", "de"]) {
  const [, mail] = doKlienta(lang)[0];
  ok(mail.text.includes(POWITANIE[lang]), `${lang}: "${POWITANIE[lang]}"`);
}

console.log("\n3. Potwierdzenie mowi, gdzie sprawdzic zlecenie, takze bez odnosnika\n");

for (const lang of ["pl", "en", "de"]) {
  const [, mail] = doKlienta(lang)[0];
  const prefiks = lang === "pl" ? "" : `/${lang}`;
  ok(mail.text.includes(`${STRONA}${prefiks}/order/status/?ref=AE20260830-BEDBA9E9&token=zeton123`),
     `${lang}: prywatny odnosnik do zlecenia`);
  ok(mail.text.includes(`${STRONA}${prefiks}/order-process/`), `${lang}: odnosnik do procesu realizacji`);
  ok(mail.text.includes(`${STRONA}${prefiks}/terms/`), `${lang}: odnosnik do regulaminu`);
  // Odnosnik z maila ginie razem z mailem. Numer w reku zostaje.
  ok(mail.text.includes("AE20260830-BEDBA9E9") && /order\/status\//.test(mail.text),
     `${lang}: opis, co otworzyc i co wpisac bez odnosnika`);
}

console.log("\n4. Mail o wycenie prowadzi do platnosci i do procesu\n");

for (const lang of ["pl", "en", "de"]) {
  const mail = doKlienta(lang).find(([n]) => n === "wycena")[1];
  const prefiks = lang === "pl" ? "" : `/${lang}`;
  ok(mail.text.includes(`${STRONA}${prefiks}/payments/`), `${lang}: odnosnik do procesu platnosci`);
  ok(mail.text.includes(`${STRONA}${prefiks}/order-process/`), `${lang}: odnosnik do procesu realizacji`);
  ok(mail.text.includes(`${STRONA}${prefiks}/terms/`), `${lang}: odnosnik do regulaminu`);
}

console.log("\n5. Data i liczba dni po ludzku\n");

// Sterownik bazy oddaje kolumne DATE jako obiekt Date. Samo `String(...)`
// dawalo "Mon Aug 31 2026", czyli angielska date w polskim mailu, i klientka
// dostala ja naprawde (zgloszenie 2026-08-30).
for (const lang of ["pl", "en", "de"]) {
  const [, mail] = doKlienta(lang)[0];
  ok(mail.text.includes("31.08.2026"), `${lang}: termin jako 31.08.2026`);
  ok(!/Mon |Tue |Wed |Thu |Fri |Sat |Sun /.test(mail.text), `${lang}: zadnej angielskiej nazwy dnia`);
}
const [, pl] = doKlienta("pl")[0];
ok(pl.text.includes("1 dzień") && !pl.text.includes("1 dni"), 'pl: "1 dzień", a nie "1 dni"');
const [, de] = doKlienta("de")[0];
ok(de.text.includes("1 Tag"), 'de: "1 Tag"');

console.log("\n6. Zaden mail do klienta nie sklada wlasnej koperty\n");

// Trzy wlasne szkielety HTML to trzy wyglady tej samej firmy. Wspolna koperta
// jest jedna i kazdy mail ma z niej korzystac.
for (const lang of ["pl"]) {
  for (const [nazwa, mail] of doKlienta(lang)) {
    const ileKopert = (mail.html.match(/<!doctype html>/gi) || []).length;
    ok(ileKopert === 1, `${nazwa}: dokladnie jedna koperta HTML`);
    ok(mail.html.includes("GDZIE POCZYTAĆ WIĘCEJ") || mail.html.includes("Gdzie poczytać więcej"),
       `${nazwa}: blok z odnosnikami`);
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nMaile do klienta: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
