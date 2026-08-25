---
status: accepted
owner: Artur
date: 2026-08-24
deciders: Artur
supersedes: null
related:
  - MDs/AEJaCA_Geometria_Kreatora_Zasady.md
  - src/geometry/ring/
  - scripts/test-ring-generator.mjs
---

# ADR-0006: Kanon gniazd i minimalnego zakucia

## Kontekst

Po wdrozeniu otwartych koszy pozostaly trzy klasy wad. Ranty kaset i elementy
halo zaslanialy zbyt duza czesc kamienia. Podniesione gniazda nie zawsze mialy
kieszen na kolete w gornej czesci szyny. Krapy i kuleczki drobnicy nie skalowaly
sie wystarczajaco z rozmiarem kamienia, przez co przy malych kamieniach metal
stawal sie dominujacym elementem widoku.

## Decyzja

1. Zamknieta kaseta zachodzi promieniowo na kamien tylko 0,05-0,08 mm. Stan
   odlewniczy zachowuje pelny wlot montazowy.
2. Centralne i podniesione boczne gniazda moga wejsc w gorna czesc szyny, ale
   zawsze pozostawiaja co najmniej 0,55 mm ciaglego metalu od strony palca.
3. Boczne krapy skaluja promien z kamieniem w przedziale 0,24-0,34 mm.
4. Kuleczki pave maja promien 0,15-0,20 mm i po zakuciu pochylaja sie tylko na
   tyle, ile potrzeba do chwytu rondysty.
5. Platkowe halo ma zewnetrzna kieszen montazowa i wewnetrzna wspolna
   kuleczke. Wariant wspolnych krap zachowuje osobna geometrie.
6. Krapy kamienia centralnego w pierscionku halo maja minimalny promien
   0,44 mm, aby byly mocniejsze od zakuc drobnicy.
7. Markiza w lekkim koszu nie dostaje poprzecznego preta bez funkcji nosnej.

## Konsekwencje

- Kamienie sa bardziej odkryte, a zakucie pozostaje policzalne i ciagle.
- Kazda nowa rodzina gniazd wymaga jednoczesnego testu wlotu, kieszeni pod
  kolete, paska szyny od strony palca oraz zakrycia kamienia po zakuciu.
- Zmiana wymaga ponownej synchronizacji geometrii serwera i podbicia wersji
  workera.

## Wymagane kontrole

- kaseta otwarta i zakuta dla kamienia fasetowanego oraz kaboszonu;
- otwor w gornej czesci szyny i ciagly pasek 0,55 mm od strony palca;
- skrajne rozmiary krap w trylogii i drobnicy pave;
- oba warianty halo, z kamieniami i bez kamieni;
- zewnetrzna kieszen platka i brak poprzeczki markizy;
- test geometrii, test wyceny, synchronizacja mirrorow i pelny build.
