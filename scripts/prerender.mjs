#!/usr/bin/env node
// ============================================================
// PRERENDER: KAZDA TRASA, TRZY JEZYKI, HTML GOTOWY BEZ PRZEGLADARKI KLIENTA
// ============================================================
// Renderuje kazda strone serwisu do statycznego HTML, po polsku pod golym
// adresem, po angielsku pod `/en/`, po niemiecku pod `/de/`. Lista tras
// pochodzi z jednego zrodla (`src/routes.js`), tego samego, ktore rysuje
// serwis w przegladarce: wczesniej stala tu trzecia, recznie pisana kopia,
// pilnowana osobnym skryptem porownujacym, a teraz brak strony w prerenderze
// jest po prostu brakiem trasy w calym serwisie.
//
// Ponizej stoi tez blokada, ktora zdarzyla sie naprawde dwa razy jednego
// dnia: uruchomienie tego skryptu bez wczesniejszego `vite build` czyta jako
// szablon gotowa strone glowna sprzed chwili, zamiast surowego wyjscia builda,
// i wkleja jej naglowek oraz preloady do kazdej innej strony po cichu.
//
// Poza tym plik niesie komplet awarii zwiazanych z prerenderem, opisanych
// przy odpowiednich fragmentach kodu nizej: hydratacja stu stron naraz,
// wlasny hosting fontow, obrazy dobierane pod rozmiar miejsca, na ktorym
// staja, adresy jezykowe w danych strukturalnych i opisy wyszukiwania osobne
// dla kazdej strony uslugi.
//
// Uruchamiany w `npm run build`, jako ostatni krok po `vite build`.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const serverPath = path.resolve(__dirname, "../dist/server/entry-server.mjs");

const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");

// SZABLONEM JEST WYNIK `vite build`, A NIE POPRZEDNI WYNIK TEGO SKRYPTU.
// `dist/index.html` sluzy tu za szablon i jest zarazem pierwszym plikiem,
// ktory ten skrypt nadpisuje. Uruchomiony drugi raz bez `vite build` czyta
// wiec gotowa strone glowna i wkleja ja jako szablon KAZDEJ innej strony:
// /jewelry/ dostaje naglowek strony glownej razem z jej preloadami, a
// niezgodnosci widac dopiero w przegladarce. Zdarzylo mi sie to dwa razy
// jednego dnia, wiec niech pilnuje tego skrypt, a nie pamiec.
if (!template.includes("<!--ssr-outlet-->")) {
  console.error(
    "\n  ✗ dist/index.html nie ma juz znacznika <!--ssr-outlet-->.\n" +
    "    To znaczy, ze jest wynikiem POPRZEDNIEGO prerenderu, a nie buildu.\n" +
    "    Uruchom najpierw: npx vite build && npx vite build --ssr src/entry-server.jsx --outDir dist/server\n"
  );
  process.exit(1);
}
const { render } = await import(serverPath);

// Blog slugs and glossary IDs are derived from the same modules the app uses,
// never hand-maintained. Since public/_redirects no longer has an SPA catch-all,
// a route missing from this list would be served as a hard 404 by Cloudflare
// Pages instead of silently falling back to client-side rendering.
const { POSTS_META } = await import("../src/blog/postsMeta.js");
const { GLOSSARY } = await import("../src/data/glossary.js");
const { PRODUCTS } = await import("../src/data/shopCatalog.js");
const { SERVICES_FULL } = await import("../src/data/serviceCatalog.js");
const { TRASY_STALE, JEZYKI, sciezkaJezyka, rozbierzSciezke } = await import("../src/routes.js");

// Lista tras przychodzi z `src/routes.js`, tej samej, ktora rysuje serwis w
// przegladarce i na serwerze. Wczesniej stala tu trzecia kopia, pisana recznie,
// pilnowana skryptem porownujacym ja z `main.jsx`. Kopii nie ma, wiec nie ma
// czego pilnowac: brak strony w prerenderze bylby teraz brakiem trasy w ogole.
const STATIC_ROUTES = TRASY_STALE.map((p) => (p === "/" ? "/" : p.replace(/\/$/, "")));

const GLOSSARY_IDS = GLOSSARY.map((term) => term.id);
const BLOG_SLUGS = POSTS_META.map((post) => post.slug);
// Slugi produktow pochodza z katalogu, wiec nowy produkt nie wymaga wpisu recznego
const PRODUCT_SLUGS = PRODUCTS.map((p) => p.slug);
const SERVICE_IDS = SERVICES_FULL.map((s) => s.id);

const TRASY_POLSKIE = [
  ...STATIC_ROUTES,
  ...BLOG_SLUGS.map((s) => `/blog/${s}`),
  ...GLOSSARY_IDS.map((id) => `/glossary/${id}`),
  ...PRODUCT_SLUGS.map((slug) => `/shop/${slug}`),
  ...SERVICE_IDS.map((id) => `/shop/service/${id}`),
];

// KAZDA STRONA TRZY RAZY: po polsku pod golym adresem, po angielsku pod `/en/`,
// po niemiecku pod `/de/`. To jest cala tresc znaleziska numer jeden z audytu:
// serwis mowil trzema jezykami, ale wszystkie trzy dzielily jeden adres, wiec
// wyszukiwarka widziala wylacznie polski. Regulamin po niemiecku, polityka po
// niemiecku i sto stron tresci nie mialy jak trafic do niemieckiego klienta.
const routes = JEZYKI.flatMap((lang) =>
  TRASY_POLSKIE.map((trasa) => sciezkaJezyka(trasa === "/" ? "/" : trasa + "/", lang))
    .map((p) => (p === "/" ? "/" : p.replace(/\/$/, ""))),
);

// ------------------------------------------------------------
// PRELOAD OBRAZU BOHATERSKIEGO CZYTANY Z GOTOWEJ STRONY
// ------------------------------------------------------------
// Wczesniej `index.html` preladowalo na sztywno dwa obrazy strony glownej,
// czyli 465 kB z wysokim priorytetem takze na 95 stronach, ktore tych obrazow
// nie pokazuja, konkurujac tam z prawdziwym obrazem LCP. Trzymala to recznie
// pisana mapa "obraz -> trasy", ktora trzeba bylo pamietac.
//
// Teraz preload bierze sie z tego, co strona NAPRAWDE narysowala. `HeroObraz`
// oznacza obraz pierwszego ekranu atrybutem `fetchpriority="high"`, wiec
// wystarczy znalezc jego `<picture>` w gotowym HTML-u i przepisac `srcset`
// oraz `sizes` do preloadu. Mapa nie ma jak sie rozjechac, bo jej nie ma.
//
// Preladujemy wersje AVIF. Przegladarka, ktora AVIF nie rozumie, pomija ten
// preload dzieki atrybutowi `type` i pobiera WebP zwyczajnie, przez `<picture>`.
const MAX_PRELOADOW = 2;

function preloadyBohaterskie(html) {
  const obrazki = [...html.matchAll(/<picture[^>]*>([\s\S]*?)<\/picture>/g)]
    .map((m) => m[1])
    .filter((srodek) => srodek.includes('fetchpriority="high"'));

  const linki = [];
  for (const srodek of obrazki.slice(0, MAX_PRELOADOW)) {
    const avif = /<source[^>]*type="image\/avif"[^>]*>/.exec(srodek);
    if (!avif) continue;
    // Wielkosc liter bez znaczenia: React wypisuje na `<source>` atrybut jako
    // `srcSet`, a parser HTML czyta go tak samo jak `srcset`.
    const zestaw = /srcset="([^"]+)"/i.exec(avif[0]);
    const rozmiary = /sizes="([^"]+)"/i.exec(avif[0]);
    if (!zestaw) continue;
    linki.push(
      `<link rel="preload" as="image" type="image/avif" fetchpriority="high"` +
      ` imagesrcset="${zestaw[1]}"` +
      (rozmiary ? ` imagesizes="${rozmiary[1]}"` : "") +
      ">"
    );
  }
  return linki;
}

// ------------------------------------------------------------
// KAZDA STRONA ZAPOWIADA WLASNY FRAGMENT TRASY
// ------------------------------------------------------------
// Do 27 sierpnia 2026 wszystkie sto stron zapowiadalo dokladnie te same trzy
// pliki: wejsciowy, Reacta i helmet. Plik z kodem WLASNEJ trasy nie byl w tym
// HTML-u wspomniany ani razu. Przegladarka musiala wiec pobrac i przetworzyc
// 531 kB pliku wejsciowego, dopiero wtedy router odkrywal, ze brakuje
// `Studio-*.js`, szedl po niego, a po jego przetworzeniu odkrywal jeszcze
// trzydziesci wspolnych fragmentow, ktorych ten plik potrzebuje. Trzy tury
// tam, gdzie od poczatku wiadomo, ktora to trasa.
//
// Manifest Vite mowi, ktory plik wyjsciowy odpowiada ktoremu zrodlu, wiec
// niczego nie trzeba zgadywac. Wypisujemy fragment trasy razem z jego
// zaleznosciami, pomijajac to, co w dokumencie juz stoi.
//
// Strony importowane zwyczajnie (glowna, kontakt) siedza w pliku wejsciowym
// i nie maja wlasnego wpisu w manifescie. Wtedy po prostu nie ma czego
// zapowiadac i to jest poprawny wynik, a nie brak.
const manifestPath = path.resolve(distPath, ".vite/manifest.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  : null;

const mainSrcRaw = fs.readFileSync(path.resolve(__dirname, "../src/main.jsx"), "utf-8");

/** nazwa komponentu -> sciezka zrodla, np. Studio -> src/pages/Studio.jsx */
const ZRODLO_KOMPONENTU = Object.fromEntries(
  [...mainSrcRaw.matchAll(/const\s+(\w+)\s*=\s*strona\(\(\)\s*=>\s*import\("\.\/([^"]+)"\)\)/g)]
    .map((m) => [m[1], "src/" + m[2]]),
);

/** wzorzec trasy -> nazwa komponentu, w kolejnosci deklaracji w routerze */
const TRASA_KOMPONENT = [...mainSrcRaw.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)]
  .map((m) => ({ wzorzec: m[1], komponent: m[2] }));

/** `/blog/:slug/` -> wyrazenie, ktore dopasuje `/blog/cokolwiek`. */
function naWyrazenie(wzorzec) {
  const bezUkosnika = wzorzec.replace(/\/$/, "") || "/";
  const ciało = bezUkosnika
    .split("/")
    .map((czesc) => (czesc.startsWith(":") ? "[^/]+" : czesc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${ciało}$`);
}

const TRASY_WZORCE = TRASA_KOMPONENT
  .filter((t) => t.wzorzec !== "*")
  .map((t) => ({ ...t, wyrazenie: naWyrazenie(t.wzorzec) }));

/** Fragment ze slownikiem jezyka tej strony. Slownik jest wciagany dynamicznie,
 *  wiec nie ma go wsrod statycznych zaleznosci trasy: przegladarka odkrylaby go
 *  dopiero po przetworzeniu pliku wejsciowego, a hydracja czeka wlasnie na
 *  niego. Adres strony mowi, ktory to jezyk, wiec nie ma czego zgadywac. */
function plikSlownika(lang) {
  const wpis = manifest && manifest[`src/i18n/${lang}.js`];
  return wpis?.file ? "/" + wpis.file : null;
}

/** Wszystkie pliki, ktore trasa potrzebuje od razu: swoj plus zaleznosci. */
function plikiTrasy(route) {
  if (!manifest) return { skrypty: [], style: [] };
  const bez = route.replace(/\/$/, "") || "/";
  const trafienie = TRASY_WZORCE.find((t) => t.wyrazenie.test(bez));
  const zrodlo = trafienie && ZRODLO_KOMPONENTU[trafienie.komponent];
  const wpis = zrodlo && manifest[zrodlo];
  if (!wpis) return { skrypty: [], style: [] };

  const skrypty = new Set();
  const style = new Set();
  const odwiedzone = new Set();
  const zejdz = (klucz) => {
    if (!klucz || odwiedzone.has(klucz) || klucz === "index.html") return;
    odwiedzone.add(klucz);
    const w = manifest[klucz];
    if (!w) return;
    if (w.file) skrypty.add("/" + w.file);
    for (const css of w.css || []) style.add("/" + css);
    for (const dalej of w.imports || []) zejdz(dalej);
  };
  zejdz(zrodlo);
  return { skrypty: [...skrypty], style: [...style] };
}

function buildPage(route) {
  const { html, helmet } = render(route);

  // ZASTEPUJEMY FUNKCJA, NIE NAPISEM. `String.replace` z napisem po prawej
  // czyta w nim wzorce z dolarem: `$$` znaczy "jeden dolar", `$&` znaczy
  // "cale dopasowanie". Wpis w tabeli bloga o pierscionkach mial kolumne cen
  // pisana dolarami ("$$", "$$$$$") i prerender wypisywal ja o polowe krotsza
  // niz przegladarka. React przy hydracji widzial inny tekst i przerysowywal
  // cala strone od nowa. Funkcja zwracajaca napis nie interpretuje niczego.
  let page = template.replace("<!--ssr-outlet-->", () => html);

  // Strip the static fallback <title>/description/OG/Twitter tags from
  // index.html - every route is now SSR-prerendered, so Helmet always
  // supplies the real per-page tags below. Leaving the static ones in
  // produces duplicate title/description/OG tags on every page.
  page = page
    .replace(/\s*<!-- Static fallback meta tags[\s\S]*?-->\s*/, "\n")
    .replace(/\s*<title>[\s\S]*?<\/title>/, "")
    .replace(/\s*<meta name="description"[^>]*\/>/, "")
    .replace(/\s*<meta property="og:[a-z:]+"[^>]*\/>/g, "")
    .replace(/\s*<meta name="twitter:[a-z:]+"[^>]*\/>/g, "");

  {
    const { skrypty, style } = plikiTrasy(route);
    const slownik = plikSlownika(rozbierzSciezke(route.endsWith("/") ? route : route + "/").lang);
    const nowe = [
      ...preloadyBohaterskie(html),
      ...(slownik && !page.includes(slownik) ? [`<link rel="modulepreload" crossorigin href="${slownik}">`] : []),
      ...skrypty.filter((f) => !page.includes(f)).map((f) => `<link rel="modulepreload" crossorigin href="${f}">`),
      ...style.filter((f) => !page.includes(f)).map((f) => `<link rel="stylesheet" crossorigin href="${f}">`),
    ];
    if (nowe.length) {
      page = page.replace("</head>", () => `    ${nowe.join("\n    ")}\n  </head>`);
    }
  }

  // JEZYK DOKUMENTU. Szablon `index.html` ma na sztywno `lang="pl"`, bo powstaje
  // z jednego pliku. Helmet ustawia atrybut po stronie klienta, ale w gotowym
  // HTML-u zostawalby polski takze pod `/de/`, a to jest pierwsza rzecz, ktora
  // czyta i wyszukiwarka, i czytnik ekranu.
  if (helmet?.htmlAttributes) {
    const atrybuty = helmet.htmlAttributes.toString();
    if (atrybuty) page = page.replace(/<html[^>]*>/, () => `<html ${atrybuty}>`);
  }

  if (helmet) {
    const helmetHead = [
      helmet.title?.toString(),
      helmet.meta?.toString(),
      helmet.link?.toString(),
      helmet.script?.toString(),
    ]
      .filter(Boolean)
      .join("\n    ");

    if (helmetHead) {
      // Ta sama pulapka z dolarem co wyzej: tytul albo opis strony moze
      // zawierac "$", a wtedy napis po prawej zostalby zinterpretowany.
      page = page.replace("</head>", () => `    ${helmetHead}\n  </head>`);
    }
  }

  return page;
}

let success = 0;
let failed = 0;

for (const route of routes) {
  try {
    const page = buildPage(route);

    const filePath =
      route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
    const fullPath = path.resolve(distPath, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, page);
    success++;
    console.log(`  ✓ ${route}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${route}: ${err.message}`);
  }
}

// Cloudflare Pages serves dist/404.html with a real HTTP 404 for any path that
// matches no asset and no _redirects rule. Rendering an unmatched route here
// gives that response the branded NotFound page instead of a bare error, and
// replaces the old SPA catch-all which answered every dead URL with HTTP 200
// (a soft 404 that Search Console reported as "excluded by noindex").
try {
  fs.writeFileSync(
    path.resolve(distPath, "404.html"),
    buildPage("/__not_found__"),
  );
  console.log("  ✓ 404.html");
} catch (err) {
  failed++;
  console.error(`  ✗ 404.html: ${err.message}`);
}

// ------------------------------------------------------------
// Granica Suspense musi byc po obu stronach
// ------------------------------------------------------------
// Klient owija `<Routes>` w `<Suspense>`, bo trasy sa ladowane leniwie.
// Renderowanie na serwerze znaczy granice komentarzami <!--$--> i <!--/$-->.
// Gdy `entry-server.jsx` tej granicy nie ma, hydratacja szuka znacznika,
// nie znajduje go, przewraca sie i React RYSUJE CALA STRONE OD NOWA,
// wyrzucajac gotowy HTML. Strona dziala, wiec nic nie wyglada na zepsute,
// a caly prerender przestaje sluzyc odwiedzajacym.
//
// Przez dlugi czas objawialo sie to wylacznie bledami #418 i #423 w konsoli.
const clientShell = fs.readFileSync(path.resolve(__dirname, "../src/main.jsx"), "utf8");
if (/<Suspense/.test(clientShell)) {
  const home = fs.readFileSync(path.resolve(distPath, "index.html"), "utf8");
  if (!home.includes("<!--$-->")) {
    console.error(
      "\n  ✗ Klient ma <Suspense>, a wyrenderowany HTML nie ma znacznikow granicy.\n" +
      "    Dodaj te sama granice w src/entry-server.jsx, inaczej hydratacja\n" +
      "    odrzuci prerender i przerysuje strone od zera."
    );
    failed++;
  }
}

// ------------------------------------------------------------
// Żadna strona nie preładuje obrazu, którego nie pokazuje
// ------------------------------------------------------------
// Mapa wyżej wystarczy, dopóki ktoś jej pilnuje. Ten sprawdzian pilnuje jej
// za nas i nie zależy od niej: idzie po GOTOWYCH plikach i porównuje preloady
// z tym, co na stronie faktycznie jest. Wychwyci więc także preload dodany
// z innego miejsca niż `index.html`.
//
// Preload obrazu, którego strona nie rysuje, to nie jest drobiazg kosmetyczny:
// `fetchpriority="high"` stawia go PRZED prawdziwym obrazem LCP tej strony.
{
  const wszystkie = [];
  const zbierz = (dir) => {
    for (const wpis of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, wpis.name);
      if (wpis.isDirectory()) zbierz(p);
      else if (wpis.name.endsWith(".html")) wszystkie.push(p);
    }
  };
  zbierz(distPath);

  const winne = [];
  for (const plik of wszystkie) {
    const tresc = fs.readFileSync(plik, "utf8");
    // Preload obrazu wskazuje albo jeden plik (`href`), albo zestaw
    // (`imagesrcset`). Z zestawu bierzemy pierwszy adres: jesli ten jeden
    // jest na stronie, to caly zestaw pochodzi z tego samego `<picture>`.
    const preloady = [
      ...[...tresc.matchAll(/<link rel="preload"[^>]*as="image"[^>]*href="([^"]+)"/g)].map((m) => m[1]),
      ...[...tresc.matchAll(/<link rel="preload"[^>]*as="image"[^>]*imagesrcset="([^",\s]+)/g)].map((m) => m[1]),
    ];
    for (const obraz of new Set(preloady)) {
      // Obraz liczy się jako użyty, gdy pojawia się poza samym znacznikiem
      // preload: w `src`, w `srcset` albo w tle inline.
      const bezPreloadow = tresc.replace(/<link rel="preload"[^>]*>/g, "");
      if (!bezPreloadow.includes(obraz)) {
        winne.push(`${path.relative(distPath, plik)} preładuje ${obraz}, ale go nie pokazuje`);
      }
    }
  }

  if (winne.length) {
    console.error(`\n  ✗ Preload obrazu bez użycia na ${winne.length} stronach:`);
    for (const w of winne.slice(0, 8)) console.error(`    ${w}`);
    if (winne.length > 8) console.error(`    ...i ${winne.length - 8} więcej`);
    console.error("    Preload bierze sie z `<picture>` z fetchpriority=\"high\" na tej stronie.");
    failed++;
  } else {
    console.log(`  ✓ preloady obrazów: każdy na stronie, która go pokazuje`);
  }
}

// ------------------------------------------------------------
// Tytul i opis miesza sie w wyniku wyszukiwania
// ------------------------------------------------------------
// Google obcina tytul mniej wiecej po 60 znakach, a opis po 160. Obciety tytul
// nie jest bledem, ktory cos psuje: strona dziala, tylko w wyniku wyszukiwania
// stoi urwana w polowie zdania i traci klikniecia. Audyt z 27 sierpnia 2026
// znalazl trzynascie takich tytulow i szesc opisow.
//
// Liczymy na GOTOWYCH stronach, a nie w `seoData.js`, bo tytuly wpisow bloga,
// hasel slownika i kart produktow powstaja z danych, nie z mapy SEO.
{
  const MAX_TYTUL = 60;
  const MAX_OPIS = 160;
  // Dolna granica opisu. Bing zglosil szesc stron z opisem "za krotkim", i mial
  // racje: strony uslug niosly jako opis jedno zdanie z kafelka, po 39 znakow.
  // Opis krotszy od stu znakow wyszukiwarka zwykle wyrzuca i sklada wlasny
  // urywek strony, czesto z menu, wiec wynik przestaje mowic o czym jest strona
  // i nikt tego nie widzi po naszej stronie.
  //
  // Strony z `noindex` pomijamy, bo nie trafiaja do wynikow. Pomijamy tez karty
  // produktow: ich opisy stoja w bazie, a nie w repozytorium (`products.pull`),
  // wiec build nie ma czego poprawic i mowilby o tym przy kazdym uruchomieniu.
  const MIN_OPIS = 100;
  const zaDlugie = [];
  const zaKrotkie = [];
  // Opis urwany w pol frazy. Dlugosc miesci sie w normie, wiec ani nasza
  // bramka, ani Bing tego nie zglosza, a w wyniku wyszukiwania klient widzi
  // zdanie konczace sie wielokropkiem w przypadkowym miejscu. Dziesiec z
  // trzydziestu dwoch hasel slownika mialo tak 2 wrzesnia 2026; naprawa to
  // pole `metaOpis` w `src/data/glossary.js`, a nie dluzsze ciecie.
  const urwane = [];
  const zPanelu = [];

  const wszystkie = [];
  const zbierz = (dir) => {
    for (const wpis of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, wpis.name);
      if (wpis.isDirectory() && wpis.name !== "assets") zbierz(p);
      else if (wpis.name.endsWith(".html")) wszystkie.push(p);
    }
  };
  zbierz(distPath);

  const odkoduj = (t) => t
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    // Postac dziesietna i SZESNASTKOWA. React zapisuje apostrof jako `&#x27;`,
    // wiec bez drugiej galezi jeden znak liczyl sie za piec i opis wygladal na
    // dluzszy, niz jest naprawde.
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));

  for (const plik of wszystkie) {
    const tresc = fs.readFileSync(plik, "utf8");
    const nazwa = path.relative(distPath, plik);
    const tytul = /<title[^>]*>([\s\S]*?)<\/title>/.exec(tresc)?.[1];
    const opis = /<meta[^>]*name="description"[^>]*content="([^"]*)"/.exec(tresc)?.[1];
    if (tytul && odkoduj(tytul).length > MAX_TYTUL) {
      zaDlugie.push(`${nazwa}: tytul ${odkoduj(tytul).length} znakow`);
    }
    if (opis && odkoduj(opis).length > MAX_OPIS) {
      zaDlugie.push(`${nazwa}: opis ${odkoduj(opis).length} znakow`);
    }
    if (opis && /(\.\.\.|\u2026)\s*$/.test(odkoduj(opis))) {
      urwane.push(`${nazwa}: opis urwany wielokropkiem`);
    }
    const indeksowana = !/name="robots"[^>]*content="[^"]*noindex/.test(tresc);
    if (opis && indeksowana && odkoduj(opis).length < MIN_OPIS) {
      // `/shop/<slug>/` to karta produktu, `/shop/service/<id>/` to usluga
      // z katalogu w repozytorium, wiec ta druga podlega bramce normalnie.
      const zBazy = /^(en\/|de\/)?shop\/[^/]+\/index\.html$/.test(nazwa.split(path.sep).join("/"))
        && !nazwa.includes("service");
      (zBazy ? zPanelu : zaKrotkie).push(`${nazwa}: opis ${odkoduj(opis).length} znakow`);
    }
  }

  if (zPanelu.length) {
    console.log(`  i  karty produktow z krotkim opisem: ${zPanelu.length}, do poprawienia w panelu`);
    for (const z of zPanelu.slice(0, 5)) console.log(`     ${z}`);
  }
  if (zaKrotkie.length) {
    console.error(`\n  ✗ Opisy za krotkie, wyszukiwarka podmieni je na wlasny urywek: ${zaKrotkie.length}`);
    for (const z of zaKrotkie.slice(0, 10)) console.error(`    ${z}`);
    if (zaKrotkie.length > 10) console.error(`    ...i ${zaKrotkie.length - 10} wiecej`);
    console.error(`    Minimum: ${MIN_OPIS} znakow, celuj w 150 do 160.`);
    failed++;
  }
  if (urwane.length) {
    console.error(`\n  ✗ Opisy urwane w pol frazy: ${urwane.length}`);
    for (const z of urwane.slice(0, 10)) console.error(`    ${z}`);
    if (urwane.length > 10) console.error(`    ...i ${urwane.length - 10} wiecej`);
    console.error(`    Napisz wlasne zdanie zamiast ciac definicje: pole "metaOpis" w src/data/glossary.js.`);
    failed++;
  }
  if (zaDlugie.length) {
    console.error(`\n  ✗ Tytuly i opisy do obciecia w wyniku wyszukiwania: ${zaDlugie.length}`);
    for (const z of zaDlugie.slice(0, 10)) console.error(`    ${z}`);
    if (zaDlugie.length > 10) console.error(`    ...i ${zaDlugie.length - 10} wiecej`);
    console.error(`    Limit: tytul ${MAX_TYTUL} znakow, opis ${MAX_OPIS}.`);
    failed++;
  } else {
    console.log(`  ✓ tytuly do ${MAX_TYTUL} znakow, opisy od ${MIN_OPIS} do ${MAX_OPIS}`);
  }
}

// ------------------------------------------------------------
// Zaden odnosnik nie wyprowadza z jezyka strony
// ------------------------------------------------------------
// Kazda strona stoi pod trzema adresami, a odnosniki pisze sie bez prefiksu
// ("/studio/") i dokladaja go `Link` oraz `NavLink` z `src/i18n/nav.jsx`.
// Wszedzie tam, gdzie ktos napisal zwykle `<a href="/...">` albo zbudowal
// adres z reki, prefiks wypada, a Niemiec jednym kliknieciem laduje na polskiej
// wersji. Nic sie przy tym nie psuje w widoczny sposob: strona istnieje, tylko
// jest w innym jezyku, wiec bez tego sprawdzianu wychodzi to dopiero od klienta.
//
// Przelacznik jezyka jest jedynym miejscem, ktoremu wolno wskazac inny prefiks,
// i rozpoznajemy go po atrybucie `hreflang`.
{
  const winne = [];
  for (const lang of JEZYKI.filter((j) => j !== "pl")) {
    const katalog = path.resolve(distPath, lang);
    if (!fs.existsSync(katalog)) continue;
    const pliki = [];
    const zbierz = (dir) => {
      for (const wpis of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, wpis.name);
        if (wpis.isDirectory()) zbierz(p);
        else if (wpis.name.endsWith(".html")) pliki.push(p);
      }
    };
    zbierz(katalog);

    for (const plik of pliki) {
      const tresc = fs.readFileSync(plik, "utf8");
      for (const m of tresc.matchAll(/<a\s([^>]*)>/g)) {
        const atrybuty = m[1];
        if (/hreflang=/i.test(atrybuty)) continue;
        const href = /href="([^"]*)"/.exec(atrybuty)?.[1];
        if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
        if (new RegExp(`^/${lang}(/|$)`).test(href)) continue;
        // Pliki i zasoby nie maja wersji jezykowych.
        if (/\.[a-z0-9]{2,5}$/i.test(href)) continue;
        winne.push(`${path.relative(distPath, plik)}: ${href}`);
      }
    }
  }

  if (winne.length) {
    const rozne = [...new Set(winne)];
    console.error(`\n  ✗ Odnosniki wyprowadzajace z jezyka strony: ${rozne.length}`);
    for (const w of rozne.slice(0, 10)) console.error(`    ${w}`);
    if (rozne.length > 10) console.error(`    ...i ${rozne.length - 10} wiecej`);
    console.error("    Uzyj `Link` z `src/i18n/nav.jsx` albo `sciezkaJezyka(adres, lang)`.");
    failed++;
  } else {
    console.log("  ✓ odnosniki: kazdy zostaje w jezyku swojej strony");
  }
}

console.log(`\nPrerendered: ${success} pages, ${failed} errors`);
if (failed > 0) process.exit(1);
