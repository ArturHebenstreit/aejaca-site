---
status: draft
owner: Artur
date: 2026-09-04
deciders: Artur
supersedes: null
related:
  - src/index.css
  - src/components/calculators/calcShared.jsx
  - src/components/StudioCalculator.jsx
  - scripts/check-kafelki-jasnosc.mjs
  - .claude/skills/aejaca-ux/pomiar/kafelki.mjs
---

# ADR-0039: Stan kafelka jest jedną umową, a nie klasą w każdym komponencie

## Problem

„Kafelek wybrany i ten pod myszką są ciemne" wracało od właściciela **sześć
razy**. Za każdym razem poprawka była prawdziwa i za każdym razem
niewystarczająca, bo trafiała w jedną rodzinę kafelków. Rodzin jest
kilkanaście: `Chips`, `MaterialCards`, `HeroCards`, `TileGroup`, `Seg`, licznik
sztuk, wybór wielokrotny, karty opisowe, konfigurator obrączki, ustawienia
wydruku, kafelki w `JewelryCalc`, `SimpleJewelryCalc`, `SimpleStudioCalc`
i `StudioCalculator`. Każda malowała stan własnym zestawem klas Tailwinda.

Pomiar prawdziwych pikseli (2026-09-04) nazwał obie usterki liczbami:

| Motyw | Co zmierzono | Wynik |
|---|---|---|
| ciemny | kafelek wybrany | 0,0146 jasności względnej |
| ciemny | najazd myszką na wygaszony | zmiana **0,0000** |
| jasny | kafelek wybrany | 0,777 przy wygaszonych 0,938 |
| jasny | najazd na wybrany | **-0,13**, czyli ciemniał |

Czyli: zaznaczenie w motywie jasnym było ciemniejsze od reszty siatki,
a najazd myszką nie zmieniał tła w ogóle, bo ruszała się wyłącznie obwódka.

Dwie przyczyny, obie ciche.

**Warstwa światła była kopiowana, nie współdzielona.** Znacznik kafelka ze
zdjęciem stoi w pięciu plikach, bo powstawał przez kopiowanie. Warstwę
`tile-lift` miał jeden z nich. Co gorsza renderowała się **tylko przy
zaznaczonym** kafelku, więc reguła najazdu nie miała na czym zadziałać: kafelek
niewybrany pod myszką zmieniał obwódkę i nic więcej.

**Odcień zaznaczenia w motywie jasnym był ciemniejszy od kartki.**
`bg-amber-400/10` nadpisywaliśmy w motywie jasnym na `rgba(180,83,9,0.08)`,
czyli rozwodniony brąz. W kodzie wygląda to tak samo dobrze jak odcień jasny.
Na ekranie daje plamę ciemniejszą od sąsiadów.

## Decyzja

**Stan kafelka opisuje `src/index.css`, po kształcie klas, a nie każdy
komponent z osobna.**

Zaznaczenie poznajemy po parze „pełna obwódka akcentu + tło akcentu" na
`button`. Ramka informacyjna ma obwódkę ułamkową (`border-amber-400/30`) i jest
`div`-em, więc pod tę regułę nie wpada. Różnica idzie **dwoma kanałami naraz**:
bielą, która podnosi kafelek z czerni, i kolorem akcentu, który mówi, który to
dział. Sam akcent nie wystarcza, bo błękit ma niską jasność własną: 26 procent
`blue-400` na czerni daje 0,033, czyli tyle co zwykły najazd.

W motywie jasnym bieli dołożyć się nie da, bo kafelek jest już prawie biały.
Zaznaczenie niesie więc **jasny stopień palety** (`amber-100`, `blue-100`), a
najazd **rozrzedza** ten odcień zamiast go zagęszczać: mniej krycia znaczy
więcej bieli spod spodu, czyli najazd jaśnieje.

Warstwa światła na kafelku ze zdjęciem (`tile-lift`) **stoi zawsze**, a nie
tylko pod zaznaczonym. W spoczynku jest przezroczysta, pod myszką dostaje
światło, po wyborze więcej światła.

## Konsekwencje

Zmierzone po zmianie, tym samym narzędziem:

| Motyw | Stan | Przed | Po |
|---|---|---|---|
| ciemny | wybrany, płaski kafelek | 0,0146 | 0,068 do 0,095 |
| ciemny | najazd na wygaszony | 0,0000 | +0,022 do +0,085 |
| jasny | wybrany, płaski kafelek | 0,777 | 0,805 do 0,827 |
| jasny | najazd na wybrany | -0,131 | +0,024 do +0,043 |

Żadna różnica nie jest już ujemna: nic nie ciemnieje pod kursorem.

W motywie jasnym zaznaczenie zostaje **odrobinę** poniżej wygaszonych
(0,83 wobec 0,89) i tak ma być: biały kafelek nie da się rozjaśnić ponad biel,
więc zaznaczenie niesie tam odcień, pełną obwódkę `#b45309` i pierścień, a nie
przewagę jasności.

Cena tej zmiany: reguła celuje w **kształt klas**, nie w komponent. Kafelek
napisany bez pary „pełna obwódka + tło akcentu" wypadnie z niej po cichu.
Dlatego dokładamy bramkę.

## Bramka, bo bez niej to wróci po raz siódmy

`scripts/check-kafelki-jasnosc.mjs` stoi w `npm run build` i pilnuje trzech
rzeczy:

1. Plik, który wygasza zdjęcia (`tile-dim`), musi też dokładać światło
   (`tile-lift`), a warstwa nie może być renderowana warunkowo przy `active`.
2. Cztery stany warstwy światła istnieją i **rosną**: spoczynek, najazd,
   wybrany, wybrany pod myszką.
3. Odcienie zaznaczenia w motywie jasnym, złożone z podkładem, mają jasność
   względną co najmniej 0,80, a najazd nigdy nie jest ciemniejszy od spoczynku.

Punkt trzeci liczy jasność, a nie porównuje nazwy kolorów. Nazwa nie mówi nic:
`amber-100` i `amber-700` różnią się w kodzie jedną cyfrą.

Pomiar, którym to sprawdzamy na żywo, leży w `.claude/skills/aejaca-ux/pomiar/kafelki.mjs`
(`npm run ux:kafelki`). Mierzy **piksele ze zrzutu**, bo Tailwind v4 wypisuje
kolory jako `oklch()`, którego `canvas.fillStyle` po cichu nie przyjmuje: każde
czytanie koloru z CSS kłamie.

## Czego ta decyzja NIE rozstrzyga

Znacznik kafelka ze zdjęciem nadal stoi w pięciu plikach zamiast w jednym
komponencie. Bramka pilnuje, żeby każda kopia niosła warstwę światła, ale nie
usuwa samego powielenia. Scalenie tych pięciu miejsc do `HeroCards`
i `MaterialCards` to osobna robota, z własnym ryzykiem, i należy do decyzji
o wspólnej warstwie kalkulatorów, a nie do tej.
