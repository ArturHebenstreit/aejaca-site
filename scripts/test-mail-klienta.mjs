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

// Adres API musi stac w srodowisku PRZED wczytaniem modulu, bo ten czyta go raz
// przy starcie. Zwykly `import` wykonuje sie przed instrukcjami pliku, wiec
// przypisanie obok byloby za pozne i sprawdzian skladalby maile z ostrzezeniem
// o braku linku do plikow.
process.env.API_URL ||= "https://api.aejaca.com";
const { buildRaw, buildOrderMessages, buildTransferMessage, buildStatusUpdate, buildQuoteMessage,
        buildTopUpRequest, buildOrderExpired } =
  await import("../chat-api/orderMail.js");
import { readFileSync } from "node:fs";
import { SELLER } from "../chat-api/pricing/sellerInfo.js";
import {
  buildKalkulatorEstimate, buildFollowUp48, buildRabat7,
  buildKontaktPotwierdzenie, buildNewsletterPowitanie, buildAutoOdpowiedz,
  buildPrzypomnienieKodu,
} from "../chat-api/leadMail.js";

/** Adres w atrapach maili sprzed zamowienia. */
const ODBIORCA = "klient@example.com";

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
    // Szesc wiadomosci sprzed zamowienia. Od 2026-08-31 skladamy je my, a nie
    // n8n, wiec wchodza do tych samych sprawdzianow: podpis, koperta, odnosniki.
    ["kalkulator", buildKalkulatorEstimate({ lang, to: ODBIORCA, kalkulator: "Wydruk 3D", parametry: "PETG, dysza 0,4 mm", plik: "uchwyt.stl", cenaPln: "180 - 240", cenaEur: "42 - 56" })],
    ["followup48", buildFollowUp48({ lang, to: ODBIORCA })],
    ["rabat7", buildRabat7({ lang, to: ODBIORCA, kod: "AE-9K2T-XM", procent: "5%", waznyDo: "12.09.2026" })],
    ["kontakt", buildKontaktPotwierdzenie({ lang, to: ODBIORCA, wiadomosc: "Dzień dobry, czy zrobicie sygnet z herbem?" })],
    ["newsletter", buildNewsletterPowitanie({ lang, to: ODBIORCA, kod: "AEJ10-4H7PQW", procent: "10%", waznyDo: "15.10.2026" })],
    ["przypomnienieKodu", buildPrzypomnienieKodu({ lang, to: ODBIORCA, kod: "AEJ10-4H7PQW", procent: "10%", waznyDo: "15.10.2026", dni: "5 dni" })],
    ["autoodpowiedz", buildAutoOdpowiedz({ lang, to: ODBIORCA, temat: "Zapytanie o sygnet", inReplyTo: "<abc@mail.gmail.com>", threadId: "t1" })],
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
    // Wersja z wypelnieniem, nie kontur z serwisu: ten drugi w mailu znika.
    ok(mail.html.includes("/logo-mail.png"), `${lang}/${nazwa}: znak firmowy w naglowku i w podpisie`);
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

console.log("\n3b. Adres jest WIDOCZNY, a nie schowany pod slowem\n");

// Mail bywa drukowany, przeklejany i czytany bez HTML-a. Odnosnik ukryty pod
// slowem "tutaj" nie prowadzi wtedy nigdzie, a wersja tekstowa i tak niesie
// pelny adres, wiec sprawdzian na niej samej przepuscilby taka zmiane.
for (const lang of ["pl", "en", "de"]) {
  const [, mail] = doKlienta(lang)[0];
  const prefiks = lang === "pl" ? "" : `/${lang}`;
  for (const sciezka of ["/order-process/", "/terms/"]) {
    const widoczny = `>www.aejaca.com${prefiks}${sciezka}</a>`;
    ok(mail.html.includes(widoczny), `${lang}: adres ${prefiks}${sciezka} widac w tresci, nie tylko w href`);
  }
}

console.log("\n4. Mail o wycenie prowadzi do platnosci i do procesu\n");

for (const lang of ["pl", "en", "de"]) {
  const mail = doKlienta(lang).find(([n]) => n === "wycena")[1];
  const prefiks = lang === "pl" ? "" : `/${lang}`;
  ok(mail.text.includes(`${STRONA}${prefiks}/payments/`), `${lang}: odnosnik do procesu platnosci`);
  ok(mail.text.includes(`${STRONA}${prefiks}/order-process/`), `${lang}: odnosnik do procesu realizacji`);
  ok(mail.text.includes(`${STRONA}${prefiks}/terms/`), `${lang}: odnosnik do regulaminu`);
}

console.log("\n4b. Wzor odstapienia jedzie zalacznikiem, nie tresc maila\n");

// Wzor rozbijal mail na trzy czesci i spychal wszystko pozostale pod spod,
// wiec zszedl z tresci (decyzja wlasciciela). Ale mail jest potwierdzeniem
// umowy na trwalym nosniku, a odnosnik do strony trwalym nosnikiem nie jest,
// wiec wzor MUSI dotrzec razem z mailem.
{
  const zPolki = [{ title: "Pierścionek z granatem", qty: 1, unit_grosze: 32000, line_grosze: 32000,
    item_type: "product", product_kind: "physical", product_offer: "stock" }];
  const naZamowienie = [{ title: "Klucz Modern", qty: 1, unit_grosze: 4000, line_grosze: 4000,
    item_type: "service", calculator: "laser_cut", params: {} }];
  const mail = (poz, lang = "pl") =>
    buildOrderMessages({ ...ZAMOWIENIE, lang }, poz, []).find((m) => m.to === ZAMOWIENIE.customer_email);

  const zPolkiMail = mail(zPolki);
  ok(zPolkiMail.attachments?.length === 1, "produkt z polki: dokladnie jeden zalacznik");
  ok(zPolkiMail.attachments[0].filename.includes(ZAMOWIENIE.order_ref),
     "nazwa pliku niesie numer zamowienia, wiec nie zginie w pobranych");
  ok(zPolkiMail.attachments[0].content.includes("odstąpieniu od umowy sprzedaży"),
     "zalacznik ma polskie znaki, a nie kwadraciki po kroju bez ogonkow");
  ok(zPolkiMail.attachments[0].content.includes(ZAMOWIENIE.order_ref), "wzor ma juz wpisany numer zamowienia");

  // Rzecz robiona pod klienta nie podlega odstapieniu, wiec formularz przy niej
  // bylby obietnica prawa, ktorego nie ma.
  ok((mail(naZamowienie).attachments || []).length === 0,
     "usluga na zamowienie: zadnego formularza");

  // Tresc maila ma juz tylko ZDANIE o zalaczniku i adres strony.
  ok(!zPolkiMail.html.includes("Data odbioru:") && !zPolkiMail.text.includes("Data odbioru:"),
     "wzor zniknal z tresci maila");
  ok(zPolkiMail.text.includes("https://www.aejaca.com/returns/"), "tresc odsyla na strone zwrotow");

  // Koperta: `multipart/mixed` na wierzchu, w srodku para tekst i HTML.
  // Odwrotna kolejnosc pokazuje zalacznik zamiast tresci.
  const raw = Buffer.from(buildRaw(zPolkiMail).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  ok(/Content-Type: multipart\/mixed/.test(raw), "koperta jest multipart/mixed");
  ok(/Content-Type: multipart\/alternative/.test(raw), "w srodku siedzi para tekst i HTML");
  ok(/Content-Disposition: attachment; filename="odstapienie/.test(raw), "zalacznik ma naglowek zalacznika");
  const czesci = raw.split(/--mix_[a-z0-9]+/);
  const zakodowany = czesci.find((c) => c.includes("Content-Disposition: attachment"));
  const odkodowany = Buffer.from(zakodowany.split("\r\n\r\n").slice(1).join("").replace(/\r\n/g, ""), "base64").toString("utf8");
  ok(odkodowany.includes("Numer zamówienia: " + ZAMOWIENIE.order_ref),
     "zalacznik po odkodowaniu jest tym, co do niego wlozylismy");

  for (const lang of ["en", "de"]) {
    ok((mail(zPolki, lang).attachments || []).length === 1, `${lang}: zalacznik tez jest`);
  }
}

console.log("\n4c. Zdanie \"co dalej\" pasuje do tego, co klient kupil\n");

// "Odezwiemy sie, gdy zamowienie bedzie gotowe do wysylki" obiecywalo przesylke
// takze przy zamowieniu, ktore w calosci jest plikiem: klient mial go juz
// w tym samym mailu i czekal na cos, co nigdy nie mialo wyjsc.
{
  const plik = [{ title: "Pierścionek z kreatora, plik STL", qty: 1, unit_grosze: 19000, line_grosze: 19000,
    item_type: "service", calculator: "jewelry_ring_config", params: { output: "mesh" },
    download_token: "t0ken", download_max: 5 }];
  const rzecz = [{ title: "Pierścionek", qty: 1, unit_grosze: 32000, line_grosze: 32000,
    item_type: "product", product_kind: "physical", product_offer: "stock" }];
  const tresc = (poz) => {
    const m = buildOrderMessages(ZAMOWIENIE, poz, []).find((x) => x.to === ZAMOWIENIE.customer_email);
    return `${m.html}\n${m.text}`;
  };
  ok(!/spakowane i pojedzie do Ciebie/.test(tresc(plik)),
     "zamowienie cyfrowe nie obiecuje wysylki");
  ok(/Pliki masz powyżej/.test(tresc(plik)), "mowi zamiast tego, ze pliki juz sa");
  ok(/spakowane i pojedzie do Ciebie/.test(tresc(rzecz)),
     "przy rzeczy do wyslania mowimy o wysylce");
  // Zdanie bierze sie z `delivery_method`, a nie wylicza obu mozliwosci naraz:
  // klient odbierajacy osobiscie nie ma czekac na paczke.
  const trescOdbior = (poz) => {
    const m = buildOrderMessages({ ...ZAMOWIENIE, delivery_method: "pickup" }, poz, [])
      .find((x) => x.to === ZAMOWIENIE.customer_email);
    return `${m.html}\n${m.text}`;
  };
  ok(/gotowe do odbioru/.test(trescOdbior(rzecz)) && !/pojedzie do Ciebie/.test(trescOdbior(rzecz)),
     "przy odbiorze osobistym mail mowi o odbiorze, nie o wysylce");
}

console.log("\n4d. Ilosc tylko wtedy, gdy jest wieksza niz jedna\n");

{
  const jedna = [{ title: "Sygnet", qty: 1, unit_grosze: 32000, line_grosze: 32000,
    item_type: "product", product_kind: "physical", product_offer: "stock" }];
  const trzy = [{ ...jedna[0], qty: 3, line_grosze: 96000 }];
  const tresc = (poz) => {
    const m = buildOrderMessages(ZAMOWIENIE, poz, []).find((x) => x.to === ZAMOWIENIE.customer_email);
    return `${m.html}\n${m.text}`;
  };
  ok(!/Sygnet(&times;| x ) ?1\b/.test(tresc(jedna)) && !/Sygnet &times; 1/.test(tresc(jedna)),
     "przy jednej sztuce nie ma \"x 1\"");
  ok(/&times; 3/.test(tresc(trzy)) && /x 3/.test(tresc(trzy)), "przy trzech sztukach ilosc widac");
}

console.log("\n4e. Numer przesylki: odnosnik tylko tam, gdzie znamy przewoznika\n");

// Numer bez adresu, pod ktory da sie go wkleic, jest ciagiem 24 cyfr. Adresu
// nie zgadujemy: przy przesylce zagranicznej wozi DHL albo DHL/FedEx, a na
// zamowieniu nie zapisujemy ktory.
{
  const wyslane = (dod) => buildStatusUpdate({
    ...ZAMOWIENIE, status: "shipped", tracking_number: "620012345678901234567890",
    production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z",
    shipped_at: "2026-09-02T09:00:00Z", ...dod,
  });
  const caly = (m) => `${m.html}\n${m.text}`;
  const paczkomat = caly(wyslane({ delivery_method: "inpost_locker", country: "PL" }));
  ok(/inpost\.pl\/sledzenie-przesylek\?number=620012345678901234567890/.test(paczkomat),
     "paczkomat: odnosnik do sledzenia InPost");
  ok(/Przesyłkę wiezie InPost/.test(paczkomat), "mail nazywa przewoznika");
  const zagranica = caly(wyslane({ delivery_method: "courier", country: "DE" }));
  ok(!/inpost\.pl/.test(zagranica),
     "kurier zagraniczny: samego numeru nie podpinamy pod polskiego przewoznika");
  ok(/Przesyłkę wiezie DHL/.test(zagranica) && /dhl\.com/.test(zagranica),
     "strefa europejska: DHL z nazwy i z adresu");
  const swiat = caly(wyslane({ delivery_method: "courier", country: "AU" }));
  ok(/dhl\.com/.test(swiat) && /fedex\.com/.test(swiat),
     "strefa swiatowa nosi dwoch przewoznikow, wiec odsylamy do obu");
  ok(/inpost\.pl/.test(caly(wyslane({ delivery_method: "courier", country: "PL" }))),
     "kurier krajowy: to InPost, wiec odnosnik jest");
  ok(/fedex\.com/.test(caly(wyslane({ delivery_method: "courier", country: "AU", carrier: "FedEx" })))
     && !/dhl\.com/.test(caly(wyslane({ delivery_method: "courier", country: "AU", carrier: "FedEx" }))),
     "przewoznik wybrany przy nadaniu wygrywa z podpowiedzia ze strefy");
  const odbior = caly(wyslane({ delivery_method: "pickup", country: "PL" }));
  ok(!/620012345678901234567890/.test(odbior),
     "odbior osobisty: zaden list przewozowy, bo paczka nigdzie nie jechala");
}

console.log("\n4f. Ostatnia kropka zielenieje dopiero po potwierdzeniu doreczenia\n");

// Wyslane i zamkniete dzielily jeden przystanek, wiec paczka wlozona do
// paczkomatu wygladala tak samo jak paczka odebrana, a droga klienta nigdy nie
// konczyla sie na zielono.
{
  const etap = (status, dod) => buildStatusUpdate({
    ...ZAMOWIENIE, status, tracking_number: "620012345678901234567890",
    production_started_at: "2026-08-31T08:00:00Z", ready_at: "2026-09-01T14:00:00Z",
    shipped_at: "2026-09-02T09:00:00Z", ...dod,
  }).html;
  const zielona = /#3f9e6a/g;
  const bursztyn = /#b58a3c;margin:0 auto 8px/g;
  const wyslane = etap("shipped", {});
  const zamkniete = etap("completed", { completed_at: "2026-09-04T10:00:00Z" });
  ok(/Dostarczone/.test(wyslane), "przystanek doreczenia stoi na osi juz przy wysylce");
  ok((wyslane.match(bursztyn) || []).length === 1, "przy wysylce bursztynowa jest wysylka, a nie doreczenie");
  ok((zamkniete.match(bursztyn) || []).length === 0
     && (zamkniete.match(zielona) || []).length === 6,
     "po potwierdzeniu doreczenia wszystkie kropki sa zielone");
  ok(/04\.09\.2026/.test(zamkniete), "przystanek doreczenia niesie date potwierdzenia");
  ok(/Odebrane/.test(etap("completed", { delivery_method: "pickup", completed_at: "2026-09-04T10:00:00Z" })),
     "przy odbiorze osobistym ostatni przystanek nazywa sie odebrane");
}

console.log("\n4g. Termin w ofercie liczy sie z pozycji ZAZNACZONYCH\n");

// Kwota i termin musza mowic o tym samym ukladzie oferty. Termin liczony
// z wszystkich wariantow naraz obiecywalby klientowi date wariantu, ktorego
// nie wybral, i to zawsze tego najdluzszego.
{
  const WARIANTY = [
    { id: 1, group_key: "pierscionek", title: "Pierścionek, złoto 585", qty: 1, unit_grosze: 145000, line_grosze: 145000, kind: "variant", selected: true, lead_days: 14 },
    { id: 2, group_key: "pierscionek", title: "Pierścionek, złoto 750", qty: 1, unit_grosze: 198000, line_grosze: 198000, kind: "variant", selected: false, lead_days: 21 },
    { id: 3, title: "Grawer", qty: 1, unit_grosze: 23000, line_grosze: 23000, kind: "option", selected: true, lead_days: 3 },
  ];
  const mail = (poz) => {
    const m = buildQuoteMessage({ ...WYCENA, lang: "pl" }, poz, "https://www.aejaca.com/oferta/");
    return `${m.html}\n${m.text}`;
  };
  const zWariantami = mail(WARIANTY);
  ok(/Termin realizacji: 14 dni/.test(zWariantami), "termin bierze najdluzszy z ZAZNACZONYCH");
  ok(!/21 dni/.test(zWariantami), "odznaczony wariant nie narzuca swojego terminu");
  ok(!/Termin realizacji/.test(mail([{ id: 1, title: "Rzecz bez terminu", qty: 1, unit_grosze: 1000, line_grosze: 1000, kind: "item", selected: true }])),
     "bez terminu w pozycjach mail o nim milczy, zamiast obiecywac pustke");
  ok(/Liczymy go od domknięcia ustaleń/.test(mail([
       { id: 1, title: "Sygnet z grawerem", qty: 1, unit_grosze: 89000, line_grosze: 89000, kind: "item", selected: true, lead_days: 14, requires_details: true },
     ])), "przy pozycji z ustaleniami mail mowi, od czego liczy sie zegar");
}

console.log("\n4h. Zapisana wycena i oferta od nas to dwie rozne wiadomosci\n");

// Ta sama funkcja obsluguje obie chwile. "Wycena, ktora zapisales" bylo przy
// ofercie wystawionej przez nas nieprawda widoczna dla klienta: wariantow sam
// sobie nie ulozyl. Rozstrzyga `source`, ktory i tak lezy w bazie.
{
  const mail = (source) => {
    const m = buildQuoteMessage({ ...WYCENA, source, lang: "pl" }, POZYCJE_WYCENY, "https://www.aejaca.com/oferta/");
    return { caly: `${m.html}\n${m.text}`, temat: m.subject };
  };
  const zapisana = mail("saved");
  const oferta = mail("contact");
  ok(/wycena zapisana na aejaca.com/.test(zapisana.caly), "zapisana: mowi, ze klient ja zapisal");
  ok(/Twoja wycena/.test(zapisana.temat), "zapisana: temat mowi o wycenie");
  ok(/oferta przygotowana na podstawie Twojego zapytania/.test(oferta.caly),
     "oferta: mowi, ze przygotowalismy ja my");
  ok(!/wycena zapisana/.test(oferta.caly), "oferta: nie twierdzi, ze klient sam ja zapisal");
  ok(/^Oferta WY/.test(oferta.temat), "oferta: temat mowi o ofercie");
  ok(/Zamówienie powstaje dopiero wtedy, gdy opłacisz/.test(oferta.caly),
     "oferta: mowi, kiedy powstaje zamowienie");
}

console.log("\n4i. Trzy sytuacje po przelewie w euro\n");

// Zamowienie w euro zamykalo sie po cichu, a roznica miedzy wplata a kwota
// zamowienia nie mowila klientowi nic. To sa jego pieniadze.
{
  const PRZELEW = { iban: "PL00", bic: "BIC", holder: "AEJaCA", bank: "Bank", reference: "AE-TEST" };
  // Jezyk wprost: bez niego `buildTopUpRequest` slusznie wraca do angielskiego,
  // a sprawdzian szukalby polskich zdan w angielskim mailu.
  const bazowe = { ...ZAMOWIENIE, lang: "pl", payment_method: "bank_transfer", amount_eur_cents: 7800 };
  const caly = (m) => `${m.html}\n${m.text}`;

  const doplata = caly(buildTopUpRequest(
    { ...bazowe, transfer_received_cents: 7300, expires_at: "2026-09-02" }, PRZELEW, 500));
  ok(/73\.00 EUR/.test(doplata) && /78\.00 EUR/.test(doplata) && /5\.00 EUR/.test(doplata),
     "prosba o doplate podaje wplacone, nalezne i brakujace");
  ok(/02\.09\.2026/.test(doplata), "prosba o doplate niesie date, do ktorej czekamy");
  ok(/odsyłamy w całości na rachunek/.test(doplata),
     "prosba mowi, co sie stanie po terminie, a nie tylko straszy terminem");
  ok(/AE-TEST/.test(doplata), "doplata idzie z tym samym tytulem przelewu");

  const pusto = caly(buildOrderExpired({ ...bazowe, transfer_received_cents: null }));
  ok(/nie dotarła w terminie/.test(pusto), "wygasniecie bez wplaty mowi wprost, dlaczego");
  ok(/zwrócimy go na rachunek nadawcy/.test(pusto),
     "klient wie, ze przelew wyslany po terminie do niego wroci");

  const czesc = caly(buildOrderExpired({ ...bazowe, transfer_received_cents: 7300 }));
  ok(/Otrzymane 73\.00 EUR odsyłamy/.test(czesc), "przy czesciowej wplacie mowimy o zwrocie kwoty");
  ok(!/zwrócimy go na rachunek nadawcy/.test(czesc),
     "zdanie o przelewie po terminie nie ma sensu, gdy pieniadze juz sa i wracaja");

  const zNadplata = buildOrderMessages({ ...bazowe, transfer_received_cents: 8000 }, POZYCJE, [])
    .find((m) => m.to === ZAMOWIENIE.customer_email);
  ok(/2\.00 EUR więcej/.test(caly(zNadplata)) && /Nadwyżkę odsyłamy/.test(caly(zNadplata)),
     "potwierdzenie przy nadplacie mowi o zwrocie roznicy");
  const zDrobna = buildOrderMessages({ ...bazowe, transfer_received_cents: 7770 }, POZYCJE, [])
    .find((m) => m.to === ZAMOWIENIE.customer_email);
  ok(/0\.30 EUR mniej/.test(caly(zDrobna)) && /Różnicę bierzemy na siebie/.test(caly(zDrobna)),
     "przy drobnej niedoplacie mowimy, ze roznice pokrywamy my");
  const rowno = buildOrderMessages({ ...bazowe, transfer_received_cents: 7800 }, POZYCJE, [])
    .find((m) => m.to === ZAMOWIENIE.customer_email);
  ok(!/Nadwyżkę|bierzemy na siebie/.test(caly(rowno)),
     "przy kwocie zgodnej nie ma o czym pisac i nie piszemy");
}

console.log("\n4j. Adres nie skleja sie ze zdaniem, ktore go zapowiada\n");

// Zdanie z odnosnikiem konczy sie SPACJA, bo blok odnosnikow skleja kawalki bez
// separatora. Bez niej do klienta idzie "pod adresemhttps://www.aejaca.com/",
// i to zarowno w tekscie, jak i w HTML.
{
  const sklejka = /[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ,.:]https?:\/\//;
  const wszystkie = [];
  for (const lang of ["pl", "en", "de"]) {
    for (const [nazwa, mail] of doKlienta(lang)) {
      if (mail) wszystkie.push([`${lang}/${nazwa}`, mail]);
    }
  }
  for (const [nazwa, mail] of wszystkie) {
    ok(!sklejka.test(mail.text), `${nazwa}: adres oddzielony od zdania w wersji tekstowej`);
  }
}

console.log("\n4k. Kazdy mail z kodem podaje termin i zapowiada przypomnienie\n");

// Kod bez daty konca jest obietnica bez terminu, a przypomnienie, ktorego nikt
// nie zapowiedzial, wyglada jak nagabywanie (decyzja wlasciciela, 2026-08-31).
{
  const zKodem = [
    ["newsletter", buildNewsletterPowitanie({ lang: "pl", to: ODBIORCA, kod: "AEJ10-4H7PQW", procent: "10%", waznyDo: "15.10.2026" })],
    ["rabat7", buildRabat7({ lang: "pl", to: ODBIORCA, kod: "AEJ5-9K2TXM", procent: "5%", waznyDo: "14.09.2026" })],
  ];
  for (const [nazwa, m] of zKodem) {
    const caly = `${m.html}\n${m.text}`;
    ok(/Kod działa do \d\d\.\d\d\.\d{4}\./.test(caly), `${nazwa}: podaje date konca waznosci`);
    ok(/pięć dni przed końcem ważności przypomnimy/i.test(caly), `${nazwa}: zapowiada jedno przypomnienie`);
  }
  const przyp = buildPrzypomnienieKodu({ lang: "pl", to: ODBIORCA, kod: "AEJ10-4H7PQW", procent: "10%", waznyDo: "15.10.2026", dni: "5 dni" });
  ok(/jedyne przypomnienie/.test(przyp.text), "przypomnienie mowi, ze jest jedyne");
  ok(/AEJ10-4H7PQW/.test(przyp.subject), "temat niesie kod, wiec widac go w skrzynce bez otwierania");
}

console.log("\n4l. Autoodpowiedz idzie z chat-api, bez okrazenia przez n8n\n");

// To ten kod wykrywa maila od klienta i to on ma polaczenie z Gmailem, wiec
// droga chat-api -> n8n -> chat-api byla wylacznie droga. Sprawdzamy zrodlo,
// bo sciezki nie da sie wywolac bez skrzynki i bez bazy.
{
  const gmailJs = readFileSync(new URL("../chat-api/gmail.js", import.meta.url), "utf8");
  ok(/buildAutoOdpowiedz/.test(gmailJs), "autoodpowiedz sklada sie ta sama koperta co reszta");
  ok(/sendLeadMail/.test(gmailJs), "i idzie tym samym kanalem co reszta");
  ok(!/N8N_AUTOREPLY_WEBHOOK_URL/.test(gmailJs),
     "stara droga przez n8n zniknela, a nie zostala obok jako druga");
  ok(/gmailThreadId: threadId/.test(gmailJs),
     "odpowiedz wpina sie w istniejacy watek, a nie zaklada nowego");
  ok(/auto_replied_at IS NULL RETURNING id/.test(gmailJs),
     "zabezpieczenie przed dwoma odpowiedziami zostaje nietkniete");
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
