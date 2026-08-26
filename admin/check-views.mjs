// ============================================================
// KONTROLA SZABLONOW PANELU
// ============================================================
// Szablon panelu nie przechodzi przez zaden build: EJS kompiluje sie dopiero
// przy zadaniu. Literowka w `<% %>`, brakujaca zmienna albo `res.render` do
// nieistniejacego pliku to wiec BLAD 500 U WLASCICIELA, o ktorym dowiadujemy
// sie z jego zrzutu ekranu, a nie z buildu.
//
// Trzy rzeczy sprawdzane tutaj, w kolejnosci od najczestszej:
//
//   1. Kazdy `res.render("nazwa")` ma swoj plik. Literowka w nazwie trasy
//      wyglada w kodzie zupelnie normalnie.
//   2. Kazdy szablon sie kompiluje. Lapie niedomkniete `<% %>` i zly JavaScript
//      w srodku.
//   3. Szablony, dla ktorych mamy przykladowe dane, RENDERUJA sie do konca.
//      To jedyny sposob, zeby wylapac zmienna dopisana do widoku i zapomniana
//      w trasie: kompilacja tego nie widzi, bo brak zmiennej wychodzi dopiero
//      przy wykonaniu.
//
//   node admin/check-views.mjs

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = dirname(fileURLToPath(import.meta.url));
const VIEWS = join(ROOT, "views");
const wymagaj = createRequire(import.meta.url);

let ejs;
try {
  ejs = wymagaj("ejs");
} catch {
  // Panel wdraza sie z wlasnego katalogu i ma wlasne zaleznosci. Gdy nie sa
  // zainstalowane (czysty klon), nie udajemy, ze sprawdzilismy szablony.
  console.log("Szablony panelu: pominiete, brak admin/node_modules (npm install w admin/)");
  process.exit(0);
}

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };

const server = readFileSync(join(ROOT, "server.js"), "utf8");
const pliki = readdirSync(VIEWS).filter((f) => f.endsWith(".ejs"));

// --- 1. Kazda trasa renderuje istniejacy szablon ---------------------------
const renderowane = new Set([...server.matchAll(/res\.(?:status\(\d+\)\.)?render\(\s*["'`]([\w./-]+)["'`]/g)].map((m) => m[1]));
for (const nazwa of renderowane) {
  if (!existsSync(join(VIEWS, `${nazwa}.ejs`))) zle(`server.js renderuje "${nazwa}", a views/${nazwa}.ejs nie istnieje`);
}

// --- 2. Kazdy szablon sie kompiluje ----------------------------------------
for (const f of pliki) {
  try {
    ejs.compile(readFileSync(join(VIEWS, f), "utf8"), { filename: join(VIEWS, f) });
  } catch (e) {
    zle(`views/${f} nie kompiluje sie: ${e.message.split("\n")[0]}`);
  }
}

// --- 3. Renderowanie na przykladowych danych -------------------------------
// Zestawy sa CELOWO ubogie: maja odpowiadac temu, co trasa naprawde podaje.
// Dopisanie zmiennej do widoku bez dopisania jej tutaj i w trasie ma zapalic
// sie na czerwono, bo dokladnie tak wyglada blad, ktory chcemy lapac.
const uzytkownik = { email: "test@aejaca.com", displayName: "Test" };
const kamien = {
  id: 1, gem_id: "diamond", name_pl: "Diament", name_en: "Diamond", name_de: "Diamant",
  base_eur: "3000.00", precious: true, has_grades: true, lab: false, notes: null,
  updated_at: new Date("2026-08-01"), updated_by: "test@aejaca.com",
};
const kod = {
  code: "AEJ-TEST", kind: "percent", value: 10, applies_to: "all", min_order_grosze: 0,
  max_uses: null, max_uses_per_email: 1, used_count: 0, pending: 0, granted_grosze: 0,
  valid_from: null, valid_to: null, active: true, campaign: null, issued_to: null, note: null,
  created_at: new Date("2026-08-01"),
};

// Wycena bez kwot: taka wlasnie przychodzi z rozmowy telefonicznej i taka
// najlatwiej wywala widok, bo polowa pol jest pusta.
const wycena = {
  quoteRef: "WY20260825-A1B2C3D4", status: "new", lang: "pl", source: "phone",
  email: null, name: "Test", phone: "+48 600 000 000", message: "Zapytanie z rozmowy",
  totalGrosze: null, priceNote: null, validUntil: null, sentAt: null,
  createdAt: new Date("2026-08-25"), accessToken: "token-testowy", pickupCode: "ABCD1234",
  convertedOrderId: null,
};

const ZESTAWY = {
  quotes: {
    user: uzytkownik,
    quotes: [{
      id: 1, quote_ref: wycena.quoteRef, status: "new", lang: "pl", source: "phone",
      customer_email: null, customer_name: "Test", customer_phone: "+48 600 000 000",
      message: null, total_grosze: null, valid_until: null, sent_at: null,
      created_at: wycena.createdAt, converted_order_id: null, converted_order_ref: null, item_count: 1,
    }],
    counts: { new: 1 }, stan: "", msg: null, err: null,
  },
  "quote-edit": {
    user: uzytkownik, quote: wycena,
    // Trzy rodzaje pozycji naraz, bo widok rysuje kazdy inaczej: skladnik
    // rachunku, wariant z przelacznikiem i dodatek z polem zaznaczanym.
    items: [
      { id: 1, calculator: null, title: "Odlew sygnetu", qty: 1, unitGrosze: null, lineGrosze: null, description: null, fileName: null, params: null, kind: "fixed", groupKey: null, selected: true },
      { id: 2, calculator: null, title: "Wydruk klucz 56 mm", qty: 1, unitGrosze: 4000, lineGrosze: 4000, description: null, fileName: null, params: null, kind: "variant", groupKey: "klucz", selected: true },
      { id: 3, calculator: null, title: "Wydruk klucz 68 mm", qty: 2, unitGrosze: 4500, lineGrosze: 9000, description: "wzor", fileName: null, params: null, kind: "variant", groupKey: "klucz", selected: false },
      { id: 4, calculator: null, title: "Polerowanie", qty: 1, unitGrosze: 3000, lineGrosze: 3000, description: null, fileName: null, params: { szlif: "lustro" }, kind: "option", groupKey: "klucz", selected: true },
    ],
    offerUrl: "https://www.aejaca.com/oferta/?ref=WY20260825-A1B2C3D4&token=token-testowy",
    msg: null, err: null,
  },
  // Zamowienie z oferty, bez pliku i bez listu przewozowego: tak wyglada
  // pozycja, ktora najlatwiej wywala widok kolejki.
  queue: {
    user: uzytkownik,
    orders: [{
      orderRef: "ZAM-TEST", quoteRef: "WY20260825-A1B2C3D4", status: "paid", kind: "quoted", lang: "pl",
      name: "Test", email: "test@aejaca.com", phone: null, totalPLN: "500.00",
      paidAt: new Date("2026-08-20"), waitingDays: 5,
      productionStartedAt: null, shippedAt: null, trackingNumber: null, productionNote: null,
      delivery: { method: "inpost_locker", point: "WAW01A", addressLine1: null, addressLine2: null, postalCode: null, city: null, country: "PL" },
      items: [{ title: "Odlew sygnetu", qty: 1, calculator: null, fileName: null, fileUrl: null, description: "srebro 925" }],
    }],
    counts: { paid: 1 }, stan: "", msg: null, err: null,
  },
  "gemstone-prices": { user: uzytkownik, gems: [kamien], flash: null },
  "gemstone-prices-edit": { user: uzytkownik, gem: kamien },
  discounts: { user: uzytkownik, codes: [kod], created: [], msg: null, err: null },
  "discount-edit": { user: uzytkownik, kod, err: null },
  materials: { user: uzytkownik, materials: [], markup: 1.5, flash: null },
};

// Pomocniki wspolne dla wszystkich szablonow bierzemy Z SERWERA, a nie z listy
// pisanej tutaj z pamieci. Recznie wpisana lista raz juz sklamala: byl w niej
// `fmtDateShort`, ktorego serwer nigdy nie ustawial. Kontrola swiecila na
// zielono, a panel wywalal sie bledem 500 przy pierwszej wycenie z data.
//
// Podstawiamy atrapy, bo sprawdzamy DOSTEPNOSC nazwy, nie jej wynik. Nazwa
// uzyta w widoku i nieobecna w serwerze wywali render na `ReferenceError`,
// czyli dokladnie tak, jak wywali sie u wlasciciela.
const nazwyLokalnych = [...server.matchAll(/(?:res|app)\.locals\.(\w+)\s*=/g)].map((m) => m[1]);
if (!nazwyLokalnych.length) zle("nie znalazlem w server.js zadnego `res.locals.x =`, kontrola szablonow bylaby pozorna");
const globalne = Object.fromEntries(nazwyLokalnych.map((n) => [n, () => "-"]));

for (const [nazwa, dane] of Object.entries(ZESTAWY)) {
  const sciezka = join(VIEWS, `${nazwa}.ejs`);
  if (!existsSync(sciezka)) { zle(`brak views/${nazwa}.ejs, a jest dla niego zestaw danych`); continue; }
  try {
    ejs.render(readFileSync(sciezka, "utf8"), { ...globalne, ...dane }, { filename: sciezka });
  } catch (e) {
    // Pierwsza linia komunikatu EJS to sciezka i numer wiersza, a POWOD stoi
    // na koncu, za ramka z kodem. Bez niego zgloszenie mowi tylko "gdzies tam".
    const linie = String(e.message).split("\n").map((l) => l.trim()).filter(Boolean);
    zle(`views/${nazwa}.ejs nie renderuje sie: ${linie[0]} -> ${linie[linie.length - 1]}`);
  }
}

// --- 4. Kolumna akcji musi byc przypieta do prawej krawedzi -------------
// Tabele panelu maja po kilkanascie kolumn i siedza w `overflow-x-auto`, wiec
// ostatnia kolumna wypada poza widok. Akurat w niej stoja "Edytuj" i "Usun".
// Wlasciciel przez to uwazal, ze panel nie pozwala edytowac materialow, choc
// trasy dzialaly od poczatku: funkcja byla po prostu niewidzialna.
//
// Klase `tabela-akcje` definiuje `src/input.css`, a przypina ona OSTATNIA
// komorke wiersza, wiec sprawdzamy oba warunki: klase na tabeli i to, ze
// akcje faktycznie sa ostatnia komorka.
const arkusz = existsSync(join(ROOT, "public", "tailwind.css"))
  ? readFileSync(join(ROOT, "public", "tailwind.css"), "utf8") : "";
if (arkusz && !arkusz.includes(".tabela-akcje")) {
  zle("arkusz nie zna .tabela-akcje: kolumna z akcjami znowu wypadnie poza widok (npm run build:css)");
}

for (const f of pliki) {
  const tresc = readFileSync(join(VIEWS, f), "utf8");
  // Widok z akcjami to taki, ktory prowadzi do edycji albo usuwania wiersza.
  const maAkcje = /(?:href|action)="\/[\w-]+\/<%=[^>]*%>\/(?:edit|delete)"/.test(tresc);
  // Przypiecie dotyczy WYLACZNIE tabel. Strony edycji tez maja przycisk
  // usuwania, ale stoi on na karcie, nie w przewijanym wierszu.
  if (!maAkcje || !/<table/.test(tresc)) continue;
  if (!/<table[^>]*class="[^"]*tabela-akcje/.test(tresc)) {
    zle(`views/${f} ma akcje w wierszach, a tabela nie ma klasy tabela-akcje (kolumna wypadnie poza widok)`);
    continue;
  }
  // Przypiecie dziala na `td:last-child`, wiec akcje musza byc ostatnia
  // komorka. Dopisanie kolumny za nimi cofneloby cala poprawke po cichu.
  const ostatniaAkcja = tresc.lastIndexOf("/delete\"") >= 0 ? tresc.lastIndexOf("/delete\"") : tresc.lastIndexOf("/edit\"");
  const koniecWiersza = tresc.indexOf("</tr>", ostatniaAkcja);
  const ogon = koniecWiersza > 0 ? tresc.slice(ostatniaAkcja, koniecWiersza) : "";
  const komorekPo = (ogon.match(/<td/g) || []).length;
  if (komorekPo > 0) {
    zle(`views/${f}: za akcjami stoi jeszcze ${komorekPo} kolumn, wiec przypiecie zlapie nie te komorke`);
  }
}

// Kazda pozycja edytowalna musi miec droge powrotna: widok edycji bez trasy
// zapisu to formularz, ktory po kliknieciu "zapisz" daje 404.
for (const [widok, zapis] of [["quote-edit", "/quotes/:ref/edit"], ["discount-edit", "/discounts/:code/update"], ["gemstone-prices-edit", "/gemstone-prices/:id/update"], ["material-edit", "/materials/:id/update"]]) {
  if (existsSync(join(VIEWS, `${widok}.ejs`)) && !server.includes(`"${zapis}"`)) {
    zle(`views/${widok}.ejs nie ma trasy zapisu ${zapis}`);
  }
}

if (bledy) {
  console.error(`\nSzablony panelu: ${bledy} bledow.`);
  process.exit(1);
}
console.log(`Szablony panelu: ${pliki.length} widokow kompiluje sie, ${Object.keys(ZESTAWY).length} renderuje sie na danych`);
