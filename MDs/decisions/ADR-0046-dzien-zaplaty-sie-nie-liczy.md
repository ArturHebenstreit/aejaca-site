---
status: draft
owner: Artur
date: 2026-09-07
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0027-termin-realizacji-i-przypomnienia.md
  - MDs/decisions/ADR-0022-nic-zaleznego-od-chwili-w-renderze.md
  - chat-api/productionQueue.js
  - chat-api/orderMail.js
  - src/pricing/terminy.js
  - src/pages/OrderStatus.jsx
  - scripts/test-production-queue.mjs
---

# ADR-0046: Dzien zaplaty sie nie liczy, a data terminu to dzien gotowosci

## Kontekst

ADR-0027 dal zleceniu termin: liczbe dni przy zamowieniu i date, na ktora
umawiamy sie z klientem. Nie powiedzial przy tym dwoch rzeczy, a obie zmieniaja
wynik o caly dzien pracy.

Pierwsza: czy dzien zaplaty sie liczy. Zgloszenie wlasciciela z 7 wrzesnia
2026: zamowienie oplacone o 18:45, termin trzy dni, w mailu "planowana
finalizacja 10.09.2026". Zdanie czyta sie na dwa sposoby. Jesli dzien wplaty
sie liczy, na prace zostaja 8 i 9 wrzesnia, czyli dwa dni. Jesli sie nie
liczy, zostaja 8, 9 i 10 wrzesnia, czyli trzy. Kod robil to drugie, ale nie
mowil tego nigdzie, wiec pracownia liczyla po swojemu, a klient po swojemu.

Druga: co obiecuje sama data. Dzien, w ktorym rzecz jest gotowa, czy dzien,
w ktorym paczka wychodzi. Roznica to znowu jeden dzien pracy.

Przy okazji wyszedl blad, ktorego nikt nie mial szansy zglosic, bo data
wygladala poprawnie. Termin liczyl sie z chwili zaplaty powiekszonej o `dni`
razy dwadziescia cztery godziny, a data brala sie z kalendarza UTC. Zaplata
miedzy polnoca a druga w nocy czasu polskiego wypada w UTC jeszcze
poprzedniego dnia, wiec klient placacy o 00:30 dostawal ten sam termin co ten,
ktory zaplacil poprzedniego wieczorem. Znikal caly dzien pracy, bez zadnego
sladu na ekranie. Ta sama pomylka co przy `ValidityTime` dla Autopay
(ADR-0044).

## Decyzja

### 1. Dzien zaplaty sie nie liczy

Liczymy PELNE dni kalendarzowe, zaczynajac od dnia NASTEPNEGO po starcie
zegara. Wplata 7 wrzesnia o 18:45 przy terminie trzech dni znaczy 8, 9 i 10
wrzesnia. Godzina zaplaty nie ma znaczenia: zaplata o 8 rano i o 23 wieczorem
daja ten sam termin, bo dlugosc pierwszego dnia nie moze zalezec od tego, kiedy
klient nacisnal przycisk.

### 2. Data terminu to DZIEN GOTOWOSCI

Data mowi, kiedy rzecz jest zrobiona. Paczka wychodzi tego dnia albo
nastepnego i ma wlasny stempel `shipped_at`. Odrzucone: liczenie daty jako dnia
wysylki, co wymagaloby doliczania jednego dnia do kazdego terminu i wydluzalo
obietnice dla klienta przy kazdym zamowieniu.

### 3. Kalendarz jest polski, nie UTC

`terminRealizacji` bierze date kalendarzowa chwili startu w strefie
`Europe/Warsaw` i dodaje do niej dni. Zaczepieniem jest poludnie UTC, bo
dodawanie dni do polnocy potrafi wpasc w zmiane czasu i cofnac sie o godzine,
czyli o caly dzien daty.

### 4. Mowimy to wprost, przy dacie

Regula bez zdania obok daty jest regula tylko dla nas. Zdanie "3 dni liczone od
08.09.2026: dzien wplaty sie nie liczy, liczymy pelne dni od nastepnego" stoi
w czterech miejscach: przy szacunku w koszyku i w ofercie (przed zaplata),
w mailu o postepie zlecenia, na stronie zamowienia i w mailu do pracowni.
Pracownia widzi te sama arytmetyke co klient, bo rozjazd miedzy nimi jest
dokladnie tym, co zglosil wlasciciel.

## Konsekwencje

- Termin nie skraca sie juz przy zaplacie w nocy.
- Klient czyta sposob liczenia, zamiast go zgadywac z dwoch dat.
- `pierwszyDzienPracy` to `terminRealizacji(start, 1)`, a nie druga arytmetyka
  obok: jedna regula na kalendarz.
- Dni pozostaja KALENDARZOWE. Dni robocze odrzucone ponownie, tak jak
  w ADR-0027: wymagaja kalendarza swiat, ktorego nie mamy, a weekend w srodku
  terminu wydluzylby obietnice dla klienta.

## Odrzucone

- **Data jako dzien wysylki.** Uczciwa wobec tego, co klient widzi na paczce,
  ale kosztuje jeden dzien obietnicy przy kazdym zamowieniu.
- **Dni robocze.** Patrz wyzej i ADR-0027.
- **Poprawienie samego napisu w mailu.** Napis nie byl bledem; bledem bylo to,
  ze regula nie istniala nigdzie zapisana, a kalendarz byl UTC.
