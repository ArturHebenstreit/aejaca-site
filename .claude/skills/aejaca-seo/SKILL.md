---
name: aejaca-seo
description: Przeglad i naprawa warstwy SEO oraz AEO serwisu aejaca.com. Uzyj przy pracy nad hreflang i trzema wersjami jezykowymi, danymi strukturalnymi JSON-LD, mapa witryny, llms.txt, cytowalnoscia przez wyszukiwarki odpowiedzi i przy szukaniu luk tematycznych. Zawiera gotowy audyt uruchamiany na katalogu dist po buildzie.
user-invocable: true
---

# SEO i AEO na aejaca.com

Serwis stoi na trzystu osiemnastu prerenderowanych stronach: kazda tresc pod
trzema adresami, polski goly (`/studio/`), angielski pod `/en/`, niemiecki pod
`/de/`. To dwie trzecie stron w jezykach, ktorych wlasciciel nie czyta na co
dzien, i tam wlasnie siedza usterki, ktore nie zglaszaja sie same.

## Najpierw: czego NIE sprawdzaj recznie

Build juz tego pilnuje i powtarzanie tej pracy jest strata. Bramki stoja
w `npm run build`:

| Co juz jest pilnowane | Przez co |
|---|---|
| Tytul do 60 znakow, opis od 120 do 155 | `scripts/prerender.mjs`, sekcja dlugosci |
| Zaden odnosnik nie wyprowadza z jezyka strony | `scripts/prerender.mjs`, sekcja odnosnikow |
| Mapa witryny zgodna ze zrodlami (trasy, blog, slownik, sklep, uslugi) | `scripts/build-sitemap.mjs --check` |
| Kazdy napis widziany przez czlowieka idzie ze slownika | `scripts/check-nazwy-dostepne.mjs` |
| Nic zaleznego od chwili renderu, czyli zaden rozjazd hydracji | `scripts/check-czas-w-renderze.mjs` |
| Obrazy maja warianty, kafelki i hero nie sa surowym `<img>` | `check-card-images`, `check-hero-images` |
| Zaden adres nie jest sklejany z golego `SITE.url` | `scripts/check-adresy-seo.mjs` |

Jesli szukasz miejsca na nowa bramke, zacznij od pytania, czy ktoras z tych
juz nie odpowiada na to pytanie.

## Czego nikt nie pilnuje, czyli gdzie jest robota

Wszystkie bramki wyzej ogladaja JEDNA strone naraz. Usterki tej warstwy
mieszkaja w porownaniach:

- strona kontra ta sama strona w innym jezyku (wzajemnosc hreflang),
- strona kontra to, co o niej mowi mapa witryny,
- dane strukturalne kontra to, co naprawde stoi na stronie,
- `llms.txt` kontra rzeczywistosc serwisu.

Do tego sluzy audyt w tym skillu:

```
npm run build          # potrzebny gotowy dist/
npm run seo:audyt      # albo: node .claude/skills/aejaca-seo/audyt.mjs
npm run seo:audyt -- --wszystko   # pelna lista zamiast pierwszych czterdziestu
```

Audyt nie stoi w `npm run build` swiadomie: build leci na Cloudflare Pages,
juz dzis trwa dlugo, a audyt potrzebuje katalogu `dist`, wiec moglby ruszyc
dopiero po prerenderze. **Kiedy ta sama klasa bledu wraca po raz drugi,
przenosimy TEN JEDEN sprawdzian do osobnej bramki w `scripts/`** i dopisujemy
go do `npm run build`. Tak powstala wiekszosc straznikow w tym repozytorium.

Raz zdarzylo sie inaczej i warto wiedziec dlaczego. Pierwszy przebieg audytu,
2 wrzesnia 2026, znalazl jedna klase bledu na 252 stronach naraz, czyli na
calym `/en/` i calym `/de/`. Przy takiej skali czekanie na drugie wystapienie
nie mialo sensu i bramka (`scripts/check-adresy-seo.mjs`) powstala od razu,
razem z poprawka. Kryterium jest wiec nie "drugi raz", tylko "czy stac nas na
to, zeby ten blad wrocil".

## Procedura przegladu

1. `npm run build`, potem `npm run seo:audyt`.
2. Czytaj wynik **klasami, nie sztukami**. Dwiescie piecdziesiat bledow
   w tym serwisie nigdy nie jest dwiescie piecdziesiat pomylek, tylko jedna
   pomylka pomnozona przez liczbe stron.
3. Napraw u ZRODLA. Poprawka w dwudziestu plikach stron jest podejrzana:
   zwykle znaczy, ze brakuje jednego pomocnika, ktory powinien liczyc adres
   sam, jak `sciezkaJezyka` z `src/routes.js`.
4. Powtorz audyt na nowym buildzie. Zero bledow to warunek zamkniecia zadania,
   a nie ambicja.
5. Rzeczy, ktorych audyt nie mierzy (luki tematyczne, cytowalnosc, intencja
   zapytania), rob z glowa i z `aeo.md`, a wnioski zapisuj, nie zostawiaj
   w rozmowie.

## Cztery obszary i gdzie o nich czytac

- **Trzy jezyki, jeden adres kazdy**: `hreflang.md`. Wzajemnosc wskazan,
  `x-default`, prefiksy, pulapka `SITE.url` bez prefiksu jezyka.
- **Dane strukturalne**: `dane-strukturalne.md`. Ktory schemat wolno postawic
  na ktorej stronie, co Google traktuje jak spam, ktore pola sa wymagane.
- **Wyszukiwarki odpowiedzi**: `aeo.md`. `llms.txt`, cytowalnosc, format
  odpowiedzi, luki tematyczne, czego NIE robic.
- **Mapa witryny i indeksowanie**: nizej w tym pliku.

## Mapa witryny i indeksowanie

Mapa powstaje z `scripts/build-sitemap.mjs`, ze zrodel, nie z reki. Recznie
utrzymywana jest w niej jedna rzecz: zbior `POZA_MAPA`, czyli strony sesyjne
(koszyk, kasa, status zamowienia, wejscie po numerze oferty, wersja robocza
kreatora). To jedyna lista pisana reka, wiec to ona sie rozjezdza.

Dwie zasady, ktore latwo zlamac:

- **Strona z `noindex` nie ma prawa stac w mapie.** Zapraszamy wtedy
  wyszukiwarke tam, gdzie mowimy jej nie wchodzic, a Search Console zglasza to
  jako blad pokrycia. Audyt to lapie.
- **Zmiana adresu strony, ktora jest juz w indeksie, wymaga przekierowania**
  w `public/_redirects`. Bez niego tracimy caly dorobek tego adresu i zostawiamy
  w sieci martwe odnosniki. Dotyczy takze slugu wpisu blogowego i hasla slownika.

## Rzeczy, ktorych na tym serwisie nie robimy

- **Nie dopisujemy slow kluczowych do `keywords`, licząc na pozycje.** To pole
  nie wplywa na ranking od kilkunastu lat. Stoi w `seoData.js`, bo jest tanie
  i porzadkuje mysli redaktora, a nie dlatego, ze cos daje.
- **Nie stawiamy schematu opisujacego cos, czego na stronie nie ma.** To nie
  jest blad techniczny, tylko spam w oczach Google, i kara idzie na cala domene.
- **Nie mnozymy stron miejskich.** Sa dwie, `/druk-3d-piaseczno/` i
  `/druk-3d-warszawa/`, i obie maja wlasna tresc. Trzecia bez wlasnej tresci
  bylaby strona przelotowa, czyli dokladnie tym, co Google karze z nazwy.
- **Nie obiecujemy w tekscie liczb, ktorych nie pilnuje kod.** Cena, termin
  i prog darmowej wysylki maja jedno zrodlo. Powtorzone proza w `llms.txt` albo
  w opisie strony zyja wlasnym zyciem i klamia po pierwszej zmianie cennika.
- **Nie tlumaczymy adresow.** Sciezka jest jedna dla trzech jezykow
  (`/studio/`, `/en/studio/`, `/de/studio/`), bo prefiks doklada `sciezkaJezyka`.
  Niemiecki `/de/studio/` nie staje sie `/de/atelier/`.

## Zasady projektu, ktore obowiazuja takze tutaj

- Zaden dlugi myslnik (U+2014) w niczym, co piszemy, takze w komentarzach
  i w tym skillu. Pilnuje `scripts/check-emdash.mjs`.
- Polski tekst do klienta nie zgaduje plci. Nie "zapisales", tylko "zapisane".
- Waluta i linkowanie narzedzi: `PROJECT_RULES.md`.
- Zmiana tresci propaguje sie do `public/llms.txt`, `public/robots.txt`,
  `public/sitemap.xml`, `chat-api/context.js`, `src/seo/`
  i `MDs/AEJaCA_Brand_Reference.md`. Lista jest w `PROJECT_RULES.md`,
  sekcja `Config file synchronization rule`.
