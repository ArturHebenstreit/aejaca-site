---
status: accepted
owner: Artur
date: 2026-09-14
deciders: Artur
supersedes: null
related:
  - src/pricing/jewelryScope.js
  - src/pricing/bindingBasis.js
  - src/pricing/jewelry.js
  - src/pricing/jewelryConfig.js
  - src/pricing/weightEngine.js
  - src/data/orderCatalog.js
  - src/data/describeParams.js
  - chat-api/orders.js
---

# ADR-0049: bizuteria na zamowienie obiecuje cene dopiero z pelna wiedza

## Zdarzenie

13 wrzesnia 2026 przyszlo zapytanie z Niemiec. Wisiorek z kamieniem, wlasny
render klienta w zalaczniku, prosba o kamien, ktory ma wygladac
"ursprünglicher und nicht zu fest funkeln", czyli o kaboszon albo rozetke
zamiast szlifu brylantowego. W tresci zapytania trzy oprawy i dwa wykonczenia
powierzchni na jednej bryle.

Kalkulator podal 684 do 901 EUR za sztuke. Wlasciciel wycenil te robote na
1100 do 1450 EUR. Roznica nie brala sie z jednego bledu, tylko z czterech
rzeczy naraz, z ktorych zadna nie miala gdzie wejsc do formularza.

## Problem

**1. Nie pytalismy, czyj to jest projekt.** `bindingBasis.js` dzieli oferte
wedlug tego, kto decyduje o ksztalcie: nasz katalog daje cene wiazaca, ksztalt
przyniesiony przez klienta daje szacunek. Ta regula jest napisana w naglowku
tego pliku od poczatku. Bizuteria na zamowienie stala mimo to po stronie
katalogu, bo nie miala pola, w ktorym klient moze powiedziec "to moj rysunek".
Render klienta wyceniał się wiec jak wyrob z naszej listy.

**2. Nie pytalismy, co jest w wyrobie.** Pytanie o "zlozonosc ksztaltu"
miescilo azur i filigran w jednym slowie "zlozony", a o trzeciej oprawie i
o drugim wykonczeniu powierzchni nie mowilo nic. Klient zaznaczal "prosty"
w najlepszej wierze.

**3. Masa byla stala z katalogu, a nie wymiarem.** `calcNew` liczylo kruszec
z `baseWeight * mul`: wisiorek zawsze 4 g, niezaleznie od tego, czy ma 15 czy
45 mm. Wisiorek 30 x 20 x 4 mm w srebrze wazy okolo 14 g. Kalkulator umial to
policzyc i pokazywal te liczbe na ekranie, ale do koszyka jechaly same
parametry katalogowe, wiec ZAMOWIENIE wyceniala stala, a EKRAN geometria. Ta
sama pozycja miala dwie ceny i tansza z nich byla ta wiazaca.

**4. Szlif kamienia nie istnial jako pole.** Prosby klienta nie dalo sie
zapisac, a kaboszon wymaga innej oprawy niz kamien fasetowany.

Do tego rzecz, ktorej w zapytaniu nie widac: **bramka stala wylacznie
w przegladarce**. Kalkulator, karta uslugi w sklepie i koszyk mialy kazde
wlasna liste warunkow, a serwer nie mial zadnej. `bindingBasis` oddawalo dla
`jewelry_new` bezwarunkowe `binding: true`, wiec zamowienie zlozone
z pominieciem formularza przechodzilo przez kase w calosci.

## Decyzja

**1. Kwota wiazaca wymaga trzech odpowiedzi.** Czyj to projekt, co jest
w wyrobie, jakie ma wymiary. Brak ktorejkolwiek daje SZACUNEK z widelkami
i droge do czlowieka. Nowy modul `src/pricing/jewelryScope.js` jest jedynym
miejscem, w ktorym ta regula jest zapisana, i jedzie do `chat-api/` razem
z cenami, wiec przegladarka wygasza przycisk z tego samego powodu, dla ktorego
kasa odmawia.

**2. Pytanie o projekt nie ma wartosci domyslnej.** Podstawione "nasz katalog"
znaczyloby przyjecie za klienta zalozenia, ktore w jego przypadku bywa
nieprawdziwe, i to przy parametrze rozstrzygajacym o tym, czy wolno nam
obiecac cene. Ta sama zasada co przy kruszcu odlewu (decyzja 2026-09-10)
i przy stanie pliku (ADR-0048).

**3. Pytanie o zawartosc wyrobu jest lista do zaznaczenia, z pozycja "nic
z ponizszych".** Cztery pozycje prowadza do czlowieka: azur lub filigran,
wiecej niz dwie oprawy, dwa wykonczenia powierzchni, elementy ruchome. Piata,
"nic z ponizszych", istnieje po to, zeby ODPOWIEDZ PUSTA dala sie odroznic od
BRAKU ODPOWIEDZI: bez niej klient, ktory pominie to pytanie, wygladalby tak
samo jak klient zamawiajacy rzecz prosta.

Pole `complexityId` znika z karty bizuterii. Zostaje przy projekcie CAD, gdzie
jest progiem cenowym, a nie bramka. Dwa pola na jeden stan to dokladnie to,
przed czym ostrzega `PROJECT_RULES.md`.

**4. Masa wyrobu idzie z wymiarow, ale NIGDY nie schodzi ponizej stalej
katalogowej.** Bierzemy wieksza z dwoch liczb. Powod jest jednostronny:
wspolczynniki wypelnienia w katalogu bryl opisuja wyroby azurowe i wezone
(obraczka "standard" to 0,78 objetosci pierscienia), wiec dla obraczki LITEJ
zanizaja mase o kilkanascie procent. Przy zlocie kilkanascie procent masy to
kilkaset zlotych na sztuce, a kwote wiazaca trzeba dotrzymac. Kalkulator
pokazuje teraz na karcie wymiarow te sama mase, po ktorej liczy cene.

**5. Wymiary sa czescia zamowienia, a nie stanem karty.** Kazdy wymiar ma swoj
klucz w parametrach (`wymWidth`, `wymWallThickness`, ...), ten sam w obu
drogach: kalkulator rysuje je wlasna karta z tabelami rozmiarow, karta uslugi
w sklepie polami liczbowymi, ale skladaja identyczna pozycje. Lista pytan idzie
z katalogu bryl (`jewelryProductConfig.js`), a nie z drugiego spisu.

**6. Wymiar poza zakresem katalogu bryl to nie jest wyrob z katalogu.**
Wisiorek o wysokosci 200 mm przy gornej granicy 100 mm nie dostaje ceny
z automatu. Kazdy z tych zakresow stoi w katalogu bryl od dawna i sluzyl
dotad tylko suwakom.

**7. Szlif kamienia jest osobnym polem** z wlasnym wplywem na cene kamienia
i na koszt osadzenia. Mnozniki przyjeto jako punkt wyjscia z praktyki
rynkowej, nie z naszego pomiaru, i sa tak opisane w kodzie.

**8. Masa nie przychodzi z przegladarki.** `priceItem` kasuje
`overrideWeightG` z parametrow zapytania. To pole sluzy odlewowi z pliku
klienta, gdzie mase liczy serwer z bryly; przepuszczone z zapytania bylo droga
do zamowienia zlota po masie podanej przez zamawiajacego.

## Skutki

- Szybka wycena bizuterii (`SimpleJewelryCalc`) przestaje prowadzic do koszyka
  przy nowym wyrobie. Pyta o piec rzeczy i zadna z nich nie mowi, jaki ten
  wyrob ma byc duzy. Zostaje szacunek i przejscie do pelnego kalkulatora albo
  do zapytania, czyli ta sama droga, ktora do tej pory dostawal wyrob
  z kamieniem. Od 15 wrzesnia 2026 to przejscie NIESIE ODPOWIEDZI (przycisk
  pod kwota, `src/data/przekazanieTrybu.js`): klient dopowiada same wymiary,
  a nie caly formularz od nowa. Bez tego odebranie koszyka szybkiej wycenie
  byloby samym odjeciem, bo droga obok zaczynala sie od pustej strony.
- Karta uslugi w sklepie ma osiem nowych pol liczbowych, z ktorych naraz widac
  najwyzej piec: kazde pokazuje sie tylko przy tej bryle, ktora je ma.
- Wycena wisiorka z wymiarami rosnie, bo dotad liczyla 4 g kruszcu zamiast
  czternastu. To nie jest podwyzka, tylko koniec liczenia ceny z liczby, ktorej
  nikt nie podal.
- Wycena obraczki nie zmienia sie wcale: geometria wychodzi lzejsza od stalej
  katalogowej, a bierzemy wieksza.

## Czego NIE zrobiono

- **Wspolczynniki wypelnienia zostaja bez zmian.** Dla pierscionka, obraczki
  i sygnetu liczymy juz bryle pierscienia, a nie prostopadloscian opisujacy
  wyrob, wiec wspolczynnik ponizej 1,0 odejmuje mase drugi raz. Poprawienie
  ich na 1,0 podnioslo by ceny pierscionkow o okolo 28 procent, a to jest
  decyzja cenowa wlasciciela, nie poprawka. Do czasu jej podjecia chroni nas
  regula "wieksza z dwoch".
- **Robocizna nadal nie reaguje na zawartosc wyrobu.** Trzy oprawy i dwa
  wykonczenia kieruja pozycje do czlowieka, ale nie podnosza kwoty
  szacunkowej. Wycena takiej roboty z automatu wymagalaby stawek, ktorych
  nie mamy zmierzonych.
- **Nie ruszono kalkulatora lancuchow ani napraw i renowacji.** Tam cena
  wynika z czynnosci albo ze splotu, a nie z gabarytu.
