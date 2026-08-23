---
task_id: TASK-001
status: review
author: Codex
branch: codex/model-coordination-layer
base_commit: 8cca1576734a11dcce0e257e636961ff40ced286
last_commit: 09a18479647277e648cc074350c48513970dbf91
updated: 2026-08-23
---

# Handoff: wspolna warstwa komunikacji modeli

## Cel

Claude Code i Codex korzystaja z jednego zrodla regul, osobnych obszarow pracy,
wersjonowanych decyzji i sprawdzalnego formatu przekazania zadania.

## Stan przed zmiana

Repozytorium mialo aktywny `CLAUDE.md` i starsza, rozniaca sie kopie
`MDs/CLAUDE.md`, ale nie mialo instrukcji dla Codex, hierarchii dokumentow,
rejestru wlasnosci plikow ani formatu przekazania pracy.

## Zalozenia i decyzje

- Wspolne reguly nie sa kopiowane do instrukcji obu modeli.
- `PROJECT_RULES.md` jest wspolnym zrodlem zasad biznesowych i jakosciowych.
- Instrukcje narzedziowe pozostaja osobno w `CLAUDE.md` i `AGENTS.md`.
- Rownolegla praca uzywa osobnych worktree i galezi.
- Artur jest jedynym integratorem; modele nie scalaja do `main` ani nie otwieraja pull requestow z wlasnej inicjatywy.
- Rezerwacja zadania w workboardzie jest jedynym dozwolonym zapisem modelu bezposrednio do `main`.
- Trwale decyzje maja format ADR.
- Decyzja procesu zostala zapisana w `ADR-0001-wspolpraca-modeli.md`.

## Zakres

### Zmienione pliki

- `CLAUDE.md`: wejscie do wspolnego protokolu.
- `MDs/CLAUDE.md`: oznaczenie starej kopii jako historycznej.
- `AGENTS.md`: instrukcja pracy Codex.
- `PROJECT_RULES.md`: wspolne niezmienniki i bramka jakosci.
- `MDs/README.md`: mapa oraz hierarchia dokumentacji.
- `MDs/WORKBOARD.md`: wlasnosc plikow i kolejka review.
- `MDs/HANDOFF_TEMPLATE.md`: format przekazania pracy.
- `MDs/decisions/README.md`: cykl zycia ADR.
- `MDs/decisions/ADR-0001-wspolpraca-modeli.md`: zaakceptowana decyzja procesu.

### Swiadomie poza zakresem

- Nie zmieniono kodu produktu ani wdrozenia.
- Nie przepisano historycznych planow i audytow do nowego formatu metadanych.
- Nie utworzono automatycznego walidatora workboardu i handoffow.

## Testy i dowody

| Kontrola | Metoda | Wynik |
|---|---|---|
| Zakaz dlugich myslnikow | `node scripts/check-emdash.mjs` | pass |
| Biale znaki i konflikty patcha | `git diff --check` | pass |
| Brak podwojnych regul | reczny przeglad `CLAUDE.md` i `PROJECT_RULES.md` | pass |
| Kod produktu | `git diff --stat main -- src chat-api admin scripts` | brak zmian |
| Testy produktu | nie dotyczy, tylko dokumentacja procesu | nie uruchomiono ponownie |

## Ryzyka i otwarte pytania

- Workboard jest koordynacja umowna, nie blokada techniczna.
- Claude Code powinien sprawdzic, czy dodatkowy protokol nie koliduje z jego routingiem agentow.
- Po pierwszych trzech zadaniach warto skrocic pola, ktore nie daja wartosci.

## Instrukcja dla recenzenta

1. Sprobuj znalezc sprzecznosc miedzy `PROJECT_RULES.md`, `CLAUDE.md` i dokumentami domenowymi.
2. Sprawdz, czy handoff wystarcza do wznowienia pracy bez historii rozmowy.
3. Sprawdz, czy hierarchia nie nadaje staremu planowi wyzszego priorytetu niz kodowi i decyzjom.

## Warunek uznania zadania za gotowe

- Claude Code potwierdza, ze odczytuje wspolny protokol.
- Nie ma dwoch aktywnych kopii tej samej instrukcji.
- Nowe zadanie da sie wpisac do workboardu, opisac ADR i przekazac handoffem.
