---
status: draft
owner: Artur
date: 2026-09-13
deciders: Artur
supersedes: null
related:
  - src/data/castingSpec.js
  - src/pricing/castingIntake.js
  - src/pricing/preciousMetalCasting.js
  - src/analysis/printability.js
  - src/data/orderCatalog.js
  - chat-api/orders.js
---

# ADR-0048: model klienta do odlewu deklaruje swoj stan

## Problem

Usluga `precious_metal_casting` przyjmuje plik klienta od 7 wrzesnia 2026, ale
pytala go wylacznie o kruszec, wykonczenie i liczbe sztuk. O samym modelu nie
pytala o nic. Trzy rzeczy przechodzily wiec przez kase niezauwazone:

1. **Skurcz policzony dwa razy.** Klient, ktory zna rzemioslo, skaluje model
   sam. My skalujemy drugi raz. Obraczka wychodzi o dwa do czterech rozmiarow
   za duza, a kosztem jest kruszec, kolba i doba pieca. Serwis ma wlasne
   narzedzie do kompensacji skurczu pod `/toolstudio/shrinkage/`, wiec czesc
   klientow robi to, do czego sami ich zachecamy.
2. **Otwor bez naddatku.** Otwor obraczki szlifuje sie po odlaniu, bo
   powierzchnia odlewu jest za szorstka na skore, a szlif otwor POWIEKSZA.
   Model z otworem w wymiarze gotowym daje wyrob o pol rozmiaru za duzy.
3. **Sciana, ktora sie nie wypelni.** Serwer liczyl z pliku objetosc, gabaryt
   i pole powierzchni. Szczelnosci, liczby bryl ani grubosci nie liczyl nikt.
   Analiza drukowalnosci istniala, ale tylko w przegladarce i tylko dla druku.

## Sprzecznosc w zleceniu

Brief wlasciciela (`MDs/AEJaCA_Brief_Odlew_z_pliku_klienta.md`, punkt 1) mowi:
klient dostarcza model 1:1, bez zadnych kompensacji. Polecenie z tego samego
dnia mowi: klient uwzglednia skurcz, a my potwierdzamy, ze to zrobil. Oba
zdania naraz nie moga byc prawdziwe.

Formularz 2026-09-13 rozstrzygnal to trzecim wariantem: **pytamy o stan pliku**.

## Decyzja

**1. Klient deklaruje stan pliku, nie mnoznik.** Pole `modelStanId` ma dwie
odpowiedzi (`finished`, `compensated`) i nie ma wartosci domyslnej. Przy
odpowiedzi `compensated` klient wskazuje STOP, dla ktorego skalowal, a nie
liczbe. Mnoznik bierzemy ze swojej tabeli, wiec literowka w polu tekstowym nie
ma jak wejsc do wyrobu.

**2. Ruszamy plik roznica, nie pelnym skurczem.** Korekta to iloraz
`skurcz(zamowiony) / skurcz(zadeklarowany)`. Przy zgodnym stopie wychodzi
dokladnie 1,0000 i plik idzie do druku nietkniety. To jest cala obrona przed
podwojna kompensacja i pilnuje jej osobny sprawdzian.

**3. Skurcz i gestosc zostaja w `castingAlloys.js`.** Brief chcial nowej tabeli
`SHRINKAGE` w nowym module. Byloby to drugie miejsce na te same liczby, a z
tej tabeli korzysta juz generator pierscionkow i wycena masy. Nowy modul
`castingSpec.js` niesie WYLACZNIE to, czego nie bylo: naddatki, minimalne
grubosci, kategorie wyrobu, stany pliku i rachunek wymiaru.

**4. Rozbieznosc otworu zatrzymuje zamowienie.** Gdy otwor zmierzony w pliku
rozni sie od podanego rozmiaru o wiecej niz 0,2 mm, zamowienie sie nie sklada.
Roztoczenie otworu zabiera grubosc szyny, wiec nie jest to poprawka, ktora
wolno zrobic bez rozmowy. Prog 0,2 mm to tolerancja procesu z regulaminu 13.

**5. Geometria liczy sie na serwerze i przy WGRYWANIU.** Bajty pliku sa w
calosci tylko w tym jednym momencie: zaraz potem ida na Dysk, a w bazie zostaje
sam wiersz z geometria. Szczelnosc, liczba bryl, najciensza scianka i srednica
otworu doliczaja sie wiec do `geometryFromFile`, a nie do wyceny.

**6. Minimum sciany to 0,45 mm, nie 0,8 mm.** Brief podawal 0,8 mm jako
granice wypelnienia. Wlasny generator pierscionkow odlewa u nas sciane 0,45 mm
i drut 0,5 mm w srebrze 925 (decyzja z 12 wrzesnia 2026). Dwie liczby na to
samo zjawisko nie moga stac obok siebie, wiec `min` bierze wartosc z wlasnej
praktyki, a liczba z briefu stoi jako `pewne`: ponizej niej odlewamy bez
obietnicy pelnego odwzorowania. Roznica miedzy tymi progami nie jest sporem o
fizyke, tylko o to, czyja jest geometria: wlasny model prowadzimy wlewem tam,
gdzie trzeba, w cudzym tego nie ruszamy.

## Czego NIE zrobiono i dlaczego

- **Gabaryt z briefu (60 x 60 mm) odrzucony.** Obowiazuje Ø63 x 62 mm, czyli
  koperta przyjeta przez wlasciciela 7 wrzesnia 2026 po odlaniu kluczy 59 mm.
  Kolba jest walcem, wiec liczy sie przekatna podstawy, a nie kazda os osobno.
- **Gestosci z briefu odrzucone.** Au 585 ma w briefie 13,10, a w wycenie
  13,07, i to po tej drugiej licza sie dzisiejsze zamowienia. Brief nie zna
  tez srebra 800, ktore sklep sprzedaje.
- **Platyny i palladu nie ma czego odrzucac.** Nigdy nie byly na liscie
  kruszcow. Blokada zostala napisana mimo to, bo lista kruszcow bywa
  rozszerzana, a tabela skurczu nie musi nadazyc w tym samym commicie.
- **Pytanie o kamienie nie powstalo.** Brief chcial przenosic pozycje z
  kamieniami na wycene indywidualna. Ta droga juz istnieje jako wariant
  "pomysl klienta", wiec dolozenie drugiego wejscia do tego samego miejsca
  wymaga najpierw decyzji, ktore z nich jest glowne.

## Skutki

- Pozycja odlewu z pliku ma szesc nowych pytan, z czego trzy sa obowiazkowe.
  Sciezka bez pliku (wzorzec powierzony, pomysl klienta) nie zmienia sie wcale.
- Wgranie pliku trwa dluzej o pomiar: okolo 0,3 s przy 30 tysiacach trojkatow.
  Powyzej 250 tysiecy trojkatow pomiar grubosci i otworu jest pomijany, a
  bramka mowi wprost, ze go nie bylo.
- Analiza siatki stala sie wspolna dla przegladarki i serwera, wiec
  `src/analysis/printability.js` jedzie odtad do `chat-api/` razem z cenami.
