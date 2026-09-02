#!/usr/bin/env node
// ============================================================
// BLEDY WIDOCZNE DOPIERO W PRZEGLADARCE
// ============================================================
// Zastepuje agenta "bug-script-runner" ze skilla site-audit. Oryginal
// generowal na czas audytu plik testowy @playwright/test i odpalal go przez
// "npx playwright test". U nas te same sprawdziany sa TE SAME za kazdym
// razem, wiec zamiast pisac plik testowy od nowa dla kazdego przebiegu, stoi
// tu jeden deterministyczny skrypt na "playwright" prosto z node_modules
// (w repozytorium nie ma @playwright/test i nie ma go tu instalowac).
//
// Wzorce bledow i ich powagi pochodza z
// ".claude/skills/site-audit/references/bug-patterns.md" oraz
// "script-authoring.md" z tego samego skilla: konsola, sieciowe 4xx/5xx,
// tresc mieszana http/https, wyciek szablonu, zepsuty obraz. Jeden wzorzec
// jest wlasny, spoza oryginalu: "redirect-link" (patrz nizej przy funkcji
// sprawdzPrzekierowania), bo strona glowna serwisu potrafila wreczac
// klientowi i Googlebotowi przekierowanie 301 zamiast prostego adresu.
//
// Wejscie to gotowa mapa serwisu (produkuje ja rownolegle mapa.mjs w tym
// samym katalogu): lista stron z ich odnosnikami i elementami interaktywnymi.
// Ten skrypt niczego nie odkrywa sam, tylko sprawdza to, co mapa juz opisala,
// wiec kazdy selektor uzyty do klikniecia pochodzi wprost z mapy, nigdy nie
// jest zgadywany (zasada z "script-authoring.md": selektor spoza artefaktu
// jest gorszy niz brak testu).
//
// Uzycie:
//   node bledy.mjs --mapa=audyt-ux/sitemap.json --wyjscie=audyt-ux
//   node bledy.mjs --mapa=... --strony=5 --bez-klikania
//
// TO NIE JEST CZESC "npm run build". Wymaga gotowej mapy i dzialajacego
// serwera z zbudowanym "dist/", wiec uruchamia sie recznie, tak jak
// "scripts/audit-pages.mjs" i "scripts/check-menu-jezyka.mjs".

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  uruchomPrzegladarke,
  nowyKontekst,
  EKRANY,
  czyBezpiecznyKlik,
  jezykAdresu,
  parsujArgumenty,
  zapiszJson,
  tenSamHost,
} from "./wspolne.mjs";

// Slowa wskazujace na wrazliwy blad konsoli. Angielski zestaw z
// bug-patterns.md ("auth", "token", "security", "CSP") w jednej,
// niewielkiej literowej formie do porownania.
const SLOWA_WRAZLIWE = ["auth", "token", "security", "csp"];

// ------------------------------------------------------------
// Pomocnicze klasyfikatory tresci
// ------------------------------------------------------------

/** Czy tekst bledu konsoli dotyczy zasobu obcego hosta, ktory kontekst
 * odcina celowo (patrz komentarz w wspolne.mjs przy nowyKontekst). Takiego
 * bledu nie zglaszamy, bo mowi o naszej wlasnej blokadzie, nie o serwisie. */
function pomijalnyBladObcegoHosta(wpis, host) {
  const tekst = wpis.text || "";
  const zrodlo = wpis.lokalizacja || "";
  const adresyWTekscie = tekst.match(/https?:\/\/[^\s'")]+/g) || [];
  const obcyAdresWTekscie = adresyWTekscie.some((u) => !tenSamHost(u, host));
  const obceZrodlo = zrodlo ? !tenSamHost(zrodlo, host) : false;
  if (tekst.includes("net::ERR_FAILED") && (obceZrodlo || obcyAdresWTekscie)) return true;
  if (obcyAdresWTekscie) return true;
  return false;
}

/** Token nierenderowanego szablonu w surowym tekscie (np. w src obrazu). */
function zawieraTokenSzablonu(tekst) {
  return /\{\{|\{%|<%|\$\{/.test(String(tekst || ""));
}

/** Widoczny tekst calej strony sprawdzony pod katem wycieku szablonu. */
function sprawdzWyciekSzablonu(tekst) {
  const wyniki = [];
  if (zawieraTokenSzablonu(tekst)) {
    const dopasowanie = tekst.match(/\{\{[^}]*\}\}|\{%[^%]*%\}|<%[^%]*%>|\$\{[^}]*\}/);
    wyniki.push({ severity: "critical", fragment: dopasowanie ? dopasowanie[0] : "(token szablonu)" });
  }
  if (tekst.includes("[object Object]")) {
    wyniki.push({ severity: "high", fragment: "[object Object]" });
  }
  if (/\bundefined\b/.test(tekst)) {
    wyniki.push({ severity: "high", fragment: "undefined" });
  }
  if (/\bnull\b/.test(tekst)) {
    wyniki.push({ severity: "high", fragment: "null" });
  }
  return wyniki;
}

// ------------------------------------------------------------
// Nasluch sieci i konsoli na jednej karcie
// ------------------------------------------------------------

/** Podpina trzy nasluchy na karcie i zwraca rosnace tablice: kazdy kolejny
 * sprawdzian (od ladowania po martwe klikniecie) czyta z nich to, czego
 * potrzebuje, porownujac dlugosc "przed" i "po", zamiast liczyc od zera. */
function zainstalujNasluch(tab, host) {
  const stan = { konsoleAll: [], odpowiedzi: [], requestUrls: [] };
  tab.on("console", (msg) => {
    let lokalizacja = "";
    try { lokalizacja = msg.location()?.url || ""; } catch { /* niektore typy komunikatow nie maja lokalizacji */ }
    stan.konsoleAll.push({ type: msg.type(), text: msg.text(), lokalizacja });
  });
  tab.on("response", (res) => {
    const url = res.url();
    if (res.status() >= 400 && tenSamHost(url, host)) {
      stan.odpowiedzi.push({ url, status: res.status() });
    }
  });
  tab.on("request", (req) => {
    stan.requestUrls.push(req.url());
  });
  return stan;
}

/** Atrybuty elementu, jego bezposredniego rodzica i document.documentElement,
 * do porownania przed/po klikniecu w sprawdzianie martwych klikniec.
 * Rodzic jest tu celowo, nie tylko "element" i "html" ze zlecenia: natywny
 * <details><summary> na tej stronie (FAQ) trzyma atrybut "open" na
 * <details>, czyli na rodzicu klikanego <summary>, nigdy na samym elemencie
 * ani na <html>. Bez tego rozszerzenia kazdy klik w pytanie FAQ wygladalby
 * na martwy klik, mimo ze akordeon dziala poprawnie: to zlapalem dopiero na
 * prawdziwym przebiegu testowym, nie w teorii. */
async function pobierzAtrybuty(tab, selector) {
  return tab
    .evaluate((sel) => {
      const el = document.querySelector(sel);
      const rodzic = el ? el.parentElement : null;
      const html = document.documentElement;
      const grab = (n) =>
        n
          ? {
              ariaExpanded: n.getAttribute("aria-expanded"),
              open: n.hasAttribute("open"),
              dataState: n.getAttribute("data-state"),
              klasa: n.className,
            }
          : null;
      return { el: grab(el), rodzic: grab(rodzic), html: grab(html) };
    }, selector)
    .catch(() => ({ el: null, rodzic: null, html: null }));
}

/** Stan "cos sie odslonilo" dla sprawdzianu hover-only-menu: aria-expanded
 * elementu plus liczba elementow strony z niezerowym prostokatem (widocznych
 * na ekranie). Dwa niezalezne sygnaly, bo nie kazdy rozwijany element ustawia
 * aria-expanded. */
async function stanUjawnienia(tab, selector) {
  return tab.evaluate((sel) => {
    const el = document.querySelector(sel);
    const expanded = el ? el.getAttribute("aria-expanded") === "true" : null;
    const widoczne = Array.from(document.querySelectorAll("*")).filter((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }).length;
    return { expanded, widoczne };
  }, selector);
}

function cosSieOdslonilo(przed, po) {
  if (po.expanded === true && przed.expanded !== true) return true;
  return po.widoczne > przed.widoczne;
}

// ------------------------------------------------------------
// Sprawdzian 6: odnosniki i przekierowania (nasz wlasny wzorzec)
// ------------------------------------------------------------
// Site-mapper oryginalnego site-audit nie mial tego testu w ogole: sprawdzal
// tylko to, co widac po zaladowaniu strony. My dodatkowo bijemy kazdy
// odnosnik tego samego hosta metoda HEAD (bez podazania za przekierowaniem),
// bo cztery kafelki strony glownej prowadzily do "/studio?tab=..." bez
// koncowego ukosnika: kazdy klient i kazdy Googlebot dostawal w odpowiedzi
// przekierowanie 301 zamiast prostego adresu. Strona glowna serwisu nie
// powinna wreczac przekierowan wlasnym odnosnikom. Dedukcja idzie po adresie
// w calym przebiegu (jeden odnosnik sprawdzony raz), ale kazde znalezisko
// niesie liste wszystkich stron, na ktorych ten odnosnik stoi.
async function sprawdzPrzekierowania(ctx, host, strony, findings) {
  const adresyDoStron = new Map();
  for (const p of strony) {
    for (const l of p.links || []) {
      if (!l.href || !tenSamHost(l.href, host)) continue;
      if (!adresyDoStron.has(l.href)) adresyDoStron.set(l.href, new Set());
      adresyDoStron.get(l.href).add(p.url);
    }
  }

  const listaPrzekierowan = [];
  for (const [href, strony_] of adresyDoStron) {
    let odp;
    try {
      odp = await ctx.request.fetch(href, { maxRedirects: 0, method: "HEAD", timeout: 10000 });
    } catch (e) {
      findings.push({
        severity: "high",
        type: "redirect-link",
        page: [...strony_][0],
        selector: null,
        issue: `odnosnik ${href} nie odpowiada: ${e.message}`,
        recommendation: "Sprawdz, czy adres jest osiagalny, i popraw odnosnik albo trase.",
        detail: { href, pages: [...strony_] },
      });
      continue;
    }
    if (odp.status() === 405) {
      try {
        odp = await ctx.request.fetch(href, { maxRedirects: 0, method: "GET", timeout: 10000 });
      } catch { /* zostaje wynik z HEAD */ }
    }
    const status = odp.status();
    if (status >= 300) {
      const lokacja = odp.headers()["location"] || null;
      const severity = status >= 500 ? "high" : "medium";
      findings.push({
        severity,
        type: "redirect-link",
        page: [...strony_][0],
        selector: null,
        issue:
          status < 400
            ? `odnosnik ${href} przekierowuje (${status})${lokacja ? " do " + lokacja : ""}, powinien wskazywac adres docelowy wprost`
            : `odnosnik ${href} odpowiada bledem ${status}`,
        recommendation: "Zaktualizuj odnosnik na adres docelowy, strona nie powinna wreczac przekierowania klientowi ani robotowi.",
        detail: { href, status, location: lokacja, pages: [...strony_] },
      });
      listaPrzekierowan.push({ href, status, location: lokacja });
    }
  }
  return { linksChecked: adresyDoStron.size, listaPrzekierowan };
}

// ------------------------------------------------------------
// Sprawdzian 7: martwe klikniecia
// ------------------------------------------------------------
async function sprawdzMartweKlikniecia(tab, stan, p, host, findings, limit = 40) {
  const kandydaci = (p.interactive || [])
    .filter((i) => i.safe === true && czyBezpiecznyKlik(i.text) && i.role !== "submit")
    .slice(0, limit);

  let wykonaneKlikniecia = 0;
  // Strone wczytujemy od nowa tylko po kliknieciu, ktore cos zmienilo; po
  // martwym kliknieciu drzewo jest takie samo, wiec wczytanie byloby stracona
  // sekunda razy sto osiemdziesiat kandydatow.
  let stanZmieniony = false;
  for (const item of kandydaci) {
    // Kazde klikniecie startuje ze swiezo wczytanej strony. Selektory z mapy
    // sa pozycyjne (nth-of-type), a wczesniejsze klikniecie na tej samej
    // stronie potrafi przestawic drzewo: po rozwinieciu panelu "dla
    // zaawansowanych" selektor kafelka "Nowa bizuteria" trafial w inny
    // przycisk, ktory nic nie robil, i to ON wychodzil jako martwe klikniecie
    // pod cudza nazwa (drugi przebieg, 2026-09-02). Do tego tekst elementu
    // musi zgadzac sie z mapa, inaczej klikamy nie to, co raportujemy.
    if (stanZmieniony) {
      try {
        await tab.goto(p.url, { waitUntil: "load", timeout: 15000 });
        await tab.waitForTimeout(300);
      } catch { break; }
      stanZmieniony = false;
    }
    const loc = tab.locator(item.selector).first();
    let liczba = 0;
    try { liczba = await loc.count(); } catch { continue; }
    if (liczba === 0) continue;
    let widoczny = false;
    try { widoczny = await loc.isVisible(); } catch { widoczny = false; }
    if (!widoczny) continue;
    let tekstTeraz = "";
    try { tekstTeraz = ((await loc.textContent()) || "").replace(/\s+/g, " ").trim(); } catch { tekstTeraz = ""; }
    const tekstMapy = String(item.text || "").replace(/\s+/g, " ").trim();
    if (tekstMapy && tekstTeraz && !tekstTeraz.startsWith(tekstMapy.slice(0, 20))) continue; // selektor zdryfowal

    // Opcja juz wybrana (kafelek kalkulatora z domyslnym wyborem) po kliknieciu
    // nie zmienia niczego i to jest poprawne. Pierwszy przebieg zglosil cztery
    // takie kafelki jako martwe klikniecia. Poznajemy je po stanie ARIA;
    // kafelek bez zadnego z tych atrybutow zostaje w sprawdzianie, bo brak
    // stanu wybrania to osobna usterka dostepnosci, ktora ma wyjsc.
    let wybrany = false;
    try {
      wybrany = await loc.evaluate((el) =>
        ["aria-pressed", "aria-selected", "aria-checked"].some((a) => el.getAttribute(a) === "true") ||
        el.hasAttribute("aria-current") || el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true");
    } catch { wybrany = false; }
    if (wybrany) continue;

    const urlPrzed = tab.url();
    let domPrzed;
    try { domPrzed = await tab.evaluate(() => document.getElementsByTagName("*").length); } catch { continue; }
    const zadaniaPrzed = stan.requestUrls.length;
    const konsolaPrzed = stan.konsoleAll.length;
    const atrybutyPrzed = await pobierzAtrybuty(tab, item.selector);

    try {
      await loc.click({ timeout: 3000 });
      wykonaneKlikniecia++;
      stanZmieniony = true;
    } catch {
      continue; // element nieklikalny w tej chwili, to nie jest blad strony
    }
    await tab.waitForTimeout(600);

    const urlPo = tab.url();
    if (urlPo !== urlPrzed) {
      // Klik cos zrobil (nawigacja), wiec to nie jest martwy klik. Wracamy,
      // zeby kolejny kandydat startowal z tej samej strony co mapa.
      try {
        await tab.goBack({ waitUntil: "load", timeout: 8000 });
      } catch {
        await tab.goto(p.url, { waitUntil: "load", timeout: 15000 }).catch(() => {});
      }
      continue;
    }

    // Filtrujemy tak samo jak przy wczytaniu (pomijalnyBladObcegoHosta):
    // klik na "Dla zaawansowanych" w kalkulatorze probuje dociagnac kurs
    // metali z wlasnego API i doladowac Trustpilot, oba na obcych hostach
    // odcinanych celowo przez kontekst. Bez tego filtra kazdy taki klik
    // wygladalby na zepsuty przycisk, a jest to szum sandboxa, nie strony.
    const noweWpisy = stan.konsoleAll.slice(konsolaPrzed).filter((w) => !pomijalnyBladObcegoHosta(w, host));
    const noweBledy = noweWpisy.filter((w) => w.type === "error");
    if (noweBledy.length > 0) {
      findings.push({
        severity: "high",
        type: "console-error-after-click",
        page: p.url,
        selector: item.selector,
        issue: `klik: ${item.text || item.selector} wywolal blad konsoli: ${noweBledy[0].text}`,
        recommendation: "Sprawdz obsluge zdarzenia klikniecia, blad konsoli po interakcji psuje dalsze dzialanie strony.",
        detail: { text: item.text, blad: noweBledy[0].text },
      });
      continue;
    }

    const domPo = await tab
      .evaluate(() => document.getElementsByTagName("*").length)
      .catch(() => domPrzed);
    const zadaniaPo = stan.requestUrls.length;
    const atrybutyPo = await pobierzAtrybuty(tab, item.selector);

    const domTakiSam = domPo === domPrzed;
    const brakNowychZadan = zadaniaPo === zadaniaPrzed;
    const brakNowychWpisow = noweWpisy.length === 0;
    const atrybutyTakieSame = JSON.stringify(atrybutyPrzed) === JSON.stringify(atrybutyPo);

    if (domTakiSam && brakNowychZadan && brakNowychWpisow && atrybutyTakieSame) {
      stanZmieniony = false; // nic sie nie stalo, wiec nie ma czego wczytywac od nowa
      findings.push({
        severity: "medium",
        type: "dead-click",
        page: p.url,
        selector: item.selector,
        issue: `klik: ${item.text || item.selector} nie zmienil niczego na stronie`,
        recommendation: "Dodaj widoczny efekt klikniecia albo usun element, jesli nie ma funkcji.",
        detail: { text: item.text },
      });
    }
  }
  return wykonaneKlikniecia;
}

// ------------------------------------------------------------
// Sprawdzian 8: menu dzialajace tylko na hover
// ------------------------------------------------------------
// Ograniczone do area "header"/"nav", tak jak dopuszcza zlecenie: to jedyne
// miejsce, gdzie brak obslugi dotyku naprawde boli klienta. Mapa (schemat z
// mapa.mjs) niesie dla interactive[] tylko {selector, role, text, safe}, bez
// atrybutu aria-haspopup, wiec warunek "[aria-haspopup]" z opisu zlecenia da
// sie sprawdzic wylacznie po role; to jest znana luka schematu, nie pominiecie
// z lenistwa (opisana tez w raporcie koncowym).
async function sprawdzHoverOnlyMenu(tab, telefonCtxGetter, p, findings) {
  const kandydaci = (p.interactive || []).filter(
    (i) =>
      (i.area === "header" || i.area === "nav") &&
      (i.role === "button" || i.role === "menuitem") &&
      czyBezpiecznyKlik(i.text)
  );

  let wykonaneKlikniecia = 0;
  for (const item of kandydaci) {
    const loc = tab.locator(item.selector).first();
    let liczba = 0;
    try { liczba = await loc.count(); } catch { continue; }
    if (liczba === 0) continue;
    let widoczny = false;
    try { widoczny = await loc.isVisible(); } catch { widoczny = false; }
    if (!widoczny) continue;

    let przedHover, poHover;
    try {
      przedHover = await stanUjawnienia(tab, item.selector);
      await loc.hover({ timeout: 3000 });
      await tab.waitForTimeout(300);
      poHover = await stanUjawnienia(tab, item.selector);
      await tab.mouse.move(0, 0).catch(() => {});
      await tab.waitForTimeout(150);
    } catch {
      continue;
    }
    if (!cosSieOdslonilo(przedHover, poHover)) continue; // nie jest to menu rozwijane na hover

    const telCtx = await telefonCtxGetter(jezykAdresu(p.url));
    const telTab = await telCtx.newPage();
    try {
      await telTab.goto(p.url, { waitUntil: "load", timeout: 15000 });
      const telLoc = telTab.locator(item.selector).first();
      if ((await telLoc.count()) === 0) continue;
      // Element bywa w DOM, ale schowany na telefonie przez responsywna
      // klase (np. "hidden md:flex" na nawigacji desktopowej, zastapiona na
      // telefonie osobnym menu z hamburgerem). To nie jest hover-only-menu,
      // tylko inny uklad dla innej szerokosci ekranu, wiec bez sprawdzenia
      // widocznosci klik.catch() polykalby blad "not visible" i falszywie
      // pokazywal "dotyk nie dziala": zlapalem to na prawdziwym przebiegu.
      let telWidoczny = false;
      try { telWidoczny = await telLoc.isVisible(); } catch { telWidoczny = false; }
      if (!telWidoczny) continue;
      const przedKlik = await stanUjawnienia(telTab, item.selector);
      await telLoc.click({ timeout: 3000 }).catch(() => {});
      wykonaneKlikniecia++;
      await telTab.waitForTimeout(300);
      const poKlik = await stanUjawnienia(telTab, item.selector);
      if (!cosSieOdslonilo(przedKlik, poKlik)) {
        findings.push({
          severity: "medium",
          type: "hover-only-menu",
          page: p.url,
          selector: item.selector,
          issue: `menu "${item.text || item.selector}" otwiera sie na hover, ale nie na dotyk`,
          recommendation: "Dodaj obsluge klikniecia/dotyku obok hover, telefon nie ma najezdzania kursorem.",
          detail: { text: item.text },
        });
      }
    } finally {
      await telTab.close();
    }
  }
  return wykonaneKlikniecia;
}


// ------------------------------------------------------------
// Glowny przebieg
// ------------------------------------------------------------
async function main() {
  const args = parsujArgumenty(process.argv.slice(2), {
    mapa: "audyt-ux/sitemap.json",
    wyjscie: "audyt-ux",
  });

  const sciezkaMapy = resolve(process.cwd(), String(args.mapa));
  let dane;
  try {
    dane = JSON.parse(readFileSync(sciezkaMapy, "utf8"));
  } catch (e) {
    console.error(`Nie udalo sie wczytac mapy "${sciezkaMapy}": ${e.message}`);
    process.exit(1);
  }

  let strony = Array.isArray(dane.pages) ? dane.pages : [];
  if (args.strony) strony = strony.slice(0, Number(args.strony));
  if (strony.length === 0) {
    console.error("Mapa nie zawiera zadnej strony (pages jest puste albo brakuje go).");
    process.exit(1);
  }

  const bezKlikania = args["bez-klikania"] === true;
  const host = new URL(strony[0].url).host;

  const findings = [];
  const przegladarka = await uruchomPrzegladarke();
  // Kontekst na jezyk strony, tworzony przy pierwszym uzyciu: jezyk
  // przegladarki idzie za adresem (patrz LOCALE w wspolne.mjs).
  const monitorCtxy = new Map();
  const monitorCtxDla = async (lang) => {
    if (!monitorCtxy.has(lang)) monitorCtxy.set(lang, await nowyKontekst(przegladarka, { host, ekran: EKRANY.monitor, lang }));
    return monitorCtxy.get(lang);
  };
  const monitorCtx = await monitorCtxDla(jezykAdresu(strony[0].url));

  const { linksChecked, listaPrzekierowan } = await sprawdzPrzekierowania(monitorCtx, host, strony, findings);

  const telefonCtxy = new Map();
  const telefonCtxGetter = async (lang) => {
    if (!telefonCtxy.has(lang)) telefonCtxy.set(lang, await nowyKontekst(przegladarka, { host, ekran: EKRANY.telefon, dotyk: true, lang }));
    return telefonCtxy.get(lang);
  };

  let clicksMade = 0;
  let pagesChecked = 0;

  for (const p of strony) {
    const tab = await (await monitorCtxDla(jezykAdresu(p.url))).newPage();
    const stan = zainstalujNasluch(tab, host);

    let zaladowana = true;
    try {
      await tab.goto(p.url, { waitUntil: "load", timeout: 15000 });
      await tab.waitForTimeout(500); // czas na bledy hydracji i pozne zadania
    } catch (e) {
      zaladowana = false;
      findings.push({
        severity: "critical",
        type: "navigation-error",
        page: p.url,
        selector: null,
        issue: `strona sie nie wczytala: ${e.message}`,
        recommendation: "Sprawdz adres i dostepnosc strony, nawigacja zakonczyla sie bledem.",
        detail: {},
      });
    }

    if (zaladowana) {
      // 1. console-error (bledy przy wczytaniu, bez duplikatow tej samej tresci)
      const widzianeTresci = new Set();
      for (const wpis of stan.konsoleAll) {
        if (wpis.type !== "error") continue;
        if (pomijalnyBladObcegoHosta(wpis, host)) continue;
        if (widzianeTresci.has(wpis.text)) continue;
        widzianeTresci.add(wpis.text);
        const wrazliwy = SLOWA_WRAZLIWE.some((s) => wpis.text.toLowerCase().includes(s));
        findings.push({
          severity: wrazliwy ? "critical" : "high",
          type: "console-error",
          page: p.url,
          selector: null,
          issue: `blad konsoli przy wczytaniu: ${wpis.text}`,
          recommendation: "Sprawdz konsole przegladarki przy wczytaniu strony i usun blad zanim trafi do klienta.",
          detail: { text: wpis.text },
        });
      }

      // 2. failed-request (odpowiedzi >= 400 tego samego hosta)
      const widzianeOdpowiedzi = new Set();
      for (const r of stan.odpowiedzi) {
        const klucz = `${r.status}|${r.url}`;
        if (widzianeOdpowiedzi.has(klucz)) continue;
        widzianeOdpowiedzi.add(klucz);
        findings.push({
          severity: r.status >= 500 ? "high" : "medium",
          type: "failed-request",
          page: p.url,
          selector: null,
          issue: `zasob ${r.url} odpowiedzial ${r.status}`,
          recommendation: "Sprawdz, dlaczego zasob zwraca blad, i napraw adres albo plik.",
          detail: { url: r.url, status: r.status },
        });
      }

      // 3. mixed-content (tylko gdy seed jest https)
      if (tab.url().startsWith("https://")) {
        const widzianeHttp = new Set();
        for (const u of stan.requestUrls) {
          if (!u.startsWith("http://")) continue;
          if (widzianeHttp.has(u)) continue;
          widzianeHttp.add(u);
          findings.push({
            severity: "high",
            type: "mixed-content",
            page: p.url,
            selector: null,
            issue: `zasob http na stronie https: ${u}`,
            recommendation: "Zmien adres zasobu na https, przegladarka blokuje tresc http na stronie https.",
            detail: { url: u },
          });
        }
      }

      // 4. template-bleed (widoczny tekst strony)
      const tekstStrony = await tab.evaluate(() => document.body.innerText).catch(() => "");
      for (const w of sprawdzWyciekSzablonu(tekstStrony)) {
        findings.push({
          severity: w.severity,
          type: "template-bleed",
          page: p.url,
          selector: null,
          issue: `widoczny tekst zawiera niewyrenderowany fragment: ${w.fragment}`,
          recommendation: "Znajdz miejsce, w ktorym szablon nie zostal wyrenderowany, i popraw dane wejsciowe.",
          detail: { fragment: w.fragment },
        });
      }

      // 5. broken-image
      const obrazy = await tab
        .evaluate(() =>
          Array.from(document.querySelectorAll("img")).map((img) => ({
            raw: img.getAttribute("src"),
            resolved: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
          }))
        )
        .catch(() => []);
      for (const im of obrazy) {
        if (im.raw === "" || im.raw === null) {
          findings.push({
            severity: "high",
            type: "broken-image",
            page: p.url,
            selector: null,
            issue: "obraz ma pusty atrybut src, przegladarka zada strone samej siebie",
            recommendation: "Sprawdz sciezke obrazu i podmien na istniejacy plik.",
            detail: { raw: im.raw },
          });
          continue;
        }
        if (im.raw === "undefined" || im.raw === "null") {
          findings.push({
            severity: "high",
            type: "broken-image",
            page: p.url,
            selector: null,
            issue: `obraz ma src="${im.raw}", to wyciekla zmienna JS`,
            recommendation: "Sprawdz sciezke obrazu i podmien na istniejacy plik.",
            detail: { raw: im.raw },
          });
          continue;
        }
        if (zawieraTokenSzablonu(im.raw)) {
          findings.push({
            severity: "critical",
            type: "broken-image",
            page: p.url,
            selector: null,
            issue: `obraz ma niewyrenderowany token szablonu w src: ${im.raw}`,
            recommendation: "Sprawdz sciezke obrazu i podmien na istniejacy plik.",
            detail: { raw: im.raw },
          });
          continue;
        }
        if (!tenSamHost(im.resolved, host)) continue; // obcy host, pomijamy
        if (im.complete && im.naturalWidth === 0) {
          findings.push({
            severity: "high",
            type: "broken-image",
            page: p.url,
            selector: null,
            issue: `obraz nie wczytal sie: ${im.resolved}`,
            recommendation: "Sprawdz sciezke obrazu i podmien na istniejacy plik.",
            detail: { src: im.resolved },
          });
        }
      }

      // 7. dead-click
      if (!bezKlikania) {
        clicksMade += await sprawdzMartweKlikniecia(tab, stan, p, host, findings);
      }

      // 8. hover-only-menu (odswiezona karta, zeby stan po klikkniach z
      // punktu 7 nie mieszal sie do proby hover)
      try {
        await tab.goto(p.url, { waitUntil: "load", timeout: 15000 });
        clicksMade += await sprawdzHoverOnlyMenu(tab, telefonCtxGetter, p, findings);
      } catch { /* strona juz zglosila navigation-error wyzej albo padla teraz, pomijamy hover */ }
    }

    await tab.close();
    pagesChecked++;
  }

  for (const ctx of [...telefonCtxy.values(), ...monitorCtxy.values()]) await ctx.close();
  await przegladarka.close();

  const byType = {};
  for (const f of findings) byType[f.type] = (byType[f.type] || 0) + 1;

  const wynik = {
    generated_at: new Date().toISOString(),
    pages_checked: pagesChecked,
    links_checked: linksChecked,
    clicks_made: clicksMade,
    findings,
    by_type: byType,
  };

  const sciezkaWyjscia = resolve(process.cwd(), String(args.wyjscie), "bledy.json");
  zapiszJson(sciezkaWyjscia, wynik);

  const grupy = new Map();
  for (const f of findings) {
    const klucz = `${f.type}|${f.severity}`;
    grupy.set(klucz, (grupy.get(klucz) || 0) + 1);
  }
  console.log(`Zapisano: ${sciezkaWyjscia}`);
  console.log(`Stron sprawdzonych: ${pagesChecked}, odnosnikow sprawdzonych: ${linksChecked}, klikniec wykonanych: ${clicksMade}`);
  console.log("");
  console.log("typ".padEnd(28) + "powaga".padEnd(10) + "liczba");
  for (const [klucz, n] of [...grupy.entries()].sort()) {
    const [typ, powaga] = klucz.split("|");
    console.log(typ.padEnd(28) + powaga.padEnd(10) + String(n));
  }

  if (listaPrzekierowan.length) {
    console.log("");
    console.log("Przekierowania i bledne odnosniki:");
    for (const r of listaPrzekierowan) {
      console.log(`  ${r.href} -> ${r.status}${r.location ? " " + r.location : ""}`);
    }
  }

  const martweKlikniecia = findings.filter((f) => f.type === "dead-click");
  if (martweKlikniecia.length) {
    console.log("");
    console.log("Martwe klikniecia:");
    for (const f of martweKlikniecia) {
      console.log(`  ${f.page}: ${f.issue}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
