---
task_id: TASK-005
status: review
author: Codex
branch: codex/ring-ux-signet-refinement
base_commit: c167a3b2c432396f1cdeae47f3bb8d24bbf63861
last_commit: 8180519918346e2f8c57560faa28eaf1233c5806
updated: 2026-08-24
---

# Handoff: otwarte gniazda, ergonomia i sygnety

## Cel

Usunac metalowe zaslepki z pustych gniazd, lepiej odslonic kamienie, pokazac
jednoznaczna wersje podgladu i nadac sygnetom zintegrowana, masywna sylwetke.

## Stan przed zmiana

Kasety i kaboszony byly optycznie zbyt ciezkie, a slepe frezy pozostawialy
szare dno. Wszystkie proby zlota korzystaly z jednego tonu. Kreator nie
pokazywal numeru buildu, mial male cele sterujace i dluga liste bez skrotow.
Ramiona sygnetow byly zbyt waskie wzgledem tarczy.

## Zalozenia i decyzje

- ADR-0007 zastepuje punkt 2 ADR-0006 zgodnie z jawna decyzja Artura;
- dolny wylot nie kopiuje calego wlotu: ma zachowac nosnosc szyny;
- geometria, mirror wyceny i worker maja jedna wersje parametrow;
- ergonomia korzysta z celow 44 px, skrotow sekcji i przyklejonego podgladu.

## Zakres

### Zmienione pliki

- `src/geometry/ring/build.js`, `params.js`: kasety, przeloty i sygnety;
- `src/data/castingAlloys.js`: wyglad konkretnych stopow;
- `RingConfigurator.jsx`, `RingPreview3D.jsx`: UX, build i render metalu;
- `scripts/test-ring-generator.mjs`: kontrakty regresyjne;
- mirrory `chat-api/`: identyczna geometria i dane stopow;
- ADR, dziennik geometrii i niniejszy handoff.

### Swiadomie poza zakresem

- fizyczny odlew i ocena komfortu wylotow na palcu;
- dekoracje bokow sygnetow i grawer wykonywany przez klienta;
- zmiana receptur stopow konkretnej odlewni.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Test bledu przed poprawka | sekcje 44, 46 i 47 | fail zgodnie z oczekiwaniem |
| Test po poprawce | `node scripts/test-ring-generator.mjs` | pass, lacznie z przelotami centralnymi i bocznymi, zakuciem oraz trzema ksztaltami sygnetu |
| Wycena | `node scripts/test-ring-pricing.mjs` | pass |
| Mirror | `npm run sync:pricing` | pass |
| Jakosc tekstu i diff | `node scripts/check-emdash.mjs`, `git diff --check` | pass |
| Kontrola interfejsu | przelaczenie Ring -> Signet, kolejnosc sekcji, cele 44 px, build | pass; lokalny podglad WebAssembly ma blad serwera deweloperskiego opisany ponizej |
| Build | `npm run build` | pass, 97 stron, 0 bledow |

## Ryzyka i otwarte pytania

- przeloty trzeba ocenic na wydruku i odlewie, szczegolnie przy cienkiej szynie;
- tony metalu sa wizualnym przyblizeniem i zaleza od ekranu oraz oswietlenia.
- lokalny serwer Vite zwraca dla WebAssembly dokument HTML zamiast modulu; pelny
  build przechodzi, ale wizualny przeglad geometrii nalezy wykonac na wdrozonym
  branchu albo po poprawieniu obslugi WASM w srodowisku deweloperskim.

## Instrukcja dla recenzenta

1. Podwaz minimalny przekroj szyny przy najwiekszym kamieniu bocznym.
2. Obejrzyj kasete i kaboszon z kamieniem i bez niego, takze od strony palca.
3. Sprawdz trzy proby zoltego zlota, srebro i biale zloto w tym samym ujeciu.
4. Porownaj sygnet owalny, prostokatny i poduszkowy z referencjami Artura.
5. Potwierdz build `1.001`, geometrie 33 i dzialanie skrotow na telefonie.
6. Uruchom test geometrii, test wyceny oraz pelny build.

## Warunek uznania zadania za gotowe

- wszystkie testy i build przechodza;
- Claude Code nie znajduje regresji nosnosci ani wyceny;
- Artur akceptuje wyglad kaset, stopow i sygnetow;
- Artur samodzielnie integruje branch z `main`.
