// ============================================================
// PODGLAD MAILI DO KLIENTA, BEZ BAZY I BEZ WYSYLANIA
// ============================================================
// Maila widzi klient, a nie kompilator. Czytanie szablonu nie mowi, czy tekst
// sie klei, czy odnosnik nie wisi w prozni i czy warunkowa sekcja w ogole sie
// pokazala. Zeby to zobaczyc, trzeba maila ZLOZYC i na niego spojrzec.
//
// Ten skrypt sklada kazdy mail do klienta z prawdopodobnych danych i zapisuje
// go jako HTML plus zrzut ekranu. Nic nie wysyla i niczego nie zapisuje
// w bazie, wiec da sie go uruchomic w kazdej chwili.
//
//   npm run mail:podglad              wszystkie ekrany
//   npm run mail:podglad -- 01 05     tylko wybrane
//   npm run mail:podglad -- --lista   sam spis
//
// Zrzuty wymagaja przegladarki, wiec skrypt NIE stoi w `npm run build`.
// Bez playwrighta zapisuje sam HTML i mowi o tym wprost.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
// Adres API musi stac w srodowisku PRZED wczytaniem modulu maili, bo ten czyta
// go raz, przy starcie. Zwykly `import` wykonuje sie przed instrukcjami tego
// pliku, wiec przypisanie wyzej bylo za pozne i sekcja z plikami do pobrania
// nie rysowala sie w ogole. Stad wczytanie dynamiczne.
process.env.API_URL ||= "https://api.aejaca.com";
const { buildOrderMessages, buildTransferMessage, buildStatusUpdate, buildQuoteMessage } =
  await import("../chat-api/orderMail.js");

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const WYJSCIE = join(KORZEN, "podglad-maili");

/** Zamowienie w postaci, w jakiej wychodzi z bazy. Kolumna DATE wraca jako
 *  obiekt `Date`, i tak samo podajemy ja tutaj: podglad ma klamac jak najmniej. */
const ZAMOWIENIE = {
  id: 1,
  order_ref: "AE20260830-BEDBA9E9",
  customer_email: "anna.kowalska@example.com",
  customer_name: "Anna Kowalska",
  lang: "pl",
  status: "queued",
  payment_method: "autopay",
  delivery_method: "pickup",
  shipping_grosze: 0,
  items_total_grosze: 8000,
  total_grosze: 8000,
  paid_grosze: 8000,
  lead_days: 3,
  deadline_at: new Date(2026, 8, 2),
  requires_details: false,
  access_token: "9f2c7a1e4b8d",
  paid_at: "2026-08-30T10:00:00Z",
  queued_at: "2026-08-30T10:05:00Z",
};

const USLUGA = (title, grosze) => ({
  title, qty: 1, unit_grosze: grosze, line_grosze: grosze,
  item_type: "service", calculator: "laser_cut", params: {},
});

/** Produkt z polki: to on daje pouczenie o 14 dniach na odstapienie. */
const PRODUKT = (title, grosze) => ({
  title, qty: 1, unit_grosze: grosze, line_grosze: grosze,
  item_type: "product", product_kind: "physical", product_offer: "stock",
});

/** Pozycja z plikiem do pobrania: tresc cyfrowa, wlasne pouczenie. */
const PLIK = (title, grosze) => ({
  title, qty: 1, unit_grosze: grosze, line_grosze: grosze,
  item_type: "service", calculator: "jewelry_ring_config", params: { output: "mesh" },
  download_token: "d0wnl0adt0ken", download_max: 5,
});

const doKlienta = (zam, pozycje) =>
  buildOrderMessages(zam, pozycje, []).find((m) => m.to === zam.customer_email);

/** Zlecenie na danym etapie, do maila o zmianie etapu. */
const naEtapie = (status, dodatki = {}) =>
  buildStatusUpdate({ ...ZAMOWIENIE, status, delivery_method: "inpost_locker", ...dodatki });

const WYCENA = {
  quote_ref: "WY20260825-A1B2C3D4",
  customer_email: ZAMOWIENIE.customer_email,
  lang: "pl",
  total_grosze: 145000,
  valid_until: new Date(2026, 8, 1),
  access_token: "7b3e91c2",
};
const ADRES_WYCENY = "https://www.aejaca.com/oferta/?ref=WY20260825-A1B2C3D4&token=7b3e91c2";

const EKRANY = {
  "01": {
    nazwa: "Potwierdzenie: usluga na zamowienie, odbior osobisty",
    zbuduj: () => doKlienta(ZAMOWIENIE, [USLUGA("Klucz Modern, wyższa jakość", 4000), USLUGA("Klucz Antic, wyższa jakość", 4000)]),
  },
  "02": {
    nazwa: "Potwierdzenie: produkt z polki, paczkomat, 14 dni na odstapienie",
    zbuduj: () => doKlienta(
      { ...ZAMOWIENIE, delivery_method: "inpost_locker", shipping_grosze: 1649,
        items_total_grosze: 32000, total_grosze: 33649, paid_grosze: 33649, lead_days: 2,
        deadline_at: new Date(2026, 8, 1) },
      [PRODUKT("Pierścionek z granatem, złoto 585", 32000)]
    ),
  },
  "03": {
    nazwa: "Potwierdzenie: zlecenie czeka na ustalenia, zegar stoi",
    zbuduj: () => doKlienta(
      { ...ZAMOWIENIE, status: "details", requires_details: true, deadline_at: null,
        delivery_method: "courier", shipping_grosze: 1949,
        items_total_grosze: 89000, total_grosze: 90949, paid_grosze: 90949, lead_days: 14 },
      [{ title: "Sygnet z grawerem, srebro 925", qty: 1, unit_grosze: 89000, line_grosze: 89000,
         item_type: "service", calculator: "jewelry_plain", params: {} }]
    ),
  },
  "04": {
    nazwa: "Potwierdzenie: zamowienie cyfrowe, plik do pobrania",
    zbuduj: () => doKlienta(
      { ...ZAMOWIENIE, delivery_method: "digital", shipping_grosze: 0,
        items_total_grosze: 19000, total_grosze: 19000, paid_grosze: 19000,
        lead_days: null, deadline_at: null },
      [PLIK("Pierścionek z kreatora, plik STL", 19000)]
    ),
  },
  "05": {
    nazwa: "Dane do przelewu SEPA, zamowienie w euro",
    zbuduj: () => buildTransferMessage(
      { ...ZAMOWIENIE, status: "pending", payment_method: "bank_transfer" },
      { amountEur: "78.00", iban: process.env.TRANSFER_IBAN_EUR || "TRANSFER_IBAN_EUR (zmienna nieustawiona)",
        bic: process.env.TRANSFER_BIC || "TRANSFER_BIC",
        holder: process.env.TRANSFER_ACCOUNT_HOLDER || "TRANSFER_ACCOUNT_HOLDER",
        bank: process.env.TRANSFER_BANK_NAME || "TRANSFER_BANK_NAME",
        reference: "AE20260830-BEDBA9E9", dueAt: "2026-09-02T00:00:00Z" }
    ),
  },
  // Cofniecie do ustalen kasuje stemple etapow pozniejszych, wiec przyklad
  // tez musi je wyczyscic. Inaczej podglad pokazuje date przy przystanku,
  // ktorego zlecenie jeszcze nie przeszlo, i wyglada to na usterke kodu.
  "06": {
    nazwa: "Etap: wracamy do ustalania szczegolow",
    zbuduj: () => naEtapie("details", {
      requires_details: true, deadline_at: null, details_at: "2026-08-30T11:00:00Z",
      queued_at: null, production_started_at: null, ready_at: null, shipped_at: null,
    }),
  },
  // "Wszystkie ustalenia mamy komplet" ma sens tylko przy zleceniu, ktore
  // ustalen wymagalo. Tedy wchodzi mail po odhaczeniu ostatniej pozycji.
  "07": {
    nazwa: "Etap: ustalenia domkniete, zlecenie w kolejce",
    zbuduj: () => naEtapie("queued", { requires_details: true, details_at: "2026-08-30T11:00:00Z" }),
  },
  "08": { nazwa: "Etap: w realizacji", zbuduj: () => naEtapie("in_production", { production_started_at: "2026-08-31T08:00:00Z" }) },
  "09": { nazwa: "Etap: gotowe", zbuduj: () => naEtapie("ready", { production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z" }) },
  // Ta sama chwila, druga droga wydania. Zdanie o gotowosci bierze sie
  // z `delivery_method`, wiec oba ekrany musza stac obok siebie w podgladzie.
  "09b": {
    nazwa: "Etap: gotowe, odbior osobisty",
    zbuduj: () => naEtapie("ready", {
      delivery_method: "pickup",
      production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z",
    }),
  },
  "10": {
    nazwa: "Etap: wyslane, z numerem przesylki",
    zbuduj: () => naEtapie("shipped", {
      production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z",
      shipped_at: "2026-09-02T09:00:00Z", tracking_number: "620012345678901234567890",
    }),
  },
  // Przesylka zagraniczna: numer zostaje, odnosnika nie ma. Wozi DHL albo
  // DHL/FedEx, zaleznie od strefy, a na zamowieniu nie zapisujemy ktory.
  "10b": {
    nazwa: "Etap: wyslane za granice, numer bez odnosnika",
    zbuduj: () => naEtapie("shipped", {
      delivery_method: "courier", country: "DE",
      production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z",
      shipped_at: "2026-09-02T09:00:00Z", tracking_number: "JD014600009876543210",
    }),
  },
  "11": {
    nazwa: "Etap: doreczenie potwierdzone, zamowienie zamkniete",
    zbuduj: () => naEtapie("completed", {
      production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z",
      shipped_at: "2026-09-02T09:00:00Z", completed_at: "2026-09-04T10:00:00Z",
    }),
  },
  "12": {
    nazwa: "Wycena zapisana z kalkulatora",
    zbuduj: () => buildQuoteMessage(WYCENA,
      [{ title: "Pierścionek z granatem, złoto 585", qty: 1, unit_grosze: 145000, line_grosze: 145000, kind: "item", selected: true }],
      ADRES_WYCENY),
  },
  "13": {
    nazwa: "Oferta z wariantami do wyboru i dodatkiem",
    zbuduj: () => buildQuoteMessage({ ...WYCENA, total_grosze: 168000 }, [
      { title: "Pierścionek, złoto 585", qty: 1, unit_grosze: 145000, line_grosze: 145000, kind: "variant", selected: true },
      { title: "Pierścionek, złoto 750", qty: 1, unit_grosze: 198000, line_grosze: 198000, kind: "variant", selected: false },
      { title: "Grawer wewnątrz obrączki", qty: 1, unit_grosze: 23000, line_grosze: 23000, kind: "option", selected: true },
    ], ADRES_WYCENY),
  },
};

// ------------------------------------------------------------

const wybrane = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const klucze = wybrane.length ? wybrane : Object.keys(EKRANY).sort();

if (process.argv.includes("--lista")) {
  for (const k of Object.keys(EKRANY).sort()) console.log(`  ${k}  ${EKRANY[k].nazwa}`);
  process.exit(0);
}

mkdirSync(WYJSCIE, { recursive: true });

// Sieci w podgladzie nie ma, a znak firmowy wisi pod adresem serwisu. Zeby
// zrzut pokazywal to, co zobaczy klient, podstawiamy plik z dysku.
const ZNAK = `data:image/png;base64,${readFileSync(join(KORZEN, "public", "logo-mail.png")).toString("base64")}`;

const zrobione = [];
for (const k of klucze) {
  const ekran = EKRANY[k];
  if (!ekran) { console.error(`Nie ma ekranu ${k}. Spis: --lista`); process.exitCode = 1; continue; }
  const mail = ekran.zbuduj();
  if (!mail) { console.error(`Ekran ${k} nie zwrocil wiadomosci`); process.exitCode = 1; continue; }
  const html = mail.html.replaceAll("https://www.aejaca.com/logo-mail.png", ZNAK);
  writeFileSync(join(WYJSCIE, `${k}.html`), html);
  writeFileSync(join(WYJSCIE, `${k}.txt`), `TEMAT: ${mail.subject}\nDO: ${mail.to}\n\n${mail.text}\n`);
  zrobione.push({ k, nazwa: ekran.nazwa, html: join(WYJSCIE, `${k}.html`) });
  console.log(`  ${k}  ${ekran.nazwa}`);
  console.log(`      temat: ${mail.subject}`);
}

// Zrzut ekranu, jesli przegladarka jest pod reka. Brak playwrighta nie jest
// bledem: HTML i tekst i tak sa zapisane i da sie je otworzyc recznie.
try {
  const { chromium } = await import("playwright");
  const b = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH || undefined });
  for (const { k, html } of zrobione) {
    const karta = await b.newPage({ viewport: { width: 720, height: 1200 } });
    await karta.setContent(readFileSync(html, "utf8"), { waitUntil: "networkidle" });
    await karta.screenshot({ path: join(WYJSCIE, `${k}.png`), fullPage: true });
    await karta.close();
  }
  await b.close();
  console.log(`\nZrzuty w podglad-maili/`);
} catch (e) {
  console.log(`\nBez zrzutow (${e.message.split("\n")[0]}). HTML i tekst sa w podglad-maili/`);
}
