---
task_id: TASK-003
status: review
author: Codex
branch: codex/ring-production-geometry
base_commit: ca5dbd99bef36bf38e4d1dd0fd762fc1d4842f70
last_commit: df86e40f04be0800e1079c32dea989f51db07831
updated: 2026-08-24
---

# Handoff: produkcyjna geometria kreatora pierscionkow

## Cel

Oddzielic podglad gotowego pierscionka od bryly przeznaczonej do odlewu oraz
odrzucac konfiguracje kamieni, dla ktorych lokalny przekroj szyny nie zapewnia
ciaglosci i technologicznego zapasu metalu.

## Stan przed zmiana

Pole `casting.stones` sterowalo widocznoscia kamieni, domknieciem lapek i
zawartoscia eksportu. Ten sam projekt mogl przez ustawienie podgladu zmienic
metal, mase i plik produkcyjny. Ograniczenia kamieni bocznych korzystaly z
nominalnej szerokosci szyny, mimo ze przy zwezeniu rzeczywisty przekroj w
miejscu gniazda jest mniejszy. Niewykonalne wymiary byly korygowane bez jasnej
informacji dla klienta.

## Decyzje i zachowanie po zmianie

- `casting` buduje metal produkcyjny z otwartymi lapkami i bez bryl kamieni.
- `finishedPreview` buduje wizualizacje gotowego wyrobu i respektuje widocznosc
  kamieni.
- `referenceAssembly` zwraca zakuty metal i kamienie jako osobne bryly.
- Wycena wiazaca oraz produkcyjne STL i 3MF korzystaja jawnie z `casting`.
- Paczka eksportu zawiera produkcyjny STL, produkcyjny 3MF i referencyjny 3MF.
- Lokalna granica kamienia uwzglednia sylwetke szyny i wszystkie pozycje
  kamieni bocznych. Niewykonalny projekt jest odrzucany zamiast przycinany.
- Interfejs korzysta z tej samej granicy, wyjasnia redukcje zakresu i zachowuje
  ostatnia poprawna wartosc, jezeli nie miesci sie nawet minimum.
- Presety `pave` i `diana` maja prosta szyne, aby zachowac swoje przyjete
  srednice kamieni.
- Wylaczenie kamieni pokazuje dokladnie produkcyjny metal `casting`, z
  otwartymi lapkami, koszami i wylotami gniazd.
- Kamien centralny i kamienie boczne maja osobna orientacje. Dla ksztaltow
  kierunkowych dostepne sa cztery kierunki, a dla symetrycznych ustawienie
  w poprzek albo wzdluz szyny.
- Obrot obejmuje jednoczesnie kamien, gniazdo, korone lub kosz oraz zakucia.
  Walidator liczy miejsce z obroconego obrysu, nie z nominalnej srednicy.

Decyzje sa zapisane w
`MDs/decisions/ADR-0005-tryby-modelu-i-walidacja-geometrii.md`.

## Zakres

- generator i parametry: `src/geometry/ring/` oraz mirror
  `chat-api/geometry/`;
- wycena i eksport: `chat-api/orders.js`, `chat-api/ringExport.js`;
- podglad i interfejs: worker, `RingConfigurator.jsx`, `RingPriceBox.jsx`;
- presety i testy geometrii oraz wyceny;
- ADR, dziennik geometrii, workboard i ten handoff.

## Testy i dowody

| Kontrola | Wynik |
|---|---|
| `node scripts/test-ring-generator.mjs` | pass, 39 sekcji, w tym otwarte gniazda, orientacja, tryby, eksport i negatywne ograniczenia lokalne |
| `node scripts/test-ring-pricing.mjs` | pass |
| `npm run sync:pricing` | pass, mirrory geometrii zsynchronizowane |
| `npm run build:client` | pass; pozostaja wczesniejsze ostrzezenia o duplikatach kluczy w `ToolsStudio.jsx` |
| Integracja `ringFiles` | pass, referencyjny 3MF ma osobne obiekty metalu i kamieni |
| Pelny `npm run build` | pass na czystym obrazie brancha, 97 stron, 0 bledow |
| `node scripts/check-emdash.mjs` | pass |
| `git diff --check` | pass |
| Niezalezna recenzja agentowa | pass po poprawie wyscigu workera, kolejnosci halo, masy, nazw i zwalniania pamieci |

## Swiadomie poza zakresem

- Nie dodano automatycznej kompensacji skurczu do nominalnego pliku.
- Nie przeprowadzono fizycznego odlewu ani pomiaru po odlaniu i obrobce.
- Nie zastapiono profilu procesu odlewniczego danymi konkretnej odlewni.
- Nie zmieniano ogolnej sylwetki zwezanej szyny dla wzorow, ktore nie maja
  niewykonalnych kamieni bocznych.
- Build w glownym worktree zatrzymuje niezwiazany, nieledzony duplikat
  `src/shop/orderStatusAccess 2.js`. Pelna kontrola zostala dlatego wykonana na
  czystym obrazie brancha z nalozonym wylacznie patchem TASK-003.

## Instrukcja dla recenzenta

1. Porownaj metal `casting` przy wlaczonej i wylaczonej widocznosci kamieni.
2. Potwierdz, ze produkcyjny STL i 3MF nie zawieraja kamieni i maja otwarte
   lapki, a 3MF referencyjny zachowuje osobne obiekty.
3. Sprawdz przypadek negatywny: channel 2,3 mm, szyna 3,2 mm, `tapered`.
4. Sprawdz zachowanie suwaka po zmianie taperu i szerokosci szyny.
5. Potwierdz zgodnosc wyceny z objetoscia produkcyjnego pliku.
6. Uruchom oba testy pierscionkow i pelny build.
7. W UI ustaw gruszke centralna kolejno w poprzek i wzdluz oraz gruszki
   boczne ze szpicem do korony i od korony.
8. Wylacz kamienie i potwierdz, ze zamiast szarych plyt widac otwarte gniazda.

## Warunek uznania zadania za gotowe

- Claude Code nie znajduje regresji geometrii, eksportu ani wyceny.
- Wszystkie kontrole z tabeli przechodza.
- Artur samodzielnie integruje branch z `main`.
