# Trzy jezyki, trzy adresy, jedna tresc

Do 27 sierpnia 2026 wszystkie trzy jezyki dzielily jeden adres i `hreflang`
bylby wtedy nie tylko bezuzyteczny, ale wprost bledny. Od tej daty kazda strona
stoi pod trzema adresami i cala ta warstwa zaczela cokolwiek znaczyc.
Decyzja: ADR-0023.

```
/studio/        polski, goly adres, bo to on jest w indeksie od poczatku
/en/studio/     angielski
/de/studio/     niemiecki
```

Prefiks doklada **wylacznie** `sciezkaJezyka(sciezka, lang)` z `src/routes.js`.
Nigdzie indziej nie sklejamy adresu z reki.

## Co musi byc prawda na kazdej stronie

1. **Kanoniczny wskazuje na siebie.** Niemiecka strona ma kanoniczny
   `https://www.aejaca.com/de/studio/`. Kanoniczny wskazujacy gdzie indziej
   oddaje calą wartosc strony tamtej stronie, po cichu.
2. **Cztery wskazania `alternate`**: `pl`, `en`, `de` i `x-default`. Kazda
   strona wymienia takze SIEBIE. Zestaw bez samowskazania Google ignoruje
   w calosci.
3. **Wskazania sa wzajemne.** Jesli `/de/studio/` mowi, ze angielska wersja
   stoi pod `/en/studio/`, to `/en/studio/` musi wskazac z powrotem na
   `/de/studio/`. Wskazanie jednostronne nie jest bledem skladniowym, nic sie
   przez nie nie psuje i nie zglasza sie nigdzie poza Search Console, wiec
   potrafi stac miesiacami.
4. **`x-default` wskazuje wersje polska**, bo to ona stoi pod golym adresem.
5. **`<html lang>` i `og:locale` zgadzaja sie z prefiksem.** Strona pod `/de/`
   z `lang="pl"` trafia do wynikow polskich, a czytnik ekranu czyta niemiecki
   tekst polska wymowa.

Wszystkie piec sprawdza `audyt.mjs`.

## Kody bez regionu, i to jest decyzja

W `SITE.hreflang` stoi `pl`, `en`, `de`, a nie `pl-PL`, `en-US`, `de-DE`.
Swiadomie: wysylamy do calej Unii i dalej, a `de-DE` powiedzialoby wyszukiwarce,
ze wersja niemiecka jest dla Niemiec, nie dla Austrii i Szwajcarii. Nie
"poprawiaj" tego na kody z regionem.

`og:locale` to osobna sprawa i tam regiony SA (`pl_PL`, `en_US`, `de_DE`), bo
tego formatu wymaga Open Graph. Dwa rozne pola, dwie rozne zasady, i to nie
jest niespojnosc.

## Pulapka: `SITE.url` bez prefiksu jezyka

`SITE.url` to `https://www.aejaca.com`, czyli goly adres, czyli adres POLSKI.
Kazde miejsce, ktore sklada adres jako `` `${SITE.url}/about/` ``, produkuje
adres polski takze na stronie niemieckiej. W `SEOHead` jest to zrobione
dobrze, bo prefiks doklada sie tam raz, dla kanonicznego i dla wszystkich
`alternate`.

Poza `SEOHead` juz nie. Strony licza sobie `pageUrl` wlasnorecznie i wkladaja
go do danych strukturalnych, i wtedy niemiecka strona niesie schemat mowiacy
"ta strona to `https://www.aejaca.com/about/`", czyli wskazuje na polska.
Pierwszy przebieg audytu, 2 wrzesnia 2026, znalazl 252 takie strony: caly `/en/`
i caly `/de/`. Zaden build tego nie widzial przez tydzien.

Poprawka poszla u zrodla: `src/seo/seoData.js` daje dwa pomocniki i strona
nie sklada adresu sama.

```js
adresStrony("/about/", lang)   // strona, dostaje prefiks jezyka
adresZasobu("/og-about.jpg")   // plik, prefiksu NIE dostaje, obraz jest jeden
```

Pilnuje tego `scripts/check-adresy-seo.mjs`: poza `src/seo/` `SITE.url` nie ma
prawa sie pojawic, a `adresStrony` bez drugiego argumentu jest bledem, bo
domyslnym jezykiem jest polski, czyli wracamy dokladnie tam, skad wyszlismy.

Ta sama pulapka dotyczy `item` w okruszkach, `url` w `Service` i `Product`,
`mainEntityOfPage` w `Article` oraz kazdego adresu wpisanego do `llms.txt`.
Wyjatkiem sa `Organization` i `LocalBusiness`: opisuja FIRME, a firma jest
jedna dla trzech jezykow, wiec jej adres zostaje goly.

## Czego hreflang NIE zalatwia

- **Nie zastepuje tlumaczenia.** Trzy adresy z ta sama polska trescia to trzy
  duplikaty, a nie trzy wersje jezykowe.
- **Nie kieruje ruchem.** Wyszukiwarka wybiera wersje sama, na podstawie
  jezyka zapytania i lokalizacji. Nie ma tu przekierowania po `Accept-Language`
  i nie chcemy go: przekierowanie po naglowku odbiera odwiedzajacemu wybor
  i myli robota.
- **Nie dziala na strony wykluczone.** Strona z `noindex` moze miec komplet
  wskazan i nadal nie istnieje dla wyszukiwarki.
