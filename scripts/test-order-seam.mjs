// ============================================================
// SZEW MIEDZY KOSZYKIEM A ZAMOWIENIEM
// ============================================================
// 2026-08-16 przyszlo oplacone BLIKiem zlecenie na znakowanie laserem, w ktorym
// byl sam plik i ani jednego zdania o tym, co z nim zrobic. Sledztwo pokazalo
// wade, ktorej nie widzial zaden sprawdzian, bo KAZDY ELEMENT Z OSOBNA DZIALAL
// POPRAWNIE:
//
//   kalkulator zbieral opis  ->  koszyk go trzymal  ->  ??? ->  serwer umial go
//   zapisac  ->  poczta zamowieniowa umiala go wydrukowac
//
// Puste miejsce w srodku to `src/pages/Checkout.jsx`: budujac cialo zadania do
// `/api/orders` przepisywal z pozycji koszyka tylko czesc pol i opis do nich nie
// nalezal. Do pracowni szlo wiec zamowienie bez opisu, zawsze, od poczatku
// istnienia koszyka.
//
// Ten sprawdzian pilnuje calego szwu, a nie jednego pola. Bierze WSZYSTKIE pola,
// ktore serwer czyta z pozycji uslugowej (`raw.cos`), i sprawdza, ze zamowienie
// je wysyla. Nowe pole dodane po stronie serwera i zapomniane w przegladarce
// odbije sie tutaj, zanim odbije sie na kliencie.
//
// Uwaga na kierunek: NIE sprawdzamy odwrotnie (pole wyslane, a nieczytane), bo
// wysylanie czegos w zapasie jest nieszkodliwe, a czytanie czegos, czego nikt
// nie wysyla, jest cicha utrata danych.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tu = path.dirname(fileURLToPath(import.meta.url));
const czytaj = (p) => readFileSync(path.resolve(tu, "..", p), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// ------------------------------------------------------------
// 1. Pola, ktore serwer czyta z pozycji uslugowej
// ------------------------------------------------------------
const server = czytaj("chat-api/server.js");

// Blok wyceny pozycji uslugowych zaczyna sie od petli po pozycjach bez
// `productSlug` i konczy na `priced.push`. Tylko tam `raw` opisuje usluge.
const start = server.indexOf('for (const raw of items.filter((i) => !i.productSlug))');
const koniec = server.indexOf("const itemsTotal", start);
if (start < 0 || koniec < 0) {
  zle("nie znalazlem w server.js petli wyceniajacej pozycje uslugowe, sprawdzian nie ma czego pilnowac");
} else {
  const blok = server.slice(start, koniec);
  const czytane = new Set([...blok.matchAll(/\braw\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]));

  // ------------------------------------------------------------
  // 2. Pola, ktore zamowienie wysyla
  // ------------------------------------------------------------
  const checkout = czytaj("src/pages/Checkout.jsx");
  const cialoStart = checkout.indexOf("items: items.map((i) =>");
  const cialoKoniec = checkout.indexOf("customer,", cialoStart);
  if (cialoStart < 0 || cialoKoniec < 0) {
    zle("nie znalazlem w Checkout.jsx mapowania pozycji na cialo zadania");
  } else {
    const cialo = checkout.slice(cialoStart, cialoKoniec);
    const wysylane = new Set([...cialo.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)].map((m) => m[1]));

    // `productSlug` odsiewa pozycje z polki i sam nigdy nie jest polem uslugi.
    czytane.delete("productSlug");

    const brakujace = [...czytane].filter((f) => !wysylane.has(f)).sort();
    if (brakujace.length) {
      zle(`serwer czyta pola, ktorych zamowienie nie wysyla: ${brakujace.join(", ")}`);
      console.error("    Kazde z nich znika po cichu miedzy koszykiem a pracownia.");
    } else {
      ok(`wszystkie ${czytane.size} pol czytanych przez serwer sa wysylane z koszyka`);
    }
  }
}

// ------------------------------------------------------------
// 3. Opis jest wymagany po OBU stronach
// ------------------------------------------------------------
// Sam formularz nie wystarczy, bo da sie go ominac, a skutkiem jest zamowienie
// oplacone i niewykonalne. Sam serwer tez nie wystarczy, bo klient dowiadywalby
// sie o braku dopiero przy platnosci.
if (!/MIN_JOB_DESCRIPTION/.test(server) || !/code: "description_required"/.test(server)) {
  zle("serwer nie odrzuca zlecenia na usluge bez opisu");
} else {
  ok("serwer odrzuca zlecenie na usluge bez opisu");
}

// ------------------------------------------------------------
// 4. Zwolnienia z wymogu opisu musza byc nieliczne i uzasadnione
// ------------------------------------------------------------
// Zwolnienie znaczy, ze zlecenie trafi do pracowni bez ani jednego zdania od
// klienta. Lista, ktora rosnie bez kontroli, po cichu cofa cala poprawke.
const zwolnienia = /const USLUGI_BEZ_OPISU = new Set\(\[([^\]]*)\]\)/.exec(server)?.[1] ?? "";
const ile = zwolnienia.split(",").map((x) => x.trim()).filter(Boolean).length;
if (ile > 2) {
  zle(`${ile} uslug zwolnionych z wymogu opisu, a to ma byc wyjatek, nie regula`);
} else {
  ok(`${ile} usluga zwolniona z opisu, kazda z powodem napisanym w kodzie`);
}

// Kreator pierscionkow MUSI byc zwolniony, inaczej sprzedaz z niego przestaje
// dzialac: RingPriceBox nie zbiera opisu, bo caly wyrob opisuja parametry.
if (!/jewelry_ring_config/.test(zwolnienia)) {
  zle("kreator pierscionkow nie jest zwolniony z opisu, wiec kazde zamowienie z niego dostanie 400");
} else {
  ok("kreator pierscionkow zwolniony, sprzedaz z niego dziala");
}

const katalog = czytaj("src/data/orderCatalog.js");
if (!/export function wymagaOpisu/.test(katalog) || !/requiresDescription !== false/.test(katalog)) {
  zle("katalog uslug nie wymaga opisu domyslnie, wiec nowa usluga wejdzie bez niego");
} else {
  ok("katalog uslug wymaga opisu domyslnie, zwolnienie trzeba napisac jawnie");
}

// Progi po obu stronach musza byc te same, inaczej formularz przepuszcza opis,
// ktory serwer odrzuci, i klient dostaje blad przy platnosci.
const progSerwera = Number(/const MIN_JOB_DESCRIPTION = (\d+)/.exec(server)?.[1]);
const progKlienta = Number(/const MIN_DESCRIPTION = (\d+)/.exec(czytaj("src/components/calculators/CalcToCart.jsx"))?.[1]);
if (!progSerwera || !progKlienta || progSerwera !== progKlienta) {
  zle(`prog dlugosci opisu rozjechal sie: serwer ${progSerwera}, przegladarka ${progKlienta}`);
} else {
  ok(`prog dlugosci opisu ten sam po obu stronach (${progSerwera} znakow)`);
}

// ------------------------------------------------------------
// 5. DRUGA DROGA DO KASY: kreator `/order/`
// ------------------------------------------------------------
// Sprawdzian powyzej pilnowal JEDNEJ drogi, koszyka, i przez to przegapil
// druga. Strona `/order/` sklada zamowienie WPROST do `/api/orders`, z pominie-
// ciem koszyka, a linkuje do niej kazda karta uslugi (`Service.jsx`). Gdy opis
// i deklaracja dostarczenia staly sie obowiazkowe, ta droga przestala dzialac
// calkowicie: serwer odbijal kazde zamowienie bledem 400, bo `Order.jsx` nie
// zbieral ani jednego, ani drugiego.
//
// Nauka jest prosta i dlatego jest tu zapisana: straznik postawiony na jednej
// sciezce nie pilnuje pozostalych. Kazda droga do `/api/orders` musi wysylac
// to, czego `/api/orders` wymaga.
{
  const order = czytaj("src/pages/Order.jsx");
  const cialoStart = order.indexOf("await postJSON(`${API}/api/orders`");
  const cialoKoniec = order.indexOf("consents,", cialoStart);
  if (cialoStart < 0 || cialoKoniec < 0) {
    zle("nie znalazlem w Order.jsx ciala zadania do /api/orders");
  } else {
    const cialo = order.slice(cialoStart, cialoKoniec);
    if (!/\bdescription\b/.test(cialo)) {
      zle("Order.jsx nie wysyla opisu zlecenia, wiec kazde zamowienie z /order/ dostanie 400");
    } else {
      ok("Order.jsx wysyla opis zlecenia");
    }
    if (!/\binbound\b/.test(cialo)) {
      zle("Order.jsx nie wysyla deklaracji dostarczenia, wiec material powierzony z /order/ dostanie 400");
    } else {
      ok("Order.jsx wysyla deklaracje dostarczenia");
    }
  }

  // Prog musi byc ten sam co na serwerze takze tutaj, inaczej formularz
  // przepusci opis, ktory kasa odrzuci.
  const progOrder = Number(/const MIN_DESCRIPTION = (\d+)/.exec(order)?.[1]);
  if (progOrder !== progSerwera) {
    zle(`prog dlugosci opisu w Order.jsx (${progOrder}) rozjechal sie z serwerem (${progSerwera})`);
  } else {
    ok(`prog dlugosci opisu w /order/ ten sam co na serwerze (${progOrder} znakow)`);
  }
}

// ------------------------------------------------------------
// 6. `getService` musi oddawac TEN SAM obiekt
// ------------------------------------------------------------
// `ServiceConfigurator` i `Order` wolaja `getService` w trakcie renderowania,
// a wynik wchodzi do zaleznosci `useCallback`, ktory buduje zapytanie o cene.
// Gdy funkcja oddaje nowy obiekt przy kazdym wywolaniu, efekt uruchamia sie
// przy kazdym renderze i konfigurator wpada w petle: zapytanie o cene, nowy
// stan, nowy render, znowu zapytanie. Co 350 ms, az do wlasnego limitu zapytan.
//
// Tak sie to skonczylo naprawde: klient widzial migotanie strony i komunikat
// "Za duzo zapytan, sprobuj za chwile". Cena i parametry byly poprawne przez
// caly czas, wiec nie mial tego jak zlapac zaden sprawdzian tresci.
{
  const { getService, SERVICES } = await import("../src/data/orderCatalog.js");
  const id = SERVICES[0]?.id;
  if (!id) {
    zle("katalog uslug jest pusty");
  } else if (getService(id) !== getService(id)) {
    zle("getService oddaje nowy obiekt przy kazdym wywolaniu, wiec konfigurator zapetli sie na wycenie");
  } else {
    ok("getService oddaje ten sam obiekt, konfigurator nie zapetla sie na wycenie");
  }
  if (getService("nie-ma-takiej") !== null) {
    zle("getService dla nieznanego identyfikatora ma oddawac null");
  } else {
    ok("nieznana usluga daje null");
  }
}

// ------------------------------------------------------------
// 7. Formaty, ktore pole OFERUJE, serwer musi PRZYJAC
// ------------------------------------------------------------
// Pole "Dolacz zdjecie lub szkic" oferowalo .jpg, .png i .webp, a serwer
// przyjmowal wylacznie SVG, DXF i PDF, bo zdjecie jechalo tym samym rodzajem
// zgloszenia co projekt do wykonania. Klient wybieral zdjecie, widzial je
// przez ulamek sekundy i patrzyl, jak znika: przegladarka pokazywala plik od
// razu, a po odpowiedzi serwera kasowala go z powrotem. W kalkulatorze bylo
// gorzej, bo tam blad byl polykany po cichu i plik po prostu nie docieral.
//
// Kazdy format, ktory pole pokazuje w oknie wyboru, ma byc przyjety. Inaczej
// zapraszamy klienta do czynnosci, ktora nie moze sie udac.
{
  const controls = czytaj("src/components/shop/ConfigControls.jsx");
  const server = czytaj("chat-api/server.js");

  const oferowane = /accept="([^"]*)"[^>]*onChange=\{onPickImage\}/.exec(controls)?.[1]
    ?? /type="file"\s+accept="([^"]*)"[^>]*onChange=\{onPickImage\}/.exec(controls)?.[1];
  const wzorzec = /const REFERENCE_EXT = \/\\\.\(([^)]*)\)\$\/i/.exec(server)?.[1];

  if (!oferowane) {
    zle("nie znalazlem listy formatow pola ze zdjeciem w ConfigControls.jsx");
  } else if (!wzorzec) {
    zle("serwer nie ma REFERENCE_EXT, wiec zdjecie jedzie na liste formatow wektorowych");
  } else {
    const przyjmowane = wzorzec.split("|");
    const brak = oferowane.split(",")
      .map((x) => x.trim().replace(/^\./, "").toLowerCase())
      .filter(Boolean)
      .filter((ext) => !przyjmowane.includes(ext));
    if (brak.length) {
      zle(`pole oferuje formaty, ktorych serwer nie przyjmuje: ${brak.join(", ")}`);
      console.error("    Klient wybierze taki plik i zobaczy, jak znika.");
    } else {
      ok(`wszystkie ${oferowane.split(",").length} formaty pola ze zdjeciem sa przyjmowane przez serwer`);
    }
  }

  // Sam wzorzec nie wystarczy: musi byc UZYTY. Stala zadeklarowana i nigdy
  // niesprawdzana wyglada w kodzie jak zabezpieczenie, a nim nie jest.
  if (!/REFERENCE_EXT\.test\(/.test(server)) {
    zle("serwer deklaruje REFERENCE_EXT, ale nigdzie go nie sprawdza");
  } else {
    ok("serwer naprawde sprawdza format zdjecia wlasnym wzorcem");
  }

  // Zdjecie i projekt to dwa rozne rodzaje zgloszenia. Gdyby przegladarka
  // wysylala jeden rodzaj dla obu, wracalaby dokladnie ta wada.
  if (!/kind", "reference"/.test(czytaj("src/components/shop/ServiceConfigurator.jsx"))) {
    zle("karta uslugi wysyla zdjecie jako projekt do wykonania");
  } else {
    ok("karta uslugi wysyla zdjecie wlasnym rodzajem zgloszenia");
  }
  if (!/"reference"/.test(czytaj("src/components/calculators/CalcToCart.jsx"))) {
    zle("kalkulator wysyla zdjecie jako projekt do wykonania");
  } else {
    ok("kalkulator wysyla zdjecie wlasnym rodzajem zgloszenia");
  }
}

// ------------------------------------------------------------
// 8. Wgranie pliku: wlasny limit, wlasny komunikat, plik zostaje
// ------------------------------------------------------------
// Model pokazywal sie w podgladzie i znikal. Podglad rysuje sie lokalnie,
// wiec pojawial sie zawsze, a znikal dopiero wtedy, gdy serwer odmowil
// przyjecia pliku, bo przegladarka kasowala wtedy caly wybor. Powod odmowy
// stal osobno, nizej, przy cenie. Klient widzial znikajacy model i nie mial
// jak polaczyc jednego z drugim.
//
// Odmowa brala sie z licznika WSPOLNEGO z wycena. Wycena odswieza sie po
// kazdym ruchu suwaka, wiec zjadala budzet, a wgranie pliku odbijalo sie od
// 429, chociaz klient wgrywal pierwszy plik w zyciu.
{
  console.log("\n8. Wgranie pliku");

  const blokUploadu = server.slice(server.indexOf('app.post("/api/uploads"'));
  const handler = blokUploadu.slice(0, blokUploadu.indexOf("app.post", 10));

  if (/checkPriceRate/.test(handler)) {
    zle("wgrywanie plikow dzieli licznik zapytan z wycena");
    console.error("    Konfigurowanie uslugi wyczerpie budzet i plik sie nie wgra.");
  } else if (!/uploadLimit\.check/.test(handler)) {
    zle("wgrywanie plikow nie ma zadnego licznika zapytan");
  } else {
    ok("wgrywanie plikow ma wlasny licznik, osobny od wyceny");
  }

  // Zalacznik i zdjecie nie maja geometrii. Bezwarunkowe siegniecie po
  // `geometry.sha256` wywalalo handler wyjatkiem przy kazdym zdjeciu.
  if (/sha256: geometry\.sha256/.test(handler)) {
    zle("wysylka na Dysk czyta geometry.sha256 bez sprawdzenia, czy geometria jest");
    console.error("    Zdjecie i rysunek nie maja geometrii, wiec dostana 500.");
  } else {
    ok("wysylka na Dysk radzi sobie z plikiem bez geometrii");
  }

  const konfig = czytaj("src/components/shop/ServiceConfigurator.jsx");
  const onPick = konfig.slice(konfig.indexOf("async function onPickFile"));
  const cialo = onPick.slice(0, onPick.indexOf("\n  function addToCart"));
  if (/if \(!resp\.ok\)[\s\S]{0,400}?resetFile\(\)/.test(cialo)) {
    zle("karta uslugi kasuje plik i podglad, gdy serwer go odrzuci");
    console.error("    To wlasnie wyglada jak znikajacy model bez powodu.");
  } else {
    ok("odrzucony plik zostaje w polu razem z podgladem");
  }
  if (!/!fileError/.test(konfig)) {
    zle("odrzucony plik nie blokuje dodania do koszyka");
  } else {
    ok("odrzucony plik blokuje dodanie do koszyka");
  }

  // Milczaca odmowa w kalkulatorze byla grozniejsza: bez tokenu cena liczyla
  // sie z wybranego rozmiaru, wiec przestawala dotyczyc wgranego modelu,
  // a nic tego nie pokazywalo.
  const calc = czytaj("src/components/calculators/CalcToCart.jsx");
  if (!/setModelError\(/.test(calc) || !/!modelError/.test(calc)) {
    zle("kalkulator polyka odmowe przyjecia modelu");
  } else {
    ok("kalkulator pokazuje odmowe przyjecia modelu i wstrzymuje zakup");
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nSzew koszyk-zamowienie: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
