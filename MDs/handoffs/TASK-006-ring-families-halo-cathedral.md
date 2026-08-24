---
task_id: TASK-006
status: review
author: Codex
branch: codex/ring-ux-signet-refinement
base_commit: 6156043b7ba0e7cf70c59425844983e400e06ba5
last_commit: eae35fe2299a5d88a1e98244126450a79343189f
updated: 2026-08-24
---

# Handoff: Build 1.003 - halo, trylogia i rodziny ramion

## Cel

Usunac kolizje wspornika galerii z pierwszym kamieniem, rozszerzyc halo o
szesc ksztaltow, udostepnic 1 i 2 kamienie na strone oraz dodac konfigurowalne
rodziny roslinne, zawijane i otwarte ramiona katedralne.

## Zakres

- `halo.shape`: okrag, prostokat, kwadrat, oktagon, szesciokat i serce;
- liczba kamieni bocznych 0-5 na strone;
- dodatkowa obwiednia galerii w odsunieciu pierwszego kamienia;
- motywy roslinne: pnącze, liscie i rozeta, gestosc i relief;
- konstrukcje zawijane: otwarta, krzyzowana, dzielona z pave i kwiatowa;
- katedra: luk, podwojny luk, trojlisc oraz woluta, lisc i plecionka;
- piec nowych modeli startowych i Build 1.003, geometria 35.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Geometria | `node scripts/test-ring-generator.mjs` | pass, 49 sekcji |
| Wycena | `node scripts/test-ring-pricing.mjs` | pass |
| Mirror | `npm run sync:pricing` i kontrola builda | pass |
| Tekst i diff | `node scripts/check-emdash.mjs`, `git diff --check` | pass |
| Build | `npm run build` | pass |

## Ryzyka i otwarte pytania

- prowadnice halo o ostrych naroznikach trzeba ocenic na wydruku pod katem
  polerowania i odleglosci miedzy tulejkami;
- relief roslinny, koncowki ramion zawijanych i grawer katedry wymagaja proby
  z konkretna zywica oraz kompensacja odlewni;
- poprawna topologia i jedna bryla nie zastepuja fizycznej proby zakuwania.

## Instrukcja dla recenzenta

1. Obejrzyj pierwszy kamien przy koronie w pave i upewnij sie, ze wspornik
   galerii nie wchodzi w jego pawilon.
2. Przelacz wszystkie szesc ksztaltow halo z kamieniami i bez kamieni.
3. Zbuduj trylogie z jednym oraz uklad z dwoma kamieniami na strone.
4. Obejrzyj piec nowych presetow z gory, z boku i od strony palca.
5. W katedrze sprawdz wszystkie wyciecia oraz ornamenty i potwierdz ciagly
   most szyny pod otworem.
6. Potwierdz Build `1.003`, geometrie `35`, testy i pelny build.

## Warunek uznania zadania za gotowe

- wszystkie testy i build przechodza;
- Claude Code nie znajduje regresji geometrii, wyceny ani mirrorow;
- Artur akceptuje sylwetki nowych rodzin po ocenie podgladu;
- fizyczna proba poprzedza oznaczenie modeli jako gotowych do produkcji;
- Artur samodzielnie integruje branch z `main`.
