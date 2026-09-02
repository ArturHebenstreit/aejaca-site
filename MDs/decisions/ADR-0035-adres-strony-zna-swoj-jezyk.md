---
status: draft
owner: Artur
date: 2026-09-02
deciders: Artur
supersedes: null
related:
  - src/seo/seoData.js
  - src/routes.js
  - scripts/check-adresy-seo.mjs
  - .claude/skills/aejaca-seo/SKILL.md
---

# ADR-0035: Adres strony zna swoj jezyk, a plik go nie potrzebuje

## Kontekst

Od 27 sierpnia 2026 (ADR-0023) kazda strona stoi pod trzema adresami: polskim
golym (`/about/`), angielskim `/en/about/` i niemieckim `/de/about/`. Prefiks
doklada `sciezkaJezyka` z `src/routes.js`.

`SITE.url` z `src/seo/seoData.js` to goly adres serwisu, czyli adres POLSKI.
W `SEOHead` bylo to od poczatku obsluzone dobrze, bo prefiks doklada sie tam
raz, dla kanonicznego i dla wszystkich wskazan `alternate`. Poza `SEOHead` juz
nie: trzydziesci stron liczylo sobie `pageUrl` wlasnorecznie, jako
`` `${SITE.url}/about/` ``, i wkladalo ten adres do danych strukturalnych.

Skutek: niemiecka strona niosla schemat `WebPage` mowiacy "ta strona to
https://www.aejaca.com/about/", czyli wskazujacy na polska. To samo dotyczylo
`mainEntityOfPage` we wpisach blogowych, `url` w `Service`, `Product`
i `DefinedTerm` oraz kazdego okruszka.

**Pierwszy przebieg audytu SEO, 2 wrzesnia 2026, znalazl 252 takie strony:
caly `/en/` i caly `/de/`.** Nic sie przy tym nie psulo. Build byl zielony,
prerender wypisywal 318 stron i zero bledow, przeglad stron nie mial czego
zobaczyc, bo JSON-LD nie ma reprezentacji wizualnej. Dwie trzecie serwisu przez
tydzien zaprzeczalo w danych strukturalnych wlasnemu adresowi kanonicznemu.

## Decyzja

**Poza `src/seo/` zaden plik nie tyka `SITE.url`.** Adres pelny powstaje
z jednego z dwoch pomocnikow w `src/seo/seoData.js`:

```js
adresStrony("/about/", lang)   // strona, dostaje prefiks jezyka
adresZasobu("/og-about.jpg")   // plik, prefiksu NIE dostaje
```

Podzial idzie po tym, czy rzecz ma wersje jezykowa. Strona ma trzy, wiec adres
musi wiedziec, o ktora chodzi. Obraz, logo i dokument sa jedne dla trzech
jezykow, wiec ich adres zostaje goly.

Wyjatkiem merytorycznym sa schematy opisujace FIRME, a nie strone:
`Organization`, `LocalBusiness` i `publisher` w srodku innego schematu. Firma
jest jedna, wiec jej adres tez, i te miejsca uzywaja `adresZasobu("/")`
z komentarzem, dlaczego swiadomie nie maja prefiksu.

## Alternatywy

- **Zostawic sklejanie z reki i pilnowac w przegladzie kodu**: odrzucone, bo
  wlasnie tak powstalo 252 wystapien. Blad jest niewidoczny w przegladzie,
  poniewaz roznica miedzy dobrym a zlym adresem to obecnosc dwoch znakow
  w miejscu, ktorego nikt nie czyta.
- **Jeden pomocnik zamiast dwoch, z rozpoznawaniem pliku po rozszerzeniu**:
  odrzucone. Rozpoznawanie po rozszerzeniu jest zgadywaniem i myli sie na
  adresach z parametrem. Autor wie, czy wskazuje strone, czy plik, i ma to
  powiedziec nazwa funkcji.
- **Liczyc adres w `SEOHead` i przekazywac go stronom w dol**: odrzucone,
  bo dane strukturalne powstaja PRZED `SEOHead` i sa do niego przekazywane,
  wiec kolejnosc jest odwrotna niz potrzebna.

## Konsekwencje

- Angielskie i niemieckie strony przestaja mowic wyszukiwarce, ze sa polskie.
- Nowa strona nie moze popelnic tego bledu, bo bramka nie wpusci `SITE.url`.
- Koszt: kazde nowe miejsce liczace adres musi miec `lang` w zasiegu. Trzy
  strony narzedziowe liczyly adres na poziomie modulu i trzeba bylo przeniesc
  to liczenie do komponentu.

## Niezmienniki i testy

- `SITE.url` wystepuje wylacznie w `src/seo/`. Pilnuje
  `scripts/check-adresy-seo.mjs`, w `npm run build`.
- `adresStrony` wywolane bez drugiego argumentu jest bledem, bo domyslnym
  jezykiem jest polski, czyli wracamy dokladnie tam, skad wyszlismy. Ta sama
  bramka.
- Kontrola negatywna: `npm run seo:audyt` na gotowym `dist` zglasza kazde pole
  `url`, `@id` i `mainEntityOfPage`, ktore wskazuje na inny jezyk niz strona,
  z wylaczeniem schematow opisujacych firme.

## Synchronizacja

- `src/seo/seoData.js`: pomocniki `adresStrony` i `adresZasobu`.
- `scripts/check-adresy-seo.mjs`: bramka, wpieta w `npm run build`.
- `.claude/skills/aejaca-seo/`: skill SEO i AEO razem z audytem `audyt.mjs`.
- `CLAUDE.md`: lista skilli projektu i lista rzeczy, ktorych pilnuje build.
