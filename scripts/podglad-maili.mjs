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
import {
  buildOrderMessages, buildTransferMessage, buildStatusUpdate, buildQuoteMessage,
} from "../chat-api/orderMail.js";

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

const EKRANY = {
  "01": {
    nazwa: "Potwierdzenie zamowienia: usluga na zamowienie, odbior osobisty",
    zbuduj: () => buildOrderMessages(
      ZAMOWIENIE,
      [USLUGA("Klucz Modern, wyższa jakość", 4000), USLUGA("Klucz Antic, wyższa jakość", 4000)],
      []
    ).find((m) => m.to === ZAMOWIENIE.customer_email),
  },
};

// ------------------------------------------------------------

const wybrane = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const klucze = wybrane.length ? wybrane : Object.keys(EKRANY);

if (process.argv.includes("--lista")) {
  for (const [k, e] of Object.entries(EKRANY)) console.log(`  ${k}  ${e.nazwa}`);
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
