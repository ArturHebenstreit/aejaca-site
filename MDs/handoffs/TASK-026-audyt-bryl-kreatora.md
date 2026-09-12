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

## Co zmierzono i CZEKA na decyzje wlasciciela

Wszystkie liczby ze srebra, tryb odlewniczy, presety domyslne. "Sciana" to dwa
rownolegle lica, "klin" to ostra krawedz.

| Miejsce | Zmierzone | Gdzie w kodzie |
|---|---|---|
| Dolna obrecz kosza centralnego | 0,28 mm wysokosci, 0,36 mm szerokosci; 6-9 mm2 scian ponizej 0,3 mm na kazdym pierscionku z korona | `buildCrown`, `outlineRail(... max(0.17, rP*0.40), max(0.28, rP*0.56))` |
| Oprawka kamienia bocznego | 0,26 mm wysokosci, 0,32-0,40 mm szerokosci | `buildSideStones`, `outlineRail(... max(0.16, rL*0.58), max(0.26, rL*0.82))` |
| Tulejka halo, platkowa | scianka 0,21 mm miedzy wlotem a zewnetrzem; platek 0,15 mm | `buildHalo`, `seatR = d/2 + max(0.26, d*0.16)`, `wallR = d/2 + max(0.20, d*0.12)` wobec wlotu `d/2 + 0.05` |
| Tulejka halo, wspolne krapy | scianka 0,08 mm; bypassFlower 28 mm2 scian ponizej 0,3 mm | `seatR = d/2 + max(0.13, d*0.07)` |
| Eternity | srodki gniazd co 1,12 d, wiec miedzy wlotami 0,12 mm przy 1,8 mm i 0,04 mm przy 1,2 mm; 35 mm2 klinow | `buildBandStones`, `krok = 2*asin(0.56 d / rMid)` |
| Kuleczki pave na ramionach | podstawa 0,30-0,40 mm, czubek 0,20-0,27 mm | `buildSideStones`, `kula = min(0.20, max(0.15, size*0.105))`, `rGora = kula*0.68` |
| Stozek gniazda centralnego | wychodzi bokami przez ramiona galerii, zostawia kliny: pave 15,7 mm2, kaseta 12,1 mm2, emerald 7,9 mm2 | `buildRing`, `seatCutter` z `maxDepthSrodka = standoff + min(0.32, thickness*0.22)` |
| Kaseta kaboszonu | rant u gory 0,28 mm, wnetrze pod lozem 76 mm2 ponizej 0,5 mm | `buildCrown`, galaz `bezel` |
| Sygnet serce | szpic tarczy jako klin 0,004 mm | `signetOutline("heart")` |

Progi warsztatowe do wyboru: srebro 925 odlewa sie pewnie od 0,5 mm scianki
i 0,6 mm drutu; zloto od 0,3-0,4 mm. Zmiana ktoregokolwiek z powyzszych
wymiarow jest widoczna na wyrobie, wiec nie zostala zrobiona bez decyzji.

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

- `src/geometry/ring/build.js`, `chat-api/geometry/build.js` (mirror)
- `src/workers/ringGenerator.worker.js`
- `src/components/calculators/RingConfigurator.jsx` (numer buildu)
- `chat-api/ringExport.js`, `chat-api/ringExport.test.mjs`, `chat-api/package.json`
- `scripts/test-ring-generator.mjs` (sekcja 46 i 50)
- `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` (dziennik, regula halo)
