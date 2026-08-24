---
task_id: TASK-005
status: review
author: Codex
branch: codex/ring-ux-signet-refinement
base_commit: c167a3b2c432396f1cdeae47f3bb8d24bbf63861
last_commit: a406e7a13d6092a2f4fd9774dabfc3cba0bddcbb
updated: 2026-08-24
---

# Handoff: Build 1.002 - ciagla szyna, jednolite krapy i otwarte gniazda

## Cel

Usunac metalowe zaslepki z pustych gniazd bez przecinania szyny pod korona,
zbudowac krapy jako jedna bryle od kosza do czubka, lepiej odslonic kamienie,
pokazac jednoznaczna wersje podgladu i nadac sygnetom zintegrowana sylwetke.

## Stan przed zmiana

Build 1.001 usunal szare dno przez przelot centralnych i podniesionych bocznych
gniazd. Przelot przecinal jednak szynę pod korona. Krapy centralne i boczne
powstawaly z osobnej nogi i gornej czesci, dlatego po odjeciu frezu mogly
pozostac rozdzielone w punkcie przegiecia.

## Zalozenia i decyzje

- ADR-0008 zastepuje punkty 1-3 ADR-0007 zgodnie z jawna decyzja Artura;
- centralne i podniesione boczne gniazda sa otwartymi od gory, slepymi
  kieszeniami, a szyna pozostaje ciagla od strony palca;
- przelot pozostaje tylko dla kamieni faktycznie wpuszczonych w szynę;
- krapa jest jedna powloka `tubeAlong` od dolnej obreczy do czubka;
- geometria, mirror wyceny i worker maja jedna wersje parametrow;
- ergonomia korzysta z celow 44 px, skrotow sekcji i przyklejonego podgladu.

## Zakres

### Zmienione pliki

- `src/geometry/ring/build.js`: slepe kieszenie i jednolite krapy;
- `src/data/castingAlloys.js`: wyglad konkretnych stopow;
- `RingConfigurator.jsx`, `RingPreview3D.jsx`: UX, build i render metalu;
- `scripts/test-ring-generator.mjs`: kontrakty regresyjne;
- mirrory `chat-api/`: identyczna geometria i dane stopow;
- ADR-0008, dziennik geometrii i niniejszy handoff.

### Swiadomie poza zakresem

- fizyczny odlew i ocena komfortu wylotow na palcu;
- dekoracje bokow sygnetow i grawer wykonywany przez klienta;
- zmiana receptur stopow konkretnej odlewni.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Test bledu przed poprawka | sekcje 44, 46 i 47 | fail zgodnie z oczekiwaniem |
| Test po poprawce | `node scripts/test-ring-generator.mjs` | pass, 48 sekcji, w tym otwarte kieszenie, ciagla szyna i jednolite krapy |
| Wycena | `node scripts/test-ring-pricing.mjs` | pass |
| Mirror | `npm run sync:pricing` | pass |
| Jakosc tekstu i diff | `node scripts/check-emdash.mjs`, `git diff --check` | pass |
| Test przekroju krapy | sekcja 48 z kontrola negatywna | pass, jedna bryla, 0,296-0,297 mm2 w przegieciu |
| Test szyny pod korona | sekcja 44 | pass, 100 procent mostu w sondzie kasety i kaboszonu, trylogia jedna bryla |
| Build | `npm run build` | pass, 97 stron, 0 bledow |

## Ryzyka i otwarte pytania

- kieszenie i przekroj krap trzeba ocenic na wydruku oraz odlewie;
- tony metalu sa wizualnym przyblizeniem i zaleza od ekranu oraz oswietlenia.
- pelny build przechodzi, ale poprawna topologia nie zastepuje proby zakuwania
  na fizycznym prototypie.

## Instrukcja dla recenzenta

1. Obejrzyj kasete i kaboszon bez kamienia od gory oraz od strony palca.
2. Potwierdz, ze szyna nie ma szczeliny pod centralnym ani bocznym koszem.
3. Obejrzyj przegiecia krap w trylogii i oprawie centralnej przy maksymalnym
   powiekszeniu.
4. Sprawdz trzy proby zoltego zlota, srebro i biale zloto w tym samym ujeciu.
5. Potwierdz Build `1.002`, geometrie 34 i dzialanie skrotow na telefonie.
6. Uruchom test geometrii, test wyceny oraz pelny build.

## Warunek uznania zadania za gotowe

- wszystkie testy i build przechodza;
- Claude Code nie znajduje regresji nosnosci ani wyceny;
- Artur akceptuje wyglad kaset, stopow i sygnetow;
- Artur samodzielnie integruje branch z `main`.
