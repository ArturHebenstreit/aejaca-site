#!/usr/bin/env node
// ============================================================
// TERMIN WAZNOSCI WYSYLANY DO AUTOPAY
// ============================================================
// 7 wrzesnia 2026 klientka przeszla cala droge: mail z oferta, strona oferty,
// zamowienie, przycisk "Zaplac". Autopay powital ja zdaniem "The time to
// complete the payment has passed" przy transakcji zalozonej przed sekunda.
//
// Przyczyny byly dwie i obie polegaly na pomyleniu dwoch roznych rzeczy.
//
// PIERWSZA: `ValidityTime` idzie do operatora jako napis BEZ strefy, wiec
// operator czyta go jako czas polski, a my wysylalismy UTC. Kazdy termin lezal
// wiec dwie godziny wczesniej, niz mielismy na mysli. Przez rok nie robilo to
// roznicy, bo okno mialo siedem dni. Po skroceniu okna do kwadransa (ADR-0044)
// caly termin ladowal w przeszlosci.
//
// DRUGA: okno bramki bylo liczone z NASZEJ rezerwacji. To sa dwie rozne
// obietnice: rezerwacja mowi, jak dlugo trzymamy pozycje, a okno bramki, ile
// czasu ma czlowiek na kod BLIK i logowanie do banku.
//
// Ten sprawdzian pilnuje obu, bo zaden inny nie potrafi: format napisu widac
// tylko po stronie operatora, a operatora nie ma w zadnym tescie.

import { formatValidityTime } from "../chat-api/autopay.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };

console.log("\n1. Termin idzie w czasie polskim, nie w UTC\n");
{
  // Lato: Polska ma CEST, czyli UTC+2.
  const lato = formatValidityTime(new Date("2026-09-07T10:36:00Z"));
  if (lato === "2026-09-07 12:36:00") ok("czas letni: 10:36 UTC wychodzi jako 12:36");
  else zle(`czas letni wyszedl ${lato}, a mial byc 2026-09-07 12:36:00`);

  // Zima: CET, czyli UTC+1. Stale przesuniecie o dwie godziny byloby tu bledem,
  // dlatego liczymy przez nazwana strefe, a nie przez dodanie godzin.
  const zima = formatValidityTime(new Date("2026-01-15T10:36:00Z"));
  if (zima === "2026-01-15 11:36:00") ok("czas zimowy: 10:36 UTC wychodzi jako 11:36");
  else zle(`czas zimowy wyszedl ${zima}, a mial byc 2026-01-15 11:36:00`);

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(lato)) ok("format zgodny z dokumentacja operatora");
  else zle(`format napisu jest inny: ${lato}`);
}

console.log("\n2. Termin nigdy nie moze lezec w przeszlosci\n");
{
  // Tak wygladalby blad sprzed poprawki: kwadrans do przodu, ale zapisany w UTC.
  const kwadrans = new Date(Date.now() + 15 * 60_000);
  const poNaszemu = formatValidityTime(kwadrans);
  // Napis czytamy tak, jak czyta go operator: jako czas polski.
  const jakCzytaOperator = new Date(`${poNaszemu.replace(" ", "T")}${przesuniecieWarszawy(kwadrans)}`);
  const minutDoPrzodu = (jakCzytaOperator - Date.now()) / 60000;
  if (minutDoPrzodu > 10) ok(`operator odczyta termin ${minutDoPrzodu.toFixed(0)} minut w przyszlosci`);
  else zle(`operator odczyta termin ${minutDoPrzodu.toFixed(0)} minut od teraz, czyli za blisko albo w przeszlosci`);
}

/** Przesuniecie strefy warszawskiej dla danej chwili, w postaci +02:00. */
function przesuniecieWarszawy(kiedy) {
  const nazwa = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Warsaw", timeZoneName: "longOffset" })
    .formatToParts(kiedy).find((c) => c.type === "timeZoneName").value;
  return nazwa.replace("GMT", "") || "+00:00";
}

console.log("\n3. Okno bramki jest liczone osobno od naszej rezerwacji\n");
{
  const serwer = readFileSync(join(ROOT, "chat-api/server.js"), "utf8");
  const start = serwer.indexOf("const OKNO_BRAMKI_MINUT");
  if (start < 0) {
    zle("nie znalazlem okna bramki w server.js, sprawdzian nie ma czego pilnowac");
  } else {
    const blok = serwer.slice(start, start + 400);
    if (/const validity = new Date\(Date\.now\(\) \+ OKNO_BRAMKI_MINUT/.test(blok)) {
      ok("okno bramki liczy sie od teraz, wlasna stala");
    } else {
      zle("okno bramki nie liczy sie z wlasnej stalej");
    }
    if (/expires_at|instantHold|holdUntil/.test(blok)) {
      zle("okno bramki znowu patrzy na nasza rezerwacje: to sa dwie rozne obietnice");
    } else {
      ok("okno bramki nie zaglada do terminu rezerwacji");
    }
    const minut = Number((blok.match(/OKNO_BRAMKI_MINUT = (\d+)/) || [])[1]);
    if (minut >= 30) ok(`okno bramki to ${minut} minut, czyli starcza na kod BLIK i logowanie do banku`);
    else zle(`okno bramki to ${minut} minut, za malo dla czlowieka przy bramce`);
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nTermin waznosci dla Autopay: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
