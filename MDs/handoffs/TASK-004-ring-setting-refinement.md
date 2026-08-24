---
task_id: TASK-004
status: review
author: Codex
branch: codex/ring-setting-refinement
base_commit: 394869e8cd61bc54de079ef1c064239121f0e8ec
last_commit: 5d7949a852241e6e5528a788333a6ccf65174ae2
updated: 2026-08-24
---

# Handoff: jubilerskie dopracowanie gniazd i zakucia

## Cel

Ograniczyc metal zaslaniajacy kamienie, wykonac rzeczywiste kieszenie pod
kolety w gornej czesci szyny oraz zachowac otwarte, wykonalne gniazda przy
ciaglej i wygodnej od strony palca szynie.

## Stan przed zmiana

Kasety zachodzily zbyt szeroko na kamien. Krapy trylogii i kuleczki pave byly
za duze wzgledem drobnicy. Podniesione gniazda konczyly sie nad szyna, wiec pod
kolete brakowalo miejsca. Platkowe halo nie mialo czytelnej zewnetrznej
kieszeni, a jego lozyska i zakucia zaslanialy kamienie. Lekka oprawa markizy
zachowywala dodatkowy pret bez funkcji nosnej.

## Zachowanie po zmianie

- zamkniety rant kasety zachodzi promieniowo 0,05-0,08 mm;
- otwarta kaseta i kaboszon zachowuja pelny wlot bez szarej zaslepki;
- centralny i boczne frezy tworza kieszen w gornej czesci szyny;
- od strony palca pozostaje co najmniej 0,55 mm ciaglego metalu;
- promien krap bocznych skaluje sie z kamieniem w zakresie 0,24-0,34 mm;
- kuleczki pave maja promien 0,15-0,20 mm i mniejsze pochylenie po zakuciu;
- krapy kamienia centralnego w halo maja minimalny promien 0,44 mm;
- oba warianty halo maja niskie, otwarte lozyska;
- platkowe halo ma zewnetrzna polkasete i wejscie montazowe od srodka;
- z lekkiej oprawy markizy usunieto poprzeczny pret bez funkcji;
- wersja workera zostala podniesiona z 31 do 32;
- mirror generatora w `chat-api/geometry/` jest zsynchronizowany.

Decyzje zapisano w
`MDs/decisions/ADR-0006-kanon-gniazd-i-zakucia.md`.

## Testy i dowody

| Kontrola | Wynik |
|---|---|
| `node scripts/test-ring-generator.mjs` | pass, 45 sekcji |
| `node scripts/test-ring-pricing.mjs` | pass |
| `npm run sync:pricing` | pass, brak dryfu mirrorow |
| `npm run build` | pass, 97 stron, 0 bledow prerenderu |
| `node scripts/check-emdash.mjs` | pass |
| `git diff --check` | pass |
| Kaseta | otwarta przyjmuje kamien, zakuta trzyma przy 0,14 procent kolizji objetosciowej |
| Halo 1,0-2,4 mm | wlot 104-110 procent srednicy kamienia |
| Pave | zakucie zajmuje 0,281-0,449 procent objetosci kamienia |
| Kieszen w szynie | 100 procent sondy centralnej otwarte, 100 procent paska od strony palca zachowane |
| Platkowe halo | 99 procent sondy zewnetrznej kieszeni, wejscie od srodka otwarte |

Pelny build nadal pokazuje wczesniejsze ostrzezenia o zduplikowanych kluczach
`printabilityCardTitle` i `printabilityCardDesc` w `ToolsStudio.jsx`. Nie sa
zwiazane z tym zadaniem i nie zatrzymuja builda.

## Instrukcja dla recenzenta

1. Otworz kasete nowoczesna i kaboszon z kamieniem oraz bez kamienia.
2. Potwierdz, ze rant zakuty tylko minimalnie przykrywa kamien, a pusty model
   pokazuje otwarty wlot.
3. Obejrzyj od spodu lekki i wzmocniony kosz. Kolety maja wchodzic w kieszen
   gornej czesci szyny, bez otworu od strony palca.
4. Sprawdz markize w lekkim koszu. Pod oprawa nie moze byc poprzecznego preta.
5. W trylogii ustaw male i duze kamienie boczne. Krapy maja rosnac wolniej niz
   kamien i pozostawiac widoczna korone.
6. W halo ustaw drobnice 1,0, 1,3, 1,8 i 2,4 mm. Dla obu rodzajow zakucia
   kamien ma wchodzic z gory, a po wlaczeniu kamieni metal nie moze dominowac.
7. Dla `Platkowych kasetek` potwierdz wejscie od srodka i zewnetrzna kieszen.
8. Sprawdz Halo z pave oraz Owal w halo z pave od boku i od spodu. Gniazda na
   szynie maja byc otwarte, a szyna ciagla.
9. Uruchom test geometrii, test wyceny i pelny build.

## Swiadomie poza zakresem

- Brak fizycznego odlewu i zakucia probki warsztatowej.
- Brak kompensacji konkretnej technologii odlewni.
- Brak zmian interfejsu, poniewaz oba kosze, oba warianty halo i suwaki
  orientacji byly juz dostepne.

## Warunek uznania zadania za gotowe

- Claude Code nie znajduje regresji gniazd, wyceny ani eksportu.
- Artur akceptuje wyglad kaset, pave, obu halo i trylogii.
- Artur samodzielnie integruje branch z `main`.
