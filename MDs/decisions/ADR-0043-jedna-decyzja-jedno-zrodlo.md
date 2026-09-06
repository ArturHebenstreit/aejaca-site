---
status: draft
owner: Artur
date: 2026-09-06
deciders: Artur
supersedes: null
related:
  - chat-api/server.js
  - chat-api/quotes.js
  - src/components/calculators/CalcToCart.jsx
  - src/components/shop/ServiceConfigurator.jsx
  - scripts/test-order-seam.mjs
  - scripts/check-parametry-sql.mjs
---

# ADR-0043: Jedna decyzja ma jedno źródło danych

## Problem

6 września 2026 klientka nie mogła zapłacić dwiema drogami naraz, a każda
przewracała się z innego powodu. Obie mają wspólny kształt: jedna decyzja
czytała dwa różne źródła i nikt tego nie widział, bo każdy element z osobna
działał poprawnie.

### Koszyk odmawiał modelu, który sam zmierzył

Klientka wgrała cztery modele, kalkulator je zmierzył i wycenił, a kasa trzy
razy odbiła zamówienie zdaniem „wgraj model albo podaj wymiary". Opisała to
dokładnie: „w koszyku w ostatnim kroku wyglądało tak, jakby strona ich nie
widziała, ale sam konstruktor je widzi i może policzyć zamówienie".

W tej samej pętli `POST /api/orders` cena szła z geometrii wyjętej z bazy spod
żetonu pliku, a sprawdzian podstawy kwoty wiążącej z geometrii przysłanej przez
przeglądarkę. Kalkulator w sTuDiO nie wkładał geometrii do pozycji koszyka, bo
plik i tak leży u nas. Konfigurator sklepowy wkładał. Ta sama pozycja
przechodziła więc albo odbijała się od kasy zależnie od tego, którą drogą
klient przyszedł.

### Zapłata z oferty kończyła się pięćsetką

Każda próba zapłaty z oferty wracała jako `500`. Serwer zapisał powód wprost:
`column "amount_eur_cents" is of type integer but expression is of type text`.
W jednym `INSERT` ten sam parametr stał dwa razy: raz goły przy kolumnie, raz
z rzutowaniem w warunku niżej. Sterownik wysyła parametry bez typu, więc typ
ustala serwer z kontekstu, a nierozstrzygnięty parametr schodzi do `text`.
Rzutowanie w drugim miejscu tego nie cofa.

## Decyzja

**Jedna decyzja czyta jedno źródło.** Jeśli cena wychodzi z geometrii z bazy, to
podstawa kwoty wiążącej wychodzi z tej samej geometrii, a nie z kopii
w przeglądarce. Jeśli parametr ma typ, to ma go w KAŻDYM swoim wystąpieniu,
razem z tym przy kolumnie.

Z tego wynikają trzy rzeczy, które już stoją w repozytorium.

1. **Sprawdzian podstawy dostaje `itemGeometry`**, czyli dokładnie to, z czego
   policzyła się cena. Pozycja wyceniona z pomiaru nie może zostać odrzucona za
   brak pomiaru.
2. **Pozycja z plikiem niesie geometrię obiema drogami.** Kalkulator i
   konfigurator wkładają ją tak samo, także przy modelach z paczki. Żeton pliku
   wystarczy serwerowi, ale pozycja niosąca oba przeżyje też wygaśnięcie pliku.
3. **Odmowa zostawia ślad w logu.** Trzy czterysetki nie zostawiły ani jednej
   linijki, więc powód trzeba było odgadywać z maila od klientki. Piękset krzyczy
   sam, odmowa ze zdaniem dla klienta wychodziła cicho.

## Czego pilnujemy

- `scripts/test-order-seam.mjs`, sekcja 12: sprawdzian podstawy nie może czytać
  `raw.geometry`, a każde dodanie pozycji z żetonem pliku musi nieść geometrię.
  Ta bramka złapała przy pierwszym uruchomieniu drugie miejsce, o którym nikt
  nie wiedział: modele z paczki w konfiguratorze sklepowym.
- `scripts/check-parametry-sql.mjs`: parametr użyty raz z rzutowaniem, a raz
  goły, zatrzymuje build.

## Czego to nie znaczy

Nie znaczy, że przeglądarka przestaje przysyłać dane. Przysyła je nadal, bo bez
nich nie da się nic pokazać przed wysłaniem zamówienia. Znaczy tylko, że o tym,
czy wolno wystawić kwotę wiążącą, rozstrzyga to samo, z czego ta kwota wyszła.

## Koszt

Pozycje leżące już w koszykach klientów nie mają geometrii i nie da się jej tam
dopisać. Ratuje je punkt 1: serwer bierze geometrię spod żetonu pliku, więc
stary koszyk przechodzi bez żadnej akcji ze strony klienta.
