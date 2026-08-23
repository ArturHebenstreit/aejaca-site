---
status: accepted
owner: Artur
date: 2026-08-23
deciders: Artur
supersedes: null
related:
  - PROJECT_RULES.md
  - MDs/WORKBOARD.md
  - MDs/HANDOFF_TEMPLATE.md
---

# ADR-0001: Wspolpraca Claude Code i Codex

## Kontekst

Dwa modele moga pracowac nad repozytorium w tym samym czasie. Wspolny katalog
roboczy, niejawne zalozenia z rozmow i kopiowanie regul do instrukcji kazdego
modelu tworza konflikty oraz rozjazd wiedzy.

## Decyzja

- Kazdy model pracuje w osobnym worktree i na osobnej galezi.
- `PROJECT_RULES.md` jest wspolnym zrodlem regul biznesowych i jakosciowych.
- `CLAUDE.md` oraz `AGENTS.md` zawieraja instrukcje narzedziowe i wskazuja wspolne reguly.
- `MDs/WORKBOARD.md` nadaje czasowa wlasnosc plikow.
- Decyzje trwale zapisujemy jako ADR.
- Stan zadania przekazujemy przez wersjonowany handoff.
- Implementacje przeglada model, ktory nie byl ich autorem.

## Alternatywy

- Jeden wspolny worktree: odrzucony, bo procesy moga zmieniac sobie pliki i branch.
- Przekazywanie zalozen tylko w czacie: odrzucone, bo wiedza nie jest wersjonowana.
- Dwie kopie regul w `CLAUDE.md` i `AGENTS.md`: odrzucone, bo kopie sie rozjada.

## Konsekwencje

- Rownolegla praca wymaga krotkiego wpisu do workboardu.
- Zmiany architektoniczne maja widoczny koszt dokumentacyjny.
- Konflikty sa wykrywane przed edycja, a nie podczas scalania.
- Drugi model dostaje testowalny stan pracy bez odtwarzania historii rozmowy.

## Niezmienniki i testy

- Jeden aktywny wlasciciel na plik.
- Kazde zadanie w stanie `review` ma handoff.
- Kazda zaakceptowana decyzja wysokiego ryzyka ma ADR i kontrole negatywna.
- Przed integracja diff przeglada model niebedacy autorem.

## Synchronizacja

Zmiana tego procesu wymaga aktualizacji `PROJECT_RULES.md`, `AGENTS.md`,
`CLAUDE.md`, `MDs/README.md` i szablonu handoffu.
