// ============================================================
// WYPIS Z MAILI MARKETINGOWYCH
// ============================================================
// Nasze maile obiecywaly w trzech jezykach: "Wypisujesz sie jednym klikniciem
// w kazdej wiadomosci". Przeglad z 2026-09-03 pokazal, ze nie bylo ani
// naglowka `List-Unsubscribe`, ani odnosnika w tresci. Jedyne wystapienie tej
// nazwy w repozytorium to ODCZYT cudzych naglowkow w `gmail.js`. Kolumna
// `subscribers.unsubscribed` istniala od poczatku i nikt jej nigdy nie ustawial:
// zamiar bez mechanizmu.
//
// To sa trzy osobne problemy naraz. Obietnica zlozona klientowi i niedotrzymana.
// Wymog RODO: zgoda ma byc tak samo latwa do wycofania, jak byla do udzielenia.
// I dostarczalnosc: Gmail oraz Outlook od 2024 wymagaja jednoklikniciowego
// wypisu (RFC 8058) od nadawcow masowych, a jego brak zbija reputacje nadawcy,
// przez co do skrzynki nie dochodza takze maile transakcyjne.
//
// TRZY DECYZJE, KTORE TU ZAPADLY:
//
// 1. NAGLOWEK IDZIE TYLKO NA MAILE MARKETINGOWE. Potwierdzenie zamowienia,
//    prosba o doplate i wiadomosc o etapie sa transakcyjne: klient nie moze
//    "wypisac sie" z wlasnego zamowienia, a przycisk sugerujacy, ze moze,
//    doprowadzilby do sytuacji, w ktorej przestajemy pisac o rzeczy, za ktora
//    zaplacil.
//
// 2. WYPIS JEST JEDEN NA ADRES, a nie osobny na kazdy rodzaj wiadomosci.
//    Klikajac "wypisz mnie" czlowiek mowi "nie pisz do mnie w sprawach, o
//    ktore nie prosilem", a nie "wypisz mnie z newslettera, ale przypomnienia
//    o kodzie przysylaj dalej". Lista jest jedna: `subscribers`, kolumna
//    `unsubscribed`. Adres, ktorego na niej nie ma, dopisuje sie od razu jako
//    wypisany: rezygnacja ma dzialac takze dla kogos, kto nigdy sie nie zapisal,
//    a dostal od nas rabat do wyceny albo prezent.
//
// 3. ODNOSNIK JEST PODPISANY, a nie zgadywalny. Sam adres e-mail w adresie URL
//    znaczylby, ze kazdy moze wypisac kazdego, znajac jego adres. Podpisujemy
//    go HMAC-em na sekrecie serwera. Bez sekretu NIE WYSYLAMY naglowka ani
//    odnosnika: link, ktorego nie da sie zweryfikowac, jest gorszy od jego
//    braku, bo pozwalalby wypisywac cudze adresy.

import { createHmac, timingSafeEqual } from "node:crypto";

const SEKRET = process.env.MAIL_UNSUBSCRIBE_SECRET || "";
const SITE = process.env.SITE_URL || "https://www.aejaca.com";

/** Czy w ogole umiemy wystawic wypis. Bez sekretu nie udajemy, ze tak. */
export function wypisDziala() {
  return SEKRET.length >= 16;
}

/** Podpis adresu. Skracamy do 32 znakow: to nadal 128 bitow. */
export function podpisWypisu(email) {
  if (!wypisDziala()) return null;
  const adres = String(email || "").trim().toLowerCase();
  if (!adres) return null;
  return createHmac("sha256", SEKRET).update(`wypis:${adres}`).digest("hex").slice(0, 32);
}

/** Porownanie odporne na pomiar czasu. Rozna dlugosc i tak wyklucza zgodnosc. */
export function podpisPasuje(email, podpis) {
  const nasz = podpisWypisu(email);
  if (!nasz || typeof podpis !== "string" || podpis.length !== nasz.length) return false;
  return timingSafeEqual(Buffer.from(nasz, "utf8"), Buffer.from(podpis, "utf8"));
}

/**
 * Adres wypisu dla tego odbiorcy.
 *
 * Ten sam adres obsluguje POST (jedno klikniecie z klienta pocztowego, RFC 8058)
 * i GET (czlowiek klikajacy odnosnik w tresci). Jezyk jedzie w adresie, zeby
 * strona podziekowania odezwala sie w jezyku wiadomosci, a nie po polsku
 * do Niemca.
 */
export function adresWypisu(email, lang = "pl") {
  const podpis = podpisWypisu(email);
  if (!podpis) return null;
  const adres = String(email).trim().toLowerCase();
  return `${SITE.replace(/\/$/, "")}/api/newsletter/unsubscribe`
    + `?e=${encodeURIComponent(adres)}&s=${podpis}&lang=${encodeURIComponent(lang)}`;
}

/**
 * Para naglowkow dla wiadomosci marketingowej.
 *
 * `List-Unsubscribe-Post` mowi klientowi pocztowemu, ze wolno wypisac JEDNYM
 * zadaniem POST, bez otwierania strony i bez pytania o potwierdzenie. Bez tego
 * naglowka Gmail pokazuje wypis, ale kaze klientowi przejsc przez przegladarke,
 * czyli dokladnie to, czego RFC 8058 mial uniknac. Adres `mailto` zostaje jako
 * druga droga dla klientow pocztowych, ktore nie umieja pierwszej.
 */
export function naglowkiWypisu(email, lang = "pl") {
  const url = adresWypisu(email, lang);
  if (!url) return null;
  return {
    "List-Unsubscribe": `<${url}>, <mailto:contact@aejaca.com?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Czy pod ten adres wolno jeszcze wysylac marketing.
 *
 * Pytanie zadaje sie PRZED zlozeniem wiadomosci. Bez tego wypis bylby
 * przyciskiem, ktory zapala lampke i nic wiecej nie robi.
 */
export async function wypisany(pool, email) {
  const adres = String(email || "").trim().toLowerCase();
  if (!pool || !adres) return false;
  const { rows } = await pool.query(
    "SELECT unsubscribed FROM subscribers WHERE lower(email) = $1 LIMIT 1", [adres]
  );
  return rows[0]?.unsubscribed === true;
}

/**
 * Zapisanie rezygnacji. Powtorzone nic nie psuje.
 *
 * Adres nieznany dopisujemy jako od razu wypisany: rezygnacja ma dzialac takze
 * dla kogos, kto nigdy sie nie zapisal, a dostal od nas rabat do wyceny albo
 * prezent. `source` mowi wprost, skad ten wiersz sie wzial, zeby nikt nie
 * policzyl go kiedys jako zapisu do newslettera.
 */
export async function zapiszWypis(pool, email, lang = "pl") {
  const adres = String(email || "").trim().toLowerCase();
  if (!pool || !adres) return false;
  await pool.query(
    `INSERT INTO subscribers (email, lang, source, unsubscribed)
     VALUES ($1, $2, 'wypis', TRUE)
     ON CONFLICT (email) DO UPDATE SET unsubscribed = TRUE`,
    [adres, ["pl", "en", "de"].includes(lang) ? lang : "pl"]
  );
  return true;
}

/** Zdanie o wypisie, w stopce wiadomosci. */
export const TEKST_WYPISU = {
  pl: "Nie chcesz takich wiadomości? Wypisz się jednym kliknięciem",
  en: "Do not want messages like this? Unsubscribe with one click",
  de: "Solche Nachrichten unerwünscht? Mit einem Klick abmelden",
};

/** Strona, ktora widzi czlowiek po klinieciu w odnosnik. */
export const STRONA_WYPISU = {
  pl: { tytul: "Wypisano", tresc: "Nie będziemy już wysyłać wiadomości o kodach, rabatach ani wycenach na ten adres. Wiadomości dotyczące Twoich zamówień przychodzą dalej, bo są częścią umowy." },
  en: { tytul: "Unsubscribed", tresc: "We will not send messages about codes, discounts or estimates to this address any more. Messages about your own orders keep coming, because they are part of the agreement." },
  de: { tytul: "Abgemeldet", tresc: "Wir senden an diese Adresse keine Nachrichten mehr über Codes, Rabatte oder Kalkulationen. Nachrichten zu Ihren Bestellungen kommen weiterhin, denn sie gehören zum Vertrag." },
};
