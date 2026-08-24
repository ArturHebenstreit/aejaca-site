---
task_id: TASK-007
status: review
author: Codex
branch: codex/precious-metal-casting-service
base_commit: 74c68903789c9b451208e7d5b547e71b6b0a4e73
last_commit: a47ab21bc9f6c4fbb43eba89ce443903db3abab0
updated: 2026-08-24
---

# Handoff: Build 1.006 - odlew z metali szlachetnych

## Cel

Dodać do sklepu AEJaCA sTuDiO usługę odlewu srebra i złota w trzech
wariantach: z gotowego wzorca, z modelu 3D oraz od pomysłu klienta.

## Zakres

- nowa karta produktu ze zdjęciem, opisem i trzema wariantami;
- wybór Ag 800/925 oraz Au 9k/14k/18k/24k;
- kruszec AEJaCA albo powierzony;
- automatyczna wycena przesłanego modelu 3D z rzeczywistej objętości;
- rezerwa procesowa 12% w automatycznej kalkulacji;
- automatyczny limit modelu 24 x 24 x 35 mm po orientacji i wybranej skali;
- suwak skali z automatycznym dopasowaniem modelu do limitu odlewni oraz ostrzeżeniem o zmianie grubości ścianek, krap i kanałów;
- komunikaty przekroczenia limitu w języku PL, EN albo DE zgodnym z wybraną wersją strony;
- komunikaty brakujących parametrów i wyceny indywidualnej w języku wybranym na stronie;
- powrót do skali oryginalnej po automatycznym dostosowaniu, z ponownym skierowaniem ponadlimitowego modelu do oceny;
- kliknięcie i przeciąganie modeli STL, OBJ, 3MF, STEP oraz STP, zgodnie z kalkulatorem i parserem serwera;
- bieżąca cena konfiguracji w nagłówku karty oraz mniejsza cena „od” poniżej;
- skorygowana cena startowa 220 zł: czas pełnego wykonania pierścionka nie jest już dublowany z przygotowaniem wzorca;
- wycena ręczna wzorca fizycznego, realizacji od pomysłu i materiału powierzonego;
- trzy poziomy wykończenia: surowy, oczyszczony i jubilerski;
- informacja o typowym ubytku 5-8% albo 10-15% dla materiału powierzonego;
- aktualizacja regulaminu, SEO, mapy witryny, kontekstu asystenta i dokumentacji marki;
- Build 1.006.

## Testy i dowody

| Kontrola | Polecenie | Wynik |
|---|---|---|
| Silnik odlewu | `npm run test:casting` | pass |
| Mirrory cenowe | `node scripts/sync-pricing.mjs --check` | pass |
| Obrazy sklepu | `node scripts/check-shop-images.mjs` | pass |
| Backend | `node scripts/check-undefined-calls.mjs` | pass |
| ESLint undefined | `npm run lint:undef` | pass |
| Mapa sklepu | `node scripts/sync-sitemap-shop.mjs --check` | pass po synchronizacji |
| Skala, formaty i język | `npm run test:casting` | pass, w tym powrót do oryginału, formaty i komunikat EN |
| Pełny build | `npm run build` | pass, 98 stron, 0 błędów prerenderu |

## Ryzyka i otwarte punkty

- ADR-0010 pozostaje w statusie draft do akceptacji Artura;
- data wejścia w życie regulaminu musi zostać sprawdzona w dniu scalenia;
- limit automatyczny jest celowo konserwatywny i nie wyklucza większego odlewu po ocenie ręcznej; jednolite skalowanie nie oznacza automatycznej akceptacji minimalnych przekrojów;
- kontrola modelu i poprawna cena nie zastępują próby wydruku oraz kontroli warsztatowej;
- białe i różowe złoto korzystają obecnie z wyboru próby, bez osobnego wyboru koloru stopu w tej karcie.

## Instrukcja dla recenzenta

1. Otwórz `/shop/service/precious_metal_casting/` i sprawdź kartę oraz zdjęcie.
2. Przełącz trzy warianty i oba źródła kruszcu.
3. Potwierdź, że tylko model 3D z kruszcem AEJaCA przechodzi do wiążącej ceny.
4. Wgraj mały zamknięty STL i sprawdź masę, rezerwę 12% oraz wykończenie.
5. Wgraj model przekraczający 24 x 24 x 35 mm, użyj „Dostosuj możliwości techniczne”, wróć przyciskiem „Oryginał” i sprawdź oba stany.
6. Potwierdź, że komunikat brakujących parametrów i odmowy jest angielski w EN oraz niemiecki w DE.
7. Wybierz i przeciągnij po jednym pliku STL, OBJ, 3MF, STEP i STP.
8. Zmieniaj stop, wykończenie, liczbę sztuk i opakowanie; cena w nagłówku ma odpowiadać kwocie konfiguratora, a „Cena od 220 zł” pozostaje mała poniżej.
9. Sprawdź treść o materiale powierzonym w PL, EN i DE.

## Warunek uznania zadania za gotowe

- pełny build przechodzi;
- Claude Code nie znajduje regresji wyceny, koszyka ani obsługi plików;
- Artur akceptuje ADR-0010 i zdjęcie produktu;
- Artur samodzielnie integruje branch z `main`.
