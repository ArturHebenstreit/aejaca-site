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
  totalGrosze: null, priceNote: null, validUntil: null, sentAt: null, currency: "PLN",
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
    // Zamowienia powstale z tej oferty. Widok buduje z nich numer i link do
    // wklejenia klientowi, wiec puste tez musi sie renderowac: oferta jeszcze
    // nieoplacona nie ma zadnego.
    zamowienia: [
      { orderRef: "AE20260827-1F1AC35C", token: "zeton", status: "in_production", paid: true,
        url: "https://www.aejaca.com/order/status/?ref=AE20260827-1F1AC35C&token=zeton" },
    ],
    msg: null, err: null,
  },
  // Zamowienie z oferty, bez pliku i bez listu przewozowego: tak wyglada
  // pozycja, ktora najlatwiej wywala widok kolejki.
  queue: {
    user: uzytkownik,
    orders: [{
      orderRef: "ZAM-TEST", quoteRef: "WY20260825-A1B2C3D4", status: "queued", kind: "quoted", lang: "pl",
      name: "Test", email: "test@aejaca.com", phone: null, totalPLN: "500.00",
      paidAt: new Date("2026-08-20"), waitingDays: 5,
      leadDays: 14, deadlineAt: "2026-09-03", daysLeft: 5, requiresDetails: false,
      detailsAt: null, queuedAt: new Date("2026-08-20"), readyAt: null,
      productionStartedAt: null, shippedAt: null, trackingNumber: null, productionNote: null,
      delivery: { method: "inpost_locker", point: "WAW01A", addressLine1: null, addressLine2: null, postalCode: null, city: null, country: "PL" },
      statusUrl: "https://www.aejaca.com/order/status/?ref=ZAM-TEST&token=zeton",
      accessToken: "zeton", leadDaysAgreedAt: null,
      items: [
        { id: 1, title: "Odlew sygnetu", qty: 1, calculator: null, fileName: null, fileUrl: null, description: "srebro 925",
          requiresDetails: true, detailsSettledAt: null },
        { id: 2, title: "Polerowanie", qty: 1, calculator: null, fileName: null, fileUrl: null, description: null,
          requiresDetails: false, detailsSettledAt: null },
      ],
    }, {
      // Zamowienie czekajace na przelew stoi w TEJ SAMEJ tabeli, z pierwszym
      // krokiem, czyli potwierdzeniem wplaty. Bez niego w atrapie kontrola
      // renderowala wylacznie sciezke zlecenia juz oplaconego.
      orderRef: "ZAM-EUR", quoteRef: null, status: "awaiting_transfer", kind: "instant", lang: "de",
      name: "Muster", email: "kunde@example.com", phone: null, totalPLN: "1200.00",
      paidAt: null, waitingDays: 2,
      leadDays: null, deadlineAt: null, daysLeft: null, requiresDetails: false,
      detailsAt: null, queuedAt: null, readyAt: null,
      productionStartedAt: null, shippedAt: null, completedAt: null,
      trackingNumber: null, carrier: null, carrierHint: "DHL", productionNote: null,
      paymentMethod: "bank_transfer", paymentStatus: "PENDING", currency: "EUR",
      amountEurCents: 28000, paymentReviewReason: null, createdAt: new Date("2026-08-28"),
      delivery: { method: "courier", point: null, addressLine1: "Hauptstr. 1", addressLine2: null, postalCode: "10115", city: "Berlin", country: "DE" },
      statusUrl: null, accessToken: null, leadDaysAgreedAt: null,
      items: [{ id: 3, title: "Sygnet", qty: 1, calculator: null, fileName: null, fileUrl: null, description: null, requiresDetails: false, detailsSettledAt: null }],
    }],
    counts: { queued: 1, awaiting_transfer: 1 }, stan: "", sort: "newest", msg: null, err: null,
    przewoznicy: ["InPost", "DHL", "FedEx"],
  },
  "gemstone-prices": { user: uzytkownik, gems: [kamien], flash: null },
  "gemstone-prices-edit": { user: uzytkownik, gem: kamien },
  discounts: { user: uzytkownik, codes: [kod], created: [], msg: null, err: null },
  "discount-edit": { user: uzytkownik, kod, err: null },
  materials: { user: uzytkownik, materials: [], markup: 1.5, flash: null },

  // KOKPIT ANALITYCZNY. Atrapa niesie po jednym wierszu w kazdym zestawieniu,
  // bo pusty zestaw i tak przechodzi galezia "brak danych" i nie sprawdzilby
  // nic z tego, co naprawde rysuje wykresy i paski.
  analytics: {
    user: uzytkownik, days: 30,
    teraz: { wizyty: 120, zaangazowane: 64, odbicia: 40, odslony: 310, sredni_czas: 74, zapytania: 6, zamowienia: 2, przychod: 128000 },
    przedtem: { wizyty: 90, zaangazowane: 40, odbicia: 38, odslony: 240, sredni_czas: 61, zapytania: 3, zamowienia: 1, przychod: 64000 },
    dni: [
      { dzien: "2026-08-29", wizyty: 40, zapytania: 2, zamowienia: 1, przychod: 64000 },
      { dzien: "2026-08-30", wizyty: 45, zapytania: 3, zamowienia: 0, przychod: 0 },
      { dzien: "2026-08-31", wizyty: 35, zapytania: 1, zamowienia: 1, przychod: 64000 },
    ],
    kanaly: [{ wartosc: "wyszukiwarki", wizyty: 70, zaangazowane: 40, odbicia: 20, zapytania: 4, zamowienia: 1, przychod: 64000, sredni_czas: 80 }],
    zrodla: [{ wartosc: "google.com", wizyty: 70, zaangazowane: 40, odbicia: 20, zapytania: 4, zamowienia: 1, przychod: 64000, sredni_czas: 80 }],
    wejscia: [{ wartosc: "/toolstudio/laser-parameters/", wizyty: 30, zaangazowane: 10, odbicia: 22, zapytania: 0, zamowienia: 0, przychod: 0, sredni_czas: 45 }],
    tresci: [{ adres: "/shop/", odslony: 90, wizyty: 60, sredni_czas: 52, srednie_przewiniecie: 63 }],
    kraje: [{ wartosc: "PL", wizyty: 80, zaangazowane: 44, odbicia: 25, zapytania: 5, zamowienia: 2, przychod: 128000, sredni_czas: 77 }],
    urzadzenia: [{ wartosc: "mobile", wizyty: 70, zaangazowane: 30, odbicia: 30, zapytania: 2, zamowienia: 0, przychod: 0, sredni_czas: 41 }],
    jezyki: [{ wartosc: "pl", wizyty: 95, zaangazowane: 55, odbicia: 30, zapytania: 6, zamowienia: 2, przychod: 128000, sredni_czas: 80 }],
    lejekS: { wizyty: 120, sklep: 60, karta: 24, koszyk: 8, kasa: 5, zlozone: 3, oplacone: 2 },
    lejekW: { kalkulator: 30, formularz: 12, zapytanie: 6, wyceny: 4, oplacone: 1 },
    wybory: [{ kalkulator: "jewelry", pole: "metal", wybor: "silver_925", ile: 22, wizyty: 14 }],
    sygnaly: [
      { waga: "uwaga", tresc: "Strona wejscia bez ani jednego zapytania." },
      { waga: "spokoj", tresc: "Nic nie odstaje od poprzedniego okresu." },
    ],
  },
  "analytics-szczegoly": {
    user: uzytkownik, days: 30, wymiar: "kanal", wartosc: "wyszukiwarki",
    wiersze: [{
      session: "abc123xyz", start: new Date("2026-08-31T09:00:00Z"), koniec: new Date("2026-08-31T09:06:00Z"),
      odslony: 4, interakcje: 3, kanal: "wyszukiwarki", zrodlo: "google.com", kampania: null,
      kraj: "PL", urzadzenie: "mobile", jezyk: "pl", sekundy: 320, wejscie: "/shop/jewelry/",
      zapytania: 1, zamowienia: 1, oplacone: 1, przychod: 64000,
    }],
  },
  "analytics-sesja": {
    user: uzytkownik, session: "abc123xyz",
    kroki: [
      { ts: new Date("2026-08-31T09:00:00Z"), path: "/shop/jewelry/", category: "page", action: "view", label: "/shop/jewelry/", value: null, channel: "wyszukiwarki", source: "google.com", country: "PL", device: "mobile", lang: "pl" },
      { ts: new Date("2026-08-31T09:02:00Z"), path: "/shop/pierscionek/", category: "shop", action: "add_to_cart", label: "Pierscionek", value: 640, channel: "wyszukiwarki", source: "google.com", country: "PL", device: "mobile", lang: "pl" },
      { ts: new Date("2026-08-31T09:05:00Z"), path: "/checkout/", category: "page", action: "engaged", label: "/checkout/", value: 95, channel: "wyszukiwarki", source: "google.com", country: "PL", device: "mobile", lang: "pl" },
    ],
    skutki: {
      zapytania: [{ id: 7, created_at: new Date("2026-08-31"), email: "k@example.com", calculator: "jewelry", source: "quote", status: "new", quote_ref: "WY20260831-AAAA" }],
      zamowienia: [{ order_ref: "AE20260831-BBBB", created_at: new Date("2026-08-31"), status: "paid", total_grosze: 64000, paid_at: new Date("2026-08-31"), lang: "pl" }],
    },
  },
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

// --- 5. Ikony panelu: nazwa uzyta w widoku musi istniec w zestawie ------
// `IKONY` jest obiektem, wiec atrapa podstawiana wyzej oddaje `undefined`
// zamiast wywalic render. Literowka w nazwie znaku przechodzilaby przez
// kontrole i znikala z panelu po cichu: przycisk zostaje, tylko jest pusty.
const zestawIkon = new Set(
  [...(server.match(/app\.locals\.IKONY\s*=\s*\{([\s\S]*?)\n\};/) || ["", ""])[1]
    .matchAll(/^\s*(\w+):/gm)].map((m) => m[1])
);
if (!zestawIkon.size) zle("nie znalazlem w server.js zestawu app.locals.IKONY");
for (const f of pliki) {
  const tresc = readFileSync(join(VIEWS, f), "utf8");
  for (const uzycie of tresc.matchAll(/IKONY\.(\w+)/g)) {
    if (!zestawIkon.has(uzycie[1])) zle(`views/${f} uzywa IKONY.${uzycie[1]}, a takiej ikony nie ma`);
  }
}

// Kazda pozycja edytowalna musi miec droge powrotna: widok edycji bez trasy
// zapisu to formularz, ktory po kliknieciu "zapisz" daje 404.
for (const [widok, zapis] of [["quote-edit", "/quotes/:ref/item"], ["discount-edit", "/discounts/:code/update"], ["gemstone-prices-edit", "/gemstone-prices/:id/update"], ["material-edit", "/materials/:id/update"]]) {
  if (existsSync(join(VIEWS, `${widok}.ejs`)) && !server.includes(`"${zapis}"`)) {
    zle(`views/${widok}.ejs nie ma trasy zapisu ${zapis}`);
  }
}

// --- Adres powrotu po zapisie ---------------------------------------------
// Formularze kolejki niosa w adresie powrotu filtr i sortowanie, wiec `back`
// dostaje sciezke, ktora JUZ MA pytanie. Doklejenie drugiego znaku zapytania
// gubilo komunikat: `/queue?status=details?err=...` daje jeden parametr
// `status` i zadnego `err`, wiec odrzucony zapis wracal na strone bez slowa,
// z niezmieniona wartoscia w polu. Sprawdzamy sam skutek, a nie zapis kodu.
{
  const zrodlo = server.match(/const back = \(res, path, params = \{\}\) => \{[\s\S]*?\n\};/)?.[0];
  if (!zrodlo) {
    zle("server.js nie ma funkcji back, a to ona odsyla po zapisie");
  } else {
    const back = eval(`(${zrodlo.replace(/^const back = /, "").replace(/;$/, "")})`);
    const gdzie = (sciezka, params) => {
      let cel = null;
      back({ redirect: (u) => { cel = u; } }, sciezka, params);
      return cel;
    };
    const przypadki = [
      ["/queue", { err: "nie" }, "/queue?err=nie"],
      ["/queue?status=details", { err: "nie" }, "/queue?status=details&err=nie"],
      ["/queue?status=details&sort=deadline", { msg: "ok" }, "/queue?status=details&sort=deadline&msg=ok"],
      // Zielone "zapisano" z poprzedniego kroku nie ma przezyc nastepnego.
      ["/queue?msg=poprzednie", { err: "nie" }, "/queue?err=nie"],
      ["/queue?status=details", {}, "/queue?status=details"],
    ];
    for (const [sciezka, params, oczekiwane] of przypadki) {
      const wynik = gdzie(sciezka, params);
      if (wynik !== oczekiwane) zle(`back("${sciezka}", ${JSON.stringify(params)}) dalo ${wynik}, a mialo dac ${oczekiwane}`);
    }
  }
}

if (bledy) {
  console.error(`\nSzablony panelu: ${bledy} bledow.`);
  process.exit(1);
}
console.log(`Szablony panelu: ${pliki.length} widokow kompiluje sie, ${Object.keys(ZESTAWY).length} renderuje sie na danych`);
