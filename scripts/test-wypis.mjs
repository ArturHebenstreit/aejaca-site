#!/usr/bin/env node
// ============================================================
// WYPIS Z MAILI: OBIETNICA Z POKRYCIEM
// ============================================================
// Nasze maile obiecywaly w trzech jezykach "wypisujesz sie jednym klikniciem
// w kazdej wiadomosci", a mechanizmu nie bylo zadnego: ani naglowka
// `List-Unsubscribe`, ani odnosnika w tresci, ani niczego, co ustawialoby
// kolumne `subscribers.unsubscribed`, ktora czekala pusta od poczatku.
//
// Piec rzeczy, ktore ten sprawdzian trzyma na miejscu:
//
// 1. MARKETING NIESIE WYPIS, TRANSAKCJA NIE. Klient nie moze wypisac sie
//    z potwierdzenia wlasnego zamowienia: to wiadomosc nalezaca do umowy,
//    ktora sam zawarl. Przycisk sugerujacy inaczej konczylby sie tym, ze
//    przestajemy pisac o rzeczy, za ktora zaplacil.
//
// 2. PARA NAGLOWKOW, NIE JEDEN. Bez `List-Unsubscribe-Post` Gmail pokazuje
//    wypis, ale kaze przejsc przez przegladarke, czyli dokladnie to, czego
//    RFC 8058 mial uniknac.
//
// 3. ODNOSNIK JEST PODPISANY. Sam adres w URL-u znaczylby, ze kazdy moze
//    wypisac kazdego, znajac jego adres.
//
// 4. BEZ SEKRETU NIE MA ODNOSNIKA. Link, ktorego nie da sie zweryfikowac,
//    jest gorszy od jego braku.
//
// 5. WYPIS DZIALA W OBIE STRONY. Zapisany adres jest sprawdzany PRZED
//    wyslaniem, inaczej przycisk zapalalby lampke i nic wiecej.
//
// Uruchamiany w `npm run build`.

import { readFileSync } from "node:fs";

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};

const ODBIORCA = "klient@example.com";

console.log("1. Bez sekretu nie udajemy, ze wypis dziala");
{
  delete process.env.MAIL_UNSUBSCRIBE_SECRET;
  const bez = await import(`../chat-api/wypis.js?bez=${Date.now()}`);
  ok(bez.wypisDziala() === false, "modul mowi wprost, ze nie dziala");
  ok(bez.adresWypisu(ODBIORCA) === null, "nie wystawia adresu");
  ok(bez.naglowkiWypisu(ODBIORCA) === null, "nie wystawia naglowkow");
  ok(bez.podpisPasuje(ODBIORCA, "cokolwiek") === false, "i niczego nie wpuszcza");
}

process.env.MAIL_UNSUBSCRIBE_SECRET = "sekret-testowy-wystarczajaco-dlugi";
const wypis = await import(`../chat-api/wypis.js?z=${Date.now()}`);
const mail = await import(`../chat-api/leadMail.js?z=${Date.now()}`);
const { buildRaw } = await import(`../chat-api/orderMail.js?z=${Date.now()}`);

console.log("2. Podpis odroznia nasz odnosnik od podrobionego");
{
  const podpis = wypis.podpisWypisu(ODBIORCA);
  ok(typeof podpis === "string" && podpis.length === 32, "podpis ma 32 znaki, czyli 128 bitow", podpis?.length);
  ok(wypis.podpisPasuje(ODBIORCA, podpis), "wlasny podpis przechodzi");
  ok(!wypis.podpisPasuje("ktos.inny@example.com", podpis), "podpis nie dziala na cudzy adres");
  ok(!wypis.podpisPasuje(ODBIORCA, "0".repeat(32)), "zgadniety podpis odpada");
  ok(wypis.podpisWypisu("KLIENT@Example.COM") === podpis, "wielkosc liter adresu nie ma znaczenia");
}

console.log("3. Marketing niesie wypis, transakcja nie");
{
  const marketingowe = [
    ["newsletter", mail.buildNewsletterPowitanie({ lang: "pl", to: ODBIORCA, kod: "AEJ10-ABC", procent: "10%", waznyDo: "15.10.2026" })],
    ["rabat7", mail.buildRabat7({ lang: "pl", to: ODBIORCA, kod: "AEJ5-ABC", procent: "5%", waznyDo: "15.10.2026" })],
    ["followup48", mail.buildFollowUp48({ lang: "pl", to: ODBIORCA })],
    ["przypomnienieKodu", mail.buildPrzypomnienieKodu({ lang: "pl", to: ODBIORCA, kod: "AEJ10-ABC", procent: "10%", waznyDo: "15.10.2026", dni: "5 dni" })],
    ["prezent", mail.buildPrezent({ lang: "pl", to: ODBIORCA, kod: "AEJP-ABC", wartosc: "200.00 PLN", waznyOd: "01.09.2026", waznyDo: "30.11.2026" })],
  ];
  for (const [nazwa, m] of marketingowe) {
    ok(Boolean(m.naglowki?.["List-Unsubscribe"]), `${nazwa}: niesie naglowek wypisu`);
    ok(m.naglowki?.["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click",
      `${nazwa}: pozwala na jedno klikniecie, bez przegladarki`);
    ok(/unsubscribe/.test(m.html) && /unsubscribe/.test(m.text),
      `${nazwa}: odnosnik takze w tresci, w obu wersjach`);
  }

  const transakcyjne = [
    ["kalkulator", mail.buildKalkulatorEstimate({ lang: "pl", to: ODBIORCA, kalkulator: "Wydruk", parametry: "PETG", cenaPln: "180" })],
    ["kontakt", mail.buildKontaktPotwierdzenie({ lang: "pl", to: ODBIORCA, wiadomosc: "Dzień dobry" })],
    ["autoodpowiedz", mail.buildAutoOdpowiedz({ lang: "pl", to: ODBIORCA, temat: "Pytanie", inReplyTo: "<a@b>", threadId: "t1" })],
  ];
  for (const [nazwa, m] of transakcyjne) {
    ok(m.naglowki === undefined, `${nazwa}: BEZ naglowka wypisu, bo to nie marketing`, m.naglowki);
    ok(!/unsubscribe/.test(m.text), `${nazwa}: i bez odnosnika w tresci`);
  }
}

console.log("4. Naglowki naprawde wchodza do wiadomosci");
{
  const m = mail.buildNewsletterPowitanie({ lang: "pl", to: ODBIORCA, kod: "AEJ10-ABC", procent: "10%", waznyDo: "15.10.2026" });
  const surowa = Buffer.from(buildRaw(m), "base64url").toString("utf8");
  ok(/^List-Unsubscribe: </m.test(surowa), "naglowek stoi w zlozonej wiadomosci");
  ok(/^List-Unsubscribe-Post: List-Unsubscribe=One-Click$/m.test(surowa), "razem z para dla jednego klikniecia");
  ok(surowa.indexOf("List-Unsubscribe") < surowa.indexOf("MIME-Version"),
    "i to w naglowkach, a nie w tresci");
  // Mail transakcyjny skladany ta sama funkcja nie moze go dostac po drodze.
  const t = mail.buildKontaktPotwierdzenie({ lang: "pl", to: ODBIORCA, wiadomosc: "x" });
  ok(!/List-Unsubscribe/.test(Buffer.from(buildRaw(t), "base64url").toString("utf8")),
    "transakcyjny zostaje bez niego takze po zlozeniu");
}

console.log("5. Trzy jezyki, trzy zdania");
{
  for (const lang of ["pl", "en", "de"]) {
    const m = mail.buildNewsletterPowitanie({ lang, to: ODBIORCA, kod: "AEJ10-ABC", procent: "10%", waznyDo: "15.10.2026" });
    ok(m.text.includes(wypis.TEKST_WYPISU[lang]), `${lang}: zdanie o wypisie w jezyku wiadomosci`);
    ok(m.naglowki["List-Unsubscribe"].includes(`lang=${lang}`), `${lang}: strona wypisu odezwie sie w tym jezyku`);
  }
}

console.log("6. Zapis i sprawdzenie dzialaja na jednej liscie");
{
  // Atrapa bazy: interesuje nas, o co pytamy i co zapisujemy, a nie Postgres.
  const zapytania = [];
  const pool = {
    async query(sql, params) {
      zapytania.push({ sql, params });
      return { rows: /SELECT/.test(sql) ? [{ unsubscribed: true }] : [] };
    },
  };
  ok(await wypis.wypisany(pool, ODBIORCA) === true, "wypisany adres jest rozpoznany");
  ok(/lower\(email\)/.test(zapytania[0].sql), "pytamy bez wzgledu na wielkosc liter");

  zapytania.length = 0;
  await wypis.zapiszWypis(pool, "NOWY@Example.com", "de");
  const { sql, params } = zapytania[0];
  ok(/INSERT INTO subscribers/.test(sql), "adres nieznany dopisuje sie do listy");
  ok(/ON CONFLICT \(email\) DO UPDATE SET unsubscribed = TRUE/.test(sql), "znany tylko sie oznacza");
  ok(params[0] === "nowy@example.com", "adres zapisany malymi literami", params[0]);
  ok(sql.includes("'wypis'"), "zrodlo mowi wprost, ze to rezygnacja, a nie zapis");
}

console.log("7. Trasa i blokada wysylki stoja w serwerze");
{
  const server = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  ok(/app\.get\("\/api\/newsletter\/unsubscribe"/.test(server), "GET dla czlowieka z odnosnika");
  ok(/app\.post\("\/api\/newsletter\/unsubscribe"/.test(server), "POST dla jednego klikniecia z klienta pocztowego");
  // Bez tego sprawdzenia przycisk zapalalby lampke i nic wiecej.
  ok(/wiadomosc\.naglowki\?\.\["List-Unsubscribe"\][\s\S]{0,80}wypisany\(pool, to\)/.test(server),
    "przed wyslaniem marketingu pytamy, czy adres sie nie wypisal");
  ok(/if \(await wypisany\(pool, k\.issued_to\)\) continue;/.test(server),
    "przypomnienie o kodzie tez omija wypisanych");
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nWypis: obietnica ma pokrycie");
process.exit(bledy ? 1 : 0);
