---
status: accepted
owner: Artur
date: 2026-08-24
deciders: Artur
supersedes: null
related:
  - MDs/AEJaCA_Geometria_Kreatora_Zasady.md
  - MDs/handoffs/TASK-006-ring-families-halo-cathedral.md
---

# ADR-0009: Parametryczne halo i rodziny ramion

## Kontekst

Kreator mial jeden okragly obrys halo i nie rozroznial rodzin roslinnych,
zawijanych ani konstrukcji katedralnych z otwarciem. Pierwszy kamien boczny
mogl omijac korone, ale wejsc we wspornik galerii. Brak wspolnego kontraktu
parametrow grozil powstaniem osobnych, niesynchronizowanych modeli podgladu,
wyceny i eksportu.

## Decyzja

1. Halo jest zbiorem osobnych gniazd rozmieszczonych rowno po zamknietej
   prowadnicy. Dozwolone prowadnice to okrag, prostokat, kwadrat, oktagon,
   szesciokat i serce.
2. Pierwszy kamien boczny omija obrys kamienia centralnego, zakucie, halo oraz
   obwiednie wspornika galerii.
3. Liczba kamieni bocznych obejmuje 0-5 na strone, w tym 1 dla trylogii i 2
   dla ukladu pieciokamieniowego.
4. Motyw roslinny opisuje styl, gestosc i relief. Konstrukcja zawijana opisuje
   styl, objecie korony i rozstaw ramion. Elementy wyrastaja z ciaglej szyny.
5. Katedra ma trzy otwarte warianty i trzy ornamenty. Wyciecie przechodzi
   przez ramie, ale zostawia ciagly dolny most szyny.
6. Zmiana jest identyfikowana jako Build `1.003` i geometria `35`.

## Alternatywy

- Osobny model dla kazdego wzoru: odrzucony, bo rozdzielalby podglad, wycene
  i eksport oraz utrudnial testowanie kombinacji.
- Pelna plyta wycinana do ksztaltu halo: odrzucona, bo zaslania centralne i
  boczne gniazda po ukryciu kamieni.
- Przelot katedralny przez cala grubosc szyny: odrzucony, bo przerywa droge
  obciazenia pod korona.

## Konsekwencje

- klient moze konfigurowac nowe rodziny bez opuszczania wspolnego kreatora;
- liczba kamieni halo nadal wynika z dlugosci obramowania i srednicy kamienia;
- katalog zyskuje piec nowych modeli startowych;
- filigran, ostre narozniki i glebokosc ornamentow wymagaja potwierdzenia na
  wydruku oraz odlewie przed oznaczeniem wariantu jako produkcyjnie gotowy.

## Niezmienniki i testy

- kazda prowadnica halo ma co najmniej osiem osobnych, otwartych gniazd;
- pierwszy kamien boczny nie przecina wspornika galerii;
- warianty z 1 i 2 kamieniami na strone pozostaja jedna bryla metalu;
- kazdy nowy preset jest jedna bryla odlewnicza;
- otwarcie katedry zmniejsza objetosc ramienia, lecz nie rozdziela szyny.

## Synchronizacja

- `src/geometry/ring/params.js` i `src/geometry/ring/build.js`;
- mirrory geometrii w `chat-api/geometry/ring/`;
- `src/data/ringPresets.js` i `RingConfigurator.jsx`;
- worker, testy geometrii, dziennik zasad i handoff TASK-006.
