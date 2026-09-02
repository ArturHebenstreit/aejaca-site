#!/usr/bin/env node
// ============================================================
// AUDYT SEO I AEO NA GOTOWYM SERWISIE
// ============================================================
// Build pilnuje dlugosci tytulow i opisow, pilnuje, zeby zaden odnosnik nie
// wyprowadzal z jezyka, i pilnuje, zeby mapa witryny nie rozjechala sie ze
// zrodlami. Nie pilnuje natomiast niczego, co wymaga POROWNANIA dwoch stron ze
// soba albo porownania strony z tym, co o niej mowimy gdzie indziej.
//
// A tam wlasnie mieszkaja usterki tej warstwy. Wszystkie sa ciche: strona
// wyglada dobrze, prerender ja wypisuje, przeglad stron ja oglada i nikt nie
// widzi, ze wersja niemiecka wskazuje na angielska, a angielska nie wskazuje
// z powrotem, albo ze `llms.txt` obiecuje model odpowiedzi adres, ktory
// przestal istniec przy zmianie nazwy trasy.
//
// Ten audyt czyta `dist/` PO buildzie i porownuje:
//   1. adres kanoniczny z adresem, pod ktorym strona naprawde lezy
//   2. odnosniki hreflang w obie strony, razem z x-default
//   3. jezyk dokumentu i og:locale z prefiksem adresu
//   4. og:url z adresem kanonicznym
//   5. mape witryny z tym, co jest w dist i co niesie noindex
//   6. dane strukturalne z tym, co naprawde stoi na stronie
//   7. adresy wymienione w llms.txt z tym, co istnieje
//
// Nie stoi w `npm run build` swiadomie. Build leci na Cloudflare Pages i juz
// dzis trwa dlugo, a ten audyt potrzebuje gotowego `dist/`, czyli mogl by sie
// odpalic dopiero po prerenderze. Kiedy ktorys z ponizszych bledow wroci po raz
// drugi, przenosimy TEN JEDEN sprawdzian do osobnej bramki w `scripts/`.
//
//   npm run build && npm run seo:audyt
//   node .claude/skills/aejaca-seo/audyt.mjs --dist=dist

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { JEZYKI, JEZYK_DOMYSLNY, sciezkaJezyka } from "../../../src/routes.js";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SITE = "https://www.aejaca.com";

const argDist = process.argv.find((a) => a.startsWith("--dist="));
const WSZYSTKO = process.argv.includes("--wszystko");
const DIST = join(KORZEN, argDist ? argDist.slice(7) : "dist");

if (!existsSync(DIST)) {
  console.error(`\nNie ma katalogu ${DIST}. Najpierw: npm run build\n`);
  process.exit(1);
}

const bledy = [];
const uwagi = [];
const blad = (co, gdzie) => bledy.push({ co, gdzie });
const uwaga = (co, gdzie) => uwagi.push({ co, gdzie });

// ------------------------------------------------------------
// Czytanie stron
// ------------------------------------------------------------
// react-helmet-async doklada do kazdego swojego znacznika `data-rh="true"`,
// wiec naiwne `<link rel="canonical"` nie trafia w nic. Atrybuty czytamy po
// nazwie, a nie po kolejnosci.

function atrybuty(znacznik) {
  const out = {};
  for (const m of znacznik.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

const ENCJE = { amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", apos: "'" };
function odkoduj(t) {
  return String(t)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (c, n) => ENCJE[n.toLowerCase()] ?? c);
}

/** Goly tekst strony, bez skryptow i stylow, malymi literami, jedna spacja. */
function tekstStrony(html) {
  return odkoduj(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** "dist/de/studio/index.html" -> "/de/studio/", "dist/index.html" -> "/". */
function adresPliku(plik) {
  const wzgledny = relative(DIST, plik).split(sep).join("/");
  const bez = wzgledny.replace(/index\.html$/, "");
  return "/" + bez;
}

/** Adres kanoniczny bez roznicy miedzy "https://host" a "https://host/". */
function rowneAdresy(a, b) {
  const n = (x) => String(x || "").replace(/\/+$/, "");
  return n(a) === n(b);
}

function jezykAdresu(sciezka) {
  const m = /^\/(en|de)\//.exec(sciezka);
  return m ? m[1] : JEZYK_DOMYSLNY;
}

const strony = new Map(); // adres -> dane

(function zbierz(katalog) {
  for (const wpis of readdirSync(katalog)) {
    const p = join(katalog, wpis);
    if (statSync(p).isDirectory()) {
      if (wpis !== "assets") zbierz(p);
    } else if (wpis === "index.html") {
      const html = readFileSync(p, "utf8");
      const linki = [...html.matchAll(/<link[^>]*>/g)].map((m) => atrybuty(m[0]));
      const mety = [...html.matchAll(/<meta[^>]*>/g)].map((m) => atrybuty(m[0]));
      const meta = (nazwa) => mety.find((x) => x.name === nazwa || x.property === nazwa)?.content;
      strony.set(adresPliku(p), {
        plik: relative(KORZEN, p),
        html,
        tekst: tekstStrony(html),
        lang: /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1] || "",
        tytul: odkoduj(/<title[^>]*>([\s\S]*?)<\/title>/.exec(html)?.[1] || ""),
        opis: odkoduj(meta("description") || ""),
        kanoniczny: linki.find((l) => l.rel === "canonical")?.href || "",
        alternatywy: linki.filter((l) => l.rel === "alternate" && l.hreflang),
        noindex: /noindex/.test(meta("robots") || ""),
        ogUrl: meta("og:url") || "",
        ogLocale: meta("og:locale") || "",
        dane: [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
      });
    }
  }
})(DIST);

console.log(`Audyt SEO: ${strony.size} stron w ${relative(KORZEN, DIST) || "dist"}\n`);

// ------------------------------------------------------------
// 1. Adres kanoniczny wskazuje na siebie
// ------------------------------------------------------------
// Kanoniczny wskazujacy gdzie indziej oddaje calą wartosc strony tamtej
// stronie. Przy trzech jezykach pod trzema adresami to jedna literowka od
// oddania niemieckiego ruchu wersji polskiej.
for (const [sciezka, s] of strony) {
  if (!s.kanoniczny) {
    blad("brak adresu kanonicznego", s.plik);
    continue;
  }
  if (!rowneAdresy(s.kanoniczny, SITE + sciezka)) {
    blad(`kanoniczny wskazuje ${s.kanoniczny}, a strona lezy pod ${SITE + sciezka}`, s.plik);
  }
  if (s.ogUrl && !rowneAdresy(s.ogUrl, s.kanoniczny)) {
    blad(`og:url (${s.ogUrl}) rozni sie od kanonicznego (${s.kanoniczny})`, s.plik);
  }
}

// ------------------------------------------------------------
// 2. Hreflang w obie strony
// ------------------------------------------------------------
// Wyszukiwarka bierze pod uwage wskazanie jezykowe tylko wtedy, gdy jest
// odwzajemnione. Wskazanie jednostronne nie jest bledem skladniowym i nie
// zglasza sie nigdzie poza Search Console, wiec potrafi stac miesiacami.
for (const [sciezka, s] of strony) {
  const mojJezyk = jezykAdresu(sciezka);
  const wskazane = new Map(s.alternatywy.map((a) => [a.hreflang, a.href]));

  for (const j of JEZYKI) {
    if (!wskazane.has(j)) {
      blad(`brak hreflang="${j}"`, s.plik);
      continue;
    }
    const cel = wskazane.get(j).replace(SITE, "") || "/";
    if (j === mojJezyk && !rowneAdresy(wskazane.get(j), SITE + sciezka)) {
      blad(`hreflang="${j}" nie wskazuje na siebie, tylko na ${wskazane.get(j)}`, s.plik);
    }
    const docelowa = strony.get(cel) || strony.get(cel.replace(/\/?$/, "/"));
    if (!docelowa) {
      blad(`hreflang="${j}" wskazuje na ${cel}, a takiej strony nie ma w dist`, s.plik);
      continue;
    }
    const powrot = docelowa.alternatywy.find((a) => a.hreflang === mojJezyk)?.href;
    if (!powrot || !rowneAdresy(powrot, SITE + sciezka)) {
      blad(`hreflang="${j}" wskazuje na ${cel}, a tamta strona nie wskazuje z powrotem`, s.plik);
    }
  }

  const domyslny = wskazane.get("x-default");
  if (!domyslny) blad("brak hreflang=\"x-default\"", s.plik);
  else if (!rowneAdresy(domyslny, SITE + sciezkaJezyka(sciezka.replace(/^\/(en|de)/, "") || "/", JEZYK_DOMYSLNY))) {
    blad(`x-default wskazuje ${domyslny}, a ma wskazywac wersje ${JEZYK_DOMYSLNY}`, s.plik);
  }
}

// ------------------------------------------------------------
// 3. Jezyk dokumentu zgadza sie z prefiksem adresu
// ------------------------------------------------------------
// Strona pod `/de/` deklarujaca `lang="pl"` trafia do wynikow polskich, a
// czytnik ekranu czyta niemiecki tekst polska wymowa.
const LOCALE = { pl: "pl_PL", en: "en_US", de: "de_DE" };
for (const [sciezka, s] of strony) {
  const oczekiwany = jezykAdresu(sciezka);
  if (s.lang !== oczekiwany) blad(`html lang="${s.lang}", a adres mowi "${oczekiwany}"`, s.plik);
  if (s.ogLocale && s.ogLocale !== LOCALE[oczekiwany]) {
    blad(`og:locale="${s.ogLocale}", a adres mowi "${LOCALE[oczekiwany]}"`, s.plik);
  }
}

// ------------------------------------------------------------
// 4. Mapa witryny kontra rzeczywistosc
// ------------------------------------------------------------
// `POZA_MAPA` w scripts/build-sitemap.mjs jest lista pisana reka. Strona
// dostajaca noindex bez dopisania jej do tej listy zostaje w mapie, czyli
// sami zapraszamy wyszukiwarke tam, gdzie mowimy jej nie wchodzic.
const mapa = readFileSync(join(KORZEN, "public", "sitemap.xml"), "utf8");
const wMapie = new Set([...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, "") || "/"));

for (const adres of wMapie) {
  if (!strony.has(adres)) blad(`mapa witryny wymienia ${adres}, a takiej strony nie ma w dist`, "public/sitemap.xml");
  else if (strony.get(adres).noindex) blad(`mapa witryny wymienia ${adres}, a ta strona niesie noindex`, "public/sitemap.xml");
}
for (const [adres, s] of strony) {
  if (!s.noindex && !wMapie.has(adres)) uwaga(`indeksowana, a nie ma jej w mapie witryny`, s.plik);
}

// ------------------------------------------------------------
// 5. Dane strukturalne kontra tresc strony
// ------------------------------------------------------------
// Dane strukturalne opisujace cos, czego na stronie nie ma, to w oczach Google
// spam, a nie blad techniczny, i kara idzie na cala domene. Najczestsza droga
// do tego stanu nie jest zla wola, tylko usuniecie sekcji ze strony bez
// usuniecia schematu, ktory ja opisywal.
for (const [sciezka, s] of strony) {
  for (const surowe of s.dane) {
    let obiekt;
    try {
      obiekt = JSON.parse(surowe);
    } catch (e) {
      blad(`dane strukturalne nie sa poprawnym JSON: ${e.message}`, s.plik);
      continue;
    }
    const lista = Array.isArray(obiekt) ? obiekt : [obiekt];
    for (const schemat of lista) {
      if (!schemat || typeof schemat !== "object") continue;
      if (!schemat["@context"]) blad(`schemat ${schemat["@type"] || "bez typu"} bez @context`, s.plik);
      if (!schemat["@type"]) blad("schemat bez @type", s.plik);

      // Adresy w schemacie musza zostac w jezyku strony. Wyjatkiem sa schematy
      // opisujace FIRME, a nie strone: `Organization` i `LocalBusiness` maja
      // jeden adres kanoniczny niezaleznie od jezyka, bo to jedna firma, a nie
      // trzy. Reszta opisuje TE strone i musi wskazywac na TEN adres.
      const OPISUJE_FIRME = ["Organization", "LocalBusiness", "JewelryStore", "WebSite"];
      for (const pole of OPISUJE_FIRME.includes(schemat["@type"]) ? [] : ["url", "@id", "mainEntityOfPage"]) {
        const w = typeof schemat[pole] === "string" ? schemat[pole] : schemat[pole]?.["@id"];
        if (typeof w !== "string" || !w.startsWith(SITE)) continue;
        if (jezykAdresu(w.replace(SITE, "") || "/") !== jezykAdresu(sciezka)) {
          blad(`${schemat["@type"]}.${pole} wskazuje na inny jezyk: ${w}`, s.plik);
        }
      }

      if (schemat["@type"] === "FAQPage") {
        for (const q of schemat.mainEntity || []) {
          const pytanie = odkoduj(q?.name || "").replace(/\s+/g, " ").trim().toLowerCase();
          if (!pytanie) {
            blad("FAQPage z pustym pytaniem", s.plik);
          } else if (!s.tekst.includes(pytanie)) {
            blad(`FAQPage obiecuje pytanie, ktorego na stronie nie ma: "${pytanie.slice(0, 60)}"`, s.plik);
          }
          const odpowiedz = odkoduj(q?.acceptedAnswer?.text || "").trim();
          if (!odpowiedz) blad(`FAQPage bez odpowiedzi na "${pytanie.slice(0, 40)}"`, s.plik);
        }
      }

      if (schemat["@type"] === "Product") {
        const oferta = schemat.offers;
        if (!oferta) blad("Product bez offers", s.plik);
        else {
          if (!oferta.priceCurrency) blad("Product.offers bez priceCurrency", s.plik);
          if (!(Number(oferta.price) > 0)) blad(`Product.offers.price = ${oferta.price}`, s.plik);
          if (!oferta.availability) blad("Product.offers bez availability", s.plik);
        }
      }

      if (schemat["@type"] === "BreadcrumbList") {
        const pozycje = schemat.itemListElement || [];
        pozycje.forEach((p, i) => {
          if (Number(p?.position) !== i + 1) blad(`BreadcrumbList: position ${p?.position} na miejscu ${i + 1}`, s.plik);
        });
      }
    }
  }
}

// ------------------------------------------------------------
// 6. Powtorzone tytuly i opisy w obrebie jednego jezyka
// ------------------------------------------------------------
// Dwie strony z tym samym tytulem konkuruja ze soba o to samo zapytanie i
// wyszukiwarka wybiera jedna z nich sama. To nie jest blad, wiec jest uwaga,
// ale kazde wystapienie warto obejrzec.
const wgTytulu = new Map();
for (const [sciezka, s] of strony) {
  if (s.noindex || !s.tytul) continue;
  const klucz = jezykAdresu(sciezka) + "|" + s.tytul;
  (wgTytulu.get(klucz) || wgTytulu.set(klucz, []).get(klucz)).push(sciezka);
}
for (const [klucz, gdzie] of wgTytulu) {
  if (gdzie.length > 1) uwaga(`ten sam tytul na ${gdzie.length} stronach: ${gdzie.slice(0, 4).join(", ")}`, klucz.split("|")[1].slice(0, 50));
}

// ------------------------------------------------------------
// 7. llms.txt kontra rzeczywistosc
// ------------------------------------------------------------
// `llms.txt` to jedyny dokument, ktory czytaja modele odpowiedzi zamiast
// przechodzic caly serwis. Martwy adres w nim nie psuje niczego na stronie i
// nie zglasza sie nigdzie, a model cytuje go dalej.
const llms = readFileSync(join(KORZEN, "public", "llms.txt"), "utf8");
// Adres w prozie konczy sie kropka zdania, a strona z zakladka niesie parametr
// (`/studio/?tab=co2_laser`). Jedno i drugie odcinamy, bo pytamy o STRONE.
const wLlms = new Set(
  [...llms.matchAll(/https:\/\/www\.aejaca\.com(\/[^\s)\]>,"']*)?/g)]
    .map((m) => (m[1] || "/").split("?")[0].split("#")[0].replace(/[.,;:]+$/, ""))
    .map((a) => a || "/")
);
for (const adres of wLlms) {
  if (/\.(xml|txt|jpg|png|webp|pdf|svg)$/.test(adres)) {
    if (!existsSync(join(DIST, adres.slice(1)))) blad(`llms.txt wymienia plik ${adres}, ktorego nie ma`, "public/llms.txt");
    continue;
  }
  const pelny = adres.endsWith("/") ? adres : adres + "/";
  if (!strony.has(pelny)) blad(`llms.txt wymienia ${adres}, a takiej strony nie ma`, "public/llms.txt");
}

// ------------------------------------------------------------
// Wynik
// ------------------------------------------------------------
if (uwagi.length) {
  console.log(`Uwagi (${uwagi.length}), do obejrzenia, nie do naprawy z automatu:`);
  for (const u of (WSZYSTKO ? uwagi : uwagi.slice(0, 15))) console.log(`  ${u.co}  [${u.gdzie}]`);
  if (!WSZYSTKO && uwagi.length > 15) console.log(`  ...i ${uwagi.length - 15} wiecej, pelna lista: --wszystko`);
  console.log("");
}

if (bledy.length) {
  console.error(`Bledy (${bledy.length}):`);
  for (const b of (WSZYSTKO ? bledy : bledy.slice(0, 40))) console.error(`  ${b.co}\n    ${b.gdzie}`);
  if (!WSZYSTKO && bledy.length > 40) console.error(`  ...i ${bledy.length - 40} wiecej, pelna lista: --wszystko`);
  console.error("");
  process.exit(1);
}

console.log("Bez bledow: kanoniczne, hreflang w obie strony, jezyk, mapa witryny,");
console.log("dane strukturalne i llms.txt zgadzaja sie z tym, co jest w dist.");
