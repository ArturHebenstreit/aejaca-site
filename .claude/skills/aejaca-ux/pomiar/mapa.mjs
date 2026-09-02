#!/usr/bin/env node
// ============================================================
// MAPA SERWISU W PRAWDZIWEJ PRZEGLADARCE
// ============================================================
// Zastepuje agenta site-mapper ze skilla site-audit, ktory w oryginale
// klikal po serwisie recznie przez Playwright MCP. Tutaj robi to
// deterministyczny skrypt na Chromium z node_modules/playwright: ten sam
// crawl daje ten sam wynik za kazdym razem, co agent MCP nie gwarantuje.
//
// Przechodzi serwis wszerz (BFS) od --start, trzyma sie jednego hosta i
// zapisuje kazda odwiedzona strone do sitemap.json w schemacie site-audit:
// naglowki, formularze, elementy interaktywne, odnosniki (z obszarem
// header/nav/footer/main), bledy konsoli, nieudane zadania i dwa zrzuty
// ekranu (telefon, monitor). Bez tego pliku kolejne skrypty z folderu
// pomiar/ (dostepnosc, bledy) nie maja czego czytac: potrzebuja selektorow,
// ktore pochodza z prawdziwej strony, a nie z domyslu.
//
// Trzy budzety chronia przed crawlem bez konca: liczba stron (--strony),
// glebokosc skokow od startu (--glebokosc) i czas (--czas). --wszystko
// zdejmuje pierwsze dwa i podnosi domyslny czas do 1800 sekund, bo caly
// serwis (dist/ ma dzis 318 stron) nie zmiesci sie w szesc minut.
//
// Uruchomienie (po npm run build i wystawieniu dist/ serwerem statycznym
// BEZ reguly lapiacej wszystko, patrz scripts/audit-pages.mjs linie 1-45):
//
//   node .claude/skills/aejaca-ux/pomiar/mapa.mjs --start=http://localhost:4181/
//
// Zastrzezenie zapisane tu celowo: "unreached" w sitemap.json to strony
// ZNALEZIONE w odnosnikach, ale nieodwiedzone z powodu budzetu. To NIE jest
// lista stron osieroconych (bez zadnego odnosnika przychodzacego znikad) -
// takiej strony crawler linkowy nigdy nie zobaczy, bo dowiaduje sie o
// istnieniu strony wylacznie z odnosnikow. Prawdziwe osierocenie wymaga
// porownania tej listy z pelnym spisem tras (src/routes.js), co jest robota
// dla skryptu, ktory czyta sitemap.json, a nie dla tego pliku.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  uruchomPrzegladarke,
  nowyKontekst,
  EKRANY,
  czyBezpiecznyKlik,
  parsujArgumenty,
  zapiszJson,
  normalizujAdres,
  tenSamHost,
  KOD_SELEKTORA,
  KOD_NAZWY,
  jezykAdresu,
} from "./wspolne.mjs";
import { JEZYKI, JEZYK_DOMYSLNY, sciezkaJezyka } from "../../../../src/routes.js";

// Slug z pathname, do nazw plikow zrzutow: "/de/studio/" -> "de-studio",
// "/" -> "start".
function slugZAdresu(adres) {
  const u = new URL(adres);
  const p = u.pathname.replace(/^\/+|\/+$/g, "");
  return p ? p.replace(/\//g, "-") : "start";
}

async function main() {
  const argumenty = parsujArgumenty();

  if (!argumenty.start) {
    console.error("Brak --start. Przyklad: --start=http://localhost:4181/");
    process.exit(1);
  }

  let seed;
  let host;
  try {
    seed = normalizujAdres(String(argumenty.start), String(argumenty.start));
    host = new URL(seed).host;
  } catch {
    console.error("Adres --start jest niepoprawny: " + argumenty.start);
    process.exit(1);
  }

  const wszystko = argumenty.wszystko === true;
  const budzetStron = wszystko ? Infinity : Number(argumenty.strony ?? 25);
  const budzetGlebokosc = wszystko ? Infinity : Number(argumenty.glebokosc ?? 3);
  const budzetCzasu = Number(argumenty.czas ?? (wszystko ? 1800 : 360));
  const katalogWyjscia = String(argumenty.wyjscie ?? "audyt-ux");
  const katalogZrzutow = join(katalogWyjscia, "zrzuty");
  mkdirSync(katalogZrzutow, { recursive: true });

  const przegladarka = await uruchomPrzegladarke();

  // Bledy konsoli i nieudane zadania zbieramy tylko z kontekstu monitorowego
  // (tak mowi zlecenie), a tablice zerujemy przed kazda kolejna nawigacja.
  // Domkniecie odwoluje sie do zmiennej z zewnetrznego zasiegu, wiec
  // przypisanie nowej tablicy jest widoczne dla listenera zarejestrowanego
  // raz, przy tworzeniu strony.
  let biezaceBledyKonsoli = [];
  let biezaceNieudane = [];

  // Jedna strona (karta) na pare ekran x jezyk, tworzona przy pierwszym
  // uzyciu. Jezyk przegladarki musi isc za jezykiem adresu, inaczej kazda
  // strona `/en/` i `/de/` dostaje polski pasek podpowiedzi (patrz LOCALE
  // w wspolne.mjs). Szesc kart zamiast dwoch, ale kazda otwierana raz.
  const karty = new Map();
  async function kartaDla(ekranNazwa, lang) {
    const klucz = `${ekranNazwa}/${lang}`;
    if (karty.has(klucz)) return karty.get(klucz);
    const ctx = await nowyKontekst(przegladarka, { host, ekran: EKRANY[ekranNazwa], lang });
    const strona = await ctx.newPage();
    if (ekranNazwa === "monitor") {
      // Kontekst odcina obce hosty celowo, a przegladarka zglasza kazde odciecie
      // jako "Failed to load resource: net::ERR_FAILED" z adresem obcego hosta
      // w polu location. To nie jest blad strony, wiec nie trafia do wyniku.
      strona.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const zrodlo = msg.location()?.url || "";
        if (zrodlo && !tenSamHost(zrodlo, host)) return;
        biezaceBledyKonsoli.push({ text: msg.text(), source: zrodlo });
      });
      strona.on("requestfailed", (req) => {
        const url = req.url();
        if (tenSamHost(url, host)) biezaceNieudane.push({ url, status: null });
      });
      strona.on("response", (res) => {
        const url = res.url();
        if (res.status() >= 400 && tenSamHost(url, host)) {
          biezaceNieudane.push({ url, status: res.status() });
        }
      });
    }
    karty.set(klucz, strona);
    return strona;
  }

  // Nawigacja z proba awaryjna: przy timeoucie networkidle probujemy jeszcze
  // "load", ale status i tak zapisujemy jako null, bo prawdziwy status
  // pierwszej proby jest niepewny.
  async function idzDo(strona, url) {
    try {
      const odp = await strona.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      return { status: odp ? odp.status() : null, ok: true };
    } catch {
      try {
        await strona.goto(url, { waitUntil: "load", timeout: 20000 });
      } catch {
        // druga proba tez padla, idziemy dalej z tym, co przegladarka ma
      }
      return { status: null, ok: false };
    }
  }

  // Trzy korzenie, nie jeden: przelacznik jezyka jest przyciskiem, a jego lista
  // pojawia sie dopiero po kliknieciu, wiec crawler po odnosnikach nigdy nie
  // trafilby na `/en/` ani `/de/`. Pierwszy przebieg (2026-09-02) zmapowal
  // 25 stron i wszystkie byly polskie. Kazdy jezyk startuje z glebokoscia 0,
  // a BFS przeplata je, wiec budzet 25 stron daje po kilka stron z kazdego.
  const korzenie = [seed];
  if (argumenty.jezyki !== false && argumenty["bez-jezykow"] !== true) {
    for (const j of JEZYKI) {
      if (j === JEZYK_DOMYSLNY) continue;
      const u = new URL(seed);
      if (u.pathname === "/") korzenie.push(normalizujAdres(sciezkaJezyka("/", j), seed));
    }
  }
  const odwiedzone = new Set();
  const znane = new Set(korzenie);
  const odkryte = new Set(korzenie);
  const kolejka = korzenie.map((url) => ({ url, depth: 0 }));
  const strony = [];
  const start = Date.now();
  let powod = "";

  while (true) {
    if (kolejka.length === 0) break;
    if ((Date.now() - start) / 1000 > budzetCzasu) { powod = "time"; break; }
    if (strony.length >= budzetStron) { powod = "pages"; break; }

    // Kolejka jest wspolna, ale wybor idzie po jezyku, ktorego odwiedzono
    // dotad najmniej. Zwykly BFS po trzech korzeniach dal 23 strony polskie
    // i po jednej z `/en/` i `/de/`, bo strona glowna wrzuca siedemdziesiat
    // polskich odnosnikow do kolejki, zanim `/en/` zdazy wrzucic swoje.
    const jezykStrony = jezykAdresu;
    const licznik = {};
    for (const s of strony) licznik[jezykStrony(s.url)] = (licznik[jezykStrony(s.url)] || 0) + 1;
    let indeks = 0;
    for (let i = 1; i < kolejka.length; i++) {
      if ((licznik[jezykStrony(kolejka[i].url)] || 0) < (licznik[jezykStrony(kolejka[indeks].url)] || 0)) indeks = i;
    }
    const { url, depth } = kolejka.splice(indeks, 1)[0];
    if (odwiedzone.has(url)) continue;
    odwiedzone.add(url);

    biezaceBledyKonsoli = [];
    biezaceNieudane = [];

    const stronaMonitor = await kartaDla("monitor", jezykAdresu(url));
    const stronaTelefon = await kartaDla("telefon", jezykAdresu(url));
    const { status, ok } = await idzDo(stronaMonitor, url);

    if (!ok && strony.length === 0) {
      console.error("Nie udalo sie polaczyc ze startem: " + url);
      await przegladarka.close();
      process.exit(1);
    }

    let dane = { title: "", lang: "", words: 0, headings: [], forms: [], interactive: [], links: [] };
    try {
      dane = await stronaMonitor.evaluate(
        ({ kodSelektora, kodNazwa }) => {
          const selektorOd = eval("(" + kodSelektora + ")");
          const nazwaOd = eval("(" + kodNazwa + ")");

          let obszarTekstu = document.querySelector("main");
          if (!obszarTekstu) {
            obszarTekstu = document.body.cloneNode(true);
            obszarTekstu.querySelectorAll("header, footer, nav").forEach((e) => e.remove());
          }
          const tekst = (obszarTekstu.innerText || "").trim();
          const words = tekst ? tekst.split(/\s+/).length : 0;

          const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => ({
            level: Number(h.tagName[1]),
            text: (h.textContent || "").replace(/\s+/g, " ").trim(),
          }));

          const forms = Array.from(document.querySelectorAll("form")).map((f) => {
            const pola = Array.from(f.querySelectorAll("input, select, textarea"))
              .filter((p) => !["submit", "button", "image", "reset"].includes((p.getAttribute("type") || "").toLowerCase()))
              .map((p) => {
                let etykieta = "";
                if (p.id) {
                  const lab = document.querySelector('label[for="' + CSS.escape(p.id) + '"]');
                  if (lab) etykieta = (lab.textContent || "").trim();
                }
                if (!etykieta) etykieta = p.getAttribute("aria-label") || "";
                return {
                  selector: selektorOd(p),
                  name: p.getAttribute("name") || "",
                  type: p.getAttribute("type") || p.tagName.toLowerCase(),
                  required: p.hasAttribute("required") || p.getAttribute("aria-required") === "true",
                  label: etykieta,
                };
              });
            const guzik = f.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
            return {
              selector: selektorOd(f),
              action: f.action || "",
              method: (f.getAttribute("method") || "get").toLowerCase(),
              fields: pola,
              submit_selector: guzik ? selektorOd(guzik) : null,
            };
          });

          const interactive = Array.from(
            document.querySelectorAll('button, [role="button"], [role="tab"], summary, [aria-expanded]')
          ).map((el) => ({
            selector: selektorOd(el),
            role: el.getAttribute("role") || (el.tagName.toLowerCase() === "button" ? "button" : el.tagName.toLowerCase()),
            text: nazwaOd(el),
          }));

          const ZLE_KONCOWKI = /\.(zip|exe|dmg|pdf)$/i;
          const links = Array.from(document.querySelectorAll("a[href]"))
            .filter((a) => !a.hasAttribute("download"))
            .filter((a) => !/^(mailto:|tel:|javascript:)/i.test((a.getAttribute("href") || "").trim()))
            .map((a) => {
              let obszar = "main";
              const przodek = a.closest("header, nav, footer");
              if (przodek) obszar = przodek.tagName.toLowerCase();
              return { selector: selektorOd(a), href: a.href, text: nazwaOd(a), area: obszar };
            })
            .filter((l) => {
              try { return !ZLE_KONCOWKI.test(new URL(l.href).pathname); } catch { return false; }
            });

          return {
            title: document.title || "",
            lang: document.documentElement.lang || "",
            words,
            headings,
            forms,
            interactive,
            links,
          };
        },
        { kodSelektora: KOD_SELEKTORA, kodNazwa: KOD_NAZWY }
      );
    } catch {
      // strona nie dala sie odczytac (np. bialy ekran po bledzie), zostaje
      // wpis z pustymi polami, ale status i bledy konsoli sa prawdziwe
    }

    const linksPrzefiltrowane = [];
    for (const l of dane.links || []) {
      const norm = normalizujAdres(l.href, url);
      if (!norm || !tenSamHost(norm, host)) continue;
      linksPrzefiltrowane.push({ selector: l.selector, href: norm, text: l.text, area: l.area });
      odkryte.add(norm);
      if (!znane.has(norm)) {
        znane.add(norm);
        if (depth + 1 <= budzetGlebokosc) kolejka.push({ url: norm, depth: depth + 1 });
      }
    }

    const slug = slugZAdresu(url);
    const zrzutTelefon = `zrzuty/${slug}-telefon.png`;
    const zrzutTelefonCala = `zrzuty/${slug}-telefon-cala.png`;
    const zrzutMonitor = `zrzuty/${slug}-monitor.png`;
    try {
      await stronaMonitor.screenshot({ path: join(katalogWyjscia, zrzutMonitor), fullPage: false });
    } catch {
      // brak zrzutu monitora nie przerywa crawlu, strona ponizej i tak trafia do wyniku
    }
    // Dwa zrzuty telefonu. Pierwszy ekran jest do OGLADANIA: to on decyduje,
    // czy dzialanie stoi nad zgieciem. Cala strona jest do MIERZENIA: strona
    // dzialu w pierwszym przebiegu miala 19 446 px, czyli 23 ekrany, i takiego
    // obrazka nie da sie czytac, ale da sie policzyc.
    let wysokoscTelefon = null;
    try {
      await idzDo(stronaTelefon, url);
      await stronaTelefon.screenshot({ path: join(katalogWyjscia, zrzutTelefon), fullPage: false });
      await stronaTelefon.screenshot({ path: join(katalogWyjscia, zrzutTelefonCala), fullPage: true });
      wysokoscTelefon = await stronaTelefon.evaluate(() => document.documentElement.scrollHeight);
    } catch {
      // to samo dla telefonu: zrzut telefonu nie blokuje reszty pomiaru
    }

    strony.push({
      url,
      depth,
      status,
      title: dane.title || "",
      lang: dane.lang || "",
      words: dane.words || 0,
      headings: dane.headings || [],
      forms: dane.forms || [],
      interactive: (dane.interactive || []).map((el) => ({ ...el, safe: czyBezpiecznyKlik(el.text) })),
      links: linksPrzefiltrowane,
      console_errors: biezaceBledyKonsoli,
      failed_requests: biezaceNieudane,
      screenshots: { telefon: zrzutTelefon, telefon_cala: zrzutTelefonCala, monitor: zrzutMonitor },
      phone_height_px: wysokoscTelefon,
      phone_screens: wysokoscTelefon ? Math.ceil(wysokoscTelefon / EKRANY.telefon.height) : null,
    });
  }

  if (!powod) powod = [...odkryte].some((u) => !odwiedzone.has(u)) ? "depth" : "none";

  const nieodwiedzone = [...odkryte].filter((u) => !odwiedzone.has(u)).sort();

  const sciezkaSitemap = join(katalogWyjscia, "sitemap.json");
  zapiszJson(sciezkaSitemap, {
    host,
    seed,
    crawled_at: new Date().toISOString(),
    budget_hit: powod,
    pages: strony,
    unreached: nieodwiedzone,
  });

  await przegladarka.close();

  console.log(
    `Zmapowano ${strony.length} stron, nieodwiedzonych ${nieodwiedzone.length}, powod zatrzymania: ${powod}. Zapisano ${sciezkaSitemap}`
  );
}

main();
