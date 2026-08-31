---
status: accepted
owner: Artur
date: 2026-08-27
deciders: Artur
supersedes: null
related:
  - src/components/GoogleReviews.jsx
  - src/components/Footer.jsx
  - src/data/countryNames.js
  - scripts/check-czas-w-renderze.mjs
  - scripts/check-kraje.mjs
  - scripts/prerender.mjs
---

# ADR-0022: Widok nie zalezy od chwili ogladania ani od wersji ICU

## Kontekst

Sto stron tego serwisu jest rysowanych przy buildzie i wysylanych gotowe.
React laczy sie z tym HTML-em w przegladarce i porownuje go z tym, co sam by
narysowal. Cokolwiek sie rozjedzie, wyrzuca gotowa strone do kosza i rysuje ja
od nowa na urzadzeniu klienta. Awaria jest cicha: strona dziala, roboty
wyszukiwarek widza tresc, a prerender przestaje sluzyc ludziom.

Przeglad wszystkich stu stron w przegladarce (27 sierpnia 2026) znalazl piec
stron, ktore odrzucaly prerender: strona glowna, `/jewelry/`, `/studio/`,
`/checkout/` i jeden wpis na blogu. Przyczyny byly trzy i wszystkie tego samego
rodzaju: cos bylo liczone inaczej w chwili budowania niz w chwili ogladania.

1. **Data wzgledna w opiniach Google.** "4 tyg. temu" liczone z `Date.now()`.
   Komponent stoi na stronie glownej i obu stronach marek, czyli 3 z 5.
2. **Lista krajow w kasie.** `Intl.DisplayNames` w Node mowilo "SRA Hongkong
   (Chiny)", a w przegladarce "Hongkong". Jedna litera dalej w alfabecie
   przestawiala cala liste sortowana przez `localeCompare`. Kasa to ostatni
   ekran przed zaplata i najgorsze mozliwe miejsce na taka strate.
3. **Kolumna cen pisana dolarami we wpisie na blogu.** Prerender wklejal
   wyrenderowany HTML przez `String.replace` z napisem po prawej stronie, a ten
   czyta w nim wzorce: `$$` znaczy "jeden dolar". Tabela z "$$" i "$$$$$"
   wychodzila o polowe krotsza niz w przegladarce.

Osobno, jeszcze niewybuchly: rok w stopce liczony z `new Date().getFullYear()`.
Po Nowym Roku, do pierwszego wdrozenia, rozjechalby wszystkie sto stron naraz.

## Decyzja

**Zadna wartosc zalezna od chwili ogladania nie trafia wprost do widoku.**

- Data opinii to miesiac i rok wziete z daty opinii ("sierpien 2026"), nazwy
  miesiecy wpisane w trzech jezykach. Pelna date niesie atrybut `dateTime`.
  Przy okazji jest to informacja uczciwsza: "4 tyg. temu" starzeje sie w ciszy.
- Rok w stopce to stala `ROK_COPYRIGHT`.

**Zadna nazwa ani kolejnosc nie pochodzi z ICU w chwili rysowania.** Nazwy 71
krajow wysylki i ich kolejnosc alfabetyczna w trzech jezykach stoja gotowe w
`src/data/countryNames.js`. Trzy strony (kasa, zamowienie, oferta) budowaly te
liste osobno; teraz czytaja jedna.

**Prerender podstawia tresc funkcja, nie napisem**, wiec zaden znak w tresci
nie jest juz czytany jako wzorzec.

Pilnuja tego dwie bramki w buildzie:

- `scripts/check-czas-w-renderze.mjs` szuka `Date.now()` i `new Date()` w
  klamrach JSX wstawiajacych wartosc do drzewa, i sprawdza, czy rok w stopce
  zgadza sie z biezacym. W styczniu build padnie, dopoki ktos nie poprawi
  jednej liczby, i to jest zamierzone.
- `scripts/check-kraje.mjs` pilnuje, zeby lista nazw pokrywala sie ze strefami
  wysylki i zostala alfabetyczna.

Do diagnozy sluzy `npm run build:hydracja`: ten sam build, ale Reactem w wersji
rozwojowej, wiec w konsoli stoi pelne zdanie z nazwa komponentu zamiast numeru
bledu. Obie przyczyny znalazly sie w kilka minut zamiast w kilka godzin.

## Konsekwencje

Po zmianie wszystkie sto stron hydruje sie czysto. Prerender sluzy ludziom, a
nie tylko robotom.

Kosztem jest utrzymanie dwoch list wpisanych recznie: nazw miesiecy i nazw
krajow. Obie zmieniaja sie raz na nigdy, a druga ma bramke.
