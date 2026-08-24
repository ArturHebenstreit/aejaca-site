---
status: accepted
owner: Artur
date: 2026-08-24
deciders: Artur
supersedes: MDs/decisions/ADR-0007-przelotowe-gniazda-i-sygnet.md
related:
  - MDs/AEJaCA_Geometria_Kreatora_Zasady.md
  - MDs/handoffs/TASK-005-ring-ux-signet-refinement.md
---

# ADR-0008: Ciagla szyna pod korona i jednolite krapy

## Kontekst

Przelotowe gniazda centralne i podniesione gniazda boczne usuwaly szara
zaslepke, ale przecinaly szynę pod korona. Oddzielne segmenty nogi i gornej
czesci krapy mogly po odjeciu frezu pozostac polaczone tylko punktowo albo
rozlaczyc sie na przegieciu. Taka geometria wygladala poprawnie z jednego
kierunku, lecz nie dawala ciaglej drogi obciazenia podczas zakuwania.

## Decyzja

1. Szyna pozostaje ciagla pod kazda korona oraz pod kazdym kamieniem bocznym
   osadzonym w koszu ponad szyna.
2. Centralne gniazdo jest otwarta od gory, slepa kieszenia. Frez moze wejsc
   najwyzej 0,32 mm w gorna powierzchnie szyny i nie wychodzi od strony palca.
3. Podniesione gniazdo boczne konczy frez w koszu lub najwyzej 0,20 mm w
   podwyzszeniu. Kamienie faktycznie wpuszczone w szynę, takie jak pave,
   kanalowe i eternity, zachowuja kontrolowany przelot oraz minimalny pasek
   metalu po stronie palca.
4. Kazda krapa centralna i boczna powstaje jako jedna ciagla powloka prowadzona
   od dolnej obreczy kosza do czubka. Przegiecie nie jest stykiem osobnych
   walcow ani wynikiem punktowego polaczenia.
5. Zmiana jest identyfikowana jako Build `1.002` i geometria `34`.

Punkty 1-3 zastepuja punkty 1-3 ADR-0007. Pozostale decyzje ADR-0007 nadal
obowiazuja.

## Alternatywy

- Pelny przelot przez szynę: odrzucony, bo rozcina nośnik pod korona.
- Mikrootwor od strony palca: odrzucony, bo nie rozwiazuje oslabienia i nie jest
  potrzebny do oswietlenia kosza otwartego z bokow.
- Boolean union osobnych odcinkow krapy: odrzucony, bo nie gwarantuje przekroju
  po odjeciu frezu i przy zmianie wymiarow kamienia.

## Konsekwencje

- pusta oprawa ma widoczna kieszen gotowa do osadzenia kamienia;
- wewnetrzna powierzchnia pierscionka pozostaje ciagla pod korona;
- krapa ma ciagla droge obciazenia przez przegiecie;
- naprawa i wypychanie kamienia od strony palca nie sa mozliwe w centralnej
  kieszeni bez dodatkowej obrobki warsztatowej;
- fizyczna grubosc po odlewie nadal wymaga potwierdzenia prototypem.

## Niezmienniki i testy

- test 44 mierzy otwarta kieszen, co najmniej 75 procent mostu w sondzie przy
  powierzchni palca i jedna bryle wyrobu;
- test 48 ma kontrole negatywna dwoch walcow z przerwa i wymaga jednej bryly
  oraz przekroju co najmniej 0,16 mm2 na przegieciu prawidlowej krapy;
- test 33 potwierdza, ze kamien wchodzi od gory, siada i nie przelatuje;
- eksport, wycena i oba mirrory korzystaja z tej samej geometrii.

## Synchronizacja

- `src/geometry/ring/build.js` i `chat-api/geometry/ring/build.js`;
- `src/workers/ringGenerator.worker.js`;
- `src/components/calculators/RingConfigurator.jsx`;
- `scripts/test-ring-generator.mjs`;
- dokument zasad geometrii i handoff TASK-005.
