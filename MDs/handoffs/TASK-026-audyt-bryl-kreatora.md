---
task_id: TASK-026
status: review
author: Claude Code
branch: claude/serwis-development-skills-3vuba9
base_commit: ac2546e
last_commit: uzupelnione po pushu
updated: 2026-09-12
---

# Handoff: audyt poprawnosci bryl kreatora pierscionkow

## Cel

Sprawdzic, czy bryly, ktore kreator oddaje w pliku odlewniczym, sa poprawne
warsztatowo: czy wejda na palec, czy kamien siedzi, czy metal ma grubosc,
ktora da sie odlac, czy plik otwiera sie w slicerze bez bledow. Poprzedni
audyt (TASK-025) dotyczyl strony i API, nie geometrii.

## Metoda

Sprawdziany `scripts/test-ring-generator.mjs` (49 sekcji) przechodzily, wiec
pomiar musial byc niezalezny od nich. Harness w katalogu roboczym sesji
(nie w repozytorium; opis tutaj wystarcza, zeby go odtworzyc) zbudowal 25
presetow w trybie `casting`, 96 segmentow, i policzyl na kazdym:

| Pomiar | Jak | Po co |
|---|---|---|
| Otwor na palec | plastry `slice(z)` co 0,1 mm, najmniejsza odleglosc metalu od osi | czy pierscionek wejdzie |
| Grubosc scianki | z kazdego trojkata promien do srodka bryly, do pierwszego WYJSCIA; rownoleglosc lica wyjscia rozdziela sciane od klina | czy odlew wypelni |
| Symetria | bryla przecieta ze swoim lustrem w X i w Z, ubytek objetosci | czy wieniec i ramiona sa rowne |
| Pasowanie kamieni | kazdy kamien z `referenceAssembly` przylozony do metalu z `casting`: na miejscu, 0,25 mm nizej, 0,6 mm wyzej | siada, nie wypada, wchodzi z gory |
| Kamien a palec | najmniejszy promien wierzcholkow kamienia wobec `innerDia / 2` | kamien nie wchodzi w otwor |
| Pary kamieni | przeciecie kazdej pary (do 40 kamieni) | kamienie nie zachodza na siebie |
| STL | zapis przez `toSTL`, sparsowany: krawedzie parami, objetosc z dywergencji, trojkaty zerowe | plik zamkniety i zgodny z bryla |
| Mapa grubosci | trojkaty pokolorowane wedlug grubosci, zrzuty z 8 ujec przez Playwright i Chromium z `/opt/pw-browsers` | zobaczyc, GDZIE jest cienko |

Wniosek metodyczny: plaster 2D z `offset` klamie na stycznych przekrojach
zaokraglonego profilu (3,4 mm3 falszywych cech na soliterze). Promien nie.

## Co bylo dobrze (25 presetow)

- Srednica wewnetrzna 17,191 wobec 17,200 mm na kazdym presecie; roznica to
  dyskretyzacja 96 segmentow. Pinky 15,592 wobec 15,6.
- Zaden kamien nie wchodzi w otwor na palec (najblizej: eternity, 0,81 mm nad
  srednica wewnetrzna).
- Zadna para kamieni nie zachodzi na siebie.
- Kazdy kamien siada (opor po zejsciu 0,4-5,3 % objetosci) i wchodzi z gory
  (0,00 % kolizji); na miejscu najwyzej 1,3 % (halo, podciecie).
- STL: zero otwartych krawedzi, objetosc zgodna z bryla do 0,005 mm3.
- Jedna czesc na model, genus zgodny z liczba otworow.
- Obraczka i siedem sygnetow: ani jednej scianki ponizej 1,1 mm.
- Kanal wlewowy: promien 1,6 mm, czyli srednica 3,2 mm, zgodnie z regula
  "ponizej 3 mm krzepnie".

## Co bylo zle i zostalo poprawione

### 1. Wieniec halo nieparzysty i przekrzywiony

`n = floor(obwod / (d * 1,06))` dawal dowolna liczbe, a probkowanie ruszalo
z pierwszego punktu obrysu. Diana: 19 kamieni, 5,48 % objetosci metalu bez
odbicia lewo-prawo przy 0,00 % przod-tyl. Z gory wieniec mial kamien z jednej
strony i przerwe z drugiej. Poprawka w `buildHalo`: liczba parzysta,
probkowanie od punktu, w ktorym obrys przecina os -Y (`arcAtMinusY`).
Po poprawce Diana: 18 kamieni, 0,00 % w obu osiach. Sprawdzian 50 mierzy piec
ukladow z progiem 0,5 %.

### 2. Pliki z trojkatami o zerowym polu i zdublowanymi wierzcholkami

Jadro oddaje wspolrzedne w float32 i po cieciach zostawia pary punktow blizej
siebie niz rozdzielczosc pliku. Zmierzone w STL: Diana 1724 trojkatow
zerowych, eternity 1176, halo 1148, pave 424, soliter z szescioma lapkami 8.
Walidator slicera zglasza to jako blad siatki, choc bryla jest zamknieta.
Poprawka: `siatkaDoZapisu` w `chat-api/ringExport.js` lepi wierzcholki w
granicy 0,1 mikrometra i wyrzuca zerowe trojkaty, dla STL i dla 3MF. Test
`chat-api/ringExport.test.mjs` z kontrola negatywna (siatka z podstawionym
duplikatem), w lancuchu `npm test`.

### 3. Wersje

`WORKER_VERSION` 36, `RING_CONFIGURATOR_BUILD` 1.004, `npm run sync:pricing`
wykonane, mirror `chat-api/geometry` zgodny.

## Decyzja wlasciciela i trzecia grupa poprawek

Formularz 2026-09-12: **minimum dla srebra 925, sciana 0,45 mm i drut 0,5 mm;
kliny pod koszem zamyka kolnierz.** Zmierzone przed (mm2 scian cienszych niz
0,3 mm, tryb odlewniczy) i po:

| Miejsce | Przed | Po | Co zrobiono |
|---|---|---|---|
| Dolna obrecz kosza | 0,28 x 0,36 mm, 6-9 mm2 na kazdym pierscionku z korona | 0 | drut 0,5 x 0,5 mm (`buildCrown`, `outlineRail`) |
| Oprawka boczna | 0,26 x 0,32 mm | 0 | drut 0,5 x 0,5 mm (`buildSideStones`) |
| Tulejki halo | 0,21 mm (platkowe), 0,08 mm (wspolne krapy); halo 25,7, bypassFlower 27,8 | 0 (zebra 0,19-0,20 mm miedzy wlotami sasiadow, celowo) | scianka 0,45 mm od wlotu; kamyki w grupach miedzy krapami, rozstaw `max(1,06 d, d + 0,30)`, przerwa na krape wlot + promien nogi + 0,10; drut 0,5 mm pod tulejkami i mostki 0,5 mm pod krapami do zeber kosza; kuleczki odsuniete od czubka (wgryzienie 0,10 mm); blad zamiast cichego powrotu, gdy kamyk nie miesci sie miedzy krapami (bypassFlower: cztery krapy) |
| Stozek gniazda przez ramiona galerii | kliny 12-16 mm2 | kliny 6-11 mm2, sciany 0 | `buildCollar`: scianka 0,45 mm prostopadle do stozka, ramiona galerii koncza sie na kolnierzu |
| Kaboszon | rant 0,28, dno 0,04 mm klin | rant 0,27 (celowo), reszta 0 | kolnierz do loza z dnem 0,45 mm pod frezem; bryly frezu zachodza o 0,05 mm wezsza w szersza, bo blona na styku zamykala pecherz -21,7 mm3 |
| Zakucia w stanie gotowym | krapy eternity 1,3 mm nie siegaly rondysty, kuleczki pave 0,325 przykrywaly 0,73 % kamienia | chwyt 0,15-5 % | pochylenie polowek liczone do 0,08 mm za rondysta; zakuta kuleczka 0,8 promienia z zachodzeniem 0,12 mm; prog pokrycia dla pave 1,10 jak przy halo (kolnierz obejmuje korone do zanurzenia) |
| Szynka obok gniazda w szynie (pave, diana, bypassPave) | 0,19 mm | 0 | kolnierz wokol wlotu, ramie z pave ma plaski wierzch; preset pave szyna 2,5 mm |
| Mostek miedzy gniazdami | 0,26 mm ramiona, 0,04-0,12 mm eternity | 0,45 mm | `sideStoneLayout`, `buildBandStones` |
| Kuleczki pave | podstawa 0,30-0,40 mm, czubek 0,20-0,27 | podstawa 0,65, czubek 0,52 mm | wgryzienie 0,10 mm w kazdy wlot, inaczej skorka 0,19 mm |
| Szpic tarczy sygnetu serce | klin 0,004 mm, 1,7 mm2 | bez zmian | zostawiony, ostrze do dopilowania; nie jest w sprawdzianie 51 |

Masa presetow po zmianach rosnie o 3-12 % (soliter 1,29 -> 1,37 g, halo
1,55 -> 1,74 g, diana 2,21 -> 2,44 g); cena idzie za masa. Wieniec halo ma
teraz w presecie halo 12 kamykow zamiast 16 (po trzy w kazdym luku miedzy
krapami), Diana 12 zamiast 19, bypassFlower 8. Kazdy z 25 presetow jest jedna
bryla w trybie odlewniczym i gotowym, takze z ukladem wlewowym.

Sprawdzian 51 (`test-ring-generator.mjs`) mierzy grubosc promieniem na 12
presetach i wymaga mniej niz 0,3 mm2 scian cienszych niz 0,25 mm (0,17 mm
dla halo, gdzie zebro 0,20 mm miedzy wlotami jest krawedzia miedzy dwoma
otworami, nie wolna sciana); przed poprawkami dawal 6-28 mm2. Sprawdziany
30, 43 i 45 dostaly sondy zgodne z nowa geometria (kamien pod sonda, prog
pokrycia, sonda w wylocie zamiast w kolnierzu).

## Jak odtworzyc pomiar

1. `node scripts/test-ring-generator.mjs` (sekcja 50 to symetria halo).
2. `cd chat-api && node ringExport.test.mjs`.
3. Harness grubosci: zbudowac preset w trybie `casting`, z `getMesh()` wziac
   trojkaty, z kazdego srodka ciezkosci poprowadzic promien wzdluz odwroconej
   normalnej, siatka komorkowa 1 mm, Moller-Trumbore, liczyc tylko trafienia
   w lica o normalnej zgodnej z promieniem (wyjscie). Pole trojkatow z
   odlegloscia ponizej progu to powierzchnia cienka. Rownoleglosc lica
   wyjscia powyzej 0,82 rozdziela sciane od klina.

## Pliki

- `src/geometry/ring/build.js`, `src/geometry/ring/params.js`, `src/data/ringPresets.js`, mirror `chat-api/geometry/`
- `src/workers/ringGenerator.worker.js`
- `src/components/calculators/RingConfigurator.jsx` (numer buildu)
- `chat-api/ringExport.js`, `chat-api/ringExport.test.mjs`, `chat-api/package.json`
- `scripts/test-ring-generator.mjs` (sekcje 30, 45, 46, 50, 51)
- `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` (dziennik, regula halo)
