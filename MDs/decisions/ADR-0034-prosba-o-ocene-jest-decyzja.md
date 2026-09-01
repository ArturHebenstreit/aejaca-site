---
status: draft
owner: Artur
date: 2026-09-01
deciders: Artur
supersedes: null
related:
  - chat-api/server.js
  - chat-api/orderMail.js
  - admin/views/queue.ejs
  - scripts/orders-schema.sql
---

# ADR-0034: Prosba o ocene jest decyzja przy odbiorze, a nie automatem

## Kontekst

Trzy dni po potwierdzeniu odbioru wychodzi podziekowanie z prosba o opinie
w Google i na Trustpilocie. Przeglad wieczorny bral do tego KAZDE zamowienie
zamkniete odbiorem, bez pytania.

W pierwszym tygodniu dzialania okazalo sie, ze **czesc klientow wystawia opinie
sama, z wlasnej woli, i robi to szybciej niz nasze trzy dni**. Trustpilot
1 wrzesnia 2026: cztery opinie, z czego trzy w ostatnich dwunastu miesiacach,
wszystkie napisane bez zadnego przypomnienia.

Prosba wyslana takiej osobie nie jest uprzejmoscia. Jest dopominaniem sie
o cos, co juz dostalismy, i czyta sie jako dowod, ze nie zauwazylismy jej
gestu. Przy czterech opiniach kazda z nich wazy tyle, ze nie warto ryzykowac
ani jednej.

## Decyzja

**Prosba o ocene ma znacznik i wychodzi tylko wtedy, gdy jest zaznaczony.**
Kolumna `orders.review_ask`, domyslnie `TRUE`, bo przy wiekszosci zamowien
prosic warto i tak bylo do tej pory. Przeglad wieczorny pomija zamowienia
z wylaczonym znacznikiem.

**Znacznik stoi przy przycisku "Odebrano"**, czyli w chwili, w ktorej i tak
zamykamy sprawe. Domyslnie zaznaczony: brak decyzji ma znaczyc to, co dzialo
sie dotad.

**Decyzje da sie zmienic az do wyslania**, osobnym przelacznikiem przy
zamowieniu odebranym. To nie jest ozdoba: decyzja przy odbiorze zapada, ZANIM
wiadomo, czy klient wystawi opinie sam, a robi to zwykle wlasnie w tych trzech
dniach. Bez mozliwosci zmiany znacznik przy odbiorze bylby zgadywaniem.

**Po wyslaniu nie ma czego przestawiac** i panel mowi to wprost: pokazuje date
wyslania zamiast przelacznika, a trasa API odmawia. Przelacznik, ktory po
kliknieciu nic nie zmienia, jest gorszy od jego braku.

## Alternatywy i powody odrzucenia

- **Zostawic automat i liczyc na to, ze nikt sie nie obrazi.** Najtansze.
  Odrzucone: przy czterech opiniach jedna zniechecona osoba to widoczna czesc
  dorobku, a szkody nie widac w zadnej liczbie, bo nikt nie pisze "przestancie
  mi przypominac", tylko po prostu nie wraca.
- **Sprawdzac przed wyslaniem, czy klient juz wystawil opinie.** Rozwiazanie
  wlasciwe co do intencji i niewykonalne co do faktow: Google i Trustpilot nie
  daja API laczacego opinie z zamowieniem, a dopasowanie po nazwisku bylo by
  zgadywaniem na cudzych danych. Znacznik stawiany reka jest jedyna wiedza,
  ktora naprawde mamy.
- **Pytac dopiero przy trzecim dniu, osobnym przypomnieniem dla nas.** Jedno
  powiadomienie wiecej dla wlasciciela i jedna decyzja do podjecia w oderwaniu
  od zamowienia. Znacznik przy odbiorze plus mozliwosc zmiany daje to samo,
  bez dodatkowego strumienia zadan.
- **Domyslnie NIE prosic.** Odwrocenie ciezaru: prosba wychodzilaby tylko po
  swiadomym kliknieciu. Odrzucone, bo wiekszosc klientow opinii sama nie
  wystawia, a zapomniane klikniecie kosztuje opinie, ktorej nikt nie napisze.

## Konsekwencje

- **Zamowienia sprzed tej zmiany maja znacznik zaznaczony**, bo taka jest
  wartosc domyslna kolumny. Nic sie dla nich nie zmienia.
- **Pojawia sie decyzja do podjecia przy kazdym odbiorze.** Kosztuje jedno
  spojrzenie, bo pole jest juz zaznaczone i wystarczy go nie ruszac.
- **Wylaczenie prosby nie zostawia sladu w mailu do klienta**: on nigdy sie nie
  dowie, ze mial ja dostac. Tak ma byc.

## Niezmienniki i testy

- Przeglad wieczorny pomija zamowienia z wylaczonym znacznikiem.
  Test: `scripts/test-production-queue.mjs`.
- Znacznik przychodzi z formularza odbioru i nie rusza innych etapow.
  Test: jak wyzej.
- Decyzje da sie zmienic do wyslania, a po wyslaniu trasa odmawia i panel
  pokazuje date. Test: jak wyzej.

## Synchronizacja

- `scripts/orders-schema.sql`: kolumna `review_ask` razem z powodem.
